# Codex review — DNS zone migration plan

Reviewed **2026-10-21 01:37:33 IST**. Scope: `dns-zone-plan.md` introduced in Cabinet `e290463b31bf4ac5d9024bca8856872636ebfbed`, plus export/progress update at `b8e2771` and the saved GoDaddy zone export. Plan file Git blob at review: `275f3fda998e5f53443b48d0900fa851d7b23059`.

Companion Bookshelf milestone review: [C7](../../../TheBookshelfOfCuriosities/cloudflare%20migration/codex-reviews.md). This document records findings; it does not edit the plan or authorize DNS changes.

## Verdict

**The overall architecture and staged order are sound. GO for preparing the Cloudflare zone and checking its records, with owner approval. Hold nameserver execution until the record/delegation checks below are explicit; hold Bookshelf retirement/privatization until the cache-drain and HTTPS gates are satisfied.**

Keep registration at GoDaddy, initially reproduce site records DNS-only at Cloudflare, verify unchanged GitHub-hosted sites, then attach Bookshelf's hostname, verify it and only later retire its Pages configuration/private-source entitlement. There is no need to migrate Cabinet/FFFX hosting with the zone.

## Important execution gates

1. **Separate application records from DNS authority records.** The export contains four apex A records and four CNAMEs, plus GoDaddy SOA and apex NS records. Copy the intended A/CNAME records; do not blindly import GoDaddy's SOA or its apex `ns33/ns34.domaincontrol.com` delegation into the new zone. Cloudflare manages the new authority records and supplies the exact nameserver pair to enter at the registrar. The export itself says it requires editing before production use. Preserve `_domainconnect` initially if desired; only eligible A/AAAA/CNAME records have a proxy toggle, not literally every DNS record.
2. **Keep GitHub Pages serving throughout cached old answers.** The exported Bookshelf CNAME has TTL **3600 seconds**, while nameserver delegation has its own caching behaviour. A successful Cloudflare browser check does not mean every resolver has stopped returning the old destination. Add a deliberate hold between hostname cutover and removing the Pages custom domain/privatizing. After zone delegation is stable, optionally lower Bookshelf's TTL and wait out its previous TTL before cutover; otherwise retain the GitHub hostname binding/hosting for at least the previous record TTL after the last possible old answer, with a suitable monitoring window. Do not treat that interval as a guarantee for every broken cache.
3. **Make rollback phase-specific.** Returning to GoDaddy nameservers is a slow, cache-dependent zone rollback, not an instant switch. Verify GoDaddy still serves the saved zone before relying on it; some providers change service after nameserver replacement. After Bookshelf moves, the old GoDaddy Bookshelf answer points to GitHub, so nameserver rollback can break it once Pages is retired. State explicitly: after privatization use the tested Cloudflare version/artifact recovery; neither old DNS nor old Pages is an assumed fallback. Preserve both DNS configurations through the overlap.
4. **Preflight Custom Domain attachment and certificate state.** Cloudflare requires an active zone and disallows attachment over an existing CNAME. Before deleting that CNAME, have the exact hostname/Worker selected and restoration steps ready. Attach immediately; verify certificate issuance and actual HTTPS. If attachment fails, restore the saved GitHub CNAME while Pages still serves it. Do not promise a seconds-to-minutes cutover or zero downtime; cached answers and certificate provisioning affect it. Keep GitHub's binding until the drain/acceptance window passes.
5. **Separate zone acceptance from hostname acceptance.** Before step 6, verify Cloudflare is active, registrar delegation is correct, both Cloudflare authoritative servers answer consistently, and independent recursive resolvers see the expected nameservers/records. Check HTTPS and representative paths on apex, `www`, Bookshelf and FFFX. Repeat those checks after the Bookshelf-only switch. Keep automatic HTTPS/redirect/proxy changes out of the initial DNS-only phase.

These are actionable changes to the execution runbook before performing the relevant step, not objections to creating a pending zone. No DNS changes were made by this review.

## Other findings / evidence limits

- The saved export supports the application record inventory: four GitHub apex A records (TTL 600), `www`, `bookshelf`, `fffx` and `_domainconnect` CNAMEs (TTL 3600), and old GoDaddy authority records. It shows no mail/TXT/CAA records. This verifies the exported inventory, not every external service or hidden registrar forwarding setting; the owner's confirmation still matters.
- Public lookup/RDAP conclusions (GoDaddy authority, DNSSEC disabled, expiry 2026-11-03) are implementer-recorded. Codex did not independently query current DNS/RDAP or authenticate to either dashboard in this pass. Recheck parent DS absence immediately before delegation. Keep DNSSEC changes out of this initial move; enabling it later changes rollback requirements.
- Renewal/auto-renew confirmation remains an owner checkpoint. Do not infer successful renewal from "in progress" or treat it as part of hosting setup. The recorded expiry is close enough to resolve independently of the migration.
- A dedicated build token name does not establish per-Worker authorization scope. Preserve that unresolved Bookshelf C6 observation.
- Plan language "no email" is stronger than the DNS evidence; prefer "no email-related records in the confirmed export; owner reports no mail service."

## Required handoff evidence

Record the approved application-record list, Cloudflare-assigned nameservers, active-zone/DS checks, current/previous TTLs, all four hostname HTTPS checks, unchanged records during the zone-only stage, Bookshelf certificate/cutover result, cache-drain wait, and exact rollback boundary. After owner-approved privatization, record a new successful private-source build and public custom-domain health. These complete the outstanding gates; preview and recovery results alone do not.

## Sources and checks

Read-only local inspection of the plan, export, commits and Bookshelf R7–R11; official documentation checked during review:

- [Cloudflare full DNS setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/): record review, nameserver replacement, DNSSEC and active-zone checks.
- [Worker Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/): active zone, existing-CNAME restriction, managed DNS/certificates.
- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site): hostname binding, DNS and propagation.

No account mutation, DNS query, application execution, installation, commit, push or deployment was performed. This review and the companion Bookshelf entry are the only writes.

## Follow-up — runbook v2 satisfies the Phase B planning gates

**Recorded 2026-10-21 02:23:13 IST.** Reviewed runbook v2 (Cabinet `16fd540`), owner-answer update `a867692`, Phase A record `ccb7856`, and the current plan's additional switch/progress notes. This is a new written assessment now, not a claim that Codex had already reviewed v2 at 01:37 or independently approved the switch before it happened.

**GO: v2 meets the earlier review's planning/preflight requirements for Phase B, the nameserver-only switch with unchanged application records.** The original hold was conditional on making those safeguards explicit; v2 does so. The recorded execution evidence supports that condition being met: application A/CNAME records only, no old GoDaddy SOA/apex NS copied, DNS-only status, DS rechecked, GoDaddy's saved zone still answering, and both assigned Cloudflare nameservers answering consistently. These results are recorded implementer/owner observations, not live DNS checks independently repeated by Codex in this follow-up.

V2 also addresses the subsequent gates: explicit zone acceptance across resolvers/hostnames, Custom Domain and certificate preflight, a 24-hour Pages/binding retention period, and the post-privatization rollback boundary. Renewal is recorded as confirmed through 2031; the owner reports no other services. Dedicated build-token naming is correctly distinguished from per-Worker permissions.

**Phase B execution is recorded as owner-performed; Phase B acceptance is still pending in the latest notes read.** Complete zone Active/delegation convergence and resolver/HTTPS/deep-path checks before Phase C. Cached GoDaddy answers are expected during the transition; identical application records at both providers support continuity. This note does not declare convergence complete, approve immediate hostname cutover/privatization, or replace the owner's authority for account actions.

Minor record correction for Claude: the v2 introduction still says "No step below has been executed" although Progress records Phase A and the switch. Mark that sentence as the original runbook state or superseded. Preserve historical observations without presenting them as current status.

Only this review file was changed. No DNS/account settings, commits or pushes were performed.
