import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import {
  readPuzzle,
  generate,
  encode,
  variants,
  type Puzzle,
  type Input,
} from "../../core/src/index";
import {
  toPDF,
  layoutPuzzle,
  toSVG,
  type KeyMode,
} from "../../render/src/index";
import { SITE_URL } from "../../../apps/web/src/config/site";
export async function readJSON(path: string) {
  if ((await stat(path)).size > 300000)
    throw new Error("Input file must be smaller than 300 KB.");
  return JSON.parse(await readFile(path, "utf8"));
}
export const readProject = async (path: string) =>
  readPuzzle(await readJSON(path));
export function makeLink(p: Puzzle) {
  return `${SITE_URL}/play/#${encode(p)}`;
}
export async function create(input: Input, out?: string) {
  const puzzle = generate(input);
  if (out) await writeFile(out, JSON.stringify(puzzle, null, 2) + "\n");
  return puzzle;
}
export async function renderPDF(
  p: Puzzle,
  out: string,
  count = 1,
  key: "appended" | "separate" | "none" = "appended",
) {
  const puzzles = variants(p, count);
  await writeFile(out, await toPDF(puzzles, key === "separate" ? "none" : key));
  const result = {
    path: resolve(out),
    variants: count,
    keyPath: undefined as string | undefined,
  };
  if (key === "separate") {
    const keyPath = out.replace(/\.pdf$/i, "") + "-answers.pdf";
    await writeFile(keyPath, await toPDF(puzzles, "only"));
    result.keyPath = resolve(keyPath);
  }
  return result;
}
export async function renderImage(
  p: Puzzle,
  out: string,
  format: "svg" | "png",
  answer = false,
) {
  const sheets = layoutPuzzle(p, answer),
    paths: string[] = [];
  for (let i = 0; i < sheets.length; i++) {
    const path =
      sheets.length === 1
        ? out
        : out.replace(/\.(svg|png)$/i, "") + `-${i + 1}.${format}`;
    const svg = toSVG(sheets[i], true);
    const data =
      format === "svg"
        ? svg
        : new Resvg(svg, {
            font: {
              fontFiles: [
                resolve(
                  import.meta.dirname,
                  "../../../assets/fonts",
                  p.options.font === "atkinson"
                    ? "AtkinsonHyperlegibleNext-Regular.ttf"
                    : "OpenDyslexic-Regular.otf",
                ),
              ],
              loadSystemFonts: false,
            },
            fitTo: { mode: "zoom", value: 2 },
          })
            .render()
            .asPng();
    await writeFile(path, data);
    paths.push(resolve(path));
  }
  return { paths };
}
export async function makeBook(specPath: string, out: string) {
  const spec = (await readJSON(specPath)) as {
    files: string[];
    title?: string;
    key?: KeyMode;
  };
  if (
    !Array.isArray(spec.files) ||
    spec.files.length < 1 ||
    spec.files.length > 100 ||
    !spec.files.every((f) => typeof f === "string")
  )
    throw new Error("Book spec needs 1–100 project paths in files.");
  if (spec.key && !["appended", "none", "only"].includes(spec.key))
    throw new Error("Book key must be appended, none, or only.");
  const puzzles = await Promise.all(
    spec.files.map((f) => readProject(resolve(dirname(specPath), f))),
  );
  await writeFile(
    out,
    await toPDF(puzzles, spec.key ?? "appended", spec.title),
  );
  return { path: resolve(out), puzzles: puzzles.length };
}
