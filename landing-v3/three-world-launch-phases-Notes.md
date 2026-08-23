# Launch Phase Notes

## Table of contents

- [Cabinet deployment / multi-repo assembly](#cabinet-deployment--multi-repo-assembly)
  - [Branch / production transition -- why a normal merge, not a branch switch](#branch--production-transition----why-a-normal-merge-not-a-branch-switch)
  - [Failure behaviour](#failure-behaviour)
- [TSV editor requirements](#tsv-editor-requirements)
- [Phase framing (for quick recap)](#phase-framing-for-quick-recap)

Companion to `three-world-launch-phases-ToDo.md` (same directory): the
why/how behind that file's Phase 1-2 checklist items. Split out
2026-08-23, along with that file, from the retired
`three-world-launch-phases.md` / `three-world-launch-phases-v2.md` --
the checklist had outgrown a flat punch-list format, and this rationale
content doesn't belong on a checkbox line.

---

## Cabinet deployment / multi-repo assembly

The V3 branch already uses the preferred GitHub Pages publishing model:

```text
MkDocs build
    ↓
public/
    ↓
GitHub Pages artifact
    ↓
deploy-pages
```

This replaces the older pattern of pushing generated files to a
`gh-pages` branch. The final production workflow should preserve this
artifact-based method.

For multi-repo deployment, Cabinet's GitHub Actions workflow should
temporarily check out selected external repositories and copy/build
their finished static output into Cabinet's `public/` tree **before**
the Pages artifact is uploaded.

Initial proof:

```text
Cabinet repo
    ↓ build into public/

Working with AI repo
    ↓ temporary checkout

copy into:
public/teaching/working-with-ai/

    ↓
validate combined output
    ↓
upload one Pages artifact
    ↓
cabinetofcuriosities.in
```

The external project is **not copied into the Cabinet source
repository**. It exists only in the temporary Actions runner and in the
final generated static deployment.

The first public mount should be:

```text
cabinetofcuriosities.in/teaching/working-with-ai/
```

Once tested, both the Cabinet landing-page entry and `mkdocs.yml` should
point to that Cabinet-local path instead of the external one.

The correct external URL is `https://jesmehta.github.io/working-with-ai/`
(confirmed directly by the user) -- earlier source material had it as
`jesalmehta.github.io` in several places, a typo now corrected throughout
this file, `three-world-launch-phases-ToDo.md`, and
`cabinet-multi-repo-assembly-concept-note-short.md`. Don't confuse this
with `jesalmehta.com`, which is a real, correct, separate personal
domain used elsewhere on the site (the CV entry, the compass rose's West
link) -- that one is untouched.

### Branch / production transition -- why a normal merge, not a branch switch

Changing GitHub's default branch or publishing directly from the
prototype branch is technically possible, but is not the preferred
long-term setup. V3 should become the new `main` through a normal merge,
while the previous production state remains recoverable through Git
history/tagging. (The concrete steps live in `three-world-launch-phases-ToDo.md`'s
"Branch / production transition" checklist.)

### Failure behaviour

Assembly should be all-or-nothing:

```text
build Cabinet
    ↓
fetch/build external project
    ↓
assemble
    ↓
validate
    ↓
deploy
```

If any required step fails, no new Pages artifact is deployed and the
previous successful live version remains online.

---

## TSV editor requirements

(For the "Build TSV editors for Cabinet, Bookshelf, FFFX" item in Phase
2 of `three-world-launch-phases-ToDo.md`.)

- add/edit/delete sections and entries;
- validate required fields;
- manage order, weight, status, tags and links;
- catch duplicate IDs and invalid section references;
- preserve each world's own schema rather than forcing one universal
  schema.

---

## Phase framing (for quick recap)

- **Phase 1 -- Launch:** make Cabinet, Bookshelf and FFFX coherent,
  linked, stable and publicly ready.
- **Phase 2 -- Immediate post-launch:** fill structural/context gaps,
  build TSV editors, harden assembly and documentation.
- **Phase 3A -- Short-term projects:** finish and surface work already
  underway. Principle: low-effort, high-value work that makes existing
  projects visible and complete.
- **Phase 3B+ -- Long-term:** continue adding content and refining all
  three worlds as an ongoing system, not a project waiting to be
  "finished."
