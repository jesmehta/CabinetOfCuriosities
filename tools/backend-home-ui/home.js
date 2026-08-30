// Cabinet backend home -- status polling, server-start, and script-run
// wiring. No framework, matches cabinet-editor-ui/now-editor-ui's own
// plain-JS convention.

async function refreshStatus() {
  let status;
  try {
    status = await (await fetch("/api/status")).json();
  } catch {
    return; // dashboard server itself would have to be down for this to fail
  }
  for (const key of ["nowEditor", "cabinetEditor"]) {
    const info = status[key];
    const dot = document.querySelector(`[data-dot="${key}"]`);
    const openLink = document.querySelector(`[data-open="${key}"]`);
    const startBtn = document.querySelector(`[data-start="${key === "nowEditor" ? "now-editor" : "cabinet-editor"}"]`);
    if (dot) dot.classList.toggle("on", info.running);
    if (openLink) openLink.href = info.url;
    if (startBtn) {
      startBtn.textContent = info.running ? "Running" : "Start server";
      startBtn.disabled = info.running;
    }
  }
}

function wireStartButtons() {
  document.querySelectorAll("[data-start]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const which = btn.dataset.start;
      btn.disabled = true;
      btn.textContent = "Starting...";
      try {
        await fetch(`/api/start/${which}`, { method: "POST" });
      } catch {
        btn.textContent = "Start failed";
        btn.disabled = false;
        return;
      }
      // Give the child process a moment to bind its port, then re-check
      // repeatedly -- spawn returning doesn't mean the server is listening
      // yet.
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshStatus();
        const stillLabeled = btn.textContent === "Starting...";
        if (!stillLabeled || attempts > 15) clearInterval(poll);
      }, 400);
    });
  });
}

function wireRunButtons() {
  document.querySelectorAll("[data-run-btn]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const which = btn.dataset.runBtn;
      const out = document.querySelector(`[data-run-out="${which}"]`);
      const originalLabel = btn.textContent;
      btn.disabled = true;
      btn.classList.add("running");
      btn.textContent = "Running...";
      out.classList.remove("show", "ok", "error");
      try {
        const res = await fetch(`/api/run/${which}`, { method: "POST" });
        const body = await res.json();
        out.textContent = body.ok ? body.output : body.error;
        out.classList.add("show", body.ok ? "ok" : "error");
      } catch (err) {
        out.textContent = String(err);
        out.classList.add("show", "error");
      } finally {
        btn.disabled = false;
        btn.classList.remove("running");
        btn.textContent = originalLabel;
        refreshStatus();
      }
    });
  });
}

wireStartButtons();
wireRunButtons();
refreshStatus();
setInterval(refreshStatus, 5000);
