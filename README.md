# Tab Audio Switcher

> A Chrome Extension that lets you switch audio output per browser tab — no system settings required.

## ✨ Features

- 🔊 Switch audio output device for any tab (speakers, headphones, etc.)
- 🧹 Filters out communication/hands-free devices for a clean list
- 💜 Minimal, premium dark-mode UI
- ⚡ Zero external dependencies, pure MV3 Chrome Extension

---

## 🗂 Project Structure

```
extension/
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── content.js        # Injected into all pages — handles device enumeration & setSinkId
├── manifest.json     # Extension manifest (MV3)
├── popup.html        # Extension popup UI
├── popup.js          # Popup logic
├── build.ps1         # PowerShell build script → creates release.zip
└── README.md
```

---

## 🚀 Local Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. Click the extension icon in the toolbar — done!

---

## 📦 Build for Chrome Web Store

Run the PowerShell build script to produce a `release.zip`:

```powershell
.\build.ps1
```

This creates `release.zip` containing all required files, ready to upload to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## 🛠 How It Works

| File | Role |
|------|------|
| `content.js` | Injected into every page. Enumerates `audiooutput` devices via `navigator.mediaDevices` and applies `setSinkId()` to all `<audio>` and `<video>` elements. |
| `popup.js` | Queries the active tab, asks `content.js` for devices, and sends `SET_DEVICE` messages on selection change. |
| `manifest.json` | MV3 manifest declaring permissions, icons, popup, and content scripts. |

---

## ⚠️ Known Limitations

- `setSinkId()` requires HTTPS pages (or `localhost`). It won't work on `http://` pages.
- Device labels are only available after `getUserMedia` has been granted.
- The extension cannot reroute audio from browser-internal pages (`chrome://`, `edge://`, etc.).

---

## 📄 License

MIT
