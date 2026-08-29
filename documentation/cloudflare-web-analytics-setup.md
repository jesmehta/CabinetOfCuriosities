# Cloudflare Web Analytics --- JS Beacon Setup

## Goal

Add Cloudflare Web Analytics to the existing static Cabinet sites
without changing hosting or deployment.

Current sites may continue to be built/served through GitHub Pages.
Cloudflare Pages is **not required** for Web Analytics.

## Setup

1.  In the Cloudflare dashboard, create/enable **Web Analytics** for the
    relevant site.
2.  Cloudflare will provide a JavaScript beacon containing a
    site-specific token, similar to:

``` html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon='{"token":"CLOUDFLARE_TOKEN"}'></script>
```

3.  Use the **actual token supplied by Cloudflare**. Do not invent or
    reuse a placeholder token.

## Where to add it

The beacon should appear once on every public HTML page, preferably
immediately before `</body>`.

### Custom landing pages

Add the beacon directly to the relevant `index.html` or shared template.

### MkDocs pages

Add the beacon through the MkDocs Material template/theme override so it
is inherited by all generated pages. Do **not** manually add it to
individual Markdown files.

If a site already has a shared HTML/template component that is reliably
included on every page, use that instead of duplicating the beacon.

## Repositories / sites

Apply the setup independently to the Cabinet ecosystem sites as
required:

-   Cabinet
-   Bookshelf
-   FFFX

Do not change their existing build, GitHub Pages, CNAME, DNS, or
deployment configuration merely to add analytics.

## Verification

After deployment:

1.  Open the live site.
2.  Confirm `beacon.min.js` loads successfully in browser developer
    tools.
3.  Confirm a Cloudflare analytics request is sent.
4.  Check the Cloudflare **Web Analytics** dashboard after data begins
    appearing.
5.  Verify both the custom landing page and at least one
    MkDocs-generated page.

## Constraints

-   The public analytics token is expected to be present in client-side
    HTML; it is not an account/API secret.
-   Do not commit Cloudflare account credentials or API keys.
-   Load the script with `defer`.
-   Analytics failure must not affect site functionality.
-   Do not add cookies, fingerprinting, or additional visitor
    identifiers.
-   Do not put personal/sensitive information into page URLs or
    analytics events.
-   If a Content Security Policy is introduced later, ensure it permits
    the Cloudflare analytics script/beacon endpoints.

## Documentation

Record the analytics implementation in the repo documentation,
including:

-   where the beacon is injected,
-   whether it covers both custom and MkDocs pages,
-   the Cloudflare Web Analytics property/site it corresponds to,
-   how to verify that tracking is working.

## Implementation record — Cabinet (2026-08-29)

Site/property: `cabinetofcuriosities.in`, token
`16664b6ab6d449a799db2dbcfb97c6ce`. Snippet used is the exact one
Cloudflare's dashboard supplied — `<script type="module" src=...
data-cf-beacon=...>` — not the `defer`-classic form sketched above (the
two are equivalent: module scripts are deferred by the HTML spec too).
See `cloudflare-js-snippet.md` for the raw copy (gitignored, plaintext
working notes — the token itself isn't secret, it just doesn't need a
second committed copy once it's baked into the pages below).

Covers both page types, injected once each, not per-page:

-   **MkDocs-generated pages** (`docs/*.md` — About, Colophon, Now,
    Sitemap, Teaching, Makings, 3DP, etc.): `mkdocs.yml` gained
    `theme.custom_dir: overrides`; `overrides/main.html` extends
    MkDocs Material's `base.html` and injects the beacon into the
    `extrahead` block, so it's inherited by every generated page from
    one place. Confirmed via a local `mkdocs build`: beacon present in
    every built page's `<head>`, zero build errors.
-   **Standalone landing page** (`docs/index.html`, the archipelago
    map — not MkDocs-templated, so the override above doesn't reach
    it): beacon added directly before `</body>` in
    `landing-v3/index.template.html` (the hand-edited source, so it
    survives the next `build-static.mjs` + promote cycle) and, the same
    day, to the already-promoted `docs/index.html` too, so tracking
    went live immediately without forcing a full Playwright rebuild
    just for a one-line addition.

Explicitly **not** covered, by design: `tools/now-editor.js` (the local
`/now` admin server) — never deployed, not part of the MkDocs build at
all, so there's no public page for a beacon to go on.

Not yet done: Bookshelf (`TheBookshelfOfCuriosities`) and FFFX
(`form-follows-fx`) each need the same two-part treatment in their own
repos with their own Cloudflare Web Analytics tokens — tracked as
`documentation/landing-v3-notes/three-world-launch-phases-ToDo.md`
**#135**. The externally-assembled repos (Working with AI, Prompt
Generator, Oblique Strategies, Swatch Fields, Tracery Bots — see that
same file's `deploy.yml` multi-repo-assembly pattern, #43/#71/#128) each
need it added to their own source, per-repo — tracked as **#136**.

Verification performed: local `mkdocs build --site-dir` to a scratch
directory, grepped three built pages (`about`, `now`, `sitemap`) for
`cloudflareinsights` — present in all three. Live-site confirmation
(beacon request actually firing, data appearing in the Cloudflare Web
Analytics dashboard) not yet done from this session — see the setup
steps above for how.
