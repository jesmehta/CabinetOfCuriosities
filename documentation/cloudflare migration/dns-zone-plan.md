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
- **2026-10-21 ~02:12 IST (tool UTC 20:42 + 5:30) — Phase A (runbook v2 steps 1–5) done.** The owner added the zone on
  the Free plan. Records shown in the owner's dashboard screenshot (not saved to the repo): apex A ×4
  (`185.199.108/109/110/111.153`), CNAME `www`, `bookshelf`, `fffx` → `jesmehta.github.io`, CNAME `_domainconnect` →
  `_domainconnect.gd…` (kept). All eight records are **DNS only**, TTL Auto. No NS/SOA copied. This matches the GoDaddy
  export exactly. Cloudflare's "all records DNS only, proxy for protection" banner was ignored deliberately: everything
  is still served by GitHub Pages. **Assigned nameservers: `may.ns.cloudflare.com`, `west.ns.cloudflare.com`.**
  Public DNS at 20:42 UTC: delegation still `ns33`/`ns34.domaincontrol.com`; **no DS** (Cloudflare DoH and Google DNS).
  Cloudflare's prompt to replace GoDaddy's two nameservers is Phase B step 6, which is **not done** and waits for owner
  approval.
- **2026-10-21 ~02:17 IST — Phase B approved and step 6 done.** The owner approved Phase B ("Codex approves") and
  changed the domain's *Nameservers* setting at GoDaddy to `may`/`west.ns.cloudflare.com`. GoDaddy's own DNS records
  (including its SOA and NS entries) were left untouched as the rollback copy. At 20:47 UTC the registry (RDAP) still
  listed `ns33`/`ns34` (last changed 20:08 UTC, the renewal), and public resolvers still returned the cached NS (TTL
  3600). Waiting for the registry update and Cloudflare's *Active* status (step 7). Phase A record pushed as `ccb7856`.
  Codex's approval of runbook v2 was relayed by the owner verbally. It is not yet in `dns-zone-codex-review.md`, which
  is unchanged since `37ed3be`.
- **~02:25 IST — both authorities answer identically (Codex gate 3, gate 5 partial).** Direct non-recursive queries
  (PowerShell `Resolve-DnsName -NoRecursion`) for the apex, `www`, `bookshelf` and `fffx`:
  - `ns33.domaincontrol.com` still serves the saved zone (A ×4 TTL 600; CNAMEs TTL 3600), so the GoDaddy rollback
    copy is intact.
  - `may` and `west.ns.cloudflare.com` both return the same A ×4 and CNAME → `jesmehta.github.io`, at TTL 300
    (Cloudflare "Auto").
  - The records are therefore unchanged across the switch. Previous TTLs: A 600 s, CNAME 3600 s; new TTLs 300 s.
- **Registry delegation switched at 2026-10-20 20:49:57 UTC (02:19:57 IST)**, per the RDAP "last changed" event. RDAP
  nameservers are now `may` and `west.ns.cloudflare.com`. Checks at 20:50 UTC:
  - **DS still absent** (Cloudflare DoH and Google DNS).
  - Public resolvers still return the cached `ns33`/`ns34` (NS TTL 3600), so up to about 1 h of mixed answers is
    expected. Both authorities hold identical records, so either answer is correct.
  - HTTPS, certificates valid (`ssl_verify_result=0`), all served by GitHub Pages `185.199.x`: apex **200**, `www`
    **301** (GitHub's `www` → apex redirect, as before), `bookshelf` **200**, `fffx` **200**.
  - A direct query to `ns3`/`ns4.registry.in` with `Resolve-DnsName` returned SERVFAIL (the tool cannot follow a TLD
    referral), so RDAP is the registry evidence. Zone acceptance (step 8) is completed after the resolvers switch.
- **Codex follow-up recorded 02:23:13 IST** in `dns-zone-codex-review.md`: **GO**, v2 meets the Phase B planning
  gates. This supersedes the "not yet in the review file" note above. Codex asked for two things:
  - Zone acceptance must include Cloudflare *Active*, resolver convergence, HTTPS **and deep paths**, all before
    Phase C.
  - The v2 introduction's "no step executed" line must be marked superseded. Done, in the same commit as this entry.
- **2026-10-20 21:00 UTC (02:30 IST) — zone acceptance (step 8): PASS, except Cloudflare *Active*, which the owner
  still has to confirm.** Evidence: `evidence/zone-acceptance-20261020T2100Z.txt`, produced by
  `evidence/zone-acceptance.sh`.
  - **Resolvers:** at 21:00:34 the resolver watch saw both Cloudflare DoH and Google DNS return
    `may`/`west.ns.cloudflare.com` (Google answered from `173.245.59.247`, a Cloudflare nameserver).
  - **Google cache:** a Google query 25 s later still returned the cached `ns33`/`ns34`. Google's cache nodes differ,
    so this is expected for up to the old 3600 s NS TTL. It is harmless, because both authorities hold identical
    records.
  - **Records** at both resolvers are unchanged: apex A ×4 `185.199.108–111.153`; `www`, `bookshelf`, `fffx` CNAME →
    `jesmehta.github.io`. **No apex DS.** The script's NS/DS lines for subdomains just echo the CNAME chain; they are
    not delegations.
  - **HTTPS** (all `ssl_verify_result=0`, all served by GitHub Pages `185.199.x`):
    - apex `/`, `/teaching/`, `/writings/`, `/sitemap.xml`: 200
    - `www` `/` and `/teaching/`: 301 to the same path on the apex (as before)
    - Bookshelf `/`, `/favorite-poems/general/kipling--if/`, `/scifi/`, `/asimov/`: 200; an unknown path: 404
    - FFFX `/`, `/deep-studies/100-gradients/`, `/genuary/genuary-2024/`: 200
- **2026-10-21 02:42–03:03 IST — owner confirms the zone is Active; Phase C (Bookshelf) cut over.**
  - Steps 11–12: the owner deleted the `bookshelf` CNAME, then added the Custom Domain on Worker
    `bookshelf-of-curiosities` (Production only). A "No zones match" error cleared after a page reload.
  - Gap of at most about 5 min (NXDOMAIN at 21:17:26 UTC; Cloudflare addresses at 21:22:37 UTC).
  - Step 14 hostname acceptance: PASS, 220/220 byte-identical, TLS verified. Evidence and details are in Bookshelf
    `cloudflare migration/migration-log.md` ("Custom domain cutover") and `evidence/custom-domain-cutover-20261020T2125Z.txt`.
  - Apex, `www` and `fffx` are unchanged on GitHub Pages.
  - Step 15 hold: runs until **2026-10-22 02:52 IST** at the earliest.

## Execution runbook v2 (2026-10-21 01:45 IST) — with the Codex DNS review safeguards

Responds to [dns-zone-codex-review.md](dns-zone-codex-review.md) (gates 1–5 and the evidence list). Each phase needs owner
approval; Claude Code records the evidence listed under "Record". *(At writing, 01:45 IST, no step below had been executed. Superseded: for current status see Progress above. Phase A and
step 6 are done; acceptance is pending.)*

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
- **2026-10-22 ~09:05 IST — FFFX Phase C:** `fffx` CNAME deleted and Custom Domain added on Worker
  `form-follows-fx` (owner). Checks at 03:36 UTC: 79/79 byte-identical; TLS verified; tool paths 404. Hold until
  2026-10-23 09:06 IST. Details: `form-follows-fx/cloudflare migration/migration-log.md`.
- **2026-10-24 — Always Use HTTPS on** (zone-wide; Bookshelf/FFFX had answered plain HTTP since their move).
- **2026-10-24 ~09:20–09:45 IST — Cabinet Phase C (apex + `www`):** apex A ×4 deleted and Custom Domain
  `cabinetofcuriosities.in` added on Worker `cabinet-of-curiosities` (served at 03:50 UTC); `www` CNAME →
  `cabinetofcuriosities.in`, proxied, with a 301 Redirect Rule to the apex (522 for about 6 min until the rule was
  corrected). Acceptance passed; hold until 2026-10-25 04:15 UTC. Plan and details:
  `CabinetOfCuriosities/cloudflare migration/domain-plan.md` and its migration log.
