// update-externals.mjs -- move the external mounts to their repositories' current versions, for review.
//
//   node tools/update-externals.mjs            (or: npm run update-externals)
//   node tools/update-externals.mjs --check    report only; change nothing
//   node tools/update-externals.mjs --only <id>[,<id>...]
//
// For each active row of content/external-repos.tsv: asks GitHub for the repository's current
// default-branch commit (anonymously; all mounts are public repositories). If it differs from the
// row's `revision`, it fetches that commit (no file contents) and prints a REVIEW REPORT for the
// mount, comparing the new tree with the pinned one:
//   NEW       files that appeared (allowlist CANDIDATES -- nothing is added automatically)
//   MISSING   listed files that no longer exist (the build would fail: fix the list or the repository)
//   CHANGED   listed files whose content changed (published as soon as the new pin is committed)
//   REMOVED   unlisted files that disappeared (no effect)
// Then (unless --check) it writes the new revisions into content/external-repos.tsv.
//
// It NEVER edits an allowlist (owner decision D3; plan C3): approving candidates is a separate,
// explicit edit of content/external-allowlists/<id>.txt. Then build, check, commit and push --
// nothing on the site changes until the new pins are pushed.

import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { readAllowlist } from "./allowlist.mjs";
import { ROOT, activeRows, ensureCommit, openCache, readTree } from "./external-mounts.mjs";

const require = createRequire(import.meta.url);
const { readExternalRepos, writeExternalRepos } = require("./external-repos-tsv.js");
const TSV = join(ROOT, "content", "external-repos.tsv");

function remoteHead(repository) {
  const r = spawnSync("git", ["-c", "credential.helper=", "ls-remote", `https://github.com/${repository}.git`, "HEAD"], {
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" }, encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(`${repository}: cannot read its current version (${String(r.stderr).trim().split("\n").pop()}). Is it still public?`);
  const sha = r.stdout.split(/\s/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`${repository}: unexpected answer from GitHub`);
  return sha;
}

function subtree(tree, subfolder) {
  const prefix = subfolder ? subfolder.replace(/\/+$/, "") + "/" : "";
  const m = new Map();
  for (const e of tree) if (e.path.startsWith(prefix)) m.set(e.path.slice(prefix.length), e.oid);
  return m;
}

async function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes("--check");
  const oi = argv.indexOf("--only");
  const only = oi >= 0 ? new Set((argv[oi + 1] || "").split(",").filter(Boolean)) : null;
  const rows = (await activeRows()).filter((r) => !only || only.has(r.id));
  if (only && rows.length !== only.size) throw new Error(`--only: unknown or inactive id(s) among ${[...only].join(", ")}`);

  const heads = new Map();
  for (const r of rows) if (!heads.has(r.repository)) heads.set(r.repository, remoteHead(r.repository));

  const updates = new Map();
  let attention = 0;
  for (const row of rows) {
    const head = heads.get(row.repository);
    if (head === row.revision) { console.log(`${row.id}: up to date (${row.revision.slice(0, 8)})`); continue; }
    const dir = await openCache(row.repository, false);
    ensureCommit(dir, row.repository, row.revision, false);
    ensureCommit(dir, row.repository, head, false);
    const before = subtree(readTree(dir, row.revision), row.subfolder.trim());
    const after = subtree(readTree(dir, head), row.subfolder.trim());
    const listed = new Set(await readAllowlist(join(ROOT, "content", "external-allowlists", `${row.id}.txt`), `content/external-allowlists/${row.id}.txt`));
    const added = [...after.keys()].filter((p) => !before.has(p)).sort();
    const missing = [...listed].filter((p) => !after.has(p)).sort();
    const changed = [...listed].filter((p) => after.has(p) && before.has(p) && after.get(p) !== before.get(p)).sort();
    const removed = [...before.keys()].filter((p) => !after.has(p) && !listed.has(p)).sort();
    console.log(`\n${row.id}: ${row.revision.slice(0, 8)} -> ${head.slice(0, 8)} (${row.repository})`);
    for (const [title, list] of [["NEW (allowlist candidates; not added)", added], ["MISSING listed files (build would fail)", missing], ["CHANGED listed files (published with the new pin)", changed], ["REMOVED unlisted files", removed]]) {
      if (list.length) console.log(`  ${title}: ${list.length}\n    ${list.join("\n    ")}`);
    }
    if (!added.length && !missing.length && !changed.length && !removed.length) console.log("  no file changes in this mount's folder");
    if (missing.length || added.length) attention++;
    updates.set(row.id, head);
  }

  if (!updates.size) { console.log("\nAll pins are current."); return; }
  if (check) { console.log(`\n--check: nothing written. ${updates.size} pin(s) would change.`); return; }
  const all = readExternalRepos(await readFile(TSV, "utf8"), "content/external-repos.tsv");
  for (const r of all) if (updates.has(r.id)) r.revision = updates.get(r.id);
  await writeFile(TSV, writeExternalRepos(all));
  console.log(`\nUpdated ${updates.size} pin(s) in content/external-repos.tsv. Allowlists unchanged.`);
  console.log(`Next: ${attention ? "review the NEW and MISSING files above and edit the allowlists; then " : ""}npm run build, check the result, commit and push.`);
}

main().catch((err) => {
  console.error(`update-externals: ${err.message}`);
  process.exit(1);
});
