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
      if (hasToken) {
        try {
          // Verify token is valid by making a test API call
          await charactersAPI.getAll();
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Authentication token invalid, switching to offline mode:', error.message);
          setIsAuthenticated(false);
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      } else {
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
          setCharacters(apiCharacters);
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
      if (isAuthenticated) {
        try {
          // Attempt to create new API character
          const created = await charactersAPI.create(character);
          const newCharacter = { ...created, id: `api_${created._id}` };
          setCharacters(prev => [...prev, newCharacter]);
          return newCharacter;
        } catch (apiError) {
          console.warn('API character creation failed, falling back to localStorage:', apiError.message);
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

  // Update character function
  const updateCharacter = async (characterIndex, updatedCharacter) => {
    try {
      const character = characters[characterIndex];
      if (!character) throw new Error('Character not found');

      if (isAuthenticated && character.id.startsWith('api_')) {
        try {
          // Attempt to update existing API character
          const updated = await charactersAPI.update(character.id.replace('api_', ''), updatedCharacter);
          const updatedWithId = { ...updated, id: `api_${updated._id}` };
          setCharacters(prev => prev.map((c, i) => i === characterIndex ? updatedWithId : c));
          return updatedWithId;
        } catch (apiError) {
          console.warn('API character update failed, falling back to localStorage:', apiError.message);
          setIsAuthenticated(false); // Update auth status
          // Fall through to localStorage update
        }
      }
      
      // Update localStorage character (either not authenticated, not API character, or API failed)
      const updatedWithId = { ...updatedCharacter, id: character.id };
      setCharacters(prev => prev.map((c, i) => i === characterIndex ? updatedWithId : c));
      
      // Update localStorage
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

  // Migration function
  const migrateToAPI = async () => {
    if (!isAuthenticated) {
      throw new Error('Must be authenticated to migrate characters');
    }

    try {
      setLoading(true);
      const localStorageCharacters = characters.filter(c => !c.id.startsWith('api_'));
      
      for (const character of localStorageCharacters) {
        const created = await charactersAPI.create(character);
        // Update the character in state with new API ID
        setCharacters(prev => prev.map(c => 
          c.id === character.id 
            ? { ...created, id: `api_${created._id}` }
            : c
        ));
      }
      
      console.log(`Migrated ${localStorageCharacters.length} characters to API`);
    } catch (err) {
      console.error('Migration error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
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
    setIsAuthenticated
  };
};

export default useCharacters;
