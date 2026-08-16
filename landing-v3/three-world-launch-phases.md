# Cabinet / Bookshelf / FFFX Launch Phases

## Phase 1 — Go for Launch

Goal: get all three worlds publicly coherent, stable, and navigable.

### Cabinet
- Finish the V3 landing-page launch pass:
  - final colour/type choice;
  - fix obvious label overflow;
  - integrate sea serpent if included at launch;
  - finish or consciously defer flowfield particles;
  - desktop/mobile QA.
- Promote `landing-v3-prototype` into the production Cabinet structure.
- Align the landing-page hierarchy with `mkdocs.yml`.
- Finish essential personal pages:
  - About Me;
  - Contact;
  - any other page necessary for the site to feel complete at launch.
- Implement the first multi-repo assembly, beginning with Working with AI.
- Change public links from `jesalmehta.github.io/...` to Cabinet-local paths where assembled.

### Bookshelf + FFFX
- Review both repos for last-minute updates.
- Audit current section/entry TSVs against work that already exists.
- Link any obvious existing work that should already be represented.
- Do not hold launch for unfinished/WIP entries that are intentionally marked as such.
- Verify current standalone pages/interactives and subdomain deployment.

### Cross-world launch checks
- Verify Cabinet, Bookshelf and FFFX link to each other correctly.
- Verify custom domains/CNAMEs.
- Check visible landing links, MkDocs navigation, nested routes and assets.
- Confirm failed builds do not replace the last successful live deployment.
- Merge/tag/deploy the launch version.

**Launch threshold:** all three worlds feel intentional and usable; visible doors lead somewhere meaningful; no major navigation or deployment failures remain.

---

## Phase 2 — Immediately After Launch

Goal: complete the obvious structural gaps and make the three-world system easy to maintain.

- Add/finish:
  - fuller About/site-context pages;
  - Colophon;
  - Site Notes where useful;
  - at least a basic landing/overview page for every active top-level section.
- Link existing pages/projects that were not essential enough to block launch.
- Continue selective migration of worthwhile older Cabinet content.
- Expand Cabinet multi-repo assembly beyond Working with AI:
  - Student Work;
  - Rock Collection;
  - Dupatta Collection;
  - other substantial independent projects.
- Build TSV editors for:
  - Cabinet;
  - Bookshelf;
  - FFFX.

### TSV editor requirements
- add/edit/delete sections and entries;
- validate required fields;
- manage order, weight, status, tags and links;
- catch duplicate IDs and invalid section references;
- preserve each world's own schema rather than forcing one universal schema.

### Infrastructure/documentation
- Generalize Cabinet assembly into a manifest-driven workflow.
- Add stronger validation before deploy.
- Normalize duplicated documentation where Bookshelf/FFFX docs have drifted.
- Replace obvious placeholder metadata/thumbnails where easy.

**Phase 2 threshold:** the sites are not just launched; they are maintainable, documented and structurally complete enough for routine publishing.

---

## Phase 3 — Three-World Projects and Updates Plan

### Phase 3A — Short-Term / Already Underway

Goal: finish and surface work that is already substantially in progress.

Across all three worlds:
- complete near-finished projects;
- link existing but currently unlinked pages;
- add obvious missing entries/sections to TSVs;
- add current independent repos to Cabinet assembly;
- fill small metadata/thumbnail gaps;
- clean up cross-world links.

#### Cabinet
- current Teaching pages;
- Student Work;
- near-finished galleries;
- existing Travel material;
- active standalone project integrations.

#### Bookshelf
- existing writing/interactives already represented in the current structure;
- strengthen links to current static projects and content pages;
- finish easy dormant/WIP entries where source material already exists.

#### FFFX
- prioritize current WIP portals and already-active computational/generative projects before inventing new categories.

**3A principle:** low-effort, high-value work that makes existing projects visible and complete.

---

### Phase 3B+ — Long-Term Development

Goal: treat all three worlds as ongoing publishing systems rather than projects waiting to be “finished”.

#### Cabinet
- add new Teaching material;
- expand Student Work;
- add Travels and Galleries;
- integrate new independent repos;
- refine V3 visuals as real content stresses the layout.

#### Bookshelf
- add writing/research entries;
- expand interactive reading/timeline projects;
- refine curation, metadata and visual treatments;
- explore longer-term alternate views or filters.

#### FFFX
- complete WIP portals;
- add new computational/generative work;
- consolidate and document experiments;
- refine sections, taxonomy and visual systems.

#### Cross-world
- improve shared schema conventions where useful;
- improve cross-linking and discovery;
- automate child-repo rebuild triggers;
- consider Atlas → public-site tooling;
- improve search, accessibility, performance and metadata;
- use Cloudflare routing only where a future project genuinely needs it.

---

## Summary

**Phase 1 — Launch:** make Cabinet, Bookshelf and FFFX coherent, linked, stable and publicly ready.

**Phase 2 — Immediate post-launch:** fill structural/context gaps, build TSV editors, harden assembly and documentation.

**Phase 3A — Short-term projects:** finish and surface work already underway.

**Phase 3B+ — Long-term:** continue adding content and refining all three worlds as an ongoing system.
