# Codex — Cloudflare Migration Audit and Independent Review

**Role:** Read-only auditor and independent reviewer. **Implementer:** Claude Code. **Authority:** Owner approves credentials, pushes, visibility, DNS and production changes.

**Read first:** `cloudflare-migration-notes.md` and `cloudflare-migration-27-step-checklist.md`. Inspect current repository files rather than relying on prior audits. Treat the hosting migration and future Worker algorithm protection as separate projects.

## Prompt A — Initial repository audit (copy into Codex)

> Audit this repository for a potential migration from GitHub Pages to Cloudflare hosting, allowing a private GitHub source repository with a public site. **Read only: do not edit files, install packages, push commits or change account settings.**
>
> Read the migration notes and checklist. Inspect the actual entry points, docs, MkDocs/configuration, data/TSV/JSON, existing CMS/editor, assets, scripts, package files, CI workflows, deploy targets and custom-domain assumptions.
>
> Report:
> 1. Current architecture, exact build commands, output directory, deployment triggers, domain/base-path assumptions, and evidence (file paths/lines).
> 2. Whether the site builds and previews locally without Cloudflare; which operations require network access; whether the output is host-neutral.
> 3. Whether existing content editing and CMS operation will remain AI-independent. Identify any migration proposal that would alter content, data schemas, galleries, landing pages or MkDocs unnecessarily.
> 4. Files publicly served today, development-only files at risk of accidental publication, browser-visible JS, and any cross-repository dependencies or private-repo clone failures.
> 5. Compare Cloudflare Pages and Workers with Static Assets **as hosting**, not as algorithm protection. Recommend the simplest maintainable target based on actual needs and current platform documentation where accessible.
> 6. Compare direct Cloudflare builds and existing GitHub Actions/local builds that deploy a finished static artifact. Include credentials, operational complexity, portability, and manual recovery. For simple repos, keep comparison brief.
> 7. Proposed minimum changes, exact tests, deployment permissions and manual steps, risks and rollback (including GitHub Free private-repo Pages limitations).
> 8. Can the owner reproduce a build, preview, deployment and rollback from a short runbook **without AI**? If not, specify what's missing.
>
> Separate **verified**, **inferred**, and **unverified** findings. Do not assume a `public/` output directory, `main` branch, or build command. End with a clear go/no-go recommendation for the pilot or next site.

## Prompt B — Post-implementation independent review (copy into Codex)

> Review Claude Code's changes for the Cloudflare migration. **Read only; do not modify files.** Compare the working tree/diff against the pre-migration baseline and the migration notes.
>
> Check: minimality of changes; unchanged CMS/data workflows; reproducible local build; host-neutral artifact; Cloudflare configuration and secret handling; exact output directory; absence of unintended published files; build/deploy trigger behaviour; private repo compatibility; links/assets/exports; and rollback/manual runbook quality.
>
> Run only safe read-only checks available in this environment. If execution is needed, ask for approval rather than modifying the repository. Distinguish tests actually run from suggested manual tests.
>
> Report findings by severity (blocking / important / optional), with file paths, concrete reproduction steps and the smallest suggested fix. Give an explicit deployment readiness assessment.

## Cabinet-specific audit addendum

Inspect the **current** `.github/workflows/deploy.yml`, `mkdocs.yml`, `requirements.txt`, `tools/assemble-external.js`, `content/external-repos.tsv`, route validators and sitemap tooling. Distinguish build-time generation from validation and local-only authoring. Determine which external clones remain public, whether source trees are copied wholesale into public output, and whether local builds can recreate the complete artifact. Evaluate Cloudflare-native versus GitHub Actions artifact deployment on evidence, not a preconceived preference.

## Acceptance gates

- Local build and preview documented and demonstrated.
- No unapproved CMS/content refactor.
- Private source deploy tested without assuming GitHub Pages rollback survives.
- At least the pilot's manual deploy/restore and alternative-host route are credible and exercised.
- Findings and uncertainties are recorded in the migration log.
