import { ItemData, ItemModifier } from '../types';

/**
 * Parse an item from text copied from the game
 */
export function parseItemFromText(itemText: string): ItemData | null {
  if (!itemText.trim()) return null;

  const lines = itemText.trim().split('\n').map(line => line.trim());
  if (lines.length < 4) return null;

  let lineIndex = 0;

  const itemClassMatch = lines[lineIndex]?.match(/^Item Class:\s*(.+)$/);
  if (!itemClassMatch) return null;
  const itemClass = itemClassMatch[1];
  lineIndex++;

  const rarityMatch = lines[lineIndex]?.match(/^Rarity:\s*(.+)$/);
  if (!rarityMatch) return null;
  const rarity = rarityMatch[1];
  lineIndex++;

  const name = lines[lineIndex++] || 'Unknown';
  const itemType = lines[lineIndex++] || 'Unknown';

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

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    if (line === '--------') {
      lineIndex++;
      continue;
    }

    const qualityMatch = line.match(/^Quality:\s*\+?(\d+)%/);
    if (qualityMatch) {
      quality = parseInt(qualityMatch[1]);
      lineIndex++;
      continue;
    }

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

    const socketsMatch = line.match(/^Sockets:\s*(.+)$/);
    if (socketsMatch) {
      sockets = socketsMatch[1];
      lineIndex++;
      continue;
    }

    const ilvlMatch = line.match(/^Item Level:\s*(\d+)$/);
    if (ilvlMatch) {
      ilvl = parseInt(ilvlMatch[1]);
      lineIndex++;
      continue;
    }

    if (line.match(/^(Physical|Lightning|Fire|Cold|Chaos) Damage:|^Critical Hit Chance:|^Attacks per Second:|^Evasion Rating:|^Armour:|^Energy Shield:/)) {
      lineIndex++;
      continue;
    }

    if (line.trim().length > 0) {
      const modifier = parseModifierLine(line);
      if (modifier) {
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

function parseModifierLine(line: string): ItemModifier | null {
  if (!line.trim()) return null;

  let type: ItemModifier['type'] = 'explicit';

  if (line.includes('(enchant)')) {
    type = 'enchant';
  } else if (line.includes('(implicit)')) {
    type = 'implicit';
  } else if (line.includes('(rune)')) {
    type = 'rune';
  } else if (line.includes('(crafted)') || line.includes('(desecrated)')) {
    type = 'explicit';
  } else if (line.includes('(augmented)') || line.includes('(lightning)') || line.includes('(fire)') || line.includes('(cold)')) {
    return null;
  }

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
  const ITEM_TYPE_WEIGHT = 20;
  const RARITY_WEIGHT = 10;
  const IMPLICIT_WEIGHT = 20;
  const EXPLICIT_WEIGHT = 50;

  let score = 0;
  const details = {
    itemTypeMatch: false,
    rarityMatch: false,
    implicitMatches: 0,
    explicitMatches: 0,
    totalImplicits: pastedItem.implicit.length,
    totalExplicits: pastedItem.explicit.length
  };

  if (normalizeText(pastedItem.itemType) === normalizeText(pobItem.itemType)) {
    score += ITEM_TYPE_WEIGHT;
    details.itemTypeMatch = true;
  }

  if (pastedItem.rarity === pobItem.rarity) {
    score += RARITY_WEIGHT;
    details.rarityMatch = true;
  }

  if (pastedItem.implicit.length > 0) {
    for (const pastedMod of pastedItem.implicit) {
      if (pobItem.implicit.some(pobMod => modsMatch(pastedMod.text, pobMod.text))) {
        details.implicitMatches++;
      }
    }
    const implicitMatchRatio = details.implicitMatches / pastedItem.implicit.length;
    score += IMPLICIT_WEIGHT * implicitMatchRatio;
  } else {
    score += IMPLICIT_WEIGHT;
  }

  if (pastedItem.explicit.length > 0) {
    for (const pastedMod of pastedItem.explicit) {
      if (pobItem.explicit.some(pobMod => modsMatch(pastedMod.text, pobMod.text))) {
        details.explicitMatches++;
      }
    }
    const explicitMatchRatio = details.explicitMatches / pastedItem.explicit.length;
    score += EXPLICIT_WEIGHT * explicitMatchRatio;
  } else {
    score += EXPLICIT_WEIGHT;
  }

  return {
    matchPercentage: Math.round(score),
    details
  };
}

function modsMatch(mod1: string, mod2: string): boolean {
  const normalize = (text: string) => text
    .toLowerCase()
    .replace(/\+?\d+(\.\d+)?/g, 'X')
    .replace(/\s+/g, ' ')
    .trim();

  return normalize(mod1) === normalize(mod2);
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

export function getMatchColor(percentage: number): string {
  if (percentage >= 90) return '#22c55e'; // Green
  if (percentage >= 70) return '#eab308'; // Yellow
  if (percentage >= 50) return '#f97316'; // Orange
  return '#ef4444'; // Red
}
