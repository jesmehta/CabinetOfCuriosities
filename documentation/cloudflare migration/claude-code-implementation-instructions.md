# Claude Code — Cloudflare Migration Implementation Instructions

**Role:** Implement approved, bounded changes and tests. **Independent auditor:** Codex. **Owner:** approves external access, pushes, visibility, secrets, DNS, production cutover and removal of old hosting.

Read `cloudflare-migration-notes.md`, `cloudflare-migration-27-step-checklist.md`, and the current Codex audit before modifying anything. The goal is **private source + public sites with portable local builds**, not a redesign.

## Prompt A — Plan after Codex audit

> Read the attached/current Codex audit and migration notes. Inspect the repository to confirm audit findings. **Do not modify files yet.** Propose the minimum deployment changes to support private GitHub source and public Cloudflare hosting.
>
> Preserve existing Markdown, MkDocs, TSV/JSON, gallery/CMS, frontend behaviour and ordinary AI-independent content updates. Compare Cloudflare-native build against host-neutral local/GitHub Actions build plus Cloudflare upload. Choose based on fewer moving parts, reproducibility, credential burden and ease of manual recovery; do not assume one is best.
>
> Specify exact files to edit, commands to run, output folder, platform settings, required secrets (names only), tests, risks and a rollback plan. Explicitly flag any unnecessary refactor. Stop for approval.

## Prompt B — Implement the approved plan

> Implement **only** the approved Cloudflare hosting changes. Do not redesign pages, refactor generators for Workers, change content schemas or replace the CMS. Preserve the existing build and add the smallest adapter needed to deploy its output.
>
> Requirements:
> - Provide a documented local build and preview that works independently of Cloudflare; pin or record dependencies.
> - Keep generated static output portable to another static host; isolate Cloudflare-specific configuration.
> - Do not publish source-only documentation, credentials, test fixtures or experiments accidentally. Inspect the final artifact rather than assuming it is safe.
> - Preserve automatic deployment after approved pushes where feasible, but document manual build/deploy/rollback commands that do not require AI.
> - Update a migration log with changes, tests, open issues, URLs and recovery steps.
> - Run available local build, validation and relevant interaction tests; report actual evidence and untested items separately.
>
> **Do not** change repo visibility, DNS, account permissions, secrets, production domains, or remove GitHub Pages. Do not push or deploy without approval. Stop and report the diff, test results and manual Cloudflare steps.

## Prompt C — Test and operational handoff

> With the owner-provided preview URL and approval, verify the Cloudflare deployment against the original. Check entry/deep links, assets, generated MkDocs pages, gallery/CMS workflows, tool interactions/exports, browser console/network errors, automatic deployment and a new build from a private repo **only after the owner changes visibility**.
>
> Demonstrate local build and preview, manual deploy/restore, and how the same output could be hosted elsewhere. Write a concise `DEPLOYMENT.md` or equivalent with prerequisites, copy/paste commands, account/dashboard actions, credential locations (not values), troubleshooting and rollback. Mark steps you cannot personally verify. Ask Codex for an independent diff review before cutover.

## Repository-specific constraints

**Dot Mandala:** pilot only. Preserve existing interactive behaviour; do not move geometry to Workers. Confirm source privacy and public output are separate. Verify Cabinet links/iframe before switching them.

**Bookshelf:** preserve picture-frame gallery, static exhibits, MkDocs writing, thumbnails, data fields, and existing editor/update process. Test both direct exhibit URLs and Markdown routes.

**FFFX:** preserve seeded subdivision landing, data-driven entries, tags, and independent sketches. Test direct project URLs and local operation.

**Cabinet:** inspect actual workflow and external repo TSV first. Preserve MkDocs, content generation/validation that is genuinely part of deployment, mounted routes, archives and the local sitemap process. Fix anonymous private-TSV reads if required. Never mount private development trees wholesale into public output. Compare build location alternatives before implementation.

## Owner approval gates

1. Cloudflare/GitHub integration and scopes.
2. First remote deployment and subsequent pushes.
3. Source repository visibility changes.
4. Custom-domain/DNS cutover.
5. Retirement of old deployment configuration.

**Completion criterion:** owner can perform ordinary content updates, local preview, manual publish and restore with the runbook and no AI agent.
