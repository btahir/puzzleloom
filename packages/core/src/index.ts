import { z } from "zod";
import { strToU8, strFromU8, zlibSync, unzlibSync } from "fflate";

export const TYPES = [
  "crossword",
  "word-search",
  "scramble",
  "cryptogram",
] as const;
export type PuzzleType = (typeof TYPES)[number];
export const LABELS: Record<PuzzleType, string> = {
  crossword: "Crossword",
  "word-search": "Word search",
  scramble: "Word scramble",
  cryptogram: "Cryptogram",
};
export const ALPHABETS = {
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  es: "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
  fr: "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÂÇÉÈÊËÎÏÔÙÛÜŸ",
  de: "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ",
  pt: "ABCDEFGHIJKLMNOPQRSTUVWXYZÁÂÃÀÇÉÊÍÓÔÕÚ",
  it: "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÈÉÌÒÙ",
  nl: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};
export const optionsSchema = z.object({
  size: z.number().int().min(8).max(30).default(18),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  language: z.enum(["en", "es", "fr", "de", "pt", "it", "nl"]).default("en"),
  stripAccents: z.boolean().default(false),
  expandEszett: z.boolean().default(true),
  paper: z.enum(["letter", "a4"]).default("letter"),
  font: z.enum(["atkinson", "opendyslexic"]).default("atkinson"),
  fontSize: z.enum(["S", "M", "L", "XL"]).default("M"),
  wordBank: z.boolean().default(false),
  hint: z.enum(["none", "first", "clue"]).default("none"),
  givenLetters: z.number().int().min(0).max(8).default(0),
  allowReveal: z.boolean().default(true),
  nameFields: z.boolean().default(true),
});
export type Options = z.infer<typeof optionsSchema>;
export const entrySchema = z.object({
  word: z.string().min(2).max(30),
  clue: z.string().max(200).default(""),
});
export type Entry = z.infer<typeof entrySchema>;
const placementSchema = z.object({
  word: z.string(),
  clue: z.string(),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  dx: z.number().int().min(-1).max(1),
  dy: z.number().int().min(-1).max(1),
  number: z.number().int().positive(),
});
export type Placement = z.infer<typeof placementSchema>;
export const puzzleSchema = z.object({
  schema: z.literal("puzzleloom.puzzle/v1"),
  type: z.enum(TYPES),
  seed: z.number().int().min(0).max(4294967295),
  id: z.string(),
  title: z.string().max(100),
  instructions: z.string().max(300),
  entries: z.array(entrySchema).max(40),
  quote: z.string().max(600),
  options: optionsSchema,
  grid: z.array(z.array(z.string().max(4)).max(60)).max(60),
  placements: z.array(placementSchema).max(40),
  scrambled: z.array(z.string()).max(40),
  cipher: z.record(z.string(), z.string()),
  encoded: z.string().max(1200),
  given: z.array(z.string()).max(8),
});
export type Puzzle = z.infer<typeof puzzleSchema>;
export type Input = {
  type: PuzzleType;
  words?: string;
  entries?: Entry[];
  quote?: string;
  seed?: number;
  title?: string;
  instructions?: string;
  options?: Partial<Options>;
};
export class PuzzleError extends Error {
  constructor(
    message: string,
    public words: string[] = [],
  ) {
    super(message);
    this.name = "PuzzleError";
  }
}
export function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export const letters = (s: string) => Array.from(s.normalize("NFC"));
export function normalize(s: string, options: Partial<Options> = {}) {
  let v = s.trim().normalize("NFC");
  if (options.expandEszett === false) v = v.replace(/ß/g, "ẞ");
  v = v.toUpperCase();
  if (options.stripAccents) v = v.normalize("NFD").replace(/\p{M}/gu, "");
  return v.replace(/[^\p{L}\p{M}]/gu, "").normalize("NFC");
}
function splitCSV(line: string): string[] {
  const out: string[] = [];
  let part = "",
    quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (quoted && line[i + 1] === '"') {
        part += '"';
        i++;
      } else quoted = !quoted;
    } else if (line[i] === "," && !quoted) {
      out.push(part);
      part = "";
    } else part += line[i];
  }
  if (quoted) throw new PuzzleError("A CSV row has an unclosed quote.");
  return [...out, part];
}
export function parseWords(
  text: string,
  options: Partial<Options> = {},
): { entries: Entry[]; warnings: string[] } {
  const entries: Entry[] = [],
    warnings: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const comma = raw.indexOf(","),
      delimiter = raw.search(/:|\s+-\s+/);
    const parts = raw.includes("\t")
      ? raw.split("\t")
      : comma >= 0 && (delimiter < 0 || comma < delimiter)
        ? splitCSV(raw)
        : raw.split(/\s*:\s*|\s+-\s+/);
    if (
      /^(word|answer)$/i.test(parts[0].trim()) &&
      /^(clue|hint)$/i.test((parts[1] ?? "").trim())
    )
      continue;
    const word = normalize(parts[0], options),
      clue = parts.slice(1).join(", ").trim();
    if (!word) continue;
    if (letters(word).length < 2)
      throw new PuzzleError(`“${parts[0]}” needs at least two letters.`, [
        word,
      ]);
    if (letters(word).length > 30)
      throw new PuzzleError(`${word} is longer than 30 letters.`, [word]);
    if (seen.has(word)) {
      warnings.push(`Removed duplicate ${word}.`);
      continue;
    }
    seen.add(word);
    entries.push({ word, clue });
  }
  if (entries.length > 40)
    throw new PuzzleError("Use up to 40 words in one puzzle.");
  return { entries, warnings };
}
export const DEFAULT_WORDS =
  "GARDEN: A place to grow\nSEED: A small beginning\nLEAF: A plant’s green food maker\nROOT: Holds a plant in the soil\nWATER: A drink for thirsty plants\nFLOWER: A bloom with petals\nEARTH: Soil beneath our feet\nSTEM: Holds a flower upright\nSUN: Our nearest star\nGROW: Get a little bigger";
export const QUOTES = [
  "Small seeds grow into wonderful things.",
  "A good question opens a new door.",
  "Make a little room for something new.",
];
const instructions: Record<PuzzleType, string> = {
  crossword:
    "Use the clues to fill the crossword. Each square holds one letter.",
  "word-search": "Find the hidden words. Check them off as you go.",
  scramble: "Unscramble the letters to find each word.",
  cryptogram:
    "Each letter stands for another. Use the code to uncover the message.",
};
export const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
] as const;
export function occurrences(grid: string[][], word: string): string[] {
  const chars = letters(word),
    found = new Set<string>();
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < (grid[y]?.length ?? 0); x++)
      for (const [dx, dy] of DIRECTIONS) {
        if (chars.every((c, i) => grid[y + dy * i]?.[x + dx * i] === c)) {
          const a = `${x},${y}`,
            b = `${x + dx * (chars.length - 1)},${y + dy * (chars.length - 1)}`;
          found.add([a, b].sort().join(":"));
        }
      }
  return [...found];
}
export const BLOCKLIST = ["FUCK", "SHIT"];
function wordSearch(
  entries: Entry[],
  opts: Options,
  rand: () => number,
): { grid: string[][]; placements: Placement[] } {
  for (const e of entries) {
    if (letters(e.word).length > opts.size)
      throw new PuzzleError(
        `${e.word} does not fit in a ${opts.size} × ${opts.size} grid. Increase the grid size.`,
        [e.word],
      );
    if (BLOCKLIST.some((w) => e.word.includes(w)))
      throw new PuzzleError(
        "A word contains a blocked sequence. Edit the word list.",
        [e.word],
      );
    for (const other of entries)
      if (
        e !== other &&
        (other.word.includes(e.word) ||
          letters(other.word).reverse().join("").includes(e.word))
      )
        throw new PuzzleError(
          `${e.word} is contained in ${other.word}. Remove one to avoid an ambiguous word search.`,
          [e.word, other.word],
        );
  }
  const dirs = DIRECTIONS.slice(
    0,
    opts.difficulty === "easy" ? 2 : opts.difficulty === "medium" ? 4 : 8,
  );
  const pool = letters(
    entries.map((e) => e.word).join("") + ALPHABETS[opts.language],
  );
  for (let attempt = 0; attempt < 35; attempt++) {
    const grid = Array.from({ length: opts.size }, () =>
      Array<string>(opts.size).fill(""),
    );
    const placements: Placement[] = [];
    for (const entry of [...entries].sort(
      (a, b) => letters(b.word).length - letters(a.word).length,
    )) {
      const chars = letters(entry.word),
        candidates: { x: number; y: number; dx: number; dy: number }[] = [];
      for (let y = 0; y < opts.size; y++)
        for (let x = 0; x < opts.size; x++)
          for (const [dx, dy] of dirs)
            if (
              chars.every((c, i) => {
                const a = x + dx * i,
                  b = y + dy * i;
                return (
                  a >= 0 &&
                  b >= 0 &&
                  a < opts.size &&
                  b < opts.size &&
                  (!grid[b][a] || grid[b][a] === c)
                );
              })
            )
              candidates.push({ x, y, dx, dy });
      let placed = false;
      for (const c of shuffle(candidates, rand)) {
        const changed: [number, number][] = [];
        chars.forEach((char, i) => {
          const x = c.x + c.dx * i,
            y = c.y + c.dy * i;
          if (!grid[y][x]) changed.push([x, y]);
          grid[y][x] = char;
        });
        if (entries.every((e) => occurrences(grid, e.word).length <= 1)) {
          placements.push({ ...entry, ...c, number: placements.length + 1 });
          placed = true;
          break;
        }
        changed.forEach(([x, y]) => (grid[y][x] = ""));
      }
      if (!placed) break;
    }
    if (placements.length !== entries.length) continue;
    const blank = grid.flatMap((row, y) =>
      row.flatMap((c, x) => (c ? [] : [{ x, y }])),
    );
    for (let fill = 0; fill < 80; fill++) {
      for (const { x, y } of blank)
        grid[y][x] = pool[Math.floor(rand() * pool.length)];
      if (
        entries.every((e) => occurrences(grid, e.word).length === 1) &&
        BLOCKLIST.every((w) => occurrences(grid, w).length === 0)
      )
        return { grid, placements };
    }
  }
  throw new PuzzleError(
    "This list is too crowded to place each word exactly once. Try a larger grid or fewer words.",
    entries.map((e) => e.word),
  );
}
type Cell = { letter: string; across: boolean; down: boolean };
const key = (x: number, y: number) => `${x},${y}`;
function crossword(
  entries: Entry[],
  opts: Options,
  rand: () => number,
): { grid: string[][]; placements: Placement[] } {
  const max = opts.size;
  for (const e of entries)
    if (letters(e.word).length > max)
      throw new PuzzleError(`${e.word} needs a larger grid.`, [e.word]);
  let best: Placement[] = [],
    bestScore = Infinity;
  let incomplete: Placement[] = [];
  for (let attempt = 0; attempt < 90; attempt++) {
    const cells = new Map<string, Cell>();
    const placed: Placement[] = [];
    const order = shuffle(entries, rand).sort((a, b) =>
      attempt % 3 === 0 ? letters(b.word).length - letters(a.word).length : 0,
    );
    const first = order[0];
    letters(first.word).forEach((letter, x) =>
      cells.set(key(x, 0), { letter, across: true, down: false }),
    );
    placed.push({ ...first, x: 0, y: 0, dx: 1, dy: 0, number: 1 });
    let minX = 0,
      maxX = letters(first.word).length - 1,
      minY = 0,
      maxY = 0;
    let remaining = order.slice(1);
    for (let pass = 0; pass < entries.length && remaining.length; pass++) {
      let progress = false;
      const next: Entry[] = [];
      for (const entry of remaining) {
        const chars = letters(entry.word);
        const candidates: {
          x: number;
          y: number;
          dx: number;
          dy: number;
          score: number;
        }[] = [];
        for (const [position, cell] of cells) {
          const [cx, cy] = position.split(",").map(Number);
          for (let i = 0; i < chars.length; i++) {
            if (chars[i] !== cell.letter) continue;
            for (const [dx, dy] of [
              [1, 0],
              [0, 1],
            ]) {
              if (dx ? cell.across : cell.down) continue;
              const x = cx - dx * i,
                y = cy - dy * i,
                ex = x + dx * (chars.length - 1),
                ey = y + dy * (chars.length - 1);
              const width = Math.max(maxX, ex) - Math.min(minX, x) + 1,
                height = Math.max(maxY, ey) - Math.min(minY, y) + 1;
              if (
                width > max ||
                height > max ||
                cells.has(key(x - dx, y - dy)) ||
                cells.has(key(ex + dx, ey + dy))
              )
                continue;
              let crosses = 0;
              const valid = chars.every((c, j) => {
                const px = x + dx * j,
                  py = y + dy * j,
                  existing = cells.get(key(px, py));
                if (existing) {
                  crosses++;
                  return (
                    existing.letter === c &&
                    !(dx ? existing.across : existing.down)
                  );
                }
                return (
                  !cells.has(key(px + dy, py + dx)) &&
                  !cells.has(key(px - dy, py - dx))
                );
              });
              if (valid)
                candidates.push({
                  x,
                  y,
                  dx,
                  dy,
                  score: width * height - crosses * 8 + rand() * 5,
                });
            }
          }
        }
        candidates.sort((a, b) => a.score - b.score);
        const chosen = candidates[0];
        if (!chosen) {
          next.push(entry);
          continue;
        }
        const { x, y, dx, dy } = chosen;
        chars.forEach((letter, i) => {
          const k = key(x + dx * i, y + dy * i),
            old = cells.get(k);
          cells.set(k, {
            letter,
            across: !!dx || !!old?.across,
            down: !!dy || !!old?.down,
          });
        });
        placed.push({ ...entry, x, y, dx, dy, number: 1 });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + dx * (chars.length - 1));
        maxY = Math.max(maxY, y + dy * (chars.length - 1));
        progress = true;
      }
      remaining = next;
      if (!progress) break;
    }
    if (placed.length > incomplete.length) incomplete = placed;
    const score =
      (maxX - minX + 1) * (maxY - minY + 1) +
      Math.abs(maxX - minX - (maxY - minY)) * 2;
    if (placed.length === entries.length && score < bestScore) {
      bestScore = score;
      best = placed.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY }));
    }
    if (best.length && attempt >= 19) break;
  }
  if (!best.length) {
    const missing = entries
      .filter((e) => !incomplete.some((p) => p.word === e.word))
      .map((e) => e.word);
    const disconnected = missing.filter(
      (w) =>
        !entries.some(
          (e) => e.word !== w && letters(w).some((c) => e.word.includes(c)),
        ),
    );
    throw new PuzzleError(
      disconnected.length
        ? `${disconnected.join(", ")} shares no letters with the other words. Add a connecting word.`
        : `Could not place ${missing.join(", ")} in a connected ${max} × ${max} grid. Try a larger grid or edit the list.`,
      missing,
    );
  }
  best.sort((a, b) => a.y - b.y || a.x - b.x || b.dx - a.dx);
  let number = 0,
    last = "";
  for (const p of best) {
    const k = key(p.x, p.y);
    if (k !== last) {
      number++;
      last = k;
    }
    p.number = number;
  }
  const width =
      Math.max(...best.map((p) => p.x + p.dx * (letters(p.word).length - 1))) +
      1,
    height =
      Math.max(...best.map((p) => p.y + p.dy * (letters(p.word).length - 1))) +
      1;
  const grid = Array.from({ length: height }, () =>
    Array<string>(width).fill(""),
  );
  best.forEach((p) =>
    letters(p.word).forEach(
      (c, i) => (grid[p.y + p.dy * i][p.x + p.dx * i] = c),
    ),
  );
  return { grid, placements: best };
}
export function generate(input: Input): Puzzle {
  const options = optionsSchema.parse(input.options ?? {}),
    seed = z
      .number()
      .int()
      .min(0)
      .max(4294967295)
      .parse(input.seed ?? 1),
    rand = random(seed);
  const entries = input.entries
    ? parseWords(
        input.entries.map((e) => `${e.word}\t${e.clue}`).join("\n"),
        options,
      ).entries
    : parseWords(input.words ?? DEFAULT_WORDS, options).entries;
  const type = z.enum(TYPES).parse(input.type);
  const quote = (input.quote ?? QUOTES[0]).normalize("NFC");
  if (quote.length > 600)
    throw new PuzzleError("Use a quote of 600 characters or fewer.");
  if (type !== "cryptogram" && !entries.length)
    throw new PuzzleError("Add at least one word to get started.");
  const p: Puzzle = {
    schema: "puzzleloom.puzzle/v1",
    type,
    seed,
    id: `PL-${seed.toString(36).toUpperCase().padStart(4, "0")}`,
    title: input.title?.trim() || `${LABELS[type]} · In the garden`,
    instructions: input.instructions ?? instructions[type],
    entries: type === "cryptogram" ? [] : entries,
    quote: type === "cryptogram" ? quote : "",
    options,
    grid: [],
    placements: [],
    scrambled: [],
    cipher: {},
    encoded: "",
    given: [],
  };
  if (type === "crossword") Object.assign(p, crossword(entries, options, rand));
  if (type === "word-search")
    Object.assign(p, wordSearch(entries, options, rand));
  if (type === "scramble")
    p.scrambled = entries.map((e) => {
      const chars = letters(e.word);
      if (new Set(chars).size < 2)
        throw new PuzzleError(
          `${e.word} cannot be scrambled into a different order.`,
          [e.word],
        );
      let out = shuffle(chars, rand).join("");
      for (let i = 0; out === e.word && i < 20; i++)
        out = shuffle(chars, rand).join("");
      return out === e.word ? chars.slice(1).concat(chars[0]).join("") : out;
    });
  if (type === "cryptogram") {
    const text = quote.toUpperCase(),
      alphabet = [
        ...new Set([
          ...letters(ALPHABETS[options.language]),
          ...letters(text).filter((c) => /\p{L}/u.test(c)),
        ]),
      ].sort();
    if (!/\p{L}/u.test(text))
      throw new PuzzleError("Add a quote with some letters.");
    const order = shuffle(alphabet, rand);
    order.forEach((c, i) => (p.cipher[c] = order[(i + 1) % order.length]));
    p.encoded = letters(text)
      .map((c) => p.cipher[c] ?? c)
      .join("");
    p.given = shuffle(
      [...new Set(letters(text).filter((c) => p.cipher[c]))],
      rand,
    ).slice(0, options.givenLetters);
  }
  return puzzleSchema.parse(p);
}
export function validate(value: unknown): {
  valid: boolean;
  errors: string[];
  puzzle?: Puzzle;
} {
  const parsed = puzzleSchema.safeParse(value);
  if (!parsed.success)
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`,
      ),
    };
  const p = parsed.data,
    errors: string[] = [];
  if (p.type !== "cryptogram" && !p.entries.length)
    errors.push("A puzzle needs at least one word.");
  if (new Set(p.entries.map((e) => e.word)).size !== p.entries.length)
    errors.push("Duplicate entries.");
  if (
    p.entries.some(
      (e) => normalize(e.word) !== e.word || letters(e.word).length < 2,
    )
  )
    errors.push("Words must be normalized letters.");
  if (
    p.grid.some((row) =>
      row.some(
        (c) => c && (letters(c).length !== 1 || !/[\p{L}\p{M}]/u.test(c)),
      ),
    )
  )
    errors.push("Grid cells must hold one letter.");
  if (p.id !== `PL-${p.seed.toString(36).toUpperCase().padStart(4, "0")}`)
    errors.push("Puzzle ID does not match seed.");
  if (p.type === "crossword" || p.type === "word-search") {
    if (
      !p.grid.length ||
      !p.grid[0].length ||
      p.grid.some((r) => r.length !== p.grid[0].length)
    )
      errors.push("Grid must be rectangular.");
    if (
      p.placements.length !== p.entries.length ||
      new Set(p.placements.map((q) => q.word)).size !== p.entries.length
    )
      errors.push("Every word must be placed once.");
    const occupied = new Map<string, Placement[]>();
    for (const q of p.placements) {
      if (!p.entries.some((e) => e.word === q.word))
        errors.push(`Unknown word ${q.word}.`);
      if (!q.dx && !q.dy) errors.push("Invalid direction.");
      letters(q.word).forEach((c, i) => {
        const x = q.x + q.dx * i,
          y = q.y + q.dy * i;
        if (p.grid[y]?.[x] !== c) errors.push(`Grid mismatch for ${q.word}.`);
        const k = key(x, y);
        occupied.set(k, [...(occupied.get(k) ?? []), q]);
      });
    }
    if (p.type === "word-search") {
      for (const e of p.entries)
        if (occurrences(p.grid, e.word).length !== 1)
          errors.push(`${e.word} must occur exactly once.`);
      for (const w of BLOCKLIST)
        if (occurrences(p.grid, w).length)
          errors.push("Blocked sequence in grid.");
      const dirs = DIRECTIONS.slice(
        0,
        p.options.difficulty === "easy"
          ? 2
          : p.options.difficulty === "medium"
            ? 4
            : 8,
      );
      if (
        p.placements.some(
          (q) => !dirs.some(([dx, dy]) => dx === q.dx && dy === q.dy),
        )
      )
        errors.push("Direction exceeds difficulty.");
    } else {
      const ordered = [...p.placements].sort((a, b) => a.y - b.y || a.x - b.x);
      let number = 0,
        last = "";
      for (const q of ordered) {
        const position = key(q.x, q.y);
        if (position !== last) {
          number++;
          last = position;
        }
        if (q.number !== number)
          errors.push("Crossword numbering is inconsistent.");
      }
      for (const q of p.placements) {
        if (!((q.dx === 1 && q.dy === 0) || (q.dx === 0 && q.dy === 1)))
          errors.push("Invalid crossword direction.");
        const end = letters(q.word).length;
        if (
          p.grid[q.y - q.dy]?.[q.x - q.dx] ||
          p.grid[q.y + q.dy * end]?.[q.x + q.dx * end]
        )
          errors.push("Crossword end touches another word.");
        letters(q.word).forEach((_, i) => {
          const x = q.x + q.dx * i,
            y = q.y + q.dy * i,
            here = occupied.get(key(x, y)) ?? [];
          if (here.filter((a) => a.dx === q.dx).length > 1)
            errors.push("Overlapping parallel words.");
          if (
            here.length === 1 &&
            (p.grid[y + q.dx]?.[x + q.dy] || p.grid[y - q.dx]?.[x - q.dy])
          )
            errors.push("Accidental adjacent letters.");
        });
      }
      const reached = new Set<Placement>();
      if (p.placements[0]) reached.add(p.placements[0]);
      for (let i = 0; i < p.placements.length; i++)
        for (const group of occupied.values())
          if (group.some((q) => reached.has(q)))
            group.forEach((q) => reached.add(q));
      if (reached.size !== p.placements.length)
        errors.push("Crossword is disconnected.");
      for (let y = 0; y < p.grid.length; y++)
        for (let x = 0; x < p.grid[y].length; x++)
          if (p.grid[y][x] && !occupied.has(key(x, y)))
            errors.push("Unclaimed grid letter.");
    }
  }
  if (p.type === "scramble") {
    if (p.scrambled.length !== p.entries.length)
      errors.push("Missing scrambled word.");
    p.entries.forEach((e, i) => {
      if (
        e.word === p.scrambled[i] ||
        letters(e.word).sort().join("") !==
          letters(p.scrambled[i] ?? "")
            .sort()
            .join("")
      )
        errors.push(`Invalid scramble for ${e.word}.`);
    });
  }
  if (p.type === "cryptogram") {
    const sourceLetters = letters(p.quote.toUpperCase()).filter((c) =>
      /\p{L}/u.test(c),
    );
    if (!sourceLetters.length || sourceLetters.some((c) => !p.cipher[c]))
      errors.push("Every quote letter needs a substitution.");
    if (
      Object.entries(p.cipher).some(
        ([a, b]) =>
          letters(a).length !== 1 ||
          letters(b).length !== 1 ||
          !/^\p{L}$/u.test(a) ||
          !/^\p{L}$/u.test(b),
      )
    )
      errors.push("Cipher entries must be single letters.");
    if (p.given.some((c) => !sourceLetters.includes(c)))
      errors.push("Given letter is not in the quote.");
    if (
      Object.entries(p.cipher).some(([a, b]) => a === b) ||
      new Set(Object.values(p.cipher)).size !== Object.keys(p.cipher).length
    )
      errors.push("Cipher must be a derangement.");
    if (
      letters(p.quote.toUpperCase())
        .map((c) => p.cipher[c] ?? c)
        .join("") !== p.encoded
    )
      errors.push("Cipher does not match the quote.");
  }
  return { valid: !errors.length, errors: [...new Set(errors)], puzzle: p };
}
export function readPuzzle(value: unknown): Puzzle {
  const result = validate(value);
  if (!result.valid) throw new PuzzleError(result.errors.join(" "));
  return result.puzzle!;
}
export function encode(p: Puzzle): string {
  const bytes = zlibSync(strToU8(JSON.stringify(p)), { level: 9 });
  let raw = "";
  bytes.forEach((b) => (raw += String.fromCharCode(b)));
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decode(code: string): Puzzle {
  if (code.length > 40000)
    throw new PuzzleError("This play link is too large.");
  try {
    const bytes = Uint8Array.from(
      atob(code.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0),
    );
    const out = new Uint8Array(200000);
    const data = unzlibSync(bytes, { out });
    if (data.length >= out.length) throw new Error("Too large");
    return readPuzzle(JSON.parse(strFromU8(data)));
  } catch (e) {
    throw new PuzzleError(
      `Could not open this play link. ${e instanceof Error ? e.message : ""}`,
    );
  }
}
export function variants(p: Puzzle, count: number): Puzzle[] {
  if (!Number.isInteger(count) || count < 1 || count > 40)
    throw new PuzzleError("Choose between 1 and 40 versions.");
  const fingerprint = (q: Puzzle) =>
    JSON.stringify([q.grid, q.scrambled, q.encoded]);
  const out = [p],
    seen = new Set([fingerprint(p)]);
  for (
    let offset = 1;
    out.length < count && offset <= Math.max(120, count * 12);
    offset++
  ) {
    try {
      const candidate = generate({
        type: p.type,
        entries: p.entries,
        quote: p.quote,
        options: p.options,
        title: p.title,
        instructions: p.instructions,
        seed: (p.seed + offset) >>> 0,
      });
      const signature = fingerprint(candidate);
      if (!seen.has(signature)) {
        seen.add(signature);
        out.push(candidate);
      }
    } catch (error) {
      if (!(error instanceof PuzzleError)) throw error;
    }
  }
  if (out.length !== count)
    throw new PuzzleError(
      `Could not find ${count} different versions for this input. Choose fewer versions or add more words.`,
    );
  return out;
}
