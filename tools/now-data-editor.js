// Now page -- programmatic read/write access to docs/_assets/backend/js/now-data.js
// for tools/now-editor.js (the local admin server). Reading uses a real ESM
// dynamic import (so it's parsed as actual JS, not regexed -- immune to
// whitespace/formatting variation). Writing locates the sectionConfig
// object's and sectionOrder array's balanced-bracket span by scanning brace
// depth from each `export const NAME` marker, and replaces only that span --
// everything else in the file (the header comment, nowPageConfig, the
// stream-vs-snapshot explainer comment) is untouched. See documentation/NOW-PAGE.md's
// "Adding a section" for the file's role.

const fs = require("fs");
const path = require("path");

const NOW_DATA_PATH = path.join(__dirname, "..", "docs", "_assets", "backend", "js", "now-data.js");
const KEY_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

function findBalancedSpan(text, marker, openChar, closeChar) {
  const markerIdx = text.indexOf(marker);
  if (markerIdx === -1) throw new Error(`now-data.js: could not find "${marker}" -- was the file hand-edited into a different shape?`);
  const openIdx = text.indexOf(openChar, markerIdx);
  if (openIdx === -1) throw new Error(`now-data.js: no "${openChar}" found after "${marker}"`);

  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === openChar) depth++;
    else if (text[i] === closeChar) {
      depth--;
      if (depth === 0) return { openIdx, closeIdx: i };
    }
  }
  throw new Error(`now-data.js: unbalanced ${openChar}...${closeChar} after "${marker}"`);
}

async function readNowData() {
  const fileUrl = `file:///${NOW_DATA_PATH.replace(/\\/g, "/")}?t=${Date.now()}`; // cache-bust: re-read on every call
  const mod = await import(fileUrl);
  return {
    nowPageConfig: mod.nowPageConfig,
    sectionConfig: mod.sectionConfig,
    sectionOrder: mod.sectionOrder,
  };
}

function validateSectionInput({ key, title, mode, visible, groupSize, imageLayout }) {
  if (!KEY_RE.test(key)) {
    throw new Error(`section key "${key}" must be a plain identifier (letters/digits/underscore, not starting with a digit) -- it becomes a bare object property in now-data.js`);
  }
  if (!title || !title.trim()) throw new Error("section title is required");
  if (mode !== "stream" && mode !== "snapshot") throw new Error('mode must be "stream" or "snapshot"');
  if (!Number.isInteger(visible) || visible < 1) throw new Error("visible must be a positive integer");
  if (!Number.isInteger(groupSize) || groupSize < 1) throw new Error("groupSize must be a positive integer");
  if (imageLayout !== "side" && imageLayout !== "full") throw new Error('imageLayout must be "side" or "full"');
}

function formatSectionConfig(sectionConfig, order) {
  const keys = [...order, ...Object.keys(sectionConfig).filter(k => !order.includes(k))];
  const lines = keys.map(key => {
    const c = sectionConfig[key];
    const imageLayout = c.imageLayout || "side"; // pre-imageLayout sections default to "side" (the prior unconditional behaviour)
    return `  ${key}: { title: ${JSON.stringify(c.title)}, mode: ${JSON.stringify(c.mode)}, visible: ${c.visible}, groupSize: ${c.groupSize}, imageLayout: ${JSON.stringify(imageLayout)} },`;
  });
  return `{\n${lines.join("\n")}\n}`;
}

function formatSectionOrder(order) {
  const lines = order.map(key => `  ${JSON.stringify(key)},`);
  return `[\n${lines.join("\n")}\n]`;
}

// Regenerates both blocks from the given (already-mutated) sectionConfig/
// sectionOrder, splicing each into its located span in the on-disk file text.
function writeNowData(sectionConfig, sectionOrder) {
  let text = fs.readFileSync(NOW_DATA_PATH, "utf8");

  const configSpan = findBalancedSpan(text, "export const sectionConfig", "{", "}");
  text = text.slice(0, configSpan.openIdx) + formatSectionConfig(sectionConfig, sectionOrder) + text.slice(configSpan.closeIdx + 1);

  // Re-locate sectionOrder's span in the just-spliced text -- the config
  // splice above shifted every index after it.
  const orderSpan = findBalancedSpan(text, "export const sectionOrder", "[", "]");
  text = text.slice(0, orderSpan.openIdx) + formatSectionOrder(sectionOrder) + text.slice(orderSpan.closeIdx + 1);

  fs.writeFileSync(NOW_DATA_PATH, text, "utf8");
}

module.exports = { readNowData, writeNowData, validateSectionInput, KEY_RE };
