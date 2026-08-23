// v3 prototype config -- hand-edited, stable tuning values. Mirrors the
// cabinet-data.js / fffx-data.js convention (pure config, no logic, no
// DOM) from the two production landing pages this prototype is meant to
// eventually converge with.
//
// v3.1: canvas sizing and packing tuning reworked alongside the
// growth-based repack (see cabinet-v3-circlepack.js) -- regions were
// coming out far larger than their actual content warranted, because
// height used to be picked by an aspect-band search unrelated to how
// much content existed, and circles were packed loosely then uniformly
// rescaled to fill 86% of whatever region resulted. Both are gone now:
// canvas height is derived directly from total weight (so it grows/
// shrinks with actual content, not a search), and circles grow directly
// in real region coordinates with no separate rescale step.
//
// v3.2: some circles (e.g. Asimov, Student Work) were reading as too
// small even after growth. seedMin/seedMax (a soft range growth then
// built on top of) replaced with minRadius (a hard floor every circle
// gets before growth even starts) + maxWeightExtra (weight-scaled on
// top of that floor) -- two independent knobs instead of one range, so
// "circles too small overall" and "weight not distinguishable enough"
// can be tuned separately.

// v3.6.11 -- weight assigned to every "extra" filler circle (sizing
// only, not content). Deliberately a fixed low value, not randomized or
// per-section, so extras read as consistently smaller/quieter than real
// entries (whose weights run 1-4) without needing their own weight
// field. Read live at render time (cabinet-v3-layout.js), unlike
// extraCount itself -- which now lives on cabinet-sections.tsv and is
// resolved once, at content-build time, by tools/build-cabinet-content.js.
export const EXTRA_WEIGHT = 1;

export const v3Config = {
  // Descriptive metadata -- not currently read by any code (the actual
  // page title/tagline live as real HTML in index.template.html/
  // islands-tool.html/build-render.html's own <header>, not generated
  // from here -- see "Canvas + legend" in Landing-page-notes.2.0.md for
  // why that stayed real HTML, position:absolute over the map via CSS,
  // rather than becoming SVG-drawn text).
  title: "Cabinet of Curiosities",
  subtitle: "Weighted regions, archipelago circle-packing",

  canvas: {
    // v3.6.10 -- floors only, not the canvas's actual size any more.
    // Width/height are now solved together at render() time from the
    // real viewport (resolveCanvasDimensions() in cabinet-v3-layout.js),
    // so the map's own shape adapts to whatever window it loads into
    // instead of always being a fixed 1200px-wide rectangle scaled by
    // CSS. These only bind if the available space is implausibly small
    // (e.g. a dev tool run inside a tiny embedded frame).
    minWidth: 480,
    minHeight: 360,
    // Canvas AREA = (sum of every visible section's weight) x this --
    // i.e. total canvas area scales linearly with total content weight,
    // not a fixed guess; width/height are then solved from that area
    // plus the viewport's own aspect ratio (see resolveCanvasDimensions()).
    // Tuned empirically (rendered + screenshotted, then adjusted) against
    // the real 7-section/25-entry content; revisit if entry count changes
    // a lot.
    areaPerWeightUnit: 9000,
    // Gap between adjacent section regions, inset from the treemap's
    // exact tiling on every side -- purely visual breathing room, not
    // part of the weight-proportional area math itself.
    regionGap: 8,
    // v3.4: a section's weight is clamped up to at least this much
    // *only* for treemap area-allocation purposes (squarify() input) --
    // real per-entry weights, circle sizing, and everything else are
    // unaffected. Without this, `about` (real weight 2, lowest of any
    // section) squarified into a 290x62px sliver, thin enough that even
    // global cross-region growth (v3.3) could only make its own circles
    // functional, not give the section itself comparable visual
    // presence to its neighbours. Chosen as roughly `teaching`/
    // `visual-field-notes`'s real weight (6-7), not the full range up to
    // `fffx`'s 14 -- enough to stop a section from collapsing to a
    // sliver, not enough to erase weight differences among the sections
    // that already have real content. Distorts "region area == actual
    // content weight" for any section at or below this floor; see
    // Landing-page-notes.2.0.md's "About Me" section for the trade-off
    // and the two alternatives not taken.
    minSectionWeight: 5
  },

  pack: {
    // Reading-order banding -- see sortPointsByBandReadingOrder() in
    // cabinet-v3-circlepack.js. A band this tall (as a fraction of the
    // region's own height) groups points into a "row" for ordering
    // purposes without constraining their actual scattered position.
    bandHeightRatio: 0.16,
    // Floor for scatter-point separation -- safeMinSeparation() in
    // cabinet-v3-circlepack.js takes the max of this and a value derived
    // from minRadius/maxWeightExtra/padding, so this only matters if it
    // happens to exceed that derived value; kept as an explicit floor
    // rather than relying entirely on the derived number.
    minSeparation: 14,
    // Hard floor: every circle starts at least this big, before growth
    // and regardless of weight. Raised from an earlier 5px after real
    // entries (Asimov, Student Work) read as too small even post-growth.
    minRadius: 12,
    // Weight-scaled addition on top of minRadius (sqrt-scaled against
    // this section's own weight range -- see packRadiusFor() in
    // cabinet-v3-circlepack.js). Growth itself is weight-blind (every
    // circle grows by the same growStep per pass, exactly like the
    // reference library) -- so weight's influence on *final* size is
    // real (it sets this starting gap, which tends to persist) but
    // secondary to local density; see Landing-page-notes.2.0.md.
    maxWeightExtra: 14,
    // Radius gained per growth pass -- ported directly from
    // CirclePack.js's Bubble.grow() (bubRadius++, i.e. 1 unit/pass).
    growStep: 1,
    // Minimum gap kept between two touching circles (and between a
    // circle and its region's own boundary).
    padding: 6,
    // A circle's radius as a fraction of its region's shorter side --
    // caps any single circle from dominating a sparse region.
    maxRadiusRatio: 0.4,
    // Defensive cap on growth passes -- see growCircles()'s comment for
    // why this shouldn't normally bind.
    maxIterations: 4000,
    // v3.6.6 -- pulls scatter points toward their region's own center
    // before min-separation rejection runs (centerBiased() in
    // cabinet-v3-circlepack.js), so a section's islands cluster tighter
    // together with more open water near the region edges, instead of
    // spreading uniformly across the whole rect. 1 = untouched/uniform
    // (the old behaviour); higher pulls harder toward center. Applied
    // per axis, not radially, so it follows each region's own aspect
    // ratio. A strong value can make min-separation harder to satisfy
    // in a crowded section (more rejected attempts before falling back
    // to the least-bad candidate) -- watch for circles reading closer
    // together than intended if this gets pushed much higher.
    centerBias: 1.6
  },

  // v3.5/v3.6: noise-carved coastlines for the archipelago circles -- see
  // cabinet-v3-islandshape.js. Every circle contributes (noise - radial
  // gradient, angle-modulated, domain-warped) to one shared heightmap,
  // combined via max() so close circles' coastlines can fuse into one
  // landmass; thresholding that heightmap and tracing it with marching
  // squares is what replaces the plain <circle> a growCircles() output
  // would otherwise render as.
  //
  // v3.6.3: kept deliberately comment-free INSIDE the block below, in
  // the same key order islands-tool.html's panel produces -- so the
  // whole block can be replaced by pasting its "Copy config" output
  // directly over everything between the { and }, no hand-editing
  // around comments required. Field-by-field notes (what each value
  // does, why it's set the way it is) live in the ISLAND CONFIG FIELD
  // NOTES comment at the end of this file instead -- same order as
  // below, so "what does the 6th value do" is just "read the 6th note".
  // A pasted value may come back as a decimal (e.g. 0.011764705882352941
  // instead of 1 / 85) -- numerically identical, JS doesn't care which
  // form a number literal is written in, nothing to fix.
  island: {
    // v3.7.11 -- 4 -> 3: direct request for more accurate coastline
    // offsets (wave rings, the coast-hugging bands/shadow below) now that
    // the resolution/speed tradeoff is confirmed build-time-only (see
    // buildCoastlineDistanceField()'s own comment in
    // cabinet-v3-islandshape.js) -- the static index.html page pays
    // nothing for this, only islands-tool.html's live retrace and the
    // one-time `node build-static.mjs` run get slower.
    cellSize: 3,
    noiseScale: 1 / 26,
    octaves: 3,
    lacunarity: 2,
    gain: 0.5,
    noiseAmplitude: 0.38,
    innerFrac: 0.55,
    outerFrac: 1.3,
    gradientStrength: 1.12,
    threshold: -0.62,
    // v3.7.28 -- -1 -> -1.4: direct feedback, "can the -1 limit be
    // extended/applied to a slightly looser noise level, to get more
    // variance in the sea floor." -1 sat right at the edge of what the
    // Sea 1-4 slider range could usefully reach (Sea 4's loosest default,
    // -0.97, was only 0.03 away from the old floor) -- verified
    // empirically (traceContourFromHeightmap() returns a genuinely EMPTY
    // path the instant a level goes past waterLevel, not a gradual
    // fade-out: h can never be recorded below this value, so "H > level"
    // becomes trivially true everywhere once level <= waterLevel, and a
    // uniformly-true field has no crossing left to trace at all -- that's
    // the "blink out" behaviour reported). -1.4 pushes the floor well
    // past every current seaBandThresholds value, leaving real headroom
    // for looser sea-floor levels or wider variance before hitting it
    // again. See field notes below -- still only needs to stay
    // "comfortably below threshold," no other constraint.
    waterLevel: -1.4,
    seed: "cabinet-v3-islands",
    angularStrength: 0.38,
    angularFreqMin: 1.2,
    angularFreqMax: 2.4,
    angularOctaves: 3,
    angularLacunarity: 2,
    angularGain: 0.5,
    angularRidgeMix: 0.36,
    warpStrength: 60,
    warpScale: 1 / 85,
    warpOctaves: 3,
    warpLacunarity: 2,
    warpGain: 0.5,
    // v3.6.5 -- stacked translucent bands off the same heightmap, same
    // colour per group at fixed fill-opacity, drawn loosest-threshold
    // (widest reach) first so overlap count -- not hue -- creates the
    // gradient (see drawIslandsPath() in cabinet-v3-layout.js). Order
    // matters: each array is loose-to-tight, i.e. draw/bottom-to-top order.
    // v3.7.29 -- retuned live against the real site content via the dev
    // panel's now-relative "Topological offset parameters" sliders (see
    // that section's own v3.7.26 comment for the raw<->relative
    // conversion these values are still stored in RAW form despite),
    // then pasted back in via "Copy config": "USe these Topological
    // offset params, other settings are default anyway." Note
    // seaBandThresholds[0] (-1.38) now sits only 0.02 above waterLevel
    // (-1.4) -- deliberately close to that floor, not accidentally past
    // it (see waterLevel's own v3.7.28 comment for what happens if a
    // level crosses it). sandThresholds[0] (-0.66) is also, unusually,
    // slightly LOOSER than threshold (-0.62) -- Land 1 now extends a
    // hair past the coastline into the sea, same as every seaBand level
    // already does; the loose-to-tight nesting property this whole
    // scheme depends on ({H>L} superset of {H>L'} for L<L') doesn't
    // require staying on one named group's "expected" side of the
    // coastline, so this is a valid, live-tuned choice, not a bug.
    seaBandThresholds: [-1.38, -1.04, -0.88, -0.8],
    sandThresholds: [-0.66, -0.22],
    vegThresholds: [-0.06, 0.02],
    // v3.7.28 -- "Land 5," direct request: "a very high contour seen only
    // on some of the islands, a mountain peak of sorts." Own array (not
    // just another vegThresholds entry) because it needs its own colour
    // (--v3-peak, white, cabinet-v3-style.css) distinct from veg's green.
    // 0.13 was the first empirically-picked value, chosen by bisecting
    // the dev panel's own "Land 5" slider against real site content
    // (reading .v3-peak-band's rendered path length at each step) after
    // a synthetic single-circle sample's suggested ~0.2 turned out to hit
    // ZERO real islands -- buildIslandHeightmap() caps h at n - fall, and
    // each circle's OWN realised peak (a per-circle-seeded sample of the
    // shared noise, not a guaranteed climb to noiseAmplitude's 0.38
    // ceiling) varies a lot by actual circle size/seed, not just
    // theoretical amplitude. 0.13 was where real content first showed a
    // modest handful of small caps rather than none (0.16) or nearly
    // every island's whole interior (0.05 turns almost the entire map
    // white). v3.7.29 -- nudged to 0.14 by further live tuning ("Copy
    // config" pasted back in) -- same reasoning, just one more notch up.
    peakThresholds: [0.14],
    // v3.6.6 -- the actual "wave" effect (see cabinet-v3-islandshape.js's
    // buildCoastlineDistanceField()): genuine fixed pixel distances from
    // the coastline, via a Euclidean distance transform, NOT another
    // noise-heightmap threshold like every array above. Nearest first.
    // count=3, start=2, multiplier=2.7, offset=4 -- tuned via
    // islands-tool.html's "Wave rings" panel (v3.6.7).
    waveDistances: [6, 9.4, 18.58],
    // v3.6.8 -- independent on/off switch for the wave-ring layer, so the
    // three "preset look" combinations (waves only / bands only / both --
    // see islands-tool.html's Preset look panel) can be reached without
    // ever clearing waveDistances itself (which would desync from the
    // Wave rings generator's own count/start/multiplier/offset sliders --
    // see cabinet-v3-controls.js). true = render waveDistances as before.
    showWaveRings: true,
    // v3.6.7 -- the depth/beach/vegetation bands and the wave rings read
    // as visually competing effects together, per direct comparison.
    // true skips all seaBandThresholds/sandThresholds/vegThresholds
    // rendering in favour of one flat land colour + the plain .v3-stage
    // water colour, so the wave rings can be judged on their own -- see
    // drawIslandsPath() in cabinet-v3-layout.js. Toggle back to false
    // to compare again later; nothing about the band config above is
    // lost by flipping this.
    flatColourMode: true,
    // v3.7.9 -- coast-hugging colour fade, independent of flatColourMode
    // (an overlay on top of whichever base fill is active, not an
    // alternative to it -- see drawIslandsPath()'s own comment in
    // cabinet-v3-layout.js for why this pair is separate from
    // seaBandThresholds/sandThresholds/vegThresholds above). Tight, true
    // fixed-pixel offsets off the real coastline via
    // buildCoastlineDistanceField()/buildInlandDistanceField(), same
    // mechanism as waveDistances, NOT another noise threshold -- direct
    // instruction: "Both bands, inward and outward, follow coastline
    // offset not topology." Empty either array to turn that side off.
    //
    // v3.7.11 -- shrunk from [6, 14, 24]: direct feedback -- "why does
    // each wave ring have it's own shadow band?" The old reach (out to
    // 24px) ran past waveDistances' 2nd ring (9.4px) and close to its
    // 3rd (18.58px), so each ring picked up its own nearby band step,
    // reading as if every wave ring had a shadow paired to it instead of
    // one fade hugging just the coast. Now fully faded out by 7px --
    // clear of ring 2, well clear of ring 3 ("a little bit starting from
    // the coast and fading outwards before the 2nd or certainly the 3rd
    // wave contour").
    // v3.7.21 -- independent on/off switch for the pair above, same
    // "empty-list vs. boolean" split showWaveRings already established
    // (see its own v3.6.8 comment): distances stay intact on toggle-off,
    // so turning it back on doesn't lose whatever's been tuned. Direct
    // request: "give me a toggle for the coastal bands and sea shadows."
    showCoastalBands: true,
    coastOutwardBandDistances: [2, 4, 7],
    coastInwardBandDistances: [2, 4, 7],
    // v3.7.10 -- the actual active shadow: all-around (radially
    // symmetric), same coastline-offset mechanism (traceOutward,
    // drawIslandsPath()) as coastOutwardBandDistances just above, painted
    // black instead of --v3-sea-shallow -- see that function's comment.
    // Direct feedback: the earlier directional version made islands
    // "look like straight cliffs rising from the sea."
    // v3.7.11 -- shrunk from [4, 9, 16, 26] for the same reason as
    // coastOutwardBandDistances just above -- see that comment.
    // v3.7.13 -- widened again: direct feedback -- "too narrow too light
    // and aligns exactly with the first wave contour." [2,4,7] topped out
    // right next to waveDistances[0] (6), so the shadow's fade-out edge
    // read as locked to that ring. Wider reach (11), one more step for a
    // smoother taper rather than a bigger single jump, and deliberately
    // NOT sharing any value with waveDistances ([6, 9.4, 18.58]) so the
    // two don't coincide again. Darkness itself comes from
    // .v3-sea-shadow-radial's higher fill-opacity (cabinet-v3-style.css),
    // not from these distances.
    // v3.7.21 -- independent on/off switch, same pattern as
    // showCoastalBands just above.
    showSeaShadow: true,
    seaRadialShadowDistances: [2.5, 5, 8, 11],
    // v3.7.24 -- which sea-shadow shape drawIslandsPath() renders when
    // showSeaShadow is on: "radial" (the all-around coastline-offset
    // band above, every theme's default) or "directional" (translated,
    // tapering copies of the terrain's own nested contour levels, angled
    // toward seaShadowAngleDeg below -- see that function's own comment).
    // Set per-theme via THEME_PRESETS (cabinet-v3-controls.js), not
    // edited here directly -- this default ("radial") only matters for
    // whichever theme is active before the user ever touches the Theme
    // dropdown (Medieval Map, the tool's own default theme).
    seaShadowStyle: "radial",
    // Angle convention matches drawGeoGrid()'s diagonals: 0=E, 90=S,
    // 180=W, 270=N, clockwise (SVG y grows downward) -- 135 = shadow cast
    // toward SW = light from NE. Shared by both shadow styles above,
    // though only "directional" actually uses a single fixed angle (the
    // radial style is, by definition, angle-independent).
    seaShadowAngleDeg: 135,
    // v3.7.28 -- dev-only visualisation of buildIslandHeightmap()'s own H
    // field (drawIslandNoiseDebug(), cabinet-v3-layout.js) -- same
    // "tint a grid by the raw field value" treatment flow.showPotential
    // already uses for the current's potential field. Direct request:
    // "can the underlying noise that make the islands and topo be made
    // visible on toggle." Off by default -- a tuning aid, not part of
    // the shipped visual, same as every other Diagnostics toggle
    // (cabinet-v3-controls.js).
    showNoise: false
  },

  // v3.6.16 -- precomputed vector flow field (currents), see
  // cabinet-v3-flowfield.js. Two composited layers: a smooth "lazy"
  // base current (curl noise) plus a coast vector derived from the
  // SAME heightmap island renders from -- no separate island geometry.
  // Particle advection isn't built yet; this first slice is the field
  // math plus the two dev-panel debug toggles below, so the field can
  // be judged/tuned by feel before anything animates on top of it. See
  // Landing-page-notes.2.0.md's "Flow field" entry for the design
  // conversation, and the field-notes block below for what each value
  // does and how the defaults were picked.
  flow: {
    cellSize: 24,
    seed: "cabinet-v3-flow",
    potentialScale: 1 / 300,
    octaves: 3,
    lacunarity: 2,
    gain: 0.5,
    // v3.6.18 -- magnitude-only multiplier on the current (not folded
    // into potentialScale/octaves, which shape frequency/texture, not
    // overall energy) -- see currentGain's field notes below for why
    // open water needed this, not just a higher particle speed floor.
    currentGain: 16,
    // v3.6.18 -- world px/sec the current's own sample position drifts
    // over real time; the coast vector never drifts (islands don't
    // move). See createFlowSampler()'s doc comment in
    // cabinet-v3-flowfield.js for why this exists at all: without it, a
    // particle that wanders near a curl-noise vortex centre orbits it
    // forever in a perfectly static field.
    driftSpeedX: 5,
    driftSpeedY: 4,
    // v3.6.19 -- constant (never time-varying) prevailing-current term --
    // "the general current goes somewhere, with local variation on top."
    // biasDirX/Y is a direction (not required to be unit length --
    // 1/sqrt(2) each here for northeast in screen space: +x is east, -y
    // is north). Also the tie-breaker for coastMix's tangent handedness
    // below -- see that field's own note for why.
    biasDirX: 0.7071,
    biasDirY: -0.7071,
    // v3.6.20 -- pulled back 0.05->0.03: direct feedback was the NE lean
    // read as "migrating" rather than "wandering," having flattened out
    // the swirl's own local variation at the larger scale. Only the
    // MAGNITUDE moved; biasDirX/Y itself (the actual direction) is
    // unchanged, and that's the only part coastMix's tangent-handedness
    // tie-breaker below reads -- so the narrow-channel fix is untouched
    // by this change, structurally, not just by luck.
    biasStrength: 0.03,
    // v3.6.20 -- pulled back 0.65->0.55 (more repulsion, less tangential
    // slide): direct feedback was particles "intruding along coastlines
    // in parallel" and crossing narrow fingers of land, i.e. riding too
    // close to the edge instead of standing off it.
    coastMix: 0.55,
    coastStrength: 3,
    // v3.6.20 -- how far (world px) and how fast (rad/sec) the TANGENT
    // half of the coast vector's own heightmap sample orbits around the
    // particle's true position (repulsion never moves -- see the long
    // comment in createFlowSampler()'s vectorAt() for why). Fixes
    // persistent trapping in narrow pinches/bays: rot90(gradient) is
    // divergence-free like curl noise, so a purely static tangent has
    // its own permanent vortices in tight/concave geometry, same
    // mechanism as driftSpeedX/Y's own bug just on the static half of
    // the field. BOUNDED (sin/cos), not a linear t*speed ramp -- a first
    // attempt used a linear drift and it was a real bug: t only grows
    // for the page's whole lifetime, so the sample position drifted
    // arbitrarily far given enough time, at some point landing well
    // inside the same landmass and reading a "coastline direction" that
    // had nothing to do with the real local edge (reported directly:
    // particles going over more land than before, worse the longer the
    // page had been open). Small relative to heightEps/typical channel
    // width, and the two axes use different frequencies on purpose (not
    // a shared period) so the sample traces an open path, not a fixed
    // loop of its own.
    coastTangentDriftAmpX: 7,
    coastTangentDriftAmpY: 5,
    coastTangentDriftFreqX: 0.29,
    coastTangentDriftFreqY: 0.37,
    // Dev-panel debug toggles (Visuals section) -- off by default, this
    // is a tuning aid, not part of the shipped visual.
    showPotential: false,
    showVectors: false
  },

  // v3.6.17 -- particle advection along v3Config.flow (see
  // cabinet-v3-particles.js). Only ever created/animated by
  // islands-tool.html (cabinet-v3-controls.js starts it) -- static pages
  // (index.html, build-render.html) never call startCurrentAnimation(),
  // so this costs them nothing, not even the DOM elements. See the
  // field-notes block below for how these numbers were picked.
  particles: {
    // v3.6.22 -- 60->130, dialled in live via the dev panel's Base count
    // slider (added this pass specifically so this could be tried by
    // feel rather than guessed) once spawn stagger, the wider spawn arc,
    // and coastal spawn were all in place to support a denser pool
    // without everything reading as more synchronised/uniform.
    count: 130,
    // v3.6.21 -- hard ceiling on click-to-launch growth (see
    // launchBoatAt() in cabinet-v3-layout.js): a click beyond this total
    // is simply ignored. Not a serious/core feature per direct
    // feedback -- priority is bounded, predictable cost over any
    // particular click behaviour. v3.6.22 -- 90->150 alongside the base
    // count bump above (dialled in live the same way, no longer simply
    // count*1.5).
    maxCount: 150,
    // v3.6.22 -- max random delay (seconds) before a freshly-batch-
    // spawned particle starts moving (see createParticlePool()'s own
    // comment in cabinet-v3-particles.js) -- 0 disables staggering
    // entirely. Direct feedback: spawning the whole pool at once made
    // every particle share the same field-phase, reading as a
    // synchronised wave rather than ambient traffic. Harmless to raise/
    // lower by feel -- particles are off-canvas and invisible for the
    // whole delay regardless of its length.
    spawnStaggerMax: 4,
    padding: 40,
    // v3.6.19 -- particles enter from one offscreen arc (south-west,
    // matching flow.biasDirX/Y reversed -- upstream of the prevailing
    // current) instead of scattering uniformly around all 4 sides, then
    // spread out as they cross the canvas. spawnArcFraction is how wide
    // that entry arc is, as a fraction of the whole ring's perimeter --
    // pickSpawnPoint() (cabinet-v3-particles.js) picks UNIFORMLY within
    // it (no extra taper/weighting toward the centre), so this fraction
    // is the whole story on how wide the entry region reads.
    //
    // v3.6.22 -- widened 0.35->0.55. Direct feedback: activity was
    // piling up right at the SW corner, with little reaching the centre/
    // NE and the SE side reading as quiet -- explicitly NOT asking for a
    // uniform spread (still want the SW lean), just a wider one. At this
    // canvas's proportions (wider than tall), 0.55 covers roughly the
    // whole bottom edge, the whole left edge, and a bit of the top edge
    // nearest the NW corner -- the far NE corner and most of the right
    // edge stay clear, keeping the directional lean the request wanted
    // to keep.
    spawnDirX: -0.7071,
    spawnDirY: 0.7071,
    spawnArcFraction: 0.55,
    // v3.6.22 -- fraction of EVERY spawn (initial pool and mid-simulation
    // respawns alike) that lands at a coastal water point instead of the
    // usual off-canvas arc point -- direct request/idea: "coast-killed
    // particles, or any other, can respawn on a coast as well... shore
    // repulsion takes them out." 0 disables it entirely. Picked via
    // pickCoastalSpawnPoint() in cabinet-v3-particles.js (rejection-
    // sampling against isLand(), cheap). Deliberate side benefit: coastal
    // points land wherever islands actually ARE, not funnelled through
    // the SW arc, so this also helps the central/NE-quiet complaint the
    // wider spawnArcFraction above was already addressing. Raised
    // 0.3->0.5 after live comparison via the dev panel.
    coastSpawnFraction: 0.5,
    // v3.6.22 -- initial direction for a coastal spawn: "repulsion" (the
    // exact push straight off the shore, ignoring the current/tangent
    // blend for just that first moment) or anything else (the normal
    // blended-field initialDirection(), same as every other spawn).
    // Compared live via the dev panel: "repulsion is marginally better
    // than blended, but not by much" -- kept as the default since it's
    // still the better of the two, not because the gap was decisive.
    coastSpawnDirMode: "repulsion",
    // v3.6.23 -- demo/comparison build for the "one giant trash drift"
    // discussion (conversation-landing-page-v3.md): every particle
    // otherwise samples the exact same deterministic field, so density
    // alone can't add variety. "off" (default, no change to shipped
    // behaviour) / "bias" (constant personal speed+heading, see
    // personalityFor()'s own comment in cabinet-v3-particles.js) /
    // "offset" (constant personal read-position into the SAME shared
    // current field, never the coast/repulsion half) / "both". Not
    // decided yet -- built specifically to be compared live via the dev
    // panel, same as coastSpawnDirMode above.
    personalityMode: "off",
    // Ranges personalityFor() maps its low-discrepancy sequence into --
    // first-guess demo values, not yet tuned by feel. offsetRange in
    // world px (potentialScale's own wavelength is ~300px, so this stays
    // well under it -- meant to vary WHICH local structure a particle
    // reads, not which large-scale current pattern it's part of).
    personalityOffsetRange: 120,
    personalitySpeedMultMin: 0.75,
    personalitySpeedMultMax: 1.35,
    personalityDirRotateMaxDeg: 25,
    // v3.6.20 -- pulled back across the board (20->13, 1200->800,
    // 110->70): direct feedback was "particles feel too fast," alongside
    // skipping over/through narrow land -- less distance covered per
    // frame gives the coast vector more room to actually turn a particle
    // before it's already past the obstacle. See the field-notes block
    // below for the resulting speed ranges.
    baseSpeed: 13,
    speedGain: 800,
    maxSpeed: 70,
    // v3.6.19 -- cheap safety net: if a particle's net displacement over
    // the last stuckCheckInterval seconds is under stuckThreshold px, it
    // respawns regardless of why it stalled. Backstop for whatever the
    // field-level fixes (coastMix tangent handedness, current time-
    // drift) don't happen to catch -- one distance check per particle
    // per interval, no neighbour/density queries (deliberately not the
    // "close to a bunch of other particles" version of this idea --
    // flagged directly as the expensive one).
    // v3.6.20 -- tightened 2.5->1.8s / 15->12px: a faster backstop for
    // whatever the coastTangentDriftX/Y fix (flow block above) doesn't
    // happen to dissolve fast enough on its own. Still safely clear of a
    // genuinely-moving particle -- even sitting on baseSpeed's 13px/s
    // floor in a straight line, that's ~23px net over 1.8s, well above
    // the 12px trigger.
    stuckCheckInterval: 1.8,
    stuckThreshold: 12,
    // v3.6.20 -- size scale range, multiplying the base rx/ry set in
    // ensureParticles() (cabinet-v3-layout.js). Rolled once per pool
    // SLOT when its <ellipse> is created, not re-rolled on respawn (a
    // DOM-only concern -- position/recycling stays entirely in
    // cabinet-v3-particles.js, this only ever touches attributes layout.js
    // already owns). Direct request: some visual variation instead of
    // every particle reading as the identical stamped shape.
    sizeMin: 0.6,
    sizeMax: 1.8
  },

  // v3.6.24 -- 1-3 independent sea-dragons (dragon.svg's artwork, inlined
  // directly -- see cabinet-v3-layout.js's DRAGON_PATH_D comment for why
  // not <use>/<symbol>), not part of the particle system at all. Each
  // appears once per page load somewhere in open water and wanders from
  // there on its own noise-driven heading, explicitly NOT reading the
  // current field boats ride -- see cabinet-v3-dragon.js. Only ever
  // created by islands-tool.html, same scoping as the particle system.
  dragon: {
    // Target on-canvas WIDTH in px (dragon.svg's own viewBox is
    // 644.68x310.88, ~2.07:1 -- height follows that ratio), for a dragon
    // at sizeMult 1.0. Went 24->48 ("2x bigger"), then pulled back to 36
    // -- "too big" at 48.
    targetWidth: 36,
    // v3.6.24 -- each dragon (1-3, ensureDragon() in cabinet-v3-layout.js
    // picks the count fresh every spawn, never 0) gets its own size
    // multiplier in this range -- direct request: "slightly different
    // sizes."
    sizeMultMin: 0.85,
    sizeMultMax: 1.25,
    // world px/sec -- went 10 -> 15 -> 22. No built-in clamp on this value
    // (unlike particles.maxSpeed) -- raising it further is always possible,
    // but see turnRate below: at 15 it still read as "bobbing in place,"
    // and the real bottleneck turned out to be the heading formula, not
    // the speed scalar itself. Now exceeds particles.baseSpeed (13) --
    // fine, it no longer needs to visually read as slower than the boats,
    // just as clearly traveling.
    speed: 22,
    // v3.6.25 -- heading is a SMOOTH noise stream sampled over time only
    // (fbm2D, see stepDragon()'s own comment in cabinet-v3-dragon.js), not
    // the shared current -- but it now drives an ANGULAR VELOCITY, not an
    // absolute angle. headingNoiseSpeed is how fast the underlying noise
    // stream itself evolves; turnRate scales that noise into rad/sec of
    // turning. Earlier versions mapped noise directly to an absolute
    // heading (headingSwing), which empirically confined the dragon to a
    // narrow ~90-120 degree arc (see stepDragon()'s comment) and read as
    // bobbing in place. Integrating a rate instead lets heading do a slow,
    // smooth walk around the full circle over time.
    //
    // v3.6.25 -- was 0.6, bumped to 0.9. Feedback after the integration
    // fix: some dragons still bob in place for a long stretch, then take
    // off, then bob again after a dive/resurface -- some wander fine,
    // others get stuck. Simulated it (a pure random walk in heading has
    // no restoring bias, so long streaks near a vertical heading -- where
    // sin dominates cos, i.e. mostly-vertical motion -- are an expected,
    // not-fully-avoidable property of this model): at 0.6, a dragon could
    // sit near-vertical for 10-19 seconds before wandering out of it; 0.9
    // trims the worst case to roughly 9-12s without turning the wander
    // into a visible spin. This is a partial mitigation, not a fix -- the
    // "stuck vs. fine" variance across dragons is inherent to how a
    // random-walk heading works, not a bug; a real fix (e.g. a mild
    // restoring bias back toward horizontal) would change the character
    // of the wander enough that it deserves its own before/after look
    // rather than a blind tune.
    headingNoiseSpeed: 0.08,
    turnRate: 0.9,
    // Vertical bob -- render-only (cabinet-v3-layout.js adds
    // sin(bobPhase)*bobAmplitude to the drawn y each frame), never
    // affects the logical wander position/land checks. bobFreq in Hz.
    bobFreq: 0.35,
    bobAmplitude: 4,
    // px kept clear of canvasBounds' edge before a step gets rejected --
    // see stepDragon()'s own comment.
    edgeMargin: 30,
    // v3.6.24/25 -- world px: a spawn/resurface point (and, live, a
    // dragon's own next step) is rejected if land exists within this
    // radius in ANY direction (checked at 8/16 points around a ring, same
    // technique cabinet-v3-particles.js's pickCoastalSpawnPoint() uses,
    // just inverted -- reject NEAR coast instead of requiring it).
    // v3.6.25 -- was 90, dropped to 40. This map is a dense archipelago
    // (dozens of separate small islands, not one landmass), so a 90px
    // OMNIDIRECTIONAL clearance was frequently unsatisfiable -- diagnosed
    // via temporary instrumentation + screenshots: dragons were diving in
    // the middle of visibly wide-open channels because some unrelated
    // island's corner happened to sit within 90px in some other
    // direction, and pickOpenSeaPoint()'s 80-attempt rejection sampling
    // was failing often enough to regularly fall back to pickWaterPoint()
    // (which only guarantees "not literally on land," no distance margin
    // at all) -- that fallback is what caused dives within the first
    // couple frames of page load, right next to a coast. 40 -- close to
    // the dragon's own rendered footprint (targetWidth 36-45px) plus a
    // small buffer -- lets the rejection sampling actually succeed in
    // this map's real channel widths while still keeping dives feeling
    // proportionate to genuine visual proximity.
    minCoastDistance: 40,
    // v3.6.24 -- the dive/resurface cycle is EVENT-triggered (whenever a
    // dragon's wander would bring it within minCoastDistance of a coast,
    // see stepDragon()'s own comment), not on a timer -- direct
    // feedback: "this need not be every 30 sec or so, it can be when the
    // dragon approaches a coast." diveDuration is how long it takes to
    // slide down out of view at the point it turned back from; a fresh
    // pickOpenSeaPoint() is rolled at the bottom of that dive; then it
    // slides back into view over surfaceDuration at the new point.
    diveDuration: 0.6,
    surfaceDuration: 0.6,
    // v3.6.24 -- light fill colours; ensureDragon() shuffles this list
    // and hands each dragon a different one in turn (never repeats,
    // since there are always <= fillColors.length dragons) -- direct
    // request: golden brown, pale blue, violet, "different colours."
    // Outline stays a single fixed dark ink for every dragon regardless
    // of fill -- dragon.svg's own original stroke colour (#2B2A29),
    // reused rather than picked fresh, so the inlined artwork's own line
    // weight/tone carries over.
    fillColors: ["#d9b98a", "#aecbdb", "#c9b3d9"],
    strokeColor: "#2b2a29"
  },

  // v3.7.7 -- lat/long dotted grid + compass diagonals (drawGeoGrid() in
  // cabinet-v3-layout.js). Live-tunable (dev panel: Visuals > Latitude
  // spacing / Longitude spacing, cabinet-v3-controls.js) via the same
  // cheap retraceIslands() path every other island slider already uses.
  // Split into two independent axes rather than one shared spacing --
  // direct request. 120 (not the round 100 it started at, and not 73,
  // its intermediate prime-pitch value) is just the current default;
  // either axis can be retuned live without touching this file.
  // v3.7.8 -- split the single `enabled` flag into two -- direct
  // request: "separate toggles for grid and compass diagonals." Grid
  // (lat/long lines) and diagonals can now be shown/hidden
  // independently.
  geo: {
    // v3.7.16 -- default off: direct request ("default - latlong is
    // off"). Still fully live via the dev-panel toggle, just not the
    // starting state.
    showGrid: false,
    showDiagonals: true,
    latSpacing: 120,
    lonSpacing: 120
  },

  // Theme-preview-on-hover prototype ("theme x hover" to-do item) --
  // parameters of the CROSS-theme transition itself, deliberately kept
  // separate from either theme's own colour tokens (those stay owned by
  // the existing per-theme colour editor/themeTokenState in
  // cabinet-v3-controls.js -- this feature reads them live, doesn't
  // duplicate them). previewTheme names which THEME_OPTIONS key hovering
  // reveals, regardless of whichever theme is currently the page's base
  // -- direct spec was a fixed Medieval-resting / Topology-reveal
  // pairing, but making it a real dropdown costs little and avoids
  // hardcoding "satellite" into the render path.
  themePreview: {
    previewTheme: "satellite",
    // Direct feedback: 20px read as too tight to pick up any surrounding
    // sea; "maybe 40-50px." 45 splits that range, both ends still live
    // via the dev panel.
    islandHaloPx: 45,
    // Independent from islandHaloPx -- a section's preview already reuses
    // traceIsolatedShape() the same way the section glow/hit shape does,
    // but with its OWN halo rather than inheriting the glow's
    // coastalZoneWidth (that value is calibrated for hit-testing/glow,
    // not this feature; the two happening to share a number would be
    // coincidence, not a real coupling).
    sectionHaloPx: 45,
    // Direct feedback: "the edges need to be blurred between the two
    // themes, not a hard outline." Matches .v3-island-glow's own existing
    // blur(6px)/.v3-section-glow's blur(14px) technique -- CSS
    // filter:blur() on a plain unstroked fill, already proven reliable in
    // this codebase for a single non-grouped path (the bug found earlier
    // this project was specific to a GROUP of individually-transformed
    // children, not this shape).
    blurPx: 8
  }
};

// ---------------------------------------------------------------------
// ISLAND CONFIG FIELD NOTES -- one entry per key in v3Config.island
// above, same order. Deliberately kept OUT of the block itself (see the
// comment just above `island: {`) so that block stays a clean paste
// target for islands-tool.html's "Copy config" button.
//
// cellSize -- Grid spacing for the heightmap/marching-squares pass, in
// canvas px. Smaller = smoother coastline + more path points; 4px keeps
// contours visibly faceted (matching the v2 map's own coastline/ripple
// aesthetic, itself a coarse-grid marching-squares trace) at a
// computation cost proportional to circle areas, not canvas area.
//
// noiseScale -- Noise sample frequency: world px per full noise period
// is roughly 1 / noiseScale (so 1/26 ~= a 26px period). Tuned so a
// mid-sized circle's coastline shows several wobbles around its
// circumference, not one broad bulge or fine static.
//
// octaves / lacunarity / gain -- fbm2D's octave count / per-octave
// frequency multiplier / per-octave amplitude decay, for the per-pixel
// edge noise. v3.5.1 tried octaves: 6 (up from 3) to see the effect of
// finer coastal detail in isolation -- reverted, since the added
// octaves' higher-frequency detail falls below what cellSize can
// resolve at trace time, so it cost more compute for a visually
// near-identical result and didn't touch the actual complaint (still
// fundamentally round -- angularStrength/warpStrength below did).
//
// noiseAmplitude -- Multiplies the raw (roughly [-1, 1]) fbm output
// before it's compared against the radial gradient -- the actual
// amplitude of the noise term relative to threshold and
// gradientStrength, all three tuned together (see
// cabinet-v3-islandshape.js).
//
// innerFrac / outerFrac -- Normalized distance from a circle's own
// center (as a fraction of its radius) where the radial falloff starts
// (innerFrac, always land inside this) and ends (outerFrac, always
// water beyond this). The coastline itself lands somewhere in between,
// noise-shifted -- tuned (with threshold/gradientStrength) so the
// average crossing sits close to the circle's own original radius, per
// "most of the circle is the island, the rest is water" -- verified
// empirically (a throwaway Node script), not derived analytically.
//
// gradientStrength -- How steep the radial falloff is between
// innerFrac and outerFrac; tuned together with threshold (next) --
// large enough relative to threshold + noiseAmplitude that outerFrac is
// always reliably water, regardless of noise.
//
// threshold -- Height separating land (> threshold) from water. Sits
// comfortably below noiseAmplitude's own range so the guaranteed-land
// core (innerFrac) is never accidentally carved into water by an
// unlucky noise sample.
//
// waterLevel -- Baseline height for every grid cell no circle's
// influence reaches -- far enough below threshold that open ocean never
// registers as land regardless of noise (noise is never sampled there
// at all, see buildIslandHeightmap's per-circle-bbox-only loop).
//
// seed -- Fixed seed for the whole shared heightmap (not per-section,
// unlike pack's scatter seeding -- there's no natural per-section key
// for a field every section's circles contribute to together).
//
// angularStrength -- How much the falloff radius itself bulges/pinches
// by angle around a circle's own center (angularRadiusScale() in
// cabinet-v3-islandshape.js). 0.4 means the radius can range roughly
// 0.7x-1.3x its base value depending on direction -- noticeably
// lobed/elongated without a circle ever collapsing to a sliver at its
// narrowest angle. Structurally can only ever bulge/pinch a radius,
// never fold the boundary back on itself -- see warpStrength below for
// what actually does that.
//
// angularFreqMin / angularFreqMax -- Range of "loop radius in
// noise-space" a circle's own angular pattern is randomly drawn from
// (see angularRadiusScale()'s doc comment for why a small loop gives
// few broad lobes rather than many small ones). ~1.2-2.4 empirically
// lands around 2-4 lobes per island -- "peninsula and bay" character,
// not a wavy-edged circle and not a starburst either.
//
// angularOctaves / angularLacunarity / angularGain -- Same fbm idea as
// octaves/lacunarity/gain above, just walked around the angular loop
// instead of across the plane (angularFbm() in
// cabinet-v3-islandshape.js) -- deliberately separate knobs, not the
// same values reused, so the angular and edge frequency bands can be
// tuned independently. Added in v3.5.3 because a single octave (v3.5.2)
// produced one smooth wavelength of deformation that still read as "a
// distorted circle," not a coastline -- nothing filled the medium
// frequencies between that broad wobble and the much finer per-pixel
// edge noise.
//
// angularRidgeMix -- Blends the smooth angular fbm (0) with a ridged
// remap of the same underlying samples (1) -- see ridge() in
// cabinet-v3-islandshape.js. Raw noise spends most of its range near 0
// (broad, gently rolling), so ridging (which maps "near 0" to its own
// maximum) turns rare excursions toward the extremes into sharp,
// narrow radius pinches (fjord-like inlets) while leaving everywhere
// else a smooth plateau -- "more extreme jumps" without just inflating
// angularStrength (which only makes existing bulges bigger, not
// sharper). Originally shipped at 0.6 (leaning ridged); interactive
// tuning pulled it back once domain warping (below) started doing more
// of the sharp-feature work itself.
//
// warpStrength / warpScale / warpOctaves / warpLacunarity / warpGain --
// Domain warping (warpOffset() in cabinet-v3-islandshape.js): displaces
// the sample *position* itself before the distance-to-center check
// runs, which is what actually makes concavity (real bays/hooks, not
// just radius bulges) possible -- angularStrength above is structurally
// incapable of that, no matter how extreme. warpStrength: max
// displacement in canvas px. warpScale: like noiseScale above, roughly
// 1/(world px per warp-field period) -- deliberately lower frequency
// than noiseScale's fine edge texture, since a warp fold needs to
// displace a whole stretch of a circle's boundary together to read as a
// bay rather than jitter. Original shipped values (40px / 1/100 period
// / 2 octaves) came from an empirical sweep (strength x period against
// 12 synthetic circles, scored by fraction of rays crossing the
// coastline more than once -- direct proof of a real fold, not just
// texture). Current values are the first real interactive-tuning pass,
// done via islands-tool.html's panel and applied here with its "Copy
// config" button -- see Landing-page-notes.2.0.md's v3.6/v3.6.1
// changelog entries for the full history of both passes.
//
// seaBandThresholds / sandThresholds / vegThresholds -- v3.6.5, replaces
// the single seaShallowThreshold/beachThreshold pair. Each array is a
// stack of full (not ring-clipped) contours off the same heightmap,
// same colour + fixed fill-opacity per group (see cabinet-v3-style.css),
// drawn loose-to-tight (widest reach first/bottom). Because {h > L} is a
// strict superset of {h > L'} whenever L < L', every tighter contour's
// area is guaranteed nested inside every looser one regardless of
// noise -- so a point near the coastline ends up under EVERY layer in
// its group (most opacity stacked = most saturated), while a point far
// out is only under the loosest one or none at all (least stacked =
// closest to whatever's underneath: the dark sea background for water,
// or the tighter group's colour for land). That's what makes shallow
// water read lighter than deep, and the beach/vegetation boundary blend
// instead of hard-cut.
//
// Same caveat as before: these are noise contours, not fixed-distance --
// actual pixel distance from the coastline varies with local noise/
// gradient steepness. Fine here (depth/beach width plausibly follow the
// same terrain noise as the coastline itself) but NOT the same thing as
// the "wave" ripple effect (constant real-world distance from the
// coast) -- that still needs an actual distance transform, not built
// yet. Values are a first guess -- edit by hand and eyeball the result.
//
// showWaveRings -- On/off switch for the wave-ring layer, independent of
// waveDistances' own values (see the inline comment above) -- lets the
// islands-tool "Preset look" buttons (cabinet-v3-controls.js) turn wave
// rings off without touching the tuned array the Wave rings generator
// panel maintains.

// ---------------------------------------------------------------------
// FLOW CONFIG FIELD NOTES -- one entry per key in v3Config.flow above.
//
// cellSize -- Grid spacing for the flow field itself, in canvas px.
// Coarser than island.cellSize (4) on purpose: the field gets bilinear-
// sampled at read time (cabinet-v3-flowfield.js's sample()), and a lazy,
// smooth current doesn't need coastline-trace resolution to look right.
//
// seed -- Fixed seed for the base current's own noise, independent of
// island.seed (the coastline's) -- keeps the current's texture
// decorrelated from the coastline's, same reasoning as warpOffset()'s
// own separate permutation table in cabinet-v3-islandshape.js.
//
// potentialScale -- Noise sample frequency for the current's underlying
// scalar potential: world px per period is roughly 1 / potentialScale
// (so 1/300 ~= a 300px period). Deliberately much lower frequency than
// island.noiseScale's fine coastline texture -- "lazy," broad
// undulation across the whole canvas, not fine detail. Tightened from
// 1/420 at v3.6.18 (more variation across the visible canvas, per
// direct feedback that open water read as too uniform) -- still well
// above island.noiseScale's fine texture, "more varied" is not the same
// ask as "turbulent."
//
// octaves / lacunarity / gain -- Same fbm2D idea as island's own
// octaves/lacunarity/gain. Raised octaves 2->3 at v3.6.18 alongside
// potentialScale, same "more variation" reasoning -- still deliberately
// modest (island's own coastline noise uses the same 3), not "very
// turbulent," per the original design conversation.
//
// currentGain -- v3.6.18. Pure magnitude multiplier on the current's
// curl vector, applied AFTER the gradient/rotation (so it changes
// overall energy without changing potentialScale/octaves' frequency
// shape). Added because open water read as barely-moving: raw current
// magnitude there is tiny (~0.002-0.004) relative to a coastline's
// coast-vector-dominated magnitude (~0.05-0.1), so particles were
// almost entirely riding particles.baseSpeed's own floor, not the
// field's actual variation. Empirically checked (throwaway Node script,
// same method as coastStrength): 16 brings open-water speed to roughly
// 50-70px/s (was ~18-20, i.e. essentially just the floor) while a
// coastline/channel still comes out faster (70-110px/s, maxSpeed-capped)
// -- open water now clearly moving and varying, without erasing the
// "faster near an island" contrast the design conversation asked for.
//
// driftSpeedX / driftSpeedY -- v3.6.18. World px/sec the current's
// potential sampling position drifts over real elapsed time (the coast
// vector never drifts -- see createFlowSampler()'s doc comment in
// cabinet-v3-flowfield.js). Fixes a reported failure mode: "particles go
// into and are trapped... rotating on themselves." Root cause is
// structural, not a bug in the usual sense -- curl noise is
// divergence-free EVERYWHERE, which means it has permanent vortex
// centres around any local extremum of the potential, and a static
// field's vortices trap a particle in a closed orbit forever (confirmed
// directly: sampling the SAME point 20 simulated seconds apart in the
// old, driftless field returned the literal same vector, 0.0 degrees of
// change). Drifting the sample position slowly means any given vortex
// itself drifts and dissolves/reforms elsewhere -- checked at a
// deliberately adversarial point (the exact midpoint between two close
// circles, i.e. a narrow channel) that the vector there rotates ~20-30
// degrees over 20 simulated seconds at these values, i.e. a trap
// dissolves within under a minute rather than persisting indefinitely.
// 5 / 4 (asymmetric on purpose, so the drift itself isn't perfectly
// axis-aligned/diagonal) are both slow relative to potentialScale's own
// ~300px wavelength -- a gentle, ambient "breathing" of the current
// pattern, not a visible scroll.
//
// biasDirX / biasDirY / biasStrength -- v3.6.19. A CONSTANT (never
// time-varying, unlike the curl swirl) prevailing-current term -- "the
// general current goes somewhere, with local variation on top," not a
// directionless eddy field. Direction is northeast in screen space
// (+x east, -y north); magnitude picked empirically (throwaway Node
// script): 0.05 gives open water a real, visible net northeast lean
// while still letting local curl variation show through -- much higher
// and the current starts reading as a straight conveyor belt, which
// isn't what was asked for ("not a straight line but a general
// direction, with lots of local variation"). Also doubles as the
// tie-breaker for coastMix's tangent handedness, next -- it's the one
// direction that's genuinely constant everywhere, which turned out to
// matter.
//
// v3.6.20 -- biasStrength pulled back 0.05->0.03. Direct feedback: the
// NE lean had gotten strong enough that the field read as "migrating"
// rather than "wandering," flattening the local curl variation at the
// larger scale. Only the magnitude changed -- biasDirX/Y (the direction
// itself) is untouched, and that's the only part coastMix's tangent
// tie-breaker below actually reads (a dot-product sign, not a
// magnitude), so the narrow-channel cooperation fix holds at ANY
// biasStrength > 0, structurally, not just at the value it happened to
// be tuned at.
//
// coastMix -- Blends the coast vector between pure repulsion (0, push
// straight off the coast) and pure tangential flow (1, slide along the
// edge instead of just bouncing off it) -- both are rotations of the
// SAME heightmap gradient (see cabinet-v3-flowfield.js), so this is one
// continuous dial, not a choice between two different mechanisms. Which
// of the two possible 90deg rotations counts as "tangential" is chosen
// per-point to align with biasDirX/Y (v3.6.19) -- see the long comment
// in createFlowSampler()'s vectorAt() for why it has to be the constant
// bias and not the local current: at a narrow channel between two
// islands, a fixed rotation gives the two facing coastlines OPPOSING
// along-channel tangents (confirmed as the direct cause of a reported
// bug -- particles clumping specifically in narrow bays), and aligning
// to the local current instead of the constant bias was tried first and
// didn't fix it either -- the swirl's own higher octaves vary enough
// over a channel's width to still disagree between its two walls.
// 0.65 (now 0.55, see below) leans toward edge-following since a
// particle just bouncing straight off every island it nears reads as
// mechanical/repetitive; mostly-tangential motion (with enough
// repulsion mixed in to still actually clear the coast) reads more like
// a real current deflecting around an obstacle.
//
// v3.6.20 -- pulled back 0.65->0.55 (more repulsion, less tangential
// slide). Direct feedback: particles were "intruding along coastlines
// in parallel" and skipping across narrow fingers of land -- i.e. riding
// close enough alongside the edge (0.65's tangential lean) that the
// remaining repulsion share wasn't consistently enough to stand them
// off it, especially where a finger's own width is narrow relative to
// heightEps's smoothing radius. Tuned together with the speed pullback
// below, not in isolation -- slower particles also give whatever
// repulsion IS present more frames to act before a particle's already
// past the obstacle.
//
// coastStrength -- Multiplier on the coast vector itself (independent of
// currentGain, which only scales the current -- see its own note above).
// Empirically checked (a throwaway Node script against real heightmap
// output, not guessed): at 3, the coast vector's own magnitude fades
// from ~0.05-0.1 right at a coastline to ~0 by open water, on its own --
// clearly present near an island without needing a separate falloff-
// shaping function, since the underlying gradient it's built from
// already vanishes far from any coast. How dominant that reads relative
// to the CURRENT depends on currentGain too (v3.6.18 raised the
// current's own baseline a lot, see that note) -- the two are tuned
// together, not coastStrength alone.
//
// showPotential / showVectors -- Dev-panel-only debug toggles (Visuals
// section, cabinet-v3-controls.js): showPotential renders the base
// current's own scalar potential as a tinted grid ("the noise field"),
// showVectors renders the full composite field as arrows ("vector
// directions") -- see drawFlowFieldDebug() in cabinet-v3-layout.js. Both
// off by default; this is how the field gets judged/tuned before any
// particle animation is built on top of it, not a shipped visual.

// ---------------------------------------------------------------------
// PARTICLE CONFIG FIELD NOTES -- one entry per key in v3Config.particles
// above (cabinet-v3-particles.js).
//
// count -- Pool size, fixed for the page's lifetime (particles reset in
// place when recycled, never created/destroyed -- see
// ensureParticles()/tickParticles() in cabinet-v3-layout.js, avoids DOM
// churn). 60 is a first-guess density: enough to read as an ambient
// current across the whole canvas without turning into visual noise
// competing with the islands/labels. Retune by eye.
//
// padding -- How far outside canvasBounds a particle spawns/despawns, in
// canvas px. Independent of drawIslandsPath()'s own edgePadding (a
// different concept -- that one sizes the marching-squares sampling
// grid so contours close cleanly off-screen); this one is purely about
// where "off-canvas" starts for entry/exit staging. Small on purpose --
// just enough that a particle's pop-in/pop-out isn't visible at the
// canvas edge, not a large buffer.
//
// spawnDirX / spawnDirY / spawnArcFraction -- v3.6.19. Direct request:
// "particles need to start from one offscreen area and spread out"
// rather than scattering uniformly around all 4 sides. spawnDirX/Y
// points south-west -- upstream of flow.biasDirX/Y (the prevailing
// current), reversed, so particles enter from where the current is
// coming FROM and drift out roughly where it's headed. spawnArcFraction
// (0.35) is how wide the entry zone is as a fraction of the whole ring's
// perimeter -- wide enough to read as "an area," not a single pinhole,
// while still clearly clustered on one side rather than uniform.
//
// baseSpeed / speedGain / maxSpeed -- Speed (px/sec) is direction-
// independent: a particle always moves exactly where the flow field
// points, but how FAST is a clamped function of the field's raw
// magnitude at that point, not directly proportional to it. baseSpeed is
// a floor (a particle never goes fully still, even where the field
// briefly near-cancels); speedGain scales the magnitude into a visible
// speed-up; maxSpeed caps it -- direct proportionality would make
// coastal/channel particles look like they're darting at jet speed
// relative to open water.
//
// v3.6.18 -- retuned alongside currentGain (see that note in the flow
// block above): baseSpeed 15->20, speedGain 2000->1200, maxSpeed 90->110.
// Direct feedback was that open water read as basically dead and
// particles could get stuck orbiting in place indefinitely (the second
// part fixed structurally by driftSpeedX/Y, not by these numbers) --
// once currentGain made open water's own raw magnitude meaningfully
// bigger, speedGain got PULLED BACK (2000->1200) so that larger raw
// magnitude doesn't overshoot into coastal-speed territory out in open
// water too; the net effect (checked against the same throwaway Node
// script): open water now averages ~50-70px/s (was ~18-20, i.e.
// essentially just sitting on the old floor), a coastline/narrow channel
// still comes out faster (~90-110px/s, maxSpeed-capped) -- both
// genuinely moving now, with the coastal contrast preserved rather than
// erased.
//
// v3.6.20 -- pulled back again, this time all three together (20->13,
// 1200->800, 110->70): direct feedback was "particles feel too fast."
// Computed off the same magnitude ranges the v3.6.18 pass already
// measured (currentGain/coastStrength didn't change this pass, only how
// magnitude maps to speed did): open water now ~40-65px/s (was ~50-70),
// coastline/channel ~55-70px/s, maxSpeed-capped (was ~90-110) -- roughly
// a third slower everywhere, coastal-vs-open contrast preserved. Also
// directly addresses "skip over/through narrow land": less distance
// covered per frame gives the coast vector (see coastMix's own v3.6.20
// note above) more room to actually deflect a particle before it's
// already past a thin finger of land.
//
// stuckCheckInterval / stuckThreshold -- v3.6.19. Cheap safety net, not
// the primary fix: every stuckCheckInterval seconds, a particle whose
// NET displacement since the last check is under stuckThreshold px gets
// force-respawned, regardless of why it stalled. 2.5s / 15px means
// roughly under 6px/s net movement over a real few-second window
// triggers it -- well below even baseSpeed's own 20px/s floor, so this
// shouldn't ever fire on a genuinely-moving particle, only a stalled
// one. Deliberately just a per-particle position check, not the
// density/neighbour-based version of this idea ("close to a bunch of
// other particles") -- flagged directly as the expensive one, and not
// needed if the field-level fixes (coastMix tangent handedness aligned
// to the constant bias, current time-drift) are doing their job; this
// exists to catch whatever residual case they don't.
