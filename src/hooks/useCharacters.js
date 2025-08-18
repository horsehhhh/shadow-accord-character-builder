import { useState, useEffect, useCallback } from 'react';
import { charactersAPI, migrationUtils } from '../services/api';

// Custom hook to manage characters with API integration
export const useCharacters = () => {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network status: Online');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('📱 Network status: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = migrationUtils.isAuthenticated();
      const platform = typeof window !== 'undefined' && window.Capacitor ? 'Android/Capacitor' : 'Web';
      const isOnline = navigator.onLine;
      
      console.log('🔐 Authentication Check:', {
        platform,
        hasToken: !!hasToken,
        isOnline,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'
      });
      
      if (hasToken) {
        // If we're offline, assume authentication is valid and don't test the API
        if (!isOnline) {
          console.log('📱 Offline mode detected, assuming valid authentication');
          setIsAuthenticated(true);
          return;
        }
        
        try {
          // Verify token is valid by making a test API call (only when online)
          console.log('📡 Testing API connection on', platform, '...');
          await charactersAPI.getAll();
          console.log('✅ Authentication successful on', platform);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('❌ Authentication failed on', platform, ':', error);
          
          // Only clear tokens if it's a definitive auth failure (401, 403), not network issues
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('Authentication token invalid, clearing tokens:', error.message);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
          } else {
            // Network or server error - assume token is still valid but we're offline
            console.warn('Network error during auth check, assuming valid authentication:', error.message);
            setIsAuthenticated(true);
          }
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
      console.log('🔄 Load characters triggered, isAuthenticated:', isAuthenticated);
      setLoading(true);
      setError(null);
      
      try {
        if (isAuthenticated && navigator.onLine) {
          // Load from API if authenticated and online
          console.log('📡 Loading characters from API...');
          const apiCharacters = await charactersAPI.getAll();
          console.log('📡 Raw API response:', apiCharacters);
          console.log('📡 API response count:', apiCharacters?.length || 0);
          
          const charactersWithId = apiCharacters.map(char => ({
            ...char,
            id: `api_${char._id}`,
            xpHistory: char.xpHistory || []
          }));
          console.log('📡 Processed characters for state:', charactersWithId.map(c => ({ id: c.id, name: c.name })));
          setCharacters(charactersWithId);
          console.log('✅ Characters loaded from API and set in state');
        } else {
          // Fall back to localStorage if not authenticated or offline
          const reason = !isAuthenticated ? 'not authenticated' : 'offline';
          console.log(`📱 Loading characters from localStorage (${reason})...`);
          const savedData = localStorage.getItem('shadowAccordPhase8');
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.characters) {
              const migratedCharacters = data.characters.map(char => ({
                ...char,
                xpHistory: char.xpHistory || []
              }));
              console.log('📱 Setting characters from localStorage:', migratedCharacters.map(c => ({ id: c.id, name: c.name })));
              setCharacters(migratedCharacters);
            } else {
              console.log('📱 No characters found in localStorage data');
              setCharacters([]);
            }
          } else {
            console.log('📱 No localStorage data found');
            setCharacters([]);
          }
        }
      } catch (err) {
        console.error('Error loading characters:', err);
        setError(err.message);
        
        // Always fall back to localStorage on any error to prevent UI breaks
        console.log('📱 Falling back to localStorage due to error...');
        try {
          const savedData = localStorage.getItem('shadowAccordPhase8');
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.characters) {
              const fallbackCharacters = data.characters.map(char => ({
                ...char,
                xpHistory: char.xpHistory || []
              }));
              setCharacters(fallbackCharacters);
              console.log('✅ Successfully loaded characters from localStorage fallback');
            } else {
              setCharacters([]);
            }
          } else {
            setCharacters([]);
          }
        } catch (fallbackErr) {
          console.error('Even localStorage fallback failed:', fallbackErr);
          setCharacters([]);
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
      
      if (isAuthenticated && navigator.onLine) {
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
          console.error('API Error details:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message
          });
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

  // Update character function with immediate cloud sync
  const updateCharacter = async (characterIndex, updatedCharacter) => {
    try {
      const character = characters[characterIndex];
      if (!character) throw new Error('Character not found');

      console.log('🔄 Updating character:', character.name, 'at index', characterIndex);
      const updatedWithTimestamp = { 
        ...updatedCharacter, 
        id: character.id, 
        lastModified: new Date().toISOString() 
      };

      // If authenticated and this is an API character, sync to cloud immediately
      if (isAuthenticated && character.id && String(character.id).startsWith('api_') && navigator.onLine) {
        try {
          console.log('🔄 Syncing API character update to cloud:', character.name);
          console.log('📤 Character data being sent:', {
            name: updatedWithTimestamp.name,
            hasStats: !!updatedWithTimestamp.stats,
            hasSkills: !!updatedWithTimestamp.skills,
            hasPowers: !!updatedWithTimestamp.powers,
            hasMerits: !!updatedWithTimestamp.merits,
            hasLores: !!updatedWithTimestamp.lores,
            skillsCount: updatedWithTimestamp.skills ? Object.keys(updatedWithTimestamp.skills).length : 0,
            powersCount: updatedWithTimestamp.powers ? Object.keys(updatedWithTimestamp.powers).length : 0,
            meritsCount: updatedWithTimestamp.merits ? Object.keys(updatedWithTimestamp.merits).length : 0,
            loresCount: updatedWithTimestamp.lores ? updatedWithTimestamp.lores.length : 0,
            totalXP: updatedWithTimestamp.totalXP,
            xpSpent: updatedWithTimestamp.xpSpent
          });
          
          const cloudUpdated = await charactersAPI.update(character.id.replace('api_', ''), updatedWithTimestamp);
          
          // Enhanced debugging for character update response
          console.log('🔍 Raw API response:', cloudUpdated);
          console.log('🔍 API response structure:', {
            hasId: !!cloudUpdated.id,
            has_id: !!cloudUpdated._id,
            hasName: !!cloudUpdated.name,
            hasStats: !!cloudUpdated.stats,
            hasSkills: !!cloudUpdated.skills,
            hasPowers: !!cloudUpdated.powers,
            hasMerits: !!cloudUpdated.merits,
            isObject: typeof cloudUpdated === 'object',
            keys: Object.keys(cloudUpdated || {}).slice(0, 10)
          });
          
          // Ensure character has proper ID structure
          const cloudCharacterWithId = { 
            ...cloudUpdated, 
            id: `api_${cloudUpdated._id || cloudUpdated.id}`,
            _id: cloudUpdated._id || cloudUpdated.id
          };
          
          console.log('🔍 Character before state update:', {
            originalId: character.id,
            newId: cloudCharacterWithId.id,
            originalName: character.name,
            newName: cloudCharacterWithId.name,
            hasRequiredFields: !!(cloudCharacterWithId.id && cloudCharacterWithId.name)
          });
          
          // Update local state with cloud response
          setCharacters(prev => {
            const newState = prev.map((c, i) => i === characterIndex ? cloudCharacterWithId : c);
            console.log('🔍 Characters state after update:', {
              totalCharacters: newState.length,
              updatedCharacterIndex: characterIndex,
              updatedCharacter: {
                id: cloudCharacterWithId.id,
                name: cloudCharacterWithId.name,
                hasStats: !!cloudCharacterWithId.stats
              },
              allCharacterIds: newState.map(c => ({ id: c.id, name: c.name }))
            });
            return newState;
          });
          
          console.log('✅ Character successfully synced to cloud');
          console.log('📥 Cloud response data:', {
            name: cloudCharacterWithId.name,
            hasStats: !!cloudCharacterWithId.stats,
            hasSkills: !!cloudCharacterWithId.skills,
            hasPowers: !!cloudCharacterWithId.powers,
            hasMerits: !!cloudCharacterWithId.merits,
            hasLores: !!cloudCharacterWithId.lores,
            skillsCount: cloudCharacterWithId.skills ? Object.keys(cloudCharacterWithId.skills).length : 0,
            powersCount: cloudCharacterWithId.powers ? Object.keys(cloudCharacterWithId.powers).length : 0,
            meritsCount: cloudCharacterWithId.merits ? Object.keys(cloudCharacterWithId.merits).length : 0,
            loresCount: cloudCharacterWithId.lores ? cloudCharacterWithId.lores.length : 0,
            totalXP: cloudCharacterWithId.totalXP,
            xpSpent: cloudCharacterWithId.xpSpent
          });
          return cloudCharacterWithId;
        } catch (apiError) {
          console.error('❌ Cloud sync failed:', apiError.message);
          // Update local state anyway for offline functionality
          setCharacters(prev => prev.map((c, i) => i === characterIndex ? updatedWithTimestamp : c));
          
          // Also update localStorage as backup when cloud sync fails
          const savedData = localStorage.getItem('shadowAccordPhase8');
          const data = savedData ? JSON.parse(savedData) : {};
          const localCharacters = characters.map((c, i) => i === characterIndex ? updatedWithTimestamp : c);
          data.characters = localCharacters.filter(c => !String(c.id).startsWith('api_')); // Only store local characters
          localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
          
          return updatedWithTimestamp;
        }
      } 
      
      // If authenticated but local character, try to create in cloud
      else if (isAuthenticated && character.id && !String(character.id).startsWith('api_')) {
        try {
          console.log('🔄 Creating local character in cloud:', character.name);
          const created = await charactersAPI.create(updatedWithTimestamp);
          const newCloudCharacter = { ...created, id: `api_${created._id}` };
          
          // Replace the local character with the cloud version
          setCharacters(prev => prev.map((c, i) => i === characterIndex ? newCloudCharacter : c));
          console.log('✅ Character successfully created in cloud');
          return newCloudCharacter;
        } catch (apiError) {
          console.warn('⚠️ Failed to create character in cloud:', apiError.message);
          // Update local state anyway
          setCharacters(prev => prev.map((c, i) => i === characterIndex ? updatedWithTimestamp : c));
          return updatedWithTimestamp;
        }
      } 
      
      // Not authenticated - just update locally
      else {
        setCharacters(prev => {
          const updatedCharacters = prev.map((c, i) => i === characterIndex ? updatedWithTimestamp : c);
          
          // Save to localStorage as backup when not authenticated
          const savedData = localStorage.getItem('shadowAccordPhase8');
          const data = savedData ? JSON.parse(savedData) : {};
          data.characters = updatedCharacters;
          localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
          
          return updatedCharacters;
        });
        console.log('📱 Character updated locally only (not authenticated)');
        
        return updatedWithTimestamp;
      }
      
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
        if (character.id && String(character.id).startsWith('api_')) {
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
          let updatedCharacters;
          if (existing) {
            updatedCharacters = prev.map(c => c.id === characterToSave.id ? characterToSave : c);
          } else {
            updatedCharacters = [...prev, characterToSave];
          }
          
          // Update localStorage with current data
          const savedData = localStorage.getItem('shadowAccordPhase8');
          const data = savedData ? JSON.parse(savedData) : {};
          data.characters = updatedCharacters;
          localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
          
          return updatedCharacters;
        });
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
      if (isAuthenticated && String(characterId).startsWith('api_')) {
        // Delete from API
        await charactersAPI.delete(characterId.replace('api_', ''));
      }
      
      // Remove from local state
      setCharacters(prev => {
        const updatedCharacters = prev.filter(c => c.id !== characterId);
        
        // Update localStorage if not authenticated
        if (!isAuthenticated) {
          const savedData = localStorage.getItem('shadowAccordPhase8');
          const data = savedData ? JSON.parse(savedData) : {};
          data.characters = updatedCharacters;
          localStorage.setItem('shadowAccordPhase8', JSON.stringify(data));
        }
        
        return updatedCharacters;
      });
    } catch (err) {
      console.error('Error deleting character:', err);
      setError(err.message);
      throw err;
    }
  };

  // Refresh characters from cloud (for auto-sync)
  const refreshFromCloud = useCallback(async () => {
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
      const localOnlyCharacters = characters.filter(c => c && c.id && !String(c.id).startsWith('api_'));
      const allCharacters = [...charactersWithId, ...localOnlyCharacters];
      
      setCharacters(allCharacters);
      console.log('✅ Successfully refreshed characters from cloud');
      return allCharacters;
    } catch (err) {
      console.error('Error refreshing from cloud:', err);
      throw err;
    }
  }, [isAuthenticated, characters]);

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
      const localStorageCharacters = characters.filter(c => c && c.id && !String(c.id).startsWith('api_'));
      
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

  // Sync all local changes to cloud (simplified approach)
  const syncAllToCloud = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to sync to cloud');
    }

    try {
      console.log('🔄 Full bidirectional sync starting...');
      
      // Step 1: Refresh from cloud to get latest server state
      console.log('📥 Pulling latest data from cloud...');
      await refreshFromCloud();
      
      // Step 2: Since updateCharacter now handles immediate cloud sync,
      // we don't need complex logic here. Just ensure any remaining local-only 
      // characters get created in the cloud.
      const localOnlyCharacters = characters.filter(c => c && c.id && !String(c.id).startsWith('api_'));
      console.log(`Found ${localOnlyCharacters.length} local-only characters to create in cloud`);
      
      let createdCount = 0;
      for (const character of localOnlyCharacters) {
        try {
          console.log(`Creating character in cloud: ${character.name}`);
          const created = await charactersAPI.create(character);
          const newCloudCharacter = { ...created, id: `api_${created._id}` };
          
          // Replace local character with cloud version
          setCharacters(prev => prev.map(c => 
            c.id === character.id ? newCloudCharacter : c
          ));
          createdCount++;
          console.log(`✅ Created ${character.name} in cloud`);
        } catch (createError) {
          console.warn(`❌ Failed to create ${character.name} in cloud:`, createError.message);
        }
      }
      
      console.log(`✅ Sync complete. Created ${createdCount} new characters in cloud`);
      return { created: createdCount, refreshed: true };
      
    } catch (err) {
      console.error('❌ Sync error:', err);
      throw err;
    }
  }, [isAuthenticated, characters, refreshFromCloud]);

  return {
    characters,
    setCharacters,
    loading,
    error,
    isAuthenticated,
    isOnline,
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
