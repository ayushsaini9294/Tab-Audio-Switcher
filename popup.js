document.addEventListener("DOMContentLoaded", async () => {

  // ─── DOM refs ───
  const tabListEl       = document.getElementById("tabList");
  const tabCountEl      = document.getElementById("tabCount");
  const deviceSelect    = document.getElementById("deviceList");
  const statusEl        = document.getElementById("status");
  const statusTextEl    = document.getElementById("statusText");
  const controllingEl   = document.getElementById("controllingTitle");
  const deviceSectionEl = document.getElementById("deviceSection");
  const saveInfoEl      = document.getElementById("saveInfo");

  let currentTab = null;
  let prefs = {};

  // ─── Helpers ───

  function setStatus(type, msg) {
    statusEl.className = `status ${type}`;
    statusTextEl.textContent = msg;
    statusEl.style.display = "flex";
    if (type === "success") setTimeout(() => { statusEl.style.display = "none"; }, 2500);
  }

  function getDomain(url) {
    try { return new URL(url).hostname; } catch { return ""; }
  }

  function isRestricted(url) {
    if (!url) return true;
    return ["chrome://", "edge://", "about:", "chrome-extension://"].some(p => url.startsWith(p));
  }

  // ─── Load prefs from storage ───
  const stored = await chrome.storage.local.get("prefs");
  prefs = stored.prefs || {};

  // ─── Load all tabs ───
  const allTabs = await chrome.tabs.query({});
  tabCountEl.textContent = allTabs.length;

  // ─── Render tab list ───
  function renderTabList() {
    tabListEl.innerHTML = "";

    allTabs.forEach(tab => {
      const domain = getDomain(tab.url || "");
      const savedPref = prefs[domain];

      const row = document.createElement("div");
      row.className = "tab-row" + (currentTab && tab.id === currentTab.id ? " selected" : "");
      row.dataset.tabId = String(tab.id);

      // Favicon
      const favicon = document.createElement("img");
      favicon.className = "tab-favicon";
      favicon.src = tab.favIconUrl || "icons/icon16.png";
      favicon.onerror = () => { favicon.src = "icons/icon16.png"; };

      // Title
      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = tab.title || "Untitled";
      title.title = tab.title || "";

      // Audio bars
      const bars = document.createElement("div");
      bars.className = "audio-bars" + (tab.audible ? " playing" : "");
      bars.innerHTML = "<span></span><span></span><span></span>";

      // Saved device badge
      const badge = document.createElement("span");
      badge.className = "tab-badge" + (savedPref ? " show" : "");
      badge.textContent = savedPref ? savedPref.label : "";

      row.append(favicon, title, bars, badge);
      row.addEventListener("click", () => selectTab(tab));
      tabListEl.appendChild(row);
    });
  }

  // ─── Select a tab to control ───
  async function selectTab(tab) {
    currentTab = tab;

    // Highlight selected row
    tabListEl.querySelectorAll(".tab-row").forEach(r => {
      r.classList.toggle("selected", r.dataset.tabId === String(tab.id));
    });

    controllingEl.textContent = tab.title || "Untitled";

    if (isRestricted(tab.url)) {
      deviceSelect.innerHTML = "";
      deviceSectionEl.style.display = "block";
      setStatus("error", "Cannot control browser system pages.");
      return;
    }

    // Show saved badge in footer
    const domain = getDomain(tab.url);
    saveInfoEl.className = "save-info" + (prefs[domain] ? " show" : "");

    await loadDevicesForTab(tab);
  }

  // ─── Load audio devices for a tab ───
  async function loadDevicesForTab(tab) {
    deviceSelect.innerHTML = "";
    setStatus("loading", "Loading devices…");

    // Inject content script (guard in content.js prevents double-run)
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    } catch { /* restricted or already injected */ }

    await new Promise(r => setTimeout(r, 120));

    chrome.tabs.sendMessage(tab.id, { type: "GET_DEVICES" }, (devices) => {
      if (chrome.runtime.lastError || !devices) {
        setStatus("error", "Could not read audio devices.");
        return;
      }
      if (devices.length === 0) {
        setStatus("error", "No audio output devices found.");
        return;
      }

      statusEl.style.display = "none";

      const domain = getDomain(tab.url || "");
      const savedId = prefs[domain]?.deviceId;

      devices.forEach(device => {
        const opt = document.createElement("option");
        opt.value = device.deviceId;
        opt.textContent = device.label.replace(/\s*\(.*?\)\s*/g, "").trim() || "Unknown Device";
        if (device.deviceId === savedId) opt.selected = true;
        deviceSelect.appendChild(opt);
      });
    });
  }

  // ─── Device change → switch + save ───
  deviceSelect.addEventListener("change", () => {
    if (!currentTab) return;

    setStatus("loading", "Switching audio output…");

    const deviceId = deviceSelect.value;
    const label = deviceSelect.options[deviceSelect.selectedIndex]?.textContent || "";

    chrome.tabs.sendMessage(currentTab.id, { type: "SET_DEVICE", deviceId }, () => {
      if (chrome.runtime.lastError) {
        setStatus("error", "Failed to switch audio.");
        return;
      }

      setStatus("success", "Audio output switched!");

      // Persist preference
      const domain = getDomain(currentTab.url || "");
      if (domain) {
        prefs[domain] = { deviceId, label };
        chrome.storage.local.set({ prefs });
        saveInfoEl.className = "save-info show";
        renderTabList(); // refresh badges
      }
    });
  });

  // ─── Init: render list, select active tab ───
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  renderTabList();
  if (activeTab) await selectTab(activeTab);
});