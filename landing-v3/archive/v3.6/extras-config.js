// Frozen copy, v3.6.11 -- the live cabinet-v3-extras-config.js this was
// copied from has been deleted (extraCount moved to a real
// cabinet-sections.tsv column, resolved at content-build time by
// tools/build-cabinet-content.js; see Landing-page-notes.2.0.md's
// changelog). This archive snapshot keeps its own copy, unchanged,
// rather than depending on a file that no longer exists -- same
// pinning philosophy as this folder's own config.js/content.js, just
// applied to the one "algorithm module" that turned out to actually be
// per-section hand-tuned data, not shared logic.
//
// Prototype stand-in for a schema extension that doesn't exist in
// content/cabinet-sections.tsv yet. Per the design conversation in
// Landing-page-notes.2.0.md: the number of non-entry "extra" islands per
// section's archipelago is authored per-section -- not rolled randomly
// in the browser on every page view (the whole v3 layout is only
// supposed to recompute when entries/sections are actually added or
// removed, not on every load/resize like fffx's field does).
//
// v3.3: "coming soon" stubs (the dashed, labeled kind) dropped from
// every section -- `comingSoon` is 0 throughout now -- and counts cut
// from a 4-6 range down to 1-3. Two reasons, not one: fewer/plainer
// extras reads better on its own (less visual noise competing with real
// entries), and it directly helps `visual-field-notes`'s overlap problem
// and `about`'s cramped-region problem from the v3.2 pass -- fewer items
// to pack is less pressure on regions that were already tight. `kind:
// "coming-soon"` itself (in cabinet-v3-circlepack.js/cabinet-v3-layout.js)
// is left in place, just unused by any authored count here -- cheap to
// keep dormant in case a future section wants to advertise a specific
// reserved slot again, same spirit as v3.1 keeping packCirclesSpiral()
// dormant for a possible later mode.
//
// If/when this merges into the real pipeline, this file's shape is the
// proposal for a new optional `extraCount` column on
// cabinet-sections.tsv (blank = fall back to defaultExtrasFor() below).
// Kept as a separate hand-authored JS object here, not a TSV,
// specifically so this prototype never touches the production content
// pipeline while still being obviously portable to it later.
export const extrasConfig = {
  bookshelf: { count: 2, comingSoon: 0 },
  fffx: { count: 2, comingSoon: 0 },
  teaching: { count: 3, comingSoon: 0 },
  "visual-field-notes": { count: 2, comingSoon: 0 },
  "machines-makings": { count: 3, comingSoon: 0 },
  "interfaces-data-texts": { count: 2, comingSoon: 0 },
  about: { count: 1, comingSoon: 0 }
};

// Weight assigned to every extra circle (both coming-soon and plain
// filler) for sizing purposes -- deliberately a fixed low value, not
// randomized, so extras read as consistently smaller/quieter than real
// entries (whose weights run 1-4) without needing their own weight
// field. See cabinet-v3-circlepack.js's packRadiusFor() for how weight
// maps to radius.
export const EXTRA_WEIGHT = 1;

// Deterministic fallback for any section not listed in extrasConfig
// above (e.g. a newly-added section, before someone's hand-tuned its
// extras). Seeded by the section id string itself, not Math.random(),
// so it's stable across reloads without needing to persist anything --
// consistent with "recomputed only when sections/entries change," not
// "recomputed every page load."
export function defaultExtrasFor(sectionId) {
  let hash = 0;
  for (let i = 0; i < sectionId.length; i++) {
    hash = (hash * 31 + sectionId.charCodeAt(i)) >>> 0;
  }
  const count = 1 + (hash % 3); // 1-3
  return { count, comingSoon: 0 };
}

export function extrasFor(sectionId) {
  return extrasConfig[sectionId] || defaultExtrasFor(sectionId);
}
