import { useState, useEffect } from 'react';
import { charactersAPI, migrationUtils } from '../services/api';

// Custom hook to manage characters with API integration
export const useCharacters = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = migrationUtils.isAuthenticated();
      const platform = typeof window !== 'undefined' && window.Capacitor ? 'Android/Capacitor' : 'Web';
      
      console.log('🔐 Authentication Check:', {
        platform,
        hasToken: !!hasToken,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'
      });
      
      if (hasToken) {
        try {
          // Verify token is valid by making a test API call
          console.log('📡 Testing API connection on', platform, '...');
          await charactersAPI.getAll();
          console.log('✅ Authentication successful on', platform);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('❌ Authentication failed on', platform, ':', error);
          console.warn('Authentication token invalid, switching to offline mode:', error.message);
          setIsAuthenticated(false);
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('📱 No auth token found on', platform, ', using offline mode');
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Load characters based on authentication status
  useEffect(() => {
    const loadCharacters = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (isAuthenticated) {
          // Load from API if authenticated
          console.log('Loading characters from API...');
          const apiCharacters = await charactersAPI.getAll();
          console.log('Raw API response:', apiCharacters);
          const charactersWithId = apiCharacters.map(char => ({
            ...char,
            id: `api_${char._id}`,
            xpHistory: char.xpHistory || []
          }));
          console.log('Processed characters:', charactersWithId);
          setCharacters(charactersWithId);
        } else {
          // Fall back to localStorage if not authenticated
          console.log('Loading characters from localStorage...');
          const savedData = localStorage.getItem('shadowAccordPhase8');
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.characters) {
              const migratedCharacters = data.characters.map(char => ({
                ...char,
                xpHistory: char.xpHistory || []
              }));
              setCharacters(migratedCharacters);
            }
          }
        }
      } catch (err) {
        console.error('Error loading characters:', err);
        setError(err.message);
        
        // Fall back to localStorage on API error
        const savedData = localStorage.getItem('shadowAccordPhase8');
        if (savedData) {
          const data = JSON.parse(savedData);
          if (data.characters) {
            setCharacters(data.characters);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, [isAuthenticated]);

  // Create character function
  const createCharacter = async (character) => {
    try {
      console.log('Creating character, isAuthenticated:', isAuthenticated);
      console.log('Character data being sent:', character);
      
      if (isAuthenticated) {
        try {
          // Attempt to create new API character
          console.log('Attempting cloud save...');
          const created = await charactersAPI.create(character);
          console.log('Cloud save successful:', created);
          const newCharacter = { ...created, id: `api_${created._id}` };
          setCharacters(prev => [...prev, newCharacter]);
          return newCharacter;
        } catch (apiError) {
          console.error('API character creation failed, falling back to localStorage:', apiError);
          console.error('Error details:', apiError.response?.data || apiError.message);
          // If API fails (token invalid, server down, etc.), fall back to localStorage
          setIsAuthenticated(false); // Update auth status
          // Fall through to localStorage creation
        }
      }
      
      // Save to localStorage (either not authenticated or API failed)
      const characterToSave = { ...character, id: character.id || Date.now().toString() };
      setCharacters(prev => [...prev, characterToSave]);
      
      // Update localStorage
      const savedData = localStorage.getItem('shadowAccordPhase8');
      const data = savedData ? JSON.parse(savedData) : {};
      data.characters = [...(data.characters || []), characterToSave];
      localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
      return characterToSave;
    } catch (err) {
      console.error('Error creating character:', err);
      setError(err.message);
      throw err;
    }
  };

  // Update character function with automatic cloud sync
  const updateCharacter = async (characterIndex, updatedCharacter) => {
    try {
      const character = characters[characterIndex];
      if (!character) throw new Error('Character not found');

      // Always update local state first for immediate UI response
      const updatedWithId = { ...updatedCharacter, id: character.id, lastModified: new Date().toISOString() };
      setCharacters(prev => prev.map((c, i) => i === characterIndex ? updatedWithId : c));

      // Sync to cloud if authenticated
      if (isAuthenticated && character.id.startsWith('api_')) {
        try {
          console.log('🔄 Auto-syncing character update to cloud:', character.name);
          const updated = await charactersAPI.update(character.id.replace('api_', ''), updatedCharacter);
          const cloudUpdatedWithId = { ...updated, id: `api_${updated._id}` };
          setCharacters(prev => prev.map((c, i) => i === characterIndex ? cloudUpdatedWithId : c));
          console.log('✅ Character successfully synced to cloud');
          return cloudUpdatedWithId;
        } catch (apiError) {
          console.warn('⚠️ Cloud sync failed, keeping local changes:', apiError.message);
          // Don't set authentication to false here - might be temporary network issue
          // Fall through to localStorage backup
        }
      } else if (isAuthenticated && !character.id.startsWith('api_')) {
        // Try to create this character in the cloud for the first time
        try {
          console.log('🔄 Creating character in cloud for first time:', character.name);
          const created = await charactersAPI.create(updatedCharacter);
          const newCloudCharacter = { ...created, id: `api_${created._id}` };
          setCharacters(prev => prev.map((c, i) => i === characterIndex ? newCloudCharacter : c));
          console.log('✅ Character successfully created in cloud');
          return newCloudCharacter;
        } catch (apiError) {
          console.warn('⚠️ Failed to create character in cloud:', apiError.message);
          // Fall through to localStorage backup
        }
      }
      
      // Update localStorage as backup (either not authenticated, not API character, or API failed)
      const savedData = localStorage.getItem('shadowAccordPhase8');
      const data = savedData ? JSON.parse(savedData) : {};
      data.characters = characters.map((c, i) => i === characterIndex ? updatedWithId : c);
      localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
      
      return updatedWithId;
    } catch (err) {
      console.error('Error updating character:', err);
      setError(err.message);
      throw err;
    }
  };

  // Save character function (legacy - kept for compatibility)
  const saveCharacter = async (character) => {
    try {
      if (isAuthenticated) {
        // Save to API
        if (character.id && character.id.startsWith('api_')) {
          // Update existing API character
          const updated = await charactersAPI.update(character.id.replace('api_', ''), character);
          setCharacters(prev => prev.map(c => c.id === character.id ? { ...updated, id: `api_${updated._id}` } : c));
        } else {
          // Create new API character
          const created = await charactersAPI.create(character);
          const newCharacter = { ...created, id: `api_${created._id}` };
          setCharacters(prev => [...prev, newCharacter]);
        }
      } else {
        // Save to localStorage
        const characterToSave = { ...character, id: character.id || Date.now().toString() };
        setCharacters(prev => {
          const existing = prev.find(c => c.id === characterToSave.id);
          if (existing) {
            return prev.map(c => c.id === characterToSave.id ? characterToSave : c);
          } else {
            return [...prev, characterToSave];
          }
        });
        
        // Update localStorage
        const savedData = localStorage.getItem('shadowAccordPhase8');
        const data = savedData ? JSON.parse(savedData) : {};
        data.characters = characters;
        localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error saving character:', err);
      setError(err.message);
      throw err;
    }
  };

  // Delete character function
  const deleteCharacter = async (characterId) => {
    try {
      if (isAuthenticated && characterId.startsWith('api_')) {
        // Delete from API
        await charactersAPI.delete(characterId.replace('api_', ''));
      }
      
      // Remove from local state
      setCharacters(prev => prev.filter(c => c.id !== characterId));
      
      // Update localStorage if not authenticated
      if (!isAuthenticated) {
        const savedData = localStorage.getItem('shadowAccordPhase8');
        const data = savedData ? JSON.parse(savedData) : {};
        data.characters = characters.filter(c => c.id !== characterId);
        localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error deleting character:', err);
      setError(err.message);
      throw err;
    }
  };

  // Refresh characters from cloud (for auto-sync)
  const refreshFromCloud = async () => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to refresh from cloud');
    }

    try {
      console.log('🔄 Refreshing characters from cloud...');
      const apiCharacters = await charactersAPI.getAll();
      const charactersWithId = apiCharacters.map(char => ({
        ...char,
        id: `api_${char._id}`,
        xpHistory: char.xpHistory || []
      }));
      
      // Merge with local-only characters
      const localOnlyCharacters = characters.filter(c => !c.id.startsWith('api_'));
      const allCharacters = [...charactersWithId, ...localOnlyCharacters];
      
      setCharacters(allCharacters);
      console.log('✅ Successfully refreshed characters from cloud');
      return allCharacters;
    } catch (err) {
      console.error('Error refreshing from cloud:', err);
      throw err;
    }
  };

  // Migration function
  const migrateToAPI = async () => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to migrate characters');
    }

    try {
      setLoading(true);
      
      // First, refresh from cloud to get latest data
      await refreshFromCloud();
      
      // Then migrate any local-only characters
      const localStorageCharacters = characters.filter(c => !c.id.startsWith('api_'));
      
      for (const character of localStorageCharacters) {
        try {
          const created = await charactersAPI.create(character);
          // Update the character in state with new API ID
          setCharacters(prev => prev.map(c => 
            c.id === character.id 
              ? { ...created, id: `api_${created._id}` }
              : c
          ));
        } catch (createError) {
          console.warn('Failed to migrate character to cloud:', character.name, createError);
        }
      }
      
      console.log(`✅ Migration complete. Processed ${localStorageCharacters.length} local characters`);
    } catch (err) {
      console.error('Migration error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sync all local changes to cloud (for manual sync)
  const syncAllToCloud = async () => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to sync to cloud');
    }

    try {
      console.log('🔄 Syncing all local changes to cloud...');
      
      // Get current local-only characters before refreshing
      const localOnlyCharacters = characters.filter(c => !c.id.startsWith('api_'));
      
      // First refresh from cloud to get latest data
      const refreshedCharacters = await refreshFromCloud();
      
      // Then push any local-only characters
      let syncCount = 0;
      
      for (const character of localOnlyCharacters) {
        try {
          const created = await charactersAPI.create(character);
          setCharacters(prev => prev.map(c => 
            c.id === character.id 
              ? { ...created, id: `api_${created._id}` }
              : c
          ));
          syncCount++;
        } catch (createError) {
          console.warn('Failed to sync character to cloud:', character.name, createError);
        }
      }
      
      console.log(`✅ Sync complete. Pushed ${syncCount} characters to cloud, refreshed from cloud`);
      return { pushed: syncCount, refreshed: true };
    } catch (err) {
      console.error('Sync error:', err);
      throw err;
    }
  };

  return {
    characters,
    setCharacters,
    loading,
    error,
    isAuthenticated,
    currentUser: isAuthenticated ? { username: 'User' } : null, // TODO: Get real user info
    createCharacter,
    updateCharacter,
    saveCharacter, // Legacy function
    deleteCharacter,
    migrateToAPI,
    refreshFromCloud,
    syncAllToCloud,
    setIsAuthenticated
  };
};

export default useCharacters;
