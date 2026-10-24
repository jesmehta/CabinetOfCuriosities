#!/usr/bin/env bash
# Redirect matrix (domain plan acceptance; Codex C6): http/https x apex/www x paths and query strings. Follows each
# chain hop by hop with curl (no -L), recording real status codes and Location headers, and checks:
#   - apex https: final 200 for real pages, 404 for an unknown path, no redirect;
#   - everything else ends at https://cabinetofcuriosities.in<same path><same query> within 2 hops, no loops.
# usage: bash redirect-matrix.sh [--resolve <ip>]   (pins both hostnames to a Cloudflare address, before DNS caches update)
set -u
APEX=cabinetofcuriosities.in; WWW=www.cabinetofcuriosities.in
RES=()
if [ "${1:-}" = "--resolve" ]; then for h in $APEX $WWW; do RES+=(--resolve "$h:80:$2" --resolve "$h:443:$2"); done; fi
PATHS=("/" "/teaching/dragons/" "/no-such-page/" "/?a=1&b=2" "/teaching/?q=a%20b&x=%2F&y=%C3%A9")
PASS=0; FAIL=0
echo "== redirect matrix  $(date -u +%FT%TZ)  ${RES[*]:+(pinned: $2)}"
for scheme in http https; do for host in $APEX $WWW; do for p in "${PATHS[@]}"; do
  url="$scheme://$host$p"; chain=""; hops=0; cur="$url"; final=""; seen=" "
  while :; do
    read -r code loc server < <(curl -s -o /dev/null "${RES[@]}" -D - "$cur" | tr -d '\r' | awk 'NR==1{c=$2} tolower($1)=="location:"{l=$2} tolower($1)=="server:"{s=$2} END{print c, (l==""?"-":l), (s==""?"-":s)}')
    chain="$chain $code"; final="$code $cur ($server)"
    [ "$loc" = "-" ] && break
    case "$seen" in *" $loc "*) chain="$chain LOOP"; break;; esac
    seen="$seen$loc "; hops=$((hops+1)); [ $hops -gt 4 ] && { chain="$chain TOO-MANY"; break; }
    case "$loc" in http*) cur="$loc";; *) cur="$scheme://$host$loc";; esac
  done
  want_code=200; [ "$p" = "/no-such-page/" ] && want_code=404
  want_url="https://$APEX$p"
  max=2; [ "$scheme$host" = "https$APEX" ] && max=0
  ok=1
  [ "${final%% *}" = "$want_code" ] || ok=0
  echo "$final" | grep -qF " $want_url " || ok=0
  [ $hops -le $max ] || ok=0
  echo "$chain" | grep -q "LOOP\|TOO-MANY" && ok=0
  if [ $ok = 1 ]; then PASS=$((PASS+1)); r=PASS; else FAIL=$((FAIL+1)); r=FAIL; fi
  printf "%s  %-62s hops=%d codes:%s  -> %s\n" "$r" "$url" "$hops" "$chain" "$final"
done; done; done
echo "== $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] || exit 1
