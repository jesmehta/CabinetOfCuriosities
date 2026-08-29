// Round 2 of the one-time authoring script: jaggier, more irregular island
// coastlines (closer to the Earthsea/Gont/fantasticmaps reference set), with
// ripple rings generated as correlated contours of the land shape (so they
// read as "the same coastline traced further out") plus short hachure ticks
// just outside the coast. Run with `node`, not at runtime -- output is
// hand-reviewed and pasted into docs/index.html.

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth(values, passes) {
  let v = values.slice();
  const n = v.length;
  for (let p = 0; p < passes; p++) {
    const next = v.slice();
    for (let i = 0; i < n; i++) {
      const prev = v[(i - 1 + n) % n];
      const cur = v[i];
      const nxt = v[(i + 1) % n];
      next[i] = prev * 0.25 + cur * 0.5 + nxt * 0.25;
    }
    v = next;
  }
  return v;
}

function radiusArray(points, seed, variance, passes) {
  const rand = mulberry32(seed);
  const raw = [];
  for (let i = 0; i < points; i++) raw.push(1 + (rand() - 0.5) * variance);
  return smooth(raw, passes);
}

function toPoints(cx, cy, rx, ry, radii) {
  const n = radii.length;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const r = radii[i];
    pts.push({
      x: cx + Math.cos(angle) * rx * r,
      y: cy + Math.sin(angle) * ry * r,
      angle,
    });
  }
  return pts;
}

function catmullRomPath(pts, close) {
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} `;
  const count = close ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)} `;
  }
  if (close) d += "Z";
  return d.trim();
}

function hachurePath(landPoints, cx, cy, seed) {
  const rand = mulberry32(seed);
  const segs = [];
  for (let i = 0; i < landPoints.length; i += 2) {
    const p = landPoints[i];
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const wobble = (rand() - 0.5) * 0.5;
    const tx = -ny * wobble;
    const ty = nx * wobble;
    const inner = 1 + rand() * 2;
    const outer = 6 + rand() * 6;
    const x1 = p.x + nx * inner + tx;
    const y1 = p.y + ny * inner + ty;
    const x2 = p.x + nx * outer + tx * 1.5;
    const y2 = p.y + ny * outer + ty * 1.5;
    segs.push(`M ${x1.toFixed(1)},${y1.toFixed(1)} L ${x2.toFixed(1)},${y2.toFixed(1)}`);
  }
  return segs.join(" ");
}

function island(id, cx, cy, rx, ry, seed) {
  const points = 22;
  const baseRadii = radiusArray(points, seed, 0.4, 1);
  const landPts = toPoints(cx, cy, rx, ry, baseRadii);
  const landPath = catmullRomPath(landPts, true);

  const ringScales = [1.07, 1.15, 1.24];
  const ripples = ringScales.map((scale, i) => {
    const extra = radiusArray(points, seed + 1000 * (i + 1), 0.1, 2);
    const combined = baseRadii.map((r, idx) => r * scale * (0.94 + 0.12 * extra[idx]));
    const pts = toPoints(cx, cy, rx, ry, combined);
    return catmullRomPath(pts, true);
  });

  const hachures = hachurePath(landPts, cx, cy, seed + 500);

  return { id, landPath, ripples, hachures };
}

function islet(id, cx, cy, r, seed) {
  const radii = radiusArray(9, seed, 0.4, 1);
  const pts = toPoints(cx, cy, r, r * 0.8, radii);
  return { id, path: catmullRomPath(pts, true) };
}

const islands = [
  island("bookshelf", 592, 300, 190, 100, 11),
  island("fffx", 1104, 280, 192, 100, 22),
  island("teaching", 544, 570, 190, 90, 33),
  island("visual-field-notes", 1056, 570, 222, 100, 44),
  island("machines-makings", 688, 820, 238, 100, 55),
  island("interfaces-data-texts", 1280, 820, 206, 90, 66),
  island("about", 1464, 330, 100, 68, 77),
];

const islets = [
  islet("islet-bookshelf-1", 372, 400, 20, 111),
  islet("islet-fffx-1", 1300, 210, 16, 222),
  islet("islet-mm-1", 470, 900, 18, 333),
  islet("islet-idt-1", 1420, 900, 14, 444),
];

for (const isl of islands) {
  console.log(`\n/* ---- ${isl.id} ---- */`);
  console.log(`LAND: ${isl.landPath}`);
  isl.ripples.forEach((r, i) => console.log(`RIPPLE${i + 1}: ${r}`));
  console.log(`HACHURE: ${isl.hachures}`);
}

console.log(`\n/* ---- islets ---- */`);
for (const isl of islets) {
  console.log(`${isl.id}: ${isl.path}`);
}
