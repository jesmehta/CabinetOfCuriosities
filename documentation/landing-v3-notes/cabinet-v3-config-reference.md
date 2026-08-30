# Cabinet v3 -- Live Config Field Reference

A consolidated, readable copy of the reasoning behind every field in
`v3Config` (`landing-v3/shared/cabinet-v3-data.js`) that the dev panel
(`islands-tool.html` / `cabinet-v3-controls.js`) can live-edit: `island`,
`flow`, `particles`, `geo`, `themePreview`, `colors`, `fonts`. Created
2026-08-30 during the `#32` ("Rework Copy config") work; `colors`/`fonts`
added the same day once that rework expanded to also move theme colours/
fonts out of `cabinet-v3-style.css` and into `v3Config` (they didn't
previously exist as JS data at all -- see those sections' own intros).

**This is a copy, not the source of truth.** Nothing was deleted or moved
out of `cabinet-v3-data.js` to create this -- every comment quoted or
summarized here still lives in its original place in that file too. This
file exists purely because the source file's inline comments (interleaved
with the actual config values, and now further apart once `#32`'s
per-key copy-config script needs the values to stay pasteable) are more
tedious to browse than one flowing reference document. If the two ever
disagree, treat `cabinet-v3-data.js`'s own comments as authoritative --
this file can drift out of sync if a future edit updates one and not the
other.

For the blow-by-blow chronological story (what was tried, what broke,
what the user said) rather than a per-field reference, see
`Landing-page-notes.2.0.md` in this same folder -- searchable by version
number (e.g. "v3.6.20"), which every entry below also carries.

`v3Config.dragon` and `v3Config.title`/`legend`/`canvas` fields are **not**
covered here -- `dragon` has no live dev-panel controls at all yet (see
ToDo `#139`), and `title`/`legend`/`canvas` aren't part of the
copy-config scope this doc was written for. `pack` is a partial
exception -- included below because ONE of its fields (`centerBias`) is
live-tunable; the rest of `pack` is static/hand-edited only, same as
`dragon`.

---

## pack

Circle-packing/scatter tuning -- see `cabinet-v3-circlepack.js`. Only
`centerBias` has a dev-panel control (Layout section's "Reroll
positions" area); every other field here is hand-edited only.

### bandHeightRatio

Reading-order banding -- see `sortPointsByBandReadingOrder()`. A band
this tall (as a fraction of the region's own height) groups points into a
"row" for ordering purposes without constraining their actual scattered
position.

### minSeparation

Floor for scatter-point separation -- `safeMinSeparation()` takes the max
of this and a value derived from `minRadius`/`maxWeightExtra`/`padding`,
so this only matters if it happens to exceed that derived value; kept as
an explicit floor rather than relying entirely on the derived number.

### minRadius

Hard floor: every circle starts at least this big, before growth and
regardless of weight. Raised from an earlier `5px` after real entries
(Asimov, Student Work) read as too small even post-growth.

### maxWeightExtra

Weight-scaled addition on top of `minRadius` (sqrt-scaled against a
section's own weight range -- `packRadiusFor()`). Growth itself is
weight-blind (every circle grows by the same `growStep` per pass) -- so
weight's influence on *final* size is real (it sets this starting gap,
which tends to persist) but secondary to local density.

### growStep

Radius gained per growth pass -- ported directly from CirclePack.js's
`Bubble.grow()` (`bubRadius++`, i.e. 1 unit/pass).

### padding

Minimum gap kept between two touching circles (and between a circle and
its region's own boundary).

### maxRadiusRatio

A circle's radius as a fraction of its region's shorter side -- caps any
single circle from dominating a sparse region.

### maxIterations

Defensive cap on growth passes -- see `growCircles()`'s own comment for
why this shouldn't normally bind.

### centerBias

v3.6.6 -- pulls scatter points toward their region's own centre before
min-separation rejection runs (`centerBiased()`), so a section's islands
cluster tighter together with more open water near the region edges
instead of spreading uniformly across the whole rect. `1` = untouched/
uniform (the old behaviour); higher pulls harder toward centre. Applied
per axis, not radially, so it follows each region's own aspect ratio. A
strong value can make min-separation harder to satisfy in a crowded
section (more rejected attempts before falling back to the least-bad
candidate) -- watch for circles reading closer together than intended if
this gets pushed much higher. The only `pack` field with a live dev-panel
slider (Layout section) -- see ToDo `#8`.

---

## island

Shape, coastline, and band-threshold tuning -- read by
`cabinet-v3-islandshape.js` (heightmap/coastline generation) and
`cabinet-v3-layout.js` (`drawIslandsPath()`, band/shadow rendering).

### cellSize

Grid spacing for the heightmap/marching-squares pass, in canvas px.
Smaller = smoother coastline + more path points; kept small enough to
stay visibly faceted (matching the v2 map's own coarse-grid coastline
aesthetic) at a cost proportional to circle area, not canvas area.
v3.7.11 -- tightened 4 -> 3 for more accurate coastline offsets (wave
rings, coast-hugging bands/shadow), once the resolution/speed tradeoff
was confirmed build-time-only: the static `index.html` page pays nothing
for this, only `islands-tool.html`'s live retrace and the one-time
`node build-static.mjs` run get slower.

### noiseScale

Noise sample frequency: world px per full noise period is roughly
`1 / noiseScale`. Tuned so a mid-sized circle's coastline shows several
wobbles around its circumference, not one broad bulge or fine static.

### octaves / lacunarity / gain

`fbm2D`'s octave count / per-octave frequency multiplier / per-octave
amplitude decay, for the per-pixel edge noise. v3.5.1 tried `octaves: 6`
(up from 3) to see finer coastal detail in isolation -- reverted, since
the extra octaves' higher-frequency detail falls below what `cellSize`
can resolve at trace time (more compute, near-identical result) and
didn't touch the actual complaint (still fundamentally round --
`angularStrength`/`warpStrength` did).

### noiseAmplitude

Multiplies the raw (roughly `[-1, 1]`) fbm output before it's compared
against the radial gradient -- tuned together with `threshold` and
`gradientStrength`.

### innerFrac / outerFrac

Normalized distance from a circle's own centre (as a fraction of its
radius) where the radial falloff starts (`innerFrac`, always land inside)
and ends (`outerFrac`, always water beyond). Tuned (with
`threshold`/`gradientStrength`) so the average coastline crossing sits
close to the circle's own original radius -- verified empirically (a
throwaway Node script), not derived analytically.

### gradientStrength

How steep the radial falloff is between `innerFrac` and `outerFrac`;
tuned with `threshold` so `outerFrac` is always reliably water regardless
of noise.

### threshold

Height separating land (`> threshold`) from water. Sits comfortably below
`noiseAmplitude`'s own range so the guaranteed-land core (`innerFrac`) is
never accidentally carved into water by an unlucky noise sample.

### waterLevel

Baseline height for every grid cell no circle's influence reaches -- far
enough below `threshold` that open ocean never registers as land. v3.7.28
-- loosened `-1 -> -1.4`: direct request to extend the loosest Sea
slider's reach for more sea-floor variance. `-1` sat right at the edge of
what the Sea 1-4 slider range could usefully reach (Sea 4's loosest
default, `-0.97`, was only 0.03 from the old floor). Verified empirically
that a level crossing `waterLevel` doesn't fade gradually --
`traceContourFromHeightmap()` returns a genuinely EMPTY path the instant
it does (h can never register below this value, so "H > level" becomes
trivially true everywhere, and a uniformly-true field has no crossing
left to trace) -- that's the "blink out" behaviour that had been
reported. `-1.4` pushes well past every current `seaBandThresholds`
value, leaving real headroom.

### seed

Fixed seed for the whole shared heightmap (not per-section -- there's no
natural per-section key for a field every section's circles contribute to
together).

### angularStrength

How much the falloff radius bulges/pinches by angle around a circle's own
centre (`angularRadiusScale()`). `0.4` means the radius ranges roughly
0.7x-1.3x its base value by direction -- noticeably lobed without ever
collapsing to a sliver. Structurally can only bulge/pinch a radius, never
fold the boundary back on itself -- see `warpStrength` for what does
that.

### angularFreqMin / angularFreqMax

Range of "loop radius in noise-space" a circle's own angular pattern is
randomly drawn from. ~1.2-2.4 empirically lands around 2-4 lobes per
island -- "peninsula and bay" character, not a wavy circle or a
starburst.

### angularOctaves / angularLacunarity / angularGain

Same fbm idea as `octaves`/`lacunarity`/`gain` above, walked around the
angular loop instead of across the plane (`angularFbm()`) -- deliberately
separate knobs so angular and edge frequency bands tune independently.
Added in v3.5.3 because a single octave (v3.5.2) produced one smooth
wavelength of deformation that still read as "a distorted circle," not a
coastline.

### angularRidgeMix

Blends smooth angular fbm (0) with a ridged remap of the same samples (1)
-- see `ridge()`. Raw noise spends most of its range near 0 (broad,
rolling), so ridging turns rare excursions toward the extremes into
sharp, narrow radius pinches (fjord-like inlets) while leaving everywhere
else a smooth plateau. Originally shipped leaning ridged (`0.6`); pulled
back once domain warping (below) started doing more of the sharp-feature
work itself.

### warpStrength / warpScale / warpOctaves / warpLacunarity / warpGain

Domain warping (`warpOffset()`): displaces the sample *position* itself
before the distance-to-centre check runs -- what actually makes real
concavity (bays/hooks) possible, which `angularStrength` structurally
cannot do no matter how extreme. `warpStrength`: max displacement in
canvas px. `warpScale`: like `noiseScale`, deliberately a lower frequency
than the fine edge texture, since a warp fold needs to displace a whole
stretch of boundary together to read as a bay rather than jitter.
Original values came from an empirical sweep (strength x period against
12 synthetic circles, scored by fraction of rays crossing the coastline
more than once -- proof of a real fold, not just texture); current values
are the first interactive-tuning pass via the dev panel's "Copy config."

### seaBandThresholds / sandThresholds / vegThresholds

v3.6.5, replacing a single `seaShallowThreshold`/`beachThreshold` pair.
Each array is a stack of full (not ring-clipped) contours off the same
heightmap, same colour + fixed fill-opacity per group, drawn loose-to-
tight (widest reach first/bottom). Because `{h > L}` is a strict superset
of `{h > L'}` whenever `L < L'`, every tighter contour nests inside every
looser one regardless of noise -- a point near the coastline ends up
under every layer in its group (most stacked = most saturated), a point
far out is under only the loosest one or none. That's what makes shallow
water read lighter than deep, and beach/vegetation blend instead of
hard-cut. These are noise contours, not fixed-distance -- real pixel
distance from the coastline varies with local noise/gradient steepness
(fine for depth/beach width, NOT the same as the "wave" ripple effect,
which needs an actual distance transform -- see `waveDistances` below).
v3.7.29 -- retuned live via the dev panel's "Topological offset
parameters" sliders (stored in raw form despite the sliders themselves
being relative), then pasted back via "Copy config." `seaBandThresholds[0]`
(`-1.38`) sits deliberately close to `waterLevel` (`-1.4`, only 0.02
above) rather than accidentally past it. `sandThresholds[0]` (`-0.66`) is
unusually slightly looser than `threshold` (`-0.62`) -- Land 1 extends a
hair past the coastline into the sea, same as every `seaBand` level
already does; valid since the loose-to-tight nesting property doesn't
require staying on one group's "expected" side of the coastline.

### peakThresholds

v3.7.28 -- "Land 5," direct request: "a very high contour seen only on
some of the islands, a mountain peak of sorts." Its own array (not folded
into `vegThresholds`) because it needs its own colour (`--v3-peak`,
white) distinct from veg's green. First value (`0.13`) was picked by
bisecting the dev panel's own "Land 5" slider against real site content,
after a synthetic single-circle sample's suggested ~0.2 turned out to hit
ZERO real islands (`buildIslandHeightmap()` caps h at `n - fall`, and each
circle's own realised peak varies a lot by size/seed, not just
theoretical amplitude ceiling). `0.13` was where real content first
showed a modest handful of small caps rather than none (`0.16`) or nearly
the whole map (`0.05`). v3.7.29 -- nudged to `0.14` by further live
tuning, same reasoning, one more notch up.

### waveDistances / showWaveRings

v3.6.6 -- the actual "wave" effect (`buildCoastlineDistanceField()`):
genuine fixed pixel distances from the coastline via a Euclidean distance
transform, NOT another noise-heightmap threshold like the arrays above.
Nearest first; tuned via the dev panel's "Wave rings" generator
(count/start/multiplier/offset sliders, v3.6.7). `showWaveRings` (v3.6.8)
is an independent on/off switch so the "preset look" combinations (waves
only / bands only / both) can be reached without clearing `waveDistances`
itself, which would desync from the generator's own sliders.

### flatColourMode

v3.6.7 -- the depth/beach/vegetation bands and the wave rings read as
visually competing effects together, per direct comparison. `true` skips
all `seaBandThresholds`/`sandThresholds`/`vegThresholds` rendering in
favour of one flat land colour + the plain `.v3-stage` water colour, so
wave rings can be judged on their own. Toggle back to `false` to compare
again -- nothing about the band config is lost by flipping this.

### coastOutwardBandDistances / coastInwardBandDistances / showCoastalBands

v3.7.9 -- coast-hugging colour fade, independent of `flatColourMode` (an
overlay on top of whichever base fill is active, not an alternative to
it). Tight, fixed-pixel offsets off the real coastline via
`buildCoastlineDistanceField()`/`buildInlandDistanceField()`, same
mechanism as `waveDistances`, not another noise threshold -- direct
instruction: "both bands, inward and outward, follow coastline offset not
topology." Empty either array to turn that side off. v3.7.11 -- shrunk
from `[6, 14, 24]`: direct feedback -- "why does each wave ring have its
own shadow band?" The old reach ran past `waveDistances`' 2nd/3rd rings,
so each ring picked up its own nearby band step. Now fully faded out by
7px, clear of ring 2, well clear of ring 3. v3.7.21 -- `showCoastalBands`
added as an independent on/off switch, same "empty-list vs. boolean"
split as `showWaveRings` -- distances stay intact on toggle-off. v3.7.42
-- `coastOutwardBandDistances` cleared to `[]` (was `[2, 4, 7]`, same as
inward): direct feedback, "land baseline should be coastline by default,
to subtract from, shouldn't be extending out to sea" -- the sea side
already has its own depth gradient (`seaBandThresholds`) and shadow
(`seaRadialShadowDistances`) doing that job. Left as a real empty array
rather than removed outright -- `placeBand()` already no-ops an empty
list, so this stays the one place to re-enable it.

### showSeaShadow / seaRadialShadowDistances

v3.7.10 -- the actual active shadow: all-around (radially symmetric),
same coastline-offset mechanism as `coastOutwardBandDistances`, painted
black instead of `--v3-sea-shallow`. Direct feedback: an earlier
directional version made islands "look like straight cliffs rising from
the sea." v3.7.11 -- shrunk from `[4, 9, 16, 26]`, same reasoning as
`coastOutwardBandDistances`. v3.7.13 -- widened again to `[2.5, 5, 8, 11]`:
direct feedback -- "too narrow, too light, and aligns exactly with the
first wave contour." The old `[2,4,7]` topped out right next to
`waveDistances[0]` (6), reading as locked to that ring; widened for a
smoother taper and deliberately shares no value with `waveDistances`
(`[6, 9.4, 18.58]`) so the two don't coincide again. Darkness itself comes
from `.v3-sea-shadow-radial`'s higher fill-opacity, not from these
distances. v3.7.21 -- `showSeaShadow` independent on/off switch, same
pattern as `showCoastalBands`.

### seaShadowStyle

v3.7.24 -- which sea-shadow shape `drawIslandsPath()` renders when
`showSeaShadow` is on: `"radial"` (the all-around band above, every
theme's default) or `"directional"` (translated, tapering copies of the
terrain's own nested contour levels, angled toward `seaShadowAngleDeg`).
Set per-theme via `THEME_PRESETS` (`cabinet-v3-controls.js`), not edited
here directly -- this default only matters before the Theme dropdown is
ever touched.

### seaShadowAngleDeg

Angle convention matches `drawGeoGrid()`'s diagonals: 0=E, 90=S, 180=W,
270=N, clockwise (SVG y grows downward) -- `135` = shadow cast toward SW =
light from NE. Shared by both shadow styles, though only `"directional"`
actually uses a single fixed angle.

---

## flow

Precomputed vector flow field (currents) for particle advection -- see
`cabinet-v3-flowfield.js`. v3.6.16: two composited layers, a smooth
"lazy" base current (curl noise) plus a coast vector derived from the
SAME heightmap island rendering uses, no separate island geometry. See
`Landing-page-notes.2.0.md`'s "Flow field" entry for the original design
conversation.

### cellSize

Grid spacing for the flow field, in canvas px. Coarser than
`island.cellSize` on purpose: the field is bilinear-sampled at read time,
and a lazy, smooth current doesn't need coastline-trace resolution.

### seed

Fixed seed for the base current's noise, independent of `island.seed` --
keeps the current's texture decorrelated from the coastline's.

### potentialScale

Noise sample frequency for the current's underlying scalar potential:
world px per period is roughly `1 / potentialScale`. Deliberately much
lower frequency than `island.noiseScale`'s fine texture -- "lazy," broad
undulation across the canvas. Tightened from `1/420` at v3.6.18 (more
variation across the visible canvas, per direct feedback that open water
read as too uniform) -- still well above the coastline's fine texture,
"more varied" wasn't the same ask as "turbulent."

### octaves / lacunarity / gain

Same fbm2D idea as `island`'s own. Raised octaves 2->3 at v3.6.18
alongside `potentialScale`, same "more variation" reasoning -- still
deliberately modest (same 3 as the coastline noise), not "very
turbulent."

### currentGain

v3.6.18. Pure magnitude multiplier on the current's curl vector, applied
AFTER the gradient/rotation (changes overall energy without changing
`potentialScale`/`octaves`' frequency shape). Added because open water
read as barely-moving: raw current magnitude there is tiny
(~0.002-0.004) relative to a coastline's coast-vector-dominated magnitude
(~0.05-0.1), so particles were almost entirely riding `particles.baseSpeed`'s
floor. Empirically checked (throwaway Node script): `16` brings open-water
speed to roughly 50-70px/s (was ~18-20) while a coastline/channel still
comes out faster (70-110px/s, maxSpeed-capped) -- open water clearly
moving without erasing the "faster near an island" contrast.

### driftSpeedX / driftSpeedY

v3.6.18. World px/sec the current's potential sampling position drifts
over real elapsed time (the coast vector never drifts -- islands don't
move). Fixes a reported failure mode: particles trapped, "rotating on
themselves." Root cause is structural: curl noise is divergence-free
everywhere, so it has permanent vortex centres at any local potential
extremum, and a static field's vortices trap a particle in a closed orbit
forever (confirmed directly: sampling the same point 20 simulated seconds
apart in the old, driftless field returned the literal same vector, 0.0
degrees of change). Drifting the sample position means any given vortex
itself drifts and dissolves/reforms elsewhere -- checked at a
deliberately adversarial point (the exact midpoint between two close
circles) that the vector rotates ~20-30 degrees over 20 simulated
seconds, i.e. a trap dissolves within under a minute rather than
persisting indefinitely. `5`/`4` (asymmetric on purpose, not perfectly
axis-aligned/diagonal) are both slow relative to `potentialScale`'s own
~300px wavelength -- a gentle, ambient "breathing," not a visible scroll.

### biasDirX / biasDirY / biasStrength

v3.6.19. A CONSTANT (never time-varying) prevailing-current term -- "the
general current goes somewhere, with local variation on top," not a
directionless eddy field. Direction is northeast in screen space (+x
east, -y north); magnitude picked empirically: `0.05` gave open water a
real, visible net NE lean while still letting local curl variation show
through. Also doubles as the tie-breaker for `coastMix`'s tangent
handedness (below) -- the one direction that's genuinely constant
everywhere, which turned out to matter. v3.6.20 -- `biasStrength` pulled
back `0.05 -> 0.03`: direct feedback that the NE lean read as "migrating"
rather than "wandering," flattening local curl variation at the larger
scale. Only the magnitude changed -- `biasDirX/Y` (the direction itself)
is untouched, and that's the only part `coastMix`'s tie-breaker actually
reads (a dot-product sign, not a magnitude), so the narrow-channel fix
holds at any `biasStrength > 0`, structurally.

### coastMix

Blends the coast vector between pure repulsion (`0`, push straight off
the coast) and pure tangential flow (`1`, slide along the edge) -- both
are rotations of the same heightmap gradient, one continuous dial. Which
of the two possible 90deg rotations counts as "tangential" is chosen
per-point to align with `biasDirX/Y` (v3.6.19) -- at a narrow channel
between two islands, a fixed rotation gives the two facing coastlines
OPPOSING along-channel tangents (confirmed as the direct cause of a
reported bug: particles clumping in narrow bays), and aligning to the
local current instead of the constant bias was tried first and didn't fix
it either (the swirl's own higher octaves vary enough over a channel's
width to still disagree between its two walls). v3.6.20 -- pulled back
`0.65 -> 0.55` (more repulsion, less tangential slide): direct feedback
that particles were "intruding along coastlines in parallel" and skipping
across narrow fingers of land -- riding close enough alongside the edge
that the remaining repulsion share wasn't consistently enough to stand
them off it. Tuned together with the speed pullback in `particles`, not
in isolation -- slower particles also give repulsion more frames to act.

### coastStrength

Multiplier on the coast vector itself (independent of `currentGain`,
which only scales the current). Empirically checked against real
heightmap output: at `3`, the coast vector's magnitude fades from
~0.05-0.1 right at a coastline to ~0 by open water on its own -- clearly
present near an island without a separate falloff-shaping function.

### coastTangentDriftAmpX / coastTangentDriftAmpY / coastTangentDriftFreqX / coastTangentDriftFreqY

v3.6.20. How far (world px) and how fast (rad/sec) the TANGENT half of
the coast vector's own heightmap sample orbits around the particle's true
position (repulsion never moves). Fixes persistent trapping in narrow
pinches/bays: `rot90(gradient)` is divergence-free like curl noise, so a
purely static tangent has its own permanent vortices in tight/concave
geometry -- same mechanism as `driftSpeedX/Y`'s bug, just on the static
half of the field. **BOUNDED (sin/cos), deliberately not a linear
`t*speed` ramp** -- a first attempt used a linear drift and it was a real
bug: `t` only grows for the page's whole lifetime, so the sample position
drifted arbitrarily far given enough time, eventually landing well inside
a landmass and reading a "coastline direction" with nothing to do with
the real local edge (reported directly: particles going over more land
than before, worse the longer the page had been open). Values are small
relative to `heightEps`/typical channel width, and the two axes
deliberately use different frequencies (not a shared period) so the
sample traces an open path, not a fixed loop of its own.

### showPotential / showVectors

Dev-panel-only debug toggles (Visuals section): `showPotential` renders
the base current's scalar potential as a tinted grid ("the noise field"),
`showVectors` renders the full composite field as arrows. Both off by
default -- how the field gets judged/tuned before any particle animation
is built on top of it, not a shipped visual.

---

## particles

Particle advection along `v3Config.flow` -- see `cabinet-v3-particles.js`.
v3.6.17: only ever created/animated by `islands-tool.html`
(`cabinet-v3-controls.js` starts it) -- static pages (`index.html`,
`build-render.html`) never call `startCurrentAnimation()`, so this costs
them nothing, not even the DOM elements (production's own boats/dragons,
`#64`, are a separate, later mechanism -- `cabinet-v3-production-animate.js`).

### count

Pool size, fixed for the page's lifetime (particles reset in place when
recycled, never created/destroyed, avoiding DOM churn). v3.6.22 -- raised
`60 -> 130`, dialled in live via the dev panel's Base count slider once
spawn stagger, the wider spawn arc, and coastal spawn were all in place
to support a denser pool without reading as more synchronised/uniform.

### maxCount

v3.6.21 -- hard ceiling on click-to-launch growth: a click beyond this
total is simply ignored. Not a serious/core feature per direct feedback
-- priority is bounded, predictable cost over any particular click
behaviour. v3.6.22 -- raised `90 -> 150` alongside the base count bump,
dialled in live, no longer simply `count*1.5`.

### spawnStaggerMax

v3.6.22. Max random delay (seconds) before a freshly-batch-spawned
particle starts moving -- `0` disables staggering entirely. Direct
feedback: spawning the whole pool at once made every particle share the
same field-phase, reading as a synchronised wave rather than ambient
traffic. Harmless to raise/lower by feel -- particles are off-canvas and
invisible for the whole delay regardless of length.

### padding

How far outside canvasBounds a particle spawns/despawns, in canvas px.
Independent of `drawIslandsPath()`'s own `edgePadding` (a different
concept sizing the marching-squares sampling grid) -- this is purely
about where "off-canvas" starts for entry/exit staging. Small on purpose
-- just enough that pop-in/pop-out isn't visible at the canvas edge.

### spawnDirX / spawnDirY / spawnArcFraction

v3.6.19. Direct request: "particles need to start from one offscreen area
and spread out" rather than scattering uniformly around all 4 sides.
`spawnDirX/Y` points south-west -- upstream of `flow.biasDirX/Y`
(reversed), so particles enter from where the current is coming FROM and
drift out roughly where it's headed. `spawnArcFraction` is how wide the
entry zone is as a fraction of the whole ring's perimeter --
`pickSpawnPoint()` picks uniformly within it, no extra taper/weighting.
v3.6.22 -- widened `0.35 -> 0.55`: direct feedback that activity was
piling up right at the SW corner, with little reaching the centre/NE and
the SE side reading as quiet -- explicitly not asking for a uniform
spread, just a wider one. At this canvas's proportions, `0.55` covers
roughly the whole bottom edge, the whole left edge, and a bit of the top
edge nearest the NW corner -- the far NE corner and most of the right
edge stay clear, keeping the directional lean.

### coastSpawnFraction

v3.6.22. Fraction of every spawn (initial pool and mid-simulation
respawns alike) that lands at a coastal water point instead of the usual
off-canvas arc point -- direct request/idea: "coast-killed particles, or
any other, can respawn on a coast as well... shore repulsion takes them
out." `0` disables it entirely. Picked via `pickCoastalSpawnPoint()`
(rejection-sampling against `isLand()`, cheap). Deliberate side benefit:
coastal points land wherever islands actually ARE, not funnelled through
the SW arc, helping the central/NE-quiet complaint `spawnArcFraction`
above was already addressing. Raised `0.3 -> 0.5` after live comparison.

### coastSpawnDirMode

v3.6.22. Initial direction for a coastal spawn: `"repulsion"` (the exact
push straight off the shore, ignoring the current/tangent blend for just
that first moment) or anything else (the normal blended-field
`initialDirection()`). Compared live via the dev panel: "repulsion is
marginally better than blended, but not by much" -- kept as default since
it's still the better of the two, not because the gap was decisive.

### personalityMode / personalityOffsetRange / personalitySpeedMultMin / personalitySpeedMultMax / personalityDirRotateMaxDeg

v3.6.23. Demo/comparison build for the "one giant trash drift" discussion
(`conversation-landing-page-v3.md`): every particle otherwise samples the
exact same deterministic field, so density alone can't add variety.
`"off"` (default, no change to shipped behaviour) / `"bias"` (constant
personal speed+heading, see `personalityFor()`) / `"offset"` (constant
personal read-position into the SAME shared current field, never the
coast/repulsion half) / `"both"`. Not decided yet -- built specifically
to be compared live via the dev panel, same as `coastSpawnDirMode`. The
range fields are first-guess demo values, not yet tuned by feel --
`personalityOffsetRange` in world px, well under `potentialScale`'s
~300px wavelength (meant to vary WHICH local structure a particle reads,
not which large-scale pattern it's part of).

### baseSpeed / speedGain / maxSpeed

Speed (px/sec) is direction-independent: a particle always moves exactly
where the flow field points, but how FAST is a clamped function of the
field's raw magnitude, not directly proportional to it. `baseSpeed` is a
floor (never fully still, even where the field briefly near-cancels);
`speedGain` scales magnitude into a visible speed-up; `maxSpeed` caps it
-- direct proportionality would make coastal/channel particles look like
they're darting at jet speed relative to open water. v3.6.18 -- retuned
alongside `flow.currentGain`: `baseSpeed 15->20`, `speedGain 2000->1200`,
`maxSpeed 90->110`. Direct feedback was that open water read as basically
dead and particles could get stuck orbiting in place indefinitely (fixed
structurally by `flow.driftSpeedX/Y`, not by these numbers) -- once
`currentGain` made open water's raw magnitude meaningfully bigger,
`speedGain` was pulled back so the bigger magnitude doesn't overshoot
into coastal-speed territory in open water too. v3.6.20 -- pulled back
again, all three together (`20->13`, `1200->800`, `110->70`): direct
feedback was "particles feel too fast." Open water now ~40-65px/s
(was ~50-70), coastline/channel ~55-70px/s maxSpeed-capped (was ~90-110)
-- roughly a third slower everywhere, coastal-vs-open contrast preserved.
Also directly addresses "skip over/through narrow land": less distance
per frame gives the coast vector more room to actually deflect a
particle before it's already past a thin finger of land.

### stuckCheckInterval / stuckThreshold

v3.6.19. Cheap safety net, not the primary fix: every
`stuckCheckInterval` seconds, a particle whose NET displacement since the
last check is under `stuckThreshold` px gets force-respawned, regardless
of why it stalled. Deliberately just a per-particle position check, not
the density/neighbour-based version of this idea ("close to a bunch of
other particles") -- flagged directly as the expensive one, not needed if
the field-level fixes are doing their job; this exists to catch whatever
residual case they don't. v3.6.20 -- tightened `2.5->1.8s` / `15->12px`: a
faster backstop for whatever `flow.coastTangentDriftAmpX/Y` doesn't
happen to dissolve fast enough on its own. Still safely clear of a
genuinely-moving particle -- even sitting on `baseSpeed`'s 13px/s floor in
a straight line, that's ~23px net over 1.8s, well above the 12px trigger.

### sizeMin / sizeMax

v3.6.20. Size scale range, multiplying the base rx/ry set in
`ensureParticles()` (`cabinet-v3-layout.js`). Rolled once per pool SLOT
when its `<ellipse>` is created, not re-rolled on respawn (a DOM-only
concern -- position/recycling stays entirely in
`cabinet-v3-particles.js`). Direct request: some visual variation instead
of every particle reading as the identical stamped shape.

---

## geo

Lat/long dotted grid + compass diagonals (`drawGeoGrid()` in
`cabinet-v3-layout.js`). v3.7.7. No FIELD NOTES section existed for this
block before this doc -- these entries are new, not migrated from
elsewhere.

### showGrid / showDiagonals

v3.7.8 -- split from a single `enabled` flag into two independent
toggles, direct request: "separate toggles for grid and compass
diagonals." Grid (lat/long lines) and diagonals can be shown/hidden
independently. v3.7.16 -- `showGrid` defaults to `false` ("default -
latlong is off"), still fully live via the dev-panel toggle, just not the
starting state. `showDiagonals` stays `true` by default.

### latSpacing / lonSpacing

Split into two independent axes rather than one shared spacing, direct
request. `120` (not the round `100` it started at, nor `73`, an
intermediate prime-pitch value) is just the current default -- either
axis can be retuned live via the dev panel (Visuals > Latitude spacing /
Longitude spacing) without touching source, using the same cheap
`retraceIslands()` path every other island slider already uses.

---

## themePreview

Parameters of the Theme-preview-on-hover ("theme x hover") mechanism
itself -- the CROSS-theme transition's own overlap/blend/margin
behaviour, deliberately kept separate from either theme's own colour
tokens (this feature reads `themeTokenState` live, doesn't duplicate it).
No FIELD NOTES section existed for this block before this doc.

### previewTheme

Names which `THEME_OPTIONS` key hovering reveals, regardless of whichever
theme is currently the page's base. The direct spec was a fixed
Medieval-resting / Topology-reveal pairing, but making it a real dropdown
(rather than hardcoding `"satellite"` into the render path) cost little.

### islandHaloPx / sectionHaloPx

Direct feedback: `20px` read as too tight to pick up any surrounding sea
around a hovered island; "maybe 40-50px." `45` splits that range for
`islandHaloPx`, both ends still live via the dev panel. `sectionHaloPx`
is independent from `islandHaloPx` -- a section's preview already reuses
`traceIsolatedShape()` the same way the section glow/hit shape does, but
with its OWN halo rather than inheriting the glow's `coastalZoneWidth`
(that value is calibrated for hit-testing/glow, not this feature; sharing
a number would be coincidence, not a real coupling).

### blurPx

Direct feedback: "the edges need to be blurred between the two themes,
not a hard outline." Matches `.v3-island-glow`'s own existing
`blur(6px)`/`.v3-section-glow`'s `blur(14px)` technique -- CSS
`filter:blur()` on a plain unstroked fill, already proven reliable in
this codebase for a single non-grouped path (a bug found earlier in the
project was specific to a GROUP of individually-transformed children, not
this shape).

---

## colors

Every theme's own `COLOR_TOKENS` (`cabinet-v3-controls.js`) -- 9 hex
values per theme (`satellite`/`medieval-map`/`cyanotype`/`medieRiso`).
Until `#32`'s 2026-08-30 colours-migration, these lived only as hardcoded
values in `cabinet-v3-style.css`'s `body.v3-proto[data-theme="X"]`
blocks; applied at load as inline custom properties on `<body>` via
`applyThemeStyle()` (`cabinet-v3-data.js`), which is what actually makes
them visible (inline style outranks the attribute-selector CSS blocks).
Extracted from a live render of each theme (computed-style, resolving any
`var()` chain) rather than hand-transcribed, then verified again after
the migration landed to confirm every theme's 9 tokens still resolve to
the exact pre-migration hex, live in a real browser -- not just "the
numbers matched on paper."

Real bug caught during this migration, worth recording: `COLOR_TOKENS`
actually has 9 entries, not 8 -- `--v3-label-outline` was missed on a
first pass (a truncated terminal search cut it off), which briefly left
`cabinet-v3-style.css`'s `medieval-map` block with `--v3-label-outline:
var(--v3-sea-shallow)` referencing a token that migration had *just*
deleted from that same block -- silently resolving to the wrong (base
fallback) colour instead of medieval-map's own `#ddbd82`. Caught by
re-verifying computed values against the pre-migration originals before
calling the work done, not assumed correct from writing the code once.

Two tokens that look similar but are **not** part of this migration, and
never will be via the swatch editor: `--v3-compass-accent` and
`--v3-compass-white` (the compass rose's own accent/white fills) --
they're not in `COLOR_TOKENS`, so no dev-panel swatch edits them; they
stay exactly where they were, declared per-theme in
`cabinet-v3-style.css`.

### satellite ("Topology")

`#1c5f8a` / `#43d6d6` / `#4caf3f` / `#f2c94c` / `#ffffff` / `#0d2436` /
`#0d2436` / `#faf3dc` / `#f4ead0` (sea-deep/sea-shallow/veg/sand/peak/
ink/ring-ink/halo-ink/label-outline, same order throughout this section).
v3.7.22 -- this theme had no `--v3-ink` of its own before a merge with
the (since-retired) "bathymetric" draft, relying entirely on generic
fallbacks -- which the compass rose would have shown up as: black and
blue reading near-identical, the same latent issue medieval-map had
before its own v3.7.17 fix. Dark blue-black ink (distinct from every
saturated body colour in this palette) plus a warm coral compass accent
(`--v3-compass-accent: #c1440e`, not part of `COLOR_TOKENS`) -- the one
hue family (red/orange) this blue/cyan/green/yellow palette doesn't
already have, same "give the compass a hue nothing else in the theme
uses" logic as medieval-map's own navy accent. `label-outline` was never
overridden for this theme -- falls back to the base
`--cab-land-light` (`#f4ead0`).

### medieval-map

`#f4ebdd` / `#ddbd82` / `#fbf0ee` / `#7d3a24` / `#ffffff` / `#1c1712` /
`#1c1712` / `#faf3dc` / `#ddbd82`. v3.7.14/16 -- direct values ("Deep sea:
#f4ebdd", was `#c9974f`, a darker amber; "#fbf0ee for vegetation", was
`#5c2417`, reddish-brown) -- moving off the original all-close-in-
value parchment palette toward "islands - a darker brown, rich and
intense, with reddish tones / sea - a lighter sepia/brown, amber tones."
`flatColourMode` is on for this theme (`THEME_PRESETS`,
`cabinet-v3-controls.js`), so `--v3-veg` (flat land fill) and
`--v3-sea-deep` (`.v3-stage`'s own background) are what actually render;
`--v3-sand`/`--v3-sea-shallow` (the non-flat band tiers) are tuned as a
lighter step toward the same two hue families so the theme still reads
coherently if flat mode is switched off. v3.7.60 -- `label-outline`'s
value (`#ddbd82`, this theme's own sea-shallow amber) fixes a direct
report that the glow/halo label style "seems to not be working anymore":
the mechanism was never broken, but v3.7.16's veg repaint to `#fbf0ee` (a
pale blush cream) left `label-outline` still defaulting to
`--cab-land-light` (`#f4ead0`) -- two near-identical pale creams, almost
no contrast against this theme's land fill specifically. Reusing the
existing sea-shallow amber (not a new colour) gives real contrast against
both the pale veg/sea fills and the label's own dark ink.

### cyanotype

`#0c3a5a` / `#4d6c7e` / `#b8beb9` / `#8c9ca1` / `#ffffff` / `#003153` /
`#003153` / `#faf3dc` / `#f4ead0`. `v3-scheme-candidates.md` scheme 3b --
every tier is the same pigment (`#003153`, Prussian blue) at reduced
alpha over the paper tone (`#f2ead9`), precomposited by hand into flat
hexes since these tokens feed solid backgrounds, not translucent fills --
a fully-saturated pigment (not just a dark one) is what's needed for the
dilution to hold its hue instead of drifting grey. `label-outline` was
never overridden for this theme either -- same base fallback as
satellite.

### medieRiso

`#14588a` / `#7ec8e3` / `#4f7942` / `#f0dfa8` / `#ffffff` / `#16324a` /
`#f21d92` / `#1bf2b5` / `#e031eb`. v3.7.22 -- the first 5 (sea-deep/-
shallow/veg/sand/ink) replaced wholesale with "bathymetric"'s exact
values when that draft theme was retired/merged into satellite/Topology,
direct request ("copy bathymetric colours into medieriso") rather than
letting its palette disappear outright. The riso-neon accent layer
(ring-ink/halo-ink/label-outline) is a separate, unchanged design on top
of that base -- "electric highlights over a dark, cool base":
`ring-ink` (wave rings and band-boundary strokes) is neon teal/mint, the
single dominant "electric contour" accent, highest contrast against the
dark base; `halo-ink` (hover halos, a section label's solid hover colour)
is neon magenta; `label-outline` (an island label's ambient outline AND
what it inverts to on hover) is neon purple, deliberately distinct from
`halo-ink` so ambient label styling and active hover read as different
accents. Boat/dragon fills (JS-side, `cabinet-v3-layout.js`) draw from
this theme's own hue pool (blue/teal/orange) when active, independent of
these CSS tokens entirely.

---

## fonts

Per-theme `heading`/`sectionLabel`/`islandLabel` font choices. Brand new
as of `#32`'s 2026-08-30 migration -- previously these were hardcoded
per-theme CSS rules (`[data-theme="X"] .v3-header h1 { font-family:
"Cinzel", ... }` etc.), with **no live dev-panel control at all**, unlike
every other section in this doc. `""` always means "no override -- use
the site default" (`var(--cab-font-heading)`/`var(--cab-font-body)`,
Georgia/serif), which is why `satellite` (Topology) -- which never had a
font override -- is simply all-`""`.

Only 6 real font choices exist: Cinzel, IM Fell English, EB Garamond,
Cormorant, Caveat, Space Mono -- all genuinely loaded (confirmed via
`islands-tool.html`'s own Google Fonts `<link>` tag), each used by at
least one theme below. Worth noting since it corrected an earlier,
wrong assumption made mid-investigation: production's
`index.template.html` only links 3 of these (Cinzel/IM Fell English/EB
Garamond, matching production's single medieval-map theme) -- checking
only that file undercounts what's actually available in the dev tool,
where the font picker actually lives. `islands-tool.html`'s link tag
additionally loads Fraunces/Space Grotesk/Archivo Black, leftover from
the since-merged "bathymetric" draft theme and referenced by no current
CSS rule at all -- harmless dead weight, not fixed as part of this
migration, same category as ToDo `#24`'s unreferenced `icon-scroll`
sprite.

Deliberately does **not** cover letter-spacing/font-weight flourishes
(medieval-map/medieRiso's `0.04em` heading letter-spacing, cyanotype's
`600` heading font-weight) -- those stay theme-scoped in CSS exactly as
before. Known gap: picking e.g. Cinzel as a *different* theme's heading
font via the dev panel won't also pick up medieval-map's letter-spacing
bonus.

### satellite fonts

All three roles `""` (default/base font) -- this theme never had a font
override to begin with, even before the migration.

### medieval-map fonts

`heading: "Cinzel"`, `sectionLabel: "IM Fell English"`,
`islandLabel: "EB Garamond"` -- the original three-tier type pairing:
Cinzel for the title, IM Fell English (not its small-caps cut -- small-
caps is a separate, site-wide `.v3-section-label` rule, not specific to
this theme's font choice) for section labels, EB Garamond for the small,
dense island labels.

### cyanotype fonts

`heading: "Cormorant"`, `sectionLabel: "Caveat"`, `islandLabel: ""` --
island labels deliberately stay on the shared body font rather than also
getting Caveat: handwriting faces degrade below ~14px, and island labels
render at 13px, so only the larger, sparser section labels get the
script face.

### medieRiso fonts

`heading: "Cinzel"` (shared with medieval-map -- both reach for the same
engraved-title register), `sectionLabel: "Space Mono"`,
`islandLabel: "Space Mono"` (one rule covers both in the original CSS --
the riso aesthetic wants its labels reading as machine-set/mono
throughout, not split by role the way medieval-map's three-tier pairing
is).
