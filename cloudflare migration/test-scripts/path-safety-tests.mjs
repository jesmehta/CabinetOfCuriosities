// path-safety-tests.mjs -- Codex C4 I1: manifest IDs, destinations and subfolders must be safe, portable names.
//   node "cloudflare migration/test-scripts/path-safety-tests.mjs"   (from the repository root; no network, writes nothing)
// Each case changes one cell of one row of the committed content/external-repos.tsv in memory and expects the
// validator (tools/external-repos-tsv.js) to reject it. Control: the committed TSV is valid. Exits 1 on any failure.
// The assembler's own containment check and "nothing written outside" are tested by reject-tests.sh.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const m = require("../../tools/external-repos-tsv.js");
const rows = m.readExternalRepos(readFileSync("content/external-repos.tsv", "utf8"), "content/external-repos.tsv");
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log("PASS  " + msg); } else { fail++; console.log("FAIL  " + msg); } };
ok(m.findExternalRepoProblems(rows).length === 0, "control: committed external-repos.tsv is valid");
const cases = [
  ["destination", "../review-outside-public", "parent traversal"],
  ["destination", "teaching/../swatch-fields", "inner traversal"],
  ["destination", "./teaching/x", "dot segment"],
  ["destination", "/teaching/x", "leading slash (absolute)"],
  ["destination", "teaching/x/", "trailing slash"],
  ["destination", "teaching//x", "empty segment"],
  ["destination", "C:/x", "drive letter"],
  ["destination", "teaching\\x", "backslash"],
  ["destination", "teaching/%2e%2e/x", "percent-encoding"],
  ["destination", "teaching/my project", "space"],
  ["destination", ".hidden/x", "segment starting with a dot"],
  ["destination", "Swatch-Fields", "case-folded duplicate of swatch-fields"],
  ["id", "../archive-allowlist", "id with traversal (would name a file outside external-allowlists/)"],
  ["id", "Tracery-Bots", "id not a lowercase slug"],
  ["id", "tracery bots", "id with a space"],
  ["subfolder", "../ssd-creative-coding-2025-26", "subfolder traversal"],
  ["subfolder", "/abs", "subfolder absolute"],
];
for (const [field, value, label] of cases) {
  const copy = rows.map((r) => ({ ...r }));
  copy[1] = { ...copy[1], [field]: value };
  const problems = m.findExternalRepoProblems(copy);
  ok(problems.some((p) => p.field === field), `rejected: ${field} = ${JSON.stringify(value)} (${label})${problems[0] ? " -- " + problems[0].message.slice(0, 80) : ""}`);
}
console.log(`== ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
