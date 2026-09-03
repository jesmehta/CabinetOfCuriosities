# Cabinet `/now` Page — Design Decisions & As-Built Notes

Companion to [`README.md`](../../README.md) (repo-level guide), in the same
family as `archived-landing-pages/v2/DESIGN-SYSTEM.md`/`LANDING-PAGE-NOTES.md`
for the map landing page. Original planning input for this feature lives in
[`now-page-helpers/`](now-page-helpers/) (`NOW-PAGE-DOCUMENTATION.md`,
`NOW-PAGE-FILE-LIST.md`, `NOW-PAGE-VSCODE-PROMPT.md`) — written before any
code existed, as a spec for whichever tool implemented it. This doc
records what was *actually built* and where it deviated from that spec
and why, the same relationship `landing-page-v3-notes.2.0.md` (this same
folder) has to `archived-landing-pages/v2/LANDING-PAGE-NOTES.md`.

## Purpose

`/now` (`docs/now.md`) is a periodically updated snapshot of what
currently has Jesal's attention: reading, watching, music, projects,
teaching, travel, curiosities, making/experimenting, and recent finds.

It is not a CV, activity feed, project manager, or exhaustive archive.
The core visual idea, unchanged from the original spec:

> The present is crisp; the recent past visibly recedes.

Each section shows only its most recent entries (per-section `visible`
count in `now-data.js`). Older rows stay in `now.tsv` — the data is
append-only and can later support a `/now/archive/` page — but are not
rendered on the current page.

## Why a generated `now.md`, not a standalone HTML page

**This reverses v1.0's original decision** (a standalone `docs/now.html`,
same pattern as `docs/index.html` — see v1.0-v1.1 below and `git log` for
that era). v2.0 (see Changelog) moved to a real MkDocs Material page
instead, once a second, stronger precedent existed for generating a real
`.md` page rather than hand-building HTML: `tools/generate_sitemap.py` →
`docs/sitemap.md`, which does exactly that — a script writes plain
Markdown straight into `docs/`, MkDocs renders it as a normal page,
nothing hand-authored. `/now` mirrors that pattern instead.

What this buys over the v1.x approach: real sidebar nav/breadcrumbs, a
working "on this page" TOC (one entry per section, since each section is
a genuine Markdown heading), and search-index inclusion — none of which a
client-side-rendered `docs/now.html` could offer, since its content
didn't exist in the page until JS ran after load. It also means `/now`
finally reads as the same kind of page as `about.md`/`colophon.md`/
`sitemap.md` structurally, not just colour-matched.

What it costs, accepted deliberately: the page is now static per
rebuild rather than client-rendered (was already effectively true, since
nothing recomputed against "today" at render time — see "Fade hierarchy"
below, tiers are rank-based, not date-of-viewing-based); and previewing a
change requires an actual `mkdocs build`/`serve` pass rather than a
static file refresh, since `now.md` is raw Markdown source, not
renderable HTML by itself.

`docs/now.md` is now the single, real `/now` page — `mkdocs.yml`'s nav
entry ("Now : now.md") needed no change, since it already pointed there
(the old "coming soon" stub just hadn't been replaced yet). There is no
more separate `docs/now.html`.

## Data model

Source of truth: `content/now.tsv` (tab-separated, human-edited).

```text
date	section	value	image	notes	pinned
```

- `date` — ISO `YYYY-MM-DD`, **or** `DD-MM-YYYY` (see "Excel round-trip"
  below — both are accepted and normalized to ISO at build time). Sort
  key; ties break on TSV row order (see `entriesForSection()` in
  `tools/build-now-content.js`).
- `section` — stable key: `reading`, `watching`, `music`, `projects`,
  `teaching`, `travel`, `curiosities`, `making`, `found`, `andThenSome`,
  plus whatever's been added since — see "Adding a section" below.
- `value` — **all public content, including reactions/reviews.** Supports
  a deliberately tiny Markdown subset: `[text](url)` links
  (`http(s)`/`mailto` only), `**bold**`, `*italic*`, and multiple
  paragraphs separated by a blank line (each becomes its own `<p>` — see
  "Markdown subset" below). A book/film entry with a reaction is one
  `value` cell, title line then a blank line then the reaction:
  `[Title](url) — Author\n\n<reaction>`.
- `image` — optional **site-root-relative** path (leading `/`, e.g.
  `/_images/now/reading/somebook.jpg`). Blank is valid — most entries
  don't have one. Root-relative, not `docs/`-relative, because `now.md`
  renders at `site/now/` (MkDocs' directory-URL "pretty links", the site
  default) — one level deeper than a same-directory-relative path would
  resolve from; see v2.0 in the Changelog. See "Files" below for where
  uploaded images actually live, and "Display configuration" for how a
  section's `imageLayout` controls whether it renders beside the text or
  full-width above it.
- `notes` — **private, never rendered — not where reactions go.**
  `tools/build-now-content.js` never reads this field for display, by
  design, so anything meant to reach the public page belongs in `value`.
  Reserve
  `notes` for genuinely private editorial state: `DIF: ...` TODO
  placeholders, "needs photo", etc. See v1.3/v1.4 in the Changelog for why
  this distinction gets its own callout — it was the site's actual first
  real-content bug, not a hypothetical one.
- `pinned` — `TRUE`/`FALSE`, case-insensitive, blank == `FALSE`. Keeps an
  entry visible past its section's normal recency cutoff until manually
  unpinned. Last column, not near `date` — see "Pinning" below for the
  full mechanism and why the column sits there specifically.

**Parser leniency deviation**: unlike `tools/build-cabinet-content.js`
(which requires every row to have exactly as many cells as there are
headers), `build-now-content.js` pads missing *trailing* columns with
`""` instead of erroring. Hand-typed TSV rows routinely drop trailing
empty cells (e.g. a row with content only in `date`/`section`/`value`
has no tabs at all for the blank `image`/`notes` that follow) — this is
normal spreadsheet/editor behaviour, not malformed data. A row with
*more* cells than headers still throws, since that likely means an
unescaped literal tab landed inside a value.

**Excel round-trip**: `now.tsv` gets edited in Excel. Two things Excel
does on save that the parser has to tolerate, not fight:

- Reformats an ISO date cell to the system locale's date format
  (`DD-MM-YYYY` for this repo's India locale) — `build-now-content.js`
  accepts both and normalizes to ISO in the generated output. Ambiguous
  formats (`MM-DD-YYYY`) are **not** accepted — only unambiguous ISO or
  DD-MM.
- Wraps any field containing a literal tab, newline, or `"` in `"..."`
  (CSV-style quoting, doubling internal `"` as `""`) — this fires on
  every multi-paragraph reaction, since a paragraph break is a literal
  blank line inside the cell. `build-now-content.js`'s row parser is a
  proper quote-aware state machine for exactly this reason, not a
  split-on-newline-then-split-on-tab pass — the latter shreds a
  multi-paragraph cell across several bogus rows instead of treating the
  embedded newlines as part of one field. If `now.tsv` is ever hand-edited
  outside Excel (a plain text editor), the same quoting rules apply: only
  quote a field that needs it, and double any `"` inside a quoted field.

## TSV → JS pipeline (deviation from the original spec)

The original `now-page-helpers` spec called for Python
(`tools/build-now.py`) generating a plain `data/now.json`, fetched by the
browser at runtime. **This was intentionally not followed**, and the
pipeline has changed shape once since (v1.x's ES-module output, replaced
by v2.0's real Markdown output — see "Why a generated now.md" above and
the Changelog). The current pipeline:

```text
content/now.tsv  +  docs/assets/js/now-data.js
      ↓  (node tools/build-now-content.js)
docs/now.md      -- real MkDocs page, headings + raw HTML entry-list blocks
```

`build-now-content.js` dynamically `import()`s two ES modules at build
time to do this: `now-data.js` (section config, cache-busted the same way
`now-data-editor.js` does, since it's hand-edited between rebuilds) and
`now-markdown.js` (the shared `renderInline`/`splitParagraphs` Markdown-
subset renderer — see "Markdown subset" below) to pre-render each entry's
`value` text into HTML before writing it into the `.md` file.

Each section becomes a real Markdown heading (`## Title {: .now-section-
title }`, using the `attr_list` extension already enabled in
`mkdocs.yml` for the styling class) so it shows up in Material's sidebar
TOC and search index, immediately followed by one contiguous raw HTML
block (`<ul class="now-entry-list">...</ul>`) for that section's entries
— attr_list alone can't express the side-thumbnail/full-width image
layouts, but a plain Markdown heading followed by an adjacent raw HTML
block needs no special extension (`md_in_html` was deliberately *not*
enabled — entry text is pre-rendered to HTML by the generator instead of
written as literal Markdown inside the block, sidestepping the
blank-line-sensitivity `md_in_html` would otherwise add).

This still matches the *spirit* of the repo's real convention
(`content/cabinet-*.tsv` → `tools/build-cabinet-content.js` →
`docs/assets/js/cabinet-generated-content.js`, and now also
`tools/generate_sitemap.py` → `docs/sitemap.md`) more closely than the
original spec's Python/JSON+fetch approach would have — a build script
writing directly into `docs/` is exactly what `generate_sitemap.py`
already does for `sitemap.md`.

Run after every edit to `content/now.tsv` or `now-data.js`:

```bash
node tools/build-now-content.js
```

## Files

```text
content/now.tsv                          -- source of truth, hand-edited
tools/build-now-content.js                -- TSV+now-data.js -> now.md build script

docs/now.md                               -- AUTO-GENERATED, do not edit -- the real /now page, wired into mkdocs.yml's nav
docs/_assets/backend/js/now-data.js       -- hand-edited: section titles, mode, visible, groupSize, imageLayout
docs/_assets/backend/js/now-markdown.js   -- shared tiny Markdown renderer (dynamically imported by build-now-content.js
                                              at build time, and by the editor's browser-side live preview)
docs/_assets/backend/css/now.css          -- entry-list layout + fade hierarchy + colour accents, wired in via
                                              mkdocs.yml's extra_css (page chrome/typography itself comes from
                                              cabinet-material.css, same as every other MkDocs page)
docs/_images/now/<section>/               -- uploaded images, one subfolder per section (e.g. reading/, travel/,
                                              found/) -- populated by the admin server's upload endpoint, see
                                              "Local admin server" below. Renamed from docs/assets/now/ in the
                                              2026-09-02 docs/ asset reorg -- see README.md's Changelog. Not to
                                              be confused with a root-level assets/now/ (books/travels/other/)
                                              that predates the editor and nothing currently references -- see
                                              the Changelog.

tools/now-tsv.js                          -- shared TSV parse/serialize (build script + editor)
tools/now-data-editor.js                  -- programmatic now-data.js read/write (editor only)
tools/now-editor.js                       -- local admin server (see "Local admin server" below)
tools/now-editor-ui/                      -- the admin server's browser UI (index.html/editor.css/editor.js)
run-now-editor.bat                        -- launches tools/now-editor.js (no spaces, unlike "run Mkdocs serve.bat" -- see its own note below for why)
```

## Local admin server

`tools/now-editor.js` is a local-only, zero-dependency Node HTTP server
(built-in `http` module, same "no npm install" convention as
`build-cabinet-content.js`/`build-now-content.js`) for adding/editing/
reordering `now.tsv` entries and `now-data.js` sections through a browser
UI instead of hand-editing either file. This is the "local editor/admin
utility" the original spec (`now-page-helpers/NOW-PAGE-VSCODE-PROMPT.md`)
left as optional/future — added in v1.5 once hand-editing `now.tsv` in
Excel had already caused two real bugs (v1.3, v1.4 below) that a
structured editor sidesteps by construction (native `<input type="date">`
always sends ISO; multi-paragraph values are typed straight into a
`<textarea>`, never round-tripped through Excel's CSV-quoting at all).

**Run it**: `node tools/now-editor.js` (or double-click `run-now-editor.bat`
from the repo root). Prints a URL — open `http://127.0.0.1:5757/admin/`
(port configurable via `NOW_EDITOR_PORT`). `Ctrl+C` stops it. Binds to
`127.0.0.1` only, no authentication — nothing here is meant to be
reachable from another machine, let alone deployed; it never ships to
`docs/` as served content (`tools/` is authoring-only, same status as
`archived-landing-pages/v2/source/`, see `README.md`'s Structure list).

**What it can do**: add/edit/delete/reorder entries within a section
(the up/down buttons swap a row with its nearest same-section neighbour
in the physical file, which is what actually controls same-date
tie-break order — see "Sorting and Grouping" in the original spec, still
accurate); add/edit/reorder/delete sections (title/mode/visible/
groupSize/imageLayout, i.e. `now-data.js`, not just `now.tsv`); upload an
image via the entry form's file picker — reads the picked file client-side
(`FileReader`, so it works with any file already on disk, doesn't need to
be inside the repo first), uploads it to the server, which writes a *copy*
to `docs/_images/now/<section>/<sanitized filename>` (lowercased,
special characters stripped, a `-1`/`-2` suffix appended on a name
collision so nothing already there gets overwritten) and fills the
entry's `image` field with a **root-relative** path (`/_images/now/...`,
not `_images/now/...` — see "Data model" above for why) — the original
file you picked is never moved or modified; a live Markdown preview of
the `value` field, rendered with the exact same `now-markdown.js` the
generator uses, so the preview can't drift from what actually ships; a
"Rebuild now.md" button that runs the equivalent of
`build-now-content.js` and surfaces its validation errors (bad date,
missing required field, malformed TSV) directly in the UI instead of a
terminal. **Rebuild is a separate manual step, not automatic on save** —
a deliberate choice: `now.tsv` writes settle before the (slightly slower,
and occasionally failing on a bad row) regeneration runs, and a save
followed immediately by a five-line reaction typo doesn't thrash the
build on every keystroke-adjacent action.

**What it doesn't do**: touch `nowPageConfig` (the page-level title/
tagline — still a direct code edit); rename an existing section's key
(the entries referencing it would need a coordinated rename too — delete
and recreate instead, or hand-edit); write anything to `docs/` other than
uploaded images; run outside a manual `node tools/now-editor.js`
invocation (no auto-start, no background service).

**Architecture note**: `tools/now-tsv.js` (TSV parse/serialize) and
`docs/assets/js/now-markdown.js` (the Markdown subset renderer) are each
a single shared module consumed by both the CLI build script and this
server/its UI, specifically so the editor's behaviour and the generated
page's behaviour cannot quietly diverge — see v1.5's Changelog entry for
why this mattered enough to refactor for, not just add alongside. Since
v2.0, `build-now-content.js` (CommonJS) reaches `now-markdown.js` (an ES
module) via a dynamic `import()`, the same technique
`now-data-editor.js` already used to read `now-data.js`.

**`now-data.js` write mechanism**: reads go through a real ESM dynamic
`import()` (so they're always parsed as actual JS, immune to whitespace
differences), but writes locate the `sectionConfig` object's and
`sectionOrder` array's balanced-bracket span by scanning brace depth from
each `export const NAME` marker and replace only that span — every other
line in the file (the header comment, `nowPageConfig`, the
stream-vs-snapshot explainer comment) survives untouched. See
`tools/now-data-editor.js`'s own header comment for the full reasoning;
verified with a round-trip test before shipping (read → write unchanged
data back → deep-equal check + comment-presence check).

**Side effect worth knowing about**: every entry save rewrites the
*entire* `now.tsv` file (read all rows, mutate one, write all rows back),
which means every row's `date` gets normalized to ISO in the process —
even rows you didn't touch. This is a deliberate, welcome side effect
(self-healing the Excel-locale-date problem the first time the editor
touches the file at all), not a bug, but it means a single-entry edit can
produce a full-file diff the first time.

## Adding a section

`build-now-content.js` builds every heading + entry-list block itself
from `sectionConfig`/`sectionOrder` — nothing is hand-authored in
`now.md` (it's fully regenerated on every rebuild). Adding a section is
still a one-file-plus-data change:

1. Add an entry to both `sectionConfig` and `sectionOrder` in
   `docs/assets/js/now-data.js`.
2. Add at least one row with that `section` key to `content/now.tsv`.
3. `node tools/build-now-content.js`.

A section with a `sectionOrder` entry but zero matching `now.tsv` rows is
**silently omitted**, not rendered empty — this is deliberate (an empty
heading with no content reads as broken, not as "nothing here yet"), but
it means "I added the section and it's not showing" is more often a
missing-data problem than a config problem. `build-now-content.js` does
log a `console.warn` (to the terminal running the build, or the admin
server's Rebuild-status banner) for the other failure mode — a
`sectionOrder` key with no matching `sectionConfig` entry (a typo between
the two arrays) — check there first.

(v1.0 shipped with the section markup hand-authored in `now.html` instead
of generated — see the Changelog's "section rendering" entry for why that
was a bug, not a feature. v2.0 replaced `now.html`/client-side rendering
entirely with this build-time generation into `now.md` — see "Why a
generated now.md" above.)

## Display configuration (`now-data.js`)

Kept out of the TSV entirely, per the original spec's design decision —
the schema itself stays unaware of `mode`, `visible`, `groupSize`, or any
presentation detail (with one deliberate, content-level exception: see
"Pinning" below — `pinned` lives on the entry because it's a property of
that specific row, not a section-wide display rule).

```js
reading      stream     visible 6   groupSize 2   imageLayout side   -> 100/100/50/50/25/25
watching     stream     visible 6   groupSize 2   imageLayout side
music        stream     visible 6   groupSize 2   imageLayout side
travel       stream     visible 6   groupSize 2   imageLayout full
making       stream     visible 6   groupSize 2   imageLayout full
found        stream     visible 6   groupSize 2   imageLayout side
projects     snapshot   visible 3   groupSize 1   imageLayout side   -> 100/50/25
teaching     snapshot   visible 3   groupSize 1   imageLayout side
curiosities  snapshot   visible 3   groupSize 1   imageLayout side
```

**`imageLayout`** (added when real images started landing in `now.tsv`):
`"side"` puts the image in a fixed-size portrait-ish box beside the text
(`now.css`'s `.now-entry-image`, 6rem × 8.5rem, `object-fit: cover` —
deliberately *not* a square avatar crop, so a book cover or a link
screenshot reads as a thumbnail rather than a profile picture); `"full"`
spans the image the entry's full width, above the text
(`.now-entry--image-full` / `.now-entry-image--full`, capped at
`max-height: 22rem`). Entries with no `image` render identically either
way — the layout only matters once there's something to lay out.
`reading`/`found` use `side` (book covers, a link screenshot); `travel`/
`making` use `full` (the photo *is* the point, not an illustration next
to text). Configurable per section in the admin server's section-edit
form, not just by hand-editing `now-data.js`.

**Update, since the "snapshot is a display parameter, not a content-shape
rule" note below was written**: `projects`/`teaching`/`making` have since
been rewritten by hand into single flowing-prose entries rather than
one-row-per-item lists — that's Jesal's own real editorial voice, written
directly into `now.tsv` (not generated/invented by whichever tool touched
this file), so the original "don't invent connective narrative" concern
doesn't apply retroactively. The technical point below (mode is a display
parameter, independent of how many rows a section happens to have) is
still accurate and still the reason the schema allows either shape.

Several `teaching`/`andThenSome`-adjacent rows have shared the same date
at various points (all true as of the same editing session) — TSV row
order (not date) is what decides which of them are the visible set in
that case. This is the documented tie-break mechanism, not a workaround.

## Pinning

Added once real usage surfaced a real need: some entries (an especially
impactful book, say) deserve to stay visible well past the point
recency alone would have pushed them out, without becoming a permanent
part of the section (that's what `visible`/fade already handle) or
requiring the section's `visible` count to grow just to accommodate one
old favourite.

`now.tsv` has a `pinned` column (`TRUE`/`FALSE`, case-insensitive, blank
== `FALSE` — same convention as the `status` field in Cabinet's other
TSVs, see `WORLD-SYSTEMS.md`). It's the *last* column, not near `date`
where it'd read more naturally, specifically so every pre-existing row
(none of which had it) keeps parsing via the existing trailing-column
padding leniency instead of needing every row rewritten just to insert a
column in the middle.

**Selection algorithm** (`tools/build-now-content.js`'s
`selectVisibleEntries()`):
pinned entries always make the cut, appended *after* the recency-selected
ones (so a pinned entry lands wherever the last fade tier works out to
be — "kept around on purpose," not "brand new," which is the correct
signal). They count toward `visible`, not on top of it: pinning one entry
in a `visible: 6` section means the 5 most recent *non-pinned* entries
fill the remaining slots, not 6. This is deliberately how a manually-
pinned older favourite can outrank a chronologically-more-recent entry
for one of the visible slots — the one and only place in the whole page
where recency isn't what decides what's shown.

Pinning has no visible marker on the live page (no badge, no icon) — it's
purely an editorial/curation control, consistent with the page's own
non-goals ("avoid excessive metadata badges, visible status labels unless
genuinely useful"). The admin server's entry rows *do* show a "pinned"
badge and a one-click Pin/Unpin toggle, since that's genuinely useful
there.

**Order vs. date, resolved**: an earlier ask was "the editor's up/down
arrows don't seem to do anything, can order be separated from date?" The
real need turned out to be pinning, not general manual reordering — date-
first sorting stayed exactly as-is (it's what gives the fade hierarchy its
meaning), and the arrows still only mean "swap TSV row order with the
nearest same-section neighbour," which still only visibly changes the
page when that neighbour shares the same date. The admin UI now disables
an arrow whenever clicking it wouldn't change anything, rather than
leaving every arrow always clickable regardless of whether it does
anything.

## Fade hierarchy

Per the original spec's "Important Visual Rule": no literal
`opacity: 1 / .5 / .25` in content or CSS. `now.css`'s `.now-current` /
`.now-recent` / `.now-old` classes vary ink colour and font-weight
against the `--cab-paper` background from `cabinet-tokens.css` instead
(see v1.1 in the Changelog for that token), so the oldest tier stays
legible rather than fading toward unreadable.

**Current tier uses a blue accent, not ink** (`--now-accent: #1c5f8a`,
defined at `:root` in `now.css`) — see "Colour accents" below for where
that token comes from and why. `.now-entry-value a`'s base colour is
`inherit` rather than a hardcoded ink value specifically so a link inside
a current-tier paragraph (most `reading`/`watching` entries are
`[Title](url)` as their first line) picks up that blue instead of
overriding it back to plain ink; recent/old-tier links inherit their own
tier's muted colour the same way.

**Scoped down from the spec**: the spec asked for tuning "in Cabinet's
light and dark themes." Cabinet's standalone pages (`index.html`) and its
MkDocs Material pages (`/now` included, since v2.0) don't currently have
a dark theme at all — `cabinet-tokens.css` defines one palette, full
stop. `now.css` only tunes for that one palette. Revisit if/when Cabinet
gets a real dark mode.

## Colour accents

Direct request: bring in some of the live homepage's "Topology" theme
(`cabinet-v3-style.css`'s `[data-theme="satellite"]`, dropdown label
"Topology" — blue/cyan/green/coral, the one theme that isn't
medieval-map's ambers) as accent colour on `/now`, on top of the existing
parchment/ink base, without wiring `now.css` up to that file's `--v3-*`
custom properties. Two new tokens, defined locally at `:root` in `now.css` (originally
scoped to a `body.now-page` block in v1.x's standalone page — moved to
bare `:root` in v2.0 since a Material page has no such body class to
hook into; harmless at `:root`, these names collide with nothing else in
the site), values *matching* (not referencing)
`--v3-sea-deep`/`--v3-sea-shallow`:

```css
--now-accent: #1c5f8a;         /* = --v3-sea-deep, used as-is */
--now-accent-bright: #2a9797;  /* --v3-sea-shallow (#43d6d6) darkened one
                                   step -- the literal value reads as a
                                   wash, not text/rule colour, against
                                   parchment; same reasoning
                                   cabinet-tokens.css's own
                                   --cab-focus-ring (#1c5f6b, already a
                                   close cousin of --now-accent) documents
                                   for why its cool teal isn't fully
                                   saturated either */
```

**Why not just `@import cabinet-v3-style.css` or reference `--v3-*`
directly**: that file is an actively-in-flux prototype/dev-tool system
(see its own header comment — seven parallel colour treatments meant to
be compared, only two ever promoted to production) — `/now` picking up
its future retuning as a side effect would be exactly the kind of
implicit coupling the rest of this doc has avoided (see "TSV → JS
pipeline" above on preferring the repo's real patterns deliberately,
not by accident). Matching the *values* gets the visual kinship without
the dependency.

**Where they're used** — deliberately not a wholesale repaint, on the
"personal notebook, not a dashboard" design character from the original
spec: the current fade tier's text colour (`.now-current .now-entry-value`
— see "Fade hierarchy" above, this is what actually delivers a
repeated-throughout-the-page presence rather than one link colour
buried in prose), every section title's underline (`.now-section-title`,
2px, was a thin neutral `--cab-card-border` line), and entry-link hover
states (`--cab-accent`'s brown, Material's own default link accent
site-wide via `cabinet-material.css`'s `--md-typeset-a-color` mapping, is
unchanged everywhere else including `/now`'s own body text — this accent
is scoped to `now.css`'s entry-list classes alone, not a site-wide
repaint).

## Markdown subset

`now-markdown.js`'s `renderInline()` (shared between
`build-now-content.js`, which dynamically imports it to pre-render entry
text at build time, and the editor's live preview — see "Local admin
server" above) escapes HTML
first, then supports exactly three inline patterns: `[text](url)`,
`**bold**`, `*italic*`. Link URLs are checked against
`^(https?:|mailto:)/i` before being used as an `href` — anything else
(e.g. `javascript:`) silently degrades to plain text rather than being
dropped or throwing. No Markdown library dependency, matching the spec's
"avoid unnecessary dependencies."

**Block level**: `splitParagraphs()` (also in `now-markdown.js`) splits a
`value` on blank lines *before* `renderInline()` runs, producing one `<p
class="now-entry-value">` per paragraph inside a `.now-entry-text`
wrapper div (needed so a multi-paragraph entry's paragraphs stack in a
column instead of the `<li>`'s own flex row laying each paragraph out as
a separate side-by-side item next to the optional image). A lone
remaining single newline *within* a paragraph collapses to a space rather
than becoming a `<br>` — the only structural break this renderer
understands is a full blank line between paragraphs. Added in v1.4 (see
Changelog) once real multi-paragraph reactions (the *Odyssey*/*Shattered
Lands* entries) made "one long run-on paragraph" visibly wrong.

## Content sourcing note

The `reading` section's Goodreads links were looked up and verified via
web search on 2026-08-28 (not fabricated) — see git history/commit for
that date if a link ever needs re-checking. All `DIF: ...` notes from the
original spec (reactions, expanded travel writeups, photos) were
preserved verbatim in `now.tsv`'s `notes` field rather than invented.

## Update workflow

**Via the admin server** (see "Local admin server" above) — the
preferred path as of v1.5, still true post-v2.0:

1. `node tools/now-editor.js`, open `http://127.0.0.1:5757/admin/`.
2. Add/edit/reorder entries and sections through the UI.
3. Click "Rebuild now.md".
4. Preview by running `mkdocs serve` separately (`now.md` is real
   Markdown, not directly viewable HTML, so the admin server itself
   can't render a preview of it the way it used to serve `now.html`
   statically — see "Why a generated now.md" above). `mkdocs serve`
   watches `docs/` and live-reloads, so a rebuild's fresh `now.md` shows
   up there without a manual restart.
5. Commit the TSV, `now-data.js` (if sections changed), the generated
   `now.md`, and any added images together — the editor never commits
   anything itself.

**Hand-editing `now.tsv` directly** still works and is sometimes faster
for bulk changes (e.g. pasting several rows from elsewhere) — Excel or a
text editor, then:

1. `node tools/build-now-content.js`.
2. Preview via `mkdocs serve`, same as above.
3. Commit as above.

Both paths write the same `content/now.tsv` — mixing them across
sessions is fine, there's no separate state to keep in sync.

## Non-goals (carried over from the spec, still true)

Atlas integration, project-status enums, public write-back/editing, a
universal content schema, image galleries/arrays, database storage,
separate content types for prose vs. list vs. stream, per-row
presentation metadata, stored opacity values, archive UI.

## Changelog

### v2.1 — `docs/` asset reorg: `/now`'s files moved under `_images`/`_assets` (2026-09-02)

Part of a repo-wide `docs/` reorganization (see `README.md`'s own
changelog entry for the full picture), not a `/now`-specific change.
`docs/assets/now/<section>/` → `docs/_images/now/<section>/` (and every
TSV `image` cell, the upload endpoint, and the editor UI's path
placeholder updated to match); `docs/assets/js/now-data.js` →
`docs/_assets/backend/js/now-data.js`; `docs/assets/js/now-markdown.js`
→ `docs/_assets/backend/js/now-markdown.js` (including the editor UI's
own browser-side import of it); `docs/assets/css/now.css` →
`docs/_assets/backend/css/now.css`. Every hardcoded reference across
`build-now-content.js`, `now-editor.js`, `now-data-editor.js`, and the
editor UI was updated together, then the full pipeline re-run
(`build-now-content.js`, `mkdocs build --strict`) to verify nothing
broke. "Data model" and "Files" above already describe the new paths as
current state, not as a diff from this entry.

### v2.0 — moved from standalone now.html to a generated now.md (2026-08-29)

Reverses v1.0's original "standalone `docs/now.html`" decision. Motivated
by a direct request to match `about.md`/`colophon.md`/`sitemap.md`
structurally (sidebar nav, breadcrumbs, TOC, search — none of which a
client-rendered standalone page could offer), not just visually — and by
`tools/generate_sitemap.py` → `docs/sitemap.md` already being a working,
committed precedent in this exact repo for "a script writes real
Markdown straight into `docs/`, MkDocs renders it as a normal page." See
"Why a generated now.md, not a standalone HTML page" above for the full
reasoning and tradeoffs accepted.

Changed:

- `tools/build-now-content.js` rewritten: instead of serializing
  `nowEntries` to `docs/assets/js/now-generated-content.js` (an ES module
  for client-side rendering), it now dynamically imports `now-data.js`
  and `now-markdown.js` at build time and writes `docs/now.md` directly —
  a real Markdown heading per section (`attr_list`-styled,
  `## Title {: .now-section-title }`) followed by one raw HTML block per
  section for the entry list (image-layout structure isn't expressible
  in `attr_list` alone; entry text is pre-rendered to HTML via the
  ported `now-markdown.js` call rather than left as literal Markdown
  inside the block, so `md_in_html` was never needed).
- `docs/now.html`, `docs/assets/js/now-render.js`, and
  `docs/assets/js/now-generated-content.js` deleted — client-side
  rendering is retired entirely. `now-markdown.js` survives (still used
  by both the generator and the admin editor's live preview).
- Image paths switched from `docs/`-relative (`assets/now/...`) to
  site-root-relative (`/assets/now/...`) — `now.md` renders at
  `site/now/` (MkDocs' directory-URL pretty-links), one level deeper
  than the old flat `docs/now.html`, so a same-directory-relative path
  would have resolved one directory too deep. One-time migration of all
  existing `now.tsv` image paths, plus `tools/now-editor.js`'s upload
  handler updated to write the new format for every future upload.
- `docs/assets/css/now.css` rewritten: dropped page-chrome rules
  (`body.now-page`'s background/font, `.now-shell`, `.now-back-link`,
  `.now-header h1`, `.now-tagline`, `.now-updated`) now that Material's
  own typesetting (via `cabinet-material.css`, already applied to every
  other content page) handles those; kept and re-scoped the entry-list/
  fade-hierarchy/accent rules, prefixing every selector with
  `.md-typeset` so they reliably out-specificity Material's own
  element-level rules (e.g. `.md-typeset h2`, `.md-typeset ul`) rather
  than risking a load-order-dependent loss. Wired into `mkdocs.yml`'s
  `extra_css`.
- `tools/now-editor-ui/`'s "Preview /now.html" link removed (no more
  static file to preview) and its "Rebuild site data" button/copy
  retitled "Rebuild now.md"; subhead and server startup log now point
  at running `mkdocs serve` separately for a live preview instead.

Verified: `mkdocs build --strict` clean (no new warnings attributable to
`now.md`); inspected the actual rendered `site/now/index.html` output —
confirmed real `<h2 class="now-section-title" id="...">` elements with
working permalink anchors, the sidebar/secondary TOC nav linking to those
same ids, entries' raw HTML blocks passed through intact (images, links,
`<em>`/paragraph structure all correct), and root-relative image `src`
paths resolving as authored.

### v1.8 — documentation pass; found orphaned root-level image duplicates (2026-08-29)

No code changes — reconciled this doc against the actual current state
after v1.7 landed: the "Data model" schema table at the top still listed
only 5 columns (missing `pinned`, which v1.7 added but only documented in
its own "Pinning" section, not back-ported to the canonical schema
listing); the "Files" list didn't mention `docs/assets/now/` at all
despite it now being real, populated, and referenced by every image path
in `now.tsv`. Both fixed.

Also noted here since it surfaced while checking `git status` for this
pass, not from any code change: a **root-level `assets/now/`**
(`books/`, `travels/`, `other/` — 10 images) exists alongside the real
`docs/assets/now/` (`reading/`, `travel/`, `found/`) the editor actually
uses. Different folder names and filenames from what's in `now.tsv` now,
and outside `docs/` entirely (so it would never deploy regardless) —
looks like an original manual upload location from before the editor's
upload feature existed, now orphaned and unreferenced by anything. Left
in place, not deleted — cleanup call belongs to Jesal, not an
automatic action. A `content/now.tsv.bak` (also not written by any
script here) was found the same way.

### v1.7 — pinning, per-section image layout, colour accents (2026-08-29)

Three real requests landed together, from actual use of both the page
and the editor with real content (images, multi-paragraph reactions) for
the first time:

- **Pinning** (`pinned` TSV column, `selectVisibleEntries()` in
  `now-render.js`, Pin/Unpin + a checkbox in the admin UI). Grew out of a
  question about the editor's up/down arrows appearing to do nothing —
  the real ask underneath was "keep an especially good old book visible
  past its normal recency cutoff," a content-level need the display-config
  system (`mode`/`visible`/`groupSize`, all section-wide) couldn't
  express. See "Pinning" above for the selection algorithm and why the
  column is last, not near `date`.
- **`imageLayout`** (`"side"` | `"full"`, `now-data.js` per-section
  config, `now.css`'s `.now-entry--image-full`/`.now-entry-image--full`).
  `reading`/`found` get bigger portrait-box thumbnails (was a small
  square avatar-style crop); `travel`/`making` get full-width images
  above the text. See "Display configuration" above.
- **Colour accents** (`--now-accent`/`--now-accent-bright`, `now.css`).
  Blue-green values matching (not importing) the live homepage's
  "Topology" theme, applied to the current fade tier's text, section
  title underlines, and link/back-link hovers. See "Colour accents"
  above for the full reasoning and why it's value-matching rather than a
  live dependency on `cabinet-v3-style.css`.

Verified: `readEntries`/`writeEntries` round-tripped against the real
(by-then already hand-rewritten, image-bearing) `now.tsv` with a
before/after semantic diff (parsed-entry comparison, zero unintended
field changes) both after the schema change alone and again after a full
admin-UI pass (toggle-pin, edit-form checkbox, section imageLayout
dropdown); the pinning selection algorithm specifically, by temporarily
marking one `reading` entry pinned, rebuilding, and confirming via
Playwright it appeared last in the section while displacing the
chronologically-6th entry — then reverted before this changelog entry
was written, since it was a verification step, not an actual editorial
decision to pin that book.

### v1.6 — fixed duplicate-listener dialog storm on the Link button (2026-08-29)

Real bug hit while actually using the editor (not caught by v1.5's own
test pass, which didn't happen to type into a form before clicking a
toolbar button): clicking "Link" in the value-field toolbar reopened its
`prompt()` dialog over and over. Cause: `editor.js`'s `MutationObserver`
re-wires every open form's event listeners on *any* childList mutation in
`#sections-root`'s subtree — which includes the live-preview `<div>`'s own
`innerHTML` update on every keystroke, not just a top-level `render()`
swap. `wireEntryForm()` had no guard against re-running on an
already-wired form, so each keystroke attached one more full set of
duplicate listeners (image upload, Bold/Italic/Link, the preview's own
`input` listener) on top of the existing ones; clicking Link once then
fired all of them in sequence. Fixed with an idempotency guard
(`form.dataset.wired`) in `wireEntryForm()`. Verified with a Playwright
test simulating the exact reported scenario (type a long reaction, then
click Link once) — confirmed exactly one dialog before the fix would have
shown many, and confirmed a fresh form (cancel, reopen, type, click)
still wires correctly, i.e. the guard doesn't block legitimate re-wiring
of a genuinely new form instance.

**If this happens to you again before pulling the fix**: any entry you'd
already clicked Save/Add for is already written to `now.tsv` on disk —
refreshing the admin page is safe for that data. Only the unsaved text
in the form you were actively editing when the dialogs started lives
solely in the browser and would be lost on refresh; keep dismissing the
stacked dialogs (they're finite, not an infinite loop) and either submit
that form or copy its text out before refreshing.

### v1.5 — local admin server (2026-08-29)

Added `tools/now-editor.js`, a local Node HTTP server + browser UI for
managing `now.tsv` entries and `now-data.js` sections without hand-editing
either file — the "local editor/admin utility" the original spec left as
optional. Motivated directly by v1.3/v1.4: two real bugs in one session
both traced back to hand-editing `now.tsv` in Excel (locale date
reformatting, reactions typed into the wrong column). A structured form
sidesteps both by construction rather than by more parser hardening.

Refactored two pieces into shared modules as part of this, rather than
letting the editor duplicate logic that could drift from the live page:
`tools/now-tsv.js` (TSV parse/serialize, previously inlined in
`build-now-content.js`) and `docs/assets/js/now-markdown.js` (the
Markdown-subset renderer, previously inlined in `now-render.js`) — both
now imported by the editor too, so its live preview and its writes can't
diverge from what the actual page does with the same data.

Found and fixed one real bug during testing, not a hypothetical one: a
stray `\r` survived inside a quoted TSV field's paragraph break (from an
Excel export quirk in v1.4's data), producing `\r\n\r\n` instead of
`\n\n`. It happened to render correctly anyway (regex backtracking +
`.trim()` in `splitParagraphs()` absorbed it), but that was luck, not
design — added explicit newline normalization in `now-tsv.js`'s
`readEntries()` so every consumer gets clean `\n` only, rather than
relying on a downstream `.trim()` as an implicit safety net.

Verified with: a round-trip test on `now-data-editor.js`'s write path
(read real `now-data.js` → write unchanged data back → deep-equal +
comment-presence check, then restored the original file) before building
the server on top of it; a full Playwright walkthrough of the running UI
(add/edit/move/delete an entry, add/move/delete a section, image upload
path, rebuild button) against a backed-up copy of the real `now.tsv`/
`now-data.js`, with a semantic diff (parsed-entry comparison, not raw
text) confirming zero content change after cleanup.

### v1.4 — reactions moved from notes to value; paragraph rendering added (2026-08-28)

Following v1.3's Excel round-trip: the first-ever real content pass filled
in book/film reactions for `reading`/`watching` — but into `notes`,
following the `DIF: add one-line reaction` placeholder that v1.0 had left
sitting exactly there. Since `notes` is never rendered by design, none of
those reactions would have appeared on the live page. Moved all 10
(7 `reading` + 3 `watching`) into `value` as a second paragraph
(`title/author line` + blank line + reaction), cleared the now-redundant
`notes` cells, via a one-off transform script (not hand-edited — too easy
to get the CSV-style quoting wrong by hand for the two multi-paragraph
reactions). Also fixed one incidental typo surfaced in the same pass
("it.Must watch" → "it. Must watch", *The Expanse* — mechanical, not a
content rewrite).

Two of the moved reactions (*Shattered Lands*, the *Odyssey* essay) are
genuinely multi-paragraph. `renderInline()` had no concept of paragraph
breaks — a `value` was always one `<p>` — so those would have rendered as
one visually run-on block. Added `splitParagraphs()` + a
`.now-entry-text` wrapper div (see "Markdown subset" above) so blank-line
breaks become separate `<p>` tags that stack correctly next to an entry's
optional image.

`value`'s field-rules documentation above was rewritten to state the
notes-vs-value distinction explicitly, since this was the site's first
actual instance of the ambiguity causing a real (if silent) content bug.

### v1.3 — Excel round-trip hardening (2026-08-28)

`now.tsv` was re-saved from Excel and the build script broke immediately:
Excel had reformatted every ISO date to the system locale's `DD-MM-YYYY`,
which failed the strict ISO check on the very first row. A second,
worse-but-latent bug was found in the same pass: two reaction cells
(*Shattered Lands*, *The Odyssey*) contain blank-line paragraph breaks,
so Excel's tab-delimited export correctly CSV-quoted them (wrapping the
field in `"..."`, doubling internal `"`) — but `build-now-content.js`'s
original parser split the raw file on every newline *before* any
quote-awareness, which would have shredded each of those two rows across
several bogus rows once the date check was fixed. Rewrote the row parser
as a proper quote-aware state machine (handles multi-line quoted fields
and `""`-escaped internal quotes) and extended date parsing to accept
both ISO and `DD-MM-YYYY`, normalizing to ISO in the generated output —
see "Excel round-trip" above for the details. Both fixes are about
tolerating what Excel actually does on save, not asking Excel (or future
edits) to behave differently.

### v1.2 — section rendering made data-driven (2026-08-28)

Bug found when adding an `andThenSome` section to `now-data.js`'s
`sectionConfig`/`sectionOrder`: nothing appeared. Cause: v1.0's
`renderSection()` looked for a `<section data-now-section="...">` that
already had to exist in `now.html`'s hand-authored markup — one
`<section>` block per section key, copy-pasted nine times. Adding a
section in `now-data.js` alone was never going to work; it also needed a
matching block hand-added to the HTML, defeating the point of having a
config file. Fixed by making `now-render.js` build each `<section>`
element itself from `sectionConfig`/`sectionOrder` and append it to
`now.html`'s now-empty `<main>` — see "Adding a section" above for the
resulting (one-file) workflow. Sections with zero matching `now.tsv` rows
are still omitted rather than rendered empty, unchanged from v1.0.

### v1.1 — background token fix, matched to content pages (2026-08-28)

`now.css` shipped in v1.0 using `--cab-paper-deep` as the page background
— wrong token: that's the map shell's backdrop tone (see
`DESIGN-SYSTEM.md`'s palette table), not a content background, and it
made `/now` visibly darker/tanner than every other page. Switched to
`--cab-paper`, matching `--md-default-bg-color` in `cabinet-material.css`
— the actual background every Material-rendered content page (`about.md`,
`colophon.md`, `teaching.md`, ...) uses. Font was already plain Georgia
throughout (`--cab-font-body`), same as those pages, so no font change was
needed.

**Deliberately not matched**: the live homepage (`docs/index.html`, v3's
"medieval-map" theme) uses its own locally-overridden palette
(`--v3-ink: #1c1712`, `--v3-sea-deep: #f4ebdd`) and decorative Google
Fonts (Cinzel for its h1, IM Fell English/EB Garamond for labels) scoped
to `body.v3-proto[data-theme="medieval-map"]` only — per
`cabinet-v3-style.css`'s own comments, that's an in-progress prototype
palette "still on hold," not the site's settled theme. `/now` matches the
`--cab-*` tokens every Material content page already uses instead, since
those pages are the actual majority of "the rest of the site." Revisit if
the v3 palette ever gets promoted into `cabinet-tokens.css` itself.

### v1.0 — initial build (2026-08-28)

- `content/now.tsv` seeded with all entries from `now-page-helpers`'
  "Initial Data"/"Initial Content Notes" (44 rows across 9 sections).
- `tools/build-now-content.js`, `docs/assets/js/now-generated-content.js`,
  `docs/assets/js/now-data.js`, `docs/assets/js/now-render.js`,
  `docs/assets/css/now.css`, `docs/now.html` created.
- Deviated from the original spec: Node/ES-module pipeline instead of
  Python/JSON+fetch (matches Cabinet's existing convention); lenient
  trailing-column TSV parsing; `projects`/`teaching` kept as one-row-per-item
  rather than hand-combined prose.
- Goodreads links for all seven `reading` entries verified via web search,
  not fabricated.
- `mkdocs.yml` nav and `docs/now.md` deliberately left untouched at this
  point (reversed in v2.0 — see "Why a generated now.md" above).
