# Cabinet of Curiosities — Landing Page Notes

**Superseded, 2026-08-23**: `docs/index.html` is now a static build
produced from `landing-v3/` (the "archipelago-tool" rebuild — see
`documentation/landing-v3-notes/Landing-page-notes.2.0.md` for that system's own full
documentation, `documentation/backend-and-deploy/three-world-launch-phases-ToDo.md`
for how it got promoted). Everything below describes the *previous* (v2)
implementation this file was written for — kept as-is, not rewritten,
because it's genuinely still an accurate record of that version, which is
itself preserved and browsable in `archived-landing-pages/v2/`. Read it
as history, not as a description of what currently serves the live page.

Implementation notes for the map landing page: how it was built, how to
change it safely, and gotchas hit along the way. Visual rules live in
`DESIGN-SYSTEM.md`; the schema conventions shared with Bookshelf/fffx live
in `WORLD-SYSTEMS.md`.

## Rollout strategy actually used

The original build prompt considered a staged preview route
(`docs/cabinet-map-test/index.html`, old homepage kept live at `/` until
manual sign-off). That turned out to be unnecessary: the deploy workflow
(`.github/workflows/deploy.yml`) only fires on push to `main`, so a
feature branch (`cabinet-map-v2`) never touches the live site regardless
of what's in it. What was actually done instead:

1. Tagged `main` as `cabinet-v1-before-map` before starting, as a cheap
   rollback point independent of the branch.
2. Built the new `docs/index.html` directly on `cabinet-map-v2`, archiving
   the old homepage immediately (see below) rather than running both side
   by side.
3. Tested with `mkdocs serve` + a scripted headless-browser pass locally.
4. Left the branch unmerged for visual review before any PR/merge to
   `main`.

## `docs/index.md` / `docs/index.html` collision rule

MkDocs will happily build both `docs/index.md` and `docs/index.html` — but
only one can actually serve `/`, and which one wins is a source of
confusing bugs (this is the same rule documented in Bookshelf's and
fffx's own notes, see `WORLD-SYSTEMS.md`). Cabinet now uses the standalone
`docs/index.html` pattern exclusively:

- `docs/index.md` was deleted (the old content moved to
  `archived-landing-pages/cabinet-index.md.bak`, **outside** `docs/`, so
  MkDocs can't rebuild it as a live page even by accident).
- `nav: - Home: index.md` was removed from `mkdocs.yml` — `index.html`
  doesn't need a nav entry to serve at `/`, same as Bookshelf/fffx.
- `deploy.yml` has a guard step that fails the build if `docs/index.md`
  ever reappears.

## Archive process used

Followed Bookshelf's convention (`archived-landing-pages/*.bak`, top-level,
not under `docs/`) rather than the alternative of an in-`docs/` archive
folder, specifically so MkDocs never builds the archived page as a stray
unlinked URL. `archived-landing-pages/README.md` explains what's there and
points at the `cabinet-v1-before-map` git tag for a full rebuild if ever
needed.

## Data pipeline

```
content/cabinet-sections.tsv  ─┐
content/cabinet-entries.tsv   ─┴─► tools/build-cabinet-content.js ─► docs/assets/js/cabinet-generated-content.js
                                                                          │
docs/assets/js/cabinet-data.js (hand-edited, landing config only) ───────┤
                                                                          ▼
                                                          docs/assets/js/cabinet-render.js
                                                          (renders island link state,
                                                           desktop card layer, mobile
                                                           stack — all from data)
                                                                          │
                                                                          ▼
                                                    docs/assets/js/cabinet-interactions.js
                                                    (hover/focus island↔card linking)
```

`cabinet-generated-content.js` is regenerated, not hand-edited — run
`node tools/build-cabinet-content.js` after any TSV change. The parser
(`tools/build-cabinet-content.js`) follows the same conventions as
Bookshelf's/fffx's generators: `TRUE`/`FALSE`/`WIP` parsed
case-insensitively to `true`/`false`/`"wip"`, `relatedLinks` as
`Label|https://url` pairs joined with `;`, tags joined with `;`. It also
validates that every entry's `section` matches a real section `id` and
fails loudly (not silently) if not.

Island *geometry* (`cx`, `cy`, `rx`, `ry`, `mapForm`, `islandId`) lives as
extra columns on `cabinet-sections.tsv` — a Cabinet-specific extension,
same pattern as fffx's subdivision-`weight` or Bookshelf's `span` living
alongside the shared fields (see `WORLD-SYSTEMS.md`). Entry visual
placement (`placement`, `x`/`y`, `anchor`, `cardOrder`, `size`,
`cardType`, `leaderTo`) is the equivalent extension on
`cabinet-entries.tsv`.

## Map generation pipeline (how the island shapes were made)

Island/coastline shapes are **not** generated at runtime. They were
produced once by `archived-landing-pages/v2/source/generate-cabinet-map.js`
— a small seeded generator (Mulberry32 PRNG → per-island base radius
array, jittered and lightly smoothed for a jagged-but-closed outline →
Catmull-Rom-to-Bézier closed path for the land) — and the resulting `d`
path strings were hand-pasted into `docs/index.html`.
`archived-landing-pages/v2/source/cabinet-map-source.json`
records the seed/center/radius per island so the exact shapes can be
reproduced or revised.

As of v2.1, the three coastline-ripple rings are **not** independently
random blobs — they reuse the land's own base radius array, scaled up
(1.07×/1.15×/1.24×) with a small amount of additional independent jitter
layered on top, so each ring reads as a contour line that actually
follows the land's specific bumps and inlets rather than a generic
concentric ellipse. A `HACHURE` path is also emitted per island: short
perpendicular tick marks sampled around the coast, each with a small
random angle/length wobble, approximating the hand-drawn hachure texture
in old engraved maps.

```
node archived-landing-pages/v2/source/generate-cabinet-map.js
```

prints LAND + three RIPPLE path strings per island plus a few islet
blobs to stdout. To change an island's shape or add a new one: edit the
`islands`/`islets` arrays at the bottom of that script (and mirror the
change into `cabinet-map-source.json`), re-run, and manually replace the
corresponding `<path>` `d` attributes in `docs/index.html`. This is a
deliberate manual step, not an automated build step — island geometry is
edited "editorially," not on every deploy.

### When a section outgrows its island (escalation path)

Prefer, in order, before touching the SVG at all:

1. Move secondary entries from `placement: "land"` to
   `placement: "coast"` (port-cards positioned automatically along an
   edge, not competing for interior space).
2. Mark less-important entries `visibility`-equivalent by giving them
   lower `weight`/`order` rather than removing them, or set `status:
   "wip"`/`false` if they genuinely don't have a page yet.
3. Only if a section has fundamentally outgrown its footprint: resize
   that one island's `rx`/`ry` in `cabinet-map-source.json`, regenerate
   just that island's paths, and re-paste. Don't regenerate the whole
   archipelago for one section.

Full regeneration (new seeds for every island) is reserved for a
deliberate visual refresh or a genuine information-architecture change
(several new top-level sections, sections merging/splitting) — archive
the previous `docs/index.html`'s SVG block into
`archived-landing-pages/v2/source/archive/` first if that ever happens.

## Known gotchas hit while building this

- **`href` safety**: true at the time this was written -- Cabinet had no
  `CNAME` and deployed to a GitHub Pages *project* subpath, not a custom
  domain root. As of 2026-08-23 that's changed (`docs/CNAME` ->
  `cabinetofcuriosities.in`), but the convention this gotcha produced is
  kept regardless: root-absolute hrefs like `/about/` would still
  silently resolve to the wrong host the moment this ever deploys
  anywhere else (a fork, a preview subpath, etc.), even though they work
  fine under `mkdocs serve`'s root-served dev server. Every internal
  link in the TSVs stays path-relative with no leading slash. Cross-repo
  links (Bookshelf, fffx) are legitimately absolute since they're
  different domains.
- **mkdocs livereload breaks `networkidle` waits**: `mkdocs serve` injects
  a persistent SSE connection for auto-reload, so any test/automation
  waiting for network idle will hang. Wait for `load` plus an explicit
  selector instead.
- **Card/label collisions**: cards positioned near an island's own
  center inevitably compete with that island's name label for the same
  space, since both default to the island's centroid. First-pass fix was
  moving each label toward the bottom of its land shape (below the card
  cluster); a few of the widest cards (on Bookshelf, fffx, and
  Interfaces/Data/Texts) still clip part of the label and are flagged as
  a follow-up in the README changelog rather than fixed by further
  guessing at pixel offsets.
- **Card footprint vs. island width**: three "land" cards side by side
  need roughly 3× their own width in clearance; several islands are only
  ~20-30% of the viewBox wide, which is *less* than three cards' combined
  width at the original 9.5%-of-viewBox card size. Cards were shrunk to
  6.5%/5% (medium/small) and staggered in both x *and* y (not spread
  along one row) to fit. Worth remembering before adding a 4th+ land card
  to a mid-sized island — check for overlap rather than assuming it'll
  fit.
- **SVG hit-testing and `fill: none`**: the coastline ripple rings are
  unfilled strokes: hovering the empty space "inside" a ripple ring but
  outside the solid land shape does not trigger the parent `<a>`'s
  hover/focus state, because a `fill: none` path only receives pointer
  events on its stroke, not its interior. Not worked around (it's a
  reasonable reading of "the ripples are decorative water lines, the
  land is the clickable island"), but worth knowing if hover feels
  inconsistent near a coastline.

## Validation checklist (used for this pass)

- [x] `mkdocs build` succeeds with no new warnings/errors beyond
      pre-existing ones (`trippyGourmet.md`/`fffx/fffx.md` not in nav,
      `fffx/formFollowsFx.md` nav target missing — all pre-existing, not
      introduced by this branch).
- [x] `mkdocs serve` renders the map; a scripted Playwright pass confirmed
      7 islands, 25 cards, zero console errors, correct wip/no-href
      handling, working hover-linking in both directions (island→cards
      and card→island), and the mobile stacked fallback swapping in
      below 760px.
- [x] No `docs/index.md` left in the repo; `deploy.yml` guards against it
      returning.
- [ ] Visual review of card/label overlap on Bookshelf/fffx/Interfaces
      islands (see README changelog "known follow-ups").
- [ ] Real thumbnails for entries currently on generated placeholder
      tiles (e.g. Circle Packing Library has one available in the fffx
      repo, just not copied over yet).
