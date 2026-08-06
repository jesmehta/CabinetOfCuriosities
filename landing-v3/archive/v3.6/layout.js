// v3.6 archive -- frozen mirror of ../../cabinet-v3-layout.js, pinned to
// this folder's own config.js and content.js (NOT the live
// cabinet-v3-data.js / real content) so this archive keeps rendering
// exactly as v3.6 looked regardless of later tuning. A full copy rather
// than a shared parameterized function, same reasoning as
// islands-tool.html vs. index.html not sharing one either -- see
// Landing-page-notes.2.0.md's "Three pages" section. Every comment below
// is unchanged from cabinet-v3-layout.js -- read that file for the
// actual design reasoning behind each step. The algorithm modules below
// (treemap/circlepack/extras-config/islandshape) are still imported live
// from one directory up, deliberately NOT frozen -- see config.js's own
// doc comment for why.

import { v3Config } from "./config.js";
import { sections, entries } from "./content.js";
import { squarify } from "../../cabinet-v3-treemap.js";
import { generateScatterPoints, sortPointsByBandReadingOrder, growCircles, createSeededRng, safeMinSeparation, insetRect, centerPointsInRect } from "../../cabinet-v3-circlepack.js";
import { extrasFor, EXTRA_WEIGHT } from "../../cabinet-v3-extras-config.js";
import { traceIslandShapes } from "../../cabinet-v3-islandshape.js";

const SVG_NS = "http://www.w3.org/2000/svg";

let islandLayoutState = null;

function el(tag, attrs = {}, text) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildSectionMetas() {
  const visibleEntries = [...entries].filter(e => e.status !== false);

  return sections
    .filter(s => s.status !== false)
    .map(s => {
      const sectionEntries = visibleEntries
        .filter(e => e.section === s.id)
        .sort((a, b) => a.order - b.order);
      const weight = sectionEntries.reduce((sum, e) => sum + e.weight, 0);
      return { id: s.id, title: s.title, order: s.order, weight, entries: sectionEntries };
    })
    .filter(s => s.weight > 0)
    .sort((a, b) => a.order - b.order);
}

function effectiveWeightForArea(sectionMeta, config) {
  return Math.max(config.minSectionWeight, sectionMeta.weight);
}

function canvasHeightFor(sectionMetas, config) {
  const totalWeight = sectionMetas.reduce((sum, s) => sum + effectiveWeightForArea(s, config), 0) || 1;
  const area = totalWeight * config.areaPerWeightUnit;
  return area / config.width;
}

function buildRegions(sectionMetas) {
  const { width, regionGap } = v3Config.canvas;
  const height = canvasHeightFor(sectionMetas, v3Config.canvas);
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

function computeSectionLabel(title, innerRect) {
  const basePx = 22;
  const minPx = 12;
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

function buildSeedsForSection(sectionMeta, packArea, allPlacedPoints) {
  const entryItems = sectionMeta.entries.map(e => ({
    id: e.id,
    weight: e.weight,
    kind: "entry",
    title: e.title,
    href: e.href,
    status: e.status
  }));

  const { count, comingSoon } = extrasFor(sectionMeta.id);
  const fillerCount = Math.max(0, count - comingSoon);

  const extraItems = [
    ...Array.from({ length: comingSoon }, (_, i) => ({
      id: `${sectionMeta.id}-extra-cs-${i}`,
      weight: EXTRA_WEIGHT,
      kind: "coming-soon"
    })),
    ...Array.from({ length: fillerCount }, (_, i) => ({
      id: `${sectionMeta.id}-extra-filler-${i}`,
      weight: EXTRA_WEIGHT,
      kind: "filler"
    }))
  ];

  const scatterArea = insetRect(packArea, v3Config.pack.minRadius);
  const rng = createSeededRng(sectionMeta.id);

  const scatteredEntries = generateScatterPoints(
    entryItems.length,
    scatterArea,
    rng,
    safeMinSeparation(v3Config.pack),
    allPlacedPoints
  );
  const orderedEntries = sortPointsByBandReadingOrder(scatteredEntries, scatterArea, v3Config.pack.bandHeightRatio);
  const zippedEntries = entryItems.map((item, i) => ({ ...item, x: orderedEntries[i].x, y: orderedEntries[i].y }));
  const centeredEntries = centerPointsInRect(zippedEntries, scatterArea);
  allPlacedPoints.push(...centeredEntries);

  const scatteredExtras = generateScatterPoints(
    extraItems.length,
    scatterArea,
    rng,
    safeMinSeparation(v3Config.pack),
    allPlacedPoints
  );
  const zippedExtras = extraItems.map((item, i) => ({ ...item, x: scatteredExtras[i].x, y: scatteredExtras[i].y }));
  allPlacedPoints.push(...zippedExtras);

  const centered = [...centeredEntries, ...zippedExtras];

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

  circles.forEach(c => {
    if (c.kind === "entry") {
      const isMuted = c.status === "wip";
      const link = el("a", { class: "v3-island", href: c.href || "#" });
      link.setAttribute("data-id", c.id);
      link.appendChild(el("circle", { cx: c.x, cy: c.y, r: c.radius, class: "v3-island-hit" }));
      if (isMuted) {
        link.appendChild(el("circle", { cx: c.x, cy: c.y, r: c.radius, class: "v3-status-ring", "aria-hidden": "true" }));
      }
      link.appendChild(el("text", { x: c.x, y: c.y, class: "v3-island-label" }, c.title));
      group.appendChild(link);
      return;
    }

    if (c.kind === "coming-soon") {
      const stub = el("g", { class: "v3-stub", "data-id": c.id });
      stub.appendChild(el("circle", { cx: c.x, cy: c.y, r: c.radius, class: "v3-status-ring", "aria-hidden": "true" }));
      if (c.radius >= 18) {
        stub.appendChild(el("text", { x: c.x, y: c.y, class: "v3-stub-label" }, "coming soon"));
      }
      group.appendChild(stub);
      return;
    }
  });

  const { lines, fontSize, lineHeight } = label;
  const labelGroup = el("g", { class: "v3-section-label-group" });
  labelGroup.appendChild(
    el("rect", {
      class: "v3-section-label-band",
      x: band.x,
      y: band.y,
      width: band.width,
      height: band.height
    })
  );
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
  group.appendChild(labelGroup);

  stage.appendChild(group);
}

function drawIslandsPath(stage, canvasBounds, grown) {
  const islandsD = traceIslandShapes(grown, canvasBounds, v3Config.island);
  let path = stage.querySelector(".v3-islands-land");
  if (!path) {
    path = el("path", { class: "v3-islands-land", "fill-rule": "evenodd" });
    stage.insertBefore(path, stage.firstChild);
  }
  path.setAttribute("d", islandsD);
}

export function retraceIslands() {
  if (!islandLayoutState) return;
  const stage = document.querySelector("#v3-stage");
  drawIslandsPath(stage, islandLayoutState.canvasBounds, islandLayoutState.grown);
}

function render() {
  const stage = document.querySelector("#v3-stage");
  stage.innerHTML = "";

  const sectionMetas = buildSectionMetas();
  const { regions, canvasWidth, canvasHeight } = buildRegions(sectionMetas);

  const outerMargin = 20;
  const canvasBounds = {
    x: -outerMargin,
    y: -outerMargin,
    width: canvasWidth + outerMargin * 2,
    height: canvasHeight + outerMargin * 2
  };
  stage.setAttribute("viewBox", `${canvasBounds.x} ${canvasBounds.y} ${canvasBounds.width} ${canvasBounds.height}`);

  const regionById = new Map(regions.map(r => [r.id, r]));

  const layout = sectionMetas
    .map(sectionMeta => {
      const region = regionById.get(sectionMeta.id);
      if (!region) return null;
      const label = computeSectionLabel(sectionMeta.title, region.inner);
      const { band, pack } = splitLabelBand(region, label);
      return { sectionMeta, region, band, pack, label };
    })
    .filter(Boolean);

  const allPlacedPoints = [];
  const allSeeds = layout.flatMap(({ sectionMeta, pack }) =>
    buildSeedsForSection(sectionMeta, pack, allPlacedPoints)
  );
  const obstacles = layout.map(({ band }) => band);

  const grown = growCircles(allSeeds, canvasBounds, obstacles, v3Config.pack);

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

render();
