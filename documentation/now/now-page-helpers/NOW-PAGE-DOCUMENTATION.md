# Cabinet `/now` Page

## Purpose

`/now` is a periodically updated snapshot of what is currently occupying attention: reading, watching, music, projects, teaching, travel, curiosities, experiments, and recent discoveries.

It is not intended to be a CV, activity feed, project manager, or exhaustive archive. It should feel personal, curated, and easy to scan while still retaining a lightweight history beneath the surface.

The core visual idea is:

> The present is crisp; the recent past visibly recedes.

Each section shows only a limited number of recent entries. Older entries remain in the source data but are not rendered on the main page.

---

## Core Sections

Initial sections:

- Reading recently
- Watching
- Music on my mind
- Current projects
- Currently teaching
- Recent travels
- Current curiosities
- Making & experimenting
- Recently found

Section headings can change in display text without changing their stable `section` key in the data.

---

## Data Model

The source of truth is a human-readable TSV file:

```text
data/now.tsv
```

The TSV uses a deliberately small long-list structure:

```text
date	section	value	image	notes
```

### Fields

#### `date`

ISO date in `YYYY-MM-DD` format.

The renderer uses date first, then TSV row order as the tie-breaker when multiple entries share the same date.

#### `section`

Stable machine-friendly section key.

Suggested keys:

```text
reading
watching
music
projects
teaching
travel
curiosities
making
found
```

#### `value`

The publicly displayed content.

The field should support lightweight Markdown so entries can contain:

- links
- emphasis
- short prose
- reactions
- project references
- Goodreads links
- small line breaks where needed

Example:

```text
[The Name of the Wind](GOODREADS_URL) — Patrick Rothfuss — reaction here
```

#### `image`

Optional repo-relative image path.

Examples:

```text
assets/now/travel/vizchitra-01.jpg
assets/now/making/clamp-collar.jpg
```

A blank value means no image.

Keep this as a singular image field for now. Do not introduce galleries or image arrays until there is a real need.

#### `notes`

Private editorial field that is never rendered on the public page.

Useful examples:

```text
DIF
add reaction
needs photo
expand later
check title
link when project page goes live
```

---

## TSV → JSON Workflow

The TSV is the human-authored source of truth.

A build script converts it to generated JSON:

```text
data/now.tsv
      ↓
tools/build-now.py
      ↓
data/now.json
```

The website reads only `now.json`.

The generated JSON can remain simple and flat:

```json
[
  {
    "date": "2026-08-28",
    "section": "reading",
    "value": "...",
    "image": "",
    "notes": ""
  }
]
```

The converter should preserve row order for same-date entries.

The public renderer must ignore `notes` even if they remain present in the generated JSON.

---

## Updating

Preferred workflow:

1. Open `data/now.tsv`.
2. Add a new row rather than replacing old content whenever possible.
3. Use a local update command or editor button.
4. Regenerate `data/now.json`.
5. Preview the `/now` page.
6. Commit TSV, JSON, code, and any added images together.

A local editor may later expose a button such as:

```text
Save / Update Now
```

That action may:

1. write/update the TSV,
2. regenerate the JSON,
3. optionally refresh or open the local preview.

The public GitHub Pages site should not attempt to write back to the repository.

---

## Display Modes

The schema intentionally does not distinguish between streams, prose, statuses, or lists.

Everything is simply:

```text
date + section + value
```

The distinction exists only in the renderer configuration.

### Stream sections

Useful for:

- reading
- watching
- music
- recently found
- travel
- making / experiments

Recommended rule:

```text
entries 1–2   → current emphasis
entries 3–4   → recent emphasis
entries 5–6   → older emphasis
entries 7+    → hidden
```

Visually this approximates:

```text
100%
100%
50%
50%
25%
25%
```

### Snapshot / prose sections

Useful for:

- projects
- teaching
- curiosities

Recommended rule:

```text
entry 1   → current emphasis
entry 2   → recent emphasis
entry 3   → older emphasis
entry 4+  → hidden
```

Visually:

```text
100%
50%
25%
```

A single TSV structure supports both behaviours.

---

## Important Visual Rule

Do not encode literal `opacity: 1 / .5 / .25` in the content data.

Use semantic CSS classes such as:

```text
.now-current
.now-recent
.now-old
```

The actual colors should be tuned for legibility in Cabinet's light and dark themes.

The goal is the visual impression of 100 / 50 / 25, not necessarily literal CSS opacity.

This avoids unreadable text on different backgrounds and gives better accessibility control.

---

## Section Configuration

Keep page behaviour separate from the TSV.

For example in `now.js`:

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

  projects: {
    title: "Current projects",
    mode: "snapshot",
    visible: 3,
    groupSize: 1
  }
};
```

The TSV should not contain `visible`, `groupSize`, opacity, display order, or styling metadata.

---

## Sorting and Grouping

For each section:

1. select all rows with the matching `section`,
2. sort by `date` descending,
3. preserve original TSV row order where dates are identical,
4. take only the number defined by that section's display config,
5. assign visual emphasis based on position.

Example for a stream section:

```text
index 0–1 → now-current
index 2–3 → now-recent
index 4–5 → now-old
```

Example for a snapshot section:

```text
index 0 → now-current
index 1 → now-recent
index 2 → now-old
```

---

## Images

Images are optional and should support the content rather than dominate the page.

Likely uses include:

- travel photographs
- conference / exhibition photographs
- 3D-printed repairs and adapters
- fabrication experiments
- selected project images

The renderer should handle entries with no image cleanly.

Do not require placeholder images.

---

## Initial Content Notes

Current known content includes:

### Reading recently

- *Once & Future*, Vol. 1–4 — Kieron Gillen
- *The Name of the Wind* — Patrick Rothfuss
- *Strange Houses* — Uketsu
- *The Draco Tavern* — Larry Niven
- *Grotto of the Dancing Deer and Other Stories* — Clifford D. Simak
- *Airplane Mode* — Shahnaz Habib
- *Shattered Lands* — Sam Dalrymple

Book titles should link to their Goodreads pages.

Reactions will be written directly into the TSV later.

### Watching

- *Spider-Man: Brand New Day*
- Christopher Nolan's *The Odyssey*
- *The Expanse* — currently around Season 3

Reactions will be added directly into the TSV.

### Music on my mind

- "Dhindhora Baje" — *Rocky Aur Rani Kii Prem Kahaani*
- "Morni" — Silk Route
- "Running Through My Head" — t.A.T.u. version
- "Running Through My Head" — Harrison version

### Current projects / meta-projects

- Cabinet essential pages and collections
- Emergent Technologies student work collection
- Working with AI
- Coding with AI
- Warli Art explorer / annotation system
- Origami work beginning to coalesce
- task manager built around personal workflow
- Projects & Ideas manager
- Timeline of the Sci-Fi Golden Age data visualization
- WIP Isaac Asimov data visualization
- WIP Hamzanama data visualization

### Currently teaching

- wrapping up Emergent Technologies
- Material Explorations 1: Paper with FY
- later in semester: Lighting Design with TY Tangible Products
- later in semester: Reimagination & Modelmaking Design Challenge with FY
- no scheduled SY teaching this semester apart from corridor encounters
- Sci-Fi workshop with Kurush Dalal

Do not expose private/internal teaching strategies. Publicly show only appropriate descriptions and interesting outcomes.

### Recent travel

- Bangalore — VizChitra conference
- Landour — quiet time / decompression

Both can support longer prose and photographs.

### Current curiosities

- HTTPoetics as practice and area of interest
- SFPC's HTTPoetics course
- authorship and process in web work where intent and logic are human-directed but implementation is developed in AI collaboration
- specifically: not hand-coded, but also not usefully described as "vibe coded"

### Making & experimenting

- scripts that process the SSD timetable into faculty workload reports, module hours, calendars, and `.ics` files
- personal spending analysis scripts
- 3D-printed replacement collar for a broken clamp stand
- 3D-printed adapter that turns IKEA Skådis hooks into plier hangers

The final two should use photographs.

### Recently found

Initial entries include:

- Room 767
- neal.fun
- *Ascension* at Afghan Church projection-mapping experience
- VizChitra
- papers on neuroplasticity and AI use
- polymath-related Reddit posts

This section will grow over time.

---

## Design Character

The page should combine:

- a personal notebook quality,
- curated selection,
- clear scanability,
- a subtle Cabinet-like sense of accumulated curiosities.

It should not become a dashboard-heavy interface.

A date such as:

```text
Last updated: August 2026
```

should appear near the top.

The fading history should carry more of the temporal meaning than explicit archive controls.

---

## Archival Behaviour

The main `/now` page only shows the latest visible entries according to section rules.

Older rows remain in `now.tsv` and `now.json`.

This means the data is effectively append-only and can later support:

- a `/now/archive/` page,
- month/year snapshots,
- section-specific histories,
- visual timelines,
- older-now browsing.

Do not build those features yet.

---

## Non-Goals

Do not add, unless a future need appears:

- universal content schemas
- project status enums
- automatic Atlas integration
- public write-back/editing
- CMS infrastructure
- multiple image arrays
- database storage
- separate content types for prose vs lists vs streams
- per-row display styling
- stored opacity values

Keep `/now` intentionally small.

---

## Core Design Decision

> `/now` is an append-oriented chronological TSV. Each row records a piece of content within a section at a particular date. The renderer groups rows by section, sorts by recency, and shows only the latest entries using current / recent / older visual emphasis. The TSV remains human-readable; JSON is generated for the website.
