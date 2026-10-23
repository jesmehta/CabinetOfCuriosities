// reach-analysis.mjs -- allowlist candidate generator by source inspection (plan v3, I3, method 1).
//
//   node reach-analysis.mjs <mount-folder> [entry.html ...]   (default entry: index.html)
//
// Starts from the entry page(s) and follows, transitively:
//   - HTML: src=, href=, poster=, data-src=, srcset= that point to files in the folder (linked HTML pages are followed too);
//   - JS:   every string literal (quotes or plain backticks) that names an existing file, resolved against each page
//           that loads the script (browser rule) and against the script's own folder;
//   - CSS:  url(...) and @import, resolved against the CSS file.
// Prints JSON: reached files, unreached files, unreached HTML pages (each to classify: public, excluded, redirect),
// and string literals in loaded code that look like asset paths but match no file (dynamic names to check by hand).
// Method 1 only: browser capture and scenario tests (methods 2-3) must confirm before an allowlist is final.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2]);
const entries = process.argv.slice(3).length ? process.argv.slice(3) : ["index.html"];
// Libraries are reached but not mined for string literals (their docs strings name files that do not exist).
const LIBRARY = /(^|\/)(p5(\.[\w-]+)*|jquery[\w.-]*|tracery[\w.-]*|[\w.-]+\.min)\.js$/i;
const ASSET = /\.(png|jpe?g|gif|webp|svg|avif|mp3|wav|ogg|m4a|mp4|webm|json|txt|csv|js|mjs|css|html?|ttf|otf|woff2?|glb|gltf|obj|wasm|frag|vert|glsl)$/i;

const all = [];
(function walk(d, p) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const rel = p ? `${p}/${e.name}` : e.name;
    if (e.isDirectory()) walk(path.join(d, e.name), rel); else all.push(rel);
  }
})(ROOT, "");
const exists = new Set(all);
const lowerMap = new Map(all.map((f) => [f.toLowerCase(), f]));

const reached = new Set();
const caseMismatch = [];
const unresolved = new Set();
const pagesOf = new Map(); // script -> set of pages loading it
const queue = [];

function resolveRef(ref, baseDir) {
  let r = ref.trim();
  if (!r || /^(https?:|data:|blob:|mailto:|tel:|javascript:|#|\/\/)/i.test(r)) return null;
  r = r.split("#")[0].split("?")[0];
  try { r = decodeURIComponent(r); } catch {}
  if (!r) return null;
  const joined = r.startsWith("/") ? null : path.posix.normalize(path.posix.join(baseDir, r));
  if (!joined || joined.startsWith("..")) return { outside: r };
  let cand = joined.endsWith("/") || joined === "." ? path.posix.join(joined, "index.html") : joined;
  if (exists.has(cand)) return { file: cand };
  if (exists.has(cand + "/index.html")) return { file: cand + "/index.html" };
  if (lowerMap.has(cand.toLowerCase())) return { caseOf: lowerMap.get(cand.toLowerCase()), asked: cand };
  return { missing: cand };
}

function add(file, fromPage) {
  if (/\.m?js$/i.test(file) && fromPage) {
    if (!pagesOf.has(file)) pagesOf.set(file, new Set());
    const before = pagesOf.get(file).size;
    pagesOf.get(file).add(fromPage);
    if (reached.has(file) && pagesOf.get(file).size === before) return;
    reached.add(file);
    queue.push(file);
    return;
  }
  if (reached.has(file)) return;
  reached.add(file);
  queue.push(file);
}

function take(ref, baseDirs, fromPage, strict) {
  for (const b of baseDirs) {
    const r = resolveRef(ref, b);
    if (!r) return;
    if (r.file) { add(r.file, fromPage); return; }
    if (r.caseOf) { caseMismatch.push(`${r.asked} (file is ${r.caseOf})`); return; }
  }
  if (strict || ASSET.test(ref.split("?")[0])) unresolved.add(`${ref}  [from ${fromPage || "?"}]`);
}

for (const e of entries) add(e, null);
while (queue.length) {
  const file = queue.shift();
  const dir = path.posix.dirname(file) === "." ? "" : path.posix.dirname(file);
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  if (/\.html?$/i.test(file)) {
    for (const m of text.matchAll(/\b(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']/gi)) take(m[1], [dir], file, true);
    for (const m of text.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) for (const part of m[1].split(",")) take(part.trim().split(/\s+/)[0], [dir], file, true);
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) take(m[1], [dir], file, true);
    // inline scripts: string literals
    for (const s of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) for (const m of s[1].matchAll(/(["'`])((?:(?!\1)[^\\\n$]|\\.)*?)\1/g)) take(m[2], [dir], file, false);
  } else if (/\.m?js$/i.test(file) && !LIBRARY.test(file)) {
    const pages = [...(pagesOf.get(file) || [])];
    const bases = [...new Set([...pages.map((p) => (path.posix.dirname(p) === "." ? "" : path.posix.dirname(p))), dir])];
    for (const m of text.matchAll(/(["'`])((?:(?!\1)[^\\\n$]|\\.)*?)\1/g)) take(m[2], bases, pages[0] || file, false);
  } else if (/\.css$/i.test(file)) {
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) take(m[1], [dir], file, true);
    for (const m of text.matchAll(/@import\s+["']([^"']+)["']/gi)) take(m[1], [dir], file, true);
  }
}

const unreached = all.filter((f) => !reached.has(f)).sort();
console.log(JSON.stringify({
  root: ROOT,
  total: all.length,
  reached: reached.size,
  unreachedHtml: unreached.filter((f) => /\.html?$/i.test(f)),
  unreached,
  caseMismatch: [...new Set(caseMismatch)].sort(),
  unresolved: [...unresolved].sort(),
  reachedList: [...reached].sort(),
}, null, 2));
