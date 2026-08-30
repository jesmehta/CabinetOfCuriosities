// Promotes a built landing-v3/index.html + landing-v3/shared/ modules into
// docs/, which is what mkdocs/GitHub Pages actually serves. Run this AFTER
// build-static.mjs, once you're happy with what it produced -- deliberately
// a separate step, not folded into build-static.mjs itself, since
// build-static.mjs's headless-Chromium render is also used on its own
// (checking landing-v3/index.html mid-iteration) without necessarily
// wanting every run to also touch docs/.
//
//   node promote.mjs
//
// (from within landing-v3/, same constraint as build-static.mjs -- see that
// file's own header comment.)
//
// What it does:
//   1. Copies every file in landing-v3/shared/ to docs/assets/js/ or
//      docs/assets/css/ (by extension). These ship as real production
//      assets and import each other by bare relative filename
//      (`import ... from "./cabinet-v3-data.js"`), so a flat copy keeps
//      those imports working unchanged in both locations -- no rewriting
//      needed inside the shared files themselves.
//   2. Copies landing-v3/index.html to docs/index.html, rewriting the
//      handful of dev-build-relative asset paths to their production
//      equivalents (PATH_REWRITES below). This is the exact class of bug
//      that shipped for real once before (documentation/
//      Landing-page-notes.2.0.md's v3.7.67 entry): naively `cp`-ing
//      landing-v3/index.html carries its own-folder-relative paths
//      (`shared/cabinet-v3-style.css`, `../docs/assets/css/cabinet-tokens.css`)
//      straight into docs/, where they resolve to the wrong place.
//   3. Re-renders the promoted docs/index.html in headless Chromium and
//      fails loudly on any console/page error or fetch failure, so a
//      broken promotion is caught here, not after a deploy.
//
// Deliberately NOT run automatically by build-static.mjs or in CI:
// promotion is a "ship this" decision, not a mechanical side effect of
// every dev build.

import { chromium } from "playwright";
import http from "node:http";
import { readFile, writeFile, readdir, stat, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const landingV3Dir = __dirname;
const sharedDir = path.join(landingV3Dir, "shared");
const docsDir = path.join(repoRoot, "docs");

const srcIndexPath = path.join(landingV3Dir, "index.html");
const destIndexPath = path.join(docsDir, "index.html");

// [literal string in landing-v3/index.html, its production equivalent in
// docs/index.html]. Literal, not regex -- these are the exact three lines
// this system has always needed rewriting, see the header comment above.
// Asserted to appear exactly once each below, so a future change to
// index.template.html that alters these lines fails loudly here instead of
// silently promoting a broken (or silently-unrewritten) path.
const PATH_REWRITES = [
  ['href="../docs/assets/css/cabinet-tokens.css"', 'href="assets/css/cabinet-tokens.css"'],
  ['href="shared/cabinet-v3-style.css"', 'href="assets/css/cabinet-v3-style.css"'],
  ['src="shared/cabinet-v3-production-animate.js"', 'src="assets/js/cabinet-v3-production-animate.js"'],
  // Prose comments referencing the same file, not live paths -- kept
  // accurate in the promoted copy per the ed45d15 convention (see
  // documentation/landing-v3-notes/three-world-launch-phases-ToDo.md's #132).
  ["-- see cabinet-v3-style.css's", "-- see assets/css/cabinet-v3-style.css's"],
  ["(cabinet-v3-style.css's .sr-only)", "(assets/css/cabinet-v3-style.css's .sr-only)"]
];

const BANNER = [
  "<!--",
  "  AUTO-GENERATED FILE.",
  "  Do not edit -- edit landing-v3/index.template.html instead, then run,",
  "  from within landing-v3/:",
  "",
  "  node build-static.mjs && node promote.mjs",
  "-->",
  ""
].join("\n");

function stripExistingBanner(html) {
  // build-static.mjs's own banner ends with the first "-->\n\n" -- strip it
  // before applying ours, so re-promoting never stacks banners.
  if (!html.startsWith("<!--")) return html;
  const end = html.indexOf("-->");
  if (end === -1) return html;
  return html.slice(end + 3).replace(/^\s*\n/, "");
}

async function main() {
  let srcHtml;
  try {
    srcHtml = await readFile(srcIndexPath, "utf8");
  } catch {
    throw new Error(
      `landing-v3/index.html not found -- run "node build-static.mjs" first (from landing-v3/), then promote.mjs.`
    );
  }

  // Advisory staleness check: warn (don't block) if any shared/ file was
  // edited after the last build-static.mjs run -- a likely sign
  // build-static.mjs needs re-running before this promotion is meaningful.
  const srcIndexMtime = (await stat(srcIndexPath)).mtimeMs;
  const sharedFiles = (await readdir(sharedDir)).filter(f => f.endsWith(".js") || f.endsWith(".css"));
  for (const f of sharedFiles) {
    const mtime = (await stat(path.join(sharedDir, f))).mtimeMs;
    if (mtime > srcIndexMtime) {
      console.warn(
        `WARNING: shared/${f} was modified after landing-v3/index.html was last built -- ` +
        `you may be promoting a stale build. Consider running "node build-static.mjs" first.`
      );
    }
  }

  srcHtml = stripExistingBanner(srcHtml);

  let rewritten = srcHtml;
  for (const [from, to] of PATH_REWRITES) {
    const count = rewritten.split(from).length - 1;
    if (count !== 1) {
      throw new Error(
        `Expected exactly one occurrence of ${JSON.stringify(from)} in landing-v3/index.html, found ${count}. ` +
        `index.template.html's asset references may have changed shape -- update PATH_REWRITES in promote.mjs to match.`
      );
    }
    rewritten = rewritten.replace(from, to);
  }

  let previousDestHtml = null;
  try {
    previousDestHtml = await readFile(destIndexPath, "utf8");
  } catch {
    // no existing docs/index.html -- fine, first promotion.
  }
  const finalHtml = BANNER + rewritten;
  await writeFile(destIndexPath, finalHtml, "utf8");
  const indexChanged = previousDestHtml !== finalHtml;
  console.log(`${indexChanged ? "wrote" : "unchanged"}: docs/index.html`);

  for (const f of sharedFiles) {
    const destSubdir = f.endsWith(".css") ? "css" : "js";
    const destPath = path.join(docsDir, "assets", destSubdir, f);
    let previous = null;
    try {
      previous = await readFile(destPath, "utf8");
    } catch {
      // doesn't exist yet -- fine.
    }
    const next = await readFile(path.join(sharedDir, f), "utf8");
    await copyFile(path.join(sharedDir, f), destPath);
    console.log(`${previous === next ? "unchanged" : "wrote"}: docs/assets/${destSubdir}/${f}`);
  }

  await verify();
}

async function verify() {
  const MIME = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml"
  };
  const server = http.createServer(async (req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);
    const filePath = path.join(repoRoot, urlPath);
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
  const PORT = 8844;
  await new Promise(resolve => server.listen(PORT, resolve));

  try {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const problems = [];
      // The Cloudflare Web Analytics beacon (cloudflareinsights.com/cdn-cgi/rum)
      // is always CORS-blocked from a localhost origin -- real on the live
      // cabinetofcuriosities.in domain, not a promotion defect, so excluded
      // from every check below.
      const isKnownBeaconNoise = text => text.includes("cloudflareinsights.com");
      // The browser's own generic "Failed to load resource" console log
      // carries no URL, so it can't be attributed here -- the matching
      // requestfailed/response handlers below independently report the
      // same failure WITH a URL, so this generic duplicate is dropped
      // rather than risk hiding it under the beacon-noise filter.
      const isGenericNetworkErrorLog = text => /^Failed to load resource: net::/.test(text);
      page.on("pageerror", e => { if (!isKnownBeaconNoise(e.message)) problems.push(`page error: ${e.message}`); });
      page.on("console", msg => {
        if (msg.type() !== "error") return;
        if (isKnownBeaconNoise(msg.text()) || isGenericNetworkErrorLog(msg.text())) return;
        problems.push(`console error: ${msg.text()}`);
      });
      page.on("requestfailed", req => { if (!isKnownBeaconNoise(req.url())) problems.push(`request failed: ${req.url()} (${req.failure()?.errorText})`); });
      page.on("response", res => {
        if (res.status() >= 400 && !isKnownBeaconNoise(res.url())) problems.push(`request failed: ${res.url()} (${res.status()})`);
      });

      await page.goto(`http://localhost:${PORT}/docs/index.html`, { waitUntil: "networkidle" });
      await page.waitForSelector(".v3-coastline-outline", { timeout: 10000 });

      if (problems.length) {
        throw new Error(
          `Promoted docs/index.html failed verification:\n` + problems.map(p => `  - ${p}`).join("\n")
        );
      }
      console.log("verified: docs/index.html loads clean in headless Chromium (zero console/request errors)");
    } finally {
      await browser.close();
    }
  } finally {
    server.close();
  }
}

await main();
