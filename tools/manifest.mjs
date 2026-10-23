// manifest.mjs -- shared helpers for hashing a static artifact (ported from DotMandalaGenerator via Bookshelf and FFFX).
// Plain Node (fs + crypto); no Cloudflare or third-party dependency.
// Manifests use the `sha256sum` text format ("<hash>  <path>"), sorted by path,
// so they can also be checked with standard tools: `cd public && sha256sum -c ../public-manifest.sha256`.

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out;
}

// Returns [{ path, sha256 }] for every file under dir, sorted by path (forward slashes).
export async function hashDir(dir) {
  const rows = [];
  for (const file of await listFiles(dir)) {
    const bytes = await readFile(file);
    rows.push({
      path: relative(dir, file).split(sep).join("/"),
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  return rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export function formatManifest(rows) {
  return rows.map((r) => `${r.sha256}  ${r.path}`).join("\n") + "\n";
}

export function parseManifest(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const m = line.match(/^([0-9a-f]{64}) [ *](.+)$/);
      if (!m) throw new Error(`Malformed manifest line: ${line}`);
      return { sha256: m[1], path: m[2] };
    });
}

// Compares two manifests; returns a list of human-readable differences (empty = identical).
export function diffManifests(expected, actual) {
  const problems = [];
  const exp = new Map(expected.map((r) => [r.path, r.sha256]));
  const act = new Map(actual.map((r) => [r.path, r.sha256]));
  for (const [path, hash] of exp) {
    if (!act.has(path)) problems.push(`missing: ${path}`);
    else if (act.get(path) !== hash) problems.push(`hash mismatch: ${path}`);
  }
  for (const path of act.keys()) {
    if (!exp.has(path)) problems.push(`unexpected file: ${path}`);
  }
  return problems;
}
