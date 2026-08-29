const fs = require("fs");
const path = require("path");
const {
  readSections, readEntries, validateSections, validateEntries,
  parseStatus, parseNumber, parseOptionalNumber, parseList, parseRelatedLinks, defaultExtraCount,
} = require("./cabinet-tsv");

const root = path.resolve(__dirname, "..");
const sectionsPath = path.join(root, "content", "cabinet-sections.tsv");
const entriesPath = path.join(root, "content", "cabinet-entries.tsv");
const outputPath = path.join(root, "docs", "assets", "js", "cabinet-generated-content.js");

function buildSections() {
  const rows = readSections(fs.readFileSync(sectionsPath, "utf8"), path.relative(root, sectionsPath));
  validateSections(rows);

  return rows.map(row => {
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
    const explicitExtraCount = parseOptionalNumber(row.extraCount);
    section.extraCount = explicitExtraCount !== undefined ? explicitExtraCount : defaultExtraCount(row.id);
    if (row.notes) section.notes = row.notes;
    return section;
  });
}

function buildEntries(sections) {
  const rows = readEntries(fs.readFileSync(entriesPath, "utf8"), path.relative(root, entriesPath));
  validateEntries(rows, new Set(sections.map(s => s.id)));

  return rows.map(row => {
    const entry = {
      id: row.id,
      section: row.section,
      title: row.title,
      href: row.href,
      order: parseNumber(row.order, "order", `entry ${row.id}`),
      weight: parseNumber(row.weight, "weight", `entry ${row.id}`),
      status: parseStatus(row.status, `entry ${row.id}`),
      kind: row.kind,
      tags: parseList(row.tags),
      location: row.location
    };

    // `visual.anchor` is the one surviving field from what used to be a
    // whole visual/placement sub-object -- landing-v3-layout.js's
    // computeCompassNominalLabels() reads it (only for the compass-n/e/s/w
    // entries, values N/E/S/W) to place the compass rose's direction
    // labels. Nothing else under the old `visual` shape is read anywhere
    // in the live renderer -- see cabinet-tsv.js's schema comment.
    if (row.anchor) entry.visual = { anchor: row.anchor };

    if (row.thumbnail) entry.thumbnail = row.thumbnail;
    if (row.subtitle) entry.subtitle = row.subtitle;

    const relatedLinks = parseRelatedLinks(row.relatedLinks, `entry ${row.id}`);
    if (relatedLinks.length) entry.relatedLinks = relatedLinks;

    if (row.notes) entry.notes = row.notes;
    return entry;
  });
}

function serializeExport(name, value) {
  return `export const ${name} = ${JSON.stringify(value, null, 2)};\n`;
}

const sections = buildSections();
const entries = buildEntries(sections);

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
