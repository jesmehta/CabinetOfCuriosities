// beacon-check.mjs -- Cloudflare Web Analytics beacon accepted on production hostnames (domain plan acceptance).
//   PLAYWRIGHT_MODULE=… node beacon-check.mjs <url>...
// Loads each page, waits, and reports the beacon script load and the /cdn-cgi/rum report request status.
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch();
let bad = 0;
for (const url of process.argv.slice(2)) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  const seen = [];
  p.on("response", (r) => { if (/cloudflareinsights\.com/.test(r.url())) seen.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`); });
  p.on("requestfailed", (r) => { if (/cloudflareinsights\.com/.test(r.url())) seen.push(`FAILED ${r.request().method()} ${new URL(r.url()).pathname} ${r.failure()?.errorText}`); });
  await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await p.goto("about:blank"); // page unload flushes the beacon report
  await new Promise((r) => setTimeout(r, 1500));
  const script = seen.some((s) => /^200 GET \/beacon\.min\.js/.test(s));
  const rum = seen.filter((s) => /\/cdn-cgi\/rum/.test(s));
  const rumOk = rum.some((s) => /^20\d /.test(s));
  if (!script || !rumOk) bad++;
  console.log(`${script && rumOk ? "PASS" : "FAIL"}  ${url}  script=${script} rum=[${rum.join("; ") || "none"}]`);
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
