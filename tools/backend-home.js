// Cabinet -- local "backend home" dashboard: one page linking together every
// local-only admin tool this repo has (Cabinet/Now TSV editors, the v3
// islands-tool live preview), plus buttons for every build/publish script
// that doesn't already have one of its own (build-static.mjs, promote.mjs,
// generate_sitemap.py, an mkdocs --strict sanity check), plus links out to
// the documentation and a running list of repo-wide gotchas. Zero
// dependencies (matches cabinet-editor.js/now-editor.js), localhost-only, no
// auth -- nothing here is meant to be reachable off the machine it runs on.
//
// Deliberately does NOT duplicate cabinet-editor.js's/now-editor.js's own
// TSV read/write/validate APIs -- this page links out to those servers
// (starting them if they're not already running) rather than re-implementing
// their functionality here, so there is exactly one place each of those
// behaviors lives.

const http = require("http");
const fs = require("fs");
const path = require("path");
const net = require("net");
const os = require("os");
const { execFileSync, spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const LANDING_V3_DIR = path.join(ROOT, "landing-v3");
const UI_ROOT = path.join(__dirname, "backend-home-ui");
const PORT = Number(process.env.CABINET_HOME_PORT) || 5959;

const NOW_EDITOR_PORT = Number(process.env.NOW_EDITOR_PORT) || 5757;
const CABINET_EDITOR_PORT = Number(process.env.CABINET_EDITOR_PORT) || 5858;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

// ---------------------------------------------------------------------------
// small helpers (same shape as cabinet-editor.js/now-editor.js)

function sendJson(res, status, body) {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const resolved = path.resolve(root, "." + decoded);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}

// Quick TCP probe -- true if something is already listening on
// 127.0.0.1:port. Used for /api/status rather than trying to track
// spawned-child state, since a server started outside this dashboard
// (double-clicked .bat, run from a terminal) should show as "running" too.
function isPortOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: "127.0.0.1", port, timeout: 500 });
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.on("error", () => resolve(false));
  });
}

// Runs a script and returns its combined output, or throws with
// stdout+stderr attached -- same execFileSync-and-report pattern as
// cabinet-editor.js's apiRebuild.
function runScript(command, args, cwd) {
  try {
    const output = execFileSync(command, args, { cwd, encoding: "utf8" });
    return output.trim();
  } catch (err) {
    const stdout = (err.stdout || "").toString().trim();
    const stderr = (err.stderr || "").toString().trim();
    const message = [stdout, stderr].filter(Boolean).join("\n") || err.message || String(err);
    const wrapped = new Error(message);
    throw wrapped;
  }
}

function apiRun(res, label, fn) {
  try {
    const output = fn();
    sendJson(res, 200, { ok: true, label, output: output || "(no output)" });
  } catch (err) {
    sendJson(res, 422, { ok: false, label, error: err.message });
  }
}

// ---------------------------------------------------------------------------
// status + server-start

async function apiStatus(res) {
  const [nowEditor, cabinetEditor] = await Promise.all([
    isPortOpen(NOW_EDITOR_PORT),
    isPortOpen(CABINET_EDITOR_PORT),
  ]);
  sendJson(res, 200, {
    nowEditor: { running: nowEditor, port: NOW_EDITOR_PORT, url: `http://127.0.0.1:${NOW_EDITOR_PORT}/admin/` },
    cabinetEditor: { running: cabinetEditor, port: CABINET_EDITOR_PORT, url: `http://127.0.0.1:${CABINET_EDITOR_PORT}/admin/` },
  });
}

function spawnServer(scriptPath) {
  const child = spawn(process.execPath, [scriptPath], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
}

async function apiStartServer(res, which) {
  const already = which === "now-editor"
    ? await isPortOpen(NOW_EDITOR_PORT)
    : await isPortOpen(CABINET_EDITOR_PORT);
  if (already) { sendJson(res, 200, { ok: true, alreadyRunning: true }); return; }
  const scriptPath = which === "now-editor"
    ? path.join(__dirname, "now-editor.js")
    : path.join(__dirname, "cabinet-editor.js");
  spawnServer(scriptPath);
  sendJson(res, 200, { ok: true, alreadyRunning: false });
}

// ---------------------------------------------------------------------------
// routing

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/") { res.writeHead(302, { Location: "/admin/" }); res.end(); return; }

    if (pathname.startsWith("/api/")) {
      const parts = pathname.slice(5).split("/").filter(Boolean);

      if (parts[0] === "status" && req.method === "GET") return await apiStatus(res);

      if (parts[0] === "start" && parts.length === 2 && req.method === "POST") {
        if (parts[1] !== "now-editor" && parts[1] !== "cabinet-editor") return sendJson(res, 404, { error: "unknown server" });
        return await apiStartServer(res, parts[1]);
      }

      if (parts[0] === "run" && parts.length === 2 && req.method === "POST") {
        const which = parts[1];
        if (which === "cabinet-content") {
          return apiRun(res, which, () => runScript(process.execPath, [path.join(__dirname, "build-cabinet-content.js")], ROOT));
        }
        if (which === "now-content") {
          return apiRun(res, which, () => runScript(process.execPath, [path.join(__dirname, "build-now-content.js")], ROOT));
        }
        if (which === "sitemap") {
          return apiRun(res, which, () => runScript("python", [path.join(__dirname, "generate_sitemap.py")], ROOT));
        }
        if (which === "build-static") {
          return apiRun(res, which, () => runScript(process.execPath, ["build-static.mjs"], LANDING_V3_DIR));
        }
        if (which === "promote") {
          return apiRun(res, which, () => runScript(process.execPath, ["promote.mjs"], LANDING_V3_DIR));
        }
        if (which === "build-and-promote") {
          return apiRun(res, which, () => {
            const buildOutput = runScript(process.execPath, ["build-static.mjs"], LANDING_V3_DIR);
            const promoteOutput = runScript(process.execPath, ["promote.mjs"], LANDING_V3_DIR);
            return `-- build-static.mjs --\n${buildOutput}\n\n-- promote.mjs --\n${promoteOutput}`;
          });
        }
        if (which === "mkdocs-check") {
          // Site dir outside the repo (OS temp) so this sanity check never
          // leaves stray build output for git to notice.
          const tmpSiteDir = path.join(os.tmpdir(), `cabinet-mkdocs-check-${Date.now()}`);
          return apiRun(res, which, () => {
            try {
              return runScript("mkdocs", ["build", "--strict", "--site-dir", tmpSiteDir], ROOT);
            } finally {
              fs.rmSync(tmpSiteDir, { recursive: true, force: true });
            }
          });
        }
        return sendJson(res, 404, { error: `unknown script "${which}"` });
      }

      sendJson(res, 404, { error: `no API route for ${req.method} ${pathname}` });
      return;
    }

    if (pathname.startsWith("/admin/")) {
      const rest = pathname.slice(6) || "/";
      const target = rest === "/" ? path.join(UI_ROOT, "index.html") : safeJoin(UI_ROOT, rest);
      if (!target) { res.writeHead(400); res.end("Bad path"); return; }
      serveStaticFile(res, target);
      return;
    }

    // Everything else falls through to the repo root -- so links to
    // landing-v3/dev-tool/islands-tool.html (and whatever it in turn
    // references relative to the repo root: docs/assets/css/cabinet-tokens.css,
    // landing-v3/shared/, landing-v3/layout-engine/) resolve correctly.
    const target = safeJoin(ROOT, pathname);
    if (!target) { res.writeHead(400); res.end("Bad path"); return; }
    serveStaticFile(res, target);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Cabinet backend home running at http://127.0.0.1:${PORT}/admin/`);
  console.log(`(localhost only, Ctrl+C to stop)`);
});
