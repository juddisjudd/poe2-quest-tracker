/**
 * Path of Exile 2 log file parser for auto-completing quests
 */

import { getZoneInfo } from '../data/zoneRegistry';
import type { QuestStep } from '../types';

// Interface for parsed log rewards
export interface LogReward {
  timestamp: string;
  characterName: string;
  rewardType: 'resistance' | 'spirit' | 'life' | 'charm' | 'attributes' | 'passive' | 'other';
  rewardText: string;
  rawLine: string;
  location?: string; // Current scene/location when reward was received
}

// Interface for parsed scene changes
export interface LogScene {
  timestamp: string;
  location: string;
  zoneId?: string; // Zone ID from registry
  actNumber?: number; // Act number if found
  rawLine: string;
}

// Location-based quest reward mappings for permanent-buffs-guide.json
// Maps location -> quest ID -> reward patterns
const LOCATION_QUEST_MAPPINGS: Record<string, Record<string, string[]>> = {
  'Clearfell': {
    'a1-clearfell-beira': ['+10% to [Resistances|Cold Resistance]']
  },
  'Hunting Grounds': {
    'a1-hunting-crowbell': ['2 Passive Skill Points']
  },
  'Freythorn': {
    'a1-freythorn-king': ['+30 to [Spirit|Spirit]']
  },
  'Ogham Farmlands': {
    'a1-ogham-lute': ['2 Passive Skill Points']
  },
  'Clearfell Encampment': {
    'a1-ogham-lute': ['2 Passive Skill Points'] // Turn-in location for Una's Lute
  },
  'Ogham Manor': {
    'a1-manor-candlemass': ['+20 to maximum Life']
  },
  'Keth': {
    'a2-keth-kabala': ['2 Passive Skill Points']
  },
  'Valley of the Titans': {
    'a2-valley-titans': [
      '30% increased [Charm] Charges gained',
      '+1 [Charm] Slot', 
      '30% increased [Charm] Effect Duration'
    ]
  },
  'Deshar': {
    'a2-deshar-letter': ['2 Passive Skill Points']
  },
  'The Spires of Deshar': {
    'a2-spires-garukhan': ['+10% to [Resistances|Lightning Resistance]']
  },
  'Jungle Ruins': {
    'a3-jungle-silverfist': ['2 Passive Skill Points']
  },
  'The Venom Crypts': {
    'a3-venom-crypts': [
      '25% increased [StunThreshold|Stun Threshold]',
      '30% increased Elemental Ailment Threshold',
      '25% increased Mana Regeneration Rate'
    ]
  },
  'The Azak Bog': {
    'a3-azak-bog': ['+30 to [Spirit|Spirit]']
  },
  'Jiquani\'s Machinarium': {
    'a3-jiquani-blackjaw': ['+10% to [Resistances|Fire Resistance]']
  },
  'Aggorat': {
    'a3-aggorat-heart': ['2 Passive Skill Points']
  },
  'Abandoned Prison': {
    'a4-abandoned-prison': [
      '30% increased Mana Recovery from [Flask|Flasks]',
      '30% increased Life Recovery from [Flask|Flasks]'
    ]
  },
  'Wolvenhold': {
    'i1-wolvenhold-oswin': ['2 Passive Skill Points']
  },
  'The Khari Crossing': {
    'i2-khari-crossing': ['5% increased maximum']
  },
  'Qimah': {
    'i2-qimah-pillars': [
      '+5 to [Intelligence|Intelligence]',
      '+5% to [Resistances|Fire Resistance]',
      '12% Increased Cooldown Recovery Rate',
      '3% increased Movement Speed',
      '20% Increased Presence Area Of Effect',
      '15% Increased Global Defences',
      '5% Increased Experience Gain'
    ]
  },
  'Kriar Village': {
    'i3-kriar-village-lythara': ['+40 to [Spirit|Spirit]']
  },
  'Howling Caves': {
    'i3-howling-caves-yeti': ['2 Passive Skill Points']
  },
  // Special quest - "Clearing the Way" completion gives passive points but may not have specific location
  'General': {
    'i2-clearing-way': ['2 Passive Skill Points'],
    'i3-siege-oriath': ['2 Passive Skill Points']
  }
};


/**
 * Parse a log line to extract scene change information
 */
export function parseSceneLine(line: string): LogScene | null {
  // Pattern: [INFO Client XXXX] [SCENE] Set Source [LocationName]
  const scenePattern = /.*\[INFO Client \d+\] \[SCENE\] Set Source \[(.+?)\]/;
  const match = line.match(scenePattern);

  if (!match) {
    return null;
  }

  const [, location] = match;

  // Look up zone info from registry
  const zoneInfo = getZoneInfo(location);

  return {
    timestamp: new Date().toISOString(),
    location,
    zoneId: zoneInfo?.id,
    actNumber: zoneInfo?.actNumber,
    rawLine: line
  };
}

/**
 * Parse a log line to extract reward information
 * POE2 Format: Primarily uses "You have received X"
 */
export function parseLogLine(line: string, currentLocation?: string): LogReward | null {
  // Pattern 1: "You have received" (PRIMARY POE2 format - 260+ instances in logs)
  const youRewardPattern = /.*\[INFO Client \d+\] : You have received (.+?)\.?\s*$/;
  // Pattern 2: Character received reward (LEGACY - may not be used in POE2)
  const characterRewardPattern = /.*\[INFO Client \d+\] : (.+?) has received (.+?)\.?\s*$/;

  let match = line.match(youRewardPattern);
  let characterName = 'You';
  let rewardText = '';

  if (match) {
    // Primary format: "You have received X"
    rewardText = match[1];
  } else {
    // Try legacy format: "CharacterName has received X"
    match = line.match(characterRewardPattern);
    if (match) {
      characterName = match[1];
      rewardText = match[2];
    }
  }

  if (!match) {
    return null;
  }

  console.log('[POE2-PARSER] Parsed reward - Character:', characterName, 'Reward:', rewardText, 'Location:', currentLocation);

  // Extract timestamp from the beginning if it exists
  const timestamp = new Date().toISOString();

  // Determine reward type (enhanced for POE2)
  let rewardType: LogReward['rewardType'] = 'other';

  if (rewardText.includes('Passive Skill Points')) {
    // Check if it's weapon set, atlas, or regular passive points
    if (rewardText.includes('Weapon Set')) {
      rewardType = 'passive'; // Weapon Set Passive Points
    } else if (rewardText.includes('Atlas')) {
      rewardType = 'passive'; // Atlas Skill Points (endgame)
    } else {
      rewardType = 'passive'; // Regular Passive Points
    }
  } else if (rewardText.includes('Resistance') || rewardText.includes('[Resistances|')) {
    rewardType = 'resistance';
  } else if (rewardText.includes('Spirit') || rewardText.includes('[Spirit|')) {
    rewardType = 'spirit';
  } else if (rewardText.includes('maximum Life') || rewardText.includes('Life Recovery')) {
    rewardType = 'life';
  } else if (rewardText.includes('Charm') || rewardText.includes('[Charm]')) {
    rewardType = 'charm';
  } else if (rewardText.includes('Intelligence') || rewardText.includes('Strength') || rewardText.includes('Dexterity')) {
    rewardType = 'attributes';
  }

  return {
    timestamp,
    characterName,
    rewardType,
    rewardText,
    rawLine: line,
    location: currentLocation
  };
}

/**
 * Find quest IDs that match a given reward based on location context
 */
export function findMatchingQuests(reward: LogReward): string[] {
  const matchingQuests: string[] = [];
  
  console.log('Finding matches for reward:', reward.rewardText, 'in location:', reward.location);
  
  // Check specific location first if available
  if (reward.location) {
    const locationMappings = LOCATION_QUEST_MAPPINGS[reward.location];
    if (locationMappings) {
      // Check each quest in this location
      for (const [questId, rewardPatterns] of Object.entries(locationMappings)) {
        for (const pattern of rewardPatterns) {
          const matches = doesRewardMatch(reward.rewardText, pattern);
          if (matches) {
            console.log(`✓ Quest ${questId} matches pattern: "${pattern}" in location: ${reward.location}`);
            matchingQuests.push(questId);
            break; // One match per quest is enough
          }
        }
      }
    }
  }
  
  // If no matches found in specific location, or no location context, check "General" for passive skill points
  if (matchingQuests.length === 0 && reward.rewardType === 'passive') {
    console.log('Checking general mappings for passive skill points');
    const generalMappings = LOCATION_QUEST_MAPPINGS['General'];
    if (generalMappings) {
      for (const [questId, rewardPatterns] of Object.entries(generalMappings)) {
        for (const pattern of rewardPatterns) {
          const matches = doesRewardMatch(reward.rewardText, pattern);
          if (matches) {
            console.log(`✓ Quest ${questId} matches pattern: "${pattern}" in general location context`);
            matchingQuests.push(questId);
            break;
          }
        }
      }
    }
  }
  
  console.log('Total matching quests found:', matchingQuests);
  return matchingQuests;
}

/**
 * Check if a reward text matches a pattern
 */
function doesRewardMatch(rewardText: string, pattern: string): boolean {
  // Normalize both strings for comparison
  const normalizeText = (text: string) => text
    .toLowerCase()
    .replace(/\[.*?\|(.+?)\]/g, '$1') // Replace [Resistances|Cold Resistance] with Cold Resistance
    .replace(/\s+/g, ' ')
    .trim();
  
  const normalizedReward = normalizeText(rewardText);
  const normalizedPattern = normalizeText(pattern);
  
  console.log(`  Comparing: "${normalizedReward}" vs "${normalizedPattern}"`);
  
  // Handle passive skill points specifically
  if (pattern.includes('Passive Skill Points') && rewardText.includes('Passive Skill Points')) {
    console.log(`  ✓ Passive skill points match found`);
    return true;
  }
  
  // Direct match
  if (normalizedReward.includes(normalizedPattern)) {
    console.log(`  ✓ Direct match found`);
    return true;
  }
  
  // Special cases for partial matches
  if (pattern.includes('Spirit') && rewardText.includes('Spirit')) {
    console.log(`  ✓ Spirit match found`);
    return true;
  }
  
  if (pattern.includes('Resistance') && rewardText.includes('Resistance')) {
    // Check if specific resistance type matches
    const resistanceTypes = ['Cold', 'Fire', 'Lightning', 'Chaos'];
    for (const type of resistanceTypes) {
      if (pattern.toLowerCase().includes(type.toLowerCase()) && 
          rewardText.toLowerCase().includes(type.toLowerCase())) {
        console.log(`  ✓ ${type} resistance match found`);
        return true;
      }
    }
  }
  
  if (pattern.includes('Charm') && rewardText.includes('Charm')) {
    console.log(`  ✓ Charm match found`);
    return true;
  }
  
  if (pattern.includes('maximum Life') && rewardText.includes('maximum Life')) {
    console.log(`  ✓ Maximum life match found`);
    return true;
  }
  
  if (pattern.includes('Intelligence') && rewardText.includes('Intelligence')) {
    console.log(`  ✓ Intelligence match found`);
    return true;
  }
  
  return false;
}

/**
 * Parse multiple log lines and return rewards with location context
 */
export function parseLogLines(lines: string[]): LogReward[] {
  const rewards: LogReward[] = [];
  let currentLocation: string | undefined;
  
  for (const line of lines) {
    // Check if this line contains a scene change
    const sceneChange = parseSceneLine(line);
    if (sceneChange) {
      currentLocation = sceneChange.location;
      console.log(`Scene changed to: ${currentLocation}`);
      continue;
    }
    
    // Try to parse as a reward line
    const reward = parseLogLine(line, currentLocation);
    if (reward) {
      rewards.push(reward);
    }
  }
  
  return rewards;
}

/**
 * Parse multiple log lines and return both scenes and rewards
 */
export function parseLogLinesWithScenes(lines: string[]): { scenes: LogScene[], rewards: LogReward[] } {
  const scenes: LogScene[] = [];
  const rewards: LogReward[] = [];
  let currentLocation: string | undefined;
  
  for (const line of lines) {
    // Check if this line contains a scene change
    const sceneChange = parseSceneLine(line);
    if (sceneChange) {
      currentLocation = sceneChange.location;
      scenes.push(sceneChange);
      console.log(`Scene changed to: ${currentLocation}`);
      continue;
    }
    
    // Try to parse as a reward line
    const reward = parseLogLine(line, currentLocation);
    if (reward) {
      rewards.push(reward);
    }
  }
  
  return { scenes, rewards };
}

/**
 * Check if auto-completion is supported
 * Now always returns true since we use a single quest data source
 */
export function isGuideSupported(): boolean {
  return true; // Auto-completion now supported for all quests
}

/**
 * Find quests that should be auto-completed when entering a zone
 * @param zoneId - The zone ID from the registry
 * @param quests - All quest steps from the current guide
 * @returns Array of quest IDs to auto-complete
 */
export function findQuestsForZone(zoneId: string, quests: QuestStep[]): string[] {
  const matchingQuestIds: string[] = [];

  for (const quest of quests) {
    // Skip if already completed
    if (quest.completed) {
      continue;
    }

    // Check if quest has a matching zone ID
    if (quest.zoneId === zoneId) {
      // Auto-complete quests that are:
      // 1. Waypoints (type: 'waypoint')
      // 2. Navigation steps (type: 'navigation')
      // 3. Zone entry quests (type: 'town')
      // NOTE: Boss kills should NOT auto-complete on zone entry - they complete via reward detection
      const autoCompleteTypes = ['waypoint', 'navigation', 'town'];

      if (quest.type && autoCompleteTypes.includes(quest.type)) {
        matchingQuestIds.push(quest.id);
      }
    }
  }

  return matchingQuestIds;
}

/**
 * Find boss quests in a zone (for potential auto-completion when boss is killed)
 * @param zoneId - The zone ID from the registry
 * @param quests - All quest steps from the current guide
 * @returns Array of boss quest IDs in this zone
 */
export function findBossQuestsInZone(zoneId: string, quests: QuestStep[]): string[] {
  const bossQuestIds: string[] = [];

  for (const quest of quests) {
    if (quest.completed) {
      continue;
    }

    if (quest.zoneId === zoneId && quest.type === 'kill_boss') {
      bossQuestIds.push(quest.id);
    }
  }

  return bossQuestIds;
}