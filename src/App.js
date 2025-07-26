import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Download, Upload, Save, Plus, ChevronRight, ChevronLeft, 
  Trash2, X, Search, Users, Book,
  CheckCircle, AlertCircle, Settings, 
  TrendingUp, Archive,
  Moon, Sun,
  Minus,
  Home,
  ArrowLeft
} from 'lucide-react';
import { PDFDocument, PDFTextField, PDFCheckBox } from 'pdf-lib';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import PowerIndex from './PowerIndex';

// Helper function to load PDF files (works in web, Electron, and Capacitor)
const loadPdfFile = async (filename) => {
  try {
    // Check if we're running in Electron
    if (window.electronAPI && window.electronAPI.isElectron) {
      console.log(`Loading PDF via Electron IPC: ${filename}`);
      const arrayBuffer = await window.electronAPI.loadPdfFile(filename);
      console.log(`Successfully loaded PDF via Electron: ${filename}`);
      return arrayBuffer;
    } 
    // Check if we're running in Capacitor (mobile)
    else if (Capacitor.isNativePlatform()) {
      console.log(`Loading PDF via Capacitor: ${filename}`);
      try {
        const result = await Filesystem.readFile({
          path: `public/${filename}`,
          directory: Directory.Cache
        });
        // Convert base64 to ArrayBuffer
        const base64Data = result.data;
        const binaryString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        console.log(`Successfully loaded PDF via Capacitor: ${filename}`);
        return arrayBuffer;
      } catch (capacitorError) {
        // Fallback to web fetch for Capacitor if file not found in cache
        console.log(`Capacitor file read failed, falling back to web fetch: ${filename}`);
        const response = await fetch(`/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log(`Successfully loaded PDF via web fetch fallback: ${filename}`);
        return arrayBuffer;
      }
    } 
    else {
      // Fallback to web fetch
      console.log(`Loading PDF via web fetch: ${filename}`);
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Successfully loaded PDF via web fetch: ${filename}`);
      return arrayBuffer;
    }
  } catch (error) {
    console.error(`Error loading PDF file ${filename}:`, error);
    throw error;
  }
};

// Helper function to download files (works in web, Electron, and Capacitor)
const downloadFile = async (data, filename, mimeType = 'application/octet-stream') => {
  try {
    // Check if we're running in Capacitor (mobile)
    if (Capacitor.isNativePlatform()) {
      console.log(`Downloading file via Capacitor: ${filename}`);
      
      let base64Data;
      if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        // Convert ArrayBuffer/Uint8Array to base64
        const uint8Array = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        base64Data = btoa(binaryString);
      } else if (typeof data === 'string') {
        // Convert string to base64
        base64Data = btoa(data);
      } else {
        throw new Error('Unsupported data type for Capacitor download');
      }
      
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents
      });
      
      alert(`File saved to Documents folder: ${filename}`);
      console.log(`Successfully saved file via Capacitor: ${filename}`);
    } else {
      // Fallback to web/Electron download using blob
      console.log(`Downloading file via web/Electron: ${filename}`);
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`Successfully downloaded file: ${filename}`);
    }
  } catch (error) {
    console.error(`Error downloading file ${filename}:`, error);
    throw error;
  }
};

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
  
  // Lore Search State
  const [loreSearchQuery, setLoreSearchQuery] = useState('');
  const [loreSearchResults, setLoreSearchResults] = useState([]);
  
  // Helper function to format text by replacing underscores with spaces
  const formatDisplayText = useCallback((text) => {
    if (!text) return text;
    // Ensure text is a string before calling replace
    return String(text).replace(/_/g, ' ');
  }, []);
  
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
  const [exportFormat, setExportFormat] = useState('pdf');
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Faction Change System State
  const [factionChangeModal, setFactionChangeModal] = useState(false);
  const [selectedFactionChange, setSelectedFactionChange] = useState(null);
  const [factionChangeCreationMode, setFactionChangeCreationMode] = useState(false);
  const [originalCharacterForFactionChange, setOriginalCharacterForFactionChange] = useState(null);

  // Version and Changelog Data
  const currentVersion = '0.2.0';
  const changelog = [
    {
      version: '0.2.0',
      date: '2025-07-26',
      changes: [
        'Added comprehensive Power Index with searchable database of all 166+ player powers from the rulebook',
        'Implemented Power Index as standalone page accessible from main menu',
        'Integrated Power Index as tab in character manager for quick reference during character building',
        'Added advanced search functionality: search by power name, description, sources, calls, or any text',
        'Implemented filtering system: filter by power source (H1, S3, V3, etc.) and type (DAMAGE, MENTAL, TOUCH, etc.)',
        'Added sorting options: sort powers by name, type, or cost with real-time results counter',
        'Created responsive design with dark theme matching existing application style',
        'Updated PDF export energy costs with comprehensive and accurate power cost categorization',
        'Expanded PDF export power costs from 13 to 45+ "None" cost powers including all sensory abilities',
        'Added missing energy cost categories: 3 Energy, 4 Energy powers with proper classification',
        'Enhanced PDF export accuracy: all 166+ powers now have correct cost categorization matching rulebook',
        'Fixed ESLint warnings: removed unused showLoreSearch, setShowLoreSearch, and PowerIndexComponent variables',
        'Improved code quality by removing unused imports and state variables'
      ]
    },
    {
      version: '0.1.9',
      date: '2025-07-24',
      changes: [
        'Fixed PDF export functionality in Android APK builds',
        'Added Capacitor Filesystem plugin for cross-platform file operations',
        'Updated loadPdfFile() function to support Capacitor/Android environments with web fetch fallback',
        'Created downloadFile() helper function that works across web, Electron, and Android platforms',
        'Android PDF exports now save to Documents folder with user notification',
        'Replaced web-only blob download methods with cross-platform file saving',
        'Enhanced PDF export error handling for mobile environments'
      ]
    },
    {
      version: '0.1.8',
      date: '2025-07-24',
      changes: [
        'Fixed PDF export functionality in built Electron executable (.exe) files',
        'Added IPC (Inter-Process Communication) handlers to Electron main process for secure PDF file loading',
        'Created preload.js script to safely expose PDF loading functionality to renderer process',
        'Implemented loadPdfFile() helper function that works in both web browsers and Electron apps',
        'Updated package.json build configuration to include preload.js and all PDF template files',
        'Enhanced error handling for PDF export with detailed error messages and environment detection',
        'Added comprehensive logging for PDF export debugging and troubleshooting',
        'Fixed ESLint warnings: wrapped formatDisplayText in useCallback hook',
        'Added missing formatDisplayText dependency to generateCharacterSheet useCallback',
        'Updated git configuration to use "horsehhhh" as author instead of "Shadow Accord Team"',
        'Updated package.json author field to "horsehhhh and Claude"',
        'Updated README.md with proper project information and author credits',
        'Build now compiles successfully with zero ESLint warnings'
      ]
    },
    {
      version: '0.1.7',
      date: '2025-07-24',
      changes: [
        'Updated PDF export to use new character sheet template: "Shadow accord fixed fillable character sheet 7.24.pdf"',
        'Reorganized PDF field mappings: innate powers (fields 1-3), learned powers first half (fields 4-25), learned powers second half (rows 0-21 → fields 27-48), skills (fields 49-63)',
        'Fixed PDF export power display - now shows actual power names instead of "true"',
        'Implemented proper power name extraction from CSV game data using pipe-delimited parsing',
        'Fixed lore field export issues by mapping correct field names with leading spaces for rows 1-7',
        'Resolved "[object Object]" display in lore fields by implementing proper object property extraction',
        'Added comprehensive power cost system with 177 total powers categorized by energy/willpower/virtue costs',
        'Implemented power cost display in PDF export with proper cost extraction logic',
        'Removed merit level numbers from PDF export (e.g., "Moon Ties 2" now shows as "Moon Ties")',
        'Added regex replacement to remove "Gift" suffix from power tree names in PDF output',
        'Added rank/generation tab to character manager interface',
        'Implemented shifter rank system with 6 ranks: cub, cliath, fostern, adren, athro, elder',
        'Made shifters select rank during character creation as mandatory step',
        'Updated vampire generation system to range from 6th-13th generation (6th oldest, 13th youngest)',
        'Added subfaction field mapping for shifters: tribe (field 1), breed (field 2), auspice (field 3)',
        'Implemented generation/rank field restriction - empty for non-shifters and non-vampires',
        'Enhanced character data structure to store rank/generation information',
        'Added rank/generation validation and UI integration throughout character creation flow'
      ]
    },
    {
      version: '0.1.6',
      date: '2025-07-23',
      changes: [
        'Enhanced Natus Mandatory Flaw System: Redesigned to match derangement system patterns used by other subfactions',
        'Added 7 new vampire power trees: Deimos, Thaumaturgy: Rego Aquam, and 5 Dark Thaumaturgy paths',
        'Implemented automatic Permatainted effects for power advancement from corrupt trees (Death, Demonology, Wyrm gifts, Dark Thaumaturgy, Daimoinon)',
        'Added automatic derangement requirement for Wyrm Madness gift advancement',
        'Implemented fundamental Permatainted status for Drone, Gorgon, and Fomori claimed characters',
        'Updated Tremere clan to have Thaumaturgy: Rego Vitae as innate instead of generic Thaumaturgy',
        'Fixed Natus flaw requirement validation and UI display issues'
      ]
    },
    {
      version: '0.1.5',
      date: '2025-07-22',
      changes: [
        'Fixed critical "Assignment to constant variable" error in character creation',
        'Resolved mutation issues in handleFactionChangeTransformation function',
        'Fixed const variable mutations in advanceCharacter and reduceCharacter functions',
        'Corrected immutable state management in character creation power selection',
        'Fixed faction change completion handler to use proper immutable updates',
        'Resolved "some is not a function" error in lore system',
        'Fixed lore data structure inconsistency - converted from object to array format',
        'Added defensive programming for backward compatibility with existing character lores',
        'Ensured all character state updates follow React immutability requirements',
        'Fixed character creation for all factions, especially shifter characters',
        'Improved error handling and data migration for lore system',
        'Enhanced character display to handle both old and new lore data formats'
      ]
    },
    {
      version: '0.1.4',
      date: '2025-07-22',
      changes: [
        'Added Sense Spirit as a fundamental power to Gorgon faction',
        'Added Sense Spirit as a fundamental power to Claimed Drone characters',
        'Added Sense Spirit as a fundamental power to Claimed Fomori characters',
        'Enhanced Claimed Gorgon to receive both Frail and Sense Spirit fundamental powers',
        'Added free lore system for Ghouls during character creation',
        'Ghouls automatically receive Vampire Lore for free at character creation',
        'Added optional clan selection for Ghouls with clan-specific lore rewards',
        'Ghouls who select a clan receive that clan\'s lore for free (if restrictions are met)',
        'Added clan restriction warnings for special bloodlines (Giovanni, Lamia)',
        'Enhanced character creation UI with clan selection step for Ghoul characters',
        'Added free lore system for Sorcerers with fellowship selection',
        'Sorcerers who choose a fellowship receive both Mage Lore and fellowship-specific lore for free',
        'Enhanced fellowship selection UI to explain lore benefits for magical training'
      ]
    },
    {
      version: '0.1.3',
      date: '2025-07-22',
      changes: [
        'Added comprehensive Faction Change System for supernatural transformation',
        'Humans can become Vampire, Shifter, Gorgon, Drone, or Fomori',
        'Any faction (except Wraith) can become Wraith',
        'Faction changes preserve current energy amount up to new faction maximum',
        'Vampires gain 3 free powers from innate disciplines after transformation',
        'Shifters gain 3 free power dots and forced Homid innate after awakening',
        'Wraiths gain 3 free powers from Arcanoi after death',
        'Gorgons gain first dot of Gorgon tree for free after transformation',
        'Drones gain access to Weaver trees (Stasis, Weaver, Onesong) after claiming',
        'Fomori can select manifestation tree after possession',
        'All faction changes recorded in advancement history for tracking',
        'Added faction change modal with detailed transformation information',
        'Added free power assignment UI for post-transformation benefits',
        'Faction changes represent major story moments (Embrace, First Change, Death, etc.)',
        'System maintains character investment while enabling supernatural progression',
        'Fixed faction change free dots calculation - now properly shows 0/3 for new faction selection',
        'Faction changes preserve all existing powers while resetting creation dot counter',
        'Removed misleading XP messages during faction changes (no free XP given for transformations)',
        'Added separate tracking for creation dots vs purchased powers during faction changes',
        'Faction change modal now appears properly at root level with enhanced visibility',
        'Enhanced faction change system to redirect through character creation for proper setup',
        'Added faction change creation mode with preserved character data (name, player, XP)',
        'Faction change character creation skips skills section (skills transfer from original character)',
        'Fixed double application of free dots during faction transformation',
        'Corrected faction change completion to update existing character instead of creating duplicate',
        'Added proper free dot tracking with creationDotsUsed counter for faction changes',
        'Fixed tempFactionChangePowers calculation to prevent unlimited free dot usage',
        'Enhanced level ratio constraints for shifter faction changes (only applies to new shifter powers)',
        'Added claimed status option for Faithful characters during character creation',
        'Faithful can now be claimed by Gorgon or possessed by Fomori Bane during creation',
        'Dual heritage Faithful gain access to both bounty tree and claimed powers at innate costs',
        'Improved faction transformation modal with proper z-index and backdrop positioning'
      ]
    },
    {
      version: '0.1.2',
      date: '2025-07-22',
      changes: [
        'Added Claimed Status System for dual heritage characters',
        'Gorgon and Fomori can now claim human subfactions (Sorcerer, Ghoul, Gifted Kinfolk, Commoner)',
        'Characters retain access to both original and claimed supernatural powers',
        'All powers from both heritages cost innate XP rates (3/6/9) instead of learned rates',
        'Enhanced character creation flow: select primary subfaction first, then optional claimed status',
        'Added Fomori power tree selection for claimed Fomori characters',
        'Gorgon claimed characters automatically receive "Frail" fundamental power',
        'Added separate power display sections for original and claimed status powers',
        'Updated character validation to support dual heritage combinations',
        'Enhanced character review to show both original subfaction and claimed status',
        'Extended character data structure with claimedStatus, selectedFomoriTree, and claimedInnateTreeIds fields',
        'Added Sense Spirit as a fundamental power to Gorgon faction',
        'Added Sense Spirit as a fundamental power to Claimed Drone characters', 
        'Added Sense Spirit as a fundamental power to Claimed Fomori characters',
        'Enhanced Claimed Gorgon to receive both Frail and Sense Spirit fundamental powers',
        'Added free lore system for Ghouls during character creation',
        'Ghouls automatically receive Vampire Lore for free at character creation',
        'Added optional clan selection for Ghouls with clan-specific lore rewards',
        'Ghouls who select a clan receive that clan\'s lore for free (if restrictions are met)',
        'Added clan restriction warnings for special bloodlines (Giovanni, Lamia)',
        'Enhanced character creation UI with clan selection step for Ghoul characters',
        'Added free lore system for Sorcerers with fellowship selection',
        'Sorcerers who choose a fellowship receive both Mage Lore and fellowship-specific lore for free',
        'Enhanced fellowship selection UI to explain lore benefits for magical training',
        'Added "Back to Menu" button on first page of character creation for easy exit',
        'Improved character creation navigation - "Previous" works for subsequent pages',
        'Enhanced free lore preview system to show automatic lore assignments during character creation'
      ]
    },
    {
      version: '0.1.1',
      date: '2025-07-21',
      changes: [
        'Fixed Medium merit availability for non-wraith factions',
        'Improved merit filtering logic for "non-" prefix restrictions',
        'Added Warder of Man shifter tribe and power tree',
        'Warder of Man powers: Pence from Heaven, Fabricate Armor, Cloak Sight',
        'Gifted Kinfolk can now access Warder of Man powers',
        'Removed Bastet Gift power tree (no longer necessary)',
        'Improved lore UI scaling - increased display height by 50%',
        'Added "None" option to wraith legion selection',
        'Added "Enfant" guild option for wraiths',
        'Fixed sorcerer character creation - now gets 1 free dot instead of 3',
        'Fixed XP calculation inconsistencies throughout the application',
        'Removed redundant "Total XP" counter from character sheet header',
        'Fixed XP display labels - clarified "Available XP" vs "Total Earned"',
        'Fixed incorrect XP calculations in lore purchasing and other areas',
        'Corrected character card, sorting, CSV export, and dashboard XP labels',
        'Improved mobile scaling - better padding and responsive layouts',
        'Enhanced mobile character management screen with responsive grids',
        'Added responsive text sizes and improved mobile navigation',
        'Fixed mobile APK scaling issues with proper container sizing'
      ]
    },
    {
      version: '0.1.0',
      date: '2025-07-21',
      changes: [
        'Initial release of Shadow Accord Character Builder',
        'Character creation system for all factions',
        'Merit system with faction restrictions',
        'Power learning and advancement system',
        'XP tracking and management',
        'Character import/export functionality',
        'Dark mode and accessibility options',
        'Auto-save functionality'
      ]
    }
  ];
  const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);


  // ========================================
  // CSV DATA FROM SHADOW ACCORD RULEBOOK
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
valeren_warrior,Valeren Warrior,vampire,Sense Max Health,Body Wrack,Aggravated 1
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

  // Lore Search Function - moved after gameData initialization
  const searchLore = useCallback((query) => {
    if (!query.trim()) {
      setLoreSearchResults([]);
      return;
    }
    
    const searchTerm = query.toLowerCase();
    const results = gameData.lores.filter(lore => 
      (lore.lore_name && lore.lore_name.toLowerCase().includes(searchTerm)) ||
      (lore.description && lore.description.toLowerCase().includes(searchTerm)) ||
      (lore.category && lore.category.toLowerCase().includes(searchTerm))
    );
    
    setLoreSearchResults(results);
  }, [gameData.lores]);
  
  // Handle lore search input change
  const handleLoreSearch = useCallback((query) => {
    setLoreSearchQuery(query);
    searchLore(query);
  }, [searchLore]);

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
    amaranthCount: 0, // Track number of times vampire has committed amaranth
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
  const handleFactionChange = (character, factionId) => {
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
  const assignFreeLore = (character) => {
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
    return updateShifterInnateTreeIds(updatedCharacter);
  };

  // Handle shifter auspice selection
  const handleAuspiceSelection = (character, auspiceId) => {
    const updatedCharacter = { ...character, auspice: auspiceId };
    
    // Update innate trees based on breed, auspice, and tribe
    return updateShifterInnateTreeIds(updatedCharacter);
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
    
    return { ...character, innateTreeIds };
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
  // FACTION CHANGE SYSTEM
  // =========================
  
  // Get valid faction changes for a character
  const getValidFactionChanges = (character) => {
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
  const handleFactionChangeClick = useCallback((change) => {
    console.log('handleFactionChangeClick called with:', change);
    setSelectedFactionChange(change);
    setFactionChangeModal(true);
  }, []);

  // Handle faction change transformation
  const handleFactionChangeTransformation = (character, newFactionId) => {
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
  }, [gameData.merits, gameData.xpCosts, gameData.lores, gameData.powerTrees]);

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
        // Defensive programming: ensure lores is an array
        const loresArray = Array.isArray(character.lores) ? character.lores : 
          character.lores ? Object.keys(character.lores).map(loreId => ({ lore_id: loreId })) : [];
        return loresArray.some(lore => lore.lore_id === itemId);
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
          checkIn: character.checkInCount,
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
        characterUpdate = {
          ...characterUpdate,
          lores: [
            ...(characterUpdate.lores || []),
            { lore_id: itemId }
          ]
        };
        break;
      default:
        console.warn(`Unknown advancement type: ${type}`);
        break;
    }

    return characterUpdate;
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
    
    const newTotalXP = character.totalXP + refund;
    const newXpSpent = character.xpSpent - refund;
    const newLastModified = new Date().toISOString();

    let characterUpdate = {
      ...character,
      totalXP: newTotalXP,
      xpSpent: newXpSpent,
      lastModified: newLastModified
    };

    // Record XP refund in XP history (if refund > 0)
    if (refund > 0) {
      const xpEntry = {
        timestamp: newLastModified,
        type: 'gain',
        amount: refund,
        reason: `Removed ${type === 'merit' ? gameData.merits.find(m => m.merit_id === itemId)?.merit_name || itemId : itemId}`,
        previousTotal: character.totalXP,
        newTotal: newTotalXP
      };
      
      characterUpdate = {
        ...characterUpdate,
        xpHistory: [...(characterUpdate.xpHistory || []), xpEntry]
      };
    }

    // Apply reduction
    switch (type) {
      case 'skill':
        if (level === 0) {
          const { [itemId]: removed, ...remainingSkills } = characterUpdate.skills;
          characterUpdate = {
            ...characterUpdate,
            skills: remainingSkills
          };
        } else {
          characterUpdate = {
            ...characterUpdate,
            skills: {
              ...characterUpdate.skills,
              [itemId]: level
            }
          };
        }
        break;
      case 'power':
        const { [level]: removedLevel, ...remainingLevels } = characterUpdate.powers[itemId] || {};
        if (Object.keys(remainingLevels).length === 0) {
          const { [itemId]: removedPower, ...remainingPowers } = characterUpdate.powers;
          characterUpdate = {
            ...characterUpdate,
            powers: remainingPowers
          };
        } else {
          characterUpdate = {
            ...characterUpdate,
            powers: {
              ...characterUpdate.powers,
              [itemId]: remainingLevels
            }
          };
        }
        break;
      case 'merit':
        const merit = gameData.merits.find(m => m.merit_id === itemId);
        if (merit && merit.can_purchase_multiple === 'true') {
          if ((characterUpdate.merits[itemId] || 0) > 1) {
            characterUpdate = {
              ...characterUpdate,
              merits: {
                ...characterUpdate.merits,
                [itemId]: characterUpdate.merits[itemId] - 1
              }
            };
          } else {
            const { [itemId]: removedMerit, ...remainingMerits } = characterUpdate.merits;
            characterUpdate = {
              ...characterUpdate,
              merits: remainingMerits
            };
          }
        } else {
          const { [itemId]: removedMerit, ...remainingMerits } = characterUpdate.merits;
          characterUpdate = {
            ...characterUpdate,
            merits: remainingMerits
          };
        }
        break;
      case 'energy':
        if (characterUpdate.stats.energy > 1) {
          characterUpdate = {
            ...characterUpdate,
            stats: {
              ...characterUpdate.stats,
              energy: characterUpdate.stats.energy - 1,
              maxEnergy: characterUpdate.stats.maxEnergy - 1
            }
          };
        }
        break;
      case 'willpower':
        if (characterUpdate.stats.willpower > 1) {
          characterUpdate = {
            ...characterUpdate,
            stats: {
              ...characterUpdate.stats,
              willpower: characterUpdate.stats.willpower - 1
            }
          };
        }
        break;
      case 'virtue':
        if (characterUpdate.stats.virtue > 1) {
          characterUpdate = {
            ...characterUpdate,
            stats: {
              ...characterUpdate.stats,
              virtue: characterUpdate.stats.virtue - 1
            }
          };
        }
        break;
      case 'lore':
        if (characterUpdate.lores) {
          characterUpdate = {
            ...characterUpdate,
            lores: characterUpdate.lores.filter(lore => lore.lore_id !== itemId)
          };
        }
        break;
      default:
        console.warn(`Unknown reduction type: ${type}`);
        break;
    }

    return characterUpdate;
  }, [gameData, calculateReductionRefund]);

  // ==========================
  // IMPORT/EXPORT SYSTEM
  // ==========================
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

=== STATS ===
Energy: ${character.stats.energy}/${character.stats.maxEnergy}
Willpower: ${character.stats.willpower}
Virtue: ${character.stats.virtue}${character.faction === 'vampire' && character.generation ? `
Generation: ${character.generation}` : ''}${character.faction === 'shifter' && character.rank ? `
Rank: ${character.rank}` : ''}${character.faction === 'vampire' && character.amaranthCount && character.amaranthCount > 0 ? `
Amaranth Count: ${character.amaranthCount}` : ''}
Available XP: ${character.totalXP}
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

Generated by Shadow Accord Character Builder v${currentVersion}
`;
  }, [gameData.merits, currentVersion, formatDisplayText]);

  const exportCharacter = useCallback((character, format = 'json') => {
    const exportData = {
      character,
      exported: new Date().toISOString(),
      version: currentVersion,
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
        const csvHeaders = ['Name', 'Player', 'Faction', 'Subfaction', 'Available XP', 'XP Spent'];
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
      case 'pdf-debug':
        // Debug PDF export - fills all fields with their names
        (async () => {
          try {
            const templateBytes = await loadPdfFile('character-sheet-template-renamed.pdf');
            const pdfDoc = await PDFDocument.load(templateBytes);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            
            console.log('Creating debug PDF with all field names...');
            
            // Fill all text fields with their field names for debugging
            fields.forEach(field => {
              const fieldName = field.getName();
              try {
                if (field instanceof PDFTextField) {
                  field.setText(fieldName);
                } else if (field instanceof PDFCheckBox) {
                  // Test specific numbered checkboxes to understand layout
                  if (fieldName === 'Level1-1' || fieldName === 'Level2-1' || fieldName === 'Level3-1') {
                    field.check(); // First skill's dots
                  } else if (fieldName === 'Level1-2' || fieldName === 'Level2-2' || fieldName === 'Level3-2') {
                    field.check(); // Second skill's dots
                  } else if (fieldName === 'Level1-3' || fieldName === 'Level2-3' || fieldName === 'Level3-3') {
                    field.check(); // Third skill's dots
                  }
                }
              } catch (error) {
                console.warn(`Could not fill debug field ${fieldName}:`, error);
              }
            });
            
            const pdfBytes = await pdfDoc.save();
            await downloadFile(pdfBytes, 'debug_field_mapping.pdf', 'application/pdf');
            
            console.log('Debug PDF created! Check which skills line up with which Level checkboxes.');
          } catch (error) {
            console.error('Error creating debug PDF:', error);
            let errorMessage = 'Error generating debug PDF: ';
            
            if (error.message.includes('PDF file not found')) {
              errorMessage += 'PDF template file not found. This may be a build configuration issue.';
            } else if (error.message.includes('Failed to fetch PDF')) {
              errorMessage += 'Could not load PDF template. Check that the template file exists.';
            } else {
              errorMessage += error.message || 'Unknown error occurred.';
            }
            
            errorMessage += '\n\nRunning in: ' + (window.electronAPI?.isElectron ? 'Electron app' : 'Web browser');
            
            alert(errorMessage);
            console.error('Debug PDF Export Error Details:', {
              error: error,
              message: error.message,
              isElectron: window.electronAPI?.isElectron || false,
              templateFile: 'character-sheet-template-renamed.pdf'
            });
          }
        })();
        return;
      case 'pdf':
        // Handle PDF export separately - call it async
        (async () => {
          try {
            // Load the template PDF
            const templateBytes = await loadPdfFile('Shadow accord fixed fillable character sheet 7.24.pdf');
            
            // Load the PDF document
            const pdfDoc = await PDFDocument.load(templateBytes);
            const form = pdfDoc.getForm();
            
            // Debug: Log all available field names
            const fieldNames = form.getFields().map(field => field.getName());
            console.log('Available PDF fields:', fieldNames.sort());
            
            // Helper function to safely set form field
            const setFormField = (fieldName, value) => {
              try {
                const field = form.getField(fieldName);
                if (field instanceof PDFTextField) {
                  field.setText(String(value || ''));
                  console.log(`Set text field "${fieldName}" to "${value}"`);
                } else if (field instanceof PDFCheckBox) {
                  if (value) {
                    field.check();
                    console.log(`Checked box "${fieldName}"`);
                  }
                }
              } catch (error) {
                console.warn(`Could not set field ${fieldName}:`, error);
              }
            };

            // Helper function to get power cost based on power name
            const getPowerCost = (powerName) => {
              // Handle multiple powers (comma-separated)
              const powers = powerName.split(',').map(p => p.trim());
              const costs = powers.map(power => {
                // No Cost Powers (None/Passive)
                const noCostPowers = [
                  'Amaranth', 'Black Ichor', 'Clawed Form', 'Cloak Sight', 'Cognizance', 'Corrupted Powers',
                  'Detect Condition', 'Detect Dead', 'Detect Dying', 'Detect Fetter', 'Detect Incapacitated',
                  'Detect Taint', 'Disembodied', 'Draining', 'Endure', 'Escape', 'Expel Corpus',
                  'Fast Healing', 'Fetter Healing', 'Guidance', 'Health Exchange', 'Hellborn Investiture',
                  'Hero\'s Stand', 'Hidden Taint', 'Hide of the Wyrm', 'Leech of Fear', 'Mask of a Thousand Faces',
                  'Medicine', 'Might', 'Move Object', 'Paralyzing Bite', 'Paralyzing Touch', 'Pathos Exchange',
                  'Pathos Investment', 'Pence from Heaven', 'Poison Immunity', 'Portal Walk', 'Powerful Form',
                  'Ranged 2', 'Read Magic', 'Release Spirit', 'Scion of Evil', 'Secret Angst',
                  'Sense Amaranth', 'Sense Angst', 'Sense Desire', 'Sense Emotion', 'Sense Essence',
                  'Sense Fetter', 'Sense Gnosis', 'Sense Health', 'Sense Item', 'Sense Mental',
                  'Sense Pathos', 'Sense Rank', 'Sense Shadow', 'Sense Spirit', 'Sense Vitae',
                  'Silver Armor', 'Silver Tongue', 'Smell Fear', 'Step Sideways', 'Taint', 'Telepathy',
                  'Temporary Angst', 'Tentacles', 'Test Faction', 'Test Generation', 'Test Oath', 'Test Vitae',
                  'Totemic Form', 'Toughness', 'Umbra Drain', 'Umbra Sight', 'Vengeance of Samiel',
                  'Venom Blood', 'Venomous Bite', 'Visions', 'War Form'
                ];
                
                // 1 Energy Cost
                const oneEnergyCost = [
                  'Aggravated 1', 'Aggravated Claws', 'Appear', 'Avert', 'Beast Mind',
                  'Body Wrack', 'Cloak', 'Cloak Gathering', 'Confusion', 'Control Body', 'Control Voice',
                  'Craving', 'Dark Weapon', 'Daze', 'Decay', 'Derange', 'Despair', 'Disable',
                  'Disarm', 'Disquiet', 'Entrancement', 'Exorcism', 'Fabricate Armor', 'Fetter Consumption',
                  'Fetter Creation', 'Fire 2', 'Fire 4', 'Fire Weapon', 'Forgetful Mind', 'Gauntlet Walk',
                  'Hallucination', 'Hypnotism', 'Imitate', 'Induce Catharsis', 'Induce Frenzy',
                  'Induce Sin', 'Insight', 'Light Weapon', 'Meditate', 'Mimic', 'Monsters',
                  'Obedience', 'Passion', 'Possession', 'Ranged 4', 'Razor Claws', 'Realm Grasp',
                  'Rend the Lifeweb', 'Reverse Mimic', 'Root', 'Sanctuary', 'Sense Confidence',
                  'Sense Demon', 'Sense Maximum Health', 'Serenity', 'Shadow Coax', 'Shatter',
                  'Silence', 'Silver Claws', 'Snarl', 'Song of Rage', 'Stonehand Punch', 'Subjugate',
                  'Taunt', 'Terror', 'True Form', 'Umbra Strike', 'Weaponry', 'Wither', 'Withstand',
                  'Woadling', 'Wounding Lies'
                ];
                
                // 1 Willpower Cost
                const oneWillpowerCost = [
                  'Avoidance', 'Frenzy Control', 'Materialize', 'Resilience', 'Revive'
                ];
                
                // 2 Energy Cost
                const twoEnergyCost = [
                  'Balefire', 'Blood Buff', 'Brittle Bones', 'Brutal Strike', 'Cleanse',
                  'Majesty', 'Mass Taunt', 'Paralyze', 'Venom'
                ];
                
                // 3 Energy Cost
                const threeEnergyCost = [
                  'Enhanced Blood Buff'
                ];
                
                // 4 Energy Cost
                const fourEnergyCost = [
                  'Conditioning', 'Hasty Escape', 'Meld'
                ];
                
                // 1 Virtue Cost
                const oneVirtueCost = [
                  'Bestial Frenzy', 'Bestial Healing'
                ];
                
                // Special cases
                if (power === 'War Form' || power === 'Step Sideways') {
                  return 'Req. 1+ Energy';
                }
                if (power === 'Weaponry' && /* targeting self */ false) {
                  return 'No Cost'; // Special case: Weaponry costs no Energy if targeting self
                }
                
                // Check power against cost categories
                if (noCostPowers.includes(power)) {
                  return 'None';
                } else if (oneEnergyCost.includes(power)) {
                  return '1 Energy';
                } else if (oneWillpowerCost.includes(power)) {
                  return '1 Willpower';
                } else if (twoEnergyCost.includes(power)) {
                  return '2 Energy';
                } else if (threeEnergyCost.includes(power)) {
                  return '3 Energy';
                } else if (fourEnergyCost.includes(power)) {
                  return '4 Energy';
                } else if (oneVirtueCost.includes(power)) {
                  return '1 Virtue';
                } else {
                  return 'Variable';
                }
              });
              
              // If all powers have the same cost, return that cost
              // Otherwise return the costs joined with commas
              const uniqueCosts = [...new Set(costs)];
              return uniqueCosts.length === 1 ? uniqueCosts[0] : costs.join(', ');
            };

            // Helper function to format subfaction display
            const getSubfactionDisplay = (character) => {
              const subfactions = [];
              if (character.subfaction) subfactions.push(character.subfaction);
              if (character.clan) subfactions.push(character.clan);
              if (character.tribe) subfactions.push(character.tribe);
              if (character.breed) subfactions.push(character.breed);
              if (character.auspice) subfactions.push(character.auspice);
              if (character.guild) subfactions.push(character.guild);
              if (character.fellowship) subfactions.push(character.fellowship);
              if (character.selectedClan) subfactions.push(character.selectedClan);
              if (character.shadowArchetype) subfactions.push(character.shadowArchetype);
              return subfactions.join(', ');
            };

            console.log('Filling PDF with character:', character);
            
            // ===== BASIC CHARACTER INFORMATION =====
            setFormField('Player Name', character.player || '');
            setFormField('Character Name', character.name || '');
            setFormField('FactionRow1', formatDisplayText(character.faction || ''));
            
            // Fill subfactions (special handling for shifters)
            if (character.faction === 'shifter') {
              // For shifters: Tribe in field 1, Breed in field 2, Auspice in field 3
              setFormField('Subfaction1', formatDisplayText(character.tribe || character.subfaction || ''));
              setFormField('Subfaction2', formatDisplayText(character.breed || ''));
              setFormField('Subfaction3', formatDisplayText(character.auspice || ''));
              console.log('Shifter subfactions:', {
                tribe: character.tribe || character.subfaction,
                breed: character.breed,
                auspice: character.auspice
              });
            } else {
              // For non-shifters: use existing logic
              const subfactions = getSubfactionDisplay(character).split(', ').filter(s => s.trim());
              console.log('Non-shifter subfactions:', subfactions);
              setFormField('Subfaction1', subfactions[0] || '');
              setFormField('Subfaction2', subfactions[1] || '');
              setFormField('Subfaction3', subfactions[2] || '');
            }
            
            // Fill advantages/weaknesses if available
            if (character.advantages) {
              const advantageLines = character.advantages.split('\n');
              advantageLines.forEach((line, index) => {
                if (index < 4) { // AdvweaknessRow1 through AdvweaknessRow4
                  setFormField(`AdvweaknessRow${index + 1}`, line);
                }
              });
            }
            
            setFormField('Patron', character.patron || '');
            // Fill Gen/Rank only for shifters (rank) and vampires (generation)
            let genRankValue = '';
            if (character.faction === 'shifter' && character.rank) {
              genRankValue = character.rank;
            } else if (character.faction === 'vampire' && character.generation) {
              genRankValue = String(character.generation);
            }
            setFormField('Gen/Rank', genRankValue);
            
            // Fill Amaranth count for vampires (using Passion field if vampire)
            if (character.faction === 'vampire' && character.amaranthCount && character.amaranthCount > 0) {
              setFormField('Passion', `Amaranth: ${character.amaranthCount}`);
            } else {
              setFormField('Passion', character.passion || '');
            }
            
            // Fill additional character fields
            setFormField('Personal Sigil', character.sigil || '');
            setFormField('Shadow/Deed Name/Sire1', character.shadowName || character.deedName || character.sire || '');
            if (character.shadowName && character.deedName) {
              setFormField('Shadow/Deed Name/Sire2', character.deedName);
            } else if (character.shadowName && character.sire) {
              setFormField('Shadow/Deed Name/Sire2', character.sire);
            }
            
            // ===== STATS SECTION =====
            console.log('Character stats:', character.stats);
            setFormField('Health', character.stats?.health ? String(character.stats.health) : '');
            setFormField('Energy Amount', character.stats?.energy ? String(character.stats.energy) : '');
            setFormField('Energy Type', character.stats?.energyType || 'Energy');
            setFormField('Virtue', character.stats?.virtue ? String(character.stats.virtue) : '');
            setFormField('Devoured', character.stats?.devoured ? String(character.stats.devoured) : '');

            // Fill Willpower dots (WP1, WP2, etc.)
            if (character.stats?.willpower) {
              console.log(`Filling WP dots 1-${character.stats.willpower}`);
              for (let i = 1; i <= Math.min(character.stats.willpower, 10); i++) {
                setFormField(`WP${i}`, true);
              }
            }

            // Fill Virtue dots (Virtue1, Virtue2, etc.)
            if (character.stats?.virtue) {
              console.log(`Filling Virtue dots 1-${character.stats.virtue}`);
              for (let i = 1; i <= Math.min(character.stats.virtue, 10); i++) {
                setFormField(`Virtue${i}`, true);
              }
            }

            // ===== INNATE POWER TREES SECTION (Fields 1-3) =====
            console.log('=== INNATE TREES SECTION ===');
            console.log('character.innateTreeIds:', character.innateTreeIds);
            
            if (character.innateTreeIds && character.innateTreeIds.length > 0 && gameData.powerTrees) {
              character.innateTreeIds.forEach((treeId, index) => {
                if (index < 3) { // Only first 3 innate trees (fields 1-3)
                  const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                  if (tree) {
                    // Fill tree name in Innates fields 1-3
                    const treeFieldName = `Innates ${index + 1}`;
                    console.log(`Setting innate tree ${index + 1}: ${tree.tree_name} → ${treeFieldName}`);
                    setFormField(treeFieldName, formatDisplayText(tree.tree_name));
                    
                    // Fill power level dots if character has powers in this tree
                    if (character.powers && character.powers[treeId]) {
                      const powers = character.powers[treeId];
                      console.log(`${tree.tree_name} powers:`, powers);
                      
                      // Fill dots only for specific levels that have powers, not all previous levels
                      Object.keys(powers).forEach(level => {
                        const levelNum = parseInt(level);
                        if (levelNum >= 1 && levelNum <= 3 && powers[level]) {
                          const dotFieldName = `Level${levelNum}-${index + 1}`;
                          console.log(`Filling specific dot: ${dotFieldName} for ${tree.tree_name} level ${levelNum}`);
                          setFormField(dotFieldName, true);
                        }
                      });
                    }
                  }
                }
              });
            }

            // ===== LEARNED POWER TREES SECTION (Fields 4-48) =====
            console.log('=== LEARNED TREES SECTION ===');
            
            if (character.powers && gameData.powerTrees) {
              const learnedTrees = Object.keys(character.powers).filter(treeId => 
                !character.innateTreeIds?.includes(treeId)
              );
              
              console.log('Learned trees:', learnedTrees);
              
              // First half: Fill "Learned Powers" fields (1-23) with first 23 learned trees
              learnedTrees.slice(0, 23).forEach((treeId, index) => {
                const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                const learnedFieldIndex = index + 1; // Learned Powers 1-23
                
                if (tree) {
                  // Fill tree name in Learned Powers fields
                  const treeFieldName = `Learned Powers ${learnedFieldIndex}`;
                  console.log(`Setting learned tree (first half) ${learnedFieldIndex}: ${tree.tree_name} → ${treeFieldName}`);
                  setFormField(treeFieldName, formatDisplayText(tree.tree_name));
                  
                  // Fill power level dots for first half (fields 4-26)
                  const dotFieldIndex = learnedFieldIndex + 3; // Fields 4-26
                  if (character.powers && character.powers[treeId]) {
                    const powers = character.powers[treeId];
                    console.log(`${tree.tree_name} powers (first half):`, powers);
                    
                    // Fill dots only for specific levels that have powers
                    Object.keys(powers).forEach(level => {
                      const levelNum = parseInt(level);
                      if (levelNum >= 1 && levelNum <= 3 && powers[level]) {
                        const dotFieldName = `Level${levelNum}-${dotFieldIndex}`;
                        console.log(`Filling specific learned dot (first half): ${dotFieldName} for ${tree.tree_name} level ${levelNum}`);
                        setFormField(dotFieldName, true);
                      }
                    });
                  }
                }
              });
              
              // Second half: Fill Row0-Row21 fields with remaining learned trees (up to 22 more)
              learnedTrees.slice(23, 45).forEach((treeId, index) => {
                const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                if (tree) {
                  const rowFieldName = `Row${index}`;
                  console.log(`Setting learned tree (second half) row ${index}: ${tree.tree_name} → ${rowFieldName}`);
                  setFormField(rowFieldName, formatDisplayText(tree.tree_name));
                  
                  // Fill power level dots for second half (fields 27-48)
                  const dotFieldIndex = index + 27; // Fields 27-48
                  if (character.powers && character.powers[treeId]) {
                    const powers = character.powers[treeId];
                    console.log(`${tree.tree_name} powers (second half):`, powers);
                    
                    // Fill dots only for specific levels that have powers
                    Object.keys(powers).forEach(level => {
                      const levelNum = parseInt(level);
                      if (levelNum >= 1 && levelNum <= 3 && powers[level]) {
                        const dotFieldName = `Level${levelNum}-${dotFieldIndex}`;
                        console.log(`Filling specific learned dot (second half): ${dotFieldName} for ${tree.tree_name} level ${levelNum}`);
                        setFormField(dotFieldName, true);
                      }
                    });
                  }
                }
              });
            }

            // ===== SKILLS SECTION (Fields 49-63) =====
            console.log('=== SKILLS SECTION ===');
            let skillFieldIndex = 1; // Start from SkillsRow1
            
            if (character.skills && gameData.skills) {
              gameData.skills.forEach(skill => {
                const skillLevel = character.skills[skill.skill_id];
                if (skillLevel && skillFieldIndex <= 15) { // SkillsRow1-15 for skills
                  const skillFieldName = `SkillsRow${skillFieldIndex}`;
                  console.log(`Setting skill: ${skill.skill_name} (level ${skillLevel}) → ${skillFieldName}`);
                  
                  // Fill skill name
                  setFormField(skillFieldName, formatDisplayText(skill.skill_name));
                  
                  // Fill skill level dots (fields 49-63 map to Level dots 49-63)
                  const dotFieldIndex = skillFieldIndex + 48; // Fields 49-63
                  for (let dotLevel = 1; dotLevel <= Math.min(skillLevel, 3); dotLevel++) {
                    const dotFieldName = `Level${dotLevel}-${dotFieldIndex}`;
                    console.log(`Filling skill dot: ${dotFieldName} for ${skill.skill_name}`);
                    setFormField(dotFieldName, true);
                  }
                  
                  skillFieldIndex++;
                }
              });
            }

            // ===== CORRUPT POWERS CHECKBOXES (1-45 for learned powers) =====
            console.log('=== CORRUPT POWERS CHECKBOXES ===');
            
            if (character.powers && gameData.powerTrees) {
              const learnedTrees = Object.keys(character.powers).filter(treeId => 
                !character.innateTreeIds?.includes(treeId)
              );
              
              // Define corrupt/Wyrm-aligned power trees
              const corruptTrees = [
                'corruption', 'cunning', 'defiling', 'fear', 'madness_wyrm', 'strength',
                'death', 'demonology', 'daimoinon', 'dark_thaumaturgy', 'thaumaturgy_dark_path_1',
                'thaumaturgy_dark_path_2', 'thaumaturgy_dark_path_3', 'thaumaturgy_dark_path_4',
                'thaumaturgy_dark_path_5'
              ];
              
              // Map checkboxes 1-45 to learned powers (fields 4-48)
              learnedTrees.forEach((treeId, index) => {
                const checkboxIndex = index + 1; // Checkboxes 1-45
                if (checkboxIndex <= 45) { // Only use checkboxes 1-45
                  const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                  if (tree) {
                    // Check if this is a corrupt/Wyrm tree
                    const isCorrupt = corruptTrees.includes(treeId) || 
                                     tree.tree_name.toLowerCase().includes('wyrm') ||
                                     tree.tree_name.toLowerCase().includes('dark') ||
                                     tree.tree_name.toLowerCase().includes('corruption');
                    
                    if (isCorrupt) {
                      const checkboxFieldName = `Check Box${checkboxIndex}`;
                      console.log(`Marking corrupt power checkbox ${checkboxIndex}: ${tree.tree_name} → ${checkboxFieldName}`);
                      setFormField(checkboxFieldName, true);
                    }
                  }
                }
              });
            }

            // Fill detailed powers on page 2
            // Structure: Source/Tree Name 1-33, each tree gets 3 powers (Power 1-105)
            if (character.powers && gameData.powerTrees) {
              let treeIndex = 1; // Source/Tree Name index (1-33)
              let powerIndex = 1; // Power index (1-105)
              
              Object.keys(character.powers).forEach(treeId => {
                const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                if (tree && treeIndex <= 33) {
                  const powers = character.powers[treeId];
                  
                  // Fill tree name in Source/Tree Name field (remove "Gift" from name)
                  const cleanTreeName = tree.tree_name.replace(/\s*Gift\s*/i, '').trim();
                  setFormField(`Source/Tree Name ${treeIndex}`, formatDisplayText(cleanTreeName));
                  console.log(`Setting Source/Tree Name ${treeIndex}: ${cleanTreeName} (original: ${tree.tree_name})`);
                  
                  // Fill exactly 3 powers for this tree (levels 1, 2, 3)
                  for (let level = 1; level <= 3; level++) {
                    if (powerIndex <= 105) { // Don't exceed Power 105
                      let powerName = '';
                      
                      // Check if character has this power level
                      if (powers[level]) {
                        // Get the power names for this level from the tree data
                        const levelPowersString = tree[`level${level}_powers`];
                        if (levelPowersString) {
                          // Split pipe-delimited power names and join them
                          const levelPowers = levelPowersString.split('|').filter(p => p.trim());
                          powerName = levelPowers.join(', '); // Join multiple powers with commas
                        } else {
                          // Fallback: generate power name from tree and level
                          powerName = `${tree.tree_name} ${level}`;
                        }
                      }
                      
                      setFormField(`Power ${powerIndex}`, powerName);
                      
                      // Set power cost based on power name
                      let powerCost = '';
                      if (powerName) {
                        powerCost = getPowerCost(powerName);
                      }
                      setFormField(`Cost ${powerIndex}`, powerCost);
                      
                      console.log(`Setting Power ${powerIndex}: "${powerName}" for ${tree.tree_name} level ${level} (has power: ${!!powers[level]})`);
                      powerIndex++;
                    }
                  }
                  
                  treeIndex++;
                }
              });
            }

            // Fill merits using correct field names
            if (character.merits && gameData.merits) {
              let meritIndex = 1;
              console.log('Filling merits, character.merits:', character.merits);
              Object.keys(character.merits).forEach(meritId => {
                const merit = gameData.merits.find(m => m.merit_id === meritId);
                if (merit && meritIndex <= 8) {
                  const meritValue = character.merits[meritId];
                  console.log('Processing merit:', merit, 'value:', meritValue);
                  // Ensure merit name is safe to format
                  const meritName = merit.merit_name || merit.name || `Merit ${meritId}`;
                  const meritText = formatDisplayText(meritName);
                  setFormField(`Merit${meritIndex}`, meritText);
                  meritIndex++;
                }
              });
            }

            // Fill lores using correct field names
            if (character.lores && character.lores.length > 0) {
              console.log('Filling lores:', character.lores);
              // Available lore fields: " Lore Row1-7" (with leading space), "Lore Row8-15" (no space)
              const loreFields = [
                ' Lore Row1', ' Lore Row2', ' Lore Row3', ' Lore Row4', ' Lore Row5', ' Lore Row6', ' Lore Row7',
                'Lore Row8', 'Lore Row9', 'Lore Row10', 'Lore Row11', 'Lore Row12', 'Lore Row13', 'Lore Row14', 'Lore Row15'
              ];
              
              character.lores.forEach((lore, index) => {
                if (index < loreFields.length) {
                  const loreField = loreFields[index];
                  // Handle different lore data structures
                  let loreName = '';
                  if (typeof lore === 'string') {
                    loreName = lore;
                  } else if (typeof lore === 'object' && lore !== null) {
                    // Try to get name from the object
                    loreName = lore.name || lore.lore_name || lore.title || '';
                    
                    // If no name found but has lore_id, try to look up from game data
                    if (!loreName && lore.lore_id && gameData.lores) {
                      const loreData = gameData.lores.find(l => l.lore_id === lore.lore_id);
                      loreName = loreData ? (loreData.lore_name || loreData.name || '') : lore.lore_id;
                    }
                    
                    // Fallback to lore_id if still no name
                    if (!loreName && lore.lore_id) {
                      loreName = lore.lore_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                  }
                  console.log(`Setting lore field "${loreField}" to "${formatDisplayText(loreName)}" (from:`, lore, ')');
                  setFormField(loreField, formatDisplayText(loreName));
                }
              });
            }

            // Fill notes using correct field names
            if (character.notes) {
              const noteLines = character.notes.split('\n');
              noteLines.forEach((line, index) => {
                if (index < 6) { // Attunement  NotesRow1 through Attunement  NotesRow6
                  setFormField(`Attunement  NotesRow${index + 1}`, line);
                }
              });
            }

            // Generate and download the filled PDF
            const pdfBytes = await pdfDoc.save();
            await downloadFile(pdfBytes, `${character.name || 'character'}_shadowaccord_sheet.pdf`, 'application/pdf');
            
          } catch (error) {
            console.error('Error exporting to PDF:', error);
            let errorMessage = 'Error generating PDF: ';
            
            if (error.message.includes('PDF file not found')) {
              errorMessage += 'PDF template file not found. This may be a build configuration issue.';
            } else if (error.message.includes('Failed to fetch PDF')) {
              errorMessage += 'Could not load PDF template. Check that the template file exists.';
            } else if (error.message.includes('No PDF header found')) {
              errorMessage += 'Invalid PDF template file.';
            } else {
              errorMessage += error.message || 'Unknown error occurred.';
            }
            
            errorMessage += '\n\nRunning in: ' + (window.electronAPI?.isElectron ? 'Electron app' : 'Web browser');
            
            alert(errorMessage);
            console.error('PDF Export Error Details:', {
              error: error,
              message: error.message,
              stack: error.stack,
              isElectron: window.electronAPI?.isElectron || false,
              templateFile: 'Shadow accord fixed fillable character sheet 7.24.pdf'
            });
          }
        })();
        return; // Exit early since PDF export is async
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
  }, [generateCharacterSheet, gameData.merits, gameData.powerTrees, gameData.skills, gameData.lores, formatDisplayText]);

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
      <div className="w-full max-w-4xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
        {/* Enhanced Header */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-400">Shadow Accord Character Builder</h1>
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
            <div className="text-sm text-gray-400">Available XP</div>
          </div>
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-5">
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
            onClick={() => setCurrentMode('power-index')}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Search className="w-8 h-8 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Power Index</h3>
            <p className="text-sm text-gray-400">Searchable power database</p>
          </button>

          <button
            onClick={() => setCurrentMode('settings')}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Settings</h3>
            <p className="text-sm text-gray-400">Customize interface options</p>
          </button>

          <button
            onClick={() => setCurrentMode('changelog')}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Book className="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Changelog</h3>
            <p className="text-sm text-gray-400">View version history</p>
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
                    version: currentVersion
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
    console.log('renderCharacterCreation called');
    console.log('newCharacter:', newCharacter);
    console.log('factionChangeCreationMode:', factionChangeCreationMode);
    
    if (!newCharacter) {
      console.log('No newCharacter, returning null');
      return null;
    }

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
                    
                    {/* Special explanatory text for old Claimed subfactions */}
                    {subfaction.subfaction_id === 'claimed_gorgon' && (
                      <div className="mt-2 p-2 bg-purple-900 bg-opacity-30 rounded border border-purple-700">
                        <p className="text-xs text-purple-200 mb-1">
                          <strong>🐍 Legacy Option:</strong> This creates a pure Gorgon character.
                        </p>
                        <p className="text-xs text-purple-300">
                          💡 <strong>Want dual heritage?</strong> Choose Sorcerer, Ghoul, Kinfolk, or Commoner first, 
                          then select "Claimed by Gorgon" in the next step for characters like "Former Sorcerer claimed by Gorgon."
                        </p>
                      </div>
                    )}
                    
                    {subfaction.subfaction_id === 'claimed_fomori' && (
                      <div className="mt-2 p-2 bg-red-900 bg-opacity-30 rounded border border-red-700">
                        <p className="text-xs text-red-200 mb-1">
                          <strong>👹 Legacy Option:</strong> This creates a pure Fomori character.
                        </p>
                        <p className="text-xs text-red-300">
                          💡 <strong>Want dual heritage?</strong> Choose Sorcerer, Ghoul, Kinfolk, or Commoner first, 
                          then select "Claimed by Fomori" in the next step for characters like "Former Ghoul possessed by Fomori Bane."
                        </p>
                      </div>
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
                                  // Deselect tree and remove associated derangement if it's madness or ruin
                                  let updatedSelfNerfs = newCharacter.selfNerfs;
                                  if (tree.tree_id === 'madness') {
                                    updatedSelfNerfs = newCharacter.selfNerfs.filter(nerf => 
                                      nerf.source !== 'madness_tree'
                                    );
                                  } else if (tree.tree_id === 'ruin') {
                                    updatedSelfNerfs = newCharacter.selfNerfs.filter(nerf => 
                                      nerf.source !== 'ruin_tree'
                                    );
                                  }
                                  
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id),
                                    selfNerfs: updatedSelfNerfs
                                  });
                                } else if (canSelect) {
                                  // Select tree - if madness or ruin, require derangement selection
                                  if (tree.tree_id === 'madness' || tree.tree_id === 'ruin') {
                                    const derangementList = [
                                      'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                                      'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                                      'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                                    ];
                                    
                                    const pathName = tree.tree_id === 'madness' ? 'Madness' : 'Ruin';
                                    const selectedDerangement = prompt(
                                      `The ${pathName} path inflicts psychological damage. Choose a derangement:\n\n` +
                                      derangementList.map((d, i) => `${i + 1}. ${d}`).join('\n') +
                                      '\n\nEnter the number (1-12) of your chosen derangement:'
                                    );
                                    
                                    const derangementIndex = parseInt(selectedDerangement) - 1;
                                    if (derangementIndex >= 0 && derangementIndex < derangementList.length) {
                                      const chosenDerangement = derangementList[derangementIndex];
                                      
                                      // Add the tree and the derangement
                                      const newDerangement = {
                                        id: Date.now(),
                                        name: `Deranged - ${chosenDerangement}`,
                                        description: `Character has the Deranged flaw from practicing the ${pathName} path, specifically manifesting as ${chosenDerangement}.`,
                                        type: 'derangement',
                                        category: 'Deranged',
                                        source: `${tree.tree_id}_tree`
                                      };
                                      
                                      setNewCharacter({
                                        ...newCharacter,
                                        innateTreeIds: [...newCharacter.innateTreeIds, tree.tree_id],
                                        selfNerfs: [...newCharacter.selfNerfs, newDerangement]
                                      });
                                    } else {
                                      alert('Invalid selection. Please try again and choose a number from 1-12.');
                                      return;
                                    }
                                  } else {
                                    // Regular tree selection
                                    setNewCharacter({
                                      ...newCharacter,
                                      innateTreeIds: [...newCharacter.innateTreeIds, tree.tree_id]
                                    });
                                  }
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
                    
                    <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg border border-green-500 mb-3">
                      <p className="text-sm text-green-300">
                        💡 <strong>Fellowship Benefits:</strong> If you select a fellowship, you automatically receive both 
                        Mage Lore and your fellowship's specific lore for free. This represents your training in both 
                        general magical theory and your fellowship's specialized techniques.
                      </p>
                    </div>
                    
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
              
              {/* Black Spiral Dancer Mandatory Derangement & Wyrm Gift Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction === 'black_spiral_dancer' && (
                <div className="space-y-6 mt-5">
                  {/* Mandatory Derangement for Black Spiral Dancers */}
                  <div className={`${themeClasses.card} p-5`}>
                    <h4 className="text-xl font-bold mb-2 text-red-400">⚠️ Mandatory Derangement Selection</h4>
                    <p className="text-gray-400 mb-3">
                      As a Black Spiral Dancer, you must select one derangement that represents the psychological corruption 
                      and madness inflicted by the Wyrm. This is a mandatory character limitation.
                    </p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                        'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                        'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                      ].map(derangement => {
                        const isSelected = newCharacter.selfNerfs.some(nerf => 
                          nerf.name === `Deranged - ${derangement}` && nerf.source === 'black_spiral_dancer'
                        );
                        
                        return (
                          <button
                            key={derangement}
                            onClick={() => {
                              if (isSelected) {
                                // Remove the derangement
                                setNewCharacter({
                                  ...newCharacter,
                                  selfNerfs: newCharacter.selfNerfs.filter(nerf => 
                                    !(nerf.name === `Deranged - ${derangement}` && nerf.source === 'black_spiral_dancer')
                                  )
                                });
                              } else {
                                // Remove any existing Black Spiral Dancer derangement first (only one allowed)
                                const filteredNerfs = newCharacter.selfNerfs.filter(nerf => 
                                  nerf.source !== 'black_spiral_dancer'
                                );
                                
                                // Add the new derangement
                                const newNerf = {
                                  id: Date.now(),
                                  name: `Deranged - ${derangement}`,
                                  description: `Character has the Deranged flaw from Wyrm corruption as a Black Spiral Dancer, specifically manifesting as ${derangement}.`,
                                  type: 'derangement',
                                  category: 'Deranged',
                                  source: 'black_spiral_dancer'
                                };
                                
                                setNewCharacter({
                                  ...newCharacter,
                                  selfNerfs: [...filteredNerfs, newNerf]
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
                              <h5 className="font-bold text-lg">{derangement}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Selected Derangement:</span>
                        <span className={`text-sm font-medium ${
                          newCharacter.selfNerfs.some(nerf => nerf.source === 'black_spiral_dancer') ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {newCharacter.selfNerfs.find(nerf => nerf.source === 'black_spiral_dancer')?.name.replace('Deranged - ', '') || 'None'}
                        </span>
                      </div>
                      
                      {!newCharacter.selfNerfs.some(nerf => nerf.source === 'black_spiral_dancer') && (
                        <p className="text-sm text-red-400 mt-2">
                          ⚠️ You must select a derangement to continue. This is mandatory for Black Spiral Dancers.
                        </p>
                      )}
                      
                      {newCharacter.selfNerfs.some(nerf => nerf.source === 'black_spiral_dancer') && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm">
                            {newCharacter.selfNerfs.find(nerf => nerf.source === 'black_spiral_dancer')?.name.replace('Deranged - ', '')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                      <p className="text-sm text-red-300">
                        🐺 <strong>Wyrm Corruption:</strong> Black Spiral Dancers are wholly corrupted by the Wyrm. This derangement represents the mental trauma and madness inflicted by your tribal corruption.
                      </p>
                    </div>
                  </div>
                  
                  {/* Wyrm Gift Selection */}
                  <div className={`${themeClasses.card} p-5`}>
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
                                // Remove derangement if deselecting madness_wyrm
                                let updatedSelfNerfs = newCharacter.selfNerfs;
                                if (tree.tree_id === 'madness_wyrm') {
                                  updatedSelfNerfs = newCharacter.selfNerfs.filter(nerf => 
                                    nerf.source !== 'madness_wyrm_gift'
                                  );
                                }
                                
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id),
                                  selfNerfs: updatedSelfNerfs
                                });
                              } else {
                                // Remove any other Wyrm gifts and add this one
                                const filteredTreeIds = newCharacter.innateTreeIds.filter(id => !wyrmGifts.includes(id));
                                
                                // If selecting madness_wyrm, require additional derangement
                                if (tree.tree_id === 'madness_wyrm') {
                                  const derangementList = [
                                    'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                                    'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                                    'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                                  ];
                                  
                                  const selectedDerangement = prompt(
                                    `The Madness (Wyrm) gift inflicts additional psychological damage beyond your tribal corruption. Choose a second derangement:\n\n` +
                                    derangementList.map((d, i) => `${i + 1}. ${d}`).join('\n') +
                                    '\n\nEnter the number (1-12) of your chosen derangement, or click Cancel to select this gift without additional derangement:'
                                  );
                                  
                                  if (selectedDerangement === null) {
                                    // User clicked Cancel - just add the tree without additional derangement
                                    setNewCharacter({
                                      ...newCharacter,
                                      innateTreeIds: [...filteredTreeIds, tree.tree_id]
                                    });
                                  } else {
                                    const derangementIndex = parseInt(selectedDerangement) - 1;
                                    if (derangementIndex >= 0 && derangementIndex < derangementList.length) {
                                      const chosenDerangement = derangementList[derangementIndex];
                                      
                                      // Add the tree and the additional derangement
                                      const newDerangement = {
                                        id: Date.now(),
                                        name: `Deranged - ${chosenDerangement}`,
                                        description: `Character has an additional Deranged flaw from the Madness (Wyrm) gift beyond their tribal corruption, specifically manifesting as ${chosenDerangement}.`,
                                        type: 'derangement',
                                        category: 'Deranged',
                                        source: 'madness_wyrm_gift'
                                      };
                                      
                                      setNewCharacter({
                                        ...newCharacter,
                                        innateTreeIds: [...filteredTreeIds, tree.tree_id],
                                        selfNerfs: [...newCharacter.selfNerfs, newDerangement]
                                      });
                                    } else {
                                      alert('Invalid selection. Please try again and choose a number from 1-12, or click Cancel.');
                                      return;
                                    }
                                  }
                                } else {
                                  // Regular tree selection
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: [...filteredTreeIds, tree.tree_id]
                                  });
                                }
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
                </div>
              )}
              
              {/* Fallen Fera Mandatory Derangement & Wyrm Gift Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction === 'fallen_fera' && (
                <div className="space-y-6 mt-5">
                  {/* Mandatory Derangement for Fallen Fera */}
                  <div className={`${themeClasses.card} p-5`}>
                    <h4 className="text-xl font-bold mb-2 text-red-400">⚠️ Mandatory Derangement Selection</h4>
                    <p className="text-gray-400 mb-3">
                      As a Fallen Fera, you must select one derangement that represents the psychological corruption 
                      and trauma inflicted by the Wyrm on your kind. This is a mandatory character limitation.
                    </p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                        'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                        'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                      ].map(derangement => {
                        const isSelected = newCharacter.selfNerfs.some(nerf => 
                          nerf.name === `Deranged - ${derangement}` && nerf.source === 'fallen_fera'
                        );
                        
                        return (
                          <button
                            key={derangement}
                            onClick={() => {
                              if (isSelected) {
                                // Remove the derangement
                                setNewCharacter({
                                  ...newCharacter,
                                  selfNerfs: newCharacter.selfNerfs.filter(nerf => 
                                    !(nerf.name === `Deranged - ${derangement}` && nerf.source === 'fallen_fera')
                                  )
                                });
                              } else {
                                // Remove any existing Fallen Fera derangement first (only one allowed)
                                const filteredNerfs = newCharacter.selfNerfs.filter(nerf => 
                                  nerf.source !== 'fallen_fera'
                                );
                                
                                // Add the new derangement
                                const newNerf = {
                                  id: Date.now(),
                                  name: `Deranged - ${derangement}`,
                                  description: `Character has the Deranged flaw from Wyrm corruption as a Fallen Fera, specifically manifesting as ${derangement}.`,
                                  type: 'derangement',
                                  category: 'Deranged',
                                  source: 'fallen_fera'
                                };
                                
                                setNewCharacter({
                                  ...newCharacter,
                                  selfNerfs: [...filteredNerfs, newNerf]
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
                              <h5 className="font-bold text-lg">{derangement}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Selected Derangement:</span>
                        <span className={`text-sm font-medium ${
                          newCharacter.selfNerfs.some(nerf => nerf.source === 'fallen_fera') ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {newCharacter.selfNerfs.find(nerf => nerf.source === 'fallen_fera')?.name.replace('Deranged - ', '') || 'None'}
                        </span>
                      </div>
                      
                      {!newCharacter.selfNerfs.some(nerf => nerf.source === 'fallen_fera') && (
                        <p className="text-sm text-red-400 mt-2">
                          ⚠️ You must select a derangement to continue. This is mandatory for Fallen Fera.
                        </p>
                      )}
                      
                      {newCharacter.selfNerfs.some(nerf => nerf.source === 'fallen_fera') && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm">
                            {newCharacter.selfNerfs.find(nerf => nerf.source === 'fallen_fera')?.name.replace('Deranged - ', '')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                      <p className="text-sm text-red-300">
                        🌑 <strong>Fallen Corruption:</strong> The Wyrm's influence has not only corrupted your natural abilities 
                        but also left deep psychological scars. This derangement represents the mental trauma of your fall.
                      </p>
                    </div>
                  </div>

                  {/* Wyrm Gift Selection */}
                  <div className={`${themeClasses.card} p-5`}>
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
                                // Remove derangement if deselecting madness_wyrm
                                let updatedSelfNerfs = newCharacter.selfNerfs;
                                if (tree.tree_id === 'madness_wyrm') {
                                  updatedSelfNerfs = newCharacter.selfNerfs.filter(nerf => 
                                    nerf.source !== 'madness_wyrm_gift'
                                  );
                                }
                                
                                setNewCharacter({
                                  ...newCharacter,
                                  innateTreeIds: newCharacter.innateTreeIds.filter(id => id !== tree.tree_id),
                                  selfNerfs: updatedSelfNerfs
                                });
                              } else {
                                // Remove any other Wyrm gifts and add this one
                                const filteredTreeIds = newCharacter.innateTreeIds.filter(id => !wyrmGifts.includes(id));
                                
                                // If selecting madness_wyrm, require additional derangement
                                if (tree.tree_id === 'madness_wyrm') {
                                  const derangementList = [
                                    'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                                    'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                                    'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                                  ];
                                  
                                  const selectedDerangement = prompt(
                                    `The Madness (Wyrm) gift inflicts additional psychological damage beyond your natural corruption. Choose a second derangement:\n\n` +
                                    derangementList.map((d, i) => `${i + 1}. ${d}`).join('\n') +
                                    '\n\nEnter the number (1-12) of your chosen derangement, or click Cancel to select this gift without additional derangement:'
                                  );
                                  
                                  if (selectedDerangement === null) {
                                    // User clicked Cancel - just add the tree without additional derangement
                                    setNewCharacter({
                                      ...newCharacter,
                                      innateTreeIds: [...filteredTreeIds, tree.tree_id]
                                    });
                                  } else {
                                    const derangementIndex = parseInt(selectedDerangement) - 1;
                                    if (derangementIndex >= 0 && derangementIndex < derangementList.length) {
                                      const chosenDerangement = derangementList[derangementIndex];
                                      
                                      // Add the tree and the additional derangement
                                      const newDerangement = {
                                        id: Date.now(),
                                        name: `Deranged - ${chosenDerangement}`,
                                        description: `Character has an additional Deranged flaw from the Madness (Wyrm) gift beyond their natural corruption, specifically manifesting as ${chosenDerangement}.`,
                                        type: 'derangement',
                                        category: 'Deranged',
                                        source: 'madness_wyrm_gift'
                                      };
                                      
                                      setNewCharacter({
                                        ...newCharacter,
                                        innateTreeIds: [...filteredTreeIds, tree.tree_id],
                                        selfNerfs: [...newCharacter.selfNerfs, newDerangement]
                                      });
                                    } else {
                                      alert('Invalid selection. Please try again and choose a number from 1-12, or click Cancel.');
                                      return;
                                    }
                                  }
                                } else {
                                  // Regular tree selection
                                  setNewCharacter({
                                    ...newCharacter,
                                    innateTreeIds: [...filteredTreeIds, tree.tree_id]
                                  });
                                }
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
              
              {/* Natus Mandatory Flaw Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.breed === 'natus' && !factionChangeCreationMode && (
                <div className="space-y-6 mt-5">
                  {/* Mandatory Flaw for Natus */}
                  <div className={`${themeClasses.card} p-5`}>
                    <h4 className="text-xl font-bold mb-2 text-red-400">⚠️ Mandatory Flaw Selection</h4>
                    <p className="text-gray-400 mb-3">
                      As a Natus, you must select one flaw that represents the physical and mental toll of your supernatural nature. 
                      This is a mandatory character limitation.
                    </p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {[
                        'Deranged', 'Fragile', 'Hemophilia', 'Horns', 'Lame', 'Mute',
                        'No Claws', 'Puny', 'Restricted Form', 'Tail',
                        'Withered Arm', 'Weak Musculature'
                      ].map(flaw => {
                        const isSelected = newCharacter.selfNerfs.some(nerf => 
                          nerf.name === flaw && nerf.source === 'natus'
                        ) || (flaw === 'Deranged' && newCharacter.selfNerfs.some(nerf => 
                          nerf.name?.startsWith('Deranged - ') && nerf.source === 'natus'
                        ));
                        
                        return (
                          <button
                            key={flaw}
                            onClick={() => {
                              if (isSelected) {
                                // Remove the flaw
                                setNewCharacter({
                                  ...newCharacter,
                                  selfNerfs: newCharacter.selfNerfs.filter(nerf => 
                                    !(nerf.source === 'natus' && (nerf.name === flaw || (flaw === 'Deranged' && nerf.name?.startsWith('Deranged - '))))
                                  )
                                });
                              } else {
                                // Remove any existing Natus flaw first (only one allowed)
                                const filteredNerfs = newCharacter.selfNerfs.filter(nerf => 
                                  nerf.source !== 'natus'
                                );
                                
                                if (flaw === 'Deranged') {
                                  const derangementList = [
                                    'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                                    'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                                    'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                                  ];
                                  
                                  const selectedDerangement = prompt(
                                    `The Deranged flaw requires specifying a type of mental affliction. Choose one:\n\n` +
                                    derangementList.map((d, i) => `${i + 1}. ${d}`).join('\n') +
                                    '\n\nEnter the number (1-12) of your chosen derangement:'
                                  );
                                  
                                  const derangementIndex = parseInt(selectedDerangement) - 1;
                                  if (derangementIndex >= 0 && derangementIndex < derangementList.length) {
                                    const chosenDerangement = derangementList[derangementIndex];
                                    
                                    // Add the deranged flaw
                                    const newFlaw = {
                                      id: Date.now(),
                                      name: `Deranged - ${chosenDerangement}`,
                                      description: `Character has the Deranged flaw from their Natus nature, specifically manifesting as ${chosenDerangement}.`,
                                      type: 'flaw',
                                      category: 'Deranged',
                                      source: 'natus'
                                    };
                                    
                                    setNewCharacter({
                                      ...newCharacter,
                                      selfNerfs: [...filteredNerfs, newFlaw]
                                    });
                                  } else {
                                    alert('Invalid selection. Please try again and choose a number from 1-12.');
                                    return;
                                  }
                                } else {
                                  // Add the regular flaw
                                  const newFlaw = {
                                    id: Date.now(),
                                    name: flaw,
                                    description: `Character has the ${flaw} flaw from their Natus nature.`,
                                    type: 'flaw',
                                    category: flaw,
                                    source: 'natus'
                                  };
                                  
                                  setNewCharacter({
                                    ...newCharacter,
                                    selfNerfs: [...filteredNerfs, newFlaw]
                                  });
                                }
                              }
                            }}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-red-500 bg-red-500 bg-opacity-20'
                                : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-lg">{flaw}</h5>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✓</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Selected Flaw:</span>
                        <span className={`text-sm font-medium ${
                          newCharacter.selfNerfs.some(nerf => nerf.source === 'natus') ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {newCharacter.selfNerfs.find(nerf => nerf.source === 'natus')?.name || 'None'}
                        </span>
                      </div>
                      
                      {!newCharacter.selfNerfs.some(nerf => nerf.source === 'natus') && (
                        <p className="text-sm text-red-400 mt-2">
                          ⚠️ You must select a flaw to continue. This is mandatory for Natus characters.
                        </p>
                      )}
                      
                      {newCharacter.selfNerfs.some(nerf => nerf.source === 'natus') && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-300">
                            {newCharacter.selfNerfs.find(nerf => nerf.source === 'natus')?.description}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                      <p className="text-sm text-red-300">
                        🧬 <strong>Supernatural Toll:</strong> Natus characters bear the physical and mental burden of their unnatural existence. This flaw represents the price of your supernatural nature.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Malkavian Derangement Selection */}
              {newCharacter.faction === 'vampire' && newCharacter.subfaction === 'malkavian' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Malkavian Derangement</h4>
                  <p className="text-gray-400 mb-2">The curse of Malkav affects all members of the clan. Choose one derangement that reflects your character's particular madness.</p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                      'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                      'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                    ].map(derangement => {
                      const isSelected = newCharacter.selfNerfs.some(nerf => 
                        nerf.name === `Deranged - ${derangement}` && nerf.source === 'malkavian'
                      );
                      
                      return (
                        <button
                          key={derangement}
                          onClick={() => {
                            if (isSelected) {
                              // Remove this derangement
                              setNewCharacter({
                                ...newCharacter,
                                selfNerfs: newCharacter.selfNerfs.filter(nerf => 
                                  !(nerf.name === `Deranged - ${derangement}` && nerf.source === 'malkavian')
                                )
                              });
                            } else {
                              // Remove any other Malkavian derangement and add this one
                              const filteredNerfs = newCharacter.selfNerfs.filter(nerf => 
                                nerf.source !== 'malkavian'
                              );
                              
                              const newDerangement = {
                                id: Date.now(),
                                name: `Deranged - ${derangement}`,
                                description: `Character has a Deranged flaw from their connection to Malkavian madness, specifically manifesting as ${derangement}.`,
                                type: 'derangement',
                                category: 'Deranged',
                                source: 'malkavian'
                              };
                              
                              setNewCharacter({
                                ...newCharacter,
                                selfNerfs: [...filteredNerfs, newDerangement]
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
                            <h5 className="font-bold text-lg">{derangement}</h5>
                            {isSelected && (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-300">
                            {derangement === 'Amnesia' && 'You have trouble remembering past events.'}
                            {derangement === 'Aphasia' && 'You are unable to speak coherently.'}
                            {derangement === 'Melancholia' && 'You are extremely depressed and difficult to motivate.'}
                            {derangement === 'Delusional' && 'You believe in a reality that simply doesn\'t exist.'}
                            {derangement === 'Masochism' && 'You drive others to cause you pain.'}
                            {derangement === 'Megalomania' && 'You must seek to control things.'}
                            {derangement === 'Multiple Personality Disorder' && 'You have several distinct personalities, only one of which manifests at any given time.'}
                            {derangement === 'Obsessive Compulsion' && 'You have a specific order that things must be kept in. If it is out of place, you will replace it.'}
                            {derangement === 'Paranoia' && 'You consider everything a threat.'}
                            {derangement === 'Regression' && 'Your mind has reverted to a childlike state to protect itself from the world.'}
                            {derangement === 'Schizophrenia' && 'You hear voices and follow their instructions.'}
                            {derangement === 'Synesthesia' && 'You are in a permanent hallucinatory state.'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Derangement:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.selfNerfs.some(nerf => nerf.source === 'malkavian') ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.selfNerfs.find(nerf => nerf.source === 'malkavian')?.name.replace('Deranged - ', '') || 'None'}
                      </span>
                    </div>
                    
                    {!newCharacter.selfNerfs.some(nerf => nerf.source === 'malkavian') && (
                      <p className="text-sm text-red-400 mt-2">
                        ⚠️ You must select a derangement to continue. This is mandatory for Malkavians.
                      </p>
                    )}
                    
                    {newCharacter.selfNerfs.some(nerf => nerf.source === 'malkavian') && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm">
                          {newCharacter.selfNerfs.find(nerf => nerf.source === 'malkavian')?.name.replace('Deranged - ', '')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      🧠 <strong>Curse of Malkav:</strong> All Malkavians are touched by madness as part of their vampiric nature. This derangement represents the specific way insanity manifests in your character. It affects roleplay and may have mechanical consequences.
                    </p>
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
                          
                          {['enticer', 'ferectoi', 'gorehound'].includes(tree.tree_id) && (
                            <div className="mt-2 p-2 bg-yellow-600 bg-opacity-20 rounded border border-yellow-500">
                              <p className="text-xs text-yellow-300">
                                ⚠️ <strong>Mutation:</strong> Learning powers from this tree (if not innate) grants Mutations.
                              </p>
                            </div>
                          )}                            {['enticer', 'ferectori', 'gorehound'].includes(tree.tree_id) && (
                              <div className="mt-2 p-2 bg-yellow-600 bg-opacity-20 rounded border border-yellow-500">
                                <p className="text-xs text-yellow-300">
                                  ⚠️ <strong>Mutation:</strong> Learning powers from this tree (if not innate) grants Mutations.
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

              {/* Clan Selection for Ghouls */}
              {newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Optional: Clan Selection</h4>
                  <p className="text-gray-400 mb-3">
                    As a ghoul, you may choose to be associated with a specific vampire clan. This grants you additional 
                    knowledge about that clan but may come with restrictions if the clan has special requirements.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-2 mb-3">
                    {/* None option */}
                    <button
                      onClick={() => setNewCharacter({...newCharacter, selectedClan: null})}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        !newCharacter.selectedClan
                          ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <h5 className="font-bold">No Clan</h5>
                      <p className="text-sm text-gray-400">Independent ghoul</p>
                    </button>
                    
                    {/* Clan options */}
                    {gameData.subfactions
                      .filter(sub => sub.faction_id === 'vampire' && sub.type === 'clan')
                      .map(clan => (
                        <button
                          key={clan.subfaction_id}
                          onClick={() => setNewCharacter({...newCharacter, selectedClan: clan.subfaction_id})}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            newCharacter.selectedClan === clan.subfaction_id
                              ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <h5 className="font-bold">{clan.subfaction_name}</h5>
                          {clan.restrictions && (
                            <p className="text-sm text-yellow-400">{clan.restrictions}</p>
                          )}
                        </button>
                      ))}
                  </div>
                  
                  <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg border border-green-500">
                    <p className="text-sm text-green-300">
                      💡 <strong>Benefits:</strong> You automatically receive Vampire Lore for free. If you select a clan, 
                      you also receive that clan's lore for free. These represent the knowledge you'd naturally gain 
                      from your vampiric master and their lineage.
                    </p>
                  </div>
                </div>
              )}

              {/* Claimed Status Selection - appears after selecting certain human subfactions */}
              {newCharacter.faction === 'human' && 
               ['sorcerer', 'ghoul', 'kinfolk', 'commoner', 'faithful'].includes(newCharacter.subfaction) && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Optional: Claimed Status</h4>
                  <p className="text-gray-400 mb-3">
                    Has your character been claimed or transformed by otherworldly supernatural forces? This creates dual heritage 
                    characters who retain their original nature while gaining additional supernatural abilities. <strong>This is entirely optional.</strong>
                  </p>
                  <div className="mb-4 p-3 bg-gray-700 bg-opacity-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-gray-300">
                      <strong>How it works:</strong> You select your primary subfaction first (Sorcerer, Ghoul, etc.), then optionally add 
                      a claimed status. Your character gains access to <strong>both</strong> power sets at innate costs, creating unique 
                      combinations like "Former Sorcerer claimed by Gorgon" or "Ghoul possessed by Fomori Bane."
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* No Claimed Status Option */}
                    <button
                      onClick={() => {
                        setNewCharacter({
                          ...newCharacter,
                          claimedStatus: null,
                          claimedInnateTreeIds: [],
                          selectedFomoriTree: null
                        });
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        !newCharacter.claimedStatus
                          ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-lg">No Claimed Status</h5>
                        {!newCharacter.claimedStatus && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">
                        Remain as a pure {formatDisplayText(newCharacter.subfaction)} without additional supernatural influences.
                      </p>
                    </button>

                    {/* Claimed by Gorgon Option */}
                    <button
                      onClick={() => {
                        setNewCharacter({
                          ...newCharacter,
                          claimedStatus: 'gorgon',
                          claimedInnateTreeIds: ['gorgon'], // Automatically add gorgon tree
                          selectedFomoriTree: null
                        });
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        newCharacter.claimedStatus === 'gorgon'
                          ? 'border-purple-500 bg-purple-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-lg">🐍 Claimed by Gorgon</h5>
                        {newCharacter.claimedStatus === 'gorgon' && (
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="mb-2 p-2 bg-purple-900 bg-opacity-30 rounded border border-purple-700">
                        <p className="text-xs text-purple-200">
                          <strong>📋 Character Type:</strong> Former {formatDisplayText(newCharacter.subfaction)} claimed by Gorgon
                        </p>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>Ancient Curse:</strong> Your character has been touched by the ancient power of the Gorgons, 
                        gaining supernatural abilities but also carrying their curse of fragility.
                      </p>
                      <div className="text-xs text-purple-200 bg-purple-900 bg-opacity-30 p-2 rounded mb-2">
                        <strong>Powers Gained:</strong> Gorgon tree at innate costs (3/6/9 XP)<br/>
                        • <strong>Level 1:</strong> Hallucination - Create false sensory experiences<br/>
                        • <strong>Level 2:</strong> Dreamshape - Manipulate dreams and nightmares<br/>
                        • <strong>Level 3:</strong> Gauntlet Walk/Umbra Sight - Move between worlds<br/>
                        <strong>Fundamental Power:</strong> Frail (automatic)
                      </div>
                      <p className="text-xs text-gray-400">
                        Perfect for characters who were cursed, touched by ancient magic, or encountered Gorgon artifacts.
                      </p>
                      <div className="mt-2 p-2 bg-blue-800 bg-opacity-30 rounded border border-blue-600">
                        <p className="text-xs text-blue-200">
                          💡 <strong>Dual Heritage:</strong> You keep all your {formatDisplayText(newCharacter.subfaction)} abilities AND gain Gorgon powers, both at innate costs.
                        </p>
                      </div>
                    </button>

                    {/* Claimed by Fomori Option */}
                    <button
                      onClick={() => {
                        setNewCharacter({
                          ...newCharacter,
                          claimedStatus: 'fomori',
                          claimedInnateTreeIds: [], // Will be selected in next step
                          selectedFomoriTree: null
                        });
                      }}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        newCharacter.claimedStatus === 'fomori'
                          ? 'border-red-500 bg-red-500 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-400 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-lg">👹 Claimed by Fomori</h5>
                        {newCharacter.claimedStatus === 'fomori' && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="mb-2 p-2 bg-red-900 bg-opacity-30 rounded border border-red-700">
                        <p className="text-xs text-red-200">
                          <strong>📋 Character Type:</strong> Former {formatDisplayText(newCharacter.subfaction)} possessed by Fomori Bane
                        </p>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>Bane Possession:</strong> Your character has been possessed by a Wyrm spirit (Bane), 
                        gaining supernatural powers but potentially losing some of their humanity in the process.
                      </p>
                      <div className="text-xs text-red-200 bg-red-900 bg-opacity-30 p-2 rounded mb-2">
                        <strong>Choose Your Bane Type:</strong> Select which spirit possesses you<br/>
                        • <strong>Enticer:</strong> Temptation and corruption powers<br/>
                        • <strong>Ferectori:</strong> Fear and intimidation abilities<br/>
                        • <strong>Gorehound:</strong> Violence and brutality powers<br/>
                        • <strong>Toad:</strong> Poison and transformation abilities<br/>
                        <em>All trees cost innate rates (3/6/9 XP)</em>
                      </div>
                      <p className="text-xs text-gray-400">
                        Perfect for characters who were corrupted, made deals with dark forces, or fell to the Wyrm's influence.
                      </p>
                      <div className="mt-2 p-2 bg-blue-800 bg-opacity-30 rounded border border-blue-600">
                        <p className="text-xs text-blue-200">
                          💡 <strong>Dual Heritage:</strong> You keep all your {formatDisplayText(newCharacter.subfaction)} abilities AND gain your selected Bane powers, both at innate costs.
                        </p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Claimed Status:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.claimedStatus ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.claimedStatus ? 
                          newCharacter.claimedStatus.charAt(0).toUpperCase() + newCharacter.claimedStatus.slice(1) : 'None'
                        }
                      </span>
                    </div>
                    
                    {newCharacter.claimedStatus && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded text-sm capitalize ${
                          newCharacter.claimedStatus === 'gorgon' ? 'bg-purple-600 text-purple-100' : 'bg-red-600 text-red-100'
                        }`}>
                          Claimed by {newCharacter.claimedStatus}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-600 bg-opacity-20 rounded-lg border border-blue-500">
                    <p className="text-sm text-blue-300">
                      💡 <strong>Dual Heritage:</strong> If you select a claimed status, you'll have access to both your original 
                      subfaction powers AND the claimed powers, both at innate costs. This makes for very versatile but complex characters.
                    </p>
                  </div>
                </div>
              )}

              {/* Fomori Tree Selection - only if claimed by fomori */}
              {newCharacter.faction === 'human' && newCharacter.claimedStatus === 'fomori' && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2">Select Fomori Bane Manifestation</h4>
                  <p className="text-gray-400 mb-3">
                    Choose which type of Bane spirit has possessed your character. Each Bane grants different supernatural abilities 
                    reflecting their nature and domain of corruption.
                  </p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-3">
                    {gameData.powerTrees
                      .filter(tree => ['enticer', 'ferectori', 'gorehound', 'toad'].includes(tree.tree_id))
                      .map(tree => {
                        const isSelected = newCharacter.selectedFomoriTree === tree.tree_id;
                        
                        // Define descriptions for each Bane type
                        const baneDescriptions = {
                          enticer: "Masters of temptation and seduction, Enticing Banes corrupt through desire and manipulation.",
                          ferectori: "Fear incarnate, Ferectori Banes spread terror and intimidation wherever they go.",
                          gorehound: "Violent and brutal, Gorehound Banes revel in carnage and physical destruction.",
                          toad: "Toxic and mutating, Toad Banes corrupt through poison and grotesque transformation."
                        };
                        
                        return (
                          <button
                            key={tree.tree_id}
                            onClick={() => {
                              setNewCharacter({
                                ...newCharacter,
                                selectedFomoriTree: tree.tree_id,
                                claimedInnateTreeIds: [tree.tree_id]
                              });
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
                            
                            <p className="text-xs text-gray-300 mb-3 italic">
                              {baneDescriptions[tree.tree_id]}
                            </p>
                            
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
                                  ⚠️ <strong>Mutation:</strong> Learning any power from this tree grants mutations.
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Bane:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.selectedFomoriTree ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.selectedFomoriTree ? 
                          gameData.powerTrees.find(t => t.tree_id === newCharacter.selectedFomoriTree)?.tree_name || 'Unknown' : 'None'
                        }
                      </span>
                    </div>
                    
                    {!newCharacter.selectedFomoriTree && (
                      <p className="text-sm text-yellow-400 mt-2">
                        Please select a Bane manifestation to continue.
                      </p>
                    )}
                    
                    {newCharacter.selectedFomoriTree && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm capitalize">
                          {gameData.powerTrees.find(t => t.tree_id === newCharacter.selectedFomoriTree)?.tree_name}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      � <strong>Bane Possession:</strong> The selected Bane manifestation will be added to your innate power trees, 
                      allowing you to learn its powers at innate costs (3/6/9 XP) alongside your original {formatDisplayText(newCharacter.subfaction)} abilities.
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

              {/* Mandatory Derangement Selection for Claimed Characters */}
              {(newCharacter.subfaction?.includes('claimed') || newCharacter.claimedStatus) && (
                <div className={`${themeClasses.card} p-5 mt-5`}>
                  <h4 className="text-xl font-bold mb-2 text-red-400">⚠️ Mandatory Derangement Selection</h4>
                  <p className="text-gray-400 mb-3">
                    As a claimed character, you must select one derangement that represents the psychological trauma 
                    of your supernatural possession/transformation. This is a mandatory character limitation.
                  </p>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                      'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                      'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                    ].map(derangement => {
                      const isSelected = newCharacter.selfNerfs.some(nerf => 
                        nerf.name === `Deranged - ${derangement}` || nerf.name === derangement
                      );
                      
                      return (
                        <button
                          key={derangement}
                          onClick={() => {
                            if (isSelected) {
                              // Remove the derangement
                              setNewCharacter({
                                ...newCharacter,
                                selfNerfs: newCharacter.selfNerfs.filter(nerf => 
                                  nerf.name !== `Deranged - ${derangement}` && nerf.name !== derangement
                                )
                              });
                            } else {
                              // Remove any existing derangement first (only one allowed)
                              const derangementList = [
                                'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
                                'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
                                'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
                              ];
                              const filteredNerfs = newCharacter.selfNerfs.filter(nerf => 
                                !derangementList.includes(nerf.name.replace('Deranged - ', ''))
                              );
                              
                              // Add the new derangement
                              const newNerf = {
                                id: Date.now(),
                                name: `Deranged - ${derangement}`,
                                description: `Character has the Deranged flaw, specifically manifesting as ${derangement}.`,
                                type: 'derangement',
                                category: 'Deranged'
                              };
                              
                              setNewCharacter({
                                ...newCharacter,
                                selfNerfs: [...filteredNerfs, newNerf]
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
                            <h5 className="font-bold text-lg">{derangement}</h5>
                            {isSelected && (
                              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Selected Derangement:</span>
                      <span className={`text-sm font-medium ${
                        newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement') ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {newCharacter.selfNerfs.find(nerf => nerf.type === 'derangement')?.name.replace('Deranged - ', '') || 'None'}
                      </span>
                    </div>
                    
                    {!newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement') && (
                      <p className="text-sm text-red-400 mt-2">
                        ⚠️ You must select a derangement to continue. This is mandatory for claimed characters.
                      </p>
                    )}
                    
                    {newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement') && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-red-600 text-red-100 rounded text-sm">
                          {newCharacter.selfNerfs.find(nerf => nerf.type === 'derangement')?.name.replace('Deranged - ', '')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                    <p className="text-sm text-red-300">
                      🧠 <strong>Psychological Trauma:</strong> Being claimed by supernatural forces leaves lasting psychological 
                      damage. This derangement represents how your mind copes with the supernatural transformation and possession.
                    </p>
                  </div>
                </div>
              )}

              {/* Shifter Rank Selection */}
              {newCharacter.faction === 'shifter' && newCharacter.subfaction && (
                <div>
                  <h3 className="text-2xl font-bold mb-2">Choose Rank</h3>
                  <p className="text-gray-400 mb-3">Select your character's rank in shifter society.</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {['cub', 'cliath', 'fostern', 'adren', 'athro', 'elder'].map(rank => (
                      <button
                        key={rank}
                        onClick={() => {
                          setNewCharacter({...newCharacter, rank});
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-center capitalize ${
                          newCharacter.rank === rank
                            ? 'border-purple-500 bg-purple-500 bg-opacity-20 text-purple-300'
                            : 'border-gray-600 hover:border-gray-400 text-gray-300'
                        }`}
                      >
                        <div className="font-semibold">{rank}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {rank === 'cub' && 'Novice'}
                          {rank === 'cliath' && 'Young Adult'}
                          {rank === 'fostern' && 'Full Adult'}
                          {rank === 'adren' && 'Experienced'}
                          {rank === 'athro' && 'Elder'}
                          {rank === 'elder' && 'Ancient'}
                        </div>
                      </button>
                    ))}
                  </div>
                  {!newCharacter.rank && (
                    <p className="text-sm text-red-400 mt-2">
                      ⚠️ You must select a rank to continue.
                    </p>
                  )}
                </div>
              )}
            </div>
          );

        case 2: // Skills & Powers
          return (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-2">
                {factionChangeCreationMode ? 'Assign Powers' : 'Assign Skills & Powers'}
              </h3>
              
              <div className={factionChangeCreationMode ? 'space-y-6' : 'grid md:grid-cols-2 gap-5'}>
                {/* Skills Section - Only show for new character creation */}
                {!factionChangeCreationMode && (
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
                )}

                {/* Powers Section */}
                <div className={`${themeClasses.card} p-3`}>
                  <h4 className="font-bold mb-2">
                    Innate Powers ({newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? '1 dot' : 
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? '1 dot' :
                                   newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' ? '1 dot' :
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
                          Level 3 ≤ Level 2 ≤ Level 1
                        </div>
                      </div>

                      {/* Available Powers by Tree */}
                      {newCharacter.innateTreeIds.map(treeId => {
                        const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                        if (!tree) return null;
                        
                        const currentLevels = newCharacter.powers[treeId] || {};
                        const totalDots = factionChangeCreationMode ? (newCharacter.creationDotsUsed || 0) : Object.values(newCharacter.powers).reduce(
                          (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                        );
                        const maxDots = newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' ? 1 :
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
                                
                                // For faction changes, we need different constraint logic
                                let canAddByRatio = true;
                                if (factionChangeCreationMode && newCharacter.faction === 'shifter') {
                                  // During shifter faction changes, only check ratios for shifter trees
                                  // Get only shifter-specific powers for ratio checking
                                  const shifterTreeIds = newCharacter.innateTreeIds || [];
                                  const shifterPowers = {};
                                  shifterTreeIds.forEach(treeId => {
                                    if (newCharacter.powers[treeId]) {
                                      shifterPowers[treeId] = newCharacter.powers[treeId];
                                    }
                                  });
                                  canAddByRatio = canAddShifterPower(shifterPowers, level);
                                } else if (newCharacter.faction === 'shifter') {
                                  // Normal shifter character creation - apply full ratio constraints
                                  canAddByRatio = canAddShifterPower(newCharacter.powers, level);
                                }
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
                                            const baseCharacterUpdate = { ...newCharacter, powers: newPowers };
                                            // Update creation dots counter for faction changes
                                            const updatedCharacter = factionChangeCreationMode ? {
                                              ...baseCharacterUpdate,
                                              creationDotsUsed: Math.max(0, (baseCharacterUpdate.creationDotsUsed || 0) - 1)
                                            } : baseCharacterUpdate;
                                            setNewCharacter(updatedCharacter);
                                          } else if (canAdd) {
                                            // Add power
                                            const baseCharacterUpdate = {
                                              ...newCharacter,
                                              powers: {
                                                ...newCharacter.powers,
                                                [treeId]: {
                                                  ...currentLevels,
                                                  [level]: true
                                                }
                                              }
                                            };
                                            // Update creation dots counter for faction changes
                                            const updatedCharacter = factionChangeCreationMode ? {
                                              ...baseCharacterUpdate,
                                              creationDotsUsed: (baseCharacterUpdate.creationDotsUsed || 0) + 1
                                            } : baseCharacterUpdate;
                                            setNewCharacter(updatedCharacter);
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
                                    {!canAdd && !hasLevel && !canAddByRatio && (
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
                          const totalDots = factionChangeCreationMode ? (newCharacter.creationDotsUsed || 0) : Object.values(newCharacter.powers).reduce(
                            (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                          );
                        const maxDots = newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? 1 :
                                       newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' ? 1 :
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
                                            const baseCharacterUpdate = { ...newCharacter, powers: newPowers };
                                            // Update creation dots counter for faction changes
                                            const updatedCharacter = factionChangeCreationMode ? {
                                              ...baseCharacterUpdate,
                                              creationDotsUsed: Math.max(0, (baseCharacterUpdate.creationDotsUsed || 0) - 1)
                                            } : baseCharacterUpdate;
                                            setNewCharacter(updatedCharacter);
                                          } else if (canAdd) {
                                            const baseCharacterUpdate = {
                                              ...newCharacter,
                                              powers: {
                                                ...newCharacter.powers,
                                                [treeId]: {
                                                  ...currentLevels,
                                                  [level]: true
                                                }
                                              }
                                            };
                                            // Update creation dots counter for faction changes
                                            const updatedCharacter = factionChangeCreationMode ? {
                                              ...baseCharacterUpdate,
                                              creationDotsUsed: (baseCharacterUpdate.creationDotsUsed || 0) + 1
                                            } : baseCharacterUpdate;
                                            setNewCharacter(updatedCharacter);
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
                    Dots Used: {factionChangeCreationMode ? (newCharacter.creationDotsUsed || 0) : Object.values(newCharacter.powers).reduce(
                      (sum, treeLevels) => sum + Object.keys(treeLevels).length, 0
                    )} / {newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' ? 1 : 
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' ? 1 :
                        newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' ? 0 : 3}
                  </div>
                </div>

                {/* Add Claimed Status Free Powers Section */}
                {newCharacter.claimedStatus === 'gorgon' && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">🐍 Claimed Gorgon Free Power (Automatic)</h4>
                    <p className="text-gray-400 mb-3">
                      As a character claimed by Gorgon, you automatically receive the first dot of the Gorgon tree for free. 
                      This represents your initial connection to dream reality.
                    </p>
                    
                    <div className="p-3 rounded-lg border-2 border-purple-500 bg-purple-500 bg-opacity-20">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-lg">Gorgon Tree</h5>
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded border border-purple-400 bg-purple-400 bg-opacity-20">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 rounded-full mr-2 bg-purple-500" />
                          <span className="font-medium">Level 1 - FREE</span>
                        </div>
                        <div className="text-sm text-gray-300">
                          Hallucination
                        </div>
                        <p className="text-xs text-purple-300 mt-1 italic">
                          Automatically granted - your first manifestation of dream power
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-purple-600 bg-opacity-20 rounded-lg border border-purple-500">
                      <p className="text-sm text-purple-300">
                        🎁 <strong>Free Power:</strong> This first dot is granted automatically and doesn't count against your creation dot limit. 
                        You can purchase additional levels of Gorgon powers during advancement.
                      </p>
                    </div>
                  </div>
                )}

                {/* Add Claimed Fomori Free Power Section */}
                {newCharacter.claimedStatus === 'fomori' && newCharacter.selectedFomoriTree && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">👹 Claimed Fomori Free Power (Automatic)</h4>
                    <p className="text-gray-400 mb-3">
                      As a character possessed by a {formatDisplayText(newCharacter.selectedFomoriTree)} Bane, you automatically receive the first dot 
                      of that manifestation tree for free. This represents your initial corruption by the Wyrm spirit.
                    </p>
                    
                    <div className="p-3 rounded-lg border-2 border-red-500 bg-red-500 bg-opacity-20">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-lg capitalize">{formatDisplayText(newCharacter.selectedFomoriTree)} Tree</h5>
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded border border-red-400 bg-red-400 bg-opacity-20">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 rounded-full mr-2 bg-red-500" />
                          <span className="font-medium">Level 1 - FREE</span>
                        </div>
                        <div className="text-sm text-gray-300">
                          {(() => {
                            const tree = gameData.powerTrees.find(t => t.tree_id === newCharacter.selectedFomoriTree);
                            return tree?.level1_powers || 'Powers vary by tree';
                          })()}
                        </div>
                        <p className="text-xs text-red-300 mt-1 italic">
                          Automatically granted - your first manifestation of Bane corruption
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-red-600 bg-opacity-20 rounded-lg border border-red-500">
                      <p className="text-sm text-red-300">
                        🎁 <strong>Free Power:</strong> This first dot is granted automatically and doesn't count against your creation dot limit. 
                        You can purchase additional levels of Bane powers during advancement.
                      </p>
                    </div>
                  </div>
                )}
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
            // For non-human factions, show completion message
            return (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-2">Character Complete</h3>
                
                <div className={`${themeClasses.card} p-5 text-center`}>
                  <div className="mb-5">
                    <h4 className="text-2xl font-bold text-green-400 mb-2">
                      {factionChangeCreationMode ? '🔄 Faction Transformation Ready!' : '🎉 Character Creation Complete!'}
                    </h4>
                    <p className="text-lg text-gray-300">Your character has been successfully created with all starting abilities.</p>
                  </div>
                  
                  {/* Only show XP info for new character creation, not faction changes */}
                  {!factionChangeCreationMode && (
                    <>
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
                    </>
                  )}
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
                    {newCharacter.faction === 'shifter' && newCharacter.rank && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rank:</span>
                        <span className="capitalize">{newCharacter.rank}</span>
                      </div>
                    )}
                    {newCharacter.faction === 'vampire' && newCharacter.generation && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Generation:</span>
                        <span>{newCharacter.generation}</span>
                      </div>
                    )}
                    {newCharacter.faction === 'wraith' && newCharacter.guild && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Guild:</span>
                        <span className="capitalize">{formatDisplayText(newCharacter.guild)}</span>
                      </div>
                    )}
                    {newCharacter.claimedStatus && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Claimed Status:</span>
                        <span className="capitalize">{newCharacter.claimedStatus}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claimed Status Summary */}
                {newCharacter.claimedStatus && (
                  <div className={`${themeClasses.card} p-3`}>
                    <h4 className="font-bold mb-2">Claimed Status</h4>
                    <div className="text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="capitalize">Claimed by {newCharacter.claimedStatus}</span>
                        <span className={newCharacter.claimedStatus === 'gorgon' ? 'text-purple-400' : 'text-red-400'}>✓</span>
                      </div>
                      {newCharacter.claimedStatus === 'fomori' && newCharacter.selectedFomoriTree && (
                        <div className="text-xs text-gray-400">
                          <strong>Bane Manifestation:</strong> {gameData.powerTrees.find(t => t.tree_id === newCharacter.selectedFomoriTree)?.tree_name}
                        </div>
                      )}
                      {newCharacter.claimedStatus === 'gorgon' && (
                        <div className="text-xs text-gray-400">
                          <strong>Additional Powers:</strong> Gorgon tree + Frail fundamental power
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Free Lore Preview - Only show for new character creation */}
                {!factionChangeCreationMode && (() => {
                  // Calculate what free lore will be assigned
                  const previewCharacter = assignFreeLore(newCharacter);
                  const freeLores = previewCharacter.lores;
                  const freeLoreEntries = Object.entries(freeLores || {}).filter(([_, count]) => count > 0);
                  
                  return freeLoreEntries.length > 0 && (
                    <div className={`${themeClasses.card} p-3 md:col-span-2`}>
                      <h4 className="font-bold mb-2">🎁 Free Lore (Automatic)</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        Based on your faction and subfaction choices, you'll automatically receive these lore pieces at character creation:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {freeLoreEntries.map(([loreId, count]) => {
                          const lore = gameData.lores.find(l => l.lore_id === loreId);
                          return (
                            <span key={loreId} className="px-3 py-1 bg-green-600 rounded text-sm">
                              {lore?.lore_name || loreId} {count > 1 ? `(x${count})` : ''}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-2 p-2 bg-green-600 bg-opacity-20 rounded-lg border border-green-500">
                        <p className="text-xs text-green-300">
                          💡 <strong>Character Knowledge:</strong> These represent the basic knowledge your character would 
                          naturally have about their own supernatural nature and community. No XP cost required!
                        </p>
                      </div>
                    </div>
                  );
                })()}

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
                    let finalCharacter = {
                      ...newCharacter,
                      id: Date.now() + Math.random(),
                      created: new Date().toISOString(),
                      lastModified: new Date().toISOString()
                    };
                    
                    // Handle energy preservation for faction changes
                    if (factionChangeCreationMode && newCharacter.preservedEnergy !== undefined) {
                      const newMaxEnergy = finalCharacter.stats.maxEnergy;
                      finalCharacter = {
                        ...finalCharacter,
                        stats: {
                          ...finalCharacter.stats,
                          energy: Math.min(newCharacter.preservedEnergy, newMaxEnergy)
                        }
                      };
                    }
                    
                    // Handle fundamental powers for claimed status
                    if (finalCharacter.claimedStatus === 'gorgon') {
                      const currentFundamentals = finalCharacter.fundamentalPowers || [];
                      const hasFrail = currentFundamentals.some(power => power.toLowerCase().includes('frail'));
                      const hasSenseSpirit = currentFundamentals.some(power => power.toLowerCase().includes('sense spirit'));
                      const newFundamentals = [...currentFundamentals];
                      
                      if (!hasFrail) {
                        newFundamentals.push('Frail');
                      }
                      if (!hasSenseSpirit) {
                        newFundamentals.push('Sense Spirit');
                      }
                      
                      finalCharacter = {
                        ...finalCharacter,
                        fundamentalPowers: newFundamentals
                      };
                      
                      // Add free first dot of Gorgon tree
                      const currentPowers = finalCharacter.powers || {};
                      if (!currentPowers.gorgon || !currentPowers.gorgon[1]) {
                        finalCharacter = {
                          ...finalCharacter,
                          powers: {
                            ...currentPowers,
                            gorgon: {
                              ...(currentPowers.gorgon || {}),
                              1: true
                            }
                          }
                        };
                      }
                    }
                    
                    // Handle fundamental Permatainted status for claimed characters
                    const shouldBePermatainted = finalCharacter.subfaction === 'claimed_drone' || 
                                                finalCharacter.subfaction === 'claimed_gorgon' ||
                                                finalCharacter.subfaction === 'claimed_fomori' ||
                                                finalCharacter.claimedStatus === 'gorgon' || 
                                                finalCharacter.claimedStatus === 'fomori';
                    
                    if (shouldBePermatainted) {
                      const isAlreadyPermatainted = finalCharacter.selfNerfs?.some(nerf => 
                        nerf.name === 'Permatainted'
                      );
                      
                      if (!isAlreadyPermatainted) {
                        let permataintedSource = '';
                        let permataintedDescription = '';
                        
                        if (finalCharacter.subfaction === 'claimed_drone') {
                          permataintedSource = 'drone_status';
                          permataintedDescription = 'Character is fundamentally Permatainted due to their Drone status and connection to the Weaver.';
                        } else if (finalCharacter.subfaction === 'claimed_gorgon' || finalCharacter.claimedStatus === 'gorgon') {
                          permataintedSource = 'gorgon_status';
                          permataintedDescription = 'Character is fundamentally Permatainted due to their Gorgon claimed status.';
                        } else if (finalCharacter.subfaction === 'claimed_fomori' || finalCharacter.claimedStatus === 'fomori') {
                          permataintedSource = 'fomori_status';
                          permataintedDescription = 'Character is fundamentally Permatainted due to their Fomori claimed status and Wyrm corruption.';
                        }
                        
                        const permataintedFlaw = {
                          id: Date.now(),
                          name: 'Permatainted',
                          description: permataintedDescription,
                          type: 'flaw',
                          category: 'Permatainted (Fundamental)',
                          source: permataintedSource
                        };
                        
                        finalCharacter = {
                          ...finalCharacter,
                          selfNerfs: [...(finalCharacter.selfNerfs || []), permataintedFlaw]
                        };
                      }
                    }
                    
                    // Handle Natus flaw requirement at character creation
                    if (finalCharacter.faction === 'shifter' && finalCharacter.breed === 'natus' && !factionChangeCreationMode) {
                      const hasNatusFlaw = finalCharacter.selfNerfs?.some(nerf => nerf.source === 'natus') || false;
                      if (!hasNatusFlaw) {
                        alert('Natus characters must have a mandatory flaw at character creation. Please select a flaw from the Mandatory Flaw Selection section before completing character creation.');
                        return;
                      }
                    }
                    
                    // Handle Claimed Fomori free power
                    if (finalCharacter.claimedStatus === 'fomori' && finalCharacter.selectedFomoriTree) {
                      const currentPowers = finalCharacter.powers || {};
                      const treeId = finalCharacter.selectedFomoriTree;
                      if (!currentPowers[treeId] || !currentPowers[treeId][1]) {
                        finalCharacter = {
                          ...finalCharacter,
                          powers: {
                            ...currentPowers,
                            [treeId]: {
                              ...(currentPowers[treeId] || {}),
                              1: true
                            }
                          }
                        };
                      }
                    }
                    
                    // Assign free lore for new character creation (not faction changes)
                    if (!factionChangeCreationMode) {
                      finalCharacter = assignFreeLore(finalCharacter);
                    }
                    
                    // Handle faction change completion - adjust remaining free powers BEFORE saving
                    if (factionChangeCreationMode) {
                      const dotsUsedInCreation = finalCharacter.creationDotsUsed || 0;
                      finalCharacter = {
                        ...finalCharacter,
                        tempFactionChangePowers: Math.max(0, (finalCharacter.tempFactionChangePowers || 0) - dotsUsedInCreation)
                      };
                      
                      // Update the existing character instead of creating a new one
                      const newCharacters = [...characters];
                      newCharacters[currentCharacterIndex] = finalCharacter;
                      setCharacters(newCharacters);
                    } else {
                      // Normal character creation - add new character
                      setCharacters([...characters, finalCharacter]);
                    }
                    
                    if (factionChangeCreationMode) {
                      setFactionChangeCreationMode(false);
                      setOriginalCharacterForFactionChange(null);
                      setCurrentMode('character');
                      // Stay on the same character index since we updated existing character
                      
                      // Show success message for faction change
                      const successMessage = `✅ FACTION TRANSFORMATION COMPLETE!

${finalCharacter.name} has been successfully transformed into ${formatDisplayText(finalCharacter.faction)}!

What's Next:
• Review your new faction abilities and fundamental powers
• Check your updated energy and stats
• Your transformation has been recorded in character history
• Update your character's story and background

Your character is ready to play!`;
                      
                      alert(successMessage);
                    } else {
                      // Normal character creation
                      setCurrentMode('menu');
                    }
                    
                    setNewCharacter(null);
                    setCreationStep(0);
                  }}
                  className={`${themeClasses.button} px-8 py-3 text-lg`}
                  disabled={!newCharacter.name}
                >
                  {factionChangeCreationMode ? 'Complete Transformation' : 'Create Character'}
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
        <div className="w-full max-w-6xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {factionChangeCreationMode ? '🔄 Faction Transformation Setup' : 'Character Creation'}
            </h2>
            <button
              onClick={() => {
                if (factionChangeCreationMode) {
                  // Return to character view for faction changes
                  setFactionChangeCreationMode(false);
                  setOriginalCharacterForFactionChange(null);
                  setCurrentMode('character');
                } else {
                  // Normal creation cancellation
                  setCurrentMode('menu');
                }
                setNewCharacter(null);
                setCreationStep(0);
              }}
              className={themeClasses.danger}
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
          </div>

          {/* Faction Change Notice */}
          {factionChangeCreationMode && (
            <div className="mb-6 p-4 bg-purple-600 bg-opacity-20 rounded-lg border border-purple-500">
              <h3 className="text-lg font-bold text-purple-300 mb-2">🔄 Supernatural Transformation in Progress</h3>
              <div className="text-sm text-gray-300">
                <p className="mb-2">
                  <strong>{originalCharacterForFactionChange?.name || newCharacter?.name}</strong> is undergoing transformation from{' '}
                  <span className="text-orange-400">{formatDisplayText(originalCharacterForFactionChange?.originalFaction || 'Unknown')}</span> to{' '}
                  <span className="text-purple-400">{formatDisplayText(newCharacter?.faction || 'Unknown')}</span>
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• Your character's name, player, and XP are preserved</li>
                  <li>• You need to select new clan/tribe/court and supernatural abilities</li>
                  <li>• Current energy amount will be preserved (up to new faction maximum)</li>
                  <li>• Original faction info will be recorded in character history</li>
                </ul>
              </div>
            </div>
          )}

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
              onClick={() => {
                if (creationStep === 0) {
                  // Go back to main menu from first page
                  setCurrentMode('menu');
                  setNewCharacter(null);
                  setCreationStep(0);
                } else {
                  // Go to previous step
                  setCreationStep(Math.max(0, creationStep - 1));
                }
              }}
              className={themeClasses.button}
            >
              <ChevronLeft className="w-4 h-4 mr-2 inline" />
              {creationStep === 0 ? 'Back to Menu' : 'Previous'}
            </button>
            
            {creationStep < 4 && (
              <button
                onClick={() => setCreationStep(Math.min(4, creationStep + 1))}
                className={themeClasses.button}
                disabled={
                  (creationStep === 0 && !newCharacter.faction) ||
                  (creationStep === 1 && newCharacter.faction !== 'wraith' && newCharacter.faction !== 'human' && !newCharacter.subfaction) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction !== 'sorcerer' && newCharacter.subfaction !== 'faithful' && newCharacter.subfaction !== 'claimed_drone' && newCharacter.subfaction !== 'claimed_fomori' && newCharacter.subfaction !== 'claimed_gorgon' && newCharacter.subfaction !== 'commoner' && newCharacter.subfaction !== 'ghoul' && newCharacter.subfaction !== 'kinfolk' && !newCharacter.subfaction) ||
                  (creationStep === 1 && newCharacter.faction === 'wraith' && (newCharacter.innateTreeIds.length !== 3 || !newCharacter.shadowArchetype || !newCharacter.selectedThorn || !newCharacter.subfaction || !newCharacter.guild)) ||
                  (creationStep === 1 && newCharacter.faction === 'vampire' && newCharacter.subfaction === 'caitiff' && newCharacter.innateTreeIds.length !== 3) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' && newCharacter.innateTreeIds.length !== 2) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'faithful' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_drone' && newCharacter.innateTreeIds.length !== 3) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_fomori' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'claimed_gorgon' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'commoner' && newCharacter.innateTreeIds.length !== 1) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'ghoul' && newCharacter.innateTreeIds.length === 0) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'kinfolk' && newCharacter.innateTreeIds.length === 0) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.claimedStatus === 'fomori' && !newCharacter.selectedFomoriTree) ||
                  (creationStep === 1 && (newCharacter.subfaction?.includes('claimed') || newCharacter.claimedStatus) && !newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement')) ||
                  (creationStep === 1 && newCharacter.faction === 'shifter' && newCharacter.subfaction === 'black_spiral_dancer' && !newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement' && nerf.source === 'black_spiral_dancer')) ||
                  (creationStep === 1 && newCharacter.faction === 'shifter' && newCharacter.subfaction === 'fallen_fera' && !newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement' && nerf.source === 'fallen_fera')) ||
                  (creationStep === 1 && newCharacter.faction === 'shifter' && newCharacter.breed === 'natus' && !newCharacter.selfNerfs.some(nerf => nerf.source === 'natus')) ||
                  (creationStep === 1 && newCharacter.faction === 'shifter' && !newCharacter.rank) ||
                  (creationStep === 1 && newCharacter.faction === 'vampire' && newCharacter.subfaction === 'malkavian' && !newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement' && nerf.source === 'malkavian')) ||
                  (creationStep === 1 && newCharacter.faction === 'human' && newCharacter.subfaction === 'sorcerer' && (newCharacter.innateTreeIds.includes('madness') || newCharacter.innateTreeIds.includes('ruin')) && !newCharacter.selfNerfs.some(nerf => nerf.type === 'derangement' && (nerf.source === 'madness_tree' || nerf.source === 'ruin_tree')))
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
      <div className="w-full max-w-6xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-5 space-y-3 sm:space-y-0">
          <h2 className="text-2xl sm:text-3xl font-bold">Character Management</h2>
          <div className="flex items-center space-x-2 sm:space-x-4">
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
        <div className={`${themeClasses.card} p-3 mb-4 sm:mb-5`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                <option value="xp">Available XP</option>
                <option value="created">Date Created</option>
                <option value="modified">Last Modified</option>
              </select>
            </div>

          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredAndSortedCharacters.map((character) => (
            <div key={character.id} className={`${themeClasses.card} p-3 sm:p-4 lg:p-5 hover:shadow-lg transition-all`}>
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
                  <span>Available XP:</span>
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

    // Self Nerf Form Component
    const SelfNerfForm = ({ character, onUpdate }) => {
      const [selectedType, setSelectedType] = useState(null);
      const [showDerangementSubmenu, setShowDerangementSubmenu] = useState(false);

      const selfNerfCategories = {
        derangement: [
          'Amnesia', 'Aphasia', 'Melancholia', 'Delusional', 'Masochism',
          'Megalomania', 'Multiple Personality Disorder', 'Obsessive Compulsion',
          'Paranoia', 'Regression', 'Schizophrenia', 'Synesthesia'
        ],
        flaw: [
          'Deranged', 'Fragile', 'Hemophilia', 'Horns', 'Lame', 'Mute',
          'No Claws', 'Puny', 'Restricted Form (Shifter Only)', 'Tail',
          'Withered Arm', 'Weak Musculature (Shifter Only)'
        ],
        mutation: [
          'Mutation - Describe your own physical alteration'
        ],
        permataint: [
          'Permataint'
        ]
      };

      const addSelfNerf = (type, category, derangementName = null) => {
        let name = category;
        let description = `Character has the ${category.toLowerCase()} ${type}.`;
        
        // Special handling for Deranged flaw
        if (category === 'Deranged' && derangementName) {
          name = `Deranged - ${derangementName}`;
          description = `Character has the Deranged flaw, specifically manifesting as ${derangementName}.`;
        }
        
        // Special handling for Mutation
        if (type === 'mutation') {
          const mutationDescription = prompt(
            'Describe your mutation (physical alteration from supernatural forces):\n\n' +
            'Examples: Extra eyes, chitinous shell, acidic blood, additional limb, etc.'
          );
          
          if (!mutationDescription || !mutationDescription.trim()) {
            alert('Mutation description is required.');
            return;
          }
          
          name = 'Mutation';
          description = mutationDescription.trim();
        }

        const selfNerfToAdd = {
          type: type,
          category: category,
          name: name,
          description: description,
          id: Date.now() + Math.random(),
          dateAdded: new Date().toISOString()
        };

        const updatedCharacter = {
          ...character,
          selfNerfs: [...(character.selfNerfs || []), selfNerfToAdd]
        };

        onUpdate(updatedCharacter);
        
        // Reset selections
        setSelectedType(null);
        setShowDerangementSubmenu(false);
        
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} "${name}" added successfully!`);
      };

      const handleFlawClick = (flaw) => {
        if (flaw === 'Deranged') {
          setShowDerangementSubmenu(true);
        } else {
          addSelfNerf('flaw', flaw);
        }
      };

      return (
        <div className="space-y-6">
          {/* Type Selection */}
          {!selectedType && (
            <div>
              <h4 className="text-lg font-bold mb-3 text-gray-300">Select Limitation Type</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedType('derangement')}
                  className="p-4 rounded-lg border-2 border-blue-500 bg-blue-500 bg-opacity-10 hover:bg-blue-500 hover:bg-opacity-20 transition-all text-center hover:scale-105"
                >
                  <div className="text-3xl mb-2">🧠</div>
                  <h5 className="font-bold text-blue-300">Derangements</h5>
                  <p className="text-sm text-gray-400 mt-1">Mental alterations from supernatural forces</p>
                </button>
                
                <button
                  onClick={() => setSelectedType('flaw')}
                  className="p-4 rounded-lg border-2 border-red-500 bg-red-500 bg-opacity-10 hover:bg-red-500 hover:bg-opacity-20 transition-all text-center hover:scale-105"
                >
                  <div className="text-3xl mb-2">⚡</div>
                  <h5 className="font-bold text-red-300">Flaws</h5>
                  <p className="text-sm text-gray-400 mt-1">Physical alterations to your body</p>
                </button>
                
                <button
                  onClick={() => setSelectedType('mutation')}
                  className="p-4 rounded-lg border-2 border-yellow-500 bg-yellow-500 bg-opacity-10 hover:bg-yellow-500 hover:bg-yellow-500 hover:bg-opacity-20 transition-all text-center hover:scale-105"
                >
                  <div className="text-3xl mb-2">🧬</div>
                  <h5 className="font-bold text-yellow-300">Mutations</h5>
                  <p className="text-sm text-gray-400 mt-1">Bane-induced physical changes</p>
                </button>
                
                <button
                  onClick={() => setSelectedType('permataint')}
                  className="p-4 rounded-lg border-2 border-purple-500 bg-purple-500 bg-opacity-10 hover:bg-purple-500 hover:bg-opacity-20 transition-all text-center hover:scale-105"
                >
                  <div className="text-3xl mb-2">🔮</div>
                  <h5 className="font-bold text-purple-300">Permataint</h5>
                  <p className="text-sm text-gray-400 mt-1">Lasting supernatural corruption</p>
                </button>
              </div>
            </div>
          )}

          {/* Category Selection */}
          {selectedType && !showDerangementSubmenu && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-300">
                  Select {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                </h4>
                <button
                  onClick={() => setSelectedType(null)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  ← Back
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selfNerfCategories[selectedType]?.map(category => (
                  <button
                    key={category}
                    onClick={() => selectedType === 'flaw' ? handleFlawClick(category) : addSelfNerf(selectedType, category)}
                    className={`p-3 rounded-lg border-2 transition-all text-left hover:scale-105 ${
                      selectedType === 'derangement' 
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10 hover:bg-blue-500 hover:bg-opacity-20'
                        : selectedType === 'flaw'
                        ? 'border-red-500 bg-red-500 bg-opacity-10 hover:bg-red-500 hover:bg-opacity-20'
                        : selectedType === 'mutation'
                        ? 'border-yellow-500 bg-yellow-500 bg-opacity-10 hover:bg-yellow-500 hover:bg-opacity-20'
                        : 'border-purple-500 bg-purple-500 bg-opacity-10 hover:bg-purple-500 hover:bg-purple-500 hover:bg-opacity-20'
                    }`}
                  >
                    <div className={`font-bold text-sm ${
                      selectedType === 'derangement' ? 'text-blue-300' :
                      selectedType === 'flaw' ? 'text-red-300' : 
                      selectedType === 'mutation' ? 'text-yellow-300' : 'text-purple-300'
                    }`}>
                      {category}
                    </div>
                    {category === 'Deranged' && (
                      <div className="text-xs text-gray-400 mt-1">Click to select derangement →</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Derangement Submenu for Deranged Flaw */}
          {showDerangementSubmenu && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-300">Select Derangement for Deranged Flaw</h4>
                <button
                  onClick={() => setShowDerangementSubmenu(false)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  ← Back to Flaws
                </button>
              </div>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selfNerfCategories.derangement.map(derangement => (
                  <button
                    key={derangement}
                    onClick={() => addSelfNerf('flaw', 'Deranged', derangement)}
                    className="p-3 rounded-lg border-2 border-orange-500 bg-orange-500 bg-opacity-10 hover:bg-orange-500 hover:bg-opacity-20 transition-all text-left hover:scale-105"
                  >
                    <div className="font-bold text-sm text-orange-300">{derangement}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className={`min-h-screen ${themeClasses.base}`}>
        <div className="w-full max-w-6xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-5 space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">{character.name}</h2>
              <p className={themeClasses.text}>{character.player} • {character.faction} {character.subfaction}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Available XP</div>
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

          {/* Tabs - Scrollable on mobile */}
          <div className="overflow-x-auto mb-5 border-b border-gray-700">
            <div className="flex space-x-1 min-w-max">
              {['overview', 'advancement', 'powers', 'power-index', 'lore', 'history', 'xp-tracking', 'notes', 'faction-change', 'self-nerf', 'rank-gen'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm sm:text-base font-medium capitalize transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab === 'xp-tracking' ? 'XP Tracking' : 
                   tab === 'faction-change' ? 'Faction Change' : 
                   tab === 'self-nerf' ? 'Self Nerf' :
                   tab === 'rank-gen' ? 'Rank/Gen' :
                   tab === 'power-index' ? 'Power Index' : tab}
                </button>
              ))}
            </div>
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

              {/* Derangements, Flaws, Mutations, & Permataint */}
              {character.selfNerfs && character.selfNerfs.length > 0 && (
                <div className={`${themeClasses.card} p-3`}>
                  <h3 className="text-xl font-bold mb-2">Derangements, Flaws, Mutations, & Permataint</h3>
                  <div className="space-y-2">
                    {character.selfNerfs.map((selfNerf, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-900 bg-opacity-20 rounded border border-red-500">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs rounded-full mr-3 ${
                            selfNerf.type === 'derangement' ? 'bg-blue-600 text-blue-100' :
                            selfNerf.type === 'flaw' ? 'bg-red-600 text-red-100' :
                            selfNerf.type === 'mutation' ? 'bg-yellow-600 text-yellow-100' :
                            'bg-purple-600 text-purple-100'
                          }`}>
                            {selfNerf.type}
                          </span>
                          <div>
                            <div className="font-medium text-red-300">{selfNerf.name}</div>
                            <div className="text-xs text-gray-400">{selfNerf.category}</div>
                          </div>
                        </div>
                      </div>
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-2 sm:space-y-0">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Experience Points</h3>
                    <div className="text-center sm:text-right">
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{character.totalXP}</div>
                      <div className="text-blue-200 text-sm">Available XP</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
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
                          👹 <strong>Claimed Fomori:</strong> Bane possession grants access to your chosen Bane manifestation ({character.innateTreeIds.length > 0 ? gameData.powerTrees.find(t => t.tree_id === character.innateTreeIds[0])?.tree_name || 'None' : 'None'}) at innate costs (3/6/9 XP), other Bane trees cost 6/9/12 XP. {character.mixedSubfaction ? `Your original ${character.mixedSubfaction === 'kinfolk' ? 'Gifted Kinfolk' : character.mixedSubfaction} heritage also remains at innate costs.` : 'If you had prior supernatural heritage, that would also remain at innate costs.'}
                        </div>
                      </div>
                    )}
                    {character.faction === 'human' && character.subfaction === 'claimed_gorgon' && (
                      <div className="mb-2 p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                        <div className="text-purple-300 text-sm">
                          👁️ <strong>Claimed Gorgon:</strong> Dream reality binding grants access to Gorgon manifestation at innate costs (3/6/9 XP). {character.mixedSubfaction ? `Your original ${character.mixedSubfaction === 'kinfolk' ? 'Gifted Kinfolk' : character.mixedSubfaction} heritage also remains at innate costs.` : 'If you had prior supernatural heritage, that would also remain at innate costs.'}
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

                  {/* Claimed Status Powers */}
                  {character.claimedStatus && character.claimedInnateTreeIds && character.claimedInnateTreeIds.length > 0 && (
                    <div>
                      <h4 className="font-medium text-purple-400 mb-2 mt-6">
                        Claimed {character.claimedStatus.charAt(0).toUpperCase() + character.claimedStatus.slice(1)} Powers (Innate: 3/6/9 XP)
                      </h4>
                      <div className="mb-3 p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                        <div className="text-purple-300 text-sm">
                          🔗 <strong>Dual Heritage:</strong> Your {character.claimedStatus} claimed status grants access to these power trees at innate costs.
                        </div>
                      </div>
                      <div className="space-y-3">
                        {character.claimedInnateTreeIds.map(treeId => {
                          const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                          if (!tree) return null;
                          
                          const currentLevels = character.powers[treeId] || {};
                          const hasAnyLevel = Object.keys(currentLevels).length > 0;
                          
                          return (
                            <div 
                              key={treeId} 
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                hasAnyLevel
                                  ? 'border-purple-500 bg-purple-500 bg-opacity-20 shadow-lg'
                                  : 'border-purple-400 bg-purple-400 bg-opacity-10 hover:border-purple-300 hover:bg-purple-400 hover:bg-opacity-20 hover:shadow-md'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <h5 className="font-bold text-lg capitalize">{formatDisplayText(tree.tree_name)}</h5>
                                    {hasAnyLevel && (
                                      <div className="ml-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {[1, 2, 3].map(level => {
                                      const hasLevel = currentLevels[level];
                                      const powers = tree[`level${level}_powers`]?.split('|') || [];
                                      const cost = calculateXPCost(character, 'power', treeId, level);
                                      const canAfford = character.totalXP >= cost;
                                      const canLearnLevel = canLearnPower(character, treeId, level);
                                      const canAdvanceNow = canAfford && canLearnLevel;
                                      const isRedundant = isRedundantPower(character, treeId, level);
                                      
                                      return (
                                        <div key={level} className={`p-3 rounded border ${
                                          hasLevel 
                                            ? 'border-purple-400 bg-purple-400 bg-opacity-20' 
                                            : canAdvanceNow
                                              ? 'border-purple-300 bg-purple-300 bg-opacity-10 hover:bg-purple-300 hover:bg-opacity-20'
                                              : 'border-gray-600 bg-gray-700 bg-opacity-30 opacity-50'
                                        }`}>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                              <div className={`w-4 h-4 rounded-full mr-2 ${
                                                hasLevel ? 'bg-purple-500' : canAdvanceNow ? 'bg-purple-300' : 'bg-gray-600'
                                              }`} />
                                              <span className="font-medium">Level {level}</span>
                                              <span className={`ml-2 text-sm ${
                                                isRedundant ? 'text-yellow-400' : cost === 0 ? 'text-green-400' : 'text-gray-400'
                                              }`}>
                                                ({isRedundant ? 'FREE' : cost === 0 ? 'FREE' : `${cost} XP`})
                                              </span>
                                            </div>
                                            {!hasLevel && (
                                              <button
                                                onClick={() => {
                                                  const updated = advanceCharacter(character, {
                                                    type: 'power',
                                                    itemId: treeId,
                                                    level: level,
                                                    cost: isRedundant ? 0 : cost,
                                                    redundant: isRedundant
                                                  });
                                                  const newCharacters = [...characters];
                                                  newCharacters[currentCharacterIndex] = updated;
                                                  setCharacters(newCharacters);
                                                }}
                                                className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                                  canAdvanceNow
                                                    ? isRedundant 
                                                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-md hover:shadow-lg' 
                                                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md hover:shadow-lg'
                                                    : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                }`}
                                                disabled={!canAdvanceNow}
                                              >
                                                {canAdvanceNow ? 'Learn' : canAfford ? 'Limit Reached' : 'Cannot Afford'}
                                              </button>
                                            )}
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

                  {/* Original Heritage Powers (Mixed Subfaction) */}
                  {character.mixedSubfaction && (
                    <div>
                      <h4 className="font-medium text-orange-400 mb-2 mt-6">
                        Original Heritage Powers ({character.mixedSubfaction === 'kinfolk' ? 'Former Gifted Kinfolk' : 'Former ' + character.mixedSubfaction.charAt(0).toUpperCase() + character.mixedSubfaction.slice(1)} - Innate: 3/6/9 XP)
                      </h4>
                      <div className="mb-3 p-3 bg-orange-600 bg-opacity-20 rounded-lg">
                        <div className="text-orange-300 text-sm">
                          🔗 <strong>Dual Heritage:</strong> Your original supernatural nature remains accessible at innate costs. You were a {character.mixedSubfaction === 'kinfolk' ? 'Gifted Kinfolk' : character.mixedSubfaction} before being {character.subfaction === 'claimed_gorgon' ? 'claimed by dream entities' : 'possessed by a Bane spirit'}.
                        </div>
                      </div>
                      <div className="space-y-3">
                        {gameData.powerTrees
                          .filter(tree => {
                            // Filter based on mixed subfaction type
                            if (character.mixedSubfaction === 'sorcerer') {
                              return tree.faction === 'human' && 
                                ['animal', 'body', 'curse', 'healer', 'mind', 'patterns', 'perception', 'protection', 'spirit', 'warrior'].includes(tree.tree_id);
                            }
                            if (character.mixedSubfaction === 'ghoul') {
                              return tree.faction === 'vampire';
                            }
                            if (character.mixedSubfaction === 'kinfolk') {
                              return tree.faction === 'shifter';
                            }
                            return false;
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
                                    ? 'border-orange-500 bg-orange-500 bg-opacity-20 shadow-lg'
                                    : 'border-orange-400 bg-orange-400 bg-opacity-10 hover:border-orange-300 hover:bg-orange-400 hover:bg-opacity-20 hover:shadow-md'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                      <h5 className="font-bold text-lg capitalize">{formatDisplayText(tree.tree_name)}</h5>
                                      {hasAnyLevel && (
                                        <div className="ml-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-sm">✓</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                      {[1, 2, 3].map(level => {
                                        const hasLevel = currentLevels[level];
                                        const powers = tree[`level${level}_powers`]?.split('|') || [];
                                        const cost = calculateXPCost(character, 'power', tree.tree_id, level);
                                        const canAfford = character.totalXP >= cost;
                                        const canLearnLevel = canLearnPower(character, tree.tree_id, level);
                                        const canAdvanceNow = canAfford && canLearnLevel;
                                        const isRedundant = isRedundantPower(character, tree.tree_id, level);
                                        
                                        return (
                                          <div key={level} className={`p-3 rounded border ${
                                            hasLevel 
                                              ? 'border-orange-400 bg-orange-400 bg-opacity-20' 
                                              : canAdvanceNow
                                                ? 'border-orange-300 bg-orange-300 bg-opacity-10 hover:bg-orange-300 hover:bg-opacity-20'
                                                : 'border-gray-600 bg-gray-700 bg-opacity-30 opacity-50'
                                          }`}>
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center">
                                                <div className={`w-4 h-4 rounded-full mr-2 ${
                                                  hasLevel ? 'bg-orange-500' : canAdvanceNow ? 'bg-orange-300' : 'bg-gray-600'
                                                }`} />
                                                <span className="font-medium">Level {level}</span>
                                                <span className={`ml-2 text-sm ${
                                                  isRedundant ? 'text-yellow-400' : cost === 0 ? 'text-green-400' : 'text-gray-400'
                                                }`}>
                                                  ({isRedundant ? 'FREE' : cost === 0 ? 'FREE' : `${cost} XP`})
                                                </span>
                                              </div>
                                              {!hasLevel && (
                                                <button
                                                  onClick={() => {
                                                    const updated = advanceCharacter(character, {
                                                      type: 'power',
                                                      itemId: tree.tree_id,
                                                      level: level,
                                                      cost: isRedundant ? 0 : cost,
                                                      redundant: isRedundant
                                                    });
                                                    const newCharacters = [...characters];
                                                    newCharacters[currentCharacterIndex] = updated;
                                                    setCharacters(newCharacters);
                                                  }}
                                                  className={`px-4 py-2 rounded font-medium text-sm transition-all ${
                                                    canAdvanceNow
                                                      ? isRedundant 
                                                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-md hover:shadow-lg' 
                                                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md hover:shadow-lg'
                                                      : 'bg-gray-700 cursor-not-allowed text-gray-400'
                                                  }`}
                                                  disabled={!canAdvanceNow}
                                                >
                                                  {canAdvanceNow ? 'Learn' : canAfford ? 'Limit Reached' : 'Cannot Afford'}
                                                </button>
                                              )}
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
              {character.selfNerfs && character.selfNerfs.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-bold text-orange-400 mb-2">Self-Nerf History</h4>
                  <div className="space-y-2">
                    {character.selfNerfs.map((nerf, index) => (
                      <div key={index} className="p-3 bg-orange-900 bg-opacity-30 rounded">
                        <div className="font-medium capitalize">{nerf.type}: {nerf.name}</div>
                        <div className="text-sm text-gray-400">{nerf.description}</div>
                        {nerf.gameEffect && (
                          <div className="text-sm text-orange-300">Effect: {nerf.gameEffect}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Added: {new Date(nerf.dateAdded).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'power-index' && (
            <div className={`${themeClasses.card} p-3`}>
              <PowerIndex embedded={true} />
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className={`${themeClasses.card} p-3`}>
                <h3 className="text-xl font-bold mb-2">Available Lore</h3>
                
                {/* Lore Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search lore by name, description, or category..."
                      value={loreSearchQuery}
                      onChange={(e) => handleLoreSearch(e.target.value)}
                      className={`${themeClasses.input} pl-10`}
                    />
                  </div>
                  {loreSearchQuery && loreSearchResults.length > 0 && (
                    <div className="text-sm text-gray-400 mt-1">
                      Found {loreSearchResults.length} result{loreSearchResults.length !== 1 ? 's' : ''} for "{loreSearchQuery}"
                    </div>
                  )}
                </div>
                
                {/* Current Lore */}
                {(() => {
                  // Defensive programming: handle both array and object formats
                  const loresArray = Array.isArray(character.lores) ? character.lores : 
                    character.lores ? Object.keys(character.lores).map(loreId => ({ lore_id: loreId })) : [];
                  
                  return loresArray.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-lg font-bold mb-2 text-green-400">Current Lore</h4>
                      <div className="grid gap-2">
                        {loresArray.map((lore, index) => {
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
                  );
                })()}

                {/* Available Lore for Purchase */}
                <div>
                  <h4 className="text-lg font-bold mb-2">Available for Purchase</h4>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {(loreSearchQuery.trim() ? loreSearchResults : getAvailableLores(character, true)).map((lore) => {
                      // Normalize lore properties to handle both data structures
                      const loreId = lore.lore_id || lore.id;
                      const loreName = lore.lore_name || lore.name;
                      const loreCategory = lore.category;
                      const loreDescription = lore.description;
                      const loreCostType = lore.cost_type || lore.costType;
                      
                      const cost = calculateXPCost(character, 'lore', loreId);
                      const unspentXP = character.totalXP;
                      const canAfford = unspentXP >= cost;
                      // Defensive programming: ensure lores is an array
                      const loresArray = Array.isArray(character.lores) ? character.lores : 
                        character.lores ? Object.keys(character.lores).map(loreId => ({ lore_id: loreId })) : [];
                      const alreadyHas = loresArray.some(l => l.lore_id === loreId);
                      
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
                        <div key={loreId} className={`${themeClasses.card} p-3 border ${getBorderColor(loreCategory)} ${!canAfford ? 'opacity-50' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className={`font-bold ${getTextColor(loreCategory)}`}>{loreName}</h5>
                              <p className="text-sm text-gray-400 mt-1">{loreDescription}</p>
                              <p className="text-xs text-blue-400 mt-2">
                                Category: {loreCategory} • Cost Type: {loreCostType}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className={`font-bold ${getTextColor(loreCategory)}`}>{cost} XP</span>
                              <button
                                onClick={() => {
                                  if (canAfford) {
                                    const advancement = {
                                      type: 'lore',
                                      itemId: loreId,
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
                                title={canAfford ? `Purchase ${loreName}` : 'Insufficient XP'}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {(loreSearchQuery.trim() ? loreSearchResults : getAvailableLores(character, true)).length === 0 && (
                    <div className="text-center py-8">
                      <Book className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">
                        {loreSearchQuery.trim() ? `No lore found matching "${loreSearchQuery}"` : 'No lore available'}
                      </p>
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

          {activeTab === 'faction-change' && (
            <div className="space-y-5">
              {/* Faction Change Header */}
              <div className={`${themeClasses.card} p-5`}>
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3 text-purple-400">🔄 Supernatural Transformation</h2>
                  <p className="text-lg text-gray-300 mb-4">
                    Transform your character into a different supernatural type through major story events
                  </p>
                  <div className="text-sm text-gray-400">
                    Represents Embrace, First Change, Death & Return, Supernatural Claiming, or Possession
                  </div>
                </div>
              </div>

              {/* Available Faction Changes */}
              {getValidFactionChanges(character).length > 0 ? (
                <div className={`${themeClasses.card} p-5`}>
                  <h3 className="text-2xl font-bold mb-4 text-purple-300">Available Transformations</h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getValidFactionChanges(character).map(change => (
                      <button
                        key={change.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFactionChangeClick(change);
                        }}
                        className="p-4 rounded-lg border-2 border-purple-500 bg-purple-500 bg-opacity-10 hover:bg-purple-500 hover:bg-opacity-20 transition-all text-left hover:scale-105 hover:shadow-lg active:scale-95 active:bg-purple-600 active:bg-opacity-30"
                      >
                        <h4 className="font-bold text-xl text-purple-300 mb-2">{change.name}</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{change.description}</p>
                        <div className="mt-2 text-xs text-purple-400">Click to transform</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-600 bg-opacity-20 rounded-lg border border-yellow-500">
                    <h4 className="font-bold mb-2 text-yellow-300">⚠️ Important Information</h4>
                    <ul className="space-y-1 text-sm text-yellow-200">
                      <li>• Faction changes are permanent and cannot be undone</li>
                      <li>• Your current energy amount is preserved (up to new faction maximum)</li>
                      <li>• You gain new faction fundamental powers and abilities</li>
                      <li>• Some original abilities may be modified or lost</li>
                      <li>• Original faction information is recorded in character history</li>
                      <li>• Consider the story implications for your character</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className={`${themeClasses.card} p-5 text-center`}>
                  <div className="text-gray-400 text-xl mb-3">No Faction Changes Available</div>
                  <div className="text-gray-500">
                    {character.faction === 'wraith' 
                      ? 'Wraiths have already undergone their final transformation and cannot change factions further.'
                      : 'Your character does not have any valid supernatural transformation options at this time.'
                    }
                  </div>
                </div>
              )}

              {/* Free Faction Change Powers Assignment */}
              {character.tempFactionChangePowers > 0 && (
                <div className={`${themeClasses.card} p-5`}>
                  <h3 className="text-2xl font-bold mb-4 text-green-400">
                    🎁 Free Transformation Powers ({character.tempFactionChangePowers} remaining)
                  </h3>
                  <p className="text-gray-300 mb-4">
                    You have {character.tempFactionChangePowers} free power dots to assign from your new faction's innate abilities.
                    These represent the supernatural gifts gained from your transformation.
                  </p>
                  
                  <div className="space-y-4">
                    {character.innateTreeIds.map(treeId => {
                      const tree = gameData.powerTrees.find(t => t.tree_id === treeId);
                      if (!tree) return null;
                      
                      return (
                        <div key={treeId} className="border-2 border-green-500 rounded-lg p-4 bg-green-500 bg-opacity-5">
                          <h4 className="font-bold text-xl capitalize mb-3 text-green-300">
                            {formatDisplayText(tree.tree_name)}
                          </h4>
                          
                          <div className="space-y-3">
                            {[1, 2, 3].map(level => {
                              const hasLevel = character.powers[treeId]?.[level];
                              const powers = tree[`level${level}_powers`]?.split('|') || [];
                              
                              return (
                                <div key={level} className={`p-3 rounded-lg border ${
                                  hasLevel 
                                    ? 'border-green-400 bg-green-400 bg-opacity-20' 
                                    : 'border-gray-600 bg-gray-800 bg-opacity-30'
                                }`}>
                                  <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                      <div className="flex items-center mb-2">
                                        <span className="font-bold text-lg">Level {level}</span>
                                        {hasLevel && (
                                          <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                            ✓ Acquired
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-gray-300">{powers.join(', ')}</div>
                                    </div>
                                    {!hasLevel && character.tempFactionChangePowers > 0 && (
                                      <button
                                        onClick={() => {
                                          const updated = {
                                            ...character,
                                            powers: {
                                              ...character.powers,
                                              [treeId]: {
                                                ...character.powers[treeId],
                                                [level]: true
                                              }
                                            },
                                            tempFactionChangePowers: character.tempFactionChangePowers - 1
                                          };
                                          
                                          const newCharacters = [...characters];
                                          newCharacters[currentCharacterIndex] = updated;
                                          setCharacters(newCharacters);
                                        }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                      >
                                        Select (FREE)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {character.tempFactionChangePowers > 0 && (
                    <div className="mt-4 p-3 bg-blue-600 bg-opacity-20 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        💡 <strong>Tip:</strong> These free powers represent your character's natural adaptation to their new supernatural nature. 
                        Choose wisely as they cannot be changed later!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Character History - Show if faction change occurred */}
              {character.originalFaction && (
                <div className={`${themeClasses.card} p-5`}>
                  <h3 className="text-xl font-bold mb-4 text-orange-400">📜 Transformation History</h3>
                  <div className="p-4 bg-orange-600 bg-opacity-20 rounded-lg border border-orange-500">
                    <div className="text-lg mb-2">
                      <span className="text-gray-300">Originally:</span>
                      <span className="ml-2 font-bold capitalize text-orange-300">
                        {formatDisplayText(character.originalFaction)} 
                        {character.originalSubfaction && ` - ${formatDisplayText(character.originalSubfaction)}`}
                      </span>
                    </div>
                    <div className="text-lg">
                      <span className="text-gray-300">Transformed to:</span>
                      <span className="ml-2 font-bold capitalize text-purple-300">
                        {formatDisplayText(character.faction)} 
                        {character.subfaction && ` - ${formatDisplayText(character.subfaction)}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'self-nerf' && (
            <div className="space-y-5">
              {/* Self Nerf Header */}
              <div className={`${themeClasses.card} p-5`}>
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3 text-red-400">⚖️ Character Limitations</h2>
                  <p className="text-lg text-gray-300 mb-4">
                    Track derangements, flaws, mutations, and permanent taints that affect your character
                  </p>
                  <div className="text-sm text-gray-400">
                    Self-imposed limitations, psychological issues, physical alterations, and permanent supernatural conditions
                  </div>
                </div>
              </div>

              {/* Add Self Nerf Form */}
              <div className={`${themeClasses.card} p-5`}>
                <h3 className="text-2xl font-bold mb-4 text-red-300">Add New Limitation</h3>
                <SelfNerfForm
                  character={character}
                  onUpdate={(updatedCharacter) => {
                    const newCharacters = [...characters];
                    newCharacters[currentCharacterIndex] = updatedCharacter;
                    setCharacters(newCharacters);
                  }}
                />
              </div>

              {/* Current Self Nerfs */}
              <div className={`${themeClasses.card} p-5`}>
                <h3 className="text-2xl font-bold mb-4 text-red-300">Current Limitations</h3>
                
                {character.selfNerfs && character.selfNerfs.length > 0 ? (
                  <div className="space-y-3">
                    {character.selfNerfs.map((selfNerf, index) => (
                      <div key={index} className="border-2 border-red-500 rounded-lg p-4 bg-red-500 bg-opacity-5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full mr-3">
                                {selfNerf.category}
                              </span>
                              <h4 className="font-bold text-lg text-red-300">{selfNerf.name}</h4>
                            </div>
                            <p className="text-gray-300 mb-2">{selfNerf.description}</p>
                            {selfNerf.mechanicalEffect && (
                              <div className="p-2 bg-red-900 bg-opacity-30 rounded text-sm">
                                <span className="font-semibold text-red-400">Mechanical Effect: </span>
                                <span className="text-gray-300">{selfNerf.mechanicalEffect}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const updated = {
                                ...character,
                                selfNerfs: character.selfNerfs.filter((_, i) => i !== index)
                              };
                              const newCharacters = [...characters];
                              newCharacters[currentCharacterIndex] = updated;
                              setCharacters(newCharacters);
                            }}
                            className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-xl mb-3">No limitations recorded</div>
                    <div className="text-gray-500">
                      Use the form above to add derangements, flaws, or permanent taints
                    </div>
                  </div>
                )}
              </div>

              {/* Information Panel */}
              <div className={`${themeClasses.card} p-5`}>
                <h3 className="text-xl font-bold mb-4 text-orange-400">📋 About Character Limitations</h3>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <h4 className="font-semibold text-orange-300 mb-2">Derangements</h4>
                    <p className="text-sm mb-3">
                      Serious alterations to your thought pattern brought on by some interaction of supernatural forces. 
                      While some of these traits share names with real world conditions, we acknowledge that these roleplay 
                      requirements do not represent real-world experiences.
                    </p>
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      <div><strong>Amnesia:</strong> You have trouble remembering past events.</div>
                      <div><strong>Aphasia:</strong> You are unable to speak coherently.</div>
                      <div><strong>Melancholia:</strong> You are extremely depressed and difficult to motivate.</div>
                      <div><strong>Delusional:</strong> You believe in a reality that simply doesn't exist.</div>
                      <div><strong>Masochism:</strong> You drive others to cause you pain.</div>
                      <div><strong>Megalomania:</strong> You must seek to control things.</div>
                      <div><strong>Multiple Personality Disorder:</strong> You have several distinct personalities, only one of which manifests at any given time.</div>
                      <div><strong>Obsessive Compulsion:</strong> You have a specific order that things must be kept in. If it is out of place, you will replace it.</div>
                      <div><strong>Paranoia:</strong> You consider everything a threat.</div>
                      <div><strong>Regression:</strong> Your mind has reverted to a childlike state to protect itself from the world.</div>
                      <div><strong>Schizophrenia:</strong> You hear voices and follow their instructions.</div>
                      <div><strong>Synesthesia:</strong> You are in a permanent hallucinatory state.</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-300 mb-2">Flaws</h4>
                    <p className="text-sm mb-3">
                      Flaws are like physical derangements; alterations to your body that are caused by supernatural forces. 
                      Once again, we acknowledge that these roleplay requirements do not represent real-world experiences of 
                      conditions with similar names. You cannot pick a Flaw that will not impact your character (e.g. "No Claws" 
                      on a character without any mechanical access to claws anyways).
                    </p>
                    <div className="grid md:grid-cols-2 gap-2 text-xs">
                      <div><strong>Deranged:</strong> Select a derangement from the list above.</div>
                      <div><strong>Fragile:</strong> All damage is considered aggravated.</div>
                      <div><strong>Hemophilia:</strong> Your Regeneration Rate is always 0.</div>
                      <div><strong>Horns:</strong> You must wear horns.</div>
                      <div><strong>Lame:</strong> You cannot run.</div>
                      <div><strong>Mute:</strong> You cannot speak.</div>
                      <div><strong>No Claws:</strong> You cannot use claws or purchase the Merit Mix Morph.</div>
                      <div><strong>Puny:</strong> Your base maximum Health is 8 instead of 10.</div>
                      <div><strong>Restricted Form (Shifter Only):</strong> You must always wear your War Form mask.</div>
                      <div><strong>Tail:</strong> You must wear a tail.</div>
                      <div><strong>Withered Arm:</strong> You cannot use one arm to hold any items during game (including packets).</div>
                      <div><strong>Weak Musculature (Shifter Only):</strong> You do not get the Augment 1 bonus usually granted through War Form.</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-300 mb-2">Mutations</h4>
                    <p className="text-sm mb-3">
                      Physical alterations to your body caused by supernatural forces, particularly Bane influence in Fomori. 
                      These manifest as visible or hidden changes that distinguish you from normal humans. Unlike flaws, 
                      mutations are specifically tied to corruption from otherworldly entities.
                    </p>
                    <p className="text-sm text-gray-400 mb-2">
                      Examples: Extra eyes, chitinous shell, acidic blood, additional limbs, tentacles, scales, wings, 
                      bone spurs, oversized organs, or any other physical manifestation of supernatural corruption.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-300 mb-2">Permanent Taints</h4>
                    <p className="text-sm">
                      Lasting supernatural corruption or changes that cannot be easily removed.
                      These represent permanent alterations to your character's essence or nature.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank/Gen Tab */}
          {activeTab === 'rank-gen' && (
            <div className="space-y-5">
              {/* Rank/Gen Header */}
              <div className={`${themeClasses.card} p-5`}>
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-3 text-purple-400">👑 Rank & Generation</h2>
                  <p className="text-lg text-gray-300 mb-4">
                    Manage your character's rank (Shifters) or generation (Vampires) and associated status
                  </p>
                  <div className="text-sm text-gray-400">
                    Rank determines standing in shifter society, while generation indicates vampiric potency
                  </div>
                </div>
              </div>

              {/* Rank/Gen Management */}
              <div className={`${themeClasses.card} p-5`}>
                <h3 className="text-2xl font-bold mb-4 text-purple-300">
                  {character.faction === 'shifter' ? 'Shifter Rank' : 
                   character.faction === 'vampire' ? 'Generation' : 'Rank/Status'}
                </h3>
                
                {character.faction === 'shifter' && (
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">
                      Select your character's rank in shifter society:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['cub', 'cliath', 'fostern', 'adren', 'athro', 'elder'].map(rank => (
                        <button
                          key={rank}
                          onClick={() => {
                            const updatedCharacter = { ...character, rank };
                            const newCharacters = [...characters];
                            newCharacters[currentCharacterIndex] = updatedCharacter;
                            setCharacters(newCharacters);
                          }}
                          className={`p-3 rounded-lg border-2 transition-colors text-center capitalize ${
                            character.rank === rank
                              ? 'border-purple-400 bg-purple-400 bg-opacity-20 text-purple-300'
                              : 'border-gray-600 bg-gray-700 bg-opacity-30 text-gray-300 hover:border-purple-500'
                          }`}
                        >
                          <div className="font-semibold">{rank}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {rank === 'cub' && 'Novice'}
                            {rank === 'cliath' && 'Young Adult'}
                            {rank === 'fostern' && 'Full Adult'}
                            {rank === 'adren' && 'Experienced'}
                            {rank === 'athro' && 'Elder'}
                            {rank === 'elder' && 'Ancient'}
                          </div>
                        </button>
                      ))}
                    </div>
                    {character.rank && (
                      <div className="mt-4 p-4 bg-purple-900 bg-opacity-30 rounded-lg">
                        <h4 className="font-semibold text-purple-300 mb-2">Current Rank: {character.rank}</h4>
                        <p className="text-sm text-gray-300">
                          {character.rank === 'cub' && 'The youngest and most inexperienced rank. Still learning the ways of the Garou.'}
                          {character.rank === 'cliath' && 'Young adults who have completed their Rite of Passage but lack experience.'}
                          {character.rank === 'fostern' && 'Full adults with proven experience and competence in their duties.'}
                          {character.rank === 'adren' && 'Experienced and respected members who have shown wisdom and leadership.'}
                          {character.rank === 'athro' && 'Elders who have achieved great deeds and command significant respect.'}
                          {character.rank === 'elder' && 'The most ancient and revered, with centuries of wisdom and power.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {character.faction === 'vampire' && (
                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">
                      Enter your vampire's generation (distance from Caine):
                    </p>
                    <div className="flex items-center space-x-4">
                      <label className="text-gray-300 font-medium">Generation:</label>
                      <input
                        type="number"
                        min="6"
                        max="13"
                        value={character.generation || ''}
                        onChange={(e) => {
                          const generation = parseInt(e.target.value);
                          const updatedCharacter = { ...character, generation };
                          const newCharacters = [...characters];
                          newCharacters[currentCharacterIndex] = updatedCharacter;
                          setCharacters(newCharacters);
                        }}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-purple-400 focus:outline-none"
                        placeholder="13"
                      />
                    </div>
                    
                    {/* Amaranth Count Section */}
                    <div className="mt-6 p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-600">
                      <h4 className="text-lg font-semibold text-red-300 mb-3">⚠️ Amaranth Count</h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Track the number of times this vampire has committed amaranth (diablerie) - the consumption of another vampire's soul.
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="text-gray-300 font-medium">Amaranth Count:</label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const amaranthCount = Math.max(0, (character.amaranthCount || 0) - 1);
                              const updatedCharacter = { ...character, amaranthCount };
                              const newCharacters = [...characters];
                              newCharacters[currentCharacterIndex] = updatedCharacter;
                              setCharacters(newCharacters);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-lg font-bold"
                            disabled={(character.amaranthCount || 0) <= 0}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 min-w-[3rem] text-center">
                            {character.amaranthCount || 0}
                          </span>
                          <button
                            onClick={() => {
                              const amaranthCount = (character.amaranthCount || 0) + 1;
                              const updatedCharacter = { ...character, amaranthCount };
                              const newCharacters = [...characters];
                              newCharacters[currentCharacterIndex] = updatedCharacter;
                              setCharacters(newCharacters);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {(character.amaranthCount || 0) > 0 && (
                        <div className="mt-3 p-3 bg-red-800 bg-opacity-50 rounded border border-red-500">
                          <p className="text-sm text-red-200">
                            <strong>Warning:</strong> This vampire has committed amaranth {character.amaranthCount} time{character.amaranthCount !== 1 ? 's' : ''}. 
                            Amaranth is considered one of the greatest sins in vampire society and leaves permanent spiritual stains.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {character.generation && (
                      <div className="mt-4 p-4 bg-purple-900 bg-opacity-30 rounded-lg">
                        <h4 className="font-semibold text-purple-300 mb-2">Generation {character.generation}</h4>
                        <p className="text-sm text-gray-300">
                          {character.generation === 6 && 'Methuselah - Ancient vampire with immense power and influence.'}
                          {character.generation === 7 && 'Methuselah - Ancient vampire with great power and centuries of experience.'}
                          {character.generation === 8 && 'Elder - Old vampire with significant abilities and established status.'}
                          {character.generation === 9 && 'Elder - Experienced vampire with considerable supernatural power.'}
                          {character.generation === 10 && 'Ancilla - Mature vampire with proven abilities and respect.'}
                          {character.generation === 11 && 'Ancilla - Established vampire with developing influence.'}
                          {character.generation === 12 && 'Neonate - Young vampire, recently past fledgling status.'}
                          {character.generation === 13 && 'Neonate - Newly embraced vampire, still learning their nature.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {character.faction !== 'shifter' && character.faction !== 'vampire' && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-xl mb-3">Rank/Generation not applicable</div>
                    <div className="text-gray-500">
                      This character type does not use the rank or generation system
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Rank Information */}
              {character.faction === 'shifter' && (
                <div className={`${themeClasses.card} p-5`}>
                  <h3 className="text-xl font-bold mb-4 text-orange-400">📋 About Shifter Ranks</h3>
                  <div className="space-y-4 text-gray-300">
                    <p className="text-sm">
                      Shifter society is organized by rank, which represents age, experience, wisdom, and spiritual development. 
                      Each rank comes with different responsibilities and social expectations.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-purple-300 mb-2">Rank Progression</h4>
                        <div className="space-y-1">
                          <div><strong>Cub:</strong> Children and adolescents</div>
                          <div><strong>Cliath:</strong> Recently completed First Change</div>
                          <div><strong>Fostern:</strong> Proven adults with experience</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-purple-300 mb-2">Higher Ranks</h4>
                        <div className="space-y-1">
                          <div><strong>Adren:</strong> Experienced leaders and teachers</div>
                          <div><strong>Athro:</strong> Respected elders and heroes</div>
                          <div><strong>Elder:</strong> Ancient and revered ancestors</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Generation & Amaranth Information */}
              {character.faction === 'vampire' && (
                <div className={`${themeClasses.card} p-5`}>
                  <h3 className="text-xl font-bold mb-4 text-red-400">🩸 About Generation & Amaranth</h3>
                  <div className="space-y-4 text-gray-300">
                    <div>
                      <h4 className="font-semibold text-purple-300 mb-2">Generation</h4>
                      <p className="text-sm mb-3">
                        A vampire's generation indicates their distance from Caine, the first vampire. Lower generation means closer to the source and greater potential power.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-semibold text-orange-300 mb-1">Ancient Generations</h5>
                          <div className="space-y-1">
                            <div><strong>6th-7th Gen:</strong> Methuselahs with vast power</div>
                            <div><strong>8th-9th Gen:</strong> Elders with significant abilities</div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-orange-300 mb-1">Modern Generations</h5>
                          <div className="space-y-1">
                            <div><strong>10th-11th Gen:</strong> Ancillae with established status</div>
                            <div><strong>12th-13th Gen:</strong> Neonates and fledglings</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-600 pt-4">
                      <h4 className="font-semibold text-red-300 mb-2">Amaranth (Diablerie)</h4>
                      <p className="text-sm mb-3">
                        Amaranth is the forbidden practice of consuming another vampire's soul and essence. It is considered one of the greatest sins in Kindred society.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-semibold text-red-300 mb-1">Consequences</h5>
                          <div className="space-y-1">
                            <div>• Permanent spiritual stain on the soul</div>
                            <div>• Detectable by Auspex and other powers</div>
                            <div>• Subject to Final Death if discovered</div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-semibold text-red-300 mb-1">Detection</h5>
                          <div className="space-y-1">
                            <div>• Dark veins visible in vampire's aura</div>
                            <div>• Spiritual taint grows with each act</div>
                            <div>• Memories of victims may surface</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
      <div className="w-full max-w-4xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-5 space-y-3 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Settings & Accessibility</h2>
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
                  <option value="pdf">PDF (Character Sheet)</option>
                  <option value="pdf-debug">PDF (Debug - Field Names)</option>
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

  // Changelog
  const renderChangelog = () => (
    <div className={`min-h-screen ${themeClasses.base}`}>
      <div className="w-full max-w-4xl mx-auto px-2 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-5">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-400 mb-2">Shadow Accord Character Builder</h1>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Changelog</h2>
          <p className="text-base sm:text-lg text-gray-400">Current Version: {currentVersion}</p>
        </div>

        {/* Back Button */}
        <div className="mb-4 sm:mb-5">
          <button
            onClick={() => setCurrentMode('menu')}
            className={`${themeClasses.card} px-4 py-2 hover:shadow-lg transition-all flex items-center gap-2`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Main Menu
          </button>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-5">
          {changelog.map((entry, index) => (
            <div key={index} className={`${themeClasses.card} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-blue-400">Version {entry.version}</h3>
                <span className="text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Changes:</h4>
                <ul className="space-y-1">
                  {entry.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-5 border-t border-gray-700">
          <p className="text-gray-400">
            Thank you for using Shadow Accord Character Builder!
          </p>
        </div>
      </div>
    </div>
  );

  // Main Render Logic
  const renderCurrentMode = () => {
    switch (currentMode) {
      case 'menu': return renderMainMenu();
      case 'creation': return renderCharacterCreation();
      case 'management': return renderCharacterManagement();
      case 'character': return renderCharacterView();
      case 'power-index': return <PowerIndex onBack={() => setCurrentMode('menu')} />;
      case 'settings': return renderSettings();
      case 'changelog': return renderChangelog();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentMode()}
      
      {/* Faction Change Modal - Rendered at root level */}
      {factionChangeModal && selectedFactionChange && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4">
          <div className={`bg-gray-800 border border-gray-600 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-500 shadow-2xl`}>
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-purple-400">
                  🔄 Change to {selectedFactionChange.name}
                </h3>
                <button
                  onClick={() => {
                    setFactionChangeModal(false);
                    setSelectedFactionChange(null);
                  }}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-purple-600 bg-opacity-20 rounded-lg">
                  <h4 className="font-bold mb-2 text-white">What will happen:</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• Your character becomes {selectedFactionChange.name}</li>
                    <li>• Current energy amount preserved (up to new faction maximum)</li>
                    <li>• Gain new faction's fundamental powers</li>
                    <li>• {selectedFactionChange.description}</li>
                    <li>• Original faction recorded in character history</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-yellow-600 bg-opacity-20 rounded-lg border border-yellow-500">
                  <h4 className="font-bold mb-2 text-yellow-300">⚠️ Important Notes:</h4>
                  <ul className="space-y-1 text-sm text-yellow-200">
                    <li>• This change is permanent and cannot be undone</li>
                    <li>• Some original abilities may be lost</li>
                    <li>• You may need to make additional choices after conversion</li>
                    <li>• Consider the story implications for your character</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setFactionChangeModal(false);
                    setSelectedFactionChange(null);
                  }}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const character = characters[currentCharacterIndex];
                    
                    // Enhanced confirmation dialog
                    const confirmMessage = `🔄 FACTION TRANSFORMATION CONFIRMATION

Character: ${character.name}
Current Faction: ${formatDisplayText(character.faction)} ${character.subfaction ? `- ${formatDisplayText(character.subfaction)}` : ''}
New Faction: ${selectedFactionChange.name}

This transformation will:
• Change your supernatural type permanently
• Take you through character creation to select new clan/tribe/court and abilities
• Preserve your current energy (up to new maximum)
• ${selectedFactionChange.description}
• Record this change in your character history

⚠️ THIS CANNOT BE UNDONE ⚠️

Are you ready to proceed with the transformation and character creation?`;

                    if (window.confirm(confirmMessage)) {
                      console.log('Faction change confirmed');
                      console.log('Current character:', character);
                      console.log('Selected faction change:', selectedFactionChange);
                      
                      // Store the original character and faction change info
                      setOriginalCharacterForFactionChange(character);
                      
                      // Apply faction change transformation with proper benefits
                      const transformedCharacter = handleFactionChangeTransformation(character, selectedFactionChange.id);
                      
                      // Set up the character for creation mode with proper faction-specific settings
                      const newCharacter = {
                        ...transformedCharacter,
                        // Preserve identity and XP
                        name: character.name,
                        player: character.player,
                        totalXP: character.totalXP,
                        xpSpent: 0, // Reset XP spent so they get all free dots back for faction selection
                        checkInCount: character.checkInCount,
                        // Store original faction info
                        originalFaction: character.faction,
                        originalSubfaction: character.subfaction,
                        // Set new faction (already set by handleFactionChangeTransformation)
                        faction: selectedFactionChange.id,
                        subfaction: transformedCharacter.subfaction || selectedFactionChange.targetSubfaction || '',
                        // Reset some faction-specific properties that need reconfiguration in creation
                        clan: '',
                        tribe: '',
                        court: '',
                        tradition: '',
                        fellowship: '',
                        // Keep innateTreeIds from transformation (important for shifter Homid)
                        // fundamentalPowers already set by transformation
                        // Track creation dots separately from existing powers
                        creationDotsUsed: 0, // Track how many free creation dots have been used
                        // Preserve current energy amount (will be capped to new max)
                        preservedEnergy: character.stats.energy,
                        // Mark as faction change
                        isFactionChange: true,
                        factionChangeId: selectedFactionChange.id
                      };
                      
                      console.log('New character for creation:', newCharacter);
                      
                      // Update the character in the array
                      const newCharacters = [...characters];
                      newCharacters[currentCharacterIndex] = newCharacter;
                      setCharacters(newCharacters);
                      
                      console.log('Setting modes...');
                      
                      // Set the newCharacter state for character creation
                      setNewCharacter(newCharacter);
                      
                      // Close modal and enter faction change creation mode
                      setFactionChangeModal(false);
                      setSelectedFactionChange(null);
                      setFactionChangeCreationMode(true);
                      setCurrentMode('creation');
                      
                      console.log('Faction change setup complete');
                    }
                  }}
                  className="px-8 py-3 rounded-lg font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors text-lg shadow-lg"
                >
                  🔄 CONFIRM TRANSFORMATION
                </button>
              </div>
            </div>
          </div>
        </div>
          )}
    </div>
  );
  };

export default ShadowAccordComplete;