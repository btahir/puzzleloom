# Acceptance evidence

Last full run: 2026-10-01, on the owner's Mac (Chrome), after the review-and-fix round. `pnpm verify` exits 0: typecheck, lint, **101/101** unit/property/integration tests, licence audit of **398** packages, static build, **48/48** Chromium e2e tests (run twice in a row), and the dev smoke. Lighthouse mobile: `/` 91 performance / 100 accessibility; `/large-print-word-search-maker/` 91 / 100; `/christmas-word-search/` 90 / 100.

Fixed in the 2026-10-01 round (each with an automated check):

- [x] Word-search fill never spells a blocklisted word in any direction (3,000-seed property test); `check` flags one.
- [x] Crossword and word-search grids size themselves; every benchmark list (10–40 words, short and long vocabulary) completes on 60/60 seeds at default settings, 25-word p95 under 40 ms. See bench.md.
- [x] Clues containing `:` or ` - ` are kept verbatim; SAW/WAS allowed on easy; two-letter words work; larger grids don't fail more.
- [x] Readable validation errors; structured warnings for altered input; clean `--json` from `node packages/cli/bin.mjs`; old play links still decode.
- [x] Printed sheets fill the page; S–XL scale grid, clues and numbers; XL cryptogram fits one page plus key on Letter and A4.
- [x] Homepage maker above the fold at 1440×900; errors visible in place; mobile menu reaches Support; landing FAQ and JSON-LD present; dark-theme accessibility test no longer races the theme transition.
- [x] Crossword player word highlighting, whole-word check, dark-theme incorrect marks; word-search live highlighter.

## Earlier evidence (Codex build, 2026-09-30)

The complete `pnpm verify` workflow passes in the prepared cloud workspace. Unit/property/integration tests: **40 passed**. Chromium browser acceptance tests: **22 passed** (including the final same-tab play-link regression). No tests are skipped or marked expected-failure.

- [x] Strict TypeScript type checking and ESLint.
- [x] Development-mode smoke: HTTP 200, worker readiness handshake, puzzle-type switching and real PDF download with no page errors. `pnpm test:dev` starts and stops its own dev server.
- [x] Four deterministic puzzle engines with committed seed-42 golden outputs.
- [x] Parser: CSV escaping, commas in colon/dash clues, tabs, headers, duplicates, accent normalization, ß options and input limits.
- [x] 3,400 property cases: seeded permutations, crossword placement/adjacency/connectivity, exactly-once word searches, scramble multisets, and cryptogram derangements/punctuation.
- [x] Crossword benchmark: all 120 synthetic cases complete and valid, across 10/15/25/40-word lists. 25-word p95 about 25 ms on this machine; see bench.md.
- [x] Explicit errors for disconnected crosswords, ambiguous contained words, repeated-letter scrambles, dense large-print grids, unsupported print glyphs, and exhausted distinct variants.
- [x] Project JSON schema, semantic validation, tampered-input rejection, all-type file and compressed-link round trips. Representative 25-word crossword link below 2,000 characters.
- [x] Independent PDF.js parsing: page counts, Letter/A4 size, text, accent glyphs in both fonts, fixed metadata and byte-identical regeneration.
- [x] SVG/PDF text coordinates agree; crossword clues fit on one default student page. Long content paginates. Keys follow all student versions. Multi-puzzle exports include sequential page numbering.
- [x] Class sets use different arrangements, retain the supplied first layout and give each version a seed ID. Both separate and appended keys are exercised.
- [x] CLI make/check/render/link/book, SVG/PNG output, structured errors and stable seed ID.
- [x] MCP discovery and execution of all seven tools over real stdio, including error responses.
- [x] Browser maker → PDF flows for all four types; class set and separate keys; SVG/PNG; local save/reload/duplicate/delete; export/import; actionable generation errors and recovery.
- [x] Playable crossword, word search, scramble and cryptogram; answer checks; crossword keyboard movement; reveal restrictions; pointer drag and mobile endpoint taps.
- [x] Same-tab play-link changes replace the puzzle, reset answers, handle an invalid link, and recover on a valid link.
- [x] Network assertions: zero HTTP(S) requests after initial load during type switching, reshuffling, both print fonts, save, PDF export, share dialog and player interactions.
- [x] Offline generation and PDF export after the page has loaded.
- [x] Axe: no WCAG A/AA violations on the maker in either theme; no serious/critical findings on About, Support, Agents, a landing page and the player.
- [x] Static Next.js export: 25 topic pages plus maker, player, About, Support, Agents, schema, llms.txt, sitemap and robots. No backend or deployment configuration.
- [x] Licence audit passes for 397 installed packages, with exactly the three owner-approved transitive exceptions recorded in CREDITS.md. No GPL/AGPL; optional Sharp/libvips removed.
- [x] Lighthouse mobile: home performance 90 / accessibility 100; word-search landing performance 92 / accessibility 100. See PERFORMANCE.md.
- [x] Four-times CPU slowdown: initial maker ready in 1,635 ms; switch to word search in 658 ms; PDF download in 431 ms in a local run.
- [x] Manual visual review: Paper and Chalkboard maker, mobile maker, About, Support, Agents, representative landing page and all four players. Screenshots in ignored docs/launch/media; original generated art used for About and social metadata. The review identified and led to fixes for default clue pagination, unavailable arrow glyphs and same-tab link handling.
- [x] Light/dark animated WebP hero previews generated from the actual UI: 8 seconds, 1,000 px wide, about 81 KB and 77 KB respectively. No public media posting.
- [x] Payment/site configuration file unchanged. No deployment, accounts, hosted services, application analytics or publication.

## Limits and checks requiring a real device

- [ ] Physical Letter/A4 printer margins, paper handling and visual legibility.
- [ ] Real Safari/Firefox/Edge and iOS download/print behaviour. Browser notes explicitly distinguish implementation review from unavailable live documentation research.
- [ ] Font coverage for scripts outside the supported Latin-language alphabets. The engine handles Unicode; exports reject unsupported glyphs rather than silently substituting them.
- [ ] User-hosted launch media, production deployment and public launch.

Crossword search is bounded, so it cannot guarantee finding every mathematically possible arrangement. The small word-search blocklist is intentionally limited. Play links contain answers, and local saves are not cloud backups. These are documented product limits, not hidden passing assertions.
