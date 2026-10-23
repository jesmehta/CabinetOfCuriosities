#!/usr/bin/env bash
# Cabinet rejection tests (plan v3.1 tests 4 and 4b): external mounts (pins, allowlists, cache), archive allowlist,
# publication check, guards, sitemap, development boundary. Every test runs in ONE disposable clean clone of the
# committed HEAD (never the working tree: the owner's uncommitted files stay out), reset with git between tests.
# Mount-only tests run tools/external-mounts.mjs alone (no MkDocs); the rest run the full build.
# usage: bash "cloudflare migration/test-scripts/reject-tests.sh"   (from the repository root; needs network once)
set -u
REPO="$(git rev-parse --show-toplevel)"
S="$(mktemp -d)"
T="${S:?}/cab-reject"
export PYTHON="${PYTHON:-$REPO/.venv/Scripts/python.exe}"
PASS=0; FAIL=0; SKIP=0
SSD_OLD=896c1264673cf47f204af3f49391c7018a962747      # SSD_Student_Work, 2026-09-24 (still has a later-removed project)

git clone -q -c core.autocrlf=false "$REPO" "$T" || exit 1
mkdir -p "$T/_external"; cp -r "$REPO/_external/git" "$T/_external/" 2>/dev/null   # warm cache (a copy; the real one is never touched)
reset() { git -C "$T" checkout -q -- . && git -C "$T" clean -q -fd -e _external; rm -rf "$T/public" "$T/m-out"; }
mounts() { (cd "$T" && node tools/external-mounts.mjs --public-dir m-out "$@" 2>&1); }
build() { (cd "$T" && node tools/build-site.mjs --offline "$@" 2>&1); }
# Newly listed files are not in the blob-less cache yet, so tests that list one need network (no --offline).
build_net() { (cd "$T" && node tools/build-site.mjs "$@" 2>&1); }
bn_fail() { local out rc; out=$(build_net "${@:3}"); rc=$?; check "$1" fail "$2" "$out" $rc; echo "$out" | grep -A2 "FAILED" | head -3 | sed 's/^/        /'; }
check() { # check <label> <fail|ok> <pattern> <output> <rc>
  if { [ "$2" = fail ] && [ "$5" -ne 0 ]; } || { [ "$2" = ok ] && [ "$5" -eq 0 ]; }; then
    if echo "$4" | grep -q -- "$3"; then echo "PASS  $1"; PASS=$((PASS+1)); return; fi
  fi
  echo "FAIL  $1 (exit $5)"; FAIL=$((FAIL+1)); echo "$4" | tail -4 | sed 's/^/        /'
}
m_fail() { local out rc; out=$(mounts "${@:3}"); rc=$?; check "$1" fail "$2" "$out" $rc; echo "$out" | grep -m1 "FAILED" | sed 's/^/        /'; }
m_ok()   { local out rc; out=$(mounts "${@:3}"); rc=$?; check "$1" ok "$2" "$out" $rc; }
b_fail() { local out rc; out=$(build "${@:3}"); rc=$?; check "$1" fail "$2" "$out" $rc; echo "$out" | grep -A2 "FAILED" | head -3 | sed 's/^/        /'; }
b_ok()   { local out rc; out=$(build "${@:3}"); rc=$?; check "$1" ok "$2" "$out" $rc; }
AL="$T/content/external-allowlists"
TSV="$T/content/external-repos.tsv"
setcol() { # setcol <id> <column-number> <value>   (edit one TSV cell)
  awk -F'\t' -v OFS='\t' -v id="$1" -v c="$2" -v v="$3" '$1==id{$c=v}1' "$TSV" > "$TSV.tmp" && mv "$TSV.tmp" "$TSV"; }

echo "== Cabinet rejection tests  $(date -u +%FT%TZ)  (HEAD $(git -C "$REPO" rev-parse --short HEAD))"
echo "-- controls"
reset; m_ok   "control: all mounts assemble offline from the warm cache"   "external mounts: 8 assembled" --offline
reset; m_ok   "unlisted files are omitted and reported, not a failure"     "tracery-bots: 13 file(s).*43 unlisted" --offline
echo "-- pins (content/external-repos.tsv)"
reset; setcol prompt-generator 4 "";                                         m_fail "unpinned active row"            "revision is required"
reset; setcol prompt-generator 4 "5532f306";                                 m_fail "short revision"                 "full 40-character"
reset; setcol prompt-generator 4 "0123456789abcdef0123456789abcdef01234567"; m_fail "revision not on GitHub"         "could not fetch this commit"
reset; setcol prompt-generator 4 "0123456789abcdef0123456789abcdef01234567"; m_fail "unknown revision, offline"      "not in the cache and --offline" --offline
reset; setcol tracery-bots 6 "teaching/working-with-ai/bots";                m_fail "destination inside another"     "lies inside"
reset; mkdir -p "$T/m-out/swatch-fields";                                    m_fail "destination already exists (collision)" "already exists before assembly" --offline
reset; setcol ssd-creative-coding-2025-26 4 "$SSD_OLD"
out=$(mounts); rc=$?
check "two revisions of one repository are fetched and used separately" ok "ssd-creative-coding-2025-26: .*SSD_Student_Work@896c1264" "$out" $rc
echo "$out" | grep -q "ssd-creative-coding-2024-25: .*SSD_Student_Work@45be517c" && { echo "PASS    ... and the other rows keep 45be517c"; PASS=$((PASS+1)); } || { echo "FAIL    ... other rows"; FAIL=$((FAIL+1)); }
B=$(git -C "$T/_external/git/jesmehta__SSD_Student_Work.git" cat-file blob "$SSD_OLD:ssd-creative-coding-2025-26/script.js" | sha256sum | cut -c1-64)
P=$(sha256sum "$T/m-out/teaching/ssd-creative-coding-2025-26/script.js" | cut -c1-64)
[ "$B" = "$P" ] && { echo "PASS    ... 2025-26 bytes are the old revision's blob"; PASS=$((PASS+1)); } || { echo "FAIL    ... 2025-26 bytes"; FAIL=$((FAIL+1)); }
echo "-- allowlists (content/external-allowlists/<id>.txt)"
reset; echo "nope.js" >> "$AL/prompt-generator.txt";                         m_fail "listed file missing at the pin"  "not found in the source" --offline
reset; echo "STYLE.CSS" >> "$AL/prompt-generator.txt"; sed -i '/^style.css$/d' "$AL/prompt-generator.txt"
                                                                             m_fail "letter case differs"            "letter case differs" --offline
reset; rm "$AL/oblique-strategies.txt";                                      m_fail "allowlist absent"               "allowlist not found" --offline
reset; printf '# only comments\n\n' > "$AL/oblique-strategies.txt";         m_fail "allowlist lists nothing"        "lists no files" --offline
reset; echo "/etc/passwd" >> "$AL/prompt-generator.txt";                     m_fail "absolute path"                  "absolute paths not allowed" --offline
reset; echo "C:/Windows/win.ini" >> "$AL/prompt-generator.txt";              m_fail "absolute path (drive letter)"   "absolute paths not allowed" --offline
reset; echo "../ObliqueStrategies/index.html" >> "$AL/prompt-generator.txt"; m_fail "'..' escape"                    "'..'" --offline
reset; echo "*.js" >> "$AL/prompt-generator.txt";                            m_fail "wildcard"                       "wildcards not allowed" --offline
reset; echo "assets" >> "$AL/swatch-fields.txt";                             m_fail "folder entry"                   "is a folder" --offline
reset; echo "assets/" >> "$AL/swatch-fields.txt";                            m_fail "folder entry with slash"        "empty path parts and folders" --offline
reset; printf 'mosaic\\mosaic.js\n' >> "$AL/swatch-fields.txt";              m_fail "backslash"                      "use forward slashes" --offline
reset; echo "app.js" >> "$AL/prompt-generator.txt";                          m_fail "listed twice"                   "listed twice" --offline
reset; echo "App.js" >> "$AL/prompt-generator.txt";                          m_fail "listed twice, letter case only" "only in letter case" --offline
reset; sed -i '/^app.js$/d' "$AL/prompt-generator.txt";                      m_fail "required file not listed"       "required file \"app.js\" is not in its allowlist" --offline
echo "-- cache (_external/git)"
reset; mv "$T/_external" "$T/_external.bak"
                                                                             m_fail "empty cache, offline"           "not in the cache" --offline
rm -rf "$T/_external"; mkdir -p "$T/_external/git/jesmehta__ObliqueStrategies.git"; echo x > "$T/_external/git/jesmehta__ObliqueStrategies.git/README"
                                                                             m_fail "foreign folder in the cache is refused, not repaired" "is not a cache of"
[ -f "$T/_external/git/jesmehta__ObliqueStrategies.git/README" ] && { echo "PASS    ... and it was left untouched"; PASS=$((PASS+1)); } || { echo "FAIL    ... it was modified"; FAIL=$((FAIL+1)); }
rm -rf "$T/_external"; mv "$T/_external.bak" "$T/_external"
# An edited working copy can never be published under the pin: the cache has no working copy, and a stray clone
# (e.g. the retired assembler's _external/<id>/) is never read.
reset; git clone -q --depth 1 https://github.com/jesmehta/TraceryBots.git "$T/_external/tracery-bots" && echo "<!-- tampered -->" >> "$T/_external/tracery-bots/index.html"
mounts --offline > /dev/null
B=$(git -C "$T/_external/git/jesmehta__TraceryBots.git" cat-file blob 2e18cd6ee075b1403cd2bea0dff6a66f8e3ede12:index.html | sha256sum | cut -c1-64)
P=$(sha256sum "$T/m-out/tracery-bots/index.html" | cut -c1-64)
[ "$B" = "$P" ] && ! grep -q tampered "$T/m-out/tracery-bots/index.html" && { echo "PASS  edited working copy at the same HEAD is not published (pinned blob is)"; PASS=$((PASS+1)); } || { echo "FAIL  edited working copy"; FAIL=$((FAIL+1)); }
rm -rf "$T/_external/tracery-bots"
echo "-- development override (--external-local)"
reset; mkdir -p "$S/dev-oblique"
git -C "$T/_external/git/jesmehta__ObliqueStrategies.git" archive bb5ca3be3fedb2006de3d0cea3f268f771c57aa3 | tar -C "$S/dev-oblique" -xf -
echo "<!-- local edit -->" >> "$S/dev-oblique/index.html"
                                                                             m_ok   "--external-local builds from the folder, marked LOCAL" "oblique-strategies: .*LOCAL" --offline --external-local "oblique-strategies=$S/dev-oblique"
grep -q "local edit" "$T/m-out/teaching/oblique-strategies/index.html" && { echo "PASS    ... with the local edit"; PASS=$((PASS+1)); } || { echo "FAIL    ... local edit missing"; FAIL=$((FAIL+1)); }
reset; m_fail "--external-local with an unknown id" "no active row with that id" --offline --external-local "nope=$S/dev-oblique"
if MSYS=winsymlinks:nativestrict ln -s "$S/dev-oblique/LICENSE" "$S/dev-oblique/link.html" 2>/dev/null && [ -L "$S/dev-oblique/link.html" ]; then
  reset; echo "link.html" >> "$AL/oblique-strategies.txt";                  m_fail "listed symlink (local folder)"  "symlink not allowed" --offline --external-local "oblique-strategies=$S/dev-oblique"
else
  echo "SKIP  listed symlink (this Windows account cannot create native symlinks; code review only)"; SKIP=$((SKIP+1))
fi
echo "  (repository symlink / submodule / .gitattributes / LFS pointer cases: no such source exists; code review only)"; SKIP=$((SKIP+1))
echo "-- archive (content/archive-allowlist.txt), full build"
reset; rm "$T/archived-landing-pages/v1/js/extra.js";                        b_fail "archive: listed file missing"   "not found in the source"
reset; echo "v1/*.html" >> "$T/content/archive-allowlist.txt";                b_fail "archive: wildcard"              "wildcards not allowed"
reset; rm "$T/content/archive-allowlist.txt";                                 b_fail "archive: allowlist absent"      "allowlist not found"
reset; echo "v2" >> "$T/content/archive-allowlist.txt";                       b_fail "archive: folder entry"          "not a regular file"
reset; echo "README.md" >> "$T/content/archive-allowlist.txt";                b_fail "archive: listed .md caught by the publication check" "file type never published"
reset; echo "x" > "$T/archived-landing-pages/new-note.txt";                   b_ok   "archive: unlisted file omitted and reported" "archive: 159 file(s).*10 unlisted"
echo "-- guards, collisions, publication check, sitemap"
reset; printf '# x\n' > "$T/docs/index.md";                                   b_fail "docs/index.md guard"            "docs/index.md must not exist"
reset; sed -i 's/\tGolden Age SciFi\t/\tGolden Age SciFi (renamed)\t/' "$T/content/cabinet-entries.tsv"
                                                                             b_fail "TSV edited, generated data not regenerated" "out of date"
reset; mkdir -p "$T/docs/swatch-fields"; printf '# x\n' > "$T/docs/swatch-fields/index.md"
                                                                             b_fail "MkDocs page collides with a mount"  "already exists before assembly"
reset; echo "working-with-ai/DOCUMENTATION.md" >> "$AL/working-with-ai.txt"; bn_fail "listed .md in a mount caught by the publication check" "file type never published"
reset; echo ".gitignore" >> "$AL/tracery-bots.txt";                          bn_fail "listed dotfile caught by the publication check" "private file"
reset; sed -i '/^site_url:/d' "$T/mkdocs.yml";                                b_fail "no site_url"                    "site_url"
echo "== $PASS passed, $FAIL failed, $SKIP skipped (code review)"
rm -rf "${S:?}"
[ "$FAIL" -eq 0 ] || exit 1
