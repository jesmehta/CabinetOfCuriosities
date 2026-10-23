// external-mounts.mjs -- publish the external projects listed in content/external-repos.tsv
// (other repositories mounted under this site, e.g. /teaching/prompt-generator/).
// Replaces tools/assemble-external.js. Design: cloudflare migration/plan.md (v3, C2).
//
// For each active row:
//   - the row's `revision` (a full 40-character commit SHA) is the ONLY version used:
//     the same Cabinet commit always publishes the same external bytes (owner decision D2);
//   - only the files in content/external-allowlists/<id>.txt are published (D3;
//     tools/allowlist.mjs). Unlisted files are left out and reported, never a failure;
//   - every published byte is read from the pinned commit's Git tree (`git cat-file`),
//     never from a working copy, so an edited file can never be published under the pin.
//
// Cache: _external/git/<owner>__<repo>.git, a BARE repository (no working copy at all)
// holding Git objects only. Fetches are per (repository, revision): the commit and its trees
// first, without file contents (--filter=blob:none), then only the listed files' contents
// in one batch. Once warm, a build needs no network (--offline proves it). The build never
// deletes, resets or cleans anything in _external/; a cache folder that is not a bare
// repository of the expected URL is an error, not something to repair.
//
// Every git call except the two explicit fetches runs with GIT_NO_LAZY_FETCH=1: in a
// blob-less repository even an innocent size query (`ls-tree -l`) would otherwise quietly
// download every file (found in the partial-clone experiment, 2026-10-23).
//
// Development override (D10): --external-local <id>=<path> publishes that mount from a
// local folder (its working files, same allowlist and checks) instead of the pin, to
// preview changes to an external project. The result is a DEVELOPMENT build: build-info.json
// records it, and save-artifact / verify-artifact / deploy refuse it.
//
// CLI (for testing; the real build calls assembleMounts from tools/build-site.mjs):
//   node tools/external-mounts.mjs --public-dir <dir> [--offline] [--external-local <id>=<path>]...

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AllowlistError, checkAgainstDir, missingMessage, readAllowlist, summarise } from "./allowlist.mjs";

const require = createRequire(import.meta.url);
const { readExternalRepos, validateExternalRepos, parseRequiredFiles, parseRequiredContent } = require("./external-repos-tsv.js");

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TSV = join(ROOT, "content", "external-repos.tsv");
const ALLOWLISTS = join(ROOT, "content", "external-allowlists");
const CACHE = join(ROOT, "_external", "git");
const LFS_POINTER = Buffer.from("version https://git-lfs.github.com/spec/");

export class MountError extends Error {}

// --- git -----------------------------------------------------------------------
const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never", GIT_NO_LAZY_FETCH: "1" };

function git(dir, args, { input, network = false } = {}) {
  const env = { ...GIT_ENV };
  if (network) delete env.GIT_NO_LAZY_FETCH;
  const r = spawnSync("git", ["-C", dir, "-c", "credential.helper=", "-c", "core.autocrlf=false", "-c", "core.longpaths=true", ...args], {
    env, input, maxBuffer: 1 << 30,
  });
  if (r.error) throw new MountError(`git ${args[0]}: ${r.error.message}`);
  if (r.status !== 0) throw new MountError(`git ${args.join(" ").slice(0, 120)} (in ${dir}) failed: ${String(r.stderr).trim().split("\n").slice(-3).join(" / ")}`);
  return r.stdout;
}

export function gitVersion() {
  const r = spawnSync("git", ["--version"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "unavailable";
}

const repoUrl = (repository) => `https://github.com/${repository}.git`;
const cacheDir = (repository) => join(CACHE, repository.replace("/", "__") + ".git");

// Open (or create) the bare cache repository for one source repository.
export async function openCache(repository, offline) {
  const dir = cacheDir(repository);
  if (!existsSync(dir)) {
    if (offline) throw new MountError(`${repository}: not in the cache (${dir}) and --offline was given -- build once with network first`);
    await mkdir(dir, { recursive: true });
    git(dir, ["init", "-q", "--bare"]);
    git(dir, ["config", "remote.origin.url", repoUrl(repository)]);
    git(dir, ["config", "remote.origin.promisor", "true"]);
    git(dir, ["config", "remote.origin.partialclonefilter", "blob:none"]);
    return dir;
  }
  // Identity: a bare repository of exactly this URL. Anything else is left untouched.
  const bare = spawnSync("git", ["-C", dir, "rev-parse", "--is-bare-repository"], { env: GIT_ENV, encoding: "utf8" });
  const url = spawnSync("git", ["-C", dir, "config", "--get", "remote.origin.url"], { env: GIT_ENV, encoding: "utf8" });
  if (bare.status !== 0 || bare.stdout.trim() !== "true" || url.stdout.trim() !== repoUrl(repository)) {
    throw new MountError(`${dir} is not a cache of ${repoUrl(repository)} (not a bare repository with that origin). The build does not repair or delete it: move it away and build again.`);
  }
  return dir;
}

// Make sure the pinned commit and its trees are present; verify the commit id.
export function ensureCommit(dir, repository, revision, offline) {
  const present = spawnSync("git", ["-C", dir, "cat-file", "-e", `${revision}^{commit}`], { env: GIT_ENV }).status === 0;
  if (!present) {
    if (offline) throw new MountError(`${repository}@${revision.slice(0, 8)}: commit not in the cache and --offline was given`);
    try {
      git(dir, ["fetch", "-q", "--depth", "1", "--filter=blob:none", "--no-tags", "--no-write-fetch-head", "origin", revision], { network: true });
    } catch (err) {
      throw new MountError(`${repository}@${revision}: could not fetch this commit -- does it exist on GitHub (pushed, repository public)? ${err.message}`);
    }
  }
  const resolved = String(git(dir, ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`])).trim();
  if (resolved !== revision) throw new MountError(`${repository}: ${revision} resolved to ${resolved}`);
}

// Every leaf of the commit's tree: [{ mode, type, oid, path }].
export function readTree(dir, revision) {
  const out = String(git(dir, ["ls-tree", "-r", "-z", "--full-tree", revision]));
  return out.split("\0").filter(Boolean).map((line) => {
    const tab = line.indexOf("\t");
    const [mode, type, oid] = line.slice(0, tab).split(" ");
    return { mode, type, oid, path: line.slice(tab + 1) };
  });
}

// Read blobs by id with `cat-file --batch` (no lazy fetch). Returns Map oid -> Buffer.
function readBlobs(dir, oids) {
  const unique = [...new Set(oids)];
  const out = git(dir, ["cat-file", "--batch"], { input: unique.join("\n") + "\n" });
  const blobs = new Map();
  let pos = 0;
  while (pos < out.length) {
    const nl = out.indexOf(10, pos);
    const header = out.subarray(pos, nl).toString();
    const [oid, type, size] = header.split(" ");
    if (type !== "blob") throw new MountError(`object ${oid}: ${type === "missing" ? "missing from the cache" : `expected a blob, got ${type}`}`);
    const start = nl + 1;
    blobs.set(oid, out.subarray(start, start + Number(size)));
    pos = start + Number(size) + 1;
  }
  return blobs;
}

function missingBlobs(dir, oids) {
  const out = String(git(dir, ["cat-file", "--batch-check"], { input: [...new Set(oids)].join("\n") + "\n" }));
  return out.split("\n").filter((l) => l.endsWith(" missing")).map((l) => l.split(" ")[0]);
}

function fetchBlobs(dir, oids) {
  git(dir, ["-c", "fetch.negotiationAlgorithm=noop", "fetch", "-q", "--no-tags", "--no-write-fetch-head", "--filter=blob:none", "--stdin", "origin"], {
    input: oids.join("\n") + "\n", network: true,
  });
}

// --- rows ----------------------------------------------------------------------
const norm = (d) => d.trim(); // destination/subfolder syntax is validated strictly by external-repos-tsv.js (Codex C4 I1)

export async function activeRows() {
  const rows = readExternalRepos(await readFile(TSV, "utf8"), "content/external-repos.tsv");
  validateExternalRepos(rows);
  const active = rows.filter((r) => r.status.trim().toLowerCase() === "true");
  const dests = active.map((r) => norm(r.destination).toLowerCase()); // case-folded, as file systems on Windows/macOS
  for (const a of dests) for (const b of dests) {
    if (a !== b && (b + "/").startsWith(a + "/")) throw new MountError(`external-repos.tsv: destination "${b}" lies inside "${a}" (letter case ignored)`);
  }
  return active;
}

// Check a row's listed entries against its pinned tree. Returns [{ entry, oid }].
function checkAgainstTree(tree, row, entries, label) {
  const prefix = row.subfolder.trim() ? norm(row.subfolder) + "/" : "";
  const files = new Map();
  for (const e of tree) if (e.path.startsWith(prefix)) files.set(e.path.slice(prefix.length), e);
  // .gitattributes can make a checkout differ from the stored bytes (eol, filters, LFS):
  // not supported -- fail closed if one applies to a listed file.
  for (const e of tree) {
    if (!/(^|\/)\.gitattributes$/.test(e.path)) continue;
    const scope = e.path.slice(0, -".gitattributes".length);
    if (entries.some((x) => (prefix + x).startsWith(scope))) throw new MountError(`${label}: ${e.path} applies to published files; .gitattributes conversions are not supported -- review before publishing`);
  }
  const available = [...files.keys()];
  const listed = entries.map((entry) => {
    const e = files.get(entry);
    if (!e) {
      if (available.some((p) => p.startsWith(entry + "/"))) throw new AllowlistError(`${label}: "${entry}" is a folder -- list files one by one`);
      throw new AllowlistError(missingMessage(label, entry, available));
    }
    if (e.mode === "120000") throw new AllowlistError(`${label}: "${entry}" is a symlink in the repository -- not allowed`);
    if (e.type !== "blob" || !["100644", "100755"].includes(e.mode)) throw new AllowlistError(`${label}: "${entry}" is not a regular file (mode ${e.mode}, ${e.type})`);
    return { entry, oid: e.oid };
  });
  const set = new Set(entries);
  return { listed, unlisted: available.filter((p) => !set.has(p)).sort() };
}

// --- assemble ------------------------------------------------------------------
// options: { publicDir, offline, locals: { id: path } }
// Returns { mounts: [...provenance], development, unlisted: { id: [paths] } }.
export async function assembleMounts({ publicDir, offline = false, locals = {} }) {
  const rows = await activeRows();
  for (const id of Object.keys(locals)) if (!rows.some((r) => r.id === id)) throw new MountError(`--external-local ${id}: no active row with that id`);

  // One cache + commit check per (repository, revision); rows with different revisions are never merged.
  const trees = new Map();
  for (const row of rows) {
    if (locals[row.id]) continue;
    const key = `${row.repository}@${row.revision}`;
    if (trees.has(key)) continue;
    const dir = await openCache(row.repository, offline);
    ensureCommit(dir, row.repository, row.revision, offline);
    trees.set(key, { dir, tree: readTree(dir, row.revision) });
  }

  const mounts = [];
  const unlisted = {};
  for (const row of rows) {
    const label = `external ${row.id}`;
    const destination = norm(row.destination);
    const destDir = join(publicDir, destination);
    // Defence in depth (Codex C4 I1): never write outside the output folder, whatever the TSV says.
    const inside = (p) => { const r = relative(resolve(publicDir), resolve(p)); return r !== "" && !r.startsWith("..") && !isAbsolute(r); };
    if (!inside(destDir)) throw new MountError(`${label}: destination "${destination}" resolves outside the output folder`);
    if (existsSync(destDir)) throw new MountError(`${label}: public/${destination} already exists before assembly -- it would collide with an MkDocs page`);
    const entries = await readAllowlist(join(ALLOWLISTS, `${row.id}.txt`), `content/external-allowlists/${row.id}.txt`);
    for (const f of parseRequiredFiles(row.requiredFiles)) {
      if (!entries.includes(f)) throw new MountError(`${label}: required file "${f}" is not in its allowlist`);
    }
    let bytes = 0;
    let record;
    if (locals[row.id]) {
      const src = row.subfolder.trim() ? join(resolve(locals[row.id]), norm(row.subfolder)) : resolve(locals[row.id]);
      const checked = await checkAgainstDir(entries, src, label);
      for (const entry of entries) {
        await mkdir(dirname(join(destDir, entry)), { recursive: true });
        await cp(join(src, entry), join(destDir, entry));
      }
      unlisted[row.id] = checked.unlisted;
      const head = spawnSync("git", ["-C", resolve(locals[row.id]), "rev-parse", "HEAD"], { encoding: "utf8" });
      const dirty = spawnSync("git", ["-C", resolve(locals[row.id]), "status", "--porcelain"], { encoding: "utf8" });
      record = { source: "local", localPath: resolve(locals[row.id]), localHead: head.status === 0 ? head.stdout.trim() : null, localDirty: dirty.status === 0 ? dirty.stdout.trim() !== "" : null };
    } else {
      const { dir, tree } = trees.get(`${row.repository}@${row.revision}`);
      const { listed, unlisted: rest } = checkAgainstTree(tree, row, entries, `content/external-allowlists/${row.id}.txt`);
      const oids = listed.map((x) => x.oid);
      const missing = missingBlobs(dir, oids);
      if (missing.length) {
        if (offline) throw new MountError(`${label}: ${missing.length} listed file(s) not in the cache and --offline was given -- build once with network first`);
        fetchBlobs(dir, missing);
        const still = missingBlobs(dir, oids);
        if (still.length) throw new MountError(`${label}: ${still.length} file(s) still missing after fetching`);
      }
      const blobs = readBlobs(dir, oids);
      for (const { entry, oid } of listed) {
        const data = blobs.get(oid);
        if (data.subarray(0, LFS_POINTER.length).equals(LFS_POINTER)) throw new MountError(`${label}: "${entry}" is a Git LFS pointer, not the file -- LFS is not supported`);
        await mkdir(dirname(join(destDir, entry)), { recursive: true });
        await writeFile(join(destDir, entry), data);
      }
      unlisted[row.id] = rest;
      record = { source: "pinned" };
    }
    for (const entry of entries) bytes += (await readFile(join(destDir, entry))).length;
    for (const { file, substring } of parseRequiredContent(row.requiredContent, label)) {
      if (!entries.includes(file)) throw new MountError(`${label}: requiredContent file "${file}" is not in its allowlist`);
      if (!(await readFile(join(destDir, file), "utf8")).includes(substring)) throw new MountError(`${label}: "${file}" does not contain "${substring}"`);
    }
    mounts.push({ id: row.id, repository: row.repository, subfolder: norm(row.subfolder), revision: row.revision, destination, files: entries.length, bytes, unlisted: unlisted[row.id].length, ...record });
    console.log(`${row.id}: ${entries.length} file(s), ${(bytes / 1048576).toFixed(1)} MB -> /${destination}/ (${record.source === "local" ? `LOCAL ${record.localPath}` : `${row.repository}@${row.revision.slice(0, 8)}`}); ${unlisted[row.id].length} unlisted${unlisted[row.id].length ? `: ${summarise(unlisted[row.id])}` : ""}`);
  }
  return { mounts, development: Object.keys(locals).length > 0, unlisted };
}

export function parseLocals(argv) {
  const locals = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--external-local") continue;
    const v = argv[++i] || "";
    const eq = v.indexOf("=");
    if (eq < 1) throw new MountError(`--external-local needs <id>=<path>, got "${v}"`);
    locals[v.slice(0, eq)] = v.slice(eq + 1);
  }
  return locals;
}

// --- CLI -------------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--public-dir");
  if (i < 0 || !argv[i + 1]) { console.error("usage: node tools/external-mounts.mjs --public-dir <dir> [--offline] [--external-local <id>=<path>]..."); process.exit(2); }
  const publicDir = resolve(argv[i + 1]);
  try {
    await mkdir(publicDir, { recursive: true });
    const r = await assembleMounts({ publicDir, offline: argv.includes("--offline"), locals: parseLocals(argv) });
    console.log(`\nexternal mounts: ${r.mounts.length} assembled${r.development ? " (DEVELOPMENT build: --external-local used)" : ""}`);
  } catch (err) {
    const known = err instanceof MountError || err instanceof AllowlistError;
    console.error(`\nexternal-mounts: FAILED -- ${known ? err.message : err.stack || err}`);
    process.exit(1);
  }
}
