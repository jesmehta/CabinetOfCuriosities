# ToDo — Content

Current Cabinet content and information-architecture work. Reconciled again
2026-10-01 through Cabinet `acb5d16`, Bookshelf `bdddbe9`,
and FFFX `6ac3e3a`. Original audit
2026-09-12
against:

- `content/cabinet-sections.tsv` and `content/cabinet-entries.tsv`;
- the generated `documentation/CONTENT-INVENTORY.md`;
- the baked v3 landing page (`docs/index.html`);
- `mkdocs.yml`;
- every Markdown source under `docs/`;
- the assembly manifest's eight destinations from six source repositories;
- recent content/reorganization commits and `documentation/scratchNotes.md`;
- a direct 2026-09-13 audit of `form-follows-fx` and
  `TheBookshelfOfCuriosities`, including their working trees, TSVs, generated
  landing data, MkDocs nav, native content, standalone projects, workflows,
  project-level todos, and strict builds.

The supplied ChatGPT share URL initially returned only a generic/login page.
The saved conversation at `_temp/Review Cabinet Repo Structure.html` was then
reviewed directly.
Its recommended emphasis—pause broad infrastructure expansion and gain visible
density through bounded content pieces—is reflected below. Current repository
evidence overrides older observations in that discussion: the SSD Student Work
restructure and 2025–26 assembly are now complete.

## Priority rule from the combined audit

Do not aim for two or three entries in every possible Cabinet category. Use
smaller, legible completion tests:

- Cabinet: no *visible* section is empty or points to missing content;
- Teaching: three or four genuine student galleries;
- Bookshelf: five genuine entries;
- FFFX: five genuine entries.

This keeps reserved sections honest while directing effort toward places where
one bounded piece materially changes how complete the ecosystem feels.

## How to read the audit

`Landing` means the v3 map, not a section's MkDocs hub page.

Publication state and content maturity are separate. A file can exist and even
be linked while still containing only a stub; conversely, a landing/index page
can be intentionally brief because its job is navigation rather than exposition.

| State | Meaning |
|---|---|
| **Live** | The relevant source exists and the public surface points somewhere real. |
| **Partial** | Some useful content exists, but the hub, wiring, metadata, or promised destinations are incomplete. |
| **Reserved** | A deliberate stub or hidden TSV row; not a defect until real content is ready. |
| **Mismatch** | Two surfaces disagree, or a live link promises a route that is absent. |

| Content maturity | Meaning |
|---|---|
| **Absent** | No destination/source file exists. |
| **Stub** | A file exists, but contains little beyond a heading, promise, prompt, or construction note. File presence is not completion. |
| **Filled** | The page/project has substantive visitor-facing material and performs its stated purpose. It may still need editing or technical repair. |
| **Intentionally concise index** | A short landing page successfully explains the collection and routes visitors to filled children. More prose is optional, not automatically a todo. |
| **Stale** | Material is substantial but describes an older state, so word count cannot make it current. |

Word counts below are evidence for review, not automatic thresholds. The test is
whether the page fulfils its role.

Completion marks describe source/committed implementation, not newly verified
live deployments. Counts and build results from the original audits are dated
observations, not a claim that every build or hosted page was rechecked today.

## Essential content — do first

- [ ] **Finish the remaining About assets
  (`#42/#66/#74`).** The page is now a filled ~1,434-word draft with extensive
  imagery and its main writing/cleanup is substantially done. Remaining work:
  - replace/remove the remaining image authoring placeholders
    (`<picture with bookshelves>` and `<to do - ...>`) and resolve the cycling
    image/narrative TODO block;
  - embed the CV as readable content and add the downloadable PDF;
  - leave contact method undecided until the maintainer chooses.
- [x] **Colophon writing and publication cleanup complete (`#20/#75`).** The
  Colophon is now a filled ~1,932-word account of
  the site's origins, three worlds, v3 construction, maintenance system, and
  archives. The external URL was corrected in `46160a0`, and Cabinet passes
  `mkdocs build --strict` as of 2026-09-16.
- [x] **Retire current Site Notes separately (`#76`).** Its useful v1 history is
  represented in the Colophon and the rendered original is preserved at
  `archived-landing-pages/v1/site_notes/index.html`. The MkDocs nav entry was
  removed, then `docs/compass/site_notes.md` itself deleted and
  `FILE-MANIFEST.md`/`CONTENT-INVENTORY.md` updated to match (2026-09-16).
- [ ] **Finish Teaching content according to actual readiness.** Emergent
  2024–25 and Dragons remain unfinished; distinguish them from completed wiring:
  - Creative Coding 2024–25 and 2023–24: built in SSD Student Work and wired
    into Cabinet's manifest/registry/nav in `30c1de6`; **deployment verified
    live 2026-09-16** — both routes return 200 with real gallery content and
    assets;
  - Emergent Technologies 2024–25: a real set of Twine branching narratives is
    partially underway and belongs in
    `SSD_Student_Work/ssd-emergent-tech-2024-25/`; progress is currently stuck
    on adding suitable background images;
  - Emergent Technologies 2026–27: link corrected in `02757d6`, already live at
    `https://jesmehta.github.io/SSD_Student_Work/ssd-emergent-tech-2026-27/`;
  - Coding with AI: it originally branched from Working with AI, but is strong
    enough to stand as a separate, interconnected project; its live destination
    is `/teaching/working-with-ai/coding-with-ai/index.html`; the hub link was
    corrected in `02757d6`;
  - Dragons of SSD: native Cabinet stub `docs/teaching/dragons.md`, hub/nav
    linked and registered WIP (`6b9137e`); image folder has only `.gitkeep`.
    Collect Dragons-only images from archive/Drive, add real content, then
    promote status. Wiring completion is not content completion;
  - Playing with Pulp: native `docs/teaching/papiermache.md`, 22 real images,
    hub/nav and active registry/generated-data wiring (`c590b82`). Initial
    implementation done; verify hosted rendering/lightbox. More context and
    attribution can be a later presentation pass. Both curated galleries belong
    in Cabinet, not SSD Student Work's per-student-code assembly model.

  Do not label the two live projects “forthcoming,” and do not describe the
  archive-curation jobs as absent ideas.
  - **Interim fix, 2026-09-16 (`e3577bf`):** Emergent Technologies 2024-25,
    Dragons of SSD, and Playing with Pulp were dead links on the live Teaching
    hub (routes never built) until a new deploy-time link validator (`#84`)
    caught them; softened to plain "gallery not yet published" text rather
    than left as 404s. Restore as real links once each destination exists —
    this was a stopgap, not the content work itself. Pulp and Dragons now have
    real native routes; only Emergent 2024–25 remains unlinked.

## Current surface matrix

| Area/content | TSV | Landing | MkDocs nav | Content maturity | State and next action |
|---|---|---|---|---|---|
| About Me | `compass-n`, live | Yes | Yes | **Filled draft:** ~1,434 words and extensive imagery | **Mostly done:** complete the remaining image/cycling placeholders and add embedded + downloadable CV. The lowercase `_images/about/` paths correctly match both disk and Git. |
| Now | `compass-e`, live | Yes | Yes | **Filled:** substantial generated page | **Live:** maintain through `content/now.tsv`, not by editing generated Markdown. |
| Colophon | `compass-s`, live | Yes | Yes | **Filled and publication-clean:** ~1,932 words plus archive links | **Complete:** link correction committed in `46160a0`; strict Cabinet build passes. |
| Site map | `compass-w`, live | Yes | Yes | **Intentionally concise index:** generated cross-world routes | **Live:** refresh after sibling TSV changes; distinguish generated flags from editorial decisions. |
| Site Notes | No TSV row | No compass direction | Removed | **Retired (2026-09-16):** useful material folded into Colophon, original preserved at `archived-landing-pages/v1/site_notes/index.html` | **Done.** Source file, nav entry, and manifest/inventory references all removed. |
| Teaching hub | Section live | Yes | Clickable header | **Filled hub:** Pulp linked; Dragons linked WIP; Emergent 2024–25 unlinked | **Remaining content:** Dragons curation and Emergent completion. Creative Coding galleries verified live 2026-09-16; latest Pulp/Dragons deployment not reverified here. |
| Playing with Pulp | Active native entry | Generated data | Yes | **Filled image gallery:** 22 images, brief cohort introduction (`c590b82`) | **Initial implementation done:** verify hosted rendering/lightbox; improve attribution/context later. Short prose does not make an image gallery a stub. |
| Dragons of SSD | Native WIP entry | Generated data | Yes | **Stub:** coming-soon text, empty tracked image folder (`6b9137e`) | **Wiring done, content open:** collect images and add context before promoting to true. |
| SSD Creative Coding 2024–25 / 2023–24 | Entries active | Generated data wired | Yes | **Built galleries:** SSD source committed; Cabinet assembly wired in `30c1de6` | **Live, verified 2026-09-16:** both routes return 200 with real content/assets; Actions green on both repos. |
| SSD Creative Coding 2025–26 | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Working with AI | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Prompt Generator | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Oblique Strategies | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Emergent Technology anchor | Entry live | Yes | No exact nav row | Points into Teaching hub | **Live by design:** ensure the target heading/anchor remains stable; annotate inventory rather than adding a duplicate nav item automatically. |
| WebTech hub | Section live | Yes | Clickable header | **Filled, current (2026-09-16, `8e7e502`):** rewritten with real project links | **Done:** no longer calls itself Creative Coding or claims work is "moving"; lists its own live projects (Branching Narrative, Dot Mandala, Tracery Bots, Swatch Fields) and cross-links FFFX's canonical Circle Packing Library. |
| Dot Mandala Tool | Entry live | Yes | Yes | **Filled:** ~1,000 words with images | **Live:** easy metadata/thumbnail candidate. |
| Tracery Bots | Entry live | Yes | Yes | **Filled:** ~680 words plus two assembled bot children | **Live:** nested Trippy Gourmet/Mad Solutionist nav rows are intentional, not missing TSV rows. |
| Branching Narrative/Twine | Entry live | Yes | Yes | **Stub/partial:** very short project page | **Needs content:** confirm the experience works and add enough context or a screenshot to explain it. |
| Swatch Fields | Entry live | Yes | Cross-listed | Assembled and validated | **Live:** deliberate cross-listing under WebTech and Makings. |
| Machines & Makings hub | Section `wip` | Yes | Clickable header | **Stub:** 35 words and “under construction” | **Needs content:** write a concise but purposeful index around MiniLoom and honest forthcoming groups. |
| MiniLoom | Entry live | Yes | Yes | **Filled:** ~1,000 words with many images | **Live:** strongest native Cabinet content page. |
| Origami & Paper | Hidden entry | No | Yes | 14-word stub | **Reserved:** `scratchNotes.md` says origami work is being rounded up; promote only when one real piece is ready. |
| Lasercutting | Hidden entry | No | Yes | 12-word stub | **Reserved:** source one existing project before promotion. |
| Drawing Machines | Hidden entry | No | Yes | 13-word stub | **Reserved:** likely fertile, but no content presently in this repo. |
| 3D printing | Hidden entry | No | Nav commented out | **Stub set with source links:** four near-empty pages, three pointing to prior project material | **Planned full content:** write individual Mecha, Flexures, Polyhedra, and George Hart treatments; a concise link hub alone is not the intended finish. |
| Bookshelf world | Section and entries live | Yes | World link only | External subdomain | **Live:** SciFi/Asimov/map-only entries are intentional doors into Bookshelf, not Cabinet nav omissions. |
| Writings | Section and three entries live, internal | Yes | Three child links plus overview, all internal | **Filled:** essays, miscellany, and poems migrated in from Bookshelf | **Done (2026-09-16):** My Writings moved from Bookshelf into Cabinet's `docs/writings/`; TSVs and nav repointed internally; Bookshelf's copy deleted (unlaunched, no redirect needed). Design, Food, Semantics, and other personal writing can still be added here later. Bookshelf retains other people's writing—Favourite Poetry and the British Poetry Workshop—because its subject is reading, books, and literature. |
| Fab Academy 2023 | Entry live | Yes | External nav link | **Filled external programme documentation** | Keep distinct from the Fab23 Bhutan event write-up. |
| Fabricademy 2026 | Entry live | Yes | External nav link | **Filled external programme documentation** | Keep distinct from Fab25 Czechia; stale href note already corrected in `47ab009`. |
| Fab hub | Section visible | Yes | Yes | **Concise functional index:** events, programme sites, RIIDL lab links (`65ce285`) | **Implemented:** verify hosted routes; keep event/programme identities distinct. |
| Fab23 Bhutan | Hidden `fab-23`, metadata corrected (`b3c3bc6`) | No event card | Via Fab hub | **Substantial captioned photo chronology:** page/images committed (`e6f3275`, `966b81b`), not a stub | TSV identity/href corrected; still curate image dump and add personal event account. |
| Fab25 Czechia | Hidden `fab-25` (renamed from `fab-26`, `b3c3bc6`) | No | Via Fab hub | **Stub:** event-write-up file exists | TSV record renamed/corrected; still develop the 2025 event write-up. |
| FFFX world | Section and two entries live | Yes | World link only | External subdomain | **Live externally; local legacy folder partially resolved.** Circle Packing/PackingShapes duplicate deleted 2026-09-16 (`b667bc2`), redirected to FFFX's canonical page. Vera Molnar duplicate retired the same way 2026-09-28 (identical to FFFX's copy). `docs/fffx/100Gradients.md` and `particleSystems.md` are still orphaned frozen copies awaiting the same disposition. |
| Visual Field Notes | Section `wip`, entries hidden | Not rendered because it has no visible entries | No | **Assets complete, concept/page absent:** photography exists for Gujarati Type, Doors of Kutch, and Kochi | **Hub plus three collections:** sort the photographs, clarify the shared editorial approach, design the hub/layout system, then create separate Gujarati Type, Doors of Kutch, and Kochi pages. |
| DataViz | Section/entry hidden | No | No | **Stub:** one-line file, viable future index role | **Deliberately hidden:** do not activate now, even though a concise curated cross-world index could eventually fulfil the role. |
| Blog | No TSV | No | No | **Stub:** one-line file | **Reserved with a real concept:** seed from the Atlas writing cues listed in `scratchNotes.md`. |
| Travels | No TSV | No | No | **Stub:** one-line file | **Later backlog:** multiple Atlas sources are named, but this is broader than the bounded P1 pieces. |
| PhysComp | No TSV | No | No | **Stub:** one-line file | **Reserved:** lighting/optics simulator idea may become its first concrete project. |

## Low-hanging content wins

- [x] **Rewrite `docs/webtech/index.md`.** Done 2026-09-16 (`8e7e502`): short,
  lists WebTech's own live projects, and cross-links FFFX's canonical Circle
  Packing Library instead of claiming the work is "moving" there.
- [ ] **Develop the 3D-printing fragments into individual write-ups.** Mecha,
  Flexures, Polyhedra, and George Hart already have external source material.
  Use those links to gather text/images, then create real project treatments;
  add a concise 3D-printing index only to orient readers among the filled pages.
- [x] **Migrate the remaining legacy FFFX page.** Done 2026-09-28: local
  `fffx/VeraMolnarRetrospective.md` was byte-for-byte identical to FFFX's
  canonical `recreating-the-past/vera-molnar.md`, so there was no unique
  material to move. Deleted and redirected, same pattern as Circle Packing.
- [x] **FFFX Circle Packing links repaired, Cabinet duplicate retired.**
  Commit `351fb1f` fixed FFFX's six image paths and malformed YouTube link;
  FFFX strict build now passes. **2026-09-16 (`e3577bf`, `b667bc2`):** the two
  copies had already drifted — Cabinet's frozen duplicate had the identical
  malformed-link bug, fixed there too as a side effect of `#84`'s validator
  work — then Cabinet's `docs/fffx/PackingShapes.md` and its six essay images
  were deleted outright, `docs/compass/about.md`'s stale link retargeted
  straight to FFFX's canonical page, and a `mkdocs-redirects`-based redirect
  added so Cabinet's old URL still resolves instead of 404ing.
- [ ] **Add real thumbnails where assets already exist (`#23/#86/#91`).** Best
  first candidates are Dot Mandala, MiniLoom, and About (Circle Packing was
  never a Cabinet TSV entry, and is now retired from Cabinet entirely — see
  above). Confirm the landing renderer's expected path/format before filling
  the TSV; do not merely populate a currently unused column.
- [x] **Clean small visible copy errors during the page pass.** Examples found
  in live pages include “geogrpahy,” “percieve,” and “Olderpage.” Done
  2026-09-28: “percieve” (Teaching intro), “completly” (Dot Mandala), and
  “geogrpahy” (an HTML comment in About, not visitor-visible) fixed; “Olderpage”
  was already gone from `docs/`. Further typos stay attached to substantive
  page edits rather than a broad stylistic rewrite.
- [ ] **Make the generated inventory distinguish intentional exceptions.** Add
  explicit annotations/allowlisting for nested bot pages, map-only external
  world entries, and in-page anchors. This keeps the content report actionable.
- [x] **Correct and separate the four Fab records.** **Done, 2026-09-23
  (`b3c3bc6`)**: they are not competing names for the same chronology:
  - Fab23 Bhutan: photo chronology now exists; TSV identity/href corrected;
    personal account remains open;
  - Fab25 Czechia: TSV record renamed `fab-26` -> `fab-25` and corrected to
    describe the event; a future personal write-up of the 2025 Fab
    conference/event remains open, href stays blank until it exists;
  - Fab Academy 2023: the already-live external programme documentation site,
    untouched;
  - Fabricademy 2026: the already-live external programme documentation site,
    untouched.

  The Fab section description and regenerated sitemap/content inventory were
  updated in the same commit.
- [x] **Add the requested FabLab RIIDL links** (`65ce285`): Fab hub links
  the 2024/2025/2026 lab pages separately from personal programme documentation.

## FFFX — content (summary)

Detail, plus a registry of every FFFX section and card with its meaning,
origin and your call: FFFX's [`documentation/toDo - content.md`](../../form-follows-fx/documentation/toDo%20-%20content.md).
Project fine-tuning stays in each project's own `projects/*/documentation/`.

- Live: Vera Molnar, Circle Packing Library, plus three external SSD entries
  (Prompt Generator, Oblique Strategies, Student Work 2025–26). WIP: 13
  placeholder cards (72% of the page); eight of eleven sections hold only WIP.
- **Gated on `#147` (protect code):** Mandala Generator (Cabinet's Dot
  Mandala Tool too, once the gate exists), Lenticular, Dance of Planets,
  Island Generator, Live Webcam Filters — no new landing/TSV/nav wiring until
  the private-source decision.
- [ ] Rebalance WIP: keep the *Next up* cards (Genuary, Windows of Berlin,
  Image Filters), hide the rest and any emptied sections.
- [ ] Next up: Genuary, Windows of Berlin, Image Filters (mid); Lenticular
  code (publication gated).
- [ ] Vera Molnar: add images (only the writeup is up).
- [ ] Ideas confirmed 2026-10-02 (gallery/writeup forms in FFFX's registry):
  4-Bar Fringe, Photopixels, Type Transitions, Truchet Tiles, Crystal
  Deposition (BioMimicry × Code), circle-packing plays, Live Webcam Filters
  (pull out of Student Work; gated).
- [ ] Legacy Processing Archive: clean-up project, out of the showcase.
- [ ] Inventory Flow Fields, Perlin Noise, Plotter Work, Code to Fabrication.
- [ ] After `#147`: Dance of Planets and Island Generator pages and wiring.

## Bookshelf — content (summary)

Detail, plus a registry of every Bookshelf card, chip and ticker term with its
meaning and origin: Bookshelf's [`documentation/toDo - content.md`](../../TheBookshelfOfCuriosities/documentation/toDo%20-%20content.md).
Project fine-tuning stays in each project's own `projects/*/documentation/`.

- Live: Golden Age SF, Asimov, Christie, Favourite Poetry (new Poetry section).
  WIP: Clarke, My Reading Journey, Mapping the Hamzanama. Restructured
  2026-10-02 (Bookshelf `022dda1`, `4662557`).
- [ ] Bring two of Clarke / My Reading Journey / Hamzanama to live.
- [ ] Resolve stale and unexplained ticker terms and dataviz chips.
- [ ] Christie: editorial review of approximate fictional-location positions.
- [ ] Asimov and Golden Age SF project passes (their own project todos).
- [ ] Favourite Poetry: collection-level framing and navigation.
- [ ] Later: Comics section, seeded by Cabinet's graphic-novels essay.

## P1 — maximum visible gain

- [x] **Teaching: wire the already-live Emergent Technologies 2026–27 and
  independent Coding with AI destinations.** Link Emergent Technologies
  directly to its live `SSD_Student_Work/ssd-emergent-tech-2026-27/` gallery.
  Keep Coding with AI and Working with AI as separate but visibly interconnected
  projects; change the current sibling-level link to the live nested
  `/teaching/working-with-ai/coding-with-ai/index.html` destination. Completed
  in `02757d6` (2026-09-16).
- [x] **Teaching: assemble Creative Coding 2024–25 and 2023–24.** SSD galleries
  built and Cabinet manifest, entry TSV/generated data, and nav wired in
  `30c1de6`. Routes/assets verified live 2026-09-16; do not redo integration.
- [ ] **Teaching: continue Emergent Technologies 2024–25.** Assemble the
  existing Twine branching narratives under
  `SSD_Student_Work/ssd-emergent-tech-2024-25/`; resolve their background-image
  treatment and add the images currently blocking progress.
- [x] **Teaching: implement Playing with Pulp's initial gallery** (`c590b82`):
  native Cabinet page, 22 images, registry/nav/hub wiring. Hosted release check
  remains separate; further presentation work need not reopen initial assembly.
- [ ] **Teaching: fill Dragons of SSD's native Cabinet stub.** Collect the
  Dragons-only selection from archive/Drive; preserve attribution/permissions,
  add context, and promote its WIP status once real gallery content exists.
- [ ] **FFFX: reach five substantive entries.** Retain Vera Molnar and Circle
  Packing, then add the *Next up* three: Genuary, Windows of Berlin, Image
  Filters. **Revised 2026-10-02:** Dance of Planets, Island Generator and
  Lenticular are gated on `#147` (protect code), so they follow once the
  private-source decision lands. Detail: FFFX's `toDo - content.md`.
- [ ] **Bookshelf: expose its appropriate live density on the custom landing.**
  Golden Age SF, Asimov, and Favourite Poetry belong there; Favourite Poetry is
  awaiting review/commit of its pending custom-landing card. My Writings has
  moved to Cabinet; Christie routing is fixed. History of Design and comics
  writing now belong to Cabinet; British Poetry Workshop stays in Bookshelf.
  Do not recreate this existing material or reopen completed routing/migration.
- [x] **Establish Cabinet Writings as the canonical home for authored work.** Move
  My Writings here; new Design, Food, Semantics, and future personal work remain
  separate ongoing content additions, not part of this completion mark.
  Bookshelf should retain Favourite Poetry/British Poetry Workshop but should
  not retain My Writings pages, redirects, or breadcrumbs after the move.
  **Done 2026-09-16** — essays/miscellany/poems now live at Cabinet's
  `docs/writings/`; Design/Food/Semantics remain future additions to the same
  section.

## P2 — substantial but valuable

- [ ] Warli explorer; worthwhile and distinctive, but a real project rather
  than a quick page.
- [ ] Finish Fab23 Bhutan's personal account and curate its existing photo
  chronology; develop Fab25 Czechia's still-stub write-up. Fab23 images and the
  Fab hub are already implemented. Link Fab Academy 2023/Fabricademy 2026 only
  where genuinely relevant; they are separate programme documentation sites,
  not substitutes for the event write-ups.

## P3 / idea backlog

- [ ] **Data Visualisations:** keep hidden for now. When deliberately resumed,
  build it by curation rather than invention, linking existing work such as the
  population graphic, Golden Age SF, Asimov, and Geography of Murder.
- [ ] **Travels:** inventory Cycling Journey Maps, travelogue snippets, Process
  Travel Panoramas, Windows of Berlin, and the dated trips in `scratchNotes.md`;
  select one text-and-image journey after the content-density sprint. Cross-link
  the canonical FFFX Windows of Berlin project rather than duplicating it here.
- [ ] **Visual Field Notes:** the photography for Gujarati Type, Doors of Kutch,
  and Kochi already exists completely. Build one Visual Field Notes hub with
  three separate collection pages. The remaining work is sorting, deciding the
  shared editorial approach, designing the hub/child layout system, and adding
  framing text; keep the section hidden until that concept is clear.
- [ ] **Biomimicry × Code:** first decide with Irf whether the elective is
  general Creative Coding or Biomimicry-focused. If chosen, begin with the
  named systems rather than promising the full research list.
- [ ] **Lighting/optics simulator:** decide on Teaching, WebTech, or a canonical
  page with cross-links; prototype one optical element before breadboard/game
  scope.
- [ ] **Rock Collection Gallery and Dupatta Gallery (WebTech domain):**
  confirmed as real "someday" ideas in Project Atlas (`theAtlas/projects*.json`,
  `p016`/`p017`, `status: seed`), not fabricated — both explicitly blocked
  on source material never gathered ("photos/scans not yet done"), no build
  work exists yet. A related third idea there, `Material Library — Sampler
  Site` (`p015`), explicitly "parallels rock and dupatta galleries" and may
  be worth scoping together rather than separately. Photograph/scan the
  source material first; page design and build come after, same order as
  every other stub-vs-source-material item in this file.
- [ ] **Blog:** when ready, choose one first post from Vignettes, tiny tales,
  Everyday Events Writing, or “Where Are You Local?” rather than designing a
  taxonomy first.
- [ ] Keep Christie, Particle Systems, Origami, Lasercutting, Drawing Machines,
  History & Approach, Research & Interests, Internet Nostalgia, personal
  poetry, and a new standalone Branching Narrative from distracting the P1
  sprint.

## Keep reserved or blocked for now

- [ ] Do not activate empty Blog, PhysComp, or Travels sections merely because
  folders exist. Visual Field Notes has complete photo assets but remains hidden
  pending its editorial approach and layout. Keep DataViz deliberately hidden.
- [ ] Do not promote hidden Fab event TSV cards until metadata and content
  are ready. Fab23 is already reachable via the Fab hub, not an absent page;
  Fab25 remains a stub. TSV identity (`fab-23`/`fab-25`, formerly `fab-26`)
  is now corrected (`b3c3bc6`) -- promotion is still a separate, later step.
- [ ] Do not add `teaching-approach` or `teaching-research` to the map until the
  real About/Teaching prose is written; they would currently duplicate broad
  claims without destinations.
- [ ] Keep `particle-systems` and `100-gradients` hidden until migrated or
  rebuilt in FFFX; their local Cabinet files are only construction stubs.
- [ ] Keep the speculative coast-level map-entry system (`#137`) out of content
  planning until a real collection demonstrates why the existing section/entry
  hierarchy is insufficient.

## Content publication checklist

For each item promoted from reserved to live:

- [ ] canonical home chosen (Cabinet, Bookshelf, FFFX, or assembled repo);
- [ ] real page/assembled destination exists before any public link is added;
- [ ] TSV section/entry added or updated with truthful status and href;
- [ ] landing page rebuilt and promoted when TSV data changes;
- [ ] MkDocs nav entry added only when Cabinet navigation should expose it;
- [ ] thumbnail and concise subtitle added where the surface uses them;
- [ ] internal links checked against the built artifact, not only source paths;
- [ ] Content Inventory regenerated and its remaining flags reviewed as either
  real mismatches or documented intentional exceptions.
