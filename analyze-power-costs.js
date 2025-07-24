const fs = require('fs');

// Read the App.js file to extract power data
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

// Define the cost categories (from the current implementation)
const noCostPowers = [
  'Amaranth', 'Beast Mind', 'Bestial Frenzy', 'Black Ichor', 'Clawed Form',
  'Cloak Sight', 'Cognizance', 'Test Vitae', 'Totemic Form', 'Toughness',
  'Umbra Sight', 'Venom Blood', 'Venomous Bite', 'Visions'
];

const oneEnergyCost = [
  'Aggravated 1', 'Aggravated Claws', 'Appear', 'Avert', 'Body Wrack',
  'Cloak', 'Cloak Gathering', 'Light Weapon', 'Medicine', 'Root',
  'Sanctuary', 'Sense Confidence', 'Sense Demon', 'True Form',
  'Umbra Strike', 'Weaponry', 'Wither', 'Withstand', 'Woadling', 'Wounding Lies'
];

const oneWillpowerCost = [
  'Avoidance', 'Materialize', 'Resist Taint', 'Revive'
];

const twoEnergyCost = [
  'Balefire', 'Blood Buff', 'Brittle Bones', 'Brutal Strike',
  'Cleanse', 'Majesty', 'Mass Taunt', 'Venom'
];

const oneVirtueCost = [
  'Bestial Healing'
];

const specialCost = ['War Form'];

// Combine all defined powers
const definedPowers = new Set([
  ...noCostPowers,
  ...oneEnergyCost, 
  ...oneWillpowerCost,
  ...twoEnergyCost,
  ...oneVirtueCost,
  ...specialCost
]);

// Find powers without defined costs
const undefinedPowers = [...allPowers].filter(power => !definedPowers.has(power));

console.log(`Total unique powers in game data: ${allPowers.size}`);
console.log(`Powers with defined costs: ${definedPowers.size}`);
console.log(`Powers WITHOUT defined costs: ${undefinedPowers.length}`);
console.log('\n=== POWERS WITHOUT DEFINED COSTS ===');

// Sort alphabetically for easier reading
undefinedPowers.sort().forEach((power, index) => {
  console.log(`${index + 1}. "${power}"`);
});

// Save to file for reference
fs.writeFileSync('./undefined-power-costs.txt', undefinedPowers.sort().join('\n'));
console.log('\nSaved undefined powers to undefined-power-costs.txt');

// Also show some examples of powers that DO have costs defined
console.log('\n=== SAMPLE POWERS WITH DEFINED COSTS ===');
console.log('No Cost:', noCostPowers.slice(0, 5).join(', '));
console.log('1 Energy:', oneEnergyCost.slice(0, 5).join(', '));
console.log('1 Willpower:', oneWillpowerCost.join(', '));
console.log('2 Energy:', twoEnergyCost.slice(0, 5).join(', '));
console.log('1 Virtue:', oneVirtueCost.join(', '));