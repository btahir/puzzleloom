import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4317",
    browserName: "chromium",
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ??
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm preview",
    url: "http://127.0.0.1:4317",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
