// Orchestration + rendering only -- calls into cabinet-v3-data.js /
// cabinet-v3-treemap.js / cabinet-v3-circlepack.js, builds the actual
// SVG, no layout math of its own. Mirrors the
// data/logic/render split documented in fffx's LANDING-PAGE-NOTES.md.
//
// Deliberately renders ONCE, no resize listener. fffx's field
// recomputes its whole subdivision on every resize (and reseeds
// randomness on every full page load) because its layout is a live,
// viewport-sized field. This prototype's premise is the opposite --
// "the layout is not recomputed every time the page loads, it is
// recomputed only when new entries (or sections) are added (or
// removed)" (explicit design decision, see Landing-page-notes.2.0.md) --
// so it draws to an SVG viewBox and lets the browser scale that viewBox
// responsively via CSS, the same technique the real docs/index.html map
// already uses (see DESIGN-SYSTEM.md). Re-running the layout means
// editing content and reloading, not resizing the window. v3.6.10: the
// viewBox's own SHAPE (not just its scale) is now solved once, at
// render() time, from the real viewport -- see resolveCanvasDimensions()
// -- so a wide window and a tall one get genuinely different-shaped maps
// at the same overall content density, not the same fixed rectangle
// scaled differently. This still isn't live-resize-reactive: drag the
// window narrower after load and the baked shape just scales down via
// CSS (still no resize listener), same as a fixed-1200px canvas always
// did -- only the INITIAL shape adapts to viewport now, not every
// subsequent resize.

import { v3Config, EXTRA_WEIGHT } from "./cabinet-v3-data.js";
import { sections, entries } from "../docs/assets/js/cabinet-generated-content.js";
import { squarify } from "./cabinet-v3-treemap.js";
import { generateScatterPoints, sortPointsByBandReadingOrder, growCircles, createSeededRng, safeMinSeparation, insetRect, centerPointsInRect } from "./cabinet-v3-circlepack.js";
import { buildIslandHeightmap, traceContourFromHeightmap, buildCoastlineDistanceField } from "./cabinet-v3-islandshape.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// v3.6: caches the one expensive layout pass's output (grown circles +
// canvasBounds) so the control panel's sliders (cabinet-v3-controls.js)
// can re-trace island shapes on every input event without re-running
// treemap/circle-packing -- packing only depends on content (entries/
// weights), never on island-shape tuning, so there's nothing to redo
// there when only v3Config.island changes.
let islandLayoutState = null;

// v3.6.8 -- bumped by cabinet-v3-controls.js's "Reroll positions" button,
// folded into every section's scatter seed below (sectionSeed()) so a
// reroll produces a genuinely different archipelago layout while staying
// off Math.random() -- still fully deterministic (same nonce always
// produces the same layout), it's just no longer pinned to 0. Stays 0
// forever on index.html/archive (neither loads cabinet-v3-controls.js),
// so this has no effect on anything but the two live-tuning pages.
let rerollNonce = 0;

function sectionSeed(sectionId) {
  return rerollNonce ? `${sectionId}::reroll${rerollNonce}` : sectionId;
}

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
}

// Step 1: fold entries into sections. A section's weight is the sum of
// its own visible entries' weights (not an independently authored
// number) -- see the "Section weight" decision in
// Landing-page-notes.2.0.md. Sections with zero visible entries (hence
// zero weight) are dropped: no region to reserve for a section with
// nothing to show.
function buildSectionMetas() {
  const visibleEntries = [...entries].filter(e => e.status !== false);

  return sections
    .filter(s => s.status !== false)
    .map(s => {
      const sectionEntries = visibleEntries
        .filter(e => e.section === s.id)
        .sort((a, b) => a.order - b.order);
      const weight = sectionEntries.reduce((sum, e) => sum + e.weight, 0);
      return { id: s.id, title: s.title, href: s.href, order: s.order, weight, entries: sectionEntries, extraCount: s.extraCount };
    })
    .filter(s => s.weight > 0)
    .sort((a, b) => a.order - b.order);
}

// A section's weight for *area-allocation* purposes only (treemap
// sizing) -- clamped up to v3Config.canvas.minSectionWeight (v3.4).
// Real entry weights, circle sizing, and sectionMeta.weight itself are
// untouched; this is read only by canvasHeightFor() and buildRegions(),
// consistently, so squarify()'s internal proportions and the canvas
// area they're allocated within always agree with each other -- using
// clamped weight in one place and real weight in the other would
// silently steal area from other sections rather than grow the canvas
// to accommodate the floor, which isn't what was asked for ("the entire
// page will grow a little").
function effectiveWeightForArea(sectionMeta, config) {
  return Math.max(config.minSectionWeight, sectionMeta.weight);
}

// Canvas AREA from total content weight, not from an aspect search --
// v3.1 change, see cabinet-v3-data.js's comment. Canvas area scales
// linearly with how much is actually on the page; SHAPE (width vs.
// height) is solved separately, below, from the viewport.
function resolveCanvasArea(sectionMetas, config) {
  const totalWeight = sectionMetas.reduce((sum, s) => sum + effectiveWeightForArea(s, config), 0) || 1;
  return totalWeight * config.areaPerWeightUnit;
}

// v3.6.10 -- full-bleed sizing: width and height are solved TOGETHER from
// two independent things -- resolveCanvasArea() above (content-driven,
// untouched) and the actual available viewport space's own aspect ratio,
// read once here. width * height = area (so overall density/zoom stays
// exactly as tuned regardless of window shape) and height / width =
// (available height / available width) -- i.e. this reshapes the
// treemap's own starting rectangle to match the window BEFORE squarify()
// ever runs, rather than distorting a fixed-shape result after the fact.
// A portrait window gets a portrait map; a wide window gets a wide one.
//
// "Available" space comes from measuring the real DOM: .v3-stage-wrap's
// own content width (its clientWidth minus its own left/right padding --
// read from computed style, not hardcoded, so this can't drift out of
// sync with cabinet-v3-style.css), and the viewport height remaining
// below wherever that element actually starts (window.innerHeight minus
// its top offset minus its own bottom padding) -- this is what makes the
// same code correctly account for index.html/islands-tool.html's header
// (whatever height that happens to render at) without needing to know
// about it specifically. build-render.html (the build-time capture page)
// has no .v3-stage-wrap at all -- falls back to the bare viewport size,
// with build-static.mjs pinning an explicit browser viewport so the
// shipped static page's baked shape is a deliberate choice, not whatever
// Playwright's own default happens to be.
//
// Deliberately no attempt to account for islands-tool.html's own
// position:fixed control panel -- cabinet-v3-controls.js hasn't run yet
// at the point render() first executes (it's a later script tag), so
// there's nothing in the DOM to detect even if this wanted to.
function resolveCanvasDimensions(sectionMetas, config) {
  const area = resolveCanvasArea(sectionMetas, config);

  let availWidth = window.innerWidth;
  let availHeight = window.innerHeight;
  const wrap = document.querySelector(".v3-stage-wrap");
  if (wrap) {
    const style = getComputedStyle(wrap);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padBottom = parseFloat(style.paddingBottom);
    availWidth = wrap.clientWidth - padX;
    availHeight = window.innerHeight - wrap.getBoundingClientRect().top - padBottom;
  }
  availWidth = Math.max(config.minWidth, availWidth);
  availHeight = Math.max(config.minHeight, availHeight);

  const aspect = availHeight / availWidth;
  const width = Math.sqrt(area / aspect);
  return { width, height: width * aspect };
}

// Step 2: weighted rectangular partition of the canvas, one region per
// section. The aspect-band contract from v3.0 is relaxed for now (see
// cabinet-v3-treemap.js's comment) -- squarify() still keeps rows
// reasonably square as a side effect of its own scoring, just without a
// hard band enforced on top. width/height (v3.6.10: solved from the
// viewport by resolveCanvasDimensions(), not a fixed config constant) are
// passed in by the caller rather than read from config directly, so this
// function's own job stays just "partition a WxH rect," same as always.
function buildRegions(sectionMetas, width, height) {
  const { regionGap } = v3Config.canvas;
  const items = sectionMetas.map(s => ({ id: s.id, weight: effectiveWeightForArea(s, v3Config.canvas) }));
  const rects = squarify(items, { x: 0, y: 0, width, height });

  const regions = rects.map(r => ({
    id: r.id,
    outer: r,
    inner: {
      x: r.x + regionGap,
      y: r.y + regionGap,
      width: r.width - regionGap * 2,
      height: r.height - regionGap * 2
    }
  }));

  return { regions, canvasWidth: width, canvasHeight: height };
}

// Greedy word-wrap: packs words onto a line until the next word would
// exceed maxWidth (estimated the same way the rest of this file
// estimates text width -- char count x fontSize x charWidthFactor, no
// real text-metrics API available outside a live DOM measurement pass).
// A single word wider than maxWidth on its own is left to overflow that
// one line rather than being split mid-word -- rare (needs a long
// un-hyphenatable word in a very narrow region) and still caught by
// computeSectionLabel()'s fitsWidth check, which triggers the normal
// shrink-then-truncate fallback same as any other overflow.
function wrapTitleToLines(title, fontSize, maxWidth, charWidthFactor) {
  const words = title.split(" ");
  const lines = [];
  let current = "";

  words.forEach(word => {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || candidate.length * fontSize * charWidthFactor <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);

  return lines;
}

// Section titles vary a lot in length ("CV" vs "Interfaces, Data &
// Texts") and regions vary a lot in width (down to ~110px for the
// lightest-weight section) -- a single fixed font size either wastes
// space on short titles in wide regions or overflows on long titles in
// narrow ones. v3.4: prefers wrapping onto more lines (up to
// `maxBandHeight`, itself grown from the default band height to fit,
// capped so a label can't eat an unreasonable fraction of its region)
// over shrinking font size, and only shrinks font (down to a floor)
// once wrapping alone can't make it fit either; truncates with an
// ellipsis on the last line as the final fallback.
//
// Returns both the fitted label (lines/fontSize/lineHeight) and the
// band height it actually needs -- computeSectionLabel() is called
// once per section, before splitLabelBand(), specifically so the band
// can be sized to the label instead of the label being squeezed into a
// band height decided without knowing what the label needed.
function computeSectionLabel(title, innerRect) {
  // v3.6.12 -- was 22/12: read as oversized next to the entry-island
  // labels (13px, cabinet-v3-style.css's .v3-island-label) and the
  // region titles themselves, not the map's content.
  const basePx = 16;
  const minPx = 10;
  const charWidthFactor = 0.56;
  const paddingX = 14;
  const paddingY = 8;
  const lineHeightFactor = 1.25;

  const defaultBandHeight = Math.min(44, Math.max(26, innerRect.height * 0.14));
  const maxBandHeight = Math.max(defaultBandHeight, Math.min(innerRect.height * 0.4, defaultBandHeight * 3));
  const availableWidth = Math.max(1, innerRect.width - paddingX * 2);
  const availableHeight = Math.max(1, maxBandHeight - paddingY * 2);

  function attempt(fontSize) {
    const lines = wrapTitleToLines(title, fontSize, availableWidth, charWidthFactor);
    const lineHeight = fontSize * lineHeightFactor;
    const maxLineWidth = Math.max(...lines.map(l => l.length * fontSize * charWidthFactor));
    return {
      lines,
      fontSize,
      lineHeight,
      fitsWidth: maxLineWidth <= availableWidth,
      fitsHeight: lines.length * lineHeight <= availableHeight
    };
  }

  let result = attempt(basePx);
  let fontSize = basePx;
  while ((!result.fitsWidth || !result.fitsHeight) && fontSize > minPx) {
    fontSize -= 1;
    result = attempt(fontSize);
  }

  if (!result.fitsWidth || !result.fitsHeight) {
    // Still doesn't fit even at the floor size -- keep as many lines as
    // fit within availableHeight, ellipsis-truncating the last one,
    // rather than letting it run past the region.
    const maxLines = Math.max(1, Math.floor(availableHeight / result.lineHeight));
    const lines = result.lines.slice(0, maxLines);
    if (result.lines.length > maxLines || !result.fitsWidth) {
      const last = lines[maxLines - 1] || "";
      lines[maxLines - 1] = last.length > 1 ? `${last.slice(0, -1)}…` : "…";
    }
    result = { ...result, lines };
  }

  const bandHeight = Math.max(
    defaultBandHeight,
    Math.min(maxBandHeight, result.lines.length * result.lineHeight + paddingY * 2)
  );

  return { lines: result.lines, fontSize: result.fontSize, lineHeight: result.lineHeight, bandHeight };
}

// A dedicated strip at the *bottom* of each region (v3.4 -- was the top
// through v3.1-v3.3), reserved for the section title before any circle
// is packed -- not a corner-search over the finished archipelago. v3.1's
// first pass tried the search-after-the-fact approach and it broke down
// once packing got genuinely dense (growth-based packing fills a region
// far more completely than the old row-flow grid did): there was often
// no candidate corner that didn't touch a circle, the fallback's
// fixed-width backing plate overflowed into neighbouring regions on
// narrower sections, and long titles ran past their own region's edge.
// Reserving the band up front guarantees "label never overlaps a
// circle" by construction -- packing simply never happens inside the
// band -- rather than by hoping a gap exists after the fact. `label`
// comes from computeSectionLabel(), called first so the band is sized
// to what the title actually needs.
function splitLabelBand(region, label) {
  const bandHeight = label.bandHeight;
  return {
    band: {
      x: region.inner.x,
      y: region.inner.y + region.inner.height - bandHeight,
      width: region.inner.width,
      height: bandHeight
    },
    pack: {
      x: region.inner.x,
      y: region.inner.y,
      width: region.inner.width,
      height: Math.max(1, region.inner.height - bandHeight)
    }
  };
}

// Step 3: place seed points across the region's pack area (below the
// label band) in two passes (v3.4.2) -- entries first (scattered,
// ordered into a top-left-to-bottom-right reading sequence, zipped to
// `order`-sorted entries, then centered on the pack area), extras
// second (scattered into whatever room the now-fixed entries left,
// zipped in whatever order they were generated -- no reading order or
// centering of their own). See "How archipelagos are packed" in
// Landing-page-notes.2.0.md for why entries and extras no longer share
// one scatter+center pass. Position is decided once, here -- growth (a
// separate, later, GLOBAL step in render(), see its growCircles() call)
// only ever changes radius, never position, and runs across every
// section's seeds together rather than one section at a time. This
// function only produces the *seeds*, tagged with which section/region
// they belong to and that region's own maxRadius cap; it doesn't grow
// anything itself.
function buildSeedsForSection(sectionMeta, packArea, allPlacedPoints) {
  const entryItems = sectionMeta.entries.map(e => ({
    id: e.id,
    weight: e.weight,
    kind: "entry",
    title: e.title,
    href: e.href,
    status: e.status
  }));

  const extraItems = Array.from({ length: sectionMeta.extraCount }, (_, i) => ({
    id: `${sectionMeta.id}-extra-filler-${i}`,
    weight: EXTRA_WEIGHT,
    kind: "filler"
  }));

  // Scatter into a rect pre-inset by minRadius, not the raw pack area --
  // every point is then guaranteed at least minRadius of clearance from
  // its *own* region's edge, so the hard starting-radius floor
  // (packRadiusFor()'s minRadius) never itself conflicts with the
  // boundary-safe-start guarantee growCircles() enforces. This inset is
  // still relative to the section's own pack area even though growth
  // itself (elsewhere) is no longer region-bounded -- seeding still
  // anchors an entry near its own label/region; only growth is free to
  // wander past that region's own edge.
  //
  // `allPlacedPoints` (v3.3) is checked too, not just this section's own
  // points -- two regions sit only ~2x regionGap apart, close enough
  // that a purely per-region separation check could let a point here
  // scatter within minSeparation of a point already placed for a
  // different section, which growth (now global, see render()) would
  // then treat exactly like the too-close-within-one-region case this
  // separation logic exists to prevent. Mutates allPlacedPoints (pushes
  // this section's own new points onto it, entries first then extras --
  // see below) so the *next* section's call sees this one's points too
  // -- render() calls this once per section, in sequence, sharing one
  // array across the whole pass.
  const scatterArea = insetRect(packArea, v3Config.pack.minRadius);
  const rng = createSeededRng(sectionSeed(sectionMeta.id));

  // Entries scatter, order, and center FIRST -- on their own, not mixed
  // with extras (v3.4.2). Order + zip happens before centering, same as
  // before, so `sortPointsByBandReadingOrder()` still decides reading
  // position and `order` still decides which entry claims which
  // position; centering only ever translates afterward.
  const scatteredEntries = generateScatterPoints(
    entryItems.length,
    scatterArea,
    rng,
    safeMinSeparation(v3Config.pack),
    allPlacedPoints,
    v3Config.pack.centerBias
  );
  const orderedEntries = sortPointsByBandReadingOrder(scatteredEntries, scatterArea, v3Config.pack.bandHeightRatio);
  const zippedEntries = entryItems.map((item, i) => ({ ...item, x: orderedEntries[i].x, y: orderedEntries[i].y }));
  const centeredEntries = centerPointsInRect(zippedEntries, scatterArea);
  allPlacedPoints.push(...centeredEntries);

  // Extras scatter SECOND, into whatever room is actually left once
  // entries are placed and centered (v3.4.2) -- `allPlacedPoints`
  // already includes this section's own just-centered entries by this
  // point (pushed above), so extras' rejection sampling naturally avoids
  // them along with every other section's points, the same mechanism
  // either way. This replaces v3.4.1's approach (scatter everyone
  // together, then translate everyone by a delta computed from entries
  // alone) specifically because that approach could drag an extra's
  // *already-valid* position somewhere new post-hoc -- observed
  // concretely as a handful of filler circles translated to
  // zero-clearance-from-their-own-label-band positions (harmless,
  // radius clamped to 0, but an artifact of the translation, not
  // deliberate placement). Scattering extras after entries are already
  // fixed means nothing ever moves them again -- their own scatter
  // *is* their final position, same as entries', just with no reading
  // order or centering requirement of their own.
  const scatteredExtras = generateScatterPoints(
    extraItems.length,
    scatterArea,
    rng,
    safeMinSeparation(v3Config.pack),
    allPlacedPoints,
    v3Config.pack.centerBias
  );
  const zippedExtras = extraItems.map((item, i) => ({ ...item, x: scatteredExtras[i].x, y: scatteredExtras[i].y }));
  allPlacedPoints.push(...zippedExtras);

  const centered = [...centeredEntries, ...zippedExtras];

  // maxRadius still derives from this item's *own* region (a cap on how
  // big any one entry from a small section can get, even with room
  // elsewhere to grow into) -- carried on each seed since the actual
  // growth pass, below, no longer has a single region to derive one
  // shared cap from.
  const maxRadius = Math.min(packArea.width, packArea.height) * v3Config.pack.maxRadiusRatio;

  return centered.map(item => ({
    ...item,
    maxRadius,
    sectionId: sectionMeta.id
  }));
}

function renderRegion(stage, region, band, label, sectionMeta, circles) {
  const group = el("g", { class: "v3-region", "data-section": sectionMeta.id });

  group.appendChild(
    el("rect", {
      class: "v3-region-outline",
      x: region.inner.x,
      y: region.inner.y,
      width: region.inner.width,
      height: region.inner.height
    })
  );

  // v3.6.13 -- the section's own landing page link. Covers the WHOLE
  // region.inner rect (label band + pack area both), so hovering/
  // clicking anywhere in that section's "water" reaches its page, not
  // just the label text -- rendered before the entry islands below, so
  // they paint (and hit-test) on top of it wherever they overlap, and a
  // hover over an island never also lights up the section underneath.
  // Hover feedback is a blurred glow, not a stroked/hard-edged shape --
  // see .v3-section-glow in cabinet-v3-style.css for why (same reasoning
  // as .v3-island-glow below).
  const sectionLink = el("a", { class: "v3-section-link", href: sectionMeta.href || "#" });
  sectionLink.appendChild(
    el("rect", {
      class: "v3-section-hit",
      x: region.inner.x,
      y: region.inner.y,
      width: region.inner.width,
      height: region.inner.height
    })
  );
  sectionLink.appendChild(
    el("rect", {
      class: "v3-section-glow",
      x: region.inner.x,
      y: region.inner.y,
      width: region.inner.width,
      height: region.inner.height
    })
  );
  group.appendChild(sectionLink);

  // v3.5: the visible island shape itself is drawn once, globally, as a
  // shared <path> underneath every region (see render()) -- traced from
  // every circle's own noise-carved coastline, fused where circles sit
  // close together. What's drawn here per-circle is only the
  // *interactive* layer on top of that shared shape: an invisible hit
  // circle at the entry's original (x, y, radius) so clicking/hovering
  // still targets the right entry even where its visible coastline has
  // merged with a neighbour's, plus a dashed status ring for any entry
  // not fully live (status: "wip") since a fused landmass can't be given
  // two different fill colors for two different entries' statuses the
  // way separate circles could.
  //
  // v3.6.13 -- hover used to ring the hit circle with a stroke; that
  // read as a hard, obviously-artificial circle popping up over an
  // organic coastline. Replaced with a blurred glow circle, slightly
  // larger than the entry's own radius so it bleeds a little past the
  // coastline edge instead of stopping dead at it -- see
  // .v3-island-glow in cabinet-v3-style.css.
  circles.forEach(c => {
    if (c.kind === "entry") {
      const isMuted = c.status === "wip";
      const link = el("a", { class: "v3-island", href: c.href || "#" });
      link.setAttribute("data-id", c.id);
      link.appendChild(el("circle", { cx: c.x, cy: c.y, r: c.radius + 8, class: "v3-island-glow" }));
      link.appendChild(el("circle", { cx: c.x, cy: c.y, r: c.radius, class: "v3-island-hit" }));
      if (isMuted) {
        link.appendChild(el("circle", { cx: c.x, cy: c.y, r: c.radius, class: "v3-status-ring", "aria-hidden": "true" }));
      }
      link.appendChild(el("text", { x: c.x, y: c.y, class: "v3-island-label" }, c.title));
      group.appendChild(link);
      return;
    }

    // filler -- contributes to the shared island heightmap already (see
    // render()) and needs no element of its own here.
  });

  const { lines, fontSize, lineHeight } = label;
  const labelGroup = el("g", { class: "v3-section-label-group" });
  const labelX = band.x + 14;
  // Vertically centers the whole line block within the band: first
  // line's baseline sits half a block above center, each subsequent
  // line one lineHeight further down.
  const blockHeight = lines.length * lineHeight;
  const firstBaselineY = band.y + (band.height - blockHeight) / 2 + fontSize * 0.85;
  lines.forEach((line, i) => {
    labelGroup.appendChild(
      el(
        "text",
        { x: labelX, y: firstBaselineY + i * lineHeight, "font-size": fontSize.toFixed(1), class: "v3-section-label" },
        line
      )
    );
  });
  group.appendChild(labelGroup);

  stage.appendChild(group);
}

// Traces + draws (or, on a re-call, just updates in place) the stacked
// sea/sand/vegetation bands and coastline outline (v3.6.5) -- the only
// piece of the page that depends on v3Config.island. Split out from
// render() so the control panel can call this alone, cheaply, on every
// slider input.
//
// Builds the heightmap ONCE; every band level is just another trace off
// it (see traceContourFromHeightmap()'s doc comment in
// cabinet-v3-islandshape.js) -- the heightmap build itself is the
// expensive part. placeBand() draws each array loose-to-tight so overlap
// count (not per-element colour) creates the gradient -- see
// cabinet-v3-data.js's field notes for why nested level-sets guarantee
// that stacking order.
function drawIslandsPath(stage, canvasBounds, grown) {
  const { cellSize, threshold, seaBandThresholds, sandThresholds, vegThresholds, waveDistances, showWaveRings, flatColourMode, warpStrength } = v3Config.island;

  // v3.6.7 -- sample the heightmap/distance-field over a PADDED area
  // that extends past the visible canvas, not the exact visible
  // canvasBounds. Both buildIslandHeightmap's and
  // buildCoastlineDistanceField's own edge-forcing guarantee every
  // contour closes by forcing the grid's true border to a "definitely
  // water/far" value -- correct for guaranteeing closure, but for an
  // island or wave ring near the visible edge it means the shape gets
  // artificially flattened right at that border instead of continuing
  // naturally past it. Padding the *sampling* grid well beyond what's
  // visible lets those shapes close on their own, off-screen, in the
  // padded margin -- the outer <svg> then clips anything past the real
  // (unpadded) canvasBounds for free, standard SVG viewport behaviour,
  // no separate clip-path needed. Sized from warpStrength (the
  // coastline's own max outward displacement) plus the farthest wave
  // ring plus a flat buffer, so it stays correct if either grows later.
  const edgePadding = warpStrength + Math.max(0, ...waveDistances) + 60;
  const paddedBounds = {
    x: canvasBounds.x - edgePadding,
    y: canvasBounds.y - edgePadding,
    width: canvasBounds.width + edgePadding * 2,
    height: canvasBounds.height + edgePadding * 2
  };

  const { H, cols, rows } = buildIslandHeightmap(grown, paddedBounds, v3Config.island);
  const trace = level => traceContourFromHeightmap(H, cols, rows, cellSize, paddedBounds, level);

  const placeOne = (afterEl, className, d) => {
    let node = stage.querySelector(`.${className}`);
    if (!node) node = el("path", { class: className, "fill-rule": "evenodd" });
    stage.insertBefore(node, afterEl ? afterEl.nextSibling : stage.firstChild);
    node.setAttribute("d", d);
    return node;
  };

  const placeBand = (afterEl, prefix, levels, traceFn) => {
    let anchor = afterEl;
    levels.forEach((level, i) => {
      anchor = placeOne(anchor, `${prefix}-${i + 1}`, traceFn(level));
      anchor.setAttribute("class", `${prefix} ${prefix}-${i + 1}`);
    });
    // Prunes elements left behind by a previous call with MORE levels --
    // only matters for a live retrace (the wave-ring count slider on
    // islands-tool.html's panel), since a full render() clears the whole
    // stage first and this never has anything stale to find.
    stage.querySelectorAll(`.${prefix}`).forEach(node => {
      const idxClass = [...node.classList].find(c => c.startsWith(`${prefix}-`));
      if (idxClass && Number(idxClass.slice(prefix.length + 1)) > levels.length) node.remove();
    });
    return anchor;
  };

  const coastD = trace(threshold);

  // v3.6.9 bugfix -- flatColourMode used to skip STRAIGHT to placeOne()/
  // the else-branch's placeBand() calls without ever touching whichever
  // group belonged to the OTHER branch, so live-toggling it (the Preset
  // look checkboxes) left a fully-opaque leftover from the previous
  // branch sitting in the SVG forever -- e.g. switch away from flat mode
  // and the old .v3-islands-land-flat path stays, painted on top of the
  // freshly-drawn sand/veg bands, hiding them completely. This only ever
  // surfaced once flatColourMode could change at RUNTIME via
  // retraceIslands() (previously it was a hand-edited config value,
  // toggled only via a full render() that clears the whole stage first,
  // which is why this never showed up before). Fixed the same way
  // showWaveRings already handles its own on/off switch, just above:
  // always pass every group through placeBand()'s own empty-list pruning
  // (sea-band, sand-band, veg-band), and explicitly remove the one
  // non-band element (the flat-land path) that has no placeBand()
  // equivalent to prune it automatically.
  let anchor = placeBand(null, "v3-sea-band", flatColourMode ? [] : seaBandThresholds, trace);

  // Fixed-distance wave rings -- a genuine Euclidean distance transform
  // off the same heightmap's land/water split, NOT another noise
  // threshold (see buildCoastlineDistanceField()'s doc comment in
  // cabinet-v3-islandshape.js). Traced on top of the sea bands (when
  // present), still behind the land itself. Unaffected by flatColourMode
  // -- the wave rings are the effect being compared against the bands,
  // not one of the things flatColourMode turns off. showWaveRings (v3.6.8)
  // is the independent kill switch for this layer -- pass an empty level
  // list rather than skipping placeBand() entirely so any wave-ring
  // elements left over from a previous (rings-on) retrace still get
  // pruned by placeBand()'s own stale-element cleanup.
  const distanceField = buildCoastlineDistanceField(H, cols, rows, cellSize, threshold);
  const traceWave = D => traceContourFromHeightmap(distanceField, cols, rows, cellSize, paddedBounds, -D);
  anchor = placeBand(anchor, "v3-wave-ring", showWaveRings ? waveDistances : [], traceWave);

  if (flatColourMode) {
    // Empty-list placeBand() calls prune any .v3-sand-band-N/.v3-veg-band-N
    // left over from a previous non-flat retrace; neither call advances
    // anchor (nothing to place), so it's safe to just discard the return.
    placeBand(anchor, "v3-sand-band", [], trace);
    placeBand(anchor, "v3-veg-band", [], trace);
    anchor = placeOne(anchor, "v3-islands-land-flat", coastD);
  } else {
    // No placeBand() equivalent for a single non-array element -- remove
    // the stale flat-land path directly if a previous flat-mode retrace
    // left one behind.
    const staleFlat = stage.querySelector(".v3-islands-land-flat");
    if (staleFlat) staleFlat.remove();
    anchor = placeBand(anchor, "v3-sand-band", sandThresholds, trace);
    anchor = placeBand(anchor, "v3-veg-band", vegThresholds, trace);
  }
  placeOne(anchor, "v3-coastline-outline", coastD);
}

// Exported for cabinet-v3-controls.js -- re-traces against the current
// v3Config.island values using the cached layout from the last full
// render(), a no-op if render() hasn't run yet.
export function retraceIslands() {
  if (!islandLayoutState) return;
  const stage = document.querySelector("#v3-stage");
  drawIslandsPath(stage, islandLayoutState.canvasBounds, islandLayoutState.grown);
}

// Exported (v3.6.8) so cabinet-v3-controls.js's centerBias slider and
// "Reroll positions" button can re-run the full pipeline -- unlike every
// other control in the panel, both change buildSeedsForSection()'s
// scatter itself (centerBias directly; a reroll via sectionSeed()'s
// nonce), not just island-shape tuning, so retraceIslands()'s cached-
// packing shortcut doesn't apply here. Cost measured directly (throwaway
// _time-repack.mjs, deleted after use) against the real 25-entry content:
// repack (treemap + scatter + growth) is ~1-3ms, negligible; a full
// render()'s ~70-100ms is entirely the island retrace step every other
// slider in this panel already pays per tick, so this reuses that same
// cost rather than trying to shortcut it.
export function render() {
  const stage = document.querySelector("#v3-stage");
  stage.innerHTML = "";

  const sectionMetas = buildSectionMetas();
  const { width: targetWidth, height: targetHeight } = resolveCanvasDimensions(sectionMetas, v3Config.canvas);
  const { regions, canvasWidth, canvasHeight } = buildRegions(sectionMetas, targetWidth, targetHeight);

  // Small outer margin around the whole canvas -- not part of the
  // weight-proportional layout math (every region rect is still
  // computed in plain 0..width/0..height space), just extra viewBox on
  // every side so an island's centered label near the outermost edge of
  // the whole page isn't clipped by the SVG boundary itself the way an
  // island near an *interior* region seam still can be (that's the
  // general label-overflow limitation, still open -- see
  // Landing-page-notes.2.0.md).
  const outerMargin = 20;
  const canvasBounds = {
    x: -outerMargin,
    y: -outerMargin,
    width: canvasWidth + outerMargin * 2,
    height: canvasHeight + outerMargin * 2
  };
  stage.setAttribute("viewBox", `${canvasBounds.x} ${canvasBounds.y} ${canvasBounds.width} ${canvasBounds.height}`);

  const regionById = new Map(regions.map(r => [r.id, r]));

  // Each region still gets its own label + band + pack split, and seeds
  // are still scattered/ordered per section (see buildSeedsForSection())
  // -- only growth itself, below, stops being scoped per region. Bands
  // become growth obstacles for every seed, not just their own
  // section's, so a circle drifting into a neighbour's space still
  // can't cover that neighbour's title. computeSectionLabel() runs
  // before splitLabelBand() so the band is sized to what the title
  // actually needs (possibly wrapped onto multiple lines), not the
  // other way around.
  const layout = sectionMetas
    .map(sectionMeta => {
      const region = regionById.get(sectionMeta.id);
      if (!region) return null;
      const label = computeSectionLabel(sectionMeta.title, region.inner);
      const { band, pack } = splitLabelBand(region, label);
      return { sectionMeta, region, band, pack, label };
    })
    .filter(Boolean);

  // `allPlacedPoints` accumulates across the flatMap below (JS runs
  // Array#flatMap's callback in index order, synchronously -- each
  // section's call mutates this array before the next section's call
  // reads it) -- each section's scatter needs to see every point placed
  // by every section *before* it (see the note in buildSeedsForSection()).
  const allPlacedPoints = [];
  const allSeeds = layout.flatMap(({ sectionMeta, pack }) =>
    buildSeedsForSection(sectionMeta, pack, allPlacedPoints)
  );
  const obstacles = layout.map(({ band }) => band);

  // v3.6.10 registered the page's title/tagline (real HTML, not SVG --
  // see Landing-page-notes.2.0.md's "Canvas + legend" entry for why) as
  // a growth obstacle here, since that version overlaid it directly on
  // top of the canvas's own corner. v3.6.12 moved the header back to a
  // normal top-of-flow row above .v3-stage-wrap, so it no longer
  // overlaps the canvas at all -- resolveCanvasDimensions() already
  // shrinks the canvas to whatever space is left below the header (it
  // reads .v3-stage-wrap's real top offset), so no obstacle bookkeeping
  // is needed here any more.

  // Single global growth pass -- "bounded by the page edges... but not
  // region-region internal edges": every seed from every section grows
  // together, checked against every other circle and every region's
  // label band, stopped only by those or by canvasBounds (the true
  // outer edge). A region's own rect (region.inner/pack) plays no part
  // in growth anymore -- it only shaped where a section's own seeds
  // started out and how far any one of them is individually capped
  // (maxRadius, attached per-seed in buildSeedsForSection()).
  const grown = growCircles(allSeeds, canvasBounds, obstacles, v3Config.pack);

  // v3.5: one shared noise-carved landmass for every circle from every
  // section, traced once and drawn first so every region group (labels,
  // hit circles, status rings) layers on top of it -- see
  // cabinet-v3-islandshape.js and the "Fusion behaviour" decision in
  // Landing-page-notes.2.0.md for why this is a single combined trace
  // rather than one shape per circle.
  islandLayoutState = { grown, canvasBounds };
  drawIslandsPath(stage, canvasBounds, grown);

  const grownBySection = new Map();
  grown.forEach(c => {
    if (!grownBySection.has(c.sectionId)) grownBySection.set(c.sectionId, []);
    grownBySection.get(c.sectionId).push(c);
  });

  layout.forEach(({ sectionMeta, region, band, label }) => {
    renderRegion(stage, region, band, label, sectionMeta, grownBySection.get(sectionMeta.id) || []);
  });
}

// v3.6.8 -- reroll: pick a new nonce, re-run the whole pipeline. A fresh
// Math.random()-derived nonce (not incremented) so hitting reroll twice
// can't land back on nonce=1 and look like nothing happened; still
// deterministic AFTER the roll (same nonce -> same layout), only the
// moment of picking one is random, same "randomness only at the one
// genuinely interactive edge" rule warpOffset()'s own seed follows.
export function rerollPacking() {
  rerollNonce = Math.floor(Math.random() * 1e9) + 1;
  render();
}

// Restores the original (un-rerolled) seed -- called by the control
// panel's Reset button alongside its existing v3Config.island restore.
export function resetReroll() {
  rerollNonce = 0;
}

render();
