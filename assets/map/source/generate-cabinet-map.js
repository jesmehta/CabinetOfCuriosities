// One-time authoring script: generates organic island + coastline-ripple SVG path
// data for the Cabinet of Curiosities archipelago map. Run with `node`, not at
// runtime. Output is hand-reviewed and pasted into docs/index.html, then this
// script + its seed config are committed under assets/map/source/ so the map
// can be regenerated or revised later without re-deriving the approach.

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

function blobPoints(cx, cy, rx, ry, points, seed, variance, passes) {
  const rand = mulberry32(seed);
  const raw = [];
  for (let i = 0; i < points; i++) raw.push(1 + (rand() - 0.5) * variance);
  const smoothed = smooth(raw, passes);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = smoothed[i];
    pts.push({
      x: cx + Math.cos(angle) * rx * r,
      y: cy + Math.sin(angle) * ry * r,
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

function island(id, cx, cy, rx, ry, seed) {
  const land = blobPoints(cx, cy, rx, ry, 14, seed, 0.34, 2);
  const landPath = catmullRomPath(land, true);

  const ripples = [1.06, 1.14, 1.24].map((scale, i) => {
    const pts = blobPoints(cx, cy, rx * scale, ry * scale, 14, seed + 1000 * (i + 1), 0.22, 3);
    return catmullRomPath(pts, true);
  });

  return { id, landPath, ripples };
}

function islet(id, cx, cy, r, seed) {
  const pts = blobPoints(cx, cy, r, r * 0.8, 9, seed, 0.4, 2);
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
}

console.log(`\n/* ---- islets ---- */`);
for (const isl of islets) {
  console.log(`${isl.id}: ${isl.path}`);
}
