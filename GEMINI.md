  Summary So Far:
  The main goal is to break down the large app backup.js file into smaller, more manageable modules.       
   * File Utilities: loadPdfFile and downloadFile are now in packages/core/src/utils/fileUtils.js.
   * Game Data: gameData, currentVersion, and changelog are in packages/core/src/data/gameData.js.
   * Character Service: Most character-related logic (creation, advancement, XP, etc.) is in
     packages/core/src/services/characterService.js.
   * Export Service: Character export functions are in packages/core/src/services/exportService.js.        
   * Component Updates:
       * App.js has been updated to import and use these new modules, and now manages the overall
         application flow and state.
       * MainMenu.js has been refactored to handle navigation.
       * CharacterManagement.js has been created for character listing and deletion.
       * XP-related state and the handleClickOutside effect have been successfully moved from app backup.js
         to packages/core/src/components/CharacterSheet.js, and App.js now passes these as props.
   * `app backup.js` Cleanup: Several state variables and effects have been removed from app backup.js.    

  Current Challenge:
  The gameData = useGameData(); line in app backup.js is still present because its removal is intertwined
  with the rendering logic that still resides in app backup.js.

  Next Steps:
  My immediate focus is to continue extracting the rendering logic from app backup.js into their
  respective components.

   1. Move `renderCharacterCreation`: Extract the JSX and associated logic from the renderCharacterCreation
      function in app backup.js and integrate it directly into
      packages/core/src/components/CharacterCreation.js. This will involve passing necessary data and      
      functions as props to CharacterCreation.js.
   2. Move `renderCharacterSheet`: Similarly, move the JSX and logic from renderCharacterSheet in app      
      backup.js to packages/core/src/components/CharacterSheet.js.
   3. Move `renderMainMenu`: Move the JSX and logic from renderMainMenu in app backup.js to
      packages/core/src/components/MainMenu.js.
   4. Final `app backup.js` Cleanup: Once all rendering logic is moved, I will remove any remaining        
      redundant code and imports from app backup.js.
   5. Delete `app backup.js`: After successful migration, app backup.js will be deleted.

  I will now proceed with moving the renderCharacterCreation content.
