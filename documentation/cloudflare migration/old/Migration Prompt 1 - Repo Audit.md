We are migrating selected static websites from GitHub Pages to Cloudflare, so their GitHub source repositories can be private while the published websites remain public.

This repository is the first pilot.

**Task: audit only. Do not modify files yet.**

1. Inspect the repository structure, entry point, HTML, CSS, JavaScript, assets, dependencies and documentation.
2. Identify the actual website root and whether any build process is required.
3. Inspect existing GitHub Actions workflows and GitHub Pages configuration.
4. Identify absolute URLs, GitHub Pages-specific paths, hardcoded repository paths, external dependencies and cross-repository links.
5. Identify what is published versus what should remain private.
6. Recommend the simplest Cloudflare deployment configuration for this exact repository.
7. Determine whether Cloudflare Pages or Workers with Static Assets is preferable, considering that this is currently a static browser-based tool.
8. Identify any issues that could arise when the repository becomes private.
9. Give a rollback plan.

**Deliverable:** A concise audit with:
- Current deployment architecture
- Recommended Cloudflare configuration
- Files that need changing
- Risks and tests
- Actions I must perform manually
- Estimated implementation effort

Do not assume a build command or output directory without verifying them. Do not change GitHub visibility, DNS, Cloudflare settings or production deployment.


---
Codex should be read-only by default. It reports findings and recommendations, but doesn't modify files.



Claude Code should work in bounded stages. It shouldn't make production changes, push commits or modify GitHub/Cloudflare settings without your approval.