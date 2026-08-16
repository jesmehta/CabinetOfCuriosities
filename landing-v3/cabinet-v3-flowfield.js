// Precomputed vector flow field -- v3.6.16. Pure logic, no DOM, same
// split rationale as cabinet-v3-treemap.js / cabinet-v3-circlepack.js /
// cabinet-v3-islandshape.js.
//
// Two composited layers, both cheap:
//
// 1. Base current -- a smooth, low-frequency ("lazy") current: curl
//    noise, i.e. the gradient of a scalar potential rotated 90deg. That
//    rotation guarantees the field is divergence-free (no fake sources/
//    sinks where particles would unnaturally clump), which independently
//    sampling vx/vy from two separate noise calls doesn't.
//
// 2. Coast vector -- derived from the SAME heightmap already built for
//    the coastline trace (buildIslandHeightmap(), cabinet-v3-islandshape.js),
//    not a separately computed island geometry. Its gradient points
//    toward land; negating it gives repulsion (push off the coast),
//    rotating it 90deg gives a tangential vector (slide along the edge,
//    following it round). `coastMix` blends the two. Both fall off
//    naturally with distance from any coastline, for free, since that's
//    exactly what a smooth heightmap's own gradient does -- no separate
//    distance-to-nearest-island query needed.
//
// See Landing-page-notes.2.0.md's "Flow field" entry for the fuller
// design conversation this implements, and why island-avoidance rides on
// the coastline heightmap's gradient instead of tracing the boundary
// path for a genuine tangent.

import { mulberry32, seedFromString, buildPermutation, fbm2D } from "./cabinet-v3-islandshape.js";

// Central-difference gradient of a scalar function sampled on demand --
// `eps` in world px, small relative to the field's own wavelength so the
// finite difference approximates the true derivative well.
function gradientOf(sampleFn, x, y, eps) {
  const gx = (sampleFn(x + eps, y) - sampleFn(x - eps, y)) / (2 * eps);
  const gy = (sampleFn(x, y + eps) - sampleFn(x, y - eps)) / (2 * eps);
  return [gx, gy];
}

function lerp2(v00, v10, v01, v11, tx, ty) {
  const top = v00 + (v10 - v00) * tx;
  const bottom = v01 + (v11 - v01) * tx;
  return top + (bottom - top) * ty;
}

// Bilinear sample of a grid at a world (x, y), given the bounds that
// grid was actually built over -- lets the flow field read the
// heightmap at its OWN (coarser) grid spacing regardless of the
// heightmap's own (finer) cellSize, rather than tying the two grids
// together. Clamps to the grid edge rather than extrapolating.
function sampleGrid(G, cols, rows, cellSize, bounds, x, y) {
  const fx = Math.min(cols - 1.001, Math.max(0, (x - bounds.x) / cellSize));
  const fy = Math.min(rows - 1.001, Math.max(0, (y - bounds.y) / cellSize));
  const gx0 = Math.floor(fx), gy0 = Math.floor(fy);
  const tx = fx - gx0, ty = fy - gy0;
  const i00 = gy0 * cols + gx0, i10 = i00 + 1, i01 = i00 + cols, i11 = i01 + 1;
  return lerp2(G[i00], G[i10], G[i01], G[i11], tx, ty);
}

// Public entry point.
//
// H/hCols/hRows/hCellSize/heightmapBounds: the heightmap
// buildIslandHeightmap() already produced this frame (cabinet-v3-layout.js
// passes the exact same one it built for the coastline trace -- no
// separate island geometry computed here). heightmapBounds is whatever
// (padded) bounds THAT heightmap was built over -- needed to convert a
// world (x, y) into H's own grid-local coordinates correctly.
//
// fieldBounds: the (unpadded) area the flow field's own grid should
// cover -- independent of heightmapBounds, since the field doesn't need
// marching-squares' edge-closure padding.
//
// config: v3Config.flow.
//
// Returns the field's own grid (vx/vy, plus potentialGrid for the debug
// heatmap) at config.cellSize spacing, and a bilinear sample(x, y) for
// reading a velocity at any world point, not just grid points --
// particles (not built yet) and the debug arrow overlay both use this.
export function buildFlowField(H, hCols, hRows, hCellSize, heightmapBounds, fieldBounds, config) {
  const { cellSize, seed, potentialScale, octaves, lacunarity, gain, coastMix, coastStrength } = config;

  const cols = Math.max(2, Math.ceil(fieldBounds.width / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(fieldBounds.height / cellSize) + 1);

  const perm = buildPermutation(mulberry32(seedFromString(`${seed}:current`)));
  const potential = (x, y) => fbm2D(perm, x * potentialScale, y * potentialScale, octaves, lacunarity, gain);
  // ~8% of the potential's own wavelength -- small enough for the finite
  // difference to approximate the true derivative well, large enough to
  // stay well clear of float-precision noise.
  const potentialEps = Math.max(4, 0.08 / potentialScale);
  const heightAt = (x, y) => sampleGrid(H, hCols, hRows, hCellSize, heightmapBounds, x, y);
  // A few heightmap cells wide -- smooths over the coastline's own
  // per-pixel noise/warp jitter so the gradient reads as "which way is
  // the coast," not fine edge texture.
  const heightEps = hCellSize * 3;

  const vx = new Float32Array(cols * rows);
  const vy = new Float32Array(cols * rows);
  const potentialGrid = new Float32Array(cols * rows);

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const x = fieldBounds.x + gx * cellSize;
      const y = fieldBounds.y + gy * cellSize;
      const i = gy * cols + gx;

      const [px, py] = gradientOf(potential, x, y, potentialEps);
      // Curl = gradient rotated -90deg -- divergence-free by construction.
      const curX = py;
      const curY = -px;

      const [hx, hy] = gradientOf(heightAt, x, y, heightEps);
      const repX = -hx, repY = -hy;
      const tanX = -hy, tanY = hx;
      const coastX = (repX * (1 - coastMix) + tanX * coastMix) * coastStrength;
      const coastY = (repY * (1 - coastMix) + tanY * coastMix) * coastStrength;

      vx[i] = curX + coastX;
      vy[i] = curY + coastY;
      potentialGrid[i] = potential(x, y);
    }
  }

  function sample(x, y) {
    const fx = Math.min(cols - 1.001, Math.max(0, (x - fieldBounds.x) / cellSize));
    const fy = Math.min(rows - 1.001, Math.max(0, (y - fieldBounds.y) / cellSize));
    const gx0 = Math.floor(fx), gy0 = Math.floor(fy);
    const tx = fx - gx0, ty = fy - gy0;
    const i00 = gy0 * cols + gx0, i10 = i00 + 1, i01 = i00 + cols, i11 = i01 + 1;
    return [
      lerp2(vx[i00], vx[i10], vx[i01], vx[i11], tx, ty),
      lerp2(vy[i00], vy[i10], vy[i01], vy[i11], tx, ty)
    ];
  }

  return { vx, vy, potentialGrid, cols, rows, cellSize, sample };
}
