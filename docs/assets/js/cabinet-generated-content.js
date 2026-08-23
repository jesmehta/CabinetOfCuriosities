// AUTO-GENERATED FILE.
// Do not edit.
// Edit content/cabinet-sections.tsv and content/cabinet-entries.tsv,
// then run:
//
// node tools/build-cabinet-content.js

export const sections = [
  {
    "id": "bookshelf",
    "title": "Bookshelf of Curiosities",
    "subtitle": "Books, timelines, literary maps, reading projects, and essays.",
    "href": "https://bookshelf.cabinetofcuriosities.in/",
    "order": 10,
    "weight": 4,
    "status": true,
    "kind": "world",
    "tags": [
      "books",
      "literature",
      "timelines"
    ],
    "location": "subdomain",
    "map": {
      "islandId": "island-bookshelf",
      "mapForm": "large-island",
      "cx": 480,
      "cy": 370,
      "rx": 250,
      "ry": 135
    },
    "extraCount": 2
  },
  {
    "id": "fffx",
    "title": "Form follows f(x)",
    "subtitle": "Creative coding, generative systems, and procedural visuals.",
    "href": "https://fffx.cabinetofcuriosities.in/",
    "order": 20,
    "weight": 4,
    "status": true,
    "kind": "world",
    "tags": [
      "creative-coding",
      "generative",
      "p5js"
    ],
    "location": "subdomain",
    "map": {
      "islandId": "island-fffx",
      "mapForm": "large-island",
      "cx": 1030,
      "cy": 350,
      "rx": 260,
      "ry": 130
    },
    "extraCount": 2,
    "notes": "fffx site_url is configured for this subdomain but no CNAME file exists in the fffx repo yet -- verify DNS is live before treating this link as production-ready."
  },
  {
    "id": "teaching",
    "title": "Teaching",
    "subtitle": "Teaching history, approach, and student work.",
    "href": "teaching/",
    "order": 30,
    "weight": 2,
    "status": true,
    "kind": "region",
    "tags": [
      "teaching",
      "students"
    ],
    "location": "mkdocs",
    "map": {
      "islandId": "island-teaching",
      "mapForm": "medium-island",
      "cx": 460,
      "cy": 720,
      "rx": 245,
      "ry": 120
    },
    "extraCount": 3,
    "notes": "Real dedicated Teaching landing page (docs/teaching.md) added 2026-08-24 -- href was a placeholder pointing at the external SSD Creative Coding showcase before this."
  },
  {
    "id": "visual-field-notes",
    "title": "Visual Field Notes",
    "subtitle": "Type, doors, streets, places, patterns, and observed details.",
    "href": "",
    "order": 40,
    "weight": 2,
    "status": "wip",
    "kind": "region",
    "tags": [
      "photography",
      "type",
      "places"
    ],
    "location": "mkdocs",
    "map": {
      "islandId": "island-field-notes",
      "mapForm": "medium-island",
      "cx": 1005,
      "cy": 720,
      "rx": 270,
      "ry": 130
    },
    "extraCount": 2,
    "notes": "Entirely new section, no built pages yet anywhere -- island renders as non-navigating (coming soon) until content exists."
  },
  {
    "id": "machines-makings",
    "title": "Machines & Makings",
    "subtitle": "Making processes, fabrication notes, and machine collections.",
    "href": "makings/",
    "order": 50,
    "weight": 3,
    "status": true,
    "kind": "region",
    "tags": [
      "fabrication",
      "making",
      "machines"
    ],
    "location": "mkdocs",
    "map": {
      "islandId": "island-machines-makings",
      "mapForm": "medium-island",
      "cx": 420,
      "cy": 1090,
      "rx": 290,
      "ry": 110
    },
    "extraCount": 3
  },
  {
    "id": "interfaces-data-texts",
    "title": "Interfaces, Data & Texts",
    "subtitle": "Web experiments, data visualisations, and digital writings.",
    "href": "creative_code/",
    "order": 60,
    "weight": 3,
    "status": true,
    "kind": "region",
    "tags": [
      "web",
      "dataviz",
      "writing"
    ],
    "location": "mkdocs",
    "map": {
      "islandId": "island-interfaces",
      "mapForm": "medium-island",
      "cx": 1005,
      "cy": 1090,
      "rx": 260,
      "ry": 105
    },
    "extraCount": 2
  },
  {
    "id": "compass",
    "title": "Compass Rose",
    "subtitle": "",
    "href": "",
    "order": 80,
    "weight": 4,
    "status": true,
    "kind": "compass",
    "tags": [],
    "location": "",
    "map": {
      "islandId": "island-compass",
      "mapForm": "compass",
      "cx": 1470,
      "cy": 1170,
      "rx": 115,
      "ry": 115
    },
    "extraCount": 0,
    "notes": "SE-reserved compass rose section -- kind: compass triggers a dedicated render path in landing-v3 (no archipelago growth, no filler islands); cx/cy/rx/ry are unused placeholders, real placement comes from the deterministic SE-corner square carve in cabinet-v3-layout.js."
  },
  {
    "id": "wild-wild-web",
    "title": "Wild wild web",
    "subtitle": "Generative bots, mandalas, twine and other web ephemera.",
    "href": "",
    "order": 70,
    "weight": 2,
    "status": false,
    "kind": "region",
    "tags": [
      "creative-coding",
      "bots",
      "generative",
      "web"
    ],
    "location": "mkdocs",
    "map": {
      "islandId": "",
      "mapForm": "",
      "cx": 0,
      "cy": 0,
      "rx": 0,
      "ry": 0
    },
    "extraCount": 3,
    "notes": "status: false -- has an mkdocs nav section already (TraceryBots/Dot Mandala/Twine/Creative Coding) but no map placement yet; the 6-region + compass grid is currently full (see machines-makings/interfaces-data-texts/visual-field-notes/teaching cx/cy). Needs a layout decision before flipping to wip/true -- see ToDo #69."
  },
  {
    "id": "fab",
    "title": "Fab",
    "subtitle": "Fab Academy, Fabricademy, and reflections from Fab Academy cohorts.",
    "href": "",
    "order": 65,
    "weight": 2,
    "status": "wip",
    "kind": "region",
    "tags": [
      "fabacademy",
      "fabricademy",
      "making",
      "reflections"
    ],
    "location": "external",
    "map": {
      "islandId": "",
      "mapForm": "",
      "cx": 0,
      "cy": 0,
      "rx": 0,
      "ry": 0
    },
    "extraCount": 1,
    "notes": "New section, 2026-08-24, direct request (#27 intercession -- Fab/Fabricademy are not Level-1 worlds per the standing WORLD-SYSTEMS.md rule, but a Fab SECTION with a couple of program-link islands plus reflection writeups is fine). cx/cy/rx/ry left blank -- confirmed vestigial, squarify() computes placement live from weight."
  }
];

export const entries = [
  {
    "id": "scifi",
    "section": "bookshelf",
    "title": "Golden Age SciFi",
    "subtitle": "Timeline and reading project on the writers who imagined tomorrow.",
    "href": "https://bookshelf.cabinetofcuriosities.in/scifi/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "world-entry",
    "tags": [
      "science-fiction",
      "golden-age"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 20.8,
      "y": 33.7
    },
    "icon": "icon-rocket"
  },
  {
    "id": "asimov",
    "section": "bookshelf",
    "title": "Asimov",
    "subtitle": "Foundation, Robots, and the Grand Unification.",
    "href": "https://bookshelf.cabinetofcuriosities.in/asimov/",
    "order": 20,
    "weight": 3,
    "status": true,
    "kind": "world-entry",
    "tags": [
      "science-fiction",
      "author",
      "asimov"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 30,
      "y": 22.2
    },
    "icon": "icon-book"
  },
  {
    "id": "christie",
    "section": "bookshelf",
    "title": "Christie",
    "subtitle": "The geography of murder -- places, books, literary maps.",
    "href": "https://bookshelf.cabinetofcuriosities.in/",
    "order": 30,
    "weight": 2,
    "status": "wip",
    "kind": "world-entry",
    "tags": [
      "crime",
      "author",
      "christie"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 39.2,
      "y": 33.7
    },
    "icon": "icon-typewriter",
    "notes": "Author page not live yet; links to Bookshelf root as placeholder."
  },
  {
    "id": "vera-molnar",
    "section": "fffx",
    "title": "Vera Molnar",
    "subtitle": "A code-driven homage and study.",
    "href": "https://fffx.cabinetofcuriosities.in/recreating-the-past/vera-molnar/",
    "order": 10,
    "weight": 4,
    "status": true,
    "kind": "artist-study",
    "tags": [
      "artist-study",
      "geometry"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 54.9,
      "y": 31.9
    },
    "icon": "icon-circles"
  },
  {
    "id": "circle-packing-library",
    "section": "fffx",
    "title": "Circle Packing Library",
    "subtitle": "From Bookclubs to Libraries -- circle packing with code.",
    "href": "https://fffx.cabinetofcuriosities.in/tools-and-libraries/circle-packing-library/",
    "order": 20,
    "weight": 4,
    "status": true,
    "kind": "library",
    "tags": [
      "p5",
      "circle-packing",
      "library"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 64.4,
      "y": 20.9
    },
    "icon": "icon-circles",
    "relatedLinks": [
      {
        "label": "GitHub repository",
        "href": "https://github.com/jesmehta/p5-circle-packing"
      }
    ],
    "notes": "fffx has its own thumbnail asset at this entry but it is relative to fffx's own docs root -- not copied into Cabinet yet, uses placeholder tile for now."
  },
  {
    "id": "particle-systems",
    "section": "fffx",
    "title": "Particle Systems",
    "subtitle": "Particles, motion, and emergent behaviour.",
    "href": "https://fffx.cabinetofcuriosities.in/deep-studies/particle-systems/",
    "order": 30,
    "weight": 3,
    "status": "wip",
    "kind": "deep-study",
    "tags": [
      "p5",
      "particles",
      "motion"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 73.9,
      "y": 31.9
    },
    "icon": "icon-particles"
  },
  {
    "id": "100-gradients",
    "section": "fffx",
    "title": "100 Gradients",
    "subtitle": "A study in generated colour fields.",
    "href": "https://fffx.cabinetofcuriosities.in/deep-studies/100-gradients/",
    "order": 40,
    "weight": 3,
    "status": "wip",
    "kind": "deep-study",
    "tags": [
      "gradients",
      "colour",
      "generative"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "coast",
      "size": "medium",
      "cardType": "port-card",
      "anchor": "north",
      "order": 1
    },
    "icon": "icon-gradient"
  },
  {
    "id": "teaching-student-work",
    "section": "teaching",
    "title": "Student Work",
    "subtitle": "Selected student work and showcases from SSD Creative Coding.",
    "href": "teaching/ssd-creative-coding/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "gallery",
    "tags": [
      "teaching",
      "students",
      "showcase"
    ],
    "location": "assembly",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 28.7,
      "y": 49.2
    },
    "icon": "icon-cap",
    "notes": "Multi-repo assembly, mounted at /teaching/ssd-creative-coding/ (jesmehta/SSD_CreativeCodingPage) -- was an external link before 2026-08-24."
  },
  {
    "id": "teaching-approach",
    "section": "teaching",
    "title": "History & Approach",
    "subtitle": "A concise teaching history and approach statement.",
    "href": "",
    "order": 20,
    "weight": 2,
    "status": "wip",
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "approach"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 19.7,
      "y": 59.5
    },
    "icon": "icon-book",
    "notes": "No page yet -- renders as non-navigating (coming soon)."
  },
  {
    "id": "teaching-research",
    "section": "teaching",
    "title": "Research & Interests",
    "subtitle": "Research directions and pedagogical interests.",
    "href": "",
    "order": 30,
    "weight": 2,
    "status": "wip",
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "research"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 37.8,
      "y": 59.5
    },
    "icon": "icon-magnifier",
    "notes": "No page yet."
  },
  {
    "id": "gujarati-type",
    "section": "visual-field-notes",
    "title": "Gujarati Type",
    "subtitle": "A photographic collection of Gujarati letterforms.",
    "href": "",
    "order": 10,
    "weight": 2,
    "status": "wip",
    "kind": "gallery",
    "tags": [
      "type",
      "gujarati",
      "photography"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 53.1,
      "y": 59.4
    },
    "icon": "icon-type"
  },
  {
    "id": "doors-of-kutch",
    "section": "visual-field-notes",
    "title": "Doors of Kutch",
    "subtitle": "A place-based visual gallery of doors, thresholds, and surfaces.",
    "href": "",
    "order": 20,
    "weight": 2,
    "status": "wip",
    "kind": "gallery",
    "tags": [
      "doors",
      "kutch",
      "photography"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 62.8,
      "y": 49.4
    },
    "icon": "icon-door"
  },
  {
    "id": "kochi",
    "section": "visual-field-notes",
    "title": "Kochi",
    "subtitle": "Visual notes and photographic observations from Kochi.",
    "href": "",
    "order": 30,
    "weight": 2,
    "status": "wip",
    "kind": "gallery",
    "tags": [
      "kochi",
      "photography",
      "travel"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 72.5,
      "y": 59.4
    },
    "icon": "icon-boat"
  },
  {
    "id": "makings-3d-printing",
    "section": "machines-makings",
    "title": "3D Printing",
    "subtitle": "Notes, examples, and reflections on 3D printing as a making process.",
    "href": "3dp/3DP_2019/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "making-notes",
    "tags": [
      "3d-printing",
      "fabrication"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 26.3,
      "y": 78.8
    },
    "icon": "icon-layers"
  },
  {
    "id": "makings-origami-paper",
    "section": "machines-makings",
    "title": "Origami & Paper",
    "subtitle": "Paper structures, folds, surfaces, and material logic.",
    "href": "makings/origami-paper/",
    "order": 20,
    "weight": 2,
    "status": true,
    "kind": "making-notes",
    "tags": [
      "origami",
      "paper"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 16.5,
      "y": 87.2
    },
    "icon": "icon-origami",
    "notes": "Stub page, 2026-08-24 -- content coming later."
  },
  {
    "id": "makings-lasercutting",
    "section": "machines-makings",
    "title": "Lasercutting",
    "subtitle": "Laser cutting notes, examples, and making references.",
    "href": "makings/lasercutting/",
    "order": 30,
    "weight": 2,
    "status": true,
    "kind": "making-notes",
    "tags": [
      "lasercutting",
      "fabrication"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 36,
      "y": 87.2
    },
    "icon": "icon-laser",
    "notes": "Stub page, 2026-08-24 -- content coming later."
  },
  {
    "id": "looms",
    "section": "machines-makings",
    "title": "Looms",
    "subtitle": "A machine collection around weaving, textiles, and mechanisms.",
    "href": "mini_loom/",
    "order": 40,
    "weight": 3,
    "status": true,
    "kind": "machine-collection",
    "tags": [
      "looms",
      "weaving",
      "textiles"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "coast",
      "size": "medium",
      "cardType": "port-card",
      "anchor": "south",
      "order": 1
    },
    "icon": "icon-loom"
  },
  {
    "id": "drawing-machines",
    "section": "machines-makings",
    "title": "Drawing Machines",
    "subtitle": "Drawing machines, plotters, and mechanical mark-making systems.",
    "href": "makings/drawing-machines/",
    "order": 50,
    "weight": 2,
    "status": true,
    "kind": "machine-collection",
    "tags": [
      "plotters",
      "drawing-machines"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "coast",
      "size": "medium",
      "cardType": "port-card",
      "anchor": "south",
      "order": 2
    },
    "icon": "icon-gear",
    "notes": "Stub page, 2026-08-24 -- content coming later."
  },
  {
    "id": "branching-narrative",
    "section": "interfaces-data-texts",
    "title": "Branching Narrative",
    "subtitle": "A Twine-based interactive narrative experiment.",
    "href": "emergent_twine/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "interactive-writing",
    "tags": [
      "twine",
      "narrative",
      "interactive"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 55.2,
      "y": 79.4
    },
    "icon": "icon-branch"
  },
  {
    "id": "dataviz",
    "section": "interfaces-data-texts",
    "title": "Data Visualisations",
    "subtitle": "Charts, maps, datasets, and visual systems.",
    "href": "",
    "order": 20,
    "weight": 3,
    "status": "wip",
    "kind": "dataviz",
    "tags": [
      "dataviz",
      "maps",
      "data"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 70.4,
      "y": 79.4
    },
    "icon": "icon-chart",
    "notes": "Direct correction, 2026-08-24: was cross-listed to Bookshelf's Christie/agatha page, but that's not actually Data Visualisations content -- reverted to a real stub (no page yet) like the section's other wip entries."
  },
  {
    "id": "writings",
    "section": "interfaces-data-texts",
    "title": "Writings",
    "subtitle": "Essays, notes, reflections, and digital texts.",
    "href": "",
    "order": 30,
    "weight": 2,
    "status": "wip",
    "kind": "writing-collection",
    "tags": [
      "writing",
      "essays"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 55.2,
      "y": 88.3
    },
    "icon": "icon-quill"
  },
  {
    "id": "webtech",
    "section": "interfaces-data-texts",
    "title": "WebTech",
    "subtitle": "Web pieces that do not belong inside fffx.",
    "href": "dotMandalaTool/",
    "order": 40,
    "weight": 3,
    "status": true,
    "kind": "web-experiment",
    "tags": [
      "webtech",
      "tools"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 70.4,
      "y": 88.3
    },
    "icon": "icon-code"
  },
  {
    "id": "tracery-bots",
    "section": "interfaces-data-texts",
    "title": "Tracery Bots",
    "subtitle": "Generative text bots built with Tracery.",
    "href": "traceryBots/",
    "order": 50,
    "weight": 2,
    "status": true,
    "kind": "web-experiment",
    "tags": [
      "tracery",
      "bots",
      "generative-text"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "coast",
      "size": "medium",
      "cardType": "port-card",
      "anchor": "east",
      "order": 1
    },
    "icon": "icon-bot"
  },
  {
    "id": "compass-n",
    "section": "compass",
    "title": "About Me",
    "subtitle": "",
    "href": "",
    "order": 10,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "placement": "",
      "size": "",
      "cardType": "",
      "anchor": "N"
    },
    "notes": "href intentionally blank for now -- set directly in this TSV when ready."
  },
  {
    "id": "compass-e",
    "section": "compass",
    "title": "Contact me",
    "subtitle": "",
    "href": "",
    "order": 20,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "placement": "",
      "size": "",
      "cardType": "",
      "anchor": "E"
    },
    "notes": "href intentionally blank for now -- set directly in this TSV when ready."
  },
  {
    "id": "compass-s",
    "section": "compass",
    "title": "Colophon",
    "subtitle": "",
    "href": "colophon/",
    "order": 30,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "placement": "",
      "size": "",
      "cardType": "",
      "anchor": "S"
    },
    "notes": "Dummy page for now (docs/colophon.md) -- links straight to the v1/v2 archive; user will add the actual writing later."
  },
  {
    "id": "compass-w",
    "section": "compass",
    "title": "CV",
    "subtitle": "",
    "href": "https://www.jesalmehta.com",
    "order": 40,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "placement": "",
      "size": "",
      "cardType": "",
      "anchor": "W"
    }
  },
  {
    "id": "working-with-ai",
    "section": "teaching",
    "title": "Working with AI",
    "subtitle": "15 principles for working with AI tools, assembled straight into Cabinet.",
    "href": "teaching/working-with-ai/",
    "order": 40,
    "weight": 3,
    "status": true,
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "ai",
      "guide"
    ],
    "location": "assembly",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-book",
    "notes": "Multi-repo assembly (#43), mounted at /teaching/working-with-ai/ -- not built by mkdocs. location: assembly is a new value (field is descriptive only, not read by the layout code) since existing subdomain/mkdocs/external didn't fit."
  },
  {
    "id": "swatch-fields",
    "section": "machines-makings",
    "title": "Swatch Fields",
    "subtitle": "An atlas of material swatches and colour fields.",
    "href": "https://jesmehta.github.io/swatchFields/",
    "order": 60,
    "weight": 3,
    "status": true,
    "kind": "material-collection",
    "tags": [
      "materials",
      "swatches",
      "colour"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-swatch"
  },
  {
    "id": "prompt-generator",
    "section": "teaching",
    "title": "Prompt Generator",
    "subtitle": "A generator for transformation and creative-writing prompts.",
    "href": "teaching/prompt-generator/",
    "order": 50,
    "weight": 2,
    "status": true,
    "kind": "web-experiment",
    "tags": [
      "teaching",
      "generative-text",
      "prompts",
      "tool"
    ],
    "location": "assembly",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-code",
    "notes": "Multi-repo assembly, mounted at /teaching/prompt-generator/ (jesmehta/PromptGenerator)."
  },
  {
    "id": "oblique-strategies",
    "section": "teaching",
    "title": "Oblique Strategies",
    "subtitle": "A digital deck of Oblique Strategies cards for creative blocks.",
    "href": "teaching/oblique-strategies/",
    "order": 60,
    "weight": 2,
    "status": true,
    "kind": "web-experiment",
    "tags": [
      "teaching",
      "generative",
      "cards",
      "tool"
    ],
    "location": "assembly",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-cards",
    "notes": "Multi-repo assembly, mounted at /teaching/oblique-strategies/ (jesmehta/ObliqueStrategies)."
  },
  {
    "id": "swatch-fields-interfaces",
    "section": "interfaces-data-texts",
    "title": "Swatch Fields",
    "subtitle": "An atlas of material swatches and colour fields -- dye and colour work, cross-listed from Machines & Makings.",
    "href": "https://jesmehta.github.io/swatchFields/",
    "order": 60,
    "weight": 2,
    "status": true,
    "kind": "web-experiment",
    "tags": [
      "materials",
      "swatches",
      "colour",
      "dye"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-swatch",
    "notes": "Intersectional entry (2026-08-24) -- same repo as machines-makings's swatch-fields, cross-listed here since it's equally a colour/data-texture piece. Two separate TSV rows, two islands, deliberate."
  },
  {
    "id": "fab-academy",
    "section": "fab",
    "title": "Fab Academy",
    "subtitle": "The official Fab Academy program.",
    "href": "https://fabacademy.org/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "program-link",
    "tags": [
      "fabacademy"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-cap",
    "notes": "Root domain inferred from the confirmed personal-page URL (fabacademy.org/2023/...) -- high confidence, but this is the general program site, not fab-23's specific page."
  },
  {
    "id": "fabricademy",
    "section": "fab",
    "title": "Fabricademy",
    "subtitle": "The official Fabricademy program.",
    "href": "",
    "order": 20,
    "weight": 3,
    "status": "wip",
    "kind": "program-link",
    "tags": [
      "fabricademy"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-cap",
    "notes": "href still blank -- confirmed domain family is textile-academy.org (from fab-26's class.textile-academy.org/2026/... page), but unsure if the general public site is at textile-academy.org root or a separate fabricademy.net -- confirm before setting."
  },
  {
    "id": "fab-23",
    "section": "fab",
    "title": "Fab 23",
    "subtitle": "Jesal's FabAcademy Chronicles -- write-up and reflections from Fab Academy 2023.",
    "href": "https://fabacademy.org/2023/labs/riidl/students/jesal-mehta/",
    "order": 30,
    "weight": 3,
    "status": true,
    "kind": "reflection",
    "tags": [
      "fabacademy",
      "writeup",
      "2023"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-quill"
  },
  {
    "id": "fab-26",
    "section": "fab",
    "title": "Fab 26",
    "subtitle": "Fabricademy 2026 coursework and journal.",
    "href": "https://class.textile-academy.org/2026/jesal-mehta/",
    "order": 40,
    "weight": 3,
    "status": true,
    "kind": "reflection",
    "tags": [
      "fabricademy",
      "writeup",
      "2026"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque"
    },
    "icon": "icon-quill",
    "notes": "Fabricademy, not Fab Academy -- sister program, different year cohort (2026) than fab-23 (2023)."
  }
];
