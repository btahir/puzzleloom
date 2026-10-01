import { PDFDocument, rgb, LineCapStyle } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { letters, type Puzzle } from "../../core/src/index";
import { FONT_DATA } from "./fonts.generated";

/**
 * One sheet layout feeds both the SVG preview and the PDF. Every primitive is
 * in points with the origin at the top-left of the page. A text item's `y` is
 * the top of its em box; the baseline sits at `y + size * 0.85` in both
 * outputs.
 */
export type Primitive =
  | {
      kind: "text";
      x: number;
      y: number;
      size: number;
      text: string;
      align?: "left" | "center" | "right";
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill?: string;
      stroke?: boolean;
      strokeWidth?: number;
    }
  | {
      kind: "line";
      x: number;
      y: number;
      x2: number;
      y2: number;
      width: number;
    }
  | {
      /** Closed outline in page coordinates; x/y is its top-left corner. */
      kind: "path";
      x: number;
      y: number;
      d: string;
      fill?: string;
      strokeWidth?: number;
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
type FontName = Puzzle["options"]["font"];
const fonts = new Map<
  string,
  {
    layout: (s: string) => { glyphs: { advanceWidth: number }[] };
    unitsPerEm: number;
    capHeight: number;
    hasGlyphForCodePoint: (n: number) => boolean;
  }
>();
export function fontBytes(name: FontName) {
  return Uint8Array.from(atob(FONT_DATA[name]), (c) => c.charCodeAt(0));
}
function getFont(name: FontName) {
  if (!fonts.has(name)) fonts.set(name, fontkit.create(fontBytes(name)));
  return fonts.get(name)!;
}
export function textWidth(text: string, size: number, font: FontName) {
  const f = getFont(font);
  return (
    (f.layout(text).glyphs.reduce((sum, g) => sum + g.advanceWidth, 0) /
      f.unitsPerEm) *
    size
  );
}
/** Cap height as a fraction of the font size. */
const capHeight = (font: FontName) =>
  getFont(font).capHeight / getFont(font).unitsPerEm;
function wrap(
  text: string,
  width: number,
  size: number,
  font: FontName,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (textWidth(word, size, font) > width) {
      if (line) {
        lines.push(line);
        line = "";
      }
      for (const c of letters(word)) {
        if (line && textWidth(line + c, size, font) > width) {
          lines.push(line);
          line = "";
        }
        line += c;
      }
      continue;
    }
    const next = line ? line + " " + word : word;
    if (line && textWidth(next, size, font) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Type and grid scale for each text size option. XL is large print.
 * - body: clue and list text (pt); title: puzzle title.
 * - cell: crossword cell [smallest we accept before moving clues overleaf,
 *   largest we draw]; search: largest word-search cell.
 * - glyph: grid letter size as a share of the cell. Bigger options use a
 *   bigger share, so large print grows even when the page limits the cell.
 * - floor: large print refuses grids whose letters would fall below this.
 * - comfy: below this, a word search gives its page to the grid and starts
 *   the word bank overleaf.
 */
const SCALE = {
  S: {
    body: 10.5,
    title: 24,
    cell: [18, 32],
    search: 26,
    glyph: 0.54,
    floor: 0,
    comfy: 7.5,
  },
  M: {
    body: 12,
    title: 26,
    cell: [20, 36],
    search: 30,
    glyph: 0.58,
    floor: 0,
    comfy: 8,
  },
  L: {
    body: 14.5,
    title: 28,
    cell: [26, 40],
    search: 36,
    glyph: 0.64,
    floor: 11,
    comfy: 13,
  },
  XL: {
    body: 18,
    title: 30,
    cell: [30, 46],
    search: 44,
    glyph: 0.72,
    floor: 14,
    comfy: 18,
  },
} as const;
const LABELS: Record<Puzzle["type"], string> = {
  crossword: "CROSSWORD",
  "word-search": "WORD SEARCH",
  scramble: "WORD SCRAMBLE",
  cryptogram: "CRYPTOGRAM",
};
/** Page geometry shared by the layout and the class-set page numbers. */
const MARGIN = 48,
  TOP = 40,
  FOOTER = 30,
  FOOT_SIZE = 8;
const round = (n: number) => Math.round(n * 100) / 100;
const KEY_GREY = "#e3e3e3";
type Block = {
  h: number;
  keep?: boolean;
  draw: (x: number, y: number) => void;
};

export function layoutPuzzle(p: Puzzle, answer = false): Sheet[] {
  const width = p.options.paper === "letter" ? 612 : 595.28,
    height = p.options.paper === "letter" ? 792 : 841.89,
    font = p.options.font,
    dyslexic = font === "opendyslexic",
    scale = SCALE[p.options.fontSize],
    size: number = scale.body,
    lead = size * (dyslexic ? 1.55 : 1.45),
    left = MARGIN,
    right = width - MARGIN,
    W = right - left,
    bottom = height - FOOTER - 26,
    pages: Sheet[] = [];
  let sheet!: Sheet,
    y = 0,
    topY = 0;
  const text = (
    s: string,
    x: number,
    baseline: number,
    ss = size,
    align: "left" | "center" | "right" = "left",
  ) =>
    sheet.items.push({
      kind: "text",
      text: s,
      x: round(x),
      y: round(baseline - ss * 0.85),
      size: ss,
      align,
    });
  const rule = (x: number, yy: number, x2: number, w = 0.75) =>
    sheet.items.push({
      kind: "line",
      x: round(x),
      y: round(yy),
      x2: round(x2),
      y2: round(yy),
      width: w,
    });
  const box = (
    x: number,
    yy: number,
    w: number,
    h: number,
    stroke = true,
    fill?: string,
    strokeWidth = 0.75,
  ) =>
    sheet.items.push({
      kind: "rect",
      x: round(x),
      y: round(yy),
      width: round(w),
      height: round(h),
      fill,
      stroke,
      strokeWidth,
    });
  /** Section heading with a rule under it; returns the height used. */
  const headingSize = round(size * 1.2);
  const headingHeight = headingSize * 1.25 + size * 0.75;
  const heading = (label: string, x: number, yy: number, w: number) => {
    text(label, x, yy + headingSize, headingSize);
    rule(x, yy + headingSize * 1.25, x + w, 0.6);
    return headingHeight;
  };

  const page = (continued = false) => {
    sheet = { width, height, font, items: [], id: p.id, answer };
    pages.push(sheet);
    y = TOP;
    const kicker = 9;
    text(LABELS[p.type], left, y + kicker, kicker);
    if (answer) {
      const w = textWidth("ANSWER KEY", 9.5, font);
      box(right - w - 14, y - 4, w + 14, 9.5 + 8, true, undefined, 0.9);
      text("ANSWER KEY", right - 7, y + 9.5 - 0.5, 9.5, "right");
    }
    y += kicker + 12;
    if (continued) {
      const t = 16;
      const lines = wrap(p.title, W - 90, t, font);
      text(lines[0] + (lines.length > 1 ? "…" : ""), left, y + t, t);
      text("continued", right, y + t, 10, "right");
      y += t * 1.3 + 6;
      rule(left, y, right, 1);
      y += size * 1.4;
      topY = y;
      return;
    }
    const t = scale.title;
    for (const line of wrap(p.title, W, t, font)) {
      text(line, left, y + t * 0.9, t);
      y += t * 1.18;
    }
    y += 8;
    if (!answer && p.options.nameFields) {
      const ns = Math.min(14, Math.max(10.5, size * 0.95)),
        baseline = y + ns + 6,
        fields: [string, number][] = [
          ["Name", 0.5],
          ["Date", 0.26],
          ["Class", 0.24],
        ];
      let x = left;
      for (const [label, share] of fields) {
        const end = label === "Class" ? right : x + W * share - 18;
        text(label, x, baseline, ns);
        rule(x + textWidth(label, ns, font) + 6, baseline + 2, end, 0.6);
        x += W * share;
      }
      y = baseline + 14;
    } else y += 4;
    rule(left, y, right, 1.25);
    y += size * 1.3;
    if (!answer && p.instructions.trim()) {
      const is = round(size * 0.96);
      for (const line of wrap(p.instructions, W, is, font)) {
        text(line, left, y + is, is);
        y += is * 1.4;
      }
      y += size * 0.9;
    } else y += size * 0.3;
    topY = y;
  };

  /**
   * Pour blocks into columns, balanced when they fit on this page, and onto
   * continuation pages when they do not. Never clips: a block too tall for an
   * empty page is an explicit error.
   */
  const flow = (blocks: Block[], ncols: number, gutter = 26) => {
    const colW = (W - gutter * (ncols - 1)) / ncols;
    const columnsNeeded = (from: number, H: number) => {
      let cols = 1,
        cy = 0;
      for (let i = from; i < blocks.length; i++) {
        const need =
          blocks[i].h + (blocks[i].keep && blocks[i + 1] ? blocks[i + 1].h : 0);
        if (cy > 0 && cy + need > H) {
          cols++;
          cy = 0;
        }
        if (blocks[i].h > H) return Infinity;
        cy += blocks[i].h;
      }
      return cols;
    };
    let i = 0;
    while (i < blocks.length) {
      const avail = bottom - y;
      let H = avail;
      if (columnsNeeded(i, avail) <= ncols) {
        const total = blocks.slice(i).reduce((s, b) => s + b.h, 0);
        H = Math.min(avail, Math.ceil(total / ncols));
        while (H < avail && columnsNeeded(i, H) > ncols) H += 1;
      }
      const fresh = y === topY;
      let col = 0,
        cy = 0,
        used = 0;
      while (i < blocks.length) {
        const b = blocks[i],
          need = b.h + (b.keep && blocks[i + 1] ? blocks[i + 1].h : 0);
        if (cy + need > H) {
          if (cy === 0 && fresh) {
            if (b.h > H)
              throw new Error(
                "One clue is too long to fit on a page at this text size. Shorten it or pick a smaller size.",
              );
          } else {
            col++;
            cy = 0;
            if (col >= ncols) break;
            continue;
          }
        }
        b.draw(left + col * (colW + gutter), y + cy);
        cy += b.h;
        used = Math.max(used, cy);
        i++;
      }
      if (i < blocks.length) page(true);
      else y += used;
    }
  };

  /** Word bank: checkbox + word, in as many columns as the longest word allows. */
  const wordBank = () => {
    const words = p.entries.map((e) => e.word),
      bs = round(Math.min(size * 1.05, 16)),
      check = bs * 0.62,
      longest = Math.max(...words.map((w) => textWidth(w, bs, font))),
      colGap = 22,
      ncols = Math.max(
        1,
        Math.min(5, Math.floor((W + colGap) / (longest + check + 10 + colGap))),
      ),
      rowH = bs * 1.6;
    return {
      ncols,
      height: headingHeight + Math.ceil(words.length / ncols) * rowH,
      draw: () => {
        // Keep the bank together: start it overleaf rather than split it.
        if (
          y !== topY &&
          y + headingHeight + Math.ceil(words.length / ncols) * rowH > bottom
        )
          page(true);
        y += heading("Word bank", left, y, W);
        flow(
          words.map((w) => ({
            h: rowH,
            draw: (x, yy) => {
              const base = yy + bs * 1.05;
              box(x, base - check, check, check, true, undefined, 0.6);
              text(w, x + check + 8, base, bs);
            },
          })),
          ncols,
          colGap,
        );
      },
    };
  };

  /** Clue entries as flow blocks: right-aligned number, hanging indent. */
  const clueBlocks = (colW: number) => {
    const numW = textWidth("00.", size, font) + 2,
      indent = numW + size * 0.6,
      gap = size * 0.4;
    return (["Across", "Down"] as const)
      .map((label) => {
        const list = p.placements.filter((q) =>
          label === "Across" ? q.dx === 1 : q.dx === 0,
        );
        const blocks: Block[] = [
          {
            h: headingHeight,
            keep: true,
            draw: (x, yy) => void heading(label, x, yy, colW),
          },
        ];
        for (const q of list) {
          const clue = q.clue || `Word with ${letters(q.word).length} letters`;
          // The key's grid already shows the answers in place, so its lists are
          // a compact check: number and word.
          const lines = wrap(answer ? q.word : clue, colW - indent, size, font);
          blocks.push({
            h: lines.length * lead + gap,
            draw: (x, yy) => {
              text(`${q.number}.`, x + numW, yy + size, size, "right");
              lines.forEach((l, k) =>
                text(l, x + indent, yy + size + k * lead, size),
              );
            },
          });
        }
        // Breathing room before the next heading when Down follows Across.
        if (blocks.length > 1) blocks[blocks.length - 1].h += size * 0.8;
        return blocks;
      })
      .filter((g) => g.length > 1);
  };

  const gridGlyph = (cell: number, ratio: number) =>
    cell * ratio * (dyslexic ? 0.82 : 1);
  const tooDense = (glyph: number) => {
    if (scale.floor && glyph < scale.floor)
      throw new Error(
        "This grid is too dense for large print. Choose a smaller grid or fewer words.",
      );
  };
  /** Letter centred in a cell by its cap height. */
  const cellLetter = (s: string, cx: number, cy: number, gs: number) =>
    text(s, cx, cy + (capHeight(font) * gs) / 2, gs, "center");

  page();

  if (p.type === "crossword") {
    const cols = p.grid[0]?.length ?? 0,
      rows = p.grid.length,
      [minCell, maxCell] = scale.cell,
      gutter = 26,
      bank = p.options.wordBank ? wordBank() : undefined,
      bankH = bank ? size * 1.4 + bank.height : 0,
      gapAfter = size * 1.6,
      quarter = (n: number) => Math.floor(n * 4) / 4,
      plan = (ncols: number) => {
        const colW = (W - gutter * (ncols - 1)) / ncols,
          groups = clueBlocks(colW),
          groupH = groups.map((g) => g.reduce((s, b) => s + b.h, 0)),
          sum = groupH.reduce((a, b) => a + b, 0),
          cluesH =
            ncols === 2
              ? Math.max(...groupH)
              : Math.ceil(sum / ncols) + headingHeight,
          onePage = Math.min(
            maxCell,
            W / cols,
            (bottom - y - gapAfter - cluesH - bankH - 4) / rows,
          );
        return { ncols, colW, groups, groupH, sum, cluesH, onePage };
      },
      // Key lists are just "number. WORD", so when two columns crowd the
      // grid they pack into more.
      longest = Math.max(
        ...p.placements.map((q) => textWidth(`00. ${q.word}`, size, font)),
      ),
      packed = Math.min(
        4,
        Math.floor((W + gutter) / (longest + size + gutter)),
      ),
      two = plan(2),
      three = two.onePage < minCell && !answer ? plan(3) : two,
      // Keys pack their short lists; a student sheet tries three narrower
      // clue columns before giving the clues a page of their own.
      below =
        answer && two.onePage < maxCell && packed > 2
          ? plan(packed)
          : three.onePage >= minCell
            ? three
            : two,
      // Tall, narrow grids can sit beside a single column of clues instead:
      // try a few column widths and keep the one that gives the biggest cells.
      sideRoom = bottom - y - bankH,
      sides = [0.4, 0.46, 0.52].map((share) => {
        const sideW = Math.round(W * share),
          sideBlocks = clueBlocks(sideW).flat(),
          sideH = sideBlocks.reduce((s, b) => s + b.h, 0),
          sideCell = Math.min(
            maxCell,
            (W - sideW - gutter) / cols,
            sideRoom / rows,
          );
        return { sideW, sideBlocks, fits: sideH <= sideRoom, sideCell };
      }),
      best = sides
        .filter((o) => o.fits)
        .reduce<(typeof sides)[number] | undefined>(
          (a, o) => (!a || o.sideCell > a.sideCell + 0.01 ? o : a),
          undefined,
        ),
      { sideW, sideBlocks, sideCell } = best ?? sides[0],
      side =
        !!best &&
        sideCell >= minCell &&
        sideCell > Math.max(below.onePage, 0) + 2,
      { ncols, colW, groups, groupH, sum, cluesH, onePage } = below,
      cell = quarter(
        side
          ? sideCell
          : onePage >= minCell
            ? onePage
            : Math.min(maxCell, W / cols, (bottom - y - gapAfter) / rows),
      );
    tooDense(gridGlyph(cell, 0.55));
    const gx = side
        ? left + (W - sideW - gutter - cols * cell) / 2
        : left + (W - cols * cell) / 2,
      gy = y,
      numSize = round(Math.min(10, Math.max(6.5, cell * 0.25))),
      gs = round(gridGlyph(cell, scale.glyph));
    const starts = new Map(
      p.placements.map((q) => [`${q.x},${q.y}`, q.number]),
    );
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (!p.grid[r][c]) continue;
        const x = gx + c * cell,
          yy = gy + r * cell;
        box(x, yy, cell, cell, true, "#ffffff", 1);
        const n = starts.get(`${c},${r}`);
        if (n) text(String(n), x + 2, yy + 2 + numSize * 0.85, numSize);
        if (answer)
          cellLetter(p.grid[r][c], x + cell / 2, yy + cell * 0.57, gs);
      }
    if (side) {
      let cy = y;
      for (const b of sideBlocks) {
        b.draw(right - sideW, cy);
        cy += b.h;
      }
      y = Math.max(gy + rows * cell + gapAfter, cy);
    } else {
      y = gy + rows * cell + gapAfter;
      // Clues that do not fit under the grid start on a clean page of their
      // own rather than leaving a sliver of clues at the foot of the grid page.
      const room = bottom - y;
      if (cluesH > room && (sum / ncols) * 1.1 > room) page(true);
      if (
        ncols === 2 &&
        groups.length === 2 &&
        groupH.every((h) => h <= bottom - y)
      ) {
        groups.forEach((g, k) => {
          let cy = y;
          for (const b of g) {
            b.draw(left + k * (colW + gutter), cy);
            cy += b.h;
          }
        });
        y += Math.max(...groupH);
      } else flow(groups.flat(), ncols, gutter);
    }
    if (bank) {
      y += size * 1.4;
      bank.draw();
    }
  }

  if (p.type === "word-search") {
    const cols = p.grid[0].length,
      rows = p.grid.length,
      bank = wordBank(),
      pad = 10,
      gap = size * 1.5,
      fit = (room: number) =>
        Math.floor(
          Math.min(
            scale.search,
            (W - 2 * pad) / cols,
            (room - 2 * pad) / rows,
          ) * 4,
        ) / 4;
    let cell = fit(bottom - y - gap - bank.height);
    // When the bank would squeeze the grid below a comfortable size, give the
    // grid the page and let the bank continue overleaf.
    if (gridGlyph(cell, scale.glyph) < scale.comfy)
      cell = Math.max(cell, fit(bottom - y - gap));
    const gs = round(gridGlyph(cell, scale.glyph));
    tooDense(gs);
    const gw = cols * cell + 2 * pad,
      gh = rows * cell + 2 * pad,
      gx = left + (W - gw) / 2,
      gy = y;
    box(gx, gy, gw, gh, true, undefined, 1.25);
    if (answer) {
      const shapes = p.placements.map((q) => {
        const r = cell * (q.dx && q.dy ? 0.36 : 0.4),
          k = 0.5523 * r,
          n = letters(q.word).length - 1,
          ax = gx + pad + (q.x + 0.5) * cell,
          ay = gy + pad + (q.y + 0.5) * cell,
          bx = ax + q.dx * n * cell,
          by = ay + q.dy * n * cell,
          len = Math.hypot(q.dx, q.dy),
          ux = q.dx / len,
          uy = q.dy / len,
          nx = -uy,
          ny = ux,
          f = (v: number) => round(v).toString();
        const pt = (x: number, yy: number) => `${f(x)} ${f(yy)}`;
        // Capsule: side, round end at B, side back, round end at A.
        const d = [
          `M ${pt(ax + nx * r, ay + ny * r)}`,
          `L ${pt(bx + nx * r, by + ny * r)}`,
          `C ${pt(bx + nx * r + ux * k, by + ny * r + uy * k)} ${pt(bx + ux * r + nx * k, by + uy * r + ny * k)} ${pt(bx + ux * r, by + uy * r)}`,
          `C ${pt(bx + ux * r - nx * k, by + uy * r - ny * k)} ${pt(bx - nx * r + ux * k, by - ny * r + uy * k)} ${pt(bx - nx * r, by - ny * r)}`,
          `L ${pt(ax - nx * r, ay - ny * r)}`,
          `C ${pt(ax - nx * r - ux * k, ay - ny * r - uy * k)} ${pt(ax - ux * r - nx * k, ay - uy * r - ny * k)} ${pt(ax - ux * r, ay - uy * r)}`,
          `C ${pt(ax - ux * r + nx * k, ay - uy * r + ny * k)} ${pt(ax + nx * r - ux * k, ay + ny * r - uy * k)} ${pt(ax + nx * r, ay + ny * r)}`,
          "Z",
        ].join(" ");
        return {
          d,
          x: round(Math.min(ax, bx) - r),
          y: round(Math.min(ay, by) - r),
        };
      });
      for (const s of shapes)
        sheet.items.push({ kind: "path", ...s, fill: KEY_GREY });
      for (const s of shapes)
        sheet.items.push({ kind: "path", ...s, strokeWidth: 0.9 });
    }
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        cellLetter(
          p.grid[r][c],
          gx + pad + (c + 0.5) * cell,
          gy + pad + (r + 0.5) * cell,
          gs,
        );
    y = gy + gh + gap;
    bank.draw();
  }

  if (p.type === "scramble") {
    const ss = round(size * 1.15),
      numW = textWidth("00.", ss, font) + 2,
      indent = numW + size * 0.6,
      pitch = size * 1.95,
      minPitch = ss * 1.15,
      spaced = p.scrambled.map((s) => letters(s).join(" ")),
      scrW = Math.max(...spaced.map((s) => textWidth(s, ss, font))),
      maxLen = Math.max(...p.entries.map((e) => letters(e.word).length)),
      clueSize = round(Math.max(9.5, size * 0.9)),
      rowH = ss * 2;
    /** Rows for a column of the given width, or undefined if blanks cannot fit. */
    const build = (
      colW: number,
      force = false,
    ): { blocks: Block[]; inline: boolean } | undefined => {
      const inlineX = indent + scrW + size * 1.6,
        inlinePitch = Math.min(pitch, (colW - inlineX) / maxLen),
        inline = inlinePitch >= minPitch,
        answerX = inline ? inlineX : indent,
        stackedPitch = Math.min(pitch, (colW - indent) / maxLen);
      if (!inline && stackedPitch < minPitch && !force) return undefined;
      const blocks = p.entries.map((e, i): Block => {
        const word = letters(e.word),
          step = inline ? inlinePitch : stackedPitch,
          clue =
            p.options.hint === "clue" && e.clue
              ? wrap(e.clue, colW - indent, clueSize, font)
              : [],
          answerRows = inline ? 0 : 1;
        return {
          h:
            rowH * (1 + answerRows) +
            clue.length * clueSize * 1.4 +
            size * (clue.length ? 1.1 : 0.5),
          draw: (x, yy) => {
            const base = yy + ss * 1.45;
            text(`${i + 1}.`, x + numW, base, ss, "right");
            text(spaced[i], x + indent, base, ss);
            const ab = base + answerRows * rowH;
            if (answer) {
              text(e.word, x + answerX, ab, ss);
              rule(
                x + answerX,
                ab + 4,
                x + answerX + textWidth(e.word, ss, font),
                0.6,
              );
            } else
              word.forEach((ch, k) => {
                const bx = x + answerX + k * step,
                  bw = step * 0.76;
                rule(bx, ab + 4, bx + bw, 0.9);
                if (k === 0 && p.options.hint === "first")
                  text(ch, bx + bw / 2, ab, ss, "center");
              });
            clue.forEach((l, k) =>
              text(
                l,
                x + indent,
                ab + clueSize * 1.55 + k * clueSize * 1.4,
                clueSize,
              ),
            );
          },
        };
      });
      return { blocks, inline };
    };
    // Prefer one column when it fits the page; then rows that keep the answer
    // blanks beside the scrambled word; then two columns; then one column.
    const one = build(W, true)!,
      two = build((W - 32) / 2),
      total = one.blocks.reduce((s, b) => s + b.h, 0);
    if (total <= bottom - y || !two) flow(one.blocks, 1);
    else if (two.inline || !one.inline) flow(two.blocks, 2, 32);
    else flow(one.blocks, 1);
  }

  if (p.type === "cryptogram") {
    const plain = letters(p.quote.toUpperCase()),
      encoded = letters(p.encoded),
      decode = new Map(Object.entries(p.cipher).map(([a, b]) => [b, a])),
      cw = round(size * (dyslexic ? 2.2 : 2)),
      punctW = size * 0.8,
      as = round(size * 1.3),
      cs = round(size * 1.05),
      rowH = as * 1.45 + cs * 1.3 + size * 1.1,
      isLetter = (c: string) => /\p{L}/u.test(c);
    if (p.given.length) {
      const gs = round(size * 0.95);
      const lines = wrap(
        "Given: " + p.given.map((c) => `${p.cipher[c]} = ${c}`).join(",  "),
        W,
        gs,
        font,
      );
      for (const l of lines) {
        text(l, left, y + gs, gs);
        y += gs * 1.4;
      }
      y += size * 0.8;
    }
    // Split into words (keeping their indexes) and wrap at word boundaries.
    const words: { from: number; to: number }[] = [];
    for (let i = 0; i < encoded.length;) {
      if (encoded[i] === " ") {
        i++;
        continue;
      }
      let j = i;
      while (j < encoded.length && encoded[j] !== " ") j++;
      words.push({ from: i, to: j });
      i = j;
    }
    const charW = (c: string) => (isLetter(c) ? cw : punctW);
    const lines: { from: number; to: number }[][] = [[]];
    let lineW = 0;
    const space = cw * 0.75;
    for (const w of words) {
      let ww = 0;
      for (let i = w.from; i < w.to; i++) ww += charW(encoded[i]);
      if (lineW > 0 && lineW + space + ww > W) {
        lines.push([]);
        lineW = 0;
      }
      if (ww > W) {
        // A single word wider than the line: split it.
        let start = w.from,
          acc = 0;
        for (let i = w.from; i < w.to; i++) {
          if (acc + charW(encoded[i]) > W - lineW) {
            lines.at(-1)!.push({ from: start, to: i });
            lines.push([]);
            lineW = 0;
            start = i;
            acc = 0;
          }
          acc += charW(encoded[i]);
        }
        lines.at(-1)!.push({ from: start, to: w.to });
        lineW = acc;
        continue;
      }
      lines.at(-1)!.push(w);
      lineW += (lineW > 0 ? space : 0) + ww;
    }
    for (const line of lines) {
      if (y + rowH > bottom) page(true);
      let x = left;
      const ab = y + as * 1.3,
        cb = ab + cs * 1.55;
      line.forEach((w, k) => {
        if (k > 0) x += space;
        for (let i = w.from; i < w.to; i++) {
          const c = encoded[i];
          if (isLetter(c)) {
            rule(x + 2, ab + 3, x + cw - 2, 0.9);
            if (answer || p.given.includes(plain[i]))
              text(plain[i], x + cw / 2, ab, as, "center");
            text(c, x + cw / 2, cb + 0.5, cs, "center");
          } else text(c, x + punctW / 2, ab, as, "center");
          x += charW(c);
        }
      });
      y += rowH;
    }
    // Letter key strip: code letters with a box to note what each stands for.
    const codes = [...new Set(Object.values(p.cipher))].sort(),
      rowsN = Math.ceil(codes.length / Math.floor(W / (size * 2))),
      perRow = Math.ceil(codes.length / rowsN),
      sw = Math.min(W / perRow, size * 2.4),
      ls = round(Math.min(sw * 0.5, size)),
      stripH = rowsN * (sw * 2 + 8);
    y += size * 0.6;
    if (y + headingHeight + stripH + size > bottom) page(true);
    y += heading("Letter key", left, y, W);
    for (let rI = 0; rI < rowsN; rI++) {
      const row = codes.slice(rI * perRow, (rI + 1) * perRow),
        sx = left + (W - row.length * sw) / 2;
      row.forEach((code, k) => {
        const x = sx + k * sw;
        box(x, y, sw, sw, true, KEY_GREY, 0.6);
        box(x, y + sw, sw, sw, true, undefined, 0.6);
        cellLetter(code, x + sw / 2, y + sw / 2, ls);
        const known = decode.get(code)!;
        if (answer || p.given.includes(known))
          cellLetter(known, x + sw / 2, y + sw * 1.5, ls);
      });
      y += sw * 2 + 8;
    }
    if (answer) {
      y += size;
      const qs = size;
      const qLines = wrap(p.quote, W, qs, font);
      if (y + headingHeight + qLines.length * lead > bottom) page(true);
      y += heading("Message", left, y, W);
      for (const l of qLines) {
        if (y + lead > bottom) page(true);
        text(l, left, y + qs, qs);
        y += lead;
      }
    }
  }

  pages.forEach((s, i) =>
    s.items.push({
      kind: "text",
      x: left,
      y: round(height - FOOTER - FOOT_SIZE * 0.85),
      size: FOOT_SIZE,
      text: `Puzzleloom · ${p.id}${answer ? " · Answer key" : ""}${pages.length > 1 ? ` · ${i + 1} of ${pages.length}` : ""}`,
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
const ANCHOR = { left: "start", center: "middle", right: "end" } as const;
export function toSVG(sheet: Sheet, embedFont = false): string {
  const font =
    sheet.font === "atkinson" ? "Atkinson Hyperlegible Next" : "OpenDyslexic";
  const item = (i: Primitive) => {
    switch (i.kind) {
      case "rect":
        return `<rect x="${i.x}" y="${i.y}" width="${i.width}" height="${i.height}" fill="${i.fill ?? "none"}"${i.stroke ? ` stroke="black" stroke-width="${i.strokeWidth ?? 0.75}"` : ""}/>`;
      case "line":
        return `<line x1="${i.x}" y1="${i.y}" x2="${i.x2}" y2="${i.y2}" stroke="black" stroke-width="${i.width}"/>`;
      case "path":
        return `<path d="${i.d}" fill="${i.fill ?? "none"}"${i.strokeWidth ? ` stroke="black" stroke-width="${i.strokeWidth}"` : ""}/>`;
      case "text":
        return `<text x="${i.x}" y="${i.y + i.size * 0.85}" font-family="${font}" font-size="${i.size}" fill="black" text-anchor="${ANCHOR[i.align ?? "left"]}">${escapeXML(i.text)}</text>`;
    }
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sheet.width}" height="${sheet.height}" viewBox="0 0 ${sheet.width} ${sheet.height}" role="img" aria-label="${escapeXML(sheet.answer ? "Puzzle answer key" : "Printable puzzle")}">${embedFont ? `<defs><style>@font-face{font-family:'${font}';src:url(data:font/ttf;base64,${FONT_DATA[sheet.font]})}</style></defs>` : ""}<rect width="100%" height="100%" fill="white"/>${sheet.items.map(item).join("")}</svg>`;
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
        x: sheet.width - MARGIN,
        y: round(sheet.height - FOOTER - FOOT_SIZE * 0.85),
        size: FOOT_SIZE,
        align: "right",
        text: `Page ${i + 1} of ${sheets.length}`,
      }),
    );
  return sheets;
}
const colour = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};
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
  const black = rgb(0, 0, 0);
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
          color: item.fill ? colour(item.fill) : undefined,
          borderColor: item.stroke ? black : undefined,
          borderWidth: item.stroke ? (item.strokeWidth ?? 0.75) : 0,
        });
      } else if (item.kind === "line") {
        page.drawLine({
          start: { x: item.x, y: sheet.height - item.y },
          end: { x: item.x2, y: sheet.height - item.y2 },
          thickness: item.width,
          color: black,
          lineCap: LineCapStyle.Butt,
        });
      } else if (item.kind === "path") {
        // drawSvgPath flips the y axis itself, so page coordinates work as-is.
        page.drawSvgPath(item.d, {
          x: 0,
          y: sheet.height,
          color: item.fill ? colour(item.fill) : undefined,
          borderColor: item.strokeWidth ? black : undefined,
          borderWidth: item.strokeWidth ?? 0,
        });
      } else {
        const unsupported = letters(item.text).filter(
          (c) => !getFont(sheet.font).hasGlyphForCodePoint(c.codePointAt(0)!),
        );
        if (unsupported.length)
          throw new Error(
            `The selected font does not contain: ${[...new Set(unsupported)].join(" ")}. Choose another font or supported letters.`,
          );
        const w = font.widthOfTextAtSize(item.text, item.size);
        page.drawText(item.text, {
          x:
            item.align === "center"
              ? item.x - w / 2
              : item.align === "right"
                ? item.x - w
                : item.x,
          y: sheet.height - item.y - item.size * 0.85,
          size: item.size,
          font,
          color: black,
        });
      }
    }
  }
  return doc.save({ useObjectStreams: false });
}
