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

export const v3Config = {
  title: "Cabinet of Curiosities -- v3 layout prototype",
  subtitle: "Weighted regions, archipelago circle-packing -- see Landing-page-notes.2.0.md",

  canvas: {
    width: 1200,
    // Canvas height = (sum of every visible section's weight) x this,
    // divided by width -- i.e. total canvas area scales linearly with
    // total content weight, not a fixed guess. Tuned empirically
    // (rendered + screenshotted, then adjusted) against the real
    // 7-section/25-entry content; revisit if entry count changes a lot.
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
    cellSize: 4,
    noiseScale: 1 / 26,
    octaves: 3,
    lacunarity: 2,
    gain: 0.5,
    noiseAmplitude: 0.38,
    innerFrac: 0.55,
    outerFrac: 1.3,
    gradientStrength: 1.12,
    threshold: -0.62,
    waterLevel: -1,
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
    seaBandThresholds: [-0.97, -0.87, -0.77, -0.67],
    sandThresholds: [-0.6, -0.35],
    vegThresholds: [-0.1, 0.15],
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
    flatColourMode: true
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
