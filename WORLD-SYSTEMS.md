# World systems: the shared Level 1 pattern

This file documents the conventions shared across Level 1 worlds in the
Cabinet of Curiosities ecosystem — **Cabinet** (this repo, the umbrella
home-world), **The Bookshelf of Curiosities**, and **fffx** (Form follows
f(x)). It exists so all three repos' development approach, data schema,
and naming stay normalized even though each world's *visual* identity is
deliberately distinct (this file does not touch any site's design system
— see this repo's `DESIGN-SYSTEM.md`, or Bookshelf's/fffx's own, for
that).

A copy of this file lives in all three repos. It's intentionally
duplicated, not symlinked or submoduled — these are separate
repos/deployments, and a shared file living in only one of them would be
easy to forget to check. Keep all three copies in sync by hand when this
pattern changes; if they drift, treat whichever was edited most recently
as correct and backport.

## Conceptual levels

- **Level 1** — a world/domain. Cabinet, Bookshelf, fffx. Each is its own
  repo, its own MkDocs site, its own GitHub Pages deployment.
- **Level 2** — a section/room/region within a Level 1 world. Bookshelf's
  `bookshelfSections[]` (`Author Explorations`, `Book Data &
  Visualisation`, etc.); fffx's `sections[]` registry
  (`prompt-collections`, `tools-and-libraries`, etc.); Cabinet's own
  regions that aren't other worlds (`Teaching`, `Visual Field Notes`,
  `Machines & Makings`, `Interfaces, Data & Texts`, `About Me`).
- **Level 3** — an actual object/page/tool/project. Bookshelf's
  `bookshelfEntries[]`; fffx's `entries[]` portals; Cabinet's own
  entries (plaques/port-cards).

### Cabinet is one level up from Bookshelf/fffx

Cabinet's own `cabinetSections[]` (rendered as islands) is a **mix** of
two different things, which Bookshelf and fffx don't have to distinguish
because they only ever look "downward":

- Sections that *are* other Level 1 worlds (`bookshelf`, `fffx`) — the
  island's `href` points at an entirely different repo/domain
  (`bookshelf.cabinetofcuriosities.in`, `fffx.cabinetofcuriosities.in`).
  Cabinet does not duplicate Bookshelf's or fffx's own Level 2/3
  structure; it just links to their front door (or, per "cross-listed
  projects" below, to specific pieces inside them).
- Sections that are genuinely Cabinet's own Level 2 regions (`teaching`,
  `visual-field-notes`, `machines-makings`, `interfaces-data-texts`,
  `about`) — these behave exactly like a normal Level 2 section in
  Bookshelf/fffx, just rendered as an island instead of a shelf/tile.

Both kinds share the same `id`/`title`/`href`/`order`/`status`/`kind`
shape (see below); `kind: "world"` vs `kind: "region"` is how Cabinet's
own data tells them apart, not a schema difference.

## The common Level 1 world pattern

Every Level 1 world in this ecosystem:

- Uses **MkDocs Material** for normal (non-landing) pages.
- Has a **custom landing page** for its own homepage — not a generic
  Material content page. All three now use standalone `docs/index.html`
  shells that bypass Material for the homepage (Bookshelf was the one
  historical exception, using `docs/index.md`; Cabinet went straight to
  `docs/index.html` per the "Homepage rule" below).
- Keeps **content data outside the renderer** — no content strings or
  entry data live in gallery/layout code. Bookshelf uses hand-edited
  `bookshelf-data.js` for display/config blocks plus generated
  `bookshelf-generated-content.js` from TSV sources; fffx follows the
  same split with `fffx-data.js`/`fffx-generated-content.js`; Cabinet
  with `cabinet-data.js`/`cabinet-generated-content.js`.
- Maps **CSS tokens into MkDocs Material pages** — a `*-tokens.css` file
  (raw colour/font values, `:root`-scoped, single source of truth) feeds
  both the landing page's own stylesheet and a `*-material.css` file
  that overrides Material's `--md-*` variables, so Material-rendered
  content pages match the landing page's palette instead of defaulting
  to Material's own light theme. See "Asset naming" below.
- Deploys via **GitHub Pages**, built by a `.github/workflows/deploy.yml`
  GitHub Action (`mkdocs build` → `configure-pages` →
  `upload-pages-artifact` → `deploy-pages`). All three repos' workflows
  are currently the same shape (Cabinet migrated from the older
  `peaceiris/actions-gh-pages` action to match — see its README
  changelog).

### Local world data vs. Cabinet data

A Level 1 world's own data file controls what appears on **that world's
own landing page**. It does not control whether that world (or an item
within it) appears on **Cabinet's** own map — that's a separate concern,
governed by Cabinet's own `cabinet-sections.tsv`/`cabinet-entries.tsv`. A
project can exist in Bookshelf's `bookshelfSections[]` (so it renders on
Bookshelf's own landing page) without necessarily being surfaced on
Cabinet's map, and vice versa.

### Cross-listed projects

A project can legitimately belong to more than one Level 1 world's data
file (e.g. a project that's both a Bookshelf "data visualisation" and an
fffx "tool" — or, from Cabinet's side, an fffx project surfaced directly
on Cabinet's map, like `student-work` cross-listed from fffx's data onto
Cabinet's `teaching` island). When that happens, **each world's data file
gets its own entry**, but both entries should link to the **same
canonical URL** rather than each world hosting its own copy of the
content. Don't fork the content; do duplicate the listing.

## Standard shared data fields

Every Level 1 world's entries (Level 3 objects, or Cabinet's islands
standing in for Level 1/2) should carry these fields where applicable.
World-specific fields beyond this list are allowed and expected — every
world has its own texture — but must be documented in that world's own
notes file (`LANDING-PAGE-NOTES.md` for fffx and Cabinet, `README.md` for
Bookshelf).

```js
id              // stable, unique within the world
title
subtitle
href            // relative, never root-absolute -- root-absolute hrefs
                // break under a GitHub Pages project subpath (no
                // custom domain), which was Cabinet's own deploy
                // target until 2026-08-23; keep this convention
                // regardless of whether the current deploy target has
                // a CNAME, since any Level 1 world without one still
                // hits exactly this failure mode; see
                // LANDING-PAGE-NOTES.md)
section         // singular; entry's one home section/island
sections        // optional, for genuinely cross-listed-within-one-world entries
kind
order           // placement priority
weight          // editorial/visual importance
status          // see "Standard status model" below
tags
location
relatedLinks    // [{ label, href }] -- secondary links such as source repos
notes
```

Cabinet's own extension: sections additionally carry a `map: {islandId,
cx, cy, rx, ry, mapForm}` object, and entries a `visual: {placement, x,
y, anchor, order, size, cardType, leaderTo}` object — these are Cabinet's
world-specific layout fields, in the same spirit as fffx's
subdivision-`weight` scoring or Bookshelf's `span` grid-width field.
Neither Bookshelf nor fffx needs Cabinet's placement vocabulary, and
Cabinet doesn't need theirs.

## Standard status model

One field, doing both visibility and "is this finished" duty:

```js
status: true      // visible, normal
status: "wip"     // visible but muted/dormant/work-in-progress
status: false     // hidden/not rendered
```

All three worlds use this model directly. `status: true` renders the
active clickable island/card, `status: "wip"` renders a visible muted
island/card, `status: false` hides it entirely. Cabinet's renderer
additionally treats `"wip"` (or simply a missing `href`) as "render as a
non-navigating element, not a link" — see `DESIGN-SYSTEM.md` — since
Cabinet, more than the other two worlds, routinely has islands/entries
for sections that are planned but genuinely have no page yet.

## Homepage rule

New Level 1 worlds should default to a **standalone `docs/index.html`**
for a fully custom landing page (fffx's original pattern, and the one
Cabinet followed directly), not `docs/index.md` rendered through Material
with the header hidden (Bookshelf's original pattern, since migrated —
see its own changelog). The standalone-HTML approach needs no
header-hiding CSS/JS workaround, no Markdown-pipeline risk for inline
logic, and no `:has()`/sibling-walk fragility.

**Do not create `docs/index.md` in a repo that uses `docs/index.html`** —
MkDocs will happily build both, but only one can actually serve as `/`,
and the collision is a confusing, easy-to-reintroduce mistake. All three
repos' `deploy.yml` guard against this in CI.

## Asset naming

Preferred convention for every world:

```text
docs/assets/js/
docs/assets/css/
docs/assets/images/
docs/assets/thumbs/
docs/stylesheets/        # Material-facing CSS only (tokens + material override)
```

World-prefixed filenames, so it's unambiguous which world an asset
belongs to even out of context:

```text
cabinet-tokens.css / cabinet-landing.css / cabinet-material.css
fffx-tokens.css / fffx-landing.css / fffx-material.css
bookshelf-tokens.css / bookshelf-landing.css / bookshelf-material.css
```

Browser-facing JS and spreadsheet sources follow the same prefix:

```text
content/cabinet-sections.tsv, content/cabinet-entries.tsv, tools/build-cabinet-content.js
content/fffx-sections.tsv, content/fffx-entries.tsv, tools/build-fffx-content.js
content/bookshelf-sections.tsv, content/bookshelf-entries.tsv, tools/build-bookshelf-content.js
```

Spreadsheet TSV convention:

- Prefer ASCII-safe source values for content that will be edited in
  Excel/Sheets.
- Do not apply display prettification globally. Never transform URLs,
  IDs, tags, locations, or other machine-readable fields.
- Parse `status` case-insensitively so `TRUE`/`FALSE` cells and
  human-entered `WIP` normalize to the shared JS values `true`, `false`,
  and `"wip"`.

## Order-based rendering

Every section has `order`; every entry has `order`. Renderers sort by
`order` rather than relying on array position or string-matching against
a display title, so renaming a section's display title never silently
breaks pinning/ordering logic elsewhere.

## Cabinet-specific notes not shared with Bookshelf/fffx

These live here rather than in Cabinet's `DESIGN-SYSTEM.md`/
`LANDING-PAGE-NOTES.md` because they're about how Cabinet *relates* to
its sibling worlds, not about Cabinet's own internals:

- As of 2026-08-23, Cabinet has a `docs/CNAME` (`cabinetofcuriosities.in`
  itself, the root domain) -- added when `landing-v3-prototype` was
  promoted to production, since the old `main` had independently picked
  up CNAME handling under the previous `peaceiris/actions-gh-pages`
  deploy mechanism that the newer `deploy-pages` one had no equivalent
  for. Bookshelf has `bookshelf.cabinetofcuriosities.in`; fffx has
  `site_url` configured for `fffx.cabinetofcuriosities.in` but no
  `CNAME` file committed yet (verify DNS is actually live before treating
  fffx links from Cabinet as production).
- Cabinet should link into Bookshelf/fffx, never duplicate their full
  internal structure (their own Level 2/3 data) — see "Local world data
  vs. Cabinet data" above.
- FabAcademy/Fabricademy documentation sites are **not** Level 1 worlds
  in this ecosystem and should not become Cabinet islands — link them
  from About Me or a relevant essay/reflection page instead, if at all.
