/**
 * Tree Data Loader - Loads and processes passive tree structure data
 * 
 * This module handles loading the full tree structure from JSON files
 * and computing node positions for rendering.
 * 
 * Position calculation follows POB's algorithm:
 * - Angles are computed from skillsPerOrbit (nodes evenly distributed around orbit)
 * - angle = (2π * orbitIndex) / skillsPerOrbit[orbit]
 * - x = group.x + sin(angle) * orbitRadius
 * - y = group.y - cos(angle) * orbitRadius
 * 
 * This means angle=0 points UP (negative Y), and angles increase clockwise.
 */

import type { FullTreeData, PositionedNode, PassiveTreeData } from '../types/passiveTree';

// Cache for loaded tree data
let treeDataCache: Map<string, FullTreeData> = new Map();
let positionedNodesCache: Map<string, Map<number, PositionedNode>> = new Map();

/**
 * Default orbit radii for position calculations
 * These values come from the tree.json constants.orbitRadii
 * Note: Lua arrays are 1-indexed, these are 0-indexed
 */
const DEFAULT_ORBIT_RADII = [0, 82, 162, 335, 493, 662, 846, 251, 1080, 1322];

/**
 * Number of nodes per orbit for angle calculations
 * These values come from the tree.json constants.skillsPerOrbit
 */
const DEFAULT_SKILLS_PER_ORBIT = [1, 12, 24, 24, 72, 72, 72, 24, 72, 144];

// Cache for precomputed orbit angles
let orbitAnglesCache: number[][] | null = null;

/**
 * Precompute orbit angles for all orbits
 * This matches POB's orbitAnglesByOrbit structure
 */
function getOrbitAngles(skillsPerOrbit: number[]): number[][] {
  if (orbitAnglesCache && orbitAnglesCache.length === skillsPerOrbit.length) {
    return orbitAnglesCache;
  }
  
  orbitAnglesCache = skillsPerOrbit.map((nodesInOrbit) => {
    const angles: number[] = [];
    for (let i = 0; i <= nodesInOrbit; i++) {
      // Evenly distribute nodes around the orbit
      // This generates angles from 0 to 2π
      angles.push((2 * Math.PI * i) / nodesInOrbit);
    }
    return angles;
  });
  
  return orbitAnglesCache;
}

/**
 * Calculate node position based on group position and orbit info
 * Uses POB's coordinate system:
 * - x = group.x + sin(angle) * radius
 * - y = group.y - cos(angle) * radius
 * This means angle=0 points UP, angles increase clockwise
 */
function calculateNodePosition(
  node: FullTreeData['nodes'][string],
  group: FullTreeData['groups'][string],
  orbitRadii: number[],
  skillsPerOrbit: number[]
): { x: number; y: number; angle: number } {
  const radius = orbitRadii[node.orbit] ?? 0;
  
  if (radius === 0) {
    // Node is at group center
    return { x: group.x, y: group.y, angle: 0 };
  }
  
  // Get precomputed orbit angles
  const orbitAngles = getOrbitAngles(skillsPerOrbit);
  const angles = orbitAngles[node.orbit];
  
  // Look up the angle for this node's orbitIndex
  // orbitIndex is 0-based in JSON, angles array is also 0-indexed
  const angle = angles && angles[node.orbitIndex] !== undefined 
    ? angles[node.orbitIndex] 
    : (2 * Math.PI * node.orbitIndex) / (skillsPerOrbit[node.orbit] || 1);
  
  // POB coordinate system: sin for X, -cos for Y
  // This makes angle=0 point UP (negative Y direction)
  return {
    x: group.x + Math.sin(angle) * radius,
    y: group.y - Math.cos(angle) * radius,
    angle,
  };
}

/**
 * Load tree data from JSON file
 * In production, this will be bundled or loaded from assets
 */
export async function loadTreeData(version: string = '0_3'): Promise<FullTreeData | null> {
  // Check cache first
  if (treeDataCache.has(version)) {
    return treeDataCache.get(version)!;
  }

  try {
    // In development/Electron, load from data directory
    // In production, this should be bundled or fetched from a CDN
    let data: FullTreeData;
    
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // Electron environment - load via IPC
      const response = await (window as any).electronAPI.loadTreeStructure?.(version);
      if (response) {
        data = response;
      } else {
        console.warn(`Tree data for version ${version} not available via IPC`);
        return null;
      }
    } else {
      // Browser environment - try to fetch from public assets
      const response = await fetch(`/data/tree/tree-${version}.min.json`);
      if (!response.ok) {
        console.warn(`Failed to load tree data: ${response.status}`);
        return null;
      }
      data = await response.json();
    }
    
    treeDataCache.set(version, data);
    return data;
  } catch (error) {
    console.error('Failed to load tree data:', error);
    return null;
  }
}

/**
 * Compute positioned nodes from tree data
 * This calculates actual x/y coordinates for each node
 */
export function computePositionedNodes(treeData: FullTreeData): Map<number, PositionedNode> {
  const cacheKey = treeData.version;
  
  // Check cache
  if (positionedNodesCache.has(cacheKey)) {
    return positionedNodesCache.get(cacheKey)!;
  }
  
  const positioned = new Map<number, PositionedNode>();
  const orbitRadii = treeData.constants?.orbitRadii || DEFAULT_ORBIT_RADII;
  const skillsPerOrbit = treeData.constants?.skillsPerOrbit || DEFAULT_SKILLS_PER_ORBIT;
  
  for (const [nodeId, node] of Object.entries(treeData.nodes)) {
    const group = treeData.groups[node.group.toString()];
    if (!group) {
      console.warn(`Node ${nodeId} references missing group ${node.group}`);
      continue;
    }
    
    const position = calculateNodePosition(node, group, orbitRadii, skillsPerOrbit);
    
    // Determine if this is a class start node
    const isClassStart = !!(node.classesStart && node.classesStart.length > 0);
    
    positioned.set(parseInt(nodeId, 10), {
      id: node.id,
      name: node.name,
      x: position.x,
      y: position.y,
      angle: position.angle,
      stats: node.stats,
      connections: node.connections.map(c => ({ id: c.id, orbit: c.orbit ?? 0 })),
      group: node.group,
      orbit: node.orbit,
      orbitIndex: node.orbitIndex,
      icon: node.icon,
      isNotable: node.isNotable,
      isKeystone: node.isKeystone,
      isMastery: node.isMastery,
      isJewelSocket: node.isJewelSocket,
      isOnlyImage: node.isOnlyImage,
      isClassStart,
      classesStart: node.classesStart,
      ascendancyName: node.ascendancyName,
      classStartIndex: node.classStartIndex,
    });
  }
  
  positionedNodesCache.set(cacheKey, positioned);
  return positioned;
}

/**
 * Get nodes visible within a viewport (for culling optimization)
 */
export function getVisibleNodes(
  nodes: Map<number, PositionedNode>,
  viewport: { x: number; y: number; width: number; height: number; scale: number },
  margin: number = 100
): PositionedNode[] {
  const visible: PositionedNode[] = [];
  
  // Calculate viewport bounds in world coordinates
  const left = viewport.x - margin / viewport.scale;
  const right = viewport.x + (viewport.width + margin) / viewport.scale;
  const top = viewport.y - margin / viewport.scale;
  const bottom = viewport.y + (viewport.height + margin) / viewport.scale;
  
  for (const node of nodes.values()) {
    if (node.x >= left && node.x <= right && node.y >= top && node.y <= bottom) {
      visible.push(node);
    }
  }
  
  return visible;
}

/**
 * Get tree bounds (min/max x/y from positioned nodes)
 */
export function getTreeBounds(nodes: Map<number, PositionedNode>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const node of nodes.values()) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get class info by ID
 */
export function getClassInfo(treeData: FullTreeData, classId: number) {
  return treeData.classes.find(c => c.id === classId);
}

/**
 * Get ascendancy info by class and ascendancy ID
 */
export function getAscendancyInfo(treeData: FullTreeData, classId: number, ascendId: string) {
  const classInfo = getClassInfo(treeData, classId);
  return classInfo?.ascendancies.find(a => a.id === ascendId || a.internalId === ascendId);
}

/**
 * Calculate stats summary from allocated nodes
 */
export function calculateTreeStats(
  allocatedNodes: number[],
  positionedNodes: Map<number, PositionedNode>
): Record<string, number> {
  const stats: Record<string, number> = {};
  
  for (const nodeId of allocatedNodes) {
    const node = positionedNodes.get(nodeId);
    if (!node) continue;
    
    for (const stat of node.stats) {
      // Parse stat string to extract value and stat name
      // Format: "+10 to Strength" or "10% increased Damage"
      const match = stat.match(/^([+-]?\d+(?:\.\d+)?%?)\s+(.+)$/);
      if (match) {
        const [, valueStr, statName] = match;
        const value = parseFloat(valueStr.replace('%', ''));
        stats[statName] = (stats[statName] || 0) + value;
      }
    }
  }
  
  return stats;
}

/**
 * Clear all cached data
 */
export function clearTreeCache(): void {
  treeDataCache.clear();
  positionedNodesCache.clear();
}

/**
 * Get the tree version from POB tree data
 */
export function getTreeVersion(passiveTreeData: PassiveTreeData): string {
  return passiveTreeData.treeVersion || '0_3';
}
