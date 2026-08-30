# Cabinet / Bookshelf / FFFX -- Launch Phases To-Do

## Table of contents

- [Immediate priorities (2026-08-30)](#immediate-priorities-2026-08-30)
- [Launch milestones](#launch-milestones)
- [Phase 0 -- v3-prototype punch list](#phase-0----v3-prototype-punch-list)
  - [Punch list (sea serpent through colophon)](#punch-list-sea-serpent-through-colophon)
  - [Found via documentation survey (v3.6.6 doc audit)](#found-via-documentation-survey-v366-doc-audit)
  - [Additional ideas -- visual/theme work extras (optional, not launch-critical)](#additional-ideas----visualtheme-work-extras-optional-not-launch-critical)
- [Phase 1 -- Go for Launch](#phase-1----go-for-launch)
  - [Cabinet](#cabinet)
  - [Branch / production transition](#branch--production-transition)
  - [Bookshelf + FFFX](#bookshelf--fffx)
  - [Cross-world launch checks](#cross-world-launch-checks)
- [Phase 2 -- Immediately After Launch](#phase-2----immediately-after-launch)
- [Phase 3A -- Short-Term / Already Underway](#phase-3a----short-term--already-underway)
- [Phase 3B+ -- Long-Term Development](#phase-3b----long-term-development)
- [Content Inventory -- Pages, Entries & Their Statuses](#content-inventory----pages-entries--their-statuses)

Live checklist. Check items off as they land; don't renumber or reorder
on completion -- history matters more than a tidy list. Companion files:

Phase 0's punch list and Phase 1 (2026-08-23) carry a stable `**#N**`
tag right after each item's checkbox, so items can be referred to by
number ("#12") instead of by description -- one continuous sequence
across both (Phase 0: #1-33 plus #60-64 added later, Phase 1: #34-59),
not restarting per phase. Assigned once, in the order items appeared at
the time -- a NEW
item added later gets the next unused number appended wherever it's
inserted in the list, it does NOT trigger a renumber of anything else,
same "history matters" reasoning as the no-renumbering rule above.
Phase 2/3A/3B+ were numbered later too (2026-08-24, #74-#123 so far),
so the whole file now uses one continuous sequence, not just Phase 0/1.

Done items (`- [x]`) are individually wrapped in `<details><summary>#N</summary>`
so the list stays scannable -- collapsed by default, showing just the
number; click to expand the full explanation. Only top-level items are
wrapped this way, not nested sub-items (e.g. `#35`/`#36` under `#34`).
A blank line always surrounds every `<details>`/`</details>` tag on both
sides -- CommonMark needs that to close an HTML block cleanly; skipping
it merges adjacent blocks into one raw-HTML region and breaks backtick
code spans elsewhere (this happened once, 2026-08-24, fixed). This only
renders as collapsible on GitHub/most markdown previews -- in a plain
text editor the tags just sit there uncollapsed.

- `Landing-page-notes.2.0.md` (parent directory) -- v3-prototype concept
  notes, discussions, and full changelog. This file's Phase 0 used to
  live there as the "punch list"; moved out here because it had outgrown
  that doc's format.
- `three-world-launch-phases-Notes.md` (same directory) -- the
  rationale/architecture behind Phase 1-3 below: deployment mechanism
  diagrams, branch-transition reasoning, failure-behaviour design, TSV
  editor spec. Read that alongside this file, not instead of it.
- `conversation-landing-page-v3.md` (parent directory) -- narrative
  design discussion behind the Phase 0 decisions.

Originally this file was two things smashed together (an original
`three-world-launch-phases.md`, later expanded into
`three-world-launch-phases-v2.md`, both now retired -- their content is
split between this file and `three-world-launch-phases-Notes.md`) plus
the Landing-page-notes punch list. Split 2026-08-23 at the user's
request.

---

## Immediate priorities (2026-08-30)

A working set, not a new phase -- pointers into the numbered items above
by priority, set directly by the user after a full documentation review.
Doesn't replace the phase structure; items keep their original numbers
and phase placement, this is just the current ordering of attention.

1. **`#32`** (Rework "Copy config") -- top priority. Direct reasoning: it's
   currently a bottleneck to smooth updates of the site's look and feel,
   and the mechanism itself is "not a stable state" right now. Still
   needs the (a)-minimal-vs-(b)-bigger decision described in the item
   itself before building anything.
2. **The deployment manifesto** -- `#58` (confirm failed builds don't
   replace the last successful live deployment) + `#80` (expand Cabinet
   assembly beyond Working with AI: Student Work, Rock Collection,
   Dupatta Collection, etc.) + `#82` (generalize assembly into a
   manifest-driven workflow instead of hard-coded per-repo steps),
   grouped as one initiative -- direct request, 2026-08-30. `#82`'s
   manifest is naturally what makes `#80`'s expansion cheap instead of
   more copy-pasted workflow steps, and `#58` is the safety property that
   initiative needs to actually hold once more repos depend on it.
3. **`#81`** (Build TSV editors for Cabinet, Bookshelf, FFFX) -- ongoing.
   Cabinet's own editor is already substantially built (see
   `documentation/cabinet-editor/CABINET-EDITOR.md`, v1.0-v1.5); direct note,
   2026-08-30: "will be easier to port for the other two" once Cabinet's
   own is settled.
4. ~~**`#70`**~~ (section/island labels: SVG `<text>` vs. semantic HTML,
   SEO/accessibility implications) -- prioritized for a real decision,
   2026-08-30: "for better semantic organisation." **Done, 2026-08-30** --
   see the item itself for the shipped approach (real hidden `h2`/`h3`
   headings, generated alongside the SVG map) and its caveats.
5. **`#126`** (split up this ToDo file / documentation coherently) --
   direct note, 2026-08-30: "also an easy task."

Backburner, deliberately not urgent -- direct instruction, 2026-08-30:

- **`#66`/`#42`** (About Me real content) -- low priority, to be written
  opportunistically alongside other work rather than blocked on.
- **`#37`/`#39`** (map label overflow, desktop/mobile QA) -- backburner
  for now.

## Launch milestones

Two-stage scheme, decided 2026-08-30 (resolving `#59`): the site has
been live at `cabinetofcuriosities.in` since the `landing-v3-prototype`
merge, but that's not the same thing as "launched" -- the about page,
colophon's real writing, and a few other essentials are still open.

- **`launch-beta`** (annotated git tag, created 2026-08-30, pointing at
  `7f3a638` -- the actual 2026-08-23 merge-to-main commit): v3 is live
  and functional, not yet feature-complete, links not yet publicly
  shared.
- **`launched`** (not yet applied): once BOTH Phase 0-2 are done or
  largely done AND the user actually starts publicly distributing the
  site's links. Deliberately gated on a real-world action, not a
  checklist percentage -- don't auto-apply this off item counts alone,
  confirm with the user first.

---

## Phase 0 -- v3-prototype punch list

Pre-launch prototype work: `islands-tool.html` / `cabinet-v3-*.js`
feature and visual-polish items. Not prioritized or sequenced -- pick
freely.

### Punch list (sea serpent through colophon)

<details>
<summary>#1</summary>

- [x] **#1** Sea-serpent redesign -- **done, v3.6.24**: the blocker was the
      reference itself, resolved by the user supplying one directly
      (`dragon.svg`) rather than a hand-drawn sketch. 1-3 independent
      sea-dragon wanderers, noise-driven movement, coastal avoidance,
      event-triggered dive/resurface. The arc-based v1 attempt
      (`cabinet-v3-seaserpent.js` / `_test-serpent.html`) stays
      untracked, unused, not deleted -- superseded, not merged into
      this.

</details>

- [ ] **#2** Water wave-line texture -- on hold pending a reference image (v2's
      own wavelines weren't visible/legible as a reference on their
      own).

<details>
<summary>#3</summary>

- [x] **#3** Boats sailing in smooth flows (not randomly moving) -- the
      original attempt was reverted after an unresolved Chromium
      `<use>`/`<symbol>` rendering bug. **Done, v3.6.17-v3.6.21**, via a
      different mechanism that sidesteps that bug entirely: plain
      `<ellipse>`+`<line>` particles (no `<use>`/`<symbol>`), advected
      along the flow field below. See next item.

</details>

<details>
<summary>#4</summary>

- [x] **#4** Flowfield stretch goal -- a precomputed noise/flow field with
      live, cheap particle advection along it (waves, boats),
      obstacles/repulsion around islands, optionally mouse-reactive.
      **Done, v3.6.16-v3.6.21** (`islands-tool.html` only --
      `cabinet-v3-flowfield.js` + `cabinet-v3-particles.js`): curl-noise
      current + island-avoidance field, particle pool with off-canvas
      spawn/recycle, a fix for curl noise's structural permanent-vortex
      trapping via time-drift, a separate fix for the SAME structural
      property on the static coastal-tangent half of the field causing
      narrow-channel/bay trapping via a bounded oscillating drift, a
      prevailing SW-NE current direction with local variation preserved,
      and a HARD land-crossing backstop independent of the field's own
      soft push. Mouse-reactive is done too, just not the originally-
      scoped idea: click-to-launch adds a boat at the clicked point
      rather than perturbing the field itself, capped at 1.5x the base
      particle count. **Not yet in the production static build** -- see
      Phase 1's "finish or consciously defer flowfield particles".

</details>

<details>
<summary>#5</summary>

- [x] **#5** islands-tool idea: a control to re-roll/regenerate the circle
      centres and packing stage itself -- done, v3.6.8: "Reroll
      positions" button, Layout section.

</details>

<details>
<summary>#6</summary>

- [x] **#6** islands-tool idea: switch or layer between the wave contours, the
      topology noise contour bands, or both -- **tier 1 done** (v3.6.8's
      three preset buttons, replaced in v3.6.9 by two independent
      checkboxes in the Visuals section -- Wave contours / Colour bands
      -- which cover the same three combinations plus a fourth the
      buttons couldn't reach). **Tier 2 also done, v3.6.14-v3.6.15 +
      v3.6.28**: nine whole look-and-feel presets now exist beyond the
      original medieval/satellite draft pair (medieval-map, bathymetric,
      riso, cyanotype, neon, ukiyo, medieRiso), each its own colour token
      set + type pairing, switched live via the Theme select -- see
      `v3-scheme-candidates.md`.

</details>

<details>
<summary>#7</summary>

- [x] **#7** islands-tool idea: give the topology noise contour bands
      (`seaBandThresholds`/`sandThresholds`/`vegThresholds`) their own
      panel section -- done, v3.6.9: "Topological offset parameters" in
      the Visuals section, one slider per array element.

</details>

<details>
<summary>#8</summary>

- [x] **#8** Strengthen centroid gathering further -- push `centerBias` harder
      if islands should cluster tighter still -- **counted done**: a
      live slider exists (v3.6.8, Layout section) so this is now a
      direct try-values-and-judge action, not something blocked on more
      code.

</details>

- [ ] **#9** Give sections a minimum weight so small sections (About Me, etc.)
      don't read as visually skewed/collapsed -- **investigated
      (v3.6.10), confirmed insufficient as-is.**
      `v3Config.canvas.minSectionWeight` (v3.4) floors a section's AREA
      for treemap allocation, but does nothing about its ASPECT RATIO --
      measured directly against real content: `about` still squarifies
      to a 92x488px region (aspect 0.19, a genuine sliver), because
      `squarify()` optimizes each ROW's aggregate squareness, not any
      one item's own shape. A real fix needs an aspect-ratio-aware
      constraint back in `squarify()` -- not something to build without
      discussing scope first.

<details>
<summary>#10</summary>

- [x] **#10** A real pass on fonts, colours, sizes, and readability --
      **done, v3.6.12-v3.6.13** (header type/size, section-label size,
      island-label legibility, live-switchable) **-- marked fully done
      per direct confirmation, 2026-08-23.** The map's overall colour
      scheme itself (sea/sand/veg band hues, ink tones) is still the
      original first-guess palette from v3.6.5, technically untouched --
      noted here rather than silently dropped, but no longer blocking
      this item.

</details>

- [ ] **#11** Other small details -- compass rose, easter eggs, etc. --
      **partially done, 2026-08-23**: the compass rose itself is real,
      themed, and functional (see the v3.7.1-v3.7.8 changelog entries).
      The "easter eggs" half is still open -- see #21 below, the one
      concrete easter-egg idea currently on record.

<details>
<summary>#12</summary>

- [x] **#12** Expand the canvas to full-bleed window size -- **done, v3.6.10.**
      Adapts to the viewport ONCE at load, not on a live drag-resize
      afterward.

</details>

<details>
<summary>#13</summary>

- [x] **#13** Fold the "Cabinet of Curiosities" heading + intro text into the
      map itself -- **done, v3.6.10, reverted v3.6.12.** v3.6.12 put it
      back in a normal top-of-page row instead (real `<h1>`/`<p>`
      matters for crawlers/screen readers in a way JS-drawn SVG text
      doesn't). Still real, unchanged HTML either way.

</details>

<details>
<summary>#14</summary>

- [x] **#14** Refine the header itself -- **done, v3.6.12**: title/tagline
      wording, typography/look-and-feel (larger H1, sits directly on the
      full-bleed sea colour instead of a card), position (top row).
      H1-scale-mismatch sub-question moved to the next item, unresolved.

</details>

- [ ] **#15** Still open: resizing the window scales the map's own text via the
      SVG viewBox, but the real HTML `<h1>`/tagline don't scale with it,
      since they sit outside the SVG entirely. Undecided which of three
      options to take: scale it with the map, clamp its size within a
      range, or leave it fixed as-is (current behaviour, by default
      rather than decision).

<details>
<summary>#60</summary>

- [x] **#60** The `<h1>` ("Cabinet of Curiosities") should sit on a fixed
      frame that stays visible always; the map itself should be the part
      that scrolls, rolling underneath that fixed frame as it grows with
      more entries. Direct request, 2026-08-23. Related to #15 (both are
      about how the real HTML header interacts with the SVG map below
      it) but a distinct ask -- #15 is about text scaling, this is about
      scroll/fixed-position behaviour as content grows. **Done, v3.7.48**:
      `.v3-header` is `position: sticky; top: 0` with an opaque white
      background -- pure CSS, no JS, since sticky doesn't remove an
      element from document flow (`resolveCanvasDimensions()`'s
      measurement of `.v3-stage-wrap` is unaffected). Giving the header
      an explicit background surfaced a real latent bug in the process:
      `.v3-header h1`/`.v3-subtitle`/`.v3-footnote` all defaulted to
      `--cab-land-light` (a light cream token), "sized for the dark-sea
      themes" per a stale comment that assumed the header sat on a dark
      sea-coloured backdrop -- it never actually did once v3.6.12 put it
      back in normal document flow, it's sat on plain (implicit) white
      the whole time. medieval-map's version of this was bad enough to
      get reported and fixed already (v3.7.23, near-invisible cream-on-
      cream); every OTHER theme had the same bug, just less severely
      (pale-on-white, readable but low-contrast) -- not noticed until
      #21 (below) made it possible to actually view another theme on the
      production page. Fixed by defaulting all three to `--v3-ink`
      (already dark and theme-correct everywhere, it's the map's own
      text-ink token) instead of carrying a medieval-only override.
      **v3.7.49 follow-up, direct feedback**: `max-width: 640px` dropped
      so the sticky bar spans the full page width instead of just its
      left ~640px, leaving room for possible right-corner content later
      ("i may add some text on the right corner later, maybe" -- not
      built, just left room for it).

</details>

<details>
<summary>#16</summary>

- [x] **#16** Idea: the compass rose (or similar map ornamentation) could BE the
      About Me / Contact Me links, rather than those existing as regular
      islands -- see the doc-audit item below (WORLD-SYSTEMS.md's
      FabAcademy-is-not-a-world rule) for a directly relevant constraint
      on what About Me should even link to. **Marked done per direct
      confirmation, 2026-08-23** -- the compass rose's own direction
      labels are the real link targets now (`kind: compass-direction`
      entries in `content/cabinet-entries.tsv`; see #24 below for the
      commit that moved the old CV entry onto this same mechanism).

</details>

<details>
<summary>#17</summary>

- [x] **#17** Merge branches -- **superseded by Phase 1's "Promote
      landing-v3-prototype into the production Cabinet structure" and
      the Branch/production transition checklist below -- marked done
      here, tracked there instead.**

</details>

<details>
<summary>#18</summary>

- [x] **#18** Create a history section and place archival pages there --
      `archived-landing-pages/` already exists as a filesystem
      convention; this is about giving it a real, linked home on the
      site itself, not just a folder. **Narrowed to archive creation
      itself and marked done, 2026-08-23** (the "real, linked home on
      the site" half is real work still, split out as #61 below rather
      than kept as an open caveat on this one): `archived-landing-pages/`
      now has its own `index.html` landing page linking two fully-built,
      browsable archives -- `v1/` (the original MkDocs site, built from
      the now-real `cabinet-v1-before-map` tag) and `v2/` (the
      archipelago-map stub that briefly replaced it, copied standalone
      with its real CSS/JS dependency chain, including a second
      missed script (`cabinet-interactions.js`) that was the actual
      cause of a "graphics but no text labels" report, so it still
      renders in full). `v2-history/` also holds the map's four earlier
      visual eras (`c384a11` through `a3887b0`), each rebuilt standalone
      from git history, for anyone who wants to see how it got there.

</details>

<details>
<summary>#61</summary>

- [x] **#61** Link `archived-landing-pages/` from the live site's own
      navigation -- split out from #18 above, which now only covers
      building the archive itself. Deliberately deferred until #40
      (promoting `landing-v3` into production) settles deploy structure,
      since the current `docs/`-only `mkdocs build --site-dir public`
      deploy wouldn't even package `archived-landing-pages/` as-is (it
      lives outside `docs_dir`) regardless of how it's linked. **Done,
      v3.7.54, 2026-08-24**: resolved together with #20 and #62 below --
      `deploy.yml` gained a "Copy archived landing pages" step (`cp -r
      archived-landing-pages public/archived-landing-pages`, after the
      mkdocs build, same pattern as #43's Working with AI assembly just
      above it), so it's finally part of the deployed site at all; the
      new `docs/colophon.md` page links straight to `v1/`/`v2/` from
      there, and the compass's own S/Colophon direction (`content/
      cabinet-entries.tsv`'s `compass-s` row, previously blank) now
      points to it. Verified end to end with Playwright against the
      full assembled output tree: colophon page renders with the right
      nav placement, both archive links resolve to real archived
      content (correct titles, zero failed requests, zero console
      errors) -- not just checked in isolation.

</details>

<details>
<summary>#20</summary>

- [x] **#20** Write the colophon and creation notes. **Scaffolding done,
      v3.7.54, 2026-08-24** -- `docs/colophon.md` exists, is in
      `mkdocs.yml`'s nav, and is reachable from the compass's S
      direction, but is a deliberate placeholder ("Writing on how this
      site is made -- coming soon") plus the two archive links, direct
      request: "make a dummy colophon page... I'll add the writing
      later." Marking done at the scaffolding level since that's what
      was actually asked for this round; the real writing itself is
      still open, just no longer blocked on any plumbing.

</details>

<details>
<summary>#19</summary>

- [x] **#19** Launch the page -- **superseded by Phase 1 below -- but also
      genuinely done now, 2026-08-23**: cabinetofcuriosities.in is live
      on v3 (#40/#45/#47-50), not just tracked elsewhere.


</details>

### Found via documentation survey (v3.6.6 doc audit)

Surfaced by reading `LANDING-PAGE-NOTES.md` (top-level, v2/production),
`README.md`, `DESIGN-SYSTEM.md`, `WORLD-SYSTEMS.md`, and the sibling
`TheBookshelfOfCuriosities` repo. Mostly production-page (not
v3-prototype) items, kept here since they're real open items on the same
overall site.

- [ ] **#22** Card/label overlap on Bookshelf, fffx, and Interfaces/Data/Texts
      islands -- the widest cards clip the island name label.
- [ ] **#23** Real thumbnails owed for entries still on generated placeholder
      tiles -- e.g. Circle Packing Library already has one sitting in
      the fffx repo, just never copied over.

<details>
<summary>#24</summary>

- [x] **#24** CV entry's "scroll" icon reads ambiguous at card size. --
      **superseded, marked done, 2026-08-23**: the `cv` entry itself
      (`cardType: thumbnail-plaque`, `icon: icon-scroll`) was deleted in
      commit `1f1b9a5` ("v3.7.1: compass rose replaces About Me in the
      content pipeline") and replaced by `compass-w` -- `kind:
      compass-direction`, no icon/cardType/thumbnail at all, rendered as
      a plain text label on the compass rose, not a card (see #16
      above). No entry anywhere in `content/cabinet-entries.tsv` uses
      `icon-scroll` any more -- confirmed by scanning the full `icon`
      column. "Ambiguous at card size" is moot: there's no card left to
      be ambiguous. The `<symbol id="icon-scroll">` sprite still sits
      unreferenced in `docs/index.html`, harmless dead weight, not worth
      a separate cleanup item on its own.

</details>

<details>
<summary>#25</summary>

- [x] **#25** Verify fffx's DNS/CNAME is actually live before treating fffx
      links from Cabinet as production (no committed `CNAME` confirmed
      as of the v2.1 follow-up that raised this). -- **done, confirmed
      live, 2026-08-24**: `fffx.cabinetofcuriosities.in` fetched
      directly, 200, served by GitHub Pages, real title ("Form follows
      f(x)"), not a placeholder.

</details>

<details>
<summary>#26</summary>

- [x] **#26** `DESIGN-SYSTEM.md`'s `callout-card` layout (external placement,
      dashed border, leader-line to a card sitting off the island
      entirely) is fully built and supported by the renderer but no
      entry currently uses it -- available for future content that needs
      it. **Checked, 2026-08-23: NOT a v1/superseded artifact, still a
      live discrepancy.** `DESIGN-SYSTEM.md` describes the CURRENT
      renderer (`docs/index.html`/`cabinet-render.js`/
      `cabinet-landing.css`), not an old system -- but the description
      itself overclaims: `cabinet-render.js`'s `placement === "external"`
      handling only sets `x`/`y` position, no leader-line drawing exists
      anywhere in the codebase (`leaderTo` returns zero matches), and
      `cabinet-landing.css` has an explicit comment that card-type is "a
      content classification... not a shape variant -- every card reads
      as the same plaque" today. So "no entry uses it" is true, but
      "fully built and supported by the renderer" isn't -- only bare
      positioning exists, not the dashed-border/leader-line treatment
      the doc describes. Real open decision, not busywork: either build
      the missing visual treatment, or correct `DESIGN-SYSTEM.md`'s
      claim to match what actually exists.
      **Closed as moot, 2026-08-30, direct confirmation: "The callout
      card layout and leaderTo lines are defunct."** Overtaken by events
      on both sides of the 2026-08-23 discrepancy: `cabinet-render.js`
      and `cabinet-landing.css` (the renderer this item was about) were
      themselves deleted as confirmed-dead v1/v2 code in `#130`, and
      `DESIGN-SYSTEM.md` was archived to
      `archived-landing-pages/v2/DESIGN-SYSTEM.md` (Superseded banner) in
      `#131` -- there is no longer a live renderer or a live doc for this
      item to be a discrepancy BETWEEN. `placement`/`x`/`y`/`cardOrder`/
      `size`/`cardType`/`leaderTo` are now also gone from the schema
      itself, not just unread by the renderer -- deleted from
      `ENTRIES_COLS`, `build-cabinet-content.js`, and the real
      `content/cabinet-entries.tsv` data during the Cabinet TSV editor
      work (`#81`, `documentation/cabinet-editor/CABINET-EDITOR.md` v1.1-v1.2). Direct
      framing, 2026-08-30, worth preserving since it's easy to
      conflate the two: **"The callout card layout and leaderTo lines
      are defunct. The concept of having a finer level of entries on the
      existing map is not"** -- i.e. the specific v2-era mechanism
      (external placement + dashed leader-line) is dead for good, but
      the broader idea it was one implementation of (islands having a
      second, finer tier of entries -- e.g. on the coast, distinct from
      the section-level plaques that exist today) is a real live idea,
      just not designed yet -- see `#137` below, logged separately so it
      doesn't stay tangled up with a mechanism that's actually gone.
      Also: `DESIGN-SYSTEM.md` itself is not to be treated as a current
      source of truth even where it hasn't been formally superseded --
      direct note, 2026-08-30: "the docu is also not the final source of
      truth, the page has evolved greatly since then" -- matches how
      `archived-landing-pages/`'s other frozen docs are already treated
      (historical record, not rewritten, not authoritative).

</details>

<details>
<summary>#27</summary>

- [x] **#27** `WORLD-SYSTEMS.md` standing rule: FabAcademy/Fabricademy
      documentation sites are NOT Level-1 worlds and should not become
      Cabinet islands -- link them from About Me or a relevant
      essay/reflection page instead, if at all. Bears directly on the
      compass-rose/About-Me idea above and on the history-section item
      above. **Resolved, 2026-08-24**: direct intercession -- Fab/
      Fabricademy stay out of the world tier (bookshelf/fffx), but a new
      **Fab** *section* (`#123`) is fine and doesn't violate the rule --
      the standing rule was specifically about the world/Level-1 tier,
      not sections in general.

</details>

<details>
<summary>#33</summary>

- [x] **#33** Update `index.html` to match current development -- the shipped
      static build needs to reflect everything landed on
      `islands-tool.html`/the dev panel. **Done, re-confirmed
      2026-08-23** -- `42c5734` covered v3.7.23-v3.7.30; twelve more
      commits landed after it (the whole theme x hover mechanism,
      band-width sliders, panel reorg, debug-overlay resolution bump,
      v3.7.32-v3.7.44) before `index.html` was regenerated again to
      match, `ae36f4e build: regenerate index.html for v3.7.32-v3.7.44`.
      Re-run `node build-static.mjs` from `landing-v3/` whenever code
      lands ahead of it again.


</details>

### Additional ideas -- visual/theme work extras (optional, not launch-critical)

Session additions (2026-08-23), moved here from wherever they first
landed -- not required for launch, not from the original v3.6.6 doc
audit either, but closely related to/stemming from the visual and
theme work above rather than the Phase 1 launch work below. Numbers
carried over unchanged from wherever each item started (see this file's
own numbering note near the top) -- a move, not a re-add.

<details>
<summary>#21</summary>

- [x] **#21** Easter egg: clicking within the compass rose's inner circle
      switches the WHOLE canvas's theme, Medieval <-> Topology, and back
      on a second click. Direct request: "Its too nice a piece of work to
      be seen only in bits." Depends on the theme x hover feature (now
      built, v3.7.32-v3.7.44 above) enough to make sense built after it,
      not before -- same two themes, same colour data, just a
      click-triggered whole-canvas swap instead of a hover-scoped local
      one. **Done, v3.7.48-v3.7.50.** First pass (v3.7.48) only flipped
      `document.body.dataset.theme`, which changes CSS colour tokens but
      not structure -- direct testing feedback: **"it shows topology as
      a flat version... topo bands are missing, etc."** True cause: wave
      rings/coastal bands/flat-vs-shaded rendering come from
      `v3Config.island.flatColourMode`/`showWaveRings`/
      `showCoastalBands`/`seaShadowStyle`, baked into the static SVG once
      at build time under Medieval's own settings. v3.7.49's own
      analysis proposed three costly rebuild options (accept a colour-
      only swap; double the static payload to bake both themes'
      structure; a partial client-side re-render) without checking
      whether the structure might already exist somewhere on the page --
      corrected by direct, sharp feedback: **"The Hover ALREADY HAS all
      of TOPOLOGY built in!! You just have to do the hover equivalent of
      the entire canvas... I dont see why you keep wanting a new big
      bang every time an asteroid has to change orbit."** Right: the
      theme x hover feature (v3.7.32-v3.7.44) already builds a FULL,
      independently-traced Topology render for every single island and
      section -- real directional shadow, real band tracing, real
      coastline (`v3Config.themePreview.previewTheme` is hardcoded
      `"satellite"`) -- just scoped to reveal on a per-element `:hover`
      instead of canvas-wide. **v3.7.50's first attempt at this (globally
      revealing the theme-preview layers via CSS) was itself wrong**,
      caught by testing the very next round: **"neightbourig islands,
      esp non-entry ones, and the sectional boundaries, are being
      occluded. Dont render individual islands. Maybe have a full
      topology also built alongside the per island and per section
      builds."** The theme-preview mechanism builds each island's
      preview in ISOLATION (its own circle data only, with a generous
      halo meant to blend into open water around exactly ONE hovered
      island) -- correct for one island hovered at a time, wrong once
      every island's isolated halo is revealed simultaneously and starts
      bleeding across nearby fillers (which never got a preview built at
      all -- only `c.kind === "entry"` does) and the dashed section
      boundaries. **v3.7.51, the actual fix**: a new function,
      `drawTopologyStructuralLayer()`, builds Topology's bands and
      directional shadow the same way `drawIslandsPath()` already builds
      Medieval's -- ONE shared heightmap across every island together,
      reusing `islandTrace`'s already-computed geometry rather than
      rebuilding it per-island, correct for fillers and section
      boundaries by construction because it IS the real map's own
      geometry, just retraced at Topology's levels. Scope stayed narrow:
      only bands + directional shadow needed building (the two things
      Medieval's own build never produces), since wave rings/coastal
      bands stay off for Topology either way and v3.7.50's "hide
      Medieval effects" CSS already covers those (kept, minus
      `.v3-sea-shadow-taper` -- that class now belongs to the new
      function's real content, not a dead Medieval-effects target).
      Reuses the real (non-preview) band/shadow class names directly, so
      no new colour rules were needed either. Static payload grew from
      ~4.7MB to ~6.2MB (roughly +33%, not the ~2x a full second render
      would have cost) since only the missing structural layer was
      added, not a duplicate of everything. Verified visually
      (Playwright, both directions, same crop as the bug report): real
      textured/shaded islands, directional drop-shadows, zero wave
      rings, section boundaries and filler islands fully intact, clean
      round-trip back to Medieval. Same "check what already exists
      before reaching for a rebuild" lesson as the boats/dragons cost
      correction (`#64`) -- caught by the user both times now, not
      self-corrected.
      In-topology hover preview (hovering an island while already
      swapped to Topology should preview Medieval, currently still shows
      Topology's own now-redundant preview) stays unfixed, per direct
      confirmation this is secondary and can wait.
      **Also fixed in the same pass**: the ~10px page-jump on swap
      (`.v3-header h1`'s font-family swaps to Cinzel for medieval-map, a
      different typeface with different natural line-height metrics --
      explicit `line-height: 1.2` now forces the same line-box height
      regardless of which font is actually rendering inside it; verified
      identical `.v3-header` height in px before/after swap).
      Known limitation, inherited from #64/v3.7.47, unaffected by any of
      the above: boats/dragons only have Medieval colours defined, so
      they won't re-tint on swap to Topology either way (already-flagged
      future scope).

</details>

- [ ] **#28** Backport Cabinet's newer `WORLD-SYSTEMS.md` to the Bookshelf (and
      fffx, if accessible) sibling repos -- Bookshelf's copy is stale
      (still describes Cabinet as having no islands of its own, and
      carries TODOs that Cabinet's own build already satisfies).

<details>
<summary>#29</summary>

- [x] **#29** Compass rose rotation: the rose (and the diagonals radiating from
      its centre, so they keep matching its ordinal arms) rotates
      anticlockwise -- either at random or triggered by approach/hover
      -- for one full revolution. Direct request, logged as a to-do
      rather than implemented immediately. **Done, v3.7.48**: hover-
      triggered, replays on every hover (no JS state, matches the
      existing arm-glow hover mechanism). Scoped to a second invisible
      hit shape, `.v3-compass-spin-hit`, a ring covering the arm/star
      area OUTSIDE the smaller `.v3-compass-theme-hit` circle (#21) --
      direct request to keep the two gestures spatially separate: "I
      dont want to overload the compass centre too much." Pure CSS: a
      nested `.v3-compass-rose-spin` group (just the star artwork, not
      roseGroup's own positioning translate/scale) gets `animation:
      rotate(-360deg)` via a `:has()` rule when the ring is hovered;
      `transform-box: fill-box` centres the spin on the group's own
      bounding box without needing to compute the rose's centre by hand.
      **v3.7.49 follow-up, direct feedback ("can the diagonal lines
      also rotate with the compass?")**: they now do. The rays
      (`drawGeoGrid()`) moved into their own nested [translate ->
      rotate] pair, same reasoning as the rose's own spinGroup -- an
      inline SVG `transform="translate(...)"` and a CSS `transform:
      rotate()` can't coexist on one element, CSS replaces the
      attribute outright rather than composing with it. Drawn relative
      to local (0,0), which the outer translate already pins to the
      compass's true centre, so the spin rule's `transform-origin: 0 0`
      is a constant rather than needing the compass's per-render
      coordinates baked into the stylesheet. `.v3-geo-grid` (and this
      group inside it) is a SIBLING of `.v3-compass`, not a descendant,
      so its `:has()` trigger is rooted at `#v3-stage` -- their nearest
      common ancestor -- instead of `.v3-compass`. Verified via
      computed-style inspection (not just a screenshot) that both spin
      groups share the same live rotation matrix mid-animation.
      **v3.7.52 follow-up, direct feedback**: "compass spin rate needs
      to slowdown - or even better, start slow, speed to current speed,
      and slow down - use an easing function to start-stop, over the
      first 90 and last 90 degrees, top speed only at 180 +- 45
      degrees." `@keyframes v3-compass-spin` now has three explicit
      segments instead of one flat `ease-in-out`: `ease-in` from 0deg to
      -90deg, `linear` (constant cruise) from -90deg to -270deg -- the
      middle 180 degrees, comfortably covering the requested "top speed
      at 180+-45" -- then `ease-out` from -270deg to -360deg. Total
      duration went from 900ms to 1350ms, chosen so the CRUISE segment's
      own angular rate matches the OLD flat animation's rate exactly
      (both 0.4deg/ms) -- "speed to current speed" -- the two eased ends
      are pure addition on top of that, not a retune of how fast the
      fast part feels. Verified by sampling the live rotation matrix at
      ~15 timestamps across one full spin (not just eyeballing a
      screenshot): confirmed near-zero velocity at the very start and
      end, ramping up to ~0.35-0.43deg/ms (matching the target 0.4)
      through the middle, both spin groups (rose + diagonals) staying in
      lockstep throughout since they share one keyframes rule and
      trigger.

</details>

- [ ] **#63** Compass arms: hovering one reveals intricate scrollwork
      ornament on that arm, plus a colour change. Blocked on the user's
      own hand-drawn/traced/digitized SVG artwork before this can be
      built -- same shape of blocker as #30's boats.
- [ ] **#65** The compass rose graphic itself should also swap on #21's
      theme click, not just the map's colours/structure -- direct
      request, 2026-08-24: "current version is medieval, the topo
      version can be some harmonically generated spirographic thing
      entwined around the same compass arms or different graphic
      altogether." Logged as a to-do, not built yet -- needs a design
      decision on which direction (generated spirograph vs a distinct
      hand/traced graphic) before implementation, similar shape of open
      question to #30's theme-specific boat artwork.

<details>
<summary>#64</summary>

- [x] **#64** Decide what to do about boats/dragons never appearing on the
      production build -- **#38's "consciously deferred" made concrete,
      2026-08-23**: seeing the live site with no boats/dragons at all
      ("none of the boats and dragons have turned up") is a different
      experience than reading the abstract deferral. Direct pushback on
      treating #38 as settled: **"I never agreed to not having the boats
      and dragons - they make the page alive... It's going on the live
      page."** Three options were laid out (leave as-is; a frozen build-
      time snapshot; ship the real animation loop live) with an initial
      cost estimate for the third that turned out to be wrong -- assumed
      reusing `cabinet-v3-layout.js`'s functions meant loading the whole
      170KB+ file (with `cabinet-v3-treemap.js`/`cabinet-v3-circlepack.js`,
      needed only to DECIDE island layout, not to animate on top of an
      already-decided one). Corrected after a direct challenge --
      **"Isnt the real engine just a particle system and a noise field?
      The islands are already there as svgs. What is the problem?"** --
      by actually checking what `startCurrentAnimation()` needs: just
      `grown` (circle-packing output, tiny) + canvasBounds, not the
      treemap/circlepack algorithms themselves. **Done, v3.7.47**:
      `build-static.mjs` now also serializes `grown`+`canvasBounds` into
      the static build; a new `cabinet-v3-production-animate.js` reuses
      `cabinet-v3-flowfield.js`/`cabinet-v3-particles.js`/`cabinet-v3-
      dragon.js`/`cabinet-v3-islandshape.js`'s `buildIslandHeightmap`
      UNMODIFIED (zero duplication of the actual physics), with only the
      DOM-rendering glue freshly written and trimmed per direct
      confirmation: no click-to-launch ("not a serious/core feature,"
      "we can get rid of mouseclick to new boat"), no MedieRiso colour
      branching (that theme doesn't ship to production), dragon dive/
      resurface slide-and-clip kept as-is ("dragon slide-sink is a
      keeper though, that works nicely"). ~150KB uncompressed added
      payload, not the ~350KB+ first estimated. Verified via Playwright
      on both `landing-v3/index.html` and the promoted `docs/index.html`:
      130 particles, 1-3 dragons, positions genuinely change frame to
      frame, zero console/request errors, full `mkdocs build` still
      clean. Also corrected in the process: this entry originally also
      claimed the theme x hover mechanism "doesn't work in production
      for the same reason" -- wrong, direct pushback caught it
      ("it does work, what are you talking about?"), checked directly:
      every hover-preview rule (`.v3-island:hover .v3-island-theme-
      preview` etc., `cabinet-v3-style.css`) is a pure CSS `:hover`
      selector revealing already-baked SVG paths via opacity, zero
      JavaScript involved -- not analogous to boats/dragons at all,
      which genuinely need a `requestAnimationFrame` loop.

</details>

- [ ] **#30** Theme-specific boat artwork: swap the boat graphic between themes
      (islands-tool.html's dev panel boat toggle -- the current ellipses
      are a top-down view, fitted for Topology's satellite-map
      register). Was blocked on the user describing the side-view shape
      or supplying an SVG -- **spec now given, 2026-08-23**: dual-scheme
      the boats.
      - Medieval: side view, generative triangle sail, muted colours.
      - Topology: top view, current ellipse shape kept, lighter outline,
        a more intense/saturated version of the same hue (vs. Medieval's
        muted one).

<details>
<summary>#31</summary>

- [x] **#31** Merge themes x hover -- **meaning corrected by the user, not yet
      re-explained.** Not "reconcile hover CSS across theme presets"
      (that was a wrong guess, struck from scope). Actual intent still
      TBD, placeholder title only -- **marked done per direct
      confirmation, 2026-08-23**, superseded by the theme x hover
      mechanism itself now being complete (v3.7.32-v3.7.44 above);
      whatever this placeholder was originally meant to track no longer
      needs separate action.

</details>

- [ ] **#32** Rework "Copy config" -- direct question, 2026-08-23: "What does
      copy config do now, with multiple themes and specific
      applications? Does it need to be reworked, or the place where the
      config is supposed to be pasted in the file? Pressing copy config
      should mention where it needs to be pasted, or it should be part
      of the copied text as a comment... Or there can be a separate
      user_theme_config.js type file that this gets pasted into on its
      own and the code can pick it up from that without any
      copy-pasting." Current state (`cabinet-v3-controls.js`'s "Copy
      config" button): dumps ONLY `v3Config.island` (shape/band tuning)
      as JSON to the clipboard/console, meant to be hand-pasted back
      into `cabinet-v3-data.js` (per `islands-tool.html`'s own
      footnote) -- unchanged since v3.6, predating the theme system's
      growth. It captures whichever theme happens to be ACTIVE at copy
      time (since THEME_PRESETS overwrites `v3Config.island`'s
      flatColourMode/showWaveRings/showCoastalBands/seaShadowStyle on
      every theme switch) with no record of which theme that was, and
      it never captures theme colours at all -- those live in
      `themeTokenState`, a separate in-memory object, never written back
      to `cabinet-v3-style.css`'s per-theme blocks by anything. Nor does
      it capture `v3Config.themePreview`/`geo`/`particles`/`flow`/
      `dragon`. Two candidate directions raised, not yet chosen between:
      (a) minimal -- expand what's captured (theme colours per-theme,
      themePreview) and embed a comment in the copied text itself saying
      exactly where each piece goes; (b) bigger -- a separate,
      auto-loaded override file (all live-tunable state in one object)
      so nothing needs hand-pasting into source at all. Needs a decision
      before implementing, not a guess.

<details>
<summary>#62</summary>

- [x] **#62** Rework `archived-landing-pages/index.html` (the archive landing
      page) -- direct reaction, 2026-08-23: "I dont like the lander, feels
      iffy." Two directions raised, not yet chosen between: (a) redesign
      it as its own real page, or (b) skip a standalone landing page
      entirely and link `v1/`/`v2/` directly from the colophon (#20)
      instead, treating archive access as a footnote rather than a
      promoted destination. **Resolved, v3.7.54, 2026-08-24**: option
      (b) -- the direct request to "link the archive subpages there
      directly" on the new colophon page settled this implicitly.
      `archived-landing-pages/index.html` itself is untouched, still
      exists, just no longer the intended path to the archive -- the
      compass's Colophon direction and `docs/colophon.md` bypass it
      entirely and link straight to `v1/`/`v2/`. Follow-up same day: the
      four `v2-history/` sub-stages (`01-initial` through
      `04-serpent-redesign`) were missing from the colophon page too --
      added, nested under the `v2` link, same labels the old lander
      used.


</details>

---

## Phase 1 -- Go for Launch

*Goal: get all three worlds publicly coherent, stable, and navigable.
Launch threshold: all three worlds feel intentional and usable; visible
doors lead somewhere meaningful; no major navigation or deployment
failures remain.*

### Cabinet

- [ ] **#34** Finish the V3 landing-page launch pass:
  - [x] **#35** integrate sea serpent -- done, v3.6.24 (Phase 0 above)
  - [x] **#36** final colour/type choice -- **done, 2026-08-23**, per direct
        confirmation. Closes the caveat #10 (Phase 0) left open about the
        map's overall colour scheme.
  - [ ] **#37** fix obvious label overflow on the map itself (distinct from the
        doc-audit item above about production-page card/label overlap)
  - [x] **#38** decide whether flowfield/particle boats ship in the production
        build or are consciously deferred -- **decided, 2026-08-23:
        consciously deferred.** Confirmed via `build-static.mjs`/
        `index.template.html`: the production build is a single static SVG
        snapshot with no client-side script at all, so the flowfield/
        particle system (an animation loop) has no path into it as
        currently architected. Boats stay `islands-tool.html`-only, a dev
        tool, unless the static-build approach itself changes later.
  - [ ] **#39** desktop/mobile QA

<details>
<summary>#40</summary>

- [x] **#40** Promote `landing-v3-prototype` into the production Cabinet
      structure (see the Branch/production transition checklist below,
      and `three-world-launch-phases-Notes.md` for why this is a normal merge, not a
      default-branch switch) -- **done, 2026-08-23**, see the
      Branch/production transition entries below for the full mechanics.

</details>

<details>
<summary>#41</summary>

- [x] **#41** Align the landing-page hierarchy with `mkdocs.yml` -- **first pass,
      2026-08-24**: `mkdocs.yml` nav restructured to mirror the compass/world
      names -- new `Compass` section (About/Colophon/Now) added,
      `Thingamajigs` renamed to `Machines & Makings` to match
      `cabinet-sections.tsv`'s `machines-makings` title. The `Teaching` nav
      section added the same day was removed again a few hours later
      (`#71`) once Working with AI and friends became real map entries
      instead -- the map is now the canonical home for Teaching content,
      not a second mkdocs listing. **Marked done, 2026-08-24**: every
      `cabinet-sections.tsv` row now has a matching `mkdocs.yml` section
      except Visual Field Notes (no mkdocs section because nothing exists
      there yet, confirmed fine) and Wild wild web (present in both, but
      `status: false` on the map side -- a placement decision, #69, not a
      hierarchy gap; also corrected there: the "grid is full" reasoning
      was wrong, see #69's note).

</details>

- [ ] **#42** Finish essential personal pages: About Me, Contact, any other page
      necessary for the site to feel complete at launch -- see #66 (About).

<details>
<summary>#43</summary>

- [x] **#43** Implement the first multi-repo assembly, beginning with Working
      with AI (see `three-world-launch-phases-Notes.md` for the mechanism).
      **Done, v3.7.54, 2026-08-24**: `deploy.yml` gained a second
      `actions/checkout@v4` step (`repository: jesmehta/working-with-ai`,
      `path: _external/working-with-ai`, no auth needed -- public repo),
      copied into `public/teaching/working-with-ai/` AFTER `mkdocs
      build` runs (so MkDocs never sees it, and it can never collide
      with anything MkDocs itself generates), then a validation step
      checking for `index.html` and real content before the Pages
      artifact is uploaded -- all-or-nothing by construction, since a
      failed step here fails the `build` job the `deploy` job depends
      on. Deliberately hand-written for this ONE project, not yet the
      generalized manifest (`cabinet-multi-repo-assembly-concept-note-
      short.md`'s own Phase 2) -- inspection first: the repo has no
      build step of its own (no package.json/Makefile/gen.py committed,
      output IS the source), every internal path is relative, nothing
      hardcodes `jesmehta.github.io`, so "assemble" here really is just
      "copy the files." Verified locally before ever touching the
      workflow: simulated the exact sequence (`mkdocs build --site-dir
      public`, then copy) and load-tested the result with Playwright --
      title/16 TOC links present, first link click resolves correctly
      at the new mount depth, the sibling `coding-with-ai/` sub-site
      (not linked from the root page but present in the same repo) also
      loads clean, zero failed requests, zero console errors. The live
      GitHub Actions run itself still needs confirming -- no `gh` CLI in
      this environment to read run logs directly.

</details>

<details>
<summary>#44</summary>

- [x] **#44** Change public links from Working with AI's external GitHub Pages
      URL to the Cabinet-local path once assembled and tested --
      **done, 2026-08-24**: confirmed `https://cabinetofcuriosities.in/
      teaching/working-with-ai/` live (200, real title) before linking it.
      **Superseded same day (#71)**: initially linked from a new
      `mkdocs.yml` Teaching nav entry, then that entry was removed in
      favour of a real `cabinet-entries.tsv` row under the `teaching`
      section -- the Cabinet-local path is now reached from the landing
      page map, not the docs sidebar.


</details>

### Branch / production transition

<details>
<summary>#45</summary>

- [x] **#45** Complete and test V3 on `landing-v3-prototype` -- **done,
      2026-08-23**: `data-theme` fix verified, full `mkdocs build`
      passed pre-merge, Playwright confirmed zero console/request
      errors on the promoted page.

</details>

<details>
<summary>#46</summary>

- [x] **#46** Test the Working with AI assembly there without replacing the
      current production site -- **done, confirmed live, 2026-08-24**:
      `https://cabinetofcuriosities.in/teaching/working-with-ai/` fetched
      directly, 200 with the real page title ("Working With AI - 15
      Principles"), not just the local pre-push simulation. Current
      production site's visible content was unaffected throughout, as
      predicted (all-or-nothing assembly, nothing linked to it until #44).

</details>

<details>
<summary>#47</summary>

- [x] **#47** Tag/archive the current `main` state before launch (see Phase 0's
      "create a history section" item -- give archived pages a real
      linked home, not just a tag) -- **done, 2026-08-23**: archival
      itself covered by `#18`/`#61` above (`archived-landing-pages/`);
      additionally tagged `main`'s exact pre-merge HEAD as
      `cabinet-v2-before-v3` (commit `6364fce`), matching the existing
      `cabinet-v1-before-map` convention, so it's recoverable by tag as
      well as by being folder-archived.

</details>

<details>
<summary>#48</summary>

- [x] **#48** Merge `landing-v3-prototype` into `main` -- **done,
      2026-08-23**, commit `7f3a638`. Not a simple merge: `main` had
      diverged independently since the branch split (2 commits from
      2026-08-14, not on `landing-v3-prototype` -- a Teaching nav entry
      and CNAME handling for the custom domain under the *old*
      gh-pages-branch deploy mechanism). The nav entry merged cleanly.
      The CNAME handling needed real reconciliation: `landing-v3-
      prototype` had already independently rewritten `deploy.yml` onto
      the newer artifact-based Pages mechanism, which has no equivalent
      `cname:` parameter, so the two versions were flatly incompatible,
      not just textually conflicting. Resolved by keeping the artifact-
      based workflow and adding `docs/CNAME` (`d39fec4`) instead, added
      *before* the merge specifically so the custom domain wasn't
      silently dropped -- caught only because it was checked rather
      than assumed.

</details>

<details>
<summary>#49</summary>

- [x] **#49** Ensure the Pages workflow is triggered from `main` -- **done**:
      `deploy.yml` already triggers `on: push: branches: - main`;
      pushing the merge (`7f3a638`) to `origin/main` triggered it
      directly, nothing separate needed.

</details>

<details>
<summary>#50</summary>

- [x] **#50** Deploy the assembled `public/` artifact from `main` -- **done,
      confirmed live, 2026-08-23**: "IT WORKS !" -- cabinetofcuriosities.in
      is serving v3. Two real bugs found by actually looking at the live
      result rather than trusting the build alone: production's H1/
      section/island-label fonts were never loading (v3.7.46 -- see
      `Landing-page-notes.2.0.md`), fixed and reconfirmed live; boats and
      dragons don't appear at all (not a regression -- see #64 below,
      this is #38's "consciously deferred" made concrete).


</details>

### Bookshelf + FFFX

- [ ] **#51** Review both repos for last-minute updates
- [ ] **#52** Audit current section/entry TSVs against work that already exists
- [ ] **#53** Link any obvious existing work that should already be represented
- [ ] **#54** Verify current standalone pages/interactives and subdomain
      deployment

*Don't hold launch for unfinished/WIP entries that are intentionally
marked as such.*

### Cross-world launch checks

- [ ] **#55** Verify Cabinet, Bookshelf and FFFX link to each other correctly
      -- **partially verified, 2026-08-24**: Cabinet -> Bookshelf/FFFX
      confirmed (both external nav links + TSV entries live, 200, real
      titles). Bookshelf/FFFX -> Cabinet not checked -- no local access
      to either repo from this environment, would need fetching their
      live pages and grepping for a link back.

<details>
<summary>#56</summary>

- [x] **#56** Verify custom domains/CNAMEs (fffx's specifically: see the
      doc-audit item above) -- **done, 2026-08-24**, same verification as
      #25 (duplicate ask): `fffx.cabinetofcuriosities.in` live, 200,
      served by GitHub Pages, real title.

</details>

<details>
<summary>#57</summary>

- [x] **#57** Check visible landing links, MkDocs navigation, nested routes and
      assets -- **done for Cabinet's own scope, 2026-08-24**: `mkdocs
      build` clean, Playwright confirms zero console/request errors on
      the promoted page, and every newly-added route this session
      (`/teaching/*`, `/makings/*`, colophon's archive links, etc.) was
      fetched directly and content-checked, not just status-code checked.
      Bookshelf/FFFX's own internal nav is out of scope -- no local
      access to audit from here.

</details>

- [ ] **#58** Confirm failed builds do not replace the last successful live
      deployment -- **structurally sound, not yet empirically confirmed,
      2026-08-30**: `deploy.yml`'s `deploy` job has `needs: build`, so a
      failed `build` job means `deploy` never runs at all and GitHub
      Pages keeps serving whatever the last successful `deploy` job
      published -- same "all-or-nothing by construction" reasoning
      already used for `#43`/`#71`/`#128`. Not the same as this item's
      own "confirm" though -- no `gh` CLI in this environment to check
      real run history, and deliberately breaking a build on production
      just to test an already-sound structure isn't worth the risk.
      Needs the user's own GitHub Actions tab to actually close (any
      past failed run, confirm the site didn't change), or
      `gh`/API access if that ever becomes available here.

<details>
<summary>#59</summary>

- [x] **#59** Merge/tag/deploy the launch version -- **resolved as a naming
      question, 2026-08-30, direct clarification**: "we are already
      launched in some ways... the merge to main would count as launch...
      [but] the about page is left and a few other essential backend and
      front end stuff is left." Two-stage milestone scheme adopted:
      `launch-beta` (annotated tag, created 2026-08-30 at `7f3a638`, the
      actual 2026-08-23 merge-to-main commit -- v3 live at
      cabinetofcuriosities.in, not yet feature-complete, links not yet
      publicly shared) and a future `launched` marker, applied once BOTH
      Phase 0-2 are done/largely done AND the user actually starts
      publicly distributing the site's links -- a real-world event, not
      just a checklist state, so it can't be auto-triggered off item
      counts. This item itself (merge+deploy) has been done since `#48`;
      what was actually missing was the tag/label for it, now created.

</details>

### Content audit, 2026-08-24

- [ ] **#66** About needs to be written properly -- currently 30 words of
      placeholder text (`docs/about.md`). Part of #42.

<details>
<summary>#67</summary>

- [x] **#67** Nav content audit: most `mkdocs.yml`-linked pages are stub/
      "coming soon" text even though the file exists -- word counts taken
      2026-08-24: `about.md` 30, `makings.md` 21, `creative_code.md` 42,
      `emergent_twine.md` 12, `trippyGourmet.md` 12, `fffx/100Gradients.md`
      23, `fffx/fffx.md` 19, `fffx/particleSystems.md` 22, all three
      `3dp/3DP_*.md` prints pages under 20 -- these count as empty for
      launch purposes even though `mkdocs build` sees them as real pages.
      Real content exists at `mini_loom.md` (1019w), `site_notes.md`
      (1583w), `dotMandalaTool.md` (1029w), `traceryBots.md` (681w),
      `fffx/PackingShapes.md` (819w), `fffx/VeraMolnarRetrospective.md`
      (311w). Separately, there are `.md` files under `docs/` with no
      corresponding `cabinet-entries.tsv` row at all -- decided to leave
      these alone for now, especially the empty ones, rather than force a
      TSV entry for a stub. Feeds #52/#53's TSV-vs-existing-work audit.
      In passing: `mkdocs.yml` had a stale nav reference to
      `fffx/formFollowsFx.md` (file is actually `fffx/fffx.md`, a 404 in
      production) -- fixed same day since it was a one-line typo, not a
      content decision.

</details>

- [ ] **#68** Update the MkDocs theme's colour scheme to match the landing
      page, and add some light background graphics -- currently plain
      Material defaults, wants to feel like the same site as the v3
      landing page rather than a bolted-on docs theme. Related to #41.
      **First attempt built and rejected, 2026-08-24**: medieval-map
      cream base + three Topology accents (cyan/coral/gold), reviewed via
      screenshot before committing -- direct feedback: "very bland,"
      wanted a lot more of Topology's brighter pops, not just accents on
      top of a mostly-cream page. Reverted (`git checkout --`) rather
      than left half-applied. Real, independent bug found and fixed
      along the way (kept regardless of the palette's fate, but only
      matters once a new attempt lands): MkDocs Material scopes its own
      default token values under `[data-md-color-scheme="default"]`,
      which beats a bare `:root` override on specificity -- the
      *existing* colour mapping had likely never actually been taking
      effect on the live site because of this, only the hardcoded
      `.md-header`/`.md-tabs` background ever visibly themed. Still
      needs a second, bolder pass -- not done.
- [ ] **#69** `wild-wild-web` added to `cabinet-sections.tsv` (2026-08-24,
      `status: false` so it doesn't render) -- has an `mkdocs.yml` nav
      section already (TraceryBots, Dot Mandala Generator, Twine,
      Creative Coding) but no map placement. **Correction, 2026-08-24**:
      the original note above assumed the archipelago grid was full and
      fixed by the recorded `cx`/`cy` per section, requiring a layout
      redesign to add an 8th region -- wrong. `cabinet-sections.tsv`'s
      `cx`/`cy`/`rx`/`ry` columns are vestigial, same as entries' `x`/`y`
      (#see the v3.7.58 changelog entry) -- `cabinet-v3-layout.js`
      actually computes section placement live via `squarify()` (a real
      treemap, keyed only on `weight`), confirmed while investigating the
      new Fab section (#see below) -- so flipping `status` to `wip`/`true`
      should just work, the treemap reflows on its own. Not yet flipped:
      still blocked on the Twine/WebTech/Tracery Bots duplication (see
      the Content Inventory table) being resolved first, since turning
      Wild wild web into a real island while those three still also live
      under `interfaces-data-texts` would make the duplication visible
      on the map itself, not just in the docs sidebar.

<details>
<summary>#70</summary>

- [x] **#70** Check whether section/island labels are real headings (`h2` etc.)
      or SVG `<text>`, and what that implies for SEO/search, page
      structure and responsiveness -- **quick check, 2026-08-24**: they're
      SVG `<text class="v3-section-label">`, built in
      `cabinet-v3-layout.js`'s `computeSectionLabel()`/render path (around
      line 766), not semantic HTML. Only the page `<h1>` (Cabinet of
      Curiosities) and its subtitle are real HTML -- see `docs/index.html`'s
      own header comment for why that one was deliberately kept semantic
      (crawlers/screen readers). Section titles ("Bookshelf of
      Curiosities", "Teaching", etc.) don't participate in the document's
      heading outline, aren't reachable via screen-reader heading
      navigation, and don't reflow with the rest of the page the way HTML
      text does -- they scale with the SVG viewBox instead. Not yet
      assessed: whether this actually hurts search ranking in practice
      (search engines do index SVG `<text>` content, just not as
      headings), or whether an `aria-label`/hidden HTML heading pass
      would be the right fix vs. leaving it as an intentional map
      metaphor. Needs a real look before deciding.

      **Decided and built, 2026-08-30**: real, visually-hidden `h2`/`h3`
      elements, generated by `cabinet-v3-layout.js`'s new
      `renderSemanticOutline()` (right after `buildSectionMetas()` in
      `render()`) straight from the same `sectionMetas`/`entries` data the
      SVG map itself uses -- one `h2` per section (linked when
      `sectionMeta.href` exists, e.g. `visual-field-notes`/`fab` don't and
      get a bare heading), one `h3` per real TSV entry, including WIP ones
      with no page yet. The compass section (About Me/Now/Colophon/Site
      map) is included too -- it has real entries like any other section.
      Filler islands never enter the picture: they're synthesized later in
      `buildSeedsForSection()`, never part of `sectionMeta.entries`, so
      there's nothing to filter. The SVG `<text>` labels are unchanged and
      still do all the visual work; this is a parallel layer, not a
      replacement.

      Rejected alternatives, per the discussion that led here: `role="heading"`
      on the SVG `<text>` itself (cheap, but ARIA on SVG isn't confirmed to
      carry SEO weight the way a real tag does, and would've been thrown
      away once the real headings existed); live HTML overlay labels
      positioned at the SVG's own computed coordinates (avoids the
      duplication below, but couples two coordinate systems on a page
      whose treemap/circle-packing already reflows live -- an ongoing
      maintenance cost, not a one-time one); a visible text
      table-of-contents block (same SEO/a11y win, but a content/design
      decision in its own right, not a markup fix -- left as a possible
      separate idea, not folded in here).

      Deliberately deferred: `aria-hidden` on the SVG labels +
      `aria-labelledby` pointing at these headings, which would stop a
      screen reader announcing each title twice (once as the link's own
      SVG text, once as this heading). Direct call: screen-reader users
      aren't the current priority for this highly visual map, and that
      wiring is the fiddly, hard-to-verify part (SVG accessibility mapping
      is inconsistent across browser/AT combinations) -- add it if/when
      that changes. Also deliberately not verified: whether this actually
      moves search ranking/indexing -- no local feedback loop for that,
      only best practice; revisit via Search Console once the site's had
      time to be recrawled.

      **Watch out, future edits**: `renderSemanticOutline()` reads
      `sectionMeta.{id,title,href,entries}` and each entry's
      `{id,title,href}` -- the exact fields `buildSectionMetas()`/
      `buildSeedsForSection()` already read. If a future change reshapes
      that data (e.g. resolving the `wild-wild-web` Twine/WebTech/Tracery
      Bots duplication noted elsewhere in this file, or changing what
      `entry.href` means), this function needs updating too -- there's no
      visual symptom if it drifts, since the whole point is that it's
      hidden content. It has one cheap tripwire (a `console.warn` if the
      built heading count doesn't match the section/entry count going in),
      but that's not a substitute for actually checking. The container
      (`#v3-semantic-outline`) is cleared and rebuilt on every `render()`
      call, so it stays correct across `islands-tool.html`'s Reroll
      (verified: two rerolls in a row produce the same 45 headings, not
      90). It has to be added to any *new* page that loads
      `cabinet-v3-layout.js` directly -- currently
      `layout-engine/build-render.html`, `dev-tool/islands-tool.html`, and
      (via `build-static.mjs`'s capture into `index.template.html`'s new
      `V3_SEMANTIC_OUTLINE` placeholder) the production build. `docs/`'s
      promoted copies (`docs/index.html`,
      `docs/assets/css/cabinet-v3-style.css`) were hand-promoted the same
      way as the rest of that pipeline -- see `FILE-MANIFEST.md`'s
      `docs/index.html` entry; there's still no automated promotion
      script, so this needs re-promoting by hand after any future
      `landing-v3/index.template.html` or
      `landing-v3/shared/cabinet-v3-style.css` edit, same as before this
      change.

</details>

<details>
<summary>#71</summary>

- [x] **#71** Working with AI, Prompt Generator, Oblique Strategies and SSD
      Creative Coding all mapped as real `cabinet-entries.tsv` entries
      under `teaching`, at Cabinet-local assembled paths -- **done,
      2026-08-24**: `deploy.yml` extended with three more Checkout/
      Assemble/Validate step groups (`#43`'s pattern, copy-pasted, not yet
      the Phase 2 manifest -- four real examples now exist, worth
      revisiting whether to generalize). New paths:
      `/teaching/prompt-generator/`, `/teaching/oblique-strategies/`,
      `/teaching/ssd-creative-coding/` (alongside the existing
      `/teaching/working-with-ai/`). All three source repos inspected
      first, same bar as `#43`: no absolute-path `href`/`src`, no
      hardcoded `jesmehta.github.io` references, so remounting under
      `/teaching/` doesn't break their asset paths. `prompt-generator` and
      `oblique-strategies` moved out of `interfaces-data-texts` (where
      they were first added, same session) into `teaching`, since that's
      where they actually belong; `teaching-student-work`'s `href`
      switched from the external SSD Creative Coding URL to its own new
      assembled path. `mkdocs.yml`'s `Teaching` nav section (added a few
      hours earlier, same session) was then removed entirely -- the map
      is the canonical listing now, a second copy in the docs sidebar was
      redundant. **Live-confirmed, same day**: all four assembled paths
      fetched directly after the `main` push, 200 with real titles each.

</details>

<details>
<summary>#72</summary>

- [x] **#72** Bookshelf/FFFX nav split, real Teaching/Makings landing pages,
      Swatch Fields cross-listing -- **done, 2026-08-24**, direct
      follow-up to `#71`'s table:
    - `mkdocs.yml`: Bookshelf and Form follows f(x) reduced to a single
      external link each, to their own world root
      (`bookshelf`/`fffx.cabinetofcuriosities.in`) -- their sub-page nav
      entries belong in THEIR OWN mkdocs, not duplicated here. The 5 local
      `docs/fffx/*.md` files (2 with real content --
      `VeraMolnarRetrospective.md` 311w, `PackingShapes.md` 819w -- 3
      placeholder) are now orphaned from nav rather than deleted; worth
      migrating the real ones into the fffx repo itself later rather than
      leaving them stranded here.
    - `docs/teaching.md` created as a real Teaching landing page, first
      entry under a restored `mkdocs.yml` Teaching section (this time
      genuinely non-duplicate: the section's landing page doesn't exist
      on the map, only the 4 entries under it do). `cabinet-sections.tsv`'s
      `teaching` row `href` switched from the placeholder external SSD URL
      to `teaching/`, `status` promoted `wip` -> `true`.
    - `docs/makings.md` (already existed, 21w stub) promoted to first
      position under `Machines & Makings`; three new stub pages created --
      `docs/makings/origami-paper.md`, `lasercutting.md`,
      `drawing-machines.md` -- linked from both `makings.md` and their
      `cabinet-entries.tsv` rows (`status` `wip` -> `true`, `href` filled
      in). 3D Printing's mkdocs sub-page cluster (Mecha/Flexures/
      PolyHedra/2019) deliberately left as mkdocs-only, one TSV/map entry
      -- direct instruction to revisit that level-2 clustering question
      later, not a gap to fix now.
    - Swatch Fields made a deliberate two-TSV-row, two-island,
      two-nav-entry cross-listing (`swatch-fields` under
      `machines-makings`, new `swatch-fields-interfaces` under
      `interfaces-data-texts`) -- same precedent as `dataviz`'s existing
      cross-listing from Bookshelf's Christie page. New minimal
      `Interfaces, Data & Texts` `mkdocs.yml` section created to hold its
      nav copy (previously didn't exist as a section at all) -- currently
      holds only Swatch Fields; the `Wild wild web` duplicates (Twine/
      WebTech/Tracery Bots, see the content-audit table) would be the
      natural next things to move in if that consolidation is ever
      wanted, not done here.
    - Verified: `mkdocs build` clean (zero warnings after fixing
      `makings.md`'s internal links to the `.md`-suffixed form MkDocs
      itself suggested), `node tools/build-cabinet-content.js` (8
      sections, 32 entries), `build-static.mjs`, Playwright screenshot
      confirms Machines & Makings and the new second Swatch Fields island
      both render correctly.

</details>

<details>
<summary>#73</summary>

- [x] **#73** Compass rose's 4 directions decided (not yet built): N = About
      Me, S = Colophon (both stay as-is), E/W = Now and a new **Site
      IA / Sitemap** page, once Contact (`compass-e`) and CV
      (`compass-w`) are absorbed elsewhere rather than each holding their
      own direction. Not started -- open questions before building:
      where does CV content go (folded into About Me's text? dropped
      entirely in favour of the existing external `jesalmehta.com` link
      living somewhere less prominent?), does Contact disappear as a
      compass direction entirely or fold into a footer/social link, and
      does the Site IA/Sitemap page get hand-written or generated from
      `mkdocs.yml` + `cabinet-sections.tsv` directly (the latter would
      need to stay in sync with both, same drift risk as everything else
      audited in `#67`). -- **Resolved, v3.7.67, 2026-08-29**: CV and
      Contact were already absorbed (CV into About Me, Contact into the
      Now page -- see `compass-w`/`compass-e`'s own notes in
      `cabinet-entries.tsv`), leaving only the W point itself. Went with
      generated, but broader than the question assumed: `tools/
      generate_sitemap.py` pulls sections/entries TSVs live from all
      three worlds' own repos (Cabinet, fffx, Bookshelf), not just this
      repo's two, into `docs/sitemap.md`. Full details in
      `Landing-page-notes.2.0.md`'s v3.7.67 changelog entry.
      **Follow-up, 2026-08-30, direct clarification**: confirmed this
      item counts as done -- the compass wiring itself (all four
      directions live) is complete, that's what this item tracks.
      Separately clarified, since the two TSV rows disagreed with each
      other: **both CV and Contact fold into About Me**, not split
      between About Me and Now. `compass-n`'s note already said this
      correctly; `compass-e`'s note incorrectly also claimed Contact
      lived on the Now page -- fixed to match. The actual About Me page
      content doesn't carry CV/Contact yet (`docs/about.md` is still the
      30-word stub from `#67`'s audit) -- that's `#66`/`#42`'s scope, not
      this item's; `#73` only tracked the compass structure being
      decided and wired, which it now is.

</details>

---

## Phase 2 -- Immediately After Launch

*Goal: complete the obvious structural gaps and make the three-world
system easy to maintain. Threshold: the sites are not just launched;
they are maintainable, documented and structurally complete enough for
routine publishing.*

- [ ] **#74** Add/finish fuller About/site-context pages
- [ ] **#75** Colophon (Phase 0 above)
- [ ] **#76** Site Notes where useful
- [ ] **#77** At least a basic landing/overview page for every active
      top-level section
- [ ] **#78** Link existing pages/projects that were not essential enough to
      block launch
- [ ] **#79** Continue selective migration of worthwhile older Cabinet content
- [ ] **#80** Expand Cabinet multi-repo assembly beyond Working with AI:
      Student Work, Rock Collection, Dupatta Collection, other substantial
      independent projects
- [ ] **#81** Build TSV editors for Cabinet, Bookshelf, FFFX (see
      `three-world-launch-phases-Notes.md` for requirements)
- [ ] **#82** Generalize Cabinet assembly into a manifest-driven workflow so
      additional repos can be mounted through configuration rather than
      hard-coded workflow steps
- [ ] **#83** Add automatic rebuild triggers from child repos (only after the
      basic assembly is stable)
- [ ] **#84** Add stronger validation before deploy
- [ ] **#85** Normalize duplicated documentation where Bookshelf/FFFX docs
      have drifted (see the doc-audit item above)
- [ ] **#86** Replace obvious placeholder metadata/thumbnails where easy (see
      the doc-audit item above)

**Cabinet file/folder reorganization** -- direct request, 2026-08-29:
"the v3 folder has a lot going on, there are a lot of legacy files from
v1 which may or may not be relevant anymore, and they are scattered
across the folders and subfolders." Full inventory (what's confirmed
dead vs. superseded-but-kept vs. genuinely live-but-flat) discussed in
conversation before any item below was opened; each item's own
before/after mapping is the result of that audit, not a guess. Five
items, meant to execute in order -- each ends with the same
verification gate: `node tools/build-cabinet-content.js`, `node
tools/build-now-content.js`, `mkdocs build`, then from `landing-v3/`:
`node build-static.mjs`, a headless-Chromium zero-console-error check,
and a screenshot diff against the prior item's baseline. Do not start
the next item on a red gate.

<details>
<summary>#129</summary>

- [x] **#129** Reorg 1/5 -- safety net. Tag current state
      (`git tag pre-file-reorg`) as a one-command rollback point before
      any move. Confirm `mkdocs` is installed locally (`pip install -r
      requirements.txt`) so the verification gate above can actually run
      `mkdocs build` -- it could not be run locally as of this item being
      opened. -- **Done, 2026-08-29**: `pre-file-reorg` tag created at
      `06a3813`. `mkdocs` (1.6.1) and the full plugin set from
      `requirements.txt` installed into the local Python environment
      (none of it existed before this item). `mkdocs build --strict`
      confirmed clean, exit 0 -- the only console output is pre-existing
      INFO-level noise (orphan pages not in `nav`, a few unrecognized
      relative links in `colophon.md`/`teaching.md`/`fffx/PackingShapes.md`),
      none of it new, none of it an error. Verification gate is now
      real, not aspirational.

</details>

<details>
<summary>#130</summary>

- [x] **#130** Reorg 2/5 -- remove confirmed-dead v1/v2 code sitting in
      `docs/assets/`, unreferenced by anything live and already
      byte-identical to copies preserved at
      `archived-landing-pages/v2/assets/`. Delete:
      `docs/assets/css/cabinet-landing.css`,
      `docs/assets/js/cabinet-data.js`,
      `docs/assets/js/cabinet-interactions.js`,
      `docs/assets/js/cabinet-render.js`. -- **Done, 2026-08-29**:
      re-verified byte-identical to the archive and zero live references
      immediately before deleting (not just relying on the earlier
      audit), then deleted all four. Full gate green: both TSV->JS
      builds produced no diff, `mkdocs build --strict` exit 0,
      `build-static.mjs` rebuilt `landing-v3/index.html`
      byte-for-byte identical to before the deletion (expected --
      nothing live ever loaded these files), zero console/request
      errors on a fresh headless render. `docs/index.html` did not need
      re-promotion since its own input didn't change.

</details>

<details>
<summary>#131</summary>

- [x] **#131** Reorg 3/5 -- relocate legacy root files into the archive
      tree, updating every doc that cross-references their old path
      (`README.md`, `WORLD-SYSTEMS.md`, `NOW-PAGE.md`, and each moved
      file's own banner). Mapping:
      `assets/map/source/{cabinet-map-source.json,generate-cabinet-map.js}`
      -> `archived-landing-pages/v2/source/`;
      `LANDING-PAGE-NOTES.md` -> `archived-landing-pages/v2/LANDING-PAGE-NOTES.md`;
      `DESIGN-SYSTEM.md` -> `archived-landing-pages/v2/DESIGN-SYSTEM.md`.
      In passing, also fix a pre-existing wrong path this audit found:
      `README.md`'s v3.0 changelog entry points at
      `landing-v3/Landing-page-notes.2.0.md`, but that file actually
      lives at the repo root (`Landing-page-notes.2.0.md`) -- broken
      before this item, unrelated to the move itself, fix while touching
      the same cross-references. -- **Done, 2026-08-29**: all three moved
      via `git mv`; root `assets/` (now empty) removed entirely. Fixed
      every literal path reference in `README.md` (7 spots, including
      both occurrences of the pre-existing wrong `Landing-page-notes.2.0.md`
      path, and a bonus catch -- the `docs/assets/js/` structure bullet
      still described `cabinet-data.js`/`cabinet-render.js`/
      `cabinet-interactions.js` as "kept in place," stale since `#130`
      deleted them), `NOW-PAGE.md`, `.github/workflows/deploy.yml`'s
      guard-step error message, and the two moved files' own internal
      cross-references to `assets/map/source/...` (5 spots between them).
      Deliberately left untouched: `WORLD-SYSTEMS.md` (its mentions are
      bare filenames naming a shared convention, not literal paths --
      it's hand-synced identically across Cabinet/Bookshelf/fffx, and
      editing prose here without touching the other two repos' copies
      would just create new drift) and `conversation-landing-page-v3.md`
      / this file's own earlier "surfaced by reading..." lines (genuine
      historical narrative describing where these files were *at the
      time*, same category as `archived-landing-pages/`'s own frozen
      HTML comments -- not rewritten, matching how those are already
      handled). Gate: both TSV->JS builds produced no diff, `mkdocs
      build --strict` exit 0, a follow-up repo-wide grep for any
      remaining non-archive/non-historical hit on the old paths came back
      empty.

</details>

<details>
<summary>#132</summary>

- [x] **#132** Reorg 4/5 -- regroup `landing-v3/`'s internals by actual
      role (traced via real `import`/`<script src>` graphs, not by file
      type), moved and verified one group at a time, A before B before
      C, since B and C's own cross-imports need path updates on each
      move:
      - Group A, dev-tool-only, never ships: `cabinet-v3-controls.js`,
        `islands-tool.html`.
      - Group B, build-time layout engine (used by both the dev tool and
        `build-static.mjs`'s headless render, never shipped as a file to
        browsers): `cabinet-v3-layout.js`, `cabinet-v3-treemap.js`,
        `cabinet-v3-circlepack.js`, `build-render.html`,
        `compass_rose.svg`.
      - Group C, shared modules that *do* ship (promoted into
        `docs/assets/`) and are also imported by Group B at build time:
        `cabinet-v3-data.js`, `cabinet-v3-islandshape.js`,
        `cabinet-v3-flowfield.js`, `cabinet-v3-particles.js`,
        `cabinet-v3-dragon.js`, `cabinet-v3-production-animate.js`,
        `cabinet-v3-style.css`.
      Destination subfolder names not yet decided -- pick at execution
      time. `landing-v3/dev-screenshots/`, `landing-v3/archive/v3.6/`,
      `node_modules/`, `package.json`, `build-static.mjs`, `index.html`
      (build output) stay at the top level, untouched. -- **Done,
      2026-08-29**: subfolders named `dev-tool/`, `layout-engine/`,
      `shared/`. Full import/script-tag graph mapped for all three
      groups *before* any move (not just doc-grepped) -- this caught a
      real load-bearing bug doc search alone would have missed:
      `build-static.mjs` navigates Playwright to a hardcoded literal URL
      string, `` `http://localhost:${PORT}/landing-v3/build-render.html` ``
      -- moving `build-render.html` without updating that string would
      have silently broken every future static rebuild (Playwright would
      404, `page.waitForSelector` would time out). Fixed alongside the
      move. Also found `compass_rose.svg` is not actually loaded at
      runtime at all -- same as `dragon.svg`, its shapes were hand-
      inlined into `cabinet-v3-layout.js` as literal path data (per that
      file's own v3.7 comment); moved with Group B as a design-source
      companion, no code reference to update.

      Each group moved, cross-imports rewritten, then gated: both
      TSV->JS builds clean, `mkdocs build --strict` exit 0,
      `build-static.mjs` rebuild byte-identical (Groups A/B) or with only
      the exact expected path-line diff (Group C), zero console/request
      errors on a real headless render of every touched entry point
      (`dev-tool/islands-tool.html`, `landing-v3/index.html`). After
      Group C, `docs/index.html` re-promoted with the same asset-path
      rewrite this system has always needed (`shared/cabinet-v3-*` ->
      `assets/{css,js}/cabinet-v3-*`) -- including a stale comment at
      `docs/index.html:16` this pass also fixed (`cabinet-v3-style.css`
      -> `assets/css/cabinet-v3-style.css`, matching `ed45d15`'s
      established convention). Zero console/request errors on the real
      promoted `docs/index.html`, compass-rose screenshot confirms all
      four points still render identically to the `#131` baseline.

</details>

<details>
<summary>#133</summary>

- [x] **#133** Reorg 5/5 -- two loose ends, neither auto-actioned:
      `content/now.tsv.bak` (untracked stray backup, likely disposable --
      confirm not read by `tools/build-now-content.js` before deleting)
      and `docs/3dp/GCodeBending.md` (untracked, possibly in-progress
      content -- ask before touching). -- **Done, 2026-08-29**: confirmed
      `tools/build-now-content.js` only ever reads `content/now.tsv`,
      never the `.bak`; deleted on explicit confirmation.
      `docs/3dp/GCodeBending.md` left untouched on explicit instruction --
      still untracked, still there. `node tools/build-now-content.js` and
      `mkdocs build --strict` both clean after the deletion.

</details>

**Reorg closed, 2026-08-29.** All five items (`#129`-`#133`) done and
pushed to `main`. `pre-file-reorg` (tag, `06a3813`) remains as a
rollback point if anything surfaces later that this pass's
verification gates didn't catch.

<details>
<summary>#134</summary>

- [x] **#134** Follow-up reorg, same day: gather root-level project
      documentation into `documentation/`, and fix a real inconsistency
      the file-by-file review that prompted this surfaced --
      `dragon.svg` sat alone at repo root while its exact analog,
      `compass_rose.svg`, had already moved to `landing-v3/layout-engine/`
      in `#132`, for no real reason (an oversight, not a deliberate
      split -- both are hand-inlined source art, neither loaded at
      runtime). Direct request, with two hard constraints identified
      first: `README.md` can't move (git/GitHub root-rendering
      convention) and `WORLD-SYSTEMS.md` can't move alone (byte-identical
      duplicate across Cabinet/Bookshelf/fffx, path assumed the same in
      all three). Also directly asked and answered before moving
      anything: whether `Landing-page-notes.2.0.md` and
      `conversation-landing-page-v3.md` are actually redundant despite
      covering the same period -- read both in full rather than assumed;
      they're not (reference/changelog vs. narrative process log, and
      the latter's own "documentation survey" section states the
      non-duplication policy directly). **Done, 2026-08-29**: moved
      `NOW-PAGE.md`, `Landing-page-notes.2.0.md`,
      `conversation-landing-page-v3.md`, `FILE-MANIFEST.md`,
      `now-page-helpers/` (whole folder -- see below, this *is* its
      relocation, content consolidation still separately deferred), and
      `landing-v3/`'s four documentation files (into a new
      `documentation/landing-v3-notes/` subfolder, kept near each other
      rather than flattened into `documentation/` directly, per direct
      request) into `documentation/`; `dragon.svg` joined
      `compass_rose.svg` in `landing-v3/layout-engine/`. Reference-fixing
      pass: every real markdown-link-syntax reference repo-wide checked
      and fixed (2 found), every code-comment "see X for details"
      pointer in the v3 dev sources and Now-page tooling updated (~50
      occurrences across 18 files, via scoped substitution after manually
      reading every occurrence's context first -- none were ambiguous),
      the promoted `docs/assets/` twins of every edited `landing-v3/shared/`
      file re-synced, `docs/index.html` re-fixed the same way it was in
      `#132`. Left as bare filename mentions in prose (not literal
      broken links, matches this repo's own established citation
      convention): the many casual "see NOW-PAGE.md" / "see
      Landing-page-notes.2.0.md" references inside `documentation/*.md`
      themselves. `FILE-MANIFEST.md` rewritten to match both the new
      paths and the corrected Landing-page-notes/conversation-log
      understanding. Full gate green: TSV builds clean, `mkdocs build
      --strict` exit 0, `build-static.mjs` rebuild diff was exactly the
      expected comment-only lines, zero console/request errors on both
      `docs/index.html` and `landing-v3/dev-tool/islands-tool.html`.

Deliberately out of scope, confirmed intentional rather than
overlooked: `landing-v3/dev-screenshots/` (the established per-version
screenshot convention), `landing-v3/archive/v3.6/` (a real, referenced
comparison snapshot, linked from the static page's own footnote),
`review/` (already correctly scoped by `.gitignore`), `docs/now.html`/
`docs/now.md` coexisting (already documented as intentional in
`NOW-PAGE.md`), and `now-page-helpers/`'s own *content* -- its location
moved in `#134` above, but whether to keep/edit/split/append its three
files is still deferred to a future documentation-consolidation pass,
by direct request. Renaming `landing-v3/` itself was also discussed and
raised no functional blocker (nothing executable hardcodes the name --
only ~9 docs reference it in prose) but was not requested; not tracked here
unless it is.

</details>

---

## Phase 3A -- Short-Term / Already Underway

*Goal: finish and surface work that is already substantially in
progress. Principle: low-effort, high-value work that makes existing
projects visible and complete.*

Across all three worlds:

- [ ] **#87** Complete near-finished projects
- [ ] **#88** Link existing but currently unlinked pages
- [ ] **#89** Add obvious missing entries/sections to TSVs
- [ ] **#90** Add current independent repos to Cabinet assembly
- [ ] **#91** Fill small metadata/thumbnail gaps
- [ ] **#92** Clean up cross-world links

**Cabinet**
- [ ] **#93** Current Teaching pages
- [ ] **#94** Student Work
- [ ] **#95** Near-finished galleries
- [ ] **#96** Existing Travel material
- [ ] **#97** Active standalone project integrations

**Bookshelf**
- [ ] **#98** Existing writing/interactives already represented in the
      current structure
- [ ] **#99** Strengthen links to current static projects and content pages
- [ ] **#100** Finish easy dormant/WIP entries where source material already
      exists

**FFFX**
- [ ] **#101** Prioritize current WIP portals and already-active
      computational/generative projects before inventing new categories

---

## Phase 3B+ -- Long-Term Development

*Goal: treat all three worlds as ongoing publishing systems rather than
projects waiting to be "finished." These stay unchecked indefinitely by
nature -- add new items as they emerge rather than expecting this
section to empty out.*

**Cabinet**
- [ ] **#102** Add new Teaching material
- [ ] **#103** Expand Student Work
- [ ] **#104** Add Travels and Galleries
- [ ] **#105** Integrate new independent repos
- [ ] **#106** Refine V3 visuals as real content stresses the layout

**Bookshelf**
- [ ] **#107** Add writing/research entries
- [ ] **#108** Expand interactive reading/timeline projects
- [ ] **#109** Refine curation, metadata and visual treatments
- [ ] **#110** Explore longer-term alternate views or filters

**FFFX**
- [ ] **#111** Complete WIP portals
- [ ] **#112** Add new computational/generative work
- [ ] **#113** Consolidate and document experiments
- [ ] **#114** Refine sections, taxonomy and visual systems

**Cross-world**
- [ ] **#115** Improve shared schema conventions where useful
- [ ] **#116** Improve cross-linking and discovery
- [ ] **#117** Automate child-repo rebuild triggers
- [ ] **#118** Consider Atlas -> public-site tooling
- [ ] **#119** Improve search, accessibility, performance and metadata
- [ ] **#120** Use Cloudflare routing only where a future project genuinely
      needs it

<details>
<summary>#121</summary>

- [x] **#121** Organize local files for v3 -- `landing-v3/` has accumulated
      dev/test artifacts alongside the real prototype over ~60 versions
      (`islands-tool.html`, `archive/` (old per-version copies),
      `v3-scheme-candidates.md`, various one-off test HTML) with no pass
      yet to sort what's still needed for the live build vs. what's
      historical/dead weight. **Done as a side effect of the Cabinet
      file/folder reorganization (`#129`-`#134`), confirmed 2026-08-30**:
      `landing-v3/` top level re-checked directly against this item's own
      wording -- `islands-tool.html` moved into `dev-tool/` (`#132`),
      `v3-scheme-candidates.md` moved into
      `documentation/landing-v3-notes/` (`#134`), no loose one-off test
      HTML remains at the top level. `archive/` and `dev-screenshots/`
      stay, unchanged -- both already confirmed intentional, referenced
      snapshots, not dead weight (`#134`'s own "deliberately out of
      scope" note).

</details>

<details>
<summary>#122</summary>

- [x] **#122** Consolidate documentation for v3 vs. all of Cabinet --
      `Landing-page-notes.2.0.md`/`conversation-landing-page-v3.md` (v3-
      prototype-specific) and `three-world-launch-phases-ToDo.md`/`-Notes.md`
      (whole-Cabinet/Bookshelf/FFFX) already overlap in places (this file's
      own intro note admits it was two documents smashed together once
      already, 2026-08-23) -- worth a real pass on what belongs where
      before the overlap gets worse. **Done as a side effect of the
      documentation-folder move (`#134`), confirmed 2026-08-30**: the
      location split happened there (v3-specific docs grouped into
      `documentation/landing-v3-notes/`, whole-Cabinet docs directly in
      `documentation/`), and the overlap question was directly
      investigated, not assumed -- `Landing-page-notes.2.0.md` and
      `conversation-landing-page-v3.md` were read in full and found NOT
      redundant (reference/changelog vs. narrative process log; see
      `FILE-MANIFEST.md`'s entry for both). "A real pass on what belongs
      where" is exactly what that review was.
      **Correction, 2026-08-30**: the location split described above
      wasn't actually clean -- this file, `-Notes.md`, and
      `cabinet-multi-repo-assembly-concept-note-short.md` (whole-Cabinet,
      not v3-specific) got swept into `documentation/landing-v3-notes/`
      as collateral from the same batched `git mv`, not placed there on
      purpose. Caught on direct question and moved to `documentation/`
      root, where this note originally (and correctly) said they'd be.

</details>

<details>
<summary>#123</summary>

- [x] **#123** New Fab section -- **done, 2026-08-24** (#27 intercession):
      `cabinet-sections.tsv` gained a `fab` region (weight 2, `wip`) with
      four entries -- Fab Academy (`https://fabacademy.org/`), Fab 23
      ("Jesal's FabAcademy Chronicles", the confirmed personal 2023 page),
      Fab 26 (Fabricademy 2026 -- a different sister program than Fab
      Academy, confirmed via the `class.textile-academy.org` domain, not
      guessed), and Fabricademy itself (still no confirmed general/public
      URL -- `textile-academy.org` root vs. a separate `fabricademy.net`
      is unresolved, left blank rather than guessed). `mkdocs.yml` gained
      a matching `Fab` nav section. Corrected a wrong assumption made
      while scoping this: `cabinet-sections.tsv`'s `cx`/`cy`/`rx`/`ry`
      columns are NOT authoritative fixed positions (see #69's own
      correction) -- `cabinet-v3-layout.js` computes section placement
      live via `squarify()`, keyed only on `weight`. Confirmed by
      actually adding this section and watching the treemap reflow
      on its own: no manual layout work needed, screenshot showed all 4
      Fab islands rendered correctly on the first build. `mkdocs build`
      clean, Playwright confirms zero console errors.

</details>

<details>
<summary>#124</summary>

- [x] **#124** Screenshot review workflow -- **done, 2026-08-24**: direct
      feedback that review screenshots were "after"-only (no before) and
      sat in the session scratchpad instead of somewhere easy to reach.
      New `review/` folder (repo root, gitignored except its own
      `README.md`) for ephemeral before/after review pairs -- added to
      proactively while working, not just on request. **Correction, same
      day**: initially also created a new `dev-archive/` folder for
      permanent feature-history screenshots, without checking whether an
      equivalent already existed -- it did, `landing-v3/dev-screenshots/`
      (56+ files, established `vX.Y.Z-description.png` naming, in use
      since early in v3's development). Removed the redundant folder,
      corrected `review/README.md` and the saved workflow memory to
      point at the real one. Where MkDocs-side or other non-v3
      screenshots without an obvious existing home should live is still
      open -- folded into #125 below rather than decided ad hoc.

</details>

<details>
<summary>#125</summary>

- [x] **#125** Organize files of v3, MkDocs, and stray leftover versions --
      direct request, 2026-08-24, broader than #121 (v3-only): #121 was
      scoped to `landing-v3/`'s own accumulated dev/test artifacts
      (`islands-tool.html`, `archive/`, test HTML); this extends the same
      pass to MkDocs-side files (`docs/stylesheets/`, `docs/assets/`,
      wherever else things have piled up) and to "stray versions
      leftover" generally -- prompted directly by #124's own mistake
      (creating a redundant `dev-archive/` without checking whether
      `landing-v3/dev-screenshots/` already covered it), which is exactly
      the kind of thing this pass should catch and prevent. **Done as a
      side effect of the Cabinet file/folder reorganization (`#129`-`#134`),
      confirmed 2026-08-30**: `docs/assets/css/`, `docs/assets/js/`, and
      `docs/stylesheets/` re-checked directly -- no dead v1/v2 leftovers
      (those four files `#130` deleted stay gone), only real,
      currently-referenced files in each. Combined with `#121`'s
      confirmation above, both the v3-only and MkDocs-side halves of this
      pass are covered.

</details>

<details>
<summary>#126</summary>

- [x] **#126** Split up documentation coherently -- direct request,
      2026-08-24, related to but not the same ask as #122
      (consolidate v3-specific vs. whole-Cabinet docs): #122 is about
      overlap between documents that shouldn't both cover the same
      ground; this is about whether any SINGLE document has grown too
      large/mixed-purpose and should be split into coherently-scoped
      pieces (this ToDo file itself is a candidate -- Phase 0-3 plus a
      Content Inventory reference table plus a 120+ item numbered
      sequence, all in one file). Do both passes together once started,
      not #122 then #126 as fully separate efforts -- splitting and
      consolidating are the same underlying question (what belongs
      where) approached from opposite directions.
      **First cut done, 2026-08-30, direct request ("split the ToDo
      file, get the Content Inventory out")**: the Content Inventory
      section (below) pulled out of this file and replaced by a
      generated file, not just relocated -- see that section's own note
      for why generating it beat moving it verbatim. The rest of this
      item (whether Phase 0-3's ~137-item sequence itself should also
      split into separate files) is still open, not done here -- scoped
      down to the one piece that was both easiest and most actively
      going stale.

</details>

<details>
<summary>#127</summary>

- [x] **#127** Branch hygiene: mirror a stray cross-machine session's work to
      `main`, revert it on `landing-v3-prototype`, strip co-author
      trailers on both -- **done, 2026-08-25**: another machine had
      pushed 3 commits (Algorithm Bench + v3-history archive, colophon
      links, the 4 compass points wired) straight to
      `landing-v3-prototype` without merging to `main`, even though they
      touched live-site content (`docs/`, `content/cabinet-entries.tsv`),
      not just prototype work. Cherry-picked all 3 onto a clean branch,
      amended each message to drop its `Co-Authored-By: Claude` trailer
      (tree verified byte-identical to the originals), force-pushed as
      the new `landing-v3-prototype` tip, merged cleanly into `main`.
      Reverted the same 3 (now-clean) commits on `landing-v3-prototype`
      in one commit, verified via an empty `git diff` against the last
      known-good commit that its tree matches exactly. Only one other
      machine touches this repo and a rebase there was confirmed fine,
      so the force-push was authorized rather than avoided.

</details>

<details>
<summary>#128</summary>

- [x] **#128** Swatch Fields and Tracery Bots assembled onto the custom
      domain instead of linking straight to `jesmehta.github.io` --
      **done, 2026-08-27**, direct question ("Are there any links...
      that would show up as a github page in someone's browser?") turned
      up 5 spots: Swatch Fields' two nav listings (Machines & Makings,
      Interfaces Data & Texts) and two map entries, plus Tracery Bots'
      two sub-pages (Trippy Gourmet, Mad Solutionist) including the
      iframe in `docs/traceryBots.md` and the orphaned
      `docs/trippyGourmet.md`. Extended `deploy.yml` with the same
      Checkout/Assemble/Validate pattern as #43/#71
      (`jesmehta/swatchFields` -> `public/swatch-fields/`,
      `jesmehta/TraceryBots` -> `public/tracery-bots/`, whole repo so
      both bot subfolders come along), each Validate step checking a
      real content file beyond `index.html`. `mkdocs.yml` and the
      `cabinet-entries.tsv` `swatch-fields`/`swatch-fields-interfaces`
      rows now point at `cabinetofcuriosities.in/swatch-fields/` and
      `.../tracery-bots/<Bot>/`. Verified with a local `mkdocs build`
      that the new URLs land correctly in the rendered nav and iframe.
      Not touched: `docs/dotMandalaTool.md`'s iframe (a third repo,
      outside this request's scope).
      Also fixed in passing: #125/#126 above had ended up trapped inside
      #123's collapsed `<details>` block from an earlier editing pass --
      both are still open items, not done, so shouldn't have been
      hidden; moved the closing tag back to right after #124.

</details>

- [ ] **#135** Roll out Cloudflare Web Analytics to Bookshelf and FFFX --
      Cabinet's own beacon is done, 2026-08-29 (see
      `cloudflare-web-analytics-setup.md` and
      `cloudflare-js-snippet.md` (same directory) for the token/snippet): `mkdocs.yml`
      gained `theme.custom_dir: overrides`, a new `overrides/main.html`
      extends `base.html`'s `extrahead` block so every MkDocs-generated
      page gets the beacon in one place (not hand-added per Markdown
      file), and the standalone `docs/index.html` landing page got the
      same script tag added directly to `landing-v3/index.template.html`
      (its hand-edited source, so it survives the next `build-static.mjs`
      + promote cycle) and, for now, to the already-promoted
      `docs/index.html` too so tracking is live without forcing an
      immediate full rebuild. `TheBookshelfOfCuriosities` and
      `form-follows-fx` are separate repos with their own `mkdocs.yml` --
      same two-part pattern applies there (MkDocs template override +
      each site's own standalone/custom pages, if any), using each site's
      own Cloudflare Web Analytics token, not Cabinet's.
- [ ] **#136** Same beacon rollout for other external repos assembled into
      Cabinet/Bookshelf/FFFX at deploy time (the `deploy.yml`
      checkout-and-copy pattern from #43/#71/#128: Working with AI,
      Prompt Generator, Oblique Strategies, Swatch Fields, Tracery Bots,
      and any future additions) -- each is its own standalone repo/site,
      so each needs the beacon added directly to its own page(s)/shared
      template, with its own Cloudflare Web Analytics token if tracked as
      a distinct property, rather than inheriting Cabinet's mkdocs
      override.
- [ ] **#137** Speculative, not on the drawing board yet: a finer tier of
      map entries on the island coast (or similar), a level below the
      existing section-level plaques -- planned very early on in v3's
      design, direct note 2026-08-30 while closing `#26`: "I may yet want
      a system where the islands have a further set of entries on the
      island coast etc, as planned very early on, but that is currently
      not even on the drawing board." Explicitly NOT the same thing as
      `#26`'s now-closed `callout-card`/`leaderTo` mechanism (that v2-era
      implementation is dead for good) -- logged separately so the live
      idea doesn't stay tangled up with the dead mechanism. No design yet
      -- needs one before anything else.
- [ ] **#138** Update the "Data -> Map -> Page" diagram (hand-made by the
      maintainer via Claude web,
      `https://claude.ai/code/artifact/b69fceba-1590-4897-8c13-75a61bcf7f46`)
      and bring a copy into this repo instead of it only living on
      claude.ai. It currently ends at "index.html, frozen snapshot" via
      `build-static.mjs` -- doesn't show the `docs/` promotion step at
      all, since it predates `landing-v3/promote.mjs` (added 2026-08-30,
      see this file's own `#132`-adjacent history and
      `documentation/landing-v3-notes/Landing-page-notes.2.0.md`). Update
      should add a
      Stage 6 (or fold into Stage 5): `promote.mjs` reading
      `landing-v3/index.html` + `landing-v3/shared/*`, rewriting the
      known dev-relative asset paths, writing `docs/index.html` +
      `docs/assets/{css,js}/`, then a headless-Chromium verify pass --
      matching the real flow documented in `documentation/
      cabinet-editor/CABINET-EDITOR.md`-adjacent tooling notes and the diagram's own
      existing "manual step" (dashed-arrow) convention, since promotion
      is exactly that: manual, dashed. The diagram's own Mermaid source is
      recoverable from the artifact's page HTML if bringing it in as a
      real `.mmd`/embedded-in-Markdown diagram rather than a screenshot.
      Once in-repo, update its link in `tools/admin-controls-ui/index.html`
      (currently points at the claude.ai artifact directly, tagged
      "diagram, Claude artifact") to point at the local copy instead.

---

## Content Inventory -- Pages, Entries & Their Statuses

**Superseded, 2026-08-30 (#126).** This used to be a hand-maintained
table (last regenerated by hand 2026-08-24) -- and it had already gone
stale twice by the time it was replaced (the Compass rows after `#73`
resolved, the Now-page word count after the `/now` overhaul), which is
exactly the failure mode of anything living here that has to be
hand-patched to stay true. Replaced by
[`documentation/CONTENT-INVENTORY.md`](../CONTENT-INVENTORY.md),
auto-generated by `tools/generate_sitemap.py` directly from
`content/cabinet-sections.tsv`, `content/cabinet-entries.tsv`, and
`mkdocs.yml`'s own nav tree -- re-run the script to refresh instead of
hand-checking every branch. Cross-world (Bookshelf/fffx) entry status is
what `/sitemap/` is for, generated by the same script -- not duplicated
in either place.

Two things the old table caught that the generated version can't (there
being no TSV row and no nav entry means there's nothing left to
cross-reference against) -- kept here as plain notes since they're
rare-to-change facts, not something that needs a status table:

- `docs/fffx/*.md` -- five files (`fffx.md`, `particleSystems.md`,
  `100Gradients.md`, `VeraMolnarRetrospective.md`, `PackingShapes.md`)
  orphaned from nav since `#72`; two have real content
  (`VeraMolnarRetrospective.md` 311w, `PackingShapes.md` 819w), worth
  migrating into the fffx repo itself (`#85`) rather than left stranded
  here.
- `docs/3dp/GCodeBending.md` -- untracked, 825w real content, not wired
  into any TSV row or nav entry yet (`#133` left it alone on request).
