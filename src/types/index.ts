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
  };
}

declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      toggleAlwaysOnTop: (shouldStay: boolean) => Promise<void>;
      saveQuestData: (data: TrackerData) => Promise<void>;
      loadQuestData: () => Promise<TrackerData | null>;
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      restartApp: () => void;
    };
  }
}
