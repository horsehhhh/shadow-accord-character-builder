import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Lock, Users } from 'lucide-react';
import { npcBankAPI } from '../services/api';

const ST_PASSWORD = '1234!';

const isTrustedUser = () => {
  if (sessionStorage.getItem('stSessionUnlocked') === 'true') return true;
  try {
    const stEmail = localStorage.getItem('stEmail');
    if (!stEmail) return false;
    return JSON.parse(localStorage.getItem('user'))?.email === stEmail;
  } catch { return false; }
};

// ── Faction templates ──────────────────────────────────────────────────────────
const FACTIONS = {
  vampire: {
    label: 'Vampire', energyType: 'Vitae',
    energyDefault: 15, energyMin: 10, energyMax: 45,
    virtue: 'Road', virtueDefault: 6,
    regenRate: 1,
    subfactionLabel: 'Clan',
    subfactions: ['Assamite','Baali','Brujah','Caitiff','Cappadocian','Gangrel','Gargoyle','Giovanni','Lamia','Lasombra','Malkavian','Nosferatu','Ravnos','Salubri (Healer)','Salubri (Warrior)','Toreador','Tremere','Tzimisce','Ventrue'],
    fundamentals: ['Amaranth','Bestial Frenzy','Blood Buff','Draining','Paralyzing Bite','Test Faction','Test Vitae'],
  },
  shifter: {
    label: 'Shifter', energyType: 'Gnosis',
    energyDefault: 15, energyMin: 10, energyMax: 20,
    virtue: 'Rage', virtueDefault: 7,
    regenRate: 2,
    subfactionLabel: 'Tribe / Fera',
    subfactions: ['Black Fury','Black Spiral Dancer','Bone Gnawer','Child of Gaia','Fenrir (Get of Fenris)','Fianna','Red Talon','Shadow Lord','Silent Strider','Silver Fang','Warder of Man','Ananasi','Bagheera','Bubasti','Ceilican','Corax','Fallen Fera','Ratkin','Swara'],
    fundamentals: ['Bestial Frenzy','Bestial Healing','Step Sideways','War Form'],
  },
  wraith: {
    label: 'Wraith', energyType: 'Pathos',
    energyDefault: 15, energyMin: 10, energyMax: 20,
    virtue: 'Angst', virtueDefault: 4,
    regenRate: 1,
    fundamentals: ['Fetter Healing','Portal Walk','Sense Emotion','Temporary Angst','Umbra Sight'],
  },
  human: {
    label: 'Human', energyType: 'Vitality',
    energyDefault: 12, energyMin: 10, energyMax: 15,
    virtue: 'Humanity', virtueDefault: 7,
    regenRate: 0,
    subfactionLabel: 'Subfaction',
    subfactions: ['Commoner','Faithful','Ghoul','Gifted Kinfolk','Sorcerer','Mage','Claimed (Drone)','Claimed (Gorgon)','Claimed (Fomori)'],
    fundamentals: [],
  },
  fae: {
    label: 'Fae', energyType: 'Mists',
    energyDefault: 20, energyMin: 10, energyMax: 45,
    virtue: 'Weaving', virtueDefault: 7,
    regenRate: 1,
    subfactionLabel: 'Court',
    fundamentals: ['Dreamshape','Gauntlet Walk','Portal Walk','Sense Faction','Sense Fae Oath','Show/Hide Mein'],
  },
  demon: {
    label: 'Demon', energyType: 'Faith',
    energyDefault: 100, energyMin: 70, energyMax: 170,
    virtue: 'Torment', virtueDefault: 10,
    regenRate: 0,
    isLegendary: true,
    fundamentals: ['Apocalyptic Form','Bestow Patron','Bestow Power','Cloak Sight','Dark Knowledge <Fallen Paths>','Dark Knowledge <Dark Thaumaturgy>','Divine Potency','Induce Sin','Omniscience','Sense Confidence','Sense Demon','Sense Item','Sense Patron','Sense Torment','Sense Virtue','Umbra Sight'],
  },
  plasmic: {
    label: 'Plasmic', energyType: 'Quintessence',
    energyDefault: 15, energyMin: 5, energyMax: 30,
    virtue: 'Gnosis', virtueDefault: 7,
    regenRate: 0,
    fundamentals: [],
  },
  spirit: {
    label: 'Spirit', energyType: 'Quintessence',
    energyDefault: 15, energyMin: 5, energyMax: 30,
    virtue: 'Gnosis', virtueDefault: 7,
    regenRate: 0,
    fundamentals: [],
  },
  zombie: {
    label: 'Zombie', energyType: 'None',
    energyDefault: 0, energyMin: 0, energyMax: 0,
    virtue: 'None', virtueDefault: 0,
    regenRate: 0,
    fundamentals: ['Toughness'],
  },
  monster: {
    label: 'Monster', energyType: 'Unknown',
    energyDefault: 0, energyMin: 0, energyMax: 170,
    virtue: 'None', virtueDefault: 0,
    regenRate: 0,
    subfactionLabel: 'Monster Type',
    subfactions: ['Fright', 'Horror', 'Terror', 'Legend'],
    fundamentals: [],
  },
};

const MONSTER_TYPES = {
  Fright: { health: '10',    energy: '0–15 (or 20–30)',   wpRange: '1–3',  powers: '0–4',      immunities: '0–2', augmentRange: '0–2' },
  Horror: { health: '10–20', energy: '0–20 (or 20–40)',   wpRange: '2–5',  powers: '1–8',      immunities: '0–3', augmentRange: '0–4' },
  Terror: { health: '10–40', energy: '0–40 (or 40–80)',   wpRange: '3–8',  powers: '1–16',     immunities: '0–4', augmentRange: '0–6' },
  Legend: { health: '10–80', energy: '0–80 (or 100–170)', wpRange: '4–10', powers: 'No limit', immunities: 'No limit', augmentRange: '0–9', isLegendary: true },
};

const SCORCH_DAMAGE_TYPES = ['Agg','Fire','Blood','Dark','Light','Silver','Wolfsbane','Gold','Holy','Iron','Water','Other'];

const HUMAN_SUBFACTION_OVERRIDES = {
  'Ghoul':          { energyType: 'Vitae',  regenRate: 1, extraFundamentals: ['Test Vitae'] },
  'Gifted Kinfolk': { energyType: 'Gnosis', regenRate: 0, extraFundamentals: [] },
  'Sorcerer':       { energyType: 'Essence',regenRate: 0, extraFundamentals: [] },
  'Mage':           { energyType: 'Essence',regenRate: 0, extraFundamentals: ['Cloak Sight','Gauntlet Walk','Read Magic','Sense Essence','Sense Faction','Sense Item','Telepathy','Umbra Sight','Q: Empower Self'], isLegendary: true },
  'Claimed (Drone)':  { regenRate: 3, extraFundamentals: ['Sense Spirit'], isPermatainted: true },
  'Claimed (Gorgon)': { regenRate: 0, extraFundamentals: ['Sense Spirit'], isPermatainted: true },
  'Claimed (Fomori)': { regenRate: 0, extraFundamentals: ['Sense Spirit'], isPermatainted: true },
};

const GENERATION_TABLE = [
  { gen: 13, label: '13th (Neonate)',     energy: 15 },
  { gen: 12, label: '12th (Neonate)',     energy: 15 },
  { gen: 11, label: '11th (Ancilla)',     energy: 15 },
  { gen: 10, label: '10th (Ancilla)',     energy: 15 },
  { gen:  9, label: '9th (Elder)',        energy: 20 },
  { gen:  8, label: '8th (Elder)',        energy: 25 },
  { gen:  7, label: '7th (Methuselah)',   energy: 35 },
  { gen:  6, label: '6th (Methuselah)',   energy: 45 },
];

const WRAITH_LEGIONS = ['Iron Legion','Skeletal Legion','Grim Legion','Penitent Legion','Emerald Legion','Silent Legion','Legion of Paupers','Legion of Fate','Renegades','Heretics','No Legion'];
const WRAITH_GUILDS  = ['Artificers','Masquers','Pardoners','Usurers','Chanteurs','Harbingers','Oracles','Sandmen','Haunters','Monitors','Spooks','Proctors','Puppeteers','Alchemists','Mnemoi','Solicitors','Enfant','No Guild'];
const SHIFTER_BREEDS  = ['Homid','Lupus','Metis','Other'];
const SHIFTER_AUSPICES = ['Ragabash','Theurge','Philodox','Galliard','Ahroun','Other'];

// ── Faction tree suggestions for ST autocomplete ────────────────────────────
const FACTION_TREES = {
  vampire: [
    'Animalism','Auspex','Celerity','Dominate','Fortitude','Obfuscate','Potence','Presence',
    'Daimoinon','Deimos','Dementation','Mortis','Necromancy','Obtenebration','Protean',
    'Quietus','Valeren Healer','Valeren Warrior','Vicissitude','Visceratika',
    'Thaumaturgy: Creo Ignem','Thaumaturgy: Rego Aquam','Thaumaturgy: Rego Vitae',
    'Path of the Defiler','Rego Dolor (Path of Pain)','Rego Manes (Path of Spirit)',
    'Rego Pestis (Path of Pestilence)','Rego Phobos (Path of Fear)',
  ],
  shifter: [
    'Ahroun','Galliard','Philodox','Ragabash','Theurge','Homid','Lupus','Natus',
    'Black Fury Gift','Bone Gnawer Gift','Child of Gaia Gift','Fenrir Gift','Fianna Gift',
    'Red Talon Gift','Shadow Lord Gift','Silent Strider Gift','Silver Fang Gift','Warder of Man Gift',
    'Ananasi Gift','Bagheera Gift','Bubasti Gift','Ceilican Gift','Corax Gift','Ratkin Gift','Swara Gift',
    'Corruption (Wyrm)','Cunning (Wyrm)','Defiling (Wyrm)','Fear (Wyrm)','Madness (Wyrm)',
  ],
  wraith: [
    'Argos','Castigate','Embody','Fatalism','Flux','Inhabit','Intimation','Keening',
    'Lifeweb','Mnemosynis','Moliate','Outrage','Pandemonium','Phantasm','Puppetry','Usury',
    'Contaminate','Hive Mind','Larceny','Maleficence','Tempest Weaving',
  ],
  human: [
    'Animal','Body','Curse','Healer','Mind','Patterns','Perception','Protection','Spirit','Warrior',
    'Death','Demonology','Madness','Ruin',
    'Ahl-i-batin','Craftmason','Messianic Voices','Old Faith','Order of Hermes',
    'Spirit Talkers','Valdaermen','Veneficti',
    'Affinity','Champion','Discernment','Purity','Solace','Spiritual',
    'Brash','Brawny','Inquisitive','Sturdy',
    'Stasis','Weaver','Onesong',
    'Enticer','Ferectori','Gorehound','Toad','Gorgon',
  ],
  fae:     ['Chicanery','Legerdemain','Metamorphosis','Naming','Primal','Soothsay','Sovereign','Wayfare'],
  demon:   ['Lore of the Fundament','Lore of Humanity','Lore of the Winds','Lore of Storms','Lore of the Earth','Lore of the Forge','Lore of the Flame','Lore of the Celestials'],
  monster: [],
};

// Tree access per human subfaction
const _SORCERER_TREES  = ['Animal','Body','Curse','Healer','Mind','Patterns','Perception','Protection','Spirit','Warrior','Death','Demonology','Madness','Ruin','Ahl-i-batin','Craftmason','Messianic Voices','Old Faith','Order of Hermes','Spirit Talkers','Valdaermen','Veneficti'];
const _FELLOWSHIP_TREES = ['Affinity','Champion','Discernment','Purity','Solace','Spiritual'];
const _TALENT_TREES     = ['Brash','Brawny','Inquisitive','Sturdy'];
const _CLAIMED_TREES    = ['Stasis','Weaver','Onesong','Enticer','Ferectori','Gorehound','Toad','Gorgon'];
const SUBFACTION_TREES = {
  'Ghoul':            FACTION_TREES.vampire,
  'Sorcerer':         [..._SORCERER_TREES, ..._FELLOWSHIP_TREES],
  'Mage':             [..._SORCERER_TREES, ..._FELLOWSHIP_TREES],
  'Gifted Kinfolk':   FACTION_TREES.shifter,
  'Faithful':         _FELLOWSHIP_TREES,
  'Commoner':         _TALENT_TREES,
  'Claimed (Drone)':  FACTION_TREES.human,
  'Claimed (Gorgon)': FACTION_TREES.human,
  'Claimed (Fomori)': FACTION_TREES.human,
};

// Powers granted at each dot level per tree (tree_name → [dot1, dot2, dot3])
const POWER_TREE_LOOKUP = {
  'Ahroun':                              ['Silver Claws', 'Might', 'Brutal Strike'],
  'Ananasi Gift':                        ['Cloak', 'Venom', 'Meld'],
  'Animalism':                           ['Beast Mind', 'Disquiet / Induce Frenzy', 'Frenzy Control'],
  'Animal':                              ['Beast Mind', 'Disquiet / Induce Frenzy', 'Frenzy Control'],
  'Argos':                               ['Cloak', 'Resilience', 'Hasty Escape'],
  'Auspex':                              ['Sense Amaranth / Sense Emotion / Sense Item / Sense Vitae', 'Telepathy', 'Cloak Sight'],
  'Bagheera Gift':                       ['Detect Taint', 'Fire Weapon', 'Daze'],
  'Bubasti Gift':                        ['Forgetful Mind', 'Entrancement', 'Form of Vapor'],
  'Ceilican Gift':                       ['Hallucination / Withstand', 'Fire Weapon', 'Hasty Escape'],
  'Swara Gift':                          ['Razor Claws', 'Mask of a Thousand Faces', 'Gauntlet Walk'],
  'Black Fury Gift':                     ['Detect Taint', 'Body Wrack', 'Aggravated 1'],
  'Body':                                ['Withstand / Endure', 'Resilience', 'Resist Taint'],
  'Bone Gnawer Gift':                    ['Forgetful Mind', 'Ranged 2 <Stone>', 'Resist Taint'],
  'Castigate':                           ['Detect Taint / Sense Angst / Sense Shadow', 'Disquiet / Shadow Coax', 'Sanctuary'],
  'Celerity':                            ['Disarm', 'Avoidance', 'Hasty Escape'],
  'Child of Gaia Gift':                  ['Healing Touch', 'Serenity', 'Silver Armor'],
  'Contaminate':                         ['Sense Fetter / Taint', 'Rend the Lifeweb', 'Induce Catharsis'],
  'Corax Gift':                          ['Insight', 'Fire 2', 'Hasty Escape'],
  'Curse':                               ['Forgetful Mind', 'Body Wrack', 'Paralyze'],
  'Daimoinon':                           ['Sense Desire', 'Hellborn Investiture', 'Balefire'],
  'Death':                               ['<Tainted> Silence', 'Insight', '<Tainted> Decay'],
  'Deimos':                              ['Black Ichor', 'Dreamshape', 'Ranged 4 (Bile)'],
  'Dementation':                         ['Confusion', 'Visions', 'Derange / Passion'],
  'Demonology':                          ['Sense Demon / Scion of Evil', 'Umbra Sight', 'Subjugate'],
  'Dominate':                            ['Forgetful Mind', 'Obedience', 'Conditioning'],
  'Embody':                              ['Disembodied', 'Appear', 'Materialize'],
  'Fatalism':                            ['Insight / Sense Pathos', 'Visions', 'Cloak Sight'],
  'Fenrir Gift':                         ['Razor Claws', 'Venom', "Hero's Stand"],
  'Fianna Gift':                         ['Fast Healing', 'Woadling', 'Form of Vapor'],
  'Flux':                                ['Move Object / Sense Item', 'Shatter / Wither', 'Ranged 4 (Earth)'],
  'Fortitude':                           ['Endure / Withstand', 'Resilience', 'Toughness'],
  'Galliard':                            ['Taunt', 'Dreamshape', 'Song of Rage'],
  'Healer':                              ['Healing Touch', 'Serenity', 'Revive'],
  'Hive Mind':                           ['Detect Taint / Sense Angst / Sense Shadow', 'Telepathy', 'Subjugate'],
  'Homid':                               ['Avert', 'Avoidance', 'Paralyze'],
  'Inhabit':                             ['Sense Item / Withstand', 'Might', 'Dark Sword / Fabricate Armor'],
  'Intimation':                          ['Sense Desire', 'Induce Sin', 'Craving'],
  'Keening':                             ['Passion', 'Ranged 2 (Sonic)', 'Conditioning'],
  'Larceny':                             ['Fast Healing', 'Devour / Expel Corpus / Health Exchange / Paralyzing Touch', 'Toughness'],
  'Lifeweb':                             ['Fetter Creation / Sense Fetter', 'Detect Fetter / Fetter Consumption', 'Disable'],
  'Lupus':                               ['Snarl', 'Resilience', 'Frenzy Control'],
  'Madness':                             ['<Tainted> Monsters', 'Derange', 'Horrid Reality'],
  'Maleficence':                         ['Detect Taint / Scion of Evil', '<Tainted> Silence', '<Tainted> Horrid Reality'],
  'Mind':                                ['Confusion', 'Telepathy', 'Obedience'],
  'Mnemosynis':                          ['Forgetful Mind', 'Telepathy', 'Obedience'],
  'Moliate':                             ['Weaponry', 'Imitate', 'Resilience / Powerful Form'],
  'Mortis':                              ['Wither', 'Meld', 'Decay'],
  'Natus':                               ['Wither', 'Telepathy', 'Passion / Terror'],
  'Necromancy':                          ['Insight', 'Umbra Sight', 'Umbra Drain'],
  'Obfuscate':                           ['Cloak', 'Mask of a Thousand Faces', 'Cloak Gathering'],
  'Obtenebration':                       ['Root / Tentacles', 'Terror', 'Form of Vapor'],
  'Outrage':                             ['Stonehand Punch', 'Move Object / Realm Grasp', 'Aggravated 1'],
  'Pandemonium':                         ['Confusion', 'Monsters', 'Avoidance / Root'],
  'Patterns':                            ['Shatter', 'Fabricate Armor', 'Disable'],
  'Perception':                          ['Sense Item / Sense Essence', 'Read Magic / Sense Spirit', 'Detect Taint / Sense Confidence / Sense Desire'],
  'Phantasm':                            ['Cognizance', 'Dreamshape', 'Daze'],
  'Philodox':                            ['Sense Gnosis / Sense Item', 'Meditate', 'Toughness'],
  'Potence':                             ['Shatter', 'Might', 'Brutal Strike'],
  'Presence':                            ['Snarl', 'Entrancement', 'Majesty'],
  'Protection':                          ['Avert', 'Cloak', 'Sanctuary'],
  'Protean':                             ['Clawed Form: Wolf Mask / Razor Claws', 'Meld', 'Aggravated Claws'],
  'Puppetry':                            ['Control Voice', 'Control Body', 'Puppet Control'],
  'Quietus':                             ['Silence', 'Venom', 'Daze'],
  'Ragabash':                            ['Confusion', 'Disembodied / Realm Grasp', 'Mimic'],
  'Ratkin Gift':                         ['Cloak', 'Monsters', 'Aggravated 1'],
  'Red Talon Gift':                      ['Shatter', 'Beast Mind / Root', 'Fire 4'],
  'Ruin':                                ['<Tainted> Wither', 'Ranged 2 <Dark>', 'Brittle Bones'],
  'Shadow Lord Gift':                    ['Disarm', 'Wounding Lies', 'Disable'],
  'Tempest Weaving':                     ['Cloak', 'Meld', 'Form of Vapor'],
  'Silent Strider Gift':                 ['Silence', 'Horrid Reality', 'Gauntlet Walk'],
  'Silver Fang Gift':                    ['Detect Taint', 'True Form', 'Obedience'],
  'Spirit':                              ['Resist Gauntlet', 'Cleanse', 'Exorcism'],
  'Thaumaturgy: Creo Ignem':             ['Fire 2', '<Fire> Weapon', 'Fire 4'],
  'Thaumaturgy: Rego Aquam':             ['Silence', 'Fabricate Armor', 'Paralyze'],
  'Thaumaturgy: Rego Vitae':             ['Sense Vitae / Test Generation / Test Blood Bond', 'Ranged 2 <Blood>', 'Aggravated 1'],
  'Path of the Defiler':                 ['Taint', 'Derange', 'Balefire'],
  'Rego Dolor (Path of Pain)':           ['Silence', 'Body Wrack', 'Horrid Reality'],
  'Rego Manes (Path of Spirit)':         ['Scion of Evil / Sense Demon / Sense Spirit', 'Umbra Sight', 'Subjugate'],
  'Rego Pestis (Path of Pestilence)':    ['Wither', 'Venom', 'Brittle Bones'],
  'Rego Phobos (Path of Fear)':          ['Monsters', 'Dreamshape / Terror', 'Leech of Fear'],
  'Theurge':                             ['Release Spirit / Sense Spirit', 'Umbra Sight', 'Umbra Strike'],
  'Usury':                               ['Pathos Exchange / Paralyzing Touch', 'Devour / Expel Corpus / Health Exchange', 'Pathos Investment'],
  'Valeren Healer':                      ['Healing Touch', 'Serenity', 'Revive'],
  'Valeren Warrior':                     ['Sense Max Health / Sense Mental / Sense Health', 'Body Wrack', 'Light Weapon / Vengeance of Samiel'],
  'Vicissitude':                         ['Weaponry', 'Imitate', 'Resilience / Powerful Form: Green and Black Spiked Mask'],
  'Visceratika':                         ['Cloak / Clawed Form', 'Avoidance', 'Powerful Form / Resilience'],
  'Warder of Man Gift':                  ['Pence from Heaven', 'Fabricate Armor', 'Cloak Sight'],
  'Warrior':                             ['Taunt', 'Might', 'Avoidance / Disarm'],
  'Ahl-i-batin':                         ['Visions', 'Mask of a Thousand Faces', 'Hasty Escape'],
  'Craftmason':                          ['Pence from Heaven', 'Meditate', 'Daze'],
  'Messianic Voices':                    ['Sense Demon / Silence', 'Ranged 2 (Holy)', 'Majesty'],
  'Old Faith':                           ['Root', 'Wither', 'Entrancement / Passion'],
  'Order of Hermes':                     ['Fire 2', 'True Form / Daze', 'Disembodied'],
  'Spirit Talkers':                      ['Hallucination', 'Dreamshape', 'Umbra Sight'],
  'Valdaermen':                          ['Snarl', 'Clawed Form / Powerful Form', 'Toughness'],
  'Veneficti':                           ['Sense Demon / Venom', 'Induce Sin', 'Silver Tongue'],
  'Affinity':                            ['Pence from Heaven', 'Taunt', 'Hypnotism'],
  'Champion':                            ['Heal Self', 'Resilience', 'Avoidance / Disarm'],
  'Discernment':                         ['Detect Taint', 'Sense Amaranth / Sense Demon / Sense Rank', 'Cloak Sight'],
  'Purity':                              ['Avert', 'Serenity', 'Cleanse'],
  'Solace':                              ['Sense Angst / Sense Fetter / Sense Shadow', 'Detect Fetter / Fetter Consumption', 'Exorcism'],
  'Spiritual':                           ['Sense Spirit / Resist Gauntlet', 'Umbra Sight', 'Umbra Strike'],
  'Stasis':                              ['Cloak Gathering', 'Fabricate Armor', 'Toughness'],
  'Weaver':                              ['Taint / True Form', 'Paralyze', 'Disable'],
  'Onesong':                             ['Forgetful Mind / Visions', 'Telepathy', 'Conditioning / Entrancement'],
  'Enticer':                             ['Tentacles', '<Tainted> Entrancement', 'Paralyze'],
  'Ferectori':                           ['<Tainted> Snarl', 'Terror', 'Gauntlet Walk'],
  'Gorehound':                           ['Fast Healing', '<Tainted> Body Wrack', 'Might'],
  'Toad':                                ['Ranged 2 <Acid>', 'Taint / Venom', 'Form of Vapor'],
  'Gorgon':                              ['Hallucination', 'Dreamshape', 'Gauntlet Walk / Umbra Sight'],
  'Brash':                               ['Taunt', 'Disarm', 'Avoidance'],
  'Brawny':                              ['Shatter', 'Might', 'Brutal Strike'],
  'Inquisitive':                         ['Sense Emotion', 'Sense Mental', 'Sense Vitality'],
  'Sturdy':                              ['Endure & Withstand', 'Resilience', 'Toughness'],
  'Corruption (Wyrm)':                   ['Taint', 'Corrupted Powers', 'Subjugate'],
  'Cunning (Wyrm)':                      ['Smell Fear', 'Cloak Gathering', 'Hidden Taint'],
  'Defiling (Wyrm)':                     ['Detect Taint / Scion of Evil', 'Induce Sin', 'Tainted Induce Frenzy / Terror'],
  'Fear (Wyrm)':                         ['Sense Confidence', 'Horrid Reality', 'Disable'],
  'Madness (Wyrm)':                      ['Tainted Confusion', 'Tainted Derange', 'Tainted Decay'],
  'Strength (Wyrm)':                     ['Hide of the Wyrm', 'Totemic Form / Resilience', 'Balefire'],
  'Nephandi':                            ['Ranged 2 <Void>', 'Induce Frenzy / Taint', 'Hidden Taint'],
};

const SKILL_DATA = {
  'Academics': { cat: 'OTHER',      levels: ['Literacy - read/write languages', 'Tutor - teach extra skill', 'Mentor - teach extra power'] },
  'Alchemy':   { cat: 'PRODUCTION', levels: ['Bottle Essence', 'Energy Conversion', 'Alchemical Wisdom'], restriction: 'Sorcerer' },
  'Archery':   { cat: 'COMBAT',     levels: ['Bow/crossbow proficiency', 'Pinning Shot - Root power', 'Overdraw - Brutal Strike power'] },
  'Armory':    { cat: 'PRODUCTION', levels: ['Weapon/armor crafting', 'Repair armor', 'Rapid Repair'] },
  'Brawl':     { cat: 'COMBAT',     levels: ['Dual brawl boffers', 'Deflect with brawl boffers', 'Knockout - Daze power'] },
  'Guidance':  { cat: 'OTHER',      levels: ['Fascination - Guidance+Passion', 'Inspiration - Guidance+Meditate', 'Foreboding - Guidance+Despair'] },
  'Herbalism': { cat: 'PRODUCTION', levels: ['Herbalism Points for potions/poisons', 'Medicinal Application', 'Mithridatism - Resist Poison'] },
  'Holy Water':{ cat: 'PRODUCTION', levels: ['Holy Water production', 'Purify - Cleanse power', 'Sanctify - Sanctuary power'], restriction: 'Human' },
  'Locksmith': { cat: 'PRODUCTION', levels: ['Keysmith', 'Lock production', 'Lockpick'] },
  'Medicine':  { cat: 'OTHER',      levels: ['Health Check / Sense Health', 'First Aid / Detect Dead, Dying, Incapacitated', 'Diagnosis / Detect Condition'] },
  'Melee':     { cat: 'COMBAT',     levels: ['Martial weapon proficiency', 'Great Weapons - 2 damage', 'Flourish - Disarm power'] },
  'Rituals':   { cat: 'OTHER',      levels: ['Scribe - receive 1 Simple Public ritual', 'Journey Scribe - 1 Simple/Guarded OR Research (3 Simple+ scrolls)', 'Expert Scribe - 1 Simple/Guarded/Secret OR Thesis (3 Complex+ scrolls)'] },
  'Shields':   { cat: 'COMBAT',     levels: ['Shield proficiency', 'Glancing Blow - Withstand power', 'Deflection - Avoidance power'] },
};

const MERIT_DATA = {
  'Adept':               { desc: 'Additional production item per check-in (except Alchemy)' },
  'Antiquarian':         { desc: 'Attunement pool increased by 4 points' },
  'Averted Weakness':    { desc: 'Do not suffer clan weakness (not available to Gargoyles/Cappadocians/Nosferatu)' },
  'Delirium':            { desc: 'Supernatural events cause Confusion or Frenzy; memory erased. Spend Willpower to resist for 10 min. Cannot take if Unveiled.' },
  'Doomslayer':          { desc: 'Use Dark Arcanoi without Catharsis (repeatable)' },
  'Eidolon':             { desc: 'Leave Catharsis after 5 minutes instead of 10' },
  'Enhanced Blood Buff': { desc: 'Spend 3 Energy for Augment 1 for 10 minutes' },
  'Escape Artist':       { desc: 'Gain Escape power - slip free of restraints in 60 seconds' },
  'Font of Sustenance':  { desc: 'Your blood worth one additional Vitae per Health once per event' },
  'Hardy':               { desc: 'Resist one status per day' },
  'Healthy':             { desc: 'Maximum health increased by 2' },
  'Herd':                { desc: 'Source of vitae outside town (repeatable)' },
  'Hidden Amaranth':     { desc: 'Always answer Sense Amaranth with Zero' },
  'Hypnotist':           { desc: 'Gain Hypnotism power for truth-telling' },
  'Income':              { desc: 'Gain 6 copper per check-in or 1 Bit for wraiths (repeatable)' },
  'Kinfolk':             { desc: 'Related to a shifter tribe - select specific tribe' },
  'Lost Soul':           { desc: 'Option to become wraith when you die' },
  'Medium':              { desc: 'Can hear the Umbra' },
  'Misplaced Heart':     { desc: 'Heart relocated to arm or leg - choose location at purchase' },
  'Mix Morph':           { desc: 'Use claws without mask but without war form augment' },
  'Moon Ties':           { desc: 'Complex auspice benefits and foibles based on lunar phase' },
  'Nimble':              { desc: 'Resist one damage attack per day' },
  'Oracle':              { desc: 'Receive prophecy at check-in. Requires: Theurge/Dementation 1/Fatalism 1/Guidance 3' },
  'Pale Aura':           { desc: 'Answer Sense Faction as Human; answer Yes to Sense Living; treated as if you have Vitality' },
  'Steel Trap':          { desc: 'Aware when targeted by Forgetful Mind' },
  'Strong Will':         { desc: 'Mental powers last 5 minutes instead of 10' },
  'Tainted Soul':        { desc: 'Permanently tainted' },
  'Taste of Oblivion':   { desc: 'When drained while tainted causes Catharsis in drainer (only while Tainted)' },
  'Umbral Affinity':     { desc: 'Step Sideways takes 30 seconds instead of 60' },
  'Unbondable':          { desc: 'Requires 3 feedings (at least 10 min apart) from same Vampire in same event to become Blood Bound' },
};

// ── Dot rating display ─────────────────────────────────────────────────────────
function Dots({ n, max = 5 }) {
  return <span className="tracking-tight">{Array.from({ length: max }, (_, i) => (
    <span key={i} className={i < n ? 'text-white' : 'text-gray-600'}>●</span>
  ))}</span>;
}

// ── NPC Card helpers ──────────────────────────────────────────────────────────
function StatRow({ label, value, accent }) {
  return (
    <tr className="border-b border-gray-800 last:border-0">
      <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide w-28 align-top">{label}</td>
      <td className={`px-3 py-1.5 text-xs ${accent ? 'text-amber-300 font-bold' : 'text-white'}`}>{value}</td>
    </tr>
  );
}

function CardSection({ title, color = 'text-purple-400', children }) {
  return (
    <div className="px-3 py-2.5 border-b border-gray-800 last:border-0">
      <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${color}`}>{title}</div>
      {children}
    </div>
  );
}

function SkillRow({ skill }) {
  const info = SKILL_DATA[skill.name];
  return (
    <div className="text-xs text-gray-200">
      <div className="flex items-baseline gap-2">
        <Dots n={skill.dots} max={3} />
        <span className="font-semibold">{skill.name}</span>
        {info && <span className="text-gray-500">[{info.cat}]</span>}
      </div>
      {info && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {Array.from({ length: skill.dots }, (_, i) => (
            <div key={i} className="text-gray-400">
              <span className="text-gray-500">{i + 1}:</span> {info.levels[i]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MeritRow({ merit }) {
  const info = MERIT_DATA[merit];
  return (
    <div className="text-xs text-gray-200">
      <span className="font-semibold">{merit}</span>
      {info && <div className="ml-3 mt-0.5 text-gray-400">{info.desc}</div>}
    </div>
  );
}

function PowerRow({ power }) {
  const levels = POWER_TREE_LOOKUP[power.tree] || [];
  const displayEntries = power.exact
    ? (levels[power.level - 1] ? [{ i: power.level - 1, lvl: levels[power.level - 1] }] : [])
    : Array.from({ length: power.level }, (_, i) => ({ i, lvl: levels[i] })).filter(e => e.lvl);
  return (
    <div className="text-xs text-gray-200">
      <div className="flex items-baseline gap-2">
        <Dots n={power.level} max={3} />
        <span className="font-semibold">{power.tree}</span>
      </div>
      {displayEntries.length > 0 && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {displayEntries.map(({ i, lvl }) => (
            <div key={i} className="text-gray-400">
              {!power.exact && <span className="text-gray-500">{i + 1}: </span>}
              {lvl}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NPC Card preview ──────────────────────────────────────────────────────────
function NPCCard({ npc, resolvedFaction }) {
  const {
    name, title, faction, subfaction, isLegendary, isPermatainted,
    energy, energyType, willpower, virtue, virtueValue, regenRate,
    powerTrees = [], fundamentals, skills, merits, notes,
    specialAbilities = [],
    generation, road, amaranth,
    breed, auspice, rank,
    legion, guild, passions, shadowArchetype, thorn,
    lineage, court, echoes,
    trueName, celestialName, appellation, demonicVice,
    extraField1, extraField2,
    health,
    monsterHealth, isRealmbound, isHealthAsEnergy, monsterAugment,
    scorchTypes, immunities, weaknesses, senseFaction,
  } = npc;

  const innate     = powerTrees.filter(p => p.cat === 'innate');
  const learned    = powerTrees.filter(p => p.cat === 'learned');

  const fLabel = resolvedFaction?.label || faction;

  const factionSpecifics = [];
  if (faction === 'vampire') {
    const genRow = GENERATION_TABLE.find(g => g.gen === Number(generation));
    if (genRow) factionSpecifics.push(`Generation: ${genRow.label}`);
    if (road) factionSpecifics.push(`Road: ${road}`);
    if (amaranth > 0) factionSpecifics.push(`Amaranth: ${amaranth}`);
  } else if (faction === 'shifter') {
    if (breed) factionSpecifics.push(`Breed: ${breed}`);
    if (auspice) factionSpecifics.push(`Auspice: ${auspice}`);
    if (rank) factionSpecifics.push(`Rank: ${rank}`);
  } else if (faction === 'wraith') {
    if (legion && legion !== 'No Legion') factionSpecifics.push(`Legion: ${legion}`);
    if (guild && guild !== 'No Guild') factionSpecifics.push(`Guild: ${guild}`);
    if (passions) factionSpecifics.push(`Passions: ${passions}`);
    if (shadowArchetype) factionSpecifics.push(`Shadow: ${shadowArchetype}${thorn ? ` — Thorn: ${thorn}` : ''}`);
  } else if (faction === 'fae') {
    if (lineage) factionSpecifics.push(`Lineage: ${lineage}`);
    if (court) factionSpecifics.push(`Court: ${court}`);
    if (echoes) factionSpecifics.push(`Echoes: ${echoes}`);
  } else if (faction === 'demon') {
    if (trueName) factionSpecifics.push(`True Name: ${trueName}`);
    if (celestialName) factionSpecifics.push(`Celestial Name: ${celestialName}`);
    if (appellation) factionSpecifics.push(`Appellation: ${appellation}`);
    if (demonicVice) factionSpecifics.push(`Vice: ${demonicVice}`);
  } else if (faction === 'plasmic' || faction === 'spirit') {
    if (extraField1) factionSpecifics.push(`Type: ${extraField1}`);
    if (extraField2) factionSpecifics.push(extraField2);
  } else if (faction === 'monster') {
    factionSpecifics.push(isRealmbound
      ? 'Realmbound. Goes to Dead if forced into the Umbra.'
      : 'Umbrabound. Goes to Dead if forced into the Realm.');
    if (isHealthAsEnergy) factionSpecifics.push('Spend Health as Energy.');
    if (senseFaction) factionSpecifics.push(`Call "no effect" to ${senseFaction} Sense Health or any healing powers/skills.`);
  }

  return (
    <div className="border-2 border-purple-700 rounded-lg bg-gray-950 shadow-xl overflow-hidden print:shadow-none text-sm">

      {/* ── Header ── */}
      <div className="bg-purple-950 border-b-2 border-purple-800 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white font-black text-xl tracking-tight leading-none">{name || '[ NPC Name ]'}</div>
            {title && <div className="text-purple-300 text-sm italic mt-1">{title}</div>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isLegendary && <span className="text-xs bg-yellow-900 border border-yellow-700 text-yellow-300 px-2 py-0.5 rounded font-bold whitespace-nowrap">⚑ LEGENDARY</span>}
            {isPermatainted && <span className="text-xs bg-red-900 border border-red-700 text-red-300 px-2 py-0.5 rounded whitespace-nowrap">☠ PERMATAINTED</span>}
            <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">NPC</span>
          </div>
        </div>
      </div>

      {/* ── Stats table ── */}
      <table className="w-full border-b border-gray-800">
        <tbody>
          <StatRow label="Faction" value={fLabel} />
          {subfaction && <StatRow label="Sub-Faction" value={subfaction} />}
          {energyType !== 'None' && <StatRow label="Energy" value={`${energy} (${energyType})`} />}
          <StatRow label="Willpower" value={willpower} />
          <StatRow label="Virtue" value={virtue !== 'None' ? `${virtueValue} (${virtue})` : 'N/A'} />
          {regenRate > 0 && <StatRow label="Regen Rate" value={regenRate} />}
          {faction !== 'monster' && <StatRow label="Health" value={health ?? 5} accent />}
          {faction === 'monster' && <StatRow label="Health" value={monsterHealth} accent />}
          {faction === 'monster' && monsterAugment > 0 && <StatRow label="Augment" value={monsterAugment} />}
          {faction === 'vampire' && generation && (
            <StatRow label="Generation" value={GENERATION_TABLE.find(g => g.gen === Number(generation))?.label || generation} />
          )}
        </tbody>
      </table>

      {/* ── Monster: Scorch / Immunities / Weaknesses ── */}
      {faction === 'monster' && (scorchTypes?.length > 0 || immunities?.some(im => im.text) || weaknesses?.some(w => w.text)) && (
        <table className="w-full border-b border-gray-800">
          <tbody>
            {scorchTypes?.length > 0 && (
              <tr className="border-b border-gray-800 last:border-0">
                <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide w-28 align-top">Scorch</td>
                <td className="px-3 py-1.5 text-xs text-orange-300">{scorchTypes.join(', ')}</td>
              </tr>
            )}
            {immunities?.some(im => im.text) && (
              <tr className="border-b border-gray-800 last:border-0">
                <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide align-top">Immunities</td>
                <td className="px-3 py-1.5 text-xs text-cyan-300">
                  <div className="space-y-0.5">
                    {immunities.filter(im => im.text).map((im, i) => (
                      <div key={i}>{im.text}{im.condition ? <span className="text-gray-400"> (unless: {im.condition})</span> : ''}</div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
            {weaknesses?.some(w => w.text) && (
              <tr className="border-b border-gray-800 last:border-0">
                <td className="px-3 py-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide align-top">Weaknesses</td>
                <td className="px-3 py-1.5 text-xs text-red-300">
                  <div className="space-y-0.5">
                    {weaknesses.filter(w => w.text).map((w, i) => (
                      <div key={i}>{w.text}{w.condition ? <span className="text-gray-400"> (when: {w.condition})</span> : ''}</div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ── Content sections ── */}
      <div>
        {factionSpecifics.length > 0 && (
          <CardSection title="Faction Specifics">
            <div className="space-y-0.5">
              {factionSpecifics.map((line, i) => <div key={i} className="text-gray-200 text-xs">{line}</div>)}
            </div>
          </CardSection>
        )}

        {fundamentals.filter(Boolean).length > 0 && (
          <CardSection title="Fundamental Powers" color="text-purple-300">
            <div className="space-y-0.5">
              {fundamentals.filter(Boolean).map((f, i) => <div key={i} className="text-gray-200 text-xs">{f}</div>)}
            </div>
          </CardSection>
        )}

        {innate.length > 0 && (
          <CardSection title="Innate Trees" color="text-green-400">
            <div className="space-y-0.5">{innate.map((p, i) => <PowerRow key={i} power={p} />)}</div>
          </CardSection>
        )}

        {learned.length > 0 && (
          <CardSection title="Learned Trees" color="text-blue-400">
            <div className="space-y-0.5">{learned.map((p, i) => <PowerRow key={i} power={p} />)}</div>
          </CardSection>
        )}

        {specialAbilities.filter(Boolean).length > 0 && (
          <CardSection title="Special Abilities" color="text-amber-400">
            <div className="space-y-0.5">
              {specialAbilities.filter(Boolean).map((s, i) => <div key={i} className="text-xs text-gray-200">{s}</div>)}
            </div>
          </CardSection>
        )}

        {skills.some(s => s.name) && (
          <CardSection title="Skills" color="text-gray-300">
            <div className="space-y-1.5">
              {skills.filter(s => s.name).map((s, i) => <SkillRow key={i} skill={s} />)}
            </div>
          </CardSection>
        )}

        {merits.some(m => m.trim()) && (
          <CardSection title="Merits" color="text-gray-300">
            <div className="space-y-1.5">
              {merits.filter(m => m.trim()).map((m, i) => <MeritRow key={i} merit={m} />)}
            </div>
          </CardSection>
        )}

        {notes && (
          <CardSection title="Notes" color="text-gray-400">
            <p className="text-xs text-gray-300 whitespace-pre-wrap italic">{notes}</p>
          </CardSection>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const NPCCreator = ({ onBack }) => {
  const [unlocked, setUnlocked] = useState(isTrustedUser);
  const [pwInput, setPwInput]   = useState('');
  const [pwError, setPwError]   = useState(false);

  // Identity
  const [name, setName]               = useState('');
  const [title, setTitle]             = useState('');
  const [faction, setFaction]         = useState('vampire');
  const [subfaction, setSubfaction]   = useState('');
  const [isLegendary, setIsLegendary] = useState(false);

  // Stats
  const [energy, setEnergy]           = useState(15);
  const [energyType, setEnergyType]   = useState('Vitae');
  const [willpower, setWillpower]     = useState(6);
  const [virtue, setVirtue]           = useState('Road');
  const [virtueValue, setVirtueValue] = useState(6);
  const [regenRate, setRegenRate]     = useState(1);

  // Vampire extras
  const [generation, setGeneration] = useState(10);
  const [road, setRoad]             = useState('Road of Humanity');
  const [amaranth, setAmaranth]     = useState(0);

  // Shifter extras
  const [breed, setBreed]     = useState('Homid');
  const [auspice, setAuspice] = useState('Ahroun');
  const [rank, setRank]       = useState(1);

  // Wraith extras
  const [legion, setLegion]                 = useState('No Legion');
  const [guild, setGuild]                   = useState('No Guild');
  const [passions, setPassions]             = useState('');
  const [shadowArchetype, setShadowArchetype] = useState('');
  const [thorn, setThorn]                   = useState('');

  // Fae extras
  const [lineage, setLineage] = useState('');
  const [court, setCourt]     = useState('');
  const [echoes, setEchoes]   = useState('');

  // Demon extras
  const [trueName, setTrueName]           = useState('');
  const [celestialName, setCelestialName] = useState('');
  const [appellation, setAppellation]     = useState('');
  const [demonicVice, setDemonicVice]     = useState('');

  // Plasmic/Spirit
  const [extraField1, setExtraField1] = useState('');
  const [extraField2, setExtraField2] = useState('');

  // Monster extras
  const [monsterHealth, setMonsterHealth]       = useState(10);
  const [isRealmbound, setIsRealmbound]         = useState(true);
  const [isHealthAsEnergy, setIsHealthAsEnergy] = useState(false);
  const [monsterAugment, setMonsterAugment]     = useState(1);
  const [scorchTypes, setScorchTypes]           = useState(['Fire']);
  const [newScorchType, setNewScorchType]       = useState('Fire');
  const [immunities, setImmunities]             = useState([{ text: '', condition: '' }]);
  const [weaknesses, setWeaknesses]             = useState([{ text: '', condition: '' }]);
  const [senseFaction, setSenseFaction]         = useState('Monster');

  // Powers
  const [powerTrees, setPowerTrees]             = useState([]);
  const [specialAbilities, setSpecialAbilities] = useState([]);
  const [fundamentals, setFundamentals]         = useState([]);

  // Skills
  const [skills, setSkills] = useState([{ name: '', dots: 1 }]);

  // Merits + notes
  const [merits, setMerits]   = useState(['']);
  const [notes, setNotes]     = useState('');

  // Health (non-monster): base 10 + 4 per Toughness power + 2 per Healthy merit
  const calcHealth = useCallback((trees, meritsArr) => {
    const hasToughness = trees.some(pt => {
      const lvls = POWER_TREE_LOOKUP[pt.tree] || [];
      return lvls.slice(0, pt.level).some(l => l.split(' / ').some(p => p.trim() === 'Toughness'));
    });
    const healthyCount = meritsArr.filter(m => m.trim() === 'Healthy').length;
    return 10 + (hasToughness ? 4 : 0) + (healthyCount * 2);
  }, []);
  const [healthOverride, setHealthOverride]     = useState(null); // null = use auto-calc
  const autoHealth = useMemo(() => calcHealth(powerTrees, merits), [calcHealth, powerTrees, merits]);
  const health = healthOverride !== null ? healthOverride : autoHealth;
  const [isPermatainted, setIsPermatainted] = useState(false);

  const nextPowerId  = useRef(1);
  // Suppresses reactive faction/subfaction effects when bulk-loading a saved NPC
  const loadingRef   = useRef(false);

  // NPC bank
  const [activeTab, setActiveTab]     = useState('create');
  const [savedNPCs, setSavedNPCs]     = useState([]);
  const [bankLoading, setBankLoading] = useState(false);

  // Apply faction template when faction changes
  useEffect(() => {
    if (loadingRef.current) return;
    const tmpl = FACTIONS[faction];
    if (!tmpl) return;
    setEnergyType(tmpl.energyType);
    setEnergy(tmpl.energyDefault);
    setVirtue(tmpl.virtue);
    setVirtueValue(tmpl.virtueDefault);
    setRegenRate(tmpl.regenRate);
    setIsLegendary(!!tmpl.isLegendary);
    setSubfaction('');
    setFundamentals([...tmpl.fundamentals]);
    if (faction === 'monster') { setScorchTypes(['Fire']); setMonsterHealth(10); setMonsterAugment(1); setSenseFaction('Monster'); setIsRealmbound(true); setIsHealthAsEnergy(false); }
  }, [faction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply human subfaction overrides
  useEffect(() => {
    if (loadingRef.current) return;
    if (faction !== 'human') return;
    const tmpl = FACTIONS.human;
    const override = HUMAN_SUBFACTION_OVERRIDES[subfaction] || {};
    setEnergyType(override.energyType || tmpl.energyType);
    setRegenRate(override.regenRate ?? tmpl.regenRate);
    setIsLegendary(!!override.isLegendary);
    setIsPermatainted(!!override.isPermatainted);
    const base = [...tmpl.fundamentals];
    const extra = override.extraFundamentals || [];
    setFundamentals([...base, ...extra]);
  }, [subfaction, faction]);

  // Auto-set energy from vampire generation
  useEffect(() => {
    if (loadingRef.current) return;
    if (faction !== 'vampire') return;
    const row = GENERATION_TABLE.find(g => g.gen === Number(generation));
    if (row) setEnergy(row.energy);
  }, [generation, faction]);

  // Auto-set Legendary + Umbra Sight fundamentals for monster type/realm changes
  useEffect(() => {
    if (loadingRef.current) return;
    if (faction !== 'monster') return;
    if (MONSTER_TYPES[subfaction]?.isLegendary) setIsLegendary(true);
    setFundamentals(prev => {
      const base = prev.filter(f => f !== 'Umbra Sight');
      return isRealmbound ? base : [...base, 'Umbra Sight'];
    });
  }, [subfaction, isRealmbound, faction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── NPC Bank ─────────────────────────────────────────────────────────────
  const loadBank = useCallback(async () => {
    setBankLoading(true);
    const local = JSON.parse(localStorage.getItem('shadowAccordNPCBank') || '[]');
    setSavedNPCs(local);
    try {
      if (localStorage.getItem('auth_token')) {
        const cloud = await npcBankAPI.getAll();
        setSavedNPCs(cloud);
        localStorage.setItem('shadowAccordNPCBank', JSON.stringify(cloud));
      }
    } catch (e) { /* stay with local */ }
    setBankLoading(false);
  }, []);

  useEffect(() => { if (unlocked) loadBank(); }, [unlocked, loadBank]);

  const saveToBank = useCallback(async () => {
    if (!name.trim()) { alert('Give the NPC a name before saving.'); return; }
    const data = {
      name, title, faction, subfaction, isLegendary, isPermatainted,
      energy, energyType, willpower, virtue, virtueValue, regenRate,
      powerTrees, fundamentals, specialAbilities,
      skills, merits, notes,
      generation, road, amaranth,
      breed, auspice, rank,
      legion, guild, passions, shadowArchetype, thorn,
      lineage, court, echoes,
      trueName, celestialName, appellation, demonicVice,
      extraField1, extraField2,
      healthOverride,
      monsterHealth, isRealmbound, isHealthAsEnergy, monsterAugment,
      scorchTypes, immunities, weaknesses, senseFaction,
    };
    try {
      let entry;
      if (localStorage.getItem('auth_token')) {
        entry = await npcBankAPI.create(name, faction, data);
      } else {
        entry = { id: `local_${Date.now()}`, name, faction, data, createdAt: new Date().toISOString() };
      }
      setSavedNPCs(prev => {
        const updated = [entry, ...prev];
        localStorage.setItem('shadowAccordNPCBank', JSON.stringify(updated));
        return updated;
      });
      alert(`"${name}" saved to bank.`);
    } catch (e) {
      alert('Save failed: ' + (e.message || 'Unknown error'));
    }
  }, [name, title, faction, subfaction, isLegendary, isPermatainted, energy, energyType, willpower,
      virtue, virtueValue, regenRate, powerTrees, fundamentals, specialAbilities, skills, merits,
      notes, generation, road, amaranth, breed, auspice, rank, legion, guild, passions,
      shadowArchetype, thorn, lineage, court, echoes, trueName, celestialName, appellation,
      demonicVice, extraField1, extraField2, monsterHealth, isRealmbound, isHealthAsEnergy,
      monsterAugment, scorchTypes, immunities, weaknesses, senseFaction, healthOverride]);

  const clearForm = useCallback(() => {
    loadingRef.current = true;
    setName(''); setTitle(''); setSubfaction(''); setIsLegendary(false); setIsPermatainted(false);
    setFaction('vampire');
    setEnergy(15); setEnergyType('Vitae'); setWillpower(6);
    setVirtue('Road'); setVirtueValue(6); setRegenRate(1);
    setGeneration(10); setRoad('Road of Humanity'); setAmaranth(0);
    setBreed('Homid'); setAuspice('Ahroun'); setRank(1);
    setLegion('No Legion'); setGuild('No Guild'); setPassions(''); setShadowArchetype(''); setThorn('');
    setLineage(''); setCourt(''); setEchoes('');
    setTrueName(''); setCelestialName(''); setAppellation(''); setDemonicVice('');
    setExtraField1(''); setExtraField2('');
    setMonsterHealth(10); setIsRealmbound(true); setIsHealthAsEnergy(false); setMonsterAugment(1);
    setScorchTypes(['Fire']); setImmunities([{ text: '', condition: '' }]); setWeaknesses([{ text: '', condition: '' }]); setSenseFaction('Monster');
    setPowerTrees([]); setSpecialAbilities([]); setFundamentals([]);
    setSkills([{ name: '', dots: 1 }]); setMerits(['']); setNotes('');
    setHealthOverride(null);
    setTimeout(() => { loadingRef.current = false; }, 0);
  }, []);

  const deleteFromBank = useCallback(async (entry) => {
    if (!window.confirm(`Delete "${entry.name}" from the bank?`)) return;
    try {
      if (localStorage.getItem('auth_token') && entry._id) {
        await npcBankAPI.delete(entry._id);
      }
    } catch (e) { /* ignore, still remove locally */ }
    setSavedNPCs(prev => {
      const updated = prev.filter(n => (n._id || n.id) !== (entry._id || entry.id));
      localStorage.setItem('shadowAccordNPCBank', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadNPC = useCallback((entry) => {
    const d = entry.data || entry;
    loadingRef.current = true;
    setName(d.name || '');
    setTitle(d.title || '');
    setFaction(d.faction || 'vampire');
    setSubfaction(d.subfaction || '');
    setIsLegendary(!!d.isLegendary);
    setIsPermatainted(!!d.isPermatainted);
    setEnergy(d.energy ?? 15);
    setEnergyType(d.energyType || '');
    setWillpower(d.willpower ?? 6);
    setVirtue(d.virtue || '');
    setVirtueValue(d.virtueValue ?? 6);
    setRegenRate(d.regenRate ?? 0);
    setGeneration(d.generation ?? 10);
    setRoad(d.road || '');
    setAmaranth(d.amaranth ?? 0);
    setBreed(d.breed || 'Homid');
    setAuspice(d.auspice || 'Ahroun');
    setRank(d.rank ?? 1);
    setLegion(d.legion || 'No Legion');
    setGuild(d.guild || 'No Guild');
    setPassions(d.passions || '');
    setShadowArchetype(d.shadowArchetype || '');
    setThorn(d.thorn || '');
    setLineage(d.lineage || '');
    setCourt(d.court || '');
    setEchoes(d.echoes || '');
    setTrueName(d.trueName || '');
    setCelestialName(d.celestialName || '');
    setAppellation(d.appellation || '');
    setDemonicVice(d.demonicVice || '');
    setExtraField1(d.extraField1 || '');
    setExtraField2(d.extraField2 || '');
    setMonsterHealth(d.monsterHealth ?? 10);
    setHealthOverride(d.healthOverride ?? null);
    setIsRealmbound(d.isRealmbound !== false);
    setIsHealthAsEnergy(!!d.isHealthAsEnergy);
    setMonsterAugment(d.monsterAugment ?? 1);
    setScorchTypes(d.scorchTypes || ['Fire']);
    setImmunities(d.immunities || [{ text: '', condition: '' }]);
    setWeaknesses(d.weaknesses || [{ text: '', condition: '' }]);
    setSenseFaction(d.senseFaction || 'Monster');
    setPowerTrees(d.powerTrees || []);
    setSpecialAbilities(d.specialAbilities || []);
    setFundamentals(d.fundamentals || []);
    setSkills(d.skills || [{ name: '', dots: 1 }]);
    setMerits(d.merits || ['']);
    setNotes(d.notes || '');
    setTimeout(() => { loadingRef.current = false; }, 0);
    setActiveTab('create');
  }, []);

  const printBankedNPC = useCallback((entry) => {
    // Temporarily inject saved data into printNPC — clone data into current npcData shape
    const saved = entry.data || entry;
    const rf = FACTIONS[saved.faction];
    const d = saved;
    const powerDotsStr = n => '\u25cf'.repeat(Math.max(0, n)) + '\u25cb'.repeat(Math.max(0, 3 - n));
    const esc = s => s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : s;
    const row = (label, value) => (value != null && value !== '' && value !== false)
      ? `<tr><td class="lbl">${label}</td><td>${value}</td></tr>` : '';
    const section = (title, content) => content
      ? `<div class="sec"><div class="sec-title">${title}</div>${content}</div>` : '';
    const fLabel = rf?.label || saved.faction;
    const specs = [];
    if (d.faction === 'vampire') {
      const genRow = GENERATION_TABLE.find(g => g.gen === Number(d.generation));
      if (genRow) specs.push(`Generation: ${genRow.label}`);
      if (d.road) specs.push(`Road: ${d.road}`);
      if (d.amaranth > 0) specs.push(`Amaranth: ${d.amaranth}`);
    } else if (d.faction === 'shifter') {
      if (d.breed) specs.push(`Breed: ${d.breed}`);
      if (d.auspice) specs.push(`Auspice: ${d.auspice}`);
      if (d.rank) specs.push(`Rank: ${d.rank}`);
    } else if (d.faction === 'monster') {
      specs.push(d.isRealmbound ? 'Realmbound.' : 'Umbrabound.');
    }
    const innate  = (d.powerTrees || []).filter(p => p.cat === 'innate');
    const learned = (d.powerTrees || []).filter(p => p.cat === 'learned');
    const powerLine = p => {
      const lvls = POWER_TREE_LOOKUP[p.tree] || [];
      const detail = lvls.length > 0
        ? (p.exact
          ? (lvls[p.level - 1] ? esc(lvls[p.level - 1]) : '')
          : Array.from({ length: p.level }, (_, i) => `${i + 1}: ${esc(lvls[i])}`).join(' &bull; '))
        : '';
      return `<div class="item"><span class="dots">${powerDotsStr(p.level)}</span> ${esc(p.tree)}${detail ? `<div class="power-detail">${detail}</div>` : ''}</div>`;
    };
    const monsterExtra = d.faction === 'monster' && d.scorchTypes?.length
      ? `<table class="stats-table">${row('Scorch', d.scorchTypes.join(', '))}</table>` : '';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>NPC: ${d.name || 'Unnamed'}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;font-size:13px;color:#000;background:#fff;padding:28px 32px;max-width:680px}.header{overflow:hidden;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px}.badges{float:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:12px}.badge{border:1px solid #000;padding:1px 7px;font-size:10px;font-weight:bold}.name{font-size:24px;font-weight:bold;line-height:1.2}.npc-title{font-style:italic;color:#333;margin-top:3px;font-size:13px}.stats-table{width:100%;border-collapse:collapse;margin-bottom:8px}.stats-table td{padding:3px 8px;border-bottom:1px solid #ddd;vertical-align:top;font-size:12px}.stats-table td.lbl{font-weight:bold;width:130px;color:#444;white-space:nowrap}.sec{margin-top:9px}.sec-title{font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:5px}.item{font-size:12px;margin:2px 0;line-height:1.5}.dots{font-family:monospace;letter-spacing:1px}.power-detail{font-size:11px;color:#555;margin-left:20px;margin-top:1px}.notes-text{font-style:italic;white-space:pre-wrap;color:#333}@media print{body{padding:0}@page{margin:1.2cm 1.5cm}}</style></head><body><div class="header"><div class="badges">${d.isLegendary ? '<span class="badge">⚑ LEGENDARY</span>' : ''}${d.isPermatainted ? '<span class="badge">☠ PERMATAINTED</span>' : ''}<span class="badge">NPC</span></div><div class="name">${d.name || '[ NPC Name ]'}</div>${d.title ? `<div class="npc-title">${d.title}</div>` : ''}</div><table class="stats-table">${row('Faction', fLabel)}${d.subfaction ? row('Sub-Faction', d.subfaction) : ''}${d.energyType !== 'None' ? row('Energy', `${d.energy} (${d.energyType})`) : ''}${row('Willpower', d.willpower)}${row('Virtue', d.virtue !== 'None' ? `${d.virtueValue} (${d.virtue})` : 'N/A')}${d.regenRate > 0 ? row('Regen Rate', d.regenRate) : ''}${d.faction !== 'monster' ? row('Health', d.health ?? 10) : ''}${d.faction === 'monster' ? row('Health', d.monsterHealth) : ''}</table>${monsterExtra}${specs.length > 0 ? section('Faction Specifics', specs.map(s => `<div class="item">${s}</div>`).join('')) : ''}${(d.fundamentals || []).filter(Boolean).length > 0 ? section('Fundamental Powers', d.fundamentals.filter(Boolean).map(f => `<div class="item">${f}</div>`).join('')) : ''}${innate.length > 0 ? section('Innate Trees', innate.map(powerLine).join('')) : ''}${learned.length > 0 ? section('Learned Trees', learned.map(powerLine).join('')) : ''}${(d.specialAbilities || []).filter(Boolean).length > 0 ? section('Special Abilities', d.specialAbilities.filter(Boolean).map(s => `<div class="item">${s}</div>`).join('')) : ''}${(d.skills || []).some(s => s.name) ? section('Skills', (d.skills || []).filter(s => s.name).map(s => { const info = SKILL_DATA[s.name]; return `<div class="item"><span class="dots">${powerDotsStr(s.dots)}</span> ${esc(s.name)}${info ? ` <span class="src">[${info.cat}]</span>` : ''}${info?.levels ? `<div class="power-detail">${Array.from({ length: s.dots }, (_, i) => `${i + 1}: ${esc(info.levels[i] || '')}`).join(' &bull; ')}</div>` : ''}</div>`; }).join('')) : ''}${(d.merits || []).some(m => m.trim()) ? section('Merits', (d.merits || []).filter(m => m.trim()).map(m => { const info = MERIT_DATA[m.trim()]; return `<div class="item">${esc(m)}${info ? `<div class="power-detail">${esc(info.desc)}</div>` : ''}</div>`; }).join('')) : ''}}${d.notes ? section('Notes', `<p class="notes-text">${d.notes}</p>`) : ''}</body></html>`;
    const win = window.open('', '_blank', 'width=750,height=950');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }, []);

  const resolvedFaction = FACTIONS[faction];

  const npcData = {
    name, title, faction, subfaction, isLegendary, isPermatainted,
    energy, energyType, willpower, virtue, virtueValue, regenRate,
    powerTrees, fundamentals, specialAbilities,
    skills, merits, notes,
    generation, road, amaranth,
    breed, auspice, rank,
    legion, guild, passions, shadowArchetype, thorn,
    lineage, court, echoes,
    trueName, celestialName, appellation, demonicVice,
    extraField1, extraField2,
    health,
    healthOverride,
    monsterHealth, isRealmbound, isHealthAsEnergy, monsterAugment,
    scorchTypes, immunities, weaknesses, senseFaction,
  };

  const printNPC = () => {
    const d = npcData;
    const fLabel = resolvedFaction?.label || faction;
    const powerDotsStr = n => '\u25cf'.repeat(Math.max(0, n)) + '\u25cb'.repeat(Math.max(0, 3 - n));
    const esc = s => s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : s;
    const row = (label, value) => (value != null && value !== '' && value !== false)
      ? `<tr><td class="lbl">${label}</td><td>${value}</td></tr>` : '';
    const section = (title, content) => content
      ? `<div class="sec"><div class="sec-title">${title}</div>${content}</div>` : '';
    const powerLine = p => {
      const lvls = POWER_TREE_LOOKUP[p.tree] || [];
      const detail = lvls.length > 0
        ? (p.exact
          ? (lvls[p.level - 1] ? esc(lvls[p.level - 1]) : '')
          : Array.from({ length: p.level }, (_, i) => `${i + 1}: ${esc(lvls[i])}`).join(' &bull; '))
        : '';
      return `<div class="item">${p.level ? `<span class="dots">${powerDotsStr(p.level)}</span> ` : ''}${esc(p.tree)}${detail ? `<div class="power-detail">${detail}</div>` : ''}</div>`;
    };

    const specs = [];
    if (d.faction === 'vampire') {
      const genRow = GENERATION_TABLE.find(g => g.gen === Number(d.generation));
      if (genRow) specs.push(`Generation: ${genRow.label}`);
      if (d.road) specs.push(`Road: ${d.road}`);
      if (d.amaranth > 0) specs.push(`Amaranth: ${d.amaranth}`);
    } else if (d.faction === 'shifter') {
      if (d.breed) specs.push(`Breed: ${d.breed}`);
      if (d.auspice) specs.push(`Auspice: ${d.auspice}`);
      if (d.rank) specs.push(`Rank: ${d.rank}`);
    } else if (d.faction === 'wraith') {
      if (d.legion && d.legion !== 'No Legion') specs.push(`Legion: ${d.legion}`);
      if (d.guild && d.guild !== 'No Guild') specs.push(`Guild: ${d.guild}`);
      if (d.passions) specs.push(`Passions: ${d.passions}`);
      if (d.shadowArchetype) specs.push(`Shadow: ${d.shadowArchetype}${d.thorn ? ` \u2014 Thorn: ${d.thorn}` : ''}`);
    } else if (d.faction === 'fae') {
      if (d.lineage) specs.push(`Lineage: ${d.lineage}`);
      if (d.court) specs.push(`Court: ${d.court}`);
      if (d.echoes) specs.push(`Echoes: ${d.echoes}`);
    } else if (d.faction === 'demon') {
      if (d.trueName) specs.push(`True Name: ${d.trueName}`);
      if (d.celestialName) specs.push(`Celestial Name: ${d.celestialName}`);
      if (d.appellation) specs.push(`Appellation: ${d.appellation}`);
      if (d.demonicVice) specs.push(`Vice: ${d.demonicVice}`);
    } else if (d.faction === 'plasmic' || d.faction === 'spirit') {
      if (d.extraField1) specs.push(`Type: ${d.extraField1}`);
      if (d.extraField2) specs.push(d.extraField2);
    } else if (d.faction === 'monster') {
      specs.push(d.isRealmbound ? 'Realmbound. Goes to Dead if forced into the Umbra.' : 'Umbrabound. Goes to Dead if forced into the Realm.');
      if (d.isHealthAsEnergy) specs.push('Spend Health as Energy.');
      if (d.senseFaction) specs.push(`Call "no effect" to ${d.senseFaction} Sense Health or any healing powers/skills.`);
    }

    const innate     = (d.powerTrees || []).filter(p => p.cat === 'innate');
    const learned    = (d.powerTrees || []).filter(p => p.cat === 'learned');

    const monsterExtra = d.faction === 'monster' && (d.scorchTypes?.length > 0 || d.immunities?.some(im => im.text) || d.weaknesses?.some(w => w.text))
      ? `<table class="stats-table">
          ${d.scorchTypes?.length > 0 ? row('Scorch', d.scorchTypes.join(', ')) : ''}
          ${d.immunities?.some(im => im.text) ? row('Immunities', d.immunities.filter(im => im.text).map(im => im.text + (im.condition ? ` (unless: ${im.condition})` : '')).join('<br>')) : ''}
          ${d.weaknesses?.some(w => w.text) ? row('Weaknesses', d.weaknesses.filter(w => w.text).map(w => w.text + (w.condition ? ` (when: ${w.condition})` : '')).join('<br>')) : ''}
        </table>` : '';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>NPC: ${d.name || 'Unnamed'}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Georgia, serif; font-size: 13px; color: #000; background: #fff; padding: 28px 32px; max-width: 680px; }
.header { overflow: hidden; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
.badges { float: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; margin-left: 12px; }
.badge { border: 1px solid #000; padding: 1px 7px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; }
.name { font-size: 24px; font-weight: bold; letter-spacing: 0.3px; line-height: 1.2; }
.npc-title { font-style: italic; color: #333; margin-top: 3px; font-size: 13px; }
.stats-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
.stats-table td { padding: 3px 8px; border-bottom: 1px solid #ddd; vertical-align: top; font-size: 12px; }
.stats-table td.lbl { font-weight: bold; width: 130px; color: #444; white-space: nowrap; }
.sec { margin-top: 9px; }
.sec-title { font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 5px; }
.item { font-size: 12px; margin: 2px 0; line-height: 1.5; }
.dots { font-family: monospace; letter-spacing: 1px; }
.power-detail { font-size: 11px; color: #555; margin-left: 20px; margin-top: 1px; }
.src { color: #555; font-size: 11px; }
.skills-wrap { display: flex; flex-wrap: wrap; gap: 0 28px; }
.notes-text { font-style: italic; white-space: pre-wrap; color: #333; line-height: 1.6; }
@media print { body { padding: 0; } @page { margin: 1.2cm 1.5cm; } }
</style></head><body>
<div class="header">
  <div class="badges">
    ${d.isLegendary ? '<span class="badge">\u2691 LEGENDARY</span>' : ''}
    ${d.isPermatainted ? '<span class="badge">\u2620 PERMATAINTED</span>' : ''}
    <span class="badge">NPC</span>
  </div>
  <div class="name">${d.name || '[ NPC Name ]'}</div>
  ${d.title ? `<div class="npc-title">${d.title}</div>` : ''}
</div>
<table class="stats-table">
  ${row('Faction', fLabel)}
  ${d.subfaction ? row('Sub-Faction', d.subfaction) : ''}
  ${d.energyType !== 'None' ? row('Energy', `${d.energy} (${d.energyType})`) : ''}
  ${row('Willpower', d.willpower)}
  ${row('Virtue', d.virtue !== 'None' ? `${d.virtueValue} (${d.virtue})` : 'N/A')}
  ${d.regenRate > 0 ? row('Regen Rate', d.regenRate) : ''}
  ${d.faction !== 'monster' ? row('Health', d.health ?? d.autoHealth ?? 10) : ''}
  ${d.faction === 'monster' ? row('Health', d.monsterHealth) : ''}
  ${d.faction === 'monster' && d.monsterAugment > 0 ? row('Augment', d.monsterAugment) : ''}
  ${d.faction === 'vampire' && d.generation ? row('Generation', GENERATION_TABLE.find(g => g.gen === Number(d.generation))?.label || d.generation) : ''}
</table>
${monsterExtra}
${specs.length > 0 ? section('Faction Specifics', specs.map(s => `<div class="item">${s}</div>`).join('')) : ''}
${d.fundamentals.filter(Boolean).length > 0 ? section('Fundamental Powers', d.fundamentals.filter(Boolean).map(f => `<div class="item">${f}</div>`).join('')) : ''}
${innate.length > 0 ? section('Innate Trees', innate.map(powerLine).join('')) : ''}
${learned.length > 0 ? section('Learned Trees', learned.map(powerLine).join('')) : ''}
${(d.specialAbilities || []).filter(Boolean).length > 0 ? section('Special Abilities', d.specialAbilities.filter(Boolean).map(s => `<div class="item">${s}</div>`).join('')) : ''}
${d.skills.some(s => s.name) ? section('Skills', d.skills.filter(s => s.name).map(s => { const info = SKILL_DATA[s.name]; const lvls = info?.levels || []; const detail = Array.from({ length: s.dots }, (_, i) => `${i + 1}: ${esc(lvls[i] || '')}`).join(' &bull; '); return `<div class="item"><span class="dots">${powerDotsStr(s.dots)}</span> ${esc(s.name)}${info ? ` <span class="src">[${info.cat}]</span>` : ''}${detail ? `<div class="power-detail">${detail}</div>` : ''}</div>`; }).join('')) : ''}
${d.merits.some(m => m.trim()) ? section('Merits', d.merits.filter(m => m.trim()).map(m => { const info = MERIT_DATA[m.trim()]; return `<div class="item">${esc(m)}${info ? `<div class="power-detail">${esc(info.desc)}</div>` : ''}</div>`; }).join('')) : ''}
${d.notes ? section('Notes', `<p class="notes-text">${d.notes}</p>`) : ''}
</body></html>`;

    const win = window.open('', '_blank', 'width=750,height=950');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (!unlocked) {
    const tryUnlock = () => { if (pwInput === ST_PASSWORD) { sessionStorage.setItem('stSessionUnlocked', 'true'); setUnlocked(true); } else setPwError(true); };
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 w-80 shadow-xl text-center">
          <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-1">NPC Creator</h2>
          <p className="text-gray-500 text-xs mb-5">Storyteller access required</p>
          <input type="password" autoFocus placeholder="ST Password" value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(false); }}
            onKeyDown={e => { if (e.key === 'Enter') tryUnlock(); if (e.key === 'Escape') onBack(); }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {pwError && <p className="text-red-400 text-xs mb-2">Incorrect password.</p>}
          <div className="flex gap-2">
            <button onClick={onBack} className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded">Cancel</button>
            <button onClick={tryUnlock} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded font-semibold">Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  const inp = "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";
  const lbl = "block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1";
  const sec = "bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3";

  const removeSkillRow = idx => setSkills(s => s.filter((_, i) => i !== idx));
  const removeMeritRow = idx => setMerits(m => m.filter((_, i) => i !== idx));

  const treeListId = `trees-${faction}-${subfaction}`;
  const treeSuggestions = SUBFACTION_TREES[subfaction] || FACTION_TREES[faction] || [];
  const isShifterMode = faction === 'shifter' || subfaction === 'Gifted Kinfolk';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">← Back</button>
        <Users className="w-5 h-5 text-purple-400" />
        <h1 className="text-lg font-bold text-purple-400 mr-auto">NPC Creator</h1>
        {activeTab === 'create' && (
          <>
            <button onClick={clearForm} className="text-xs bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-200 px-3 py-1.5 rounded border border-gray-600 hover:border-red-700">
              New NPC
            </button>
            <button onClick={saveToBank} className="text-xs bg-purple-800 hover:bg-purple-700 text-purple-200 px-3 py-1.5 rounded border border-purple-600">
              Save to Bank
            </button>
            <button onClick={printNPC} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded border border-gray-600">
              Print Sheet
            </button>
          </>
        )}
        <span className="text-xs text-gray-500">🔓 ST Mode</span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-700 bg-gray-850 px-4">
        {[['create','Create NPC'],['bank',`Saved NPCs${savedNPCs.length > 0 ? ` (${savedNPCs.length})` : ''}`]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === id ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Bank tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'bank' && (
        <div className="max-w-6xl mx-auto p-4">
          {bankLoading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : savedNPCs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-2">No saved NPCs yet.</p>
              <p className="text-sm">Build an NPC in the Create tab and click "Save to Bank".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedNPCs.map((entry) => {
                const d = entry.data || entry;
                const rf = FACTIONS[entry.faction || d.faction];
                return (
                  <div key={entry._id || entry.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{entry.name || d.name || 'Unnamed'}</div>
                        <div className="text-xs text-gray-400">{rf?.label || entry.faction || d.faction}</div>
                        {entry.createdAt && (
                          <div className="text-xs text-gray-600 mt-0.5">{new Date(entry.createdAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => loadNPC(entry)}
                        className="flex-1 text-xs bg-blue-700 hover:bg-blue-600 text-white py-1.5 rounded">
                        Load
                      </button>
                      <button
                        onClick={() => printBankedNPC(entry)}
                        className="flex-1 text-xs bg-gray-600 hover:bg-gray-500 text-white py-1.5 rounded">
                        Print
                      </button>
                      <button
                        onClick={() => deleteFromBank(entry)}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5">
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── LEFT: Form ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Identity */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Identity</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label className={lbl}>NPC Name</label>
                <input className={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Title / Role</label>
                <input className={inp} placeholder="e.g. Prince of the City, Local Contact" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Faction</label>
                <select className={inp} value={faction} onChange={e => setFaction(e.target.value)}>
                  {Object.entries(FACTIONS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {resolvedFaction?.subfactions && (
                <div>
                  <label className={lbl}>{resolvedFaction.subfactionLabel || 'Subfaction'}</label>
                  <select className={inp} value={subfaction} onChange={e => setSubfaction(e.target.value)}>
                    <option value="">— Select —</option>
                    {resolvedFaction.subfactions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {faction === 'wraith' && (
                <>
                  <div>
                    <label className={lbl}>Legion</label>
                    <select className={inp} value={legion} onChange={e => setLegion(e.target.value)}>
                      {WRAITH_LEGIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Guild</label>
                    <select className={inp} value={guild} onChange={e => setGuild(e.target.value)}>
                      {WRAITH_GUILDS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-purple-400" checked={isLegendary} onChange={e => setIsLegendary(e.target.checked)} />
                Legendary
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-red-500" checked={isPermatainted} onChange={e => setIsPermatainted(e.target.checked)} />
                Permatainted
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Stats</h2>
            <div className="grid grid-cols-2 gap-2">
              {faction !== 'zombie' && (
                <>
                  <div>
                    <label className={lbl}>Energy Type</label>
                    <input className={inp} value={energyType} onChange={e => setEnergyType(e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Energy {resolvedFaction && `(${resolvedFaction.energyMin}–${resolvedFaction.energyMax})`}</label>
                    <input type="number" className={inp} min={resolvedFaction?.energyMin ?? 0} max={resolvedFaction?.energyMax ?? 999} value={energy} onChange={e => setEnergy(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={lbl}>Health{autoHealth !== healthOverride && healthOverride !== null ? '' : ` (auto: ${autoHealth})`}</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" className={`${inp} flex-1`} min={1} value={health}
                        onChange={e => setHealthOverride(Number(e.target.value))} />
                      {healthOverride !== null && (
                        <button onClick={() => setHealthOverride(null)} className="text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap">reset</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>Willpower (1–10)</label>
                    <input type="number" className={inp} min={1} max={10} value={willpower} onChange={e => setWillpower(Number(e.target.value))} />
                  </div>
                </>
              )}
              {resolvedFaction?.virtue !== 'None' && (
                <>
                  <div>
                    <label className={lbl}>Virtue Type</label>
                    <input className={inp} value={virtue} onChange={e => setVirtue(e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>{virtue || 'Virtue'} Value (1–10)</label>
                    <input type="number" className={inp} min={1} max={10} value={virtueValue} onChange={e => setVirtueValue(Number(e.target.value))} />
                  </div>
                </>
              )}
              <div>
                <label className={lbl}>Regeneration Rate</label>
                <input type="number" className={inp} min={0} max={10} value={regenRate} onChange={e => setRegenRate(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Faction-specific extras */}
          {faction === 'vampire' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Vampire Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Generation</label>
                  <select className={inp} value={generation} onChange={e => setGeneration(Number(e.target.value))}>
                    {GENERATION_TABLE.map(g => <option key={g.gen} value={g.gen}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Amaranth Count</label>
                  <input type="number" className={inp} min={0} value={amaranth} onChange={e => setAmaranth(Number(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Road</label>
                  <input className={inp} placeholder="Road of Humanity" value={road} onChange={e => setRoad(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {faction === 'shifter' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Shifter Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Breed</label>
                  <select className={inp} value={breed} onChange={e => setBreed(e.target.value)}>
                    {SHIFTER_BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Auspice</label>
                  <select className={inp} value={auspice} onChange={e => setAuspice(e.target.value)}>
                    {SHIFTER_AUSPICES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Rank (1–5)</label>
                  <input type="number" className={inp} min={1} max={5} value={rank} onChange={e => setRank(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}
          {faction === 'wraith' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Wraith Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={lbl}>Passions (comma-separated)</label>
                  <input className={inp} placeholder="e.g. Protect family, Avenge death" value={passions} onChange={e => setPassions(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Shadow Archetype</label>
                  <input className={inp} placeholder="e.g. The Tyrant" value={shadowArchetype} onChange={e => setShadowArchetype(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Thorn</label>
                  <input className={inp} placeholder="e.g. Phantom Pain" value={thorn} onChange={e => setThorn(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {faction === 'fae' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Fae Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Lineage</label>
                  <input className={inp} placeholder="e.g. Sidhe, Pooka" value={lineage} onChange={e => setLineage(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Court</label>
                  <input className={inp} placeholder="e.g. Seelie, Unseelie" value={court} onChange={e => setCourt(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Echoes (comma-separated)</label>
                  <input className={inp} placeholder="e.g. Echo 1, Echo 2 (Prime)" value={echoes} onChange={e => setEchoes(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {faction === 'demon' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Demon Details</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={lbl}>True Name <span className="text-yellow-400">(⚠ keep secret)</span></label>
                  <input className={inp} placeholder="The demon's true name" value={trueName} onChange={e => setTrueName(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Celestial Name</label>
                  <input className={inp} value={celestialName} onChange={e => setCelestialName(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Appellation</label>
                  <input className={inp} placeholder="Common name/title" value={appellation} onChange={e => setAppellation(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Demonic Vice</label>
                  <input className={inp} placeholder="e.g. Wrath, Envy" value={demonicVice} onChange={e => setDemonicVice(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          {(faction === 'plasmic' || faction === 'spirit') && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">{resolvedFaction?.label} Details</h2>
              <div>
                <label className={lbl}>Type / Classification</label>
                <input className={inp} placeholder="e.g. War Spirit, Ancestor" value={extraField1} onChange={e => setExtraField1(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Additional Notes</label>
                <input className={inp} value={extraField2} onChange={e => setExtraField2(e.target.value)} />
              </div>
            </div>
          )}
          {faction === 'monster' && (
            <div className={sec}>
              <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Monster Details</h2>
              {subfaction && MONSTER_TYPES[subfaction] && (
                <div className="bg-gray-900 rounded border border-gray-700 p-2 text-xs space-y-0.5">
                  <div className="text-gray-300 font-semibold mb-1">{subfaction} reference ranges:</div>
                  {Object.entries(MONSTER_TYPES[subfaction]).filter(([k]) => k !== 'isLegendary').map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-gray-400">
                      <span className="w-28 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Health</label>
                  <input type="number" className={inp} min={1} value={monsterHealth} onChange={e => setMonsterHealth(Number(e.target.value))} />
                </div>
                <div>
                  <label className={lbl}>Augment (0–9)</label>
                  <input type="number" className={inp} min={0} max={9} value={monsterAugment} onChange={e => setMonsterAugment(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className={lbl}>Realm Affinity</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="radio" className="accent-purple-400" checked={isRealmbound} onChange={() => setIsRealmbound(true)} />
                    Realmbound (physical world)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input type="radio" className="accent-purple-400" checked={!isRealmbound} onChange={() => setIsRealmbound(false)} />
                    Umbrabound (spirit world)
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" className="accent-purple-400" checked={isHealthAsEnergy} onChange={e => setIsHealthAsEnergy(e.target.checked)} />
                  Spend Health as Energy
                </label>
              </div>
              <div>
                <label className={lbl}>Sense Faction Response</label>
                <input className={inp} placeholder='e.g. Monster (for "no effect" call)' value={senseFaction} onChange={e => setSenseFaction(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Scorch Types</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {scorchTypes.map((t, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-orange-900 text-orange-200 px-2 py-0.5 rounded">
                      {t}
                      <button onClick={() => setScorchTypes(prev => prev.filter((_, j) => j !== i))} className="text-orange-400 hover:text-orange-200 ml-0.5">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select className={`${inp} flex-1`} value={newScorchType} onChange={e => setNewScorchType(e.target.value)}>
                    {SCORCH_DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => { if (!scorchTypes.includes(newScorchType)) setScorchTypes(prev => [...prev, newScorchType]); }}
                    className="bg-orange-800 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm shrink-0">Add</button>
                </div>
              </div>
              <div>
                <label className={lbl}>Immunities</label>
                <div className="space-y-2">
                  {immunities.map((im, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={`${inp} flex-1`} placeholder="Immune to…" value={im.text}
                        onChange={e => setImmunities(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                      <input className={`${inp} flex-1`} placeholder="Unless…" value={im.condition}
                        onChange={e => setImmunities(prev => prev.map((x, j) => j === i ? { ...x, condition: e.target.value } : x))} />
                      {immunities.length > 1 && <button onClick={() => setImmunities(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setImmunities(prev => [...prev, { text: '', condition: '' }])}
                  className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1 mt-1">+ Add Immunity</button>
              </div>
              <div>
                <label className={lbl}>Weaknesses</label>
                <div className="space-y-2">
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={`${inp} flex-1`} placeholder="Weakness…" value={w.text}
                        onChange={e => setWeaknesses(prev => prev.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
                      <input className={`${inp} flex-1`} placeholder="When…" value={w.condition}
                        onChange={e => setWeaknesses(prev => prev.map((x, j) => j === i ? { ...x, condition: e.target.value } : x))} />
                      {weaknesses.length > 1 && <button onClick={() => setWeaknesses(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setWeaknesses(prev => [...prev, { text: '', condition: '' }])}
                  className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1 mt-1">+ Add Weakness</button>
              </div>
            </div>
          )}

          {/* Fundamental Powers */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Fundamental Powers</h2>
            <p className="text-xs text-gray-500">Auto-populated from faction. Add or remove as needed.</p>
            <div className="space-y-1">
              {fundamentals.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inp} flex-1`} value={f} onChange={e => setFundamentals(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                  <button onClick={() => setFundamentals(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setFundamentals(prev => [...prev, ''])}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1">
              + Add Fundamental
            </button>
          </div>

          {/* Power Trees */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Power Trees</h2>
            <p className="text-xs text-gray-500">
              {isShifterMode
                ? 'Each row is one individual gift. Pick tree + tier (dots indicate gift level, not cumulative tree rank).'
                : 'Pick tree + level. Innate = clan/tribe/etc., Learned = bought with XP.'}
            </p>
            <datalist id={treeListId}>
              {treeSuggestions.map(t => <option key={t} value={t} />)}
            </datalist>
            {powerTrees.length > 0 && (
              <div className="space-y-1.5">
                {powerTrees.map((pt, i) => (
                  <div key={pt.id} className="flex gap-2 items-center">
                    <input
                      list={treeListId}
                      className={`${inp} flex-1`}
                      placeholder="Tree name (e.g. Celerity)"
                      value={pt.tree}
                      onChange={e => setPowerTrees(prev => prev.map((x, j) => j === i ? { ...x, tree: e.target.value } : x))}
                    />
                    <select
                      value={pt.level}
                      onChange={e => setPowerTrees(prev => prev.map((x, j) => j === i ? { ...x, level: Number(e.target.value) } : x))}
                      className="bg-gray-700 text-white text-sm rounded px-2 py-2 border border-gray-600 shrink-0">
                      {[1,2,3].map(n => {
                        const giftName = pt.exact && POWER_TREE_LOOKUP[pt.tree]?.[n - 1];
                        const label = giftName ? `${n} – ${giftName.split(' / ')[0]}` : `${n}`;
                        return <option key={n} value={n}>{label}</option>;
                      })}
                    </select>
                    <select
                      value={pt.cat}
                      onChange={e => setPowerTrees(prev => prev.map((x, j) => j === i ? { ...x, cat: e.target.value } : x))}
                      className="bg-gray-700 text-white text-xs rounded px-1.5 py-2 border border-gray-600 shrink-0">
                      <option value="innate">Innate</option>
                      <option value="learned">Learned</option>
                    </select>
                    <button onClick={() => setPowerTrees(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setPowerTrees(prev => [...prev, { id: nextPowerId.current++, tree: '', level: 1, cat: 'innate', exact: isShifterMode }])}
              className="text-xs text-green-400 hover:text-green-300 border border-green-800 rounded px-2 py-1">
              {isShifterMode ? '+ Add Gift' : '+ Add Tree'}
            </button>
          </div>

          {/* Special Abilities */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Special Abilities</h2>
            <p className="text-xs text-gray-500">Anything beyond normal PC rules — magic items, Bestow Power, NPC-only effects, etc.</p>
            {specialAbilities.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className={`${inp} flex-1`}
                  placeholder="e.g. Magic Item: Sword of X, Bestow Power: Celerity"
                  value={s}
                  onChange={e => setSpecialAbilities(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                />
                <button onClick={() => setSpecialAbilities(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-sm">✕</button>
              </div>
            ))}
            <button
              onClick={() => setSpecialAbilities(prev => [...prev, ''])}
              className="text-xs text-amber-400 hover:text-amber-300 border border-amber-800 rounded px-2 py-1">
              + Add Special Ability
            </button>
          </div>

          {/* Skills */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Skills</h2>
            <datalist id="skill-list">
              {Object.keys(SKILL_DATA).map(s => <option key={s} value={s} />)}
            </datalist>
            <div className="space-y-2">
              {skills.map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <input list="skill-list" className={`${inp} flex-1`} placeholder="Skill name"
                      value={s.name} onChange={e => setSkills(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <select value={s.dots}
                      onChange={e => setSkills(prev => prev.map((x, j) => j === i ? { ...x, dots: Number(e.target.value) } : x))}
                      className="bg-gray-700 text-white text-sm rounded px-2 py-2 border border-gray-600 shrink-0">
                      {[1,2,3].map(d => <option key={d} value={d}>{['●','●●','●●●'][d-1]}</option>)}
                    </select>
                    {skills.length > 1 && <button onClick={() => removeSkillRow(i)} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                  </div>
                  {SKILL_DATA[s.name] && (
                    <p className="ml-1 text-xs text-gray-500 italic">{SKILL_DATA[s.name].desc}</p>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setSkills(prev => [...prev, { name: '', dots: 1 }])}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1">
              + Add Skill
            </button>
          </div>

          {/* Merits */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">Merits / Flaws</h2>
            <datalist id="merit-list">
              {Object.keys(MERIT_DATA).map(m => <option key={m} value={m} />)}
            </datalist>
            <div className="space-y-2">
              {merits.map((m, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex gap-2">
                    <input list="merit-list" className={`${inp} flex-1`} placeholder="Merit or flaw name"
                      value={m} onChange={e => setMerits(prev => prev.map((x, j) => j === i ? e.target.value : x))} />
                    {merits.length > 1 && <button onClick={() => removeMeritRow(i)} className="text-red-400 hover:text-red-300 text-sm">✕</button>}
                  </div>
                  {MERIT_DATA[m.trim()] && (
                    <p className="ml-1 text-xs text-gray-500 italic">{MERIT_DATA[m.trim()].desc}</p>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setMerits(prev => [...prev, ''])}
              className="text-xs text-purple-400 hover:text-purple-300 border border-purple-700 rounded px-2 py-1">
              + Add Merit / Flaw
            </button>
          </div>

          {/* Notes */}
          <div className={sec}>
            <h2 className="font-bold text-purple-300 text-sm uppercase tracking-wide">ST Notes</h2>
            <textarea className={`${inp} h-28 resize-none`}
              placeholder="Background, motivations, plot hooks, important IC knowledge, encounter notes…"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* ── RIGHT: NPC Card preview ──────────────────────────────────────── */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">NPC Card Preview</p>
          <NPCCard npc={npcData} resolvedFaction={resolvedFaction} />
          <p className="text-xs text-gray-600 mt-2 text-center">Use browser print (Ctrl+P) to print this card</p>
        </div>
      </div>
      )}
    </div>
  );
};

export default NPCCreator;
