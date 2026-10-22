// Partial-clone experiment (plan v3, cache trust). Disposable; runs in the scratchpad.
// A: bare repo, shallow fetch of the pinned commit with all blobs.
// B: bare repo, shallow blob-less fetch, then one batched fetch of only the "listed" blobs.
// Checks: bytes and time; listed blobs readable offline (GIT_NO_LAZY_FETCH); a newly listed path at the same SHA
// can be fetched later; blob bytes identical between A and B.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const WORK = process.argv[2];
const REPO = "https://github.com/jesmehta/SSD_Student_Work.git";
const SHA = "45be517c6ffff2d3ff3b53b3f66cc31579de08b1";
const LISTED_PREFIX = "ssd-creative-coding-2025-26/";
const LATER_PREFIX = "ssd-creative-coding-2024-25/";

const baseEnv = { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never" };
const git = (dir, args, opts = {}) => execFileSync("git", ["-C", dir, "-c", "credential.helper=", "-c", "core.autocrlf=false", "-c", "core.longpaths=true", ...args], { env: { ...baseEnv, ...(opts.env || {}) }, input: opts.input, maxBuffer: 1 << 30, stdio: ["pipe", "pipe", "pipe"] });
const dirBytes = (d) => { let n = 0; for (const e of fs.readdirSync(d, { withFileTypes: true, recursive: true })) if (e.isFile()) n += fs.statSync(path.join(e.parentPath ?? e.path, e.name)).size; return n; };
const t0 = () => process.hrtime.bigint();
const ms = (s) => Number((process.hrtime.bigint() - s) / 1000000n);
const mb = (n) => (n / 1048576).toFixed(1) + " MB";

function initBare(dir, partial) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("git", ["init", "-q", "--bare", dir]);
  git(dir, ["remote", "add", "origin", REPO]);
  if (partial) {
    git(dir, ["config", "remote.origin.promisor", "true"]);
    git(dir, ["config", "remote.origin.partialclonefilter", "blob:none"]);
  }
}
function tree(dir, prefix) {
  const out = git(dir, ["ls-tree", "-r", "--full-tree", SHA]).toString();
  return out.split("\n").filter(Boolean).map((l) => { const [meta, p] = l.split("\t"); const [mode, type, oid, size] = meta.split(/\s+/); return { mode, type, oid, size: Number(size), p }; }).filter((e) => e.p.startsWith(prefix));
}
function fetchBlobs(dir, oids) {
  git(dir, ["-c", "fetch.negotiationAlgorithm=noop", "fetch", "-q", "--no-tags", "--no-write-fetch-head", "--filter=blob:none", "--stdin", "origin"], { input: oids.join("\n") + "\n" });
}
function readOffline(dir, oids) {
  const r = git(dir, ["cat-file", "--batch-check"], { input: oids.join("\n") + "\n", env: { GIT_NO_LAZY_FETCH: "1" } }).toString();
  return r.split("\n").filter(Boolean).filter((l) => l.endsWith("missing")).length;
}

const res = {};
// A
const A = path.join(WORK, "A.git");
initBare(A, false);
let s = t0(); git(A, ["fetch", "-q", "--depth", "1", "--no-tags", "origin", SHA]); res.A_fetch_ms = ms(s); res.A_bytes = mb(dirBytes(A));
// B
const B = path.join(WORK, "B.git");
initBare(B, true);
s = t0(); git(B, ["fetch", "-q", "--depth", "1", "--no-tags", "--filter=blob:none", "origin", SHA]); res.B_tree_ms = ms(s); res.B_tree_bytes = mb(dirBytes(B));
const listed = tree(B, LISTED_PREFIX).filter((e) => e.type === "blob");
res.listed_files = listed.length; 
res.B_missing_before = readOffline(B, listed.map((e) => e.oid));
s = t0(); fetchBlobs(B, listed.map((e) => e.oid)); res.B_blobs_ms = ms(s); res.B_bytes = mb(dirBytes(B));
res.B_missing_after_offline = readOffline(B, listed.map((e) => e.oid));
// identical bytes A vs B for listed
let diff = 0;
for (const e of listed) { const a = git(A, ["cat-file", "blob", e.oid]); const b = git(B, ["cat-file", "blob", e.oid], { env: { GIT_NO_LAZY_FETCH: "1" } }); if (!a.equals(b)) diff++; }
res.A_vs_B_listed_diff = diff;
// symlink / submodule modes anywhere in tree
res.nonregular_modes = tree(B, "").filter((e) => !["100644", "100755"].includes(e.mode)).map((e) => e.mode + " " + e.p);
// newly listed path at same SHA
const later = tree(B, LATER_PREFIX).filter((e) => e.type === "blob");
res.later_missing_offline = readOffline(B, later.map((e) => e.oid));
s = t0(); fetchBlobs(B, later.map((e) => e.oid)); res.later_fetch_ms = ms(s);
res.later_missing_after = readOffline(B, later.map((e) => e.oid));
// warm cache: re-fetch of commit with remote unreachable must not be needed; simulate offline by breaking the URL
git(B, ["remote", "set-url", "origin", "https://invalid.invalid/none.git"]);
res.offline_commit_present = git(B, ["cat-file", "-t", SHA], { env: { GIT_NO_LAZY_FETCH: "1" } }).toString().trim();
res.offline_listed_missing = readOffline(B, listed.map((e) => e.oid));
console.log(JSON.stringify(res, null, 2));
