import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import {
  generate,
  validate,
  readPuzzle,
  parseWords,
  normalize,
  random,
  shuffle,
  letters,
  occurrences,
  directionsFor,
  encode,
  decode,
  variants,
  DEFAULT_WORDS,
  QUOTES,
  TYPES,
  PuzzleError,
} from "../packages/core/src/index";
const pool = [
  "GARDEN",
  "FLOWER",
  "WATER",
  "EARTH",
  "LEAF",
  "STEM",
  "ROOT",
  "SEED",
  "SUN",
  "GROW",
  "PLANT",
  "RAIN",
  "SOIL",
  "GREEN",
  "PETAL",
  "BLOOM",
  "FRUIT",
  "BRANCH",
  "TREE",
  "GRASS",
  "STONE",
  "BIRD",
  "NEST",
  "WORM",
  "CLOUD",
  "LIGHT",
  "SHADE",
  "POND",
  "RIVER",
  "FIELD",
  "FOREST",
  "PATH",
  "APPLE",
  "PEACH",
  "BERRY",
  "HERB",
  "MOSS",
  "FERN",
  "CLOVER",
  "MEADOW",
];
describe("parser and seeded tools", () => {
  it("parses CSV escaping, tabs, delimiters, headers and duplicates", () => {
    expect(
      parseWords(
        'word,clue\n"café","A warm, quiet place"\nCAFE\ncafé: duplicate\nniño\tChild\nleaf - A green part',
      ),
    ).toEqual({
      entries: [
        { word: "CAFÉ", clue: "A warm, quiet place" },
        { word: "CAFE", clue: "" },
        { word: "NIÑO", clue: "Child" },
        { word: "LEAF", clue: "A green part" },
      ],
      warnings: ["Removed duplicate CAFÉ."],
      details: [
        {
          code: "duplicate-word",
          word: "CAFÉ",
          message: "Removed duplicate CAFÉ.",
        },
      ],
    });
  });
  it("normalizes composed accents and configurable ß", () => {
    expect(normalize("cafe\u0301")).toBe("CAFÉ");
    expect(normalize("niño", { stripAccents: true })).toBe("NINO");
    expect(normalize("Straße")).toBe("STRASSE");
    expect(normalize("Straße", { expandEszett: false })).toBe("STRAẞE");
  });
  it("rejects too short, too long and oversized lists", () => {
    expect(() => parseWords("A")).toThrow(/two/);
    expect(() => parseWords("A".repeat(31))).toThrow(/30/);
    expect(() =>
      parseWords(
        Array.from(
          { length: 41 },
          (_, i) =>
            "WORD" +
            String.fromCharCode(65 + Math.floor(i / 26)) +
            String.fromCharCode(65 + (i % 26)),
        ).join("\n"),
      ),
    ).toThrow(/40/);
  });
  it("has stable PRNG and permutation properties over 1000 cases", () =>
    fc.assert(
      fc.property(
        fc.integer(),
        fc.array(fc.integer(), { maxLength: 30 }),
        (seed, items) => {
          expect(shuffle(items, random(seed)).sort((a, b) => a - b)).toEqual(
            [...items].sort((a, b) => a - b),
          );
          expect(random(seed)()).toBe(random(seed)());
        },
      ),
      { numRuns: 1000 },
    ));
});
describe("puzzle engines", () => {
  it.each(TYPES)(
    "%s matches its committed golden and is reproducible",
    (type) => {
      const expected = JSON.parse(
        readFileSync(new URL(`./golden/${type}.json`, import.meta.url), "utf8"),
      );
      const puzzle = generate({ type, seed: 42 });
      expect(puzzle).toEqual(expected);
      expect(generate({ type, seed: 42 })).toEqual(puzzle);
      expect(validate(puzzle).errors).toEqual([]);
    },
  );
  it("checks crossword connectivity and adjacency across 250 random lists", () => {
    let successes = 0;
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.uniqueArray(fc.constantFrom(...pool), {
          minLength: 5,
          maxLength: 25,
        }),
        (seed, words) => {
          try {
            const p = generate({
              type: "crossword",
              words: words.join("\n"),
              seed,
              options: { size: 30 },
            });
            expect(validate(p).errors).toEqual([]);
            expect(p.placements.map((q) => q.word).sort()).toEqual(
              [...words].sort(),
            );
            successes++;
          } catch (e) {
            if (!(e instanceof PuzzleError)) throw e;
            expect(e.words.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 250 },
    );
    expect(successes).toBeGreaterThan(220);
  }, 120000);
  it(
    "checks exactly-once word search across 150 seeds and subsets",
    () =>
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.uniqueArray(fc.constantFrom(...pool.slice(0, 16)), {
            minLength: 4,
            maxLength: 8,
          }),
          fc.constantFrom("easy", "medium", "hard"),
          (seed, words, difficulty) => {
            const p = generate({
              type: "word-search",
              words: words.join("\n"),
              seed,
              options: { size: 15, difficulty },
            });
            expect(validate(p).errors).toEqual([]);
            for (const word of words)
              expect(
                occurrences(p.grid, word, directionsFor(difficulty)),
              ).toHaveLength(1);
          },
        ),
        { numRuns: 150 },
      ),
    120000,
  );
  it("preserves scramble multisets, always changes order, over 1000 inputs", () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4294967295 }),
        fc
          .array(fc.constantFrom("A", "B", "É", "Ñ", "Z"), {
            minLength: 2,
            maxLength: 20,
          })
          .filter((a) => new Set(a).size > 1),
        (seed, chars) => {
          const word = chars.join(""),
            p = generate({ type: "scramble", words: word, seed });
          expect(letters(p.scrambled[0]).sort()).toEqual([...chars].sort());
          expect(p.scrambled[0]).not.toBe(word);
          expect(validate(p).valid).toBe(true);
        },
      ),
      { numRuns: 1000 },
    ));
  it("substitutes Unicode letters without fixed points, preserves punctuation over 1000 seeds", () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4294967295 }), (seed) => {
        const p = generate({
          type: "cryptogram",
          quote: "¡Niño, café! Äpfel & 123.",
          seed,
          options: { language: "es", givenLetters: 3 },
        });
        expect(validate(p).errors).toEqual([]);
        expect(Object.entries(p.cipher).every(([a, b]) => a !== b)).toBe(true);
        letters(p.quote.toUpperCase()).forEach((c, i) => {
          if (!/\p{L}/u.test(c)) expect(letters(p.encoded)[i]).toBe(c);
        });
      }),
      { numRuns: 1000 },
    ));
  it("handles palindrome occurrence paths only once", () =>
    expect(occurrences([letters("LEVEL")], "LEVEL")).toHaveLength(1));
  it("explains one disconnected word with the letters that would link it", () =>
    expect(() =>
      generate({ type: "crossword", words: "GARDEN\nEARTH\nQUIZ" }),
    ).toThrow(
      "QUIZ didn’t fit: it shares no letters with the other words. Add a word with Q, U, I or Z.",
    ));
  it("reports disconnected words, dense grids, repeated letters and contained words", () => {
    expect(() => generate({ type: "crossword", words: "AAA\nZZZ" })).toThrow(
      /ZZZ didn’t fit: it shares no letters with the other words/,
    );
    expect(() =>
      generate({
        type: "word-search",
        words: "ELEPHANTINE",
        options: { size: 8 },
      }),
    ).toThrow(/does not fit/);
    expect(() => generate({ type: "scramble", words: "AAA" })).toThrow(
      /cannot be scrambled/,
    );
    expect(() =>
      generate({ type: "word-search", words: "CAT\nCATERPILLAR" }),
    ).toThrow(/contained/);
  });
  it("supports all seven alphabets and accented words", () => {
    for (const language of [
      "en",
      "es",
      "fr",
      "de",
      "pt",
      "it",
      "nl",
    ] as const) {
      const p = generate({
        type: "word-search",
        words: "CAFÉ\nNIÑO\nBAUM",
        options: { language },
        seed: 42,
      });
      expect(validate(p).valid).toBe(true);
    }
  });
});
describe("files, links, and validation", () => {
  it.each(TYPES)(
    "%s survives project and compressed link round trips",
    (type) => {
      const p = generate({ type, seed: 77 });
      expect(readPuzzle(JSON.parse(JSON.stringify(p)))).toEqual(p);
      expect(decode(encode(p))).toEqual(p);
    },
  );
  it("fits a 25-word crossword with short clues into the target link budget", () => {
    const p = generate({
      type: "crossword",
      words: pool
        .slice(0, 25)
        .map((w) => w + ": Something in the garden")
        .join("\n"),
      options: { size: 30 },
      seed: 42,
    });
    expect(encode(p).length + 60).toBeLessThan(2000);
  });
  it("detects tampered grid, missing placement, repeated scramble and invalid cipher", () => {
    const p = generate({ type: "crossword" });
    p.grid[0][0] = "!";
    expect(validate(p).valid).toBe(false);
    const q = generate({ type: "word-search" });
    q.placements.pop();
    expect(validate(q).valid).toBe(false);
    const r = generate({ type: "scramble" });
    r.scrambled[0] = r.entries[0].word;
    expect(validate(r).valid).toBe(false);
    const s = generate({ type: "cryptogram" });
    s.cipher.A = "A";
    expect(validate(s).valid).toBe(false);
  });
  it("rejects malformed schemas, corrupted and oversized links", () => {
    expect(() => readPuzzle({})).toThrow();
    expect(() => decode("!invalid")).toThrow();
    expect(() => decode("a".repeat(40001))).toThrow();
  });
  it("creates stable class sets with distinct seeds", () => {
    const p = generate({ type: "crossword" }),
      set = variants(p, 10);
    expect(new Set(set.map((q) => q.id)).size).toBe(10);
    expect(set.every((q) => validate(q).valid)).toBe(true);
    expect(() => variants(p, 41)).toThrow();
  });
  it("ships only original example data and quotes", () => {
    expect(parseWords(DEFAULT_WORDS).entries).toHaveLength(10);
    expect(QUOTES).toHaveLength(3);
  });
});
it("rejects missing cryptogram mappings, inconsistent numbering, empty puzzles and oversized rows", () => {
  const p = generate({ type: "cryptogram" });
  p.cipher = {};
  p.encoded = p.quote.toUpperCase();
  expect(validate(p).valid).toBe(false);
  const q = generate({ type: "crossword" });
  q.placements[0].number = 99;
  expect(validate(q).valid).toBe(false);
  const r = generate({ type: "scramble" });
  r.entries = [];
  r.scrambled = [];
  expect(validate(r).valid).toBe(false);
  const s = generate({ type: "word-search" });
  s.grid[0] = Array(61).fill("A");
  expect(validate(s).valid).toBe(false);
});
it("preserves a valid imported layout for a single-version export", () => {
  const p = generate({ type: "word-search", seed: 42 });
  expect(variants(p, 1)[0]).toBe(p);
});
it("keeps commas inside colon and dash clues", () => {
  expect(
    parseWords("LEAF: A small, green part\nROOT - Strong, underground support")
      .entries,
  ).toEqual([
    { word: "LEAF", clue: "A small, green part" },
    { word: "ROOT", clue: "Strong, underground support" },
  ]);
});
it("class sets have distinct arrangements and reject exhausted combinations", () => {
  const set = variants(generate({ type: "crossword" }), 30);
  expect(new Set(set.map((p) => JSON.stringify(p.grid))).size).toBe(30);
  expect(() =>
    variants(generate({ type: "scramble", words: "AB" }), 2),
  ).toThrow(/different versions/);
});
