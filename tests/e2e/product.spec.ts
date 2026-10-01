import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { landingPages } from "../../apps/web/src/content/pages";
import {
  generate,
  encode,
  DEFAULT_WORDS,
  letters,
  type PuzzleType,
} from "../../packages/core/src/index";
const ready = async (page: Page) => {
  await expect(page.locator(".maker")).toHaveAttribute("data-ready", "true");
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
};
for (const [label, type] of [
  ["Crossword", "crossword"],
  ["Word search", "word-search"],
  ["Word scramble", "scramble"],
  ["Cryptogram", "cryptogram"],
] as const) {
  test(`${label}: make and download a real PDF`, async ({ page }) => {
    await page.goto("/");
    await ready(page);
    await page.getByRole("tab", { name: label, exact: true }).click();
    await ready(page);
    await expect(page.locator(".paper svg")).toBeVisible();
    const event = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download PDF", exact: true })
      .click();
    const download = await event;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    const path = await download.path();
    expect((await readFile(path!)).subarray(0, 4).toString()).toBe("%PDF");
    await expect(page.getByRole("status")).toContainText("PDF downloaded");
    await page.getByRole("button", { name: "Answer key", exact: true }).click();
    await expect(page.locator(".paper svg")).toContainText("ANSWER KEY");
    expect(type).toBeTruthy();
  });
}
test("save, reload, duplicate, delete, export and import projects", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page
    .getByLabel("Puzzle title", { exact: true })
    .fill("Our garden lesson");
  await ready(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.reload();
  await ready(page);
  await page.getByRole("button", { name: "My puzzles" }).click();
  await page.getByRole("button", { name: /Our garden lesson/ }).click();
  await expect(page.getByLabel("Puzzle title", { exact: true })).toHaveValue(
    "Our garden lesson",
  );
  await ready(page);
  await page.getByText("More exports & import", { exact: true }).click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Project file", exact: true }).click();
  const file = await event;
  const path = await file.path();
  const project = JSON.parse(await readFile(path!, "utf8"));
  expect(project.title).toBe("Our garden lesson");
  await page.locator('input[type=file][accept=".json"]').setInputFiles({
    name: "import.puzzleloom.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ ...project, title: "Imported garden" }),
    ),
  });
  await expect(page.getByLabel("Puzzle title", { exact: true })).toHaveValue(
    "Imported garden",
  );
  await page.getByRole("button", { name: "My puzzles" }).click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(page.locator(".saved-row")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Delete", exact: true })
    .first()
    .click();
  await expect(page.locator(".saved-row")).toHaveCount(1);
});
test("class sets, separate keys, PNG and SVG export", async ({ page }) => {
  await page.goto("/word-scramble-maker/");
  await ready(page);
  await page.getByLabel("Class set").fill("3");
  await page.getByLabel("Answer key", { exact: true }).selectOption("separate");
  const downloads: import("@playwright/test").Download[] = [];
  page.on("download", (d) => downloads.push(d));
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await expect.poll(() => downloads.length).toBe(2);
  await page.getByText("More exports & import", { exact: true }).click();
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  await expect.poll(() => downloads.length).toBe(3);
  await page.getByRole("button", { name: "PNG", exact: true }).click();
  await expect.poll(() => downloads.length).toBe(4);
  expect(
    downloads
      .map((d) => d.suggestedFilename())
      .some((f) => f.endsWith("-answers.pdf")),
  ).toBe(true);
});
test("errors explain disconnected words and allow recovery", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.getByLabel("Words and clues").fill("AAA\nZZZ");
  await expect(page.locator(".maker [role=alert]")).toContainText(
    "shares no letters",
  );
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Words and clues").fill(DEFAULT_WORDS);
  await ready(page);
  await expect(page.locator(".maker [role=alert]")).toHaveCount(0);
});
test("no network after load during generation, export, saves or player interactions", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  await page.getByRole("tab", { name: "Word search", exact: true }).click();
  await ready(page);
  await page.getByRole("button", { name: "Reshuffle", exact: true }).click();
  await ready(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await event;
  await page.getByRole("button", { name: "Play link", exact: true }).click();
  await expect(page.getByLabel("Play link", { exact: true })).toHaveValue(
    /\/play\/#/,
  );
  expect(requests).toEqual([]);
});
for (const type of [
  "crossword",
  "word-search",
  "scramble",
  "cryptogram",
] as PuzzleType[]) {
  test(`${type}: player solves and checks`, async ({ page }) => {
    const p = generate({
      type,
      seed: 42,
      words: "GARDEN: A place to grow\nEARTH: Soil\nLEAF: A green part",
      quote: "A new day.",
    });
    await page.goto("/play/#" + encode(p));
    await expect(page.getByRole("heading", { name: p.title })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const requests: string[] = [];
    page.on("request", (r) => {
      if (/^https?:/.test(r.url())) requests.push(r.url());
    });
    if (type === "crossword") {
      for (let y = 0; y < p.grid.length; y++)
        for (let x = 0; x < p.grid[y].length; x++)
          if (p.grid[y][x])
            await page.locator(`[data-cell="${x},${y}"]`).fill(p.grid[y][x]);
    } else if (type === "scramble") {
      for (let i = 0; i < p.entries.length; i++)
        await page
          .getByLabel(`Answer ${i + 1}`, { exact: true })
          .fill(p.entries[i].word);
    } else if (type === "cryptogram") {
      for (const [plain, cipher] of Object.entries(p.cipher))
        if (p.encoded.includes(cipher))
          await page
            .getByLabel(new RegExp(`Decode ${cipher},`))
            .first()
            .fill(plain);
    } else {
      for (const q of p.placements) {
        await page.locator(`[data-xy="${q.x},${q.y}"]`).focus();
        await page.keyboard.press("Enter");
        await page
          .locator(
            `[data-xy="${q.x + q.dx * (letters(q.word).length - 1)},${q.y + q.dy * (letters(q.word).length - 1)}"]`,
          )
          .focus();
        await page.keyboard.press("Enter");
      }
    }
    await page
      .getByRole("button", { name: "Check puzzle", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      type === "word-search" ? "Every word found" : "All correct",
    );
    expect(requests).toEqual([]);
  });
}
test("word search supports pointer drag", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  const p = generate({
    type: "word-search",
    words: "GARDEN\nEARTH",
    seed: 42,
    options: { size: 8, difficulty: "easy" },
  });
  await page.goto("/play/#" + encode(p));
  const q = p.placements[0],
    a = await page.locator(`[data-xy="${q.x},${q.y}"]`).boundingBox(),
    b = await page
      .locator(
        `[data-xy="${q.x + q.dx * (letters(q.word).length - 1)},${q.y + q.dy * (letters(q.word).length - 1)}"]`,
      )
      .boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(page.getByRole("status")).toContainText(`${q.word} found`);
});
test("crossword keyboard moves and reveal restrictions work", async ({
  page,
}) => {
  const p = generate({ type: "crossword", options: { allowReveal: false } });
  await page.goto("/play/#" + encode(p));
  await expect(
    page.getByRole("button", { name: "Reveal answers" }),
  ).toHaveCount(0);
  const q = p.placements.find((q) => q.dx === 1)!;
  await page.locator(`[data-cell="${q.x},${q.y}"]`).focus();
  await page.keyboard.type(q.word[0]);
  await expect(page.locator(`[data-cell="${q.x + 1},${q.y}"]`)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(`[data-cell="${q.x},${q.y}"]`)).toBeFocused();
});
for (const theme of ["light", "dark"]) {
  test(`${theme}: accessible maker and screenshot`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1150 });
    await page.goto("/");
    await ready(page);
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({
      path: `docs/launch/media/maker-${theme}.png`,
      fullPage: true,
    });
  });
}
test("mobile maker, touch targets and layout fit", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await ready(page);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "docs/launch/media/maker-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Download PDF", exact: true })
    .scrollIntoViewIfNeeded();
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await event;
});
test("static pages and player have no serious accessibility issues", async ({
  page,
}) => {
  for (const path of [
    "/about/",
    "/support/",
    "/agents/",
    "/word-search-maker/",
    "/play/#" + encode(generate({ type: "scramble" })),
  ]) {
    await page.goto(path);
    if (path.includes("maker")) await ready(page);
    await expect(page.locator("h1")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      ),
      path,
    ).toEqual([]);
  }
});
test("touch selection finds a word on a mobile screen", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const p = generate({
    type: "word-search",
    words: "GARDEN\nEARTH",
    seed: 42,
    options: { size: 8, difficulty: "easy" },
  });
  await page.goto(baseURL + "/play/#" + encode(p));
  const q = p.placements[0];
  const first = page.locator(`[data-xy="${q.x},${q.y}"]`),
    last = page.locator(
      `[data-xy="${q.x + q.dx * (letters(q.word).length - 1)},${q.y + q.dy * (letters(q.word).length - 1)}"]`,
    );
  await first.tap();
  await last.tap();
  await expect(page.getByRole("status")).toContainText(`${q.word} found`);
  await context.close();
});
test("all puzzle types and print fonts work without network after initial load", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  for (const label of [
    "Word search",
    "Word scramble",
    "Cryptogram",
    "Crossword",
  ]) {
    await page.getByRole("tab", { name: label, exact: true }).click();
    await ready(page);
  }
  await page
    .getByLabel("Print font", { exact: true })
    .selectOption("opendyslexic");
  await ready(page);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await event;
  expect(requests).toEqual([]);
});
test("maker remains functional offline after initial load", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await ready(page);
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.getByRole("tab", { name: "Word scramble", exact: true }).click();
  await ready(page);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await event;
  await expect(page.getByRole("status")).toContainText("PDF downloaded");
});
test("opening another play link in the same tab replaces the puzzle and resets answers", async ({
  page,
}) => {
  const first = generate({ type: "crossword", title: "First puzzle" }),
    second = generate({ type: "scramble", title: "Second puzzle" });
  await page.goto("/play/#" + encode(first));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "First puzzle",
  );
  await page.getByRole("button", { name: "Reveal answers" }).click();
  await page.goto("/play/#" + encode(second));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Second puzzle",
  );
  await expect(page.getByLabel("Answer 1", { exact: true })).toHaveValue("");
  await page.goto("/play/#broken");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This play link doesn’t work",
  );
  await page.goto("/play/#" + encode(first));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "First puzzle",
  );
});

test("homepage shows the whole maker above the fold at 1440x900", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  const paper = await page.locator(".paper").boundingBox();
  expect(paper!.y).toBeGreaterThan(0);
  expect(paper!.y + paper!.height).toBeLessThanOrEqual(900);
  await expect(page.getByLabel("Words and clues")).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeInViewport();
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
});
test("grid size defaults to auto and shows the size used", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const auto = page.getByRole("radio", { name: "Auto" });
  await expect(auto).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".grid-size")).toContainText(
    /\d+ × \d+, chosen to fit/,
  );
  await page.getByRole("radio", { name: "Custom" }).click();
  await expect(page.getByRole("slider", { name: "Grid size" })).toBeVisible();
});
test("list clean-up is reported next to the word list", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page
    .getByLabel("Words and clues")
    .fill(
      "H2O: Water\nWATER: Wet stuff\nGARDEN: A place to grow\nGARDEN: Again\nHOT: Warm\nEARTH: Soil",
    );
  const notes = page.locator(".list-warnings");
  await expect(notes).toContainText("Removed duplicate GARDEN");
  await expect(notes).toContainText("removed “2”");
  // A user's own list gets a plain title, not the example's.
  await expect(page.getByLabel("Puzzle title", { exact: true })).toHaveValue(
    "Crossword",
  );
});
test("support note appears once per session after the first PDF", async ({
  page,
}) => {
  await page.goto("/word-scramble-maker/");
  await ready(page);
  const download = page.getByRole("button", {
    name: "Download PDF",
    exact: true,
  });
  let event = page.waitForEvent("download");
  await download.click();
  await event;
  const note = page.locator(".support-note");
  await expect(note).toContainText("This one was free");
  await expect(note.getByRole("link")).toHaveAttribute("href", "/support/");
  await page.getByRole("button", { name: "Dismiss support note" }).click();
  await expect(note).toHaveCount(0);
  await page.reload();
  await ready(page);
  event = page.waitForEvent("download");
  await download.click();
  await event;
  await expect(page.getByRole("status")).toContainText("PDF downloaded");
  await expect(note).toHaveCount(0);
});
test("mobile header menu reaches Support", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("link", { name: "Support" })).toBeHidden();
  const menu = page.getByRole("button", { name: "Menu" });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await nav.getByRole("link", { name: "Support" }).click();
  await expect(page).toHaveURL(/\/support\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Support Puzzleloom",
  );
});
test("landing pages render FAQ, JSON-LD and unique metadata", async ({
  page,
}) => {
  const seen = new Set<string>();
  for (const slug of [
    "crossword-maker",
    "christmas-word-search",
    "cryptogram-maker",
  ]) {
    const topic = landingPages.find((p) => p.slug === slug)!;
    await page.goto(`/${slug}/`);
    await ready(page);
    await expect(
      page.getByRole("heading", { name: "Questions" }),
    ).toBeVisible();
    for (const f of topic.faq)
      await expect(page.getByRole("heading", { name: f.q })).toBeVisible();
    const ld = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const faq = ld
      .map((t) => JSON.parse(t))
      .find((d) => d["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(topic.faq.length);
    expect(ld.some((t) => t.includes('"WebApplication"'))).toBe(true);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      topic.description,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/${slug}/$`),
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/og\.png$/,
    );
    const title = await page.title();
    expect(seen.has(title)).toBe(false);
    seen.add(title);
    // The sheet uses the topic as its title and the bundled print font.
    await expect(page.getByLabel("Puzzle title", { exact: true })).toHaveValue(
      topic.sheetTitle,
    );
    const family = await page
      .locator(".paper svg text")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain("Puzzle Print Atkinson");
  }
});
test("list errors, stale preview and confirmations show where the user is looking", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await ready(page);
  await page.getByLabel("Words and clues").fill("GARDEN\nEARTH\nQUIZ");
  const listError = page.locator(".list-error");
  await expect(listError).toContainText(
    "QUIZ didn’t fit: it shares no letters with the other words. Add a word with Q, U, I or Z.",
  );
  await expect(listError).toBeInViewport();
  await expect(page.getByLabel("Words and clues")).toHaveAttribute(
    "aria-describedby",
    "list-error",
  );
  await expect(page.locator(".stale-label")).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toHaveAccessibleDescription("Fix the word list first.");
  await page.getByLabel("Words and clues").fill(DEFAULT_WORDS);
  await ready(page);
  await expect(page.locator(".stale-label")).toHaveCount(0);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const status = page.locator(".action-status [role=status]");
  await expect(status).toContainText("Saved");
  await expect(status).toBeInViewport();
});
test("confirmations stay above the sticky Download bar on phones", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await ready(page);
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await event;
  const status = page.locator(".action-status [role=status]");
  await expect(status).toBeInViewport();
  const bar = await page.locator(".mobile-download").boundingBox();
  const box = await status.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y);
});
test("cryptogram words never break across lines on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const p = generate({
    type: "cryptogram",
    quote:
      "Every good plan starts with one clear first step, and a second step follows.",
    seed: 7,
  });
  await page.goto("/play/#" + encode(p));
  const words = page.locator(".crypto-word");
  expect(await words.count()).toBeGreaterThan(5);
  const broken = await words.evaluateAll(
    (els) =>
      els.filter((el) => {
        const tops = [...el.children].map(
          (c) => (c as HTMLElement).getBoundingClientRect().bottom,
        );
        return Math.max(...tops) - Math.min(...tops) > 4;
      }).length,
  );
  expect(broken).toBe(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("crossword player highlights the word, stays in it and checks the whole word", async ({
  page,
}) => {
  const p = generate({ type: "crossword", seed: 42 });
  await page.goto("/play/#" + encode(p));
  const q = p.placements.find((q) => q.dx === 1)!;
  const word = letters(q.word);
  await page.locator(`[data-cell="${q.x},${q.y}"]`).focus();
  await expect(page.locator(".cross-cell.in-word")).toHaveCount(word.length);
  await expect(page.locator(".clue.is-current")).toHaveCount(1);
  await expect(page.locator(".current-clue")).toContainText(q.clue);
  // Type a wrong word one letter too long: the cursor must stop at the last square.
  await page.keyboard.type("Z".repeat(word.length + 1));
  const last = `${q.x + word.length - 1},${q.y}`;
  await expect(page.locator(`[data-cell="${last}"]`)).toBeFocused();
  // The meta line counts filled squares; it does not reveal correctness.
  await expect(page.locator(".player-meta")).toContainText("squares filled");
  await expect(page.locator(".player-meta")).not.toContainText("correct");
  await page.getByRole("button", { name: "Check word", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    `0 of ${word.length} letters right`,
  );
  await expect(page.locator(".cross-cell.incorrect")).toHaveCount(word.length);
});
test("broken play links explain themselves without technical detail", async ({
  page,
}) => {
  const link = encode(generate({ type: "crossword", seed: 3 }));
  // A link cut off part-way, as happens when it is copied badly.
  await page.goto("/play/#" + link.slice(0, Math.floor(link.length / 2)));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This play link doesn’t work",
  );
  await expect(page.locator("main")).toContainText(
    "cut off when it was copied",
  );
  await expect(page.locator("main")).not.toContainText(
    /zlib|invalid|undefined/i,
  );
});
test("word search draws found words as a highlighter stroke", async ({
  page,
}) => {
  const p = generate({
    type: "word-search",
    words: "GARDEN\nEARTH",
    seed: 42,
    options: { size: 8, difficulty: "easy" },
  });
  await page.goto("/play/#" + encode(p));
  const q = p.placements[0];
  const n = letters(q.word).length - 1;
  await page.locator(`[data-xy="${q.x},${q.y}"]`).focus();
  await page.keyboard.press("Enter");
  await page.locator(`[data-xy="${q.x + q.dx * n},${q.y + q.dy * n}"]`).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".found-strokes line")).toHaveCount(1);
});
test("preview can be enlarged for proofreading", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Enlarge", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".paper svg")).toBeVisible();
  const box = await dialog.locator(".paper").first().boundingBox();
  expect(box!.width).toBeGreaterThan(600);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
test("touch screens get 44px controls", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(baseURL + "/");
  await expect(page.locator(".maker")).toHaveAttribute("data-ready", "true");
  for (const selector of [
    ".saved-button",
    ".preview-toggle button",
    ".segmented button",
    ".theme-button",
    ".menu-button",
    ".editor-footer .text-button",
  ]) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box!.height, selector).toBeGreaterThanOrEqual(44);
  }
  await context.close();
});
test("Download PDF is reachable at 1024x768", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await ready(page);
  await expect(
    page.getByRole("button", { name: "Download PDF", exact: true }),
  ).toBeInViewport({ ratio: 1 });
});
test("hovering the selected segment keeps its label readable", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  const key = page.getByRole("button", { name: "Answer key", exact: true });
  await key.click();
  await key.hover();
  const auto = page.getByRole("radio", { name: "Auto" });
  for (const el of [key, auto]) {
    if (el === auto) await auto.hover();
    const [color, background] = await el.evaluate((b) => {
      const s = getComputedStyle(b);
      return [s.color, s.backgroundColor];
    });
    expect(color).not.toBe(background);
    expect(background).not.toBe(
      await page.evaluate(() =>
        getComputedStyle(document.body).getPropertyValue("--desk").trim(),
      ),
    );
  }
});
test("landing presets set the maker options", async ({ page }) => {
  await page.goto("/large-print-word-search-maker/");
  await ready(page);
  await expect(page.getByLabel("Text size")).toHaveValue("XL");
  await expect(page.getByLabel("Difficulty")).toHaveValue("easy");
  await expect(page.getByRole("radio", { name: "Custom" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.locator(".range-row output")).toHaveText("10 × 10");
  await expect(page.getByLabel("Puzzle title", { exact: true })).toHaveValue(
    "Large print word search",
  );
});
test("downloads are named after the puzzle and new puzzles get their own ID", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  let event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await event).suggestedFilename()).toBe("in-the-garden-crossword.pdf");
  const starterId = await page
    .locator(".paper svg")
    .evaluate((svg) => svg.textContent?.match(/PL-[0-9A-Z]+/)?.[0]);
  await page
    .getByLabel("Words and clues")
    .fill(
      "PLANET: Orbits a star\nORBIT: Path around a planet\nCOMET: Icy body with a tail\nMETEOR: Shooting star",
    );
  await ready(page);
  await page
    .getByLabel("Puzzle title", { exact: true })
    .fill("Week 3 spelling");
  await ready(page);
  const shownId = await page
    .locator(".paper svg")
    .evaluate((svg) => svg.textContent?.match(/PL-[0-9A-Z]+/)?.[0]);
  expect(shownId).toBeTruthy();
  expect(shownId).not.toBe(starterId);
  event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await event).suggestedFilename()).toBe(
    "week-3-spelling-crossword.pdf",
  );
  await page.getByText("More exports & import", { exact: true }).click();
  event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Project file", exact: true }).click();
  const project = JSON.parse(
    await readFile((await (await event).path())!, "utf8"),
  );
  expect(project.id).toBe(shownId);
});
for (const [w, h] of [
  [1440, 900],
  [1024, 768],
]) {
  test(`crossword player fits the grid and Check buttons at ${w}x${h}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(
      "/play/#" + encode(generate({ type: "crossword", seed: 42 })),
    );
    const gridBox = await page.locator(".play-grid").boundingBox();
    expect(gridBox!.y + gridBox!.height).toBeLessThanOrEqual(h);
    await expect(
      page.getByRole("button", { name: "Check puzzle", exact: true }),
    ).toBeInViewport({ ratio: 1 });
  });
}
test("word search shows a live stroke while dragging", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  const p = generate({
    type: "word-search",
    words: "GARDEN\nEARTH",
    seed: 42,
    options: { size: 8, difficulty: "easy" },
  });
  await page.goto("/play/#" + encode(p));
  const a = await page.locator('[data-xy="0,0"]').boundingBox(),
    b = await page.locator('[data-xy="3,0"]').boundingBox();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2, {
    steps: 4,
  });
  await expect(page.locator(".found-strokes line.pending")).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator(".found-strokes line.pending")).toHaveCount(0);
});
test("Enlarge shows the sheet at print size on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Enlarge", exact: true }).click();
  const sheet = page.getByRole("dialog").locator(".paper").first();
  expect((await sheet.boundingBox())!.width).toBeGreaterThanOrEqual(800);
  await expect(page.getByRole("dialog")).toContainText("Drag to move");
});
test("bare play page and short pages behave", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/play/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Play a puzzle",
  );
  for (const path of ["/play/", "/no-such-page/"]) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight),
      path,
    ).toBeLessThanOrEqual(900);
  }
});
test("dark crossword shows wrong-letter marks and the active square", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ colorScheme: "dark" });
  const p = generate({ type: "crossword", seed: 42 });
  await page.goto("/play/#" + encode(p));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const q = p.placements.find((q) => q.dx === 1)!;
  const n = letters(q.word).length;
  await page.locator(`[data-cell="${q.x},${q.y}"]`).focus();
  await page.keyboard.type("Z".repeat(n));
  const mark = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--mark")
      .trim(),
  );
  const highlight = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--highlight")
      .trim(),
  );
  const toRgb = (hex: string) =>
    `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
  await page.getByRole("button", { name: "Check word", exact: true }).click();
  await expect(page.getByRole("status")).toBeInViewport();
  const first = page.locator(".cross-cell").filter({
    has: page.locator(`[data-cell="${q.x},${q.y}"]`),
  });
  await expect(first).toHaveCSS(
    "box-shadow",
    new RegExp(toRgb(mark).replace(/[()]/g, "\\$&")),
  );
  const active = page.locator(".cross-cell.is-active");
  await expect(active).toHaveCSS("background-color", toRgb(highlight));
});
test("each new puzzle gets its own ID; edits keep it", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const id = () =>
    page
      .locator(".paper svg")
      .evaluate((svg) => svg.textContent?.match(/PL-[0-9A-Z]+/)?.[0]);
  const ids = [await id()];
  await page.getByRole("tab", { name: "Word search", exact: true }).click();
  await ready(page);
  ids.push(await id());
  await page.getByRole("tab", { name: "Crossword", exact: true }).click();
  await ready(page);
  ids.push(await id());
  await page
    .getByLabel("Words and clues")
    .fill(
      "PLANET: Orbits a star\nCOMET: Icy body\nORBIT: A path\nMETEOR: Streak",
    );
  await ready(page);
  ids.push(await id());
  expect(new Set(ids).size).toBe(ids.length);
  // Editing a clue or adding a word is the same puzzle.
  await page
    .getByLabel("Words and clues")
    .fill(
      "PLANET: Orbits the sun\nCOMET: Icy body\nORBIT: A path\nMETEOR: Streak\nTERM: Part of a year",
    );
  await ready(page);
  expect(await id()).toBe(ids[3]);
});
test("phone pages without the maker have no dead band under the footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/support/");
  const pad = await page.evaluate(
    () => getComputedStyle(document.body).paddingBottom,
  );
  expect(pad).toBe("0px");
});
