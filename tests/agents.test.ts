import { it, expect } from "vitest";
import { execFileSync } from "node:child_process";
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
