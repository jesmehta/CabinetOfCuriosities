# Conversation log: backend, deploy, and site-wide infrastructure

**Scope, and the standing rule behind this file** (2026-08-30): every
standalone feature/page gets its own folder in `documentation/` — a
technical reference plus a conversation-log companion
(`now/NOW-PAGE.md` + `now/conversation-now-page.md`,
`cabinet-editor/CABINET-EDITOR.md` +
`cabinet-editor/conversation-cabinet-editor.md`,
`landing-v3-notes/Landing-page-notes.2.0.md` +
`landing-v3-notes/conversation-landing-page-v3.md`; `sitemap/` has only
`conversation-sitemap.md` so far — see that file's own note on the
missing technical-reference half). Backend, deploy, and site-wide
infrastructure work doesn't map onto one page or tool the same way —
it touches the whole repo. Rather than spin up a new file per topic,
the rule is: **if it doesn't have its own place to live, it lives
here.** This file currently covers Cloudflare Web Analytics, the
file/folder reorganization, launch-milestone tracking, and the
documentation standard's own build-out (Part 4 — this file's own
conversation, the most directly-sourced entry here); future
backend/infrastructure work (multi-repo assembly generalization, the
deployment manifesto, etc.) gets appended here too, not split into
another new file.

**Provenance**: this file merges two conversation-logs that were each
written separately, from real live conversations (verbatim quotes,
not reconstructed) by different sessions — the merge is structural
(reheaded, reordered under one TOC) — the actual recorded content is
unchanged.

**Companion technical-reference docs**: `cloudflare-web-analytics-setup.md`
covers Cloudflare specifically. The reorg and launch-milestone work
doesn't have one consolidated technical doc yet — its record is spread
across `FILE-MANIFEST.md`, `three-world-launch-phases-ToDo.md`
(`#129`-`#134`, `#58`/`#59`), and `README.md`'s own changelog. Worth
consolidating into one tier-2 doc at some point; not done as part of
this merge.

## Table of contents

**Part 1 — Cloudflare Web Analytics rollout**
- [A file already open, and a request to ask first](#a-file-already-open-and-a-request-to-ask-first)
- [Reading the repo before proposing anything](#reading-the-repo-before-proposing-anything)
- [The plan, discussed before writing code](#the-plan-discussed-before-writing-code)
- [Building it: two injection points, and skipping a rebuild on purpose](#building-it-two-injection-points-and-skipping-a-rebuild-on-purpose)
- ["Gitignore the plaintext token file, it is just temp notes"](#gitignore-the-plaintext-token-file-it-is-just-temp-notes)
- [Writing the docs, and a concurrent-edit collision](#writing-the-docs-and-a-concurrent-edit-collision)
- [Commit, push, and a direct question that found a real gap](#commit-push-and-a-direct-question-that-found-a-real-gap)
- [Where Cloudflare's rollout leaves things](#where-cloudflares-rollout-leaves-things)

**Part 2 — The file/folder reorganization**
- [Scope and an honesty note](#scope-and-an-honesty-note-reorg)
- [The trigger: "a lot of legacy files ... scattered across the folders"](#the-trigger-a-lot-of-legacy-files--scattered-across-the-folders)
- [Settling scope before any code moved](#settling-scope-before-any-code-moved)
- [Deferred, not forgotten: now-page-helpers](#deferred-not-forgotten-now-page-helpers)
- ["no, do track it"](#no-do-track-it)
- [Five phases, one gate each, "continue" x4](#five-phases-one-gate-each-continue-x4)
- [Two small Phase-4 calls](#two-small-phase-4-calls)
- [The follow-up review that found a real oversight](#the-follow-up-review-that-found-a-real-oversight)
- [A hasty verdict, corrected on the spot](#a-hasty-verdict-corrected-on-the-spot)
- [The documentation-folder move itself](#the-documentation-folder-move-itself)
- [A third pass: reviewing the top-level folders](#a-third-pass-reviewing-the-top-level-folders)
- [Closing #26: a mechanism dies, an idea survives it](#closing-26-a-mechanism-dies-an-idea-survives-it)

**Part 3 — Launch milestones and priority-setting**
- [Setting immediate priorities](#setting-immediate-priorities)
- [#58 vs #59, and a milestone scheme that wasn't what I proposed](#58-vs-59-and-a-milestone-scheme-that-wasnt-what-i-proposed)
- [This handoff](#this-handoff)

**Part 4 — Building the documentation standard itself**
- [The four-part standard, stated as the opening ask](#the-four-part-standard-stated-as-the-opening-ask)
- ["am I maintaining two changelogs"](#am-i-maintaining-two-changelogs)
- [The pivot: real conversations already existed elsewhere](#the-pivot-real-conversations-already-existed-elsewhere)
- ["are all of these missing docu?"](#are-all-of-these-missing-docu)
- [Categorizing what came back: features vs. codebase-wide work](#categorizing-what-came-back-features-vs-codebase-wide-work)
- [Reorganizing the files, and three smaller asks bundled together](#reorganizing-the-files-and-three-smaller-asks-bundled-together)
- [Auditing the sitemap doc, and a real correction loop](#auditing-the-sitemap-doc-and-a-real-correction-loop)
- [Elevating the guide itself](#elevating-the-guide-itself)
- [This handoff, Part 4](#this-handoff-part-4)

---

# Part 1 — Cloudflare Web Analytics rollout

This is a narrative record of the conversation behind the Cloudflare Web
Analytics rollout, kept separate from
`cloudflare-web-analytics-setup.md` on purpose: that file documents
*what's in place and where*, written to stand alone as a technical
reference. This part preserves the *dialogue* — what was asked, what
got decided and why, and one real process hiccup along the way that a
changelog entry wouldn't carry.

No code, commands, or diffs here — those are in git history and in
`cloudflare-web-analytics-setup.md`'s own record.

## A file already open, and a request to ask first

The thread opened with `documentation/cloudflare-js-snippet.md` already
open in the editor — a one-line file holding the raw Cloudflare Web
Analytics beacon snippet, token included — and a request to look at it
and ask questions rather than act on it directly.

The file itself carried no context beyond the snippet, so three
questions went back before anything got proposed: what the actual goal
was (documenting vs. actually wiring it in), which pages/sites it
should cover and whether there was a shared template to hang it off of
rather than pasting it everywhere, and whether the token was safe to
commit as-is.

The answer came back as three direct points:

> **1 - need it wored in
> 2 - need to track the entire site, so as per the document itself, the
> viewer facing html files - landing pages, etc, but not the backend
> html like the now editor or other interfaces - as well as in the
> mkdocs somewhere that it gets rendered into the site build when it is
> run
> 3 - currently thats just for notes, not being commited - I understand
> its nto a risk but you are right, it's a bit off to make it public.
> I'll either add it to gitignore or delete it since the pages will all
> ahve the token anyway.**

Two things worth keeping from this exchange. First, the scope was
already drawn precisely, unprompted: "viewer facing" HTML explicitly
excluding "backend html like the now editor or other interfaces" — a
distinction that mattered later (see below). Second, the token-hygiene
point wasn't about real risk — the token is a public analytics
identifier, not a secret, and the user said as much — it was a
preference about not having a redundant plaintext copy sitting around
once the real thing shipped in every page anyway. That preference is
what led to the `.gitignore` entry three turns later, not any actual
exposure concern.

## Reading the repo before proposing anything

Before drafting a plan, the repo got read rather than guessed at:
`mkdocs.yml`'s nav and theme block, the `docs/` directory listing,
`FILE-MANIFEST.md`'s existing structure notes, `requirements.txt` for
the MkDocs Material version in play, `deploy.yml` for how the site
actually gets built and published, and `run-now-editor.bat` to confirm
what "the now editor" in point 2 above actually was — a local
zero-dependency Node admin server (`tools/now-editor.js`), never part
of the MkDocs build or the deployed `public/` output at all. That
confirmed the exclusion in point 2 was already true by construction,
not something that needed defending against.

The one open question this left was `docs/index.html` itself: not a
Markdown-sourced MkDocs page, but a static build promoted from
`landing-v3/index.html`, itself built from
`landing-v3/index.template.html` by `build-static.mjs`. `FILE-MANIFEST.md`
says plainly not to hand-edit `docs/index.html` — it gets overwritten
by the next promotion. That meant the real edit target for the landing
page was the template, not the promoted file, which shaped the plan
below.

## The plan, discussed before writing code

Rather than start editing, the two-part plan got laid out first: a
MkDocs Material theme override (`theme.custom_dir` + a `main.html`
extending `base.html`'s `extrahead` block) to cover every
MkDocs-generated page from one place, and a direct edit to
`landing-v3/index.template.html` for the standalone landing page, since
MkDocs's own templating never touches that file.

Two things were asked before writing anything: whether this pass should
also cover Bookshelf and fffx (separate repos, each with their own
`mkdocs.yml`), and which form of the snippet to use — the file's own
`type="module"` version, or the `defer`-classic form the (AI-drafted)
`cloudflare-web-analytics-setup.md` spec sketched instead.

> **scope - do this for this repo for now, and add todos for adding it to
> - fffx and bookshelf repos
> - other external repos connected into any of these 3**
>
> **snippet - use the cloudflare version, it is fresh and the latest,
> compared to AI generated document**

Both answers were quick, direct calls: scope stays local to Cabinet for
now, with the wider rollout explicitly deferred to tracked to-do items
rather than either skipped silently or done speculatively across repos
that weren't asked for. And on the snippet: a clear preference for the
artifact that actually came from Cloudflare's dashboard over the
setup doc's own paraphrase of it — the doc was AI-generated and, in the
user's judgment, staler than the real thing, even though the two forms
are functionally equivalent (module scripts are deferred by the HTML
spec regardless).

## Building it: two injection points, and skipping a rebuild on purpose

With the plan agreed, `mkdocs.yml` got `theme.custom_dir: overrides`,
`overrides/main.html` was written, and the beacon went into
`landing-v3/index.template.html` before `</body>`.

One deliberate deviation from the letter of "edit the template, not
`docs/index.html`": the already-promoted `docs/index.html` got the same
line added directly too, the same session, rather than waiting for a
full `build-static.mjs` + promote cycle to pick it up. Regenerating the
static build runs a headless-Chromium render for a one-line analytics
addition that has nothing to do with the map's actual content — a
cost/risk call, not an oversight, made explicit rather than silently
skipping the "don't hand-edit `docs/index.html`" rule. The template
still carries the source-of-truth copy, so the next real regeneration
won't lose it.

The to-do items for the deferred Bookshelf/fffx/external-repo rollout
(`#135`/`#136` in `three-world-launch-phases-ToDo.md`)
followed that file's own numbering convention rather than inventing a
new one — the existing sequence was scanned first to find the highest
number in use (`#134`) before appending.

Verification before moving on: a local `mkdocs build` to a scratch
directory, then grepping three built pages (`about`, `now`, `sitemap`)
for `cloudflareinsights` to confirm the override actually reached
generated output, not just that the config parsed without error.

## "Gitignore the plaintext token file, it is just temp notes"

A short, standalone instruction a few turns later: gitignore
`cloudflare-js-snippet.md`. Before adding the entry, the file's git
status got checked first — it was untracked, so a plain `.gitignore`
line was sufficient; no `git rm --cached` needed, since nothing had
ever committed it. The added entry carries a one-line comment
explaining why: the token already ships baked into the live pages, so
the note file adds nothing but duplication if it were ever committed.

## Writing the docs, and a concurrent-edit collision

The next ask was open-ended by design rather than a checklist:

> **update the repo docu about the cloudflare web anaytics updates -
> there is a core document, so consider well what else you need to add
> out there ?**

That "consider well" landed as a real instruction to think about
*what* needed updating, not just *that* something did. It resolved into
three files: `cloudflare-web-analytics-setup.md` itself (an
"Implementation record" section, following that doc's own stated policy
of recording where the beacon is injected, what's covered, and how to
verify), `FILE-MANIFEST.md` (new rows for the two `documentation/`
files plus a new `overrides/` section), and `README.md`'s changelog, in
that file's existing dated-entry format.

While editing `FILE-MANIFEST.md`, the harness itself flagged something
real: an edit landed with a warning that the file had been modified on
disk since it was last read, and that the edit "applied cleanly, but
the file contains other changes not in your context." A second read
confirmed it — a duplicate row for `cloudflare-web-analytics-setup.md`
had appeared, worded differently from the one just written, sitting a
few lines below it. `git diff` against the last commit made the shape
of it unambiguous: this wasn't a self-inflicted double-edit, it was a
genuinely separate write into the same region of the same shared file,
from outside this session. The two rows got merged into one, keeping
the better detail from each side, rather than just deleting either one
outright.

In hindsight this almost certainly wasn't a random collision:
`CONVERSATION-LOG-GUIDE.md` (read at the top of this very file, per
instruction) and its own two draft conversation-log docs
(`conversation-cabinet-editor.md`, `conversation-now-page.md`) were
being built out around the same time, by a session this one had no
visibility into — the three-tier documentation convention this file is
now itself following was taking shape concurrently and invisibly while
this rollout was happening. A direct follow-up question confirmed the
fix held:

> **is the double edit collision resolved ?**

Answered by re-grepping `FILE-MANIFEST.md` for every mention of
`cloudflare-web-analytics-setup.md`/`overrides`/`cloudflare-js-snippet`
(exactly one of each) and cross-checking `git diff --stat` line counts
against what had actually been typed — not just asserting it looked
fine.

## Commit, push, and a direct question that found a real gap

> **great, please commit and push**

Committed and pushed straight to `main`, matching the repo's standing
convention (no feature branch for this kind of change, no co-author
trailer).

The next message was short but did real work:

> **is index.html the only html page that needed it ?**

That's a scope-audit question, not a status check, and it surfaced a
genuine miss: `archived-landing-pages/` — the frozen v1/v2/v2-history/
v3-history/algorithm-bench snapshots — had been silently excluded. Not
by decision; it just never came up, because `FILE-MANIFEST.md`
describes that whole tree as "frozen historical snapshots, not
rewritten," and that framing was enough to keep it out of mind while
building the plan above. But `deploy.yml` genuinely copies it into
`public/archived-landing-pages/`, and the live Colophon page links
straight into it — by the "viewer facing html" standard set in the very
first exchange of this thread, it qualified. The "not rewritten"
convention and "viewer-facing coverage" were quietly in tension, and
nobody had actually chosen between them yet.

Rather than assume either way, the tradeoff got put back to the user
directly: skip the archive as documented-frozen, add the beacon to all
28 files, or just the top-level archive index page. The answer was to
add it to all 28.

Scripting this (rather than 28 individual hand-edits) turned up one
more small, real wrinkle: `archived-landing-pages/algorithm-bench/index.html`
has no closing `</body>`/`</html>` tags at all — a pre-existing quirk
of that file, not something introduced here — so the insert-before-
`</body>` approach that worked for the other 27 files needed a fallback
(append at end of file) for that one. Verified afterward by grepping
all 28 files for the beacon string and confirming zero were missing it,
not just trusting the script ran without an error. Docs and a second
commit/push followed the same pattern as the first round.

## Where Cloudflare's rollout leaves things

Cabinet's own rollout is complete: every MkDocs-generated page (via the
theme override), the standalone landing page (both its template source
and the live promoted file), and all 28 archived-landing-pages HTML
files carry the beacon. Bookshelf, fffx, and the external repos
assembled into Cabinet at deploy time (Working with AI, Prompt
Generator, Swatch Fields, Tracery Bots, and future additions) are still
open, tracked as `#135`/`#136` in
`three-world-launch-phases-ToDo.md`. The plaintext
`cloudflare-js-snippet.md` notes file stays on disk, gitignored, no
longer the canonical record of anything — that's
`cloudflare-web-analytics-setup.md` now, with this file alongside it
for the *why*.

---

# Part 2 — The file/folder reorganization

<a id="scope-and-an-honesty-note-reorg"></a>

## Scope and an honesty note

This covers the Cabinet file/folder reorganization
(`#129`-`#134` in `three-world-launch-phases-ToDo.md`),
2026-08-29 through 2026-08-30, recorded from a live transcript — direct
quotes are actually verbatim, not reconstructed. (The Content
Inventory/sitemap generation work from the same overall stretch, `#126`,
has its own doc — see `conversation-sitemap.md`.)

One thing this part does NOT cover, on purpose: the original wiring of
`generate_sitemap.py` into the compass rose's W point (`#73`,
`content/cabinet-entries.tsv`'s `compass-w` row, `v3.7.67`). That work
happened earlier in the same overall project, before this particular
conversation thread's own transcript begins -- what's available from
that point is a summary, not the actual back-and-forth, and per this
repo's `CONVERSATION-LOG-GUIDE.md`, a summary doesn't get dressed up as
a quote-level record here. If that earlier thread's real transcript
ever becomes available, it belongs prepended to this section, not
invented.

No code, commands, or diffs here -- those are in git history and in
`Landing-page-notes.2.0.md`'s changelog / `FILE-MANIFEST.md`. This is
inputs and reasoning only.

## The trigger: "a lot of legacy files ... scattered across the folders"

The reorg opened as a direct follow-up to a smaller, already-finished
task (wiring the sitemap into the compass rose), asked in one message:

> **which brings us to the next phase - can we streamline all the files
> and their locations? the v3 folder has a lot going on, there are a
> lot of legacy files form v1 whcih may or may not be relevant anymore,
> and they are scattered across the folders and subfolders. Give me a
> step by step plan to organize the files while ensuring nothing is
> broken. Dont execute.**

Two things about the phrasing mattered for everything that followed:
"give me a plan" and "Dont execute" (capitalized, unambiguous) meant
the whole first pass of this thread was audit-and-propose, not
audit-and-fix. That distinction held for the rest of the reorg -- every
phase that eventually ran had already been laid out, questioned, and
approved before any `git mv` happened.

## Settling scope before any code moved

The proposed plan got picked apart before approval, not accepted
wholesale. On Phase 3 (`landing-v3/`'s own internals):

> **Phase 3 - v3-internals - will these files be redistributed into the
> docs/js, docs/assets etc folders or reorganized inside v3?**

Answered plainly: reorganized inside `landing-v3/`, not redistributed
out of it -- the dev/production split (`landing-v3/` for tooling,
`docs/assets/` for the promoted, shipped copy) was staying, only the
internal grouping was changing. A follow-up sharpened this further, via
an `AskUserQuestion` answer that confirmed the actual shape wanted: dev
tools (`islands-tool.html`, its controls script) move to their own
folder; the build-time layout engine and the shared modules that also
get promoted to production each get their own folder too -- three
groups by real role, not by file type. This became Group A/B/C in
`#132` below.

A separate question, asked and answered but not acted on: "can the v3
folder name be chnaged or is that also a risky move?" Investigated
directly -- nothing executable hardcodes the literal string
`landing-v3`, only prose references across roughly nine docs -- so the
answer was "low-risk, not currently blocked," but it was never actually
requested, so it stayed exactly that: an answered question, not a
to-do.

Once the shape of all five phases was confirmed acceptable --
"ok, lets go with your original phases, no issues. If it doesnt feel
organized well enough, Ill figure that then" -- one more scope question
got asked before starting: should the reorg wait for a documentation
consolidation pass first, or proceed and clean up docs later? Answered
by proceeding: archives and legacy files could move immediately; the
live documentation's own consolidation was left for later (which is
exactly what happened the very next day, in the sections below).

## Deferred, not forgotten: now-page-helpers

One folder got carved out of scope explicitly, by direct instruction,
before Phase 0 started:

> **no page helpers - it's purpose is done but it's part of the
> documentation - keep as is for now, and we'll have a look during the
> docu consolidation round if we want to keep/edit/split/append to it.**

This distinction -- *location* can move, *content* review is a
separate, later decision -- held all the way through. When the
documentation-folder move (`#134`, below) happened the next day,
`now-page-helpers/` moved along with everything else (its location
changed), but its three files were not edited, trimmed, or merged --
exactly as scoped here. The ToDo file's own closing note for `#134` was
written to say this precisely, so the distinction wouldn't get lost the
next time someone reads it cold.

## "no, do track it"

The plan itself was going to be executed and then simply forgotten as
chat history, until a direct correction:

> **no, do track it and add relevant descriptions, mappings to before and
> after, etc**

This is the reason `#129`-`#134` exist as real, numbered, resolvable
items in `three-world-launch-phases-ToDo.md` at all, each with a full
before/after mapping and an eventual "Done, 2026-08-29" resolution note
-- rather than the reorg just happening silently in a handful of
commits with no durable record. Every phase from this point on got
written up in the ToDo file to the same standard as the file's own
existing items, not a lighter-weight summary.

## Five phases, one gate each, "continue" x4

Once tracked and committed, execution ran phase by phase, each one
ending on the same verification gate (both TSV-to-JS builds, `mkdocs
build --strict`, a `build-static.mjs` rebuild diff check, a real
headless-browser zero-console-error pass) before the next phase
started. The instruction to proceed was the same single word four times
in a row -- "continue" -- after Phase 0, Phase 1, Phase 2, and Phase 3
each landed green. No re-litigating the plan at each step; the earlier
approval was treated as standing until something actually broke.

Two real, load-bearing bugs came out of Phase 3 (`#132`, regrouping
`landing-v3/`'s internals) specifically because the actual `import`/
`<script src>` graph was traced before any file moved, not just
grepped for doc mentions:

- `build-static.mjs` navigated Playwright to a hardcoded literal URL
  string pointing at the old location of `build-render.html`. Moving
  the file without fixing that string would have silently broken every
  future static rebuild -- a 404 inside a headless browser, not a
  build-time error anyone would notice quickly.
- `compass_rose.svg` turned out not to be loaded at runtime at all --
  its shapes are hand-inlined as literal path data inside
  `cabinet-v3-layout.js`. Moved as a design-source companion file, with
  no code reference needing an update, once that was actually confirmed
  rather than assumed.

## Two small Phase-4 calls

Phase 4 (`#133`) surfaced two loose, untracked files that needed a
human decision rather than a default action. Both were asked about
directly and answered in the same short message: "now.tsv.bak ok to
delete" and "gcodebending - leave alone." `now.tsv.bak` was confirmed
unread by `build-now-content.js` before deleting it. `docs/3dp/
GCodeBending.md` was left exactly as it was -- and, reported separately
a little later ("gcodebending has been taken care of"), turned out to
have been moved entirely out of the Cabinet repo by the user directly,
to a sibling folder outside version control here.

## The follow-up review that found a real oversight

With all five phases done and pushed, the user asked for an assessment
of the documentation itself, plus "maybe a separate docu listing each
file and it's role" -- the request that produced `FILE-MANIFEST.md`.
That in turn led to a genuinely detailed root-level file-by-file
critique, one file at a time, including a question that caught a real
inconsistency the reorg itself had introduced:

> **where is the compass svg and why isnt this there as well?**

`dragon.svg` had been left alone at the repo root while its exact
functional twin, `compass_rose.svg`, had already moved into
`landing-v3/layout-engine/` during Phase 3 -- purely because `dragon.svg`
never made it onto that phase's file list. Acknowledged directly as "an
oversight on my part, not a deliberate choice," and folded into the
next move (`#134`) rather than left as a known inconsistency.

## A hasty verdict, corrected on the spot

The same file-by-file review asked a direct content question that
exposed a real shortcut taken earlier in the conversation:

> **What is the content, intent and overlap between landing page notes
> 2.0 and conversation landing page v3?**

`Landing-page-notes.2.0.md` and `conversation-landing-page-v3.md` had
earlier been described, in passing, as having "some overlap... flagged
for a future documentation-consolidation pass" -- a conclusion drawn
from skimming tables of contents, not from reading either file's actual
content. Pushed on directly, the honest answer was: "I need to correct
myself here... That was too hasty." Reading both files in full showed
they are not redundant -- one is a technical reference/changelog (what
shipped), the other a narrative process log (how it happened and why),
and the narrative file's own "documentation survey" section already
states this exact non-duplication policy in its own words. The
correction was propagated into both `README.md`'s prose and
`FILE-MANIFEST.md`'s entry for the pair, not left standing only in
chat.

## The documentation-folder move itself

The same review widened out to a direct, structural question: should
every root-level `.md` file be gathered into one folder instead of
living loose at root, and should `landing-v3/`'s own four documentation
files (multi-repo assembly note, two "three world" notes/todo files,
scheme candidates) join them? Two hard constraints were identified and
stated up front, before any move: `README.md` can't move (root is where
GitHub expects it to render) and `WORLD-SYSTEMS.md` can't move alone
(it's byte-identical across Cabinet/Bookshelf/fffx, with its path
assumed the same in all three). The user picked a name for the new
folder in the same message -- "call it Documentation, Notes, Readmes -
I am ok with those" -- and confirmed going ahead with the `landing-v3/`
docs included, kept together in their own `landing-v3-notes/`
subfolder rather than flattened in with everything else, plus one more
explicit ask: "does the file manifest need updates based on both, the
relocation as well as your newer deeper understanding of the files?" --
both, and both got done: the move (`#134`) and a substantial rewrite of
`FILE-MANIFEST.md` to match the new paths and the corrected
Landing-page-notes/conversation-log understanding from the section
above.

## A third pass: reviewing the top-level folders

A session or two later, prompted by noticing the `/now` page had been
overhauled externally (by a separate, parallel session -- this repo is
worked on from more than one machine), the user did a third structural
pass: their own stated understanding of seven top-level folders
(`archived-landing-pages`, `content`, `docs`, `documentation`,
`landing-v3`, `review`, `tools`), asking for confirmation or correction
on each, plus two open questions. Most were confirmed correct outright.
Two were worth a real answer rather than a flat "yes":

- **`archived-landing-pages`**: confirmed as the colophon's linked old
  versions, but the actual question -- does it belong there or inside
  `docs/` -- had a real answer, found by reading `deploy.yml` in full
  rather than guessing: it's deliberately kept outside `docs/` so
  MkDocs never tries to build its frozen legacy HTML as live pages, but
  it's explicitly stitched back into the deployed output by its own
  `cp -r archived-landing-pages public/archived-landing-pages` step,
  commented "makes colophon.md's v1/v2 links resolve instead of
  404ing." A deliberate, working design, not something to move.
- **`review/`**: not a queue that needed draining. Its own `.gitignore`
  comment already framed it as ephemeral, freely-overwritten scratch
  space, distinct from `landing-v3/dev-screenshots/`'s curated,
  permanent record -- but that same comment turned out to reference a
  folder, `dev-archive/`, that had never actually existed in this repo.
  Found and fixed while answering the question, not left as a stale
  pointer once noticed.

## Closing #26: a mechanism dies, an idea survives it

A older open item, `#26`, described a discrepancy between
`DESIGN-SYSTEM.md`'s documented `callout-card`/leader-line layout and
what the renderer actually did. By this point in the reorg, both halves
of that discrepancy no longer existed to disagree with each other --
the renderer it described (`cabinet-render.js`/`cabinet-landing.css`)
had been deleted as confirmed-dead v1/v2 code, and `DESIGN-SYSTEM.md`
itself had been archived with a superseded banner. Raised for closure
with a clarification that mattered enough to preserve precisely:

> **we have just deleted leaderTo etc fields from the TSV as well, cehck
> docu. Also, as I stated elsewhere, the docu is also not the final
> source of truth, the page has evolved greatly since then. This is a
> holdover from v2. I may yet want a system where the islands have a
> further set of entries on the island coast etc, as planned very early
> on, but that is currently not even on the drawing board. The callout
> card layout and leaderTo lines are defunct. The concept of having a
> finer level of entries on the existing map is not. Update the
> documentations accoridngly.**

Two separate actions followed from that one message: `#26` closed as
moot (the specific v2-era mechanism), and a new item, `#137`, opened
separately for the still-live idea (a finer tier of coastal entries) --
deliberately split apart so the live idea wouldn't stay tangled up with
the mechanism that's actually gone. Checking "the docu" as asked also
turned up a second, unrelated staleness: `WORLD-SYSTEMS.md` (the
document hand-synced across all three repos) still described Cabinet's
`visual` field bundle as the full pre-deletion set. Fixed there too,
with a note that the fix still needs backporting to the Bookshelf and
fffx copies, since this repo has no way to reach those other repos
directly.

The same pass also resolved a smaller open question, `#73`, with a
one-line clarification that had actually drifted into two
self-contradicting TSV notes: "CV and Contact Me go into About me -
make note." `compass-n`'s own note already said this correctly;
`compass-e`'s note had separately, incorrectly, also claimed Contact
lived on the Now page. Fixed to agree.

---

# Part 3 — Launch milestones and priority-setting

This part covers project-status decisions from the same working
stretch as the reorg above — not reorg-specific, not sitemap-specific,
site-wide.

## Setting immediate priorities

Once the documentation pass was largely settled, the user set an
explicit priority order across the open backlog in one message,
grouping several previously-separate items on the fly: `#32` first,
named directly as a blocker --

> **its a bottleneck to the smooth updates to the look and feel for the
> site, and currently not a stable state**

-- then `#58`+`#80`+`#82` grouped together as "the deployment
manifesto," `#81` (TSV editors) noted as already ongoing for Cabinet
with Bookshelf/fffx expected to be easier once that's settled, `#70`
prioritized "for better semantic organisation," and `#126` flagged as
"also an easy task." `#66`/`#42` (About Me) and `#37`/`#39` (label
overflow, QA) were placed on the backburner on purpose, not dropped.
This became a tracked "Immediate priorities" section in the ToDo file
rather than living only in chat, the same "no, do track it" instinct
from the reorg itself applied to a new kind of list.

## #58 vs #59, and a milestone scheme that wasn't what I proposed

A later, smaller question reopened two items that had been sitting
unchecked without much explanation: "Arent 58 and 59 done or is 58 a
post deployment manifesto check?" Investigated rather than assumed
either way: `#58` (confirm failed builds don't replace the last
successful live deployment) turned out to be structurally sound by
`deploy.yml`'s own job-dependency graph (`deploy: needs: build`, so a
failed build blocks the deploy job from running at all) but not
something that had ever actually been empirically confirmed -- no `gh`
CLI in this environment to pull real run history, and deliberately
breaking a production build just to test an already-sound structure
wasn't worth doing. `#59` (merge/tag/deploy the launch version) turned
out to have no tag at all behind it -- the merge and deploy had
genuinely happened back in `#48`, but nothing was ever tagged as "this
is the launch version" the way the pre-launch state had been archived.

That led into a direct framing question, answered with real nuance
rather than a flat yes:

> **we are already launched in some ways - the v3 site is live, so the
> merge to main would count as launch. on the other hand, we did
> sitemaps and archive (but not the rest of the colophon) and now pages
> after that, and the about page is left and a few other essential
> backend and front end stuff is left. Can we do a launch alpha/beta for
> the merge to main, and the moment phase 0-1-2 are complete or largely
> complete, mark a launch complete/beta/gamma type marker?**

Three candidate naming schemes were offered back (`alpha`->`complete`,
`alpha`->`beta`->`complete`, and a four-stage `alpha`->`beta`->`gamma`->
`complete`), and none of them were what actually got adopted. The reply
picked its own two-stage scheme instead:

> **call the merge to main point beta, and when we're done with Phase 2,
> and I start publicly distributing the links, we call it launched?**

`launch-beta` was created as an annotated tag pointing at the actual
2026-08-23 merge commit (not the day the tag itself was created), and
`launched` was recorded as a future marker gated on two conditions at
once -- Phase 0-2 being done or largely done, AND the user actually
starting to share the site's links publicly -- explicitly noted as a
real-world event, not a checklist percentage, so it shouldn't get
auto-applied off item counts alone.

## This handoff

As of this writing: the file/folder reorg (`#129`-`#134`) and the
documentation-folder move are both fully done and pushed. `launch-beta`
is tagged; `launched` is not, and shouldn't be applied without checking
back in first. `#58` is open and honestly described as
structurally-sound-but-unconfirmed, blocked on GitHub Actions
run-history access this environment doesn't have. Of the "immediate
priorities" set in this same stretch, `#32` (the copy-config rework,
named directly as the current bottleneck) is the one item that hasn't
been touched yet and is the most direct next thing to pick up -- it
still needs a real decision between its two proposed directions before
any code gets written, not a default guess. (The Content Inventory
thread from this same overall stretch, `#126`, has its own handoff note
in `conversation-sitemap.md`.)

---

# Part 4 — Building the documentation standard itself

Different provenance from the three parts above: this one is the
assisting session's own conversation, not a separately-sourced thread
folded in afterward. Every quote below is genuinely verbatim from that
exact conversation — the strongest-sourced entry in this file, not a
transcript reconstructed or summarized secondhand.

## The four-part standard, stated as the opening ask

The thread opened with a full audit request, git history compared
against every documentation file, closing with the actual standard to
measure against:

> **initial concept or initial need that triggered the work - a bug, a
> feature need, a concept or an exploration trial ... for this initial
> bit, the decisions and the intent behind those decisions as it was
> executed, iterated, and debugged needs to be captured ... a changelog
> - brief technical notes of the iterations and updates ... todo list -
> pending issues listed for later work ... watch-out-for - not issues
> per se, but workarounds, essential steps, commonly overlooked thing**

The resulting audit found the landing page's own documentation
(`Landing-page-notes.2.0.md` + `conversation-landing-page-v3.md`)
already met that bar in full, while `/now` and the Cabinet TSV editor
had solid technical/changelog docs but no narrative tier, and
`README.md`'s own changelog had gone stale relative to what the
subsystem docs already recorded.

## "am I maintaining two changelogs"

A direct factual check before accepting the audit's framing: were
`README.md` and `Landing-page-notes.2.0.md` genuinely two changelogs for
the same thing? Answered by pointing at `README.md`'s own v3.0 entry,
which already states the relationship explicitly — a coarse, repo-wide
index with one entry per major milestone, pointing at each subsystem's
own fine-grained changelog, not a duplicate. The real problem wasn't
the two-tier structure; it was that the index tier had stopped getting
new entries.

## The pivot: real conversations already existed elsewhere

Mid-reconstruction of the `/now` and TSV-editor conversation logs from
their changelogs alone (the only source available at the time), a
screenshot of several other open Claude Code windows changed the whole
approach:

> **i have a lot of those conversations in other windows - see image.
> You cna do a framework, initial document, etc and give me a prompt to
> give to those threads.**

Reconstructing from a changelog's own prose can only ever produce a
paraphrase of what's already recorded there — it can't add anything a
live transcript actually holds (real quotes, real dead ends, real
corrections in the moment). The two changelog-derived drafts already
written stayed as a fallback baseline; the real fix was a framework doc
(`CONVERSATION-LOG-GUIDE.md`, later broadened — see below) plus
per-thread prompts pointing each live conversation at its own file.

## "are all of these missing docu?"

The first pass at those prompts matched every visible thread title to a
target file on sight, without checking whether each one actually
represented undocumented work. Corrected immediately:

> **are all of these missing docu ? Are all of these even features ? I
> gave you the full list of what conversations I have, not necessarily
> that all need documentation**

Re-auditing against evidence actually gathered earlier in the session
(not the thread titles) found only two confirmed hard gaps (`/now`, the
Cabinet TSV editor); three topics (`#70` heading outline, the reorg,
multi-repo assembly) already had real reasoning embedded in their
technical docs, a materially lower-severity situation than "no
documentation at all"; and two threads (Cloudflare, fffx-sync) were
genuinely unknown without more information rather than guessable from a
title. Getting caught overreaching here is the direct precedent for the
"act as an auditor" instruction stated explicitly later in this same
session (see below) — the corrective had already happened once before
it was named as a standing requirement.

## Categorizing what came back: features vs. codebase-wide work

Once several prompts had actually run, the real conversation logs that
came back needed sorting, not just filing:

> **Now and TSV editor are standalone features or indivisual pages.
> Sitemap can also be considered as one. The Map labels, file
> reorganisation, cloudflare etc are all work on the primary
> codebase/main website. Give me a plan to merge or keep these docus
> based on this.**

The follow-up question (merge Cloudflare and the reorg into one file,
or keep them separate and cross-linked) got a direct answer that became
this file's own standing rule:

> **All post-merge-to-main backend updates to be detailed in one set of
> documentation, just like the v3 lander docus the main page, or the
> now, tsv editor, sitemap pages have their own docus. If it doesnt have
> a place to live, it lives in this docu set.**

That's the literal origin of this file's own scope note above — Parts
1-3 (Cloudflare, the reorg, launch milestones) merged into one file
under that instruction, and Part 4 (this one) lives here for the same
reason: the documentation-system work itself doesn't have a single page
or tool to call home either.

## Reorganizing the files, and three smaller asks bundled together

Once the placement question was settled, three concrete requests
arrived in one message:

> **give me the prompt for the sitemap conversation to add the
> technical docus - formatting the conversation - bold format my actual
> words - can you organise the documentation files into folders if they
> are related to specific features - eg the conversation, readme and
> changelog for X, if they are different files, should be in a folder.
> If they are one file, then I guess it's ok**

The folder rule ("different files for the same feature → a folder;
one file → stays flat") is what produced `now/`, `cabinet-editor/`, and
folded the two landing-page docs into the existing `landing-v3-notes/`
— a real repo-wide reorganization (`git mv` for tracked files, careful
grep-and-fix of every cross-reference afterward, not just the moved
files themselves) rather than a documentation-only exercise. The
bold-quote rule arrived as a fourth, separate instruction mid-turn,
added to the guide directly:

> **put the bold quote formatting intot he log guide rules as well**

Applied retroactively via a script rather than by hand, since Markdown
bold can't legally cross a blank-line paragraph break inside a
blockquote — treating each quoted paragraph as its own bold span, not
each line.

## Auditing the sitemap doc, and a real correction loop

The sitemap thread's response to the technical-doc prompt
(`SITEMAP.md`) got checked against the actual `tools/generate_sitemap.py`
source rather than accepted on its own account — the concrete
application of "act as an auditor, not a praiseful intern," stated
explicitly earlier in this same session as a standing instruction for
validating documentation. Two claims about `parse_mkdocs_nav()` didn't
hold up: `NAV_GROUP_RE` was described as actively matching group
headers when it's dead code (only `NAV_LEAF_RE` is ever called), and
the scanner was described as failing "visibly, not silently" when the
opposite is true for the failure mode that actually matters (a single
malformed leaf line silently vanishes from the leaf list; only a full
structural dedent is visible). Flagged back rather than fixed directly
— the thread that built it was better positioned to re-verify against
a live test than a read of the source alone. Both were confirmed and
corrected, then split into two separate commits on request, one finding
per commit, done by resetting the single combined commit and
reconstructing each fix's diff in isolation rather than trying to
`git add -p` a already-entangled combined change.

## Elevating the guide itself

The framework doc had only ever stated the conversation-log (tier 3)
rules — the four-part standard this entire session was built around had
never actually been written into the repo, only tracked in the
assisting session's own memory:

> **Update the Conversation Log Guide to be the Documentation guide,
> outlining the entire Documentation principles set instead of just the
> Conversation. It need not be long, let it be concise, but should
> capture the documentation requirements at all levels.**

Rewritten and renamed to `DOCUMENTATION-GUIDE.md`: the four-part
requirement stated first, then the three tiers that satisfy it, the
existing placement/formatting/parallel-session rules folded in
unchanged, and one new principle drawn directly from the `SITEMAP.md`
episode above — verify a doc's claims against the real code before
writing them down, don't reason from an earlier description of it,
including this repo's own docs.

## This handoff, Part 4

> **i'll point to it for all future development so teh standard is
> maintained.**

`DOCUMENTATION-GUIDE.md` is the standing reference going forward.
Confirmed gaps closed this session: `/now`, the Cabinet TSV editor, and
the sitemap/Content Inventory each now have a real conversation-log
alongside their technical reference. Still open: multi-repo assembly
(a live thread exists, prompt written, not yet run) and fffx-sync
(scope still unconfirmed — it may not even be about this repo). The
reorg and launch-milestone technical record (Part 2/3 above) still
doesn't have one consolidated tier-2 doc, same gap noted when this file
was first assembled, not resolved as a side effect of anything in this
Part either.
