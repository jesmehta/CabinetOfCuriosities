# MetaAnalysis of execution

This is a historical reconciliation of the launch todo with the work that
actually landed in Git. It answers two different questions:

1. Which work was selected from an item that already existed?
2. Which work entered through another door -- a maintainer request, visual
   review, a bug or dependency discovered mid-task, or documentation/repo
   housekeeping -- and was either recorded afterward or never given its own
   numbered item?

The timeline begins on 2026-08-07, when the first explicit v3 punch list was
committed in `dad6461`. Older commits are ordinary pre-checklist project
history and are outside this comparison. Merge commits and documentation-only
status commits are omitted unless they materially establish when a todo
existed. Closely related implementation commits are grouped into one row.

## Origin classification

| Origin | Meaning |
|---|---|
| **Todo-led** | Work began by selecting an existing todo item. |
| **Maintainer-led** | The maintainer initiated the work outside the existing todo. This includes documentation, review, tooling, and repository-hygiene requests. |
| **Surfaced during work** | A bug, missing step, design consequence, or adjacent need was discovered while another task was being executed. |

Where a grouped episode has more than one origin, the `Origin` cell gives the
sequence explicitly: for example, `Todo-led → surfaced fixes`. It does not use
`Mixed` as a standalone classification. Items recorded only after work began
are described as retrospective rather than treated as todo-led.

Git establishes ordering and content but does not always preserve who first
asked for a change. Maintainer confirmation therefore supplements the commit
record where available. In particular, the deploy-comment simplification and
deeper-doc link work (`a5713d8`) was maintainer-led, not agent-initiated.

“No prior todo” does not mean “unplanned” or “unauthorized.” It means only
that the numbered checklist was not the entry point. Broad perpetual items
such as `#87` (“complete near-finished projects”) are not treated as prior
authorization for every later commit; the mapping uses the most specific item
that actually existed at the time.

## Timeline

| Date | Work that landed | Origin | Prior todo relationship | How it entered / evidence in Git |
|---|---|---|---|---|
| 2026-08-07 | Fixed-distance wave rings, centroid-pull scatter, and `flatColourMode` (`41b056a`) | Maintainer-led | **No prior numbered todo.** These changes immediately preceded the first checklist. | The first punch list was committed afterward in `dad6461`, explicitly as a cross-machine handoff after v3.6.4-v3.6.6. |
| 2026-08-07 | First visual-polish and documentation-survey todo lists (`dad6461`) | Maintainer-led | Establishes the baseline that later work can be compared against; its original items later became `#1-#28`. | The commit says the two lists came from the active punch list and a documentation survey, not from completed Git work being reconstructed wholesale. |
| 2026-08-08 | Reroll positions, wave/band switching, topology controls, stronger centroid control (`d33f4e0`) | Todo-led | `#5`, `#6` tier 1, `#7`, `#8`. | All four asks existed in `dad6461` before implementation. The panel’s broader collapsible reorganization was an execution-level design choice within that work. |
| 2026-08-08 | Full-bleed canvas and header-over-map experiment (`362b5d0`) | Todo-led | `#12`, `#13`. | The commit subject itself identifies the original punch-list items. |
| 2026-08-08 | Move `extraCount` into the TSV; remove dormant coming-soon machinery (`38f2c5b`) | Surfaced during work | **No specific prior todo.** | Schema/file-count cleanup arose from the developing v3 content pipeline. It was never assigned an independent numbered item. |
| 2026-08-08 to 2026-08-10 | Record header-markup duplication, add a header-refinement item, then move the header back to normal flow and add clickable sections/hover glow (`ad12925`, `600fa8c`, `c471e01`) | Todo-led (`#14`) → maintainer-led expansion → surfaced risk | Header refinement became `#14` before its implementation; clickable sections and real-shape visual feedback had **no separate prior item**. | A known risk and new todo were logged after reviewing the first header experiment. The subsequent visual interaction work expanded beyond that item. |
| 2026-08-10 | Multi-theme colour/type comparison system (`ec781e4`) | Todo-led | `#6` tier 2 and `#10`. | The original list explicitly proposed whole look-and-feel presets and a typography/colour/readability pass. |
| 2026-08-14 | Add Teaching/Emergent content and Cabinet custom-domain CNAME (`54635a3`, `6364fce`) | Maintainer-led | **No matching numbered item yet.** Phase 1 had not been committed in its later checklist form. | These were direct content/deployment changes. Later items such as `#49`, `#56`, `#89`, and `#93` describe related territory but were not their entry point. |
| 2026-08-16 | Flow field and boat-particle system (`0d0b929`, `ff426ef`) | Todo-led | `#3`, `#4`. | Both asks were in the 2026-08-07 punch list. |
| 2026-08-16 | Coastal spawning, tuning controls, and particle “personality” experiments (`d1e1e9c`, `997f494`) | Surfaced during work | Extensions of `#3/#4`, but **not separate prior todos**. | These changes respond to uneven distribution and shared-drift behaviour found while implementing and reviewing the particle system. |
| 2026-08-16 | Sea dragons from maintainer-supplied `dragon.svg`, plus movement/coast fixes (`b9f82bc`) | Todo-led (`#1`) → maintainer-unblocked → surfaced fixes | `#1` existed but was blocked on a reference. | The todo supplied the goal; the maintainer unblocked it by supplying artwork, while the bobbing and coast-clearance fixes surfaced during implementation. |
| 2026-08-17 | Real-shape island/section hover hit areas and inverted label colours (`a5a7597`) | Maintainer-led | **No specific prior todo.** | The commit records four scope/design questions answered before code, indicating a live review-driven feature rather than selection from the punch list. |
| 2026-08-17 to 2026-08-19 | MedieRiso and subsequent theme/label refinements (`8894eff`, `0784739`, `c17591d`, `e712045`) | Todo-led (`#6/#10`) → maintainer-led refinements → surfaced fixes | Continues `#6/#10`; detailed retuning and the per-theme colour editor had **no individual prior items**. | The preset system was todo-led, while the exact theme, colour corrections, section-label behaviour, and editor grew through visual review. |
| 2026-08-22 | Compass rose replaces About Me; reserved placement, grid and WIP-entry fixes (`1f1b9a5`, `dd2824e`) | Todo-led (`#11/#16`) → maintainer-led design → surfaced fixes | Broadly `#11` and `#16`. | The ornament/About-link concept existed, but the concrete direction system, reserved layout, grid, and WIP correction emerged as the feature was designed and reviewed. |
| 2026-08-23, morning | Coastal bands/shadows, compass rounds, theme cleanup, diagnostics, label effects, and many visual bug fixes (`ad57dcc` through `4fca421`) | Maintainer-led → surfaced fixes → retrospectively logged | Most had **no prior individual todo**. `#29` and related Phase 0 items were logged only afterward in `05295f2`. | Git shows the implementation series completing before the commit that added launch punch-list items `#28-#33`; these are therefore retroactive records, not todo-led starts. |
| 2026-08-23, afternoon | Theme × hover prototype and iterations (`b24528c` through `12335ac`) | Todo-led (`#31`) → surfaced fixes | Started from `#31`, which existed before the first implementation commit. | The initial mechanism was checklist-led; silent sliders, camouflage, clip conflicts, blur bleed, wrong sea colour, reset controls, and diagnostics surfaced during execution/review. |
| 2026-08-23, evening | Refresh static output and correct missing `data-theme` (`829f1f9`, `8df193c`) | Todo-led (`#33`) → surfaced production bug | Static refresh was `#33`; the missing-theme production bug was discovered during that work. | One planned build step exposed an unplanned correctness bug. |
| 2026-08-23, evening | Build and repair browsable v1/v2 archives (`a4b2bfe`, `6598007`, `a516220`) | Todo-led (`#18`) → surfaced fixes and follow-ups | `#18`. | Archive creation was planned. The missing v2 script, nested anchors, and archive-page restructuring arose during validation. `#61/#62` were split out afterward to track the newly clarified remaining work. |
| 2026-08-23, evening | Promote v3 to production, CNAME, merge to `main`, and production-font repair (`b8445b5`, `d39fec4`, `7f3a638`, `19a1d25`) | Todo-led (Phase 1) → surfaced production bug | `#40`, `#45`, `#47-#50` and the broader launch sequence. | Promotion/deploy came from Phase 1. The missing Medieval Map fonts were a production defect discovered after promotion. |
| 2026-08-23 to 2026-08-24 | Put boats/dragons on production; sticky/full-width header; compass theme swapping/spin; structural Topology layer; compass-label fix (`485fca8`, `47a2e5a` through `8e28f59`) | Todo-led/retrospectively logged asks → maintainer-led iteration → surfaced fixes | Production particles resolve `#64`; sticky header is `#60`; compass interaction grows from `#21/#29`. Several detailed fixes had **no prior item**; `#65` was logged in the same commit as its fix. | This sequence began from recorded asks but was dominated by live feedback and defects found while iterating. `#64/#65` function partly as after-the-fact records. |
| 2026-08-24 | First Working with AI assembly (`52b7069`) | Todo-led | `#43`, feeding `#44/#46/#50`. | Explicit Phase 1 deployment work. |
| 2026-08-24 | Colophon scaffold and live archive links, then missing v2-history substages (`58297d6`, `45d8ca3`) | Todo-led (`#20/#61/#62`) → surfaced omissions | `#20`, `#61`, `#62`. | The first commit addresses existing items; the four omitted archive substages were noticed and added immediately afterward without a prior separate todo. |
| 2026-08-24 | Simplify deploy-file comments and link the deeper docs (`a5713d8`) | Maintainer-led | **No specific prior todo.** | Documentation/maintainability cleanup adjacent to multi-repo assembly. |
| 2026-08-24 | MkDocs hierarchy, Teaching entries, expanded assembly, Bookshelf/FFFX split and landing pages (`1fd86a0`, `bc6053d`, `5aec2e7`) | Todo-led (`#41/#44/#46`) → maintainer-led scope expansion (`#71/#72`) | `#41/#44/#46` were prior items. `#71/#72` capture the larger content/nav expansion taken up during the same review period. | The hierarchy work was planned; the exact Teaching roster, cross-listing, and three-world split were maintainer-directed scope expansion rather than old checklist detail. |
| 2026-08-24 | Add Fab section (`0aba4ad`) | Maintainer-led | `#123` was created as a record of the completed intercession; it was not a prior task. It also explicitly overrides the older `#27` assumption. | Commit subject calls it a “`#27` intercession,” and the current todo says it was a direct addition. |
| 2026-08-24 | Make completed todos collapsible and repair CommonMark block spacing (`7410528`, `48928da`) | Maintainer-led | **No prior numbered todo.** | Checklist usability work, followed by a rendering bug found in the first implementation. |
| 2026-08-24 | Add the before/after review folder, mistakenly add `dev-archive`, revert a colour attempt, then correct the duplicate archive convention (`ecdb0d6`, `9292017`) | Surfaced during work | `#124` records the review workflow after it was introduced; `#125/#126` were opened from the mistake/correction, not before it. | The current todo explicitly says the review folder was added proactively and that the redundant archive prompted broader organization/documentation items. |
| 2026-08-24 to 2026-08-27 | Algorithm Bench/v3-history archive and four compass links, cross-machine recovery and branch cleanup (`10f8aa7`, `16ab802`, `b1759f7`, `d417b71`, `2693806`, `fa9635d`) | Todo-led feature work → surfaced branch recovery (`#127` retrospective) | Archive/compass work relates to `#18/#61/#73`; branch recovery became `#127` only as a historical record. | Feature work was partly checklist-related. The bad merge, reverts, restored content, trailer cleanup, and branch hygiene were operational consequences, not pre-existing tasks. |
| 2026-08-27 | Assemble Swatch Fields and Tracery Bots under the custom domain (`4a1a9ec`) | Maintainer-led | `#128` was logged as done after a direct question exposed external GitHub Pages URLs. Broad `#80/#90` existed, but did not specify this work. | The current todo records the triggering maintainer question and the five URLs found during the audit. |
| 2026-08-27 | Document the assembly rebuild gotcha; add and promote Emergent Technology (`a42bc89`, `eccdd8a`, `ed45d15`) | Surfaced assembly gotcha → maintainer-led content addition | **No specific prior item.** Emergent broadly resembles `#89/#93`, but those remained generic and unchecked. | One is a maintenance consequence of assembly; the other is a concrete content addition made directly. |
| 2026-08-29 | Build `/now`, its TSV pipeline and local editor; later migrate it into MkDocs (`9c6ec9e`, `00474a6`, `ef21778`) | Maintainer-led | Only the compass destination portion maps to `#73`. The page/editor architecture had **no specific prior numbered item**; `#81` concerns the three world TSV editors, not `/now`. | A standalone feature was created, then its delivery model changed in response to review. |
| 2026-08-29 | Wire Site map and finish the four compass destinations (`af5c729`) | Todo-led | `#73`. | Direct completion of the recorded compass-direction decision. |
| 2026-08-29 | Execute the five-step file/folder reorganization (`06a3813`, `8987cb6` through `fbe1acf`) | Todo-led | `#129-#133`. | The plan commit precedes all five implementation commits, making this the clearest later example of checklist-first execution. |
| 2026-08-29 | Add `FILE-MANIFEST.md` and gather documentation/SVG sources (`18ee252`, `3deae8b`) | Todo-led reorganization context → surfaced documentation needs | Broadly related to `#121/#122/#125`; follow-up move was recorded as `#134` during completion rather than selected earlier as that numbered item. | The manifest and misplaced-source discoveries arose from the reorganization audit. |
| 2026-08-29 | Add Cloudflare analytics to Cabinet and its archives (`66185aa`, `511d819`) | Maintainer-led | **No prior todo.** `#135/#136` were added afterward for the still-unfinished sibling/external-repo rollout. | The current todo explicitly describes Cabinet as already done before defining the remaining rollout. |
| 2026-08-30 | Cabinet TSV editor and five rounds of UI/refactor work (`2f84a63`, `7b76a79`, `d546d5c`, `c1a8f8f`, `a6f4b7c`) | Todo-led (`#81`) → maintainer-led iteration → surfaced fixes | `#81` supplied the editor goal. | Core editor work is planned; shared-module cleanup, sortable/resizable columns, compact mode, and overflow/sort fixes grew through implementation and maintainer feedback. |
| 2026-08-30 | Generate Content Inventory from source data (`ee32b87`) | Todo-led | `#126`. | A direct execution of the documentation-splitting item, with generation chosen to eliminate repeated staleness. |
| 2026-08-30 | Establish `launch-beta` / `launched` milestones (`4449301`) | Todo-led | `#59`. | Resolves the existing merge/tag/deploy naming ambiguity. |
| 2026-08-30 | Add real semantic `h2/h3` outline and promote it (`8d86ea1`, `afaa7d1`) | Todo-led | `#70`. | The item was investigated earlier, prioritized, then explicitly implemented. |
| 2026-08-30 | Create the documentation standard, feature conversation logs, sitemap docs, and reorganize docs by feature (`716392c` through `29e5411`) | Maintainer-led | Broadly adjacent to `#122/#126`, but this specific four-part documentation standard and folder model were requested directly and were not a prior numbered task. | Commit bodies preserve the maintainer’s documentation requirements and the audit/correction loop; this is a separate initiative rather than merely closing the old broad items. |
| 2026-08-30 | Automate landing-page promotion with `promote.mjs` (`cd4c9f1`) | Surfaced during work | **No prior todo.** `#138` later records updating the diagram to show this new stage. | The missing promotion automation was exposed by the documentation/AI-dependency audit and by a previously shipped bad manual copy. |
| 2026-08-30 | Add and iterate the Admin Controls dashboard (`57f16dc`, `93a4e39`, `74b16a2`, `421d683`, later renamed in `d2bc429`) | Maintainer-led | **No prior numbered todo.** | It came from the request for one place to operate every unbuttoned script; table grouping, styling, documentation, and naming followed from live maintainer review. |
| 2026-08-30 | AI Dependency Audit (`1f0f512`) | Maintainer-led | **No prior numbered todo.** | The audit documents where manual/AI memory still substituted for tooling and directly surfaced `promote.mjs`, Admin Controls gaps, and remaining risks. |
| 2026-08-30 | Correct and regroup backend/deploy documentation (`2a24717`, `d0390a1`, `7552b9b`) | Surfaced during work | Related to the earlier reorg and documentation initiative, but **not taken from a still-open specific item**. | The moves correct collateral misplacement discovered while applying the new documentation taxonomy. |

## What the comparison shows

The todo was strongest as a launch backbone: the flow field/boats, themes,
production promotion, first multi-repo assembly, archive/colophon work,
file reorganization, Cabinet editor, generated inventory, launch naming, and
semantic heading work all have clear checklist-before-implementation evidence.

It was less often the source of detailed visual development. Compass behaviour,
coastal effects, hover mechanics, fine theme work, and most bug fixes entered
through maintainer review or discoveries inside another task. The todo often
became the durable record afterward (`#64`, `#65`, `#123`, `#124`, `#127`,
`#128`, `#134`) rather than the trigger.

The largest wholly unnumbered stream is tooling/documentation infrastructure:
the `/now` system, Cloudflare’s first Cabinet rollout, the documentation
standard and conversation-log structure, `promote.mjs`, Admin Controls, and the
AI Dependency Audit. These were purposeful maintainer or process initiatives,
but the numbered launch list did not originate them.

That suggests the todo has served three roles at once:

- a forward plan for launch-critical work;
- a capture surface for requests and discoveries made during live sessions;
- a retrospective ledger for consequential work that needed a durable number.

For future history, adding a small `Origin` field when an item is opened
(`planned`, `maintainer request`, `surfaced during #N`, or `retrospective`) would
make this distinction recoverable without another commit-by-commit audit.

## Roles of the maintainer and the process

The history suggests that the three actors played quite different roles:

- the todo list provided continuity;
- the process produced discovery;
- the maintainer supplied direction and judgment.

### The maintainer

The maintainer's role was larger than simply choosing tasks:

- **Creative director** -- setting the visual and conceptual direction: sea
  dragons, compass behaviour, themes, map semantics, Fab, `/now`, and the
  overall character of the site.
- **Editor and critic** -- reviewing intermediate results and noticing when
  something was technically functional but conceptually or visually wrong.
- **Priority setter** -- deciding what mattered now, what belonged on the
  backburner, and what was good enough to launch.
- **Scope authority** -- determining whether an emerging issue deserved
  expansion, deferral, reversal, or its own todo.
- **Institutional memory** -- catching incorrect assumptions about earlier
  intentions, existing folders, naming, and relationships among the three
  worlds.
- **Reality check** -- supplying facts or assets the repository alone could
  not provide, such as `dragon.svg`, intended program relationships, or
  whether work was maintainer-initiated.
- **Product owner** -- defining what "launched," "complete," and "coherent"
  actually meant. Git and tests could verify deployment, but not whether the
  site was ready to be publicly shared.

### The process

The process acted less like execution of a fixed plan and more like an
exploratory design loop:

> request or todo → implementation → visible result → maintainer judgment →
> correction or expansion → verification → documentation

Its principal roles were:

- **Discovery mechanism** -- many important needs only became visible after
  something real existed.
- **Error detector** -- implementation surfaced hidden assumptions,
  production-only failures, stale documentation, missing scripts, merge
  problems, and accessibility gaps.
- **Specification generator** -- vague intentions became precise through
  prototypes and feedback. The process often produced the real specification
  after the first attempt.
- **Integration test** -- work on one feature repeatedly exposed consequences
  elsewhere: deployment affected archives, navigation affected assembly,
  documentation exposed missing tooling, and file organization exposed stale
  references.
- **Memory-production system** -- commits, changelogs, conversation logs,
  screenshots, and todos converted transient discussions into maintainable
  project knowledge.
- **Tooling incubator** -- repeated manual friction produced editors,
  `promote.mjs`, Admin Controls, generated inventory, and documentation
  standards.

### Their relationship through the todo

The todo's most important relationship to these roles was not
command-and-control. It served as a boundary object between them:

- the maintainer used it to preserve intent and priorities;
- the process fed discoveries and follow-ups back into it;
- Git supplied evidence of what actually happened;
- documentation supplied the reasoning that neither Git nor checkboxes could
  preserve.

The maintainer led the project's meaning, while the process progressively
revealed its technical shape. The todo mediated between those two.

This also explains why so many timeline entries have compound origins. It is
not evidence of poor planning. In an exploratory visual and architectural
project, the maintainer often cannot make the next good decision until an
implementation exists to react to. The process is therefore partly execution
and partly a medium through which design decisions are made.

The historical risk is that retrospective entries can make the work look more
plan-driven than it really was. A completed numbered item may suggest "this was
selected, then executed," when the actual sequence was:

> maintainer request → experimentation → discoveries → shipped result → todo
> entry added as durable record

That distinction is worth retaining. It shows that the maintainer was not
merely administering a queue, and the process was not merely carrying one out.
The maintainer steered through judgment; the process generated evidence; the
todo preserved the resulting commitments.
