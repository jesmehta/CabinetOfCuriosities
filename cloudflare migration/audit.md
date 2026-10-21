# Cabinet — initial Cloudflare migration audit

Recorded **2026-10-21 02:29:09 IST**. Auditor: Codex. Implementer: Claude Code.

**Exact source reviewed:** `33788afab468d42f3841eb62cbbbca83a3d460e0`, local `main`, `CabinetOfCuriosities`. This is a fresh workflow/source audit, not a restatement of the older privacy audit. Existing unrelated local changes were present: `docs/_assets/material/css/cabinet-material.css`, `documentation/scratchNotes.md`, untracked `docs/_images/paper2025_26/` and `docs/teaching/paper2025.md`. They were not edited, staged, built or treated as committed migration content. Clean-checkout reproduction must use the recorded SHA; do not sweep these changes into implementation.

Requirements read: current migration notes, 27-step checklist, transition register, Codex instructions and existing DNS-review context. Only this report was written in Cabinet. No builds, installations, editor/sitemap runs, fetches, account changes, commits, pushes or deployments occurred.

## 1. Actual deployment pipeline

Evidence: `.github/workflows/deploy.yml:1`, `mkdocs.yml:1`, `docs/CNAME`, `requirements.txt`, `tools/assemble-external.js:1`, `content/external-repos.tsv:1`, `tools/validate-deployment.js:1`.

Push to `main` triggers GitHub Actions. The workflow checks out this repo, selects Python `3.x` and Node `20`, installs `requirements.txt`, rejects `docs/index.md`, runs/checks the committed generated content, builds MkDocs strictly, assembles external repositories, copies archived landing pages, validates routes, uploads `public/`, and deploys Pages. There is no manual-dispatch/source-repo trigger in this inspected workflow.

Verified command/operation sequence (not executed by Codex):

```text
python -m pip install -r requirements.txt
reject docs/index.md
node tools/build-cabinet-content.js
node tools/build-now-content.js
git diff --exit-code -- docs/_assets/backend/js/cabinet-generated-content.js
  docs/_assets/backend/js/now-data.js docs/_assets/backend/js/now-markdown.js docs/compass/now.md
mkdocs build --site-dir public --strict [capture stdout/stderr to mkdocs-build.log]
node tools/assemble-external.js --public-dir public
copy archived-landing-pages/ to public/archived-landing-pages/
node tools/validate-deployment.js --public-dir public --build-log mkdocs-build.log
```

The final root is **assembled `public/`**, not the source repo or `docs/` alone. Markdown, teaching/gallery images, standalone pre-rendered homepage, Now content, external apps and historical sites all contribute. A plain `mkdocs build` or `mkdocs serve` omits external mounts/archive assembly and is not a full deployment preview.

### Source identity and paths

`docs/CNAME` is `cabinetofcuriosities.in`. `mkdocs.yml` currently has **no `site_url`**, while validator `main()` reads `docs/CNAME` to recognize self-domain links (`tools/validate-deployment.js:233`). Do not remove CNAME as a “Pages-only” file without replacing that input. Recommend explicit canonical site_url and a provider-neutral validator input, with generated sitemap/canonical changes verified. Raw self-domain nav URLs would otherwise take preview users back to production; convert only self-links where justified and port root-relative/homepage validation tests (current resolver skips `/`; nav checker recognizes only full-domain URLs). Keep sibling/Fab/external links external.

Material uses `overrides/`, video, section-index, glightbox and two `mkdocs-redirects` mappings to canonical FFFX articles. Preserve old-route behaviour and galleries/zoom. Requirements are mostly unpinned; section-index 0.3.10 and redirects 1.2.2 are deliberately pinned and must not be casually upgraded during migration.

## 2. Build-time external dependency map

Eight active mount rows refer to six repositories:

| Source repo | Source | Cabinet destination |
| --- | --- | --- |
| `jesmehta/working-with-ai` | root | `/teaching/working-with-ai/` |
| `jesmehta/PromptGenerator` | root | `/teaching/prompt-generator/` |
| `jesmehta/ObliqueStrategies` | root | `/teaching/oblique-strategies/` |
| `jesmehta/SSD_Student_Work` | `ssd-creative-coding-2025-26/` | `/teaching/ssd-creative-coding-2025-26/` |
| same SSD repo | `ssd-creative-coding-2024-25/` | `/teaching/ssd-creative-coding-2024-25/` |
| same SSD repo | `ssd-creative-coding-2023-24/` | `/teaching/ssd-creative-coding-2023-24/` |
| `jesmehta/swatchFields` | root | `/swatch-fields/` |
| `jesmehta/TraceryBots` | root | `/tracery-bots/` |

The assembler shallow-clones `https://github.com/<repository>.git` **per row**, default branch tip, with no ref/commit column or explicit credential. It copies the chosen tree recursively, removes only the destination root `.git`, checks collisions/required files/required text, and fails the overall build when any row fails. It does not build those apps or filter them into production bundles. SSD is cloned three times. New external commits do not themselves trigger Cabinet deployment.

### Important/blocking dependencies

- **If all six sources remain public**, Cabinet itself becoming private does not inherently break these anonymous clones. Their actual current remote visibility was not queried here; confirm it rather than carrying forward a past audit's public status.
- **If any source becomes private**, selected access to Cabinet in Cloudflare or Cabinet's Actions GITHUB_TOKEN is not by itself proof of cross-repo access. Provide scoped authenticated checkout in the actual assembler execution path and test it before that source's visibility changes. Do not put credential-bearing URLs into error logs/artifacts.
- **Reproducibility currently depends on moving remote tips.** A Cabinet commit alone does not identify a complete release. Record/pin external resolved SHAs and deterministic mount/filter inputs, and save the finished artifact for recovery. Compare local/hosted outputs using the same external revisions; “same Cabinet SHA” alone is insufficient.
- **Full local/offline recovery needs source snapshots or the saved artifact.** Current assembler always reclones and needs network. Propose a local-source/cache/snapshot option with the same filtered assembly semantics, or explicitly document cold-build network use and guarantee saved-artifact restoration independently. Do not duplicate source maintenance manually.

Bookshelf and FFFX are independently hosted links, not source clones in this manifest. Dot Mandala uses its separate public Worker link. Fab/GitLab sites likewise remain external; this migration does not move or privatize them.

## 3. Publication boundary needs a per-mount and archive policy

Changing source visibility does not hide files copied into the site. Root mounts can expose README/config/tooling/internal data along with runtime files. Nested metadata, credentials or development-only paths are not excluded by stripping one `.git`. `requiredFiles` proves presence, not absence of unwanted files.

Current archive copy includes `archived-landing-pages/README.md`, v2 `DESIGN-SYSTEM.md`/`LANDING-PAGE-NOTES.md`, v1 debug maps and historical downloadable deployment/requirements files. Native `docs/_downloads/deploy.yml.txt` and `requirements.txt` also exist. Some downloads are intentional public teaching/history assets; do not port a blanket Bookshelf “all txt/config filenames forbidden” policy without route/link inspection and an owner decision. Preserve intentional historical URLs, or record approved removals and their consequences, including the archived Dot Mandala link decision.

Use explicit publication manifests or audited runtime filters per mount/archive, with missing-policy, path escape, symlink, collision and accidental-file rejection tests. Never serve repo-level migration docs, editors, secret files, scratch source or landing dev tools. Check browser network paths, scripts/modules, fonts/licences, JSON, audio, WASM and media before reducing mounts. SwatchFields' open/closed split is still TBD and Tracery's future protection is not authorized by this audit; neither should be silently redesigned here.

Source-only measurements: `docs/` currently has 234 files, approximately 35.3 MB, largest `index.html` about 6.72 MB. These include the local dirty/untracked state and are **not deployed-artifact measurements**. Existing local `_external` snapshots include WASM assets around 9.6 MB. Do not infer the final size/count or free-tier suitability from native docs alone: remote mounts and archives dominate additional content. Measure actual artifact counts and every file against current platform limits after filtering.

## 4. Keep authoring distinct from publication

- `tools/cabinet-editor.js` serves localhost **5858** for sections/entries/external-manifest editing.
- `tools/now-editor.js` serves localhost **5757** for Now authoring.
- `tools/admin-controls.js` serves localhost **5959**, starts the editors and invokes generation, sitemap, landing build/promote and MkDocs checks.
- `content/cabinet-{sections,entries}.tsv`, `content/now.tsv`, and public frontend config drive committed generated assets/Markdown. Preserve their schemas and CMS behaviour.
- `landing-v3/build-static.mjs` uses Playwright/headless Chromium to render the landing SVG into `landing-v3/index.html`; `promote.mjs` copies/repaths approved HTML/shared assets into `docs/`. `landing-v3/package.json` pins Playwright 1.62.1. **Neither command runs in the current deployment workflow.** CI consumes promoted committed output. Do not add Chromium to every cloud build merely because a local authoring tool uses it.
- `tools/generate_sitemap.py` now reads sibling local clones (Cabinet/FFFX/Bookshelf), supports overrides and `--offline`, and bounds non-interactive freshness fetches. The old anonymous-raw dependency is repaired in source. This remains a local authoring/maintenance command, not part of CI; a single-repo Cloudflare checkout does not include sibling clones automatically. Test the real admin button and preserve its contract.

Root batch launchers hardcode the local checkout; admin invokes `python`/`mkdocs` on PATH. Provide portable launchers and a consistent pinned environment, including spawned child servers/checks. Bookshelf demonstrated that a globally installed MkDocs may belong to a different Python. Preserve user actions without AI: edit TSVs, regenerate, build/promote when required, inspect/commit outputs, full artifact build, preview, deploy, restore. No CMS/framework/landing redesign or algorithm refactor is justified.

Runtime external dependencies include Google Fonts, analytics, external embeds/links and whatever each assembled app loads. Playwright/browser installation is an authoring prerequisite, not a static runtime requirement. Enumerate local/online/offline capabilities rather than claiming everything works offline.

## 5. Hosting/build options and recommendation

Recommend **Workers with Static Assets, serving only the complete filtered `public/`, no server script**, subject to measured output limits and tested assembly credentials. Cloudflare Pages can also serve this output; no current feature requires Pages over the established Worker convention. Keep `cabinetofcuriosities.in` and intended `www` redirect, with temporary workers.dev validation first.

Unlike a simple tool, **build placement is conditional on external-source policy**:

| Approach | Benefit | Cost/credential and recovery considerations |
| --- | --- | --- |
| Direct Cloudflare Git build | Follows pilots; selected access covers private Cabinet checkout; Python/Node support already demonstrated by Bookshelf | External clones still need explicit private access if applicable; test installation limits, time, asset counts and log secrecy. Cloudflare Git access is not automatically inherited by ad-hoc clones |
| GitHub Actions builds host-neutral artifact, deploys via Wrangler | Preserves current runner and validations; useful where scoped GitHub multi-repo checkout is simpler | Adds Cloudflare deployment secret plus cross-repo credentials where needed; default GITHUB_TOKEN is insufficient for other private repos. Do not maintain a separate build implementation |
| Local/snapshot artifact build and upload | Essential manual fallback and reproducibility route | Must resolve external versions and filtering identically; local Git auth should stay in approved credential mechanisms; saved artifact can restore without recloning |

**Conditional preference:** start with direct Cloudflare builds if the chosen source set is public or scoped private assembly is demonstrated cleanly. Prefer retaining Actions if actual cross-repo authorization/build constraints make it simpler. Claude's plan must compare concrete credential scope and total moving parts before selecting; this audit does not assume the pilot proves Cabinet assembly.

Extract one provider-neutral full build and use it locally and in the existing Actions pipeline during overlap; avoid changing live output unintentionally. Pin tested Python dependencies and deployment tooling; isolate `.mjs` tooling from existing CommonJS, keep the existing nested landing package intact. Record generated times deterministically for same-commit/same-input comparisons. Plain-XML-only sitemap policy was approved for Bookshelf, not automatically Cabinet; get a per-site decision. Adding `site_url` may produce new sitemap/canonical metadata and needs explicit comparison.

Provider-specific configuration should identify the owner-approved Worker name, `assets.directory: ./public`, real custom 404 behaviour, deliberate version/branch policy, and later custom-domain configuration. Use build-watch exclusions for internal documentation only, not `docs/`, `content/`, external manifest/version inputs or landing runtime/promoted outputs. Remote source changes require an explicit documented rebuild trigger policy.

Official references consulted in this migration session: [Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [limits](https://developers.cloudflare.com/workers/platform/limits/), [builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/). Limits are not account-specific acceptance evidence. Verify per-file size/counts and build time on Cabinet's real artifact.

## 6. Acceptance gates and owner involvement

1. Agree exact source snapshot (excluding unrelated dirty work), external public/private classification, revision pins and publication manifests, plus intentional archive/download retention. No production push until policy changes are reviewed.
2. Clean full local build reproduces native pages + all eight mounts + archives, captures log and checks all routes. Record external SHAs, source SHA, dependency versions, file counts/sizes and manifest hashes. Missing/private clone, missing required file/content, collision, invalid path and leaked internal files must fail.
3. In disposable copies, exercise Cabinet editor, Now editor and admin generation; landing build/promote with preinstalled browser; sitemap with sibling clones/offline and real admin action; then full artifact. Verify editor schema/state, committed-output checks and no implicit cloud-only authoring requirement.
4. Baseline and preview tests: static landing map, dragons/compass interactions and mobile behaviour, navigation, Now, sitemap, gallery lightbox, teaching routes, all mount apps, bot nesting, exports/camera/media where included, archives and intentional downloads, redirects to FFFX, external world/Fab/Dot Mandala links. A route-existence check alone is not functional evidence. No private/editor/dev source at negative URLs.
5. Compare same-source/same-external-revision artifacts locally and on chosen hosted build. Test regular push and intended docs/branch watch behaviour. Record token permissions without equating separate token names to per-Worker isolation.
6. Owner demonstrates real rollback and saved-artifact redeployment; archive a verified artifact/configuration outside the repo. Test serving it at an independent root-host static server with custom 404 handling, without rebuild or AI.
7. Only after shared-zone acceptance and explicit main-domain approval, attach apex hostname; retain the correct `www` behaviour with HTTPS/path/query preservation and test all worlds. A Custom Domain is exact-host matching, not implicit www coverage. Record certificate state and the approved cache-drain period before Pages unbinding/privatization.
8. Owner privatizes Cabinet only after replacement is healthy; verify a new private-source deployment, cross-repo auth if any source changed, signed-out public health and local maintenance. Retire old workflow/settings only after stable operation and documented recovery boundary.

Registrar, DNS/custom domains, GitHub App access, token creation/scope, production pushes and visibility remain owner-controlled. Shared-zone DNS work does not itself migrate Cabinet hosting. Post-privatization rollback uses the known-good Worker/artifact; restoring old GitHub DNS alone may create an outage. No broad account access or nameserver change is authorized here.

## 7. Evidence limits and decision

**Post-audit discussion, recorded 2026-10-21:** external-repository sub-pages remain paths within one world deployment; standalone hosting is a separate decision. This is a shared requirement for Cabinet, Bookshelf and FFFX, even though only Cabinet currently clones external sources in its deployment pipeline. Future mounts need source/revision, destination, publication policy, credentials where applicable and validation. See [World assembly and deferred tools](../documentation/cloudflare%20migration/world-assembly-decisions.md). No framework or build change was made here.

**Verified:** local source SHA, dirty-state inventory, current pipeline/scripts, eight-row/six-repo assembly and broad copies, no explicit assembler credential/ref pins, missing mkdocs site_url and validator CNAME dependency, local editor/landing authoring architecture, new local-clone sitemap implementation, intentional archive/download candidates.

**Inferred:** native pages and assembled output can run on Workers static hosting, platform-root portability after URL/config changes, current deployment follows the inspected workflow. **Untested:** fresh full build, cloud environment/auth, remote source visibility/current SHAs, generated output dimensions, browser functions, live DNS/Pages/dashboard state, current local CMS/sitemap button and landing browser installation, hosted/private-source deploy and recovery. Existing `_external` checkouts are not proof of reproducibility or current remote state.

**GO for a bounded Claude implementation plan and isolated local experiments. NO-GO for production cutover or privatization.** Required first decisions are external publication/source-auth policy, reproducible external input selection and build placement; preserve existing CMS/landing workflows. This report is the only authorized write here; no application changes were made.
