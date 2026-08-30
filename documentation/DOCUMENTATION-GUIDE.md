# Documentation Guide

Every piece of dev work in this repo — a feature, a page, a backend/
deploy change — needs four things on record, at increasing depth. This
file states the principle and the structure that satisfies it;
`FILE-MANIFEST.md` is the live index of what actually exists.

## The four things every piece of work needs

1. **Initial concept/need** — the bug, feature request, or exploration
   that triggered the work.
2. **Decisions and intent** — why it was built the way it was, as it
   was executed, iterated, and debugged. What was tried and rejected,
   not just what shipped.
3. **Changelog** — brief technical notes per iteration/update.
4. **Todo / watch-out-for** — pending issues, plus workarounds,
   essential steps, and commonly-overlooked gotchas.

Missing one of these for real, non-trivial work is the actual failure
mode to watch for — not "missing a whole file."

## Three tiers, not four files

The four things above map onto three tiers, each usable standalone but
pointing to the next:

1. **Concept** — what the thing is, one paragraph. The relevant
   `README.md` section, or the opening of the subsystem's own doc.
2. **Technical reference + changelog + todo/watch-out-for** — what
   changed, when, in enough detail to maintain the system, with
   pending items and gotchas folded into the same doc's own prose
   (a "Non-goals" section, a "watch out" callout) rather than split
   into a separate file per concern. `NOW-PAGE.md`, `CABINET-EDITOR.md`,
   `SITEMAP.md`, `Landing-page-notes.2.0.md`,
   `backend-and-deploy/cloudflare-web-analytics-setup.md`,
   `backend-and-deploy/BACKEND-AND-DEPLOY.md`. Repo-wide todo tracking
   lives in one place,
   `backend-and-deploy/three-world-launch-phases-ToDo.md`, not
   duplicated per subsystem. A topic doesn't need its own tier-2 doc if
   it's small enough to absorb into a broader one covering the same
   folder (the reorg and launch-milestone items live inside
   `BACKEND-AND-DEPLOY.md` rather than getting one file each) — reserve
   a dedicated doc for topics substantial enough to stand alone.
3. **Conversation-log** — *why*: what was asked, tried, rejected,
   corrected, in the actual words. Reference model:
   [`conversation-landing-page-v3.md`](landing-v3-notes/conversation-landing-page-v3.md)
   — read it before writing a new one, it's the bar.

## Placement

**A standalone feature or page** (own tool, own URL) gets its own
folder under `documentation/`, pairing tiers 2 and 3 — `now/`,
`cabinet-editor/`, `landing-v3-notes/`, `sitemap/`,
`backend-and-deploy/`, `admin-controls/` (the `tools/admin-controls.js`
dashboard — named separately from `backend-and-deploy/` on purpose, so
"the admin dashboard tool" and "backend/deploy work in general" don't
read as the same thing). New map-decision content appends to
`conversation-landing-page-v3.md` directly rather than spawning a new
file — that doc is already the established umbrella for the whole v3
map subsystem.

**Backend, deploy, and site-wide work with no single page or tool**
(Cloudflare, the file/folder reorg, launch milestones, multi-repo
assembly, deployment pipeline changes) lives in `backend-and-deploy/`.
For the conversation-log tier, one shared file:
`conversation-backend-and-deploy.md`. Standing rule: **if it doesn't
have a place to live, it lives in that one doc**, appended as a new
`# Part N`, never split into a new file. For the technical-reference
tier, a topic gets its own file only if it's substantial enough to
stand alone (`cloudflare-web-analytics-setup.md`,
`cabinet-multi-repo-assembly-concept-note-short.md`); smaller topics
absorb into `BACKEND-AND-DEPLOY.md` instead of spawning a one-topic
file. Same folder-scoping principle as every other feature, just with
more than one technical doc inside it because the scope is broader.

## Writing a conversation-log doc

Belongs: real quotes where the words matter; what got tried and
rejected, and why; corrections, in enough detail to carry the lesson,
not smoothed into "then it was fixed"; real process-level moments (a
working-agreement shift, a scope correction).

Doesn't belong: code/commands/diffs (git history's job); anything
invented to fill a gap — if the real conversation isn't available, say
so plainly rather than reconstruct a plausible one; a second copy of
the technical changelog with narrative flavour added.

Direct quotes get bolded inside the blockquote — `> **words**` — one
span per paragraph (Markdown bold can't cross a blank-line break inside
a blockquote), never per line.

## Verify before you write it down

A doc's claim about how code works is only as good as the last time
someone actually checked it against the code. Before describing a
mechanism, read the source — don't reason from an earlier description
of it, including this repo's own docs. (`SITEMAP.md`'s `v1.2`/`v1.3`
changelog entries are the concrete example: two claims about
`parse_mkdocs_nav()` that read plausibly and were both wrong.)

## Keep tier 1 honest

`README.md`'s own top-level changelog is an index into the tier-2 docs,
not a duplicate of them — but an index that stops getting new entries
is worse than no index, since it actively misdirects. When a subsystem
gets its tier-2/tier-3 docs, add the one-line pointer to `README.md`
and the row to `FILE-MANIFEST.md` too, not just the detail docs
themselves.

## Working in parallel

This repo is routinely worked from several sessions/machines at once.
Write and commit your own new file only — don't edit shared index
files (`README.md`, `FILE-MANIFEST.md`) while other documentation work
might be landing concurrently. A single follow-up pass wires in
cross-references once parallel work is in.
