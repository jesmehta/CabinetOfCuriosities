// One-off generator for .v3-header's background tile (cabinet-v3-style.css).
// NOT run at build or page load -- run by hand only when re-tuning, then
// commit the rewritten CSS:
//
//   node dev-tool/gen-header-texture.mjs        (from landing-v3/)
//
// Rows of short "dashes", each drawn as a run of tiny ripple crests rather
// than a straight line. Per dash (user's spec, 2026-10-01):
//   t = stroke thickness; the dash is cut into n slots of 8t (l = 8t * n),
//   each independently a crest or a flat at 50:50 (at least one crest per
//   dash). Each crest = two quarter circles, 4t across x 4t tall: one rising from the dash to the
//   peak (centre left of the peak, at peak height), one falling back to
//   the dash (centre right of the peak) -- concave flanks, sharp peak.
//   History: first pass was quarter circles (2t tall, no flats) at t=0.6,
//   then t=1.0; user: "looks like triangular fuzz" -> 8t height + flats,
//   then "width also increases to 4t" -> 4t-wide arcs (8t crests),
//   then "make width 8t as well" -> 8t x 8t arcs (16t crests), then
//   "proportionally smaller, 4t x 4t" + random 50:50 crest/flat slots
//   (rows/gaps/lengths halved with it).
// Seeded PRNG, so re-running with the same constants reproduces the tile.
// Seamless + no visible seam (2026-10-01 fix -- user: "obvious repeating
// gaps ... 4 times across the title band"): the old version started each
// row near x=0 and stopped when the next dash didn't fit, leaving an empty
// strip at every tile edge, i.e. a blank column every W px. Now each row's
// dash+gap sequence is scaled to loop exactly once around W from a random
// start, and a dash crossing the right edge is ALSO drawn shifted by -W,
// so it continues unbroken into the next tile (no crest cut). Likewise H
// is the exact sum of the row steps, so row spacing is uniform across the
// vertical seam too. Whitespace is kept as a concept, but scattered: ~1 gap
// in 8 is a long one (P_BIG_GAP) at a random spot, not a fixed column.

import { readFile, writeFile } from "node:fs/promises";

const W = 720;                   // tile width, px (H derived from the row steps)
const H_MIN = 140;               // tile at least this tall (header is ~134px: no vertical repeat)
const T = 1.0;                   // t: stroke thickness
const SEED = 1001;
const ROW_STEPS = [6, 6, 7, 8];  // vertical spacing between rows, px (> crest height 4t)
const N_MIN = 3, N_MAX = 7;      // 8t slots per dash (l = 8t * n)
const P_CREST = 0.5;             // chance each slot is a crest (else flat)
const GAP_MIN = 3, GAP_MAX = 20; // gap between dashes, px
const P_BIG_GAP = 0.12, BIG_GAP_MIN = 40, BIG_GAP_MAX = 110; // scattered whitespace
const COLOR = "#7d3a24", OPACITY = 0.17;

let s = SEED;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const uni = (a, b) => a + (b - a) * rnd();
const f = v => +v.toFixed(2);

const rx = 4 * T, ry = 4 * T;   // crest half-width 4t (8t wide), height 4t
const flat = `h${f(2 * rx)}`;  // flat = one slot with no crest
const crest = `a${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} ${f(-ry)}a${f(rx)} ${f(ry)} 0 0 0 ${f(rx)} ${f(ry)}`;

// Row baselines: steps summed until >= H_MIN; H = that exact sum, so the
// last row -> next tile's first row gap is just another ROW_STEPS step.
const ys = [];
let H = 0;
while (H < H_MIN) { ys.push(H + ry + 1); H += ROW_STEPS[Math.floor(rnd() * ROW_STEPS.length)]; }

const rows = [], kLog = [];
for (const y of ys) {
  // Build one full loop of dashes + gaps, then scale the gaps so the loop
  // is exactly W long (dash lengths stay whole slots).
  const dashes = [];
  let dashTotal = 0, gapTotal = 0;
  while (dashTotal + gapTotal < W) {
    const n = N_MIN + Math.floor(rnd() * (N_MAX - N_MIN + 1));
    const slots = Array.from({ length: n }, () => rnd() < P_CREST);
    if (!slots.includes(true)) slots[Math.floor(rnd() * n)] = true; // never an all-flat dash
    const gap = rnd() < P_BIG_GAP ? uni(BIG_GAP_MIN, BIG_GAP_MAX) : uni(GAP_MIN, GAP_MAX);
    dashes.push({ slots, l: 2 * rx * n, gap });
    dashTotal += 2 * rx * n; gapTotal += gap;
  }
  // Overshot W on the last dash: keep it (gaps shrink, k < 1) or drop it
  // (gaps stretch, k > 1), whichever leaves gaps closer to their drawn size.
  const last = dashes[dashes.length - 1];
  const kKeep = (W - dashTotal) / gapTotal;
  const kDrop = (W - dashTotal + last.l) / (gapTotal - last.gap);
  if (Math.abs(Math.log(kDrop)) < Math.abs(Math.log(kKeep)) || kKeep <= 0) dashes.pop();
  const k = dashes.length === 0 ? 1 : (kKeep > 0 && dashes.includes(last) ? kKeep : kDrop);
  kLog.push(k);
  let d = "";
  let x = uni(0, W);
  for (const { slots, l, gap } of dashes) {
    const body = slots.map(c => (c ? crest : flat)).join("");
    const x0 = x % W;
    d += `M${f(x0)} ${f(y)}` + body;
    if (x0 + l > W) d += `M${f(x0 - W)} ${f(y)}` + body; // wrap copy into the left edge
    x += l + gap * k;
  }
  rows.push(`<path d='${d}'/>`);
}

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'>`
  + `<g fill='none' stroke='${COLOR}' stroke-width='${T}' stroke-linecap='round' stroke-linejoin='round' opacity='${OPACITY}'>`
  + rows.join("") + `</g></svg>`;
const uri = "data:image/svg+xml," + svg.replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E");

const cssPath = new URL("../shared/cabinet-v3-style.css", import.meta.url);
const css = await readFile(cssPath, "utf8");
const re = /background-image: url\("data:image\/svg\+xml,[^"]*"\);/;
if (!re.test(css)) throw new Error("header texture background-image not found in cabinet-v3-style.css");
await writeFile(cssPath, css.replace(re, () => `background-image: url("${uri}");`));
console.log(`wrote ${rows.length} rows, ${W}x${H} tile, ${uri.length} chars of data URI; gap scale k ${f(Math.min(...kLog))}-${f(Math.max(...kLog))}`);
