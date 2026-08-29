// Now page -- shared TSV parse/serialize logic for content/now.tsv, used by
// both build-now-content.js (CLI build) and now-editor.js (the local admin
// server), so the two never drift apart. See NOW-PAGE.md's "Excel
// round-trip" and "Data model" for why this parser looks the way it does.

// "pinned" is last, not right after "date" where it'd read more naturally,
// specifically so every pre-existing row (none of which have it) keeps
// parsing via the trailing-column padding below instead of needing every
// row rewritten just to insert a column in the middle -- see NOW-PAGE.md's
// "Pinning" for why this shape was chosen.
const REQUIRED_HEADERS = ["date", "section", "value", "image", "notes", "pinned"];
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
// now.tsv gets hand-edited in Excel, which silently reformats an ISO date
// cell into the system locale's date format on save -- for this repo (India
// locale) that's DD-MM-YYYY. Accepting it here, rather than fighting Excel
// every time the file is re-saved, is the point.
const DMY_DATE_RE = /^(\d{2})-(\d{2})-(\d{4})$/;

// now.tsv is TSV, but Excel's "Text (Tab delimited)" export still applies
// CSV-style quoting: a field containing a tab, newline, or literal quote gets
// wrapped in "..." with internal quotes doubled ("" -> "). This shows up
// whenever a `value`/`notes` field is a multi-paragraph reaction with blank
// lines between paragraphs. A naive split-on-newline-then-split-on-tab parse
// shreds those rows across several bogus "rows" instead of treating the
// embedded newlines as part of one field, so row/column splitting has to
// happen together, quote-aware, in one pass.
function parseTsvRows(raw) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < raw.length) {
    const char = raw[i];

    if (inQuotes) {
      if (char === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += char;
        i += 1;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === "\t") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\r") {
      i += 1; // paired \n (if any) ends the row below
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-blank rows (e.g. a trailing blank line at EOF) -- a genuine
  // row always has at least a date and section.
  return rows.filter(cells => !(cells.length === 1 && cells[0] === ""));
}

function needsQuoting(field) {
  return /[\t\n"]/.test(field);
}

function serializeField(field) {
  if (!needsQuoting(field)) return field;
  return `"${field.replace(/"/g, '""')}"`;
}

function serializeRow(cells) {
  return cells.map(serializeField).join("\t");
}

function normalizeDate(value, context) {
  const trimmed = value.trim();
  let year, month, day;

  const iso = ISO_DATE_RE.exec(trimmed);
  const dmy = DMY_DATE_RE.exec(trimmed);
  if (iso) {
    [, year, month, day] = iso;
  } else if (dmy) {
    [, day, month, year] = dmy;
  } else {
    throw new Error(`${context}: date "${value}" is not ISO YYYY-MM-DD or DD-MM-YYYY`);
  }

  const y = Number(year), m = Number(month), d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  const isRealDate = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  if (!isRealDate) {
    throw new Error(`${context}: date "${value}" is not a real calendar date`);
  }

  return `${year}-${month}-${day}`;
}

// Reads now.tsv into validated { date, section, value, image, notes }
// objects (dates normalized to ISO). Throws with a "file line N" message on
// the first malformed row.
function readEntries(raw, contextLabel) {
  const rows = parseTsvRows(raw.replace(/^﻿/, ""));
  if (!rows.length) throw new Error(`${contextLabel}: file is empty`);

  const headers = rows[0];
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new Error(`${contextLabel}: missing required column "${required}"`);
    }
  }

  return rows.slice(1).map((cells, index) => {
    const context = `${contextLabel} line ${index + 2}`;

    // Trailing empty columns (blank image/notes) are routinely dropped when
    // hand-editing TSV in a spreadsheet or text editor, so pad rather than
    // reject short rows. A row with MORE cells than headers almost certainly
    // means an unescaped literal tab landed in a value -- that's still an error.
    if (cells.length > headers.length) {
      throw new Error(`${context}: expected at most ${headers.length} cells, got ${cells.length}`);
    }
    const padded = cells.slice();
    while (padded.length < headers.length) padded.push("");

    const row = Object.fromEntries(headers.map((header, i) => [header, padded[i]]));

    if (!row.section) throw new Error(`${context}: section is required`);
    if (!row.value) throw new Error(`${context}: value is required`);

    return {
      date: normalizeDate(row.date, context),
      section: row.section,
      value: normalizeNewlines(row.value),
      image: row.image || "",
      notes: normalizeNewlines(row.notes || ""),
      pinned: normalizeBoolean(row.pinned),
    };
  });
}

// Same case-insensitive TRUE/FALSE convention as the `status` field in
// Cabinet's other TSVs (see WORLD-SYSTEMS.md) -- blank or anything other
// than "true" normalizes to false, so every pre-existing row (no "pinned"
// column at all, padded to "" above) defaults to not-pinned.
function normalizeBoolean(value) {
  return (value || "").trim().toLowerCase() === "true";
}

// A quoted field's embedded line breaks come through the parser verbatim --
// if the source ever has a stray CR (a lone \r, or a \r\n where only \n was
// intended as the paragraph-break marker; observed once already from an
// Excel export quirk), downstream consumers split/render \n-based breaks.
// Normalizing here, once, means every consumer of readEntries() gets clean
// LF only, rather than relying on splitParagraphs()'s trim() to silently
// paper over it.
function normalizeNewlines(str) {
  return str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

// Serializes entry objects back to now.tsv text (CRLF, matching Excel's own
// line endings so a re-open in Excel doesn't show a "line endings changed"
// diff for unrelated reasons).
function writeEntries(entries) {
  const rows = [
    REQUIRED_HEADERS,
    ...entries.map(e => REQUIRED_HEADERS.map(h => (h === "pinned" ? (e.pinned ? "TRUE" : "FALSE") : e[h] ?? ""))),
  ];
  return rows.map(serializeRow).join("\r\n") + "\r\n";
}

module.exports = { parseTsvRows, serializeRow, normalizeDate, readEntries, writeEntries, REQUIRED_HEADERS };
