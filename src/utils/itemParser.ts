import { ItemData, ItemModifier, ItemCheckResult } from '../types';

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

  // Parse Name and Base Type
  const name = lines[lineIndex++] || 'Unknown';
  const baseType = lines[lineIndex++] || 'Unknown';

  // Skip separator lines and parse other properties
  while (lineIndex < lines.length && lines[lineIndex] === '--------') {
    lineIndex++;
  }

  const modifiers: ItemModifier[] = [];
  let level = 1;
  let ilvl = 1;
  let quality = 0;
  let requirements: ItemData['requirements'] = {};
  let sockets = '';

  // Parse properties until we hit modifiers
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

    // Skip damage, critical hit chance, etc. (base properties)
    if (line.match(/^(Physical|Lightning|Fire|Cold|Chaos) Damage:|^Critical Hit Chance:|^Attacks per Second:|^Evasion Rating:|^Armour:/)) {
      lineIndex++;
      continue;
    }

    // Parse modifiers
    if (line.trim().length > 0 && !line.startsWith('--------')) {
      const modifier = parseModifierLine(line);
      if (modifier) {
        modifiers.push(modifier);
      }
    }

    lineIndex++;
  }

  return {
    id: generateItemId(name, baseType),
    name,
    baseType,
    itemClass,
    rarity,
    level,
    ilvl,
    modifiers,
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
  let type: ItemModifier['type'] = 'prefix'; // default

  if (line.includes('(implicit)')) {
    type = 'implicit';
  } else if (line.includes('(crafted)')) {
    type = 'crafted';
  } else if (line.includes('(rune)')) {
    type = 'rune';
  } else if (line.includes('(desecrated)')) {
    type = 'desecrated';
  } else if (line.includes('(augmented)') || line.includes('(lightning)') || line.includes('(fire)') || line.includes('(cold)')) {
    // These are usually base properties, skip
    return null;
  } else {
    // Try to determine if it's prefix or suffix based on common patterns
    if (line.match(/^\+?\d+(\.\d+)?%?\s+to\s+/) || line.match(/^Adds\s+/) || line.match(/^\+\d+\s+to\s+Level/)) {
      type = 'prefix';
    } else if (line.match(/\+?\d+(\.\d+)?%?\s+(increased|more|reduced|less)\s+/) || line.match(/\s+Resistance$/)) {
      type = 'suffix';
    }
  }

  // Clean the line text (remove type indicators)
  const cleanText = line
    .replace(/\s*\((implicit|crafted|rune|desecrated|augmented|lightning|fire|cold)\)\s*$/g, '')
    .trim();

  return {
    text: cleanText,
    type
  };
}

/**
 * Generate a unique ID for an item based on its name and base type
 */
function generateItemId(name: string, baseType: string): string {
  return `${name}-${baseType}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Enhanced scoring result with detailed match information
 */
interface EnhancedScoreResult {
  prefixMatches: number;
  suffixMatches: number;
  totalMatches: number;
  score: number;
  recommendation: 'keep' | 'vendor' | 'consider';
  quality: 'perfect' | 'excellent' | 'good' | 'poor';
  matchDetails: {
    exactModMatches: number;
    goodModMatches: number;
    poorModMatches: number;
    baseTypeBonus: number;
  };
}

/**
 * Enhanced compare function with sophisticated value matching scoring
 */
export function compareItems(sourceItem: ItemData, targetItem: ItemData): {
  prefixMatches: number;
  suffixMatches: number;
  totalMatches: number;
  score: number;
  recommendation: 'keep' | 'vendor' | 'consider';
} {
  const enhanced = compareItemsEnhanced(sourceItem, targetItem);
  return {
    prefixMatches: enhanced.prefixMatches,
    suffixMatches: enhanced.suffixMatches,
    totalMatches: enhanced.totalMatches,
    score: enhanced.score,
    recommendation: enhanced.recommendation
  };
}

/**
 * Enhanced item comparison with sophisticated value-aware scoring
 */
function compareItemsEnhanced(sourceItem: ItemData, targetItem: ItemData): EnhancedScoreResult {
  // Only compare items of the same class
  if (sourceItem.itemClass !== targetItem.itemClass) {
    return {
      prefixMatches: 0,
      suffixMatches: 0,
      totalMatches: 0,
      score: 0,
      recommendation: 'vendor',
      quality: 'poor',
      matchDetails: { exactModMatches: 0, goodModMatches: 0, poorModMatches: 0, baseTypeBonus: 0 }
    };
  }

  const sourcePrefixes = sourceItem.modifiers.filter(m => m.type === 'prefix');
  const sourceSuffixes = sourceItem.modifiers.filter(m => m.type === 'suffix');
  const targetPrefixes = targetItem.modifiers.filter(m => m.type === 'prefix');
  const targetSuffixes = targetItem.modifiers.filter(m => m.type === 'suffix');

  // Enhanced matching with value consideration
  let prefixMatches = 0;
  let suffixMatches = 0;
  let totalSimilarityScore = 0;
  let exactModMatches = 0;
  let goodModMatches = 0;
  let poorModMatches = 0;

  // Compare prefixes
  for (const sourcePrefix of sourcePrefixes) {
    let bestMatch: ModifierMatch | null = null;
    for (const targetPrefix of targetPrefixes) {
      const match = compareModifiers(sourcePrefix.text, targetPrefix.text);
      if (match.similar && (!bestMatch || match.similarity > bestMatch.similarity)) {
        bestMatch = match;
      }
    }
    if (bestMatch) {
      prefixMatches++;
      totalSimilarityScore += bestMatch.similarity;
      
      if (bestMatch.valueMatch === 'exact') exactModMatches++;
      else if (bestMatch.valueMatch === 'good') goodModMatches++;
      else if (bestMatch.valueMatch === 'poor') poorModMatches++;
    }
  }

  // Compare suffixes
  for (const sourceSuffix of sourceSuffixes) {
    let bestMatch: ModifierMatch | null = null;
    for (const targetSuffix of targetSuffixes) {
      const match = compareModifiers(sourceSuffix.text, targetSuffix.text);
      if (match.similar && (!bestMatch || match.similarity > bestMatch.similarity)) {
        bestMatch = match;
      }
    }
    if (bestMatch) {
      suffixMatches++;
      totalSimilarityScore += bestMatch.similarity;
      
      if (bestMatch.valueMatch === 'exact') exactModMatches++;
      else if (bestMatch.valueMatch === 'good') goodModMatches++;
      else if (bestMatch.valueMatch === 'poor') poorModMatches++;
    }
  }

  const totalMatches = prefixMatches + suffixMatches;
  const totalSourceMods = sourcePrefixes.length + sourceSuffixes.length;
  
  // Calculate base score from similarity scores (0-100)
  let score = 0;
  if (totalMatches > 0) {
    score = totalSimilarityScore / totalMatches; // Average similarity of matching mods
    // Weight by coverage (how many mods match vs total)
    const coverageRatio = totalSourceMods > 0 ? totalMatches / totalSourceMods : 0;
    score = score * (0.7 + 0.3 * coverageRatio); // 70% from quality, 30% from coverage
  }
  
  // Base type matching bonus
  const baseTypeMatch = isBaseTypeSimilar(sourceItem.baseType, targetItem.baseType);
  let baseTypeBonus = 0;
  if (baseTypeMatch.exactMatch) {
    baseTypeBonus = 25;
    score += baseTypeBonus;
  } else if (baseTypeMatch.categoryMatch) {
    baseTypeBonus = 15;
    score += baseTypeBonus;
  }
  
  // Cap the score at 100
  score = Math.min(score, 100);

  // Determine quality and recommendation based on sophisticated criteria
  let quality: 'perfect' | 'excellent' | 'good' | 'poor';
  let recommendation: 'keep' | 'vendor' | 'consider';

  // Perfect: Exact base type + all mods match with exact/good values
  if (baseTypeMatch.exactMatch && totalMatches === totalSourceMods && exactModMatches + goodModMatches === totalMatches) {
    quality = 'perfect';
    recommendation = 'keep';
  }
  // Excellent: Base type match + majority mods with good values OR perfect base + some exact matches
  else if ((baseTypeMatch.exactMatch && totalMatches >= Math.ceil(totalSourceMods * 0.75) && goodModMatches + exactModMatches >= Math.ceil(totalMatches * 0.75)) ||
           (baseTypeMatch.exactMatch && exactModMatches >= 2)) {
    quality = 'excellent';
    recommendation = 'keep';
  }
  // Good: Some base type compatibility + decent mod coverage OR very high mod match quality
  else if ((baseTypeMatch.categoryMatch && totalMatches >= Math.ceil(totalSourceMods * 0.6)) ||
           (totalMatches >= Math.ceil(totalSourceMods * 0.5) && exactModMatches + goodModMatches >= Math.ceil(totalMatches * 0.6)) ||
           (exactModMatches >= 1 && totalMatches >= 2)) {
    quality = 'good';
    recommendation = 'consider';
  }
  // Poor: Few matches or poor value matches
  else if (totalMatches >= 1 || baseTypeMatch.categoryMatch) {
    quality = 'poor';
    recommendation = 'consider';
  }
  else {
    quality = 'poor';
    recommendation = 'vendor';
  }

  return {
    prefixMatches,
    suffixMatches,
    totalMatches,
    score: Math.round(score),
    recommendation,
    quality,
    matchDetails: { exactModMatches, goodModMatches, poorModMatches, baseTypeBonus }
  };
}

/**
 * Compare two items and return detailed matching modifiers information
 */
export function compareItemsWithDetails(sourceItem: ItemData, targetItem: ItemData): {
  prefixMatches: number;
  suffixMatches: number;
  totalMatches: number;
  score: number;
  recommendation: 'keep' | 'vendor' | 'consider';
  baseTypeMatch: {
    exactMatch: boolean;
    categoryMatch: boolean;
  };
  matchingModifiers: {
    matchingPrefixes: { source: ItemModifier; target: ItemModifier }[];
    matchingSuffixes: { source: ItemModifier; target: ItemModifier }[];
  };
} {
  // Only compare items of the same class
  if (sourceItem.itemClass !== targetItem.itemClass) {
    return {
      prefixMatches: 0,
      suffixMatches: 0,
      totalMatches: 0,
      score: 0,
      recommendation: 'vendor',
      baseTypeMatch: { exactMatch: false, categoryMatch: false },
      matchingModifiers: {
        matchingPrefixes: [],
        matchingSuffixes: []
      }
    };
  }

  // Use enhanced scoring
  const enhanced = compareItemsEnhanced(sourceItem, targetItem);
  
  const sourcePrefixes = sourceItem.modifiers.filter(m => m.type === 'prefix');
  const sourceSuffixes = sourceItem.modifiers.filter(m => m.type === 'suffix');
  const targetPrefixes = targetItem.modifiers.filter(m => m.type === 'prefix');
  const targetSuffixes = targetItem.modifiers.filter(m => m.type === 'suffix');

  // Track matching modifiers (using enhanced comparison)
  const matchingPrefixes: { source: ItemModifier; target: ItemModifier }[] = [];
  const matchingSuffixes: { source: ItemModifier; target: ItemModifier }[] = [];

  // Find matching prefixes with best similarity matches
  for (const sourcePrefix of sourcePrefixes) {
    let bestTarget: ItemModifier | null = null;
    let bestMatch: ModifierMatch | null = null;
    
    for (const targetPrefix of targetPrefixes) {
      const match = compareModifiers(sourcePrefix.text, targetPrefix.text);
      if (match.similar && (!bestMatch || match.similarity > bestMatch.similarity)) {
        bestMatch = match;
        bestTarget = targetPrefix;
      }
    }
    
    if (bestTarget) {
      matchingPrefixes.push({ source: sourcePrefix, target: bestTarget });
    }
  }

  // Find matching suffixes with best similarity matches
  for (const sourceSuffix of sourceSuffixes) {
    let bestTarget: ItemModifier | null = null;
    let bestMatch: ModifierMatch | null = null;
    
    for (const targetSuffix of targetSuffixes) {
      const match = compareModifiers(sourceSuffix.text, targetSuffix.text);
      if (match.similar && (!bestMatch || match.similarity > bestMatch.similarity)) {
        bestMatch = match;
        bestTarget = targetSuffix;
      }
    }
    
    if (bestTarget) {
      matchingSuffixes.push({ source: sourceSuffix, target: bestTarget });
    }
  }

  const baseTypeMatch = isBaseTypeSimilar(sourceItem.baseType, targetItem.baseType);

  return {
    prefixMatches: enhanced.prefixMatches,
    suffixMatches: enhanced.suffixMatches,
    totalMatches: enhanced.totalMatches,
    score: enhanced.score,
    recommendation: enhanced.recommendation,
    baseTypeMatch,
    matchingModifiers: {
      matchingPrefixes,
      matchingSuffixes
    }
  };
}

/**
 * Check if two base types are similar for scoring purposes
 */
function isBaseTypeSimilar(baseType1: string, baseType2: string): {
  exactMatch: boolean;
  categoryMatch: boolean;
} {
  const normalize = (str: string) => str.toLowerCase().trim();
  const norm1 = normalize(baseType1);
  const norm2 = normalize(baseType2);
  
  // Exact match
  if (norm1 === norm2) {
    return { exactMatch: true, categoryMatch: true };
  }
  
  // Define base type categories for similar implicits
  const baseTypeCategories = [
    // Bows - typically have similar implicit damage/speed bonuses
    ['short bow', 'long bow', 'composite bow', 'recurve bow', 'hunting bow', 'war bow'],
    ['crossbow', 'heavy crossbow', 'siege crossbow'],
    
    // Staves - typically have spell damage implicits
    ['gnarled staff', 'quarterstaff', 'iron staff', 'coiled staff', 'royal staff', 'imperial staff'],
    ['war staff', 'lathi'],
    
    // Wands - spell damage and cast speed
    ['driftwood wand', 'goat\'s horn', 'carved wand', 'quartz wand', 'spiraled wand', 'demon\'s horn'],
    
    // Swords - physical damage implicits
    ['rusted sword', 'copper sword', 'sabre', 'broad sword', 'war sword', 'ancient sword'],
    ['foil', 'rapier', 'estoc', 'elegant sword'],
    
    // Axes - physical damage
    ['rusted axe', 'jade hatchet', 'boarding axe', 'cleaver', 'broad axe', 'battle axe'],
    ['tomahawk', 'war axe', 'siege axe'],
    
    // Maces - physical damage and stun
    ['driftwood club', 'tribal club', 'spiked club', 'stone hammer', 'war hammer', 'sledgehammer'],
    ['flanged mace', 'ornate mace', 'jagged mace'],
    
    // Armor pieces with similar defensive properties
    ['simple robe', 'silken vest', 'scholar\'s robe', 'sage\'s robe', 'silk robe', 'cabalist robe'],
    ['padded vest', 'oiled vest', 'ringmail vest', 'scale vest', 'chain vest', 'plate vest'],
    ['shabby jerkin', 'studded vest', 'burgonet', 'close helmet', 'aventail helmet'],
    
    // Shields - block and defense
    ['splintered tower shield', 'goathide buckler', 'pine buckler', 'painted buckler', 'war buckler'],
    
    // Jewelry - similar affix pools
    ['coral ring', 'iron ring', 'gold ring', 'steel ring', 'diamond ring'],
    ['coral amulet', 'amber amulet', 'jade amulet', 'lapis amulet', 'gold amulet'],
    
    // Belts
    ['rope belt', 'heavy belt', 'chain belt', 'studded belt', 'plated belt']
  ];
  
  // Check if both base types are in the same category
  for (const category of baseTypeCategories) {
    const inCategory1 = category.some(bt => norm1.includes(bt) || bt.includes(norm1));
    const inCategory2 = category.some(bt => norm2.includes(bt) || bt.includes(norm2));
    
    if (inCategory1 && inCategory2) {
      return { exactMatch: false, categoryMatch: true };
    }
  }
  
  // Check for partial matches (e.g., "Iron Sword" vs "Iron Blade")
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  // If they share significant words, consider them similar
  const sharedWords = words1.filter(word => words2.includes(word) && word.length > 2);
  if (sharedWords.length > 0 && (sharedWords.length / Math.max(words1.length, words2.length)) >= 0.5) {
    return { exactMatch: false, categoryMatch: true };
  }
  
  return { exactMatch: false, categoryMatch: false };
}

/**
 * Enhanced modifier comparison result with value matching information
 */
interface ModifierMatch {
  similar: boolean;
  valueMatch: 'exact' | 'good' | 'poor' | 'none';
  similarity: number; // 0-100
}

/**
 * Check if two modifier texts are similar and how well their values match
 */
function compareModifiers(mod1: string, mod2: string): ModifierMatch {
  // Extract values from both modifiers
  const values1 = extractNumbers(mod1);
  const values2 = extractNumbers(mod2);

  // Normalize both modifiers (replace numbers with X)
  const normalize = (text: string) => text
    .toLowerCase()
    .replace(/\+?\d+(\.\d+)?/g, 'X') // Replace numbers with X
    .replace(/\s+/g, ' ')
    .trim();

  const normalized1 = normalize(mod1);
  const normalized2 = normalize(mod2);

  // Check for exact match after normalization
  if (normalized1 !== normalized2) {
    // Check for common stat patterns
    const patterns = [
      /to\s+(maximum\s+)?(life|mana|energy\s+shield)/,
      /to\s+(fire|cold|lightning|chaos)\s+resistance/,
      /to\s+all\s+elemental\s+resistances/,
      /increased\s+(attack|cast|movement)\s+speed/,
      /increased\s+(physical|fire|cold|lightning|chaos)\s+damage/,
      /to\s+(strength|dexterity|intelligence)/,
      /to\s+accuracy\s+rating/,
      /to\s+evasion\s+rating/,
      /increased\s+evasion\s+rating/,
      /leech.*life/,
      /mana\s+regeneration/
    ];

    let patternMatch = false;
    for (const pattern of patterns) {
      if (pattern.test(normalized1) && pattern.test(normalized2)) {
        patternMatch = true;
        break;
      }
    }

    if (!patternMatch) {
      return { similar: false, valueMatch: 'none', similarity: 0 };
    }
  }

  // If we get here, the modifiers are similar in type
  // Now compare their values
  let valueMatch: 'exact' | 'good' | 'poor' | 'none' = 'none';
  let similarity = 50; // Base similarity for matching mod type

  if (values1.length > 0 && values2.length > 0) {
    // Compare values - for simplicity, compare first values
    const val1 = values1[0];
    const val2 = values2[0];
    
    if (val1 === val2) {
      valueMatch = 'exact';
      similarity = 100;
    } else {
      const ratio = Math.min(val1, val2) / Math.max(val1, val2);
      if (ratio >= 0.9) {
        valueMatch = 'good';
        similarity = 90;
      } else if (ratio >= 0.7) {
        valueMatch = 'good';
        similarity = 80;
      } else if (ratio >= 0.5) {
        valueMatch = 'poor';
        similarity = 70;
      } else {
        valueMatch = 'poor';
        similarity = 60;
      }
    }
  } else if (values1.length === 0 && values2.length === 0) {
    // Both have no values (e.g., "Cannot be Frozen"), perfect match
    valueMatch = 'exact';
    similarity = 100;
  } else {
    // One has values, one doesn't - still similar but poor value match
    valueMatch = 'poor';
    similarity = 60;
  }

  return { similar: true, valueMatch, similarity };
}

/**
 * Extract numeric values from a modifier string
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/\+?(\d+(?:\.\d+)?)/g);
  return matches ? matches.map(m => parseFloat(m.replace('+', ''))) : [];
}


/**
 * Check an item against a list of POB items
 */
export function checkItemAgainstPob(item: ItemData, pobItems: ItemData[]): ItemCheckResult {
  const matches = pobItems
    .filter(pobItem => pobItem.itemClass === item.itemClass)
    .map(pobItem => ({
      item: pobItem,
      ...compareItems(item, pobItem)
    }))
    .filter(match => match.totalMatches > 0)
    .sort((a, b) => b.score - a.score);

  // Get detailed info for the best match
  let bestMatch = undefined;
  if (matches.length > 0) {
    const detailedMatch = compareItemsWithDetails(item, matches[0].item);
    bestMatch = {
      item: matches[0].item,
      prefixMatches: detailedMatch.prefixMatches,
      suffixMatches: detailedMatch.suffixMatches,
      totalMatches: detailedMatch.totalMatches,
      score: detailedMatch.score,
      recommendation: detailedMatch.recommendation,
      baseTypeMatch: detailedMatch.baseTypeMatch,
      matchingModifiers: detailedMatch.matchingModifiers
    };
  }

  return {
    item,
    matches,
    bestMatch
  };
}

/**
 * Normalize item class names for better matching
 */
export function normalizeItemClass(itemClass: string): string {
  const classMap: Record<string, string> = {
    'Two Hand Swords': 'Two-Handed Swords',
    'Two Hand Axes': 'Two-Handed Axes',
    'Two Hand Maces': 'Two-Handed Maces',
    'One Hand Swords': 'One-Handed Swords',
    'One Hand Axes': 'One-Handed Axes',
    'One Hand Maces': 'One-Handed Maces',
    'Body Armours': 'Body Armour',
    'Boots': 'Boots',
    'Gloves': 'Gloves',
    'Helmets': 'Helmets',
    'Shields': 'Shields',
    'Belts': 'Belts',
    'Rings': 'Rings',
    'Amulets': 'Amulets',
    'Bows': 'Bows',
    'Crossbows': 'Crossbows',
    'Wands': 'Wands',
    'Staves': 'Staves'
  };

  return classMap[itemClass] || itemClass;
}