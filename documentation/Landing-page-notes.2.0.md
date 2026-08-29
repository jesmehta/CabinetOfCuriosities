# Notes: the v3 landing-page layout prototype (`landing-v3/`)

## Table of contents

- [Intent](#intent)
- [Relationship to fffx's layout (read this first if you haven't seen](#relationship-to-fffxs-layout-read-this-first-if-you-havent-seen)
- [Design decisions from the conversation](#design-decisions-from-the-conversation)
  - [Section weight is computed, not authored](#section-weight-is-computed-not-authored)
  - [Extras: schema-controlled composition, not per-load randomness](#extras-schema-controlled-composition-not-per-load-randomness)
  - [Real content, not synthetic data](#real-content-not-synthetic-data)
  - [Region squareness relaxed; growth-based packing ported from the](#region-squareness-relaxed-growth-based-packing-ported-from-the)
  - [Split modules, fffx-shaped](#split-modules-fffx-shaped)
- [Three pages (`index.html`, `islands-tool.html`, `archive/`)](#three-pages-indexhtml-islands-toolhtml-archive)
- [Static build (`build-static.mjs`, v3.6.2)](#static-build-build-staticmjs-v362)
- [How the layout is built (`cabinet-v3-layout.js`'s `render()`)](#how-the-layout-is-built-cabinet-v3-layoutjss-render)
- [How archipelagos are packed (`cabinet-v3-circlepack.js`)](#how-archipelagos-are-packed-cabinet-v3-circlepackjs)
  - [Why growth-based packing, not v3.0's row-flow](#why-growth-based-packing-not-v30s-row-flow)
  - [Fewer, plainer extras (v3.3)](#fewer-plainer-extras-v33)
- [How coastlines are traced (`cabinet-v3-islandshape.js`, v3.5)](#how-coastlines-are-traced-cabinet-v3-islandshapejs-v35)
  - [Circular vs. lobed silhouettes (v3.5.1 - v3.5.4)](#circular-vs-lobed-silhouettes-v351---v354)
  - [Domain warping for real concavity (v3.6)](#domain-warping-for-real-concavity-v36)
  - [Falloff tuning: "most of the circle is the island"](#falloff-tuning-most-of-the-circle-is-the-island)
  - [Fusion behaviour](#fusion-behaviour)
- [Verification](#verification)
- [Known limitations (current, not yet fixed)](#known-limitations-current-not-yet-fixed)
- [About Me: what was going on, and what was done about it](#about-me-what-was-going-on-and-what-was-done-about-it)
- [Next steps (not started)](#next-steps-not-started)
- [To-do](#to-do)
- [Changelog](#changelog)
  - [v3.7.67 -- Site map compass point wired, closing #73](#v3767----site-map-compass-point-wired-closing-73)
  - [v3.7.66 -- Swatch Fields and Tracery Bots assembled onto the custom domain, no more raw github.io links](#v3766----swatch-fields-and-tracery-bots-assembled-onto-the-custom-domain-no-more-raw-githubio-links)
  - [v3.7.65 -- branch hygiene: a stray cross-machine session's work mirrored to main, reverted on v3, co-author trailers stripped](#v3765----branch-hygiene-a-stray-cross-machine-sessions-work-mirrored-to-main-reverted-on-v3-co-author-trailers-stripped)
  - [v3.7.64 -- review/ folder added; the "permanent archive" half of this pass had to be corrected same day](#v3764----review-folder-added-the-permanent-archive-half-of-this-pass-had-to-be-corrected-same-day)
  - [v3.7.63 -- MkDocs colour scheme attempt (#68): built, reviewed, rejected as bland, reverted](#v3763----mkdocs-colour-scheme-attempt-68-built-reviewed-rejected-as-bland-reverted)
  - [v3.7.62 -- ToDo file: done items collapsed, then a real rendering bug found and fixed same day](#v3762----todo-file-done-items-collapsed-then-a-real-rendering-bug-found-and-fixed-same-day)
  - [v3.7.61 -- new Fab section; corrected a wrong assumption about how section placement actually works (#27/#123)](#v3761----new-fab-section-corrected-a-wrong-assumption-about-how-section-placement-actually-works-27123)
  - [v3.7.60 -- label glow's contrast collision fixed; Data Visualisations reverted to a real stub](#v3760----label-glows-contrast-collision-fixed-data-visualisations-reverted-to-a-real-stub)
  - [v3.7.59 -- Bookshelf/FFFX split from Cabinet's own nav, real Teaching/Makings landing pages, Swatch Fields cross-listed on purpose (#72)](#v3759----bookshelffffx-split-from-cabinets-own-nav-real-teachingmakings-landing-pages-swatch-fields-cross-listed-on-purpose-72)
  - [v3.7.58 -- Working with AI, Prompt Generator, Oblique Strategies, SSD Creative Coding become real map entries (#71)](#v3758----working-with-ai-prompt-generator-oblique-strategies-ssd-creative-coding-become-real-map-entries-71)
  - [v3.7.57 -- mkdocs nav restructured around Compass/Teaching, first `cabinet-sections.tsv` gap found (#41/#44/#46/#66-69)](#v3757----mkdocs-nav-restructured-around-compassteaching-first-cabinet-sectionstsv-gap-found-4144466-69)
  - [v3.7.56 -- `deploy.yml`'s long inline comments trimmed to a help note](#v3756----deployymls-long-inline-comments-trimmed-to-a-help-note)
  - [v3.7.55 -- a dummy colophon page, and the archive finally deployed for real (#20/#61/#62)](#v3755----a-dummy-colophon-page-and-the-archive-finally-deployed-for-real-2061-62)
  - [v3.7.54 -- multi-repo assembly, phase 1: Working with AI mounted at /teaching/working-with-ai/](#v3754----multi-repo-assembly-phase-1-working-with-ai-mounted-at-teachingworking-with-ai)
  - [v3.7.53 bugfix -- compass direction labels went invisible on hover in Medieval](#v3753-bugfix----compass-direction-labels-went-invisible-on-hover-in-medieval)
  - [v3.7.52 -- compass spin gets a real ease-in/cruise/ease-out shape](#v3752----compass-spin-gets-a-real-ease-incruiseease-out-shape)
  - [v3.7.51 -- v3.7.50 was itself wrong: a real full-canvas structural layer, not a global hover reveal](#v3751----v3750-was-itself-wrong-a-real-full-canvas-structural-layer-not-a-global-hover-reveal)
  - [v3.7.50 -- the theme swap actually works now: reusing the hover-preview mechanism instead of rebuilding anything](#v3750----the-theme-swap-actually-works-now-reusing-the-hover-preview-mechanism-instead-of-rebuilding-anything)
  - [v3.7.49 -- full-width header, diagonals now spin with the compass, and a real structural gap found in the theme swap](#v3749----full-width-header-diagonals-now-spin-with-the-compass-and-a-real-structural-gap-found-in-the-theme-swap)
  - [v3.7.48 -- sticky header, compass click to swap theme, compass hover to spin](#v3748----sticky-header-compass-click-to-swap-theme-compass-hover-to-spin)
  - [v3.7.47 -- boats and dragons, live, on the production build](#v3747----boats-and-dragons-live-on-the-production-build)
  - [v3.7.46 -- production's H1/section/island labels were never loading their actual fonts](#v3746----productions-h1sectionisland-labels-were-never-loading-their-actual-fonts)
  - [v3.7.45 -- static build was missing data-theme, fell back to unthemed base colours](#v3745----static-build-was-missing-data-theme-fell-back-to-unthemed-base-colours)
  - [v3.7.44 -- Island noise debug overlay resolution doubled](#v3744----island-noise-debug-overlay-resolution-doubled)
  - [v3.7.43 -- control panel reorganized into a fixed sequence, five new subsection-local Reset buttons](#v3743----control-panel-reorganized-into-a-fixed-sequence-five-new-subsection-local-reset-buttons)
  - [v3.7.42 -- coastal band model simplified: "land baseline" only, sea-ward outward fade dropped](#v3742----coastal-band-model-simplified-land-baseline-only-sea-ward-outward-fade-dropped)
  - [v3.7.41 bugfix -- section label textbox wasn't covered by the hover wash; the fix that added it broke rendering, then a second fix corrected both](#v3741-bugfix----section-label-textbox-wasnt-covered-by-the-hover-wash-the-fix-that-added-it-broke-rendering-then-a-second-fix-corrected-both)
  - [v3.7.40 -- the hover wash's own colour was identical to the sea-depth bands painted on top of it; separated and re-enabled](#v3740----the-hover-washs-own-colour-was-identical-to-the-sea-depth-bands-painted-on-top-of-it-separated-and-re-enabled)
  - [v3.7.39 bugfix -- inward-band clip conflict was the real cause behind three of four reported problems](#v3739-bugfix----inward-band-clip-conflict-was-the-real-cause-behind-three-of-four-reported-problems)
  - [v3.7.38 -- Wave-ring blur bleed fixed; Topology's own sea-depth bands added to the preview](#v3738----wave-ring-blur-bleed-fixed-topologys-own-sea-depth-bands-added-to-the-preview)
  - [v3.7.37 -- Mechanism 3 complete for now: Topology's directional shadow swaps in on hover; default theme reverted to Medieval](#v3737----mechanism-3-complete-for-now-topologys-directional-shadow-swaps-in-on-hover-default-theme-reverted-to-medieval)
  - [v3.7.36 -- Mechanism 3, first slice: Medieval's own wave-rings/coastal-bands genuinely disappear on hover, not just get painted over](#v3736----mechanism-3-first-slice-medievals-own-wave-ringscoastal-bands-genuinely-disappear-on-hover-not-just-get-painted-over)
  - [v3.7.35 bugfix -- theme-preview sand band was camouflaged, coastline outline missing entirely](#v3735-bugfix----theme-preview-sand-band-was-camouflaged-coastline-outline-missing-entirely)
  - [v3.7.34 -- Theme preview grows real per-band fidelity (sand/veg/peak), plus a generalized sync fix](#v3734----theme-preview-grows-real-per-band-fidelity-sandvegpeak-plus-a-generalized-sync-fix)
  - [v3.7.33 bugfix -- Island/Section halo sliders were a silent no-op at any value](#v3733-bugfix----islandsection-halo-sliders-were-a-silent-no-op-at-any-value)
  - [v3.7.32 -- Theme x hover, Part A: a real colour-preview prototype, plus the theme roster narrowed toward Medieval + Topology](#v3732----theme-x-hover-part-a-a-real-colour-preview-prototype-plus-the-theme-roster-narrowed-toward-medieval--topology)
  - [v3.7.24-v3.7.30 -- Topology's directional cast shadow: cliff-edge fix, a real CSS-filter bug, then a height-aware taper](#v3724-v3730----topologys-directional-cast-shadow-cliff-edge-fix-a-real-css-filter-bug-then-a-height-aware-taper)
  - [v3.7.28 -- "Land 5": a mountain-peak accent, calibrated against real content, not a guess](#v3728----land-5-a-mountain-peak-accent-calibrated-against-real-content-not-a-guess)
  - [v3.7.28 -- Diagnostics subsection: island-noise heightmap view alongside the existing flow-field debug](#v3728----diagnostics-subsection-island-noise-heightmap-view-alongside-the-existing-flow-field-debug)
  - [v3.7.26, v3.7.28 -- Topological offset sliders relative to the coastline; waterLevel floor loosened](#v3726-v3728----topological-offset-sliders-relative-to-the-coastline-waterlevel-floor-loosened)
  - [v3.7.27 -- dev tool defaults to Topology theme; glow becomes the site-wide default label style](#v3727----dev-tool-defaults-to-topology-theme-glow-becomes-the-site-wide-default-label-style)
  - [v3.7.28 bugfix -- dragon no longer flashes at native size in the corner on load](#v3728-bugfix----dragon-no-longer-flashes-at-native-size-in-the-corner-on-load)
  - [v3.7.31 bugfix -- lat/long grid and compass diagonals pinned beneath the compass, not above](#v3731-bugfix----latlong-grid-and-compass-diagonals-pinned-beneath-the-compass-not-above)
  - [v3.7.23 -- small visual fixes: Medieval Map text visibility, Topology compass contrast, entry-label hover scale](#v3723----small-visual-fixes-medieval-map-text-visibility-topology-compass-contrast-entry-label-hover-scale)
  - [v3.7.1-v3.7.8 -- compass rose (reserved SE section, TSV-driven links, colour-token mapping), lat/long grid, section-label small caps](#v371-v378----compass-rose-reserved-se-section-tsv-driven-links-colour-token-mapping-latlong-grid-section-label-small-caps)
  - [v3.7.11 -- coastline-offset resolution: cellSize 4 -> 3](#v3711----coastline-offset-resolution-cellsize-4---3)
  - [v3.7.9-v3.7.17 -- coastal shadow & band effects: a real cast shadow, coast-hugging colour bands, two geometry bugs found and fixed](#v379-v3717----coastal-shadow--band-effects-a-real-cast-shadow-coast-hugging-colour-bands-two-geometry-bugs-found-and-fixed)
  - [v3.7.9, v3.7.17-v3.7.20 -- compass rose, round 2: cardinal-line/grid-toggle bug, colour remap, then label recentring + a grid-origin sync bug it caused](#v379-v3717-v3720----compass-rose-round-2-cardinal-linegrid-toggle-bug-colour-remap-then-label-recentring--a-grid-origin-sync-bug-it-caused)
  - [v3.7.13-v3.7.22 -- visual clean-up: glow radius (two rounds), Medieval Map colour retints, section-label glow made more prominent](#v3713-v3722----visual-clean-up-glow-radius-two-rounds-medieval-map-colour-retints-section-label-glow-made-more-prominent)
  - [v3.7.19, v3.7.22 -- theme roster cleanup: 4 themes dropped, Topology draft + Bathymetric merged, medieRiso recoloured](#v3719-v3722----theme-roster-cleanup-4-themes-dropped-topology-draft--bathymetric-merged-medieriso-recoloured)
  - [v3.7.16, v3.7.21 -- dev panel: lat/long defaults off, coastal-band/sea-shadow toggles, tool opens on Medieval Map](#v3716-v3721----dev-panel-latlong-defaults-off-coastal-bandsea-shadow-toggles-tool-opens-on-medieval-map)
  - [v3.7 -- WIP/dummy entries lose their dashed ring and their own hover identity; Medieval Map retinted](#v37----wipdummy-entries-lose-their-dashed-ring-and-their-own-hover-identity-medieval-map-retinted)
  - [v3.6.30 -- section headings get the label-style treatment; a per-theme colour editor on the dev panel](#v3630----section-headings-get-the-label-style-treatment-a-per-theme-colour-editor-on-the-dev-panel)
  - [v3.6.29 -- MedieRiso token tuning: explicit riso-neon hex values, ring/halo swap, flagged glow note](#v3629----medieriso-token-tuning-explicit-riso-neon-hex-values-ringhalo-swap-flagged-glow-note)
  - [v3.6.28 -- "MedieRiso" theme: dark sepia base, riso-neon highlights throughout](#v3628----medieriso-theme-dark-sepia-base-riso-neon-highlights-throughout)
  - [v3.6.27 -- hover label colours invert on hover; "thin stroke" label style removed](#v3627----hover-label-colours-invert-on-hover-thin-stroke-label-style-removed)
  - [v3.6.26 -- real-shape hover halos and click areas for islands and sections](#v3626----real-shape-hover-halos-and-click-areas-for-islands-and-sections)
  - [v3.6.25 -- dragon movement fixes: measured (not guessed) bobbing fix, archipelago-scale coast tuning, panel collapsed by default](#v3625----dragon-movement-fixes-measured-not-guessed-bobbing-fix-archipelago-scale-coast-tuning-panel-collapsed-by-default)
  - [v3.6.24 -- independent sea-dragon wanderers, from a user-supplied `dragon.svg`](#v3624----independent-sea-dragon-wanderers-from-a-user-supplied-dragonsvg)
  - [v3.6.23 -- per-particle "personality" demo mode (bias / offset / both), for "one giant trash drift"](#v3623----per-particle-personality-demo-mode-bias--offset--both-for-one-giant-trash-drift)
  - [v3.6.22 -- coastal spawn, wider entry arc, spawn stagger, dev-panel controls for all of it, live-tuned defaults](#v3622----coastal-spawn-wider-entry-arc-spawn-stagger-dev-panel-controls-for-all-of-it-live-tuned-defaults)
  - [v3.6.21 -- hard land-crossing backstop, click-to-launch with a governed particle pool](#v3621----hard-land-crossing-backstop-click-to-launch-with-a-governed-particle-pool)
  - [v3.6.20 -- speed/current retune, live debug field, boat styling, and a second structural trapping fix (this time on the STATIC half of the field)](#v3620----speedcurrent-retune-live-debug-field-boat-styling-and-a-second-structural-trapping-fix-this-time-on-the-static-half-of-the-field)
  - [v3.6.19 -- narrow-channel clumping fix, prevailing SW-NE current, spawn-arc entry, stuck-particle safety net](#v3619----narrow-channel-clumping-fix-prevailing-sw-ne-current-spawn-arc-entry-stuck-particle-safety-net)
  - [v3.6.18 -- fixes particles trapped in closed orbits; open water gets real speed and variation](#v3618----fixes-particles-trapped-in-closed-orbits-open-water-gets-real-speed-and-variation)
  - [v3.6.17 -- the particle system: pool, off-canvas spawn/recycle, small rotated ellipses](#v3617----the-particle-system-pool-off-canvas-spawnrecycle-small-rotated-ellipses)
  - [v3.6.16 -- flow field: math + debug view, no particles yet (first slice of the Flowfield stretch goal)](#v3616----flow-field-math--debug-view-no-particles-yet-first-slice-of-the-flowfield-stretch-goal)
  - [v3.6.14-v3.6.15 -- eight comparison colour/type schemes wired into the Theme dropdown](#v3614-v3615----eight-comparison-colourtype-schemes-wired-into-the-theme-dropdown)
  - [v3.6.13 -- islands and sections both link out; hover feedback becomes a blurred glow](#v3613----islands-and-sections-both-link-out-hover-feedback-becomes-a-blurred-glow)
  - [v3.6.12 -- header back to a top row, full-bleed sea fixed, smaller section labels, live label-style switcher](#v3612----header-back-to-a-top-row-full-bleed-sea-fixed-smaller-section-labels-live-label-style-switcher)
  - [v3.6.11 -- extraCount moves onto the TSV, coming-soon stubs removed](#v3611----extracount-moves-onto-the-tsv-coming-soon-stubs-removed)
  - [v3.6.10 -- full-bleed canvas + header overlay (punch-list items 12, 13), item 9 investigated](#v3610----full-bleed-canvas--header-overlay-punch-list-items-12-13-item-9-investigated)
  - [v3.6.9 -- panel restructure into collapsible sections, topological-offset sliders, a real bug fix](#v369----panel-restructure-into-collapsible-sections-topological-offset-sliders-a-real-bug-fix)
  - [v3.6.8 -- islands-tool packing controls (reroll, center-bias) + preset-look switcher](#v368----islands-tool-packing-controls-reroll-center-bias--preset-look-switcher)
  - [v3.6.7 -- wave-ring generator panel, edge-padding fix, flatColourMode land fill](#v367----wave-ring-generator-panel-edge-padding-fix-flatcolourmode-land-fill)
  - [v3.6 -- domain warping for real concavity + dev tuning panel](#v36----domain-warping-for-real-concavity--dev-tuning-panel)
  - [v3.6.6 -- fixed-distance wave rings, centroid-pull scatter, flatColourMode](#v366----fixed-distance-wave-rings-centroid-pull-scatter-flatcolourmode)
  - [v3.6.5 -- stacked-alpha sea/beach/vegetation colour bands](#v365----stacked-alpha-seabeachvegetation-colour-bands)
  - [v3.6.4 -- offset coastline ripples](#v364----offset-coastline-ripples)
  - [v3.6.3 -- paste-friendly config, file table grouped by editability](#v363----paste-friendly-config-file-table-grouped-by-editability)
  - [v3.6.2 -- index.html becomes a zero-JS static build](#v362----indexhtml-becomes-a-zero-js-static-build)
  - [v3.6.1 -- three pages, first real interactive tuning pass applied](#v361----three-pages-first-real-interactive-tuning-pass-applied)
  - [v3.5.4 -- ridged noise for sharp inlets, bias-corrected](#v354----ridged-noise-for-sharp-inlets-bias-corrected)
  - [v3.5.3 -- angular modulation goes multi-octave](#v353----angular-modulation-goes-multi-octave)
  - [v3.5.2 -- angle-modulated coastline radius (genuinely lobed islands)](#v352----angle-modulated-coastline-radius-genuinely-lobed-islands)
  - [v3.5.1 -- more fbm octaves, tried first, reverted](#v351----more-fbm-octaves-tried-first-reverted)
  - [v3.5 -- noise-carved coastlines replace plain circles](#v35----noise-carved-coastlines-replace-plain-circles)
  - [v3.4.2 -- entries placed and centered first, extras placed after](#v342----entries-placed-and-centered-first-extras-placed-after)
  - [v3.4.1 -- entry-only centering, first attempt](#v341----entry-only-centering-first-attempt)
  - [v3.4 -- section minimum weight, point-stage centering, bottom/multiline labels](#v34----section-minimum-weight-point-stage-centering-bottommultiline-labels)
  - [v3.3 -- fewer/plainer extras, global cross-region growth](#v33----fewerplainer-extras-global-cross-region-growth)
  - [v3.2 -- minimum circle size, corrected separation, centered archipelagos](#v32----minimum-circle-size-corrected-separation-centered-archipelagos)
  - [v3.1 -- growth-based packing, ported from `p5-circle-packing`](#v31----growth-based-packing-ported-from-p5-circle-packing)
  - [v3.0 -- initial weighted-region + circle-pack prototype](#v30----initial-weighted-region--circle-pack-prototype)

This is a **live reference**, kept current as the prototype changes --
not a diary. Sections below describe how `landing-v3/` actually works
right now; the "Changelog" section at the bottom is where superseded
reasoning (approaches tried and rejected, bugs found and fixed) is
preserved instead, same convention as fffx's own `LANDING-PAGE-NOTES.md`.
Currently on **v3.7.66**. As of 2026-08-23, this is no longer just a
prototype -- `landing-v3` was promoted into production (merged
`landing-v3-prototype` -> `main`) and `index.html`'s build now serves as
`docs/index.html`, live at cabinetofcuriosities.in. Domain warping for
real concave coastlines,
interactively tuned via an on-page control panel, split across three
pages -- `index.html` a static build of the evolving real prototype
(zero-JS through v3.7.46; as of v3.7.47 it loads one small script,
`cabinet-v3-production-animate.js`, for live boats/dragons -- see that
version's own entry for why this doesn't mean loading the real
prototype), `islands-tool.html` the permanent live tuning tool,
`archive/v3.6/` a frozen snapshot -- plus a paste-friendly
`cabinet-v3-data.js`, a by-editability file table below, genuine
fixed-distance wave rings via a Euclidean distance transform, a
three-section collapsible tuning panel (Visuals / Island shape / Layout,
now including a live Label style switcher), a full-bleed canvas that
solves its own shape from the real viewport at load, with the page's
title/tagline back in a normal top-of-page row (v3.6.12 reverted
v3.6.10's map-corner overlay) sitting on the same sea colour as the
canvas itself, per-section extra-island counts on
`content/cabinet-sections.tsv` itself, both islands AND their whole
section are click-through links to their own pages with a soft blurred
glow standing in for hover feedback instead of a hard shape, and (new) a
precomputed vector flow field -- `cabinet-v3-flowfield.js` -- with a live
particle system riding it on `islands-tool.html` only (small
dark-outlined cream ellipses, `cabinet-v3-particles.js`), island
avoidance and a prevailing current direction both working through
narrow channels and bays without trapping particles, a hard land-crossing
backstop independent of the field's own soft push, click-to-launch (a
click on open water adds a boat), a wider/coastal-aware spawn system
(130 ambient particles, capped at 150, half of every spawn landing at a
coastline and pushing off it) tuned live via dev-panel controls that now
also cover particle counts and both collapsible and nested-collapsible
panel sections, and an opt-in per-particle "personality" demo mode
addressing dense pools reading as one shared drift rather than
individual boats, plus 1-3 independent sea-dragon wanderers (from a
user-supplied `dragon.svg`, own noise-driven movement not tied to the
current field, coastal avoidance at spawn and while wandering, and an
event-triggered dive/resurface via a real SVG clip-path "sink beneath
the surface" effect), the whole dev-tuning panel now closed by default,
and (new) both islands' AND sections' hover halo/click area now traced
from the real coastline geometry instead of a circle/rectangle
approximation -- a section's own shape is its label plus every one of
its islands (entry and filler alike) dilated by the same distance the
outermost wave ring already sits at, clipped to that section's own
rectangle so an intruding neighbour's glow can spill across a region
seam visually without ever being clickable there -- plus inverted
hover-colour label treatments (light-on-dark becomes dark-on-light) and
one fewer label-style option (thin stroke, removed), and (new) a ninth
Theme preset -- "MedieRiso," a dark warm-sepia base (colour bands AND
wave rings on together) with every highlight -- rings, band boundaries,
hover halos, label outlines, boat fills, dragon fills -- pulled from the
existing "riso" theme's own neon palette
-- see the changelog for the full v3.0 -> v3.1 -> v3.2 -> v3.3 -> v3.4 ->
v3.4.1 -> v3.4.2 -> v3.5 -> v3.5.1 -> v3.5.2 -> v3.5.3 -> v3.5.4 -> v3.6
-> v3.6.1 -> v3.6.2 -> v3.6.3 -> v3.6.4 -> v3.6.5 -> v3.6.6 -> v3.6.7 ->
v3.6.8 -> v3.6.9 -> v3.6.10 -> v3.6.11 -> v3.6.12 -> v3.6.13 -> v3.6.14 ->
v3.6.15 -> v3.6.16 -> v3.6.17 -> v3.6.18 -> v3.6.19 -> v3.6.20 -> v3.6.21
-> v3.6.22 -> v3.6.23 -> v3.6.24 -> v3.6.25 -> v3.6.26 -> v3.6.27 ->
v3.6.28 -> v3.6.29 -> v3.6.30 -> v3.7 -> v3.7.1 -> v3.7.2 -> v3.7.3 ->
v3.7.4 -> v3.7.5 -> v3.7.6 -> v3.7.7 -> v3.7.8 -> v3.7.9 -> v3.7.10 ->
v3.7.11 -> v3.7.12 -> v3.7.13 -> v3.7.14 -> v3.7.15 -> v3.7.16 -> v3.7.17
-> v3.7.18 -> v3.7.19 -> v3.7.20 -> v3.7.21 -> v3.7.22 -> v3.7.23 ->
v3.7.24 -> v3.7.25 -> v3.7.26 -> v3.7.27 -> v3.7.28 -> v3.7.29 -> v3.7.30
-> v3.7.31 -> v3.7.32 -> v3.7.33 -> v3.7.34 -> v3.7.35 -> v3.7.36 -> v3.7.37
-> v3.7.38 -> v3.7.39 -> v3.7.40 -> v3.7.41 -> v3.7.42 -> v3.7.43 ->
v3.7.44
progression and why each pass changed what it did. Most recently
(v3.7.44, a small one): the Diagnostics > Island noise debug overlay's
own resolution doubled, dev-tool-only with no cost to an actual site
visitor. Before that (v3.7.43): the Visuals control panel reorganized
into a fixed,
predictable sequence with five new subsection-local Reset buttons
(Hover theme, Bands width, Wave ring, Topological offset, Particle
counts), on top of three straight rounds of theme x hover fixes
(v3.7.40-v3.7.42) that finally landed the mechanism after v3.7.39
still wasn't reading correctly live: the hover wash was hiding its own
sea-depth bands under an identically-coloured layer (v3.7.40, fixed by
giving the wash its own distinct "deepest sea" tone and re-enabling
it), the section-level wash never covered the section label's own
textbox at all -- and the first attempt to fix that punched a real hole
in the wash via an evenodd self-intersection bug (v3.7.41, fixed with a
separate sibling shape sized to the label's own rendered bbox, not the
full label band) -- and finally a live request to simplify the coastal
band model itself, dropping the sea-ward "outward" band as a separate
tunable concept entirely (v3.7.42). For the earlier v3.7.39 fix (still
valid, just not the end of the story): the REAL cause of v3.7.38's
"still visible" report -- one `.v3-coast-inward-band` (each section's
own colour-hued inland band, the actual biggest source of visible land
colour in Medieval Map) was silently losing its ESSENTIAL per-section
confinement clip every time the hover mechanism's CSS rule overwrote
it, un-confining every section's band across the whole map. Explains
three of the four things reported at once -- wave/band bleed on both
islands and sections, AND the separately-reported "Medieval island
colour is gone, inland is
white" (the confined, colour-hued bands ARE most of that colour). Fixed
by moving the hover clip onto a wrapping group instead of the individual
band elements, so both clips (confinement + hover-hole) now compose
instead of one replacing the other. Also boosted the preview's sea-band
and shadow opacity -- the real map's own subtle values read as
effectively invisible in this smaller, more saturated context. Full
detail, with screenshots, in the changelog below. Before that (v3.7.38):
two real problems caught from one screenshot -- Medieval's
wave-ring contours were still visibly showing through the wash's own
blurred, semi-transparent edge (the clip GEOMETRY was already correct,
confirmed by zeroing the blur and watching the artifact vanish
completely; the fix dilates the clip hole a bit further than the wash
itself, tracking the blur radius) -- and Topology's own sea-depth bands
(`.v3-sea-band`, gated by `flatColourMode`, a completely different
mechanism from the wave-ring/coastal-band toggle) had never been added
to the preview at all, so the halo was one flat tone standing in for
what should be real nested sea-depth rings. Both fixed/added for islands
and sections alike. Full detail, with diagnostic screenshots, in the
changelog below. Before that (v3.7.37): mechanism 3's last remaining
piece -- Topology's own
directional taper shadow, isolated to the hovered island/section, swaps
in for Medieval's radial shadow within the hover region (both are now in
the same clip-path's target list `v3.7.36` introduced). A real z-order
bug caught before shipping, not after: the shadow was originally painted
UNDER the halo wash, which is fully opaque in its interior, so it was
completely invisible -- confirmed via an isolated diagnostic screenshot,
fixed by reordering, not by guessing. At its real opacity (matching the
live map's own shadow, 0.08 fill-opacity) the effect reads as genuinely
subtle against the halo's saturated teal, a live open question flagged
below rather than silently retuned. Also this round: dev tool's default
theme reverted to Medieval Map (Topology stays the hover/preview target)
now that this feature is the active focus, and confirmed (a follow-up
test, not assumed) that section-level hover was ALSO already working
correctly since v3.7.36 -- an earlier live check just happened to sample
a hit-testing dead zone. Full detail, with screenshots, in the changelog
below. Before that (v3.7.36): the first real slice of "mechanism 3"
proper -- hovering an island or section doesn't just overlay Topology's
colours on top of Medieval's own wave-ring/coastal-band contours any
more, it makes those Medieval-only decorations genuinely disappear
within that hovered region, via a shared JS-driven clip-path (CSS
`:hover` alone can style existing elements but can't construct a dynamic
"everywhere except this shape" hole). Before that (v3.7.35): two bugs in
v3.7.34's new per-band preview, both caught live and fixed same-session
-- the sand band was camouflaged (mapped to the same colour as the wash
sitting directly underneath it) and the coastline outline had quietly
gone missing once real bands were added (the wash's own stroke was
deliberately dropped a version earlier for a different reason). Before
that (v3.7.34): the theme-preview overlay grew real per-band fidelity --
a
hovered island/section now previews its ACTUAL sand/veg/peak contours at
Topology's colours (traced at the same shared thresholds every real
island uses, not an approximation), not one flat wash. Also fixed the
same class of bug v3.7.33 fixed for the halo sliders, generalized: ANY
slider touching sandThresholds/vegThresholds/peakThresholds (not just the
theme-preview's own sliders) now keeps the preview in sync, folded into
retraceIslands() itself rather than requiring each such slider to opt in
individually. Full detail in the changelog below. Before that (v3.7.33):
the Island/Section halo sliders added in v3.7.32 were a silent no-op at
any value -- retraceIslands() (their default redraw path) never touches
renderRegion()'s output, where the preview paths actually live. Fixed
with a new narrowly-scoped retraceThemePreviews() that updates just those
two paths' geometry in place, confirmed via Playwright (the `d` attribute
now genuinely changes size with the slider) rather than re-eyeballing it.
Before that (v3.7.32): a first real prototype of "theme x hover" --
hovering an
island or section reveals a Topology-coloured overlay of its own real
traced shape (reusing the same isolated-trace mechanism that already
powers hover glow/hit-testing), coloured from the SAME live
`themeTokenState` the existing per-theme colour editor writes to, not a
separate hardcoded snapshot, so editing Topology's colours updates the
hover effect immediately. Halo distance and edge blur are both new live
dev-panel sliders (45px / a `filter: blur()` with no stroke, both tuned
from direct feedback after the first pass). Colour fidelity is
deliberately flat for now (no per-band sand/veg/peak distinction yet) --
a known, flagged limit of this pass, not a bug. Also: the theme roster
narrowed toward an eventual Medieval + Topology production pair -- Riso
removed outright, Cyanotype and MedieRiso both stay live/selectable as a
kept reference and an ongoing scratchpad respectively. Full detail
(including the three mechanisms compared before picking this one, and a
wrong first guess at what "Cyanotype archived" meant, corrected on direct
feedback) in the changelog below. Before that (v3.7.23 -> v3.7.31): the
Topology theme got its own real identity instead of sharing every other
theme's treatment -- coastal bands off, and (after the original v3.7.9
directional shadow was shelved for looking like a cliff edge) a REBUILT
directional cast shadow, this time built from copies of the terrain's own
five (then six, once "Land 5" landed) nested contour levels rather than
one repeated shape, so it genuinely tapers as it recedes, and -- after a
real CSS-filter-vs-SVG-filter bug was caught by testing rather than
guessing -- its length now scales with actual terrain HEIGHT rather than
a fixed per-layer step ("tall bits cast longer shadows"); a new "Land 5"
mountain-peak accent (white, seen only on some islands, calibrated
against the real site content after a synthetic sample turned out
unrepresentative); a new Diagnostics subsection folding the existing
flow-field debug views together with a new raw island-heightmap tint
view; every Topological offset parameter slider now reads/writes
relative to the coastline threshold instead of an opaque absolute noise
value, renumbered so "1" always means nearest the coast in both
directions; `waterLevel` loosened for more sea-floor headroom after
empirically confirming the old floor produced a real cliff, not a fade,
the moment a level crossed it; a dragon-flashing-at-native-size-on-load
bug fixed; a lat/long-grid-drawn-above-the-compass z-order bug fixed; and
the dev tool's own defaults flipped to Topology theme / glow label style.
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
is **authored per section**, because the whole layout is meant to be
stable until content actually changes, not different on every reload.

**v3.6.11 -- moved onto the real content pipeline.** `extraCount` is
now an optional column on `content/cabinet-sections.tsv` itself
(resolved once, at content-build time, by
`tools/build-cabinet-content.js` -- a blank cell falls back to a
deterministic per-section-id hash, 1-3, same idea `defaultExtrasFor()`
used to implement live in the browser) instead of a separate
hand-authored `cabinet-v3-extras-config.js`, which is now deleted.
`EXTRA_WEIGHT` (the fixed sizing weight every extra circle gets) moved
to `cabinet-v3-data.js`'s `v3Config` instead -- it's read live at
render time, unlike `extraCount`, so it belongs with the other render-time
tuning knobs, not the content-build script. This was the schema
extension this file used to propose (see the changelog entry for the
full reasoning); `archive/v3.6/` keeps its own frozen copy of the old
file (`archive/v3.6/extras-config.js`) so that snapshot stays
self-contained rather than depending on something now deleted.

The separate "coming soon" stub mechanism (`comingSoon` count, unlinked
dashed circles with no real entry behind them) is gone too, not
migrated -- it had been dormant (`comingSoon: 0` everywhere) since v3.3,
and turned out to duplicate something that already exists and already
matches the two production landing pages: a real entry with `status:
"wip"` renders as a real, linked circle with the same dashed status
ring (`isMuted` in `cabinet-v3-layout.js`), just not fully live yet.
"Coming soon" content is expressed by adding a real WIP entry, the same
way `docs/assets/js/cabinet-render.js` already does it -- not by a
second, v3-only filler system.

Historically, this file was explicitly written as a **schema-extension
proposal**, not just prototype scaffolding: its own top comment stated
the new optional `cabinet-sections.tsv` column it stood in for
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
| `cabinet-v3-data.js` | Tuning config (`v3Config`): canvas sizing, pack knobs, and the `island` noise/warp block, plus (v3.6.11) `EXTRA_WEIGHT` -- the fixed sizing weight every extra/filler circle gets, sitting alongside `v3Config` since it's read live at render time the same way. As of v3.6.3, `island`'s value block is deliberately comment-free and in the same key order `islands-tool.html`'s "Copy config" button produces -- paste its output directly over everything between `island: {` and the matching `}`, no hand-editing around comments. Field-by-field explanations live in the **ISLAND CONFIG FIELD NOTES** comment at the end of the file instead, same order. `canvas`/`pack` keep their comments inline (no copy-paste workflow touches those). |
| `index.template.html` | The actual hand-edited source for the built `index.html` (v3.6.2) -- header/subtitle text, stylesheet links, and a `<!-- V3_ISLANDS_SVG -->` placeholder. Edit this, never `index.html` itself -- see "Static build" below. |
| (`content/cabinet-sections.tsv` / `cabinet-entries.tsv`, repo root) | The real content source -- not in `landing-v3/` at all, but this is where entry/section titles, weights, order, status, and (v3.6.11) each section's `extraCount` actually come from. Run `node tools/build-cabinet-content.js` after editing these -- a blank `extraCount` cell falls back to a deterministic per-section default, resolved by that same script. |

**Logic -- shouldn't need to touch unless you're changing the algorithm
itself:**

| File | Responsibility |
| --- | --- |
| `cabinet-v3-treemap.js` | Pure logic: `squarify()` only (the v3.0 aspect-band search, `squarifyWithAspectSearch()`, was removed -- see the changelog; it's recoverable from git history if the band comes back). No DOM -- runs under Node unchanged (see "Verification" below), same rationale as `fffx-subdivision.js`. |
| `cabinet-v3-circlepack.js` | Pure logic: `generateScatterPoints()` (per-section, takes a cross-section `existingPoints` list), `centerPointsInRect()` (v3.4, per-section, centers bare points before growth), `sortPointsByBandReadingOrder()` (per-section), `growCircles()` (v3.3: one global call across every section's seeds, takes `obstacles` for label bands), plus `createSeededRng()`/`seedFromString()`/`safeMinSeparation()`/`insetRect()` helpers -- all used. `centerClusterInRect()` (v3.2, superseded by `centerPointsInRect()`) and `packCirclesSpiral()` are also here, currently unused (see "Known limitations"). No DOM. |
| `cabinet-v3-islandshape.js` | Pure logic (v3.5, domain warp added v3.6): seeded 2D noise, per-circle radial falloff, domain-warped sample positions, a shared heightmap combined via `max()` across every circle, and a marching-squares tracer that turns that heightmap into SVG path data -- see "How coastlines are traced" below. No DOM. |
| `cabinet-v3-layout.js` | Orchestration + SVG rendering only -- folds entries into sections, calls the treemap, pack, and island-shape modules, builds the actual SVG nodes, reserves and renders each region's label band. Exports `retraceIslands()` (v3.6) for the control panel's cheap re-trace path. Imports real content from `../docs/assets/js/cabinet-generated-content.js`. |
| `cabinet-v3-controls.js` | Dev-only (v3.6, restructured v3.6.9): on-page tuning panel, three collapsible sections -- Visuals (`v3Config.island`'s colour-band/wave-ring toggles and thresholds, `retraceIslands()`), Island shape (noise/warp/angular parameters, `retraceIslands()`), Layout (`v3Config.pack.centerBias` + reroll, `render()`). Not part of the page design being reviewed -- see "Domain warping for real concavity" below and "Known limitations" #10. |
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
  `cabinet-v3-circlepack.js`, `cabinet-v3-treemap.js` are still imported
  live, one directory up. (`cabinet-v3-extras-config.js` was on this
  list too, until v3.6.11 deleted the live file -- this archive now
  keeps its own frozen copy, `archive/v3.6/extras-config.js`, rather
  than depending on something that no longer exists.) Deliberate scope
  decision: the concern this archive actually
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
build-only page -- like `index.template.html`'s header/stage structure
(v3.6.10: the header IS needed here now, unlike earlier versions --
render() reads wherever `.v3-stage-wrap` actually starts to size the
full-bleed canvas, which depends on the header's real rendered height;
v3.6.12 moved the header back to a normal top-of-flow row above the
canvas instead of overlaying it, see that changelog entry) but,
critically, no `cabinet-v3-controls.js` script tag, so the dev tuning
panel can never end up baked into the static output. Only `#v3-stage`'s
own markup is ever extracted -- the header itself is never captured.

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

- **Watch out for:** the header markup (`<header class="v3-header">`'s
  `<h1>`/`<p class="v3-subtitle">`) is hand-duplicated across
  `index.template.html`, `islands-tool.html`, and `build-render.html` --
  no templating keeps them in sync, so editing the title/tagline in one
  needs the same edit in the other two by hand. Deliberately left as-is
  for now (see the conversation log): a lot of churn is still expected
  across these files, and the mismatch is low-stakes/easy to spot by eye
  in the meantime. A single-source-of-truth fix is sketched out (define
  once in `v3Config.title`/`subtitle`, extend `build-static.mjs`'s
  existing real-browser-capture pattern -- already used for the SVG --
  to also capture the rendered header) but not a priority; revisit once
  the header stabilizes.
- Font-size-from-radius + truncation for circle labels (limitation #1).
- If cross-region overlap is ever observed against a different content
  mix: re-validate (or re-clamp) `centerPointsInRect()`'s output against
  `allPlacedPoints` rather than trusting the pre-centering scatter check
  (limitation #3).
- If this direction is approved: drop `cabinet-sections.tsv`'s now-
  redundant `weight` column, fold `landing-v3/` into `docs/` +
  `docs/assets/{css,js}/`, and merge this file into
  `LANDING-PAGE-NOTES.md`. (The `extraCount` column itself is done --
  see the v3.6.11 changelog entry.)
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

## To-do

Moved to `documentation/landing-v3-notes/three-world-launch-phases-ToDo.md`
(2026-08-23, relocated from `landing-v3/` on 2026-08-29) -- it had grown
past what the punch-list format here could hold. That file's "Phase 0"
is this doc's old punch list (v3-prototype visual-polish/feature items);
Phases 1-3 cover the Cabinet/Bookshelf/FFFX launch sequence, with the
supporting rationale (deployment mechanism, branch-transition reasoning,
TSV editor spec) split out again into
`documentation/landing-v3-notes/three-world-launch-phases-Notes.md`.
See `conversation-landing-page-v3.md` (same directory as this file) for
the design reasoning and back-and-forth behind the decisions already
made in the v3-prototype phase.

## Changelog

### v3.7.67 -- Site map compass point wired, closing #73

`#73` left the compass rose's W point open pending a decision on where
the Site IA/Sitemap page's content would come from -- "hand-written or
generated from `mkdocs.yml` + `cabinet-sections.tsv` directly." Settled
in favour of generation, but wider than that question anticipated: a
single `tools/generate_sitemap.py` (moved here from a throwaway
`sitemap/` scratch folder it started in) pulls the sections/entries TSVs
live from all three worlds' own repos over GitHub raw -- Cabinet,
`form-follows-fx`, and `TheBookshelfOfCuriosities` -- not just this
repo's own `cabinet-sections.tsv`/`cabinet-entries.tsv`, so one page
covers the whole map. Writes `docs/sitemap.md`, an MkDocs source page
like `about.md`/`colophon.md`, added to `mkdocs.yml`'s Compass nav
block. `cabinet-entries.tsv`'s `compass-w` row: `href` `sitemap/`,
`status` `wip` -> `true`.

Rebuilding `docs/assets/js/cabinet-generated-content.js` (`node
tools/build-cabinet-content.js`) and re-running `build-static.mjs`
surfaced a real promotion bug, not just a data change: naively `cp`-ing
`landing-v3/index.html` over `docs/index.html` carries the dev build's
own-folder-relative asset paths (bare `cabinet-v3-style.css`,
`cabinet-v3-production-animate.js`, `../docs/assets/css/cabinet-tokens.css`)
straight across, which don't resolve from `docs/`'s location -- silently
drops all styling and the boat/dragon animation. Same three paths
`ed45d15`'s commit message already named as "the usual asset-path
rewrites"; rewritten to `assets/css/...`/`assets/js/...` again here.
Verified: `node tools/build-cabinet-content.js` clean, `docs/sitemap.md`
generated from a live fetch of all three repos' TSVs, headless-Chromium
render of the promoted `docs/index.html` with zero console/request
errors, and a compass-rose screenshot confirming all four points --
About Me, Now, Colophon, Site map -- render live.

### v3.7.66 -- Swatch Fields and Tracery Bots assembled onto the custom domain, no more raw github.io links

Direct question: "Are there any links on the landing page or the
connected pages that would show up as a github page in someone's
browser?" Audit found five spots still resolving to raw
`jesmehta.github.io` URLs instead of `cabinetofcuriosities.in` --
Swatch Fields (both the Machines & Makings and Interfaces, Data & Texts
nav listings, plus its two map entries in `cabinet-entries.tsv`), and
Tracery Bots' two bot sub-pages (Trippy Gourmet, Mad Solutionist),
including the iframe embed inside `docs/traceryBots.md` (and the
orphaned, nav-commented-out `docs/trippyGourmet.md`).

Wired both onto the multi-repo assembly pattern from #43/v3.7.54,
`deploy.yml`'s `jesmehta/swatchFields` -> `public/swatch-fields/` and
`jesmehta/TraceryBots` -> `public/tracery-bots/` (whole repo copied,
so its `TrippyGourmetBot/`/`MadSolutionistBot/` subfolders come along
for free), each with its own Validate step checking a real content
file beyond `index.html` (`swatch_lookup.json`, and both bots'
`sketch.js`). `mkdocs.yml`'s four external links and the iframe now
point at `cabinetofcuriosities.in/swatch-fields/` and
`.../tracery-bots/<Bot>/`; the two `swatch-fields*` TSV rows' `href`
and `location` columns updated to match the `assembly` convention
already used for the Teaching repos. Verified with a local `mkdocs
build` that the new URLs land correctly in the rendered nav and
iframe. Not touched: `docs/dotMandalaTool.md`'s iframe, which embeds a
third repo (`DotMandalaGenerator`) not covered by this request.

### v3.7.65 -- branch hygiene: a stray cross-machine session's work mirrored to main, reverted on v3, co-author trailers stripped

A prior session on another machine had committed 3 commits directly to
`landing-v3-prototype` and pushed without merging to `main` --
archiving Algorithm Bench + a pre-split v3-history snapshot, linking
them from `docs/colophon.md`, and wiring the compass's 4 points (About
Me/Now/Colophon/Site map). These touched live-site content
(`docs/`, `content/cabinet-entries.tsv`), not just prototype work, so
they belonged on `main` and shouldn't have stayed v3-only.

Cherry-picked all 3 onto a clean branch off the pre-mess commit,
amending each message to drop its `Co-Authored-By: Claude` trailer
(content verified byte-identical to the originals via `git diff
--stat`), force-pushed that as the new `landing-v3-prototype` tip,
merged into `main` (clean, no conflicts). Then reverted the same 3
commits on `landing-v3-prototype` in one commit, restoring its tree to
exactly the pre-mess state (verified via an empty `git diff` against
the last known-good commit). Only one other machine touches this repo
and the user confirmed a rebase there is fine, so the force-push was
authorized rather than worked around.

### v3.7.64 -- review/ folder added; the "permanent archive" half of this pass had to be corrected same day

Direct feedback after a colour-scheme review round: review screenshots
were only shown as "after," not before/after, and were left in the
session's temp scratchpad instead of somewhere easy to reach locally.
New repo-root `review/` folder (gitignored except its own `README.md`,
ephemeral -- overwritten freely between rounds) for in-progress
before/after pairs.

The other half of this pass got it wrong: also created a new
`dev-archive/` folder at the repo root for permanent, committed
feature-history screenshots, without first checking whether an
equivalent already existed. It did --  `landing-v3/dev-screenshots/`,
56+ files, an established `vX.Y.Z-description.png` naming convention,
in use since early in v3's development, flagged directly the same day:
"there was already dev screenshots inside landing-v3." Removed the
redundant folder, corrected `review/README.md` and the saved workflow
memory to point at the real one. Screenshots worth keeping should be
added there proactively while working on a feature, not just on
request -- same "don't wait to be asked" instinct as commits/changelog
entries at natural closing points, now saved as a standing workflow
memory rather than a one-off ask, corrected version included. Where
MkDocs-side (non-v3) screenshots without an obvious existing home
should live is still open -- folded into ToDo #125 (file organization)
rather than decided ad hoc a second time.

### v3.7.63 -- MkDocs colour scheme attempt (#68): built, reviewed, rejected as bland, reverted

Direct request: make MkDocs feel like the same site as the v3 landing
page -- "a mix of medieval and topo, bright accents from topo over the
medieval cream." Built as a local-only override in
`docs/stylesheets/cabinet-material.css` (deliberately not touching
`cabinet-tokens.css`, which the v3 landing page also depends on --
`cabinet-material.css` is MkDocs-only, loaded via `mkdocs.yml`'s
`extra_css`, so this couldn't leak into the map regardless of outcome).
Cream/ink base from medieval-map's own tokens, three Topology accents
(cyan links-on-hover, coral primary/links, gold code/admonitions) pulled
directly from `cabinet-v3-style.css`'s `satellite` theme block.

Found and fixed a real, independent bug while testing: the *existing*
(pre-this-pass) colour overrides had never actually been taking effect
on the live site. MkDocs Material scopes its own default token values
under `[data-md-color-scheme="default"]`, which beats a bare `:root`
selector on specificity -- silently, no error, the custom property is
just never used. Only `.md-header`/`.md-tabs` ever visibly themed,
because those set `background-color` directly via a class selector, not
through a custom property Material could out-specificity. Fixed by
matching the scheme selector -- this fix is real regardless of the
palette's fate below.

Screenshotted (`review/`, see the new workflow above) and shown for
approval before committing, per direct instruction. **Rejected**: "very
bland... a lot of the brighter pops from topology, which is missing."
Reverted `cabinet-material.css` to its original committed state
(`git checkout --`) -- the specificity bug fix went with it, since it
was only ever meaningful in service of the new palette; MkDocs is
back to its pre-#68 look pending a bolder second attempt.

### v3.7.62 -- ToDo file: done items collapsed, then a real rendering bug found and fixed same day

Direct request: 40+ done items were making the ToDo file hard to scan --
collapse them, individually, hiding the whole item behind just its `#N`.
Implemented as `<details><summary>#N</summary>...</details>` around
every top-level `- [x] **#N**` item (nested sub-items like `#35`/`#36`
under `#34` deliberately left alone, not individually wrapped -- lower
risk, and they're already visually subordinate to their parent).

Shipped, then a screenshot from the user showed real breakage: item
`#15`'s own text rendered as a giant stray heading instead of normal
paragraph text. Root cause: CommonMark requires a blank line to both
open AND close an HTML block cleanly; the first pass didn't guarantee a
blank line after every `</details>` (only before content going in), so
adjacent blocks merged into one continuous raw-HTML parse region --
`#15` sat between two collapsed blocks, its own backtick-protected
`` `<h1>` `` text got swept into that region and real-HTML-parsed
instead of read as an inline code span. Fixed by reverting to a
pre-collapse backup and rerunning with blank lines guaranteed on both
sides of every `<details>`/`</details>` pair, unconditionally. Verified
this time, not just re-shipped: confirmed all 43 blocks are blank-line-
isolated on both sides programmatically, plus a full diff of every `#NN`
reference before vs. after the whole exercise (identical set, nothing
lost or duplicated) -- the kind of check that would have caught the
first pass's bug before it shipped.

### v3.7.61 -- new Fab section; corrected a wrong assumption about how section placement actually works (#27/#123)

Direct intercession on the standing `WORLD-SYSTEMS.md` rule (#27):
FabAcademy/Fabricademy stay out of the world/Level-1 tier, but a **Fab**
*section* -- a couple of program-link islands plus reflection write-ups
-- doesn't violate that rule, since it was specifically about the
world tier, not sections in general.

`cabinet-sections.tsv` gained a `fab` region and four entries: Fab
Academy (`fabacademy.org`, inferred root domain, high confidence), Fab
23 ("Jesal's FabAcademy Chronicles," the confirmed personal 2023 page,
given directly), Fab 26 (Fabricademy 2026 -- a different sister program
than Fab Academy, confirmed via the `class.textile-academy.org` domain
rather than guessed), and Fabricademy itself (still no confirmed
general/public URL -- `textile-academy.org` root vs. a separate
`fabricademy.net` unresolved, left blank rather than guessed wrong into
production). Matching `mkdocs.yml` `Fab` nav section added, two stub
pages created then deleted again within the same pass once real URLs
arrived for what were originally going to be "coming soon" placeholders.

Corrected a wrong assumption made while scoping this, which also
resolves #69's earlier "the archipelago grid is full" blocker:
`cabinet-sections.tsv`'s `cx`/`cy`/`rx`/`ry` columns are NOT
authoritative fixed positions -- they read that way, but
`cabinet-v3-layout.js` actually computes section placement live via
`squarify()` (a real treemap algorithm), keyed only on `weight`. Proven
by actually adding the Fab section and rebuilding: the treemap reflowed
on its own, all four Fab islands rendered correctly on the first build,
no manual layout work needed. #41 (landing-page/mkdocs hierarchy
alignment) marked done on the same pass, on similarly honest accounting
-- every `cabinet-sections.tsv` row now has a matching `mkdocs.yml`
section except two explicitly-accepted exceptions (Visual Field Notes
has no mkdocs section because nothing exists there yet; Wild wild web
is present in both but still `status: false` on the map, a placement
decision not a hierarchy gap).

Also closed out a verification backlog from the Phase 1 launch
checklist while in the area: #25/#56 (fffx DNS/CNAME confirmed live),
#57 (Cabinet's own nav/routes verified, Bookshelf/FFFX's internal nav
out of scope -- no local repo access), #67 (the earlier content audit
marked done -- the audit itself is complete, follow-up items tracked
separately).

### v3.7.60 -- label glow's contrast collision fixed; Data Visualisations reverted to a real stub

Direct report: "All text labels need the soft glow but it seems to not
be working anymore." Investigated rather than assumed -- the glow
mechanism (`filter: drop-shadow`, `data-label-style="glow"`) was firing
correctly the whole time, confirmed via computed styles. The actual bug:
`--v3-label-outline` (the glow's colour) defaults to `--cab-land-light`
(`#f4ead0`, pale cream) -- fine when set, but v3.7.16 later repainted
medieval-map's own `--v3-veg` to `#fbf0ee`, a near-identical pale cream,
for an unrelated direct colour request. Two independently-edited values
silently collided months apart -- the glow was still rendering, just in
a colour almost indistinguishable from the land it sat on. Fixed with a
medieval-map-specific override reusing the theme's own `--v3-sea-shallow`
amber (already in-palette, not a new colour) for real contrast against
both the pale land/sea fills and the label's dark ink. Verified with a
before/after zoomed screenshot comparison, not just a computed-style
check -- the difference is dramatic once seen at the label scale.

Separately, direct correction: Data Visualisations was cross-listed to
Bookshelf's Christie/`agatha` dataviz page, but that's not actually
Data Visualisations content -- reverted to a real `wip` stub (no page
yet), matching the section's other genuinely-empty entries, rather than
a link that happened to resolve to something unrelated.

### v3.7.59 -- Bookshelf/FFFX split from Cabinet's own nav, real Teaching/Makings landing pages, Swatch Fields cross-listed on purpose (#72)

Direct follow-up to `v3.7.58`'s content-audit table, with corrections
to how several of that table's "duplicate" flags should actually be
read -- not every mkdocs+map double-listing is the same kind of problem.

**Bookshelf and Form follows f(x)**: their sub-pages belong in THEIR OWN
repos' mkdocs, not mirrored inside Cabinet's. `mkdocs.yml` now links each
as a single external entry to its own world root
(`bookshelf`/`fffx.cabinetofcuriosities.in`) instead of listing their
sub-pages locally. `cabinet-entries.tsv`'s own rows for these (scifi,
asimov, vera-molnar, etc.) are unaffected -- TSV and mkdocs are now
allowed to genuinely differ here, on purpose, not as a gap to close.

**Teaching**: gets a real `docs/teaching.md` landing page -- first entry
under a restored `mkdocs.yml` Teaching section, followed by the same 4
assembled/external links as before. This time the section isn't a flat
duplicate of the map: the landing page itself has no map equivalent.
`cabinet-sections.tsv`'s own `teaching` row `href` (previously a
placeholder pointing at the external SSD Creative Coding URL) now points
at this real page.

**Machines & Makings**: `makings.md` (an existing 21-word stub) promoted
to the section's first nav position as its landing page, now linking to
every sub-page including three brand new stubs -- Origami & Paper,
Lasercutting, Drawing Machines -- created to match `cabinet-entries.tsv`
rows that had stood `wip`/blank-href since the section was first built.
3D Printing's mkdocs-only sub-page cluster (Mecha/Flexures/PolyHedra/
2019, one combined TSV/map entry) stays exactly as it was -- direct
instruction to leave that "level 2" clustering question for later.

**Swatch Fields**: turns out to be a genuinely intersectional entry, not
a duplicate -- dyed fabric swatches read equally as Machines & Makings
(making process) and Interfaces, Data & Texts (colour/material data).
Given a second `cabinet-entries.tsv` row (`swatch-fields-interfaces`),
a second island, and a second `mkdocs.yml` nav entry, deliberately, on
the same precedent already set by `dataviz`'s existing cross-listing
from Bookshelf's Christie page. This needed a brand new `Interfaces,
Data & Texts` section in `mkdocs.yml` -- didn't exist as its own nav
grouping before, holds only Swatch Fields for now. The three actual
1:1 duplicates flagged in the audit table (Twine/WebTech/Tracery Bots,
still living under `Wild wild web`) are unresolved and distinct from
this case -- same href, same title, no differentiating landing page or
cross-category reasoning behind either listing.

Verified: `mkdocs build` clean after fixing `makings.md`'s new internal
links to the `.md`-suffixed form MkDocs' own build output suggested
(directory-style links to real local pages don't get validated, the
`.md` form does); `build-cabinet-content.js` (8 sections, 32 entries);
Playwright screenshot confirms both new stub islands under Machines &
Makings and the second Swatch Fields island under Interfaces, Data &
Texts render correctly, zero console errors.

### v3.7.58 -- Working with AI, Prompt Generator, Oblique Strategies, SSD Creative Coding become real map entries (#71)

Follow-up to `v3.7.57`, same day: asked how to get Teaching content onto
the actual archipelago map rather than just `mkdocs.yml`'s sidebar. The
map (`cabinet-sections.tsv`/`cabinet-entries.tsv`) and the docs sidebar
are genuinely separate systems -- the `teaching` section already existed
and rendered (that's where "Student Work" came from), Working with AI
just had no `cabinet-entries.tsv` row.

Added four entries: `working-with-ai`, `prompt-generator`,
`oblique-strategies` (all new), and `teaching-student-work`'s `href`
switched from the external SSD Creative Coding URL to its own assembled
path -- all four under the `teaching` section. Confirmed a non-obvious
fact about the packing algorithm before relying on it: an entry's `x`/`y`
TSV columns are dead for `placement: land` entries -- `cabinet-v3-
circlepack.js` seeds its own random `(x, y)` per item from a string seed,
and `cabinet-v3-layout.js` only ever reads `entry.visual.anchor` (for
`coast`-placement port cards), never `.x`/`.y`. Only `weight` (circle
size) and `order` matter; left the columns blank rather than filling in
values that do nothing.

Follow-up direct request: route Prompt Generator, Oblique Strategies and
SSD Creative Coding through the same Cabinet-local assembly as Working
with AI, at `/teaching/<slug>/`, not their external GitHub Pages URLs.
`deploy.yml` gained three more Checkout/Assemble/Validate step groups,
copy-pasted from `#43`'s pattern rather than generalized -- four real
examples now exist, which is exactly the threshold the concept note's
own Phase 2 section named as worth generalizing at, logged as a live
open question rather than acted on unprompted. Each source repo was
inspected first, same bar as `#43`: fetched each deployed page, grepped
for absolute-path `href`/`src` attributes and hardcoded
`jesmehta.github.io` references -- none of the three has either, so
remounting under `/teaching/` doesn't break their relative asset paths.
Oblique Strategies turned out to be a single self-contained HTML file
(inline `<script>`, no separate JS/CSS), so its Validate step checks
page content with `grep` instead of a second file's existence.

`prompt-generator` and `oblique-strategies` had briefly been added to
`interfaces-data-texts` earlier the same session (matching `tracery-bots`/
`webtech`'s "web pieces that don't belong inside fffx" precedent) --
moved to `teaching` once the direct request came in for where they
should actually live.

Last: `mkdocs.yml`'s `Teaching` nav section, added a few hours earlier in
`v3.7.57`, was removed entirely -- direct instruction, "eliminate the
lower one, Working with AI already covered." Once Teaching content is
real map entries, listing the same four links a second time in the docs
sidebar is pure duplication with no second purpose.

Verified locally: all three source repos' relative-path safety confirmed
before touching `deploy.yml`; `node tools/build-cabinet-content.js` (8
sections, 31 entries) and `build-static.mjs` succeeded; `mkdocs build`
clean; Playwright screenshot shows Teaching now holding six entries
(Student Work, History & Approach, Research & Interests, Working with
AI, Prompt Generator, Oblique Strategies), `interfaces-data-texts`
correctly back to its original five. The live GitHub Actions run and the
newly assembled `/teaching/<slug>/` paths still need confirming once
pushed, same content-aware method as `#43`/`#46`.

### v3.7.57 -- mkdocs nav restructured around Compass/Teaching, first `cabinet-sections.tsv` gap found (#41/#44/#46/#66-69)

Content audit requested directly: list what's in `cabinet-entries.tsv`/
`mkdocs.yml` nav, what's missing from each, flag pages that are empty in
practice even when the file exists, then restructure `mkdocs.yml`'s nav
to match the compass/world names. Word-counted every nav-linked `.md`
page first rather than trusting a visual skim -- confirmed most are
genuinely stub/"coming soon" (`about.md` 30 words, `makings.md` 21,
`creative_code.md` 42, `emergent_twine.md`/`trippyGourmet.md` 12 each,
three `fffx/` pages under 25, all three `3dp/3DP_*.md` prints pages
under 20) against a handful with real content (`mini_loom.md` 1019,
`site_notes.md` 1583, `dotMandalaTool.md` 1029, `traceryBots.md` 681,
`fffx/PackingShapes.md` 819). Logged as `#67` rather than acted on --
decided to leave `.md` files with no TSV entry alone for now, especially
the empty ones, instead of forcing a TSV row for a stub.

`mkdocs.yml` nav changes:

- New **Compass** section (About Me, Colophon, Now) -- mirrors the
  compass rose's own N/S directions. `docs/now.md` created as a stub,
  same "coming soon" pattern as `colophon.md` -- content later.
- New **Teaching** section: SSD Creative Coding (external, matches
  `cabinet-entries.tsv`'s existing `teaching-student-work` row), Working
  with AI (`https://cabinetofcuriosities.in/teaching/working-with-ai/`
  -- the first link anywhere to `#43`'s assembly, closing `#44`; fetched
  and confirmed live with the real page title before linking it, closing
  `#46` too), plus two more external repos, Prompt Generator and Oblique
  Strategies.
- `Thingamajigs` renamed to **Machines & Makings**, matching
  `cabinet-sections.tsv`'s `machines-makings` title -- direct progress on
  `#41`. Swatch Fields added under it.
- All four new external repo links (Prompt Generator, Oblique Strategies,
  Swatch Fields, Working with AI) were only given as `github.com/jesmehta/...`
  repo URLs -- checked each for an actual GitHub Pages deployment first
  (`jesmehta.github.io/<repo>/`, confirmed 200 + real `<title>`, not a
  disguised 404) rather than linking bare source repos into a docs nav.
- Fixed a pre-existing, unrelated stale nav reference found by the build
  warnings while testing this change: `mkdocs.yml` pointed
  `fffx/formFollowsFx.md` at a file that doesn't exist (real filename is
  `fffx/fffx.md`) -- a live 404 in production nav. One-line typo fix, not
  a content decision, so fixed on sight rather than logged as a to-do.

TraceryBots and Dot Mandala Generator were asked to also appear under
Form follows f(x) -- decided against moving or duplicating them.
Root cause instead: "Wild wild web" (their current home) has no
`cabinet-sections.tsv` row at all, unlike every other nav section. Added
one (`wild-wild-web`, `status: false`) so it's tracked, but left it
non-rendering -- the archipelago grid is already full (2 large + 4
medium islands + the compass's reserved corner), so giving it a real map
position needs a layout decision, not just a data entry. Logged as `#69`.

Verified locally: `mkdocs build` clean (no new warnings after the
`fffx.md` fix), `node tools/build-cabinet-content.js` succeeded with 8
sections/27 entries, `build-static.mjs` + promotion to `docs/index.html`
produced byte-for-byte the same visible map (the new section is
`status: false`, so it's filtered before rendering) -- confirmed with a
Playwright screenshot, zero console/page errors.

### v3.7.56 -- `deploy.yml`'s long inline comments trimmed to a help note

Direct request: replace the verbose per-step prose comments added in
`v3.7.54`/`v3.7.55` with something closer to onboarding documentation --
short, points at the relevant `#NN` to-dos, doesn't repeat the full
rationale inline every time. The single "how to add another repo"
explanation now lives once, in `cabinet-multi-repo-assembly-concept-
note-short.md`'s new "Quick reference" section (right after Phase 1) --
Checkout/Assemble/Validate as three steps, matching what `#43` actually
shipped, not the eventual Phase 2 manifest. `deploy.yml`'s own comments
were cut down to one short pointer at the top of the assembly block plus
one line per step, linking `#43`/`#44`/`#46` instead of restating them.

### v3.7.55 -- a dummy colophon page, and the archive finally deployed for real (#20/#61/#62)

Direct request: a placeholder colophon page, filed under the compass's
own S/Colophon direction, linking straight to the v1/v2 archive --
"I'll add the writing later." Three long-open items resolved together
as one small, concrete ask, once actually attempted:

- **`#20`** (write the colophon) -- scaffolding done, not the writing.
  `docs/colophon.md`: a short "coming soon" line plus the two archive
  links, added to `mkdocs.yml`'s nav as a top-level entry next to About
  Me.
- **`#61`** (link the archive from the live site) -- done for real, not
  just in principle. `archived-landing-pages/` has sat outside
  `docs_dir` since it was built, so `mkdocs build --site-dir public`
  has never once packaged it -- any link to it would have 404'd on the
  live site regardless of where that link lived. `deploy.yml` gained a
  "Copy archived landing pages" step, `cp -r archived-landing-pages
  public/archived-landing-pages` run right after the mkdocs build, same
  pattern as this version's own Working with AI assembly (below): copy
  into a path MkDocs itself never touches or generates.
- **`#62`** (rework or retire the archive lander) -- resolved by
  implication rather than a separate decision: the direct request to
  "link the archive subpages there directly" chose option (b) from the
  two `#62` had left open. `archived-landing-pages/index.html` itself
  is untouched -- still exists -- just no longer the intended path in;
  the compass's S direction and the colophon page both bypass it and
  link straight to `v1/`/`v2/`.

Also updated `content/cabinet-entries.tsv`'s `compass-s` row (previously
blank -- "href intentionally blank for now") to point at `colophon/`,
and re-learned a build-pipeline detail the hard way: the compass link's
`href` doesn't come from a live fetch of the TSV at all.
`cabinet-v3-layout.js` imports `{ sections, entries }` from
`docs/assets/js/cabinet-generated-content.js`, a file generated by
`tools/build-cabinet-content.js` -- editing the TSV alone changed
nothing until that generator was re-run, which is why the first build
attempt silently kept `href="#"` on the S direction. Re-run, confirmed
`"colophon/"` present in the generated file, then rebuilt
`landing-v3/index.html` and re-promoted to `docs/index.html` as usual.

Verified end to end with Playwright against the FULL assembled output
tree (mkdocs build + the archive copy together, not either one checked
in isolation): the colophon page renders with correct nav placement,
both archive links resolve to the real archived content with correct
titles, zero failed requests, zero console errors.

**Follow-up, same day**: the colophon page only linked `v1`/`v2`,
missing the four intermediate visual states `v2-history/` already holds
-- `01-initial` through `04-serpent-redesign` -- which the OLD archive
lander (`archived-landing-pages/index.html`) already linked with its
own labels, reused here. Nested under the `v2` link; confirmed the
4-space indent renders as a real nested `<ul>` under MkDocs'
Python-Markdown (which needs 4, not the 2 a CommonMark linter expects),
and that all four `v2-history/` paths resolve against the assembled
output tree. Confirmed live via a content-aware poll (checking the
actual page body for `v2-history`, not just an HTTP 200 -- the OLD
colophon page was already returning 200 before this shipped, so status
alone couldn't tell the two apart).

### v3.7.54 -- multi-repo assembly, phase 1: Working with AI mounted at /teaching/working-with-ai/

First real implementation of `three-world-launch-phases-Notes.md`'s
multi-repo assembly design (`#43`) -- see `cabinet-multi-repo-assembly-
concept-note-short.md` for the full architecture decision this
implements. `deploy.yml` now checks out `jesmehta/working-with-ai`
(public repo, no auth needed) into `_external/working-with-ai/` -- a
path outside `docs/`, so MkDocs never sees or processes it -- then, once
`mkdocs build` has produced `public/`, copies it into
`public/teaching/working-with-ai/` and validates the result before the
Pages artifact uploads. All-or-nothing by construction: `deploy` needs
`build`, so a failed assembly step means no new artifact and the
current live site stays exactly as it was.

Deliberately hand-written for this one project rather than the
generalized manifest the concept note describes for Phase 2 -- inspecting
the repo first showed it needs nothing more: no build step of its own
committed, every internal path relative, nothing hardcoding
`jesmehta.github.io`, so assembly here really is just "copy the files
somewhere MkDocs won't touch them."

Verified locally before ever touching the workflow file: reproduced the
exact CI sequence by hand (`mkdocs build --site-dir public`, then the
same copy), then load-tested the result with Playwright -- correct
title, all 16 table-of-contents links present, the first link resolves
correctly at the new nested mount depth, and the sibling `coding-with-
ai/` sub-site (present in the same repo but not linked from its own
root page) also loads clean. Zero failed requests, zero console errors.

Not yet done: the live GitHub Actions run itself isn't confirmed (no
`gh` CLI in this environment to read run logs), and nothing in Cabinet
links to the new path yet (`#44`) -- deliberately held until the live
deploy is confirmed working, not just the local simulation.

### v3.7.53 bugfix -- compass direction labels went invisible on hover in Medieval

Fourth instance of the same root cause as v3.7.23/v3.7.48: on hover,
`.v3-compass-direction-label` switches `fill` to `--v3-halo-ink`, which
defaults to the shared `--cab-land-hover` (`#faf3dc`, a pale parchment
cream) unless a theme overrides it -- fine against a dark sea, invisible
against medieval-map's own equally pale one. Direct report: "hover on
the compass rose labels makes them cream and disapper into the
background."

Fixed with a medieval-scoped override on just the label's `fill` (not a
blanket `--v3-halo-ink` retune in medieval-map's own token block) --
that token also drives `.v3-compass-arm-glow`/`.v3-island-glow`/
`.v3-section-glow`, none of which were reported broken and likely read
fine staying pale even in this theme; narrower blast radius, one less
thing to have to re-verify. The override needs an extra
`body.v3-proto[data-theme="medieval-map"]` ancestor prefix on all four
direction rules (not a smaller tweak) to out-specificity the existing
per-direction hover rules honestly, rather than reaching for
`!important`. Verified via computed style (`getComputedStyle(...).fill`
read back as `rgb(28, 23, 18)`, exactly `--v3-ink`) and a screenshot.

### v3.7.52 -- compass spin gets a real ease-in/cruise/ease-out shape

Direct request: "compass spin rate needs to slowdown - or even better,
start slow, speed to current speed, and slow down - use an easing
function to start-stop, over the first 90 and last 90 degrees, top
speed only at 180 +- 45 degrees, or however you see fit."

`@keyframes v3-compass-spin` (`#29`) went from one flat `ease-in-out`
across the whole 360 degrees to three explicit segments, each with its
own `animation-timing-function` set per-keyframe (applies to the
segment leading out of that keyframe -- standard CSS, well-supported):
`ease-in` from 0deg to -90deg, `linear` (constant cruise) from -90deg to
-270deg -- the middle 180 degrees, comfortably covering "top speed at
180+-45" with room either side -- then `ease-out` from -270deg to
-360deg.

Total duration: 1350ms, not 900ms. Chosen deliberately, not guessed:
the cruise segment's own angular rate (180deg over 450ms = 0.4deg/ms)
matches the OLD flat animation's rate exactly (360deg over 900ms, also
0.4deg/ms) -- "speed to current speed," meaning the fast part still
feels the same speed it always did, the two eased ends are pure addition
on top of that rather than a retune of the cruise itself.

Verified by sampling the live rotation matrix (`getComputedStyle(...).
transform`) at roughly 15 timestamps across one full spin, not just
eyeballing a screenshot: near-zero angular velocity at both the very
start and the very end, ramping up to ~0.35-0.43deg/ms through the
middle -- matching the 0.4 target within normal timing-sample jitter.
Both spin groups (the rose itself and the diagonal rays, `#29`'s
v3.7.49 follow-up) stay in exact lockstep throughout, since they share
one `@keyframes` rule, one duration, and one hover trigger by
construction -- no separate verification needed for that part.

### v3.7.51 -- v3.7.50 was itself wrong: a real full-canvas structural layer, not a global hover reveal

v3.7.50 shipped, then broke on the very next look. Direct report:

> "neightbourig islands, esp non-entry ones, and the sectional
> boundaries, are being occluded. Dont render individual islands. Maybe
> have a full topology also built alongside the per island and per
> section builds."

v3.7.50's fix -- globally revealing the theme-preview mechanism's
per-island washes instead of gating them behind `:hover` -- was correct
about WHAT already existed (the theme x hover feature really does build
a full Topology render) but wrong about HOW it was built. Each preview
is computed in isolation
(`buildIsolatedHeightmap([c], v3Config.island, ...)`, that one island's
circle data only), sized with a generous halo meant to blend into open
water around exactly ONE hovered island at a time. Revealing every
entry island's isolated wash simultaneously meant every one of those
halos was now bleeding across whatever sat nearby -- and non-entry
filler circles (the small unlabeled decoration islands scattered
through the map) never got a preview built for them AT ALL, since
`renderRegion()` only calls the theme-preview construction for
`c.kind === "entry"`. A filler sitting inside a neighbouring entry
island's halo radius had nothing of its own to show through, and the
dashed section-boundary lines suffered the same fate wherever a wash's
blur passed over them.

The actual fix, `drawTopologyStructuralLayer()`
(`cabinet-v3-layout.js`): build Topology's bands and directional shadow
the SAME way `drawIslandsPath()` already builds Medieval's -- one
shared heightmap across every island together, not one per island.
Concretely, it reuses `islandTrace` -- the `{ H, cols, rows,
paddedBounds }` `drawIslandsPath()` already computed and returns, the
exact geometry every real (non-preview) coastline/band on the map
traces from -- and retraces it at Topology's own levels instead of
Medieval's. Correct for fillers and section boundaries by construction,
because it isn't a copy or an approximation of the real map's geometry,
it IS the real map's geometry.

Scope stayed deliberately narrow. Checking `THEME_PRESETS`
(`cabinet-v3-controls.js`) again: Topology only actually needs two
things Medieval's own build never produces at all --
`flatColourMode: true` means Medieval skips real sand/veg/peak bands
entirely (just one flat fill), and `seaShadowStyle: "radial"` means
Medieval never takes the directional-shadow branch. Wave rings and
coastal bands stay OFF for Topology in both builds
(`showWaveRings`/`showCoastalBands: false`), so v3.7.50's "hide
Medieval effects" CSS rule already handles those correctly -- no need
to touch them. One thing did have to come OUT of that hide-list,
though: `.v3-sea-shadow-taper` was sitting there as a "Medieval effects"
target that Medieval's own build never actually produces anyway
(harmless before), but `drawTopologyStructuralLayer()` now reuses that
exact class name for its own real directional-shadow content -- leaving
it in the hide-list would have hidden the very shadow the new function
exists to draw. Every other class name (`.v3-sea-band-N`,
`.v3-sand-band-N`, `.v3-veg-band-N`, `.v3-peak-band-N`) is reused
directly from the real, non-preview rendering path too, for the same
reason: Medieval's build never creates any of them, so there's no
collision, and they already read correctly off the same theme-reactive
`--v3-sand`/`--v3-veg`/`--v3-peak` tokens the rest of the map uses --
no new colour rules needed, unlike the theme-preview mechanism's own
fixed `--v3-preview-*` stand-ins.

Static payload grew from ~4.7MB to ~6.2MB -- roughly +33%, not the ~2x
a genuine second full render would have cost, since only the two
missing structural pieces were added, not a duplicate of the whole
map. Verified visually (Playwright, both directions, the same
Vera-Molnar/Circle-Packing-Library/Particle-Systems crop the bug report
used): real textured/shaded islands, directional drop-shadows, zero
wave rings, section-boundary dashes and filler islands fully intact
this time, and a clean round-trip back to Medieval's flat/banded look
on a second click. `mkdocs build` still clean.

Same "check what already exists before reaching for a rebuild" lesson
as the boats/dragons cost correction (`#64`) -- but the correction
itself needed correcting once, this time, before it actually held.

### v3.7.50 -- the theme swap actually works now: reusing the hover-preview mechanism instead of rebuilding anything

v3.7.49 closed with three costly options for making the theme swap
structurally correct: reframe it as colour-only, double the static
payload to bake both themes' structure, or a partial client-side
re-render. Direct, sharp correction before any of them got built:

> "21 - The Hover ALREADY HAS all of TOPOLOGY built in!! You just have
> to do the hover equivalent of the entire canvas and fix it! I dont
> see why you keep wanting a new big bang every time an asteroid has to
> change orbit."

Correct. The theme x hover feature (v3.7.32-v3.7.44) already builds a
FULL, independently-traced Topology render for every island and section
-- real directional shadow (`buildIsolatedShadowTaper` with Topology's
own `seaShadowAngleDeg`), real sea/sand/veg/peak band tracing at the
same theme-invariant thresholds the live map uses, a real coastline --
because `v3Config.themePreview.previewTheme` is hardcoded `"satellite"`
(`cabinet-v3-data.js`). It was only ever scoped to reveal on a per-
element `:hover`/`:focus-visible`, via plain `opacity: 0 -> 1` CSS
transitions on classes like `.v3-island-theme-preview`,
`.v3-island-theme-preview-sea/-sand/-veg/-peak/-coastline`, and their
`.v3-section-theme-preview-*` counterparts -- an opaque wash + real
bands stacked on top of the shared base geometry, replacing it visually
without touching it.

The fix is two small CSS rules, both keyed off `data-theme="satellite"`
-- already set by the existing click handler, no new state needed:

1. Reveal every `*-theme-preview*` layer at once (the exact same
   `opacity: 1` the `:hover` rules already apply, just triggered
   canvas-wide instead of per-element).
2. Hide the 5 "Medieval effects" elements outright --
   `.v3-wave-ring`, `.v3-coast-outward-band`,
   `.v3-coast-inward-band-group`, `.v3-sea-shadow-radial`,
   `.v3-sea-shadow-taper` -- rather than relying on the existing
   `#v3-medieval-effects-clip` mechanism, which moves a single
   clip-path "hole" to whichever ONE island is currently hovered and
   was never meant to cover the whole canvas at once.

Also extended the v3.7.48 cross-fade's broad `#v3-stage *` transition
rule to include `opacity` (previously only `fill`/`stroke`/
`background-color`) so the reveal/hide fades at the same 450ms as
everything else, rather than the wave-rings/bands snapping instantly
while colours fade smoothly around them.

Zero new JavaScript, zero added payload, zero rebuild. Verified visually
(Playwright, both directions): swapping to Topology now shows real
textured/shaded islands with directional drop-shadows and correctly no
wave rings; a second click reverts cleanly to Medieval's original flat/
banded look with no residual artifacts. Same "check what already exists
before reaching for a rebuild" lesson as the boats/dragons cost
correction (`#64`) -- that one was self-corrected after a direct
challenge; this one the user caught outright, pointing straight at code
already sitting in the file.

The in-topology hover preview (hovering an island while already swapped
to Topology should preview Medieval, currently still shows Topology's
own now-redundant preview) stays unfixed -- confirmed secondary, can
wait.

### v3.7.49 -- full-width header, diagonals now spin with the compass, and a real structural gap found in the theme swap

Follow-up round after actually testing v3.7.48's three items live.

**#60 follow-up.** `.v3-header`'s `max-width: 640px` dropped -- the
sticky bar only covered the left ~640px of the row, direct feedback:
"needs to be full width - i may add some text on the right corner later,
maybe." Not building a flex/right-corner layout now since that content
is still hypothetical; a plain full-width block is a smaller diff to
extend later than a flex row would be to have guessed wrong now.

**#29 follow-up.** Direct question: "can the diagonal lines also rotate
with the compass?" They now do. The rays (`drawGeoGrid()`) moved into
their own nested `[translate -> rotate]` pair, same reasoning as the
rose's own spin group: an inline SVG `transform="translate(...)"`
attribute and a CSS `transform: rotate()` can't coexist on one element
-- CSS replaces the attribute outright rather than composing with it.
Each ray is drawn relative to local `(0,0)`, which the outer translate
already pins to the compass's true centre, so the spin rule's
`transform-origin: 0 0` is a constant rather than needing the compass's
actual per-render coordinates computed into the stylesheet.
`.v3-geo-grid` (and the diagonal spin group inside it) is a SIBLING of
`.v3-compass`, not a descendant, so its `:has()` trigger is rooted at
`#v3-stage` -- their nearest common ancestor -- rather than
`.v3-compass` like the rose's own rule. Verified via computed-style
inspection mid-hover (not just a screenshot) that both groups carry the
same live rotation matrix.

*(An earlier verification pass using guessed screen coordinates for the
hover point wrongly suggested the spin wasn't triggering at all --
turned out the mouse was landing on one of the existing direction-label
hit-rects instead of the ring. Re-tested with coordinates derived from
the actual hit-circle geometry at a 45-degree off-axis angle: works
correctly. Recorded here since it could easily have been reported as a
bug that didn't exist.)*

**#21 -- real problems found, not yet resolved.** Direct report after
actually using the swap: **"theme swap - doesnt work fully - the
transition over 450 ms is ok, but it shows topology as a flat version...
topo bands are missing, etc."** Root cause: `document.body.dataset.theme`
only flips the CSS custom-property layer (fill/stroke colour tokens).
Whether wave rings or coastal bands draw at all, and whether islands
render flat or shaded, is controlled by
`v3Config.island.flatColourMode`/`showWaveRings`/`showCoastalBands`/
`seaShadowStyle` -- baked into the static SVG once, at BUILD time, from
whichever theme `build-render.html` had active (`medieval-map`,
hardcoded). `THEME_PRESETS` (`cabinet-v3-controls.js`) sets these
genuinely differently per theme (`satellite: flatColourMode: false,
showWaveRings: false, showCoastalBands: false, seaShadowStyle:
"directional"` vs medieval's `true/true/true/"radial"`) -- a runtime
attribute flip cannot retroactively add or remove structural SVG
content that was never drawn (or was drawn under different flags) at
build time. Confirmed by screenshot: swapped-to-Topology still renders
with medieval's flat-fill-plus-ring island style, just recoloured.

Real options laid out, not yet chosen between:
- **(a) Reframe, don't rebuild.** Accept this as a deliberate "Topology
  colours on Medieval structure" partial swap and stop describing it as
  a full theme swap. Zero additional cost, but doesn't give Topology its
  own actual look.
- **(b) Double-bake.** Render both themes' full structural variants at
  build time, toggle visibility via `data-theme`. No added runtime JS or
  compute cost, swap stays instant/fadeable -- but roughly doubles the
  static HTML payload (currently ~4.7MB of SVG markup for one theme).
- **(c) Partial live re-render.** Reuse the already-serialized
  `grown`+`canvasBounds` (the same data v3.7.47's boats/dragons already
  reads out of `#v3-anim-data`) to re-run just the island-drawing/
  coastline-tracing portion of `cabinet-v3-layout.js` client-side on
  swap -- deliberately NOT the full 170KB+ engine, since
  treemap/circlepack only decide island POSITIONS, which don't change
  between themes, only their structural rendering flags do. Still real
  added JS and a genuine recompute pause on click, though, not instant.

A second, smaller issue was flagged as secondary by direct confirmation
("The In-topology hover behaviour is secondary, but the colours applied
are off, topo bands are missing, etc."): the per-island theme-preview
hover wash is a static, pre-baked decoration meaning "hover shows what
the OTHER production theme would look like," fixed relative to build
time -- not reactive to whichever theme is CURRENTLY active after a
swap. Once swapped into Topology, hovering should preview Medieval, but
still shows Topology's own now-redundant preview. Same root cause as the
structural gap above; likely resolved by whichever option is chosen
there rather than needing a separate fix.

**Fixed in the same pass, unrelated to the above.** A ~10px page-jump on
every swap, direct report: **"if youre scrolled to the top of the page,
then the H1 frame is different sizes in both themes, and so the page
moves up and down by 10ish px everytime its swapped because it's
attached to the upper frame."** Root cause: medieval-map's `.v3-header
h1` override swaps `font-family` to Cinzel, a different typeface with
different natural line-height metrics than the base heading font --
left at the default `line-height: normal`, that swap changed the
header's total rendered height, and since `.v3-header` is `position:
sticky` in normal document flow, that height change showed up as the
whole page shifting. An explicit `line-height: 1.2` forces the same
line-box height regardless of which font is actually rendering inside
it. Verified identical `.v3-header` height in px immediately before and
immediately after a swap.

### v3.7.48 -- sticky header, compass click to swap theme, compass hover to spin

Three small/fun items batched together (`#60`, `#21`, `#29` on
`three-world-launch-phases-ToDo.md`), plus a real bug the first of them
surfaced.

**#60 -- sticky header.** `.v3-header` is now `position: sticky; top: 0`
with an opaque white background; the map (and footnote) scroll normally
underneath it. Pure CSS -- sticky doesn't remove an element from
document flow, so `resolveCanvasDimensions()`'s measurement of
`.v3-stage-wrap`'s start position is unaffected, no JS changes needed.

**Contrast bug, found via #60.** Giving the header an explicit
background exposed that `.v3-header h1`/`.v3-subtitle`/`.v3-footnote`
all defaulted to `--cab-land-light` (a light parchment cream) for every
theme except medieval-map, which got a one-off `--v3-ink` override back
in v3.7.23 ("H1/title Cabinet Text in Medieval theme is invisible"). The
original comment justifying that default -- "sized for the dark-sea
themes... this text sits directly on the page's own sea background" --
was wrong even when written: the header has sat on plain (implicit)
white ever since v3.6.12 put it back in normal document flow, not on any
sea colour. Medieval-map's version was bad enough (near-invisible
cream-on-cream) to get reported and fixed on its own; every other theme
had the same bug at a lower severity (pale-on-white, readable but poor
contrast), invisible until #21 (below) made it possible to actually view
another theme on the production page at all. Fixed by defaulting all
three to `--v3-ink` instead -- already dark and theme-correct on every
preset, since it's the map's own text-ink token -- which also made the
medieval-only override redundant; removed it (kept the Cinzel
font-family override, which is unrelated to colour).

**#21 -- click the compass centre to swap Medieval <-> Topology.** A
small invisible circle at the rose's centre
(`.v3-compass-theme-hit`, `renderCompassRegion()`,
`cabinet-v3-layout.js`) toggles `document.body.dataset.theme` on click
(`startThemeSwap()`, `cabinet-v3-production-animate.js`). Both themes'
CSS already ship unconditionally on the static build (confirmed by
inspection before writing any code), so this really is just the
attribute flip -- no colour math, no per-theme JS. Shipping with a
**cross-fade**, not an instant snap, at the user's direct request to see
it live before choosing between the two ("I want to see the transition
before the switch version") -- instant was the original lean going in,
this is deliberately provisional pending that comparison. The fade is
`transition: fill 450ms ease, stroke 450ms ease, background-color 450ms
ease` applied broadly to `#v3-stage, #v3-stage *` (every themed SVG
element -- bands, coastlines, compass, labels, boats/dragons -- lives
under that id, so this catches all of them without hand-listing classes,
at zero idle cost since transitions only run when a value changes) plus
`color 450ms ease` on the header/footnote text. If instant wins, the fix
is deleting that one CSS block. Known limitation, inherited from
`#64`/v3.7.47: boats/dragons only have Medieval colours defined
(`PARTICLE_COLORS`, `v3Config.dragon.fillColors`), so they don't re-tint
on swap to Topology -- already-flagged future scope ("may ask for theme
based colour later"), not addressed here.

**#29 -- hover the compass ring to spin it.** One full anticlockwise
revolution, replays on every hover, no JS state -- matches the existing
arm-glow hover mechanism's own no-state pattern. Deliberately scoped
away from #21's click circle after a direct concern about overloading
the centre: **"We're doing the theme swap by clicking on the inner
circle, I dont want to overload the compass centre too much."** Solved
geometrically: a second invisible hit shape,
`.v3-compass-spin-hit`, sized to the rose's full extent and appended
UNDERNEATH the smaller `.v3-compass-theme-hit` circle in paint order --
plain SVG hit-testing means the smaller circle wins for the centre, the
larger one only catches the ring/arm area outside it, no evenodd/annulus
math needed. The rotation itself is pure CSS: the star artwork moved
into a new nested group, `.v3-compass-rose-spin` (separate from
`roseGroup`'s own translate/scale positioning, so the two transforms
don't fight each other), with `transform-box: fill-box; transform-origin:
50% 50%` centring the spin on the group's own bounding box regardless of
what coordinate space the parent transform runs in, and a `:has()` rule
(`.v3-compass:has(.v3-compass-spin-hit:hover) .v3-compass-rose-spin`)
applying a 900ms `rotate(-360deg)` keyframe animation on hover -- same
`:has()` pattern the existing arm-glow hover already uses. **Scope note:**
the original request also mentioned "the diagonals radiating from its
centre, so they keep matching its ordinal arms" -- those diagonals (the
lat/long grid's ordinal rays, drawn separately in `render()`) do NOT
rotate with the rose in this pass; only the rose graphic itself spins.
Not attempted, flagged rather than silently dropped.

**#37 held.** A real interior-seam label-overflow example was found and
shown before deciding anything (`History & Approach`/`Research &
Interests`, the tightly-packed 3-island Teaching cluster) -- every other
candidate label checked (Circle Packing Library, Doors of Kutch,
Christie, 100 Gradients) turned out to sit cleanly inside its own
coastline, so this isn't a general problem. Fix approach not yet chosen;
explicitly held at the user's request pending #21/#29/#60 landing first.

### v3.7.47 -- boats and dragons, live, on the production build

`#38` had marked flowfield/particle boats + dragons "consciously
deferred" from the static production build -- true at the level of
"the static build has zero client-side script," but never actually put
to the user for a decision. Reopened directly once the deferral had a
concrete, visible consequence rather than an abstract one: **"I never
agreed to not having the boats and dragons - they make the page alive.
Why would I put in so much effort on something that wasnt going to be
shipped. It's going on the live page."**

First cost estimate was wrong, corrected by direct challenge: **"Isnt
the real engine just a particle system and a noise field? The islands
are already there as svgs. What is the problem?"** The original
estimate assumed reusing `startCurrentAnimation()` meant loading the
whole `cabinet-v3-layout.js` (170KB+) along with `cabinet-v3-treemap.js`/
`cabinet-v3-circlepack.js` -- but those two only decide WHERE islands go,
a decision that's already made and baked into the static SVG. Checking
`startCurrentAnimation()`'s actual dependencies (`islandLayoutState`/
`lastIslandTrace`) showed it only needs `grown` (the circle-packing
OUTPUT -- tiny, per-island x/y/radius) plus canvas bounds, not the
algorithm that produces them.

Further trimmed by direct scoping: MedieRiso-specific particle/dragon
colour branching dropped (that theme is a kept-reference scratchpad,
never ships to production -- "medieriso is gone already... only the
topo and medieval themes are in use"), click-to-launch dropped ("we
can get rid of mouseclick to new boat, thats ok, if it is a big load. i
had forgotten it even existed"), the dragon's dive/resurface slide-and-
clip rendering kept unchanged ("dragon slide-sink is a keeper though,
that works nicely").

Implementation: `build-static.mjs` now also captures `grown`+
`canvasBounds` from a finished `render()` (a new `getIslandLayoutState()`
export on `cabinet-v3-layout.js`, read via a small capture-only script
in `build-render.html`) and serializes it into the static build as an
inline `<script type="application/json" id="v3-anim-data">` block. A
new `cabinet-v3-production-animate.js` reuses `cabinet-v3-flowfield.js`/
`cabinet-v3-particles.js`/`cabinet-v3-dragon.js`/`cabinet-v3-islandshape.js`'s
`buildIslandHeightmap` completely unmodified -- zero duplication of the
actual physics -- with only the DOM-rendering glue freshly written and
trimmed per the above. ~150KB uncompressed added payload, not the
~350KB+ first estimated skipping `cabinet-v3-treemap.js`/
`cabinet-v3-circlepack.js` entirely turned out to matter more than
minifying/bundling would have. Promoted to `docs/index.html` the same
way as everything else: the 6 files copied into `docs/assets/js/`,
three path rewrites (two stylesheets, one script src). Verified via
Playwright on both `landing-v3/index.html` and the promoted
`docs/index.html`: 130 particles, 1-3 dragons, positions genuinely
change frame to frame, zero console/request errors, full `mkdocs
build` still clean.

Caught and corrected in the same stretch: an unrelated false claim (in
`three-world-launch-phases-ToDo.md`'s `#64`) that the theme x hover
mechanism "doesn't work in production for the same reason" boats/
dragons didn't -- direct pushback (**"it does work, what are you
talking about ?"**) led to actually checking: every hover-preview rule
is a pure CSS `:hover` selector revealing already-baked SVG paths via
opacity, zero JavaScript involved, unrelated to the animation-loop
requirement boats/dragons actually have.

### v3.7.46 -- production's H1/section/island labels were never loading their actual fonts

`index.template.html` (and therefore `index.html`, and therefore
`docs/index.html` once promoted) loaded no webfonts at all. The Google
Fonts `<link>` only ever existed in `islands-tool.html`, behind a
comment saying font choice "hasn't been chosen as final yet" -- true
when written, no longer true once punch-list item 10/#36 (final
colour/type choice) was marked done, but the production template was
never updated to match. Every themed font silently fell back to
`--cab-font-heading`/`--cab-font-body`'s fallback (Georgia) instead of
Medieval Map's actual Cinzel (H1) / IM Fell English (section labels) /
EB Garamond (island labels) -- invisible as an error, just visibly
wrong once compared directly against `islands-tool.html`, which is how
it was caught: **"the index.html did not have the same H1 font as the
tool pages... check the other fonts in main index vs island-tool."**

Fixed by adding only what Medieval Map (the one theme the static build
ever ships, `data-theme="medieval-map"` hardcoded) actually needs, not
`islands-tool.html`'s full nine-family scheme-comparison set -- Topology
(`satellite`), the only other production-bound theme, has no
`font-family` override at all and needs nothing loaded. Verified via
Playwright: `h1`/`.v3-section-label`/`.v3-island-label` all compute the
correct family, zero request errors, on both `landing-v3/index.html`
and the promoted `docs/index.html`.

### v3.7.45 -- static build was missing data-theme, fell back to unthemed base colours

Every theme's colours are scoped entirely through
`body.v3-proto[data-theme="..."]` CSS selectors -- `islands-tool.html`
hardcodes `data-theme="medieval-map"` on `<body>`, but `build-render.html`
(the headless-capture source) and `index.template.html` (the shipped
page itself) never carried that attribute at all. Caught directly: **"v3
index isnt in perfect sync with island tool - the base theme is still
flat-ish topology, not medieval colours."** Since theming is entirely
class-driven rather than baked into the captured SVG markup, the fix
didn't change the captured markup's byte length at all -- only the
missing `data-theme` attribute on both templates' `<body>` tags, so the
existing CSS cascade actually applies once rendered. Regenerated
`index.html` afterward to confirm.

### v3.7.44 -- Island noise debug overlay resolution doubled

Direct request: "Island noise heightmap needs to be finer than what it
is currently. It doesnt cost the user anything, only at the tool level
to me, so atleast double the resolution from current." `NOISE_DEBUG_CELL_PX`
(the Diagnostics > Island noise debug overlay's own tint-swatch size,
`cabinet-v3-layout.js`) 24px -> 12px -- doubles resolution on both axes
(4x the SVG rect count). Dev-only overlay, never shipped in
index.html/the production build, so the extra render cost lands only on
this tool, never on an actual site visitor -- confirmed live via
Playwright: rect count went from ~2100 to ~8400 with no console errors.

### v3.7.43 -- control panel reorganized into a fixed sequence, five new subsection-local Reset buttons

Direct request: a full re-sequencing of the Visuals section (Theme
dropdown, Hover theme, Coastal effects, Text label style, Bands width,
Wave ring, Topological offset, Particle counts, Geo grid, Theme
colours, Diagnostics, Reset visuals) plus dedicated Reset buttons on
five subsections that never had their own (Hover theme, Bands width,
Wave ring parameters, Topological offset parameters, Particle counts).

Implemented as one final re-parenting pass at the end of the Visuals
section's construction, not by moving each block of construction code
around the file. Every row/subsection stayed built and wired exactly
where its own logic already lived (`applyThemePreset()`, for one,
reads `bandCheck`/`waveCheck`/`coastalBandCheck` -- declared earlier in
the file specifically so it can) -- `appendChild()` on an element
already in the document moves it rather than cloning, so a single
ordered list of `visualsSection.appendChild(node)` calls both created
the one genuinely new grouping ("Coastal effects," wrapping five rows
-- Wave contours, Colour bands, Coastal band, Sea shadow, Shadow style
-- that were previously loose top-level children of Visuals) and
re-sequenced everything else, with zero risk of breaking declaration
order.

The five new local Resets required extracting logic that used to live
only inline inside the monolithic `resetVisuals()` into named functions
(`resetHoverTheme`, `resetBandWidths`, `resetWaveRing`,
`resetTopoOffsets`, `resetParticleCounts`) -- the master Reset visuals
button now just calls all five plus whatever never got its own button
(Coastal effects' checkboxes, the Theme dropdown, Geo grid,
Diagnostics), rather than duplicating the restoration logic in two
places. One of the five, Hover theme, had never had ANY reset path at
all before this -- `v3Config.themePreview` (previewTheme/islandHaloPx/
sectionHaloPx/blurPx) was simply never touched by the old
`resetVisuals()`, so its defaults snapshot (`visualsDefaults`) had to
be captured here for the first time too.

Verified via Playwright: the panel's top-level Visuals children now
read, in order, Theme row / Hover theme / Coastal effects / Label style
row / Bands width / Wave ring parameters / Topological offset
parameters / Particle counts / Geo grid / Theme colours / Diagnostics /
Reset visuals button -- exactly the requested sequence -- and all five
new local Reset buttons plus the master Reset visuals button run with
zero console errors.

### v3.7.42 -- coastal band model simplified: "land baseline" only, sea-ward outward fade dropped

Direct feedback after the v3.7.41 slider work above: "Land baseline
should be coastline by default, to subtract from, shouldnt be
extending out to sea. This will make it simpler, remove 3 extra
sliders."

`coastOutwardBandDistances` (the sea-ward half of the v3.7.9
coast-hugging fade pair) set to `[]` in `cabinet-v3-data.js` --
kept as a real, re-enablable array rather than deleted outright
(`placeBand()` already treats an empty distance list as a clean no-op,
same as every other optional layer here), just no longer shipping a
default effect or a slider. The "coastal band" is now purely a
land-side concept: `coastInwardBandDistances` measures inward from the
coastline baseline, full stop. The sea side's own depth/shadow was
never dependent on this array anyway -- `seaBandThresholds` and
`seaRadialShadowDistances` cover it independently -- so nothing else
needed to change to keep the sea reading correctly.

Panel-side: the three "Coastal band, outward" sliders (added one
version earlier, v3.7.42's own precursor) removed from "Bands width
(px)"; the remaining "Coastal band, inward" sliders renamed to just
"Coastal band" (no more counterpart to disambiguate against), leaving
7 sliders instead of 10. `visualsDefaults`/reset code updated to match.
Verified via Playwright: `.v3-coast-outward-band` no longer appears in
the rendered DOM at all, and "Reset visuals" still runs clean.

### v3.7.41 bugfix -- section label textbox wasn't covered by the hover wash; the fix that added it broke rendering, then a second fix corrected both

Direct report, screenshots included: "Wave contour is gone, ok. The
textbox inclusion is behaving weirdly. I think some overlap/vector
direction are messing things up, there are white patches over all
textboxes like this. - correct that - i dont need the entire section
band highlighted, just the textbox + proportional margins."

Two rounds. First: the section-level theme-preview wash was traced
from the section's circles alone (`buildIsolatedHeightmap`), same as
the per-island version -- but a section's own hit/glow shape has
always been the label BAND (a generous full-width strip reserved by
`splitLabelBand()` so packing never touches it) unioned with the
islands trace, a v3.6.26 request. The preview wash never got that same
union, so hovering a section left its label rectangle uncovered: no
deep-sea fill, no hover-clip hole, so whatever Medieval content sat
under the label stayed fully visible and unclipped. First attempt
concatenated a rect subpath for the full label BAND directly onto the
wash's own `d` string, sharing one `fill-rule="evenodd"` -- which only
unions two shapes where they DON'T overlap; wherever the label rect
intersected the (often much bigger) island halo blob, the shared
evenodd rule XORed the overlap back out, punching a real hole -- a
self-intersection bug, not a winding-direction one (evenodd doesn't
look at direction at all, despite the user's own reasonable guess),
but the same class of "don't merge shapes into one path unless certain
they never touch" mistake the codebase's own sibling-element
convention (the hit/glow band rect sitting next to the islands path,
not merged with it) already exists to avoid.

Fixed properly: the label's own wash is now a SEPARATE sibling
`<path>` (same shared `.v3-section-theme-preview` class, so it still
inherits the fill/opacity/blur/hover rules automatically), so no XOR
interaction with the composite blob is possible. Also switched its
size from the full label band to the label's own rendered bounding box
(`labelGroup.getBBox()`, measured by attaching to the already-live
`stage` just long enough to read it, then detaching -- final DOM
placement, after every island so it still paints on top, is unchanged)
plus a margin proportional to the label's own font size, not the
generous hit-testing band -- direct request: "i dont need the entire
section band highlighted, just the textbox + proportional margins." No
hover-clip-hole contribution from the label rect at all: the label
band is a reserved, packing-free strip by construction, so real
coastline effects never reach it in the first place, only the visible
tint needed covering.

Separately, same round: "The wave contour lines are still visible
underneath the deep sea colour for section hovers, but not for island
hovers" -- the section wash was deliberately left at 0.85 opacity (vs.
the island wash's 1.0) so a big flat fill wouldn't read as "a hard
block"; that was exactly opaque enough to let Medieval's
clipped-but-blur-edged wave-rings show faintly through. Since this
layer now correctly stands in for the real theme's own literal flat
deep-sea backdrop (see v3.7.40 below), reading as one flat block is
correct here, not a flaw -- bumped to 1, matching islands.

Verified via Playwright (subpath counts on the `d`/`data-clip-d`
strings, computed opacity), not just screenshots.

### v3.7.40 -- the hover wash's own colour was identical to the sea-depth bands painted on top of it; separated and re-enabled

Direct feedback after the wash was temporarily disabled entirely
(v3.7.39's own fix hadn't resolved the underlying report): "ok, so the
sea topology is there, it was buried under the halo. The last layer of
the sea, the part that should be visible with the halo outline and the
colour for the -1.4 sea anchor level, is missing. Colour the hover
outline with that colour but layer it bottommost while stacking the
topologies. In the original theme it is just the base colour for the
whole canvas, here you will have to give it an outer bound."

The wash (`.v3-island-theme-preview`/`.v3-section-theme-preview`) and
`seaBandThresholds`' own translucent bands were BOTH reading
`--v3-sea-shallow` -- the exact same hex -- so the bottommost "-1.4
anchor" tier (in the real map, never its own element at all, just
`.v3-stage`'s own solid background colour showing through wherever the
sea-band contours don't reach) was fusing invisibly into the tier
directly above it instead of reading as a distinct deeper layer. New
token, `--v3-preview-sea-deep`, mapped to the previewed theme's real
`--v3-sea-deep` (via `applyThemePreviewTokens()`); the wash stays
exactly where it already was in the paint order (bottommost, appended
first) and re-enabled at full opacity. Its blurred edge is what stands
in for "an outer bound" in place of the real theme's infinite canvas
background, per the user's own framing.

Preceded by a debugging detour, also from direct feedback ("This is
not working. Solo Island - no wave contours or sea bands. Section -
faintly visible whether it is wave contour or sea band, regardless. No
sea topology visible anywhere. Why don't you turn off the blue halo
and let the rest of the visual come through?"): the wash's opacity-on-
hover reveal was set to 0 as a diagnostic, per that direct suggestion,
which is what surfaced the sea-band/wash colour collision above
clearly enough to find it.

### v3.7.39 bugfix -- inward-band clip conflict was the real cause behind three of four reported problems

Direct report against v3.7.38, sharper and more specific than "still a
bit off": "Wave contours are still visible in the section hover, and NOT
visible CORRECTLY in the Island hover. No Sea Topology visible anywhere.
And now the Medival theme island colour is gone, inland is white no
colour beyond the coastal band."

Investigated by elimination, not by re-guessing at the blur fix again.
First isolated whether Medieval's OWN full-page rendering was broken at
all, independent of hover: `--v3-veg` for medieval-map resolved to
`#fbf0ee`, a very pale cream -- confirmed via `git log -S` this exact
value has been unchanged since a commit from well before this session
(v3.7.13-v3.7.22), ruling it out as something this work broke. Forced
`clip-path: none` on the wave-ring/band layers entirely as a diagnostic
-- the pale, flat-looking land PERSISTED even with the hover clip fully
disabled, meaning something else was suppressing colour, not the clip
mechanism itself.

Sampled every element actually painted within a hovered island's own
halo area (`document.elementFromPoint` across a grid of points, not a
single spot check) and found `.v3-coast-inward-band` -- each section's
own colour-hued inland band, the real primary source of visible land
colour in Medieval Map -- showing content that didn't belong to the
hovered island's own section. Root cause: `drawCoastalInwardBands()`
gives every inward-band path its own ESSENTIAL per-section `clip-path`
ATTRIBUTE (the raw `d` for every copy spans the WHOLE map's combined
geometry -- see that function's own doc comment -- so this attribute is
the ONLY thing confining one section's copy to that section). v3.7.36's
hover-clip CSS rule targeted `.v3-coast-inward-band` directly, and a
stylesheet `clip-path` declaration SILENTLY REPLACES a presentation
attribute rather than composing with it -- so every section's band lost
its confinement the moment the hover mechanism shipped, each one now
showing the full-map geometry (minus only a small hover-hole), stacked
across all six section-hued copies. This explains all three symptoms at
once: wave/band bleed on both islands and sections (the unconfined
bands, not wave-rings, were what was actually showing through in most
cases), and the separately-reported "Medieval island colour is gone" --
un-confining the bands didn't just leak them elsewhere, it broke their
correct appearance on their OWN sections too.

![Before the fix: every section's inland colour band reads flat and washed-out, none of the six sections' colour hues distinct](landing-v3/dev-screenshots/v3.7.38-theme-preview-band-fidelity-fixed.png)

![After: each section's own colour-hued band correctly confined -- blue (Bookshelf), olive/green, pink/brown -- restoring Medieval Map's actual land colour](landing-v3/dev-screenshots/v3.7.39-medieval-baseline-restored.png)

Fixed by moving the hover clip off the individual band paths and onto a
new wrapping `<g class="v3-coast-inward-band-group">` instead -- SVG
composes an ancestor's `clip-path` with an element's own `clip-path`
attribute (both apply, intersected), so the per-section confinement and
the hover-hole now both hold at once, neither replacing the other.
Verified the fix doesn't leave stale groups behind across both a slider
retrace and a full "Reroll positions" render.

![Island hover, re-verified clean: no cross-section band bleed inside the wash](landing-v3/dev-screenshots/v3.7.39-inward-band-clip-bug-fixed-island.png)

**Sea-depth/shadow opacity boosted for the preview.** The fourth report
("no Sea Topology visible anywhere") was real independent of the clip
bug -- confirmed via an isolated diagnostic that the geometry was always
correct, just at the real map's own subtle opacity (0.24 sea-band, 0.08
shadow) in a smaller, more saturated preview context. Two rounds of
"can't see it" is a real signal, not a coincidence -- rather than defer
this a third time, boosted the PREVIEW's own opacity (sea-band 0.24 ->
0.45, shadow 0.08 -> 0.18) without touching the real map's own values:

![Sea-depth bands and a hint of directional shadow now clearly visible at real (non-forced) opacity](landing-v3/dev-screenshots/v3.7.39-boosted-sea-shadow-opacity.png)

### v3.7.38 -- Wave-ring blur bleed fixed; Topology's own sea-depth bands added to the preview

Direct report against one screenshot, comparing section-level hover to
what Topology's real theme is supposed to look like: "Topo is supposed
to have only the directional shadow but Sectionals: wave contours are
visible under the flat blue, sea contours arent visible. Entries - no
wave contours but no sea topo bands either, shadows are directional."

**Wave-ring blur bleed, both entries and sections.** The clip-path
mechanism (v3.7.36) hides wave-rings/coastal-bands using the wash's OWN
exact `d` boundary as the clip hole -- but the wash ELEMENT is blurred
(`--v3-preview-blur`), and Gaussian blur visually spreads a shape's tint
past its `d` string without changing what that string says. In the
resulting ring -- between the crisp clip edge and the wash's own
softened visual edge -- wave-rings sat fully unclipped underneath the
wash's still-visible (if fading) tint. Confirmed directly rather than
guessed: setting the blur to 0px made the artifact disappear completely
(a perfectly crisp, fully-clipped edge), isolating the bug to
blur-vs-clip-edge mismatch specifically, not a real clipping failure.
(Sections showed it more often than entries simply because they cover a
much longer boundary, not because the underlying mechanism differed --
confirmed by finding it on a section too once looked for.)

Fixed with a new `clipMarginFor(blurPx)` (`Math.max(12, blurPx * 2)`):
every island/section now traces a SECOND, slightly-larger shape
alongside the wash itself -- stored as a `data-clip-d` attribute on the
same element, read by the hover handler instead of the wash's own `d` --
so the clip hole fully contains wherever the wash's blur could still be
tinting anything. The live "Edge blur" slider now also calls
`retraceThemePreviews()` (previously pure CSS, no geometry involved) so
the margin stays correct if blur is retuned.

**Topology's own sea-depth bands, previously entirely missing.**
`.v3-sea-band` is gated by `flatColourMode` (false for Topology, true
for Medieval), a completely SEPARATE mechanism from `showWaveRings`/
`showCoastalBands` -- easy to miss, and missed: the preview only ever
traced LAND bands (sand/veg/peak), leaving the whole sea side as one
flat wash standing in for what should be real nested sea-depth rings.
Added the same way sand/veg/peak were: `seaBandThresholds` (confirmed
theme-invariant, same as every other threshold array) traced per
island/section via the existing `traceIsolatedShapeAtLevel()`, one
`.v3-island-theme-preview-sea`/`.v3-section-theme-preview-sea` per level,
positioned between the wash and the shadow -- the same slot the real
`.v3-sea-band` occupies relative to `.v3-coast-outward-band`/shadow in
`drawIslandsPath()`. Needed real extra heightmap padding (+80px) for the
deepest sea levels to close naturally rather than against the local
grid's edge-forcing boundary -- confirmed correctly shaped (not
artificially flattened) via an isolated diagnostic before trusting it at
real opacity:

![The sea-depth bands isolated with boosted opacity for diagnosis -- real, correctly-nested concentric rings, confirming the geometry itself (not just visibility) is right](landing-v3/dev-screenshots/v3.7.38-sea-band-isolated-diagnostic.png)

At the real 0.24 fill-opacity (matching the live map's own `.v3-sea-band`
value exactly, same "don't retune away from the real thing" choice
v3.7.37 made for the shadow), the bands read as subtle -- expected, not
a bug, same as the shadow's own subtlety.

![Both fixes together on a real section hover -- no wave-ring bleed at the wash's edge, real (if subtle) sea-depth structure inside it](landing-v3/dev-screenshots/v3.7.38-section-hover-clip-and-sea-bands-fixed.png)

### v3.7.37 -- Mechanism 3 complete for now: Topology's directional shadow swaps in on hover; default theme reverted to Medieval

Direct approval and two follow-up requests together: "seems to work for
Entries, not sure about Sections - also hard to figure since it could be
just opacity and layering from my POV. Go ahead, work the rest, we'll
debug when we get to it. Make Medieval the default again, since that's
what we are working on."

**Section-level hover, checked rather than assumed working.** The
reported uncertainty was investigated directly before writing any new
code: a first test hovered a genuinely empty hit-testing dead zone
(confirmed via `elementFromPoint`), not a real gap in the mechanism.
Re-tested against the section's own guaranteed-hit label-band rect --
`.v3-medieval-effects-hole`'s `d` attribute updated correctly (a real,
non-trivial shape, not an empty string), and a screenshot confirms wave
rings genuinely absent across a whole section (two islands + connecting
sea + label), while still visible on neighbouring sections:

![Bookshelf of Curiosities fully hovered: both component islands, the connecting sea, and the label band all show the Topology preview together, with wave-ring contours absent inside the hovered region but visible around neighbouring sections](landing-v3/dev-screenshots/v3.7.36-mechanism3-section-hover-confirmed.png)

**Default theme reverted.** `islands-tool.html`'s `data-theme` attribute
back to `medieval-map` (was `satellite`/Topology, set in v3.7.27 when
the active work was the Topology theme itself) -- direct request, "since
that's what we are working on" now refers to the hover mechanism, whose
resting state is Medieval.

**Topology's directional shadow, isolated per island/section.** New
`buildIsolatedShadowTaper()` mirrors `drawIslandsPath()`'s own
directional-shadow algorithm exactly (same height-linear reach formula,
same `copiesPerLevel`/`baseReach`/`maxReach`/`levelStagger` constants --
see that block's own extensive comment for the reasoning), just tracing
circles' isolated heightmap (`buildIsolatedHeightmap()`, already shared
with the band/halo tracing) instead of the whole canvas's. Needs its own
isolated `<filter filterUnits="userSpaceOnUse">` per island/section, for
the exact same reason the real shadow needed one (v3.7.24's bugfix,
re-applied here rather than re-discovered) -- CSS `filter: blur()`
region auto-computation is unreliable for many overlapping,
individually-transformed children. `.v3-sea-shadow-radial`/
`.v3-sea-shadow-taper` (Medieval's and Topology's own shadow styles) are
now both in `#v3-medieval-effects-clip`'s target list alongside the
wave-ring/coastal-band layers v3.7.36 added, so Medieval's shadow is
clipped away in the SAME hovered region Topology's replaces it in --
a swap, not an addition on top.

**A real z-order bug, caught before shipping.** First pass painted the
shadow group UNDER the halo wash (matching the real shadow's own "under
the land fill" comment literally) -- but that wash is fully OPAQUE in
its interior (blur softens only the edge, not interior alpha), so the
shadow was completely invisible underneath it. Confirmed via an isolated
diagnostic (hid every other preview layer, temporarily boosted the
shadow's own opacity to 0.9) before concluding it was a real bug and not
just "too subtle to see":

![The same directional taper shadow, other preview layers hidden and opacity temporarily boosted for diagnosis -- confirms real, correctly-shaped geometry, offset toward the shadow's configured SW direction](landing-v3/dev-screenshots/v3.7.37-mechanism3-shadow-taper-isolated-diagnostic.png)

Fixed by reordering: shadow now appended AFTER the halo wash, BEFORE the
land bands -- the correct equivalent of "under the land, over the sea"
in a stack where the wash itself stands in for "the sea."

**Open, not silently resolved:** at the shadow's REAL opacity (0.08
fill-opacity, matching the live map's own value exactly, not retuned),
the effect reads as quite subtle against the halo's saturated teal --
confirmed genuinely present and correctly shaped (see the diagnostic
above), just faint in normal viewing. Left at the real value rather than
boosted unilaterally, since "reads as the same shadow" was the explicit
goal; whether it should be more visible in this specific context is a
live design question, not resolved here.

**Also verified, not assumed:** an indirect Topological-offset slider
(not a theme-preview control) correctly updates a shadow copy's `d`
attribute -- the same `retraceThemePreviews()`-folded-into-
`retraceIslands()` sync mechanism (v3.7.34) already covers this new
geometry too, no separate wiring needed. (A first check of this
appeared to fail -- querying the WRONG shadow copy by index, the
coastline-level one rather than a sand-level one, which is genuinely
unaffected by a sand-threshold slider -- corrected before concluding
anything was broken.)

### v3.7.36 -- Mechanism 3, first slice: Medieval's own wave-rings/coastal-bands genuinely disappear on hover, not just get painted over

Confirmed working, then direct approval to continue toward the full
mechanism: "Go ahead with the rest as well." (A question just before
that -- "the flat blue blend is intentional I presume?", re: the outer
halo wash's flat, textureless colour -- confirmed yes: Part A never
attempted real sea texture in the halo, only real per-band LAND
fidelity; still a placeholder, not addressed by this pass either.)

Until now, hovering revealed a Topology-coloured overlay SITTING ON TOP
of Medieval's own wave-ring/coastal-band contours -- those global,
canvas-wide decorations kept rendering underneath/around the overlay,
visible at its edges, never actually removed. The original spec's own
words -- "Medieval effects disappear - wave contours, etc." -- meant
something CSS `:hover` alone can't build: `:hover` can style elements
that already exist, but constructing a dynamic "everywhere except this
one arbitrary hovered shape" hole needs real geometry computed at
interaction time, not a fixed selector.

![Golden Age SciFi hovered while Medieval Map is the active theme: the wave-ring contours around every neighbouring island are visible, but genuinely absent within the hovered island's own teal halo, not just painted over](landing-v3/dev-screenshots/v3.7.36-mechanism3-wave-rings-clipped-on-hover.png)

Mechanism: one shared `<clipPath>` (`#v3-medieval-effects-clip`) -- an
oversized outer rect plus the CURRENTLY-hovered shape as a second,
nested subpath, same evenodd ring/hole technique
`drawCoastalInwardBands()` already uses elsewhere in this file. Applied
via a plain CSS `clip-path` rule to `.v3-wave-ring`/
`.v3-coast-outward-band`/`.v3-coast-inward-band`, so those three layers
simply vanish inside the hole and stay fully visible everywhere else,
with no per-element bookkeeping. The hole itself updates via ONE
delegated `pointerover`/`pointerout` listener on `#v3-stage` (matching
`startCurrentAnimation()`'s existing click-to-launch precedent for "JS
listener where CSS genuinely can't reach," not a new pattern invented
for this), reading the hovered island's/section's own
`.v3-island-theme-preview`/`.v3-section-theme-preview` element's
ALREADY-COMPUTED `d` attribute directly -- no new geometry, and it stays
correct automatically since `retraceThemePreviews()` already keeps that
attribute in sync. Delegated rather than bound per-element specifically
so it survives every `retraceIslands()` call without re-binding (those
never touch the island/section `<a>` elements it listens on).

Deliberately NOT in this slice: Topology's directional shadow doesn't
yet replace Medieval's own shadow within the hovered region -- that's a
separate, larger computation (generating a real taper stack per hover
target) than clipping away a few flat contour lines, still open.

### v3.7.35 bugfix -- theme-preview sand band was camouflaged, coastline outline missing entirely

Direct report against v3.7.34's real per-band fidelity: "Some layers of
the vegetation are visible but sand is either not happenning or more
likely hidden under the yellow blob. But the coastal outline isnt there
as well."

The bug, reconstructed on the live (now-fixed) page for the record
rather than only described -- both screenshots are the SAME island,
same mechanism, only the two broken values changed back:

![v3.7.34, broken: Golden Age SciFi hovered shows an opaque yellow blob with vegetation faintly visible inside it, no distinct sand band, and no coastline outline at all](landing-v3/dev-screenshots/v3.7.34-theme-preview-sand-camouflaged-bug.png)

![v3.7.35, fixed: the same island hovered shows a teal sea halo, a visible yellow sand band, a green vegetation band, and a dark coastline outline, all distinct from each other](landing-v3/dev-screenshots/v3.7.35-theme-preview-band-fidelity-fixed.png)

Two separate root causes, both confirmed by inspection before fixing:

1. **Sand camouflage.** `applyThemePreviewTokens()` mapped BOTH
   `--v3-preview-land` (the outer halo wash) and `--v3-preview-sand` (the
   real sand band painted on top of it) to the same source value,
   `themeTokenState[...]["--v3-sand"]`. An opaque wash and a band the
   exact same colour sitting directly on top of it are visually
   indistinguishable regardless of z-order -- the veg band was visible
   because it's a different hue (green) against the wash, sand wasn't
   because it's the identical hue. Remapped `--v3-preview-land` to
   `--v3-sea-shallow` instead -- the halo is conceptually sea past the
   coastline, not land, so this is also a more accurate mapping, not just
   a fix for the collision.
2. **Missing coastline.** v3.7.32 deliberately dropped the preview's
   stroke when the blur/edge-softening feedback landed ("the edges need
   to be blurred... not a hard outline"), which was correct for the OUTER
   halo wash, but meant nothing ever traced the island's actual boundary
   once real bands existed inside it. Added
   `.v3-island-theme-preview-coastline`/`.v3-section-theme-preview-coastline`
   -- `traceIsolatedShapeAtLevel()` at the real coastline threshold,
   reusing the same shared heightmap the halo/bands already built,
   unblurred (matching the real `.v3-coastline-outline`'s own
   `stroke-width: 1.2`) so it stays crisp on top of the softer wash.

Both new elements are kept in sync by the same `retraceThemePreviews()`
fold-into-`retraceIslands()` mechanism v3.7.34 already established, so
no new sync gap was introduced.

### v3.7.34 -- Theme preview grows real per-band fidelity (sand/veg/peak), plus a generalized sync fix

Direct correction of scope: "I had meant for Part A to include your
mechanism 1 completely as far as it aligned with Mechanism 3. However,
lets get on with mechanism 3 anyway." Read as: don't treat "mechanism
1's full colour fidelity" as a detour from mechanism 3 -- build it AS
PART OF the path toward mechanism 3, since real per-band colour was
always going to be needed there too.

Mechanism: `traceIsolatedShape()` (island/section boundary tracing) and
the new `traceIsolatedShapeAtLevel()` now share one heightmap build per
island/section (`buildIsolatedHeightmap()`, factored out of
`traceIsolatedShape()`) instead of each level paying for its own --
tracing coastline + halo + sand x2 + veg x2 + peak all reuses the SAME
`H`/`cols`/`rows`, since only the CONTOUR LEVEL changes between them, not
the underlying noise field. `sandThresholds`/`vegThresholds`/
`peakThresholds` are the exact same arrays real (non-preview) islands
trace at -- already confirmed (v3.7.32) that these don't vary per theme,
so tracing a preview at those same levels reproduces the real band
structure exactly, not an approximation of it. New CSS classes
(`.v3-island-theme-preview-sand/-veg/-peak`, mirrored for sections) reuse
the real bands' own opacities (0.6/0.55/0.75) so a previewed island reads
consistently with how it'll actually look once the theme switches, and
stay unblurred (crisp band edges) while only the outer halo wash keeps
its blur -- the same "soft only at the outer sea-blend edge" logic the
real map already uses.

Also fixed, found while building this rather than reported first: the
SAME silent-no-op class of bug v3.7.33 fixed for the halo sliders
threatened these new band paths too, for a wider set of triggers -- any
of the existing Topological-offset sliders (Sand 1/2, Veg 1/2, peak) can
change `sandThresholds`/`vegThresholds`/`peakThresholds`, and none of
them know anything about the theme-preview feature (they predate it).
Rather than hunt down and individually wire every such slider (fragile --
the exact mistake that caused v3.7.33 in the first place, just for a
different config path), `retraceThemePreviews()`'s work is now folded
into `retraceIslands()` itself, so the invariant "the preview always
matches current config" holds unconditionally. Confirmed via Playwright
that moving a Topological-offset slider -- not a theme-preview slider --
correctly changes a preview band's `d` attribute. The Island/Section halo
sliders keep their own direct `retraceThemePreviews()` call too (cheaper
than the full `retraceIslands()` for a change that only ever needs the
narrower function), now a pure optimisation rather than a correctness
requirement.

### v3.7.33 bugfix -- Island/Section halo sliders were a silent no-op at any value

Direct report, tried live rather than just described: "Island halo - i
turned it upto 100 and went down to 7, no change. Same for Section
Halo." Root cause: `buildSlider()`'s default `onChange` is
`retraceIslands()`, and v3.7.32 didn't override it for these two new
sliders -- but `retraceIslands()` only redraws the SHARED global
coastline/band/grid/flow-field layers (`drawIslandsPath()`,
`drawCoastalInwardBands()`, `drawGeoGrid()`, etc.); it never calls
`renderRegion()`, which is the ONLY place the theme-preview `<path>`
elements get built. `v3Config.themePreview.islandHaloPx`/`sectionHaloPx`
were updating correctly in memory the whole time -- nothing in the DOM
ever read the new value, at any slider position.

Considered calling the full `render()` instead (would have worked --
its own doc comment notes a full render is barely more expensive than
`retraceIslands()` already is, since the island retrace step dominates
either way), but that also re-runs circle packing/treemap for a change
that never touches either, and risked visually shifting the whole
layout on every halo tick if packing turned out non-deterministic
between calls (it isn't, but re-running it for no reason is still
wasted work and needless risk). Instead, added
`retraceThemePreviews()`: finds each island's/section's ALREADY-EXISTING
`.v3-island-theme-preview`/`.v3-section-theme-preview` element by its
`data-id`/`data-section` and updates only that element's `d` attribute
in place, via the same `traceIsolatedShape()` calls `renderRegion()`
itself uses -- no DOM structure change, so no risk of the compass/grid
z-order bug fixed in v3.7.31 recurring for a different element (that bug
was exactly "removing and re-appending a whole group lands it at the
wrong paint order"; this fix never removes anything). Matches
`drawGeoGrid()`'s own "cheap, targeted redraw, not the full pipeline"
precedent. Verified directly, not assumed: a Playwright check confirmed
the preview path's `d` attribute actually changes length when the slider
moves (2882 -> 4979 characters at halo 45px -> 100px).

### v3.7.32 -- Theme x hover, Part A: a real colour-preview prototype, plus the theme roster narrowed toward Medieval + Topology

New feature, discussed at length before any code: "on hover, the island
[...] convert from Medieval theme to Topology theme [...] wave contours,
etc. disappear." Three candidate mechanisms were compared (live on-hover
regeneration; a dual full-scene layer with a dynamic clip-path; CSS-only
recolouring with no geometry swap) before settling on building the
CSS-only piece first as "Part A" of the full mechanism -- genuinely
useful groundwork, not throwaway, since the full version needs this same
colour-scoping layer regardless.

Mechanism: both an island's and a section's real traced shape were
already available -- `traceIsolatedShape()` already powers each island's
hover glow/hit-circle and each section's glow/hit union (label band +
every component island + a coastal-zone buffer). A new theme-coloured
overlay path reuses that exact geometry (a fresh dilated trace for
islands; its own dedicated dilated trace for sections, decoupled from the
existing glow/hit halo rather than reusing it by coincidence), sits on
top of the shared global coastline/band paths, and reveals on
`:hover`/`:focus-visible` via a CSS opacity transition -- no per-hover
computation at all.

Colour correctness needed a real check, not an assumption: the existing
per-theme colour editor (`themeTokenState` in `cabinet-v3-controls.js`)
already holds every theme's live-edited colours in memory regardless of
which is the page's active theme, only pushing an edited theme's values
onto `<body>`'s inline styles when THAT theme is active. A first pass
hardcoded Topology's colours as a static snapshot to sidestep this,
correctly flagged by direct question ("both effects will be controlled
and edited by their respective theme dropdowns, right?") as the wrong
long-term choice -- replaced with `applyThemePreviewTokens()`, which
reads `themeTokenState` directly, called on panel build, on every colour
edit to the active preview theme, and on preview-theme switch, so editing
Topology's colours (or picking a different preview theme) updates the
hover effect immediately even while Medieval is what's actually showing.

Mashup-specific parameters (which theme previews, island halo distance,
section halo distance, edge blur) got their own `v3Config.themePreview`
config block and "Theme hover preview" dev-panel subsection, deliberately
NOT folded into either theme's own colour definition -- they're
parameters of the transition itself, not colours belonging to either
theme. Two rounds of direct feedback already folded in: halo distance
20px -> 45px (a live slider, "maybe 40-50px may be better to get some of
the sea nicely as well") and a hard stroke replaced with `filter:
blur()` and no stroke at all ("the edges need to be blurred... not a
hard outline"), reusing `.v3-island-glow`/`.v3-section-glow`'s own
already-proven blur technique. Deliberately NOT done yet: per-band
colour fidelity (sand/veg/peak, not one flat wash) -- flagged explicitly
as Part A's known limit, not a surprise once seen live ("the colours are
a no show").

Also logged: an easter egg idea, direct request -- clicking inside the
compass rose's inner circle swaps the WHOLE canvas's theme, Medieval <->
Topology and back, "too nice a piece of work to be seen only in bits."
Added to `three-world-launch-phases-ToDo.md`'s Phase 0, explicitly
sequenced after this feature (same two themes, same colour data, just a
click-triggered whole-canvas swap instead of a hover-scoped local one).

Theme roster: direct request, only Topology + Medieval Map will go
forward to PRODUCTION eventually. Riso was explicitly disposable ("can
go") and is removed outright -- CSS block, dropdown entry, preset entry
all gone; its reasoning stays in `v3-scheme-candidates.md` and git
history. Cyanotype and MedieRiso are NOT shipping either, but both stay
live/selectable in this dev tool regardless -- "archive" and "scratchpad"
describe their eventual fate, not present reachability. (A first pass
here wrongly pulled Cyanotype out of the dropdown entirely, treating
"archive" as "no longer reachable" -- corrected immediately on direct
feedback: "Cyanotype was supposed to be kept.")

### v3.7.24-v3.7.30 -- Topology's directional cast shadow: cliff-edge fix, a real CSS-filter bug, then a height-aware taper

The original v3.7.9 directional shadow (translated copies of one shape)
was shelved at v3.7.10 for making islands "look like straight cliffs
rising from the sea." Direct request this round: bring it back
specifically for the Topology theme, whose satellite-map register suits
a real light-direction cue better than every other theme's all-around
radial shadow.

`seaShadowStyle` (`"radial"` | `"directional"`) added to
`v3Config.island`, set per-theme via `THEME_PRESETS`
(`cabinet-v3-controls.js`) -- Topology defaults to directional, every
other theme keeps the existing radial one. A dev-panel "Shadow style"
SELECTOR (not two independent checkboxes) lets it be tried on any theme
-- two checkboxes would have allowed an invalid both-on state nothing
renders correctly for.

First pass at the geometry avoided the old cliff-edge problem by
translating copies of the terrain's own five nested contour levels
(coastline, both sand thresholds, both vegetation thresholds -- later
six, once "Land 5" landed) instead of one repeated shape: each level is
already smaller than the one before it, so stacking them at increasing
distance shrinks the shadow's own silhouette as it recedes, a taper
from the geometry itself rather than from fading opacity alone.

A real bug surfaced once this was checked live, not just eyeballed in
isolation: a `filter: blur()` CSS class rule on the shadow's wrapping
`<g>` rendered correctly on a blank page but went fully INVISIBLE once
real map content actually surrounded it. Confirmed with a throwaway
script (same setup, `filter: none` -> visible, `filter: blur(4px)` ->
nothing) before touching anything -- CSS filters on SVG elements derive
their region from an auto-computed bounding box, and that computation
turned out unreliable for a group whose children each carry their own
translate transform. Replaced with an explicit SVG
`<filter filterUnits="userSpaceOnUse">`, sized off the already-computed
padded bounds and referenced via the group's `filter` PRESENTATION
ATTRIBUTE -- no bounding-box guesswork left for the browser to get
wrong.

Reach lengthened (~29px -> ~46px) per direct feedback it needed to be
longer, then blur pulled back (4px -> 1.5px) per feedback it was
smearing away too much of the underlying terrain shape ("I'd like to
see some hint of the topology heights through the shadow contour").

Final pass, direct question: should the stack-count formula be
arithmetic or exponential? Neither, really -- the OLD formula was
already arithmetic, just in LAYER INDEX rather than height, so every
level cast an equally long shadow, just offset further out; exponential
would turn a modest height gap into an implausibly large shadow-length
gap. Landed on linear in actual HEIGHT ABOVE THE COASTLINE (each
level's `value - threshold`, floored at 0), which is how real cast-
shadow length actually scales for one fixed sun angle -- short terrain
now casts a short shadow, tall terrain (veg, and especially the new
Land 5 peak) casts a long one.

Folded in along the way: "Coastal bands (in + out)" relabelled to just
"Coastal band" (the "(in + out)" suffix described the ring's internal
two-subpath construction, not the concept, and read as two independent
things to toggle); coastline outline stroke thinned 2px -> 1.2px; and
the `THEME_PRESETS`/`applyThemePreset` refactor that made preset
application reusable at both the Theme dropdown's change handler and
(v3.7.27, below) page load.

### v3.7.28 -- "Land 5": a mountain-peak accent, calibrated against real content, not a guess

Direct request: "can I have a land 5, and colour it white - a very high
contour seen only on some of the islands, a mountain peak of sorts." New
`peakThresholds` array/`--v3-peak` colour token (white, themeable),
rendered as the topmost land layer at higher opacity than sand/veg (a
snow-cap accent wants to read as a crisp pop, not another blended
layer), with its own dev-panel slider continuing the "Land" numbering
after veg.

The threshold value needed real calibration: a synthetic single-circle
sample suggested ~0.2 as "upper edge, some islands only" (per-island
realised noise peaks turn out to vary a lot by actual circle size/seed,
not just theoretical `noiseAmplitude`), but bisecting the dev panel's
own slider against the ACTUAL site content (reading `.v3-peak-band`'s
rendered path length at each step) showed 0.2 hits ZERO real islands --
the synthetic sample wasn't representative. Landed on 0.13 empirically
against real content, then 0.14 after further live tuning via a pasted
"Copy config."

### v3.7.28 -- Diagnostics subsection: island-noise heightmap view alongside the existing flow-field debug

Direct request: "just like the flow potential, vectors being made
visible as a diagnostic, can the underlying noise that make the islands
and topo be made visible on toggle." `drawIslandNoiseDebug()` tints a
grid by `buildIslandHeightmap()`'s own H field -- the raw noise-minus-
falloff terrain driving every contour in the file -- same treatment
`drawFlowFieldDebug()`'s existing Flow potential view already uses for
the current's own scalar field. H is sampled at 3px native resolution
over the padded bounds; the debug view strides through the same
already-built array at a coarser 24px step (matching Flow potential's
own debug resolution) instead of drawing tens of thousands of individual
`<rect>`s.

Flow potential/Flow vectors, previously two loose checkboxes sitting
directly in Visuals, folded into this same new "Diagnostics" collapsible
subsection alongside the new Island noise toggle -- one home for "peek
at the raw field driving this," not three scattered rows.

### v3.7.26, v3.7.28 -- Topological offset sliders relative to the coastline; waterLevel floor loosened

Direct feedback after walking through what the raw heightmap thresholds
actually mean: "-0.62 is a notional zero... sea 1 being deeper than sea
4 is notionally dissonant." Every Sea/Land slider now gets/sets relative
to the live Base coastline Threshold -- 0 always reads as "exactly the
coastline," negative sea-ward, positive inland -- while the underlying
arrays keep storing raw heightmap values (`drawIslandsPath()` and
everything else still expects that); the conversion happens only at the
slider's own get/set boundary. Deliberately not a full rescale onto a
fixed -1..1 span: the sea side has a real floor (`waterLevel`) to
rescale against, the land side doesn't, so that would trade one
arbitrary anchor for another.

Renumbered so "1" always means nearest the coast in both directions --
Sea counts down from the array (index 0, loosest/deepest, now the
HIGHEST number), Land counts up continuously across the sand/veg array
boundary, with a "(sand)"/"(veg)" suffix keeping that distinction
visible now the number alone doesn't carry it. A plain read-only row
between the two groups marks the coastline itself (always exactly 0 in
these units).

Separate but related: a direct question about why "Sea 4" blinked out
past a certain point led to empirically confirming `waterLevel` is a
real cliff, not a gradual fade -- `traceContourFromHeightmap()` returns
a genuinely EMPTY path the instant a level crosses it (H can never
register below the floor, so the field becomes trivially "all inside"
with no crossing left to trace). The old floor (-1) sat only 0.03 below
the loosest default Sea level; loosened to -1.4 for real headroom, with
the dev-panel slider range widened to match.

### v3.7.27 -- dev tool defaults to Topology theme; glow becomes the site-wide default label style

Direct request: "label style = soft glow as default, and change default
on control panel to topo since we are working on that one now."
`islands-tool.html`'s default theme flips to Topology; `glow` becomes
the default label style everywhere (unlike the theme default, not
scoped to "the control panel" -- it's pure CSS presentation with no
effect on the static page's baked SVG geometry either way, so it applies
to the shipped `index.html` too).

Caught a real latent bug while wiring this up: the page's very first
`render()` runs before the control panel's own theme-preset logic ever
gets a chance to run (ES module import order), so a fresh load only
ever got the right `flatColourMode`/`showWaveRings`/etc. state because
`cabinet-v3-data.js`'s raw defaults happened to already match whichever
theme was hardcoded as default -- true by coincidence, not by
construction, and it broke silently the moment the default theme
changed without a matching hand-edit to `data.js`. `applyThemePreset()`
now runs once at panel-build time too, followed by a forced
`retraceIslands()`, so any future default-theme change is safe on its
own.

### v3.7.28 bugfix -- dragon no longer flashes at native size in the corner on load

Direct bug report: "part of the dragon svg is momentarily visible on the
upper left corner at a very large size" on reload. Cause:
`buildDragonElement()`'s outer `<g>` carried no position/scale transform
of its own -- only the inner group, which just centres the artwork's
local coordinate space. The real translate+scale was only ever applied
inside `tickDragon()`, which `animationFrame()` skips entirely on its
very first call (`lastFrameTime` starts null) -- so `ensureDragon()`
could append the outer group to the live stage and let the browser
paint one or more real frames of it sitting at raw, untranslated,
unscaled `DRAGON_PATH_D` coordinates. Factored the transform math into
`applyDragonTransform()`, called once synchronously at spawn time
(before the element is ever appended) as well as every frame.

### v3.7.31 bugfix -- lat/long grid and compass diagonals pinned beneath the compass, not above

Direct feedback: "diagonals beneath the compass not above." Cause:
`drawGeoGrid()` always appended its group as the stage's LAST (topmost)
child -- harmless on a fresh `render()` (the compass renders after the
grid there regardless) but wrong the moment any Visuals slider triggers
`retraceIslands()`, which redraws the grid via that same unconditional
`appendChild` without ever re-rendering the compass, silently
re-promoting the grid above it on every single slider tick. Now inserts
before `.v3-compass` when present, pinning the grid to a stable position
under the compass regardless of which function last redrew what.

### v3.7.23 -- small visual fixes: Medieval Map text visibility, Topology compass contrast, entry-label hover scale

Medieval Map's header/subtitle used the site-wide light-parchment colour
token, invisible against that theme's own light `--v3-sea-deep`
background -- overridden to the theme's own ink. Topology's compass rose
read as "blue on blue" (white fill defaulting to `--v3-sea-deep`, a mid
blue, next to an also-blue ink) -- broken out into its own
`--v3-compass-white` token, pointed at the glow colour for Topology.
Medieval Map's compass accent swapped violet for navy per direct
feedback. Island entry labels now scale up in place on hover
(`transform-box: fill-box` + `transform-origin: center`, needed so SVG
text scales about its own centre rather than the viewport's origin),
site-wide, independent of which label-style is active.

### v3.7.1-v3.7.8 -- compass rose (reserved SE section, TSV-driven links, colour-token mapping), lat/long grid, section-label small caps

By far the largest single addition since v3.0: a fixed "compass rose"
section in the southeast corner of the map, four direction links driven
straight off the TSV content pipeline, and a lat/long grid radiating
from its centre. Landed across a long back-and-forth with several real
bugs found and fixed along the way -- documented here in the order they
actually happened, since the wrong turns are as informative as where it
ended up.

**About Me folds into the compass.** Direct instruction: "the compass
rose subsumes the need for the About Me section." The `about` section
(and its `cv`/`currently` entries) is gone from `content/cabinet-
sections.tsv`/`cabinet-entries.tsv`; a new `compass` section (`kind:
"compass"`) and four `compass-n/e/s/w` entries replace it, each entry's
existing `anchor` column (previously unused by the v3 renderer) repurposed
to carry its direction. `cv`'s old href (`https://www.jesalmehta.com`)
carried over to whichever direction ended up as "CV"; the other three
directions' hrefs were left deliberately blank ("let them not point
anywhere... I'll add those when I update the TSVs"). Confirmed with the
user before touching this: `content/cabinet-*.tsv` is shared between
`landing-v3` and the still-live production site (`docs/index.html` via
`cabinet-render.js`), which has no idea what `kind: "compass"` means and
will render it oddly until it's updated separately -- accepted per direct
answer ("docs/index.html is the v1, it will anyway be superseded by v3").

**Reserving an exact southeast square, not squarify's best guess.**
Direct ask: "reserve a square section... in the southeast." squarify()
(the treemap algorithm every other section already goes through) has no
corner preference -- confirmed by checking the actual current layout,
where the smallest/last-ordered section landed top-right, not
bottom-right. `buildRegions()` (`cabinet-v3-layout.js`) now special-cases
a `kind: "compass"` section: carve a TRUE square (side = sqrt(area), not
stretched to fit any canvas dimension) flush to the canvas's real
bottom-right corner, then split what's left into two rects via one cut
(a full-width band above the square's row, a sliver to its own left in
that same row) and squarify each separately, sections distributed
between the two by weight (closest match to each rect's own proportional
area share), greedily from the END of reading order -- so only the
last-ordered section(s) ever share the bottom row with the compass.

First version of this got the AREA math wrong in a way that wasn't
caught until the compass rendered as a barely-visible speck ("the
compass rose is extremely tiny... it is tiny enough to sit in the margin
below the lowermost section"): it reserved a full-CANVAS-WIDTH strip
sized so its total AREA matched the compass's weight share, then
inscribed a square inside that strip. Forcing a fixed-area strip to also
span the entire canvas width makes it very thin (`stripHeight =
area/width`), and the inscribed square is then capped by that thin
height, not by the actual weight -- on real content this produced a side
length around 32px instead of the ~191px its weight (4, same weight
scale as every other section, out of a real total of 64) should have
given it. The weight itself WAS being read correctly the whole time; the
strip's shape just made almost all of that area unusable as a square.
Fixed by carving the true square first, as described above.

**The rose itself.** `compass_rose.svg` (provided) copied in as inline
SVG data (`COMPASS_ROSE_SHAPES`, same "just build DOM elements directly"
approach `DRAGON_PATH_D` already uses, for the same file:// CORS reason)
-- two overlapping 8-point stars (a cardinal N/E/S/W one carrying the
four real links, a purely decorative ordinal NE/NW/SE/SW one) plus a
central blue ring/needle motif. The source SVG's exactly 3 fixed fills
(white/black/blue) plus a none-fill/black-stroke outline pass are
remapped to theme colour tokens per direct request ("match scheme colour
tokens to these"): white -> `--v3-sea-shallow` (a theme's lighter/
sepia-toned slot), black -> `--v3-ink` (the same ink every coastline/
label outline already uses), blue -> `--v3-ring-ink` (a theme's other
mid-brightness accent) -- deliberately NOT `--v3-halo-ink`/
`--v3-label-outline`, so a hover-invert happening elsewhere on the page
can never accidentally recolour the compass.

**Sizing, labels, and hit area -- several rounds of direct feedback.**
The rose shrank from filling its whole square to `COMPASS_ROSE_SCALE =
0.62` (tried 0.7 first; "Contact me," the longest of the four labels,
still clipped the rose's own arm at that size even after nudging its
position, so it went smaller -- "or as needed" per the original request),
freeing a margin for a real text label per direction (`entry.title`,
pulled straight from the TSV). E/W labels stayed level with their own
arm's centreline throughout ("CV can be in the same line as the [W]
arm... maintain the alignments") -- the actual fix for "Contact me"'s
collision was word-wrapping it onto 2 lines (`wrap: true` in
`COMPASS_LABEL_LAYOUT`), not moving it off-axis. The hit area went
through three shapes in direct response to feedback: first a full
90-degree wedge per direction (too imprecise -- "the active link area is
not the entire quadrant, only the text label + compass arm"), then a
combined arm-hull + label-box shape, then simplified straight down to
just an invisible box around the label's own estimated text size
(character count x fontSize x charWidthFactor, this file's existing
text-width convention -- not a live `getBBox()` measurement). A visible
bordered "card" with corner ornaments was tried and screenshotted per
explicit request, then dropped on sight two messages later ("maybe no
rectangular frames"..."not leftover ornaments either"). Hover feedback
similarly moved away from a filled wedge ("I dont want the hover to be
the sharp triangles") to a blurred glow on just the hovered arm
(`.v3-compass-arm-glow`, one hand-traced hull per cardinal arm, same
opacity-0-to-visible mechanic `.v3-island-glow` already uses) plus a
matching glow on that direction's label -- wired via CSS `:has()` since
the hit target and its glow targets live in different transformed
groups and aren't DOM siblings.

**Lat/long grid + diagonals.** A dotted grid phase-aligned through the
compass's own centre (`origin`, not canvas (0,0)) -- so one longitude
line always runs through its N-S axis and one latitude line through its
E-W axis, per the original spec ("the compass N S E W direction match
one pair of lat-long lines") -- plus rays through the compass's own
ordinal arms, later extended to fire every 22.5 degrees ("add diagonals
at 22.5 degree intervals as well, above and below SE EN NW WS") for a
full 16-point radiating star.

"Over the sea, not visible on land" went through a real wrong turn: the
first attempt drew the grid before `drawIslandsPath()`'s landmass trace,
on the assumption that draw order determines paint order. It doesn't --
`drawIslandsPath()`'s own `placeOne()` helper unconditionally pins the
landmass to `stage.firstChild` (the bottom-most layer) no matter when
anything else runs, confirmed both by direct feedback ("lines are
overlaid on the islands") and by inspecting the actual rendered DOM
order after trying the reverse call order too -- nothing can ever paint
under the landmass via DOM order alone. Fixed with a real SVG `<mask>`:
white (visible) everywhere except the land silhouette itself, painted
black using the exact same `d` + evenodd fill-rule `.v3-coastline-
outline` already traces (one shared shape for every island, present
regardless of `flatColourMode`).

Pitch: started at a round 100, changed to 73 ("prime, no to avoid
accidental close positioning or overlap with section outlines"), then
split into independent `v3Config.geo.latSpacing`/`lonSpacing` with their
own dev-panel sliders ("give me 2 separate controls for each of them"),
default settled at 120, range widened to 0-600 (0 meaning "no lines on
that axis," guarded in `drawGeoGrid()` against the infinite-loop/
zero-step case a naive port of the old fixed-`GEO_GRID_SPACING`-constant
loops would have hit). Two independent on/off toggles, not one --
"separate toggles for grid and compass diagonals" -- `v3Config.geo.
showGrid`/`showDiagonals`. Line style went through two rounds of direct
feedback too: `0.1 9` dasharray (effectively invisible at real map
scale) -> `3 9` (visible, but too close to `.v3-region-outline`'s own
`6 6` dashed rhythm) -> final `2 4` at `stroke-width: 1.1` (vs. region-
outline's `1.5`) -- smaller dashes, more frequent, a hair lighter, a
genuinely different texture rather than just a different-sized version
of the same dash.

Both new dev-panel subsections (Geo grid, and Particle counts, moved
into its own collapsible group at the same time) use the same
`makeSubsection()` nesting Wave ring parameters/Topological offset
parameters already established -- direct request: "make lat long
parameters and particle count sections collapsible as well."

**Section labels: not italic, small caps.** Two small, unrelated-seeming
fixes that turned out to have the same root cause worth recording.
`.v3-section-label` picked up `font-variant: small-caps` site-wide
(direct request, "make them small caps to differentiate though" --
following "make section heads text not italic") to keep SOME visual
distinction from island labels once italic went away. The italic itself
turned out NOT to be a simple `font-style: italic` in this file at all
(that was removed from the `medieval-map` theme's own section-label rule
first, and the text stayed slanted regardless) -- the real cause was
`islands-tool.html`'s Google Fonts URL only ever requesting the ITALIC
cut of "IM Fell English" (`family=IM+Fell+English:ital@1`), with no
upright face loaded to fall back to under that family name at all.
Fixed at the source: `ital@1` -> `ital@0`. (`index.html`/`build-
render.html` load no Google Fonts at all, a pre-existing gap outside
this fix's scope -- not touched.)

### v3.7.11 -- coastline-offset resolution: cellSize 4 -> 3

One-line change, confirmed build-time-only first: `cellSize` (the grid
every heightmap/distance-field trace samples at) only costs time in
`islands-tool.html`'s live retrace and the one-time `node build-
static.mjs` run -- the shipped `index.html` is a static SVG snapshot a
headless browser already rendered once, so a visitor's page load pays
nothing extra regardless of resolution. With that confirmed, tightened
from 4 to 3 for more accurate coastline offsets (wave rings, the coastal
bands below) per direct request ("improve the resolution just a little
bit, I'd like to be more accurate").

### v3.7.9-v3.7.17 -- coastal shadow & band effects: a real cast shadow, coast-hugging colour bands, two geometry bugs found and fixed

The other half of the original "scheme 1" note (v3.7's own entry below)
finally got built: "drop shadows from the islands onto the sea" and "a
coast to inward inland band in transparent deep green fading to
nothing." Both effects reuse the SAME "many low-opacity overlapping
copies = a gradient" trick `.v3-wave-ring` already established, just off
different fields -- and both went through a real geometry bug before
landing correctly, documented here because the wrong turns are as
informative as the fix.

**The outward shadow: directional, then all-around.** First built as a
literal directional cast shadow -- copies of the coastline path
translated toward a light source (`seaShadowDistances`/`seaShadowAngleDeg`,
135 degrees = light from the NE per direct instruction), stacked at low
opacity so the overlap does the fading. Direct feedback once seen live:
"looks beautiful... [but] it makes the islands look like straight cliffs
rising from the sea" -- a translated copy of an organic coastline leaves
a hard straight trailing edge wherever the shape doesn't happen to curve,
reading as a cliff face rather than a shadow. Rather than delete the
technique, it was left fully intact and disabled (`seaShadowDistances:
[]`) for reuse somewhere a real light-direction cue fits better later
("we'll use it elsewhere"), and replaced for general use with an
ALL-AROUND shadow (`.v3-sea-shadow-radial`) built the same way the
outward colour band is: a genuine coastline-offset distance field
(`buildCoastlineDistanceField()`), which always follows the true
coastline shape in every direction, never a straight edge.

**The inward band: an actual geometry bug, not a tuning issue.** The
first attempt at `buildInlandDistanceField()` traced a positive-distance
contour at level `+D` and stacked several of them, expecting the same
overlap-fade the outward band gets. It never appeared ("the inwards
colour band?" / "I can't see any inner band at all," even after a first
attempted fix). Root cause, confirmed by direct empirical testing (a
throwaway Node harness measuring traced-polygon area at increasing `D`):
a SINGLE simple contour offset INWARD from the coastline always fills as
its enclosed, shrinking core, regardless of the field's sign -- SVG fills
a simple closed curve's bounded (smaller) side, full stop, so no amount
of sign-flipping (tried once, confirmed a no-op by the same area test)
changes which side gets painted. The real fix: give the trace a SECOND
subpath -- the true coastline plus the D-px-inward contour -- so
`fill-rule="evenodd"` (already in use everywhere else in this file) cuts
the inward contour out as a hole. The fill becomes the RING between
coastline and hole, which correctly grows with `D` since the hole
shrinks, giving the overlap-stacking trick the direction it actually
needs. A same-colour-as-base bug compounded this for a while too:
`.v3-coast-inward-band` briefly shared `--v3-veg` with the flat-mode land
fill directly underneath it -- a translucent copy of the exact colour
already there is invisible regardless of the geometry, which is why "I
can't see any inner band at all" was STILL true right after the ring fix
landed. Fixed with a dedicated `--v3-coast-ink` token (later superseded,
see v3.7.16 below).

**Reach, darkness, per-section colour.** The outward shadow/band's
distances were originally wide enough to overlap `waveDistances`' own
rings, reading as "each wave ring has its own shadow band" -- tightened
so the fade completes well inside the first ring, then widened again
once too tight ("too narrow too light and aligns exactly with the first
wave contour... slightly bigger, darker, and fade out"), landing on
values deliberately sharing no number with `waveDistances` so the two
can't visually lock together again. `--v3-coast-ink` (one colour, every
section) was replaced entirely at v3.7.16: `drawCoastalInwardBands()`
split out of `drawIslandsPath()` so each section can generate its own
hue -- a deterministic hash of `sectionMeta.id` (stable across content
reordering, unlike an index) at a fixed "deep, muted" saturation/
lightness, direct request: "for each section, generate a colour hue, and
use THAT colour hue for it's coastal inward band, not the same colour
over all sections." Per-section colour needed its own clip, which
exposed a second bug: clipping to `region.inner` (a fixed rect) cropped
the band wherever an island's growth spilled past its own section's
nominal rect -- growth is explicitly NOT rect-bounded (see v3.5's "single
global growth pass" decision). Fixed by clipping to `traceIsolatedShape()`
instead, the same "this section's own circles, traced alone" technique
`renderRegion()`'s own hover hit-shape already relies on, which follows
the actual silhouette instead of an approximation of it. Saturation/
lightness bumped once more for intensity (42%/58%, 22%/32% -- "make the
colours slightly brighter/more intense"), and both the band pair and the
shadow got independent dev-panel on/off toggles at v3.7.21 (see that
entry below) using the same empty-list-vs-boolean split `showWaveRings`
already established, so a toggle-off never destroys tuned distances.

### v3.7.9, v3.7.17-v3.7.20 -- compass rose, round 2: cardinal-line/grid-toggle bug, colour remap, then label recentring + a grid-origin sync bug it caused

Two rounds of direct feedback on the compass itself, after the section
above landed the base rose/lat-long-grid feature.

**Round 1 -- two small, targeted fixes.** The diagonal-ray loop
(`drawGeoGrid()`) skipped the 4 cardinal angles unconditionally, on the
assumption the full lat/long lines through the same origin always
covered them -- true only when `showGrid` was actually on. With the grid
toggled off, the compass lost its own N/S/E/W rays entirely, leaving only
its ordinal diagonals ("if latlong is off, the compass rose NSEW cardinal
lines need to appear, not only the diagonals"). Fixed by only skipping a
cardinal ray when the grid is ALSO drawing that segment. Separately, the
compass's white/black/blue fill mapping got re-pointed: white
`--v3-sea-shallow` -> `--v3-sea-deep` and blue `--v3-ring-ink` -> a new
dedicated `--v3-compass-accent` token (direct instruction: "white = deep
sea, black = same as now/whatever ink, and the 2 rings that are blue in
the svg = a dark-midtone hue, darker than the ink, lighter than the
sea"). `--v3-ring-ink` wasn't right for that slot any more: it defaults
to following `--v3-ink`, which is exactly why the "blue" rings had been
reading as near-identical to black on every theme that never gave it its
own value. `--v3-compass-accent` defaults to the same fallback (so every
theme without a tuned value renders unchanged) with real values only
where asked for -- medieval-map got deep violet ("either deep violet or
brick red" -- violet chosen since the palette is already all warm
reds/browns/ambers and needed the contrast more), "satellite"/Topology
got a warm coral for the same "give it a hue nothing else in the theme
uses" reason once that theme was folded in at v3.7.22 (see below).

**Round 2 -- label recentring, and the grid-origin bug it caused.**
Direct feedback: uneven spacing between the rose and its 4 labels
("Contact me" sitting tighter to the rose than the others). Root cause:
`COMPASS_LABEL_LAYOUT`'s fixed FRACTIONS positioned each label a fixed
distance from the SQUARE's edge, not from the ROSE's edge -- two labels
of different lengths (or one wrapped to 2 lines) end up different
distances from the actual artwork even at matching fractions. Replaced
with an explicit, uniform gap measured from the rose's real rendered edge
to each label's own near edge, same on all 4 sides by construction. Done
together with the other half of the same request -- "recalculate the
compass position based on centering the compass + the text labels, and
recenter within the larger section+margin territory" -- since the 4
labels aren't symmetric in length, centring the rose alone doesn't centre
the whole visual unit; a second pass now measures the combined [rose +
labels] estimated bounding box and shifts rose, every label, and every
hit box together to recentre THAT box in the square.

That shift broke something not touched by this change on paper:
`render()`'s `gridOrigin` (what both the lat/long grid and the diagonals
phase-align to) still read the square's raw, UNshifted centre, so it
silently fell out of sync with the rose's new, shifted position the
moment the shift became non-zero -- direct feedback: "diagaonals no
longer centred to the compass! I suspect the latlong isnt either" (it
was). Fixed by extracting the shift math into a shared
`computeCompassShift()`, called from both `renderCompassRegion()` and
`render()`'s `gridOrigin` calculation, so the two can't drift apart
again -- confirmed by cross-checking the rendered rose's true centre
against the diagonal grid's actual origin point in the built output.

### v3.7.13-v3.7.22 -- visual clean-up: glow radius (two rounds), Medieval Map colour retints, section-label glow made more prominent

Small, direct-value tuning requests, grouped here since none needed new
mechanism -- just parameter changes to things already built.

Medieval Map: `--v3-sea-deep` "Deep sea - #f4ebdd" (was a darker amber),
`--v3-veg` "#fbf0ee for vegetation" (was the reddish-brown originally
retinted in at v3.7). The "soft glow" `data-label-style` variant's
`drop-shadow` radius went 1.5px -> 3.5px across all four glow rules
(compass/island/island-hover/section) on the first request ("the label
style soft glow needs to have a larger glow"), then section labels
specifically got a second, bigger pass -- 6px and a 3rd stacked
drop-shadow, not just a wider 2nd one -- once singled out from the other
three ("needs to be larger/brighter/less transparent - more prominent in
general"): each `drop-shadow` pass is a separate blurred copy, so
overlap density right at the glyph edge is what actually reads as
brighter/less transparent, the same "many low-opacity copies" logic the
coastal bands rely on, not radius alone.

### v3.7.19, v3.7.22 -- theme roster cleanup: 4 themes dropped, Topology draft + Bathymetric merged, medieRiso recoloured

Before touching anything, checked that every theme candidate was
actually documented somewhere durable -- confirmed `v3-scheme-
candidates.md` already records full palettes/type/rationale for every
scheme this dropdown was ever meant to compare, independent of which
ones still have a live CSS block. With that confirmed, direct request:
"start eliminating." Dropped from both `THEME_OPTIONS`/`THEME_PRESETS`
(`cabinet-v3-controls.js`) and their `cabinet-v3-style.css` blocks: the
no-attribute default (`""`), `medieval` ("Wave Contour draft" --
`medieval-map` is its doc-accurate, since-heavily-customised
replacement, so nothing about that direction is actually lost), `neon`
("Neon Memphis"), `ukiyo` ("Ukiyo-e Woodblock"). Two things that removal
would otherwise have silently broken, fixed alongside it:
`applyThemeTokens()`'s empty-string fallback and `resetVisuals()`'s
Reset button both used to fall back to the now-gone `""` key -- both now
fall back to `THEME_OPTIONS[0][0]` instead.

Second pass, same session: "Topology Draft and Bathymetric - merge/keep
one." Kept `satellite` (relabelled "Topology" in the dropdown, same
internal id) with its own original draft colours untouched, added the
`--v3-ink`/`--v3-compass-accent` overrides it had never had (same latent
"compass blue reads as black" issue medieval-map had before its own
v3.7.17 fix), and did NOT adopt `bathymetric`'s Fraunces/Space Grotesk
font pairing ("keep the serif font from draft not the sans serif one in
bathy" -- "draft" never had a font override to begin with, so it already
fell back to the site's own serif default, `--cab-font-heading`/`-body`
= Georgia). `bathymetric`'s own theme block was deleted, but its colours
weren't discarded outright -- copied wholesale into `medieRiso`'s 5 base
tokens (sea-deep/shallow/veg/sand/ink) per direct instruction ("copy
bathymetric colours into medieriso"), leaving medieRiso's riso-neon
accent layer (`--v3-ring-ink`/`--v3-halo-ink`/`--v3-label-outline`, band-
boundary strokes, boat/dragon hues) untouched -- still the same
"electric highlights over a dark, cool base" structure, just a
bathymetric-blue base instead of the sepia/near-black-indigo one it had
before. A real identity shift for a theme whose name still says
"medieval" -- flagged as such rather than done quietly; the previous
values are preserved in this file's own git history if that turns out to
be the wrong call.

`islands-tool.html`'s Google Fonts URL trimmed to match: IM Fell English
SC (medieval only), Poppins (neon only), Shippori Mincho/Zen Old Mincho
(ukiyo only) all dropped -- nothing left references them.

### v3.7.16, v3.7.21 -- dev panel: lat/long defaults off, coastal-band/sea-shadow toggles, tool opens on Medieval Map

Three small dev-panel/tool-default requests, unrelated to each other
beyond all being about how the live tool starts up or gets tuned.
`v3Config.geo.showGrid` now defaults to `false` ("default - latlong is
off") -- still fully live via its existing panel toggle, just not the
starting state. Two new checkboxes, "Coastal bands (in + out)" and "Sea
shadow" ("give me a toggle for the coastal bands and sea shadows as well
to turn on off"), gate `v3Config.island.showCoastalBands`/`showSeaShadow`
using the same empty-list-vs-boolean split `showWaveRings` already
established (see v3.7.9-v3.7.17 above) -- the coastal band pair share one
switch, since they're the one "coast to inward/outward" effect from the
original scheme note, not two independent ones. Both wired into Reset
Visuals alongside the existing geo-grid/wave-ring restores.
`islands-tool.html`'s `<body>` now carries `data-theme="medieval-map"`
directly, so the theme dropdown opens already on Medieval Map instead of
needing a manual switch every reload ("while we are working on the
medieval map, make that the default option in the dropdown, so I dont
have to click 2 times to get to it").

### v3.7 -- WIP/dummy entries lose their dashed ring and their own hover identity; Medieval Map retinted

Two unrelated fixes, both direct requests, done back to back at the
start of this pass.

**WIP entries behave like filler islands, not muted real ones.** Previous
behaviour: an entry with `status: "wip"` still got its own `<a>`, hover
glow, and hit region, just with a dashed `.v3-status-ring` drawn over it
to flag "not fully live." Direct request: "Update all themes/visuals to
not have the dotted circles for the WIP/dummy entries. Dummy entries
simply have no hover effect of their own, they lead to section heads
like non-entry islands." `renderRegion()` (`cabinet-v3-layout.js`) now
skips the link/hit/glow/ring entirely for `status: "wip"` entries --
only the name label is drawn (still useful; it's a real, titled entry,
just not ready for its own hover/click identity), and with pointer-
events:none on the label and no `<a>` of its own, hover/click on that
spot falls straight through to the section's own hitGroup/glowGroup --
same as `kind: "filler"` circles, which never had a link of their own
either. `.v3-status-ring`'s CSS rule removed as dead code.

**Medieval Map retinted.** Direct spec: "islands - a darker brown, rich
and intense, with reddish tones / sea - a lighter sepia/brown, amber
tones." `--v3-veg`/`--v3-sand` (island tokens) -> deep reddish-brown
(`#5c2417`/`#7d3a24`); `--v3-sea-deep`/`--v3-sea-shallow` (sea tokens) ->
lighter amber/sepia (`#c9974f`/`#ddbd82`). `--v3-ink` (coastline stroke,
default label style) untouched. This theme runs `flatColourMode`, so
`--v3-veg`/`--v3-sea-deep` are what actually render (flat land fill +
`.v3-stage`'s own background); `--v3-sand`/`--v3-sea-shallow` (the
non-flat band tiers) tuned to the same two hue families anyway so the
theme stays coherent if flat mode is switched off from the dev panel.

### v3.6.30 -- section headings get the label-style treatment; a per-theme colour editor on the dev panel

Two additions, unrelated to each other beyond both being label/colour
tooling:

**Section heading label style.** `.v3-section-label` (the region names --
"Bookshelf of Curiosities," "Machines & Makings," etc.) previously had no
legibility treatment of its own, just a flat fill plus the existing
hover-to-solid-halo-colour behaviour (v3.6.27). Direct request: "the
section headings a thick stroke halo and other treatments like the
island entry names." Mirrors `.v3-island-label`'s existing three
`data-label-style` variants exactly -- same selectors, same
`--v3-label-outline` token, just added as a second target: "halo"
(default) gets a 3px `--v3-label-outline` stroke via `paint-order:
stroke`, "glow" gets the same double `drop-shadow()` blur, "plain" adds
nothing. Since `body:not([data-label-style])` counts as "halo," this is
live on the zero-JS `index.html` snapshot immediately -- pure CSS, no
markup change, confirmed via `npm run build` producing no diff. Existing
hover behaviour (label turns solid `--v3-halo-ink` on section hover)
untouched -- only fill was ever requested to change there, not the
ambient stroke/glow this adds.

**Theme colours editor (dev panel).** Direct ask, given in two parts: "I
didn't mean it needed to be corrected... I'm still updating colours and
would lose that combination" (context for why this exists at all -- see
v3.6.29's flagged glow note, which is exactly the kind of in-progress
tuning that was getting lost between conversation turns), then "just
give me colour controls for each of the tokens on the control panel,
make things collapsible," followed immediately by "allow each theme's
tokens to be seen and edited so I can copy paste colour code from one to
another as well." New "Theme colours (all themes)" subsection under
Visuals (`cabinet-v3-controls.js`): one collapsible group per theme (all
10, including "(none -- default)"), each holding the 8 `--v3-*` tokens
as a colour swatch + a plain hex `<input type="text">` side by side --
the text field is what makes "copy paste... from one to another"
literal, since a bare `<input type="color">` has no selectable text.

Mechanism: `themeTokenState`, a live in-memory copy of every theme's own
token values, seeded once at panel build via a new `readThemeTokens()`
helper (flips `document.body.dataset.theme` to each theme in turn,
reads `getComputedStyle` -- which resolves any `var()` chain a theme's
own tokens might reference, e.g. the default theme's `--v3-halo-ink:
var(--cab-land-hover)` -- then flips back, synchronously so nothing
repaints in between) BEFORE any inline override exists, so one theme's
edits can never contaminate another's "original" reading. Editing a
token writes into that theme's own slot in `themeTokenState` only; if
the edited theme is the one currently live, `applyThemeTokens()` also
pushes it onto `<body>` as an inline custom property (inline outranks
both the base `body.v3-proto` block and any `body.v3-proto[data-
theme="X"]` block, which is what makes the edit visible at all). The
existing Theme `<select>`'s change handler now also calls
`applyThemeTokens()` on every switch, so picking a different theme
re-applies whatever's been edited for it rather than reverting to its
un-edited CSS. "Reset colours" restores every theme from a one-time
snapshot taken at panel load. `THEME_OPTIONS` (the theme list) hoisted
out of the `<select>`-building code so the select and the new editor
can't drift into two different theme lists.

### v3.6.29 -- MedieRiso token tuning: explicit riso-neon hex values, ring/halo swap, flagged glow note

Two follow-up edits to v3.6.28's MedieRiso palette, given as explicit hex
values rather than described: `--v3-ink`/`--v3-sea-deep` moved off warm
brown to a near-black indigo/deep-blue pair (`#060126`/`#030085`), and
`--v3-halo-ink`/`--v3-label-outline` split apart -- both were riso pink
before, now distinct hues (initially magenta/purple, then `--v3-ring-ink`
and `--v3-halo-ink` swapped per follow-up so wave contours/band
boundaries read magenta `#f21d92` and the hover halo reads teal
`#1bf2b5`; `--v3-label-outline` stays purple `#e031eb`).
`--v3-sea-shallow`/`--v3-veg`/`--v3-sand` untouched, still the original
sepia tones.

**Flagged, not fixed:** the teal hover halo "looks radioactive" on an
island. Cause, not just a subjective read -- `.v3-island-glow` is a
6px-blurred fill of the *entire traced island shape* at 0.65 opacity on
hover (`cabinet-v3-style.css`), laid over the dark navy sea, the sepia
island fill, AND the magenta wave-contour rings all at once. On the
lighter/warmer bases the other 8 themes use, that same treatment reads as
a tint; on MedieRiso's near-black base a saturated teal at 0.65 opacity
blurred outward reads as emissive/neon rather than a highlight wash --
compounded by sitting directly against its magenta-ring/sepia-fill
neighbours. No action taken. Candidate directions for a real fix, if
wanted: lower `.v3-island-glow`/`.v3-section-glow` opacity specifically
for this theme (a themeable `--v3-glow-opacity` token), desaturate
`--v3-halo-ink` itself, or leave as-is -- "riso/neon" was the literal
brief, so a hover state that reads as electric may just be correct for
this theme.

### v3.6.28 -- "MedieRiso" theme: dark sepia base, riso-neon highlights throughout

Direct request, given as a single spec: a ninth Theme preset, dark warm
brown/sepia base colours "based on the medieval map palette," with every
highlight -- wave contours, hover halos, text outlines, boat interiors,
dragon fills, topology-band boundaries -- pulled from the riso palette
instead, outlines/strokes staying dark throughout.

**Palette.** `--v3-sea-deep/shallow/veg/sand` pushed to a genuinely dark
register (`#2c1f16` down to `#8a6440`) -- deliberately further than the
existing "medieval-map" theme's light parchment, closer to an old
leather-bound atlas at night, so the neon accents have real contrast to
land on. Riso accents reuse the EXISTING "riso" theme's own established
hex values rather than inventing a new set (`--v3-sea-deep`/`shallow`/
`veg`/`sand` there ARE riso's blue/teal/pink/yellow) -- `--v3-ring-ink`
(wave rings, and new band-boundary strokes -- see below) takes riso
yellow, the single highest-contrast "electric contour" accent; hover
halos and label outlines take riso pink, a second, deliberately distinct
"interaction" accent so hovering doesn't just read as "brighter yellow."
Both wave rings AND colour bands are on together (`THEME_PRESETS`,
`cabinet-v3-controls.js`), same pairing as "ukiyo" -- bands carry the
sepia depth, rings lay neon iso-lines on top, two roles rather than one
replacing the other.

**Extending the theme system to reach things it never has.** Several
elements this request touches were never theme-aware at all -- hover
halo fill and label-outline colour were hardcoded to `--cab-land-hover`/
`--cab-land-light` directly (not a `--v3-*` token), and boat/dragon fill
colours were plain JS constants with no CSS or theme hook whatsoever.
Refactored the former into two new tokens on `body.v3-proto`
(`--v3-halo-ink`, `--v3-label-outline`), defaulting to the exact values
every other theme already had hardcoded (verified by diffing all 8
existing themes' computed values before/after -- pixel-identical, and
confirmed the actual production default via the zero-JS `index.html`
hover check too) so only `medieRiso` visibly changes. For the latter,
added a small `isMedieRisoTheme()` check (`cabinet-v3-layout.js`, reads
`document.body.dataset.theme` live, no caching -- so switching themes via
the dev panel needs no separate particle-pool/dragon rebuild wiring) that
swaps in a riso colour pool for boats' FILL (`buildParticleElement()`)
and dragons' fill array (`ensureDragon()`) only when active -- outlines/
strokes for both are untouched, since the existing dark palettes already
satisfied "outlines are dark" as-is. Confirmed live: boat fills sampled
across a full 130-particle pool were exactly the 3 riso hues expected,
dragon fills matched too.

**One genuinely new visual treatment, not a token swap**: sea/sand/veg
colour bands are fill-only in every other theme (`.v3-sea-band` etc.,
`cabinet-v3-style.css`) -- added a `--v3-ring-ink` boundary stroke to
them, scoped only to `[data-theme="medieRiso"]`, so each band's own edge
reads as an iso-line too, not just the wave rings.

Typography reuses already-loaded font stacks from two existing themes
rather than adding a new dependency: "Cinzel" for the header (medieval's
own choice) paired with "Space Mono" for labels (riso's own choice) --
the same medieval+riso hybrid the colour palette is doing, just in type.

### v3.6.27 -- hover label colours invert on hover; "thin stroke" label style removed

Two small follow-ups to v3.6.26's hover rework, both direct requests:

**Colour inversion on hover.** A section's own label now fills the SOLID
version of its glow colour on hover (`--cab-land-hover`, already a fully
opaque hex -- the glow itself just uses it at low opacity for the wash,
see `.v3-section-glow`) instead of staying the default ink colour. An
entry's own label, in both the "halo" (thick stroke) and "glow" (soft
drop-shadow) styles, now INVERTS on hover -- dark-fill/light-halo becomes
light-fill/dark-halo -- confirmed via computed styles (`getComputedStyle`
diffed hovered vs. not, not just eyeballed), not just for `islands-
tool.html` but for the zero-JS static `index.html` too, since this is
pure CSS (`.v3-island:hover .v3-island-label` etc.) -- no JS involved at
all. "Plain" (no treatment) is deliberately untouched -- nothing to
invert there.

Bug found along the way: `.v3-section-label` wasn't actually a DOM
descendant of `.v3-section-link` (it was a sibling, both children of the
region's own `<g>` -- see v3.6.26's own note on `renderRegion()`'s
structure), so a plain `.v3-section-link:hover .v3-section-label`
selector could never have matched. Fixed by appending the label group to
`sectionLink` itself instead of `group` -- the same relationship
`.v3-island-label` already had with its own `<a>` -- rather than reaching
for a sibling-combinator workaround; `pointer-events: none` (already set)
still keeps it from stealing hover/click away from the link's own hit
shape underneath.

**"Thin stroke" removed** from both `cabinet-v3-style.css` and the
dev-panel's Label style select (`cabinet-v3-controls.js`) -- three
remaining options (halo/glow/plain) already span the range it sat
between.

### v3.6.26 -- real-shape hover halos and click areas for islands and sections

Direct request, with its own set of clarifying questions asked and
answered before writing any code (see the conversation log): island
hover halos were a circle approximation (`r = entry radius + 8`) over
the real, noise-carved coastline, and a section's whole `region.inner`
rectangle was both its hover glow and its click target, regardless of
how little of that rectangle its actual content (label + islands)
occupied.

**Per-island shape.** `traceIsolatedShape()` (new, `cabinet-v3-
layout.js`) traces one circle's own real coastline the same way the
shared map coastline is traced (`buildIslandHeightmap` +
`traceContourFromHeightmap`, same threshold), just scoped to that one
circle and a tightly-cropped LOCAL bounding box (not the full canvas) --
`buildIslandHeightmap`'s own compute cost already only touches a
circle's influence box regardless of the bounds passed in, but its
allocation cost (one `Float32Array` sized to the grid) does scale with
those bounds, and this now runs ~25+ times a layout. Isolating a single
circle this way is safe even where two entries' coastlines visually fuse
into one landmass: `buildIslandHeightmap` combines circles via a per-cell
`max()`, so tracing one circle alone reproduces exactly the portion of a
fused blob that circle is itself responsible for -- the union of every
entry's own isolated trace reconstructs the fused shape exactly, no
seam-splitting logic needed. Glow and hit both reuse the identical
path -- no separate enlarged geometry for the glow; the existing
`blur(6px)` filter already produces the soft bleed past the coastline
edge on its own.

**Per-section shape**, three components, decided via direct questions
(scope, coastal-zone width, cross-section-overlap behaviour, whether an
entry's own interior counts): the label band (a plain rect, already
computed by `splitLabelBand()`) plus one `traceIsolatedShape()` call over
EVERY circle in that section (entry and filler alike) with
`extraDistance` set to `v3Config.island.waveDistances`' own outermost
ring (~18.5px) -- reusing an already-established "just past the last
visible ripple" distance rather than a new hand-tuned number. That single
dilated trace covers filler islands' full body, entry islands' full
interior (a deliberate fallback layer -- an entry's own link, painted
after the section link and so on top of it in hit-test order, still wins
wherever the two overlap), and the requested coastal-zone buffer, all at
once -- reusing the exact distance-field technique the wave rings already
use (`buildCoastlineDistanceField`, trace at level `-D`), just over a
per-section circle subset instead of the whole map. No boolean union
needed anywhere: the label rect and the traced shape are separate sibling
elements inside one `<a>`, and SVG hit-testing across overlapping
siblings of one interactive element already behaves as a union.

**Cross-section overlap -> dead zone, not fallthrough.** A `<clipPath>`
scoped to that section's own `region.inner` rect is applied ONLY to the
hit shapes, never the glow -- so an island (or its coastal zone) that
visually crosses into a neighbouring section's rectangle still reads as
one continuous coastline, but stops being clickable right at the seam.
Chosen over "falls through to the neighbour's own link" specifically:
since every section computes and clips its hit shape independently, from
only its OWN content, a patch neither section's real content reaches
(most of any region's open corners) is simply unclickable for both --
verified with a 20x30-point hit-test sweep of the whole canvas
(`elementFromPoint()` at every grid point, classified island/section/
dead), landing at 43% dead-zone coverage, visibly clustered exactly where
expected (region gaps, corners far from any island) -- not a guess.

**Verification, beyond the sweep above**: zero-console-error check;
confirmed island-vs-section precedence directly (`elementFromPoint()` at
an island center resolves to that island's own `<a>`, not the section
underneath); measured `render()` cost before/after via `git stash`
(82.5ms -> 193.9ms average) -- flagged as a real number rather than
silently absorbed, though not optimized further since `renderRegion()`
only runs on discrete actions (page load, Reroll/Restore-position), never
on live slider drags, and the production page (`index.html`) pays this
cost at BUILD time only, not per real visitor. Rebuilt `index.html` via
the existing `build-static.mjs` pipeline and re-verified **with
JavaScript entirely disabled** -- hover/click both work via pure CSS +
real `<a href>`, confirming this reaches production the same
zero-runtime-JS way `islands-tool.html`'s own DOM already does.

### v3.6.25 -- dragon movement fixes: measured (not guessed) bobbing fix, archipelago-scale coast tuning, panel collapsed by default

Follow-up to v3.6.24, all three items diagnosed with real measurements
rather than another round of guessed constants:

**Bobbing.** Reported as "still mostly bobbing up and down" after a
first-pass speed bump (10->15) and a heading-amplitude guess (headingSwing
2*PI->PI) neither of which addressed the real cause. Ran `fbm2D` standalone
in Node and sampled its actual output: only +/-0.3 to +/-0.5 over a
minute for this heading stream, nowhere near the +/-1 to +/-1.75 the
original code assumed -- mapped through any fixed scale onto an absolute
heading, that narrow range confines movement to one ~90-120 degree arc
where the vertical component (`sin`) routinely exceeds the horizontal
one (`cos`), i.e. genuinely mostly-vertical motion, not a perception
issue. Fixed by making heading an INTEGRATED angular velocity instead of
an absolute angle -- `heading += noise * turnRate * dt`
(`cabinet-v3-dragon.js`'s `stepDragon()`) -- which lets it do a proper
slow walk around the full circle over time regardless of the noise's own
range. `speed` also raised 15->22 (no longer needs to stay under
particles' 13, since it no longer needs to read as slower than the
boats, just as clearly traveling). `headingSwing` config field removed,
replaced by `turnRate` (0.9, see below).

Even with that fix: "some are stuck bobbing but some move fine." A pure
random-walk heading has no restoring bias, so long streaks stuck near a
vertical heading are an expected property of the model (simulated:
10-19s at `turnRate` 0.6 across several seeded runs), not a bug -- some
dragons' own noise permutation happens to linger near-vertical, others
don't. `turnRate` bumped 0.6->0.9 (simulated to trim worst-case stuck
streaks to ~9-12s without becoming a visible spin) as a partial, flagged
mitigation, not a full fix -- a genuine fix (a mild bias back toward
horizontal) would change the wander's character enough to want its own
before/after look first.

**Coast avoidance.** "Not really respecting the coast always, and
sometimes disappearing even when far from the coast." Diagnosed with
temporary console instrumentation (every dive trigger's position + a
brute-force nearest-land scan) run live via Playwright for real
wall-clock time, plus screenshots with the check radius drawn as an
overlay -- this map turned out to be a dense archipelago (dozens of
separate small islands), and `minCoastDistance` (90px, checked
omnidirectionally) was frequently unsatisfiable: dragons dove in visibly
open channels because some unrelated island's corner sat within 90px in
some other direction, and `pickOpenSeaPoint()`'s 80-attempt rejection
sampling was failing often enough to regularly fall back to
`pickWaterPoint()` (no distance guarantee at all) -- the actual cause of
dives within the first couple of frames after page load, right next to
a coast. Fixed by dropping `minCoastDistance` 90->40 (close to the
dragon's own rendered footprint plus a small buffer); re-verified with
the same instrumentation that the fallback no longer fires and every
dive now has real land within the check radius.

**Dev panel.** The tuning panel opened fully expanded on every load,
covering part of the canvas. The outer panel (`cabinet-v3-controls.js`'s
`buildControlPanel()`) is now itself a native `<details>`/`<summary>`,
closed by default -- same pattern its three inner sections already used,
one level up.

### v3.6.24 -- independent sea-dragon wanderers, from a user-supplied `dragon.svg`

New mini-feature: 1-3 dragons (never 0, `ensureDragon()` in
`cabinet-v3-layout.js`) spawn at random open-sea points on every page
load, each with its own size (`sizeMultMin/Max`) and a shuffled,
non-repeating fill colour from a light palette (`fillColors`). Pure
logic split into its own module, `cabinet-v3-dragon.js` (`spawnDragon()`/
`stepDragon()`), same rationale as `cabinet-v3-particles.js` --
`cabinet-v3-layout.js` owns the DOM/RAF loop, this module only decides
where a dragon IS.

Deliberately NOT part of the particle/current system -- `vectorAt()` is
never called. Heading comes from `fbm2D` sampled over time only (reused
from `cabinet-v3-islandshape.js`, the same primitive the current's own
potential field uses), explicitly not a per-frame random increment --
same "jitter reads as vibration, not organic drift" reasoning already
applied to particle personalities in v3.6.23. Never rotates to face its
heading -- the artwork is fixed horizontal by construction (`dragon.svg`
draws it that way) -- only ever mirrors left/right via the scale
transform's sign, since the native art faces left.

`DRAGON_PATH_D`: the SVG's path `d` attribute copied in as a literal JS
string constant, not `fetch()`'d at runtime (`file://` CORS, a recurring
issue this session) and not referenced via `<use>`/`<symbol>` (a
previously-confirmed, unresolved Chromium painting bug in this
codebase) -- inlined as a raw `<path>`, same pattern the particle
ellipses already use.

**Coast avoidance**, both at spawn and live: `isNearLand()`
(`cabinet-v3-dragon.js`) rejection-samples/checks a ring around a point
for nearby land, shared by `pickOpenSeaPoint()` (spawn and post-dive
resurface point selection) AND a live check inside `stepDragon()`'s
"swim" branch on every candidate next step -- one mechanism handles both
"don't spawn on the coast" and "don't wander close to the coast either."

**Dive/resurface**: event-triggered, not on a timer -- whenever a swim
step's candidate next position would be near land, the step is held and
a dive starts instead. The "disappear" visual is a real SVG `<clipPath>`
(a fixed rect matching the artwork's own viewBox) wrapping an inner
group whose Y-translate is animated -- sliding the art down past the
clip's bottom edge makes it progressively vanish as if sinking beneath
the surface, revealing whatever's actually behind it, rather than a
shrink-to-zero-scale or opacity fade. Verified with a Playwright pixel
comparison (not just DOM/`getBBox()`, which doesn't reflect clipping) --
this codebase has hit an unrelated "DOM looks right, nothing paints" SVG
bug before, so a visual effect built on `<clipPath>` got the same
skepticism until a screenshot confirmed it.

Three rounds of direct feedback shaped the above from a rougher first
cut (orientation now fixed/mirror-only not rotate; sizing went
24->48->36px target width; a horizontal baseline line was tried, then
removed entirely rather than shortened; dive/resurface went from a
periodic ~30s timer to purely event-triggered). See the conversation log
for the full back-and-forth.

### v3.6.23 -- per-particle "personality" demo mode (bias / offset / both), for "one giant trash drift"

At high particle counts (surfaced while testing v3.6.22's raised
count/maxCount sliders), every particle samples the exact same
deterministic field, so density alone doesn't add variety -- position is
the only differentiator, and a spatially smooth field means nearby
particles look near-identical: "it looks like a giant trash drift rather
[than] individual boats." Three options, each with the logic and a
concise for/against:

1. **Bias** -- a constant personal `speedMult` + `dirRotate` (fixed
   heading offset), rolled once per spawn, applied every step on top of
   the shared field.
   - For: cheapest, easiest to reason about ("this boat's faster/veers
     a bit").
   - Against: divergence only builds up over travel time -- particles
     spawned close together still look identical for a beat before
     fanning out, so it doesn't fix the worst case (dense fresh clumps)
     immediately. Confirmed weaker live: "I dont think 1 is having too
     much of an effect."

2. **Naive per-frame jitter** -- fresh randomness added to the sampled
   vector every tick (considered, never built).
   - For: cheap, instant per-particle difference from frame one.
   - Against: uncorrelated frame-to-frame noise reads as vibration, not
     a sustained personal drift -- rejected on visual grounds before
     writing any code.

3. **Offset** -- a constant personal `(offsetX, offsetY)` shifts only
   WHERE a particle reads the current's own noise field (`vectorAt()`'s
   new optional offset params, `cabinet-v3-flowfield.js`); the coast/
   repulsion gradient and the `isLand()` hard backstop always stay at the
   particle's true position, untouched.
   - For: zero extra noise evaluations (reuses the same `fbm2D` calls),
     smooth/continuous like the shared field itself (not jittery), and
     diverges from frame one. Measured directly: average heading
     difference between particles within 40px of each other rose from
     25deg (off) to 44deg (offset) vs 31deg (bias).
   - Against: only varies the current's own local texture, not the
     large-scale shared drift (`offsetRange` deliberately well under
     `potentialScale`'s ~300px wavelength) -- the fleet still visibly
     belongs to one current, just with real per-boat texture underneath.

Personalities are assigned via a low-discrepancy (Weyl/golden-ratio)
sequence keyed to an incrementing spawn id, not independent
`Math.random()` calls -- random offsets can cluster/collide purely by
chance (birthday paradox in 2D), which would specifically fail to
decorrelate the near-each-other particles that matter most; a
low-discrepancy sequence spreads evenly by construction, and gets
better-spaced as particle count grows rather than worse.

New `v3Config.particles.personalityMode` (`"off"` default / `"bias"` /
`"offset"` / `"both"`) plus first-guess range constants
(`personalityOffsetRange`, `personalitySpeedMultMin/Max`,
`personalityDirRotateMaxDeg`, not yet tuned by feel), and a dev-panel
"Particle personality (demo)" select that forces an instant full pool
rebuild on change for a clean, immediate before/after rather than a
gradual phase-in. Demo/comparison build -- shipped default stays `"off"`,
not decided yet, still being evaluated.

### v3.6.22 -- coastal spawn, wider entry arc, spawn stagger, dev-panel controls for all of it, live-tuned defaults

Follow-up to the SW-corner-pileup report: `spawnArcFraction` widened
0.35->0.55 -- at this canvas's proportions (wider than tall), that covers
roughly the whole bottom edge, the whole left edge, and a bit of the top
edge near NW, while the far NE corner and most of the right edge stay
clear -- kept the directional lean, per direct feedback ("Variation is
good, i dont want a uniform spread... but wider").

Second report, after that: "coastal-stuck particles simply respawn, not
much manages to go ahead till the NE corner." Rather than loosen the
stuck-detector (would let real traps clear more slowly again, working
against v3.6.20's own fix), added a genuinely new spawn origin instead of
just widening the old one: `coastSpawnFraction` (default 0.5) of EVERY
spawn -- initial pool and mid-simulation respawns alike -- now lands at a
coastal water point via `pickCoastalSpawnPoint()` (`cabinet-v3-
particles.js`, rejection-sampling against `isLand()`, cheap -- no noise
evaluation, just bilinear heightmap lookups) instead of the usual
off-canvas arc point. `coastSpawnDirMode` picks the initial direction:
"repulsion" (a new `repulsionAt()` export on the flow sampler -- the
exact, un-blended push straight off the shore) or "blended" (the normal
current+coast field direction every other spawn already used). Both
options were built as a live dev-panel A/B specifically so this could be
compared by feel rather than guessed -- verdict after trying both:
"repulsion is marginally better than blended, but not by much," kept as
the default on that basis. Deliberate side effect: coastal points land
wherever islands actually ARE, not funnelled through the SW arc, so this
directly helps the same central/NE-quiet complaint the wider spawn arc
was already addressing, from a different angle.

Also: spawning a whole batch at once (initial page load, or a dev-panel
pool resize) made every particle share the exact same field-phase,
reading as a synchronised "wave" rather than ambient traffic. Fixed with
`spawnStaggerMax` (default 4s) -- each particle in a fresh batch gets a
random activation delay and sits inert at its spawn point until then,
invisible for arc spawns (off-canvas) but explicitly SKIPPED for coastal
spawns (`p.coastal`), since those are inside the visible canvas and would
otherwise read as a boat frozen at the shore.

**Dev panel**: Base count / Max cap sliders for `v3Config.particles.
count`/`maxCount` (range raised to 1000 on request, specifically to let
the "individual boats vs. one uniform drift" question below be felt
directly), plus Coastal spawn % and Coastal spawn direction controls for
the above -- all live-tunable without a reload, base count triggers a
full pool rebuild (`refreshParticleCount()`, new export), everything else
reads fresh on the next spawn/click with no rebuild needed. Wave ring
parameters and Topological offset parameters (previously flat headings
inside Visuals) are now their own nested collapsible `<details>`
(`makeSubsection()`), closed by default -- direct request, they were
taking up a lot of the section's space even when not being tuned.

**Defaults, after live tuning through the above**: `count` 60->130,
`maxCount` 90->150 (no longer simply `count * 1.5` -- both dialled in by
feel, independently). Direct observation while comparing at the high end
of the new 1000-particle slider range: since every particle follows the
literal same current/speed field, a genuinely large pool reads as "one
giant trash drift" rather than individual boats -- the coastal-repulsion
launches help some (they don't start from the same shared trajectory),
but don't fully solve it. Not an issue at the shipped 130 -- noted as a
real limitation of the current "one shared field, no per-particle
character" design, not fixed this pass; see the conversation log for the
cost analysis of a per-particle-personality follow-up.

### v3.6.21 -- hard land-crossing backstop, click-to-launch with a governed particle pool

The coast vector (v3.6.16) is a SOFT, additive force -- summed with the
current, not a wall -- so at points where the current's own local
direction happened to point toward the coast with a magnitude close to
the coast vector's, the two could partly cancel, letting a slow particle
drift onto land over many frames even with an otherwise-correct field.
Reported directly, and confirmed distinct from the v3.6.20 drift-bug fix
(persisted after that fix landed). Added a genuine hard backstop,
separate from the smooth force: `createFlowSampler()` now also returns
`isLand(x, y)`, reading the SAME `v3Config.island.threshold` the
coastline itself is traced at (merged into the flow sampler's config only
at the `buildCurrentSampler()` call site, so it can never disagree with
what's actually drawn as land); `stepParticle()` rejects outright any
step that would end on land, holding the particle at its pre-step
position instead.

Click-to-launch: clicking open water (`sampler.isLand()` gates it, so a
click on land or off-canvas is silently ignored) adds a genuinely new
particle at that point, not a recycled slot. `v3Config.particles.maxCount`
(90, 1.5x the base 60) hard-caps growth -- direct feedback flagged this
explicitly as "not a serious feature," priority on bounded, predictable
cost over any particular click behaviour, so a click past the cap just
does nothing. Growth only happens via a click; every particle (clicked or
original) drains back out through the same exit path in
`stepParticle()`/`tickParticles()` -- while the pool is above its base
count, exits stop being replaced (`allowRespawn`, threaded through as a
parameter, `stepParticle()` returns `true` to signal "remove me" instead
of respawning in place), so extras die off naturally as they exit or get
stuck, with no separate "is this one an extra" bookkeeping needed.
Per-particle DOM construction (ellipse + 2-3 ribs + colour) was factored
out of `ensureParticles()` into `buildParticleElement()` so a
click-launched boat looks identical to an original one.

Cost check (asked directly): at the 90-particle cap, per-frame noise cost
is ~65,000 raw lattice evaluations/sec, still trivial; the actual risk
without a cap was unbounded growth outpacing the slow natural drain
(15-20s canvas transit time) under sustained/rapid clicking, degrading
toward real jank on weaker hardware well before any memory-driven crash
-- confirms the cap was the right lever, not overcaution.

Boat outline `stroke-width` raised (0.6 -> 1.1 body, 0.5 -> 0.8 ribs) --
too thin to read the per-particle colour clearly at the shapes' small
size.

### v3.6.20 -- speed/current retune, live debug field, boat styling, and a second structural trapping fix (this time on the STATIC half of the field)

Direct feedback after v3.6.19 landed: particles felt too fast, the NE
current bias read as "migrating" rather than "wandering" (flattening
local variation), and particles were intruding along coastlines/crossing
narrow fingers of land. Retuned together: `particles.baseSpeed` 20->13,
`speedGain` 1200->800, `maxSpeed` 110->70 (~35% slower everywhere, same
coastal-vs-open contrast); `flow.biasStrength` 0.05->0.03 (magnitude
only -- the channel-cooperation fix from v3.6.19 reads only
`biasDirX/Y`'s sign, untouched by this); `flow.coastMix` 0.65->0.55, more
repulsion relative to edge-following.

**Second trapping bug, distinct from v3.6.18's**: two more reports (a
specific channel that reliably trapped particles; a bay that did the
same) traced to a property of the coastal TANGENT vector, not the
current -- `rot90(gradient)` is divergence-free by construction, the
exact same structural fact that gave curl noise its permanent vortices,
except this half of the field was deliberately kept static (islands
don't move), so any closed loop it formed in tight/concave geometry never
dissolved. First fix attempt drifted the tangent's heightmap sample
LINEARLY (`t * driftSpeed`) and shipped a real regression, reported
directly ("going over more land than before... worse the longer the page
had been open"): `t` only grows for the page's lifetime, so a linear
offset grows unboundedly too, eventually sampling the gradient from well
inside the same landmass. Corrected to a BOUNDED sin/cos oscillation
(`coastTangentDriftAmpX/Y: 7/5`, `coastTangentDriftFreqX/Y: 0.29/0.37`,
mismatched frequencies so the sample traces an open path rather than its
own fixed loop) -- verified via a throwaway Node script against a
synthetic narrow-gap heightmap that the offset never exceeds its ~8.6px
amplitude cap even over a simulated 30-minute session, while the field's
direction at a fixed channel point still visibly rotates rather than
freezing. Repulsion itself never drifts, only the tangent -- "is there
land here" has to stay exact always, sliding direction is a soft,
aesthetic choice a little temporal wobble doesn't hurt.

Also: `showPotential`/`showVectors` debug grid no longer freezes at t=0
forever -- `animationFrame()` rebuilds it every ~0.4s at the live
elapsed time (throttled, not every frame -- a full grid rebuild is real
work), so the debug view stays correlated with what particles are
actually doing, direct request ("so I can visually correlate particle
behaviour with the underlying field"). Particle styling: random
0.6x-1.8x size variation per slot (`sizeMin`/`sizeMax`), a dark outline
colour randomised per particle off a small palette (sepia brown,
near-black, deep violet, navy) against a fixed light cream fill
(`--cab-land-light`, so the outline doesn't vanish into a same-colour
body), and 2-3 short ribs crossing each ellipse's width at randomised,
non-overlapping offsets, each trimmed to the ellipse's own local
half-height so they read as following its curve.

### v3.6.19 -- narrow-channel clumping fix, prevailing SW-NE current, spawn-arc entry, stuck-particle safety net

Reported: particles clumping specifically in narrow bays/channels, more
than open water. Root cause: the coastal tangent (v3.6.16) is a fixed
90deg rotation of the local gradient, and two facing coastlines across a
narrow gap rotate in OPPOSING directions right in the middle -- each
island's own boundary is locally consistent, but two separate islands
facing each other fight. Confirmed via a throwaway Node script against a
real narrow-channel heightmap (had to first scan the heightmap directly
to find the TRUE water gap rather than trust nominal circle radii). First
fix attempt -- aligning tangent handedness to the LOCAL current direction
-- was tried and rejected: the current's own higher octaves have
wavelengths short enough (~75px) to disagree with themselves across a
40-50px channel, just relocating the fight. Fixed instead by aligning
handedness to `biasDirX/Y`, a new CONSTANT prevailing-current term
(screen-space NE, tuned to `biasStrength: 0.05`) added alongside the
swirl -- direct request, "I want the general overall current to go
southwest-northeast... lots of local variations" -- since it's the one
reference that's genuinely identical everywhere, both channel walls now
agree. Verified: the two walls' tangent dot product flipped from
negative ("fight") to positive ("cooperate") at every bias strength
tested.

Particles now enter from one biased SW arc (`spawnDirX/Y`,
`spawnArcFraction: 0.35`, matching the current bias reversed -- upstream)
rather than scattering around the whole off-canvas ring, direct request
("particles need to start from one offscreen area and spread out").
Added a cheap stuck-particle safety net (`stuckCheckInterval: 2.5s`,
`stuckThreshold: 15px`): net displacement under the threshold force-
respawns a particle regardless of cause -- deliberately NOT the
density/neighbour-based version of this idea, flagged directly as the
expensive one.

### v3.6.18 -- fixes particles trapped in closed orbits; open water gets real speed and variation

Reported directly: "particles go into and are trapped and stay there
rotating on themselves... atleast up the base noisefield variations and
the open sea should also have some speed." Root cause: curl noise (the
current) is divergence-free EVERYWHERE by construction, which means it
has permanent vortex centres around any local extremum of its potential
in a perfectly STATIC field -- not a bug in the usual sense, a known
structural property -- confirmed directly (sampling the same point 20
simulated seconds apart in the pre-fix field returned the literal
identical vector, 0.0deg of change). Fixed by drifting the potential's
own sample position over real elapsed time (`driftSpeedX/Y: 5/4` world
px/sec, asymmetric on purpose so the drift itself isn't axis-aligned) --
any given vortex now drifts and dissolves/reforms elsewhere rather than
trapping a particle forever; the coast vector, tied to real static
geometry, deliberately does NOT drift (that gap is what v3.6.20 later
closed). Verified: the same adversarial test point (the midpoint of a
narrow channel) now rotates ~20-30deg over 20 simulated seconds instead
of sitting frozen.

Also added `currentGain: 16`, a pure magnitude multiplier on the current
(decoupled from `potentialScale`/`octaves`, which shape frequency/texture
not overall energy) -- open water's raw current magnitude was tiny
(~0.002-0.004) next to a coastline's coast-vector-dominated magnitude
(~0.05-0.1), so particles were essentially just riding `baseSpeed`'s own
floor out at sea. Retuned `potentialScale` 1/420->1/300, `octaves` 2->3
for more local variation, and pulled particle speed constants back
(`baseSpeed` 15->20, `speedGain` 2000->1200, `maxSpeed` 90->110) since
raising current magnitude meant the old `speedGain` would overshoot.

### v3.6.17 -- the particle system: pool, off-canvas spawn/recycle, small rotated ellipses

Punch-list item 4's remaining half, built on the v3.6.16 field. New
module `cabinet-v3-particles.js` (pure logic/no DOM, same split rationale
as its siblings): particles spawn on a padded ring outside
`canvasBounds`, advect via the field's own direction each step (speed a
clamped function of the field's local magnitude, never directly
proportional -- otherwise a coastline/channel would look like it's
darting at jet speed relative to open water), and recycle to a fresh
off-canvas point once they wander back outside that same ring -- one
mechanism handles both entry and exit, since it's the same rect test
either way. Rendered as small `<ellipse>` shapes (`rx: 3.2, ry: 1.3`,
`--cab-land-light` fill) rotated to lean along their direction of travel,
a cheap directional cue without a real trail.

Scoped entirely to `islands-tool.html`: `startCurrentAnimation()` is
exported from `cabinet-v3-layout.js` but the ONLY call site is the very
end of `cabinet-v3-controls.js`, which itself only ever loads on the tool
page -- so `index.html`/`build-render.html` pay nothing for this, not
even the DOM elements, with no separate page-detection logic needed. The
static debug-grid snapshot (`buildFlowField()`, used by the
`showPotential`/`showVectors` toggles) and the live per-particle sampler
(`createFlowSampler().vectorAt(x, y, t)`) are deliberately separate code
paths off the same underlying field math -- particle-stepping cost scales
with particle COUNT (~60) only, independent of canvas or grid resolution.

### v3.6.16 -- flow field: math + debug view, no particles yet (first slice of the Flowfield stretch goal)

Punch-list item 4's flowfield idea, picked back up with concrete
direction this time: precomputed field (not live simulation), and for
island-avoidance, a choice between three approaches -- no-go areas, a
strong edge-following vector, or repulsion (flagged as "an easier
composite vector field to compute").

Turned out not to be a choice at all. `buildIslandHeightmap()`
(`cabinet-v3-islandshape.js`) already produces a smooth scalar height
`h(x,y)` for the coastline trace -- its gradient points toward land, so
`-gradient` is repulsion and `gradient` rotated 90deg is a tangential,
edge-following vector, both derived from the exact same already-computed
field, no separate boundary tracing needed (which was the genuinely
expensive version of "edge-following" being flagged as a concern). A new
`coastMix` config value blends the two rather than forcing a pick: 0 is
pure repulsion, 1 is pure tangential; shipped at 0.65, leaning toward
"slides around the island" over "bounces off it," which reads less
mechanical.

The base current (the "smooth lazy field, not very turbulent" part) is
curl noise -- the gradient of a low-frequency scalar potential, rotated
90deg -- rather than sampling two independent noise functions for vx/vy
directly, since curl noise is divergence-free by construction (no fake
convergence points where particles would unnaturally clump, which
independent sampling can produce).

New module: `cabinet-v3-flowfield.js`, pure logic/no DOM, same split
rationale as `cabinet-v3-treemap.js`/`cabinet-v3-circlepack.js`/
`cabinet-v3-islandshape.js`. Reuses that last module's seeded-noise
primitives (`mulberry32`/`seedFromString`/`buildPermutation`/`fbm2D`,
newly exported for this) rather than duplicating a second Perlin
implementation -- they were already general-purpose, not coastline-
specific. New `v3Config.flow` block in `cabinet-v3-data.js` holds the
tuning knobs, field-noted the same way `v3Config.island` is.

Default constants (`potentialScale`, `coastStrength`, etc.) came from a
throwaway Node script sampling the real field against realistic content,
not guessed -- confirmed `coastStrength: 3` puts the coast vector at
roughly 20-25x the base current's magnitude right at a coastline, fading
to near-zero by open water, entirely for free from the gradient's own
shape (no separate falloff function needed).

**Scope, deliberately**: field math plus two dev-panel debug toggles
only -- Visuals section, "Flow potential" (tints a grid by the base
current's own scalar potential -- "the noise field" itself) and "Flow
vectors" (the full composite field as arrows, length-capped for
readability near a coastline where raw magnitude spikes). No particle
system yet. This was a deliberate first slice, agreed before writing any
code: validate the field looks right by eye before spending effort
animating something on top of it that might need the field retuned
anyway. Both toggles ride the existing cheap `retraceIslands()` path
(same as Wave contours/Colour bands), verified clean on/off toggling with
no stale-element leftovers and zero console errors.

Screenshots: `v3.6.16-flow-vectors-debug.png`,
`v3.6.16-flow-potential-debug.png`.

Also settled, going forward: a persistent local Playwright install now
lives outside the (session-wiped) scratchpad specifically so it doesn't
need reinstalling every session -- and for anything visual/aesthetic,
the plan is to point at the live page and let it be judged directly
rather than defaulting to a screenshot-and-describe round trip.
Playwright stays for what it's actually good for here: functional
checks (console errors, correct hrefs, no stale toggle state) that don't
need a human eye.

### v3.6.14-v3.6.15 -- eight comparison colour/type schemes wired into the Theme dropdown

Punch-list item 10 (fonts/colours/sizes pass), scoped per direct
instruction: build several complete, self-contained schemes side by
side rather than converging on one -- "pick one that has more potential
and looks better, while leaving the other in the notes." Switched live
via a `data-theme` attribute on `<body>` (dev panel: Visuals > Theme,
`cabinet-v3-controls.js`), same pattern `data-label-style` already used.

- **medieval** / **satellite** (v3.6.14) -- first-guess pair, reusing
  the site's existing `--cab-paper`/`--cab-land` tokens. Kept as-is,
  relabelled "(draft)" in the dropdown once the doc-accurate versions
  below were added, rather than replaced -- their exact token values
  differ.
- **medieval-map**, **bathymetric**, **riso**, **cyanotype**, **neon**,
  **ukiyo** (v3.6.15) -- built from `v3-scheme-candidates.md` (new file
  this pass, the source of truth for each scheme's palette/type
  reasoning -- kept separate from this changelog rather than duplicated
  into it). Selecting a theme nudges the existing Wave contours / Colour
  bands checkboxes to whichever combination that scheme was written
  assuming (`THEME_PRESETS` in `cabinet-v3-controls.js`), but both stay
  independently editable afterward -- picking the "wrong" combination for
  a given theme still renders using that theme's own colour tokens, just
  through the band-alpha mechanism instead of a flat fill (or vice
  versa), which can look under- or over-tuned since the tokens were
  chosen for the default pairing.
- Added two new theme-scoped custom properties, `--v3-ink` and
  `--v3-ring-ink` (defaults to following `--v3-ink`), so wave-ring/
  coastline stroke colour can be themed too -- previously both hardcoded
  `var(--cab-ink)`. Used to give Neon Memphis a neon accent on the wave
  rings specifically while keeping the coastline outline heavy/near-black
  (the doc's own note: pastel land/sea sit close in value, so outline
  weight has to do more legibility work than in the other schemes).
- Riso's halftone texture and ink mis-registration offset are **not**
  built -- colours/fonts only for now, flagged in a CSS comment as a
  fast-follow once/if that scheme is a real contender, not silently
  dropped.
- Nine additional Google Fonts families loaded on `islands-tool.html`
  only (never `index.html`/`index.template.html` -- nothing here has been
  chosen as final).
- Verified structurally after each edit (comment-stripping + brace-
  balance check via a small Node script) rather than a live-browser
  reload each time, after v3.6.14's own theme work was slowed by a CSS
  comment accidentally containing a literal `*/` (`--v3-*/--cab-*`),
  which silently truncated the comment and dropped the whole next rule --
  found via `document.styleSheets[].cssRules` inspection, not visual
  review. The same class of bug is what the Node check now catches
  up front.

### v3.6.13 -- islands and sections both link out; hover feedback becomes a blurred glow

Entries already linked to their own pages (`c.href`); sections didn't --
there was no way to reach a section's own landing page except through
one of its entries. Section data already carries an `href`
(`content/cabinet-sections.tsv` -> `buildSections()`), just not wired
into the SVG. `renderRegion()` now wraps the whole region (`region.inner`
-- both the label band and the circle-pack area) in its own `<a>`,
rendered before the entries so they still win hit-testing (and stay
visually on top) wherever they overlap it.

Separately, the hover feedback on both islands and sections was a
stroked ring/rect -- a hard, obviously-artificial shape popping up
against an organic coastline, called out directly as not wanted. Both
replaced with a blurred, low-opacity glow instead (fill only, no stroke,
`filter: blur(...)`): a bright circle a few px larger than the entry's
own radius for islands (bleeds a little past the coastline rather than
stopping dead at it), a much softer, dimmer version across the whole
region for sections (avoids competing with the islands sitting inside
it). `.v3-island-label`/`.v3-section-label` both have `pointer-events:
none` so hovering the label text itself doesn't block the link/glow
underneath.

Verified with Playwright: 25 real entry hrefs plus 7 section hrefs (one
still blank in the TSV -- `visual-field-notes` -- falls back to `#` the
same way an entry with no href already does), glow opacity transitions
correctly on both island and section hover, zero console errors.

Screenshots: `v3.6.13-island-hover-glow.png`,
`v3.6.13-section-hover-glow.png`.

### v3.6.12 -- header back to a top row, full-bleed sea fixed, smaller section labels, live label-style switcher

v3.6.10's header-overlay experiment (folding the title into the map's
own corner) didn't hold up under actual use: the H1 read too small next
to the map, and the "full-bleed" canvas wasn't actually full-bleed --
`.v3-stage`'s own background (`--v3-sea-deep`, a blue) and the page's
background (`--cab-sea`, a different grey-green) had always been two
different colours, going back to before v3.6.10 even, so the map still
read as a box floating on a mismatched page rather than one continuous
sea.

Reverted the header to a normal top-of-flow row, sized up (2.1rem), with
a new descriptive tagline; matched the page background to
`--v3-sea-deep` so the canvas edge actually disappears into the page.
Reverting the overlay let the growth-obstacle mechanism v3.6.10 added
specifically to keep the map from growing underneath the overlaid header
come back out of `cabinet-v3-layout.js` entirely -- a header back in
normal document flow just pushes `.v3-stage-wrap` down, and
`resolveCanvasDimensions()` already reads wherever that element actually
starts, so no bookkeeping is needed for it any more.

Also: section-name labels (`computeSectionLabel()`) were sized for a
different, larger role than they ended up playing next to the entry
islands' own 13px labels -- dropped base/floor from 22/12px to 16/10px.

Island-label legibility (the halo behind each label, needed because the
land under it isn't one flat colour) got a live-switchable "Label style"
control in the dev panel instead of a single guessed CSS value -- three
additional pure-CSS variants (thin stroke / soft glow / plain) alongside
the original hard 3px stroke, toggled via a `data-label-style` attribute
on `<body>`, no re-render needed. Built this way specifically because
rendered artifacts in this prototype can't be judged by feel from the
code alone -- no default has been chosen yet; "halo" ships as the
fallback only because it was first, not because it's the pick.

Screenshots: `v3.6.12-header-top-fullbleed.png`,
`v3.6.12-label-style-glow.png`.

### v3.6.11 -- extraCount moves onto the TSV, coming-soon stubs removed

Reviewed the flowchart put together for this codebase (see the artifact
in this conversation) file by file; two things stood out on
`cabinet-v3-extras-config.js` specifically. First: it was a standalone
hand-authored JS object holding per-section data, sitting outside the
real content pipeline (`content/*.tsv` -> `tools/build-cabinet-content.js`
-> `docs/assets/js/cabinet-generated-content.js`) that everything else
already goes through -- its own top comment even called this out as a
deliberate stand-in for a real TSV column, "obviously portable to it
later." Second: its `comingSoon` mechanism (anonymous, unlinked dashed
stub circles) had been fully dormant (`comingSoon: 0` everywhere) since
v3.3, and turned out to duplicate something that already exists: a real
entry with `status: "wip"` already renders as a real, linked circle with
the same dashed status ring (`isMuted` in `cabinet-v3-layout.js`) --
exactly how the two production landing pages (`docs/assets/js/
cabinet-render.js`) already express "not live yet," confirmed by reading
that file directly rather than from memory.

**Moved, not just deleted.** `extraCount` is now an optional column on
`content/cabinet-sections.tsv` (the 7 existing sections got their
current hand-tuned values written in explicitly; a blank cell for a
future section falls back to a deterministic per-section-id hash, 1-3 --
`defaultExtraCount()`, ported into `tools/build-cabinet-content.js`
essentially unchanged from the old `defaultExtrasFor()`). `EXTRA_WEIGHT`
(the fixed sizing weight every extra circle gets) moved to
`cabinet-v3-data.js`'s `v3Config` instead, alongside its other render-time
tuning knobs -- it's read live on every `render()`, unlike `extraCount`,
which is now resolved once, at content-build time, so the two constants
ended up in different files on purpose, not by oversight. Deciding where
each piece belonged, and confirming `comingSoon` had a real production
precedent rather than assuming, happened in conversation before any code
was touched, per the standing "tell me the cost before executing"
preference -- see `discuss_before_executing` in this assistant's own
memory notes for why that matters here specifically.

**The one consequence that wasn't part of the discussion:** deleting
`cabinet-v3-extras-config.js` broke `archive/v3.6/layout.js`, which
imported it live, one directory up, by that archive's own documented
design ("algorithm modules are NOT pinned"). Caught before committing,
not after -- `archive/v3.6/` now keeps its own frozen copy
(`archive/v3.6/extras-config.js`, byte-identical to the deleted file)
rather than depending on something that no longer exists, consistent
with how that folder already pins `config.js`/`content.js`.

**Verification.** `node --check` on every touched module; a throwaway
Playwright script (`_verify-extras.mjs`, written/run/deleted, per this
project's own convention) loaded `islands-tool.html` for real and
confirmed zero console/page errors and zero leftover coming-soon stub
elements; a second pass temporarily logged each section's resolved
`extraCount` during a real `render()` and confirmed all seven values
(`2, 2, 3, 2, 3, 2, 1`) exactly match what `cabinet-v3-extras-config.js`
used to hand-author, before the instrumentation was removed again.

### v3.6.10 -- full-bleed canvas + header overlay (punch-list items 12, 13), item 9 investigated

Three things, one pass: items 12 and 13 done together (explicitly linked
by the user -- "this may tie into 12 as well" -- since folding the header
into the map changes how much viewport height the canvas has to fill),
plus a direct, measured answer to item 9 (see the punch list entry
above for the finding itself).

**The canvas-expansion question, answered before building anything.**
Asked directly what the actual mechanism/condition for "expanding" the
canvas was, and whether it would respond to different desktop window
shapes (4:3, a dragged/resized window) -- not guessed at. Previously:
`v3Config.canvas.width` was a hardcoded 1200px constant; canvas HEIGHT
was derived from total content weight; the SVG scaled via CSS
`width:100%` to fill its container's width, with `height:auto` following
the viewBox's own fixed aspect ratio. This meant the map already scaled
(got bigger/smaller) as a window resized, but its SHAPE never adapted --
a widescreen window and a tall narrow one got the identical rectangle,
just rendered at different sizes, leaving unused space or requiring
scroll depending on how far the window's real aspect ratio diverged from
whatever the content happened to produce.

**The fix: solve width AND height together, once, from the real
viewport.** `resolveCanvasDimensions()` (`cabinet-v3-layout.js`) keeps
canvas AREA exactly as before (content-weight-driven, `areaPerWeightUnit`
untouched) but now solves for a SHAPE matching the actual available
space's aspect ratio, measured directly from the DOM (`.v3-stage-wrap`'s
own content width, and the viewport height remaining below wherever it
actually starts) rather than assumed. `width * height = area` and
`height / width = availHeight / availWidth` gives `width = sqrt(area /
aspect)`. This reshapes the treemap's own starting rectangle to the
window's shape BEFORE `squarify()` ever runs, so a portrait window
genuinely gets a portrait-shaped map (verified: viewBox aspect ratio
0.526 at 1920x1000, 0.745 at 1024x768 (4:3), 1.480 at 800x1200
(narrow/tall) -- three distinctly different shapes from the same
content). `v3Config.canvas.width` became `minWidth`/`minHeight` --
safety floors only, not the actual size any more.

**Still not live-resize-reactive, by design, unchanged from before.**
This is baked ONCE at `render()` time (page load), same "no resize
listener" principle as always (see this file's top-of-file comment on
why, and fffx's contrasting live-field approach). Dragging the window
narrower after load still just uniformly CSS-scales the already-baked
shape -- only the INITIAL shape adapts to viewport now, not every
subsequent resize. Flagged explicitly as the answer to "will it be
responsive to a dragged window": scale, yes (always was); reshape on
drag, no (would need a resize listener + full re-render, a bigger,
different ask that wasn't part of this request).

**Header: CSS-repositioned, not moved into SVG -- reverted an
overcorrection mid-pass.** First attempt drew the title/tagline as
actual SVG `<text>` elements inside `render()`'s output, removing the
HTML `<header>` entirely. Caught before finishing: this loses real
semantic structure (no `<h1>` in the accessibility tree) and, on
`islands-tool.html` specifically (which has no static build, unlike
`index.html`), makes the text dependent on JS execution to exist at all
for a crawler. Corrected per direct clarification ("I merely imagined
repositioning the header and text through CSS magic, not restructure
things"): the real, unchanged `<h1>`/`<p>` stays real HTML,
`position: absolute` over the canvas's own top-left corner (new
`.v3-canvas-wrap` positioning context) instead of sitting in normal flow
above it. Since the header no longer exists in the SVG's own coordinate
system, the layout algorithm has no built-in awareness of it -- fixed by
measuring its REAL rendered footprint (`getBoundingClientRect()`, not
guessed) and registering it as one more growth obstacle in `render()`,
exactly the mechanism every section's own label band already uses, so
circles simply don't grow underneath it. Verified directly (not just
eyeballed): a corrected AABB overlap test (first draft of the test
itself was wrong, caught and fixed) found 0-1 stale/edge-case overlaps
out of 37 circles across three window shapes -- confirmed visually clean
in the screenshots, consistent with expected sub-pixel/stroke-width
measurement noise, not a real collision.

**`build-render.html` needed the header too, for a subtle reason.**
The static build (`build-static.mjs`) captures `#v3-stage`'s markup from
`build-render.html`, a headless page that previously had no `.v3-header`
at all ("irrelevant to what gets captured" -- true before this pass, no
longer true after). Since the header's footprint and the viewport's
available height now both feed directly into what gets computed/drawn,
capturing without a header would bake a shape and obstacle placement
that doesn't match what `index.html` actually ships with. Added the same
header markup there (never itself captured -- only `#v3-stage`'s own
outerHTML is extracted) so the capture environment matches production.
Also pinned an explicit Playwright viewport (1440x900) for the build,
replacing an implicit default -- the baked static shape is now a
deliberate choice, not whatever Playwright happens to default to.

**Verified:** across three window shapes (1920x1000, 1024x768, 800x1200)
via Playwright -- viewBox aspect ratio genuinely differs per shape (see
above), zero console errors, near-zero header/circle overlap. Static
`index.html` re-verified with JavaScript entirely disabled: viewBox
present and shaped correctly, 25 real `<a href>` links, 0 `<script>`
tags -- confirmed directly (not assumed) when a separate question came
up mid-pass about whether the site's actual navigation links are
crawler-friendly (they are -- baked as static markup at build time, same
mechanism since v3.6.2, unrelated to and unaffected by the header
question above). Screenshots: `dev-screenshots/v3.6.10-fullbleed-wide-
1920x1000.png`, `-4-3-1024x768.png`, `-narrow-tall-800x1200.png`,
`-static-index-jsdisabled.png`.

### v3.6.9 -- panel restructure into collapsible sections, topological-offset sliders, a real bug fix

Direct follow-up to using v3.6.8's new controls: "in the preset look,
Wave contour shows waves and topology i.e. BOTH, Colour bands show ONLY
sea topology but land is flat green, BOTH shows sea topology AND wave
contours, but land is still flat" -- a real bug, not a request -- plus a
request to restructure the whole panel now that it's "fast becoming a
properly complex tool."

**Bug: stale elements from the inactive `flatColourMode` branch never
got removed.** `drawIslandsPath()` (`cabinet-v3-layout.js`) only ever
created/updated the elements for whichever branch was currently active
(flat land, or sea/sand/veg bands) -- it never removed the other
branch's elements, so live-toggling `flatColourMode` via
`retraceIslands()` accumulated leftovers: switch away from flat mode and
the old opaque flat-land path stays, painted on top of the freshly-drawn
bands, hiding them; switch back and the old bands (never removed either)
reappear underneath the new flat fill. This never showed up before
v3.6.8 because `flatColourMode` had only ever been a hand-edited config
value, toggled via a full page reload (`render()`, which clears the
whole stage first) -- the live in-place toggle path this bug lives in
didn't exist until the preset switcher did. Fixed by giving
`flatColourMode`'s two branches the same discipline `showWaveRings`
already had: every group (sea-band, sand-band, veg-band) now passes
through `placeBand()`'s existing empty-list pruning instead of being
skipped outright, and the one non-array element (the flat-land path) is
explicitly removed when the other branch is active, since `placeBand()`
has no equivalent for a single element. Verified with a Playwright
script (`_verify-controls.mjs`, throwaway, deleted after use) that
counts each element class after cycling bands-only -> waves-only ->
both, asserting zero stale elements at every step, not just eyeballing a
screenshot -- 6/6 assertions pass, 0 console errors. Screenshots:
`dev-screenshots/v3.6.9-colour-bands-only.png`,
`v3.6.9-wave-contours-only.png`, `v3.6.9-both-checked.png`.

**Panel restructure** (`cabinet-v3-controls.js`, `cabinet-v3-style.css`):
three collapsible `<details>`/`<summary>` sections (no custom open/close
JS -- native behaviour handles independent collapse for free), ordered
by how deep into the pipeline each one reaches, deepest at the bottom
per explicit direction:

- **Visuals** (top, open by default) -- the shallowest section, pure
  rendering-layer toggles. The old three fixed preset buttons (Wave
  contours / Colour bands / Both) are replaced by two independent
  checkboxes (`showWaveRings`, `!flatColourMode`) -- covers the same
  three combinations plus a fourth the buttons couldn't reach (neither
  checked: flat land, no rings at all), with no "which preset is active"
  bookkeeping needed. Also gains **topological offset parameters**
  (punch-list item 7): one slider per `seaBandThresholds`/
  `sandThresholds`/`vegThresholds` element (8 total, indices read from
  each array's live length rather than hardcoded), previously
  hand-edit-only.
- **Island shape** (middle, collapsed by default) -- the existing
  warp/angular/base-coastline sliders, unchanged in content, just moved
  into their own section.
- **Layout** (bottom, collapsed by default) -- center-bias slider +
  Reroll positions button (from v3.6.8) plus a new **Restore position**
  button, pulled out of what used to be the single global Reset (does
  exactly what that used to do: `centerBias` back to its panel-load
  value, reroll nonce back to 0).

Each section gets its own Reset (Reset visuals / Reset shape / Restore
position), restoring only what that section can change. Each reset
function touches state only (config fields + each widget's `.refresh()`)
and never calls `retraceIslands()`/`render()` itself -- that's left to
the caller, so a section's own Reset can take the cheap `retraceIslands()`
path while the footer's Reset ALL runs all three restores back to back
and pays for a single `render()` at the end rather than three separate
re-renders. A shared `buildSlider()` helper
replaced what used to be three near-duplicate slider-row-building blocks
(the original `CONTROLS` array loop, the wave-ring generator, and now
the band-threshold sliders) -- each returns a `refresh()` handle so
every Reset button can pull its own widgets back in sync without
re-deriving the DOM.

One correctness note carried over from `visualsDefaults`' own snapshot:
array-valued config fields (`seaBandThresholds` etc.) are deep-cloned at
panel-build time, not shallow-copied -- the new band sliders replace
their array wholesale on every input (`array.map(...)`, never an
in-place index write), specifically so a shallow `{...v3Config.island}`
snapshot can't end up aliasing the same array object a slider later
mutates, which would have silently corrupted what Reset restores to.

### v3.6.8 -- islands-tool packing controls (reroll, center-bias) + preset-look switcher

Three items off the punch list (items 5, 6, 8), direct follow-up to
"add the controls to reroll circle centres, to control centre-bias, as
well as switching between preset looks -- starting with its cost
complexity analysis." See `conversation-landing-page-v3.md` for the
full session log.

**Cost/complexity analysis (asked for explicitly, before building the
preset switcher):** measured directly (`_time-repack.mjs`, throwaway,
deleted after use) against the real 25-entry content, not guessed.
Repack (treemap + scatter + global growth) costs ~1-3ms -- negligible.
The real cost is the island retrace (heightmap build + marching
squares), ~70-100ms, already the price every existing shape-tuning
slider in this panel pays per `input` tick. Two tiers fell out of this:
switching among effects that already exist (wave rings, colour bands,
both) needs no new rendering code, just two config flags feeding the
existing retrace path -- cheap, built now. Further look-and-feel
presets beyond that (the punch list's own example: a "medieval map"
preset layering an illuminated-manuscript treatment on top) would need
genuinely new rendering code for a treatment that isn't designed yet --
cost is unknown until that design happens, so it's scoped out of this
pass rather than estimated blindly.

**Packing controls** (`cabinet-v3-layout.js` exports `render()` and two
new wrappers): `render()` -- previously module-private, called once at
load -- is now exported directly, since both new controls change what
`buildSeedsForSection()` scatters, not just island-shape tuning, so
`retraceIslands()`'s cached-packing shortcut doesn't apply to either.

- **Center bias** -- a slider (1-4, matching `v3Config.pack.centerBias`'s
  existing range) that mutates the live config value and calls
  `render()` on every tick.
- **Reroll positions** -- a button (not a slider: "try a different
  random layout" has no meaningful in-between value). New module-level
  `rerollNonce` in `cabinet-v3-layout.js`, folded into each section's
  scatter seed (`sectionSeed()`) only when nonzero, so `index.html` and
  `archive/` (neither loads `cabinet-v3-controls.js`) are provably
  unaffected. `rerollPacking()` draws a fresh `Math.random()`-derived
  nonce (not incremented) so two consecutive rerolls can't land back on
  the same value and look like nothing happened -- still fully
  deterministic *after* the roll, only the moment of picking one is
  random, same "randomness only at the one genuinely interactive edge"
  rule `warpOffset()`'s own seed already follows.
- The panel's Reset button now also restores `centerBias` and calls the
  new `resetReroll()` (nonce back to 0), on top of what it already
  restored.

**Preset-look switcher** (`cabinet-v3-controls.js`, three buttons: Wave
contours / Colour bands / Both): built entirely from config flags that
already existed or were trivial to add -- `flatColourMode` (v3.6.6) plus
a new `showWaveRings` boolean (`v3Config.island`, default `true`).
`showWaveRings` exists *specifically* so a preset can turn wave rings
off without touching `waveDistances`' own values, which stay owned by
the Wave-rings generator panel (v3.6.7) -- clearing the array directly
would have gone stale the moment that panel's own sliders were touched
again. `drawIslandsPath()` (`cabinet-v3-layout.js`) passes an empty
level list to `placeBand()` when off rather than skipping the call
outright, so stale `.v3-wave-ring-N` elements from a previous
rings-on retrace still get pruned by `placeBand()`'s own cleanup.
Switching presets calls `retraceIslands()` only (no repack) -- cheap,
per the analysis above. Buttons highlight to show which preset (if any)
the live config currently matches.

Addresses punch-list items 5 (reroll control), 8 (centerBias now has a
live control instead of only a hand-edited config value -- actual
tuning of how far to push it is still an open call, not resolved by
building the control), and the *tier-1* portion of item 6 (switching
among existing effects); the tier-2 portion (further whole-look
presets) is carried forward as its own open item, now with the above
cost analysis attached instead of an unknown.

### v3.6.7 -- wave-ring generator panel, edge-padding fix, flatColourMode land fill

Undocumented at the time (no changelog entry was written for this
version -- caught while writing the v3.6.8 entry above, noted here so
the version trail stays honest). Reconstructed from code comments dated
v3.6.7: `islands-tool.html`'s "Wave rings" generator panel
(`cabinet-v3-controls.js`, count/start/multiplier/offset sliders driving
`distance[i] = start * multiplier^i + offset`); `drawIslandsPath()`
(`cabinet-v3-layout.js`) sampling the heightmap/distance-field over a
padded area past the visible canvas so shapes close naturally off-screen
instead of flattening at the true grid border; and `.v3-islands-land-flat`
(`cabinet-v3-style.css`), `flatColourMode`'s single opaque land fill.

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

### v3.6.6 -- fixed-distance wave rings, centroid-pull scatter, flatColourMode

Four items, same visual-polish pass.

**Fixed-distance wave rings** -- the real "wave" effect deferred back at
v3.6.4/v3.6.5: every band up to this point traces a LEVEL of the noise
heightmap, which is not a fixed real-world distance from the coastline.
New `buildCoastlineDistanceField()` in `cabinet-v3-islandshape.js`: an
exact two-pass Euclidean distance transform (Felzenszwalt & Huttenlocher,
not a chamfer approximation) off the same land/water split, negated so
it drops straight into the existing `traceContourFromHeightmap()`
unchanged. Verified against a brute-force nearest-seed reference on a
synthetic grid before wiring it in (0 error). `v3Config.island.waveDistances`
(real px now, not noise levels) renders as `.v3-wave-ring-N`, stroked,
darker/heavier than v3.6.4's rings (`--cab-ink` not `--cab-ink-soft`,
varying stroke-width as well as opacity so rings differentiate by both,
not opacity alone). `islands-tool.html`'s panel gained a "Wave rings"
section (`cabinet-v3-controls.js`) -- count (2-5) / start / multiplier /
offset sliders driving `distance[i] = start * multiplier^i + offset`,
since the array doesn't fit the panel's one-slider-one-key model.
Interactively tuned to count=3, start=2, multiplier=2.7, offset=4 ->
`[6, 9.4, 18.58]`.

**Two edge bugs found and fixed against real content, not the isolated
test grid the distance transform was first verified on:**
1. A wave ring near an island close to the canvas edge could reach the
   grid's true border, trace as an OPEN chain, and get silently pushed
   as if closed -- the SVG path's implicit final `Z` then drew a
   straight line from wherever the chain ended back to wherever it
   started, often clear across the canvas to an unrelated contour.
   Fixed by forcing the distance field's border to a value no realistic
   `waveDistances` entry reaches, same pattern `buildIslandHeightmap`
   already used for `H`.
2. That fix traded one artifact for another: forcing the border FLAT
   also means any shape that should naturally continue past the visible
   edge gets artificially squared off right at it, visible as several
   islands (and their wave rings) along the canvas edges. Real fix:
   `drawIslandsPath()` now samples the heightmap/distance-field over a
   PADDED area (`warpStrength` + farthest wave distance + a flat buffer,
   currently ~139px on this canvas) extending past what's visible, so
   shapes close naturally off-screen in the margin -- the outer `<svg>`
   then clips anything past the real (unpadded) `canvasBounds` for free
   (default SVG viewport behaviour), no clip-path needed. The original
   border-forcing stays as a backstop further out; it just never
   visually triggers now. Verified: max point-to-point gap in any
   wave-ring path dropped from several hundred px (the bug) to 40px
   (a normal straight-run simplification). Performance impact of the
   larger grid (~1.6x cells) was negligible -- heightmap build cost is
   dominated by per-circle work, not grid size, and the two full-grid
   passes (distance transform, marching squares) were already cheap.

**Centroid-pull scatter** -- direct request: islands within a section
were spreading uniformly across the whole region rect: `centerBiased()`
in `cabinet-v3-circlepack.js` warps `generateScatterPoints()`'s per-axis
uniform sample toward 0.5 before min-separation rejection runs (so the
existing overlap-safety guarantee is untouched), controlled by
`v3Config.pack.centerBias` (1 = old uniform behaviour; shipped at 1.6).
Verified directly: average scatter-point distance to region center
dropped from 136.3px to 121.5px on a test set at the shipped value.

**flatColourMode** -- direct comparison showed the v3.6.5 colour bands
and the wave rings compete visually rather than combine. Rather than
delete either, `v3Config.island.flatColourMode` (currently `true`) has
`drawIslandsPath()` skip the sea/sand/veg bands entirely in favour of
one flat land fill (`--v3-veg`, also lightened from the v3.6.5 value --
`#8a9b5e` read as too dull) + the plain `.v3-stage` water colour, so the
wave rings can be judged alone -- flip back to `false` to compare again,
nothing about the band config is lost.

Tagged `v3.6.6-wave-contours` at this commit (alongside the existing
`v3.6.5-colour-bands` tag) -- per the same "come back to it" request,
now that these two colour treatments are a real fork to choose between
later rather than a straight progression.

Screenshots of all three states, captured off temporary config edits
(`flatColourMode` toggled, `waveDistances` emptied) then reverted via
`git checkout` so nothing in the shipped config actually moved:
`dev-screenshots/v3.6.6-colour-bands-only.png` (bands, no wave rings),
`v3.6.6-wave-contours.png` (the actual shipped state), and
`v3.6.6-bands-and-waves-combined.png` (both together, the "compete
rather than combine" case flatColourMode exists to avoid).

### v3.6.5 -- stacked-alpha sea/beach/vegetation colour bands

Continuing the visual-polish pass ("better colours for land and sea").
Superseded v3.6.4's ripple rings entirely: those were noise contours
(marching squares off `buildIslandHeightmap`'s own scalar field) doing
duty as a fixed-distance wave effect, which they aren't -- their actual
pixel distance from the coastline varies with local noise/gradient
steepness. Repurposed the same underlying technique (it's the right
tool for depth/beach banding, which plausibly *should* follow the same
terrain noise as the coastline) for two new colour features instead,
and left the real fixed-distance "wave" effect as a separate, not-yet-
built feature (needs an actual distance transform).

Mechanism: `v3Config.island` gained `seaBandThresholds` (4 levels),
`sandThresholds` (2), `vegThresholds` (2) -- each array traced off the
one shared heightmap build, same colour + fixed `fill-opacity` per
group, drawn loosest-threshold (widest reach) first. Because `{h > L}`
is a strict superset of `{h > L'}` whenever `L < L'`, a point near the
coastline sits under every layer in its group (most opacity stacked),
while a point far out sits under few or none -- overlap count creates
the gradient, not per-element hue. Land needed extra care: sea bands
lean on `.v3-stage`'s own opaque dark background for their "far = deep"
end, but land has no such backdrop, so the sand group's opacity is kept
high enough on its own to keep the coastline edge from reading watery.
New local CSS tokens (`cabinet-v3-style.css`, `body.v3-proto`):
`--v3-sea-deep`, `--v3-sea-shallow`, `--v3-sand`, `--v3-veg` --
deliberately not added to the shared `cabinet-tokens.css`, since the
overall colour scheme is still on hold; this is a scoped exception for
bands the user asked for directly.

Performance check (asked directly): timed `buildIslandHeightmap` +
all 9 contour traces directly in Node against a synthetic 25-circle
canvas -- heightmap build ~53ms (unchanged by band count, still built
once), all 9 traces ~48ms total (~5.4ms each, vs ~22ms for the old
4-level setup). ~104ms total for the whole island pass; runs once per
page load or per slider drag on `islands-tool.html`, not per frame --
not a concern at this scale.

Tagged `v3.6.5-colour-bands` at this commit, per explicit request ("hold
this as a version... so one can come back to it") ahead of a likely
future replacement of island colours with a thumbnail or flat fill --
`git checkout v3.6.5-colour-bands -- landing-v3/` restores exactly this
banding setup if that swap doesn't work out.

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
