import { ItemData, ItemModifier } from '../types';

/**
 * Parse an item from text copied from the game
 */
export function parseItemFromText(itemText: string): ItemData | null {
  if (!itemText.trim()) return null;

  const lines = itemText.trim().split('\n').map(line => line.trim());
  if (lines.length < 4) return null; // Need at least: Item Class, Rarity, Name, Base Type

  let lineIndex = 0;

  // Parse Item Class
  const itemClassMatch = lines[lineIndex]?.match(/^Item Class:\s*(.+)$/);
  if (!itemClassMatch) return null;
  const itemClass = itemClassMatch[1];
  lineIndex++;

  // Parse Rarity
  const rarityMatch = lines[lineIndex]?.match(/^Rarity:\s*(.+)$/);
  if (!rarityMatch) return null;
  const rarity = rarityMatch[1];
  lineIndex++;

  // Parse Name and Item Type (base type)
  const name = lines[lineIndex++] || 'Unknown';
  const itemType = lines[lineIndex++] || 'Unknown'; // This is line 4, the "item type"

  // Skip separator lines
  while (lineIndex < lines.length && lines[lineIndex] === '--------') {
    lineIndex++;
  }

  const implicit: ItemModifier[] = [];
  const explicit: ItemModifier[] = [];
  const enchant: ItemModifier[] = [];
  const rune: ItemModifier[] = [];

  let level = 1;
  let ilvl = 1;
  let quality = 0;
  let requirements: ItemData['requirements'] = {};
  let sockets = '';

  // Parse properties and modifiers
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    if (line === '--------') {
      lineIndex++;
      continue;
    }

    // Parse Quality
    const qualityMatch = line.match(/^Quality:\s*\+?(\d+)%/);
    if (qualityMatch) {
      quality = parseInt(qualityMatch[1]);
      lineIndex++;
      continue;
    }

    // Parse Requirements
    const reqMatch = line.match(/^Requires:\s*(.+)$/);
    if (reqMatch) {
      const reqText = reqMatch[1];
      const levelMatch = reqText.match(/Level\s+(\d+)/);
      const strMatch = reqText.match(/(\d+)\s+Str/);
      const dexMatch = reqText.match(/(\d+)\s+Dex/);
      const intMatch = reqText.match(/(\d+)\s+Int/);

      if (levelMatch) {
        level = parseInt(levelMatch[1]);
        requirements.level = level;
      }
      if (strMatch) requirements.str = parseInt(strMatch[1]);
      if (dexMatch) requirements.dex = parseInt(dexMatch[1]);
      if (intMatch) requirements.int = parseInt(intMatch[1]);

      lineIndex++;
      continue;
    }

    // Parse Sockets
    const socketsMatch = line.match(/^Sockets:\s*(.+)$/);
    if (socketsMatch) {
      sockets = socketsMatch[1];
      lineIndex++;
      continue;
    }

    // Parse Item Level
    const ilvlMatch = line.match(/^Item Level:\s*(\d+)$/);
    if (ilvlMatch) {
      ilvl = parseInt(ilvlMatch[1]);
      lineIndex++;
      continue;
    }

    // Skip base properties (damage, crit chance, attacks per second, defences)
    if (line.match(/^(Physical|Lightning|Fire|Cold|Chaos) Damage:|^Critical Hit Chance:|^Attacks per Second:|^Evasion Rating:|^Armour:|^Energy Shield:/)) {
      lineIndex++;
      continue;
    }

    // Parse modifiers
    if (line.trim().length > 0) {
      const modifier = parseModifierLine(line);
      if (modifier) {
        // Categorize modifier
        if (modifier.type === 'enchant') {
          enchant.push(modifier);
        } else if (modifier.type === 'implicit') {
          implicit.push(modifier);
        } else if (modifier.type === 'rune') {
          rune.push(modifier);
        } else {
          explicit.push(modifier);
        }
      }
    }

    lineIndex++;
  }

  return {
    id: generateItemId(name, itemType),
    name,
    itemType,
    itemClass,
    rarity,
    level,
    ilvl,
    implicit,
    explicit,
    enchant,
    rune,
    requirements,
    sockets: sockets || undefined,
    quality: quality || undefined
  };
}

/**
 * Parse a single modifier line
 */
function parseModifierLine(line: string): ItemModifier | null {
  if (!line.trim()) return null;

  // Determine modifier type based on indicators
  let type: ItemModifier['type'] = 'explicit'; // default

  if (line.includes('(enchant)')) {
    type = 'enchant';
  } else if (line.includes('(implicit)')) {
    type = 'implicit';
  } else if (line.includes('(rune)')) {
    type = 'rune';
  } else if (line.includes('(crafted)') || line.includes('(desecrated)')) {
    type = 'explicit'; // Treat crafted/desecrated as explicit
  } else if (line.includes('(augmented)') || line.includes('(lightning)') || line.includes('(fire)') || line.includes('(cold)')) {
    // These are base properties, skip them
    return null;
  }

  // Clean the line text (remove type indicators)
  const cleanText = line
    .replace(/\s*\((enchant|implicit|crafted|rune|desecrated|augmented|lightning|fire|cold)\)\s*$/g, '')
    .trim();

  return {
    text: cleanText,
    type
  };
}

/**
 * Generate a unique ID for an item based on its name and type
 */
function generateItemId(name: string, itemType: string): string {
  return `${name}-${itemType}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Calculate match percentage between pasted item and POB item
 */
export function calculateItemMatch(pastedItem: ItemData, pobItem: ItemData): {
  matchPercentage: number;
  details: {
    itemTypeMatch: boolean;
    rarityMatch: boolean;
    implicitMatches: number;
    explicitMatches: number;
    totalImplicits: number;
    totalExplicits: number;
  };
} {
  // Item class must match (already filtered before calling this)

  // Calculate weights
  const ITEM_TYPE_WEIGHT = 20; // 20% for matching item type
  const RARITY_WEIGHT = 10;    // 10% for matching rarity
  const IMPLICIT_WEIGHT = 20;  // 20% for implicit mods
  const EXPLICIT_WEIGHT = 50;  // 50% for explicit mods

  let score = 0;
  const details = {
    itemTypeMatch: false,
    rarityMatch: false,
    implicitMatches: 0,
    explicitMatches: 0,
    totalImplicits: pastedItem.implicit.length,
    totalExplicits: pastedItem.explicit.length
  };

  // Check item type match (line 4 - e.g., "Woven Cap", "Zealot Gauntlets")
  if (normalizeText(pastedItem.itemType) === normalizeText(pobItem.itemType)) {
    score += ITEM_TYPE_WEIGHT;
    details.itemTypeMatch = true;
  }

  // Check rarity match
  if (pastedItem.rarity === pobItem.rarity) {
    score += RARITY_WEIGHT;
    details.rarityMatch = true;
  }

  // Check implicit mods
  if (pastedItem.implicit.length > 0) {
    for (const pastedMod of pastedItem.implicit) {
      if (pobItem.implicit.some(pobMod => modsMatch(pastedMod.text, pobMod.text))) {
        details.implicitMatches++;
      }
    }
    const implicitMatchRatio = details.implicitMatches / pastedItem.implicit.length;
    score += IMPLICIT_WEIGHT * implicitMatchRatio;
  } else {
    // No implicits to match, give full points
    score += IMPLICIT_WEIGHT;
  }

  // Check explicit mods
  if (pastedItem.explicit.length > 0) {
    for (const pastedMod of pastedItem.explicit) {
      if (pobItem.explicit.some(pobMod => modsMatch(pastedMod.text, pobMod.text))) {
        details.explicitMatches++;
      }
    }
    const explicitMatchRatio = details.explicitMatches / pastedItem.explicit.length;
    score += EXPLICIT_WEIGHT * explicitMatchRatio;
  } else {
    // No explicits to match, give full points
    score += EXPLICIT_WEIGHT;
  }

  return {
    matchPercentage: Math.round(score),
    details
  };
}

/**
 * Check if two modifier texts are similar (same type, values can differ)
 */
function modsMatch(mod1: string, mod2: string): boolean {
  // Normalize both modifiers (replace numbers with X)
  const normalize = (text: string) => text
    .toLowerCase()
    .replace(/\+?\d+(\.\d+)?/g, 'X') // Replace numbers with X
    .replace(/\s+/g, ' ')
    .trim();

  return normalize(mod1) === normalize(mod2);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Get color based on match percentage
 */
export function getMatchColor(percentage: number): string {
  if (percentage >= 90) return '#22c55e'; // Green
  if (percentage >= 70) return '#eab308'; // Yellow
  if (percentage >= 50) return '#f97316'; // Orange
  return '#ef4444'; // Red
}
