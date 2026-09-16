# ToDo - Immediate

Quick wins and urgent work selected from [Content](toDo%20-%20content.md) and
[Website](toDo%20-%20website.md). Reconciled with local Git history and source
on 2026-09-16, through Cabinet `1d320df`, Bookshelf `117a2cc`,
and SSD Student Work `5b4188c`. The longlists retain broader scope.
Completion below means committed implementation, not a verified live deployment.

## Urgent - verify the latest release

- [x] **Verify the new Creative Coding galleries deploy in Cabinet.**
  - Confirmed 2026-09-16: both `SSD_Student_Work` and Cabinet local `main`
    match `origin/main` (`5b4188c` and `1d320df` respectively). Latest Actions
    runs on both repos are `completed`/`success`, including Cabinet's run at
    `30c1de6` (the manifest commit) and its current HEAD.
  - Both assembled routes return HTTP 200 with correct titles and real gallery
    content, assets included: `/teaching/ssd-creative-coding-2024-25/` and
    `/teaching/ssd-creative-coding-2023-24/` (plus their `script.js`).
  - Removed the two obsolete "not yet pushed" notes in
    `content/external-repos.tsv` and `content/cabinet-entries.tsv`.
- [ ] **Close the remaining Teaching hub route gaps.**
  - Emergent Technologies 2024-25: finish the existing Twine narratives and
    background images, then assemble/publish `ssd-emergent-tech-2024-25/`.
  - Dragons of SSD: curate a Dragons-only gallery from the photo archive and
    student Drive submissions, then publish `dragons-of-ssd/`.
  - Playing with Pulp: curate a separate best-of-papier-mache gallery from the
    same sources, then publish `ssd-papiermache/`.
  - These three routes remain linked from the Teaching hub. If publication
    cannot happen promptly, remove the dead links and describe their actual
    readiness until destinations exist.
- [ ] **Close the deployment validator's remaining coverage gap (`#84`).**
  - `validate-deployment.js` currently checks only `status: true` entry TSV
    routes, not every Teaching hub link, WIP entry, section href, nav target,
    or anchor. The three hub-only gaps above are therefore not caught by it.
  - Add built-artifact checks for published hub/nav links and visible WIP
    destinations; retain explicit treatment of external links and anchors.
    Do not reopen the completed manifest/assembly implementation.

## Quick wins - small corrections with visible value

- [ ] **Rewrite the WebTech hub.** Replace `docs/webtech/index.md`'s stale
  "Creative Coding / this is moving" copy with a concise WebTech introduction.
  Cross-link FFFX's canonical Circle Packing page.
- [ ] **Replace Cabinet's legacy Circle Packing duplicate with a canonical link.**
  FFFX holds the project; Cabinet WebTech links to it. Remove/replace the frozen
  duplicate rather than maintain its malformed YouTube link as a second copy.
  FFFX's own equivalent link was already fixed in `351fb1f`.
- [ ] **Correct the remaining source-of-truth notes.**
  - WebTech section note: it is active and mapped, not waiting for `#69`.
  - Compass entry notes: use the current `docs/compass/` paths.
  - Fabricademy note: its 2026 external href is already present.
  - README: describe six source repositories and eight assembly destinations.
    The backend/deploy reference was already updated in `30c1de6`.
- [ ] **Reconcile the historical ledger (`#69/#76/#80/#81/#82/#84/#126`).**
  Annotate completed work and remaining scope; replace its stale immediate
  priorities while preserving history. Do not repeat completed infrastructure.
- [ ] **Remove FFFX's inherited `scifi asimov` deployment-copy loop.** It has
  no corresponding FFFX projects and is misleading workflow residue.

## Next bounded content pass

- [ ] **Finish About's remaining assets.**
  - Replace/remove the bookshelves and interest-link authoring placeholders.
  - Resolve the cycling image/narrative TODO.
  - Embed readable CV content and add a downloadable PDF.
  - Main About writing and imagery have already received substantial updates
    (`daf2c4b`, `9f2d646`, `4b7ef4e`); this is an asset/CV finish, not a rewrite.
- [x] **Move My Writings from Bookshelf to Cabinet.**
  Implemented in Cabinet `39a2adb` and Bookshelf `117a2cc`: essays, poems,
  miscellany, registry, generated landing data, and navigation moved; Bookshelf
  copies/nav removed. Favourite Poetry and British Poetry Workshop stay there.
  No redirects or breadcrumbs are required for this unlaunched material.
  Verify the deployed Cabinet pages/assets as part of release checks.
- [ ] **Publish Dance of Planets and Island Generator in FFFX.** Integrate the
  existing implementations, select example images, and write explanatory pages.
  Dance of Planets has an untracked stub page; Island Generator still needs
  its canonical page/registry entry. Commit filled sources before promotion.
- [ ] **Finish Lenticular next.** Complete remaining tool code and DOM controls,
  then add the embed, examples, and explanatory project page.

## Next website pass

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

## Recently completed - keep out of the work queue

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
  Remaining coverage and live-release checks are listed above.
- [x] **Creative Coding 2024-25 and 2023-24 built and wired** (SSD commits
  above; Cabinet `30c1de6`). Deployment verification remains open.
- [x] **FFFX Circle Packing paths/link repaired** (`351fb1f`).
- [x] **Bookshelf Christie routing corrected** (`28fe92a`): `/christie/`
  is canonical with a standalone entry point.

## Cross-machine sync

- [x] **Replicate CLAUDE.md additions on the home terminal.**
  - Done 2026-09-16 on the home terminal. Since that machine's working
    directories don't match `d:\FabWorld\CLAUDE.md`'s roots, the file was
    created at `F:\__SnowCrash\CLAUDE.md` (untracked — `F:\__SnowCrash` is
    not itself a git repo) with the same Git-commits section and a
    Workspace-boundaries list adjusted to that machine's actual roots:
    `F:\__SnowCrash\__WebPages`, `F:\__SnowCrash\_FabSite`,
    `F:\__SnowCrash\__Project_Complex`, `F:\__SnowCrash\_Scripts`, and
    `D:\Downloads\Nifty Decon`.
