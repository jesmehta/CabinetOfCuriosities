#!/usr/bin/env bash
# Authoring test (plan v3.1 test 7) in a DISPOSABLE clone with its own fresh .venv. The servers are started
# through the launchers from another working folder, with a PATH that has only Windows and Node (no global
# Python/MkDocs), so anything Python can only work through the clone's own .venv. Negative control: the admin
# dashboard started directly (no .venv) must fail its MkDocs check.
# Covers: admin dashboard (MkDocs check, cabinet/now content generation, site map with sibling clones of FFFX and
# Bookshelf), Cabinet editor (add / edit / regenerate / delete an entry), Now editor (start, regenerate),
# update-externals (report on an older pin, then restore), full builds. Ported from FFFX's cms-test.sh.
# usage: bash "cloudflare migration/test-scripts/cms-test.sh"   (Windows, from the repository root; needs network)
set -u
REPO="$(git rev-parse --show-toplevel)"
S="$(mktemp -d)"
C="${S:?}/CabinetOfCuriosities"
PASS=0; FAIL=0
ok()  { echo "PASS  $1"; PASS=$((PASS+1)); }
bad() { echo "FAIL  $1"; FAIL=$((FAIL+1)); }
NODEDIR="$(cygpath -w "$(dirname "$(command -v node)")")"
MINPATH="C:\\Windows\\System32;C:\\Windows;$NODEDIR"
ADMIN=5969; EDIT=5868; NOW=5767
J() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(eval(process.argv[1]))})' "$1"; }

echo "== Cabinet authoring test  $(date -u +%FT%TZ)  (clone of HEAD $(git -C "$REPO" rev-parse --short HEAD))"
git clone -q "$REPO" "$C" || exit 1
git clone -q "$REPO/../form-follows-fx" "$S/form-follows-fx" && git clone -q "$REPO/../TheBookshelfOfCuriosities" "$S/TheBookshelfOfCuriosities" || exit 1
mkdir -p "$C/_external" && cp -r "$REPO/_external/git" "$C/_external/"
python -m venv "$C/.venv" && "$C/.venv/Scripts/python.exe" -m pip install -q -r "$C/requirements-lock.txt" 2>&1 | grep -v "notice" || true
CW="$(cygpath -w "$C")"

wait_up() { for i in $(seq 1 60); do curl -s -o /dev/null "http://127.0.0.1:$1/admin/" && return 0; sleep 0.5; done; return 1; }
stop_port() { powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort $1 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force }" >/dev/null 2>&1; sleep 1; }
api() { curl -s -X "$1" -H 'Content-Type: application/json' ${4:+-d "$4"} "http://127.0.0.1:$2/api/$3"; }
# Windows wrappers (cmd quoting from bash is unreliable): minimal PATH, test ports, then start.
printf '@echo off\r\nset "PATH=%s"\r\nset CABINET_ADMIN_PORT=%s\r\nset CABINET_EDITOR_PORT=%s\r\nset NOW_EDITOR_PORT=%s\r\ncd /d "%%~1"\r\nnode tools\\admin-controls.js\r\n' "$MINPATH" $ADMIN $EDIT $NOW > "$S/admin-direct.cmd"
printf '@echo off\r\nset "PATH=%s"\r\nset CABINET_ADMIN_PORT=%s\r\nset CABINET_EDITOR_PORT=%s\r\nset NOW_EDITOR_PORT=%s\r\ncall "%%~1"\r\n' "$MINPATH" $ADMIN $EDIT $NOW > "$S/launch.cmd"
launch() { ( cd "$S" && cmd //c "$(cygpath -w "$S/launch.cmd")" "$CW\\$1" > "$S/$2.log" 2>&1 & ); }

echo "-- negative control"
( cd "$S" && cmd //c "$(cygpath -w "$S/admin-direct.cmd")" "$CW" > "$S/neg.log" 2>&1 & )
wait_up $ADMIN || bad "control: admin did not start"
r=$(api POST $ADMIN run/mkdocs-check)
echo "$r" | grep -q '"ok": *false' && ok "control: without .venv the MkDocs check fails (no global MkDocs reachable)" || bad "control: check unexpectedly passed: ${r:0:200}"
stop_port $ADMIN

echo "-- admin dashboard via run-admin-controls.bat (started from another folder)"
launch run-admin-controls.bat admin
wait_up $ADMIN && ok "admin dashboard started via its launcher from $(cygpath -w "$S")" || bad "admin did not start"
for job in mkdocs-check cabinet-content now-content sitemap; do
  r=$(api POST $ADMIN run/$job); echo "$r" | grep -q '"ok": *true' && ok "admin: $job" || bad "admin: $job: ${r:0:300}"
done
( cd "$C" && git status --porcelain -- docs/_assets/backend/js content > "$S/gen-status.txt" )
[ ! -s "$S/gen-status.txt" ] && ok "content generation reproduces the committed files exactly" || { bad "generation changed files"; cat "$S/gen-status.txt"; }
( cd "$C" && git diff --stat -- docs/compass/sitemap.md documentation/CONTENT-INVENTORY.md | tail -1 )
grep -q "fffx.cabinetofcuriosities.in" "$C/docs/compass/sitemap.md" && grep -q "bookshelf.cabinetofcuriosities.in" "$C/docs/compass/sitemap.md" && ok "site map lists FFFX and Bookshelf pages from the sibling clones" || bad "site map content"
( cd "$C" && git checkout -q -- docs/compass/sitemap.md documentation/CONTENT-INVENTORY.md )

echo "-- Cabinet editor via run-cabinet-editor.bat"
launch run-cabinet-editor.bat editor
wait_up $EDIT && ok "Cabinet editor started via its launcher" || bad "Cabinet editor did not start"
cp "$C/content/cabinet-entries.tsv" "$S/entries-before.tsv"
n0=$(api GET $EDIT state | J 'j.entries.length')
row=$(api GET $EDIT state | J 'JSON.stringify(Object.assign({}, (j.entries[0].row||j.entries[0]), {id:"cms-test-entry", title:"CMS test entry", href:"https://example.org/", status:"wip"}))')
r=$(api POST $EDIT entries "$row"); echo "$r" | grep -q '"ok": *true' && ok "add entry" || bad "add entry: ${r:0:300}"
idx=$(api GET $EDIT state | J 'j.entries.findIndex(e=>(e.row||e).id==="cms-test-entry")')
r=$(api PUT $EDIT "entries/$idx" '{"title":"CMS test entry (edited)"}'); echo "$r" | grep -q '"ok": *true' && ok "edit entry $idx" || bad "edit entry: ${r:0:300}"
r=$(api POST $EDIT rebuild); echo "$r" | grep -q '"ok": *true' && ok "regenerate (Rebuild)" || bad "rebuild: ${r:0:300}"
grep -q "CMS test entry (edited)" "$C/docs/_assets/backend/js/cabinet-generated-content.js" && ok "edited title is in the generated content" || bad "edited title missing"
( cd "$C" && git add -A content docs/_assets && git -c user.email=scratch@local -c user.name=scratch commit -qm "scratch: cms test entry" && node tools/build-site.mjs --offline > "$S/build1.txt" 2>&1 ) && ok "full build with the new entry: $(grep 'public/:' "$S/build1.txt" | cut -c1-40)" || { bad "build with entry"; tail -5 "$S/build1.txt"; }
r=$(api DELETE $EDIT "entries/$idx"); echo "$r" | grep -q '"ok": *true' && ok "delete entry" || bad "delete: ${r:0:300}"
r=$(api POST $EDIT rebuild); echo "$r" | grep -q '"ok": *true' && ok "regenerate after delete" || bad "rebuild 2: ${r:0:300}"
n1=$(api GET $EDIT state | J 'j.entries.length'); [ "$n0" = "$n1" ] && ok "entry count back to $n0" || bad "entry count $n0 -> $n1"
cmp -s "$S/entries-before.tsv" "$C/content/cabinet-entries.tsv" && ok "cabinet-entries.tsv byte-identical to before" || { echo "NOTE  cabinet-entries.tsv differs after add+delete:"; diff "$S/entries-before.tsv" "$C/content/cabinet-entries.tsv" | head -6 | sed 's/^/        /'; }
stop_port $EDIT

echo "-- Now editor via run-now-editor.bat"
launch run-now-editor.bat now
wait_up $NOW && ok "Now editor started via its launcher" || bad "Now editor did not start"
r=$(api GET $NOW state); echo "$r" | grep -q '"entries"' && ok "Now editor state readable" || bad "Now state: ${r:0:200}"
r=$(api POST $NOW rebuild); echo "$r" | grep -q '"ok": *true' && ok "Now regenerate" || bad "Now rebuild: ${r:0:300}"
( cd "$C" && git status --porcelain -- docs/compass/now.md docs/_assets/backend/js/now-data.js docs/_assets/backend/js/now-markdown.js > "$S/now-status.txt" )
[ ! -s "$S/now-status.txt" ] && ok "Now regeneration reproduces the committed files" || { bad "Now regeneration changed files"; cat "$S/now-status.txt"; }
stop_port $NOW; stop_port $ADMIN

echo "-- update-externals"
( cd "$C" && git checkout -q HEAD~1 -- content docs && git -c user.email=scratch@local -c user.name=scratch commit -qam "scratch: restore" )
awk -F'\t' -v OFS='\t' '$1=="tracery-bots"{$4="f916b2c2076b5af44420789c692eef67b21fd6f9"}1' "$C/content/external-repos.tsv" > "$S/t.tsv" && mv "$S/t.tsv" "$C/content/external-repos.tsv"
out=$(cd "$C" && node tools/update-externals.mjs --check 2>&1); echo "$out" | sed 's/^/        /' | head -20
echo "$out" | grep -q "tracery-bots: f916b2c2 -> 2e18cd6e" && echo "$out" | grep -q "CHANGED listed files" && ok "update-externals --check reports the older pin's changes" || bad "update-externals --check"
( cd "$C" && git diff --quiet -- content/external-repos.tsv ) && bad "--check must not write" || ok "--check wrote nothing"
out=$(cd "$C" && node tools/update-externals.mjs 2>&1)
( cd "$C" && git diff --quiet -- content/external-repos.tsv content/external-allowlists ) && ok "update-externals restored the current pin; allowlists untouched" || { bad "update-externals write"; ( cd "$C" && git diff -- content | head ); }
( cd "$C" && node tools/build-site.mjs --offline > "$S/build2.txt" 2>&1 ) && ok "full build after restore: $(grep 'public/:' "$S/build2.txt" | cut -c1-40)" || bad "build after restore"
echo "== $PASS passed, $FAIL failed"
rm -rf "${S:?}" 2>/dev/null || echo "(scratch folder left: $S)"
[ "$FAIL" -eq 0 ] || exit 1
