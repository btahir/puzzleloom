import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  generate,
  generateDetailed,
  validate,
  readPuzzle,
  parseWords,
  occurrences,
  directionsFor,
  blockedWords,
  explainIssues,
  encode,
  decode,
  variants,
  letters,
  puzzleSchema,
  PuzzleError,
  BLOCKLIST,
  TYPES,
  type Puzzle,
} from "../packages/core/src/index";
import { W15, W25, W40, KINDER, W15GO } from "./fixtures/lists";
import { LEGACY_LINKS } from "./fixtures/legacy-links";

const tryGenerate = (input: Parameters<typeof generate>[0]) => {
  try {
    return generate(input);
  } catch (e) {
    if (e instanceof PuzzleError) return e;
    throw e;
  }
};
const GARDEN =
  "GARDEN FLOWER WATER EARTH LEAF STEM ROOT SEED SUN GROW PLANT RAIN SOIL GREEN PETAL BLOOM FRUIT BRANCH TREE GRASS STONE BIRD NEST WORM CLOUD LIGHT SHADE POND RIVER FIELD FOREST PATH APPLE PEACH BERRY HERB MOSS FERN CLOVER MEADOW".split(
    " ",
  );

describe("offensive-word blocklist", () => {
  it("is a written English/Spanish/French/German list of 3+ letter A-Z words", () => {
    expect(BLOCKLIST.length).toBeGreaterThanOrEqual(100);
    expect(BLOCKLIST.length).toBeLessThanOrEqual(300);
    for (const w of BLOCKLIST) expect(w).toMatch(/^[A-Z]{3,}$/);
    for (const w of ["SLUT", "RAPE", "COCK", "FAG", "FUCK", "SHIT", "MERDE"])
      expect(BLOCKLIST).toContain(w);
  });
  it("never lets fill spell a blocked word, in any direction, across 3000 seeds", () => {
    const lists = [W15, W25, W40, KINDER, W15GO].map((t) =>
      parseWords(t).entries.map((e) => e.word),
    );
    let made = 0;
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4294967295 }),
        fc.integer({ min: 0, max: lists.length - 1 }),
        fc.constantFrom("easy", "medium", "hard"),
        (seed, which, difficulty) => {
          const words = lists[which];
          const p = generate({
            type: "word-search",
            words: words.join("\n"),
            seed,
            options: { difficulty },
          });
          made++;
          expect(blockedWords(p.grid, p.placements, p.entries)).toEqual([]);
        },
      ),
      { numRuns: 3000 },
    );
    expect(made).toBe(3000);
  }, 180000);
  it("agrees with a brute-force scan of all eight directions", () => {
    const words = parseWords(W25).entries.map((e) => e.word);
    const inUserWords = (w: string) =>
      words.some((u) => u.includes(w) || [...u].reverse().join("").includes(w));
    const outside = BLOCKLIST.filter((w) => !inUserWords(w));
    for (let seed = 0; seed < 25; seed++) {
      const p = generate({
        type: "word-search",
        words: W25,
        seed,
        options: { difficulty: "hard", size: 22 },
      });
      for (const w of outside)
        expect(occurrences(p.grid, w), `${w} at seed ${seed}`).toHaveLength(0);
    }
  });
  it("covers the crossings between the user's own words", () => {
    // Letters of two placed words must not spell a blocked word either.
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.uniqueArray(
          fc.constantFrom("PASTA", "SPRING", "TOOLS", "STUDENT", "CAKE", "SUN"),
          { minLength: 3, maxLength: 6 },
        ),
        (seed, words) => {
          const p = generate({
            type: "word-search",
            words: words.join("\n"),
            seed,
            options: { difficulty: "hard", size: 10 },
          });
          expect(blockedWords(p.grid, p.placements, p.entries)).toEqual([]);
        },
      ),
      { numRuns: 300 },
    );
  });
  it("flags a grid that spells a blocked word, reversed or diagonal, and the CLI check agrees", () => {
    const base = generate({ type: "word-search", seed: 5 });
    const size = base.grid.length;
    const plant = (word: string, dx: number, dy: number) => {
      const q = structuredClone(base);
      // wipe a clean corner area, then write the blocked word over fill cells
      const chars = letters(word);
      const x0 = dx < 0 ? size - 1 : 0,
        y0 = dy < 0 ? size - 1 : 0;
      // find a start whose cells are not part of any placement
      const used = new Set(
        q.placements.flatMap((pl) =>
          letters(pl.word).map(
            (_, i) => `${pl.x + pl.dx * i},${pl.y + pl.dy * i}`,
          ),
        ),
      );
      for (let y = y0; y >= 0 && y < size; y += dy || 1)
        for (let x = x0; x >= 0 && x < size; x += dx || 1) {
          const cells = chars.map((_, i) => [x + dx * i, y + dy * i]);
          if (
            cells.every(
              ([cx, cy]) =>
                cx >= 0 &&
                cy >= 0 &&
                cx < size &&
                cy < size &&
                !used.has(`${cx},${cy}`),
            )
          ) {
            cells.forEach(([cx, cy], i) => (q.grid[cy][cx] = chars[i]));
            return q;
          }
        }
      throw new Error("no room");
    };
    for (const [word, dx, dy] of [
      ["SLUT", 1, 0],
      ["TULS".split("").reverse().join(""), 0, 1], // SLUT spelled upward
      ["RAPE", 1, 1],
      ["COCK", -1, 1],
      ["FAG", -1, 0],
    ] as const) {
      const q = plant(word, dx, dy);
      const report = validate(q);
      expect(report.valid, word).toBe(false);
      expect(report.errors.join(" ")).toMatch(/blocked word/);
      // the message does not print the word itself
      expect(report.errors.join(" ")).not.toContain(word);
    }
  });
  it("lets the user's own blocked word and blocked sequences inside their words through", () => {
    // SEX is the user's word (biology list); CLASSIC contains ASS.
    for (let seed = 0; seed < 30; seed++) {
      const p = generate({
        type: "word-search",
        words: "SEX: Biology term\nCLASSIC\nPASSAGE\nHELLO",
        seed,
        options: { difficulty: "hard" },
      });
      expect(validate(p).errors).toEqual([]);
    }
  });
});

describe("crossword auto sizing", () => {
  const lists: [string, string][] = [
    ["garden 10", GARDEN.slice(0, 10).join("\n")],
    ["garden 15", GARDEN.slice(0, 15).join("\n")],
    ["garden 25", GARDEN.slice(0, 25).join("\n")],
    ["garden 40", GARDEN.join("\n")],
    ["long 15", W15],
    ["long 25", W25],
    ["long 40", W40],
  ];
  it.each(lists)(
    "%s succeeds for every seed with default settings",
    (_, words) => {
      for (let seed = 0; seed < 40; seed++) {
        const p = generate({ type: "crossword", words, seed });
        expect(validate(p).errors).toEqual([]);
        const w = p.grid[0].length,
          h = p.grid.length;
        expect(p.options.autoSize).toBe(true);
        expect(p.options.size).toBe(Math.max(8, w, h));
        expect(Math.max(w, h)).toBeLessThanOrEqual(30);
      }
    },
    60000,
  );
  it("returns a compact, roughly square layout", () => {
    const aspects: number[] = [];
    for (let seed = 0; seed < 30; seed++) {
      const p = generate({ type: "crossword", words: W25, seed });
      const w = p.grid[0].length,
        h = p.grid.length;
      aspects.push(Math.max(w, h) / Math.min(w, h));
      expect(w * h).toBeLessThan(25 * 25);
    }
    expect(Math.max(...aspects)).toBeLessThan(1.5);
    // the strip that size 30 used to produce for seed 7 (12 x 29)
    const strip = generate({
      type: "crossword",
      words: GARDEN.slice(0, 25).join("\n"),
      seed: 7,
      options: { size: 30 },
    });
    expect(
      Math.max(strip.grid.length, strip.grid[0].length) /
        Math.min(strip.grid.length, strip.grid[0].length),
    ).toBeLessThan(2);
  });
  it("keeps p95 for 25 words under 500 ms", () => {
    const times: number[] = [];
    for (let seed = 0; seed < 40; seed++) {
      const start = performance.now();
      generate({ type: "crossword", words: W25, seed });
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    expect(times[Math.floor(times.length * 0.95)]).toBeLessThan(500);
  });
  it("respects an explicit size exactly", () => {
    let fit = 0;
    for (let seed = 0; seed < 20; seed++) {
      const r = tryGenerate({
        type: "crossword",
        words: GARDEN.slice(0, 15).join("\n"),
        seed,
        options: { size: 14 },
      });
      if (r instanceof PuzzleError) {
        expect(r.message).toMatch(/14 × 14/);
        continue;
      }
      fit++;
      expect(r.options.size).toBe(14);
      expect(r.options.autoSize).toBe(false);
      expect(Math.max(r.grid.length, r.grid[0].length)).toBeLessThanOrEqual(14);
    }
    expect(fit).toBeGreaterThan(0);
    const tight = tryGenerate({
      type: "crossword",
      words: W40,
      options: { size: 12 },
    });
    expect(tight).toBeInstanceOf(PuzzleError);
  });
  it("treats autoSize: true as automatic even when a size is present", () => {
    const p = generate({
      type: "crossword",
      words: W25,
      options: { size: 8, autoSize: true },
    });
    expect(p.options.autoSize).toBe(true);
    expect(p.options.size).toBeGreaterThan(8);
  });
  it("regenerates class-set variants in automatic mode", () => {
    const p = generate({ type: "crossword", words: W25, seed: 3 });
    const set = variants(p, 8);
    expect(set).toHaveLength(8);
    expect(set.every((q) => q.options.autoSize && validate(q).valid)).toBe(
      true,
    );
  });
  it("does not change scramble and cryptogram sizing fields", () => {
    for (const type of ["scramble", "cryptogram"] as const) {
      const p = generate({ type });
      expect(p.options.autoSize).toBe(false);
      expect(p.options.size).toBe(18);
    }
  });
});

describe("word-search sizing and exactly-once rules", () => {
  it("sizes the grid to the list: 8 short words are small, harder difficulty is smaller", () => {
    const words = "CAT\nDOG\nSUN\nHAT\nBED\nPIG\nFOX\nCOW";
    const sizes = (["easy", "medium", "hard"] as const).map((difficulty) => {
      const p = generate({
        type: "word-search",
        words,
        options: { difficulty },
      });
      expect(p.options.autoSize).toBe(true);
      expect(p.grid).toHaveLength(p.options.size);
      expect(validate(p).errors).toEqual([]);
      return p.options.size;
    });
    expect(Math.max(...sizes)).toBeLessThanOrEqual(11);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(8);
    expect(sizes[2]).toBeLessThanOrEqual(sizes[0]);
    const big = generate({
      type: "word-search",
      words: W40,
      options: { difficulty: "easy" },
    });
    expect(big.options.size).toBeGreaterThan(sizes[0]);
    expect(big.options.size).toBeLessThanOrEqual(30);
  });
  it("respects an explicit word-search size", () => {
    const p = generate({
      type: "word-search",
      words: W15,
      options: { size: 24 },
    });
    expect(p.options.size).toBe(24);
    expect(p.options.autoSize).toBe(false);
    expect(p.grid).toHaveLength(24);
  });
  it("accepts SAW and WAS on easy and medium, explains why hard cannot", () => {
    for (const difficulty of ["easy", "medium"] as const)
      for (let seed = 0; seed < 20; seed++) {
        const p = generate({
          type: "word-search",
          words: "SAW\nWAS\nCAT",
          seed,
          options: { difficulty },
        });
        expect(validate(p).errors).toEqual([]);
      }
    expect(() =>
      generate({
        type: "word-search",
        words: "SAW\nWAS\nCAT",
        options: { difficulty: "hard" },
      }),
    ).toThrow(/backwards/);
    expect(() =>
      generate({ type: "word-search", words: "CAT\nCATERPILLAR" }),
    ).toThrow(/is contained in/);
  });
  it("places two-letter words exactly once on every difficulty", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.constantFrom("easy", "medium", "hard"),
        fc.constantFrom(8, 10, 14, 24),
        (seed, difficulty, size) => {
          const p = generate({
            type: "word-search",
            words: "IS\nAT\nGO\nNO\nTREE",
            seed,
            options: { difficulty, size },
          });
          expect(validate(p).errors).toEqual([]);
          for (const w of ["IS", "AT", "GO", "NO"])
            expect(
              occurrences(p.grid, w, directionsFor(difficulty)),
            ).toHaveLength(1);
        },
      ),
      { numRuns: 400 },
    );
  });
  it("a larger grid never fails more often than a smaller one (kindergarten list)", () => {
    for (const size of [8, 10, 12, 18, 24, 30])
      for (let seed = 0; seed < 25; seed++) {
        const p = generate({
          type: "word-search",
          words: KINDER,
          seed,
          options: { difficulty: "easy", size },
        });
        expect(validate(p).errors).toEqual([]);
      }
  });
  it("is fast for a 16-word list that contains GO", () => {
    const times: number[] = [];
    for (let seed = 0; seed < 20; seed++) {
      const start = performance.now();
      const p = generate({
        type: "word-search",
        words: W15GO,
        seed,
        options: { difficulty: "easy" },
      });
      times.push(performance.now() - start);
      expect(validate(p).errors).toEqual([]);
    }
    expect(Math.max(...times)).toBeLessThan(300);
  });
  it("gives accurate advice when a list really cannot fit", () => {
    const r = tryGenerate({
      type: "word-search",
      words: GARDEN.join("\n"),
      options: { size: 8, difficulty: "easy" },
    });
    expect(r).toBeInstanceOf(PuzzleError);
    const message = (r as PuzzleError).message;
    expect(message).toMatch(/8 × 8/);
    expect(message).toMatch(/larger grid/);
    expect(message).toMatch(/harder difficulty/);
    const hard = tryGenerate({
      type: "word-search",
      words: GARDEN.join("\n"),
      options: { size: 8, difficulty: "hard" },
    });
    expect((hard as PuzzleError).message).not.toMatch(/harder difficulty/);
  });
  it("checks word-search exactly-once over many random lists, sizes and difficulties", () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.uniqueArray(
          fc.constantFrom(...GARDEN, "IS", "AT", "GO", "ZEBRA", "QUILT"),
          {
            minLength: 3,
            maxLength: 14,
          },
        ),
        fc.constantFrom("easy", "medium", "hard"),
        fc.boolean(),
        (seed, words, difficulty, auto) => {
          const r = tryGenerate({
            type: "word-search",
            words: words.join("\n"),
            seed,
            options: { difficulty, ...(auto ? {} : { size: 16 }) },
          });
          if (r instanceof PuzzleError) {
            // only the documented containment rejections are acceptable
            expect(r.message).toMatch(/contained|backwards/);
            return;
          }
          expect(validate(r).errors).toEqual([]);
        },
      ),
      { numRuns: 600 },
    ));
});

describe("word list parsing", () => {
  it("splits at the first delimiter only and keeps the clue verbatim", () => {
    expect(parseWords("RATIO: Compare 3:4 - like a fraction").entries).toEqual([
      { word: "RATIO", clue: "Compare 3:4 - like a fraction" },
    ]);
    expect(
      parseWords("RATIO - Compare 3:4 - like a fraction: really").entries,
    ).toEqual([
      { word: "RATIO", clue: "Compare 3:4 - like a fraction: really" },
    ]);
    expect(parseWords("TIME: 10:30 - 11:00, break").entries[0].clue).toBe(
      "10:30 - 11:00, break",
    );
    expect(parseWords("MOTHER-IN-LAW: A relative").entries[0]).toEqual({
      word: "MOTHERINLAW",
      clue: "A relative",
    });
  });
  it("handles tabs and CSV the same way", () => {
    expect(
      parseWords("RATIO\tCompare 3:4 - like a fraction").entries[0].clue,
    ).toBe("Compare 3:4 - like a fraction");
    // unquoted CSV keeps the rest of the row as typed
    expect(
      parseWords("RATIO,Compare 3:4 - like a fraction, ok").entries[0],
    ).toEqual({
      word: "RATIO",
      clue: "Compare 3:4 - like a fraction, ok",
    });
    // quoted CSV is unquoted, doubled quotes collapse, and a quote inside a field is literal
    expect(
      parseWords('"RATIO","A ""fair"" share, roughly"').entries[0].clue,
    ).toBe('A "fair" share, roughly');
    expect(parseWords('RATIO,The "fair" share').entries[0].clue).toBe(
      'The "fair" share',
    );
    expect(parseWords('"a: b",clue text').entries[0]).toEqual({
      word: "AB",
      clue: "clue text",
    });
    expect(() => parseWords('RATIO,"never closed')).toThrow(/unclosed/);
  });
  it("keeps clue text for any printable clue (property)", () =>
    fc.assert(
      fc.property(
        fc
          .stringMatching(/^[A-Za-z0-9:,.\- ]{1,60}$/)
          .filter((c) => c.trim() === c && c.length > 0),
        (clue) => {
          const entry = parseWords(`WORD: ${clue}`).entries[0];
          expect(entry.clue).toBe(clue);
        },
      ),
      { numRuns: 500 },
    ));
  it("warns about removed characters, skipped lines and duplicates instead of changing words silently", () => {
    const r = parseWords("H2O: Water\n123\nOCEAN\nocean\nIce-cream\nSt. Louis");
    expect(r.entries.map((e) => e.word)).toEqual([
      "HO",
      "OCEAN",
      "ICECREAM",
      "STLOUIS",
    ]);
    expect(r.details.map((d) => d.code)).toEqual([
      "removed-characters",
      "skipped-line",
      "duplicate-word",
    ]);
    expect(r.warnings[0]).toContain("H2O");
    expect(r.warnings[0]).toContain("“2”");
    expect(r.warnings).toContain("Removed duplicate OCEAN.");
    expect(r.warnings[1]).toMatch(/123/);
  });
  it("surfaces the same warnings from generateDetailed, for entries too", () => {
    const made = generateDetailed({
      type: "scramble",
      words: "H2O\nOCEAN\nocean",
    });
    expect(made.warnings.map((w) => w.code)).toEqual([
      "removed-characters",
      "duplicate-word",
    ]);
    expect(made.warnings[0]).toMatchObject({ word: "HO" });
    const viaEntries = generateDetailed({
      type: "scramble",
      entries: [
        { word: "H2O", clue: "Water" },
        { word: "OCEAN", clue: "Big, wet\nplace" },
      ],
    });
    expect(viaEntries.warnings).toHaveLength(1);
    expect(viaEntries.puzzle.entries[1].clue).toBe("Big, wet\nplace");
  });
});

describe("titles", () => {
  it("uses a neutral per-type title for the user's own words", () => {
    const expected = {
      crossword: "Crossword",
      "word-search": "Word search",
      scramble: "Word scramble",
      cryptogram: "Cryptogram",
    } as const;
    for (const type of TYPES) {
      const own = generate({
        type,
        words:
          type === "cryptogram" ? undefined : "GARDEN\nFLOWER\nWATER\nEARTH",
        quote: type === "cryptogram" ? "Keep going." : undefined,
      });
      expect(own.title).toBe(expected[type]);
      expect(generate({ type }).title).toBe(
        `${expected[type]} · In the garden`,
      );
      expect(generate({ type, title: "  My title " }).title).toBe("My title");
    }
    expect(
      generate({ type: "scramble", entries: [{ word: "OCEAN", clue: "" }] })
        .title,
    ).toBe("Word scramble");
  });
});

describe("plain-language errors", () => {
  it("explains an over-long clue, title, instructions and quote", () => {
    expect(() =>
      generate({ type: "crossword", words: `VOLCANO: ${"x".repeat(240)}` }),
    ).toThrow("The clue for VOLCANO is 240 characters; the limit is 200.");
    expect(() =>
      generate({
        type: "scramble",
        entries: [{ word: "VOLCANO", clue: "y".repeat(240) }],
      }),
    ).toThrow("The clue for VOLCANO is 240 characters; the limit is 200.");
    expect(() =>
      generate({ type: "scramble", words: "OCEAN", title: "t".repeat(101) }),
    ).toThrow("The title is 101 characters; the limit is 100.");
    expect(() =>
      generate({
        type: "scramble",
        words: "OCEAN",
        instructions: "i".repeat(301),
      }),
    ).toThrow(/instructions are 301 characters; the limit is 300/);
    expect(() =>
      generate({ type: "cryptogram", quote: "q".repeat(601) }),
    ).toThrow("The quote is 601 characters; the limit is 600.");
  });
  it("never leaks a raw zod dump", () => {
    const bad: Parameters<typeof generate>[0][] = [
      { type: "crossword", options: { size: 99 } },
      { type: "crossword", options: { size: 3 } },
      { type: "crossword", options: { size: 12.5 } },
      { type: "crossword", options: { difficulty: "nightmare" as never } },
      { type: "crossword", options: { givenLetters: 99 } },
      { type: "crossword", seed: -1 },
      { type: "nope" as never },
    ];
    for (const input of bad) {
      const r = tryGenerate(input);
      expect(r).toBeInstanceOf(PuzzleError);
      const message = (r as PuzzleError).message;
      expect(message).not.toMatch(/\[\s*\{|"code"|ZodError|invalid_type/);
      expect(message.length).toBeGreaterThan(10);
    }
    expect(
      (tryGenerate({ type: "crossword", options: { size: 99 } }) as PuzzleError)
        .message,
    ).toBe("Option “size” must be at most 30.");
    expect(
      (
        tryGenerate({
          type: "crossword",
          options: { difficulty: "nightmare" as never },
        }) as PuzzleError
      ).message,
    ).toBe(
      "Option “difficulty” must be one of easy, medium, hard (got “nightmare”).",
    );
  });
  it("validate and readPuzzle describe tampered projects in plain words", () => {
    const p = generate({ type: "crossword", seed: 3 });
    const tampered = structuredClone(p);
    tampered.entries[1].clue = "z".repeat(240);
    tampered.title = "t".repeat(130);
    const report = validate(tampered);
    expect(report.valid).toBe(false);
    expect(report.errors).toContain(
      `The clue for ${p.entries[1].word} is 240 characters; the limit is 200.`,
    );
    expect(report.errors).toContain(
      "The title is 130 characters; the limit is 100.",
    );
    expect(() => readPuzzle(tampered)).toThrow(/characters; the limit is/);
    const err = puzzleSchema.safeParse({
      ...p,
      options: { ...p.options, size: 99 },
    });
    expect(err.success).toBe(false);
    if (!err.success)
      expect(
        explainIssues(err.error, { ...p, options: { ...p.options, size: 99 } }),
      ).toEqual(["Option “size” must be at most 30."]);
  });
});

describe("validator gaps", () => {
  it("checks word-search grid dimensions against options.size", () => {
    const p = generate({ type: "word-search", seed: 9 });
    expect(validate(p).valid).toBe(true);
    const wrongSize = structuredClone(p);
    wrongSize.options.size = p.options.size + 1;
    expect(validate(wrongSize).errors.join(" ")).toMatch(/options say/);
    const ragged = structuredClone(p);
    ragged.grid.pop();
    expect(validate(ragged).valid).toBe(false);
  });
  it("keeps crossword grids inside options.size", () => {
    const p = generate({ type: "crossword", seed: 9 });
    const small = structuredClone(p);
    small.options.size = Math.max(
      8,
      Math.max(p.grid.length, p.grid[0].length) - 1,
    );
    if (Math.max(p.grid.length, p.grid[0].length) > 8)
      expect(validate(small).errors.join(" ")).toMatch(/allows at most/);
  });
  it("checks the cryptogram given-letter count against options.givenLetters", () => {
    const p = generate({
      type: "cryptogram",
      quote: "Small seeds grow into wonderful things.",
      options: { givenLetters: 4 },
    });
    expect(p.given).toHaveLength(4);
    expect(validate(p).valid).toBe(true);
    const fewer = structuredClone(p);
    fewer.given.pop();
    expect(validate(fewer).errors.join(" ")).toMatch(/given letters/);
    const more = structuredClone(p);
    more.options.givenLetters = 6;
    expect(validate(more).errors.join(" ")).toMatch(/given letters/);
    const dup = structuredClone(p);
    dup.given[1] = dup.given[0];
    expect(validate(dup).valid).toBe(false);
    // a quote with fewer distinct letters than requested is fine
    const short = generate({
      type: "cryptogram",
      quote: "Aha!",
      options: { givenLetters: 8 },
    });
    expect(short.given).toHaveLength(2);
    expect(validate(short).valid).toBe(true);
  });
});

describe("backward compatible play links", () => {
  it.each(TYPES)("decodes a %s link made by the previous version", (type) => {
    const old = decode(LEGACY_LINKS[type]);
    expect(old.type).toBe(type);
    expect(old.options.autoSize).toBe(false);
    expect(old.options.size).toBe(18);
    expect(old.seed).toBe(77);
    // and it round-trips unchanged through the current encoder
    expect(decode(encode(old))).toEqual(old);
    // Old grids may spell words the wider blocklist now rejects (this one
    // does): they still open, and only a strict validate() reports them.
    expect(validate(old).errors.filter((e) => !/blocked word/.test(e))).toEqual(
      [],
    );
    expect(validate(old, { blockedWords: false }).errors).toEqual([]);
    expect(readPuzzle(JSON.parse(JSON.stringify(old)))).toEqual(old);
  });
  it("can still make class-set variants from an old project", () => {
    const old = decode(LEGACY_LINKS["word-search"]);
    const set = variants(old, 3);
    expect(set).toHaveLength(3);
    expect(set.slice(1).every((q: Puzzle) => validate(q).valid)).toBe(true);
    expect(set[1].options.size).toBe(18);
  });
});
