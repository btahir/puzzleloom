# Puzzleloom

> **Status: pre-build spec.** This README is the product brief for the agent that builds Puzzleloom (see [AGENTS.md](AGENTS.md) for working rules). It will be rewritten into the public README in the final milestone.

**Make a crossword, word search, word scramble or cryptogram from your own word list in about a minute, then print it with the answer key.** Free, no account, no ads, and your words never leave your browser.

- Site: `https://puzzleloom.vercel.app` (fallbacks: `getpuzzleloom`, `puzzleloom-app`). The owner deploys; the name lives in one `SITE_URL` constant.
- Licence: MIT.
- Owner: Bilal Tahir. Builder: Codex (cloud), working only from this repo.

---

## 1. Why this exists

Teachers, parents, event hosts and puzzle-book makers make word puzzles every week. The tools they use today:

| Tool | What hurts |
|---|---|
| WordMint (~350k visits/mo) | Account wall; PDF and Word export cost $5.99/mo |
| BrightSprout / Crossword Hobbyist | $5–10/mo; its own page says auto-arrange places all words only "~90% of the time" |
| Discovery Education Puzzlemaker (#1 for "word search maker") | Free but ad-supported, dated and barely customisable |
| Crossword Labs (~165k visits/mo) | Crosswords only; free puzzles are public and indexed; privacy costs $9.95 |
| TheWordSearch.com, Teacher's Corner, Flippity | Ads, character caps, one puzzle type each, or a Google Sheets workaround |
| New "no paywall" clones (makeacrossword.org and others) | Free, but thin: one type, greedy layouts that drop words |

Free alone doesn't win this category, because free options already exist. **Puzzleloom wins on four things nobody combines:**

1. **Layout quality you can trust.** Every word is placed in one connected, compact grid that fits the page, or we tell you exactly which word can't fit and why. No silent drops.
2. **Every type, one tool, print-first.** Crossword, word search, scramble and cryptogram share one word list, one print system and one answer-key system. The printed sheet is the product, and it looks like it came from a publisher.
3. **Built for a classroom.** Class sets (30 different versions of the same puzzle, each with its own key and ID), large print, an OpenDyslexic font option, accented letters and other alphabets, and play links for Chromebooks.
4. **Agent-first.** A CLI and a local MCP server run the same engine, so someone's AI assistant can write the clues and Puzzleloom guarantees a valid grid and answer key. LLMs can write clues, but they can't lay out a crossword.

**One sentence:** the only free puzzle maker that places every word, prints like a publisher, makes a whole class set in one click, and that your AI assistant can drive.

## 2. Who it's for

1. **K-12 and ESL teachers** (main audience): vocabulary review, sub plans, early finishers. They need printable sheets, answer keys and variants. Many work on Chromebooks.
2. **Parents and homeschoolers**: spelling lists, birthday and holiday activities.
3. **Event hosts**: baby showers, weddings, church groups, office parties. They care about how it looks and about themes.
4. **Small publishers and puzzle-book makers** (Amazon KDP interiors, newsletters, activity packs). They need bulk generation and commercial use; MIT gives them the second.
5. **Agents acting for any of the above**, through the CLI and MCP.

## 3. Product scope (v1)

### Making a puzzle

- **One word list, many puzzles.** Paste or type words, one per line, optionally with clues: `WORD: clue`, `WORD - clue` or `WORD<TAB>clue`. Also accept CSV/TSV and `.txt` import. Clean up automatically: trim, dedupe, normalise case, flag words that are too long for the grid.
- **Switch type without retyping.** Tabs for Crossword, Word search, Scramble and Cryptogram all read the same list. (A cryptogram uses a quote or sentence instead; it has its own text box.)
- **Live preview of the actual printed page.** The preview is the page, drawn from the same layout engine as the PDF. What you see is what prints.
- **Reshuffle.** New seed, new layout. Every puzzle has a short printed ID (e.g. `PL-7K3Q`) that encodes its seed.
- **Title, instructions, and Name / Date / Class fields**, all editable, with good defaults per type and difficulty.

### Puzzle types

| Type | v1 behaviour | Quality guarantees (tested) |
|---|---|---|
| **Crossword** (freeform criss-cross, the teacher style) | Clues across and down, standard numbering, word bank optional | All words placed in one connected grid, or a clear explanation of the words that can't be (e.g. "ZEBRA shares no letters with the others"). No accidental adjacent letters that form fake words. Compact bounding box. Many seeded restarts in a Web Worker; the best-scoring layout wins within a time budget. |
| **Word search** | Grid 8×8 to 30×30; Easy (→ ↓), Medium (+ diagonals), Hard (all 8 directions, backwards); word bank; optional shapes later | Every word appears exactly once, with no accidental second copy. Fill letters follow the words' letter mix so there are no giveaways. Fill never spells a word from a small blocklist of offensive words. |
| **Word scramble** | Scrambled words with blanks; hint options (first letter, clue) | The scramble never equals the word. Letters stay the same multiset. |
| **Cryptogram** | Letter-substitution cipher of a quote; optional given letters; includes a small bank of public-domain quotes that we write out and source ourselves | No letter maps to itself. Punctuation and spacing are kept. The key checks against the plaintext. |

v1.1 candidates (don't build unless v1 is done): fill-in (criss-cross fill-it-in), missing vowels, word match, word search shapes (heart, star, circle), image clues.

### Printing and export

- **Vector PDF**, US Letter or A4 (default by browser locale), with real embedded fonts. It stays crisp at any size and is toner-friendly: pure black on white, with nothing that relies on colour.
- **Answer key** on its own page, or as a separate PDF, or left out. In the key, found words are circled or shaded grey, and crossword keys show filled grids.
- **Class set:** N versions (2–40) of the same words, each with a different layout and printed ID, exported as one PDF with every key at the back, or as separate student and key PDFs.
- **Size and access options:** font size S/M/L/XL (XL is large print), an OpenDyslexic font option, and letter spacing that stays readable for young kids.
- **PNG and SVG** of the puzzle for slides, Google Docs and worksheets.
- **Print** straight from the browser, using the same PDF.

### Play online (share link, no server)

- The **"Play link"** encodes the whole puzzle in the URL fragment (`/play/#…`, compressed). The fragment is never sent to any server, so the link works without a backend and never expires.
- **Crossword player:** keyboard navigation like the big newspaper apps, touch-friendly, check a letter, word or puzzle, and reveal if the maker allowed it.
- **Word search player:** drag to select, with both mouse and touch; found words are struck through.
- **Scramble and cryptogram players:** type the answers, then check them.
- **Honesty:** a play link contains the answers (obfuscated, not secret). The UI says so plainly. A "student link" without answers, with a hand-in code the teacher checks against their key, is a v1.1 idea; design the schema so it can be added.

### My puzzles

- **Saved in the browser:** puzzles are stored in IndexedDB, with a list of recent puzzles, duplicate and delete.
- **Project files:** export and import one `.puzzleloom.json` file (the documented, versioned schema in section 5). A project file, play link and CLI output are the same data.

### Languages

- **Any language's letters:** Unicode-safe throughout. Alphabet packs for fill letters: English, Spanish (Ñ), French, German (Ä Ö Ü; ß→SS option), Portuguese, Italian and Dutch. There's an option to strip accents for young learners.
- **UI in English** for v1, with every string in one place so translation is easy later.

## 4. Brand and design

**Personality: a well-kept teacher's desk.** Warm paper, sharp pencils, a red pen for the answers. It's tidy and friendly, a little playful, and never childish. The printed sheet is the hero; the app frames it like a document on a desk.

### Themes

- **Light "Paper":** a warm off-white desk with bright white sheets on it.
- **Dark "Chalkboard":** a deep green-slate board with chalk-white text.
- **Printed output is always black on white,** whatever the theme.

### Colour tokens (starting point; tune for WCAG AA and record the final values)

| Token | Paper (light) | Chalkboard (dark) | Use |
|---|---|---|---|
| `--bg` | `#FAF6EC` | `#1E2A26` | App background (the desk or board) |
| `--surface` | `#FFFFFF` | `#26352F` | The sheet preview, panels |
| `--ink` | `#1D2230` | `#EDEBE3` | Main text |
| `--ink-muted` | `#5B6170` | `#A7B0A9` | Secondary text |
| `--rule` | `#E3DAC6` | `#3A4A43` | Borders, grid lines in the UI |
| `--primary` (blue ink) | `#2F55A4` | `#93B4E6` | Primary buttons, links, focus ring |
| `--highlight` (pencil yellow) | `#F2C14E` | `#EBCB76` | Selected word, active cell, found words |
| `--mark` (red pen) | `#C5402F` | `#E6897A` | Answer-key marks and errors **only** |

Colour rules:

- There are three accents, each with one job; no other hues.
- No gradients, glass or glow.
- Found words in the word search player use a highlighter-stroke effect in `--highlight`. That is the one piece of decorative flourish.

### Type

All fonts are self-hosted from npm (`@fontsource/*`), never loaded from Google at runtime. Verify each licence and record it in `CREDITS.md`.

- **Headings and wordmark:** Young Serif (OFL). It's warm and bookish, and not the usual startup serif.
- **UI, clues and grid letters:** Atkinson Hyperlegible Next (OFL). It was designed for legibility, which is a real story for kids and low-vision readers. Use tabular figures for clue numbers.
- **Optional font:** OpenDyslexic, from `@fontsource/opendyslexic`. Its licence is checked: SIL OFL 1.1 with the Reserved Font Name "OpenDyslexic".
  - Ship the npm files unmodified; embedding them in generated PDFs is fine.
  - Don't edit, rebuild or re-subset the web font files and still call them OpenDyslexic.
  - It's an option the user picks, never the default.
  - **Copy rule:** don't claim it improves reading, because studies haven't shown that it does. Call it "OpenDyslexic font", not "dyslexia-friendly".

### Logo

- **Mark:** a small interlocking letter-tile mark in SVG, three or four square tiles where an across word and a down word share a letter, like threads crossing on a loom.
- **Wordmark:** "Puzzleloom" in Young Serif.
- **Favicon:** the mark alone.
- Draw it all as code/SVG, not generated raster.

### Motion

- **Generate:** when a layout is generated, tiles settle into the grid with a short staggered drop, under 400 ms in total.
- **Word search:** selection draws like a highlighter.
- Everything respects `prefers-reduced-motion`.

### Layout of the maker

- **Desktop:**
  - The word list sits on the left.
  - The live page preview is in the centre, at true paper proportions.
  - Options go on the right: type, size, difficulty, font, answer key, class set.
  - One clear primary action: **Download PDF**.
  - Secondary actions: Print, Play link, PNG/SVG, Save.
- **Mobile:** type tabs sit on top, then the word list, then the preview, with a sticky Download bar.

### Voice

- **Plain, short and specific.** "Answer key is on page 2." "SPHINX didn't fit: it shares no letters with the other words. Add a word with S, P, H, I, N or X."
- **No hype words** (elevate, seamless, supercharge, unleash).
- **No emoji in the UI.**

### Anti-slop checklist (for the builder and for self-review). Avoid:

1. Gradients everywhere, or purple as the default.
2. Rainbow colour with no hierarchy.
3. Pulsing badges that carry no meaning.
4. Rounded "fingernail" cards on everything.
5. Emoji sprinkled through the UI.
6. Misaligned icons and SVGs.
7. Generic fonts (Inter, JetBrains Mono everywhere) or "//" decorations.
8. Redundant text ("Built with…", repeated labels).
9. Glassmorphism as the default look.
10. Generic taglines.

The bar is the best-looking puzzle maker on the web, in both themes, and printed sheets a teacher would be proud to hand out.

## 5. Agent-first

**The three questions:**

1. **If an agent did this job, would a person still open Puzzleloom?** Yes. The output is a physical sheet a person hands to kids or guests, and a person judges how it looks and approves it before printing. Agents write clues well but can't reliably lay out a valid grid, so they need an engine.
2. **What would an agent call it for?** For example: "Make a 15-word vocabulary crossword for chapter 4 with clues, 30 versions, keys at the back, as a PDF." It needs a word list with clues, a type, options and a seed, and it wants back a puzzle JSON, a validation report, a PDF path and a play link.
3. **The agent-first version:** a headless engine with a deterministic CLI and MCP server. The agent brings the words and clues, and Puzzleloom guarantees the layout, the printing and the key. The web app is where a person tweaks and approves, opened straight from the agent's file or link.

### Surfaces (all over one pure core)

- **CLI** (`puzzleloom`, `--json` on every command, stable exit codes):
  - `make <type> --words words.txt [--seed N] [--out puzzle.puzzleloom.json] [--pdf out.pdf] [--key appended|separate|none]`
  - `render <file> --pdf out.pdf [--paper letter|a4] [--variants N] [--png|--svg]`
  - `check <file>`: re-validates every guarantee and prints a report.
  - `link <file>`: prints a play URL.
  - `book <spec.json> --pdf book.pdf`: many puzzles in one PDF, with page numbers and solutions at the back. This is the base for puzzle-book makers.
  - `mcp`: starts the stdio MCP server.
- **MCP tools:** `create_puzzle`, `validate_puzzle`, `render_pdf`, `render_image`, `make_play_link`, `make_book` and `list_options`. Inputs and outputs are JSON-schema; files are passed by path; no network, no keys.
- **File format:** `puzzleloom.puzzle/v1`, a JSON Schema published in the repo and on the site. It holds the words and clues, the options, the seed and the solved layout. Round-trip import and export are tested.
- **Hand-off:** a project file or play link opens straight in the maker for a person to tweak.
- **Docs for agents:** `AGENTS.md` usage section (CLI, MCP, schema, worked examples) and `llms.txt` on the site.
- **No built-in LLM and no API keys.** The user's own agent supplies the clues.

## 6. Site map and search pages

| Page | Purpose |
|---|---|
| `/` | The maker, with Crossword preselected, and a short, honest pitch below the fold |
| `/crossword-maker/`, `/word-search-maker/`, `/word-scramble-maker/`, `/cryptogram-maker/` | Main tool pages. Each opens the maker preset for that type. |
| `/play/` | The player; the puzzle comes from the URL fragment |
| `/support/` | Donation page (see section 8) |
| `/about/` | Open source, privacy, layout guarantees, credits |
| `/agents/` | CLI, MCP and file-format docs for people and agents |
| `/llms.txt`, `/sitemap.xml`, `/robots.txt` | Discovery |

**Keyword landing pages** are static and indexable. Each one has real content: a sample puzzle rendered at build time, a ready word list, tips, and a button that opens the maker with that preset. The volumes below are Semrush estimates for the US.

- **Core:**
  - word search maker (27k), word search generator (27k), word search printable (27k)
  - crossword puzzle maker, crossword maker with answer key, printable crossword maker
  - puzzlemaker (8k)
  - cryptogram maker, word scramble generator
- **Audience:** vocabulary crossword maker, spelling word search, large print word search maker, Spanish word search maker, ESL crossword maker.
- **Seasonal and event:** Christmas word search (9.9k), Halloween, Thanksgiving, back to school, baby shower crossword, bridal shower word search, birthday word search.
- **Makers:** puzzle book maker, word search book generator for KDP.

**Rules for the pages:**

- Every word list and example on these pages is written by us and released under CC0. Nothing is scraped.
- Target about 25 pages in v1.
- Record each keyword, its reasoning and its source in `docs/build/PLAN.md`.

## 7. Architecture

- **Monorepo:** pnpm workspace, TypeScript strict, Node 22+.
  - `packages/core`: pure TypeScript with no DOM. It holds:
    - A seeded PRNG.
    - The word-list parser.
    - The four generators and the crossword layout optimiser and scorer.
    - The validators (the guarantees in section 3).
    - The schema, with runtime validation.
    - The play-link codec (compressed, versioned).
  - `packages/render`: one **sheet layout engine** (page → positioned boxes). It has two back ends from the same layout: SVG for the web preview and PNG, and PDF via `pdf-lib` + `@pdf-lib/fontkit`. Same input + seed gives an identical PDF, with fixed metadata dates.
  - `packages/cli` and `packages/mcp`: thin layers over core and render (`@modelcontextprotocol/sdk`).
  - `apps/web`: Next.js App Router with `output: 'export'` (static), React and Tailwind using the tokens above. Generation runs in a Web Worker. IndexedDB holds saved puzzles.
- **Dependencies:** MIT, Apache-2.0, BSD, ISC and MPL-2.0 (unmodified) only. Fonts are OFL, data CC0.
  - No GPL/AGPL, which rules out crosshare, genxword, Wizium and heatherleaf/crossword-maker. Don't copy their code.
  - MIT references worth reading for ideas: MichaelWehar/Crossword-Layout-Generator (known to drop words; beat it), bunkat/wordfind, JaredReisinger/react-crossword, viresh-ratnakar/exolve.
- **Zero network requests after load:** fonts are bundled. No analytics, no backend, no accounts. It works offline once loaded.

## 8. Money and support

- **Free forever:** no paywall, no locked features, no watermark, no ads.
- **Support page:** `/support/` reads the shared `DONATION_LINKS` constant. It already exists in [apps/web/src/config/site.ts](apps/web/src/config/site.ts), the only place Stripe URLs may appear. One-time is the main button, with the monthly tiers below it.
  - Link it from the header, footer, about page and the moment of value.
  - Add it to the sitemap.
- **Moment of value:** after the first successful PDF download, once per session, show a small dismissible note that never blocks. Suggested copy: "WordMint charges $5.99 a month for PDF downloads. This one was free. Help keep it that way?"
- **Later income, not built now:** pro template packs, a puzzle-book (KDP) workflow, a paid desktop build. Don't block them in the architecture.

## 9. Quality bars and verification

Every feature needs an automated check before it counts as done. Record the full list in `docs/build/ACCEPTANCE.md`.

- **Generators:**
  - Property tests (fast-check) over thousands of random word lists for every guarantee in section 3.
  - Golden files: fixed input + seed → exact expected puzzle JSON.
- **Crossword quality benchmark:** a fixed suite of real-looking word lists (10, 15, 25 and 40 words, with and without awkward words).
  - Report placement rate, connectivity, crossings per word, bounding-box area and time taken.
  - Target: 100% placement whenever a connected layout exists, and p95 under 500 ms for 25 words.
  - Keep the numbers in the repo.
- **PDF:**
  - Parse every generated PDF back (pdfjs-dist) and check page count, paper size, that the text is present, and that the key matches the puzzle.
  - Byte-identical output for the same seed.
- **Play links:**
  - Encode → decode round-trip for every type.
  - Link length budget: a 25-word crossword with clues stays under about 2,000 characters.
- **CLI/MCP:** golden JSON outputs, exit codes, and scripted MCP tool calls.
- **Web** (Playwright, headless Chromium):
  - The maker → PDF flow for every type.
  - The player for every type, with keyboard and touch.
  - Save, reload, export and import.
  - Screenshots in light and dark.
- **Accessibility:** axe with no serious violations. The whole maker and player work by keyboard. The grid has proper roles and labels so screen readers and browsing agents can use it.
- **Performance:**
  - Lighthouse performance ≥ 90 and accessibility ≥ 95 on `/` and on one landing page.
  - The maker is interactive quickly on a school Chromebook-class device (test with 4× CPU throttling).
- **Privacy:** a Playwright test asserts zero network requests after load while making, exporting and playing.
- **Licences:** a licence check script fails on any disallowed licence.
- **Browsers:** Chrome is the acceptance bar. Research known Safari, Firefox and Edge issues (print dialogs, Pointer Events on the grid, fonts in PDF) and fix them in theory.

## 10. Build order

Each step is one or more PRs, and each leaves `main` green.

1. **Scaffold:** workspace, TypeScript, lint, test runner, and the `pnpm verify` script. Create `docs/build/PLAN.md`, `ACCEPTANCE.md` and `PROGRESS.md`.
2. **Core:** PRNG, schema, parser, and the word search, scramble and cryptogram generators with property tests.
3. **Crossword engine:** layout optimiser, scorer and benchmark. This is the heart of the product, so spend the effort here.
4. **Render:** sheet layout → SVG and PDF, answer keys, class sets, PDF tests.
5. **CLI and MCP,** with golden tests and the AGENTS.md usage section.
6. **Design system,** then the maker UI. Build the tokens, type, logo and components first, then the maker, saving, and export/import.
7. **Player and play links.**
8. **Pages:** landing pages, `/support/`, `/about/`, `/agents/`, sitemap, `llms.txt`, OG tags.
9. **Verification sweep:** a11y, Lighthouse, no-network, licences, browser notes. Fix everything found.
10. **Packaging:**
    - Public README: hero loop as an animated WebP in light and dark, one-line promise, demo, features, privacy, run, licence and credits, and a support line.
    - Screenshots, OG image, favicon.
    - Launch copy drafts in `docs/launch/`.
    - Move this brief to `docs/build/BRIEF.md`.

## 11. Out of scope (v1)

- Accounts, cloud sync, classrooms or rosters, grading servers.
- AI clue writing inside the app (that's the user's own agent's job).
- American-style dense crosswords that need a dictionary fill.
- Hosting user puzzles or any public gallery.
- A UI in other languages.
- Mobile apps.
- Deploy configs and CI.

## Licence

MIT © Bilal Tahir. Fonts under the SIL Open Font License; see `CREDITS.md`.

If Puzzleloom saves you time, you can [support it](https://puzzleloom.vercel.app/support/).
