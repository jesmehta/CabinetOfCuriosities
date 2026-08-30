# Conversation log: Cabinet TSV editor

Companion to [`CABINET-EDITOR.md`](CABINET-EDITOR.md) (architecture, routes,
schema, changelog, verification) in the same relationship
[`conversation-landing-page-v3.md`](../landing-v3-notes/conversation-landing-page-v3.md) has to
`landing-page-v3-notes.2.0.md`: that file is reference (what the system is and
how it works), this one is the reasoning behind it (what was asked, what got
tried and rejected, why a decision landed where it did).

**A note on how this file was built**: an earlier draft of this file was a
reconstruction assembled after the fact from `CABINET-EDITOR.md`'s changelog
and commit messages, written by a session that never had the actual dialogue
in context. This version replaces that reconstruction with the real one — the
live conversation that built the editor was still available (preserved,
verbatim quotes intact, across a mid-session context compaction), so what
follows is the actual sequence of asks, tries, and corrections rather than
one inferred backward from what shipped. Where a section below covers ground
the reconstructed draft already got right, it isn't repeated here a second
time with narrative flavour added — see `CABINET-EDITOR.md`'s own changelog
for the parts that are really just technical record.

## Starting point: a rough sketch, and three quick decisions

The opening message laid out the whole shape of the ask at once, closely
modeled on an existing precedent rather than invented fresh:

> **Have a look at the cabinet repos docuemtation about building TSV editor
> interfaces. Use the following as a guide as well: Editor server script →
> tools/cabinet-editor.js (or similar name) — a local-only Node HTTP admin
> server, same as now-editor.js, never shipped to docs/. Editor UI
> (HTML/CSS/JS) → tools/cabinet-editor-ui/ — mirrors tools/now-editor-ui/.
> Shared TSV parse/serialize logic → reuse or generalize tools/now-tsv.js if
> it can cleanly handle cabinet-sections.tsv/cabinet-entries.tsv too,
> otherwise a sibling tools/cabinet-tsv.js — same "one shared module so
> build script and editor can't diverge" reasoning as the Now pipeline. Root
> launcher → run-cabinet-editor.bat at repo root... Documentation (once
> built) → a new as-built doc in documentation/... Then add its row to
> FILE-MANIFEST.md. Have a look at how the Now page editor works.
> tools/cabinet-editor-ui/cabinet-data-editor.html is the current initial
> version of this. Tell me what all needs to be added? I am not fully
> wedded to the interface as shown in the html file, open to discussion and
> changes. Discuss and comment next steps.**

That last line mattered: the existing `cabinet-data-editor.html` was a rough
sketch, not a spec to defer to. Rather than guess at the open questions it
left (layout shape, default editability, whether to build the rebuild button
now), those went back as direct questions before any code. The answers came
back specific and, on one point, blunt about how much weight the sketch
should carry:

- Layout: **"Grid + collapsible advanced panel"** over a plain flat table or
  a fully custom layout.
- Default editability: **"Read-only / greyed out by default"** — fields
  become editable deliberately, not accidentally.
- Whether to build the Rebuild button in this pass, plus a scope note on the
  sketch itself: **"Yes, include the rebuild button now. The current HTML
  was meant to only be an indicator for the UI, you can ignore it completely
  for any backend stuff. Even the UI stuff is questionable, so don't have
  any legacy hangups."**

A follow-up question — what to do with the schema's already-known-unread v2
columns (`mapForm`/`islandId`/`cx`/`cy`/etc.) — got its own direct answer
rather than a default assumption: **"Keep all, in a collapsed 'reserved'
panel."** Not deleted, not silently hidden — visible, labeled, editable, just
out of the way of the fields that actually do something. That answer is what
`tools/cabinet-editor-ui/`'s reserved-panel pattern is built around.

## Scope: one editor now, three worlds eventually

Before any of the actual build started, a scope note reframed what "done"
should mean for this pass:

> **Scope note - ideally i'd like it if copies of the same editor or the same
> editor as a local tool could work straight off the bat for fffx and
> bookshelf, or at least, a copy of it could be added to those repos, and
> all 3 copies either update simultaneously as necessary, or diverge as
> necessary.**

Rather than design one shared cross-repo engine up front — three schemas,
none of them fully known yet, one of them (fffx) believed to have no build
pipeline at all — the direction was to build Cabinet's own copy first and let
the others follow once the pattern had actually been used:

> **Start off on the Cabinet version, we'l worry about the rest later, and
> base them off this one. IF they diverge, ok, if they can be made to
> cohere, also ok.**

That's the reasoning `CABINET-EDITOR.md`'s "Scope of this pass" section
states as settled fact — it wasn't a default, it was a specific call to defer
the harder three-repo design question until there was a real editor to learn
from.

## The schema trim, a wrong deletion, and WORLD-SYSTEMS.md

Once the live/reserved split from the first build was in place, the natural
next move was cleanup: every unread v2-era column got checked against the
actual renderer code and sorted into keep/reserve/delete. Mid-review, a
targeted grep for whether `anchor` was really unread turned out to have
assumed the live code spells the variable `entry` — it doesn't, the real
renderer uses `e` — and a variable-agnostic re-check found `anchor` genuinely
*is* read, for compass-rose label placement. Caught before anything shipped,
not after.

A follow-up instruction, sent mid-review rather than up front, changed what
"safe to delete" meant for the rest of the list:

> **also compare if any of the to be deleted attributes have analogues in
> fffx or bookshelf tsvs**

That distinction — "unused in Cabinet" versus "not part of what the whole
Cabinet/Bookshelf/fffx ecosystem shares" — is a materially different
question, and answering it properly meant actually reading the other two
repos' schemas rather than reasoning from Cabinet's code alone. That's what
turned up the real mistake: fffx was believed, going in, to have no
`content/`/build pipeline at all — wrong, it existed, just hadn't been pulled
locally yet. Told directly, once noticed:

> **fffx had stuff, but it was on origin, hadnt been pulled. Have a look
> again.**

Pulling and reading fffx's real `fffx-entries.tsv`/`build-fffx-content.js`
alongside Bookshelf's own schema surfaced the actual problem: `location` and
`relatedLinks` — already deleted from Cabinet's real TSV data by that point,
on the strength of "nothing in the current renderer reads this" — turned out
to be genuinely live in both other worlds' build scripts, and explicitly
documented in `WORLD-SYSTEMS.md` (the design doc hand-synced across all
three repos) as standard fields every Level-1 world's entries should carry.
"Nothing reads this right now" and "this isn't supposed to exist" are
different claims, and the first one had been treated as if it answered the
second.

Before anything got restored, one more consideration was raised — the design
doc calling something "Cabinet-exclusive" isn't automatically the last word
either:

> **even if world-systems.md calls something cabinet exclusive, cabinet
> itself may have evolved out of it, and the documentation may need
> updating. I'll run a separate pass over all 3 simultaneously later.**

That's a real qualifier on the lesson, not just a restatement of it: the
design doc outranks "grep the current renderer" as a source of truth for
"is this supposed to exist," but it isn't infallible either, and reconciling
it against what each repo has actually evolved into is its own separate,
deliberately deferred piece of work — not something to improvise mid-fix.
With that framing settled, the actual resolution came back as a direct
choice between full revert and full restore-as-trimmed:

> **Partial: restore only the documented shared fields**

`location`/`relatedLinks` went back in — recovered from the last git commit,
since nothing had been committed in between — while the rest of the v1.1
trim (`icon`/`placement`/`x`/`y`/`cardOrder`/`size`/`cardType`/`leaderTo`,
none of which have any analogue in Bookshelf's or fffx's schemas) stayed
deleted. `CABINET-EDITOR.md`'s v1.2 changelog entry has the full mechanical
detail of the restore; the standing rule that came out of it is worth
keeping here in the collaborator's own words, since it's the one real
process correction in this build: grepping the code that consumes a field
answers "is this used right now," not "is this supposed to exist" — for a
schema explicitly documented as shared across repos, the design doc is the
higher authority on the second question and should have been checked before
deleting real data against the first, not after.

## Git hygiene, stated once, applied throughout

A short instruction, given once, shaped how the rest of the session's work
landed in git: **"commit, or split commit, as needed."** Rather than one
large commit per session or an instinct to batch everything at the end, work
got committed close to where a real seam existed — the initial editor build,
the schema-trim refactor, the WORLD-SYSTEMS.md restoration, and later each
distinct round of UI feedback, as their own commits.

## Usability feedback from actually using the grid

Once the schema was settled, the remaining rounds of work came directly from
using the Entries tab at its full 15-column width, not from a pre-planned
feature list. The first round arrived as one dense list covering several
related problems at once:

> **entries tab : - need to sort by each column head, esp section, order,
> weight, status, but most of them would be useful - resizable columns -
> long text is unreadable - current resizeable heights of textboxes is
> individual text boxes - other text boxes in the same row still dont
> extend even when they need to - order and the updown arrows should be
> closer to each other since the arrows affect order - so order needs to be
> before or after id**

Read as a single request rather than six separate ones, since the items were
genuinely connected — a browsable grid needs sorting, resizing, readable
text, and controls placed next to what they actually affect, all at once, or
scanning 37 rows by file order alone stays painful regardless of which one
piece gets fixed. That became sortable/resizable columns, `order` rendered
immediately next to the ▲▼ buttons, and `ResizeObserver`-based row-height
sync (`CABINET-EDITOR.md`'s v1.3 entry has the mechanism).

Row-height sync solved "a taller textarea leaves its siblings mismatched,"
but only after something had already been dragged taller by hand. A direct
follow-up asked for a faster way to see everything at once:

> **an expand-collapse button to expand or compactify all the rows that need
> extra height for their text fields?**

Answered with one toggle per tab, applying the same underlying height logic
across every row at once instead of one drag at a time (v1.4).

The last round was a precise bug report, not a vague "something looks off,"
and it read that way from the first sentence:

> **weight and order columns - because they are right aligned not left since
> numbers - get hidden on column resize - the numbers should start from the
> visible right edge and if needed get hidden by the left edge, unlike the
> text fields**

That precision mattered: it named the exact expected behaviour (numbers
should clip from the *left* on narrowing, keeping the rightmost/least-
significant digits visible, mirroring how a right-aligned number should
overflow) rather than just "numbers look wrong when I resize." Root-causing
it turned up two compounding bugs, not one, plus a third, unrelated one
caught in the process of testing the first two — the full mechanism and the
testing-methodology lesson that came out of that investigation (a `.fill()`
on a real field is a real save, not a preview) are recorded in
`CABINET-EDITOR.md`'s v1.5 entry rather than repeated here.

## Documentation and commit check-in

The session closed with two direct status questions rather than trailing
off — **"is the documentation updated?"** and then **"is all this
commited?"** Both got answered by actually checking rather than assuming:
the changelog was re-read against what had shipped, and `git status`/
`git log origin/main..HEAD` were run to separate "committed" from "pushed" —
the working tree was clean, but several commits from this session's UI-
feedback rounds were still local-only, worth surfacing as a distinct fact
from "everything's committed" rather than letting the two questions blur
together.
