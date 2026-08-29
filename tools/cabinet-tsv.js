// Cabinet -- shared TSV parse/serialize/validate logic for
// content/cabinet-sections.tsv and content/cabinet-entries.tsv, used by
// both build-cabinet-content.js (CLI build) and cabinet-editor.js (the
// local admin server), so the two can't quietly diverge -- same reasoning
// as tools/now-tsv.js for the Now pipeline. See documentation/CABINET-EDITOR.md.
//
// Unlike now-tsv.js, this parser is a plain strict tab/newline splitter,
// not a CSV-quote-aware state machine: neither cabinet-sections.tsv nor
// cabinet-entries.tsv has ever contained an embedded tab, newline, or
// literal quote character in a cell (single-line notes/subtitles only),
// and build-cabinet-content.js has always required an exact per-row cell
// count with no trailing-column padding. Preserving that strictness here
// means a malformed row (a stray literal tab, a row that's missing cells)
// still fails loudly instead of silently padding/misparsing.

// Schema trimmed 2026-08-29, then partially reverted the same day (see
// documentation/CABINET-EDITOR.md's v1.1/v1.2 Changelog entries) once
// WORLD-SYSTEMS.md -- the design doc hand-synced byte-for-byte across
// Cabinet/Bookshelf/fffx -- turned out to document `location`/
// `relatedLinks` as **standard fields every world's entries should carry**
// (confirmed live in both Bookshelf's and fffx's own build scripts), not
// Cabinet-specific cruft. Those two are back. Still removed, because
// WORLD-SYSTEMS.md's own "Cabinet's own extension" framing doesn't assert
// current use, only documents what Cabinet once did, and grepping both
// v2's renderer (archived-landing-pages/v2/assets/js/cabinet-render.js)
// and v3's (landing-v3/layout-engine/cabinet-v3-layout.js) with
// variable-name-agnostic patterns found zero references anywhere outside
// the frozen v2 archive: `icon`, `placement`, `x`, `y`, `cardOrder`,
// `size`, `cardType`, `leaderTo`. `subtitle`/`thumbnail` are equally
// unread today but kept deliberately, per direct instruction, "as a
// just-in-case as well as reminders." `anchor` looked dead by the same
// test at first pass, but a second, more careful grep (not assuming the
// live code uses the variable name `entry`) found
// `cabinet-v3-layout.js:1274` reading `e.visual.anchor` to position the
// compass rose's four direction labels (`compass-n/e/s/w`'s `anchor`
// values are `N`/`E`/`S`/`W`) -- it survived as a real column for exactly
// that reason. Its other historical use (v2's lowercase
// `north`/`south`/`east`/`west` coast-card anchor, tied to the
// now-removed `placement`/`cardOrder`) was genuinely dead, and those
// leftover lowercase values were cleared from the real data, not just
// left orphaned next to a column that no longer explains them.
const SECTIONS_COLS = ["id", "title", "subtitle", "href", "order", "weight", "status", "kind", "tags", "location", "mapForm", "islandId", "cx", "cy", "rx", "ry", "extraCount", "notes"];
const ENTRIES_COLS = ["id", "section", "title", "subtitle", "href", "order", "weight", "status", "kind", "tags", "location", "thumbnail", "relatedLinks", "anchor", "notes"];

// Columns the live v3 renderer (landing-v3/layout-engine/cabinet-v3-layout.js)
// actually reads, vs. columns build-time-computed-over (sections' map
// geometry -- squarify() computes island placement live from weight, so a
// hand-set value here is always overwritten in effect) or kept as a
// deliberate just-in-case/reminder despite no current reader (entries'
// subtitle/thumbnail). Purely descriptive metadata for the editor UI
// (which fields to fold into a collapsed panel) -- has no effect on
// parsing/validation/build output, which treat every column the same.
// `location`/`relatedLinks` are neither -- they're standard cross-world
// fields (see above), so they live in the core grid alongside id/title/etc.,
// not in a reserved panel, even though the current v3 renderer doesn't
// read them either.
const SECTIONS_RESERVED_COLS = ["mapForm", "islandId", "cx", "cy", "rx", "ry"];
const ENTRIES_RESERVED_COLS = ["subtitle", "thumbnail"];

const STATUS_VALUES = ["true", "false", "wip"];

// ---------------------------------------------------------------------------
// parse / serialize

function parseTsv(raw, cols, contextLabel) {
  const lines = raw.replace(/^﻿/, "").split(/\r?\n/).filter(line => line.length > 0);
  if (!lines.length) throw new Error(`${contextLabel}: file is empty`);

  const headers = lines[0].split("\t");
  for (const col of cols) {
    if (!headers.includes(col)) throw new Error(`${contextLabel}: missing required column "${col}"`);
  }

  return lines.slice(1).map((line, index) => {
    const context = `${contextLabel} line ${index + 2}`;
    const cells = line.split("\t");
    if (cells.length !== headers.length) {
      throw new Error(`${context}: expected ${headers.length} cells, got ${cells.length}`);
    }
    const raw = Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
    // Preserve the schema's own column order regardless of the source
    // file's header order, and guarantee every schema column exists.
    return Object.fromEntries(cols.map(c => [c, raw[c] !== undefined ? raw[c] : ""]));
  });
}

function serializeTsv(rows, cols) {
  const lines = [cols.join("\t")];
  rows.forEach(row => {
    lines.push(cols.map(c => (row[c] ?? "").toString()).join("\t"));
  });
  return lines.join("\n") + "\n";
}

function readSections(raw, contextLabel) {
  return parseTsv(raw, SECTIONS_COLS, contextLabel);
}
function writeSections(rows) {
  return serializeTsv(rows, SECTIONS_COLS);
}
function readEntries(raw, contextLabel) {
  return parseTsv(raw, ENTRIES_COLS, contextLabel);
}
function writeEntries(rows) {
  return serializeTsv(rows, ENTRIES_COLS);
}

// ---------------------------------------------------------------------------
// field-level helpers (shared with build-cabinet-content.js's JSON-shape
// transform, so "is this numeric/well-formed" can't drift between the
// build script and the editor's validation)

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function parseStatus(value, context) {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "wip") return "wip";
  throw new Error(`${context}: status must be true, wip, or false (case-insensitive)`);
}

function parseNumber(value, field, context) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${context}: ${field} must be numeric`);
  return parsed;
}

function parseOptionalNumber(value) {
  if (isBlank(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(value, separator = ";") {
  if (!value) return [];
  return value.split(separator).map(item => item.trim()).filter(Boolean);
}

function parseRelatedLinks(value, context) {
  return parseList(value).map((item, index) => {
    const separatorIndex = item.indexOf("|");
    if (separatorIndex === -1) throw new Error(`${context}: relatedLinks item ${index + 1} must use label|href`);
    const label = item.slice(0, separatorIndex).trim();
    const href = item.slice(separatorIndex + 1).trim();
    if (!label || !href) throw new Error(`${context}: relatedLinks item ${index + 1} needs both label and href`);
    return { label, href };
  });
}

// Deterministic fallback for any section that leaves extraCount blank --
// ported as-is from build-cabinet-content.js so both agree on the same
// per-section fallback count.
function defaultExtraCount(sectionId) {
  let hash = 0;
  for (let i = 0; i < sectionId.length; i++) hash = (hash * 31 + sectionId.charCodeAt(i)) >>> 0;
  return 1 + (hash % 3);
}

// ---------------------------------------------------------------------------
// validation
//
// Two shapes on purpose: find*Problems() collects every problem (for the
// editor UI, which wants to flag every bad row at once, not stop at the
// first); validate*() throws on the first one (for the build script and
// the editor's write path, where "fail loudly and stop" is the right
// behaviour -- same split now-tsv.js/now-editor.js use).

function findSectionProblems(rows) {
  const problems = [];
  const seenIds = new Map();

  rows.forEach((row, index) => {
    const label = row.id || `(row ${index + 1})`;
    if (isBlank(row.id)) problems.push({ index, id: label, field: "id", message: "id is required" });
    else if (seenIds.has(row.id)) {
      problems.push({ index, id: label, field: "id", message: `duplicate section id "${row.id}" (also row ${seenIds.get(row.id) + 1})` });
    } else seenIds.set(row.id, index);

    if (isBlank(row.title)) problems.push({ index, id: label, field: "title", message: "title is required" });
    if (isBlank(row.order) || !Number.isFinite(Number(row.order))) problems.push({ index, id: label, field: "order", message: "order must be numeric" });
    if (isBlank(row.weight) || !Number.isFinite(Number(row.weight))) problems.push({ index, id: label, field: "weight", message: "weight must be numeric" });
    if (!STATUS_VALUES.includes((row.status || "").trim().toLowerCase())) problems.push({ index, id: label, field: "status", message: "status must be true, wip, or false" });
    if (!isBlank(row.extraCount) && !Number.isFinite(Number(row.extraCount))) problems.push({ index, id: label, field: "extraCount", message: "extraCount must be numeric if set" });
  });

  return problems;
}

function findEntryProblems(rows, sectionIds) {
  const problems = [];
  const seenIds = new Map();
  const validSectionIds = sectionIds instanceof Set ? sectionIds : new Set(sectionIds);

  rows.forEach((row, index) => {
    const label = row.id || `(row ${index + 1})`;
    if (isBlank(row.id)) problems.push({ index, id: label, field: "id", message: "id is required" });
    else if (seenIds.has(row.id)) {
      problems.push({ index, id: label, field: "id", message: `duplicate entry id "${row.id}" (also row ${seenIds.get(row.id) + 1})` });
    } else seenIds.set(row.id, index);

    if (isBlank(row.section)) problems.push({ index, id: label, field: "section", message: "section is required" });
    else if (!validSectionIds.has(row.section)) problems.push({ index, id: label, field: "section", message: `section "${row.section}" does not match any section id` });

    if (isBlank(row.title)) problems.push({ index, id: label, field: "title", message: "title is required" });
    if (isBlank(row.order) || !Number.isFinite(Number(row.order))) problems.push({ index, id: label, field: "order", message: "order must be numeric" });
    if (isBlank(row.weight) || !Number.isFinite(Number(row.weight))) problems.push({ index, id: label, field: "weight", message: "weight must be numeric" });
    if (!STATUS_VALUES.includes((row.status || "").trim().toLowerCase())) problems.push({ index, id: label, field: "status", message: "status must be true, wip, or false" });

    try { parseRelatedLinks(row.relatedLinks, `entry ${label}`); }
    catch (err) { problems.push({ index, id: label, field: "relatedLinks", message: err.message.replace(/^entry [^:]+: /, "") }); }
  });

  return problems;
}

function validateSections(rows) {
  const problems = findSectionProblems(rows);
  if (problems.length) throw new Error(`section ${problems[0].id}: ${problems[0].message}`);
}

function validateEntries(rows, sectionIds) {
  const problems = findEntryProblems(rows, sectionIds);
  if (problems.length) throw new Error(`entry ${problems[0].id}: ${problems[0].message}`);
}

module.exports = {
  SECTIONS_COLS, ENTRIES_COLS, SECTIONS_RESERVED_COLS, ENTRIES_RESERVED_COLS, STATUS_VALUES,
  parseTsv, serializeTsv,
  readSections, writeSections, readEntries, writeEntries,
  parseStatus, parseNumber, parseOptionalNumber, parseList, parseRelatedLinks, defaultExtraCount,
  findSectionProblems, findEntryProblems, validateSections, validateEntries,
};
