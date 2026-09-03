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
    "subtitle": "Timeline and reading project on the writers who imagined tomorrow."
  },
  {
    "id": "asimov",
    "section": "bookshelf",
    "title": "Asimov",
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
    "subtitle": "Foundation, Robots, and the Grand Unification."
  },
  {
    "id": "christie",
    "section": "bookshelf",
    "title": "Christie",
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
    "subtitle": "The geography of murder -- places, books, literary maps.",
    "notes": "Author page not live yet; links to Bookshelf root as placeholder."
  },
  {
    "id": "vera-molnar",
    "section": "fffx",
    "title": "Vera Molnar",
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
    "subtitle": "A code-driven homage and study."
  },
  {
    "id": "circle-packing-library",
    "section": "fffx",
    "title": "Circle Packing Library",
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
    "subtitle": "From Bookclubs to Libraries -- circle packing with code.",
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
    "subtitle": "Particles, motion, and emergent behaviour."
  },
  {
    "id": "100-gradients",
    "section": "fffx",
    "title": "100 Gradients",
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
    "subtitle": "A study in generated colour fields."
  },
  {
    "id": "students-creative-coding-2025-26",
    "section": "teaching",
    "title": "Student Work - Creative Coding",
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
    "subtitle": "Selected student work and showcases from SSD Creative Coding.",
    "notes": "Multi-repo assembly, mounted at /teaching/ssd-creative-coding/ (jesmehta/SSD_CreativeCodingPage) -- was an external link before 2026-08-24."
  },
  {
    "id": "students-emergent-technology",
    "section": "teaching",
    "title": "Student Work - Emergent Technology",
    "href": "teaching/#emergent-technology",
    "order": 20,
    "weight": 2,
    "status": true,
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "ai",
      "emergent-technology"
    ],
    "location": "mkdocs",
    "subtitle": "Working with AI, Coding with AI, and class write-ups.",
    "notes": "Links to the Emergent Technology subheading on teaching.md."
  },
  {
    "id": "teaching-approach",
    "section": "teaching",
    "title": "History & Approach",
    "href": "",
    "order": 30,
    "weight": 2,
    "status": "wip",
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "approach"
    ],
    "location": "mkdocs",
    "subtitle": "A concise teaching history and approach statement.",
    "notes": "No page yet -- renders as non-navigating (coming soon)."
  },
  {
    "id": "gujarati-type",
    "section": "visual-field-notes",
    "title": "Gujarati Type",
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
    "subtitle": "A photographic collection of Gujarati letterforms."
  },
  {
    "id": "doors-of-kutch",
    "section": "visual-field-notes",
    "title": "Doors of Kutch",
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
    "subtitle": "A place-based visual gallery of doors, thresholds, and surfaces."
  },
  {
    "id": "kochi",
    "section": "visual-field-notes",
    "title": "Kochi",
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
    "subtitle": "Visual notes and photographic observations from Kochi."
  },
  {
    "id": "makings-3d-printing",
    "section": "machines-makings",
    "title": "3D Printing",
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
    "subtitle": "Notes, examples, and reflections on 3D printing as a making process."
  },
  {
    "id": "makings-origami-paper",
    "section": "machines-makings",
    "title": "Origami & Paper",
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
    "subtitle": "Paper structures, folds, surfaces, and material logic.",
    "notes": "Stub page, 2026-08-24 -- content coming later."
  },
  {
    "id": "makings-lasercutting",
    "section": "machines-makings",
    "title": "Lasercutting",
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
    "subtitle": "Laser cutting notes, examples, and making references.",
    "notes": "Stub page, 2026-08-24 -- content coming later."
  },
  {
    "id": "looms",
    "section": "machines-makings",
    "title": "Looms",
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
    "subtitle": "A machine collection around weaving, textiles, and mechanisms."
  },
  {
    "id": "drawing-machines",
    "section": "machines-makings",
    "title": "Drawing Machines",
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
    "subtitle": "Drawing machines, plotters, and mechanical mark-making systems.",
    "notes": "Stub page, 2026-08-24 -- content coming later."
  },
  {
    "id": "branching-narrative",
    "section": "interfaces-data-texts",
    "title": "Branching Narrative",
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
    "subtitle": "A Twine-based interactive narrative experiment."
  },
  {
    "id": "dataviz",
    "section": "interfaces-data-texts",
    "title": "Data Visualisations",
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
    "subtitle": "Charts, maps, datasets, and visual systems.",
    "notes": "Direct correction, 2026-08-24: was cross-listed to Bookshelf's Christie/agatha page, but that's not actually Data Visualisations content -- reverted to a real stub (no page yet) like the section's other wip entries."
  },
  {
    "id": "writings",
    "section": "interfaces-data-texts",
    "title": "Writings",
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
    "subtitle": "Essays, notes, reflections, and digital texts."
  },
  {
    "id": "webtech",
    "section": "interfaces-data-texts",
    "title": "WebTech",
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
    "subtitle": "Web pieces that do not belong inside fffx."
  },
  {
    "id": "tracery-bots",
    "section": "interfaces-data-texts",
    "title": "Tracery Bots",
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
    "subtitle": "Generative text bots built with Tracery."
  },
  {
    "id": "compass-n",
    "section": "compass",
    "title": "About Me",
    "href": "about/",
    "order": 10,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "anchor": "N"
    },
    "notes": "Links to docs/about.md. CV and Contact live inside that page, not as their own compass points."
  },
  {
    "id": "compass-e",
    "section": "compass",
    "title": "Now",
    "href": "now/",
    "order": 20,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "anchor": "E"
    },
    "notes": "Links to docs/now.md. Replaces the earlier \"Contact me\" placeholder at this compass point. Contact does NOT live here (corrected 2026-08-30) -- both CV and Contact are folding into About Me instead, same as compass-n's note says."
  },
  {
    "id": "compass-s",
    "section": "compass",
    "title": "Colophon",
    "href": "colophon/",
    "order": 30,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "anchor": "S"
    },
    "notes": "Dummy page for now (docs/colophon.md) -- links straight to the v1/v2 archive; user will add the actual writing later."
  },
  {
    "id": "compass-w",
    "section": "compass",
    "title": "Site map",
    "href": "sitemap/",
    "order": 40,
    "weight": 1,
    "status": true,
    "kind": "compass-direction",
    "tags": [],
    "location": "",
    "visual": {
      "anchor": "W"
    },
    "notes": "Auto-generated from all three worlds' TSVs by tools/generate_sitemap.py -> docs/sitemap.md, mirroring build-cabinet-content.js's own TSV-as-source-of-truth pattern. CV moved off this compass point; it now lives inside the About Me page instead."
  },
  {
    "id": "teaching-research",
    "section": "teaching",
    "title": "Research & Interests",
    "href": "",
    "order": 40,
    "weight": 2,
    "status": "wip",
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "research"
    ],
    "location": "mkdocs",
    "subtitle": "Research directions and pedagogical interests.",
    "notes": "No page yet."
  },
  {
    "id": "swatch-fields",
    "section": "machines-makings",
    "title": "Swatch Fields",
    "href": "swatch-fields/",
    "order": 60,
    "weight": 3,
    "status": true,
    "kind": "material-collection",
    "tags": [
      "materials",
      "swatches",
      "colour"
    ],
    "location": "assembly",
    "subtitle": "An atlas of material swatches and colour fields."
  },
  {
    "id": "working-with-ai",
    "section": "teaching",
    "title": "Working with AI",
    "href": "teaching/working-with-ai/",
    "order": 50,
    "weight": 3,
    "status": true,
    "kind": "teaching-page",
    "tags": [
      "teaching",
      "ai",
      "guide"
    ],
    "location": "assembly",
    "subtitle": "15 principles for working with AI tools, assembled straight into Cabinet.",
    "notes": "Multi-repo assembly (#43), mounted at /teaching/working-with-ai/ -- not built by mkdocs. location: assembly is a new value (field is descriptive only, not read by the layout code) since existing subdomain/mkdocs/external didn't fit."
  },
  {
    "id": "prompt-generator",
    "section": "teaching",
    "title": "Prompt Generator",
    "href": "teaching/prompt-generator/",
    "order": 60,
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
    "subtitle": "A generator for transformation and creative-writing prompts.",
    "notes": "Multi-repo assembly, mounted at /teaching/prompt-generator/ (jesmehta/PromptGenerator)."
  },
  {
    "id": "oblique-strategies",
    "section": "teaching",
    "title": "Oblique Strategies",
    "href": "teaching/oblique-strategies/",
    "order": 70,
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
    "subtitle": "A digital deck of Oblique Strategies cards for creative blocks.",
    "notes": "Multi-repo assembly, mounted at /teaching/oblique-strategies/ (jesmehta/ObliqueStrategies)."
  },
  {
    "id": "swatch-fields-interfaces",
    "section": "interfaces-data-texts",
    "title": "Swatch Fields",
    "href": "swatch-fields/",
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
    "location": "assembly",
    "subtitle": "An atlas of material swatches and colour fields -- dye and colour work, cross-listed from Machines & Makings.",
    "notes": "Intersectional entry (2026-08-24) -- same repo as machines-makings's swatch-fields, cross-listed here since it's equally a colour/data-texture piece. Two separate TSV rows, two islands, deliberate."
  },
  {
    "id": "fab-academy",
    "section": "fab",
    "title": "Fab Academy",
    "href": "https://fabacademy.org/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "program-link",
    "tags": [
      "fabacademy"
    ],
    "location": "external",
    "subtitle": "The official Fab Academy program.",
    "notes": "Root domain inferred from the confirmed personal-page URL (fabacademy.org/2023/...) -- high confidence, but this is the general program site, not fab-23's specific page."
  },
  {
    "id": "fabricademy",
    "section": "fab",
    "title": "Fabricademy",
    "href": "",
    "order": 20,
    "weight": 3,
    "status": "wip",
    "kind": "program-link",
    "tags": [
      "fabricademy"
    ],
    "location": "external",
    "subtitle": "The official Fabricademy program.",
    "notes": "href still blank -- confirmed domain family is textile-academy.org (from fab-26's class.textile-academy.org/2026/... page), but unsure if the general public site is at textile-academy.org root or a separate fabricademy.net -- confirm before setting."
  },
  {
    "id": "fab-23",
    "section": "fab",
    "title": "Fab 23",
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
    "subtitle": "Jesal's FabAcademy Chronicles -- write-up and reflections from Fab Academy 2023."
  },
  {
    "id": "fab-26",
    "section": "fab",
    "title": "Fab 26",
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
    "subtitle": "Fabricademy 2026 coursework and journal.",
    "notes": "Fabricademy, not Fab Academy -- sister program, different year cohort (2026) than fab-23 (2023)."
  }
];
