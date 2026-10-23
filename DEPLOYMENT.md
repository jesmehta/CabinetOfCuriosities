# The Cabinet of Curiosities — build, preview, edit, deploy and recover

The public site is built from this repository into `public/` by **one script**, `tools/build-site.mjs`
(`npm run build`). Cloudflare, GitHub Actions (until the domain moves) and your own machine all run that same
script, so they produce the same site. Nothing outside `public/` is ever published: documentation, `content/`
TSVs, tooling and the external repositories' private files stay out.

Everything below works without Claude/Codex. Commands are run from the repository folder. The same structure as
the FFFX and Bookshelf runbooks, which are proven on Cloudflare.

**Status (2026-10-23):** being prepared for the move from GitHub Pages to Cloudflare (plan:
`cloudflare migration/plan.md`). `cabinetofcuriosities.in` (and `www`) are still served by GitHub Pages. No
Cloudflare Worker exists yet. History and evidence: `cloudflare migration/`.

## What is published

- The landing page (`docs/index.html`) and every MkDocs page (`docs/`, rendered), with their assets.
- **External projects** (other repositories, mounted under this site), one row each in
  `content/external-repos.tsv`. Each row names a `repository`, an optional `subfolder`, a `destination` route and
  a **`revision`: the exact commit SHA that is published**. Only the files listed in
  `content/external-allowlists/<id>.txt` are published (one file per line, relative to the mount folder,
  `#` starts a comment, files only, no wildcards). Files not listed are left out and reported in
  `build-unlisted.txt`; a **listed** file that is missing fails the build, because a page would break. A file name
  containing `#` cannot be listed: rename it at the source (`#` also breaks it on the web).
- The archive of earlier landing pages, `archived-landing-pages/` → `/archived-landing-pages/`, only the files in
  `content/archive-allowlist.txt`.
- `sitemap.xml`: MkDocs' pages plus the landing page and each mount's entry and first-level pages (never the
  archive). The build checks that every URL in it resolves.

The build drops MkDocs' `*.map` files, `sitemap.xml.gz` and `CNAME` (GitHub Pages only), and refuses to finish if
a never-published kind of file (`.md`, `.tsv`, `.zip`, `.py`, configuration, …) reached `public/`. Exception:
the archive's two linked v1 downloads (`archived-landing-pages/v1/files/`).

**The owner's rule for allowlists (2026-10-22/23):** publish only what a visitor sees or a page needs to run — no
documentation, notes, configuration, archives, dotfiles, backups or development leftovers. LICENSE files are kept.

## Internet dependencies

Visitors' browsers load Google Fonts, Cloudflare Web Analytics and (some student projects) libraries from CDNs.
Building needs internet to fetch the external repositories (only the listed files, at the pinned commits) and
to install dependencies the first time. After one successful build the external files are cached in
`_external/git/`, and `npm run build -- --offline` builds without network. **Deploying** always needs
internet (Cloudflare); **restoring a saved release** to another static host needs none of the above.

## Tools

| Tool | Needed for | Tested locally (2026-10-23) |
| --- | --- | --- |
| Git | source control, fetching the external repositories | 2.47 |
| Python 3 | the site build (MkDocs), the sitemap tool | 3.14.6 |
| Node.js ≥ 22 (includes npm) | the site build, editors, deploy | 24.18.0 |
| Wrangler | Cloudflare deploys only | 4.149.0 (pinned in `package.json`) |

## One-time setup on a computer

```sh
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-lock.txt   # Windows
# .venv/bin/python -m pip install -r requirements-lock.txt     # macOS/Linux
npm ci
```

`.venv/` holds the exact Python package versions from `requirements-lock.txt` and is used by the build
automatically. It is not committed.

## Editing content (the local CMS and tools)

Double-click a launcher. Each starts from its own folder and activates `.venv` (if it exists), so `python` and
`mkdocs` are the pinned versions:

| Launcher | Opens |
| --- | --- |
| `run-cabinet-editor.bat` | Cabinet editor, <http://127.0.0.1:5858/admin/> |
| `run-now-editor.bat` | Now editor, <http://127.0.0.1:5757/admin/> |
| `run-admin-controls.bat` | Admin dashboard (generate content, site map, MkDocs check), <http://127.0.0.1:5959/admin/> |
| `run Mkdocs serve.bat` | Live preview of the MkDocs pages only, <http://127.0.0.1:8000/> |

Without a launcher, activate `.venv` first (`.venv\Scripts\activate` or `source .venv/bin/activate`), then
`node tools/<editor>.js`. The editors never commit or push. You commit and push yourself, and **a push to `main`
triggers the builds** (see the build watch paths).

The **site-map tool** (admin dashboard, or `python tools/generate_sitemap.py`) reads the sibling local clones
`../form-follows-fx` and `../TheBookshelfOfCuriosities` (both private repositories), not GitHub. Pull them first.

## 1. Build

```sh
npm run build
```

Prints nine steps and ends with `public/: N files`. Next to `public/` it writes `public-manifest.sha256`
(checksums), `build-info.json` (source commit, every mount's repository and revision, tool versions) and
`build-unlisted.txt`. None of these is published. Building twice from the same commit gives identical files.

## 2. Preview locally (no Cloudflare account needed)

```sh
npm run preview
```

Then open <http://127.0.0.1:8000/>. Stop with Ctrl+C. This is the complete site, mounts and archive included.
(`mkdocs serve` shows only the MkDocs pages.)

### Previewing a change to an external project (development build)

```sh
npm run build -- --external-local tracery-bots=../TraceryBots
python -m http.server 8000 --bind 127.0.0.1 --directory public
```

`--external-local <id>=<folder>` takes that mount from a local folder (its current files, same allowlist)
instead of its pinned revision. The result is a **development build**: `build-info.json` says so, and
`save-artifact`, `verify-artifact` and `npm run deploy` refuse it or rebuild. Never deploy `public/` by hand after a
development build (see section 4).

## 3. Updating an external project

A push to an external repository does **not** change this site. To publish a newer version:

```sh
npm run update-externals            # or: npm run update-externals -- --check   (report only)
```

It asks GitHub for each repository's current version, writes the new `revision` values into
`content/external-repos.tsv`, and prints per mount: **NEW** files (allowlist candidates — nothing is added
automatically), **MISSING** listed files (the build would fail), **CHANGED** listed files. Then: add or remove
allowlist lines as needed, `npm run build`, `npm run preview`, check, commit, push.

## 4. Save a known-good copy (before deploys you care about)

Commit first, then:

```sh
npm run build
npm run save-artifact
npm run verify-artifact -- releases/<name printed by save-artifact>
```

`releases/<date>_<commit>/site/` is the complete site; `SHA256SUMS`, `BUILD-INFO.json` and `SOURCE.txt` record
what it is. Both tools refuse a development build. `releases/` is not committed: **copy important releases to a
backup location.**

**`verify-artifact` also needs this repository's history.** It checks the release's record of external projects
against `content/external-repos.tsv` **as it was at the release's own source commit**, read with `git` from the
clone you run it in. So verify from a **full** clone that contains that commit (your normal working copy, or a fresh
full `git clone` — not a shallow one). It refuses, and says so, if the commit is missing. For recovery without
GitHub, back up the history together with the releases:

```sh
git bundle create ../cabinet-history-<date>.bundle --all     # one file with the whole history
# to use it later, anywhere:  git clone cabinet-history-<date>.bundle CabinetOfCuriosities
```

Refresh the bundle whenever you back up a new release. A release folder alone can still be served by any static
host (section 8); only the verification step needs the history.

## 5. Deploy to Cloudflare manually

Log in with narrow permissions only for the deploy, then log out:

```sh
npx wrangler login --scopes account:read user:read workers_scripts:write
npm run deploy
npx wrangler logout
```

`npm run deploy` always makes a fresh **pinned** build first, then uploads it. Wrangler prints a **Version ID**;
note it with the commit you deployed. **Limit:** a hand-typed `npx wrangler deploy` without the build uploads
whatever is in `public/`, even a development build. Don't.

## 6. Automatic deployment (Cloudflare Git integration)

One-time setup in the Cloudflare dashboard (owner):

1. **Workers & Pages → Create application → GitHub**. First add `CabinetOfCuriosities` to the *Cloudflare Workers
   and Pages* app **on GitHub's side** (Settings → Applications → Installed GitHub Apps → Cloudflare Workers and
   Pages → Repository access → Only select repositories), not only by picking it in Cloudflare's search;
   afterwards the Builds settings page must show no "disconnected" banner (see Troubleshooting).
2. Settings:

   | Setting | Value |
   | --- | --- |
   | Worker name | `cabinet-of-curiosities` (must match `wrangler.jsonc`) |
   | Production branch | `main` |
   | Build command | `pip install -r requirements-lock.txt && npm run build` (replace any prefilled `npm run build`) |
   | Deploy command | `npx wrangler deploy` |
   | Root directory | `/` or empty (repository root) |
   | API token | a new token for this Worker (e.g. "cabinet build token"). Per Cloudflare's documentation such tokens are account-wide, so the separate name gives **separate revocation only** |
   | Build variables | none needed |

3. **Save and Deploy.** The build log ends with `Current Version ID: …`. The address is
   `https://cabinet-of-curiosities.jesmehta.workers.dev`.

**Why the build command installs the lock file:** Cloudflare **automatically runs
`pip install -r requirements.txt`** (unpinned) before the build command. The build command's
`pip install -r requirements-lock.txt` puts the exact pinned versions back. Never remove it.

**The external repositories are public** and are fetched anonymously. If one becomes private, the build fails
for it until a read-only credential is set up for the build (a separate, owner-approved change; see
`documentation/cloudflare migration/world-assembly-decisions.md`).

**Build watch paths (skip builds for record-only commits):** *Settings → Builds → Build watch paths*, **exclude**
each of these as its own entry:

- `cloudflare migration/*`
- `documentation/*`
- `README.md`, `DEPLOYMENT.md`, `WORLD-SYSTEMS.md`

Everything else must keep triggering builds: website content in `docs/`, `content/` (TSVs, external pins,
allowlists), `archived-landing-pages/`, `tools/`, `mkdocs.yml`, `overrides/`, lock files, `package*.json`,
`wrangler.jsonc`. Test both: a push touching only `cloudflare migration/` produces no build; a push touching
`docs/` produces a new version.

**Branch builds (expected, not yet demonstrated for Cabinet):** on Bookshelf the dashboard had no switch to stop
builds of other branches; with preview URLs disabled they built a version that was never deployed to the live address. Avoid pushing other branches to GitHub.

## 7. What is live? Roll back

The dashboard (*Workers & Pages → cabinet-of-curiosities → Deployments*) shows the active version and history.
Options, simplest first:

1. **Dashboard rollback:** *Deployments* → earlier version → **Rollback**.
2. **Redeploy a saved copy** (works even if GitHub or Cloudflare's history is unusable):

   ```sh
   npm run verify-artifact -- releases/<name>
   npx wrangler login --scopes account:read user:read workers_scripts:write
   npx wrangler deploy --assets releases/<name>/site --message "restore saved artifact"
   npx wrangler logout
   ```

   Never skip `verify-artifact`.
3. **Fix forward in git:** `git revert <bad-commit>`, push.

After 1 or 2, also fix or revert the bad commit, otherwise the next push deploys it again.

## 8. Another host (no Cloudflare)

`public/` (or any `releases/<name>/site/`) is a complete static website. Upload its contents to the **root** of
any static web host. Its 404 page is `404.html`; configure the host to serve it for missing pages if it doesn't
do so automatically. `wrangler.jsonc` is the only Cloudflare-specific file.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `docs/index.md must not exist` | The landing page is `docs/index.html`; delete or rename `docs/index.md`. |
| `generated content was out of date` | A TSV changed without regenerating. The build has now regenerated it: review, commit, build again. |
| `"…" not found in the source -- a page that needs it would break` | A listed file is missing at the pinned revision. Remove the line from the allowlist, or restore the file in its repository and update the pin. If the message says *letter case differs*, fix the case in the list (the build server is case-sensitive). |
| Another allowlist error | Files only, one per line, forward slashes, no `..`, wildcards or folders, nothing listed twice. |
| `revision is required for an active row` | Every active row of `content/external-repos.tsv` needs a full 40-character commit SHA (`npm run update-externals`). |
| `could not fetch this commit` | The pinned commit is not on GitHub (not pushed?), or the repository is no longer public. |
| `not in the cache and --offline was given` | Build once with internet; later offline builds then work. |
| `… is not a cache of …` | Something else is in `_external/git/`. The build never deletes it: move that folder away and build again. |
| `DEVELOPMENT build` (save, verify) | The build used `--external-local`. Run `npm run build` without it. |
| `private files reached public/` | A listed file has a never-published type (`.md`, `.tsv`, `.zip` …). Remove it from the list. |
| `sitemap.xml: … (no file)` | A sitemap URL does not resolve: a mount page was renamed or removed. |
| `mkdocs build --strict failed` | Broken nav or link in `docs/`; the lines are printed and the full log is in `mkdocs-build.log`. |
| `No Python found` | Create `.venv` (one-time setup) or set `PYTHON`. |
| Admin dashboard's "MkDocs check" fails but `npm run build` works | It was started without `.venv`. Use `run-admin-controls.bat`. |
| `EBUSY … rmdir` (Windows) | Something has `public/` open (preview server, `wrangler dev`, Explorer). Close it and rerun. |
| Pushes no longer create new versions; the Builds settings page says "This project is disconnected from your Git account" | Cloudflare's GitHub App cannot see the repository: add it under GitHub → Settings → Applications → Installed GitHub Apps → **Cloudflare Workers and Pages** → Repository access, then reconnect on the Builds page (*Manage*, never *Disconnect*). Check for a **new version ID** after each push that should deploy. (FFFX, 2026-10-21.) |
| Cloudflare build fails installing Python packages | Check the build log; Cloudflare's Python version can be pinned with the build variable `PYTHON_VERSION`. |
