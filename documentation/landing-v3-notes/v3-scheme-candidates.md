# Landing v3 — colour & font scheme candidates

Five competing directions for the "real pass on fonts, colours, sizes" item
(see `landing-page-v3-notes.2.0.md` #10, held open since v3.6.5's first-guess
palette). Each is a self-contained token set — not meant to share DNA with
the others, since the point of this round is to pick one, not blend them.
Old `--cab-*` / `--v3-*` tokens do not constrain this pass; this version is
on track to overwrite the old pages.

Meant to be wired into a dropdown/toggle so all four can be flipped between
live on the same map geometry (islands, wave rings or colour bands, layout)
for a side-by-side compare. Nothing here touches layout — only fill colours,
ink/line colours, and type.

---

## 1. Wave contour — medieval exploration map

Reference: Tolkien-style maps, plain engraved-map linework (the same
reference set the v2 map's Round 1 pass already used — Earthsea/Gont,
Viking trade-route maps, fantasticmaps.com coastline ripples).

**Principle:** land and sea should read almost entirely through ink
contour lines, not colour contrast. Keep the fill-colour gap between sea
and land narrow — the ripple rings are what should carry the shape.

| Token | Value | Role |
|---|---|---|
| `--wc-parchment` | `#e8dcc0` | page / land base |
| `--wc-parchment-wash` | `#cfc7ab` | sea — deliberately close in value to land |
| `--wc-ink` | `#1c1712` | primary contour/outline ink |
| `--wc-ink-sepia` | `#6b4a2c` | faded/older contour rings, hachure |
| `--wc-rubric` | `#8b3a2e` | cartographer's red — route lines, key labels only, used sparingly (like rubricated text in old maps) |
| `--wc-gold` (optional, very sparing) | `#b08d3e` | compass rose, cartouche flourish only |

**Type**
- Heading / cartouche title: **Cinzel** — inscriptional roman capitals, reads as engraved stone/map-title lettering.
- Section labels: **IM Fell English**, italic — old-style, slightly irregular, but a real legible text face (not a fantasy script that breaks at small sizes). This is the "script-ish but cleanly legible" register.
- Island / entry labels (small, dense): plain workhorse serif — **EB Garamond** or existing Georgia fallback. Display faces get mushy under ~14px in SVG; save character for the few large words.

Two families total: one display (Cinzel), one workhorse (EB Garamond/Georgia).

---

## 2. Topology — satellite / bathymetric, brighter

Reference: satellite elevation imagery, bathymetric charts, GIS/data-vis
maps — happier and more saturated than scheme 1.

**Principle:** shape reads through colour bands (deep→shallow→sand→veg),
not ink contour. Ink stays cool/dark-navy rather than black, staying in
family with the water hues.

| Token | Value | Role |
|---|---|---|
| `--topo-sea-deep` | `#14588a` | deep water band |
| `--topo-sea-shallow` | `#7ec8e3` | shallow water band |
| `--topo-sand` | `#f0dfa8` | beach band |
| `--topo-veg-low` | `#8fbc5a` | scrub/grassland band |
| `--topo-veg-forest` | `#4f7942` | forest/high band |
| `--topo-ink` | `#16324a` | labels, outlines |

**Type**
- Heading: **Fraunces**, semibold — warm, slightly quirky serif; keeps editorial personality against the saturated bands so it doesn't read as a sterile GIS dashboard.
- Section / island labels: **Space Grotesk** — geometric grotesk, reads as data-vis/map-UI, clean at small sizes, pairs well with saturated fills.

---

## 3. Surreal / weird — print-process reskins

Keeps the fact that it's a map, but the palette comes from a print
process or art reference rather than naturalistic colour. Three
sub-directions explored; **3a and 3b are the real candidates**, 3c is
noted as an aspirational reference rather than a full scheme (see below).

### 3a — Riso reskin

Keeps Topology's *band structure* (deep→shallow→sand→veg still legible
as elevation) but remaps each band to a limited risograph spot-colour
set instead of naturalistic hues — map stays legible as a map, palette
feels printed.

| Token | Value | Role |
|---|---|---|
| `--riso-blue` | `#0078bf` | deep water |
| `--riso-mint` | `#46bdb1` | shallow water |
| `--riso-yellow` | `#ffe800` | sand/beach |
| `--riso-pink` | `#ff48b0` | vegetation — deliberately non-naturalistic |
| `--riso-black` | `#131313` | ink; offset 2–3px from its own fill to fake print mis-registration |

Texture: coarse dot/halftone SVG pattern at low opacity over each band.

**Type:** **Archivo Black** for the title (flat, poster-bold, zine-cover). **Space Mono** for labels (typewriter/zine mono, keeps it feeling printed not digital).

### 3b — Cyanotype

Monochrome instead of multi-colour — elevation reads through *value*
(deep = dark, high land = near-white bleach-out), closer in spirit to
Wave Contour's ink-only logic but rendered as a print/exposure process.

**Revision history worth keeping** (this took several iterations to land):
- First pass (`#0c2340` at falling opacity) read as a flat *tint* — like
  white mixed into the paint — not a translucent wash. Fix: stop baking
  "lighter" values as separate mixed hexes; derive every lighter step
  from **alpha of one pigment over the paper**, so paper grain/warmth
  shows through unevenly like a real dilution.
- That pigment (`#0c2340`) then greyed out at low alpha — because it was
  dark **and** low-saturation (~68%), so dilution had almost no chroma
  left to carry. Swapping to a brighter, more saturated blue fixed the
  grey-out but skewed too cyan/cobalt (`#1560bd`).
- Final pigment: **`#003153`**, classic Prussian blue — just as dark as
  the first attempt, but **fully saturated (100% S)**. Saturation, not
  darkness, is what survives dilution — this holds its blue hue all the
  way down to a faint 12% wash instead of drifting grey.

| Token | Value | Role |
|---|---|---|
| `--cyan-paper` | `#f2ead9` | exposed paper / palest tier |
| `--cyan-pigment` | `#003153` | the only pigment — every other value is this at reduced alpha over `--cyan-paper` |
| alpha scale | 95% / 68% / 42% / 24% / 12% | deep water → high land |

Technique notes:
- Deepest/near-black tier: composite the pigment over itself twice (two overlapping alpha shapes) rather than reaching for a separate darker hex — closer to how repeated exposure/overlap actually darkens a cyanotype.
- Soft-edge the wash shapes (1–2px blur) before compositing — real exposure doesn't have vector-crisp boundaries.
- Reuse the existing `feTurbulence` paper-grain filter (already used for the parchment page background elsewhere in this repo) recoloured toward the pigment at low opacity, for granulation, instead of building a new texture system.

**Type:** **Cormorant**, semibold, reversed (light text on dark pigment) for the title — echoes exposed-white-on-blue cyanotype lettering. **Caveat** (controlled, legible handwriting, not fussy script) for secondary/annotation-style labels. Keep dense small labels in a plain serif/sans — handwriting faces degrade fast below ~14px.

### 3c — Van Gogh (reference only, not a full token set)

Chrome yellow / cobalt blue / ochre, visible gestural stroke direction.
Flagged as a texture/brushwork input to layer into 3a or 3b rather than
a fourth standalone scheme — convincing painterly stroke texture in flat
SVG/CSS needs either a raster asset or heavy filter work, and fights
label legibility harder than halftone (3a) or wash grain (3b) do. If
pursued: take 3a's palette, swap flat fills for a subtle multiply-blended
stroke-direction pattern, stop there rather than simulating impasto.

---

## 4. Neon Memphis-Milano — balanced warm/cool pastels + electric accents

Reference: 80s Memphis-Milano postmodern graphic design, vaporwave.
Two-tier palette: a quiet pastel base doing most of the surface area,
electric neon reserved for accents/interaction so it reads as a jolt
rather than fill noise.

**Pastel base — balanced warm/cool (revised; first pass was all-warm):**

| Token | Value | Warmth |
|---|---|---|
| `--pastel-peach` | `#ffd9b3` | warm |
| `--pastel-butter` | `#fff3b0` | warm |
| `--pastel-coral` | `#f5c2a8` | warm |
| `--pastel-mint` | `#c9f2e0` | cool |
| `--pastel-sky` | `#c8e8f5` | cool |
| `--pastel-lavender` | `#e0d4f5` | cool |

**Electric neon accents (route lines, hover states, wave rings, active
labels — accent only, never a fill):**

| Token | Value |
|---|---|
| `--neon-lime` | `#d4ff00` |
| `--neon-orange` | `#ff5400` |
| `--neon-violet` | `#7c3aed` |
| `--neon-cyan` | `#00e5ff` |

No hot pink/magenta in the set (explicitly dropped) — violet and cyan
cover the cool end, orange and lime cover the warm/acid end, so full
spectrum "pop" is still available without that specific hue.

**Type:** **Poppins**, bold, for the title. **Space Mono** for labels —
deadpan/mono keeps it from tipping fully into kids'-app territory.

**Open implementation note:** pastel land/sea sit close in value to each
other (deliberately, Memphis-flat), so ink/outline weight needs to do
more work than in scheme 1 or 2 — a heavier or near-black (non-neon)
stroke around island shapes to keep them from dissolving into the
pastel backdrop, with neons reserved purely for interactive/accent
elements, not island fills.

---

## 5. Ukiyo-e woodblock

Reference: Japanese woodblock printing (Hokusai/Hiroshige register) —
came up as an alternative palette source alongside Neon Memphis-Milano,
shortlisted over holographic/foil and aurora ideas (see note below).
Stays in the same "print effect" family as scheme 3 but warmer and more
painterly than either riso or cyanotype; wave-ring contours would read
naturally as woodblock linework here.

| Token | Value | Role |
|---|---|---|
| `--ukiyo-paper` | `#f0e6d2` | cream paper base |
| `--ukiyo-indigo` | `#1e4d6b` | Prussian indigo — water, deep shadow |
| `--ukiyo-vermillion` | `#c1440e` | accent — seals, key details, route lines |
| `--ukiyo-ochre` | `#e8a33d` | secondary land/accent tone |
| `--ukiyo-sumi` | `#2b2620` | sumi ink — outlines, labels |

**Type:** **Shippori Mincho** for the heading — a Japanese mincho-style serif, directly evokes the woodblock-print reference. **Zen Old Mincho** for section/island labels, same family register at a lighter touch so dense label clusters don't fight the display face. If the literal Japanese-type quote feels too on-the-nose, a plain humanist serif (e.g. existing Georgia fallback) keeps the palette reference without the typographic one.

**Note on reference ideas not carried forward as full schemes:**
- **Holographic/iridescent foil** (shifting duotone gradients, violet→cyan→pink) — flagged as the hardest to keep legible; gradients read as noisy/dated fast and fight the flat-fill system everything else here uses. Not developed further.
- **Aurora/opalescent night sky** (indigo-black base, glowing green/violet/teal bands) — structurally close to Topology (scheme 2) but recast as night rather than daylight; moodier, less "funky." Not developed further, but worth revisiting if Topology needs a night-mode variant later.

---

## Comparison summary

| Scheme | Base register | Shape reads via | Fonts |
|---|---|---|---|
| 1. Wave contour | muted parchment/ink | ink contour lines | Cinzel + IM Fell English |
| 2. Topology | saturated satellite bands | colour bands | Fraunces + Space Grotesk |
| 3a. Riso reskin | flat print spot-colours | colour bands + halftone texture | Archivo Black + Space Mono |
| 3b. Cyanotype | monochrome wash | value/alpha of one pigment | Cormorant + Caveat |
| 4. Neon Memphis | pastel base + neon accent | outline weight (pastels are flat) | Poppins + Space Mono |
| 5. Ukiyo-e woodblock | warm cream + indigo/vermillion | colour bands + ink outline | Shippori Mincho + Zen Old Mincho |
