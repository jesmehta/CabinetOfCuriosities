// compare-live.mjs -- every file of a new build against the live site, byte by byte.
//   node compare-live.mjs <public-dir> <live-base-url> <out-dir>
// Files that differ are saved under <out-dir>/live/<path> (the live copy) so classify-d6d7.mjs can explain them.
// Also lists live URLs of the files the migration removed (from the build's comparison evidence is not needed:
// those are simply absent from the new manifest and are reported by http-check / compare-manifests).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
const [pub, base0, out] = process.argv.slice(2);
const base = base0.replace(/\/$/, "");
const manifest = readFileSync(join(pub, "..", "public-manifest.sha256"), "utf8").trim().split(/\r?\n/).map((l) => ({ sha: l.slice(0, 64), path: l.slice(66) }));
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
let same = 0;
const differ = [], missing = [];
for (let i = 0; i < manifest.length; i += 8) {
  await Promise.all(manifest.slice(i, i + 8).map(async ({ sha, path }) => {
    const r = await fetch(base + "/" + enc(path));
    const body = Buffer.from(await r.arrayBuffer());
    if (r.status !== 200) { missing.push(`${r.status} ${path}`); return; }
    if (createHash("sha256").update(body).digest("hex") === sha) { same++; return; }
    differ.push(path);
    mkdirSync(dirname(join(out, "live", path)), { recursive: true });
    writeFileSync(join(out, "live", path), body);
  }));
}
differ.sort(); missing.sort();
const report = [`new build ${manifest.length} files vs ${base}: ${same} identical, ${differ.length} differ, ${missing.length} not on live`, "", "CHANGED", ...differ, "", "NOT ON LIVE", ...missing, ""].join("\n");
writeFileSync(join(out, "compare.txt"), report.replace("CHANGED", `CHANGED (${differ.length}):`));
console.log(report.split("\n")[0]);
