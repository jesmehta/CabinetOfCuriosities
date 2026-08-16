// Noise-based coastlines for the archipelago circles -- v3.5. Pure logic,
// no DOM, same split rationale as cabinet-v3-treemap.js /
// cabinet-v3-circlepack.js.
//
// Where this sits in the pipeline: growCircles() (cabinet-v3-circlepack.js)
// still decides every circle's final (x, y, radius) exactly as before --
// weight-driven sizing, collision-avoidance growth, all of it untouched.
// This module only changes what gets *drawn* for that circle: instead of
// a perfect circle, it traces an organic coastline that roughly follows
// the circle's footprint. Ported from the classic "noise minus a radial
// gradient, then threshold" island-generation technique (see
// Landing-page-notes.2.0.md for the reference article) -- adapted here so
// every circle contributes to ONE shared heightmap instead of each
// getting its own independent canvas, which is what lets two close
// circles' coastlines fuse into a single landmass instead of always
// staying two separate shapes (see the "Fusion behaviour" decision in the
// notes).
//
// Determinism: noise is seeded via the same mulberry32 PRNG
// cabinet-v3-circlepack.js uses for scatter, keyed by a fixed seed string
// (not per-section -- the heightmap spans every section's circles at
// once, so there's no natural per-section key for it). Same content in,
// same coastlines out, every time -- consistent with "recomputed only
// when entries/sections change," never Math.random().

// ---------------------------------------------------------------------
// Seeded 2D gradient (Perlin-style) noise + fbm

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// 8 unit gradient directions (N/S/E/W/diagonals) -- the standard compact
// substitute for Perlin's original 12-edge-of-cube gradient set when
// working in 2D only.
const GRAD2 = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1]
];

// Fisher-Yates shuffle of 0..255 (doubled to 512 so `(i + 1) & 255`-style
// lookups never need a second wraparound check), seeded -- this is the
// only randomness in the whole noise field; everything downstream of it
// is a deterministic function of (x, y).
function buildPermutation(rng) {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + t * (b - a);
}

function gradDot(perm, ix, iy, dx, dy) {
  const idx = (perm[(perm[ix & 255] + iy) & 255]) & 7;
  const [gx, gy] = GRAD2[idx];
  return gx * dx + gy * dy;
}

// Classic Perlin 2D -- output is roughly in [-0.7, 0.7], not normalized
// further since fbm2D below re-normalizes by total amplitude anyway.
function perlin2D(perm, x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = x - x0;
  const sy = y - y0;

  const n00 = gradDot(perm, x0, y0, x - x0, y - y0);
  const n10 = gradDot(perm, x1, y0, x - x1, y - y0);
  const n01 = gradDot(perm, x0, y1, x - x0, y - y1);
  const n11 = gradDot(perm, x1, y1, x - x1, y - y1);

  const u = fade(sx);
  const v = fade(sy);
  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
}

// Fractal Brownian motion: a few octaves of perlin2D at increasing
// frequency and decreasing amplitude, layered together and renormalized
// to roughly [-1, 1] -- gives coastlines a bit of fine detail on top of
// the base wobble instead of one uniform wavelength everywhere.
function fbm2D(perm, x, y, octaves, lacunarity, gain) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * perlin2D(perm, x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return norm > 0 ? sum / norm : 0;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// v3.5.2 -- angle-modulated radius, the actual silhouette fix (octaves
// on the *edge* noise, tried first, only added detail below the grid's
// own sampling resolution -- see Landing-page-notes.2.0.md). Rather than
// a constant falloff radius in every direction (a jittered-edge circle
// no matter how much noise rides on top of it), the radius itself
// becomes a function of angle around the circle's own center: sample
// noise at a point on a loop in noise-space (one loop around the circle
// in world-angle = one loop around that noise-space circle), which
// gives seamless (no seam at theta=0/2pi, since it's a genuine closed
// loop in noise-space) angular variation.
//
// v3.5.3: that sampling is now itself layered across `angularOctaves`
// (same fbm idea as the edge noise's `fbm2D`, just walked around a loop
// instead of across a plane) -- v3.5.2 used one octave only, which
// produces a smooth, single-wavelength deformation (a handful of gentle
// bulges) that still visibly reads as "a distorted circle," not a
// coastline: there was a real gap between that one broad wavelength and
// the edge noise's much finer one, with nothing filling the medium
// frequencies real coastlines get their fjord/peninsula complexity from.
// Each octave increases the loop's radius by `angularLacunarity` (more
// wiggles per revolution) at `angularGain` the previous octave's
// amplitude -- same trade fbm2D makes, just around a circle. Every
// octave's sample point still traces its own fully closed loop as theta
// sweeps 0..2pi (only the loop's radius changes per octave, not whether
// it closes), so the sum stays exactly seamless at every frequency, not
// just the base one.
// v3.5.4: `1 - abs(n)` -- the classic ridged-noise remap. Raw Perlin
// spends most of its range near 0 (smooth, gently rolling) with only
// occasional excursions toward its +-0.7-ish extremes; ridging turns
// those *rare extremes* into the sharp features (narrow valleys here,
// since it feeds a radius-shrinking term) while everywhere n stays near
// 0 remains a broad, smooth plateau. That's the "more extreme jumps"
// request: not bigger smooth bulges (which is all raising
// `angularStrength` alone would give), but occasional sharp, narrow
// pinches -- fjord-like inlets -- against an otherwise smoother
// coastline.
//
// Not zero-mean the way raw Perlin is, though, and not correctable by
// eye -- "near 0" dominates raw Perlin's own distribution, and maps to
// ridge's *maximum* (1 - abs(~0) = ~1), so ridge(n) spends most of its
// time near its own ceiling. Measured empirically (a throwaway sampling
// script over ~660k points, mean of raw n came back ~0 as expected,
// confirming the RNG/noise itself is unbiased): ridge(n) = (1-|n|)*2-1
// alone averages +0.578, not 0. Left uncorrected, blending it in (even
// partially, via ridgeMix below) pushed average land-fraction from the
// v3.5.3-tuned ~80% up to 95-98% in practice -- verified, not assumed --
// since a systematically larger effective radius directly shrinks how
// much of `outerFrac`'s band reads as land. The `-0.578` below corrects
// for exactly that measured bias, so blending toward ridged character
// via ridgeMix doesn't *also*, as a side effect, silently blow up every
// island's size and reopen fusion between circles that v3.5's original
// tuning deliberately kept apart.
function ridge(n) {
  return (1 - Math.abs(n)) * 2 - 1 - 0.578;
}

function angularFbm(perm, theta, freqRadius, phaseX, phaseY, octaves, lacunarity, gain, ridgeMix) {
  let smoothSum = 0;
  let ridgedSum = 0;
  let amp = 1;
  let freq = freqRadius;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const nx = phaseX + freq * Math.cos(theta);
    const ny = phaseY + freq * Math.sin(theta);
    const n = perlin2D(perm, nx, ny);
    smoothSum += amp * n;
    ridgedSum += amp * ridge(n);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  const smooth = norm > 0 ? smoothSum / norm : 0;
  const ridged = norm > 0 ? ridgedSum / norm : 0;
  // ridgeMix 0 = v3.5.3's pure smooth fbm; 1 = fully ridged (sharp
  // pinches only, no smooth broad lobing at all). Both signals are
  // computed from the exact same underlying n samples per octave (not
  // two independent noise evaluations), so blending them is a genuine
  // smooth-to-sharp dial on one coastline, not two coastlines cross-
  // faded against each other.
  return smooth * (1 - ridgeMix) + ridged * ridgeMix;
}

function angularRadiusScale(perm, theta, freqRadius, phaseX, phaseY, strength, octaves, lacunarity, gain, ridgeMix) {
  const n = angularFbm(perm, theta, freqRadius, phaseX, phaseY, octaves, lacunarity, gain, ridgeMix);
  // Floored well above 0 -- strength is configured (see cabinet-v3-data.js)
  // so this can't legitimately reach non-positive, but the floor is kept
  // as a hard guarantee: a non-positive scale would divide dNorm by zero
  // or flip its sign, corrupting the whole falloff for that ray.
  return Math.max(0.15, 1 + n * strength);
}

// v3.6 -- domain warping (Inigo Quilez's technique). angularRadiusScale
// above can only ever produce a star-shaped boundary: radius is a
// single-valued function of angle around one fixed center, so a ray from
// that center crosses the coastline exactly once no matter how extreme
// the angular signal gets. That's the structural reason v3.5.2-.4 still
// read as "a circle with bumps" -- no amount of additional angular
// octaves or ridging can fold the boundary back on itself.
//
// Domain warping sidesteps the constraint entirely by displacing the
// *sample position* itself, in plain (x, y) world space, before anything
// downstream (the noise lookup, and critically, the distance-to-center
// check that angularRadiusScale's falloff is measured against) reads it.
// A point that's geometrically well inside a circle's guaranteed-land
// core can warp to where it effectively samples as if it were near the
// edge or past it, while a neighbouring point (offset by only a few
// noise-field wavelengths) doesn't -- that's a real fold: a bay that
// curves back on itself, or a peninsula that narrows then widens again,
// not just a radius dip. See Landing-page-notes.2.0.md for the fuller
// writeup and the verification proxy used to confirm this actually
// changes topology (multi-crossing rays), not just edge texture.
//
// Two independent low-frequency noise fields give the (x, y) displacement
// components -- the classic trick for getting a second, decorrelated
// signal out of one noise function is to sample it again at a large,
// arbitrary coordinate offset (37.2, 91.7 here) rather than building a
// whole second permutation table. Uses fbm2D (not a single perlin2D
// octave) so the warp field itself has some texture across scales, same
// rationale as every other noise term in this file.
function warpOffset(perm, x, y, scale, amplitude, octaves, lacunarity, gain) {
  if (amplitude <= 0) return [0, 0];
  const wx = fbm2D(perm, x * scale, y * scale, octaves, lacunarity, gain);
  const wy = fbm2D(perm, (x + 37.2) * scale, (y + 91.7) * scale, octaves, lacunarity, gain);
  return [wx * amplitude, wy * amplitude];
}

// ---------------------------------------------------------------------
// Heightmap: one shared grid, every circle contributes via max()

// circles: [{ x, y, radius, ... }] -- any extra fields are ignored, so
// growCircles()'s output can be passed straight through, including
// zero/negligible-radius circles (skipped entirely -- a radius near 0
// would make the inner/outer falloff radii collapse to the same point).
//
// Combining via max() (not sum/average) is what produces fusion:
// wherever two circles' influence areas overlap, the higher of the two
// local (noise - gradient) values wins, so a point close to either
// circle's core reads as land regardless of the other circle's gradient
// pulling it toward water -- the same reason growth-based packing uses
// max/nearest-wins logic rather than blending.
//
// Only touches grid cells within each circle's own influence box (its
// outerFrac * radius bounding square), not the whole grid -- the total
// work is proportional to the sum of circle areas, not canvas area times
// circle count.
function buildIslandHeightmap(circles, canvasBounds, config) {
  const { cellSize, noiseScale, octaves, lacunarity, gain, noiseAmplitude, innerFrac, outerFrac, gradientStrength, seed, waterLevel, angularStrength, angularFreqMin, angularFreqMax, angularOctaves, angularLacunarity, angularGain, angularRidgeMix, warpStrength, warpScale, warpOctaves, warpLacunarity, warpGain } = config;

  const cols = Math.max(2, Math.ceil(canvasBounds.width / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(canvasBounds.height / cellSize) + 1);
  const H = new Float32Array(cols * rows).fill(waterLevel);

  const perm = buildPermutation(mulberry32(seedFromString(seed)));
  // Separate permutation table (not the coastline noise's own `perm`,
  // just offset coordinates) -- keeps the warp field visually independent
  // of the base coastline texture rather than risking any subtle
  // correlation between "where a point warps to" and "what the coastline
  // noise reads there".
  const warpPerm = buildPermutation(mulberry32(seedFromString(`${seed}:warp`)));

  // Bbox has to cover the *largest* a circle's angularly-scaled radius
  // could reach in any direction, not just outerFrac * radius -- a bulge
  // (radiusScale > 1) can push the true influence boundary past what a
  // fixed-radius bbox would have covered. angularRadiusScale's own floor
  // (0.15) only bounds it from below; the ceiling is `1 + strength`
  // (perlin2D's practical max magnitude is comfortably under 1, so this
  // is a safe, if slightly conservative, overestimate) -- extra cells
  // this pulls in that a given angle's *actual* scale doesn't reach are
  // just skipped by the per-cell dNorm check below, same as always.
  // `+ warpStrength` (v3.6): domain warp can displace a cell's effective
  // sample position by up to warpStrength px in any direction, so a cell
  // just outside what angular modulation alone would reach can still
  // warp into the circle's influence -- same reasoning as the angular
  // term's own extension just above, stacked on top of it.
  const maxOuterR = c => c.radius * outerFrac * (1 + angularStrength) + warpStrength;

  circles.forEach(c => {
    if (!(c.radius > 0.5)) return;

    // Seeded per-circle, not per-cell -- one phase/frequency pair per
    // island, so its lobing pattern is fixed across every angle sampled
    // for it (and reproducible across reloads), while two different
    // circles get two different, independent patterns rather than an
    // identical bulge direction repeated on every island. Keyed by the
    // circle's own id when present (falls back to its position, e.g. for
    // ad-hoc circles in the verification harness that don't carry one).
    const circleRng = mulberry32(seedFromString(`${seed}:${c.id ?? `${c.x.toFixed(1)},${c.y.toFixed(1)}`}`));
    const phaseX = circleRng() * 1000;
    const phaseY = circleRng() * 1000;
    const freqRadius = angularFreqMin + circleRng() * (angularFreqMax - angularFreqMin);

    const outerR = maxOuterR(c);
    const minGx = Math.max(0, Math.floor((c.x - outerR - canvasBounds.x) / cellSize));
    const maxGx = Math.min(cols - 1, Math.ceil((c.x + outerR - canvasBounds.x) / cellSize));
    const minGy = Math.max(0, Math.floor((c.y - outerR - canvasBounds.y) / cellSize));
    const maxGy = Math.min(rows - 1, Math.ceil((c.y + outerR - canvasBounds.y) / cellSize));

    for (let gy = minGy; gy <= maxGy; gy++) {
      for (let gx = minGx; gx <= maxGx; gx++) {
        const wx = canvasBounds.x + gx * cellSize;
        const wy = canvasBounds.y + gy * cellSize;

        // v3.6: displace the sample point itself before anything reads
        // it -- both the distance-to-center check below (this is what
        // actually produces concavity: see warpOffset()'s doc comment)
        // and the per-pixel coastline noise sample use the *warped*
        // point, not the raw grid position.
        const [wox, woy] = warpOffset(warpPerm, wx, wy, warpScale, warpStrength, warpOctaves, warpLacunarity, warpGain);
        const wxw = wx + wox;
        const wyw = wy + woy;

        const dx = wxw - c.x;
        const dy = wyw - c.y;

        const theta = Math.atan2(dy, dx);
        const radiusScale = angularRadiusScale(perm, theta, freqRadius, phaseX, phaseY, angularStrength, angularOctaves, angularLacunarity, angularGain, angularRidgeMix);
        const dNorm = Math.sqrt(dx * dx + dy * dy) / (c.radius * radiusScale);
        if (dNorm > outerFrac) continue;

        const n = fbm2D(perm, wxw * noiseScale, wyw * noiseScale, octaves, lacunarity, gain) * noiseAmplitude;
        const fall = smoothstep(innerFrac, outerFrac, dNorm) * gradientStrength;
        const h = n - fall;

        const i = gy * cols + gx;
        if (h > H[i]) H[i] = h;
      }
    }
  });

  // Force the outermost ring of grid corners to the water baseline
  // regardless of what a circle's influence computed there -- guarantees
  // every contour marching squares finds below closes within the grid
  // interior, even for a circle grown all the way out to canvasBounds'
  // own edge (outerR can reach past a circle's own already-boundary-
  // clamped radius). Without this, a contour that touched the grid edge
  // would trace as an open chain instead of a closed loop.
  for (let gx = 0; gx < cols; gx++) {
    H[gx] = waterLevel;
    H[(rows - 1) * cols + gx] = waterLevel;
  }
  for (let gy = 0; gy < rows; gy++) {
    H[gy * cols] = waterLevel;
    H[gy * cols + (cols - 1)] = waterLevel;
  }

  return { H, cols, rows };
}

// ---------------------------------------------------------------------
// Marching squares -- binary corner classification + linearly
// interpolated edge crossings, standard 16-case table. Segment pairs are
// left undirected (not walked in a fill-consistent winding order) since
// the caller renders with fill-rule: evenodd, which doesn't need
// consistent winding to fill correctly -- only saddle cases (5 and 10)
// need the center-average disambiguation, to avoid a checkerboard
// artifact where two diagonal corners are "in" but the pairing is
// ambiguous.
function interpEdge(v0, v1, level) {
  if (Math.abs(v1 - v0) < 1e-9) return 0.5;
  return (level - v0) / (v1 - v0);
}

function marchingSquaresSegments(H, cols, rows, level) {
  const get = (gx, gy) => H[gy * cols + gx];
  const segments = [];

  for (let gy = 0; gy < rows - 1; gy++) {
    for (let gx = 0; gx < cols - 1; gx++) {
      const tl = get(gx, gy);
      const tr = get(gx + 1, gy);
      const br = get(gx + 1, gy + 1);
      const bl = get(gx, gy + 1);

      let caseIdx = 0;
      if (tl > level) caseIdx |= 8;
      if (tr > level) caseIdx |= 4;
      if (br > level) caseIdx |= 2;
      if (bl > level) caseIdx |= 1;

      if (caseIdx === 0 || caseIdx === 15) continue;

      // Each point carries its own canonical edge id alongside its
      // (fractional) position -- `H:col:row` for a horizontal grid edge,
      // `V:col:row` for a vertical one, identical regardless of which of
      // its (at most two) neighbouring cells computed it. Chaining below
      // joins segments by this id, not by comparing float coordinates --
      // two cells sharing an edge always derive that edge's crossing
      // point from the identical pair of corner values, so the position
      // *should* already match exactly, but the id join is what's
      // actually guaranteed correct regardless of any float-precision
      // edge case, and is what fixed a real observed bug (two dangling
      // open chains out of 40 circles' worth of real content) that a
      // rounded-coordinate key produced.
      const top = { pos: [gx + interpEdge(tl, tr, level), gy], id: `H:${gx}:${gy}` };
      const right = { pos: [gx + 1, gy + interpEdge(tr, br, level)], id: `V:${gx + 1}:${gy}` };
      const bottom = { pos: [gx + interpEdge(bl, br, level), gy + 1], id: `H:${gx}:${gy + 1}` };
      const left = { pos: [gx, gy + interpEdge(tl, bl, level)], id: `V:${gx}:${gy}` };

      switch (caseIdx) {
        case 1: segments.push([left, bottom]); break;
        case 2: segments.push([bottom, right]); break;
        case 3: segments.push([left, right]); break;
        case 4: segments.push([top, right]); break;
        case 5: {
          const center = (tl + tr + br + bl) / 4;
          if (center > level) { segments.push([left, top]); segments.push([bottom, right]); }
          else { segments.push([left, bottom]); segments.push([top, right]); }
          break;
        }
        case 6: segments.push([top, bottom]); break;
        case 7: segments.push([left, top]); break;
        case 8: segments.push([left, top]); break;
        case 9: segments.push([top, bottom]); break;
        case 10: {
          const center = (tl + tr + br + bl) / 4;
          if (center > level) { segments.push([left, bottom]); segments.push([top, right]); }
          else { segments.push([left, top]); segments.push([bottom, right]); }
          break;
        }
        case 11: segments.push([top, right]); break;
        case 12: segments.push([left, right]); break;
        case 13: segments.push([bottom, right]); break;
        case 14: segments.push([left, bottom]); break;
        default: break;
      }
    }
  }

  return segments;
}

// Segment soup -> closed polygons. Every grid edge borders at most two
// cells, so joining segments by each endpoint's canonical edge id (see
// marchingSquaresSegments above) -- not by comparing float coordinates --
// guarantees each interior crossing point is shared by exactly two
// segments; border cells are forced to `level`'s water side (see
// buildIslandHeightmap's edge-forcing above), so every chain closes
// without ever needing to handle a dangling open end.
function chainSegmentsToPolygons(segments) {
  const pointAdjacency = new Map();
  const addAdjacency = (point, segIdx) => {
    if (!pointAdjacency.has(point.id)) pointAdjacency.set(point.id, []);
    pointAdjacency.get(point.id).push(segIdx);
  };
  segments.forEach((seg, i) => {
    addAdjacency(seg[0], i);
    addAdjacency(seg[1], i);
  });

  const used = new Array(segments.length).fill(false);
  const polygons = [];

  for (let startIdx = 0; startIdx < segments.length; startIdx++) {
    if (used[startIdx]) continue;
    used[startIdx] = true;

    const startId = segments[startIdx][0].id;
    const polygon = [segments[startIdx][0].pos, segments[startIdx][1].pos];
    let currentId = segments[startIdx][1].id;
    let guard = segments.length + 1;

    while (guard-- > 0) {
      const candidates = pointAdjacency.get(currentId) || [];
      const nextIdx = candidates.find(i => !used[i]);
      if (nextIdx === undefined) break;

      used[nextIdx] = true;
      const seg = segments[nextIdx];
      const nextPoint = seg[0].id === currentId ? seg[1] : seg[0];
      polygon.push(nextPoint.pos);
      currentId = nextPoint.id;

      if (currentId === startId) break;
    }

    if (polygon.length >= 3) polygons.push(polygon);
  }

  return polygons;
}

// Collapse runs of collinear points (three or more points advancing in
// the same direction) down to their endpoints -- marching squares at a
// coarse grid tends to walk several cells in a straight line before
// turning, and the raw output has one vertex per cell crossed. Purely a
// path-size reduction; doesn't change the traced shape.
// Shoelace formula, in grid units (not world px) -- used only to filter
// out noise-speckle micro-contours, not for rendering.
function polygonArea(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function simplifyCollinear(polygon) {
  if (polygon.length <= 3) return polygon;
  const out = [polygon[0]];
  for (let i = 1; i < polygon.length - 1; i++) {
    const [ax, ay] = out[out.length - 1];
    const [bx, by] = polygon[i];
    const [cx, cy] = polygon[i + 1];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(cross) > 1e-6) out.push(polygon[i]);
  }
  out.push(polygon[polygon.length - 1]);
  return out;
}

// ---------------------------------------------------------------------
// Public entry point

// Traces one threshold level of an ALREADY-BUILT heightmap into one SVG
// path `d` string (every closed contour as a separate `M...Z` subpath).
// Exported (v3.6.4) so a caller that needs MULTIPLE threshold levels off
// the same circles -- the main coastline plus one or more ripple rings,
// see cabinet-v3-layout.js's render() -- can call buildIslandHeightmap()
// once and this once per level, instead of paying for the heightmap
// build (the expensive part: sampling noise/warp at every grid cell
// within every circle's bbox) once per level. traceIslandShapes() below
// is the convenience wrapper for callers that only want one level.
export function traceContourFromHeightmap(H, cols, rows, cellSize, canvasBounds, threshold) {
  const segments = marchingSquaresSegments(H, cols, rows, threshold);
  // Drops sub-cell noise speckles -- an isolated grid cell or two that
  // happened to cross `threshold` in open water, far from any circle's
  // guaranteed-land core, traces as a valid but visually meaningless
  // closed loop a handful of grid units across. 2 cell^2 is well below
  // any real circle's footprint (minRadius alone is 12px = 3 cells) so
  // this only ever removes speckle, never a genuine small island.
  const MIN_POLYGON_AREA_CELLS = 2;
  const polygons = chainSegmentsToPolygons(segments)
    .filter(p => polygonArea(p) >= MIN_POLYGON_AREA_CELLS)
    .map(simplifyCollinear)
    .filter(p => p.length >= 3);

  const toWorld = ([gx, gy]) => [
    canvasBounds.x + gx * cellSize,
    canvasBounds.y + gy * cellSize
  ];

  return polygons
    .map(polygon => {
      const pts = polygon.map(toWorld);
      const [mx, my] = pts[0];
      const rest = pts.slice(1).map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      return `M ${mx.toFixed(1)},${my.toFixed(1)} ${rest} Z`;
    })
    .join(" ");
}

// Returns one SVG path `d` string covering every traced landmass as
// separate `M...Z` subpaths -- render with fill-rule="evenodd" so a rare
// noise-carved "lake" fully inside a landmass (an interior contour) cuts
// a hole correctly regardless of which way either loop happened to wind.
export function traceIslandShapes(circles, canvasBounds, config) {
  const { cellSize, threshold } = config;
  const { H, cols, rows } = buildIslandHeightmap(circles, canvasBounds, config);
  return traceContourFromHeightmap(H, cols, rows, cellSize, canvasBounds, threshold);
}

// ---------------------------------------------------------------------
// v3.6.6 -- fixed-distance wave rings. Everything above this point
// (rippleThresholds/seaBandThresholds/etc.) traces LEVELS of the noise
// heightmap, which is not the same thing as a fixed real-world distance
// from the coastline -- see the field notes in cabinet-v3-data.js. This
// is the actual distance transform that was deferred back at v3.6.4.

// Exact squared Euclidean distance transform of a 1D sampled function
// (Felzenszwalt & Huttenlocher, "Distance Transforms of Sampled
// Functions") -- f[q] is the cost of q being its own nearest source (0
// for a source cell, INF otherwise); returns, for every q, the min over
// every source p of f[p] + (q-p)^2. Two passes of this (once down each
// column, once across each row of the result) gives the exact 2D
// squared Euclidean distance transform, not a chamfer approximation --
// O(n) per pass, same asymptotic cost as one marching-squares trace.
const DT_INF = 1e9;
function distanceTransform1D(f, n) {
  const d = new Float32Array(n);
  const v = new Int32Array(n);
  const z = new Float32Array(n + 1);
  let k = 0;
  v[0] = 0;
  z[0] = -DT_INF;
  z[1] = DT_INF;
  for (let q = 1; q < n; q++) {
    let s;
    for (;;) {
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      if (s <= z[k]) k--;
      else break;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = DT_INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
  }
  return d;
}

// isSeed[i] truthy -> that cell's distance is 0. Returns squared
// distance in GRID units (not px) to the nearest seed cell, for every
// cell -- callers take sqrt and multiply by cellSize.
function euclideanDistanceTransform2D(isSeed, cols, rows) {
  const colPass = new Float32Array(cols * rows);
  const colBuf = new Float32Array(rows);
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) colBuf[y] = isSeed[y * cols + x] ? 0 : DT_INF;
    const d = distanceTransform1D(colBuf, rows);
    for (let y = 0; y < rows; y++) colPass[y * cols + x] = d[y];
  }
  const out = new Float32Array(cols * rows);
  const rowBuf = new Float32Array(cols);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) rowBuf[x] = colPass[y * cols + x];
    const d = distanceTransform1D(rowBuf, cols);
    for (let x = 0; x < cols; x++) out[y * cols + x] = d[x];
  }
  return out;
}

// Builds a field where every LAND cell (H > threshold) is 0 and every
// water cell is NEGATIVE its true pixel distance to the nearest land
// cell -- deliberately negated so it drops straight into
// traceContourFromHeightmap() exactly like H itself: tracing this field
// at level `-D` gives the closed polygon of every point exactly D
// pixels from the coastline, the same "> level = land side" convention
// traceContourFromHeightmap already uses, just with distance standing
// in for noise height. Distance is measured to the nearest LAND CELL,
// not the literal traced coastline curve, so it's accurate to within
// about half a cellSize -- the same resolution every other contour in
// this file already trades away for marching squares' speed.
export function buildCoastlineDistanceField(H, cols, rows, cellSize, threshold) {
  const isLand = new Uint8Array(cols * rows);
  for (let i = 0; i < H.length; i++) isLand[i] = H[i] > threshold ? 1 : 0;
  const sqDist = euclideanDistanceTransform2D(isLand, cols, rows);
  const field = new Float32Array(cols * rows);
  for (let i = 0; i < field.length; i++) field[i] = -Math.sqrt(sqDist[i]) * cellSize;

  // Same reasoning as buildIslandHeightmap's own edge-forcing: without
  // this, a wave ring near an island close to the canvas edge can reach
  // the true grid boundary and trace as an OPEN chain -- which
  // chainSegmentsToPolygons still pushes as if it were closed, so the
  // SVG path's implicit final "Z" draws a straight line from wherever
  // that chain happened to end back to wherever it started, often clear
  // across the canvas to an unrelated contour. Forcing the border to a
  // value no realistic waveDistances entry will ever reach guarantees
  // every ring closes on its own, inside the grid, same as every other
  // contour in this file already does.
  const FAR = -1e6;
  for (let gx = 0; gx < cols; gx++) {
    field[gx] = FAR;
    field[(rows - 1) * cols + gx] = FAR;
  }
  for (let gy = 0; gy < rows; gy++) {
    field[gy * cols] = FAR;
    field[gy * cols + (cols - 1)] = FAR;
  }

  return field;
}

// v3.6.4: concentric "ripple" rings echoing the coastline outward into
// open water (same spirit as the v2 map's coast-ripples-global, see
// Landing-page-notes.2.0.md) are built by the caller as: build H once
// via buildIslandHeightmap(), call traceContourFromHeightmap() once for
// config.threshold (the coastline) and once per entry in
// config.rippleThresholds (each strictly below config.threshold, since
// h decreases roughly monotonically with distance from any circle's
// core once past the noise/warp perturbation -- a lower threshold sits
// farther out, literally a distance ring). Islands close enough
// together fuse their main coastline (via H's own max()-combine); their
// ripple rings fuse the exact same way, for free, at every level -- the
// one thing v2 had to solve specially for (its own comment: "islands
// close enough together fuse their rings into one shape instead of
// clipping through each other") falls out automatically here. See
// cabinet-v3-layout.js's render() for the actual call site.

// Exported for the Node verification harness (land-area-fraction check,
// contour counts) -- not used by the render path itself.
export { buildIslandHeightmap, marchingSquaresSegments, chainSegmentsToPolygons, euclideanDistanceTransform2D };

// Exported (v3.6.16) for cabinet-v3-flowfield.js -- the seeded-noise
// primitives here are general-purpose, not coastline-specific, so the
// flow field's own "lazy current" noise reuses them rather than
// duplicating a second Perlin implementation.
export { mulberry32, seedFromString, buildPermutation, fbm2D };
