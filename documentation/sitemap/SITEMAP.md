# Sitemap & Content Inventory — Mechanism & Reference

Companion to [`conversation-sitemap.md`](conversation-sitemap.md) for the
design reasoning and back-and-forth behind the decisions below — that
file is *why*, this one is *what/how*, in the same relationship
`NOW-PAGE.md` has to `conversation-now-page.md`.

## Purpose

One script, `tools/generate_sitemap.py`, with two separate jobs that
happen to share a run:

1. **`docs/compass/sitemap.md`** — a single, cross-world sitemap across Cabinet,
   fffx, and Bookshelf, built by reading each repo's own TSV content
   files live over GitHub raw. This is the real `/sitemap/` page, linked
   from the compass rose's W point (`content/cabinet-entries.tsv`'s
   `compass-w` row).
2. **`documentation/CONTENT-INVENTORY.md`** — Cabinet-only, cross-
   referencing this repo's own `content/cabinet-{sections,entries}.tsv`
   against `mkdocs.yml`'s own nav tree, entirely from local files, no
   network involved. Replaces what used to be a hand-maintained table in
   `three-world-launch-phases-ToDo.md` (`#126`) — see
   `conversation-sitemap.md` for why that table stopped being worth
   maintaining by hand.

Both outputs are auto-generated Markdown, written directly into the
tree the same way `tools/build-now-content.js` writes `docs/compass/now.md` —
re-run the script, get fresh output, never hand-edit either file.

## Mechanism

### Sitemap generation (cross-world, network)

`WORLDS` is a small list of dicts, one per Level 1 world (Cabinet,
fffx, Bookshelf), each naming its own `sections_tsv`/`entries_tsv`
paths and `base_url`. `fetch_tsv()` pulls each file over
`raw.githubusercontent.com` (`urllib.request`, stdlib only) and parses
it with `csv.DictReader`. `build_world()` sorts sections/entries by
their own `order` column and groups entries under their section.
`render_markdown()` walks that structure and writes one `##` heading
per world, one `###` per section, one bullet per entry, each tagged
with a status icon (🟢 live / 🟡 wip / 🔴 hidden / ⚪ no page) from
`normalize_status()` reading the row's own `status` column directly —
no separate "is this actually live" computation, the TSV's own value
*is* the answer. `resolve_href()` turns a relative TSV `href` into a
full URL against that world's `base_url`; an already-absolute
(`http(s)://`) href is used as-is (cross-world links, external sites).

### Content Inventory generation (Cabinet-only, local, no network)

`read_local_tsv()` reads `content/cabinet-sections.tsv` and
`content/cabinet-entries.tsv` straight off disk — deliberately not the
same GitHub-raw-fetch path the sitemap side uses for Cabinet's own
files, so this half of the script works offline and reflects
uncommitted local edits, not just what's already pushed.

`parse_mkdocs_nav()` reads `mkdocs.yml` and extracts every nav leaf
(`label`, `target`) as a flat list — deliberately flat, not a real tree,
since this script only ever needs "does this target have a matching TSV
row," never the nav's visual nesting. `path_key()` is the normalizer
that makes a TSV `href` (`about/`) and a nav `target` (`about.md`)
compare equal: relative paths get `.md`/`/index` stripped and are
lower-cased; an absolute URL compares literally (minus a trailing
slash) UNLESS it starts with `CABINET_BASE_URL`
(`https://cabinetofcuriosities.in/`), in which case that prefix is
stripped first and the remainder normalized the same way a relative
path is — `mkdocs.yml` often writes Cabinet's own pages as full
absolute URLs while `cabinet-entries.tsv` writes the same page as a
site-relative href, and without this the two forms never produced the
same key even for the identical page (fixed `v1.5`, see Changelog).
`build_content_inventory()` cross-references every section/entry row's
`href` against the nav-leaf set via that key, and separately tracks
which `path_key` each TSV row claims, to catch duplicates.

### The nav scanner, and why regex instead of YAML

`mkdocs.yml`'s `nav:` block is a flat, consistently-shaped list — most
entries read `- Label : target`, matched directly by `NAV_LEAF_RE` with
a plain line scanner (find the `nav:` line, read until the block
dedents back to column 0, skip `#`-commented lines, keep any line one of
the three regexes below matches). Chosen over a real YAML parser
(PyYAML) specifically to avoid adding a `pip install` requirement — the
script's own docstring has promised "no pip installs needed, standard
library only" since it was first written for the sitemap half, and a
YAML dependency would have quietly broken that promise for a piece of
functionality that doesn't actually need YAML's full generality.

Three regexes, tried in order, now cover the three shapes a nav line
actually takes in this file:

1. **`NAV_LEAF_RE`** — `- Label : target`, the common case.
2. **`NAV_GROUP_RE`** — `- Label :` with nothing after the colon, a
   section header (`- Compass :`). Matched and explicitly skipped —
   **wired in `v1.6`** after being dead code (defined, never called)
   through `v1.2`–`v1.5`; see that changelog entry for why it needed to
   be distinguished from a line that simply failed to parse.
3. **`NAV_BARE_RE`** — a bare target with no label at all, e.g.
   `- teaching/index.md`. Used deliberately for a section's first leaf
   so `mkdocs-section-index` can merge it into the clickable section
   heading (`teaching/index.md`, `webtech/index.md` in this repo's own
   `mkdocs.yml`). `NAV_LEAF_RE` structurally can't match these — a plain
   relative path has no `:` in it at all — so before `v1.6` these lines
   just vanished from the leaf list, the exact silent-drop failure mode
   described below, except it wasn't a hypothetical: `teaching` and
   `web-tech` were both real, permanent false positives in
   `CONTENT-INVENTORY.md`'s Flags section for as long as this script
   existed. **Added in `v1.6`**, using the bare target itself as a
   stand-in label (there's no real title to use — that lives in the
   Markdown file's own front matter/H1, which this script never reads)
   so the Sections/Entries tables print `Y (teaching/index.md)` rather
   than a bare `Y` or a misleading `Y (None)`.

## What it catches

`build_content_inventory()`'s Flags section is purely mechanical string
matching — it can detect *that* something doesn't line up, never *why*:

- **TSV row with no nav entry** — a `content/cabinet-*.tsv` row has an
  `href` that no `mkdocs.yml` nav leaf points at, EXCEPT a row whose own
  `status` is `false` — not live, so having no nav entry is expected,
  not a flag (fixed `v1.4`, see Changelog).
- **Nav entry with no TSV row** — the reverse: a nav leaf's target
  matches no TSV row's `href`.
- **Duplicate href** — two or more TSV rows (section or entry) resolve
  to the same `path_key`.

**By design, this list is otherwise unfiltered.** One exception now
exists (`status: false` rows above); everything else still shows up
regardless of whether it's a real problem. Deliberate cross-listings
(Swatch Fields appearing under two sections) and map-only entries with
no nav entry on purpose (assembled Teaching/Working-with-AI-style
entries, reached only from the map, never the sidebar) show up here
exactly the same as a real mistake would. There is still no general
exceptions/allowlist mechanism in the script — direct instruction when
this was built: read the Flags list and dismiss what's fine, rather
than have the script try to encode judgment it structurally can't make
(see `conversation-sitemap.md`, *"I will manually filter/ignore
them"*); the `status: false` case above was a deliberate, narrow
exception to that rule, not a reversal of it — see that file's own
entry for the reasoning.

## Files

```text
tools/generate_sitemap.py                 -- the script; both outputs below come from one run

docs/compass/sitemap.md                            -- AUTO-GENERATED, do not edit -- cross-world sitemap,
                                               real MkDocs page, wired into mkdocs.yml's nav, linked
                                               from the compass rose's W point
documentation/CONTENT-INVENTORY.md         -- AUTO-GENERATED, do not edit -- Cabinet-only nav/TSV
                                               cross-check, NOT an mkdocs page (lives in documentation/,
                                               not docs/ -- meta/process content, not site content)

content/cabinet-sections.tsv               -- read locally for the Content Inventory half
content/cabinet-entries.tsv                -- read locally for the Content Inventory half
mkdocs.yml                                  -- read locally for its nav tree
```

Cross-world inputs (fetched, not local): each world's own
`content/{cabinet,fffx,bookshelf}-{sections,entries}.tsv`, over GitHub
raw, from `jesmehta/CabinetOfCuriosities`, `jesmehta/form-follows-fx`,
and `jesmehta/TheBookshelfOfCuriosities` respectively (see `WORLDS` in
the script).

## Update workflow

```bash
python tools/generate_sitemap.py
```

Regenerates both `docs/compass/sitemap.md` and `documentation/CONTENT-INVENTORY.md`
in one run — there's no way to build just one half. Commit whichever
outputs actually changed. No admin UI, no local server, no watch mode —
run it by hand whenever a TSV or `mkdocs.yml`'s nav changes and the
generated outputs might have drifted from it.

Skim the regenerated Flags section in `CONTENT-INVENTORY.md` after
every run rather than assuming a clean diff means nothing needs
attention — the list is unfiltered by design (see "What it catches"
above), so reading it is the actual review step, not optional.

## Non-goals / known limitations

- **No exceptions/allowlist mechanism** — a deliberate non-goal, not an
  oversight; see "What it catches" above.
- **`INVENTORY_OUTPUT_PATH` is hardcoded**, not configurable — always
  `documentation/CONTENT-INVENTORY.md`, same as `OUTPUT_PATH` is always
  `docs/compass/sitemap.md`. No CLI flags, no config file. Fine for a
  single-repo, single-output-location tool as it exists today; would
  need revisiting if this script's Content Inventory half were ever
  reused by Bookshelf or fffx for their own nav/TSV cross-checks, since
  each would need its own output path, its own `mkdocs.yml`, and its
  own TSV file names.
- **Cross-world data is fetched, not cached** — every sitemap run makes
  six live HTTP requests (two TSVs x three worlds); no offline mode for
  that half. The Content Inventory half has no such limitation, since it
  reads everything locally.
- **The nav scanner still fails silently on a genuinely malformed leaf
  line**, not visibly — narrowed in scope by `v1.6`, not eliminated. The
  three known real shapes (`Label : target`, `Label :` group header,
  bare `target`) are now all handled; `parse_mkdocs_nav()`'s loop still
  has no final `else`/warning for a line that matches none of the three,
  so anything actually malformed (a typo breaking all three shapes at
  once) still vanishes from the leaf list with no error, silently
  under-reporting nav coverage in `CONTENT-INVENTORY.md`'s Flags section
  rather than erroring. The only thing that visibly stops the scan
  entirely is the block dedenting back to column 0 (a real top-level
  YAML key ending `nav:` entirely). No test coverage exists for this
  scanner beyond exercising it against this repo's own real
  `mkdocs.yml`.

## Changelog

### v1.6 — bare-target nav leaves (`teaching`/`webtech`) recognized; `NAV_GROUP_RE` wired in (2026-09-08)

Surfaced while investigating two permanent `CONTENT-INVENTORY.md` false
positives the user asked about directly: *"TSV row with no nav entry:
section web-tech (webtech/)"* and the same for `teaching`. Root cause,
confirmed by reading `parse_mkdocs_nav()` against the real
`mkdocs.yml`: both sections deliberately write their first nav leaf bare
(`- teaching/index.md`, `- webtech/index.md`, no `Label :` prefix) so
`mkdocs-section-index` can merge it into the clickable section heading
— but `NAV_LEAF_RE` requires a literal `:` separating label from target,
and a plain relative path has no colon in it at all, so the line never
matched and the target was never added to `nav_by_key`. Both pages are
real and correctly wired into the site; the script just couldn't see
them. Fixed by adding `NAV_BARE_RE` (`^\s*-\s+(\S+)\s*$`) as a fallback
tried after `NAV_LEAF_RE` and `NAV_GROUP_RE` both fail to match, using
the bare target as its own stand-in label. Wiring in `NAV_GROUP_RE` (previously
dead code, per `v1.2`) was a necessary side effect, not a separate
fix: without it, a group header like `- Compass :` — a single
whitespace-free-after-strip token followed by a bare colon — risked
being misread by a naive bare-leaf pattern; matching and explicitly
skipping `NAV_GROUP_RE` first keeps that case correctly excluded rather
than relying on it happening to fail `NAV_BARE_RE` too. Verified by
regenerating `CONTENT-INVENTORY.md`: `teaching`/`web-tech` now show
`Y (teaching/index.md)`/`Y (webtech/index.md)` in the Sections table and
no longer appear in Flags; the three genuinely-expected remaining flags
(`writings` — no nav entry by direct choice; the anchor-based
`students-emergent-technology` entry; cross-world Bookshelf/fffx hrefs)
are unaffected, confirming the fix is scoped to the actual bug and
didn't suppress anything real.

### v1.5 — `path_key()` now reconciles Cabinet's own absolute nav URLs against relative TSV hrefs (2026-09-08)

Direct question from the user after reading a Flags list: *"there are
entries that are actually mates to each other but are currently listed
as 'A in Nav has [no] TSV entry' but there is also an 'A' in TSV has [no]
Nav entry."* Confirmed against the code and the actual flagged pairs —
`mkdocs.yml` writes several of Cabinet's own pages as full absolute URLs
(`https://cabinetofcuriosities.in/teaching/working-with-ai/`) while
`cabinet-entries.tsv` writes the identical page as a site-relative href
(`teaching/working-with-ai/`); `path_key()` compared absolute URLs
literally and relative paths after normalization, with no step ever
converting one form into the other, so five genuinely-identical pages
(SSD Creative Coding, Working with AI, Prompt Generator, Oblique
Strategies, Swatch Fields) were silently split across both Flags lists
instead of matching. Fixed by pulling `WORLDS[0]["base_url"]` out as
`CABINET_BASE_URL` and having `path_key()` strip that prefix off an
absolute target before applying the normal relative-path normalization
— a cross-domain absolute URL (Bookshelf, fffx, `fabacademy.org`, etc.)
still compares literally, since those have no relative TSV form to
reconcile against. Verified against a scratch regeneration (discarded,
not committed — see `ADMIN-CONTROLS.md`'s own precedent for treating a
verification-only regen as no different from a smoke test) confirming
all five pairs resolve to a real `Y (...)` nav match instead of a
suppressed flag, and that unrelated Flags entries were untouched. See
`conversation-sitemap.md` for the exchange.

### v1.4 — "TSV row with no nav entry" no longer flags a `status: false` row (2026-09-08)

Direct request: *"if the TSV says status false, there is no need for a
Nav entry anyway, so that check is easier."* A row marked `false` isn't
live, so it having no nav entry is the expected, correct state, not a
mistake worth surfacing — `build_content_inventory()`'s TSV-side flag
loop now calls the same `normalize_status()` the Sections/Entries tables
already use and skips any row that normalizes to `"hidden"` before
generating that specific flag. Deliberately narrow: only this one flag
kind is filtered, not a general allowlist mechanism (see "What it
catches" above) — `status: true`/`wip` rows, and the reverse "Nav entry
with no TSV row" direction, are unaffected. Verified by regenerating and
confirming exactly the three previously-flagged `status: false` rows
(section `interfaces-data-texts`; entries `particle-systems`,
`100-gradients`) dropped out, nothing else changed. See
`conversation-sitemap.md` for the exchange.

### v1.3 — a second claim corrected after the same review (2026-08-30)

No code changes. `v1.2`'s fix addressed `NAV_GROUP_RE`; this doc's first
draft also claimed the scanner "fails visibly, not silently" if
`mkdocs.yml`'s nav shape changes. Wrong for the failure mode that
matters most, confirmed by reading `parse_mkdocs_nav()`'s loop directly:
a single malformed leaf line inside an otherwise well-formed `nav:`
block is silently dropped, not flagged — only a full structural dedent
(the block ending entirely) is visible. See "Non-goals / known
limitations" above for the corrected description.

### v1.2 — one claim corrected after a direct code review (2026-08-30)

No code changes. This doc's first draft claimed `NAV_GROUP_RE` was used
alongside `NAV_LEAF_RE` to match nav leaves and group headers as two
distinct shapes — caught by a review that asked for the code to be
re-checked rather than trusted as given. It isn't: only `NAV_LEAF_RE` is
ever called; `NAV_GROUP_RE` is dead code, defined and never referenced.
See "The nav scanner, and why regex instead of YAML" above for the
corrected description.

### v1.1 — Content Inventory generation added (2026-08-30)

Extended the script with a second, unrelated-at-the-network-level job:
`build_content_inventory()`, `read_local_tsv()`, `parse_mkdocs_nav()`,
`path_key()`, plus the `NAV_LEAF_RE`/`NAV_GROUP_RE` regexes and the
`INVENTORY_OUTPUT_PATH`/`MKDOCS_YML_PATH`/`CABINET_SECTIONS_TSV`/
`CABINET_ENTRIES_TSV` constants. Replaces the hand-maintained Content
Inventory table that used to live in
`three-world-launch-phases-ToDo.md` (`#126`) — see
`conversation-sitemap.md` for the full reasoning, including why the
table's `TSV`/`Map` columns were kept (not just its `mkdocs`-nav
column) despite the sitemap already covering similar ground.

First run immediately found two real, previously-unflagged duplicate
hrefs (the `bookshelf` section and `christie` entry sharing one URL;
the two `Swatch Fields` TSV rows sharing another — the second is an
intentional cross-listing, not a bug, and was left as a Flags-list
entry rather than suppressed, per this file's own "What it catches"
section), and, as a side effect of simply being re-run, fixed a real
staleness bug in `docs/compass/sitemap.md` itself: the compass rose's own W
point had gone live pointing at `/sitemap/` a session earlier, but
`sitemap.md` hadn't been regenerated since, so it was still describing
itself as "no page yet."

### v1.0 — initial build (2026-08-29)

`tools/generate_sitemap.py` created: `WORLDS`, `fetch_tsv()`,
`resolve_href()`, `normalize_status()`, `build_world()`,
`render_markdown()` — fetches Cabinet/fffx/Bookshelf's own TSVs live
over GitHub raw, writes `docs/compass/sitemap.md`. Wired into
`content/cabinet-entries.tsv`'s `compass-w` row and the compass rose's
W point (`#73`). No technical-reference doc was written for this
initial version — see `conversation-sitemap.md`'s own "gap worth naming
plainly" note, closed by this file.
