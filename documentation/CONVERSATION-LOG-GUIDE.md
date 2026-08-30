# Conversation-log companion docs — framework

Standard for the narrative/decision-level tier of documentation across
this repo, established 2026-08-30. Every subsystem's documentation
should have three tiers, each usable alone but pointing to the next:

1. **Concept-level** — what the thing is, one paragraph. Usually the
   relevant `README.md` section or the opening of the subsystem's own
   doc.
2. **Technical reference + changelog** — what changed, when, in enough
   detail to actually maintain the system. `NOW-PAGE.md`,
   `CABINET-EDITOR.md`, `Landing-page-notes.2.0.md`,
   `cloudflare-web-analytics-setup.md`, `FILE-MANIFEST.md`, etc.
3. **Conversation-level** — *why*, including the wrong turns: what was
   asked, in what words; what got tried and rejected; direct quotes;
   corrections and the reasoning behind them. This file's own kind.

The reference model for tier 3 is
[`conversation-landing-page-v3.md`](landing-v3-notes/conversation-landing-page-v3.md).
Read it before writing a new conversation-log doc — it's the bar, not
just an example.

## What belongs in a conversation-log doc

- What was actually asked, close to verbatim where the words matter
  (direct quotes, not paraphrase, whenever a quote captures something a
  summary would flatten).
- What got tried, and what got explicitly rejected — including the
  *reason* it was rejected, not just that it was.
- Corrections: a wrong turn caught and fixed is worth recording in
  detail, not smoothed into "then it was fixed." The value is in *how*
  it was caught and what the standing lesson is, if any.
- Process-level moments, if real ones happened: a working-agreement
  shift, a scope correction, a "you could have just asked me" — these
  are exactly the texture a changelog entry strips out.
- Nothing that's just restating the reference doc. If a paragraph would
  be identical whether it lived here or in the technical doc, it belongs
  in the technical doc.

## Formatting rule: bold the user's actual words

Every direct quote (a blockquoted `>` passage reproducing the user's own
words verbatim) gets bolded — `> **actual words**` — not just
blockquoted. Established 2026-08-30, applied retroactively across every
existing conversation-log file. The blockquote alone marks "this is a
quote"; the bold marks "these specific words are the user's, not mine"
at a glance while scanning — the two together read faster than either
alone once a file has dozens of quotes mixed with prose. Applies to
every quote, regardless of length or whether it spans multiple lines —
wrap the whole quoted passage in one `**...**` span, not each line
separately. Does not apply to inline text merely referencing what was
said without quoting it directly, and does not apply to prose in the
technical-reference docs (`NOW-PAGE.md`, `CABINET-EDITOR.md`, etc.) —
this is a conversation-log-only convention.

## What does NOT belong here

- Code, commands, diffs, file lists — those live in git history and the
  reference doc.
- Anything invented to fill a gap in the record. If the real
  conversation isn't available, say so plainly rather than reconstruct
  a plausible-sounding one. (See the honesty note in
  `conversation-cabinet-editor.md`/`conversation-now-page.md` for how
  this reads when the source material is thinner than a live
  transcript.)
- A second copy of the technical changelog with narrative flavour added
  — that's duplication, not a new tier.

## Naming and placement

Two cases, decided 2026-08-30 once enough real subsystems existed to
see the actual shape needed:

**A standalone feature or page** (its own tool, its own URL, something
a user could point at and say "that thing") gets its own folder under
`documentation/`, pairing a tier-2 reference doc with its
conversation-log companion — `now/NOW-PAGE.md` +
`now/conversation-now-page.md`, `cabinet-editor/CABINET-EDITOR.md` +
`cabinet-editor/conversation-cabinet-editor.md`,
`landing-v3-notes/Landing-page-notes.2.0.md` +
`landing-v3-notes/conversation-landing-page-v3.md`,
`sitemap/SITEMAP.md` + `sitemap/conversation-sitemap.md`. New map-decision
content (anything touching `landing-v3/`'s own code) appends to
`conversation-landing-page-v3.md` directly — that file is already the
established umbrella for the whole v3 map subsystem across many
sessions, not narrowly scoped to one micro-topic.

**Backend, deploy, and site-wide infrastructure work that doesn't map
onto one page or tool** — Cloudflare Web Analytics, the file/folder
reorg, launch-milestone tracking, multi-repo assembly, deployment
pipeline changes, and anything future work in the same shape — has one
shared home: `documentation/conversation-backend-and-deploy.md`. Direct
standing rule, stated by the user 2026-08-30: **if it doesn't have a
place to live, it lives in that one doc.** New topics get appended as a
new `# Part N` section there, not spun into their own file. This
mirrors how `conversation-landing-page-v3.md` already holds many
distinct topics under one subsystem-level roof — the same pattern,
applied to "the codebase/deploy as a whole" instead of "the map."

## Wiring in a new conversation-log doc

Once written, it needs pointers from both directions, matching the
existing landing-page pattern:

- A one-line cross-reference near the top of the subsystem's own
  reference doc ("see `conversation-<subsystem>.md` for the design
  reasoning and back-and-forth behind the decisions above").
- A row in `FILE-MANIFEST.md`'s `documentation/` table.

**Don't do this wiring yourself if you're one of several sessions
working on different conversation-log docs in parallel** — `README.md`
and `FILE-MANIFEST.md` are shared, repo-wide files, and simultaneous
edits from multiple sessions risk clobbering each other. Write and
commit your own new file only; a single follow-up pass folds in the
cross-references once all the parallel docs are in.

## Status (2026-08-30)

Standalone features/pages:

- `conversation-landing-page-v3.md` — done, written live, including the
  `#70` heading-outline addendum.
- `conversation-cabinet-editor.md` — done, rewritten from the real
  source thread (an earlier reconstructed draft was replaced, not kept
  alongside).
- `conversation-now-page.md` — done, rewritten from the real source
  thread (same replacement, not addition).
- `conversation-sitemap.md` — done, written live. `SITEMAP.md` (its
  tier-2 reference doc) followed shortly after, closing the gap this
  entry used to flag.

Backend/site-wide infrastructure (`conversation-backend-and-deploy.md`):

- Part 1, Cloudflare Web Analytics — done, written live.
- Part 2, the file/folder reorg — done, written live.
- Part 3, launch milestones/priority-setting — done, written live.
- Multi-repo assembly (Working with AI and friends) — not yet written;
  a live source thread exists but hasn't been run through this process.
  Append as a new Part when it is, don't create a separate file.
