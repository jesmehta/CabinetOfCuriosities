// Particle advection along the flow field -- v3.6.17, entry-arc spawn
// bias + stuck-safety-net added v3.6.19. Pure logic, no DOM, same split
// rationale as cabinet-v3-flowfield.js and its own siblings.
// cabinet-v3-layout.js owns the SVG elements and the
// requestAnimationFrame loop; this module only decides where a particle
// IS, never how it's drawn.
//
// Particles spawn off-canvas (on a padded ring around canvasBounds, but
// see spawnDirX/Y below -- v3.6.19 clusters that spawn point into one
// arc rather than the whole ring uniformly), drift across following the
// flow field, and recycle back to a fresh off-canvas point whenever they
// wander back outside that same padded ring -- one mechanism handles
// both "enter" and "exit," since it's the same rect test either way. See
// Landing-page-notes.2.0.md's "Flow field" entries for the design
// conversation.

// Walks a perimeter-distance `d` (0..2*(w+h)) around canvasBounds
// expanded by `padding` into a world (x, y) point -- corners land at
// d=0 (top-left), d=w (top-right), d=w+h (bottom-right), d=2w+h
// (bottom-left), same order used throughout this file.
function pointAtPerimeterOffset(canvasBounds, padding, d) {
  const x0 = canvasBounds.x - padding;
  const y0 = canvasBounds.y - padding;
  const w = canvasBounds.width + padding * 2;
  const h = canvasBounds.height + padding * 2;

  if (d < w) return [x0 + d, y0];
  d -= w;
  if (d < h) return [x0 + w, y0 + d];
  d -= h;
  if (d < w) return [x0 + w - d, y0 + h];
  d -= w;
  return [x0, y0 + h - d];
}

function perimeterOf(canvasBounds, padding) {
  return 2 * (canvasBounds.width + padding * 2 + canvasBounds.height + padding * 2);
}

// Which of the 4 ring corners best matches a given (unit-ish) direction
// -- e.g. dirX=-1, dirY=1 (screen-space: left+down) picks the
// bottom-left/south-west corner. Used to find "the entry arc centre"
// for the spawn bias below, expressed as the SAME d-coordinate
// pointAtPerimeterOffset() walks.
function nearestCornerOffset(canvasBounds, padding, dirX, dirY) {
  const w = canvasBounds.width + padding * 2;
  const h = canvasBounds.height + padding * 2;
  const corners = [
    { d: 0, x: -1, y: -1 },
    { d: w, x: 1, y: -1 },
    { d: w + h, x: 1, y: 1 },
    { d: 2 * w + h, x: -1, y: 1 }
  ];
  let best = corners[0], bestDot = -Infinity;
  corners.forEach(c => {
    const dot = c.x * dirX + c.y * dirY;
    if (dot > bestDot) { bestDot = dot; best = c; }
  });
  return best.d;
}

// v3.6.19 -- spawnDirX/spawnDirY (a rough direction, doesn't need to be
// unit length): if given, spawn points cluster in an arc around
// whichever ring corner best matches that direction (arcFraction, 0..1,
// is how wide that arc is as a fraction of the whole perimeter) instead
// of scattering uniformly around all 4 sides. This is what makes
// particles "start from one offscreen area and spread out" -- entering
// from one side (matching the prevailing current direction below,
// reversed -- particles enter from upstream) rather than from
// everywhere at once. No spawnDirX/Y -> old uniform-ring behaviour.
function pickSpawnPoint(canvasBounds, padding, config, rng) {
  const perimeter = perimeterOf(canvasBounds, padding);
  if (config.spawnDirX == null && config.spawnDirY == null) {
    return pointAtPerimeterOffset(canvasBounds, padding, rng() * perimeter);
  }
  const centre = nearestCornerOffset(canvasBounds, padding, config.spawnDirX, config.spawnDirY);
  const spread = (rng() - 0.5) * (config.spawnArcFraction ?? 0.35) * perimeter;
  const d = ((centre + spread) % perimeter + perimeter) % perimeter;
  return pointAtPerimeterOffset(canvasBounds, padding, d);
}

// Direction a fresh particle should start moving: the field's own
// sampled direction at that point, falling back to "toward the canvas
// centre" on the rare chance the field is ~0 there (curl noise can
// briefly near-cancel at isolated points) -- a spawned particle should
// never sit dead still.
function initialDirection(x, y, t, canvasBounds, sampleFn) {
  const [vx, vy] = sampleFn(x, y, t);
  const mag = Math.hypot(vx, vy);
  if (mag > 1e-9) return [vx / mag, vy / mag];

  const cx = canvasBounds.x + canvasBounds.width / 2;
  const cy = canvasBounds.y + canvasBounds.height / 2;
  const dx = cx - x, dy = cy - y;
  const d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}

// sampleFn: (x, y, t) => [vx, vy] -- t is elapsed seconds, passed
// straight through to cabinet-v3-flowfield.js's createFlowSampler()
// (whose OWN doc comment explains why sampling needs a time dimension at
// all: it's what keeps a curl-noise vortex from trapping a particle in a
// closed orbit forever). This module doesn't know or care that t drives
// drift internally -- it just threads it through on every sample.
//
// checkX/checkY/checkT (v3.6.19): a fresh reference point/time for the
// stuck-safety-net in stepParticle() below -- every newly spawned
// particle starts its own stuck-check window from scratch.
export function spawnParticle(canvasBounds, padding, sampleFn, t, rng, config) {
  const [x, y] = pickSpawnPoint(canvasBounds, padding, config, rng);
  const [dirX, dirY] = initialDirection(x, y, t, canvasBounds, sampleFn);
  return { x, y, dirX, dirY, checkX: x, checkY: y, checkT: t };
}

export function createParticlePool(count, canvasBounds, padding, sampleFn, t, rng, config) {
  return Array.from({ length: count }, () => spawnParticle(canvasBounds, padding, sampleFn, t, rng, config));
}

// Advances one particle by `dt` seconds in place (mutates `p`), then
// recycles it back to a fresh off-canvas point either because it's
// drifted outside the padded ring, OR (v3.6.19) because it's barely
// moved over the last stuckCheckInterval seconds -- a cheap safety net
// for whatever residual trap the field-level fixes (current/coast
// tangent alignment, time-drift) don't happen to catch: one distance
// check per particle every few seconds, no neighbour/density queries.
//
// Direction always follows the field exactly; SPEED is a clamped
// function of the field's raw magnitude (baseSpeed floor so a particle
// never goes fully still even where the field is momentarily ~0, +
// speedGain*magnitude for visible acceleration near a coastline, capped
// at maxSpeed so that acceleration -- which can otherwise run very large
// right at the coast, see coastStrength's own field notes in
// cabinet-v3-data.js -- never reads as a particle darting like a jet).
//
// isLandFn(x, y) (v3.6.21, optional -- null skips this check entirely):
// a HARD backstop, separate from the coast vector's soft push. The coast
// vector is just one additive term summed with the current, not a wall,
// so it can be partly or fully cancelled at points where the current
// happens to point toward the coast too -- reported directly as
// land-crossing that persisted even once the coastTangentDrift bug
// itself was fixed. If the step below would end ON land, the move is
// rejected outright (held at the pre-step position) rather than merely
// discouraged -- the coast force keeps acting on subsequent frames, and
// the stuck-check below catches a particle that's genuinely pinned
// against a wall for good.
//
// allowRespawn (v3.6.21, default true): when a particle would otherwise
// recycle (stuck OR off-canvas), this now decides whether it actually
// respawns in place (unchanged behaviour) or is instead left alone and
// signalled for removal via the return value (true = "caller should
// remove me from the pool"). Lets cabinet-v3-layout.js's tickParticles()
// grow the pool above its base count (click-to-launch) and let it drain
// back down on its own -- see that function's own comment -- without
// this module knowing anything about pool size or DOM at all.
export function stepParticle(p, sampleFn, isLandFn, t, canvasBounds, padding, dt, config, rng, allowRespawn = true) {
  const [vx, vy] = sampleFn(p.x, p.y, t);
  const mag = Math.hypot(vx, vy);
  if (mag > 1e-9) {
    p.dirX = vx / mag;
    p.dirY = vy / mag;
  } // else: keep drifting in whatever direction it was already going

  const speed = Math.min(config.maxSpeed, config.baseSpeed + config.speedGain * mag);
  const prevX = p.x, prevY = p.y;
  p.x += p.dirX * speed * dt;
  p.y += p.dirY * speed * dt;

  if (isLandFn && isLandFn(p.x, p.y)) {
    p.x = prevX;
    p.y = prevY;
  }

  let stuck = false;
  if (t - p.checkT > config.stuckCheckInterval) {
    stuck = Math.hypot(p.x - p.checkX, p.y - p.checkY) < config.stuckThreshold;
    p.checkX = p.x; p.checkY = p.y; p.checkT = t;
  }

  const minX = canvasBounds.x - padding;
  const minY = canvasBounds.y - padding;
  const maxX = canvasBounds.x + canvasBounds.width + padding;
  const maxY = canvasBounds.y + canvasBounds.height + padding;
  const offCanvas = p.x < minX || p.x > maxX || p.y < minY || p.y > maxY;

  if (stuck || offCanvas) {
    if (!allowRespawn) return true;
    const fresh = spawnParticle(canvasBounds, padding, sampleFn, t, rng, config);
    p.x = fresh.x;
    p.y = fresh.y;
    p.dirX = fresh.dirX;
    p.dirY = fresh.dirY;
    p.checkX = fresh.checkX;
    p.checkY = fresh.checkY;
    p.checkT = fresh.checkT;
  }
  return false;
}
