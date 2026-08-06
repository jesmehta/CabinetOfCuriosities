// v3.6 -- dev-only tuning panel for cabinet-v3-data.js's v3Config.island
// block. Not part of the eventual production page (this whole prototype
// isn't linked from the live site -- see index.html's own banner); exists
// so island-shape parameters (especially the new domain-warp knobs, see
// cabinet-v3-islandshape.js's warpOffset()) can be tuned by feel against
// the live SVG instead of another round of edit-config/screenshot/repeat.
//
// Mutates v3Config.island directly (the same object cabinet-v3-layout.js
// reads on every retrace) and calls its exported retraceIslands() on
// every slider input -- cheap, since only the island trace re-runs, not
// the treemap/circle-packing pass (see retraceIslands()'s own comment).

import { v3Config } from "./cabinet-v3-data.js";
import { retraceIslands } from "./cabinet-v3-layout.js";

// Each entry drives one slider. `get`/`set` default to reading/writing
// v3Config.island[key] directly; only warpPeriod overrides them, since
// warpScale (a 1/px frequency) is a much less intuitive dial than "period
// in px" for a human turning a knob.
const CONTROLS = [
  { group: "Warp (v3.6)", key: "warpStrength", label: "Strength (px)", min: 0, max: 150, step: 1 },
  {
    group: "Warp (v3.6)", key: "warpPeriod", label: "Period (px)", min: 40, max: 400, step: 5,
    get: () => Math.round(1 / v3Config.island.warpScale),
    set: v => { v3Config.island.warpScale = 1 / v; }
  },
  { group: "Warp (v3.6)", key: "warpOctaves", label: "Octaves", min: 1, max: 4, step: 1 },
  { group: "Angular (v3.5.2-.4)", key: "angularStrength", label: "Strength", min: 0, max: 1, step: 0.02 },
  { group: "Angular (v3.5.2-.4)", key: "angularRidgeMix", label: "Ridge mix", min: 0, max: 1, step: 0.02 },
  { group: "Base coastline", key: "threshold", label: "Threshold", min: -1.5, max: 0.5, step: 0.02 },
  { group: "Base coastline", key: "noiseAmplitude", label: "Noise amplitude", min: 0, max: 1, step: 0.02 },
  { group: "Base coastline", key: "gradientStrength", label: "Gradient strength", min: 0.3, max: 2, step: 0.02 }
];

function formatValue(v, step) {
  return step < 1 ? Number(v).toFixed(2) : String(Math.round(v));
}

function buildControlPanel() {
  // Snapshot BEFORE any slider mutates v3Config.island -- what "Reset"
  // restores. Deliberately not the same reference as v3Config.island
  // itself (a plain copy), since that object is mutated in place below.
  const defaults = { ...v3Config.island };

  const panel = document.createElement("div");
  panel.className = "v3-controls";

  const title = document.createElement("div");
  title.className = "v3-controls-title";
  title.textContent = "Island shape tuning (dev only)";
  panel.appendChild(title);

  const inputsByKey = new Map();
  let currentGroup = null;

  CONTROLS.forEach(ctrl => {
    if (ctrl.group !== currentGroup) {
      currentGroup = ctrl.group;
      const heading = document.createElement("div");
      heading.className = "v3-controls-group-label";
      heading.textContent = ctrl.group;
      panel.appendChild(heading);
    }

    const getVal = ctrl.get || (() => v3Config.island[ctrl.key]);
    const setVal = ctrl.set || (v => { v3Config.island[ctrl.key] = v; });

    const row = document.createElement("label");
    row.className = "v3-controls-row";

    const nameSpan = document.createElement("span");
    nameSpan.className = "v3-controls-name";
    nameSpan.textContent = ctrl.label;

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(ctrl.min);
    input.max = String(ctrl.max);
    input.step = String(ctrl.step);
    input.value = String(getVal());

    const valueSpan = document.createElement("span");
    valueSpan.className = "v3-controls-value";
    valueSpan.textContent = formatValue(getVal(), ctrl.step);

    input.addEventListener("input", () => {
      const v = Number(input.value);
      setVal(v);
      valueSpan.textContent = formatValue(v, ctrl.step);
      retraceIslands();
    });

    inputsByKey.set(ctrl.key, { input, valueSpan, ctrl });

    row.appendChild(nameSpan);
    row.appendChild(input);
    row.appendChild(valueSpan);
    panel.appendChild(row);
  });

  // v3.6.7 -- wave-ring distance generator: waveDistances is a derived
  // array (d[i] = start * multiplier^i + offset), not a single scalar,
  // so it doesn't fit the CONTROLS-array's one-slider-one-key model
  // above. Seeded from the currently-live array (assumes it already
  // fits start*multiplier^i+offset -- true for how every waveDistances
  // value has been set so far) so opening the panel doesn't silently
  // change anything until a slider actually moves.
  const liveWaves = v3Config.island.waveDistances;
  const waveGenDefaults = {
    count: liveWaves.length,
    start: liveWaves[0],
    multiplier: liveWaves.length > 1 ? liveWaves[1] / liveWaves[0] : 3,
    offset: 0
  };
  const waveGen = { ...waveGenDefaults };

  const computeWaveDistances = g =>
    Array.from({ length: g.count }, (_, i) => Math.max(0.5, g.start * Math.pow(g.multiplier, i) + g.offset));

  const waveHeading = document.createElement("div");
  waveHeading.className = "v3-controls-group-label";
  waveHeading.textContent = "Wave rings (v3.6.6)";
  panel.appendChild(waveHeading);

  const waveInputs = {};
  const WAVE_FIELDS = [
    { key: "count", label: "Count", min: 2, max: 5, step: 1 },
    { key: "start", label: "Start (px)", min: 1, max: 30, step: 1 },
    { key: "multiplier", label: "Multiplier", min: 1, max: 5, step: 0.1 },
    { key: "offset", label: "Offset (px)", min: -10, max: 30, step: 1 }
  ];
  const waveValueSpan = document.createElement("div");
  waveValueSpan.className = "v3-controls-value";
  waveValueSpan.style.marginBottom = "6px";

  const refreshWavePreview = () => {
    waveValueSpan.textContent = computeWaveDistances(waveGen).map(d => d.toFixed(1)).join(", ");
  };

  WAVE_FIELDS.forEach(f => {
    const row = document.createElement("label");
    row.className = "v3-controls-row";

    const nameSpan = document.createElement("span");
    nameSpan.className = "v3-controls-name";
    nameSpan.textContent = f.label;

    const input = document.createElement("input");
    input.type = "range";
    input.min = String(f.min);
    input.max = String(f.max);
    input.step = String(f.step);
    input.value = String(waveGen[f.key]);

    const valueSpan = document.createElement("span");
    valueSpan.className = "v3-controls-value";
    valueSpan.textContent = formatValue(waveGen[f.key], f.step);

    input.addEventListener("input", () => {
      const v = Number(input.value);
      waveGen[f.key] = v;
      valueSpan.textContent = formatValue(v, f.step);
      v3Config.island.waveDistances = computeWaveDistances(waveGen);
      refreshWavePreview();
      retraceIslands();
    });

    waveInputs[f.key] = { input, valueSpan };
    row.appendChild(nameSpan);
    row.appendChild(input);
    row.appendChild(valueSpan);
    panel.appendChild(row);
  });

  panel.appendChild(waveValueSpan);
  refreshWavePreview();

  const buttonRow = document.createElement("div");
  buttonRow.className = "v3-controls-buttons";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "v3-controls-btn";
  resetBtn.textContent = "Reset";
  resetBtn.addEventListener("click", () => {
    Object.assign(v3Config.island, defaults);
    inputsByKey.forEach(({ input, valueSpan, ctrl }) => {
      const v = (ctrl.get || (() => v3Config.island[ctrl.key]))();
      input.value = String(v);
      valueSpan.textContent = formatValue(v, ctrl.step);
    });
    Object.assign(waveGen, waveGenDefaults);
    WAVE_FIELDS.forEach(f => {
      waveInputs[f.key].input.value = String(waveGen[f.key]);
      waveInputs[f.key].valueSpan.textContent = formatValue(waveGen[f.key], f.step);
    });
    v3Config.island.waveDistances = computeWaveDistances(waveGen);
    refreshWavePreview();
    retraceIslands();
  });

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "v3-controls-btn";
  copyBtn.textContent = "Copy config";
  copyBtn.addEventListener("click", () => {
    const json = JSON.stringify(v3Config.island, null, 2);
    console.log("v3Config.island (current tuning):\n" + json);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).then(
        () => { copyBtn.textContent = "Copied!"; setTimeout(() => { copyBtn.textContent = "Copy config"; }, 1200); },
        () => { copyBtn.textContent = "See console"; setTimeout(() => { copyBtn.textContent = "Copy config"; }, 1200); }
      );
    } else {
      copyBtn.textContent = "See console";
      setTimeout(() => { copyBtn.textContent = "Copy config"; }, 1200);
    }
  });

  buttonRow.appendChild(resetBtn);
  buttonRow.appendChild(copyBtn);
  panel.appendChild(buttonRow);

  document.body.appendChild(panel);
}

buildControlPanel();
