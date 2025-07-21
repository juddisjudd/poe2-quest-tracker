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
import { format as formatUrl } from "url";
import { isDev } from "./utils";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const createWindow = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  const iconPath = path.join(__dirname, "../../assets/icon.png");

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
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDevelopment = isDev();
  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    const url = formatUrl({
      pathname: rendererPath,
      protocol: "file",
      slashes: true,
    });
    mainWindow.loadURL(url);
  }

  mainWindow.setIgnoreMouseEvents(false);

  mainWindow.on("blur", () => {
    mainWindow?.setIgnoreMouseEvents(true, { forward: true });
  });

  mainWindow.on("focus", () => {
    mainWindow?.setIgnoreMouseEvents(false);
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
};

const createTray = (): void => {
  const iconPath = path.join(__dirname, "../../assets/icon.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show/Hide Tracker (F9)", click: toggleVisibility },
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
    { type: "separator" },
    { label: "Exit", click: () => app.quit() },
  ]);

  tray.setToolTip("POE2 Quest Tracker - Press F9 to toggle");
  tray.setContextMenu(contextMenu);
  tray.on("click", toggleVisibility);
};

const toggleVisibility = (): void => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
};

app.whenReady().then(() => {
  createWindow();
  createTray();

  const registered = globalShortcut.register("F9", toggleVisibility);

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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("minimize-window", () => mainWindow?.minimize());
ipcMain.handle("close-window", () => mainWindow?.close());
ipcMain.handle("toggle-always-on-top", (_, shouldStay: boolean) => {
  mainWindow?.setAlwaysOnTop(shouldStay);
});

ipcMain.handle("save-quest-data", (_, data: any) => {
  console.log("Saving quest data:", data);
});

ipcMain.handle("load-quest-data", () => {
  return null;
});
