// Precomputed vector flow field -- v3.6.16, time-varying current added
// v3.6.18. Pure logic, no DOM, same split rationale as
// cabinet-v3-treemap.js / cabinet-v3-circlepack.js /
// cabinet-v3-islandshape.js.
//
// Two composited layers, both cheap:
//
// 1. Base current -- a smooth, low-frequency ("lazy") current: curl
//    noise, i.e. the gradient of a scalar potential rotated 90deg. That
//    rotation guarantees the field is divergence-free (no fake sources/
//    sinks where particles would unnaturally clump), which independently
//    sampling vx/vy from two separate noise calls doesn't. v3.6.18: the
//    potential's own sample position slowly drifts over real time
//    (driftSpeedX/Y) -- see createFlowSampler()'s doc comment for why.
//
// 2. Coast vector -- derived from the SAME heightmap already built for
//    the coastline trace (buildIslandHeightmap(), cabinet-v3-islandshape.js),
//    not a separately computed island geometry. Its gradient points
//    toward land; negating it gives repulsion (push off the coast),
//    rotating it 90deg gives a tangential vector (slide along the edge,
//    following it round). `coastMix` blends the two. Both fall off
//    naturally with distance from any coastline, for free, since that's
//    exactly what a smooth heightmap's own gradient does -- no separate
//    distance-to-nearest-island query needed. Never time-varying --
//    islands don't move, only the current drifts.
//
// See documentation/landing-page-v3-notes.2.0.md's "Flow field" entries for the fuller
// design conversation this implements.

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

// Builds a reusable sampler against one heightmap -- the permutation
// tables (the only non-trivial setup cost) get built ONCE here, not
// per-sample, so this is cheap to call many times per frame (one call
// per particle -- see tickParticles() in cabinet-v3-layout.js) as well
// as many times per grid cell (buildFlowField() below, for the debug
// view).
//
// H/hCols/hRows/hCellSize/heightmapBounds: the heightmap
// buildIslandHeightmap() already produced (cabinet-v3-layout.js passes
// the exact same one it built for the coastline trace -- no separate
// island geometry computed here). heightmapBounds is whatever (padded)
// bounds THAT heightmap was built over -- needed to convert a world
// (x, y) into H's own grid-local coordinates correctly.
//
// config: v3Config.flow.
//
// vectorAt(x, y, t) / potentialAt(x, y, t): `t` is elapsed seconds,
// defaulting to 0 (a static sample, what the debug grid below uses).
// v3.6.18 -- ONLY the current's own potential sampling position drifts
// with t (by driftSpeedX/Y world px/sec); the coast vector never does,
// since it's tied to real, static island geometry. Why drift at all: a
// curl-noise field is divergence-free EVERYWHERE, which structurally
// means it has permanent vortex centres around any local extremum of
// the potential -- not a bug, a known property of curl noise -- and a
// particle that wanders near one gets pulled into a closed orbit and
// stays there forever in a perfectly STATIC field (reported directly:
// "particles go into and are trapped... rotating on themselves").
// Drifting the potential's sample position means any given vortex
// itself slowly drifts and dissolves/reforms elsewhere, so nothing can
// trap a particle permanently -- the fix is temporal, not spatial.
export function createFlowSampler(H, hCols, hRows, hCellSize, heightmapBounds, config) {
  const {
    seed, potentialScale, octaves, lacunarity, gain, currentGain, driftSpeedX, driftSpeedY,
    biasDirX, biasDirY, biasStrength, coastMix, coastStrength,
    coastTangentDriftAmpX, coastTangentDriftAmpY, coastTangentDriftFreqX, coastTangentDriftFreqY,
    // v3.6.21 -- NOT part of v3Config.flow's own documented shape;
    // buildCurrentSampler() (cabinet-v3-layout.js) injects this at the
    // call site from v3Config.island.threshold, the SAME value the
    // coastline itself is traced at, so isLand() below can never
    // disagree with what's actually drawn as land. Optional (defaults to
    // "nothing is land") so buildFlowField()'s debug-grid use of this
    // sampler, which never calls isLand(), needs no change.
    landThreshold = Infinity
  } = config;

  const perm = buildPermutation(mulberry32(seedFromString(`${seed}:current`)));
  // ~8% of the potential's own wavelength -- small enough for the finite
  // difference to approximate the true derivative well, large enough to
  // stay well clear of float-precision noise.
  const potentialEps = Math.max(4, 0.08 / potentialScale);
  const heightAt = (x, y) => sampleGrid(H, hCols, hRows, hCellSize, heightmapBounds, x, y);
  // A few heightmap cells wide -- smooths over the coastline's own
  // per-pixel noise/warp jitter so the gradient reads as "which way is
  // the coast," not fine edge texture.
  const heightEps = hCellSize * 3;

  function potentialAt(x, y, t = 0) {
    const dx = t * driftSpeedX;
    const dy = t * driftSpeedY;
    return fbm2D(perm, (x + dx) * potentialScale, (y + dy) * potentialScale, octaves, lacunarity, gain);
  }

  // v3.6.23 -- offsetX/offsetY (default 0, so every existing caller is
  // unaffected): shifts ONLY the current's own sampling position, never
  // the coast/repulsion gradient below, which always reads the
  // particle's TRUE (x, y) regardless. Lets cabinet-v3-particles.js give
  // each particle a small constant personal offset into the SAME shared
  // noise field -- reuses these exact fbm2D calls, no extra evaluation
  // -- so two particles standing at the same real point can genuinely
  // read different local current structure, without ever touching the
  // safety-critical "is there land here" half of the field. Demo/cost
  // discussion in documentation/conversation-landing-page-v3.md's "one giant trash
  // drift" section.
  function vectorAt(x, y, t = 0, offsetX = 0, offsetY = 0) {
    const potentialFn = (px, py) => potentialAt(px, py, t);
    const [px, py] = gradientOf(potentialFn, x + offsetX, y + offsetY, potentialEps);
    // Curl = gradient rotated -90deg -- divergence-free by construction.
    // currentGain is a pure magnitude multiplier (not folded into
    // potentialScale/octaves, which shape frequency/texture, not overall
    // energy) -- see currentGain's own field notes in cabinet-v3-data.js.
    // biasDirX/Y * biasStrength (v3.6.19): a constant, NEVER time-varying,
    // prevailing-current term -- "the general current goes somewhere, with
    // local variation on top," not a directionless swirl. Added here (not
    // drifted) since a real prevailing current doesn't wander session to
    // session the way local eddies do.
    const curX = py * currentGain + biasDirX * biasStrength;
    const curY = -px * currentGain + biasDirY * biasStrength;

    // Repulsion -- the exact, NEVER-drifted gradient at the particle's
    // true (x, y). This is the only thing guaranteeing a particle always
    // reads real land as land, so unlike the tangent below, it must
    // never be sampled anywhere but the particle's actual position.
    const [hx, hy] = gradientOf(heightAt, x, y, heightEps);
    const repX = -hx, repY = -hy;

    // Tangent -- v3.6.20: derived from a SEPARATE, slightly time-shifted
    // sample of the SAME static heightmap, not the exact (hx, hy) above.
    // Reason: rot90(gradient) is, by construction, divergence-free -- the
    // same structural property that gave curl noise its permanent vortex
    // centres (see driftSpeedX/Y's own comment above) -- except this
    // half of the field was deliberately kept static (islands don't
    // move), so any closed loop it forms in tight/concave geometry (a
    // narrow pinch, a cul-de-sac bay) never dissolves on its own the way
    // the current's vortices now do. Confirmed as the cause of a
    // reported failure mode distinct from the earlier narrow-bay
    // clumping fix: a specific channel that reliably traps particles, a
    // bay that does the same, and rarer one-off stalls elsewhere -- all
    // consistent with a static divergence-free field's own fixed
    // critical points.
    //
    // BOUNDED oscillation (sin/cos), NOT a linear t*speed drift -- a
    // first attempt used a linear drift and shipped a real regression:
    // t only ever grows for the life of the page, so a linear offset
    // grows without limit too, and after a couple of minutes the
    // "tangent" was being read from a heightmap sample dozens to
    // hundreds of px from the particle's true position -- often well
    // inside the SAME landmass, where the gradient has nothing to do
    // with the real local coastline (reported directly: particles
    // drifting onto land more than before, worsening the longer the
    // page had been open, not a one-off glitch). Amplitude here
    // (coastTangentDriftAmpX/Y) is fixed and small relative to
    // heightEps/typical channel width, so the sample position orbits
    // near the particle's true position FOREVER rather than wandering
    // off -- still enough phase variation to break a stalled
    // equilibrium (see driftSpeedX/Y's own fix for the same idea on the
    // current's side), just never unbounded. Only the TANGENT does this,
    // never the repulsion above: sliding direction is a soft, aesthetic
    // choice, while "is there land here" must stay exact always.
    // Frequencies deliberately mismatched (not a common period) so the
    // sample traces an open Lissajous-like path rather than a fixed
    // ellipse, avoiding its own accidental closed loop.
    const tdx = coastTangentDriftAmpX * Math.sin(t * coastTangentDriftFreqX);
    const tdy = coastTangentDriftAmpY * Math.cos(t * coastTangentDriftFreqY);
    const [hx2, hy2] = gradientOf(heightAt, x + tdx, y + tdy, heightEps);
    // Handedness tie-breaker (v3.6.19, unchanged) -- still aligned to the
    // constant bias direction, just off the drifted gradient now.
    const tanA_X = -hy2, tanA_Y = hx2;
    const tanB_X = hy2, tanB_Y = -hx2;
    const agreesWithA = tanA_X * biasDirX + tanA_Y * biasDirY;
    const agreesWithB = tanB_X * biasDirX + tanB_Y * biasDirY;
    const [tanX, tanY] = agreesWithA >= agreesWithB ? [tanA_X, tanA_Y] : [tanB_X, tanB_Y];

    const coastX = (repX * (1 - coastMix) + tanX * coastMix) * coastStrength;
    const coastY = (repY * (1 - coastMix) + tanY * coastMix) * coastStrength;

    return [curX + coastX, curY + coastY];
  }

  // v3.6.21 -- hard boundary check, separate from the smooth coast
  // vector above. The coast vector is a SOFT, additive force -- it's
  // summed with the current, not a wall -- so at any point where the
  // current's own local direction happens to point toward the coast
  // with a magnitude close to the coast vector's, the two can partly or
  // fully cancel, and a slow particle can be nudged onto land over many
  // frames even with an otherwise-correct coast force. Reported
  // directly: land-crossing persisted even after fixing the
  // coastTangentDrift regression, i.e. it isn't that bug -- it's this
  // structural gap in a purely additive force model. Used by
  // stepParticle() (cabinet-v3-particles.js) as a hard backstop: reject
  // a step that would end ON land outright, rather than only ever
  // discouraging it.
  function isLand(x, y) {
    return heightAt(x, y) > landThreshold;
  }

  // v3.6.22 -- the true, exact (never-drifted) repulsion direction at a
  // point -- the same `-gradient` vectorAt() blends into the coast
  // vector above, just exposed on its own. For coastal particle spawns
  // (cabinet-v3-particles.js's pickCoastalSpawnPoint()): a particle
  // launched "off the beach" wants to start moving straight away from
  // shore, not already blended with the current the way an ordinary
  // spawn's initialDirection() would give it.
  function repulsionAt(x, y) {
    const [hx, hy] = gradientOf(heightAt, x, y, heightEps);
    const m = Math.hypot(hx, hy) || 1;
    return [-hx / m, -hy / m];
  }

  return { vectorAt, potentialAt, isLand, repulsionAt };
}

// Grid snapshot of the field at a given moment `t`, for the dev-panel
// debug view (showPotential/showVectors, cabinet-v3-layout.js's
// drawFlowFieldDebug()). A snapshot, not itself animated -- building the
// full grid every frame would be wasted work (see gradientOf()'s 4
// evals per vector, times cols*rows) -- but v3.6.20: `t` defaults to 0
// only for callers that don't care (e.g. nothing's animating yet);
// cabinet-v3-layout.js's animationFrame() now rebuilds this
// periodically at the LIVE elapsed time, not frozen at t=0 forever, so
// the debug view stays correlated with what particles are actually
// doing once both the current and the coast tangent are drifting (see
// createFlowSampler()'s own doc comment above).
//
// fieldBounds: the (unpadded) area the grid should cover -- independent
// of heightmapBounds, since the field doesn't need marching-squares'
// edge-closure padding.
export function buildFlowField(H, hCols, hRows, hCellSize, heightmapBounds, fieldBounds, config, t = 0) {
  const { cellSize } = config;
  const sampler = createFlowSampler(H, hCols, hRows, hCellSize, heightmapBounds, config);

  const cols = Math.max(2, Math.ceil(fieldBounds.width / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(fieldBounds.height / cellSize) + 1);

  const vx = new Float32Array(cols * rows);
  const vy = new Float32Array(cols * rows);
  const potentialGrid = new Float32Array(cols * rows);

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const x = fieldBounds.x + gx * cellSize;
      const y = fieldBounds.y + gy * cellSize;
      const i = gy * cols + gx;
      const [vX, vY] = sampler.vectorAt(x, y, t);
      vx[i] = vX;
      vy[i] = vY;
      potentialGrid[i] = sampler.potentialAt(x, y, t);
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
