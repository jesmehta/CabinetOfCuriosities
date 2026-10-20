Implement the approved Cloudflare deployment preparation for this repository.

Requirements:

1. Preserve existing application behaviour, appearance and URLs wherever possible.
2. Make the smallest necessary changes.
3. Prefer the existing build system; do not introduce a new framework.
4. Add or adjust build configuration only where necessary.
5. Ensure the deployment output excludes development-only files, internal documentation, experiments and repository metadata.
6. Run available local build and validation checks.
7. Prepare Cloudflare project settings, including production branch, build command, root directory, output directory and any required environment variables.
8. Document the deployment process and rollback procedure in `docs/deployment/cloudflare.md`, or an equivalent location consistent with the repository.
9. Provide a clear list of manual Cloudflare dashboard actions.

Do not:
- Change GitHub repository visibility.
- Modify DNS.
- Disable or delete GitHub Pages.
- Push to production without approval.
- Commit credentials or API tokens.
- Refactor the generator's algorithms unless strictly necessary for deployment.

Stop after preparing and locally testing the implementation. Report the files changed, tests performed, failures and remaining manual steps.


---
Codex should be read-only by default. It reports findings and recommendations, but doesn't modify files.



Claude Code should work in bounded stages. It shouldn't make production changes, push commits or modify GitHub/Cloudflare settings without your approval.