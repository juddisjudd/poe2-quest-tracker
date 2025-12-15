import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
  shell,
  dialog,
} from "electron";
import { autoUpdater } from "electron-updater";
import * as path from "path";
import * as fs from "fs";
import { format as formatUrl } from "url";
import { isDev } from "./utils";
import log from "electron-log";
import { detectPoeLogFile, checkFileExists } from "../utils/processDetection";
import { debouncedWriter } from "./utils/debouncedWrite";

log.transports.file.level = "info";
log.transports.console.level = "info";
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let treeWindow: BrowserWindow | null = null; // Passive tree viewer window
let tray: Tray | null = null;
let currentHotkey = "F9";

// Log monitoring state
let logWatcher: fs.FSWatcher | null = null;
let logFilePath: string | null = null;
let lastLogSize = 0;
let currentLocation: string | null = null; // Track current player location

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const getDataPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "quest-data.json");
};

const getGemDataPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "gem-data.json");
};

const getNotesDataPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "notes-data.json");
};

const getItemCheckDataPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "item-check-data.json");
};

const getPassiveTreeDataPath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "passive-tree-data.json");
};

const registerHotkey = (hotkey: string): boolean => {
  globalShortcut.unregisterAll();

  try {
    const registered = globalShortcut.register(hotkey, toggleVisibility);
    if (registered) {
      currentHotkey = hotkey;
      console.log(`${hotkey} global shortcut registered successfully`);
      return true;
    } else {
      console.log(`Failed to register ${hotkey} global shortcut`);
      return false;
    }
  } catch (error) {
    console.error(`Error registering hotkey ${hotkey}:`, error);
    return false;
  }
};

const createWindow = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const iconPath = path.join(__dirname, "../../assets/icon.png");
  
  // Calculate window position, ensuring it's on-screen
  const windowWidth = 550;
  const windowHeight = 817;
  const xPos = Math.max(0, Math.min(width - windowWidth - 20, width - 570));
  const yPos = 20;
  
  console.log("Primary display workArea:", { width, height });
  console.log("Window position:", { x: xPos, y: yPos, width: windowWidth, height: windowHeight });

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: xPos,
    y: yPos,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    show: false,
    icon: iconPath,
    titleBarStyle: "hidden",
    hasShadow: false,
    thickFrame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,
    },
  });

  const isDevelopment = isDev();

  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:3000");
    // Dev tools can be opened with F12 if needed
    // mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    const url = formatUrl({
      pathname: rendererPath,
      protocol: "file",
      slashes: true,
    });
    mainWindow.loadURL(url);

    // Dev tools disabled in production (can be opened with F12 if needed)

    setTimeout(() => {
      log.info("Checking for updates...");
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  }

  const setupOverlay = () => {
    if (!mainWindow) return;

    if (process.platform === "win32") {
      mainWindow.setAlwaysOnTop(true, "normal");
    } else if (process.platform === "darwin") {
      mainWindow.setAlwaysOnTop(true, "floating");
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      mainWindow.setFullScreenable(false);
    } else {
      mainWindow.setAlwaysOnTop(true, "normal");
    }
  };

  mainWindow.on("ready-to-show", () => {
    setupOverlay();
    mainWindow?.show();
    console.log("Window ready-to-show event fired");
    const bounds = mainWindow?.getBounds();
    console.log("Window bounds:", bounds);
    console.log("Window visible:", mainWindow?.isVisible());
  });

  // Close tree window when main window closes
  mainWindow.on("close", () => {
    if (treeWindow && !treeWindow.isDestroyed()) {
      treeWindow.close();
      treeWindow = null;
    }
  });

  // Force show window after 2 seconds if ready-to-show hasn't fired
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log("Force showing window (ready-to-show didn't fire)");
      setupOverlay();
      mainWindow.show();
    }
  }, 2000);

  if (!isDevelopment) {
    setInterval(() => {
      log.info("Periodic update check...");
      autoUpdater.checkForUpdatesAndNotify();
    }, 30 * 60 * 1000);
  }

  setInterval(() => {
    reinforceOverlaySettings();
  }, 60 * 1000);
};

// Create a detached window for the passive tree viewer
const createTreeWindow = (passiveTreeData?: any): void => {
  // If tree window already exists, just focus it
  if (treeWindow && !treeWindow.isDestroyed()) {
    treeWindow.focus();
    // Send updated tree data if provided
    if (passiveTreeData) {
      treeWindow.webContents.send('passive-tree-data', passiveTreeData);
    }
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const iconPath = path.join(__dirname, "../../assets/icon.png");

  treeWindow = new BrowserWindow({
    width: Math.min(1200, width - 100),
    height: Math.min(900, height - 100),
    x: Math.floor((width - Math.min(1200, width - 100)) / 2),
    y: Math.floor((height - Math.min(900, height - 100)) / 2),
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    resizable: true,
    show: false,
    icon: iconPath,
    title: "Passive Tree Viewer - Exile Compass",
    titleBarStyle: "hidden",
    hasShadow: false,
    thickFrame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      backgroundThrottling: false,
    },
  });

  const isDevelopment = isDev();

  if (isDevelopment) {
    // Load a special route for the tree viewer
    treeWindow.loadURL("http://localhost:3000/#/passive-tree");
  } else {
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    const url = formatUrl({
      pathname: rendererPath,
      protocol: "file",
      slashes: true,
      hash: "/passive-tree",
    });
    treeWindow.loadURL(url);
  }

  treeWindow.on("ready-to-show", () => {
    treeWindow?.show();
    // Open devtools for debugging (uncomment when needed)
    // treeWindow?.webContents.openDevTools({ mode: 'detach' });
    // Send initial tree data if provided
    if (passiveTreeData) {
      treeWindow?.webContents.send('passive-tree-data', passiveTreeData);
    }
    log.info("Tree window ready-to-show event fired");
  });

  treeWindow.on("closed", () => {
    treeWindow = null;
    // Notify main window that tree window was closed
    mainWindow?.webContents.send('tree-window-closed');
    log.info("Tree window closed");
  });

  log.info("Passive tree window created");
};

// Close the tree window if it exists
const closeTreeWindow = (): void => {
  if (treeWindow && !treeWindow.isDestroyed()) {
    treeWindow.close();
    treeWindow = null;
  }
};

const createTray = (): void => {
  const iconPath = path.join(__dirname, "../../assets/icon.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Show/Hide Tracker (${currentHotkey})`,
      click: toggleVisibility,
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => autoUpdater.checkForUpdatesAndNotify(),
    },
    { type: "separator" },
    { label: "Exit", click: () => app.quit() },
  ]);

  tray.setToolTip(`POE2 Exile Compass - Press ${currentHotkey} to toggle`);
  tray.setContextMenu(contextMenu);
  tray.on("click", toggleVisibility);
};

const updateTrayMenu = (): void => {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Show/Hide Tracker (${currentHotkey})`,
      click: toggleVisibility,
    },
    { type: "separator" },
    {
      label: "Check for Updates",
      click: () => autoUpdater.checkForUpdatesAndNotify(),
    },
    { type: "separator" },
    { label: "Exit", click: () => app.quit() },
  ]);

  tray.setToolTip(`POE2 Exile Compass - Press ${currentHotkey} to toggle`);
  tray.setContextMenu(contextMenu);
};

const toggleVisibility = (): void => {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide();
    // Also hide tree window if it's open
    if (treeWindow && !treeWindow.isDestroyed()) {
      treeWindow.hide();
    }
  } else {
    mainWindow.show();
    // Also show tree window if it exists
    if (treeWindow && !treeWindow.isDestroyed()) {
      treeWindow.show();
    }
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

    const loadSavedHotkey = async () => {
      try {
        const dataPath = getDataPath();
        if (fs.existsSync(dataPath)) {
          const rawData = fs.readFileSync(dataPath, "utf8");
          const data = JSON.parse(rawData);
          const savedHotkey = data?.settings?.hotkey || "F9";
          registerHotkey(savedHotkey);
        } else {
          registerHotkey("F9");
        }
      } catch (error) {
        console.error("Failed to load saved hotkey:", error);
        registerHotkey("F9");
      }
    };

    loadSavedHotkey();

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

app.on("will-quit", async (event) => {
  // Prevent quit temporarily to flush pending writes
  event.preventDefault();

  globalShortcut.unregisterAll();

  // Flush all pending debounced writes before quitting
  log.info("Flushing pending file writes before quit...");
  try {
    await debouncedWriter.flushAll();
    log.info("All pending writes flushed successfully");
  } catch (error) {
    log.error("Error flushing writes on quit:", error);
  }

  // Now actually quit
  app.exit(0);
});

const reinforceOverlaySettings = (): void => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (process.platform === "win32") {
    mainWindow.setAlwaysOnTop(true, "normal");
  } else if (process.platform === "darwin") {
    mainWindow.setAlwaysOnTop(true, "floating");
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } else {
    mainWindow.setAlwaysOnTop(true, "normal");
  }
};

ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("minimize-window", () => mainWindow?.minimize());
ipcMain.handle("close-window", () => mainWindow?.close());
ipcMain.handle("reinforce-overlay", () => {
  reinforceOverlaySettings();
  return { success: true };
});

ipcMain.handle("save-quest-data", async (_, data: any) => {
  try {
    // Guard against undefined/null data
    if (data === undefined || data === null) {
      console.warn("Attempted to save undefined/null quest data, using empty object");
      data = {};
    }

    const dataPath = getDataPath();
    // Use debounced write - batches writes within 2 seconds
    // Reduces I/O frequency by 80-90% and antimalware false positives
    return await debouncedWriter.write(dataPath, data);
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

ipcMain.handle("save-gem-data", async (_, gemData: any) => {
  try {
    // Guard against undefined/null data
    if (gemData === undefined || gemData === null) {
      console.warn("Attempted to save undefined/null gem data, using empty object");
      gemData = {};
    }

    const gemDataPath = getGemDataPath();
    return await debouncedWriter.write(gemDataPath, gemData);
  } catch (error) {
    console.error("Failed to save gem data:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("load-gem-data", async () => {
  try {
    const gemDataPath = getGemDataPath();
    if (!fs.existsSync(gemDataPath)) {
      console.log("No saved gem data found");
      return null;
    }

    const rawData = fs.readFileSync(gemDataPath, "utf8");
    const data = JSON.parse(rawData);
    console.log("Gem data loaded successfully from:", gemDataPath);
    return data;
  } catch (error) {
    console.error("Failed to load gem data:", error);
    return null;
  }
});

ipcMain.handle("update-hotkey", async (_, newHotkey: string) => {
  try {
    const success = registerHotkey(newHotkey);
    if (success) {
      updateTrayMenu();
      
      try {
        const dataPath = getDataPath();
        let data: any = {};
        
        if (fs.existsSync(dataPath)) {
          const rawData = fs.readFileSync(dataPath, "utf8");
          data = JSON.parse(rawData);
        }
        
        if (!data.settings) {
          data.settings = {};
        }
        data.settings.hotkey = newHotkey;
        
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
        console.log(`Hotkey updated to ${newHotkey} and saved to data file`);
      } catch (saveError) {
        console.error("Failed to save hotkey to data file:", saveError);
      }
      
      return { success: true };
    } else {
      throw new Error(`Failed to register hotkey: ${newHotkey}`);
    }
  } catch (error) {
    console.error("Failed to update hotkey:", error);
    throw error;
  }
});

ipcMain.handle("open-external", async (_, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error("Failed to open external URL:", error);
    throw error;
  }
});

autoUpdater.on("checking-for-update", () => {
  log.info("Checking for update...");
});

autoUpdater.on("update-available", (info) => {
  log.info("Update available:", info);
  mainWindow?.webContents.send("update-available");
});

autoUpdater.on("update-not-available", (info) => {
  log.info("Update not available:", info);
});

autoUpdater.on("error", (err) => {
  log.error("Error in auto-updater:", err);
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + " - Downloaded " + progressObj.percent + "%";
  log_message =
    log_message +
    " (" +
    progressObj.transferred +
    "/" +
    progressObj.total +
    ")";
  log.info(log_message);
});

autoUpdater.on("update-downloaded", (info) => {
  log.info("Update downloaded:", info);
  mainWindow?.webContents.send("update-downloaded");
});

ipcMain.handle("check-for-updates", () => {
  if (!isDev()) {
    log.info("Manual update check triggered");
    autoUpdater.checkForUpdatesAndNotify();
  }
});

ipcMain.on("restart-app", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("detect-poe-log-file", async () => {
  try {
    const logFilePath = await detectPoeLogFile();
    log.info("POE log file detection result:", logFilePath);
    return logFilePath;
  } catch (error) {
    log.error("Error detecting POE log file:", error);
    return null;
  }
});

ipcMain.handle("check-file-exists", async (_, filePath: string) => {
  try {
    const exists = await checkFileExists(filePath);
    return exists;
  } catch (error) {
    log.error("Error checking file existence:", error);
    return false;
  }
});

ipcMain.handle("select-log-file", async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: "Select Path of Exile 2 Log File",
      defaultPath: "Client.txt",
      filters: [
        { name: "Log Files", extensions: ["txt"] },
        { name: "All Files", extensions: ["*"] }
      ],
      properties: ["openFile"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const selectedPath = result.filePaths[0];
    log.info("Manual log file selected:", selectedPath);
    
    // Verify the selected file exists
    const exists = await checkFileExists(selectedPath);
    if (!exists) {
      log.error("Selected log file does not exist:", selectedPath);
      return null;
    }

    return selectedPath;
  } catch (error) {
    log.error("Error selecting log file:", error);
    return null;
  }
});

ipcMain.handle("save-notes-data", async (_, notesData: any) => {
  try {
    // Guard against undefined/null data
    if (notesData === undefined || notesData === null) {
      console.warn("Attempted to save undefined/null notes data, using empty object");
      notesData = {};
    }

    const notesDataPath = getNotesDataPath();
    const result = await debouncedWriter.write(notesDataPath, notesData);
    if (result.success) {
      console.log("Notes data save queued (debounced):", notesDataPath);
    }
    return result;
  } catch (error) {
    console.error("Failed to save notes data:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("load-notes-data", async () => {
  try {
    const notesDataPath = getNotesDataPath();
    if (!fs.existsSync(notesDataPath)) {
      console.log("No saved notes data found");
      return null;
    }

    const rawData = fs.readFileSync(notesDataPath, "utf8");
    const data = JSON.parse(rawData);
    console.log("Notes data loaded successfully from:", notesDataPath);
    return data;
  } catch (error) {
    console.error("Failed to load notes data:", error);
    return null;
  }
});

ipcMain.handle("save-item-check-data", async (_, itemCheckData: any) => {
  try {
    // Guard against undefined/null data
    if (itemCheckData === undefined || itemCheckData === null) {
      console.warn("Attempted to save undefined/null item check data, using empty object");
      itemCheckData = {};
    }

    const itemCheckDataPath = getItemCheckDataPath();
    const result = await debouncedWriter.write(itemCheckDataPath, itemCheckData);
    if (result.success) {
      console.log("Item check data save queued (debounced):", itemCheckDataPath);
    }
    return result;
  } catch (error) {
    console.error("Failed to save item check data:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("load-item-check-data", async () => {
  try {
    const itemCheckDataPath = getItemCheckDataPath();
    if (!fs.existsSync(itemCheckDataPath)) {
      console.log("No saved item check data found");
      return null;
    }

    const rawData = fs.readFileSync(itemCheckDataPath, "utf8");
    const data = JSON.parse(rawData);
    console.log("Item check data loaded successfully from:", itemCheckDataPath);
    return data;
  } catch (error) {
    console.error("Failed to load item check data:", error);
    return null;
  }
});

// Passive Tree Window IPC handlers
ipcMain.handle("open-tree-window", async (_, passiveTreeData: any) => {
  try {
    createTreeWindow(passiveTreeData);
    return { success: true };
  } catch (error) {
    console.error("Failed to open tree window:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("close-tree-window", async () => {
  try {
    closeTreeWindow();
    return { success: true };
  } catch (error) {
    console.error("Failed to close tree window:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("minimize-tree-window", async () => {
  try {
    if (treeWindow && !treeWindow.isDestroyed()) {
      treeWindow.minimize();
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to minimize tree window:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("start-tree-window-resize", async (_, direction: string) => {
  try {
    if (treeWindow && !treeWindow.isDestroyed()) {
      const { screen } = require('electron');
      const point = screen.getCursorScreenPoint();
      const currentBounds = treeWindow.getBounds();

      // Store initial state for resize
      (treeWindow as any)._resizeState = {
        direction,
        startPoint: point,
        startBounds: currentBounds,
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to start tree window resize:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("resize-tree-window", async (_, mouseX: number, mouseY: number) => {
  try {
    if (treeWindow && !treeWindow.isDestroyed() && (treeWindow as any)._resizeState) {
      const { direction, startPoint, startBounds } = (treeWindow as any)._resizeState;
      const deltaX = mouseX - startPoint.x;
      const deltaY = mouseY - startPoint.y;

      let newBounds = { ...startBounds };

      // Calculate new bounds based on resize direction
      if (direction.includes('right')) {
        newBounds.width = Math.max(800, startBounds.width + deltaX);
      }
      if (direction.includes('left')) {
        const newWidth = Math.max(800, startBounds.width - deltaX);
        newBounds.x = startBounds.x + (startBounds.width - newWidth);
        newBounds.width = newWidth;
      }
      if (direction.includes('bottom')) {
        newBounds.height = Math.max(600, startBounds.height + deltaY);
      }
      if (direction.includes('top')) {
        const newHeight = Math.max(600, startBounds.height - deltaY);
        newBounds.y = startBounds.y + (startBounds.height - newHeight);
        newBounds.height = newHeight;
      }

      treeWindow.setBounds(newBounds);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to resize tree window:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("end-tree-window-resize", async () => {
  try {
    if (treeWindow && !treeWindow.isDestroyed()) {
      delete (treeWindow as any)._resizeState;
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to end tree window resize:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("is-tree-window-open", async () => {
  return treeWindow !== null && !treeWindow.isDestroyed();
});

ipcMain.handle("send-tree-data", async (_, passiveTreeData: any) => {
  try {
    if (treeWindow && !treeWindow.isDestroyed()) {
      treeWindow.webContents.send('passive-tree-data', passiveTreeData);
      return { success: true };
    }
    return { success: false, error: "Tree window not open" };
  } catch (error) {
    console.error("Failed to send tree data:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("save-passive-tree-data", async (_, data: any) => {
  try {
    const dataPath = getPassiveTreeDataPath();

    // If data is null/undefined, delete the file to clear tree data
    if (data === null || data === undefined) {
      // Cancel any pending write and delete the file
      debouncedWriter.cancel(dataPath);
      if (fs.existsSync(dataPath)) {
        fs.unlinkSync(dataPath);
        console.log("Passive tree data file deleted:", dataPath);
      }
      return { success: true };
    }

    return await debouncedWriter.write(dataPath, data);
  } catch (error) {
    console.error("Failed to save passive tree data:", error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle("load-passive-tree-data", async () => {
  try {
    const dataPath = getPassiveTreeDataPath();
    if (!fs.existsSync(dataPath)) {
      console.log("No saved passive tree data found");
      return null;
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(rawData);
    console.log("Passive tree data loaded successfully from:", dataPath);
    return data;
  } catch (error) {
    console.error("Failed to load passive tree data:", error);
    return null;
  }
});

// Load tree structure JSON (the full tree data from PathOfBuilding)
ipcMain.handle("load-tree-structure", async (_, version: string = '0_4') => {
  try {
    // Try multiple locations for the tree data
    const possiblePaths = [
      // Production: packaged app resources
      path.join(process.resourcesPath, 'app', 'data', 'tree', `tree-${version}.min.json`),
      path.join(process.resourcesPath, 'data', 'tree', `tree-${version}.min.json`),
      // Production: bundled with app (asar)
      path.join(__dirname, '..', '..', 'data', 'tree', `tree-${version}.min.json`),
      path.join(__dirname, '..', 'data', 'tree', `tree-${version}.min.json`),
      // Development: project root
      path.join(process.cwd(), 'data', 'tree', `tree-${version}.min.json`),
      // Also try non-minified version
      path.join(process.cwd(), 'data', 'tree', `tree-${version}.json`),
    ];

    for (const treePath of possiblePaths) {
      if (fs.existsSync(treePath)) {
        console.log(`Loading tree structure from: ${treePath}`);
        const rawData = fs.readFileSync(treePath, "utf8");
        const data = JSON.parse(rawData);
        console.log(`Tree structure loaded: ${Object.keys(data.nodes || {}).length} nodes`);
        return data;
      }
    }

    console.warn(`Tree structure file not found for version ${version}`);
    return null;
  } catch (error) {
    console.error("Failed to load tree structure:", error);
    return null;
  }
});

// Get the base path for assets (used by tree window for loading icons)
ipcMain.handle("get-assets-path", async () => {
  const isDevelopment = isDev();
  
  if (isDevelopment) {
    // In development, assets are served by Vite
    return 'http://localhost:3000/assets';
  } else {
    // In production, return the file:// path to assets
    const possiblePaths = [
      path.join(process.resourcesPath, 'app', 'assets'),
      path.join(__dirname, '..', '..', 'assets'),
    ];
    
    for (const assetPath of possiblePaths) {
      if (fs.existsSync(assetPath)) {
        // Convert to file:// URL format
        return 'file://' + assetPath.replace(/\\/g, '/');
      }
    }
    
    console.warn('Assets path not found');
    return null;
  }
});

// Load gem loadouts for the tree window
ipcMain.handle("load-gem-loadouts", async () => {
  try {
    const dataPath = getGemDataPath();
    if (!fs.existsSync(dataPath)) {
      console.log("No gem data found for loadouts");
      return null;
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(rawData);
    
    if (data.gemLoadouts) {
      console.log("Gem loadouts loaded:", data.gemLoadouts.loadouts?.length || 0, "loadouts");
      return data.gemLoadouts;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to load gem loadouts:", error);
    return null;
  }
});

// Switch to a different loadout's passive tree
ipcMain.handle("switch-tree-loadout", async (_, loadoutId: string) => {
  try {
    const dataPath = getGemDataPath();
    if (!fs.existsSync(dataPath)) {
      console.log("No gem data found");
      return null;
    }

    const rawData = fs.readFileSync(dataPath, "utf8");
    const data = JSON.parse(rawData);
    
    if (!data.gemLoadouts) {
      console.log("No loadouts found");
      return null;
    }
    
    const loadout = data.gemLoadouts.loadouts?.find((l: any) => l.id === loadoutId);
    if (!loadout) {
      console.log("Loadout not found:", loadoutId);
      return null;
    }
    
    if (!loadout.passiveTree) {
      console.log("Loadout has no passive tree:", loadoutId);
      return null;
    }
    
    // Update the active loadout
    data.gemLoadouts.activeLoadoutId = loadoutId;

    // Save the updated gem data (debounced, non-blocking for faster UX)
    debouncedWriter.write(dataPath, data).catch(err =>
      log.error("Failed to save gem data after loadout switch:", err)
    );

    // Also save the passive tree data separately (debounced, non-blocking)
    const treeDataPath = getPassiveTreeDataPath();
    debouncedWriter.write(treeDataPath, loadout.passiveTree).catch(err =>
      log.error("Failed to save tree data after loadout switch:", err)
    );

    console.log("Switched to loadout:", loadout.name, "with", loadout.passiveTree.allocatedNodes?.length || 0, "nodes");

    // Return immediately for faster UI response (writes happen in background)
    return loadout.passiveTree;
  } catch (error) {
    console.error("Failed to switch tree loadout:", error);
    return null;
  }
});

ipcMain.handle("save-file", async (_, content: string, defaultName: string) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: "Save Guide File",
      defaultPath: defaultName,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return false;
    }

    await fs.promises.writeFile(result.filePath, content, 'utf8');
    log.info("Guide file saved:", result.filePath);
    return true;
  } catch (error) {
    log.error("Error saving guide file:", error);
    return false;
  }
});

// Log monitoring handlers
ipcMain.handle("start-log-monitoring", async (_, filePath: string) => {
  try {
    // Stop any existing monitoring
    if (logWatcher) {
      logWatcher.close();
      logWatcher = null;
    }

    logFilePath = filePath;
    
    // Get initial file size to only monitor new entries
    try {
      const stats = fs.statSync(filePath);
      lastLogSize = stats.size;
    } catch (error) {
      log.warn("Could not get initial log file size:", error);
      lastLogSize = 0;
    }

    // Watch for file changes 
    logWatcher = fs.watch(filePath, { persistent: true }, (eventType, filename) => {
      log.info(`File watch event: ${eventType} for ${filename || 'unknown'}`);
      if (eventType === 'change') {
        handleLogFileChange();
      }
    });
    
    // Set up smart polling as a backup - only when needed
    let pollCounter = 0;
    const pollingInterval = setInterval(() => {
      pollCounter++;
      
      // Only poll every 5 seconds to reduce spam
      if (pollCounter % 5 !== 0) {
        return;
      }
      
      // Only poll if file watcher hasn't triggered recently
      try {
        const stats = fs.statSync(filePath);
        if (stats.size !== lastLogSize) {
          log.info('Polling detected missed file change, processing...');
          handleLogFileChange();
        }
      } catch (error) {
        // File might not exist or be accessible, skip this poll
      }
    }, 1000);
    
    // Store polling interval for cleanup
    (logWatcher as any).pollingInterval = pollingInterval;

    logWatcher.on('error', (error) => {
      log.error('Log file watcher error:', error);
    });

    log.info("[POE2-AUTO-TRACK] Started log monitoring for:", filePath);
    log.info("[POE2-AUTO-TRACK] Initial file size:", lastLogSize, "bytes");
    log.info("[POE2-AUTO-TRACK] File watcher active, polling backup every 5 seconds");
  } catch (error) {
    log.error("Error starting log monitoring:", error);
    throw error;
  }
});

ipcMain.handle("stop-log-monitoring", async () => {
  try {
    if (logWatcher) {
      // Clear polling interval if it exists
      if ((logWatcher as any).pollingInterval) {
        clearInterval((logWatcher as any).pollingInterval);
      }
      logWatcher.close();
      logWatcher = null;
    }
    logFilePath = null;
    lastLogSize = 0;
    currentLocation = null; // Reset location tracking
    log.info("[POE2-AUTO-TRACK] Stopped log monitoring");
  } catch (error) {
    log.error("Error stopping log monitoring:", error);
    throw error;
  }
});

function handleLogFileChange() {
  if (!logFilePath || !mainWindow) return;

  try {
    const stats = fs.statSync(logFilePath);
    const currentSize = stats.size;

    log.info(`[POE2-AUTO-TRACK] Log file change detected: current=${currentSize}, last=${lastLogSize}`);

    // Handle file truncation or rotation (file got smaller)
    if (currentSize < lastLogSize) {
      log.info('[POE2-AUTO-TRACK] Client.txt appears truncated or rotated. Resetting read position to 0.');
      lastLogSize = 0;
    }

    // Only read new content if file grew significantly (avoid tiny changes)
    if (currentSize <= lastLogSize) {
      return; // No logging needed for no changes
    }

    // Skip if change is tiny (less than 10 bytes) - might be file system noise
    if (currentSize - lastLogSize < 10) {
      return;
    }

    // Read only the new content
    const stream = fs.createReadStream(logFilePath, {
      start: lastLogSize,
      end: currentSize - 1,
      encoding: 'utf8'
    });

    let newContent = '';
    stream.on('data', (chunk) => {
      newContent += chunk;
    });

    stream.on('end', () => {
      // Update size tracker
      lastLogSize = currentSize;

      log.info(`[POE2-AUTO-TRACK] Read ${newContent.length} bytes of new content`);

      // Process new lines
      const lines = newContent.split('\n').filter(line => line.trim());
      log.info(`[POE2-AUTO-TRACK] Processing ${lines.length} new lines from Client.txt`);
      
      for (const line of lines) {
        // Check for scene changes first
        const sceneMatch = line.match(/.*\[INFO Client \d+\] \[SCENE\] Set Source \[(.+?)\]/);
        if (sceneMatch) {
          const previousLocation = currentLocation;
          currentLocation = sceneMatch[1];
          log.info(`[POE2-AUTO-TRACK] 🗺️  Player location changed: "${previousLocation || 'Unknown'}" → "${currentLocation}"`);

          // Detect act number from special act markers
          let detectedActNumber: number | null = null;
          const actMatch = currentLocation.match(/^Act (\d+)$/i);
          if (actMatch) {
            detectedActNumber = parseInt(actMatch[1], 10);
            log.info(`[POE2-AUTO-TRACK] 📍 Detected Act ${detectedActNumber} from scene marker`);
          }

          // Send zone change to renderer process with act number if detected
          mainWindow?.webContents.send('zone-changed', {
            zoneName: currentLocation,
            actNumber: detectedActNumber
          });

          log.info(`[POE2-AUTO-TRACK] ✉️  Sent 'zone-changed' event to renderer process`);
          continue;
        }

        // POE2 Reward Patterns - Based on actual log file analysis
        // PRIMARY FORMAT: "You have received X" (confirmed in 260+ log entries)
        const rewardPatterns = [
          // Passive Skill Points (campaign quest rewards)
          /You have received \d+\s*Passive Skill Points?/i,
          /You have received Passive Skill Points?/i,

          // Weapon Set Passive Skill Points (POE2 dual-wield feature)
          /You have received \d+\s*Weapon Set Passive Skill Points?/i,

          // Atlas Skill Points (endgame mapping system)
          /You have received \d+\s*Atlas Skill Points?/i,

          // League-specific Atlas Skill Points
          /You have received \d+\s*Breach Atlas Skill Points?/i,
          /You have received \d+\s*Delirium Atlas Skill Points?/i,
          /You have received \d+\s*Expedition Atlas Skill Points?/i,
          /You have received \d+\s*Ritual Atlas Skill Points?/i,
          /You have received \d+\s*Map Boss Atlas Skill Points?/i,

          // Campaign Permanent Rewards (Spirit, Resistance, Life)
          // These use [Type|Specific] bracket format
          /You have received.*\[Resistances?\|/i,
          /You have received.*\[Spirit\|/i,
          /You have received.*maximum Life/i,
          /You have received.*Life Recovery/i,

          // Charm (POE2 feature)
          /You have received.*Charm/i,

          // Attributes
          /You have received.*\[(?:Strength|Dexterity|Intelligence)\|/i,

          // Other campaign rewards
          /You have received.*Recovery/i,
          /You have received.*Movement Speed/i,
          /You have received.*Cooldown/i,
          /You have received.*Global Defences/i,
          /You have received.*Experience/i,
          /You have received.*Stun Threshold/i,
          /You have received.*Ailment Threshold/i,
          /You have received.*Mana Regeneration/i,
          /You have received.*Flask/i,
          /You have received.*Presence/i,

          // Generic catch-all for bracket format
          /You have received.*\[.+?\|.+?\]/i,

          // Generic catch-all for any "You have received"
          /You have received/i
        ];

        // Check if line matches any reward pattern and find which one
        let matchedPattern: RegExp | null = null;
        let matchedPatternIndex = -1;

        for (let i = 0; i < rewardPatterns.length; i++) {
          if (rewardPatterns[i].test(line)) {
            matchedPattern = rewardPatterns[i];
            matchedPatternIndex = i;
            break;
          }
        }

        if (matchedPattern) {
          // Extract the actual reward text from the log line
          const rewardMatch = line.match(/: (.+)$/);
          const rewardText = rewardMatch ? rewardMatch[1] : line.substring(0, 100);

          log.info(`[POE2-AUTO-TRACK] 🎁 Reward detected!`);
          log.info(`[POE2-AUTO-TRACK]    Text: "${rewardText}"`);
          log.info(`[POE2-AUTO-TRACK]    Location: "${currentLocation || 'Unknown'}"`);
          log.info(`[POE2-AUTO-TRACK]    Pattern #${matchedPatternIndex + 1}: ${matchedPattern.source.substring(0, 80)}...`);

          // Send reward to renderer process with current location context
          mainWindow?.webContents.send('log-reward', line);
          log.info(`[POE2-AUTO-TRACK] ✉️  Sent 'log-reward' event to renderer process`);

          // Early access warning for generic catch-all patterns
          if (matchedPatternIndex >= rewardPatterns.length - 2) {
            log.warn(`[POE2-AUTO-TRACK] ⚠️  Matched by generic catch-all pattern - may need specific pattern in future POE2 updates`);
          }
        }
      }
    });

    stream.on('error', (error) => {
      log.error('Error reading log file:', error);
    });

  } catch (error) {
    log.error('Error handling log file change:', error);
  }
}
