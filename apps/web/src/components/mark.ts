/**
 * The Puzzleloom mark: letter tiles where an across word and a down word share a letter.
 * PEN reads across, PAD reads down, and they share the P (pencil yellow).
 * Shared by the React logo, the favicon and the social image script.
 */
export const MARK_TILES = [
  { x: 0, y: 0, letter: "P", shared: true },
  { x: 1, y: 0, letter: "E", shared: false },
  { x: 2, y: 0, letter: "N", shared: false },
  { x: 0, y: 1, letter: "A", shared: false },
  { x: 0, y: 2, letter: "D", shared: false },
] as const;

/** Standalone SVG markup for the mark, in a 3x3 tile box. */
export function markSvg({
  tile = 12,
  stroke = 1.5,
  ink = "#1d2230",
  paper = "#ffffff",
  shared = "#f2c14e",
  letters = false,
  font = "Atkinson Hyperlegible Next",
  x = 0,
  y = 0,
}: {
  tile?: number;
  stroke?: number;
  ink?: string;
  paper?: string;
  shared?: string;
  letters?: boolean;
  font?: string;
  x?: number;
  y?: number;
} = {}) {
  const half = stroke / 2;
  return MARK_TILES.map((t) => {
    const tx = x + t.x * tile + half,
      ty = y + t.y * tile + half;
    const rect = `<rect x="${tx}" y="${ty}" width="${tile}" height="${tile}" fill="${t.shared ? shared : paper}" stroke="${ink}" stroke-width="${stroke}"/>`;
    const text = letters
      ? `<text x="${tx + tile / 2}" y="${ty + tile * 0.72}" font-family="${font}" font-weight="700" font-size="${tile * 0.58}" fill="${ink}" text-anchor="middle">${t.letter}</text>`
      : "";
    return rect + text;
  }).join("");
}
