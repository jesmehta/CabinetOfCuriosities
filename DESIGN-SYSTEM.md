# Cabinet of Curiosities — Design System

Visual rules for the map landing page (`docs/index.html` +
`docs/assets/css/cabinet-landing.css`) and how they extend into normal
MkDocs Material content pages (`docs/stylesheets/cabinet-material.css`).
For layout/data plumbing rather than visual rules, see
`LANDING-PAGE-NOTES.md`.

## Metaphor and role

Cabinet is the home-world and orientation map for Jesal's other worlds
(Bookshelf, fffx) and his own sections (Teaching, Visual Field Notes,
Machines & Makings, Interfaces/Data/Texts, About). It should read as a
**refined antique atlas plate adapted for a website** — not a fantasy
game board, not a conventional portfolio grid.

- **Tone**: exploratory, warm, cartographic, strange-but-readable.
- **Avoid**: pirate cliché, fantasy-game UI chrome, generic portfolio
  cards, illegible parchment kitsch, novelty-shaped islands (no
  book-shaped or gear-shaped silhouettes — every island uses the same
  organic-blob coastline language), cheesy ocean/sea names.

## Palette tokens

All raw values live in `docs/assets/css/cabinet-tokens.css` as `--cab-*`
custom properties — treat that file as the single source of truth, this
is a reference:

| Token | Value | Use |
|---|---|---|
| `--cab-paper` | `#ead9b8` | Sea/page background |
| `--cab-paper-deep` | `#c9ad7b` | Page backdrop behind the map shell |
| `--cab-ink` | `#2e2418` | Primary text, strokes |
| `--cab-ink-soft` | `#6d5a3f` | Secondary text, subtitles |
| `--cab-ink-faint` | `rgba(46,36,24,.45)` | Ripple lines, route lines |
| `--cab-land` / `--cab-land-light` | `#c8b178` / `#dccb9a` | Island fill (wip / active) |
| `--cab-card-bg` / `--cab-card-bg-wip` | `rgba(238,222,184,.95)` / `rgba(210,197,165,.75)` | Card backgrounds |
| `--cab-accent` | `#7a4b2a` | Hover ink, active route highlight |
| `--cab-focus-ring` | `#1c5f6b` | Keyboard focus outline (deliberately a cool teal, not the warm palette, so it never reads as decorative ink) |

## Typography

Georgia / Times New Roman serif throughout (`--cab-font-heading` /
`--cab-font-body` — currently identical; kept as two tokens in case they
diverge later). Island names and the cartouche title use small-caps.
Card subtitles and "coming soon" badges are smaller and italic/muted.

## Island anatomy

Every island is: an outer `.island-land` fill+stroke path, three nested
`.coast-ripples` rings drawn *outside* the land edge (largest first, so
land paints on top), optionally a couple of `.islet` satellite blobs, one
or two `<use>` `.building` marks, and one `.island-label-title` text.
All island shapes come from one seeded generator
(`assets/map/source/generate-cabinet-map.js`) so every island shares the
same organic-blob "handwriting" regardless of size — see
`LANDING-PAGE-NOTES.md` for the generation pipeline.

Islands are wrapped in `<a class="island-link" data-section="…">`.
Sections with no real destination yet (`status: "wip"` and no `href`)
render with the `href` attribute removed entirely rather than pointing
at `#` — an `<a>` with no `href` is not a fake link, it's simply inert
(not focusable, no pointer cursor), which is the correct semantics for
"this doesn't exist yet" rather than a broken promise.

## Card anatomy

Three `cardType` values, sharing one base `.map-card` (thumbnail or
placeholder tile + title + subtitle-on-hover/focus):

- **`thumbnail-plaque`** (`placement: "land"`) — square corners, sits
  directly on the island at an authored `x`/`y` (percent of the 1600×1000
  viewBox).
- **`port-card`** (`placement: "coast"`) — rounded bottom-heavy shape,
  positioned automatically outside the island's edge along a compass
  `anchor` (`north`/`south`/`east`/`west`), stacked by `order` when more
  than one shares an anchor. Used for secondary entries so the island
  interior doesn't get crowded — see `LANDING-PAGE-NOTES.md`'s escalation
  path for when to prefer coast over land.
- **`callout-card`** (`placement: "external"`) — dashed border, for a
  future leader-line-connected card sitting off the island entirely
  (`leaderTo`). Supported in the renderer; no current entry uses it.

Entries with no real thumbnail render a generated placeholder: a
diagonal-hatch tile with the entry's first letter, produced purely in CSS
(`.card-thumb-placeholder`, see `cabinet-render.js`'s `makeThumb`) — never
a broken `<img>`.

`status: "wip"` entries render as a non-navigating `<span>` (not an
`<a>`), muted background, italic text, and a small "Coming soon" badge —
the same "don't fake a link" rule as wip islands.

## Interaction

- Hovering **or focusing** an island highlights its own entry cards
  (`.is-related`) and any route line connecting to it; hovering/focusing
  a card does the same in reverse. This is symmetric and keyboard-
  reachable — nothing is hover-only.
- Card subtitles appear on hover *and* `:focus-visible`, never hover
  alone.
- Hover/lift transitions are short (`--cab-transition-fast`, 180ms) and
  respect `prefers-reduced-motion` (all transitions collapse to ~0 under
  that media query).
- Keyboard focus uses a dedicated ring color (`--cab-focus-ring`) on both
  island land shapes and cards, distinct from the hover-ink color, so
  focus is never mistaken for decoration.

## Mobile fallback

Below 760px the SVG map (`.map-shell`) is hidden via CSS and a stacked
list (`.map-stack`) takes over — same sections in the same order, same
entries, same links, same wip/coming-soon treatment, just no map
geometry. Both structures are always rendered by `cabinet-render.js`;
CSS `display: none` is what actually switches between them (and removes
the hidden one from the accessibility tree), so there's exactly one
navigable copy of the page at any given viewport width, never two
competing tab orders.

## Relationship to MkDocs Material pages

Normal content pages (About, Makings, 3DP, Wild Wild Web, the legacy fffx
pages) keep Material's chrome (header, sidebar, search) but pick up the
Cabinet palette via `docs/stylesheets/cabinet-material.css`, which maps
`--cab-*` tokens onto Material's `--md-*` variables. The map landing page
itself never uses Material at all — see "Homepage rule" in
`WORLD-SYSTEMS.md`.
