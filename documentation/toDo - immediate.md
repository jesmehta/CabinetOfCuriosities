# ToDo - Immediate

Quick wins and urgent work selected from [Content](toDo%20-%20content.md) and
[Website](toDo%20-%20website.md). Reconciled with local Git history and source
on 2026-09-24, through fetched Cabinet `origin/main` `9f8185d`, Bookshelf
`eda5c8e`, and FFFX `a49c771`. SSD Student Work's earlier check was at
`5b4188c`. The longlists retain broader scope.
Completion below means committed implementation, not a verified live deployment.

## Urgent - verify the latest release

- [ ] **Finish the remaining Teaching content, not already-fixed route gaps.**
  - Emergent Technologies 2024-25: finish the existing Twine narratives and
    background images, then assemble/publish `ssd-emergent-tech-2024-25/`.
  - Dragons of SSD: stub page exists (`docs/teaching/dragons.md`, linked
    live, `cabinet-entries.tsv` `status: wip`) -- still needs curation from
    the photo archive and student Drive submissions into
    `docs/_images/dragons-of-ssd/` and real gallery content in place of the
    "coming soon" copy, then flip to `status: true`.
  - Emergent 2024-25 remains honest, unlinked "gallery not yet published" text.
    No current Teaching hub link points to its absent route.

## Quick win - small correction with visible value

- [ ] **Finish Fab metadata and presentation.** Fab23's captioned image
  chronology and the Fab hub now exist (`e6f3275`, `65ce285`, `966b81b`). The
  hidden `fab-23`/`fab-25` (formerly `fab-26`) TSV records are now corrected
  to their event identities/routes (`b3c3bc6`); remaining: add Fab23's
  personal account and curate its image dump. Fab25 remains a stub.
  RIIDL lab links are already present in the hub; do not re-add them.

## Next bounded content pass

- [ ] **Finish About's remaining assets.**
  - Replace/remove the bookshelves and interest-link authoring placeholders.
  - Resolve the cycling image/narrative TODO.
  - Embed readable CV content and add a downloadable PDF.
  - Main About writing and imagery have already received substantial updates
    (`daf2c4b`, `9f2d646`, `4b7ef4e`); this is an asset/CV finish, not a rewrite.
- [ ] **Publish Dance of Planets and Island Generator in FFFX.** Integrate the
  existing implementations, select example images, and write explanatory pages.
  Dance of Planets has an untracked stub page; Island Generator still needs
  its canonical page/registry entry. Commit filled sources before promotion.
- [ ] **Finish Lenticular next.** Complete remaining tool code and DOM controls,
  then add the embed, examples, and explanatory project page.
- [ ] **Turn the Branching Narrative/Twine page from stub into a real entry.**
  Confirm the experience still works, add a concise explanation and at least
  one representative screenshot, then review its live metadata/navigation.
- [ ] **Rewrite the Machines & Makings hub as a purposeful concise index.**
  Replace its “under construction” framing with orientation around MiniLoom and
  an honest indication of forthcoming groups; brevity is acceptable for a hub.
- [ ] **Retire Cabinet's remaining Vera Molnar duplicate.** Move any unique
  material from frozen `docs/fffx/VeraMolnarRetrospective.md` into FFFX's
  canonical filled page, then remove/redirect the Cabinet copy using the proven
  Circle Packing pattern.
- [ ] **Add first real thumbnails where assets already exist (`#23/#86/#91`).**
  Start with Dot Mandala, MiniLoom, and About; first confirm and document the
  landing renderer's expected thumbnail path/format, then update source TSV and
  regenerate/promote rather than editing generated output directly.
- [ ] **Finish Favourite Poetry's Bookshelf landing integration.** Review and
  commit the pending TSV/generated-card changes as one coherent set. The
  collection is already filled and live in MkDocs; this is discoverability,
  not a new writing project.
- [ ] **Publish one intentionally growing FFFX collection as the next tranche.**
  Choose Genuary (generated images already exist) or 100 Gradients (roughly a
  dozen completed works), curate a coherent initial release, and design it to
  accept later additions without waiting for a fictional final endpoint.

## Next website pass

- [ ] **Connect Origami Tools to Cabinet and clean up its interface.** Audit the
  sibling `origami-tools` repo, choose its canonical Cabinet route and assembly
  method, simplify and polish the interface, check responsive behaviour and core
  interactions, then add truthful registry/navigation wiring and validate the
  deployed route before activating Origami & Paper.
- [ ] **Complete sibling-world and project-home navigation (`#55/#92/#116`).**
  Make Cabinet, Bookshelf, and FFFX visibly link to both sibling worlds. Audit
  return links in Cabinet's eight assembled destinations and Bookshelf's SciFi,
  Asimov, and Christie projects, which do not inherit MkDocs navigation.
- [ ] **Bring sibling deployment checks up to parity.** Require Bookshelf
  standalone entry points, reject assembly collisions, and validate both
  siblings' active destinations and generated data before upload.
  Several FFFX WIP page sources are untracked and absent from a clean clone;
  resolve those before public promotion. Both sibling working trees currently
  contain changes: Bookshelf TSV/generated landing edits, and FFFX section,
  documentation, and untracked project-page edits. Review and commit coherent
  source/generated sets; do not assume untracked pages exist in a clean clone.
- [ ] **Plan and implement mobile map inspection (`#143`).** Keep shrink-to-fit
  as the default; add the decided opt-in corner control for a fixed-legible-scale,
  pannable view. Resolve scale, placement, and persistence before coding.
- [ ] **Resolve severe entry-name overflow (`#145`).** Choose a rule for labels
  extending substantially beyond their island—wrapping, measured shrinking,
  editorial limits, or a defined tolerance—without breaking taglines.
- [ ] **Remove the manual Copy-config paste bottleneck (`#141`).** Within the
  existing localhost-tool boundary, add a narrow confirmed write/apply path for
  `landing-v3/pasted-config.json`; preserve preview and explicit confirmation.
- [ ] **Bring the Data → Map → Page diagram into the repo (`#138`).** Add the
  `promote.mjs` path-rewrite and headless-verification stage, retain editable
  diagram source, and repoint Admin Controls from the external artifact.
- [ ] **Make Content Inventory exceptions explicit.** Add annotations or an
  allowlist for intentional nested bot pages, map-only world links, and in-page
  anchors so true mismatches remain conspicuous instead of becoming flag noise.
- [ ] **Cross-reference the two promotion rewrite sources.** Point
  `landing-v3/promote.mjs` and `landing-v3/index.template.html` at one another
  beside their fixed rewrite assumptions so future path edits stay synchronized.
- [ ] **Decide and document sibling-triggered refresh behaviour (`#83/#117`).**
  Cabinet's sitemap can go stale after Bookshelf/FFFX changes; choose between
  automated repository dispatch/rebuilds and an explicit manual refresh contract.
- [ ] **Resolve the three `WORLD-SYSTEMS.md` copies (`#28/#85`).** Synchronize
  stale landing/asset descriptions while documenting genuine schema differences,
  especially Cabinet's underscore-prefixed asset convention.

## Recently completed - keep out of the work queue

- [x] **Creative Coding 2024-25/2023-24 deployment verified** (2026-09-16):
  Actions succeeded and both assembled routes, titles, content, and assets
  returned HTTP 200; obsolete “not yet pushed” notes were removed.
- [x] **Playing with Pulp initial gallery published** (`c590b82`): native flat
  Teaching page with 22 images. **Dragons route and WIP stub wired** (`6b9137e`);
  only its real curation remains in the active Teaching task.
- [x] **Deployment-validator coverage completed** (`e3577bf`; `#84`): active
  and WIP entry/section routes, self-domain nav, Markdown links, archived-page
  ordering, generated-content drift, and the full local pipeline are checked.
- [x] **WebTech hub rewritten and canonical FFFX Circle Packing linked**
  (`8e7e502`, `b667bc2`): Cabinet duplicate removed with a legacy redirect.
- [x] **Source-of-truth notes corrected** (`47ab009`, `cb40b16`).
- [x] **Historical ledger reconciled** (`442ff95`, `50eab7e`, `a241ca3`).
- [x] **FFFX's inherited `scifi asimov` deploy loop removed** (`d723f74`).
- [x] **My Writings moved from Bookshelf to Cabinet** (Cabinet `39a2adb`,
  Bookshelf `117a2cc`); Favourite Poetry and British Poetry Workshop remain.
- [x] **Cloudflare Web Analytics rolled out beyond Cabinet (`#135/#136`)**
  (`f9102df`): Bookshelf, FFFX, and all six assembled source repositories use
  Cabinet's shared token. Local source/build coverage is complete. Live firing,
  dashboard ingestion, and shared-homepage-path behaviour remain the deliberately
  non-urgent verification item `#146`, not rollout implementation.
- [x] **Landing-map hover treatment shipped** (`8108b88`, `a6fbe48`; `#144`).
- [x] **Default-theme first-frame flash fixed and production promoted**
  (`a345970`, `a6fbe48`).
- [x] **Abandoned sea-serpent prototype archived** (`b40750c`).
- [x] **Fab23/Fab25 registry metadata corrected and outputs regenerated**
  (`b3c3bc6`). The event write-ups remain content work above.
- [x] **About and Colophon drafting substantially advanced** (2026-09-15-16).
  Colophon writing/publication cleanup is complete; About assets/CV remain above.
- [x] **Colophon external link corrected** (`46160a0`).
- [x] **Already-live Teaching links corrected** (`02757d6`): Emergent
  Technologies 2026-27 and Coding with AI's nested Working with AI route.
- [x] **Site Notes retired** (`80d4970`, `b441b0c`): nav/source removed,
  manifest/inventory updated, original retained in the v1 archive.
- [x] **Multi-repo assembly generalized** (`30c1de6`): manifest plus shared
  assembly script, required-file/content checks, and collision rejection.
- [x] **Deployment safeguards committed** (`30c1de6`): strict MkDocs build,
  generated-content drift check, and active local entry-route validation.
  Coverage expanded in `e3577bf`; latest hosted gallery/lightbox checks remain.
- [x] **Creative Coding 2024-25 and 2023-24 built and wired** (SSD commits
  above; Cabinet `30c1de6`). Deployment verified 2026-09-16, as recorded above.
- [x] **FFFX Circle Packing paths/link repaired** (`351fb1f`).
- [x] **Bookshelf Christie routing corrected** (`28fe92a`): `/christie/`
  is canonical with a standalone entry point.
- [x] **Replicate CLAUDE.md additions on the home terminal.**
  - Done 2026-09-16 on the home terminal. Since that machine's working
    directories don't match `d:\FabWorld\CLAUDE.md`'s roots, the file was
    created at `F:\__SnowCrash\CLAUDE.md` (untracked — `F:\__SnowCrash` is
    not itself a git repo) with the same Git-commits section and a
    Workspace-boundaries list adjusted to that machine's actual roots:
    `F:\__SnowCrash\__WebPages`, `F:\__SnowCrash\_FabSite`,
    `F:\__SnowCrash\__Project_Complex`, `F:\__SnowCrash\_Scripts`, and
    `D:\Downloads\Nifty Decon`.
