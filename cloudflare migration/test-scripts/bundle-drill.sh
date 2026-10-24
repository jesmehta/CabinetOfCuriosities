#!/usr/bin/env bash
# History-bundle recovery drill (Codex C5/C6): verify a saved release from a clone made from a git bundle, with the
# clone's remote pointed at an unreachable address (no network use possible), and show that a shallow clone refuses.
# usage: bash "cloudflare migration/test-scripts/bundle-drill.sh" releases/<name>   (from the repository root)
set -u
REPO="$(git rev-parse --show-toplevel)"
REL="$(cd "$1" && pwd)"
S="$(mktemp -d)"
FAIL=0
echo "== bundle drill  $(date -u +%FT%TZ)  (repository HEAD $(git -C "$REPO" rev-parse --short HEAD); release $(basename "$REL"), source $(sed -n 's/^source_commit: //p' "$REL/SOURCE.txt" | cut -c1-7))"
git -C "$REPO" bundle create "$S/history.bundle" --all 2>/dev/null && echo "bundle: $(du -h "$S/history.bundle" | cut -f1)"
git clone -q "$S/history.bundle" "$S/from-bundle" && git -C "$S/from-bundle" remote set-url origin https://invalid.invalid/none.git
echo "clone from bundle at $(git -C "$S/from-bundle" rev-parse --short HEAD); remote: $(git -C "$S/from-bundle" remote get-url origin)"
if (cd "$S/from-bundle" && GIT_TERMINAL_PROMPT=0 node tools/verify-artifact.mjs "$REL"); then echo "PASS  verify from the bundle clone (no network)"; else echo "FAIL  verify from the bundle clone"; FAIL=1; fi
git clone -q --depth 1 "file://$REPO" "$S/shallow" 2>/dev/null
out=$(cd "$S/shallow" && node tools/verify-artifact.mjs "$REL" 2>&1); rc=$?
if [ $rc -ne 0 ] && echo "$out" | grep -q "cannot read content/external-repos.tsv at the release's source commit"; then echo "PASS  shallow clone refuses: ${out:0:160}"; else echo "FAIL  shallow clone did not refuse as documented (exit $rc)"; FAIL=1; fi
rm -rf "${S:?}"
echo "== $([ $FAIL -eq 0 ] && echo passed || echo FAILED)"
[ $FAIL -eq 0 ] || exit 1
