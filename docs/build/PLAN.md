# Implementation plan

Source: the original product specification is preserved in BRIEF.md. Build a static Next.js application over pure, seeded TypeScript engines. SVG and PDF share positioned page primitives; client-side generation runs in a worker. CLI and MCP reuse exactly those engines. No backend, runtime third-party network calls, or secrets.

Sequence: workspace → tested generators and validators → shared rendering → CLI/MCP → maker and player → static discovery pages → browser, privacy, accessibility, licence and performance checks → public documentation.

Crossword search uses deterministic multi-start placement with strict adjacency and connectivity checks, ranking complete candidates by compactness and crossings. Search exhaustion reports unplaced words honestly; it cannot prove an arbitrary input has no possible layout. Word search validates occurrences in all eight directions and rejects ambiguous embedded words when necessary. Renderers fail explicitly on overflow instead of clipping classroom content.

Dependencies and licence evidence are recorded in CREDITS.md and checked by the licence script. No deployment configuration or hosted services.

## Search pages and sources

25 static topic pages are defined in `apps/web/src/content/pages.ts`. Sources are the owner-provided BRIEF.md keyword plan and original authored classroom/event word lists; no live keyword-volume research or scraping is claimed.

- Core terms: crossword maker, word search maker/generator/printable, word scramble maker/generator, cryptogram maker, puzzlemaker, crossword puzzle maker, crossword maker with answer key, printable crossword maker. Rationale: match the named task and expose a ready, functional example.
- Classroom: vocabulary crossword, spelling word search, large-print puzzles, Spanish word search, ESL crossword. Rationale: concrete pedagogical needs, accent handling and print-size guidance.
- Events: Christmas, Halloween, Thanksgiving, back to school, baby shower, bridal shower, birthday. Rationale: useful original seasonal/event lists with customization guidance.
- Makers: puzzle book maker and word search book generator. Rationale: explain CLI books and reusable original content without promising custom KDP trim sizes.

Design tokens follow the brief. Muted text and error colors were adjusted for accessible contrast. The static UI copy is centralized in `apps/web/src/content/ui.ts`; sample page content is in `pages.ts`. Dynamic status strings and engine errors remain close to their calculations.

Owner-approved transitive licence exceptions are documented in CREDITS.md: caniuse-lite / CC-BY-4.0, minimatch / BlueOak-1.0.0, pako / MIT AND Zlib. Sharp/libvips was removed. The complete installed inventory is DEPENDENCIES.md.
