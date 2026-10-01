# Build progress

## Product build — started

Inspected the initial specification-only repository and preserved the original brief. Created the feature branch and workspace structure. The owner authorized implementation and local validation, excluding deployment. Automated checks are pending implementation.

## Product implementation and verification

Implemented the pnpm/TypeScript workspace; pure seeded crossword, word-search, scramble and cryptogram engines; semantic project validation; compressed play links; shared SVG/PDF layout; distinct class sets and books; CLI and seven-tool stdio MCP server. Added the static Next.js maker, four playable puzzle types, IndexedDB saves, import/export, Paper/Chalkboard themes, mobile download bar, 25 authored starter pages, support/about/agent pages, discovery files, original generated artwork and code-drawn icons.

The full production verification passed: 40 tests (including 3,400 property cases and real CLI/MCP integration), 22 Chromium checks, typecheck, lint, 397-package licence audit and static export. The owner approved the three documented transitive exceptions. All 120 benchmark cases placed every word, with a 25-word p95 near 25 ms. Lighthouse measured home 90/100 performance/accessibility and landing 92/100. Four-times CPU slowdown measured 1,635 ms initial readiness, 658 ms type switch, and 431 ms PDF download.

Visual review led to two-column default crossword clues, SVG arrow icons, and a same-tab play-link regression fix. Development testing found an asynchronous worker initialization race; an explicit ready handshake fixed it. Local-origin HMR was configured, framework-generated agent files were disabled, and generated next-env.d.ts was removed from tracking. The manual dev smoke then passed with no page errors. An automated dev smoke was added to pnpm verify for the final rerun.

All repository payment/site constants remain untouched. No deployment or application publication was attempted. GitHub API access returned Forbidden; local Git commits preserve the work even if PR creation is unavailable. Remaining owner/device items and product limits are explicitly listed in ACCEPTANCE.md, OWNER-TODO.md and the public README. The original brief is retained in BRIEF.md.

## Final local validation

The final `pnpm verify` completed successfully after the worker-handshake fix: typecheck, lint, 40 unit/property/integration tests, 397-package licence audit, static build, 22 Chromium acceptance tests, and the automated development smoke. The dev smoke started its own server, confirmed HTTP 200, switched puzzle type, downloaded a PDF, observed no page errors, and stopped the server.

The reusable cloud install_script and start_skill were saved and the installer was executed successfully. It includes writable Corepack/pnpm caches, frozen installation, generated fonts/schema, system Chromium readiness and the real startup/verification commands. No new environment snapshot or application deployment was published. Updated screenshots show all four distinct players after the hash-change fix. All code work is retained on feat/puzzleloom-product.

## Review and fix round (2026-10-01)

An owner-side review found the build below the house standard, so a second team of agents fixed it. Summary of what changed:

- **Engine:** a real blocklist (about 190 words, all eight directions, crossings included) so word-search fill can no longer spell slurs; automatic grid sizing for crosswords and word searches (the old 18×18 default failed most 25-word lists); the parser keeps everything after the first delimiter in a clue; word-search containment only checks reversed words when backwards words are on, two-letter words work, larger grids no longer fail more often; neutral per-type default titles; plain-language validation errors; a structured warnings array for removed characters, skipped lines and duplicates; clean single-document `--json` output via `node packages/cli/bin.mjs`.
- **Print:** the sheet layout was redesigned. Grids are sized to the page (a 10-word crossword now spans about 77% of the content width), with a clear title, a writable Name/Date/Class line, ruled clue headings, a word bank in columns, capsule-outlined word-search keys, a letter-key strip for cryptograms, and text sizes S–XL that scale everything. Short puzzles stay on one page per sheet and key.
- **Web:** the maker leads the homepage; the copy was rewritten in a plain teacher's voice; the mark spells PEN/PAD; an Auto grid size control; visible errors with a dimmed stale preview; a mobile menu; 44 px touch targets; a sticky preview and Download row; an Enlarge view; landing pages with real guidance, FAQs, presets, FAQPage JSON-LD and a code-drawn social card; crossword player word/clue highlighting; word-search highlighter strokes with a live drag stroke; downloads named after the title; a fresh printed ID per new puzzle.
- **Packaging:** public README in the house style, light/dark hero loops and screenshots in `docs/media/` and `docs/screenshots/`, outlined wordmarks, a 32-second launch film and launch-copy drafts (both local only).
- **Review:** three rounds by independent design critics; the final round's single blocker (dark-theme crossword marks) was fixed with an e2e test, which the critic set as the condition for sign-off.
