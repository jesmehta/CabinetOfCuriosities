# Cloudflare Migration — 27-Step Checklist

**Project:** Cabinet of Curiosities website ecosystem  
**Status:** Not yet verified; tick items only after completion  
**Reference:** `cloudflare-migration-notes.md`  
**Roles:** Codex audits and independently reviews; Claude Code implements and tests; owner approves account access, repository visibility, DNS and production changes.

**Sequence:** Dot Mandala pilot → Bookshelf → FFFX → Cabinet → finalisation. Maintain existing live deployments until replacements have been tested. Cloudflare Pages versus Workers with Static Assets is an implementation choice to assess during the pilot; server-side algorithm protection is a separate, deferred project.

## 1. Preparation (3)

- [ ] **01.** Verify existing GitHub and Cloudflare accounts, access and permissions.
- [ ] **02.** Inventory current deployment workflows, domains and dependencies. **Codex:** inspect actual repository configuration; do not assume remembered workflows are current.
- [ ] **03.** Create a migration log and rollback notes. **Claude Code:** record baseline URLs, settings, commands and decisions without changing production.

## 2. Dot Mandala — pilot (6)

- [ ] **04.** Audit the repository and identify its actual web root. **Codex:** report dependencies, deployment output, URLs, public assets, and recommend Pages or Workers with Static Assets.
- [ ] **05.** Configure a Cloudflare deployment. **Claude Code:** prepare minimal required build/config changes and documentation; **owner:** approve GitHub integration and Cloudflare project creation.
- [ ] **06.** Test the temporary Cloudflare URL. Check controls, rendering, exports, asset paths and browser errors; do not change live links.
- [ ] **07.** Test automatic deployment from GitHub. Make a harmless change and verify a fresh build; push only with approval.
- [ ] **08.** Make the repository private and test another deployment. **Owner:** change visibility only after the Cloudflare pilot works; note that GitHub Free may stop the original GitHub Pages publication.
- [ ] **09.** Switch any live links only after verification. Check Cabinet embeds/links and retain rollback instructions.

## 3. Bookshelf (4)

- [ ] **10.** Audit MkDocs and the static gallery build. **Codex:** identify output directory, gallery assets, exhibits, navigation and absolute/relative paths.
- [ ] **11.** Deploy and test a Cloudflare preview. **Claude Code:** implement only required build changes; verify galleries, Markdown pages, thumbnails and static exhibits.
- [ ] **12.** Make the repository private and verify deployment. **Owner:** approve visibility change; test a subsequent push and deployment.
- [ ] **13.** Switch the Bookshelf subdomain and test. **Owner:** approve DNS/custom-domain changes; verify HTTPS, deep links and rollback.

## 4. FFFX (4)

- [ ] **14.** Audit build and static project routes. **Codex:** inspect data-driven landing, scripts, assets, project links and deployment assumptions.
- [ ] **15.** Deploy and test a Cloudflare preview. **Claude Code:** implement minimal changes; verify subdivision landing, links, assets and interactive projects.
- [ ] **16.** Make the repository private and verify deployment. **Owner:** approve visibility change; test a fresh deployment.
- [ ] **17.** Switch the FFFX subdomain and test. **Owner:** approve DNS/custom-domain changes; verify HTTPS, direct URLs and rollback.

## 5. Cabinet (6)

- [ ] **18.** Audit the *actual* deployment workflow and external mounts. **Codex:** inspect `.github/workflows/deploy.yml`, MkDocs, `tools/assemble-external.js`, `content/external-repos.tsv`, validators and sitemap dependencies. Distinguish required build operations from authoring and GitHub Pages-only operations.
- [ ] **19.** Adapt the build for Cloudflare without changing site content. **Claude Code:** compare direct Cloudflare builds against retaining GitHub Actions for artifact generation; implement the approved simpler option.
- [ ] **20.** Test the complete generated artifact. Verify mounted repositories, navigation, generated content, archived pages, routes and exclusion of unintended development files.
- [ ] **21.** Repair sitemap private-repository dependencies. Remove or authenticate anonymous `raw.githubusercontent.com` reads as needed; validate generated sitemap output.
- [ ] **22.** Test private-source deployment. Verify the Cloudflare build and dependencies still work after the **owner-approved** repository visibility change.
- [ ] **23.** Switch the main domain and verify. **Owner:** approve Cloudflare custom-domain/DNS changes; test HTTPS, internal/external links, analytics and rollback.

## 6. Finalisation (4)

- [ ] **24.** Verify all source repository visibility settings against the intentional public/private classification.
- [ ] **25.** Check links, analytics, DNS, HTTPS and automatic deployments across all migrated sites.
- [ ] **26.** Remove obsolete deployment configuration **only when safe**; retain recoverable settings and note any GitHub Pages fallback no longer available for private repos on GitHub Free.
- [ ] **27.** Document ongoing maintenance, account permissions, deployment commands, incident recovery and rollback procedures. **Codex:** perform final independent review.

---

## Operating rules

- **Codex:** read-only audit and independent post-change review; report verified findings separately from assumptions.
- **Claude Code:** implement bounded, approved changes; run tests and update the migration log; do not autonomously push, change visibility, alter DNS or remove hosting.
- **Owner:** authorise integrations and approve irreversible or public-facing changes.
- **Do not confuse:** private GitHub repositories protect repository contents; public sites still expose browser-delivered JavaScript.
- **Deferred:** using Workers as server-side APIs to hide selected algorithms (`browser parameters → Worker computation → returned results`). Do not refactor tools for this during the hosting migration.
- **Decision gate:** choose Pages or Workers with Static Assets based on the pilot audit and operational simplicity, not merely because Workers could host everything.
