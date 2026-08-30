# AI Dependency Audit

Single-file reference doc (per `DOCUMENTATION-GUIDE.md`'s "a subsystem
with only one doc file stays flat at `documentation/` root" rule — this
isn't a standalone tool/page with its own folder, and it isn't backend/
deploy work that belongs in `conversation-backend-and-deploy.md`, it's a
cross-cutting analysis of the repo itself). No companion conversation-log
file; the reasoning for each finding is inline below rather than split
out.

## Concept

Prompted by a direct question from the maintainer: *"tell me what parts
need to be 'done by hand' vs what is automated"* — not a request to
change anything, a request to know which parts of Cabinet's workflow the
maintainer could keep running themselves if AI assistance were ever
unavailable, and which parts would stall without it. The audit that
followed surfaced one real, already-proven-costly gap (the `docs/`
promotion step), which then got closed as a direct follow-on — see
"What was updated" below. This doc is the record of both halves: the
original findings, and what's changed since.

## Method

Read `README.md`, `WORLD-SYSTEMS.md`, `.github/workflows/deploy.yml`,
every `tools/*.js`/`*.py` script, `landing-v3/build-static.mjs`, and the
relevant sections of `landing-page-v3-notes.2.0.md` and
`three-world-launch-phases-ToDo.md`, then sorted every piece of the
pipeline into one of four buckets:

1. **Fully automated, no concern** — runs unattended in CI on every push.
2. **Script-automated, triggered by a button** — a real script exists
   and an editor/dashboard UI already calls it.
3. **Hand-authored content** — TSVs, prose pages, design docs; the
   maintainer's own material, can't be automated away and isn't trying
   to be.
4. **The risk category** — a script or manual sequence with *no* UI
   trigger, or no script at all, that only an AI session (or a
   maintainer working from memory of a multi-step manual procedure) was
   actually executing in practice.

Buckets 1–3 were confirmed fine and are not repeated in detail here —
see `README.md`'s "Deploy pipeline" section and `FILE-MANIFEST.md` for
what's in them. This doc is about bucket 4.

## What needed hand work (as found, 2026-08-30)

**`docs/` promotion — the biggest gap, no script existed at all.**
`landing-v3/build-static.mjs` correctly and safely renders
`landing-v3/index.html` from current content (a real headless-Chromium
render of the actual client-side layout engine, not a hand-written
second serializer — this part was never the problem). But getting that
file, plus the `landing-v3/shared/` modules it depends on, into `docs/`
— where the live site actually reads from — was a fully manual
sequence: copy `index.html`, copy the changed shared `.js`/`.css` files,
and by hand rewrite three dev-relative asset paths
(`shared/cabinet-v3-style.css` → `assets/css/cabinet-v3-style.css`, and
two others) into their production form. `landing-page-v3-notes.2.0.md`'s
`v3.7.67` entry documents a real bug that shipped from doing this
naively — a `cp` that carried the dev-relative paths straight into
`docs/`, where they resolved to nothing. `three-world-launch-phases-ToDo.md`
said outright: *"there's still no automated promotion script, so this
needs re-promoting by hand after any future [change]."*

**`generate_sitemap.py` — a real script, but no trigger and no
reminder.** Unlike `build-cabinet-content.js`/`build-now-content.js`
(both already wired to a Rebuild button inside their own editors), this
script had no UI trigger anywhere and isn't run in CI. Worse than the
other two: it goes stale when *Bookshelf's or fffx's own content*
changes, not just this repo's — nothing in the workflow ever prompted a
re-run for that. A dead compass-rose link shipped once because of
exactly this.

**No single place to run any of the above, start the two editor
servers, or find the relevant doc.** Each editor (`cabinet-editor.js`,
`now-editor.js`) had its own `run-*.bat` launcher, but there was no
single page listing every script, every server, and every doc file
together — running the full pipeline meant knowing several file paths
and commands from memory (or asking an AI session to run them).

## What was updated (2026-08-30, same day)

- **`landing-v3/promote.mjs`** — automates the promotion step
  end-to-end: copies `landing-v3/index.html` → `docs/index.html` and
  `landing-v3/shared/*` → `docs/assets/{css,js}/`, applies the exact
  known dev→production path rewrites (asserted to match exactly once
  each — throws loudly if `index.template.html`'s asset-reference lines
  ever change shape, rather than silently promoting something wrong),
  then re-renders the promoted page in headless Chromium and fails on
  any console/request error. Deliberately kept as a separate script from
  `build-static.mjs` (not folded into it) since `build-static.mjs` is
  also run standalone while iterating on the map, without every run
  needing to touch the live site.
- **`tools/admin-controls.js`** (`run-admin-controls.bat`, port `5959`) — a
  local dashboard closing the "no single place to run any of this" gap:
  start/status buttons for the Cabinet and Now editor servers, a link
  into `islands-tool.html`, and run-buttons for every previously-unbuttoned
  script (`build-static.mjs`, `promote.mjs`, a combined Build+Promote,
  `generate_sitemap.py`, plus a new `mkdocs build --strict` sanity check
  that wasn't wired up anywhere before either) — alongside a
  System-wide/Features documentation index and a gotchas section.
- **`three-world-launch-phases-ToDo.md` #138** — tracks updating the
  maintainer's own hand-made "Data → Map → Page" diagram (made via
  Claude web, before `promote.mjs` existed) to show the new promotion
  step, and bringing a copy of it into this repo instead of it only
  living on claude.ai.

Both scripts were run for real against the live repo while being built
— not just read over — including a clean re-run of `promote.mjs`
against an already-correct `docs/` (confirmed byte-identical, reported
"unchanged" for every file) and a full exercise of `admin-controls.js`'s
routes: spawning `cabinet-editor.js` and confirming it came up, running
`generate_sitemap.py` through the dashboard (live network fetch,
confirmed real output), and the `mkdocs build --strict` check (confirmed
its temp output dir gets cleaned up after).

Documented in `README.md`'s "`admin-controls.js` dashboard; `promote.mjs`
automates docs/ promotion (2026-08-30)" changelog entry and the
corresponding `tools/`-table rows in `FILE-MANIFEST.md` (added by a
concurrent session already, not this doc — see "Working in parallel"
below).

## What's still open

- **`three-world-launch-phases-ToDo.md` #138 itself** — the diagram
  still lives only on claude.ai and still doesn't show the promotion
  step. Tracked, not done.
- **`islands-tool.html`'s "Copy config" is still a fully manual
  hand-off.** Tuning the map's visual config live in the browser only
  ever puts the tuned object on the clipboard — turning that into a
  real, shipped change still means hand-pasting it into
  `cabinet-v3-layout.js`'s source defaults, then running Build+Promote.
  Nothing closes this gap; it's called out as a warning on the
  dashboard's islands-tool card, not automated away. Genuinely hard to
  automate well (it's an editorial "am I happy with this" step, not a
  mechanical one) — flagged here so it doesn't get mistaken for solved.
- **`generate_sitemap.py` still has no automatic trigger for the
  specific case that actually broke once** — it goes stale when
  Bookshelf/fffx change *their* content. A button exists now (lower
  friction than before), but nothing watches those two repos and
  prompts a re-run; running it is still a remembered habit, not an
  enforced one.
- **`admin-controls.js` has no tier-2 technical-reference doc of its
  own yet.** `README.md`'s changelog entry and `FILE-MANIFEST.md`'s
  table rows exist, but per `DOCUMENTATION-GUIDE.md`'s own placement
  rule ("a standalone feature or page... gets its own folder... pairing
  tiers 2 and 3"), a real dashboard with its own port, routes, and UI
  arguably deserves the same `NOW-PAGE.md`/`CABINET-EDITOR.md`/
  `SITEMAP.md` treatment `now/`, `cabinet-editor/`, and `sitemap/` each
  got. Not created as part of this audit — noted as open, separate
  piece of work.
- **`promote.mjs`'s path-rewrite rules are a fixed, hand-maintained
  list of three literal strings**, not derived from
  `index.template.html` automatically. This is intentional — it fails
  loudly the moment the template's asset-reference lines change shape,
  rather than silently promoting something wrong — but it means
  whoever next edits those specific lines in `index.template.html`
  needs to know to check `promote.mjs`'s `PATH_REWRITES` too. Nothing
  currently cross-references the two in either direction.

## Working in parallel

Per `DOCUMENTATION-GUIDE.md`'s own rule, this file was written and
committed on its own — `README.md` and `FILE-MANIFEST.md` were not
touched here, since both already had live, concurrent edits landing
from another session while this audit was being written. A pointer row
into `FILE-MANIFEST.md` and a one-line `README.md` changelog mention
for this doc are still owed, same as any other tier-2 doc gets, in a
later follow-up pass once that parallel work settles.
