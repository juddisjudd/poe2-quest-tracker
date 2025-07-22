import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
} from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";
import * as fs from "fs";
import { format as formatUrl } from "url";
import { isDev } from "./utils";
import log from "electron-log";

log.transports.file.level = "info";
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const getDataPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "quest-data.json");
};

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
    autoUpdater.checkForUpdatesAndNotify();
  }

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

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

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
}

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

ipcMain.handle("save-quest-data", async (_, data: any) => {
  try {
    const dataPath = getDataPath();
    const dataDir = path.dirname(dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
    console.log("Quest data saved successfully to:", dataPath);
    return { success: true };
  } catch (error) {
    console.error("Failed to save quest data:", error);
    throw error;
  }
});

ipcMain.handle("load-quest-data", async () => {
  try {
    const dataPath = getDataPath();
    if (!fs.existsSync(dataPath)) {
      console.log("No saved quest data found");
      return null;
    }
    const rawData = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(rawData);
    console.log("Quest data loaded successfully from:", dataPath);
    return data;
  } catch (error) {
    console.error("Failed to load quest data:", error);
    return null;
  }
});

autoUpdater.on("update-available", () => {
  mainWindow?.webContents.send("update-available");
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update-downloaded");
});

ipcMain.on("restart-app", () => {
  autoUpdater.quitAndInstall();
});
