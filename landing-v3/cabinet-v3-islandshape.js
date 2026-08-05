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
// alone, tried first, only added edge texture below the grid's own
// sampling resolution -- see Landing-page-notes.2.0.md). Rather than a
// constant falloff radius in every direction (a jittered-edge circle no
// matter how much noise rides on top of it), the radius itself becomes
// a function of angle around the circle's own center: sample a SEPARATE
// single-octave noise at a point on a small loop in noise-space (one
// loop around the circle in world-angle = one loop around that noise-
// space circle), which gives smooth, low-frequency, seamless (no seam
// at theta=0/2pi, since it's a genuine closed loop in noise-space)
// angular variation -- a few broad bulges/pinches per island, not
// texture. Deliberately a single perlin2D call, not fbm2D -- layering
// multiple octaves back in here would reintroduce the same high-
// frequency wiggle this is meant to be independent of.
function angularRadiusScale(perm, theta, freqRadius, phaseX, phaseY, strength) {
  const nx = phaseX + freqRadius * Math.cos(theta);
  const ny = phaseY + freqRadius * Math.sin(theta);
  const n = perlin2D(perm, nx, ny); // roughly [-0.7, 0.7]
  // Floored well above 0 -- strength is configured (see cabinet-v3-data.js)
  // so this can't legitimately reach non-positive, but the floor is kept
  // as a hard guarantee: a non-positive scale would divide dNorm by zero
  // or flip its sign, corrupting the whole falloff for that ray.
  return Math.max(0.15, 1 + n * strength);
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
  const { cellSize, noiseScale, octaves, lacunarity, gain, noiseAmplitude, innerFrac, outerFrac, gradientStrength, seed, waterLevel, angularStrength, angularFreqMin, angularFreqMax } = config;

  const cols = Math.max(2, Math.ceil(canvasBounds.width / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(canvasBounds.height / cellSize) + 1);
  const H = new Float32Array(cols * rows).fill(waterLevel);

  const perm = buildPermutation(mulberry32(seedFromString(seed)));

  // Bbox has to cover the *largest* a circle's angularly-scaled radius
  // could reach in any direction, not just outerFrac * radius -- a bulge
  // (radiusScale > 1) can push the true influence boundary past what a
  // fixed-radius bbox would have covered. angularRadiusScale's own floor
  // (0.15) only bounds it from below; the ceiling is `1 + strength`
  // (perlin2D's practical max magnitude is comfortably under 1, so this
  // is a safe, if slightly conservative, overestimate) -- extra cells
  // this pulls in that a given angle's *actual* scale doesn't reach are
  // just skipped by the per-cell dNorm check below, same as always.
  const maxOuterR = c => c.radius * outerFrac * (1 + angularStrength);

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
        const dx = wx - c.x;
        const dy = wy - c.y;

        const theta = Math.atan2(dy, dx);
        const radiusScale = angularRadiusScale(perm, theta, freqRadius, phaseX, phaseY, angularStrength);
        const dNorm = Math.sqrt(dx * dx + dy * dy) / (c.radius * radiusScale);
        if (dNorm > outerFrac) continue;

        const n = fbm2D(perm, wx * noiseScale, wy * noiseScale, octaves, lacunarity, gain) * noiseAmplitude;
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

// Returns one SVG path `d` string covering every traced landmass as
// separate `M...Z` subpaths -- render with fill-rule="evenodd" so a rare
// noise-carved "lake" fully inside a landmass (an interior contour) cuts
// a hole correctly regardless of which way either loop happened to wind.
export function traceIslandShapes(circles, canvasBounds, config) {
  const { cellSize, threshold } = config;
  const { H, cols, rows } = buildIslandHeightmap(circles, canvasBounds, config);
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

// Exported for the Node verification harness (land-area-fraction check,
// contour counts) -- not used by the render path itself.
export { buildIslandHeightmap, marchingSquaresSegments, chainSegmentsToPolygons };
