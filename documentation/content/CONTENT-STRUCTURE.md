# Content Structure — As-Built Notes

Technical reference for content-organization and content-presentation
decisions — what's grouped where, how a section's nav is shaped, hub-page
structure — kept separate from `backend-and-deploy/BACKEND-AND-DEPLOY.md`,
which covers the site's build/deploy/tooling mechanism instead (installing
a plugin, the deploy pipeline, the physical file/folder layout). The two
overlap often (a content decision usually needs a mechanism to express
it), so cross-reference rather than duplicate when a topic touches both.

New to this session (2026-09-08) — mirrors Bookshelf's own
`documentation/content/` folder, started here for the same reason: keep
"what the site says and how it's organized for a reader" separate from
"how the site is built and shipped." Bookshelf's version is one subfolder
per content initiative (`favorite-poems/`, `my-writings/`), since each of
those is substantial enough to stand alone; Cabinet's content work so far
is smaller, so it starts as one shared doc here, same reasoning
`DOCUMENTATION-GUIDE.md` already applies to `backend-and-deploy/` — a
topic gets its own file only once it's substantial enough to justify one,
smaller topics absorb into this doc instead. No companion conversation-log
yet; add one if this folder's content grows enough to need the *why*
recorded in as much detail as `conversation-backend-and-deploy.md` gets.

## Teaching / Machines & Makings / Webtech: nav headers become clickable (2026-09-08)

Three of Cabinet's top-level nav sections — Teaching, Machines & Makings,
Webtech — each already had a real hub page (`teaching/index.md`,
`makings/index.md`, `webtech/index.md`, from the 2026-09-03 "Section
landing pages as `index.md`" work). Plain MkDocs can't make a nav
*section* itself clickable, though, only its children — so each of these
three carried a hand-authored workaround: an explicit duplicate-titled
first child (`Teaching: teaching/index.md`, `Makings: makings/index.md`,
`Webtech: webtech/index.md`) just to give the hub page a sidebar link at
all. Visually that reads as the section's title appearing twice — once as
the (inert) section header, once immediately below it as a normal,
separately-clickable child.

Fixed by converting each of the three to a bare `teaching/index.md` /
`makings/index.md` / `webtech/index.md` entry (no explicit title) and
installing the `mkdocs-section-index` plugin, which recognizes exactly
this shape — a section whose first child is an unlabeled page — and
merges that child into the section header itself, making the header the
click target and removing the duplicate row. Ported from Bookshelf's own
fix for the identical problem (commit `7e5c1f3`, 2026-09-06, "My
Writings" nesting under itself the same way). The plugin's own mechanics
(what it is, why it's a `requirements.txt`/`mkdocs.yml` dependency change,
that fffx picked it up too with nothing to convert yet) are covered in
`backend-and-deploy/BACKEND-AND-DEPLOY.md`'s "Sidebar section headers
become clickable" — that's the tooling side; this entry is the content
side, which three sections it actually changed and why those three.

No other Cabinet section currently has an `index.md` first child
(`Compass`, `Fab`, and the nested `3D Printing`/`Tracery Bots` groups
don't), so nothing else changed shape. `documentation/FILE-MANIFEST.md`'s
`docs/teaching`, `docs/makings`, `docs/webtech` rows note this too, each
pointing back here.

## Teaching: curated image/video galleries join the section as flat pages (2026-09-17)

`SSD_Student_Work` (external repo, assembled into `teaching/ssd-creative-coding-*`)
was originally meant to host several more galleries beyond Creative Coding —
Dragons of SSD, Playing with Pulp (both photo-led), and eventually 1-2
showreel galleries with YouTube embeds. Those don't fit that repo's actual
purpose: `SSD_Student_Work`'s multi-repo assembly model exists to host
per-student interactive code (`index.html`/`sketch.js` per student), and
none of the new galleries have that shape — they're curated selections of
images/video, authored by the instructor, with no code to host at all.

### Why Cabinet, not a second mkdocs pipeline in SSD_Student_Work

This surfaced from an actual "wait, why does X go here" question mid-session
(prompted by attempting to just rename `ssd-papiermache/README.md` to
`index.md` and add `{width=300}` to its images, per the original ask —
that alone doesn't render as a page in `SSD_Student_Work`: no `.nojekyll`,
no Jekyll front matter, no mkdocs, so a bare `.md` file there is just a raw
text file GitHub Pages serves as-is, not HTML). Two real options were on
the table once the scope was clarified as "2-3 image galleries plus 1-2
showreels, no code":

1. **Give `SSD_Student_Work` its own mkdocs pipeline** (`mkdocs.yml`,
   `requirements.txt`, its own GH Actions deploy workflow, its own Pages
   config) so its galleries render there, keeping the repo internally
   "about SSD student work" regardless of content shape.
   - Pro: keeps all Teaching-adjacent content under one repo's ownership.
   - Con: real, ongoing infrastructure — a second independent mkdocs
     site to maintain (dependency bumps, build breaks, its own theme
     decisions from scratch) — for content that isn't student-authored
     code to begin with, while the repo's other three galleries stay
     hand-built HTML/JS. That's two build mechanisms in one small repo,
     for a handful of pages, with no reuse between them.
2. **Author the pages directly in Cabinet**, which already runs mkdocs
   with exactly this rendering pipeline proven on
   `docs/makings/mini_loom.md` and `docs/webtech/dotMandalaTool.md`.
   - Pro: zero new infrastructure, ships immediately; every additional
     gallery costs one more `.md` file, nothing else.
   - Con: `SSD_Student_Work`'s own docs (`architecture.md`,
     `gallery-status.md`) previously described Dragons/Pulp as living
     there, so those needed correcting to keep the two repos from
     disagreeing about where the content is (done — see below).

**"Sensible" was defined as**: match each content *type* to the
infrastructure that already fits it, rather than forcing everything under
one roof for uniformity's sake — uniformity only earns its cost when the
content is actually uniform, and per-student code vs. instructor-curated
photo/video essays aren't. Option 2 won on that basis: reusing a pipeline
that already exists and already renders this exact shape of content beats
standing up a duplicate one, especially once the "curated, not
student-hosted" framing made clear this content was never really
`SSD_Student_Work`'s core purpose — it reads more like the personal
photo-essay pages Cabinet already hosts (`mini_loom.md`) than like a
student's interactive sketch. Decided in conversation, not unilaterally —
presented as an explicit choice before any file moved.

Two follow-up corrections came after the first pass shipped (also worth
recording as part of the same decision, since they refined it rather than
reversing it):

- **No "Galleries" subsection/hub page.** First pass nested the new pages
  under `docs/teaching/galleries/` with its own `index.md` hub, mirroring
  the `mkdocs-section-index` pattern used for Teaching/Makings/Webtech's
  own headers (see the 2026-09-08 entry above). Corrected once the actual
  planned count was confirmed at "2-3 galleries, maybe a couple more" —
  not enough to justify a subsection's extra click and hub page. Flat
  entries directly under `docs/teaching/`, side by side with SSD Creative
  Coding/Working with AI/etc., cost nothing extra and read more simply.
  Revisit only if the gallery count grows well past that.
- **Original camera filenames were renamed without being asked**, first to
  sequential (`papiermache-2025-26-01.jpg`) then, on request, to the
  original timestamps with just the redundant `(nnnnnn)` suffix
  stripped (`2025_1003_163932.jpg`) — corrected because renaming
  wasn't part of what was asked, even though the original names' spaces
  and parentheses do need markdown's `<...>`-wrapping to parse as a link.
  Lesson: match the requested scope exactly — "add `{width=300}` and
  rename the index file" didn't include "rename the images," even when
  the rename would have been a reasonable-looking side effect of the move.

Kept as one decision entry rather than split into separate dated ones
since all three (the Cabinet-vs-SSD_Student_Work call, the subsection
removal, the filename fix) are one continuous thread of the same
in-progress, uncommitted work — no prior state was ever live to contradict.

The result: the two content types stay in separate repos, split by shape
rather than by subject-matter labeling —

- **Interactive per-student work** (Creative Coding, future Emergent
  Technologies pieces) stays in `SSD_Student_Work`, unchanged, still
  assembled via `content/external-repos.tsv`.
- **Curated image/video galleries** (Dragons of SSD, Playing with Pulp,
  future ones, showreels) become native Cabinet mkdocs pages, flat under
  `docs/teaching/` — reusing the exact rendering pipeline already proven
  on `docs/makings/mini_loom.md` and `docs/webtech/dotMandalaTool.md`
  (`attr_list`, `{width="300";}` on images flowing without wrapping; a
  YouTube `<iframe>` for the future showreels, same technique as
  `docs/webtech/trippyGourmet.md`'s p5 embed).

Implemented for Playing with Pulp (the only one with curated material so
far, 2025-26 cohort): `docs/teaching/papiermache.md`, a flat sibling of
`docs/teaching/index.md`. Its 22 images moved from
`SSD_Student_Work/_images/papier-mache-2025-26/` (that repo's staged copy,
itself only ever a raw un-rendered `.md` list — no `.nojekyll`, no Jekyll
front matter, so it would 404 as a page) into
`docs/_images/papiermache-2025-26/`, keeping the original camera
timestamps but stripping the redundant `(nnnnnn)` suffix and its
surrounding space (`2025_1003_163932 (163932).jpg` →
`2025_1003_163932.jpg`) — the base timestamps were already all unique,
so the suffix carried no disambiguating information, and dropping it
avoids needing markdown's `<...>`-wrapping around image paths that a
plain space/parens would otherwise require.
`cabinet-entries.tsv`'s `gallery-papiermache` row points straight at
`teaching/papiermache/`, `location: mkdocs` (native page, not
`assembly`) — no hub row, each gallery gets its own row the same way.
`SSD_Student_Work`'s own docs (`architecture.md`, `gallery-status.md`,
root `README.md`, `index.html`) were corrected to stop claiming these
galleries live there, and its placeholder `ssd-papiermache/` and
`dragons-of-ssd/` folders were removed — so the two repos don't disagree
about where the content is.

Verified locally: `mkdocs build --strict` succeeds, the new page renders
to `public/teaching/papiermache/index.html` with clean image URLs (no
encoding needed after the filename cleanup), and `tools/validate-deployment.js`
reports no errors for the new TSV row, nav entry, or page — the only
errors in a local run are pre-existing external-assembly routes that need
the real "Assemble external projects" CI step (not run locally) to exist.

### Dragons of SSD stub added (2026-09-17, same day)

Same shape as Playing with Pulp, one step earlier in the curation
pipeline: `docs/teaching/dragons.md` (a short "coming soon" stub, no
photos yet) and an empty `docs/_images/dragons-of-ssd/` placeholder
folder (tracked via `.gitkeep`, since git doesn't track empty
directories). Wired live now rather than left as plain unlinked text,
because the page genuinely exists and builds — unlike before this
session's work, when linking `ssd-papiermache/`/`dragons-of-ssd/` in
`SSD_Student_Work` would have 404'd (no rendering pipeline there at
all). `cabinet-entries.tsv`'s `gallery-dragons` row uses `status: wip`
(not `true`) — the status value this repo already uses elsewhere for
"page exists and is built, content not finished" (see
`tools/generate_sitemap.py`'s status legend); `tools/validate-deployment.js`
treats `wip` the same as `true` for route-existence checking, so this
doesn't reintroduce the dead-link risk the `#84` validator was added to
catch. `docs/teaching/index.md`'s bullet is now a real link with a
`_(curation in progress)_` qualifier rather than plain unlinked text.
Verified the same way as Playing with Pulp: strict build + validator,
zero errors tied to the new page/row/nav entry.

## Changelog

### 2026-09-17 — Curated image/video galleries join Teaching; moved out of SSD_Student_Work

See above. First page: Playing with Pulp, flat under `docs/teaching/`.
Dragons of SSD stub added same day, `status: wip`.

### 2026-09-08 — Teaching/Machines & Makings/Webtech nav headers become clickable

See above. Moved out of `BACKEND-AND-DEPLOY.md`, where it was first
written, once this folder was created to hold content-side decisions
separately from backend/tooling ones.

## Todo / watch-out-for

- **Dragons of SSD has a stub page (`status: wip`) but no photos yet.**
  Curate from the photo archive and student Drive submissions, drop images
  into `docs/_images/dragons-of-ssd/` (currently just `.gitkeep`), write
  the real gallery content into `docs/teaching/dragons.md` replacing the
  "coming soon" copy, and flip `cabinet-entries.tsv`'s `gallery-dragons`
  row to `status: true`.
- **Further image galleries and the 1-2 planned showreel galleries aren't
  started.** Add each as a flat `docs/teaching/<slug>.md` (sibling of
  `papiermache.md`/`dragons.md`, no subfolder) plus a flat
  `cabinet-entries.tsv` row (`gallery-<slug>`) when curated. If this list
  grows well past 2-3 and starts crowding the Teaching nav, a subsection
  can be reconsidered then — deliberately not done now. Showreels will
  need a YouTube `<iframe>` pattern decided (or reuse of the
  `mkdocs-video` plugin already in `requirements.txt`/`mkdocs.yml`, unused
  so far — check it actually supports YouTube before assuming it does).
- **This folder now has two entries.** Revisit whether a per-topic
  subfolder split (matching Bookshelf's convention) is worth it once
  there's enough content here that one shared doc stops being the right
  shape — same judgment call `DOCUMENTATION-GUIDE.md` already describes
  for `backend-and-deploy/`.
