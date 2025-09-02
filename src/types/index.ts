export interface QuestStep {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  optional?: boolean;
  warning?: string;
  reward?: string;
}

export interface Act {
  id: string;
  name: string;
  expanded: boolean;
  quests: QuestStep[];
}

export interface GemSlot {
  id: string;
  name: string;
  type: 'skill' | 'support' | 'spirit';
  acquired: boolean;
  socketGroup?: number;
  statRequirement?: 'str' | 'dex' | 'int' | null; // Strength=red, Dexterity=green, Intelligence=blue, null=white
}

export interface GemSocketGroup {
  id: string;
  mainGem: GemSlot;
  supportGems: GemSlot[];
  maxSockets: number;
}

export interface GemProgression {
  socketGroups: GemSocketGroup[];
  lastImported?: string;
}

export interface GemLoadout {
  id: string;
  name: string;
  gemProgression: GemProgression;
}

export interface GemProgressionWithLoadouts {
  loadouts: GemLoadout[];
  activeLoadoutId: string;
  lastImported?: string;
}

export interface RegexFilters {
  vendor: {
    weapons: string;
    body: string;
    offhandShields: string;
    belt: string;
    boots: string;
    gloves: string;
    ring: string;
    amulet: string;
  };
  waystones: string;
  tablets: string;
  relics: string;
}

export interface NotesData {
  userNotes: string;
  pobNotes?: string;
}

export interface TrackerData {
  acts: Act[];
  gemProgression?: GemProgression;
  gemLoadouts?: GemProgressionWithLoadouts;
  regexFilters?: RegexFilters;
  notesData?: NotesData;
  settings: {
    alwaysOnTop: boolean;
    opacity: number;
    fontSize?: number;
    theme?: "amoled" | "amoled-crimson" | "amoled-yellow";
    showOptional?: boolean;
    hotkey?: string;
    showGemPanel?: boolean;
    showRegexPanel?: boolean;
    showNotesPanel?: boolean;
    logFilePath?: string;
    logFileDetected?: boolean;
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
      detectPoeLogFile: () => Promise<string | null>;
      checkFileExists: (filePath: string) => Promise<boolean>;
    };
  }
}