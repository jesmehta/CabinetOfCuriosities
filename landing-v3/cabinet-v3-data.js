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
  }
};
