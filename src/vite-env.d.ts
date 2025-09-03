/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      saveQuestData: (data: any) => Promise<any>;
      loadQuestData: () => Promise<any>;
      checkForUpdates: () => Promise<void>;
      updateHotkey: (hotkey: string) => Promise<any>;
      openExternal: (url: string) => Promise<any>;
      reinforceOverlay: () => Promise<any>;
      detectPoeLogFile: () => Promise<string | null>;
      checkFileExists: (filePath: string) => Promise<boolean>;
      selectLogFile: () => Promise<string | null>;
      saveFile: (content: string, defaultName: string) => Promise<boolean>;
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      restartApp: () => void;
    };
  }
}

// Declare module types for image imports
declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}