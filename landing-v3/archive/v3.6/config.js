// Frozen copy of ../../cabinet-v3-data.js's v3Config, taken 2026-08-06 --
// the moment v3.6's islands-showcase page was split into three (this
// archive, the live index.html, and the live islands-tool.html; see
// Landing-page-notes.2.0.md's "Three pages" section). Deliberately a
// literal, independent object, NOT an import of the live config: the
// whole point of this archive is that editing cabinet-v3-data.js (which
// happens routinely as tuning continues on the live pages) must never
// change what this page renders. This is what "canvas"/"pack"/"island"
// looked like at that moment -- read cabinet-v3-data.js's own comments
// for the reasoning behind each value; only the numbers are duplicated
// here, not the rationale.
//
// Deliberately NOT frozen: the algorithm modules this archive still
// imports live (cabinet-v3-islandshape.js, cabinet-v3-circlepack.js,
// cabinet-v3-treemap.js, one directory up). extras-config.js was moved
// out of this list in v3.6.11 -- the live file was deleted (extraCount
// now lives on cabinet-sections.tsv), so this archive keeps its own
// frozen copy (layout.js's own doc comment) instead. A bug fix to the
// actual algorithm should still reach this archive; only
// DATA and TUNING PARAMETERS are meant to stay pinned here, not the code
// that interprets them. If a future change is structural enough that
// even the shared algorithm modules should stop affecting this archive
// (a genuine v3.7+ rewrite, say), that's the point to take a *new*
// versioned archive folder, not to freeze this one further.

export const v3Config = {
  title: "Cabinet of Curiosities -- v3 layout prototype",
  subtitle: "Weighted regions, archipelago circle-packing -- see Landing-page-notes.2.0.md",

  canvas: {
    width: 1200,
    areaPerWeightUnit: 9000,
    regionGap: 8,
    minSectionWeight: 5
  },

  pack: {
    bandHeightRatio: 0.16,
    minSeparation: 14,
    minRadius: 12,
    maxWeightExtra: 14,
    growStep: 1,
    padding: 6,
    maxRadiusRatio: 0.4,
    maxIterations: 4000
  },

  island: {
    cellSize: 4,
    noiseScale: 1 / 26,
    octaves: 3,
    lacunarity: 2,
    gain: 0.5,
    noiseAmplitude: 0.35,
    innerFrac: 0.55,
    outerFrac: 1.3,
    gradientStrength: 1.1,
    threshold: -0.5,
    waterLevel: -1,
    seed: "cabinet-v3-islands",
    angularStrength: 0.4,
    angularFreqMin: 1.2,
    angularFreqMax: 2.4,
    angularOctaves: 3,
    angularLacunarity: 2,
    angularGain: 0.5,
    angularRidgeMix: 0.6,
    warpStrength: 40,
    warpScale: 1 / 100,
    warpOctaves: 2,
    warpLacunarity: 2,
    warpGain: 0.5
  }
};
