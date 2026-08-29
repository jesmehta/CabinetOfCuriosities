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
// documentation/Landing-page-notes.2.0.md's "Flow field" entries for the design
// conversation.

// v3.6.23 -- demo/comparison build for the "one giant trash drift"
// discussion (documentation/conversation-landing-page-v3.md): every particle otherwise
// samples the exact same deterministic field, so the only thing telling
// two particles apart is position, and a smooth field means nearby
// particles look identical. Assigns each particle a small personal
// "character" via a low-discrepancy (Weyl/golden-ratio) sequence keyed
// to an incrementing id, NOT independent Math.random() calls -- random
// offsets can collide/cluster (two nearby particles drawing similar
// personalities purely by chance, especially as particle count grows --
// the birthday paradox in 2D), which would fail to decorrelate exactly
// the clumps this exists to fix. A low-discrepancy sequence spreads
// personalities evenly by construction, no luck involved, and gets
// BETTER spaced as id grows, not worse.
//
// v3Config.particles.personalityMode: "off" (default), "bias", "offset",
// or "both".
// - "bias": a constant personal speedMult and a constant personal
//   dirRotate (radians) applied every step -- same path, different pace/
//   heading, like a boat with a slightly different engine or keel.
//   Divergence between two nearby particles builds up over their
//   travel time, not instant.
// - "offset": a constant personal (offsetX, offsetY) added to the
//   CURRENT's own sampling position only (see vectorAt()'s own comment
//   in cabinet-v3-flowfield.js -- never touches the coast/repulsion
//   gradient, so this can't affect land-avoidance accuracy). Same
//   general current, different local weather -- two particles standing
//   at the same point can genuinely curl differently, from frame one,
//   since they're reading different structure in the same noise field.
// - "both": both of the above together.
let nextPersonalityId = 0;

function personalityFor(id, config) {
  const mode = config.personalityMode;
  if (!mode || mode === "off") return { offsetX: 0, offsetY: 0, speedMult: 1, dirRotate: 0 };

  // Four independent-looking [0,1) sequences off ONE incrementing id,
  // via four different irrational multipliers (mod 1) -- the standard
  // low-discrepancy trick, cheap (a multiply + mod each), no lookup
  // table, no RNG state to manage.
  const t1 = (id * 0.6180339887498949) % 1; // golden ratio conjugate
  const t2 = (id * 0.4142135623730951) % 1; // sqrt(2) - 1
  const t3 = (id * 0.3027756377319946) % 1; // (sqrt(13) - 3) / 2
  const t4 = (id * 0.2360679774997896) % 1; // (sqrt(5) - 2)

  const offsetRange = config.personalityOffsetRange ?? 120; // world px
  const speedMultMin = config.personalitySpeedMultMin ?? 0.75;
  const speedMultMax = config.personalitySpeedMultMax ?? 1.35;
  const dirRotateMaxDeg = config.personalityDirRotateMaxDeg ?? 25;

  const useOffset = mode === "offset" || mode === "both";
  const useBias = mode === "bias" || mode === "both";

  return {
    offsetX: useOffset ? (t1 - 0.5) * 2 * offsetRange : 0,
    offsetY: useOffset ? (t2 - 0.5) * 2 * offsetRange : 0,
    speedMult: useBias ? speedMultMin + t3 * (speedMultMax - speedMultMin) : 1,
    dirRotate: useBias ? (t4 - 0.5) * 2 * dirRotateMaxDeg * (Math.PI / 180) : 0
  };
}

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

// v3.6.22 -- rejection-samples random points inside canvasBounds
// looking for one that's water but has land within ringRadius (checked
// at 8 points around a circle -- cheap, isLandFn is just a bilinear
// heightmap lookup, no noise evaluation). Returns null if nothing found
// within `attempts` tries (a large landless stretch of open canvas, or
// bad luck) -- caller falls back to a normal off-canvas spawn rather
// than looping forever or accepting a bad point.
function pickCoastalSpawnPoint(canvasBounds, isLandFn, rng, attempts = 40) {
  const ringOffsets = 8;
  const ringRadius = 18;
  for (let i = 0; i < attempts; i++) {
    const x = canvasBounds.x + rng() * canvasBounds.width;
    const y = canvasBounds.y + rng() * canvasBounds.height;
    if (isLandFn(x, y)) continue; // must itself be water
    let nearLand = false;
    for (let k = 0; k < ringOffsets; k++) {
      const a = (k / ringOffsets) * Math.PI * 2;
      if (isLandFn(x + Math.cos(a) * ringRadius, y + Math.sin(a) * ringRadius)) {
        nearLand = true;
        break;
      }
    }
    if (nearLand) return [x, y];
  }
  return null;
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
//
// activeAt (v3.6.22, defaults to `t` -- immediately active): the
// elapsed-time mark before which stepParticle() below leaves this
// particle untouched. spawnParticle() itself always spawns immediately
// active -- respawns mid-simulation are already naturally staggered by
// whatever caused them, so there's nothing to spread out. Only
// createParticlePool() (a whole batch appearing at once -- initial page
// load, or a live pool resize) overrides this, see its own comment.
//
// isLandFn/repulsionFn (v3.6.22, both optional -- null/omitted disables
// coastal spawning entirely, same "just don't pass it" pattern as
// isLandFn elsewhere in this module): config.coastSpawnFraction chance
// of spawning at a coastal water point (pickCoastalSpawnPoint() above)
// instead of the usual off-canvas arc/ring point -- direct request, "can
// respawn on a coast as well... shore repulsion takes them out." Applies
// to EVERY spawn, not just mid-simulation respawns (an explicit choice --
// also softens the very issue that prompted the wider spawn arc, v3.6.22
// above, since coastal points land wherever islands actually are, not
// funnelled through the SW entry). If a coastal point is found,
// config.coastSpawnDirMode picks the initial direction: "repulsion" (the
// exact, un-blended push straight off the shore, repulsionFn) or
// anything else (the normal blended-field initialDirection(), same as
// every other spawn) -- kept switchable, not decided yet, so both can be
// compared live via the dev panel.
// personality (v3.6.23, see personalityFor() above): assigned here, once
// per spawn, off a fresh incrementing id -- covers both mid-simulation
// respawns and every particle in a batch (createParticlePool() below
// doesn't need its own logic for this, unlike activeAt's stagger).
export function spawnParticle(canvasBounds, padding, sampleFn, isLandFn, repulsionFn, t, rng, config) {
  const wantsCoastal = isLandFn && rng() < (config.coastSpawnFraction ?? 0);
  const coastalPoint = wantsCoastal ? pickCoastalSpawnPoint(canvasBounds, isLandFn, rng) : null;
  const [x, y] = coastalPoint || pickSpawnPoint(canvasBounds, padding, config, rng);

  const [dirX, dirY] = coastalPoint && config.coastSpawnDirMode === "repulsion" && repulsionFn
    ? repulsionFn(x, y)
    : initialDirection(x, y, t, canvasBounds, sampleFn);

  const personality = personalityFor(nextPersonalityId++, config);

  return { x, y, dirX, dirY, checkX: x, checkY: y, checkT: t, activeAt: t, coastal: !!coastalPoint, ...personality };
}

// v3.6.22 -- direct feedback: spawning the whole pool at once made every
// particle share the exact same clock phase, reading as a synchronised
// "wave" rather than organic ambient traffic (all sharing the current's
// own driftSpeedX/Y phase, the coast tangent's coastTangentDrift phase,
// etc, until enough individual exits/respawns desynchronised them by
// chance). Each particle in a fresh batch gets a random activeAt within
// [t, t + spawnStaggerMax] -- stepParticle() leaves it sitting at its
// spawn point until then. Applies to ANY fresh batch, not just the very
// first page load (a live pool resize via the dev panel's Base count
// slider is exactly the same situation).
//
// Only staggers ARC/off-canvas spawns (p.coastal === false) -- a coastal
// spawn sits INSIDE the visible canvas, so freezing it there for up to
// spawnStaggerMax seconds would be a visible stuck-looking boat, not the
// invisible-because-off-canvas wait the stagger relies on elsewhere.
export function createParticlePool(count, canvasBounds, padding, sampleFn, isLandFn, repulsionFn, t, rng, config) {
  return Array.from({ length: count }, () => {
    const p = spawnParticle(canvasBounds, padding, sampleFn, isLandFn, repulsionFn, t, rng, config);
    if (!p.coastal) p.activeAt = t + rng() * (config.spawnStaggerMax ?? 0);
    return p;
  });
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
//
// repulsionFn(x, y) (v3.6.22, optional -- omitted just disables the
// "repulsion" coastSpawnDirMode option, see spawnParticle()'s own
// comment): threaded through to the respawn-in-place spawnParticle()
// call below, same as isLandFn already was.
export function stepParticle(p, sampleFn, isLandFn, repulsionFn, t, canvasBounds, padding, dt, config, rng, allowRespawn = true) {
  // v3.6.22 -- spawn-stagger gate (see createParticlePool()'s own
  // comment): left completely untouched (no field sample, no movement)
  // until its own activeAt -- it's sitting off-canvas already, so this
  // is invisible, and skipping the sample entirely is a small free
  // efficiency win when a big batch is staggered at once.
  if (t < p.activeAt) return false;

  // v3.6.23 -- p.offsetX/Y (personalityFor(), "offset"/"both" modes):
  // shifts only the current's own sampling position (see vectorAt()'s
  // own comment in cabinet-v3-flowfield.js) -- 0/0 when personality mode
  // is off or "bias" only, so this is a no-op call shape otherwise.
  let [vx, vy] = sampleFn(p.x, p.y, t, p.offsetX || 0, p.offsetY || 0);
  // p.dirRotate ("bias"/"both" modes): a small constant personal
  // rotation applied to the sampled direction every step, before
  // normalizing -- same field, this particle just consistently veers a
  // little off it, like a boat with a slightly different heading.
  if (p.dirRotate) {
    const cos = Math.cos(p.dirRotate), sin = Math.sin(p.dirRotate);
    const rvx = vx * cos - vy * sin;
    const rvy = vx * sin + vy * cos;
    vx = rvx;
    vy = rvy;
  }
  const mag = Math.hypot(vx, vy);
  if (mag > 1e-9) {
    p.dirX = vx / mag;
    p.dirY = vy / mag;
  } // else: keep drifting in whatever direction it was already going

  // p.speedMult ("bias"/"both" modes, default 1): a constant personal
  // pace, same "slightly different engine" idea as dirRotate above.
  const speed = Math.min(config.maxSpeed, (config.baseSpeed + config.speedGain * mag) * (p.speedMult || 1));
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
    const fresh = spawnParticle(canvasBounds, padding, sampleFn, isLandFn, repulsionFn, t, rng, config);
    p.x = fresh.x;
    p.y = fresh.y;
    p.dirX = fresh.dirX;
    p.dirY = fresh.dirY;
    p.checkX = fresh.checkX;
    p.checkY = fresh.checkY;
    p.checkT = fresh.checkT;
    p.activeAt = fresh.activeAt;
    p.coastal = fresh.coastal;
    p.offsetX = fresh.offsetX;
    p.offsetY = fresh.offsetY;
    p.speedMult = fresh.speedMult;
    p.dirRotate = fresh.dirRotate;
  }
  return false;
}
