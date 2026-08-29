# Prompt — Build Cabinet `/now` Page

You are working inside the Cabinet of Curiosities repository.

Before changing code, inspect the current repo structure, existing site architecture, theme variables, MkDocs/custom-page arrangement, CSS conventions, JavaScript conventions, and documentation. Reuse existing patterns rather than introducing a parallel architecture unnecessarily.

Relevant related repos / systems may include:

- CabinetOfCuriosities
- TheBookshelfOfCuriosities
- form-follows-fx
- theAtlas

Do not assume Atlas integration is required. It is explicitly out of scope for this first version.

Read the accompanying `/now` documentation before implementation.

---

## Goal

Create a public `/now` page for Cabinet that acts as a periodically updated snapshot of:

- reading recently
- watching
- music on my mind
- current projects
- currently teaching
- recent travels
- current curiosities
- making & experimenting
- recently found

The page should feel personal, curated, and easy to scan rather than like a dashboard, CV, or activity feed.

The key visual idea is:

> The present is crisp; the recent past visibly recedes.

---

## Data Architecture

Use a TSV-first workflow.

Create:

```text
data/now.tsv
data/now.json
tools/build-now.py
```

The TSV is the human-authored source of truth.

Use exactly these columns unless the existing repo architecture strongly requires a small adjustment:

```text
date	section	value	image	notes
```

### Field rules

`date`
- ISO `YYYY-MM-DD`
- used for chronological sorting

`section`
- stable machine-readable key
- expected keys:
  - reading
  - watching
  - music
  - projects
  - teaching
  - travel
  - curiosities
  - making
  - found

`value`
- public content
- support lightweight Markdown
- must support links and short prose

`image`
- optional repo-relative image path
- blank is valid

`notes`
- private editorial notes
- must never render publicly

The build script must convert TSV to JSON while preserving row order for same-date entries.

The site should consume `now.json`, not parse TSV in the browser.

---

## Renderer

Create or adapt the appropriate JS/CSS files in the repo's existing structure.

A likely minimal setup is:

```text
js/now.js
css/now.css
```

but follow existing Cabinet conventions if equivalent locations already exist.

The renderer should:

1. load `now.json`,
2. group entries by section,
3. sort each section by date descending,
4. preserve TSV row order when dates are identical,
5. apply section-specific visible counts,
6. assign semantic emphasis classes,
7. render optional images when present,
8. render Markdown safely,
9. ignore `notes` completely.

---

## Display Configuration

Keep display rules in the renderer/config, not in the TSV.

Use a simple section config object.

Recommended defaults:

```js
const sectionConfig = {
  reading: {
    title: "Reading recently",
    mode: "stream",
    visible: 6,
    groupSize: 2
  },

  watching: {
    title: "Watching",
    mode: "stream",
    visible: 6,
    groupSize: 2
  },

  music: {
    title: "Music on my mind",
    mode: "stream",
    visible: 6,
    groupSize: 2
  },

  found: {
    title: "Recently found",
    mode: "stream",
    visible: 6,
    groupSize: 2
  },

  travel: {
    title: "Recent travels",
    mode: "stream",
    visible: 6,
    groupSize: 2
  },

  making: {
    title: "Making & experimenting",
    mode: "stream",
    visible: 6,
    groupSize: 2
  },

  projects: {
    title: "Current projects",
    mode: "snapshot",
    visible: 3,
    groupSize: 1
  },

  teaching: {
    title: "Currently teaching",
    mode: "snapshot",
    visible: 3,
    groupSize: 1
  },

  curiosities: {
    title: "Current curiosities",
    mode: "snapshot",
    visible: 3,
    groupSize: 1
  }
};
```

The schema itself should remain unaware of `mode`, `visible`, `groupSize`, opacity, or presentation details.

---

## Fading Behaviour

### Stream sections

Show up to six entries:

```text
entries 1–2 → current
entries 3–4 → recent
entries 5–6 → old
entries 7+  → hidden
```

### Snapshot / prose sections

Show up to three entries:

```text
entry 1 → current
entry 2 → recent
entry 3 → old
entry 4+ → hidden
```

Use semantic classes such as:

```text
.now-current
.now-recent
.now-old
```

Do not encode literal opacity values in the TSV or JSON.

Do not necessarily use literal CSS `opacity: 1 / .5 / .25` either. Tune theme-aware text colors to create approximately the same visual hierarchy while preserving legibility and accessibility in both light and dark themes.

---

## Page Layout

Create the page at the location appropriate to the current Cabinet architecture so that it is available at:

```text
/now/
```

The page should include near the top:

```text
Now
A periodically updated snapshot of what I'm reading, watching, making, teaching and thinking about.

Last updated: <derived from newest TSV date>
```

Do not hard-code the last-updated date if it can be derived from the data.

Keep the layout editorial and spacious.

Avoid:

- dense dashboard cards everywhere
- excessive metadata badges
- visible status labels unless genuinely useful
- timeline widgets
- archive controls in v1

Allow sections with images to use them gracefully without requiring images for every entry.

---

## Initial Data

Seed `now.tsv` with the following current content where appropriate.

Do not invent reactions or descriptive copy where marked DIF / later. Leave notes in the private `notes` field instead.

### Reading

Add individual stream entries for:

- Once & Future, Vol. 1–4 — Kieron Gillen
- The Name of the Wind — Patrick Rothfuss
- Strange Houses — Uketsu
- The Draco Tavern — Larry Niven
- Grotto of the Dancing Deer and Other Stories — Clifford D. Simak
- Airplane Mode — Shahnaz Habib
- Shattered Lands — Sam Dalrymple

Book titles should link to their Goodreads pages.

If Goodreads URLs are not already known, either:

- leave a clear placeholder that is easy to replace, or
- if internet access is available in the coding environment, verify the correct Goodreads page before inserting.

Do not fabricate links.

For reactions, put an editorial note such as:

```text
DIF: add one-line reaction
```

in `notes`.

### Watching

Individual stream entries:

- Spider-Man: Brand New Day
- Christopher Nolan's The Odyssey
- The Expanse — currently around Season 3

Put reactions in `notes` as DIF rather than inventing them.

### Music

Individual stream entries:

- Dhindhora Baje — Rocky Aur Rani Kii Prem Kahaani
- Morni — Silk Route
- Running Through My Head — t.A.T.u. version
- Running Through My Head — Harrison version

### Projects

Use one or more snapshot-style entries containing appropriate grouped prose/list content about:

- getting Cabinet properly off the ground
- Cabinet essential pages
- Emergent Technologies student-work collection
- Working with AI
- Coding with AI
- Warli Art project / explorer
- origami work beginning to coalesce
- task manager built around personal workflow
- Projects & Ideas manager
- Timeline of the Sci-Fi Golden Age data visualization
- WIP Isaac Asimov data visualization
- WIP Hamzanama data visualization

Do not add project status enums.

### Teaching

Snapshot-style content:

- wrapping up Emergent Technologies
- the course was substantially rewritten this year
- Material Explorations 1: Paper with FY
- later in semester: Lighting Design with TY Tangible Products
- later in semester: Reimagination & Modelmaking Design Challenge with FY
- no scheduled SY teaching this semester apart from corridor encounters
- Sci-Fi workshop with Kurush Dalal

Do not expose private teaching strategies.

Where more prose is needed, mark it in `notes` as DIF rather than inventing detailed course claims.

### Travel

Individual entries:

- Bangalore — VizChitra conference
- Landour — quiet time / decompression

Both need longer writeups later.

Use notes such as:

```text
DIF: expand writeup
DIF: add photo
```

### Curiosities

Snapshot-style prose around:

- HTTPoetics as an area of practice and interest
- SFPC's HTTPoetics course
- the line between hand-coded pages and AI-collaboratively implemented pages where the intent, structure, and logic remain human-directed
- explicitly: not hand-coded, but also not usefully described as vibe coded

### Making & experimenting

Individual entries:

- SSD timetable scripts that generate faculty workload reports, module hours, calendars, and `.ics` files
- personal spending analysis scripts
- 3D-printed replacement collar for a broken clamp stand
- 3D-printed part that turns IKEA Skådis hooks into plier hangers

The two 3D-printed entries should support images and should carry `DIF: add photo` notes if photos are not yet available.

### Recently found

Seed with individual entries for:

- Room 767
- neal.fun
- Ascension at Afghan Church — projection-mapping experience
- VizChitra
- papers on neuroplasticity and AI use
- polymath-related Reddit posts

Do not invent specific URLs or paper titles unless verified.

---

## Build Script Requirements

Create `tools/build-now.py`.

It should:

- read UTF-8 TSV
- validate required columns
- validate parseable ISO dates
- allow blank `image`
- allow blank `notes`
- preserve same-date row order
- write formatted UTF-8 JSON
- fail clearly on malformed rows
- avoid unnecessary dependencies if Python stdlib is sufficient

A simple command should work from repo root:

```bash
python tools/build-now.py
```

If the repo uses a different Python invocation convention, document it.

---

## Developer Ergonomics

If an existing local editor/admin utility exists and can be extended cleanly, add a button/action equivalent to:

```text
Save / Update Now
```

It should regenerate the JSON after the TSV is written.

Do not build a new heavy CMS just for `/now`.

If no suitable editor exists, the command-line build script is sufficient for v1.

---

## Documentation

Add/update documentation explaining:

- purpose of `/now`
- TSV source-of-truth model
- TSV field definitions
- TSV → JSON generation
- stream vs snapshot display rules
- fade hierarchy
- image handling
- non-rendered notes field
- update workflow
- archival behaviour
- non-goals

Preserve the design decision that old rows remain in data while only recent rows are shown publicly.

---

## Constraints / Non-Goals

Do not build:

- Atlas integration
- project status syncing
- database storage
- a universal schema
- separate content types for prose/list/status/stream
- public editing
- GitHub write-back from the live page
- gallery arrays
- archive UI
- literal opacity metadata
- per-entry presentation metadata

Keep the architecture small and understandable.

---

## Final Checks

Before finishing:

1. run the TSV → JSON build,
2. confirm JSON is valid,
3. confirm all sections render,
4. confirm stream sections show max 6 entries with 2/2/2 emphasis,
5. confirm snapshot sections show max 3 entries with 1/1/1 emphasis,
6. confirm old data remains in JSON but is hidden,
7. confirm `notes` never appear publicly,
8. confirm entries with blank images render cleanly,
9. confirm image entries render responsively,
10. confirm Markdown links work,
11. confirm light/dark theme legibility,
12. confirm `/now/` works in the local build and deployed-path structure,
13. update documentation with any actual repo-specific deviations from this prompt.

Do not silently change the data model. If the current repo architecture forces a meaningful deviation, document the reason and keep the TSV-first, append-oriented design intact.
