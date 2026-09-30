import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const report = JSON.parse(
  execFileSync("pnpm", ["licenses", "list", "--json"], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  }),
) as Record<
  string,
  {
    name: string;
    versions?: string[];
    version?: string;
    license: string;
    path?: string;
  }[]
>;
const allowed = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "MPL-2.0",
  "OFL-1.1",
  "CC0-1.0",
]);
// OR licences let us choose an approved branch; AND requires every component.
const approved = (s: string): boolean =>
  s
    .replace(/[()]/g, "")
    .split(" OR ")
    .some((branch) =>
      branch.split(" AND ").every((part) => allowed.has(part.trim())),
    );

// Explicit owner approval in this build conversation; exceptions are package-specific.
const exceptions: Record<string, string> = {
  "caniuse-lite": "CC-BY-4.0",
  minimatch: "BlueOak-1.0.0",
  pako: "(MIT AND Zlib)",
};
const rows: string[] = [],
  bad: string[] = [];
for (const [licence, packages] of Object.entries(report)) {
  for (const p of packages) {
    rows.push(
      `| ${p.name} | ${(p.versions ?? [p.version ?? ""]).join(", ")} | ${licence} |`,
    );
    if (!approved(licence) && exceptions[p.name] !== licence)
      bad.push(`${p.name}: ${licence}`);
  }
}
writeFileSync(
  "docs/build/DEPENDENCIES.md",
  "# Installed dependency licences\n\nGenerated from the installed lockfile by `pnpm licences`. Includes development tools. Font source licences are retained in assets/fonts.\n\n| Package | Version | Licence |\n|---|---|---|\n" +
    rows.sort().join("\n") +
    "\n",
);
if (bad.length) {
  console.error("Unapproved licences:\n" + bad.join("\n"));
  process.exitCode = 1;
} else console.log(`Approved licences for ${rows.length} installed packages.`);
