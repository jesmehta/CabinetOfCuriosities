# Transition register — hosting, source, algorithms and data

Last updated: 20 October 2026. Records owner decisions from the migration discussion; pending items are not implementation authorization. Codex audits/reviews; Claude Code implements/tests; the owner approves pushes, credentials, account permissions, visibility and production changes.

## Transition types

| Type | Purpose | Completion evidence |
| --- | --- | --- |
| Hosting and repository privacy | Keep the website public while selected GitHub source becomes private | Local build, filtered portable artifact, preview, automatic/private-source deploy, domain/link checks and manual recovery |
| Algorithm protection | Separate sensitive computation from the publicly delivered UI | One private platform-neutral core, local UI and CLI/batch where applicable, optional thin server API, no core modules in public assets/maps, performance and recovery tests |
| Browser-based/local-first | Run computation on the laptop or visitor's browser | Local/website behaviour and dependencies documented; no algorithm secrecy claim |
| Image/data publication policy | Decide which originals, derivatives or records may reach visitors | Explicit inventory, approved access/publication boundary and artifact/API inspection |
| Intentionally open source | Retain deliberate public source distribution | Confirm scope and dependencies before any related repo changes |

Repository privacy, website access and algorithm protection are separate decisions. Public browser-delivered JavaScript, images and data can be inspected/copied. A hidden navigation entry is not access control. Hosting configuration normally covers a whole site/artifact, including its many pages; it does not require one deployment per page. FFFX's protected projects can stay in its private repository; separate repositories are not required.

## Hosting and repository decisions

| Repository/project | Agreed policy | Status / next action |
| --- | --- | --- |
| Bookshelf of Curiosities (`TheBookshelfOfCuriosities`; BoC) | Private source, public site | Next: Codex audit of MkDocs, galleries, CMS, paths, domain and sitemap maintenance dependencies |
| Form Follows f(x) (`form-follows-fx`; FFFX) | Private source, public site | After Bookshelf; preserve editing/landing workflows and protected-project publication gates |
| Cabinet of Curiosities (`CabinetOfCuriosities`; CoC) | Private source, public site | Last of the three worlds; audit assembly, credentials, sitemap, output exclusions and main-domain impact |
| Dot Mandala (`DotMandalaGenerator`) | Private source, public site | Hosting/privacy pilot complete; independent review at `56b607ab7cfc5d943c20d17614c836cd6cf989c9`. Algorithm protection remains separate and pending |
| Interactive Installations (`interactive-installations`) | Browser-based/local-first; visibility not decided here | Do not infer public source from the decision to leave algorithms unprotected |
| Origami Tools (`origami-tools`, including Kirigami) | Keep sensitive source private; local use is the priority | No public live tool required; assess actual current visibility before any change |
| Circle Packing (`p5-circle-packing`) | Keep open | Preserve deliberate library/source distribution |
| SwatchFields (`swatchFields`) | TBD | Possible open Colour Wheel and closed Mosaic split; not approved. Review Fabricademy context and dependencies first |
| Warli Art Explorer | TBD | Assess images separately from application code; exact repositories/assets and rights still need inventory |
| DataSelfies | TBD | Assess public UI separately from private underlying data; exact repositories/datasets still need inventory |
| Other recent projects | Not yet classified | Inventory recent work and record a decision per project; omission does not imply public/private status |

## Algorithm-protection workstream

These are the selected protection targets, not completed conversions or authority to refactor during hosting migration. Follow [the protected-tools architecture](future-protected-tools-architecture.md).

| Project | Intended transition | Constraints / publication gate |
| --- | --- | --- |
| FFFX — Dance of Planets | Sensitive algorithm separated from public UI | Audit the calculation/rendering boundary and latency. Keep existing publication gate until protected output is verified |
| FFFX — Island Generator | Sensitive algorithm separated from public UI | Same gate; verify no protected modules leak via FFFX's site build or copied project tree |
| Dot Mandala | Sensitive algorithm separated from public UI in a later project | Current public browser implementation remains exposed. Completed static hosting migration does not complete algorithm protection or withdraw earlier public copies |
| Origami Tools | One private core shared by local interfaces and batch generation; optional public API/UI later | Preserve offline/local use and repeatable parameter sweeps (including approximately 175 variants). Public article/results may suffice; do not require a live tool |

Protect the computational core with one implementation. Keep Cloudflare bindings and browser DOM code outside it. Preserve local operation and a Node CLI/batch interface where useful. Public endpoints expose parameters, outputs and observable behaviour; source protection is not output secrecy. Benchmark interactive workloads before choosing the boundary.

## Interactive Installations — explicit exception

Live Video Filter and Gesture Kaleidoscope remain browser-based with **no frontend/backend protection split planned now**. Laptop use supports local/projected installations; website versions may be interactive screen toys. Do not send camera feeds to a server as part of this migration. Revisit latency, privacy and protection only if a later use case warrants it. This is independent of repository visibility, which remains undecided in this register.

## Unresolved image/data boundaries

- **Warli Art Explorer:** decide whether to keep originals private, publish selected/lower-resolution derivatives, restrict viewing, or leave assets open. Images shown publicly remain copyable; moving storage behind an API does not hide delivered pixels.
- **DataSelfies:** classify raw records, identifying/sensitive fields, derived data and public visualisations. Consider approved aggregates or precomputed outputs; do not assume a public UI can use raw private data without disclosing it through requests/responses or assets.
- **SwatchFields:** decide whether Colour Wheel/Mosaic need separate modules, publication artifacts or repositories only after inspecting the actual source and teaching/Fabricademy obligations. No split is authorized by this note.

## Sequence and next actions

Discussion and architectural clarification: [World assembly and deferred tools](world-assembly-decisions.md). Each world can assemble MkDocs pages, internal projects and selected external repositories into one artifact/deployment. FFFX can defer algorithm separation while excluding the two protected tools from hosting output; capture the exclusion in its reviewed implementation plan. Do not hardcode external assembly as a Cabinet-only capability.

1. Hosting: Dot Mandala complete → Bookshelf audit/implementation/review → FFFX → Cabinet. Reuse the pilot's process, not assumed build commands or output directories.
2. Keep algorithm protection as separately scoped per-tool work. FFFX hosting can proceed while gated tools remain unpublished; audit the actual output because hiding links alone does not protect files.
3. Resolve SwatchFields, Warli and DataSelfies individually before source visibility or publication changes.
4. Inventory other recent projects, recording current visibility, deployment, intended audience, sensitive code/assets/data and proposed transition type.

No code, visibility, hosting, DNS or publication change is authorized merely by inclusion in this register.
