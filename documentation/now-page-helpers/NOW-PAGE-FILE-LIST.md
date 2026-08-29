# `/now` Page — File List

Recommended minimal structure for the Cabinet repo.

```text
CabinetOfCuriosities/
├─ docs/
│  └─ now/
│     └─ index.md                 # Public /now page shell or MkDocs page
│
├─ data/
│  ├─ now.tsv                    # Human-authored source of truth
│  └─ now.json                   # Generated machine-readable data
│
├─ assets/
│  └─ now/
│     ├─ books/                  # Optional book/media images if ever needed
│     ├─ travel/                 # Travel photos
│     ├─ making/                 # Fabrication / experiment photos
│     └─ misc/                   # Other /now imagery
│
├─ tools/
│  └─ build-now.py               # Converts now.tsv → now.json
│
├─ js/
│  └─ now.js                     # Loads/render now.json and applies fade rules
│
├─ css/
│  └─ now.css                    # /now-specific layout + 100/50/25 hierarchy
│
└─ docs-dev/
   └─ now-page.md                # Project documentation / design decisions
```

## Required files

The actual minimum is:

```text
data/now.tsv
data/now.json
tools/build-now.py
js/now.js
css/now.css
```

plus whichever page file is used by the Cabinet site's existing structure.

## `now.tsv` fields

```text
date	section	value	image	notes
```

- `date` — chronology; ISO `YYYY-MM-DD`
- `section` — stable section key such as `reading`, `watching`, `music`, `projects`
- `value` — Markdown-capable display content
- `image` — optional repo-relative image path
- `notes` — private editorial notes; never rendered publicly

## Suggested section keys

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

## Display configuration

Keep display behaviour in `now.js` or a small config object rather than in the TSV.

Suggested defaults:

```text
reading      stream     6 visible     groups of 2 → 100 / 50 / 25
watching     stream     6 visible     groups of 2 → 100 / 50 / 25
music        stream     6 visible     groups of 2 → 100 / 50 / 25
found        stream     6 visible     groups of 2 → 100 / 50 / 25
travel       stream     6 visible     groups of 2 → 100 / 50 / 25
projects     snapshot   3 visible     groups of 1 → 100 / 50 / 25
teaching     snapshot   3 visible     groups of 1 → 100 / 50 / 25
curiosities  snapshot   3 visible     groups of 1 → 100 / 50 / 25
making       stream     6 visible     groups of 2 → 100 / 50 / 25
```

These are page-level rules, not data-level rules.
