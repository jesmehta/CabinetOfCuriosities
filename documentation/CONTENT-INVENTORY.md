# Cabinet Content Inventory

_Auto-generated 2026-09-08 08:32 UTC by `tools/generate_sitemap.py` from `content/cabinet-sections.tsv`, `content/cabinet-entries.tsv`, and `mkdocs.yml`'s own nav tree -- do not hand-edit, re-run the script to refresh._

Cabinet-only. Bookshelf/fffx and other assembled content's live status is what [/sitemap/](../docs/compass/sitemap.md) is for -- not duplicated here. `Map` is simply each row's own `status` column (`true`/`wip`/`false`), read directly, not separately computed.

Flags below are mechanical string-matching, not judgement calls -- deliberate cross-listings (e.g. Swatch Fields) and map-only entries with no nav entry by design (e.g. assembled Teaching entries) will show up here too. Skim and dismiss the ones that are fine rather than treating every flag as a bug. One exception is filtered out automatically: a TSV row with `status` false is expected to have no nav entry (it's not live), so that combination is never flagged.

## Sections

| id | title | TSV href | Map (status) | mkdocs nav |
|---|---|---|---|---|
| `bookshelf` | Bookshelf of Curiosities | `https://bookshelf.cabinetofcuriosities.in/` | true | Y (Bookshelf of Curiosities) |
| `fffx` | Form follows f(x) | `https://fffx.cabinetofcuriosities.in/` | true | Y (Form follows f(x)) |
| `web-tech` | WebTech | `webtech/` | true | Y (webtech/index.md) |
| `writings` | Writings | `https://bookshelf.cabinetofcuriosities.in/my-writings/` | true | N |
| `teaching` | Teaching | `teaching/` | true | Y (teaching/index.md) |
| `visual-field-notes` | Visual Field Notes | `--` | wip | -- |
| `machines-makings` | Machines & Makings | `makings/` | wip | Y (makings/index.md) |
| `data-interactions` | Interactive Data | `dataviz/` | false | N |
| `compass` | Compass Rose | `--` | true | -- |
| `fab` | Fab | `--` | true | -- |

## Entries

| id | section | title | TSV href | Map (status) | mkdocs nav |
|---|---|---|---|---|---|
| `scifi` | bookshelf | Golden Age SciFi | `https://bookshelf.cabinetofcuriosities.in/scifi/` | true | N |
| `asimov` | bookshelf | Asimov | `https://bookshelf.cabinetofcuriosities.in/asimov/` | true | N |
| `writings-poetry` | writings | Poetry | `https://bookshelf.cabinetofcuriosities.in/my-writings/poems/` | true | Y (Poems) |
| `writings-essays` | writings | Essays | `https://bookshelf.cabinetofcuriosities.in/my-writings/essays/` | true | Y (Essays) |
| `vera-molnar` | fffx | Vera Molnar | `https://fffx.cabinetofcuriosities.in/recreating-the-past/vera-molnar/` | true | N |
| `circle-packing-library` | fffx | Circle Packing Library | `https://fffx.cabinetofcuriosities.in/tools-and-libraries/circle-packing-library/` | true | N |
| `particle-systems` | fffx | Particle Systems | `https://fffx.cabinetofcuriosities.in/deep-studies/particle-systems/` | false | N |
| `100-gradients` | fffx | 100 Gradients | `https://fffx.cabinetofcuriosities.in/deep-studies/100-gradients/` | false | N |
| `students-creative-coding-2025-26` | teaching | Student Work - Creative Coding | `teaching/ssd-creative-coding-2025-26/` | true | Y (SSD Creative Coding) |
| `students-emergent-technology` | teaching | Student Work - Emergent Technology | `teaching/#emergent-technology` | true | N |
| `teaching-approach` | teaching | History & Approach | `--` | false | -- |
| `gujarati-type` | visual-field-notes | Gujarati Type | `--` | false | -- |
| `doors-of-kutch` | visual-field-notes | Doors of Kutch | `--` | false | -- |
| `kochi` | visual-field-notes | Kochi | `--` | false | -- |
| `makings-3d-printing` | machines-makings | 3D Printing | `3dp/3DP_2019/` | false | N |
| `makings-origami-paper` | machines-makings | Origami & Paper | `makings/origami-paper/` | false | Y (Origami & Paper) |
| `makings-lasercutting` | machines-makings | Lasercutting | `makings/lasercutting/` | false | Y (Lasercutting) |
| `looms` | machines-makings | Looms | `makings/mini_loom/` | true | Y (MiniLoom) |
| `drawing-machines` | machines-makings | Drawing Machines | `makings/drawing-machines/` | false | Y (Drawing Machines) |
| `branching-narrative` | web-tech | Branching Narrative | `webtech/emergent_twine/` | true | Y (Twine) |
| `dataviz` | data-interactions | Data Visualisations | `--` | false | -- |
| `writings-misc` | writings | Miscellany | `https://bookshelf.cabinetofcuriosities.in/my-writings/miscellany/` | true | Y (Miscellany) |
| `dot-mandala-tool` | web-tech | Dot Mandala Tool | `webtech/dotMandalaTool/` | true | Y (Dot Mandala Generator) |
| `tracery-bots` | web-tech | Tracery Bots | `webtech/traceryBots/` | true | Y (Tracery Bots) |
| `compass-n` | compass | About Me | `compass/about/` | true | Y (About Me) |
| `compass-e` | compass | Now | `compass/now/` | true | Y (Now) |
| `compass-s` | compass | Colophon | `compass/colophon/` | true | Y (Colophon) |
| `compass-w` | compass | Site map | `compass/sitemap/` | true | Y (Site Map) |
| `teaching-research` | teaching | Research & Interests | `--` | false | -- |
| `swatch-fields` | web-tech | Swatch Fields | `swatch-fields/` | true | Y (Swatch Fields) |
| `working-with-ai` | teaching | Working with AI | `teaching/working-with-ai/` | true | Y (Working with AI) |
| `prompt-generator` | teaching | Prompt Generator | `teaching/prompt-generator/` | true | Y (Prompt Generator) |
| `oblique-strategies` | teaching | Oblique Strategies | `teaching/oblique-strategies/` | true | Y (Oblique Strategies) |
| `fab-academy` | fab | Fabacademy | `https://fabacademy.org/2023/labs/riidl/students/jesal-mehta/` | true | Y (Jesal's Fabacademy Website (2023)) |
| `fabricademy` | fab | Fabricademy | `https://class.textile-academy.org/2026/jesal-mehta/` | true | Y (Jesal's Fabricademy Website (2026)) |
| `fab-23` | fab | Fab 23 Bhutan | `--` | false | -- |
| `fab-26` | fab | Fab 26 Czechia | `--` | false | -- |

## Flags

- **Nav entry with no TSV row**: "Fab 23 Bhutan" (`fab/fab23-bhutan.md`)
- **Nav entry with no TSV row**: "Fab 25 Czechia" (`fab/fab25-czechia.md`)
- **Nav entry with no TSV row**: "Trippy Gourmet" (`https://cabinetofcuriosities.in/tracery-bots/TrippyGourmetBot/`)
- **Nav entry with no TSV row**: "Mad Solutionist" (`https://cabinetofcuriosities.in/tracery-bots/MadSolutionistBot/`)
- **Nav entry with no TSV row**: "Notes on this site" (`compass/site_notes.md`)
- **TSV row with no nav entry**: section `writings` (`https://bookshelf.cabinetofcuriosities.in/my-writings/`)
- **TSV row with no nav entry**: entry `scifi` (`https://bookshelf.cabinetofcuriosities.in/scifi/`)
- **TSV row with no nav entry**: entry `asimov` (`https://bookshelf.cabinetofcuriosities.in/asimov/`)
- **TSV row with no nav entry**: entry `vera-molnar` (`https://fffx.cabinetofcuriosities.in/recreating-the-past/vera-molnar/`)
- **TSV row with no nav entry**: entry `circle-packing-library` (`https://fffx.cabinetofcuriosities.in/tools-and-libraries/circle-packing-library/`)
- **TSV row with no nav entry**: entry `students-emergent-technology` (`teaching/#emergent-technology`)
