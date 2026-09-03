#!/usr/bin/env python3
"""
generate_sitemap.py

Builds a single sitemap across all three Cabinet of Curiosities worlds
(Cabinet, fffx, Bookshelf) by reading each repo's own TSV content files
directly from GitHub -- the same files each site's build script
(build-cabinet-content.js / build-fffx-content.js / build-bookshelf-content.js)
already treats as the source of truth for nav/map/shelf structure.

No manual page list to maintain: add a row to a TSV in any of the three
repos, re-run this script, and the sitemap picks it up automatically.

Writes docs/compass/sitemap.md, an mkdocs source page like
docs/compass/about.md and docs/compass/colophon.md -- mkdocs builds it
into the live /sitemap/ page linked from the compass rose's W point
(see content/cabinet-entries.tsv's compass-w row).

Also writes documentation/CONTENT-INVENTORY.md -- Cabinet-only (not
cross-world; Bookshelf/fffx status is what /sitemap/ above is for),
cross-referencing this repo's own content/cabinet-{sections,entries}.tsv
against mkdocs.yml's own nav tree, replacing what used to be a
hand-maintained table in three-world-launch-phases-ToDo.md (#126). Flags
are mechanical (a TSV row with no matching nav entry, a nav entry with
no matching TSV row, two TSV rows claiming the same href) and WILL
include known-intentional cases (deliberate cross-listings, assembled
map-only entries with no nav entry by design) -- read as a checklist to
skim, not a list of bugs; no attempt is made here to suppress known
exceptions.

Usage:
    python3 tools/generate_sitemap.py

Requires: only the standard library (urllib, csv, re). No pip installs
needed -- mkdocs.yml's nav is read with a small regex-based line scanner
rather than a YAML parser, since its own shape (a flat list of "- Label :
target" leaves under one top-level `nav:` key) doesn't need one.
"""

import csv
import html
import io
import os
import re
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(ROOT, "docs", "compass", "sitemap.md")
INVENTORY_OUTPUT_PATH = os.path.join(ROOT, "documentation", "CONTENT-INVENTORY.md")
MKDOCS_YML_PATH = os.path.join(ROOT, "mkdocs.yml")
CABINET_SECTIONS_TSV = os.path.join(ROOT, "content", "cabinet-sections.tsv")
CABINET_ENTRIES_TSV = os.path.join(ROOT, "content", "cabinet-entries.tsv")

RAW = "https://raw.githubusercontent.com/{repo}/{branch}/{path}"

# ---------------------------------------------------------------------------
# One entry per world. base_url is where relative hrefs in that world's own
# TSVs resolve against (each world's TSV was written assuming it's hosted at
# its own domain -- see each repo's WORLD-SYSTEMS.md).
# ---------------------------------------------------------------------------
WORLDS = [
    {
        "name": "Cabinet of Curiosities",
        "repo": "jesmehta/CabinetOfCuriosities",
        "branch": "main",
        "base_url": "https://cabinetofcuriosities.in/",
        "sections_tsv": "content/cabinet-sections.tsv",
        "entries_tsv": "content/cabinet-entries.tsv",
        "entry_section_key": "section",
    },
    {
        "name": "fffx (Form follows f(x))",
        "repo": "jesmehta/form-follows-fx",
        "branch": "main",
        "base_url": "https://fffx.cabinetofcuriosities.in/",
        "sections_tsv": "content/fffx-sections.tsv",
        "entries_tsv": "content/fffx-entries.tsv",
        "entry_section_key": "section",
    },
    {
        "name": "Bookshelf of Curiosities",
        "repo": "jesmehta/TheBookshelfOfCuriosities",
        "branch": "main",
        "base_url": "https://bookshelf.cabinetofcuriosities.in/",
        "sections_tsv": "content/bookshelf-sections.tsv",
        "entries_tsv": "content/bookshelf-entries.tsv",
        "entry_section_key": "section",
    },
]


def fetch_tsv(repo, branch, path):
    url = RAW.format(repo=repo, branch=branch, path=path)
    with urllib.request.urlopen(url, timeout=20) as resp:
        text = resp.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(text), delimiter="\t"))


def resolve_href(href, base_url):
    """Relative hrefs are resolved against the world's own domain; absolute
    (http/https) hrefs -- subdomain cross-links or external sites -- are
    used as-is."""
    href = (href or "").strip()
    if not href:
        return None
    if href.startswith("http://") or href.startswith("https://"):
        return href
    return base_url.rstrip("/") + "/" + href.lstrip("/")


def normalize_status(raw_status):
    s = (raw_status or "").strip().lower()
    if s in ("true", "1", "yes"):
        return "live"
    if s in ("false", "0", "no"):
        return "hidden"
    if s == "wip":
        return "wip"
    return "unknown" if not s else s


def build_world(world):
    sections = fetch_tsv(world["repo"], world["branch"], world["sections_tsv"])
    entries = fetch_tsv(world["repo"], world["branch"], world["entries_tsv"])

    # order sections by their own 'order' column when present
    def sec_order(s):
        try:
            return int(s.get("order", 0))
        except (ValueError, TypeError):
            return 0

    sections_sorted = sorted(sections, key=sec_order)

    section_map = {s["id"]: s for s in sections_sorted}
    entries_by_section = {}
    for e in entries:
        sec_id = e.get(world["entry_section_key"], "")
        entries_by_section.setdefault(sec_id, []).append(e)

    def entry_order(e):
        try:
            return int(e.get("order", 0))
        except (ValueError, TypeError):
            return 0

    for sec_id in entries_by_section:
        entries_by_section[sec_id].sort(key=entry_order)

    return sections_sorted, section_map, entries_by_section


def render_markdown(all_worlds_data):
    out = []
    out.append("# Site Map")
    out.append("")
    out.append(
        f"_Auto-generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} "
        f"directly from each repo's own TSV content files — not hand-maintained._"
    )
    out.append("")
    out.append(
        "Status key: 🟢 live · 🟡 wip (built, not fully finished) · ⚪ no page yet · 🔴 hidden"
    )
    out.append("")

    status_icon = {
        "live": "🟢",
        "wip": "🟡",
        "hidden": "🔴",
    }

    for _name, (world, (sections_sorted, section_map, entries_by_section)) in all_worlds_data.items():
        out.append(f"## {world['name']}")
        out.append(f"Live site: {world['base_url']}")
        out.append("")

        for sec in sections_sorted:
            sec_id = sec["id"]
            sec_title = sec.get("title", sec_id)
            sec_status = normalize_status(sec.get("status"))
            sec_href = resolve_href(sec.get("href"), world["base_url"])
            icon = status_icon.get(sec_status, "⚪")

            if sec_href:
                out.append(f"### {icon} [{sec_title}]({sec_href})")
            else:
                out.append(f"### {icon} {sec_title} _(section, no standalone page)_")

            subtitle = sec.get("subtitle", "").strip()
            if subtitle:
                out.append(f"_{subtitle}_")
            out.append("")

            rows = entries_by_section.get(sec_id, [])
            if not rows:
                out.append("_(no entries yet)_")
                out.append("")
                continue

            for e in rows:
                title = html.unescape((e.get("title", "") or "").replace("<br>", " ").replace(chr(34), ""))
                e_status = normalize_status(e.get("status"))
                e_href = resolve_href(e.get("href"), world["base_url"])
                e_icon = status_icon.get(e_status, "⚪")
                if e_href:
                    out.append(f"- {e_icon} [{title}]({e_href})")
                else:
                    out.append(f"- {e_icon} {title} _(no page yet)_")
            out.append("")

    return "\n".join(out)


# ---------------------------------------------------------------------------
# Content inventory: Cabinet-only, local files, no network -- cross-checks
# content/cabinet-{sections,entries}.tsv against mkdocs.yml's nav tree.
# ---------------------------------------------------------------------------

def read_local_tsv(path):
    with open(path, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f, delimiter="\t"))


NAV_LEAF_RE = re.compile(r"^\s*-\s+(.+?)\s*:\s*(\S+)\s*$")
NAV_GROUP_RE = re.compile(r"^\s*-\s+(.+?)\s*:\s*$")


def parse_mkdocs_nav(mkdocs_path):
    """Flat list of (label, target) leaves anywhere under the top-level
    `nav:` key. Ignores nesting/hierarchy entirely -- this script only
    needs "does this target have a matching TSV row", not the nav's
    visual tree shape. Skips commented-out lines (`#`) and group headers
    (a label ending in `:` with no target on the same line)."""
    with open(mkdocs_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    leaves = []
    in_nav = False
    for raw_line in lines:
        line = raw_line.rstrip("\n")
        stripped = line.strip()
        if not in_nav:
            if line.startswith("nav:"):
                in_nav = True
            continue
        if not stripped:
            continue
        if line[0] not in (" ", "\t", "-"):
            # back to column 0 on a real key -- nav block is over
            break
        if stripped.startswith("#"):
            continue
        m = NAV_LEAF_RE.match(line)
        if m:
            leaves.append((m.group(1).strip(), m.group(2).strip()))
    return leaves


def path_key(raw):
    """Canonical comparison key for a TSV href or a nav target, so
    `about.md` (nav) and `about/` (TSV) land on the same key. Absolute
    URLs compare literally (minus a trailing slash); relative paths drop
    a `.md` suffix / trailing `/index`, then compare case-insensitively."""
    s = (raw or "").strip()
    if not s:
        return None
    if s.startswith("http://") or s.startswith("https://"):
        return s.rstrip("/")
    s = s.strip("/")
    if s.endswith(".md"):
        s = s[:-3]
    if s.endswith("/index"):
        s = s[: -len("/index")]
    return s.lower() or None


def build_content_inventory():
    sections = read_local_tsv(CABINET_SECTIONS_TSV)
    entries = read_local_tsv(CABINET_ENTRIES_TSV)
    nav_leaves = parse_mkdocs_nav(MKDOCS_YML_PATH)

    nav_by_key = {}
    for label, target in nav_leaves:
        key = path_key(target)
        if key:
            nav_by_key.setdefault(key, []).append((label, target))

    href_owners = {}  # path_key -> [(kind, id), ...], for duplicate detection

    def row_nav_match(href):
        key = path_key(href)
        if key is None:
            return None, key
        hit = nav_by_key.get(key)
        return (hit[0][0] if hit else None), key

    out = []
    out.append("# Cabinet Content Inventory")
    out.append("")
    out.append(
        f"_Auto-generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} "
        f"by `tools/generate_sitemap.py` from `content/cabinet-sections.tsv`, "
        f"`content/cabinet-entries.tsv`, and `mkdocs.yml`'s own nav tree -- do "
        f"not hand-edit, re-run the script to refresh._"
    )
    out.append("")
    out.append(
        "Cabinet-only. Bookshelf/fffx and other assembled content's live "
        "status is what [/sitemap/](../docs/compass/sitemap.md) is for -- not "
        "duplicated here. `Map` is simply each row's own `status` column "
        "(`true`/`wip`/`false`), read directly, not separately computed."
    )
    out.append("")
    out.append(
        "Flags below are mechanical string-matching, not judgement calls -- "
        "deliberate cross-listings (e.g. Swatch Fields) and map-only entries "
        "with no nav entry by design (e.g. assembled Teaching entries) will "
        "show up here too. Skim and dismiss the ones that are fine rather "
        "than treating every flag as a bug."
    )
    out.append("")

    out.append("## Sections")
    out.append("")
    out.append("| id | title | TSV href | Map (status) | mkdocs nav |")
    out.append("|---|---|---|---|---|")
    for s in sections:
        nav_label, key = row_nav_match(s.get("href"))
        if key:
            href_owners.setdefault(key, []).append(("section", s["id"]))
        nav_cell = f"Y ({nav_label})" if nav_label else ("N" if s.get("href") else "--")
        out.append(
            f"| `{s['id']}` | {s.get('title', '')} | `{s.get('href', '') or '--'}` "
            f"| {s.get('status', '')} | {nav_cell} |"
        )
    out.append("")

    out.append("## Entries")
    out.append("")
    out.append("| id | section | title | TSV href | Map (status) | mkdocs nav |")
    out.append("|---|---|---|---|---|---|")
    for e in entries:
        nav_label, key = row_nav_match(e.get("href"))
        if key:
            href_owners.setdefault(key, []).append(("entry", e["id"]))
        nav_cell = f"Y ({nav_label})" if nav_label else ("N" if e.get("href") else "--")
        out.append(
            f"| `{e['id']}` | {e.get('section', '')} | {e.get('title', '')} "
            f"| `{e.get('href', '') or '--'}` | {e.get('status', '')} | {nav_cell} |"
        )
    out.append("")

    # ---- Flags ----
    flags = []

    all_tsv_keys = set()
    for kind, rows in (("section", sections), ("entry", entries)):
        for row in rows:
            key = path_key(row.get("href"))
            if key:
                all_tsv_keys.add(key)

    for key, owners in href_owners.items():
        if len(owners) > 1:
            owner_desc = ", ".join(f"{k} `{i}`" for k, i in owners)
            flags.append(f"**Duplicate href** (`{key}`): {owner_desc}")

    for key, leaves in nav_by_key.items():
        if key in all_tsv_keys:
            continue
        for label, target in leaves:
            flags.append(f"**Nav entry with no TSV row**: \"{label}\" (`{target}`)")

    for kind, rows in (("section", sections), ("entry", entries)):
        for row in rows:
            href = row.get("href")
            if not href:
                continue
            key = path_key(href)
            if key and key not in nav_by_key:
                flags.append(
                    f"**TSV row with no nav entry**: {kind} `{row['id']}` (`{href}`)"
                )

    out.append("## Flags")
    out.append("")
    if flags:
        for flag in flags:
            out.append(f"- {flag}")
    else:
        out.append("_None._")
    out.append("")

    return "\n".join(out)


def main():
    all_worlds_data = {}
    for world in WORLDS:
        all_worlds_data[world["name"]] = (world, build_world(world))

    content = render_markdown(all_worlds_data)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote {os.path.relpath(OUTPUT_PATH, ROOT)}")

    inventory = build_content_inventory()
    with open(INVENTORY_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(inventory)
    print(f"Wrote {os.path.relpath(INVENTORY_OUTPUT_PATH, ROOT)}")


if __name__ == "__main__":
    main()
