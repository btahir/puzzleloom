import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { letters, type Puzzle } from "../../core/src/index";
import { FONT_DATA } from "./fonts.generated";

export type Primitive =
  | {
      kind: "text";
      x: number;
      y: number;
      size: number;
      text: string;
      align?: "left" | "center";
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: boolean;
    };
export type Sheet = {
  width: number;
  height: number;
  font: Puzzle["options"]["font"];
  items: Primitive[];
  id: string;
  answer: boolean;
};
export type KeyMode = "appended" | "none" | "only";
const fonts = new Map<
  string,
  {
    layout: (s: string) => { glyphs: { advanceWidth: number }[] };
    unitsPerEm: number;
    hasGlyphForCodePoint: (n: number) => boolean;
  }
>();
export function fontBytes(name: Puzzle["options"]["font"]) {
  return Uint8Array.from(atob(FONT_DATA[name]), (c) => c.charCodeAt(0));
}
function getFont(name: Puzzle["options"]["font"]) {
  if (!fonts.has(name)) fonts.set(name, fontkit.create(fontBytes(name)));
  return fonts.get(name)!;
}
export function textWidth(
  text: string,
  size: number,
  font: Puzzle["options"]["font"],
) {
  const f = getFont(font);
  return (
    (f.layout(text).glyphs.reduce((sum, g) => sum + g.advanceWidth, 0) /
      f.unitsPerEm) *
    size
  );
}
function wrap(
  text: string,
  width: number,
  size: number,
  font: Puzzle["options"]["font"],
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (textWidth(word, size, font) > width) {
      for (const c of letters(word)) {
        if (textWidth(line + c, size, font) > width) {
          lines.push(line);
          line = "";
        }
        line += c;
      }
      continue;
    }
    const next = line ? line + " " + word : word;
    if (textWidth(next, size, font) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
export function layoutPuzzle(p: Puzzle, answer = false): Sheet[] {
  const width = p.options.paper === "letter" ? 612 : 595.28,
    height = p.options.paper === "letter" ? 792 : 841.89,
    font = p.options.font,
    size = { S: 10, M: 12, L: 15, XL: 18 }[p.options.fontSize],
    pages: Sheet[] = [];
  let sheet: Sheet,
    y = 0;
  const text = (
    s: string,
    x: number,
    yy: number,
    ss = size,
    align: "left" | "center" = "left",
  ) => sheet.items.push({ kind: "text", text: s, x, y: yy, size: ss, align });
  const page = () => {
    sheet = { width, height, font, items: [], id: p.id, answer };
    pages.push(sheet);
    y = 40;
    for (const line of wrap(p.title, width - 80, 22, font)) {
      text(line, 40, y, 22);
      y += 27;
    }
    text(
      answer ? "ANSWER KEY" : p.type.replace("-", " ").toUpperCase(),
      40,
      y + 4,
      9,
    );
    text(p.id, width - 78, y + 4, 9);
    y += 28;
    if (!answer && p.options.nameFields) {
      text(
        "Name: ____________________  Date: __________  Class: ______",
        40,
        y,
        10,
      );
      y += 25;
    }
    for (const line of wrap(p.instructions, width - 80, 11, font)) {
      text(line, 40, y, 11);
      y += 15;
    }
    y += 12;
  };
  const line = (s: string, ss = size) => {
    for (const part of wrap(s, width - 80, ss, font)) {
      if (y + ss * 1.5 > height - 55) page();
      text(part, 40, y, ss);
      y += ss * 1.5;
    }
  };
  page();
  if (p.grid.length) {
    const cols = p.grid[0].length,
      rows = p.grid.length,
      cell = Math.min(29, (width - 90) / cols, 355 / rows),
      gx = (width - cols * cell) / 2,
      gy = y;
    const cellText = cell * (font === "opendyslexic" ? 0.44 : 0.55);
    if (
      (p.options.fontSize === "XL" && cellText < 14) ||
      (p.options.fontSize === "L" && cellText < 11)
    )
      throw new Error(
        "This grid is too dense for large print. Choose a smaller grid or fewer words.",
      );
    const shaded = new Set<string>();
    if (answer && p.type === "word-search")
      p.placements.forEach((q) =>
        letters(q.word).forEach((_, i) =>
          shaded.add(`${q.x + q.dx * i},${q.y + q.dy * i}`),
        ),
      );
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (!p.grid[r][c]) continue;
        const x = gx + c * cell,
          yy = gy + r * cell;
        sheet!.items.push({
          kind: "rect",
          x,
          y: yy,
          width: cell,
          height: cell,
          stroke: p.type === "crossword",
          fill: shaded.has(`${c},${r}`) ? "#dddddd" : "#ffffff",
        });
        if (answer || p.type === "word-search")
          text(
            p.grid[r][c],
            x + cell / 2,
            yy + cell * 0.24,
            cellText,
            "center",
          );
        if (p.type === "crossword") {
          const start = p.placements.find((q) => q.x === c && q.y === r);
          if (start)
            text(
              String(start.number),
              x + 1.5,
              yy + 1,
              Math.min(7, cell * 0.24),
            );
        }
      }
    y += rows * cell + 24;
    if (p.type === "crossword") {
      const columnWidth = (width - 104) / 2;
      const groups = (
        [
          ["Across", 1],
          ["Down", 0],
        ] as const
      ).map(([heading, dx]) => ({
        heading,
        lines: p.placements
          .filter((q) => q.dx === dx)
          .flatMap((q) =>
            wrap(
              `${q.number}. ${q.clue || "Word with " + letters(q.word).length + " letters"}${answer ? " — " + q.word : ""}`,
              columnWidth,
              size,
              font,
            ),
          ),
      }));
      const bottom =
        y + Math.max(...groups.map((g) => g.lines.length)) * size * 1.5 + 30;
      if (bottom < height - 55) {
        for (let col = 0; col < 2; col++) {
          const x = 40 + col * (columnWidth + 24);
          text(groups[col].heading, x, y, size + 2);
          groups[col].lines.forEach((s, i) =>
            text(s, x, y + 26 + i * size * 1.5),
          );
        }
        y = bottom;
      } else {
        for (const g of groups) {
          line(g.heading, size + 2);
          for (const s of g.lines) line(s);
          y += 10;
        }
      }
    }
    if (p.type === "word-search" || p.options.wordBank) {
      line("Word bank", size + 2);
      line(p.entries.map((e) => e.word).join("   ·   "));
    }
  }
  if (p.type === "scramble")
    p.entries.forEach((e, i) => {
      line(`${i + 1}. ${p.scrambled[i]}${answer ? "  —  " + e.word : ""}`);
      if (!answer)
        line(
          p.options.hint === "first"
            ? letters(e.word)[0] + " " + "_ ".repeat(letters(e.word).length - 1)
            : "_ ".repeat(letters(e.word).length),
        );
      if (p.options.hint === "clue" && e.clue)
        line(e.clue, Math.max(10, size - 2));
      y += 12;
    });
  if (p.type === "cryptogram") {
    if (p.given.length) {
      line(
        "A few letters to start: " +
          p.given.map((c) => `${p.cipher[c]} = ${c}`).join("   "),
        size - 1,
      );
      y += 12;
    }
    const encoded = letters(p.encoded),
      plain = letters(p.quote.toUpperCase());
    let x = 40;
    const cw = size * 1.55,
      rh = size * 3.8;
    for (let i = 0; i < encoded.length; i++) {
      if (x + cw > width - 40) {
        x = 40;
        y += rh;
      }
      if (y + rh > height - 55) {
        page();
        x = 40;
      }
      if (encoded[i] === " ") {
        x += cw * 0.7;
        continue;
      }
      const isLetter = /\p{L}/u.test(encoded[i]);
      text(encoded[i], x + cw / 2, y, size, "center");
      if (isLetter) {
        text(
          answer || p.given.includes(plain[i]) ? plain[i] : "_",
          x + cw / 2,
          y + size * 1.6,
          size,
          "center",
        );
      }
      x += cw;
    }
    y += rh + 15;
    if (answer) {
      line("Message", size + 2);
      line(p.quote);
      line("Substitution key", size + 2);
      line(
        Object.entries(p.cipher)
          .map(([a, b]) => `${b}=${a}`)
          .join("  "),
        10,
      );
    }
  }
  pages.forEach((s, i) =>
    s.items.push({
      kind: "text",
      x: 40,
      y: height - 32,
      size: 8,
      text: `Puzzleloom · ${p.id} · ${answer ? "Answer key" : "Puzzle"}${pages.length > 1 ? " · " + (i + 1) + " / " + pages.length : ""}`,
    }),
  );
  return pages;
}
export const escapeXML = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function toSVG(sheet: Sheet, embedFont = false): string {
  const font =
    sheet.font === "atkinson" ? "Atkinson Hyperlegible Next" : "OpenDyslexic";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}" viewBox="0 0 ${sheet.width} ${sheet.height}" role="img" aria-label="${escapeXML(sheet.answer ? "Puzzle answer key" : "Printable puzzle")}">${embedFont ? `<defs><style>@font-face{font-family:'${font}';src:url(data:font/ttf;base64,${FONT_DATA[sheet.font]})}</style></defs>` : ""}<rect width="100%" height="100%" fill="white"/>${sheet.items.map((item) => (item.kind === "rect" ? `<rect x="${item.x}" y="${item.y}" width="${item.width}" height="${item.height}" fill="${item.fill ?? "none"}" ${item.stroke ? 'stroke="black" stroke-width="0.65"' : ""}/>` : `<text x="${item.x}" y="${item.y + item.size * 0.85}" font-family="${font}" font-size="${item.size}" fill="black" text-anchor="${item.align === "center" ? "middle" : "start"}">${escapeXML(item.text)}</text>`)).join("")}</svg>`;
}
export function sheetsFor(
  puzzles: Puzzle[],
  mode: KeyMode = "appended",
): Sheet[] {
  const sheets = [
    ...(mode === "only" ? [] : puzzles.flatMap((p) => layoutPuzzle(p, false))),
    ...(mode === "none" ? [] : puzzles.flatMap((p) => layoutPuzzle(p, true))),
  ];
  if (puzzles.length > 1)
    sheets.forEach((sheet, i) =>
      sheet.items.push({
        kind: "text",
        x: sheet.width - 105,
        y: sheet.height - 32,
        size: 8,
        text: `Page ${i + 1} / ${sheets.length}`,
      }),
    );
  return sheets;
}
export async function toPDF(
  puzzles: Puzzle[],
  mode: KeyMode = "appended",
  title?: string,
): Promise<Uint8Array> {
  const sheets = sheetsFor(puzzles, mode);
  if (!sheets.length) throw new Error("No puzzles to render.");
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fixed = new Date("2000-01-01T00:00:00Z");
  doc.setCreationDate(fixed);
  doc.setModificationDate(fixed);
  doc.setTitle(
    title ?? (puzzles.length === 1 ? puzzles[0].title : "Puzzleloom class set"),
  );
  doc.setAuthor("Puzzleloom");
  doc.setCreator("Puzzleloom");
  doc.setProducer("Puzzleloom");
  const embedded = new Map<string, Awaited<ReturnType<typeof doc.embedFont>>>();
  for (const sheet of sheets) {
    if (!embedded.has(sheet.font))
      embedded.set(
        sheet.font,
        await doc.embedFont(fontBytes(sheet.font), {
          subset: sheet.font !== "opendyslexic",
        }),
      );
    const font = embedded.get(sheet.font)!;
    const page = doc.addPage([sheet.width, sheet.height]);
    for (const item of sheet.items) {
      if (item.kind === "rect") {
        page.drawRectangle({
          x: item.x,
          y: sheet.height - item.y - item.height,
          width: item.width,
          height: item.height,
          color: item.fill
            ? rgb(
                item.fill === "#dddddd" ? 0.87 : 1,
                item.fill === "#dddddd" ? 0.87 : 1,
                item.fill === "#dddddd" ? 0.87 : 1,
              )
            : undefined,
          borderColor: item.stroke ? rgb(0, 0, 0) : undefined,
          borderWidth: item.stroke ? 0.65 : 0,
        });
      } else {
        const unsupported = letters(item.text).filter(
          (c) => !getFont(sheet.font).hasGlyphForCodePoint(c.codePointAt(0)!),
        );
        if (unsupported.length)
          throw new Error(
            `The selected font does not contain: ${[...new Set(unsupported)].join(" ")}. Choose another font or supported letters.`,
          );
        page.drawText(item.text, {
          x:
            item.align === "center"
              ? item.x - font.widthOfTextAtSize(item.text, item.size) / 2
              : item.x,
          y: sheet.height - item.y - item.size * 0.85,
          size: item.size,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }
  }
  return doc.save({ useObjectStreams: false });
}
