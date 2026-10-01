import { writeFile } from "node:fs/promises";
import {
  generate,
  validate,
  letters,
  PuzzleError,
  blockedWords,
} from "../packages/core/src/index";
import { W15, W25, W40 } from "../tests/fixtures/lists";

const garden =
  "GARDEN FLOWER WATER EARTH LEAF STEM ROOT SEED SUN GROW PLANT RAIN SOIL GREEN PETAL BLOOM FRUIT BRANCH TREE GRASS STONE BIRD NEST WORM CLOUD LIGHT SHADE POND RIVER FIELD FOREST PATH APPLE PEACH BERRY HERB MOSS FERN CLOVER MEADOW".split(
    " ",
  );
const SEEDS = 60;
const lists: [string, string, number][] = [
  ["Garden 10", garden.slice(0, 10).join("\n"), 10],
  ["Garden 15", garden.slice(0, 15).join("\n"), 15],
  ["Garden 25", garden.slice(0, 25).join("\n"), 25],
  ["Garden 40", garden.join("\n"), 40],
  ["Long words 15", W15, 15],
  ["Long words 25", W25, 25],
  ["Long words 40", W40, 40],
];
const mean = (a: number[]) =>
  a.length ? a.reduce((n, x) => n + x, 0) / a.length : NaN;
const pct = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];

type Stats = {
  complete: number;
  valid: number;
  times: number[];
  areas: number[];
  sizes: number[];
  aspects: number[];
  crossings: number[];
};
function run(
  type: "crossword" | "word-search",
  words: string,
  count: number,
  options: Record<string, unknown>,
): Stats {
  const s: Stats = {
    complete: 0,
    valid: 0,
    times: [],
    areas: [],
    sizes: [],
    aspects: [],
    crossings: [],
  };
  for (let seed = 0; seed < SEEDS; seed++) {
    const start = performance.now();
    try {
      const p = generate({ type, words, options, seed });
      s.times.push(performance.now() - start);
      s.complete++;
      if (validate(p).valid) s.valid++;
      const w = p.grid[0].length,
        h = p.grid.length;
      const total = p.placements.reduce(
        (n, q) => n + letters(q.word).length,
        0,
      );
      s.crossings.push(
        ((total - p.grid.flat().filter(Boolean).length) * 2) / count,
      );
      s.areas.push(w * h);
      s.sizes.push(p.options.size);
      s.aspects.push(Math.max(w, h) / Math.min(w, h));
    } catch (e) {
      s.times.push(performance.now() - start);
      if (!(e instanceof PuzzleError)) throw e;
    }
  }
  s.times.sort((a, b) => a - b);
  return s;
}

let output = `# Crossword and word-search benchmark

Run with \`pnpm bench\`. Timings are machine-dependent; ${SEEDS} seeds per row. "Garden" lists are short original CC0 words; "Long words" lists are realistic classroom vocabulary (7-14 letters) from the test fixtures.

## Crossword, default settings (automatic size)

No size is given, so the engine starts from an estimate and widens the allowed box only when it must, then keeps the most compact layout it finds.

| List | Complete | Valid | p50 ms | p95 ms | Mean size | Mean area | Mean aspect | Crossings/word |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
`;
for (const [name, words, count] of lists) {
  const s = run("crossword", words, count, {});
  output += `| ${name} | ${s.complete}/${SEEDS} | ${s.valid}/${SEEDS} | ${pct(s.times, 0.5).toFixed(1)} | ${pct(s.times, 0.95).toFixed(1)} | ${mean(s.sizes).toFixed(1)} | ${mean(s.areas).toFixed(0)} | ${mean(s.aspects).toFixed(2)} | ${mean(s.crossings).toFixed(2)} |\n`;
}
output += `
## Crossword, explicit sizes

An explicit size is a hard limit: the box never grows past it, and the run fails with an explanation if the list does not fit. Cells show completed layouts out of ${SEEDS}.

| List | 10 | 12 | 15 | 18 | 20 | 24 | 30 |
|---|---:|---:|---:|---:|---:|---:|---:|
`;
for (const [name, words, count] of lists) {
  const cells = [10, 12, 15, 18, 20, 24, 30].map(
    (size) => run("crossword", words, count, { size }).complete,
  );
  output += `| ${name} | ${cells.join(" | ")} |\n`;
}
output += `
## Word search, default settings (automatic size)

Hard difficulty (all eight directions), the same lists. Fill never spells a blocked word; "Blocked words" counts blocklist hits across all ${SEEDS} grids and must be 0.

| List | Complete | Valid | p95 ms | Mean size | Blocked words |
|---|---:|---:|---:|---:|---:|
`;
for (const [name, words, count] of lists) {
  const s = run("word-search", words, count, { difficulty: "hard" });
  let blocked = 0;
  for (let seed = 0; seed < SEEDS; seed++)
    try {
      const p = generate({
        type: "word-search",
        words,
        options: { difficulty: "hard" },
        seed,
      });
      blocked += blockedWords(p.grid, p.placements, p.entries).length;
    } catch (e) {
      if (!(e instanceof PuzzleError)) throw e;
    }
  output += `| ${name} | ${s.complete}/${SEEDS} | ${s.valid}/${SEEDS} | ${pct(s.times, 0.95).toFixed(1)} | ${mean(s.sizes).toFixed(1)} | ${blocked} |\n`;
}
output +=
  "\nAwkward input: AAA / ZZZ is rejected with a disconnected-word explanation. Some small lists have no valid crossing at all (for example OCEAN, LEAF and PEAR: every shared letter sits next to another). Incomplete searches fail explicitly with the words that could not be placed; words are never dropped.\n";
await writeFile("docs/build/bench.md", output);
console.log(output);
