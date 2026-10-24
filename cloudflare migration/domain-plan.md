# Cabinet — apex and `www` cutover plan (checklist step 23), for Codex review

**Date:** 2026-10-24 · **Author:** Claude Code · **Status:** proposal, not executed. Follows the shared DNS runbook
([dns-zone-plan.md](../documentation/cloudflare%20migration/dns-zone-plan.md), phases C/D as used for Bookshelf and
FFFX). Owner performs every dashboard step; Claude Code checks and records.

## Current state (checked 2026-10-24 ~08:30 IST, public resolvers and HTTP)

- Zone `cabinetofcuriosities.in` is on Cloudflare (`may`/`west.ns.cloudflare.com`); registrar GoDaddy; DNSSEC off.
- **Apex:** A ×4 `185.199.108–111.153` (GitHub Pages), DNS only. **`www`:** CNAME → `jesmehta.github.io`, DNS only.
- GitHub Pages serves the apex; it redirects **`www` → apex with path and query** (`https://www…/teaching/?x=1` →
  301 `https://cabinetofcuriosities.in/teaching/?x=1`) and **`http://` → `https://`** (301).
- Worker `cabinet-of-curiosities` serves the identical site at `cabinet-of-curiosities.jesmehta.workers.dev`
  (1,024/1,024 files, workers.dev = GitHub Pages; rollback and saved-artifact restore proven; migration log).
- **Finding (applies now):** on the Cloudflare-served subdomains, plain `http://bookshelf…/` and `http://fffx…/`
  answer **200 over HTTP**; GitHub Pages used to redirect to HTTPS. The zone setting *Always Use HTTPS* is off.

## What must hold afterwards (acceptance)

1. `https://cabinetofcuriosities.in/…` served by the Worker, valid certificate, every published file byte-identical
   to a local clean build of the deployed commit (allowing the known Linux/Windows About-page difference, or
   compared against the Cloudflare build itself), routes, 404 page, sitemap on the canonical host.
2. `http://` → `https://` with a 301, on the apex, `www`, Bookshelf and FFFX.
3. `www.cabinetofcuriosities.in/<path>?<query>` → **301** `https://cabinetofcuriosities.in/<path>?<query>`, on HTTP
   and HTTPS, as GitHub Pages does today. No content is served on `www` (one canonical host).
4. Bookshelf and FFFX unaffected; Cabinet's links to them and theirs to Cabinet work; analytics beacon accepted on
   the production hostname.

## Steps

### Step 0 — Always Use HTTPS (zone-wide; can be done first, independently)

0. *SSL/TLS → Edge Certificates → **Always Use HTTPS** → On.* Affects only proxied hostnames (today Bookshelf and
   FFFX; later the apex and `www`). Check: `http://bookshelf…/` and `http://fffx…/x/` → 301 to `https://` same path.
   Rollback: switch off. (HSTS stays off: GitHub Pages did not send it, and it is hard to undo.)

### Phase C — apex and `www` (one sitting, about 15 min)

1. **Preflight.** TTLs of the apex A records and `www` are the Cloudflare default (record them; lower to 300 s and
   wait one old TTL if they are higher). Write down the restore values: apex A ×4 `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and CNAME `www` → `jesmehta.github.io` (all DNS only).
   GitHub Pages for Cabinet **stays enabled** with its custom domain. Open the Worker's *Settings → Domains &
   Routes → Add → Custom Domain* with `cabinetofcuriosities.in` typed in. Prepare the redirect rule (step 4) as a
   draft if the dashboard allows.
2. **Apex:** delete the four apex A records, then **immediately** add the Custom Domain `cabinetofcuriosities.in`
   (Production). Cloudflare creates the proxied record and the certificate; expect a gap of minutes (Bookshelf: at
   most about 5 min).
3. **`www` record:** replace CNAME `www` → `jesmehta.github.io` with a **proxied** record so Cloudflare can redirect:
   CNAME `www` → `cabinetofcuriosities.in`, **Proxied** (orange cloud).
4. **`www` redirect:** *Rules → Redirect Rules* (Single Redirect), "www to apex":
   - when: hostname equals `www.cabinetofcuriosities.in`;
   - then: dynamic redirect to `concat("https://cabinetofcuriosities.in", http.request.uri.path)`, status **301**,
     **preserve query string** on.
   The proxied `www` needs an edge certificate: covered by Cloudflare's Universal SSL for `*.cabinetofcuriosities.in`
   (check that the certificate lists `www` or the wildcard).
5. **If the Custom Domain or certificate fails:** remove the Custom Domain, restore the four A records; restore the
   `www` CNAME to `jesmehta.github.io` (DNS only) and disable the redirect rule. GitHub Pages serves again (it stays
   enabled through the hold).
6. **Acceptance** (Claude Code; evidence files): DoH at Cloudflare and Google; pinned-IP HTTP check of every file
   against the deployed commit's build; `www` and `http` redirect matrix (paths, query strings, deep links, unknown
   path); TLS for apex and `www`; browser snapshot and functional checks against the earlier workers.dev results;
   Bookshelf/FFFX re-checked; analytics beacon request accepted.

### Phase D — hold, then retire GitHub Pages (checklist steps 22–23)

7. **Hold at least 24 h** (cached old answers still reach GitHub Pages, which keeps serving). Monitor.
8. Then (owner) remove the custom domain from Cabinet's GitHub Pages settings. Decide on privatizing
   `CabinetOfCuriosities` (the external project repositories stay public; the build fetches them anonymously). If
   private: push a commit, verify a private-source Cloudflare build (new version, byte check), and signed-out access.
9. Retire `deploy.yml` (Pages is unavailable for private repositories on GitHub Free) and `docs/CNAME`; update
   `DEPLOYMENT.md` status. **Rollback boundary:** after step 8, GitHub Pages is no fallback; recovery = Cloudflare
   rollback or a saved release (+ history bundle).

## Risks and notes

- **Downtime:** a few minutes on the apex during certificate issuance (as on Bookshelf); `www` keeps redirecting via
  GitHub Pages until step 3.
- **Redirect loop risk:** none expected — the rule matches only the `www` hostname and targets the apex, which the
  Worker serves; checked in acceptance.
- **Canonical/SEO:** all pages already carry `<link rel="canonical">` to the apex; `www` serves no content.
- **Workers.dev** stays enabled (testing, recovery checks); it serves the same site. Can be disabled later.
- **Cost:** Free plan; Single Redirects are included (no Page Rules needed).
- Owner decisions needed: approve step 0 now (independent fix for Bookshelf/FFFX), the Phase C slot, and whether
  to privatize Cabinet in Phase D.
