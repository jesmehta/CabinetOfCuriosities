// Cabinet -- post-build deployment validation. Run after `mkdocs build
// --strict`, `assemble-external.js`, and the archived-landing-pages copy
// have all produced public/, so this checks the actually-assembled output,
// not just the source TSVs/config.
//
// Four independent route sources are checked, all against the same
// site-root-relative existence test (checkRoute below); each is
// deliberately generic over *all* its rows/links rather than a
// Teaching-specific check (#84 -- the previous version only covered #1,
// which is why the three still-unbuilt Teaching hub links and the
// malformed fffx/PackingShapes.md link were never caught):
//
//   1. content/cabinet-entries.tsv / cabinet-sections.tsv -- every row
//      with status true OR wip (not false) and a local href. "wip" is
//      included because tools/generate_sitemap.py links true AND wip rows
//      on the public /sitemap/ page -- only false rows are never linked
//      anywhere.
//   2. mkdocs.yml's nav: tree -- only its absolute-URL leaves that point
//      at this site's own domain (read from docs/CNAME); a leaf naming a
//      source .md file is left alone, since `mkdocs build --strict`
//      already fails on an unresolvable one, earlier in the pipeline.
//   3. Doc-body links inside docs/**/*.md -- sourced from `mkdocs build`'s
//      own "unrecognized relative link" INFO-level log lines (present on
//      every plain, non---verbose run) rather than a hand-rolled markdown
//      link scanner: MkDocs' own parser already gets fenced-code-block and
//      reference-style-link handling right, and already tells us exactly
//      which link targets it couldn't resolve as a known doc page. Needs
//      deploy.yml to tee that build's output to a log file; if the log is
//      missing (e.g. running this script standalone), this check is
//      skipped, not failed.
//
// All four explicitly skip the same two categories rather than silently
// mishandling them: external links (http(s) to a different domain,
// mailto:, tel:) are out of scope for this build; pure same-page anchors
// (`#foo`, or a resolved target with an empty path) can't 404 against a
// page that, by construction, was just found to exist.
//
// Destination collisions between the assembly manifest and MkDocs' own
// output are caught earlier, in assemble-external.js (it runs after
// `mkdocs build` and refuses to overwrite a path MkDocs already produced) --
// not repeated here.
//
// Usage: node tools/validate-deployment.js [--public-dir public] [--build-log mkdocs-build.log]

const fs = require("fs");
const path = require("path");
const { readEntries, validateEntries, readSections, validateSections } = require("./cabinet-tsv");

const root = path.resolve(__dirname, "..");
const entriesPath = path.join(root, "content", "cabinet-entries.tsv");
const sectionsPath = path.join(root, "content", "cabinet-sections.tsv");
const mkdocsConfigPath = path.join(root, "mkdocs.yml");
const cnamePath = path.join(root, "docs", "CNAME");

function parseArgs(argv) {
  const args = { publicDir: "public", buildLog: "mkdocs-build.log" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--public-dir" && argv[i + 1]) { args.publicDir = argv[++i]; }
    if (argv[i] === "--build-log" && argv[i + 1]) { args.buildLog = argv[++i]; }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Shared route existence check. Every source above eventually reduces its
// link/href down to one site-root-relative path (leading "/", or none --
// both accepted) before calling this.

// Resolve a root-relative href to the on-disk file that should exist once
// MkDocs (clean URLs, directory + index.html) or the assembly step (a
// copied index.html at the mount root) has produced it.
function resolveRoutePath(publicDir, rootRelativeHref) {
  const withoutFragment = rootRelativeHref.split("#")[0];
  if (!withoutFragment) return null; // pure same-page anchor, e.g. "#foo"
  const clean = withoutFragment.replace(/^\/+/, "");
  if (!clean) return null;

  if (clean.endsWith("/")) return path.join(publicDir, clean, "index.html");
  if (path.extname(clean)) return path.join(publicDir, clean);
  return path.join(publicDir, clean, "index.html");
}

function checkRoute(publicDir, rootRelativeHref) {
  const routePath = resolveRoutePath(publicDir, rootRelativeHref);
  if (!routePath) return { skipped: true };
  return { skipped: false, ok: fs.existsSync(routePath), path: routePath };
}

// ---------------------------------------------------------------------------
// 1. content/cabinet-{entries,sections}.tsv

function checkTsvRows(rows, kindLabel, publicDir, errors) {
  let checked = 0;
  for (const row of rows) {
    const status = row.status.trim().toLowerCase();
    if (status === "false") continue; // never linked anywhere -- see header
    const href = row.href.trim();
    if (!href) continue;
    if (/^https?:\/\//i.test(href)) continue; // external link (e.g. a sibling world's subdomain)

    const result = checkRoute(publicDir, href);
    if (result.skipped) continue;
    checked++;
    if (!result.ok) {
      errors.push(`${kindLabel} "${row.id}": href "${href}" -> expected ${path.relative(root, result.path)}, not found`);
    }
  }
  return checked;
}

// ---------------------------------------------------------------------------
// 2. mkdocs.yml nav: tree

const NAV_LEAF_RE = /^\s*-\s+(.+?)\s*:\s*(\S+)\s*$/;
const NAV_GROUP_RE = /^\s*-\s+(.+?)\s*:\s*$/;
const NAV_BARE_RE = /^\s*-\s+(\S+)\s*$/;

// Mirrors tools/generate_sitemap.py's parse_mkdocs_nav() -- same flat-leaf
// reasoning (this only needs "does this leaf's target exist", not the
// nav's visual tree shape), ported to JS so the two can't quietly diverge.
function parseMkdocsNavLeaves(raw) {
  const leaves = [];
  let inNav = false;
  for (const line of raw.split(/\r?\n/)) {
    if (!inNav) {
      if (line.startsWith("nav:")) inNav = true;
      continue;
    }
    const stripped = line.trim();
    if (!stripped) continue;
    if (!/^[ \t-]/.test(line)) break; // back to column 0 -- nav block is over
    if (stripped.startsWith("#")) continue;

    let m = NAV_LEAF_RE.exec(line);
    if (m) { leaves.push({ label: m[1].trim(), target: m[2].trim() }); continue; }
    if (NAV_GROUP_RE.test(line)) continue;
    m = NAV_BARE_RE.exec(line);
    if (m) leaves.push({ label: m[1].trim(), target: m[1].trim() });
  }
  return leaves;
}

function checkNavTargets(publicDir, siteBase, errors) {
  const leaves = parseMkdocsNavLeaves(fs.readFileSync(mkdocsConfigPath, "utf8"));
  let checked = 0;
  for (const { label, target } of leaves) {
    if (!/^https?:\/\//i.test(target)) continue; // a source .md path -- mkdocs --strict already validated it
    if (!target.startsWith(siteBase)) continue; // genuinely external (a sibling world, GitHub, Fabacademy, ...)

    const rootRelative = target.slice(siteBase.length - 1); // keep the leading "/"
    const result = checkRoute(publicDir, rootRelative);
    if (result.skipped) continue;
    checked++;
    if (!result.ok) {
      errors.push(`mkdocs.yml nav "${label}": target "${target}" -> expected ${path.relative(root, result.path)}, not found`);
    }
  }
  return checked;
}

// ---------------------------------------------------------------------------
// 3. docs/**/*.md body links, via mkdocs build's own "unrecognized relative
// link" log lines.

const UNRECOGNIZED_LINK_RE = /Doc file '([^']+)' contains an unrecognized relative link '([^']+)'/;

// docs/x/y.md -> built directory "x/y" (public/x/y/index.html); docs/x/index.md
// -> "x" (public/x/index.html); docs/index.md doesn't occur (guarded earlier
// in deploy.yml). Mirrors MkDocs' own directory-URL convention.
function builtDirForDoc(docRelPath) {
  const posixRel = docRelPath.replace(/\\/g, "/").replace(/\.md$/i, "");
  const base = path.posix.basename(posixRel);
  const dir = path.posix.dirname(posixRel);
  if (base.toLowerCase() === "index") return dir === "." ? "" : dir;
  return dir === "." ? base : `${dir}/${base}`;
}

// Resolves a page-relative or root-relative link target exactly as a
// browser would, against the directory the linking page itself builds
// into -- not against the site root. Uses the URL parser (rather than
// hand-rolled path joining) specifically so ".." segments and a malformed
// target alike land on a definite, checkable path: e.g. a stray leading
// "(" (the fffx/PackingShapes.md bug this was written to catch) resolves
// to a path that will never exist, rather than being silently ignored.
function resolveDocLink(builtDir, target) {
  const base = `https://internal.invalid/${builtDir ? builtDir + "/" : ""}`;
  const resolved = new URL(target, base);
  if (resolved.hostname !== "internal.invalid") return null; // a protocol-relative or scheme link that slipped past the checks below -- treat as external
  return resolved.pathname;
}

function checkDocLinks(publicDir, siteBase, buildLogPath, errors) {
  if (!fs.existsSync(buildLogPath)) {
    console.log(`No build log at ${path.relative(root, buildLogPath)} -- skipping doc-body link checks.`);
    return 0;
  }

  let checked = 0;
  for (const line of fs.readFileSync(buildLogPath, "utf8").split(/\r?\n/)) {
    const m = UNRECOGNIZED_LINK_RE.exec(line);
    if (!m) continue;
    const [, docFile, rawTarget] = m;

    if (/^(mailto:|tel:)/i.test(rawTarget)) continue;
    if (rawTarget.startsWith("#")) continue; // pure same-page anchor

    let rootRelative;
    if (/^https?:\/\//i.test(rawTarget)) {
      if (!rawTarget.startsWith(siteBase)) continue; // genuinely external -- out of scope
      rootRelative = rawTarget.slice(siteBase.length - 1);
    } else {
      rootRelative = resolveDocLink(builtDirForDoc(docFile), rawTarget);
      if (rootRelative === null) continue; // external via "//host/..." or similar
    }

    const result = checkRoute(publicDir, rootRelative);
    if (result.skipped) continue;
    checked++;
    if (!result.ok) {
      errors.push(`${docFile}: link "${rawTarget}" -> expected ${path.relative(root, result.path)}, not found`);
    }
  }
  return checked;
}

// ---------------------------------------------------------------------------

function main() {
  const { publicDir: publicDirArg, buildLog: buildLogArg } = parseArgs(process.argv.slice(2));
  const publicDir = path.resolve(root, publicDirArg);
  const buildLogPath = path.resolve(root, buildLogArg);

  const siteBase = `https://${fs.readFileSync(cnamePath, "utf8").trim()}/`;

  const sections = readSections(fs.readFileSync(sectionsPath, "utf8"), path.relative(root, sectionsPath));
  const entries = readEntries(fs.readFileSync(entriesPath, "utf8"), path.relative(root, entriesPath));
  validateSections(sections);
  validateEntries(entries, new Set(sections.map(s => s.id)));

  const errors = [];
  const counts = {
    entries: checkTsvRows(entries, "entry", publicDir, errors),
    sections: checkTsvRows(sections, "section", publicDir, errors),
    nav: checkNavTargets(publicDir, siteBase, errors),
    docLinks: checkDocLinks(publicDir, siteBase, buildLogPath, errors),
  };

  console.log(
    `Checked ${counts.entries} entr(ies), ${counts.sections} section(s), ${counts.nav} nav target(s), ` +
    `and ${counts.docLinks} doc-body link(s) against ${path.relative(root, publicDir)}/`
  );

  if (errors.length) {
    console.error("\nRoute validation failed:");
    errors.forEach(line => console.error(`  ERROR: ${line}`));
    process.exit(1);
  }
}

main();
