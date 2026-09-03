// Now editor -- browser-side UI. Talks to now-editor.js's JSON API under
// /api/*, re-fetches full state after every mutation (simplest correct
// approach for a small local single-user tool -- no client-side state
// reconciliation to get subtly wrong). Reuses the live page's own Markdown
// renderer for the value-field preview so "what you see here" and "what the
// generator renders into now.md" can never drift apart -- see
// documentation/NOW-PAGE.md's "Local admin server".

import { renderInline, splitParagraphs } from "../assets/js/now-markdown.js";

let state = null;
let editingEntryIndex = null;
let addingEntryFor = null;
let editingSection = null;

const sectionsRoot = document.getElementById("sections-root");
const rebuildStatus = document.getElementById("rebuild-status");
const loadError = document.getElementById("load-error");

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `${method} ${path} failed (${res.status})`);
  return json;
}

async function loadState() {
  try {
    state = await api("GET", "/api/state");
    loadError.hidden = true;
    render();
  } catch (err) {
    loadError.hidden = false;
    loadError.textContent = `Could not load state: ${err.message}`;
  }
}

function renderValuePreview(value) {
  return splitParagraphs(value).map(p => `<p>${renderInline(p)}</p>`).join("");
}

// ---------------------------------------------------------------------------
// entry view row

// The up/down arrows swap this entry with its nearest same-section neighbour
// in now.tsv's row order -- which only ever affects the page's display order
// when both entries share the same date (the tie-break rule; see
// documentation/NOW-PAGE.md's "Sorting and Grouping"). Disabled whenever the neighbour in
// that direction has a different date, so a clickable arrow always means
// "this will visibly change the page."
function entryViewRow(entry, entries, position) {
  const prev = entries[position - 1];
  const next = entries[position + 1];
  const upDisabled = !prev || prev.date !== entry.date;
  const downDisabled = !next || next.date !== entry.date;

  const preview = entry.value.length > 160 ? entry.value.slice(0, 160) + "…" : entry.value;
  return `
    <li class="entry-row">
      ${entry.image ? `<img class="entry-thumb" src="${esc(entry.image)}" alt="" />` : ""}
      <div class="entry-main">
        <div class="entry-date">${esc(entry.date)}${entry.pinned ? ' <span class="pin-badge">pinned</span>' : ""}</div>
        <div class="entry-value-preview">${esc(preview)}</div>
        ${entry.notes ? `<div class="entry-notes-preview">notes: ${esc(entry.notes)}</div>` : ""}
      </div>
      <div class="entry-actions">
        <button type="button" class="btn btn-small" data-action="move-entry" data-index="${entry.index}" data-dir="up" ${upDisabled ? 'disabled title="only reorders entries sharing this one\'s date"' : ""}>&uarr;</button>
        <button type="button" class="btn btn-small" data-action="move-entry" data-index="${entry.index}" data-dir="down" ${downDisabled ? 'disabled title="only reorders entries sharing this one\'s date"' : ""}>&darr;</button>
        <button type="button" class="btn btn-small" data-action="toggle-pin" data-index="${entry.index}" data-pinned="${entry.pinned ? "1" : "0"}">${entry.pinned ? "Unpin" : "Pin"}</button>
        <button type="button" class="btn btn-small" data-action="edit-entry" data-index="${entry.index}">Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="delete-entry" data-index="${entry.index}">Delete</button>
      </div>
    </li>`;
}

function sectionOptionsHtml(selected) {
  return state.sectionOrder
    .map(key => `<option value="${esc(key)}" ${key === selected ? "selected" : ""}>${esc(state.sectionConfig[key]?.title || key)} (${esc(key)})</option>`)
    .join("");
}

function entryFormHtml({ formAction, dataAttrs, initial, submitLabel, showCancel, cancelAction }) {
  const v = initial || { date: new Date().toISOString().slice(0, 10), section: "", value: "", image: "", notes: "", pinned: false };
  return `
    <form class="entry-form" data-form="${formAction}" ${dataAttrs}>
      <div class="form-error" data-role="error"></div>
      <label>Date
        <input type="date" name="date" value="${esc(v.date)}" required />
      </label>
      <label>Section
        <select name="section" required>${sectionOptionsHtml(v.section)}</select>
      </label>
      <label class="checkbox-label">
        <input type="checkbox" name="pinned" value="true" ${v.pinned ? "checked" : ""} />
        Pinned -- always stays visible, past this section's normal visible-count cutoff, until unpinned
      </label>
      <label>Value (public -- title/link line, blank line, then reaction if any)
        <div class="value-toolbar">
          <button type="button" class="btn btn-small" data-md-wrap="**">Bold</button>
          <button type="button" class="btn btn-small" data-md-wrap="*">Italic</button>
          <button type="button" class="btn btn-small" data-md-link="1">Link</button>
        </div>
        <textarea name="value" required>${esc(v.value)}</textarea>
      </label>
      <div class="value-preview" data-role="value-preview">${renderValuePreview(v.value || "")}</div>
      <label>Image
        <div class="image-row">
          ${v.image ? `<img src="${esc(v.image)}" alt="" />` : ""}
          <input type="text" name="image" value="${esc(v.image)}" placeholder="/_images/now/section/file.jpg" class="image-path" />
          <input type="file" accept="image/*" data-role="image-upload" />
          <span data-role="upload-status"></span>
        </div>
      </label>
      <label>Notes (private -- never rendered on the page)
        <textarea name="notes">${esc(v.notes)}</textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">${submitLabel}</button>
        ${showCancel ? `<button type="button" class="btn" data-action="${cancelAction}">Cancel</button>` : ""}
      </div>
    </form>`;
}

// ---------------------------------------------------------------------------
// section card

function sectionEditFormHtml(key) {
  const c = state.sectionConfig[key];
  return `
    <form class="section-edit-form" data-form="edit-section" data-key="${esc(key)}">
      <div class="form-error" data-role="error"></div>
      <label>Title
        <input type="text" name="title" value="${esc(c.title)}" required />
      </label>
      <label>Mode
        <select name="mode">
          <option value="stream" ${c.mode === "stream" ? "selected" : ""}>stream</option>
          <option value="snapshot" ${c.mode === "snapshot" ? "selected" : ""}>snapshot</option>
        </select>
      </label>
      <label>Visible count
        <input type="number" name="visible" min="1" value="${c.visible}" required />
      </label>
      <label>Group size
        <input type="number" name="groupSize" min="1" value="${c.groupSize}" required />
      </label>
      <label>Image layout
        <select name="imageLayout">
          <option value="side" ${(c.imageLayout || "side") === "side" ? "selected" : ""}>side (thumbnail beside the text)</option>
          <option value="full" ${c.imageLayout === "full" ? "selected" : ""}>full width (image above the text)</option>
        </select>
      </label>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save section</button>
        <button type="button" class="btn" data-action="cancel-edit-section">Cancel</button>
      </div>
    </form>`;
}

function sectionCard(key, orderIndex, orderLength) {
  const config = state.sectionConfig[key];
  const entries = state.entries.filter(e => e.section === key);

  if (!config) {
    return `<div class="section-card"><div class="section-card-header">
      <span class="section-card-title">"${esc(key)}" (no config in now-data.js -- has ${entries.length} entr${entries.length === 1 ? "y" : "ies"} in now.tsv)</span>
    </div></div>`;
  }

  const header = editingSection === key
    ? sectionEditFormHtml(key)
    : `
      <div class="section-card-header">
        <div>
          <div class="section-card-title">${esc(config.title)}</div>
          <div class="section-card-meta">${esc(key)} · ${esc(config.mode)} · ${config.visible} visible · group of ${config.groupSize} · ${entries.length} entr${entries.length === 1 ? "y" : "ies"}</div>
        </div>
        <div class="section-card-actions">
          <button type="button" class="btn btn-small" data-action="move-section" data-key="${esc(key)}" data-dir="up" ${orderIndex === 0 ? "disabled" : ""}>&uarr;</button>
          <button type="button" class="btn btn-small" data-action="move-section" data-key="${esc(key)}" data-dir="down" ${orderIndex === orderLength - 1 ? "disabled" : ""}>&darr;</button>
          <button type="button" class="btn btn-small" data-action="toggle-edit-section" data-key="${esc(key)}">Edit section</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-section" data-key="${esc(key)}" ${entries.length ? "disabled title=\"remove its entries first\"" : ""}>Delete section</button>
        </div>
      </div>`;

  const addForm = addingEntryFor === key
    ? entryFormHtml({
        formAction: "add-entry",
        dataAttrs: `data-key="${esc(key)}"`,
        initial: { date: new Date().toISOString().slice(0, 10), section: key, value: "", image: "", notes: "", pinned: false },
        submitLabel: "Add entry",
        showCancel: true,
        cancelAction: "cancel-add-entry",
      })
    : `<div class="add-entry-toggle"><button type="button" class="btn" data-action="toggle-add-entry" data-key="${esc(key)}">+ Add entry to ${esc(config.title)}</button></div>`;

  return `
    <div class="section-card">
      ${header}
      <ul class="entry-list">${entries.map((e, i) => {
        if (e.index === editingEntryIndex) {
          return `<li class="entry-row" style="display:block;">${entryFormHtml({
            formAction: "edit-entry",
            dataAttrs: `data-index="${e.index}"`,
            initial: e,
            submitLabel: "Save entry",
            showCancel: true,
            cancelAction: "cancel-edit-entry",
          })}</li>`;
        }
        return entryViewRow(e, entries, i);
      }).join("") || `<div class="empty-note">No entries yet.</div>`}</ul>
      ${addForm}
    </div>`;
}

function render() {
  sectionsRoot.innerHTML = state.sectionOrder
    .map((key, i) => sectionCard(key, i, state.sectionOrder.length))
    .join("");
}

// ---------------------------------------------------------------------------
// image upload (shared by add/edit entry forms)

function wireImageUpload(form) {
  const fileInput = form.querySelector('[data-role="image-upload"]');
  const pathInput = form.querySelector('input[name="image"]');
  const statusEl = form.querySelector('[data-role="upload-status"]');
  if (!fileInput) return;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const sectionSelect = form.querySelector('select[name="section"]');
    const section = sectionSelect ? sectionSelect.value : "";
    if (!section) { statusEl.textContent = "pick a section first"; return; }

    statusEl.textContent = "uploading…";
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1];
      const result = await api("POST", "/api/images", { section, filename: file.name, dataBase64: base64 });
      pathInput.value = result.path;
      statusEl.textContent = `uploaded -> ${result.path}`;
    } catch (err) {
      statusEl.textContent = `upload failed: ${err.message}`;
    }
  });
}

// ---------------------------------------------------------------------------
// live value preview + a tiny Bold/Italic/Link toolbar

function wireValuePreview(form) {
  const textarea = form.querySelector('textarea[name="value"]');
  const preview = form.querySelector('[data-role="value-preview"]');
  if (!textarea || !preview) return;

  textarea.addEventListener("input", () => {
    preview.innerHTML = renderValuePreview(textarea.value);
  });

  form.querySelectorAll("[data-md-wrap]").forEach(btn => {
    btn.addEventListener("click", () => {
      const marker = btn.dataset.mdWrap;
      const { selectionStart: s, selectionEnd: e, value } = textarea;
      const selected = value.slice(s, e) || "text";
      textarea.value = value.slice(0, s) + marker + selected + marker + value.slice(e);
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    });
  });

  const linkBtn = form.querySelector("[data-md-link]");
  if (linkBtn) {
    linkBtn.addEventListener("click", () => {
      const url = prompt("Link URL (https:// or mailto:)");
      if (!url) return;
      const { selectionStart: s, selectionEnd: e, value } = textarea;
      const selected = value.slice(s, e) || "link text";
      textarea.value = value.slice(0, s) + `[${selected}](${url})` + value.slice(e);
      textarea.dispatchEvent(new Event("input"));
      textarea.focus();
    });
  }
}

function wireEntryForm(form) {
  // Idempotency guard: the MutationObserver below re-scans every form in
  // sectionsRoot on ANY childList mutation in its subtree -- including the
  // value-preview's own innerHTML update on every keystroke (subtree: true
  // means that counts too, not just top-level render() swaps). Without this
  // guard, typing N characters then clicking "Link" fired the resulting N
  // stacked duplicate listeners' prompt() calls one after another.
  if (form.dataset.wired) return;
  form.dataset.wired = "1";

  wireImageUpload(form);
  wireValuePreview(form);
}

// after every render(), wire up freshly-inserted forms
const formObserver = new MutationObserver(() => {
  sectionsRoot.querySelectorAll('form[data-form="add-entry"], form[data-form="edit-entry"]').forEach(wireEntryForm);
});
formObserver.observe(sectionsRoot, { childList: true, subtree: true });

// ---------------------------------------------------------------------------
// event delegation: clicks

sectionsRoot.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === "toggle-add-entry") { addingEntryFor = addingEntryFor === btn.dataset.key ? null : btn.dataset.key; editingEntryIndex = null; render(); return; }
  if (action === "cancel-add-entry") { addingEntryFor = null; render(); return; }
  if (action === "edit-entry") { editingEntryIndex = Number(btn.dataset.index); addingEntryFor = null; render(); return; }
  if (action === "cancel-edit-entry") { editingEntryIndex = null; render(); return; }
  if (action === "toggle-edit-section") { editingSection = editingSection === btn.dataset.key ? null : btn.dataset.key; render(); return; }
  if (action === "cancel-edit-section") { editingSection = null; render(); return; }

  if (action === "delete-entry") {
    if (!confirm("Delete this entry?")) return;
    try { await api("DELETE", `/api/entries/${btn.dataset.index}`); await loadState(); }
    catch (err) { alert(err.message); }
    return;
  }

  if (action === "move-entry") {
    try { await api("POST", `/api/entries/${btn.dataset.index}/move`, { direction: btn.dataset.dir }); await loadState(); }
    catch (err) { alert(err.message); }
    return;
  }

  if (action === "toggle-pin") {
    const entry = state.entries[Number(btn.dataset.index)];
    try {
      await api("PUT", `/api/entries/${btn.dataset.index}`, { ...entry, pinned: entry.pinned ? "false" : "true" });
      await loadState();
    } catch (err) { alert(err.message); }
    return;
  }

  if (action === "delete-section") {
    if (!confirm(`Delete section "${btn.dataset.key}"?`)) return;
    try { await api("DELETE", `/api/sections/${encodeURIComponent(btn.dataset.key)}`); await loadState(); }
    catch (err) { alert(err.message); }
    return;
  }

  if (action === "move-section") {
    try { await api("POST", `/api/sections/${encodeURIComponent(btn.dataset.key)}/move`, { direction: btn.dataset.dir }); await loadState(); }
    catch (err) { alert(err.message); }
    return;
  }
});

// ---------------------------------------------------------------------------
// event delegation: form submits (add/edit entry, edit section)

function formValues(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

sectionsRoot.addEventListener("submit", async (e) => {
  const form = e.target.closest("form[data-form]");
  if (!form) return;
  e.preventDefault();
  const errorEl = form.querySelector('[data-role="error"]');
  errorEl.textContent = "";

  const formType = form.dataset.form;
  try {
    if (formType === "add-entry") {
      const v = formValues(form);
      await api("POST", "/api/entries", v);
      addingEntryFor = null;
      await loadState();
    } else if (formType === "edit-entry") {
      const v = formValues(form);
      await api("PUT", `/api/entries/${form.dataset.index}`, v);
      editingEntryIndex = null;
      await loadState();
    } else if (formType === "edit-section") {
      const v = formValues(form);
      await api("PUT", `/api/sections/${encodeURIComponent(form.dataset.key)}`, v);
      editingSection = null;
      await loadState();
    }
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------------------------------------------------------------------------
// add-section form (static, not re-rendered)

const addSectionForm = document.getElementById("add-section-form");
addSectionForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = addSectionForm.querySelector('[data-role="error"]');
  errorEl.textContent = "";
  try {
    const v = formValues(addSectionForm);
    await api("POST", "/api/sections", v);
    addSectionForm.reset();
    await loadState();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// ---------------------------------------------------------------------------
// rebuild button

document.getElementById("rebuild-btn").addEventListener("click", async () => {
  rebuildStatus.hidden = false;
  rebuildStatus.className = "status-banner";
  rebuildStatus.textContent = "Rebuilding…";
  try {
    const result = await api("POST", "/api/rebuild");
    rebuildStatus.className = "status-banner status-success";
    rebuildStatus.textContent = result.output || "Rebuilt now.md.";
  } catch (err) {
    rebuildStatus.className = "status-banner status-error";
    rebuildStatus.textContent = `Rebuild failed:\n${err.message}`;
  }
});

loadState();
