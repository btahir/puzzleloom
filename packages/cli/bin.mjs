#!/usr/bin/env node
// Entry point for `pnpm exec puzzleloom` (and the linked `puzzleloom` bin).
// Runs the TypeScript sources through tsx, so no build step is needed.
import { register } from "tsx/esm/api";

register();
const { main } = await import("./src/index.ts");
await main();
