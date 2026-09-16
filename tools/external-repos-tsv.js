// Cabinet -- shared TSV parse/validate logic for content/external-repos.tsv,
// the deployment manifest that replaced the hand-written per-project
// checkout/assemble/validate blocks in .github/workflows/deploy.yml (#43
// Phase 2 -- see documentation/backend-and-deploy/
// cabinet-multi-repo-assembly-concept-note-short.md section 8). Used by
// tools/assemble-external.js. Reuses cabinet-tsv.js's tab-split parse/
// serialize core rather than re-implementing it, same reasoning as that
// file gives for sharing with now-tsv.js: one parser, so a malformed row
// fails loudly the same way everywhere instead of drifting per-file.

const { parseTsv, serializeTsv, parseList } = require("./cabinet-tsv");

const EXTERNAL_REPOS_COLS = ["id", "name", "repository", "subfolder", "destination", "requiredFiles", "requiredContent", "status", "notes"];
const STATUS_VALUES = ["true", "false", "wip"];

// "owner/repo" only -- this string is passed straight to `git clone
// https://github.com/<repository>.git`, so it's validated strictly enough
// to rule out shell/URL injection via a hand-edited TSV cell.
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function readExternalRepos(raw, contextLabel) {
  return parseTsv(raw, EXTERNAL_REPOS_COLS, contextLabel);
}
function writeExternalRepos(rows) {
  return serializeTsv(rows, EXTERNAL_REPOS_COLS);
}

function parseRequiredFiles(value) {
  return parseList(value);
}

// "path|substring" pairs, semicolon-separated -- same label|href shape
// cabinet-tsv.js's relatedLinks column already uses, for the same reason:
// a file-existence check alone can't catch an empty/half-checked-out repo
// that still happens to have the right filename (e.g. Oblique Strategies
// is a single index.html with no second file to require).
function parseRequiredContent(value, context) {
  return parseList(value).map((item, index) => {
    const separatorIndex = item.indexOf("|");
    if (separatorIndex === -1) throw new Error(`${context}: requiredContent item ${index + 1} must use path|substring`);
    const file = item.slice(0, separatorIndex).trim();
    const substring = item.slice(separatorIndex + 1).trim();
    if (!file || !substring) throw new Error(`${context}: requiredContent item ${index + 1} needs both path and substring`);
    return { file, substring };
  });
}

function findExternalRepoProblems(rows) {
  const problems = [];
  const seenIds = new Map();
  const seenDestinations = new Map();

  rows.forEach((row, index) => {
    const label = row.id || `(row ${index + 1})`;

    if (isBlank(row.id)) problems.push({ index, id: label, field: "id", message: "id is required" });
    else if (seenIds.has(row.id)) {
      problems.push({ index, id: label, field: "id", message: `duplicate id "${row.id}" (also row ${seenIds.get(row.id) + 1})` });
    } else seenIds.set(row.id, index);

    if (isBlank(row.name)) problems.push({ index, id: label, field: "name", message: "name is required" });

    if (isBlank(row.repository)) problems.push({ index, id: label, field: "repository", message: "repository is required" });
    else if (!REPOSITORY_PATTERN.test(row.repository.trim())) {
      problems.push({ index, id: label, field: "repository", message: `repository "${row.repository}" must look like "owner/repo"` });
    }

    if (isBlank(row.destination)) problems.push({ index, id: label, field: "destination", message: "destination is required" });
    else {
      const destination = row.destination.trim().replace(/^\/+|\/+$/g, "");
      if (seenDestinations.has(destination)) {
        problems.push({ index, id: label, field: "destination", message: `duplicate destination "${destination}" (also row ${seenDestinations.get(destination) + 1})` });
      } else seenDestinations.set(destination, index);
    }

    if (isBlank(row.requiredFiles) && isBlank(row.requiredContent)) {
      problems.push({ index, id: label, field: "requiredFiles", message: "at least one requiredFiles or requiredContent check is required" });
    }

    try { parseRequiredContent(row.requiredContent, `external repo ${label}`); }
    catch (err) { problems.push({ index, id: label, field: "requiredContent", message: err.message.replace(/^external repo [^:]+: /, "") }); }

    if (!STATUS_VALUES.includes((row.status || "").trim().toLowerCase())) {
      problems.push({ index, id: label, field: "status", message: "status must be true, wip, or false" });
    }
  });

  return problems;
}

function validateExternalRepos(rows) {
  const problems = findExternalRepoProblems(rows);
  if (problems.length) throw new Error(`external repo ${problems[0].id}: ${problems[0].message}`);
}

module.exports = {
  EXTERNAL_REPOS_COLS, STATUS_VALUES, REPOSITORY_PATTERN,
  readExternalRepos, writeExternalRepos,
  parseRequiredFiles, parseRequiredContent,
  findExternalRepoProblems, validateExternalRepos,
};
