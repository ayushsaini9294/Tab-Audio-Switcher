let devices = [];

async function getAudioDevices() {

  try {
    // Ask temporary audio permission
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.log("Permission denied:", err);
  }

  const allDevices = await navigator.mediaDevices.enumerateDevices();
  // const devices = allDevices.filter(d => d.kind === "audiooutput");
  devices = allDevices.filter(d => {
  if (d.kind !== "audiooutput") return false;

  const name = d.label.toLowerCase();

  // remove communication / hands-free devices
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
      await media.setSinkId(deviceId);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.type === "GET_DEVICES") {
    getAudioDevices().then(d => sendResponse(d));
    return true;
  }

  if (request.type === "SET_DEVICE") {
    setOutput(request.deviceId);
  }

});