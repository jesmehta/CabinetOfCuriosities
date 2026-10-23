# Claude Code response record — Cabinet

Companion to `codex-reviews.md` (Codex's file, committed unedited when it exists). Each entry is timestamped in IST,
from git author time or tool UTC + 5:30. It names the Codex entry it answers, the commits and the evidence. Entries
are append-only.

## R1 — Plan v1 after the audit — 2026-10-22 00:50–01:20 IST

- Read the Codex audit (`a9c3fcf`, committed unedited; recorded 2026-10-21 02:29 IST against `33788af`).
- Scratch build of `6300dfa` (current `main`; it differs from the audit's baseline only in migration records):
  1,117 files, 166 MB.
  - With `core.autocrlf=false`, **1,113 files are byte-identical to the live site**; the 4 differences are
    explained in the plan's Facts.
  - Two Windows-only build problems found: CRLF conversion of the external clones, and the long-path checkout
    failure.
  - Evidence: `evidence/scratch-build-baseline-*`, `baseline-vs-live-*`, `external-revisions-20261022.txt`.
- All six external repositories are confirmed **public** (audit §2 asked for this to be checked).
- **Plan v1** (`plan.md`): decisions D1–D10, changes C1–C11, tests.
  - Build placement: direct Cloudflare builds with anonymous clones.
  - External inputs: SHA pins plus committed per-mount inventories.
  - Archive and download policy; `site_url`; root-relative nav; snapshot rule for the owner's uncommitted work.
- Next: owner decisions, then Codex plan review, then implementation (local commits only).

## R2 — Plan v3 in response to Codex C1 — 2026-10-22 ~09:15 IST

Codex C1 (2026-10-22 03:05:47 IST, reviewed `d69fa44`): **GO** for bounded implementation and local tests once the
corrections are in; **NO-GO** for push or deployment on plan evidence alone. Committed unedited as `594d524`.

| C1 point | v3 response (`plan.md`) |
| --- | --- |
| **I1** development builds | `build-info.json` **outside `public/`** records overrides and pins. `save-artifact` and `verify-artifact` refuse development builds; `npm run deploy` always rebuilds pinned. The manual verified-artifact deploy route is documented. The raw `wrangler deploy --assets public` bypass is stated as a limit, not claimed impossible. Test 4b |
| **I2** cache trust | The cache holds Git objects. Published bytes are read from the **pinned commit's tree**, never from a working copy. Fetches are per (repository, revision); differing pins for one repository are never merged. The repository URL is checked. The build never resets or cleans a checkout it did not create. Partial clone plus sparse checkout is an **experiment** with acceptance criteria and a fallback. Test 2 (offline warm cache), test 4 (modified file at an unchanged HEAD; objects unavailable; conflicting pins) |
| **I3** allowlist completeness | Browser capture is one candidate generator, alongside source inspection, scenario coverage (gameplay/audio, Swatch modes, Tracery, archive) and an inventory of every HTML entry. Case-sensitivity checks. Policy and path errors stay fatal; licence notices and the v1 downloads are explicit exceptions |
| **I4** operative tables | The D3, C2, C3 and C7 rows and tests 2/4/4b/4c are rewritten to the allowlist model: an unlisted file is omitted and reported; a listed missing file fails; `update-externals` only proposes candidates |
| Sitemap | An explicit rule (exclusions, deduplication, XML escaping, deterministic, canonical host, every URL checked) |
| D6 comparison | A two-step comparison; every difference enumerated; baseline exceptions explained and left as they are |
| Tracery links, D9, watch paths, offline | Recorded as accepted exceptions and constraints in "v3 additions" |

Next: implementation in local commits, starting with C1/C2 and the partial-clone experiment.

## R3 — Plan v3.1 in response to Codex C2 — 2026-10-23 ~01:30 IST

Codex C2 (plan v3 review), received **in chat** and not yet in `codex-reviews.md` (to be committed unedited when
written there): **GO** for bounded implementation and local testing, with two corrections; deployment readiness
remains unproven.

| C2 point | v3.1 response (`plan.md`) |
| --- | --- |
| Archive: C4 said "exclusion list" but D4 (owner) requires a frozen allowlist | C4 rewritten: `content/archive-allowlist.txt`, with the same rules as the mount allowlists (unlisted = omitted and reported; a listed file missing fails; policy/path errors fatal). D4 row rewritten to match. Test 4 gains the archive rejection set |
| Watch paths: "docs-only skip" was ambiguous | Test 8 now says: a push changing only **internal documentation** (`cloudflare migration/`, `documentation/`, `README.md`, `DEPLOYMENT.md`) is skipped; a push changing **website content under `docs/`** deploys; both proved |
| Historical v2 section still makes superseded claims | Retitled "Historical", with a note naming the superseded claims (D1 partial clone, D6 comparison, D10 boundary) and pointing to the operative text |
| Closing request said "review v2" | Now "review v3", then post-implementation review before any push |
| (own finding) The operative Decisions table still had v1 wording in D2, D6, D9, D10 | Rows rewritten to the decided form; header changed from "Owner decisions needed" to "Decisions" |

Next: implementation, local commits only.

## R4 — Codex C2 recorded, C3 on v3.1; owner answers for step 2 — 2026-10-23 ~08:20 IST

- Codex wrote C2 (the chat review answered in R3) and C3 (v3.1 at `5e013db`: **GO for bounded implementation and
  local tests; no blocking plan correction**) into `codex-reviews.md`. Committed unedited as `0dbee6d`, before this
  entry.
- C3's limits are accepted as stated: the step-1 code, experiment and comparisons (`5cf2167`, `5656072`) were **not**
  reviewed; the candidate allowlists are not publication-approved. The next Codex review covers the code, failure
  cases, allowlist completeness, clean deterministic builds, provenance/release checks and authoring portability.
- C3 editorial notes, carried to the runbook and report: distinguish offline artifact serving/restore from
  network-required deployment; measure the `site_url` effect per page rather than assuming one uniform change.
- **Owner answers (step 2):** SSD student folders and Swatch Fields publish **only what the page loads** (owner
  suspects Swatch Fields uses only `imagesSuperCrop/`).
- **Owner: rename files rather than add edge-case rules.** The allowlist syntax is back to FFFX's (`#` starts a
  comment anywhere). The one affected file, SSD 2024-25 `Prachi_Khobragade/Kawaii Ringtones #6.mp3`, is **loaded by
  `sketch.js` but already broken live**: the browser requests `Kawaii Ringtones ` (404; the full name serves 200).
  It is left out of the candidate list until it is renamed in `SSD_Student_Work` (ToDo; external repository, so
  owner-authorised). Assumption, to verify in the browser scenarios: p5's `loadSound` passes the name unencoded.

## R5 — Fixes for Codex C4 (post-implementation review) — 2026-10-23 ~23:30–00:00 IST

Codex C4 (2026-10-23 23:24:42 IST, reviewed `c2a0e6a`, implementation `aabc4dc`): **HOLD** the first push and the
Worker until I1–I3 are fixed with focused tests; production cutover/privatization NO-GO. Committed unedited as
`b5ab43c`, before this entry. All fixes are local commits; nothing pushed.

| C4 point | Fix | Evidence (`evidence/`) |
| --- | --- | --- |
| **I1** destinations/ids bypassed the path boundary | `c59b0c1`: ids must be lowercase slugs; destination and subfolder must be plain `/`-separated segments (no `..`, `.`, empty, leading/trailing `/`, `\`, `%`, spaces, drive letters, leading dots); duplicates and nesting compared case-folded; the assembler refuses a destination resolving outside the output folder before any write | `path-safety-tests-7b0bab2.txt` (18/18: 17 unsafe values rejected, committed TSV valid); `reject-tests-7b0bab2.txt` (48/48: traversal via the assembler fails and nothing appears outside the scratch output; unsafe id; case-folded nesting) |
| **I2** recovery accepted incomplete provenance | `0ea749b`: full schema (source commit SHA, every record's id/repository/subfolder/revision/destination/source/files/bytes, unique ids/destinations), `externalCount` + `externalsDigest` written by the build, **records must equal the active rows of `content/external-repos.tsv` at the release's own source commit** (read from git; fails closed if that commit is unavailable; never today's pins, so rollback still works), and per-mount file counts in the site | `artifact-tests-7b0bab2.txt` (25/25: 16 malformed variants of a checksum-valid release refused, incl. self-consistent truncation and rewrite; missing record; tampered file; development build; stale/edited `public/`) |
| **I3** repro could print FAIL and exit 0 | `c5f31c9`: `compare-build-info.mjs` exits 1 and sets `FAIL`; compares source commit, development flag, count, digest and all identity fields; `REPRO_INJECT_PROVENANCE_MISMATCH=1` hook | `repro-0579a35.txt` (pass); `repro-injected-provenance-mismatch-0579a35.txt` (FAIL printed, **exit 1**) |
| **I4** capture ≠ functional scenarios; dev-boundary citation | Report rows 6/6s narrowed to loading coverage with the gallery lightbox as the one functional assertion; new section listing the workflows not yet asserted, to be checked by name on the workers.dev preview; test 4b now cites the artifact suite (earlier citation marked as the implementer-observed smoke test) | `implementation-report.md` |
| Runbook notes | `0579a35`: branch builds stated as expected, not demonstrated; nearest-404 behaviour described in `DEPLOYMENT.md` and `wrangler.jsonc` consistently with the report | — |

Accepted as stated by C4: the image guard catches total image loss only (per-page image/lightbox checks stay in
acceptance); Cloudflare Linux build, triggers, deployed behaviour, rollback, Wrangler restore, private-source and
apex/www remain later gates. Next: focused Codex follow-up review, then owner approval for the first push (which
changes the live GitHub Pages output as described) and the Worker.

## Recording convention

Every entry records: the exact commits, the evidence paths, which Codex findings it resolves, and the time source.
