import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  toggleAlwaysOnTop: (shouldStay: boolean) =>
    ipcRenderer.invoke("toggle-always-on-top", shouldStay),
  saveQuestData: (data: any) => ipcRenderer.invoke("save-quest-data", data),
  loadQuestData: () => ipcRenderer.invoke("load-quest-data"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

export type ElectronAPI = typeof electronAPI;
