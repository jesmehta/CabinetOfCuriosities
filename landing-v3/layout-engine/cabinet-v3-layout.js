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
// removed)" (explicit design decision, see documentation/Landing-page-notes.2.0.md) --
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

import { v3Config, EXTRA_WEIGHT, applyThemeStyle } from "../shared/cabinet-v3-data.js";
import { sections, entries } from "../../docs/assets/js/cabinet-generated-content.js";
import { squarify } from "./cabinet-v3-treemap.js";
import { generateScatterPoints, sortPointsByBandReadingOrder, growCircles, createSeededRng, safeMinSeparation, insetRect, centerPointsInRect } from "./cabinet-v3-circlepack.js";
import { buildIslandHeightmap, traceContourFromHeightmap, buildCoastlineDistanceField, buildInlandDistanceField } from "../shared/cabinet-v3-islandshape.js";
import { buildFlowField, createFlowSampler } from "../shared/cabinet-v3-flowfield.js";
import { createParticlePool, stepParticle } from "../shared/cabinet-v3-particles.js";
import { spawnDragon, stepDragon } from "../shared/cabinet-v3-dragon.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// v3.6.24 -- dragon.svg's own path data, copied directly rather than
// loaded via <use>/<symbol> (that hit a genuine, never-resolved Chromium
// painting bug earlier in this project -- see the "Boats attempt"
// section in documentation/conversation-landing-page-v3.md -- an SVG <use> referencing
// a <symbol> with a closed bezier path would silently fail to paint when
// created during initial synchronous render; two targeted fixes didn't
// resolve it, and it was reverted rather than chased further) and rather
// than a runtime fetch() (would hit the same file:// CORS wall this
// session's own Playwright testing already ran into). A plain inlined
// <path>, same "just build DOM elements directly" approach the particle
// boats already use -- see buildDragonElement() below. Source viewBox:
// "0 0 644.68 310.88".
const DRAGON_PATH_D = "M70.71 49.9c-9.32,2.19 -18.17,23.97 -33.8,31.22 -6.92,2.53 -23.83,8.18 -32.3,5.25 -4.66,2.95 -5.22,7.9 -3.64,15.6 1.2,5.86 51.59,2.81 59.27,0.33 37.57,10.28 55.58,-5.31 95.21,31.26l0.53 0.52c32.93,31.03 44.2,80.32 28.21,122.67 -11.12,29.46 -24.76,38.45 -39.71,53.96l53.08 0c30.39,-37.59 41.63,-89.03 30.53,-136.2 -13.79,-58.61 -59.19,-103.05 -115.13,-118.73 6.68,-12.36 15.1,-14.55 20.69,-25.01 2.8,-5.23 7.66,-20.74 4.47,-30.29 -13.36,30.41 -33.8,46.32 -67.41,49.42zm211.03 78.69c-36.74,40.06 -47.01,99.14 -25.21,149.12 6.61,15.14 12.62,24.08 20.16,33l49.3 0c-3.35,-4.41 -6.84,-8.54 -9.93,-12.29 -41.1,-43.74 -28.95,-113.76 24.75,-140.64 16.36,-8.19 34.39,-10.92 52.5,-9.19 17.38,1.67 34.16,9 47.68,19.97 22.49,18.24 34.68,47.01 32.43,75.84 -2.57,33.08 -18.94,47.94 -35.63,66.3l51.01 0c16.03,-19.73 26.5,-44.09 29.93,-69.19 7,-51.11 -14.15,-99.25 -54.62,-130.34 -24.6,-18.9 -56.19,-27.95 -86.99,-26.93 -36.11,1.19 -71.04,17.79 -95.39,44.35zm260.84 139.35c2.21,13.55 8.67,30.04 17.62,42.76l46 0c-6.32,-4.73 -12.7,-8.61 -16.65,-11.82 -9.06,-7.38 -17.54,-22.98 -20.9,-34.07 -16.01,-52.78 22.96,-103.43 75.86,-109.37l0 -0.91c-63.58,-6.85 -112.01,51.62 -101.93,113.42z";
const DRAGON_VIEWBOX = { width: 644.68, height: 310.88 };

// v3.6: caches the one expensive layout pass's output (grown circles +
// canvasBounds) so the control panel's sliders (cabinet-v3-controls.js)
// can re-trace island shapes on every input event without re-running
// treemap/circle-packing -- packing only depends on content (entries/
// weights), never on island-shape tuning, so there's nothing to redo
// there when only v3Config.island changes.
let islandLayoutState = null;

// v3.6.16 -- caches the last heightmap drawIslandsPath() built (H/cols/
// rows/paddedBounds), set on every render()/retraceIslands() call --
// lets startCurrentAnimation() (cabinet-v3-controls.js, called once on
// page load) build a flow field immediately without re-running the
// heightmap trace itself.
let lastIslandTrace = null;

// v3.7.47 -- exported so build-static.mjs can pull just the circle-
// packing output (grown) + canvasBounds out of a finished render(),
// to serialize into the static build for cabinet-v3-production-
// animate.js's own use -- see that file's own header comment for why:
// treemap/circlepack only need to run ONCE (here, at build time), not
// again in every visitor's browser.
export function getIslandLayoutState() {
  return islandLayoutState;
}

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
// documentation/Landing-page-notes.2.0.md. Sections with zero visible entries (hence
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
      return { id: s.id, title: s.title, href: s.href, order: s.order, weight, kind: s.kind, entries: sectionEntries, extraCount: s.extraCount };
    })
    .filter(s => s.weight > 0)
    .sort((a, b) => a.order - b.order);
}

// #70 -- real h2/h3 heading outline for the map's sections/entries, so
// the page has an actual document structure (crawlers, reader-mode,
// screen-reader heading navigation) alongside the visual map. The
// section/island labels ARE the map's visible text, but they're SVG
// <text> (.v3-section-label/.v3-island-label, built further down) --
// fine for painting, invisible to anything that reads heading tags.
// This is a parallel, visually-hidden HTML layer (cabinet-v3-style.css's
// .sr-only -- NOT display:none, which would also drop it from the
// accessibility tree and defeat the point), not a replacement for the
// SVG text.
//
// Built straight from sectionMetas -- buildSectionMetas()'s own output,
// the SAME list render() uses for the map itself, already filtered to
// real content (status !== false) and sorted by `order`. Filler islands
// (kind: "filler", synthesized later in buildSeedsForSection(), never
// part of sectionMeta.entries) can't leak in here; there's nothing to
// filter for that.
//
// WATCH OUT, future edits: this reads sectionMeta.{id,title,href,entries}
// and each entry's {id,title,href} -- exactly the fields
// buildSectionMetas()/buildSeedsForSection() already read (see their own
// comments above/nearby). If a future change reshapes what those objects
// carry -- e.g. resolving the wild-wild-web / Twine-WebTech-Tracery-Bots
// duplication noted in the launch-phases ToDo's #70 entry, or changing
// what entry.href means -- update this function's field reads to match.
// There's no visual symptom if this drifts out of sync (it's hidden
// content), unlike everything else in render() -- the heading-count
// check at the end is a cheap tripwire for exactly that failure mode,
// not a full guarantee. Grep for renderSemanticOutline if you're
// changing sectionMeta/entry shape elsewhere.
//
// Deliberately NOT wired with aria-hidden (on the SVG labels) or
// aria-labelledby (pointing here) -- that pairing is what stops a screen
// reader from announcing each title twice (once as the link's own SVG
// text, once as this heading), but was deferred 2026-08-30 (see the
// #70 ToDo entry) since screen-reader users aren't the current priority
// for this highly visual map. Net effect until that's added: a double
// announcement per title for whoever does use one -- a minor redundancy,
// not a broken experience. Add the aria wiring if/when that changes.
function outlineHeading(tag, id, title, href) {
  const heading = document.createElement(tag);
  heading.id = id;
  if (href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = title;
    heading.appendChild(link);
  } else {
    heading.textContent = title;
  }
  return heading;
}

function renderSemanticOutline(sectionMetas) {
  const container = document.querySelector("#v3-semantic-outline");
  // Not every page loading this module has the container (e.g. a future
  // consumer that doesn't need it) -- defensive, not a sign of a bug.
  if (!container) return;
  container.innerHTML = "";

  let entryCount = 0;
  sectionMetas.forEach(sectionMeta => {
    container.appendChild(
      outlineHeading("h2", `outline-section-${sectionMeta.id}`, sectionMeta.title, sectionMeta.href)
    );
    sectionMeta.entries.forEach(entry => {
      entryCount++;
      container.appendChild(
        outlineHeading("h3", `outline-entry-${entry.id}`, entry.title, entry.href)
      );
    });
  });

  const headingCount = container.querySelectorAll("h2, h3").length;
  const expectedCount = sectionMetas.length + entryCount;
  if (headingCount !== expectedCount) {
    console.warn(
      `renderSemanticOutline(): built ${headingCount} headings, expected ${expectedCount} -- ` +
      "sectionMeta/entry shape may have changed without this function being updated (see its own comment)."
    );
  }
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
//
// v3.7 -- a `kind: "compass"` section (at most one) is carved out
// separately rather than joining the normal squarify() pool: direct
// request was a DETERMINISTIC southeast-corner reservation, and squarify
// gives no such guarantee (the current smallest/last-ordered section
// already lands top-right, not bottom-right, under plain squarify --
// verified before writing this).
//
// v3.7 bugfix -- the first version of this reserved a full-CANVAS-WIDTH
// strip along the bottom, sized so its AREA matched the compass's weight
// share, then inscribed a square inside it. That's wrong: forcing a
// fixed-area strip to also span the entire canvas width makes it very
// thin (stripHeight = area/width), and the inscribed square is then
// capped by that thin height, not by the weight -- on real content this
// put a section-4-worth-of-area compass at a fraction of its intended
// SIDE LENGTH (~32px instead of ~191px, confirmed by direct measurement
// -- the weight WAS being read correctly; the strip's shape just made
// almost all of that area unusable as a square). Fixed here by carving
// the TRUE square first (side = sqrt(area), not stretched to fit any
// canvas dimension), then splitting what's left into two rects via one
// cut (a full-width band above the square's row, plus a sliver to the
// square's own left in that same row) and squarifying each separately
// so neither loses real section area to empty margin. Sections are
// distributed between the two rects by weight (closest match to each
// rect's own proportional area share), greedily from the END of reading
// order -- so only the last few (lowest-priority) sections ever share
// the bottom row with the compass; everything else keeps its normal
// top-area placement untouched. This can leave the section(s) sharing
// the bottom-left sliver slightly over- or under-sized relative to a
// perfect weight match (same class of imprecision squarify's own "worst
// aspect ratio" heuristic already accepts elsewhere) -- preferred over
// either the original bug (near-zero area) or leaving the sliver as
// wasted empty sea.
function buildRegions(sectionMetas, width, height) {
  const { regionGap } = v3Config.canvas;
  const compassMeta = sectionMetas.find(s => s.kind === "compass");
  const regularMetas = compassMeta ? sectionMetas.filter(s => s !== compassMeta) : sectionMetas;

  if (!compassMeta) {
    const items = regularMetas.map(s => ({ id: s.id, weight: effectiveWeightForArea(s, v3Config.canvas) }));
    const regions = squarify(items, { x: 0, y: 0, width, height }).map(r => regionFromRect(r, regionGap));
    return { regions, canvasWidth: width, canvasHeight: height };
  }

  const totalEffectiveWeight = sectionMetas.reduce((sum, s) => sum + effectiveWeightForArea(s, v3Config.canvas), 0) || 1;
  const compassWeight = effectiveWeightForArea(compassMeta, v3Config.canvas);
  const compassArea = (compassWeight / totalEffectiveWeight) * (width * height);
  // Sanity ceiling (never more than 60% of either dimension) -- guards
  // against a future weight change making the compass swallow the
  // canvas; irrelevant at today's real weights (side << either bound).
  const side = Math.min(Math.sqrt(compassArea), width * 0.6, height * 0.6);

  const compassOuter = { x: width - side, y: height - side, width: side, height: side };
  const topRect = { x: 0, y: 0, width, height: height - side };
  const leftRect = { x: 0, y: height - side, width: width - side, height: side };

  const topArea = topRect.width * topRect.height;
  const leftArea = leftRect.width * leftRect.height;
  const totalRegularWeight = regularMetas.reduce((sum, s) => sum + effectiveWeightForArea(s, v3Config.canvas), 0) || 1;
  const targetLeftWeight = totalRegularWeight * (leftArea / (topArea + leftArea || 1));

  const ordered = [...regularMetas].sort((a, b) => a.order - b.order);
  const leftGroup = [];
  let leftWeight = 0;
  // leftArea/topArea below 2% isn't worth giving a whole section to --
  // left as plain open sea next to the square instead (same "unfilled
  // sea within a section's own outer rect" every region already has).
  if (leftArea / (topArea + leftArea || 1) > 0.02) {
    for (let i = ordered.length - 1; i >= 0; i--) {
      const w = effectiveWeightForArea(ordered[i], v3Config.canvas);
      const withNext = leftWeight + w;
      if (leftGroup.length === 0 || Math.abs(withNext - targetLeftWeight) < Math.abs(leftWeight - targetLeftWeight)) {
        leftGroup.unshift(ordered[i]);
        leftWeight = withNext;
      } else {
        break;
      }
    }
  }
  const leftIds = new Set(leftGroup.map(s => s.id));
  const topGroup = ordered.filter(s => !leftIds.has(s.id));

  const regions = [];
  if (topGroup.length) {
    const topItems = topGroup.map(s => ({ id: s.id, weight: effectiveWeightForArea(s, v3Config.canvas) }));
    squarify(topItems, topRect).forEach(r => regions.push(regionFromRect(r, regionGap)));
  }
  if (leftGroup.length) {
    const leftItems = leftGroup.map(s => ({ id: s.id, weight: effectiveWeightForArea(s, v3Config.canvas) }));
    squarify(leftItems, leftRect).forEach(r => regions.push(regionFromRect(r, regionGap)));
  }

  const compassRegion = regionFromRect({ id: compassMeta.id, ...compassOuter }, regionGap);
  compassRegion.compassSquare = compassRegion.inner;
  regions.push(compassRegion);

  return { regions, canvasWidth: width, canvasHeight: height };
}

function regionFromRect(r, regionGap) {
  return {
    id: r.id,
    outer: r,
    inner: {
      x: r.x + regionGap,
      y: r.y + regionGap,
      width: r.width - regionGap * 2,
      height: r.height - regionGap * 2
    }
  };
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
// documentation/Landing-page-notes.2.0.md for why entries and extras no longer share
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

// v3.6.26 -- traces the real coastline (or, with extraDistance > 0, a
// fixed-distance buffer past it) for just the given SUBSET of circles,
// not the whole map. Two callers, below: one circle at a time (an
// entry's own hover/click shape), or a whole section's circles at once
// with extraDistance set (the section's own "coastal zone" shape) --
// same underlying technique either way, just a different circle list
// and distance.
//
// Isolating a SINGLE circle this way is safe even where circles fuse:
// buildIslandHeightmap combines circles via a per-cell max() (see its
// own doc comment), so tracing one circle alone reproduces exactly the
// portion of a (possibly fused) shared landmass that circle is itself
// responsible for -- the union of every entry's own isolated trace
// reconstructs the fused blob exactly, with no seam-splitting logic
// needed. Direct request: "the hover halo for each island has to be
// that island entirely, not a circle approximation."
//
// Traced over a LOCAL bounding box sized to just these circles' own
// influence radius (+ extraDistance + a flat closure margin), not the
// full canvas -- buildIslandHeightmap's compute cost already only
// touches a circle's own influence box regardless of the bounds passed
// in (see its own doc comment), but its ALLOCATION cost (one
// Float32Array sized to cols*rows) does scale with the bounds. Calling
// this once per entry (~25 times a layout) plus once per section against
// the full canvas would mean ~25+ full-canvas-sized allocations on every
// render()/retrace, almost all of it wasted on cells nowhere near the
// circle(s) in question.
// Split out of traceIsolatedShape (below) so a caller tracing the SAME
// circle(s) at several different levels -- theme-preview band fidelity,
// which needs coastline + sand + veg + peak all for one island -- pays
// for buildIslandHeightmap() ONCE, not once per level. edgePadding still
// needs the largest extraDistance any of those callers will ask for, so
// the local grid is sized generously enough up front for all of them.
function buildIsolatedHeightmap(circles, islandConfig, maxExtraDistance = 0) {
  const { outerFrac, angularStrength, warpStrength } = islandConfig;
  const influenceRadius = c => c.radius * outerFrac * (1 + angularStrength) + warpStrength;
  const edgePadding = Math.max(0, maxExtraDistance) + 40;

  const minX = Math.min(...circles.map(c => c.x - influenceRadius(c))) - edgePadding;
  const maxX = Math.max(...circles.map(c => c.x + influenceRadius(c))) + edgePadding;
  const minY = Math.min(...circles.map(c => c.y - influenceRadius(c))) - edgePadding;
  const maxY = Math.max(...circles.map(c => c.y + influenceRadius(c))) + edgePadding;
  const localBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

  return { ...buildIslandHeightmap(circles, localBounds, islandConfig), localBounds };
}

// v3.7.38 bugfix -- the Medieval-effects hover clip's "hole" used the
// wash's own exact (unblurred) shape, but the wash ELEMENT is blurred
// (CSS filter, v3Config.themePreview.blurPx) -- Gaussian blur visually
// spreads a shape's tint past its own `d` boundary without changing what
// that `d` string says, so in the ring between the crisp clip edge and
// the wash's own softened visual edge, wave-rings/coastal-bands sat
// UNCLIPPED underneath the wash's still-visible (if fading) tint.
// Confirmed directly, not guessed: setting --v3-preview-blur to 0px made
// the artifact disappear completely (a perfectly crisp, fully-clipped
// edge), confirming the clip GEOMETRY itself was already correct and
// this was specifically a blur-vs-clip-edge mismatch. Fix: dilate the
// hole a little further than the wash itself, by roughly the blur's own
// visual spread, so the clip region fully contains wherever the wash's
// blur could still be tinting anything.
function clipMarginFor(blurPx) {
  return Math.max(12, Math.round(blurPx * 2));
}

// v3.7.41 -- the section-level theme-preview wash (and its hover-clip
// hole) was traced from `circles` alone, same as the per-island version --
// but a section's OWN hit/glow shape (sectionShapeD above) is deliberately
// the label band rect UNIONED with the islands trace, not the islands
// trace alone (direct request, v3.6.26: "union of the section label +
// unused islands + the coastal zone"). The preview wash never got that
// same union, so hovering a section left its label rectangle uncovered --
// no deep-sea fill painted there, and no hover-clip hole either, so
// whatever Medieval content sits under the label (wave-rings included)
// stayed fully visible and unclipped. Direct feedback: "it takes a
// composite shape of all the islands but not the section label textbox."
// Same "extra sibling subpath, no boolean union needed" trick as
// sectionShapeD's own rect+path sibling pair -- concatenated onto an
// evenodd `d` string, a rect that doesn't overlap the island blob just
// punches/paints a second independent region, not a modification of the
// first. Only the wash/clip-hole get this -- the graduated sea/land bands
// are per-island fade rings and have no meaning painted over a text label,
// same reasoning the real per-island coastline/bands never needed it.
function rectSubpathD(x, y, width, height) {
  return `M ${x},${y} H ${x + width} V ${y + height} H ${x} Z`;
}

function traceIsolatedShape(circles, islandConfig, extraDistance = 0) {
  if (!circles.length) return "";
  const { cellSize, threshold } = islandConfig;
  const { H, cols, rows, localBounds } = buildIsolatedHeightmap(circles, islandConfig, extraDistance);

  if (extraDistance <= 0) {
    return traceContourFromHeightmap(H, cols, rows, cellSize, localBounds, threshold);
  }
  const distanceField = buildCoastlineDistanceField(H, cols, rows, cellSize, threshold);
  return traceContourFromHeightmap(distanceField, cols, rows, cellSize, localBounds, -extraDistance);
}

// Theme-preview band fidelity -- traces circles' own isolated heightmap
// at an arbitrary ABSOLUTE level (a sandThresholds/vegThresholds/
// peakThresholds entry), not threshold+dilation like traceIsolatedShape
// above. Those threshold arrays are shared across every theme (confirmed
// directly against THEME_PRESETS before assuming it -- only
// flatColourMode/showWaveRings/showCoastalBands/seaShadowStyle actually
// vary per theme), so tracing at the SAME level real islands use is
// exactly the shape a real per-band Topology fill needs, just isolated to
// one circle instead of the whole canvas.
function traceIsolatedShapeAtLevel(circles, islandConfig, level, H, cols, rows, localBounds) {
  if (!circles.length) return "";
  return traceContourFromHeightmap(H, cols, rows, islandConfig.cellSize, localBounds, level);
}

// Mechanism 3, last piece: Topology's directional taper shadow, isolated
// to one island/section for the theme-preview overlay -- same algorithm
// as drawIslandsPath()'s own directional-shadow block (see that block's
// own extensive comment for the height-linear reach formula and why it
// looks the way it does), just tracing circles' own isolated heightmap
// instead of the whole canvas's. Deliberately NOT theme-aware beyond
// this: always builds Topology's directional style regardless of what
// v3Config.themePreview.previewTheme is actually set to (THEME_PRESETS,
// which maps a theme to radial/directional, lives in
// cabinet-v3-controls.js's closure, not reachable from here) -- correct
// for the feature's real purpose (previewing Topology specifically), a
// known gap if the preview theme is ever pointed at a radial-shadow
// theme instead, not silently pretended otherwise.
function buildIsolatedShadowTaper(circles, islandConfig, previewHM, angleDeg) {
  if (!circles.length) return [];
  const { threshold, sandThresholds, vegThresholds, peakThresholds, cellSize } = islandConfig;
  const taperLevels = [threshold, ...(sandThresholds || []), ...(vegThresholds || []), ...(peakThresholds || [])];
  const heights = taperLevels.map(level => Math.max(0, level - threshold));
  const maxHeight = Math.max(1e-6, ...heights);
  const rad = (angleDeg * Math.PI) / 180;
  const sdx = Math.cos(rad);
  const sdy = Math.sin(rad);
  const copiesPerLevel = 4;
  const baseReach = 8;
  const maxReach = 46;
  const levelStagger = 1.5;

  const copies = [];
  taperLevels.forEach((level, li) => {
    const d = traceContourFromHeightmap(previewHM.H, previewHM.cols, previewHM.rows, cellSize, previewHM.localBounds, level);
    const reach = baseReach + (heights[li] / maxHeight) * (maxReach - baseReach);
    const start = 3 + li * levelStagger;
    const step = Math.max(0.5, (reach - start) / (copiesPerLevel - 1));
    for (let c = 0; c < copiesPerLevel; c++) {
      const dist = start + c * step;
      copies.push({ d, transform: `translate(${(sdx * dist).toFixed(2)},${(sdy * dist).toFixed(2)})` });
    }
  });
  return copies;
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

  // v3.6.26 -- the section's own landing-page link. Shape is the label
  // band + a single traced contour covering every circle in this section
  // (entry and filler alike) dilated by the wave-ring outer distance --
  // filler islands' full body, entry islands' full interior (a fallback
  // layer; an entry's own link, rendered after this and so on top of it
  // in paint/hit-test order, still wins wherever the two overlap), and a
  // coastal-zone buffer around every island, all from one
  // traceIsolatedShape() call. Direct request: "union of the section
  // label + unused islands + the coastal zone of all the islands of that
  // section." No boolean union needed -- the band rect and the traced
  // shape are separate sibling elements inside the same <a>; SVG
  // hit-testing across overlapping siblings of one interactive element
  // already behaves as a union.
  //
  // coastalZoneWidth reuses v3Config.island.waveDistances' own outermost
  // ring rather than a new hand-tuned number -- "just past the last
  // visible ripple" is already an established distance in this design.
  const coastalZoneWidth = v3Config.island.waveDistances.length
    ? v3Config.island.waveDistances[v3Config.island.waveDistances.length - 1]
    : 0;
  const sectionShapeD = traceIsolatedShape(circles, v3Config.island, coastalZoneWidth);

  // v3.7.41 -- the section label's own text, built here (rather than at
  // its previous spot, right before the final stage.appendChild(group))
  // so its rendered bbox is available before the theme-preview wash below
  // needs it. Actual DOM placement (sectionLink.appendChild(labelGroup))
  // still happens at the original spot, after every island -- this is
  // only an early CONSTRUCTION, not an early attach, so z-order (label
  // painted on top of islands) is unchanged.
  const { lines, fontSize, lineHeight } = label;
  const labelGroup = el("g", { class: "v3-section-label-group" });
  const labelX = band.x + 14;
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
  // getBBox() needs the element attached to a rendered SVG document to
  // return real glyph metrics -- `stage` is already live, so attach here
  // just long enough to measure, then detach; the group itself (with its
  // already-fully-determined x/y/text) is unchanged and reused for real
  // below. Direct feedback, after the first attempt used the full label
  // BAND (a generous full-region-width strip reserved so packing never
  // touches it, NOT the visible text's own size): "I dont need the entire
  // section band highlighted, just the textbox + proportional margins."
  stage.appendChild(labelGroup);
  const labelBBox = labelGroup.getBBox();
  stage.removeChild(labelGroup);
  // Proportional to the label's own scale (fontSize), not a fixed pixel
  // pad -- a section with a small/short label gets a small margin, a
  // large/long one gets a bigger one, same "halo scales with what it's
  // haloing" logic islandHaloPx/sectionHaloPx already follow elsewhere.
  const labelMarginX = fontSize * 0.7;
  const labelMarginY = fontSize * 0.5;
  const labelWashD = rectSubpathD(
    labelBBox.x - labelMarginX, labelBBox.y - labelMarginY,
    labelBBox.width + labelMarginX * 2, labelBBox.height + labelMarginY * 2
  );

  // Theme-preview prototype, section level -- its OWN halo (see
  // v3Config.themePreview's doc comment for why this doesn't just reuse
  // coastalZoneWidth above), so tuning "how much sea shows on preview"
  // doesn't also move the hit/glow shape calibrated for a different
  // purpose. One shared heightmap build (all this section's circles
  // together, same fused-via-max() trick the real section coastline
  // trace above already relies on) covers the halo wash and every real
  // sand/veg/peak level, same reasoning as the per-island version below.
  // Grid sized for sectionHaloPx + the hover-clip's own extra margin --
  // see the matching per-island comment/clipMarginFor() for why.
  const sectionClipMargin = clipMarginFor(v3Config.themePreview.blurPx);
  // + 80: sea-depth bands need real room to close naturally -- see the
  // matching per-island comment.
  const sectionPreviewHM = circles.length ? buildIsolatedHeightmap(circles, v3Config.island, v3Config.themePreview.sectionHaloPx + sectionClipMargin + 80) : null;
  const sectionPreviewDistanceField = sectionPreviewHM
    ? buildCoastlineDistanceField(sectionPreviewHM.H, sectionPreviewHM.cols, sectionPreviewHM.rows, v3Config.island.cellSize, v3Config.island.threshold)
    : null;
  const sectionThemePreviewD = sectionPreviewHM
    ? traceContourFromHeightmap(
        sectionPreviewDistanceField,
        sectionPreviewHM.cols, sectionPreviewHM.rows, v3Config.island.cellSize,
        sectionPreviewHM.localBounds, -v3Config.themePreview.sectionHaloPx
      )
    : "";
  const sectionThemePreviewClipD = sectionPreviewHM
    ? traceContourFromHeightmap(
        sectionPreviewDistanceField,
        sectionPreviewHM.cols, sectionPreviewHM.rows, v3Config.island.cellSize,
        sectionPreviewHM.localBounds, -(v3Config.themePreview.sectionHaloPx + sectionClipMargin)
      )
    : "";

  // v3.6.26 -- clipPath restricted to this section's own region.inner:
  // "if an island or its coastal zone intrude into another section, ...
  // the active clickable area is limited to the section rectangle."
  // Applied ONLY to the hit shapes, not the glow -- the glow renders
  // full/unclipped so an intruding coastline still reads as one
  // continuous shape visually, even past the region seam. Every section
  // only ever clips to its OWN rect and only ever draws its OWN content,
  // so two neighbouring sections' hit areas can never both claim the
  // same pixel; a patch neither section's real content reaches (e.g. a
  // rect corner far from any island) is simply unclickable for both --
  // a dead zone, with no cross-section subtraction logic required.
  const clipId = `v3-section-clip-${sectionMeta.id}`;
  const defs = el("defs");
  const clipPath = el("clipPath", { id: clipId });
  clipPath.appendChild(
    el("rect", { x: region.inner.x, y: region.inner.y, width: region.inner.width, height: region.inner.height })
  );
  defs.appendChild(clipPath);
  group.appendChild(defs);

  const sectionLink = el("a", { class: "v3-section-link", href: sectionMeta.href || "#" });

  const hitGroup = el("g", { "clip-path": `url(#${clipId})` });
  hitGroup.appendChild(el("rect", { class: "v3-section-hit", x: band.x, y: band.y, width: band.width, height: band.height }));
  if (sectionShapeD) hitGroup.appendChild(el("path", { class: "v3-section-hit", d: sectionShapeD, "fill-rule": "evenodd" }));
  sectionLink.appendChild(hitGroup);

  const glowGroup = el("g", { class: "v3-section-glow-group" });
  glowGroup.appendChild(el("rect", { class: "v3-section-glow", x: band.x, y: band.y, width: band.width, height: band.height }));
  if (sectionShapeD) glowGroup.appendChild(el("path", { class: "v3-section-glow", d: sectionShapeD, "fill-rule": "evenodd" }));
  if (sectionThemePreviewD) glowGroup.appendChild(el("path", { class: "v3-section-theme-preview", d: sectionThemePreviewD, "fill-rule": "evenodd", "data-clip-d": sectionThemePreviewClipD }));
  // v3.7.41 -- the label's own small wash patch, a SEPARATE sibling
  // element rather than a second subpath appended onto the composite
  // wash's own `d` string (an earlier attempt at that -- direct feedback:
  // "the textbox inclusion is behaving weirdly... white patches over all
  // textboxes"). Concatenating two closed shapes into one evenodd `d`
  // only unions them where they DON'T overlap; wherever the label's rect
  // happened to overlap the (often much bigger) islands-halo blob, the
  // shared fill-rule XORed the overlap back OUT, punching a hole exactly
  // there -- a real self-intersection bug, not a winding-direction one
  // (evenodd doesn't look at direction at all), but the same class of
  // "don't merge shapes into one path unless you're sure they never
  // touch" mistake this codebase's own sibling-element convention
  // (sectionShapeD next to the band rect, above) already exists to avoid.
  // No data-clip-d here: the label band is a reserved packing-free strip
  // by construction (splitLabelBand()), so real coastline effects
  // (wave-rings, coastal bands) never reach it in the first place -- only
  // the visible wash tint needs to cover it, not the hover-clip hole.
  glowGroup.appendChild(el("path", { class: "v3-section-theme-preview", d: labelWashD, "fill-rule": "evenodd" }));
  if (sectionPreviewHM) {
    // Real sea-depth bands, section level (v3.7.38) -- see the matching
    // per-island comment.
    v3Config.island.seaBandThresholds.forEach((level, i) => {
      const seaD = traceIsolatedShapeAtLevel(circles, v3Config.island, level, sectionPreviewHM.H, sectionPreviewHM.cols, sectionPreviewHM.rows, sectionPreviewHM.localBounds);
      glowGroup.appendChild(el("path", { d: seaD, class: `v3-section-theme-preview-sea v3-section-theme-preview-sea-${i + 1}`, "fill-rule": "evenodd" }));
    });

    // Mechanism 3, last piece, section level -- same reasoning and same
    // v3.7.37 z-order bugfix as the per-island version above: appended
    // AFTER the wash (sectionThemePreviewD, just above), not before --
    // that wash is fully opaque in its interior, so painting the shadow
    // underneath it hid the shadow completely.
    const shadowFilterId = `v3-section-shadow-blur-${sectionMeta.id}`;
    const shadowDefs = el("defs");
    const shadowFilter = el("filter", { id: shadowFilterId, filterUnits: "userSpaceOnUse" });
    shadowFilter.appendChild(el("feGaussianBlur", { stdDeviation: 1.5 }));
    shadowDefs.appendChild(shadowFilter);
    const { x: sfx, y: sfy, width: sfw, height: sfh } = sectionPreviewHM.localBounds;
    shadowFilter.setAttribute("x", sfx);
    shadowFilter.setAttribute("y", sfy);
    shadowFilter.setAttribute("width", sfw);
    shadowFilter.setAttribute("height", sfh);
    glowGroup.appendChild(shadowDefs);
    const shadowGroup = el("g", { class: "v3-section-theme-preview-shadow", filter: `url(#${shadowFilterId})` });
    buildIsolatedShadowTaper(circles, v3Config.island, sectionPreviewHM, v3Config.island.seaShadowAngleDeg).forEach(({ d, transform }) => {
      shadowGroup.appendChild(el("path", { class: "v3-section-theme-preview-shadow-copy", "fill-rule": "evenodd", d, transform }));
    });
    glowGroup.appendChild(shadowGroup);

    [
      ["sand", v3Config.island.sandThresholds],
      ["veg", v3Config.island.vegThresholds],
      ["peak", v3Config.island.peakThresholds]
    ].forEach(([name, levels]) => {
      levels.forEach((level, i) => {
        const bandD = traceIsolatedShapeAtLevel(
          circles, v3Config.island, level, sectionPreviewHM.H, sectionPreviewHM.cols, sectionPreviewHM.rows, sectionPreviewHM.localBounds
        );
        glowGroup.appendChild(
          el("path", { d: bandD, class: `v3-section-theme-preview-${name} v3-section-theme-preview-${name}-${i + 1}`, "fill-rule": "evenodd" })
        );
      });
    });
    // Real coastline outline(s), section level -- same "wash alone never
    // traced a boundary" gap as islands above, fixed the same way: trace
    // this section's circles at the real coastline threshold (not
    // dilated), reusing sectionPreviewHM instead of a fresh heightmap.
    const previewCoastlineD = traceIsolatedShapeAtLevel(
      circles, v3Config.island, v3Config.island.threshold, sectionPreviewHM.H, sectionPreviewHM.cols, sectionPreviewHM.rows, sectionPreviewHM.localBounds
    );
    glowGroup.appendChild(el("path", { d: previewCoastlineD, class: "v3-section-theme-preview-coastline", "fill-rule": "evenodd" }));
  }
  sectionLink.appendChild(glowGroup);

  group.appendChild(sectionLink);

  // v3.5: the visible island shape itself is drawn once, globally, as a
  // shared <path> underneath every region (see render()) -- traced from
  // every circle's own noise-carved coastline, fused where circles sit
  // close together. What's drawn here per-circle is only the
  // *interactive* layer on top of that shared shape: an invisible hit
  // circle at the entry's original (x, y, radius) so clicking/hovering
  // still targets the right entry even where its visible coastline has
  // merged with a neighbour's.
  //
  // v3.6.13 -- hover used to ring the hit circle with a stroke; that
  // read as a hard, obviously-artificial circle popping up over an
  // organic coastline. Replaced with a blurred glow, sized to the
  // entry's own hit circle -- see .v3-island-glow in cabinet-v3-style.css.
  //
  // v3.6.26 -- that hit circle itself is now the entry's REAL traced
  // shape (traceIsolatedShape() on just this one circle), not an
  // approximating circle -- direct request: "the hover halo for each
  // island has to be that island entirely, not a circle approximation."
  // Glow and hit both reuse the exact SAME path -- no separate enlarged
  // geometry for the glow; .v3-island-glow's existing blur(6px) filter
  // already produces the soft bleed past the coastline edge on its own.
  //
  // v3.7 -- dropped the dashed status ring for entries not fully live
  // (status: "wip"), and with it their own link/hit/glow entirely --
  // direct request: "Dummy entries simply have no hover effect of their
  // own, they lead to section heads like non-entry islands." Only the
  // name label is drawn (still useful -- it's a real, titled entry, just
  // not ready for its own hover/click identity yet); with no <a> of its
  // own and pointer-events:none on the label, hover/click on that spot
  // falls through to whatever's beneath -- the section's own hitGroup/
  // glowGroup (sectionLink, above) -- same as "filler" circles below,
  // which have never had a link of their own either.
  circles.forEach(c => {
    if (c.kind === "entry" && c.status === "wip") {
      group.appendChild(el("text", { x: c.x, y: c.y, class: "v3-island-label" }, c.title));
      return;
    }

    if (c.kind === "entry") {
      const link = el("a", { class: "v3-island", href: c.href || "#" });
      link.setAttribute("data-id", c.id);
      const islandD = traceIsolatedShape([c], v3Config.island, 0);
      link.appendChild(el("path", { d: islandD, class: "v3-island-glow", "fill-rule": "evenodd" }));

      // Theme-preview prototype, band fidelity -- one shared heightmap
      // build (buildIsolatedHeightmap()) covers the halo wash AND every
      // real sand/veg/peak level below, instead of rebuilding it per
      // level. sandThresholds/vegThresholds/peakThresholds are the SAME
      // arrays real (non-preview) islands trace at -- confirmed against
      // THEME_PRESETS that these don't vary per theme, only
      // flatColourMode/showWaveRings/showCoastalBands/seaShadowStyle do --
      // so this reproduces the real band structure, not an approximation.
      // Grid sized for islandHaloPx + the hover-clip's own extra margin
      // (clipMarginFor()) so BOTH the wash and the (larger) clip-hole
      // traced from it fit safely inside this one heightmap build. + 80
      // on top -- v3.7.38's sea-depth bands trace at seaBandThresholds,
      // noticeably further from the coastline (in H, not px) than the
      // halo/clip ever reach, so the local grid needs real extra room to
      // let those contours close naturally rather than against the
      // edge-forced boundary (see buildCoastlineDistanceField's own
      // edge-forcing comment for what that would otherwise flatten).
      const islandClipMargin = clipMarginFor(v3Config.themePreview.blurPx);
      const previewHM = buildIsolatedHeightmap([c], v3Config.island, v3Config.themePreview.islandHaloPx + islandClipMargin + 80);

      const previewDistanceField = buildCoastlineDistanceField(
        previewHM.H, previewHM.cols, previewHM.rows, v3Config.island.cellSize, v3Config.island.threshold
      );
      const themePreviewD = traceContourFromHeightmap(
        previewDistanceField, previewHM.cols, previewHM.rows, v3Config.island.cellSize,
        previewHM.localBounds, -v3Config.themePreview.islandHaloPx
      );
      const themePreviewClipD = traceContourFromHeightmap(
        previewDistanceField, previewHM.cols, previewHM.rows, v3Config.island.cellSize,
        previewHM.localBounds, -(v3Config.themePreview.islandHaloPx + islandClipMargin)
      );
      link.appendChild(el("path", { d: themePreviewD, class: "v3-island-theme-preview", "fill-rule": "evenodd", "data-clip-d": themePreviewClipD }));

      // Real sea-depth bands (v3.7.38) -- direct feedback: "sea contours
      // arent visible." Same seaBandThresholds array real islands trace
      // at (confirmed theme-invariant, same as sand/veg/peak), painted
      // between the wash and the shadow -- same slot the real
      // .v3-sea-band occupies relative to .v3-coast-outward-band/shadow
      // in drawIslandsPath().
      v3Config.island.seaBandThresholds.forEach((level, i) => {
        const seaD = traceIsolatedShapeAtLevel([c], v3Config.island, level, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds);
        link.appendChild(el("path", { d: seaD, class: `v3-island-theme-preview-sea v3-island-theme-preview-sea-${i + 1}`, "fill-rule": "evenodd" }));
      });

      // Mechanism 3, last piece -- Topology's directional taper shadow,
      // isolated to this one island. Appended AFTER the halo wash above,
      // not before -- v3.7.37 bugfix: an EARLIER version painted this
      // first/underneath the wash (matching the real shadow's own "under
      // the land fill, only the spill into open water shows" ordering),
      // but that wash is fully OPAQUE in its interior (blur softens only
      // the EDGE, not the interior alpha), so the shadow was completely
      // hidden underneath it -- confirmed by an empty-looking hover
      // screenshot before this fix, not assumed. Between the wash and the
      // land bands (sand/veg/peak, appended next) is the correct
      // equivalent slot: still under the "land," visible over the "sea."
      // Same "swap Medieval's shadow for Topology's, not just add
      // Topology's on top of it" goal as before (Medieval's own shadow is
      // clipped away by setupMedievalEffectsHoverClip -- see
      // .v3-sea-shadow-radial/.v3-sea-shadow-taper in the clip's target
      // list, cabinet-v3-style.css). Own isolated blur filter, same
      // filterUnits="userSpaceOnUse" + bounds-sized-region fix the real
      // shadow needed for the exact same reason (see that block's own
      // v3.7.24 bugfix comment) -- sized to previewHM.localBounds instead
      // of the whole canvas.
      const shadowFilterId = `v3-island-shadow-blur-${c.id}`;
      const shadowDefs = el("defs");
      const shadowFilter = el("filter", { id: shadowFilterId, filterUnits: "userSpaceOnUse" });
      shadowFilter.appendChild(el("feGaussianBlur", { stdDeviation: 1.5 }));
      shadowDefs.appendChild(shadowFilter);
      const { x: sfx, y: sfy, width: sfw, height: sfh } = previewHM.localBounds;
      shadowFilter.setAttribute("x", sfx);
      shadowFilter.setAttribute("y", sfy);
      shadowFilter.setAttribute("width", sfw);
      shadowFilter.setAttribute("height", sfh);
      link.appendChild(shadowDefs);
      const shadowGroup = el("g", { class: "v3-island-theme-preview-shadow", filter: `url(#${shadowFilterId})` });
      buildIsolatedShadowTaper([c], v3Config.island, previewHM, v3Config.island.seaShadowAngleDeg).forEach(({ d, transform }) => {
        shadowGroup.appendChild(el("path", { class: "v3-island-theme-preview-shadow-copy", "fill-rule": "evenodd", d, transform }));
      });
      link.appendChild(shadowGroup);

      [
        ["sand", v3Config.island.sandThresholds],
        ["veg", v3Config.island.vegThresholds],
        ["peak", v3Config.island.peakThresholds]
      ].forEach(([name, levels]) => {
        levels.forEach((level, i) => {
          const bandD = traceIsolatedShapeAtLevel(
            [c], v3Config.island, level, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds
          );
          link.appendChild(
            el("path", { d: bandD, class: `v3-island-theme-preview-${name} v3-island-theme-preview-${name}-${i + 1}`, "fill-rule": "evenodd" })
          );
        });
      });

      // Real coastline outline, on top of the bands -- direct feedback:
      // "the coastal outline isnt there as well." The wash above (halo)
      // is deliberately unstroked (v3.7.32, blur handles its edge
      // instead), so once real bands got added there was nothing tracing
      // the island's actual boundary at all. traceIsolatedShapeAtLevel at
      // the real threshold, reusing the SAME shared heightmap rather than
      // a fresh trace -- same shape islandD already holds, just sourced
      // from previewHM instead of a separate call.
      const previewCoastlineD = traceIsolatedShapeAtLevel(
        [c], v3Config.island, v3Config.island.threshold, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds
      );
      link.appendChild(el("path", { d: previewCoastlineD, class: "v3-island-theme-preview-coastline", "fill-rule": "evenodd" }));

      link.appendChild(el("path", { d: islandD, class: "v3-island-hit", "fill-rule": "evenodd" }));
      link.appendChild(el("text", { x: c.x, y: c.y, class: "v3-island-label" }, c.title));
      group.appendChild(link);
      return;
    }

    // filler -- contributes to the shared island heightmap already (see
    // render()) and needs no element of its own here.
  });

  // labelGroup was already built above (before the theme-preview wash,
  // which needs its rendered bbox) -- real DOM placement happens here.
  // v3.6.27 -- appended to sectionLink itself, not group -- .v3-section-
  // label needs to be a DOM descendant of .v3-section-link for its own
  // hover-colour rule (cabinet-v3-style.css) to reach it via a plain
  // descendant selector, same relationship .v3-island-label already has
  // with its own <a> above. Purely a structural move: pointer-events:
  // none (already set) means this still can't steal the hover/click away
  // from sectionLink's own hit shape underneath.
  sectionLink.appendChild(labelGroup);

  stage.appendChild(group);
}

// v3.7 -- compass_rose.svg's own shapes, copied directly (same "just
// build DOM elements directly" approach DRAGON_PATH_D above already
// uses, for the same file:// CORS reason). Original source: 3 fills only
// (white #FEFEFE, black #2B2A29, blue #00A0E3) plus a none-fill/black-
// stroke outline pass -- renamed here to the semantic classes
// .v3-compass-white/-black/-blue/-outline (cabinet-v3-style.css) so each
// maps to a theme colour token instead of a fixed hex, per direct
// request ("match scheme colour tokens to these"). Source viewBox:
// "0 0 827.72 827.72", center (413.86, 413.86).
const COMPASS_VIEWBOX = 827.72;
const COMPASS_ROSE_SHAPES = [
  { tag: "polygon", cls: "v3-compass-black", points: "540.02,314.44 595.57,232.15 527.43,300.29 413.86,413.86 501.22,371.92" },
  { tag: "polygon", cls: "v3-compass-black", points: "314.44,287.7 232.15,232.15 300.29,300.29 413.86,413.86 371.92,326.49" },
  { tag: "polygon", cls: "v3-compass-black", points: "287.7,513.28 232.15,595.57 300.29,527.43 413.86,413.86 326.49,455.8" },
  { tag: "polygon", cls: "v3-compass-black", points: "513.28,540.02 595.57,595.57 527.43,527.43 413.86,413.86 455.8,501.22" },
  { tag: "polygon", cls: "v3-compass-white", points: "513.28,287.7 595.57,232.15 527.43,300.29 413.86,413.86 455.8,326.49" },
  { tag: "polygon", cls: "v3-compass-white", points: "287.7,314.44 232.15,232.15 300.29,300.29 413.86,413.86 326.49,371.92" },
  { tag: "polygon", cls: "v3-compass-white", points: "314.44,540.02 232.15,595.57 300.29,527.43 413.86,413.86 371.92,501.22" },
  { tag: "polygon", cls: "v3-compass-white", points: "540.02,513.28 595.57,595.57 527.43,527.43 413.86,413.86 501.22,455.8" },
  { tag: "polygon", cls: "v3-compass-outline", points: "540.02,314.44 595.57,232.15 513.28,287.7 455.8,326.49 413.86,413.86 501.22,455.8 540.02,513.28 595.57,595.57 513.28,540.02 455.8,501.22 413.86,413.86 326.49,371.92 287.7,314.44 232.15,232.15 314.44,287.7 371.92,326.49 413.86,413.86 371.92,501.22 314.44,540.02 232.15,595.57 287.7,513.28 326.49,455.8 413.86,413.86 501.22,371.92" },
  { tag: "path", cls: "v3-compass-blue", d: "M480.6 274.83l-17.41 36.26c0.69,-0.01 1.37,-0.02 2.06,-0.02 56.58,0 102.48,45.71 102.79,102.22 -0.22,-61 -35.87,-113.66 -87.44,-138.46z" },
  { tag: "path", cls: "v3-compass-blue", d: "M568.04 414.43c-0.31,56.51 -46.21,102.22 -102.79,102.22 -0.69,0 -1.38,-0.01 -2.06,-0.02l17.41 36.26c51.57,-24.8 87.22,-77.46 87.44,-138.46z" },
  { tag: "path", cls: "v3-compass-blue", d: "M228.84 413.86c0,-51.09 20.71,-97.35 54.19,-130.83 33.48,-33.48 79.74,-54.19 130.83,-54.19 28.69,0 55.86,6.53 80.09,18.18l17.8 -37.07c-29.62,-14.25 -62.82,-22.23 -97.89,-22.23 -62.44,0 -118.98,25.31 -159.9,66.24 -40.92,40.92 -66.24,97.46 -66.24,159.9 0,62.44 25.31,118.98 66.24,159.9 40.92,40.92 97.46,66.24 159.9,66.24 35.06,0 68.27,-7.98 97.89,-22.23l-17.8 -37.07c-24.23,11.65 -51.4,18.18 -80.09,18.18 -51.09,0 -97.35,-20.71 -130.83,-54.19 -33.48,-33.48 -54.19,-79.74 -54.19,-130.83z" },
  { tag: "path", cls: "v3-compass-blue", d: "M598.88 413.86c0,51.09 -20.71,97.35 -54.19,130.83 -14.68,14.68 -31.82,26.91 -50.74,36.01l17.8 37.07c23.13,-11.12 44.07,-26.07 62.02,-44.01 40.92,-40.92 66.24,-97.46 66.24,-159.9 0,-62.44 -25.31,-118.98 -66.24,-159.9 -17.94,-17.94 -38.89,-32.89 -62.02,-44.01l-17.8 37.07c18.92,9.1 36.06,21.33 50.74,36.01 33.48,33.48 54.19,79.74 54.19,130.83z" },
  { tag: "path", cls: "v3-compass-blue", d: "M413.86 259.67c-85.15,0 -154.19,69.03 -154.19,154.19 0,85.15 69.03,154.19 154.19,154.19 23.91,0 46.54,-5.44 66.74,-15.15l-17.41 -36.26c-55.82,-1.1 -100.73,-46.69 -100.73,-102.77 0,-56.08 44.91,-101.67 100.73,-102.77l17.41 -36.26c-20.2,-9.71 -42.83,-15.15 -66.74,-15.15z" },
  { tag: "polygon", cls: "v3-compass-black", points: "444.12,158.65 413.86,2.7 413.86,156.88 413.86,413.86 465.25,267.57" },
  { tag: "polygon", cls: "v3-compass-black", points: "158.65,383.6 2.7,413.86 156.88,413.86 413.86,413.86 267.57,362.47" },
  { tag: "polygon", cls: "v3-compass-black", points: "383.6,669.07 413.86,825.02 413.86,670.84 413.86,413.86 362.47,560.15" },
  { tag: "polygon", cls: "v3-compass-black", points: "669.07,444.12 825.02,413.86 670.84,413.86 413.86,413.86 560.15,465.25" },
  { tag: "polygon", cls: "v3-compass-white", points: "383.6,158.65 413.86,2.7 413.86,156.88 413.86,413.86 362.47,267.57" },
  { tag: "polygon", cls: "v3-compass-white", points: "158.65,444.12 2.7,413.86 156.88,413.86 413.86,413.86 267.57,465.25" },
  { tag: "polygon", cls: "v3-compass-white", points: "444.12,669.07 413.86,825.02 413.86,670.84 413.86,413.86 465.25,560.15" },
  { tag: "polygon", cls: "v3-compass-white", points: "669.07,383.6 825.02,413.86 670.84,413.86 413.86,413.86 560.15,362.47" },
  { tag: "polygon", cls: "v3-compass-outline", points: "444.12,158.65 413.86,2.7 383.6,158.65 362.47,267.57 413.86,413.86 560.15,362.47 669.07,383.6 825.02,413.86 669.07,444.12 560.15,465.25 413.86,413.86 267.57,465.25 158.65,444.12 2.7,413.86 158.65,383.6 267.57,362.47 413.86,413.86 465.25,560.15 444.12,669.07 413.86,825.02 383.6,669.07 362.47,560.15 413.86,413.86 465.25,267.57" },
  { tag: "path", cls: "v3-compass-blue", d: "M383.77 476.53l-36.66 76.36c20.2,9.71 42.83,15.15 66.74,15.15 23.91,0 46.54,-5.44 66.74,-15.15l-17.41 -36.26c-32.34,-0.64 -61.01,-16.21 -79.42,-40.1z" },
  { tag: "path", cls: "v3-compass-blue", d: "M383.77 351.19c18.4,-23.89 47.08,-39.46 79.42,-40.1l17.41 -36.26c-20.2,-9.71 -42.83,-15.15 -66.74,-15.15 -23.91,0 -46.55,5.44 -66.74,15.15l36.66 76.36z" },
  { tag: "path", cls: "v3-compass-blue", d: "M365.14 435.37c-1.61,-7.23 -2.46,-14.74 -2.46,-22.45 0,-7.71 0.85,-15.22 2.46,-22.45l-91.24 -41.86c-8.99,19.57 -14.01,41.35 -14.01,64.3 0,22.95 5.01,44.73 14.01,64.3l91.24 -41.86zm-2.46 -22.45c0,-7.71 0.85,-15.22 2.46,-22.45 -1.61,7.23 -2.46,14.74 -2.46,22.45zm2.46 22.45c-1.61,-7.23 -2.46,-14.74 -2.46,-22.45 0,7.71 0.85,15.22 2.46,22.45z" }
];

// v3.7.1 -- the visible outline of each of the 4 CARDINAL arms (N/E/S/W
// only -- the ordinal/diagonal star's NE/NW/SE/SW arms have no entry of
// their own and stay purely decorative), traced by hand from
// COMPASS_ROSE_SHAPES' own black+white half-polygons above (e.g. N =
// shapes 15+19's outer points, tip to tip through the shared centre).
// Used only for the hover glow overlay below -- direct request was a
// glow on "the one compass arm being hovered," not a filled wedge.
const COMPASS_ARM_HULLS = {
  N: "413.86,2.7 444.12,158.65 465.25,267.57 413.86,413.86 362.47,267.57 383.6,158.65",
  E: "825.02,413.86 669.07,444.12 560.15,465.25 413.86,413.86 560.15,362.47 669.07,383.6",
  S: "413.86,825.02 383.6,669.07 362.47,560.15 413.86,413.86 465.25,560.15 444.12,669.07",
  W: "2.7,413.86 158.65,383.6 267.57,362.47 413.86,413.86 267.57,465.25 158.65,444.12"
};

// Direction -> unit position (0..1 of the square) + text-anchor for each
// edge label -- sits in the margin COMPASS_ROSE_SCALE below deliberately
// leaves around the shrunk rose. E/W stay level with their own arm's
// centreline (y: 0.5, matching N/S's own alignment convention -- direct
// feedback: the earlier off-centre nudge here was the wrong fix). The
// real problem was "Contact me" being the longest of the 4 labels and
// too wide for the edge margin at any single-line y -- solved instead
// via `wrap: true` (below), which lines-breaks it onto 2 lines so it
// never needs that width in the first place.
const COMPASS_LABEL_LAYOUT = {
  N: { x: 0.5, y: 0.08, anchor: "middle" },
  E: { x: 0.97, y: 0.5, anchor: "end", wrap: true },
  S: { x: 0.5, y: 0.94, anchor: "middle" },
  W: { x: 0.03, y: 0.5, anchor: "start" }
};

// v3.7.1 -- direct request: "make the compass rose smaller, about 70% of
// current size... add the requisite text labels to the 4 quadrants."
// The freed-up margin is where COMPASS_LABEL_LAYOUT places those labels
// -- 0.62, not a literal 0.7, since "Contact me"/"About Me" (the longest
// labels) still clipped the rose's own arm tips at 0.7 (confirmed
// visually) even after the off-centre nudge above; "or as needed" per
// the original request.
const COMPASS_ROSE_SCALE = 0.62;

// v3.7 -- the reserved SE compass section (kind: "compass",
// buildRegions()'s carve-out above). No archipelago here: the compass
// graphic is placed directly at region.compassSquare (already the
// largest square inscribed in this section's own strip, flush to the
// canvas's true bottom-right corner), uniformly scaled from
// COMPASS_ROSE_SHAPES' own square viewBox -- a single scale factor keeps
// every shape's proportions intact.
//
// v3.7.1 -- three direct-request changes: (1) the rose itself now
// renders at COMPASS_ROSE_SCALE, re-centred in the square (was full
// square before); (2) each direction gets a real text label
// (COMPASS_LABEL_LAYOUT) in the margin that shrink freed up; (3) hover
// feedback is no longer a filled wedge -- .v3-compass-hit's 4 triangles
// (split along the square's own diagonals, same N/E/S/W split as
// before) stay as generous, fully invisible hit/focus targets covering
// the WHOLE square (including the label margin, so hovering a label
// counts too), but the VISIBLE feedback is now a blurred glow on that
// direction's own arm hull (COMPASS_ARM_HULLS, drawn inside the same
// scaled `rose` group so it tracks the shrunk artwork exactly) plus a
// matching glow on its label -- wired via CSS :has() in
// cabinet-v3-style.css (hit and target aren't DOM siblings, since hits
// need the full-square transform and the arm-glow needs the rose's own
// shrunk one).
// v3.7.18 -- shared by renderCompassRegion() (below) and render()'s own
// gridOrigin calculation, so both agree on where the compass's true
// visual centre actually is. Split out at v3.7.20 -- gridOrigin (the
// lat/long grid's and the diagonals' shared phase-alignment point,
// render()) originally just read compassSquare's raw, UNshifted centre,
// which was correct until this function started shifting the rose off
// that centre (below) to recentre the whole [rose + labels] unit --
// after that, gridOrigin and the rose's actual rendered position quietly
// disagreed, direct feedback: "diagonals no longer centred to the
// compass! I suspect the latlong isnt either" (it was: same root cause).
// Computing the shift ONCE here, called from both places, means there's
// only one place this math can drift out of sync with itself.
//
// Direct feedback that produced this shift in the first place: uneven
// spacing between the rose and its 4 labels ("Contact me" sitting
// tighter to the rose than the others). COMPASS_LABEL_LAYOUT's old fixed
// FRACTIONS (x/y as a % of the square) put every label a fixed DISTANCE
// from the square's own edge, not a fixed distance from the rose's edge
// -- two labels of different lengths (or one wrapped to 2 lines) end up
// different distances from the actual artwork even at matching
// fractions. Replaced with an explicit, uniform LABEL_GAP measured from
// the rose's real rendered edge (= `inset`, the same margin that centres
// the rose in the square) to each label's own near edge -- same gap on
// all 4 sides by construction. COMPASS_LABEL_LAYOUT still supplies
// anchor/wrap per direction; only x/y are derived here instead of read
// off `pos` directly.
//
// Second direct request, done together: "recalculate the compass
// position based on centering the compass + the text labels, and
// recenter within the larger section+margin territory." Two passes --
// first computes every label's estimated position/box at the gap above
// (nominal, rose assumed centred in `square`), then measures the
// combined [rose + all 4 labels] bounding box and returns how far THAT
// box's centre sits from the square's own centre, for the caller to
// shift rose + every label + every hit box (or, for render(),
// gridOrigin) by. Only needed because the 4 labels aren't symmetric in
// length -- a longer label pushes the combined box's edge further out on
// its side than a shorter one opposite it, so the rose-centred-alone
// assumption doesn't actually centre the whole visual unit. Estimated
// the same way every other label box in this file already is (char count
// x font size x width factor) -- not a live getBBox() measurement,
// consistent with this file's existing convention (see
// wrapTitleToLines()).
function computeCompassLayout(square) {
  const fullScale = square.width / COMPASS_VIEWBOX;
  const scale = fullScale * COMPASS_ROSE_SCALE;
  const inset = (square.width - square.width * COMPASS_ROSE_SCALE) / 2;
  const roseLeft = square.x + inset;
  const roseRight = square.x + square.width - inset;
  const roseTop = square.y + inset;
  const roseBottom = square.y + square.height - inset;
  const roseCenterX = square.x + square.width / 2;
  const roseCenterY = square.y + square.height / 2;
  return { scale, inset, roseLeft, roseRight, roseTop, roseBottom, roseCenterX, roseCenterY };
}

const COMPASS_LABEL_GAP = 10;
const COMPASS_LABEL_CHAR_WIDTH_FACTOR = 0.56;
const COMPASS_LABEL_FONT_SIZE = 11;
const COMPASS_LABEL_LINE_HEIGHT = 12;

function computeCompassNominalLabels(rose, sectionMeta) {
  const byDirection = new Map(
    sectionMeta.entries
      .filter(e => e.status !== false)
      .map(e => [e.visual && e.visual.anchor, e])
  );
  return Object.entries(COMPASS_LABEL_LAYOUT)
    .map(([dir, pos]) => {
      const entry = byDirection.get(dir);
      if (!entry) return null;
      const lines = pos.wrap ? entry.title.split(" ") : [entry.title];
      const maxLineLen = Math.max(...lines.map(l => l.length));
      const textWidth = maxLineLen * COMPASS_LABEL_FONT_SIZE * COMPASS_LABEL_CHAR_WIDTH_FACTOR;
      const textHalfHeight = (lines.length * COMPASS_LABEL_LINE_HEIGHT) / 2;
      let x, y;
      if (dir === "E") { x = rose.roseRight + COMPASS_LABEL_GAP + textWidth; y = rose.roseCenterY; }
      else if (dir === "W") { x = rose.roseLeft - COMPASS_LABEL_GAP - textWidth; y = rose.roseCenterY; }
      else if (dir === "N") { x = rose.roseCenterX; y = rose.roseTop - COMPASS_LABEL_GAP - textHalfHeight; }
      else { x = rose.roseCenterX; y = rose.roseBottom + COMPASS_LABEL_GAP + textHalfHeight; }
      return { dir, pos, entry, lines, x, y, textWidth, textHalfHeight };
    })
    .filter(Boolean);
}

// Returns { shiftX, shiftY } -- see computeCompassLayout()'s own comment
// for why this needs to be called (not just the raw square centre) by
// both renderCompassRegion() and render()'s gridOrigin calculation.
function computeCompassShift(square, sectionMeta) {
  const rose = computeCompassLayout(square);
  const nominal = computeCompassNominalLabels(rose, sectionMeta);
  const boxLeft = Math.min(rose.roseLeft, ...nominal.filter(n => n.dir === "W").map(n => n.x));
  const boxRight = Math.max(rose.roseRight, ...nominal.filter(n => n.dir === "E").map(n => n.x));
  const boxTop = Math.min(rose.roseTop, ...nominal.filter(n => n.dir === "N").map(n => n.y - n.textHalfHeight));
  const boxBottom = Math.max(rose.roseBottom, ...nominal.filter(n => n.dir === "S").map(n => n.y + n.textHalfHeight));
  return {
    shiftX: rose.roseCenterX - (boxLeft + boxRight) / 2,
    shiftY: rose.roseCenterY - (boxTop + boxBottom) / 2
  };
}

function renderCompassRegion(stage, region, sectionMeta) {
  const square = region.compassSquare;
  if (!square || square.width <= 0) return;

  const group = el("g", { class: "v3-compass" });

  const rose = computeCompassLayout(square);
  const nominal = computeCompassNominalLabels(rose, sectionMeta);
  const boxLeft = Math.min(rose.roseLeft, ...nominal.filter(n => n.dir === "W").map(n => n.x));
  const boxRight = Math.max(rose.roseRight, ...nominal.filter(n => n.dir === "E").map(n => n.x));
  const boxTop = Math.min(rose.roseTop, ...nominal.filter(n => n.dir === "N").map(n => n.y - n.textHalfHeight));
  const boxBottom = Math.max(rose.roseBottom, ...nominal.filter(n => n.dir === "S").map(n => n.y + n.textHalfHeight));
  const shiftX = rose.roseCenterX - (boxLeft + boxRight) / 2;
  const shiftY = rose.roseCenterY - (boxTop + boxBottom) / 2;

  const { scale, inset } = rose;
  const roseGroup = el("g", {
    class: "v3-compass-rose",
    transform: `translate(${square.x + inset + shiftX}, ${square.y + inset + shiftY}) scale(${scale})`
  });
  // v3.7.48 (#21/#29) -- the star artwork + arm-glow duplicates live in a
  // nested group so they can spin (#29's hover-triggered rotation, CSS
  // keyframes in cabinet-v3-style.css) independently of roseGroup's own
  // translate/scale positioning -- rotating roseGroup itself would need
  // to fight that positioning transform every frame. transform-box:
  // fill-box (that stylesheet) centres the spin on this group's own
  // bounding box automatically, so no origin math is needed here.
  const spinGroup = el("g", { class: "v3-compass-rose-spin" });
  COMPASS_ROSE_SHAPES.forEach(shape => {
    const attrs = { class: shape.cls };
    if (shape.tag === "polygon") attrs.points = shape.points;
    else attrs.d = shape.d;
    spinGroup.appendChild(el(shape.tag, attrs));
  });
  Object.entries(COMPASS_ARM_HULLS).forEach(([dir, points]) => {
    spinGroup.appendChild(el("polygon", { class: "v3-compass-arm-glow", "data-direction": dir, points }));
  });
  roseGroup.appendChild(spinGroup);

  // Two concentric invisible hit circles, both in the rose's own raw
  // COMPASS_VIEWBOX coordinate space (827.72 wide, centred 413.86,
  // 413.86) so roseGroup's existing transform positions/scales them
  // automatically, same as the artwork itself. Appended in this order
  // (spin ring first, theme circle second/topmost) so a click/hover
  // inside the smaller inner circle is caught by IT, not the larger
  // ring beneath -- no evenodd/annulus math needed, plain SVG paint
  // order does the job. #21: click the inner circle to swap Medieval
  // <-> Topology (handler in cabinet-v3-production-animate.js, since
  // that's the only script loaded on the production/static build).
  // #29: hover the outer ring/arm area to spin the rose one revolution
  // (pure CSS, see .v3-compass-spin-hit's :has() rule) -- direct
  // request to keep the two gestures spatially separate: "I dont want
  // to overload the compass centre too much."
  const spinHitRadius = COMPASS_VIEWBOX / 2 - 3;
  const themeHitRadius = spinHitRadius * 0.27;
  roseGroup.appendChild(el("circle", {
    class: "v3-compass-spin-hit",
    cx: 413.86, cy: 413.86, r: spinHitRadius
  }));
  roseGroup.appendChild(el("circle", {
    class: "v3-compass-theme-hit",
    cx: 413.86, cy: 413.86, r: themeHitRadius
  }));
  group.appendChild(roseGroup);

  // v3.7.2 -- `wrap: true` (E, currently -- "Contact me", the longest of
  // the 4 labels) line-breaks one word per <tspan> instead of pushing
  // the label off its arm's own centreline to dodge a collision (direct
  // feedback: "CV can be in the same line as the [W] arm, why below?...
  // maintain the alignments"). Lines stack centred ON pos.y via dy, so
  // the label's vertical MIDPOINT stays level with the arm regardless
  // of how many lines it takes.
  //
  // v3.7.4/5 -- direct feedback simplified the hit area twice: first to
  // "enclose the 4 quadrant labels in a rectangle... that area is the
  // active area" (dropping the earlier arm-hull hit shape, v3.7.3),
  // then to drop the rectangle's own visible border and corner
  // ornaments too ("maybe no rectangular frames... not leftover
  // ornaments either") -- .v3-compass-label-frame stays as a plain
  // invisible hit rect, sized around the label's ESTIMATED text box
  // (character count x fontSize x charWidthFactor, this file's own
  // existing text-width convention, see wrapTitleToLines() above; not a
  // live getBBox() measurement). Hovering/focusing it still glows the
  // matching arm via the existing :has() rules -- unchanged, they only
  // care about .v3-compass-hit[data-direction]'s OWN :hover/
  // :focus-visible state, not what shape triggered it.
  const LABEL_HIT_PAD = 5;

  const labels = el("g", { class: "v3-compass-labels" });
  const hits = el("g", { class: "v3-compass-hits" });

  nominal.forEach(({ dir, pos, entry, lines, x: nomX, y: nomY }) => {
    const x = nomX + shiftX;
    const y = nomY + shiftY;
    const textEl = el("text", { class: "v3-compass-direction-label", "data-direction": dir, x, "text-anchor": pos.anchor });
    const firstY = y - ((lines.length - 1) * COMPASS_LABEL_LINE_HEIGHT) / 2;
    lines.forEach((line, i) => {
      textEl.appendChild(el("tspan", { x, y: firstY + i * COMPASS_LABEL_LINE_HEIGHT }, line));
    });
    labels.appendChild(textEl);

    const maxLineLen = Math.max(...lines.map(l => l.length));
    const hitWidth = maxLineLen * COMPASS_LABEL_FONT_SIZE * COMPASS_LABEL_CHAR_WIDTH_FACTOR + LABEL_HIT_PAD * 2;
    const hitHeight = lines.length * COMPASS_LABEL_LINE_HEIGHT + LABEL_HIT_PAD * 2;
    let hitLeft;
    if (pos.anchor === "start") hitLeft = x - LABEL_HIT_PAD;
    else if (pos.anchor === "end") hitLeft = x - hitWidth + LABEL_HIT_PAD;
    else hitLeft = x - hitWidth / 2;
    const hitTop = y - hitHeight / 2;

    const link = el("a", { class: "v3-compass-hit", href: entry.href || "#", "data-direction": dir });
    link.appendChild(el("rect", { class: "v3-compass-label-frame", x: hitLeft, y: hitTop, width: hitWidth, height: hitHeight }));
    hits.appendChild(link);
  });

  group.appendChild(labels);
  group.appendChild(hits);

  stage.appendChild(group);
}

// v3.7.1 -- faint dotted lat/long grid, ~100px apart (direct request),
// phase-aligned through `origin` (the compass's own centre) rather than
// canvas (0,0) -- so one longitude line always runs through the
// compass's own N-S axis and one latitude line through its E-W axis
// (direct request: "the compass N S E W direction match one pair of
// lat-long lines"). Diagonal rays from that same origin echo the
// compass's own NE/NW/SE/SW ordinal arms outward across the map.
//
// v3.7.2 bugfix -- "over the sea, not visible on land" was originally
// attempted via paint order (draw the grid before the landmass, let
// land cover it) -- doesn't work: drawIslandsPath()'s own placeOne()
// helper unconditionally pins the landmass to stage.firstChild no
// matter when it's called relative to anything else, so it's ALWAYS
// the bottom-most layer; nothing can ever paint under it via DOM order
// alone (confirmed by direct feedback -- "lines are overlaid on the
// islands" -- even after trying the reverse call order). Fixed instead
// with a real SVG <mask>: white (visible) everywhere except the land
// silhouette itself, painted black using the exact same `d` + evenodd
// fill-rule .v3-coastline-outline already traces (present regardless
// of flatColourMode, one shared shape for every island) -- so this
// MUST run after drawIslandsPath() has drawn that element, not before.
//
// v3.7.7 -- pitch went from a round 100 to 73 (prime, so it can't share
// a common factor with other periodic geometry on the map -- region
// gaps, dash rhythms -- and fall into a repeating coincidence with any
// of them), then split into two INDEPENDENT axes (v3Config.geo.
// latSpacing/lonSpacing, cabinet-v3-data.js) with their own dev-panel
// sliders -- direct request: "give me 2 separate controls for each of
// them." Diagonals need no spacing of their own (single rays from
// `origin`, not a repeating series) so they're unaffected either way.
//
// Idempotent -- removes any previous .v3-geo-grid before drawing a new
// one, same reasoning as placeOne()'s reuse-or-create below: this gets
// called again on every spacing-slider tick via retraceIslands()
// (cabinet-v3-controls.js), and a plain stage.appendChild() on every
// tick would stack up a fresh duplicate grid layer each time instead of
// replacing the old one.
function drawGeoGrid(stage, canvasBounds, origin) {
  const existing = stage.querySelector(".v3-geo-grid");
  if (existing) existing.remove();
  // v3.7.8 -- two independent dev-panel toggles, not one -- direct
  // request: "separate toggles for grid and compass diagonals." Bail out
  // right after clearing the stale group above when BOTH are off, so
  // "off" really means nothing left in the DOM, not an empty-but-present
  // group.
  const { showGrid, showDiagonals, latSpacing, lonSpacing } = v3Config.geo;
  if (!showGrid && !showDiagonals) return;

  const group = el("g", { class: "v3-geo-grid" });
  const left = canvasBounds.x;
  const right = canvasBounds.x + canvasBounds.width;
  const top = canvasBounds.y;
  const bottom = canvasBounds.y + canvasBounds.height;

  // v3.7.8 -- sliders now go down to 0 (direct request); a 0 (or
  // negative, not reachable via the slider but defensive anyway) step
  // would either hang the loop below (x -= 0 never advances) or run it
  // backwards, so treat "spacing <= 0" as "no lines on that axis" rather
  // than looping at all.
  if (showGrid) {
    if (lonSpacing > 0) {
      for (let x = origin.x; x > left; x -= lonSpacing) {
        group.appendChild(el("line", { class: "v3-geo-line", x1: x, y1: top, x2: x, y2: bottom }));
      }
      for (let x = origin.x + lonSpacing; x < right; x += lonSpacing) {
        group.appendChild(el("line", { class: "v3-geo-line", x1: x, y1: top, x2: x, y2: bottom }));
      }
    }
    if (latSpacing > 0) {
      for (let y = origin.y; y > top; y -= latSpacing) {
        group.appendChild(el("line", { class: "v3-geo-line", x1: left, y1: y, x2: right, y2: y }));
      }
      for (let y = origin.y + latSpacing; y < bottom; y += latSpacing) {
        group.appendChild(el("line", { class: "v3-geo-line", x1: left, y1: y, x2: right, y2: y }));
      }
    }
  }

  // Reach far enough to clear canvasBounds regardless of aspect ratio;
  // the <svg> viewBox itself clips the overshoot, no bounds math needed.
  // v3.7.6 -- direct request: rays every 22.5 degrees, not just the 4
  // ordinal 45-degree ones -- "add diagonals at 22.5 degree intervals as
  // well, above and below SE EN NW WS" (i.e. one on each side of NE/SE/
  // SW/NW).
  // v3.7.9 bugfix -- the 4 cardinal angles (0/90/180/270) were
  // unconditionally skipped on the assumption they're always retraced by
  // the straight lat/long lines above -- true only when showGrid is on.
  // With showGrid off, that left the compass with NO N/S/E/W rays at
  // all, only its ordinal diagonals -- "if latlong is off, the compass
  // rose NSEW cardinal lines need to appear, not only the diagonals."
  // Now the cardinal skip only applies while showGrid is actually
  // drawing that segment, so turning the grid off doesn't blank the
  // compass's own cardinal rays.
  // v3.7.49 (#29) -- the rays live in their own nested [translate ->
  // rotate] pair, same reasoning as the compass rose's own spinGroup:
  // an inline SVG transform="translate(...)" attribute (positioning,
  // set once here) and a CSS transform: rotate() (the hover-triggered
  // spin, cabinet-v3-style.css) can't coexist on the SAME element --
  // CSS transform replaces the presentation attribute outright rather
  // than composing with it. Drawing each ray relative to (0,0) instead
  // of `origin` directly lets the spin group use a static, constant
  // transform-origin: 0 0 in CSS rather than needing origin's own
  // (per-render, dynamic) coordinates baked into a stylesheet rule.
  const reach = Math.max(canvasBounds.width, canvasBounds.height) * 1.5;
  const diagonalOuter = el("g", { transform: `translate(${origin.x}, ${origin.y})` });
  const diagonalSpin = el("g", { class: "v3-geo-diagonal-spin" });
  for (let deg = 0; showDiagonals && deg < 360; deg += 22.5) {
    if (deg % 90 === 0 && showGrid) continue;
    const rad = (deg * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    diagonalSpin.appendChild(el("line", {
      class: "v3-geo-line v3-geo-diagonal",
      x1: 0, y1: 0,
      x2: dx * reach, y2: dy * reach
    }));
  }
  diagonalOuter.appendChild(diagonalSpin);
  group.appendChild(diagonalOuter);

  const coastline = stage.querySelector(".v3-coastline-outline");
  if (coastline) {
    let defs = stage.querySelector("#v3-geo-defs");
    if (!defs) {
      defs = el("defs", { id: "v3-geo-defs" });
      stage.insertBefore(defs, stage.firstChild);
    }
    let mask = defs.querySelector("#v3-sea-mask");
    if (!mask) {
      mask = el("mask", { id: "v3-sea-mask" });
      defs.appendChild(mask);
    }
    mask.textContent = "";
    mask.appendChild(el("rect", { x: canvasBounds.x, y: canvasBounds.y, width: canvasBounds.width, height: canvasBounds.height, fill: "white" }));
    mask.appendChild(el("path", { d: coastline.getAttribute("d"), "fill-rule": "evenodd", fill: "black" }));
    group.setAttribute("mask", "url(#v3-sea-mask)");
  }

  // v3.7.31 bugfix -- was a plain stage.appendChild(group), always
  // placing the grid as the LAST (topmost) stage child. Fine on a fresh
  // render() (the compass is rendered after the grid there, so it
  // naturally ends up on top regardless) but wrong on any later
  // retraceIslands() call -- ANY dev-panel slider in Visuals triggers
  // one, and retraceIslands() redraws the grid but never re-renders the
  // compass, so appendChild kept re-promoting the grid back to the very
  // end, silently pushing it ABOVE the (untouched, still-earlier-in-DOM)
  // compass the moment any slider moved. Direct feedback: "diagonals
  // beneath the compass not above." Inserting before .v3-compass (when
  // it exists) instead pins the grid to a stable position just under the
  // compass regardless of which function last redrew which.
  const compassGroup = stage.querySelector(".v3-compass");
  if (compassGroup) stage.insertBefore(group, compassGroup);
  else stage.appendChild(group);
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
  const { cellSize, threshold, seaBandThresholds, sandThresholds, vegThresholds, peakThresholds, waveDistances, showWaveRings, flatColourMode, warpStrength } = v3Config.island;

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

  // v3.7.9 -- the coast-hugging colour fade the original scheme note
  // asked for ("coast to inward inland band in transparent deep green
  // fading to nothing... similar to the sea shadow but inwards") never
  // actually appeared: flatColourMode (below) and the noise-threshold
  // seaBandThresholds/sandThresholds/vegThresholds bands were a strict
  // EITHER/OR, so flat mode (the default) always skipped every band. Per
  // direct instruction ("Both bands, inward and outward, follow
  // coastline offset not topology") these two are a separate pair, tight
  // fixed-pixel-distance offsets off the true coastline (buildInlandDistanceField/
  // buildCoastlineDistanceField, same exact mechanism as the wave rings
  // above, NOT the noise-threshold bands), drawn regardless of
  // flatColourMode -- an overlay on top of whichever base fill mode is
  // active, not an alternative to it. Empty distance lists (the default
  // if a theme doesn't set them) prune to nothing via placeBand(), same
  // as every other optional layer here.
  const { showCoastalBands, coastOutwardBandDistances, showSeaShadow, seaRadialShadowDistances, seaShadowStyle, seaShadowAngleDeg } = v3Config.island;
  const traceOutward = D => traceContourFromHeightmap(distanceField, cols, rows, cellSize, paddedBounds, -D);
  anchor = placeBand(anchor, "v3-coast-outward-band", showCoastalBands ? (coastOutwardBandDistances || []) : [], traceOutward);

  // v3.7.10 -- ALL-AROUND cast shadow, direct feedback after seeing the
  // directional version live: "makes the islands look like straight
  // cliffs rising from the sea" -- translating a copy of a shape leaves a
  // hard straight trailing edge wherever the coastline doesn't happen to
  // curve, which reads as a cliff face, not a shadow. This is just
  // another coastline-offset band (same traceOutward/distanceField as
  // coast-outward-band just above -- true fixed-pixel offset in every
  // direction, so it always follows the actual coastline shape, never a
  // straight edge), painted black instead of --v3-sea-shallow. The
  // default for every theme except Topology (seaShadowStyle, per-theme via
  // THEME_PRESETS -- see cabinet-v3-controls.js) -- the directional block
  // right below is Topology's own alternative, not a replacement for this
  // one everywhere.
  anchor = placeBand(anchor, "v3-sea-shadow-radial", (showSeaShadow && seaShadowStyle !== "directional") ? (seaRadialShadowDistances || []) : [], traceOutward);

  // v3.7.9 -- directional cast shadow ("light coming from the NE"), OFF
  // by default since it was shelved: "looks beautiful... makes the
  // islands look like straight cliffs... we'll use it elsewhere." v3.7.24
  // is that "elsewhere" -- Topology theme, direct request ("bring back
  // the directional shadow"). But translating N copies of the SAME shape
  // (coastD) is exactly what produced the cliff-face complaint in the
  // first place, and a follow-up complaint on this first pass ("too
  // uniform... stack all the topological layers... so the shadow is
  // tapering not a parallel block") asked for something better: instead
  // of one shape repeated outward, translate a few copies of EACH of the
  // terrain's real nested contour levels in turn -- coastline, both sand
  // thresholds, both vegetation thresholds (outermost/largest to
  // innermost/smallest, same ordering buildIslandHeightmap's threshold <
  // sandThresholds < vegThresholds already gives every other band here).
  // Each level is already a smaller, more inland shape than the one
  // before it -- stacking them at increasing distance shrinks the
  // shadow's own silhouette as it recedes, a real taper from the
  // GEOMETRY, not just fading opacity over one fixed outline. Angle
  // convention matches drawGeoGrid()'s diagonals: 0=E, 90=S, 180=W,
  // 270=N, clockwise, since SVG y grows downward -- 135 = SW, i.e. light
  // from the NE, the same angle the original shelved version used.
  // Grouped into one <g> (v3-sea-shadow-taper) so a single blur feathers
  // the boundary between one level's copies and the next, rather than
  // leaving each level's edge a crisp visible step -- direct feedback,
  // "the edges need to be blurred enough that it doesnt look like a
  // series of steps." Placed UNDER the land fill (next) so the portion
  // directly beneath the island stays hidden and only the spill past the
  // coastline into open water shows, like a real cast shadow.
  // copiesPerLevel/levelStep/copyStep are first-guess values, meant to be
  // eyeballed live and retuned directly here -- "lets try and finetune."
  //
  // v3.7.24 bugfix -- a plain CSS `filter: blur()` class rule on the <g>
  // (cabinet-v3-style.css) rendered the group fully INVISIBLE once it sat
  // among this map's real content, even though the exact same class+blur
  // rendered fine in isolation against a blank page. Confirmed via a
  // throwaway script rather than guessing: same opacity, same copies,
  // `filter: none` -> visible; `filter: blur(4px)` -> nothing. CSS
  // filters on SVG elements get their region from an auto-computed
  // object-bounding-box, and that computation is evidently unreliable
  // here (many overlapping children, each with its OWN translate
  // transform) -- Chromium was very likely clipping the filter's output
  // to a region that doesn't actually cover the translated content. An
  // explicit SVG <filter> with `filterUnits="userSpaceOnUse"` and a
  // region set from paddedBounds (already computed above, generous
  // enough to hold every copy's translation) sidesteps that auto-
  // computation entirely -- applied via the `filter` PRESENTATION
  // ATTRIBUTE on the group, not a CSS class, so there's no bounding-box
  // guesswork left for the browser to get wrong.
  if (showSeaShadow && seaShadowStyle === "directional") {
    let defs = stage.querySelector("#v3-geo-defs");
    if (!defs) {
      defs = el("defs", { id: "v3-geo-defs" });
      stage.insertBefore(defs, stage.firstChild);
    }
    let blurFilter = defs.querySelector("#v3-sea-shadow-taper-blur");
    if (!blurFilter) {
      blurFilter = el("filter", { id: "v3-sea-shadow-taper-blur", filterUnits: "userSpaceOnUse" });
      // v3.7.27 -- 4 -> 1.5: direct feedback once the reach was lengthened
      // (v3.7.25), "less blurred, I'd like to see some hint of the
      // topology heights through the shadow contour" -- at the old 4px
      // blur the 5 nested terrain levels fully smeared into one solid
      // gradient; a lighter blur still feathers the copy-to-copy steps
      // (the original complaint this filter exists to fix) without
      // erasing the shape of the terrain casting the shadow.
      blurFilter.appendChild(el("feGaussianBlur", { stdDeviation: 1.5 }));
      defs.appendChild(blurFilter);
    }
    blurFilter.setAttribute("x", paddedBounds.x);
    blurFilter.setAttribute("y", paddedBounds.y);
    blurFilter.setAttribute("width", paddedBounds.width);
    blurFilter.setAttribute("height", paddedBounds.height);

    // v3.7.30 -- direct feedback: "I'd like the tall bits to cast longer
    // shadows... a multiplying or exponential number of stacks be better
    // than each outline gets a fixed number of stack layers?" The OLD
    // formula (dist = 3 + li*levelStep + c*copyStep, v3.7.25) was purely
    // arithmetic in LAYER INDEX, not height: every level got the same
    // fixed-size bundle of copies, just shifted further out by a constant
    // per level -- "tall" (veg/peak) and "short" (sand) terrain cast
    // equally LONG shadows, only offset differently, which is the
    // opposite of what a real cast shadow does.
    // Neither option offered is quite right, though: real shadow length
    // scales roughly LINEARLY with height (length = height / tan(sun
    // angle), for one fixed sun angle) -- exponential would turn a
    // modest height difference between e.g. sand and veg into a wildly
    // exaggerated shadow-length difference, not a plausible one. So:
    // linear, but in actual HEIGHT ABOVE THE COASTLINE (level -
    // threshold, floored at 0 for any level at-or-below coastline height
    // -- sandThresholds[0] currently sits slightly BELOW threshold after
    // the latest retune, see that array's own v3.7.29 comment in
    // cabinet-v3-data.js), not in ordinal layer position. Also now
    // includes peakThresholds ("Land 5," v3.7.28) in the taper sequence
    // -- it was missing before, the one genuinely "tall" level this
    // request is really about.
    const taperLevels = [threshold, ...(sandThresholds || []), ...(vegThresholds || []), ...(peakThresholds || [])];
    const heights = taperLevels.map(level => Math.max(0, level - threshold));
    const maxHeight = Math.max(1e-6, ...heights);
    const rad = (seaShadowAngleDeg * Math.PI) / 180;
    const sdx = Math.cos(rad);
    const sdy = Math.sin(rad);
    const copiesPerLevel = 4;
    // baseReach/maxReach: shortest (coastline, height 0) vs longest (the
    // tallest level present) total shadow reach -- maxReach matches the
    // old fixed ~46px reach (v3.7.25) so the TALLEST terrain casts
    // roughly what everything cast uniformly before; shorter terrain now
    // casts less, not the same.
    const baseReach = 8;
    const maxReach = 46;
    // Small per-level start stagger (NOT the main driver of reach any
    // more, just keeps every level's bundle from launching off the exact
    // same point) -- the linear height interpolation above is what
    // actually varies each level's shadow length.
    const levelStagger = 1.5;
    let group = stage.querySelector(".v3-sea-shadow-taper");
    if (!group) group = el("g", { class: "v3-sea-shadow-taper", filter: "url(#v3-sea-shadow-taper-blur)" });
    stage.insertBefore(group, anchor ? anchor.nextSibling : stage.firstChild);
    while (group.firstChild) group.removeChild(group.firstChild);
    taperLevels.forEach((level, li) => {
      const d = trace(level);
      const reach = baseReach + (heights[li] / maxHeight) * (maxReach - baseReach);
      const start = 3 + li * levelStagger;
      const step = Math.max(0.5, (reach - start) / (copiesPerLevel - 1));
      for (let c = 0; c < copiesPerLevel; c++) {
        const dist = start + c * step;
        group.appendChild(el("path", {
          class: "v3-sea-shadow-taper-copy",
          "fill-rule": "evenodd",
          d,
          transform: `translate(${(sdx * dist).toFixed(2)},${(sdy * dist).toFixed(2)})`
        }));
      }
    });
    anchor = group;
  } else {
    const stale = stage.querySelector(".v3-sea-shadow-taper");
    if (stale) stale.remove();
  }

  if (flatColourMode) {
    // Empty-list placeBand() calls prune any .v3-sand-band-N/.v3-veg-band-N/
    // .v3-peak-band-N left over from a previous non-flat retrace; none of
    // these calls advance anchor (nothing to place), so it's safe to just
    // discard the return.
    placeBand(anchor, "v3-sand-band", [], trace);
    placeBand(anchor, "v3-veg-band", [], trace);
    placeBand(anchor, "v3-peak-band", [], trace);
    anchor = placeOne(anchor, "v3-islands-land-flat", coastD);
  } else {
    // No placeBand() equivalent for a single non-array element -- remove
    // the stale flat-land path directly if a previous flat-mode retrace
    // left one behind.
    const staleFlat = stage.querySelector(".v3-islands-land-flat");
    if (staleFlat) staleFlat.remove();
    anchor = placeBand(anchor, "v3-sand-band", sandThresholds, trace);
    anchor = placeBand(anchor, "v3-veg-band", vegThresholds, trace);
    // v3.7.28 -- "Land 5," topmost/innermost land layer, drawn last (on
    // top of veg) same as every nested band here -- see peakThresholds'
    // own comment in cabinet-v3-data.js.
    anchor = placeBand(anchor, "v3-peak-band", peakThresholds, trace);
  }

  // v3.7.16 -- the inland half of the coast-hugging fade pair used to be
  // drawn right here, ONE colour for the whole combined landmass. Moved
  // out to its own function, drawCoastalInwardBands() below, called
  // separately from render()/retraceIslands() -- direct request: "for
  // each section, generate a colour hue, and use THAT colour hue for
  // it's coastal inward band, not the same colour over all sections."
  // This function traces one shared heightmap for every circle from
  // every section combined (see the v3.5 comment on drawIslandsPath's own
  // call site in render()), so there's no per-section boundary inside the
  // geometry it builds -- per-section colouring has to clip afterward
  // against each section's own region rect, which needs the `layout`
  // array (sectionMeta + region) that only render()/retraceIslands() have
  // in scope, not this function.
  placeOne(anchor, "v3-coastline-outline", coastD);

  // v3.6.16 -- returned so drawFlowFieldDebug() can reuse this exact
  // heightmap (the coast vector rides on its gradient, see
  // cabinet-v3-flowfield.js) instead of building a second one.
  return { H, cols, rows, paddedBounds };
}

// v3.7.51 (#21 corrected) -- a full-canvas, ONE-heightmap Topology
// structural pass, built the same way drawIslandsPath() above builds
// Medieval's -- across every island TOGETHER, not one at a time.
//
// v3.7.50's approach (globally revealing the per-island/per-section
// theme-preview mechanism) was wrong for this: that mechanism builds
// each island's Topology preview in ISOLATION
// (buildIsolatedHeightmap([c], ...), one island's own circle data
// only), with a generous halo margin meant to blend into open water
// around exactly ONE hovered island. Direct report after actually
// seeing it live: "neightbourig islands, esp non-entry ones, and the
// sectional boundaries, are being occluded. Dont render individual
// islands. Maybe have a full topology also built alongside the per
// island and per section builds." Non-entry (filler) circles never get
// a preview built for them at all (only c.kind === "entry" does, see
// drawRegion() above), and revealing every ENTRY island's isolated wash
// simultaneously meant each one's halo could bleed across a nearby
// filler or a section's dashed boundary line that was never part of
// that isolated computation in the first place.
//
// This function sidesteps that entirely by reusing islandTrace's
// ALREADY-BUILT shared heightmap (same H/cols/rows/paddedBounds every
// island's real coastline traces from) -- correct by construction for
// fillers and cross-section boundaries, exactly like the real map
// already is, because it IS the real map's own geometry, just
// re-traced at Topology's band levels instead of Medieval's.
//
// Scope is deliberately narrower than a full second drawIslandsPath()
// pass: THEME_PRESETS' satellite entry only actually needs two things
// Medieval's own build never produces (flatColourMode: true skips
// bands entirely; seaShadowStyle: "radial" never takes the directional
// branch) -- real sand/veg/peak (and sea-depth) bands, and the
// directional shadow taper. Wave rings and coastal bands both stay OFF
// for Topology either way (showWaveRings/showCoastalBands: false), so
// there's nothing to build for those -- v3.7.50's CSS already hides
// Medieval's own baked copies of those three plus the radial shadow;
// this only adds the two pieces still missing after that.
//
// Class names deliberately REUSE the real (non-preview) band/shadow
// classes (.v3-sea-band-N, .v3-sand-band-N, etc, .v3-sea-shadow-taper) --
// Medieval's own build never creates any of these (flatColourMode/
// seaShadowStyle rule them all out), so there's no collision, and it
// means zero new CSS colour rules are needed: they already read
// correctly off the same theme-reactive --v3-sand/--v3-veg/--v3-peak
// tokens the rest of the map uses, no fixed --v3-preview-* stand-ins
// required this time.
function drawTopologyStructuralLayer(stage, islandTrace) {
  const { H, cols, rows, paddedBounds } = islandTrace;
  const {
    cellSize, threshold, seaBandThresholds, sandThresholds, vegThresholds, peakThresholds,
    showSeaShadow, seaShadowAngleDeg
  } = v3Config.island;
  const trace = level => traceContourFromHeightmap(H, cols, rows, cellSize, paddedBounds, level);

  const coastlineEl = stage.querySelector(".v3-coastline-outline");
  if (!coastlineEl) return;

  const existing = stage.querySelector(".v3-topo-structural");
  if (existing) existing.remove();
  const group = el("g", { class: "v3-topo-structural" });
  stage.insertBefore(group, coastlineEl);

  seaBandThresholds.forEach((level, i) => {
    group.appendChild(el("path", { d: trace(level), class: `v3-sea-band v3-sea-band-${i + 1}`, "fill-rule": "evenodd" }));
  });

  // Same taper-shadow construction as drawIslandsPath()'s own directional
  // branch above (v3.7.24-v3.7.30's tuning) -- kept in sync by hand since
  // duplicating it was simpler than threading a class-prefix/output-
  // target parameter through that already-long function for a shadow
  // style Medieval's own build never takes.
  if (showSeaShadow) {
    let defs = stage.querySelector("#v3-geo-defs");
    if (!defs) {
      defs = el("defs", { id: "v3-geo-defs" });
      stage.insertBefore(defs, stage.firstChild);
    }
    let blurFilter = defs.querySelector("#v3-sea-shadow-taper-blur");
    if (!blurFilter) {
      blurFilter = el("filter", { id: "v3-sea-shadow-taper-blur", filterUnits: "userSpaceOnUse" });
      blurFilter.appendChild(el("feGaussianBlur", { stdDeviation: 1.5 }));
      defs.appendChild(blurFilter);
    }
    blurFilter.setAttribute("x", paddedBounds.x);
    blurFilter.setAttribute("y", paddedBounds.y);
    blurFilter.setAttribute("width", paddedBounds.width);
    blurFilter.setAttribute("height", paddedBounds.height);

    const taperLevels = [threshold, ...(sandThresholds || []), ...(vegThresholds || []), ...(peakThresholds || [])];
    const heights = taperLevels.map(level => Math.max(0, level - threshold));
    const maxHeight = Math.max(1e-6, ...heights);
    const rad = (seaShadowAngleDeg * Math.PI) / 180;
    const sdx = Math.cos(rad);
    const sdy = Math.sin(rad);
    const copiesPerLevel = 4;
    const baseReach = 8;
    const maxReach = 46;
    const levelStagger = 1.5;
    const taperGroup = el("g", { class: "v3-sea-shadow-taper", filter: "url(#v3-sea-shadow-taper-blur)" });
    taperLevels.forEach((level, li) => {
      const d = trace(level);
      const reach = baseReach + (heights[li] / maxHeight) * (maxReach - baseReach);
      const start = 3 + li * levelStagger;
      const step = Math.max(0.5, (reach - start) / (copiesPerLevel - 1));
      for (let c = 0; c < copiesPerLevel; c++) {
        const dist = start + c * step;
        taperGroup.appendChild(el("path", {
          class: "v3-sea-shadow-taper-copy",
          "fill-rule": "evenodd",
          d,
          transform: `translate(${(sdx * dist).toFixed(2)},${(sdy * dist).toFixed(2)})`
        }));
      }
    });
    group.appendChild(taperGroup);
  }

  sandThresholds.forEach((level, i) => {
    group.appendChild(el("path", { d: trace(level), class: `v3-sand-band v3-sand-band-${i + 1}`, "fill-rule": "evenodd" }));
  });
  vegThresholds.forEach((level, i) => {
    group.appendChild(el("path", { d: trace(level), class: `v3-veg-band v3-veg-band-${i + 1}`, "fill-rule": "evenodd" }));
  });
  peakThresholds.forEach((level, i) => {
    group.appendChild(el("path", { d: trace(level), class: `v3-peak-band v3-peak-band-${i + 1}`, "fill-rule": "evenodd" }));
  });
}

// v3.7.16 -- deterministic string hash -> a hue angle, used below so each
// section gets its own stable coastal-band colour without hand-authoring
// one per section. Keyed off sectionMeta.id (not array index) so a
// section's colour survives content reordering/insertion -- the same
// section always lands on the same hue across reloads. No claim of even
// distribution around the wheel (a golden-angle sequence would guarantee
// that, but needs a stable INDEX, which id-based stability rules out) --
// good enough for "visually distinct per section," not colour-managed.
function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

// v3.7.16 -- the inland coastal-fade band, split out from drawIslandsPath()
// so each SECTION can get its own colour: direct request, "for each
// section, generate a colour hue, and use THAT colour hue for it's
// coastal inward band, not the same colour over all sections." Reuses
// islandTrace's already-built heightmap (no second buildIslandHeightmap()
// call) and coastD read straight off the already-rendered
// .v3-coastline-outline element rather than re-tracing it a third time
// this function -- same reasoning as placeBand()'s own reuse-over-rebuild
// pattern elsewhere in this file.
//
// The ring geometry (coastline plus a D-px-inward hole, evenodd) is
// computed ONCE per distance level and reused as-is for every section --
// only the clip and fill colour differ per section. Full remove-and-
// rebuild every call (like drawGeoGrid()) rather than incremental
// diffing -- this isn't on a per-frame path, only slider ticks and
// section-count changes, so the simpler idempotent pattern is worth more
// than the (currently nonexistent) perf cost of a diff.
//
// v3.7.17 bugfix -- clipping to region.inner (a fixed rect) cropped the
// band wherever an island grew past its own section's nominal rect.
// Direct feedback: "the colour band is tied to the section and its
// islands, so if an island is partly outside the section, the colour
// band still needs to be applied - currently it is cropped off." Growth
// is explicitly NOT rect-bounded (see render()'s own "single global
// growth pass... no per-region hard walls" comment) so a rect clip was
// always going to cut off real cases, not just an edge case. Clips to
// traceIsolatedShape() instead -- the same "this section's own circles,
// traced alone" technique renderRegion() already uses for its hover
// hit-shape, which follows the ACTUAL island silhouette wherever it grew,
// not an approximation of it. +4px dilation: the isolated trace runs over
// a different (smaller, locally-bounded) sampling grid than the combined
// full-canvas one coastD came from, so its marching-squares crossings can
// land a sub-pixel to a couple of px off from the exact same curve traced
// globally -- enough, unpadded, to risk shaving a hairline off the band's
// brightest edge (right at the true coast) on a coordinate rounding
// technicality. A few px of slack costs nothing (neighbouring sections'
// bands don't reach here) and guarantees the true coastline stays fully
// inside the clip.
function drawCoastalInwardBands(stage, layout, islandTrace, grown) {
  // v3.7.39 -- .v3-coast-inward-band-group added to this cleanup query
  // too, now that bands live inside it rather than as direct stage
  // children -- otherwise a retrace leaves the OLD (now-empty) group
  // behind while inserting a fresh one, accumulating stale empty groups
  // every tick.
  stage.querySelectorAll(".v3-coast-inward-band-group, .v3-coast-inward-band, .v3-coast-inward-band-defs").forEach(node => node.remove());

  const { showCoastalBands, coastInwardBandDistances, cellSize, threshold } = v3Config.island;
  if (!showCoastalBands || !coastInwardBandDistances || !coastInwardBandDistances.length) return;

  const coastlineEl = stage.querySelector(".v3-coastline-outline");
  if (!coastlineEl) return;
  const coastD = coastlineEl.getAttribute("d");

  const { H, cols, rows, paddedBounds } = islandTrace;
  const inlandField = buildInlandDistanceField(H, cols, rows, cellSize, threshold);
  const ringData = coastInwardBandDistances.map(
    D => `${coastD} ${traceContourFromHeightmap(inlandField, cols, rows, cellSize, paddedBounds, D)}`
  );

  const grownBySection = new Map();
  grown.forEach(c => {
    if (!grownBySection.has(c.sectionId)) grownBySection.set(c.sectionId, []);
    grownBySection.get(c.sectionId).push(c);
  });

  const defs = el("defs", { class: "v3-coast-inward-band-defs" });
  stage.insertBefore(defs, coastlineEl);

  // v3.7.39 bugfix -- every band path already carries its OWN per-section
  // clip-path ATTRIBUTE below (essential: ringData's `d` spans every
  // section's geometry combined, see this function's own doc comment, so
  // this is the only thing confining one section's band to that section).
  // The medieval-effects hover clip (v3.7.36) was wrongly applied via a
  // CSS class rule targeting .v3-coast-inward-band directly -- one
  // element can only resolve ONE `clip-path` value, so the stylesheet
  // rule (higher cascade priority than a presentation attribute) SILENTLY
  // REPLACED each band's section-confinement clip instead of adding to
  // it, un-confining every section's band across the whole map. Direct
  // report caught it: hovering one island showed a DIFFERENT section's
  // inward-band content bleeding through. Fixed by wrapping every band in
  // a shared group and moving the hover clip there instead -- SVG applies
  // an ancestor's clip-path and an element's own clip-path attribute
  // together (intersected), so both confinements now hold at once.
  const hoverClipGroup = el("g", { class: "v3-coast-inward-band-group" });
  stage.insertBefore(hoverClipGroup, coastlineEl);

  layout.forEach(({ sectionMeta }) => {
    const circles = grownBySection.get(sectionMeta.id) || [];
    if (!circles.length) return;
    const clipShapeD = traceIsolatedShape(circles, v3Config.island, 4);
    if (!clipShapeD) return;

    const hue = hashHue(sectionMeta.id);
    const clipId = `v3-coast-band-clip-${sectionMeta.id}`;
    const clipPath = el("clipPath", { id: clipId });
    clipPath.appendChild(el("path", { d: clipShapeD, "fill-rule": "evenodd" }));
    defs.appendChild(clipPath);

    ringData.forEach((d, i) => {
      const node = el("path", {
        class: `v3-coast-inward-band v3-coast-inward-band-${i + 1}`,
        "fill-rule": "evenodd",
        d,
        "clip-path": `url(#${clipId})`
      });
      // Inline, not a CSS custom property: this colour is generated per
      // section, not themeable/hand-authored, so there's no shared token
      // for a stylesheet rule to reference -- same S/L across every
      // section, only the hue varies.
      // v3.7.17 -- 42%/22% -> 58%/32%, direct request ("make the colours
      // slightly brighter/more intense").
      node.style.fill = `hsl(${hue}, 58%, 32%)`;
      hoverClipGroup.appendChild(node);
    });
  });
}

// v3.6.16 -- dev-only debug view of the flow field: showPotential tints
// a grid by the base current's scalar potential ("the noise field"),
// showVectors draws the full composite field as arrows ("vector
// directions"). Takes an ALREADY-BUILT grid rather than building its own
// -- see buildCurrentFlowField() below (particles use a separate
// analytic sampler instead, buildCurrentSampler() -- the two aren't
// shared, since the grid only needs rebuilding when the debug view
// actually redraws, not once per particle per frame). v3.6.20 -- that
// grid is no longer frozen at t=0 forever: animationFrame() rebuilds it
// periodically at the live elapsed time (throttled -- see its own
// comment) so this view stays correlated with what particles are
// actually doing once the field itself is time-varying. Both toggles
// off by default -- cheap no-op (just removes any stale debug layer)
// when neither is on, same pattern flatColourMode's own toggle bugfix
// established: a full innerHTML clear + rebuild on every call, never a
// stale leftover from a previous branch.
function drawFlowFieldDebug(stage, canvasBounds, field) {
  const { showPotential, showVectors } = v3Config.flow;
  let group = stage.querySelector(".v3-flow-debug");

  if (!showPotential && !showVectors) {
    if (group) group.remove();
    return;
  }

  if (!group) {
    group = el("g", { class: "v3-flow-debug", "aria-hidden": "true" });
  } else {
    group.innerHTML = "";
  }
  stage.appendChild(group);

  if (showPotential) {
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < field.potentialGrid.length; i++) {
      const v = field.potentialGrid[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(1e-6, max - min);
    for (let gy = 0; gy < field.rows; gy++) {
      for (let gx = 0; gx < field.cols; gx++) {
        const t = (field.potentialGrid[gy * field.cols + gx] - min) / range;
        group.appendChild(
          el("rect", {
            class: "v3-flow-potential-cell",
            x: canvasBounds.x + gx * field.cellSize,
            y: canvasBounds.y + gy * field.cellSize,
            width: field.cellSize,
            height: field.cellSize,
            style: `fill-opacity:${(0.12 + t * 0.4).toFixed(2)}`
          })
        );
      }
    }
  }

  if (showVectors) {
    // Raw field magnitude spans a huge range (near-flat open water vs.
    // right at a coastline -- see coastStrength's field notes in
    // cabinet-v3-data.js), so arrows are length-capped rather than drawn
    // at literal scale: arrowScale makes open-water arrows visible at
    // all, maxLen keeps near-coast ones from overrunning neighbouring
    // grid cells. Both first-guess render constants, not part of
    // v3Config.flow itself -- this is a debug view, not the field.
    // (arrowScale lowered at v3.6.18 alongside currentGain -- raw
    // magnitudes roughly doubled, so the old value made most arrows hit
    // maxLen immediately, losing the open-water-vs-coast length contrast
    // this view exists to show.)
    const arrowScale = 250;
    const maxLen = field.cellSize * 0.85;
    for (let gy = 0; gy < field.rows; gy++) {
      for (let gx = 0; gx < field.cols; gx++) {
        const i = gy * field.cols + gx;
        const x = canvasBounds.x + gx * field.cellSize;
        const y = canvasBounds.y + gy * field.cellSize;
        let dx = field.vx[i] * arrowScale;
        let dy = field.vy[i] * arrowScale;
        const len = Math.hypot(dx, dy);
        if (len > maxLen) {
          dx = (dx / len) * maxLen;
          dy = (dy / len) * maxLen;
        }
        group.appendChild(
          el("line", { class: "v3-flow-vector", x1: x, y1: y, x2: x + dx, y2: y + dy })
        );
      }
    }
  }
}

// v3.7.28 -- dev-only visualisation of buildIslandHeightmap()'s H field
// (the raw noise-minus-falloff terrain driving every contour drawn here
// -- coastline, wave rings, sea/sand/veg/peak bands, all of it), toggled
// via v3Config.island.showNoise. Same "tint a grid by the field value"
// treatment as drawFlowFieldDebug()'s Flow potential view just above,
// just over the island terrain field instead of the current's. Direct
// request: "just like the flow potential, vectors, being made visible as
// a diagnostic, can the underlying noise that make the islands and topo
// be made visible on toggle."
//
// H is sampled at island.cellSize (3px by default) over the PADDED
// bounds -- one <rect> per cell at that native resolution would be tens
// of thousands of SVG nodes for a dev toggle nobody needs pixel-exact
// from. Strides through the SAME already-built H array at
// NOISE_DEBUG_CELL_PX-sized steps instead (same coarse-grid idea Flow
// potential already uses at its own field.cellSize, 24px) rather than
// resampling anything -- H doesn't need rebuilding, just reading
// sparsely.
// v3.7.44 -- 24 -> 12: direct request, "Island noise heightmap needs to
// be finer than what it is currently... doesnt cost the user anything,
// only at the tool level to me, so atleast double the resolution from
// current." Dev-only debug overlay (never shipped in index.html/the
// production build), so the extra SVG node count this trades against
// (4x, both axes finer) is a real cost only to this tool's own render
// time, never to an actual site visitor.
const NOISE_DEBUG_CELL_PX = 12;
function drawIslandNoiseDebug(stage, paddedBounds, H, cols, rows, cellSize) {
  let group = stage.querySelector(".v3-noise-debug");

  if (!v3Config.island.showNoise) {
    if (group) group.remove();
    return;
  }

  if (!group) {
    group = el("g", { class: "v3-noise-debug", "aria-hidden": "true" });
  } else {
    group.innerHTML = "";
  }
  stage.appendChild(group);

  let min = Infinity, max = -Infinity;
  for (let i = 0; i < H.length; i++) {
    const v = H[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(1e-6, max - min);
  const stride = Math.max(1, Math.round(NOISE_DEBUG_CELL_PX / cellSize));

  for (let gy = 0; gy < rows; gy += stride) {
    for (let gx = 0; gx < cols; gx += stride) {
      const t = (H[gy * cols + gx] - min) / range;
      group.appendChild(
        el("rect", {
          class: "v3-noise-debug-cell",
          x: paddedBounds.x + gx * cellSize,
          y: paddedBounds.y + gy * cellSize,
          width: stride * cellSize,
          height: stride * cellSize,
          style: `fill-opacity:${(0.12 + t * 0.55).toFixed(2)}`
        })
      );
    }
  }
}

// v3.6.17 -- particle animation state. Deliberately NOT part of
// islandLayoutState -- that cache exists for cheap slider retraces, this
// exists for the separate concern of a running requestAnimationFrame
// loop, and only islands-tool.html (via cabinet-v3-controls.js's
// startCurrentAnimation() call) ever sets particlesActive true. Static
// pages (index.html, build-render.html) never touch this, so they pay
// nothing for it.
let particlesActive = false;
let particleState = null; // { particles, canvasBounds, padding, sampler, els }
// v3.6.24 -- same lifecycle as particleState, kept separate since
// dragons are independent entities with their own movement, not part of
// the particle pool (see cabinet-v3-dragon.js's own module comment for
// why). `dragons` is 1-3 small { d, group, slide } entries -- see
// ensureDragon() and buildDragonElement() for what `slide` is.
let dragonState = null; // { dragons: [{ d, group, slide }], canvasBounds, sampler }
let lastFrameTime = null;
// v3.6.18 -- elapsed-seconds epoch for the current's time-drift (see
// createFlowSampler()'s doc comment in cabinet-v3-flowfield.js). Set
// ONCE, the first animation frame -- deliberately NOT reset when a
// retrace rebuilds the sampler (a slider tick shouldn't undo however far
// the current has already drifted), only ever advances forward.
let animStartTime = null;
// v3.6.20 -- dark, saturated palette for particle colour (direct
// request: darker than the previous single light sand tone). Rolled
// once per particle slot in ensureParticles(), same as size/ribs below
// -- ink/pigment tones, not the site's own light --cab-* palette, since
// these read as small distinct specks against open water rather than
// blending into the coastline/label colours.
const PARTICLE_COLORS = ["#3b2416", "#1c1a17", "#4a2f5e", "#1f2b4a"]; // dark brown, black, violet, navy

// v3.6.28 -- medieRiso theme (cabinet-v3-style.css): "boat interior
// colours are riso, outlines are dark" -- PARTICLE_COLORS above is
// already dark (brown/black/violet/navy), so only the FILL needs a
// theme-conditional override; the stroke/outline logic below is
// untouched. Riso blue/teal/orange -- distinct from the yellow/pink the
// theme's wave-ring and hover-halo accents already claim (see that CSS
// block's own comment), so boats read as their own accent family rather
// than competing with ambient contour or interaction colours. Read live
// (not cached) since the theme can change at any point via the dev
// panel's Theme select without a particle-pool rebuild.
const MEDIE_RISO_BOAT_FILLS = ["#0078bf", "#46bdb1", "#ff6b35"];
function isMedieRisoTheme() {
  return document.body.dataset.theme === "medieRiso";
}

// v3.6.20 -- elapsed-seconds mark of the last debug-grid rebuild (see
// animationFrame()'s throttled refresh below); null means "never yet."
let lastDebugFieldTime = null;

// (Re)builds the particle pool and its backing SVG <ellipse> elements
// from scratch -- called on a full render() (fresh layout, e.g. Reroll)
// while particlesActive, never on a cheap retrace (see
// updateParticleSampler() below, which keeps existing particles'
// in-flight positions instead of resetting them just because a slider
// moved).
function ensureParticles(stage, canvasBounds, sampler, t) {
  const { count, padding } = v3Config.particles;
  const particles = createParticlePool(count, canvasBounds, padding, sampler.vectorAt, sampler.isLand, sampler.repulsionAt, t, Math.random, v3Config.particles);

  let group = stage.querySelector(".v3-particles");
  if (!group) group = el("g", { class: "v3-particles", "aria-hidden": "true" });
  else group.innerHTML = "";
  stage.appendChild(group);

  const els = particles.map(() => {
    const pg = buildParticleElement();
    group.appendChild(pg);
    return pg;
  });

  particleState = { particles, canvasBounds, padding, sampler, els, group };
}

// v3.6.21 -- factored out of ensureParticles() so launchBoatAt() (the
// click-to-launch feature) can build an identical-looking element for a
// particle added at runtime, not just the initial pool.
//
// v3.6.20 -- scale (and the rib lines below) rolled once per element
// here (not in cabinet-v3-particles.js, and not re-rolled on respawn --
// size/decoration is a DOM/drawing concern, position/recycling isn't),
// so each particle keeps a consistent look for its on-screen lifetime
// even as it recycles to a fresh spawn point. Ellipse + ribs sit in
// LOCAL coordinates (centred on 0,0) inside their own <g>, so
// tickParticles() only ever has to set ONE transform (translate+rotate)
// per particle per frame, not reposition each child separately.
function buildParticleElement() {
  const { sizeMin, sizeMax } = v3Config.particles;
  const scale = sizeMin + Math.random() * (sizeMax - sizeMin);
  const rx = 3.2 * scale, ry = 1.3 * scale;
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  // v3.6.28 -- inline fill only under medieRiso; every other theme keeps
  // reading .v3-particle's own CSS fill (--cab-land-light) by leaving
  // this unset, same "inline wins the cascade" mechanism the stroke
  // above already relies on.
  const fillStyle = isMedieRisoTheme()
    ? `fill:${MEDIE_RISO_BOAT_FILLS[Math.floor(Math.random() * MEDIE_RISO_BOAT_FILLS.length)]};`
    : "";

  const pg = el("g", { class: "v3-particle-group" });
  const ellipse = el("ellipse", {
    class: "v3-particle", cx: 0, cy: 0, rx: rx.toFixed(2), ry: ry.toFixed(2),
    style: `${fillStyle}stroke:${color}`
  });
  pg.appendChild(ellipse);

  // 2-3 ribs, parallel to the minor axis (i.e. crossing the ellipse's
  // width), at randomised offsets along the major axis -- spaced apart
  // (min 0.28 of rx between any two) so they don't overlap into one
  // smudge, and each trimmed to the ellipse's own local half-height at
  // that offset (x = u*rx -> half-height = ry*sqrt(1-u^2)) so a rib near
  // either tip is short, one through the middle is nearly the full ry --
  // reads as following the ellipse's actual curve rather than a row of
  // identical ticks.
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

// v3.6.22 -- exported for cabinet-v3-controls.js's "Base count" slider
// (direct request: "I want to try out the look and feel of more and
// less particles"). v3Config.particles.count is only ever read at pool-
// BUILD time (createParticlePool()), not per-frame, so changing it alone
// does nothing to a pool that's already running -- this rebuilds it at
// the new size via ensureParticles(), the same full rebuild a Reroll
// already gives particles (fresh off-canvas spawn positions, in-flight
// positions not preserved -- there's no meaningful way to "smoothly"
// resize a running pool). No-op if particles aren't running yet.
// v3Config.particles.maxCount (the click-to-launch cap) needs no
// equivalent: launchBoatAt() reads it fresh on every click, nothing to
// rebuild.
export function refreshParticleCount() {
  if (!particleState || !islandLayoutState) return;
  const stage = document.querySelector("#v3-stage");
  ensureParticles(stage, particleState.canvasBounds, particleState.sampler, currentAnimTime());
}

// Cheap path for a retrace (slider tick): the underlying heightmap
// changed (island shape tuning), so the coast-vector half of the
// sampler needs to be fresh, but existing particles keep their
// in-flight positions -- resetting them on every slider nudge would
// look like a glitch, not a tuning aid.
function updateParticleSampler(sampler) {
  if (particleState) particleState.sampler = sampler;
}

// v3.6.21 -- particles array is no longer fixed-length: click-to-launch
// (launchBoatAt() below) can grow it up to maxCount, and while it's
// above the base count, respawn-on-exit is suspended (allowRespawn
// below) so the pool drains back toward baseCount on its own as boats
// naturally exit/get stuck, rather than staying inflated forever. Direct
// request: "as the number of particles go above 60, stop respawning
// until we're back to 60" -- deliberately applies to every particle
// while over-capacity, not just the clicked ones, since that's simpler
// and self-limiting (no separate "which ones are extra" bookkeeping).
// Iterated backwards so a mid-loop splice() never skips the next index.
function tickParticles(dt, t) {
  if (!particleState) return;
  const { particles, canvasBounds, padding, sampler, els } = particleState;
  const stepConfig = v3Config.particles;
  const baseCount = stepConfig.count;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const allowRespawn = particles.length <= baseCount;
    const remove = stepParticle(p, sampler.vectorAt, sampler.isLand, sampler.repulsionAt, t, canvasBounds, padding, dt, stepConfig, Math.random, allowRespawn);
    if (remove) {
      els[i].remove();
      particles.splice(i, 1);
      els.splice(i, 1);
      continue;
    }
    const angle = (Math.atan2(p.dirY, p.dirX) * 180) / Math.PI;
    const x = p.x.toFixed(1);
    const y = p.y.toFixed(1);
    els[i].setAttribute("transform", `translate(${x} ${y}) rotate(${angle.toFixed(1)})`);
  }
}

// v3.6.24 -- assigns each dragon's <clipPath> a unique id (SVG ids must
// be unique document-wide) -- see buildDragonElement()'s own comment.
let nextDragonClipId = 0;

// v3.6.24 -- builds one dragon's <g>: an outer group tickDragon() below
// repositions/scales every frame, wrapping an inner group that only ever
// needs building once (centres DRAGON_VIEWBOX's own coordinate space on
// local (0, 0), same "local-coordinates child, transform-only parent"
// split the particle boats already use).
//
// Inside that: a <clipPath> (a plain rect matching DRAGON_VIEWBOX's own
// bounds -- literally "its own viewing box") wraps a SEPARATE inner
// "slide" group that holds the actual path. tickDragon() only ever moves
// the slide group's own Y translate, never resizes/hides the clip rect
// itself -- sliding the artwork down past the clip rect's fixed bottom
// edge makes it progressively disappear as if sinking beneath the
// surface, revealing whatever's actually behind it (real background,
// not a painted-over mask) rather than a uniform shrink/fade. Direct
// request: "can the svg drop out of its own viewing box so it looks
// like it scrolled down or sank into the sea?"
//
// vector-effect="non-scaling-stroke" on the path keeps its stroke width
// constant in screen px regardless of the outer group's scale --
// otherwise the path's own dragon.svg-authored 0.35 stroke-width, scaled
// down to targetWidth's much smaller size, would be all but invisible.
// `fill` is passed in (not picked here) so ensureDragon() can hand out a
// shuffled, non-repeating colour per dragon rather than each one rolling
// independently. (v3.6.24 originally also drew a horizontal baseline
// along the bottom of the artwork, and shrank the whole shape to 0 scale
// to "dive" -- both removed per direct feedback.)
function buildDragonElement(fill) {
  const { strokeColor } = v3Config.dragon;
  const clipId = `v3-dragon-clip-${nextDragonClipId++}`;

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

// v3.6.28 -- medieRiso theme: "dragon fill colours are riso palette."
// Same length (3) as v3Config.dragon.fillColors so the shuffle below's
// "never repeats since count <= fillColors.length" property still
// holds. Pink/blue/orange -- distinct from the boat fill pool
// (MEDIE_RISO_BOAT_FILLS, above) so dragons don't visually blend into
// the boat traffic.
const MEDIE_RISO_DRAGON_FILLS = ["#ff48b0", "#0078bf", "#ff6b35"];

// Full (re)build -- called wherever ensureParticles() also is (a fresh
// layout invalidates the old dragons' canvasBounds same as it does
// particles'). v3.6.24 -- 1-3 dragons (never 0), fresh spawn points/
// headings/sizes every time, same as a page reload -- direct request:
// "appear randomly on page reload," "randomly pick 1-3 for number of
// dragons, has to be non zero." Colours come from a SHUFFLED copy of
// fillColors so up to 3 dragons never repeat one (there are always
// <= fillColors.length of them) -- direct request, "different colours."
// v3.6.28 -- that source array is theme-conditional (see
// MEDIE_RISO_DRAGON_FILLS above), read live rather than baked into
// v3Config.dragon itself so switching themes via the dev panel doesn't
// need its own separate wiring.
function ensureDragon(stage, canvasBounds, sampler, t) {
  const { fillColors: defaultFillColors, sizeMultMin, sizeMultMax } = v3Config.dragon;
  const fillColors = isMedieRisoTheme() ? MEDIE_RISO_DRAGON_FILLS : defaultFillColors;
  const count = 1 + Math.floor(Math.random() * 3);

  const colors = [...fillColors];
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  const dragons = Array.from({ length: count }, (_, i) => {
    const d = spawnDragon(canvasBounds, sampler.isLand, Math.random, v3Config.dragon);
    d.sizeMult = sizeMultMin + Math.random() * (sizeMultMax - sizeMultMin);
    const { outer, slide } = buildDragonElement(colors[i % colors.length]);
    applyDragonTransform(d, outer, slide);
    stage.appendChild(outer);
    return { d, group: outer, slide };
  });

  dragonState = { dragons, canvasBounds, sampler };
}

// Cheap path for a retrace -- mirrors updateParticleSampler() below:
// keeps every dragon's current position/heading, just refreshes which
// sampler.isLand() they check against (the heightmap changed).
function updateDragonSampler(sampler) {
  if (dragonState) dragonState.sampler = sampler;
}

// v3.6.24 -- NEVER rotates the artwork to face its heading -- direct
// requirement: "the dragon is always horizontal, it's drawn that way,
// should be rendered that way." Only ever mirrors left/right (scale's
// sign) depending on which way it's currently travelling -- dragon.svg's
// own artwork faces LEFT natively ("orient it accordingly"), so moving
// right (cos(heading) >= 0) flips it, moving left doesn't.
//
// d.diveScale (stepDragon()'s dive/resurface cycle) drives the `slide`
// group's own Y offset, not the outer scale -- 1 = natural position
// (fully visible inside its clip rect), 0 = pushed a full DRAGON_VIEWBOX
// height down, entirely past the clip rect's bottom edge (fully hidden).
// The SAME formula works for both directions: dive shrinks diveScale
// 1->0 (slides down and out), surface grows it 0->1 (slides up and back
// in) -- see buildDragonElement()'s own comment for why this reads as
// "sinking" rather than a shrink/fade.
// v3.7.28 -- factored out of tickDragon() below so ensureDragon() can
// call it once, synchronously, right after building each dragon's
// elements -- direct bug report: "part of the dragon svg is momentarily
// visible on the upper left corner at a very large size" on reload.
// Cause: buildDragonElement()'s `outer` group carries no transform of
// its own (only `inner`, which just centres the artwork's local
// coordinate space -- see that function's comment); the real
// position/scale was ONLY ever applied inside tickDragon(), which
// animationFrame() skips entirely on its first call (`lastFrameTime`
// starts null). ensureDragon() appended `outer` to the live stage before
// any of that ran, so the browser could paint one or more real frames of
// the dragon sitting at raw DRAGON_PATH_D coordinates -- untranslated,
// unscaled, i.e. full native artwork size at the SVG's origin -- exactly
// the glitch described. Calling this once at spawn time, using the same
// formula, means `outer` never has an untransformed moment to be caught
// mid-paint; tickDragon() then simply keeps calling it every frame as
// before.
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

function tickDragon(dt, t) {
  if (!dragonState) return;
  const { dragons, canvasBounds, sampler } = dragonState;
  const config = v3Config.dragon;

  dragons.forEach(({ d, group, slide }) => {
    stepDragon(d, sampler.isLand, canvasBounds, t, dt, config, Math.random);
    applyDragonTransform(d, group, slide);
  });
}

function animationFrame(timestamp) {
  if (animStartTime === null) animStartTime = timestamp;
  const t = (timestamp - animStartTime) / 1000;
  if (lastFrameTime !== null) {
    // Clamped to 50ms so resuming a backgrounded/throttled tab doesn't
    // advect every particle in one huge jump.
    const dt = Math.min(0.05, (timestamp - lastFrameTime) / 1000);
    tickParticles(dt, t);
    tickDragon(dt, t);
  }
  lastFrameTime = timestamp;

  // v3.6.20 -- direct request: see the field correlate with particle
  // behaviour live, not just its t=0 starting picture. Throttled to
  // every 0.4s (not every frame) -- a full grid rebuild is cols*rows
  // sampler calls, each several gradient evals; the debug view doesn't
  // need 60fps to read as "live," particle motion already provides that.
  if (
    (v3Config.flow.showPotential || v3Config.flow.showVectors) &&
    islandLayoutState && lastIslandTrace &&
    (lastDebugFieldTime === null || t - lastDebugFieldTime > 0.4)
  ) {
    lastDebugFieldTime = t;
    const stage = document.querySelector("#v3-stage");
    const field = buildCurrentFlowField(islandLayoutState.canvasBounds, lastIslandTrace, t);
    drawFlowFieldDebug(stage, islandLayoutState.canvasBounds, field);
  }

  requestAnimationFrame(animationFrame);
}

// v3.6.21 -- click-to-launch: ADDS a genuinely new particle at the
// clicked point (not a real feature per the user -- flexible on exact
// behaviour, priority is staying cheap and not risking page performance
// over it), capped at v3Config.particles.maxCount total. Above that, a
// click is just ignored -- no queueing, no bumping an existing boat,
// nothing clever. Growth only ever happens here; every particle
// (clicked or original) drains back out through the SAME exit path in
// tickParticles()/stepParticle() -- once the pool is over its base
// count, exits stop being replaced (see tickParticles()'s own comment),
// so extras naturally die off over time without any separate "is this
// one an extra" bookkeeping.
function launchBoatAt(x, y, t) {
  if (!particleState) return;
  const { particles, sampler, els, group } = particleState;
  if (particles.length >= v3Config.particles.maxCount) return;

  const [vx, vy] = sampler.vectorAt(x, y, t);
  const mag = Math.hypot(vx, vy);
  const dirX = mag > 1e-9 ? vx / mag : 1;
  const dirY = mag > 1e-9 ? vy / mag : 0;
  // activeAt: t (immediately active, never staggered -- a click should
  // feel instant, see createParticlePool()'s own comment on why staggering
  // only ever applies to off-canvas spawns). coastal: false -- a
  // click-launched boat isn't a coastal-origin spawn even if the click
  // happened to land near a shore, it's a direct user placement.
  const p = { x, y, dirX, dirY, checkX: x, checkY: y, checkT: t, activeAt: t, coastal: false };
  particles.push(p);

  const pg = buildParticleElement();
  group.appendChild(pg);
  els.push(pg);

  // Positioned immediately rather than waiting up to one frame for
  // tickParticles() -- a click should feel instant.
  const angle = (Math.atan2(dirY, dirX) * 180) / Math.PI;
  pg.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
}

// Converts a click's screen coordinates into the stage <svg>'s own
// user-space (accounting for the viewBox's scale/offset -- see
// render()'s own viewBox comment) via the standard SVG technique, then
// only launches a boat if the point is both inside canvasBounds and NOT
// land -- reuses sampler.isLand() (v3.6.21, see createFlowSampler()'s
// own comment in cabinet-v3-flowfield.js), the exact same land test the
// particle sim itself now enforces as a hard backstop, so "open ocean"
// here means the same thing it means everywhere else in this system.
function onStageClick(evt) {
  if (!particleState) return;
  const stage = document.querySelector("#v3-stage");
  const pt = stage.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const svgP = pt.matrixTransform(stage.getScreenCTM().inverse());

  const { canvasBounds, sampler } = particleState;
  if (
    svgP.x < canvasBounds.x || svgP.x > canvasBounds.x + canvasBounds.width ||
    svgP.y < canvasBounds.y || svgP.y > canvasBounds.y + canvasBounds.height
  ) return;
  if (sampler.isLand(svgP.x, svgP.y)) return;

  launchBoatAt(svgP.x, svgP.y, currentAnimTime());
}

// Exported for cabinet-v3-controls.js -- islands-tool.html is the ONLY
// caller (see the module doc comment above). Idempotent: calling it
// again (shouldn't normally happen, no pause/stop control exists yet)
// doesn't start a second RAF loop, and doesn't attach a second click
// listener either (guarded by the same particlesActive check).
export function startCurrentAnimation() {
  if (particlesActive) return;
  particlesActive = true;
  document.querySelector("#v3-stage").addEventListener("click", onStageClick);
  if (islandLayoutState && lastIslandTrace) {
    const stage = document.querySelector("#v3-stage");
    const sampler = buildCurrentSampler(islandLayoutState.canvasBounds, lastIslandTrace);
    ensureParticles(stage, islandLayoutState.canvasBounds, sampler, 0);
    ensureDragon(stage, islandLayoutState.canvasBounds, sampler, 0);
    if (v3Config.flow.showPotential || v3Config.flow.showVectors) {
      const field = buildCurrentFlowField(islandLayoutState.canvasBounds, lastIslandTrace, currentAnimTime());
      drawFlowFieldDebug(stage, islandLayoutState.canvasBounds, field);
    }
  }
  requestAnimationFrame(animationFrame);
}

// Shared by render()/retraceIslands()/animationFrame() -- builds against
// whatever heightmap drawIslandsPath() just produced. Two flavours: the
// grid SNAPSHOT drawFlowFieldDebug() renders (buildCurrentFlowField --
// re-sampled at a given instant `t`, not itself continuously animated),
// and the live analytic sampler particles advect against
// (buildCurrentSampler, see createFlowSampler()'s own doc comment for
// why particles use per-point sampling every frame rather than a grid --
// cost scales with particle count, not grid resolution).
function buildCurrentFlowField(canvasBounds, islandTrace, t = 0) {
  const { H, cols, rows, paddedBounds } = islandTrace;
  return buildFlowField(H, cols, rows, v3Config.island.cellSize, paddedBounds, canvasBounds, v3Config.flow, t);
}

// v3.6.20 -- shared by every debug-field call site so they all read the
// SAME live clock the particles themselves advect against, rather than
// each re-deriving it (or worse, silently defaulting to 0 and showing a
// rewound field). Mirrors ensureParticles()'s own inline version in
// render() (kept there too, unchanged, since it already existed).
function currentAnimTime() {
  return animStartTime === null ? 0 : (performance.now() - animStartTime) / 1000;
}

function buildCurrentSampler(canvasBounds, islandTrace) {
  const { H, cols, rows, paddedBounds } = islandTrace;
  // v3.6.21 -- landThreshold isn't part of v3Config.flow's own shape;
  // merged in here from v3Config.island.threshold (the SAME value the
  // coastline is traced at) so the sampler's isLand() can never disagree
  // with what's actually drawn as land. See createFlowSampler()'s own
  // comment for why isLand() exists at all.
  const flowConfig = { ...v3Config.flow, landThreshold: v3Config.island.threshold };
  return createFlowSampler(H, cols, rows, v3Config.island.cellSize, paddedBounds, flowConfig);
}

// Exported for cabinet-v3-controls.js -- re-traces against the current
// v3Config.island values using the cached layout from the last full
// render(), a no-op if render() hasn't run yet.
export function retraceIslands() {
  if (!islandLayoutState) return;
  const stage = document.querySelector("#v3-stage");
  const islandTrace = drawIslandsPath(stage, islandLayoutState.canvasBounds, islandLayoutState.grown);
  lastIslandTrace = islandTrace;
  drawCoastalInwardBands(stage, islandLayoutState.layout, islandTrace, islandLayoutState.grown);
  drawTopologyStructuralLayer(stage, islandTrace);
  drawIslandNoiseDebug(stage, islandTrace.paddedBounds, islandTrace.H, islandTrace.cols, islandTrace.rows, v3Config.island.cellSize);

  // v3.7.7 -- redraw the lat/long grid too (cheap: drawGeoGrid() replaces
  // its own group rather than accumulating one per call, see its own
  // comment) so the new Latitude/Longitude spacing sliders (dev panel)
  // can reuse this same cheap path instead of needing a full render().
  drawGeoGrid(stage, islandLayoutState.canvasBounds, islandLayoutState.gridOrigin);

  if (v3Config.flow.showPotential || v3Config.flow.showVectors) {
    const field = buildCurrentFlowField(islandLayoutState.canvasBounds, islandTrace, currentAnimTime());
    drawFlowFieldDebug(stage, islandLayoutState.canvasBounds, field);
  } else {
    drawFlowFieldDebug(stage, islandLayoutState.canvasBounds, null);
  }

  if (particlesActive) {
    const freshSampler = buildCurrentSampler(islandLayoutState.canvasBounds, islandTrace);
    updateParticleSampler(freshSampler);
    updateDragonSampler(freshSampler);
  }

  // v3.7.33/34 bugfix -- renderRegion() (where every theme-preview path
  // lives) only ever runs inside the full render() pass, never here, so
  // NOTHING above this line touches those paths. Originally wired only to
  // the Island/Section halo sliders directly (confirmed via a genuine
  // silent-no-op bug: "i turned it upto 100 and went down to 7, no
  // change"); folded in here instead once the preview grew real
  // sand/veg/peak bands too, since those depend on the SAME
  // sandThresholds/vegThresholds/peakThresholds arrays every other
  // Topological-offset slider already mutates, and there's no reliable
  // way to enumerate every slider that could ever touch those arrays from
  // outside this function. Cheap enough to run unconditionally: each
  // island/section trace is bounded to its own small local grid, not the
  // full canvas (see buildIsolatedHeightmap()'s own comment) -- a small
  // fraction of the full-canvas retrace this function already pays for
  // on every tick regardless.
  retraceThemePreviews();
}
// v3.7.34 -- also keeps the sand/veg/peak preview bands in sync, not
// just the halo wash (they were added alongside this function, so
// they've never been out of sync in a shipped version, but they'd fall
// into the exact same "silent no-op" trap the halo sliders hit if left
// wired only to the halo sliders -- the existing Topological-offset
// sliders (sandThresholds/vegThresholds/peakThresholds) also need this
// refreshed, and there's no way to enumerate every slider that could
// ever touch those arrays from here. Folded into retraceIslands() below
// instead of requiring every such slider to remember to call this
// separately -- see that function's own comment for the "why fold it in,
// isn't that wasteful on unrelated ticks" reasoning.
export function retraceThemePreviews() {
  if (!islandLayoutState) return;
  const stage = document.querySelector("#v3-stage");
  const { islandHaloPx, sectionHaloPx, blurPx } = v3Config.themePreview;
  const clipMargin = clipMarginFor(blurPx);
  // Same class-name pattern (v3-*-theme-preview-NAME-N) covers sea bands
  // too (v3.7.38) -- one generic loop below handles all four groups.
  const bandLevels = () => [
    ["sea", v3Config.island.seaBandThresholds],
    ["sand", v3Config.island.sandThresholds],
    ["veg", v3Config.island.vegThresholds],
    ["peak", v3Config.island.peakThresholds]
  ];

  islandLayoutState.grown.forEach(c => {
    const link = stage.querySelector(`.v3-island[data-id="${c.id}"]`);
    if (!link) return;

    const previewHM = buildIsolatedHeightmap([c], v3Config.island, islandHaloPx + clipMargin + 80);
    const halo = link.querySelector(".v3-island-theme-preview");
    if (halo) {
      const distanceField = buildCoastlineDistanceField(previewHM.H, previewHM.cols, previewHM.rows, v3Config.island.cellSize, v3Config.island.threshold);
      halo.setAttribute("d", traceContourFromHeightmap(distanceField, previewHM.cols, previewHM.rows, v3Config.island.cellSize, previewHM.localBounds, -islandHaloPx));
      halo.setAttribute("data-clip-d", traceContourFromHeightmap(distanceField, previewHM.cols, previewHM.rows, v3Config.island.cellSize, previewHM.localBounds, -(islandHaloPx + clipMargin)));
    }
    bandLevels().forEach(([name, levels]) => {
      levels.forEach((level, i) => {
        const band = link.querySelector(`.v3-island-theme-preview-${name}-${i + 1}`);
        if (band) band.setAttribute("d", traceIsolatedShapeAtLevel([c], v3Config.island, level, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds));
      });
    });
    const coastline = link.querySelector(".v3-island-theme-preview-coastline");
    if (coastline) coastline.setAttribute("d", traceIsolatedShapeAtLevel([c], v3Config.island, v3Config.island.threshold, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds));

    const shadowCopies = link.querySelectorAll(".v3-island-theme-preview-shadow-copy");
    if (shadowCopies.length) {
      const fresh = buildIsolatedShadowTaper([c], v3Config.island, previewHM, v3Config.island.seaShadowAngleDeg);
      shadowCopies.forEach((node, i) => {
        if (!fresh[i]) return;
        node.setAttribute("d", fresh[i].d);
        node.setAttribute("transform", fresh[i].transform);
      });
    }
  });

  const grownBySection = new Map();
  islandLayoutState.grown.forEach(c => {
    if (!grownBySection.has(c.sectionId)) grownBySection.set(c.sectionId, []);
    grownBySection.get(c.sectionId).push(c);
  });
  islandLayoutState.layout.forEach(({ sectionMeta }) => {
    const region = stage.querySelector(`.v3-region[data-section="${sectionMeta.id}"]`);
    if (!region) return;
    const circles = grownBySection.get(sectionMeta.id) || [];
    if (!circles.length) return;

    const previewHM = buildIsolatedHeightmap(circles, v3Config.island, sectionHaloPx + clipMargin + 80);
    const halo = region.querySelector(".v3-section-theme-preview");
    if (halo) {
      const distanceField = buildCoastlineDistanceField(previewHM.H, previewHM.cols, previewHM.rows, v3Config.island.cellSize, v3Config.island.threshold);
      // Only the islands composite -- the label's own small wash patch is
      // a separate, static sibling element (see renderRegion()'s own
      // v3.7.41 comment) that never needs retracing: its geometry depends
      // on the label's rendered bbox and font size, neither of which any
      // retrace-triggering slider touches.
      halo.setAttribute("d", traceContourFromHeightmap(distanceField, previewHM.cols, previewHM.rows, v3Config.island.cellSize, previewHM.localBounds, -sectionHaloPx));
      halo.setAttribute("data-clip-d", traceContourFromHeightmap(distanceField, previewHM.cols, previewHM.rows, v3Config.island.cellSize, previewHM.localBounds, -(sectionHaloPx + clipMargin)));
    }
    bandLevels().forEach(([name, levels]) => {
      levels.forEach((level, i) => {
        const band = region.querySelector(`.v3-section-theme-preview-${name}-${i + 1}`);
        if (band) band.setAttribute("d", traceIsolatedShapeAtLevel(circles, v3Config.island, level, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds));
      });
    });
    const coastline = region.querySelector(".v3-section-theme-preview-coastline");
    if (coastline) coastline.setAttribute("d", traceIsolatedShapeAtLevel(circles, v3Config.island, v3Config.island.threshold, previewHM.H, previewHM.cols, previewHM.rows, previewHM.localBounds));

    const shadowCopies = region.querySelectorAll(".v3-section-theme-preview-shadow-copy");
    if (shadowCopies.length) {
      const fresh = buildIsolatedShadowTaper(circles, v3Config.island, previewHM, v3Config.island.seaShadowAngleDeg);
      shadowCopies.forEach((node, i) => {
        if (!fresh[i]) return;
        node.setAttribute("d", fresh[i].d);
        node.setAttribute("transform", fresh[i].transform);
      });
    }
  });
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
// Mechanism 3, first slice: "Medieval effects disappear -- wave
// contours, etc." within the hovered region, not just a Topology-
// coloured overlay on top of them (that's all Part A/v3.7.32-35 did --
// see the "theme x hover" to-do item). CSS `:hover` alone can style
// EXISTING elements but can't construct a dynamic "everywhere except
// this hovered shape" clip region, so this is a JS-driven exception to
// every other reveal in this feature (all pure CSS opacity transitions
// so far) -- delegated pointerover/pointerout on #v3-stage (same "one
// listener, not one per element" pattern startCurrentAnimation() already
// uses for click-to-launch), not per-element, so it survives every
// retraceIslands() call without needing re-binding (those never touch
// the island/section <a> elements this listens on).
//
// The clip itself is one shared <clipPath>: a single evenodd path with
// an oversized outer rect (covering the canvas regardless of its actual
// size, so no bounds tracking needed) as one subpath, plus the currently
// hovered island's/section's OWN halo shape as a second, nested subpath
// -- same "two subpaths, evenodd, ring/hole" technique
// drawCoastalInwardBands() already uses. That halo shape is read
// straight off the ALREADY-COMPUTED .v3-island-theme-preview/
// .v3-section-theme-preview element's own `d` attribute -- no new
// geometry, and it stays correct automatically since
// retraceThemePreviews() already keeps that attribute in sync.
const MEDIEVAL_EFFECTS_CLIP_ID = "v3-medieval-effects-clip";
const MEDIEVAL_EFFECTS_CLIP_OUTER_D = "M -100000,-100000 H 100000 V 100000 H -100000 Z";

function updateMedievalEffectsClip(holeD) {
  const hole = document.querySelector(`#${MEDIEVAL_EFFECTS_CLIP_ID} .v3-medieval-effects-hole`);
  if (hole) hole.setAttribute("d", holeD ? `${MEDIEVAL_EFFECTS_CLIP_OUTER_D} ${holeD}` : MEDIEVAL_EFFECTS_CLIP_OUTER_D);
}

function setupMedievalEffectsHoverClip(stage) {
  const defs = el("defs");
  const clipPath = el("clipPath", { id: MEDIEVAL_EFFECTS_CLIP_ID });
  clipPath.appendChild(el("path", { class: "v3-medieval-effects-hole", "fill-rule": "evenodd", d: MEDIEVAL_EFFECTS_CLIP_OUTER_D }));
  defs.appendChild(clipPath);
  stage.appendChild(defs);

  if (stage.dataset.medievalClipWired) return;
  stage.dataset.medievalClipWired = "1";

  stage.addEventListener("pointerover", e => {
    const target = e.target.closest(".v3-island[data-id], .v3-section-link");
    if (!target) return;
    const previewEl = target.querySelector(".v3-island-theme-preview, .v3-section-theme-preview");
    // v3.7.38 bugfix -- data-clip-d (dilated a bit further than the wash's
    // own `d`) rather than `d` itself, so the clip fully covers wherever
    // the wash's own blur could still be tinting -- see clipMarginFor().
    updateMedievalEffectsClip(previewEl ? previewEl.getAttribute("data-clip-d") : "");
  });
  stage.addEventListener("pointerout", e => {
    const target = e.target.closest(".v3-island[data-id], .v3-section-link");
    if (!target || target.contains(e.relatedTarget)) return;
    updateMedievalEffectsClip("");
  });
}

export function render() {
  const stage = document.querySelector("#v3-stage");
  stage.innerHTML = "";
  setupMedievalEffectsHoverClip(stage);

  const sectionMetas = buildSectionMetas();
  renderSemanticOutline(sectionMetas);
  const { width: targetWidth, height: targetHeight } = resolveCanvasDimensions(sectionMetas, v3Config.canvas);
  const { regions, canvasWidth, canvasHeight } = buildRegions(sectionMetas, targetWidth, targetHeight);

  // Small outer margin around the whole canvas -- not part of the
  // weight-proportional layout math (every region rect is still
  // computed in plain 0..width/0..height space), just extra viewBox on
  // every side so an island's centered label near the outermost edge of
  // the whole page isn't clipped by the SVG boundary itself the way an
  // island near an *interior* region seam still can be (that's the
  // general label-overflow limitation, still open -- see
  // documentation/Landing-page-notes.2.0.md).
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
  // v3.7 -- the compass section (kind: "compass") gets no label band or
  // archipelago seeding of its own; it's rendered separately, below, via
  // renderCompassRegion(). Its OWN outer rect still goes into obstacles
  // (below) so ordinary archipelago growth from neighbouring sections
  // can't bleed into its reserved strip -- squarify() never put any
  // seeds there to begin with (buildRegions() ran the real squarify()
  // call against a canvas already shortened to exclude that strip), but
  // growth itself is a single global pass with no per-region hard walls
  // (see the v3.5 comment above), so without this a circle from an
  // adjacent section could still grow across that boundary.
  const compassMeta = sectionMetas.find(s => s.kind === "compass");
  const compassRegion = compassMeta ? regionById.get(compassMeta.id) : null;

  const layout = sectionMetas
    .filter(sectionMeta => sectionMeta.kind !== "compass")
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
  if (compassRegion) obstacles.push(compassRegion.outer);

  // v3.6.10 registered the page's title/tagline (real HTML, not SVG --
  // see documentation/Landing-page-notes.2.0.md's "Canvas + legend" entry for why) as
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
  // documentation/Landing-page-notes.2.0.md for why this is a single combined trace
  // rather than one shape per circle.
  //
  // gridOrigin computed here (not just below, next to its own
  // drawGeoGrid() call) so it can ride along in islandLayoutState --
  // retraceIslands() (below) needs it too, to redraw the grid on its own
  // cheap path when a spacing slider moves, without recomputing the
  // whole layout just for that.
  // v3.7.20 bugfix -- used to be compassSquare's raw, unshifted centre,
  // which stopped matching the rose's actual rendered position once
  // renderCompassRegion() started recentring the [rose + labels] unit as
  // one block (v3.7.18) -- direct feedback: "diagonals no longer centred
  // to the compass! I suspect the latlong isnt either" (it was). Now
  // reads the exact same shift renderCompassRegion() itself applies (see
  // computeCompassShift()'s own comment), so this can never drift out of
  // sync with where the compass is actually drawn again.
  const gridOrigin = compassRegion
    ? (() => {
        const square = compassRegion.compassSquare;
        const { shiftX, shiftY } = computeCompassShift(square, compassMeta);
        return { x: square.x + square.width / 2 + shiftX, y: square.y + square.height / 2 + shiftY };
      })()
    : { x: canvasWidth / 2, y: canvasHeight / 2 };
  islandLayoutState = { grown, canvasBounds, gridOrigin, layout };
  const islandTrace = drawIslandsPath(stage, canvasBounds, grown);
  lastIslandTrace = islandTrace;
  drawCoastalInwardBands(stage, layout, islandTrace, grown);
  drawTopologyStructuralLayer(stage, islandTrace);
  drawIslandNoiseDebug(stage, islandTrace.paddedBounds, islandTrace.H, islandTrace.cols, islandTrace.rows, v3Config.island.cellSize);

  // v3.7.2 bugfix -- this used to run BEFORE drawIslandsPath() on the
  // (wrong) assumption that JS call order determines DOM/paint order.
  // It doesn't: drawIslandsPath()'s own placeOne() helper (above) always
  // self-pins the landmass to stage.firstChild, REGARDLESS of when it's
  // called relative to anything else -- confirmed by direct feedback
  // ("lines are overlaid on the islands") plus inspecting the actual
  // rendered DOM order, which had the grid AFTER the landmass despite
  // this call sitting textually first. Calling it here instead --
  // AFTER drawIslandsPath() has already self-pinned to the front -- a
  // plain appendChild() is now guaranteed to land right after that
  // block, i.e. still under every region/the compass, still over the
  // land (see drawGeoGrid()'s own comment for the "why" of that order).
  drawGeoGrid(stage, canvasBounds, gridOrigin);

  if (v3Config.flow.showPotential || v3Config.flow.showVectors) {
    const field = buildCurrentFlowField(canvasBounds, islandTrace, currentAnimTime());
    drawFlowFieldDebug(stage, canvasBounds, field);
  } else {
    drawFlowFieldDebug(stage, canvasBounds, null);
  }

  // particlesActive can already be true here (e.g. Reroll/Restore
  // position while the animation is running) -- a full render() means a
  // fresh layout, so particles get fresh positions too, not just a
  // sampler update (see updateParticleSampler()'s own comment for why a
  // cheap retrace does the opposite). `t` reads the real elapsed
  // animation time (not 0) so freshly-spawned particles' initial
  // direction is sampled from the current's actual current drift state,
  // not a rewound one.
  if (particlesActive) {
    const sampler = buildCurrentSampler(canvasBounds, islandTrace);
    const t = animStartTime === null ? 0 : (performance.now() - animStartTime) / 1000;
    ensureParticles(stage, canvasBounds, sampler, t);
    ensureDragon(stage, canvasBounds, sampler, t);
  }

  const grownBySection = new Map();
  grown.forEach(c => {
    if (!grownBySection.has(c.sectionId)) grownBySection.set(c.sectionId, []);
    grownBySection.get(c.sectionId).push(c);
  });

  layout.forEach(({ sectionMeta, region, band, label }) => {
    renderRegion(stage, region, band, label, sectionMeta, grownBySection.get(sectionMeta.id) || []);
  });

  if (compassMeta && compassRegion) {
    renderCompassRegion(stage, compassRegion, compassMeta);
  }
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

// #32 rework, 2026-08-30 -- theme colours/fonts used to be CSS-only, so
// every page (including production, which has no controls.js) got them
// for free from the stylesheet alone. Now that they live in
// v3Config.colors/v3Config.fonts, this is the one place that reaches
// every page (cabinet-v3-controls.js, dev-tool-only, calls this again on
// Theme-dropdown change/live colour or font edits) -- without it,
// production would render with only the base body.v3-proto fallback
// values, not medieval-map's actual palette.
applyThemeStyle(document.body.dataset.theme);
render();
