const express = require('express');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Game data from your existing CSV structure
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
tremere,Tremere,vampire,clan,,,auspex|dominate|thaumaturgy_rego_vitae
tzimisce,Tzimisce,vampire,clan,,,animalism|auspex|vicissitude
ventrue,Ventrue,vampire,clan,,,dominate|fortitude|presence
warder_of_man,Warder of Man,shifter,tribe,,,warder_of_man_gift
iron_legion,Iron Legion,wraith,legion,,,custom_selection
skeletal_legion,Skeletal Legion,wraith,legion,,,custom_selection
grim_legion,Grim Legion,wraith,legion,,,custom_selection
penitent_legion,Penitent Legion,wraith,legion,,,custom_selection
emerald_legion,Emerald Legion,wraith,legion,,,custom_selection
silent_legion,Silent Legion,wraith,legion,,,custom_selection
legion_of_paupers,Legion of Paupers,wraith,legion,,,custom_selection
legion_of_fate,Legion of Fate,wraith,legion,,,custom_selection
no_legion,None,wraith,legion,,,custom_selection
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
solicitors,Solicitors,wraith,guild,,,custom_selection
enfant,Enfant,wraith,guild,,,custom_selection`,

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
deimos,Deimos,vampire,Black Ichor,Dreamshape,Ranged 4 (Bile)
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
thaumaturgy_rego_aquam,Thaumaturgy: Rego Aquam,vampire,Silence,Fabricate Armor,Paralyze
thaumaturgy_rego_vitae,Thaumaturgy: Rego Vitae,vampire,Sense Vitae|Test Generation|Test Oath,Ranged 2 <Blood>,Aggravated 1
thaumaturgy_path_of_the_defiler,Path of the Defiler,vampire,Taint,Derange,Balefire
thaumaturgy_rego_dolor,Rego Dolor (Path of Pain),vampire,Silence,Body Wrack,Horrid Reality
thaumaturgy_rego_manes,Rego Manes (Path of Spirit),vampire,Scion of Evil|Sense Demon|Sense Spirit,Umbra Sight,Subjugate
thaumaturgy_rego_pestis,Rego Pestis (Path of Pestilence),vampire,Wither,Venom,Brittle Bones
thaumaturgy_rego_phobos,Rego Phobos (Path of Fear),vampire,Monsters,Dreamshape|Terror,Leech of Fear
theurge,Theurge,shifter,Release Spirit|Sense Spirit,Umbra Sight,Umbra Strike
usury,Usury,wraith,Pathos Exchange|Paralyzing Touch,Devour|Expel Corpus|Health Exchange,Pathos Investment
valeren_healer,Valeren Healer,vampire,Healing Touch,Serenity,Revive
valeren_warrior,Valeren Warrior,vampire,Sense Max Health|Sense Mental|Sense Health,Body Wrack,Aggravated 1
vicissitude,Vicissitude,vampire,Malleable Visage,Body Wrack,Horrid Form
visceratika,Visceratika,vampire,Cloak|Clawed Form,Avoidance,Powerful Form|Resilience
warder_of_man_gift,Warder of Man Gift,shifter,Pence from Heaven,Fabricate Armor,Cloak Sight
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
gorgon,Gorgon,human,Hallucination,Dreamshape,Gauntlet Walk|Sense Spirit|Umbra Sight
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
warder_of_man,Warder of Man Lore,common,lore_common,,"","Knowledge of the Warder of Man tribe, their urban adaptation, and technology use"
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
thinker,Thinker,This Shadow is intellectual and emotionless preferring to take time and think through all the possibilities before choosing to act. Snap decisions can ruin progress towards long-term goals so it's better to avoid missteps. Everything around you will certainly wait for your decision and freezing in a fast-paced situation never hurt anyone,Coming up with unnecessary contingencies and convincing others that they are necessary freezing during a moment of importance attempting to get others to consider the consequences of their actions prior to acting,Frenzy Control|Paralyze`,

  passions: `passion_id,passion_name,example_emotions
anger,Anger,Fury|revenge|animosity
fear,Fear,Terror|panic|cowardice|anxiety
hate,Hate,Spite|jealousy|loathing|disgust
love,Love,Friendship|romance|affection
pain,Pain,Suffering|depression|sorrow|guilt
pleasure,Pleasure,Joy|excitement|comfort`
};

// Parse CSV data
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

// Parsed game data
const gameData = {
  factions: parseCSV(gameDataCSV.factions),
  subfactions: parseCSV(gameDataCSV.subfactions),
  skills: parseCSV(gameDataCSV.skills),
  powerTrees: parseCSV(gameDataCSV.powerTrees),
  merits: parseCSV(gameDataCSV.merits),
  xpCosts: parseCSV(gameDataCSV.xpCosts),
  lores: parseCSV(gameDataCSV.lores),
  shadowArchetypes: parseCSV(gameDataCSV.shadowArchetypes),
  passions: parseCSV(gameDataCSV.passions)
};

// @route   GET /api/gamedata
// @desc    Get all game data
// @access  Public
router.get('/', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      gameData
    });
  } catch (error) {
    console.error('Game data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game data'
    });
  }
});

// @route   GET /api/gamedata/factions
// @desc    Get all factions
// @access  Public
router.get('/factions', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      factions: gameData.factions
    });
  } catch (error) {
    console.error('Factions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching factions'
    });
  }
});

// @route   GET /api/gamedata/subfactions
// @desc    Get all subfactions
// @access  Public
router.get('/subfactions', optionalAuth, (req, res) => {
  try {
    const { faction } = req.query;
    let subfactions = gameData.subfactions;
    
    if (faction) {
      subfactions = subfactions.filter(sub => sub.faction_id === faction);
    }
    
    res.json({
      success: true,
      subfactions
    });
  } catch (error) {
    console.error('Subfactions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subfactions'
    });
  }
});

// @route   GET /api/gamedata/skills
// @desc    Get all skills
// @access  Public
router.get('/skills', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      skills: gameData.skills
    });
  } catch (error) {
    console.error('Skills fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching skills'
    });
  }
});

// @route   GET /api/gamedata/powertrees
// @desc    Get all power trees
// @access  Public
router.get('/powertrees', optionalAuth, (req, res) => {
  try {
    const { faction } = req.query;
    let powerTrees = gameData.powerTrees;
    
    if (faction) {
      powerTrees = powerTrees.filter(tree => tree.faction === faction);
    }
    
    res.json({
      success: true,
      powerTrees
    });
  } catch (error) {
    console.error('Power trees fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching power trees'
    });
  }
});

// @route   GET /api/gamedata/merits
// @desc    Get all merits
// @access  Public
router.get('/merits', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      merits: gameData.merits
    });
  } catch (error) {
    console.error('Merits fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching merits'
    });
  }
});

// @route   GET /api/gamedata/lores
// @desc    Get all lores
// @access  Public
router.get('/lores', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      lores: gameData.lores
    });
  } catch (error) {
    console.error('Lores fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching lores'
    });
  }
});

// @route   GET /api/gamedata/xpcosts
// @desc    Get XP costs
// @access  Public
router.get('/xpcosts', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      xpCosts: gameData.xpCosts
    });
  } catch (error) {
    console.error('XP costs fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching XP costs'
    });
  }
});

// @route   GET /api/gamedata/shadowarchetypes
// @desc    Get shadow archetypes
// @access  Public
router.get('/shadowarchetypes', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      shadowArchetypes: gameData.shadowArchetypes
    });
  } catch (error) {
    console.error('Shadow archetypes fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching shadow archetypes'
    });
  }
});

// @route   GET /api/gamedata/passions
// @desc    Get passions
// @access  Public
router.get('/passions', optionalAuth, (req, res) => {
  try {
    res.json({
      success: true,
      passions: gameData.passions
    });
  } catch (error) {
    console.error('Passions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching passions'
    });
  }
});

module.exports = router;
