document.addEventListener("DOMContentLoaded", async () => {

  let [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(tab.id, { type: "GET_DEVICES" }, (devices) => {

    const select = document.getElementById("deviceList");

    devices.forEach(device => {
      let option = document.createElement("option");
      option.value = device.deviceId;

      // Clean device name
      option.textContent = device.label.replace(/\(.*\)/, "") || "Unknown Device";

      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      chrome.tabs.sendMessage(tab.id, {
        type: "SET_DEVICE",
        deviceId: select.value
      });
    });

  });

});