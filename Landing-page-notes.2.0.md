# Notes: the v3 landing-page layout prototype (`landing-v3/`)

This is a **live reference**, kept current as the prototype changes --
not a diary. Sections below describe how `landing-v3/` actually works
right now; the "Changelog" section at the bottom is where superseded
reasoning (approaches tried and rejected, bugs found and fixed) is
preserved instead, same convention as fffx's own `LANDING-PAGE-NOTES.md`.
Currently on **v3.6.4** (domain warping for real concave coastlines,
interactively tuned via an on-page control panel, split across three
pages -- `index.html` a zero-JS static build of the evolving real
prototype, `islands-tool.html` the permanent live tuning tool,
`archive/v3.6/` a frozen snapshot -- plus a paste-friendly
`cabinet-v3-data.js`, a by-editability file table below, and (new)
offset coastline ripple rings) -- see the changelog for the full
v3.0 -> v3.1 -> v3.2 -> v3.3 -> v3.4 -> v3.4.1 -> v3.4.2 -> v3.5 ->
v3.5.1 -> v3.5.2 -> v3.5.3 -> v3.5.4 -> v3.6 -> v3.6.1 -> v3.6.2 ->
v3.6.3 -> v3.6.4 progression and why each pass changed what it did.
This section is now in an active visual-polish phase (colors, ripples,
sea serpent, boats, water texture, a possible flow-field stretch goal)
-- entries from here get a lighter documentation pass than the
algorithm-design work above, matching the pace of the work itself.

Screenshots of each version are kept in `landing-v3/dev-screenshots/`
(git-tracked, named `v{version}-{what-changed}.png`) specifically to
make this visual progression browsable without re-running anything --
add a new one there (don't overwrite an old version's) whenever a
change is significant enough to warrant its own changelog entry.

Kept deliberately separate from `LANDING-PAGE-NOTES.md` (which documents
the live `docs/index.html` archipelago map, v2.0/v2.1) rather than
merged into it. This is a from-scratch rework of the map's *layout
mechanics* -- weighted proportional regions, entries packed as circles
instead of hand-placed plaques -- explored in an isolated prototype
(`landing-v3/`, outside `docs/` so MkDocs never builds it) so the live
site is untouched while this is reviewed. Fold this file into
`LANDING-PAGE-NOTES.md` (and `landing-v3/` into `docs/`) once the
approach is approved; until then treat this as the working record of
that decision, not yet a "how it actually works" reference for anything
live.

## Intent

The v2.x map (`docs/index.html`) hand-places every island and card at
authored `cx/cy`/`x/y` coordinates in `content/cabinet-*.tsv`. That's
fine at 7 sections / 25 entries but doesn't scale gracefully -- every
new entry needs a human to eyeball a free spot on the SVG, and nothing
about a section's on-page *size* reflects how much is actually in it.

The brief for this pass: replace hand-placed coordinates with two
composed algorithms --

1. A **weighted rectangular partition** of the whole canvas into one
   region per section, sized proportional to that section's total
   weight (fffx already built almost exactly this for its own landing
   page -- see "Relationship to fffx's layout" below).
2. Inside each region, a **circle-packed archipelago**: every visible
   entry becomes a circle sized by its own weight, packed into a
   cluster centered in the region, plus a handful of extra
   (non-content) circles so a region never looks sparse just because it
   doesn't have many entries yet.

This is explicitly a *layout* rework, not a visual-design rework --
`landing-v3/cabinet-v3-style.css` reuses `docs/assets/css/cabinet-tokens.css`
(the real parchment/ink palette) rather than inventing a new one, so
what's under review is composition, not color/type.

## Relationship to fffx's layout (read this first if you haven't seen
`form-follows-fx/LANDING-PAGE-NOTES.md`)

fffx's `docs/index.html` already solved "partition a canvas into
weighted per-section regions" for its own landing page --
`fffx-subdivision.js`'s `buildRectTree()` peels one rectangular region
per section off the canvas, sized by `weight_i / totalWeight`, then
recursively subdivides *inside* each region down to individual
per-entry rectangles. Worth reading before touching this prototype's
code; several of its hard-won fixes (documented in fffx's own
changelog -- thin-sliver sections, inset math, the "never recompute
`baseTileArea` as a constant" fix) are exactly the kind of bug this
prototype's own algorithms are one design decision away from
reintroducing if edited carelessly.

Where v3 **diverges** from fffx, and why:

- **Squarified treemap, not a linear peel-chain.** fffx's
  `buildRectTree()` peels sections off one at a time in a chain (`peel
  section 1's share, recurse into the remainder for section 2, ...`)
  using `splitRectSquarified()` (try both axes per peel, keep whichever
  is closer to square) -- which *reduces* aspect distortion but doesn't
  bound it; fffx's own writeup describes a real bug where a low-weight
  section landed as a sub-`minThumbWidth` sliver despite a "perfectly
  reasonable" area share, fixed only by growing the *field* until every
  section's floor cleared, not by fixing the shape. `cabinet-v3-treemap.js`
  implements the actual Bruls/Huizing/van Wijk squarified-treemap
  algorithm (rows/columns of items, each row sized to keep its members
  close to square) instead of a peel-chain regardless -- it's the
  better-behaved starting point even without a hard aspect contract on
  top. (v3.0 *did* have a hard 9:16-16:9 contract with a canvas-height
  search to try to satisfy it; relaxed in v3.1 per explicit direction --
  see the changelog.)
- **Circles, not rectangles, below the section level.** fffx recurses
  the *same* rectangle-split algorithm all the way down to individual
  entries. Cabinet's brief wants an archipelago metaphor inside each
  region, so v3 switches algorithms entirely at that boundary: circle
  packing (`cabinet-v3-circlepack.js`), not further rectangle
  subdivision.
- **Bake it once, don't reseed every load.** fffx deliberately
  reseeds its subdivision's randomness on every full page load
  (`loadSeed = Math.random()...`, module-scope, see its notes) and
  recomputes the whole field on every resize. Explicit instruction for
  this prototype was the opposite: "the layout is not recomputed every
  time the page loads, it is recomputed only when new entries (or
  sections) are added (or removed)." So `cabinet-v3-layout.js` renders
  once into a fixed-aspect SVG `viewBox` (same responsive-scaling
  technique the *real* `docs/index.html` map already uses) and has no
  resize listener and no `Math.random()` anywhere in the render path --
  the only randomness in the whole prototype is `defaultExtrasFor()`'s
  string-hash fallback (deterministic, not `Math.random()`), and even
  that's meant to be replaced by an authored value per section (see
  "Extras" below).

## Design decisions from the conversation

These were open questions posed back to the user before writing any
code; recorded here so the reasoning survives even though the chat
history won't ship with the repo.

### Section weight is computed, not authored

`content/cabinet-sections.tsv` currently has its own hand-authored
`weight` column, independent of any entry. v3 **ignores that column**
and computes a section's weight as the sum of its own visible entries'
`weight` values -- exactly fffx's convention (`layout.js`: "A section's
weight is the sum of its own visible entries' weight; sections with
none get zero weight and are dropped"). Decided explicitly, not
inherited by default: two independently-tunable weight numbers per
section (one authored, one implied by entries) had no clear meaning for
"this section's proportional share of the page," and the whole point of
this pass is that a section's on-page size should *reflect what's
actually in it*.

Consequence for the real schema, if/when this merges: the `weight`
column on `cabinet-sections.tsv` becomes redundant and should be
dropped, not just ignored -- left as a follow-up, not done in this pass
since v3 currently reads real content *around* the production TSVs
(via `cabinet-generated-content.js`) without editing them.

### Extras: schema-controlled composition, not per-load randomness

The brief's "plus a random few extras -- a number between 3-8" could
have meant "roll it fresh in the browser." Clarified: no -- the count
*and* the split between visible "coming soon" stubs and plain
decorative filler within that count are **authored per section**
(`landing-v3/cabinet-v3-extras-config.js`), because the whole layout is
meant to be stable until content actually changes, not different on
every reload. Concretely: a section like `teaching` gets `{ count: 6,
comingSoon: 3 }` -- 3 real entries' worth of room to grow, visibly
marked as reserved, plus 3 that are pure atmosphere. `about` (a section
that's realistically "done," not expecting new entries) gets `{ count:
3, comingSoon: 0 }` -- filler only, no advertised empty slots.

This file is explicitly written as a **schema-extension proposal**, not
just prototype scaffolding: its own top comment states the two new
optional `cabinet-sections.tsv` columns it stands in for
(`extraCount`, `extraComingSoon`), so porting this into the real
pipeline later is "delete this file, add two TSV columns," not a
redesign. `defaultExtrasFor()` exists only as a fallback for a section
nobody's hand-tuned yet (deterministic hash of the section id, 3-8) --
every one of the 7 real sections currently has an authored entry, so
that fallback never actually fires against real content today.

### Real content, not synthetic data

The prototype imports `sections`/`entries` directly from
`docs/assets/js/cabinet-generated-content.js` (read-only -- v3 never
writes to it) rather than inventing sample data, so this genuinely
previews what the live 7-section/25-entry map would look like under
this layout, not an idealized stand-in.

### Region squareness relaxed; growth-based packing ported from the
user's own library (v3.1)

Two further decisions from the second round of the conversation:

- **The 9:16-16:9 region-aspect contract is relaxed, not enforced.**
  Explicit direction: "I am relaxing the squarish constraint, let's see
  how that works or we can get it back." `squarify()` still tends
  toward reasonably square rows as a side effect of its own row-scoring
  (that's what the algorithm optimizes for internally), but nothing
  validates the result against a band anymore, and canvas height is no
  longer chosen by searching for one -- see "How the layout is built"
  below for what replaced it.
- **Circle packing is a direct port of `CirclePack.js`'s growth
  algorithm**, not the row-flow grid v3.0 shipped. Pointed at explicitly:
  "Refer to my Circle Packing page and it's data to understand how I
  wrote a circle packing library" -- `jesmehta/p5-circle-packing`'s
  `CirclePack.js` (`getCirPack`/`Bubble`/`growBub`/`checkPos`/
  `compareDist`). v3.0's row-flow packer produced correct, non-
  overlapping output but visibly read as a laid-out grid, which was the
  direct complaint ("I specifically asked for circle packing, not a
  grid of circles"). See "How archipelagos are packed" below for the
  ported algorithm, and "Why growth-based packing" for how it differs
  from the reference (region-boundary collision, weight-derived starting
  radius, order-driven seed assignment) and why v3.0's row-flow was
  abandoned rather than kept as an option.

### Split modules, fffx-shaped

`landing-v3/` mirrors fffx's data/logic/render split. As the file count
grew (v3.6.3), grouped below by a more practical question than
"responsibility": **should you ever touch this file?** -- asked
directly, since the answer wasn't visible at a glance from one flat
list. Four groups: things you edit, things you shouldn't (the
algorithm), build tooling, and pages/output you only ever open in a
browser.

**Edit these -- your actual inputs:**

| File | What you'd change, and how |
| --- | --- |
| `cabinet-v3-data.js` | Tuning config (`v3Config`): canvas sizing, pack knobs, and the `island` noise/warp block. As of v3.6.3, `island`'s value block is deliberately comment-free and in the same key order `islands-tool.html`'s "Copy config" button produces -- paste its output directly over everything between `island: {` and the matching `}`, no hand-editing around comments. Field-by-field explanations live in the **ISLAND CONFIG FIELD NOTES** comment at the end of the file instead, same order. `canvas`/`pack` keep their comments inline (no copy-paste workflow touches those). |
| `cabinet-v3-extras-config.js` | Per-section extras schema-extension proposal (how many filler/"coming soon" circles each section gets) -- see "Where entries/sections come from" note above. Mostly data (`extrasConfig`, `EXTRA_WEIGHT`) with one small fallback function (`defaultExtrasFor()`) mixed in -- kept as its own file rather than folded into `cabinet-v3-data.js` specifically so that file can stay pure data (no logic at all), which is what makes its own paste-workflow above safe. |
| `index.template.html` | The actual hand-edited source for the built `index.html` (v3.6.2) -- header/subtitle text, stylesheet links, and a `<!-- V3_ISLANDS_SVG -->` placeholder. Edit this, never `index.html` itself -- see "Static build" below. |
| (`content/cabinet-sections.tsv` / `cabinet-entries.tsv`, repo root) | The real content source -- not in `landing-v3/` at all, but this is where entry/section titles, weights, order, and status actually come from. Run `node tools/build-cabinet-content.js` after editing these. |

**Logic -- shouldn't need to touch unless you're changing the algorithm
itself:**

| File | Responsibility |
| --- | --- |
| `cabinet-v3-treemap.js` | Pure logic: `squarify()` only (the v3.0 aspect-band search, `squarifyWithAspectSearch()`, was removed -- see the changelog; it's recoverable from git history if the band comes back). No DOM -- runs under Node unchanged (see "Verification" below), same rationale as `fffx-subdivision.js`. |
| `cabinet-v3-circlepack.js` | Pure logic: `generateScatterPoints()` (per-section, takes a cross-section `existingPoints` list), `centerPointsInRect()` (v3.4, per-section, centers bare points before growth), `sortPointsByBandReadingOrder()` (per-section), `growCircles()` (v3.3: one global call across every section's seeds, takes `obstacles` for label bands), plus `createSeededRng()`/`seedFromString()`/`safeMinSeparation()`/`insetRect()` helpers -- all used. `centerClusterInRect()` (v3.2, superseded by `centerPointsInRect()`) and `packCirclesSpiral()` are also here, currently unused (see "Known limitations"). No DOM. |
| `cabinet-v3-islandshape.js` | Pure logic (v3.5, domain warp added v3.6): seeded 2D noise, per-circle radial falloff, domain-warped sample positions, a shared heightmap combined via `max()` across every circle, and a marching-squares tracer that turns that heightmap into SVG path data -- see "How coastlines are traced" below. No DOM. |
| `cabinet-v3-layout.js` | Orchestration + SVG rendering only -- folds entries into sections, calls the treemap, pack, and island-shape modules, builds the actual SVG nodes, reserves and renders each region's label band. Exports `retraceIslands()` (v3.6) for the control panel's cheap re-trace path. Imports real content from `../docs/assets/js/cabinet-generated-content.js`. |
| `cabinet-v3-controls.js` | Dev-only (v3.6): on-page slider panel for `v3Config.island`'s noise/warp parameters, live-updating via `retraceIslands()`. Not part of the page design being reviewed -- see "Domain warping for real concavity" below and "Known limitations" #10. |
| `cabinet-v3-style.css` | Layout-review styling, reusing `cabinet-tokens.css`'s palette; also styles the v3.6 control panel (deliberately plain/utility, not parchment-themed). |

**Build tooling:**

| File | Responsibility |
| --- | --- |
| `build-static.mjs` | v3.6.2, the static-build script -- headless-Chromium snapshot of `build-render.html`'s rendered `#v3-stage`, injected into `index.template.html` to produce `index.html`. Run via `npm run build` or `node build-static.mjs` from `landing-v3/`; see "Static build" below for why a real browser snapshot was chosen over a hand-written serializer. |
| `build-render.html` | v3.6.2, build-only page loaded by `build-static.mjs` -- runs the real `cabinet-v3-layout.js` `render()` with no dev panel, exists only to be snapshotted, not for humans to open. |
| `package.json` | Declares `{ "type": "module" }`, `playwright` as a devDependency (v3.6 -- installed once, not per screenshot round; see "Verification" below), and an `npm run build` script (v3.6.2) for `build-static.mjs`. Lets the pure logic files (`cabinet-v3-treemap.js`, `cabinet-v3-circlepack.js`) run under plain `node`, not just a browser, for the same reason fffx's pure modules can. |

**Pages -- open in a browser, generated output, or frozen:**

| File | What it is |
| --- | --- |
| `index.html` | **Generated, v3.6.2 -- never hand-edit** (banner comment says so). Built from `index.template.html` by `build-static.mjs`; a zero-JS static page, real visitors' page loads cost nothing beyond parsing SVG. |
| `islands-tool.html` | v3.6.1, permanent live tuning tool -- see "Three pages" below. Shares `cabinet-v3-layout.js`/`cabinet-v3-controls.js`/`cabinet-v3-data.js` directly with `index.html`'s pre-build source (no duplication); exists as its own stable entry point so it can keep the panel forever, independent of whatever `index.html` eventually becomes. |
| `archive/v3.6/index.html` + `config.js` + `content.js` + `layout.js` + `controls.js` | v3.6.1, frozen historical snapshot -- see "Three pages" below. Content AND config pinned (own `config.js`/`content.js`, not the live files); algorithm modules (`cabinet-v3-islandshape.js` etc.) still shared/live, one directory up. |

## Three pages (`index.html`, `islands-tool.html`, `archive/`)

Started as one addition (v3.6: a permanent showcase page, "can the
interface with slider control be a permanent page somewhere? It's a
great showcase for island generation itself, as well as a key step in
the creation of this page") and became three, once interactive tuning
was actually used and it became clear ongoing fine-tuning and a frozen
historical record are different needs that shouldn't live on the same
page:

1. **`index.html`** -- the real prototype, evolving toward the finished
   landing page. Real content, real navigation, real `cabinet-v3-data.js`
   tuning. As of v3.6.2 (see "Static build" below) this is a **build
   artifact**, not hand-edited or live-computed: `index.template.html` is
   the actual source, and `build-static.mjs` regenerates `index.html`
   from it -- ships zero JavaScript, so real visitors' page loads cost
   nothing beyond parsing static SVG.
2. **`islands-tool.html`** -- byte-identical to `index.html` today (same
   `cabinet-v3-layout.js`, same `cabinet-v3-controls.js`, same live
   content and config), existing as its own stable entry point
   specifically so it can keep the tuning panel *permanently*, even
   after `index.html` eventually drops it. "The islands will need to be
   recomputed whenever a new entry or section is added" -- true already,
   with no extra wiring needed: `render()` re-derives the whole layout
   (treemap, packing, coastlines) from current content and config on
   every page load, so reloading this page after any content/config edit
   is the entire "recompute" step.
3. **`archive/v3.6/`** -- a frozen point-in-time snapshot, taken right
   before interactive tuning was applied to `cabinet-v3-data.js` (see
   the v3.6.1 changelog entry below). A dated folder rather than a flat
   file, so a future significant version can get its own `archive/v3.7/`
   etc. alongside this one without collision.

**What "frozen" means here, precisely.** Two things are pinned inside
`archive/v3.6/`, deliberately, and one thing is NOT:
- **Content is pinned** (`archive/v3.6/content.js`) -- a point-in-time
  copy of `cabinet-generated-content.js`'s sections/entries, every
  `href` neutralized to `"#"` so nothing here reads as live navigation
  and nothing here reshapes when the real site's content changes.
- **Config is pinned** (`archive/v3.6/config.js`) -- a literal copy of
  the *entire* `v3Config` object (canvas/pack/island) as it stood at
  that moment, NOT an import of `cabinet-v3-data.js`. This had to be
  added the moment interactive tuning actually happened: the original
  showcase page's "frozen" claim only ever covered content, not config
  -- it still imported the live `v3Config`, so tuning `cabinet-v3-data.js`
  would have silently changed what the "archive" displayed too, defeating
  the whole point. Caught before it caused any real confusion, since the
  config-tuning pass and the archive/tool split happened in the same
  turn.
- **The algorithm modules are NOT pinned** -- `cabinet-v3-islandshape.js`,
  `cabinet-v3-circlepack.js`, `cabinet-v3-treemap.js`,
  `cabinet-v3-extras-config.js` are still imported live, one directory
  up. Deliberate scope decision: the concern this archive actually
  guards against is data/tuning drift (which happens routinely and was
  the concrete thing that had just started happening), not code
  refactors (rarer, more structural) -- a bug fix to the shared algorithm
  should still reach every page, archive included. If a future change to
  those modules is big enough that even the archive shouldn't inherit it
  (a genuine v3.7+ rewrite), that's the signal to cut a *new* versioned
  archive folder, not to freeze this one further.

**Code duplication: `archive/v3.6/layout.js` +
`archive/v3.6/controls.js` vs. shared `index.html`/`islands-tool.html`
modules.** The archive needs its own copies (importing its own
`config.js`/`content.js` instead of the live files) since ES module
imports are static paths, not parameters -- there's no way for one
`cabinet-v3-layout.js` to sometimes read live data and sometimes read
frozen data without a caller-supplied argument, and passing the content
source as a parameter would mean `index.html` and `islands-tool.html`
threading it through too, for no benefit (they're supposed to always use
live data, forever). `index.html` and `islands-tool.html`, by contrast,
share their JS files directly, unmodified -- no duplication between
those two, since they're meant to always render identically and
diverging would be a bug, not a feature (unlike the archive, which is
*supposed* to diverge from here on).

Verified via Playwright across all three pages: zero console errors on
any of them; `index.html`/`islands-tool.html` both show the new tuned
values (warp strength 60, period 85, 3 octaves) and real hrefs (25
distinct navigation targets); `archive/v3.6/` shows the original v3.6
defaults (strength 40, period 100, 2 octaves) and all 25 links resolve
to `#`, unaffected by the `cabinet-v3-data.js` edit made in the same
pass -- direct proof the freeze actually holds.

## Static build (`build-static.mjs`, v3.6.2)

Asked directly, once it came up that `index.html` recomputes the entire
pipeline (treemap, packing, noise/warp heightmap, marching-squares
tracing) from scratch on every single page load: that's real compute
cost for every real visitor, for a page whose content only actually
changes when an entry or section is added -- "ease users' page-load
times... no recomputes until a section or entry actually changes." The
fix is standard for this kind of problem: move the computation from
*request time* (every visitor's browser, every load) to *build time*
(once, whenever content/config actually changes), and ship the result as
plain static markup.

**How the static markup gets produced -- a real headless browser, not a
hand-written serializer.** `build-static.mjs` starts a local static
file server, launches headless Chromium (Playwright, already a
devDependency), loads `build-render.html` (a minimal page that runs
`cabinet-v3-layout.js`'s real `render()` -- the *exact same* client-side
code `islands-tool.html` and `archive/` use, not a reimplementation),
waits for the shared islands path to appear (proof the whole pipeline
finished, not just that the page loaded), then reads `#v3-stage`'s
`outerHTML` directly out of the live DOM.

The alternative considered and explicitly rejected: hand-writing a
second, string-based SVG serializer that mirrors `cabinet-v3-layout.js`'s
DOM-construction logic without a browser. Node-only, faster, no browser
dependency -- but it would mean two independent implementations of "how
an island/label/region actually gets drawn," which would need to be
kept in sync by hand every time that logic changes (as it has in nearly
every version so far). Rejected specifically because that hand-sync
requirement doesn't go away even without an AI assistant available to
do it -- a real headless-browser snapshot has exactly one rendering
implementation, so there is nothing to keep in sync, ever, by anyone.

**What gets built vs. what stays hand-written.** `index.template.html`
is the actual source (header, subtitle, stylesheet links, and a
`<!-- V3_ISLANDS_SVG -->` placeholder) -- edit that, never `index.html`
directly. `build-static.mjs` reads the template, replaces the
placeholder with the captured SVG markup, and writes the result to
`index.html` with an `AUTO-GENERATED FILE` banner comment, the same
convention `cabinet-generated-content.js` already uses for TSV-sourced
content (`content/cabinet-sections.tsv`/`cabinet-entries.tsv` ->
`node tools/build-cabinet-content.js`). `build-render.html` is a third,
build-only page -- like `index.template.html`'s SVG stage but with no
header/subtitle (irrelevant to what gets captured) and, critically, no
`cabinet-v3-controls.js` script tag, so the dev tuning panel can never
end up baked into the static output.

**Trigger: a separate, explicit command, not chained onto the real
site's build.** Regenerating requires running `node build-static.mjs`
(or `npm run build`) from `landing-v3/` by hand, deliberately not wired
into `tools/build-cabinet-content.js`'s existing TSV-triggered build --
`landing-v3/` is still an isolated, unapproved prototype (see this
file's own intro), and chaining a real-site build script into it would
blur that boundary. Revisit this once/if v3 is actually approved to
ship.

**Verified:** loaded the built `index.html` with JavaScript entirely
disabled (Playwright's `javaScriptEnabled: false`, not just "no console
errors" -- an actually stricter check, since it proves nothing beyond
static HTML/CSS parsing is required) -- all 25 island links present with
their real hrefs, zero script tags in the output, no dev panel. Visually
identical to the live-computed version. Screenshot:
`dev-screenshots/v3.6.2-static-build-no-js.png`.

## How the layout is built (`cabinet-v3-layout.js`'s `render()`)

1. **Fold entries into sections** (`buildSectionMetas`). Visible
   entries (`status !== false`) grouped by `section`, sorted by
   `order` ascending within each group. A section's weight = sum of
   its own visible entries' weight; zero-weight sections (no visible
   entries) are dropped entirely -- no region reserved for nothing to
   show, same as fffx.
2. **Size the canvas from total (area-effective) content, not a
   search** (`canvasHeightFor`). Fixed width (1200); height = `(sum of
   every section's *area-effective* weight) x areaPerWeightUnit / width`
   -- canvas *area* scales with how much is actually on the page,
   replacing v3.0's aspect-band height search (see changelog: that
   search was solving the wrong problem -- it optimized for a shape
   contract that's now relaxed, not for "does this canvas actually fit
   its content snugly," which is what was actually being asked for when
   regions came back "so large"). "Area-effective" (v3.4,
   `effectiveWeightForArea`) means a section's real weight, clamped up
   to at least `minSectionWeight` -- see "About Me" below for why.
3. **Partition the canvas** (`buildRegions` -> `squarify` in
   `cabinet-v3-treemap.js`). One region per section, sized by that same
   area-effective weight, in the *exact* sequence `sectionMetas` is
   already in (sorted by `order` ascending) -- `squarify()` no longer
   re-sorts by weight internally (see changelog: it used to, silently
   overriding `order` with weight for region placement). Weight still
   drives each region's *area*; `order` still drives its *position in
   the reading sequence*, the same split used one level down for
   entries. Each region gets a `regionGap`-px inset ("outer" = the exact
   treemap tile, "inner" = the padded rect everything else works
   within).
4. **Compute the label, then reserve a band sized to it**
   (`computeSectionLabel` -> `splitLabelBand`). Unlike v3.1-v3.3 (band
   height decided first, label squeezed into whatever resulted), v3.4
   fits the title -- wrapped onto as many lines as it needs, up to a cap,
   before shrinking font size -- *before* deciding how tall the band
   needs to be, so the band grows to fit a long title in a narrow region
   instead of the title being squeezed or truncated first. The band now
   sits at the *bottom* of the region's inner rect (v3.4 -- was the top
   through v3.3), with the `pack` area (where the archipelago lives)
   above it. No circle is ever scattered inside the band either way --
   see "How archipelagos are packed" for why this replaced a
   corner-search.
5. **Build each section's archipelago** (`buildSeedsForSection`, into
   the `pack` area only) -- see the dedicated section below.
6. **Trace one shared coastline for every circle on the page** (v3.5,
   `traceIslandShapes()` in `cabinet-v3-islandshape.js`, called once on
   the full `grown` list from every section together) -- see "How
   coastlines are traced" below. Drawn first, as a single `<path
   class="v3-islands-land">`, underneath every region.
7. **Render each region.** Outline, label band + title (one `<text>`
   per wrapped line, vertically centered as a block within the band),
   then per circle: real entries get an `<a class="v3-island">` wrapping
   an *invisible* hit circle (`.v3-island-hit`, at the entry's own
   original `x/y/radius` -- the visible shape is the shared coastline,
   not this circle) plus the title text; `status: "wip"` entries and
   `coming-soon` stubs additionally get a dashed `.v3-status-ring` at
   that same position, since a fused landmass can't be given two
   different fill colors for two different entries' statuses the way
   separate circles once could. Filler extras render nothing of their
   own here at all -- they already shaped the coastline in step 6, and
   have no label or link to draw.

## How archipelagos are packed (`cabinet-v3-circlepack.js`)

Direct port of the growth technique in the user's own
`p5-circle-packing` library (`CirclePack.js`: `getCirPack`/`Bubble`/
`growBub`/`checkPos`/`compareDist`), adapted for weight-driven starting
size, order-driven seed assignment, and (v3.3) growth that spans every
section at once -- none of which the reference library has a concept of
(it's a domain-agnostic "fill a canvas with circles" tool, no notion of
entries, sections, or reading order). Steps 1-4 still run once per
section, each against that section's own `pack` area from
`splitLabelBand()`; grow (step 5) runs once, globally, across every
section's seeds together. v3.4.2 split what used to be one scatter+center
pass covering entries and extras together into two sequential passes --
entries placed and centered first, extras placed second into whatever
room is left -- see "Bugs found and fixed" for why:

1. **Place entries.** `generateScatterPoints()` places one random
   `(x, y)` per real entry (not extras yet), seeded by
   `createSeededRng(sectionMeta.id)` (mulberry32, not `Math.random()` --
   stable across reloads). Scattered into the pack area *pre-inset by
   `minRadius`* (`insetRect()`, v3.2) -- guarantees every point starts
   with at least `minRadius` of clearance from its own region's edge.
   Rejection sampling keeps points from landing closer than
   `safeMinSeparation()` apart -- checked against every point already
   placed *by any section* (v3.3's `allPlacedPoints` accumulator in
   `cabinet-v3-layout.js`'s `render()`). `sortPointsByBandReadingOrder()`
   then groups these points into horizontal bands (~16% of the pack
   area's height each) and sorts by `x` within a band, concatenating top
   to bottom -- what makes "top-left to bottom-right" true of a genuine
   scatter without gridding the points themselves. Entries (sorted by
   `order`) are zipped 1:1 onto that ordered sequence -- item *i* gets
   point *i*'s position.
2. **Center entries.** `centerPointsInRect()` translates the
   just-placed entry points (as bare centerpoints -- no radius exists
   yet) so their own bounding box centers on the pack area's center,
   *before* pushing them onto `allPlacedPoints` and before growth ever
   runs. This is what actually answers "is the centering happening" --
   v3.2 had centering, but only on already-*grown* circles, dropped in
   v3.3 once growth stopped being bounded by one region's own rect (its
   safety argument no longer held); centering the raw points instead
   sidesteps that problem entirely. Scoped to *entries only* since
   v3.4.1 -- centering on the full point set (entries and extras
   together, v3.4's first version) still left entries looking off-center
   whenever the extras happened to scatter lopsided. See "Bugs found and
   fixed" for the one thing this doesn't automatically guarantee
   (separation against a section processed *earlier*).
3. **Place extras.** A second `generateScatterPoints()` call, extras
   only, into the *same* pack area -- but `allPlacedPoints` now already
   includes this section's own just-centered entries (pushed at the end
   of step 2), so extras' rejection sampling naturally avoids them the
   same way it avoids every other section's points. No reading order or
   centering of their own -- an extra's scatter position *is* its final
   position, zipped in whatever order the extras were generated
   (coming-soon then filler, per `extrasFor()`).
4. **Combine.** This section's centered entries and placed extras are
   concatenated into one seed list, each tagged with `sectionId` and a
   `maxRadius` derived from *its own* region's shorter side (v3.3),
   then handed to the shared, cross-section growth pass below. Nothing
   moves a circle's center again after this point -- growth only ever
   changes radius.
5. **Grow -- globally, across every section at once (v3.3).**
   `growCircles()` takes every section's seeds together, one call, bounded
   by the *whole canvas* (not any one region) plus every region's label
   band as an obstacle circles can't cross either. Circles not yet
   stopped attempt one `growStep` per pass; a circle stops permanently
   (never resumes) the instant that step would cross the canvas edge, a
   label band, or another circle's edge -- `other circle` meaning *any*
   circle in the whole pass, regardless of which section seeded it, and
   `maxRadius` reads per-circle (from its own seed's tag) rather than one
   shared cap, since there's no longer one shared region to derive it
   from. Squared-distance only throughout
   (`(dx*dx + dy*dy) < (r1+r2+padding)^2`), exactly the "Distance-
   Squared... instead of computing the square roots" instruction and the
   same technique `compareDist()` in the reference library uses. Runs
   until nothing is still growing (or `maxIterations`, a defensive cap
   the reference didn't need -- growth is monotonic over a finite, fixed
   item set, so it was never expected to bind, and hasn't).

This is what implements "bounded by the page edges... but not
region-region internal edges": nothing stops a circle at its own
region's boundary any more -- only the true canvas edge, a label band
(any section's), or another circle (any section's). A circle drifting
into a quieter neighbouring region's space is the intended effect, not
a bug; region rects (`region.inner`/`pack`) now only shape where a
section's own seeds start out and each one's own `maxRadius` cap, not
where growth is allowed to reach. `centerClusterInRect()` (the v3.2
per-region re-centering step) is **not called** any more -- its safety
argument depended on growth being bounded by the same rect it centered
against, which stopped holding once growth went global; the function is
kept in `cabinet-v3-circlepack.js`, documented as currently unused, for
a possible future per-region-only render mode.

### Why growth-based packing, not v3.0's row-flow

v3.0 placed circles directly in row-flow order (left to right, wrap per
row) specifically to avoid a "pack tight, then relabel by reading
order" approach, reasoned through and rejected before writing any code:
a packing's non-overlap guarantee is a property of the *specific*
`(radius, position)` pairs it produced, and relabeling which entry's
*identity* sits at which position only stays valid if the newly
assigned entry has the exact same radius the position was computed for
-- entries don't share weight 1:1, so a naive relabel could silently
reintroduce overlap. That reasoning still holds and is exactly why
growth-based packing's zip step (above) happens *before* any sizing:
position is fixed at the zip, weight only ever affects the radius of
whatever's already at that fixed position, so there's still no
reassignment step to desync.

What actually changed: row-flow was correct (verified: zero overlaps)
but visibly read as a laid-out grid rather than an archipelago -- the
direct complaint that triggered this rewrite. Growth-based packing
reads as organic specifically *because* final size is mostly a function
of "how much open space happened to be near this seed," not a size
decided in advance and then arranged -- the same reason the reference
library produces the bubble-cluster look it does. One real trade-off,
documented rather than hidden: because every circle grows by the same
`growStep` regardless of weight, weight's influence on *final* radius
is real (it sets the starting gap between a heavy and a light item, and
that gap persists as roughly a constant offset for as long as both keep
growing) but secondary to local density -- an item in a sparser part of
the scatter will out-grow a heavier item boxed in by neighbours,
regardless of weight. This is inherent to growth-based packing, the
same as it would be in the reference library, not a bug introduced by
this port.

`packCirclesRowFlow()`, `packCirclesSpiral()`, and `fitClusterToRect()`
(v3.0's packing functions) were removed outright rather than kept
unused -- see the changelog.

### Fewer, plainer extras (v3.3)

`cabinet-v3-extras-config.js`'s per-section counts cut from a 4-6 range
down to 1-3, and every section's `comingSoon` set to 0 -- no more
dashed, "coming soon"-labeled stubs, extras are plain faint filler only
now. Two independent reasons: it reads better on its own (less visual
noise competing with real entries), and fewer items to pack directly
eases the pressure that was causing `visual-field-notes`'s overlaps and
`about`'s cramped-region problem (see the v3.3 changelog entry). `kind:
"coming-soon"`'s rendering path (`cabinet-v3-layout.js`'s `renderRegion()`)
is left in place, just unused by any authored count -- cheap to keep
dormant for a future section that wants to advertise a specific reserved
slot again.

## How coastlines are traced (`cabinet-v3-islandshape.js`, v3.5)

Every circle `growCircles()` produces (position, radius, weight-driven
sizing, collision-avoidance) is untouched by this step -- it only
changes what gets *drawn* for that circle: an organic coastline instead
of a perfect circle, ported from the classic "noise minus a radial
gradient, then threshold" island-generation technique (see [this
article](https://medium.com/@travall/procedural-2d-island-generation-noise-functions-13976bddeaf9)
for the reference; that article's own approach is one big noise field
minus one big *map-wide* gradient mask, adapted here to a *per-circle*
gradient so each entry gets its own coastline instead of one continent).

1. **One seeded 2D gradient-noise field over the whole canvas**
   (`buildPermutation` + `perlin2D` + `fbm2D`, seeded by a fixed string
   -- not per-section, since the heightmap spans every section's circles
   together and there's no natural per-section key for it). Same
   determinism rule as everywhere else in v3: `mulberry32`, not
   `Math.random()`.
2. **One shared heightmap, every circle contributes via `max()`**
   (`buildIslandHeightmap`). For each circle, only the grid cells within
   its own `outerFrac x radius` bounding box are touched (cost
   proportional to circle areas, not canvas area x circle count); each
   touched cell gets `noise(x,y) - radialFalloff(distance-from-circle-
   center)`, and the *highest* value any circle contributes at that cell
   wins. `max()` (not sum/blend) is what produces fusion: wherever two
   circles' influence areas overlap, whichever is closer to *its own*
   core wins regardless of the other's falloff pulling toward water --
   see "Fusion behaviour" below. Untouched cells (outside every circle's
   influence) stay at a hard-coded `waterLevel`, and the grid's outermost
   ring of corners is force-set to `waterLevel` regardless of what
   touched it, guaranteeing every contour closes within the grid even for
   a circle grown all the way out to the canvas edge.
3. **Threshold + marching squares** (`marchingSquaresSegments` ->
   `chainSegmentsToPolygons`). Standard 16-case binary marching squares
   with linearly interpolated edge crossings; segments are joined into
   closed polygons by each endpoint's *canonical grid-edge id*
   (`H:col:row` / `V:col:row`), not by comparing float coordinates --
   every grid edge borders at most two cells, so an id-keyed join is
   provably correct regardless of any floating-point coincidence. (A
   coordinate-rounding key was tried first and produced 2 silently
   unclosed chains out of 40 real circles -- caught by the Node
   verification harness, not a screenshot; see the v3.5 changelog entry.)
   Sub-cell noise speckles (an isolated grid cell or two crossing
   threshold in open water, far from any circle) are dropped by a
   minimum-polygon-area filter before rendering.
4. **Angle-modulate the falloff radius itself** (v3.5.2,
   `angularRadiusScale`) -- see "Circular vs. lobed silhouettes" below.
   This runs per grid cell, inside step 2's loop, before the noise/
   gradient comparison -- it changes *where* `outerFrac` actually sits
   in a given direction, not just what's layered on top of it.
5. **Render as one `<path fill-rule="evenodd">`**, drawn first, in
   `cabinet-v3-layout.js`'s `render()`, underneath every region -- see
   step 6/7 in "How the layout is built" above for what each region then
   draws on top of it.

### Circular vs. lobed silhouettes (v3.5.1 - v3.5.4)

Asked directly: the coastlines read as "wibbly but essentially still
circular" -- the per-pixel noise jitters the *edge*, but the underlying
gradient is perfectly radially symmetric, so the gross silhouette never
stopped being a circle. Two candidate fixes were discussed before either
was tried: more `fbm2D` octaves (finer edge detail), or modulating the
falloff radius itself by angle (a genuine silhouette change). Tried in
that order, on request:

- **v3.5.1 -- more octaves (3 -> 6), tried first, reverted.** Isolated
  the variable deliberately: `noiseScale`/`lacunarity`/`gain` all held
  constant, only `octaves` changed. Screenshot comparison showed almost
  no visible difference. Root cause: each added octave layers detail at
  2x/4x/8x the base frequency, which at `noiseScale: 1/26` starts
  producing noise features finer than `cellSize: 4` can resolve at trace
  time -- the detail was real in the heightmap but invisible in the
  traced output. Reverted to 3; more octaves at the current `cellSize`
  is pure wasted compute, not a visual lever. (Raising `cellSize` down
  further, i.e. a finer grid, would let higher octaves actually show up
  -- not tried, since it wasn't what fixed the actual complaint anyway.)
- **v3.5.2 -- angle-modulated radius, the actual fix.**
  `angularRadiusScale(theta)` samples a *separate*, single-octave (not
  `fbm2D` -- layering multiple octaves back in here would reintroduce
  the same high-frequency wiggle this is meant to be independent of)
  noise at a point on a small loop in noise-space: as `theta` sweeps
  0..2*pi, the sampled point traces a full loop of radius `freqRadius`
  in noise-space, giving smooth, seamless (no seam at the 0/2*pi wrap,
  since it's a genuine closed loop), low-frequency angular variation --
  a handful of broad bulges/pinches per island, not texture. That scale
  factor (clamped >= 0.15, floor only, to guard the actual division
  below) multiplies the circle's own radius *before* `dNorm` is computed
  against it, so the whole radial profile stretches or compresses
  together in that direction, not just the outer edge. `freqRadius`
  (drawn per-circle from `angularFreqMin`..`angularFreqMax`, currently
  1.2-2.4) controls lobe count -- roughly `2 * pi * freqRadius` "features"
  per full revolution, tuned empirically (not derived) to land around
  2-4 broad lobes, "peninsula and bay" character rather than a wavy
  circle (too few) or a starburst (too many). `angularStrength` (0.4)
  sets how far the radius swings -- verified via
  `_verify-islandshape.mjs` (throwaway, deleted after use) that a
  radius-80 circle's traced boundary now spans 58-101px from center,
  visibly wider than the pre-v3.5.2 jittered-circle range.
- **v3.5.3 -- multi-octave angular modulation.** Feedback on v3.5.2's
  result: "wibbly but essentially still circular" persisted -- a single
  noise sample around the loop is, mathematically, one smooth periodic
  deformation (a handful of gentle bulges), and smoothness itself is
  what reads as "distorted circle" rather than "coastline," regardless
  of amplitude. Diagnosed as a genuine gap in frequency content: the
  angular term operated at one broad wavelength, the edge noise at a
  much finer one (`noiseScale: 1/26`), with nothing filling the medium
  frequencies real coastlines get their fjord/peninsula complexity from.
  `angularRadiusScale` now calls a new `angularFbm()` -- the same fbm
  idea `fbm2D` already uses for edge noise, just walked around the loop
  instead of across a plane: each octave multiplies the loop's radius by
  `angularLacunarity` (more wiggles per revolution) at `angularGain` the
  previous octave's amplitude. Every octave's sample point still traces
  its own fully closed loop as `theta` sweeps 0..2*pi (only the loop
  radius changes per octave, not whether it closes), so the sum stays
  exactly seamless at every frequency layered in, not just the base one.
  `angularOctaves`/`angularLacunarity`/`angularGain` are deliberately
  separate knobs from the edge noise's own `octaves`/`lacunarity`/`gain`
  -- same idea, independently tunable frequency bands. Verified: land-
  area-fraction unchanged (80-84%, same range as v3.5.2's tuning), all
  40 real circles still trace to 40 closed subpaths. Screenshot showed
  visibly more scalloped, varied-bump-size edges -- real progress, not
  a full fix (see v3.5.4 for what came next).
- **v3.5.4 -- ridged noise blended in, for sharp inlets instead of just
  bigger smooth bulges.** Asked directly whether tuning could help --
  "more extreme jumps, more smooth or rough transitions" -- and
  recommended ridged noise specifically because raising `angularStrength`
  alone only makes v3.5.3's existing smooth bulges *bigger*, not
  *sharper*; the smoothness itself, not the amplitude, is what still
  reads as "distortion" rather than "coastline." `ridge(n) = (1 -
  abs(n))*2 - 1` is the classic remap: raw Perlin spends most of its
  range near 0 (broad, gently rolling), so ridging -- which maps "near
  0" to ridge's own *maximum* -- turns the noise's rare excursions
  toward its extremes into sharp, narrow features instead, while
  everywhere else stays a smooth plateau. Fed into a radius-shrinking
  term, that's a fjord: mostly full extent, with occasional sharp,
  narrow cuts. New `angularFbm()` parameter `ridgeMix` blends the
  existing smooth signal with this ridged remap of the *same* underlying
  per-octave samples (not two independent noise fields cross-faded --
  one signal, two different remaps of it) -- 0 is pure v3.5.3, 1 is
  fully ridged, `angularRidgeMix: 0.6` leans toward ridged while keeping
  some broad lobing underneath.

  **Bias correction, measured not guessed.** `ridge(n)` is not zero-mean
  the way raw Perlin is -- since "near 0" dominates Perlin's own
  distribution and maps to ridge's ceiling, `ridge(n)` spends most of
  its time near its own maximum. Measured empirically (a throwaway
  ~660k-sample script, confirming raw `n`'s mean is ~0 as expected while
  `ridge(n)`'s is +0.578): left uncorrected, blending this in pushed
  land-area-fraction from the v3.5.3-tuned ~80% up to 95-98% in
  practice, verified via the same land-fraction harness used for every
  prior tuning pass -- and, as an observed side effect, silently
  reopened fusion between real circles that were previously separate
  (40 circles -> 33 landmasses instead of 40). `ridge()` now subtracts
  that measured `0.578` directly, restoring land-fraction to 76-87%
  (comparable to pre-ridge tuning) and all 40 real circles back to 40
  closed, separate subpaths.

  **Determinism, per circle, not just per page.** Each circle draws its
  own `phaseX`/`phaseY`/`freqRadius` from a `mulberry32` RNG seeded by
  `` `${seed}:${circle.id}` `` (falling back to its rounded position for
  ad-hoc circles without an id, e.g. in the verification harness) --
  every island gets an independent lobing pattern (not the same bulge
  direction repeated on every circle), reproducible across reloads
  (same content in, same coastlines out), same rule as everywhere else
  in v3. Verified: two circles at the identical position/radius but
  different ids trace different shapes; the same id traced twice
  produces byte-identical output.

  **Bounding-box correctness.** The per-circle grid-cell bounding box
  (used to limit the heightmap loop to cells that could possibly matter,
  see step 2 above) was sized from a fixed `outerFrac x radius` before
  this change -- with the radius itself now angle-dependent and able to
  *exceed* that fixed value in a bulge direction, the bbox had to widen
  to the worst case (`outerFrac x radius x (1 + angularStrength)`) to
  avoid silently clipping a lobe's true extent. Cells the bbox now
  over-includes that a given angle's *actual* (smaller) scale doesn't
  reach are simply skipped by the existing per-cell `dNorm` check, same
  as always -- purely a loop-bounds correctness fix, not a behaviour
  change.

### Domain warping for real concavity (v3.6)

Asked directly after v3.5.4: still "very much circle-got-distorted...
There is effectively no concavity in the shapes at large." The reason is
structural, not a tuning gap: `angularRadiusScale` (v3.5.2-.4, however
many octaves or how much ridging get layered into it) computes a
*radius* as a function of angle around one fixed center -- by
construction that makes the traced boundary star-shaped, meaning every
ray from that center crosses it exactly once. No amount of stacking
angular octaves or ridge sharpness can fold the boundary back on itself
(a real bay, a hook, a peninsula that narrows then widens) -- only
change how that one crossing point jumps around. Confirmed this was the
actual blocker (not just argued from first principles) before writing
any code: the "concavity proxy" verification below shows the pre-v3.6
baseline already sitting at a small but nonzero multi-crossing rate
purely from *per-pixel* edge noise (`fbm2D`, step 2 in "How coastlines
are traced"), which samples real 2D `(x, y)` space and so isn't bound by
the star-shaped constraint the way the angular term is -- direct
evidence the constraint is specific to the angular approach, not
something inherent to noise-based coastlines in general.

**The fix: warp the sample position, not the output radius.**
`warpOffset()` (`cabinet-v3-islandshape.js`) is Inigo Quilez's domain-
warping technique -- two low-frequency `fbm2D` fields (sampled at a
large, arbitrary coordinate offset from each other, `(+37.2, +91.7)`,
the standard cheap way to get a second decorrelated signal out of one
noise function rather than building a whole second permutation table)
give an `(x, y)` displacement in canvas px. Every per-cell computation in
`buildIslandHeightmap` -- both the distance-to-center check that
`angularRadiusScale`'s falloff is measured against, *and* the per-pixel
coastline noise sample -- now reads the *warped* point, not the raw grid
position. That's what breaks the constraint: a point geometrically well
inside a circle's guaranteed-land core can warp to where it effectively
samples as past the coastline, while a neighbouring point (a few warp-
field wavelengths away) doesn't -- a real fold, not a radius dip. Uses
its own permutation table (seeded `` `${seed}:warp` ``, not the
coastline noise's own `perm`) so the warp field is visually independent
of the base coastline texture rather than risking any correlation
between "where a point warps to" and "what the coastline noise reads
there."

Layers on top of, not instead of, v3.5.2-.4's angular modulation and
ridged blend -- both still contribute their own texture; nothing was
reverted. `maxOuterR`'s bbox-widening (already extended once for
`angularStrength`, see "Bounding-box correctness" above) gets a further
flat `+ warpStrength` px, same reasoning stacked: a cell just outside
what angular modulation alone could reach might still warp into a
circle's influence.

**Verified with a concrete concavity proxy, not just a screenshot.**
"Looks concave" is subjective; a star-shaped boundary crosses any ray
from its own center exactly once, so *counting rays with more than one
land/water crossing* is a direct, checkable proxy for real folding
(written as a throwaway Node script, deleted after use, same discipline
as every prior tuning pass). A first attempt at picking `warpStrength`/
`warpScale` values by feel showed no reliable increase over baseline --
turned out one fixed test circle's result is idiosyncratic (the warp
field's alignment relative to that one circle's specific position), so
the actual sweep tested `warpStrength` in `[0, 20, 35, 50, 70, 100]` px
x warp-field period in `[90, 140, 220]` px against **12 varied synthetic
circles** (different positions/radii/ids) and averaged. Confirmed a
clear, monotonic-ish increase with strength, strongest at shorter
periods. Landed on `warpStrength: 40, warpScale: 1/100` (period 100px)
as a starting default -- re-verified against the real 40-circle content
specifically: average multi-crossing-ray fraction goes from 1.55% (warp
off) to 3.40% (warp on), more than double, and every circle still closes
cleanly (40/40 landmasses, no fragmentation, no dangling chains).

**Dev control panel, so real tuning happens interactively.** Rather than
guess a final value and iterate by screenshot-and-edit-config (the
pattern for every parameter through v3.5.4), v3.6 ships
`cabinet-v3-controls.js`: a plain-HTML overlay (not part of the SVG,
deliberately un-parchment-styled since it's a dev tool, not page design)
with sliders for `warpStrength`, `warpPeriod` (a friendlier reframing of
`warpScale` -- period in px rather than a 1/px frequency), `warpOctaves`,
`angularStrength`, `angularRidgeMix`, `threshold`, `noiseAmplitude`, and
`gradientStrength`, plus Reset (restores the values `v3Config.island`
had when the panel first loaded) and Copy config (dumps the current
tuning as JSON, to console and clipboard) buttons. Mutates
`v3Config.island` directly and calls `cabinet-v3-layout.js`'s exported
`retraceIslands()` on every slider input.

Made cheap enough for that by splitting `render()`: the expensive part
(treemap + circle-packing, which never depends on island-shape tuning)
now runs once and caches its `{ grown, canvasBounds }` output in a
module-level `islandLayoutState`; `retraceIslands()` re-traces against
that cache and updates the existing `<path class="v3-islands-land">`'s
`d` attribute in place, rather than re-running the whole pipeline (or
even re-creating the path element) on every drag tick. Verified via
Playwright: dragging a slider to max changes the rendered path (confirms
the live retrace actually fires) and Reset restores byte-identical
output to the pre-slider state.

Screenshot comparison (`dev-screenshots/v3.5.4-ridged-blend.png` vs.
`v3.6-domain-warp-default.png`) shows the qualitative shift directly --
several islands (Vera Molnar, Circle Packing Library, 100 Gradients,
Writings) now have a genuine inward bite or pinched neck, not just a
bumpier outline. `v3.6-domain-warp-max-strength.png` shows the slider's
top end deliberately: some islands fragment into disconnected tendril
pieces at `warpStrength: 150` -- expected and left in-range on purpose,
so the panel's usable span covers "subtle" through "clearly excessive,"
not just a narrow band around the shipped default.

**Linearity -- explicitly not attempted here.** Also asked for: coastline
segments with actual straight/linear character (real coasts have cliff
stretches that read as straight, not just organic curves), separate from
concavity. Domain warping doesn't produce this -- it's a smooth
continuous displacement, structurally suited to folds and bays, not
straight edges. Flagged as a distinct follow-up (see "Next steps"), not
solved in this pass.

### Falloff tuning: "most of the circle is the island"

`innerFrac`/`outerFrac`/`gradientStrength`/`threshold`/`noiseAmplitude`
(`cabinet-v3-data.js`'s `island` config) are tuned together, not
independently -- inside `innerFrac x radius` the gradient is exactly 0
(always land regardless of noise), beyond `outerFrac x radius` it's
`gradientStrength` (always water regardless of noise), and the actual
coastline falls somewhere in that band depending on the local noise
sample. Verified empirically (`_verify-islandshape.mjs`, a throwaway
Node script per this session's usual discipline -- deleted after use,
not committed), not derived by hand: rasterize a fine grid around an
isolated circle, measure what fraction of the *original* circle's area
reads as land. First attempt (`innerFrac: 0.5, outerFrac: 1.2,
gradientStrength: 1, threshold: -0.4`) landed at 62-67% -- technically a
majority but not a strong enough read of "most of the circle." Retuned
(`innerFrac: 0.55, outerFrac: 1.3, gradientStrength: 1.1, threshold:
-0.5, noiseAmplitude: 0.35`) to 78-83% across circle radii from 15px to
200px.

### Fusion behaviour

Explicit design decision (asked directly, before writing any code):
when two circles are close enough that their noise-shifted coastlines
could touch, should they be allowed to merge into one landmass? Chose
**yes** -- matches the real archipelago look, and mirrors what the live
v2 map's own coastline/ripple generator already does (`docs/index.html`,
same "combined land mask, close islands fuse" idea, see
`LANDING-PAGE-NOTES.md`). The alternative (each circle traced
independently, confined to its own bounding box, guaranteed to never
touch a neighbour) was considered and rejected specifically because it
would have made the traced path double as *both* the visual shape and
the click target with a clean 1:1 mapping -- simpler wiring, but this
codebase already reuses the v2 map's fused-coastline aesthetic
everywhere else, and a "some entries visually merge" archipelago reads
truer to that than one where every entry is guaranteed a moat.

Because fusion is now possible, an entry's clickable region and label
can no longer be "the traced shape itself" the way a plain `<circle>`
could -- see step 7 in "How the layout is built": every entry gets an
*invisible* hit circle at its own original `(x, y, radius)`, independent
of whatever the shared coastline actually looks like at that point.
Verified two ways in `_verify-islandshape.mjs`: two circles with a
30px-overlap gap traced as one closed contour (fused); two circles
150px apart traced as two separate contours (not fused). Against the
real 7-section/25-entry content, though, **zero fusions occurred** among
the 40 real circles -- the closest real pairs sit right at the growth
padding minimum (~6px edge-to-edge gap), and the current
`outerFrac`/`gradientStrength` band isn't wide enough for noise to
reliably bridge a gap that tight. Not a bug (the mechanism demonstrably
works on the synthetic cases above, and the screenshot with zero fusion
still reads as a clean, organic archipelago), but worth knowing:
widening `outerFrac` would make fusion trigger more often with this
specific content's spacing, at the cost of a wider/softer-looking
falloff band on every circle, not just close pairs. Left as-is rather
than tuned further on a hunch -- see "Next steps" if this is worth
revisiting.

## Verification

No visual/manual-only check -- ran both a headless structural check and
an actual browser render, re-run after each of the v3.1, v3.2, and v3.3
passes:

- **Node check** (pure modules, no DOM, run directly via `node` against
  the real 7-section/25-entry content): reproduced the exact pipeline
  (`squarify` -> per-section `insetRect` + `generateScatterPoints`
  [checked against a running cross-section `allPlacedPoints`] +
  `sortPointsByBandReadingOrder`, then one global `growCircles` call
  across every section's seeds, bounded by the canvas and every label
  band) and checked every one of the resulting 40 circles (25 real
  entries + 15 configured extras, down from 33 pre-v3.3) pairwise for
  overlap, containment within the *canvas* (not each circle's own
  region -- v3.3 intentionally allows a circle to sit outside its own
  region), and non-intrusion into any label band. Also asserted region
  placement order matches
  section `order` (10/20/.../70), not weight.
  Current result: **0 overlaps, 0 out-of-canvas placements, 0 label-band
  intrusions across all 40 circles.** `about` and `visual-field-notes`
  (the two sections v3.2 flagged as still broken) are clean now -- global
  growth lets their circles use neighbouring regions' open space instead
  of being trapped in their own too-small region. Confirmed 18 of the 40
  circles (across 6 of 7 sections) now extend past their own region's
  `pack` rect into a neighbour's space, the intended v3.3 effect, not an
  accident.
- **Headless Chromium render** (Playwright, served over a plain static
  HTTP server since the ES module imports need real `http://`, not
  `file://`): page loads with zero console errors; DOM contains the
  expected 7 `.v3-region` groups, 25 `.v3-island` links, 0 `.v3-stub`
  (coming-soon -- none authored any more, see "Fewer, plainer extras"),
  and 7 section-label texts. Full-page screenshot confirms the
  composition visually: regions run in section-`order` reading sequence;
  archipelagos read as genuinely organic clusters of varied-size touching
  circles, not a grid; extras are plain, quiet, and few; section titles
  sit in their own band with zero circle overlap; `about`'s two entries
  (`CV`, `Currently`) render as clean, properly-floored, non-overlapping
  circles for the first time since v3.2; a visible circle near the
  Machines & Makings / Interfaces, Data & Texts seam crosses the dashed
  region outline into the neighbouring region, confirming cross-region
  growth is visually working, not just passing the Node check.
- **v3.5 addition**: a synthetic-case Node script (isolated circle land-
  fraction measurement, fusion-vs-separate pairs, zero-radius guard,
  canvas-edge closure) plus a real-content Node pass (all 40 circles,
  checking every traced subpath closes and every coordinate is finite --
  caught the edge-id chaining bug described in "How coastlines are
  traced" above) both run before the Chromium re-render. Screenshot
  confirmed organic coastlines with correctly-placed dashed status rings
  on every `wip` entry, undecorated filler islands, and zero console
  errors.

To re-run the browser check yourself: serve the repo root (`python -m
http.server` from the repo root, not from `landing-v3/`, since the
layout module imports `../docs/assets/js/cabinet-generated-content.js`)
and open `/landing-v3/index.html`. Opening the file directly
(`file://`) will fail silently on the module import, same caveat fffx's
own notes give for `fffx-layout.js`.

## Known limitations (current, not yet fixed)

Left open deliberately -- this pass's job was proving the composition,
not a finished visual pass. In priority order:

1. **Entry-title text overflows small circles**, and can overflow into
   a *neighbouring* circle or region when two small circles sit close
   together. Same root cause since v3.0 (fixed-size label, unrelated to
   the circle's own radius) -- fffx solved the equivalent problem for its
   tiles by computing font size from each tile's own rect dimensions
   (`renderTile()`'s `--tile-title-size`); the direct port here would be
   font-size-from-radius plus a truncation/ellipsis floor. Least visible
   it's been so far (v3.3's circles are generally bigger and `about`/
   `visual-field-notes` are no longer the crowded outliers they were),
   but still present. The outer-canvas-edge case of this (a label
   clipped by the page boundary itself) is fixed -- see changelog.
2. **No hard aspect-ratio contract on regions.** Deliberately relaxed in
   v3.1 (see changelog) -- `squarify()`'s own row-scoring still tends
   toward reasonably square results, but nothing enforces or even
   reports a band anymore. v3.3's global cross-region growth and v3.4's
   `minSectionWeight` floor together absorbed the practical cost of this
   that had shown up so far (`about`'s region grew from a 290x62px
   sliver to 92x488px, no section currently produces a visibly bad
   shape) -- but there's still no *guarantee* a future weight
   distribution couldn't produce one; only evidence that the current
   7-section/25-entry content doesn't.
3. **Point-stage centering doesn't re-validate cross-region separation
   after translating (v3.4, narrowed in scope by v3.4.2).**
   `centerPointsInRect()` can shift a sparse section's *entry* points by
   a large fraction of its own scatterArea -- large enough, in principle,
   to move one closer to a section processed *earlier* than the
   pre-centering scatter check validated (see its own doc comment in
   `cabinet-v3-circlepack.js` for the full reasoning). v3.4.2 shrank this
   limitation's blast radius: extras are no longer centered/translated at
   all (they're scattered fresh, after entries are already fixed, into
   whatever room is actually left -- see "Bugs found and fixed"), so only
   entry points carry this residual risk now, not the whole point set.
   Not observed to matter in practice (0 overlaps across all 40 circles,
   verified after this change), but it's a real gap in the safety
   argument, not a proven-safe one -- flagged honestly rather than
   assumed away.
4. **Label band height is content-driven now but still capped.**
   v3.4's `computeSectionLabel()` grows the band to fit a wrapped title
   up to `maxBandHeight` (default band height, or up to 3x, whichever is
   smaller, capped at 40% of the region's own height) -- an improvement
   over v3.1-v3.3's flat heuristic, but a region that's both very short
   *and* has a long title could still hit the cap and fall through to
   font-shrinking or truncation. Not currently observed against real
   content (all 7 titles render uncut, 2 of them wrapped to 2 lines).
5. **Global scatter separation is a running accumulator, order-
   dependent.** `generateScatterPoints()`'s `existingPoints` check (v3.3)
   only sees points placed by sections processed *earlier* in
   `sectionMetas`' `order` sequence, not later ones -- correct for
   preventing new points from crowding existing ones, but means a
   section very early in `order` never has to make room for one very
   late in `order`, only the reverse. Compounds with limitation #3 above
   (centering can move points after this check already ran). Not
   observed to matter in practice (0 overlaps currently), noted as a
   theoretical gap.
6. **`packCirclesSpiral()` and `centerClusterInRect()` are unused
   dead-ish code** right now -- both kept intentionally (see their own
   doc comments in `cabinet-v3-circlepack.js`), but flag them if still
   unreferenced by the time this merges; either wire up a use or delete
   them. (`centerClusterInRect()` specifically was v3.2's centering
   approach, superseded by `centerPointsInRect()` in v3.4 -- see the
   changelog -- not a duplicate of it.)
7. **No thumbnails yet.** Brief says "eventually thumbnail and other
   details" -- circles currently render title-only, matching "for now"
   in the brief.
8. **Visible coastline and clickable hit-circle aren't the exact same
   shape (v3.5).** An entry's hit circle is its original, un-noised
   `(x, y, radius)`; the coastline drawn at that position is noise-
   shifted (per-circle land-area-fraction tuned to 78-83% of that
   original circle, see "How coastlines are traced"), so there's a thin
   margin where the visible land extends slightly past the hit circle,
   or the hit circle covers a sliver the coastline actually traced as
   water. Not observed to be a real usability problem at the tuned
   fraction (the mismatch margin is small relative to circle size), but
   it's a real, deliberate approximation, not an exact correspondence.
9. **Fusion is architecturally supported but doesn't currently trigger
   against real content (v3.5).** See "Fusion behaviour" above -- the
   real 7-section/25-entry content's closest circle pairs sit right at
   growth's padding minimum (~6px), tighter than the current falloff
   band reliably bridges. Verified working on synthetic close-circle
   cases; just not exercised by this specific content's actual spacing.
10. **Dev control panel overlaps page content on narrower viewports
    (v3.6).** `cabinet-v3-controls.js`'s panel is `position: fixed` in the
    top-right corner at a fixed 250px width -- on the 1400px-wide
    screenshot viewport it covers part of `machines-makings`' rightmost
    circles/labels. Not fixed, since the panel is an explicitly dev-only
    tuning tool (see its own doc comment), not part of the page design
    being reviewed -- scroll or resize the browser window to see anything
    it's covering, or collapse/remove it once tuning is done.

## About Me: what was going on, and what was done about it

Asked after v3.2: "what are your suggestions for the slender About Me
section?" v3.4 implemented the recommended fix (option 2 of three
considered) rather than leaving it open -- recorded here as what
happened and why, not as a still-open recommendation.

**Why it was slender:** `about` carries the lowest real weight of any
section (2, versus 6-14 for the rest), and `squarify()` -- with the
aspect contract relaxed since v3.1 -- placed it as a 290x62px sliver,
mostly consumed by `regionGap` and the label band, leaving a 274x20px
`pack` area pre-v3.4. That's a direct, traceable consequence of two
earlier decisions (relax squareness; compute section weight from
entries, not an authored number) meeting a section that only has two
real entries -- not a bug in the sense of "the algorithm did something
wrong": squarify correctly gave `about` its proportional 2/62-of-
total-weight share of the page, that share was just visually thin.

**v3.3 fixed the breakage** (global cross-region growth let `about`'s
circles use neighbouring open space instead of being trapped in a
region too small to fit them), **v3.4 fixed the thinness**: added
`v3Config.canvas.minSectionWeight` (5), a floor applied only to each
section's weight for *area-allocation* purposes
(`effectiveWeightForArea()` in `cabinet-v3-layout.js`) -- real entry
weights, circle sizing, everything else reads the true weight
unaffected. `about`'s effective weight went from 2 to 5 (chosen to land
near `teaching`/`visual-field-notes`'s real 6-7, not erase the
difference from `fffx`'s 14), and since `canvasHeightFor()` uses the
same effective-weight sum, the *canvas* grew to accommodate it rather
than stealing area from the other six sections -- squarify's own
proportions stayed internally consistent with the area it was given.
Concrete effect on the real content: `about`'s region went from
290x62px to 92x488px (squarify redistributed the whole layout once its
own weight changed, not just its own tile), and its two real entries
(`CV`, `Currently`) grew from a floor-locked 12px radius to 31px each --
comparable to entries in the other six sections, not visibly the
outlier any more.

**Options not taken:** "leave it" (defensible given the live v2.1 map's
own precedent of treating About Me as "deliberately peripheral... per
design brief" -- see this repo's `README.md` changelog) was passed over
in favor of actually fixing it, since the user asked to try the fix
rather than accept the status quo. A general `squarify()` row/column
minimum-size guarantee (fffx precedent: its "section minimum-area
guarantee") remains untried -- more general than a weight floor (would
help any oddly-shaped region, not just low-weight ones) but meaningfully
more code and partially re-introduces the aspect-guaranteeing machinery
v3.1 deliberately removed. Worth reaching for only if a future section
combination produces a bad shape that a weight floor doesn't fix.

## Next steps (not started)

- Font-size-from-radius + truncation for circle labels (limitation #1).
- If cross-region overlap is ever observed against a different content
  mix: re-validate (or re-clamp) `centerPointsInRect()`'s output against
  `allPlacedPoints` rather than trusting the pre-centering scatter check
  (limitation #3).
- If this direction is approved: drop `cabinet-sections.tsv`'s now-
  redundant `weight` column, add an `extraCount` column per the schema-
  extension proposal in `cabinet-v3-extras-config.js`, fold `landing-v3/`
  into `docs/` + `docs/assets/{css,js}/`, and merge this file into
  `LANDING-PAGE-NOTES.md`.
- If a more fused, less discrete-island look is wanted: widen `island`
  config's `outerFrac`/`gradientStrength` so close-but-not-touching real
  pairs (currently ~6px apart at the closest) reliably bridge (limitation
  #9) -- untried, since the zero-fusion result already reads fine as-is.
- **Linearity** (v3.6): actual straight coastline stretches, distinct
  from concavity and not something domain warping produces (see its own
  writeup above). Two directions not yet tried: a stepped/quantized warp
  field (flat plateaus with sharper transitions between them), or a
  Voronoi/Worley-cell-boundary term added into the heightmap (cell edges
  are straight lines by construction) -- the latter is a bigger structural
  addition, closer in scope to domain warping itself than to a parameter
  tweak.
- Domain warp's own parameters (`warpStrength`/`warpScale`/`warpOctaves`
  in `v3Config.island`) are a starting point tuned against a concavity
  proxy, not a finished aesthetic pass -- the point of v3.6's control
  panel is to let real tuning happen interactively; whatever values that
  settles on should get copied back into `cabinet-v3-data.js` (the
  panel's own "Copy config" button exists for exactly this) once decided.

## Changelog

### v3.6 -- domain warping for real concavity + dev tuning panel

Direct follow-up to feedback on v3.5.4: "still very much circle-got-
distorted... no concavity in the shapes at large." Root cause: angular
modulation (v3.5.2-.4, however extreme) computes a radius as a function
of angle around one fixed center, which is structurally star-shaped --
every ray from that center crosses the boundary exactly once, no matter
how many octaves or how much ridging get piled on. Fixed by domain
warping (Inigo Quilez's technique, `warpOffset()` in
`cabinet-v3-islandshape.js`): displaces the *sample position* itself
(via two decorrelated low-frequency `fbm2D` fields) before both the
distance-to-center check and the per-pixel coastline noise read it --
breaks the star-shaped constraint directly, since a warped point can
sample as past the coastline while its geometric neighbour doesn't, a
real fold rather than a radius dip. Layered on top of v3.5.2-.4, not a
replacement -- angular modulation and ridging still contribute.

`warpStrength: 40`/`warpScale: 1/100` picked from an empirical sweep
(strength x period grid against 12 varied synthetic circles, not
eyeballed) using a concrete concavity proxy: fraction of rays from a
circle's own center crossing the coastline more than once (>1 crossing
is direct, checkable proof of a real fold). Re-verified against the real
40-circle content: avg multi-crossing-ray fraction 1.55% (warp off) ->
3.40% (warp on), all 40 circles still close cleanly, no fragmentation.

Also ships `cabinet-v3-controls.js`, a dev-only on-page panel (sliders
for `warpStrength`/`warpPeriod`/`warpOctaves`/`angularStrength`/
`angularRidgeMix`/`threshold`/`noiseAmplitude`/`gradientStrength`, plus
Reset and Copy-config) so the real aesthetic tuning happens live against
the rendered shapes instead of another screenshot-edit-repeat cycle --
requested directly, after v3.5.1-.4 each took a full round-trip to test
one guess. Made cheap by splitting `cabinet-v3-layout.js`'s `render()`:
the expensive treemap/circle-packing pass now runs once and caches
`{ grown, canvasBounds }`; the newly-exported `retraceIslands()` re-
traces against that cache and updates the existing path's `d` attribute
in place on every slider input, without re-running packing.

Full technical writeup, the sweep methodology, and the concavity-proxy
verification: see "Domain warping for real concavity (v3.6)" above.
Screenshots: `dev-screenshots/v3.6-domain-warp-default.png` (and
`-svg-only.png`, `-max-strength.png`) vs. `v3.5.4-ridged-blend.png` for
the direct before/after.

Explicitly not attempted: coastline **linearity** (straight cliff-like
stretches) -- a distinct ask from concavity, and not something domain
warping produces. See "Next steps".

**Follow-up, same pass: `islands-showcase.html`.** Asked directly after
seeing the panel: make it a permanent page, showcasing island generation
itself. New standalone entry point, repo-only (not linked into the live
site), running on a frozen content snapshot with all links neutralized
to `"#"`. Verified via Playwright: 0 console errors, all 25 island links
resolve to `#` (confirms neutralization), independent slider-retrace
check passes. Screenshot: `dev-screenshots/v3.6-islands-showcase-page.png`.

**Superseded by v3.6.1, immediately after** -- see that entry below and
"Three pages" above. `islands-showcase.html` became `archive/v3.6/`
(gained its own frozen `config.js`, not just frozen content) once a
second page (`islands-tool.html`) was added for *live* tuning and it
became clear "frozen showcase" and "ongoing tool" were two different
needs.

### v3.6.4 -- offset coastline ripples

First item of the visual-polish pass ("offset waves like previous
version"). Ported the *look* of the v2 map's `coast-ripples-global`
(concentric rings fading outward from the coastline, nearest darkest/
heaviest -- same stroke color/width/opacity progression, `--cab-ink-
soft` at 1.1px/0.85 opacity down to 0.4px/0.28) without porting its
*mechanism*: v2 traces a genuine distance-transform contour from a
separate build tool; v3 already has a scalar heightmap per island
(`buildIslandHeightmap`), so a ring is just one more marching-squares
pass at a threshold below the coastline's own -- height decreases
roughly monotonically with distance from any circle's core, so a lower
threshold sits strictly farther out, literally a distance ring, for
free off data already in memory.

Refactored `traceIslandShapes()` to share a new exported
`traceContourFromHeightmap(H, cols, rows, cellSize, canvasBounds,
threshold)` -- lets a caller build the heightmap once and trace N
levels off it (coastline + `v3Config.island.rippleThresholds`, new:
`[-0.74, -0.85, -0.94]`) instead of paying the expensive part (sampling
noise/warp at every grid cell) N times. `cabinet-v3-layout.js`'s
`drawIslandsPath()` now does exactly that, and inserts each ring
directly behind the land path so later retrace calls (slider drags on
`islands-tool.html`) only update `d` attributes, never DOM order.

Same fusion behavior as the coastline itself falls out for free: close
islands' rings merge at farther-out threshold levels exactly like their
coastlines merge at the main one, via the heightmap's own `max()`-
combine -- the one thing v2 had to solve specially for (its own
comment: "islands close enough together fuse their rings... instead of
clipping through each other") needed no extra work here.

Deliberately NOT ported into `archive/v3.6/` (frozen at what v3.6
actually looked like, new decorative features don't apply) --
re-verified 0 ripple-ring elements there after this change, confirming
the freeze holds for markup/features too, not just config values.

Verified against real content: each successive ring's bounding box
strictly encompasses the previous one (confirms rings expand outward,
not just wobble in place); subpath count decreases ring-to-ring (40 ->
36 -> 32 -> 27) as more close-island pairs fuse at farther-out levels,
expected and correct. Static `index.html` rebuilt and re-verified with
JavaScript entirely disabled -- all 3 ring levels present in the
zero-JS output. "Fine tune later" per explicit request -- thresholds
above are a first pass, not final. Screenshots:
`dev-screenshots/v3.6.4-ripple-rings.png` (full page),
`-closeup.png`.

### v3.6.3 -- paste-friendly config, file table grouped by editability

Two small, related requests after the file count grew past what a flat
list usefully conveyed. First: "for all the files in the landing-v3
folder... I'd prefer to... bifurcate between files that have input
variables for me to edit vs logic files I shouldn't touch." Fixed by
regrouping the file-responsibility table (see "Split modules, fffx-
shaped" above) into four groups -- Edit these / Logic / Build tooling /
Pages-generated-frozen -- instead of one flat list ordered by nothing
in particular.

Second, more concrete: `cabinet-v3-data.js`'s `island` block had a
comment before nearly every field, which is exactly what got in the way
of the actual intended workflow (tune on `islands-tool.html`, click
"Copy config", paste the result back into this file) -- pasting JSON
over a block with interleaved comments meant either destroying the
comments or hand-picking individual lines to replace, both against the
point of having a one-click "Copy config" button at all. Restructured
so the `island: {...}` block itself is comment-free and in the exact
key order the panel's `JSON.stringify(v3Config.island, null, 2)`
produces -- the whole block can now be selected and replaced with a
paste, in one motion, every time. All the explanatory content that used
to sit inline was moved (not deleted) to a new **ISLAND CONFIG FIELD
NOTES** comment block at the end of the file, same field order, so
"what does the Nth value do" is still answerable, just not in the way
of editing. `canvas`/`pack` keep their inline comments as before --
neither has a paste workflow competing with them, so there was no
reason to touch those.

Considered and rejected: folding `cabinet-v3-extras-config.js` into
`cabinet-v3-data.js` (both are v3-only tuning data, so it looked like a
natural merge). Rejected because `extras-config.js` also carries a small
amount of real logic (`defaultExtrasFor()`'s deterministic hash
fallback) -- merging it in would mean `cabinet-v3-data.js` stops being
pure data, working against the exact "which files are safe to touch"
clarity this pass was trying to create. Left as two files, now both
correctly labeled in the regrouped table.

Verified: `cabinet-v3-data.js` still loads and produces byte-identical
`v3Config.island` values (confirmed via Node import, and by re-running
`build-static.mjs` -- `index.html`'s generated output diffed as
unchanged, proving only comments moved, no values shifted).

### v3.6.2 -- index.html becomes a zero-JS static build

Direct follow-up to explaining how `index.html` worked: it recomputes
the *entire* pipeline (treemap, packing, noise/warp heightmap, marching-
squares tracing) from scratch, client-side, on every single page load.
Asked directly to fix that -- "no recomputes until a section or entry
actually changes" -- with the exact target architecture specified: JS
does its work once, produces a static set of clickable SVG shapes,
recompute only triggers when entries/sections actually change.

Moved the whole pipeline from request-time (every visitor) to build-time
(once, on demand). `build-static.mjs` runs headless Chromium against a
new build-only page (`build-render.html` -- `cabinet-v3-layout.js`'s
real `render()`, no dev panel), captures the rendered `#v3-stage`'s
`outerHTML`, and injects it into `index.template.html` (the new actual
source) to produce `index.html`, banner-marked auto-generated same as
`cabinet-generated-content.js`.

**Real headless-browser snapshot, not a hand-written serializer** --
asked to explain the tradeoff (effort/deps/build-speed/page-load/
maintenance) before choosing, since the difference wasn't obvious from a
one-line "recommended" tag. The deciding factor, by the user's own
reasoning: a hand-written string-based serializer would be a second
independent rendering implementation, needing to be manually kept in
sync with `cabinet-v3-layout.js`'s actual DOM-construction logic every
time it changes (which has happened in nearly every version of this
file) -- a maintenance burden that persists even without an AI assistant
around to do the porting. A headless-browser snapshot has exactly one
rendering implementation; there's nothing to keep in sync, by anyone,
ever. The cost -- a browser dependency and a few extra seconds at build
time -- is paid once, by whoever runs the build, never by a site
visitor, so it wasn't a real tradeoff once laid out concretely.

Trigger is a separate, explicit `npm run build` (or
`node build-static.mjs`) from `landing-v3/`, deliberately not chained
onto `tools/build-cabinet-content.js`'s TSV-triggered build --
`landing-v3/` is still an unapproved, isolated prototype; wiring a
real-site build script into it would blur that boundary prematurely.

Verified: built `index.html` loaded with Playwright's
`javaScriptEnabled: false` (JS entirely disabled, not just "no console
errors") still shows all 25 real island links with correct hrefs, zero
`<script>` tags in the output, no dev panel, visually identical to the
live-computed version. `islands-tool.html` and `archive/v3.6/` re-
verified unaffected (neither imports anything the build touched).
Screenshot: `dev-screenshots/v3.6.2-static-build-no-js.png`. Full
writeup: "Static build" above.

### v3.6.1 -- three pages, first real interactive tuning pass applied

Direct follow-up to using the v3.6 panel for the first time: produced a
config worth keeping ("this is a decent config to start with") and, in
the same message, a request to make the tool page permanent and
distinct from an archival record of what came before it -- see "Three
pages" above for the full architecture (`index.html` / `islands-tool.html`
/ `archive/v3.6/`) and exactly what "frozen" does and doesn't cover in
the archive.

**Config change** (`cabinet-v3-data.js`'s `island` block, applied to
`index.html`/`islands-tool.html` only -- `archive/v3.6/config.js` keeps
the pre-tuning values): `warpStrength` 40 -> 60, `warpScale` 1/100 ->
1/85 (shorter period), `warpOctaves` 2 -> 3, `angularRidgeMix` 0.6 ->
0.36 (pulled back, since warp was now doing more of the "sharp feature"
work), `noiseAmplitude` 0.35 -> 0.38, `gradientStrength` 1.1 -> 1.12,
`threshold` -0.5 -> -0.62 (compensating for the extra land the stronger
warp/noise otherwise carves away), `angularStrength` 0.4 -> 0.38. Result:
visibly more coastline-like -- a mix of rounder bulges and genuinely
sharp points, less uniform than v3.6's shipped defaults. Verified via
Playwright across all three pages simultaneously (see "Three pages"):
`index.html`/`islands-tool.html` both read the new values and keep real
navigation (25 distinct hrefs); `archive/v3.6/` still reads the original
v3.6 defaults and all-`#` hrefs, confirming the archive split actually
insulates it from this edit. Screenshot:
`dev-screenshots/v3.6.1-interactive-tuning.png`.

**Caught and fixed in the same pass:** the original `islands-showcase.html`
only ever froze *content*, not config -- it still imported the live
`v3Config` from `cabinet-v3-data.js`. Had this config change landed
before the archive/tool split, the "frozen" showcase would have silently
picked up the new tuning too. Fixed by giving `archive/v3.6/` its own
literal `config.js` (a full copy of `v3Config`, not just `island`) before
touching `cabinet-v3-data.js` -- ordering mattered here, not just the
end state.

### v3.5.4 -- ridged noise for sharp inlets, bias-corrected

Direct follow-up to feedback on v3.5.3: still "definitely [a] circle
with distortion instead of noisy island." Asked whether parameter
changes could help, specifically "more extreme jumps, more smooth or
rough transitions" -- recommended ridged noise over just raising
`angularStrength`, since amplitude alone makes existing bulges bigger,
not sharper; sharpness needs a different noise *character*, not more of
the same one.

**What changed.** `ridge()` in `cabinet-v3-islandshape.js` -- the
classic `1 - abs(n)` remap, turning raw Perlin's rare excursions toward
its extremes into sharp features instead of smooth ones. New
`ridgeMix` parameter on `angularFbm()` blends smooth and ridged remaps
of the same underlying samples; new `angularRidgeMix: 0.6` config.

**Bug found and fixed during verification, before screenshotting.**
Ridged noise isn't zero-mean the way raw Perlin is (measured
empirically: raw `n` averages ~0 as expected, `ridge(n)` averages
+0.578) -- left uncorrected, blending it in pushed land-area-fraction
from ~80% to 95-98% and, as a side effect, silently reopened fusion
between real circles that v3.5's original tuning kept separate (40
circles -> 33 landmasses). Fixed by subtracting the measured 0.578
directly inside `ridge()`. Re-verified: land-fraction back to 76-87%,
all 40 real circles back to 40 separate closed subpaths.

**Verification.** Land-area-fraction re-check across the same 5 radii
used throughout this file's tuning passes, real-content closure check
(40/40 closed subpaths, ~28-32ms), single-circle radial-range check.
Screenshot showed visibly sharper, more varied local features --
individual islands now show a mix of rounder bulges and pointed
notches, rather than uniformly rounded lobing.

### v3.5.3 -- angular modulation goes multi-octave

Direct follow-up to feedback that v3.5.2's result was "definitely
[still a] circle with distortion instead of noisy island." Asked
whether tuning could help ("more extreme jumps, more smooth or rough
transitions") -- diagnosed the root cause as a missing frequency band
(one broad angular wavelength, one fine edge wavelength, nothing in
between) and recommended two changes in sequence: layer the angular
term across multiple octaves first (this entry), then optionally blend
in ridged noise for sharper localized transitions (v3.5.4) -- with
domain-warping named as a further option to consider afterward. User
confirmed the sequence and asked for both, one after the other.

**What changed.** New `angularFbm()` in `cabinet-v3-islandshape.js`,
replacing `angularRadiusScale()`'s single `perlin2D` call -- same
octave/lacunarity/gain layering `fbm2D` already does for edge noise,
walked around the per-circle loop instead of across the plane. New
`angularOctaves`/`angularLacunarity`/`angularGain` config, kept
independent of the edge noise's own equivalents. See "Circular vs.
lobed silhouettes" above for the full mechanism.

**Verification.** Land-area-fraction re-check (80-84%, unchanged from
v3.5.2's tuning), real-content closure check (all 40 circles still
trace to 40 closed, finite subpaths, ~28ms). Screenshot comparison
against v3.5.2 showed visibly more scalloped, irregular edges with
varied bump sizes -- closer to a coastline, though not yet the full fix
(see v3.5.4).

### v3.5.2 -- angle-modulated coastline radius (genuinely lobed islands)

Direct follow-up to feedback on v3.5's result: "wibbly but essentially
still circular." User proposed three candidate directions (a randomly
rotated square gradient, more noise octaves, other gradient shapes) and
asked which to pursue; recommended the angle-modulated-radius approach
as the actual silhouette fix (a square gradient just substitutes one
symmetry for another; octaves only add edge texture) with domain-
warping named as a further option, and was asked to sequence it: try
octaves first, then this, then optionally domain-warping later. See
"Circular vs. lobed silhouettes" above for the full mechanism and
tuning numbers (`angularStrength: 0.4`, `angularFreqMin/Max: 1.2/2.4`).

**Verification.** A land-fraction re-check (still 80-84% across the
same radius range as v3.5's tuning, confirming the change didn't
regress that), a widened-radial-range check (80px circle now traces
58-101px from center, versus a much tighter range pre-change), a
different-id-produces-different-lobing check, and a same-id-is-
deterministic check -- all in a throwaway `_verify-angular.mjs`, deleted
after use. Real-content pass: all 40 circles still trace to 40 closed,
finite-coordinate subpaths (41ms). Playwright screenshot confirmed the
actual visual result: islands now show real peninsulas/bays/elongation,
clearly distinct from a jittered circle, no console errors.

### v3.5.1 -- more fbm octaves, tried first, reverted

First of the two candidate fixes for "still essentially circular",
tried in the order requested. `octaves: 3 -> 6`, everything else held
constant, specifically to isolate this one variable. Screenshot
comparison showed the result was visually near-identical to v3.5 --
diagnosed as `cellSize: 4`'s own sampling resolution being too coarse to
represent the extra octaves' higher-frequency detail, so the noise
computation did more work for no visible change. Reverted to `octaves:
3` rather than paying that cost for nothing; superseded by v3.5.2's
angle-modulated radius, which changes the actual silhouette instead of
edge texture. See "Circular vs. lobed silhouettes" above.

### v3.5 -- noise-carved coastlines replace plain circles

User request, given with a full 7-step spec up front (generate a noise
map over the canvas; per circle, subtract a radial gradient from it;
threshold so most of the circle is land; trace the land/water boundary
with marching squares; use the traced islands instead of circles as
entries) plus a pointer to a specific reference article on the
technique. Two design forks were asked about explicitly before writing
any code (see "Fusion behaviour" and the extras question above): should
close circles' coastlines be allowed to fuse (yes -- matches the live
v2 map's own combined-land-mask approach), and should decorative
"extra" filler circles get the same treatment as real entries (yes, for
visual consistency).

**What changed.** New module `cabinet-v3-islandshape.js`: seeded 2D
gradient noise (`perlin2D`/`fbm2D`), a shared heightmap combining every
circle's `(noise - radial falloff)` via `max()` (`buildIslandHeightmap`),
and a marching-squares tracer (`marchingSquaresSegments` ->
`chainSegmentsToPolygons` -> `traceIslandShapes`) producing one SVG path
`d` string covering every landmass on the page. `cabinet-v3-layout.js`
calls this once, globally, after `growCircles()` -- growth itself is
completely unchanged, this only replaces what gets drawn. Per-circle
rendering changed from a filled `<circle>` to an invisible hit circle
(`.v3-island-hit`) for click/hover targeting plus a dashed
`.v3-status-ring` for anything not fully live (`wip` entries,
coming-soon stubs) -- see "How coastlines are traced" and its "Falloff
tuning"/"Fusion behaviour" subsections above for the full reasoning and
tuning numbers.

**Bug found and fixed during verification, before ever screenshotting.**
First `chainSegmentsToPolygons()` implementation joined marching-squares
segments into closed polygons by rounding each endpoint's float
coordinates into a string key. Against a single isolated synthetic
circle this worked (1 closed contour, as expected) -- but the real
7-section/25-entry content (40 circles) produced exactly 2 silently
unclosed chains (69 and 63 points each, `Z`-terminated in the output
string but not actually closed loops) out of 40. Root cause: nothing
actually guarantees two independently-computed float coordinates that
*should* represent the same grid-edge crossing point round to the exact
same key in every case a naive theoretical argument might miss --
rounding-key matching is fragile in a way that isn't obvious until it's
wrong. Fixed by keying joins on each point's *canonical grid-edge id*
instead (`H:col:row` for a horizontal grid edge, `V:col:row` for a
vertical one) -- an integer identity every crossing point on that
specific edge shares exactly, regardless of which of its (at most two)
neighbouring cells computed it, sidestepping float comparison
altogether. Re-verified: 0 unclosed/bad subpaths across all 40 real
circles after the fix. Caught by the Node harness's real-content pass
(checking every traced subpath's first/last point matched exactly),
never visible in a screenshot -- the broken chains still *looked* like
plausible, if slightly odd, land shapes.

**Verification.** A synthetic-case Node script
(`_verify-islandshape.mjs`, throwaway, deleted after use): land-area-
fraction measurement across 5 circle radii (15-200px, landed at
78-83% after retuning from an initial 62-67%), single-circle trace
closure, two-close-circles-fuse / two-far-circles-stay-separate, a
zero-radius-circle guard (no crash), and a canvas-edge-touching circle
still closing. A real-content Node pass (`_verify-real-content.mjs`,
also throwaway) reproducing the actual `render()` pipeline against all
7 sections/40 circles, confirming 0 bad/unclosed subpaths (this is what
caught the edge-id bug above) and reporting 40 circles -> 40 landmasses
(zero fusion with this specific content's spacing -- see "Fusion
behaviour"). Playwright screenshot (served over a plain Node static
server, same `http://` requirement as the existing browser-check
convention) confirmed organic, faceted coastlines reading clearly as an
archipelago; dashed status rings correctly aligned with every `wip`
entry (Christie, Particle Systems, Research & Interests, Gujarati Type,
Doors of Kutch, Lasercutting, Drawing Machines, Writings -- matching
`content/cabinet-entries.tsv`'s `wip` rows); filler extras rendering as
plain undecorated islands; zero console errors.

### v3.4.2 -- entries placed and centered first, extras placed after

Follow-up to v3.4.1, prompted by a specific alternative the user
proposed and asked to be implemented after seeing v3.4.1's results:
"add the main circle centres, recentre the bounding rectangle, then add
the dummy circle centres, and grow... dummy centres are still scattered
well and not colliding too badly while the primary circles are closer
to the centre and visually more prominent."

**What changed.** `buildSeedsForSection()` (`cabinet-v3-layout.js`)
split from one scatter+center pass covering entries and extras together
into two sequential passes: place + order + zip + center entries first
(pushing them onto `allPlacedPoints` immediately after centering);
*then* scatter extras into whatever room is left, with entries already
fixed and already present in `allPlacedPoints` so extras' own rejection
sampling naturally avoids them. See "How archipelagos are packed" above
for the full 5-step sequence this produces. `centerPointsInRect()`
itself is unchanged from v3.4.1 (still takes a `basisPoints` param) --
called with entries as both `points` and (implicitly, since they're the
same array at this stage) the basis, since extras don't exist yet at
the point centering runs.

**Why this is strictly better than v3.4.1's version, not just
different:** v3.4.1 scattered everyone together, then translated
everyone by a delta computed from entries alone -- correct for
centering entries, but an extra's final position was a side effect of
wherever that delta happened to drag it, which is what produced
v3.4.1's zero-radius filler casualties (see that changelog entry).
Scattering extras *after* entries are already fixed and centered means
nothing ever moves an extra again once it's placed -- its own scatter
position is simply its final position, so there's no translation left
that could carry it somewhere unintended.

**Verified:** same checks as v3.4.1 (entry-only bounding-box center
exactly matches each region's pack-area center, `delta = (0.00, 0.00)`
for all 7 sections; 0 overlaps, 0 out-of-canvas across 40 circles) plus
one more: **0 label-band intrusions at all**, not even the benign
zero-radius ones v3.4.1 had -- confirming the edge case is closed
structurally, not just rendered harmless. Extras' own radii also read
healthier against real content (e.g. `bookshelf`'s two extras grew to
41px/47px, `about`'s to 31px -- well-formed circles, not the
near-collapsed ones a bad translation could previously produce).

### v3.4.1 -- entry-only centering, first attempt

Follow-up to v3.4 within the same review round -- the user reported
"the centering still doesn't seem to be happening" and diagnosed the
likely cause themselves: "I think the dummy circles are moving the
weight of the rectangle."

**Diagnosis confirmed.** v3.4's `centerPointsInRect()` computed its
bounding box from *every* scattered point -- entries and filler extras
together. A handful of extras scattered toward one side of the pack
area could pull that computed center away from where the entries
themselves actually clustered, so entries still read off-center even
though *some* centering was genuinely happening (just centering the
wrong thing).

**Fix, first pass.** `centerPointsInRect()` gained a `basisPoints`
parameter -- the bounding box is computed from `basisPoints` only, but
every point in `points` (the full set) is still translated by the same
delta. `buildSeedsForSection()` reordered to zip items to points
*before* centering (previously centering ran on bare, kind-less points)
so it could filter `kind === "entry"` for the basis, then called
`centerPointsInRect(zipped, scatterArea, entryPoints)`.

**Verified, and one new (anticipated) side effect found.** Entry-only
centering confirmed exact: bounding-box center of just the entry
circles matched each region's pack-area center precisely (`delta =
(0.00, 0.00)` for all 7 sections, checked directly, not eyeballed). 0
overlaps, 0 out-of-canvas across 40 circles. But 8 filler circles ended
up with centers translated to zero clearance from their own section's
label band -- checked individually, all 8 had `radius = 0.00` (the
obstacle-safe-start clamp from v3.3 correctly reduced them to invisible
rather than letting them intrude visibly), matching exactly what the
user had already flagged as an acceptable outcome in the same message
("at best the dummy circles are smaller, which is fine"). Reported back
rather than silently accepted -- which is what prompted the user's
v3.4.2 alternative, adopted immediately since it closes the edge case
structurally instead of merely tolerating it.

### v3.4 -- section minimum weight, point-stage centering, bottom/multiline labels

Three asks after reviewing the v3.3 screenshot: try the section-minimum-
weight option for `about` ("the entire page will grow a little but
that's ok"); centering wasn't visibly happening -- do it at the seed-
point stage instead of post-growth, so growth's own cross-region
collision handling covers it without extra safety reasoning; and move
region titles to the bottom of their region, allowing multiple lines.

**Section minimum weight.** `v3Config.canvas.minSectionWeight` (5) --
see "About Me" above for the full before/after and why 5, not a bigger
or smaller number. `effectiveWeightForArea()` in `cabinet-v3-layout.js`
applies it consistently to both `canvasHeightFor()` and `buildRegions()`'s
squarify input, so the canvas actually grows to accommodate the floor
(as asked) rather than the floor silently reallocating area away from
the other six sections. Canvas grew from 1200x465 to 1200x488 against
the real content -- "a little," as anticipated.

**Point-stage centering.** New `centerPointsInRect()` in
`cabinet-v3-circlepack.js`, called in `buildSeedsForSection()` right
after `generateScatterPoints()`, before those points are pushed onto
`allPlacedPoints` or handed to `sortPointsByBandReadingOrder()`. This is
literally the approach suggested: center while circles are "still just
centrepoints," so growth's already-correct cross-region collision
handling (v3.3) covers everything downstream without needing a separate
safety argument for the translation itself, unlike v3.2's
`centerClusterInRect()` (translating *grown* circles, whose safety
depended on growth having been bounded by the same rect being centered
against -- a guarantee v3.3's global growth broke, which is why v3.3
stopped calling it and centering visibly stopped happening). See "Known
limitations" #3 for the one thing this doesn't automatically re-check
(whether centering moved a point closer to an *earlier* section's
already-placed points than the pre-centering scatter validated) --
verified not to matter against real content this pass, not proven safe
in general.

**Labels at the bottom, with wrapping.** `splitLabelBand()`'s band now
sits at the bottom of `region.inner` (`pack`, the archipelago area, is
now the top portion, was the bottom through v3.3). New
`computeSectionLabel()` (replacing `fitLabelToBand()`) wraps a title
onto multiple lines first, growing the band height to fit (capped at
`min(innerHeight * 0.4, defaultBandHeight * 3)`), and only falls back to
shrinking font size or truncating if wrapping alone can't make it fit.
Against real content: "Visual Field Notes" and "About Me" both now wrap
to 2 lines rather than needing a smaller font or an ellipsis; the other
5 titles are unaffected (still fit on one line at full size).

**Verified:** 40 circles, 0 overlaps, 0 out-of-canvas, 0 label-band
intrusions (re-run after all three changes together, not each in
isolation) -- plus a direct before/after on the entries that motivated
the section-weight change: `about`'s `CV`/`Currently` grew from 12px
radius (v3.3, floor-locked) to 31px each (v3.4).

### v3.3 -- fewer/plainer extras, global cross-region growth

Four asks after reviewing the v3.2 screenshot: fewer empty circles, no
dashed "coming soon" stubs (1-3 plain greyed-out extras instead);
`visual-field-notes`'s overlaps; suggestions for the slender `about`
section; and letting circles cross into a neighbouring region's space
(but never the canvas edge, and never through another region's circles)
instead of being strictly walled inside their own region.

**Fewer, plainer extras.** `cabinet-v3-extras-config.js` counts cut from
4-6 to 1-3, `comingSoon` set to 0 everywhere -- see "Fewer, plainer
extras" above. Total circle count on the page dropped from 58 to 40.

**Global cross-region growth.** `growCircles()` reworked to take every
section's seeds in one call, bounded by the whole canvas plus every
region's label band as an obstacle, instead of one independent call per
region bounded by that region's own rect. Scatter/order/zip stay
per-section (an entry still starts out anchored near its own label); only
growth stopped being region-scoped. See "How archipelagos are packed"
above for the mechanism, and "About Me" above for what this did and
didn't fix for that section specifically. `centerClusterInRect()` (v3.2)
is no longer called -- its safety argument stopped holding once growth
wasn't bounded by the rect it would center against -- kept in the file,
documented as currently unused.

**Bugs found and fixed** (Node check first, again, before any
screenshot):

- *Cross-region scatter proximity.* Two regions sit only ~2x `regionGap`
  apart -- close enough that a purely per-region separation check
  couldn't see a point from one region landing within `safeMinSeparation()`
  of a point already placed for its neighbour, which global growth would
  then treat exactly like the too-close-within-one-region case that
  check exists to prevent. Fixed by threading a running
  `allPlacedPoints` accumulator through `cabinet-v3-layout.js`'s
  per-section scatter calls (each section's `generateScatterPoints()`
  call now checks against every point placed by every section processed
  before it, not just its own) -- `generateScatterPoints()` gained an
  `existingPoints` parameter for this.
- *Own-label-band intrusion.* With growth now bounded by the whole
  canvas instead of one small region, `distanceToBoundary` (the clamp
  that grants a circle's *starting* radius, before any growth pass runs)
  almost never binds any more -- most circles start at or near their
  full weight-scaled target immediately. That's fine against other
  circles (scatter's separation is sized for it) but the starting-radius
  clamp only checked the canvas edge, not label-band obstacles -- a
  point scattered close to its *own* section's band (guaranteed only
  `minRadius` of clearance by the scatter inset, not a full target's
  worth) could start already overlapping that band, with no incremental
  growth step in between to have been stopped at. Caught concretely:
  `visual-field-notes`'s `gujarati-type` scattered 14.8px from its own
  band with an ~20px target. Fixed by adding a matching
  `distanceToObstacles` clamp alongside the existing boundary one.

**Verified:** 40 circles, 0 overlaps, 0 out-of-canvas, 0 label-band
intrusions, 18 circles (6 of 7 sections) confirmed extending past their
own region into a neighbour's space -- see "Verification" above.

### v3.2 -- minimum circle size, corrected separation, centered archipelagos

Three specific refinements requested after reviewing the v3.1
screenshot: some real entries (Asimov, Student Work) still read too
small; scatter points should check against "each other's min dia +
25% or so"; and finished archipelagos should be centered within their
region rather than sitting wherever growth happened to leave them.

**Minimum circle size.** `packRadiusFor()` reworked from a single
`[seedMin, seedMax]` range to two independent config knobs: `minRadius`
(12px, a hard floor every circle gets regardless of weight, before any
growth) and `maxWeightExtra` (14px, sqrt-scaled on top of the floor by
weight) -- separated because "some circles are too small" and "weight
should be more visually distinguishable" are two different tuning
questions with two different fixes, and were both folded into one range
before. Verified effect on the 5 well-proportioned sections: entry radii
went from a v3.1 range as low as 2-5px up to a consistent 17-64px.

**Centered archipelagos.** New `centerClusterInRect()` in
`cabinet-v3-circlepack.js`, called after `growCircles()`: translates
every circle in a section's finished cluster by the same `(dx, dy)` so
the cluster's own bounding box centers on its region's `pack` area.
Pure translation (radii and pairwise distances unchanged, so it can't
reintroduce overlap), and always safe against the pack area's own
bounds since a smaller box centered inside a larger one can't end up
outside it. The user's stated fallback plan (hold off on a polar
r/theta scatter distribution for now, do this simpler bounding-box
translation instead) implemented as described.

**Bugs found and fixed** (again via the Node overlap check, before any
screenshot -- same discipline as v3.1):

- *Separation formula, tried twice.* First attempt read "min dia + 25%"
  literally: `2 x minRadius x 1.25` (30px). This under-shot badly:
  `growCircles()`'s boundary clamp (see `distanceToBoundary`) lets a
  point with generous clearance to its *region edge* start at or near
  its full weight-scaled `target` immediately, not just at `minRadius`
  and growing up from there -- so a point scattered a legal 30+px from
  its neighbour could still start most of the way to a 26px radius and
  collide with that neighbour in the very first shared growth pass,
  before growth had a chance to matter. Caught concretely: `bookshelf`'s
  Asimov (boundary-clamped to start at radius 22 immediately) collided
  with an adjacent coming-soon stub that scattered a legal-at-the-time
  30px away. Fixed by using the true worst case instead --
  `2 x (minRadius + maxWeightExtra) x 1.25` (65px) -- covering the
  possibility that *either* point in a pair starts at its full target,
  not just its floor.
- *Scatter-side floor, redundant but kept.* Beyond the separation fix,
  scatter itself was also changed to sample inside `insetRect(packArea,
  minRadius)` rather than the raw pack area, so every point starts with
  at least `minRadius` of edge clearance as a matter of construction,
  not just as an emergent property of a large-enough separation value.
  `growCircles()`'s own boundary clamp becomes defensive after this
  (kept anyway, cheap insurance).
- *Fallback candidate quality.* `generateScatterPoints()`'s "couldn't
  find a fully clear spot" fallback used to just draw one more
  unconstrained random point, which could easily be worse than every
  attempt already tried. Now tracks the least-bad candidate seen across
  the attempt budget (max of its own minimum distance to every already-
  placed point) and uses that instead -- doesn't guarantee full
  separation in a genuinely crowded region (nothing can, geometrically),
  but stops the fallback from actively making things worse.

**New finding, not yet fixed** (see "Known limitations" #2): the
65px worst-case separation that fixed the general case is, honestly,
demanding of small regions -- `about`'s pack area (274x20px, a direct
consequence of the v3.1 relaxed-squareness decision squarifying a
weight-2 section into a very short sliver) can't geometrically fit even
one `minRadius` circle's own diameter, and `visual-field-notes` is
dense enough at 65px/9-items to lean on the fallback path regularly.
Both still pass containment (no circle escapes its region) but not full
non-overlap. Surfaced honestly rather than tuned away by, e.g., quietly
shrinking `minRadius` back down -- that would undo the fix this round
was about. Open question for next round, not resolved here.

### v3.1 -- growth-based packing, ported from `p5-circle-packing`

Prompted by review of the v3.0 screenshot: "I specifically asked for
circle packing, not a grid of circles," plus "why is the region SO
LARGE? Make regions smaller," plus a more exact algorithm spec pointing
at the user's own `jesmehta/p5-circle-packing` library
(`CirclePack.js`).

**Packing.** Replaced `packCirclesRowFlow()`/`packCirclesSpiral()`/
`fitClusterToRect()` (v3.0, all removed) with the four-step scatter ->
band-sort -> zip -> grow pipeline described above, a direct port of
`CirclePack.js`'s `getCirPack`/`growBub`/`compareDist` technique. See
"Why growth-based packing" above for the full reasoning and the one
inherited trade-off (weight's effect on final size is real but
secondary to local density).

**Canvas sizing.** Replaced the v3.0 aspect-band height search
(`squarifyWithAspectSearch()`, removed) with `canvasHeightFor()`: height
derived directly from total section weight x a configurable
`areaPerWeightUnit`, so canvas area scales with actual content instead
of being chosen to satisfy a now-relaxed shape contract. This, combined
with growth-based packing no longer uniformly rescaling a loosely-packed
cluster up to fill 86% of whatever region resulted (v3.0's
`fitClusterToRect()` step, gone), is what fixed "regions so large" --
canvas area dropped from 1600x1700 (v2.72M px^2) to 1200x465 (0.56M
px^2) against the same 7-section/25-entry content.

**Region order bug, found and fixed.** `squarify()` (v3.0) pre-sorted
items descending by weight before laying out rows -- standard treemap
practice for row-quality, but it silently placed regions in
weight order on the page (fffx/interfaces-data-texts/machines-makings/
bookshelf/teaching/... i.e. 14/13/12/8/7) instead of the sections'
authored `order` (10/20/30/40/50/60/70), contradicting the very first
requirement of this whole feature ("on the page the sections are sorted
by order"). Not something either round of the conversation flagged
directly -- caught by checking the rendered screenshot's actual region
sequence against `order` while investigating the "regions too large"
complaint. Fixed by removing `squarify()`'s internal sort entirely and
requiring the caller to pass items pre-sorted in the desired sequence
(`cabinet-v3-layout.js` already builds `sectionMetas` sorted by `order`,
so no caller-side change was needed beyond the treemap function itself).
Verified via the Node check's explicit region-order assertion (see
"Verification").

**Label placement rework.** v3.0's `placeSectionLabel()` (six-candidate
corner search over the finished archipelago, falling back to a
fixed-220px backing plate) broke down once packing got genuinely dense:
there was often no corner that didn't touch a circle, so nearly every
section hit the fallback, and the fallback's fixed plate width
overflowed into neighbouring regions on narrower sections (visible in
the intermediate screenshot as "Bookshelf of Curiositi..." and "Teaching"
titles running past their own region into the next one, one even
clipped by the canvas edge). Replaced with `splitLabelBand()`: a
dedicated header strip reserved *before* packing even starts, so no
circle is ever scattered inside it -- "label never overlaps a circle" by
construction, not by hoping a search finds a gap -- plus
`fitLabelToBand()`, which scales font size down to the band's own width
and falls back to ellipsis truncation, so a long title in a narrow
region shrinks/truncates instead of overflowing into the next region.

**Bugs found and fixed** (via the Node overlap/containment check, which
caught all three before they reached a screenshot):

- *Seed points starting already overlapping.* `minSeparation` (v3.0's
  scatter rejection-sampling floor) was a flat 14px, unrelated to
  `seedMax` (16px). Two points scattered slightly more than 14px apart
  could both receive a starting radius up to 16px each, i.e. already
  overlap by construction before `growCircles()` ever ran a single pass
  -- `growCircles()` only ever *stops* growth on contact, it doesn't
  resolve a pre-existing overlap. Fixed with `safeMinSeparation()`,
  which derives the true floor (`2 x seedMax + padding`) from the same
  pack config instead of a hand-tuned third number that could silently
  drift out of sync.
- *Seed points starting outside their own region.* A point scattered
  near a region edge could be handed a starting radius (from
  `packRadiusFor()`) that already crossed the boundary, since scatter
  placement and radius assignment were computed independently. Fixed by
  clamping each circle's own starting radius to `distanceToBoundary()`
  at seed time (see step 3 in "How archipelagos are packed") -- every
  circle now begins in a valid state, so `growCircles()` only ever has
  to reason about growth, never about correcting an invalid start.
- *That same clamp reintroducing the bug at its own floor.* The first
  fix used `Math.max(1, Math.min(target, distanceToBoundary))` -- the
  forced 1px floor could itself exceed a genuinely sub-1px boundary
  distance for a point scattered essentially on top of its region's
  edge. Fixed by dropping the forced floor entirely
  (`Math.min(target, Math.max(0, distanceToBoundary))`): a near-zero
  starting radius for a cramped point is an honest outcome, not a case
  that needs padding out.
- *Labels clipped by the canvas's own outer edge.* An island's label is
  centered on its circle and can extend well past the circle's own
  radius (see limitation #1) -- for a circle seeded close to `x=0`
  specifically (the page's own left edge, not an interior region seam),
  that could run past the SVG viewBox boundary and get clipped by the
  browser, not just overlap a neighbour. Fixed with a 20px outer margin
  added to the `viewBox` on every side (`cabinet-v3-layout.js`'s
  `render()`) -- doesn't touch any region's own geometry, just gives the
  outermost edge of the page some breathing room the way every interior
  region boundary already effectively had via `regionGap`.

### v3.0 -- initial weighted-region + circle-pack prototype

Original pass -- row-flow circle packing, aspect-band-searched squarify,
corner-search label placement. Superseded by v3.1 above; see the
pre-changelog sections of this file (written during v3.0 and left
largely intact where the reasoning is still relevant context, corrected
in place only where it described current behavior rather than
rationale) for the full original design conversation, including the
section-weight/extras-schema/real-content/split-module decisions that
carried forward unchanged into v3.1.
