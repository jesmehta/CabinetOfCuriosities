# Cabinet Landing Archive

This folder preserves past Cabinet of Curiosities homepages, one full
generation per rebuild, rather than deleting them.

- `index.html` — the archive's own landing page, linking out to `v1/`,
  `v2/`, `algorithm-bench/`, and `v3-history/` below. Not yet linked from
  the live site itself (Phase 0 item #18 in
  `landing-v3/three-world-launch-phases-ToDo.md`) — that wiring depends on
  how `landing-v3` gets promoted into production (Phase 1 item #40), so it's
  deliberately deferred rather than guessed at here.
- `v1/` — the original, fully-MkDocs-built site (built 2026-08-23 from the
  `cabinet-v1-before-map` tag, commit `1194e49`, the last commit before the
  archipelago-map rebuild). Fully navigable, all sub-pages included.
- `v2/` — the archipelago-map stub that briefly replaced v1's `index.html`
  homepage, then was itself superseded before it was ever linked into the
  rest of the site. Copied standalone with its actual dependency chain
  (`cabinet-render.js` → `cabinet-data.js` + `cabinet-generated-content.js`,
  plus `cabinet-interactions.js` — a second `<script>` import missed on the
  first copy, the actual cause of an early "graphics but no text labels"
  report — and `cabinet-landing.css` + `cabinet-tokens.css`) so it still
  renders on its own. Its `<link rel="icon" href="images/favicon.svg">` was
  already a dead reference in `docs/index.html` before this copy was made —
  `favicon.svg` doesn't exist anywhere under `docs/images/` currently, on
  this branch or in the v1 build; not fixed here, out of scope for
  archiving.
- `v2-history/` — the map stub's four earlier visual states along the way to
  `v2/`, each rebuilt standalone from git history with its own dependency
  chain as it stood at that commit: `01-initial` (`c384a11`, the plain
  double-rectangle cartouche frame, before the map was reviewed against its
  own reference images), `02-round1-visual-pass` (`e8694a4`, corner-scroll
  cartouche flourishes replacing that rectangle frame), `03-coastline-regen`
  (`b20398f`), `04-serpent-redesign` (`a3887b0`). Linked directly from
  `index.html`'s `v2` card, not through a separate lander page of their own.
- `algorithm-bench/` — the "Archipelago Algorithm Bench", a standalone
  research tool (never wired into the site or committed to `landing-v3/`,
  only ever published as a Claude.ai Artifact during the v2 review
  conversation) that prototyped a different island-generation approach:
  Perlin noise × a radial gradient per section × a threshold, extracted
  with marching squares, with live sliders for section/entry counts,
  canvas size, card area, Perlin wavelength, extraction resolution,
  threshold, noise exponent, and point-scatter jitter, plus a stats
  readout comparing measured card:land:water area against the intended
  2:3:5 target. A precursor to `landing-v3`'s own island-shape approach
  (warp/angular-noise + treemap/circle-packing, see `v3-history/` below),
  not a homepage state — kept here rather than in `v2-history/` so that
  distinction stays clear. Reconstructed from conversation record after
  the original scratchpad file was lost to a temp-directory reset;
  re-verified to render identically (same seed, same stats) before being
  saved here.
- `v3-history/01-pre-islands-tool-split/` — `landing-v3/index.html` as it
  stood at commit `9059f35` (tagged locally as
  `v3.6.1-pre-islands-tool-split`, not pushed), the last point where it was
  a single file combining the site page and the live island-shape tuning
  panel (warp strength/period/octaves, angular strength/ridge mix,
  threshold, noise amplitude, gradient strength) added at `dc98435`. The
  very next commit, `e9fe126`, split that panel out into its own permanent
  `islands-tool.html` so `index.html` could later shed it while evolving
  toward production. Rebuilt standalone with its full dependency chain
  (`cabinet-v3-layout.js` → `-data.js`, `-treemap.js`, `-circlepack.js`,
  `-extras-config.js`, `-islandshape.js`, plus `cabinet-v3-controls.js`,
  `cabinet-v3-style.css`, and the site's `cabinet-tokens.css` +
  `cabinet-generated-content.js` from that same commit).
- `cabinet-index.md.bak` — the raw old `docs/index.md` source (superseded by
  `v1/`'s full build above, kept for reference).

`cabinet-v1-before-map` was previously referenced here but didn't actually
exist as a git tag (checked 2026-08-23) — created it at `1194e49` to match
this file's own description, rather than leave the claim stale.

Kept outside `docs/` on purpose (matching Bookshelf's
`archived-landing-pages/*.bak` convention) so MkDocs does not build any of
this as a live, unlinked page under the current `docs/`-only deploy.
