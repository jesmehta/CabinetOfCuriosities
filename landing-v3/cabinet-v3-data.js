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
    maxIterations: 4000
  },

  // v3.5: noise-carved coastlines for the archipelago circles -- see
  // cabinet-v3-islandshape.js. Every circle contributes (noise - radial
  // gradient) to one shared heightmap, combined via max() so close
  // circles' coastlines can fuse into one landmass; thresholding that
  // heightmap and tracing it with marching squares is what replaces the
  // plain <circle> a growCircles() output would otherwise render as.
  island: {
    // Grid spacing for the heightmap/marching-squares pass, in canvas
    // px. Smaller = smoother coastline + more path points; 4px keeps
    // contours visibly faceted (matching the v2 map's own coastline/
    // ripple aesthetic, itself a coarse-grid marching-squares trace) at
    // a computation cost proportional to circle areas, not canvas area.
    cellSize: 4,
    // Noise sample frequency -- world px per full noise period is
    // roughly 1 / noiseScale. Tuned so a mid-sized circle's coastline
    // shows several wobbles around its circumference, not one broad
    // bulge or fine static.
    noiseScale: 1 / 26,
    // v3.5.1 tried 6 here (up from 3) to see the effect of finer coastal
    // detail in isolation -- reverted, since the added octaves' higher-
    // frequency detail falls below what `cellSize` can resolve at trace
    // time, so it cost more compute for a visually near-identical result
    // and didn't touch the actual complaint (still fundamentally round --
    // see the v3.5.2 angular-modulated-radius work below, which did).
    octaves: 3,
    lacunarity: 2,
    gain: 0.5,
    // Multiplies the raw (roughly [-1, 1]) fbm output before it's
    // compared against the radial gradient -- the actual amplitude of
    // the noise term relative to `threshold` and `gradientStrength`
    // below, all three tuned together (see cabinet-v3-islandshape.js).
    noiseAmplitude: 0.35,
    // Normalized distance from a circle's own center (as a fraction of
    // its radius) where the radial falloff starts (innerFrac, always
    // land inside this) and ends (outerFrac, always water beyond this).
    // The coastline itself lands somewhere in between, noise-shifted --
    // tuned (with threshold/gradientStrength below) so the *average*
    // crossing sits close to the circle's own original radius (d ~ 0.9),
    // per "most of the circle is the island, the rest is water" --
    // verified empirically in _verify-islandshape.mjs, not derived
    // analytically (smoothstep's inverse against noise's actual
    // distribution isn't worth solving by hand when the check is one
    // Node run).
    innerFrac: 0.55,
    outerFrac: 1.3,
    gradientStrength: 1.1,
    // Height threshold separating land (> threshold) from water. Sits
    // comfortably below noiseAmplitude's own range so the guaranteed-
    // land core (innerFrac) is never accidentally carved into water by
    // an unlucky noise sample, while gradientStrength is large enough
    // relative to threshold + noiseAmplitude that outerFrac is always
    // reliably water (also verified, not just asserted).
    threshold: -0.5,
    // Baseline height for every grid cell no circle's influence reaches
    // -- far enough below `threshold` that open ocean never registers
    // as land regardless of noise (noise is never sampled there at all,
    // see buildIslandHeightmap's per-circle-bbox-only loop).
    waterLevel: -1,
    // Fixed seed for the whole shared heightmap (not per-section, unlike
    // pack's scatter seeding -- there's no natural per-section key for a
    // field every section's circles contribute to together).
    seed: "cabinet-v3-islands",
    // v3.5.2: how much the falloff radius itself bulges/pinches by angle
    // around a circle's own center (see angularRadiusScale() in
    // cabinet-v3-islandshape.js) -- the actual silhouette fix, after
    // octaves alone (tried first, see the v3.5.1 changelog entry) only
    // added edge texture too fine for `cellSize` to resolve, without
    // changing the overall (still-circular) shape. 0.4 means the radius
    // can range roughly 0.7x-1.3x its base value depending on direction
    // -- noticeably lobed/elongated without a circle ever collapsing to
    // a sliver at its narrowest angle.
    angularStrength: 0.4,
    // Range of "loop radius in noise-space" a circle's own angular
    // pattern is randomly drawn from (see angularRadiusScale()'s doc
    // comment for why a small loop gives few broad lobes rather than
    // many small ones). ~1.2-2.4 empirically lands around 2-4 lobes per
    // island -- "peninsula and bay" character, not a wavy-edged circle
    // and not a starburst either.
    angularFreqMin: 1.2,
    angularFreqMax: 2.4,
    // v3.5.3: layers the angular modulation across multiple octaves
    // (angularFbm() in cabinet-v3-islandshape.js) instead of one sample
    // -- v3.5.2's single octave produced a smooth, one-wavelength
    // deformation that still read as "a distorted circle," not a
    // coastline, because nothing filled the medium frequencies between
    // that broad wobble and the much finer per-pixel edge noise. Same
    // three knobs as the edge noise's own fbm2D, applied around the loop
    // instead of across the plane -- deliberately not reusing the exact
    // same octaves/lacunarity/gain values above, so the angular and edge
    // frequency bands can be tuned independently of each other.
    angularOctaves: 3,
    angularLacunarity: 2,
    angularGain: 0.5,
    // v3.5.4: blends v3.5.3's smooth angular fbm (0) with a ridged
    // remap of the same underlying samples (1) -- see ridge() in
    // cabinet-v3-islandshape.js. Raw noise spends most of its range
    // near 0 (broad, gently rolling) with only occasional excursions
    // toward its extremes; ridging turns those rare excursions into
    // sharp, narrow radius pinches (fjord-like inlets) while leaving
    // everywhere else a smooth plateau -- "more extreme jumps" without
    // just inflating angularStrength (which only makes the existing
    // smooth bulges bigger, not sharper). 0.6 leans toward the ridged
    // character while keeping some of v3.5.3's broad lobing underneath.
    angularRidgeMix: 0.6,

    // v3.6: domain warping (see warpOffset() in cabinet-v3-islandshape.js).
    // angularRadiusScale above can only ever bulge/pinch a *radius* --
    // structurally a single-valued function of angle around one fixed
    // center, so it can never fold the boundary back on itself the way a
    // real bay or hook does, no matter how many octaves or how much
    // ridging get piled on (see Landing-page-notes.2.0.md's v3.5.4-vs-
    // v3.6 discussion). Domain warping displaces the sample *position*
    // itself before the distance-to-center check runs, which is what
    // actually makes concavity possible.
    //
    // warpStrength/warpScale below picked from an empirical sweep (a
    // throwaway Node script, not eyeballed): tried strength in
    // [0,20,35,50,70,100] px x warp-field period in [90,140,220] px
    // against 12 varied synthetic circles, counting what fraction of
    // rays from each circle's own center cross the coastline more than
    // once (>1 crossing is direct proof of a real fold -- a star-shaped
    // boundary, which is all angularRadiusScale alone can ever produce,
    // crosses exactly once per ray no matter how jagged). Re-verified
    // against the real 40-circle content specifically (not just the
    // synthetic probes): avg multi-crossing rays 1.55% at warp off vs.
    // 3.40% at these values -- more than double, and every circle still
    // closes cleanly (40/40 landmasses, no fragmentation). Still a
    // starting point, not final aesthetic tuning -- v3.6 also ships an
    // on-page control panel (cabinet-v3-controls.js) specifically so the
    // real tuning happens interactively against the live shapes instead
    // of another round of screenshot-and-guess.
    //
    // warpStrength: max displacement in canvas px. warpScale: like
    // noiseScale above, roughly 1/(world px per warp-field period) --
    // deliberately lower frequency than noiseScale's fine edge texture,
    // since a warp fold needs to displace a whole stretch of a circle's
    // boundary together to read as a bay rather than jitter.
    warpStrength: 40,
    warpScale: 1 / 100,
    warpOctaves: 2,
    warpLacunarity: 2,
    warpGain: 0.5
  }
};
