// Pure logic: scatter seed points, order them into a reading sequence,
// then grow them into a packed archipelago. No DOM access -- same split
// rationale as cabinet-v3-treemap.js.
//
// v3.1 rewrite. The v3.0 pass used a row/flow packer (place circles
// directly in a grid-like left-to-right, wrap-per-row sequence) to get
// clean reading order without a reassignment step -- functionally
// correct, but it reads as a grid, not an archipelago, which was the
// explicit complaint. This version instead ports the actual growth
// algorithm from the user's own p5-circle-packing library
// (jesmehta/p5-circle-packing, CirclePack.js -- getCirPack/Bubble/
// growBub/checkPos/compareDist): seed a point per item, then grow every
// circle's radius by a small fixed step each pass, stopping a circle
// permanently the moment growing it another step would touch a
// neighbour or the region boundary, using squared-distance comparisons
// throughout so no per-pair sqrt is ever computed. That growth process
// is what makes the result read as organic packing rather than a laid-
// out grid -- final size is mostly "how much open space was actually
// near this seed," not a size decided in advance.
//
// The reading-order problem (order should flow top-left to bottom-right
// without literally gridding the points) is solved upstream of growth,
// not by it: scatter seed points with genuine random (x, y), then
// derive a reading sequence by grouping points into horizontal bands
// (~10-20% of the region's height each) and sorting by x *within* each
// band -- "top-left to bottom-right," banded, not gridded, since points
// inside one band still sit at whatever random x/y the scatter gave
// them. Entries (sorted by `order`) and extras are zipped onto that
// sequence 1:1, and only *then* does each point get a weight-derived
// starting radius and enter the growth phase -- so, unlike the row-flow
// version, there's no separate "pack then relabel" step to desync:
// position is decided once (scatter + band-sort + order-zip) and never
// moves again; only radius changes, and only for the point it already
// belongs to.
//
// v3.3: growth is now a single GLOBAL pass across every section's
// circles at once, not one independent pass per region. Scatter/order/
// zip still happen per region (a section's own entries still cluster
// near their own label, in their own `order` sequence) -- only
// growCircles() changed, from "bounded by this one region's rect" to
// "bounded by the whole canvas, obstacles are every region's label
// band, collision is against every circle regardless of which section
// seeded it." This is what lets a circle spill past its own region's
// (now purely decorative) outline into a quieter neighbour's space,
// while still never crossing the page edge, another island, or any
// label band. centerClusterInRect() (the v3.2 per-region re-centering
// step) is NOT used with global growth -- its safety guarantee ("the
// cluster's own bounding box can't be bigger than the rect it grew in,
// so centering it can't push it back outside") assumed growth was
// bounded by that same rect; once a region's circles can legitimately
// extend past their own rect, translating them back to center on it
// affords no such guarantee anymore. See cabinet-v3-layout.js's
// buildAllArchipelagos() for the actual global-growth call site.

// Mulberry32 -- small, fast, deterministic PRNG. Seeded per section
// (not Math.random()) so scatter positions are stable across reloads --
// consistent with "recomputed only when entries/sections change," not
// every page view (see Landing-page-notes.2.0.md).
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

export function seedFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Convenience: string in, deterministic RNG function out. Same seed
// string always produces the same sequence -- this is the only source
// of randomness anywhere in the v3 render path, and it's seeded by
// section id, not Math.random(), so a section's archipelago looks the
// same across reloads until its own content changes.
export function createSeededRng(seedString) {
  return mulberry32(seedFromString(seedString));
}

// count points scattered uniformly at random inside `rect`. Light
// minimum-separation rejection sampling (a fixed, weight-independent
// distance -- real per-item radii aren't known yet at this stage, see
// the file-level comment above) avoids the occasional wasted seed that
// lands almost exactly on top of another and would otherwise grow to a
// near-zero radius before its first collision.
//
// `minSeparation` MUST cover the worst case: two points that both end
// up hosting the largest possible starting circle (minRadius +
// maxWeightExtra) and still not already overlap, plus a buffer -- see
// safeMinSeparation() below, which is what actually computes this from
// the pack config rather than a hand-tuned number that could drift out
// of sync with minRadius/maxWeightExtra. growCircles() only ever *stops*
// growth on contact, it never resolves an overlap that existed before
// growth started, so this has to be right going in.
//
// `rect` should already be inset by minRadius (see insetRect() below)
// before being passed here -- that's what keeps a freshly-scattered
// point far enough from the region's own edge that its forced minimum
// starting radius doesn't itself violate the boundary; this function
// only handles point-to-point separation, not point-to-edge.
export function insetRect(rect, d) {
  return { x: rect.x + d, y: rect.y + d, width: Math.max(0, rect.width - 2 * d), height: Math.max(0, rect.height - 2 * d) };
}

// "Don't fall within each other's min-dia + 25%" -- has to be measured
// against the worst case a scattered point can actually start at, not
// just minRadius's own floor. A point isn't guaranteed to start small
// and grow gradually into its target: growCircles()'s boundary clamp
// (see distanceToBoundary there) lets a point with generous clearance
// to its region's *edge* start at or near its full weight-scaled
// target immediately -- e.g. a weight-3 item scattered with 22px of
// boundary clearance starts at radius 22 right away, not at minRadius
// and growing up to it. A separation floor based on minRadius alone
// (tried first, seemed like the more literal reading of "min dia") let
// exactly this happen: two points cleared *that* floor at scatter time
// but one of them then started already most of the way to `target`,
// immediately colliding with the other before growth even had a chance
// to run a single shared pass -- caught by the Node overlap check
// against real content (bookshelf's Asimov/coming-soon pair), not a
// screenshot. Using the true worst case (minRadius + maxWeightExtra)
// closes that gap: every pair is far enough apart to tolerate *either*
// one instantly starting at its full target.
export function safeMinSeparation(config) {
  const maxStartDiameter = 2 * (config.minRadius + config.maxWeightExtra);
  return Math.max(config.minSeparation, maxStartDiameter * 1.25);
}

// `existingPoints` (v3.3): points already placed *elsewhere* -- other
// sections' seeds, when called from cabinet-v3-layout.js's global scatter
// loop -- that new points must also keep `minSeparation` away from, even
// though this call only ever returns its own `count` new points. Needed
// once growth stopped being scoped per region (see growCircles()'s
// file-level v3.3 note): two regions sit only ~2x regionGap apart, close
// enough that without this, a point from one region and a point from its
// neighbour could easily scatter within minSeparation of each other --
// invisible to a per-region-only check, but exactly the scenario that
// caused the Asimov/coming-soon collision this same separation logic was
// built to prevent, just across a region seam instead of within one
// region. Defaults to none, for callers that only ever care about one
// self-contained point set.
// Warps a uniform [0,1) sample toward 0.5 -- centerBias > 1 pulls the
// result toward the middle (1 = untouched, uniform). Applied per axis
// rather than radially: simpler, and it naturally follows the rect's
// own aspect ratio instead of assuming a region is square.
function centerBiased(u, centerBias) {
  if (centerBias === 1) return u;
  const signed = u * 2 - 1;
  const warped = Math.sign(signed) * Math.pow(Math.abs(signed), centerBias);
  return (warped + 1) / 2;
}

export function generateScatterPoints(count, rect, rng, minSeparation, existingPoints = [], centerBias = 1) {
  const points = [];
  const maxAttemptsPerPoint = 60;

  for (let i = 0; i < count; i++) {
    let placed = false;
    // Tracks the least-bad candidate seen (max of its own min-distance
    // to every already-placed point), used as a fallback -- see below.
    let best = null;
    let bestScore = -Infinity;

    for (let attempt = 0; attempt < maxAttemptsPerPoint && !placed; attempt++) {
      const x = rect.x + centerBiased(rng(), centerBias) * rect.width;
      const y = rect.y + centerBiased(rng(), centerBias) * rect.height;

      let minDist2 = Infinity;
      const clear = [...existingPoints, ...points].every(p => {
        const dx = p.x - x;
        const dy = p.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDist2) minDist2 = d2;
        return d2 >= minSeparation * minSeparation;
      });

      if (clear) {
        points.push({ x, y });
        placed = true;
      } else if (minDist2 > bestScore) {
        // minDist2 only stays Infinity here when both existingPoints and
        // this call's own points-so-far are empty, in which case `clear`
        // above was already true and this branch is unreachable -- no
        // separate guard needed for "nothing to compare against yet".
        bestScore = minDist2;
        best = { x, y };
      }
    }

    if (!placed) {
      // Space is too crowded relative to minSeparation to fully satisfy
      // -- use whichever of the attempts above kept the most distance
      // from every already-placed point, rather than one more blind
      // random draw (which could easily be worse than every attempt
      // already tried). Still not a guarantee of full separation in a
      // genuinely cramped region; growCircles() stopping growth on
      // contact keeps any resulting closeness from compounding further,
      // which is what's actually load-bearing here.
      points.push(best || { x: rect.x + centerBiased(rng(), centerBias) * rect.width, y: rect.y + centerBiased(rng(), centerBias) * rect.height });
    }
  }

  return points;
}

// v3.4: centers a section's points (their bounding box, not yet grown
// into circles -- no radius exists at this stage) on `rect`'s center,
// before growth ever runs. Direct answer to "is the centering happening
// -- it doesn't seem so": v3.2's centering (centerClusterInRect(),
// operating on *grown* circles) had to be dropped in v3.3 because its
// safety argument depended on growth being bounded by the same rect it
// centered against, which stopped holding once growth went global.
// Centering the raw points instead, before growth, sidesteps that
// problem entirely -- there's no "was this translation still safe
// against whatever growth already decided" question to ask, because
// nothing has grown yet. Growth (and its cross-region collision
// handling, unaffected by this) runs on whatever positions come out of
// this function exactly as it would run on any other valid starting
// positions.
//
// v3.4.1: `basisPoints` (defaults to `points` itself) is what the
// bounding box is actually measured against -- `points` is still what
// gets translated, all of it. Centering on the *full* point set
// (entries and filler extras together, the original v3.4 behaviour)
// visibly wasn't centering the entries: a handful of filler circles
// scattered toward one side could pull the computed "center" away from
// where the real content actually was, so the entries themselves still
// read off-center. Callers should pass only the real-entry points as
// `basisPoints` (see cabinet-v3-layout.js's `buildSeedsForSection()`) --
// extras then ride along on the same translation without influencing
// where it centers to, which is the intended effect: they're
// decoration, not something a viewer is trying to visually balance
// entries against.
//
// Always safe against `rect`'s own bounds *for the basis set*, same
// reasoning as centerClusterInRect() before it: a bounding box can't be
// wider or taller than the `rect` its points were scattered into, and
// centering a box that fits inside a larger one only moves it to a more
// central position, never past the larger box's edge. That guarantee
// covers `basisPoints` specifically -- non-basis points (extras) are
// translated by the same delta but aren't re-validated against `rect`
// afterward; a delta sized to re-center a lopsided entry cluster could
// in principle carry a filler point that started near the opposite edge
// of `rect` out past it. Left unclamped deliberately: growCircles()
// already treats "this point turned out to be outside its bounds" as a
// safe, if unglamorous, starting state (radius clamps down to 0 rather
// than going invalid), which is the explicit call made here -- extras
// ending up smaller (or invisible) in that rare case is an acceptable
// outcome, not a bug to guard against with extra clamping.
//
// NOT safe, and not checked here, against *other* sections' already-
// placed points (cabinet-v3-layout.js's `allPlacedPoints`) -- centering
// can shift a section's points by a large fraction of its own
// scatterArea, which could plausibly move some of them closer to a
// neighbouring section's points than the pre-centering scatter
// validated. Caller's responsibility: cabinet-v3-layout.js applies this
// before pushing a section's points onto `allPlacedPoints`, so
// subsequent sections' separation checks see the final, centered
// positions -- but a shift large enough to violate separation against a
// section processed *earlier* isn't re-validated. See
// Landing-page-notes.2.0.md for whether this showed up in practice.
export function centerPointsInRect(points, rect, basisPoints = points) {
  if (points.length === 0) return points;
  const basis = basisPoints.length > 0 ? basisPoints : points;

  const minX = Math.min(...basis.map(p => p.x));
  const maxX = Math.max(...basis.map(p => p.x));
  const minY = Math.min(...basis.map(p => p.y));
  const maxY = Math.max(...basis.map(p => p.y));

  const dx = rect.x + rect.width / 2 - (minX + maxX) / 2;
  const dy = rect.y + rect.height / 2 - (minY + maxY) / 2;

  // Spreads `...p` (not just x/y) so this also works when `points` are
  // already-zipped items (id/kind/weight/... alongside x/y), not just
  // bare {x, y} pairs -- see cabinet-v3-layout.js's buildSeedsForSection(),
  // which centers after the zip specifically so `basisPoints` can filter
  // by `kind`.
  return points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
}

// Reading order over scattered (non-gridded) points: group into
// horizontal bands of `bandHeightRatio * rect.height` each, sort points
// within a band by x ascending, concatenate bands top to bottom. This
// is what makes "top-left to bottom-right" true of a random scatter
// without forcing the points themselves onto a grid -- only the *order*
// they're read in is banded, not their actual (x, y).
export function sortPointsByBandReadingOrder(points, rect, bandHeightRatio) {
  const bandHeight = Math.max(1, rect.height * bandHeightRatio);
  return [...points].sort((a, b) => {
    const bandA = Math.floor((a.y - rect.y) / bandHeight);
    const bandB = Math.floor((b.y - rect.y) / bandHeight);
    if (bandA !== bandB) return bandA - bandB;
    return a.x - b.x;
  });
}

// Starting radius = a hard floor (minRadius, every circle gets at
// least this much before growth even begins) plus a weight-scaled
// extra on top (sqrt-scaled against this section's own weight range,
// same area-fairness convention used everywhere else weight drives
// size). Two independent knobs, not one range, because they answer two
// different complaints: "some circles are too small" (raise minRadius)
// versus "weight isn't visually distinguishable enough" (raise
// maxWeightExtra) are separate tuning questions.
function packRadiusFor(weight, minWeight, minRadius, maxWeightExtra, maxWeightRatio) {
  const t = Math.min(1, Math.sqrt((weight - minWeight) / (maxWeightRatio || 1)));
  return minRadius + maxWeightExtra * t;
}

// Squared distance from a circle's center to the nearest point on an
// axis-aligned rect -- 0 if the center is inside the rect. Used to test
// a circle against a rectangular obstacle (a label band) the same way
// compareDist() tests it against another circle, just without a second
// radius on the obstacle's side.
function circleRectDistance2(cx, cy, rect) {
  const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy;
}

// items: [{ id, kind, weight, x, y, maxRadius? }] -- already positioned
// (from generateScatterPoints + sortPointsByBandReadingOrder + the
// caller's own order-zip) and about to receive a weight-derived
// starting radius. Per-item `maxRadius` overrides `config.maxRadius`
// when present -- lets each item's cap derive from the region it was
// seeded in (see cabinet-v3-layout.js) even when growth itself, below,
// is no longer scoped to that region.
//
// bounds: the outer canvas rect (v3.3 -- previously each region's own
// rect). obstacles: rects a circle must also never cross -- every
// region's label band, from every section, not just its own (v3.3).
// Together these implement "bounded by the page edges... but not
// region-region internal edges": nothing stops a circle at its own
// region's boundary anymore, only at the true canvas edge, another
// circle (from *any* region -- `items` is the full cross-section set,
// see buildAllArchipelagos() in cabinet-v3-layout.js), or a label band.
// A circle drifting into a quiet neighbouring region is exactly the
// intended effect, not a bug to guard against.
//
// Direct port of CirclePack.js's growBub()/compareDist(): every circle
// still growing attempts one growStep per pass; if that step would
// collide with any other circle, any obstacle, or the outer boundary,
// it stops permanently (no partial growth, no retry) -- otherwise it
// grows. Collision is always a squared-distance compare against squared
// summed radii (+ padding), never a sqrt, exactly per the
// "Distance-Squared" ask. Runs until nothing is growing (or
// maxIterations, a defensive cap the reference didn't need since growth
// strictly monotonically increases stopped-count each pass over a
// finite item set -- kept here anyway as standard defensive practice,
// not expected to ever bind).
export function growCircles(items, bounds, obstacles, config) {
  const { minRadius, maxWeightExtra, growStep, padding, maxRadius: defaultMaxRadius, maxIterations } = config;
  const minWeight = Math.min(...items.map(i => i.weight));
  const maxWeightRatio = Math.max(...items.map(i => i.weight)) - minWeight;

  const withinBounds = (c, r) =>
    c.x - r >= bounds.x && c.x + r <= bounds.x + bounds.width &&
    c.y - r >= bounds.y && c.y + r <= bounds.y + bounds.height;

  // Boundary-safe start, kept as a defensive clamp: the *expected* path
  // is that every point was already scattered into a rect pre-inset by
  // minRadius (see insetRect()), so distanceToBoundary(x, y) should
  // already be >= minRadius for every point and this clamp shouldn't
  // bind in practice. Kept anyway as a hard guarantee against float
  // slop -- a circle must never start outside the true canvas
  // regardless of why a point ended up close to an edge.
  const distanceToBoundary = (x, y) =>
    Math.min(x - bounds.x, bounds.x + bounds.width - x, y - bounds.y, bounds.y + bounds.height - y);

  // Obstacle-safe start (v3.3 addition, found by the Node check rather
  // than assumed away): with growth bounded by the whole canvas instead
  // of one small region (see the v3.3 note above), distanceToBoundary is
  // almost never the binding constraint any more, so most circles start
  // at or near their full weight-scaled `target` immediately rather than
  // growing up to it gradually -- fine against other circles (scatter's
  // safeMinSeparation is sized for exactly this), but a seed scattered
  // close to its *own* region's label band (guaranteed only minRadius of
  // clearance by the scatter inset, not a full `target`'s worth) could
  // start already overlapping that band, with no growth step in between
  // to have caught it. Concretely: `gujarati-type` scattered 14.8px from
  // its own band with a target of ~20px. Clamping the start against
  // obstacle distance too, the same way distanceToBoundary already
  // clamps against the canvas edge, closes this the same way.
  const distanceToObstacles = (x, y) =>
    obstacles.reduce((min, rect) => Math.min(min, Math.sqrt(circleRectDistance2(x, y, rect))), Infinity);

  // Spreads `...item` rather than picking a fixed field set, so any
  // extra data the caller attached at seed time (sectionId, title,
  // href, status, ...) survives growth untouched -- callers shouldn't
  // need a separate id-keyed reattachment pass after this, they can
  // just carry what they need through directly.
  const circles = items.map(item => {
    const target = packRadiusFor(item.weight, minWeight, minRadius, maxWeightExtra, maxWeightRatio);
    const safeLimit = Math.min(distanceToBoundary(item.x, item.y), distanceToObstacles(item.x, item.y));
    const safeStart = Math.min(target, Math.max(0, safeLimit));
    return {
      ...item,
      radius: safeStart,
      maxRadius: item.maxRadius ?? defaultMaxRadius,
      growing: true
    };
  });

  let anyGrowing = true;
  for (let iter = 0; iter < maxIterations && anyGrowing; iter++) {
    anyGrowing = false;

    circles.forEach((c, i) => {
      if (!c.growing) return;

      if (c.radius >= c.maxRadius) {
        c.growing = false;
        return;
      }

      const nextRadius = c.radius + growStep;

      if (!withinBounds(c, nextRadius)) {
        c.growing = false;
        return;
      }

      const blockedByCircle = circles.some((other, j) => {
        if (j === i) return false;
        const dx = other.x - c.x;
        const dy = other.y - c.y;
        const minDist = nextRadius + other.radius + padding;
        return dx * dx + dy * dy < minDist * minDist;
      });

      const blockedByObstacle = obstacles.some(rect => {
        const minDist = nextRadius + padding;
        return circleRectDistance2(c.x, c.y, rect) < minDist * minDist;
      });

      if (blockedByCircle || blockedByObstacle) {
        c.growing = false;
        return;
      }

      c.radius = nextRadius;
      anyGrowing = true;
    });
  }

  return circles.map(({ growing, ...rest }) => rest);
}

// Translates the whole grown cluster (every circle by the same dx/dy)
// so its own bounding box is centered on `rect`'s center, instead of
// wherever growth happened to leave it (uniform random scatter plus
// boundary-constrained growth can leave the cluster's actual bounding
// box off-center within its region -- e.g. biased toward whichever side
// had more open room to grow into). A pure translation, not a rescale:
// every circle's radius and every pairwise distance is unchanged, so
// non-overlap stays exactly as valid as it already was.
//
// Always safe to apply, never needs re-validating against `rect`: the
// cluster's own bounding box can't be wider or taller than `rect`
// (growCircles() never let any circle cross `rect`'s edges to begin
// with), and centering a box that already fits inside a larger one can
// only move it to a more central position, never push it outside.
//
// NOT currently called (v3.3) -- that safety argument depends on growth
// having been bounded by the same `rect` passed in here, which stopped
// being true once growCircles() switched to a single global pass across
// every region at once (see the file-level v3.3 note above). Kept for
// a possible future per-region-only render mode, where the argument
// would hold again.
export function centerClusterInRect(circles, rect) {
  if (circles.length === 0) return circles;

  const minX = Math.min(...circles.map(c => c.x - c.radius));
  const maxX = Math.max(...circles.map(c => c.x + c.radius));
  const minY = Math.min(...circles.map(c => c.y - c.radius));
  const maxY = Math.max(...circles.map(c => c.y + c.radius));

  const dx = rect.x + rect.width / 2 - (minX + maxX) / 2;
  const dy = rect.y + rect.height / 2 - (minY + maxY) / 2;

  return circles.map(c => ({ ...c, x: c.x + dx, y: c.y + dy }));
}
