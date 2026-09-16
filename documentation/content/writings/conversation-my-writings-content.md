# Conversation log: My Writings content

**Migration note (2026-09-16):** moved here from the Bookshelf repo
unchanged, alongside [`MY-WRITINGS-CONTENT.md`](MY-WRITINGS-CONTENT.md) —
see that file's own migration note for what moved and why. Everything
below is the original conversation record from the Bookshelf-side build
and still refers to that repo's paths/nav names throughout.

Companion to [`MY-WRITINGS-CONTENT.md`](MY-WRITINGS-CONTENT.md) (what the
three collections are, where they came from, the conventions that govern
them) — this file is the reasoning behind it: what was asked, what got
tried and corrected. Unlike Favourite Poetry's conversation log, this
session ran start-to-finish with no context compaction, so every quote
below is verbatim, not reconstructed from a summary.

## The opening ask

> **After the newly added Favourite Poems part, lets add my own writings
>
> F:\\__SnowCrash\\__WebPages\\TheBookshelfOfCuriosities\\convert\\My writings
>
> Give me a plan of action.**

The reply read through every file in `convert/My writings/` (two `.docx`
essays, a `.pptx` plus an images folder, a standalone PDF, two `.docx`
poem files) before proposing anything, rather than guessing a structure
from filenames alone — reading the PDF and running a quick manual
`document.xml` tag-strip on each `.docx` (later replaced by pandoc, see
the companion doc's pipeline section) to actually see what each piece
was, not just how big it was. That surfaced a few things the plan
depended on: *Elevator Pitch* reads as flash fiction, not a business
pitch; the Colloquium essay comes with a slide deck and a folder of
scanned comic panels illustrating it; and `convert/` itself turned out to
be untracked by git entirely (confirmed via `git ls-files convert/`),
which shaped the recommendation to leave the pptx/images out of `docs/`
by default rather than asking about copyright as a blocking question.

The proposed plan (essays/fiction/poems under a new `my-writings/` tree,
flat nav entries mirroring Favourite Poetry's own top-level entries at
the time, pandoc-based conversion, images/pptx held back) was accepted
with two corrections and one addition:

> **go ahead, and the elevator pitch txt file has the story as well, you
> cna use that if you cant process the pdf.
> hold on to the ppt and images, we'll discuss that later**

The `.txt` file's existence hadn't been noticed in the initial file
listing; found via a targeted search once mentioned, and used as the
copy-source for the short story after confirming it matched the PDF's
extracted text exactly. "Hold on to the ppt and images" confirmed the
default (don't publish them) as the actual decision, not just a
placeholder pending the user noticing.

## Build, verify, commit

Pandoc conversion, hand-cleanup (footnote syntax, poem line-break
reformatting, Word TOC/field-code stripping — see the companion doc's
pipeline section for the full list), then `mkdocs build --strict`
verification before every commit in this session, not just the first —
each subsequent nav/plugin change below was also strict-build-verified
before committing.

## Three corrections to the initial build

### 1. Miscellany, not Fiction; dates; list entries on the hub

> **Since there are very few entries presently under each heading, while
> you can keep maintaining th essay, fiction, poems index pages, I would
> very much like them to be directly linked form the my writings page as
> well under the 3 subheadings.
>
> Also we had decided that the third category was Misc - Use Miscellany -
> not My Fiction, since there is literally one short story.
>
> Add dates of writing where available
> The essays are 2011, and 2012**

"We had decided" refers to a decision made before this conversation
(outside this session's own record) — taken at face value and applied
directly, no clarification asked. The stated essay years were verified
against source-file metadata rather than just trusted outright: each
`.docx`'s `docProps/core.xml` (`dcterms:created`) was extracted directly,
confirming *A History of Design* at 2011-11-28 and the Colloquium essay
at 2012-08-27 — an exact match to the user's recollection, and notably
*not* what the files' own filesystem timestamps said (both showed an
identical 2017-05-28 modified date, which would have been actively wrong
if used instead). The same metadata check was extended to the poems and
the PDF for consistency, surfacing the March 2023 dates and the PDF's
2019 creation date.

`fiction/` was renamed to `miscellany/` via `git mv` (history-preserving),
and `my-writings/index.md` was rewritten from three bare links into three
`##` subheadings each listing every entry directly underneath.

### 2. Nav: subheadings, not flattened

> **My Essays
> Miscellany
> My Poems
> I meant for all 3 to be subheadings under My Writings, there was no
> need to change that. The change to the My Writings index page is
> correct.**

The prior commit had (incorrectly) turned three items that were meant to
be nested nav children into three additional flat top-level `mkdocs.yml`
entries. Fixed by nesting them under one "My Writings" group, mirroring
the nested-nav shape `mkdocs.yml` already used for "Interactive Projects"
— an existing pattern in the file, not a new one invented for this. The
hub-page rewrite from correction 1 was confirmed correct as-is and left
untouched.

### 3. The duplicate sidebar entry, and the plugin fix

> **is there no way for mkdocs to allow a heading to be a page AND a
> section ? We can work around this from the landing page but in the
> sidebar it is confusingly evident - there is a My Writings with the
> first entry under that being My Writings.**

This was answered directly rather than immediately coded around: plain
MkDocs nav genuinely can't do this (a section's first unlabeled child
inherits that page's own `<h1>` title as its nav label, which is why
"My Writings" appeared nested under itself), but the community
`mkdocs-section-index` plugin exists specifically to make a section
header itself link to that first child page, removing the duplicate.
Presented as a choice rather than assumed:

> *(AskUserQuestion: "Add the plugin" / "Rename the first child instead"
> / "Leave it as-is for now")* → **"Add the plugin (Recommended)"**

Installed via `py -3 -m pip install mkdocs-section-index`, added to
`mkdocs.yml`'s `plugins:` and `requirements.txt`, verified against a
strict build and by inspecting the rendered sidebar HTML directly (the
section header's `<a>` tag pointing at `./` instead of just a toggle).

**Then it broke locally**, in two steps that turned into their own
mini-investigation:

> **i need to insall it locally as wel ?**

Answered (incorrectly, as it turned out) that no separate install should
be needed, since `py -3 -m pip install` had already put it in the same
per-user site-packages that `pip show mkdocs`/`mkdocs-material` resolved
to earlier in the session.

> **ERROR   -  Config value 'plugins': The "section-index" plugin is not
> installed**

This surfaced a real gap in the earlier assumption: `where mkdocs` showed
the plain `mkdocs` command on `PATH` resolves to `mkdocs.exe` under a
*separate* Python 3.13 install
(`C:\Users\Jesal\AppData\Local\Programs\Python\Python313\`), completely
independent from the Python 3.14 environment `py -3` was installing into.
Two different `mkdocs`/`mkdocs-material` installs on one machine, neither
aware of the other's packages. Fixed by installing the plugin into the
3.13 environment specifically (`.../Python313/python.exe -m pip install
mkdocs-section-index`) and re-verifying with a plain `mkdocs build
--strict` (the exact command the user would actually run), not just
`py -3 -m mkdocs`. This whole two-Python-installs discovery is captured
as its own portable lesson in Bookshelf's
`documentation/landing-page-notes/LANDING-PAGE-NOTES.md` bug #8, since
it's a machine-level gotcha unrelated to My Writings specifically and
worth knowing before installing any future MkDocs plugin on this machine.

## The retroactive fix to Favourite Poetry

> **And I have just noticed that the 3 poetry sections have also been
> falttened to be under root directly - please corret this and keep them
> under the original section name**

Favourite Poetry's three nav entries (Favourite Poems / Long Poems /
British Poetry Workshop) had been sitting flat at the top level since
before this session started — not something this session's own edits had
caused, but the same flat-vs-nested inconsistency corrections 2 and 3
above had just fixed for My Writings made the mismatch obvious. Nested
under a new "Favourite Poetry" group (the exact `<h1>` title of
`docs/favorite-poems/index.md`, "the original section name"), same
nested-plus-`section-index` treatment as My Writings, verified the same
way (strict build, rendered-HTML sidebar check).

## Documentation, and finding the sibling doc mid-task

> **great, now update the documentation - add most of this to the content
> documentation but the plugin/extension is part of the site/platform/code
> docu**

The first attempt at this added a new "Content pages" section directly to
`README.md`. Partway through writing the `FILE-MANIFEST.md` cross-links
for that section, `git status` surfaced an untracked
`documentation/content/favorite-poems/` folder that hadn't been there
earlier in the session — a separate, concurrently-running session's
output, documenting the Favourite Poetry work under a
`documentation/content/<initiative>/` pattern that explicitly avoids
touching `README.md` at all for editorial content. Reading
`FAVORITE-POEMS-CONTENT.md` directly (rather than guessing from the
folder name alone) confirmed this was the actual established convention
for exactly the kind of documentation being asked for here — and that its
own Todo section had already flagged this gap by name: *"A parallel 'My
Writings' section already exists ... It deserves its own content-reference
doc when picked up/verified, out of scope here."*

> **that one is done, no longer concurrent**

Confirmed it was safe to build on top of and reference as finished,
rather than a moving target. The `README.md` addition was reverted in
full (`git restore`), and this doc plus its `FILE-MANIFEST.md` references
were built to match that sibling's structure and location instead — this
file and `MY-WRITINGS-CONTENT.md` are the direct result. The
`mkdocs-section-index`/nested-nav lesson (the "plugin/extension" half of
the request) stayed in Bookshelf's
`documentation/landing-page-notes/LANDING-PAGE-NOTES.md` as bug #8, per
the explicit split in the request: content documentation in one place,
platform/code documentation in the other.
