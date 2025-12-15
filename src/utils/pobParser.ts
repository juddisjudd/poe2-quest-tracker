import { GemProgression, GemSocketGroup, GemSlot, ItemData, ItemModifier } from "../types";
import { PassiveTreeData, getClassName, getAscendancyName } from "../types/passiveTree";
import skillGemsData from "../data/skill_gems.json";

export interface PobLoadout {
  name: string;
  gemProgression: GemProgression;
  passiveTree?: PassiveTreeData; // Each loadout can have different tree allocations
}

export interface PobParseResult {
  gemProgression: GemProgression;
  notes?: string;
  loadouts?: PobLoadout[];
  hasMultipleLoadouts?: boolean;
  items?: ItemData[]; // Items from all loadouts
  passiveTree?: PassiveTreeData; // Active/default passive tree allocations
}

function getStatRequirementFromData(gemName: string): 'str' | 'dex' | 'int' | null {
  const cleanGemName = gemName
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

  for (const [, gemData] of Object.entries(skillGemsData)) {
    const displayName = gemData.display_name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

    if (displayName === cleanGemName) {
      return determineStatFromRequirements(gemData.requirement_weights);
    }
  }
  return null;
}

function determineStatFromRequirements(requirements: { strength: number; dexterity: number; intelligence: number }): 'str' | 'dex' | 'int' | null {
  const { strength, dexterity, intelligence } = requirements;

  if (strength === 100) {
    return 'str';
  } else if (dexterity === 100) {
    return 'dex';
  } else if (intelligence === 100) {
    return 'int';
  }

  return null;
}

function getStatRequirement(gemName: string): 'str' | 'dex' | 'int' | null {
  const dataResult = getStatRequirementFromData(gemName);
  if (dataResult) {
    return dataResult;
  }
  const name = gemName.toLowerCase();

  const strGems = [
    'slam', 'strike', 'cleave', 'sweep', 'smash', 'bash', 'crush', 'pound',
    'fire', 'burn', 'ignite', 'blaze', 'inferno', 'flame', 'volcanic', 'molten',
    'melee', 'physical', 'weapon', 'sword', 'axe', 'mace', 'club', 'hammer',
    'anger', 'hatred', 'determination', 'vitality', 'purity of fire',
    'ground slam', 'heavy strike', 'molten strike', 'infernal blow', 'dominating blow',
    'earthquake', 'sunder', 'tectonic slam', 'consecrated path', 'ice crash',
    'flicker strike', 'cyclone', 'leap slam', 'shield charge', 'vigilant strike'
  ];

  const dexGems = [
    'bow', 'arrow', 'shot', 'rain', 'barrage', 'split', 'pierce', 'projectile',
    'cold', 'ice', 'frost', 'freeze', 'chill', 'glacial', 'arctic', 'winter',
    'poison', 'chaos', 'venom', 'toxic', 'caustic', 'contagion', 'blight',
    'grace', 'haste', 'herald of ice', 'herald of agony', 'purity of ice',
    'lightning arrow', 'ice shot', 'burning arrow', 'explosive shot', 'shrapnel shot',
    'tornado shot', 'blast rain', 'caustic arrow', 'toxic rain', 'scourge arrow',
    'flicker strike', 'whirling blades', 'dash', 'blink arrow', 'mirror arrow'
  ];

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

// Extract notes from XML
function extractNotesFromXML(xmlString: string): string | undefined {
  console.log('🔍 [POB] Starting notes extraction from XML...');
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('❌ [POB] XML parsing error:', parseError.textContent);
      return undefined;
    }
    
    console.log('✅ [POB] XML parsed successfully');
    
    // Debug: log root element
    console.log('🔍 [POB] Root element:', xmlDoc.documentElement?.tagName);
    
    // Try multiple approaches to find Notes
    let notesElement = xmlDoc.querySelector('Notes');
    console.log('🔍 [POB] Direct Notes query result:', !!notesElement);
    
    if (!notesElement) {
      // Try finding it within PathOfBuilding root - check both PathOfBuilding and PathOfBuilding2
      let pathOfBuildingElement = xmlDoc.querySelector('PathOfBuilding');
      if (!pathOfBuildingElement) {
        pathOfBuildingElement = xmlDoc.querySelector('PathOfBuilding2');
      }
      
      console.log('🔍 [POB] PathOfBuilding root element found:', !!pathOfBuildingElement);
      console.log('🔍 [POB] PathOfBuilding root tag name:', pathOfBuildingElement?.tagName);
      
      if (pathOfBuildingElement) {
        notesElement = pathOfBuildingElement.querySelector('Notes');
        console.log('🔍 [POB] Notes found in PathOfBuilding:', !!notesElement);
      }
    }
    
    if (!notesElement) {
      // Try case-insensitive search
      const allElements = xmlDoc.getElementsByTagName('*');
      console.log('🔍 [POB] Searching through', allElements.length, 'elements...');
      
      // Log some element names for debugging
      const elementNames = new Set();
      for (let i = 0; i < Math.min(allElements.length, 50); i++) {
        elementNames.add(allElements[i].tagName);
      }
      console.log('🔍 [POB] First 50 element types:', Array.from(elementNames));
      
      for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].tagName.toLowerCase() === 'notes') {
          notesElement = allElements[i];
          console.log('✅ [POB] Found notes via case-insensitive search');
          break;
        }
      }
    }
    
    if (notesElement) {
      console.log('✅ [POB] Notes element found!');
      const notesText = notesElement.textContent?.trim();
      console.log('📝 [POB] Notes text length:', notesText?.length || 0);
      console.log('📝 [POB] Notes preview:', notesText ? notesText.substring(0, 150) + '...' : 'Empty');
      
      const result = notesText && notesText.length > 0 ? notesText : undefined;
      console.log('🎯 [POB] Final notes result:', !!result);
      return result;
    }
    
    console.log('❌ [POB] No notes element found anywhere');
    return undefined;
  } catch (error) {
    console.error('❌ [POB] Error extracting notes from XML:', error);
    return undefined;
  }
}

// Extract all available builds/trees from XML
function extractBuildsFromXML(xmlString: string): { builds: Element[], trees: Element[] } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Look for multiple Build elements (different loadouts)
  const builds = Array.from(xmlDoc.querySelectorAll('Build'));
  
  // Look for multiple Tree elements (different passive tree configurations)  
  const trees = Array.from(xmlDoc.querySelectorAll('Tree'));
  
  // Also check for other possible loadout structures
  const specs = Array.from(xmlDoc.querySelectorAll('TreeSpec'));
  const configs = Array.from(xmlDoc.querySelectorAll('Config'));
  
  console.log(`POB Analysis: Found ${builds.length} Build elements, ${trees.length} Tree elements, ${specs.length} TreeSpec elements, ${configs.length} Config elements`);
  
  // Debug: log all top-level elements to understand structure
  const rootElements = Array.from(xmlDoc.documentElement?.children || []);
  console.log('Root elements:', rootElements.map(el => `${el.tagName}(${el.children.length} children)`));
  
  // Debug: look for any element with a "name" attribute that might contain loadout names
  const allElements = Array.from(xmlDoc.querySelectorAll('*[name]'));
  console.log('Elements with name attribute:', allElements.map(el => `${el.tagName}[name="${el.getAttribute('name')}"]`));
  
  // Debug: find elements that might contain "lvl" or level information
  const levelElements = Array.from(xmlDoc.querySelectorAll('*')).filter(el => {
    const name = el.getAttribute('name') || el.textContent || '';
    return name.toLowerCase().includes('lvl') || name.toLowerCase().includes('level');
  });
  console.log('Level-related elements:', levelElements.map(el => `${el.tagName}[name="${el.getAttribute('name')}"] content: "${(el.textContent || '').substring(0, 50)}"`));
  
  // Debug: log build names if any
  builds.forEach((build, index) => {
    const name = build.getAttribute('name') || build.getAttribute('title') || `Build ${index + 1}`;
    const skillCount = build.querySelectorAll('Skill').length;
    console.log(`  Build ${index}: "${name}" (${skillCount} skills)`);
  });
  
  // Debug: log tree names if any
  trees.forEach((tree, index) => {
    const name = tree.getAttribute('name') || tree.getAttribute('title') || tree.getAttribute('activeSpec') || `Tree ${index + 1}`;
    console.log(`  Tree ${index}: "${name}"`);
  });
  
  // Debug: log TreeSpec elements (might be the actual loadouts)
  specs.forEach((spec, index) => {
    const name = spec.getAttribute('name') || spec.getAttribute('title') || `TreeSpec ${index + 1}`;
    console.log(`  TreeSpec ${index}: "${name}"`);
  });
  
  return { builds, trees };
}

// Parse XML to extract gem information from a specific SkillSet element
function parseGemsFromSkillSet(skillSetElement: Element): GemProgression {
  try {
    const socketGroups: GemSocketGroup[] = [];
    
    // Find all skill elements within this specific SkillSet
    const skills = skillSetElement.querySelectorAll('Skill');
    console.log(`parseGemsFromSkillSet: Found ${skills.length} skills in SkillSet`);
    
    skills.forEach((skill, index) => {
      // Get all gems from this skill element
      const gemElements = skill.querySelectorAll('Gem');
      
      if (gemElements.length === 0) {
        console.log(`  Skill ${index}: No gems found`);
        return;
      }
      
      // The first gem is usually the main skill gem
      const firstGem = gemElements[0];
      const mainGemName = firstGem.getAttribute('nameSpec') || 
                         firstGem.getAttribute('variantId') || 
                         'Unknown Gem';
      const skillId = firstGem.getAttribute('skillId') || `skill-${index}`;
      
      console.log(`  Skill ${index}: ${mainGemName} (${gemElements.length} gems total)`);
      
      // Create main gem entry
      const mainGem: GemSlot = {
        id: skillId,
        name: mainGemName,
        type: 'skill' as const,
        acquired: false,
        statRequirement: null,
      };
      
      // Parse support gems (all gems after the first one)
      const supportGems: GemSlot[] = [];
      for (let i = 1; i < gemElements.length; i++) {
        const supportGem = gemElements[i];
        const supportName = supportGem.getAttribute('nameSpec') || 
                           supportGem.getAttribute('variantId') || 
                           'Unknown Support';
        
        // Determine if this is a support gem based on skillId or variantId
        const supportSkillId = supportGem.getAttribute('skillId') || '';
        const isSupport = supportSkillId.includes('Support') || 
                         supportGem.getAttribute('variantId')?.includes('Support');
        
        supportGems.push({
          id: `${skillId}-support-${i}`,
          name: supportName,
          type: isSupport ? 'support' as const : 'skill' as const,
          acquired: false,
          statRequirement: null,
        });
      }
      
      // Create socket group
      const socketGroup: GemSocketGroup = {
        id: `group-${index}`,
        mainGem,
        supportGems,
        maxSockets: gemElements.length,
      };
      
      socketGroups.push(socketGroup);
    });
    
    console.log(`parseGemsFromSkillSet: Created ${socketGroups.length} socket groups`);
    return { socketGroups };
  } catch (error) {
    console.error('Error parsing gems from SkillSet:', error);
    return { socketGroups: [] };
  }
}

// Parse XML to extract gem information from a specific build element or the whole document
function parseGemsFromXML(xmlString: string, buildElement?: Element): GemProgression {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const socketGroups: GemSocketGroup[] = [];
    
    // Find all skill elements - either from a specific build or the whole document
    const skills = buildElement ? 
      buildElement.querySelectorAll('Skill') : 
      xmlDoc.querySelectorAll('Skill');
    
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
        statRequirement: null, // Main gems and spirit gems should be white
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

// Function to extract PoB code from pobb.in URL
async function extractFromPobbinUrl(url: string): Promise<string> {
  try {
    // Extract the ID from pobb.in URL (e.g., https://pobb.in/P7nxXheeMuId -> P7nxXheeMuId)
    const match = url.match(/pobb\.in\/([A-Za-z0-9_-]+)/);
    if (!match) {
      throw new Error('Invalid pobb.in URL format');
    }
    
    const buildId = match[1];
    const rawUrl = `https://pobb.in/${buildId}/raw`;
    
    // Fetch the raw build data from pobb.in
    // Include User-Agent header as required by pobb.in API
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'poe2-quest-tracker/3.0 github.com/ohitsjudd (contact: github.com/ohitsjudd/poe2-quest-tracker)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch build data: ${response.status}`);
    }
    
    // The /raw endpoint returns the POB code directly as text
    const pobCode = await response.text();
    
    if (!pobCode || pobCode.trim().length === 0) {
      throw new Error('Empty build code received');
    }
    
    return pobCode.trim();
  } catch (error) {
    console.error('Error extracting from pobb.in URL:', error);
    throw new Error('Failed to fetch build from pobb.in. Please check the URL and try again.');
  }
}

// Function to detect if input is a pobb.in URL
function isPobbinUrl(input: string): boolean {
  return /https?:\/\/pobb\.in\/[A-Za-z0-9_-]+/.test(input.trim());
}

// Filter gems for a specific loadout to create distinct skill sets
function filterGemsForLoadout(allGemProgression: GemProgression, loadoutName: string, loadoutIndex: number): GemProgression {
  const socketGroups = allGemProgression.socketGroups;
  
  // Create different skill subsets based on loadout
  // This is a heuristic approach until we have proper POB parsing
  let filteredGroups: GemSocketGroup[] = [];
  
  if (loadoutName.toLowerCase().includes('1-5') || loadoutIndex === 0) {
    // Early game loadout - first few skills
    filteredGroups = socketGroups.slice(0, Math.max(1, Math.floor(socketGroups.length / 3)));
  } else if (loadoutName.toLowerCase().includes('6-14') || loadoutIndex === 1) {
    // Mid game loadout - middle skills
    const start = Math.floor(socketGroups.length / 3);
    const end = Math.floor(socketGroups.length * 2 / 3);
    filteredGroups = socketGroups.slice(start, Math.max(start + 1, end));
  } else if (loadoutIndex === 2) {
    // Late game loadout - final skills
    const start = Math.floor(socketGroups.length * 2 / 3);
    filteredGroups = socketGroups.slice(start);
  } else {
    // Default: distribute evenly based on index
    const groupsPerLoadout = Math.max(1, Math.floor(socketGroups.length / 4));
    const startIndex = loadoutIndex * groupsPerLoadout;
    filteredGroups = socketGroups.slice(startIndex, startIndex + groupsPerLoadout);
  }
  
  // Ensure we always have at least one group
  if (filteredGroups.length === 0) {
    filteredGroups = socketGroups.slice(0, 1);
  }
  
  console.log(`Filtered loadout "${loadoutName}": ${filteredGroups.length} skill groups (from ${socketGroups.length} total)`);
  
  return {
    socketGroups: filteredGroups,
    lastImported: allGemProgression.lastImported
  };
}

// Extract all available loadouts from the XML
function extractLoadoutsFromXML(xmlString: string): PobLoadout[] {
  const { builds, trees } = extractBuildsFromXML(xmlString);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const loadouts: PobLoadout[] = [];
  
  // Extract all passive tree specs
  const { trees: passiveTrees, activeIndex: activeTreeIndex } = extractAllPassiveTreesFromXML(xmlString);
  console.log(`🌳 [POB] Found ${passiveTrees.length} passive tree specs, active index: ${activeTreeIndex}`);
  
  // Check for SkillSet elements (these contain the actual loadouts like "lvl 1-5", "lvl 6-14")
  const skillSets = Array.from(xmlDoc.querySelectorAll('SkillSet[title]'));
  console.log(`Found ${skillSets.length} SkillSet elements with titles`);
  
  // Handle SkillSet elements (contains the "lvl 1-5", "lvl 6-14" etc.)
  if (skillSets.length > 0) {
    console.log('Using SkillSet elements as loadouts');
    skillSets.forEach((skillSet, index) => {
      const skillSetName = skillSet.getAttribute('title') || 
                          skillSet.getAttribute('name') ||
                          `SkillSet ${index + 1}`;
      const skillSetId = skillSet.getAttribute('id');
                      
      console.log(`Processing SkillSet: "${skillSetName}" (id: ${skillSetId})`);
      
      try {
        // Parse gems specifically from this SkillSet
        const gemProgression = parseGemsFromSkillSet(skillSet);
        
        // Associate with corresponding passive tree spec if available
        // Try to match by index or by title
        let passiveTree: PassiveTreeData | undefined;
        if (passiveTrees.length > 0) {
          // First try to find a tree with matching title
          const matchingTree = passiveTrees.find(t => 
            t.title?.toLowerCase() === skillSetName.toLowerCase()
          );
          if (matchingTree) {
            passiveTree = matchingTree;
          } else if (index < passiveTrees.length) {
            // Fall back to index-based matching
            passiveTree = passiveTrees[index];
          } else {
            // Use the last tree if we have more skillsets than trees
            passiveTree = passiveTrees[passiveTrees.length - 1];
          }
        }
        
        loadouts.push({
          name: skillSetName,
          gemProgression: gemProgression,
          passiveTree
        });
      } catch (error) {
        console.warn(`Failed to parse SkillSet "${skillSetName}":`, error);
      }
    });
    return loadouts;
  }
  
  // Fallback: Check for TreeSpec elements (old approach)
  const treeSpecs = Array.from(xmlDoc.querySelectorAll('TreeSpec'));
  console.log(`Found ${treeSpecs.length} TreeSpec elements`);
  
  // Handle TreeSpec elements (might contain the "lvl 1-5", "lvl 6-14" etc.)
  if (treeSpecs.length > 1) {
    console.log('Using TreeSpec elements as loadouts');
    treeSpecs.forEach((spec, index) => {
      const specName = spec.getAttribute('name') || 
                      spec.getAttribute('title') ||
                      `TreeSpec ${index + 1}`;
                      
      console.log(`Processing TreeSpec: "${specName}"`);
      
      try {
        // For TreeSpecs, parse gems from whole document and then filter based on loadout
        const allGemProgression = parseGemsFromXML(xmlString);
        
        // Create filtered gem progression based on loadout name/level
        const filteredGemProgression = filterGemsForLoadout(allGemProgression, specName, index);
        
        // Use corresponding passive tree
        const passiveTree = index < passiveTrees.length ? passiveTrees[index] : undefined;
        
        loadouts.push({
          name: specName,
          gemProgression: filteredGemProgression,
          passiveTree
        });
      } catch (error) {
        console.warn(`Failed to parse TreeSpec "${specName}":`, error);
      }
    });
    return loadouts;
  }
  
  // Handle multiple Build elements
  if (builds.length > 1) {
    console.log('Using Build elements as loadouts');
    builds.forEach((build, index) => {
      const buildName = build.getAttribute('name') || 
                       build.getAttribute('title') || 
                       `Build ${index + 1}`;
                       
      try {
        const gemProgression = parseGemsFromXML(xmlString, build);
        const passiveTree = index < passiveTrees.length ? passiveTrees[index] : undefined;
        
        loadouts.push({
          name: buildName,
          gemProgression,
          passiveTree
        });
      } catch (error) {
        console.warn(`Failed to parse build "${buildName}":`, error);
      }
    });
    return loadouts;
  }
  
  // Handle multiple Tree elements (different passive configurations)
  if (trees.length > 1 && builds.length <= 1) {
    console.log('Using Tree elements as loadouts');
    trees.forEach((tree, index) => {
      const treeName = tree.getAttribute('name') || 
                      tree.getAttribute('title') ||
                      tree.getAttribute('activeSpec') ||
                      `Tree ${index + 1}`;
      
      try {
        // For trees, we still parse gems from the whole document but associate with tree name
        const gemProgression = parseGemsFromXML(xmlString);
        const passiveTree = index < passiveTrees.length ? passiveTrees[index] : undefined;
        
        loadouts.push({
          name: treeName,
          gemProgression,
          passiveTree
        });
      } catch (error) {
        console.warn(`Failed to parse tree "${treeName}":`, error);
      }
    });
    return loadouts;
  }
  
  // No multiple loadouts but we have passive trees - create loadouts from trees
  if (passiveTrees.length > 1) {
    console.log('Creating loadouts from passive tree specs');
    const allGemProgression = parseGemsFromXML(xmlString);
    
    passiveTrees.forEach((tree, index) => {
      const treeName = tree.title || `Build ${index + 1}`;
      loadouts.push({
        name: treeName,
        gemProgression: allGemProgression, // Same gems for all (would need filtering in real scenario)
        passiveTree: tree
      });
    });
    return loadouts;
  }
  
  console.log('No multiple loadouts detected, returning empty array');
  return loadouts;
}

// Function to extract items from all ItemSet elements in XML
function extractItemsFromXML(xmlString: string): ItemData[] {
  console.log('🔧 [POB] Extracting items from XML');
  const items: ItemData[] = [];

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Helper function to find Item element by ID
    const findItemById = (itemId: number): Element | null => {
      const itemElements = Array.from(xmlDoc.getElementsByTagName('Item'));
      return itemElements.find(item => parseInt(item.getAttribute('id') || '0', 10) === itemId) || null;
    };

    // Find all ItemSet elements
    const itemSetElements = Array.from(xmlDoc.getElementsByTagName('ItemSet'));

    console.log(`📦 [POB] Found ${itemSetElements.length} ItemSet elements`);

    itemSetElements.forEach((itemSetElement, index) => {
      const loadoutName = itemSetElement.getAttribute('title') ||
                          itemSetElement.getAttribute('name') ||
                          `Loadout ${index + 1}`;

      // Find all Slot elements within this ItemSet
      const slotElements = Array.from(itemSetElement.getElementsByTagName('Slot'));

      console.log(`  📦 ItemSet "${loadoutName}": ${slotElements.length} slots`);

      slotElements.forEach((slotElement) => {
        const slotName = slotElement.getAttribute('name') || 'Unknown Slot';
        const itemIdStr = slotElement.getAttribute('itemId');

        if (!itemIdStr) {
          // Check if there's text content directly in the slot (old format)
          const itemText = slotElement.textContent?.trim();
          if (itemText) {
            const parsedItem = parseItemFromPobText(itemText, loadoutName, slotName);
            if (parsedItem) {
              items.push(parsedItem);
              console.log(`    ✅ Parsed item (old format): ${parsedItem.name} (${parsedItem.itemClass}) in ${slotName}`);
            }
          }
          return;
        }

        const itemId = parseInt(itemIdStr, 10);
        if (!itemId) return;

        // Find the corresponding Item element
        const itemElement = findItemById(itemId);
        if (!itemElement) {
          console.log(`    ⚠️ Item with id ${itemId} not found for slot ${slotName}`);
          return;
        }

        const itemText = itemElement.textContent?.trim();
        if (!itemText) return;

        // Parse the item text
        const parsedItem = parseItemFromPobText(itemText, loadoutName, slotName);
        if (parsedItem) {
          items.push(parsedItem);
          console.log(`    ✅ Parsed item: ${parsedItem.name} (${parsedItem.itemClass}) in ${slotName}`);
        }
      });
    });

    console.log(`✅ [POB] Successfully extracted ${items.length} items from XML`);
  } catch (error) {
    console.error('❌ [POB] Error extracting items:', error);
  }

  return items;
}

// Parse item from POB text format (similar to in-game format)
function parseItemFromPobText(itemText: string, loadoutName: string, slot: string): ItemData | null {
  const lines = itemText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length < 4) return null;

  let lineIndex = 0;

  // Parse rarity and name (POB format: "Rarity: RARE\nName\nBase Type")
  const rarityMatch = lines[lineIndex]?.match(/^Rarity:\s*(.+)$/i);
  if (!rarityMatch) return null;
  const rarity = rarityMatch[1];
  lineIndex++;

  const name = lines[lineIndex++] || 'Unknown';
  const itemType = lines[lineIndex++] || 'Unknown';

  // Try to determine item class from item type or slot
  const itemClass = determineItemClass(itemType, slot);

  const implicit: ItemModifier[] = [];
  const explicit: ItemModifier[] = [];
  const enchant: ItemModifier[] = [];
  const rune: ItemModifier[] = [];

  let quality = 0;
  let ilvl = 1;
  let level = 1;
  let sockets = '';
  const requirements: ItemData['requirements'] = {};

  // Parse remaining lines
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    // Parse implicits (lines with {tags})
    if (line.includes('{') && line.includes('}')) {
      const modText = line.replace(/\{[^}]*\}/g, '').trim();
      if (modText) {
        if (line.includes('{tags:enchant}')) {
          enchant.push({ text: modText, type: 'enchant' });
        } else if (line.includes('{tags:implicit}')) {
          implicit.push({ text: modText, type: 'implicit' });
        } else if (line.includes('{tags:rune}')) {
          rune.push({ text: modText, type: 'rune' });
        } else {
          explicit.push({ text: modText, type: 'explicit' });
        }
      }
    }
    // Quality
    else if (line.match(/^Quality:\s*\+?(\d+)/)) {
      quality = parseInt(line.match(/\d+/)?.[0] || '0');
    }
    // Item Level
    else if (line.match(/^Item Level:\s*(\d+)/)) {
      ilvl = parseInt(line.match(/\d+/)?.[0] || '1');
    }
    // Sockets
    else if (line.match(/^Sockets:\s*(.+)/)) {
      sockets = line.replace('Sockets:', '').trim();
    }
    // Requirements
    else if (line.match(/^Requires/)) {
      const levelMatch = line.match(/Level\s+(\d+)/);
      if (levelMatch) {
        level = parseInt(levelMatch[1]);
        requirements.level = level;
      }
    }
    // Regular explicit mods (no tags)
    else if (!line.match(/^(Physical|Lightning|Fire|Cold|Chaos) Damage:|^Critical Hit Chance:|^Evasion Rating:|^Armour:|^Energy Shield:|^Attacks per Second:/)) {
      if (line.length > 0 && !line.startsWith('Requires') && !line.startsWith('Sockets') && !line.startsWith('Quality') && !line.startsWith('Item Level')) {
        explicit.push({ text: line, type: 'explicit' });
      }
    }

    lineIndex++;
  }

  return {
    id: `${loadoutName}-${slot}-${name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
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
    quality: quality || undefined,
    loadoutName,
    slot
  };
}

// Determine item class from item type or slot name
function determineItemClass(itemType: string, slot: string): string {
  const lower = (itemType + ' ' + slot).toLowerCase();

  if (lower.includes('helmet') || lower.includes('cap') || lower.includes('hood') || lower.includes('crown')) return 'Helmets';
  if (lower.includes('glove') || lower.includes('gauntlet') || lower.includes('mitt')) return 'Gloves';
  if (lower.includes('boot') || lower.includes('shoe') || lower.includes('greave')) return 'Boots';
  if (lower.includes('body') || lower.includes('armour') || lower.includes('vest') || lower.includes('robe') || lower.includes('coat')) return 'Body Armours';
  if (lower.includes('shield')) return 'Shields';
  if (lower.includes('quiver')) return 'Quivers';
  if (lower.includes('amulet') || lower.includes('talisman')) return 'Amulets';
  if (lower.includes('ring')) return 'Rings';
  if (lower.includes('belt') || lower.includes('sash')) return 'Belts';
  if (lower.includes('bow')) return 'Bows';
  if (lower.includes('crossbow')) return 'Crossbows';
  if (lower.includes('wand')) return 'Wands';
  if (lower.includes('staff') || lower.includes('stave')) return 'Staves';
  if (lower.includes('mace')) return lower.includes('two hand') ? 'Two Hand Maces' : 'One Hand Maces';
  if (lower.includes('sword')) return lower.includes('two hand') ? 'Two Hand Swords' : 'One Hand Swords';
  if (lower.includes('axe')) return lower.includes('two hand') ? 'Two Hand Axes' : 'One Hand Axes';
  if (lower.includes('sceptre')) return 'Sceptres';
  if (lower.includes('dagger')) return 'Daggers';
  if (lower.includes('claw')) return 'Claws';
  if (lower.includes('focus') || lower.includes('foci')) return 'Foci';

  return 'Unknown';
}

/**
 * Decode class information from a passive tree URL
 * URL format: base64 encoded binary where byte 5 is classId, byte 6 contains ascendClassId
 */
function decodeClassFromTreeUrl(urlContent: string): { classId: number; ascendClassId: number } | null {
  try {
    // Extract the base64 part (after the last slash)
    const base64Part = urlContent.split('/').pop() || urlContent;
    // Convert URL-safe base64 to standard base64
    const standardBase64 = base64Part.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64
    const binaryStr = atob(standardBase64);
    
    if (binaryStr.length < 6) {
      return null;
    }
    
    // Version is first 4 bytes (big-endian)
    const ver = binaryStr.charCodeAt(0) * 16777216 + 
                binaryStr.charCodeAt(1) * 65536 + 
                binaryStr.charCodeAt(2) * 256 + 
                binaryStr.charCodeAt(3);
    
    // Class ID is byte 5 (index 4)
    const classId = binaryStr.charCodeAt(4);
    
    // Ascendancy ID is byte 6 (index 5), only lower 2 bits for primary ascendancy
    const ascendancyByte = ver >= 4 ? binaryStr.charCodeAt(5) : 0;
    const ascendClassId = ascendancyByte & 3;
    
    console.log('🌳 [POB] Decoded from URL: classId=', classId, 'ascendClassId=', ascendClassId);
    
    return { classId, ascendClassId };
  } catch (error) {
    console.warn('Failed to decode class from tree URL:', error);
    return null;
  }
}

/**
 * Parse a single Spec element into PassiveTreeData
 */
function parseSpecElement(spec: Element): PassiveTreeData | undefined {
  try {
    // Extract class and ascendancy IDs
    // Debug: log all attributes on the Spec element
    const attrs: string[] = [];
    for (let i = 0; i < spec.attributes.length; i++) {
      const attr = spec.attributes[i];
      attrs.push(`${attr.name}="${attr.value}"`);
    }
    console.log('🌳 [POB] Spec attributes:', attrs.join(', '));
    
    let classId = parseInt(spec.getAttribute('classId') || '0', 10);
    let ascendClassId = parseInt(spec.getAttribute('ascendClassId') || '0', 10);
    
    // If classId is 0 or missing, try to decode from URL element (legacy format)
    if (classId === 0) {
      const urlElement = spec.querySelector('URL');
      if (urlElement && urlElement.textContent) {
        console.log('🌳 [POB] classId is 0, trying to decode from URL element');
        const decoded = decodeClassFromTreeUrl(urlElement.textContent.trim());
        if (decoded) {
          classId = decoded.classId;
          ascendClassId = decoded.ascendClassId;
        }
      }
    }
    
    console.log('🌳 [POB] Final classId:', classId, 'ascendClassId:', ascendClassId);
    const secondaryAscendClassId = parseInt(spec.getAttribute('secondaryAscendClassId') || '0', 10);
    const treeVersion = spec.getAttribute('treeVersion') || '0_4';
    const title = spec.getAttribute('title') || undefined;

    // Extract allocated node IDs
    const nodesAttr = spec.getAttribute('nodes') || '';
    const allocatedNodes = nodesAttr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));

    // Extract mastery selections: format is {nodeId,effectId},{nodeId,effectId},...
    const masteryEffectsAttr = spec.getAttribute('masteryEffects') || '';
    const masterySelections = new Map<number, number>();
    const masteryPattern = /\{(\d+),(\d+)\}/g;
    let masteryMatch;
    while ((masteryMatch = masteryPattern.exec(masteryEffectsAttr)) !== null) {
      const nodeId = parseInt(masteryMatch[1], 10);
      const effectId = parseInt(masteryMatch[2], 10);
      if (!isNaN(nodeId) && !isNaN(effectId)) {
        masterySelections.set(nodeId, effectId);
      }
    }

    // Extract jewel socket allocations
    const jewelSockets = new Map<number, number>();
    const socketsElement = spec.querySelector('Sockets');
    if (socketsElement) {
      const socketElements = socketsElement.querySelectorAll('Socket');
      socketElements.forEach(socket => {
        const nodeId = parseInt(socket.getAttribute('nodeId') || '0', 10);
        const itemId = parseInt(socket.getAttribute('itemId') || '0', 10);
        if (nodeId > 0 && itemId > 0) {
          jewelSockets.set(nodeId, itemId);
        }
      });
    }

    return {
      classId,
      className: getClassName(classId),
      ascendClassId,
      ascendClassName: getAscendancyName(classId, ascendClassId),
      secondaryAscendClassId: secondaryAscendClassId > 0 ? secondaryAscendClassId : undefined,
      secondaryAscendClassName: secondaryAscendClassId > 0 
        ? getAscendancyName(classId, secondaryAscendClassId) 
        : undefined,
      allocatedNodes,
      masterySelections,
      treeVersion,
      jewelSockets: jewelSockets.size > 0 ? jewelSockets : undefined,
      title,
    };
  } catch (error) {
    console.error('❌ [POB] Error parsing Spec element:', error);
    return undefined;
  }
}

/**
 * Extract ALL passive tree specs from POB XML
 * Returns an array of PassiveTreeData, one for each spec/loadout
 */
function extractAllPassiveTreesFromXML(xmlString: string): { trees: PassiveTreeData[], activeIndex: number } {
  console.log('🌳 [POB] Extracting all passive tree specs...');
  const trees: PassiveTreeData[] = [];
  let activeIndex = 0;
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('❌ [POB] XML parsing error:', parseError.textContent);
      return { trees: [], activeIndex: 0 };
    }

    // Find the Tree element
    const treeElement = xmlDoc.querySelector('Tree');
    if (!treeElement) {
      console.log('⚠️ [POB] No Tree element found in XML');
      return { trees: [], activeIndex: 0 };
    }

    // Get the active spec (default to 1 if not specified)
    activeIndex = parseInt(treeElement.getAttribute('activeSpec') || '1', 10) - 1; // Convert to 0-indexed
    console.log('🌳 [POB] Active spec index:', activeIndex);

    // Find all Spec elements
    const specs = treeElement.querySelectorAll('Spec');
    if (specs.length === 0) {
      console.log('⚠️ [POB] No Spec elements found in Tree');
      return { trees: [], activeIndex: 0 };
    }

    console.log(`🌳 [POB] Found ${specs.length} Spec elements`);

    // Parse each spec
    specs.forEach((spec, index) => {
      const treeData = parseSpecElement(spec);
      if (treeData) {
        console.log(`🌳 [POB] Spec ${index}: ${treeData.className} / ${treeData.ascendClassName} - ${treeData.allocatedNodes.length} nodes - "${treeData.title || 'untitled'}"`);
        trees.push(treeData);
      }
    });

    return { trees, activeIndex: Math.min(activeIndex, trees.length - 1) };
  } catch (error) {
    console.error('❌ [POB] Error extracting passive trees:', error);
    return { trees: [], activeIndex: 0 };
  }
}

/**
 * Extract passive tree data from POB XML
 * Parses the <Tree> section to get allocated nodes, class, ascendancy, and mastery selections
 */
function extractPassiveTreeFromXML(xmlString: string): PassiveTreeData | undefined {
  console.log('🌳 [POB] Starting passive tree extraction...');
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('❌ [POB] XML parsing error:', parseError.textContent);
      return undefined;
    }

    // Find the Tree element
    const treeElement = xmlDoc.querySelector('Tree');
    if (!treeElement) {
      console.log('⚠️ [POB] No Tree element found in XML');
      return undefined;
    }

    // Get the active spec (default to 1 if not specified)
    const activeSpec = parseInt(treeElement.getAttribute('activeSpec') || '1', 10);
    console.log('🌳 [POB] Active spec:', activeSpec);

    // Find all Spec elements
    const specs = treeElement.querySelectorAll('Spec');
    if (specs.length === 0) {
      console.log('⚠️ [POB] No Spec elements found in Tree');
      return undefined;
    }

    // Get the active spec (1-indexed in POB)
    const spec = specs[activeSpec - 1] || specs[0];
    
    // Extract class and ascendancy IDs
    let classId = parseInt(spec.getAttribute('classId') || '0', 10);
    let ascendClassId = parseInt(spec.getAttribute('ascendClassId') || '0', 10);
    
    // If classId is 0, try to decode from URL element (legacy format)
    if (classId === 0) {
      const urlElement = spec.querySelector('URL');
      if (urlElement && urlElement.textContent) {
        console.log('🌳 [POB] classId is 0, trying to decode from URL');
        const decoded = decodeClassFromTreeUrl(urlElement.textContent.trim());
        if (decoded) {
          classId = decoded.classId;
          ascendClassId = decoded.ascendClassId;
        }
      }
    }
    
    const secondaryAscendClassId = parseInt(spec.getAttribute('secondaryAscendClassId') || '0', 10);
    const treeVersion = spec.getAttribute('treeVersion') || '0_4';

    // Extract allocated node IDs
    const nodesAttr = spec.getAttribute('nodes') || '';
    const allocatedNodes = nodesAttr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));

    console.log('🌳 [POB] Allocated nodes count:', allocatedNodes.length);

    // Extract mastery selections: format is {nodeId,effectId},{nodeId,effectId},...
    const masteryEffectsAttr = spec.getAttribute('masteryEffects') || '';
    const masterySelections = new Map<number, number>();
    const masteryPattern = /\{(\d+),(\d+)\}/g;
    let masteryMatch;
    while ((masteryMatch = masteryPattern.exec(masteryEffectsAttr)) !== null) {
      const nodeId = parseInt(masteryMatch[1], 10);
      const effectId = parseInt(masteryMatch[2], 10);
      if (!isNaN(nodeId) && !isNaN(effectId)) {
        masterySelections.set(nodeId, effectId);
      }
    }

    console.log('🌳 [POB] Mastery selections count:', masterySelections.size);

    // Extract jewel socket allocations
    const jewelSockets = new Map<number, number>();
    const socketsElement = spec.querySelector('Sockets');
    if (socketsElement) {
      const socketElements = socketsElement.querySelectorAll('Socket');
      socketElements.forEach(socket => {
        const nodeId = parseInt(socket.getAttribute('nodeId') || '0', 10);
        const itemId = parseInt(socket.getAttribute('itemId') || '0', 10);
        if (nodeId > 0 && itemId > 0) {
          jewelSockets.set(nodeId, itemId);
        }
      });
    }

    console.log('🌳 [POB] Jewel sockets count:', jewelSockets.size);

    const result: PassiveTreeData = {
      classId,
      className: getClassName(classId),
      ascendClassId,
      ascendClassName: getAscendancyName(classId, ascendClassId),
      secondaryAscendClassId: secondaryAscendClassId > 0 ? secondaryAscendClassId : undefined,
      secondaryAscendClassName: secondaryAscendClassId > 0 
        ? getAscendancyName(classId, secondaryAscendClassId) 
        : undefined,
      allocatedNodes,
      masterySelections,
      treeVersion,
      jewelSockets: jewelSockets.size > 0 ? jewelSockets : undefined,
    };

    console.log('🌳 [POB] Passive tree extraction complete:', {
      class: result.className,
      ascendancy: result.ascendClassName,
      allocatedNodes: result.allocatedNodes.length,
      masteryCount: result.masterySelections.size,
      treeVersion: result.treeVersion,
    });

    return result;
  } catch (error) {
    console.error('❌ [POB] Error extracting passive tree:', error);
    return undefined;
  }
}

// Main function to parse PoB code - returns both gems and notes
export async function parsePathOfBuildingCodeWithNotes(pobCode: string): Promise<PobParseResult> {
  try {
    // Clean the input
    const cleanInput = pobCode.trim();
    
    let actualPobCode: string;
    
    // Check if input is a pobb.in URL
    if (isPobbinUrl(cleanInput)) {
      // Extract the actual PoB code from pobb.in
      actualPobCode = await extractFromPobbinUrl(cleanInput);
    } else {
      // Use input directly as PoB code
      actualPobCode = cleanInput;
    }
    
    // Decompress the data
    const xmlString = await zlibInflate(actualPobCode);
    
    
    // Extract loadouts from XML
    const loadouts = extractLoadoutsFromXML(xmlString);
    const hasMultipleLoadouts = loadouts.length > 1;

    // Parse gems from XML (default/first loadout)
    const gemProgression = parseGemsFromXML(xmlString);

    // Extract notes from XML
    const notes = extractNotesFromXML(xmlString);

    // Extract items from XML (all loadouts)
    const items = extractItemsFromXML(xmlString);

    // Extract passive tree data from XML
    const passiveTree = extractPassiveTreeFromXML(xmlString);

    console.log('🎯 [POB] Parse complete - Final result:', {
      hasGemProgression: !!gemProgression,
      socketGroups: gemProgression?.socketGroups?.length || 0,
      hasNotes: !!notes,
      notesLength: notes?.length || 0,
      notesPreview: notes ? notes.substring(0, 100) + '...' : 'No notes',
      hasLoadouts: loadouts.length > 0,
      loadoutsCount: loadouts.length,
      hasItems: items.length > 0,
      itemsCount: items.length,
      hasPassiveTree: !!passiveTree,
      allocatedNodes: passiveTree?.allocatedNodes?.length || 0,
    });

    return {
      gemProgression,
      notes,
      loadouts: loadouts.length > 0 ? loadouts : undefined,
      hasMultipleLoadouts,
      items: items.length > 0 ? items : undefined,
      passiveTree,
    };
  } catch (error) {
    console.error('Error parsing PoB code:', error);
    throw new Error(error instanceof Error ? error.message : 'Invalid Path of Building code. Please check the format and try again.');
  }
}

// Legacy function for backward compatibility - only returns gems
export async function parsePathOfBuildingCode(pobCode: string): Promise<GemProgression> {
  const result = await parsePathOfBuildingCodeWithNotes(pobCode);
  return result.gemProgression;
}


// Generate sample POB result with multiple loadouts for testing
export function generateSamplePobResult(): PobParseResult {
  const baseProgression = generateSampleGemProgression();
  
  // Create a second loadout with different gems
  const secondLoadout: PobLoadout = {
    name: "Fire Build",
    gemProgression: {
      socketGroups: [
        {
          id: 'group-fire-1',
          mainGem: {
            id: 'main-fire-1',
            name: 'Fireball',
            type: 'skill',
            acquired: false,
            statRequirement: null,
          },
          supportGems: [
            {
              id: 'support-fire-1-1',
              name: 'Fire Mastery',
              type: 'support',
              acquired: false,
              statRequirement: getStatRequirement('Fire Mastery'),
            },
            {
              id: 'support-fire-1-2',
              name: 'Spell Echo',
              type: 'support',
              acquired: false,
              statRequirement: getStatRequirement('Spell Echo'),
            },
          ],
          maxSockets: 6,
        },
      ],
      lastImported: new Date().toISOString(),
    }
  };
  
  return {
    gemProgression: baseProgression, // Default shows first loadout
    loadouts: [
      {
        name: "Lightning Build",
        gemProgression: baseProgression
      },
      secondLoadout
    ],
    hasMultipleLoadouts: true
  };
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
          statRequirement: null, // Main gems should be white
        },
        supportGems: [
          {
            id: 'support-1-1',
            name: 'Lightning Exposure',
            type: 'support',
            acquired: false,
            statRequirement: getStatRequirement('Lightning Exposure'),
          },
          {
            id: 'support-1-2',
            name: 'Lightning Mastery',
            type: 'support',
            acquired: false,
            statRequirement: getStatRequirement('Lightning Mastery'),
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
          statRequirement: null, // Main gems should be white
        },
        supportGems: [
          {
            id: 'support-2-1',
            name: 'Fork',
            type: 'support',
            acquired: false,
            statRequirement: getStatRequirement('Fork'),
          },
          {
            id: 'support-2-2',
            name: 'Lightning Infusion',
            type: 'support',
            acquired: false,
            statRequirement: getStatRequirement('Lightning Infusion'),
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
          statRequirement: null, // Spirit gems should be white
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
        statRequirement: null, // Main gems and spirit gems should always be white
      },
      supportGems: group.supportGems.map(gem => ({
        ...gem,
        statRequirement: gem.statRequirement ?? getStatRequirement(gem.name),
      })),
    })),
  };
}

