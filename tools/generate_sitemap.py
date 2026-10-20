#!/usr/bin/env python3
"""
generate_sitemap.py

Builds a single sitemap across all three Cabinet of Curiosities worlds
(Cabinet, fffx, Bookshelf) by reading each repo's own TSV content files
from its local clone, sitting next to this repo (../form-follows-fx,
../TheBookshelfOfCuriosities) -- the same files each site's build script
(build-cabinet-content.js / build-fffx-content.js / build-bookshelf-content.js)
already treats as the source of truth for nav/map/shelf structure.

Local clones, not GitHub: the sibling repos are being made private
(Cloudflare migration, #147), and anonymous raw.githubusercontent.com
reads stop working for private repos. Reading needs no network.

Freshness: before reading, each clone gets a short `git fetch` (skip with
--offline) and a report -- up to date / behind / ahead / diverged from
origin, uncommitted TSV edits, not on the expected branch. These are
warnings only: the script never prompts, pulls or discards anything, and
a failed or timed-out fetch does not stop it (Cabinet's admin dashboard
runs it as a non-interactive subprocess). A missing clone or TSV is an
error. The sitemap reflects the clones' working copies, so pull first if
a clone is reported behind.

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
    python3 tools/generate_sitemap.py --offline          # skip git fetch
    python3 tools/generate_sitemap.py --clone fffx=D:/elsewhere/form-follows-fx
    python3 tools/generate_sitemap.py --fetch-timeout 5  # seconds per clone (default 10)

--clone keys: cabinet, fffx, bookshelf.

Requires: only the standard library (csv, re, subprocess) and git on PATH
(for the freshness check only). No pip installs needed -- mkdocs.yml's nav
is read with a small regex-based line scanner rather than a YAML parser,
since its own shape (a flat list of "- Label : target" leaves under one
top-level `nav:` key) doesn't need one.
"""

import argparse
import csv
import html
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(ROOT, "docs", "compass", "sitemap.md")
INVENTORY_OUTPUT_PATH = os.path.join(ROOT, "documentation", "CONTENT-INVENTORY.md")
MKDOCS_YML_PATH = os.path.join(ROOT, "mkdocs.yml")
CABINET_SECTIONS_TSV = os.path.join(ROOT, "content", "cabinet-sections.tsv")
CABINET_ENTRIES_TSV = os.path.join(ROOT, "content", "cabinet-entries.tsv")

PARENT = os.path.dirname(ROOT)

# ---------------------------------------------------------------------------
# One entry per world. base_url is where relative hrefs in that world's own
# TSVs resolve against (each world's TSV was written assuming it's hosted at
# its own domain -- see each repo's WORLD-SYSTEMS.md). local_dir is the
# clone the TSVs are read from (override with --clone KEY=PATH); repo is
# only used in messages.
# ---------------------------------------------------------------------------
WORLDS = [
    {
        "key": "cabinet",
        "name": "Cabinet of Curiosities",
        "repo": "jesmehta/CabinetOfCuriosities",
        "local_dir": ROOT,
        "branch": "main",
        "base_url": "https://cabinetofcuriosities.in/",
        "sections_tsv": "content/cabinet-sections.tsv",
        "entries_tsv": "content/cabinet-entries.tsv",
        "entry_section_key": "section",
    },
    {
        "key": "fffx",
        "name": "fffx (Form follows f(x))",
        "repo": "jesmehta/form-follows-fx",
        "local_dir": os.path.join(PARENT, "form-follows-fx"),
        "branch": "main",
        "base_url": "https://fffx.cabinetofcuriosities.in/",
        "sections_tsv": "content/fffx-sections.tsv",
        "entries_tsv": "content/fffx-entries.tsv",
        "entry_section_key": "section",
    },
    {
        "key": "bookshelf",
        "name": "Bookshelf of Curiosities",
        "repo": "jesmehta/TheBookshelfOfCuriosities",
        "local_dir": os.path.join(PARENT, "TheBookshelfOfCuriosities"),
        "branch": "main",
        "base_url": "https://bookshelf.cabinetofcuriosities.in/",
        "sections_tsv": "content/bookshelf-sections.tsv",
        "entries_tsv": "content/bookshelf-entries.tsv",
        "entry_section_key": "section",
    },
]

# This repo's own site -- pulled out of WORLDS[0] so path_key() (below) can
# recognize an absolute https://cabinetofcuriosities.in/... nav target as
# "this site" and compare it against a TSV row's relative href for the same
# page, rather than the two forms silently never matching.
CABINET_BASE_URL = WORLDS[0]["base_url"]


class SitemapError(Exception):
    pass


def world_tsv_path(world, which):
    return os.path.join(world["local_dir"], world[which])


def git(local_dir, args, timeout=None):
    """Run git non-interactively: never prompt for credentials (a prompt
    would hang the admin dashboard's subprocess call)."""
    env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never")
    return subprocess.run(
        ["git", "-C", local_dir] + args,
        stdin=subprocess.DEVNULL, capture_output=True, text=True,
        timeout=timeout, env=env,
    )


def git_fetch(local_dir, branch, timeout):
    """`git fetch` bounded by `timeout` seconds. Returns None on success or a
    short reason string. Output goes to a temp file, not a pipe, and on
    timeout the whole process tree is killed: git's network helper
    (git-remote-https) otherwise keeps a pipe open and makes the caller wait
    out its own connection timeout (~20s on Windows) despite the limit."""
    import tempfile
    env = dict(os.environ, GIT_TERMINAL_PROMPT="0", GCM_INTERACTIVE="never")
    # On Unix, give git its own process group (start_new_session) so a
    # timeout can kill git *and* its helpers, as taskkill /T does on Windows.
    with tempfile.TemporaryFile(mode="w+") as err:
        proc = subprocess.Popen(
            ["git", "-C", local_dir, "fetch", "--quiet", "origin", branch],
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=err, env=env,
            start_new_session=(os.name != "nt"),
        )
        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            if os.name == "nt":
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                import signal
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            proc.wait()
            return f"timed out after {timeout:g}s"
        if proc.returncode == 0:
            return None
        err.seek(0)
        lines = [l.strip() for l in err.read().splitlines() if l.strip()]
        first = next((l for l in lines if l.startswith("fatal:")), lines[0] if lines else "unknown error")
        return f"failed: {first}"


def check_clone(world, offline, fetch_timeout):
    """Validate a world's clone and print its freshness. Raises
    SitemapError only for problems that make the sitemap impossible
    (missing clone or TSV); everything else is a printed warning."""
    name, local_dir, branch = world["name"], world["local_dir"], world["branch"]
    for which in ("sections_tsv", "entries_tsv"):
        if not os.path.isfile(world_tsv_path(world, which)):
            raise SitemapError(
                f"{name}: {world[which]} not found under {local_dir} -- clone "
                f"{world['repo']} there, or pass --clone {world['key']}=PATH"
            )

    prefix = f"[{world['key']}]"
    try:
        if git(local_dir, ["rev-parse", "--is-inside-work-tree"]).returncode != 0:
            print(f"{prefix} WARNING: {local_dir} is not a git clone -- freshness unknown")
            return
    except FileNotFoundError:
        print(f"{prefix} WARNING: git not found on PATH -- freshness unknown")
        return

    if offline:
        print(f"{prefix} offline: not fetching; comparing with the last-fetched origin/{branch}")
    else:
        problem = git_fetch(local_dir, branch, fetch_timeout)
        if problem:
            print(f"{prefix} WARNING: git fetch {problem} -- comparing with the last-fetched origin/{branch}")

    current = git(local_dir, ["branch", "--show-current"]).stdout.strip()
    if current != branch:
        print(f"{prefix} WARNING: clone is on '{current or 'detached HEAD'}', not '{branch}' -- reading that working copy")

    counts = git(local_dir, ["rev-list", "--left-right", "--count", f"origin/{branch}...HEAD"])
    if counts.returncode != 0:
        print(f"{prefix} WARNING: no origin/{branch} to compare with -- freshness unknown")
    else:
        behind, ahead = (int(n) for n in counts.stdout.split())
        if behind and ahead:
            print(f"{prefix} WARNING: diverged from origin/{branch} ({behind} behind, {ahead} ahead) -- reconcile before relying on the sitemap")
        elif behind:
            print(f"{prefix} WARNING: {behind} commit(s) behind origin/{branch} -- pull, then re-run")
        elif ahead:
            print(f"{prefix} note: {ahead} commit(s) ahead of origin/{branch} (unpushed local work is included)")
        else:
            print(f"{prefix} up to date with origin/{branch}")

    dirty = git(local_dir, ["status", "--porcelain", "--", world["sections_tsv"], world["entries_tsv"]]).stdout.strip()
    if dirty:
        print(f"{prefix} WARNING: uncommitted TSV changes are included in the sitemap:")
        for line in dirty.splitlines():
            print(f"{prefix}   {line}")


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
    sections = read_local_tsv(world_tsv_path(world, "sections_tsv"))
    entries = read_local_tsv(world_tsv_path(world, "entries_tsv"))

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
NAV_BARE_RE = re.compile(r"^\s*-\s+(\S+)\s*$")


def parse_mkdocs_nav(mkdocs_path):
    """Flat list of (label, target) leaves anywhere under the top-level
    `nav:` key. Ignores nesting/hierarchy entirely -- this script only
    needs "does this target have a matching TSV row", not the nav's
    visual tree shape. Skips commented-out lines (`#`) and group headers
    (a label ending in `:` with no target on the same line).

    A section's first leaf is often written bare -- `- teaching/index.md`,
    no `Label :` prefix -- specifically so mkdocs-section-index can merge
    it into the clickable section heading. NAV_LEAF_RE requires a literal
    `:` separating label from target, so it never matches these (a plain
    relative path has no colon at all); NAV_BARE_RE catches that case as a
    fallback, using the target itself as a stand-in label. Tried after
    NAV_GROUP_RE so an actual group header (a label ending in `:` with no
    target, e.g. `- Compass :`) is never misread as a bare leaf."""
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
            continue
        if NAV_GROUP_RE.match(line):
            continue
        m = NAV_BARE_RE.match(line)
        if m:
            target = m.group(1).strip()
            leaves.append((target, target))
    return leaves


def path_key(raw):
    """Canonical comparison key for a TSV href or a nav target, so
    `about.md` (nav) and `about/` (TSV) land on the same key. Absolute
    URLs compare literally (minus a trailing slash) UNLESS they start with
    this site's own `CABINET_BASE_URL` -- mkdocs.yml often writes Cabinet's
    own pages as full absolute URLs while cabinet-entries.tsv writes the
    same page as a site-relative href, and those need to land on the same
    key too, not just the `about.md`/`about/` case. A cross-domain absolute
    URL (Bookshelf, fffx, an external site) has no relative TSV form to
    reconcile against, so it still compares literally. Relative paths drop
    a `.md` suffix / trailing `/index`, then compare case-insensitively."""
    s = (raw or "").strip()
    if not s:
        return None
    if s.startswith(CABINET_BASE_URL):
        s = s[len(CABINET_BASE_URL):]
    elif s.startswith("http://") or s.startswith("https://"):
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
        "than treating every flag as a bug. One exception is filtered out "
        "automatically: a TSV row with `status` false is expected to have no "
        "nav entry (it's not live), so that combination is never flagged."
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
            if normalize_status(row.get("status")) == "hidden":
                continue  # status false -- not live, so no nav entry is expected, not a flag
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


def parse_args(argv):
    p = argparse.ArgumentParser(description="Generate Cabinet's cross-world sitemap and content inventory from local clones.")
    p.add_argument("--offline", action="store_true", help="skip git fetch; compare with the last-fetched origin")
    p.add_argument("--fetch-timeout", type=float, default=10.0, help="seconds allowed per git fetch (default 10)")
    p.add_argument("--clone", action="append", default=[], metavar="KEY=PATH",
                   help="use another clone for a world (keys: cabinet, fffx, bookshelf)")
    args = p.parse_args(argv)
    overrides = {}
    for item in args.clone:
        key, sep, path = item.partition("=")
        keys = [w["key"] for w in WORLDS]
        if not sep or key not in keys:
            p.error(f"--clone expects KEY=PATH with KEY one of {', '.join(keys)}")
        overrides[key] = os.path.abspath(path)
    return args, overrides


def main(argv=None):
    args, overrides = parse_args(argv)
    for world in WORLDS:
        if world["key"] in overrides:
            world["local_dir"] = overrides[world["key"]]

    try:
        for world in WORLDS:
            check_clone(world, args.offline, args.fetch_timeout)
    except SitemapError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

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
    return 0


if __name__ == "__main__":
    sys.exit(main())
