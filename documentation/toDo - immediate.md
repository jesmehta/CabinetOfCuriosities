# ToDo - Immediate

Quick wins and urgent work selected from [Content](toDo%20-%20content.md) and
[Website](toDo%20-%20website.md). Reconciled with local Git history and source
on 2026-09-16, through Cabinet `30c1de6` and SSD Student Work `5b4188c`.
The longlists retain broader scope; older audit statements there may be stale.
Completion below means committed implementation, not a verified live deployment.

## Urgent - verify the latest release

- [ ] **Verify the new Creative Coding galleries deploy in Cabinet.**
  - Creative Coding 2024-25 and 2023-24 are built and committed in
    `SSD_Student_Work` (`10aa05c`, `dfbf9ce`); its landing links are in `5b4188c`.
    Local `main` matches the locally recorded `origin/main`, so the earlier
    "push SSD first" warning is no longer supported by this checkout. Remote
    state and Actions have not been checked afresh.
  - Cabinet `30c1de6` already adds both galleries to the assembly manifest,
    entry TSV, generated data, and MkDocs nav. Do not rebuild/re-wire them.
  - Confirm the latest Cabinet Actions build/deploy succeeds and both assembled
    routes load with working assets. If the remote dependency is missing,
    publish SSD first, then rerun Cabinet deployment.
  - Update the two obsolete -not yet pushed- manifest notes once confirmed.
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
- [ ] **Fix Cabinet's legacy Circle Packing link.** Remove the extra opening
  parenthesis in `docs/fffx/PackingShapes.md`'s Dan Shiffman YouTube link;
  review whether this legacy page should instead point to FFFX's canonical page.
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
- [ ] **Move My Writings from Bookshelf to Cabinet.**
  Migrate the existing essays, poems, and miscellany; verify Cabinet pages,
  assets, registry, and navigation before removing Bookshelf's copies/nav.
  Keep Favourite Poetry and the British Poetry Workshop in Bookshelf.
  Check current publication state before deciding whether redirects are needed:
  the two longlists disagree, and this review did not verify the live site.
- [ ] **Publish Dance of Planets and Island Generator in FFFX.** Integrate the
  existing implementations, select example images, and write explanatory pages.
  Restore/create missing page sources before promoting their TSV routes.
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
  FFFX has WIP registry routes whose source pages are absent in this checkout;
  resolve those before public promotion. Both sibling working trees are clean
  here, so the older instructions to commit pending local changes need a fresh
  source review rather than being carried forward as fact.

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

- [ ] **Replicate CLAUDE.md additions on the home terminal.**
  - `CLAUDE.md` isn't tracked/synced between machines, so apply this by hand
    at home — `d:\FabWorld\CLAUDE.md` on this machine currently reads
    (2026-09-16):
    ```markdown
    # CLAUDE.md

    ## Git commits

    Never author or co-author git commits. Do not add "Co-Authored-By: Claude" or any similar attribution line to commit messages, and do not set yourself as the commit author.

    ## Workspace boundaries

    Never go beyond the current workspace. The workspace is the full set of working directories provided in the environment — not just the primary one. Do not read, write, or run commands against files or directories outside that set.

    The current workspace's root folders are:
    - `D:\FabWorld`
    - `D:\Projects`
    - `D:\___Academic content\Emergent\Excercise 1-20260903T051146Z-1-001\Selected`
    ```
  - At home, confirm the three root-folder paths still match that machine's
    actual layout (same drive letters/paths, or adjust) before pasting.
