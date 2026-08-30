# Conversation log: Admin Controls

Companion to [`ADMIN-CONTROLS.md`](ADMIN-CONTROLS.md) (mechanism, routes,
files, update workflow) in the same relationship
`conversation-landing-page-v3.md` has to `Landing-page-notes.2.0.md` —
that's the reference, this is the reasoning behind it.

Recorded from a live transcript — direct quotes are actually verbatim,
not reconstructed, same standard as this repo's other conversation-log
docs. No code, commands, or diffs here — those are in git history and in
`ADMIN-CONTROLS.md`'s own changelog.

## "tell me what parts need to be 'done by hand' vs what is automated"

The thread opened with a plain audit request, no code yet:

> **Examine the repo, files and documentation. Tell me what parts need
> to be "done by hand" vs what is automated ?**

The answer sorted the whole repo into four buckets — fully automated
(CI, via `deploy.yml`), script-automated-with-a-button (the TSV editors'
own Rebuild buttons), hand-authored content (TSVs, prose pages — the
maintainer's own material, not a concern), one-time work (map-shape
generators, migrations — done once, not a concern), and documentation
markdown files (real handwork, done by the assisting session, but
takeable-over if needed). The reply narrowed the scope immediately and
precisely:

> **Ignoring all the v2 stuff - outdated. Fully automated stuff - cool !
> Not a concern then. Ignoring the TSVs - those I edit myself anyway. The
> scripts that work off the TSVs - those I would trigger with buttons on
> the editor pages, an obvious step. Prose pages - again, my content,
> can't be missed. One time stuff - is one and done, not a concern.
> Documentation mds - major handwork, done by you, but can be taken over
> if needed.**

That message reframed the whole exercise as, in its own words, "an audit
of Cabinet's AI dependency" — not a general repo tour, a specific
question about which parts would stall without an AI session available.
It also named the one thing that didn't fit neatly into any of the
"not a concern" buckets already dismissed:

> **My primary concern seems valid - the index.html lnader page and it's
> v3 counterparts etc - that whole workflow involves hand copy-pasting,
> path management, etc that I would not be able to take up easily if AI
> wasnt available.**

Followed by three concrete questions: are there more areas like that
one; what exactly does the `index.html` workflow's hand work consist of,
and can it be automated safely; and what other scripts need triggering
without an obvious button, the way the TSV editors' Rebuild buttons
already cover their own scripts.

## Finding the real gap: no promotion script exists at all

Answering those three questions meant actually reading the mechanism,
not describing it from memory: `landing-v3/build-static.mjs` in full,
then a byte-level diff between `landing-v3/index.html` (the dev output)
and the already-promoted `docs/index.html`, to find the *exact* asset
paths that differ between them rather than asserting there were some.
That diff turned up three precise literal-string rewrites (two
stylesheet `href`s, one script `src`) — not a vague "some paths change"
but the specific before/after strings, confirmed against the real
files.

`three-world-launch-phases-ToDo.md` and `Landing-page-notes.2.0.md` were
then read for the history behind that gap, and both confirmed it
directly: no promotion script had ever existed, promotion was hand-done
every time, and a real bug had already shipped once from doing it
naively (a `cp` that carried the dev build's own-folder-relative paths
straight into `docs/`, where they resolved to nothing). `generate_sitemap.py`
turned out to have the same shape of problem, worse in one way — it goes
stale when *other* repos' content changes, not just this one's, and a
dead compass-rose link had already shipped from exactly that.

## "how does build-static.mjs run" and the decision to keep two scripts

A direct follow-up narrowed the plan before any code got written:

> **so when does build-static.mjs run ? Does it have a button on the
> island-tool page ? Or does it autotrigger from changes to the
> island-tool page ?**

Checked directly in `islands-tool.html`'s and `cabinet-v3-controls.js`'s
own source rather than assumed: no reference to `build-static` anywhere
in either file. Confirmed as CLI-only, fully decoupled from the live
tuning tool — even that tool's own "Copy config" button only puts the
tuned object on the clipboard, it doesn't write to any file `build-static.mjs`
would then pick up.

The same message settled the shape of the fix:

> **the Promotion script - yes, do make a script. -- if this is a
> seamless step with no other intervention between build-static and
> promote, then they can be one, else let them be two separate steps. I
> suspect build static is used for other things as well - headless
> chromiums and island-tool updates, so maybe promote is a separate
> script.**

That reasoning held: `build-static.mjs` is genuinely used standalone
while iterating on the map, so folding promotion into it would mean
every dev-only run also touching the live site's files. `landing-v3/promote.mjs`
was built as a fully separate script instead — copies the built
`index.html` and `shared/` modules into `docs/`, applies the exact three
known path rewrites (asserted to match exactly once each, so a future
template change fails loudly instead of silently promoting something
wrong), then re-renders the promoted page in headless Chromium and fails
on any console/request error.

Two real issues turned up running it for real against the live repo,
not just reading the code back: the Cloudflare Web Analytics beacon
(`cloudflareinsights.com`) is always CORS-blocked on `localhost`,
producing a false-positive failure that needed filtering out of the
verification pass specifically (not just silencing all console errors);
and the browser's own generic "Failed to load resource: net::ERR_FAILED"
console message carries no URL, so it had to be dropped in favor of the
`requestfailed`/`response` handlers that do carry one, rather than risk
hiding a real failure under a URL-based filter. A clean re-run against
an already-correctly-promoted `docs/` afterward reported every file
`unchanged` — confirmed byte-identical, not just "didn't crash."

## The admin-controls page itself, asked for in the same message

The same turn that settled Build vs. Promote also asked for this
dashboard directly, as a numbered wishlist:

> **How about a page that is the home-page for the backend - buttons to
> trigger the unbuttoned scripts - to start servers and such for the now
> and tsv editors - to open the now and tsv editor pages, as well as the
> island tool - throwing in access to the documentation files as well if
> the page exists - browsing the documentaton md files rendered on the
> html or just linking to the online repo page where the md file can be
> rendered on github - text guidlines on gotchas and watch-out-fors
> alongside their relevant scripts, etc - any other untehered backend
> functions, guides, warnings**

Every item in that list maps directly onto a section of `ADMIN-CONTROLS.md`'s
"Routes"/"The documentation table" — the doc-rendering choice ("browsing
... or just linking") was taken as permission to pick the simpler of the
two options, given every other tool in this repo is zero-dependency and
adding a Markdown renderer just for this would be the first exception.
A few implementation calls weren't specified and were made directly
rather than asked about: port `5959` (simply the next number after the
existing `5757`/`5858` pair), serving the whole repo root rather than
just `docs/` (so `islands-tool.html`'s own relative asset paths would
resolve), and adding the `mkdocs build --strict` check as a bonus not
explicitly requested but matching the "any other untethered backend
functions" clause directly.

## "where does this admin file live"

A short, direct question once the dashboard was running:

> **where is this admin file live ?**

Answered with the literal file tree (`tools/admin-controls.js`,
`tools/admin-controls-ui/`, `run-admin-controls.bat`, `landing-v3/promote.mjs`),
not a description — the kind of question where the exact paths are the
whole answer.

## Adding the maintainer's own diagram, and finding the concurrent reorg

A new ask, with a URL:

> **can we add this artefact i'd made with claude web to understand for
> myself the structure of the then-current deployment workflow ?
> https://claude.ai/code/artifact/b69fceba-1590-4897-8c13-75a61bcf7f46**

Fetched and read in full before linking it — a Mermaid diagram, "Data →
Map → Page," mapping the `landing-v3` build pipeline stage by stage.
Added to the dashboard's documentation list with an honest caveat rather
than treating it as more current than it was: it predates `promote.mjs`,
so it stops at "`index.html`, frozen snapshot" and never shows the
`docs/` promotion step at all. The follow-up request tracked that gap
formally:

> **add a todo to update the artefact and bring it into the local repo
> at somepoint**

Added as `#138` in `three-world-launch-phases-ToDo.md`, matching that
file's own numbering and format convention.

While adding it, a `git status` check ahead of a routine edit surfaced
something unrelated to the task at hand: `documentation/` was mid-rename
into per-feature folders, on disk, uncommitted — not this session's own
work. Flagged directly rather than silently working around it or
guessing at in-flight paths, and confirmed nothing had been clobbered
(the edit landed at a spot in the ToDo file that didn't overlap with the
other session's changes).

## "great, split commit as needed"

> **great, split commit as needed**

Two commits: `promote.mjs` + its `package.json` entry + the updated
`docs/index.html` banner in one, the whole `admin-controls.js` dashboard
in the other — split by what each change was actually *for*, not by
file count. Checking the working tree immediately before staging turned
up that the concurrent `documentation/` reorg had, in the meantime,
resolved itself — a `git log` showed it had been committed by whatever
was doing that work, and the `#138` entry added a few turns earlier had
landed inside one of those commits rather than getting a commit of its
own, since it had been sitting in the same file before that session
committed. Confirmed via `grep` that the content itself was intact and
unaltered — nothing was lost, it just wasn't attributed to this thread's
own commit.

> **where is the #138 entry located ?**

Answered by locating the exact file and line, then confirming via
`git log -S` which commit had actually introduced that text — not just
asserting it was fine.

## Fixing the doc links after the reorg landed

Once the reorg was confirmed committed and pushed:

> **check the docu file links under Documentation post new commits. Add
> new files that may have turned up.**

Four of the dashboard's hardcoded links had broken (`CABINET-EDITOR.md`,
`NOW-PAGE.md`, `Landing-page-notes.2.0.md`, `conversation-landing-page-v3.md`,
each moved into a new feature folder) — found by reading `FILE-MANIFEST.md`'s
own freshly-updated table rather than guessing at new paths, and cross-checked
every proposed path against `git ls-files` before using it. Six new doc
rows were added for files the reorg had introduced (`DOCUMENTATION-GUIDE.md`,
`conversation-backend-and-deploy.md`, `SITEMAP.md` and its conversation
companion, and the `conversation-cabinet-editor.md`/`conversation-now-page.md`
companions that already existed alongside docs already linked).
`cloudflare-js-snippet.md` was checked and deliberately left out —
confirmed gitignored and never pushed, so a GitHub link to it would
404.

## Organizing and styling the doc table

A direct structural request:

> **Can you organize the links further - system wide stuff and it's
> mutliple md files, and then individual features and their multiple or
> single files**

Split into two tables, mirroring `FILE-MANIFEST.md`'s own root-vs-folder
structure rather than inventing a new grouping scheme — a System-wide
table for docs that sit flat at `documentation/` root, and a Features
table grouped by subsystem with a labelled divider row per group. Two
rounds of visual feedback followed once it was live:

> **the feature title rows need to be more prominent -increse font by +2
> or so, or indent the contents under each head by some distance**

Both were done together rather than picking one — font size bumped
`12.5px` → `14.5px`, and the Features table's own rows indented `30px`
under their group header. A follow-up look at the live page asked for
more:

> **or darken the blue background for those rows some more**

The shared `--accent-soft` token (`#DDE6E8`) was replaced with a
hand-picked, more saturated `#B9CDD0` for the group-row background
specifically, not the shared variable itself, so nothing else reusing
that token elsewhere on the page darkened as a side effect.

## Commit, push, and two follow-on documentation requests

> **great, commit and push.**
>
> **Where is the promote.mjs documentation mentioned ?**

Answered by grepping the whole repo for `promote.mjs` rather than
assuming it was undocumented — it turned out a concurrent session had
already written it up in both `README.md`'s changelog and
`FILE-MANIFEST.md`'s `tools/` table, independently of this thread.

The same message asked for a second, larger piece of documentation:

> **Can you also create, based on
> F:\\__SnowCrash\\__WebPages\\CabinetOfCuriosities\\documentation\\DOCUMENTATION-GUIDE.md
> and the earliest part of this conversation, an AI Dependency Audit,
> with what needed hand work, what was then updated, and what is still
> open, etc**

Written as `AI-DEPENDENCY-AUDIT.md`, a single-file doc per
`DOCUMENTATION-GUIDE.md`'s own "one doc file stays flat, doesn't need a
folder" rule — it's a cross-cutting analysis of the repo, not a
standalone feature or a piece of backend/deploy work with its own
natural home. Per that same guide's "working in parallel" rule,
`README.md` and `FILE-MANIFEST.md` were deliberately not touched to
cross-reference it, since both had visibly-active concurrent edits
landing around the same time.

## This handoff

The very next message pointed out the inconsistency directly — a
dashboard with its own port, routes, and UI had been treated as a
one-off "just write the audit" case, when the guide's own placement rule
actually calls for something more specific:

> **Also based on the Documentation Guide, can you create/update/
> reorganise the documentation for the Admon page, since as a stnadalone
> feature, it deserves it's own**

This file and `ADMIN-CONTROLS.md` are the direct result — the same
`now/`, `cabinet-editor/`, `sitemap/` treatment every other standalone
tool in this repo already has, applied to the one that had been missing
it. As of this writing: `README.md`'s changelog entry and
`FILE-MANIFEST.md`'s table rows for `admin-controls.js` still point at
prose describing it inline rather than at this folder — wiring that
cross-reference in is a follow-up, not done here, for the same
concurrent-editing reason `AI-DEPENDENCY-AUDIT.md` wasn't cross-referenced
either.
