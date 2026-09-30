import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const files = {
  atkinson: "AtkinsonHyperlegibleNext-Regular.ttf",
  opendyslexic: "OpenDyslexic-Regular.otf",
};
const data: Record<string, string> = {};
for (const [name, file] of Object.entries(files))
  data[name] = (await readFile(resolve(root, "assets/fonts", file))).toString(
    "base64",
  );
await writeFile(
  resolve(root, "packages/render/src/fonts.generated.ts"),
  "// Generated from unmodified font sources by pnpm assets.\nexport const FONT_DATA = " +
    JSON.stringify(data) +
    " as const;\n",
);
await mkdir(resolve(root, "apps/web/public/fonts"), { recursive: true });
for (const file of Object.values(files))
  await copyFile(
    resolve(root, "assets/fonts", file),
    resolve(root, "apps/web/public/fonts", file),
  );
console.log("Prepared embedded fonts for browser, CLI and PDF.");
const { zodToJsonSchema } = await import("zod-to-json-schema");
const { puzzleSchema } = await import("../packages/core/src/index");
await writeFile(
  resolve(root, "apps/web/public/puzzleloom.schema.json"),
  JSON.stringify(
    zodToJsonSchema(puzzleSchema, {
      name: "PuzzleloomPuzzle",
      target: "jsonSchema7",
    }),
    null,
    2,
  ) + "\n",
);
await writeFile(
  resolve(root, "apps/web/public/llms.txt"),
  `# Puzzleloom\n\nLocal, deterministic word-puzzle generator. No API keys or network services.\n\n## Commands (from the repository)\n- pnpm puzzleloom make crossword --words words.txt --seed 42 --out puzzle.json --pdf puzzle.pdf --json\n- pnpm puzzleloom render puzzle.json --pdf class.pdf --variants 30 --key appended --json\n- pnpm puzzleloom check puzzle.json --json\n- pnpm puzzleloom link puzzle.json --json\n- pnpm puzzleloom book book.json --pdf book.pdf --json\n- pnpm mcp (stdio MCP server)\n\nTypes: crossword, word-search, scramble, cryptogram.\nProject schema: /puzzleloom.schema.json (puzzleloom.puzzle/v1).\nWord rows: WORD: clue, tab-separated, spaced dash, or CSV. Up to 40 words and 30 letters per word.\nMCP tools: create_puzzle, validate_puzzle, render_pdf, render_image, make_play_link, make_book, list_options.\nBook spec: {"files":["puzzle1.json","puzzle2.json"],"key":"appended"}. Paths relative to spec.\nPlay links carry the answers. Import JSON in the maker for editing.\nAll examples and original word lists are CC0. Software MIT; fonts OFL.\n`,
);
