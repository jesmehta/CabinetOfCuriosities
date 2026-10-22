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

## Recording convention

Every entry records: the exact commits, the evidence paths, which Codex findings it resolves, and the time source.
