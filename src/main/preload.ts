import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  saveQuestData: (data: any) => ipcRenderer.invoke("save-quest-data", data),
  loadQuestData: () => ipcRenderer.invoke("load-quest-data"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  updateHotkey: (hotkey: string) => ipcRenderer.invoke("update-hotkey", hotkey),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  reinforceOverlay: () => ipcRenderer.invoke("reinforce-overlay"),
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
