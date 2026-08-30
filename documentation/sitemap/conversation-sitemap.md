# Conversation log: the Content Inventory / sitemap

Companion to [`SITEMAP.md`](SITEMAP.md) (mechanism, files, update
workflow) in the same relationship `conversation-landing-page-v3.md` has
to `Landing-page-notes.2.0.md` — that's the reference, this is the
reasoning behind it.

**Honesty note on scope**: this covers `#126` (generating the Content
Inventory instead of hand-maintaining it), recorded from a live
transcript — direct quotes are actually verbatim, not reconstructed.
The earlier work that first wired `generate_sitemap.py`'s output into
the compass rose's W point (`#73`, `v3.7.67`) happened in an earlier
thread this file doesn't have the transcript for — not invented here,
see `conversation-backend-and-deploy.md`'s own scope note for the same
caveat applied to a sibling topic.

No code, commands, or diffs here — those are in git history and in
`Landing-page-notes.2.0.md`'s changelog / `FILE-MANIFEST.md`.

## "how valid is it to have the content inventory ... now that both exist?"

Picking `#126` up directly led somewhere more interesting than a simple
file move. Asked to split the Content Inventory table out of the ToDo
file, the user paired that request with a real question first:

> **how valid is it to have the content inventory documentation now that
> both the TSV editor as well as the SiteMap page exist?**

Investigated rather than assumed: the Sitemap page (`generate_sitemap.py`)
already covers the table's `TSV`/`Map` columns better than the
hand-maintained version did -- live, auto-generated, across all three
worlds, not a stale snapshot. The TSV editor (`cabinet-editor.js`)
validates only within the TSVs themselves (duplicate IDs, missing
fields) and never touches `mkdocs.yml` at all. So the honest answer was
"partially redundant" -- the table's `mkdocs`-nav column and its
narrative duplicate/orphan notes had no other home anywhere in the
system, but its `TSV`/`Map` columns were duplicating work the sitemap
already did automatically, and had visibly drifted from doing it by
hand (the Compass rows, the Now word count, both already caught stale
earlier in this same session).

## Three options, offered back

The recommendation that followed -- generate a trimmed table instead of
relocating the old one verbatim -- got a real pushback, not a flat
approval. The user had already been thinking through the mechanism
question themselves:

> **I'd retain the TSV Maps columns since they arent very heavy to keep
> or check, and gives me a comparision as well - exactly the thing you
> mentioned when something has an entry in one place but not the other,
> etc. I'd like to make it generatable so updates are easier - currently
> I have to rely on you to check every branch and update the list. If it
> is not adding too much complexity - which I think it does - can there
> be an html page showing the content inventory, and it reuses the
> sitemap script or something to check on the TSV+Map situatin, and the
> mkdoc.yml nav for the nav menu? Or teh TSV editor scripts check the
> MKdocs nav and flag entries that arent present there? Or the sitemap
> script generates a report of missing MKDocs Nav, but that is
> essentially a version of the first suggestion here. Let me know
> options - I dont want to increase the number of html md or js files
> unnecessarily but also if the feature is useful it is worth it.**

Three of the four self-proposed directions in that message ended up
converging on the same actual design once written out properly:
extending `generate_sitemap.py` to also parse `mkdocs.yml`'s nav and
emit a second generated file. The response laid out that option
alongside two real alternatives -- extending the TSV editor's browser
UI instead (no new file, but only visible while the local admin server
is running), or a standalone HTML page (needs a build step to export
nav as JSON first, plus new HTML and JS, for a page whose only job is
"check three files agree") -- and recommended the first on the grounds
that it was the smallest real addition: one new responsibility on a
script that already existed, one new generated file, no new page, no
client-side anything.

## "I will manually filter/ignore them"

The proposal had included one piece of mechanism that turned out not to
be wanted: a hand-maintained "known intentional exceptions" list inside
the script, so that deliberate duplicates (like the intentional
Swatch Fields cross-listing) wouldn't get re-flagged as bugs on every
run. The reply that authorized building it declined that specific
piece:

> **yes, go with option 1, and for the exceptions, for the time being I
> will manually filter/ignore them**

A small but real scope simplification: the script ships with no
exceptions list at all, flags everything mechanically including known-
fine cases, and the user reviews the output themselves rather than the
script trying to encode judgment it can't actually make (it can detect
*that* two rows share an href, never *why*, or whether that's fine).

## Building it, and what it immediately found

Implementation avoided a new dependency deliberately: rather than pull
in a YAML parser to read `mkdocs.yml`'s nav (which would have quietly
broken the script's own long-standing "no pip installs needed" promise
in its docstring), the nav gets read with a small regex-based line
scanner tuned to its actual shape -- a flat list of `- Label : target`
leaves under one `nav:` key, no real hierarchy needed for this purpose.

Running it for the first time immediately paid for itself twice over,
independent of the new inventory file it was built to produce:

- It caught two genuine duplicate hrefs (the `bookshelf` section and
  the `christie` entry sharing one URL; the two `Swatch Fields` TSV
  rows sharing another) -- exactly the kind of cross-check that was the
  whole point of building this.
- Regenerating `docs/sitemap.md` in the same run fixed a real,
  previously-unnoticed staleness bug: the compass rose's own W point
  had gone live pointing at `/sitemap/` a session earlier, but
  `sitemap.md` itself hadn't been regenerated since, so it was still
  showing itself as "no page yet."

## This handoff

The Content Inventory is now generated (`#126`, first cut) rather than
hand-maintained. Open question, not yet resolved: whether the ToDo
file's own ~137-item sequence should also split into separate files —
raised in passing, not decided. (The reorg and launch-milestone threads
from this same overall working stretch live in
`conversation-backend-and-deploy.md`, not here.)
