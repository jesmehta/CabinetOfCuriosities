// classify-d6d7.mjs -- explain every changed file between two builds (before/after site_url + root-relative nav).
//   node classify-d6d7.mjs <before-public> <after-public> <compare-manifests output>
// Each changed HTML file is diffed line by line (Myers-free: lines removed vs added as multisets). Every changed
// line must fall in a known category, otherwise it is reported as UNEXPLAINED.
import fs from "node:fs";
import path from "node:path";
const [A, B, CMP] = process.argv.slice(2);
const changed = fs.readFileSync(CMP, "utf8").split("\nCHANGED")[1].split("\n\n")[0].split("\n").slice(1).map((l) => l.trim()).filter(Boolean);
const cats = {};
const unexplained = [];
const count = (c) => (cats[c] = (cats[c] || 0) + 1);
for (const f of changed) {
  if (f === "sitemap.xml") { count("sitemap.xml regenerated with URLs (D6)"); continue; }
  const a = fs.readFileSync(path.join(A, f), "utf8").split("\n"), b = fs.readFileSync(path.join(B, f), "utf8").split("\n");
  const bag = new Map(); for (const l of a) bag.set(l, (bag.get(l) || 0) + 1);
  const added = []; for (const l of b) { if (bag.get(l)) bag.set(l, bag.get(l) - 1); else added.push(l); }
  const removed = []; for (const [l, n] of bag) for (let i = 0; i < n; i++) removed.push(l);
  for (const l of added) {
    if (/<link rel="canonical" href="https:\/\/cabinetofcuriosities\.in\//.test(l)) count("added: canonical link (D6)");
    else if (/href="\/(teaching|swatch-fields|tracery-bots)\//.test(l) && removed.some((r) => r.replace(/https:\/\/cabinetofcuriosities\.in\//g, "/") === l)) count("nav link full-domain -> root-relative (D7)");
    else if (/href="https:\/\/cabinetofcuriosities\.in\/[^"]*"/.test(l)) count("added: absolute self-domain URL from site_url (D6), e.g. 404 page assets");
    else if (l.trim() === "" && added.some((x) => /rel="canonical"/.test(x))) count("added: whitespace line emitted with the canonical link (theme template)");
    else unexplained.push(`${f} +${l.trim().slice(0, 160)}`);
  }
  for (const l of removed) {
    if (/https:\/\/cabinetofcuriosities\.in\/(teaching|swatch-fields|tracery-bots)\//.test(l) && added.some((x) => l.replace(/https:\/\/cabinetofcuriosities\.in\//g, "/") === x)) continue; // counted above
    if (/(href|src)="(\.\.\/|\/)?[^"]*"/.test(l) && added.some((x) => /cabinetofcuriosities\.in/.test(x) && x.replace(/https:\/\/cabinetofcuriosities\.in\//g, "/").replace(/(href|src)="\//g, '$1="') === l.replace(/(href|src)="(\.\.\/)+/g, '$1="').replace(/(href|src)="\//g, '$1="'))) continue;
    unexplained.push(`${f} -${l.trim().slice(0, 160)}`);
  }
}
console.log(`changed files: ${changed.length}`);
for (const [c, n] of Object.entries(cats)) console.log(`  ${n}\t${c}`);
console.log(`\nUNEXPLAINED changed lines (${unexplained.length}):`);
unexplained.forEach((u) => console.log("  " + u));
