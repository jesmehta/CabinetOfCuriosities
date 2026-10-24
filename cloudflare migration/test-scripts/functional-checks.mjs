// functional-checks.mjs -- named app workflow checks (Codex C4 I4), run on a host; compare two hosts' JSON.
//   PLAYWRIGHT_MODULE=… node functional-checks.mjs <baseUrl> <out.json> [sampleImage]
//   node functional-checks.mjs --compare <a.json> <b.json>
// Each check records observations and a pass flag with its condition. Some behaviour can only be judged against
// the reference host (e.g. a game that plays sound only on an in-game event): those are compared, not judged.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

if (process.argv[2] === "--compare") {
  const [a, b] = process.argv.slice(3).map((f) => JSON.parse(fs.readFileSync(f, "utf8")));
  let ok = 0, bad = 0;
  for (const k of Object.keys(a.checks)) {
    const x = a.checks[k], y = b.checks[k];
    const same = y && JSON.stringify(x.compare) === JSON.stringify(y.compare);
    const pass = y && (y.pass !== false);
    if (same && pass) ok++; else { bad++; console.log(`DIFF/FAIL  ${k}\n   ${a.label}: ${JSON.stringify(x.compare)} pass=${x.pass}\n   ${b.label}: ${JSON.stringify(y && y.compare)} pass=${y && y.pass}${y && y.note ? "  (" + y.note + ")" : ""}`); }
  }
  console.log(`== ${ok} checks equal and passing on ${b.label}, ${bad} not`);
  process.exit(bad ? 1 : 0);
}

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const [base0, out, sample] = process.argv.slice(2);
const base = base0.replace(/\/$/, "");
const label = new URL(base).host;
const browser = await chromium.launch();
const checks = {};
const audioHook = () => {
  window.__audioStarts = 0;
  const wrap = (proto, name) => { if (!proto || !proto[name]) return; const f = proto[name]; proto[name] = function (...a) { window.__audioStarts++; return f.apply(this, a); }; };
  wrap(window.AudioBufferSourceNode && AudioBufferSourceNode.prototype, "start");
  wrap(window.OscillatorNode && OscillatorNode.prototype, "start");
  wrap(window.HTMLMediaElement && HTMLMediaElement.prototype, "play");
};
async function page(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  await ctx.addInitScript(audioHook);
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
  const resp = await p.goto(base + path, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(opts.wait ?? 1500);
  return { p, ctx, errors, status: resp.status() };
}
const canvasSig = (p, sel) => p.evaluate((s) => { const c = document.querySelector(s); if (!c) return null; try { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0, h = 0; for (let i = 0; i < d.length; i += 16) { if (d[i] || d[i + 1] || d[i + 2]) n++; h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; } return { nonBlank: n, hash: h }; } catch (e) { return { error: e.message }; } }, sel);
async function run(name, fn) {
  try { checks[name] = await fn(); } catch (e) { checks[name] = { pass: false, note: "error: " + e.message.slice(0, 160), compare: "error" }; }
  console.log(`${checks[name].pass === false ? "FAIL" : "ok  "}  ${name}${checks[name].note ? "  -- " + checks[name].note : ""}`);
}

// --- landing map ---
await run("landing: compass links, animation, compass W navigates", async () => {
  const { p, ctx } = await page("/", { wait: 2500 });
  const hits = await p.$$eval(".v3-compass-hit, .v3-compass-hits a", (els) => els.length);
  const a = await p.screenshot(); await p.waitForTimeout(1500); const b = await p.screenshot();
  const animating = !a.equals(b);
  const href = await p.evaluate(() => { const e = document.querySelector("#outline-entry-compass-w a, a#outline-entry-compass-w, #outline-entry-compass-w"); const a = e && (e.closest("a") || e.querySelector("a")); return a ? a.getAttribute("href") : null; });
  let landed = null;
  if (href) { const r = await p.goto(new URL(href, base + "/").href); landed = { path: new URL(p.url()).pathname, status: r.status() }; }
  await ctx.close();
  return { pass: hits > 0 && animating && landed && landed.status === 200, compare: { hits, animating, landed }, note: `compass hit areas ${hits}; W -> ${landed && landed.path}` };
});
// --- Now ---
await run("now: sections rendered", async () => {
  const { p, ctx } = await page("/compass/now/");
  const h = await p.$$eval("article h2", (e) => e.length);
  await ctx.close();
  return { pass: h > 0, compare: { sections: h } };
});
// --- Prompt Generator ---
await run("prompt-generator: New changes the prompt", async () => {
  const { p, ctx } = await page("/teaching/prompt-generator/");
  const t0 = (await p.textContent("#promptText")).trim(); await p.click("#newBtn"); await p.waitForTimeout(400); const t1 = (await p.textContent("#promptText")).trim();
  await ctx.close();
  return { pass: t1.length > 0 && t1 !== t0, compare: { produced: t1.length > 0, changed: t1 !== t0 } };
});
// --- Oblique Strategies ---
await run("oblique-strategies: Pick new changes the card", async () => {
  const { p, ctx } = await page("/teaching/oblique-strategies/");
  const t0 = (await p.textContent("#strategyText")).trim(); let t1 = t0;
  for (let i = 0; i < 3 && t1 === t0; i++) { await p.click("#btnNew"); await p.waitForTimeout(500); t1 = (await p.textContent("#strategyText")).trim(); }
  await ctx.close();
  return { pass: t1.length > 0 && t1 !== t0, compare: { produced: t1.length > 0, changed: t1 !== t0 } };
});
// --- Tracery bots ---
for (const bot of ["TrippyGourmetBot", "MadSolutionistBot"]) {
  await run(`tracery ${bot}: Generate produces text`, async () => {
    const { p, ctx } = await page(`/tracery-bots/${bot}/`);
    const n0 = await p.$$eval("#grid > *", (e) => e.length);
    await p.click("#generate"); await p.waitForTimeout(500); await p.click("#generate"); await p.waitForTimeout(500);
    const items = await p.$$eval("#grid > *", (e) => e.map((x) => x.innerText.trim()));
    await ctx.close();
    const fresh = items.length - n0;
    return { pass: fresh >= 1 && items.slice(-1)[0].length > 0, compare: { added: fresh >= 1, textNonEmpty: (items.slice(-1)[0] || "").length > 0 }, note: `${fresh} new item(s): "${(items.slice(-1)[0] || "").slice(0, 60)}"` };
  });
}
// --- Swatch Fields: polar / grid ---
await run("swatch polar-Grid: load, draw, switch to grid, hover preview", async () => {
  const { p, ctx } = await page("/swatch-fields/polar-Grid/");
  await p.click("#loadBtn"); await p.waitForTimeout(8000);
  const polar = await canvasSig(p, "#view");
  await p.check('input[name="mode"][value="grid"]'); await p.waitForTimeout(1500);
  const grid = await canvasSig(p, "#view");
  const box = await p.locator("#view").boundingBox();
  let fname = "";
  for (const [fx, fy] of [[0.5, 0.5], [0.6, 0.5], [0.5, 0.4], [0.3, 0.3], [0.7, 0.7]]) { await p.mouse.move(box.x + box.width * fx, box.y + box.height * fy); await p.waitForTimeout(400); fname = await p.evaluate(() => { const e = document.querySelector('[data-field="filename"]'); return e ? e.textContent.trim() : ""; }); if (fname) break; }
  await ctx.close();
  return { pass: polar && polar.nonBlank > 1000 && grid && grid.hash !== polar.hash && /\.jpg$/i.test(fname), compare: { drew: polar && polar.nonBlank > 1000, modeChanged: grid && grid.hash !== polar.hash, hoverShowsFile: /\.jpg$/i.test(fname) }, note: `hover: ${fname}` };
});
// --- Swatch Fields: mosaic with a sample image, PNG and CSV export ---
await run("swatch mosaic: sample image -> mosaic -> PNG and CSV downloads", async () => {
  const { p, ctx } = await page("/swatch-fields/mosaic/");
  await p.setInputFiles("#sampleFile", sample);
  await p.waitForTimeout(800);
  await p.click("#loadSwatches"); await p.waitForTimeout(8000);
  await p.click("#render"); await p.waitForTimeout(6000);
  const outSig = await canvasSig(p, "#out");
  const enabled = await p.$eval("#downloadPNG", (b) => !b.disabled);
  const dl = async (sel) => { const [d] = await Promise.all([p.waitForEvent("download", { timeout: 10000 }), p.click(sel)]); const f = await d.path(); return { name: d.suggestedFilename(), bytes: f ? fs.statSync(f).size : 0 }; };
  const png = enabled ? await dl("#downloadPNG") : null;
  const csv = enabled ? await dl("#downloadCSV") : null;
  await ctx.close();
  return { pass: outSig && outSig.nonBlank > 1000 && png && png.bytes > 1000 && csv && csv.bytes > 100, compare: { mosaic: outSig && outSig.nonBlank > 1000, png: png && png.name, csv: csv && csv.name }, note: `png ${png && png.bytes} B, csv ${csv && csv.bytes} B` };
});
// --- Working with AI ---
await run("working-with-ai: index -> lesson 01 (both courses)", async () => {
  const { p, ctx } = await page("/teaching/working-with-ai/");
  const r = [];
  for (const path of ["/teaching/working-with-ai/working-with-ai/01.html", "/teaching/working-with-ai/coding-with-ai/01.html"]) { const resp = await p.goto(base + path); await p.waitForTimeout(500); r.push({ status: resp.status(), title: (await p.title()).length > 0, text: (await p.evaluate(() => document.body.innerText.length)) > 200 }); }
  await ctx.close();
  return { pass: r.every((x) => x.status === 200 && x.title && x.text), compare: r };
});
// --- Archive ---
await run("archive: index links open", async () => {
  const { p, ctx } = await page("/archived-landing-pages/");
  const hrefs = await p.$$eval("a[href]", (a) => a.map((x) => x.getAttribute("href")).filter((h) => !/^(https?:|#|mailto:)/.test(h)));
  const res = [];
  for (const h of hrefs) { const resp = await p.goto(new URL(h, base + "/archived-landing-pages/").href); res.push(resp.status()); }
  await ctx.close();
  return { pass: res.length > 0 && res.every((s) => s === 200), compare: { links: res.length, statuses: res } };
});
// --- SSD games: input changes the canvas; audio starts (compare with the reference host) ---
const ssd = [];
for (const year of ["2025-26", "2024-25", "2023-24"]) {
  const { p, ctx } = await page(`/teaching/ssd-creative-coding-${year}/`);
  const links = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => /^(\.\/)?[A-Za-z0-9_.-]+\/?(index\.html)?$/.test(h)).map((h) => h.replace(/^\.\//, "")))]);
  await ctx.close();
  for (const l of links) ssd.push(`/teaching/ssd-creative-coding-${year}/${l.replace(/index\.html$/, "")}`.replace(/\/?$/, "/"));
}
for (const path of ssd) {
  await run(`ssd ${path.split("/").slice(-3, -1).join("/")}`, async () => {
    const { p, ctx } = await page(path, { wait: 2500 });
    const box = await p.locator("canvas").first().boundingBox().catch(() => null);
    const before = await canvasSig(p, "canvas");
    const cx = box ? box.x + box.width / 2 : 640, cy = box ? box.y + box.height / 2 : 400;
    for (let i = 0; i < 4; i++) { await p.mouse.click(cx + (i - 2) * 40, cy + (i % 2) * 30); await p.waitForTimeout(250); }
    for (const k of ["Space", "ArrowUp", "ArrowRight", "ArrowLeft", "ArrowDown", "KeyW", "KeyA", "KeyS", "KeyD", "Enter"]) { await p.keyboard.down(k); await p.waitForTimeout(120); await p.keyboard.up(k); }
    await p.waitForTimeout(1500);
    const after = await canvasSig(p, "canvas");
    const audio = await p.evaluate(() => window.__audioStarts || 0);
    await ctx.close();
    const hasCanvas = !!(before && !before.error);
    return { pass: hasCanvas, compare: { canvas: hasCanvas, drawn: !!(after && after.nonBlank > 0), audioStarted: audio > 0 }, note: `canvas changed ${!!(before && after && before.hash !== after.hash)}, audio starts ${audio}` };
  });
}
await browser.close();
fs.writeFileSync(out, JSON.stringify({ label, base, date: new Date().toISOString(), checks }, null, 2));
const failed = Object.values(checks).filter((c) => c.pass === false).length;
console.log(`== ${Object.keys(checks).length} checks, ${failed} failed (judged on this host alone)`);
