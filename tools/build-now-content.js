// Now page -- builds docs/now.md (a real MkDocs Material page, same as
// docs/sitemap.md) directly from content/now.tsv + docs/_assets/backend/js/now-data.js.
// Emits real Markdown headings (so the sidebar TOC and search index pick
// sections up) with a raw HTML block per section for the entry list itself
// (image layout is a flex/stacked structure attr_list alone can't express).
// See documentation/NOW-PAGE.md's "TSV -> JS pipeline" for the full reasoning
// and why this replaced the old client-side-rendered docs/now.html.
//
// node tools/build-now-content.js

const fs = require("fs");
const path = require("path");
const { readEntries } = require("./now-tsv");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "content", "now.tsv");
const outputPath = path.join(root, "docs", "now.md");
const dataPath = path.join(root, "docs", "_assets", "backend", "js", "now-data.js");
const markdownPath = path.join(root, "docs", "_assets", "backend", "js", "now-markdown.js");

function toFileUrl(p) {
  return `file:///${p.replace(/\\/g, "/")}`;
}

// Same tiering as the old now-render.js: groupSize-sized runs of the
// recency-sorted list step down current -> recent -> old.
function emphasisClass(index, groupSize) {
  const step = Math.floor(index / groupSize);
  if (step === 0) return "now-current";
  if (step === 1) return "now-recent";
  return "now-old";
}

function entriesForSection(nowEntries, sectionKey) {
  return nowEntries
    .map((entry, tsvIndex) => ({ ...entry, tsvIndex }))
    .filter(entry => entry.section === sectionKey)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1; // descending
      return a.tsvIndex - b.tsvIndex; // stable tie-break, preserves TSV order
    });
}

// Pinned entries always make the cut and land after the recency-selected
// ones -- see documentation/NOW-PAGE.md's "Pinning" for why they count
// toward `visible` rather than adding to it.
function selectVisibleEntries(nowEntries, sectionKey, config) {
  const all = entriesForSection(nowEntries, sectionKey);
  const pinned = all.filter(entry => entry.pinned);
  const unpinned = all.filter(entry => !entry.pinned);
  const unpinnedSlots = Math.max(0, config.visible - pinned.length);
  return [...unpinned.slice(0, unpinnedSlots), ...pinned];
}

function entryHtml(entry, cls, imageLayout, renderInline, splitParagraphs) {
  const isFull = imageLayout === "full" && entry.image;
  const liClass = `now-entry ${cls}${isFull ? " now-entry--image-full" : ""}`;
  const imgHtml = entry.image
    ? `<img class="${isFull ? "now-entry-image now-entry-image--full" : "now-entry-image"}" src="${entry.image}" alt="" loading="lazy">`
    : "";
  const paragraphs = splitParagraphs(entry.value)
    .map(p => `<p class="now-entry-value">${renderInline(p)}</p>`)
    .join("");
  return `<li class="${liClass}">${imgHtml}<div class="now-entry-text">${paragraphs}</div></li>`;
}

// A real Markdown heading (attr_list adds the styling class) so the section
// shows up in Material's sidebar TOC and search index, followed by one
// contiguous raw-HTML block for the entries -- kept free of interior blank
// lines so python-markdown parses it as a single HTML block rather than
// splitting on the first blank line it sees.
function sectionMarkdown(nowEntries, sectionKey, config, renderInline, splitParagraphs) {
  const entries = selectVisibleEntries(nowEntries, sectionKey, config);
  if (!entries.length) return ""; // no rows yet -- omit rather than render empty

  const items = entries
    .map((entry, index) => entryHtml(entry, emphasisClass(index, config.groupSize), config.imageLayout, renderInline, splitParagraphs))
    .join("");

  return `## ${config.title} {: .now-section-title }\n\n<ul class="now-entry-list">${items}</ul>\n`;
}

async function main() {
  const raw = fs.readFileSync(sourcePath, "utf8");
  const nowEntries = readEntries(raw, path.relative(root, sourcePath));

  const { renderInline, splitParagraphs } = await import(toFileUrl(markdownPath));
  // cache-bust: now-data.js is hand-edited between rebuilds, same reasoning
  // as now-data-editor.js's readNowData()
  const { nowPageConfig, sectionConfig, sectionOrder } = await import(`${toFileUrl(dataPath)}?t=${Date.now()}`);

  const latest = nowEntries.reduce((max, e) => (e.date > max ? e.date : max), nowEntries[0]?.date || "");
  const updatedLine = latest
    ? `_Last updated: ${new Date(`${latest}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}_\n`
    : "";

  const sections = sectionOrder
    .map(key => {
      const config = sectionConfig[key];
      if (!config) {
        console.warn(`build-now-content: "${key}" is in sectionOrder but missing from sectionConfig -- skipped.`);
        return "";
      }
      return sectionMarkdown(nowEntries, key, config, renderInline, splitParagraphs);
    })
    .filter(Boolean)
    .join("\n");

  const output = [
    `# ${nowPageConfig.title}`,
    "",
    // Visible provenance note, same convention as docs/sitemap.md's own
    // "Auto-generated ... not hand-maintained" line -- honest about where
    // the content comes from rather than hiding it in an HTML comment.
    "_Auto-generated from `content/now.tsv` -- not hand-maintained. Edit the" +
      " TSV (or use the local admin editor, `run-now-editor.bat`) and run" +
      " `node tools/build-now-content.js`._",
    "",
    nowPageConfig.tagline,
    "",
    updatedLine,
    sections,
  ].join("\n");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Generated ${path.relative(root, outputPath)} (${nowEntries.length} entries, ${sectionOrder.filter(k => sectionConfig[k]).length} sections configured)`);
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
