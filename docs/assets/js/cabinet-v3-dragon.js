// Independent sea-dragon wanderer -- v3.6.24. Pure logic, no DOM, same
// split rationale as cabinet-v3-particles.js and its siblings --
// cabinet-v3-layout.js owns the SVG element and the requestAnimationFrame
// loop, this module only decides where the dragon IS.
//
// Deliberately NOT part of the particle system -- direct, explicit
// requirement: "it does nt drift in the currents, it makes its own
// way... it certainly does not flow as the boats do." Doesn't sample
// vectorAt() at all. Heading instead comes from a SMOOTH noise stream
// sampled over TIME only (fbm2D reused from cabinet-v3-islandshape.js,
// same primitive the flow field's own current uses), not a per-frame
// random increment -- v3.6.24 first cut used `heading +=
// (rng()-0.5)*turnRate*dt` every frame, which is structurally the same
// "naive per-frame jitter" option already rejected for particle
// personalities (see the "one giant trash drift" discussion) for the
// exact same reason: uncorrelated frame-to-frame randomness reads as
// vibration, not a sustained organic wander, even though the DELTA is
// randomized rather than the position -- a continuous noise function of
// t doesn't have that problem, same shape as Perlin-noise steering in
// any creative-coding boids/flow demo.
import { mulberry32, seedFromString, buildPermutation, fbm2D } from "./cabinet-v3-islandshape.js";

// Rejection-samples a random point inside canvasBounds that isn't land --
// same technique as cabinet-v3-particles.js's pickCoastalSpawnPoint(),
// simpler (just needs "in water," not "near a coast" specifically). Used
// only as pickOpenSeaPoint()'s own fallback below, never directly.
function pickWaterPoint(canvasBounds, isLandFn, rng, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    const x = canvasBounds.x + rng() * canvasBounds.width;
    const y = canvasBounds.y + rng() * canvasBounds.height;
    if (!isLandFn || !isLandFn(x, y)) return [x, y];
  }
  return [canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + canvasBounds.height / 2];
}

// v3.6.24 -- true if `x,y` is land itself OR has land within `radius`
// (checked at 8 points around a ring -- cheap, isLandFn is just a
// bilinear heightmap lookup, no noise evaluation). Shared by
// pickOpenSeaPoint() below (spawn/resurface point selection) AND
// stepDragon()'s own live movement check -- direct feedback: "apart from
// spawn/respawn, dragons shouldn't move too close to a coast either," so
// this is deliberately the SAME threshold/check both places use, not two
// separate ideas of "near land."
function isNearLand(x, y, isLandFn, radius) {
  if (!isLandFn) return false;
  if (isLandFn(x, y)) return true;
  const ringOffsets = 8;
  for (let k = 0; k < ringOffsets; k++) {
    const a = (k / ringOffsets) * Math.PI * 2;
    if (isLandFn(x + Math.cos(a) * radius, y + Math.sin(a) * radius)) return true;
  }
  return false;
}

// Rejection-samples a random point inside canvasBounds that's NOT near
// land (isNearLand() above, config.minCoastDistance). Falls back to the
// lenient pickWaterPoint() if nothing satisfies the stricter check within
// `attempts` tries (a small/crowded map with little genuinely open
// water) rather than risk never finding a point at all.
function pickOpenSeaPoint(canvasBounds, isLandFn, rng, config, attempts = 80) {
  if (!isLandFn) return pickWaterPoint(canvasBounds, isLandFn, rng);
  for (let i = 0; i < attempts; i++) {
    const x = canvasBounds.x + rng() * canvasBounds.width;
    const y = canvasBounds.y + rng() * canvasBounds.height;
    if (!isNearLand(x, y, isLandFn, config.minCoastDistance)) return [x, y];
  }
  return pickWaterPoint(canvasBounds, isLandFn, rng);
}

// bobPhase: a personal phase offset for the render-only vertical bob
// cabinet-v3-layout.js applies -- rolled once here so the bob doesn't
// restart from the same point every time the dragon (re)spawns/resurfaces.
// perm: a fresh permutation table, reseeded each spawn (Math.random-
// derived) so reloading the page gives a genuinely different wander
// pattern, not just a different starting point along the same one.
//
// divePhase/divePhaseT/diveScale (v3.6.24): see stepDragon()'s own
// comment for the dive/resurface cycle these drive.
export function spawnDragon(canvasBounds, isLandFn, rng, config) {
  const [x, y] = pickOpenSeaPoint(canvasBounds, isLandFn, rng, config);
  const perm = buildPermutation(mulberry32(seedFromString(`dragon:${Math.floor(rng() * 1e9)}`)));
  return {
    x, y,
    heading: rng() * Math.PI * 2,
    bobPhase: rng() * Math.PI * 2,
    perm,
    divePhase: "swim",
    divePhaseT: 0,
    diveScale: 1
  };
}

// Advances the dragon by `dt` seconds in place (mutates `d`). `t` is the
// same elapsed-seconds clock everything else in this system shares.
//
// Heading = an INTEGRATED angular velocity, not an absolute angle read
// straight off the noise. v3.6.25 -- the original "heading = noise *
// headingSwing" (fixed amplitude scale) was measured empirically: this
// fbm2D output only actually ranges about +/-0.3 to +/-0.5 over a full
// minute for a fixed y-offset (nowhere near the +/-1 to +/-1.75 the old
// comment assumed), so headingSwing was mapping it onto a narrow ~90-120
// degree arc that rarely came close to pointing straight sideways --
// sin(heading) often exceeded cos(heading), so the per-frame displacement
// was mostly vertical even while "swimming," which read as bobbing in
// place rather than travel, and never turned enough to explore the full
// circle (never reversing direction, no leftward swims in the sampled
// range). Integrating instead -- `heading += noise * turnRate * dt` --
// makes the noise a smooth, bounded RATE of turn rather than an absolute
// position in angle-space, so heading now does a proper slow random walk
// around the full circle over time (empirically ~100-150 degrees/minute
// at turnRate 0.6), spending real time near-horizontal, while still never
// jumping frame to frame (noise is continuous, turnRate*dt keeps the
// per-frame increment tiny) -- same "smooth, not per-frame-random"
// requirement as before, just applied to the rate instead of the value.
// config.headingNoiseSpeed still controls how fast the underlying noise
// stream itself evolves.
//
// v3.6.24 -- dive/resurface is EVENT-triggered, not on a timer (a first
// cut used a periodic diveTimer -- direct feedback: "this need not be
// every 30 sec or so, it can be when the dragon approaches a coast").
// Every swim-phase step checks whether the NEXT position would be
// isNearLand() (config.minCoastDistance) -- if so, the step is skipped
// (held at the current position, never actually enters that water) and a
// dive starts right there instead. Canvas-edge proximity alone (not
// coast) just holds position, same as before, no dive -- direct
// feedback specifically named "a coast," not the canvas edge.
//
// dive: diveScale shrinks 1->0 over config.diveDuration (position frozen
// -- cabinet-v3-layout.js reads diveScale to slide the artwork down out
// of its own local clip window, "sinking," not to shrink it). At the
// bottom of the dive a fresh pickOpenSeaPoint() is rolled and the
// dragon's position silently jumps there. surface: diveScale grows 0->1
// over config.surfaceDuration (slides back up into view at the new
// point) before returning to normal wandering.
export function stepDragon(d, isLandFn, canvasBounds, t, dt, config, rng) {
  if (d.divePhase === "dive") {
    d.divePhaseT += dt;
    d.diveScale = Math.max(0, 1 - d.divePhaseT / config.diveDuration);
    if (d.divePhaseT >= config.diveDuration) {
      const [x, y] = pickOpenSeaPoint(canvasBounds, isLandFn, rng, config);
      d.x = x;
      d.y = y;
      d.heading = rng() * Math.PI * 2;
      d.divePhase = "surface";
      d.divePhaseT = 0;
    }
    d.bobPhase += config.bobFreq * dt * Math.PI * 2;
    return;
  }

  if (d.divePhase === "surface") {
    d.divePhaseT += dt;
    d.diveScale = Math.min(1, d.divePhaseT / config.surfaceDuration);
    if (d.divePhaseT >= config.surfaceDuration) {
      d.divePhase = "swim";
      d.divePhaseT = 0;
    }
    d.bobPhase += config.bobFreq * dt * Math.PI * 2;
    return;
  }

  // "swim"
  d.diveScale = 1;
  const noise = fbm2D(d.perm, t * config.headingNoiseSpeed, 7.3, 3, 2, 0.5);
  d.heading += noise * config.turnRate * dt;

  const nextX = d.x + Math.cos(d.heading) * config.speed * dt;
  const nextY = d.y + Math.sin(d.heading) * config.speed * dt;

  if (isNearLand(nextX, nextY, isLandFn, config.minCoastDistance)) {
    d.divePhase = "dive";
    d.divePhaseT = 0;
  } else {
    const margin = config.edgeMargin;
    const outOfBounds =
      nextX < canvasBounds.x + margin || nextX > canvasBounds.x + canvasBounds.width - margin ||
      nextY < canvasBounds.y + margin || nextY > canvasBounds.y + canvasBounds.height - margin;
    if (!outOfBounds) {
      d.x = nextX;
      d.y = nextY;
    } // else: held in place -- edge proximity alone doesn't trigger a dive
  }

  d.bobPhase += config.bobFreq * dt * Math.PI * 2;
}
