// Cabinet -- generalized multi-repo assembly (#43 Phase 2). Reads
// content/external-repos.tsv and, for each active row: shallow-clones the
// source repo, copies its (sub)folder into public/<destination>, strips
// .git, and checks the project's required files/content actually landed.
// Replaces the hand-written per-project checkout/assemble/validate step
// triples that used to live directly in .github/workflows/deploy.yml --
// see documentation/backend-and-deploy/
// cabinet-multi-repo-assembly-concept-note-short.md section 8/11 for why
// this was deliberately deferred until there were enough real examples to
// generalize from.
//
// All-or-nothing, same as the hand-written version: every project is
// attempted and every problem is collected, but the script exits non-zero
// if any project failed, so a partial/broken assembly never reaches
// `deploy` (needs: build).
//
// Usage: node tools/assemble-external.js [--public-dir public]
//
// Destination-collision handling: content/external-repos.tsv itself
// guarantees no two manifest rows share a destination (external-repos-tsv.js
// validation). What this script additionally catches is a manifest
// destination colliding with something MkDocs already built (this script
// is meant to run *after* `mkdocs build`, matching the concept note's
// build -> assemble -> validate -> deploy pipeline) -- e.g. a Markdown page
// accidentally living at the same path a manifest entry wants to mount.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readExternalRepos, validateExternalRepos, parseRequiredFiles, parseRequiredContent } = require("./external-repos-tsv");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "content", "external-repos.tsv");

function parseArgs(argv) {
  const args = { publicDir: "public" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--public-dir" && argv[i + 1]) { args.publicDir = argv[++i]; }
  }
  return args;
}

function main() {
  const { publicDir: publicDirArg } = parseArgs(process.argv.slice(2));
  const publicDir = path.resolve(root, publicDirArg);
  const externalDir = path.join(root, "_external");

  const rows = readExternalRepos(fs.readFileSync(manifestPath, "utf8"), path.relative(root, manifestPath));
  validateExternalRepos(rows);

  const active = rows.filter(row => row.status.trim().toLowerCase() === "true");
  const errors = [];
  const assembled = [];

  fs.mkdirSync(externalDir, { recursive: true });

  for (const row of active) {
    const label = row.name || row.id;
    const cloneDir = path.join(externalDir, row.id);
    const destination = row.destination.trim().replace(/^\/+|\/+$/g, "");
    const destDir = path.join(publicDir, destination);

    // A path MkDocs (or an earlier row -- shouldn't happen, the manifest
    // itself rejects duplicate destinations, but check the filesystem too
    // rather than trust that alone) already put something at this
    // destination is a real routing collision, not something to silently
    // overwrite.
    if (fs.existsSync(destDir)) {
      errors.push(`${label}: destination "${destination}" already exists in ${path.relative(root, publicDir)}/ before assembly -- likely collides with an MkDocs-built page`);
      continue;
    }

    fs.rmSync(cloneDir, { recursive: true, force: true });
    try {
      execFileSync("git", ["clone", "--depth", "1", `https://github.com/${row.repository}.git`, cloneDir], { stdio: "pipe" });
    } catch (err) {
      errors.push(`${label}: failed to clone ${row.repository} -- ${err.message.split("\n")[0]}`);
      continue;
    }

    const subfolder = row.subfolder.trim();
    const sourceDir = subfolder ? path.join(cloneDir, subfolder) : cloneDir;
    if (!fs.existsSync(sourceDir)) {
      errors.push(`${label}: subfolder "${subfolder}" does not exist in ${row.repository}`);
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(sourceDir, destDir, { recursive: true });
    fs.rmSync(path.join(destDir, ".git"), { recursive: true, force: true });

    const requiredFiles = parseRequiredFiles(row.requiredFiles);
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(destDir, file))) {
        errors.push(`${label}: missing required file "${file}" in assembled ${destination}/`);
      }
    }

    const requiredContent = parseRequiredContent(row.requiredContent, `external repo ${label}`);
    for (const { file, substring } of requiredContent) {
      const filePath = path.join(destDir, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`${label}: missing required file "${file}" in assembled ${destination}/ (needed for content check)`);
        continue;
      }
      const content = fs.readFileSync(filePath, "utf8");
      if (!content.includes(substring)) {
        errors.push(`${label}: "${file}" does not contain expected content "${substring}"`);
      }
    }

    assembled.push(`${label} -> ${destination}/`);
  }

  if (assembled.length) {
    console.log("Assembled:");
    assembled.forEach(line => console.log(`  ${line}`));
  }

  if (errors.length) {
    console.error("\nAssembly failed:");
    errors.forEach(line => console.error(`  ERROR: ${line}`));
    process.exit(1);
  }
}

main();
