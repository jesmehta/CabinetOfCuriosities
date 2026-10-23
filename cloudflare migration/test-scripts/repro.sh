#!/usr/bin/env bash
# Determinism (plan v3.1 test 2): clean clones of the committed HEAD, never the working tree.
#   A1: clone with core.autocrlf=true, EMPTY external cache -> network build
#   A2: the same clone again, now warm, --offline
#   B : clone with core.autocrlf=false, a copy of A's warm cache, --offline
# All three manifests must be identical, and A1/B must record identical provenance. Same SOURCE_DATE_EPOCH (HEAD's commit time) by default.
# usage: bash "cloudflare migration/test-scripts/repro.sh"   (from the repository root; needs network)
set -u
REPO="$(git rev-parse --show-toplevel)"
S="$(mktemp -d)"
export PYTHON="${PYTHON:-$REPO/.venv/Scripts/python.exe}"
FAIL=0
echo "== Cabinet reproducibility  $(date -u +%FT%TZ)  (HEAD $(git -C "$REPO" rev-parse --short HEAD))"
git clone -q -c core.autocrlf=true "$REPO" "$S/A" && git clone -q -c core.autocrlf=false "$REPO" "$S/B" || exit 1
t0=$(date +%s); (cd "$S/A" && node tools/build-site.mjs > build1.log 2>&1) || { echo "FAIL A1 build"; tail -5 "$S/A/build1.log"; exit 1; }
echo "A1 (autocrlf=true, empty cache, network): $(tail -1 "$S/A/build1.log" | cut -c1-60) in $(( $(date +%s) - t0 ))s"
cp "$S/A/public-manifest.sha256" "$S/A1.sha256"; cp "$S/A/build-info.json" "$S/A1-info.json"
t0=$(date +%s); (cd "$S/A" && node tools/build-site.mjs --offline > build2.log 2>&1) || { echo "FAIL A2 build"; tail -5 "$S/A/build2.log"; exit 1; }
echo "A2 (same clone, warm, --offline): $(( $(date +%s) - t0 ))s"
mkdir -p "$S/B/_external" && cp -r "$S/A/_external/git" "$S/B/_external/"
(cd "$S/B" && node tools/build-site.mjs --offline > build.log 2>&1) || { echo "FAIL B build"; tail -5 "$S/B/build.log"; exit 1; }
echo "B  (autocrlf=false, copied cache, --offline)"
for x in "A2:$S/A/public-manifest.sha256" "B:$S/B/public-manifest.sha256"; do
  if cmp -s "$S/A1.sha256" "${x#*:}"; then echo "PASS  A1 == ${x%%:*} ($(wc -l < "$S/A1.sha256") files)"; else echo "FAIL  A1 != ${x%%:*}"; diff "$S/A1.sha256" "${x#*:}" | head -5; FAIL=1; fi
done
echo "manifest sha256: $(sha256sum "$S/A1.sha256" | cut -c1-16)…"
# Test hook (failure injection, Codex C4 I3): REPRO_INJECT_PROVENANCE_MISMATCH=1 alters one revision in B's record,
# so the runner must exit 1.
if [ "${REPRO_INJECT_PROVENANCE_MISMATCH:-}" = 1 ]; then node -e 'const f=process.argv[1],j=require(f);j.externals[0].revision="0".repeat(40);require("fs").writeFileSync(f,JSON.stringify(j))' "$S/B/build-info.json"; echo "(injected: one revision changed in B)"; fi
node "$(dirname "$0")/compare-build-info.mjs" "$S/A1-info.json" "$S/B/build-info.json" || FAIL=1
echo "cache size after a cold build: $(du -sh "$S/A/_external/git" | cut -f1)"
rm -rf "${S:?}"
[ "$FAIL" -eq 0 ] || exit 1
