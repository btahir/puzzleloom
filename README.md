# Puzzleloom

**Your words. A world of puzzles.** Make a crossword, word search, word scramble, or cryptogram, then print it with its answer key. Free, no account, no watermark, and no uploads.

Puzzleloom runs entirely in your browser. It includes Letter/A4 vector PDFs, class sets with distinct arrangements, separate answer keys, SVG/PNG exports, project files, local saved puzzles, and shareable playable links. The maker has Paper and Chalkboard themes and a mobile layout. The CLI and local MCP server use the same deterministic engines as the website.

## Run locally

Requires Node.js 22.13+ and pnpm 11.19.0 (pinned through Corepack).

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The development server uses port **4317**. `pnpm install` prepares the local font bundles and schema. If your environment restricts writes to your home directory, see [cloud tool activation](docs/build/ENVIRONMENT.md).

```bash
pnpm build        # Static export in apps/web/out
pnpm preview      # Serve the static export on port 4317
pnpm test         # Unit, property, golden, PDF, CLI and MCP tests
pnpm e2e          # Chromium acceptance, accessibility and privacy tests
pnpm verify       # Typecheck, lint, tests, licences, static build, E2E and dev smoke
pnpm bench        # Crossword benchmark → docs/build/bench.md
```

Stop your own development server before `pnpm verify`; the final smoke check starts an isolated dev process on port 4318.

Browser tests use `CHROMIUM_PATH` when provided, otherwise system Chromium if installed. On other machines, run `pnpm exec playwright install --with-deps chromium`. Only Chromium is required. The production build has no runtime service dependencies; the development server’s HMR requests are development-only.

## Make a puzzle

1. Type one word per line. Add clues after a colon, a tab, or a spaced dash. CSV/TSV and text-file import also work.
2. Choose a puzzle type, title, paper, font, and difficulty. Reshuffle for a new seed.
3. Check the actual page preview, then download a PDF. Class sets support 1–40 distinct versions, with keys collected at the back or in a separate file.

“Save” stores a puzzle in this browser’s IndexedDB. Export a `.puzzleloom.json` file to back it up or move it to another device. A play link stores its data in the URL fragment, including the answers; it is useful for practice, not secure assessment.

## CLI and MCP

```bash
pnpm puzzleloom make crossword --words words.txt --seed 42 \
  --out lesson.puzzleloom.json --pdf lesson.pdf
pnpm puzzleloom check lesson.puzzleloom.json
pnpm puzzleloom render lesson.puzzleloom.json --variants 30 --pdf class.pdf
pnpm puzzleloom render lesson.puzzleloom.json --svg --out lesson.svg
pnpm puzzleloom link lesson.puzzleloom.json
pnpm mcp
```

Scripts and agents should call the CLI directly with Node, because `pnpm <script>` appends its own `[ELIFECYCLE]` line to stdout when a command fails, which breaks `--json`:

```bash
node packages/cli/bin.mjs make crossword --words words.txt --seed 42 --json
```

(`pnpm exec tsx packages/cli/src/index.ts ...` is equivalent.) With `--json`, stdout is always exactly one JSON document: `{"ok":true,"result":...}` on success, `{"ok":false,"error":"..."}` on failure (plus `errors` for a failed `check` and `words` when specific words are to blame). Exit codes are stable: 0 success, 1 input or runtime failure, 2 unknown command.

Types: `crossword`, `word-search`, `scramble`, and `cryptogram`. For cryptograms use `--quote "Your message"` or a text file with `--words`. `--key` accepts `appended`, `separate`, or `none`. Run `pnpm puzzleloom --help` for options.

`--size` is `auto` by default: the engine picks the smallest comfortable grid for your list (crosswords widen the allowed box only until a layout fits, then keep the most compact one; word searches scale with the letter count and difficulty). Give `--size 8..30` to force an exact size. The size used is recorded in the project as `options.size`, with `options.autoSize` saying whether the engine chose it. `make` also returns `warnings`, an array of `{code, word, message}` for anything it changed or skipped in your list: characters removed from a word (`H2O` becomes `HO`), lines without letters, and duplicates. Text output prints them to stderr as `warning: ...`.

Word-search fill never spells a word from the built-in blocklist (English, plus brief Spanish, French and German profanity and slurs) in any of the eight directions, and `check` flags a grid that does. A word you typed yourself is exempt, and so is a blocked sequence inside one of your own words.

A book spec is `{"files":["lesson.puzzleloom.json","another.puzzleloom.json"],"title":"Our puzzle book","key":"appended"}`. Paths are relative to the spec. Run `pnpm puzzleloom book book.json --pdf book.pdf`.

The MCP server exposes `create_puzzle`, `validate_puzzle`, `render_pdf`, `render_image`, `make_play_link`, `make_book`, and `list_options` over stdio. See [AGENTS.md](AGENTS.md) for connection details. The file format is `puzzleloom.puzzle/v1`, described in [the generated JSON schema](apps/web/public/puzzleloom.schema.json).

## How it is built

- `packages/core`: Unicode normalization, seeded PRNG, four generators, independent validation, project schema and compressed play links.
- `packages/render`: one positioned page layout for SVG previews and deterministic PDFs, with embedded fonts and pagination.
- `packages/cli`, `packages/mcp`: local agent interfaces over the same engines.
- `apps/web`: Next.js static export. Generation and PDF work run in a Web Worker; saved projects use IndexedDB.

Examples and quotes are original CC0 material. The UI uses Young Serif and Atkinson Hyperlegible Next; OpenDyslexic is an optional print font. The original desk illustration was generated specifically for Puzzleloom. Full attributions and approved transitive licence exceptions are in [CREDITS.md](CREDITS.md).

## Verification and limits

The current acceptance evidence, measured performance and remaining manual checks are in [ACCEPTANCE.md](docs/build/ACCEPTANCE.md). The original product brief is preserved in [BRIEF.md](docs/build/BRIEF.md).

- Crossword search is bounded. Every successful result places all words in a connected, validated grid; unsuccessful searches explain which words could not be placed. It does not prove arbitrary inputs are mathematically impossible.
- Word search rejects contained/reversed-contained entries that would make an exactly-once puzzle ambiguous. The small documented blocklist is not a comprehensive content filter.
- The engines preserve Unicode letters. The bundled print fonts cover the supported Latin-language alphabets; unsupported glyphs cause an explicit export error. Universal-script font coverage is not claimed.
- Large-print grids may require fewer words or a smaller grid. Long clues and quotes paginate rather than being clipped.
- Distinct class-set layouts may be exhausted for tiny inputs; the export reports this instead of silently repeating an arrangement.
- After the page has loaded, generation, saving and export work offline. An offline first visit or offline navigation to another page is not supported by a service worker.
- Chromium is automated. Physical printers and real Safari/Firefox devices still need owner checks. Deployment is intentionally left to the owner.

Actual light/dark screenshots and eight-second animated WebP previews are generated in the ignored `docs/launch/media/` directory by `scripts/review-screens.ts` and the documented media workflow. They are available in the prepared workspace; no external media hosting or publication is performed.

MIT © Bilal Tahir. Fonts use OFL-1.1. Contributions are optional through the app’s Support page; every feature remains free.
