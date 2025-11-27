// Tree asset loading utilities for the passive tree viewer
// Handles loading orbit frame images and other tree assets

import type { PositionedNode } from '../types/passiveTree';

// Get the base path for assets
// In production Electron, paths are relative to the HTML file location
// Use relative path './assets/' instead of absolute '/assets/'
const getAssetPath = (relativePath: string): string => {
  return `./assets/${relativePath}`;
};

// Cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

// Orbit frame types
export type OrbitFrameType = 'normal' | 'active' | 'intermediate';

// Interface for orbit frames (all three types for a given orbit size)
export interface OrbitFrames {
  normal: HTMLImageElement | null;
  active: HTMLImageElement | null;
  intermediate: HTMLImageElement | null;
}

// Orbit frame sizes in pixels (based on the extracted webp files)
// These are approximate and may need adjustment based on actual tree rendering
const ORBIT_SIZES: Record<number, number> = {
  0: 28,  // Smallest orbit nodes
  1: 32,
  2: 36,
  3: 40,
  4: 44,
  5: 48,
  6: 52,
  7: 56,
  8: 64,  // Larger nodes
  9: 72,  // Largest orbit nodes
};

/**
 * Load an image and cache it
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  // Return cached image if available
  const cached = imageCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  // Return existing loading promise if in progress
  const existingPromise = loadingPromises.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  // Create new loading promise
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      loadingPromises.delete(src);
      console.log(`Loaded image: ${src} (${img.width}x${img.height})`);
      resolve(img);
    };
    img.onerror = (error) => {
      loadingPromises.delete(src);
      console.error(`Failed to load image: ${src}`, error);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });

  loadingPromises.set(src, promise);
  return promise;
};

/**
 * Get the image path for an orbit frame
 */
export const getOrbitFramePath = (type: OrbitFrameType, orbitIndex: number): string => {
  // Clamp orbit index to valid range (0-9)
  const index = Math.max(0, Math.min(9, orbitIndex));
  return getAssetPath(`tree/orbit_${type}${index}.webp`);
};

/**
 * Load all orbit frame images for a specific type
 */
export const loadOrbitFrames = async (type: OrbitFrameType): Promise<Map<number, HTMLImageElement>> => {
  const frames = new Map<number, HTMLImageElement>();
  
  const loadPromises = [];
  for (let i = 0; i <= 9; i++) {
    const path = getOrbitFramePath(type, i);
    loadPromises.push(
      loadImage(path)
        .then(img => frames.set(i, img))
        .catch(err => {
          console.warn(`Could not load orbit frame ${type}${i}:`, err);
        })
    );
  }
  
  await Promise.all(loadPromises);
  return frames;
};

/**
 * Preload all orbit frame types (normal, active, intermediate)
 */
export const preloadOrbitFrames = async (): Promise<{
  normal: Map<number, HTMLImageElement>;
  active: Map<number, HTMLImageElement>;
  intermediate: Map<number, HTMLImageElement>;
}> => {
  const [normal, active, intermediate] = await Promise.all([
    loadOrbitFrames('normal'),
    loadOrbitFrames('active'),
    loadOrbitFrames('intermediate'),
  ]);
  
  return { normal, active, intermediate };
};

// Cache for combined orbit frames
const orbitFramesCache = new Map<number, OrbitFrames>();

/**
 * Get all orbit frame images (normal, active, intermediate) for a specific orbit index
 */
export const getOrbitFrames = async (orbitIndex: number): Promise<OrbitFrames> => {
  const index = Math.max(0, Math.min(9, orbitIndex));
  
  // Return cached if available
  const cached = orbitFramesCache.get(index);
  if (cached) {
    return cached;
  }
  
  // Load all three frame types for this orbit
  const [normal, active, intermediate] = await Promise.all([
    loadImage(getOrbitFramePath('normal', index)).catch(() => null),
    loadImage(getOrbitFramePath('active', index)).catch(() => null),
    loadImage(getOrbitFramePath('intermediate', index)).catch(() => null),
  ]);
  
  const frames: OrbitFrames = { normal, active, intermediate };
  orbitFramesCache.set(index, frames);
  return frames;
};

/**
 * Get the appropriate size for a node based on its type and orbit
 * Returns both radius (for circle drawing) and frameSize (for image rendering)
 */
export const getNodeSize = (node: PositionedNode): { radius: number; frameSize: number } => {
  // Base sizes for different node types
  let baseRadius = 20;
  let frameScale = 1.0;
  
  if (node.classStartIndex !== undefined) {
    // Class start nodes are largest
    baseRadius = 40;
    frameScale = 2.5;
  } else if (node.isKeystone) {
    baseRadius = 35;
    frameScale = 2.0;
  } else if (node.isNotable) {
    baseRadius = 28;
    frameScale = 1.5;
  } else if (node.isMastery) {
    baseRadius = 30;
    frameScale = 1.6;
  } else if (node.isJewelSocket) {
    baseRadius = 25;
    frameScale = 1.3;
  } else if (node.ascendancyName) {
    // Ascendancy nodes - size based on notable status
    baseRadius = node.isNotable ? 28 : 22;
    frameScale = node.isNotable ? 1.5 : 1.1;
  } else {
    // Normal small passives
    baseRadius = 18;
    frameScale = 1.0;
  }
  
  // Get orbit-based frame size
  const orbitIndex = node.orbit ?? 0;
  const clampedOrbit = Math.max(0, Math.min(9, orbitIndex));
  const orbitSize = ORBIT_SIZES[clampedOrbit] || ORBIT_SIZES[0];
  
  return {
    radius: baseRadius,
    frameSize: orbitSize * frameScale,
  };
};

/**
 * Determine which orbit frame index to use based on node properties
 * This maps the node to the appropriate frame index (0-9)
 */
export const getOrbitFrameIndex = (node: PositionedNode): number => {
  const orbit = node.orbit;
  
  // If no orbit defined, determine by node type
  if (orbit === undefined) {
    if (node.isKeystone) return 5;
    if (node.isNotable) return 3;
    if (node.isMastery) return 4;
    if (node.classStartIndex !== undefined) return 7;
    return 0;
  }
  
  // Map orbit values to frame indices
  // The frame indices 0-9 correspond to different sized frames
  if (orbit >= 0 && orbit <= 9) {
    return orbit;
  }
  
  // For larger orbit values, map them to the available range
  return Math.min(9, orbit);
};

/**
 * Load the tree background image
 */
export const loadTreeBackground = (): Promise<HTMLImageElement> => {
  return loadImage(getAssetPath('tree/background.webp'));
};

/**
 * Load a skill icon sprite sheet
 */
export const loadSkillSpriteSheet = (sheetName: string): Promise<HTMLImageElement> => {
  return loadImage(getAssetPath(`tree/${sheetName}.webp`));
};

/**
 * Clear the image cache (useful for memory management)
 */
export const clearImageCache = (): void => {
  imageCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { cached: number; loading: number } => {
  return {
    cached: imageCache.size,
    loading: loadingPromises.size,
  };
};
