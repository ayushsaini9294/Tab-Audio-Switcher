// background.js — auto-apply saved device on page load

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const restricted = ["chrome://", "edge://", "about:", "chrome-extension://"];
  if (restricted.some(p => tab.url.startsWith(p))) return;

  let domain;
  try { domain = new URL(tab.url).hostname; } catch { return; }
  if (!domain) return;

  const { prefs = {} } = await chrome.storage.local.get("prefs");
  const pref = prefs[domain];
  if (!pref?.deviceId) return;

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  } catch { return; }

  await new Promise(r => setTimeout(r, 300));

  chrome.tabs.sendMessage(tabId, { type: "SET_DEVICE", deviceId: pref.deviceId }, () => {
    void chrome.runtime.lastError; // silence
  });
});
