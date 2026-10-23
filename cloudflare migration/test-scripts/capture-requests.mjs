// capture-requests.mjs -- allowlist cross-check by browser capture (plan v3, I3, method 2).
//
//   PLAYWRIGHT_MODULE=<path to playwright/index.mjs> node capture-requests.mjs <base-url> <out.json> <page-path>...
//
// Opens each page (a path under <base-url>), waits for load, then interacts so deferred resources load:
// clicks the canvas (or the page centre) a few times, presses Space/Enter/arrow keys/letters, moves the mouse,
// waits. Records every same-origin request with its status. Serve a FULL candidate build (nothing filtered) so
// that a request for a file the reviewed allowlist leaves out shows up as a 200 here and can be compared.

import fs from "node:fs";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");

const [base, out, ...pages] = process.argv.slice(2);
const origin = new URL(base).origin;
const browser = await chromium.launch();
const result = {};
for (const p of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const seen = new Map();
  const errors = [];
  page.on("response", (r) => { if (r.url().startsWith(origin)) seen.set(decodeURIComponent(new URL(r.url()).pathname), r.status()); });
  page.on("requestfailed", (r) => { if (r.url().startsWith(origin)) seen.set(decodeURIComponent(new URL(r.url()).pathname), "failed"); });
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
  try {
    await page.goto(base.replace(/\/$/, "") + p, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1500);
    const box = await page.locator("canvas").first().boundingBox().catch(() => null);
    const cx = box ? box.x + box.width / 2 : 640, cy = box ? box.y + box.height / 2 : 400;
    for (const [dx, dy] of [[0, 0], [-80, -40], [60, 50]]) { await page.mouse.click(cx + dx, cy + dy).catch(() => {}); await page.waitForTimeout(300); }
    for (const k of ["Space", "Enter", "ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft", "KeyW", "KeyA", "KeyS", "KeyD", "KeyR", "KeyP"]) { await page.keyboard.press(k).catch(() => {}); await page.waitForTimeout(120); }
    await page.mouse.move(cx + 100, cy - 100);
    await page.waitForTimeout(2500);
  } catch (e) { errors.push("NAV: " + String(e.message).slice(0, 200)); }
  result[p] = { requests: Object.fromEntries([...seen].sort()), errors };
  await ctx.close();
  process.stdout.write(".");
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`\n${pages.length} page(s) -> ${out}`);
