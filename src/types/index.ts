export interface QuestStep {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  optional?: boolean;
}

export interface Act {
  id: string;
  name: string;
  expanded: boolean;
  quests: QuestStep[];
}

export interface TrackerData {
  acts: Act[];
  settings: {
    alwaysOnTop: boolean;
    opacity: number;
    fontSize?: number;
    theme?: "amoled" | "amoled-crimson" | "amoled-yellow";
    showOptional?: boolean;
    hotkey?: string;
  };
}

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      saveQuestData: (data: TrackerData) => Promise<void>;
      loadQuestData: () => Promise<TrackerData | null>;
      checkForUpdates: () => Promise<void>;
      updateHotkey: (hotkey: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      restartApp: () => void;
    };
  }
}
