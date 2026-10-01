import { describe, it, expect } from "vitest";
import { generate, TYPES, variants } from "../packages/core/src/index";
import {
  layoutPuzzle,
  toSVG,
  toPDF,
  sheetsFor,
  textWidth,
  type Sheet,
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
const W25 = [
  "VOLCANO: A mountain that can erupt, sending ash and lava high into the sky above it",
  "MAGMA: Melted rock underground",
  "LAVA: Melted rock above ground",
  "CRUST: Earth's outer layer, thinner under the oceans than under the continents",
  "MANTLE: Layer beneath the crust",
  "CORE: Earth's center",
  "EARTHQUAKE: Shaking of the ground when plates slip along a fault line deep below",
  "FAULT: Crack in Earth's crust",
  "PLATE: Large piece of the crust",
  "TSUNAMI: Giant ocean wave, often set off by an earthquake under the sea floor",
  "EROSION: Wearing away of rock",
  "WEATHERING: Breaking down of rock",
  "SEDIMENT: Bits of rock and soil carried by water, wind or ice and dropped somewhere new",
  "FOSSIL: Remains of ancient life",
  "MINERAL: Natural solid with a crystal form",
  "IGNEOUS: Rock formed from cooled magma",
  "GRANITE: Common igneous rock",
  "BASALT: Dark volcanic rock",
  "QUARTZ: Hard clear mineral",
  "GLACIER: Slow river of ice that carves valleys as it moves downhill over many years",
  "CANYON: Deep valley with steep sides",
  "DELTA: Land at a river's mouth",
  "ATMOSPHERE: Layer of gases around Earth",
  "CLIMATE: Long-term weather pattern",
  "CRYSTAL: Solid with a repeating pattern",
].join("\n");
type Text = Extract<Sheet["items"][number], { kind: "text" }>;
const texts = (sheets: Sheet[]) =>
  sheets.flatMap((s) => s.items.filter((i): i is Text => i.kind === "text"));
const inBounds = (sheets: Sheet[]) => {
  for (const page of sheets)
    for (const item of page.items) {
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThan(page.height - 10);
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThanOrEqual(page.width);
    }
};
describe("sheet layout uses the page", () => {
  it("scales the default crossword grid to most of the content width on Letter", () => {
    const p = generate({
      type: "crossword",
      title: "In the garden",
      seed: 4317,
    });
    const [sheet] = layoutPuzzle(p);
    const cells = sheet.items.filter(
      (i): i is Extract<Sheet["items"][number], { kind: "rect" }> =>
        i.kind === "rect" && !!i.stroke,
    );
    const gridLeft = Math.min(...cells.map((c) => c.x)),
      gridRight = Math.max(...cells.map((c) => c.x + c.width)),
      content = 612 - 2 * 48;
    expect((gridRight - gridLeft) / content).toBeGreaterThanOrEqual(0.6);
    // Cells are big enough to write in (at least 0.3 in) and centred.
    expect(cells[0].width).toBeGreaterThanOrEqual(0.3 * 72);
    expect(Math.abs(gridLeft - (612 - gridRight))).toBeLessThan(1);
  });
  it("XL (large print) draws larger clues and grid letters than M", () => {
    const sizes = (fontSize: "M" | "XL") => {
      const cw = generate({
          type: "crossword",
          title: "In the garden",
          seed: 4317,
          options: { fontSize },
        }),
        ws = generate({
          type: "word-search",
          seed: 4317,
          options: { fontSize },
        });
      const clue = texts(layoutPuzzle(cw)).find((t) =>
        t.text.startsWith("A small beginning"),
      )!;
      const keyLetter = texts(layoutPuzzle(cw, true)).find(
        (t) =>
          t.text === cw.grid[cw.placements[0].y][cw.placements[0].x] &&
          t.align === "center",
      )!;
      const gridLetter = texts(layoutPuzzle(ws)).find(
        (t) => t.text === ws.grid[0][0] && t.align === "center",
      )!;
      return [clue.size, keyLetter.size, gridLetter.size];
    };
    const m = sizes("M"),
      xl = sizes("XL");
    m.forEach((size, i) => expect(xl[i]).toBeGreaterThan(size * 1.15));
    expect(m[0]).toBeGreaterThanOrEqual(12);
    expect(xl[0]).toBeGreaterThanOrEqual(18);
  });
  it("marks every word in the word search key with a shaded capsule", () => {
    const p = generate({
      type: "word-search",
      seed: 5,
      options: { difficulty: "hard" },
    });
    const key = layoutPuzzle(p, true),
      paths = key.flatMap((s) => s.items.filter((i) => i.kind === "path"));
    // One shaded fill and one outline per placed word.
    expect(paths).toHaveLength(p.placements.length * 2);
    expect(
      layoutPuzzle(p)
        .flatMap((s) => s.items)
        .some((i) => i.kind === "path"),
    ).toBe(false);
    expect(toSVG(key[0])).toContain('fill="#e3e3e3"');
  });
  it("paginates a 25-word crossword with long clues at every size, never clipping", () => {
    for (const fontSize of ["S", "M", "L", "XL"] as const)
      for (const paper of ["letter", "a4"] as const)
        for (const answer of [false, true]) {
          const p = generate({
            type: "crossword",
            words: W25,
            title: "Earth science review",
            seed: 7,
            options: { fontSize, paper },
          });
          const sheets = layoutPuzzle(p, answer);
          inBounds(sheets);
          const all = texts(sheets).map((t) => t.text);
          for (const q of p.placements) expect(all).toContain(`${q.number}.`);
          if (answer)
            for (const q of p.placements)
              expect(all.join(" ")).toContain(q.word);
          if (fontSize === "XL") expect(sheets.length).toBeGreaterThan(1);
          // Every page after the first says it continues the puzzle.
          for (const s of sheets.slice(1))
            expect(
              s.items.some((i) => i.kind === "text" && i.text === "continued"),
            ).toBe(true);
        }
  });
  it("keeps every type on one Letter page by default and in bounds with OpenDyslexic", () => {
    for (const type of TYPES)
      for (const font of ["atkinson", "opendyslexic"] as const) {
        const p = generate({ type, seed: 11, options: { font } });
        const pages = layoutPuzzle(p),
          key = layoutPuzzle(p, true);
        expect(pages).toHaveLength(1);
        inBounds([...pages, ...key]);
      }
  });
  it("places centred and right-aligned PDF text where the SVG puts it", async () => {
    const p = generate({ type: "crossword", seed: 4317 });
    const [sheet] = layoutPuzzle(p, true);
    const pdf = await parse(await toPDF([p], "only"));
    for (const align of ["center", "right"] as const) {
      const item = texts([sheet]).find(
        (t) => t.align === align && t.text.length > 0,
      )!;
      const printed = pdf[0].items.find(
        (i) =>
          "str" in i &&
          i.str === item.text &&
          Math.abs(792 - i.transform[5] - (item.y + item.size * 0.85)) < 0.01,
      );
      const w = textWidth(item.text, item.size, sheet.font);
      expect(
        printed && "transform" in printed ? printed.transform[4] : -1,
      ).toBeCloseTo(item.x - (align === "center" ? w / 2 : w), 2);
      expect(toSVG(sheet)).toContain(
        `x="${item.x}" y="${item.y + item.size * 0.85}"`,
      );
    }
  });
  it("lays out the same puzzle identically every time", () => {
    for (const type of TYPES) {
      const p = generate({ type, seed: 99 });
      expect(layoutPuzzle(p).map((s) => toSVG(s))).toEqual(
        layoutPuzzle(structuredClone(p)).map((s) => toSVG(s)),
      );
    }
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
