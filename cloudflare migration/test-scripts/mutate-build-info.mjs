// mutate-build-info.mjs <BUILD-INFO.json> <case> -- helper for artifact-tests.sh: rewrite a release's provenance
// record in one specific wrong way. "+fix" cases recompute externalCount/externalsDigest afterwards, so the
// deeper checks (schema, duplicates, file counts) are exercised, not just the digest.
import { readFileSync, writeFileSync } from "node:fs";
import { externalsDigest } from "../../tools/build-info.mjs";
const [file, kind] = process.argv.slice(2);
const j = JSON.parse(readFileSync(file, "utf8"));
const fix = () => { j.externalCount = j.externals.length; j.externalsDigest = externalsDigest(j.externals); };
switch (kind) {
  case "development-true": j.development = true; break;
  case "development-missing": delete j.development; break;
  case "no-source-commit": delete j.sourceCommit; break;
  case "short-source-commit": j.sourceCommit = j.sourceCommit.slice(0, 7); break;
  case "externals-empty": j.externals = []; fix(); break;
  case "drop-one-record": j.externals.pop(); break;                                  // count/digest now stale
  case "drop-one-record+count": j.externals.pop(); j.externalCount = j.externals.length; break; // digest stale
  case "drop-one-record+fix": j.externals.pop(); fix(); break;                        // self-consistent truncation: caught only by the source-commit comparison
  case "missing-repository+fix": delete j.externals[0].repository; fix(); break;
  case "short-revision+fix": j.externals[0].revision = "a".repeat(39); fix(); break;
  case "unpinned-source+fix": j.externals[0].source = "local"; fix(); break;
  case "duplicate-id+fix": j.externals[1].id = j.externals[0].id; fix(); break;
  case "wrong-file-count+fix": j.externals[0].files += 1; fix(); break;
  case "wrong-destination+fix": j.externals[0].destination = "teaching/not-there"; fix(); break;
  case "edited-revision": j.externals[0].revision = "b".repeat(40); break;            // digest stale
  case "edited-revision+fix": j.externals[0].revision = "b".repeat(40); fix(); break; // self-consistent: source-commit comparison
  default: throw new Error("unknown case " + kind);
}
writeFileSync(file, JSON.stringify(j, null, 2));
