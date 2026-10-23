// build-info.mjs -- the release boundary for development builds and incomplete provenance
// (Cloudflare migration plan C7; Codex C4 I2).
// tools/build-site.mjs writes build-info.json NEXT TO public/ (never inside it). save-artifact and
// verify-artifact accept only a complete, pinned build record:
//   - sourceCommit: a full commit SHA; development: false;
//   - externals: one complete record per mount (id, repository, subfolder, revision, destination,
//     source "pinned", files, bytes), ids and destinations unique;
//   - externalCount and externalsDigest (sha256 of the canonical externals list), written by the build,
//     so a truncated or edited list is detected;
//   - with opts.root (a clone of this repository): the records equal the active rows of
//     content/external-repos.tsv at the release's own source commit (not today's pins);
//   - with opts.siteDir: each mount's destination exists and holds exactly `files` files.
// A release is checked against ITS OWN record, never against today's pins (that would break rollback).

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { readExternalRepos } = require("./external-repos-tsv.js");

const SHA = /^[0-9a-f]{40}$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SEGS = (v, allowEmpty) => typeof v === "string" && ((allowEmpty && v === "") || (v.length > 0 && v.split("/").every((s) => /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(s))));
const FIELDS = ["id", "repository", "subfolder", "revision", "destination", "source", "files", "bytes"];

// The digest covers exactly these fields, in this order, so it is stable across tool versions.
export function externalsDigest(externals) {
  const canonical = externals.map((m) => FIELDS.map((f) => m[f]));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function countFiles(dir) {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? countFiles(join(dir, e.name)) : 1;
  return n;
}

export function checkBuildInfo(info, where, opts = {}) {
  const bad = (msg) => { throw new Error(`${where}: ${msg}`); };
  if (!info || typeof info !== "object" || Array.isArray(info)) bad("missing or unreadable build information");
  if (info.development !== false) {
    bad("this is a DEVELOPMENT build (--external-local: an external project came from a local folder, not its pinned revision), or the record does not say otherwise. It must never be released or deployed. Run `npm run build` without --external-local.");
  }
  if (!SHA.test(info.sourceCommit || "")) bad(`sourceCommit must be a full commit SHA (got ${JSON.stringify(info.sourceCommit)}): the release's source is unknown`);
  const ext = info.externals;
  if (!Array.isArray(ext) || ext.length === 0) bad("externals is missing or empty: the external projects' provenance is unknown");
  if (info.externalCount !== ext.length) bad(`externalCount (${info.externalCount}) does not match the ${ext.length} external record(s): the list is truncated or edited`);
  const ids = new Set(), dests = new Set();
  ext.forEach((m, i) => {
    const w = `externals[${i}]`;
    if (!m || typeof m !== "object") bad(`${w} is not a record`);
    if (!ID.test(m.id || "")) bad(`${w}.id is missing or invalid`);
    if (!REPO.test(m.repository || "")) bad(`${w} (${m.id}).repository is missing or invalid`);
    if (!SEGS(m.subfolder, true)) bad(`${w} (${m.id}).subfolder is missing or invalid`);
    if (!SHA.test(m.revision || "")) bad(`${w} (${m.id}).revision must be a full commit SHA`);
    if (!SEGS(m.destination, false)) bad(`${w} (${m.id}).destination is missing or invalid`);
    if (m.source !== "pinned") bad(`${w} (${m.id}) does not come from a pinned revision (source ${JSON.stringify(m.source)})`);
    if (!Number.isInteger(m.files) || m.files < 1) bad(`${w} (${m.id}).files must be a positive whole number`);
    if (!Number.isInteger(m.bytes) || m.bytes < 0) bad(`${w} (${m.id}).bytes must be a whole number`);
    if (ids.has(m.id)) bad(`duplicate external id ${m.id}`);
    if (dests.has(m.destination.toLowerCase())) bad(`duplicate external destination ${m.destination}`);
    ids.add(m.id); dests.add(m.destination.toLowerCase());
  });
  if (info.externalsDigest !== externalsDigest(ext)) bad("externalsDigest does not match the external records: the list was edited after the build");
  // The expected set is the release's OWN: the active rows of content/external-repos.tsv at its source commit
  // (read from this repository's history), so a self-consistent but truncated or rewritten record still fails.
  if (opts.root) {
    let tsv;
    try {
      tsv = execFileSync("git", ["show", `${info.sourceCommit}:content/external-repos.tsv`], { cwd: opts.root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      bad(`cannot read content/external-repos.tsv at the release's source commit ${info.sourceCommit} in this repository. Run this from a complete clone that contains that commit (git fetch).`);
    }
    const expected = readExternalRepos(tsv, `external-repos.tsv@${info.sourceCommit.slice(0, 7)}`).filter((r) => r.status.trim().toLowerCase() === "true");
    if (expected.length !== ext.length) bad(`the source commit has ${expected.length} active external mount(s), the record has ${ext.length}`);
    for (const r of expected) {
      const m = ext.find((x) => x.id === r.id);
      if (!m) bad(`external ${r.id} (active at the source commit) is missing from the record`);
      for (const [f, v] of [["repository", r.repository.trim()], ["revision", r.revision.trim()], ["subfolder", r.subfolder.trim()], ["destination", r.destination.trim()]]) {
        if (m[f] !== v) bad(`external ${r.id}: ${f} ${JSON.stringify(m[f])} differs from the source commit's ${JSON.stringify(v)}`);
      }
    }
  }
  const siteDir = opts.siteDir;
  if (siteDir) {
    for (const m of ext) {
      const d = join(siteDir, ...m.destination.split("/"));
      if (!existsSync(d)) bad(`external ${m.id}: /${m.destination}/ is not in the site`);
      const n = countFiles(d);
      if (n !== m.files) bad(`external ${m.id}: the site has ${n} file(s) under /${m.destination}/, the record says ${m.files}`);
    }
  }
}
