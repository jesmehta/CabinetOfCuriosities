# Backend Home — Mechanism & Reference

Companion to [`conversation-backend-home.md`](conversation-backend-home.md)
for the design reasoning and back-and-forth behind the decisions below —
that file is *why*, this one is *what/how*, in the same relationship
`SITEMAP.md` has to `conversation-sitemap.md`. Mirrors
`CABINET-EDITOR.md`'s and `NOW-PAGE.md`'s "local admin server" sections
closely, since `tools/backend-home.js` is the same shape of thing — a
third local-only Node HTTP admin server, added once the other two
already existed.

## Purpose

`tools/backend-home.js` (`run-backend-home.bat`, port `5959`) is a
single dashboard page linking together every other local-only tool this
repo has, plus a button for every build/publish script that had no UI
trigger at all. It exists because of a real, named gap: see
[`AI-DEPENDENCY-AUDIT.md`](../AI-DEPENDENCY-AUDIT.md) for the full
before/after — in short, `landing-v3/promote.mjs` (the `docs/` promotion
step) and `tools/generate_sitemap.py` both had no UI trigger before this
existed, and there was no single place to start the Cabinet/Now editor
servers or find the relevant documentation without knowing several file
paths from memory.

Rendered live at `http://127.0.0.1:5959/admin/` once running.

## Architecture

Same three-file split as `cabinet-editor-ui/`/`now-editor-ui/`:

```text
tools/backend-home.js             -- the server
tools/backend-home-ui/index.html  -- the dashboard markup
tools/backend-home-ui/home.css    -- styling (same parchment/ink tokens as the other two editors)
tools/backend-home-ui/home.js     -- status polling, server-start, run-button wiring
run-backend-home.bat              -- double-click launcher
```

Zero dependencies, binds `127.0.0.1` only, no auth — same conventions as
`cabinet-editor.js`/`now-editor.js`. Port `5959` (env `CABINET_HOME_PORT`
to override), chosen simply as the next number after the existing
`5757`/`5858` pair, not load-bearing in any other way.

**Deliberately does not duplicate `cabinet-editor.js`'s/`now-editor.js`'s
own TSV read/write/validate APIs.** This page starts and links to those
servers rather than reimplementing any of their logic, so each behavior
still lives in exactly one place.

## Routes

```text
GET    /api/status               -- { nowEditor, cabinetEditor }, each { running, port, url }
POST   /api/start/now-editor      -- spawns tools/now-editor.js detached, if not already running
POST   /api/start/cabinet-editor  -- spawns tools/cabinet-editor.js detached, if not already running
POST   /api/run/cabinet-content   -- node tools/build-cabinet-content.js
POST   /api/run/now-content       -- node tools/build-now-content.js
POST   /api/run/sitemap           -- python tools/generate_sitemap.py
POST   /api/run/build-static      -- node build-static.mjs, cwd landing-v3/
POST   /api/run/promote           -- node promote.mjs, cwd landing-v3/
POST   /api/run/build-and-promote -- the two above, in sequence; stops before promote if build-static throws
POST   /api/run/mkdocs-check      -- mkdocs build --strict to an OS-temp dir, deleted after
```

**`/api/status` TCP-probes `127.0.0.1:<port>` directly** rather than
tracking which servers this dashboard itself has spawned — so a server
started outside the dashboard (double-clicked `.bat`, run from a
terminal) still shows as running correctly, not just ones this page
happened to start.

**`/api/run/*` shells out via `execFileSync` and returns combined
stdout/stderr**, the same execute-and-report pattern
`cabinet-editor.js`'s `apiRebuild` already established — the dashboard
doesn't parse or interpret script output, just surfaces it verbatim in
the UI's result panel.

**`/api/run/mkdocs-check`'s temp directory lives under `os.tmpdir()`**,
not anywhere inside the repo, and is `fs.rmSync`'d in a `finally` block
regardless of whether the build succeeded — so this sanity check can
never leave stray build output for git to notice.

**Static serving falls through to the repo root**, not `docs/` like
`cabinet-editor.js`/`now-editor.js` do — specifically so
`/landing-v3/dev-tool/islands-tool.html`'s own relative asset references
(`../../docs/assets/css/cabinet-tokens.css`, `../shared/cabinet-v3-style.css`,
`../layout-engine/cabinet-v3-layout.js`) resolve correctly when opened
through this dashboard rather than needing a separate static server.

## The documentation table

Two tables, mirroring `FILE-MANIFEST.md`'s own split of
`documentation/`:

- **System-wide** — docs that sit flat at `documentation/` root, not
  scoped to one feature (`README.md`, `WORLD-SYSTEMS.md`,
  `FILE-MANIFEST.md`, `DOCUMENTATION-GUIDE.md`).
- **Features** — grouped by subsystem, each group opening with a
  divider row naming its source files/tool (v3 map, Backend & deploy,
  Cabinet TSV editor, `/now` page, Sitemap & Content Inventory).
  `CONTENT-INVENTORY.md` is grouped here under Sitemap by *function*
  even though it physically stays at `documentation/` root
  (`generate_sitemap.py`'s output path is hardcoded — see `SITEMAP.md`)
  — the description says so explicitly rather than leaving the
  placement to look like an error. The Backend & deploy group (added
  2026-08-30, replacing a short-lived System-wide listing of the same
  five files) is the largest — one folder holding two independent
  technical docs (Cloudflare, multi-repo assembly) plus a new
  consolidated one (`BACKEND-AND-DEPLOY.md`) for what didn't have a
  home of its own, matching the actual `documentation/backend-and-deploy/`
  structure rather than treating it as system-wide.

Both tables are ordered broadest-scope-first, most-specific-last within
their own group. Group-row divider styling went through two rounds of
direct visual feedback: font size and row indent first, then a further-
darkened background once the first pass still read as too subtle
against the page (`--accent-soft` → a hand-picked `#B9CDD0`) — see
`conversation-backend-home.md` for both exchanges.

One external, non-repo link lives in the v3 map group: the maintainer's
own hand-made "Data → Map → Page" diagram (built via Claude web, before
`promote.mjs` existed), tagged distinctly (`Claude artifact`) so it
doesn't read as a repo file. Tracked as
`three-world-launch-phases-ToDo.md` **#138** to update it to show the
promotion step and bring a copy into this repo instead of it only living
on claude.ai.

**Deliberately excluded**: `cloudflare-js-snippet.md` (gitignored, never
pushed — a GitHub blob link to it would 404) and `now-page-helpers/`
(explicitly superseded, not actively maintained — see
`FILE-MANIFEST.md`'s own entry for it).

## Verified

Every route was exercised live against the real, running repo while
this was built, not just read over:

- `/admin/` and its static assets (`home.css`, `home.js`) all returned
  `200`.
- `/landing-v3/dev-tool/islands-tool.html` served correctly through the
  repo-root fallback.
- `/api/start/cabinet-editor` actually spawned `cabinet-editor.js`,
  confirmed via `/api/status` flipping to `running: true`, then hit its
  own `/admin/` directly to confirm it was really up, not just that the
  process existed.
- `/api/run/cabinet-content` produced a real rebuild
  (`Generated docs\assets\js\cabinet-generated-content.js (9 sections,
  37 entries)`).
- `/api/run/promote` run clean against an already-correctly-promoted
  `docs/` reported `unchanged` for every file — a genuine correctness
  signal (byte-identical output), not just "didn't crash."
- `/api/run/mkdocs-check` confirmed its temp `site-dir` gets deleted
  after, success or failure.
- `/api/run/sitemap` performed a real network fetch against GitHub and
  produced real output (`Wrote docs\sitemap.md`, `Wrote
  documentation\CONTENT-INVENTORY.md`) — the resulting timestamp-only
  diff was reverted afterward via `git checkout` since it was only a
  smoke test, not a requested content refresh.

## Non-goals

Duplicating the TSV editors' own read/write/validate logic (see
"Architecture" above); a live map preview inside this dashboard (`docs/
index.html` is a frozen, promoted file — a real preview still needs the
Build/Promote buttons this page already exposes); remote access or auth
of any kind, same as its two sibling editors.

## Watch-outs

- **Build and Promote are exposed as two separate buttons on purpose.**
  `build-static.mjs` alone never touches `docs/` — it's also used
  standalone while iterating on the map, without every run needing to
  touch the live site. Only Promote (or the combined Build+Promote
  button) can actually change what ships.
- **"Rebuild Cabinet/Now content" here are convenience mirrors**, not
  the primary way to edit content — they call the exact same build
  scripts the Cabinet/Now editors' own Rebuild buttons do. Editing the
  TSVs themselves still happens by hand or through those editors' own
  UI, not through this dashboard.
- **`generate_sitemap.py` needs network access** and, per
  `AI-DEPENDENCY-AUDIT.md`, goes stale when Bookshelf's or fffx's own
  content changes, not just this repo's — this dashboard makes it easy
  to run, it does not remind you when a run is actually needed.
- **Port `5959` is fixed unless overridden** (`CABINET_HOME_PORT`) — no
  auto-detection of a free port if something else already owns it.

## Files

```text
tools/backend-home.js             -- local admin server (see "Architecture"/"Routes" above)
tools/backend-home-ui/index.html  -- dashboard markup
tools/backend-home-ui/home.css    -- styling
tools/backend-home-ui/home.js     -- status polling, server-start, run-button wiring
run-backend-home.bat              -- double-click launcher for tools/backend-home.js
```

## Update workflow

1. `node tools/backend-home.js` (or double-click `run-backend-home.bat`
   from the repo root). Prints a URL — open
   `http://127.0.0.1:5959/admin/` (port configurable via
   `CABINET_HOME_PORT`). `Ctrl+C` stops it.
2. Editor-server cards show live status and a Start button if a server
   isn't already running.
3. Each pipeline step has its own Run button and shows the underlying
   script's real output (or error) inline.
4. This page never commits anything itself — commit the changed files
   yourself once you're happy with a run's result, same as every other
   tool in this repo.

## Changelog

### v1.3 — group-row background darkened further (2026-08-30)

Direct follow-up to `v1.2` below: the lighter `--accent-soft`
(`#DDE6E8`) background from that pass still read as too subtle a
divider against the parchment page. Changed to a hand-picked, more
saturated `#B9CDD0` for `tr.group-row td` specifically (not the shared
`--accent-soft` token used elsewhere on the page, to avoid darkening
anything else that reuses it).

### v1.2 — doc table split into System-wide vs Features (2026-08-30)

Direct request to organize the documentation links further: system-wide
docs separated from individual features, each feature's own file(s)
grouped together, ordered broad-to-specific throughout. Implemented as
two `<table>`s (`System-wide`, `Features`), the second with a
`tr.group-row` divider naming each feature's source tool/files —
mirrors `FILE-MANIFEST.md`'s own root-vs-folder split of `documentation/`
rather than inventing a new grouping scheme. A same-day follow-up made
the group-row labels more prominent (font size `12.5px` → `14.5px`,
child rows indented `30px` under their header) after direct feedback
that the divider rows didn't stand out enough on their own.

### v1.1 — doc links fixed and expanded for the documentation/ reorg (2026-08-30)

A concurrent session reorganized `documentation/` into one folder per
feature the same day this dashboard was built (see
`conversation-backend-and-deploy.md`'s Part 4) — four of this page's
hardcoded doc links (`CABINET-EDITOR.md`, `NOW-PAGE.md`,
`Landing-page-notes.2.0.md`, `conversation-landing-page-v3.md`) broke as
a result and were fixed to their new paths. Six new doc rows were added
for files that turned up in that same reorg
(`DOCUMENTATION-GUIDE.md`, `conversation-backend-and-deploy.md`,
`SITEMAP.md` + its conversation-log companion, and the
`conversation-cabinet-editor.md`/`conversation-now-page.md` companions).
Deliberately held off making this fix until the reorg was actually
committed, rather than guessing at in-flight paths.

### v1.0 — initial build (2026-08-30)

`tools/backend-home.js`, `tools/backend-home-ui/` created. Direct
follow-on from an audit of the repo's automation gaps (see
`AI-DEPENDENCY-AUDIT.md`): editor-server start/status, run-buttons for
every previously-unbuttoned script including the newly-written
`landing-v3/promote.mjs`, a documentation-file index, and a gotchas
section. Same day as `promote.mjs` itself, which this dashboard exposes
but does not implement — see `landing-v3/promote.mjs`'s own header
comment for that script's design.
