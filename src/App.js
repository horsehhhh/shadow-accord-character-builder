import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Download, Upload, Save, Plus, ChevronRight, ChevronLeft, 
  Trash2, X, Search, Users, Book,
  CheckCircle, AlertCircle, Settings, 
  TrendingUp, Archive,
  Moon, Sun,
  Minus,
  Home
} from 'lucide-react';

// ==========================================
// SHADOW ACCORD CHARACTER BUILDER - PHASE 8
// ==========================================

const ShadowAccordComplete = () => {
  // ======================
  // CORE STATE MANAGEMENT
  // ======================
  const [characters, setCharacters] = useState([]);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState('menu');
  const [newCharacter, setNewCharacter] = useState(null);
  const [creationStep, setCreationStep] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Helper function to format text by replacing underscores with spaces
  const formatDisplayText = (text) => {
    if (!text) return text;
    return text.replace(/_/g, ' ');
  };
  
  // XP Tracking State
  const [xpAdjustment, setXpAdjustment] = useState({
    amount: 0,
    reason: '',
    type: 'gain' // 'gain' or 'loss'
  });
  
  // Common XP Activities State
  const [showXpDropdown, setShowXpDropdown] = useState(false);
  const [selectedXpActivities, setSelectedXpActivities] = useState([]);
  const [showCheckInDropdown, setShowCheckInDropdown] = useState(false);
  const [selectedCheckInActivities, setSelectedCheckInActivities] = useState([]);
  
  const commonXpActivities = [
    { name: 'Bathrooms', xp: 3 },
    { name: 'Set up', xp: 1 },
    { name: 'Load Truck', xp: 1 },
    { name: 'Unload Truck', xp: 1 },
    { name: 'Teardown', xp: 1 }
  ];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showXpDropdown && !event.target.closest('.xp-dropdown')) {
        setShowXpDropdown(false);
      }
      if (showCheckInDropdown && !event.target.closest('.checkin-dropdown')) {
        setShowCheckInDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showXpDropdown, showCheckInDropdown]);
  
  // Phase 8: Advanced State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaction, setFilterFaction] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [darkMode, setDarkMode] = useState(true);
  const [accessibility, setAccessibility] = useState({
    highContrast: false,
    largeText: false,
    keyboardNavigation: true
  });
  const [exportFormat, setExportFormat] = useState('json');
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);

  // ========================================
  // OFFICIAL CSV DATA FROM SHADOW ACCORD RULEBOOK
  // ========================================
  const gameDataCSV = {
    factions: `faction_id,faction_name,energy_type,base_health,base_willpower,base_energy,base_virtue,virtue_type,fundamental_powers
human,Human,Vitality,10,1,10,7,Humanity,
vampire,Vampire,Vitae,10,1,15,6,Road,Amaranth|Bestial Frenzy|Blood Buff|Draining|Paralyzing Bite|Regeneration 1|Test Faction|Test Vitae
shifter,Shifter,Gnosis,10,1,10,7,Rage,Bestial Frenzy|Bestial Healing|Regeneration 1|Step Sideways|War Form
wraith,Wraith,Pathos,10,1,10,4,Angst,Fetter Healing|Portal Walk|Regeneration 1|Sense Emotion|Temporary Angst|Umbra Sight`,

    subfactions: `subfaction_id,subfaction_name,faction_id,type,restrictions,dormancy_rules,innate_trees
ananasi,Ananasi,shifter,fera,,,ananasi_gift
assamite,Assamite,vampire,clan,,,celerity|obfuscate|quietus
baali,Baali,vampire,clan,,,daimoinon|obfuscate|presence
bagheera,Bagheera,shifter,fera,,,bagheera_gift
black_fury,Black Fury,shifter,tribe,,,black_fury_gift
black_spiral_dancer,Black Spiral Dancer,shifter,tribe,Wyrm aligned,,corruption|cunning|defiling|fear|madness_wyrm|strength
bone_gnawer,Bone Gnawer,shifter,tribe,,,bone_gnawer_gift
brujah,Brujah,vampire,clan,,,celerity|potence|presence
bubasti,Bubasti,shifter,fera,,,bubasti_gift
caitiff,Caitiff,vampire,clan,,,choice|choice|choice
cappadocian,Cappadocian,vampire,clan,,,auspex|fortitude|necromancy
ceilican,Ceilican,shifter,fera,,,ceilican_gift
child_of_gaia,Child of Gaia,shifter,tribe,,,child_of_gaia_gift
claimed_drone,Claimed (Drone),human,special,All other subfactions go dormant,,custom_selection
claimed_fomori,Claimed (Fomori),human,special,Can be active with another subfaction,,custom_selection
claimed_gorgon,Claimed (Gorgon),human,special,Can be active with another subfaction,,custom_selection
commoner,Commoner,human,base,,,custom_selection
corax,Corax,shifter,fera,,,corax_gift
faithful,Faithful,human,special,10 Humanity required,Less than 10 Humanity,custom_selection
fallen_fera,Fallen Fera,shifter,fera,Wyrm aligned,,corruption|cunning|defiling|fear|madness_wyrm|strength
fenrir,Fenrir,shifter,tribe,,,fenrir_gift
fianna,Fianna,shifter,tribe,,,fianna_gift
gangrel,Gangrel,vampire,clan,,,animalism|fortitude|protean
gargoyle,Gargoyle,vampire,clan,,,fortitude|potence|visceratika
ghoul,Ghoul,human,special,,Drone active,celerity|fortitude|potence
giovanni,Giovanni,vampire,clan,Cappadocian bloodline,,fortitude|necromancy|potence
kinfolk,Gifted Kinfolk,human,special,Kinfolk merit,Ghoul or Drone active,homid
lamia,Lamia,vampire,clan,Cappadocian bloodline - Female only,,fortitude|necromancy|potence
lasombra,Lasombra,vampire,clan,,,dominate|obtenebration|potence
malkavian,Malkavian,vampire,clan,,,auspex|dementation|obfuscate
nosferatu,Nosferatu,vampire,clan,,,animalism|obfuscate|potence
ratkin,Ratkin,shifter,fera,,,ratkin_gift
ravnos,Ravnos,vampire,clan,,,animalism|fortitude|chimerstry
red_talon,Red Talon,shifter,tribe,Lupus only,,red_talon_gift
salubri_healer,Salubri (Healer),vampire,clan,,,auspex|fortitude|valeren_healer
salubri_warrior,Salubri (Warrior),vampire,clan,,,auspex|fortitude|valeren_warrior
shadow_lord,Shadow Lord,shifter,tribe,,,shadow_lord_gift
silent_strider,Silent Strider,shifter,tribe,,,silent_strider_gift
silver_fang,Silver Fang,shifter,tribe,,,silver_fang_gift
sorcerer,Sorcerer,human,special,,Ghoul or Drone active,custom_selection
swara,Swara,shifter,fera,,,swara_gift
toreador,Toreador,vampire,clan,,,auspex|celerity|presence
tremere,Tremere,vampire,clan,,,auspex|dominate|thaumaturgy
tzimisce,Tzimisce,vampire,clan,,,animalism|auspex|vicissitude
ventrue,Ventrue,vampire,clan,,,dominate|fortitude|presence
iron_legion,Iron Legion,wraith,legion,,,custom_selection
skeletal_legion,Skeletal Legion,wraith,legion,,,custom_selection
grim_legion,Grim Legion,wraith,legion,,,custom_selection
penitent_legion,Penitent Legion,wraith,legion,,,custom_selection
emerald_legion,Emerald Legion,wraith,legion,,,custom_selection
silent_legion,Silent Legion,wraith,legion,,,custom_selection
legion_of_paupers,Legion of Paupers,wraith,legion,,,custom_selection
legion_of_fate,Legion of Fate,wraith,legion,,,custom_selection
renegades,Renegades,wraith,faction,,,custom_selection
heretics,Heretics,wraith,faction,,,custom_selection
no_guild,None,wraith,guild,,,custom_selection
artificers,Artificers,wraith,guild,,,custom_selection
masquers,Masquers,wraith,guild,,,custom_selection
pardoners,Pardoners,wraith,guild,,,custom_selection
usurers,Usurers,wraith,guild,,,custom_selection
chanteurs,Chanteurs,wraith,guild,,,custom_selection
harbingers,Harbingers,wraith,guild,,,custom_selection
oracles,Oracles,wraith,guild,,,custom_selection
sandmen,Sandmen,wraith,guild,,,custom_selection
haunters,Haunters,wraith,guild,,,custom_selection
monitors,Monitors,wraith,guild,,,custom_selection
spooks,Spooks,wraith,guild,,,custom_selection
proctors,Proctors,wraith,guild,,,custom_selection
puppeteers,Puppeteers,wraith,guild,,,custom_selection
alchemists,Alchemists,wraith,guild,,,custom_selection
mnemoi,Mnemoi,wraith,guild,,,custom_selection
solicitors,Solicitors,wraith,guild,,,custom_selection`,

    skills: `skill_id,skill_name,category,description,faction_restrictions
academics,Academics,OTHER,Literacy - read/write languages; Tutor - teach extra skill; Mentor - teach extra power,
alchemy,Alchemy,PRODUCTION,Bottle Essence; Energy Conversion; Alchemical Wisdom,sorcerer
archery,Archery,COMBAT,Bow/crossbow proficiency; Pinning Shot - Root power; Overdraw - Brutal Strike power,
armory,Armory,PRODUCTION,Weapon/armor crafting; Repair armor; Rapid Repair,
brawl,Brawl,COMBAT,Dual brawl boffers; Deflect with brawl boffers; Knockout - Daze power,
guidance,Guidance,OTHER,Fascination - Guidance+Passion; Inspiration - Guidance+Meditate; Foreboding - Guidance+Despair,
herbalism,Herbalism,PRODUCTION,Herbalism Points for potions/poisons; Medicinal Application; Mithridatism - Resist Poison,
holy_water,Holy Water,PRODUCTION,Holy Water production; Purify - Cleanse power; Sanctify - Sanctuary power,human
locksmith,Locksmith,PRODUCTION,Keysmith; Lock production; Lockpick,
medicine,Medicine,OTHER,Health Check - Medicine 2/Sense Health; First Aid - Medicine 4/Detect Dead/Dying/Incapacitated; Diagnosis - Medicine 6/Detect Condition,
melee,Melee,COMBAT,Martial weapon proficiency; Great Weapons - 2 damage; Flourish - Disarm power,
rituals,Rituals,OTHER,Ritual Casting and Identification; Scribe common rituals; Duplicate rituals,
shields,Shields,COMBAT,Shield proficiency; Glancing Blow - Withstand power; Deflection - Avoidance power,`,

    powerTrees: `tree_id,tree_name,faction,level1_powers,level2_powers,level3_powers
ahroun,Ahroun,shifter,Silver Claws,Might,Brutal Strike
ananasi_gift,Ananasi Gift,shifter,Cloak,Venom,Meld
animalism,Animalism,vampire,Beast Mind,Disquiet|Induce Frenzy,Frenzy Control
animal,Animal,human,Beast Mind,Disquiet|Induce Frenzy,Frenzy Control
argos,Argos,wraith,Cloak,Resilience,Hasty Escape
auspex,Auspex,vampire,Sense Amaranth|Sense Emotion|Sense Item|Sense Vitae,Telepathy,Cloak Sight
bagheera_gift,Bagheera Gift,shifter,Detect Taint,Fire Weapon,Daze
bastet_gift,Bastet Gift,shifter,Detect Taint|Razor Claws,Fire Weapon|Entrancement,Daze|Hasty Escape
bubasti_gift,Bubasti Gift,shifter,Forgetful Mind,Entrancement,Form of Vapor
ceilican_gift,Ceilican Gift,shifter,Hallucination|Withstand,Fire Weapon,Hasty Escape
swara_gift,Swara Gift,shifter,Razor Claws,Mask of a Thousand Faces,Gauntlet Walk
black_fury_gift,Black Fury Gift,shifter,Detect Taint,Body Wrack,Aggravated 1
body,Body,human,Withstand|Endure,Resilience,Resist Taint
bone_gnawer_gift,Bone Gnawer Gift,shifter,Forgetful Mind,Ranged 2 <Stone>,Resist Taint
bounty,Bounty,human,Blessing|Ward,Consecrate|Sanctuary,Miracle|Divine Wrath
castigate,Castigate,wraith,Detect Taint|Sense Angst|Sense Shadow,Disquiet|Shadow Coax,Sanctuary
celerity,Celerity,vampire,Disarm,Avoidance,Hasty Escape
child_of_gaia_gift,Child of Gaia Gift,shifter,Healing Touch,Serenity,Silver Armor
contaminate,Contaminate,wraith,Sense Fetter|Taint,Rend the Lifeweb,Induce Catharsis
corax_gift,Corax Gift,shifter,Insight,Fire 2,Hasty Escape
curse,Curse,human,Forgetful Mind,Body Wrack,Paralyze
daimoinon,Daimoinon,vampire,Sense Desire,Hellborn Investiture,Balefire
death,Death,human,<Tainted> Silence,Insight,<Tainted> Decay
dementation,Dementation,vampire,Confusion,Visions,Derange|Passion
demonology,Demonology,human,Sense Demon|Scion of Evil,Umbra Sight,Subjugate
dominate,Dominate,vampire,Forgetful Mind,Obedience,Conditioning
embody,Embody,wraith,Disembodied,Appear,Materialize
fatalism,Fatalism,wraith,Insight|Sense Pathos,Visions,Cloak Sight
fenrir_gift,Fenrir Gift,shifter,Razor Claws,Venom,Hero's Stand
fianna_gift,Fianna Gift,shifter,Fast Healing,Woadling,Form of Vapor
flux,Flux,wraith,Move Object|Sense Item,Shatter|Wither,Ranged 4 (Earth)
fortitude,Fortitude,vampire,Endure|Withstand,Resilience,Toughness
galliard,Galliard,shifter,Taunt,Dreamshape,Song of Rage
healer,Healer,human,Healing Touch,Serenity,Revive
hive_mind,Hive Mind,wraith,Detect Taint|Sense Angst|Sense Shadow,Telepathy,Subjugate
homid,Homid,shifter,Avert,Avoidance,Paralyze
inhabit,Inhabit,wraith,Sense Item|Withstand,Might,Dark Sword|Fabricate Armor
intimation,Intimation,wraith,Sense Desire,Induce Sin,Craving
keening,Keening,wraith,Passion,Ranged 2 (Sonic),Conditioning
larceny,Larceny,wraith,Fast Healing,Devour|Expel Corpus|Health Exchange|Paralyzing Touch,Toughness
lifeweb,Lifeweb,wraith,Fetter Creation|Sense Fetter,Detect Fetter|Fetter Consumption,Disable
lupus,Lupus,shifter,Snarl,Resilience,Frenzy Control
madness,Madness,human,<Tainted> Monsters,Derange,Horrid Reality
maleficence,Maleficence,wraith,Detect Taint|Scion of Evil,<Tainted> Silence,<Tainted> Horrid Reality
mind,Mind,human,Confusion,Telepathy,Obedience
mnemosynis,Mnemosynis,wraith,Forgetful Mind,Telepathy,Obedience
moliate,Moliate,wraith,Weaponry,Imitate,Resilience|Powerful Form
mortis,Mortis,vampire,Wither,Meld,Decay
natus,Natus,shifter,Wither,Telepathy,Passion|Terror
necromancy,Necromancy,vampire,Insight,Umbra Sight,Umbra Drain
obfuscate,Obfuscate,vampire,Cloak,Mask of a Thousand Faces,Cloak Gathering
obtenebration,Obtenebration,vampire,Root|Tentacles,Terror,Form of Vapor
outrage,Outrage,wraith,Stonehand Punch,Move Object|Realm Grasp,Aggravated 1
pandemonium,Pandemonium,wraith,Confusion,Monsters,Avoidance|Root
patterns,Patterns,human,Shatter,Fabricate Armor,Disable
perception,Perception,human,Sense Item|Sense Essence,Read Magic|Sense Spirit,Detect Taint|Sense Confidence|Sense Desire
phantasm,Phantasm,wraith,Cognizance,Dreamshape,Daze
philodox,Philodox,shifter,Sense Gnosis|Sense Item,Meditate,Toughness
potence,Potence,vampire,Shatter,Might,Brutal Strike
presence,Presence,vampire,Snarl,Entrancement,Majesty
protection,Protection,human,Avert,Cloak,Sanctuary
protean,Protean,vampire,Clawed Form: Wolf Mask|Razor Claws,Meld,Aggravated Claws
puppetry,Puppetry,wraith,Control Voice,Control Body,Possession
quietus,Quietus,vampire,Silence,Venom,Daze
ragabash,Ragabash,shifter,Confusion,Disembodied|Realm Grasp,Mimic
ratkin_gift,Ratkin Gift,shifter,Cloak,Monsters,Aggravated 1
red_talon_gift,Red Talon Gift,shifter,Shatter,Beast Mind|Root,Fire 4
ruin,Ruin,human,<Tainted> Wither,Ranged 2 <Dark>,Brittle Bones
shadow_lord_gift,Shadow Lord Gift,shifter,Disarm,Wounding Lies,Disable
shroud_rending,Shroud Rending,wraith,Umbra Drain|Umbra Sight,Health Exchange|Paralyzing Touch,Devour|Expel Corpus|Health Exchange
silent_strider_gift,Silent Strider Gift,shifter,Silence,Horrid Reality,Gauntlet Walk
silver_fang_gift,Silver Fang Gift,shifter,Detect Taint,True Form,Obedience
spirit,Spirit,human,Resist Gauntlet,Cleanse,Exorcism
thaumaturgy_creo_ignem,Thaumaturgy: Creo Ignem,vampire,Fire 2,<Fire> Weapon,Fire 4
thaumaturgy_rego_vitae,Thaumaturgy: Rego Vitae,vampire,Sense Vitae|Test Generation|Test Oath,Ranged 2 <Blood>,Aggravated 1
theurge,Theurge,shifter,Release Spirit|Sense Spirit,Umbra Sight,Umbra Strike
usury,Usury,wraith,Pathos Exchange|Paralyzing Touch,Devour|Expel Corpus|Health Exchange,Pathos Investment
valeren_healer,Valeren Healer,vampire,Healing Touch,Serenity,Revive
valeren_warrior,Valeren Warrior,vampire,Sense Max Health,Body Wrack,Aggravated 1
vicissitude,Vicissitude,vampire,Malleable Visage,Body Wrack,Horrid Form
visceratika,Visceratika,vampire,Cloak|Clawed Form,Avoidance,Powerful Form|Resilience
warrior,Warrior,human,Taunt,Might,Avoidance|Disarm
ahl_i_batin,Ahl-i-batin,human,Visions,Mask of a Thousand Faces,Hasty Escape
craftmason,Craftmason,human,Pence from Heaven,Meditate,Daze
messianic_voices,Messianic Voices,human,Sense Demon|Silence,Ranged 2 (Holy),Majesty
old_faith,Old Faith,human,Root,Wither,Entrancement|Passion
order_of_hermes,Order of Hermes,human,Fire 2,True Form|Daze,Disembodied
spirit_talkers,Spirit Talkers,human,Hallucination,Dreamshape,Umbra Sight
valdaermen,Valdaermen,human,Snarl,Clawed Form|Powerful Form,Toughness
veneficti,Veneficti,human,Sense Demon|Venom,Induce Sin,Silver Tongue
affinity,Affinity,human,Pence from Heaven,Taunt,Hypnotism
champion,Champion,human,Heal Self,Resilience,Avoidance|Disarm
discernment,Discernment,human,Detect Taint,Sense Amaranth|Sense Demon|Sense Rank,Cloak Sight
purity,Purity,human,Avert,Serenity,Cleanse
solace,Solace,human,Sense Angst|Sense Fetter|Sense Shadow,Detect Fetter|Fetter Consumption,Exorcism
spiritual,Spiritual,human,Sense Spirit|Resist Gauntlet,Umbra Sight,Umbra Strike
stasis,Stasis,human,Cloak Gathering,Fabricate Armor,Toughness
weaver,Weaver,human,Taint|True Form,Paralyze,Disable
onesong,Onesong,human,Forgetful Mind|Visions,Telepathy,Conditioning|Entrancement
enticer,Enticer,human,Tentacles,<Tainted> Entrancement,Paralyze
ferectori,Ferectori,human,<Tainted> Snarl,Terror,Gauntlet Walk
gorehound,Gorehound,human,Fast Healing,<Tainted> Body Wrack,Might
toad,Toad,human,Ranged 2 <Acid>,Taint|Venom,Form of Vapor
gorgon,Gorgon,human,Hallucination,Dreamshape,Gauntlet Walk|Umbra Sight
brash,Brash,human,Taunt,Disarm,Avoidance
brawny,Brawny,human,Shatter,Might,Brutal Strike
inquisitive,Inquisitive,human,Sense Emotion,Sense Mental,Sense Vitality
sturdy,Sturdy,human,Endure & Withstand,Resilience,Toughness
corruption,Corruption (Wyrm),shifter,Taint,Corrupted Powers,Subjugate
cunning,Cunning (Wyrm),shifter,Smell Fear,Cloak Gathering,Hidden Taint
defiling,Defiling (Wyrm),shifter,Detect Taint|Scion of Evil,Induce Sin,Tainted Induce Frenzy|Terror
fear,Fear (Wyrm),shifter,Sense Confidence,Horrid Reality,Disable
madness_wyrm,Madness (Wyrm),shifter,Tainted Confusion,Tainted Derange,Tainted Decay
strength,Strength (Wyrm),shifter,Hide of the Wyrm,Totemic Form|Resilience,Balefire`,

    merits: `merit_id,merit_name,merit_level,faction_restriction,can_purchase_multiple,description,special_notes
adept,Adept,1,,false,Additional production item per check-in (except Alchemy),
antiquarian,Antiquarian,1,,false,Attunement pool increased by 4 points,
averted_weakness,Averted Weakness,2,vampire,false,Do not suffer clan weakness,Gargoyles/Cappadocians/Nosferatu cannot take
delirium,Delirium,1,human,false,Enter delirium when witnessing supernatural,Always FREE for Commoners - does not cost XP or increase cost of future merits
doomslayer,Doomslayer,2,wraith,true,Use Dark Arcanoi without Catharsis,Can purchase multiple times
eidolon,Eidolon,1,wraith,false,Leave Catharsis after 5 minutes instead of 10,
enhanced_blood_buff,Enhanced Blood Buff,1,vampire,false,Spend 3 Energy for Augment 1 for 10 minutes,
escape_artist,Escape Artist,1,,false,Gain Escape power - slip free of restraints in 60 seconds,
font_of_sustenance,Font of Sustenance,1,ghoul,false,Your blood worth one additional Vitae per Health once per event,
hardy,Hardy,1,,false,Resist one status per day,
healthy,Healthy,1,,false,Maximum health increased by 2,
herd,Herd,1,vampire,true,Source of vitae outside town,Can purchase multiple times
hidden_amaranth,Hidden Amaranth,1,vampire,false,Always answer Sense Amaranth with Zero,
hypnotist,Hypnotist,1,,false,Gain Hypnotism power for truth-telling,
income,Income,1,,true,Gain 6 copper per check-in (or 1 Bit for wraiths),Can purchase multiple times
kinfolk,Kinfolk,1,non-shifter,false,Related to shifter tribe - select specific tribe,Does not increase cost of future merits
lost_soul,Lost Soul,2,shifter|vampire,false,Option to become wraith when you die,Cannot have with Mortwight
medium,Medium,1,non-wraith,false,Can hear the Umbra,
misplaced_heart,Misplaced Heart,1,vampire,false,Heart relocated to arm or leg - choose location,
mix_morph,Mix Morph,1,shifter,false,Use claws without mask but no war form augment,
moon_ties,Moon Ties,2,shifter,false,Complex auspice benefits and foibles based on lunar phase,
mortwight,Mortwight,2,human|shifter|vampire,false,Become Specter when you die,Cannot have with Lost Soul
nimble,Nimble,1,,false,Resist one damage attack per day,
oracle,Oracle,2,,false,Receive prophecy at check-in,Requires: Theurge/Dementation 1/Fatalism 1/Guidance 3
pale_aura,Pale Aura,1,,false,Answer Sense Faction as Human,
steel_trap,Steel Trap,1,,false,Aware when targeted by Forgetful Mind,
strong_will,Strong Will,1,,false,Mental powers last 5 minutes instead of 10,
tainted_soul,Tainted Soul,1,,false,Permanently tainted,
taste_of_oblivion,Taste of Oblivion,2,wraith,false,When drained while tainted causes catharsis in drainer,Only active while Tainted
umbral_affinity,Umbral Affinity,1,shifter,false,Step Sideways takes 30 seconds instead of 60,
unbondable,Unbondable,2,human,false,Requires three feedings for blood oath instead of two,Lost if no longer Human`,

    xpCosts: `item_type,base_cost,multiplier,notes
changing_road,1,0,1 XP to change vampire road
currency_copper,1,0,4 Copper costs 1 XP (may only be purchased with starting freebie points)
currency_silver,3,0,1 Silver costs 3 XP (may only be purchased with starting freebie points)
energy,3,0,3 XP per dot  
lore_common,3,0,Common Lore costs 3 XP
lore_faction,6,0,Faction Lore costs 6 XP
lore_rare,9,0,Rare Lore costs 9 XP
lore_uncommon,6,0,Uncommon Lore costs 6 XP
merit,3,1,3 XP + 3 per Merit Level (first merit FREE for humans)
power_innate_level_1,3,0,Level 1 Innate/Corrupt Powers cost 3 XP
power_innate_level_2,6,0,Level 2 Innate/Corrupt Powers cost 6 XP
power_innate_level_3,9,0,Level 3 Innate/Corrupt Powers cost 9 XP
power_learned_level_1,6,0,Level 1 Learned Powers cost 6 XP
power_learned_level_2,9,0,Level 2 Learned Powers cost 9 XP
power_learned_level_3,12,0,Level 3 Learned Powers cost 12 XP
skill_level_1,2,0,Level 1 Skills cost 2 XP
skill_level_2,4,0,Level 2 Skills cost 4 XP
skill_level_3,6,0,Level 3 Skills cost 6 XP
virtue,2,0,2 XP per dot
willpower,6,0,6 XP per dot`,

    lores: `lore_id,lore_name,category,cost_type,faction_restrictions,subfaction_restrictions,description
general_demon,Demon Lore,faction,lore_faction,,,"General knowledge about demons, their infernal hierarchies, and their influence on the mortal world"
general_fae,Fae Lore,faction,lore_faction,,,"General knowledge about the fae, changelings, the Dreaming, and the nature of glamour"
general_mage,Mage Lore,faction,lore_faction,,,"General knowledge about awakened magic, the Traditions, and the nature of reality"
general_shifter,Shifter Lore,faction,lore_faction,,,"General knowledge about shifter society, the Litany, tribal structures, and the war against the Wyrm"
general_spirit,Spirit Lore,faction,lore_faction,,,"General knowledge about spirits, the umbra, and the interaction between spiritual and physical realms"
general_vampire,Vampire Lore,faction,lore_faction,,,"General knowledge about vampire society, the Masquerade, basic clan structures, and kindred politics"
general_wraith,Wraith Lore,faction,lore_faction,,,"General knowledge about wraith society, the Shadowlands, Hierarchy, and the nature of death"
fomori_lore,Fomori Lore,common,lore_common,,"","Knowledge of humans possessed by Banes and corrupted by the Wyrm"
messianic_voices,Messianic Voices Lore,common,lore_common,,"","Knowledge of the faithful tradition and their divine calling"
old_faith,Old Faith Lore,common,lore_common,,"","Knowledge of the ancient pagan traditions and nature worship"
order_hermes,Order of Hermes Lore,common,lore_common,,"","Knowledge of the formal magical tradition and hermetic practices"
spirit_talkers,Spirit Talkers Lore,common,lore_common,,"","Knowledge of the shamanic tradition and spirit communication"
valdaermen,Valdaermen Lore,common,lore_common,,"","Knowledge of the Northern European mystical tradition"
tribe_black_fury,Black Fury Lore,common,lore_common,,"","Knowledge of the Black Fury tribe, their feminine rage, and Amazon heritage"
tribe_bone_gnawer,Bone Gnawer Lore,common,lore_common,,"","Knowledge of the Bone Gnawer tribe, their urban survival, and connection to the downtrodden"
tribe_child_of_gaia,Child of Gaia Lore,common,lore_common,,"","Knowledge of the Child of Gaia tribe, their peaceful nature, and healing practices"
tribe_fenrir,Fenrir Lore,common,lore_common,,"","Knowledge of the Fenrir tribe, their Norse heritage, and warrior culture"
tribe_fianna,Fianna Lore,common,lore_common,,"","Knowledge of the Fianna tribe, their Celtic heritage, and storytelling traditions"
tribe_shadow_lord,Shadow Lord Lore,common,lore_common,,"","Knowledge of the Shadow Lords tribe, their political machinations, and Eastern European heritage"
tribe_silver_fang,Silver Fang Lore,common,lore_common,,"","Knowledge of the Silver Fangs tribe, their royal heritage, and leadership struggles"
warder_of_man,Warder of Man Lore,common,lore_common,,"","Knowledge of the Glass Walker tribe, their urban adaptation, and technology use"
clan_brujah,Brujah Lore,common,lore_common,,"","Knowledge of Clan Brujah, their passion, idealism, and revolutionary nature"
clan_cappadocian,Cappadocian Lore,common,lore_common,,"","Knowledge of the extinct Clan Cappadocian, their death magic, and mysterious fate"
clan_gangrel,Gangrel Lore,common,lore_common,,"","Knowledge of Clan Gangrel, their animalistic nature, and independence"
clan_lasombra,Lasombra Lore,common,lore_common,,"","Knowledge of Clan Lasombra, their shadow manipulation, and Sabbat leadership"
clan_malkavian,Malkavian Lore,common,lore_common,,"","Knowledge of Clan Malkavian, their madness, and prophetic insights"
clan_nosferatu,Nosferatu Lore,common,lore_common,,"","Knowledge of Clan Nosferatu, their information networks, and hideous curse"
clan_ravnos,Ravnos Lore,common,lore_common,,"","Knowledge of Clan Ravnos, their illusions, and nomadic culture"
clan_toreador,Toreador Lore,common,lore_common,,"","Knowledge of Clan Toreador, their artistic passion, and aesthetic obsessions"
clan_tremere,Tremere Lore,common,lore_common,,"","Knowledge of Clan Tremere, their blood sorcery, and rigid hierarchy"
clan_ventrue,Ventrue Lore,common,lore_common,,"","Knowledge of Clan Ventrue, their leadership, and blue-blood traditions"
drones_lore,Drones Lore,uncommon,lore_uncommon,,"","Knowledge of the Technocracy's automated servants and surveillance systems"
gorgons_lore,Gorgons Lore,uncommon,lore_uncommon,,"","Knowledge of the ancient petrifying creatures and their modern manifestations"
craftmason_lore,Craftmason Lore,uncommon,lore_uncommon,,"","Knowledge of the builder tradition and their architectural mysticism"
veneficti_lore,Veneficti Lore,uncommon,lore_uncommon,,"","Knowledge of the poison masters and their deadly arts"
tribe_black_spiral_dancer,Black Spiral Dancer Lore,uncommon,lore_uncommon,,"","Knowledge of the corrupted tribe serving the Wyrm"
corax_lore,Corax Lore,uncommon,lore_uncommon,,"","Knowledge of the wereraven scouts and messengers"
ratkin_lore,Ratkin Lore,uncommon,lore_uncommon,,"","Knowledge of the wererats and their urban territories"
tribe_red_talon,Red Talon Lore,uncommon,lore_uncommon,,"","Knowledge of the Red Talon tribe, their hatred of humanity, and lupus heritage"
tribe_silent_strider,Silent Strider Lore,uncommon,lore_uncommon,,"","Knowledge of the Silent Striders tribe, their wandering nature, and Egyptian curse"
clan_assamite,Assamite Lore,uncommon,lore_uncommon,,"","Knowledge of Clan Assamite, their curse, and their role as judges and warriors"
clan_baali,Baali Lore,uncommon,lore_uncommon,,"","Knowledge of the demon-worshipping Baali and their infernal practices"
the_senate,The Senate Lore,uncommon,lore_uncommon,,"","Knowledge of the vampire political body and their governance structures"
lamia_lore,Lamia Lore,uncommon,lore_uncommon,,"","Knowledge of the serpentine bloodline and their ancient mysteries"
clan_tzimisce,Tzimisce Lore,uncommon,lore_uncommon,,"","Knowledge of Clan Tzimisce, their fleshcrafting, and territorial nature"
ahl_i_batin,Ahl-i-Batin Lore,rare,lore_rare,,"","Knowledge of the Middle Eastern mage tradition and their mystical practices"
ananasi_lore,Ananasi Lore,rare,lore_rare,,"","Knowledge of the werespider shapeshifters and their web of secrets"
bagheera_lore,Bagheera Lore,rare,lore_rare,,"","Knowledge of the Bagheera werepanther tribe and their nobility"
bubasti_lore,Bubasti Lore,rare,lore_rare,,"","Knowledge of the Bubasti werecat tribe and their Egyptian heritage"
celican_lore,Celican Lore,rare,lore_rare,,"","Knowledge of the Celican werecat tribe and their forest domains"
swara_lore,Swara Lore,rare,lore_rare,,"","Knowledge of the Swara werecat tribe and their Asian territories"
clan_giovanni,Giovanni Lore,rare,lore_rare,,"","Knowledge of Clan Giovanni, their necromancy, and merchant empire"
clan_salubri,Salubri Lore,rare,lore_rare,,"","Knowledge of the extinct Clan Salubri, their healing arts, and tragic fate"`,

    shadowArchetypes: `archetype_id,archetype_name,description,rp_examples,thorn_options
abuser,Abuser,This Shadow represents the battered inner child who has come full circle grown up out of their terrible beginnings to inflict more pain on others. When dominant this Shadow uses their power to abuse others or their Psyche.,Violently lashing out demanding servitude methodically inflicting pain and suffering,Brutal Strike|Hallucination
betrayer,Betrayer,This Shadow takes perverse pleasure in wrecking the Psyche's relationships with others. The Betrayer can be patient and may take years to spin a long scheme that destroys trust at the worst possible moment.,Sharing secrets with people who you know shouldn't have them attacking the Psyche's allies during a fight,Despair|Silver Tongue
delusional,Delusional,The Delusional Shadow will try to unmoor you from reality by making you question everything around you. Why are people talking to the air? Did no one hear that very loud noise? How do you know what to believe? Can you trust your senses or your instincts? If nothing can be trusted you're more likely to listen to what your Shadow tells you.,Questioning everything being stubborn about beliefs,Hallucination|Horrid Reality
director,Director,This Shadow plays the long game and attempts to manipulate people like pieces on a chessboard. A Director Shadow has a great plan which usually involves a descent into Oblivion while doing great harm to everyone the Psyche ever loved. While in Catharsis do whatever is necessary to further your Shadow's plans.,Threatening coercing blackmailing doing whatever you can to convince others to complete your goals making allies who will help your schemes being bossy,Smell Fear|Taunt
exhibitor,Exhibitor,The Exhibitor seeks to find out everyone's weaknesses deepest desires and darkest secrets and expose them all. The Shadow's goal is to embarrass and humiliate pushing the Psyche into doing things it ordinarily would not do creating situations where weaknesses are exposed or divulging what was supposed to be secret information. So what if everything wasn't exactly true? The show was worth it.,Publicly accusing another character for a taboo act writing a harmful rumor on a blackboard exposing secrets,Sense Confidence|True Form
impulsive,Impulsive,The Impulsive Shadow tells you that there is no need to think about the risks or possible consequences. Don't just think about doing something go do it. What could possibly go wrong?,Stealing trading for things even if you wouldn't normally saying the first thing that comes to mind during conversations,Decay|Mimic
inquisitor,Inquisitor,Everyone has something to hide and the Inquisitor aims to uncover it all by any means necessary. If trickery coercion and threats don't work then perhaps pain will do the trick. The Inquisitor is not afraid to make things public especially when someone is hesitant to admit to the things they are guilty of. Once this information is acquired the Shadow attempts to weaponize it to drive others toward Oblivion,Torturing characters to garner information and secrets from them orchestrating a witch-hunt to find out how your target reacts to such a thing,True Form|Wounding Lies
martyr,Martyr,The Martyr encourages the Psyche to give of itself. Not out of nobility though but because it is able to take pain better. And when it is done and over with the Martyr will point out how fruitless it all was. It slowly undermines the meaning of giving of oneself. When in control it tries to maneuver the Psyche into situations in which it will have to give something up no matter what,Never retreating from a fight offering to pay for things when you don't have the money taking on responsibilities that you can't fully bear,Hero's Stand|Mass Taunt
monster,Monster,The monster is a foul and unknowable thing. Of all the Shadows the Monster most favors direct destruction lashing out at everything around it. The Monster does not act mindlessly but its motivations are usually opaque. While in Catharsis this Shadow might try to physically harm as many people around it as possible or pick a singular victim and see how much anguish they can cause them,Aggressive reactions when unnecessary attacking people without much reason speaking bluntly about sensitive topics,Brittle Bones|Frenzy Control
paranoid,Paranoid,The Paranoid is the Psyche's only friend as everyone else is conspiring against the Wraith. Smiles and joyful greetings are merely facades to disguise their true feelings toward the Wraith. When in control the Paranoid tries to enact vengeance for previous insults real or not,Looking over your shoulder constantly avoiding staying in the same place for too long always assuming someone means you harm,Cloak Gathering|Meld
parent,Parent,Overprotective loving and caring this Shadow wants you to love only them and if you don't listen they'll make you feel guilty for not listening. They know your dirty thoughts and vile secrets but they still love you though no one else could ever love such a monster. When in power this Shadow openly seeks to protect other Wraiths and instill guilt for the things they've done. They will also attempt to destroy any and all relationships the Psyche has because no one can love them more than their Shadow,Teaching other characters things about your Psyche that they will have issues with pushing people through their trauma before they are ready,Cloak Gathering|Tainted Revive
pessimist,Pessimist,The Pessimist will continually bear bad news to the Psyche about any number of things real or imagined. While in control it does its best to dissuade the Wraith's companions from doing anything that might be beneficial to the Psyche. This Shadow's aim is to wear down the Psyche's resolve to resist the pull of Oblivion,Playing devil's advocate to the detriment to those around you dismissing hopeful outcomes as impossible foundering others' hopes and dreams,Horrid Reality|Paralyze
rationalist,Rationalist,This Shadow is the reasoning thinking person's Shadow. They calmly discuss your situation with you gently explaining why you should do what they want and offering totally logical reasons for doing so. They're not interested in openly lying to you. Instead they riddle your mind with doubts – doubts that only they can allay. When in power this Shadow creates conditions that prove their various postulates. They also advise other Wraiths trying to trick them into logical behavior that serves their descent to Oblivion,Explaining why a beneficial action would be harmful in the long term discussing how a harmful action would be helpful over time,Majesty|Sense Confidence
teacher,Teacher,The Teacher has seen it all done it all knows it all and is willing to teach you too. Make sure you're ready to learn because oftentimes anguish is the best instructor. Don't worry if the test feels impossible the Teacher knows exactly how this will end,Instructing other characters in a way that may not actually benefit them in the long term using unfortunate situations as punishing lessons without offering to assist in their resolution,Tainted Healing Touch|Terror
thinker,Thinker,This Shadow is intellectual and emotionless preferring to take time and think through all the possibilities before choosing to act. Snap decisions can ruin progress towards long-term goals so it's better to avoid missteps. Everything around you will certainly wait for your decision and freezing in a fast-paced situation never hurt anyone,Coming up with unnecessary contingencies and convincing others that they are necessary freezing during a moment of importance attempting to get others to consider the consequences of their actions prior to acting,Frenzy Control|Paralyze`
  };

  // ==================
  // DATA PARSING
  // ==================
  const gameData = useMemo(() => {
    const parseCSV = (csvString) => {
      const lines = csvString.trim().split('\n');
      const headers = lines[0].split(',');
      return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    };

    return {
      factions: parseCSV(gameDataCSV.factions),
      subfactions: parseCSV(gameDataCSV.subfactions),
      skills: parseCSV(gameDataCSV.skills),
      powerTrees: parseCSV(gameDataCSV.powerTrees),
      merits: parseCSV(gameDataCSV.merits),
      xpCosts: parseCSV(gameDataCSV.xpCosts),
      lores: parseCSV(gameDataCSV.lores),
      shadowArchetypes: parseCSV(gameDataCSV.shadowArchetypes)
    };
  }, [gameDataCSV.factions, gameDataCSV.subfactions, gameDataCSV.skills, gameDataCSV.powerTrees, gameDataCSV.merits, gameDataCSV.xpCosts, gameDataCSV.lores, gameDataCSV.shadowArchetypes]);

  // ========================
  // CHARACTER CREATION
  // ========================
  const createBlankCharacter = () => ({
    id: Date.now() + Math.random(),
    name: '',
    player: '',
    faction: '',
    subfaction: '',
    clan: '',
    breed: '',
    auspice: '',
    tribe: '',
    guild: '',
    fellowship: null, // For sorcerer fellowship selection
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    checkInCount: 0,
    stats: {
      health: 10,
      maxHealth: 10,
      willpower: 1,
      energy: 10,
      maxEnergy: 10,
      virtue: 7,
      virtueType: 'Humanity',
      energyType: 'Vitality'
    },
    skills: {},
    powers: {},
    merits: {},
    lores: [],
    notes: '',
    advancementHistory: [],
    xpHistory: [], // Track all XP changes with notes
    totalXP: 27,
    xpSpent: 0,
    freebieXP: 27,
    generation: 10,
    innateTreeIds: [],
    fundamentalPowers: [],
    shadowArchetype: '', // For wraith shadow archetype selection
    thornOptions: [], // Available thorn options from shadow archetype
    selectedThorn: '', // Selected thorn option
    firstMeritFree: false,
    validationErrors: [],
    buildPlans: [],
    teachingsReceived: [],
    teachingsGiven: [],
    selfNerfs: []
  });

  // Handle faction selection with official base stats
  const handleFactionChange = (character, factionId) => {
    const faction = gameData.factions.find(f => f.faction_id === factionId);
    if (!faction) return character;

    const updatedCharacter = {
      ...character,
      faction: factionId,
      subfaction: '',
      stats: {
        health: parseInt(faction.base_health),
        maxHealth: parseInt(faction.base_health),
        willpower: parseInt(faction.base_willpower),
        energy: parseInt(faction.base_energy),
        maxEnergy: parseInt(faction.base_energy),
        virtue: parseInt(faction.base_virtue),
        virtueType: faction.virtue_type,
        energyType: faction.energy_type
      },
      fundamentalPowers: faction.fundamental_powers ? faction.fundamental_powers.split('|') : [],
      firstMeritFree: factionId === 'human'
    };

    // Special handling for Wraith and Vampire factions - clear innate trees for custom selection
    if (factionId === 'wraith' || factionId === 'vampire') {
      updatedCharacter.innateTreeIds = [];
    }

    return updatedCharacter;
  };    // Handle subfaction selection with innate trees
  const handleSubfactionChange = (character, subfactionId) => {
    const subfaction = gameData.subfactions.find(sf => sf.subfaction_id === subfactionId);
    if (!subfaction) return character;

    let innateTreeIds = character.innateTreeIds || []; // Preserve existing trees by default
    let freeFirstDotPowers = [];
    let fundamentalPowers = character.fundamentalPowers || []; // Preserve existing fundamental powers
    
    // For Wraiths, Caitiff, and Sorcerers, preserve their manually selected innate trees
    if (character.faction === 'wraith' || 
        (character.faction === 'vampire' && subfactionId === 'caitiff') ||
        (character.faction === 'human' && subfactionId === 'sorcerer')) {
      // Keep existing innate trees, don't override with subfaction trees
      innateTreeIds = character.innateTreeIds || [];
    } else if (subfactionId === 'kinfolk') {
      // Special handling for Gifted Kinfolk: always get homid, can choose one tribal tree
      innateTreeIds = ['homid']; // Always include homid
      // Preserve any previously selected tribal tree
      const existingTribalTree = character.innateTreeIds?.find(treeId => 
        treeId !== 'homid' && gameData.powerTrees.find(tree => tree.tree_id === treeId && tree.faction === 'shifter')
      );
      if (existingTribalTree) {
        innateTreeIds.push(existingTribalTree);
      }
    } else if (subfactionId === 'claimed_drone') {
      // Special handling for Claimed Drone: get all three Weaver trees as innates plus Regeneration 3
      innateTreeIds = ['stasis', 'weaver', 'onesong'];
      // Add Regeneration 3 as fundamental power if not already present
      const baseFundamentalPowers = character.fundamentalPowers || [];
      const hasRegeneration = baseFundamentalPowers.some(power => power.startsWith('Regeneration'));
      if (!hasRegeneration) {
        fundamentalPowers = [...baseFundamentalPowers, 'Regeneration 3'];
      } else {
        fundamentalPowers = baseFundamentalPowers;
      }
    } else if (subfactionId === 'claimed_gorgon') {
      // Special handling for Claimed Gorgon: Add Frail as fundamental power
      const baseFundamentalPowers = character.fundamentalPowers || [];
      const hasFrail = baseFundamentalPowers.some(power => power.toLowerCase().includes('frail'));
      if (!hasFrail) {
        fundamentalPowers = [...baseFundamentalPowers, 'Frail'];
      } else {
        fundamentalPowers = baseFundamentalPowers;
      }
    } else if (subfactionId === 'black_spiral_dancer' || subfactionId === 'fallen_fera') {
      // Special handling for Wyrm-corrupted shifters: clear innate trees for fresh selection
      innateTreeIds = [];
    } else if (subfaction.innate_trees && subfaction.innate_trees !== 'custom_selection') {
      // For non-Wraiths, use subfaction trees as before (except custom selection cases)
      innateTreeIds = subfaction.innate_trees.split('|').filter(tree => tree !== 'choice_tribal_gift');
      // For ghouls, only the first dot of potence is free
      if (subfactionId === 'ghoul') {
        freeFirstDotPowers = ['potence'];
      }
    } else {
      // No subfaction trees or custom selection, keep existing or set to empty
      innateTreeIds = [];
    }
    
    return {
      ...character,
      subfaction: subfactionId,
      innateTreeIds,
      freeFirstDotPowers,
      fundamentalPowers
    };
  };

  // Handle tribal gift selection for Gifted Kinfolk
  const handleKinfolkTribalSelection = (character, tribalTreeId) => {
    let innateTreeIds = ['homid']; // Always include homid
    if (tribalTreeId) {
      innateTreeIds.push(tribalTreeId);
    }
    
    return {
      ...character,
      innateTreeIds
    };
  };

  // Handle shifter breed selection
  const handleBreedSelection = (character, breedId) => {
    const updatedCharacter = { ...character, breed: breedId };
    
    // Update innate trees based on breed, auspice, and tribe
    updateShifterInnateTreeIds(updatedCharacter);
    
    return updatedCharacter;
  };

  // Handle shifter auspice selection
  const handleAuspiceSelection = (character, auspiceId) => {
    const updatedCharacter = { ...character, auspice: auspiceId };
    
    // Update innate trees based on breed, auspice, and tribe
    updateShifterInnateTreeIds(updatedCharacter);
    
    return updatedCharacter;
  };

  // Update shifter innate tree IDs based on breed, auspice, and tribal selection
  const updateShifterInnateTreeIds = (character) => {
    const innateTreeIds = [];
    
    // Add breed tree if selected
    if (character.breed) {
      innateTreeIds.push(character.breed);
    }
    
    // Add auspice tree if selected
    if (character.auspice) {
      innateTreeIds.push(character.auspice);
    }
    
    // Add tribal gift if subfaction is selected
    if (character.subfaction) {
      const subfaction = gameData.subfactions.find(sf => sf.subfaction_id === character.subfaction);
      if (subfaction && subfaction.innate_trees) {
        const tribalGift = subfaction.innate_trees.split('|')[0]; // Should be the tribal gift
        if (tribalGift && !innateTreeIds.includes(tribalGift)) {
          innateTreeIds.push(tribalGift);
        }
      }
    }
    
    character.innateTreeIds = innateTreeIds;
  };

  // Check if breed is available for the selected tribe
  const isBreedAvailableForTribe = (subfactionId, breedId) => {
    const subfaction = gameData.subfactions.find(sf => sf.subfaction_id === subfactionId);
    if (!subfaction || !subfaction.restrictions) return true;
    
    // Red Talons can only be Lupus
    if (subfactionId === 'red_talon' && breedId !== 'lupus') {
      return false;
    }
    
    return true;
  };

  // =========================
  // XP COST CALCULATIONS
  // =========================
  const calculateXPCost = useCallback((character, type, itemId, level = 1) => {
    // Merit cost calculation with progressive costs and first merit free for humans
    if (type === 'merit') {
      // Delirium is always free for Commoners
      if (itemId === 'delirium' && character.subfaction === 'commoner') {
        return 0;
      }
      
      // Count total merit instances (stackable merits count as multiple instances)
      const currentMeritCount = Object.entries(character.merits || {}).reduce((total, [meritId, quantity]) => {
        const meritData = gameData.merits.find(m => m.merit_id === meritId);
        if (meritData && meritData.can_purchase_multiple === 'true') {
          return total + quantity; // Stackable merits count as their quantity
        } else {
          return total + 1; // Non-stackable merits count as 1
        }
      }, 0);
      
      const merit = gameData.merits.find(m => m.merit_id === itemId);
      if (!merit) return 0;
      
      // For humans, first merit is free
      if (character.faction === 'human' && currentMeritCount === 0) {
        return 0;
      }
      
      // Otherwise cost is 3 XP times the number of merit instances you already have (1st = 3, 2nd = 6, etc.)
      return 3 * (currentMeritCount + 1); // 3, 6, 9, 12, etc.
    }

    // Skill cost calculation
    if (type === 'skill') {
      const costData = gameData.xpCosts.find(x => x.item_type === `skill_level_${level}`);
      return costData ? parseInt(costData.base_cost) : 0;
    }

    // Power cost calculation (innate vs learned)
    if (type === 'power') {
      // Check if this is a power that gets first dot free (like potence for ghouls)
      if (level === 1 && character.freeFirstDotPowers?.includes(itemId)) {
        return 0;
      }
      
      // Determine if power should be treated as innate
      let isInnate = character.innateTreeIds.includes(itemId);
      
      // For Claimed Fomori: all Fomori trees use innate pricing (corrupt trees)
      if (character.faction === 'human' && character.subfaction === 'claimed_fomori' && 
          ['enticer', 'ferectori', 'gorehound', 'toad'].includes(itemId)) {
        isInnate = true; // All Fomori trees use innate pricing for Claimed Fomori
      }
      
      // For Shifters: all Wyrm gifts use innate pricing (corrupt trees)
      if (character.faction === 'shifter' && 
          ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'].includes(itemId)) {
        isInnate = true; // All Wyrm gifts use innate pricing for shifters
      }
      
      // For Sorcerers: fellowship powers are treated as learned powers, not innate
      if (character.faction === 'human' && character.subfaction === 'sorcerer' && 
          character.fellowship === itemId) {
        isInnate = false; // Fellowship powers always use learned pricing
      }
      
      // For Gifted Kinfolk: only their actual innate trees get innate pricing
      // Other shifter powers they can learn use learned pricing (6/9/12 XP)
      // This ensures only their chosen innate trees are cheap, not all shifter powers
      
      const powerType = isInnate ? 'power_innate' : 'power_learned';
      const costData = gameData.xpCosts.find(x => x.item_type === `${powerType}_level_${level}`);
      return costData ? parseInt(costData.base_cost) : 0;
    }

    // Lore cost calculation
    if (type === 'lore') {
      const lore = gameData.lores.find(l => l.lore_id === itemId);
      if (!lore) return 0;
      
      const costData = gameData.xpCosts.find(x => x.item_type === lore.cost_type);
      return costData ? parseInt(costData.base_cost) : 0;
    }

    // Stat costs
    const costData = gameData.xpCosts.find(x => x.item_type === type);
    return costData ? parseInt(costData.base_cost) : 0;
  }, [gameData.merits, gameData.xpCosts, gameData.lores]);

  // Check for redundant powers (free advancement)
  const isRedundantPower = (character, treeId, level) => {
    const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
    if (!tree) return false;

    const powersAtLevel = tree[`level${level}_powers`]?.split('|') || [];
    
    // Check if character already has all powers at this level from other trees
    return powersAtLevel.every(power => {
      // Search all other power trees the character has
      return Object.entries(character.powers).some(([otherTreeId, levels]) => {
        if (otherTreeId === treeId) return false;
        const otherTree = gameData.powerTrees.find(t => t.tree_id === otherTreeId);
        if (!otherTree) return false;
        
        // Check each level of the other tree
        return [1, 2, 3].some(checkLevel => {
          if (!levels[checkLevel]) return false;
          const otherPowers = otherTree[`level${checkLevel}_powers`]?.split('|') || [];
          return otherPowers.includes(power);
        });
      });
    });
  };

  // ==============================
  // ADVANCEMENT SYSTEM
  // ==============================
  const canAdvanceAtCheckIn = (character, type, itemId) => {
    // No advancement limitations - players can advance as much as they want per check-in
    return true;
  };

  // Function to check if a reduction is valid
  const canReduce = (character, type, itemId, level) => {
    switch (type) {
      case 'skill':
        const currentSkillLevel = character.skills[itemId] || 0;
        return currentSkillLevel > 0;
      case 'power':
        return character.powers[itemId] && character.powers[itemId][level];
      case 'merit':
        return character.merits[itemId];
      case 'energy':
        return character.stats.energy > 1; // Can't reduce below 1
      case 'willpower':
        return character.stats.willpower > 1; // Can't reduce below 1
      case 'virtue':
        return character.stats.virtue > 1; // Can't reduce below 1
      case 'lore':
        return character.lores?.some(lore => lore.lore_id === itemId);
      default:
        return false;
    }
  };

  // Function to calculate XP refund for reductions
  const calculateReductionRefund = useCallback((character, type, itemId, level) => {
    switch (type) {
      case 'skill':
        const currentSkillLevel = character.skills[itemId] || 0;
        // Refund the cost of the current level
        return calculateXPCost(character, 'skill', itemId, currentSkillLevel);
      case 'power':
        // Refund the cost of this specific power level
        return calculateXPCost(character, 'power', itemId, level);
      case 'merit':
        // For merits, calculate refund based on the cost when it was purchased
        const merit = gameData.merits.find(m => m.merit_id === itemId);
        if (merit && merit.can_purchase_multiple === 'true') {
          // For stackable merits, calculate refund for the most recently purchased instance
          const currentCount = character.merits[itemId] || 0;
          if (character.faction === 'human' && currentCount === 1) {
            // If this was the first merit and they're human, it was free
            return 0;
          }
          return 3 * currentCount; // Current cost to purchase this instance
        } else {
          // For non-stackable merits
          const totalMerits = Object.keys(character.merits).length;
          if (character.faction === 'human' && totalMerits === 1) {
            // If this is the only merit and they're human, it was free
            return 0;
          }
          return 3; // Standard merit cost
        }
      case 'energy':
        return 3; // Standard energy cost
      case 'willpower':
        return 6; // Standard willpower cost
      case 'virtue':
        return 2; // Standard virtue cost
      case 'lore':
        return calculateXPCost(character, 'lore', itemId);
      default:
        return 0;
    }
  }, [gameData.merits, calculateXPCost]);

  // Count powers at a specific level across all trees
  const countPowersAtLevel = (powers, level) => {
    return Object.values(powers).reduce((count, treeLevels) => {
      return count + (treeLevels[level] ? 1 : 0);
    }, 0);
  };

  // Check if Shifter power selection follows level ratio constraints
  const isValidShifterPowerSelection = (powers) => {
    const level1Count = countPowersAtLevel(powers, 1);
    const level2Count = countPowersAtLevel(powers, 2);
    const level3Count = countPowersAtLevel(powers, 3);
    
    // Level 3 count must not exceed Level 2 count
    // Level 2 count must not exceed Level 1 count
    return level3Count <= level2Count && level2Count <= level1Count;
  };

  // Check if adding a specific power would maintain valid ratios
  const canAddShifterPower = (powers, level) => {
    // Create a test power object to check the ratio
    const testPowers = JSON.parse(JSON.stringify(powers));
    const testTreeId = 'test_tree';
    if (!testPowers[testTreeId]) testPowers[testTreeId] = {};
    testPowers[testTreeId][level] = true;
    
    return isValidShifterPowerSelection(testPowers);
  };

  // Get current power level distribution for display
  const getPowerLevelDistribution = (powers) => {
    return {
      level1: countPowersAtLevel(powers, 1),
      level2: countPowersAtLevel(powers, 2),
      level3: countPowersAtLevel(powers, 3)
    };
  };

  // Check if power can be learned (FIXED for shifters, ghouls, and gifted kinfolk)
  const canLearnPower = (character, treeId, level) => {
    const currentLevels = character.powers[treeId] || {};
    
    // During character creation, ghouls can only learn the first dot of potence
    if (character.subfaction === 'ghoul' && character.checkInCount === 0) {
      // Can only get the first dot of potence at creation
      if (treeId === 'potence') {
        return level === 1 && !currentLevels[1];
      }
      // Cannot get any other discipline dots at creation
      return false;
    }
    
    // Shifters use new flexible system during character creation
    if (character.faction === 'shifter' && character.checkInCount === 0) {
      // For character creation, use the new flexible system
      return true; // Will be handled by the new UI component
    }
    
    // Shifters and Gifted Kinfolk can learn any level as long as they don't already have it
    if (character.faction === 'shifter' || (character.faction === 'human' && character.subfaction === 'kinfolk')) {
      return level <= 3 && !currentLevels[level];
    }
    
    // Others must learn sequentially
    const currentLevel = Math.max(...Object.keys(currentLevels).map(l => parseInt(l)), 0);
    return level === currentLevel + 1;
  };



  // Get available merits for faction
  const getAvailableMerits = (character, isAdvancement = false) => {
    // Only humans can select merits during character creation
    // All factions can select merits during advancement
    if (!isAdvancement && character.checkInCount === 0 && character.faction !== 'human') {
      return [];
    }

    return gameData.merits.filter(merit => {
      // If no restrictions, merit is available to all
      if (!merit.faction_restriction) return true;
      
      const restrictions = merit.faction_restriction.split('|');
      
      // Check faction and subfaction matches
      return restrictions.includes(character.faction) || 
             (character.subfaction && restrictions.includes(character.subfaction));
    });
  };

  // Function to get available lore for a character
  const getAvailableLores = (character, isAdvancement = false) => {
    // Return all lore items - no faction restrictions
    return gameData.lores || [];
  };

  // ============================
  // CHARACTER MANAGEMENT
  // ============================
  const deleteCharacter = useCallback((characterId) => {
    if (window.confirm('Are you sure you want to delete this character? This cannot be undone.')) {
      setCharacters(prev => prev.filter(c => c.id !== characterId));
      if (characters[currentCharacterIndex]?.id === characterId) {
        setCurrentCharacterIndex(0);
        setCurrentMode('menu');
      }
    }
  }, [characters, currentCharacterIndex]);

  const advanceCharacter = useCallback((character, advancement) => {
    const { type, itemId, level, cost } = advancement;
    
    // Check if can advance
    if (!canAdvanceAtCheckIn(character, type, itemId)) {
      alert('Cannot advance this stat: One dot per check-in limit reached');
      return character;
    }

    if (character.totalXP < cost) {
      alert('Insufficient XP');
      return character;
    }

    const updatedCharacter = { ...character };
    updatedCharacter.totalXP -= cost;
    updatedCharacter.xpSpent += cost;
    updatedCharacter.lastModified = new Date().toISOString();

    // Record advancement
    updatedCharacter.advancementHistory.push({
      checkIn: character.checkInCount,
      type,
      itemId,
      level,
      cost,
      timestamp: new Date().toISOString(),
      redundant: cost === 0
    });

    // Record XP spending in XP history (if cost > 0)
    if (cost > 0) {
      const xpEntry = {
        timestamp: new Date().toISOString(),
        type: 'loss',
        amount: cost,
        reason: `Purchased ${type === 'merit' ? gameData.merits.find(m => m.merit_id === itemId)?.merit_name || itemId : itemId}`,
        previousTotal: character.totalXP,
        newTotal: character.totalXP - cost
      };
      
      updatedCharacter.xpHistory = [...(updatedCharacter.xpHistory || []), xpEntry];
    }

    // Apply advancement
    switch (type) {
      case 'skill':
        updatedCharacter.skills[itemId] = level;
        break;
      case 'power':
        if (!updatedCharacter.powers[itemId]) {
          updatedCharacter.powers[itemId] = {};
        }
        updatedCharacter.powers[itemId][level] = true;
        break;
      case 'merit':
        // Handle stackable merits (track quantity)
        const merit = gameData.merits.find(m => m.merit_id === itemId);
        if (merit && merit.can_purchase_multiple === 'true') {
          // For stackable merits, increment the quantity
          updatedCharacter.merits[itemId] = (updatedCharacter.merits[itemId] || 0) + 1;
        } else {
          // For non-stackable merits, just mark as owned
          updatedCharacter.merits[itemId] = true;
        }
        break;
      case 'energy':
        updatedCharacter.stats.energy += 1;
        updatedCharacter.stats.maxEnergy += 1;
        break;
      case 'willpower':
        updatedCharacter.stats.willpower += 1;
        break;
      case 'virtue':
        updatedCharacter.stats.virtue += 1;
        break;
      case 'lore':
        if (!updatedCharacter.lores) {
          updatedCharacter.lores = [];
        }
        updatedCharacter.lores.push({ lore_id: itemId });
        break;
      default:
        console.warn(`Unknown advancement type: ${type}`);
        break;
    }

    return updatedCharacter;
  }, [gameData]);

  // Function to reduce/remove character attributes with XP refund
  const reduceCharacter = useCallback((character, reduction) => {
    const { type, itemId, level } = reduction;

    // Validate the reduction is possible
    if (!canReduce(character, type, itemId, level)) {
      alert('Cannot reduce this attribute.');
      return character;
    }

    // Calculate refund amount
    const refund = calculateReductionRefund(character, type, itemId, level);
    
    const updatedCharacter = { ...character };
    updatedCharacter.totalXP += refund;
    updatedCharacter.xpSpent -= refund;
    updatedCharacter.lastModified = new Date().toISOString();

    // Record XP refund in XP history (if refund > 0)
    if (refund > 0) {
      const xpEntry = {
        timestamp: new Date().toISOString(),
        type: 'gain',
        amount: refund,
        reason: `Removed ${type === 'merit' ? gameData.merits.find(m => m.merit_id === itemId)?.merit_name || itemId : itemId}`,
        previousTotal: character.totalXP,
        newTotal: character.totalXP + refund
      };
      
      updatedCharacter.xpHistory = [...(updatedCharacter.xpHistory || []), xpEntry];
    }

    // Apply reduction
    switch (type) {
      case 'skill':
        if (level === 0) {
          delete updatedCharacter.skills[itemId];
        } else {
          updatedCharacter.skills[itemId] = level;
        }
        break;
      case 'power':
        delete updatedCharacter.powers[itemId][level];
        if (Object.keys(updatedCharacter.powers[itemId]).length === 0) {
          delete updatedCharacter.powers[itemId];
        }
        break;
      case 'merit':
        const merit = gameData.merits.find(m => m.merit_id === itemId);
        if (merit && merit.can_purchase_multiple === 'true') {
          if (updatedCharacter.merits[itemId] > 1) {
            updatedCharacter.merits[itemId] -= 1;
          } else {
            delete updatedCharacter.merits[itemId];
          }
        } else {
          delete updatedCharacter.merits[itemId];
        }
        break;
      case 'energy':
        if (updatedCharacter.stats.energy > 1) {
          updatedCharacter.stats.energy -= 1;
          updatedCharacter.stats.maxEnergy -= 1;
        }
        break;
      case 'willpower':
        if (updatedCharacter.stats.willpower > 1) {
          updatedCharacter.stats.willpower -= 1;
        }
        break;
      case 'virtue':
        if (updatedCharacter.stats.virtue > 1) {
          updatedCharacter.stats.virtue -= 1;
        }
        break;
      case 'lore':
        if (updatedCharacter.lores) {
          updatedCharacter.lores = updatedCharacter.lores.filter(lore => lore.lore_id !== itemId);
        }
        break;
      default:
        console.warn(`Unknown reduction type: ${type}`);
        break;
    }

    return updatedCharacter;
  }, [gameData, calculateReductionRefund]);

  // ==========================
  // IMPORT/EXPORT SYSTEM
  // ==========================
  const exportCharacter = useCallback((character, format = 'json') => {
    const exportData = {
      character,
      exported: new Date().toISOString(),
      version: 'Phase 8',
      format: format
    };

    let content, filename, mimeType;

    switch (format) {
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        filename = `${character.name || 'character'}_shadowaccord.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvHeaders = ['Name', 'Player', 'Faction', 'Subfaction', 'Total XP', 'XP Spent'];
        const csvRow = [
          character.name, character.player, character.faction, 
          character.subfaction, character.totalXP, character.xpSpent
        ];
        content = csvHeaders.join(',') + '\n' + csvRow.join(',');
        filename = `${character.name || 'character'}_shadowaccord.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        content = generateCharacterSheet(character);
        filename = `${character.name || 'character'}_sheet.txt`;
        mimeType = 'text/plain';
        break;
      default:
        content = JSON.stringify(exportData, null, 2);
        filename = `${character.name || 'character'}_shadowaccord.json`;
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const generateCharacterSheet = useCallback((character) => {
    return `SHADOW ACCORD CHARACTER SHEET

=== BASIC INFORMATION ===
Name: ${character.name}
Player: ${character.player}
Faction: ${formatDisplayText(character.faction)}
Subfaction: ${formatDisplayText(character.subfaction)}${character.faction === 'wraith' && character.guild ? `
Guild: ${formatDisplayText(character.guild)}` : ''}${character.breed ? `
Breed: ${formatDisplayText(character.breed)}` : ''}${character.auspice ? `
Auspice: ${formatDisplayText(character.auspice)}` : ''}
Campaign: ${character.campaign || 'None'}
Created: ${new Date(character.created).toLocaleDateString()}

=== STATISTICS ===
Health: ${character.stats.health}/${character.stats.maxHealth}
Willpower: ${character.stats.willpower}
Energy (${character.stats.energyType}): ${character.stats.energy}/${character.stats.maxEnergy}
${character.stats.virtueType}: ${character.stats.virtue}

=== EXPERIENCE ===
Total XP: ${character.totalXP}
XP Spent: ${character.xpSpent}
Check-ins: ${character.checkInCount}

=== SKILLS ===
${Object.entries(character.skills).map(([skill, level]) => `${skill}: ${level}`).join('\n')}

=== POWERS ===
${Object.entries(character.powers).map(([tree, levels]) => 
  `${tree}: ${Object.keys(levels).join(', ')}`
).join('\n')}

=== MERITS ===
${Object.entries(character.merits).map(([meritId, value]) => {
  const merit = gameData.merits.find(m => m.merit_id === meritId);
  const isStackable = merit?.can_purchase_multiple === 'true';
  const displayText = isStackable && value > 1 ? `${meritId} (x${value})` : meritId;
  return `${displayText}: ${merit?.merit_name || meritId}`;
}).join('\n')}

=== NOTES ===
${character.notes}

Generated by Shadow Accord Character Builder Phase 8
`;
  }, []);

  // =====================
  // AUTO-SAVE SYSTEM
  // =====================
  useEffect(() => {
    if (autoSave && characters.length > 0) {
      const saveData = {
        characters,
        settings: { darkMode, accessibility },
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('shadowAccordPhase8', JSON.stringify(saveData));
      setLastSaved(new Date().toISOString());
    }
  }, [characters, darkMode, accessibility, autoSave]);

  // Load saved data on startup
  useEffect(() => {
    const savedData = localStorage.getItem('shadowAccordPhase8');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.characters) {
          // Migrate existing characters to include xpHistory if missing
          const migratedCharacters = data.characters.map(char => ({
            ...char,
            xpHistory: char.xpHistory || []
          }));
          setCharacters(migratedCharacters);
        }

        if (data.settings) {
          setDarkMode(data.settings.darkMode);
          setAccessibility(data.settings.accessibility);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // =======================
  // UI THEME SYSTEM
  // =======================
  const themeClasses = useMemo(() => {
    const base = darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
    const card = darkMode ? 'bg-gray-800' : 'bg-white';
    const border = darkMode ? 'border-gray-700' : 'border-gray-200';
    const input = darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900';
    const button = darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600';
    const danger = darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600';
    
    return {
      base: `${base} ${accessibility.largeText ? 'text-lg' : ''} ${accessibility.highContrast ? 'contrast-125' : ''}`,
      card: `${card} ${border} border rounded-lg shadow-lg`,
      input: `${input} border rounded px-3 py-2 w-full`,
      button: `${button} text-white px-4 py-2 rounded font-medium transition-colors`,
      danger: `${danger} text-white px-4 py-2 rounded font-medium transition-colors`,
      text: darkMode ? 'text-gray-300' : 'text-gray-600',
      label: 'block text-sm font-medium mb-1'
    };
  }, [darkMode, accessibility]);    // Filtered and sorted characters
  const filteredAndSortedCharacters = useMemo(() => {
    let filtered = characters.filter(char => {
      const matchesSearch = !searchQuery || 
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.player.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFaction = !filterFaction || char.faction === filterFaction;
      
      return matchesSearch && matchesFaction;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'faction': return a.faction.localeCompare(b.faction);
        case 'xp': return b.totalXP - a.totalXP;
        case 'created': return new Date(b.created) - new Date(a.created);
        case 'modified': return new Date(b.lastModified) - new Date(a.lastModified);
        default: return 0;
      }
    });
  }, [characters, searchQuery, filterFaction, sortBy]);

  // ======================
  // RENDER FUNCTIONS
  // ======================
  
  // Main Menu
  const renderMainMenu = () => (
    <div className={`min-h-screen ${themeClasses.base}`}>
      <div className="container mx-auto p-5">
        {/* Enhanced Header */}
        <div className="text-center mb-5">
          <div className="mb-2">
            <h1 className="text-4xl font-bold text-red-400">Shadow Accord Character Builder</h1>
          </div>
        </div>

        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className={themeClasses.card + ' p-3 text-center'}>
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-xl font-bold">{characters.length}</div>
            <div className="text-sm text-gray-400">Characters</div>
          </div>

          <div className={themeClasses.card + ' p-3 text-center'}>
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <div className="text-xl font-bold">
              {characters.reduce((sum, char) => sum + char.totalXP, 0)}
            </div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          <button
            onClick={() => {
              setNewCharacter(createBlankCharacter());
              setCurrentMode('creation');
              setCreationStep(0);
            }}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Plus className="w-8 h-8 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Create Character</h3>
            <p className="text-sm text-gray-400">Start a new Shadow Accord character</p>
          </button>

          <button
            onClick={() => setCurrentMode('management')}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
            disabled={characters.length === 0}
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Manage Characters</h3>
            <p className="text-sm text-gray-400">View and edit characters</p>
          </button>

          <button
            onClick={() => setCurrentMode('settings')}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Settings</h3>
            <p className="text-sm text-gray-400">Customize interface options</p>
          </button>


        </div>

        {/* Quick Actions */}
        <div className={themeClasses.card + ' p-5'}>
          <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => importCharacter(e.target.files[0]);
                input.click();
              }}
              className={themeClasses.card + ' p-3 text-center hover:shadow-lg transition-all'}
            >
              <Upload className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold">Import</div>
              <div className="text-sm text-gray-400">Load character</div>
            </button>

            <button
              onClick={() => {
                if (characters.length > 0) {
                  const exportData = {
                    characters,
                    exported: new Date().toISOString(),
                    version: 'Phase 8'
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                    { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'shadow_accord_backup.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className={themeClasses.card + ' p-3 text-center hover:shadow-lg transition-all'}
              disabled={characters.length === 0}
            >
              <Archive className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <div className="text-lg font-bold">Backup</div>
              <div className="text-sm text-gray-400">Save all characters</div>
            </button>
          </div>

          {/* Auto-save Status */}
          {lastSaved && (
            <div className="text-center mt-3">
              <p className={`text-sm ${themeClasses.text}`}>
                Last saved: {new Date(lastSaved).toLocaleString()}
                {autoSave && <span className="text-green-400 ml-2">● Auto-save enabled</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Character Creation
  const renderCharacterCreation = () => {
    if (!newCharacter) return null;

    const renderCreationStep = () => {
      switch (creationStep) {
        case 0: // Basic Info & Faction
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-bold mb-2">Basic Information</h3>
              
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-1">Character Name</label>
                  <input
                    type="text"
                    value={newCharacter.name}
                    onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                    className={themeClasses.input + " py-1.5"}
                    placeholder="Enter character name"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1">Player Name</label>
                  <input
                    type="text"
                    value={newCharacter.player}
                    onChange={(e) => setNewCharacter({...newCharacter, player: e.target.value})}
                    className={themeClasses.input + " py-1.5"}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1">Select Faction</label>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {gameData.factions.map(faction => (
                    <button
                      key={faction.faction_id}
                      onClick={() => {
                        const updated = handleFactionChange(newCharacter, faction.faction_id);
                        setNewCharacter(updated);
                      }}
                      className={`p-3 rounded-lg border transition-all ${
                        newCharacter.faction === faction.faction_id
                          ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <h4 className="font-bold text-xl capitalize mb-2">{faction.faction_name}</h4>
                      <p className="text-base mt-1">{faction.energy_type}</p>
                      <p className="text-sm mt-1 text-gray-400">Base {faction.virtue_type}: {faction.base_virtue}</p>
                    </button>
                  ))}
                </div>
              </div>

              {newCharacter.faction && (
                <div className={`${themeClasses.card} p-3 mt-3`}>
                  <h4 className="font-bold text-xl mb-2">Faction Details</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-base">
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">Health:</span>
                      <span className="float-right font-medium">{newCharacter.stats.health}</span>
                    </div>
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">Willpower:</span>
                      <span className="float-right font-medium">{newCharacter.stats.willpower}</span>
                    </div>
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">{newCharacter.stats.energyType}:</span>
                      <span className="float-right font-medium">{newCharacter.stats.energy}</span>
                    </div>
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">{newCharacter.stats.virtueType}:</span>
                      <span className="float-right font-medium">{newCharacter.stats.virtue}</span>
                    </div>
                  </div>
                  {newCharacter.fundamentalPowers.length > 0 && (
                    <div className="mt-3 p-3 border-t border-gray-700">
                      <p className="text-lg font-semibold mb-2 text-purple-400">Fundamental Powers:</p>
                      <div className="flex flex-wrap gap-2">
                        {newCharacter.fundamentalPowers.map(power => (
                          <span key={power} className="px-3 py-1 bg-purple-600 bg-opacity-20 rounded text-base">
                            {power}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case 1: // Subfaction Selection
          const availableSubfactions = gameData.subfactions.filter(
            sf => sf.faction_id === newCharacter.faction
          );
          
          // For wraiths, separate legions and guilds
          const availableLegions = newCharacter.faction === 'wraith' 
            ? availableSubfactions.filter(sf => sf.type === 'legion' || sf.type === 'faction')
            : [];
          const availableGuilds = newCharacter.faction === 'wraith'
            ? availableSubfactions.filter(sf => sf.type === 'guild')
            : [];
          
          return (
            <div className="space-y-6">
              {newCharacter.faction === 'wraith' ? (
                <div>
                  <h3 className="text-2xl font-bold mb-2">Choose Legion</h3>
                </div>
              ) : (
                <h3 className="text-2xl font-bold mb-2">Choose Subfaction</h3>
              )}
              
              {/* Legion Selection for Wraiths */}
              {newCharacter.faction === 'wraith' && availableLegions.length > 0 && (
                <div className="grid md:grid-cols-2 gap-2">
                  {availableLegions.map(subfaction => (
                  <button
                    key={subfaction.subfaction_id}
                    onClick={() => {
                      const updated = handleSubfactionChange(newCharacter, subfaction.subfaction_id);
                      setNewCharacter(updated);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      newCharacter.subfaction === subfaction.subfaction_id
                        ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <h4 className="font-bold text-xl capitalize mb-2">{subfaction.subfaction_name}</h4>
                    {subfaction.restrictions && (
                      <p className="text-sm text-yellow-400 mb-2">{subfaction.restrictions}</p>
                    )}
                    {subfaction.dormancy_rules && (
                      <p className="text-sm text-red-400 mb-2">Dormancy: {subfaction.dormancy_rules}</p>
                    )}
                  </button>
                ))}
                </div>
              )}
              
              {/* Guild Selection for Wraiths */}
              {newCharacter.faction === 'wraith' && (
                <div>
                  <h3 className="text-2xl font-bold mb-2">Choose Guild</h3>
                  <p className="text-gray-400 mb-3">Select a guild that represents your character's professional specialization in the underworld.</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {availableGuilds.map(guild => (
                    <button
                      key={guild.subfaction_id}
                      onClick={() => {
                        setNewCharacter({
                          ...newCharacter,
                          guild: guild.subfaction_id
                        });
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        newCharacter.guild === guild.subfaction_id
                          ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <h4 className="font-bold text-xl capitalize mb-2">{guild.subfaction_name}</h4>
                      {guild.restrictions && (
                        <p className="text-sm text-yellow-400 mb-2">{guild.restrictions}</p>
                      )}
                      {guild.dormancy_rules && (
                        <p className="text-sm text-red-400 mb-2">Dormancy: {guild.dormancy_rules}</p>
                      )}
                    </button>
                  ))}
                  </div>
                </div>
              )}
              
              {/* Non-Wraith Subfaction Selection */}
              {newCharacter.faction !== 'wraith' && availableSubfactions.length > 0 && (
                <div className="grid md:grid-cols-2 gap-2">
                  {availableSubfactions.map(subfaction => (
                  <button
                    key={subfaction.subfaction_id}
                    onClick={() => {
                      const updated = handleSubfactionChange(newCharacter, subfaction.subfaction_id);
                      setNewCharacter(updated);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      newCharacter.subfaction === subfaction.subfaction_id
                        ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <h4 className="font-bold text-xl capitalize mb-2">{subfaction.subfaction_name}</h4>
                    {subfaction.restrictions && (
                      <p className="text-sm text-yellow-400 mb-2">{subfaction.restrictions}</p>
                    )}
                    {subfaction.dormancy_rules && (
                      <p className="text-sm text-red-400 mb-2">Dormancy: {subfaction.dormancy_rules}</p>
                    )}
                  </button>
                ))}
                </div>
              )}
              
              {/* Wraith Tree Selection */}
              {newCharacter.faction === 'wraith' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select 3 Innate Power Trees</h4>
                  <p className="text-gray-400 mb-2">Choose exactly 3 power trees that will be your innate disciplines.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => tree.faction === 'wraith')
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        const canSelect = !isSelected && newCharacter.innateTreeIds.length < 3;
                        const canDeselect = isSelected;
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isSelected) {
                                // Deselect tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id)
                                });
                              } else if (canSelect) {
                                // Select tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [...newCharacter.innateTreeIds, tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-green-500 bg-green-500 bg-opacity-20'
                                : canSelect
                                  ? 'border-gray-600 hover:border-gray-400 cursor-pointer'
                                  : 'border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                            disabled={!canSelect && !canDeselect}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Trees:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 3 ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 3
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length !== 3 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        {newCharacter.innateTreeIds.length === 0 
                          ? 'Please select 3 power trees to continue.'
                          : `Select ${3 - newCharacter.innateTreeIds.length} more tree${3 - newCharacter.innateTreeIds.length === 1 ? '' : 's'} to continue.`
                        }
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-green-600 text-green-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wraith Shadow Archetype Selection */}
              {newCharacter.faction === 'wraith' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Shadow Archetype</h4>
                  <p className="text-gray-400 mb-2">Choose your Shadow's dominant archetype. This represents the darker aspect of your psyche and grants you access to specific thorn options and powers.</p>
                  
                  <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-2">
                    {gameData.shadowArchetypes.map(archetype => {
                      const isSelected = newCharacter.shadowArchetype === archetype.archetype_id;
                      
                      return (
                        <button
                          key={archetype.archetype_id}
                          onClick={() => {
                            console.log('Selecting shadow archetype:', archetype.archetype_name);
                            console.log('Thorn options:', archetype.thorn_options.split('|'));
                            
                            setNewCharacter({
                              ...newCharacter,
                              shadowArchetype: archetype.archetype_id,
                              thornOptions: archetype.thorn_options.split('|'),
                              selectedThorn: '', // Reset selected thorn when changing archetype
                              fundamentalPowers: newCharacter.fundamentalPowers.filter(p => 
                                !p.startsWith('Shadow') && 
                                p !== 'Brutal Strike' && 
                                p !== 'Hallucination' &&
                                p !== 'Despair' && 
                                p !== 'Silver Tongue' &&
                                p !== 'Horrid Reality' &&
                                p !== 'Smell Fear' &&
                                p !== 'Taunt' &&
                                p !== 'Sense Confidence' &&
                                p !== 'True Form' &&
                                p !== 'Decay' &&
                                p !== 'Mimic' &&
                                p !== 'Wounding Lies' &&
                                p !== 'Hero\'s Stand' &&
                                p !== 'Mass Taunt' &&
                                p !== 'Brittle Bones' &&
                                p !== 'Frenzy Control' &&
                                p !== 'Cloak Gathering' &&

                                p !== 'Meld' &&
                                p !== 'Tainted Revive' &&
                                p !== 'Paralyze' &&
                                p !== 'Majesty' &&
                                p !== 'Tainted Healing Touch' &&
                                p !== 'Terror'
                              )
                            });
                          }}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-red-500 bg-red-500 bg-opacity-20'
                              : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-lg capitalize">{archetype.archetype_name}</h5>
                            {isSelected && (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm text-gray-300 mb-2">{archetype.description}</p>
                            
                            <div className="mt-2">
                              <p className="text-sm text-gray-400 mb-1">RP Examples:</p>
                              <p className="text-sm text-orange-300">{archetype.rp_examples}</p>
                            </div>
                            
                            <div className="mt-2">
                              <p className="text-sm text-gray-400 mb-1">Thorn Options:</p>
                              <p className="text-sm text-red-300">{archetype.thorn_options.split('|').join(' or ')}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Archetype:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.shadowArchetype ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.shadowArchetype ? 
                          gameData.shadowArchetypes.find(a => a.archetype_id === newCharacter.shadowArchetype)?.archetype_name || 'Unknown'
                          : 'None'
                        }
                      </span>
                    </div>
                    
                    {!newCharacter.shadowArchetype && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select a Shadow Archetype to continue.
                      </p>
                    )}
                    
                    {newCharacter.shadowArchetype && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm capitalize">
                            {gameData.shadowArchetypes.find(a => a.archetype_id === newCharacter.shadowArchetype)?.archetype_name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Available Thorn Options: {newCharacter.thornOptions?.join(', ') || 'None'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      👤 <strong>Shadow Nature:</strong> Your Shadow Archetype represents the darker impulses of your psyche. When your Shadow dominates, you gain access to these thorns and powers, but may act against your character's normal moral compass.
                    </p>
                  </div>
                </div>
              )}

              {/* Sorcerer Tree and Fellowship Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' && (
                <div className="space-y-6 mt-5">
                  {/* Sorcerer Power Tree Selection */}
                  <div className={`${themeClasses.card} p-5`}>
                    <h4 className="text-xl font-bold mb-2">Select 2 Sorcerer Power Trees</h4>
                    <p className="text-gray-400 mb-2">Choose 2 sorcerer power trees that will define your magical abilities.</p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {/* Basic Sorcerer Trees */}
                      {gameData.powerTrees
                        .filter(tree => tree.faction === 'human' && ['animal', 'body', 'curse', 'healer', 'mind', 'patterns', 'perception', 'protection', 'spirit', 'warrior'].includes(tree.tree_id))
                        .map(tree => {
                          const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                          const canSelect = !isSelected && newCharacter.innateTreeIds.length < 2;
                          const canDeselect = isSelected;
                          
                          return (
                            <button
                              key={tree.tree_id}
                              onClick={() => {
                                if (isSelected) {
                                  // Deselect tree
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id)
                                  });
                                } else if (canSelect) {
                                  // Select tree
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: [...newCharacter.innateTreeIds, tree.tree_id]
                                  });
                                }
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-green-500 bg-green-500 bg-opacity-20'
                                  : canSelect
                                    ? 'border-gray-600 hover:border-gray-400 cursor-pointer'
                                    : 'border-gray-700 opacity-50 cursor-not-allowed'
                              }`}
                              disabled={!canSelect && !canDeselect}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                              
                              {tree.level1_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                  <p className="text-sm">{tree.level1_powers}</p>
                                </div>
                              )}
                              
                              {tree.level2_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                  <p className="text-sm">{tree.level2_powers}</p>
                                </div>
                              )}
                              
                              {tree.level3_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                  <p className="text-sm">{tree.level3_powers}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}

                      {/* Fallen Paths - Death, Demonology, Madness, Ruin */}
                      {gameData.powerTrees
                        .filter(tree => ['death', 'demonology', 'madness', 'ruin'].includes(tree.tree_id))
                        .map(tree => {
                          const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                          const canSelect = !isSelected && newCharacter.innateTreeIds.length < 2;
                          const canDeselect = isSelected;
                          
                          return (
                            <button
                              key={tree.tree_id}
                              onClick={() => {
                                if (isSelected) {
                                  // Deselect tree
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id)
                                  });
                                } else if (canSelect) {
                                  // Select tree
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: [...newCharacter.innateTreeIds, tree.tree_id]
                                  });
                                }
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-left relative ${
                                isSelected
                                  ? 'border-red-500 bg-red-500 bg-opacity-20'
                                  : canSelect
                                    ? 'border-red-800 hover:border-red-600 cursor-pointer bg-red-900 bg-opacity-20'
                                    : 'border-gray-700 opacity-50 cursor-not-allowed'
                              }`}
                              disabled={!canSelect && !canDeselect}
                            >
                              {/* Fallen Path Badge */}
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 bg-red-600 bg-opacity-60 rounded text-xs text-red-200 font-medium">
                                  FALLEN PATH
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-lg capitalize text-red-300">{tree.tree_name}</h5>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                              
                              {tree.level1_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-red-400 mb-1">Level 1:</p>
                                  <p className="text-sm text-gray-300">{tree.level1_powers}</p>
                                </div>
                              )}
                              
                              {tree.level2_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-red-400 mb-1">Level 2:</p>
                                  <p className="text-sm text-gray-300">{tree.level2_powers}</p>
                                </div>
                              )}
                              
                              {tree.level3_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-red-400 mb-1">Level 3:</p>
                                  <p className="text-sm text-gray-300">{tree.level3_powers}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    
                    <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Selected Trees:</span>
                        <span className={`text-sm font-medium ${
                          newCharacter.innateTreeIds.length === 2 ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {newCharacter.innateTreeIds.length} / 2
                        </span>
                      </div>
                      
                      {newCharacter.innateTreeIds.length !== 2 && (
                        <p className="text-sm text-yellow-400 mt-2">
                          {newCharacter.innateTreeIds.length === 0 
                            ? 'Please select 2 power trees to continue.'
                            : `Select ${2 - newCharacter.innateTreeIds.length} more tree${2 - newCharacter.innateTreeIds.length === 1 ? '' : 's'} to continue.`
                          }
                        </p>
                      )}
                      
                      {newCharacter.innateTreeIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {newCharacter.innateTreeIds.map(treeId => {
                            const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                            const isFallenPath = ['death', 'demonology', 'madness', 'ruin'].includes(treeId);
                            return tree ? (
                              <span
                                key={treeId}
                                className={`px-2 py-1 rounded text-sm capitalize ${
                                  isFallenPath ? 'bg-red-600 text-red-100' : 'bg-green-600 text-green-100'
                                }`}
                              >
                                {tree.tree_name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                      <p className="text-sm text-red-300">
                        ⚠️ <strong>Warning:</strong> Fallen paths (Death, Demonology, Madness, Ruin) are dangerous magical traditions that corrupt the soul. They offer great power but at terrible personal cost.
                      </p>
                    </div>
                  </div>

                  {/* Fellowship Selection */}
                  <div className={`${themeClasses.card} p-5`}>
                    <h4 className="text-xl font-bold mb-2">Select Fellowship (Optional)</h4>
                    <p className="text-gray-400 mb-2">Choose a sorcerer fellowship for additional specialized abilities, or select "No Fellowship" to remain independent. Fellowships provide access to advanced magical traditions.</p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {/* No Fellowship Option */}
                      <button
                        onClick={() => {
                          setNewCharacter({
                            ...newCharacter,
                            fellowship: null
                          });
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          !newCharacter.fellowship
                            ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                            : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-bold text-lg">No Fellowship</h5>
                          {!newCharacter.fellowship && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-300">Remain an independent sorcerer without fellowship ties.</p>
                      </button>

                      {/* Fellowship Options */}
                      {gameData.powerTrees
                        .filter(tree => ['ahl_i_batin', 'craftmason', 'messianic_voices', 'old_faith', 'order_of_hermes', 'spirit_talkers', 'valdaermen', 'veneficti'].includes(tree.tree_id))
                        .map(tree => {
                          const isSelected = newCharacter.fellowship === tree.tree_id;
                          
                          return (
                            <button
                              key={tree.tree_id}
                              onClick={() => {
                                setNewCharacter({
                                  ...newCharacter,
                                  fellowship: isSelected ? null : tree.tree_id
                                });
                              }}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                                  : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                              
                              {tree.level1_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                  <p className="text-sm">{tree.level1_powers}</p>
                                </div>
                              )}
                              
                              {tree.level2_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                  <p className="text-sm">{tree.level2_powers}</p>
                                </div>
                              )}
                              
                              {tree.level3_powers && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                  <p className="text-sm">{tree.level3_powers}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                      <p className="text-sm text-blue-300">
                        Fellowship selection is optional. You can change or join a fellowship later during advancement.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Black Spiral Dancer Wyrm Gift Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction === 'black_spiral_dancer' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Wyrm Gift</h4>
                  <p className="text-gray-400 mb-2">As a Black Spiral Dancer, choose one Wyrm gift that represents your corruption by the Wyrm. This will be your innate power tree.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              const wyrmGifts = ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'];
                              if (isSelected) {
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id)
                                });
                              } else {
                                // Remove any other Wyrm gifts and add this one
                                const filteredTreeIds = newCharacter.innateTreeIds.filter(id => !wyrmGifts.includes(id));
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [...filteredTreeIds, tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left relative ${
                              isSelected
                                ? 'border-red-500 bg-red-500 bg-opacity-20'
                                : 'border-red-800 hover:border-red-600 cursor-pointer bg-red-900 bg-opacity-20'
                            }`}
                          >
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 bg-red-600 bg-opacity-60 rounded text-xs text-red-200 font-medium">
                                WYRM GIFT
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize text-red-300">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-red-400 mb-1">Level 1:</p>
                                <p className="text-sm text-gray-300">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-red-400 mb-1">Level 2:</p>
                                <p className="text-sm text-gray-300">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-red-400 mb-1">Level 3:</p>
                                <p className="text-sm text-gray-300">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Wyrm Gift:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 1 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 1
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length === 0 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select one Wyrm gift to continue.
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      🐺 <strong>Wyrm Corruption:</strong> Black Spiral Dancers are wholly corrupted by the Wyrm. Your chosen gift represents the primary manifestation of this corruption in your character.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Fallen Fera Wyrm Gift Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction === 'fallen_fera' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Wyrm Gift</h4>
                  <p className="text-gray-400 mb-2">As a Fallen Fera, choose one Wyrm gift that represents how the Wyrm has corrupted your kind. This will be your innate power tree.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              const wyrmGifts = ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'];
                              if (isSelected) {
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id)
                                });
                              } else {
                                // Remove any other Wyrm gifts and add this one
                                const filteredTreeIds = newCharacter.innateTreeIds.filter(id => !wyrmGifts.includes(id));
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [...filteredTreeIds, tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left relative ${
                              isSelected
                                ? 'border-red-500 bg-red-500 bg-opacity-20'
                                : 'border-red-800 hover:border-red-600 cursor-pointer bg-red-900 bg-opacity-20'
                            }`}
                          >
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 bg-red-600 bg-opacity-60 rounded text-xs text-red-200 font-medium">
                                WYRM GIFT
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize text-red-300">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-red-400 mb-1">Level 1:</p>
                                <p className="text-sm text-gray-300">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-red-400 mb-1">Level 2:</p>
                                <p className="text-sm text-gray-300">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-red-400 mb-1">Level 3:</p>
                                <p className="text-sm text-gray-300">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Wyrm Gift:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.filter(id => ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'].includes(id)).length === 1 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.innateTreeIds.filter(id => ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'].includes(id)).length} / 1
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.filter(id => ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'].includes(id)).length === 0 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select one Wyrm gift to continue.
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      🌑 <strong>Fallen Nature:</strong> Fallen Fera are fera who have been corrupted by the Wyrm. Your chosen gift represents the specific way the Wyrm has twisted your natural abilities.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Caitiff Tree Selection */}
              {newCharacter.faction === 'vampire' && newCharacter.subfaction === 'caitiff' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select 3 Vampire Disciplines</h4>
                  <p className="text-gray-400 mb-2">As a Caitiff, pick three of: Animalism, Auspex, Celerity, Dominate, Fortitude, Obfuscate, Potence, or Presence.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => tree.faction === 'vampire' && 
                        ['animalism', 'auspex', 'celerity', 'dominate', 'fortitude', 'obfuscate', 'potence', 'presence'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        const canSelect = !isSelected && newCharacter.innateTreeIds.length < 3;
                        const canDeselect = isSelected;
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isSelected) {
                                // Deselect tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id)
                                });
                              } else if (canSelect) {
                                // Select tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [...newCharacter.innateTreeIds, tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-red-500 bg-red-500 bg-opacity-20'
                                : canSelect
                                  ? 'border-gray-600 hover:border-gray-400 cursor-pointer'
                                  : 'border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                            disabled={!canSelect && !canDeselect}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Disciplines:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 3 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 3
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length !== 3 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        {newCharacter.innateTreeIds.length === 0 
                          ? 'Please select 3 vampire disciplines to continue.'
                          : `Select ${3 - newCharacter.innateTreeIds.length} more discipline${3 - newCharacter.innateTreeIds.length === 1 ? '' : 's'} to continue.`
                        }
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Faithful Bounty Tree Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Faithful Bounty Tree</h4>
                  <p className="text-gray-400 mb-2">As one of the Faithful, choose one bounty tree that represents your divine calling. This will be your only innate power tree - you cannot learn other trees.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['affinity', 'champion', 'discernment', 'purity', 'solace', 'spiritual'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isSelected) {
                                // Deselect tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: []
                                });
                              } else {
                                // Select tree (only one allowed)
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-yellow-500 bg-yellow-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Bounty:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 1 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 1
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length === 0 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select one bounty tree to continue.
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-yellow-600 bg-opacity-20 rounded-lg border border-yellow-500">
                    <p className="text-sm text-yellow-300">
                      ⚡ <strong>Divine Restriction:</strong> The Faithful are bound by divine covenant. You can only ever learn powers from your chosen bounty tree and cannot access other magical traditions.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Drone Tree Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Weaver Trees</h4>
                  <p className="text-gray-400 mb-2">As a Claimed Drone, you have access to all Weaver paradigms as innate power trees. All three trees (Stasis, Weaver, Onesong) are automatically available to you at innate costs (3/6/9 XP). You also possess Regeneration 3 as an innate power.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['stasis', 'weaver', 'onesong'].includes(tree.tree_id))
                      .map(tree => {
                        return (
                          <div
                            key={tree.tree_id}
                            className="p-3 rounded-lg border-2 border-cyan-500 bg-cyan-500 bg-opacity-20"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Innate Trees:</span>
                      <span className="text-sm font-medium text-cyan-400">
                        3 / 3 (All Weaver Trees)
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['stasis', 'weaver', 'onesong'].map(treeId => {
                        const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                        return tree ? (
                          <span
                            key={treeId}
                            className="px-2 py-1 bg-cyan-600 text-cyan-100 rounded text-sm capitalize"
                          >
                            {tree.tree_name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-cyan-600 bg-opacity-20 rounded-lg border border-cyan-500">
                    <p className="text-sm text-cyan-300">
                      🕷️ <strong>Pattern Web Binding:</strong> Claimed Drones are bound to the Weaver's Pattern Web. All Weaver paradigms (Stasis, Weaver, Onesong) are innate to you at 3/6/9 XP costs.
                    </p>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-600 bg-opacity-20 rounded-lg border border-green-500">
                    <p className="text-sm text-green-300">
                      ⚡ <strong>Innate Regeneration:</strong> Claimed Drones also possess Regeneration 3 as an innate power, representing their enhanced Pattern Web connection.
                    </p>
                  </div>
                </div>
              )}

              {/* Drone Free Power Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select 3 Free Power Dots</h4>
                  <p className="text-gray-400 mb-2">As a Claimed Drone, you may select 3 free dots of powers from your Weaver trees during character creation. These can be distributed across any combination of your innate trees.</p>
                  
                  <div className="space-y-4">
                    {['stasis', 'weaver', 'onesong'].map(treeId => {
                      const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                      if (!tree) return null;
                      
                      const currentLevels = newCharacter.powers?.[treeId] || {};
                      
                      return (
                        <div key={treeId} className="p-3 border border-cyan-500 rounded-lg bg-cyan-500 bg-opacity-10">
                          <h5 className="font-bold text-lg capitalize mb-2">{tree.tree_name}</h5>
                          <div className="space-y-2">
                            {[1, 2, 3].map(level => {
                              const hasLevel = currentLevels[level];
                              const cannotLearnYet = level > 1 && !currentLevels[level - 1];
                              const totalFreeDots = Object.values(newCharacter.powers || {}).reduce((total, treePowers) => 
                                total + Object.values(treePowers).length, 0);
                              const canAfford = totalFreeDots < 3;
                              
                              return (
                                <div key={level} className={`p-3 rounded border transition-all ${
                                  hasLevel
                                    ? 'border-green-400 bg-green-400 bg-opacity-20'
                                    : canAfford && !cannotLearnYet
                                      ? 'border-blue-400 bg-blue-400 bg-opacity-10 cursor-pointer hover:bg-blue-400 hover:bg-opacity-20'
                                      : 'border-gray-600 bg-gray-700 bg-opacity-30 opacity-60'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-1">
                                        <span className="font-medium">Level {level}</span>
                                        {hasLevel && (
                                          <span className="ml-2 text-green-400 text-sm">✓ Selected</span>
                                        )}
                                        {cannotLearnYet && (
                                          <span className="ml-2 text-yellow-400 text-sm">Requires Level {level - 1}</span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-300">
                                        {tree[`level${level}_powers`]?.split('|').join(', ') || 'No powers listed'}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {hasLevel && (
                                        <button
                                          onClick={() => {
                                            const updatedPowers = { ...newCharacter.powers };
                                            if (updatedPowers[treeId]) {
                                              delete updatedPowers[treeId][level];
                                              if (Object.keys(updatedPowers[treeId]).length === 0) {
                                                delete updatedPowers[treeId];
                                              }
                                            }
                                            setNewCharacter({
                                              ...newCharacter,
                                              powers: updatedPowers
                                            });
                                          }}
                                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                        >
                                          Remove
                                        </button>
                                      )}
                                      {!hasLevel && canAfford && !cannotLearnYet && (
                                        <button
                                          onClick={() => {
                                            const updatedPowers = { ...newCharacter.powers };
                                            if (!updatedPowers[treeId]) {
                                              updatedPowers[treeId] = {};
                                            }
                                            updatedPowers[treeId][level] = true;
                                            setNewCharacter({
                                              ...newCharacter,
                                              powers: updatedPowers
                                            });
                                          }}
                                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                                        >
                                          Select (FREE)
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Free Dots Used:</span>
                      <span className={`text-sm font-medium ${
                        Object.values(newCharacter.powers || {}).reduce((total, treePowers) => 
                          total + Object.values(treePowers).length, 0) === 3 ? 'text-green-400' : 'text-cyan-400'
                      }`}>
                        {Object.values(newCharacter.powers || {}).reduce((total, treePowers) => 
                          total + Object.values(treePowers).length, 0)} / 3
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-600 bg-opacity-20 rounded-lg border border-blue-500">
                    <p className="text-sm text-blue-300">
                      💡 <strong>Creation Bonus:</strong> These 3 free power dots are only available during character creation. You can distribute them however you like across your Weaver trees, but must follow normal prerequisites (Level 1 before Level 2, etc.).
                    </p>
                  </div>
                </div>
              )}
              
              {/* Fomori Tree Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Fomori Tree</h4>
                  <p className="text-gray-400 mb-2">As a Claimed Fomori, choose one Bane manifestation that represents your possession by a Wyrm spirit. This will be your only innate power tree.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['enticer', 'ferectori', 'gorehound', 'toad'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isSelected) {
                                // Deselect tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: []
                                });
                              } else {
                                // Select tree (only one allowed)
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-red-500 bg-red-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                            
                            {tree.tree_id === 'toad' && (
                              <div className="mt-2 p-2 bg-yellow-600 bg-opacity-20 rounded border border-yellow-500">
                                <p className="text-xs text-yellow-300">
                                  ⚠️ <strong>Mutation:</strong> Learning any power from this tree also grants at least one Mutation.
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Tree:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 1 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 1
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length === 0 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select one Fomori tree to continue.
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      👹 <strong>Bane Possession:</strong> Claimed Fomori are possessed by Bane spirits of the Wyrm. Your chosen manifestation is your innate tree, but you can learn powers from other Fomori trees at corrupt prices (same as innate cost) if taught by another Fomori. Non-chosen Fomori trees are considered "corrupt trees."
                    </p>
                  </div>
                </div>
              )}
              
              {/* Claimed Gorgon Tree Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Gorgon Tree</h4>
                  <p className="text-gray-400 mb-2">As a Claimed Gorgon, you must take the Gorgon manifestation that represents your connection to dream and reality. This will be your only innate power tree. You also possess Frail as an innate power.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['gorgon'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isSelected) {
                                // Deselect tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: []
                                });
                              } else {
                                // Select tree (only one allowed)
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Tree:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 1 ? 'text-purple-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 1
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length === 0 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select the Gorgon tree to continue.
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-purple-600 text-purple-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-purple-600 bg-opacity-20 rounded-lg border border-purple-500">
                    <p className="text-sm text-purple-300">
                      👁️ <strong>Dream Reality:</strong> Claimed Gorgons bridge the gap between dream and reality. You can only ever learn powers from the Gorgon manifestation and cannot access other supernatural abilities.
                    </p>
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      💔 <strong>Innate Frailty:</strong> Claimed Gorgons also possess Frail as an innate power, representing their fragile connection between dream and reality.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Commoner Talent Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Commoner Talent</h4>
                  <p className="text-gray-400 mb-2">As a Commoner, choose one talent tree that represents your natural abilities. This will be your innate power tree, and you can learn other talent trees during advancement.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['brash', 'brawny', 'inquisitive', 'sturdy'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.innateTreeIds.includes(tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isSelected) {
                                // Deselect tree
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: []
                                });
                              } else {
                                // Select tree (only one allowed)
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: [tree.tree_id]
                                });
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-green-500 bg-green-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {tree.level2_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 2:</p>
                                <p className="text-sm">{tree.level2_powers}</p>
                              </div>
                            )}
                            
                            {tree.level3_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 3:</p>
                                <p className="text-sm">{tree.level3_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Talent:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.innateTreeIds.length === 1 ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.innateTreeIds.length} / 1
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length === 0 && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select one talent tree to continue.
                      </p>
                    )}
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-green-600 text-green-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-600 bg-opacity-20 rounded-lg border border-green-500">
                    <p className="text-sm text-green-300">
                      💪 <strong>Natural Talents:</strong> Commoners have innate human talents that can be developed. You can learn other talent trees during advancement at standard costs.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Gifted Kinfolk Tribal Selection */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Tribal Gift</h4>
                  <p className="text-gray-400 mb-2">As Gifted Kinfolk, you have access to Homid gifts (already included) and may choose one tribal gift tree from any Garou tribe or Fera. Sorcerer powers are not available to Kinfolk.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameData.subfactions
                      .filter(tribe => {
                        // Only allow genuine shifter tribes and fera, exclude sorcerer or other human subfactions
                        return tribe.faction_id === 'shifter' && 
                               (tribe.type === 'tribe' || tribe.type === 'fera' || 
                                tribe.subfaction_id === 'black_spiral_dancer' || 
                                tribe.subfaction_id === 'fallen_fera') &&
                               tribe.subfaction_id !== 'sorcerer'; // Explicitly exclude sorcerer
                      })
                      .map(tribe => {
                        // Special handling for Wyrm-corrupted subfactions
                        if (tribe.subfaction_id === 'black_spiral_dancer' || tribe.subfaction_id === 'fallen_fera') {
                          // These subfactions offer choice of Wyrm gifts instead of a single tribal tree
                          const wyrmGifts = ['corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength'];
                          const selectedWyrmGift = newCharacter.innateTreeIds.find(treeId => wyrmGifts.includes(treeId));
                          
                          return (
                            <div key={tribe.subfaction_id} className="space-y-2">
                              <h5 className="font-bold text-lg capitalize text-red-300 mb-2">{tribe.subfaction_name}</h5>
                              <p className="text-sm text-red-400 mb-2">Choose one Wyrm gift from this corrupted lineage:</p>
                              
                              <div className="grid grid-cols-1 gap-2">
                                {wyrmGifts.map(wyrmTreeId => {
                                  const wyrmTree = gameData.powerTrees.find(tree => tree.tree_id === wyrmTreeId);
                                  const isSelected = newCharacter.innateTreeIds.includes(wyrmTreeId);
                                  
                                  if (!wyrmTree) return null;
                                  
                                  return (
                                    <button
                                      key={`${tribe.subfaction_id}_${wyrmTreeId}`}
                                      onClick={() => {
                                        // Remove any existing Wyrm gifts and add this one (or remove if already selected)
                                        let newInnateTreeIds = newCharacter.innateTreeIds.filter(id => !wyrmGifts.includes(id));
                                        newInnateTreeIds = ['homid']; // Always keep homid for kinfolk
                                        
                                        if (!isSelected) {
                                          newInnateTreeIds.push(wyrmTreeId);
                                        }
                                        
                                        setNewCharacter({
                                          ...newCharacter,
                                          innateTreeIds: newInnateTreeIds
                                        });
                                      }}
                                      className={`p-2 rounded border text-left text-sm ${
                                        isSelected
                                          ? 'border-red-500 bg-red-500 bg-opacity-20 text-red-300'
                                          : 'border-red-800 hover:border-red-600 bg-red-900 bg-opacity-10 text-gray-300 hover:text-red-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="capitalize font-medium">{wyrmTree.tree_name}</span>
                                        {isSelected && (
                                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs">✓</span>
                                          </div>
                                        )}
                                      </div>
                                      {wyrmTree.level1_powers && (
                                        <p className="text-xs text-gray-400 mt-1">{wyrmTree.level1_powers}</p>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              {selectedWyrmGift && (
                                <div className="mt-2 p-2 bg-red-600 bg-opacity-20 rounded border border-red-500">
                                  <p className="text-xs text-red-300">
                                    ⚠️ <strong>Corrupted Lineage:</strong> This Kinfolk bloodline has been tainted by the Wyrm.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        // Normal tribal gift handling for regular tribes/fera
                        const tribalTreeId = tribe.innate_trees; // The tribal gift tree
                        const tribalTree = gameData.powerTrees.find(tree => tree.tree_id === tribalTreeId);
                        const isSelected = newCharacter.innateTreeIds.includes(tribalTreeId);
                        
                        // Additional safety check: skip if tree is somehow sorcerer-related
                        if (!tribalTree || tribalTree.faction === 'sorcerer' || tribalTreeId.includes('sorcerer')) {
                          return null;
                        }
                        
                        return (
                          <button
                            key={tribe.subfaction_id}
                            onClick={() => {
                              const updated = handleKinfolkTribalSelection(newCharacter, isSelected ? null : tribalTreeId);
                              setNewCharacter(updated);
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-green-500 bg-green-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400'
                            }`}
                            disabled={tribe.restrictions && tribe.restrictions.includes('Lupus only')} // Disable Red Talons for kinfolk
                          >
                            <h5 className="font-bold text-lg capitalize mb-2">{tribe.subfaction_name}</h5>
                            {tribe.restrictions && (
                              <p className="text-sm text-yellow-400 mb-2">{tribe.restrictions}</p>
                            )}
                            {tribalTree && (
                              <div className="mt-3 border-t border-gray-700 pt-3">
                                <p className="text-sm text-green-400 mb-1">Tribal Gifts:</p>
                                {tribalTree.level1_powers && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-400 mb-1">Level 1:</p>
                                    <p className="text-xs">{tribalTree.level1_powers}</p>
                                  </div>
                                )}
                                {tribalTree.level2_powers && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-400 mb-1">Level 2:</p>
                                    <p className="text-xs">{tribalTree.level2_powers}</p>
                                  </div>
                                )}
                                {tribalTree.level3_powers && (
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Level 3:</p>
                                    <p className="text-xs">{tribalTree.level3_powers}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Trees:</span>
                      <span className="text-sm font-medium text-green-400">
                        Homid (innate) {newCharacter.innateTreeIds.length > 1 ? '+ 1 Tribal' : ''}
                      </span>
                    </div>
                    
                    {newCharacter.innateTreeIds.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-2 py-1 bg-green-600 text-green-100 rounded text-sm capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Note: You can deselect your tribal choice to have only Homid gifts, or select a different tribe.
                    </p>
                  </div>
                </div>
              )}

              {/* Shifter Breed Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Breed</h4>
                  <p className="text-gray-400 mb-2">Choose your character's breed - their born form.</p>
                  
                  <div className="grid md:grid-cols-3 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['homid', 'lupus', 'natus'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.breed === tree.tree_id;
                        const isAvailable = isBreedAvailableForTribe(newCharacter.subfaction, tree.tree_id);
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              if (isAvailable) {
                                const updated = handleBreedSelection(newCharacter, tree.tree_id);
                                setNewCharacter(updated);
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-green-500 bg-green-500 bg-opacity-20'
                                : isAvailable
                                  ? 'border-gray-600 hover:border-gray-400 cursor-pointer'
                                  : 'border-gray-700 opacity-50 cursor-not-allowed'
                            }`}
                            disabled={!isAvailable}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                            
                            {!isAvailable && (
                              <p className="text-sm text-red-400 mt-2">Not available for this tribe</p>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Shifter Auspice Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Auspice</h4>
                  <p className="text-gray-400 mb-2">Choose your character's auspice - their role and moon phase.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-2">
                    {gameData.powerTrees
                      .filter(tree => ['ragabash', 'theurge', 'philodox', 'galliard', 'ahroun'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.auspice === tree.tree_id;
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              const updated = handleAuspiceSelection(newCharacter, tree.tree_id);
                              setNewCharacter(updated);
                            }}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {tree.level1_powers && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-1">Level 1:</p>
                                <p className="text-sm">{tree.level1_powers}</p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Shifter Selection Summary */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Shifter Summary</h4>
                  
                  <div className="grid md:grid-cols-3 gap-2">
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">Tribe:</span>
                      <span className="float-right font-medium capitalize">{
                        formatDisplayText(gameData.subfactions.find(sf => sf.subfaction_id === newCharacter.subfaction)?.subfaction_name) || 'None'
                      }</span>
                    </div>
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">Breed:</span>
                      <span className="float-right font-medium capitalize">{formatDisplayText(newCharacter.breed) || 'None'}</span>
                    </div>
                    <div className="p-3 bg-gray-700 bg-opacity-50 rounded">
                      <span className="text-gray-400">Auspice:</span>
                      <span className="float-right font-medium capitalize">{formatDisplayText(newCharacter.auspice) || 'None'}</span>
                    </div>
                  </div>
                  
                  {newCharacter.innateTreeIds.length > 0 && (
                    <div className="mt-3 p-3 border-t border-gray-700">
                      <p className="text-lg font-semibold mb-2 text-green-400">Innate Power Trees:</p>
                      <div className="flex flex-wrap gap-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          return tree ? (
                            <span
                              key={treeId}
                              className="px-3 py-1 bg-green-600 bg-opacity-20 rounded text-base capitalize"
                            >
                              {tree.tree_name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {(!newCharacter.breed || !newCharacter.auspice) && (
                    <div className="mt-3 p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        Please select both breed and auspice to complete your shifter character.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Wraith Thorn Selection - Final Step */}
              {newCharacter.faction === 'wraith' && newCharacter.shadowArchetype && newCharacter.thornOptions.length > 0 && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Thorn Option</h4>
                  <p className="text-gray-400 mb-2">Choose one thorn option from your Shadow Archetype. Thorns represent specific ways your Shadow can manifest when it dominates your psyche.</p>
                  
                  <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-2">
                    {newCharacter.thornOptions.map(thorn => {
                      const isSelected = newCharacter.selectedThorn === thorn;
                      
                      return (
                        <button
                          key={thorn}
                          onClick={() => {
                            // Remove any existing thorn power from fundamental powers
                            const updatedFundamentalPowers = newCharacter.fundamentalPowers.filter(
                              power => power !== 'Brutal Strike' && power !== 'Hallucination' && 
                                      power !== 'Despair' && power !== 'Silver Tongue' && 
                                      power !== 'Horrid Reality' && power !== 'Smell Fear' && 
                                      power !== 'Taunt' && power !== 'Sense Confidence' && 
                                      power !== 'True Form' && power !== 'Decay' && 
                                      power !== 'Mimic' && power !== 'Wounding Lies' &&
                                      power !== 'Hero\'s Stand' && power !== 'Mass Taunt' &&
                                      power !== 'Brittle Bones' && power !== 'Frenzy Control' &&
                                      power !== 'Cloak Gathering' && power !== 'Meld' &&
                                      power !== 'Tainted Revive' && power !== 'Paralyze' &&
                                      power !== 'Majesty' && power !== 'Tainted Healing Touch' &&
                                      power !== 'Terror'
                            );
                            
                            console.log('Current fundamental powers:', newCharacter.fundamentalPowers);
                            console.log('Updated fundamental powers after filter:', updatedFundamentalPowers);
                            console.log('Adding thorn:', thorn);
                            
                            // Add the selected thorn to fundamental powers
                            setNewCharacter({
                              ...newCharacter,
                              selectedThorn: thorn,
                              fundamentalPowers: [...updatedFundamentalPowers, thorn]
                            });
                          }}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500 bg-opacity-20'
                              : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-lg">{thorn}</h5>
                            {isSelected && (
                              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 mt-1">
                              {thorn === 'Brutal Strike' && 'Enhances physical attacks with shadow energy, making them more devastating and cruel.'}
                              {thorn === 'Hallucination' && 'Creates terrifying illusions in the minds of others, reflecting their deepest fears.'}
                              {thorn === 'Despair' && 'Drains hope and motivation from others, leaving them feeling hopeless and defeated.'}
                              {thorn === 'Silver Tongue' && 'Grants unnaturally persuasive speech that can turn allies against each other through lies and manipulation.'}
                              {thorn === 'Horrid Reality' && 'Forces others to perceive disturbing truths about their reality, shattering their sense of normalcy and security.'}
                              {thorn === 'Smell Fear' && 'Allows you to sense and feed on the fear of others, becoming stronger as they become more terrified.'}
                              {thorn === 'Taunt' && 'Compels others to act recklessly through psychological manipulation and cutting verbal attacks.'}
                              {thorn === 'Sense Confidence' && 'Reveals the hidden insecurities and weaknesses of others, allowing you to exploit their vulnerabilities.'}
                              {thorn === 'True Form' && 'Forces shapeshifters and disguised beings to reveal their authentic nature, stripping away deceptions.'}
                              {thorn === 'Decay' && 'Rapidly deteriorates objects, structures, and even living tissue through accelerated entropy and corruption.'}
                              {thorn === 'Mimic' && 'Perfectly copies the appearance, voice, and mannerisms of others, allowing for impersonation and deception.'}
                              {thorn === 'Wounding Lies' && 'Inflicts psychological damage through carefully crafted falsehoods that cut deeper than any blade, leaving lasting mental scars.'}
                              {thorn === 'Hero\'s Stand' && 'Grants unwavering determination and supernatural resilience when standing alone against overwhelming odds.'}
                              {thorn === 'Mass Taunt' && 'Compels multiple enemies to focus their attacks on you through irresistible provocations and challenges.'}
                              {thorn === 'Brittle Bones' && 'Causes the bones of enemies to become fragile and prone to fracturing with even minor impacts or stress.'}
                              {thorn === 'Frenzy Control' && 'Triggers uncontrollable rage in others, causing them to lash out violently at friend and foe alike.'}
                              {thorn === 'Cloak Gathering' && 'Allows you to hide in shadows and blend with crowds, becoming nearly invisible to observers.'}
                              {thorn === 'Meld' && 'Enables you to phase through solid objects and merge temporarily with walls, floors, or other surfaces.'}
                              {thorn === 'Tainted Revive' && 'Brings the recently dead back to life, but they return corrupted and twisted by shadow influence.'}
                              {thorn === 'Paralyze' && 'Immobilizes targets completely, rendering them unable to move or take actions while remaining conscious.'}
                              {thorn === 'Majesty' && 'Commands absolute authority and respect, compelling others to obey through supernatural presence and charisma.'}
                              {thorn === 'Tainted Healing Touch' && 'Restores health to others but leaves behind spiritual corruption and shadow taint that grows stronger over time.'}
                              {thorn === 'Terror' && 'Instills overwhelming supernatural fear that can paralyze victims and shatter their resolve to resist.'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Thorn:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.selectedThorn ? 'text-orange-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.selectedThorn || 'None'}
                      </span>
                    </div>
                    
                    {!newCharacter.selectedThorn && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select a thorn option to continue.
                      </p>
                    )}
                    
                    {newCharacter.selectedThorn && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-orange-600 text-orange-100 rounded text-sm">
                          {newCharacter.selectedThorn}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-orange-600 bg-opacity-20 rounded-lg border border-orange-500">
                    <p className="text-sm text-orange-300">
                      🌟 <strong>Thorn Power:</strong> Your selected thorn represents a specific manifestation of your Shadow's influence. This ability becomes available when your Shadow dominates or when you voluntarily embrace its darker impulses.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );

        case 2: // Skills & Powers
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-2">Assign Skills & Powers</h3>
              
              <div className="grid md:grid-cols-2 gap-5">
                {/* Skills Section */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">Skills (3 dots to assign)</h4>
                  <div className="space-y-2">
                    {gameData.skills.map(skill => {
                      const currentLevel = newCharacter.skills[skill.skill_id] || 0;
                      const canIncrease = currentLevel < 3 && 
                        Object.values(newCharacter.skills).reduce((sum, lvl) => sum + lvl, 0) < 3;
                      
                      return (
                        <div key={skill.skill_id} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium capitalize">{skill.skill_name}</span>
                            {skill.faction_restrictions && (
                              <span className="text-xs text-yellow-400 ml-2">
                                ({skill.faction_restrictions} only)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (currentLevel > 0) {
                                  setNewCharacter({
                                    ...newCharacter,
                                    skills: {
                                      ...newCharacter.skills,
                                      [skill.skill_id]: currentLevel - 1
                                    }
                                  });
                                }
                              }}
                              className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600"
                              disabled={currentLevel === 0}
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{currentLevel}</span>
                            <button
                              onClick={() => {
                                if (canIncrease) {
                                  setNewCharacter({
                                    ...newCharacter,
                                    skills: {
                                      ...newCharacter.skills,
                                      [skill.skill_id]: currentLevel + 1
                                    }
                                  });
                                }
                              }}
                              className="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600"
                              disabled={!canIncrease}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-sm text-center">
                    Dots Used: {Object.values(newCharacter.skills).reduce((sum, lvl) => sum + lvl, 0)} / 3
                  </div>
                </div>

                {/* Powers Section */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">
                    Innate Powers ({newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? '1 dot' : 
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' ? '0 dots (only first dot of Potence is free)' : '3 dots'} to assign)
                  </h4>
                  
                  {/* Shifter Flexible Power Selection */}
                  {newCharacter.faction === 'shifter' && newCharacter.innateTreeIds.length > 0 ? (
                    <div className="space-y-4">
                      {/* Power Level Distribution Display */}
                      <div className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Power Distribution:</span>
                          <span className="text-sm">
                            L1: {getPowerLevelDistribution(newCharacter.powers).level1}, 
                            L2: {getPowerLevelDistribution(newCharacter.powers).level2}, 
                            L3: {getPowerLevelDistribution(newCharacter.powers).level3}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Level 3 ≤ Level 2 ≤ Level 1 (Current total: {Object.values(newCharacter.powers).reduce(
                            (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                          )} / {newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                              newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                              newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? 1 :
                              newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? 1 :
                              newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? 1 :
                              newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? 1 :
                              newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' ? 0 : 3})
                        </div>
                      </div>

                      {/* Available Powers by Tree */}
                      {newCharacter.innateTreeIds.map(treeId => {
                        const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                        if (!tree) return null;
                        
                        const currentLevels = newCharacter.powers[treeId] || {};
                        const totalDots = Object.values(newCharacter.powers).reduce(
                          (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                        );
                        const maxDots = newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' ? 0 : 3;
                        
                        return (
                          <div key={treeId} className="border border-gray-600 rounded p-3">
                            <h5 className="font-medium capitalize mb-2">{tree.tree_name}</h5>
                            
                            {/* Display all powers from all levels */}
                            <div className="space-y-3">
                              {[1, 2, 3].map(level => {
                                const hasLevel = currentLevels[level];
                                const powerText = level === 1 ? tree.level1_powers : 
                                                level === 2 ? tree.level2_powers : tree.level3_powers;
                                
                                // Check if this power can be added based on level ratios
                                const canAddByRatio = canAddShifterPower(newCharacter.powers, level);
                                const canAdd = !hasLevel && totalDots < maxDots && canAddByRatio;
                                
                                return (
                                  <div key={level} className={`p-2 rounded border ${
                                    hasLevel ? 'border-green-500 bg-green-500 bg-opacity-20' : 
                                    canAdd ? 'border-gray-500' : 'border-gray-700 opacity-50'
                                  }`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium">Level {level}</span>
                                      <button
                                        onClick={() => {
                                          if (hasLevel) {
                                            // Remove power
                                            const newPowers = { ...newCharacter.powers };
                                            delete newPowers[treeId][level];
                                            if (Object.keys(newPowers[treeId]).length === 0) {
                                              delete newPowers[treeId];
                                            }
                                            setNewCharacter({ ...newCharacter, powers: newPowers });
                                          } else if (canAdd) {
                                            // Add power
                                            setNewCharacter({
                                              ...newCharacter,
                                              powers: {
                                                ...newCharacter.powers,
                                                [treeId]: {
                                                  ...currentLevels,
                                                  [level]: true
                                                }
                                              }
                                            });
                                          }
                                        }}
                                        className={`px-3 py-1 rounded text-sm ${
                                          hasLevel
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : canAdd
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-gray-800 cursor-not-allowed text-gray-500'
                                        }`}
                                        disabled={!hasLevel && !canAdd}
                                      >
                                        {hasLevel ? 'Remove' : canAdd ? 'Add' : 'Blocked'}
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-300">
                                      {powerText || 'Powers vary by tree'}
                                    </div>
                                    {!canAdd && !hasLevel && (
                                      <div className="text-xs text-yellow-400 mt-1">
                                        Would violate level ratio constraints
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Standard Power Selection for Non-Shifters */
                    newCharacter.innateTreeIds.length > 0 ? (
                      <div className="space-y-2">
                        {newCharacter.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          if (!tree) return null;
                          
                          const currentLevels = newCharacter.powers[treeId] || {};
                          const totalDots = Object.values(newCharacter.powers).reduce(
                            (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                          );
                        const maxDots = newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' ? 0 : 3;                          return (
                            <div key={treeId} className="border border-gray-600 rounded p-3">
                              <h5 className="font-medium capitalize mb-2">{tree.tree_name}</h5>
                              {[1, 2, 3].map(level => {
                                const hasLevel = currentLevels[level];
                                const canAdd = !hasLevel && totalDots < maxDots;
                                
                                const powerText = level === 1 ? tree.level1_powers : 
                                                level === 2 ? tree.level2_powers : tree.level3_powers;
                                
                                return (
                                  <div key={level} className="border border-gray-600 rounded p-2 mb-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium">Level {level}</span>
                                      <button
                                        onClick={() => {
                                          if (hasLevel) {
                                            const newPowers = { ...newCharacter.powers };
                                            delete newPowers[treeId][level];
                                            if (Object.keys(newPowers[treeId]).length === 0) {
                                              delete newPowers[treeId];
                                            }
                                            setNewCharacter({ ...newCharacter, powers: newPowers });
                                          } else if (canAdd) {
                                            setNewCharacter({
                                              ...newCharacter,
                                              powers: {
                                                ...newCharacter.powers,
                                                [treeId]: {
                                                  ...currentLevels,
                                                  [level]: true
                                                }
                                              }
                                            });
                                          }
                                        }}
                                        className={`px-3 py-1 rounded text-sm ${
                                          hasLevel
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : canAdd
                                            ? 'bg-gray-700 hover:bg-gray-600'
                                            : 'bg-gray-800 cursor-not-allowed'
                                        }`}
                                        disabled={!hasLevel && !canAdd}
                                      >
                                        {hasLevel ? 'Remove' : 'Add'}
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-300">
                                      {powerText || 'Powers vary by tree'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400">No innate power trees available for this subfaction.</p>
                    )
                  )}
                  
                  <div className="mt-3 text-sm text-center">
                    Dots Used: {Object.values(newCharacter.powers).reduce(
                      (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                    )} / {newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' ? 0 : 3}
                  </div>
                </div>
              </div>
            </div>
          );

        case 3: // Freebie Points / XP Summary
          // For humans, show freebie points interface
          if (newCharacter.faction === 'human') {
            const calculateFreebieSpent = () => {
              let spent = 0;
              
              // Add merit costs
              Object.entries(newCharacter.merits).forEach(([meritId, value]) => {
                const cost = calculateXPCost(newCharacter, 'merit', meritId);
                spent += cost;
              });
              
              // Add any additional advancement costs
              // Skills beyond starting 3
              const skillDots = Object.values(newCharacter.skills).reduce((sum, lvl) => sum + lvl, 0);
              if (skillDots > 3) {
                // Calculate cost for extra skill dots
                // This would need more complex logic based on which skills were increased
              }
              
              return spent;
            };
            
            const freebieSpent = calculateFreebieSpent();
            const freebieRemaining = newCharacter.freebieXP - freebieSpent;
            
            return (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-2">Character Creation</h3>

                {/* Merits */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">Available Merits</h4>
                  {newCharacter.faction === 'human' && newCharacter.checkInCount === 0 && (
                    <div className="mb-2 p-3 bg-blue-600 bg-opacity-20 rounded-lg border border-blue-500">
                      <p className="text-blue-300 text-sm">
                        💡 <strong>Humans get one free merit during character creation.</strong> Select any merit below at no cost. You can change your selection by removing and selecting a different merit.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {getAvailableMerits(newCharacter).map(merit => {
                      const hasMerit = newCharacter.merits[merit.merit_id];
                      const cost = calculateXPCost(newCharacter, 'merit', merit.merit_id);
                      const canAfford = freebieRemaining >= cost;
                      
                      // For humans during character creation, handle free merit selection
                      const isHuman = newCharacter.faction === 'human';
                      const isCharacterCreation = (newCharacter.checkInCount || 0) === 0;
                      const meritKeys = Object.keys(newCharacter.merits || {});
                      const hasAnyMeritSelected = meritKeys.length > 0;
                      
                      // During character creation for humans:
                      // - If no merits selected yet: don't show XP costs, all available
                      // - If one merit selected: grey out all others, allow switching
                      const showFreeMeritUI = isHuman && isCharacterCreation;
                      const shouldGreyOut = showFreeMeritUI && hasAnyMeritSelected && !hasMerit;
                      const isDisabledByFreeMerit = shouldGreyOut;
                      
                      return (
                        <div key={merit.merit_id} className={`p-3 rounded border ${
                          hasMerit 
                            ? 'border-green-500 bg-green-500 bg-opacity-20' 
                            : shouldGreyOut 
                              ? 'border-gray-600 opacity-50' 
                              : 'border-gray-600'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">
                                {merit.merit_name}
                                {merit.can_purchase_multiple === 'true' && hasMerit && (
                                  <span className="ml-2 text-sm text-blue-400">(Currently: {hasMerit})</span>
                                )}
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">{merit.description}</p>
                              {merit.special_notes && (
                                <p className="text-xs text-yellow-400 mt-1">{merit.special_notes}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              {/* For humans during character creation, don't show XP cost since first merit is free */}
                              {!showFreeMeritUI && (
                                <div className="text-sm font-medium">
                                  {cost === 0 ? 'FREE' : `${cost} XP`}
                                </div>
                              )}
                              <div className="flex gap-1 mt-2">
                                {merit.can_purchase_multiple === 'true' ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        if ((canAfford || showFreeMeritUI) && !isDisabledByFreeMerit) {
                                          setNewCharacter({
                                            ...newCharacter,
                                            merits: {
                                              ...newCharacter.merits,
                                              [merit.merit_id]: (newCharacter.merits[merit.merit_id] || 0) + 1
                                            }
                                          });
                                        }
                                      }}
                                      className={`px-2 py-1 rounded text-sm ${
                                        (canAfford || showFreeMeritUI) && !isDisabledByFreeMerit
                                          ? 'bg-blue-600 hover:bg-blue-700'
                                          : 'bg-gray-700 cursor-not-allowed'
                                      }`}
                                      disabled={!(canAfford || showFreeMeritUI) || isDisabledByFreeMerit}
                                    >
                                      +
                                    </button>
                                    {hasMerit && (
                                      <button
                                        onClick={() => {
                                          const newMerits = { ...newCharacter.merits };
                                          if (newMerits[merit.merit_id] > 1) {
                                            newMerits[merit.merit_id] -= 1;
                                          } else {
                                            delete newMerits[merit.merit_id];
                                          }
                                          setNewCharacter({ ...newCharacter, merits: newMerits });
                                        }}
                                        className="px-2 py-1 rounded text-sm bg-red-600 hover:bg-red-700"
                                      >
                                        -
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (hasMerit) {
                                        const newMerits = { ...newCharacter.merits };
                                        delete newMerits[merit.merit_id];
                                        setNewCharacter({ ...newCharacter, merits: newMerits });
                                      } else if ((canAfford || showFreeMeritUI) && !isDisabledByFreeMerit) {
                                        setNewCharacter({
                                          ...newCharacter,
                                          merits: {
                                            ...newCharacter.merits,
                                            [merit.merit_id]: true
                                          }
                                        });
                                      }
                                    }}
                                    className={`px-3 py-1 rounded text-sm ${
                                      hasMerit
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : (canAfford || showFreeMeritUI) && !isDisabledByFreeMerit
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : 'bg-gray-700 cursor-not-allowed'
                                    }`}
                                    disabled={!hasMerit && (!(canAfford || showFreeMeritUI) || isDisabledByFreeMerit)}
                                  >
                                    {hasMerit ? 'Remove' : 'Add'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          } else {
            // For non-human factions, show XP summary
            return (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-2">Character Complete</h3>
                
                <div className={`${themeClasses.card} p-5 text-center`}>
                  <div className="mb-5">
                    <h4 className="text-2xl font-bold text-green-400 mb-2">🎉 Character Creation Complete!</h4>
                    <p className="text-lg text-gray-300">Your character has been successfully created with all starting abilities.</p>
                  </div>
                  
                  <div className={`${themeClasses.card} p-3 bg-blue-500 bg-opacity-20 border border-blue-400`}>
                    <h5 className="text-xl font-bold text-blue-300 mb-2">Starting Experience Points</h5>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-blue-400">27 XP</span>
                      <p className="text-blue-200 mt-2">
                        Your new character starts with 27 free experience points that can be spent in the Character Manager after creation.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-5 text-gray-400">
                    <p className="mb-2">Use your starting XP to:</p>
                    <ul className="text-left max-w-md mx-auto space-y-1">
                      <li>• Increase skills beyond starting levels</li>
                      <li>• Purchase additional power dots</li>
                      <li>• Buy merits and advantages</li>
                      <li>• Enhance your character's capabilities</li>
                    </ul>
                  </div>
                  
                  <div className="mt-5 p-3 bg-yellow-600 bg-opacity-20 rounded-lg border border-yellow-500">
                    <p className="text-yellow-300 text-sm">
                      💡 <strong>Tip:</strong> You can access the Character Manager after creating your character to spend your 27 starting XP and continue developing your character.
                    </p>
                  </div>
                </div>
              </div>
            );
          }

        case 4: // Review & Confirm
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-2">Review Character</h3>
              
              {/* Editable Character Information */}
              <div className={`${themeClasses.card} p-3`}>
                <h4 className="font-bold mb-2">Character Information</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <label className={themeClasses.label}>Character Name</label>
                    <input
                      type="text"
                      value={newCharacter.name || ''}
                      onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                      className={themeClasses.input}
                      placeholder="Enter character name..."
                    />
                  </div>
                  <div>
                    <label className={themeClasses.label}>Player Name</label>
                    <input
                      type="text"
                      value={newCharacter.player || ''}
                      onChange={(e) => setNewCharacter(prev => ({ ...prev, player: e.target.value }))}
                      className={themeClasses.input}
                      placeholder="Enter player name..."
                    />
                  </div>
                </div>
                {(!newCharacter.name || !newCharacter.player) && (
                  <div className="mt-3 p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                    <div className="text-yellow-300 text-sm">
                      💡 <strong>Important:</strong> {!newCharacter.name && 'Character name'}{!newCharacter.name && !newCharacter.player && ' and '}{!newCharacter.player && 'Player name'} {(!newCharacter.name || !newCharacter.player) ? 'should be filled in before creating the character' : ''}.
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-5">
                {/* Basic Info Summary */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">Character Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span>{newCharacter.name || 'Unnamed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Player:</span>
                      <span>{newCharacter.player || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Faction:</span>
                      <span className="capitalize">{formatDisplayText(newCharacter.faction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subfaction:</span>
                      <span className="capitalize">{formatDisplayText(newCharacter.subfaction)}</span>
                    </div>
                    {newCharacter.faction === 'wraith' && newCharacter.guild && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Guild:</span>
                        <span className="capitalize">{formatDisplayText(newCharacter.guild)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Health:</span>
                      <span>{newCharacter.stats.health}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Willpower:</span>
                      <span>{newCharacter.stats.willpower}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{newCharacter.stats.energyType}:</span>
                      <span>{newCharacter.stats.energy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{newCharacter.stats.virtueType}:</span>
                      <span>{newCharacter.stats.virtue}</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">Skills</h4>
                  {Object.entries(newCharacter.skills).length > 0 ? (
                    <div className="space-y-1 text-sm">
                      {Object.entries(newCharacter.skills).map(([skillId, level]) => {
                        const skill = gameData.skills.find(s => s.skill_id === skillId);
                        return (
                          <div key={skillId} className="flex justify-between">
                            <span className="capitalize">{skill?.skill_name || skillId}:</span>
                            <span>{level}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No skills assigned</p>
                  )}
                </div>

                {/* Powers */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">Powers</h4>
                  {Object.entries(newCharacter.powers).length > 0 ? (
                    <div className="space-y-2 text-sm">
                      {Object.entries(newCharacter.powers).map(([treeId, levels]) => {
                        const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                        return (
                          <div key={treeId}>
                            <span className="capitalize font-medium">{tree?.tree_name || treeId}:</span>
                            <span className="ml-2">Levels {Object.keys(levels).join(', ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No powers assigned</p>
                  )}
                </div>

                {/* Innate Trees */}
                {(newCharacter.innateTreeIds || []).length > 0 && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Innate Power Trees</h4>
                    <div className="space-y-1 text-sm">
                      {(newCharacter.innateTreeIds || []).map(treeId => {
                        const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                        return (
                          <div key={treeId} className="flex justify-between">
                            <span className="capitalize">{tree?.tree_name || treeId}</span>
                            <span className="text-green-400">✓</span>
                          </div>
                        );
                      })}
                    </div>
                    {newCharacter.faction === 'wraith' && (
                      <p className="text-xs text-blue-400 mt-2">Custom selected for Wraith</p>
                    )}
                    {newCharacter.faction === 'vampire' && newCharacter.subfaction === 'caitiff' && (
                      <p className="text-xs text-red-400 mt-2">Custom selected for Caitiff</p>
                    )}
                    {newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' && (
                      <p className="text-xs text-purple-400 mt-2">Custom selected for Sorcerer</p>
                    )}
                  </div>
                )}

                {/* Shadow Archetype for Wraiths */}
                {newCharacter.faction === 'wraith' && newCharacter.shadowArchetype && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Shadow Archetype</h4>
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="capitalize">{gameData.shadowArchetypes.find(a => a.archetype_id === newCharacter.shadowArchetype)?.archetype_name || newCharacter.shadowArchetype}</span>
                        <span className="text-red-400">✓</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <strong>Selected Thorn:</strong> {newCharacter.selectedThorn || 'None'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fellowship for Sorcerers */}
                {newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Fellowship</h4>
                    {newCharacter.fellowship ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="capitalize">{gameData.powerTrees.find(t => t.tree_id === newCharacter.fellowship)?.tree_name || newCharacter.fellowship}</span>
                          <span className="text-blue-400">✓</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No Fellowship (Independent)</p>
                    )}
                  </div>
                )}

                {/* Faithful Bounty Tree */}
                {newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Divine Bounty</h4>
                    {newCharacter.innateTreeIds.length > 0 ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="capitalize">{gameData.powerTrees.find(t => t.tree_id === newCharacter.innateTreeIds[0])?.tree_name || newCharacter.innateTreeIds[0]}</span>
                          <span className="text-yellow-400">✓</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Your only power tree - divine covenant restriction</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No Bounty Selected</p>
                    )}
                  </div>
                )}

                {/* Drone Tree */}
                {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Weaver Tree</h4>
                    {newCharacter.innateTreeIds.length > 0 ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="capitalize">{gameData.powerTrees.find(t => t.tree_id === newCharacter.innateTreeIds[0])?.tree_name || newCharacter.innateTreeIds[0]}</span>
                          <span className="text-cyan-400">✓</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Your only power tree - Pattern Web binding restriction</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No Tree Selected</p>
                    )}
                  </div>
                )}

                {/* Fomori Tree */}
                {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Bane Tree</h4>
                    {newCharacter.innateTreeIds.length > 0 ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="capitalize">{gameData.powerTrees.find(t => t.tree_id === newCharacter.innateTreeIds[0])?.tree_name || newCharacter.innateTreeIds[0]}</span>
                          <span className="text-red-400">✓</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Your only power tree - Bane possession restriction</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No Tree Selected</p>
                    )}
                  </div>
                )}

                {/* Gorgon Tree */}
                {newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Gorgon Tree</h4>
                    {newCharacter.innateTreeIds.length > 0 ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="capitalize">{gameData.powerTrees.find(t => t.tree_id === newCharacter.innateTreeIds[0])?.tree_name || newCharacter.innateTreeIds[0]}</span>
                          <span className="text-purple-400">✓</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Your only power tree - Dream reality restriction</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No Tree Selected</p>
                    )}
                  </div>
                )}

                {/* Commoner Talent Tree */}
                {newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Talent Tree</h4>
                    {newCharacter.innateTreeIds.length > 0 ? (
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="capitalize">{gameData.powerTrees.find(t => t.tree_id === newCharacter.innateTreeIds[0])?.tree_name || newCharacter.innateTreeIds[0]}</span>
                          <span className="text-green-400">✓</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Your innate talent - can learn other talents during advancement</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No Talent Selected</p>
                    )}
                  </div>
                )}

                {/* Merits */}
                {Object.entries(newCharacter.merits).length > 0 && (
                  <div className={`${themeClasses.card} p-3 md:col-span-2`}>
                    <h4 className="font-bold mb-2">Merits</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(newCharacter.merits).map(([meritId, value]) => {
                        const merit = gameData.merits.find(m => m.merit_id === meritId);
                        const isStackable = merit?.can_purchase_multiple === 'true';
                        const displayText = isStackable && value > 1 ? `${merit?.merit_name || meritId} (x${value})` : (merit?.merit_name || meritId);
                        return (
                          <span key={meritId} className="px-3 py-1 bg-blue-600 rounded text-sm">
                            {displayText}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const finalCharacter = {
                      ...newCharacter,
                      id: Date.now() + Math.random(),
                      created: new Date().toISOString(),
                      lastModified: new Date().toISOString()
                    };
                    setCharacters([...characters, finalCharacter]);
                    setCurrentMode('menu');
                    setNewCharacter(null);
                    setCreationStep(0);
                  }}
                  className={`${themeClasses.button} px-8 py-3 text-lg`}
                  disabled={!newCharacter.name}
                >
                  Create Character
                </button>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className={`min-h-screen ${themeClasses.base}`}>
        <div className="container mx-auto p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Character Creation</h2>
            <button
              onClick={() => {
                setCurrentMode('menu');
                setNewCharacter(null);
                setCreationStep(0);
              }}
              className={themeClasses.danger}
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {['Basic Info', 'Subfaction', 'Skills & Powers', 'Freebie Points', 'Review'].map((step, index) => (
                <div
                  key={index}
                  className={`text-sm ${
                    index <= creationStep ? 'text-blue-400' : 'text-gray-500'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((creationStep + 1) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className={`${themeClasses.card} p-5`}>
            {renderCreationStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-5">
            <button
              onClick={() => setCreationStep(Math.max(0, creationStep - 1))}
              className={themeClasses.button}
              disabled={creationStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2 inline" />
              Previous
            </button>
            
            {creationStep < 4 && (
              <button
                onClick={() => setCreationStep(Math.min(4, creationStep + 1))}
                className={themeClasses.button}
                disabled={
                  (creationStep === 0 && !newCharacter.faction) ||
                  (creationStep === 1 && newCharacter.faction !== 'wraith' && newCharacter.faction !== 'human' && !newCharacter.subfaction) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction !== 'sorcerer' && newCharacter.subfaction !== 'faithful' && newCharacter.subfaction !== 'claimed_drone' && newCharacter.subfaction !== 'claimed_fomori' && newCharacter.subfaction !== 'claimed_gorgon' && newCharacter.subfaction !== 'commoner' && !newCharacter.subfaction) ||
                  (creationStep === 1 && newCharacter.faction === 'wraith' && (newCharacter.innateTreeIds.length !== 3 || !newCharacter.shadowArchetype || !newCharacter.selectedThorn || !newCharacter.subfaction || !newCharacter.guild)) ||
                  (creationStep === 1 && newCharacter.faction === 'vampire' && newCharacter.subfaction === 'caitiff' && newCharacter.innateTreeIds.length !== 3) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' && newCharacter.innateTreeIds.length !== 2) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' && newCharacter.innateTreeIds.length !== 3) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' && newCharacter.innateTreeIds.length !== 1)
                }
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2 inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Character Management
  const renderCharacterManagement = () => (
    <div className={`min-h-screen ${themeClasses.base}`}>
      <div className="container mx-auto p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-3xl font-bold">Character Management</h2>
          <div className="flex items-center space-x-4">
            {characters.length > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Characters</div>
                <div className="text-lg font-bold">{characters.length}</div>
              </div>
            )}
            <button
              onClick={() => setCurrentMode('menu')}
              className={themeClasses.button}
            >
              <Home className="w-4 h-4 mr-2 inline" />
              Back to Menu
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className={`${themeClasses.card} p-3 mb-5`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className={themeClasses.label}>Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={themeClasses.input + ' pl-10'}
                  placeholder="Search characters..."
                />
              </div>
            </div>
            <div>
              <label className={themeClasses.label}>Filter by Faction</label>
              <select
                value={filterFaction}
                onChange={(e) => setFilterFaction(e.target.value)}
                className={themeClasses.input}
              >
                <option value="">All Factions</option>
                {gameData.factions.map(faction => (
                  <option key={faction.faction_id} value={faction.faction_id}>
                    {faction.faction_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={themeClasses.label}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={themeClasses.input}
              >
                <option value="name">Name</option>
                <option value="faction">Faction</option>
                <option value="xp">Total XP</option>
                <option value="created">Date Created</option>
                <option value="modified">Last Modified</option>
              </select>
            </div>

          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedCharacters.map((character) => (
            <div key={character.id} className={`${themeClasses.card} p-5 hover:shadow-lg transition-all`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold">{character.name || 'Unnamed Character'}</h3>
                  <p className={themeClasses.text}>{character.player}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setCurrentCharacterIndex(characters.indexOf(character));
                      setCurrentMode('character');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => exportCharacter(character, exportFormat)}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCharacter(character.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Faction:</span>
                  <span className="capitalize">{formatDisplayText(character.faction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subfaction:</span>
                  <span className="capitalize">{formatDisplayText(character.subfaction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total XP:</span>
                  <span>{character.totalXP}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-ins:</span>
                  <span>{character.checkInCount}</span>
                </div>
              </div>

              {character.validationErrors?.length > 0 && (
                <div className="mt-3 p-2 bg-red-900 rounded text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {character.validationErrors.length} validation error(s)
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAndSortedCharacters.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-2">No Characters Found</h3>
            <p className={themeClasses.text}>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  // Character View/Edit
  const renderCharacterView = () => {
    const character = characters[currentCharacterIndex];
    if (!character) return null;

    return (
      <div className={`min-h-screen ${themeClasses.base}`}>
        <div className="container mx-auto p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-3xl font-bold">{character.name}</h2>
              <p className={themeClasses.text}>{character.player} • {character.faction} {character.subfaction}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Available XP</div>
                <div className="text-lg font-bold">{character.totalXP - character.xpSpent}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Total XP</div>
                <div className="text-lg font-bold">{character.totalXP}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentMode('management')}
                  className={themeClasses.button}
                >
                  <ChevronLeft className="w-4 h-4 mr-2 inline" />
                  Back
                </button>
              <button
                onClick={() => exportCharacter(character, exportFormat)}
                className={themeClasses.button}
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Export
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Perform check-in
                    const xpEntry = {
                      timestamp: new Date().toISOString(),
                      type: 'gain',
                      amount: 3,
                      reason: 'Regular check-in',
                      previousTotal: character.totalXP,
                      newTotal: character.totalXP + 3
                    };
                    
                    const updated = {
                      ...character,
                      checkInCount: character.checkInCount + 1,
                      totalXP: character.totalXP + 3, // Base 3 XP per check-in
                      xpHistory: [...(character.xpHistory || []), xpEntry],
                      lastModified: new Date().toISOString()
                    };
                    const newCharacters = [...characters];
                    newCharacters[currentCharacterIndex] = updated;
                    setCharacters(newCharacters);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                >
                  <CheckCircle className="w-4 h-4 mr-2 inline" />
                  Check In (+3 XP)
                </button>
                
                {/* Check-in XP Activities Dropdown */}
                <div className="relative checkin-dropdown">
                  <button
                    onClick={() => setShowCheckInDropdown(!showCheckInDropdown)}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                    type="button"
                  >
                    📋
                  </button>
                  
                  {showCheckInDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                      <div className="p-3">
                        <h4 className="font-bold text-sm mb-2 text-green-400">Check-in + Activities</h4>
                        <p className="text-xs text-gray-400 mb-2">Base check-in (3 XP) + selected activities</p>
                        
                        <div className="space-y-2">
                          {commonXpActivities.map((activity, index) => (
                            <label key={index} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedCheckInActivities.some(sel => sel.name === activity.name)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCheckInActivities(prev => [...prev, activity]);
                                  } else {
                                    setSelectedCheckInActivities(prev => prev.filter(sel => sel.name !== activity.name));
                                  }
                                }}
                                className="text-green-500"
                              />
                              <span className="flex-1 text-sm">{activity.name}</span>
                              <span className="text-xs text-green-400">{activity.xp} XP</span>
                            </label>
                          ))}
                        </div>
                        
                        <div className="mt-3 pt-2 border-t border-gray-600">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Total XP:</span>
                            <span className="text-sm text-green-400">
                              {3 + selectedCheckInActivities.reduce((total, activity) => total + activity.xp, 0)} XP
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mb-2">
                            Base check-in (3) + Activities ({selectedCheckInActivities.reduce((total, activity) => total + activity.xp, 0)})
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const additionalXp = selectedCheckInActivities.reduce((total, activity) => total + activity.xp, 0);
                                const totalXp = 3 + additionalXp;
                                
                                const activities = selectedCheckInActivities.length > 0 
                                  ? ' + ' + selectedCheckInActivities.map(activity => `${activity.name} (${activity.xp} XP)`).join(', ')
                                  : '';
                                
                                const xpEntry = {
                                  timestamp: new Date().toISOString(),
                                  type: 'gain',
                                  amount: totalXp,
                                  reason: `Check-in (3 XP)${activities}`,
                                  previousTotal: character.totalXP,
                                  newTotal: character.totalXP + totalXp
                                };
                                
                                const updated = {
                                  ...character,
                                  checkInCount: character.checkInCount + 1,
                                  totalXP: character.totalXP + totalXp,
                                  xpHistory: [...(character.xpHistory || []), xpEntry],
                                  lastModified: new Date().toISOString()
                                };
                                
                                const newCharacters = [...characters];
                                newCharacters[currentCharacterIndex] = updated;
                                setCharacters(newCharacters);
                                
                                setSelectedCheckInActivities([]);
                                setShowCheckInDropdown(false);
                              }}
                              className="flex-1 px-2 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white"
                            >
                              Check In
                            </button>
                            
                            <button
                              onClick={() => setSelectedCheckInActivities([])}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-5 border-b border-gray-700">
            {['overview', 'advancement', 'powers', 'lore', 'history', 'xp-tracking', 'notes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'xp-tracking' ? 'XP Tracking' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Character Information Editor */}
              <div className={`${themeClasses.card} p-5 md:col-span-2 lg:col-span-3`}>
                <h3 className="text-xl font-bold mb-2">Character Information</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <label className={themeClasses.label}>Character Name</label>
                    <input
                      type="text"
                      value={character.name || ''}
                      onChange={(e) => {
                        const updated = { ...character, name: e.target.value, lastModified: new Date().toISOString() };
                        const newCharacters = [...characters];
                        newCharacters[currentCharacterIndex] = updated;
                        setCharacters(newCharacters);
                      }}
                      className={themeClasses.input}
                      placeholder="Enter character name..."
                    />
                  </div>
                  <div>
                    <label className={themeClasses.label}>Player Name</label>
                    <input
                      type="text"
                      value={character.player || ''}
                      onChange={(e) => {
                        const updated = { ...character, player: e.target.value, lastModified: new Date().toISOString() };
                        const newCharacters = [...characters];
                        newCharacters[currentCharacterIndex] = updated;
                        setCharacters(newCharacters);
                      }}
                      className={themeClasses.input}
                      placeholder="Enter player name..."
                    />
                  </div>
                </div>
                {(!character.name || !character.player) && (
                  <div className="mt-3 p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                    <div className="text-yellow-300 text-sm">
                      💡 <strong>Missing Information:</strong> {!character.name && 'Character name'}{!character.name && !character.player && ' and '}{!character.player && 'Player name'} {(!character.name || !character.player) ? 'should be filled in' : ''} for a complete character sheet.
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Health</span>
                    <span className="font-medium">{character.stats.health} / {character.stats.maxHealth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Willpower</span>
                    <span className="font-medium">{character.stats.willpower}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{character.stats.energyType}</span>
                    <span className="font-medium">{character.stats.energy} / {character.stats.maxEnergy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{character.stats.virtueType}</span>
                    <span className="font-medium">{character.stats.virtue}</span>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Experience</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Total XP</span>
                    <span className="font-medium text-green-400">{character.totalXP}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>XP Spent</span>
                    <span className="font-medium">{character.xpSpent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Check-ins</span>
                    <span className="font-medium">{character.checkInCount}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Skills</h3>
                <div className="space-y-2">
                  {Object.entries(character.skills).map(([skillId, level]) => {
                    const skill = gameData.skills.find(s => s.skill_id === skillId);
                    return (
                      <div key={skillId} className="flex justify-between items-center">
                        <span className="capitalize">{skill?.skill_name || skillId}:</span>
                        <div className="flex">
                          {[1, 2, 3].map(dot => (
                            <div
                              key={dot}
                              className={`w-3 h-3 rounded-full ml-1 ${
                                dot <= level ? 'bg-blue-500' : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(character.skills).length === 0 && (
                    <p className="text-gray-400 text-sm">No skills learned</p>
                  )}
                </div>
              </div>

              {/* Merits */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Merits</h3>
                <div className="space-y-2">
                  {Object.entries(character.merits).map(([meritId, value]) => {
                    const merit = gameData.merits.find(m => m.merit_id === meritId);
                    const isStackable = merit?.can_purchase_multiple === 'true';
                    const displayText = isStackable && value > 1 ? `${merit?.merit_name || meritId} (x${value})` : (merit?.merit_name || meritId);
                    return (
                      <div key={meritId} className="p-2 bg-blue-600 bg-opacity-20 rounded">
                        <div className="font-medium">{displayText}</div>
                        <div className="text-xs text-gray-400">{merit?.description}</div>
                      </div>
                    );
                  })}
                  {Object.keys(character.merits).length === 0 && (
                    <p className="text-gray-400 text-sm">No merits</p>
                  )}
                </div>
              </div>

              {/* Fundamental Powers */}
              {character.fundamentalPowers.length > 0 && (
                <div className={`${themeClasses.card} p-3`}>
                  <h3 className="text-xl font-bold mb-2">Fundamental Powers</h3>
                  <div className="flex flex-wrap gap-2">
                    {character.fundamentalPowers.map(power => (
                      <span key={power} className="px-3 py-1 bg-purple-600 rounded text-sm">
                        {power}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advancement' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Enhanced XP Display */}
              <div className={`${themeClasses.card} p-3 md:col-span-2 lg:col-span-3`}>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-bold text-white">Experience Points</h3>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-white">{character.totalXP}</div>
                      <div className="text-blue-200 text-sm">Available XP</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">{character.totalXP + character.xpSpent}</div>
                      <div className="text-blue-200 text-sm">Total Earned</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-red-200">{character.xpSpent}</div>
                      <div className="text-blue-200 text-sm">XP Spent</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-yellow-200">{character.checkInCount}</div>
                      <div className="text-blue-200 text-sm">Check-ins</div>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-200">{character.checkInCount * 3}</div>
                      <div className="text-blue-200 text-sm">From Check-ins</div>
                    </div>
                  </div>
                  {character.totalXP < 10 && character.totalXP > 0 && (
                    <div className="mt-3 p-3 bg-yellow-600 bg-opacity-30 rounded-lg">
                      <div className="text-yellow-200 text-sm">
                        💡 <strong>Tip:</strong> You have limited XP. Consider your advancement priorities carefully!
                      </div>
                    </div>
                  )}
                  {character.totalXP === 0 && (
                    <div className="mt-3 p-3 bg-red-600 bg-opacity-30 rounded-lg">
                      <div className="text-red-200 text-sm">
                        ⚠️ <strong>No XP Available:</strong> Check in to earn more experience points or use the XP Tracking tab to add XP.
                      </div>
                    </div>
                  )}
                  {character.totalXP >= 50 && (
                    <div className="mt-3 p-3 bg-green-600 bg-opacity-30 rounded-lg">
                      <div className="text-green-200 text-sm">
                        🎉 <strong>XP Rich:</strong> You have plenty of experience to advance your character significantly!
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Skill Advancement - Column 1 */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Advance Skills</h3>
                <div className="space-y-3">
                  {gameData.skills.map(skill => {
                    const currentLevel = character.skills[skill.skill_id] || 0;
                    const canAdvance = currentLevel < 3;
                    const nextLevel = currentLevel + 1;
                    const cost = canAdvance ? calculateXPCost(character, 'skill', skill.skill_id, nextLevel) : 0;
                    const canAfford = character.totalXP >= cost;
                    const canAdvanceNow = canAdvance && canAfford && canAdvanceAtCheckIn(character, 'skill', skill.skill_id);
                    
                    return (
                      <div 
                        key={skill.skill_id} 
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          currentLevel > 0
                            ? 'border-green-500 bg-green-500 bg-opacity-20 shadow-lg'
                            : canAdvanceNow
                              ? 'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md hover:scale-[1.02]'
                              : canAfford
                                ? 'border-yellow-500 bg-yellow-500 bg-opacity-10 hover:border-yellow-400'
                                : 'border-gray-700 bg-gray-800 bg-opacity-50 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h4 className="font-bold text-lg capitalize">{skill.skill_name}</h4>
                              {currentLevel > 0 && (
                                <div className="ml-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {skill.faction_restrictions && (
                              <div className="mb-2">
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-600 text-yellow-100">
                                  Restricted to: {skill.faction_restrictions}
                                </span>
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-300 mb-2">{skill.description}</p>
                            
                            <div className="flex items-center mb-2">
                              <span className="text-sm text-gray-400 mr-2">Level:</span>
                              <div className="flex">
                                {[1, 2, 3].map(dot => (
                                  <div
                                    key={dot}
                                    className={`w-4 h-4 rounded-full mr-1 ${
                                      dot <= currentLevel ? 'bg-blue-500' : 'bg-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-sm font-medium">{currentLevel}/3</span>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  !canAdvance ? 'text-gray-400' : 
                                  canAfford ? 'text-blue-400' : 'text-red-400'
                                }`}>
                                  {!canAdvance ? 'Max Level' : `Next Level: ${cost === 0 ? 'FREE' : `${cost} XP`}`}
                                </span>
                                {!canAfford && cost > 0 && canAdvance && (
                                  <span className="ml-2 text-xs text-red-400">
                                    (Need {cost - character.totalXP} more XP)
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                {currentLevel > 0 && (
                                  <button
                                    onClick={() => {
                                      const updated = reduceCharacter(character, {
                                        type: 'skill',
                                        itemId: skill.skill_id,
                                        level: currentLevel - 1
                                      });
                                      const newCharacters = [...characters];
                                      newCharacters[currentCharacterIndex] = updated;
                                      setCharacters(newCharacters);
                                    }}
                                    className="px-3 py-2 rounded font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Remove Level (+{calculateReductionRefund(character, 'skill', skill.skill_id, currentLevel)} XP)
                                  </button>
                                )}
                                {canAdvance && (
                                  <button
                                    onClick={() => {
                                      const updated = advanceCharacter(character, {
                                        type: 'skill',
                                        itemId: skill.skill_id,
                                        level: nextLevel,
                                        cost
                                      });
                                      const newCharacters = [...characters];
                                      newCharacters[currentCharacterIndex] = updated;
                                      setCharacters(newCharacters);
                                    }}
                                    className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                      canAdvanceNow
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                        : canAfford
                                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'

                                          ``
                                          : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                    }`}
                                    disabled={!canAdvanceNow}
                                  >
                                    {canAdvanceNow ? 'Advance' : canAfford ? 'Limit Reached' : 'Cannot Afford'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stat Advancement - Column 2 */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Advance Statistics</h3>
                <div className="space-y-3">
                  {/* Energy */}
                  <div 
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-bold text-lg">{character.stats.energyType}</h4>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2">Your character's supernatural energy pool</p>
                        
                        <div className="flex items-center mb-2">
                          <span className="text-sm text-gray-400 mr-2">Current:</span>
                          <span className="text-lg font-bold text-blue-400">{character.stats.energy}</span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-blue-400">
                              Next Level: 3 XP
                            </span>
                            {character.totalXP < 3 && (
                              <span className="ml-2 text-xs text-red-400">
                                (Need {3 - character.totalXP} more XP)
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {character.stats.energy > 1 && (
                              <button
                                onClick={() => {
                                  const updated = reduceCharacter(character, {
                                    type: 'energy',
                                    itemId: 'energy'
                                  });
                                  const newCharacters = [...characters];
                                  newCharacters[currentCharacterIndex] = updated;
                                  setCharacters(newCharacters);
                                }}
                                className="px-3 py-2 rounded font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
                              >
                                Remove Level (+3 XP)
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const cost = calculateXPCost(character, 'energy');
                                if (character.totalXP >= cost && canAdvanceAtCheckIn(character, 'energy', 'energy')) {
                                  const updated = advanceCharacter(character, {
                                    type: 'energy',
                                    itemId: 'energy',
                                    cost
                                  });
                                  const newCharacters = [...characters];
                                  newCharacters[currentCharacterIndex] = updated;
                                  setCharacters(newCharacters);
                                }
                              }}
                              className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                character.totalXP >= 3 && canAdvanceAtCheckIn(character, 'energy', 'energy')
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                  : 'bg-gray-700 cursor-not-allowed text-gray-400'
                              }`}
                              disabled={character.totalXP < 3 || !canAdvanceAtCheckIn(character, 'energy', 'energy')}
                            >
                              {character.totalXP >= 3 && canAdvanceAtCheckIn(character, 'energy', 'energy') ? 'Advance' : 'Cannot Afford'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Willpower */}
                  <div 
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-bold text-lg">Willpower</h4>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2">Your character's mental resilience and determination</p>
                        
                        <div className="flex items-center mb-2">
                          <span className="text-sm text-gray-400 mr-2">Current:</span>
                          <span className="text-lg font-bold text-blue-400">{character.stats.willpower}</span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-blue-400">
                              Next Level: 6 XP
                            </span>
                            {character.totalXP < 6 && (
                              <span className="ml-2 text-xs text-red-400">
                                (Need {6 - character.totalXP} more XP)
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {character.stats.willpower > 1 && (
                              <button
                                onClick={() => {
                                  const updated = reduceCharacter(character, {
                                    type: 'willpower',
                                    itemId: 'willpower'
                                  });
                                  const newCharacters = [...characters];
                                  newCharacters[currentCharacterIndex] = updated;
                                  setCharacters(newCharacters);
                                }}
                                className="px-3 py-2 rounded font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
                              >
                                Remove Level (+6 XP)
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const cost = calculateXPCost(character, 'willpower');
                                if (character.totalXP >= cost && canAdvanceAtCheckIn(character, 'willpower', 'willpower')) {
                                  const updated = advanceCharacter(character, {
                                    type: 'willpower',
                                    itemId: 'willpower',
                                    cost
                                  });
                                  const newCharacters = [...characters];
                                  newCharacters[currentCharacterIndex] = updated;
                                  setCharacters(newCharacters);
                                }
                              }}
                              className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                character.totalXP >= 6 && canAdvanceAtCheckIn(character, 'willpower', 'willpower')
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                  : 'bg-gray-700 cursor-not-allowed text-gray-400'
                              }`}
                              disabled={character.totalXP < 6 || !canAdvanceAtCheckIn(character, 'willpower', 'willpower')}
                            >
                              {character.totalXP >= 6 && canAdvanceAtCheckIn(character, 'willpower', 'willpower') ? 'Advance' : 'Cannot Afford'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Virtue */}
                  <div 
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-bold text-lg">{character.stats.virtueType}</h4>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2">Your character's moral compass and spiritual strength</p>
                        
                        <div className="flex items-center mb-2">
                          <span className="text-sm text-gray-400 mr-2">Current:</span>
                          <span className="text-lg font-bold text-blue-400">{character.stats.virtue}</span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-blue-400">
                              Next Level: 2 XP
                            </span>
                            {character.totalXP < 2 && (
                              <span className="ml-2 text-xs text-red-400">
                                (Need {2 - character.totalXP} more XP)
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {character.stats.virtue > 1 && (
                              <button
                                onClick={() => {
                                  const updated = reduceCharacter(character, {
                                    type: 'virtue',
                                    itemId: 'virtue'
                                  });
                                  const newCharacters = [...characters];
                                  newCharacters[currentCharacterIndex] = updated;
                                  setCharacters(newCharacters);
                                }}
                                className="px-3 py-2 rounded font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
                              >
                                Remove Level (+2 XP)
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const cost = calculateXPCost(character, 'virtue');
                                if (character.totalXP >= cost && canAdvanceAtCheckIn(character, 'virtue', 'virtue')) {
                                  const updated = advanceCharacter(character, {
                                    type: 'virtue',
                                    itemId: 'virtue',
                                    cost
                                  });
                                  const newCharacters = [...characters];
                                  newCharacters[currentCharacterIndex] = updated;
                                  setCharacters(newCharacters);
                                }
                              }}
                              className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                character.totalXP >= 2 && canAdvanceAtCheckIn(character, 'virtue', 'virtue')
                                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                  : 'bg-gray-700 cursor-not-allowed text-gray-400'
                              }`}
                              disabled={character.totalXP < 2 || !canAdvanceAtCheckIn(character, 'virtue', 'virtue')}
                            >
                              {character.totalXP >= 2 && canAdvanceAtCheckIn(character, 'virtue', 'virtue') ? 'Advance' : 'Cannot Afford'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merit Advancement - Column 3 */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Manage Merits</h3>
                <div className="space-y-3">
                  {getAvailableMerits(character, true)
                    .map(merit => {
                    const hasMerit = character.merits[merit.merit_id];
                    const cost = calculateXPCost(character, 'merit', merit.merit_id);
                    const canAfford = character.totalXP >= cost;
                    // For merits, we only check if they can afford it (no check-in limitations for merits)
                    const canAdvanceNow = canAfford;
                    
                    return (
                      <div 
                        key={merit.merit_id} 
                        className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                          hasMerit
                            ? 'border-green-500 bg-green-500 bg-opacity-20 shadow-lg'
                            : canAdvanceNow
                              ? 'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md hover:scale-[1.02]'
                              : canAfford
                                ? 'border-yellow-500 bg-yellow-500 bg-opacity-10 hover:border-yellow-400'
                                : 'border-gray-700 bg-gray-800 bg-opacity-50 opacity-60'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h4 className="font-bold text-lg">
                                {merit.merit_name}
                                {merit.can_purchase_multiple === 'true' && hasMerit && (
                                  <span className="ml-2 text-sm text-blue-400">(Currently: {hasMerit})</span>
                                )}
                              </h4>
                              {hasMerit && merit.can_purchase_multiple !== 'true' && (
                                <div className="ml-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mb-2">
                              {merit.can_purchase_multiple === 'true' && (
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-600 text-green-100">
                                  Multiple
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-300 mb-2">{merit.description}</p>
                            {merit.special_notes && (
                              <p className="text-xs text-yellow-400 italic">{merit.special_notes}</p>
                            )}
                            
                            {/* Cost indicator */}
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  cost === 0 ? 'text-green-400' : 
                                  canAfford ? 'text-blue-400' : 'text-red-400'
                                }`}>
                                  Cost: {cost === 0 ? 'FREE' : `${cost} XP`}
                                </span>
                                {!canAfford && cost > 0 && (
                                  <span className="ml-2 text-xs text-red-400">
                                    (Need {cost - character.totalXP} more XP)
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                {hasMerit && (
                                  <button
                                    onClick={() => {
                                      const updated = reduceCharacter(character, {
                                        type: 'merit',
                                        itemId: merit.merit_id
                                      });
                                      const newCharacters = [...characters];
                                      newCharacters[currentCharacterIndex] = updated;
                                      setCharacters(newCharacters);
                                    }}
                                    className="px-3 py-2 rounded font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Remove (+{calculateReductionRefund(character, 'merit', merit.merit_id)} XP)
                                  </button>
                                )}
                                {(!hasMerit || merit.can_purchase_multiple === 'true') && (
                                  <button
                                    onClick={() => {
                                      if (canAdvanceNow) {
                                        const updated = advanceCharacter(character, {
                                          type: 'merit',
                                          itemId: merit.merit_id,
                                          cost
                                        });
                                        const newCharacters = [...characters];
                                        newCharacters[currentCharacterIndex] = updated;
                                        setCharacters(newCharacters);
                                      }
                                    }}
                                    className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                      canAdvanceNow
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                        : canAfford
                                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                          : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                    }`}
                                    disabled={!canAdvanceNow}
                                  >
                                    {canAdvanceNow ? 'Purchase' : canAfford ? 'Limit Reached' : 'Cannot Afford'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Already owned indicator - only show for non-stackable merits */}
                        {hasMerit && merit.can_purchase_multiple !== 'true' && (
                          <div className="mt-3 flex items-center justify-center">
                            <span className="text-green-400 font-medium text-sm">
                              ✓ Already Owned
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {getAvailableMerits(character, true)
                    .filter(merit => {
                      const hasMerit = character.merits[merit.merit_id];
                      const canPurchaseMultiple = merit.can_purchase_multiple === 'true';
                      return !hasMerit || canPurchaseMultiple;
                    }).length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">No Merits Available</div>
                      <div className="text-gray-500 text-sm">
                        All available merits for your faction have been purchased. Only merits that allow multiple purchases (like Herd and Income) can be bought again.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'powers' && (
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Current Powers - Left Column */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Current Powers</h3>
                <div className="space-y-4 max-h-[800px] overflow-y-auto">
                  {Object.entries(character.powers).map(([treeId, levels]) => {
                    const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                    if (!tree) return null;
                    
                    return (
                      <div 
                        key={treeId} 
                        className="p-3 rounded-lg border-2 border-green-500 bg-green-500 bg-opacity-20 shadow-lg transition-all duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h4 className="font-bold text-lg capitalize">{formatDisplayText(tree.tree_name)}</h4>
                              <div className="ml-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {[1, 2, 3].map(level => {
                                const hasLevel = levels[level];
                                const powers = tree[`level${level}_powers`]?.split('|') || [];
                                
                                return (
                                  <div key={level} className={`p-3 rounded border ${
                                    hasLevel 
                                      ? 'border-green-400 bg-green-400 bg-opacity-20' 
                                      : 'border-gray-600 bg-gray-700 bg-opacity-30 opacity-50'
                                  }`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded-full mr-2 ${
                                          hasLevel ? 'bg-green-500' : 'bg-gray-600'
                                        }`} />
                                        <span className="font-medium">Level {level}</span>
                                      </div>
                                      {hasLevel && (
                                        <button
                                          onClick={() => {
                                            const updated = reduceCharacter(character, {
                                              type: 'power',
                                              itemId: treeId,
                                              level: level
                                            });
                                            const newCharacters = [...characters];
                                            newCharacters[currentCharacterIndex] = updated;
                                            setCharacters(newCharacters);
                                          }}
                                          className="px-3 py-2 rounded font-medium text-sm bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Remove (+{calculateReductionRefund(character, 'power', treeId, level)} XP)
                                        </button>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-300">
                                      {powers.join(', ')}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(character.powers).length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">No Powers Learned</div>
                      <div className="text-gray-500 text-sm">
                        Start by learning powers from the available trees on the right
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Power Trees - Right Column */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Learn New Powers</h3>
                <div className="max-h-[800px] overflow-y-auto space-y-4">
                  {/* Innate Trees */}
                  {character.innateTreeIds.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-400 mb-2">Innate Power Trees (3/6/9 XP)</h4>
                      <div className="space-y-3">
                        {character.innateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          if (!tree) return null;
                          
                          const currentLevels = character.powers[treeId] || {};
                          const hasAnyLevel = Object.keys(currentLevels).length > 0;
                          
                          return (
                            <div 
                              key={treeId} 
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                hasAnyLevel
                                  ? 'border-green-500 bg-green-500 bg-opacity-20 shadow-lg'
                                  : 'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                                    {hasAnyLevel && (
                                      <div className="ml-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {[1, 2, 3].map(level => {
                                      const hasLevel = currentLevels[level];
                                      const canLearn = canLearnPower(character, treeId, level);
                                      const isRedundant = isRedundantPower(character, treeId, level);
                                      const cost = isRedundant ? 0 : calculateXPCost(character, 'power', treeId, level);
                                      const canAfford = character.totalXP >= cost;
                                      const canAdvanceNow = canLearn && canAfford && canAdvanceAtCheckIn(character, 'power', treeId);
                                      
                                      const powers = tree[`level${level}_powers`]?.split('|') || [];
                                      
                                      if (hasLevel) {
                                        return (
                                          <div key={level} className="p-3 rounded border border-green-400 bg-green-400 bg-opacity-20">
                                            <div className="flex items-center mb-2">
                                              <div className="w-4 h-4 rounded-full mr-2 bg-green-500" />
                                              <span className="font-medium">Level {level} - Learned</span>
                                            </div>
                                            <div className="text-sm text-gray-300">
                                              {powers.join(', ')}
                                            </div>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div key={level} className={`p-3 rounded border transition-all ${
                                          canAdvanceNow
                                            ? 'border-blue-400 bg-blue-400 bg-opacity-10 hover:bg-blue-400 hover:bg-opacity-20'
                                            : canAfford
                                              ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                                              : 'border-gray-600 bg-gray-700 bg-opacity-30 opacity-60'
                                        }`}>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                              <div className="w-4 h-4 rounded-full mr-2 bg-gray-600" />
                                              <span className="font-medium">Level {level}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`text-sm font-medium ${
                                                cost === 0 ? 'text-green-400' : 
                                                canAfford ? 'text-blue-400' : 'text-red-400'
                                              }`}>
                                                {cost === 0 ? 'FREE' : `${cost} XP`}
                                              </span>
                                              {!canAfford && cost > 0 && (
                                                <span className="text-xs text-red-400">
                                                  (Need {cost - character.totalXP} more XP)
                                                </span>
                                              )}
                                              <button
                                                onClick={() => {
                                                  const updated = advanceCharacter(character, {
                                                    type: 'power',
                                                    itemId: treeId,
                                                    level,
                                                    cost
                                                  });
                                                  const newCharacters = [...characters];
                                                  newCharacters[currentCharacterIndex] = updated;
                                                  setCharacters(newCharacters);
                                                }}
                                                className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                                  canAdvanceNow
                                                    ? isRedundant 
                                                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-md hover:shadow-lg' 
                                                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                }`}
                                                disabled={!canAdvanceNow}
                                              >
                                                {canAdvanceNow ? 'Learn' : canAfford ? 'Limit Reached' : 'Cannot Afford'}
                                              </button>
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-300">
                                            {powers.join(', ')}
                                          </div>
                                          {isRedundant && (
                                            <div className="mt-2 text-xs text-yellow-400 italic">
                                              ⚡ Redundant power - free due to existing knowledge!
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Faction Powers */}
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">
                      {character.faction === 'human' && character.subfaction === 'kinfolk' 
                        ? 'Shifter Powers (Innate: 3/6/9 XP, Learned: 6/9/12 XP)' 
                        : character.faction === 'human' && character.subfaction === 'sorcerer'
                          ? 'Sorcerer Powers (Innate: 3/6/9 XP, Fellowship: 6/9/12 XP)'
                          : character.faction === 'human' && character.subfaction === 'faithful'
                            ? 'Faithful Bounty Powers (3/6/9 XP)'
                            : character.faction === 'human' && character.subfaction === 'claimed_drone'
                              ? 'Claimed Drone Weaver Powers (All Trees Innate: 3/6/9 XP)'
                              : character.faction === 'human' && character.subfaction === 'claimed_fomori'
                              ? 'Claimed Fomori Bane Powers (Innate: 3/6/9 XP, Other: 6/9/12 XP)'
                              : character.faction === 'human' && character.subfaction === 'claimed_gorgon'
                              ? 'Claimed Gorgon Powers (3/6/9 XP)'
                              : character.faction === 'human' && character.subfaction === 'commoner'
                              ? 'Commoner Talent Powers (Innate: 3/6/9 XP, Other: 6/9/12 XP)'
                              : 'Faction Powers (6/9/12 XP)'
                      }
                    </h4>
                    {character.faction === 'human' && character.subfaction === 'kinfolk' && (
                      <div className="mb-2 p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                        <div className="text-blue-300 text-sm">
                          💡 <strong>Gifted Kinfolk:</strong> You can learn shifter powers during advancement. Your innate trees cost 3/6/9 XP, while other shifter powers cost 6/9/12 XP. Sorcerer powers are not available.
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'sorcerer' && (
                      <div className="mb-2 p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                        <div className="text-purple-300 text-sm">
                          💫 <strong>Sorcerer:</strong> Your chosen trees cost 3/6/9 XP as innate powers. Fellowship powers ({character.fellowship ? formatDisplayText(gameData.powerTrees.find(t => t.tree_id === character.fellowship)?.tree_name) || 'None' : 'None'}) cost 6/9/12 XP as learned powers.
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'faithful' && (
                      <div className="mb-2 p-3 bg-yellow-600 bg-opacity-20 rounded-lg">
                        <div className="text-yellow-300 text-sm">
                          ⚡ <strong>Faithful:</strong> Divine covenant restricts you to your chosen bounty tree ({character.innateTreeIds.length > 0 ? gameData.powerTrees.find(t => t.tree_id === character.innateTreeIds[0])?.tree_name || 'None' : 'None'}). You cannot learn other magical traditions - all powers cost 3/6/9 XP from your bounty tree only.
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'claimed_drone' && (
                      <div className="mb-2 p-3 bg-cyan-600 bg-opacity-20 rounded-lg">
                        <div className="text-cyan-300 text-sm">
                          🕷️ <strong>Claimed Drone:</strong> Pattern Web binding gives you access to all Weaver paradigms (Stasis, Weaver, Onesong) as innate trees. All Weaver powers cost 3/6/9 XP.
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'claimed_fomori' && (
                      <div className="mb-2 p-3 bg-red-600 bg-opacity-20 rounded-lg">
                        <div className="text-red-300 text-sm">
                          👹 <strong>Claimed Fomori:</strong> Bane possession restricts you to Wyrm manifestations only. Your innate tree ({character.innateTreeIds.length > 0 ? gameData.powerTrees.find(t => t.tree_id === character.innateTreeIds[0])?.tree_name || 'None' : 'None'}) costs 3/6/9 XP, other Bane trees cost 6/9/12 XP.
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'claimed_gorgon' && (
                      <div className="mb-2 p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                        <div className="text-purple-300 text-sm">
                          👁️ <strong>Claimed Gorgon:</strong> Dream reality binding restricts you to the Gorgon manifestation only. All powers cost 3/6/9 XP.
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'commoner' && (
                      <div className="mb-2 p-3 bg-green-600 bg-opacity-20 rounded-lg">
                        <div className="text-green-300 text-sm">
                          💪 <strong>Commoner:</strong> Natural human talents can be developed. Your innate talent ({character.innateTreeIds.length > 0 ? gameData.powerTrees.find(t => t.tree_id === character.innateTreeIds[0])?.tree_name || 'None' : 'None'}) costs 3/6/9 XP, other talent trees cost 6/9/12 XP.
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      {gameData.powerTrees
                        .filter(tree => {
                          // Special handling for Gifted Kinfolk - they can learn shifter powers, NOT sorcerer
                          if (character.faction === 'human' && character.subfaction === 'kinfolk') {
                            return tree.faction === 'shifter' && 
                                   !tree.tree_id.includes('sorcerer'); // Explicitly exclude sorcerer trees
                          }
                          // Special handling for Sorcerers - they can learn their faction powers and fellowship powers
                          if (character.faction === 'human' && character.subfaction === 'sorcerer') {
                            const isFactionPower = tree.faction === character.faction && 
                              ['animal', 'body', 'curse', 'healer', 'mind', 'patterns', 'perception', 'protection', 'spirit', 'warrior'].includes(tree.tree_id);
                            const isFellowshipPower = character.fellowship && tree.tree_id === character.fellowship;
                            return isFactionPower || isFellowshipPower;
                          }
                          // Special handling for Faithful - they can only learn from their chosen bounty tree
                          if (character.faction === 'human' && character.subfaction === 'faithful') {
                            return character.innateTreeIds.includes(tree.tree_id);
                          }
                          // Special handling for Drones - they can learn from any Technocratic tree
                          if (character.faction === 'human' && character.subfaction === 'claimed_drone') {
                            return ['stasis', 'weaver', 'onesong'].includes(tree.tree_id);
                          }
                          // Special handling for Fomori - they can learn from any Bane tree
                          if (character.faction === 'human' && character.subfaction === 'claimed_fomori') {
                            return ['enticer', 'ferectori', 'gorehound', 'toad'].includes(tree.tree_id);
                          }
                          // Special handling for Gorgon - they can only learn from the Gorgon tree
                          if (character.faction === 'human' && character.subfaction === 'claimed_gorgon') {
                            return tree.tree_id === 'gorgon';
                          }
                          // Special handling for Commoner - they can learn from any talent tree
                          if (character.faction === 'human' && character.subfaction === 'commoner') {
                            return ['brash', 'brawny', 'inquisitive', 'sturdy'].includes(tree.tree_id);
                          }
                          // Normal faction filtering for everyone else
                          return tree.faction === character.faction;
                        })
                        .filter(tree => {
                          // Exclude trees that are already shown in the innate section to avoid duplication
                          return !character.innateTreeIds.includes(tree.tree_id);
                        })
                        .filter(tree => {
                          // Only show trees that have available levels to purchase
                          const currentLevels = character.powers[tree.tree_id] || {};
                          const hasLevel1 = currentLevels[1];
                          const hasLevel2 = currentLevels[2];
                          const hasLevel3 = currentLevels[3];
                          
                          // Show if any level is missing
                          return !hasLevel1 || !hasLevel2 || !hasLevel3;
                        })
                        .map(tree => {
                          const currentLevels = character.powers[tree.tree_id] || {};
                          const hasAnyLevel = Object.keys(currentLevels).length > 0;
                          
                          return (
                            <div 
                              key={tree.tree_id} 
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                hasAnyLevel
                                  ? 'border-green-500 bg-green-500 bg-opacity-20 shadow-lg'
                                  : 'border-blue-400 bg-blue-400 bg-opacity-10 hover:border-blue-300 hover:bg-blue-400 hover:bg-opacity-20 hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <h5 className="font-bold text-lg capitalize">{tree.tree_name}</h5>
                                    {character.faction === 'human' && character.subfaction === 'claimed_fomori' && 
                                     ['enticer', 'ferectori', 'gorehound', 'toad'].includes(tree.tree_id) &&
                                     !character.innateTreeIds.includes(tree.tree_id) && (
                                      <span className="ml-2 px-2 py-1 bg-red-600 bg-opacity-30 border border-red-500 rounded text-xs text-red-300">
                                        Corrupt Tree
                                      </span>
                                    )}
                                    {hasAnyLevel && (
                                      <div className="ml-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {[1, 2, 3].map(level => {
                                      const hasLevel = currentLevels[level];
                                      const canLearn = canLearnPower(character, tree.tree_id, level);
                                      const isRedundant = isRedundantPower(character, tree.tree_id, level);
                                      const cost = isRedundant ? 0 : calculateXPCost(character, 'power', tree.tree_id, level);
                                      const canAfford = character.totalXP >= cost;
                                      const canAdvanceNow = canLearn && canAfford && canAdvanceAtCheckIn(character, 'power', tree.tree_id);
                                      
                                      const powers = tree[`level${level}_powers`]?.split('|') || [];
                                      
                                      if (hasLevel) {
                                        return (
                                          <div key={level} className="p-3 rounded border border-green-400 bg-green-400 bg-opacity-20">
                                            <div className="flex items-center mb-2">
                                              <div className="w-4 h-4 rounded-full mr-2 bg-green-500" />
                                              <span className="font-medium">Level {level} - Learned</span>
                                            </div>
                                            <div className="text-sm text-gray-300">
                                              {powers.join(', ')}
                                            </div>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div key={level} className={`p-3 rounded border transition-all ${
                                          canAdvanceNow
                                            ? 'border-blue-400 bg-blue-400 bg-opacity-10 hover:bg-blue-400 hover:bg-opacity-20'
                                            : canAfford
                                              ? 'border-yellow-500 bg-yellow-500 bg-opacity-10'
                                              : 'border-gray-600 bg-gray-700 bg-opacity-30 opacity-60'
                                        }`}>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                              <div className="w-4 h-4 rounded-full mr-2 bg-gray-600" />
                                              <span className="font-medium">Level {level}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`text-sm font-medium ${
                                                cost === 0 ? 'text-green-400' : 
                                                canAfford ? 'text-blue-400' : 'text-red-400'
                                              }`}>
                                                {cost === 0 ? 'FREE' : `${cost} XP`}
                                              </span>
                                              {!canAfford && cost > 0 && (
                                                <span className="text-xs text-red-400">
                                                  (Need {cost - character.totalXP} more XP)
                                                </span>
                                              )}
                                              <button
                                                onClick={() => {
                                                  const updated = advanceCharacter(character, {
                                                    type: 'power',
                                                    itemId: tree.tree_id,
                                                    level,
                                                    cost
                                                  });
                                                  const newCharacters = [...characters];
                                                  newCharacters[currentCharacterIndex] = updated;
                                                  setCharacters(newCharacters);
                                                }}
                                                className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                                  canAdvanceNow
                                                    ? isRedundant 
                                                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-md hover:shadow-lg' 
                                                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                }`}
                                                disabled={!canAdvanceNow}
                                              >
                                                {canAdvanceNow ? 'Learn' : canAfford ? 'Limit Reached' : 'Cannot Afford'}
                                              </button>
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-300">
                                            {powers.join(', ')}
                                          </div>
                                          {isRedundant && (
                                            <div className="mt-2 text-xs text-yellow-400 italic">
                                              ⚡ Redundant power - free due to existing knowledge!
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {gameData.powerTrees
                        .filter(tree => {
                          // Special handling for Gifted Kinfolk - they can learn shifter powers, NOT sorcerer
                          if (character.faction === 'human' && character.subfaction === 'kinfolk') {
                            return tree.faction === 'shifter' && 
                                   !tree.tree_id.includes('sorcerer'); // Explicitly exclude sorcerer trees
                          }
                          // Normal faction filtering for everyone else
                          return tree.faction === character.faction;
                        })
                        .filter(tree => {
                          // Only show trees that have available levels to purchase
                          const currentLevels = character.powers[tree.tree_id] || {};
                          const hasLevel1 = currentLevels[1];
                          const hasLevel2 = currentLevels[2];
                          const hasLevel3 = currentLevels[3];
                          
                          // Show if any level is missing
                          return !hasLevel1 || !hasLevel2 || !hasLevel3;
                        }).length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-lg mb-2">No Power Trees Available</div>
                          <div className="text-gray-500 text-sm">
                            All available power trees for your faction have been fully learned.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className={`${themeClasses.card} p-5`}>
              <h3 className="text-xl font-bold mb-2">Advancement History</h3>
              {character.advancementHistory.length > 0 ? (
                <div className="space-y-2">
                  {character.advancementHistory.map((advancement, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700">
                      <div>
                        <span className="font-medium">Check-in {advancement.checkIn}:</span>
                        <span className="ml-2">{advancement.type} - {advancement.itemId}</span>
                        {advancement.level && <span className="ml-1">(Level {advancement.level})</span>}
                        {advancement.redundant && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-600 rounded text-xs">REDUNDANT</span>
                        )}
                      </div>
                      <span className={`font-medium ${advancement.cost === 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {advancement.cost === 0 ? 'FREE' : `-${advancement.cost} XP`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No advancement history yet.</p>
              )}

              {/* Self-Nerfs */}
              {character.selfNerfs.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-bold text-orange-400 mb-2">Self-Nerf History</h4>
                  <div className="space-y-2">
                    {character.selfNerfs.map((nerf, index) => (
                      <div key={index} className="p-3 bg-orange-900 bg-opacity-30 rounded">
                        <div className="font-medium">{nerf.type} reduced by {nerf.amount}</div>
                        <div className="text-sm text-gray-400">Reason: {nerf.reason}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(nerf.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Available Lore</h3>
                
                {/* Current Lore */}
                {character.lores && character.lores.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-lg font-bold mb-2 text-green-400">Current Lore</h4>
                    <div className="grid gap-2">
                      {character.lores.map((lore, index) => {
                        const loreData = gameData.lores.find(l => l.lore_id === lore.lore_id);
                        if (!loreData) return null;
                        
                        const canRemove = canReduce(character, 'lore', lore.lore_id);
                        const refund = canRemove ? calculateReductionRefund(character, 'lore', lore.lore_id) : 0;
                        
                        return (
                          <div key={index} className={`${themeClasses.card} p-3 border border-green-500`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-green-400">{loreData.lore_name}</h5>
                                <p className="text-sm text-gray-400">{loreData.description}</p>
                                <p className="text-xs text-blue-400 mt-1">
                                  {loreData.category} • Cost Type: {loreData.cost_type}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-400 font-bold">{calculateXPCost(character, 'lore', loreData.lore_id)} XP</span>
                                {canRemove && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Remove ${loreData.lore_name}? You will gain ${refund} XP.`)) {
                                        const updatedCharacter = reduceCharacter(character, {
                                          type: 'lore',
                                          itemId: lore.lore_id
                                        });
                                        const newCharacters = [...characters];
                                        newCharacters[currentCharacterIndex] = updatedCharacter;
                                        setCharacters(newCharacters);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title={`Remove (refund ${refund} XP)`}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Available Lore for Purchase */}
                <div>
                  <h4 className="text-lg font-bold mb-2">Available for Purchase</h4>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {getAvailableLores(character, true).map((lore) => {
                      const cost = calculateXPCost(character, 'lore', lore.lore_id);
                      const unspentXP = character.totalXP - character.xpSpent;
                      const canAfford = unspentXP >= cost;
                      const alreadyHas = character.lores?.some(l => l.lore_id === lore.lore_id);
                      
                      if (alreadyHas) return null;
                      
                      const getBorderColor = (category) => {
                        switch(category) {
                          case 'common': return 'border-green-500';
                          case 'uncommon': return 'border-blue-500';
                          case 'rare': return 'border-purple-500';
                          case 'faction': return 'border-yellow-500';
                          default: return 'border-gray-500';
                        }
                      };
                      
                      const getTextColor = (category) => {
                        switch(category) {
                          case 'common': return 'text-green-400';
                          case 'uncommon': return 'text-blue-400';
                          case 'rare': return 'text-purple-400';
                          case 'faction': return 'text-yellow-400';
                          default: return 'text-gray-400';
                        }
                      };
                      
                      return (
                        <div key={lore.lore_id} className={`${themeClasses.card} p-3 border ${getBorderColor(lore.category)} ${!canAfford ? 'opacity-50' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className={`font-bold ${getTextColor(lore.category)}`}>{lore.lore_name}</h5>
                              <p className="text-sm text-gray-400 mt-1">{lore.description}</p>
                              <p className="text-xs text-blue-400 mt-2">
                                Category: {lore.category} • Cost Type: {lore.cost_type}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className={`font-bold ${getTextColor(lore.category)}`}>{cost} XP</span>
                              <button
                                onClick={() => {
                                  if (canAfford) {
                                    const advancement = {
                                      type: 'lore',
                                      itemId: lore.lore_id,
                                      cost
                                    };
                                    const updatedCharacter = advanceCharacter(character, advancement);
                                    const newCharacters = [...characters];
                                    newCharacters[currentCharacterIndex] = updatedCharacter;
                                    setCharacters(newCharacters);
                                  }
                                }}
                                disabled={!canAfford}
                                className={`p-1 ${canAfford ? 'text-green-400 hover:text-green-300' : 'text-gray-600 cursor-not-allowed'}`}
                                title={canAfford ? `Purchase ${lore.lore_name}` : 'Insufficient XP'}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {getAvailableLores(character, true).length === 0 && (
                    <div className="text-center py-8">
                      <Book className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">No lore available</p>
                    </div>
                  )}
                </div>
                
                {/* Lore Guidelines */}
                <div className="mt-5 p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                  <h4 className="text-lg font-bold mb-2">Lore Guidelines</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• <strong>Faction (6 XP):</strong> General knowledge about major supernatural types</li>
                    <li>• <strong>Common (3 XP):</strong> Basic knowledge that most members would know</li>
                    <li>• <strong>Uncommon (6 XP):</strong> Specialized knowledge requiring deeper involvement</li>
                    <li>• <strong>Rare (9 XP):</strong> Secret knowledge that few possess</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className={`${themeClasses.card} p-5`}>
              <h3 className="text-xl font-bold mb-2">Character Notes</h3>
              <textarea
                value={character.notes || ''}
                onChange={(e) => {
                  const updated = { ...character, notes: e.target.value, lastModified: new Date().toISOString() };
                  const newCharacters = [...characters];
                  newCharacters[currentCharacterIndex] = updated;
                  setCharacters(newCharacters);
                }}
                className={`${themeClasses.input} h-64 resize-none`}
                placeholder="Add notes about your character, their goals, relationships, etc..."
              />
            </div>
          )}

          {activeTab === 'xp-tracking' && (
            <div className="space-y-6">
              {/* XP Adjustment Form */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Adjust Experience Points</h3>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className={themeClasses.label}>Type</label>
                      <select
                        value={xpAdjustment.type}
                        onChange={(e) => setXpAdjustment(prev => ({...prev, type: e.target.value}))}
                        className={themeClasses.input}
                      >
                        <option value="gain">XP Gain</option>
                        <option value="loss">XP Loss</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={themeClasses.label}>Amount</label>
                      <input
                        type="number"
                        min="0"
                        value={xpAdjustment.amount}
                        onChange={(e) => setXpAdjustment(prev => ({...prev, amount: parseInt(e.target.value) || 0}))}
                        className={themeClasses.input}
                        placeholder="Enter XP amount"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={themeClasses.label}>Reason</label>
                      <textarea
                        value={xpAdjustment.reason}
                        onChange={(e) => setXpAdjustment(prev => ({...prev, reason: e.target.value}))}
                        className={`${themeClasses.input} h-24 resize-none`}
                        placeholder="Explain the reason for this XP adjustment..."
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (xpAdjustment.amount > 0 && xpAdjustment.reason.trim()) {
                            const adjustment = xpAdjustment.type === 'gain' ? xpAdjustment.amount : -xpAdjustment.amount;
                            const newTotalXP = Math.max(0, character.totalXP + adjustment);
                            
                            const xpEntry = {
                              timestamp: new Date().toISOString(),
                              type: xpAdjustment.type,
                              amount: xpAdjustment.amount,
                              reason: xpAdjustment.reason,
                              previousTotal: character.totalXP,
                              newTotal: newTotalXP
                            };
                            
                            const updated = {
                              ...character,
                              totalXP: newTotalXP,
                              xpHistory: [...(character.xpHistory || []), xpEntry],
                              lastModified: new Date().toISOString()
                            };
                            
                            const newCharacters = [...characters];
                            newCharacters[currentCharacterIndex] = updated;
                            setCharacters(newCharacters);
                            
                            // Reset form
                            setXpAdjustment({
                              amount: 0,
                              reason: '',
                              type: 'gain'
                            });
                          }
                        }}
                        disabled={!xpAdjustment.amount || !xpAdjustment.reason.trim()}
                        className={`flex-1 px-4 py-2 rounded font-medium ${
                          xpAdjustment.amount > 0 && xpAdjustment.reason.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-700 cursor-not-allowed text-gray-400'
                        }`}
                      >
                        {xpAdjustment.type === 'gain' ? 'Add XP' : 'Remove XP'}
                      </button>
                      
                      {/* Common XP Activities Dropdown */}
                      {xpAdjustment.type === 'gain' && (
                        <div className="relative xp-dropdown">
                          <button
                            onClick={() => setShowXpDropdown(!showXpDropdown)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                            type="button"
                          >
                            📋
                          </button>
                          
                          {showXpDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10">
                              <div className="p-3">
                                <h4 className="font-bold text-sm mb-2 text-green-400">Common XP Activities</h4>
                                <div className="space-y-2">
                                  {commonXpActivities.map((activity, index) => (
                                    <label key={index} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                                      <input
                                        type="checkbox"
                                        checked={selectedXpActivities.some(sel => sel.name === activity.name)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedXpActivities(prev => [...prev, activity]);
                                          } else {
                                            setSelectedXpActivities(prev => prev.filter(sel => sel.name !== activity.name));
                                          }
                                        }}
                                        className="text-green-500"
                                      />
                                      <span className="flex-1 text-sm">{activity.name}</span>
                                      <span className="text-xs text-green-400">{activity.xp} XP</span>
                                    </label>
                                  ))}
                                </div>
                                
                                <div className="mt-3 pt-2 border-t border-gray-600">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Total Selected:</span>
                                    <span className="text-sm text-green-400">
                                      {selectedXpActivities.reduce((total, activity) => total + activity.xp, 0)} XP
                                    </span>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        if (selectedXpActivities.length > 0) {
                                          const totalXp = selectedXpActivities.reduce((total, activity) => total + activity.xp, 0);
                                          const reasonList = selectedXpActivities.map(activity => `${activity.name} (${activity.xp} XP)`).join(', ');
                                          
                                          setXpAdjustment(prev => ({
                                            ...prev,
                                            amount: totalXp,
                                            reason: reasonList
                                          }));
                                          
                                          setSelectedXpActivities([]);
                                          setShowXpDropdown(false);
                                        }
                                      }}
                                      disabled={selectedXpActivities.length === 0}
                                      className={`flex-1 px-2 py-1 rounded text-xs font-medium ${
                                        selectedXpActivities.length > 0
                                          ? 'bg-green-600 hover:bg-green-700 text-white'
                                          : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                      }`}
                                    >
                                      Apply
                                    </button>
                                    
                                    <button
                                      onClick={() => setSelectedXpActivities([])}
                                      className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Current XP Display */}
                <div className="mt-5 p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Current Total XP:</span>
                    <span className="text-2xl font-bold text-blue-400">{character.totalXP}</span>
                  </div>
                  {xpAdjustment.amount > 0 && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-400">After adjustment:</span>
                      <span className={`font-medium ${
                        xpAdjustment.type === 'gain' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {xpAdjustment.type === 'gain' 
                          ? character.totalXP + xpAdjustment.amount
                          : Math.max(0, character.totalXP - xpAdjustment.amount)
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* XP History */}
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">XP History</h3>
                {character.xpHistory && character.xpHistory.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {character.xpHistory
                      .slice()
                      .reverse()
                      .map((entry, index) => (
                      <div key={index} className="p-3 border border-gray-600 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                              entry.type === 'gain' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium">
                              {entry.type === 'gain' ? '+' : '-'}{entry.amount} XP
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">
                              {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-400">{entry.previousTotal} → </span>
                              <span className="font-medium">{entry.newTotal}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          <span className="font-medium">Reason:</span> {entry.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">No XP adjustments recorded</div>
                    <div className="text-gray-500 text-sm">
                      Use the form above to track XP gains and losses
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Testing Suite component removed

  // Settings
  const renderSettings = () => (
    <div className={`min-h-screen ${themeClasses.base}`}>
      <div className="container mx-auto p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-3xl font-bold">Settings & Accessibility</h2>
          <button
            onClick={() => setCurrentMode('menu')}
            className={themeClasses.button}
          >
            <X className="w-4 h-4 mr-2" />
            Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Interface Settings */}
          <div className={`${themeClasses.card} p-5`}>
            <h3 className="text-xl font-bold mb-2">Interface Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {darkMode ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />}
                  <span>Dark Mode</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    darkMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-3" />
                  <span>Auto-save</span>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    autoSave ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className={`${themeClasses.card} p-5`}>
            <h3 className="text-xl font-bold mb-2">Accessibility Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>High Contrast Mode</span>
                <button
                  onClick={() => setAccessibility(prev => ({
                    ...prev,
                    highContrast: !prev.highContrast
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    accessibility.highContrast ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      accessibility.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>Large Text</span>
                <button
                  onClick={() => setAccessibility(prev => ({
                    ...prev,
                    largeText: !prev.largeText
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    accessibility.largeText ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      accessibility.largeText ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span>Keyboard Navigation</span>
                <button
                  onClick={() => setAccessibility(prev => ({
                    ...prev,
                    keyboardNavigation: !prev.keyboardNavigation
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    accessibility.keyboardNavigation ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      accessibility.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Export Settings */}
          <div className={`${themeClasses.card} p-5`}>
            <h3 className="text-xl font-bold mb-2">Export Settings</h3>
            <div className="space-y-4">
              <div>
                <label className={themeClasses.label}>Default Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className={themeClasses.input}
                >
                  <option value="json">JSON (Recommended)</option>
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="txt">Text (Character Sheet)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className={`${themeClasses.card} p-5`}>
            <h3 className="text-xl font-bold mb-2">Data Management</h3>
            <div className="space-y-4">
              <button
                onClick={() => setClearDataConfirmOpen(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
              >
                Clear All Data
              </button>
              
              <button
                onClick={() => {
                  const data = localStorage.getItem('shadowAccordPhase8');
                  if (data) {
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'shadow_accord_backup.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
              >
                Export Backup
              </button>
            </div>
          </div>

          {/* Clear Data Confirmation Dialog */}
          {clearDataConfirmOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-3">
              <div className={`${themeClasses.card} max-w-md w-full`}>
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2">Clear All Data</h3>
                  <p className="text-gray-300 mb-5">This will permanently delete all character data. This action cannot be undone.</p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setClearDataConfirmOpen(false)}
                      className="px-4 py-2 rounded font-medium bg-gray-600 hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setCharacters([]);

                        localStorage.removeItem('shadowAccordPhase8');
                        setClearDataConfirmOpen(false);
                      }}
                      className="px-4 py-2 rounded font-medium bg-red-600 hover:bg-red-700"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Import character
  const importCharacter = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        if (importData.character) {
          const character = {
            ...importData.character,
            id: Date.now() + Math.random(),
            imported: new Date().toISOString(),
            lastModified: new Date().toISOString()
          };
          setCharacters(prev => [...prev, character]);
          setCurrentCharacterIndex(characters.length);
          alert('Character imported successfully!');
        }
      } catch (error) {
        alert('Error importing character: ' + error.message);
      }
    };
    reader.readAsText(file);
  }, [characters.length]);

  // Main Render Logic
  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'menu': return renderMainMenu();
      case 'creation': return renderCharacterCreation();
      case 'management': return renderCharacterManagement();
      case 'character': return renderCharacterView();
      case 'settings': return renderSettings();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentMode()}
    </div>
  );
};

export default ShadowAccordComplete;
