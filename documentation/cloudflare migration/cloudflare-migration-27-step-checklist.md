# Cloudflare Migration — 27-Step Checklist

**Project:** Cabinet of Curiosities website ecosystem  
**Status:** Dot Mandala pilot complete (steps 04–09, 2026-10-20). Bookshelf: steps 10–11 complete (2026-10-21); DNS question, then 13 and 12, next. Tick items only after completion.  
Dot Mandala evidence: private `DotMandalaGenerator` repo, `main`, `cloudflare migration/migration-log.md`; `migration-docs` was merged and deleted. Independent final review: `56b607ab7cfc5d943c20d17614c836cd6cf989c9`.  
**Reference:** `cloudflare-migration-notes.md`  
**Project policies:** [Transition register](transition-register.md). Algorithm/image/data protection has separate gates and does not expand these 27 hosting steps. Next: Bookshelf audit (10).
**Roles:** Codex audits and independently reviews; Claude Code implements and tests; owner approves account access, repository visibility, DNS and production changes.

**Sequence:** Dot Mandala pilot → Bookshelf → FFFX → Cabinet → finalisation. Maintain existing live deployments until replacements have been tested. Cloudflare Pages versus Workers with Static Assets is an implementation choice to assess during the pilot; server-side algorithm protection is a separate, deferred project.

## 1. Preparation (3)

- [ ] **01.** Verify existing GitHub and Cloudflare accounts, access and permissions.
- [ ] **02.** Inventory current deployment workflows, domains and dependencies. **Codex:** inspect actual repository configuration; do not assume remembered workflows are current.
- [ ] **03.** Create a migration log and rollback notes. **Claude Code:** record baseline URLs, settings, commands and decisions; document local build/preview for the existing sites and manual recovery without AI.

## 2. Dot Mandala — pilot (6)

- [x] **04.** Audit the repository and identify its actual web root. **Codex:** report dependencies, deployment output, URLs, public assets, local build and host portability; recommend Pages or Workers with Static Assets. *Done 2026-10-20: Codex `audit.md` (Workers with Static Assets recommended).*
- [x] **05.** Configure a Cloudflare deployment. **Claude Code:** prepare minimal required build/config changes and documentation; **owner:** approve GitHub integration and Cloudflare project creation. *Done 2026-10-20: Worker `dot-mandala-generator` via dashboard Git integration, GitHub app limited to this repo.*
- [x] **06.** Test the temporary Cloudflare URL **and local preview**. Check controls, rendering, exports, asset paths and browser errors; confirm the generated output can be served independently; do not change live links. *Done 2026-10-20: https://dot-mandala-generator.jesmehta.workers.dev; HTTP + 36 browser checks pass; artifact byte-identical to local and live Pages.*
- [x] **07.** Test automatic deployment from GitHub. Make a harmless change and verify a fresh build; push only with approval. *Done 2026-10-20: push `c16b3b9` auto-deployed version `737b8257`.*
- [x] **08.** Make the repository private and test another deployment. **Owner:** change visibility only after the Cloudflare pilot works; note that GitHub Free may stop the original GitHub Pages publication. *Done 2026-10-20: repo private; old Pages URL 404; empty-commit push built version `bae8ee5a` from the private repo; site checks pass.*
- [x] **09.** Switch any live links only after verification. Check Cabinet embeds/links; demonstrate a manual redeploy/rollback and record a host-independent static artifact recovery route. *Done 2026-10-20: Cabinet links switched (commit `41a171f`, live verified); owner-run dashboard rollback and saved-artifact CLI redeploy on Cloudflare; host-independent route in DEPLOYMENT.md §7 (tested on local static servers).*

## 3. Bookshelf (4)

- [x] **10.** Audit MkDocs and the static gallery build. **Codex:** identify output directory, gallery assets, exhibits, navigation and absolute/relative paths. *Done 2026-10-20: Codex `TheBookshelfOfCuriosities/cloudflare migration/audit.md` (at `296a88f`).*
- [x] **11.** Deploy and test a Cloudflare preview **and local build**. **Claude Code:** implement only required build changes; verify galleries, Markdown pages, thumbnails, static exhibits and unchanged AI-independent CMS operation. *Done 2026-10-21: preview `bookshelf-of-curiosities.jesmehta.workers.dev`, byte-identical to local builds (220/220) across 3 automatic deploys; interaction tests 86/86; editor (CMS) tested unchanged; owner-run rollback and saved-artifact restore verified. Evidence: Bookshelf `cloudflare migration/migration-log.md`.*
- [ ] **12.** Make the repository private and verify deployment. **Owner:** approve visibility change; test a subsequent push and deployment.
  - *Prerequisite before 13 (unnumbered; shared with FFFX 17 and Cabinet 23):* confirm whether GoDaddy is registrar only or also authoritative DNS for `cabinetofcuriosities.in`. Workers Custom Domains need an active Cloudflare DNS zone, so a separate, owner-approved move of the whole zone (all subdomains, email and verification records, DNSSEC) may be needed first. See notes §8, "Existing domains and GoDaddy". Not exercised by the Dot Mandala pilot (no custom domain).
- [ ] **13.** Switch the Bookshelf subdomain and test. **Owner:** approve DNS/custom-domain changes; verify HTTPS, deep links and rollback.

## 4. FFFX (4)

- [ ] **14.** Audit build and static project routes. **Codex:** inspect data-driven landing, scripts, assets, project links and deployment assumptions. Preserve Dance of Planets / Island Generator publication gates; confirm their sensitive source is excluded from public output until separate protection work passes review (hidden links alone are insufficient).
- [ ] **15.** Deploy and test a Cloudflare preview **and local build**. **Claude Code:** implement minimal changes; verify subdivision landing, links, assets, interactive projects and unchanged AI-independent CMS operation.
- [ ] **16.** Make the repository private and verify deployment. **Owner:** approve visibility change; test a fresh deployment.
- [ ] **17.** Switch the FFFX subdomain and test. **Owner:** approve DNS/custom-domain changes; verify HTTPS, direct URLs and rollback.

## 5. Cabinet (6)

*Pre-check for any new Worker's Git connection (learned on FFFX, 2026-10-22):* add the repository to the GitHub App's
*Repository access* on **GitHub's** side (Installed GitHub Apps → Cloudflare Workers and Pages), not only by picking
it in Cloudflare's search. Then confirm there is no "disconnected from your Git account" banner on the Builds
settings page, and that a test push creates a new version. A public repository picked only in Cloudflare builds once,
then ignores pushes, and would fail after privatization. See `form-follows-fx/cloudflare migration/migration-log.md`.

- [ ] **18.** Audit the *actual* deployment workflow and external mounts. **Codex:** inspect `.github/workflows/deploy.yml`, MkDocs, `tools/assemble-external.js`, `content/external-repos.tsv`, validators and sitemap dependencies. Distinguish required build operations from authoring and GitHub Pages-only operations.
- [ ] **19.** Adapt the build for Cloudflare without changing site content. **Claude Code:** compare direct Cloudflare builds against retaining GitHub Actions for host-neutral artifact generation; document credential, maintenance, manual recovery and portability trade-offs; implement the approved option.
- [ ] **20.** Test the complete generated artifact **locally and on preview**. Verify mounted repositories, navigation, generated content, archived pages, routes, CMS independence, host-neutral output and exclusion of unintended development files.
- [ ] **21.** Repair sitemap private-repository dependencies. Remove or authenticate anonymous `raw.githubusercontent.com` reads as needed; validate generated sitemap output.
- [ ] **22.** Test private-source deployment. Verify the Cloudflare build and dependencies still work after the **owner-approved** repository visibility change.
- [ ] **23.** Switch the main domain and verify. **Owner:** approve Cloudflare custom-domain/DNS changes; test HTTPS, internal/external links, analytics and rollback.

## 6. Finalisation (4)

- [ ] **24.** Verify all source repository visibility settings against the intentional public/private classification.
- [ ] **25.** Check links, analytics, DNS, HTTPS and automatic deployments across all migrated sites.
- [ ] **26.** Remove obsolete deployment configuration **only when safe**; retain recoverable settings and note any GitHub Pages fallback no longer available for private repos on GitHub Free.
- [ ] **27.** Document ongoing maintenance, account permissions, local build/preview, deployment commands, manual incident recovery, host migration and rollback. **Owner:** test runbook without AI; **Codex:** perform final independent review.

---

## Operating rules

- **Codex:** read-only audit and independent post-change review; report verified findings separately from assumptions.
- **Claude Code:** implement bounded, approved changes; run tests and update the migration log; do not autonomously push, change visibility, alter DNS or remove hosting.
- **Owner:** authorise integrations and approve irreversible or public-facing changes.
- **Do not confuse:** private GitHub repositories protect repository contents; public sites still expose browser-delivered JavaScript.
- **Deferred:** using Workers as server-side APIs to hide selected algorithms (`browser parameters → Worker computation → returned results`). Do not refactor tools for this during the hosting migration.
- **Decision gate:** choose Pages or Workers with Static Assets based on the pilot audit and operational simplicity, not merely because Workers could host everything.

## Additional acceptance criteria (do not change the 27-step count)

- [ ] Local build/preview works for each migrated site; external/offline limitations are documented.
- [ ] Existing CMS/content editing remains AI-independent and unchanged.
- [ ] Build output can be served by an alternative static host without rewriting content.
- [ ] At least the pilot has a demonstrated manual deploy/rollback procedure.
- [ ] Cloudflare-specific settings are isolated and secrets are not committed.
- [ ] Future Workers-based tool conversions use the separate protected-tools guide; they are **not** part of this migration checklist.
