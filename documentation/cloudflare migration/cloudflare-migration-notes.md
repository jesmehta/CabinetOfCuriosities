# Website Hosting Migration — Intent, Decisions and Scope

**Project:** Cabinet of Curiosities website ecosystem  
**Status:** Dot Mandala hosting/privacy pilot complete and reviewed; Bookshelf audit next  
**Last updated:** 20 October 2026  
**Purpose of this note:** Preserve the reasoning, scope, decisions and constraints behind a possible migration from GitHub Pages to Cloudflare hosting. This is a project brief, not a deployment procedure.

**Current project decisions:** [Transition register](transition-register.md) records the hosting/private-source list, selected algorithm-protection targets, local-first Interactive Installations exception, intentionally open projects and unresolved image/data policies. It supersedes earlier provisional examples where they differ. Dot Mandala evidence and runbook now live on its private repository's `main`, under `cloudflare migration/` and `DEPLOYMENT.md`; the local-only `migration-docs` branch was merged and deleted.

## 1. Context

The websites and interactive tools are developed in GitHub repositories, often through VS Code, and many are currently published using GitHub Pages. Some sites are independently deployed; Cabinet also assembles content from several external repositories during its build.

The issue is not that the published websites are public. **Public access to the finished websites is generally desirable.** The concern is that public GitHub source repositories also expose their complete contents for browsing, cloning and downloading, including development history and files not intended as part of the public presentation.

The goal is to choose which repositories are public **deliberately**, rather than leaving them public because of a hosting constraint.

## 2. Motivation and desired outcome

- Keep selected **GitHub repositories private**, while continuing to publish their websites openly.
- Keep intentionally open-source code, teaching resources and documentation publicly accessible.
- Preserve existing public URLs, navigation, embedded projects, functionality and update workflows wherever possible.
- Avoid unnecessary recurring cost where practical, but **cost is secondary** to portability, comprehensibility, source protection, and low maintenance.
- Keep the system simple to maintain from VS Code, without unnecessary platform changes or refactoring.
- Avoid accidental publication of internal documentation, experiments and non-runtime files in deployment artifacts.
- Allow future, selective use of server-side computation for algorithms worth protecting, without making that part of the present migration.
- Distinguish **Cloudflare Workers as a static-site hosting platform** from **Cloudflare Workers as private computation/API endpoints**. They can be used together or separately.

**Success means:** private source where chosen; public and functioning websites; automatic deployment after approved pushes; existing AI-independent content management preserved; reproducible local builds; documented manual deployment and recovery; minimal ongoing maintenance.

## 3. Options considered

### A. GitHub Pro + GitHub Pages

Continue the current deployment model and pay for GitHub Pro to support Pages publishing from private repositories. This has the lowest immediate migration effort but adds a recurring subscription cost. Cloudflare Workers could still be used independently later.

### B. GitHub Free + Cloudflare hosting — preferred candidate

Use GitHub Free for private repositories and Cloudflare to build and serve the public sites. This avoids the GitHub Pro subscription for the hosting/privacy objective, but requires initial setup, deployment adaptation, testing and DNS cutover. **Saving the subscription is not the deciding objective.**

**Decision:** Pilot this option before committing to a full migration. Do not migrate solely to save subscription fees; prefer the architecture that can be operated and repaired without AI assistance. Cloudflare Pages versus Workers with Static Assets should be chosen based on current platform support and each repository's actual requirements; do not assume an existing browser tool needs a server-side Worker.

### C. GitHub Pro + Cloudflare for selected sites

Technically possible but duplicates hosting conventions while retaining the subscription. Consider only as an interim state or if a specific site requires it, not the desired end architecture.

## 4. Repository and publication policy

**Private source → public website (planned candidates):**
- Cabinet of Curiosities (main site)
- Bookshelf of Curiosities
- Form Follows f(x) / FFFX
- Dot Mandala Generator
- Other original generators, assessed individually (e.g., Tracery-related tools)

**Public source → public website (retain where intentional):**
- `p5-circle-packing` and other explicitly open-source libraries
- FabAcademy / Fabricademy public documentation on GitLab
- `working-with-ai` and selected teaching/open resources, subject to a repository-by-repository review

**Private source → no published application:**
- Origami/Kirigami tools may remain entirely private. A public article explaining the work and showing generated physical pieces or results is sufficient; publishing a live tool is **not** a requirement.

Bookshelf, FFFX and Cabinet are selected for privatization with public websites; this is not permission to change visibility in bulk. Review each repository before acting. Circle Packing stays open. SwatchFields, Warli Art Explorer and DataSelfies remain unresolved as detailed in the [transition register](transition-register.md). Interactive Installations remains local-first/browser-based without algorithm protection; its source visibility is a separate unresolved decision.

## 5. What migrates — and what does not

**Migrates:** website build/deployment and static hosting for selected sites; custom-domain routing when each site is ready; relevant deployment configuration and documentation.

**Remains:** GitHub as source control; VS Code and existing authoring workflows; site content and design; MkDocs and existing JS tools unless a specific compatibility fix is required; public/open repositories that are intentionally open. The three existing CMS/data-entry mechanisms and landing pages must continue to function without AI assistance.

**Not in scope now:** rebuilding the websites; redesigning Cabinet's information architecture; moving all algorithms server-side; implementing Origami authentication; adding Cloudflare Workers merely because they exist; changing every repo's visibility at once.

## 6. Known architectural dependencies

- **Cabinet:** builds MkDocs content and assembles several external repositories into its public output. Its current assembly process clones configured repos and copies source trees/subtrees into the published artifact. A repo made private will require authenticated build access if it is still cloned this way.
- **Publication risk:** any files copied into the publicly served output are publicly retrievable by URL, even if the source repository is private. A private repo does **not** make deployed HTML, CSS, JS, README files or experiments secret.
- **Bookshelf and FFFX:** independently published; Cabinet links to them rather than cloning them into its own build.
- **Sitemap tooling:** existing local sitemap generation has relied on anonymous raw GitHub TSV URLs for Cabinet/Bookshelf/FFFX; it must be adapted if those sources become private. This is not the same as the production site build.
- **Dot Mandala:** independently hosted and linked/embedded from Cabinet; a useful low-risk pilot.
- **Browser-side algorithms:** any JavaScript shipped to a public browser can be inspected, irrespective of GitHub repository visibility or hosting provider.

Before implementing Cabinet, re-audit the **current** workflow and dependencies rather than relying on an older summary.

## 7. Execution approach and responsibilities

**Tool roles:**
- **Codex:** independent, read-only repository audit and post-change review by default.
- **Claude Code:** implementation, local build/test, deployment scripts and documentation.
- **Owner:** approves repository visibility changes, account permissions, secrets, DNS changes, production cutovers and deletion of old hosting.

**Per-repository sequence:**
1. Codex audits the current repository, build output, URLs, dependencies and risks.
2. Claude Code proposes and implements the smallest required deployment changes.
3. Claude Code runs local checks, verifies a reproducible local build, and documents exact build/deployment commands and Cloudflare settings.
4. Deploy to a temporary Cloudflare URL; test it before altering the live domain.
5. Codex independently reviews the diff and deployment assumptions.
6. Verify automatic redeployment after a push.
7. Change repository visibility **only after** the alternative deployment is working; verify another build after the change.
8. Cut over the custom domain or Cabinet links only after verification.
9. Retain a practical rollback path until stable; then remove obsolete hosting configuration. Demonstrate a manual recovery path that does not require AI, and a way to redeploy the static artifact to a different host.

**Migration order:** Dot Mandala pilot → Bookshelf → FFFX → Cabinet. Cabinet comes last because of its multi-repository assembly and main-domain impact.

## 8. Sign-ups, access and secrets

- Use the existing Cloudflare account where possible; no second Cloudflare account is inherently necessary.
- Authorise Cloudflare's GitHub integration for **selected repositories**, not blanket access unless genuinely required.
- Cloudflare Pages/Workers configuration and custom-domain DNS changes require account access and deliberate approval.
- Cloudflare CLI or CI deployment, if chosen, may require scoped credentials; never commit tokens or secrets to a repository.
- Confirm whether the main domain already uses Cloudflare DNS before planning the apex-domain cutover. Do **not** change nameservers as an exploratory step.
- GitHub Pro is not required merely to keep GitHub repositories private; it is the alternative paid approach for retaining private-repo GitHub Pages publishing.

## 9. Risks, tests and recovery

| Risk | Check / mitigation | Recovery |
| --- | --- | --- |
| Different build environment | Pin/check Python, Node and dependencies; compare output | Fix build configuration; keep old site active |
| Incorrect output directory | Inspect artifact for required pages/assets and unwanted files | Correct output configuration and redeploy |
| Broken paths or embeds | Test nested URLs, galleries, static exhibits, exports and Cabinet links | Fix base paths or restore previous deployment |
| Private cross-repo clone failure | Audit Cabinet mounts and credentials before privacy changes | Keep required source public temporarily or add scoped authentication |
| Sitemap update failure | Remove anonymous raw-GitHub dependency | Use authenticated/local data reads; retain previous generated sitemap meanwhile |
| DNS or HTTPS disruption | Test temporary URL first; switch one domain at a time | Restore previous DNS/hosting configuration if still available |
| Accidental exposure of development files | Review exact public artifact, especially external mounts | Exclude files and redeploy; assume already served copies may persist |
| Build quotas / CI churn | Check current free-tier limits and expected push frequency | Reduce redundant builds or revise deployment method |

**Important rollback caveat:** Making a repository private on GitHub Free may interrupt its old GitHub Pages deployment. Therefore the previous host is not automatically a reliable rollback *after* the visibility switch. Keep a known-good deployable artifact and a tested alternative recovery plan, not merely an assumption that old Pages will remain live.

## 10. Explicit decisions and open questions

**Agreed:**
- Public websites should remain public; selected source repositories should become private.
- Cloudflare is worth piloting because it may eliminate the recurring GitHub Pro cost.
- Avoid the long-term dual-hosting complexity of Option C.
- Origami live-tool publication/passwording is not a migration priority.
- Use Claude Code for implementation and Codex for independent audit/review.
- Migrate one site at a time, with Cabinet last.

**Additional agreed constraints:** local-first development; portable generated static artifacts; content updates and CMS operation must not require AI; Cloudflare-specific code should be isolated; no unrequested CMS/framework redesign; algorithm modules should support local headless/batch use when applicable.

**Still to verify/decide:**
- Whether Cloudflare Pages or Workers with Static Assets is the simplest current deployment target for each site.
- Actual build/output settings for each repository (do not guess).
- Current Cloudflare DNS status for the apex domain and required cutover steps.
- Which additional tool repositories should remain public or become private.
- Whether Cabinet should build inside Cloudflare or retain GitHub Actions and deploy its finished artifact to Cloudflare.
- Current Cloudflare free-tier limits and any account-specific constraints.
- Whether a GitHub Education benefit changes the cost comparison; this does not block the pilot.

## 11. Cloudflare Workers: two distinct roles

We discussed Workers in **two different senses**, which should not be conflated.

### 11.1 Workers as private algorithm/API backends (selective, future)

For original JavaScript tools where exposing the actual algorithm is undesirable, the browser can become a lightweight interface rather than performing the sensitive computation locally:

```text
Public browser UI (HTML/CSS/limited JS)
    → sends inputs/parameters over HTTPS
Cloudflare Worker (server-side, source not delivered to visitor)
    → computes geometry / text / SVG / other result
Browser
    ← receives computed output and renders it
```

**What this achieves:** the visitor can inspect the browser interface and API requests/responses, but cannot directly download the Worker implementation as served frontend JavaScript. This is stronger algorithm-source protection than merely privatizing the GitHub repo.

**What it does not achieve:** concealment of inputs, outputs, API shape, or observable behaviour; prevention of reverse engineering; prevention of copying generated outputs; automatic protection against scraping or abusive API use. Where relevant, add request validation, rate limits/abuse controls and usage monitoring. Authentication is optional and a separate decision.

**Trade-offs:** existing browser algorithms must be refactored into frontend/backend boundaries; network round trips can make interactive sliders and live previews less responsive; offline use is lost for server-dependent operations; compute limits, invocation counts, API errors and maintenance become relevant. Some animation-heavy or per-frame p5.js sketches are poor candidates. Computation-heavy geometry or discrete SVG generation may be better candidates, subject to benchmarking.

**Decisions:** Algorithm protection is a separate workstream for Dance of Planets and Island Generator within FFFX, Dot Mandala, and Origami Tools. These targets require individual audits/designs before implementation; selection is not approval of a particular Worker conversion. Origami may remain unpublished altogether. Keep FFFX's existing publication gates until protection is verified, including exclusion of source files from public output. Live Video Filter and Gesture Kaleidoscope are excluded from protection for now and stay local-first/browser-based. See the [transition register](transition-register.md).

Workers APIs can also be used with **GitHub Pages + GitHub Pro**; they do **not** require moving frontend hosting to Cloudflare. A GitHub-hosted frontend can call a Worker at a `workers.dev` URL or a configured API domain, subject to CORS and normal API configuration.

### 11.2 Workers with Static Assets as the website host (alternative to Pages)

Separately, Cloudflare **Workers with Static Assets** can host ordinary static site files (HTML, CSS, JS, images) and, if needed, handle dynamic requests within the same Cloudflare application. In that role, Workers can **replace Cloudflare Pages as the deployment/hosting target**, rather than being an additional API bolted onto Pages.

```text
Private GitHub repository
    → build/static output
Cloudflare Workers with Static Assets
    → public site and optional Worker-backed API routes
```

This is what was meant by the earlier remark that Workers might **supersede the Cloudflare Pages approach**. It does **not** mean Workers replace GitHub source control, VS Code, MkDocs, or the need to build the site. It also does **not** automatically hide frontend JavaScript: static JS served by Workers is just as inspectable as JS served by Pages. Only code executed server-side and not sent to the browser remains private.

**Practical implication:** Before implementing each site, compare:

- **Cloudflare Pages:** static-site-oriented deployment and Git integration.
- **Workers with Static Assets:** static hosting with optional server-side routes, using its own build/deployment workflow.

Choose based on **current** Cloudflare documentation, free-tier constraints, Git integration/deployment ergonomics, build output, custom domains and operational simplicity. Do not assume Workers with Static Assets requires private computation, or that Pages prevents adding a separate Worker API later.

**Status:** Dot Mandala uses Workers with Static Assets and its hosting/privacy pilot is complete. Reassess the simplest host/build configuration for each remaining site against its actual requirements. The goal is straightforward hosting for ordinary sites, with server-side computation treated separately.

## 12. Portability, local use, and AI independence (agreed requirements)

**Website baseline:** Cabinet, Bookshelf and FFFX should remain coherent source projects and support local builds/preview independent of Cloudflare. The preferred target is **local build capability**, not merely recoverable source. A site may link to external projects that are not available offline; document those dependencies rather than claiming the entire ecosystem is offline.

- Keep Markdown, TSV/JSON, assets, MkDocs and existing CMS interfaces in their present authoring model.
- Provide documented, copyable local build and preview commands, with pinned or recorded dependencies.
- Keep provider-specific deployment settings separate from content and build logic. A finished static output directory should be usable on another static host.
- Ensure ordinary content addition, publishing, and restoration can be performed from a short manual runbook **without Codex or Claude Code**.
- Do not assume that keeping a GitHub Pages workflow means GitHub Pages remains a usable fallback once a repo is private on GitHub Free. Retain a tested artifact and alternative redeployment procedure.
- **Cabinet build decision remains open:** compare (A) Cloudflare builds from the private repository with (B) GitHub Actions/local scripts generating a host-neutral artifact then deploying to Cloudflare. Judge total moving parts, credential requirements, reproducibility, and manual recovery; do not choose by preference alone.

**Pilot acceptance tests:** (1) local build/preview, (2) automated Cloudflare deploy, (3) private-repo redeploy, (4) manually repeatable deploy or rollback, and (5) a plausible tested path for publishing the static output on another host. The pilot does not need to become a Worker-backed tool.

## 13. Protected computational tools: algorithm-first architecture (future guidance)

For selected original generators, separate the **algorithm** from all of its interfaces, not just the browser from the Worker:

```text
                 Independent JS algorithm library
                    /         |            \
          Local UI       Node CLI/batch     Worker API
          (offline)       (offline)         (public tool)
                                               |
                                        Public browser UI
```

- Keep core geometry/generation functions as pure or platform-neutral JavaScript where practical; do not import browser DOM APIs, Cloudflare bindings or Worker-specific globals into core modules.
- One private repository and one algorithm implementation; **no parallel local and deployed algorithm**.
- Public browser assets contain only the interface and non-sensitive logic. Server-only algorithm modules must never be included in the static asset bundle.
- Run the UI and Worker locally with a preinstalled Wrangler toolchain; offline operation should be **tested with networking disabled**. Wrangler startup or external dependencies may still require connectivity if not installed/cached.
- Expose the same core functions through a local Node CLI for direct/headless use without a web server. Support parameter grids, deterministic output naming and reproducible SVG/JSON/CSV manifests when relevant.
- Preserve workflows like generating ~175 Origami variations by enumerating parameter combinations; AI may help create scripts but must not be required to run them repeatedly.
- Workers protect source implementation, not outputs, API behaviour or underlying ideas. Consider rate limiting and abuse controls if a public compute API is exposed.
- Keep the Worker as a thin, replaceable adapter so the same core can move to another JavaScript server runtime later.

**Scope decision:** These requirements govern *future protected tools* and any separately approved conversion. They do **not** expand the present website-hosting migration into refactoring all existing generators.

## 14. Working principle

**Privacy is a repository/publication decision; hosting is the mechanism that makes that decision possible.**

Keep the first phase focused on private source + public static output. Revisit server-side Workers only for specific algorithms whose protection justifies refactoring, API latency and ongoing maintenance.
