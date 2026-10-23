# Codex independent review record — Cabinet

Initial audit: [audit.md](audit.md). Implementer responses: [claude-code-responses.md](claude-code-responses.md). Entries are point-in-time assessments; implementation, pushes and account actions remain separate.

## C1 — Implementation plan v2 — 2026-10-22 03:05:47 IST

**Exact source reviewed:** local `main` at `d69fa449670dec95b86a5f8b2a96c6abd02b59b6`. Plan v2 was committed in `c4a572d`; reviewed `cloudflare migration/plan.md` blob **`5385f071f44385057fa757c1e9ebf1d0a8612094`**. Compared with initial audit source `33788afab468d42f3841eb62cbbbca83a3d460e0`, the plan's clean-clone baseline `6300dfa`, shared requirements, current manifest/config/editor source and retained baseline evidence. Existing owner changes remain unstaged: `docs/_assets/material/css/cabinet-material.css`, `documentation/scratchNotes.md`, `docs/_images/paper2025_26/`, `docs/teaching/paper2025.md`. This review does not incorporate them into the migration baseline.

### Verdict

**GO for bounded implementation and disposable local tests after the corrections below are incorporated.** The overall design meets the audit's needs: direct Cloudflare build with public external inputs, pinned revisions, reviewed per-mount/archive allowlists, one full build, portable authoring, saved-artifact recovery and separate hostname work. Owner decisions D1–D10 are recorded in the plan; this review does not reopen them. Ignoring unlisted files is an intentional owner decision, not a defect.

**NO-GO for a production push, deployment, apex/www cutover or privatization on plan evidence alone.** Implementer should retain evidence and obtain a post-implementation review before the owner-approved first push. The shared Actions change will alter the live GitHub Pages artifact before Cloudflare cutover, so all approved removals and exceptions must be tested before that push.

### Important corrections before implementation

**I1 — A development artifact needs a release/deployment boundary, not only a save-artifact check.** `plan.md:157` proposes `--external-local`, a development marker and save refusal, then concludes it can never become a release. A development `public/` can still be uploaded directly, or copied and restored, without calling save-artifact. Define supported commands so normal deploy always creates a fresh pin-only release build; deployment/recovery verification must reject development metadata and record whether any external override was used. Keep provenance outside browser-served output. Test override → save rejection, supported deploy rejection/rebuild, and restore-verifier rejection of a deliberately packaged development artifact. A raw Wrangler invocation can bypass wrappers; state that limit rather than claiming absolute prevention. Preserve a clearly documented manual verified-artifact deploy route.

**I2 — Matching Git HEAD is insufficient to trust a reusable external cache.** `plan.md:78,85,146,157` permits SHA-based cache reuse and offline builds, now combined with partial/sparse clones. A modified tracked JS file does not change HEAD; it could otherwise be published under the approved SHA. Require release assembly to read verified commit content, or verify every listed cached file against its pinned blob before copying; reject dirty/substituted/missing listed content rather than silently using it. Validate cache identity and the repo/revision mapping as well. Define fetching by `(repository, revision)` or reject conflicting revisions for rows sharing a repo; one fetch per repository works for SSD's current common SHA but must not silently select one row's revision for another. Add cases for modified listed content at unchanged HEAD, unavailable pinned objects, conflicting pins and a source symlink. Do not reset or clean the owner's development checkout to repair a cache.

Partial clone/sparse checkout is a useful optimisation to prove in a disposable experiment, not yet an established guarantee that only published blobs are downloaded. Configure sparse selection before materialising content; test that newly allowlisted paths at the same SHA become available, and that a warmed cache build succeeds with network access unavailable. A promisor cache can still lack needed objects. Keep the simpler pinned-fetch fallback if the optimisation cannot meet reproducibility/offline requirements; measure actual bytes/time rather than promising a precise transfer reduction. No Git partial-clone experiment was executed by Codex.

**I3 — Browser request capture must be supplemented to make complete allowlists.** `plan.md:148` proposes loading every page, recording requests and linked files. Initial page loads can miss audio unlocked by interaction, lazy images, level/game states, dynamic imports, workers/WASM, fonts, export resources, case-sensitive paths and other deferred fetches. Use capture as a candidate generator alongside source/reference inspection and scenario coverage. Include necessary licence notices explicitly (D3a), even if no browser requests them. Validate the candidate artifact through actual SSD gameplay/audio, Swatch Fields modes, Tracery actions and archive navigation/intentional downloads. Inventory every source HTML entry to decide whether it is public, excluded or a redirect; do not recursively publish every linked path without review. Keep policy/path/traversal/symlink/collision checks fatal even though *unlisted source files* are ignored. Add explicit rejection tests for absent/malformed allowlists, escaping paths and listed non-regular/symlink files.

**I4 — Rewrite the operative change table and acceptance tests to v2 before handoff.** `plan.md:67–85,107–109,146–157` retains v1 inventory rewriting/equality/failure rules, followed by a superseding v2 section. C2/C3 and rejection test 4 should consistently describe explicit allowlists: an unlisted file is omitted/reported and the build succeeds; a listed missing file fails; pin updates do not silently approve newly discovered files. `update-externals` should propose candidate additions/removals for review without silently widening the publication boundary. Include the new sitemap and development-provenance tests in the main test table. Owner-approved archive download exceptions and retained LICENSE notices should be explicit exceptions to the broad D3++ wording, not accidentally removed by a blanket extension/name filter.

### Sitemap recommendation and comparison limits

The proposed scope is reasonable: **canonical live MkDocs pages plus public mounted entry/student pages; exclude the historical archive**. This recommendation need not block unrelated local implementation. Make the exact rule explicit before publishing: do not add every `.html` file solely because it is allowlisted. Exclude 404/error pages, redirect stubs, helpers/templates and pages intentionally marked noindex or canonical to another URL; deduplicate by final canonical URL. Use proper XML parsing/escaping, deterministic ordering and dates, the canonical apex hostname (not workers.dev), and prove each generated URL resolves to intended public content. Keep plain XML only as approved in D5. This generated XML sitemap is distinct from the existing human-facing `compass/sitemap` authoring tool, which remains local and unchanged.

`plan.md:152` says the D6 comparison will show only an added canonical line. Treat that as an expectation to test, not a required description of uninspected output: `site_url` can affect other generated metadata/URLs. Compare the filtered/pinned baseline first, then enumerate all D6/D7 and sitemap differences. Explain/resolve the retained baseline exceptions (Windows redirect newlines and malformed About-page markup) so the final claim is accurate; do not silently change the malformed content as part of hosting. Root-relative preview navigation and root `/` validation are appropriate corrections.

### Deferred or explicitly accepted consequences

- Excluding `_TraceryTrials` is owner-approved, including the known three broken index links. Track their precise URLs as accepted exceptions until the separately scoped upstream cleanup; do not claim every link passes or change that external repo without authorization. Re-test its pinned revision if that cleanup is later incorporated.
- D9 keeps owner work uncommitted. Use isolated clean checkouts/worktrees at recorded migration SHAs for testing; leave the owner's files untouched. Local working-tree builds may contain owner work and must not be presented as reviewed release evidence.
- Cloudflare build placement is reasonable for the currently public sources. If any external source becomes private, establish explicit scoped checkout credentials before changing its visibility. Cabinet's Git integration does not by itself authorize ad-hoc private clones.
- Keep proposed build-watch exclusions limited to internal documentation. `docs/`, content TSVs, allowlists, external pins, locks, scripts and configuration must trigger builds. Reuse FFFX's corrected two-push proof and distinguish branch behaviour from preview-URL settings. Apex/www routing, hold, private-source verification and external auth are later acceptance gates.
- Offline assembly requires warmed and verified source/dependency caches; offline finished-artifact recovery needs no rebuild. Deployment still needs access to the target host. Record these separately in the runbook.

### Evidence actually checked and remaining tests

**Codex performed read-only checks:** Git identity/status/history and source file names changed since the audit; plan blob identity; reading plan/audit/shared requirements; current `content/external-repos.tsv`, `mkdocs.yml` and relevant editor handling; baseline build transcript, live-comparison summaries, external revision record and Claude response. Current application/configuration has no committed migration implementation in this scope. The retained revisions show all three SSD mounts using the same commit today.

**Implementer-observed, not independently rerun:** fresh baseline build (1,117 files, approximately 166 MB), anonymous source availability, live byte comparisons and Windows clone/path findings. These reduce uncertainty but are not proof of the proposed filtered/pinned/partial-clone implementation. Platform-limit acceptance must be measured on its actual artifact; this review did not independently reconfirm current Cloudflare limits or account capacity.

**Required next evidence:** clean reproducible release build with complete external provenance and manifests; warm-cache/network equivalence and failure cases above; exact published/removed inventories; baseline and new functional comparisons; portable launcher/editor/admin/sitemap and landing build/promote checks in disposable environments; then post-implementation review. Temporary Worker build, runtime versions, artifact/HTTP/browser comparisons, docs/runtime triggers, eligible rollback and independent saved-artifact restore remain subsequent gates. Preserve owner approval before pushes and account actions.

No build, package install, source generation, browser/network test, branch switch, application/configuration edit, commit, push or deployment occurred. **Only this review file was written.** Claude should answer C1 in `claude-code-responses.md` and revise the plan before implementation.


## C2 ? Implementation plan v3 ? chat review recorded 2026-10-23

This records the v3 review previously delivered in this conversation, as requested by the owner. It is a retrospective record, not a claim that a new implementation review occurred at the earlier chat time.

**Plan identity:** v3 introduced by `e9c4687`; plan blob `f81e9d1a769026c1452c87bd8d7af2d37bcf34ec`. Compared with C1 and implementer response R2.

**Verdict: GO for bounded implementation and local testing, with two plan corrections. NO-GO for deployment or cutover on plan evidence alone.**

1. **Archive publication policy conflicts.** Operative C4 (v3 line 87) says exclusion list, while the owner decision D4 (line 213) requires a frozen allowlist. Make C4 use the allowlist and add archive missing-file/path-policy rejection tests.
2. **Build-trigger wording is ambiguous.** Test 8 (v3 line 127) says ?docs-only skip.? Specify internal documentation only; website content under `docs/` must trigger deployment. Keep TSVs, allowlists, pins, locks, scripts and configuration build-triggering.
3. **Documentation cleanup.** Clearly label the v2 section as historical and superseded. Update the closing approval request from review v2 to review v3.

V3 otherwise addresses the major C1 findings: pinned Git-object assembly, cache integrity, development-artifact boundaries, reviewed allowlist candidates, interaction coverage and explicit sitemap rules. Implementation, reproducibility, browser checks and restore evidence still require review before the owner-approved push or cutover.

The original chat review made no file changes and ran no builds or deployments.

## C3 ? Implementation plan v3.1 (`5e013db`) ? 2026-10-23 08:07 IST

**Exact plan reviewed:** commit `5e013db7522f8163a16b5fb92c0f9b2a7cc7349a`, `cloudflare migration/plan.md` blob `e093dd6d72e3c2f56f5b8e0146f95100f643c582`. Current local HEAD during review: `5775d957bbf65015777c4067488f53726728f12c`. The plan has no committed difference between the requested revision and that HEAD. Checked the v3-to-v3.1 diff, R3, prior C1/C2 context, Git status/history and the implementation log for scope. Timestamp uses execution-host ISO time with explicit +05:30 offset.

### Verdict

**GO for bounded implementation and disposable local tests. No remaining blocking plan correction found in this revision.** This is approval of the proposed technical approach, not evidence that implementation or deployment gates have passed. Owner approval remains required for pushes, account changes, visibility changes and cutover.

### C2 resolution

- **Archive: resolved.** D4 and C4 now specify `content/archive-allowlist.txt`, frozen and explicit. Unlisted files are omitted/reported; listed missing files and policy/path errors fail. Test 4 includes the archive rejection set and an unlisted-file success case. Linked historical downloads remain explicit exceptions.
- **Build triggers: resolved.** Test 8 distinguishes internal documentation (`cloudflare migration/`, `documentation/`, README and deployment runbook) from website `docs/`. Website content, TSVs, allowlists, pins, locks, scripts and configuration must deploy. Both skip and deploy pushes must be demonstrated.
- **Superseded text: resolved.** The opening establishes operative precedence; the v2 section is explicitly historical and names superseded partial-clone, D6 comparison and development-boundary claims. The closing request references the v3 review and requires post-implementation review before any push.
- **Additional consistency improvements:** D2 no longer rewrites inventories automatically; D6 no longer offers the rejected absent-site_url alternative; D9 preserves owner work; D10 defines the Git-object cache rather than trusting checkout HEAD.

C1 requirements remain in the operative plan: release bytes from pinned trees; separate repository/revision pairs; no cleaning owner checkouts; partial clone treated as an experiment; interaction/source/HTML-entry coverage for allowlists; development save/verify refusal and pinned rebuild on supported deploy; provenance outside served output; explicit sitemap exclusions and two-step artifact comparisons.

### Scope and remaining evidence

Later local commits already add pins, candidate allowlists and external-mount tools. The migration log reports a partial-clone experiment, offline comparison and baseline comparisons. **These implementation changes and experiment results were not independently reviewed or rerun in C3.** Candidate allowlists are explicitly not yet reviewed; do not interpret plan approval as publication approval for those candidates or as a passing post-implementation review.

Next review must inspect actual code and complete artifact publication boundaries, exercise the promised failure cases, validate functional allowlist completeness, check deterministic clean builds and provenance/release verification, review authoring portability, and verify the eventual hosted/restore evidence at the appropriate gates. Preserve the three owner-accepted Tracery broken-link exceptions and disclose them in results. Keep raw CLI deployment bypass limits explicit.

Minor editorial carryovers in historical wording do not block local implementation: offline artifact serving/restoration and network-required deployment should remain clearly distinguished in the final runbook, and site_url effects must be measured rather than assumed to change every HTML file in the same way.

Existing owner changes remain untouched: `docs/_assets/material/css/cabinet-material.css`, `documentation/scratchNotes.md`, `docs/_images/paper2025_26/`, `docs/teaching/paper2025.md`.

**Actions performed:** read-only Git/file inspection and appending C2/C3 to this review record. No application/configuration edits, build, dependency install, network/browser test, commit, push or deployment.
