// Build script for the production v3 page: renders build-render.html in a
// real headless browser (so cabinet-v3-layout.js's actual client-side
// render() runs exactly as islands-tool.html/archive execute it -- no
// second, hand-written serializer to keep in sync by hand), captures the
// resulting #v3-stage SVG markup, and writes it into index.html by
// injecting it into index.template.html's placeholder.
//
// Run whenever content/config changes and you want the static page to
// reflect it:
//
//   node build-static.mjs
//
// (from within landing-v3/, so playwright resolves from this folder's own
// node_modules -- same constraint as every other script in this file, see
// Landing-page-notes.2.0.md's "Verification" section.)
//
// Why a real browser instead of a hand-written string-based SVG
// serializer: a second renderer would need every future change to
// cabinet-v3-layout.js's actual DOM/SVG construction ported to it by
// hand, or the static production page would silently drift from what
// islands-tool.html/archive show -- across this file's whole history so
// far, that construction logic has changed in nearly every version. A
// headless-browser snapshot has exactly one rendering implementation;
// the static build just captures whatever it currently produces, so it
// can never drift, with no ongoing hand-sync required -- true even
// without anyone (human or AI) available to manually port a change.

import { chromium } from "playwright";
import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const landingV3Dir = __dirname;

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml"
};

function startServer(root, port) {
  return new Promise(resolve => {
    const server = http.createServer(async (req, res) => {
      const urlPath = decodeURIComponent(req.url.split("?")[0]);
      const filePath = path.join(root, urlPath);
      try {
        const data = await readFile(filePath);
        const ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("not found: " + urlPath);
      }
    });
    server.listen(port, () => resolve(server));
  });
}

const PORT = 8843;
const server = await startServer(repoRoot, PORT);

let svgMarkup;
try {
  const browser = await chromium.launch();
  try {
    // v3.6.10 -- explicit viewport, not Playwright's own implicit default:
    // the canvas's own shape is now solved from the real available
    // viewport at render() time (resolveCanvasDimensions(), see
    // cabinet-v3-layout.js), so the STATIC build's baked shape depends on
    // whatever viewport this capture runs at -- pinning it to a common
    // desktop size makes that a deliberate choice, not an accident of
    // whatever Playwright happens to default to.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on("pageerror", e => consoleErrors.push(e.message));
    page.on("console", msg => { if (msg.type() === "error") consoleErrors.push(msg.text()); });

    await page.goto(`http://localhost:${PORT}/landing-v3/build-render.html`, { waitUntil: "networkidle" });
    // render()'s last act is drawing the shared islands path -- its
    // presence means the whole pipeline (treemap, packing, tracing) has
    // already completed, not just that the page loaded.
    await page.waitForSelector(".v3-coastline-outline", { timeout: 10000 });

    if (consoleErrors.length) {
      throw new Error("build-render.html produced console errors:\n" + consoleErrors.join("\n"));
    }

    svgMarkup = await page.$eval("#v3-stage", el => el.outerHTML);
  } finally {
    await browser.close();
  }
} finally {
  server.close();
}

const templatePath = path.join(landingV3Dir, "index.template.html");
const outputPath = path.join(landingV3Dir, "index.html");

const template = await readFile(templatePath, "utf8");
const placeholder = "<!-- V3_ISLANDS_SVG -->";
if (!template.includes(placeholder)) {
  throw new Error(`index.template.html is missing the ${placeholder} placeholder`);
}

const banner = [
  "<!--",
  "  AUTO-GENERATED FILE.",
  "  Do not edit -- edit index.template.html instead, then run:",
  "",
  "  node build-static.mjs",
  "-->",
  ""
].join("\n");

const output = banner + template.replace(placeholder, svgMarkup);
await writeFile(outputPath, output, "utf8");

console.log(`wrote index.html (${svgMarkup.length} chars of SVG markup)`);
