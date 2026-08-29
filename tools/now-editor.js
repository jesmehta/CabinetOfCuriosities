// Now page -- local admin server for content/now.tsv and now-data.js.
// Zero dependencies (matches build-now-content.js/build-cabinet-content.js),
// localhost-only, no auth (nothing here is meant to be reachable off the
// machine it runs on). See documentation/NOW-PAGE.md's "Local admin server" for the full
// design decisions and how this differs from the CLI-only v1.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { readEntries, writeEntries } = require("./now-tsv");
const { readNowData, writeNowData, validateSectionInput } = require("./now-data-editor");

const ROOT = path.resolve(__dirname, "..");
const NOW_TSV_PATH = path.join(ROOT, "content", "now.tsv");
const DOCS_ROOT = path.join(ROOT, "docs");
const UI_ROOT = path.join(__dirname, "now-editor-ui");
const IMAGES_ROOT = path.join(DOCS_ROOT, "assets", "now");
const PORT = Number(process.env.NOW_EDITOR_PORT) || 5757;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

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
// small helpers

function sendJson(res, status, body) {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_IMAGE_BYTES + 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// Resolves a URL path against a root directory and refuses anything that
// escapes it (blocks ../ path traversal from a crafted request path).
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
    // No caching, anywhere, for anything this server serves -- this is a
    // local dev tool where a code change silently not showing up until a
    // hard refresh is a real, confusing failure mode (happened: the
    // Pin/Unpin button was added to editor.js but stayed invisible in an
    // already-open tab because the browser had cached the previous
    // editor.js with no validator telling it to check again). Staleness
    // is a strictly worse problem here than the performance cost of
    // re-reading a few small local files on every request.
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}

function readAllEntries() {
  const raw = fs.readFileSync(NOW_TSV_PATH, "utf8");
  return readEntries(raw, "content/now.tsv");
}

function writeAllEntries(entries) {
  fs.writeFileSync(NOW_TSV_PATH, writeEntries(entries), "utf8");
}

function validateEntryInput({ date, section, value, image, notes, pinned }) {
  if (!section || !section.trim()) throw new Error("section is required");
  if (!value || !value.trim()) throw new Error("value is required");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date must be ISO YYYY-MM-DD (the browser date picker always sends this -- if you see this error, the request was hand-crafted)');
  return {
    date,
    section: section.trim(),
    value: value.trim(),
    image: (image || "").trim(),
    notes: (notes || "").trim(),
    // an unchecked checkbox sends no field at all in FormData, so absence
    // means false, same as pinned defaulting false when the TSV column is blank
    pinned: pinned === "true" || pinned === true,
  };
}

// ---------------------------------------------------------------------------
// entries API

function apiListState(res) {
  const entries = readAllEntries().map((e, index) => ({ index, ...e }));
  readNowData().then(({ nowPageConfig, sectionConfig, sectionOrder }) => {
    sendJson(res, 200, { entries, nowPageConfig, sectionConfig, sectionOrder });
  }).catch(err => sendJson(res, 500, { error: err.message }));
}

async function apiCreateEntry(req, res) {
  try {
    const body = await readJsonBody(req);
    const entry = validateEntryInput(body);
    const entries = readAllEntries();

    // Insert after the last existing row of the same section, so sections
    // stay contiguous in the file (matches how now.tsv is already grouped) --
    // or at the end if this is that section's first-ever row.
    let insertAt = entries.length;
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].section === entry.section) { insertAt = i + 1; break; }
    }
    entries.splice(insertAt, 0, entry);
    writeAllEntries(entries);
    sendJson(res, 200, { ok: true, index: insertAt });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

async function apiUpdateEntry(req, res, index) {
  try {
    const body = await readJsonBody(req);
    const entry = validateEntryInput(body);
    const entries = readAllEntries();
    if (index < 0 || index >= entries.length) throw new Error(`no entry at index ${index}`);
    entries[index] = entry;
    writeAllEntries(entries);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

function apiDeleteEntry(res, index) {
  try {
    const entries = readAllEntries();
    if (index < 0 || index >= entries.length) throw new Error(`no entry at index ${index}`);
    entries.splice(index, 1);
    writeAllEntries(entries);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

async function apiMoveEntry(req, res, index) {
  try {
    const body = await readJsonBody(req);
    const direction = body.direction;
    if (direction !== "up" && direction !== "down") throw new Error('direction must be "up" or "down"');

    const entries = readAllEntries();
    if (index < 0 || index >= entries.length) throw new Error(`no entry at index ${index}`);
    const section = entries[index].section;

    let swapWith = -1;
    if (direction === "up") {
      for (let i = index - 1; i >= 0; i--) if (entries[i].section === section) { swapWith = i; break; }
    } else {
      for (let i = index + 1; i < entries.length; i++) if (entries[i].section === section) { swapWith = i; break; }
    }
    if (swapWith === -1) {
      sendJson(res, 200, { ok: true, moved: false }); // already first/last in its section
      return;
    }

    [entries[index], entries[swapWith]] = [entries[swapWith], entries[index]];
    writeAllEntries(entries);
    sendJson(res, 200, { ok: true, moved: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

// ---------------------------------------------------------------------------
// sections API

async function apiCreateSection(req, res) {
  try {
    const body = await readJsonBody(req);
    const { key, title, mode, visible, groupSize, imageLayout } = body;
    validateSectionInput({ key, title, mode, visible: Number(visible), groupSize: Number(groupSize), imageLayout });

    const { sectionConfig, sectionOrder } = await readNowData();
    if (sectionConfig[key]) throw new Error(`section "${key}" already exists`);

    sectionConfig[key] = { title: title.trim(), mode, visible: Number(visible), groupSize: Number(groupSize), imageLayout };
    sectionOrder.push(key);
    writeNowData(sectionConfig, sectionOrder);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

async function apiUpdateSection(req, res, key) {
  try {
    const body = await readJsonBody(req);
    const { title, mode, visible, groupSize, imageLayout } = body;
    validateSectionInput({ key, title, mode, visible: Number(visible), groupSize: Number(groupSize), imageLayout });

    const { sectionConfig, sectionOrder } = await readNowData();
    if (!sectionConfig[key]) throw new Error(`section "${key}" does not exist`);

    sectionConfig[key] = { title: title.trim(), mode, visible: Number(visible), groupSize: Number(groupSize), imageLayout };
    writeNowData(sectionConfig, sectionOrder);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

async function apiDeleteSection(res, key) {
  try {
    const entries = readAllEntries();
    const count = entries.filter(e => e.section === key).length;
    if (count > 0) {
      throw new Error(`"${key}" still has ${count} entr${count === 1 ? "y" : "ies"} in now.tsv -- reassign or delete them first`);
    }

    const { sectionConfig, sectionOrder } = await readNowData();
    if (!sectionConfig[key]) throw new Error(`section "${key}" does not exist`);
    delete sectionConfig[key];
    const newOrder = sectionOrder.filter(k => k !== key);
    writeNowData(sectionConfig, newOrder);
    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

async function apiMoveSection(req, res, key) {
  try {
    const body = await readJsonBody(req);
    const direction = body.direction;
    if (direction !== "up" && direction !== "down") throw new Error('direction must be "up" or "down"');

    const { sectionConfig, sectionOrder } = await readNowData();
    const index = sectionOrder.indexOf(key);
    if (index === -1) throw new Error(`section "${key}" does not exist`);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sectionOrder.length) {
      sendJson(res, 200, { ok: true, moved: false });
      return;
    }

    [sectionOrder[index], sectionOrder[swapWith]] = [sectionOrder[swapWith], sectionOrder[index]];
    writeNowData(sectionConfig, sectionOrder);
    sendJson(res, 200, { ok: true, moved: true });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

// ---------------------------------------------------------------------------
// image upload

async function apiUploadImage(req, res) {
  try {
    const body = await readJsonBody(req);
    const { section, filename, dataBase64 } = body;
    if (!section || !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(section)) throw new Error("invalid section");
    if (!filename) throw new Error("filename is required");
    if (!dataBase64) throw new Error("no image data");

    const buffer = Buffer.from(dataBase64, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024}MB limit`);

    const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
    const base = path.basename(filename, path.extname(filename))
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image";

    const sectionDir = path.join(IMAGES_ROOT, section);
    fs.mkdirSync(sectionDir, { recursive: true });

    let safeName = `${base}${ext}`;
    let n = 1;
    while (fs.existsSync(path.join(sectionDir, safeName))) {
      safeName = `${base}-${n}${ext}`;
      n += 1;
    }

    fs.writeFileSync(path.join(sectionDir, safeName), buffer);
    const relPath = `assets/now/${section}/${safeName}`;
    sendJson(res, 200, { ok: true, path: relPath });
  } catch (err) {
    sendJson(res, 422, { error: err.message });
  }
}

// ---------------------------------------------------------------------------
// rebuild

function apiRebuild(res) {
  try {
    const output = execFileSync("node", [path.join(__dirname, "build-now-content.js")], {
      cwd: ROOT,
      encoding: "utf8",
    });
    sendJson(res, 200, { ok: true, output: output.trim() });
  } catch (err) {
    const message = (err.stderr || err.message || String(err)).toString().trim();
    sendJson(res, 422, { ok: false, error: message });
  }
}

// ---------------------------------------------------------------------------
// routing

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/") {
      res.writeHead(302, { Location: "/admin/" });
      res.end();
      return;
    }

    if (pathname.startsWith("/api/")) {
      const parts = pathname.slice(5).split("/").filter(Boolean); // e.g. ["entries", "3", "move"]

      if (parts[0] === "state" && req.method === "GET") return apiListState(res);

      if (parts[0] === "entries" && parts.length === 1 && req.method === "POST") return await apiCreateEntry(req, res);
      if (parts[0] === "entries" && parts.length === 2 && req.method === "PUT") return await apiUpdateEntry(req, res, Number(parts[1]));
      if (parts[0] === "entries" && parts.length === 2 && req.method === "DELETE") return apiDeleteEntry(res, Number(parts[1]));
      if (parts[0] === "entries" && parts.length === 3 && parts[2] === "move" && req.method === "POST") return await apiMoveEntry(req, res, Number(parts[1]));

      if (parts[0] === "sections" && parts.length === 1 && req.method === "POST") return await apiCreateSection(req, res);
      if (parts[0] === "sections" && parts.length === 2 && req.method === "PUT") return await apiUpdateSection(req, res, decodeURIComponent(parts[1]));
      if (parts[0] === "sections" && parts.length === 2 && req.method === "DELETE") return await apiDeleteSection(res, decodeURIComponent(parts[1]));
      if (parts[0] === "sections" && parts.length === 3 && parts[2] === "move" && req.method === "POST") return await apiMoveSection(req, res, decodeURIComponent(parts[1]));

      if (parts[0] === "images" && req.method === "POST") return await apiUploadImage(req, res);

      if (parts[0] === "rebuild" && req.method === "POST") return apiRebuild(res);

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

    // Everything else: serve docs/ as the static site root, same relative
    // paths as production (so /now.html previews exactly as it will deploy).
    const target = safeJoin(DOCS_ROOT, pathname);
    if (!target) { res.writeHead(400); res.end("Bad path"); return; }
    serveStaticFile(res, target);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Now editor running at http://127.0.0.1:${PORT}/admin/`);
  console.log(`(site preview at http://127.0.0.1:${PORT}/now.html -- localhost only, Ctrl+C to stop)`);
});
