# Cabinet / Bookshelf / FFFX -- Launch Phases To-Do

## Table of contents

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

Live checklist. Check items off as they land; don't renumber or reorder
on completion -- history matters more than a tidy list. Companion files:

Phase 0's punch list (all three subsections below, 2026-08-23) carries a
stable `**#N**` tag right after each item's checkbox, so items can be
referred to by number ("#12") instead of by description. Assigned once,
in the order items appeared at the time -- a NEW item added later gets
the next unused number appended wherever it's inserted in the list, it
does NOT trigger a renumber of anything else, same "history matters"
reasoning as the no-renumbering rule above. Only Phase 0 is tagged this
way for now.

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

## Phase 0 -- v3-prototype punch list

Pre-launch prototype work: `islands-tool.html` / `cabinet-v3-*.js`
feature and visual-polish items. Not prioritized or sequenced -- pick
freely.

### Punch list (sea serpent through colophon)

- [x] **#1** Sea-serpent redesign -- **done, v3.6.24**: the blocker was the
      reference itself, resolved by the user supplying one directly
      (`dragon.svg`) rather than a hand-drawn sketch. 1-3 independent
      sea-dragon wanderers, noise-driven movement, coastal avoidance,
      event-triggered dive/resurface. The arc-based v1 attempt
      (`cabinet-v3-seaserpent.js` / `_test-serpent.html`) stays
      untracked, unused, not deleted -- superseded, not merged into
      this.
- [ ] **#2** Water wave-line texture -- on hold pending a reference image (v2's
      own wavelines weren't visible/legible as a reference on their
      own).
- [x] **#3** Boats sailing in smooth flows (not randomly moving) -- the
      original attempt was reverted after an unresolved Chromium
      `<use>`/`<symbol>` rendering bug. **Done, v3.6.17-v3.6.21**, via a
      different mechanism that sidesteps that bug entirely: plain
      `<ellipse>`+`<line>` particles (no `<use>`/`<symbol>`), advected
      along the flow field below. See next item.
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
- [x] **#5** islands-tool idea: a control to re-roll/regenerate the circle
      centres and packing stage itself -- done, v3.6.8: "Reroll
      positions" button, Layout section.
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
- [x] **#7** islands-tool idea: give the topology noise contour bands
      (`seaBandThresholds`/`sandThresholds`/`vegThresholds`) their own
      panel section -- done, v3.6.9: "Topological offset parameters" in
      the Visuals section, one slider per array element.
- [x] **#8** Strengthen centroid gathering further -- push `centerBias` harder
      if islands should cluster tighter still -- **counted done**: a
      live slider exists (v3.6.8, Layout section) so this is now a
      direct try-values-and-judge action, not something blocked on more
      code.
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
- [x] **#10** A real pass on fonts, colours, sizes, and readability --
      **done, v3.6.12-v3.6.13** (header type/size, section-label size,
      island-label legibility, live-switchable) **-- marked fully done
      per direct confirmation, 2026-08-23.** The map's overall colour
      scheme itself (sea/sand/veg band hues, ink tones) is still the
      original first-guess palette from v3.6.5, technically untouched --
      noted here rather than silently dropped, but no longer blocking
      this item.
- [ ] **#11** Other small details -- compass rose, easter eggs, etc. --
      **partially done, 2026-08-23**: the compass rose itself is real,
      themed, and functional (see the v3.7.1-v3.7.8 changelog entries).
      The "easter eggs" half is still open -- see #21 below, the one
      concrete easter-egg idea currently on record.
- [x] **#12** Expand the canvas to full-bleed window size -- **done, v3.6.10.**
      Adapts to the viewport ONCE at load, not on a live drag-resize
      afterward.
- [x] **#13** Fold the "Cabinet of Curiosities" heading + intro text into the
      map itself -- **done, v3.6.10, reverted v3.6.12.** v3.6.12 put it
      back in a normal top-of-page row instead (real `<h1>`/`<p>`
      matters for crawlers/screen readers in a way JS-drawn SVG text
      doesn't). Still real, unchanged HTML either way.
- [x] **#14** Refine the header itself -- **done, v3.6.12**: title/tagline
      wording, typography/look-and-feel (larger H1, sits directly on the
      full-bleed sea colour instead of a card), position (top row).
      H1-scale-mismatch sub-question moved to the next item, unresolved.
- [ ] **#15** Still open: resizing the window scales the map's own text via the
      SVG viewBox, but the real HTML `<h1>`/tagline don't scale with it,
      since they sit outside the SVG entirely. Undecided which of three
      options to take: scale it with the map, clamp its size within a
      range, or leave it fixed as-is (current behaviour, by default
      rather than decision).
- [x] **#16** Idea: the compass rose (or similar map ornamentation) could BE the
      About Me / Contact Me links, rather than those existing as regular
      islands -- see the doc-audit item below (WORLD-SYSTEMS.md's
      FabAcademy-is-not-a-world rule) for a directly relevant constraint
      on what About Me should even link to. **Marked done per direct
      confirmation, 2026-08-23** -- the compass rose's own direction
      labels are the real link targets now (`kind: compass-direction`
      entries in `content/cabinet-entries.tsv`; see #24 below for the
      commit that moved the old CV entry onto this same mechanism).
- [x] **#17** Merge branches -- **superseded by Phase 1's "Promote
      landing-v3-prototype into the production Cabinet structure" and
      the Branch/production transition checklist below -- marked done
      here, tracked there instead.**
- [ ] **#18** Create a history section and place archival pages there --
      `archived-landing-pages/` already exists as a filesystem
      convention; this is about giving it a real, linked home on the
      site itself, not just a folder.
- [ ] **#19** Launch the page -- **superseded by Phase 1 below.**
- [ ] **#20** Write the colophon and creation notes.

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
- [ ] **#25** Verify fffx's DNS/CNAME is actually live before treating fffx
      links from Cabinet as production (no committed `CNAME` confirmed
      as of the v2.1 follow-up that raised this).
- [ ] **#26** `DESIGN-SYSTEM.md`'s `callout-card` layout (external placement,
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
- [ ] **#27** `WORLD-SYSTEMS.md` standing rule: FabAcademy/Fabricademy
      documentation sites are NOT Level-1 worlds and should not become
      Cabinet islands -- link them from About Me or a relevant
      essay/reflection page instead, if at all. Bears directly on the
      compass-rose/About-Me idea above and on the history-section item
      above.
- [x] **#33** Update `index.html` to match current development -- the shipped
      static build needs to reflect everything landed on
      `islands-tool.html`/the dev panel. **Done** -- `42c5734 build:
      regenerate index.html for v3.7.23-v3.7.30` postdates every code
      commit from that phase (Land 5, shadow taper, Diagnostics, z-order
      fix, dragon fix, theme defaults); no code commits have landed
      since.

### Additional ideas -- visual/theme work extras (optional, not launch-critical)

Session additions (2026-08-23), moved here from wherever they first
landed -- not required for launch, not from the original v3.6.6 doc
audit either, but closely related to/stemming from the visual and
theme work above rather than the Phase 1 launch work below. Numbers
carried over unchanged from wherever each item started (see this file's
own numbering note near the top) -- a move, not a re-add.

- [ ] **#21** Easter egg: clicking within the compass rose's inner circle
      switches the WHOLE canvas's theme, Medieval <-> Topology, and back
      on a second click. Direct request: "Its too nice a piece of work to
      be seen only in bits." Depends on the theme x hover feature (now
      built, v3.7.32-v3.7.44 above) enough to make sense built after it,
      not before -- same two themes, same colour data, just a
      click-triggered whole-canvas swap instead of a hover-scoped local
      one.
- [ ] **#28** Backport Cabinet's newer `WORLD-SYSTEMS.md` to the Bookshelf (and
      fffx, if accessible) sibling repos -- Bookshelf's copy is stale
      (still describes Cabinet as having no islands of its own, and
      carries TODOs that Cabinet's own build already satisfies).
- [ ] **#29** Compass rose rotation: the rose (and the diagonals radiating from
      its centre, so they keep matching its ordinal arms) rotates
      anticlockwise -- either at random or triggered by approach/hover
      -- for one full revolution. Direct request, logged as a to-do
      rather than implemented immediately.
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
- [x] **#31** Merge themes x hover -- **meaning corrected by the user, not yet
      re-explained.** Not "reconcile hover CSS across theme presets"
      (that was a wrong guess, struck from scope). Actual intent still
      TBD, placeholder title only -- **marked done per direct
      confirmation, 2026-08-23**, superseded by the theme x hover
      mechanism itself now being complete (v3.7.32-v3.7.44 above);
      whatever this placeholder was originally meant to track no longer
      needs separate action.
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

---

## Phase 1 -- Go for Launch

*Goal: get all three worlds publicly coherent, stable, and navigable.
Launch threshold: all three worlds feel intentional and usable; visible
doors lead somewhere meaningful; no major navigation or deployment
failures remain.*

### Cabinet

- [ ] Finish the V3 landing-page launch pass:
  - [x] integrate sea serpent -- done, v3.6.24 (Phase 0 above)
  - [ ] final colour/type choice (Phase 0 above -- partially done, the
        map's overall colour scheme is still on hold)
  - [ ] fix obvious label overflow on the map itself (distinct from the
        doc-audit item above about production-page card/label overlap)
  - [ ] decide whether flowfield/particle boats ship in the production
        build or are consciously deferred (currently
        `islands-tool.html`-only, see Phase 0 above)
  - [ ] desktop/mobile QA
- [ ] Promote `landing-v3-prototype` into the production Cabinet
      structure (see the Branch/production transition checklist below,
      and `three-world-launch-phases-Notes.md` for why this is a normal merge, not a
      default-branch switch)
- [ ] Align the landing-page hierarchy with `mkdocs.yml`
- [ ] Finish essential personal pages: About Me, Contact, any other page
      necessary for the site to feel complete at launch
- [ ] Implement the first multi-repo assembly, beginning with Working
      with AI (see `three-world-launch-phases-Notes.md` for the mechanism)
- [ ] Change public links from Working with AI's external GitHub Pages
      URL to the Cabinet-local path once assembled and tested

### Branch / production transition

- [ ] Complete and test V3 on `landing-v3-prototype`
- [ ] Test the Working with AI assembly there without replacing the
      current production site
- [ ] Tag/archive the current `main` state before launch (see Phase 0's
      "create a history section" item -- give archived pages a real
      linked home, not just a tag)
- [ ] Merge `landing-v3-prototype` into `main`
- [ ] Ensure the Pages workflow is triggered from `main`
- [ ] Deploy the assembled `public/` artifact from `main`

### Bookshelf + FFFX

- [ ] Review both repos for last-minute updates
- [ ] Audit current section/entry TSVs against work that already exists
- [ ] Link any obvious existing work that should already be represented
- [ ] Verify current standalone pages/interactives and subdomain
      deployment

*Don't hold launch for unfinished/WIP entries that are intentionally
marked as such.*

### Cross-world launch checks

- [ ] Verify Cabinet, Bookshelf and FFFX link to each other correctly
- [ ] Verify custom domains/CNAMEs (fffx's specifically: see the
      doc-audit item above)
- [ ] Check visible landing links, MkDocs navigation, nested routes and
      assets
- [ ] Confirm failed builds do not replace the last successful live
      deployment
- [ ] Merge/tag/deploy the launch version

---

## Phase 2 -- Immediately After Launch

*Goal: complete the obvious structural gaps and make the three-world
system easy to maintain. Threshold: the sites are not just launched;
they are maintainable, documented and structurally complete enough for
routine publishing.*

- [ ] Add/finish fuller About/site-context pages
- [ ] Colophon (Phase 0 above)
- [ ] Site Notes where useful
- [ ] At least a basic landing/overview page for every active top-level
      section
- [ ] Link existing pages/projects that were not essential enough to
      block launch
- [ ] Continue selective migration of worthwhile older Cabinet content
- [ ] Expand Cabinet multi-repo assembly beyond Working with AI: Student
      Work, Rock Collection, Dupatta Collection, other substantial
      independent projects
- [ ] Build TSV editors for Cabinet, Bookshelf, FFFX (see
      `three-world-launch-phases-Notes.md` for requirements)
- [ ] Generalize Cabinet assembly into a manifest-driven workflow so
      additional repos can be mounted through configuration rather than
      hard-coded workflow steps
- [ ] Add automatic rebuild triggers from child repos (only after the
      basic assembly is stable)
- [ ] Add stronger validation before deploy
- [ ] Normalize duplicated documentation where Bookshelf/FFFX docs have
      drifted (see the doc-audit item above)
- [ ] Replace obvious placeholder metadata/thumbnails where easy (see
      the doc-audit item above)

---

## Phase 3A -- Short-Term / Already Underway

*Goal: finish and surface work that is already substantially in
progress. Principle: low-effort, high-value work that makes existing
projects visible and complete.*

Across all three worlds:

- [ ] Complete near-finished projects
- [ ] Link existing but currently unlinked pages
- [ ] Add obvious missing entries/sections to TSVs
- [ ] Add current independent repos to Cabinet assembly
- [ ] Fill small metadata/thumbnail gaps
- [ ] Clean up cross-world links

**Cabinet**
- [ ] Current Teaching pages
- [ ] Student Work
- [ ] Near-finished galleries
- [ ] Existing Travel material
- [ ] Active standalone project integrations

**Bookshelf**
- [ ] Existing writing/interactives already represented in the current
      structure
- [ ] Strengthen links to current static projects and content pages
- [ ] Finish easy dormant/WIP entries where source material already
      exists

**FFFX**
- [ ] Prioritize current WIP portals and already-active
      computational/generative projects before inventing new categories

---

## Phase 3B+ -- Long-Term Development

*Goal: treat all three worlds as ongoing publishing systems rather than
projects waiting to be "finished." These stay unchecked indefinitely by
nature -- add new items as they emerge rather than expecting this
section to empty out.*

**Cabinet**
- [ ] Add new Teaching material
- [ ] Expand Student Work
- [ ] Add Travels and Galleries
- [ ] Integrate new independent repos
- [ ] Refine V3 visuals as real content stresses the layout

**Bookshelf**
- [ ] Add writing/research entries
- [ ] Expand interactive reading/timeline projects
- [ ] Refine curation, metadata and visual treatments
- [ ] Explore longer-term alternate views or filters

**FFFX**
- [ ] Complete WIP portals
- [ ] Add new computational/generative work
- [ ] Consolidate and document experiments
- [ ] Refine sections, taxonomy and visual systems

**Cross-world**
- [ ] Improve shared schema conventions where useful
- [ ] Improve cross-linking and discovery
- [ ] Automate child-repo rebuild triggers
- [ ] Consider Atlas -> public-site tooling
- [ ] Improve search, accessibility, performance and metadata
- [ ] Use Cloudflare routing only where a future project genuinely needs
      it
