// Regenerates tests/golden/*.json from the engine (input + seed -> exact output).
// Run with `pnpm exec tsx scripts/golden.ts`. Never edit the golden files by hand.
import { writeFile } from "node:fs/promises";
import { generate, TYPES } from "../packages/core/src/index";

for (const type of TYPES) {
  const puzzle = generate({ type, seed: 42 });
  await writeFile(
    new URL(`../tests/golden/${type}.json`, import.meta.url),
    JSON.stringify(puzzle, null, 2) + "\n",
  );
  console.log(`wrote tests/golden/${type}.json`);
}
