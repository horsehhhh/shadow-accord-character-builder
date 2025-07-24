const fs = require('fs');

// Read the App.js file to extract power data and cost logic
const appJs = fs.readFileSync('./src/App.js', 'utf8');

// Extract the powerTrees section
const powerTreesMatch = appJs.match(/powerTrees:\s*`([^`]+)`/);
if (!powerTreesMatch) {
  console.error('Could not find powerTrees data');
  process.exit(1);
}

const powerTreesCSV = powerTreesMatch[1];

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return obj;
  });
}

const powerTrees = parseCSV(powerTreesCSV);

// Extract all unique power names
const allPowers = new Set();

powerTrees.forEach(tree => {
  for (let level = 1; level <= 3; level++) {
    const powersString = tree[`level${level}_powers`];
    if (powersString) {
      const powers = powersString.split('|').map(p => p.trim()).filter(p => p);
      powers.forEach(power => allPowers.add(power));
    }
  }
});

// Copy the exact cost logic from the current implementation
function getPowerCost(powerName) {
  const power = powerName.trim();
  
  // No Cost Powers (Passive/Free)
  const noCostPowers = [
    'Amaranth', 'Beast Mind', 'Bestial Frenzy', 'Black Ichor', 'Clawed Form',
    'Cloak Sight', 'Cognizance', 'Test Vitae', 'Totemic Form', 'Toughness',
    'Umbra Sight', 'Venom Blood', 'Venomous Bite', 'Visions',
    // Sensing powers (typically passive)
    'Sense Amaranth', 'Sense Angst', 'Sense Desire', 'Sense Emotion', 'Sense Essence',
    'Sense Fetter', 'Sense Gnosis', 'Sense Item', 'Sense Max Health', 'Sense Mental',
    'Sense Pathos', 'Sense Rank', 'Sense Shadow', 'Sense Spirit', 'Sense Vitae', 'Sense Vitality',
    // Test powers (typically passive)
    'Test Generation', 'Test Oath',
    // Physical form changes (typically passive)
    'Clawed Form: Wolf Mask', 'Razor Claws', 'Silver Claws', 'Silver Armor',
    // Detection powers
    'Detect Fetter', 'Detect Taint', 'Read Magic', 'Insight', 'Smell Fear'
  ];
  
  // 1 Energy Cost
  const oneEnergyCost = [
    'Aggravated 1', 'Aggravated Claws', 'Appear', 'Avert', 'Body Wrack',
    'Cloak', 'Cloak Gathering', 'Light Weapon', 'Medicine', 'Root',
    'Sanctuary', 'Sense Confidence', 'Sense Demon', 'True Form',
    'Umbra Strike', 'Weaponry', 'Wither', 'Withstand', 'Woadling', 'Wounding Lies',
    // Mental effects
    'Confusion', 'Forgetful Mind', 'Telepathy', 'Derange', 'Obedience',
    // Physical actions
    'Disarm', 'Shatter', 'Might', 'Taunt', 'Snarl', 'Silence',
    // Movement/positioning
    'Hasty Escape', 'Disembodied', 'Gauntlet Walk',
    // Healing/beneficial
    'Healing Touch', 'Fast Healing', 'Heal Self', 'Serenity',
    // Illusion/disguise
    'Mask of a Thousand Faces', 'Imitate', 'Mimic', 'Hallucination',
    // Environmental
    'Fire 2', 'Fire Weapon', 'Fabricate Armor', 'Move Object',
    // Combat utilities
    'Entrancement', 'Paralyze', 'Stonehand Punch'
  ];
  
  // 1 Willpower Cost
  const oneWillpowerCost = [
    'Avoidance', 'Materialize', 'Resist Taint', 'Revive',
    // High-level mental powers
    'Conditioning', 'Possession', 'Subjugate',
    // Significant transformations
    'Form of Vapor', 'Powerful Form', 'Horrid Form',
    // Major combat abilities
    'Frenzy Control', 'Song of Rage', "Hero's Stand"
  ];
  
  // 2 Energy Cost
  const twoEnergyCost = [
    'Balefire', 'Blood Buff', 'Brittle Bones', 'Brutal Strike',
    'Cleanse', 'Majesty', 'Mass Taunt', 'Venom',
    // High-damage attacks
    'Fire 4', 'Ranged 4 (Bile)', 'Ranged 4 (Earth)',
    // Powerful area effects
    'Horrid Reality', 'Terror', 'Dreamshape',
    // Major healing/restoration
    'Health Exchange', 'Resilience', 'Endure',
    // Advanced manipulations
    'Meld', 'Induce Frenzy', 'Induce Sin', 'Disable'
  ];
  
  // 1 Virtue Cost
  const oneVirtueCost = [
    'Bestial Healing',
    // Miraculous/divine powers
    'Miracle', 'Divine Wrath', 'Exorcism',
    // Ultimate abilities
    'Umbra Drain', 'Leech of Fear'
  ];
  
  // Special cases
  if (power === 'War Form') {
    return 'Req. 1+ Energy';
  }
  
  // Pattern matching for special power types
  if (power.startsWith('Ranged 2')) {
    return '1 Energy'; // Ranged 2 attacks cost 1 Energy
  }
  if (power.startsWith('<Tainted>')) {
    return '1 Energy'; // Tainted powers typically cost 1 Energy
  }
  if (power.includes('Weapon') || power.includes('Armor')) {
    return '1 Energy'; // Equipment creation powers
  }
  
  // Check power against cost categories
  if (noCostPowers.includes(power)) {
    return 'No Cost';
  } else if (oneEnergyCost.includes(power)) {
    return '1 Energy';
  } else if (oneWillpowerCost.includes(power)) {
    return '1 Willpower';
  } else if (twoEnergyCost.includes(power)) {
    return '2 Energy';
  } else if (oneVirtueCost.includes(power)) {
    return '1 Virtue';
  } else {
    return 'Variable';
  }
}

// Generate cost assignments for all powers
const powerCosts = {};
const costCategories = {
  'No Cost': [],
  '1 Energy': [],
  '1 Willpower': [],
  '2 Energy': [],
  '1 Virtue': [],
  'Req. 1+ Energy': [],
  'Variable': []
};

[...allPowers].sort().forEach(power => {
  const cost = getPowerCost(power);
  powerCosts[power] = cost;
  costCategories[cost].push(power);
});

// Output comprehensive list
console.log('=== COMPREHENSIVE POWER COST LIST ===');
console.log(`Total Powers: ${allPowers.size}\n`);

Object.keys(costCategories).forEach(costType => {
  const powers = costCategories[costType];
  if (powers.length > 0) {
    console.log(`\n**${costType.toUpperCase()}** (${powers.length} powers):`);
    powers.forEach((power, index) => {
      console.log(`  ${index + 1}. ${power}`);
    });
  }
});

// Save detailed list to file
let output = '=== COMPREHENSIVE POWER COST LIST ===\n';
output += `Total Powers: ${allPowers.size}\n\n`;

Object.keys(costCategories).forEach(costType => {
  const powers = costCategories[costType];
  if (powers.length > 0) {
    output += `\n${costType.toUpperCase()} (${powers.length} powers):\n`;
    powers.forEach((power, index) => {
      output += `  ${index + 1}. ${power}\n`;
    });
  }
});

fs.writeFileSync('./comprehensive-power-costs.txt', output);
console.log('\n\nSaved comprehensive power cost list to comprehensive-power-costs.txt');

// Generate summary statistics
const stats = Object.keys(costCategories).map(cost => ({
  cost,
  count: costCategories[cost].length,
  percentage: ((costCategories[cost].length / allPowers.size) * 100).toFixed(1)
}));

console.log('\n=== COVERAGE STATISTICS ===');
stats.forEach(stat => {
  console.log(`${stat.cost}: ${stat.count} powers (${stat.percentage}%)`);
});

const definedPowers = allPowers.size - costCategories['Variable'].length;
console.log(`\nDefined Costs: ${definedPowers} powers (${((definedPowers / allPowers.size) * 100).toFixed(1)}%)`);
console.log(`Undefined Costs: ${costCategories['Variable'].length} powers (${((costCategories['Variable'].length / allPowers.size) * 100).toFixed(1)}%)`);