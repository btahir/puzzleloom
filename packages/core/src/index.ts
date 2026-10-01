import { z } from "zod";
import { strToU8, strFromU8, zlibSync, unzlibSync } from "fflate";
import { BLOCKLIST } from "./blocklist";

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
  /**
   * Grid side length (crossword: largest allowed bounding box). Stored
   * puzzles always carry the size that was actually used.
   */
  size: z.number().int().min(8).max(30).default(18),
  /**
   * True when the engine chose `size` itself. Re-generating such a puzzle
   * (class-set variants) chooses a size again instead of reusing the number.
   */
  autoSize: z.boolean().default(false),
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
/**
 * What callers may pass. `size` is optional: leave it out (or set
 * `autoSize: true`) and the engine picks the size; set it and that exact size
 * is used.
 */
export const optionsInputSchema = optionsSchema.extend({
  size: z.number().int().min(8).max(30).optional(),
});
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
export type Warning = {
  code: "duplicate-word" | "removed-characters" | "skipped-line";
  word: string;
  message: string;
};
/**
 * Split one CSV row into fields. A quote only opens a quoted field at the
 * start of a field; elsewhere it is a literal character.
 */
function splitCSV(line: string): { fields: string[]; quoted: boolean } {
  const fields: string[] = [];
  let part = "",
    quoted = false,
    anyQuoted = false,
    atStart = true;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        part += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else part += ch;
    } else if (ch === '"' && atStart) {
      quoted = anyQuoted = true;
      atStart = false;
    } else if (ch === ",") {
      fields.push(part);
      part = "";
      atStart = true;
    } else {
      if (!/\s/.test(ch)) atStart = false;
      part += ch;
    }
  }
  if (quoted) throw new PuzzleError("A CSV row has an unclosed quote.");
  return { fields: [...fields, part], quoted: anyQuoted };
}
/**
 * Split a line into the word part and the clue part. Only the first delimiter
 * separates them; everything after it belongs to the clue, verbatim.
 */
function splitLine(raw: string): [string, string] {
  if (raw.includes("\t")) {
    const [head, ...rest] = raw.split("\t");
    return [
      head,
      rest
        .map((p) => p.trim())
        .filter(Boolean)
        .join(", "),
    ];
  }
  const comma = raw.indexOf(","),
    delimiter = raw.search(/:|\s+[-–—]\s+/);
  if (comma >= 0 && (/^\s*"/.test(raw) || delimiter < 0 || comma < delimiter)) {
    const { fields, quoted } = splitCSV(raw);
    if (!quoted) {
      // Unquoted CSV: keep the rest of the row exactly as typed.
      return [fields[0], raw.slice(raw.indexOf(",") + 1).trim()];
    }
    return [
      fields[0],
      fields
        .slice(1)
        .map((f) => f.trim())
        .filter(Boolean)
        .join(", "),
    ];
  }
  if (delimiter >= 0) {
    const match = /:|\s+[-–—]\s+/.exec(raw)!;
    return [
      raw.slice(0, delimiter),
      raw.slice(delimiter + match[0].length).trim(),
    ];
  }
  return [raw, ""];
}
const KEPT_PUNCTUATION = /[\p{L}\p{M}\s'’‘.\-–—]/u;
function ingest(
  rows: [string, string][],
  options: Partial<Options>,
): { entries: Entry[]; warnings: string[]; details: Warning[] } {
  const entries: Entry[] = [],
    details: Warning[] = [];
  const seen = new Set<string>();
  for (const [rawWord, rawClue] of rows) {
    const word = normalize(rawWord, options),
      clue = rawClue.trim(),
      shown = rawWord.trim();
    if (!word) {
      if (shown)
        details.push({
          code: "skipped-line",
          word: shown,
          message: `Skipped “${shown}” because it has no letters.`,
        });
      continue;
    }
    if (letters(word).length < 2)
      throw new PuzzleError(`“${rawWord.trim()}” needs at least two letters.`, [
        word,
      ]);
    if (letters(word).length > 30)
      throw new PuzzleError(`${word} is longer than 30 letters.`, [word]);
    if (clue.length > 200)
      throw new PuzzleError(
        `The clue for ${word} is ${clue.length} characters; the limit is 200.`,
        [word],
      );
    const dropped = [
      ...new Set([...shown].filter((c) => !KEPT_PUNCTUATION.test(c))),
    ];
    if (dropped.length)
      details.push({
        code: "removed-characters",
        word,
        message: `“${shown}” became ${word}: removed ${dropped.map((c) => `“${c}”`).join(" ")}. Spell numbers and symbols out if you need them.`,
      });
    if (seen.has(word)) {
      details.push({
        code: "duplicate-word",
        word,
        message: `Removed duplicate ${word}.`,
      });
      continue;
    }
    seen.add(word);
    entries.push({ word, clue });
  }
  if (entries.length > 40)
    throw new PuzzleError("Use up to 40 words in one puzzle.");
  return { entries, warnings: details.map((d) => d.message), details };
}
export function parseWords(
  text: string,
  options: Partial<Options> = {},
): { entries: Entry[]; warnings: string[]; details: Warning[] } {
  const rows: [string, string][] = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const [head, clue] = splitLine(raw);
    if (
      rows.length === 0 &&
      /^(word|answer)$/i.test(head.trim()) &&
      /^(clue|hint)$/i.test(clue.trim())
    )
      continue;
    rows.push([head, clue]);
  }
  return ingest(rows, options);
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
export { BLOCKLIST };
const DIRS_FOR = {
  easy: DIRECTIONS.slice(0, 2),
  medium: DIRECTIONS.slice(0, 4),
  hard: DIRECTIONS,
} as const;
export const directionsFor = (d: Options["difficulty"]) => DIRS_FOR[d];
const hasReverse = (dirs: readonly (readonly [number, number])[]) =>
  dirs.some(([dx, dy]) => dirs.some(([a, b]) => a === -dx && b === -dy));
/**
 * Cells hold one code point, but a few letters are two UTF-16 units. The
 * scanners below slice strings, so map those onto private-use characters.
 */
const wide = new Map<string, string>();
const flat = (c: string) => {
  if (c.length === 1) return c;
  let v = wide.get(c);
  if (!v) {
    v = String.fromCharCode(0xe000 + wide.size);
    wide.set(c, v);
  }
  return v;
};
const flatWord = (chars: string[]) => chars.map(flat).join("");
/** Which blocked words (all eight directions) are spelled in a finished grid. */
function blockedHits(
  grid: string[][],
  skip: ReadonlySet<string>,
): { word: string; cells: [number, number][] }[] {
  const h = grid.length,
    hits: { word: string; cells: [number, number][] }[] = [];
  const blocked = BLOCKLIST.filter((w) => !skip.has(w));
  if (!h || !blocked.length) return hits;
  const w = Math.max(...grid.map((r) => r.length));
  for (const [dx, dy] of [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const) {
    // every line in this direction starts on the top row, or the left/right column
    for (let y0 = 0; y0 < h; y0++)
      for (let x0 = 0; x0 < w; x0++) {
        if (grid[y0]?.[x0] === undefined) continue;
        const px = x0 - dx,
          py = y0 - dy;
        if (px >= 0 && py >= 0 && px < w && py < h) continue; // not a line start
        const cells: [number, number][] = [];
        let line = "";
        for (
          let x = x0, y = y0;
          x >= 0 && y >= 0 && x < w && y < h;
          x += dx, y += dy
        ) {
          cells.push([x, y]);
          line += flat(grid[y]?.[x] || "\0");
        }
        const rev = [...line].reverse().join("");
        for (const word of blocked) {
          for (const [text, back] of [
            [line, false],
            [rev, true],
          ] as const) {
            for (
              let at = text.indexOf(word);
              at >= 0;
              at = text.indexOf(word, at + 1)
            ) {
              const span = cells.slice(
                back ? line.length - at - word.length : at,
                back ? line.length - at : at + word.length,
              );
              hits.push({ word, cells: span });
            }
          }
        }
      }
  }
  return hits;
}
const cellKey = (x: number, y: number) => `${x},${y}`;
/**
 * Blocked words in a grid that are not the user's own: a word the user typed
 * is exempt, and so is a blocked sequence that sits wholly inside one placed
 * word (for example ASS inside CLASSIC).
 */
export function blockedWords(
  grid: string[][],
  placements: readonly Placement[],
  entries: readonly Entry[] = placements,
): string[] {
  const own = new Set(entries.map((e) => flatWord(letters(e.word))));
  const spans = placements.map(
    (p) =>
      new Set(
        letters(p.word).map((_, i) => cellKey(p.x + p.dx * i, p.y + p.dy * i)),
      ),
  );
  const found = new Set<string>();
  for (const hit of blockedHits(grid, own))
    if (!spans.some((s) => hit.cells.every(([x, y]) => s.has(cellKey(x, y)))))
      found.add(hit.word);
  return [...found].sort();
}
export function occurrences(
  grid: string[][],
  word: string,
  dirs: readonly (readonly [number, number])[] = DIRECTIONS,
): string[] {
  const chars = letters(word),
    found = new Set<string>();
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < (grid[y]?.length ?? 0); x++)
      for (const [dx, dy] of dirs) {
        if (chars.every((c, i) => grid[y + dy * i]?.[x + dx * i] === c)) {
          const a = `${x},${y}`,
            b = `${x + dx * (chars.length - 1)},${y + dy * (chars.length - 1)}`;
          found.add([a, b].sort().join(":"));
        }
      }
  return [...found];
}
const maskWord = (w: string) => w[0] + "*".repeat(w.length - 2) + w.at(-1);
export { maskWord };
type Hit = { entry: number; word: string; key: string; cells: number[] };
/** Finds entry copies and blocked words that pass through one grid cell. */
function makeScanner(
  entryChars: string[][],
  dirs: readonly (readonly [number, number])[],
  size: number,
) {
  const entryMap = new Map<string, number>();
  entryChars.forEach((c, i) => entryMap.set(flatWord(c), i));
  const blocked = new Set(
    BLOCKLIST.map((w) => flatWord(letters(w))).filter((w) => !entryMap.has(w)),
  );
  const lengths = [
    ...new Set([
      ...[...entryMap.keys()].map((w) => w.length),
      ...[...blocked].map((w) => w.length),
    ]),
  ].sort((a, b) => a - b);
  const reach = lengths[lengths.length - 1] - 1;
  const allowed = new Set(dirs.map(([dx, dy]) => `${dx},${dy}`));
  const AXES = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ] as const;
  return (grid: string[][], x: number, y: number): Hit[] => {
    const hits: Hit[] = [];
    const n = 2 * reach + 1;
    for (const [ax, ay] of AXES) {
      let line = "",
        a = reach,
        b = reach;
      for (let o = -reach; o <= reach; o++) {
        const cx = x + ax * o,
          cy = y + ay * o;
        const c =
          cx >= 0 && cy >= 0 && cx < size && cy < size ? grid[cy][cx] : "";
        line += c ? flat(c) : "\0";
      }
      while (a > 0 && line[a - 1] !== "\0") a--;
      while (b < n - 1 && line[b + 1] !== "\0") b++;
      let rline = "";
      for (let i = n - 1; i >= 0; i--) rline += line[i];
      for (const L of lengths) {
        if (L > b - a + 1) break;
        for (
          let s = Math.max(a, reach - L + 1);
          s <= Math.min(reach, b - L + 1);
          s++
        ) {
          const fwd = line.slice(s, s + L);
          const rev = rline.slice(n - (s + L), n - s);
          for (const [text, back] of [
            [fwd, false],
            [rev, true],
          ] as const) {
            const dx = back ? -ax : ax,
              dy = back ? -ay : ay;
            const idx = entryMap.get(text),
              isBlocked = blocked.has(text);
            if (idx === undefined && !isBlocked) continue;
            if (idx !== undefined && !allowed.has(`${dx},${dy}`)) continue;
            // first cell of the word in its own reading direction
            const first = back ? s + L - 1 : s;
            const sx = x + ax * (first - reach),
              sy = y + ay * (first - reach);
            const cells: number[] = [];
            for (let i = 0; i < L; i++)
              cells.push((sy + dy * i) * size + sx + dx * i);
            const ex = sx + dx * (L - 1),
              ey = sy + dy * (L - 1);
            hits.push({
              entry: idx ?? -1,
              word: text,
              key: [`${sx},${sy}`, `${ex},${ey}`].sort().join(":"),
              cells,
            });
          }
        }
      }
    }
    return hits;
  };
}
type Fail = "place" | "fill";
function buildWordSearch(
  entries: Entry[],
  size: number,
  opts: Options,
  rand: () => number,
  attempts: number,
): { grid: string[][]; placements: Placement[] } | { fail: Fail } {
  const dirs = directionsFor(opts.difficulty);
  const chars = entries.map((e) => letters(e.word));
  const scan = makeScanner(chars, dirs, size);
  const pool = letters(
    entries.map((e) => e.word).join("") + ALPHABETS[opts.language],
  );
  const distinct = [...new Set(pool)];
  const order = entries
    .map((_, i) => i)
    .sort((a, b) => chars[b].length - chars[a].length);
  let fail: Fail = "place";
  for (let attempt = 0; attempt < attempts; attempt++) {
    const grid = Array.from({ length: size }, () =>
      Array<string>(size).fill(""),
    );
    const owners = new Map<number, Set<number>[]>();
    const spans: Set<number>[] = [];
    const found = new Map<number, string>();
    const placements: Placement[] = [];
    let ok = true;
    for (const idx of order) {
      const word = chars[idx],
        L = word.length;
      const candidates: number[] = [];
      for (let d = 0; d < dirs.length; d++) {
        const [dx, dy] = dirs[d];
        const x0 = dx < 0 ? L - 1 : 0,
          x1 = dx > 0 ? size - L : size - 1;
        const y0 = dy < 0 ? L - 1 : 0,
          y1 = dy > 0 ? size - L : size - 1;
        for (let y = y0; y <= y1; y++)
          for (let x = x0; x <= x1; x++) {
            let fits = true;
            for (let i = 0; i < L; i++) {
              const c = grid[y + dy * i][x + dx * i];
              if (c && c !== word[i]) {
                fits = false;
                break;
              }
            }
            if (fits) candidates.push((d * size + y) * size + x);
          }
      }
      let placed = false;
      for (const c of shuffle(candidates, rand)) {
        const x = c % size,
          y = Math.floor(c / size) % size,
          [dx, dy] = dirs[Math.floor(c / (size * size))];
        const changed: number[] = [];
        const cells: number[] = [];
        for (let i = 0; i < L; i++) {
          const cx = x + dx * i,
            cy = y + dy * i;
          cells.push(cy * size + cx);
          if (!grid[cy][cx]) {
            changed.push(cy * size + cx);
            grid[cy][cx] = word[i];
          }
        }
        const span = new Set(cells);
        const ex = x + dx * (L - 1),
          ey = y + dy * (L - 1);
        const ownKey = [`${x},${y}`, `${ex},${ey}`].sort().join(":");
        let clean = true;
        const seen = new Map<number, string>();
        scanning: for (const cell of cells) {
          for (const hit of scan(grid, cell % size, Math.floor(cell / size))) {
            if (hit.entry >= 0) {
              const known = hit.entry === idx ? ownKey : found.get(hit.entry);
              if (known !== hit.key) {
                clean = false;
                break scanning;
              }
              seen.set(hit.entry, hit.key);
            } else if (
              ![span, ...spans].some((s) => hit.cells.every((k) => s.has(k)))
            ) {
              clean = false;
              break scanning;
            }
          }
        }
        if (!clean) {
          for (const k of changed) grid[Math.floor(k / size)][k % size] = "";
          continue;
        }
        found.set(idx, ownKey);
        spans.push(span);
        placements.push({
          ...entries[idx],
          x,
          y,
          dx,
          dy,
          number: placements.length + 1,
        });
        placed = true;
        break;
      }
      if (!placed) {
        ok = false;
        fail = "place";
        break;
      }
    }
    void owners;
    if (!ok) continue;
    // Fill every blank cell with a letter that creates no second copy of a
    // word and spells nothing from the blocklist, in any direction.
    let filled = true;
    for (let y = 0; y < size && filled; y++)
      for (let x = 0; x < size && filled; x++) {
        if (grid[y][x]) continue;
        const tries = [
          ...Array.from(
            { length: 8 },
            () => pool[Math.floor(rand() * pool.length)],
          ),
          ...shuffle(distinct, rand),
        ];
        let set = false;
        for (const letter of tries) {
          grid[y][x] = letter;
          if (scan(grid, x, y).length === 0) {
            set = true;
            break;
          }
        }
        if (!set) {
          grid[y][x] = "";
          filled = false;
          fail = "fill";
        }
      }
    if (!filled) continue;
    return { grid, placements };
  }
  return { fail };
}
/** Smallest comfortable grid for a list: about 4 / 3.4 / 2.8 cells per letter. */
export function wordSearchSize(
  entries: readonly Entry[],
  difficulty: Options["difficulty"],
): number {
  const total = entries.reduce((n, e) => n + letters(e.word).length, 0),
    longest = Math.max(0, ...entries.map((e) => letters(e.word).length));
  const density = { easy: 4, medium: 3.4, hard: 2.8 }[difficulty];
  const estimate = Math.ceil(Math.sqrt(total * density));
  return Math.min(30, Math.max(8, longest + 1, estimate));
}
function wordSearch(
  entries: Entry[],
  opts: Options,
  rand: () => number,
  auto: boolean,
): { grid: string[][]; placements: Placement[]; size: number } {
  const dirs = directionsFor(opts.difficulty);
  const longest = Math.max(...entries.map((e) => letters(e.word).length));
  for (const e of entries) {
    if (letters(e.word).length > opts.size && !auto)
      throw new PuzzleError(
        `${e.word} does not fit in a ${opts.size} × ${opts.size} grid. Increase the grid size.`,
        [e.word],
      );
    for (const other of entries) {
      if (e === other) continue;
      if (other.word.includes(e.word))
        throw new PuzzleError(
          `${e.word} is contained in ${other.word}. Remove one to avoid an ambiguous word search.`,
          [e.word, other.word],
        );
      if (
        hasReverse(dirs) &&
        letters(other.word).reverse().join("").includes(e.word)
      )
        throw new PuzzleError(
          `${e.word} appears inside ${other.word} read backwards. Remove one, or choose Easy or Medium where words never run backwards.`,
          [e.word, other.word],
        );
    }
  }
  const sizes = auto
    ? Array.from(
        { length: 30 - Math.max(opts.size, longest) + 1 },
        (_, i) => Math.max(opts.size, longest) + i,
      )
    : [opts.size];
  let fail: Fail = "place";
  for (const size of sizes) {
    const result = buildWordSearch(
      entries,
      size,
      opts,
      rand,
      auto ? (size === 30 ? 24 : 6) : 40,
    );
    if ("grid" in result) return { ...result, size };
    fail = result.fail;
  }
  const last = sizes[sizes.length - 1];
  const advice = [
    ...(last < 30 ? ["a larger grid"] : []),
    ...(opts.difficulty !== "hard"
      ? ["a harder difficulty (more directions)"]
      : []),
    "fewer or shorter words",
  ];
  throw new PuzzleError(
    fail === "fill"
      ? `Could not fill the ${last} × ${last} grid so that every word appears exactly once. Try ${advice.join(", or ")}, or change the seed.`
      : `Could not fit all ${entries.length} words into a ${last} × ${last} ${opts.difficulty} grid. Try ${advice.join(", or ")}.`,
    entries.map((e) => e.word),
  );
}
type Cell = { letter: string; across: boolean; down: boolean };
const key = (x: number, y: number) => `${x},${y}`;
type Layout = {
  placed: Placement[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};
/** One greedy attempt: place the first word, then grow by crossing letters. */
function layoutOnce(
  entries: Entry[],
  max: number,
  rand: () => number,
  longestFirst: boolean,
): Layout {
  const cells = new Map<string, Cell>();
  const placed: Placement[] = [];
  const order = shuffle(entries, rand).sort((a, b) =>
    longestFirst ? letters(b.word).length - letters(a.word).length : 0,
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
      let chosen:
        | { x: number; y: number; dx: number; dy: number; score: number }
        | undefined;
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
            if (!valid) continue;
            // Prefer more crossings, a small box, and a square-ish box.
            const side = Math.max(width, height);
            const score =
              width * height +
              side * side * SQUARE_WEIGHT -
              crosses * 8 +
              rand() * 5;
            if (!chosen || score < chosen.score)
              chosen = { x, y, dx, dy, score };
          }
        }
      }
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
  return { placed, minX, maxX, minY, maxY };
}
const SQUARE_WEIGHT = 0.5;
const layoutScore = (l: Layout) => {
  const w = l.maxX - l.minX + 1,
    h = l.maxY - l.minY + 1;
  return w * h + Math.abs(w - h) * 4;
};
/** Starting guess for the grid side: about 2.3 cells per letter. */
export function crosswordSize(entries: readonly Entry[]): number {
  const total = entries.reduce((n, e) => n + letters(e.word).length, 0),
    longest = Math.max(0, ...entries.map((e) => letters(e.word).length));
  return Math.min(30, Math.max(8, longest, Math.ceil(Math.sqrt(total * 2.3))));
}
function crossword(
  entries: Entry[],
  opts: Options,
  rand: () => number,
  auto: boolean,
): { grid: string[][]; placements: Placement[]; size: number } {
  const longest = Math.max(...entries.map((e) => letters(e.word).length));
  for (const e of entries)
    if (letters(e.word).length > opts.size && !auto)
      throw new PuzzleError(`${e.word} needs a larger grid.`, [e.word]);
  // Explicit size: one rung. Auto: grow the allowed box until a layout fits.
  const caps: number[] = [];
  if (auto)
    for (
      let cap = Math.max(crosswordSize(entries), longest);
      cap < 30;
      cap += 2
    )
      caps.push(cap);
  caps.push(auto ? 30 : opts.size);
  let best: Layout | undefined,
    bestScore = Infinity;
  let incomplete: Placement[] = [];
  let usedCap = caps[0];
  for (const cap of caps) {
    usedCap = cap;
    const budget = auto ? (cap === 30 ? 120 : 60) : 120;
    for (let attempt = 0; attempt < budget; attempt++) {
      const layout = layoutOnce(entries, cap, rand, attempt % 3 === 0);
      if (layout.placed.length > incomplete.length) incomplete = layout.placed;
      const score = layoutScore(layout);
      if (layout.placed.length === entries.length && score < bestScore) {
        bestScore = score;
        best = layout;
      }
      if (best && attempt >= 59) break;
    }
    if (best) break;
  }
  if (!best) {
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
        : auto
          ? `Could not find a layout that crosses ${missing.join(", ")} with the other words. Add a word that shares letters with ${missing.length > 1 ? "them" : "it"}, or remove ${missing.length > 1 ? "them" : "it"}.`
          : `Could not place ${missing.join(", ")} in a connected ${usedCap} × ${usedCap} grid. Try a larger grid, leave the size on automatic, or edit the list.`,
      missing,
    );
  }
  const placements = best.placed.map((p) => ({
    ...p,
    x: p.x - best.minX,
    y: p.y - best.minY,
  }));
  placements.sort((a, b) => a.y - b.y || a.x - b.x || b.dx - a.dx);
  let number = 0,
    last = "";
  for (const p of placements) {
    const k = key(p.x, p.y);
    if (k !== last) {
      number++;
      last = k;
    }
    p.number = number;
  }
  const width = best.maxX - best.minX + 1,
    height = best.maxY - best.minY + 1;
  const grid = Array.from({ length: height }, () =>
    Array<string>(width).fill(""),
  );
  placements.forEach((p) =>
    letters(p.word).forEach(
      (c, i) => (grid[p.y + p.dy * i][p.x + p.dx * i] = c),
    ),
  );
  return {
    grid,
    placements,
    size: Math.min(30, Math.max(8, width, height)),
  };
}
/** Turn a zod failure into plain sentences a person can act on. */
export function explainIssues(error: z.ZodError, value?: unknown): string[] {
  const at = (path: (string | number)[]) =>
    path.reduce<unknown>(
      (v, k) => (v && typeof v === "object" ? (v as never)[k] : undefined),
      value,
    );
  const label = (path: (string | number)[]) => {
    const [head, index, field] = path;
    if (head === "entries" && typeof index === "number") {
      const entry = at(["entries", index]) as Partial<Entry> | undefined;
      const word = entry?.word ? ` for ${entry.word}` : ` in row ${index + 1}`;
      return field === "clue" ? `The clue${word}` : `The word${word}`;
    }
    const names: Record<string, string> = {
      title: "The title",
      instructions: "The instructions",
      quote: "The quote",
      encoded: "The encoded text",
    };
    if (path.length === 2 && path[0] === "options")
      return `Option “${String(path[1])}”`;
    if (path.length === 1 && String(head) in optionsSchema.shape)
      return `Option “${String(head)}”`;
    return names[String(head)] ?? path.join(".");
  };
  return [
    ...new Set(
      error.issues.map((i) => {
        const subject = label(i.path),
          text = at(i.path);
        if (i.code === "too_big" && i.type === "string")
          return `${subject} is ${typeof text === "string" ? text.length : "too many"} characters; the limit is ${i.maximum}.`;
        if (i.code === "too_small" && i.type === "string")
          return i.minimum === 1 || i.minimum === 0
            ? `${subject} is empty.`
            : `${subject} must be at least ${i.minimum} characters.`;
        if (i.code === "too_big" && i.type === "number")
          return `${subject} must be at most ${i.maximum}.`;
        if (i.code === "too_small" && i.type === "number")
          return `${subject} must be at least ${i.minimum}.`;
        if (i.code === "too_big" && i.type === "array")
          return `${subject} has too many items; the limit is ${i.maximum}.`;
        if (i.code === "invalid_enum_value")
          return `${subject} must be one of ${i.options.join(", ")}${text === undefined ? "" : ` (got “${String(text)}”)`}.`;
        if (i.code === "invalid_type")
          return `${subject} must be ${i.expected === "integer" ? "a whole number" : `a ${i.expected}`}${i.received === "undefined" ? " but is missing" : ""}.`;
        if (i.code === "invalid_literal")
          return `${subject} must be ${JSON.stringify(i.expected)}.`;
        return `${subject}: ${i.message}`;
      }),
    ),
  ];
}
const seedSchema = z.number().int().min(0).max(4294967295);
function titleFor(input: Input, type: PuzzleType, builtIn: boolean): string {
  const given = input.title?.trim();
  if (given) return given;
  return builtIn ? `${LABELS[type]} · In the garden` : LABELS[type];
}
export function generateDetailed(input: Input): {
  puzzle: Puzzle;
  warnings: Warning[];
} {
  try {
    return generateUnchecked(input);
  } catch (e) {
    if (e instanceof z.ZodError)
      throw new PuzzleError(explainIssues(e, input).join(" "));
    throw e;
  }
}
export const generate = (input: Input): Puzzle =>
  generateDetailed(input).puzzle;
function generateUnchecked(input: Input): {
  puzzle: Puzzle;
  warnings: Warning[];
} {
  const type = z.enum(TYPES).parse(input.type);
  const checkedOptions = optionsInputSchema.safeParse(input.options ?? {});
  if (!checkedOptions.success)
    throw new PuzzleError(
      explainIssues(checkedOptions.error, input.options ?? {}).join(" "),
    );
  const parsedOptions = checkedOptions.data;
  const grid = type === "crossword" || type === "word-search";
  const auto =
    grid && (parsedOptions.autoSize || parsedOptions.size === undefined);
  const options: Options = {
    ...parsedOptions,
    size: parsedOptions.size ?? 18,
    autoSize: auto,
  };
  const seedResult = seedSchema.safeParse(input.seed ?? 1);
  if (!seedResult.success)
    throw new PuzzleError(
      "The seed must be a whole number from 0 to 4294967295.",
    );
  const seed = seedResult.data,
    rand = random(seed);
  const parsed = input.entries
    ? ingest(
        input.entries.map((e) => [e.word, e.clue ?? ""] as [string, string]),
        options,
      )
    : parseWords(input.words ?? DEFAULT_WORDS, options);
  const entries = parsed.entries;
  const quote = (input.quote ?? QUOTES[0]).normalize("NFC");
  if (quote.length > 600)
    throw new PuzzleError(
      `The quote is ${quote.length} characters; the limit is 600.`,
    );
  const title = input.title?.trim() ?? "";
  if (title.length > 100)
    throw new PuzzleError(
      `The title is ${title.length} characters; the limit is 100.`,
    );
  if ((input.instructions ?? "").length > 300)
    throw new PuzzleError(
      `The instructions are ${input.instructions!.length} characters; the limit is 300.`,
    );
  if (type !== "cryptogram" && !entries.length)
    throw new PuzzleError("Add at least one word to get started.");
  const builtIn =
    type === "cryptogram"
      ? input.quote === undefined
      : input.words === undefined && !input.entries;
  const p: Puzzle = {
    schema: "puzzleloom.puzzle/v1",
    type,
    seed,
    id: `PL-${seed.toString(36).toUpperCase().padStart(4, "0")}`,
    title: titleFor(input, type, builtIn),
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
  if (type === "crossword") {
    const { size, ...layout } = crossword(entries, options, rand, auto);
    Object.assign(p, layout);
    if (auto) p.options = { ...options, size };
  }
  if (type === "word-search") {
    const start = auto
      ? wordSearchSize(entries, options.difficulty)
      : options.size;
    const { size, ...layout } = wordSearch(
      entries,
      { ...options, size: start },
      rand,
      auto,
    );
    Object.assign(p, layout);
    p.options = { ...options, size };
  }
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
  return { puzzle: puzzleSchema.parse(p), warnings: parsed.details };
}
/**
 * Check every guarantee. `blockedWords: false` skips the offensive-word scan;
 * it exists so that older projects and play links, made before the blocklist
 * grew, can still be opened. `check` and `generate` always scan.
 */
export function validate(
  value: unknown,
  { blockedWords: scanBlocked = true }: { blockedWords?: boolean } = {},
): {
  valid: boolean;
  errors: string[];
  puzzle?: Puzzle;
} {
  const parsed = puzzleSchema.safeParse(value);
  if (!parsed.success)
    return {
      valid: false,
      errors: explainIssues(parsed.error, value),
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
      const dirs = directionsFor(p.options.difficulty);
      for (const e of p.entries)
        if (occurrences(p.grid, e.word, dirs).length !== 1)
          errors.push(`${e.word} must occur exactly once.`);
      if (scanBlocked)
        for (const w of blockedWords(p.grid, p.placements, p.entries))
          errors.push(
            `The grid spells a blocked word (${maskWord(w)}). Make the puzzle again with a different seed.`,
          );
      if (
        p.grid.length !== p.options.size ||
        p.grid.some((r) => r.length !== p.options.size)
      )
        errors.push(
          `The grid is ${p.grid[0]?.length ?? 0} × ${p.grid.length} but the options say ${p.options.size} × ${p.options.size}.`,
        );
      if (
        p.placements.some(
          (q) => !dirs.some(([dx, dy]) => dx === q.dx && dy === q.dy),
        )
      )
        errors.push("Direction exceeds difficulty.");
    } else {
      if (
        p.grid.length > p.options.size ||
        (p.grid[0]?.length ?? 0) > p.options.size
      )
        errors.push(
          `The crossword is ${p.grid[0]?.length ?? 0} × ${p.grid.length} but the size option allows at most ${p.options.size} × ${p.options.size}.`,
        );
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
    if (new Set(p.given).size !== p.given.length)
      errors.push("A given letter is listed twice.");
    const expectedGiven = Math.min(
      p.options.givenLetters,
      new Set(sourceLetters).size,
    );
    if (p.given.length !== expectedGiven)
      errors.push(
        `The options ask for ${p.options.givenLetters} given letters (${expectedGiven} possible) but the puzzle has ${p.given.length}.`,
      );
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
  const result = validate(value, { blockedWords: false });
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
