// Cabinet -- post-build deployment validation. Run after `mkdocs build
// --strict` and `assemble-external.js` have both produced public/, so this
// checks the actually-assembled output, not just the source TSVs.
//
// For every active (status=true) content/cabinet-entries.tsv row with a
// local (non-external, non-blank) href, asserts the route it names really
// exists in public/ -- catches a stale/mistyped href, a moved page, or an
// assembly that silently failed to land. Deliberately generic over *all*
// local hrefs rather than a Teaching-specific check: Teaching's assembled
// galleries are just some of the local hrefs this already covers, so a
// second special-cased routine would only duplicate this one.
//
// Destination collisions between the assembly manifest and MkDocs' own
// output are caught earlier, in assemble-external.js (it runs after
// `mkdocs build` and refuses to overwrite a path MkDocs already produced) --
// not repeated here.
//
// Usage: node tools/validate-deployment.js [--public-dir public]

const fs = require("fs");
const path = require("path");
const { readEntries, validateEntries, readSections } = require("./cabinet-tsv");

const root = path.resolve(__dirname, "..");
const entriesPath = path.join(root, "content", "cabinet-entries.tsv");
const sectionsPath = path.join(root, "content", "cabinet-sections.tsv");

function parseArgs(argv) {
  const args = { publicDir: "public" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--public-dir" && argv[i + 1]) { args.publicDir = argv[++i]; }
  }
  return args;
}

// Resolve a local href to the on-disk file that should exist once MkDocs
// (clean URLs, directory + index.html) or the assembly step (a copied
// index.html at the mount root) has produced it.
function resolveRoutePath(publicDir, href) {
  const withoutFragment = href.split("#")[0];
  if (!withoutFragment) return null; // pure same-page anchor, e.g. "#foo"
  const clean = withoutFragment.replace(/^\/+/, "");
  if (!clean) return null;

  if (clean.endsWith("/")) return path.join(publicDir, clean, "index.html");
  if (path.extname(clean)) return path.join(publicDir, clean);
  return path.join(publicDir, clean, "index.html");
}

function main() {
  const { publicDir: publicDirArg } = parseArgs(process.argv.slice(2));
  const publicDir = path.resolve(root, publicDirArg);

  const sections = readSections(fs.readFileSync(sectionsPath, "utf8"), path.relative(root, sectionsPath));
  const entries = readEntries(fs.readFileSync(entriesPath, "utf8"), path.relative(root, entriesPath));
  validateEntries(entries, new Set(sections.map(s => s.id)));

  const errors = [];
  let checked = 0;

  for (const row of entries) {
    if (row.status.trim().toLowerCase() !== "true") continue;
    const href = row.href.trim();
    if (!href) continue;
    if (/^https?:\/\//i.test(href)) continue; // external link, not a Cabinet-local route

    const routePath = resolveRoutePath(publicDir, href);
    if (!routePath) continue;

    checked++;
    if (!fs.existsSync(routePath)) {
      errors.push(`entry "${row.id}": href "${href}" -> expected ${path.relative(root, routePath)}, not found`);
    }
  }

  console.log(`Checked ${checked} active local route(s) against ${path.relative(root, publicDir)}/`);

  if (errors.length) {
    console.error("\nRoute validation failed:");
    errors.forEach(line => console.error(`  ERROR: ${line}`));
    process.exit(1);
  }
}

main();
