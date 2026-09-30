import { describe, it, expect } from "vitest";
import { generate, TYPES, variants } from "../packages/core/src/index";
import {
  layoutPuzzle,
  toSVG,
  toPDF,
  sheetsFor,
} from "../packages/render/src/index";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
async function parse(bytes: Uint8Array) {
  const document = await getDocument({ data: bytes, useSystemFonts: false })
    .promise;
  const pages = [];
  for (let i = 1; i <= document.numPages; i++) {
    const page = await document.getPage(i);
    const content = await page.getTextContent();
    pages.push({
      text: content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
      items: content.items,
      view: page.view,
    });
  }
  await document.destroy();
  return pages;
}
describe("shared print layout", () => {
  it.each(TYPES)(
    "%s exports parseable, byte-identical PDFs with matching text positions",
    async (type) => {
      const p = generate({ type, title: "A classroom puzzle", seed: 42 }),
        a = await toPDF([p]),
        b = await toPDF([p]);
      expect(a).toEqual(b);
      const pages = await parse(a.slice());
      const sheets = sheetsFor([p]);
      expect(pages).toHaveLength(sheets.length);
      expect(pages[0].text).toContain("A classroom puzzle");
      expect(pages.at(-1)!.text).toContain("ANSWER KEY");
      expect(pages[0].view).toEqual([0, 0, 612, 792]);
      const first = sheets[0].items.find(
        (i) => i.kind === "text" && i.text === "A classroom puzzle",
      )!;
      expect(first.kind).toBe("text");
      if (first.kind === "text") {
        const printed = pages[0].items.find(
          (i) => "str" in i && i.str === "A classroom puzzle",
        );
        expect(
          printed && "transform" in printed ? printed.transform[4] : 0,
        ).toBeCloseTo(first.x, 4);
        expect(
          printed && "transform" in printed ? printed.transform[5] : 0,
        ).toBeCloseTo(792 - first.y - first.size * 0.85, 4);
        expect(toSVG(sheets[0])).toContain(
          `x="${first.x}" y="${first.y + first.size * 0.85}"`,
        );
      }
    },
  );
  it("embeds both fonts and preserves accented letters in A4", async () => {
    for (const font of ["atkinson", "opendyslexic"] as const) {
      const p = generate({
        type: "scramble",
        words: "CAFÉ\nNIÑO",
        title: "Español",
        options: { font, paper: "a4" },
      });
      const bytes = await toPDF([p]);
      const pages = await parse(bytes);
      expect(pages[0].view[2]).toBeCloseTo(595.28, 2);
      expect(pages.at(-1)!.text).toContain("CAFÉ");
      expect(pages.at(-1)!.text).toContain("NIÑO");
    }
  });
  it("puts all class-set answer keys at the back and supports separate/none", async () => {
    const puzzles = variants(generate({ type: "scramble" }), 3),
      pages = sheetsFor(puzzles);
    const firstKey = pages.findIndex((p) => p.answer);
    expect(firstKey).toBeGreaterThanOrEqual(3);
    expect(pages.slice(firstKey).every((p) => p.answer)).toBe(true);
    expect(sheetsFor(puzzles, "none").every((p) => !p.answer)).toBe(true);
    expect(sheetsFor(puzzles, "only").every((p) => p.answer)).toBe(true);
    const pdf = await parse(await toPDF(puzzles));
    expect(pdf.filter((p) => p.text.includes("ANSWER KEY"))).toHaveLength(3);
  });
  it("paginates long clues without clipping and escapes SVG content", () => {
    const p = generate({
      type: "scramble",
      words: Array.from(
        { length: 20 },
        (_, i) =>
          `WORD${String.fromCharCode(65 + i)}: ${"A lengthy original clue. ".repeat(5)}`,
      ).join("\n"),
      title: '<script>alert("x")</script>',
      options: { hint: "clue", fontSize: "XL" },
    });
    const pages = layoutPuzzle(p);
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages)
      for (const item of page.items) {
        expect(item.y).toBeGreaterThanOrEqual(0);
        expect(item.y).toBeLessThan(page.height - 10);
      }
    expect(toSVG(pages[0])).not.toContain("<script>");
    expect(toSVG(pages[0])).toContain("&lt;script&gt;");
  });
  it("refuses dense large-print grids explicitly", () => {
    const p = generate({
      type: "word-search",
      options: { size: 30, fontSize: "XL" },
    });
    expect(() => layoutPuzzle(p)).toThrow(/too dense/);
  });
});
it("fits the default crossword and all its clues on one student page", () => {
  const p = generate({ type: "crossword", title: "In the garden", seed: 4317 });
  expect(layoutPuzzle(p)).toHaveLength(1);
  const text = layoutPuzzle(p)[0]
    .items.filter((i) => i.kind === "text")
    .map((i) => i.text)
    .join(" ");
  for (const e of p.entries) expect(text).toContain(e.clue);
});
