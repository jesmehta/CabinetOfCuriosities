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

## Changelog

### 2026-09-08 — Teaching/Machines & Makings/Webtech nav headers become clickable

See above. Moved out of `BACKEND-AND-DEPLOY.md`, where it was first
written, once this folder was created to hold content-side decisions
separately from backend/tooling ones.

## Todo / watch-out-for

- **This folder is new and has exactly one entry.** Revisit whether a
  per-topic subfolder split (matching Bookshelf's convention) is worth it
  once there's enough content here that one shared doc stops being the
  right shape — same judgment call `DOCUMENTATION-GUIDE.md` already
  describes for `backend-and-deploy/`.
