import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  saveQuestData: (data: any) => ipcRenderer.invoke("save-quest-data", data),
  loadQuestData: () => ipcRenderer.invoke("load-quest-data"),
  saveGemData: (data: any) => ipcRenderer.invoke("save-gem-data", data),
  loadGemData: () => ipcRenderer.invoke("load-gem-data"),
  saveNotesData: (data: any) => ipcRenderer.invoke("save-notes-data", data),
  loadNotesData: () => ipcRenderer.invoke("load-notes-data"),
  saveItemCheckData: (data: any) => ipcRenderer.invoke("save-item-check-data", data),
  loadItemCheckData: () => ipcRenderer.invoke("load-item-check-data"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  updateHotkey: (hotkey: string) => ipcRenderer.invoke("update-hotkey", hotkey),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  reinforceOverlay: () => ipcRenderer.invoke("reinforce-overlay"),
  detectPoeLogFile: () => ipcRenderer.invoke("detect-poe-log-file"),
  checkFileExists: (filePath: string) => ipcRenderer.invoke("check-file-exists", filePath),
  checkGameProcess: () => ipcRenderer.invoke("check-game-process"),
  selectLogFile: () => ipcRenderer.invoke("select-log-file"),
  saveFile: (content: string, defaultName: string) => ipcRenderer.invoke("save-file", content, defaultName),
  startLogMonitoring: (filePath: string) => ipcRenderer.invoke("start-log-monitoring", filePath),
  stopLogMonitoring: () => ipcRenderer.invoke("stop-log-monitoring"),
  onLogReward: (callback: (rewardText: string) => void) => {
    const listener = (_: any, rewardText: string) => callback(rewardText);
    ipcRenderer.on("log-reward", listener);
    return () => ipcRenderer.removeListener("log-reward", listener);
  },
  onZoneChanged: (callback: (zoneName: string) => void) => {
    const listener = (_: any, zoneName: string) => callback(zoneName);
    ipcRenderer.on("zone-changed", listener);
    return () => ipcRenderer.removeListener("zone-changed", listener);
  },
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on("update-available", callback);
    return () => ipcRenderer.removeListener("update-available", callback);
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on("update-downloaded", callback);
    return () => ipcRenderer.removeListener("update-downloaded", callback);
  },
  restartApp: () => {
    ipcRenderer.send("restart-app");
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
