import { useMemo, useCallback } from 'react';
import { gameDataCSV } from '../data/gameData';

export const useGameData = () => {
  return useMemo(() => {
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
  }, []);
};

export const createBlankCharacter = () => ({
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
    selectedClan: null, // For ghoul clan selection
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
    mixedSubfaction: null, // For Gorgon/Fomori mixed heritage (sorcerer, ghoul, kinfolk)
    claimedStatus: null, // 'gorgon', 'fomori', or null
    selectedFomoriTree: null, // Which fomori tree if claimed by fomori
    claimedInnateTreeIds: [], // Additional innate trees from claimed status
    firstMeritFree: false,
    validationErrors: [],
    buildPlans: [],
    teachingsReceived: [],
    teachingsGiven: [],
    selfNerfs: [],
    tempFactionChangePowers: 0 // Track free powers to assign after faction change
  });

  // Handle faction selection with official base stats
  export const handleFactionChange = (character, factionId, gameData) => {
    const faction = gameData.factions.find(f => f.faction_id === factionId);
    if (!faction) return character;

    const baseCharacter = {
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
    const updatedCharacter = (factionId === 'wraith' || factionId === 'vampire') ? {
      ...baseCharacter,
      innateTreeIds: []
    } : baseCharacter;

    return updatedCharacter;
  };

  // Assign free lore during character creation based on faction and subfaction
  export const assignFreeLore = (character, gameData) => {
    const freeLoreIds = [];
    
    // Assign faction lore if available
    const factionLoreId = `general_${character.faction}`;
    const factionLore = gameData.lores.find(lore => lore.lore_id === factionLoreId);
    if (factionLore) {
      freeLoreIds.push(factionLoreId);
    }
    
    // Assign subfaction-specific lore
    if (character.subfaction) {
      // Check for tribal lore (shifter tribes)
      const tribalLoreId = `tribe_${character.subfaction}`;
      const tribalLore = gameData.lores.find(lore => lore.lore_id === tribalLoreId);
      if (tribalLore) {
        freeLoreIds.push(tribalLoreId);
      }
      
      // Check for clan lore (vampire clans)
      const clanLoreId = `clan_${character.subfaction}`;
      const clanLore = gameData.lores.find(lore => lore.lore_id === clanLoreId);
      if (clanLore) {
        freeLoreIds.push(clanLoreId);
      }
      
      // Check for other specific subfaction lores
      const subfactionLoreId = `${character.subfaction}_lore`;
      const subfactionLore = gameData.lores.find(lore => lore.lore_id === subfactionLoreId);
      if (subfactionLore) {
        freeLoreIds.push(subfactionLoreId);
      }
      
      // Special cases for specific subfactions
      if (character.subfaction === 'sorcerer') {
        // Sorcerers get lore for their fellowship if they have one, plus Mage Lore
        if (character.fellowship) {
          const fellowshipLoreId = `${character.fellowship}_lore`;
          const fellowshipLore = gameData.lores.find(lore => lore.lore_id === fellowshipLoreId);
          if (fellowshipLore) {
            freeLoreIds.push(fellowshipLoreId);
          }
          
          // Also give Mage Lore when a fellowship is selected
          freeLoreIds.push('general_mage');
        }
      }
      
      // Special case for Salubri - both Healer and Warrior get clan_salubri lore
      if (character.subfaction === 'salubri_healer' || character.subfaction === 'salubri_warrior') {
        const salubriLore = gameData.lores.find(lore => lore.lore_id === 'clan_salubri');
        if (salubriLore) {
          freeLoreIds.push('clan_salubri');
        }
      }
      
      // Handle claimed status lore
      if (character.claimedStatus) {
        if (character.claimedStatus === 'fomori') {
          freeLoreIds.push('fomori_lore');
        } else if (character.claimedStatus === 'gorgon') {
          freeLoreIds.push('gorgons_lore');
        }
      }
      
      // Handle specific human subfactions
      if (character.faction === 'human') {
        if (character.subfaction === 'claimed_drone') {
          freeLoreIds.push('drones_lore');
        } else if (character.subfaction === 'claimed_gorgon') {
          freeLoreIds.push('gorgons_lore');
        } else if (character.subfaction === 'claimed_fomori') {
          freeLoreIds.push('fomori_lore');
        } else if (character.subfaction === 'faithful') {
          freeLoreIds.push('messianic_voices');
        } else if (character.subfaction === 'ghoul') {
          // Ghouls get vampire lore for free
          freeLoreIds.push('general_vampire');
          
          // If a clan is selected, also give clan lore for free
          if (character.selectedClan) {
            const clanLoreId = `clan_${character.selectedClan}`;
            const clanLore = gameData.lores.find(lore => lore.lore_id === clanLoreId);
            if (clanLore) {
              freeLoreIds.push(clanLoreId);
            }
          }
        }
      }
    }
    
    // Handle shifter breed/auspice (they get tribal lore from subfaction already)
    // No additional lore needed for breed/auspice as tribal lore covers the culture
    
    // Convert existing lores array and add new free lores, avoiding duplicates
    const existingLores = character.lores || [];
    const existingLoreIds = existingLores.map(lore => lore.lore_id);
    
    // Add only new lores that don't already exist
    const newLores = freeLoreIds
      .filter(loreId => !existingLoreIds.includes(loreId))
      .map(loreId => ({ lore_id: loreId }));
    
    return {
      ...character,
      lores: [...existingLores, ...newLores]
    };
  };    // Handle subfaction selection with innate trees
  export const handleSubfactionChange = (character, subfactionId, gameData) => {
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
      // Special handling for Claimed Drone: get all three Weaver trees as innates plus Regeneration 3 and Sense Spirit
      innateTreeIds = ['stasis', 'weaver', 'onesong'];
      // Add Regeneration 3 and Sense Spirit as fundamental powers if not already present
      const baseFundamentalPowers = character.fundamentalPowers || [];
      const hasRegeneration = baseFundamentalPowers.some(power => power.startsWith('Regeneration'));
      const hasSenseSpirit = baseFundamentalPowers.some(power => power.includes('Sense Spirit'));
      
      let newFundamentalPowers = [...baseFundamentalPowers];
      if (!hasRegeneration) {
        newFundamentalPowers.push('Regeneration 3');
      }
      if (!hasSenseSpirit) {
        newFundamentalPowers.push('Sense Spirit');
      }
      fundamentalPowers = newFundamentalPowers;
    } else if (subfactionId === 'claimed_gorgon') {
      // Special handling for Claimed Gorgon: Add Frail and Sense Spirit as fundamental powers
      const baseFundamentalPowers = character.fundamentalPowers || [];
      const hasFrail = baseFundamentalPowers.some(power => power.toLowerCase().includes('frail'));
      const hasSenseSpirit = baseFundamentalPowers.some(power => power.includes('Sense Spirit'));
      
      let newFundamentalPowers = [...baseFundamentalPowers];
      if (!hasFrail) {
        newFundamentalPowers.push('Frail');
      }
      if (!hasSenseSpirit) {
        newFundamentalPowers.push('Sense Spirit');
      }
      fundamentalPowers = newFundamentalPowers;
    } else if (subfactionId === 'claimed_fomori') {
      // Special handling for Claimed Fomori: Add Sense Spirit as fundamental power
      const baseFundamentalPowers = character.fundamentalPowers || [];
      const hasSenseSpirit = baseFundamentalPowers.some(power => power.includes('Sense Spirit'));
      if (!hasSenseSpirit) {
        fundamentalPowers = [...baseFundamentalPowers, 'Sense Spirit'];
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
  export const handleKinfolkTribalSelection = (character, tribalTreeId) => {
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
  export const handleBreedSelection = (character, breedId) => {
    const updatedCharacter = { ...character, breed: breedId };
    
    // Update innate trees based on breed, auspice, and tribe
    return updateShifterInnateTreeIds(updatedCharacter);
  };

  // Handle shifter auspice selection
  export const handleAuspiceSelection = (character, auspiceId) => {
    const updatedCharacter = { ...character, auspice: auspiceId };
    
    // Update innate trees based on breed, auspice, and tribe
    return updateShifterInnateTreeIds(updatedCharacter);
  };

  // Update shifter innate tree IDs based on breed, auspice, and tribal selection
  export const updateShifterInnateTreeIds = (character) => {
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
    
    return { ...character, innateTreeIds };
  };

  // Check if breed is available for the selected tribe
  export const isBreedAvailableForTribe = (subfactionId, breedId, gameData) => {
    const subfaction = gameData.subfactions.find(sf => sf.subfaction_id === subfactionId);
    if (!subfaction || !subfaction.restrictions) return true;
    
    // Red Talons can only be Lupus
    if (subfactionId === 'red_talon' && breedId !== 'lupus') {
      return false;
    }
    
    return true;
  };

  // =========================
  // FACTION CHANGE SYSTEM
  // =========================
  
  // Get valid faction changes for a character
  export const getValidFactionChanges = (character) => {
    const changes = [];
    
    // Humans can become anything except wraith (wraith is handled separately)
    if (character.faction === 'human') {
      changes.push(
        { id: 'vampire', name: 'Vampire', description: 'Embrace into undeath. Gain 3 free powers from innate disciplines.' },
        { id: 'shifter', name: 'Shifter', description: 'Awaken as a shapeshifter. Gain 3 free power dots + Homid innate.' },
        { id: 'gorgon', name: 'Gorgon', description: 'Transform into a dream entity. Gain first dot of Gorgon tree free.' },
        { id: 'drone', name: 'Claimed Drone', description: 'Become bound to the Pattern Web. Gain access to all Weaver trees.' },
        { id: 'fomori', name: 'Claimed Fomori', description: 'Become possessed by a Bane spirit. Choose your manifestation.' }
      );
    }
    
    // All factions except wraith can become wraith
    if (character.faction !== 'wraith') {
      changes.push({
        id: 'wraith',
        name: 'Wraith',
        description: 'Die and return as a ghost. Choose 3 innate Arcanoi + Shadow Archetype. Gain 3 free powers.'
      });
    }
    
    return changes;
  };

  // Faction change handler with useCallback
  export const handleFactionChangeClick = (change, setSelectedFactionChange, setFactionChangeModal) => {
    console.log('handleFactionChangeClick called with:', change);
    setSelectedFactionChange(change);
    setFactionChangeModal(true);
  };

  // Handle faction change transformation
  export const handleFactionChangeTransformation = (character, newFactionId, gameData) => {
    console.log('handleFactionChangeTransformation called with:', newFactionId);
    console.log('Available factions:', gameData.factions?.map(f => f.faction_id));
    
    // Store original faction info and create new character object
    const newCharacter = { 
      ...character,
      originalFaction: character.faction,
      originalSubfaction: character.subfaction
    };
    
    // Update basic faction info
    const newFaction = gameData.factions.find(f => f.faction_id === newFactionId);
    
    if (!newFaction) {
      console.error('Faction not found:', newFactionId);
      console.error('Available factions:', gameData.factions);
      return newCharacter; // Return unchanged character if faction not found
    }
    
    console.log('Found faction:', newFaction);
    
    // Preserve current energy amount, update max to new faction's base
    const currentEnergy = character.stats.energy;
    const newMaxEnergy = parseInt(newFaction.base_energy);
    
    // Base character updates
    let updatedCharacter = {
      ...newCharacter,
      faction: newFactionId,
      subfaction: '', // Will be set based on new faction
      stats: {
        ...newCharacter.stats,
        energy: Math.min(currentEnergy, newMaxEnergy),
        maxEnergy: newMaxEnergy,
        energyType: newFaction.energy_type,
        virtue: parseInt(newFaction.base_virtue),
        virtueType: newFaction.virtue_type
      },
      fundamentalPowers: newFaction.fundamental_powers ? 
        newFaction.fundamental_powers.split('|') : [],
      innateTreeIds: [],
      tempFactionChangePowers: 0, // Track free powers to assign
      powers: {}, // Clear all existing powers for faction change
      lastModified: new Date().toISOString()
    };
    
    // Set faction-specific benefits
    switch (newFactionId) {
      case 'vampire':
        updatedCharacter = {
          ...updatedCharacter,
          subfaction: 'caitiff', // Default to Caitiff for flexibility
          tempFactionChangePowers: 3 // 3 free powers
        };
        break;
        
      case 'shifter':
        updatedCharacter = {
          ...updatedCharacter,
          innateTreeIds: ['homid'], // Force Homid
          tempFactionChangePowers: 3, // 3 free power dots
          breed: 'homid' // Force homid breed
          // Will need to select tribe and auspice
        };
        break;
        
      case 'wraith':
        updatedCharacter = {
          ...updatedCharacter,
          tempFactionChangePowers: 3 // 3 free powers
          // Will need to select 3 arcanoi and shadow archetype
        };
        break;
        
      case 'gorgon':
        updatedCharacter = {
          ...updatedCharacter,
          subfaction: 'claimed_gorgon',
          innateTreeIds: ['gorgon'],
          powers: {
            gorgon: { 1: true }
          },
          fundamentalPowers: [...updatedCharacter.fundamentalPowers, 'Frail']
        };
        break;
        
      case 'drone':
        updatedCharacter = {
          ...updatedCharacter,
          subfaction: 'claimed_drone',
          innateTreeIds: ['stasis', 'weaver', 'onesong'],
          fundamentalPowers: [...updatedCharacter.fundamentalPowers, 'Regeneration 3']
        };
        break;
        
      case 'fomori':
        updatedCharacter = {
          ...updatedCharacter,
          subfaction: 'claimed_fomori'
          // Will need to select fomori tree
        };
        break;
      default:
        // No special faction changes needed for other factions
        break;
    }
    
    // Add faction change to advancement history
    const finalCharacter = {
      ...updatedCharacter,
      advancementHistory: [
        ...(updatedCharacter.advancementHistory || []),
        {
          type: 'faction_change',
          fromFaction: character.faction,
          toFaction: newFactionId,
          timestamp: new Date().toISOString(),
          cost: 0
        }
      ]
    };
    
    return finalCharacter;
  };

  // =========================
  // XP COST CALCULATIONS
  // =========================
  export const calculateXPCost = (character, type, itemId, level = 1, gameData) => {
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
      
      // For characters with claimed status, their claimed trees are also innate
      if (character.claimedStatus && character.claimedInnateTreeIds && character.claimedInnateTreeIds.includes(itemId)) {
        isInnate = true; // Claimed powers use innate pricing
      }
      
      // For mixed subfaction powers: treat as innate (original supernatural heritage)
      if (character.mixedSubfaction) {
        if (character.mixedSubfaction === 'sorcerer') {
          const sorcererTrees = ['animal', 'body', 'curse', 'healer', 'mind', 'patterns', 'perception', 'protection', 'spirit', 'warrior'];
          if (sorcererTrees.includes(itemId)) {
            isInnate = true; // Mixed sorcerer powers use innate pricing (original heritage)
          }
        }
        if (character.mixedSubfaction === 'ghoul') {
          // Find all vampire power trees
          const vampireTrees = gameData.powerTrees.filter(tree => tree.faction === 'vampire').map(tree => tree.tree_id);
          if (vampireTrees.includes(itemId)) {
            isInnate = true; // Mixed ghoul powers use innate pricing (original heritage)
          }
        }
        if (character.mixedSubfaction === 'kinfolk') {
          // Find all shifter power trees
          const shifterTrees = gameData.powerTrees.filter(tree => tree.faction === 'shifter').map(tree => tree.tree_id);
          if (shifterTrees.includes(itemId)) {
            isInnate = true; // Mixed kinfolk powers use innate pricing (original heritage)
          }
        }
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
  };

  // Check for redundant powers (free advancement)
  export const isRedundantPower = (character, treeId, level, gameData) => {
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
          const otherPowers = otherTree[`level${checkLevel}_powers`]?.split('|') || '';
          return otherPowers.includes(power);
        });
      });
    });
  };

  // ==============================
  // ADVANCEMENT SYSTEM
  // ==============================
  export const canAdvanceAtCheckIn = (character, type, itemId) => {
    // No advancement limitations - players can advance as much as they want per check-in
    return true;
  };

  // Function to check if a reduction is valid
  export const canReduce = (character, type, itemId, level) => {
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
        // Defensive programming: ensure lores is an array
        const loresArray = Array.isArray(character.lores) ? character.lores : 
          character.lores ? Object.keys(character.lores).map(loreId => ({ lore_id: loreId })) : [];
        return loresArray.some(lore => lore.lore_id === itemId);
      default:
        return false;
    }
  };

  // Function to calculate XP refund for reductions
  export const calculateReductionRefund = (character, type, itemId, level, gameData) => {
    switch (type) {
      case 'skill':
        const currentSkillLevel = character.skills[itemId] || 0;
        // Refund the cost of the current level
        return calculateXPCost(character, 'skill', itemId, currentSkillLevel, gameData);
      case 'power':
        // Refund the cost of this specific power level
        return calculateXPCost(character, 'power', itemId, level, gameData);
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
        return calculateXPCost(character, 'lore', itemId, 1, gameData);
      default:
        return 0;
    }
  };

  // Count powers at a specific level across all trees
  export const countPowersAtLevel = (powers, level) => {
    return Object.values(powers).reduce((count, treeLevels) => {
      return count + (treeLevels[level] ? 1 : 0);
    }, 0);
  };

  // Check if Shifter power selection follows level ratio constraints
  export const isValidShifterPowerSelection = (powers) => {
    const level1Count = countPowersAtLevel(powers, 1);
    const level2Count = countPowersAtLevel(powers, 2);
    const level3Count = countPowersAtLevel(powers, 3);
    
    // Level 3 count must not exceed Level 2 count
    // Level 2 count must not exceed Level 1 count
    return level3Count <= level2Count && level2Count <= level1Count;
  };

  // Check if adding a specific power would maintain valid ratios
  export const canAddShifterPower = (powers, level) => {
    // Create a test power object to check the ratio
    const testPowers = JSON.parse(JSON.stringify(powers));
    const testTreeId = 'test_tree';
    if (!testPowers[testTreeId]) testPowers[testTreeId] = {};
    testPowers[testTreeId][level] = true;
    
    return isValidShifterPowerSelection(testPowers);
  };

  // Get current power level distribution for display
  export const getPowerLevelDistribution = (powers) => {
    return {
      level1: countPowersAtLevel(powers, 1),
      level2: countPowersAtLevel(powers, 2),
      level3: countPowersAtLevel(powers, 3)
    };
  };

  // Check if power can be learned (FIXED for shifters, ghouls, and gifted kinfolk)
  export const canLearnPower = (character, treeId, level) => {
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
  export const getAvailableMerits = (character, isAdvancement = false, gameData) => {
    // Only humans can select merits during character creation
    // All factions can select merits during advancement
    if (!isAdvancement && character.checkInCount === 0 && character.faction !== 'human') {
      return [];
    }

    return gameData.merits.filter(merit => {
      // If no restrictions, merit is available to all
      if (!merit.faction_restriction) return true;
      
      const restrictions = merit.faction_restriction.split('|');
      
      // Handle "non-" prefix restrictions
      for (const restriction of restrictions) {
        if (restriction.startsWith('non-')) {
          const excludedFaction = restriction.substring(4); // Remove "non-" prefix
          if (character.faction === excludedFaction) {
            return false; // This faction is excluded
          }
        } else {
          // Normal faction inclusion check
          if (restriction === character.faction || 
              (character.subfaction && restriction === character.subfaction)) {
            return true;
          }
        }
      }
      
      // If we have restrictions but none matched positively, check if any "non-" restrictions apply
      const hasNonRestrictions = restrictions.some(r => r.startsWith('non-'));
      const hasPositiveRestrictions = restrictions.some(r => !r.startsWith('non-'));
      
      // If only "non-" restrictions exist and we haven't been excluded, allow it
      if (hasNonRestrictions && !hasPositiveRestrictions) {
        return true;
      }
      
      // If positive restrictions exist but didn't match, deny
      if (hasPositiveRestrictions) {
        return false;
      }
      
      return true;
    });
  };

  // Function to get available lore for a character
  export const getAvailableLores = (character, isAdvancement = false, gameData) => {
    // Return all lore items - no faction restrictions
    return gameData.lores || [];
  };

  // ============================
  // CHARACTER MANAGEMENT
  // ============================
  export const deleteCharacter = (characterId, characters, setCharacters, setCurrentCharacterIndex, setCurrentMode) => {
    if (window.confirm('Are you sure you want to delete this character? This cannot be undone.')) {
      setCharacters(prev => prev.filter(c => c.id !== characterId));
      if (characters[currentCharacterIndex]?.id === characterId) {
        setCurrentCharacterIndex(0);
        setCurrentMode('menu');
      }
    }
  };

  export const advanceCharacter = (character, advancement, gameData) => {
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
    const newTotalXP = updatedCharacter.totalXP - cost;
    const newXpSpent = updatedCharacter.xpSpent + cost;
    const newLastModified = new Date().toISOString();

    // Create base character update object
    let characterUpdate = {
      ...updatedCharacter,
      totalXP: newTotalXP,
      xpSpent: newXpSpent,
      lastModified: newLastModified,
      advancementHistory: [
        ...updatedCharacter.advancementHistory,
        {
          type,
          itemId,
          level,
          cost,
          timestamp: newLastModified,
          redundant: cost === 0
        }
      ]
    };

    // Record XP spending in XP history (if cost > 0)
    if (cost > 0) {
      const xpEntry = {
        timestamp: newLastModified,
        type: 'loss',
        amount: cost,
        reason: `Purchased ${type === 'merit' ? gameData.merits.find(m => m.merit_id === itemId)?.merit_name || itemId : itemId}`,
        previousTotal: character.totalXP,
        newTotal: character.totalXP - cost
      };
      
      characterUpdate = {
        ...characterUpdate,
        xpHistory: [...(characterUpdate.xpHistory || []), xpEntry]
      };
    }

    // Apply advancement
    switch (type) {
      case 'skill':
        characterUpdate = {
          ...characterUpdate,
          skills: {
            ...characterUpdate.skills,
            [itemId]: level
          }
        };
        break;
      case 'power':
        // Check for Dementation tree Malkavian derangement requirement
        if (itemId === 'dementation') {
          const hasMalkavianDerangement = characterUpdate.selfNerfs?.some(nerf => 
            nerf.type === 'derangement' && nerf.source === 'malkavian'
          );
          
          if (!hasMalkavianDerangement) {
            const derangementList = [
              'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
              'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
              'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
            ];
            
            const selectedDerangement = prompt(
              `Learning Dementation requires a Malkavian derangement. Choose one:\n\n` +
              derangementList.map((d, i) => `${i + 1}. ${d}`).join('\n') +
              '\n\nEnter the number (1-12) of your chosen derangement:'
            );
            
            const derangementIndex = parseInt(selectedDerangement) - 1;
            if (derangementIndex >= 0 && derangementIndex < derangementList.length) {
              const chosenDerangement = derangementList[derangementIndex];
              
              // Add the Malkavian derangement
              const newDerangement = {
                id: Date.now(),
                name: `Deranged - ${chosenDerangement}`,
                description: `Character has a Deranged flaw from their connection to Malkavian madness, specifically manifesting as ${chosenDerangement}.`,
                type: 'derangement',
                category: 'Deranged',
                source: 'malkavian'
              };
              
              characterUpdate = {
                ...characterUpdate,
                selfNerfs: [...(characterUpdate.selfNerfs || []), newDerangement]
              };
            } else {
              alert('Invalid selection. Dementation advancement cancelled.');
              return character;
            }
          }
        }
        
        // Check for trees that cause Permatainted
        const permataintedTrees = [
          'death', 'demonology', // Sorcerer trees
          'madness_wyrm', 'strength', 'corruption', // Wyrm gifts  
          'thaumaturgy_path_of_the_defiler', 'thaumaturgy_rego_manes', // Dark Thaumaturgy
          'daimoinon' // Baali vampire tree
        ];
        
        if (permataintedTrees.includes(itemId)) {
          // Check if character is already Permatainted
          const isAlreadyPermatainted = characterUpdate.selfNerfs?.some(nerf => 
            nerf.name === 'Permatainted'
          );
          
          if (!isAlreadyPermatainted) {
            // Add Permatainted flaw
            const permataintedFlaw = {
              id: Date.now(),
              name: 'Permatainted',
              description: `Character has become Permatainted from learning powers from the ${itemId} tree.`,
              type: 'flaw',
              category: 'Permatainted',
              source: itemId
            };
            
            characterUpdate = {
              ...characterUpdate,
              selfNerfs: [...(characterUpdate.selfNerfs || []), permataintedFlaw]
            };
          }
        }
        
        // Check for Wyrm Madness gift derangement requirement
        if (itemId === 'madness_wyrm') {
          // Check if character already has a derangement from madness_wyrm
          const hasWyrmMadnessDerangement = characterUpdate.selfNerfs?.some(nerf => 
            nerf.type === 'derangement' && nerf.source === 'madness_wyrm'
          );
          
          if (!hasWyrmMadnessDerangement) {
            const derangementList = [
              'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
              'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
              'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
            ];
            
            const selectedDerangement = prompt(
              `Learning Madness (Wyrm) gift inflicts additional psychological damage. Choose a derangement:\n\n` +
              derangementList.map((d, i) => `${i + 1}. ${d}`).join('\n') +
              '\n\nEnter the number (1-12) of your chosen derangement:'
            );
            
            const derangementIndex = parseInt(selectedDerangement) - 1;
            if (derangementIndex >= 0 && derangementIndex < derangementList.length) {
              const chosenDerangement = derangementList[derangementIndex];
              
              // Add the Wyrm Madness derangement
              const newDerangement = {
                id: Date.now(),
                name: `Deranged - ${chosenDerangement}`,
                description: `Character has a Deranged flaw from the Madness (Wyrm) gift, manifesting as ${chosenDerangement}.`,
                type: 'derangement',
                category: 'Deranged',
                source: 'madness_wyrm'
              };
              
              characterUpdate = {
                ...characterUpdate,
                selfNerfs: [...(characterUpdate.selfNerfs || []), newDerangement]
              };
            } else {
              alert('Invalid selection. Madness (Wyrm) advancement cancelled.');
              return character;
            }
          }
        }
        
        // Check for wraith shadow control trees that cause conditional Permatainted
        const wraith_shadow_trees = ['contaminate', 'hive_mind', 'maleficence'];
        if (characterUpdate.faction === 'wraith' && wraith_shadow_trees.includes(itemId)) {
          // Check if character is already Permatainted
          const isAlreadyPermatainted = characterUpdate.selfNerfs?.some(nerf => 
            nerf.name === 'Permatainted'
          );
          
          if (!isAlreadyPermatainted) {
            // Add conditional Permatainted flaw for wraiths
            const permataintedFlaw = {
              id: Date.now(),
              name: 'Permatainted',
              description: `Character becomes Permatainted while their Shadow is in control due to learning powers from the ${itemId} tree.`,
              type: 'flaw',
              category: 'Permatainted (Conditional)',
              source: itemId
            };
            
            characterUpdate = {
              ...characterUpdate,
              selfNerfs: [...(characterUpdate.selfNerfs || []), permataintedFlaw]
            };
          }
        }
        
        // Check for Fomori tree mutation requirement
        const fomoriTrees = ['enticer', 'ferectori', 'gorehound', 'toad'];
        if (fomoriTrees.includes(itemId)) {
          const isInnateTree = characterUpdate.innateTreeIds?.includes(itemId) || 
                               characterUpdate.claimedInnateTreeIds?.includes(itemId);
          const isFirstPowerInTree = !characterUpdate.powers[itemId] || Object.keys(characterUpdate.powers[itemId]).length === 0;
          
          // TOAD tree always requires mutation when first learned
          // Other Fomori trees require mutation if not innate
          const needsMutation = (itemId === 'toad' && isFirstPowerInTree) || 
                               (!isInnateTree && isFirstPowerInTree);
          
          if (needsMutation) {
            const mutationPrompt = prompt(
              `Learning from ${itemId === 'toad' ? 'the TOAD tree' : `the ${itemId.charAt(0).toUpperCase() + itemId.slice(1)} tree (non-innate)`} requires a Mutation.\n\n` +
              'Describe your mutation (physical alteration caused by Bane influence):'
            );
            
            if (mutationPrompt && mutationPrompt.trim()) {
              const chosenMutation = mutationPrompt.trim();
              
              // Add the mutation
              const newMutation = {
                id: Date.now(),
                name: 'Mutation',
                description: chosenMutation,
                type: 'mutation',
                category: 'Mutation - Describe your own physical alteration',
                source: itemId === 'toad' ? 'toad_tree' : 'fomori_tree'
              };
              
              characterUpdate = {
                ...characterUpdate,
                selfNerfs: [...(characterUpdate.selfNerfs || []), newMutation]
              };
            } else {
              alert('Mutation description required. Power advancement cancelled.');
              return character;
            }
          }
        }
        
        characterUpdate = {
          ...characterUpdate,
          powers: {
            ...characterUpdate.powers,
            [itemId]: {
              ...(characterUpdate.powers[itemId] || {}),
              [level]: true
            }
          }
        };
        break;
      case 'merit':
        // Handle stackable merits (track quantity)
        const merit = gameData.merits.find(m => m.merit_id === itemId);
        if (merit && merit.can_purchase_multiple === 'true') {
          // For stackable merits, increment the quantity
          characterUpdate = {
            ...characterUpdate,
            merits: {
              ...characterUpdate.merits,
              [itemId]: (characterUpdate.merits[itemId] || 0) + 1
            }
          };
        } else {
          // For non-stackable merits, just mark as owned
          characterUpdate = {
            ...characterUpdate,
            merits: {
              ...characterUpdate.merits,
              [itemId]: true
            }
          };
        }
        break;
      case 'energy':
        characterUpdate = {
          ...characterUpdate,
          stats: {
            ...characterUpdate.stats,
            energy: characterUpdate.stats.energy + 1,
            maxEnergy: characterUpdate.stats.maxEnergy + 1
          }
        };
        break;
      case 'willpower':
        characterUpdate = {
          ...characterUpdate,
          stats: {
            ...characterUpdate.stats,
            willpower: characterUpdate.stats.willpower + 1
          }
        };
        break;
      case 'virtue':
        characterUpdate = {
          ...characterUpdate,
          stats: {
            ...characterUpdate.stats,
            virtue: characterUpdate.stats.virtue + 1
          }
        };
        break;
      case 'lore':
        // Defensive programming: ensure lores is an array
        const loresArray = Array.isArray(characterUpdate.lores) ? characterUpdate.lores : 
          characterUpdate.lores ? Object.keys(characterUpdate.lores).map(loreId => ({ lore_id: loreId })) : [];
        
        characterUpdate = {
          ...characterUpdate,
          lores: [...loresArray, { lore_id: itemId }]
        };
        break;
      default:
        break;
    }

    return characterUpdate;
  };