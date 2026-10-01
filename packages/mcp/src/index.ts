import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { resolve } from "node:path";
import { z } from "zod";
import {
  TYPES,
  optionsSchema,
  optionsInputSchema,
  explainIssues,
  readPuzzle,
  validate,
} from "../../core/src/index";
import {
  create,
  readProject,
  renderPDF,
  renderImage,
  makeLink,
  makeBook,
} from "../../cli/src/operations";
const server = new McpServer({ name: "puzzleloom", version: "1.0.0" });
const result = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
});
const guard =
  <T>(fn: (args: T) => Promise<unknown>) =>
  async (args: T) => {
    try {
      return result(await fn(args));
    } catch (e) {
      return {
        ...result({
          error:
            e instanceof z.ZodError
              ? explainIssues(e).join(" ")
              : e instanceof Error
                ? e.message
                : String(e),
        }),
        isError: true,
      };
    }
  };
server.tool(
  "create_puzzle",
  "Create a deterministic puzzle and optionally write a project file. Returns { puzzle, warnings }; warnings lists words that were changed (for example H2O became HO) or skipped. Leave options.size out and the engine picks the grid size; the size used is recorded in puzzle.options.size. Title is limited to 100 characters, clues to 200 and a quote to 600.",
  {
    type: z.enum(TYPES),
    words: z.string().optional(),
    quote: z.string().optional(),
    seed: z.number().int().min(0).max(4294967295).optional(),
    title: z.string().optional(),
    options: optionsInputSchema.partial().optional(),
    out: z.string().optional(),
  },
  guard(async (args) => ({
    ...(await create(args, args.out)),
    ...(args.out ? { path: resolve(args.out) } : {}),
  })),
);
server.tool(
  "validate_puzzle",
  "Validate a project file or inline puzzle.",
  { path: z.string().optional(), puzzle: z.unknown().optional() },
  guard(async (args) =>
    validate(args.path ? await readProject(args.path) : args.puzzle),
  ),
);
server.tool(
  "render_pdf",
  "Render a project as a PDF, with optional class-set variants.",
  {
    path: z.string(),
    out: z.string(),
    variants: z.number().int().min(1).max(40).default(1),
    key: z.enum(["appended", "separate", "none"]).default("appended"),
  },
  guard(async (args) =>
    renderPDF(await readProject(args.path), args.out, args.variants, args.key),
  ),
);
server.tool(
  "render_image",
  "Render a project as SVG or PNG. Multi-page projects write numbered files.",
  {
    path: z.string(),
    out: z.string(),
    format: z.enum(["svg", "png"]),
    answer: z.boolean().default(false),
  },
  guard(async (args) =>
    renderImage(
      await readProject(args.path),
      args.out,
      args.format,
      args.answer,
    ),
  ),
);
server.tool(
  "make_play_link",
  "Encode a project into a shareable fragment URL. Links contain answers.",
  { path: z.string().optional(), puzzle: z.unknown().optional() },
  guard(async (args) => ({
    url: makeLink(
      args.path ? await readProject(args.path) : readPuzzle(args.puzzle),
    ),
  })),
);
server.tool(
  "make_book",
  "Combine project files from a book spec into a PDF. Keys go at the back.",
  { spec: z.string(), out: z.string() },
  guard(async (args) => makeBook(args.spec, args.out)),
);
server.tool(
  "list_options",
  "List puzzle types, options, limits, and format version.",
  {},
  guard(async () => ({
    types: TYPES,
    defaults: { ...optionsSchema.parse({}), size: "auto", autoSize: true },
    sizeRange: [8, 30],
    maxWords: 40,
    maxVariants: 40,
    schema: "puzzleloom.puzzle/v1",
    privacy: "All tools run locally. No network or credentials needed.",
  })),
);
await server.connect(new StdioServerTransport());
