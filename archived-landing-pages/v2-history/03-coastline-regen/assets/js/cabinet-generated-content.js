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
    }
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
    "notes": "fffx site_url is configured for this subdomain but no CNAME file exists in the fffx repo yet -- verify DNS is live before treating this link as production-ready."
  },
  {
    "id": "teaching",
    "title": "Teaching",
    "subtitle": "Teaching history, approach, and student work.",
    "href": "https://jesmehta.github.io/SSD_CreativeCodingPage/",
    "order": 30,
    "weight": 2,
    "status": "wip",
    "kind": "region",
    "tags": [
      "teaching",
      "students"
    ],
    "location": "external",
    "map": {
      "islandId": "island-teaching",
      "mapForm": "medium-island",
      "cx": 460,
      "cy": 720,
      "rx": 245,
      "ry": 120
    },
    "notes": "No dedicated Cabinet Teaching page yet; href is a placeholder pointing at the real student showcase until one exists."
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
    }
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
    }
  },
  {
    "id": "about",
    "title": "About Me",
    "subtitle": "CV, links, and current work.",
    "href": "about/",
    "order": 70,
    "weight": 1,
    "status": true,
    "kind": "world",
    "tags": [
      "about",
      "cv"
    ],
    "location": "mkdocs",
    "map": {
      "islandId": "island-about",
      "mapForm": "small-island",
      "cx": 1470,
      "cy": 170,
      "rx": 115,
      "ry": 85
    },
    "notes": "Deliberately peripheral (top-right), not central, per design brief."
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
    "href": "https://jesmehta.github.io/SSD_CreativeCodingPage/",
    "order": 10,
    "weight": 3,
    "status": true,
    "kind": "gallery",
    "tags": [
      "teaching",
      "students",
      "showcase"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 28.7,
      "y": 49.2
    },
    "icon": "icon-cap"
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
    "href": "",
    "order": 20,
    "weight": 2,
    "status": "wip",
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
    "icon": "icon-origami"
  },
  {
    "id": "makings-lasercutting",
    "section": "machines-makings",
    "title": "Lasercutting",
    "subtitle": "Laser cutting notes, examples, and making references.",
    "href": "",
    "order": 30,
    "weight": 2,
    "status": "wip",
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
    "icon": "icon-laser"
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
    "href": "",
    "order": 50,
    "weight": 2,
    "status": "wip",
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
    "icon": "icon-gear"
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
    "href": "https://bookshelf.cabinetofcuriosities.in/agatha/",
    "order": 20,
    "weight": 3,
    "status": true,
    "kind": "dataviz",
    "tags": [
      "dataviz",
      "maps",
      "data"
    ],
    "location": "subdomain",
    "visual": {
      "placement": "land",
      "size": "medium",
      "cardType": "thumbnail-plaque",
      "x": 70.4,
      "y": 79.4
    },
    "icon": "icon-chart",
    "notes": "Cross-listed from Bookshelf's Christie geography-of-murder dataviz page."
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
    "id": "cv",
    "section": "about",
    "title": "CV",
    "subtitle": "Professional profile and experience.",
    "href": "https://www.jesalmehta.com",
    "order": 10,
    "weight": 1,
    "status": true,
    "kind": "profile-page",
    "tags": [
      "cv",
      "profile"
    ],
    "location": "external",
    "visual": {
      "placement": "land",
      "size": "small",
      "cardType": "thumbnail-plaque",
      "x": 87.8,
      "y": 9.2
    },
    "icon": "icon-scroll"
  },
  {
    "id": "currently",
    "section": "about",
    "title": "Currently",
    "subtitle": "Current work, study, and ongoing directions.",
    "href": "about/",
    "order": 20,
    "weight": 1,
    "status": true,
    "kind": "profile-page",
    "tags": [
      "currently",
      "profile"
    ],
    "location": "mkdocs",
    "visual": {
      "placement": "land",
      "size": "small",
      "cardType": "thumbnail-plaque",
      "x": 95.9,
      "y": 16.9
    },
    "icon": "icon-hourglass"
  }
];
