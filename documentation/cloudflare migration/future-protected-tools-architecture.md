# Future Protected Tools — Local-First Algorithm + Cloudflare Worker Architecture

**Status:** Design guidance for new tools and separately approved conversions; **not** part of the present website migration. **Examples:** Origami/Kirigami generators and selected original tools. Publishing Origami live is optional; a public write-up and outputs may suffice.

**Selected targets (20 October 2026):** FFFX's Dance of Planets and Island Generator, Dot Mandala, and Origami Tools. Selection requires per-tool design/audit before implementation; it does not make a specific API architecture approved. Dot Mandala's completed hosting migration leaves its current browser algorithm public. Keep FFFX project publication gates until the protected boundary and artifact exclusions are verified. These projects may remain inside their existing private repository.

**Excluded for now:** Interactive Installations' Live Video Filter and Gesture Kaleidoscope remain browser-based and local-first, supporting laptop/projected use and public screen-toy variants. Do not move camera feeds server-side for this migration. Revisit latency/protection only when needed. Repository visibility is a separate decision. SwatchFields, Warli imagery and DataSelfies data remain unresolved; see the [transition register](transition-register.md).

## Intent

Protect algorithm **source** from visitors to a public tool, while retaining full local/offline use, repeatable headless batch generation and portability away from Cloudflare. Do not introduce server-side processing for ordinary open-source teaching sketches or tools with no meaningful algorithm-protection requirement.

## Architecture

```text
Private GitHub repository / local VS Code project
  src/core/           Pure JS algorithm and geometry (single implementation)
  src/worker/         Thin HTTP adapter; validates input, calls core, returns output
  public/             HTML/CSS/browser JS UI; no core algorithm bundled here
  scripts/            Local Node CLI and batch generation
  tests/              Core tests and API contract tests
  wrangler.jsonc      Cloudflare Worker + static asset deployment configuration
  package.json        Local dev, test, batch, deploy scripts

Local: UI → local Worker → core        (offline when fully installed)
Local: CLI/batch → core               (offline; no server required)
Public: UI → deployed Worker → core   (algorithm source stays server-side)
```

**One repository, one language, one algorithm implementation.** No duplicated local and hosted geometry engines. Cloudflare-specific imports/configuration belong in the adapter/deployment layer, not in core modules.

## Boundaries and security

- Frontend handles controls, layout, zoom/pan, non-sensitive styling, visualisation and downloads where appropriate.
- Worker handles sensitive geometry/generation rules, parameter validation and expensive discrete computations. Return only data the browser needs; outputs and request/response formats are visible to users.
- Worker source must not appear in `public/`, client bundles, source maps served publicly, or deployment artifacts as static files. Verify built output.
- A private repo alone does **not** conceal browser-delivered JS. Workers conceal server-executed implementation, **not** ideas, observable behaviour or generated outputs.
- A public Worker endpoint can be called independently of your UI; evaluate rate limits, abuse protection, compute quotas and request validation. Authentication is a separate optional policy.
- Network round trips may affect sliders. Debounce requests, cancel/discard stale responses and benchmark actual geometry tasks before committing.

## Local and offline operation

- Use a locally installed Wrangler and dependencies, e.g. `npm install` once while online, then `npm run dev` / `npx wrangler dev` for local execution.
- Use relative API paths (`/api/generate`) in the browser so local and deployed UIs share code.
- **Test with network disabled.** Local Wrangler often works offline once installed, but remote bindings, CDNs, online auth or package resolution can break that assumption.
- Core algorithms and CLI should work with Node alone, without Wrangler or a running web server.
- Keep an offline-ready dependency record and instructions for rebuilding the local environment.

## Batch generation as a first-class interface

The Origami workflow of generating **175 variations** by varying several parameters should be supported directly, without a browser automation loop or ongoing AI involvement. Example interface (illustrative, not an existing command):

```bash
npm run batch -- --config experiments/variations.json --out output/experiment-01
```

A batch tool should enumerate parameter combinations, use the exact core functions, write deterministic SVG or other outputs, and record the parameters, algorithm version and output paths in JSON/CSV. Include reproducible seeds when randomness is involved. It should be possible to rerun the same experiment locally without internet or AI.

## Example development scripts (illustrative)

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "test": "node --test",
    "batch": "node scripts/batch.js",
    "deploy": "wrangler deploy"
  }
}
```

Actual configuration and commands must be validated against the repository and installed Cloudflare tooling; do not assume these examples work unchanged for every project.

## Claude Code prompt — new protected tool

> Design a local-first JavaScript generator with one platform-neutral algorithm module, a browser UI, a thin Cloudflare Worker API, and a Node CLI/batch interface using the same algorithm. Keep all sensitive code out of browser assets. Use Workers with Static Assets if it reduces deployment complexity; do not assume it is mandatory. Ensure local UI and CLI work offline after dependencies are installed. Include tests, deterministic batch generation, an output manifest, manual runbooks and a replacement-host strategy. Do not deploy or expose an endpoint without approval. Document what remains observable to public users.

## Codex review checklist

- [ ] No algorithm duplicated between browser, Worker and CLI.
- [ ] Core imports no browser DOM or Cloudflare runtime APIs.
- [ ] No sensitive modules in static bundles or public source maps.
- [ ] Local CLI runs without network or Wrangler; batch output reproducible.
- [ ] Local UI works without internet after setup; any exceptions documented.
- [ ] Worker API validates input and has sensible compute/abuse controls.
- [ ] A different server runtime could reuse core without rewriting it.
- [ ] Manual run/deploy/rollback procedures work without AI assistance.

## Decision rule

Choose **static browser-only** for ordinary sketches and open tools. Choose **Worker-backed computation** only when hiding implementation is valuable enough to justify network dependency, refactoring and API maintenance. Hosting the UI on Workers with Static Assets is a separate decision from moving algorithms server-side.
