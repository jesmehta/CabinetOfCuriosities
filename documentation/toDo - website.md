# ToDo — Website

Current website, tooling, build, deployment, and cross-world work for the
Cabinet and its two sibling worlds. Cabinet was audited 2026-09-12 against the
repository at `ec1f6df`, the open
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

- [x] `main` is clean apart from the maintainer's in-progress
  `documentation/scratchNotes.md` edit and these new todo documents.
- [x] `mkdocs build --strict` completes successfully as of 2026-09-16. Commit
  `46160a0` corrected the Colophon's `jesalmehta.com` link. The informational
  relative-link messages are assembled/non-MkDocs routes and remain covered by
  final-artifact validation.
- [x] The v3 landing page is generated and promoted; active TSV-backed map
  links are present in the static page.
- [x] Cabinet has a working local TSV editor and Admin Controls dashboard.
- [x] Bookshelf and FFFX also have their own schema-specific TSV editors and
  local dashboards. Historical `#81` is complete across all three worlds.
- [x] The deploy workflow assembles six external repositories: Working with
  AI, Prompt Generator, Oblique Strategies, SSD Student Work 2025–26, Swatch
  Fields, and Tracery Bots.
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

## Do now — correctness and misleading state

- [ ] **Repair unpublished links on the Teaching hub.**
  `docs/teaching/index.md` currently links to six routes that neither exist in
  `docs/` nor get assembled by `.github/workflows/deploy.yml`:
  `ssd-creative-coding-2024-25/`, `ssd-emergent-tech-2026-27/`,
  `ssd-emergent-tech-2024-25/`, `dragons-of-ssd/`, `ssd-papiermache`, and
  `coding-with-ai/`. Their content readiness is not uniform: the maintainer
  confirms Emergent Technologies 2026–27 is live at
  `https://jesmehta.github.io/SSD_Student_Work/ssd-emergent-tech-2026-27/`
  and confirmed that Coding with AI branched from, but should stand independently
  alongside, Working with AI at
  `https://cabinetofcuriosities.in/teaching/working-with-ai/`; its live nested
  page is
  `https://cabinetofcuriosities.in/teaching/working-with-ai/coding-with-ai/index.html`.
  The hub's current relative `coding-with-ai/` link therefore points at the
  wrong route. Creative Coding
  2024–25 needs assembly; Emergent Technologies
  2024–25 is partially underway as Twine branching narratives blocked on
  background images; and the two papier-mâché galleries need
  curation from the image archive. Wire the live destinations and assemble the
  existing gallery instead of treating all six as missing content.
- [ ] **Fix stale source-of-truth notes.** They do not currently break the
  build, but they actively misdescribe the system:
  - `content/cabinet-sections.tsv` says `web-tech` has `status: false`, uses
    the old `interfaces-data-texts` name, and needs `#69`; the actual row is
    `status: true` and ships on the map.
  - `content/cabinet-entries.tsv`'s `fabricademy` note says its href is blank;
    it actually points to the 2026 personal Fabricademy site.
  - the four compass-entry notes still name the old flat `docs/about.md`,
    `docs/now.md`, `docs/colophon.md`, and `docs/sitemap.md` paths.
  - `README.md` still documents only two of the six assembled repositories.
  - `BACKEND-AND-DEPLOY.md` still names `SSD_CreativeCodingPage` and the old
    mount grouping instead of `SSD_Student_Work`'s year-specific subfolder.
- [ ] **Reconcile the historical master todo with current reality.** Mark or
  annotate `#69`, `#81`, and the completed portion of `#80`; keep `#76` open
  because
  the existing Site Notes page describes v1 (2024). Resolve `#76` by folding
  its useful historical material into the Colophon, then remove the current
  standalone page/nav entry. Its original rendered version is already preserved
  at `archived-landing-pages/v1/site_notes/index.html`; replace the stale
  2026-08-30 immediate-priorities view; decide whether these two focused files
  complete the remaining split intended by `#126`. Preserve its history rather
  than deleting it.
- [ ] **Fix the malformed external link in `docs/fffx/PackingShapes.md`.** The
  Dan Shiffman YouTube link has two opening parentheses and is emitted as an
  unrecognized relative link by MkDocs. This is a one-character easy win.

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
- [ ] **Generalize multi-repo assembly (`#82`) before adding many more repos
  (`#80/#90/#105`).** Replace repeated Checkout/Assemble/Validate YAML blocks
  with a manifest and one validated assembly mechanism. Include source repo,
  optional source subfolder, destination, and required-file/content checks.
- [ ] **Strengthen deployment validation (`#84`).** At minimum:
  - reject destination collisions, especially anything that could overwrite a
    MkDocs-built section hub;
  - verify every public link from `docs/teaching/index.md` has either a local
    MkDocs source or an assembly-manifest destination;
  - check generated map hrefs and nav targets against the built artifact;
  - keep the last-successful-deployment dependency invariant explicit.
- [ ] **Empirically close failed-build safety (`#58`).** Use an existing failed
  Actions run, if available, to confirm the live deployment stayed on the last
  successful artifact. Do not deliberately break production merely to test it.
- [ ] **Investigate MkDocs 2.0/plugin maintenance (`#142`).** Keep
  `mkdocs-section-index==0.3.10` pinned while assessing the real MkDocs Material
  migration warning and plugin compatibility. Do not install `properdocs` in
  response to its injected banner.

## High-value easy wins

- [ ] **Update and bring the Data → Map → Page diagram into the repo (`#138`).**
  Add `promote.mjs` and its headless verification stage, then point Admin
  Controls at the local copy.
- [ ] **Complete cross-world and homeworld navigation (`#55/#92/#116`).** Every
  Level-1 world landing/page should visibly link to the other two worlds.
  Additionally, standalone repo-built subprojects—especially assembled or
  recursively copied HTML sites outside MkDocs—must link back to their owning
  homeworld. Audit Cabinet's six assembled repositories plus Bookshelf's SciFi,
  Asimov, and Christie projects; do not assume MkDocs nav reaches into them.
- [ ] **Add an explicit inventory allowlist/annotation mechanism.** Current
  inventory flags include intentional differences: nested Trippy Gourmet/Mad
  Solutionist nav links, nav-only Site Notes, map-only external world entries,
  and an in-page Teaching anchor. Keep true mismatches visible without teaching
  readers to ignore the entire Flags section.
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
- [ ] **Remove the inherited `scifi asimov` deploy-copy loop.** Neither folder
  belongs to FFFX, so the step is currently a silent no-op copied from an older
  Bookshelf workflow. If FFFX later assembles standalone projects, introduce an
  explicit manifest and validation rather than retaining misleading code.
- [ ] **Add deployment/content validation.** Check that each `status: true` or
  `wip` internal TSV href has a source page, generated TSV output is current,
  the strict MkDocs build passes, and required landing assets exist before the
  Pages artifact is uploaded.
- [ ] **Add explicit return links to Cabinet and Bookshelf.** No cross-world
  destination was found in FFFX's `docs/` or content data. Make sibling-world
  navigation visible on the FFFX world page and add FFFX-home links to any
  standalone projects that do not inherit MkDocs navigation.
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

Audited again 2026-09-16 against `TheBookshelfOfCuriosities` at committed HEAD
`28fe92a`, plus clearly separated maintainer working-tree changes.

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
- [ ] **Split the in-progress Bookshelf custom-landing changes by destination.**
  Favourite Poetry belongs in Bookshelf and its pending card can be verified and
  committed. My Writings is already live there, but is planned to move to
  Cabinet; do not deepen its Bookshelf landing integration before deciding the
  migration/redirect sequence. Keep TSV and generated JS synchronized.
- [ ] **Add explicit return links to Cabinet and FFFX.** No cross-world links
  were found in Bookshelf's `docs/` or content registries. Also add a Bookshelf
  home link inside the standalone SciFi, Asimov, and Christie projects, which do
  not inherit MkDocs navigation.
- [ ] **Add CI parity checks.** Run strict MkDocs, regenerate/compare landing
  data, validate active hrefs, and smoke-test `/scifi/`, `/asimov/`, and the
  chosen Christie route in the assembled artifact.
- [ ] **Recover the original SciFi and Asimov conversation records if still
  available.** README flags both as archival gaps; keep them inside their own
  project folders, not top-level documentation.

## Later — visual and optional development

- [ ] `#15` — decide whether the HTML title/tagline should scale with the SVG,
  use a clamped responsive size, or intentionally stay fixed.
- [ ] `#22/#37/#39` — label/card overflow and desktop/mobile QA. Still
  explicitly backburnered, but run before applying the final `launched` tag.
- [ ] `#68` — make the MkDocs visual system feel like the landing map. Treat as
  a real design pass; the first pale-accent attempt was rejected.
- [ ] `#139/#140` — scope dragon and boat management controls before building
  more dev-panel surface.
- [ ] `#2/#30/#63/#65` — reference/artwork-dependent wave, boat, and compass
  work. Keep blocked until the required visual direction or artwork exists.
- [ ] `#137` — finer coast-level entry tier. Keep speculative until it has a
  content use case and interaction design.
- [ ] `#135/#136` — analytics rollout to sibling and assembled repos, after
  deciding whether they are separate Cloudflare properties and obtaining the
  corresponding tokens.

## Definition of website-ready

- [ ] No published hub links point at absent local or assembled routes.
- [ ] Every active TSV href is represented in the generated landing page and
  resolves in the built/deployed artifact.
- [ ] `mkdocs build --strict`, map build/promote verification, and assembly
  validation all pass from a documented single workflow.
- [ ] Failed builds are empirically confirmed not to replace the last good
  deployment.
- [ ] Cabinet, Bookshelf, and FFFX link back to one another.
- [ ] The About and Colophon essentials in the companion content todo are
  published, then the maintainer explicitly decides when public link-sharing
  warrants the `launched` tag.
