#!/usr/bin/env node
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  TYPES,
  validate,
  explainIssues,
  PuzzleError,
  type PuzzleType,
  type Options,
} from "../../core/src/index";
import { ZodError } from "zod";
import {
  create,
  readJSON,
  readText,
  readProject,
  renderPDF,
  renderImage,
  makeLink,
  makeBook,
} from "./operations";
function parseSize(text: string) {
  const size = Number(text);
  if (!/^\d+$/.test(text) || size < 8 || size > 30)
    throw new Error("size must be a whole number from 8 to 30, or auto.");
  return size;
}
export async function main(argv = process.argv.slice(2)) {
  let json = argv.includes("--json");
  try {
    const { positionals, values: v } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        json: { type: "boolean" },
        words: { type: "string" },
        quote: { type: "string" },
        seed: { type: "string" },
        out: { type: "string" },
        pdf: { type: "string" },
        key: { type: "string" },
        paper: { type: "string" },
        variants: { type: "string" },
        svg: { type: "boolean" },
        png: { type: "boolean" },
        title: { type: "string" },
        size: { type: "string" },
        difficulty: { type: "string" },
        font: { type: "string" },
        "font-size": { type: "string" },
        language: { type: "string" },
        help: { type: "boolean" },
      },
    });
    json = !!v.json;
    const [command, arg] = positionals;
    let result: unknown;
    if (v.help || !command) {
      result = {
        commands: [
          "make <type> --words words.txt [--quote text] [--seed N] [--size auto|8..30] [--out puzzle.json] [--pdf out.pdf]",
          "render <project.json> --pdf out.pdf [--variants 1..40] [--key appended|separate|none]",
          "render <project.json> --svg|--png --out image.svg",
          "check <project.json>",
          "link <project.json>",
          "book <spec.json> --pdf book.pdf",
          "mcp",
        ],
        options:
          "--json --title --paper letter|a4 --size auto|8..30 (default auto) --difficulty easy|medium|hard --font atkinson|opendyslexic --font-size S|M|L|XL --language en|es|fr|de|pt|it|nl",
        exitCodes: { success: 0, failure: 1, usage: 2 },
      };
    } else if (command === "mcp") {
      await import("../../mcp/src/index");
      return;
    } else {
      const key = v.key ?? "appended";
      if (!["appended", "separate", "none"].includes(key))
        throw new Error("key must be appended, separate, or none");
      const count = v.variants === undefined ? 1 : Number(v.variants);
      if (!Number.isInteger(count) || count < 1 || count > 40)
        throw new Error("variants must be an integer from 1 to 40");
      if (
        v.seed !== undefined &&
        (!/^\d+$/.test(v.seed) || Number(v.seed) > 4294967295)
      )
        throw new Error("seed must be an integer from 0 to 4294967295");
      const options: Partial<Options> = {
        ...(v.paper ? { paper: v.paper as Options["paper"] } : {}),
        ...(v.size && v.size !== "auto" ? { size: parseSize(v.size) } : {}),
        ...(v.size === "auto" ? { autoSize: true } : {}),
        ...(v.difficulty
          ? { difficulty: v.difficulty as Options["difficulty"] }
          : {}),
        ...(v.font ? { font: v.font as Options["font"] } : {}),
        ...(v["font-size"]
          ? { fontSize: v["font-size"] as Options["fontSize"] }
          : {}),
        ...(v.language ? { language: v.language as Options["language"] } : {}),
      };
      if (command === "make") {
        if (!TYPES.includes(arg as PuzzleType))
          throw new Error("Choose a puzzle type: " + TYPES.join(", "));
        const text = v.words ? await readText(v.words, "word list") : undefined;
        const { puzzle, warnings } = await create(
          {
            type: arg as PuzzleType,
            words: text,
            quote: v.quote ?? (arg === "cryptogram" ? text : undefined),
            seed: v.seed === undefined ? 1 : Number(v.seed),
            title: v.title,
            options,
          },
          v.out,
        );
        const output = v.pdf
          ? await renderPDF(
              puzzle,
              v.pdf,
              count,
              key as "appended" | "separate" | "none",
            )
          : undefined;
        result = {
          puzzle,
          warnings,
          ...(v.out ? { path: resolve(v.out) } : {}),
          ...(output ? { pdf: output } : {}),
        };
        if (!json)
          for (const w of warnings) console.error(`warning: ${w.message}`);
      } else if (command === "check") {
        if (!arg) throw new Error("Specify a project path");
        const report = validate(await readJSON(arg));
        if (!report.valid)
          throw Object.assign(new Error(report.errors.join(" ")), {
            errors: report.errors,
          });
        result = report;
      } else if (command === "link") {
        if (!arg) throw new Error("Specify a project path");
        result = { url: makeLink(await readProject(arg)) };
      } else if (command === "render") {
        if (!arg) throw new Error("Specify a project path");
        const puzzle = await readProject(arg);
        // The layout is already fixed, so a size override has no meaning here.
        const { size: _size, autoSize: _auto, ...overrides } = options;
        void _size;
        void _auto;
        puzzle.options = { ...puzzle.options, ...overrides };
        if (v.pdf)
          result = await renderPDF(
            puzzle,
            v.pdf,
            count,
            key as "appended" | "separate" | "none",
          );
        else if (v.svg || v.png) {
          if (!v.out) throw new Error("Image export requires --out");
          result = await renderImage(puzzle, v.out, v.png ? "png" : "svg");
        } else throw new Error("Choose --pdf, --svg or --png");
      } else if (command === "book") {
        if (!arg || !v.pdf) throw new Error("book needs a spec path and --pdf");
        result = await makeBook(arg, v.pdf);
      } else {
        process.exitCode = 2;
        throw new Error("Unknown command: " + command);
      }
    }
    console.log(
      json
        ? JSON.stringify({ ok: true, result })
        : typeof result === "string"
          ? result
          : JSON.stringify(result, null, 2),
    );
  } catch (e) {
    process.exitCode = process.exitCode || 1;
    const message =
      e instanceof ZodError
        ? explainIssues(e).join(" ")
        : e instanceof Error
          ? e.message
          : String(e);
    const words =
      e instanceof PuzzleError && e.words.length ? e.words : undefined;
    const errors = (e as { errors?: string[] }).errors;
    if (json)
      console.log(
        JSON.stringify({
          ok: false,
          error: message,
          ...(errors ? { errors } : {}),
          ...(words ? { words } : {}),
        }),
      );
    else console.error(message);
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  await main();
