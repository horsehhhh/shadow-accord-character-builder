export const changelog = [
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