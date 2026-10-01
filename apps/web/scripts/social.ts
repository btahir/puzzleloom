/**
 * Draws the social card (1200x630), the PNG favicon and the Apple touch icon from code.
 * The card shows a real puzzle sheet and its answer key, rendered by the same engine as the PDF.
 * Run: pnpm --filter @puzzleloom/web social
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import {
  generate,
  DEFAULT_WORDS,
  type Input,
} from "../../../packages/core/src/index";
import { layoutPuzzle, toSVG } from "../../../packages/render/src/index";
import { markSvg } from "../src/components/mark";

const root = resolve(import.meta.dirname, "../../..");
const pub = resolve(root, "apps/web/public");

/** Young Serif ships as WOFF; resvg needs a plain sfnt, so unwrap the WOFF 1.0 container. */
function woffToSfnt(woff: Buffer): Buffer {
  if (woff.toString("ascii", 0, 4) !== "wOFF")
    throw new Error("Not a WOFF 1.0 file");
  const flavor = woff.readUInt32BE(4),
    numTables = woff.readUInt16BE(12);
  const tables = Array.from({ length: numTables }, (_, i) => {
    const o = 44 + i * 20;
    const tag = woff.subarray(o, o + 4),
      offset = woff.readUInt32BE(o + 4),
      compLength = woff.readUInt32BE(o + 8),
      origLength = woff.readUInt32BE(o + 12),
      checksum = woff.readUInt32BE(o + 16);
    const raw = woff.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : raw;
    return { tag, checksum, data };
  });
  const pow = 2 ** Math.floor(Math.log2(numTables));
  const header = Buffer.alloc(12 + 16 * numTables);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(pow * 16, 6);
  header.writeUInt16BE(Math.log2(pow), 8);
  header.writeUInt16BE(numTables * 16 - pow * 16, 10);
  let offset = header.length;
  const chunks: Buffer[] = [header];
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    t.tag.copy(header, r);
    header.writeUInt32BE(t.checksum, r + 4);
    header.writeUInt32BE(offset, r + 8);
    header.writeUInt32BE(t.data.length, r + 12);
    const padded = Buffer.alloc(Math.ceil(t.data.length / 4) * 4);
    t.data.copy(padded);
    chunks.push(padded);
    offset += padded.length;
  });
  return Buffer.concat(chunks);
}

// resvg-js reads fonts from files, so write the unwrapped serif to a temp folder.
const fontDir = await mkdtemp(resolve(tmpdir(), "puzzleloom-fonts-"));
const serifPath = resolve(fontDir, "YoungSerif-Regular.ttf");
await writeFile(
  serifPath,
  woffToSfnt(
    await readFile(
      resolve(
        root,
        "node_modules/@fontsource/young-serif/files/young-serif-latin-400-normal.woff",
      ),
    ),
  ),
);
const fonts = [
  serifPath,
  resolve(root, "assets/fonts/AtkinsonHyperlegibleNext-Regular.ttf"),
];
function png(svg: string, width: number) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      fontFiles: fonts,
      loadSystemFonts: false,
      defaultFontFamily: "Atkinson Hyperlegible Next",
    },
  })
    .render()
    .asPng();
}

const ink = "#1d2230",
  muted = "#5f6257",
  bg = "#faf6ec",
  desk = "#eee9dc",
  rule = "#ddd6c4",
  yellow = "#f2c14e";

// A real puzzle and its key, exactly as the PDF lays them out.
const puzzle = generate({
  type: "crossword",
  words: DEFAULT_WORDS,
  title: "In the garden",
  seed: 4317,
  options: { autoSize: true } as Input["options"],
});
const inner = (svg: string) =>
  svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
const [sheet] = layoutPuzzle(puzzle, false),
  [key] = layoutPuzzle(puzzle, true);
const sheetW = 330,
  scale = sheetW / sheet.width,
  sheetH = sheet.height * scale;
function placedSheet(s: typeof sheet, x: number, y: number, angle: number) {
  return `<g transform="translate(${x} ${y}) rotate(${angle} ${sheetW / 2} ${sheetH / 2})">
    <rect x="3" y="8" width="${sheetW}" height="${sheetH}" fill="#2a2618" opacity="0.10" filter="url(#soft)"/>
    <svg width="${sheetW}" height="${sheetH}" viewBox="0 0 ${s.width} ${s.height}">${inner(toSVG(s))}</svg>
  </g>`;
}

const lines = [
  "Make a crossword,",
  "word search, scramble",
  "or cryptogram from",
  "your own word list.",
];
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter></defs>
  <rect width="1200" height="630" fill="${bg}"/>
  <rect x="640" y="0" width="560" height="630" fill="${desk}"/>
  <line x1="640" y1="0" x2="640" y2="630" stroke="${rule}" stroke-width="2"/>
  ${markSvg({ tile: 24, stroke: 2.4, ink, shared: yellow, letters: true, x: 72, y: 64 })}
  <text x="168" y="118" font-family="Young Serif" font-size="46" fill="${ink}" letter-spacing="-0.8">Puzzleloom</text>
  ${lines.map((l, i) => `<text x="72" y="${248 + i * 62}" font-family="Young Serif" font-size="47" fill="${ink}" letter-spacing="-1">${l}</text>`).join("")}
  <text x="72" y="526" font-family="Atkinson Hyperlegible Next" font-size="24" fill="${muted}">Printable PDF with the answer key. Free, no account,</text>
  <text x="72" y="560" font-family="Atkinson Hyperlegible Next" font-size="24" fill="${muted}">nothing uploaded.</text>
  ${placedSheet(sheet, 672, 58, -3)}
  ${placedSheet(key, 846, 176, 4)}
</svg>`;
await writeFile(resolve(pub, "og.png"), png(card, 1200));

// Icons: the mark on paper. Letters only where they are legible.
const icon = (size: number, letters: boolean) => {
  const tile = letters ? 44 : 50,
    stroke = letters ? 4 : 6,
    box = tile * 3 + stroke,
    pad = (180 - box) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <rect width="180" height="180" rx="${size > 64 ? 0 : 28}" fill="${bg}"/>
    ${markSvg({ tile, stroke, ink, shared: yellow, letters, x: pad, y: pad })}
  </svg>`;
};
await writeFile(
  resolve(pub, "apple-touch-icon.png"),
  png(icon(180, true), 180),
);
await writeFile(resolve(pub, "icon-32.png"), png(icon(32, false), 32));
await writeFile(
  resolve(pub, "favicon.svg"),
  icon(32, false)
    .replace(/\n\s*/g, "")
    .replace('width="180" height="180" ', "") + "\n",
);
await rm(fontDir, { recursive: true });
console.log("Wrote og.png, apple-touch-icon.png, icon-32.png and favicon.svg");
