// Simple POB analyzer tool
const https = require('https');
const zlib = require('zlib');

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  
  while (str.length % 4) {
    str += '=';
  }
  
  return Buffer.from(str, 'base64');
}

async function analyzePOB(url) {
  try {
    console.log(`Fetching POB from: ${url}`);
    
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    console.log('POB code fetched, decompressing...');
    
    const compressed = base64UrlDecode(response.trim());
    const xmlString = zlib.inflateSync(compressed).toString('utf-8');
    
    console.log('\n=== POB XML STRUCTURE ANALYSIS ===');
    console.log(`XML length: ${xmlString.length} characters`);
    console.log('\n--- First 3000 characters ---');
    console.log(xmlString.substring(0, 3000));
    console.log('\n--- Search for SkillSet structure ---');
    
    const skillSetPattern = /<SkillSet[^>]*>([\s\S]*?)<\/SkillSet>/gi;
    const skillSets = [...xmlString.matchAll(skillSetPattern)];
    
    console.log(`Found ${skillSets.length} SkillSet elements with content`);
    
    skillSets.forEach((match, index) => {
      const fullSkillSet = match[0];
      const content = match[1];
      
      const titleMatch = fullSkillSet.match(/title="([^"]*)"/);
      const title = titleMatch ? titleMatch[1] : 'No title';
      
      console.log(`\n--- SkillSet ${index + 1}: "${title}" ---`);
      console.log('SkillSet opening tag:', fullSkillSet.split('>')[0] + '>');
      
      const skillPattern = /<Skill[^>]*>[\s\S]*?<\/Skill>/gi;
      const skills = [...content.matchAll(skillPattern)];
      if (skills.length > 0) {
        console.log(`  Contains ${skills.length} Skill elements:`);
        skills.slice(0, 3).forEach((skillMatch, skillIndex) => {
          const skillElement = skillMatch[0];
          console.log(`    Skill ${skillIndex + 1}:`);
          console.log(`      Opening tag: ${skillElement.split('>')[0]}>`);
          
          const gemPattern = /<Gem[^>]*(?:\/>|>[\s\S]*?<\/Gem>)/gi;
          const gems = [...skillElement.matchAll(gemPattern)];
          if (gems.length > 0) {
            console.log(`      Contains ${gems.length} Gem elements:`);
            gems.forEach((gemMatch, gemIndex) => {
              console.log(`        Gem ${gemIndex + 1}: ${gemMatch[0].substring(0, 200)}...`);
            });
          } else {
            console.log('      No Gem elements found');
          }
          
          const skillOpeningTag = skillElement.split('>')[0] + '>';
          if (skillOpeningTag.includes('label=')) {
            const labelMatch = skillOpeningTag.match(/label="([^"]*)"/);
            if (labelMatch) console.log(`      Label: "${labelMatch[1]}"`);
          }
        });
        if (skills.length > 3) {
          console.log(`    ... and ${skills.length - 3} more skills`);
        }
      } else {
        console.log('  No Skill elements found in this SkillSet');
      }
    });
    
    console.log('\n--- Search for loadout indicators ---');
    
    const patterns = [
      /name="[^"]*lvl[^"]*"/gi,
      /name="[^"]*level[^"]*"/gi,
      /name="[^"]*\d+-\d+[^"]*"/gi,
      /<Build[^>]*>/gi,
      /<Tree[^>]*>/gi,
      /<TreeSpec[^>]*>/gi,
      /<SkillSet[^>]*>/gi
    ];
    
    patterns.forEach((pattern, index) => {
      const matches = xmlString.match(pattern);
      if (matches) {
        console.log(`Pattern ${index + 1} matches (${pattern}):`, matches.slice(0, 10)); // Show first 10 matches
      }
    });
    
    console.log('\n--- Element counts ---');
    const elements = ['Build', 'Tree', 'TreeSpec', 'Skill', 'Skills', 'Config'];
    elements.forEach(element => {
      const regex = new RegExp(`<${element}`, 'gi');
      const matches = xmlString.match(regex);
      console.log(`${element} elements: ${matches ? matches.length : 0}`);
    });
    
    console.log('\n=== END ANALYSIS ===');
    
  } catch (error) {
    console.error('Error analyzing POB:', error.message);
  }
}

const pobUrl = 'https://pobb.in/3mNntazEF5OB/raw';
analyzePOB(pobUrl);