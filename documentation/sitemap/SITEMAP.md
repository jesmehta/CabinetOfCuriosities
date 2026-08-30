# Sitemap & Content Inventory — Mechanism & Reference

Companion to [`conversation-sitemap.md`](conversation-sitemap.md) for the
design reasoning and back-and-forth behind the decisions below — that
file is *why*, this one is *what/how*, in the same relationship
`NOW-PAGE.md` has to `conversation-now-page.md`.

## Purpose

One script, `tools/generate_sitemap.py`, with two separate jobs that
happen to share a run:

1. **`docs/sitemap.md`** — a single, cross-world sitemap across Cabinet,
   fffx, and Bookshelf, built by reading each repo's own TSV content
   files live over GitHub raw. This is the real `/sitemap/` page, linked
   from the compass rose's W point (`content/cabinet-entries.tsv`'s
   `compass-w` row).
2. **`documentation/CONTENT-INVENTORY.md`** — Cabinet-only, cross-
   referencing this repo's own `content/cabinet-{sections,entries}.tsv`
   against `mkdocs.yml`'s own nav tree, entirely from local files, no
   network involved. Replaces what used to be a hand-maintained table in
   `landing-v3-notes/three-world-launch-phases-ToDo.md` (`#126`) — see
   `conversation-sitemap.md` for why that table stopped being worth
   maintaining by hand.

Both outputs are auto-generated Markdown, written directly into the
tree the same way `tools/build-now-content.js` writes `docs/now.md` —
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
compare equal: absolute URLs compare literally (minus a trailing
slash); relative paths get `.md`/`/index` stripped and are lower-cased.
`build_content_inventory()` cross-references every section/entry row's
`href` against the nav-leaf set via that key, and separately tracks
which `path_key` each TSV row claims, to catch duplicates.

### The nav scanner, and why regex instead of YAML

`mkdocs.yml`'s `nav:` block is a flat, consistently-shaped list —
every real entry reads `- Label : target`, group headers read `- Label
:` with no target on the line. `NAV_LEAF_RE`/`NAV_GROUP_RE` match those
two shapes directly with a plain line scanner (find the `nav:` line,
read until the block dedents back to column 0, skip `#`-commented
lines). Chosen over a real YAML parser (PyYAML) specifically to avoid
adding a `pip install` requirement — the script's own docstring has
promised "no pip installs needed, standard library only" since it was
first written for the sitemap half, and a YAML dependency would have
quietly broken that promise for a piece of functionality that doesn't
actually need YAML's full generality. Fragile only if `mkdocs.yml`'s
nav ever stops being a flat label/target list — an obvious, visible
break if it happens, not a silent one.

## What it catches

`build_content_inventory()`'s Flags section is purely mechanical string
matching — it can detect *that* something doesn't line up, never *why*:

- **TSV row with no nav entry** — a `content/cabinet-*.tsv` row has an
  `href` that no `mkdocs.yml` nav leaf points at.
- **Nav entry with no TSV row** — the reverse: a nav leaf's target
  matches no TSV row's `href`.
- **Duplicate href** — two or more TSV rows (section or entry) resolve
  to the same `path_key`.

**By design, this list is not filtered.** Deliberate cross-listings
(Swatch Fields appearing under two sections) and map-only entries with
no nav entry on purpose (assembled Teaching/Working-with-AI-style
entries, reached only from the map, never the sidebar) show up here
exactly the same as a real mistake would. There is no exceptions/
allowlist mechanism in the script — direct instruction when this was
built: read the Flags list and dismiss what's fine, rather than have
the script try to encode judgment it structurally can't make (see
`conversation-sitemap.md`, *"I will manually filter/ignore them"*).

## Files

```text
tools/generate_sitemap.py                 -- the script; both outputs below come from one run

docs/sitemap.md                            -- AUTO-GENERATED, do not edit -- cross-world sitemap,
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

Regenerates both `docs/sitemap.md` and `documentation/CONTENT-INVENTORY.md`
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
  `docs/sitemap.md`. No CLI flags, no config file. Fine for a
  single-repo, single-output-location tool as it exists today; would
  need revisiting if this script's Content Inventory half were ever
  reused by Bookshelf or fffx for their own nav/TSV cross-checks, since
  each would need its own output path, its own `mkdocs.yml`, and its
  own TSV file names.
- **Cross-world data is fetched, not cached** — every sitemap run makes
  six live HTTP requests (two TSVs x three worlds); no offline mode for
  that half. The Content Inventory half has no such limitation, since it
  reads everything locally.
- **The nav scanner has no test coverage of its own** beyond exercising
  it against this repo's real `mkdocs.yml` — see "The nav scanner, and
  why regex instead of YAML" above for the shape it assumes and how it
  fails (visibly, not silently) if that shape changes.

## Changelog

### v1.1 — Content Inventory generation added (2026-08-30)

Extended the script with a second, unrelated-at-the-network-level job:
`build_content_inventory()`, `read_local_tsv()`, `parse_mkdocs_nav()`,
`path_key()`, plus the `NAV_LEAF_RE`/`NAV_GROUP_RE` regexes and the
`INVENTORY_OUTPUT_PATH`/`MKDOCS_YML_PATH`/`CABINET_SECTIONS_TSV`/
`CABINET_ENTRIES_TSV` constants. Replaces the hand-maintained Content
Inventory table that used to live in
`landing-v3-notes/three-world-launch-phases-ToDo.md` (`#126`) — see
`conversation-sitemap.md` for the full reasoning, including why the
table's `TSV`/`Map` columns were kept (not just its `mkdocs`-nav
column) despite the sitemap already covering similar ground.

First run immediately found two real, previously-unflagged duplicate
hrefs (the `bookshelf` section and `christie` entry sharing one URL;
the two `Swatch Fields` TSV rows sharing another — the second is an
intentional cross-listing, not a bug, and was left as a Flags-list
entry rather than suppressed, per this file's own "What it catches"
section), and, as a side effect of simply being re-run, fixed a real
staleness bug in `docs/sitemap.md` itself: the compass rose's own W
point had gone live pointing at `/sitemap/` a session earlier, but
`sitemap.md` hadn't been regenerated since, so it was still describing
itself as "no page yet."

### v1.0 — initial build (2026-08-29)

`tools/generate_sitemap.py` created: `WORLDS`, `fetch_tsv()`,
`resolve_href()`, `normalize_status()`, `build_world()`,
`render_markdown()` — fetches Cabinet/fffx/Bookshelf's own TSVs live
over GitHub raw, writes `docs/sitemap.md`. Wired into
`content/cabinet-entries.tsv`'s `compass-w` row and the compass rose's
W point (`#73`). No technical-reference doc was written for this
initial version — see `conversation-sitemap.md`'s own "gap worth naming
plainly" note, closed by this file.
