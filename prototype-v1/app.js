const STORAGE_KEY = "avereo-connect-prototype-v1";

const defaultState = {
  session: null,
  catalogVersion: 1,
  catalogPublishedAt: null,
  catalog: [
    { id: "t1", trade: "Peinture", label: "Peinture murs", unit: "m2", priceHt: 24, tva: 10 },
    { id: "t2", trade: "Peinture", label: "Peinture plafond", unit: "m2", priceHt: 18, tva: 10 },
    { id: "t3", trade: "Electricite", label: "Remplacement prises", unit: "u", priceHt: 69, tva: 20 },
    { id: "t4", trade: "Plomberie", label: "Pose lavabo", unit: "u", priceHt: 240, tva: 20 },
    { id: "t5", trade: "Sols", label: "Pose parquet", unit: "m2", priceHt: 52, tva: 10 }
  ],
  properties: [],
  activePropertyId: null,
  project: {
    name: "",
    rooms: []
  },
  quoteLines: [],
  encadrementPct: 8
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      project: {
        ...structuredClone(defaultState.project),
        ...(parsed.project || {})
      }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function euro(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(value || 0);
}

const els = {
  tabs: Array.from(document.querySelectorAll(".tab")),
  views: Array.from(document.querySelectorAll(".view")),
  toast: document.getElementById("toast"),
  sessionBadge: document.getElementById("sessionBadge"),
  catalogVersionBadge: document.getElementById("catalogVersionBadge"),

  loginForm: document.getElementById("loginForm"),

  propertyForm: document.getElementById("propertyForm"),
  propertyList: document.getElementById("propertyList"),
  propertyCount: document.getElementById("propertyCount"),
  activePropertyName: document.getElementById("activePropertyName"),

  projectForm: document.getElementById("projectForm"),
  roomForm: document.getElementById("roomForm"),
  roomList: document.getElementById("roomList"),

  taskPicker: document.getElementById("taskPicker"),
  quoteLines: document.getElementById("quoteLines"),
  encadrementInput: document.getElementById("encadrementInput"),
  encadrementValue: document.getElementById("encadrementValue"),
  quickTotals: document.getElementById("quickTotals"),

  summaryTable: document.getElementById("summaryTable"),
  summaryTotals: document.getElementById("summaryTotals"),
  quoteMeta: document.getElementById("quoteMeta"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  printPdfBtn: document.getElementById("printPdfBtn"),

  taskForm: document.getElementById("taskForm"),
  adminTable: document.getElementById("adminTable"),
  publishCatalogBtn: document.getElementById("publishCatalogBtn")
};

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2000);
}

function setView(viewName) {
  const isAuthenticated = !!state.session;
  if (!isAuthenticated && viewName !== "login") {
    toast("Connecte-toi pour acceder aux modules.");
    viewName = "login";
  }

  if (viewName === "admin" && state.session?.role !== "Admin") {
    toast("Acces reserve au role Admin.");
    viewName = "dashboard";
  }

  els.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === viewName);
  });

  els.views.forEach((view) => {
    view.classList.toggle("is-visible", view.id === `view-${viewName}`);
  });
}

function getActiveProperty() {
  return state.properties.find((item) => item.id === state.activePropertyId) || null;
}

function computeTotals() {
  const active = state.quoteLines.filter((line) => line.active);
  const baseHt = active.reduce((sum, line) => sum + line.qty * line.priceHt, 0);
  const baseTva = active.reduce((sum, line) => sum + line.qty * line.priceHt * (line.tva / 100), 0);

  const encadrementHt = baseHt * (state.encadrementPct / 100);
  const encadrementTva = encadrementHt * 0.2;

  const totalHt = baseHt + encadrementHt;
  const totalTva = baseTva + encadrementTva;
  const totalTtc = totalHt + totalTva;

  return { active, baseHt, baseTva, encadrementHt, encadrementTva, totalHt, totalTva, totalTtc };
}

function renderSession() {
  if (!state.session) {
    els.sessionBadge.textContent = "non connecte";
    return;
  }
  els.sessionBadge.textContent = `${state.session.name} - ${state.session.role}`;
}

function renderCatalogBadge() {
  els.catalogVersionBadge.textContent = `catalog v${state.catalogVersion}`;
}

function renderProperties() {
  els.propertyCount.textContent = `${state.properties.length} bien(s)`;
  const active = getActiveProperty();
  els.activePropertyName.textContent = active ? active.address : "aucun";

  if (state.properties.length === 0) {
    els.propertyList.innerHTML = "<p class='hint'>Ajoute un premier bien pour lancer le dossier.</p>";
    return;
  }

  els.propertyList.innerHTML = state.properties
    .map((property) => {
      const selected = property.id === state.activePropertyId;
      return `
      <article class="card">
        <h4>${property.address}</h4>
        <p>${property.kind} - ${property.surface} m2</p>
        <p>${property.status}</p>
        <div class="actions">
          <button class="btn ${selected ? "btn--primary" : ""}" data-action="select-property" data-id="${property.id}">
            ${selected ? "Selectionne" : "Selectionner"}
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderRooms() {
  const rooms = state.project.rooms;
  if (!rooms || rooms.length === 0) {
    els.roomList.innerHTML = "<p class='hint'>Ajoute les pieces pour alimenter le chiffrage.</p>";
    return;
  }

  els.roomList.innerHTML = rooms
    .map(
      (room) => `
      <article class="card">
        <h4>${room.name}</h4>
        <p>Surface: ${room.surface} m2</p>
        <p>Hauteur: ${room.height} m</p>
      </article>
    `
    )
    .join("");
}

function renderTaskPicker() {
  els.taskPicker.innerHTML = state.catalog
    .map(
      (task) => `
      <div class="task-row">
        <div>
          <strong>${task.trade}</strong><br />
          <span>${task.label}</span>
        </div>
        <div>${task.unit}</div>
        <div>${euro(task.priceHt)}</div>
        <div>TVA ${task.tva}%</div>
        <button class="btn" data-action="add-line" data-id="${task.id}">Ajouter</button>
      </div>
    `
    )
    .join("");
}

function renderQuoteLines() {
  if (state.quoteLines.length === 0) {
    els.quoteLines.innerHTML = "<p class='hint'>Ajoute des taches depuis le catalogue.</p>";
    return;
  }

  els.quoteLines.innerHTML = state.quoteLines
    .map(
      (line) => `
      <div class="line-row">
        <div>
          <strong>${line.trade}</strong><br />
          <span>${line.label}</span>
        </div>
        <div><input data-action="qty" data-id="${line.id}" type="number" min="0" step="0.1" value="${line.qty}" /></div>
        <div>${euro(line.priceHt)}</div>
        <div>
          <label>
            <input data-action="toggle" data-id="${line.id}" type="checkbox" ${line.active ? "checked" : ""} /> active
          </label>
        </div>
        <button class="btn" data-action="remove-line" data-id="${line.id}">Suppr.</button>
      </div>
    `
    )
    .join("");
}

function renderQuickTotals() {
  const totals = computeTotals();
  els.quickTotals.innerHTML = `
    <div class="metric"><span>Base HT</span><strong>${euro(totals.baseHt)}</strong></div>
    <div class="metric"><span>TVA</span><strong>${euro(totals.baseTva)}</strong></div>
    <div class="metric"><span>Encadrement HT</span><strong>${euro(totals.encadrementHt)}</strong></div>
    <div class="metric"><span>Total HT</span><strong>${euro(totals.totalHt)}</strong></div>
    <div class="metric"><span>Total TVA</span><strong>${euro(totals.totalTva)}</strong></div>
    <div class="metric"><span>Total TTC</span><strong class="ok">${euro(totals.totalTtc)}</strong></div>
  `;
}

function renderSummary() {
  const totals = computeTotals();
  if (totals.active.length === 0) {
    els.summaryTable.innerHTML = "<p class='hint'>Aucune ligne active dans le devis.</p>";
  } else {
    els.summaryTable.innerHTML = totals.active
      .map(
        (line) => `
        <div class="summary-row">
          <div><strong>${line.trade}</strong><br />${line.label}</div>
          <div>Qte: ${line.qty}</div>
          <div>PU HT: ${euro(line.priceHt)}</div>
          <div>TVA ${line.tva}%</div>
          <div><strong>${euro(line.qty * line.priceHt)}</strong></div>
        </div>
      `
      )
      .join("");
  }

  els.summaryTotals.innerHTML = `
    <div class="metric"><span>Total HT</span><strong>${euro(totals.totalHt)}</strong></div>
    <div class="metric"><span>Total TVA</span><strong>${euro(totals.totalTva)}</strong></div>
    <div class="metric"><span>Total TTC</span><strong class="ok">${euro(totals.totalTtc)}</strong></div>
  `;

  const when = state.catalogPublishedAt || "non publie";
  els.quoteMeta.textContent = `catalog v${state.catalogVersion} - publication: ${when}`;
}

function renderAdminTable() {
  els.adminTable.innerHTML = state.catalog
    .map(
      (task) => `
      <div class="admin-row">
        <div><strong>${task.trade}</strong><br />${task.label}</div>
        <div>${task.unit}</div>
        <div><input data-action="edit-price" data-id="${task.id}" type="number" min="0" step="0.01" value="${task.priceHt}" /></div>
        <div>
          <select data-action="edit-tva" data-id="${task.id}">
            <option value="10" ${task.tva === 10 ? "selected" : ""}>10%</option>
            <option value="20" ${task.tva === 20 ? "selected" : ""}>20%</option>
          </select>
        </div>
        <button class="btn" data-action="delete-task" data-id="${task.id}">Suppr.</button>
      </div>
    `
    )
    .join("");
}

function renderAll() {
  renderSession();
  renderCatalogBadge();
  renderProperties();
  renderRooms();
  renderTaskPicker();
  renderQuoteLines();
  renderQuickTotals();
  renderSummary();
  renderAdminTable();
  els.encadrementInput.value = String(state.encadrementPct);
  els.encadrementValue.textContent = `${state.encadrementPct}%`;
}

function requireProperty() {
  if (!state.activePropertyId) {
    toast("Selectionne d'abord un bien.");
    setView("dashboard");
    return false;
  }
  return true;
}

function attachEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.view;
      if (["dossier", "chiffrage", "synthese"].includes(target) && !requireProperty()) return;
      setView(target);
    });
  });

  els.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.loginForm);
    state.session = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      role: String(data.get("role") || "Owner")
    };
    saveState();
    renderSession();
    toast("Session ouverte.");
    setView("dashboard");
  });

  els.propertyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.propertyForm);
    const property = {
      id: uid("prop"),
      address: String(data.get("address") || "").trim(),
      kind: String(data.get("kind") || "Appartement"),
      surface: Number(data.get("surface") || 0),
      status: String(data.get("status") || "A renover")
    };

    if (!property.address || property.surface <= 0) {
      toast("Renseigne une adresse et une surface valide.");
      return;
    }

    state.properties.unshift(property);
    if (!state.activePropertyId) state.activePropertyId = property.id;
    els.propertyForm.reset();
    saveState();
    renderProperties();
    toast("Bien ajoute.");
  });

  els.propertyList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== "select-property") return;
    state.activePropertyId = target.dataset.id || null;
    saveState();
    renderProperties();
    toast("Bien actif mis a jour.");
  });

  els.projectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.projectForm);
    const name = String(data.get("projectName") || "").trim();
    if (!name) {
      toast("Nom de dossier requis.");
      return;
    }
    state.project.name = name;
    saveState();
    toast("Dossier enregistre.");
  });

  els.roomForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.roomForm);
    const room = {
      id: uid("room"),
      name: String(data.get("roomName") || "").trim(),
      surface: Number(data.get("roomSurface") || 0),
      height: Number(data.get("roomHeight") || 2.4)
    };

    if (!room.name || room.surface < 0.1) {
      toast("Piece invalide.");
      return;
    }

    state.project.rooms.push(room);
    els.roomForm.reset();
    saveState();
    renderRooms();
    toast("Piece ajoutee.");
  });

  els.taskPicker.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== "add-line") return;

    const task = state.catalog.find((item) => item.id === target.dataset.id);
    if (!task) return;

    const existing = state.quoteLines.find((line) => line.taskId === task.id);
    if (existing) {
      existing.qty += 1;
    } else {
      state.quoteLines.push({
        id: uid("line"),
        taskId: task.id,
        trade: task.trade,
        label: task.label,
        unit: task.unit,
        qty: 1,
        priceHt: task.priceHt,
        tva: task.tva,
        active: true
      });
    }

    saveState();
    renderQuoteLines();
    renderQuickTotals();
    renderSummary();
  });

  els.quoteLines.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const id = target.dataset.id;
    const line = state.quoteLines.find((item) => item.id === id);
    if (!line) return;

    if (target.dataset.action === "qty") {
      line.qty = Math.max(0, Number(target.value || 0));
    }

    if (target.dataset.action === "toggle") {
      line.active = target.checked;
    }

    saveState();
    renderQuickTotals();
    renderSummary();
  });

  els.quoteLines.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== "remove-line") return;

    state.quoteLines = state.quoteLines.filter((line) => line.id !== target.dataset.id);
    saveState();
    renderQuoteLines();
    renderQuickTotals();
    renderSummary();
  });

  els.encadrementInput.addEventListener("input", () => {
    state.encadrementPct = Number(els.encadrementInput.value || 0);
    els.encadrementValue.textContent = `${state.encadrementPct}%`;
    saveState();
    renderQuickTotals();
    renderSummary();
  });

  els.exportJsonBtn.addEventListener("click", () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      session: state.session,
      activeProperty: getActiveProperty(),
      project: state.project,
      catalogVersion: state.catalogVersion,
      quoteLines: state.quoteLines,
      totals: computeTotals()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devis-avereo-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export JSON genere.");
  });

  els.printPdfBtn.addEventListener("click", () => {
    setView("synthese");
    window.print();
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.session?.role !== "Admin") {
      toast("Seul un admin peut modifier le catalogue.");
      return;
    }

    const data = new FormData(els.taskForm);
    const task = {
      id: uid("task"),
      trade: String(data.get("trade") || "").trim(),
      label: String(data.get("label") || "").trim(),
      unit: String(data.get("unit") || "m2"),
      priceHt: Number(data.get("priceHt") || 0),
      tva: Number(data.get("tva") || 20)
    };

    if (!task.trade || !task.label || task.priceHt < 0) {
      toast("Tache invalide.");
      return;
    }

    state.catalog.push(task);
    els.taskForm.reset();
    saveState();
    renderTaskPicker();
    renderAdminTable();
    toast("Tache ajoutee au catalogue.");
  });

  els.adminTable.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.dataset.id;
    const task = state.catalog.find((item) => item.id === id);
    if (!task) return;

    if (target.dataset.action === "edit-price" && target instanceof HTMLInputElement) {
      task.priceHt = Math.max(0, Number(target.value || 0));
    }

    if (target.dataset.action === "edit-tva" && target instanceof HTMLSelectElement) {
      task.tva = Number(target.value || 20);
    }

    saveState();
    renderTaskPicker();
  });

  els.adminTable.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.action !== "delete-task") return;

    const id = target.dataset.id;
    state.catalog = state.catalog.filter((item) => item.id !== id);
    state.quoteLines = state.quoteLines.filter((line) => line.taskId !== id);
    saveState();
    renderTaskPicker();
    renderQuoteLines();
    renderQuickTotals();
    renderSummary();
    renderAdminTable();
    toast("Tache supprimee.");
  });

  els.publishCatalogBtn.addEventListener("click", () => {
    if (state.session?.role !== "Admin") {
      toast("Seul un admin peut publier une version.");
      return;
    }

    state.catalogVersion += 1;
    state.catalogPublishedAt = new Date().toLocaleString("fr-FR");
    saveState();
    renderCatalogBadge();
    renderSummary();
    toast(`Catalogue publie en v${state.catalogVersion}.`);
  });
}

attachEvents();
renderAll();
setView("login");
