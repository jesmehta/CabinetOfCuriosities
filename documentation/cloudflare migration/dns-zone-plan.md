# DNS zone `cabinetofcuriosities.in` — findings and plan for moving it to Cloudflare

Created **2026-10-21 01:17 IST** by Claude Code from **public DNS and registry lookups only** (no account access): DNS over
HTTPS via `cloudflare-dns.com`, registry data via RDAP (`rdap.org`). This is the prerequisite noted before checklist
step 13 (and FFFX 17, Cabinet 23) and in the migration notes §8. **No DNS, nameserver or registrar change is
authorised by this document.**

## Findings (public lookups, 2026-10-21 ~01:16 IST)

| Item | Value | Meaning |
| --- | --- | --- |
| Registrar | **GoDaddy** (RDAP) | |
| Authoritative DNS | **GoDaddy**: `ns33.domaincontrol.com`, `ns34.domaincontrol.com`; SOA `dns.jomax.net` | DNS is **not** on Cloudflare yet |
| DNSSEC | Off (`delegationSigned: false`; no DS/DNSKEY) | A nameserver move needs no DNSSEC hand-over |
| Registry status | client transfer/renew/delete/update prohibited | GoDaddy's registrar locks; a nameserver change made in GoDaddy's own panel normally handles this |
| **Expiry** | **2026-11-03 20:32 UTC** (registered 2024-11-03) | 🔴 **Renew or confirm auto-renew now**, independent of the migration: expiry would take all three sites down |

Records visible from outside:

| Name | Type | Value | Serves |
| --- | --- | --- | --- |
| `cabinetofcuriosities.in` | A ×4 | `185.199.108–111.153` (GitHub Pages) | Cabinet |
| `www` | CNAME | `jesmehta.github.io` | Cabinet (www) |
| `bookshelf` | CNAME | `jesmehta.github.io` | Bookshelf |
| `fffx` | CNAME | `jesmehta.github.io` | FFFX |
| `_domainconnect` | CNAME | `_domainconnect.gd.domaincontrol.com` | GoDaddy "connect a service" default; not needed by the sites |

**Not present:** MX (no email on this domain), TXT/SPF/DKIM/DMARC, CAA, AAAA at the apex, any GitHub verification
TXT. Public lookups cannot list every name in a zone: **the owner must confirm the full list in GoDaddy's DNS panel**
(screenshot or export) before anything changes.

**Assessment:** a very small zone with no email, so moving DNS to Cloudflare is low-risk, provided the record list is
confirmed and every existing record is reproduced first.

## Why the zone must move (rather than pointing one record at Cloudflare)

A Worker Custom Domain (`bookshelf.cabinetofcuriosities.in` → Worker `bookshelf-of-curiosities`) requires the parent
zone to be **active on Cloudflare** (per Cloudflare's Workers Custom Domains docs, as summarised in the migration notes
§8). A GoDaddy CNAME to `bookshelf-of-curiosities.jesmehta.workers.dev` is **not** equivalent: `workers.dev` does not serve
other hostnames. (Partial/CNAME zone setups are a paid-plan feature.) **INFERRED from documentation; not tested.**

## Proposed sequence (each step needs owner approval; nothing done yet)

| # | Step | Who | Effect on the live sites |
| --- | --- | --- | --- |
| 0 | **Renew / confirm auto-renew** before 2026-11-03 | Owner (GoDaddy) | None |
| 1 | Confirm the complete record list in GoDaddy's DNS panel; screenshot/export it into this folder as the rollback record | Owner | None |
| 2 | Cloudflare dashboard → *Add a domain* → `cabinetofcuriosities.in`, **Free** plan. Cloudflare scans and imports records. Check the imported list against step 1; add anything missing | Owner | None (GoDaddy still authoritative) |
| 3 | Set **every** imported record to **DNS only (grey cloud)**, so the GitHub Pages sites keep working exactly as now (proxying them could interfere with GitHub's HTTPS certificates) | Owner | None yet |
| 4 | In GoDaddy, replace the nameservers with the two Cloudflare gives in step 2 | Owner | Same records, new DNS host; propagation up to 24–48 h; sites should not change |
| 5 | Wait until Cloudflare shows the zone **Active**; Claude Code verifies all hostnames still resolve and serve | Owner, Claude Code | — |
| 6 | **Bookshelf step 13:** delete the `bookshelf` CNAME in Cloudflare DNS, then in the Worker → *Settings → Domains & Routes* → *Add Custom Domain* `bookshelf.cabinetofcuriosities.in`. Cloudflare creates the record and certificate | Owner | Bookshelf moves from GitHub Pages to Cloudflare (seconds to minutes) |
| 7 | Claude Code verifies HTTPS, deep links, sitemap, 404, interactions and Cabinet's links on the real hostname | Claude Code | — |
| 8 | **Bookshelf step 12:** remove Bookshelf's custom domain from GitHub Pages settings, then make the repo private; verify a private-source build | Owner, Claude Code | GitHub Pages stops (no longer serving the domain anyway) |

Cabinet (apex, `www`) and FFFX keep pointing at GitHub Pages through Cloudflare DNS until their own migrations.
**Rollback:** before step 4, nothing has changed. After step 4, put GoDaddy's nameservers back (records unchanged at
GoDaddy, because nothing is deleted there). After step 6, remove the Custom Domain and re-add the `bookshelf` CNAME to
`jesmehta.github.io` (works only while Bookshelf's GitHub Pages is still enabled, i.e. before step 8).

## Open questions for the owner

1. Renewal status and auto-renew (step 0).
2. Complete record list from GoDaddy (step 1). Anything used outside these three sites (email forwarding, other
   services, verification records)?
3. Approval to start steps 2–5 (the zone move) as a separate change before step 6.

## Progress

- **2026-10-21 01:35 IST — step 1 done.** The owner exported the zone from GoDaddy (export dated 2026-10-20 20:03:13):
  [`dns-export-godaddy-20261020.txt`](dns-export-godaddy-20261020.txt), kept here as the rollback record. It contains
  **exactly** the records found by public lookup and nothing else: apex A ×4 (TTL 600), CNAME `bookshelf`, `fffx`, `www`
  → `jesmehta.github.io` and `_domainconnect` → `_domainconnect.gd.domaincontrol.com` (TTL 3600), NS
  `ns33`/`ns34.domaincontrol.com`. No email, TXT or other records. Open question 2 is answered: the domain serves only
  the three sites.
- **Step 0 (renewal): in progress** (owner, 2026-10-21). Must be complete before 2026-11-03.
- Steps 2–8: not started; awaiting owner approval (open question 3).
