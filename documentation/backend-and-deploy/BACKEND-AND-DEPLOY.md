# Backend & Deploy — As-Built Notes

Technical reference for the repo-wide/backend work that doesn't map onto
one page or tool: the current file/folder structure (result of the
2026-08-29/30 reorg), the deploy pipeline, and the launch milestone
scheme. Companion to `conversation-backend-and-deploy.md` (the why) in
this same folder.

Cloudflare Web Analytics and the multi-repo assembly mechanism each
already have their own full technical doc, also in this folder — this
page links to them rather than duplicating:

- [`cloudflare-web-analytics-setup.md`](cloudflare-web-analytics-setup.md)
- [`cabinet-multi-repo-assembly-concept-note-short.md`](cabinet-multi-repo-assembly-concept-note-short.md)
- [`three-world-launch-phases-ToDo.md`](three-world-launch-phases-ToDo.md) / [`three-world-launch-phases-Notes.md`](three-world-launch-phases-Notes.md) — the master to-do tracker and its supporting rationale; this doc summarizes only the reorg/launch-milestone items, the tracker has the full item-by-item history.

## Repo structure, as of the 2026-08-29/30 reorg

Only two `.md` files are root-required: `README.md` (git/GitHub
hosting convention — root is where it renders) and `WORLD-SYSTEMS.md`
(byte-identical across Cabinet/Bookshelf/fffx, so it can't move without
desyncing the other two repos). Everything else that used to sit at
root moved into `documentation/`.

Top-level layout:

- `docs/` — the live MkDocs site + `index.html` (static build,
  promoted from `landing-v3/`).
- `content/` — canonical TSV data sources.
- `tools/` — build/authoring scripts, never shipped to `docs/`.
- `landing-v3/` — the v3 map's dev/build system, regrouped by actual
  import-graph role (not file type) into `dev-tool/` (never ships),
  `layout-engine/` (build-time only), and `shared/` (imported at build
  time and shipped to production).
- `documentation/` — one folder per feature/subsystem with more than
  one doc file (`now/`, `cabinet-editor/`, `landing-v3-notes/`,
  `sitemap/`, `backend-and-deploy/` — this folder); single-file topics
  and repo-wide indexes stay flat at `documentation/` root. See
  `DOCUMENTATION-GUIDE.md` for the standard and `FILE-MANIFEST.md` for
  the exhaustive per-file map.
- `archived-landing-pages/` — frozen `v1/`/`v2/`/`v2-history/`
  `v3-history/`/`algorithm-bench/` snapshots, kept outside `docs/` so
  MkDocs never builds them as live pages.
- `overrides/` — MkDocs Material theme override (`main.html`, injects
  the Cloudflare beacon).
- `review/` — gitignored, screenshot-review working files.

Full move-by-move history (five items, one per reorg step, each with
its own verification gate) is `three-world-launch-phases-ToDo.md`
`#129`–`#134`. The gist: a `pre-file-reorg` git tag was cut as a
rollback point before anything moved; dead v1/v2 code already
byte-identical to the archive was deleted; legacy root files
(`LANDING-PAGE-NOTES.md`, `DESIGN-SYSTEM.md`, the v2 map-source
generator) relocated into `archived-landing-pages/v2/`; `landing-v3/`
internals regrouped by real `import`/`<script src>` graph tracing
(catching a hardcoded Playwright URL that a doc-search-only pass would
have missed); and finally, root-level project documentation gathered
into `documentation/`.

## `docs/` asset reorganization (2026-09-02)

`docs/` mixed hand-authored content (pages, images) with system files
(promoted/generated CSS+JS, MkDocs Material theme extras, downloadable
attachments) across five flat top-level folders — `images/`, `assets/`,
`js/`, `stylesheets/`, `files/` — with no naming signal for which was
which. Reorganized around one convention: a leading underscore marks
"supporting files, not a browsable page"; unprefixed folders hold actual
`.md` content pages.

```text
docs/
  index.html, CNAME                 -- unchanged (GitHub Pages/MkDocs conventions)
  about.md, colophon.md, ...        -- content pages, unchanged locations
  3dp/, fffx/, makings/, teaching/   -- content page folders, unchanged
  _images/                          -- content images: avatar-photo.jpg, CirclePacking/,
                                        DotMandala/, FabLoom/, now/{reading,travel,found}/
  _downloads/                       -- downloadable page attachments (deploy.yml.txt,
                                        requirements.txt, linked from site_notes.md) --
                                        renamed from docs/files/, it's a content
                                        attachment, not a system file, despite the name
  _assets/
    material/{css,js}               -- hand-edited MkDocs Material theme extras
                                        (cabinet-material.css, extra.css, extra.js)
    backend/{css,js}                -- mostly machine-written: the v3 map's promoted
                                        CSS/JS, content/*.tsv-generated JS, /now config
```

`material/` vs. `backend/` is a subsystem split, not a type split — each
has a different owner and lifecycle (`material/` is small and hand-edited
directly; `backend/` is written by three separate pipelines:
`landing-v3/promote.mjs`, `tools/build-cabinet-content.js`, and the
now-editor), and each is nested subsystem-first (`material/{css,js}`,
not `{css,js}/material`) so a subsystem's CSS and JS sit next to each
other rather than split across type-first folders.

**Content pages were deliberately not relocated** in this pass — MkDocs
derives a page's live URL from its path under `docs/`, and this site has
external inbound links (FabAcademy pages, Colophon, the sitemap), so
moving pages into section folders (planned, eventually — e.g.
`compass/about.md`) is left for a separate, later move. That later move
doesn't undo anything here: MkDocs rewrites relative links (image `src`,
page `href`) from each page's own source location at build time, so a
moved page only needs an added `../` per nesting level in its own links —
`_images/`/`_assets/` don't need to move again or change name.

**What had to change to match** — beyond the folder move itself:
`mkdocs.yml` (`extra_css`, `extra_javascript`, favicon path — the
favicon reference was already broken/missing before this reorg, moved
for naming consistency only, not fixed), the `image` column in
`content/now.tsv` (site-root-absolute paths, `/assets/now/...` →
`/_images/now/...`), five content pages' relative asset links,
`.gitignore`'s per-file FabLoom entries, and every build script/tool
with the old paths hardcoded: `tools/build-cabinet-content.js`,
`tools/build-now-content.js`, `tools/now-editor.js` (+ its UI's
placeholder text and browser-side `import`), `tools/now-data-editor.js`,
`tools/cabinet-editor.js` (+ its UI's status text),
`tools/admin-controls.js` (+ its UI's step descriptions and gotchas
list), `landing-v3/promote.mjs` (destination dirs + its literal
path-rewrite table), `landing-v3/index.template.html`,
`landing-v3/layout-engine/build-render.html` and `cabinet-v3-layout.js`,
and `landing-v3/dev-tool/islands-tool.html`.

Two real bugs would have shipped silently if this had stopped at "move
the files, fix the obvious references": a stale `@import` inside
`cabinet-material.css` itself (pointing at the old sibling `assets/`
path, now two levels away) and a stale browser-side `import` in the
now-editor's UI script. Neither `mkdocs build --strict` nor
`promote.mjs`'s headless-Chromium check (which only loads
`docs/index.html`, not a MkDocs-rendered content page) catches a broken
CSS `@import` or a broken JS `import` — both were only found by a final
exhaustive repo-wide grep sweep for the old path fragments across every
file type, after the "obvious" fixes were already done and verified.
Full file-by-file mapping: `FILE-MANIFEST.md`'s `docs/` section.

**Verification**: the actual build/promotion pipeline was re-run end to
end rather than just eyeballing the moved files — `node
build-static.mjs` → `node promote.mjs` (headless Chromium, zero
console/request errors) → `node tools/build-cabinet-content.js` → `node
tools/build-now-content.js` → `mkdocs build --strict` (exit 0, only
pre-existing unrelated INFO-level nav warnings) — plus manual checks
that both a root-level page (`about.md`) and a nested one
(`fffx/PackingShapes.md`, exercising the `../` math) resolve their
images, downloads, and `extra_css`/`extra_javascript` correctly in the
rendered HTML.

**Cross-repo note**: `WORLD-SYSTEMS.md` documents `docs/assets/`,
`docs/stylesheets/` etc. as the *shared* convention across
Cabinet/Bookshelf/fffx, hand-synced byte-identical across all three
repos. Cabinet's `docs/` no longer follows it. Rather than rewrite that
shared doc from just one repo's perspective (Bookshelf's own `docs/`
still matches the old convention, verified directly against that repo),
`WORLD-SYSTEMS.md` was left with the shared convention intact plus a
short note flagging Cabinet's deliberate divergence — a decision, not
drift, so a future pass shouldn't treat either version as "more recent,
therefore correct" without actually revisiting whether Bookshelf/fffx
should adopt the same scheme.

## `docs/` content-folder reorganization (2026-09-03)

Follow-on to the asset reorg above, this time moving the content
*pages* themselves — deliberately excluded from that pass since it
changes live URLs (MkDocs derives a page's URL from its `docs/` path).
The target layout came from a separate planning session with a
different Claude instance ("Chirp", Atlas/project-assistant context,
read-only repo access) that has visibility into future planned content
this repo's own sessions don't — settled first, before any file moved,
specifically so the newer sections (webtech, writings, dataviz,
physComp, blog, travels, visual-field-notes) don't need a repeat reorg
once real content lands. Full record, including the planning
conversation itself: `conversation-backend-and-deploy.md` Part 6.

```text
docs/
├── compass/          about.md, colophon.md, now.md, sitemap.md, site_notes.md
├── teaching.md + teaching/       (unchanged)
├── makings.md + makings/         (unchanged, now also holds mini_loom.md)
├── 3dp/                          (independent -- not nested under makings/)
├── webtech.md + webtech/         (new umbrella, replaces creative_code.md;
│                                   absorbs dotMandalaTool.md, traceryBots.md,
│                                   trippyGourmet.md, emergent_twine.md)
└── fffx/                         (unchanged -- frozen, live, shrinking)
```

Six more section folders from the Atlas plan (`physComp/`, `writings/`,
`dataviz/`, `visual-field-notes/`, `blog/`, `travels/`) are reserved
names, not created here — they get made when real content for them
exists, not as empty scaffolding.

**What had to change to match** — this move touches more than
`mkdocs.yml`'s nav, because the live v3 map's own front-door data
points at these exact page URLs:

- `mkdocs.yml`'s nav paths, plus merging the old "Wild wild web" and
  "Interfaces, Data & Texts" headings into one "Webtech" heading
  (matching the file-level merge — same content, previously pitched
  two ways).
- **`content/cabinet-entries.tsv`** — 12 rows' `href` values pointed at
  moved pages (the Compass points, Looms, Branching Narrative, the
  `webtech`/`tracery-bots` entries). This is the v3 map's own link
  data, so fixing it required re-running `build-cabinet-content.js`
  and re-promoting the map (`build-static.mjs` → `promote.mjs`), not
  just an `mkdocs build`. `content/cabinet-sections.tsv`'s
  `interfaces-data-texts` section href also updated
  (`creative_code/` → `webtech/`); the section's own id/title was
  deliberately left unchanged — per the Atlas session's own stated
  principle, physical file location and TSV/nav labeling are separate
  concerns, only the `href` *path* needed to match reality.
- `makings.md`'s one internal link to `mini_loom.md` (would have
  silently 404'd once that file moved a level deeper).
- Every moved page's own relative links to `_images`/`_assets`/
  `_downloads` — one added `../` per nesting level, exactly the
  mechanism the asset reorg's own doc entry anticipated, confirmed
  correct in practice here, not just in theory.
- `tools/build-now-content.js`'s and `tools/generate_sitemap.py`'s
  hardcoded output paths (`docs/now.md` → `docs/compass/now.md`,
  `docs/sitemap.md` → `docs/compass/sitemap.md`), plus every doc/UI-text
  mention of the old paths (`NOW-PAGE.md`, `SITEMAP.md`,
  `FILE-MANIFEST.md`, `README.md`, `admin-controls-ui`,
  `now-editor-ui`).

**A non-bug worth recording**: running `generate_sitemap.py` as part of
verification surfaced that it fetches Cabinet's own TSVs live from
GitHub's `main` branch, the same as it does for Bookshelf/fffx — not
from local files (only `CONTENT-INVENTORY.md`'s separate, Cabinet-only
cross-check reads local files). Since nothing from this reorg had been
pushed yet, `docs/compass/sitemap.md`'s Cabinet-facing links correctly
stayed on the old URLs, because those URLs were still what was actually
live. Expected, by design — not something to fix — but `sitemap.md`
needs one more regen after this is pushed and deployed.

**Verification**: same pipeline discipline as the asset reorg —
`build-cabinet-content.js` → `build-static.mjs` → `promote.mjs`
(headless Chromium, zero console/request errors) →
`build-now-content.js` → `generate_sitemap.py` → `mkdocs build
--strict` (clean) — plus manual checks of the rendered HTML for a root
page (`webtech.md`), a depth-1 page (`compass/about.md`,
`makings/mini_loom.md`), and `makings.md`'s own link, confirming
correct resolution in each case.

**The one real, unavoidable cost**, unchanged from what was flagged
before this ran: every moved page's live URL changed. Everything
inside this repo/ecosystem was updated in the same pass; an external
bookmark or a link shared elsewhere to an old URL 404s once this
deploys. Not fixable from here, and no redirect stubs were added (not
requested).

## Section landing pages as `index.md` (2026-09-03, same day)

Same-day follow-on to the content-folder reorg above: each section's
own landing page (`makings.md`, `teaching.md`, `webtech.md`,
`fffx/fffx.md`) moved inside its own folder as `index.md`, rather than
staying a same-named sibling one level up or being repeated as
`<section>/<section>.md`. Confirmed by a real build, not assumed:
`docs/makings/makings.md` → `/makings/makings/` (double-nested
regression); `docs/makings/index.md` → `/makings/` (clean, matching
the pre-move URL). An underscore-prefixed name (`_makings.md`) would
have no special meaning to MkDocs and would collide with this repo's
own `_`-means-"not-a-page" convention from the asset reorg above —
the opposite of what a section's own landing page is.

Also created: the six section folders the content-folder reorg's plan
had reserved but left unbuilt (`writings/`, `dataviz/`,
`visual-field-notes/`, `blog/`, `travels/`, `physComp/`), each with a
one-line "coming soon" `index.md` stub — not wired into `mkdocs.yml`'s
nav or any TSV, since there's no real content yet to surface. Full
record: `conversation-backend-and-deploy.md`, this same Part 6.

## `mkdocs-section-index` plugin (2026-09-08)

Cabinet and fffx both picked up the `mkdocs-section-index` plugin, ported
over from Bookshelf's own fix (commit `7e5c1f3`, 2026-09-06): a plain
MkDocs nav section can't be both a page and a section, so a section whose
first child is its own unlabeled index page shows that page's title
duplicated in the sidebar -- once as the (non-clickable) section header,
once as a normal, separately-clickable child directly beneath it. The
plugin merges that first child into the section header itself, making the
header the click target and removing the duplicate row.

This is the tooling side only -- added to `plugins:` in both repos'
`mkdocs.yml` and to both `requirements.txt`. Which Cabinet sections
actually use it, and why those three specifically, is a content
decision, not a backend one: see
`documentation/content/CONTENT-STRUCTURE.md`'s "Teaching / Machines &
Makings / Webtech: nav headers become clickable". fffx has the same
dependency installed but nothing using it yet -- `mkdocs.yml`'s own
comment there explains why (unfinished sections are deliberately left
out of the nav entirely, not linked via a hub page).

**Pinned to `0.3.10`, same day, all three `requirements.txt`
(Cabinet/fffx/Bookshelf).** Surfaced while debugging an unrelated
`mkdocs serve` failure: a startup banner appeared claiming "the owner of
MkDocs has completely abandoned maintenance" and pushing
`pip install properdocs`. Traced directly rather than trusted: the *real*
mkdocs-material package does print a genuine, separate warning about an
actual planned MkDocs 2.0 release
(`material/templates/__init__.py`, linked from
`https://squidfunk.github.io/mkdocs-material/blog/2026/02/18/mkdocs-2.0/`)
-- that half is real and unrelated. The "switch to ProperDocs" half is
not from mkdocs-material at all: `mkdocs-section-index` started
depending on `properdocs>=1.6.5` as of its own `0.3.11` release
(2026-03-16, confirmed via PyPI's per-version `requires_dist` --
`0.3.10`, 2025-04-05, has no such dependency), and `properdocs` itself
ships `replacement_warning.py` (prints the banner -- confirmed that's
all that ran here) alongside a separate, dormant `replacement.py` that
installs a `sys.meta_path` import hook silently redirecting every
`mkdocs.*` import to `properdocs.*` and overwriting
`sys.modules['mkdocs']` outright if ever imported. Nothing in this
repo's toolchain currently imports it, but the combination (aggressive
switch-vendors messaging bundled with dormant module-hijack code) reads
as a real supply-chain risk regardless of intent, not something to
`pip install` on the banner's own advice. Mitigation: pinned
`mkdocs-section-index==0.3.10` and uninstalled `properdocs` in both
local Python environments this repo's tooling touches, and pinned the
same version in all three `requirements.txt` so a future bare
`pip install -r requirements.txt` can't reintroduce it silently. The
genuine mkdocs-material 2.0 warning itself was NOT investigated further
-- whether it's a real near-term risk to this site's plugin stack is
still open, tracked as `three-world-launch-phases-ToDo.md` `#142`.

## `mkdocs-glightbox` plugin (2026-09-16)

Added so photo-heavy pages (`docs/fab/fab23-bhutan.md` and others like
it) can click-to-zoom images in place, no new tab, no re-authoring of
existing `![alt](path)` markdown into links first. Before this,
markdown images were plain, unlinked `<img>` tags with no expand
behavior at all.

[`mkdocs-glightbox`](https://blueswen.github.io/mkdocs-glightbox/) is an
`on_page_content`/`on_post_page` MkDocs plugin: it wraps every
not-already-linked `<img>` on a built page in `<a class="glightbox">`,
then injects one `GLightbox(...)` JS instance per page (plus its own
self-hosted CSS/JS, copied into `assets/` at build time — no CDN). With
no `data-gallery` grouping set, GLightbox treats every image on a given
page as one sequential set, so a photo-dump page gets next/prev
navigation through all of it for free. Applies site-wide automatically —
any page with plain markdown images picks it up, not just `fab/` — a
page can opt out with `glightbox: false` in its own front matter if that
's ever needed.

Enabled with defaults: `- glightbox` under `mkdocs.yml`'s `plugins:`, no
config overrides. Verified rather than assumed working: a real
`mkdocs build --strict` (against the Python 3.13 environment this repo's
`run Mkdocs serve.bat` actually uses — see "mkdocs serve wouldn't start"
above for why that's not the same environment `python`/`pip` resolve to
by default) stayed clean, and Fab23-Bhutan's built HTML had all 36
images wrapped in `class="glightbox"` anchors with the plugin's CSS/JS
present. `mkdocs-glightbox==0.5.1` was already installed in that
environment beforehand; added (unpinned) to `requirements.txt` so CI and
any other machine building this repo picks it up too — no known
supply-chain concern the way `mkdocs-section-index`/`properdocs` had, so
no pin needed.

**`auto_caption` deliberately left off** (the default): it would pull
each image's `alt` text into the lightbox caption, and every image on
the fab pages still carries the placeholder alt text `"alt text"` —
turning it on now would just repeat that placeholder across every slide
instead of showing anything real. Revisit once actual per-image
captions/alt text exist.

## Deploy pipeline

`.github/workflows/deploy.yml` runs on every push to `main`, two jobs:

1. **`build`** — checks out the repo, installs Python + Node, guards
   against `docs/index.md` ever being reintroduced (see
   `WORLD-SYSTEMS.md`'s homepage rule), then **verifies generated
   content is current**: re-runs `tools/build-cabinet-content.js` and
   `build-now-content.js` and fails if that dirties their committed
   output — those two are otherwise dev-time-only (run locally, output
   committed), and nothing checks they were actually re-run after the
   last `content/*.tsv` edit. Runs `mkdocs build --site-dir public
   --strict`, then **assembles external projects**
   (`tools/assemble-external.js`, manifest-driven — see "Multi-repo
   assembly" below) and **validates deployment routes**
   (`tools/validate-deployment.js`, cross-checks every active
   `cabinet-entries.tsv` row's local `href` against the actually-built
   `public/` tree). Uploads `public/` as the Pages artifact.
2. **`deploy`** — publishes that artifact via `actions/deploy-pages`.
   Has `needs: build`, so a failed `build` means `deploy` never runs
   and GitHub Pages keeps serving the last successful `deploy` —
   structurally all-or-nothing, though not yet empirically confirmed
   against a real failed run (`#58`, still open).

### Multi-repo assembly (#43 Phase 2, generalized 2026-09-16)

`content/external-repos.tsv` is the assembly manifest anticipated by
`cabinet-multi-repo-assembly-concept-note-short.md` section 8 — one row
per external project: `repository` (`owner/repo`), optional `subfolder`
(copy only that subfolder, not the whole repo root — needed for
`SSD_Student_Work`, a multi-gallery repo), `destination` (mount path
under `public/`), `requiredFiles` (semicolon-separated paths that must
exist post-copy) and/or `requiredContent` (semicolon-separated
`path|substring` pairs, for a project like Oblique Strategies with no
second file to require — a plain existence check can't tell a real
checkout from an empty one), and `status` (`true`/`false`/`wip`, only
`true` rows get assembled). `tools/external-repos-tsv.js` parses/
validates it (same shared-parser pattern as `cabinet-tsv.js`) —
duplicate `id`s and duplicate `destination`s are rejected at parse
time.

`tools/assemble-external.js` replaces the old hand-written
checkout/assemble/validate step triples (one set of three per project,
directly in the YAML) with a single step that reads the manifest,
shallow-clones each active repo (`git clone --depth 1`, not
`actions/checkout` — no auth needed for these public repos, and this
way adding a repo never touches the workflow file), copies its
(sub)folder into `public/<destination>`, strips `.git`, and checks
`requiredFiles`/`requiredContent`. It also refuses to overwrite a
destination that already exists in `public/` when it runs (i.e.
something MkDocs itself already built there) rather than silently
clobbering it — a second layer against the exact class of bug the
Sept 2026 SSD reorg produced (see "Teaching deployment issue" below).
All-or-nothing and fail-loud-on-everything: every project is attempted
and every problem across every project is collected before the script
exits non-zero, so one broken project's error message doesn't hide
another's.

To add another assembled project: add a row to
`content/external-repos.tsv`. No workflow change needed.

### Teaching deployment issue (SSD Student Work galleries, 2026-09-16)

The Sept 4 2026 `SSD_Student_Work` reorg (repo root became a "SSD
Student Work" landing page, individual galleries moved into their own
subfolders) needed a matching Cabinet-side change: the pre-reorg
`deploy.yml` mounted that repo's whole root at
`public/teaching/ssd-creative-coding/`, which after the reorg would
have put the *landing page* there and each gallery one level too deep,
and its own `script.js` check would have failed outright (`script.js`
no longer exists at that repo's root). Fixed in the same pass as the
Phase 2 generalization above by giving each gallery its own manifest
row with an explicit `subfolder`, rather than mounting the repo root.

`ssd-creative-coding-2025-26` was already fixed this way before this
pass (mounted correctly, live). This pass added manifest rows +
`cabinet-entries.tsv` rows for `ssd-creative-coding-2024-25` and
`ssd-creative-coding-2023-24` (both built in `SSD_Student_Work`, per
that repo's `documentation/changelog.md`) and a corresponding
`mkdocs.yml` nav update.

**Not yet live**: as of 2026-09-16, `SSD_Student_Work`'s pushed `main`
does not yet include the 2024-25/2023-24 gallery commits (held back
locally, deliberately, per that repo's own `documentation/deployment.md`,
waiting on this exact Cabinet-side fix). Tested locally against the
real current GitHub state: `tools/assemble-external.js` correctly fails
loudly on both new galleries (missing files / missing subfolder) rather
than deploying a broken or partial assembly — confirmed against a local
simulation of the post-push state that the rest of the pipeline goes
fully green once that push happens. **Push `SSD_Student_Work`'s `main`
before merging/pushing this Cabinet change**, or the very next Cabinet
deploy fails outright (blocking *all* Cabinet updates, not just the two
new galleries, since `build` is all-or-nothing) until that push happens.

**Not pinned to a SHA**: the external checkouts pull each repo's
current default branch at build time. Pushing to one of them alone
does not update the live site — push a commit here too (anything,
even a doc tweak), or re-run the latest Pages workflow run from the
Actions tab.

Migrated from `peaceiris/actions-gh-pages@v3` to GitHub's first-party
Pages actions (`configure-pages` → `upload-pages-artifact` →
`deploy-pages`), matching Bookshelf/fffx's workflow — `GITHUB_TOKEN`
defaults to read-only now, and the old action's runtime was being
retired. Requires **Settings → Pages → Build and deployment → Source →
"GitHub Actions"** on the repo (one-time, not in the YAML).

As of v3.0 (2026-08-23), deploys to the custom domain
`cabinetofcuriosities.in` via `docs/CNAME`, not the GitHub Pages
project subpath.

## Launch milestone scheme

Two-stage tag scheme, adopted 2026-08-30 to resolve an ambiguity
("we're already launched in some ways... the merge to main would
count as launch... but the about page and a few other essential
backend/frontend things are left"):

- **`launch-beta`** — annotated tag, created 2026-08-30 at `7f3a638`
  (the actual 2026-08-23 merge-to-main commit). Marks: v3 live at
  `cabinetofcuriosities.in`, not yet feature-complete, links not yet
  publicly shared.
- **`launched`** — not yet applied. A future marker for a real-world
  event, not a checklist percentage: applied once Phase 0–2 of
  `three-world-launch-phases-ToDo.md` are done/largely done **and**
  the links are actually being distributed publicly. Can't be
  auto-triggered off item counts.

Full resolution note: `three-world-launch-phases-ToDo.md` `#59`.

## Changelog

### 2026-09-16 — `mkdocs-glightbox` plugin added (click-to-zoom images)

See "`mkdocs-glightbox` plugin" above. Enabled site-wide with defaults;
verified against a real strict build. Conversation log: Part 8 of
`conversation-backend-and-deploy.md`.

### 2026-09-16 — Multi-repo assembly generalized (#43 Phase 2); teaching deployment validation added; SSD 2024-25/2023-24 galleries wired in

See "Multi-repo assembly" and "Teaching deployment issue" above for the
full account. Summary: `content/external-repos.tsv` (new manifest) +
`tools/assemble-external.js` (new, replaces six hand-written
checkout/assemble/validate step triples in `deploy.yml`) +
`tools/validate-deployment.js` (new, cross-checks active
`cabinet-entries.tsv` hrefs against the built `public/` tree) +
`tools/external-repos-tsv.js` (new, shared manifest parser). `deploy.yml`
also gained a Node setup step, a "verify generated content is current"
step (catches a `content/*.tsv` edit committed without re-running its
generator), and `--strict` on the `mkdocs build` call (tested clean
locally beforehand). Not yet pushed/merged — see "Not yet live" above
for the `SSD_Student_Work` push precondition that has to happen first.

### 2026-09-08 — `mkdocs-section-index` pinned to `0.3.10` (Cabinet + fffx + Bookshelf); two empty `docs/fab/*.md` stubs fixed

See "`mkdocs-section-index` plugin" above for the `properdocs`
supply-chain finding and pin. Unrelated root cause of the `mkdocs serve`
failure that led to finding it: `docs/fab/fab23-bhutan.md` and
`fab25-czechia.md` were both untracked, 0-byte files, which crashed the
build with "Document is empty" before it could bind a port -- fixed with
placeholder content matching this site's existing "coming soon"
convention (`makings/drawing-machines.md` etc.). Conversation log: Part 7
of `conversation-backend-and-deploy.md`.

### 2026-09-08 — `mkdocs-section-index` plugin (Cabinet + fffx)

See "`mkdocs-section-index` plugin" above. The content-side consequence
(which sections actually use it) moved to
`documentation/content/CONTENT-STRUCTURE.md` once that folder existed.

### 2026-09-03 — section landing pages renamed to `index.md`; reserved-section stubs created

See "Section landing pages as `index.md`" above. Same conversation-log
Part as the content-folder reorg below.

### 2026-09-03 — `docs/` content-folder reorganization

See "`docs/` content-folder reorganization" above. Conversation log:
Part 6 of `conversation-backend-and-deploy.md`.

### 2026-09-02 — `docs/` asset reorganization

See "`docs/` asset reorganization" above. Conversation log: Part 5 of
`conversation-backend-and-deploy.md`.

### 2026-08-30 — this doc created; `backend-and-deploy/` folder

Consolidates what was previously scattered across `FILE-MANIFEST.md`,
`three-world-launch-phases-ToDo.md`, and `README.md`'s changelog into
one technical reference for the reorg and launch-milestone work
specifically — the two `conversation-backend-and-deploy.md` parts that
had a conversation-log but no technical doc. Cloudflare and multi-repo
assembly already had their own docs and weren't absorbed, just moved
alongside this one and linked. `documentation/backend-and-deploy/` now
holds: this file, `conversation-backend-and-deploy.md`,
`cloudflare-web-analytics-setup.md`, `cloudflare-js-snippet.md`
(gitignored), `three-world-launch-phases-ToDo.md`,
`three-world-launch-phases-Notes.md`, and
`cabinet-multi-repo-assembly-concept-note-short.md` — everything
backend/deploy-scoped except `DOCUMENTATION-GUIDE.md` (about
documentation itself, not backend/deploy) and `FILE-MANIFEST.md` (the
whole-repo index, not backend/deploy-scoped).

### 2026-08-30 — `launch-beta` tag scheme (`#59`)

See "Launch milestone scheme" above.

### 2026-08-29 to 2026-08-30 — file/folder reorganization (`#129`–`#134`)

See "Repo structure" above.

## Todo / watch-out-for

- **Push `SSD_Student_Work`'s `main`** before merging/pushing this
  Cabinet change (2026-09-16) — see "Teaching deployment issue" above.
  Not doing so first breaks the very next Cabinet deploy entirely, not
  just the two new galleries.
- **`#58`** — failed-build-doesn't-replace-live-deploy is structurally
  sound by construction (`needs: build`) but not empirically confirmed
  against a real failed run. Needs the GitHub Actions tab (or `gh`
  CLI/API access, not available in this environment) to close for
  real.
- **`README.md`'s "Deploy pipeline" section lists only 2 of the 6
  external repos** (`working-with-ai`, `PromptGenerator`) that
  `deploy.yml` actually assembles — stale relative to the real
  workflow file as of this doc's writing. Worth a follow-up pass;
  not fixed here since it's outside this doc's own scope.
- Bookshelf/fffx Cloudflare rollout still open — `#135`/`#136` in
  `three-world-launch-phases-ToDo.md`.
- **`docs/compass/sitemap.md` needs one more regen after this reorg is
  pushed and deployed** — `generate_sitemap.py` fetches Cabinet's own
  TSVs live from GitHub, so its Cabinet-facing links still reflect the
  pre-reorg live URLs until the actual push happens (see "`docs/`
  content-folder reorganization" above).
- **Six reserved section folders exist as stubs only** (`physComp/`,
  `writings/`, `dataviz/`, `visual-field-notes/`, `blog/`, `travels/`)
  — created 2026-09-03 with a one-line "coming soon" `index.md` each,
  not wired into `mkdocs.yml`'s nav or any TSV. Build out and wire in
  once real content for each exists.
- **Section id/title labeling in the TSVs wasn't updated** to match the
  new `webtech` umbrella (e.g. `interfaces-data-texts` section keeps
  its old id/title, only its `href` changed) — a deliberate scope
  boundary (file location vs. labeling are separate concerns per the
  Atlas session), not an oversight, but worth a look if the TSV's own
  section model ever gets revisited.
- **`WORLD-SYSTEMS.md`'s "Asset naming" convention now describes
  Bookshelf/fffx, not Cabinet** — noted inline in that file rather than
  resolved. Revisit whether Bookshelf/fffx should adopt Cabinet's
  underscore scheme, or whether this stays a permanent Cabinet-specific
  exception.
- **fffx has `mkdocs-section-index` installed but nothing using it yet**
  (see "`mkdocs-section-index` plugin" above) — revisit once any fffx
  section gets a real `index.md` hub page wired into its nav.
- **`mkdocs-glightbox`'s `auto_caption` is off** (see "`mkdocs-glightbox`
  plugin" above) because the fab pages' `alt` text is still the literal
  placeholder `"alt text"` — turn it on once real per-image
  captions/alt text get written, not before.
