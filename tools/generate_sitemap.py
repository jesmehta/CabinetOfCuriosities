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

Writes docs/sitemap.md, an mkdocs source page like docs/about.md and
docs/colophon.md -- mkdocs builds it into the live /sitemap/ page linked
from the compass rose's W point (see content/cabinet-entries.tsv's
compass-w row).

Usage:
    python3 tools/generate_sitemap.py

Requires: only the standard library (urllib, csv). No pip installs needed.
"""

import csv
import html
import io
import os
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(ROOT, "docs", "sitemap.md")

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


def main():
    all_worlds_data = {}
    for world in WORLDS:
        all_worlds_data[world["name"]] = (world, build_world(world))

    content = render_markdown(all_worlds_data)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Wrote {os.path.relpath(OUTPUT_PATH, ROOT)}")


if __name__ == "__main__":
    main()
