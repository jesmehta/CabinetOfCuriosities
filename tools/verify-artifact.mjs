// verify-artifact.mjs — check a saved artifact before restoring it.
//
//   node tools/verify-artifact.mjs releases/<name>
//   (or: npm run verify-artifact -- releases/<name>)
//
// Exits non-zero if site/ has missing, changed or extra files compared to SHA256SUMS, if
// BUILD-INFO.json is missing, or if it marks a DEVELOPMENT build (--external-local; plan C7):
// such an artifact must never be restored. Ported from FFFX.
//
// Manual recovery deploy (DEPLOYMENT.md): run this first, then
//   npx wrangler deploy --assets releases/<name>/site
// A raw `wrangler deploy` of an unverified folder bypasses this check: never do that.

import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { diffManifests, hashDir, parseManifest } from "./manifest.mjs";
import { checkBuildInfo } from "./build-info.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error("Usage: node tools/verify-artifact.mjs releases/<name>");
  const dir = resolve(arg);

  let info;
  try {
    info = JSON.parse(await readFile(join(dir, "BUILD-INFO.json"), "utf8"));
  } catch {
    throw new Error("BUILD-INFO.json missing or unreadable: provenance unknown, do NOT restore this artifact");
  }
  checkBuildInfo(info, `${arg}/BUILD-INFO.json`, { root: ROOT, siteDir: join(dir, "site") });
  const expected = parseManifest(await readFile(join(dir, "SHA256SUMS"), "utf8"));
  const actual = await hashDir(join(dir, "site"));
  const problems = diffManifests(expected, actual);
  if (problems.length) throw new Error(`Artifact does NOT match SHA256SUMS:\n  ${problems.join("\n  ")}`);

  process.stdout.write(`OK: ${actual.length} files in ${arg}/site match SHA256SUMS; pinned build of ${info.sourceCommit}\n`);
  try {
    process.stdout.write(await readFile(join(dir, "SOURCE.txt"), "utf8"));
  } catch {}
}

main().catch((err) => {
  console.error(`verify-artifact: ${err.message}`);
  process.exit(1);
});
