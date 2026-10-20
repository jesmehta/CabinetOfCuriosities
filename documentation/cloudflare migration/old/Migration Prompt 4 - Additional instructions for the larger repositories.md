Before modifying Cabinet deployment, inspect the actual current `.github/workflows/deploy.yml`, `mkdocs.yml`, `requirements.txt`, `tools/assemble-external.js`, `content/external-repos.tsv`, route validation scripts and sitemap generation.

Determine which operations are:
- Required for generating the public website
- Validation-only
- Local authoring tasks
- GitHub Pages-specific deployment operations

Preserve the existing build behaviour. Do not copy GitHub Actions steps into Cloudflare without determining whether each step is needed.

Audit the external repository mounts for public/private source access and accidental publication of development files.

Compare two approaches:
A. Cloudflare builds directly from GitHub.
B. Existing GitHub Actions builds and deploys the resulting artifact to Cloudflare.

Recommend the simpler, more maintainable approach for this repository, including exact changes, credentials needed, risks and rollback.

Do not implement the migration until the audit is reviewed.


---
Codex should be read-only by default. It reports findings and recommendations, but doesn't modify files.



Claude Code should work in bounded stages. It shouldn't make production changes, push commits or modify GitHub/Cloudflare settings without your approval.