// v3.7.47 -- boats + dragon(s), live, on the STATIC production build.
//
// Why this file exists rather than just loading cabinet-v3-layout.js:
// that file (170KB+) also pulls in cabinet-v3-treemap.js and
// cabinet-v3-circlepack.js, which only matter for DECIDING where each
// island goes -- something that only needs to happen once, at build
// time (build-static.mjs already does exactly that, then freezes the
// result as the static SVG this script runs on top of). Loading them
// again in every visitor's browser would be pure waste. This file
// imports only the actual physics (cabinet-v3-flowfield.js,
// cabinet-v3-particles.js, cabinet-v3-dragon.js, and
// cabinet-v3-islandshape.js's buildIslandHeightmap) UNMODIFIED --
// zero duplication of the simulation logic itself -- and reimplements
// only the DOM-rendering glue (build/position the SVG elements),
// trimmed relative to cabinet-v3-layout.js/islands-tool.html's dev-tool
// version: no click-to-launch (dev-only, direct feedback: "not a
// serious/core feature," "we can get rid of mouseclick to new boat"),
// no MedieRiso-specific colour branching (that theme never ships to
// production, see cabinet-v3-controls.js's own THEME_OPTIONS comment),
// no flow-field debug visualization (dev-only diagnostic). The dragon's
// dive/resurface slide-and-clip rendering IS kept, unchanged from the
// dev tool -- direct confirmation: "dragon slide-sink is a keeper
// though, that works nicely."
//
// Reads its one input -- { grown, canvasBounds }, the circle-packing
// output build-static.mjs captured from a finished render() -- out of
// an inline <script type="application/json" id="v3-anim-data"> block
// index.template.html's placeholder gets filled with, the same
// "capture once, freeze, ship" pattern the SVG markup itself already
// uses.

import { v3Config } from "./cabinet-v3-data.js";
import { buildIslandHeightmap } from "./cabinet-v3-islandshape.js";
import { createFlowSampler } from "./cabinet-v3-flowfield.js";
import { createParticlePool, stepParticle } from "./cabinet-v3-particles.js";
import { spawnDragon, stepDragon } from "./cabinet-v3-dragon.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}

// Copied verbatim from cabinet-v3-layout.js (dragon.svg's own path
// data -- see that file's own comment for why inlined rather than
// <use>/<symbol>: a reproducible Chromium bug silently failed to paint
// a <use>-referenced <symbol> created during the page's initial
// synchronous render).
const DRAGON_PATH_D = "M70.71 49.9c-9.32,2.19 -18.17,23.97 -33.8,31.22 -6.92,2.53 -23.83,8.18 -32.3,5.25 -4.66,2.95 -5.22,7.9 -3.64,15.6 1.2,5.86 51.59,2.81 59.27,0.33 37.57,10.28 55.58,-5.31 95.21,31.26l0.53 0.52c32.93,31.03 44.2,80.32 28.21,122.67 -11.12,29.46 -24.76,38.45 -39.71,53.96l53.08 0c30.39,-37.59 41.63,-89.03 30.53,-136.2 -13.79,-58.61 -59.19,-103.05 -115.13,-118.73 6.68,-12.36 15.1,-14.55 20.69,-25.01 2.8,-5.23 7.66,-20.74 4.47,-30.29 -13.36,30.41 -33.8,46.32 -67.41,49.42zm211.03 78.69c-36.74,40.06 -47.01,99.14 -25.21,149.12 6.61,15.14 12.62,24.08 20.16,33l49.3 0c-3.35,-4.41 -6.84,-8.54 -9.93,-12.29 -41.1,-43.74 -28.95,-113.76 24.75,-140.64 16.36,-8.19 34.39,-10.92 52.5,-9.19 17.38,1.67 34.16,9 47.68,19.97 22.49,18.24 34.68,47.01 32.43,75.84 -2.57,33.08 -18.94,47.94 -35.63,66.3l51.01 0c16.03,-19.73 26.5,-44.09 29.93,-69.19 7,-51.11 -14.15,-99.25 -54.62,-130.34 -24.6,-18.9 -56.19,-27.95 -86.99,-26.93 -36.11,1.19 -71.04,17.79 -95.39,44.35zm260.84 139.35c2.21,13.55 8.67,30.04 17.62,42.76l46 0c-6.32,-4.73 -12.7,-8.61 -16.65,-11.82 -9.06,-7.38 -17.54,-22.98 -20.9,-34.07 -16.01,-52.78 22.96,-103.43 75.86,-109.37l0 -0.91c-63.58,-6.85 -112.01,51.62 -101.93,113.42z";
const DRAGON_VIEWBOX = { width: 644.68, height: 310.88 };
const PARTICLE_COLORS = ["#3b2416", "#1c1a17", "#4a2f5e", "#1f2b4a"]; // dark brown, black, violet, navy

function buildParticleElement() {
  const { sizeMin, sizeMax } = v3Config.particles;
  const scale = sizeMin + Math.random() * (sizeMax - sizeMin);
  const rx = 3.2 * scale, ry = 1.3 * scale;
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

  const pg = el("g", { class: "v3-particle-group" });
  const ellipse = el("ellipse", {
    class: "v3-particle", cx: 0, cy: 0, rx: rx.toFixed(2), ry: ry.toFixed(2),
    style: `stroke:${color}`
  });
  pg.appendChild(ellipse);

  const ribCount = 2 + Math.floor(Math.random() * 2);
  const usedU = [];
  for (let i = 0; i < ribCount; i++) {
    let u;
    let attempts = 0;
    do {
      u = (Math.random() * 2 - 1) * 0.7;
      attempts++;
    } while (usedU.some(o => Math.abs(o - u) < 0.28) && attempts < 10);
    usedU.push(u);

    const localX = u * rx;
    const halfH = ry * Math.sqrt(Math.max(0, 1 - u * u)) * 0.85;
    const rib = el("line", {
      class: "v3-particle-rib",
      x1: localX.toFixed(2), y1: (-halfH).toFixed(2),
      x2: localX.toFixed(2), y2: halfH.toFixed(2),
      style: `stroke:${color}`
    });
    pg.appendChild(rib);
  }

  return pg;
}

function buildDragonElement(fill) {
  const { strokeColor } = v3Config.dragon;
  const clipId = `v3-dragon-clip-${Math.random().toString(36).slice(2)}`;

  const outer = el("g", { class: "v3-dragon" });
  const inner = el("g", {
    transform: `translate(${-DRAGON_VIEWBOX.width / 2} ${-DRAGON_VIEWBOX.height / 2})`
  });

  const defs = el("defs");
  const clipPath = el("clipPath", { id: clipId });
  clipPath.appendChild(el("rect", { x: 0, y: 0, width: DRAGON_VIEWBOX.width, height: DRAGON_VIEWBOX.height }));
  defs.appendChild(clipPath);

  const clipped = el("g", { "clip-path": `url(#${clipId})` });
  const slide = el("g", { class: "v3-dragon-slide" });
  const path = el("path", {
    class: "v3-dragon-path",
    d: DRAGON_PATH_D,
    "fill-rule": "evenodd",
    style: `fill:${fill};stroke:${strokeColor}`
  });

  slide.appendChild(path);
  clipped.appendChild(slide);
  inner.appendChild(defs);
  inner.appendChild(clipped);
  outer.appendChild(inner);
  return { outer, slide };
}

// Same formula as cabinet-v3-layout.js's applyDragonTransform() -- see
// that function's own comment for why `outer` needs this set once,
// synchronously, at spawn time (not just per-frame in tickDragon()):
// otherwise the browser can paint one real frame of the dragon at its
// raw, untransformed native size before the first animation frame runs.
function applyDragonTransform(d, group, slide) {
  const config = v3Config.dragon;
  const scale = (config.targetWidth * d.sizeMult) / DRAGON_VIEWBOX.width;
  const bobY = Math.sin(d.bobPhase) * config.bobAmplitude;
  const flip = Math.cos(d.heading) >= 0 ? -1 : 1;
  group.setAttribute(
    "transform",
    `translate(${d.x.toFixed(1)} ${(d.y + bobY).toFixed(1)}) scale(${(flip * scale).toFixed(4)} ${scale.toFixed(4)})`
  );
  const slideY = DRAGON_VIEWBOX.height * (1 - d.diveScale);
  slide.setAttribute("transform", `translate(0 ${slideY.toFixed(2)})`);
}

export function startProductionAnimation() {
  const dataEl = document.getElementById("v3-anim-data");
  if (!dataEl) return; // nothing to animate against -- fail quiet, static page still works
  const { grown, canvasBounds } = JSON.parse(dataEl.textContent);

  const { warpStrength, waveDistances, cellSize, threshold } = v3Config.island;
  const edgePadding = warpStrength + Math.max(0, ...waveDistances) + 60;
  const paddedBounds = {
    x: canvasBounds.x - edgePadding,
    y: canvasBounds.y - edgePadding,
    width: canvasBounds.width + edgePadding * 2,
    height: canvasBounds.height + edgePadding * 2
  };

  const { H, cols, rows } = buildIslandHeightmap(grown, paddedBounds, v3Config.island);
  const flowConfig = { ...v3Config.flow, landThreshold: threshold };
  const sampler = createFlowSampler(H, cols, rows, cellSize, paddedBounds, flowConfig);

  const stage = document.querySelector("#v3-stage");
  if (!stage) return;

  // -- particles --
  const { count, padding } = v3Config.particles;
  const particles = createParticlePool(count, canvasBounds, padding, sampler.vectorAt, sampler.isLand, sampler.repulsionAt, 0, Math.random, v3Config.particles);
  const particleGroup = el("g", { class: "v3-particles", "aria-hidden": "true" });
  stage.appendChild(particleGroup);
  const particleEls = particles.map(() => {
    const pg = buildParticleElement();
    particleGroup.appendChild(pg);
    return pg;
  });

  // -- dragon(s) -- 1-3, never 0, same as the dev tool (direct request:
  // "randomly pick 1-3 for number of dragons, has to be non zero").
  const { fillColors, sizeMultMin, sizeMultMax } = v3Config.dragon;
  const dragonCount = 1 + Math.floor(Math.random() * 3);
  const colors = [...fillColors];
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  const dragons = Array.from({ length: dragonCount }, (_, i) => {
    const d = spawnDragon(canvasBounds, sampler.isLand, Math.random, v3Config.dragon);
    d.sizeMult = sizeMultMin + Math.random() * (sizeMultMax - sizeMultMin);
    const { outer, slide } = buildDragonElement(colors[i % colors.length]);
    applyDragonTransform(d, outer, slide);
    stage.appendChild(outer);
    return { d, group: outer, slide };
  });

  // -- animation loop --
  let animStartTime = null;
  let lastFrameTime = null;

  function frame(timestamp) {
    if (animStartTime === null) animStartTime = timestamp;
    const t = (timestamp - animStartTime) / 1000;
    if (lastFrameTime !== null) {
      const dt = Math.min(0.05, (timestamp - lastFrameTime) / 1000);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const remove = stepParticle(p, sampler.vectorAt, sampler.isLand, sampler.repulsionAt, t, canvasBounds, padding, dt, v3Config.particles, Math.random, true);
        if (remove) {
          particleEls[i].remove();
          particles.splice(i, 1);
          particleEls.splice(i, 1);
          continue;
        }
        const angle = (Math.atan2(p.dirY, p.dirX) * 180) / Math.PI;
        particleEls[i].setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
      }

      dragons.forEach(({ d, group, slide }) => {
        stepDragon(d, sampler.isLand, canvasBounds, t, dt, v3Config.dragon, Math.random);
        applyDragonTransform(d, group, slide);
      });
    }
    lastFrameTime = timestamp;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// v3.7.48 (#21) -- click the compass's inner circle to swap the whole
// canvas between Medieval and Topology. The two themes' CSS already
// ship unconditionally (cabinet-v3-style.css's body.v3-proto[data-
// theme=...] blocks aren't behind any build flag), so this is just the
// attribute flip -- no colour math here. Known limitation, inherited
// from #64/v3.7.47: boats/dragons only have Medieval colours defined
// (PARTICLE_COLORS/v3Config.dragon.fillColors above), so they won't
// re-tint on swap to Topology -- already flagged as future scope
// ("may ask for theme based colour later"), not fixed by this.
function startThemeSwap() {
  const themeHit = document.querySelector(".v3-compass-theme-hit");
  if (!themeHit) return;
  themeHit.addEventListener("click", () => {
    const current = document.body.dataset.theme;
    document.body.dataset.theme = current === "medieval-map" ? "satellite" : "medieval-map";
  });
}

startProductionAnimation();
startThemeSwap();
