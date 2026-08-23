// Cabinet of Curiosities -- hover/focus linking between an island and its
// entry plaques/port-cards, plus route-line highlighting. Pure enhancement:
// the map is fully navigable via real links without any of this running.

export function setupCabinetInteractions() {
  const shell = document.querySelector(".map-shell");
  if (!shell) return;

  const islandLinks = Array.from(document.querySelectorAll("a.island-link"));
  const routeLines = Array.from(document.querySelectorAll(".route-line"));

  function setRelated(sectionId, active) {
    shell.classList.toggle("has-hover", active);

    document
      .querySelectorAll(`.map-card[data-section="${sectionId}"]`)
      .forEach(card => card.classList.toggle("is-related", active));

    routeLines.forEach(route => {
      const ids = (route.dataset.route || "").split(",");
      route.classList.toggle("route-highlighted", active && ids.includes(sectionId));
    });
  }

  islandLinks.forEach(link => {
    const sectionId = link.dataset.section;
    if (!sectionId) return;

    link.addEventListener("mouseenter", () => setRelated(sectionId, true));
    link.addEventListener("mouseleave", () => setRelated(sectionId, false));
    link.addEventListener("focusin", () => setRelated(sectionId, true));
    link.addEventListener("focusout", () => setRelated(sectionId, false));
  });

  document.querySelectorAll(".map-card").forEach(card => {
    const sectionId = card.dataset.section;
    if (!sectionId) return;

    const activate = () => setRelated(sectionId, true);
    const deactivate = () => setRelated(sectionId, false);

    card.addEventListener("mouseenter", activate);
    card.addEventListener("mouseleave", deactivate);
    card.addEventListener("focusin", activate);
    card.addEventListener("focusout", deactivate);
  });
}
