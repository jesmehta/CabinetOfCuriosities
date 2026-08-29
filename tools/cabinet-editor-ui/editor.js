/* Cabinet editor -- browser UI. Talks to tools/cabinet-editor.js's /api/*
   routes; never touches the TSV files itself. Every mutating action
   refetches /api/state afterward rather than patching local state, so the
   UI can never drift from what's actually on disk (or from validation
   problems a *different* row's edit just introduced -- e.g. renaming a
   section id invalidates every entry that referenced the old id). */

const STATUS_OPTIONS = ["true", "false", "wip"];
// N/E/S/W are the only values that mean anything today -- they're read by
// cabinet-v3-layout.js's compass-rose label placement (compass-n/e/s/w
// entries only). The old lowercase coast-placement directions were cleared
// from the real data when `placement`/`cardOrder` were removed (see
// CABINET-EDITOR.md's Changelog) -- not offered here, though a leftover
// custom value would still show via the "(custom)" fallback.
const ANCHOR_OPTIONS = ["N", "E", "S", "W", ""];
const SECTION_LOCATION_OPTIONS = ["subdomain", "mkdocs", "external", "compass", ""];
const ENTRY_LOCATION_OPTIONS = ["subdomain", "mkdocs", "external", "assembly", ""];

const NUMERIC_FIELDS = new Set(["order", "weight", "extraCount", "cx", "cy", "rx", "ry"]);
const WIDE_FIELDS = new Set(["subtitle", "notes", "tags", "href", "relatedLinks"]);

let state = { sections: [], entries: [], sectionProblems: [], entryProblems: [], columns: { sections: [], entries: [] }, reserved: { sections: [], entries: [] } };
let searchSections = "";
let searchEntries = "";
const expandedSections = new Set();
const expandedEntries = new Set();

/* ---------- server calls ---------- */

async function apiCall(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `${method} ${url} failed (${res.status})`);
  return json;
}

async function loadState() {
  state = await apiCall("GET", "/api/state");
  renderSections();
  renderEntries();
}

function showStatus(message, kind) {
  const el = document.getElementById("status-banner");
  el.textContent = message;
  el.className = `status-banner ${kind}`;
  el.hidden = false;
  if (kind === "ok") setTimeout(() => { if (el.textContent === message) el.hidden = true; }, 4000);
}

async function runMutation(fn) {
  try {
    await fn();
    await loadState();
  } catch (err) {
    showStatus(err.message, "error");
    await loadState();
  }
}

/* ---------- helpers ---------- */

function esc(v) {
  return (v === undefined || v === null ? "" : String(v)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function coreCols(kind) {
  return state.columns[kind].filter(c => !state.reserved[kind].includes(c));
}

function selectHTML(value, options, field, disabled) {
  const opts = options.map(o => {
    const label = o === "" ? "—" : o;
    return `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");
  const extra = (!options.includes(value) && value) ? `<option value="${esc(value)}" selected>${esc(value)} (custom)</option>` : "";
  return `<select data-field="${field}" ${disabled ? "disabled" : ""}>${extra}${opts}</select>`;
}

function inputHTML(value, field, { numeric, wide, disabled, className } = {}) {
  const cls = className ? ` class="${className}"` : "";
  if (wide) return `<textarea data-field="${field}" rows="1"${disabled ? " disabled" : ""}${cls}>${esc(value)}</textarea>`;
  return `<input type="text" data-field="${field}" value="${esc(value)}"${numeric ? ' style="text-align:right;"' : ""}${disabled ? " disabled" : ""}${cls}>`;
}

function fieldControl(value, col, selectMap, disabled) {
  if (selectMap[col]) return selectHTML(value, selectMap[col], col, disabled);
  return inputHTML(value, col, { numeric: NUMERIC_FIELDS.has(col), wide: WIDE_FIELDS.has(col), disabled });
}

function problemsByIndex(problems) {
  const map = new Map();
  problems.forEach(p => { if (!map.has(p.index)) map.set(p.index, []); map.get(p.index).push(p); });
  return map;
}

/* ---------- sections ---------- */

const SECTION_SELECT_MAP = { status: STATUS_OPTIONS, location: SECTION_LOCATION_OPTIONS };

function renderSections() {
  const container = document.getElementById("table-sections");
  const q = searchSections.trim().toLowerCase();
  const rows = state.sections;
  const visible = rows.filter(({ row }) => !q || [row.id, row.title, row.tags, row.kind].join(" ").toLowerCase().includes(q));
  document.getElementById("count-sections").textContent = `${rows.length} section${rows.length !== 1 ? "s" : ""}`;

  if (!rows.length) { container.innerHTML = `<div class="empty">No sections yet. Add one to get started.</div>`; return; }

  const problems = problemsByIndex(state.sectionProblems);
  const cols = coreCols("sections");
  const reserved = state.reserved.sections;

  let html = `<table><colgroup><col class="narrow">`;
  cols.forEach(() => html += `<col>`);
  html += `</colgroup><thead><tr><th></th>`;
  cols.forEach(c => html += `<th>${c}</th>`);
  html += `</tr></thead><tbody>`;

  visible.forEach(({ index, row }) => {
    const rowProblems = problems.get(index) || [];
    const badFields = new Set(rowProblems.map(p => p.field));
    const expanded = expandedSections.has(index);
    const title = rowProblems.length ? rowProblems.map(p => p.message).join("; ") : "";

    html += `<tr class="core-row ${rowProblems.length ? "invalid" : ""}" data-idx="${index}" ${title ? `title="${esc(title)}"` : ""}>`;
    html += `<td class="rowctl">
      <button class="row-toggle" data-act="toggle">${expanded ? "▾" : "▸"}</button>
      <button class="icon" data-act="up" title="Move up">▲</button>
      <button class="icon" data-act="down" title="Move down">▼</button>
      <button class="icon" data-act="del" title="Delete row">✕</button>
    </td>`;
    cols.forEach(col => {
      const control = fieldControl(row[col], col, SECTION_SELECT_MAP, false);
      html += `<td>${badFields.has(col) ? control.replace(/(<(?:input|select))/, `$1 class="bad"`) : control}</td>`;
    });
    html += `</tr>`;

    if (expanded) {
      html += `<tr class="reserved-row" data-idx="${index}"><td></td><td colspan="${cols.length}"><div class="reserved-panel">`;
      html += `<div class="reserved-note">Layout geometry — computed live by squarify() from weight, not read from here by the v3 renderer. Read-only. (mapForm/islandId/cx/cy/rx/ry)</div>`;
      reserved.forEach(col => {
        html += `<div class="reserved-field"><label>${col}</label>${inputHTML(row[col], col, { disabled: true })}</div>`;
      });
      html += `</div></td></tr>`;
    }
  });
  html += `</tbody></table>`;
  container.innerHTML = html;

  container.querySelectorAll("tr.core-row").forEach(tr => {
    const index = Number(tr.dataset.idx);
    tr.querySelectorAll("[data-field]").forEach(el => {
      el.addEventListener("change", () => runMutation(() => apiCall("PUT", `/api/sections/${index}`, { [el.dataset.field]: el.value })));
    });
    tr.querySelector('[data-act="toggle"]').addEventListener("click", () => {
      if (expandedSections.has(index)) expandedSections.delete(index); else expandedSections.add(index);
      renderSections();
    });
    tr.querySelector('[data-act="up"]').addEventListener("click", () => runMutation(() => apiCall("POST", `/api/sections/${index}/move`, { direction: "up" })));
    tr.querySelector('[data-act="down"]').addEventListener("click", () => runMutation(() => apiCall("POST", `/api/sections/${index}/move`, { direction: "down" })));
    tr.querySelector('[data-act="del"]').addEventListener("click", async () => {
      const ok = await confirmDialog("Delete section?", `Delete section "${esc(state.sections[index].row.id || "(untitled)")}"? This can't be undone. Entries still referencing it must be reassigned or deleted first.`);
      if (ok) runMutation(() => apiCall("DELETE", `/api/sections/${index}`));
    });
  });
}

document.getElementById("add-section").addEventListener("click", () => {
  runMutation(() => apiCall("POST", "/api/sections", { status: "wip", weight: "2" }));
  searchSections = ""; document.getElementById("search-sections").value = "";
});

/* ---------- entries ---------- */

const ENTRY_SELECT_MAP = { status: STATUS_OPTIONS, anchor: ANCHOR_OPTIONS, location: ENTRY_LOCATION_OPTIONS };

function renderEntries() {
  const container = document.getElementById("table-entries");
  const q = searchEntries.trim().toLowerCase();
  const rows = state.entries;
  const sectionIds = state.sections.map(s => s.row.id);
  const visible = rows.filter(({ row }) => !q || [row.id, row.title, row.section, row.tags, row.kind].join(" ").toLowerCase().includes(q));
  document.getElementById("count-entries").textContent = `${rows.length} entr${rows.length !== 1 ? "ies" : "y"}`;

  if (!rows.length) { container.innerHTML = `<div class="empty">No entries yet. Add one to get started.</div>`; return; }

  const problems = problemsByIndex(state.entryProblems);
  const cols = coreCols("entries");
  const reserved = state.reserved.entries;

  let html = `<table><colgroup><col class="narrow">`;
  cols.forEach(() => html += `<col>`);
  html += `</colgroup><thead><tr><th></th>`;
  cols.forEach(c => html += `<th>${c}</th>`);
  html += `</tr></thead><tbody>`;

  visible.forEach(({ index, row }) => {
    const rowProblems = problems.get(index) || [];
    const badFields = new Set(rowProblems.map(p => p.field));
    const expanded = expandedEntries.has(index);
    const title = rowProblems.length ? rowProblems.map(p => p.message).join("; ") : "";

    html += `<tr class="core-row ${rowProblems.length ? "invalid" : ""}" data-idx="${index}" ${title ? `title="${esc(title)}"` : ""}>`;
    html += `<td class="rowctl">
      <button class="row-toggle" data-act="toggle">${expanded ? "▾" : "▸"}</button>
      <button class="icon" data-act="up" title="Move up within section">▲</button>
      <button class="icon" data-act="down" title="Move down within section">▼</button>
      <button class="icon" data-act="del" title="Delete row">✕</button>
    </td>`;
    cols.forEach(col => {
      if (col === "section") {
        const extra = (!sectionIds.includes(row.section) && row.section) ? `<option value="${esc(row.section)}" selected>${esc(row.section)} ⚠ missing</option>` : "";
        const list = sectionIds.map(id => `<option value="${esc(id)}" ${id === row.section ? "selected" : ""}>${esc(id)}</option>`).join("");
        html += `<td><select data-field="section" class="${badFields.has("section") ? "bad" : ""}">${extra}${list}</select></td>`;
        return;
      }
      const control = fieldControl(row[col], col, ENTRY_SELECT_MAP, false);
      html += `<td>${badFields.has(col) ? control.replace(/(<(?:input|select))/, `$1 class="bad"`) : control}</td>`;
    });
    html += `</tr>`;

    if (expanded) {
      html += `<tr class="reserved-row" data-idx="${index}"><td></td><td colspan="${cols.length}"><div class="reserved-panel">`;
      html += `<div class="reserved-note">Not read by the live v3 renderer — kept as a just-in-case / reminder (subtitle, thumbnail), not because anything currently uses them.</div>`;
      reserved.forEach(col => {
        html += `<div class="reserved-field"><label>${col}</label>${fieldControl(row[col], col, ENTRY_SELECT_MAP, false)}</div>`;
      });
      html += `</div></td></tr>`;
    }
  });
  html += `</tbody></table>`;
  container.innerHTML = html;

  container.querySelectorAll("tr.core-row").forEach(tr => {
    const index = Number(tr.dataset.idx);
    tr.querySelectorAll("[data-field]").forEach(el => {
      el.addEventListener("change", () => runMutation(() => apiCall("PUT", `/api/entries/${index}`, { [el.dataset.field]: el.value })));
    });
    tr.querySelector('[data-act="toggle"]').addEventListener("click", () => {
      if (expandedEntries.has(index)) expandedEntries.delete(index); else expandedEntries.add(index);
      renderEntries();
    });
    tr.querySelector('[data-act="up"]').addEventListener("click", () => runMutation(() => apiCall("POST", `/api/entries/${index}/move`, { direction: "up" })));
    tr.querySelector('[data-act="down"]').addEventListener("click", () => runMutation(() => apiCall("POST", `/api/entries/${index}/move`, { direction: "down" })));
    tr.querySelector('[data-act="del"]').addEventListener("click", async () => {
      const ok = await confirmDialog("Delete entry?", `Delete entry "${esc(state.entries[index].row.id || "(untitled)")}"? This can't be undone.`);
      if (ok) runMutation(() => apiCall("DELETE", `/api/entries/${index}`));
    });
  });

  // reserved-panel fields live in a separate <tr>, wired separately since
  // they're outside the core-row loop above
  container.querySelectorAll("tr.reserved-row").forEach(tr => {
    const index = Number(tr.dataset.idx);
    tr.querySelectorAll("[data-field]").forEach(el => {
      el.addEventListener("change", () => runMutation(() => apiCall("PUT", `/api/entries/${index}`, { [el.dataset.field]: el.value })));
    });
  });
}

document.getElementById("add-entry").addEventListener("click", () => {
  const firstSection = state.sections[0] ? state.sections[0].row.id : "";
  runMutation(() => apiCall("POST", "/api/entries", { status: "wip", weight: "2", section: firstSection }));
  searchEntries = ""; document.getElementById("search-entries").value = "";
});

/* ---------- tabs / search ---------- */

document.querySelectorAll("nav.tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav.tabs button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll("section.panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});
document.getElementById("search-sections").addEventListener("input", e => { searchSections = e.target.value; renderSections(); });
document.getElementById("search-entries").addEventListener("input", e => { searchEntries = e.target.value; renderEntries(); });

/* ---------- confirm dialog ---------- */

function confirmDialog(title, body) {
  const dialog = document.getElementById("confirm-dialog");
  document.getElementById("confirm-dialog-title").textContent = title;
  document.getElementById("confirm-dialog-body").textContent = body;
  dialog.showModal();
  return new Promise(resolve => {
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");
    function cleanup(result) {
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      dialog.close();
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

/* ---------- rebuild ---------- */

document.getElementById("rebuild-btn").addEventListener("click", async () => {
  const btn = document.getElementById("rebuild-btn");
  btn.disabled = true;
  try {
    const result = await apiCall("POST", "/api/rebuild");
    showStatus(`Rebuilt docs/assets/js/cabinet-generated-content.js\n${result.output || ""}`, "ok");
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

/* ---------- init ---------- */

loadState().catch(err => showStatus(err.message, "error"));
