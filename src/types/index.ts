export interface QuestStep {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  optional?: boolean;
  warning?: string;
  reward?: string;
  custom?: boolean; // Indicates if this quest was added by user
}

export interface Act {
  id: string;
  name: string;
  expanded: boolean;
  quests: QuestStep[];
  custom?: boolean; // Indicates if this act was added by user
}

export interface CampaignGuide {
  id: string;
  name: string;
  description: string;
  author?: string;
  version?: string;
  acts: Act[];
  isDefault?: boolean;
  custom?: boolean; // Indicates if this guide was created by user
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

export interface ItemModifier {
  text: string;
  tier?: number;
  type: 'prefix' | 'suffix' | 'implicit' | 'crafted' | 'rune' | 'desecrated';
}

export interface ItemData {
  id: string;
  name: string;
  baseType: string;
  itemClass: string;
  rarity: string;
  level: number;
  ilvl: number;
  modifiers: ItemModifier[];
  requirements?: {
    level?: number;
    str?: number;
    dex?: number;
    int?: number;
  };
  sockets?: string;
  quality?: number;
  loadoutNames?: string[];
}

export interface ItemCheckData {
  items: ItemData[];
  lastImported?: string;
}

export interface MatchingModifiers {
  matchingPrefixes: { source: ItemModifier; target: ItemModifier }[];
  matchingSuffixes: { source: ItemModifier; target: ItemModifier }[];
}

export interface BaseTypeMatch {
  exactMatch: boolean;
  categoryMatch: boolean;
}

export interface ItemCheckResult {
  item: ItemData;
  matches: {
    item: ItemData;
    prefixMatches: number;
    suffixMatches: number;
    totalMatches: number;
    score: number;
    recommendation: 'keep' | 'vendor' | 'consider';
    matchingModifiers?: MatchingModifiers;
    baseTypeMatch?: BaseTypeMatch;
  }[];
  bestMatch?: {
    item: ItemData;
    prefixMatches: number;
    suffixMatches: number;
    totalMatches: number;
    score: number;
    recommendation: 'keep' | 'vendor' | 'consider';
    matchingModifiers?: MatchingModifiers;
    baseTypeMatch?: BaseTypeMatch;
  };
}

export interface TrackerData {
  acts: Act[];
  campaignGuides?: CampaignGuide[];
  activeCampaignGuideId?: string;
  editMode?: boolean;
  gemProgression?: GemProgression;
  gemLoadouts?: GemProgressionWithLoadouts;
  regexFilters?: RegexFilters;
  notesData?: NotesData;
  itemCheckData?: ItemCheckData;
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
    showItemCheckPanel?: boolean;
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
      saveGemData: (data: any) => Promise<{ success: boolean; error?: string }>;
      loadGemData: () => Promise<any>;
      saveNotesData: (data: NotesData) => Promise<{ success: boolean; error?: string }>;
      loadNotesData: () => Promise<NotesData | null>;
      saveItemCheckData: (data: ItemCheckData) => Promise<{ success: boolean; error?: string }>;
      loadItemCheckData: () => Promise<ItemCheckData | null>;
      checkForUpdates: () => Promise<void>;
      updateHotkey: (hotkey: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onUpdateAvailable: (callback: () => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      restartApp: () => void;
      detectPoeLogFile: () => Promise<string | null>;
      checkFileExists: (filePath: string) => Promise<boolean>;
      selectLogFile: () => Promise<string | null>;
      saveFile: (content: string, defaultName: string) => Promise<boolean>;
    };
  }
}