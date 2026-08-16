# Conversation log: landing-v3 visual-polish phase

This is a narrative record of the design conversation behind the
v3.6.4 -> v3.6.6 visual-polish work, kept separate from
`Landing-page-notes.2.0.md` on purpose: that file documents *what the
code does and why*, written to stand alone as a technical reference.
This file preserves the *dialogue* -- what was asked, in what words,
what got tried and rejected, what preferences got stated along the
way, and the reasoning behind decisions that a changelog entry alone
wouldn't carry. Written because this development is continuing from a
different machine, without this conversation available -- if you're
reading this cold, treat it as "here's the context a collaborator
would have had if they'd been in the room."

No code, commands, or diffs here -- those are all in the actual git
history and in `Landing-page-notes.2.0.md`'s changelog. This is inputs
and reasoning only.

## The original punch list

The visual-polish phase opened with a single message laying out the
whole scope at once:

> things to do: better colours for land and sea; offset waves like
> previous version; mini-features (seaserpent, boats sailing in smooth
> flows not randomly moving, wave-like pattern on the waters); stretch
> goal: a flowfield effect that pushes currents across the map, and the
> wave patterns and ships flow along that as particles... Discuss this
> with me further.

Followed immediately by per-item direction on all of it at once:

- **Offset waves**: "lets start with what we already have, will fine
  tune later" -- i.e. don't over-invest up front, iterate later.
- **Sea serpent**: an explicit rejection of a sine-wave body -- "i dont
  like this one" -- replaced with a precise alternative spec: a series
  of arcs spanning *more* than 180 degrees above the water (not a
  gentle wave, a real loop/coil character), varying how far above
  water and how thick each hump is (thin at the tail, thick at
  mid-body, half that thickness at the head), with a distinct head
  shape (a half-arc plus other forms), not just another hump.
- **Boats**: "v2 is a good look to start but will modify further" --
  permission to port the existing look as a starting point rather than
  redesigning from scratch.
- **Wavelines**: "not really seeing any wavelines in v2, i'll upload a
  reference though" -- the reference never arrived in this session;
  this item is still genuinely blocked on it, not just deprioritized.
- **Colour**: wants to change the scheme, but explicitly asked to hold
  until other features are in place first -- a sequencing preference,
  not a rejection. (This held for most of the session; colour work
  only happened later when directly requested for a specific new
  feature, not as a general repaint.)
- **Flowfield**: leaning toward the simpler/cheaper of two discussed
  approaches (precomputed field, not a fully live simulation) --
  reasoning given was explicitly about *family consistency* across the
  "Cabinet worlds": fffx is built on subdivision, Bookshelf uses
  particles, so Cabinet having a noise/flow field fits the pattern.
  Precomputation is fine even with live particles riding it -- what's
  lost is interactivity (mouse leaving a wake/ripple), which sounded
  appealing but the compute cost was flagged as unknown and left
  unresolved.

## The boats attempt: a real bug, and a real process failure

Boats got built next, hit a genuine, reproducible Chromium bug: an SVG
`<use>` referencing a `<symbol>` containing a closed bezier hull path
would silently fail to paint -- but only when the element was created
during the page's initial synchronous render, not when identical
markup was injected into an already-loaded page afterward. Every
inspection method (bounding boxes, computed styles, direct DOM dumps)
confirmed the geometry and CSS were "correct"; nothing painted anyway.
Two targeted fixes (an explicit numeric transform-origin, deferring
insertion by one animation frame) both failed to resolve it.

What actually matters for this log isn't the bug -- it's what happened
around it. Multiple rounds of debugging produced no forward progress,
and the user noticed well before the work itself resolved anything:
"you're really stuck going around in circles," then later "hey, are
you stuck again?", then a direct, generous offer to help -- "what is
making you so slow, or needing so many reruns? can i help in any way?
is there any step that would benefit by simplifying or having me look
or reason on things? Are there any repetitive tasks that could be
streamlined?" -- and finally, after it kept going, a much harder line:
"this has gone on for far too long... The boat thing, if it's not
working, just revert it. You are absolutely wasting time at this
point."

The revert was clean -- nothing boats-related had ever been committed,
so `git checkout` plus deleting the new file left no residue.

The more interesting exchange came after: asked directly *why* I got
stuck (not why the boat didn't render, but why I couldn't pull myself
out of the loop), the honest answer was: no attempt ceiling had been
set before starting open-ended debugging, so there was no predetermined
point to stop and reassess; a pull toward *understanding the mystery*
rather than *shipping the feature*, which feels like progress
(generating new information) without actually being progress; and not
applying the same "tell the user this isn't converging" instinct to a
slow-burning investigation that I'd apply to an acute failure --
because each individual step felt locally justified, nothing ever
triggered the reflex. The stated resolution: set an explicit attempt
budget *before* starting open-ended/uncertain debugging work, rather
than improvising one experiment at a time with no exit condition. This
got tested almost immediately by the wave-ring edge bugs later in the
session (see below) and held up -- both were root-caused and fixed in
one pass each, not open-ended.

## Sea serpent v1, and "rethink our roles"

The serpent got built next per the punch-list spec above: arc-based
humps sampled as polylines (not SVG arc commands, to sidestep
sweep-flag sign errors), a piecewise thickness profile, a distinct
head. Prototyped in an isolated test HTML file, deliberately kept
outside the real render pipeline.

While that was being verified through the usual pipeline (local
server, headless browser screenshot), the user had already opened the
test file directly in their own browser and looked at it -- faster
than the automated verification finished. The feedback that followed
was the single most consequential process moment in this session:
"i've been asking you how to speed this up - I have already seent the
test_serpent.html in the folder, opened it, saw it, closed it, before
you finished all this processing through chromium screenshots and the
rest. Speed up the workflow. Rethink our roles."

The response was a real change, not an apology: for quick, isolated
visual prototypes where the user is actively present with a browser
open, routing through a local server + headless Chromium + screenshot
+ read-the-image-back cycle is strictly slower than the user just
looking themselves, for zero benefit. The working agreement from that
point on: write/edit the file, say it's ready, let the user look and
react directly; reserve the heavier automated-verification pipeline
for things the user *isn't* going to eyeball themselves (final
pre-commit sanity checks, headless-only regression checks, numeric/
structural verification of things too fine-grained for a human to spot
by eye). This shift held for the rest of the session -- essentially
every subsequent visual iteration (colour tuning, wave-ring spacing,
the wave-ring generator panel) was verified by the user opening the
page directly, not by me screenshotting it.

The serpent itself, once looked at, was judged "not the best" -- put
on hold pending a hand-drawn reference the user intends to provide.
Not revisited since; the prototype files are still sitting untracked
in the repo rather than deleted, since the geometry logic (arc-humps,
thickness profile, head shape) may still be a useful starting point
once the reference arrives, even if the specific tuning wasn't right.

Mid-session, two smaller factual questions came up and got answered
directly: whether the user's own network speed could slow down
responses in this Claude Code client (yes -- that round-trip does go
over their connection, distinct from any purely local tooling), and
whether *I* need my own connection to function (yes -- inference
itself happens via Anthropic's API, a separate concern from local
dev-server/browser tooling).

## Contours and waves, properly this time

The punch list's "offset waves like previous version" item came back
for a real pass, with four specific pieces of direction given together:

1. The existing coastline ripple contours (from an earlier pass) "looks
   great but needs to expand a little more - the lines are too close
   to each other and the island edge, and not clear."
2. That same noise-contour technique "would make excellent shapes for
   a shallow vs deeper sea - the shallow being a lighter blue and the
   deep being darker."
3. "A similar shape could be used to generate beaches on the island -
   the first band inwards from the edge is yellow for sand, the rest
   green for vegetation."
4. Critically: "the actual wave effect - the wave contour - that I
   want still needs to be a set of fixed distance contours; noise
   contours are not necessarily a fixed distance from the base line
   but wave contours need to be."

That fourth point was the real insight, and it reframed the rest of
the phase: the existing ripple rings were never true offset curves --
they were another threshold level of the same noise heightmap, which
happens to sit *roughly* farther out as the threshold drops, but not
at a genuinely constant pixel distance (the offset varies with local
noise/gradient steepness). That's fine, even *correct*, for depth and
beach banding -- sea depth and beach width plausibly should follow the
same terrain noise as the coastline itself, not a mechanically perfect
offset. But it's wrong for a literal "wave" effect, which needs a real
distance transform. This became the organizing distinction for
everything that followed: noise contours for terrain-following colour,
a genuine distance transform for the wave rings.

The colour-banding work went through one real iteration. The first
pass filled the ring *between* two adjacent noise-contour levels
(computed via an evenodd combination of the two contour paths).
Direct follow-up feedback pushed it further: "can the colours be the
same colour for ocean but differing alpha values - so as the layers
build up, colour intensity increases? This goes hand in hand with the
obvious request for more bands... on land, more bands layered up would
blend the sandy beach into the vegetation better - maybe 4 bands 2
yellow 2 green so theres 2 yellow-green overlaps before pure green."
That reframing was actually a simplification once understood
correctly: instead of computing exclusive rings between levels, just
stack several *full* same-colour translucent contours, loosest
threshold first -- points near the coastline end up under every layer
(most opacity, most saturated), points farther out end up under fewer
or none. For the sea side this works cleanly against the stage's own
dark background. For land there's no equivalent opaque backdrop, so
the sand layer's own opacity had to be kept high enough on its own to
keep the coastline edge from reading washed-out/watery -- flagged
explicitly as a tunable trade-off, not a hidden decision.

Along the way, the user asked directly whether the added contour
passes were getting expensive -- "is the compute getting expensive?
page load time?" -- which was answered with an actual measurement
(timing the real heightmap-build and contour-trace functions directly
in Node against a synthetic test canvas), not a guess. This became the
pattern for the rest of the session: whenever performance was a live
question, it got a real number, not reassurance.

A separate, unrelated efficiency question came up around the same
time: "how come you are using up ~15k tokens each time? What can we do
to be more efficient?" -- prompted partly by a wasted attempt to read
the *generated* `index.html` build artifact (hundreds of thousands of
tokens, hit a size cap and errored out before it did real damage). The
honest accounting: that failed read, repeatedly re-reading full source
files already covered earlier in the conversation instead of using
targeted searches, and matching the codebase's own heavily-commented
house style in my own edits, compounding the cost on both sides. The
concrete change: never read generated build output, avoid re-reading
files already in context, keep new comments shorter than the
codebase's existing (deliberately verbose) convention where a shorter
one says the same thing.

## Islands clustering closer together

A separate thread, revisited later in the session: "is there a way for
the archipelago islands - island of each section - be physically
closer together and farther from each other? It goes back to the
circle packing spread - can those initial circle centres be weighted
to be closer to the center of the rectangular region? would having a
gradient subtraction of a rectangular or elliptical gradient the size
of the entire section region from all the circle/islands help in any
way? would it displace the islands closer to the region centre?"

This got a real investigation before an answer, not a guess: the
actual scatter-point code turned out to sample uniformly at random
across each region's full rectangle, with no centroid bias at all --
confirming the lever the user was reaching for was real. The
region-sized-gradient idea, though, was the wrong tool for the job,
and worth explaining *why* rather than just declining it: that
gradient lives at the coastline-shape level, so it would only affect
how large/thin an island's *shape* reads near a region's edge, not
where its circle's center actually sits -- it wouldn't move anything
closer together, and worse, it would make an island's visual
prominence depend on its position within the region rather than its
actual entry weight, conflicting with the project's own consistent
design rule that visual size tracks weight, not location. The
recommendation instead: bias the scatter sampling itself toward each
region's centroid. Implemented as a per-axis warp of the uniform
random sample toward the center (not a radial warp -- simpler, and it
naturally follows each region's own aspect ratio rather than assuming
regions are square), verified directly by measuring average
distance-to-region-center before and after on a test scatter before
calling it done.

## The real wave contours, and two edge bugs found from a screenshot

With the noise-contour/distance-contour distinction settled, "go back
to the contours/waves" led directly into building the actual wave
effect: a genuine Euclidean distance transform from every point to the
nearest coastline, computed exactly (not a chamfer approximation),
verified against a brute-force reference on a synthetic test grid
*before* it was ever wired into the real page -- a deliberate
application of the "set an attempt ceiling, verify before integrating"
lesson from the boats saga.

Getting the actual ring spacing right was an extended back-and-forth,
entirely driven by the user trying numbers and reacting, not by
discussion: an initial guess, then "try distances should be from
14-28-56, x1, x2, x4.. or more likely 8-16-32" (a doubling
progression), then "distances should be from the previous base so
actually 8, 8+16, 8+16+32" (a cumulative-sum variant), then "try 5, 15,
35, and the last contour isnt very visible, slightly darker" (both a
new sequence and specific styling feedback on the outer ring's
weight). At that point the back-and-forth itself became the signal
worth acting on -- rather than keep relaying numbers by hand, the
right move was a small generator panel added to `islands-tool.html`:
count / start / multiplier / offset sliders driving
`distance[i] = start * multiplier^i + offset`, with a live preview of
the resulting sequence, seeded to reproduce whatever was already live
so opening the panel didn't silently change anything. The user then
tuned it themselves directly on that page and reported back the
specific values to bake into the shipped build -- "3, 2, 2.7, 4" -- a
clean example of the "rethink our roles" shift from the serpent
episode actually working as intended: a tool handed over for the user
to explore, rather than another cycle of guess-and-report.

Two real bugs surfaced after that, both found by the user looking at
an actual screenshot, not by anything I tested proactively:

1. **Contours jumping across the canvas.** A wave ring near an island
   close to the visible edge could reach the sampling grid's true
   border, trace as an *open* chain instead of a closed loop, and get
   silently treated as if it had closed anyway -- the rendered path's
   implicit closing line then drew a straight segment from wherever
   that chain happened to end back to wherever it started, often
   connecting to a completely unrelated contour elsewhere on the page.
   Root cause: the existing coastline heightmap had always force-set
   its outer border to a safe "definitely water" value specifically to
   guarantee every contour closes within the grid, but the newer
   distance field never got the equivalent treatment. Fixed by giving
   it the same border-forcing the coastline heightmap already had.

2. **The fix's own side effect.** That border-forcing traded one
   artifact for another: forcing the border flat also means anything
   that *should* naturally continue past the visible edge instead gets
   artificially squared off right at it -- visible as several islands
   (and their wave rings) along the canvas edges reading as flattened.
   Described precisely: "these situations should be allowed to flow as
   normal beyond the edge but simply cropped by the page/canvas edge,
   not force closed. But they should also not result in the previous
   issue of being linked to a different set of points elsewhere." The
   real fix wasn't another border hack -- it was sampling the
   heightmap/distance-field over an area padded well past what's
   actually visible (sized from the coastline's own maximum outward
   displacement plus the farthest wave ring plus a buffer), so shapes
   close naturally off-screen in that margin, and letting the SVG's
   own default viewport clipping crop anything past the real visible
   canvas for free -- no custom clip-path needed. Both the "does the
   fix work" and "did it reintroduce bug 1" questions got answered with
   a structural check (the largest point-to-point gap in any rendered
   ring path) rather than just a visual re-look, before handing it back
   for the user's own visual confirmation.

## flatColourMode, and colour tuning

Once both the colour bands and the wave rings existed together, a
direct side-by-side comparison led to: "the wave contour version ...
in the future I may have to pick between topographic contours with
colours and the wave contours - the two effects are great but dont
work together." Rather than deleting either in favour of the other, a
boolean config toggle (`flatColourMode`) was added so `drawIslandsPath`
can skip the colour bands entirely in favour of one flat land colour +
the plain water colour, letting the wave rings be judged on their own
-- both stay available, and switching back is a one-line change.

Smaller colour feedback followed once the wave-only look was visible
on its own: the land green read "too dull" (lightened), and the wave
rings themselves needed to be "darker, atleast the innermost one has
to be dark and the outer most lighter - vary by colour or by weight" --
addressed by moving off the same muted brown ink token the old ripple
rings had borrowed and increasing how much stroke-width itself (not
just opacity) varies ring to ring, so the rings differentiate on two
visual channels at once rather than relying on opacity alone.

## Documentation, tagging, and a convention correction

Once the colour-band and wave-contour looks were both working, the
user asked to preserve the colour-band version specifically: "save
this as a version... so one can come back to it if something doesn't
work out in the future," anticipating a possible future move to a
flat/thumbnail-based island colour scheme instead. This surfaced an
existing repo convention worth following rather than inventing a new
one -- an earlier tag (`cabinet-v1-before-map`) already existed for
exactly this "checkpoint before a risky direction change" purpose.
Two annotated tags were created this session on that same pattern:
`v3.6.5-colour-bands` and, once the wave contours were also done,
`v3.6.6-wave-contours` -- explicitly framed in the changelog as "these
two colour treatments are a real fork to choose between later," not a
straight progression where the newer one simply supersedes the older.

Later, asked directly whether I wanted to save screenshots of all
three visual states (colour bands alone, wave contours alone, both
together), the answer was yes, following the existing
`dev-screenshots/` convention from earlier in the project's history --
captured by temporarily flipping the relevant config, screenshotting,
then reverting via `git checkout` so nothing in the actually-shipped
config drifted in the process.

One small process correction is worth recording on its own: a commit
was drafted with a "Co-Authored-By: Claude" trailer, per a general
default habit, and the user pushed back immediately -- "why the
co-authored by tag? it wasnt there so far?" Checking the actual commit
history confirmed no prior commit in this repo used that trailer; it
was dropped from that commit and every one since, in favour of
matching the repo's own established convention over a generic default
when the two conflict.

## The documentation survey

Near the end of this phase, asked to "go through the other
documentation files - in cabinet as well as other worlds - and see if
there's anything missed by this list," a research pass across
`LANDING-PAGE-NOTES.md` (the top-level, production-site notes file --
distinct from `Landing-page-notes.2.0.md`), `README.md`,
`DESIGN-SYSTEM.md`, `WORLD-SYSTEMS.md`, and the sibling
`TheBookshelfOfCuriosities` repo surfaced several genuine gaps not
already tracked: known production-page follow-ups (card/label overlap
on wide islands, thumbnails still owed for some entries, an ambiguous
icon, an unverified DNS claim about fffx), a fully-built but unused
`callout-card` layout capability, a `WORLD-SYSTEMS.md` standing rule
that FabAcademy/Fabricademy sites should never become Cabinet islands
(directly relevant to a compass-rose/About-Me idea raised earlier in
the session), and a stale copy of `WORLD-SYSTEMS.md` sitting in the
Bookshelf sibling repo that should be brought up to date. All of these
were folded into the to-do list in `Landing-page-notes.2.0.md` rather
than left only in this log.

## Packing controls + preset switcher, with the cost analysis asked for up front (v3.6.8)

Picked back up from this file's own to-do list (items 5, 6, 8): "let's
work on the island-tool. add the controls to reroll circle centres, to
control centre-bias, as well as switching between preset looks --
starting with its cost complexity analysis." The phrasing put the cost
analysis first deliberately -- item 6 in the to-do list had explicitly
flagged "needs discussion + a real cost/complexity analysis before
committing to it," so that came before any UI code, not after.

The analysis itself used the same discipline as every prior performance
question in this project: a real measurement, not a guess (see the
"is the compute getting expensive?" precedent from the v3.6.5 pass). A
throwaway timing script (`_time-repack.mjs`, same convention as
`_verify-islandshape.mjs` and the others -- written, run against the
real 25-entry content, deleted once its numbers were in hand) split the
pipeline into its two real cost centers: repacking (treemap + scatter +
global growth) came back at ~1-3ms, essentially free; the island retrace
(heightmap build + marching squares) came back at ~70-100ms -- and that
second number was already familiar, since it's the exact cost every
existing shape-tuning slider in the panel pays per drag tick. That
reframed the whole question: reroll and center-bias both need a genuine
repack (they change what gets scattered, not just how a fixed circle set
gets traced), but since the repack itself is nearly free, reusing the
full `render()` pipeline for both costs no more than dragging any
existing slider already does -- no need to invent a cheaper partial-
repack path. Preset switching, by contrast, needs no repack at all: the
three combinations that already exist (wave rings, colour bands, both)
are just two config flags read by the same retrace path already in use,
so that came out even cheaper. What the analysis also clarified was
scope: it drew a hard line between switching among effects that already
exist (cheap, built this pass) and the to-do list's own further example
-- a "medieval map" preset layering an illuminated-manuscript treatment
on top -- which would need actual new rendering code for a look that
hasn't been designed yet. That's not a cost number to estimate, it's a
design conversation that hasn't happened, so it stayed on the to-do list
as its own open item rather than getting folded in or guessed at.

Three controls came out of this, all in `islands-tool.html`'s panel: a
center-bias slider (mutates `v3Config.pack.centerBias` directly, same
range as the existing config comment's own discussion of pushing it
higher); a "Reroll positions" button, deliberately a button and not a
slider, since trying a different random layout is a discrete action with
no meaningful in-between value; and three preset buttons (Wave contours
/ Colour bands / Both). The reroll needed one small addition to
`cabinet-v3-layout.js` itself -- a module-level nonce folded into each
section's scatter seed only when nonzero, so the production/archive
pages (which never load the controls script) are provably unaffected,
and a fresh `Math.random()`-drawn nonce each time rather than an
incrementing counter, so hitting reroll twice in a row can't coincidentally
land back on a seed that looks unchanged. This is also the point in the
whole v3 project where a control panel introduces `Math.random()` at
all -- everything else in this codebase's determinism story (mulberry32,
seeded by content or a fixed string, "same content in, same layout out")
stays intact; only the moment of choosing a reroll's seed is genuinely
random, the layout that results from it is deterministic again the
instant it's chosen, same principle `warpOffset()`'s own seeding already
established for the one other place this project touches genuine
randomness.

Wiring the preset buttons surfaced one small existing-code observation
worth recording: `waveDistances`' array is owned by the Wave-rings
generator panel (v3.6.7, its own count/start/multiplier/offset sliders),
so a naive "Colour bands only" preset that cleared `waveDistances`
directly would silently desync the moment anyone touched a wave-ring
slider afterward. A separate `showWaveRings` boolean sidesteps that --
the array itself is never touched by a preset switch, only whether it
gets drawn.

While reading `Landing-page-notes.2.0.md`'s changelog to write this
pass's own entry, a documentation gap turned up: several `v3.6.7`-dated
comments already existed in the code (the wave-ring generator panel, an
edge-padding fix, `flatColourMode`'s CSS) with no matching changelog
entry -- the version had shipped without ever getting logged. Noted and
backfilled with a short reconstructed entry rather than silently
skipped, so the version trail stays honest; this pass's own work is
`v3.6.8`, the next actually-unclaimed number.

## A real bug, and "let us treat it with some sophistication" (v3.6.9)

Direct follow-up to trying v3.6.8's new controls live: a precise bug
report ("Wave contour shows waves and topology i.e. BOTH, Colour bands
show ONLY sea topology but land is flat green, BOTH shows sea topology
AND wave contours, but land is still flat") plus a genuine design
question ("What does Reset restore -- does it reset to last applied /
currently active values?") plus a restructuring request driven by the
tool having outgrown its original shape: "island-tool is fast becoming a
properly complex tool to generate and test parameters for the island
map. Let us treat it with some sophistication."

The bug diagnosed cleanly from the symptom description alone, before
touching any code: three different broken-looking outputs that all
traced back to one root cause once the pattern was visible -- switching
`flatColourMode` at runtime kept leftovers from whichever branch had
been active before, because `drawIslandsPath()` had only ever been
exercised via a full page reload until v3.6.8's live checkboxes existed.
Confirmed with a Playwright script that counts DOM elements by class
after cycling through every combination, not just a visual re-look --
the project's own established standard for "did the fix work," applied
here to a rendering bug instead of a geometry one.

The Reset question got a direct, honest answer rather than an assumed
one: Reset restores a single fixed snapshot taken when the panel first
loaded (in practice, `cabinet-v3-data.js`'s shipped values), not a
rolling "last applied" state -- worth stating plainly since the two
readings genuinely differ in what a user would expect clicking it to do.

The restructuring request came with real structure already specified,
not just "make it nicer": three named sections with explicit contents,
an explicit ordering principle ("deepest effect/earliest in the workflow
at the bottom"), collapsibility as a stated requirement (with the
concrete motivating case -- tuning wave contours without Island shape's
sliders visibly in the way), and a checkbox-based visuals model
("checkbox for Wave contour look, Topological look, if both are checked,
BOTH is fulfilled") that turned out to be a genuine simplification over
the three-button preset switcher it replaced -- two independent booleans
cover the same three combinations plus a fourth (neither checked) the
buttons had no way to reach, with no "which preset is currently active"
state to track at all. Implemented via native `<details>`/`<summary>`
rather than custom JS toggle state, specifically because independent
per-section collapse is what native `<details>` already does for free.

Building the topological-offset sliders (punch-list item 7, carried
since the wave-ring generator's own panel section in v3.6.7) surfaced
one more small correctness point worth recording: the very first draft
had each slider mutate its target array by index in place
(`arr[i] = v`), which would have silently corrupted the Reset snapshot
the moment any slider moved, since a shallow `{...v3Config.island}` copy
shares array references, not array contents. Caught before it shipped,
not after -- every array-valued slider in the panel now replaces its
array wholesale (`.map(...)`) instead of mutating in place, and the
snapshot itself deep-clones its array fields, so the two can never
alias.

## Full-bleed canvas, and catching an SEO/accessibility mistake mid-flight (v3.6.10)

Picked back up several punch-list items at once: "8 - count as done... Check on 9... Tell me what is the necessary condition for the Canvas to actually expand? Will it be responsive to other desktop screens as well... Do 12 and 13 too." A genuinely mixed request -- one item accepted as complete on the spot, one asked to be investigated (not fixed), one asked as a direct technical question before any code, and two asked to be built.

Item 9 got a real measurement before an answer, not a guess: reconstructed the actual treemap/packing pipeline in a throwaway script against real content and found `minSectionWeight` (v3.4) floors a section's AREA but not its ASPECT RATIO -- `about` squarifies to a 92x488px sliver (aspect 0.19) even with its weight floored from 2 to 5, because `squarify()` optimizes each row's aggregate squareness, not any one item's own shape. The circles inside aren't actually undersized (the sliver's just tall enough to give them room), but the region reads as a visibly cramped strip -- confirmed directly in every full-bleed screenshot taken later in this same pass, not just argued abstractly. Reported as "investigated, insufficient as-is" rather than silently fixed, since the real fix (an aspect-ratio constraint back in `squarify()`) is a scope decision, not a one-line change.

The canvas-expansion question got answered with the actual mechanism before any code changed: CSS `width:100%` already made the SVG scale with the window, but the viewBox's own SHAPE was a fixed function of content weight, never the viewport -- a 4:3 window and an ultrawide one got the identical rectangle, just resized. Flagged as directly tying into item 12, per the user's own instinct.

The header fold (item 13) took a wrong turn worth recording precisely, because it was caught and reversed within the same pass rather than shipped and found later. First implementation drew the title/tagline as literal SVG `<text>` inside `render()`'s own output, deleting the HTML `<header>` entirely -- a literal reading of "fold into the map's own legend." Before finishing, a direct follow-up question -- "what is the necessary condition... will it have the necessary effect, and keep the page sane for the rest of the web?" -- prompted checking the actual consequences rather than assuming they were fine: no `<h1>` in the accessibility tree any more, and on `islands-tool.html` specifically (no static build, unlike `index.html`) the text would only exist if a crawler executed JavaScript. Laid out honestly, with a recommendation (add a visually-hidden `<h1>` back) rather than silently living with the regression.

The user's actual intent turned out to be much simpler than what got built: "I merely imagined repositioning the header and text through CSS magic, not restructure things." That one sentence reframed the whole approach -- keep the real, unchanged `<h1>`/`<p>`, `position: absolute` it over the canvas's own corner via CSS, and solve the one real remaining problem (map content rendering underneath it) by registering the header's measured footprint as a growth obstacle, the exact mechanism every section's own label band already uses. Simpler, and, as directly confirmed when asked, strictly better on every axis the SVG-text version had put at risk.

A related but genuinely separate question came up immediately after: "does this mean the rest of my section and entry links aren't search engine friendly?" -- easy to conflate with the header issue, but structurally different, and answered by checking the actual built file rather than reasoning from the header case by analogy: `index.html`'s 25 island links are baked as real static `<a href>` tags at build time (verified: `grep`, 25 matches, 0 `<script>` tags in the shipped file) -- a mechanism that predates this session entirely (since v3.6.2) and was never at risk. The one honest nuance flagged: those links live inside `<svg>` rather than plain HTML body flow, which modern crawlers generally handle but isn't quite as universally certain as an ordinary body-level anchor -- worth an empirical check via Search Console once a real domain exists, not something to keep reasoning about in the abstract.

`build-render.html` (the headless capture page for the static build) needed the same header added to it too, for a reason that wasn't obvious until the full-bleed mechanism existed: since the header's footprint and the available viewport height now both feed directly into what gets computed, a capture environment without a header would bake a shape that doesn't match what real visitors actually see. Caught while implementing, not after.

## Eight comparison colour/type schemes (this session)

Picked up punch-list item 10 again with a concrete artifact this time:
a new file, `v3-scheme-candidates.md`, laying out several complete,
self-contained colour/font directions rather than one palette to
critique. The opening ask was narrow and specific: "alongside the
current 2 schemes, add these 4 more from the document above, and have
them appear in the dropdown - I will have a look at them and then start
eliminating and finetuning until we get to one. Check the docu and tell
me what you think?"

Reading the doc before touching anything surfaced two things worth
flagging rather than silently resolving: the doc's own §3 only calls
two of its three sub-directions (3a Riso, 3b Cyanotype) real
candidates, explicitly noting the third (3c, Van Gogh) is "reference
only, not a full token set" -- so "4 more" only cashed out to 3
buildable schemes plus a note, not 4 dropdown entries. And the
existing "medieval"/"satellite" theme pair already in the code
predated this doc entirely -- built from a first guess, sharing the
site's existing parchment/land tokens, not the doc's own hex values or
its 3-font pairing for scheme 1. Both points got laid out plainly
before any code changed, per the standing "discuss before executing"
preference restated at the top of this session ("we were yet to
discuss them... standing order not to do anything until I say Go
Ahead").

The reply resolved both ambiguities directly: "the 4 schemes are 1.
Medieval map 2. Topology Bathymetric Satellite 3. Riso 4. Cyanotype...
There are existing Wave Contour Map and Topology schemes existing, what
you call placeholders, but the details are different so those and the
new 4 can live side by side" -- i.e. don't replace, keep both
generations, just label them so they don't read as duplicates. That
put the count at 6. A follow-up message corrected it to 7: "Sorry, 7. 7.
Neon Memphis as described" -- the doc's scheme 4, dropped from the
first count by mistake, not by intent. Confirmed the final 7-item list
back before writing anything, then got "go ahead."

Implementation followed the doc closely but not blindly, judgment
calls made and stated rather than silently guessed: Cyanotype's island
labels were deliberately kept off the doc's suggested Caveat
(handwriting) face, since the doc's own text warns handwriting faces
degrade below ~14px and island labels render at 13px -- only the
larger, sparser section labels got the script treatment. Neon
Memphis's "neon is accent only, never a fill" constraint was honoured
by giving the wave-ring stroke a violet accent while keeping the
coastline outline heavy/near-black, matching the doc's own
implementation note that the pastel land/sea sit close enough in value
that outline weight has to carry more legibility work than in the
other schemes. Riso's halftone texture and ink mis-registration offset
were deliberately not built -- flagged as needing actual new SVG
rendering logic, not a token swap, and left as a stated fast-follow
rather than silently dropped or silently built without asking.

Verification took a different shape than earlier in the project on
purpose: rather than spinning up a local server and Playwright again
(the exact loop flagged earlier this session -- "i can see the effect
and I suspect you are going around in circles?" -- as a repeat of the
boats-debugging pattern from further back), the CSS got checked
structurally instead: a small Node script strips comments the same way
a real CSS parser would and confirms every brace balances and every
theme's rule block survives intact. That was specifically informed by
how the earlier `*/`-in-a-comment bug had been found (only visible via
inspecting the parsed stylesheet, not by reading the source or looking
at the page) -- so the same class of failure got a repeatable, instant
check instead of another round of load-and-look.

Shortly after the 7 schemes went live, told the candidates doc had
already been updated again and to "find the Ukiyo Woodblock scheme and
add it to the dropdown." Re-reading the doc turned up a new scheme 5
(Ukiyo-e woodblock, Hokusai/Hiroshige register: indigo, vermillion,
ochre, sumi ink, Shippori Mincho + Zen Old Mincho), added as an 8th
entry following the same pattern as the rest -- except its preset is
the only one that turns colour bands AND wave rings on together, since
the doc explicitly calls for the ripple contours to read as woodblock
linework layered over the bands, rather than one effect standing in
for the other the way every earlier scheme picked. Vermillion (the
doc's accent for seals/route lines/key details) wasn't wired to
anything, same reasoning as Medieval Map's unused rubric/gold tokens
earlier -- no element on the map plays that role yet.

A direct clarifying question followed once all 8 were live: "I am
assuming each scheme has its default of wave contour or topological
isolines checked by default when activated from the dropdown? For a
scheme that does not default to topology but I manually turn it on
anyway, what are the results based on?" Answered plainly: yes, each
theme nudges both checkboxes to whatever combination it was written
assuming, but they stay independently editable afterward -- and
turning on the "wrong" effect for a given theme still renders using
that same theme's own colour tokens (never a fallback palette), just
through the alpha-banding mechanism instead of a flat fill or vice
versa. The caveat given: those tokens were chosen for the *default*
pairing, so e.g. Medieval Map's bands (deliberately close in value to
each other, since that scheme's whole principle is ink-carries-shape)
would read muted if switched on manually, where Bathymetric/Riso/
Cyanotype's bands were tuned for exactly that contrast. Band opacities
themselves were noted as fixed constants shared across every theme,
not something themed per-scheme yet.

Told to commit "for now" with the explicit framing that the look-and-
feel judgment itself is still pending -- "I'll test them more
extensively later on the look-feel, but they seem to be working and
functional." All 8 schemes (the original 7 plus Ukiyo) went in
together as one commit. Checking the actual commit history before
writing the message turned up a small reversal worth recording: the
"Co-Authored-By: Claude" trailer, explicitly removed earlier in this
project after a direct correction ("why the co-authored by tag? it
wasnt there so far?"), had reappeared consistently in the three most
recent commits -- from the other-machine session's own work. Matching
the currently observed convention rather than a remembered past
decision, the trailer went back in this time; the underlying principle
(follow what the repo is actually doing now, not a fixed rule) held in
both directions.

## Flow field: two options collapse into one mechanism, then "use me" (this session, v3.6.16)

Item 4's flowfield idea (see "The original punch list" above) came back
up on its own, unprompted by any specific bug or request -- just picked
up as the next open thread. Asked for a technical proposal before any
code, direction given fully worked out already:

> I am ok with precomputed fields, and the islands are either no-go
> areas, or there is a strong vector along the island edge that
> transports particles from one edge to the other until the main
> current takes them away (which sounds comutationally bad atleast for
> the initiation, it may be ok as a precompute) or actively repulsing so
> thats an easier composite vector field to compute.

Plus: particles start as small ellipses, spawn/despawn or reset off-
canvas (explicitly framed as "whichever's easier," not a hard
requirement for one over the other), the base current itself should be
"a smooth lazy field, not very turbulent" since island repulsion alone
was expected to carry the visual interest, and -- specifically requested
up front, before any particle code -- a dev-panel way to see the noise
field and vector directions while tuning it.

The proposal back collapsed what was framed as three separate options
into one mechanism: `buildIslandHeightmap()` already computes a smooth
scalar field for the coastline trace, so its gradient IS the no-go/
repulsion vector (push away from land), and that same gradient rotated
90deg IS the edge-following tangential vector -- no separate boundary-
tracing needed for the "computationally bad" option, since both come out
of a field that already exists. Framed as a `coastMix` blend rather than
a pick-one. Approved in three words -- "Sure go ahead" -- for the
narrower first slice proposed alongside the technical writeup (field
math + two debug toggles, no particles yet, so the field can be judged
before anything gets built on top of it).

Implementation surfaced one genuine design choice worth recording: curl
noise (gradient of a potential, rotated) for the base current, over the
more obvious "sample two independent noise functions for vx and vy" --
chosen because curl noise is divergence-free by construction, so it
can't produce the fake convergence points independent sampling risks.
Not asked about directly; a judgment call made and then documented,
rather than surfaced as a decision point, since it's a standard,
low-risk technique with a clear reason and no real tradeoff against the
alternative.

Default tuning values (how strong the coast vector should be relative to
the current, the current's own frequency) came from a throwaway Node
script sampling the actual field against realistic content -- open
water vs. right at a coastline -- rather than guessed and eyeballed
later, continuing this project's own established practice for anything
with a "does this feel right" dimension.

### "Use me"

Once the debug toggles were working, screenshots got taken (Playwright,
saved to `dev-screenshots/`) to describe what the field looked like
before asking whether to proceed further. Response, verbatim:

> I am the human in the loop, it is faster for me to see the updated
> page and say yes no ok than you to do the screenshot workflow, so use
> me.

Alongside a second, more mechanical correction: a working Playwright
install had been set up and torn down multiple times across this
session as the scratchpad directory got wiped between turns --
"install chromium and playwright if you are going to frequently use it,
dont uninstall-reinstall all the time." Fixed by installing once into a
persistent location outside the scratchpad and recording where, so it
doesn't need reinstalling next time either.

The bigger lesson is the first one: screenshot-and-describe is a real
tool for *functional* verification (console errors, correct hrefs, no
stale toggle state -- things a human wouldn't want to manually check
every time) but a poor substitute for actual visual judgment, which the
user is simply faster and more reliable at doing directly. This tracks a
pattern from earlier in the project too -- the label-halo concatenation
bug, the front-end colour miscategorization, the overlap issue -- real
visual problems this session's own screenshot workflow hadn't caught
first, the user had. Going forward: functional checks stay automated;
anything about how something *looks* gets a "here's what to reload and
look at," not a description of a screenshot.

## This handoff

This file and the two-section to-do list in `Landing-page-notes.2.0.md`
exist because the user is picking this work up from a different
machine, without this conversation available to provide context. The
technical *state* (what's built, what's configured, what's tagged) is
fully captured in the code and in `Landing-page-notes.2.0.md`'s
changelog, as always. This file is the part that changelog entries
don't carry on their own: the actual back-and-forth, the direction
changes, the process lessons (the boats sunk-cost loop, the "rethink
our roles" workflow shift, the commit-convention correction), and the
reasoning behind decisions that could otherwise look arbitrary out of
context.
