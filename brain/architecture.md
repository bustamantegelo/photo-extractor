# System Architecture: Electron + React Application

This document outlines the architectural design, process isolation strategy, and security model for the Electron and React desktop application.

---

## 1. High-Level Process Architecture

The application is split into two distinct execution environments to guarantee security, performance, and native OS capabilities.

```
       +-------------------------------------------------+
       |                  MAIN PROCESS                   |
       |  - Node.js Environment (Native OS Access)       |
       |  - Window Lifecycle & Native Menus              |
       |  - File System, Network, & Database Access      |
       +-------------------------------------------------+
                                |
                   IPC (Inter-Process Comm) via
                   Channels & contextBridge
                                |
                                v
       +-------------------------------------------------+
       |                 PRELOAD SCRIPT                  |
       |  - Polyfill / Secure Gateway                    |
       |  - Exposes highly explicit APIs to Renderer     |
       +-------------------------------------------------+
                                |
                                v
       +-------------------------------------------------+
       |                RENDERER PROCESS                 |
       |  - Chromium UI / React Single Page App          |
       |  - Strictly isolated from Node.js (Security)     |
       |  - Handles User Layout, State, and Interactivity|
       +-------------------------------------------------+
```

### Process Breakdown

| Process              | Environment      | Responsibilities                                                                                                  | Security Posture                                                                                |
| :------------------- | :--------------- | :---------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Main Process**     | Node.js          | Lifecycle management, native menu orchestration, auto-updates, direct file system/hardware interfacing.           | Full system access. Must never trust input from the renderer implicitly.                        |
| **Preload Script**   | Mixed (Shared)   | Exposing select Node.js features to the Renderer via standard IPC mechanisms (`contextBridge.exposeInMainWorld`). | Gatekeeper. Validates channel names and arguments before passing messages.                      |
| **Renderer Process** | Chromium Browser | UI rendering, user interaction, React local & global state management.                                            | Low privilege. Completely sandboxed with `nodeIntegration: false` and `contextIsolation: true`. |

---

## 2. Security Matrix & Hardening

To mitigate Remote Code Execution (RCE) vulnerabilities, the following constraints must be strictly adhered to in `main.js`:

```javascript
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true, // Protects execution contexts
    nodeIntegration: false, // Disables raw Node APIs in React
    sandbox: true, // Runs renderer inside Chromium sandbox
    preload: path.join(__dirname, "preload.js"),
  },
});
```

- **Context Isolation:** Enabled by default. This forces the preload script and renderer UI to run in distinct context worlds.
- **Content Security Policy (CSP):** A strict CSP must be injected into header requests or meta tags to prevent unauthorized cross-site scripting (XSS) scripts from loading external untrusted execution flows.

---

## 3. Directory Layout

```text
my-electron-react-app/
├── electron/                 # Main Process Layer
│   ├── main.js               # Application lifecycle entrypoint
│   └── preload.js            # Secure IPC bridge declaration
├── src/                      # Renderer UI Layer (React Single Page App)
│   ├── assets/               # Static resources (images, fonts)
│   ├── components/           # Reusable presentational components (Buttons, Modals)
│   ├── hooks/                # Custom React hooks (abstracting IPC wrappers)
│   ├── pages/                # View-level container pages (Dashboard, Settings)
│   ├── services/             # API layer, abstracting internal IPC vs external fetch
│   ├── store/                # Shared global state (Zustand / Redux / Context)
│   ├── App.jsx               # UI initialization framework
│   └── main.jsx              # React DOM mounting entry point
├── dist/                     # Production production-ready bundles
├── forge.config.js           # Distribution packaging rules (Electron Forge)
├── package.json              # Bundling targets, scripts, and runtime packages
└── vite.config.js            # Fast HMR local bundler definition
```

---

## 4. Inter-Process Communication (IPC) Dataflow

Data exchange between React and the Main Process must use explicit one-way (`ipcRenderer.send`) or two-way (`ipcRenderer.invoke`) flows. Raw wildcard messaging is forbidden.

### Step 1: Gateway Definition (`electron/preload.js`)

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  readFile: (filePath) => ipcRenderer.invoke("file:read", filePath),
  onUpdateProgress: (callback) =>
    ipcRenderer.on("download:progress", (event, value) => callback(value)),
});
```

### Step 2: Main Event Handler (`electron/main.js`)

```javascript
const { ipcMain, dialog } = require("electron");
const fs = require("fs/promises");

ipcMain.handle("file:read", async (event, filePath) => {
  // Always sanitize inputs before acting on native calls
  const safePath = sanitizePath(filePath);
  return await fs.readFile(safePath, "utf-8");
});
```

### Step 3: View Consumption Layer (`src/hooks/useFileSystem.js`)

```javascript
import { useState } from "react";

export function useFileSystem() {
  const [loading, setLoading] = useState(false);

  const loadFile = async (targetPath) => {
    setLoading(true);
    try {
      // Accessible safely via window global injected by contextBridge
      const data = await window.electronAPI.readFile(targetPath);
      return data;
    } finally {
      setLoading(false);
    }
  };

  return { loadFile, loading };
}
```

---

## 5. Build, Bundling, & Packaging Pipeline

1. **Development (HMR):** Vite starts a local dev-server for the React UI. Electron boots and directs its `BrowserWindow` load target to the localhost address (`http://localhost:5173`).
2. **Production Compilation:** React compiles standard HTML/JS/CSS assets via `vite build` into a static distribution output (`/dist`).
3. **Distribution Assembly:** Electron Forge packages the compiled `/dist` directory alongside the `/electron` main scripts inside a localized application wrapper (`.app`, `.exe`, `.deb`).

## 6. Photo Capture Time

Photo scanning runs in the Electron main process. It preserves filesystem `createdAt` and `modifiedAt` metadata, and resolves a separate `takenAt` value per photo:

1. Read EXIF `DateTimeOriginal` when it is present and valid.
2. Fall back to filesystem creation time when the EXIF value is missing or unreadable.

Extraction-name time ranges use the earliest and latest resolved `takenAt` values. The renderer receives the resolved timestamp and whether its source was EXIF or filesystem fallback through the typed photo model; it does not read image metadata directly.

## 7. Single-Page Extraction and Transfer

The renderer keeps source/destination selection, photo scan results, zone and photographer assignment, generated-name preview, duplicate policy, and copy/move controls on one page. Scanning reveals the remaining batch details in place instead of navigating through separate steps.

The main process emits per-file progress for copy and move operations, including the processed count, current filename, percentage, and estimated remaining duration. The renderer displays the estimated completion clock time from that duration.

After a successful copy, the main process removes that photo's source file. A move removes the source file through the move operation. Skipped and failed files remain untouched. The selected source directory is removed only when it is empty; directory removal is non-recursive.
