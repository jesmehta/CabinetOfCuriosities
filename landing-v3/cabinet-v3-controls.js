// v3.6 -- dev-only tuning panel for cabinet-v3-data.js's v3Config.island
// block. Not part of the eventual production page (this whole prototype
// isn't linked from the live site -- see index.html's own banner); exists
// so island-shape parameters (especially the new domain-warp knobs, see
// cabinet-v3-islandshape.js's warpOffset()) can be tuned by feel against
// the live SVG instead of another round of edit-config/screenshot/repeat.
//
// v3.6.9 -- restructured into three collapsible <details> sections,
// ordered by how deep into the pipeline each one reaches: Visuals (top --
// a pure rendering-layer toggle, changes nothing upstream), Island shape
// (middle -- feeds the coastline trace, doesn't touch circle positions),
// Layout (bottom -- circle positions themselves, the thing everything
// else is traced from). Explicit direction: "deepest effect/earliest in
// the workflow at the bottom." Each section gets its own Reset (restores
// only what that section can change); Reset ALL covers everything at
// once. Native <details>/<summary> rather than custom show/hide JS --
// collapsing one section (e.g. Island shape) while leaving another (e.g.
// Visuals) open needs no extra state to manage that way.
//
// Mutates v3Config.island / v3Config.pack directly (the same objects
// cabinet-v3-layout.js reads) -- most controls call the exported
// retraceIslands() (cheap: only the island trace re-runs, see its own
// comment in cabinet-v3-layout.js), except Layout's controls (center bias,
// reroll), which change circle POSITIONS and so call the exported
// render() (the full pipeline) instead -- see that function's own comment
// for why this is no more expensive than what every other slider here
// already costs per tick.

import { v3Config } from "./cabinet-v3-data.js";
import { retraceIslands, render, rerollPacking, resetReroll, startCurrentAnimation, refreshParticleCount } from "./cabinet-v3-layout.js";

// Each entry drives one Island-shape slider. `get`/`set` default to
// reading/writing v3Config.island[key] directly; only warpPeriod
// overrides them, since warpScale (a 1/px frequency) is a much less
// intuitive dial than "period in px" for a human turning a knob.
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

// Range shared by every topological-band threshold slider (sea/sand/veg)
// -- same span as the Base coastline "Threshold" slider above, since
// they're the same kind of value (a height in the shared noise
// heightmap), just for a different contour group.
const BAND_MIN = -1.5;
const BAND_MAX = 0.5;
const BAND_STEP = 0.02;

function formatValue(v, step) {
  return step < 1 ? Number(v).toFixed(2) : String(Math.round(v));
}

// Shared by the Theme <select> and the Theme colours editor below, so
// the two can't drift apart into two different lists of themes.
const THEME_OPTIONS = [
  ["", "(none -- current default)"],
  ["medieval", "Wave Contour (draft)"],
  ["satellite", "Topology (draft)"],
  ["medieval-map", "Medieval Map"],
  ["bathymetric", "Topology — Bathymetric Satellite"],
  ["riso", "Riso"],
  ["cyanotype", "Cyanotype"],
  ["neon", "Neon Memphis"],
  ["ukiyo", "Ukiyo-e Woodblock"],
  ["medieRiso", "MedieRiso"]
];

// v3.6.30 -- theme colour tokens exposed on the panel: "still updating
// colours and would lose that combination" -- hand-editing hex values in
// cabinet-v3-style.css and rebuilding to compare was too slow a loop.
// One row per --v3-* custom property (see that file's body.v3-proto
// block for what each actually paints).
const COLOR_TOKENS = [
  { key: "--v3-sea-deep", label: "Sea (deep)" },
  { key: "--v3-sea-shallow", label: "Sea (shallow)" },
  { key: "--v3-veg", label: "Vegetation" },
  { key: "--v3-sand", label: "Sand" },
  { key: "--v3-ink", label: "Ink" },
  { key: "--v3-ring-ink", label: "Ring / contour ink" },
  { key: "--v3-halo-ink", label: "Hover halo" },
  { key: "--v3-label-outline", label: "Label outline" }
];

// Canvas 2D's fillStyle setter/getter round-trips ANY valid CSS colour
// (an rgb() string, a var() chain already resolved by getComputedStyle,
// a named colour) into a normalised "#rrggbb" string -- the exact format
// <input type="color"> requires, without hand-parsing rgb() strings.
let colorProbeCtx = null;
function cssColorToHex(cssColor) {
  if (!colorProbeCtx) colorProbeCtx = document.createElement("canvas").getContext("2d");
  colorProbeCtx.fillStyle = "#000000";
  colorProbeCtx.fillStyle = cssColor;
  return colorProbeCtx.fillStyle;
}

// Reads a theme's OWN authored token values, independent of whichever
// theme is actually live right now -- flips document.body.dataset.theme
// to `themeName`, reads getComputedStyle (which resolves any var()
// chain, e.g. the default theme's --v3-halo-ink: var(--cab-land-hover)),
// then flips it back, all synchronously so nothing repaints in between.
// Deliberately reads computed style rather than parsing stylesheet rule
// text -- the latter would return the literal string "var(--cab-land-
// hover)" for tokens that reference another token, not a usable colour.
function readThemeTokens(themeName) {
  const original = document.body.dataset.theme;
  if (themeName) document.body.dataset.theme = themeName;
  else delete document.body.dataset.theme;
  const cs = getComputedStyle(document.body);
  const values = {};
  COLOR_TOKENS.forEach(t => { values[t.key] = cssColorToHex(cs.getPropertyValue(t.key).trim()); });
  if (original) document.body.dataset.theme = original;
  else delete document.body.dataset.theme;
  return values;
}

// Builds one <label class="v3-controls-row"> slider row inside
// `container`, wired to `get`/`set`. `onChange` runs after every input
// tick (default retraceIslands(), the cheap path -- callers whose
// control changes circle positions, not just shape/visual tuning, pass
// render() instead, see Layout's centerBias slider below). Returns a
// handle so callers (mainly Reset buttons) can pull the live value back
// in sync with the slider's own display without re-deriving the DOM.
function buildSlider(container, { label, min, max, step, get, set, onChange = retraceIslands }) {
  const row = document.createElement("label");
  row.className = "v3-controls-row";

  const nameSpan = document.createElement("span");
  nameSpan.className = "v3-controls-name";
  nameSpan.textContent = label;

  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(get());

  const valueSpan = document.createElement("span");
  valueSpan.className = "v3-controls-value";
  valueSpan.textContent = formatValue(get(), step);

  input.addEventListener("input", () => {
    const v = Number(input.value);
    set(v);
    valueSpan.textContent = formatValue(v, step);
    onChange();
  });

  row.appendChild(nameSpan);
  row.appendChild(input);
  row.appendChild(valueSpan);
  container.appendChild(row);

  return {
    refresh: () => {
      const v = get();
      input.value = String(v);
      valueSpan.textContent = formatValue(v, step);
    }
  };
}

function addGroupHeading(container, text) {
  const heading = document.createElement("div");
  heading.className = "v3-controls-group-label";
  heading.textContent = text;
  container.appendChild(heading);
  return heading;
}

// v3.6.22 -- a nested collapsible group, one level deeper than
// makeSection() below (native <details>/<summary> nests fine, no extra
// state to manage). Direct request: Wave ring parameters/Topological
// offset parameters were taking up a lot of the Visuals section's space
// even when not being actively tuned. Returns the <details> element
// itself, same contract as makeSection() -- append children directly to
// it, after its own <summary>.
function makeSubsection(container, title, open) {
  const details = document.createElement("details");
  details.className = "v3-controls-subsection";
  details.open = open;

  const summary = document.createElement("summary");
  summary.className = "v3-controls-subsection-summary";
  summary.textContent = title;
  details.appendChild(summary);

  container.appendChild(details);
  return details;
}

// `block: true` -- a single full-width button on its own line (Reroll,
// Restore position, the per-section Reset buttons); omitted for buttons
// meant to sit side-by-side in a flex row (the Reset ALL / Copy config
// footer), which already get that from .v3-controls-buttons.
function addButton(container, label, onClick, { block = false } = {}) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = block ? "v3-controls-btn v3-controls-btn-block" : "v3-controls-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  container.appendChild(btn);
  return btn;
}

// A native <details>/<summary> collapsible -- no custom open/close JS to
// maintain, and sections collapse/expand independently of each other for
// free. Returns the <details> element itself as the content container
// (append children directly to it, after its own <summary>).
function makeSection(panel, title, open) {
  const details = document.createElement("details");
  details.className = "v3-controls-section";
  details.open = open;

  const summary = document.createElement("summary");
  summary.className = "v3-controls-summary";
  summary.textContent = title;
  details.appendChild(summary);

  panel.appendChild(details);
  return details;
}

function buildControlPanel() {
  // v3.6.25 -- the whole panel is itself a <details>, closed by default
  // (direct request: it was covering too much of the canvas on load) --
  // same native collapsible pattern as the sections it contains, just one
  // level up. The title bar is the <summary>; everything else (sections,
  // footer buttons) only exists in the DOM tree once expanded is clicked.
  const panel = document.createElement("details");
  panel.className = "v3-controls";
  panel.open = false;

  const title = document.createElement("summary");
  title.className = "v3-controls-title";
  title.textContent = "Island generation tuning (dev only)";
  panel.appendChild(title);

  // =====================================================================
  // VISUALS -- the shallowest section: purely which rendering layers show
  // (wave rings, colour bands), never touches circle positions or the
  // coastline's own noise/warp shape. Open by default -- the section
  // this tool's own recent tuning history has touched most.
  // =====================================================================
  const visualsSection = makeSection(panel, "Visuals", true);

  // Deep-cloned (not just {...v3Config.island}) for the array fields --
  // every array-valued slider below (bands, wave rings) replaces
  // v3Config.island's array wholesale on every input tick rather than
  // mutating one in place (see the band sliders further down), so a
  // shallow copy here would otherwise alias the SAME array objects those
  // setters go on to replace, silently corrupting this snapshot the
  // first time any of those sliders moved.
  const visualsDefaults = {
    flatColourMode: v3Config.island.flatColourMode,
    showWaveRings: v3Config.island.showWaveRings,
    seaBandThresholds: [...v3Config.island.seaBandThresholds],
    sandThresholds: [...v3Config.island.sandThresholds],
    vegThresholds: [...v3Config.island.vegThresholds],
    waveDistances: [...v3Config.island.waveDistances],
    showFlowPotential: v3Config.flow.showPotential,
    showFlowVectors: v3Config.flow.showVectors,
    particleCount: v3Config.particles.count,
    particleMaxCount: v3Config.particles.maxCount,
    coastSpawnFraction: v3Config.particles.coastSpawnFraction,
    coastSpawnDirMode: v3Config.particles.coastSpawnDirMode,
    personalityMode: v3Config.particles.personalityMode
  };

  // -- Look checkboxes: independent on/off switches for the two effects
  // that already exist, replacing v3.6.8's three fixed preset buttons.
  // Two independent booleans cover all four combinations (including
  // "neither" -- plain flat land, no rings -- which the old three-button
  // version couldn't reach) without any bookkeeping for "which preset is
  // active." Both flatColourMode and showWaveRings already exist purely
  // as config flags drawIslandsPath() reads -- see its v3.6.9 bugfix
  // comment for why toggling flatColourMode at runtime needed a fix
  // before this could work correctly (stale elements from the inactive
  // branch used to stay on screen).
  const waveCheckRow = document.createElement("label");
  waveCheckRow.className = "v3-controls-checkbox-row";
  const waveCheck = document.createElement("input");
  waveCheck.type = "checkbox";
  waveCheck.checked = v3Config.island.showWaveRings;
  waveCheck.addEventListener("change", () => {
    v3Config.island.showWaveRings = waveCheck.checked;
    retraceIslands();
  });
  const waveCheckLabel = document.createElement("span");
  waveCheckLabel.textContent = "Wave contours";
  waveCheckRow.appendChild(waveCheck);
  waveCheckRow.appendChild(waveCheckLabel);
  visualsSection.appendChild(waveCheckRow);

  const bandCheckRow = document.createElement("label");
  bandCheckRow.className = "v3-controls-checkbox-row";
  const bandCheck = document.createElement("input");
  bandCheck.type = "checkbox";
  bandCheck.checked = !v3Config.island.flatColourMode;
  bandCheck.addEventListener("change", () => {
    v3Config.island.flatColourMode = !bandCheck.checked;
    retraceIslands();
  });
  const bandCheckLabel = document.createElement("span");
  bandCheckLabel.textContent = "Colour bands (topology)";
  bandCheckRow.appendChild(bandCheck);
  bandCheckRow.appendChild(bandCheckLabel);
  visualsSection.appendChild(bandCheckRow);

  // -- Theme (v3.6.14, expanded v3.6.15) -- seven parallel colour/type
  // treatments, meant to be compared against each other rather than one
  // replacing the other (see Landing-page-notes.2.0.md punch-list item 10
  // and v3-scheme-candidates.md for the reasoning behind each one). Pure
  // CSS switch via a data-theme attribute on <body> (cabinet-v3-style.css),
  // same pattern as Label style below -- except this ALSO nudges the Wave
  // contours / Colour bands checkboxes to whichever combination each
  // theme is meant to be seen with, since each theme's colours were tuned
  // assuming that pairing. Still just a starting point, not a lock --
  // both checkboxes stay independently editable afterward.
  const themeRow = document.createElement("label");
  themeRow.className = "v3-controls-row";
  const themeName = document.createElement("span");
  themeName.className = "v3-controls-name";
  themeName.textContent = "Theme";
  const themeSelect = document.createElement("select");
  themeSelect.style.gridArea = "input";
  themeSelect.style.width = "100%";
  THEME_OPTIONS.forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    themeSelect.appendChild(opt);
  });
  themeSelect.value = document.body.dataset.theme || "";
  const THEME_PRESETS = {
    medieval: { flatColourMode: true, showWaveRings: true },
    satellite: { flatColourMode: false, showWaveRings: false },
    "medieval-map": { flatColourMode: true, showWaveRings: true },
    bathymetric: { flatColourMode: false, showWaveRings: false },
    riso: { flatColourMode: false, showWaveRings: false },
    cyanotype: { flatColourMode: false, showWaveRings: false },
    neon: { flatColourMode: true, showWaveRings: true },
    ukiyo: { flatColourMode: false, showWaveRings: true },
    // v3.6.28 -- bands AND rings on together, same pairing as "ukiyo":
    // bands carry the dark sepia depth, rings lay the riso iso-line
    // accent on top -- see that theme's own CSS comment.
    medieRiso: { flatColourMode: false, showWaveRings: true }
  };
  themeSelect.addEventListener("change", () => {
    if (themeSelect.value) document.body.dataset.theme = themeSelect.value;
    else delete document.body.dataset.theme;
    applyThemeTokens(themeSelect.value);

    const preset = THEME_PRESETS[themeSelect.value];
    if (preset) {
      v3Config.island.flatColourMode = preset.flatColourMode;
      v3Config.island.showWaveRings = preset.showWaveRings;
      bandCheck.checked = !preset.flatColourMode;
      waveCheck.checked = preset.showWaveRings;
      retraceIslands();
    }
  });
  themeRow.appendChild(themeName);
  themeRow.appendChild(themeSelect);
  visualsSection.appendChild(themeRow);

  // -- Theme colours (v3.6.30) -- every theme's own 8 tokens, editable
  // independently of which one is currently live. themeTokenState is the
  // live working set, seeded from each theme's real CSS (readThemeTokens())
  // at panel-build time, BEFORE any inline override exists yet -- reading
  // any later than that would risk one theme's already-applied inline
  // colours bleeding into another theme's "original" reading, since
  // readThemeTokens() only flips the data-theme ATTRIBUTE, not whatever's
  // sitting in body.style. themeTokenDefaults is a one-time snapshot of
  // the same, kept untouched, for Reset colours.
  const themeTokenState = {};
  THEME_OPTIONS.forEach(([value]) => { themeTokenState[value] = readThemeTokens(value); });
  const themeTokenDefaults = {};
  Object.keys(themeTokenState).forEach(k => { themeTokenDefaults[k] = { ...themeTokenState[k] }; });

  // Pushes themeTokenState[themeName] onto <body> as inline custom
  // properties -- inline style outranks both the base body.v3-proto
  // block and any body.v3-proto[data-theme="X"] block, so this is what
  // actually makes an edit visible, and what makes switching Theme (see
  // themeSelect's change handler above) pick up whatever's been edited
  // for the newly active theme instead of reverting to its un-edited CSS.
  function applyThemeTokens(themeName) {
    const values = themeTokenState[themeName] || themeTokenState[""];
    COLOR_TOKENS.forEach(t => document.body.style.setProperty(t.key, values[t.key]));
  }

  // Nested one level deeper than the outer "Theme colours" subsection --
  // one collapsible group per theme, all closed by default, so browsing
  // to compare/copy a value between two themes doesn't mean scrolling
  // past the other seven's 8 rows each. A swatch + a plain text hex
  // field per token, kept in sync both ways -- the text field is what
  // makes "copy paste colour code from one to another" literal: select
  // it, copy, paste into another theme's field for the same token.
  const colorsSubsection = makeSubsection(visualsSection, "Theme colours (all themes)", false);
  const colorRowWidgets = [];
  THEME_OPTIONS.forEach(([themeValue, themeLabel]) => {
    const themeGroup = makeSubsection(colorsSubsection, themeLabel || "(none -- current default)", false);
    COLOR_TOKENS.forEach(token => {
      const row = document.createElement("label");
      row.className = "v3-controls-row";

      const nameSpan = document.createElement("span");
      nameSpan.className = "v3-controls-name";
      nameSpan.textContent = token.label;

      const swatch = document.createElement("input");
      swatch.type = "color";
      swatch.value = themeTokenState[themeValue][token.key];

      const hexField = document.createElement("input");
      hexField.type = "text";
      hexField.value = themeTokenState[themeValue][token.key];
      hexField.spellcheck = false;
      hexField.maxLength = 7;

      const commit = hex => {
        themeTokenState[themeValue][token.key] = hex;
        if ((document.body.dataset.theme || "") === themeValue) applyThemeTokens(themeValue);
      };

      swatch.addEventListener("input", () => {
        hexField.value = swatch.value;
        commit(swatch.value);
      });
      hexField.addEventListener("input", () => {
        if (/^#[0-9a-fA-F]{6}$/.test(hexField.value)) {
          swatch.value = hexField.value;
          commit(hexField.value);
        }
      });

      row.appendChild(nameSpan);
      row.appendChild(swatch);
      row.appendChild(hexField);
      themeGroup.appendChild(row);

      colorRowWidgets.push({
        refresh: () => {
          const v = themeTokenState[themeValue][token.key];
          swatch.value = v;
          hexField.value = v;
        }
      });
    });
  });

  addButton(colorsSubsection, "Reset colours", () => {
    Object.keys(themeTokenDefaults).forEach(k => { themeTokenState[k] = { ...themeTokenDefaults[k] }; });
    colorRowWidgets.forEach(w => w.refresh());
    applyThemeTokens(document.body.dataset.theme || "");
  }, { block: true });

  applyThemeTokens(document.body.dataset.theme || "");

  // -- Label style (v3.6.12) -- picks which .v3-island-label halo
  // treatment cabinet-v3-style.css applies, via a data-label-style
  // attribute on <body>. Pure CSS switch, no retraceIslands()/render()
  // needed -- see that file's own comment for what each option does.
  const labelStyleRow = document.createElement("label");
  labelStyleRow.className = "v3-controls-row";
  const labelStyleName = document.createElement("span");
  labelStyleName.className = "v3-controls-name";
  labelStyleName.textContent = "Label style";
  const labelStyleSelect = document.createElement("select");
  labelStyleSelect.style.gridArea = "input";
  labelStyleSelect.style.width = "100%";
  [
    ["halo", "Halo (thick stroke)"],
    ["glow", "Soft glow"],
    ["plain", "Plain (no treatment)"]
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    labelStyleSelect.appendChild(opt);
  });
  labelStyleSelect.value = document.body.dataset.labelStyle || "halo";
  labelStyleSelect.addEventListener("change", () => {
    document.body.dataset.labelStyle = labelStyleSelect.value;
  });
  labelStyleRow.appendChild(labelStyleName);
  labelStyleRow.appendChild(labelStyleSelect);
  visualsSection.appendChild(labelStyleRow);

  // -- Flow field debug (v3.6.16) -- see drawFlowFieldDebug() in
  // cabinet-v3-layout.js and the field notes in cabinet-v3-data.js.
  // Dev-only visualisation of the (not-yet-animated) flow field: Flow
  // potential tints a grid by the base current's own scalar potential
  // ("the noise field" itself, before curl is taken), Flow vectors draws
  // the full composite field (current + coast avoidance) as arrows.
  // Both cheap retraceIslands() toggles, same as Wave contours/Colour
  // bands above.
  const addFlowCheckbox = (key, label) => {
    const row = document.createElement("label");
    row.className = "v3-controls-checkbox-row";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = v3Config.flow[key];
    check.addEventListener("change", () => {
      v3Config.flow[key] = check.checked;
      retraceIslands();
    });
    const span = document.createElement("span");
    span.textContent = label;
    row.appendChild(check);
    row.appendChild(span);
    visualsSection.appendChild(row);
    return check;
  };
  const flowPotentialCheck = addFlowCheckbox("showPotential", "Flow potential (noise field)");
  const flowVectorsCheck = addFlowCheckbox("showVectors", "Flow vectors (directions)");

  // -- Particle counts (v3.6.22) -- direct request: "I want to try out
  // the look and feel of more and less particles." Base count is the
  // ambient baseline (always present, refilled by the field's own
  // respawn logic -- see stepParticle()'s own comment in
  // cabinet-v3-particles.js); Max cap is click-to-launch's hard ceiling
  // (launchBoatAt(), cabinet-v3-layout.js). Base count needs a pool
  // rebuild to actually take effect (refreshParticleCount(), fresh
  // off-canvas spawn positions -- same as a Reroll would give
  // particles); Max cap is read fresh on every click, so its onChange is
  // a no-op. No enforced relationship between the two sliders -- this is
  // a tuning tool, setting the cap below the base count just means
  // click-to-launch can never add anything, which is a harmless (if
  // slightly odd) state to leave it in.
  addGroupHeading(visualsSection, "Particle counts");
  const particleCountWidget = buildSlider(visualsSection, {
    label: "Base count", min: 10, max: 1000, step: 10,
    get: () => v3Config.particles.count,
    set: v => { v3Config.particles.count = v; },
    onChange: refreshParticleCount
  });
  const particleMaxWidget = buildSlider(visualsSection, {
    label: "Max cap (click-to-launch)", min: 10, max: 1000, step: 10,
    get: () => v3Config.particles.maxCount,
    set: v => { v3Config.particles.maxCount = v; },
    onChange: () => {}
  });

  // -- Coastal spawn (v3.6.22) -- direct idea: "coast-killed particles,
  // or any other, can respawn on a coast as well... shore repulsion
  // takes them out." Both read live on every spawn/respawn
  // (pickCoastalSpawnPoint()/spawnParticle(), cabinet-v3-particles.js),
  // so neither needs a pool rebuild -- onChange is a no-op for both, same
  // as Max cap above. Direction mode deliberately left as a live A/B --
  // "repulsion" (push straight off the shore) vs "blended" (the normal
  // current+coast blend every other spawn uses) hadn't been decided,
  // meant to be compared by feel rather than guessed.
  const coastSpawnFractionWidget = buildSlider(visualsSection, {
    label: "Coastal spawn %", min: 0, max: 1, step: 0.05,
    get: () => v3Config.particles.coastSpawnFraction,
    set: v => { v3Config.particles.coastSpawnFraction = v; },
    onChange: () => {}
  });

  const coastDirRow = document.createElement("label");
  coastDirRow.className = "v3-controls-row";
  const coastDirName = document.createElement("span");
  coastDirName.className = "v3-controls-name";
  coastDirName.textContent = "Coastal spawn direction";
  const coastDirSelect = document.createElement("select");
  coastDirSelect.style.gridArea = "input";
  coastDirSelect.style.width = "100%";
  [
    ["repulsion", "Repulsion (push off the shore)"],
    ["blended", "Blended field (normal spawn direction)"]
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    coastDirSelect.appendChild(opt);
  });
  coastDirSelect.value = v3Config.particles.coastSpawnDirMode;
  coastDirSelect.addEventListener("change", () => {
    v3Config.particles.coastSpawnDirMode = coastDirSelect.value;
  });
  coastDirRow.appendChild(coastDirName);
  coastDirRow.appendChild(coastDirSelect);
  visualsSection.appendChild(coastDirRow);

  // -- Particle personality (v3.6.23, demo/comparison build) -- direct
  // ask: "what's a fast good way for me to see a demo of one or both?"
  // See personalityFor()'s own comment in cabinet-v3-particles.js for
  // what each mode actually does. onChange forces a full pool rebuild
  // (refreshParticleCount()) rather than letting it phase in via natural
  // respawns -- the whole point of a demo toggle is an immediate,
  // unambiguous before/after, not a gradual one.
  const personalityRow = document.createElement("label");
  personalityRow.className = "v3-controls-row";
  const personalityName = document.createElement("span");
  personalityName.className = "v3-controls-name";
  personalityName.textContent = "Particle personality (demo)";
  const personalitySelect = document.createElement("select");
  personalitySelect.style.gridArea = "input";
  personalitySelect.style.width = "100%";
  [
    ["off", "Off (shared field only)"],
    ["bias", "Bias (constant personal speed/heading)"],
    ["offset", "Offset (personal read into the current)"],
    ["both", "Both"]
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    personalitySelect.appendChild(opt);
  });
  personalitySelect.value = v3Config.particles.personalityMode;
  personalitySelect.addEventListener("change", () => {
    v3Config.particles.personalityMode = personalitySelect.value;
    refreshParticleCount();
  });
  personalityRow.appendChild(personalityName);
  personalityRow.appendChild(personalitySelect);
  visualsSection.appendChild(personalityRow);

  // -- Wave ring parameters -- unchanged generator logic from v3.6.7
  // (waveDistances is a derived array, d[i] = start * multiplier^i +
  // offset, not a single scalar, so it doesn't fit the one-slider-one-key
  // model the band sliders below use), rebuilt on buildSlider() so its
  // Reset participates in the same handle-based pattern as everything
  // else in this file instead of its own bespoke reset code. Nested
  // collapsible (v3.6.22), closed by default -- see makeSubsection().
  const waveSubsection = makeSubsection(visualsSection, "Wave ring parameters", false);

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

  const waveValueSpan = document.createElement("div");
  waveValueSpan.className = "v3-controls-value";
  waveValueSpan.style.margin = "2px 0 8px";
  const refreshWavePreview = () => {
    waveValueSpan.textContent = computeWaveDistances(waveGen).map(d => d.toFixed(1)).join(", ");
  };

  const WAVE_FIELDS = [
    { key: "count", label: "Count", min: 2, max: 5, step: 1 },
    { key: "start", label: "Start (px)", min: 1, max: 30, step: 1 },
    { key: "multiplier", label: "Multiplier", min: 1, max: 5, step: 0.1 },
    { key: "offset", label: "Offset (px)", min: -10, max: 30, step: 1 }
  ];
  const waveFieldWidgets = {};
  WAVE_FIELDS.forEach(f => {
    waveFieldWidgets[f.key] = buildSlider(waveSubsection, {
      label: f.label, min: f.min, max: f.max, step: f.step,
      get: () => waveGen[f.key],
      set: v => { waveGen[f.key] = v; },
      onChange: () => {
        v3Config.island.waveDistances = computeWaveDistances(waveGen);
        refreshWavePreview();
        retraceIslands();
      }
    });
  });
  waveSubsection.appendChild(waveValueSpan);
  refreshWavePreview();

  // -- Topological offset parameters (v3.6.9, punch-list item 7) --
  // seaBandThresholds/sandThresholds/vegThresholds get their own sliders
  // for the first time -- previously hand-edit-only. One slider per
  // array element (indices read from the arrays' CURRENT length at panel
  // build time, not hardcoded, so this stays correct if the counts ever
  // change in cabinet-v3-data.js). Each setter replaces the array
  // wholesale (map(), not index assignment) rather than mutating in
  // place -- see visualsDefaults' own comment above for why that matters:
  // an in-place mutation would corrupt that snapshot's cloned array too,
  // since nothing else in this file re-clones it after the initial copy.
  // Nested collapsible (v3.6.22), closed by default -- see
  // makeSubsection() -- this one in particular can get long (one slider
  // per array element across all three bands).
  const topoSubsection = makeSubsection(visualsSection, "Topological offset parameters", false);

  const bandSliders = [];
  const addBandGroup = (arrayKey, label) => {
    v3Config.island[arrayKey].forEach((_, i) => {
      bandSliders.push(
        buildSlider(topoSubsection, {
          label: `${label} ${i + 1}`, min: BAND_MIN, max: BAND_MAX, step: BAND_STEP,
          get: () => v3Config.island[arrayKey][i],
          set: v => {
            v3Config.island[arrayKey] = v3Config.island[arrayKey].map((x, idx) => (idx === i ? v : x));
          }
        })
      );
    });
  };
  addBandGroup("seaBandThresholds", "Sea");
  addBandGroup("sandThresholds", "Sand");
  addBandGroup("vegThresholds", "Veg");

  // Reset-function pattern, shared by resetVisuals/resetShape/resetLayout:
  // each restores STATE ONLY (v3Config fields + each widget's .refresh())
  // and deliberately never calls retraceIslands()/render() itself -- that's
  // left to the caller. That's what lets each section's own Reset button
  // take the cheap path while Reset ALL, below, runs all three back to
  // back and pays for one render() at the end instead of three.
  function resetVisuals() {
    v3Config.island.flatColourMode = visualsDefaults.flatColourMode;
    v3Config.island.showWaveRings = visualsDefaults.showWaveRings;
    v3Config.island.seaBandThresholds = [...visualsDefaults.seaBandThresholds];
    v3Config.island.sandThresholds = [...visualsDefaults.sandThresholds];
    v3Config.island.vegThresholds = [...visualsDefaults.vegThresholds];
    v3Config.island.waveDistances = [...visualsDefaults.waveDistances];
    waveCheck.checked = v3Config.island.showWaveRings;
    bandCheck.checked = !v3Config.island.flatColourMode;
    delete document.body.dataset.theme;
    themeSelect.value = "";
    applyThemeTokens("");
    v3Config.flow.showPotential = visualsDefaults.showFlowPotential;
    v3Config.flow.showVectors = visualsDefaults.showFlowVectors;
    flowPotentialCheck.checked = v3Config.flow.showPotential;
    flowVectorsCheck.checked = v3Config.flow.showVectors;
    v3Config.particles.count = visualsDefaults.particleCount;
    v3Config.particles.maxCount = visualsDefaults.particleMaxCount;
    particleCountWidget.refresh();
    particleMaxWidget.refresh();
    v3Config.particles.coastSpawnFraction = visualsDefaults.coastSpawnFraction;
    v3Config.particles.coastSpawnDirMode = visualsDefaults.coastSpawnDirMode;
    coastSpawnFractionWidget.refresh();
    coastDirSelect.value = v3Config.particles.coastSpawnDirMode;
    v3Config.particles.personalityMode = visualsDefaults.personalityMode;
    personalitySelect.value = v3Config.particles.personalityMode;
    refreshParticleCount();
    bandSliders.forEach(s => s.refresh());
    Object.assign(waveGen, waveGenDefaults);
    Object.values(waveFieldWidgets).forEach(w => w.refresh());
    refreshWavePreview();
  }

  addButton(visualsSection, "Reset visuals", () => {
    resetVisuals();
    retraceIslands();
  }, { block: true });

  // =====================================================================
  // ISLAND SHAPE -- feeds the coastline trace (warp/angular/base-noise
  // parameters); doesn't touch circle positions. Collapsed by default.
  // =====================================================================
  const shapeSection = makeSection(panel, "Island shape", false);

  const shapeSliders = [];
  let currentGroup = null;
  CONTROLS.forEach(ctrl => {
    if (ctrl.group !== currentGroup) {
      currentGroup = ctrl.group;
      addGroupHeading(shapeSection, ctrl.group);
    }
    const getVal = ctrl.get || (() => v3Config.island[ctrl.key]);
    const setVal = ctrl.set || (v => { v3Config.island[ctrl.key] = v; });
    const defaultVal = getVal();
    const widget = buildSlider(shapeSection, { label: ctrl.label, min: ctrl.min, max: ctrl.max, step: ctrl.step, get: getVal, set: setVal });
    shapeSliders.push({ ...widget, setVal, defaultVal });
  });

  function resetShape() {
    shapeSliders.forEach(s => {
      s.setVal(s.defaultVal);
      s.refresh();
    });
  }

  addButton(shapeSection, "Reset shape", () => {
    resetShape();
    retraceIslands();
  }, { block: true });

  // =====================================================================
  // LAYOUT -- the deepest section: circle positions themselves, the thing
  // island shape and visuals are traced from. Collapsed by default, at
  // the bottom, per explicit direction ("deepest effect/earliest in the
  // workflow at the bottom"). Both controls call render() (the full
  // pipeline), not retraceIslands() -- see that export's own comment in
  // cabinet-v3-layout.js for the cost measurement behind reusing it as-is.
  // =====================================================================
  const layoutSection = makeSection(panel, "Layout", false);

  const packDefaults = { centerBias: v3Config.pack.centerBias };
  const centerBiasWidget = buildSlider(layoutSection, {
    label: "Center bias", min: 1, max: 4, step: 0.1,
    get: () => v3Config.pack.centerBias,
    set: v => { v3Config.pack.centerBias = v; },
    onChange: render
  });

  // A button, not a slider -- "try a different random layout" is a
  // discrete action with no meaningful in-between values.
  addButton(layoutSection, "Reroll positions", () => rerollPacking(), { block: true });

  function resetLayout() {
    v3Config.pack.centerBias = packDefaults.centerBias;
    centerBiasWidget.refresh();
    resetReroll();
  }

  // "restore position" -- the Layout section's own equivalent of the
  // other two sections' Reset buttons, named for what it visibly does
  // (undoes both a reroll and any centerBias drag) rather than "reset,"
  // to read clearly next to "Reroll positions" right above it.
  addButton(layoutSection, "Restore position", () => {
    resetLayout();
    render();
  }, { block: true });

  // =====================================================================
  // FOOTER -- Reset ALL (every section above, one render() at the end
  // rather than three separate re-renders) + Copy config (unchanged from
  // v3.6: dumps the full v3Config.island, arrays and all, including
  // everything this pass added).
  // =====================================================================
  const buttonRow = document.createElement("div");
  buttonRow.className = "v3-controls-buttons";

  addButton(buttonRow, "Reset ALL", () => {
    resetVisuals();
    resetShape();
    resetLayout();
    render();
  });

  const copyBtn = addButton(buttonRow, "Copy config", () => {
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

  panel.appendChild(buttonRow);

  document.body.appendChild(panel);
}

buildControlPanel();

// v3.6.17 -- islands-tool.html is the only page that ever starts the
// current/particle animation (see startCurrentAnimation()'s own comment
// in cabinet-v3-layout.js) -- this file itself never loads on
// index.template.html/build-render.html/archive, so that scoping is
// automatic, no page-detection logic needed here.
startCurrentAnimation();
