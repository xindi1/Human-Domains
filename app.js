const STORAGE_KEY = "human-domains-entries-v1";

let entries = loadEntries();
let deferredPrompt = null;

const DOMAIN_COLORS = {
  Air: "air",
  Land: "land",
  Sea: "sea",
  Space: "space"
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  setDefaultDateTime();
  renderAll();
  registerServiceWorker();
});

function bindEvents() {
  const entryDialog = $("#entryDialog");
  const entriesDialog = $("#entriesDialog");
  const statsDialog = $("#statsDialog");

  $("#quickAddBtn").addEventListener("click", () => openEntryDialog());
  $("#viewAllBtn").addEventListener("click", () => openEntriesDialog());
  $("#installBtn").addEventListener("click", installApp);

  $$(".domain-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const domain = tile.dataset.domain;
      openEntriesDialog(domain);
    });
  });

  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveNav(btn.dataset.openPanel);

      if (btn.dataset.openPanel === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (btn.dataset.openPanel === "allEntries") openEntriesDialog();
      if (btn.dataset.openPanel === "stats") openStatsDialog();
      if (btn.dataset.openPanel === "addEdit") openEntryDialog();
    });
  });

  $("#entryForm").addEventListener("submit", handleSaveEntry);
  $("#resetBtn").addEventListener("click", resetForm);
  $("#closeDialogBtn").addEventListener("click", () => entryDialog.close());
  $("#closeEntriesDialogBtn").addEventListener("click", () => entriesDialog.close());
  $("#closeStatsDialogBtn").addEventListener("click", () => statsDialog.close());

  $("#domain").addEventListener("change", toggleDomainSpecificFields);

  $("#filterDomain").addEventListener("change", renderEntriesList);
  $("#filterActivity").addEventListener("input", renderEntriesList);
  $("#filterDate").addEventListener("change", renderEntriesList);
  $("#clearFiltersBtn").addEventListener("click", clearFilters);

  $("#exportBtn").addEventListener("click", exportJSON);
  $("#importInput").addEventListener("change", importJSON);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    $("#installBtn").classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    $("#installBtn").classList.add("hidden");
  });

  entryDialog.addEventListener("click", (e) => {
    const rect = entryDialog.getBoundingClientRect();
    const clickedInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!clickedInDialog) entryDialog.close();
  });

  entriesDialog.addEventListener("click", (e) => {
    const rect = entriesDialog.getBoundingClientRect();
    const clickedInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!clickedInDialog) entriesDialog.close();
  });

  statsDialog.addEventListener("click", (e) => {
    const rect = statsDialog.getBoundingClientRect();
    const clickedInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!clickedInDialog) statsDialog.close();
  });
}

function setDefaultDateTime() {
  const now = new Date();
  $("#date").value = formatDateInput(now);
  $("#time").value = formatTimeInput(now);
}

function openEntryDialog(entry = null) {
  $("#formTitle").textContent = entry ? "Edit Entry" : "Add Entry";
  if (entry) {
    populateForm(entry);
  } else {
    resetForm();
    setDefaultDateTime();
  }
  $("#entryDialog").showModal();
}

function openEntriesDialog(domain = "") {
  $("#entriesModalTitle").textContent = domain ? `${domain} Entries` : "All Entries";
  $("#filterDomain").value = domain;
  $("#filterActivity").value = "";
  $("#filterDate").value = "";
  renderEntriesList();
  $("#entriesDialog").showModal();
}

function openStatsDialog() {
  renderStats();
  $("#statsDialog").showModal();
}

function handleSaveEntry(e) {
  e.preventDefault();

  const formData = collectFormData();
  if (!formData) return;

  const existingIndex = entries.findIndex((item) => item.id === formData.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = formData;
  } else {
    entries.unshift(formData);
  }

  saveEntries();
  renderAll();
  $("#entryDialog").close();
}

function collectFormData() {
  const id = $("#entryId").value || crypto.randomUUID();
  const date = $("#date").value;
  const time = $("#time").value;
  const domain = $("#domain").value;
  const activityTitle = $("#activityTitle").value.trim();
  const duration = Number($("#duration").value);
  const intensity = Number($("#intensity").value);
  const regulationEffect = $("#regulationEffect").value;
  const adaptiveDemand = $("#adaptiveDemand").value;
  const notes = $("#notes").value.trim();
  const favorite = $("#favorite").checked;

  if (!date || !time || !domain || !activityTitle || !duration || !intensity || !regulationEffect || !adaptiveDemand) {
    alert("Please complete all required fields.");
    return null;
  }

  const entry = {
    id,
    date,
    time,
    domain,
    activityTitle,
    duration,
    intensity,
    regulationEffect,
    adaptiveDemand,
    notes,
    favorite,
    createdAt: new Date().toISOString(),
    domainDetails: getDomainSpecificData(domain)
  };

  return entry;
}

function getDomainSpecificData(domain) {
  if (domain === "Air") {
    return {
      altitudeHeight: $("#airAltitude").value.trim(),
      composureFearLevel: $("#airFear").value.trim(),
      orientationNotes: $("#airOrientation").value.trim()
    };
  }

  if (domain === "Land") {
    return {
      indoorOutdoor: $("#landSetting").value,
      terrainType: $("#landTerrain").value.trim(),
      movementType: $("#landMovementType").value.trim()
    };
  }

  if (domain === "Sea") {
    return {
      waterType: $("#seaWaterType").value,
      distance: $("#seaDistance").value.trim(),
      waterTemperature: $("#seaWaterTemp").value.trim(),
      gearSuit: $("#seaGear").value.trim(),
      bodyFeel: $("#seaBodyFeel").value.trim()
    };
  }

  if (domain === "Space") {
    return {
      gravityContext: $("#spaceGravityContext").value,
      orientationChallenge: $("#spaceOrientationChallenge").value.trim(),
      coordinationDemand: $("#spaceCoordinationDemand").value
    };
  }

  return {};
}

function populateForm(entry) {
  $("#entryId").value = entry.id;
  $("#date").value = entry.date || "";
  $("#time").value = entry.time || "";
  $("#domain").value = entry.domain || "";
  $("#activityTitle").value = entry.activityTitle || "";
  $("#duration").value = entry.duration || "";
  $("#intensity").value = String(entry.intensity || "");
  $("#regulationEffect").value = entry.regulationEffect || "";
  $("#adaptiveDemand").value = entry.adaptiveDemand || "";
  $("#notes").value = entry.notes || "";
  $("#favorite").checked = !!entry.favorite;

  clearDomainFields();
  toggleDomainSpecificFields();

  const d = entry.domainDetails || {};
  if (entry.domain === "Air") {
    $("#airAltitude").value = d.altitudeHeight || "";
    $("#airFear").value = d.composureFearLevel || "";
    $("#airOrientation").value = d.orientationNotes || "";
  }
  if (entry.domain === "Land") {
    $("#landSetting").value = d.indoorOutdoor || "";
    $("#landTerrain").value = d.terrainType || "";
    $("#landMovementType").value = d.movementType || "";
  }
  if (entry.domain === "Sea") {
    $("#seaWaterType").value = d.waterType || "";
    $("#seaDistance").value = d.distance || "";
    $("#seaWaterTemp").value = d.waterTemperature || "";
    $("#seaGear").value = d.gearSuit || "";
    $("#seaBodyFeel").value = d.bodyFeel || "";
  }
  if (entry.domain === "Space") {
    $("#spaceGravityContext").value = d.gravityContext || "";
    $("#spaceOrientationChallenge").value = d.orientationChallenge || "";
    $("#spaceCoordinationDemand").value = d.coordinationDemand || "";
  }
}

function resetForm() {
  $("#entryForm").reset();
  $("#entryId").value = "";
  $("#formTitle").textContent = "Add Entry";
  clearDomainFields();
  toggleDomainSpecificFields();
  setDefaultDateTime();
}

function clearDomainFields() {
  $("#airAltitude").value = "";
  $("#airFear").value = "";
  $("#airOrientation").value = "";

  $("#landSetting").value = "";
  $("#landTerrain").value = "";
  $("#landMovementType").value = "";

  $("#seaWaterType").value = "";
  $("#seaDistance").value = "";
  $("#seaWaterTemp").value = "";
  $("#seaGear").value = "";
  $("#seaBodyFeel").value = "";

  $("#spaceGravityContext").value = "";
  $("#spaceOrientationChallenge").value = "";
  $("#spaceCoordinationDemand").value = "";
}

function toggleDomainSpecificFields() {
  const domain = $("#domain").value;
  const section = $("#domainSpecificSection");

  ["airFields", "landFields", "seaFields", "spaceFields"].forEach((id) => {
    $(`#${id}`).classList.add("hidden");
  });

  if (!domain) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");

  if (domain === "Air") $("#airFields").classList.remove("hidden");
  if (domain === "Land") $("#landFields").classList.remove("hidden");
  if (domain === "Sea") $("#seaFields").classList.remove("hidden");
  if (domain === "Space") $("#spaceFields").classList.remove("hidden");
}

function renderAll() {
  renderDashboard();
  renderRecentList();
  renderChart();
  renderEntriesList();
  renderStats();
}

function renderDashboard() {
  $("#totalEntries").textContent = entries.length;

  const counts = getDomainCounts();
  ["Air", "Land", "Sea", "Space"].forEach((domain) => {
    const countEl = document.getElementById(`count-${domain}`);
    if (countEl) countEl.textContent = `${counts[domain] || 0} entr${counts[domain] === 1 ? "y" : "ies"}`;
  });

  $("#mostActiveDomain").textContent = getMostActiveDomain(counts) || "—";
  $("#recentSessions").textContent = entries.slice(0, 7).length;
  $("#favoriteActivity").textContent = getFavoriteActivity() || "—";
}

function renderRecentList() {
  const list = $("#recentList");
  list.innerHTML = "";

  const recent = sortEntries(entries).slice(0, 5);

  if (!recent.length) {
    list.innerHTML = `<div class="empty-state">No entries yet. Add your first movement session.</div>`;
    return;
  }

  recent.forEach((entry) => list.appendChild(createEntryCard(entry)));
}

function renderEntriesList() {
  const list = $("#allEntriesList");
  if (!list) return;

  const domain = $("#filterDomain")?.value || "";
  const activity = ($("#filterActivity")?.value || "").trim().toLowerCase();
  const date = $("#filterDate")?.value || "";

  let filtered = [...entries];

  if (domain) filtered = filtered.filter((e) => e.domain === domain);
  if (activity) filtered = filtered.filter((e) => e.activityTitle.toLowerCase().includes(activity));
  if (date) filtered = filtered.filter((e) => e.date === date);

  filtered = sortEntries(filtered);

  list.innerHTML = "";
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No entries match your current filters.</div>`;
    return;
  }

  filtered.forEach((entry) => list.appendChild(createEntryCard(entry)));
}

function createEntryCard(entry) {
  const template = $("#entryCardTemplate");
  const node = template.content.firstElementChild.cloneNode(true);

  const chip = node.querySelector(".domain-chip");
  chip.textContent = entry.domain;
  chip.classList.add(DOMAIN_COLORS[entry.domain]?.toLowerCase() || "");

  const favoriteChip = node.querySelector(".favorite-chip");
  if (entry.favorite) {
    favoriteChip.classList.remove("hidden");
  } else {
    favoriteChip.classList.add("hidden");
  }

  node.querySelector(".entry-title").textContent = entry.activityTitle;
  node.querySelector(".entry-meta").textContent =
    `${entry.date} • ${entry.time} • ${entry.duration} min • Intensity ${entry.intensity}`;

  const grid = node.querySelector(".entry-data-grid");
  const data = buildEntryData(entry);
  data.forEach((item) => {
    const pill = document.createElement("div");
    pill.className = "data-pill";
    pill.innerHTML = `<span class="label">${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong>`;
    grid.appendChild(pill);
  });

  const notesEl = node.querySelector(".entry-notes");
  if (entry.notes) {
    notesEl.classList.remove("hidden");
    notesEl.textContent = entry.notes;
  }

  node.querySelector(".edit-btn").addEventListener("click", () => openEntryDialog(entry));
  node.querySelector(".delete-btn").addEventListener("click", () => deleteEntry(entry.id));

  return node;
}

function buildEntryData(entry) {
  const shared = [
    { label: "Regulation", value: entry.regulationEffect },
    { label: "Adaptive Demand", value: entry.adaptiveDemand }
  ];

  const d = entry.domainDetails || {};

  if (entry.domain === "Air") {
    maybePush(shared, "Altitude / Height", d.altitudeHeight);
    maybePush(shared, "Fear Level", d.composureFearLevel);
    maybePush(shared, "Orientation", d.orientationNotes);
  }

  if (entry.domain === "Land") {
    maybePush(shared, "Setting", d.indoorOutdoor);
    maybePush(shared, "Terrain", d.terrainType);
    maybePush(shared, "Movement Type", d.movementType);
  }

  if (entry.domain === "Sea") {
    maybePush(shared, "Water Type", d.waterType);
    maybePush(shared, "Distance", d.distance);
    maybePush(shared, "Water Temp", d.waterTemperature);
    maybePush(shared, "Gear / Suit", d.gearSuit);
    maybePush(shared, "Body Feel", d.bodyFeel);
  }

  if (entry.domain === "Space") {
    maybePush(shared, "Gravity Context", d.gravityContext);
    maybePush(shared, "Orientation Challenge", d.orientationChallenge);
    maybePush(shared, "Coordination Demand", d.coordinationDemand);
  }

  return shared;
}

function maybePush(arr, label, value) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    arr.push({ label, value: String(value) });
  }
}

function renderChart() {
  const chart = $("#chartArea");
  chart.innerHTML = "";

  const recent = sortEntries(entries).slice(0, 8).reverse();

  if (!recent.length) {
    chart.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">No chart data yet.</div>`;
    return;
  }

  const maxDuration = Math.max(...recent.map((e) => Number(e.duration) || 0), 1);

  recent.forEach((entry) => {
    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";

    const bar = document.createElement("div");
    bar.className = `chart-bar ${DOMAIN_COLORS[entry.domain]?.toLowerCase() || ""}`;
    bar.style.height = `${Math.max(18, (entry.duration / maxDuration) * 110)}px`;
    bar.title = `${entry.activityTitle} — ${entry.duration} min`;

    const label = document.createElement("div");
    label.className = "chart-label";
    label.textContent = entry.domain.slice(0, 1);

    wrap.appendChild(bar);
    wrap.appendChild(label);
    chart.appendChild(wrap);
  });
}

function renderStats() {
  const statsGrid = $("#statsGrid");
  if (!statsGrid) return;

  statsGrid.innerHTML = "";

  const domains = ["Air", "Land", "Sea", "Space"];
  domains.forEach((domain) => {
    const subset = entries.filter((e) => e.domain === domain);
    const totalDuration = subset.reduce((sum, e) => sum + (Number(e.duration) || 0), 0);
    const avgIntensity = subset.length
      ? (subset.reduce((sum, e) => sum + (Number(e.intensity) || 0), 0) / subset.length).toFixed(1)
      : "0.0";

    const topActivity = getTopActivityForDomain(domain) || "—";

    const card = document.createElement("article");
    card.className = "stats-card glass-subtle";
    card.innerHTML = `
      <h4 class="stats-domain-name">${domain}</h4>
      <div class="stats-line"><span>Entries</span><strong>${subset.length}</strong></div>
      <div class="stats-line"><span>Total Minutes</span><strong>${totalDuration}</strong></div>
      <div class="stats-line"><span>Avg Intensity</span><strong>${avgIntensity}</strong></div>
      <div class="stats-line"><span>Top Activity</span><strong>${escapeHtml(topActivity)}</strong></div>
    `;
    statsGrid.appendChild(card);
  });
}

function deleteEntry(id) {
  const target = entries.find((e) => e.id === id);
  if (!target) return;

  const confirmed = confirm(`Delete "${target.activityTitle}"?`);
  if (!confirmed) return;

  entries = entries.filter((e) => e.id !== id);
  saveEntries();
  renderAll();
}

function clearFilters() {
  $("#filterDomain").value = "";
  $("#filterActivity").value = "";
  $("#filterDate").value = "";
  renderEntriesList();
}

function exportJSON() {
  const payload = {
    app: "Human Domains",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `human-domains-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);

      let importedEntries = [];
      if (Array.isArray(parsed)) {
        importedEntries = parsed;
      } else if (Array.isArray(parsed.entries)) {
        importedEntries = parsed.entries;
      } else {
        throw new Error("Invalid format");
      }

      const normalized = importedEntries
        .filter((item) => item && item.domain && item.activityTitle)
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          date: item.date || formatDateInput(new Date()),
          time: item.time || "12:00",
          domain: item.domain,
          activityTitle: item.activityTitle,
          duration: Number(item.duration) || 0,
          intensity: Number(item.intensity) || 1,
          regulationEffect: item.regulationEffect || "Neutral",
          adaptiveDemand: item.adaptiveDemand || "Low",
          notes: item.notes || "",
          favorite: !!item.favorite,
          createdAt: item.createdAt || new Date().toISOString(),
          domainDetails: item.domainDetails || {}
        }));

      entries = sortEntries([...normalized, ...entries]).filter(
        (entry, index, arr) => index === arr.findIndex((e) => e.id === entry.id)
      );

      saveEntries();
      renderAll();
      alert("Import complete.");
    } catch (error) {
      alert("Unable to import JSON. Please use a valid Human Domains JSON file.");
    } finally {
      event.target.value = "";
    }
  };

  reader.readAsText(file);
}

async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("#installBtn").classList.add("hidden");
}

function getDomainCounts() {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.domain] = (acc[entry.domain] || 0) + 1;
      return acc;
    },
    { Air: 0, Land: 0, Sea: 0, Space: 0 }
  );
}

function getMostActiveDomain(counts = getDomainCounts()) {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length || sorted[0][1] === 0) return "";
  return sorted[0][0];
}

function getFavoriteActivity() {
  const favorites = entries.filter((e) => e.favorite);
  if (!favorites.length) return "";

  const counts = {};
  favorites.forEach((e) => {
    counts[e.activityTitle] = (counts[e.activityTitle] || 0) + 1;
  });

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function getTopActivityForDomain(domain) {
  const subset = entries.filter((e) => e.domain === domain);
  if (!subset.length) return "";

  const counts = {};
  subset.forEach((e) => {
    counts[e.activityTitle] = (counts[e.activityTitle] || 0) + 1;
  });

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function sortEntries(list) {
  return [...list].sort((a, b) => {
    const aValue = `${a.date}T${a.time}`;
    const bValue = `${b.date}T${b.time}`;
    return new Date(bValue) - new Date(aValue);
  });
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedEntries();
  } catch {
    return seedEntries();
  }
}

function seedEntries() {
  return [
    {
      id: crypto.randomUUID(),
      date: todayMinus(1),
      time: "07:10",
      domain: "Land",
      activityTitle: "Hill Walk + Mobility",
      duration: 42,
      intensity: 3,
      regulationEffect: "Regulating",
      adaptiveDemand: "Medium",
      notes: "Steady incline. Good leg warmth. Mobility felt cleaner after first 10 minutes.",
      favorite: true,
      createdAt: new Date().toISOString(),
      domainDetails: {
        indoorOutdoor: "Outdoor",
        terrainType: "Hillside pavement",
        movementType: "Walking + mobility"
      }
    },
    {
      id: crypto.randomUUID(),
      date: todayMinus(2),
      time: "12:30",
      domain: "Sea",
      activityTitle: "Pool Swim Intervals",
      duration: 36,
      intensity: 4,
      regulationEffect: "Energizing",
      adaptiveDemand: "High",
      notes: "Breathing rhythm improved. Felt buoyant and focused.",
      favorite: false,
      createdAt: new Date().toISOString(),
      domainDetails: {
        waterType: "Pool",
        distance: "1200 m",
        waterTemperature: "78°F",
        gearSuit: "Goggles",
        bodyFeel: "Smooth and strong"
      }
    }
  ];
}

function todayMinus(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDateInput(d);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeInput(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function setActiveNav(name) {
  $$(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.openPanel === name);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  }
}