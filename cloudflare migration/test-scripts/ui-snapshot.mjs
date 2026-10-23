// Cabinet behaviour snapshot for comparing two hosts (live GitHub Pages vs a local/Cloudflare build).
// Math.random is replaced by a fixed-seed generator before any page script runs, so randomised layouts match.
// Per route and viewport: status, console/page errors, failed requests, links (self-domain links as paths, so
// the D7 root-relative nav compares equal), visible-text hash, element counts and a layout hash of links, images,
// canvases and SVG groups. Landing page: screenshot. Gallery page: opening the lightbox. Ported from FFFX.
// usage: PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node ui-snapshot.mjs <baseUrl> <label> <out.json> [screenshotDir]
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const [base0, label, outFile, shotDir] = process.argv.slice(2);
const base = base0.replace(/\/$/, "");
const origin = new URL(base).origin;
const SELF = /^https?:\/\/(www\.)?cabinetofcuriosities\.in/;
const routes = ["/", "/compass/now/", "/compass/about/", "/teaching/", "/teaching/dragons/", "/makings/mini_loom/",
  "/teaching/working-with-ai/", "/teaching/prompt-generator/", "/teaching/oblique-strategies/",
  "/teaching/ssd-creative-coding-2025-26/", "/teaching/ssd-creative-coding-2024-25/", "/teaching/ssd-creative-coding-2023-24/",
  "/swatch-fields/", "/swatch-fields/mosaic/", "/swatch-fields/polar-Grid/", "/tracery-bots/", "/tracery-bots/TrippyGourmetBot/",
  "/archived-landing-pages/", "/archived-landing-pages/v1/"];
const viewports = { desktop: { width: 1400, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true } };
const fixedRandom = () => {
  let s = 0x2f6b9c1d;
  Math.random = () => { s += 0x6d2b79f5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const toPath = (h) => { try { if (SELF.test(h)) return h.replace(SELF, ""); const u = new URL(h); return u.origin === origin ? u.pathname + u.search + u.hash : h; } catch { return h; } };

const browser = await chromium.launch();
const result = { label, base, date: new Date().toISOString(), views: {} };
if (shotDir) mkdirSync(shotDir, { recursive: true });
for (const [vname, vp] of Object.entries(viewports)) {
  const { width, height, ...rest } = vp;
  const context = await browser.newContext({ viewport: { width, height }, ...rest });
  await context.addInitScript(fixedRandom);
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [], failedLocal = [], failedExternal = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
    page.on("requestfailed", (r) => (new URL(r.url()).origin === origin ? failedLocal : failedExternal).push(r.url().replace(origin, "")));
    page.on("response", (r) => { if (r.status() >= 400) (new URL(r.url()).origin === origin ? failedLocal : failedExternal).push(`${r.status()} ${r.url().replace(origin, "")}`); });
    const resp = await page.goto(base + route, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => ({ status: () => "NAV " + e.message.slice(0, 60) }));
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const box = (e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y + window.scrollY)},${Math.round(r.width)}x${Math.round(r.height)}`; };
      return {
        title: document.title,
        text: document.body ? document.body.innerText : "",
        links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
        counts: { a: document.querySelectorAll("a").length, img: document.querySelectorAll("img").length, svg: document.querySelectorAll("svg").length, svgShapes: document.querySelectorAll("svg path, svg circle, svg rect, svg polygon").length, canvas: document.querySelectorAll("canvas").length, button: document.querySelectorAll("button").length },
        layout: [...document.querySelectorAll("a, img, canvas, svg > g, button")].map(box).join("|"),
      };
    }).catch((e) => ({ title: "", text: "", links: [], counts: {}, layout: "", evalError: e.message }));
    const entry = { status: typeof resp.status === "function" ? resp.status() : resp.status, title: info.title, textSha: sha(info.text), textLength: info.text.length, links: info.links.map(toPath), counts: info.counts, layoutSha: sha(info.layout), errors, failedLocal, failedExternal };
    if (route === "/" && shotDir) await page.screenshot({ path: join(shotDir, `${label.replace(/\W+/g, "-")}-landing-${vname}.png`) });
    if (route === "/makings/mini_loom/") {
      const opened = await page.evaluate(async () => {
        const a = document.querySelector("a.glightbox");
        if (!a) return "no lightbox link";
        a.click();
        await new Promise((r) => setTimeout(r, 1200));
        const img = document.querySelector(".glightbox-container .gslide-image img");
        return img ? `open: ${img.getAttribute("src").split("/").pop()} ${img.naturalWidth}px` : "did not open";
      });
      entry.lightbox = opened;
    }
    result.views[`${vname} ${route}`] = entry;
    await page.close();
  }
  const p = await context.newPage();
  const r404 = await p.goto(base + "/no-such-page-xyz/", { waitUntil: "load" }).catch(() => null);
  result.views[`${vname} 404`] = { status: r404?.status(), title: await p.title().catch(() => "") };
  await p.close();
  await context.close();
}
await browser.close();
writeFileSync(outFile, JSON.stringify(result, null, 2));
for (const [k, v] of Object.entries(result.views)) {
  console.log(`${String(v.status).padEnd(4)} ${k.padEnd(52)} ${v.textSha ? `text ${v.textSha} links ${String(v.links.length).padStart(3)} layout ${v.layoutSha} err ${v.errors.length} failLocal ${v.failedLocal.length}${v.lightbox ? " lightbox " + v.lightbox : ""}` : `title "${v.title}"`}`);
}
