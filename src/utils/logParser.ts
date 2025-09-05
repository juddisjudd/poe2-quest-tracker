/**
 * Path of Exile 2 log file parser for auto-completing quests
 */

// Interface for parsed log rewards
export interface LogReward {
  timestamp: string;
  characterName: string;
  rewardType: 'resistance' | 'spirit' | 'life' | 'charm' | 'attributes' | 'other';
  rewardText: string;
  rawLine: string;
}

// Quest reward mappings for permanent-buffs-guide.json
const QUEST_REWARD_MAPPINGS = {
  // Act 1
  'a1-clearfell-beira': ['+10% to [Resistances|Cold Resistance]'],
  'a1-hunting-crowbell': [], // Passive skill points don't show in log
  'a1-freythorn-king': ['+30 to [Spirit|Spirit]'],
  'a1-ogham-lute': [], // Passive skill points don't show in log
  'a1-manor-candlemass': ['+20 to maximum Life'],
  
  // Act 2
  'a2-keth-kabala': [], // Passive skill points don't show in log
  'a2-valley-titans': [
    '30% increased [Charm] Charges gained', 
    '+1 [Charm] Slot',
    '30% increased [Charm] Effect Duration'
  ],
  'a2-deshar-letter': [], // Passive skill points don't show in log
  'a2-spires-garukhan': ['+10% to [Resistances|Lightning Resistance]'],
  
  // Act 3
  'a3-jungle-silverfist': [], // Passive skill points don't show in log
  'a3-venom-crypts': [
    '25% increased [StunThreshold|Stun Threshold]',
    '30% increased Elemental Ailment Threshold',
    '25% increased Mana Regeneration Rate'
  ],
  'a3-azak-bog': ['+30 to [Spirit|Spirit]'],
  'a3-jiquani-blackjaw': ['+10% to [Resistances|Fire Resistance]'],
  'a3-aggorat-heart': [], // Passive skill points don't show in log
  
  // Act 4
  'a4-abandoned-prison': [
    '30% increased Mana Recovery from [Flask|Flasks]',
    '30% increased Life Recovery from [Flask|Flasks]'
  ],
  
  // Interludes
  'i1-wolvenhold-oswin': [], // Passive skill points don't show in log
  'i2-clearing-way': [], // Passive skill points don't show in log
  'i2-khari-crossing': ['5% increased maximum'],
  'i2-qimah-pillars': [
    '+5 to [Intelligence|Intelligence]',
    '+5% to [Resistances|Fire Resistance]',
    '12% Increased Cooldown Recovery Rate',
    '3% increased Movement Speed',
    '20% Increased Presence Area Of Effect',
    '15% Increased Global Defences',
    '5% Increased Experience Gain'
  ],
  'i3-kriar-village-lythara': ['+40 to [Spirit|Spirit]'],
  'i3-howling-caves-yeti': [], // Passive skill points don't show in log
  'i3-siege-oriath': [] // Passive skill points don't show in log
};

/**
 * Parse a log line to extract reward information
 */
export function parseLogLine(line: string): LogReward | null {
  // Expected format: 2025/09/04 19:48:43 463096687 3ef232c2 [INFO Client 20408] : SecretHandshakes has received +10% to [Resistances|Cold Resistance].
  // More flexible pattern that handles timestamps and other prefixes
  const logPattern = /.*\[INFO Client \d+\] : (.+?) has received (.+?)\.?\s*$/;
  const match = line.match(logPattern);
  
  if (!match) {
    console.log('Log line did not match pattern:', line);
    console.log('Line length:', line.length, 'Last chars:', JSON.stringify(line.slice(-5)));
    return null;
  }
  
  const [, characterName, rewardText] = match;
  console.log('Parsed log line - Character:', characterName, 'Reward:', rewardText);
  
  // Extract timestamp from the beginning if it exists
  const timestamp = new Date().toISOString(); // We'll use current time since log doesn't have timestamps
  
  // Determine reward type
  let rewardType: LogReward['rewardType'] = 'other';
  
  if (rewardText.includes('Resistance') || rewardText.includes('[Resistances|')) {
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
    rawLine: line
  };
}

/**
 * Find quest IDs that match a given reward
 */
export function findMatchingQuests(reward: LogReward): string[] {
  const matchingQuests: string[] = [];
  
  console.log('Finding matches for reward:', reward.rewardText);
  
  for (const [questId, rewardPatterns] of Object.entries(QUEST_REWARD_MAPPINGS)) {
    for (const pattern of rewardPatterns) {
      const matches = doesRewardMatch(reward.rewardText, pattern);
      if (matches) {
        console.log(`✓ Quest ${questId} matches pattern: "${pattern}"`);
        matchingQuests.push(questId);
        break; // One match per quest is enough
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
  
  // Direct match
  if (normalizedReward.includes(normalizedPattern)) {
    console.log(`  ✓ Direct match found`);
    return true;
  }
  
  // Special cases for partial matches
  if (pattern.includes('Spirit') && rewardText.includes('Spirit')) {
    return true;
  }
  
  if (pattern.includes('Resistance') && rewardText.includes('Resistance')) {
    // Check if specific resistance type matches
    const resistanceTypes = ['Cold', 'Fire', 'Lightning', 'Chaos'];
    for (const type of resistanceTypes) {
      if (pattern.toLowerCase().includes(type.toLowerCase()) && 
          rewardText.toLowerCase().includes(type.toLowerCase())) {
        return true;
      }
    }
  }
  
  if (pattern.includes('Charm') && rewardText.includes('Charm')) {
    return true;
  }
  
  if (pattern.includes('maximum Life') && rewardText.includes('maximum Life')) {
    return true;
  }
  
  return false;
}

/**
 * Parse multiple log lines and return rewards
 */
export function parseLogLines(lines: string[]): LogReward[] {
  return lines
    .map(line => parseLogLine(line))
    .filter((reward): reward is LogReward => reward !== null);
}

/**
 * Check if a guide supports auto-completion
 */
export function isGuideSupported(guideId: string): boolean {
  return guideId === 'permanent-buffs-guide';
}