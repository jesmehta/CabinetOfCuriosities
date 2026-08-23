// Cabinet of Curiosities -- renders the island link states and the entry
// card layer (desktop map overlay + mobile stacked fallback) from data.
// Does not generate island geometry -- island/coast/ripple paths are
// hand-authored (see assets/map/source/) and live directly in index.html.

import { landingConfig } from "./cabinet-data.js";
import { sections, entries } from "./cabinet-generated-content.js";

const VIEW_W = landingConfig.viewBox.width;
const VIEW_H = landingConfig.viewBox.height;

function pxToPercent(px, axis) {
  return (px / (axis === "x" ? VIEW_W : VIEW_H)) * 100;
}

function statusClass(status) {
  if (status === "wip") return "status-wip";
  if (status === false) return "status-hidden";
  return "status-active";
}

function monogram(title) {
  return (title || "?").trim().charAt(0).toUpperCase();
}

function makeThumb(entry) {
  if (entry.thumbnail) {
    const img = document.createElement("img");
    img.className = "card-thumb";
    img.src = entry.thumbnail;
    img.alt = "";
    img.loading = "lazy";
    return img;
  }
  if (entry.icon) {
    const wrap = document.createElement("div");
    wrap.className = "card-thumb card-icon-tile";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = `<svg class="card-icon" viewBox="0 0 24 24"><use href="#${entry.icon}"></use></svg>`;
    return wrap;
  }
  const div = document.createElement("div");
  div.className = "card-thumb card-thumb-placeholder";
  div.setAttribute("aria-hidden", "true");
  div.textContent = monogram(entry.title);
  return div;
}

/* ---------------------------------------------------------------------- */
/* Coast-card layout: entries with placement "coast" have an anchor
   (north/south/east/west) but no explicit x/y -- distribute them evenly
   along that edge of the island, outside the land shape. */

const COAST_OFFSET_PX = 46;
const COAST_SPACING_PX = 118;

function coastPosition(section, anchor, index, count) {
  const { cx, cy, rx, ry } = section.map;
  const centered = index - (count - 1) / 2;

  if (anchor === "north") {
    return { x: cx + centered * COAST_SPACING_PX, y: cy - ry - COAST_OFFSET_PX };
  }
  if (anchor === "south") {
    return { x: cx + centered * COAST_SPACING_PX, y: cy + ry + COAST_OFFSET_PX };
  }
  if (anchor === "east") {
    return { x: cx + rx + COAST_OFFSET_PX + 30, y: cy + centered * COAST_SPACING_PX };
  }
  // west (default)
  return { x: cx - rx - COAST_OFFSET_PX - 30, y: cy + centered * COAST_SPACING_PX };
}

function resolvePositions(sectionsById) {
  const byAnchorGroup = new Map();

  entries.forEach(entry => {
    if (entry.visual.placement !== "coast") return;
    const key = `${entry.section}::${entry.visual.anchor || "south"}`;
    if (!byAnchorGroup.has(key)) byAnchorGroup.set(key, []);
    byAnchorGroup.get(key).push(entry);
  });

  byAnchorGroup.forEach(group => {
    group.sort((a, b) => (a.visual.order || 0) - (b.visual.order || 0));
  });

  const positions = new Map();

  entries.forEach(entry => {
    const section = sectionsById.get(entry.section);
    if (!section) return;

    if (entry.visual.placement === "land") {
      positions.set(entry.id, { xPercent: entry.visual.x, yPercent: entry.visual.y });
      return;
    }

    if (entry.visual.placement === "coast") {
      const key = `${entry.section}::${entry.visual.anchor || "south"}`;
      const group = byAnchorGroup.get(key) || [entry];
      const index = group.indexOf(entry);
      const px = coastPosition(section, entry.visual.anchor || "south", index, group.length);
      positions.set(entry.id, {
        xPercent: pxToPercent(px.x, "x"),
        yPercent: pxToPercent(px.y, "y"),
      });
      return;
    }

    if (entry.visual.placement === "external") {
      positions.set(entry.id, { xPercent: entry.visual.x, yPercent: entry.visual.y });
    }
  });

  return positions;
}

/* ---------------------------------------------------------------------- */
/* Desktop map card layer */

function renderIslandLinks(sectionsById) {
  sections.forEach(section => {
    const link = document.querySelector(`a.island-link[data-section="${section.id}"]`);
    if (!link) return;

    link.classList.add(statusClass(section.status));

    if (section.href) {
      link.setAttribute("href", section.href);
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
    }

    const group = link.querySelector(".island");
    if (group) group.classList.add(statusClass(section.status));

    const titleEl = link.querySelector(".island-label-title");
    if (titleEl) titleEl.textContent = section.title;

    link.setAttribute("aria-label", section.subtitle ? `${section.title} — ${section.subtitle}` : section.title);
  });
}

function buildMapCard(entry, position) {
  const isWip = entry.status === "wip" || !entry.href;
  const el = document.createElement(isWip ? "span" : "a");
  el.className = [
    "map-card",
    `size-${entry.visual.size || "medium"}`,
    `card-type-${entry.visual.cardType || "thumbnail-plaque"}`,
    statusClass(entry.status),
  ].join(" ");
  el.dataset.section = entry.section;
  el.dataset.entry = entry.id;
  el.style.setProperty("--card-x", `${position.xPercent}%`);
  el.style.setProperty("--card-y", `${position.yPercent}%`);

  if (!isWip) {
    el.href = entry.href;
  } else {
    el.setAttribute("aria-disabled", "true");
  }

  el.appendChild(makeThumb(entry));

  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = entry.title;
  el.appendChild(title);

  if (entry.subtitle) {
    const subtitle = document.createElement("span");
    subtitle.className = "card-subtitle";
    subtitle.textContent = entry.subtitle;
    el.appendChild(subtitle);
  }

  if (isWip) {
    const badge = document.createElement("span");
    badge.className = "card-badge";
    badge.textContent = "Coming soon";
    el.appendChild(badge);
  }

  return el;
}

function renderCardLayer(sectionsById) {
  const layer = document.querySelector(".map-card-layer");
  if (!layer) return;

  const positions = resolvePositions(sectionsById);

  entries
    .filter(entry => entry.status !== false)
    .forEach(entry => {
      const position = positions.get(entry.id);
      if (!position) return;
      layer.appendChild(buildMapCard(entry, position));
    });
}

/* ---------------------------------------------------------------------- */
/* Mobile stacked fallback */

function buildStackEntry(entry) {
  const isWip = entry.status === "wip" || !entry.href;
  const el = document.createElement(isWip ? "span" : "a");
  el.className = ["stack-entry", statusClass(entry.status)].join(" ");
  if (!isWip) el.href = entry.href;
  else el.setAttribute("aria-disabled", "true");

  el.appendChild(makeThumb(entry));

  const title = document.createElement("span");
  title.textContent = isWip ? `${entry.title} (coming soon)` : entry.title;
  el.appendChild(title);

  return el;
}

function renderStack() {
  const stack = document.querySelector(".map-stack");
  if (!stack) return;

  const heading = document.createElement("h1");
  heading.className = "map-stack-title";
  heading.textContent = landingConfig.title;
  stack.appendChild(heading);

  const subtitle = document.createElement("p");
  subtitle.className = "map-stack-subtitle";
  subtitle.textContent = landingConfig.subtitle;
  stack.appendChild(subtitle);

  const orderedSections = [...sections]
    .filter(section => section.status !== false)
    .sort((a, b) => a.order - b.order);

  orderedSections.forEach(section => {
    const isWip = section.status === "wip" || !section.href;
    const card = document.createElement("div");
    card.className = ["stack-island", statusClass(section.status)].join(" ");

    const titleRow = document.createElement(isWip ? "span" : "a");
    titleRow.className = "stack-island-title";
    if (!isWip) titleRow.href = section.href;
    else titleRow.setAttribute("aria-disabled", "true");
    titleRow.textContent = section.title;
    if (isWip) {
      const badge = document.createElement("span");
      badge.className = "card-badge";
      badge.textContent = "Coming soon";
      titleRow.appendChild(badge);
    }
    card.appendChild(titleRow);

    if (section.subtitle) {
      const sub = document.createElement("p");
      sub.className = "stack-island-subtitle";
      sub.textContent = section.subtitle;
      card.appendChild(sub);
    }

    const list = document.createElement("ul");
    list.className = "stack-entries";
    entries
      .filter(entry => entry.section === section.id && entry.status !== false)
      .sort((a, b) => a.order - b.order)
      .forEach(entry => {
        const li = document.createElement("li");
        li.appendChild(buildStackEntry(entry));
        list.appendChild(li);
      });
    card.appendChild(list);

    stack.appendChild(card);
  });
}

/* ---------------------------------------------------------------------- */

export function renderCabinetMap() {
  const sectionsById = new Map(sections.map(section => [section.id, section]));
  renderIslandLinks(sectionsById);
  renderCardLayer(sectionsById);
  renderStack();
}
