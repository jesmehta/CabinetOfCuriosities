// Pure logic (no DOM): generates the decorative sea-serpent's SVG path
// data. Redesigned per explicit request -- NOT the v2 map's sine-wave
// ripple body ("I don't like this one"); a chain of circular-arc
// "humps," each spanning MORE than 180 degrees so it pokes up higher
// than a plain semicircle of the same radius would (a real loop/coil
// character, not a gentle wave), banded into a variable-thickness
// ribbon -- thinnest at the tail, thickest at mid-body, half that
// thickness at the head. The head is a distinct shape (a half-arc dome
// + snout + eye), not just another body hump.
//
// Every arc is sampled as a polyline (fixed angular steps), not drawn
// with SVG's `A` arc command -- sidesteps large-arc/sweep-flag sign
// mistakes entirely, and matches this project's existing faceted,
// marching-squares aesthetic (islands aren't smooth curves either).
//
// Local coordinate frame: +y is UP (so "height above water" reads as a
// positive number, matching how the geometry is reasoned about below).
// SVG's own +y is DOWN -- flipped once, at the very last step
// (pointsToPathD), not threaded through the geometry math.

function pointsToPathD(points, originX, originY) {
  if (points.length === 0) return "";
  const toSvg = ([x, y]) => `${(originX + x).toFixed(1)},${(originY - y).toFixed(1)}`;
  const rest = points.slice(1).map(p => `L ${toSvg(p)}`).join(" ");
  return `M ${toSvg(points[0])} ${rest} Z`;
}

// One hump's outer/inner-arc ribbon boundary, as a closed polygon of
// local (x, y) points. leftX is where this hump's own left (tail-side)
// edge sits on the shared y=0 baseline -- consecutive humps chain by
// feeding the previous hump's returned rightX in as the next hump's
// leftX, so the body reads as one continuous band, not floating pieces.
//
// sweepDeg > 180 is what makes this a "loop," not a bump: for a circle
// of radius r, an arc spanning exactly 180 degrees (a plain semicircle)
// peaks at height r above its own chord. Spanning MORE than 180 degrees
// -- achieved here by centering the circle ABOVE the y=0 baseline and
// only drawing the portion at or above it -- peaks higher than r, and
// the arc's own base (chord) width shrinks as the sweep grows past 180,
// approaching a closed loop as sweepDeg approaches 360.
function hump(leftX, radius, sweepDeg, thickness, samples = 14) {
  const halfSweep = (sweepDeg * Math.PI) / 360; // sweepDeg/2, in radians
  const centerX = leftX + radius * Math.sin(halfSweep);
  const centerY = -radius * Math.cos(halfSweep); // > 0 whenever sweepDeg > 180
  const rightX = centerX + radius * Math.sin(halfSweep);

  // Angles measured standard (0 = +x axis, ccw positive, +y up).
  // rightAngle is the hump's right (head-side) edge, leftAngle its left
  // (tail-side) edge -- sweeping from rightAngle up through the top
  // (90 degrees) to leftAngle covers the full sweepDeg.
  const rightAngle = Math.PI / 2 - halfSweep;
  const leftAngle = Math.PI / 2 + halfSweep;

  const outerR = radius + thickness / 2;
  const innerR = Math.max(1, radius - thickness / 2);

  const outerPts = [];
  for (let i = 0; i <= samples; i++) {
    const a = rightAngle + ((leftAngle - rightAngle) * i) / samples;
    outerPts.push([centerX + outerR * Math.cos(a), centerY + outerR * Math.sin(a)]);
  }
  const innerPts = [];
  for (let i = samples; i >= 0; i--) {
    const a = rightAngle + ((leftAngle - rightAngle) * i) / samples;
    innerPts.push([centerX + innerR * Math.cos(a), centerY + innerR * Math.sin(a)]);
  }

  return { points: [...outerPts, ...innerPts], rightX };
}

// Thickness profile: min at the tail (frac 0), max at mid-body (frac
// 0.5), half of max at the head (frac 1) -- exactly as specified, not
// a smooth curve through those three targets, a direct piecewise lerp.
function thicknessAt(frac, minT, maxT) {
  if (frac <= 0.5) return minT + (maxT - minT) * (frac / 0.5);
  return maxT + (maxT / 2 - maxT) * ((frac - 0.5) / 0.5);
}

// Deterministic pseudo-variation (not Math.random -- same convention as
// every other noise/scatter source in this codebase) for per-hump
// sweep/radius so consecutive humps don't look mechanically identical.
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

// Returns { bodyD, headD, eye: {cx, cy, r} } -- all in the SAME local
// frame, positioned relative to (originX, originY) which is where the
// tail's own left edge sits (SVG coords, +y down, at the call site).
export function buildSerpent(config) {
  const {
    originX, originY,
    humpCount, radiusMin, radiusMax,
    sweepMinDeg, sweepMaxDeg,
    thicknessMin, thicknessMax,
    seed
  } = config;

  const rng = mulberry32(typeof seed === "string" ? hashSeed(seed) : seed);

  let cursorX = 0;
  const bodyPolygons = [];
  for (let i = 0; i < humpCount; i++) {
    const frac = i / (humpCount - 1);
    const radius = radiusMin + rng() * (radiusMax - radiusMin);
    const sweepDeg = sweepMinDeg + rng() * (sweepMaxDeg - sweepMinDeg);
    const thickness = thicknessAt(frac, thicknessMin, thicknessMax);
    const { points, rightX } = hump(cursorX, radius, sweepDeg, thickness);
    bodyPolygons.push(points);
    cursorX = rightX;
  }
  const bodyD = bodyPolygons.map(pts => pointsToPathD(pts, originX, originY)).join(" ");

  // Head: a distinct shape, not another hump -- a half-arc (180deg)
  // dome sitting at the body's right (head) end, plus a small forward-
  // pointing snout wedge underneath it. headX is where the last hump's
  // right edge ended, i.e. where the head attaches.
  const headX = cursorX;
  const headRadius = radiusMin * 1.1;
  const domePts = [];
  const domeSamples = 10;
  for (let i = 0; i <= domeSamples; i++) {
    const a = Math.PI - (Math.PI * i) / domeSamples; // 180deg -> 0deg, i.e. left-to-right over the top
    domePts.push([headX + headRadius + headRadius * Math.cos(a), headRadius * Math.sin(a)]);
  }
  // close the dome's flat underside back to its own start
  domePts.push([headX + headRadius * 2, 0]);
  domePts.push([headX, 0]);

  const snoutTipX = headX + headRadius * 2.6;
  const snoutPts = [
    [headX + headRadius * 1.3, headRadius * 0.55],
    [snoutTipX, 0],
    [headX + headRadius * 1.3, -headRadius * 0.15]
  ];

  const headD = [pointsToPathD(domePts, originX, originY), pointsToPathD(snoutPts, originX, originY)].join(" ");

  const eye = {
    cx: originX + headX + headRadius * 1.15,
    cy: originY - headRadius * 0.55,
    r: Math.max(1, headRadius * 0.12)
  };

  return { bodyD, headD, eye };
}

function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}
