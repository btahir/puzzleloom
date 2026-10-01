import { it, expect, describe } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const cli = (...args: string[]) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ["--import", "tsx", "packages/cli/src/index.ts", ...args, "--json"],
      { encoding: "utf8" },
    ),
  );
const bin = (...args: string[]) => {
  const r = spawnSync(
    process.execPath,
    ["packages/cli/bin.mjs", ...args, "--json"],
    { encoding: "utf8" },
  );
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
};
/** stdout must be exactly one JSON document (plus the trailing newline). */
const onlyJSON = (stdout: string) => {
  const value = JSON.parse(stdout);
  expect(stdout.trim().split("\n")).toHaveLength(1);
  return value;
};
it("CLI creates, checks, renders, links, exports images and combines a book", async () => {
  const dir = await mkdtemp(join(tmpdir(), "puzzleloom-cli-"));
  try {
    const path = join(dir, "puzzle.json"),
      pdf = join(dir, "puzzle.pdf"),
      svg = join(dir, "puzzle.svg"),
      png = join(dir, "puzzle.png"),
      book = join(dir, "book.json");
    const created = cli(
      "make",
      "crossword",
      "--seed",
      "42",
      "--out",
      path,
      "--pdf",
      pdf,
    );
    expect(created.ok).toBe(true);
    expect(created.result.puzzle.id).toBe("PL-0016");
    expect(cli("check", path).result.valid).toBe(true);
    expect(cli("link", path).result.url).toContain("/play/#");
    expect(
      cli("render", path, "--pdf", pdf, "--variants", "3", "--key", "separate")
        .result.variants,
    ).toBe(3);
    expect(
      (await readFile(join(dir, "puzzle-answers.pdf")))
        .subarray(0, 4)
        .toString(),
    ).toBe("%PDF");
    cli("render", path, "--svg", "--out", svg);
    expect(await readFile(svg, "utf8")).toContain("<svg");
    cli("render", path, "--png", "--out", png);
    expect((await readFile(png)).subarray(1, 4).toString()).toBe("PNG");
    await writeFile(
      book,
      JSON.stringify({ files: ["puzzle.json", "puzzle.json"] }),
    );
    expect(
      cli("book", book, "--pdf", join(dir, "book.pdf")).result.puzzles,
    ).toBe(2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);
it("CLI returns nonzero and structured errors for invalid input", () => {
  try {
    cli("make", "crossword", "--seed", "-2");
    throw new Error("should fail");
  } catch (e) {
    const failure = e as { status: number; stdout: string };
    expect(failure.status).toBe(1);
    expect(JSON.parse(failure.stdout).ok).toBe(false);
  }
});
it("MCP discovers and executes all seven tools over stdio", async () => {
  const dir = await mkdtemp(join(tmpdir(), "puzzleloom-mcp-"));
  const client = new Client({ name: "integration-test", version: "1" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", resolve("packages/mcp/src/index.ts")],
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const list = await client.listTools();
    expect(list.tools.map((t) => t.name).sort()).toEqual([
      "create_puzzle",
      "list_options",
      "make_book",
      "make_play_link",
      "render_image",
      "render_pdf",
      "validate_puzzle",
    ]);
    const path = join(dir, "puzzle.json");
    const create = await client.callTool({
      name: "create_puzzle",
      arguments: {
        type: "scramble",
        words: "GARDEN\nFLOWER",
        seed: 42,
        out: path,
      },
    });
    expect(create.isError).not.toBe(true);
    for (const [name, args] of [
      ["list_options", {}],
      ["validate_puzzle", { path }],
      ["make_play_link", { path }],
      ["render_pdf", { path, out: join(dir, "puzzle.pdf") }],
      ["render_image", { path, out: join(dir, "puzzle.svg"), format: "svg" }],
    ] as const) {
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError, name).not.toBe(true);
    }
    await writeFile(
      join(dir, "book.json"),
      JSON.stringify({ files: ["puzzle.json"] }),
    );
    expect(
      (
        await client.callTool({
          name: "make_book",
          arguments: {
            spec: join(dir, "book.json"),
            out: join(dir, "book.pdf"),
          },
        })
      ).isError,
    ).not.toBe(true);
    const invalid = await client.callTool({
      name: "create_puzzle",
      arguments: { type: "scramble", words: "AAA" },
    });
    expect(invalid.isError).toBe(true);
  } finally {
    await client.close();
    await rm(dir, { recursive: true, force: true });
  }
}, 30000);

describe("CLI robustness", () => {
  it("prints one clean JSON document with stable exit codes for every failure", () => {
    const failures: [string[], number][] = [
      [["make", "crossword", "--seed", "-2"], 1],
      [["make", "crossword", "--words", "/no/such/file.txt"], 1],
      [["make", "crossword", "--size", "99"], 1],
      [["make", "crossword", "--difficulty", "nightmare"], 1],
      [["check", "/no/such/project.json"], 1],
      [["make", "cube"], 1],
      [["frobnicate"], 2],
    ];
    for (const [args, status] of failures) {
      const r = bin(...args);
      expect(r.status, args.join(" ")).toBe(status);
      const out = onlyJSON(r.stdout);
      expect(out.ok).toBe(false);
      expect(typeof out.error).toBe("string");
      expect(out.error).not.toMatch(/ELIFECYCLE|ZodError|"code"/);
    }
    expect(onlyJSON(bin("--help").stdout).ok).toBe(true);
    expect(bin("--help").status).toBe(0);
  });
  it("explains over-long clues and titles in plain words", async () => {
    const dir = await mkdtemp(join(tmpdir(), "puzzleloom-clue-"));
    try {
      const words = join(dir, "words.txt");
      await writeFile(words, `VOLCANO: ${"x".repeat(240)}\n`);
      const clue = onlyJSON(bin("make", "crossword", "--words", words).stdout);
      expect(clue.error).toBe(
        "The clue for VOLCANO is 240 characters; the limit is 200.",
      );
      const title = onlyJSON(
        bin("make", "crossword", "--title", "t".repeat(120)).stdout,
      );
      expect(title.error).toBe(
        "The title is 120 characters; the limit is 100.",
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("reports warnings, a neutral default title and the size actually used", async () => {
    const dir = await mkdtemp(join(tmpdir(), "puzzleloom-warn-"));
    try {
      const words = join(dir, "words.txt");
      await writeFile(
        words,
        "H2O: Water\nGARDEN\nFLOWER\nWATER\nEARTH\ngarden\nRATIO: Compare 3:4 - like a fraction\n",
      );
      const r = onlyJSON(
        bin("make", "word-search", "--words", words, "--seed", "5").stdout,
      );
      expect(r.ok).toBe(true);
      expect(r.result.warnings.map((w: { code: string }) => w.code)).toEqual([
        "removed-characters",
        "duplicate-word",
      ]);
      expect(r.result.warnings[0].message).toContain("H2O");
      expect(r.result.puzzle.title).toBe("Word search");
      expect(r.result.puzzle.options.autoSize).toBe(true);
      expect(r.result.puzzle.grid).toHaveLength(r.result.puzzle.options.size);
      const ratio = r.result.puzzle.entries.find(
        (e: { word: string }) => e.word === "RATIO",
      );
      expect(ratio.clue).toBe("Compare 3:4 - like a fraction");
      const fixed = onlyJSON(
        bin("make", "word-search", "--words", words, "--size", "20").stdout,
      );
      expect(fixed.result.puzzle.options).toMatchObject({
        size: 20,
        autoSize: false,
      });
      const auto = onlyJSON(
        bin("make", "crossword", "--words", words, "--size", "auto").stdout,
      );
      expect(auto.result.puzzle.options.autoSize).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 30000);
  it("check flags a grid that spells a blocked word and exits 1", async () => {
    const dir = await mkdtemp(join(tmpdir(), "puzzleloom-check-"));
    try {
      const path = join(dir, "bad.json");
      const made = JSON.parse(bin("make", "word-search", "--seed", "5").stdout)
        .result.puzzle;
      const covered = new Set(
        made.placements.flatMap(
          (p: { word: string; x: number; y: number; dx: number; dy: number }) =>
            [...p.word].map((_, i) => `${p.x + p.dx * i},${p.y + p.dy * i}`),
        ),
      );
      // write SLUT into the first free horizontal run of four cells
      outer: for (let y = 0; y < made.grid.length; y++)
        for (let x = 0; x + 3 < made.grid[y].length; x++)
          if ([0, 1, 2, 3].every((i) => !covered.has(`${x + i},${y}`))) {
            [..."SLUT"].forEach((c, i) => (made.grid[y][x + i] = c));
            break outer;
          }
      await writeFile(path, JSON.stringify(made));
      const r = bin("check", path);
      expect(r.status).toBe(1);
      const out = onlyJSON(r.stdout);
      expect(out.ok).toBe(false);
      expect(out.errors.join(" ")).toMatch(/blocked word/);
      await writeFile(
        path,
        JSON.stringify(
          JSON.parse(bin("make", "word-search", "--seed", "5").stdout).result
            .puzzle,
        ),
      );
      expect(bin("check", path).status).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 30000);
  it("documented pnpm exec invocation keeps stdout clean on failure", () => {
    const r = spawnSync(
      "pnpm",
      ["exec", "tsx", "packages/cli/src/index.ts", "make", "cube", "--json"],
      { encoding: "utf8" },
    );
    expect(r.status).toBe(1);
    expect(onlyJSON(r.stdout).ok).toBe(false);
  }, 30000);
});
it("MCP returns plain errors and reports warnings and sizes", async () => {
  const client = new Client({ name: "integration-test", version: "1" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", resolve("packages/mcp/src/index.ts")],
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const text = (r: unknown) =>
      JSON.parse((r as { content: { text: string }[] }).content[0].text);
    const long = await client.callTool({
      name: "create_puzzle",
      arguments: { type: "scramble", words: "OCEAN", title: "t".repeat(101) },
    });
    expect(long.isError).toBe(true);
    expect(text(long).error).toBe(
      "The title is 101 characters; the limit is 100.",
    );
    const clue = await client.callTool({
      name: "create_puzzle",
      arguments: { type: "crossword", words: `VOLCANO: ${"x".repeat(240)}` },
    });
    expect(text(clue).error).toBe(
      "The clue for VOLCANO is 240 characters; the limit is 200.",
    );
    const badSize = await client.callTool({
      name: "create_puzzle",
      arguments: { type: "crossword", options: { size: 3 } },
    });
    expect(badSize.isError).toBe(true);
    const made = await client.callTool({
      name: "create_puzzle",
      arguments: {
        type: "word-search",
        words: "H2O\nGARDEN\nFLOWER\nWATER\nEARTH",
      },
    });
    expect(made.isError).not.toBe(true);
    const body = text(made);
    expect(body.warnings[0].code).toBe("removed-characters");
    expect(body.puzzle.title).toBe("Word search");
    expect(body.puzzle.options.autoSize).toBe(true);
    const options = text(
      await client.callTool({ name: "list_options", arguments: {} }),
    );
    expect(options.defaults.size).toBe("auto");
  } finally {
    await client.close();
  }
}, 30000);
