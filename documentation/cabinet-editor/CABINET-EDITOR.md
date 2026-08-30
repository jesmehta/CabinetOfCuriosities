# Cabinet Data Editor — Design Decisions & As-Built Notes

Companion to [`NOW-PAGE.md`](../now/NOW-PAGE.md)'s "Local admin server" section, which
this mirrors closely — a local-only Node HTTP admin server for editing
`content/cabinet-sections.tsv` and `content/cabinet-entries.tsv` through a
browser UI instead of hand-editing either file. Written to satisfy the
"Build TSV editors for Cabinet, Bookshelf, FFFX" item in Phase 2 of
`documentation/landing-v3-notes/three-world-launch-phases-ToDo.md`, whose
requirements (`three-world-launch-phases-Notes.md`'s "TSV editor
requirements") are: add/edit/delete sections and entries; validate required
fields; manage order, weight, status, tags, and links; catch duplicate IDs
and invalid section references; preserve each world's own schema rather
than forcing one universal schema.

**Scope of this pass**: Cabinet only. Bookshelf (`TheBookshelfOfCuriosities`)
already has its own `content/bookshelf-*.tsv` + `build-bookshelf-content.js`
with a genuinely different schema (different columns, `TRUE`/`FALSE` casing,
literal HTML/quote characters inside cells) — a second copy of this editor
belongs there, adapted to that schema, but is future work, not built here.
fffx (`form-follows-fx`) has no `content/`/build pipeline at all yet — there's
no schema for an editor to plug into until that's built first, a separate
and larger undertaking. Direct instruction for this pass: build Cabinet's
version well, and let Bookshelf/fffx's copies cohere with it or diverge from
it as their own schemas actually require — don't force one shared engine
across three repos preemptively.

## Why this replaced `tools/cabinet-editor-ui/cabinet-data-editor.html`

An earlier single-file HTML draft (a Claude Code session's rough UI sketch,
not hand-authored) held both TSVs as hardcoded JS seed strings, with no
server: editing happened in memory, and getting data in or out meant
pasting TSV text into a dialog and copy/downloading it back over the real
files by hand. No persistence (a refresh lost all unsaved edits), no
duplicate-ID validation (a requirement above), no connection to the build
script. It was explicitly treated as a throwaway visual reference, not a
base to build on — direct instruction: "ignore it completely for any
backend stuff... don't have any legacy hangups." Deleted once this real
editor replaced it.

## Architecture

Same shape as `tools/now-editor.js`/`tools/now-tsv.js`/`tools/now-editor-ui/`,
for the same reason: one shared parse/serialize/validate module used by
both the CLI build script and the admin server, so they can't quietly
diverge.

```text
content/cabinet-sections.tsv    -- source of truth, hand-edited or via the admin server
content/cabinet-entries.tsv     -- source of truth, hand-edited or via the admin server
      |
      |  tools/cabinet-tsv.js (shared: parse/serialize/validate)
      v
tools/build-cabinet-content.js  -- CLI build: TSV -> docs/assets/js/cabinet-generated-content.js
tools/cabinet-editor.js         -- local admin server: TSV <-> browser UI, live validation, Rebuild button
tools/cabinet-editor-ui/        -- the admin server's browser UI (index.html/editor.css/editor.js)
```

**`tools/cabinet-tsv.js`** (new): a plain strict tab/newline splitter, not
a CSV-quote-aware state machine like `now-tsv.js` — deliberately different
from Now's parser, because neither Cabinet TSV has ever contained an
embedded tab/newline/quote character in a cell, and `build-cabinet-content.js`
has always required an exact per-row cell count with no trailing-column
padding. Copying `now-tsv.js`'s leniency here would be solving a problem
Cabinet's data doesn't have, at the cost of silently tolerating a
malformed row (a stray literal tab) that should fail loudly instead.
Exports `readSections`/`writeSections`/`readEntries`/`writeEntries` (flat
row objects, all schema columns always present) plus the field-level
helpers (`parseStatus`/`parseNumber`/`parseList`/`parseRelatedLinks`/
`defaultExtraCount`) that used to live only inside `build-cabinet-content.js`
— moved here so the editor's validation and the build script's JSON-shape
transform agree on what "numeric"/"well-formed" means, not two independent
implementations.

**Two validation shapes, on purpose**: `findSectionProblems()`/
`findEntryProblems()` collect *every* problem in the file (used by the
editor UI, which flags every bad row at once, not just the first);
`validateSections()`/`validateEntries()` throw on the *first* one (used by
`build-cabinet-content.js` and the editor's own `/api/rebuild`, where
"fail loudly and stop" is correct). Checks: required `id`/`title`,
numeric `order`/`weight`, `status` ∈ {true, false, wip}, duplicate `id`
(within sections, and separately within entries — new; neither the old
draft nor the original build script checked this, despite it being one of
the explicit Phase-2 requirements), entry→section reference validity, and
`relatedLinks` `label|href` format (still enforced even though nothing
currently renders `relatedLinks` — see "Live vs. reserved fields" below —
because a malformed one still throws inside `build-cabinet-content.js` and
would block the whole site build).

**`build-cabinet-content.js`** was refactored to call the shared reader/
validator instead of its own inline `readTsv()`/`parseStatus()`/etc. —
verified byte-identical output on the real `content/` files before and
after the refactor (`git diff` against the committed
`cabinet-generated-content.js` showed zero changes).

**`tools/cabinet-editor.js`** (new): zero-dependency Node HTTP server,
binds `127.0.0.1` only, no auth, port `5858` by default (configurable via
`CABINET_EDITOR_PORT` — deliberately different from Now's `5757`, since
both can then run side by side). Routes:

```text
GET    /api/state                    -- sections + entries (indexed rows) + validation problems + column/reserved-field lists
POST   /api/sections                 -- create (appended, order renumbered in steps of 10)
PUT    /api/sections/:index          -- partial update (only sent fields change)
DELETE /api/sections/:index          -- blocked (422) if any entry still references this section's id
POST   /api/sections/:index/move     -- swap with adjacent row, renumber order
POST   /api/entries                  -- create (inserted after the last row of the same section)
PUT    /api/entries/:index           -- partial update
DELETE /api/entries/:index           -- unconditional (nothing references an entry)
POST   /api/entries/:index/move      -- swap with nearest same-section neighbour, renumber order within that section
POST   /api/rebuild                  -- validates, then shells out to build-cabinet-content.js; returns its output or thrown error
```

`PUT`/create bodies only touch fields actually present (`applyFields()`
merges into the row freshly re-read from disk) — the UI's grid sends one
field per edit (its `change` event), not a whole-row snapshot, so two
near-simultaneous edits to different fields of the same row can't clobber
each other. Every write re-reads the file from disk first rather than
trusting any in-memory cache, same as `now-editor.js`.

**Static serving**: `/admin/` serves `tools/cabinet-editor-ui/`; everything
else falls through to `docs/` (parity with `now-editor.js`'s convention),
though nothing in the current UI actually depends on that — `docs/index.html`
is the frozen, pre-rendered v3 map SVG, not a live preview of TSV edits; a
real preview needs a separate `landing-v3/build-static.mjs` pass, same as
Now's page needing a separate `mkdocs serve`.

## `tools/cabinet-editor-ui/`

`index.html`/`editor.css`/`editor.js`, split into three files like
`now-editor-ui/` (the earlier draft was one monolithic HTML file with
inline seed data and styles). Sections/Entries tabs, a spreadsheet-style
grid per tab, `+ Add`/▲▼ reorder/✕ delete per row, a text filter, a
"Rebuild" button, and a status banner for rebuild/error output.

**Every mutating action refetches `/api/state`** rather than patching
local state client-side — a field edit, reorder, add, or delete can change
*other* rows' validity too (renaming a section id invalidates every entry
that referenced the old id; a new duplicate id needs to show up as
invalid immediately), so re-deriving the whole table from the server after
every write is simpler and can't drift, at the cost of a full
grid re-render per action (acceptable at Cabinet's current scale — 9
sections, 37 entries).

**Field edits save on the input's `change` event** (fires on blur, once a
value actually changed) rather than per-keystroke or via an explicit
per-row Save button — a deliberate middle ground between Now's
explicit-Save-button form (too much friction for a grid with many small
fields) and true per-keystroke autosave (would rewrite the whole TSV file
on every character typed). Matches how a spreadsheet already feels: leave
the cell, it's saved.

**Columns are sortable and resizable** (v1.3, added once real use with
the full 15-column entries schema made the plain file-order grid hard to
scan). Clicking a header cycles ascending → descending → back to file
order (`sortState`, per tab); a column's drag handle resizes it (`<col>`
width, `table-layout: fixed`, tracked in `colWidths` — a view preference,
not persisted across a reload). Sorting only ever changes what's
*displayed* — the ▲▼ move buttons still operate on real file-adjacency,
so they're disabled (with a tooltip explaining why) whenever a sort other
than file order is active, rather than silently moving a row somewhere
that doesn't match what the sort just showed. `order` renders immediately
after `id` (`displayCols()`), not wherever it sits in the TSV's own
column order, specifically so it's visually next to the ▲▼ buttons that
actually change it — a display-order-only choice, the underlying schema/
file column order is untouched.

**A resize drag can't accidentally trigger a sort** (v1.5, found while
testing the fix below, not the original ask). A drag's `mouseup` almost
never lands back on the 7px-wide handle it started on — the browser
still fires a native `click`, targeted at the nearest common ancestor of
the `mousedown`/`mouseup` targets, which is the `<th>` itself,
indistinguishable from an actual click-to-sort unless suppressed.
`wireTableHeader()`'s resize handler now installs a capturing,
`{ once: true }` click-swallower on the table right when the drag ends,
so that one synthetic click never reaches the header's own sort listener.

**Right-aligned numeric fields (`order`/`weight`/etc.) clip from the
left, not the right, when their column is narrowed** (v1.5). A plain
`text-align:right` only controls where the text sits *inside* an input's
box — an unfocused overflowing input still defaults to showing its
content from the start (the left edge), so narrowing the column clipped
away the number's most-significant (leftmost) digits while showing the
least-significant ones, backwards from what a right-aligned number should
do. Fixed with the standard trick for this: `direction:rtl` alongside
`text-align:right` — digits are a bidi "weak" type, so `order`/`weight`
still display left-to-right internally ("42", never "24"), but the
input's overflow/scroll-anchor point flips to the right edge, so a
too-narrow column now clips the leftmost digits and keeps the rightmost
ones (and the number itself) in view. This only actually worked once a
second bug was fixed alongside it: `td input/select/textarea` had a
`min-width: 80px` left over from the pre-resizable-column era, which kept
the input itself wider than its now-narrower `<td>` regardless of the
column's real width — the `<td>`'s `overflow:hidden` was then clipping
the *input's own oversized box* from its right edge, which silently
defeated the `direction:rtl` fix entirely (the input's internal text was
correctly right-anchored the whole time; the parent cell just never let
the input shrink enough to reveal that). Removed the `min-width`
outright — `table-layout: fixed` plus each resize handle's own 50px
floor already provide adequate sizing, this rule was only ever fighting
against a control (column resizing) that didn't exist yet when it was written.

**A row's textareas stay the same height as each other.** Each wide
field (subtitle/notes/tags/href/relatedLinks) has its own CSS
`resize: vertical` handle, but dragging one taller used to leave its row
siblings at their old height, looking broken rather than like one row.
`wireRowTextareaSync()` uses a `ResizeObserver` per row: whenever any
textarea in that row resizes, every textarea in the row is set to
whichever one is currently tallest.

**"⇕ Expand text" / "⇱ Compact text"** (v1.4), one toggle button per tab:
expand grows every textarea to fit its own content
(`el.style.height = el.scrollHeight + "px"`, after first resetting to
`"auto"` so shrinking content is measured correctly, not stuck at a
stale larger height); compact clears the inline height override back to
the CSS default. No per-row judgment call about which rows "need" it —
short content naturally computes a `scrollHeight` near the compact
default already, so only rows that actually have long text end up
visibly taller. `wireRowTextareaSync()`'s already-attached observers
pick up the resulting per-textarea height changes and bring each row's
shorter siblings up to match, same as a manual drag would. `textExpanded`
is a persistent per-tab flag (not a one-off action) — every mutation
fully rebuilds the table's DOM, so `applyExpandState()` re-runs at the
end of every render to keep the mode from silently reverting after a
save.

### Live vs. reserved vs. deleted fields

Checked against three sources, not just one: `landing-v3/layout-engine/
cabinet-v3-layout.js` (the actual live renderer); the archived v2 renderer
(`archived-landing-pages/v2/assets/js/cabinet-render.js` +
`v2/source/generate-cabinet-map.js`) for anything with zero current
reader, to tell "this used to be real, now dead" apart from "never wired
up at all"; and **`WORLD-SYSTEMS.md`** (hand-synced byte-for-byte across
Cabinet/Bookshelf/fffx), which turned out to matter as much as the code —
see the v1.2 changelog entry below for what that caught after the first
schema cut had already been applied to the real data.

**Sections** — `buildSections()`'s section object (`cabinet-v3-layout.js:114`)
reads `id, title, href, order, weight, kind, extraCount` (plus `status`,
used for the visible-entries filter). `mapForm`, `islandId`, `cx`, `cy`,
`rx`, `ry` are read by *nothing* in the current renderer — not even
`compass`, despite the TSV's own inline note there mentioning "SE-corner
square carve"; that carve is computed in code, not read from these
columns. They *did* drive something once (v2's `generate-cabinet-map.js`
used hand-set `cx/cy/rx/ry` to place island ellipses for the original
hand-authored map), but `squarify()` now computes every island's position
live from `weight`, unconditionally. **Kept in the schema, read-only** in
a collapsed "▸ layout" panel per section row — editing them would
literally do nothing, and the UI says so rather than leaving that a
silent trap. `location` stays in the main grid (see below).

**Entries** — `buildSeedsForSection()`'s per-entry object
(`cabinet-v3-layout.js:461-468`) reads `id, weight, kind, title, href,
status` (plus `section`). Of the old v2-era visual/placement columns
(`subtitle`, `thumbnail`, `icon`, `relatedLinks`, `placement`, `x`, `y`,
`anchor`, `cardOrder`, `size`, `cardType`, `leaderTo`):

- **`anchor` is live, in the main grid** — `cabinet-v3-layout.js:1274`,
  `computeCompassNominalLabels()`, reads `e.visual.anchor` to decide which
  of the four `compass-n/e/s/w` entries (`anchor` = `N`/`E`/`S`/`W`)
  renders at which side of the compass rose. Real, current, load-bearing —
  just narrow in scope (only 4 of 37 rows use it). Its other historical
  meaning — v2's lowercase `north`/`south`/`east`/`west` coast-card
  anchor, paired with the now-gone `placement`/`cardOrder` — was
  genuinely dead; those leftover lowercase values (`100-gradients`,
  `looms`, `drawing-machines`, `tracery-bots`) were cleared from the real
  data, not left as orphaned noise next to a column that no longer
  explains them.
- **`location` and `relatedLinks` are in the main grid, not reserved** —
  not because the current v3 renderer reads them (it doesn't), but because
  `WORLD-SYSTEMS.md` documents both as **standard fields every Level 1
  world's entries should carry**, and both are genuinely live in
  Bookshelf's and fffx's own build scripts (confirmed by reading their
  actual `content/*.tsv` + `build-*-content.js` directly, not assumed).
  These were dropped in the schema's first pass, then restored — see the
  v1.2 changelog entry. `relatedLinks`' `label|href` format is still
  validated (`parseRelatedLinks()`) since a malformed one throws inside
  `build-cabinet-content.js` regardless of whether Cabinet's own renderer
  displays it yet.
- **`subtitle` and `thumbnail` were kept**, by direct instruction, "as a
  just-in-case as well as reminders" despite zero current reader — shown
  in a collapsed "▸ reserved" panel, editable (nothing here is
  computed-over, so a hand-set value wouldn't be silently discarded).
- **Everything else — `icon`, `placement`, `x`, `y`, `cardOrder`, `size`,
  `cardType`, `leaderTo` — was deleted outright**, from `ENTRIES_COLS`,
  from `build-cabinet-content.js`'s JSON transform, and from the real
  `content/cabinet-entries.tsv` data (all 37 rows). Unlike `location`/
  `relatedLinks`, none of these appear in Bookshelf's or fffx's schemas at
  all — `WORLD-SYSTEMS.md` itself calls this specific bundle (`visual:
  {placement, x, y, anchor, order, size, cardType, leaderTo}`) "Cabinet's
  own extension," which documents that Cabinet *once* used it, not that
  it's currently load-bearing or that another world shares it. Reviving
  any of this later means writing new v3 rendering code, not just filling
  in values that are already silently ignored — the data for that is
  gone, not hidden.

`tags`/`notes` (both files) and sections' `subtitle` stayed in the main
grid throughout — still no current renderer consumer, but descriptive/
editorial text rather than positional data a renderer would need (matches
the `notes`-is-editorial-only convention from `now.tsv`).

Net schema size: **18 section columns** (unchanged from the original —
only `location` moved out and back) and **15 entry columns** (down from
23 — `icon`/`placement`/`x`/`y`/`cardOrder`/`size`/`cardType`/`leaderTo`
gone for good, everything else retained or restored).
`SECTIONS_RESERVED_COLS`/`ENTRIES_RESERVED_COLS` in `cabinet-tsv.js` are
informational only — they tell the UI which columns to fold into the
collapsed panel; parsing/validation/build output treat every column
identically regardless of which grid it renders in.

## Verified

- `build-cabinet-content.js`'s refactor to the shared module produces
  byte-identical output against the real, committed `content/*.tsv` files
  (`git diff` on `docs/assets/js/cabinet-generated-content.js` — none).
- Live server exercised against the real content files (not fixtures):
  field update, section reorder (with renumbering), section-create,
  duplicate-entry-id creation correctly surfaced in `entryProblems`,
  section delete correctly blocked while referenced by entries, rebuild
  correctly failing with a clear message while a duplicate-id problem
  existed, rebuild succeeding once resolved. Test mutations reverted via
  `git checkout` afterward — real content unchanged.
- Playwright pass against the running admin UI, both before and after the
  v1.1 schema trim: reserved panels render with the right disabled/enabled
  state for whatever's currently in them; tab switching and the search
  filter both work; zero console errors/exceptions.
- After the v1.1 trim: re-fetched `/api/state` against the real files —
  zero validation problems, 17/13 columns as expected, `compass-n/e/s/w`'s
  `anchor` values (`N`/`E`/`S`/`W`) intact; regenerated
  `cabinet-generated-content.js` and confirmed by grep that all four
  compass entries still carry `"visual": { "anchor": "..." }`.

## Non-goals (this pass)

Bookshelf/fffx copies (see "Scope" above); image/thumbnail upload (unlike
`now.tsv`, most `thumbnail`/`icon` values are either blank or symbolic
sprite keys like `icon-rocket`, not uploaded files — and both columns are
in the currently-unread reserved set besides); a live map preview inside
the admin server (`docs/index.html` is a frozen pre-rendered SVG; a real
preview needs `landing-v3/build-static.mjs`); renaming a section id with
automatic cascade-update of every referencing entry (matches Now's
"rename means delete and recreate, or hand-edit" stance on section keys).

## Files

```text
content/cabinet-sections.tsv     -- source of truth, hand-edited or via the admin server
content/cabinet-entries.tsv      -- source of truth, hand-edited or via the admin server

tools/cabinet-tsv.js             -- shared TSV parse/serialize/validate (build script + editor)
tools/build-cabinet-content.js   -- TSV -> docs/assets/js/cabinet-generated-content.js build script
tools/cabinet-editor.js          -- local admin server (see "Architecture" above)
tools/cabinet-editor-ui/         -- the admin server's browser UI (index.html/editor.css/editor.js)
run-cabinet-editor.bat           -- double-click launcher for tools/cabinet-editor.js
```

## Update workflow

1. `node tools/cabinet-editor.js` (or double-click `run-cabinet-editor.bat`
   from the repo root). Prints a URL — open `http://127.0.0.1:5858/admin/`
   (port configurable via `CABINET_EDITOR_PORT`). `Ctrl+C` stops it.
2. Add/edit/reorder/delete sections and entries through the UI. Rows in
   red show a validation problem on hover (duplicate id, missing field,
   bad reference) — every write re-validates and re-renders immediately.
3. Click "Rebuild" to regenerate `docs/assets/js/cabinet-generated-content.js`.
   Surfaces the build script's own error message directly in the status
   banner if something's still wrong.
4. Preview requires a separate `landing-v3/build-static.mjs` pass (the
   admin server doesn't render the map itself).
5. Commit the TSVs and the regenerated `cabinet-generated-content.js`
   together — the editor never commits anything itself.

Hand-editing the TSVs directly still works exactly as before — both paths
write the same files, no separate state to keep in sync.

## Changelog

### v1.5 — numeric columns clipped from the wrong edge; resize-triggered sort (2026-08-30)

Direct bug report: narrowing `order`/`weight` clipped the number's
*most*-significant digits and kept the least-significant ones in view,
the opposite of what a right-aligned number should do. Root-caused with
an isolated standalone HTML test (three `<input>`s side by side —
`text-align:right` alone, `text-align:right`+`direction:rtl`, and
`direction:rtl` alone — confirmed the RTL trick works correctly for the
plain-CSS case) before touching the app, since the app's own behavior
didn't initially match that isolated result and needed to be reconciled.

Two compounding causes: `text-align:right` alone only sets *where inside
the box* text sits, not which edge stays visible on unfocused overflow —
needed `direction:rtl` too (see "Right-aligned numeric fields" above). But
even with that fix applied, the app still showed the wrong digits,
traced to a second, independent bug: `td input/select/textarea`'s
leftover `min-width: 80px` (from before columns were resizable) kept
inputs wider than their resized `<td>`, so the cell's own
`overflow:hidden` was clipping the *input's oversized box*, not the
input's internal (correctly-anchored) text — confirmed by reading
`offsetWidth` before and after a resize drag: it stayed at 80px
regardless of the column's actual width until the `min-width` rule was
removed. A third, unrelated bug was caught in the process of testing the
first two: a resize drag's `mouseup` landing off the handle fires a
native `click` on the `<th>`, which the header's own sort listener can't
tell apart from a real click-to-sort — confirmed by checking the header's
class before/after a plain resize (it read `sorted` with zero clicks
intended). All three fixed together; see the two notes above for the
mechanism of each.

**Testing note, since two rounds of this went wrong before landing on a
safe method**: a `.fill()`+blur on a real row's field is a real save (the
`change` listener fires and PUTs to the server) — this actually happened
once during this investigation and had to be reverted via
`git checkout`. The safe way to render a value that doesn't exist in the
real file, for visual/rendering checks only, is intercepting
`**/api/state` and rewriting the mocked JSON response before it reaches
the page — the real render code path runs on genuinely-long data with
zero risk of persistence, since the mocked response is never derived from
or written back to any real file.

Verified: isolated `rtl-test.html` (plain CSS, no app code) confirmed the
direction:rtl mechanism itself; a mocked-`/api/state` Playwright pass
against the real running server confirmed the actual render path shows
`789` (trailing digits) instead of `123456` (leading digits) once both
fixes landed; confirmed a plain resize drag no longer sets a header's
`sorted` class while a real header click still does; confirmed via `git
status` that no test in this pass left the real `content/*.tsv` files
touched.

### v1.4 — "Expand text" / "Compact text" toggle (2026-08-30)

Direct follow-up to v1.3's row-height sync: syncing a row's textareas to
match each other only helps once something has already been dragged
taller — there was still no fast way to see every row's full text at
once, or to get back to a compact scan-everything view afterward.

Changed, `cabinet-editor-ui/` only: one button per tab (`#expand-sections`,
`#expand-entries`) toggles `textExpanded[kind]`; `applyExpandState()`
grows every textarea to its own content height when on, clears the
inline override when off; `updateExpandButton()` keeps the button's
label/`.toggled` styling in sync. Both functions run at the end of every
render, so the mode persists across edits rather than resetting on the
next `/api/state` refresh. See "⇕ Expand text / ⇱ Compact text" above.

Verified: Playwright pass — before expand, all `notes` textareas at the
28px compact default; after, heights varied per row's actual content
(28-98px) with short/blank rows correctly staying compact; sibling `tags`
textareas matched `notes`' height per row exactly; an edit-triggered
re-render kept the expanded heights intact; compacting again reset all
back to 28px; button label/state toggled correctly both directions; zero
console errors. Confirmed via `git status` that the test edit used to
trigger a re-render round-tripped back to the original file content.

### v1.3 — sortable/resizable columns, id/order adjacency, row-height sync (2026-08-30)

Direct usability feedback from actually using the Entries tab with all 15
columns: file-order-only browsing made it hard to find rows by
section/order/weight/status; long text (href/tags/notes) was unreadable
in a fixed-width cell; dragging one textarea taller left its row
siblings mismatched; `order` sat far enough from the ▲▼ buttons (which
are what actually change it) to not read as connected.

Changed, `cabinet-editor-ui/editor.js`+`editor.css` only (no server/schema
change): click-to-sort table headers (asc/desc/file-order cycle, per
tab); drag-to-resize column headers (`table-layout: fixed` + tracked
`<col>` widths); `order` moved to render immediately after `id`
regardless of its position in the TSV's own column order (display-only,
`displayCols()`); `ResizeObserver`-based row textarea height sync
(`wireRowTextareaSync()`). See "Columns are sortable and resizable" and
"A row's textareas stay the same height" above for the mechanism.

Verified: Playwright pass against the running UI — header order shows
`id, order, section, title, ...`; sorting by `weight` produced correctly
ascending then descending sequences and disabled the ▲▼ buttons while
sorted (re-enabled after clearing); dragging the `id` column's resize
handle changed its tracked width; manually resizing one row's `notes`
textarea brought its sibling `tags` textarea to the same height; zero
console errors throughout.

### v1.2 — restored `location`/`relatedLinks` after checking WORLD-SYSTEMS.md (2026-08-29/30)

Direct correction, caught only *after* v1.1's deletion had already been
applied to the real TSV data. v1.1's categorization ("nothing in the
current renderer reads this, therefore dead") was checking the wrong
authority: `WORLD-SYSTEMS.md` — the design doc hand-synced byte-for-byte
across Cabinet/Bookshelf/fffx, i.e. the actual canonical statement of what
the schema is supposed to be, not just what one world's renderer currently
happens to use — explicitly lists `location` and `relatedLinks` as
**standard fields every Level 1 world's entries should carry**, not
Cabinet-specific or legacy. This surfaced while investigating an unrelated
question (whether fffx, previously believed to have no `content/`
pipeline at all, actually had one sitting unpulled on `origin/main` — it
did: `e743049`, "adding TSV interface, normalizing naming conventions and
bug tweaks"). Reading fffx's real, live `fffx-entries.tsv` +
`build-fffx-content.js` alongside Bookshelf's showed both pass `location`
straight through to their generated JSON unconditionally, same as
`href`/`kind` — genuinely live in both, not a stale convention.

Three-way resolution, once the conflict was flagged: `location` and
`relatedLinks` restored (the two fields `WORLD-SYSTEMS.md` calls standard
across all three worlds, and confirmably live in the other two);
`icon`/`placement`/`x`/`y`/`cardOrder`/`size`/`cardType`/`leaderTo` stayed
deleted (WORLD-SYSTEMS.md names this exact bundle "Cabinet's own
extension" — documenting that Cabinet once had it, not that any world
currently needs it, and it has no analogue in Bookshelf's or fffx's
schemas at all). See "Live vs. reserved vs. deleted fields" above for the
final per-field breakdown.

Changed: `cabinet-tsv.js` — `location` back in `SECTIONS_COLS`/
`ENTRIES_COLS`; `relatedLinks` back in `ENTRIES_COLS` with
`parseRelatedLinks()` and its validation restored. `build-cabinet-content.js`
— both fields' JSON-transform lines restored (`location` unconditional,
matching `href`/`kind`; `relatedLinks` conditional on non-empty, matching
the original). `content/cabinet-sections.tsv` / `content/cabinet-entries.tsv`
— real `location`/`relatedLinks` values recovered from the last commit (via
a one-off script matching rows by `id`, since nothing had been committed
between the v1.1 deletion and this fix) and merged back into the
already-migrated files, so the v1.1 anchor-clearing and other genuine
deletions weren't undone in the process. `cabinet-editor-ui/editor.js` —
`location` dropdowns and `relatedLinks`' wide-textarea treatment restored.

Verified: re-fetched `/api/state` against the real files post-restore —
zero validation problems, 18/15 columns, spot-checked
`circle-packing-library`'s `relatedLinks` (its GitHub link) and a
section's `location` value both recovered correctly; regenerated
`cabinet-generated-content.js` and grepped for `relatedLinks` to confirm
it round-tripped into the JSON; Playwright pass against the running UI,
zero console errors, reserved panel unchanged (correctly still just
`subtitle`/`thumbnail`, since `location`/`relatedLinks` render in the main
grid).

**Lesson for next time, worth stating plainly**: "grep the code that
consumes this data" answers "is this used right now" — it does not answer
"is this supposed to exist." For a schema explicitly documented as shared
across multiple repos, the design doc is the higher authority on the
second question, and should have been checked *before* deleting real data
against the first, not after.

### v1.1 — schema trim: dropped dead columns, corrected `anchor` (2026-08-29)

Direct follow-up once v1.0's live-vs-reserved split was reviewed: rather
than keep every unread v2-era column around in a collapsed panel
indefinitely, categorize each one (computed-over / real-but-dormant /
designed-but-never-built / plausible-future-use) and clean up accordingly.

**Caught mid-review**: the first pass's "zero matches outside the archive"
claim for entries' visual/placement fields was checked with a pattern
assuming the live code spells the variable `entry` (`entry\.visual`) — it
doesn't; `cabinet-v3-layout.js` uses `e`. Re-run with variable-agnostic
patterns (`\.anchor\b`, not `entry\.visual\.anchor`) found `anchor` *is*
read, at `cabinet-v3-layout.js:1274`, for compass-rose label placement.
Every other field's "unread" verdict held up under the same re-check.
Worth remembering: a targeted grep for "does X get used" is only as good
as the variable name it assumes — checking a properly variable-agnostic
pattern is what caught this before real data got deleted based on a wrong
premise, not after.

**Also checked, per direct request**: whether any of the delete candidates
have analogues in Bookshelf's or fffx's schemas. fffx has no `content/`
pipeline at all yet, so nothing to compare. Bookshelf's
`bookshelf-entries.tsv` has a same-named `location` column (and its build
script does pass it through to the generated JSON) — coincidental overlap
on one field name, not a shared cross-world convention; nothing else on
the delete list (`icon`, `relatedLinks`, `placement`, `x`/`y`,
`cardOrder`, `size`, `cardType`, `leaderTo`) exists in Bookshelf's schema
at all, confirming the repo's own design notes that these were always a
Cabinet-specific extension.

Changed:

- `cabinet-tsv.js`: `SECTIONS_COLS` dropped `location` (18 → 17 columns);
  `ENTRIES_COLS` dropped `location`, `icon`, `relatedLinks`, `placement`,
  `x`, `y`, `cardOrder`, `size`, `cardType`, `leaderTo` (23 → 13 columns);
  `ENTRIES_RESERVED_COLS` trimmed to just `subtitle`/`thumbnail`;
  `parseRelatedLinks` and its validation removed (nothing to validate
  once the column doesn't exist).
- `build-cabinet-content.js`: `buildSections()`/`buildEntries()` stopped
  emitting the dropped fields; `entry.visual` now only ever contains
  `anchor` (when set), not the old `placement`/`size`/`cardType`/`x`/`y`/
  `order`/`leaderTo` bundle.
- `content/cabinet-sections.tsv` / `content/cabinet-entries.tsv`: real
  data migrated via a one-off script (dropped the same columns from every
  row; cleared the four leftover lowercase `anchor` values —
  `100-gradients`, `looms`, `drawing-machines`, `tracery-bots` — that only
  meant anything alongside the now-deleted `placement`/`cardOrder`). The
  four compass entries' `N`/`E`/`S`/`W` `anchor` values were left
  untouched.
- `cabinet-editor-ui/editor.js`+`index.html`: removed dropdowns/logic for
  deleted columns (`location`, `placement`, `size`, `cardType`); `anchor`
  moved from the entries' reserved panel into the main grid, narrowed to
  `N`/`E`/`S`/`W` options; reserved-panel copy rewritten to describe the
  smaller, deliberate (not "everything we haven't checked yet") set.

Verified: `build-cabinet-content.js` re-run clean against the migrated
files (9 sections, 37 entries, zero validation errors); grepped the
regenerated `cabinet-generated-content.js` and confirmed all four compass
entries still carry `visual.anchor` correctly; Playwright pass against the
running UI post-migration, zero console errors.

### v1.0 — initial build (2026-08-29)

`tools/cabinet-tsv.js`, `tools/cabinet-editor.js`, `tools/cabinet-editor-ui/`
created; `tools/build-cabinet-content.js` refactored onto the shared
module; `tools/cabinet-editor-ui/cabinet-data-editor.html` (the earlier
throwaway UI sketch) deleted. Replaces nothing else — this is the first
real Cabinet TSV editor; the Phase-2 requirement's Bookshelf/fffx copies
are noted as future work under "Scope of this pass" above.
