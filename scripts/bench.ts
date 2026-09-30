import { writeFile } from "node:fs/promises";
import {
  generate,
  validate,
  letters,
  PuzzleError,
} from "../packages/core/src/index";
const words =
  "GARDEN FLOWER WATER EARTH LEAF STEM ROOT SEED SUN GROW PLANT RAIN SOIL GREEN PETAL BLOOM FRUIT BRANCH TREE GRASS STONE BIRD NEST WORM CLOUD LIGHT SHADE POND RIVER FIELD FOREST PATH APPLE PEACH BERRY HERB MOSS FERN CLOVER MEADOW".split(
    " ",
  );
let output =
  "# Crossword benchmark\n\nRun with `pnpm bench`. Timings are machine-dependent; 30 seeds per size, maximum grid 30. Synthetic garden vocabulary is original CC0 data.\n\n| Words | Complete | Valid | p95 ms | Mean crossings/word | Mean bounding area |\n|---|---:|---:|---:|---:|---:|\n";
for (const size of [10, 15, 25, 40]) {
  const times: number[] = [],
    areas: number[] = [],
    crossings: number[] = [];
  let complete = 0,
    valid = 0;
  for (let seed = 0; seed < 30; seed++) {
    const start = performance.now();
    try {
      const p = generate({
        type: "crossword",
        words: words.slice(0, size).join("\n"),
        options: { size: 30 },
        seed,
      });
      times.push(performance.now() - start);
      complete++;
      if (validate(p).valid) valid++;
      const total = p.placements.reduce(
          (n, q) => n + letters(q.word).length,
          0,
        ),
        cells = p.grid.flat().filter(Boolean).length;
      crossings.push(((total - cells) * 2) / size);
      areas.push(p.grid.length * p.grid[0].length);
    } catch (e) {
      times.push(performance.now() - start);
      if (!(e instanceof PuzzleError)) throw e;
    }
  }
  times.sort((a, b) => a - b);
  const mean = (a: number[]) => a.reduce((n, x) => n + x, 0) / a.length;
  output += `| ${size} | ${complete}/30 | ${valid}/30 | ${times[28].toFixed(1)} | ${mean(crossings).toFixed(2)} | ${mean(areas).toFixed(0)} |\n`;
}
output +=
  "\nAwkward input: AAA / ZZZ is rejected with a disconnected-word explanation. Arbitrary connected word lists are not guaranteed solvable by the bounded heuristic; incomplete searches fail explicitly, never dropping words.\n";
await writeFile("docs/build/bench.md", output);
console.log(output);
