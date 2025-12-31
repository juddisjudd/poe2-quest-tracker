/**
 * Gem Image Mapper
 * Maps gem display names to their corresponding image assets
 *
 * Gem images are stored in /assets/gems/ and loaded via direct URL paths
 * Using string paths instead of imports to avoid file:// URL issues in Electron
 */

// Fallback images for different gem types
// These are located in assets/gems/ along with the specific gem images
const FALLBACK_IMAGES = {
  skill: '/assets/gems/uncutskillgem.webp',
  spirit: '/assets/gems/uncutskillgembuff.webp',
  support: '/assets/gems/uncutsupportgem.webp',
};

/**
 * Normalize gem name to match filesystem naming convention
 * - Remove spaces, apostrophes, special characters
 * - Convert to lowercase
 * - Add skillgem/supportgem suffix based on type
 */
function normalizeGemName(gemName: string, gemType: 'skill' | 'spirit' | 'support'): string {
  const normalized = gemName
    .toLowerCase()
    // Remove possessive apostrophes and spaces
    .replace(/[''\s-]/g, '')
    // Handle special characters
    .replace(/&/g, 'and')
    // Remove any remaining special characters
    .replace(/[^a-z0-9]/g, '');

  // Add suffix based on gem type
  // Most gem files have 'skillgem' or 'supportgem' suffix
  if (gemType === 'support') {
    return `${normalized}supportgem`;
  } else {
    // skill and spirit gems use 'skillgem' suffix
    return `${normalized}skillgem`;
  }
}

/**
 * Special case mappings for gems that don't follow the standard naming pattern
 * This handles edge cases where the display name doesn't directly map to the filename
 */
const SPECIAL_CASES: Record<string, string> = {
  // Add any special mappings here as we discover them
  // Some gems don't have the skillgem/supportgem suffix
  'animate weapon': 'animateweapon',
  'backstab': 'backstab',
  'charged attack': 'chargedattack',
  'cleave': 'cleave',
  'dominating blow': 'dominatingblow',
  'dual strike': 'dualstrike',
  'ethereal knives': 'etherealknives',
  'fireball': 'fireball',
  'flame link': 'flamelinkgem',
  'ghostly throw': 'ghostlythrow',
  'glacial hammer': 'glacialhammer',
  'lancing steel': 'lancingsteel',
  'shattering steel': 'shatteringsteel',
  'soul link': 'soullinkgem',
  'sweep': 'sweep',
  'whirling blades': 'whirlingblades',
  'charged dash': 'chargeddashgem',
  'quick dash': 'quickdashgem',
  'smite': 'smitegem',
};

/**
 * Get the image path for a gem by its display name
 * @param gemName - The display name of the gem (e.g., "Fireball", "Glacial Hammer")
 * @param gemType - The type of gem (skill, spirit, support) for fallback
 * @param basePath - Optional base path for assets (used in Electron mode)
 * @returns The path to the gem image asset
 */
export function getGemImage(
  gemName: string,
  gemType: 'skill' | 'spirit' | 'support' = 'skill',
  basePath: string = ''
): string {
  if (!gemName) {
    return basePath ? `${basePath}/gems/${FALLBACK_IMAGES[gemType].replace('/assets/gems/', '')}` : FALLBACK_IMAGES[gemType];
  }

  const lowerName = gemName.toLowerCase();

  // Check special cases first
  if (SPECIAL_CASES[lowerName]) {
    const filename = `${SPECIAL_CASES[lowerName]}.webp`;
    return basePath ? `${basePath}/gems/${filename}` : `/assets/gems/${filename}`;
  }

  // Try normalized name with suffix
  const normalized = normalizeGemName(gemName, gemType);
  const filename = `${normalized}.webp`;
  return basePath ? `${basePath}/gems/${filename}` : `/assets/gems/${filename}`;
}

