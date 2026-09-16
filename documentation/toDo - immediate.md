# ToDo — Immediate

Immediate priorities distilled from the broader website and content audits.
Created 2026-09-16.

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

## Easy wins

- [ ] **Finish About's remaining assets.**
  - Replace or remove the remaining image placeholders.
  - Resolve the cycling image/narrative note.
  - Add embedded CV content and a downloadable PDF.
- [x] **Correct the two already-live Teaching links (`02757d6`).**
  - Point Emergent Technologies 2026–27 to its live SSD Student Work gallery.
  - Point Coding with AI to
    `/teaching/working-with-ai/coding-with-ai/index.html`.
- [x] **Finish Site Notes retirement.**
  - Delete the now-unlinked `docs/compass/site_notes.md`.
  - Update `documentation/FILE-MANIFEST.md`.
  - Regenerate and review `documentation/CONTENT-INVENTORY.md`.
  - Preserve the original already stored under the v1 archive.

## Content essentials

- [ ] **Complete the Teaching/student-work structure.**
  - Assemble Creative Coding 2024–25 from the work computer.
  - Finish Emergent Technologies 2024–25's Twine pages and background images.
  - Curate Dragons of SSD and Playing with Pulp as separate galleries.
- [ ] **Publish the first FFFX content expansion.**
  - Dance of Planets.
  - Island Generator.
  - Lenticular Image Generator.
  - Integrate the existing implementations, select examples, and add the
    explanatory project pages.
- [ ] **Move My Writings into Cabinet.**
  - Move the existing essays, poems, and miscellany from Bookshelf.
  - Establish Cabinet as the canonical home for authored work.
  - Keep Favourite Poetry and the British Poetry Workshop in Bookshelf.
  - Remove the pending Bookshelf landing card for My Writings.

- [x] **Add deployment validation.** (2026-09-16, implemented + tested
  locally, not yet committed/pushed)
  - Validate active TSV destinations. -- `tools/validate-deployment.js`
  - Verify generated landing data is current. -- new `deploy.yml` step,
    re-runs `build-cabinet-content.js`/`build-now-content.js`, fails if
    the committed output drifts.
  - Require entry points for standalone projects. --
    `requiredFiles`/`requiredContent` in `content/external-repos.tsv`,
    enforced by `assemble-external.js`.
  - Validate assembled Teaching routes. -- covered generically by
    `validate-deployment.js` (all local hrefs, not Teaching-specific).
  - Reject destination collisions. -- `external-repos-tsv.js` (manifest
    parse time) + `assemble-external.js` (runtime, vs. MkDocs output).
  - Run strict MkDocs builds. -- `mkdocs build --strict`, confirmed
    clean locally first.
  - Full account: `documentation/backend-and-deploy/BACKEND-AND-DEPLOY.md`'s
    2026-09-16 changelog entry.
- [x] **Generalize external-repository assembly.** (2026-09-16, same
  pass as above)
  - Replace repeated workflow blocks with a manifest. --
    `content/external-repos.tsv` + `tools/assemble-external.js`, six
    hand-written checkout/assemble/validate step triples in `deploy.yml`
    collapsed to two generic steps.
  - Record repository, optional source subfolder, deployment destination,
    required entry point/assets, and validation rules. -- all manifest
    columns; see `cabinet-multi-repo-assembly-concept-note-short.md`'s
    "Quick reference" section.
  - Same pass also fixed the Teaching deployment issue (SSD galleries
    2024-25/2023-24 now wired into the manifest + `cabinet-entries.tsv` +
    `mkdocs.yml` nav) -- **but not live**: blocked on pushing
    `SSD_Student_Work`'s `main`, which was deliberately held back
    pending this exact fix. **Push that repo's `main` before pushing
    this Cabinet change**, or the next Cabinet deploy fails outright.
- [ ] **Complete cross-world and homeworld navigation.**
  - Make Cabinet, Bookshelf, and FFFX each link to both sibling worlds.
  - Make assembled and standalone projects link back to their owning world.
  - Prioritize Cabinet's six assembled projects and Bookshelf's SciFi, Asimov,
    and Christie projects.

## Recommended order

1. Finish About's CV and image assets.
2. Assemble and complete the remaining Teaching collections.
3. Publish the FFFX content sprint.
4. Add deployment validation.
5. Generalize repository assembly.
6. Complete cross-world and homeworld navigation.

Completed in this pass: the already-live Teaching links were corrected in
`02757d6`, and the current Site Notes source was retired on 2026-09-16.
9. Move My Writings to Cabinet.
