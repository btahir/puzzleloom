import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  TYPES,
  optionsSchema,
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
        ...result({ error: e instanceof Error ? e.message : String(e) }),
        isError: true,
      };
    }
  };
server.tool(
  "create_puzzle",
  "Create a deterministic puzzle and optionally write a project file.",
  {
    type: z.enum(TYPES),
    words: z.string().max(30000).optional(),
    quote: z.string().max(600).optional(),
    seed: z.number().int().min(0).max(4294967295).optional(),
    title: z.string().max(100).optional(),
    options: optionsSchema.partial().optional(),
    out: z.string().optional(),
  },
  guard(async (args) => create(args, args.out)),
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
    defaults: optionsSchema.parse({}),
    maxWords: 40,
    maxVariants: 40,
    schema: "puzzleloom.puzzle/v1",
    privacy: "All tools run locally. No network or credentials needed.",
  })),
);
await server.connect(new StdioServerTransport());
