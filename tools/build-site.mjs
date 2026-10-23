// build-site.mjs -- build the complete public website into public/.
//
//   node tools/build-site.mjs [--offline] [--external-local <id>=<path>]...   (or: npm run build)
//
// The ONE build used everywhere: Cloudflare, GitHub Actions (during the move) and local
// preview, so they all produce the same site. Ported from FFFX/Bookshelf
// (form-follows-fx/tools/build-site.mjs). Design: cloudflare migration/plan.md (v3.1). Steps:
//   1. guard: docs/index.md must not exist (docs/index.html is the landing page);
//      regenerate the landing-page and Now data from content/*.tsv and fail if the
//      committed files were out of date (they are regenerated anyway; review and commit)
//   2. mkdocs build --strict into public/ (log kept in mkdocs-build.log)
//   3. drop MkDocs output visitors don't need: *.map debug files, sitemap.xml.gz
//      (sitemap.xml is kept; D5) and CNAME (GitHub Pages only); normalise the
//      mkdocs-redirects pages to LF (Python writes CRLF on Windows)
//   4. external mounts: content/external-repos.tsv at the pinned revisions, only the files
//      in content/external-allowlists/<id>.txt (tools/external-mounts.mjs)
//   5. archive: archived-landing-pages/ through content/archive-allowlist.txt (C4)
//   6. sitemap.xml: add the landing page and the mount pages to MkDocs' list (see extendSitemap)
//   7. route validation (tools/validate-deployment.js)
//   8. publication check: nothing private (docs, data, tooling) reached public/
//   9. build-info.json and public-manifest.sha256, both OUTSIDE public/ (never published)
//
// --offline: never use the network for the external mounts (fails if the cache lacks
//   something). --external-local <id>=<path>: a DEVELOPMENT build of one mount from a local
//   folder; recorded in build-info.json, and save-artifact / verify-artifact / deploy refuse it.
//
// Python: uses .venv/ in this repo if it exists (local builds with the pinned versions
// from requirements-lock.txt), else $PYTHON, else `python`/`python3`.
// Reproducible: SOURCE_DATE_EPOCH defaults to the HEAD commit's time.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, lstat, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AllowlistError, checkAgainstDir, readAllowlist, summarise } from "./allowlist.mjs";
import { MountError, assembleMounts, gitVersion, parseLocals } from "./external-mounts.mjs";
import { formatManifest, hashDir } from "./manifest.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const BUILD_LOG = join(ROOT, "mkdocs-build.log");
const MANIFEST = join(ROOT, "public-manifest.sha256");
const BUILD_INFO = join(ROOT, "build-info.json");
const UNLISTED = join(ROOT, "build-unlisted.txt");
const ARCHIVE_SRC = join(ROOT, "archived-landing-pages");
const ARCHIVE_LIST = join(ROOT, "content", "archive-allowlist.txt");
const GENERATED = [
  "docs/_assets/backend/js/cabinet-generated-content.js",
  "docs/_assets/backend/js/now-data.js",
  "docs/_assets/backend/js/now-markdown.js",
  "docs/compass/now.md",
];

// Never allowed anywhere in public/ (defence in depth on top of the allowlists).
const FORBIDDEN_EXT = [".md", ".tsv", ".zip", ".7z", ".py", ".bat", ".map", ".log", ".bak"];
const FORBIDDEN_NAMES = ["requirements.txt", "requirements-lock.txt", "package.json", "package-lock.json", "wrangler.jsonc", "CNAME", "sitemap.xml.gz", "build-info.json", ".gitignore", ".nojekyll", ".gitattributes"];
const FORBIDDEN_DIRS = ["documentation", "content", "tools", "node_modules", ".git", ".venv", "cloudflare migration", "review", "_temp", "releases", "_external"];
// Owner-approved exceptions (D4): the v1 archive's linked downloads.
const EXCEPTIONS = new Set(["archived-landing-pages/v1/files/requirements.txt"]);

class BuildError extends Error {}
const step = (n, msg) => console.log(`\n[${n}/9] ${msg}`);

function pythonCommand() {
  const venv = process.platform === "win32" ? join(ROOT, ".venv", "Scripts", "python.exe") : join(ROOT, ".venv", "bin", "python");
  if (existsSync(venv)) return venv;
  if (process.env.PYTHON) return process.env.PYTHON;
  for (const cmd of ["python", "python3"]) {
    if (spawnSync(cmd, ["--version"], { stdio: "ignore" }).status === 0) return cmd;
  }
  throw new BuildError("No Python found. Create .venv (see DEPLOYMENT.md) or set PYTHON.");
}

const gitOut = (args) => { try { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim(); } catch { return null; } };
const sourceDateEpoch = () => process.env.SOURCE_DATE_EPOCH || gitOut(["log", "-1", "--format=%ct"]) || undefined;

// --- 1 ---------------------------------------------------------------------
async function regenerateContent() {
  if (existsSync(join(ROOT, "docs", "index.md"))) {
    throw new BuildError("docs/index.md must not exist. This site uses docs/index.html as the standalone landing page. See archived-landing-pages/v2/LANDING-PAGE-NOTES.md.");
  }
  const before = await Promise.all(GENERATED.map((f) => readFile(join(ROOT, f)).catch(() => null)));
  for (const tool of ["build-cabinet-content.js", "build-now-content.js"]) {
    execFileSync(process.execPath, [join(ROOT, "tools", tool)], { cwd: ROOT, stdio: "inherit" });
  }
  const stale = [];
  for (let i = 0; i < GENERATED.length; i++) {
    const after = await readFile(join(ROOT, GENERATED[i]));
    if (!before[i] || !before[i].equals(after)) stale.push(GENERATED[i]);
  }
  if (stale.length) throw new BuildError(`generated content was out of date with content/*.tsv: ${stale.join(", ")}. It has now been regenerated: review and commit it, then build again.`);
  console.log("generated content is current");
}

// --- 2 ---------------------------------------------------------------------
async function buildMkdocs(python, epoch) {
  await rm(PUBLIC, { recursive: true, force: true });
  const env = { ...process.env, ...(epoch ? { SOURCE_DATE_EPOCH: epoch } : {}) };
  const r = spawnSync(python, ["-m", "mkdocs", "build", "--strict", "--site-dir", PUBLIC], { cwd: ROOT, env, encoding: "utf8" });
  const log = (r.stdout || "") + (r.stderr || "");
  await writeFile(BUILD_LOG, log);
  if (r.status !== 0) {
    process.stdout.write(log.split("\n").filter((l) => /WARNING|ERROR|Error|Aborted/.test(l)).join("\n") + "\n");
    throw new BuildError(`mkdocs build --strict failed (exit ${r.status}); full output in mkdocs-build.log`);
  }
  console.log(`mkdocs build --strict OK (python: ${python}${epoch ? `, SOURCE_DATE_EPOCH=${epoch}` : ""})`);
}

// --- 3 ---------------------------------------------------------------------
async function tidyMkdocsOutput(dir) {
  const counts = { removed: 0, normalised: 0 };
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const c = await tidyMkdocsOutput(full);
      counts.removed += c.removed; counts.normalised += c.normalised;
    } else if (entry.name.endsWith(".map") || full === join(PUBLIC, "sitemap.xml.gz") || full === join(PUBLIC, "CNAME")) {
      await rm(full); counts.removed++;
    } else if (entry.name.endsWith(".html")) {
      const text = await readFile(full, "utf8");
      if (text.includes("\r\n") && /http-equiv="refresh"/i.test(text)) { await writeFile(full, text.replace(/\r\n/g, "\n")); counts.normalised++; }
    }
  }
  return counts;
}

// --- 5 ---------------------------------------------------------------------
async function assembleArchive() {
  const label = "content/archive-allowlist.txt";
  const entries = await readAllowlist(ARCHIVE_LIST, label);
  const dest = join(PUBLIC, "archived-landing-pages");
  if (existsSync(dest)) throw new BuildError("public/archived-landing-pages already exists from the MkDocs build -- the two would collide");
  const { unlisted } = await checkAgainstDir(entries, ARCHIVE_SRC, label);
  for (const entry of entries) {
    await mkdir(dirname(join(dest, entry)), { recursive: true });
    await cp(join(ARCHIVE_SRC, entry), join(dest, entry));
  }
  console.log(`archive: ${entries.length} file(s) -> /archived-landing-pages/; ${unlisted.length} unlisted${unlisted.length ? `: ${summarise(unlisted)}` : ""}`);
  return unlisted;
}

// --- 6 ---------------------------------------------------------------------
// sitemap.xml (plan v3 "Sitemap rule", D6): MkDocs lists only its own pages. Added: the landing
// page "/" (a static docs/index.html), and for each external mount its entry page plus every
// first-level <folder>/index.html (SSD student projects, Swatch Fields' modes, the Tracery bots).
// Skipped: pages marked noindex or canonical to another URL. Never the archive or redirect stubs.
// Deduplicated by URL, XML-escaped, MkDocs' order then sorted additions, MkDocs' lastmod date.
// Every URL must resolve to a file in public/.
const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

async function extendSitemap(mounts) {
  const file = join(PUBLIC, "sitemap.xml");
  const xml = await readFile(file, "utf8");
  const siteUrl = (/^site_url:\s*(\S+)\s*$/m.exec(await readFile(join(ROOT, "mkdocs.yml"), "utf8")) || [])[1];
  if (!siteUrl) throw new BuildError("mkdocs.yml has no site_url (D6): sitemap.xml would have no URLs");
  const base = siteUrl.endsWith("/") ? siteUrl : siteUrl + "/";
  const existing = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const lastmod = (/<lastmod>([^<]*)<\/lastmod>/.exec(xml) || [])[1];
  const pages = ["index.html"];
  for (const m of mounts) {
    pages.push(`${m.destination}/index.html`);
    for (const e of await readdir(join(PUBLIC, m.destination), { withFileTypes: true })) {
      if (e.isDirectory() && existsSync(join(PUBLIC, m.destination, e.name, "index.html"))) pages.push(`${m.destination}/${e.name}/index.html`);
    }
  }
  const added = [];
  for (const p of pages.sort()) {
    const html = await readFile(join(PUBLIC, p), "utf8");
    const url = base + p.replace(/index\.html$/, "").split("/").map(encodeURIComponent).join("/");
    if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
    const canon = (/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i.exec(html) || [])[1];
    if (canon && canon !== url) continue;
    if (!existing.includes(url) && !added.includes(url)) added.push(url);
  }
  const entries = added.map((u) => `    <url>\n         <loc>${xmlEscape(u)}</loc>${lastmod ? `\n         <lastmod>${lastmod}</lastmod>` : ""}\n    </url>\n`).join("");
  if (!xml.includes("</urlset>")) throw new BuildError("sitemap.xml: no </urlset>");
  await writeFile(file, xml.replace("</urlset>", entries + "</urlset>"));
  // every URL must be on the canonical host and resolve to a published file
  const all = [...existing, ...added];
  const bad = [];
  for (const u of all) {
    const loc = u.replace(/&amp;/g, "&");
    if (!loc.startsWith(base)) { bad.push(`${u} (not under ${base})`); continue; }
    const rel = decodeURIComponent(loc.slice(base.length));
    const target = rel === "" || rel.endsWith("/") ? join(PUBLIC, rel, "index.html") : join(PUBLIC, rel);
    if (!existsSync(target)) bad.push(`${u} (no file)`);
  }
  if (new Set(all).size !== all.length) bad.push("duplicate URLs");
  if (bad.length) throw new BuildError(`sitemap.xml:\n  ${bad.join("\n  ")}`);
  console.log(`sitemap.xml: ${existing.length} MkDocs page(s) + ${added.length} added (landing page, mount entry and first-level pages) = ${all.length} URLs, all resolve`);
}

// --- 7 ---------------------------------------------------------------------
function validateRoutes() {
  const r = spawnSync(process.execPath, [join(ROOT, "tools", "validate-deployment.js"), "--public-dir", PUBLIC, "--build-log", BUILD_LOG], { cwd: ROOT, encoding: "utf8" });
  process.stdout.write((r.stdout || "") + (r.stderr || ""));
  if (r.status !== 0) throw new BuildError("route validation failed (see above)");
}

// --- 8 ---------------------------------------------------------------------
async function publicationCheck() {
  const rows = await hashDir(PUBLIC);
  const problems = [];
  for (const { path } of rows) {
    if (EXCEPTIONS.has(path)) continue;
    const parts = path.split("/");
    const name = parts[parts.length - 1];
    if (FORBIDDEN_EXT.some((ext) => name.toLowerCase().endsWith(ext))) problems.push(`${path} (file type never published)`);
    if (FORBIDDEN_NAMES.includes(name)) problems.push(`${path} (private file)`);
    if (parts.slice(0, -1).some((d) => FORBIDDEN_DIRS.includes(d))) problems.push(`${path} (inside a private folder)`);
  }
  if (problems.length) throw new BuildError(`private files reached public/:\n  ${problems.join("\n  ")}`);
  return rows;
}

async function main() {
  const argv = process.argv.slice(2);
  const offline = argv.includes("--offline");
  const locals = parseLocals(argv);
  const python = pythonCommand();
  const epoch = sourceDateEpoch();
  step(1, "guard and generated data (content/*.tsv)");
  await regenerateContent();
  step(2, "MkDocs");
  await buildMkdocs(python, epoch);
  step(3, "tidy MkDocs output");
  const tidy = await tidyMkdocsOutput(PUBLIC);
  console.log(`removed ${tidy.removed} file(s) (*.map, sitemap.xml.gz, CNAME); normalised ${tidy.normalised} redirect page(s) to LF`);
  step(4, `external mounts (content/external-repos.tsv${offline ? ", offline" : ""})`);
  const mounts = await assembleMounts({ publicDir: PUBLIC, offline, locals });
  step(5, "archive (content/archive-allowlist.txt)");
  const archiveUnlisted = await assembleArchive();
  step(6, "sitemap.xml (MkDocs pages + landing page + mount pages)");
  await extendSitemap(mounts.mounts);
  step(7, "route validation");
  validateRoutes();
  step(8, "publication check");
  const rows = await publicationCheck();
  console.log("nothing private in public/");
  step(9, "build-info.json and manifest (outside public/)");
  const bytes = (await Promise.all(rows.map((r) => lstat(join(PUBLIC, r.path))))).reduce((n, s) => n + s.size, 0);
  const status = gitOut(["status", "--porcelain"]);
  const info = {
    development: mounts.development,
    sourceCommit: gitOut(["rev-parse", "HEAD"]) || "unknown",
    sourceDirty: status === null ? null : status !== "",
    sourceDateEpoch: epoch || null,
    tools: { node: process.version, git: gitVersion(), python: spawnSync(python, ["--version"], { encoding: "utf8" }).stdout.trim() },
    externals: mounts.mounts,
    files: rows.length,
    bytes,
  };
  await writeFile(BUILD_INFO, JSON.stringify(info, null, 2) + "\n");
  const unlistedText = [
    ...Object.entries(mounts.unlisted).flatMap(([id, paths]) => paths.map((p) => `${id}\t${p}`)),
    ...archiveUnlisted.map((p) => `archive\t${p}`),
  ].join("\n");
  await writeFile(UNLISTED, unlistedText ? unlistedText + "\n" : "");
  await writeFile(MANIFEST, formatManifest(rows));
  console.log(`public/: ${rows.length} files, ${(bytes / 1048576).toFixed(1)} MB -- manifest in public-manifest.sha256, provenance in build-info.json, unlisted files in build-unlisted.txt`);
  if (mounts.development) console.log("\n*** DEVELOPMENT build (--external-local): for preview only; save-artifact, verify-artifact and deploy refuse it. ***");
}

main().catch((err) => {
  const known = err instanceof BuildError || err instanceof MountError || err instanceof AllowlistError;
  console.error(`\nbuild-site: FAILED -- ${known ? err.message : err.stack || err}`);
  process.exit(1);
});
