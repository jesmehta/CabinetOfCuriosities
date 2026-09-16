# ToDo — Content

Current Cabinet content and information-architecture work. Audited 2026-09-12
against:

- `content/cabinet-sections.tsv` and `content/cabinet-entries.tsv`;
- the generated `documentation/CONTENT-INVENTORY.md`;
- the baked v3 landing page (`docs/index.html`);
- `mkdocs.yml`;
- every Markdown source under `docs/`;
- the six external destinations assembled by `.github/workflows/deploy.yml`;
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

## Essential content — do first

- [ ] **Publication-clean the substantially completed About page
  (`#42/#66/#74`).** The page is now a filled ~1,434-word draft with extensive
  imagery, not a stub. Remaining work:
  - remove the visible authoring placeholders (`<picture with bookshelves>` and
    `<to do - ...>`) and resolve the cycling TODO/comment block;
  - fix every `_images/about/` reference to match the actual case-sensitive
    `_images/About/` directory before Linux deployment;
  - audit old project links and proofread the visible copy;
  - embed the CV as readable content and add the downloadable PDF;
  - leave contact method undecided until the maintainer chooses.
- [ ] **Publication-clean the substantially completed Colophon and retire Site
  Notes (`#20/#75/#76`).** The Colophon is now a filled ~1,932-word account of
  the site's origins, three worlds, v3 construction, maintenance system, and
  archives—not a stub. Remaining work:
  - change `[jesalmehta.com](jesalmehta.com)` to an absolute URL; this is the one
    warning currently causing `mkdocs build --strict` to fail;
  - proofread the draft and resolve small wording/typography errors;
  - confirm all intentionally external-to-MkDocs archive links in the assembled
    artifact;
  - remove the current Site Notes source/nav entry after confirming its useful
    history is represented. The rendered v1 page is already preserved at
    `archived-landing-pages/v1/site_notes/index.html`.
- [ ] **Repair Teaching publication according to actual readiness.** The six
  locally unresolved routes are different kinds of work:
  - Creative Coding 2024–25: content is currently on the maintainer's work
    computer and should become `SSD_Student_Work/ssd-creative-coding-2024-25/`;
  - Emergent Technologies 2024–25: a real set of Twine branching narratives is
    partially underway and belongs in
    `SSD_Student_Work/ssd-emergent-tech-2024-25/`; progress is currently stuck
    on adding suitable background images;
  - Emergent Technologies 2026–27: already live at
    `https://jesmehta.github.io/SSD_Student_Work/ssd-emergent-tech-2026-27/`;
  - Coding with AI: it originally branched from Working with AI, but is strong
    enough to stand as a separate, interconnected project; its live destination
    is `/teaching/working-with-ai/coding-with-ai/index.html`, not the Teaching
    hub's current sibling-level `coding-with-ai/` route;
  - Dragons of SSD: a distinct Dragons-only gallery, collected from the image
    archive across the maintainer's photo gallery and student Google Drive
    submissions;
  - Playing with Pulp: a separate best-of-papier-mâché gallery, also collected
    from those two external image sources.

  Do not label the two live projects “forthcoming,” and do not describe the
  archive-curation jobs as absent ideas.

## Current surface matrix

| Area/content | TSV | Landing | MkDocs nav | Content maturity | State and next action |
|---|---|---|---|---|---|
| About Me | `compass-n`, live | Yes | Yes | **Filled draft:** ~1,434 words and extensive imagery | **Mostly done:** remove authoring markers, fix Linux-sensitive image-path case, proofread/link-check, and add embedded + downloadable CV. |
| Now | `compass-e`, live | Yes | Yes | **Filled:** substantial generated page | **Live:** maintain through `content/now.tsv`, not by editing generated Markdown. |
| Colophon | `compass-s`, live | Yes | Yes | **Filled draft:** ~1,932 words plus archive links | **Mostly done:** fix the malformed external URL, proofread, verify assembled archive links, and retire current Site Notes. |
| Site map | `compass-w`, live | Yes | Yes | **Intentionally concise index:** generated cross-world routes | **Live:** refresh after sibling TSV changes; distinguish generated flags from editorial decisions. |
| Site Notes | No TSV row | No compass direction | Yes | **Historical:** substantial account of v1 (2024), not current-site documentation | **Consolidate and retire:** absorb useful material into Colophon, then remove the current page/nav entry. Preservation already exists at `archived-landing-pages/v1/site_notes/index.html`; a Colophon archive subpage is optional. |
| Teaching hub | Section live | Yes | Clickable header | **Filled hub:** 345 words; six routes unresolved locally, although two targets are confirmed live elsewhere | **Partial wiring/assembly/curation:** retain its useful copy and handle each target according to the readiness list above. It does not need padding merely because it is a hub. |
| SSD Creative Coding 2025–26 | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Working with AI | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Prompt Generator | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Oblique Strategies | Entry live | Yes | Yes | Assembled and validated | **Live.** |
| Emergent Technology anchor | Entry live | Yes | No exact nav row | Points into Teaching hub | **Live by design:** ensure the target heading/anchor remains stable; annotate inventory rather than adding a duplicate nav item automatically. |
| WebTech hub | Section live | Yes | Clickable header | **Stub/stale:** 42-word legacy intro | **Needs content correction:** brevity is not the issue; it still calls itself Creative Coding and says the work is moving to FFFX. A concise replacement can be complete. |
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
| Writings | Section and three entries live | Yes | Three child links, overview commented | **Planned canonical home for authored work, current local stub:** Design, Food, Semantics, and other personal writing belongs here | **Develop and migrate:** move My Writings from Bookshelf into Cabinet, then have Bookshelf link to Cabinet. Bookshelf retains other people's writing—Favourite Poetry and the British Poetry Workshop—because its subject is reading, books, and literature. |
| Fab Academy 2023 | Entry live | Yes | External nav link | **Filled external programme documentation** | Keep distinct from the Fab23 Bhutan event write-up. |
| Fabricademy 2026 | Entry live | Yes | External nav link | **Filled external programme documentation** | Keep distinct from the Fab25 Czechia event write-up; correct the stale TSV note claiming the href is blank. |
| Fab23 Bhutan | Hidden `fab-23` | No | Commented | **Stub:** event-write-up file exists | Gather event material and write the personal event account; correct metadata that conflates it with Fab Academy coursework. |
| Fab25 Czechia | Incorrectly represented as hidden `fab-26` | No | Commented with correct Fab25 title | **Stub:** event-write-up file exists | Rename/correct the TSV record and develop the 2025 event write-up. |
| FFFX world | Section and two entries live | Yes | World link only | External subdomain | **Live externally; local legacy folder needs disposition.** |
| Visual Field Notes | Section `wip`, entries hidden | Not rendered because it has no visible entries | No | **Assets complete, concept/page absent:** photography exists for Gujarati Type, Doors of Kutch, and Kochi | **Hub plus three collections:** sort the photographs, clarify the shared editorial approach, design the hub/layout system, then create separate Gujarati Type, Doors of Kutch, and Kochi pages. |
| DataViz | Section/entry hidden | No | No | **Stub:** one-line file, viable future index role | **Deliberately hidden:** do not activate now, even though a concise curated cross-world index could eventually fulfil the role. |
| Blog | No TSV | No | No | **Stub:** one-line file | **Reserved with a real concept:** seed from the Atlas writing cues listed in `scratchNotes.md`. |
| Travels | No TSV | No | No | **Stub:** one-line file | **Later backlog:** multiple Atlas sources are named, but this is broader than the bounded P1 pieces. |
| PhysComp | No TSV | No | No | **Stub:** one-line file | **Reserved:** lighting/optics simulator idea may become its first concrete project. |

## Low-hanging content wins

- [ ] **Rewrite `docs/webtech/index.md`.** Keep it short, but make its heading,
  description, and relationship to FFFX match the now-settled WebTech umbrella.
- [ ] **Develop the 3D-printing fragments into individual write-ups.** Mecha,
  Flexures, Polyhedra, and George Hart already have external source material.
  Use those links to gather text/images, then create real project treatments;
  add a concise 3D-printing index only to orient readers among the filled pages.
- [ ] **Migrate the two substantive legacy FFFX pages.** Local
  `fffx/PackingShapes.md` (~819 words) and `VeraMolnarRetrospective.md`
  (~311 words) are orphaned from Cabinet nav and the folder is declared frozen.
  Move any unique Vera Molnar material to FFFX, then delete the Cabinet copy;
  Vera belongs purely in FFFX. FFFX is also canonical for Circle Packing/Packing
  Shapes: consolidate the full write-up there, then make Cabinet's WebTech entry
  link to it rather than maintaining a duplicate Cabinet copy.
- [x] **FFFX Circle Packing links repaired.** Commit `351fb1f` fixed its six
  image paths and malformed YouTube link; FFFX strict build now passes. The
  frozen Cabinet duplicate still contains the old malformed link, but it is to
  be removed/replaced by a WebTech link to canonical FFFX rather than repaired
  as a second maintained copy.
- [ ] **Add real thumbnails where assets already exist (`#23/#86/#91`).** Best
  first candidates are Circle Packing/Packing Shapes, Dot Mandala, MiniLoom,
  and About. Confirm the landing renderer's expected path/format before filling
  the TSV; do not merely populate a currently unused column.
- [ ] **Clean small visible copy errors during the page pass.** Examples found
  in live pages include “geogrpahy,” “percieve,” and “Olderpage.” Keep this
  attached to substantive page edits rather than launching a broad stylistic
  rewrite.
- [ ] **Make the generated inventory distinguish intentional exceptions.** Add
  explicit annotations/allowlisting for the nav-only placement of Site Notes,
  without treating that placement as proof its content is current; also cover
  nested bot pages, map-only external world entries, and in-page anchors. This
  keeps the content report actionable.
- [ ] **Correct and separate the four Fab records.** They are not competing
  names for the same chronology:
  - Fab23 Bhutan: a future personal write-up of the 2023 Fab conference/event;
  - Fab25 Czechia: a future personal write-up of the 2025 Fab conference/event;
  - Fab Academy 2023: the already-live external programme documentation site;
  - Fabricademy 2026: the already-live external programme documentation site.

  Replace the misleading hidden TSV `fab-26` reflection with `fab-25`, point it
  eventually to `docs/fab/fab25-czechia.md`, and revise `fab-23` metadata so it
  describes the event rather than Fab Academy coursework. Keep the two external
  programme links distinct. Update the Fab section description and regenerated
  sitemap at the same time.
- [ ] **Add the requested FabLab riidl link(s)** in the Fab context rather than
  duplicating the existing Fab Academy destination under an unexplained label.

## FFFX — verified content audit

Direct repo inspection found two substantive native pages, three live external
entries, and thirteen short internal placeholders. Several of those placeholders
are part of an uncommitted maintainer expansion and must not be described as
published yet.

| Content | TSV / landing | MkDocs nav | Source state | Next action |
|---|---|---|---|---|
| Vera Molnar | Live | Yes | **Filled:** ~322 words | Keep live; add stronger imagery/context only if it improves the study. |
| Circle Packing Library | Live | Yes | **Filled and technically clean:** ~941 words | Six image paths and the malformed YouTube link were fixed in `351fb1f`; strict FFFX build passes. Cabinet WebTech still needs its canonical cross-link. |
| Prompt Generator | Live external | Yes | **External:** destination present; content maturity not re-audited here | Verified structural entry; add cross-world context only if useful. |
| Oblique Strategies | Live external | Yes | **External:** destination present; content maturity not re-audited here | Verified structural entry; add cross-world context only if useful. |
| SSD Creative Coding 2025–26 | Live external | Yes | **External:** year-specific gallery present; content maturity not re-audited here | Verified current destination. |
| 100 Gradients | WIP | Hidden | **Growing collection, stub page:** roughly twelve gradients already exist | Gather and present the existing set as a coherent first release, then grow it in later spurts without treating “100” as a prerequisite for publication. |
| Dance of Planets | WIP | Hidden | **Implemented project, stub page:** code exists; page is ~47 words and untracked | Embed the working project, collect example images, and add the explanatory write-up before publication. |
| Island Generator | Absent | No | **Implemented project, not integrated:** code exists outside the current FFFX registry/tree | Add TSV metadata and a canonical page, embed it, collect example images, and write the surrounding explanation. |
| Lenticular Image Generator | WIP | Hidden | **Nearly implemented tool, stub page:** code is almost done; page is ~38 words and untracked | Finish the tool, add DOM controls, then create the surrounding page with an embed, examples, and explanatory copy. |
| Mandala Generator | WIP | Hidden | **Duplicate stub:** same underlying project as Cabinet's filled Dot Mandala Tool | Cabinet/WebTech is canonical because this is a web tool rather than generative artwork. Remove the FFFX portal or make it an explicit cross-link; do not create a duplicate FFFX write-up. |
| Windows of Berlin | WIP | Hidden | **Existing project, stub page:** substantial work exists | Keep canonical in FFFX; create better exports and animated GIFs, select examples, and write the project page around them. |
| Genuary | WIP | Hidden | **Growing collection, stub page:** some work and generated images already exist | Gather the images, publish a curated initial collection, and design the page for later additions without implying it will ever be finally closed. |
| Flow Fields / Perlin Noise | WIP | Hidden | **Uncollected existing work, stub pages:** ~51 words each, untracked | Locate and curate the completed experiments, then articulate what connects each family before nav promotion. |
| Plotter Work / Code to Fabrication | WIP | Hidden | **Uncollected existing work, stub pages:** ~43/~62 words, untracked | Collect outputs, choose representative examples, and explain the relationship between code, process, and physical result. |
| Image Filters | WIP | Hidden | **Existing, growing project; stub page:** substantial work exists and more will be added over time | Gather the present outputs into a strong initial selection, document the filter approaches, and publish it as an extensible collection rather than waiting for a final endpoint. |
| Particle Systems | WIP | Hidden | **Stub:** ~42 words | Parked: planning explicitly says no real work yet. |
| Legacy Processing Archive | WIP | Hidden | **Stub:** ~64 words | Keep parked and do not turn archive archaeology into current-launch scope. |

FFFX content order:

- [x] Circle Packing repaired and verified under a strict FFFX build (`351fb1f`).
- [ ] Then publish Dance of Planets and Island Generator: both are already
  coded and need embedding, image examples, and write-ups rather than invention.
- [ ] Complete Lenticular next when its remaining code and DOM controls are
  ready; treat the surrounding page as part of finishing the tool.
- [ ] Build Genuary as an intentionally growing collection: publish a coherent
  initial selection from the images already generated, then extend it over time.
- [ ] Treat 100 Gradients similarly: publish the roughly twelve completed works
  as the first deliberate tranche, then add future spurts without leaving the
  page hidden until all one hundred exist.
- [ ] Keep Dot Mandala canonical in Cabinet/WebTech. Remove or redirect FFFX's
  Mandala Generator placeholder instead of maintaining two project pages.
- [ ] Finish Windows of Berlin's presentation layer: better exports, animated
  GIFs, a selected sequence, and explanatory text around the existing work.
- [ ] Build Image Filters as another intentionally growing project: curate what
  already exists into a useful initial page, then allow future filters and
  examples to accumulate without withholding the current work.
- [ ] Inventory Flow Fields, Perlin Noise, Plotter Work, and Code to Fabrication.
  These are not empty ideas; their work exists but is not yet collected or
  articulated into pages.
- [ ] Give the first promoted family a short section hub only when it helps
  orientation; do not activate ten thin categories merely because TSV rows and
  folders exist.
- [ ] Add thumbnails/stills to new entries as part of publication, not as a
  later cleanup wave.

## Bookshelf — verified content audit

The repo is materially richer than Cabinet's registry and the older shared
conversation suggested. Bookshelf already has three standalone interactive
projects, a large poetry archive, and several pieces of personal writing.

| Content | TSV / landing | MkDocs nav | Source state | Next action |
|---|---|---|---|---|
| Golden Age Science Fiction | Live | Yes | **Filled:** deployed standalone project | Maintain; use its own living `ToDo.md` for project refinements. |
| Isaac Asimov | Live | Yes | **Filled but unfinished:** deployed standalone project | Finish the explicit priorities in `Readme_4_todo_decisions.md`; do not count integration work as content completion. |
| Agatha Christie / Geography of Murder | `/christie/` consistently | Nav points `/christie/` | **Filled and reachable:** substantial timeline, Atlas and story work | Routing fixed in `28fe92a` and verified in an assembled strict build. Approximate location data can still receive a later editorial review. |
| My Writings | **Present in Bookshelf's current working tree/site structure, but not publicly launched** | **Currently in Bookshelf MkDocs nav** | **Filled collection; clean migration to Cabinet planned** | Move the files and navigation to Cabinet, then remove them from Bookshelf entirely. Because this material is new and unlaunched, no redirect, breadcrumb, or doorway page is required. |
| Favourite Poetry | **Custom landing card uncommitted** | **Already live in MkDocs nav** | **Filled, live collection:** large anthology + workshop archive | Do not classify the collection as unpublished. Verify and commit only its pending custom-landing integration. Its short collection/long-poem indexes can remain concise if their scope and routes are clear. |
| History of Design | Inside My Writings | Indirect | **Filled:** existing essay | Surface through the collection; it is not a new P1 writing assignment. |
| Graphic novels / comics essay | Inside My Writings | Indirect | **Filled text, presentation incomplete:** existing essay needs more images | It can seed Comics & Sequential Art, but activation is not a priority. Add the needed images during the eventual essay presentation pass. |
| British Poetry Workshop | Inside Favourite Poetry | Yes | **Filled:** large existing archive | Improve discovery and framing rather than creating a replacement “British Canon Poetry” project. |
| Clarke / More Authors | WIP, no href | No | **Absent:** no public destination established | Keep dormant until one bounded author treatment is ready. |
| Kipling / Hamzanama | WIP, no href | No | **Concept only:** public-data cards, no destination | Valuable but research-heavy; do not use for quick density. |
| Brief History of Comics / Indrajal | WIP, section hidden | No | **Concept only:** related filled essay exists elsewhere | Inventory reusable material, then choose one pilot before activating the section. |
| Foundation Universe / Authors vs Books | WIP, no href | No | **Concept only:** no destination | Foundation can build on Asimov data; Authors vs Books waits for a defensible dataset. |

Bookshelf content order:

- [ ] Split the current Bookshelf landing changes: verify/publish Favourite
  Poetry's card, but remove the pending My Writings card and migrate that content
  cleanly to Cabinet. Remove its Bookshelf nav/pages after verifying the Cabinet
  copies; no public redirect or breadcrumb is needed because it is unlaunched.
- [ ] Make Christie reachable, then separate “substantial and public” from
  “research complete”: its maps document approximate or placeholder positions
  for some fictional locations.
- [ ] Finish Asimov's project-level next priorities after checking its existing
  open questions; preserve the curated rather than exhaustive bibliography
  decision.
- [ ] Give Golden Age Science Fiction its documented publication pass: mobile
  layout, table readability, public-facing language, list-source values,
  `type_path` consistency, and link/date review. Keep author/work isolation and
  radial same-year expansion as separate experiments, not release blockers.
- [ ] Later, add more images to the existing graphic-novels essay. It can seed
  Comics & Sequential Art, but keep the section non-priority until that
  presentation pass or another dedicated comics entry is ready.
- [ ] Improve collection-level framing and navigation for the poetry archive;
  the problem is discoverability, not lack of poems.

## P1 — maximum visible gain

- [ ] **Teaching: wire the already-live Emergent Technologies 2026–27 and
  independent Coding with AI destinations.** Link Emergent Technologies
  directly to its live `SSD_Student_Work/ssd-emergent-tech-2026-27/` gallery.
  Keep Coding with AI and Working with AI as separate but visibly interconnected
  projects; change the current sibling-level link to the live nested
  `/teaching/working-with-ai/coding-with-ai/index.html` destination.
- [ ] **Teaching: assemble Creative Coding 2024–25.** The content exists; make
  it available from the work computer as the sibling folder
  `SSD_Student_Work/ssd-creative-coding-2024-25/`, then wire the Cabinet link.
- [ ] **Teaching: continue Emergent Technologies 2024–25.** Assemble the
  existing Twine branching narratives under
  `SSD_Student_Work/ssd-emergent-tech-2024-25/`; resolve their background-image
  treatment and add the images currently blocking progress.
- [ ] **Teaching: collect Dragons of SSD and Playing with Pulp from the image
  archive.** Keep their scopes distinct: Dragons is only the dragon works;
  Playing with Pulp is the broader best-of-papier-mâché selection. Do not wait
  for a universal gallery framework. Export and reconcile material from both
  the maintainer's photo gallery and the students' Google Drive submissions;
  preserve attribution and usage permission while deduplicating images.
- [ ] **FFFX: reach five substantive entries.** Retain Vera Molnar and Circle
  Packing, then integrate the already-coded Dance of Planets and Island
  Generator with embeds, examples, and write-ups. Complete the nearly-coded
  Lenticular Generator—with DOM controls and its surrounding page—as the fifth.
  Island Generator is absent from the current repo/TSV but is confirmed existing
  work, not a speculative proposal. Particle Systems remains a placeholder.
- [ ] **Bookshelf: expose its appropriate live density on the custom landing.**
  Golden Age SF, Asimov, and Favourite Poetry belong there; Favourite Poetry is
  awaiting its pending custom-landing card. My Writings is not publicly launched
  and should move cleanly to Cabinet with no Bookshelf redirect. Christie is
  substantial but needs its route fixed. History of Design, comics writing,
  and the British Poetry Workshop already exist inside the live collections—do
  not recreate them or describe them as unpublished.
- [ ] **Develop Cabinet Writings as the canonical home for authored work.** Move
  My Writings here, then add Design, Food, Semantics, and future personal work.
  Bookshelf should retain Favourite Poetry/British Poetry Workshop but should
  not retain My Writings pages, redirects, or breadcrumbs after the move.

## P2 — substantial but valuable

- [ ] Warli explorer; worthwhile and distinctive, but a real project rather
  than a quick page.
- [ ] Fab23 Bhutan and Fab25 Czechia event write-ups: selected images and a
  personal account of each event. Link Fab Academy 2023/Fabricademy 2026 only
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
- [ ] Do not expose the Fab23/Fab25 event write-ups until their pages are filled
  and the incorrect `fab-26` metadata is corrected.
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
