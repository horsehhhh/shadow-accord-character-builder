import React, { useState, useEffect, useCallback } from 'react';
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

import { gameData } from './data/gameData';
import { createBlankCharacter, handleFactionChange } from './services/characterService';
import { exportCharacter } from './services/exportService';
import MainMenu from './components/MainMenu';
import CharacterCreation from './components/CharacterCreation';
import CharacterSheet from './components/CharacterSheet';
import CharacterManagement from './components/CharacterManagement';

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
  const formatDisplayText = useCallback((text) => {
    if (!text) return text;
    // Ensure text is a string before calling replace
    return String(text).replace(/_/g, ' ');
  }, []);
  
  
  
  
  
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
  const currentVersion = '0.1.9';
  const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);
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

  const gameData = useGameData();

  const handleCreateCharacter = () => {
    setNewCharacter(createBlankCharacter());
    setCurrentMode('creation');
  };

  const handleSelectCharacter = (index) => {
    setCurrentCharacterIndex(index);
    setCurrentMode('sheet');
  };

  const handleSaveCharacter = (character) => {
    const existingIndex = characters.findIndex(c => c.id === character.id);
    if (existingIndex > -1) {
      const updatedCharacters = [...characters];
      updatedCharacters[existingIndex] = character;
      setCharacters(updatedCharacters);
    } else {
      setCharacters([...characters, character]);
    }
    setCurrentMode('menu');
  };

  const handleCancelCreation = () => {
    setCurrentMode('menu');
    setNewCharacter(null);
  };

  const handleBackToMenu = () => {
    setCurrentMode('menu');
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (importedData.characters) {
            setCharacters(importedData.characters);
            alert('Characters imported successfully!');
          } else {
            alert('Invalid import file format.');
          }
        } catch (error) {
          console.error('Error parsing imported file:', error);
          alert('Error importing characters. Please ensure it's a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportAll = () => {
    if (characters.length > 0) {
      exportCharacter({ name: 'all_characters' }, 'json', currentVersion, characters);
    } else {
      alert('No characters to export.');
    }
  };

  const handleClearAll = () => {
    // Placeholder for clear all functionality
  };

  const handleDeleteCharacter = (characterId) => {
    if (window.confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
      setCharacters(prevCharacters => prevCharacters.filter(char => char.id !== characterId));
      // If the deleted character was the currently selected one, reset index or go to menu
      if (characters[currentCharacterIndex]?.id === characterId) {
        setCurrentCharacterIndex(0); // Or set to -1, or go back to menu
        setCurrentMode('menu');
      }
      alert('Character deleted successfully!');
    }
  };

  const handleManageCharacters = () => {
    setCurrentMode('management');
  };

  if (currentMode === 'menu') {
    return (
      <MainMenu 
        characters={characters}
        onCreateCharacter={handleCreateCharacter}
        onSelectCharacter={handleSelectCharacter}
        onImport={handleImport}
        onExportAll={handleExportAll}
        onClearAll={handleClearAll}
        themeClasses={themeClasses}
        lastSaved={lastSaved}
        autoSave={autoSave}
        onManageCharacters={handleManageCharacters}
      />
    );
  }

  if (currentMode === 'creation') {
    return (
      <CharacterCreation 
        newCharacter={newCharacter}
        setNewCharacter={setNewCharacter}
        creationStep={creationStep}
        setCreationStep={setCreationStep}
        gameData={gameData}
        themeClasses={themeClasses}
      />
    );
  }

  if (currentMode === 'sheet') {
    return (
      <CharacterSheet 
        character={characters[currentCharacterIndex]}
        onBack={handleBackToMenu}
        xpAdjustment={xpAdjustment}
        setXpAdjustment={setXpAdjustment}
        showXpDropdown={showXpDropdown}
        setShowXpDropdown={setShowXpDropdown}
        selectedXpActivities={selectedXpActivities}
        setSelectedXpActivities={setSelectedXpActivities}
        showCheckInDropdown={showCheckInDropdown}
        setShowCheckInDropdown={setShowCheckInDropdown}
        selectedCheckInActivities={selectedCheckInActivities}
        setSelectedCheckInActivities={setSelectedCheckInActivities}
        gameData={gameData}
        setCharacters={setCharacters}
      />
    );
  }

  if (currentMode === 'management') {
    return (
      <CharacterManagement
        characters={characters}
        onSelectCharacter={handleSelectCharacter}
        onBack={handleBackToMenu}
        onDeleteCharacter={handleDeleteCharacter}
      />
    );
  }

  return null;
};

export default ShadowAccordComplete;