#!/usr/bin/env bash
# Release boundary tests (plan test 4b; Codex C4 I2): save-artifact / verify-artifact on a disposable clean clone.
#   - a pinned build saves and verifies;
#   - a DEVELOPMENT build (--external-local) cannot be saved;
#   - verify refuses checksum-valid releases whose BUILD-INFO.json is missing, development, incomplete, truncated,
#     edited or inconsistent with the site or with the release's own source commit (mutate-build-info.mjs);
#   - verify refuses a tampered site file (checksums);
#   - save refuses public/ built from another commit, or edited after the build.
# usage: bash "cloudflare migration/test-scripts/artifact-tests.sh"   (from the repository root)
set -u
REPO="$(git rev-parse --show-toplevel)"
HERE="$REPO/cloudflare migration/test-scripts"
S="$(mktemp -d)"
T="${S:?}/cab-artifact"
export PYTHON="${PYTHON:-$REPO/.venv/Scripts/python.exe}"
PASS=0; FAIL=0
ok()  { echo "PASS  $1"; PASS=$((PASS+1)); }
bad() { echo "FAIL  $1"; FAIL=$((FAIL+1)); }
expect() { # expect <ok|fail> <label> <pattern> <command...>
  local want=$1 label=$2 pat=$3; shift 3
  local out rc; out=$("$@" 2>&1); rc=$?
  if { [ "$want" = ok ] && [ $rc -eq 0 ]; } || { [ "$want" = fail ] && [ $rc -ne 0 ]; }; then
    echo "$out" | grep -q -- "$pat" && { ok "$label"; return; }
  fi
  bad "$label (exit $rc)"; echo "$out" | tail -3 | sed 's/^/        /'
}
echo "== Cabinet artifact tests  $(date -u +%FT%TZ)  (HEAD $(git -C "$REPO" rev-parse --short HEAD))"
git clone -q -c core.autocrlf=false "$REPO" "$T" || exit 1
mkdir -p "$T/_external" && cp -r "$REPO/_external/git" "$T/_external/"
cd "$T" || exit 1
node tools/build-site.mjs --offline > "$S/build.log" 2>&1 || { bad "pinned build"; tail -5 "$S/build.log"; exit 1; }
out=$(node tools/save-artifact.mjs 2>&1); R=$(echo "$out" | sed -n 's/^Saved artifact: //p')
[ -n "$R" ] && ok "save a pinned build: $R" || { bad "save: $out"; exit 1; }
expect ok   "verify the saved release"                       "pinned build of"                          node tools/verify-artifact.mjs "$R"

echo "-- provenance (BUILD-INFO.json) variants of a checksum-valid release"
variant() { # variant <case> <pattern>
  rm -rf "$S/v"; cp -r "$R" "$S/v"
  node "$HERE/mutate-build-info.mjs" "$S/v/BUILD-INFO.json" "$1"
  expect fail "verify refuses: $1" "$2" node tools/verify-artifact.mjs "$S/v"
}
variant development-true           "DEVELOPMENT build"
variant development-missing        "DEVELOPMENT build"
variant no-source-commit           "sourceCommit must be a full commit SHA"
variant short-source-commit        "sourceCommit must be a full commit SHA"
variant externals-empty            "externals is missing or empty"
variant drop-one-record            "externalCount"
variant drop-one-record+count      "externalsDigest does not match"
variant drop-one-record+fix        "active external mount"
variant missing-repository+fix     "repository is missing or invalid"
variant short-revision+fix         "revision must be a full commit SHA"
variant unpinned-source+fix        "does not come from a pinned revision"
variant duplicate-id+fix           "duplicate external id"
variant wrong-file-count+fix       "the record says"
variant wrong-destination+fix      "differs from the source commit"
variant edited-revision            "externalsDigest does not match"
variant edited-revision+fix        "differs from the source commit"
rm -rf "$S/v"; cp -r "$R" "$S/v"; rm "$S/v/BUILD-INFO.json"
expect fail "verify refuses: BUILD-INFO.json missing"        "BUILD-INFO.json missing"                  node tools/verify-artifact.mjs "$S/v"
rm -rf "$S/v"; cp -r "$R" "$S/v"; echo "<!-- tampered -->" >> "$S/v/site/index.html"
expect fail "verify refuses: a site file changed after saving" "does NOT match SHA256SUMS"             node tools/verify-artifact.mjs "$S/v"

echo "-- save boundary"
echo "x" >> public/404.html
expect fail "save refuses public/ edited after the build"    "no longer matches its manifest"           node tools/save-artifact.mjs
mkdir -p "$S/dev-oblique" && git -C _external/git/jesmehta__ObliqueStrategies.git archive bb5ca3be3fedb2006de3d0cea3f268f771c57aa3 | tar -C "$S/dev-oblique" -xf -
node tools/build-site.mjs --offline --external-local "oblique-strategies=$S/dev-oblique" > "$S/dev.log" 2>&1 && grep -q "DEVELOPMENT build" "$S/dev.log" && ok "a --external-local build is marked DEVELOPMENT" || bad "development build"
expect fail "save refuses a DEVELOPMENT build"               "DEVELOPMENT build"                        node tools/save-artifact.mjs
grep -q '"deploy": "node tools/build-site.mjs && wrangler deploy"' package.json && ok "npm run deploy always rebuilds (pinned: no build arguments can be passed through it)" || bad "deploy script"
git -c user.email=scratch@local -c user.name=scratch commit -q --allow-empty -m "scratch: new HEAD"
node tools/build-site.mjs --offline > "$S/b2.log" 2>&1 && git -c user.email=scratch@local -c user.name=scratch commit -q --allow-empty -m "scratch: another"
expect fail "save refuses public/ built from an earlier commit" "but HEAD is now"                      node tools/save-artifact.mjs
echo "== $PASS passed, $FAIL failed"
cd / && rm -rf "${S:?}"
[ "$FAIL" -eq 0 ] || exit 1
