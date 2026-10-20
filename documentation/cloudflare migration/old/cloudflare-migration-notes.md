# Website Hosting Migration — Intent, Decisions and Scope

**Project:** Cabinet of Curiosities website ecosystem  
**Status:** Planned; pilot not yet verified  
**Last updated:** 20 October 2026  
**Purpose of this note:** Preserve the reasoning, scope, decisions and constraints behind a possible migration from GitHub Pages to Cloudflare hosting. This is a project brief, not a deployment procedure.

## 1. Context

The websites and interactive tools are developed in GitHub repositories, often through VS Code, and many are currently published using GitHub Pages. Some sites are independently deployed; Cabinet also assembles content from several external repositories during its build.

The issue is not that the published websites are public. **Public access to the finished websites is generally desirable.** The concern is that public GitHub source repositories also expose their complete contents for browsing, cloning and downloading, including development history and files not intended as part of the public presentation.

The goal is to choose which repositories are public **deliberately**, rather than leaving them public because of a hosting constraint.

## 2. Motivation and desired outcome

- Keep selected **GitHub repositories private**, while continuing to publish their websites openly.
- Keep intentionally open-source code, teaching resources and documentation publicly accessible.
- Preserve existing public URLs, navigation, embedded projects, functionality and update workflows wherever possible.
- Avoid paying for GitHub Pro solely to publish public sites from private repositories if a reliable free alternative exists.
- Keep the system simple to maintain from VS Code, without unnecessary platform changes or refactoring.
- Avoid accidental publication of internal documentation, experiments and non-runtime files in deployment artifacts.
- Allow future, selective use of server-side computation for algorithms worth protecting, without making that part of the present migration.
- Distinguish **Cloudflare Workers as a static-site hosting platform** from **Cloudflare Workers as private computation/API endpoints**. They can be used together or separately.

**Success means:** private source where chosen; public and functioning websites; automatic deployment after approved pushes; minimal ongoing cost and maintenance; documented recovery steps.

## 3. Options considered

### A. GitHub Pro + GitHub Pages

Continue the current deployment model and pay for GitHub Pro to support Pages publishing from private repositories. This has the lowest immediate migration effort but adds a recurring subscription cost. Cloudflare Workers could still be used independently later.

### B. GitHub Free + Cloudflare hosting — preferred candidate

Use GitHub Free for private repositories and Cloudflare to build and serve the public sites. This avoids the GitHub Pro subscription for the hosting/privacy objective, but requires initial setup, deployment adaptation, testing and DNS cutover.

**Decision:** Pilot this option before committing to a full migration. Cloudflare Pages versus Workers with Static Assets should be chosen based on current platform support and each repository's actual requirements; do not assume an existing browser tool needs a server-side Worker.

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

This is a **provisional classification**, not permission to change visibility in bulk. Review each repository before acting.

## 5. What migrates — and what does not

**Migrates:** website build/deployment and static hosting for selected sites; custom-domain routing when each site is ready; relevant deployment configuration and documentation.

**Remains:** GitHub as source control; VS Code and existing authoring workflows; site content and design; MkDocs and existing JS tools unless a specific compatibility fix is required; public/open repositories that are intentionally open.

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
3. Claude Code runs local checks and documents the exact Cloudflare settings.
4. Deploy to a temporary Cloudflare URL; test it before altering the live domain.
5. Codex independently reviews the diff and deployment assumptions.
6. Verify automatic redeployment after a push.
7. Change repository visibility **only after** the alternative deployment is working; verify another build after the change.
8. Cut over the custom domain or Cabinet links only after verification.
9. Retain a practical rollback path until stable; then remove obsolete hosting configuration.

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

**Decisions:** This is an **available selective protection technique, not a requirement for the initial migration**. Assess tools individually. Dot Mandala and Origami/Kirigami were discussed as possible examples, **not approved Worker conversions**. Origami may remain unpublished altogether. No commitment has been made to refactor all generators.

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

**Status:** The platform choice (Pages versus Workers with Static Assets) is **open**, pending the pilot audit. The goal is one straightforward hosting mechanism for ordinary sites, with server-side computation only where justified.

## 12. Working principle

**Privacy is a repository/publication decision; hosting is the mechanism that makes that decision possible.**

Keep the first phase focused on private source + public static output. Revisit server-side Workers only for specific algorithms whose protection justifies refactoring, API latency and ongoing maintenance.
