const STORAGE_KEY = "speedlead_local_v1";

const demos = {
  hire: {
    group_name: "Nixa Neighbors",
    text: "Anyone know a good plumber in Nixa? Toilet overflowing ASAP.",
  },
  complaint: {
    group_name: "Springfield Moms",
    text: "Stay away from Joe's Plumbing. Worst plumber ever, complete scam and nightmare.",
  },
};

const defaultBusiness = {
  id: 1,
  name: "Ozark Comfort Pros",
  owner_name: "Mike",
  phone: "+14175550199",
  alert_phone: "+14175550199",
  city: "Springfield",
  trades: "hvac,plumbing",
};

const defaultTemplates = [
  {
    id: 1,
    trade: "plumbing",
    name: "Plumbing — fast",
    is_default: true,
    body: "Hi! I’m {name} with {business}. We can help with that — licensed & insured, serving the {city} area. Call/text {phone} and we’ll get you on the schedule ASAP.",
  },
  {
    id: 2,
    trade: "hvac",
    name: "HVAC — down system",
    is_default: true,
    body: "Hey! {name} here with {business}. If your system is down, we can usually diagnose fast. Call/text {phone} — tell us the issue and your zip and we’ll help ASAP.",
  },
];

const state = {
  view: "inbox",
  leads: [],
  business: { ...defaultBusiness },
  templates: [...defaultTemplates],
  offline: false,
  nextId: 1,
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
  modeBanner: document.getElementById("modeBanner"),
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

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.business = parsed.business || state.business;
    state.leads = parsed.leads || [];
    state.templates = parsed.templates || state.templates;
    state.nextId = parsed.nextId || state.nextId;
  } catch {
    /* ignore corrupt storage */
  }
}

function saveLocal() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      business: state.business,
      leads: state.leads,
      templates: state.templates,
      nextId: state.nextId,
    })
  );
}

function setOffline(offline, detail = "") {
  state.offline = offline;
  if (!els.modeBanner) return;
  if (offline) {
    els.modeBanner.hidden = false;
    els.modeBanner.textContent =
      detail ||
      "Running in local demo mode (no API). Classification still works — tap Capture and try a sample.";
  } else {
    els.modeBanner.hidden = true;
    els.modeBanner.textContent = "";
  }
}

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

function renderTemplate(body, business) {
  return body
    .replaceAll("{name}", business.owner_name || "")
    .replaceAll("{business}", business.name || "")
    .replaceAll("{phone}", business.phone || "")
    .replaceAll("{city}", business.city || "")
    .replaceAll("{offer}", "");
}

function pickTemplate(trade) {
  const exact = state.templates.find((t) => t.trade === trade && t.is_default);
  if (exact) return exact;
  return state.templates.find((t) => t.trade === trade) || state.templates[0];
}

function renderLeads() {
  const alertsOnly = els.alertsOnly.checked;
  const leads = alertsOnly ? state.leads.filter((l) => l.should_alert) : state.leads;
  els.inboxCount.textContent = `${leads.length} shown`;
  if (!leads.length) {
    els.leadList.innerHTML = `<div class="empty">No leads yet. Tap <strong>Capture post</strong>, then try a sample hire request.</div>`;
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

function fillBusinessForm() {
  const form = els.settingsForm;
  form.name.value = state.business.name || "";
  form.owner_name.value = state.business.owner_name || "";
  form.phone.value = state.business.phone || "";
  form.alert_phone.value = state.business.alert_phone || "";
  form.city.value = state.business.city || "";
  form.trades.value = state.business.trades || "";
}

function renderTemplates() {
  els.templatesBox.innerHTML =
    `<h3 style="margin:0 0 .4rem;font-family:var(--font-display)">Reply templates</h3>` +
    state.templates
      .map((t) => `<article class="template-item"><h4>${escapeHtml(t.name)}</h4><p>${escapeHtml(t.body)}</p></article>`)
      .join("");
}

function localIngest({ text, group_name, post_url }) {
  const result = window.SpeedLeadMatcher.classify(text);
  const template = pickTemplate(result.trade);
  const reply = result.should_alert && template ? renderTemplate(template.body, state.business) : "";
  const lead = {
    id: state.nextId++,
    business_id: state.business.id,
    source: "manual",
    group_name: group_name || "",
    post_text: text,
    post_url: post_url || "",
    intent: result.intent,
    trade: result.trade,
    confidence: result.confidence,
    should_alert: result.should_alert,
    matched_keywords: result.matched_keywords,
    reasons: result.reasons.concat(["mode:local"]),
    reply_text: reply,
    status: result.should_alert ? "alerted" : "skipped",
    sms_sent: false,
    sms_error: "local_mode",
    created_at: new Date().toISOString(),
  };
  state.leads.unshift(lead);
  saveLocal();
  return lead;
}

async function loadLeads() {
  if (state.offline) {
    renderLeads();
    return;
  }
  try {
    const alertsOnly = els.alertsOnly.checked;
    state.leads = await api(`/api/leads?alerts_only=false`);
    // keep full list locally for toggles; filter in render
    if (alertsOnly) {
      /* filtered in renderLeads */
    }
    renderLeads();
  } catch (err) {
    setOffline(true, `API unavailable (${err.message}). Using local demo mode.`);
    loadLocal();
    renderLeads();
  }
}

async function loadBusiness() {
  if (state.offline) {
    fillBusinessForm();
    return;
  }
  try {
    state.business = await api("/api/business");
    fillBusinessForm();
  } catch {
    fillBusinessForm();
  }
}

async function loadTemplates() {
  if (state.offline) {
    renderTemplates();
    return;
  }
  try {
    state.templates = await api("/api/templates");
    renderTemplates();
  } catch {
    renderTemplates();
  }
}

async function loadHealth() {
  try {
    const health = await api("/api/health");
    setOffline(false);
    els.healthMeta.innerHTML = `
      API: online<br />
      TextRazor: ${health.textrazor ? "on" : "heuristic"}<br />
      Twilio: ${health.twilio ? "on" : "off"}
    `;
  } catch {
    setOffline(true);
    els.healthMeta.innerHTML = `API: offline<br />Local matcher: on`;
  }
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("gotoCaptureBtn").addEventListener("click", () => setView("intake"));
document.getElementById("refreshBtn").addEventListener("click", () => {
  loadHealth().then(loadLeads);
});
els.alertsOnly.addEventListener("change", () => renderLeads());

document.querySelectorAll("[data-demo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const demo = demos[btn.getAttribute("data-demo")];
    if (!demo) return;
    els.captureForm.group_name.value = demo.group_name;
    els.captureForm.text.value = demo.text;
    els.captureStatus.textContent = "Sample loaded — tap Classify & ingest.";
    els.captureStatus.classList.remove("is-error");
  });
});

els.captureForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.captureStatus.textContent = "Classifying…";
  els.captureStatus.classList.remove("is-error");
  const data = new FormData(els.captureForm);
  const payload = {
    text: String(data.get("text") || ""),
    group_name: String(data.get("group_name") || ""),
    post_url: String(data.get("post_url") || ""),
    send_sms: Boolean(data.get("send_sms")),
    source: "manual",
  };

  try {
    let lead;
    if (state.offline) {
      lead = localIngest(payload);
    } else {
      lead = await api("/api/ingest", { method: "POST", body: JSON.stringify(payload) });
      await loadLeads();
    }
    els.captureStatus.textContent = lead.should_alert ? "Lead alerted." : "Skipped (not hire intent).";
    renderResult(lead);
    renderLeads();
    setView("inbox");
  } catch (err) {
    // fall back to local if API fails mid-flight
    setOffline(true, `API error — switched to local mode. (${err.message})`);
    const lead = localIngest(payload);
    els.captureStatus.textContent = lead.should_alert ? "Lead alerted (local)." : "Skipped (local).";
    renderResult(lead);
    renderLeads();
    setView("inbox");
  }
});

els.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.settingsStatus.classList.remove("is-error");
  const data = new FormData(els.settingsForm);
  const payload = Object.fromEntries(data.entries());
  try {
    if (state.offline) {
      state.business = { ...state.business, ...payload };
      saveLocal();
      els.settingsStatus.textContent = "Saved locally.";
    } else {
      state.business = await api("/api/business", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      els.settingsStatus.textContent = "Saved.";
    }
  } catch (err) {
    state.business = { ...state.business, ...payload };
    saveLocal();
    setOffline(true);
    els.settingsStatus.textContent = "Saved locally (API offline).";
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
    const id = Number(statusBtn.getAttribute("data-status"));
    const status = statusBtn.getAttribute("data-value");
    if (state.offline) {
      const lead = state.leads.find((item) => item.id === id);
      if (lead) lead.status = status;
      saveLocal();
      renderLeads();
      return;
    }
    try {
      await api(`/api/leads/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      await loadLeads();
    } catch (err) {
      els.healthMeta.textContent = `Status update failed: ${err.message}`;
    }
  }
});

async function boot() {
  setView("inbox");
  loadLocal();
  await loadHealth();
  await Promise.all([loadBusiness(), loadTemplates(), loadLeads()]);
}

boot().catch((err) => {
  setOffline(true, `Startup error — local mode. ${err.message}`);
  fillBusinessForm();
  renderTemplates();
  renderLeads();
});
