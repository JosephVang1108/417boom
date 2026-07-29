const STORAGE_KEY = "speedlead_simple_v1";

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
  phone: "(417) 555-0199",
  alert_phone: "(417) 555-0199",
  city: "Springfield",
  trades: "hvac,plumbing",
};

const defaultTemplates = [
  {
    id: 1,
    trade: "plumbing",
    is_default: true,
    body: "Hi! I’m {name} with {business}. We can help with that — licensed & insured, serving the {city} area. Call/text {phone} and we’ll get you on the schedule ASAP.",
  },
  {
    id: 2,
    trade: "hvac",
    is_default: true,
    body: "Hey! {name} here with {business}. If your system is down, we can usually diagnose fast. Call/text {phone} — tell us the issue and your zip and we’ll help ASAP.",
  },
];

const state = {
  view: "home",
  leads: [],
  business: { ...defaultBusiness },
  templates: [...defaultTemplates],
  offline: false,
  nextId: 1,
};

const els = {
  leadList: document.getElementById("leadList"),
  captureForm: document.getElementById("captureForm"),
  captureStatus: document.getElementById("captureStatus"),
  resultCard: document.getElementById("resultCard"),
  settingsForm: document.getElementById("settingsForm"),
  settingsStatus: document.getElementById("settingsStatus"),
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
    /* ignore */
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

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === view);
  });
  const main = document.querySelector(".main");
  if (main) main.scrollTop = 0;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
  return (
    state.templates.find((t) => t.trade === trade && t.is_default) ||
    state.templates.find((t) => t.trade === trade) ||
    state.templates[0]
  );
}

function jobLeads() {
  return state.leads.filter((lead) => lead.should_alert && lead.status !== "done");
}

function renderLeads() {
  const leads = jobLeads();
  if (!leads.length) {
    els.leadList.innerHTML = `
      <div class="empty">
        <h2>No new jobs yet</h2>
        <p>When someone asks for a plumber or HVAC tech, it’ll show up here with your reply ready to copy.</p>
        <button type="button" class="btn btn-primary" id="emptyPasteBtn">Paste a Facebook post</button>
      </div>`;
    document.getElementById("emptyPasteBtn")?.addEventListener("click", () => setView("paste"));
    return;
  }

  els.leadList.innerHTML = leads
    .map((lead) => {
      return `
      <article class="lead is-job">
        <span class="lead-label job">New job</span>
        <h2>${escapeHtml(lead.group_name || "Facebook group")}</h2>
        <p class="post">${escapeHtml(lead.post_text)}</p>
        <div class="reply">
          <strong>Your reply</strong>
          <p>${escapeHtml(lead.reply_text)}</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-primary" data-copy-lead="${lead.id}">Copy my reply</button>
          <button type="button" class="btn btn-secondary" data-done="${lead.id}">Done — I replied</button>
        </div>
      </article>`;
    })
    .join("");
}

function showResult(lead) {
  els.resultCard.hidden = false;
  if (lead.should_alert) {
    els.resultCard.innerHTML = `
      <span class="lead-label job">This looks like a job</span>
      <h2>Reply is ready</h2>
      <p>We saved it under Jobs. Copy your reply and paste it on Facebook.</p>
      <div class="reply">
        <strong>Your reply</strong>
        <p>${escapeHtml(lead.reply_text)}</p>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-primary" data-copy-lead="${lead.id}">Copy my reply</button>
        <button type="button" class="btn btn-secondary" id="goJobsBtn">Go to Jobs</button>
      </div>`;
    document.getElementById("goJobsBtn")?.addEventListener("click", () => setView("home"));
  } else {
    const why =
      lead.intent === "complaint"
        ? "That’s someone complaining — not asking for help."
        : lead.intent === "job_posting"
          ? "That’s a hiring post, not a customer looking for service."
          : "We couldn’t tell this was a customer looking for help.";
    els.resultCard.innerHTML = `
      <span class="lead-label skip">Not a job</span>
      <h2>No alert needed</h2>
      <p>${why}</p>
      <button type="button" class="btn btn-secondary btn-block" id="tryAnotherBtn">Try another post</button>`;
    document.getElementById("tryAnotherBtn")?.addEventListener("click", () => {
      els.resultCard.hidden = true;
      els.captureForm.text.value = "";
      els.captureStatus.textContent = "";
    });
  }
}

function fillSettings() {
  const form = els.settingsForm;
  form.owner_name.value = state.business.owner_name || "";
  form.name.value = state.business.name || "";
  form.phone.value = state.business.phone || "";
  form.alert_phone.value = state.business.alert_phone || "";
  form.city.value = state.business.city || "";
}

function localIngest({ text, group_name }) {
  const result = window.SpeedLeadMatcher.classify(text);
  const template = pickTemplate(result.trade);
  const reply =
    result.should_alert && template ? renderTemplate(template.body, state.business) : "";
  const lead = {
    id: state.nextId++,
    group_name: group_name || "",
    post_text: text,
    intent: result.intent,
    trade: result.trade,
    should_alert: result.should_alert,
    reply_text: reply,
    status: result.should_alert ? "new" : "skipped",
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
    const leads = await api("/api/leads?alerts_only=false");
    state.leads = leads.map((lead) => ({
      ...lead,
      status: lead.status === "won" || lead.status === "replied" || lead.status === "ignored" ? "done" : lead.status,
    }));
    renderLeads();
  } catch {
    state.offline = true;
    loadLocal();
    renderLeads();
  }
}

async function loadBusiness() {
  if (!state.offline) {
    try {
      state.business = await api("/api/business");
    } catch {
      state.offline = true;
    }
  }
  fillSettings();
}

async function loadTemplates() {
  if (state.offline) return;
  try {
    state.templates = await api("/api/templates");
  } catch {
    /* keep defaults */
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.querySelectorAll("[data-demo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const demo = demos[btn.getAttribute("data-demo")];
    if (!demo) return;
    els.captureForm.group_name.value = demo.group_name;
    els.captureForm.text.value = demo.text;
    els.captureStatus.textContent = "Example loaded — tap Check this post.";
    els.captureStatus.classList.remove("is-error");
    els.resultCard.hidden = true;
  });
});

els.captureForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.captureStatus.textContent = "Checking…";
  els.captureStatus.classList.remove("is-error");
  const data = new FormData(els.captureForm);
  const payload = {
    text: String(data.get("text") || ""),
    group_name: String(data.get("group_name") || ""),
    send_sms: false,
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
    els.captureStatus.textContent = lead.should_alert ? "Job found." : "Not a job.";
    showResult(lead);
    renderLeads();
  } catch (err) {
    state.offline = true;
    const lead = localIngest(payload);
    els.captureStatus.textContent = lead.should_alert ? "Job found." : "Not a job.";
    showResult(lead);
    renderLeads();
  }
});

els.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(els.settingsForm).entries());
  try {
    if (state.offline) {
      state.business = { ...state.business, ...data };
      saveLocal();
    } else {
      state.business = await api("/api/business", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    }
    els.settingsStatus.textContent = "Saved.";
    els.settingsStatus.classList.remove("is-error");
  } catch {
    state.business = { ...state.business, ...data };
    saveLocal();
    state.offline = true;
    els.settingsStatus.textContent = "Saved on this phone.";
  }
});

els.leadList.addEventListener("click", async (event) => {
  const copyBtn = event.target.closest("[data-copy-lead]");
  if (copyBtn) {
    const id = Number(copyBtn.getAttribute("data-copy-lead"));
    const lead = state.leads.find((item) => item.id === id);
    if (lead?.reply_text) {
      await navigator.clipboard.writeText(lead.reply_text);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy my reply";
      }, 1200);
    }
    return;
  }

  const doneBtn = event.target.closest("[data-done]");
  if (doneBtn) {
    const id = Number(doneBtn.getAttribute("data-done"));
    const lead = state.leads.find((item) => item.id === id);
    if (!lead) return;
    lead.status = "done";
    saveLocal();
    if (!state.offline) {
      try {
        await api(`/api/leads/${id}/status`, {
          method: "POST",
          body: JSON.stringify({ status: "replied" }),
        });
      } catch {
        /* local is enough */
      }
    }
    renderLeads();
  }
});

document.getElementById("resultCard").addEventListener("click", async (event) => {
  const copyBtn = event.target.closest("[data-copy-lead]");
  if (!copyBtn) return;
  const id = Number(copyBtn.getAttribute("data-copy-lead"));
  const lead = state.leads.find((item) => item.id === id);
  if (lead?.reply_text) {
    await navigator.clipboard.writeText(lead.reply_text);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy my reply";
    }, 1200);
  }
});

async function boot() {
  loadLocal();
  setView("home");
  try {
    await api("/api/health");
    state.offline = false;
  } catch {
    state.offline = true;
  }
  await loadBusiness();
  await loadTemplates();
  await loadLeads();
}

boot();
