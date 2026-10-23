// compare-build-info.mjs <a/build-info.json> <b/build-info.json> -- exit 1 unless both builds record the same
// provenance: source commit, development flag, external count and digest, and every external record's id,
// repository, subfolder, revision, destination, source, files and bytes (Codex C4 I3).
import { readFileSync } from "node:fs";
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, "utf8")));
const F = ["id", "repository", "subfolder", "revision", "destination", "source", "files", "bytes"];
const key = (x) => JSON.stringify([x.sourceCommit, x.development, x.externalCount, x.externalsDigest, (x.externals || []).map((m) => F.map((f) => m[f]))]);
if (key(a) === key(b)) { console.log(`PASS  build-info provenance identical (${a.externals.length} externals, digest ${String(a.externalsDigest).slice(0, 12)}…)`); process.exit(0); }
console.log("FAIL  build-info provenance differs");
console.log("  A: " + key(a).slice(0, 300));
console.log("  B: " + key(b).slice(0, 300));
process.exit(1);
