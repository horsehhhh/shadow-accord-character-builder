import React from 'react';
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

const MainMenu = ({ characters, onCreateCharacter, onSelectCharacter, onImport, onExportAll, onClearAll, themeClasses, lastSaved, autoSave, onManageCharacters }) => {
  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          <button
            onClick={onCreateCharacter}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Plus className="w-8 h-8 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Create Character</h3>
            <p className="text-sm text-gray-400">Start a new Shadow Accord character</p>
          </button>

          <button
            onClick={onManageCharacters}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
            disabled={characters.length === 0}
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Manage Characters</h3>
            <p className="text-sm text-gray-400">View and edit characters</p>
          </button>

          <button
            onClick={() => { /* Placeholder for settings */ }}
            className={`${themeClasses.card} p-5 hover:shadow-lg transition-all group cursor-pointer`}
          >
            <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-bold mb-1">Settings</h3>
            <p className="text-sm text-gray-400">Customize interface options</p>
          </button>

          <button
            onClick={() => { /* Placeholder for changelog */ }}
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
              onClick={() => document.getElementById('import-file-input').click()}
              className={themeClasses.card + ' p-3 text-center hover:shadow-lg transition-all'}
            >
              <Upload className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="text-lg font-bold">Import</div>
              <div className="text-sm text-gray-400">Load character</div>
              <input
                type="file"
                id="import-file-input"
                accept=".json"
                style={{ display: 'none' }}
                onChange={onImport}
              />
            </button>

            <button
              onClick={onExportAll}
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
};

export default MainMenu;