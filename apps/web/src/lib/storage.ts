import { openDB } from "idb";
import { readPuzzle, type Puzzle } from "../../../../packages/core/src/index";
export type Saved = { key: string; updated: number; puzzle: Puzzle };
const db = () =>
  openDB("puzzleloom", 1, {
    upgrade(db) {
      db.createObjectStore("puzzles", { keyPath: "key" });
    },
  });
export async function savePuzzle(puzzle: Puzzle, key = crypto.randomUUID()) {
  const database = await db();
  await database.put("puzzles", { key, updated: Date.now(), puzzle });
  return key;
}
export async function listPuzzles(): Promise<Saved[]> {
  return (await (await db()).getAll("puzzles"))
    .sort((a, b) => b.updated - a.updated)
    .map((row) => ({ ...row, puzzle: readPuzzle(row.puzzle) }));
}
export async function deletePuzzle(key: string) {
  await (await db()).delete("puzzles", key);
}
