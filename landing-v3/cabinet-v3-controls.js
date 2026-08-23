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
import { retraceIslands, retraceThemePreviews, render, rerollPacking, resetReroll, startCurrentAnimation, refreshParticleCount } from "./cabinet-v3-layout.js";

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
// v3.7.28 -- -1.5 -> -2, headroom below the new waterLevel floor
// (cabinet-v3-data.js, -1.4): a slider whose own low end sits ONLY
// 0.1 past the floor makes the "why did this just vanish" cliff (see
// that field note) hard to find by feel; -2 leaves real room to drag
// past it and back.
const BAND_MIN = -2;
const BAND_MAX = 0.5;
const BAND_STEP = 0.02;

function formatValue(v, step) {
  return step < 1 ? Number(v).toFixed(2) : String(Math.round(v));
}

// Shared by the Theme <select> and the Theme colours editor below, so
// the two can't drift apart into two different lists of themes.
// v3.7.19 -- direct request, "start eliminating": dropped "" (none --
// current default), "medieval" (Wave Contour draft), "neon" (Neon
// Memphis), "ukiyo" (Ukiyo-e Woodblock). Full design descriptions for all
// of these stay in v3-scheme-candidates.md regardless -- that doc records
// the candidates themselves, independent of which ones still have a live
// CSS block (cabinet-v3-style.css's own body.v3-proto[data-theme=...]
// rules for these four were removed alongside this list).
// v3.7.22 -- "bathymetric" merged into "satellite" (relabelled "Topology"
// here, value unchanged -- see that theme's own CSS comment for the full
// merge reasoning) and dropped from this list too; its colours weren't
// discarded, they were copied into "medieRiso" instead (also that CSS
// comment).
// Direct request: only Topology + Medieval Map will go forward to
// PRODUCTION. Riso dropped entirely here (CSS removed too -- its
// reasoning stays in v3-scheme-candidates.md and git history if ever
// wanted back) since it was explicitly disposable ("can go"). Cyanotype
// and MedieRiso both stay live/selectable here even though neither will
// ship -- "archive" and "scratchpad" describe their FUTURE, not present
// reachability: Cyanotype is a kept reference worth comparing against
// (not actively developed further), MedieRiso is an ongoing experiment.
// Corrected after first removing Cyanotype from this list too, which was
// wrong -- direct feedback: "Cyanotype was supposed to be kept."
const THEME_OPTIONS = [
  ["satellite", "Topology"],
  ["medieval-map", "Medieval Map"],
  ["cyanotype", "Cyanotype"],
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
  { key: "--v3-peak", label: "Peak (Land 5)" },
  { key: "--v3-ink", label: "Ink" },
  { key: "--v3-ring-ink", label: "Ring / contour ink" },
  { key: "--v3-halo-ink", label: "Hover halo" },
  { key: "--v3-label-outline", label: "Label outline" }
  // v3.7.14 added --v3-coast-ink here ("the green isnt available to me on
  // the control panel drop down"). v3.7.16 removed it again: the inward
  // coastal band is no longer one theme-wide colour at all -- each
  // section now gets its own generated hue (drawCoastalInwardBands(),
  // cabinet-v3-layout.js), set as an inline style that always overrides
  // whatever this token held, so editing it here stopped doing anything
  // visible. Leaving a token in this list that silently no-ops would be
  // worse than not having a row for it.
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
    peakThresholds: [...v3Config.island.peakThresholds],
    waveDistances: [...v3Config.island.waveDistances],
    showFlowPotential: v3Config.flow.showPotential,
    showFlowVectors: v3Config.flow.showVectors,
    showNoise: v3Config.island.showNoise,
    particleCount: v3Config.particles.count,
    particleMaxCount: v3Config.particles.maxCount,
    coastSpawnFraction: v3Config.particles.coastSpawnFraction,
    coastSpawnDirMode: v3Config.particles.coastSpawnDirMode,
    personalityMode: v3Config.particles.personalityMode,
    showGeoGrid: v3Config.geo.showGrid,
    showGeoDiagonals: v3Config.geo.showDiagonals,
    latSpacing: v3Config.geo.latSpacing,
    lonSpacing: v3Config.geo.lonSpacing,
    showCoastalBands: v3Config.island.showCoastalBands,
    showSeaShadow: v3Config.island.showSeaShadow,
    seaShadowStyle: v3Config.island.seaShadowStyle
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

  // v3.7.21 -- direct request: "give me a toggle for the coastal bands
  // and sea shadows as well to turn on off." Same empty-list-vs-boolean
  // split as waveCheck above (showCoastalBands/showSeaShadow,
  // cabinet-v3-data.js) -- distances stay tuned across a toggle-off.
  // coastalBandCheck covers BOTH coastOutwardBandDistances (drawIslandsPath())
  // and coastInwardBandDistances (drawCoastalInwardBands()) -- they're the
  // one "coast to inward/outward" pair from the original scheme note, not
  // two separate effects, so one switch for both.
  const coastalBandCheckRow = document.createElement("label");
  coastalBandCheckRow.className = "v3-controls-checkbox-row";
  const coastalBandCheck = document.createElement("input");
  coastalBandCheck.type = "checkbox";
  coastalBandCheck.checked = v3Config.island.showCoastalBands;
  coastalBandCheck.addEventListener("change", () => {
    v3Config.island.showCoastalBands = coastalBandCheck.checked;
    retraceIslands();
  });
  // v3.7.25 -- direct feedback: "(in + out)" describes the two-subpath
  // ring construction (drawCoastalInwardBands()'s own comment -- an
  // evenodd hole punched in the coastline shape), an implementation
  // detail, not the concept -- reads as if there are two independent
  // things to toggle when there's one band. Dropped the suffix.
  const coastalBandCheckLabel = document.createElement("span");
  coastalBandCheckLabel.textContent = "Coastal band";
  coastalBandCheckRow.appendChild(coastalBandCheck);
  coastalBandCheckRow.appendChild(coastalBandCheckLabel);
  visualsSection.appendChild(coastalBandCheckRow);

  const seaShadowCheckRow = document.createElement("label");
  seaShadowCheckRow.className = "v3-controls-checkbox-row";
  const seaShadowCheck = document.createElement("input");
  seaShadowCheck.type = "checkbox";
  seaShadowCheck.checked = v3Config.island.showSeaShadow;
  seaShadowCheck.addEventListener("change", () => {
    v3Config.island.showSeaShadow = seaShadowCheck.checked;
    retraceIslands();
  });
  const seaShadowCheckLabel = document.createElement("span");
  seaShadowCheckLabel.textContent = "Sea shadow";
  seaShadowCheckRow.appendChild(seaShadowCheck);
  seaShadowCheckRow.appendChild(seaShadowCheckLabel);
  visualsSection.appendChild(seaShadowCheckRow);

  // v3.7.25 -- direct design discussion: two separate on/off checkboxes
  // (one per shadow style) would allow an invalid both-on state nothing
  // currently renders correctly for, and breaks the "one boolean per
  // effect" pattern every other toggle here uses. A style SELECTOR
  // instead -- same "theme seeds a starting value via THEME_PRESETS, the
  // control stays freely editable afterward" pattern the Theme dropdown
  // above already established -- gives the same flexibility (try the
  // directional style on a theme that doesn't default to it) without
  // that invalid state. Lives next to the Sea shadow checkbox it
  // modifies, not folded into the Theme row itself -- it's a property of
  // the shadow, not of the theme switch.
  const seaShadowStyleRow = document.createElement("label");
  seaShadowStyleRow.className = "v3-controls-row";
  const seaShadowStyleName = document.createElement("span");
  seaShadowStyleName.className = "v3-controls-name";
  seaShadowStyleName.textContent = "Shadow style";
  const seaShadowStyleSelect = document.createElement("select");
  seaShadowStyleSelect.style.gridArea = "input";
  seaShadowStyleSelect.style.width = "100%";
  [["radial", "Radial (all-around)"], ["directional", "Directional (tapered)"]].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    seaShadowStyleSelect.appendChild(opt);
  });
  seaShadowStyleSelect.value = v3Config.island.seaShadowStyle;
  seaShadowStyleSelect.addEventListener("change", () => {
    v3Config.island.seaShadowStyle = seaShadowStyleSelect.value;
    retraceIslands();
  });
  seaShadowStyleRow.appendChild(seaShadowStyleName);
  seaShadowStyleRow.appendChild(seaShadowStyleSelect);
  visualsSection.appendChild(seaShadowStyleRow);

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
  themeSelect.value = document.body.dataset.theme || THEME_OPTIONS[0][0];
  // v3.7.24 -- extended with showCoastalBands/seaShadowStyle, same
  // pattern as flatColourMode/showWaveRings above (a per-theme starting
  // point, not a lock -- both new checkboxes stay independently editable
  // after switching). Direct request: Topology's coastal bands read as
  // visual noise on top of its own directional shadow ("no coastal
  // bands"), and that shadow itself should be the tapering directional
  // style rather than every other theme's all-around radial one -- see
  // drawIslandsPath()'s own comment (cabinet-v3-layout.js) for the
  // "why directional, why tapered" reasoning. Every other theme keeps
  // exactly its previous behaviour (bands on, radial shadow) by listing
  // those same defaults explicitly rather than leaving them to fall back.
  const THEME_PRESETS = {
    satellite: { flatColourMode: false, showWaveRings: false, showCoastalBands: false, seaShadowStyle: "directional" },
    "medieval-map": { flatColourMode: true, showWaveRings: true, showCoastalBands: true, seaShadowStyle: "radial" },
    cyanotype: { flatColourMode: false, showWaveRings: false, showCoastalBands: true, seaShadowStyle: "radial" },
    // v3.6.28 -- bands AND rings on together, both carrying real weight:
    // bands carry the dark sepia depth, rings lay a riso iso-line accent
    // on top.
    medieRiso: { flatColourMode: false, showWaveRings: true, showCoastalBands: true, seaShadowStyle: "radial" }
  };
  // v3.7.27 -- pulled out of the change handler so the SAME preset logic
  // can also run once at panel-build time, below, for whichever theme the
  // page actually loaded on. Before this, a fresh load only got the right
  // flatColourMode/showWaveRings/etc. state because cabinet-v3-data.js's
  // own raw defaults happened to already match the page's default theme
  // (medieval-map) -- true by coincidence, not by construction, and it
  // silently broke the moment the default theme changed to Topology
  // (direct request) without also hand-editing data.js to match. Calling
  // this once on load makes any future default-theme change safe on its
  // own, without a matching data.js edit.
  const applyThemePreset = themeValue => {
    const preset = THEME_PRESETS[themeValue];
    if (!preset) return;
    v3Config.island.flatColourMode = preset.flatColourMode;
    v3Config.island.showWaveRings = preset.showWaveRings;
    v3Config.island.showCoastalBands = preset.showCoastalBands;
    v3Config.island.seaShadowStyle = preset.seaShadowStyle;
    bandCheck.checked = !preset.flatColourMode;
    waveCheck.checked = preset.showWaveRings;
    coastalBandCheck.checked = preset.showCoastalBands;
    seaShadowStyleSelect.value = preset.seaShadowStyle;
  };
  themeSelect.addEventListener("change", () => {
    if (themeSelect.value) document.body.dataset.theme = themeSelect.value;
    else delete document.body.dataset.theme;
    applyThemeTokens(themeSelect.value);
    applyThemePreset(themeSelect.value);
    retraceIslands();
  });
  // v3.7.27 -- the page's very first render() already ran (top-level call
  // in cabinet-v3-layout.js, which finishes evaluating before this
  // module's own top-level buildControlPanel() call below even starts --
  // ES module import order) using whatever raw v3Config.island defaults
  // cabinet-v3-data.js shipped with. If those don't match the page's
  // actual default theme, that first render is visually wrong until
  // something else happens to call retraceIslands(). applyThemePreset()
  // above only just now corrected v3Config.island itself -- this retrace
  // is what makes the very first frame match it, not just the checkboxes.
  applyThemePreset(themeSelect.value);
  retraceIslands();
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
    // v3.7.19 -- "" (the no-attribute default) was dropped from
    // THEME_OPTIONS, so it's no longer a valid themeTokenState key to
    // fall back to -- fall back to the first remaining option instead.
    const values = themeTokenState[themeName] || themeTokenState[THEME_OPTIONS[0][0]];
    COLOR_TOKENS.forEach(t => document.body.style.setProperty(t.key, values[t.key]));
  }

  // Theme-preview-on-hover prototype -- pushes v3Config.themePreview's
  // TARGET theme's live colours (themeTokenState, not a hardcoded
  // snapshot) onto the --v3-preview-* custom properties
  // cabinet-v3-style.css's .v3-island-theme-preview/
  // .v3-section-theme-preview read. Same "inline style outranks the
  // static CSS block" mechanism as applyThemeTokens() above, just against
  // its OWN token names so the preview never gets overwritten by whatever
  // applyThemeTokens() happens to be doing for the ACTIVE theme at the
  // same time -- the two run independently, on purpose (Medieval can be
  // active while Topology is what's being edited/previewed). v3.7.34 --
  // extended past the flat land wash to real per-band fidelity
  // (sand/veg/peak), so this now maps every token those bands read.
  function applyThemePreviewTokens() {
    const values = themeTokenState[v3Config.themePreview.previewTheme] || themeTokenState[THEME_OPTIONS[0][0]];
    document.body.style.setProperty("--v3-preview-ink", values["--v3-ink"]);
    // --v3-preview-land is the OUTER halo wash -- the "past the coastline,
    // into the sea" ring, not land at all. Was wrongly mapped to
    // --v3-sand (the same source as the real sand band painted on top of
    // it), which made the sand band invisible -- same colour, opaque wash
    // directly underneath, nothing to tell them apart. Direct feedback:
    // "sand is either not happenning or more likely hidden under the
    // yellow blob." --v3-sea-shallow reads correctly as sea, and gives
    // the sand band real contrast to sit on top of.
    document.body.style.setProperty("--v3-preview-land", values["--v3-sea-shallow"]);
    document.body.style.setProperty("--v3-preview-sand", values["--v3-sand"]);
    document.body.style.setProperty("--v3-preview-veg", values["--v3-veg"]);
    document.body.style.setProperty("--v3-preview-peak", values["--v3-peak"]);
    // v3.7.38 -- real sea-depth bands, same single token the real
    // .v3-sea-band uses (not a deep/shallow split).
    document.body.style.setProperty("--v3-preview-sea", values["--v3-sea-shallow"]);
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
        // Theme-preview-on-hover prototype: keep the hover preview in
        // sync with live edits to whichever theme it's currently
        // targeting, even while a DIFFERENT theme is the page's own
        // active/base look (that's the whole point -- Medieval stays
        // resting, Topology previews on hover, so this fires while
        // Topology is very likely NOT the active theme).
        if (v3Config.themePreview.previewTheme === themeValue) applyThemePreviewTokens();
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
    applyThemePreviewTokens();
  }, { block: true });

  applyThemeTokens(document.body.dataset.theme || "");

  // -- Theme-preview-on-hover prototype -- parameters of the CROSS-theme
  // transition itself (which theme reveals, how far past the coastline,
  // how blurred the edge is), deliberately separate from either theme's
  // own colour block above: these aren't colours, they're behaviour of
  // the hover mechanism, and belong to neither theme individually.
  const themePreviewSubsection = makeSubsection(visualsSection, "Theme hover preview", false);

  const previewThemeRow = document.createElement("label");
  previewThemeRow.className = "v3-controls-row";
  const previewThemeName = document.createElement("span");
  previewThemeName.className = "v3-controls-name";
  previewThemeName.textContent = "Preview theme";
  const previewThemeSelect = document.createElement("select");
  previewThemeSelect.style.gridArea = "input";
  previewThemeSelect.style.width = "100%";
  THEME_OPTIONS.forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    previewThemeSelect.appendChild(opt);
  });
  previewThemeSelect.value = v3Config.themePreview.previewTheme;
  previewThemeSelect.addEventListener("change", () => {
    v3Config.themePreview.previewTheme = previewThemeSelect.value;
    applyThemePreviewTokens();
  });
  previewThemeRow.appendChild(previewThemeName);
  previewThemeRow.appendChild(previewThemeSelect);
  themePreviewSubsection.appendChild(previewThemeRow);

  // onChange overridden -- retraceIslands() (the default) now ALSO
  // refreshes the theme preview (v3.7.34, folded in there so every OTHER
  // slider that can affect it, e.g. the Topological-offset sliders below,
  // doesn't need its own explicit wiring too), but these two sliders only
  // ever need the preview refreshed, never the shared coastline/band/grid
  // layers retraceIslands() also redraws -- calling retraceThemePreviews()
  // directly stays the cheaper, narrower choice for THESE specifically.
  // (Originally this override existed because retraceIslands() was a
  // silent no-op for the preview altogether -- confirmed live: "i turned
  // it upto 100 and went down to 7, no change" -- that's fixed now, this
  // override is a pure optimisation, not a correctness requirement.)
  buildSlider(themePreviewSubsection, {
    label: "Island halo (px)", min: 0, max: 100, step: 1,
    get: () => v3Config.themePreview.islandHaloPx,
    set: v => { v3Config.themePreview.islandHaloPx = v; },
    onChange: retraceThemePreviews
  });
  buildSlider(themePreviewSubsection, {
    label: "Section halo (px)", min: 0, max: 100, step: 1,
    get: () => v3Config.themePreview.sectionHaloPx,
    set: v => { v3Config.themePreview.sectionHaloPx = v; },
    onChange: retraceThemePreviews
  });
  // onChange overridden -- mostly pure CSS (a full retraceIslands() would
  // be wasted work for what's just a filter value), EXCEPT v3.7.38's
  // clipMarginFor(blurPx) also depends on this same slider (the hover
  // clip's hole needs to dilate further than the wash for a bigger blur,
  // so wave-rings/coastal-bands stay fully hidden under the wash's own
  // wider soft edge -- see that function's own comment) -- so this still
  // needs retraceThemePreviews(), just not the full retraceIslands().
  buildSlider(themePreviewSubsection, {
    label: "Edge blur (px)", min: 0, max: 30, step: 1,
    get: () => v3Config.themePreview.blurPx,
    set: v => { v3Config.themePreview.blurPx = v; },
    onChange: () => {
      document.body.style.setProperty("--v3-preview-blur", `${v3Config.themePreview.blurPx}px`);
      retraceThemePreviews();
    }
  });

  // Sync both live-editable pieces (colours + blur) to whatever
  // v3Config.themePreview shipped with, at panel-build time -- same
  // load-order lesson v3.7.27's applyThemePreset() fix already
  // established: don't rely on the static CSS fallback happening to
  // match data.js's defaults by coincidence.
  applyThemePreviewTokens();
  document.body.style.setProperty("--v3-preview-blur", `${v3Config.themePreview.blurPx}px`);

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
  // v3.7.27 -- fallback changed "halo" -> "glow": direct request, "label
  // style = soft glow as default." The real default lives on <body>'s own
  // data-label-style attribute (islands-tool.html / index.template.html)
  // -- this fallback only matters if that attribute is ever missing.
  labelStyleSelect.value = document.body.dataset.labelStyle || "glow";
  labelStyleSelect.addEventListener("change", () => {
    document.body.dataset.labelStyle = labelStyleSelect.value;
  });
  labelStyleRow.appendChild(labelStyleName);
  labelStyleRow.appendChild(labelStyleSelect);
  visualsSection.appendChild(labelStyleRow);

  // -- Diagnostics (v3.6.16, folded into one subsection at v3.7.28) --
  // raw simulation-field views, not part of the shipped look -- peeking
  // at what's actually driving the rendered shapes, not another visual
  // treatment of them. Flow potential/vectors (v3.6.16, see
  // drawFlowFieldDebug() in cabinet-v3-layout.js and the field notes in
  // cabinet-v3-data.js): Flow potential tints a grid by the base
  // current's own scalar potential ("the noise field" itself, before
  // curl is taken), Flow vectors draws the full composite field (current
  // + coast avoidance) as arrows. Island noise (v3.7.28, direct request:
  // "just like the flow potential, vectors... can the underlying noise
  // that make the islands and topo be made visible on toggle... a
  // under-the-hood dropdown that can then contain the flow potential and
  // vector checkboxes as well") -- same tint-a-grid treatment as Flow
  // potential, over buildIslandHeightmap()'s own H field instead of the
  // current's. Previously two loose checkboxes sitting directly in
  // Visuals; a real collapsible subsection (same makeSubsection() nesting
  // every other cluster here uses) reads better as a group and gives the
  // new one a home instead of adding a third loose row. All three are
  // cheap retraceIslands() toggles, same as Wave contours/Colour bands
  // above.
  const diagnosticsSubsection = makeSubsection(visualsSection, "Diagnostics", false);
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
    diagnosticsSubsection.appendChild(row);
    return check;
  };
  const flowPotentialCheck = addFlowCheckbox("showPotential", "Flow potential (noise field)");
  const flowVectorsCheck = addFlowCheckbox("showVectors", "Flow vectors (directions)");

  const noiseCheckRow = document.createElement("label");
  noiseCheckRow.className = "v3-controls-checkbox-row";
  const noiseCheck = document.createElement("input");
  noiseCheck.type = "checkbox";
  noiseCheck.checked = v3Config.island.showNoise;
  noiseCheck.addEventListener("change", () => {
    v3Config.island.showNoise = noiseCheck.checked;
    retraceIslands();
  });
  const noiseCheckLabel = document.createElement("span");
  noiseCheckLabel.textContent = "Island noise (heightmap)";
  noiseCheckRow.appendChild(noiseCheck);
  noiseCheckRow.appendChild(noiseCheckLabel);
  diagnosticsSubsection.appendChild(noiseCheckRow);

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
  // v3.7.7 -- wrapped in its own collapsible subsection (direct request:
  // "make... particle count sections collapsible as well") -- same
  // makeSubsection() nesting Wave ring parameters/Topological offset
  // parameters/Geo grid already use, just covering this whole cluster
  // (counts, coastal spawn, personality) under one summary instead of
  // sitting loose in Visuals.
  const particleSubsection = makeSubsection(visualsSection, "Particle counts", false);
  const particleCountWidget = buildSlider(particleSubsection, {
    label: "Base count", min: 10, max: 1000, step: 10,
    get: () => v3Config.particles.count,
    set: v => { v3Config.particles.count = v; },
    onChange: refreshParticleCount
  });
  const particleMaxWidget = buildSlider(particleSubsection, {
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
  const coastSpawnFractionWidget = buildSlider(particleSubsection, {
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
  particleSubsection.appendChild(coastDirRow);

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
  particleSubsection.appendChild(personalityRow);

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
  //
  // v3.7.26 -- direct feedback after walking through what these raw
  // heightmap values actually mean: "-0.62 is a notional zero... sea 1
  // being deeper than sea 4 is notionally dissonant." Two changes:
  // 1) every slider here now GETS/SETS relative to the live Base
  //    coastline Threshold (Island shape section, CONTROLS above), so 0
  //    always reads as "exactly the coastline," negative as sea-ward,
  //    positive as inland -- regardless of whatever Threshold itself is
  //    tuned to. The underlying arrays in v3Config.island still store
  //    RAW heightmap values (unchanged -- drawIslandsPath() and every
  //    other reader expects that); the +/- threshold conversion happens
  //    only here, at the UI boundary. Deliberately NOT a full rescale
  //    onto a fixed -1..1 span -- the sea side has a real, principled
  //    floor (waterLevel, -1 raw) but the land side has no equivalent
  //    hard ceiling to rescale against (noiseAmplitude bounds it in
  //    practice, not by construction), so inventing one would trade one
  //    arbitrary number (-0.62) for a different arbitrary one. A plain
  //    offset gets the actual usability win (0 = coast) without that.
  // 2) renumbered so "1" always means "nearest the coast," matching a
  //    "measured from sea level" intuition -- direct request: "Sea
  //    4-3-2-1 deep to coast and then Land 1-2-3-4 to go from coast to
  //    inland." Sea counts DOWN from the array (index 0, the loosest/
  //    deepest contour, now displays as the HIGHEST number). Land counts
  //    UP continuously across the sand/veg array boundary rather than
  //    restarting at 1 for veg -- they stay separate arrays (and
  //    separate colours, --v3-sand vs --v3-veg in cabinet-v3-style.css),
  //    only the visible numbering runs together, so a "(sand)"/"(veg)"
  //    suffix keeps that distinction visible now that the number alone
  //    doesn't carry it. A plain read-only row between the two groups
  //    marks where the coastline itself sits (always 0 in these now-
  //    relative units) -- "a frozen Coastline slider... or just a text
  //    label," went with the plain label: a disabled slider would still
  //    need an arbitrary track range to place its thumb on, for a
  //    single fixed point that doesn't actually need one.
  const topoSubsection = makeSubsection(visualsSection, "Topological offset parameters", false);

  const bandSliders = [];
  const addBandGroup = (arrayKey, label, displayIndex, suffix = "") => {
    v3Config.island[arrayKey].forEach((_, i) => {
      bandSliders.push(
        buildSlider(topoSubsection, {
          label: `${label} ${displayIndex(i)}${suffix}`,
          min: BAND_MIN - v3Config.island.threshold, max: BAND_MAX - v3Config.island.threshold, step: BAND_STEP,
          get: () => v3Config.island[arrayKey][i] - v3Config.island.threshold,
          set: v => {
            v3Config.island[arrayKey] = v3Config.island[arrayKey].map((x, idx) => (idx === i ? v + v3Config.island.threshold : x));
          }
        })
      );
    });
  };
  addBandGroup("seaBandThresholds", "Sea", i => v3Config.island.seaBandThresholds.length - i);

  const coastlineRow = document.createElement("div");
  coastlineRow.className = "v3-controls-row";
  const coastlineName = document.createElement("span");
  coastlineName.className = "v3-controls-name";
  coastlineName.textContent = "Coastline";
  const coastlineValue = document.createElement("span");
  coastlineValue.className = "v3-controls-value";
  coastlineValue.textContent = `0.00 (raw ${formatValue(v3Config.island.threshold, BAND_STEP)})`;
  coastlineRow.appendChild(coastlineName);
  coastlineRow.appendChild(coastlineValue);
  topoSubsection.appendChild(coastlineRow);

  addBandGroup("sandThresholds", "Land", i => i + 1, " (sand)");
  addBandGroup("vegThresholds", "Land", i => i + 1 + v3Config.island.sandThresholds.length, " (veg)");
  // v3.7.28 -- "Land 5," direct request: "can I have a land 5, and
  // colour it white... a mountain peak of sorts." Continues the same
  // coast-to-inland numbering as sand/veg above (peakThresholds' own
  // comment in cabinet-v3-data.js has the "why 0.13" reasoning).
  addBandGroup("peakThresholds", "Land", i => i + 1 + v3Config.island.sandThresholds.length + v3Config.island.vegThresholds.length, " (peak)");

  // -- Geo grid (v3.7.7) -- lat/long dotted grid + compass diagonals
  // (drawGeoGrid(), cabinet-v3-layout.js). Direct request: "2 separate
  // controls for each of them" -- latitude (horizontal lines) and
  // longitude (vertical lines) get independent sliders rather than one
  // shared spacing, bound straight to v3Config.geo so the default
  // retraceIslands() onChange (drawGeoGrid() now runs inside it too)
  // redraws just the grid on every tick, same cheap path every other
  // slider in this subsection already uses.
  // v3.7.8 -- "off" toggles added (same checkbox-row pattern as Wave
  // contours/Colour bands above), and both sliders widened to 0-600
  // (were 40-300) -- both direct requests. 0 is a valid, non-crashing
  // value on either slider now -- see drawGeoGrid()'s own "spacing <= 0"
  // guard in cabinet-v3-layout.js. Grid and diagonals get INDEPENDENT
  // toggles (v3Config.geo.showGrid/showDiagonals) -- direct follow-up:
  // "separate toggles for grid and compass diagonals."
  const geoSubsection = makeSubsection(visualsSection, "Geo grid", false);

  const addGeoCheckbox = (key, label) => {
    const row = document.createElement("label");
    row.className = "v3-controls-checkbox-row";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = v3Config.geo[key];
    check.addEventListener("change", () => {
      v3Config.geo[key] = check.checked;
      retraceIslands();
    });
    const checkLabel = document.createElement("span");
    checkLabel.textContent = label;
    row.appendChild(check);
    row.appendChild(checkLabel);
    geoSubsection.appendChild(row);
    return check;
  };
  const showGridCheck = addGeoCheckbox("showGrid", "Show lat/long grid");
  const showDiagonalsCheck = addGeoCheckbox("showDiagonals", "Show compass diagonals");

  const latSpacingWidget = buildSlider(geoSubsection, {
    label: "Latitude spacing (px)", min: 0, max: 600, step: 1,
    get: () => v3Config.geo.latSpacing,
    set: v => { v3Config.geo.latSpacing = v; }
  });
  const lonSpacingWidget = buildSlider(geoSubsection, {
    label: "Longitude spacing (px)", min: 0, max: 600, step: 1,
    get: () => v3Config.geo.lonSpacing,
    set: v => { v3Config.geo.lonSpacing = v; }
  });

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
    v3Config.island.peakThresholds = [...visualsDefaults.peakThresholds];
    v3Config.island.waveDistances = [...visualsDefaults.waveDistances];
    waveCheck.checked = v3Config.island.showWaveRings;
    bandCheck.checked = !v3Config.island.flatColourMode;
    // v3.7.19 -- "" (the no-attribute default) was dropped from
    // THEME_OPTIONS along with 3 other themes ("start eliminating"), so
    // Reset now falls back to the first remaining option instead of an
    // attribute value the dropdown itself no longer offers.
    const resetTheme = THEME_OPTIONS[0][0];
    document.body.dataset.theme = resetTheme;
    themeSelect.value = resetTheme;
    applyThemeTokens(resetTheme);
    v3Config.flow.showPotential = visualsDefaults.showFlowPotential;
    v3Config.flow.showVectors = visualsDefaults.showFlowVectors;
    flowPotentialCheck.checked = v3Config.flow.showPotential;
    flowVectorsCheck.checked = v3Config.flow.showVectors;
    v3Config.island.showNoise = visualsDefaults.showNoise;
    noiseCheck.checked = v3Config.island.showNoise;
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
    v3Config.geo.showGrid = visualsDefaults.showGeoGrid;
    v3Config.geo.showDiagonals = visualsDefaults.showGeoDiagonals;
    showGridCheck.checked = v3Config.geo.showGrid;
    showDiagonalsCheck.checked = v3Config.geo.showDiagonals;
    v3Config.geo.latSpacing = visualsDefaults.latSpacing;
    v3Config.geo.lonSpacing = visualsDefaults.lonSpacing;
    latSpacingWidget.refresh();
    lonSpacingWidget.refresh();
    v3Config.island.showCoastalBands = visualsDefaults.showCoastalBands;
    v3Config.island.showSeaShadow = visualsDefaults.showSeaShadow;
    v3Config.island.seaShadowStyle = visualsDefaults.seaShadowStyle;
    coastalBandCheck.checked = v3Config.island.showCoastalBands;
    seaShadowCheck.checked = v3Config.island.showSeaShadow;
    seaShadowStyleSelect.value = v3Config.island.seaShadowStyle;
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
