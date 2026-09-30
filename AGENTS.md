# AGENTS.md

Working rules for any coding agent building Puzzleloom (Codex cloud first). Read [README.md](README.md) for usage and [the original brief](docs/build/BRIEF.md) for the binding product decisions. This file says how to work; the CLI, MCP and schema reference is below.

## Your situation

- You work in a fresh cloud container with only this repo. Nothing from earlier tasks survives unless it is committed.
- **Keep the build state in the repo**, under `docs/build/`:
  - `PLAN.md`: technical plan, keyword pages with reasoning, dependency and licence table, spec sources.
  - `ACCEPTANCE.md`: every check, with `[x]` only when an automated test or a written manual check proves it.
  - `PROGRESS.md`: an append-only log. Each task adds what was done, the test numbers, what's next and any open questions for the owner.
  - `OWNER-TODO.md`: anything only the owner can do (deploy, GitHub settings, a manual check on a real device, decisions).
- **Read `docs/build/PROGRESS.md` first** at the start of every task, and pick up the next step from the README build order.
- **The owner makes product calls; you make technical ones.** If a product question blocks you, pick the conservative option, note it in `OWNER-TODO.md` and continue.
- **Ambition:** the best puzzle maker on the web, not a minimal MVP. Test constantly and look at your own screenshots.

## Commands

These commands are implemented and must keep working:

```bash
pnpm install
pnpm dev          # web app on port 4317
pnpm test         # unit, property and golden tests (vitest)
pnpm e2e          # Playwright, headless Chromium
pnpm verify       # everything: typecheck, lint, test, e2e, licences, no-network check, build
pnpm bench        # crossword quality benchmark; writes docs/build/bench.md
```

## Hard rules

- **No backend of any kind.** No hosted services, accounts, analytics, databases or server functions. The site is a static export.
- **No network requests after the page loads.** Fonts are bundled from npm (`@fontsource/*`); never load Google Fonts or any CDN at runtime. A test enforces this.
- **No API keys, no built-in LLM, no third-party services.** Ask the owner (via `OWNER-TODO.md`) before adding any.
- **Licences:**
  - Dependencies must be MIT, Apache-2.0, BSD, ISC or MPL-2.0 (unmodified). Fonts OFL, data CC0 or our own.
  - Never GPL/AGPL. Never copy code from GPL projects (crosshare, genxword, Wizium).
  - Record every dependency, font and generated asset in `CREDITS.md`.
  - A licence check runs in `pnpm verify`.
- **Stripe links live only in `apps/web/src/config/site.ts` (`DONATION_LINKS`).** Never edit them, create new ones or paste a Stripe URL anywhere else. `SITE_URL` also lives only there.
- **No paywalls, locked features, watermarks or ads.**
- **No CI/CD or repo automation:** no `.github/workflows`, Dependabot, Renovate, release bots, `vercel.json` or other deploy configs, and no git hooks calling external services. All checks run through package scripts.
- **Don't deploy, publish, post, create accounts or touch payments.** The owner deploys to Vercel.
- **Mock or synthetic data only.** Every word list, quote and example is written by you (CC0) or public domain with a source. Don't scrape sites.
- **Assets:** no brand logos, stock photos or anything we don't own. Logo, icons and UI are SVG/code.

## Images and media

- **Raster art** (OG image background, illustration, textures): use the built-in `$imagegen` skill if it's available in this environment.
  - Never prompt for real brands, products or people.
  - Record the prompt in `CREDITS.md`.
  - If image generation isn't available, use SVG/code art and list what you'd have generated in `OWNER-TODO.md`.
- **Media stays out of git:**
  - The README uses animated WebP and PNG/WebP screenshots only.
  - `*.mp4 *.mov *.gif *.mp3` and `docs/launch/media/` are gitignored.
  - The hero loop is 6–12 s, under 5 MB and about 1000 px wide, in light and dark (`<picture>`). Make it from Playwright screen captures of the real product, turned into a WebP with ffmpeg or `img2webp`.
  - The full launch video with audio is **not** your job; leave a note in `OWNER-TODO.md`.

## Git

- **Work on a branch; the owner merges PRs.** Make small, meaningful commits. Each PR should leave `pnpm verify` green; if it can't, say why in the PR.
- **Stage files by explicit path.** Never commit build output, test reports, `node_modules` or media.
- **PR description:** what changed, the test numbers, screenshots for any UI change (light and dark), and what's next.
- **Commits made by Claude agents** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Codex follows its own attribution defaults.

## Verification

- **Nothing counts as done without an automated check,** or a written manual check in `ACCEPTANCE.md` that is marked as manual.
- **Generators:** property tests for every guarantee in README section 3, plus golden files (input + seed → exact output). Inject randomness through the seeded PRNG only; never call `Math.random` or `Date.now` in core.
- **Keep the preview and the PDF identical:** both come from the same sheet layout engine. Test that the SVG and PDF layouts agree on box positions.
- **Screenshots:** take Playwright screenshots of every screen in light and dark, look at them, and fix what looks off. Check them against the anti-slop checklist in README section 4.
- **Browsers:** Chrome/Chromium is the acceptance bar. For Safari, Firefox and Edge, research known issues and fix them in theory; don't install extra browsers.

## Environment notes (for the owner configuring Codex cloud)

- **Setup script:**

  ```bash
  # In cloud shells, first activate tools as described in docs/build/ENVIRONMENT.md.
  pnpm install --frozen-lockfile
  pnpm assets
  if ! command -v chromium >/dev/null 2>&1; then
    pnpm exec playwright install --with-deps chromium
  fi
  ```

- **Node:** 22.13 or later; this environment uses Node 24.
- **Agent internet access:** on, with the "Common dependencies" allowlist plus the Playwright browser CDN (`cdn.playwright.dev`, `playwright.download.prss.microsoft.com`). Allow GET/HEAD/OPTIONS only. The agent needs this to add npm packages mid-task. The product itself never uses the network.
- **Secrets:** none needed.

## Using Puzzleloom from an agent

The implementation is present. Read `docs/build/PROGRESS.md` and `docs/build/ACCEPTANCE.md` for verified state. The original binding brief is preserved in `docs/build/BRIEF.md`; README.md is now the public usage guide.

- Run `pnpm puzzleloom --help` for the CLI. `--json` emits `{ok,result}` or `{ok:false,error}`. Exit 0 is success, 1 is an input/runtime failure, and 2 is an unknown-command usage failure.
- Create: `pnpm puzzleloom make crossword --words words.txt --seed 42 --out lesson.puzzleloom.json --pdf lesson.pdf --json`.
- Validate: `pnpm puzzleloom check lesson.puzzleloom.json --json`.
- Render: `pnpm puzzleloom render lesson.puzzleloom.json --pdf class.pdf --variants 30 --key appended`.
- Link: `pnpm puzzleloom link lesson.puzzleloom.json --json`.
- Book: `pnpm puzzleloom book book.json --pdf book.pdf`; the spec has `files` (paths relative to the spec), optional `title`, and `key` (`appended`, `none`, or `only`).
- MCP: configure a local stdio server whose command is `pnpm`, arguments are `["mcp"]`, and working directory is the checkout. For clients that cannot specify a working directory, use `node --import /absolute/checkout/node_modules/tsx/dist/loader.mjs /absolute/checkout/packages/mcp/src/index.ts`. Tools: `create_puzzle`, `validate_puzzle`, `render_pdf`, `render_image`, `make_play_link`, `make_book`, `list_options`. Tool schemas are discoverable via MCP.
- The project schema is generated at `apps/web/public/puzzleloom.schema.json`. A project includes its seed, options, inputs and solved layout. Validate untrusted projects before rendering.
- UI labels and static content live in `apps/web/src/content/ui.ts` and `pages.ts`. Generator errors remain in the shared core; dynamic UI messages are composed at the call sites.
- `pnpm assets` regenerates font bundles from the original fonts in `assets/fonts`. OpenDyslexic is embedded without subsetting. Never modify the source font files.
- Cloud shells need the activation in `docs/build/ENVIRONMENT.md`.

### Approved licence exceptions

The owner explicitly approved these transitive package/licence pairs during implementation: `caniuse-lite` / `CC-BY-4.0`, `minimatch` / `BlueOak-1.0.0`, and `pako` / `(MIT AND Zlib)`. Their attributions are in CREDITS.md and the checker permits only these exact pairs. Other licence restrictions remain in force. Sharp/libvips is excluded from the dependency graph.
