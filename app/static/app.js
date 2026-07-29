const state = {
  view: "inbox",
  leads: [],
  business: null,
};

const els = {
  leadList: document.getElementById("leadList"),
  inboxCount: document.getElementById("inboxCount"),
  alertsOnly: document.getElementById("alertsOnly"),
  captureForm: document.getElementById("captureForm"),
  captureStatus: document.getElementById("captureStatus"),
  resultPanel: document.getElementById("resultPanel"),
  settingsForm: document.getElementById("settingsForm"),
  settingsStatus: document.getElementById("settingsStatus"),
  templatesBox: document.getElementById("templatesBox"),
  healthMeta: document.getElementById("healthMeta"),
  viewTitle: document.getElementById("viewTitle"),
  viewSubtitle: document.getElementById("viewSubtitle"),
};

const viewCopy = {
  inbox: {
    title: "Lead inbox",
    subtitle: "Hire-intent posts only — complaints stay quiet.",
  },
  intake: {
    title: "Capture a post",
    subtitle: "Paste a Facebook group post. We classify intent, then alert if it’s a real ask.",
  },
  settings: {
    title: "Business settings",
    subtitle: "Reply merge fields and where SMS alerts go.",
  },
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === view);
  });
  els.viewTitle.textContent = viewCopy[view].title;
  els.viewSubtitle.textContent = viewCopy[view].subtitle;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function renderLeads() {
  const leads = state.leads;
  els.inboxCount.textContent = `${leads.length} shown`;
  if (!leads.length) {
    els.leadList.innerHTML = `<div class="empty">No leads yet. Capture a Facebook post to test the matcher.</div>`;
    return;
  }

  els.leadList.innerHTML = leads
    .map((lead) => {
      const badgeClass = lead.should_alert ? "badge-alert" : "badge-skip";
      const badgeText = lead.should_alert ? "Alert" : "Skipped";
      const reply = lead.reply_text
        ? `<div class="reply-box">
            <strong>Prefill reply</strong>
            <code>${escapeHtml(lead.reply_text)}</code>
            <div class="lead-actions">
              <button type="button" class="btn btn-ghost" data-copy-lead="${lead.id}">Copy reply</button>
              ${lead.post_url ? `<a class="btn btn-ghost" href="${escapeHtml(lead.post_url)}" target="_blank" rel="noopener">Open post</a>` : ""}
              <button type="button" class="btn btn-ghost" data-status="${lead.id}" data-value="replied">Mark replied</button>
              <button type="button" class="btn btn-primary" data-status="${lead.id}" data-value="won">Won</button>
            </div>
          </div>`
        : `<div class="meta-row"><span>Reason: ${escapeHtml((lead.reasons || []).join("; "))}</span></div>`;

      return `<article class="lead">
        <div class="lead-head">
          <h3>${escapeHtml(lead.group_name || "Manual capture")} · ${escapeHtml(lead.trade || "n/a")}</h3>
          <span class="badge ${badgeClass}">${badgeText} · ${escapeHtml(lead.intent)}</span>
        </div>
        <p>${escapeHtml(lead.post_text)}</p>
        <div class="meta-row">
          <span>${formatTime(lead.created_at)}</span>
          <span>confidence ${Math.round((lead.confidence || 0) * 100)}%</span>
          <span>status ${escapeHtml(lead.status)}</span>
          <span>sms ${lead.sms_sent ? "sent" : escapeHtml(lead.sms_error || "not sent")}</span>
        </div>
        ${reply}
      </article>`;
    })
    .join("");
}

function renderResult(lead) {
  els.resultPanel.hidden = false;
  const flag = lead.should_alert ? "ALERT" : "SKIP";
  els.resultPanel.innerHTML = `
    <div class="lead-head">
      <h3>Result · ${flag}</h3>
      <span class="badge ${lead.should_alert ? "badge-alert" : "badge-skip"}">${escapeHtml(lead.intent)}</span>
    </div>
    <div class="meta-row">
      <span>trade ${escapeHtml(lead.trade || "none")}</span>
      <span>confidence ${Math.round(lead.confidence * 100)}%</span>
      <span>sms ${lead.sms_sent ? "sent" : escapeHtml(lead.sms_error || "not sent")}</span>
    </div>
    ${
      lead.reply_text
        ? `<div class="reply-box"><strong>Prefill reply</strong><code>${escapeHtml(lead.reply_text)}</code></div>`
        : `<p class="muted">${escapeHtml((lead.reasons || []).join("; "))}</p>`
    }
  `;
}

async function loadHealth() {
  const health = await api("/api/health");
  els.healthMeta.innerHTML = `
    TextRazor: ${health.textrazor ? "on" : "heuristic"}<br />
    Twilio: ${health.twilio ? "on" : "off"}
  `;
}

async function loadLeads() {
  const alertsOnly = els.alertsOnly.checked;
  state.leads = await api(`/api/leads?alerts_only=${alertsOnly ? "true" : "false"}`);
  renderLeads();
}

async function loadBusiness() {
  state.business = await api("/api/business");
  const form = els.settingsForm;
  form.name.value = state.business.name;
  form.owner_name.value = state.business.owner_name;
  form.phone.value = state.business.phone;
  form.alert_phone.value = state.business.alert_phone;
  form.city.value = state.business.city;
  form.trades.value = state.business.trades;
}

async function loadTemplates() {
  const templates = await api("/api/templates");
  els.templatesBox.innerHTML = `<h3 style="margin:0 0 .4rem;font-family:var(--font-display)">Reply templates</h3>` +
    templates
      .map(
        (t) => `<article class="template-item"><h4>${escapeHtml(t.name)}</h4><p>${escapeHtml(t.body)}</p></article>`
      )
      .join("");
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("gotoCaptureBtn").addEventListener("click", () => setView("intake"));
document.getElementById("refreshBtn").addEventListener("click", () => loadLeads());
els.alertsOnly.addEventListener("change", () => loadLeads());

els.captureForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.captureStatus.textContent = "Classifying…";
  els.captureStatus.classList.remove("is-error");
  const data = new FormData(els.captureForm);
  try {
    const lead = await api("/api/ingest", {
      method: "POST",
      body: JSON.stringify({
        text: data.get("text"),
        group_name: data.get("group_name") || "",
        post_url: data.get("post_url") || "",
        send_sms: Boolean(data.get("send_sms")),
        source: "manual",
      }),
    });
    els.captureStatus.textContent = lead.should_alert ? "Lead alerted." : "Skipped (not hire intent).";
    renderResult(lead);
    await loadLeads();
  } catch (err) {
    els.captureStatus.textContent = err.message || "Ingest failed";
    els.captureStatus.classList.add("is-error");
  }
});

els.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.settingsStatus.classList.remove("is-error");
  const data = new FormData(els.settingsForm);
  try {
    state.business = await api("/api/business", {
      method: "PATCH",
      body: JSON.stringify(Object.fromEntries(data.entries())),
    });
    els.settingsStatus.textContent = "Saved.";
  } catch (err) {
    els.settingsStatus.textContent = err.message || "Save failed";
    els.settingsStatus.classList.add("is-error");
  }
});

els.leadList.addEventListener("click", async (event) => {
  const copyBtn = event.target.closest("[data-copy-lead]");
  if (copyBtn) {
    const id = Number(copyBtn.getAttribute("data-copy-lead"));
    const lead = state.leads.find((item) => item.id === id);
    if (lead?.reply_text) {
      await navigator.clipboard.writeText(lead.reply_text);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy reply";
      }, 1200);
    }
    return;
  }

  const statusBtn = event.target.closest("[data-status]");
  if (statusBtn) {
    const id = statusBtn.getAttribute("data-status");
    const status = statusBtn.getAttribute("data-value");
    await api(`/api/leads/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    await loadLeads();
  }
});

async function boot() {
  setView("inbox");
  await Promise.all([loadHealth(), loadBusiness(), loadTemplates(), loadLeads()]);
}

boot().catch((err) => {
  els.healthMeta.textContent = `Startup error: ${err.message}`;
});
