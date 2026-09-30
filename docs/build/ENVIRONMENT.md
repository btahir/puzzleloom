# Cloud tool activation

Use the existing `/workspace/puzzleloom` checkout. Each cloud task is already isolated; do not create a worktree unless explicitly requested.

The prepared cloud machine has Node 24, system Chromium and ffmpeg. Its home directory is not writable, so activate the retained tooling in each new shell:

```bash
cd /workspace/puzzleloom
export COREPACK_HOME=/workspace/.cache/corepack
export COREPACK_ENABLE_AUTO_PIN=0
export XDG_DATA_HOME=/workspace/.local/share
export XDG_CACHE_HOME=/workspace/.cache
export NEXT_TELEMETRY_DISABLED=1
export PATH="/workspace/.local/bin:$PATH"
pnpm install --frozen-lockfile
pnpm dev
```

No keys, databases, backend services or third-party runtime endpoints are needed. The npm registry is needed for installs. System Chromium is used for local acceptance; Playwright’s download domains are configured for environments that need a browser installation.

For production-mode validation, stop your own dev server, run `pnpm build`, then `pnpm preview`. `pnpm e2e` starts its own static preview if port 4317 is free. A running service must be restarted in a new task; it is not part of a filesystem snapshot.

`pnpm test:dev` starts an isolated development server on 4318, confirms real generation/export, and stops it. Stop any existing dev process before running the full verification.

`pnpm verify` includes the frozen dependency graph’s licence audit, browser network assertions, and all application checks. An installed browser must actually launch; do not suppress browser install or test failures.
