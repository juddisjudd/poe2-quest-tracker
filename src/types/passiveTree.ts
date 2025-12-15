/**
 * Passive Tree Types for Path of Exile 2
 * Based on PathOfBuilding-PoE2 tree data structure
 */

/**
 * Represents a single node in the passive tree
 */
export interface TreeNode {
  id: number;
  name: string;
  icon?: string;
  stats: string[];
  
  // Positioning
  group: number;
  orbit: number;
  orbitIndex: number;
  
  // Pre-calculated position (computed from group, orbit, orbitIndex)
  x?: number;
  y?: number;
  
  // Connections to other nodes
  connections: Array<{ id: number; orbit?: number }>;
  linkedId?: number[];
  
  // Node classification
  isNotable?: boolean;
  isKeystone?: boolean;
  type?: 'Normal' | 'Notable' | 'Keystone' | 'Mastery' | 'ClassStart' | 'AscendClassStart' | 'Socket';
  
  // Ascendancy
  ascendancyName?: string;
  
  // Mastery nodes (POE2 feature)
  recipe?: string[];
  activeEffectImage?: string;
  
  // Other
  skill?: number;
  reminderText?: string[];
}

/**
 * Represents a group of nodes in the passive tree
 */
export interface TreeGroup {
  id: number;
  x: number;
  y: number;
  nodes: number[];
  background?: {
    image?: string;
    isHalfImage?: boolean;
  };
}

/**
 * Represents an ascendancy class
 */
export interface AscendancyInfo {
  id: string;
  name: string;
  internalId?: string;
  background?: {
    x: number;
    y: number;
    image?: string;
  };
}

/**
 * Represents a character class
 */
export interface ClassInfo {
  id: number;
  name: string;
  startNodeId: number;
  baseStr: number;
  baseDex: number;
  baseInt: number;
  ascendancies: AscendancyInfo[];
  background?: {
    x: number;
    y: number;
    image?: string;
  };
}

/**
 * Tree constants for positioning calculations
 */
export interface TreeConstants {
  PSSCentreInnerRadius: number;
  characterAttributes: {
    Dexterity: number;
    Intelligence: number;
    Strength: number;
  };
  classes: {
    DexClass: number;
    DexIntClass: number;
    IntClass: number;
    StrClass: number;
    StrDexClass: number;
    StrDexIntClass: number;
    StrIntClass: number;
  };
  orbitAnglesByOrbit: Record<number, number[]>;
  orbitRadii?: Record<number, number>;
}

/**
 * Complete passive tree structure
 */
export interface PassiveTreeStructure {
  nodes: Map<number, TreeNode>;
  groups: Map<number, TreeGroup>;
  classes: Map<number, ClassInfo>;
  constants: TreeConstants;
  assets?: Record<string, string>;
  imageFiles?: Record<string, { file: string; w: number; h: number }>;
  treeVersion: string;
}

/**
 * Full tree structure loaded from tree-{version}.json
 * This is the complete tree data converted from PathOfBuilding
 */
export interface FullTreeData {
  version: string;
  classes: Array<{
    id: number;
    name: string;
    base_str: number;
    base_dex: number;
    base_int: number;
    ascendancies: Array<{
      id: string;
      name: string;
      internalId: string;
      background?: {
        x: number;
        y: number;
        image?: string;
        width?: number;
        height?: number;
      };
    }>;
    background?: {
      x: number;
      y: number;
      image?: string;
      width?: number;
      height?: number;
    };
  }>;
  groups: Record<string, {
    id: number;
    x: number;
    y: number;
    nodes: number[];
    orbits: number[];
  }>;
  nodes: Record<string, {
    id: number;
    name: string;
    icon?: string;
    stats: string[];
    group: number;
    orbit: number;
    orbitIndex: number;
    connections: Array<{ id: number; orbit?: number }>;
    isNotable?: boolean;
    isKeystone?: boolean;
    isMastery?: boolean;
    isJewelSocket?: boolean;
    isOnlyImage?: boolean;  // Mastery display nodes - should not be rendered as allocatable
    classesStart?: string[];  // Array of class names that start here (class start nodes)
    ascendancyName?: string;
    classStartIndex?: number;
    skill?: number;
  }>;
  constants: {
    orbitRadii: number[];
    skillsPerOrbit: number[];
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;
}

/**
 * Connection with optional orbit info for curved paths
 */
export interface NodeConnection {
  id: number;
  orbit: number; // 0 = straight line, non-zero = curved arc along that orbit
}

/**
 * Node with computed position for rendering
 */
export interface PositionedNode {
  id: number;
  name: string;
  x: number;
  y: number;
  angle: number; // The angle in radians from the group center (0 = up, clockwise)
  stats: string[];
  connections: NodeConnection[];
  group: number;
  orbit: number;
  orbitIndex: number;
  icon?: string;  // Path to the node icon (e.g., "Art/2DArt/SkillIcons/passives/damage.dds")
  isNotable?: boolean;
  isKeystone?: boolean;
  isMastery?: boolean;
  isJewelSocket?: boolean;
  isOnlyImage?: boolean;  // Mastery display nodes - should not be rendered as allocatable
  isClassStart?: boolean;  // True if this is a class start node
  classesStart?: string[];  // Array of class names that start here
  ascendancyName?: string;
  classStartIndex?: number;
}

/**
 * Passive tree data extracted from POB import
 * This is the basic data from the POB XML, not the full tree structure
 */
export interface PassiveTreeData {
  classId: number;
  className: string;
  ascendClassId: number;
  ascendClassName: string;
  secondaryAscendClassId?: number;
  secondaryAscendClassName?: string;
  allocatedNodes: number[];
  masterySelections: Map<number, number>; // nodeId -> effectId
  treeVersion: string;
  jewelSockets?: Map<number, number>; // nodeId -> itemId
  title?: string; // Optional title for this spec/loadout (e.g., "lvl 1-10", "Endgame")
}

/**
 * Extended passive tree data for rendering
 * Includes computed positions from tree structure data
 */
export interface PassiveTreeRenderData extends PassiveTreeData {
  nodes: Record<string, TreeNode>;
  groups?: Record<string, TreeGroup>;
  startPositions?: Record<string, { x: number; y: number }>;
  stats?: Record<string, number>;
  loaded: boolean;
}

/**
 * View state for the tree window
 */
export interface PassiveTreeViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  selectedNode: number | null;
}

/**
 * Viewport state for tree rendering
 */
export interface TreeViewport {
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Tree statistics calculated from allocated nodes
 */
export interface TreeStats {
  totalPoints: number;
  keystones: number;
  notables: number;
  normalNodes: number;
  masteries: number;
  attributePoints: {
    str: number;
    dex: number;
    int: number;
  };
}

/**
 * Class name mapping - POE2 classes (0-indexed)
 */
export const CLASS_NAMES: Record<number, string> = {
  0: 'Ranger',
  1: 'Huntress',
  2: 'Warrior',
  3: 'Mercenary',
  4: 'Druid',
  5: 'Witch',
  6: 'Sorceress',
  7: 'Monk',
};

/**
 * Ascendancy name mapping by class - POE2 ascendancies (0-indexed classes, 1-indexed ascendancies)
 */
export const ASCENDANCY_NAMES: Record<number, Record<number, string>> = {
  // Ranger (class 0)
  0: {
    1: 'Deadeye',
    2: 'Pathfinder',
  },
  // Huntress (class 1)
  1: {
    1: 'Amazon',
    2: 'Ritualist',
  },
  // Warrior (class 2)
  2: {
    1: 'Titan',
    2: 'Warbringer',
    3: 'Smith of Kitava',
  },
  // Mercenary (class 3)
  3: {
    1: 'Tactician',
    2: 'Witchhunter',
    3: 'Gemling Legionnaire',
  },
  // Druid (class 4)
  4: {
    1: 'Oracle',
    2: 'Shaman',
  },
  // Witch (class 5)
  5: {
    1: 'Infernalist',
    2: 'Blood Mage',
    3: 'Lich',
    4: 'Abyssal Lich',
  },
  // Sorceress (class 6)
  6: {
    1: 'Stormweaver',
    2: 'Chronomancer',
    3: 'Disciple of Varashta',
  },
  // Monk (class 7)
  7: {
    1: 'Invoker',
    2: 'Acolyte of Chayula',
  },
};

/**
 * Helper function to get class name by ID
 */
export function getClassName(classId: number): string {
  return CLASS_NAMES[classId] || `Class ${classId}`;
}

/**
 * Helper function to get ascendancy name by class and ascendancy ID
 */
export function getAscendancyName(classId: number, ascendClassId: number): string {
  if (ascendClassId === 0) {
    return 'None';
  }
  const classAscendancies = ASCENDANCY_NAMES[classId];
  if (!classAscendancies) {
    return `Ascendancy ${ascendClassId}`;
  }
  return classAscendancies[ascendClassId] || `Ascendancy ${ascendClassId}`;
}

/**
 * Default orbit radii (approximate values, may need tuning)
 */
export const DEFAULT_ORBIT_RADII: Record<number, number> = {
  0: 0,
  1: 40,
  2: 80,
  3: 120,
  4: 160,
  5: 200,
  6: 240,
  7: 280,
  8: 320,
  9: 360,
  10: 400,
};
