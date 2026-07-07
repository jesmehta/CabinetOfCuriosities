const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sectionsPath = path.join(root, "content", "cabinet-sections.tsv");
const entriesPath = path.join(root, "content", "cabinet-entries.tsv");
const outputPath = path.join(root, "docs", "assets", "js", "cabinet-generated-content.js");

function readTsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter(line => line.length > 0);
  if (!lines.length) return [];

  const headers = lines[0].split("\t");
  return lines.slice(1).map((line, index) => {
    const cells = line.split("\t");
    if (cells.length !== headers.length) {
      throw new Error(
        `${path.relative(root, filePath)} line ${index + 2}: expected ${headers.length} cells, got ${cells.length}`
      );
    }

    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
  });
}

function parseStatus(value, context) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "wip") return "wip";
  throw new Error(`${context}: status must be true, wip, or false (case-insensitive)`);
}

function parseNumber(value, field, context) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${context}: ${field} must be numeric`);
  }
  return parsed;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value.trim() === "") return undefined;
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
    if (separatorIndex === -1) {
      throw new Error(`${context}: relatedLinks item ${index + 1} must use label|href`);
    }

    const label = item.slice(0, separatorIndex).trim();
    const href = item.slice(separatorIndex + 1).trim();
    if (!label || !href) {
      throw new Error(`${context}: relatedLinks item ${index + 1} needs both label and href`);
    }

    return { label, href };
  });
}

function buildSections() {
  return readTsv(sectionsPath).map(row => {
    const section = {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      href: row.href,
      order: parseNumber(row.order, "order", `section ${row.id}`),
      weight: parseNumber(row.weight, "weight", `section ${row.id}`),
      status: parseStatus(row.status, `section ${row.id}`),
      kind: row.kind,
      tags: parseList(row.tags),
      location: row.location,
      map: {
        islandId: row.islandId,
        mapForm: row.mapForm,
        cx: parseNumber(row.cx, "cx", `section ${row.id}`),
        cy: parseNumber(row.cy, "cy", `section ${row.id}`),
        rx: parseNumber(row.rx, "rx", `section ${row.id}`),
        ry: parseNumber(row.ry, "ry", `section ${row.id}`)
      }
    };
    if (row.notes) section.notes = row.notes;
    return section;
  });
}

function buildEntries() {
  return readTsv(entriesPath).map(row => {
    const entry = {
      id: row.id,
      section: row.section,
      title: row.title,
      subtitle: row.subtitle,
      href: row.href,
      order: parseNumber(row.order, "order", `entry ${row.id}`),
      weight: parseNumber(row.weight, "weight", `entry ${row.id}`),
      status: parseStatus(row.status, `entry ${row.id}`),
      kind: row.kind,
      tags: parseList(row.tags),
      location: row.location,
      visual: {
        placement: row.placement,
        size: row.size,
        cardType: row.cardType
      }
    };

    const x = parseOptionalNumber(row.x);
    const y = parseOptionalNumber(row.y);
    if (x !== undefined) entry.visual.x = x;
    if (y !== undefined) entry.visual.y = y;
    if (row.anchor) entry.visual.anchor = row.anchor;
    const cardOrder = parseOptionalNumber(row.cardOrder);
    if (cardOrder !== undefined) entry.visual.order = cardOrder;
    if (row.leaderTo) entry.visual.leaderTo = row.leaderTo;

    if (row.thumbnail) entry.thumbnail = row.thumbnail;

    const relatedLinks = parseRelatedLinks(row.relatedLinks, `entry ${row.id}`);
    if (relatedLinks.length) entry.relatedLinks = relatedLinks;

    if (row.notes) entry.notes = row.notes;
    return entry;
  });
}

function validateReferences(sections, entries) {
  const sectionIds = new Set(sections.map(s => s.id));
  for (const entry of entries) {
    if (!sectionIds.has(entry.section)) {
      throw new Error(`entry ${entry.id}: section "${entry.section}" does not match any section id`);
    }
  }
}

function serializeExport(name, value) {
  return `export const ${name} = ${JSON.stringify(value, null, 2)};\n`;
}

const sections = buildSections();
const entries = buildEntries();
validateReferences(sections, entries);

const output = `// AUTO-GENERATED FILE.
// Do not edit.
// Edit content/cabinet-sections.tsv and content/cabinet-entries.tsv,
// then run:
//
// node tools/build-cabinet-content.js

${serializeExport("sections", sections)}
${serializeExport("entries", entries)}`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} (${sections.length} sections, ${entries.length} entries)`);
