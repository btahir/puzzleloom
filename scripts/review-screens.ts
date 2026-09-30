import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { generate, encode, type PuzzleType } from "../packages/core/src/index";
await mkdir("docs/launch/media", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const routes = ["/", "/about/", "/support/", "/agents/", "/word-search-maker/"];
for (const theme of ["light", "dark"]) {
  await page.addInitScript(
    (t) => localStorage.setItem("puzzleloom-theme", t),
    theme,
  );
  for (const route of routes) {
    await page.goto("http://127.0.0.1:4317" + route);
    if (route === "/" || route.includes("maker"))
      await page.waitForSelector(".maker[data-ready=true]");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/launch/media/${route === "/" ? "maker" : route.replaceAll("/", "")}-${theme}.png`,
      fullPage: true,
    });
  }
  for (const type of [
    "crossword",
    "word-search",
    "scramble",
    "cryptogram",
  ] as PuzzleType[]) {
    await page.goto(
      "http://127.0.0.1:4317/play/#" + encode(generate({ type, seed: 42 })),
    );
    await page
      .getByRole("button", { name: "Check puzzle", exact: true })
      .waitFor();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      generate({ type, seed: 42 }).title,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/launch/media/player-${type}-${theme}.png`,
      fullPage: true,
    });
  }
}
// Eight-second animated previews: frames of the actual UI in each theme.
for (const theme of ["light", "dark"]) {
  await page.addInitScript(
    (t) => localStorage.setItem("puzzleloom-theme", t),
    theme,
  );
  await page.setViewportSize({ width: 1100, height: 1100 });
  await page.goto("http://127.0.0.1:4317/");
  await page.waitForSelector(".maker[data-ready=true]");
  for (const [i, type] of [
    "Crossword",
    "Word search",
    "Word scramble",
    "Cryptogram",
  ].entries()) {
    await page.getByRole("tab", { name: type, exact: true }).click();
    await page.waitForSelector(".maker[data-ready=true]");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/launch/media/hero-${theme}-${i}.png` });
  }
}
await browser.close();
