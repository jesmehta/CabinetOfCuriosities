# Cabinet — Cloudflare migration log

Append-only. Times in IST (tool UTC + 5:30 or git author time). Plan: [plan.md](plan.md) (v3.1). Reviews:
[codex-reviews.md](codex-reviews.md); responses: [claude-code-responses.md](claude-code-responses.md).
All implementation commits are **local only** until a Codex post-implementation review and owner approval.
The owner's uncommitted work (`cabinet-material.css`, `scratchNotes.md`, `docs/_images/paper2025_26/`,
`docs/teaching/paper2025.md`) is never staged.

## Implementation step 1: external-mount fetcher — 2026-10-23 ~01:30–02:15 IST

- `5e013db` plan v3.1 after Codex C2 (relayed in chat): GO for bounded implementation and local tests.
- **Partial-clone experiment** (`evidence/partial-clone-experiment-20261023.txt`): a bare, blob-less shallow fetch of
  the pinned commit plus one batched fetch of only the listed blobs. All acceptance criteria met: 52.9 MB instead of
  107 MB for one SSD year; bytes identical to a full fetch; newly listed paths at the same SHA fetchable later; warm
  cache reads offline. **Trap found:** any size query (`ls-tree -l`) lazily downloads every blob, so all git calls
  except the explicit fetches run with `GIT_NO_LAZY_FETCH=1`. The partial clone is adopted; the simple full fetch is
  not needed as a fallback so far.
- `d63809f` `revision` column in `content/external-repos.tsv` (pins from `evidence/external-revisions-20261022.txt`).
- `5cf2167` `tools/allowlist.mjs` and `tools/external-mounts.mjs`, plus **candidate** allowlists (bootstrapped from
  the pinned trees minus D3 categories; marked not yet reviewed). Comments in allowlists start a line only:
  a student file is named `Kawaii Ringtones #6.mp3`.
- `5656072` evidence: online and `--offline` outputs identical; **674 mount files byte-identical to the baseline**;
  46 omitted = exactly the approved D3b/D3b+/D3c removals (`evidence/mounts-vs-baseline-20261023.txt`).
- Not yet wired into a build: `tools/build-site.mjs` is step 3. `assemble-external.js` still serves `deploy.yml`.
- **Next:** step 2 allowlist review (needs the owner for the student folders and Swatch Fields' two image sets),
  step 3 the build script and archive allowlist, then rejection tests in a disposable clone.
