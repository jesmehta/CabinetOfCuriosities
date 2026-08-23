// v3.6 archive -- mirror of ../../cabinet-v3-controls.js, pinned to this
// folder's own frozen config.js (NOT the live cabinet-v3-data.js) so
// dragging sliders here explores this archive's own baseline without
// touching, or being touched by, the live pages' tuning. retraceIslands
// points at this folder's own layout.js copy (each layout module has its
// own module-scoped islandLayoutState, so the two retraceIslands()
// exports are genuinely different functions, not the same one
// re-exported). See Landing-page-notes.2.0.md's "Three pages" section.

import { v3Config } from "./config.js";
import { retraceIslands } from "./layout.js";

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
