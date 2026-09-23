# ToDo — Website

Current website, tooling, build, deployment, and cross-world work for the
Cabinet and its two sibling worlds. Cabinet was audited 2026-09-12 against the
repository at `ec1f6df`, then reconciled again 2026-09-17 through fetched
`origin/main` `6b9137e` (Bookshelf `117a2cc`, FFFX `d723f74`)
(see "Do now"/"Next"/FFFX below for what that reconciliation found done),
against the open
items in
[`three-world-launch-phases-ToDo.md`](backend-and-deploy/three-world-launch-phases-ToDo.md),
recent Git history, the live source files, and a clean `mkdocs build --strict`.
FFFX and Bookshelf were audited directly on 2026-09-13; their committed and
uncommitted states are distinguished in the sections below.

This is the current-action view. The older launch-phase file remains the
numbered historical ledger and preserves completed-item narratives. When an
item here refers to `#N`, that number belongs to the historical ledger; do not
create a second numbering system here.

The supplied ChatGPT share URL initially returned only the generic/login page.
The saved conversation at `_temp/Review Cabinet Repo Structure.html` was then
reviewed directly.
Its priority argument is incorporated here and in the companion content todo.
Where that older discussion differs from this checkout, current source and Git
history win: notably, its proposed SSD Creative Coding -> SSD Student Work
restructure has since been implemented.

## Verified current state

- [x] Cabinet's working tree was clean at the start of this recheck, at
  `1d320df` (2026-09-16). Sibling working-tree changes are recorded below.
- [x] `mkdocs build --strict` completes successfully as of 2026-09-16. Commit
  `46160a0` corrected the Colophon's `jesalmehta.com` link. The informational
  relative-link messages are assembled/non-MkDocs routes and remain covered by
  final-artifact validation.
- [x] The v3 landing page is generated and promoted; active TSV-backed map
  links are present in the static page.
- [x] Cabinet has a working local TSV editor and Admin Controls dashboard.
- [x] Bookshelf and FFFX also have their own schema-specific TSV editors and
  local dashboards. Historical `#81` is complete across all three worlds.
- [x] The deploy workflow uses `content/external-repos.tsv` and a shared
  assembly script (`30c1de6`): six source repositories, eight destinations,
  including SSD Creative Coding 2023–24, 2024–25, and 2025–26.
- [x] The shared conversation's former P0 SSD Student Work restructure is now
  complete in this checkout: the workflow uses `jesmehta/SSD_Student_Work` and
  mounts the year-specific `ssd-creative-coding-2025-26` gallery. The remaining
  Teaching routes are content/publication work, not an unfinished repo move.
- [x] The Pages deployment is structurally all-or-nothing: `deploy` has
  `needs: build`, and every assembled repo has at least one content check.
- [x] WebTech exists as an active TSV section, landing-page island, clickable
  nav section, and content folder. Historical `#69` describes the superseded
  pre-WebTech state and should no longer be treated as open implementation.
- [x] Historical `#80` is substantially implemented, not untouched: assembly
  expanded from one repo to six. Rock/Dupatta and future repos remain separate
  expansion candidates.
- [x] `documentation/admin-controls/ADMIN-CONTROLS.md` now exists, so the old
  AI Dependency Audit note saying Admin Controls lacks a tier-2 reference is
  stale.
- [x] **Fixed the default-theme flash-of-blue, 2026-09-23.** Direct report:
  "the first initial colours are the flat blues before the Medieval theme
  snaps in." Confirmed root cause: `#32`'s rework moved every theme's colors
  into `v3Config.colors` (`cabinet-v3-data.js`), applied only via JS
  (`applyThemeStyle()`, a deferred `type="module"` script) — `body.v3-proto`'s
  base CSS still carries the original placeholder blues with nothing
  overriding them until that script runs, so production always painted blue
  first regardless of `data-theme="medieval-map"` already being set in the
  markup. Fixed by baking medieval-map's resolved colors/fonts as a literal
  inline `style=` on `index.template.html`'s `<body>` — the browser now
  paints the real theme on the first frame; `applyThemeStyle()` still runs
  and re-sets the identical values, a no-op. Deliberately a literal copy,
  not derived from `v3Config` at build time — see the template's own
  comment for the drift caveat this trades for simplicity.
  `landing-v3/index.html` regenerated (`node build-static.mjs`); not yet
  promoted to `docs/` (`node promote.mjs`, a separate manual "ship this"
  step).

## Do now — correctness and misleading state

- [ ] **Finish Emergent 2024–25 and Dragons content; verify the new gallery release.**
  The two already-live destinations were corrected in `02757d6`: Emergent
  Technologies 2026–27 now points to its live `SSD_Student_Work` gallery, and
  Coding with AI points to its live nested page under Working with AI. The
  Creative Coding 2024–25 and 2023–24 are built and wired by `30c1de6`;
  **verified live 2026-09-16** — both routes return 200 with real
  content/assets. Emergent Technologies
  2024–25 is partially underway as Twine branching narratives blocked on
  background images. Dragons now has a native Cabinet page wired as `wip`
  (`6b9137e`), but it is still a stub with an empty image placeholder.
  Playing with Pulp is implemented (`c590b82`): 22 images, native page,
  Teaching hub/nav, and registry/generated data. Do not rebuild it in
  SSD Student Work: instructor-curated galleries belong flat under Cabinet
  Teaching. Verify its latest deployment, image rendering, and lightbox.
  **Interim fix, 2026-09-16 (`e3577bf`)**: the three unbuilt routes were dead
  links on the live Teaching hub until a new deploy-time validator (`#84`)
  caught them; softened to plain "gallery not yet published" text so the
  hub no longer misdescribes them as live. This item's actual publication
  work remained open then. Superseded for Pulp/Dragons by the commits above;
  only Emergent 2024–25 still uses unlinked text.
- [x] **Add gallery lightbox support** (`3e3a627`): `mkdocs-glightbox` added
  to requirements and MkDocs plugins. Hosted interaction verification remains open.
- [x] **Add the Fab hub and RIIDL lab links** (`65ce285`): native Fab index
  links the event pages, programme documentation, and RIIDL 2024/2025/2026 pages.
- [ ] **Reconcile Fab registry metadata with current sources.** Fab23 has a
  real captioned chronology (`e6f3275`, `966b81b`), but hidden `fab-23` still
  describes coursework with a blank href; `fab-26` still misnames Fab25 Czechia.
  Correct event records/routes and regenerate dependent outputs before promotion.
- [x] **Fix stale source-of-truth notes.** **Done, 2026-09-16 (`47ab009`)** —
  all four corrected:
  - `content/cabinet-sections.tsv`'s `web-tech` note now says active/mapped,
    not waiting on `#69`.
  - `content/cabinet-entries.tsv`'s `fabricademy` note now reflects the
    already-set href.
  - the four compass-entry notes now name the current `docs/compass/` paths.
  - `README.md` now describes the current six-repo/eight-destination
    manifest (`cb40b16`).
  - `BACKEND-AND-DEPLOY.md` was updated in `30c1de6`; not reopened.
- [x] **Reconcile the historical master todo with current reality.** **Done,
  2026-09-16 (`442ff95`, `50eab7e`, `a241ca3`)**: `#69`/`#76`/`#80`/`#81`/`#82`/`#84`
  annotated as done with commit refs and wrapped in the file's own
  `<details>` collapse convention (a structural bug in that convention —
  `#62`'s missing `<details>` open tag — was also found and fixed along the
  way); the stale 2026-08-30 immediate-priorities view replaced with a
  closure note; Phase 3A/3B+ (`#87`-`#120`) resolved into the specific named
  projects that actually exist as of the Jun–Sep 2026 launch period, per
  direct instruction, rather than left open for hypothetical future
  content. History preserved throughout, nothing deleted.
- [x] **Replace Cabinet's legacy Circle Packing duplicate with a WebTech link.**
  **Done, 2026-09-16 (`b667bc2`)**: `docs/fffx/PackingShapes.md` and its six
  essay images deleted, `docs/compass/about.md`'s stale link retargeted
  straight to FFFX's canonical page, and a `mkdocs-redirects`-based redirect
  added (pinned to `1.2.2` — same undeclared `properdocs` dependency problem
  as `mkdocs-section-index`, same fix) so Cabinet's old URL still resolves.
  Vera Molnar was already purely in FFFX; not part of this item's scope.

## Next — important system work

The shared review correctly observes that infrastructure is ahead of content.
Do not let this section displace the P0/P1 publication sprint in the companion
content todo; take these on when they remove a real maintenance or release risk.

- [ ] **Remove the manual Copy-config scratch-file step (`#141`).** Confirm the
  decision record from `#32`, then let the localhost dev tool write
  `landing-v3/pasted-config.json` through a narrow local endpoint or apply the
  payload directly. A normal browser page cannot silently write arbitrary
  files, so keep this inside the existing local-tool boundary; retain an
  explicit preview/confirmation before modifying source defaults.
- [x] **Generalize multi-repo assembly (`#82`).** Implemented in `30c1de6`:
  manifest, shared assembly mechanism, subfolders, destinations, required-file/
  content checks, and collision rejection. Future repo additions remain separate.
- [x] **Complete deployment validation coverage (`#84`).** **Done, 2026-09-16
  (`e3577bf`)** — all three remaining-scope bullets landed:
  - `docs/**/*.md` body links (including `docs/teaching/index.md`'s) are now
    checked, sourced from `mkdocs build`'s own "unrecognized relative link"
    log rather than a hand-rolled parser;
  - `wip`-status rows (not just `status: true`), `cabinet-sections.tsv`
    hrefs, self-domain `mkdocs.yml` nav targets, and explicit anchor/external
    handling are all now covered — see `tools/validate-deployment.js`'s own
    header for the full breakdown;
  - the last-successful-deployment invariant (`deploy: needs: build`) was
    already structurally explicit in `deploy.yml`; no separate change needed
    for that bullet specifically.
- [ ] **Empirically close failed-build safety (`#58`).** Use an existing failed
  Actions run, if available, to confirm the live deployment stayed on the last
  successful artifact. Do not deliberately break production merely to test it.
  **Partial evidence, 2026-09-16**: two real `build`-job failures this same
  day (`427687c`, `8e7e502`) both show `conclusion: failure` with no matching
  `deploy` run, via direct `api.github.com` queries (no `gh` CLI needed) —
  consistent with the structural argument, though the live site's served
  content still wasn't diffed before/after either window to fully close this.
- [ ] **Investigate MkDocs 2.0/plugin maintenance (`#142`).** Keep
  `mkdocs-section-index==0.3.10` pinned while assessing the real MkDocs Material
  migration warning and plugin compatibility. Do not install `properdocs` in
  response to its injected banner.
  **Same pattern caught again, 2026-09-16**: before adding `mkdocs-redirects`
  (for the Circle Packing retirement above), checked its `requires_dist` on
  PyPI first — `1.2.3`+ has the identical undeclared `properdocs` dependency,
  `1.2.2` doesn't. Pinned to `1.2.2` before it was ever installed. The
  genuine MkDocs 2.0 migration-risk question itself is still unevaluated.

## High-value easy wins

- [ ] **Update and bring the Data → Map → Page diagram into the repo (`#138`).**
  Add `promote.mjs` and its headless verification stage, then point Admin
  Controls at the local copy.
- [ ] **Complete cross-world and homeworld navigation (`#55/#92/#116`).** Every
  Level-1 world landing/page should visibly link to the other two worlds.
  Additionally, standalone repo-built subprojects—especially assembled or
  recursively copied HTML sites outside MkDocs—must link back to their owning
  homeworld. Audit Cabinet's eight assembled destinations plus Bookshelf's SciFi,
  Asimov, and Christie projects; do not assume MkDocs nav reaches into them.
  **Confirmed as a real gap, 2026-09-16**: grepped both sibling repos
  directly (now in this workspace) — neither `TheBookshelfOfCuriosities` nor
  `form-follows-fx` links back to `cabinetofcuriosities.in` anywhere in their
  `mkdocs.yml` nav or `docs/` content. Was previously "not checked, no local
  access"; now a confirmed-missing item, same status on both sides.
- [ ] **Add an explicit inventory allowlist/annotation mechanism.** Current
  inventory flags include intentional differences: nested Trippy Gourmet/Mad
  Solutionist nav links, map-only external world entries, and an in-page
  Teaching anchor. Keep true mismatches visible without teaching readers to
  ignore the entire Flags section.
- [ ] **Cross-reference `promote.mjs` and `index.template.html` path rewrites.**
  The fixed rewrite list is intentionally fail-loud, but each file should point
  maintainers to the other.
- [ ] **Decide how the sitemap gets refreshed after sibling-world changes.**
  The dashboard button lowers friction, but Bookshelf/FFFX changes can still
  leave Cabinet's cross-world sitemap stale (`#83/#117` territory).
- [ ] **Resolve `WORLD-SYSTEMS.md` divergence (`#28/#85`).** Decide whether the
  underscore-prefixed Cabinet asset convention should be adopted by Bookshelf
  and FFFX or documented as a permanent Cabinet-only exception.

## FFFX — structure and deployment

Audited again 2026-09-16 against `form-follows-fx` at committed HEAD `351fb1f`,
while preserving its existing modified and untracked files.

- [x] **FFFX strict build passes.** Commit `351fb1f` fixed Circle Packing's six
  image paths and malformed YouTube link. Reverified with
  `mkdocs build --strict` on 2026-09-16.
- [ ] **Commit the in-progress content set coherently.** The tracked generated
  landing data already names the new portal routes, while several matching
  Markdown files/folders are untracked. Commit source TSV, generated output,
  pages, and documentation together after review so a clean clone contains
  every route the landing page advertises.
- [x] **Remove the inherited `scifi asimov` deploy-copy loop.** **Done,
  2026-09-16 (`d723f74`)**: step removed entirely from FFFX's `deploy.yml`.
  If FFFX later assembles standalone projects, introduce an explicit
  manifest and validation (Cabinet's `content/external-repos.tsv` +
  `tools/assemble-external.js` is a ready template) rather than
  reintroducing hand-written per-repo steps.
- [ ] **Add deployment/content validation.** Check that each `status: true` or
  `wip` internal TSV href has a source page, generated TSV output is current,
  the strict MkDocs build passes, and required landing assets exist before the
  Pages artifact is uploaded. Cabinet's `tools/validate-deployment.js` (`#84`,
  substantially extended 2026-09-16) is a ready template for the same
  checks here — not yet ported to FFFX.
- [ ] **Add explicit return links to Cabinet and Bookshelf.** No cross-world
  destination was found in FFFX's `docs/` or content data. Make sibling-world
  navigation visible on the FFFX world page and add FFFX-home links to any
  standalone projects that do not inherit MkDocs navigation.
  **Confirmed still missing, 2026-09-16**: direct grep of this repo found
  zero links back to `cabinetofcuriosities.in` anywhere.
- [ ] **Reconcile the three `WORLD-SYSTEMS.md` copies.** FFFX's copy still
  describes old asset paths and says Bookshelf uses `docs/index.md`; both repos
  now use standalone `docs/index.html`. Update all worlds in one synchronized
  pass, preserving genuine schema differences.
- [ ] **Decide whether `mkdocs-section-index` is needed yet.** It is installed
  and pinned, but no FFFX nav section currently has an index page that uses it.
  Keep it only if near-term section hubs justify the dependency.
- [ ] **Unify TSV parsing when next touching the editor.** The CLI generator and
  Admin Dash retain separate parsing paths; share validation logic so editor
  acceptance and production generation cannot drift.

## Bookshelf — structure and deployment

Rechecked 2026-09-16 against `TheBookshelfOfCuriosities` at committed HEAD
`117a2cc`, plus modified TSVs and generated landing data.

- [x] **Christie publication routing fixed.** Commit `28fe92a` made
  `/christie/` canonical, created `projects/christie/index.html`, updated the
  TSV/generated landing data, and retained MkDocs nav on `/christie/`.
  Reverified with a strict Bookshelf build and assembled entry-point check on
  2026-09-16.
- [ ] **Validate assembled project entry points.** The workflow copies every
  `projects/*/` directory without checking for `index.html`; this allowed the
  Christie mismatch. Require an entry point and any essential assets for every
  copied project, and reject destination collisions with MkDocs output.
- [ ] **Avoid deploying project-internal research files by default.** The broad
  recursive copy publishes project documentation, conversations, source data,
  and superseded prototypes along with runtime assets. Define a publishable
  subtree or per-project manifest instead.
- [ ] **Finish Bookshelf's pending custom-landing integration.** Review and
  commit the Favourite Poetry TSV/generated-data changes coherently. My Writings
  has already moved to Cabinet (`39a2adb`, Bookshelf `117a2cc`); do not restore
  its Bookshelf pages, nav, or card. No redirect/breadcrumb is required.
- [ ] **Add explicit return links to Cabinet and FFFX.** No cross-world links
  were found in Bookshelf's `docs/` or content registries. Also add a Bookshelf
  home link inside the standalone SciFi, Asimov, and Christie projects, which do
  not inherit MkDocs navigation.
  **Confirmed still missing, 2026-09-16**: direct grep of this repo found
  zero links back to `cabinetofcuriosities.in` anywhere, same as FFFX.
- [ ] **Add CI parity checks.** Run strict MkDocs, regenerate/compare landing
  data, validate active hrefs, and smoke-test `/scifi/`, `/asimov/`, and the
  chosen Christie route in the assembled artifact.
- [ ] **Recover the original SciFi and Asimov conversation records if still
  available.** README flags both as archival gaps; keep them inside their own
  project folders, not top-level documentation.

## Later — visual and optional development

- [ ] `#15` — decide whether the HTML title/tagline should scale with the SVG,
  use a clamped responsive size, or intentionally stay fixed.
- [x] `#22` — **resolved stale, 2026-09-22**: Playwright QA confirmed the
  card/label overlap it describes doesn't reproduce on the current v3 map
  (it described a pre-v3 card UI that no longer exists). Surfaced a
  separate content-doc finding in passing: "Interfaces/Data/Texts" (the
  section it names) doesn't exist in the current map at all, only in the
  meta description — worth reconciling next time content docs are touched.
- [x] `#37` — **fixed, 2026-09-23**: the Teaching-cluster collision
  ("Student Work - Emergent Technology" running into "Working with AI")
  is resolved — added an optional `tagline` field (new entries-schema
  column, see `CABINET-EDITOR.md` v1.7) rendered as a smaller second line
  under an island label; this entry is now "Emergent Technology" / tagline
  "Student Work". Verified clear via Playwright
  (`review/qa-2026-09-23/teaching-cluster-after-tagline-fix.png`). Scoped
  fix, not a systemic one: island labels still have no general
  collision-avoidance (unlike the compass rose's labels), so a *different*
  future crowded cluster could still collide — not built here, on purpose.
  **Follow-up, 2026-09-23**: the other three "Student Work - X" entries
  (`students-creative-coding-2025-26/2024-25/2023-24`) had the same
  pattern baked into a single-line title instead of using the tagline
  field — split all three the same way (title = project name, tagline =
  "Student Work"). `content/cabinet-entries.tsv` updated, regenerated
  via `tools/build-cabinet-content.js` and `build-static.mjs`.
- [x] `#39` — **investigated, 2026-09-22**: structurally passes at every
  width (1920 down to 360px) — no clipping, no edge cutoff, header reflows
  correctly. One real concern, split out as its own item since it's a
  distinct question: `#143` — mobile label legibility (labels shrink to
  ~6px tall at phone widths; technically readable via pinch-zoom, but
  nothing on-page signals that).
- [ ] `#143` — mobile label legibility. **Direction decided, 2026-09-23, not
  built**: keep the current shrink-to-fit view as default (still
  pinch-zoomable), add an explicit "fullscreen"-type corner control that
  switches to a fixed legible scale (100% or 75%, judged visually) inside a
  pannable container. Needs a concrete technical plan before implementation
  — see the item's own entry in the historical ledger for the open
  questions (what "100%" means in the SVG's own coordinate space, whether
  the toggle persists, where the control sits relative to the compass
  rose).
- [ ] `#68` — make the MkDocs visual system feel like the landing map. Treat as
  a real design pass; the first pale-accent attempt was rejected.
- [ ] `#139/#140` — scope dragon and boat management controls before building
  more dev-panel surface.
- [ ] `#2/#30/#63/#65` — reference/artwork-dependent wave, boat, and compass
  work. Keep blocked until the required visual direction or artwork exists.
- [x] `#144` — **fixed, 2026-09-23**: improved island/section label
  hover highlighting. Discussed direction first (no design was decided):
  chose to strengthen the existing `data-label-style` halo/glow system
  rather than add a new background-plate mechanism, applied to both
  island and section labels. `halo` hover's stroke-width now 3px → 4.5px
  (sections previously had no stroke change on hover at all); `glow`
  hover gets an extra stacked `drop-shadow` pass at a larger radius.
  Entry taglines inherit it automatically (same `<text>` element).
  `plain` untouched by design. **Colours corrected same day** after
  reviewing live in the dev tool: entries now keep their ambient ink
  fill on hover (no more inverting to amber) and get a white
  `--v3-halo-ink` halo/glow instead; sections keep their existing
  white hover fill but get a dark `--v3-ink` halo/glow (the treatment
  entries used to have), since a white halo would've had no contrast
  against their already-white hover text. **Glow density bumped again,
  2026-09-23**: entry white glow still read as too faint — radius
  5px → 7px plus a 4th stacked `drop-shadow` pass. **Ambient (non-hover)
  amber glow also bumped, 2026-09-23**: 3.5px x2 → 5px x3 (stays below
  hover's 7px x4 so hover still reads as more prominent). Rebuilt via
  `build-static.mjs`.
- [x] **Bottom-of-page text replaced, 2026-09-23**: `.v3-footnote` (visible,
  not a dev-only placeholder) held a build note ("Static build -- see
  build-static.mjs..."); replaced with a real public-facing "about this
  Cabinet" blurb, direct text supplied. `index.template.html` updated,
  rebuilt via `build-static.mjs`.
- [ ] `#137` — finer coast-level entry tier. Keep speculative until it has a
  content use case and interaction design.
- [ ] `#135/#136` — analytics rollout to sibling and assembled repos, after
  deciding whether they are separate Cloudflare properties and obtaining the
  corresponding tokens.
  **Confirmed live, 2026-09-16**: fetched all three sites directly — the
  Cloudflare beacon is present only on `cabinetofcuriosities.in`; Bookshelf
  and FFFX have neither the beacon nor any `overrides/`/`custom_dir` wiring
  to carry it (subdomain proxying through the same Cloudflare zone doesn't
  inject it). Also fetched two assembled pages (`/teaching/working-with-ai/`,
  an SSD gallery) directly: the assembly pipeline (`tools/assemble-external.js`,
  a raw file copy with no HTML transformation) cannot carry it either, so
  `#136` genuinely needs per-repo work, not a deployment-system fix.

## Definition of website-ready

- [ ] No published hub links point at absent local or assembled routes.
  **Substantially enforced now, 2026-09-16**: `#84`'s extended validator
  checks doc-body links, entries/sections, and nav targets on every deploy;
  not the same as a standing guarantee for content not yet written.
- [ ] Every active TSV href is represented in the generated landing page and
  resolves in the built/deployed artifact.
- [ ] `mkdocs build --strict`, map build/promote verification, and assembly
  validation all pass from a documented single workflow.
- [ ] Failed builds are empirically confirmed not to replace the last good
  deployment. **Partial evidence, 2026-09-16** — see `#58` above.
- [ ] Cabinet, Bookshelf, and FFFX link back to one another. **Confirmed
  false, 2026-09-16** — see the cross-world nav item above; this is a real
  gap, not an unchecked assumption.
- [ ] The About and Colophon essentials in the companion content todo are
  published, then the maintainer explicitly decides when public link-sharing
  warrants the `launched` tag.
