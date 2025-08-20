import { GemProgression, GemSocketGroup, GemSlot } from "../types";

// Function to determine stat requirement based on gem name
function getStatRequirement(gemName: string): 'str' | 'dex' | 'int' | null {
  const name = gemName.toLowerCase();
  
  // Strength-based gems (red) - typically melee, fire, physical
  const strGems = [
    'slam', 'strike', 'cleave', 'sweep', 'smash', 'bash', 'crush', 'pound',
    'fire', 'burn', 'ignite', 'blaze', 'inferno', 'flame', 'volcanic', 'molten',
    'melee', 'physical', 'weapon', 'sword', 'axe', 'mace', 'club', 'hammer',
    'anger', 'hatred', 'determination', 'vitality', 'purity of fire',
    'ground slam', 'heavy strike', 'molten strike', 'infernal blow', 'dominating blow',
    'earthquake', 'sunder', 'tectonic slam', 'consecrated path', 'ice crash',
    'flicker strike', 'cyclone', 'leap slam', 'shield charge', 'vigilant strike'
  ];
  
  // Dexterity-based gems (green) - typically ranged, cold, chaos, evasion
  const dexGems = [
    'bow', 'arrow', 'shot', 'rain', 'barrage', 'split', 'pierce', 'projectile',
    'cold', 'ice', 'frost', 'freeze', 'chill', 'glacial', 'arctic', 'winter',
    'poison', 'chaos', 'venom', 'toxic', 'caustic', 'contagion', 'blight',
    'grace', 'haste', 'herald of ice', 'herald of agony', 'purity of ice',
    'lightning arrow', 'ice shot', 'burning arrow', 'explosive shot', 'shrapnel shot',
    'tornado shot', 'blast rain', 'caustic arrow', 'toxic rain', 'scourge arrow',
    'flicker strike', 'whirling blades', 'dash', 'blink arrow', 'mirror arrow'
  ];
  
  // Intelligence-based gems (blue) - typically spells, lightning, minions
  const intGems = [
    'spell', 'cast', 'magic', 'arcane', 'mystic', 'enchant', 'hex', 'curse',
    'lightning', 'shock', 'spark', 'arc', 'bolt', 'storm', 'thunder', 'tempest',
    'minion', 'summon', 'raise', 'animate', 'skeleton', 'zombie', 'golem', 'spectre',
    'clarity', 'discipline', 'herald of thunder', 'purity of lightning', 'wrath',
    'fireball', 'frostbolt', 'lightning bolt', 'arc', 'spark', 'shock nova',
    'ice nova', 'cold snap', 'frost bomb', 'glacial cascade', 'freezing pulse',
    'flame surge', 'incinerate', 'scorching ray', 'righteous fire', 'detonate dead',
    'raise zombie', 'raise spectre', 'summon skeletons', 'animate guardian', 'golem'
  ];
  
  // Check for matches
  for (const strGem of strGems) {
    if (name.includes(strGem)) {
      return 'str';
    }
  }
  
  for (const dexGem of dexGems) {
    if (name.includes(dexGem)) {
      return 'dex';
    }
  }
  
  for (const intGem of intGems) {
    if (name.includes(intGem)) {
      return 'int';
    }
  }
  
  // Default to null (white) if no match found
  return null;
}

// Simple base64url decode function
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  while (str.length % 4) {
    str += '=';
  }
  
  return atob(str);
}

// Simple zlib inflate using browser's built-in compression API
async function zlibInflate(compressedData: string): Promise<string> {
  try {
    // Convert base64 string to Uint8Array
    const binaryString = base64UrlDecode(compressedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Use DecompressionStream to inflate
    const stream = new DecompressionStream('deflate');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(bytes);
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks and convert back to string
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder('utf-8').decode(result);
  } catch (error) {
    console.error('Failed to decompress PoB data:', error);
    throw new Error('Invalid Path of Building code format');
  }
}

// Parse XML to extract gem information
function parseGemsFromXML(xmlString: string): GemProgression {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const socketGroups: GemSocketGroup[] = [];
    
    // Find all skill elements
    const skills = xmlDoc.querySelectorAll('Skill');
    
    skills.forEach((skill, index) => {
      const skillGems = skill.querySelectorAll('Gem');
      if (skillGems.length === 0) return;

      // First gem is usually the main skill gem
      const mainGemElement = skillGems[0];
      const mainGemName = mainGemElement.getAttribute('nameSpec') || 
                         mainGemElement.getAttribute('skillId') || 
                         `Unknown Skill ${index + 1}`;

      const mainGem: GemSlot = {
        id: `main-${index}`,
        name: mainGemName,
        type: mainGemName.toLowerCase().includes('aura') || 
              mainGemName.toLowerCase().includes('herald') || 
              mainGemName.toLowerCase().includes('banner') ? 'spirit' : 'skill',
        acquired: false,
        statRequirement: getStatRequirement(mainGemName),
      };

      // Rest are support gems
      const supportGems: GemSlot[] = [];
      for (let i = 1; i < skillGems.length; i++) {
        const supportGemElement = skillGems[i];
        const supportGemName = supportGemElement.getAttribute('nameSpec') || 
                              supportGemElement.getAttribute('skillId') || 
                              `Support ${i}`;

        supportGems.push({
          id: `support-${index}-${i}`,
          name: supportGemName,
          type: 'support',
          acquired: false,
          statRequirement: getStatRequirement(supportGemName),
        });
      }

      // Determine max sockets (usually 6, but can vary)
      const maxSockets = Math.max(6, skillGems.length);

      socketGroups.push({
        id: `group-${index}`,
        mainGem,
        supportGems,
        maxSockets,
      });
    });

    return {
      socketGroups,
      lastImported: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to parse XML:', error);
    throw new Error('Failed to parse Path of Building data');
  }
}

// Main function to parse PoB code
export async function parsePathOfBuildingCode(pobCode: string): Promise<GemProgression> {
  try {
    // Clean the input
    const cleanCode = pobCode.trim();
    
    // Decompress the data
    const xmlString = await zlibInflate(cleanCode);
    
    // Parse gems from XML
    const gemProgression = parseGemsFromXML(xmlString);
    
    return gemProgression;
  } catch (error) {
    console.error('Error parsing PoB code:', error);
    throw new Error('Invalid Path of Building code. Please check the format and try again.');
  }
}

// Generate sample gem progression for testing
export function generateSampleGemProgression(): GemProgression {
  return {
    socketGroups: [
      {
        id: 'group-1',
        mainGem: {
          id: 'main-1',
          name: 'Lightning Bolt',
          type: 'skill',
          acquired: false,
          statRequirement: 'int', // Intelligence (blue)
        },
        supportGems: [
          {
            id: 'support-1-1',
            name: 'Added Lightning Damage',
            type: 'support',
            acquired: false,
            statRequirement: 'int', // Intelligence (blue)
          },
          {
            id: 'support-1-2',
            name: 'Spell Echo',
            type: 'support',
            acquired: false,
            statRequirement: 'int', // Intelligence (blue)
          },
        ],
        maxSockets: 6,
      },
      {
        id: 'group-2',
        mainGem: {
          id: 'main-2',
          name: 'Ground Slam',
          type: 'skill',
          acquired: false,
          statRequirement: 'str', // Strength (red)
        },
        supportGems: [
          {
            id: 'support-2-1',
            name: 'Melee Physical Damage',
            type: 'support',
            acquired: false,
            statRequirement: 'str', // Strength (red)
          },
          {
            id: 'support-2-2',
            name: 'Ice Shot',
            type: 'support',
            acquired: false,
            statRequirement: 'dex', // Dexterity (green)
          },
        ],
        maxSockets: 6,
      },
      {
        id: 'group-3',
        mainGem: {
          id: 'main-3',
          name: 'Herald of Thunder',
          type: 'spirit',
          acquired: false,
          statRequirement: 'int', // Intelligence (blue)
        },
        supportGems: [
          {
            id: 'support-3-1',
            name: 'Generic Support',
            type: 'support',
            acquired: false,
            statRequirement: null, // No requirement (white)
          },
        ],
        maxSockets: 6,
      },
    ],
    lastImported: new Date().toISOString(),
  };
}

// Migration function to add stat requirements to existing gems
export function migrateGemProgression(gemProgression: GemProgression): GemProgression {
  return {
    ...gemProgression,
    socketGroups: gemProgression.socketGroups.map(group => ({
      ...group,
      mainGem: {
        ...group.mainGem,
        statRequirement: group.mainGem.statRequirement ?? getStatRequirement(group.mainGem.name),
      },
      supportGems: group.supportGems.map(gem => ({
        ...gem,
        statRequirement: gem.statRequirement ?? getStatRequirement(gem.name),
      })),
    })),
  };
}