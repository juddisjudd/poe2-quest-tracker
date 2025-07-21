import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
} from "electron";
import * as path from "path";
import { isDev } from "./utils";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isVisible = true;

const createWindow = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  console.log("Creating window...");
  console.log("Screen width:", width);
  console.log("Window position will be:", width - 420, 20);

  mainWindow = new BrowserWindow({
    width: 550,
    height: 700,
    x: width - 570,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  console.log("Window created, bounds:", mainWindow.getBounds());

  const isDevelopment = isDev();

  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const rendererPath = path.join(__dirname, "../../renderer/index.html");
    console.log("Loading renderer from:", rendererPath);
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.setIgnoreMouseEvents(false);

  mainWindow.on("blur", () => {
    console.log("Window blurred - setting click-through");
    mainWindow?.setIgnoreMouseEvents(true, { forward: true });
  });

  mainWindow.on("focus", () => {
    console.log("Window focused - removing click-through");
    mainWindow?.setIgnoreMouseEvents(false);
  });

  mainWindow.show();
  mainWindow.focus();
  console.log("Window shown and focused");

  mainWindow.webContents.on(
    "did-fail-load",
    (_, errorCode, errorDescription) => {
      console.error("Failed to load renderer:", errorCode, errorDescription);
    }
  );

  mainWindow.webContents.on("dom-ready", () => {
    console.log("DOM ready - renderer loaded successfully");
    console.log("Window visible:", mainWindow?.isVisible());
    console.log("Window minimized:", mainWindow?.isMinimized());
  });

  mainWindow.on("ready-to-show", () => {
    console.log("Window ready to show");
    mainWindow?.show();
    mainWindow?.focus();
  });

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log("Timeout check - forcing window visible");
      console.log(
        "Current state - visible:",
        mainWindow.isVisible(),
        "minimized:",
        mainWindow.isMinimized()
      );
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true);
    }
  }, 2000);
};

const createTray = (): void => {
  const iconPath = path.join(__dirname, "../../assets/icon.png");
  console.log("Using tray icon from:", iconPath);

  const fs = require("fs");
  console.log("Icon file exists:", fs.existsSync(iconPath));

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide Tracker (F9)",
      click: toggleVisibility,
    },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: true,
      click: async (menuItem) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
        }
      },
    },
    {
      label: "Debug: Force Show",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.setAlwaysOnTop(true);
          isVisible = true;
          console.log("Force showing window");
        }
      },
    },
    {
      type: "separator",
    },
    {
      label: "Exit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("POE2 Quest Tracker - Press F9 to toggle");
  tray.setContextMenu(contextMenu);

  tray.on("click", toggleVisibility);
};

const toggleVisibility = (): void => {
  if (!mainWindow) {
    console.log("Toggle called but mainWindow is null");
    return;
  }

  console.log("Toggle called - current visibility:", isVisible);

  if (isVisible) {
    mainWindow.hide();
    isVisible = false;
    console.log("Window hidden");
  } else {
    mainWindow.show();
    mainWindow.focus();
    isVisible = true;
    console.log("Window shown and focused");
  }
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  const registered = globalShortcut.register("F9", () => {
    console.log("F9 hotkey pressed!");
    toggleVisibility();
  });

  if (!registered) {
    console.log("Failed to register F9 global shortcut");
  } else {
    console.log("F9 global shortcut registered successfully");
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("minimize-window", () => {
  mainWindow?.minimize();
});

ipcMain.handle("close-window", () => {
  mainWindow?.close();
});

ipcMain.handle("toggle-always-on-top", (_, shouldStay: boolean) => {
  mainWindow?.setAlwaysOnTop(shouldStay);
});

ipcMain.handle("save-quest-data", (_, data: any) => {
  // TODO: Implement persistent storage
  console.log("Saving quest data:", data);
});

ipcMain.handle("load-quest-data", () => {
  // TODO: Implement persistent storage
  return null;
});
