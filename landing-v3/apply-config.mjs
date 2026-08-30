// Applies islands-tool.html's "Copy config" output back into
// cabinet-v3-data.js -- the manual-run half of the #32 rework
// (2026-08-30). Workflow:
//
//   1. Click "Copy config" in the dev panel (islands-tool.html).
//   2. Paste the clipboard contents into landing-v3/pasted-config.json
//      (gitignored -- scratch, discarded after use).
//   3. From landing-v3/, run:
//
//        node apply-config.mjs
//
// Deliberately NOT a whole-block replace: cabinet-v3-data.js's tunable
// sections (pack/island/flow/particles/geo/themePreview/colors/fonts)
// carry real, hand-written reasoning as inline comments (see
// documentation/landing-v3-notes/cabinet-v3-config-reference.md for a
// consolidated copy of all of it) -- a blind "replace everything between
// { and }" would silently delete that history. Instead, for each
// top-level section present in the pasted JSON, this finds that
// section's own brace-matched region in the source text, then replaces
// ONLY the value token on each leaf key's own line, leaving every
// surrounding comment (whatever kind) exactly where it sits. Recurses
// into nested objects (colors/fonts are keyed by theme name one level
// deeper than pack/island/etc's flat key: value shape), narrowing to
// each level's own brace-matched region before touching anything inside
// it -- needed so e.g. two different themes each having their own
// "--v3-ink" key can never cross-match each other.
//
// Assumes the same one-key-per-line style cabinet-v3-data.js already
// uses throughout: `  keyName: <value>,` (or no trailing comma for the
// last key in a block), value never wrapping onto a second line, object
// keys that aren't valid bare identifiers (e.g. "--v3-sea-deep",
// "medieval-map") always double-quoted. True for every field this script
// currently touches; if a future field's value ever needs to span
// multiple lines, this script needs to change with it, not paper over a
// mismatch.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pastedPath = path.join(__dirname, "pasted-config.json");
const dataPath = path.join(__dirname, "shared", "cabinet-v3-data.js");

let pastedRaw;
try {
  pastedRaw = await readFile(pastedPath, "utf8");
} catch {
  console.error(
    `Couldn't read ${pastedPath}.\n` +
    "Paste \"Copy config\"'s clipboard output into that file first (see this script's own header comment)."
  );
  process.exit(1);
}

let pasted;
try {
  pasted = JSON.parse(pastedRaw);
} catch (e) {
  console.error(`${pastedPath} isn't valid JSON: ${e.message}`);
  process.exit(1);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Finds `\n  <key>: {` (key optionally double-quoted, e.g. "medieval-map"
// -- required in real JS source for any key that isn't a valid bare
// identifier) then walks forward counting only { / } (arrays' [ / ] don't
// affect nesting depth here) until depth returns to 0 -- that closing
// brace is the key's own end. Returns {start, end} as offsets of the
// region STRICTLY BETWEEN the key's own { and its matching }.
function findBraceRegion(text, key) {
  const headerRe = new RegExp(`\\n([ \\t]*)"?${escapeRegExp(key)}"?:\\s*\\{`);
  const m = headerRe.exec(text);
  if (!m) return null;
  const braceStart = m.index + m[0].length; // just past the opening {
  let depth = 1;
  let i = braceStart;
  for (; i < text.length && depth > 0; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") depth--;
  }
  if (depth !== 0) return null; // unbalanced -- bail rather than guess
  return { start: braceStart, end: i - 1 };
}

// Formats a JS value the same way cabinet-v3-data.js already writes it:
// JSON.stringify covers numbers/strings/booleans/arrays-of-those
// correctly as-is (double-quoted strings match the source's own style);
// the only adjustment is a space after each array comma, matching the
// source's "[-1.38, -1.04, -0.88, -0.8]" spacing instead of
// JSON.stringify's compact "[-1.38,-1.04,-0.88,-0.8]".
function formatValue(value) {
  const json = JSON.stringify(value);
  return Array.isArray(value) ? json.replace(/,/g, ", ") : json;
}

// Replaces ONE leaf key's value on its own line within `text` (already
// narrowed to the immediate parent object's own brace-matched region).
// The quote-or-not styling around the key (backreference \2) is captured
// and reproduced exactly rather than assumed, so a bare "cellSize" key
// and a quoted "--v3-sea-deep" key both round-trip in whatever form they
// were already written. [ \t] (never \s) throughout -- \s also matches
// \n, and a greedy [ \t\n]* before the line-anchored $ can backtrack
// across the newline looking for a LATER line's own $ to match against;
// for a block's last key (nothing but a lone closing brace on the next
// line), that fused the brace onto this line instead of stopping at its
// own. Caught by testing against a scratch copy before this ever ran
// against the real file (pack.centerBias/themePreview.blurPx, both
// last-in-block, both corrupted by an earlier [\s*$] version of this).
function replaceLeafLine(text, key, formattedValue) {
  const lineRe = new RegExp(`^([ \\t]*)("?)${escapeRegExp(key)}\\2(:[ \\t]*)([^\\n]+?)(,?)[ \\t]*$`, "m");
  const lm = lineRe.exec(text);
  if (!lm) return { text, found: false, changed: false };
  // Safety net for the "multiple keys crammed on one line" class of bug
  // (caught once already, on fonts, before this landed anywhere near the
  // real file): with no \n to bound it, [^\n]+? has nothing to stop it
  // short of the true end of that (possibly very long, multi-key) line,
  // so it can swallow a sibling key entirely. If what got captured as
  // "the value" itself looks like it contains another `key:` pattern,
  // refuse rather than silently corrupt -- surfacing this as a warning
  // means whoever wrote that data one day gets told to split it onto
  // separate lines, not a mangled file nobody notices until it fails to
  // load.
  if (/,\s*[A-Za-z_$][\w$]*\s*:|,\s*"[^"]+"\s*:/.test(lm[4])) {
    return { text, found: "ambiguous", changed: false };
  }
  if (lm[4] === formattedValue) return { text, found: true, changed: false };
  const replacement = `${lm[1]}${lm[2]}${key}${lm[2]}${lm[3]}${formattedValue}${lm[5]}`;
  const newText = text.slice(0, lm.index) + replacement + text.slice(lm.index + lm[0].length);
  return { text: newText, found: true, changed: true };
}

// Recursively applies `obj` onto `regionText` (already narrowed to obj's
// OWN parent brace region). A nested plain-object value (colors/fonts'
// per-theme sub-objects) gets its own brace region found and recursed
// into; anything else (number/string/boolean/array) is a leaf, replaced
// via replaceLeafLine(). Returns the possibly-modified text plus a count
// of real leaf changes applied anywhere within (including nested), so a
// no-op section/theme never gets spliced back in at all.
function applyObject(regionText, obj, pathLabel, warnings) {
  let text = regionText;
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    const label = `${pathLabel}.${key}`;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const region = findBraceRegion(text, key);
      if (!region) {
        warnings.push(`couldn't find "${label}: {" in cabinet-v3-data.js -- skipped entirely.`);
        continue;
      }
      const inner = text.slice(region.start, region.end);
      const sub = applyObject(inner, value, label, warnings);
      if (sub.count > 0) {
        text = text.slice(0, region.start) + sub.text + text.slice(region.end);
        count += sub.count;
      }
    } else {
      const result = replaceLeafLine(text, key, formatValue(value));
      if (result.found === "ambiguous") {
        warnings.push(`"${label}"'s line has more than one key crammed onto it (no newline to safely bound the match) -- skipped rather than risk corrupting a sibling key. Reformat that block to one key per line in cabinet-v3-data.js, then re-run.`);
        continue;
      }
      if (!result.found) {
        warnings.push(`"${label}" is in the pasted JSON but no such line exists in cabinet-v3-data.js -- skipped (typo, or a genuinely new field that needs adding by hand once).`);
        continue;
      }
      if (result.changed) {
        text = result.text;
        count++;
      }
    }
  }
  return { text, count };
}

let source = await readFile(dataPath, "utf8");
let sectionsApplied = 0;
let keysApplied = 0;
const warnings = [];

for (const [sectionKey, sectionValue] of Object.entries(pasted)) {
  if (typeof sectionValue !== "object" || sectionValue === null || Array.isArray(sectionValue)) {
    warnings.push(`top-level "${sectionKey}" isn't an object -- skipped (expected one of pack/island/flow/particles/geo/themePreview/colors/fonts).`);
    continue;
  }
  const region = findBraceRegion(source, sectionKey);
  if (!region) {
    warnings.push(`couldn't find "${sectionKey}: {" in cabinet-v3-data.js (typo, or a section this script doesn't know about yet) -- skipped entirely.`);
    continue;
  }
  const inner = source.slice(region.start, region.end);
  const result = applyObject(inner, sectionValue, sectionKey, warnings);
  if (result.count > 0) {
    source = source.slice(0, region.start) + result.text + source.slice(region.end);
    sectionsApplied++;
    keysApplied += result.count;
  }
}

if (keysApplied > 0) {
  await writeFile(dataPath, source, "utf8");
}

console.log(`Applied ${keysApplied} changed value(s) across ${sectionsApplied} top-level section(s) to ${path.relative(__dirname, dataPath)}.`);
if (warnings.length) {
  console.log("\nWarnings (nothing below was applied):");
  warnings.forEach(w => console.log(`  - ${w}`));
}
console.log(`\nRe-run "node build-static.mjs" if this should also reach the production page.`);
