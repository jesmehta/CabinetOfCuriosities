# ToDo - Immediate

Quick wins and urgent work selected from [Content](toDo%20-%20content.md) and
[Website](toDo%20-%20website.md). Reconciled with local Git history and source
on 2026-09-29, through Cabinet `5d603cc`, Bookshelf
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
- [ ] **Launch Dance of Planets v3.0 in FFFX.** The tool is built and pushed
  at FFFX `projects/dance-of-planets/` (`8f993b0`..`0656c73`) but is not
  deployed: FFFX's `deploy.yml` has no `projects/` copy step (the old
  scifi/asimov one was removed in `d723f74`). Port Bookshelf's
  `projects/*/` copy loop, point the `harmonics-dance-of-planets` entry at
  `dance-of-planets/` with the right `location`, wire FFFX's README and
  FILE-MANIFEST, then verify the live `/dance-of-planets/` route. Details:
  FFFX `projects/dance-of-planets/documentation/TODO.md`.

## Next bounded content pass

- [ ] **Finish About's remaining assets.**
  - Replace/remove the bookshelves and interest-link authoring placeholders.
  - Resolve the cycling image/narrative TODO.
  - Embed readable CV content and add a downloadable PDF.
  - Main About writing and imagery have already received substantial updates
    (`daf2c4b`, `9f2d646`, `4b7ef4e`); this is an asset/CV finish, not a rewrite.
- [ ] **Write the Dance of Planets writeup in FFFX.** The interactive tool is
  done (launch step above); what remains is the writeup page (Dance of Venus,
  the code, captured visuals) replacing the untracked stub
  `docs/tools-and-libraries/harmonics-dance-of-planets.md`. Not urgent, but
  next in line after the launch. Commit filled sources before promotion.
- [ ] **Publish Island Generator in FFFX.** Integrate the existing
  implementation, select example images, and write its explanatory page; it
  still needs its canonical page/registry entry. Commit filled sources before
  promotion.
- [ ] **Finish Lenticular next.** Complete remaining tool code and DOM controls,
  then add the embed, examples, and explanatory project page.
- [ ] **Turn the Branching Narrative/Twine page from stub into a real entry.**
  Confirm the experience still works, add a concise explanation and at least
  one representative screenshot, then review its live metadata/navigation.
- [ ] **Rewrite the Machines & Makings hub as a purposeful concise index.**
  Replace its “under construction” framing with orientation around MiniLoom and
  an honest indication of forthcoming groups; brevity is acceptable for a hub.
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

- [ ] **Dualize the Cabinet boats and redraw them in side view.** Replace the
  current boat treatment with the requested dual/side-view artwork while
  preserving their flow-field motion, theme legibility, scale, and performance.
- [ ] **Rework island-label overflow and background glow (`#145`).** Long entry
  names still spill too far beyond their islands, and the background treatment
  needs another visual pass. Test wrapping, measured scaling, or another
  width-aware treatment without breaking the existing tagline line.
- [ ] **Make the non-hover label glow match its section colour.** Keep hover
  emphasis distinct, but derive each label's ambient/background glow from its
  owning section rather than applying one generic non-hover colour.
- [ ] **Restore the dragon baseline.** Identify whether the missing baseline is
  artwork, styling, clipping, or positioning; restore it consistently in the
  editable landing source and promoted build.
- [ ] **Tune the first offshore colour band.** It currently reads too dark and
  too detached from the cream background. Bring its value and spacing closer
  to the surrounding sea/background while retaining a readable coast edge.
- [ ] **Create deliberate cellphone versions of all three worlds.** Audit
  Cabinet, Bookshelf, and FFFX at representative phone widths and design their
  mobile presentation rather than treating desktop shrinkage as sufficient.
  For Cabinet, incorporate `#143`'s decided opt-in fixed-scale pannable map view.
- [ ] **Give the compass moon a visual click cue.** Add a restrained hover,
  affordance, or microcopy hint that communicates interactivity without
  overloading the compass or revealing more than the easter egg needs.
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

- [x] **Homepage top band given colour and texture** (`7eda448`, `eca9c91`):
  was hardcoded white; now fixed light cream (not theme-driven -- non-medieval
  seas are dark) with a seeded sepia ripple-dash tile. See `README.md`'s
  changelog.
- [x] **Homepage top band: right-hand map hint** (`7eda448`, `b34f956`):
  *The Map is not the Territory* / hover to have a better look, / click to
  enter. Stacks under the subtitle on phones.
- [x] **Homepage compass recoloured** (`8bcb8d4`): navy -> light coast blue
  `#939fba`, dark silhouette outline kept. Stopgap geometry workaround; the
  layered-artwork replacement is open in `toDo - website.md`.
- [x] **Homepage footnote text enlarged** (`7eda448`): the "Cabinets of
  Curiosities were personal collections..." blurb, 0.85rem -> 1.05rem.
- [x] **Cabinet's duplicate Vera Molnar page retired** (`8681e7c`): confirmed
  byte-identical to FFFX's canonical page, deleted, and its old URL redirected.
- [x] **Small copy-error pass completed** (`5d603cc`): fixed “percieve” in
  Teaching, “completly” in Dot Mandala, and “geogrpahy” in About; the previously
  noted “Olderpage” text was no longer present.
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
