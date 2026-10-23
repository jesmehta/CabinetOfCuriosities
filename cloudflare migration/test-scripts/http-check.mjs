// Cabinet HTTP checks (plan v3.1 tests 4c and 5): every manifest file served with identical bytes; routes; every
// sitemap.xml URL on the canonical host and serving 200 here; never-published paths 404.
// usage: node "cloudflare migration/test-scripts/http-check.mjs" <baseUrl> <label> <public-dir> [--expect-404-page]
//   <public-dir>: the build that was deployed (its public-manifest.sha256 sits next to it).
//   --expect-404-page: missing paths must serve that build's 404.html (Cloudflare / wrangler dev); without it only
//   the status is checked (python http.server).
// Ported from FFFX's http-check.mjs. The removed-file list comes from the committed step-1 comparison evidence.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const [base0, label, publicDir] = process.argv.slice(2);
const expect404Page = process.argv.includes("--expect-404-page");
const base = base0.replace(/\/$/, "");
const HERE = dirname(fileURLToPath(import.meta.url));
const manifest = readFileSync(join(publicDir, "..", "public-manifest.sha256"), "utf8").trim().split(/\r?\n/).map((l) => ({ sha: l.slice(0, 64), path: l.slice(66) }));
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
let failures = 0;
const fail = (m) => { failures++; console.log("FAIL  " + m); };
console.log(`== ${label} (${base})  ${new Date().toISOString()}`);

// 1. every published file, byte-identical (fetched by its exact path), a few at a time
let ok = 0;
for (let i = 0; i < manifest.length; i += 8) {
  await Promise.all(manifest.slice(i, i + 8).map(async ({ sha, path }) => {
    const r = await fetch(base + "/" + enc(path), { redirect: "follow" });
    const got = createHash("sha256").update(Buffer.from(await r.arrayBuffer())).digest("hex");
    if (r.status !== 200) fail(`${r.status} /${path}`);
    else if (got !== sha) fail(`bytes differ: /${path}`);
    else ok++;
  }));
}
console.log(`${ok}/${manifest.length} published files served with identical bytes`);

// 2. routes (clean URLs)
const routes = ["/", "/compass/about/", "/compass/now/", "/compass/sitemap/", "/teaching/", "/teaching/dragons/", "/makings/mini_loom/",
  "/teaching/working-with-ai/", "/teaching/prompt-generator/", "/teaching/oblique-strategies/",
  "/teaching/ssd-creative-coding-2025-26/", "/teaching/ssd-creative-coding-2024-25/", "/teaching/ssd-creative-coding-2023-24/",
  "/swatch-fields/", "/swatch-fields/mosaic/", "/tracery-bots/", "/tracery-bots/TrippyGourmetBot/",
  "/archived-landing-pages/", "/archived-landing-pages/v1/", "/fffx/PackingShapes/", "/fffx/VeraMolnarRetrospective/"];
for (const route of routes) {
  const r = await fetch(base + route, { redirect: "manual" });
  const ct = r.headers.get("content-type") || "";
  if (r.status !== 200 || !ct.startsWith("text/html")) fail(`route ${route}: ${r.status} ${ct}`); else console.log(`PASS  route ${route} 200`);
}

// 3. sitemap.xml: canonical host only; every URL serves 200 here
{
  const r = await fetch(base + "/sitemap.xml");
  const body = await r.text();
  const locs = [...body.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const own = locs.filter((u) => u.startsWith("https://cabinetofcuriosities.in/"));
  if (r.status !== 200 || !body.includes("<urlset") || own.length !== locs.length || new Set(locs).size !== locs.length) fail(`/sitemap.xml: ${r.status}, ${own.length}/${locs.length} on the canonical host, duplicates ${locs.length - new Set(locs).size}`);
  let good = 0;
  for (const u of own) {
    const rr = await fetch(base + u.slice("https://cabinetofcuriosities.in".length), { redirect: "manual" });
    if (rr.status === 200) good++; else fail(`sitemap URL ${u}: ${rr.status} here`);
  }
  console.log(`${good}/${locs.length} sitemap.xml URLs (all on https://cabinetofcuriosities.in/) serve 200 here`);
  if (/archived-landing-pages/.test(body)) fail("sitemap.xml lists the archive");
}

// 4. never-published paths: every file the migration removed (step-1 comparison), repository internals, tooling
const removed = readFileSync(join(HERE, "..", "evidence", "compare-step1-filtered-vs-baseline-20261023.txt"), "utf8")
  .split("\nREMOVED")[1].split("\n\n")[0].split("\n").slice(1).map((l) => l.trim()).filter(Boolean).map((p) => "/" + enc(p));
const negative = [
  ...removed,
  "/tracery-bots/_TraceryTrials/", "/teaching/ssd-creative-coding-2024-25/Arpita_Dhanawade/",
  "/content/external-repos.tsv", "/content/cabinet-entries.tsv", "/content/external-allowlists/tracery-bots.txt", "/content/archive-allowlist.txt",
  "/documentation/", "/tools/build-site.mjs", "/tools/admin-controls.js", "/tools/cabinet-editor.js", "/admin/",
  "/mkdocs.yml", "/requirements.txt", "/requirements-lock.txt", "/package.json", "/package-lock.json", "/wrangler.jsonc",
  "/README.md", "/DEPLOYMENT.md", "/WORLD-SYSTEMS.md", "/run-admin-controls.bat", "/cloudflare%20migration/plan.md",
  "/docs/index.html", "/public-manifest.sha256", "/build-info.json", "/build-unlisted.txt", "/mkdocs-build.log",
  "/.git/config", "/_external/", "/landing-v3/", "/archived-landing-pages/README.md", "/review/",
];
// Cloudflare's "404-page" handling serves the NEAREST 404.html up the path (so under /archived-landing-pages/v1/
// it is the archived v1 site's own 404 page; GitHub Pages always uses the root one).
const { existsSync } = await import("node:fs");
const nearest404 = (p) => {
  const parts = decodeURIComponent(p).split("/").filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i--) {
    const f = join(publicDir, ...parts.slice(0, i), "404.html");
    if (existsSync(f)) return readFileSync(f);
  }
  return readFileSync(join(publicDir, "404.html"));
};
let neg = 0, nested = 0;
for (const p of negative) {
  const r = await fetch(base + p, { redirect: "manual" });
  const body = Buffer.from(await r.arrayBuffer());
  if (r.status !== 404) { fail(`${p}: expected 404, got ${r.status}`); continue; }
  if (expect404Page) {
    const want = nearest404(p);
    if (!body.equals(want)) { fail(`${p}: 404 but not the nearest 404.html`); continue; }
    if (!want.equals(readFileSync(join(publicDir, "404.html")))) nested++;
  }
  neg++;
}
console.log(`${neg}/${negative.length} never-published paths return 404${expect404Page ? ` with the nearest 404.html (${nested} under a folder with its own 404.html)` : ""}`);
console.log(failures ? `== ${failures} FAILURE(S)` : "== all checks passed");
process.exit(failures ? 1 : 0);
