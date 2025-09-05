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

log.transports.file.level = "info";
log.transports.console.level = "info";
autoUpdater.logger = log;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let currentHotkey = "F9";

// Log monitoring state
let logWatcher: fs.FSWatcher | null = null;
let logFilePath: string | null = null;
let lastLogSize = 0;

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
  const { width } = primaryDisplay.workAreaSize;
  const iconPath = path.join(__dirname, "../../assets/icon.png");

  mainWindow = new BrowserWindow({
    width: 550,
    height: 817,
    x: width - 570,
    y: 20,
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
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const rendererPath = path.join(__dirname, "../renderer/index.html");
    const url = formatUrl({
      pathname: rendererPath,
      protocol: "file",
      slashes: true,
    });
    mainWindow.loadURL(url);

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
  });

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
  } else {
    mainWindow.show();
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

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
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

ipcMain.handle("save-gem-data", async (_, gemData: any) => {
  try {
    const gemDataPath = getGemDataPath();
    const gemDataDir = path.dirname(gemDataPath);

    if (!fs.existsSync(gemDataDir)) {
      fs.mkdirSync(gemDataDir, { recursive: true });
    }

    fs.writeFileSync(gemDataPath, JSON.stringify(gemData, null, 2), "utf8");
    console.log("Gem data saved successfully to:", gemDataPath);
    return { success: true };
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
    const notesDataPath = getNotesDataPath();
    const notesDataDir = path.dirname(notesDataPath);

    if (!fs.existsSync(notesDataDir)) {
      fs.mkdirSync(notesDataDir, { recursive: true });
    }

    fs.writeFileSync(notesDataPath, JSON.stringify(notesData, null, 2), "utf8");
    console.log("Notes data saved successfully to:", notesDataPath);
    return { success: true };
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

// Item Check Data handlers
ipcMain.handle("save-item-check-data", async (_, itemCheckData: any) => {
  try {
    const itemCheckDataPath = getItemCheckDataPath();
    fs.writeFileSync(itemCheckDataPath, JSON.stringify(itemCheckData, null, 2), "utf8");
    console.log("Item check data saved successfully to:", itemCheckDataPath);
    return { success: true };
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

    log.info("Started log monitoring for:", filePath);
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
    log.info("Stopped log monitoring");
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

    log.info(`Log file change detected: current=${currentSize}, last=${lastLogSize}`);

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

      log.info(`Read ${newContent.length} bytes of new content`);

      // Process new lines
      const lines = newContent.split('\n').filter(line => line.trim());
      log.info(`Processing ${lines.length} new lines`);
      
      for (const line of lines) {
        // Only log lines that might be rewards to reduce noise
        const mightBeReward = line.includes('has received');
        if (mightBeReward) {
          log.info(`Checking potential reward line: ${line}`);
        }
        
        // Check if line contains reward information
        if (line.includes('has received') && (
          line.includes('Resistance') ||
          line.includes('Spirit') ||
          line.includes('maximum Life') ||
          line.includes('Charm') ||
          line.includes('Intelligence') ||
          line.includes('Strength') ||
          line.includes('Dexterity') ||
          line.includes('Recovery') ||
          line.includes('Movement Speed') ||
          line.includes('Cooldown') ||
          line.includes('Global Defences') ||
          line.includes('Experience') ||
          line.includes('Stun Threshold') ||
          line.includes('Ailment Threshold') ||
          line.includes('Mana Regeneration')
        )) {
          // Send reward to renderer process
          mainWindow?.webContents.send('log-reward', line);
          log.info('Detected reward:', line);
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
