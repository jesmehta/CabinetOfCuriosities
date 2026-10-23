// compare-manifests.mjs -- every difference between two sha256sum-format manifests, grouped.
//   node compare-manifests.mjs <baseline.sha256> <new.sha256>
import fs from "node:fs";
const read = (f) => new Map(fs.readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).map((l) => { const m = l.match(/^([0-9a-f]{64}) [ *](.+)$/); return [m[2], m[1]]; }));
const [a, b] = process.argv.slice(2).map(read);
const removed = [...a.keys()].filter((p) => !b.has(p)).sort();
const added = [...b.keys()].filter((p) => !a.has(p)).sort();
const changed = [...a.keys()].filter((p) => b.has(p) && a.get(p) !== b.get(p)).sort();
const same = [...a.keys()].filter((p) => b.get(p) === a.get(p)).length;
console.log(`baseline ${a.size} files, new ${b.size} files: ${same} identical, ${changed.length} changed, ${removed.length} removed, ${added.length} added`);
for (const [title, list] of [["CHANGED", changed], ["REMOVED", removed], ["ADDED", added]]) {
  console.log(`\n${title} (${list.length}):`);
  list.forEach((p) => console.log("  " + p));
}
