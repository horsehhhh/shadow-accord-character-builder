import React, { useState, useEffect } from 'react';
import { RefreshCw, Cloud, CloudOff, Wifi, WifiOff, Settings as SettingsIcon, Clock, RotateCw } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';

const Settings = ({ 
  darkMode, 
  setDarkMode, 
  accessibility, 
  setAccessibility, 
  autoSave, 
  setAutoSave,
  lastSaved,
  characters
}) => {
  const { isAuthenticated, syncAllToCloud } = useCharacters();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastCloudSync, setLastCloudSync] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5); // seconds
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync system
  useEffect(() => {
    if (!autoSyncEnabled || !isAuthenticated || !isOnline) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setSyncStatus('syncing');
        console.log('🔄 Auto-sync: Checking for cloud updates...');
        
        // Full bidirectional sync with cloud
        await syncAllToCloud();
        
        setLastCloudSync(new Date().toISOString());
        setSyncStatus('success');
        
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-sync failed:', error);
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 5000);
      }
    }, syncInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, isAuthenticated, isOnline, syncInterval, syncAllToCloud]);

  const manualSync = async () => {
    if (!isAuthenticated) {
      alert('Please log in to sync with cloud');
      return;
    }

    try {
      setSyncStatus('syncing');
      console.log('🔄 Manual sync: Full bidirectional sync with cloud...');
      
      await syncAllToCloud();
      
      setLastCloudSync(new Date().toISOString());
      setSyncStatus('success');
      
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('error');
      alert('Sync failed: ' + error.message);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <Cloud className="w-4 h-4 text-green-500" />;
      case 'error':
        return <CloudOff className="w-4 h-4 text-red-500" />;
      default:
        return isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-orange-500" />;
    }
  };

  const getSyncStatusText = () => {
    if (!isOnline) return 'Offline - Sync paused';
    if (!isAuthenticated) return 'Not logged in - Cloud sync disabled';
    
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Sync successful';
      case 'error':
        return 'Sync failed';
      default:
        return `Auto-sync every ${syncInterval}s`;
    }
  };

  const themeClasses = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    button: darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
    text: darkMode ? 'text-gray-300' : 'text-gray-600',
    label: 'block text-sm font-medium mb-1'
  };

  return (
    <div className={`p-6 ${themeClasses.card} border rounded-lg shadow-lg`}>
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="w-5 h-5" />
        <h2 className="text-xl font-bold">Settings</h2>
      </div>

      {/* Cloud Sync Section */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          Cloud Synchronization
        </h3>
        
        <div className="space-y-3">
          {/* Sync Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getSyncStatusIcon()}
              <span className="text-sm">{getSyncStatusText()}</span>
            </div>
            
            <button
              onClick={manualSync}
              disabled={syncStatus === 'syncing' || !isAuthenticated || !isOnline}
              className={`${themeClasses.button} text-white px-3 py-1 rounded text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <RotateCw className="w-3 h-3" />
              Sync Now
            </button>
          </div>

          {/* Last Sync Time */}
          {lastCloudSync && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last sync: {new Date(lastCloudSync).toLocaleString()}
            </div>
          )}

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Auto-sync</span>
              <p className="text-xs text-gray-500">Automatically sync changes to cloud</p>
            </div>
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoSyncEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sync Interval */}
          {autoSyncEnabled && (
            <div>
              <label className={themeClasses.label}>
                Sync interval: {syncInterval} seconds
              </label>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={syncInterval}
                onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10s</span>
                <span>5min</span>
              </div>
            </div>
          )}

          {/* Cloud Status Indicators */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className={`p-2 rounded text-center ${isAuthenticated ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
              {isAuthenticated ? '✓ Logged In' : '✗ Not Logged In'}
            </div>
            <div className={`p-2 rounded text-center ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'}`}>
              {isOnline ? '✓ Online' : '✗ Offline'}
            </div>
            <div className={`p-2 rounded text-center ${characters.some(c => c.id.startsWith('api_')) ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
              {characters.some(c => c.id.startsWith('api_')) ? '✓ Cloud Characters' : '⚠ Local Only'}
            </div>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">General Settings</h3>
        
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              darkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Auto-save */}
        <div className="flex items-center justify-between">
          <div>
            <span>Auto-save Settings</span>
            <p className="text-xs text-gray-500">Automatically save UI preferences</p>
          </div>
          <button
            onClick={() => setAutoSave(!autoSave)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              autoSave ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoSave ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Accessibility */}
        <div>
          <h4 className="text-md font-medium mb-2">Accessibility</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={accessibility.highContrast}
                onChange={(e) => setAccessibility({
                  ...accessibility,
                  highContrast: e.target.checked
                })}
                className="mr-2"
              />
              High Contrast
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={accessibility.largeText}
                onChange={(e) => setAccessibility({
                  ...accessibility,
                  largeText: e.target.checked
                })}
                className="mr-2"
              />
              Large Text
            </label>
          </div>
        </div>

        {/* Last Saved */}
        {lastSaved && (
          <div className="text-xs text-gray-500">
            Settings last saved: {new Date(lastSaved).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
