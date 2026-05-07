document.addEventListener("DOMContentLoaded", async () => {

  const select = document.getElementById("deviceList");
  const status = document.getElementById("status");
  const statusText = document.getElementById("statusText");

  function setStatus(type, message) {
    status.className = `status ${type}`;
    statusText.textContent = message;
    if (type === "success") {
      setTimeout(() => { status.style.display = "none"; }, 2500);
    }
  }

  setStatus("loading", "Loading devices\u2026");

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // chrome:// and edge:// pages cannot be scripted — bail early
  if (!tab || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
    setStatus("error", "Cannot run on browser system pages.");
    return;
  }

  // Inject content.js if it isn't already loaded (handles pre-existing tabs)
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  } catch (e) {
    // Already injected, or a restricted page — either way continue and try messaging
  }

  // Small delay to let the injected script initialise its message listener
  await new Promise(r => setTimeout(r, 100));

  chrome.tabs.sendMessage(tab.id, { type: "GET_DEVICES" }, (devices) => {

    if (chrome.runtime.lastError || !devices) {
      setStatus("error", "Could not read audio devices.");
      return;
    }

    if (devices.length === 0) {
      setStatus("error", "No audio output devices found.");
      return;
    }

    status.style.display = "none";

    devices.forEach(device => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      // Strip hex IDs in parentheses e.g. "Speakers (Realtek(R) Audio)"
      option.textContent = device.label.replace(/\s*\(.*?\)\s*/g, "").trim() || "Unknown Device";
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      setStatus("loading", "Switching audio output\u2026");

      chrome.tabs.sendMessage(tab.id, {
        type: "SET_DEVICE",
        deviceId: select.value
      }, () => {
        if (chrome.runtime.lastError) {
          setStatus("error", "Failed to switch audio.");
        } else {
          setStatus("success", "Audio output switched!");
        }
      });
    });

  });

});