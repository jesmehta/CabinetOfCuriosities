#!/bin/sh
# Zone acceptance (runbook v2 step 8): resolvers, records, HTTPS + deep paths
date -u
for r in "https://cloudflare-dns.com/dns-query" "https://dns.google/resolve"; do
  for n in cabinetofcuriosities.in www.cabinetofcuriosities.in bookshelf.cabinetofcuriosities.in fffx.cabinetofcuriosities.in; do
    for t in NS A CNAME DS; do
      d=$(curl -s "$r?name=$n&type=$t" -H "accept: application/dns-json" | grep -o '"Answer":\[[^]]*\]' | grep -o '"data":"[^"]*"' | sed 's/"data"://' | sort | tr '\n' ' ')
      [ -n "$d" ] && echo "$r $n $t: $d"
    done
  done
done
echo "--- HTTPS"
for u in \
  https://cabinetofcuriosities.in/ \
  https://cabinetofcuriosities.in/teaching/ \
  https://cabinetofcuriosities.in/writings/ \
  https://cabinetofcuriosities.in/sitemap.xml \
  https://www.cabinetofcuriosities.in/ \
  https://www.cabinetofcuriosities.in/teaching/ \
  https://bookshelf.cabinetofcuriosities.in/ \
  https://bookshelf.cabinetofcuriosities.in/favorite-poems/general/kipling--if/ \
  https://bookshelf.cabinetofcuriosities.in/scifi/ \
  https://bookshelf.cabinetofcuriosities.in/asimov/ \
  https://bookshelf.cabinetofcuriosities.in/no-such-page-xyz/ \
  https://fffx.cabinetofcuriosities.in/ \
  https://fffx.cabinetofcuriosities.in/deep-studies/100-gradients/ \
  https://fffx.cabinetofcuriosities.in/genuary/genuary-2024/ ; do
  curl -sS -o /dev/null -w "%{http_code} ip=%{remote_ip} ssl=%{ssl_verify_result} redirect=%{redirect_url} $u\n" "$u"
done
