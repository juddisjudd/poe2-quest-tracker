export type QuestStepType =
  | 'navigation'      // Zone transitions
  | 'waypoint'        // Waypoint activation
  | 'town'            // Town entry
  | 'npc_quest'       // Quest turn-ins with NPC
  | 'quest'           // Quest objectives
  | 'kill_boss'       // Boss fights
  | 'trial'           // Trial encounters
  | 'passive'         // Passive point rewards
  | 'optional';       // Optional content

export type QuestTag =
  | 'Spirit'
  | 'Resistance'
  | 'Life'
  | 'Mana'
  | 'Gem'
  | 'Passive Skill'
  | 'Boss'
  | 'Trial'
  | 'Waypoint'
  | 'Ritual'
  | 'Breach'
  | 'Expedition'
  | 'Delirium'
  | 'Essence'
  | 'Optional';

export interface QuestStep {
  id: string;
  description: string; // Main description (formerly "name")
  zone: string; // Zone name
  type: QuestStepType; // Step type for categorization
  zoneId: string; // Zone identifier for auto-completion
  completed?: boolean; // Completion state (set at runtime)
  reward?: string; // Reward text
  hint?: string; // Helpful tips for the step
  layoutTip?: string; // Zone layout guidance
  tags?: QuestTag[]; // Tags for filtering
}

export interface Act {
  actNumber: number;
  actName: string;
  steps: QuestStep[];
  expanded?: boolean; // UI state (set at runtime)
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
  questInfo?: {
    rewardType: 'quest' | 'vendor'; // quest = TAKE, vendor = BUY
    npc: string;
    questName: string;
    act: string;
  };
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
  characterClass?: string; // POE2 character class (Warrior, Ranger, Sorceress, Monk, Mercenary)
  skillSetName?: string; // Name of the skill set (e.g., "lvl 1-5", "Act 1")
}

export interface GemLoadout {
  id: string;
  name: string;
  gemProgression: GemProgression;
  passiveTree?: import('./passiveTree').PassiveTreeData; // Each loadout can have different tree allocations
}

export interface GemProgressionWithLoadouts {
  loadouts: GemLoadout[];
  activeLoadoutId: string;
  lastImported?: string;
}

export interface NotesData {
  userNotes: string;
  pobNotes?: string;
}

export interface ZoneInfo {
  id: string;
  name: string;
  normalizedName: string; // Lowercase, trimmed version for matching
}

export interface ZoneRegistry {
  version: string;
  game: string;
  zonesByAct: Array<{
    actNumber: number;
    zones: ZoneInfo[];
  }>;
}

export interface ActTimer {
  actNumber: number;
  startTime: number | null; // Timestamp when timer started (null if not started)
  elapsed: number; // Total elapsed time in milliseconds
  isRunning: boolean;
  completed: boolean; // Whether this act is finished
  completionTime?: number; // Final time when act was completed
}

export interface GlobalTimer {
  startTime: number | null; // When the speedrun started
  elapsed: number; // Total elapsed time in milliseconds
  isRunning: boolean;
  isPaused: boolean;
}

// Import passive tree types
import { PassiveTreeData } from "./passiveTree";

export interface TrackerData {
  acts: Act[];
  editMode?: boolean;
  gemProgression?: GemProgression;
  gemLoadouts?: GemProgressionWithLoadouts;
  notesData?: NotesData;
  itemCheckData?: ItemCheckData;
  passiveTreeData?: PassiveTreeData;
  actTimers?: ActTimer[]; // Timer state for each act
  globalTimer?: GlobalTimer; // Total speedrun timer
  currentActNumber?: number; // Current act player is in (from log detection)
  settings: {
    alwaysOnTop: boolean;
    opacity: number;
    fontSize?: number;
    hotkey?: string;
    showGemPanel?: boolean;
    showNotesPanel?: boolean;
    showRewardsPanel?: boolean;
    showRegexBuilderPanel?: boolean;
    showItemCheckPanel?: boolean;
    showTreePanel?: boolean;
    logFilePath?: string;
    logFileDetected?: boolean;
    autoCompleteQuests?: boolean; // Auto-complete when receiving rewards (Spirit, Resistance, etc.)
    autoCompleteOnZoneEntry?: boolean; // Auto-complete previous quests when entering new zones
    activeFilters?: QuestTag[];
    autoActTimers?: boolean; // Auto-start act timers when entering acts
    autoGlobalTimer?: boolean; // Auto-start global timer when entering Act 1
  };
}

export interface ItemModifier {
  text: string;
  type: 'enchant' | 'implicit' | 'explicit' | 'rune';
}

export interface ItemData {
  id: string;
  name: string;
  itemType: string; // Base type from line 4 (e.g., "Woven Cap", "Zealot Gauntlets")
  itemClass: string; // Item class (e.g., "Helmets", "Gloves")
  rarity: string; // "Normal", "Magic", "Rare", "Unique"
  level: number;
  ilvl: number;
  implicit: ItemModifier[];
  explicit: ItemModifier[];
  enchant: ItemModifier[];
  rune: ItemModifier[];
  requirements?: {
    level?: number;
    str?: number;
    dex?: number;
    int?: number;
  };
  sockets?: string;
  quality?: number;
  loadoutName?: string; // Which POB loadout this item belongs to
  slot?: string; // Item slot (e.g., "Weapon 1", "Helmet", "Ring 1")
}

export interface ItemMatchResult {
  loadoutName: string;
  pobItem: ItemData;
  matchPercentage: number;
  matchColor: string;
  details: {
    itemTypeMatch: boolean;
    rarityMatch: boolean;
    implicitMatches: number;
    explicitMatches: number;
    totalImplicits: number;
    totalExplicits: number;
  };
}

export interface ItemCheckData {
  pobItems: ItemData[]; // All items from all POB loadouts
  lastImported?: string;
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
      // Passive Tree Window APIs
      openTreeWindow: (passiveTreeData: any) => Promise<void>;
      closeTreeWindow: () => Promise<void>;
      minimizeTreeWindow: () => Promise<void>;
      startTreeWindowResize: (direction: string) => Promise<{ success: boolean; error?: string }>;
      resizeTreeWindow: (mouseX: number, mouseY: number) => Promise<{ success: boolean; error?: string }>;
      endTreeWindowResize: () => Promise<{ success: boolean; error?: string }>;
      isTreeWindowOpen: () => Promise<boolean>;
      sendTreeData: (passiveTreeData: any) => Promise<void>;
      savePassiveTreeData: (data: any) => Promise<{ success: boolean; error?: string }>;
      loadPassiveTreeData: () => Promise<any>;
      loadTreeStructure: (version?: string) => Promise<any>;
      getAssetsPath: () => Promise<string | null>;
      loadGemLoadouts: () => Promise<GemProgressionWithLoadouts | null>;
      switchTreeLoadout: (loadoutId: string) => Promise<any>;
      onPassiveTreeData: (callback: (data: any) => void) => () => void;
      onTreeWindowClosed: (callback: () => void) => () => void;
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
      startLogMonitoring: (filePath: string) => Promise<void>;
      stopLogMonitoring: () => Promise<void>;
      onLogReward: (callback: (rewardText: string) => void) => () => void;
      onZoneChanged: (callback: (zoneName: string) => void) => () => void;
    };
  }
}