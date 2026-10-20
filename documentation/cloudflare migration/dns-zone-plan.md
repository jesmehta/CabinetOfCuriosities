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

*Wording note 2026-10-21 (Codex DNS review): "no email" above means **no email-related records in the confirmed export**; whether any mail service exists is for the owner to confirm (open question 4).*

**Assessment:** a very small zone with no email, so moving DNS to Cloudflare is low-risk, provided the record list is
confirmed and every existing record is reproduced first.

## Why the zone must move (rather than pointing one record at Cloudflare)

A Worker Custom Domain (`bookshelf.cabinetofcuriosities.in` → Worker `bookshelf-of-curiosities`) requires the parent
zone to be **active on Cloudflare** (per Cloudflare's Workers Custom Domains docs, as summarised in the migration notes
§8). A GoDaddy CNAME to `bookshelf-of-curiosities.jesmehta.workers.dev` is **not** equivalent: `workers.dev` does not serve
other hostnames. (Partial/CNAME zone setups are a paid-plan feature.) **INFERRED from documentation; not tested.**

## Proposed sequence (each step needs owner approval; nothing done yet)

*Superseded 2026-10-21 01:45 IST by "Execution runbook v2" below, which adds the Codex DNS review safeguards. Kept as the first draft.*

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
  *Update 2026-10-21 01:38 IST: the owner reports the renewal is **done**. Public RDAP at 01:37 still showed expiry
  2026-11-03 (registry data usually lags); re-check that the expiry has moved.*
- Steps 2–8: not started; awaiting owner approval (open question 3).
- **2026-10-21 01:43 IST — step 0 confirmed:** registry (RDAP) expiry now **2031-11-03** (last changed 2026-10-20 20:08 UTC). DS still absent. Codex DNS review received (01:37); runbook v2 added (01:45).

## Execution runbook v2 (2026-10-21 01:45 IST) — with the Codex DNS review safeguards

Responds to [dns-zone-codex-review.md](dns-zone-codex-review.md) (gates 1–5 and the evidence list). Each phase needs owner
approval; Claude Code records the evidence listed under "Record". **No step below has been executed.**

**Pre-checks done 2026-10-21 01:43 IST (public):** renewal **confirmed**, registry expiry now **2031-11-03** (last changed
2026-10-20 20:08 UTC); **no DS record** (DNSSEC off) at both Cloudflare's and Google's resolvers; delegation still
`ns33`/`ns34.domaincontrol.com` (TTL 3600); `bookshelf` CNAME → `jesmehta.github.io` (TTL 3600).

### Phase A — prepare the Cloudflare zone (no effect on the live sites)

1. Cloudflare → *Add a domain* → `cabinetofcuriosities.in`, Free plan. Do **not** change nameservers yet; the zone stays
   *pending*.
2. Review the imported records. **Keep only the application records** (gate 1): apex A ×4 (`185.199.108–111.153`), CNAME
   `www`, `bookshelf`, `fffx` → `jesmehta.github.io`; `_domainconnect` optional. **Do not** add GoDaddy's SOA or the
   `ns33`/`ns34` NS records; Cloudflare manages its own authority records.
3. Set the A and CNAME records to **DNS only (grey cloud)**. (Only A/AAAA/CNAME records have the proxy toggle.) Leave
   automatic HTTPS rewrites, redirects and proxy features **off** for this phase.
4. Note the **two nameservers Cloudflare assigns**.
5. Record: the approved record list (screenshot), the assigned nameservers, DS still absent.

### Phase B — switch the nameservers (zone-only; same records, new DNS host)

6. GoDaddy → domain → *Nameservers* → custom → enter Cloudflare's two. Do **not** delete the zone at GoDaddy; keep it
   untouched as the rollback copy (gate 3).
7. Wait for Cloudflare to show the zone **Active**.
8. **Zone acceptance** (gate 5), by Claude Code: registry delegation shows Cloudflare's nameservers; both Cloudflare
   nameservers answer identically; independent resolvers (Cloudflare, Google, a third) return the same records; **HTTPS
   and representative deep paths** work on the apex, `www`, `bookshelf`, `fffx` (still GitHub Pages); records unchanged.
   Repeat after a few hours.
9. **Rollback for this phase:** put `ns33`/`ns34.domaincontrol.com` back at GoDaddy. It is slow (delegation caches), not
   instant. Before relying on it, check that GoDaddy still serves the saved zone.

### Phase C — Bookshelf hostname to Cloudflare (checklist step 13)

10. Optional but recommended: lower the `bookshelf` record's TTL to 300 s in Cloudflare, then **wait at least 1 h**
    (the old TTL) before cutover (gate 2).
11. **Preflight** (gate 4): Worker `bookshelf-of-curiosities` → *Settings → Domains & Routes → Add → Custom Domain* open with
    `bookshelf.cabinetofcuriosities.in` typed in; the restore value written down (CNAME `bookshelf` →
    `jesmehta.github.io`, DNS only). GitHub Pages for Bookshelf **stays enabled** with its custom domain.
12. Delete the `bookshelf` CNAME in Cloudflare DNS, then **immediately** add the Custom Domain. Wait for the certificate;
    this can take minutes, so no zero-downtime promise.
13. **If attachment or the certificate fails:** remove the Custom Domain and restore the CNAME (works while Pages still
    serves Bookshelf).
14. **Hostname acceptance**, by Claude Code: real HTTPS certificate on `bookshelf.cabinetofcuriosities.in`; byte check
    against a local build of the deployed commit; routes, deep links, sitemap (canonical hostname), 404, interaction
    tests; analytics beacon now accepted (production hostname); Cabinet's links to Bookshelf; apex, `www`, `fffx`
    re-checked.

### Phase D — cache drain, then retire Bookshelf's GitHub Pages and privatize (checklist step 12)

15. **Hold** (gate 2): keep Bookshelf's GitHub Pages and its custom-domain binding for **at least 24 h** after cutover
    (well beyond the 3600 s TTL and delegation caches), monitoring the site. Cached old answers still reach GitHub
    Pages during this time, which is why Pages must keep serving.
16. Then remove the custom domain from Bookshelf's GitHub Pages settings, make the repository private, push a commit,
    and verify a **private-source Cloudflare build** and signed-out public access on the custom hostname.
17. **Rollback boundary** (gate 3): after step 16, neither GoDaddy DNS nor GitHub Pages is a fallback for Bookshelf.
    Recovery = Cloudflare version rollback or saved-artifact redeploy (both tested 2026-10-21). Keep both DNS
    configurations recorded through the overlap.

### Record (Codex's handoff evidence list)

Approved application-record list; Cloudflare-assigned nameservers; active-zone and DS checks; current and previous TTLs;
HTTPS checks on all four hostnames after Phase B; records unchanged in Phase B; Bookshelf certificate and cutover result;
the drain wait; the rollback boundary; after privatization, a successful private-source build and public custom-domain
health.

### Open owner questions (added 2026-10-21)

4. Is there **any email or other service** on `cabinetofcuriosities.in` (for example GoDaddy email forwarding, which can
   work without visible records)? The export shows no mail records.
5. **Build-token scope** (Codex C6/C7): the dedicated "bookshelf-of-curiosities build token" has a dedicated name, but its
   permissions have not been inspected. Where it appears (*My Profile → API Tokens*, or the Worker's build settings),
   note its permissions. A narrower token is a separate, optional decision.

### Owner answers (2026-10-21 ~01:55 IST)

- **Q4 email:** the owner confirms **no email or other service** on `cabinetofcuriosities.in`. Combined with the export,
  the zone serves only the three sites.
- **Q5 build token:** the owner finds **nothing listed** under *My Profile → API Tokens* (nor under *Account API Tokens*).
  Cloudflare's Workers Builds documentation (*Workers → CI/CD → Builds → Configuration*, read 2026-10-21) says an
  automatically created build token is a **user token** with default permissions: Account Settings read, **Workers
  Scripts edit, Workers KV Storage edit, Workers R2 Storage edit** (account-wide), **Workers Routes edit for all zones**,
  User Details and Memberships read; managed under *My Profile → API Tokens*. So the dedicated
  "bookshelf-of-curiosities build token" gives **separate revocation, not per-Worker isolation**. Once the zone is on
  Cloudflare, these tokens can also edit Workers routes on it. The dashboard not listing the token contradicts the docs;
  it is unexplained (possibly hidden as system-managed). Residual risk accepted for now: the tokens are held by
  Cloudflare's build system and never stored in a repository. A narrower custom token remains an optional later
  hardening step.
