import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";
const app = resolve("apps/web");
const server = spawn(
  process.execPath,
  [
    resolve(app, "node_modules/next/dist/bin/next"),
    "dev",
    "--webpack",
    "-p",
    "4318",
  ],
  {
    cwd: app,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "";
server.stdout.on("data", (data) => (log += data));
server.stderr.on("data", (data) => (log += data));
try {
  await new Promise<void>((resolve, reject) => {
    const timer = setInterval(() => {
      if (log.includes("Ready in")) {
        clearInterval(timer);
        clearTimeout(deadline);
        resolve();
      }
    }, 100);
    const deadline = setTimeout(() => {
      clearInterval(timer);
      reject(new Error("Development startup timed out. " + log));
    }, 30000);
    server.once("exit", (code) => {
      clearInterval(timer);
      clearTimeout(deadline);
      if (code) reject(new Error("Development server exited. " + log));
    });
  });
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ??
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  });
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto("http://127.0.0.1:4318/");
    if (response?.status() !== 200)
      throw new Error("Development request failed");
    await page.waitForSelector(".maker[data-ready=true]");
    await page.getByRole("tab", { name: "Word search", exact: true }).click();
    await page.waitForSelector(".maker[data-ready=true]");
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download PDF", exact: true })
      .click();
    const download = await event;
    if (!download.suggestedFilename().endsWith(".pdf"))
      throw new Error("Expected a PDF download");
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(
      "Development smoke passed: HTTP 200, worker readiness, type switch, PDF download, no page errors.",
    );
  } finally {
    await browser.close();
  }
} finally {
  if (server.pid) {
    if (process.platform === "win32") server.kill("SIGTERM");
    else
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        /* Already exited. */
      }
  }
}
