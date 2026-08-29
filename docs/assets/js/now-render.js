// Now page -- renders now-generated-content.js into now.html's <main>,
// using the display rules from now-data.js. Section containers are built
// here, not hand-authored in now.html -- adding a section is meant to be a
// one-file change to now-data.js's sectionConfig/sectionOrder (see
// NOW-PAGE.md's "Adding a section").

import { nowEntries } from "./now-generated-content.js";
import { nowPageConfig, sectionConfig, sectionOrder } from "./now-data.js";
import { renderInline, splitParagraphs } from "./now-markdown.js";

function emphasisClass(index, groupSize) {
  const step = Math.floor(index / groupSize);
  if (step === 0) return "now-current";
  if (step === 1) return "now-recent";
  return "now-old";
}

function entriesForSection(sectionKey) {
  return nowEntries
    .map((entry, tsvIndex) => ({ ...entry, tsvIndex }))
    .filter(entry => entry.section === sectionKey)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1; // descending
      return a.tsvIndex - b.tsvIndex; // stable tie-break, preserves TSV order
    });
}

// Pinned entries always make the cut, regardless of recency rank, and are
// appended after the recency-selected ones (so they land in whatever the
// last fade tier works out to be -- "kept around on purpose", not "brand
// new"). They count toward `visible`, not on top of it: pinning one entry
// in a visible:6 section means 5 slots go to recency, not 6 -- see
// NOW-PAGE.md's "Pinning" for why (this is what the "still at the bottom
// after the latest 5" request actually meant).
function selectVisibleEntries(sectionKey, config) {
  const all = entriesForSection(sectionKey);
  const pinned = all.filter(entry => entry.pinned);
  const unpinned = all.filter(entry => !entry.pinned);
  const unpinnedSlots = Math.max(0, config.visible - pinned.length);
  return [...unpinned.slice(0, unpinnedSlots), ...pinned];
}

function buildEntryEl(entry, cls, imageLayout) {
  const li = document.createElement("li");
  const isFull = imageLayout === "full" && entry.image;
  li.className = `now-entry ${cls}${isFull ? " now-entry--image-full" : ""}`;

  if (entry.image) {
    const img = document.createElement("img");
    img.className = isFull ? "now-entry-image now-entry-image--full" : "now-entry-image";
    img.src = entry.image;
    img.alt = "";
    img.loading = "lazy";
    li.appendChild(img);
  }

  const textWrap = document.createElement("div");
  textWrap.className = "now-entry-text";
  splitParagraphs(entry.value).forEach(paragraph => {
    const p = document.createElement("p");
    p.className = "now-entry-value";
    p.innerHTML = renderInline(paragraph);
    textWrap.appendChild(p);
  });
  li.appendChild(textWrap);

  return li;
}

function buildSectionEl(sectionKey, config) {
  const section = document.createElement("section");
  section.className = "now-section";
  section.dataset.nowSection = sectionKey;

  const title = document.createElement("h2");
  title.className = "now-section-title";
  title.textContent = config.title;
  section.appendChild(title);

  const list = document.createElement("ul");
  list.className = "now-entry-list";
  section.appendChild(list);

  return { section, list };
}

function renderSection(sectionKey, main) {
  const config = sectionConfig[sectionKey];
  if (!config) {
    console.warn(`now-render: "${sectionKey}" is in sectionOrder but missing from sectionConfig -- skipped.`);
    return;
  }

  const entries = selectVisibleEntries(sectionKey, config);
  if (!entries.length) return; // no rows for this section yet -- omit rather than render empty

  const { section, list } = buildSectionEl(sectionKey, config);
  entries.forEach((entry, index) => {
    list.appendChild(buildEntryEl(entry, emphasisClass(index, config.groupSize), config.imageLayout));
  });
  main.appendChild(section);
}

function renderLastUpdated() {
  const el = document.querySelector("[data-now-updated]");
  if (!el || !nowEntries.length) return;

  const latest = nowEntries.reduce((max, entry) => (entry.date > max ? entry.date : max), nowEntries[0].date);
  const date = new Date(`${latest}T00:00:00`);
  const formatted = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  el.textContent = `Last updated: ${formatted}`;
}

function renderHeader() {
  const titleEl = document.querySelector("[data-now-title]");
  const taglineEl = document.querySelector("[data-now-tagline]");
  if (titleEl) titleEl.textContent = nowPageConfig.title;
  if (taglineEl) taglineEl.textContent = nowPageConfig.tagline;
}

renderHeader();
const main = document.querySelector("main");
if (main) sectionOrder.forEach(sectionKey => renderSection(sectionKey, main));
renderLastUpdated();
