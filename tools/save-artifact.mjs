// save-artifact.mjs — keep a copy of the current public/ as a known-good artifact.
//
//   node tools/save-artifact.mjs       (or: npm run save-artifact)
//
// Run after `npm run build` (and after checking the result). Creates
//   releases/<UTC timestamp>_<short commit>/
//     site/           exact copy of public/ (deployable to any static host)
//     SHA256SUMS      checksums of site/ (sha256sum format)
//     BUILD-INFO.json the build's provenance (build-info.json): source commit, every external
//                     mount's repository and pinned revision, tool versions
//     SOURCE.txt      source commit, whether the working tree had local changes, date, Node version
// releases/ is git-ignored and never published. Copy important releases somewhere
// safe (e.g. a backup drive or cloud folder) — they are your offline rollback.
//
// Refuses a DEVELOPMENT build (one made with --external-local, i.e. with an external project
// taken from a local folder instead of its pinned revision; Cloudflare migration plan C7):
// such a build must never become a release. Also refuses a build without build-info.json.
// Ported from FFFX (form-follows-fx/tools/save-artifact.mjs).

import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkBuildInfo } from "./build-info.mjs";
import { diffManifests, formatManifest, hashDir, parseManifest } from "./manifest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = join(ROOT, "public");
const MANIFEST = join(ROOT, "public-manifest.sha256");
const BUILD_INFO = join(ROOT, "build-info.json");

function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

async function main() {
  let expected;
  try {
    expected = parseManifest(await readFile(MANIFEST, "utf8"));
  } catch {
    throw new Error("No public-manifest.sha256 found. Run `npm run build` first.");
  }
  let info;
  try {
    info = JSON.parse(await readFile(BUILD_INFO, "utf8"));
  } catch {
    throw new Error("No readable build-info.json found next to public/. Run `npm run build` first.");
  }
  checkBuildInfo(info, "build-info.json");
  const actual = await hashDir(PUBLIC_DIR);
  const problems = diffManifests(expected, actual);
  if (problems.length) {
    throw new Error(`public/ no longer matches its manifest:\n  ${problems.join("\n  ")}\nRe-run \`npm run build\`.`);
  }
  if (info.files !== actual.length) throw new Error(`build-info.json describes ${info.files} files, public/ has ${actual.length}. Re-run \`npm run build\`.`);

  const commit = git(["rev-parse", "HEAD"]) ?? "unknown";
  if (info.sourceCommit !== commit) throw new Error(`public/ was built from ${info.sourceCommit}, but HEAD is now ${commit}. Re-run \`npm run build\`.`);
  const dirty = git(["status", "--porcelain"]);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const name = `${stamp}_${commit.slice(0, 7)}${dirty ? "-dirty" : ""}`;
  const dest = join(ROOT, "releases", name);

  await mkdir(join(ROOT, "releases"), { recursive: true });
  try {
    await mkdir(dest); // never write into an existing release
  } catch (err) {
    if (err.code === "EEXIST") throw new Error(`releases/${name} already exists; wait a second and run again.`);
    throw err;
  }
  await cp(PUBLIC_DIR, join(dest, "site"), { recursive: true });
  await writeFile(join(dest, "SHA256SUMS"), formatManifest(actual));
  await writeFile(join(dest, "BUILD-INFO.json"), JSON.stringify(info, null, 2) + "\n");
  await writeFile(
    join(dest, "SOURCE.txt"),
    [
      `source_commit: ${commit}`,
      `working_tree_had_changes: ${dirty === null ? "unknown" : dirty ? "yes" : "no"}`,
      `saved_utc: ${new Date().toISOString()}`,
      `node: ${process.version}`,
      "",
    ].join("\n")
  );

  process.stdout.write(`Saved artifact: releases/${name}\n`);
  if (dirty) process.stdout.write("Note: working tree had uncommitted changes; commit before saving a release you intend to keep.\n");
}

main().catch((err) => {
  console.error(`save-artifact: ${err.message}`);
  process.exit(1);
});
