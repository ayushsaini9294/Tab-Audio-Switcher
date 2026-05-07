// Guard against duplicate injection (popup injects this into pre-existing tabs)
if (typeof window.__audioSwitcherLoaded === "undefined") {
  window.__audioSwitcherLoaded = true;

  let devices = [];

  async function getAudioDevices() {
    try {
      // Request temporary mic permission to unlock device labels
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.log("[AudioSwitcher] Permission denied:", err);
    }

    const allDevices = await navigator.mediaDevices.enumerateDevices();

    devices = allDevices.filter(d => {
      if (d.kind !== "audiooutput") return false;
      const name = d.label.toLowerCase();
      // Filter out communication / hands-free profiles
      if (name.includes("communication")) return false;
      if (name.includes("hands-free")) return false;
      if (name.includes("headset")) return false;
      return true;
    });

    return devices;
  }

  async function setOutput(deviceId) {
    const mediaElements = document.querySelectorAll("audio, video");
    for (let media of mediaElements) {
      if (typeof media.setSinkId === "function") {
        try {
          await media.setSinkId(deviceId);
        } catch (e) {
          console.warn("[AudioSwitcher] setSinkId failed:", e);
        }
      }
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.type === "GET_DEVICES") {
      getAudioDevices().then(d => sendResponse(d));
      return true; // keep channel open for async response
    }

    if (request.type === "SET_DEVICE") {
      setOutput(request.deviceId).then(() => sendResponse({ ok: true }));
      return true;
    }

  });
}