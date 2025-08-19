import React, { useState, useEffect } from 'react';
import { RefreshCw, Cloud, CloudOff, Wifi, WifiOff, Settings as SettingsIcon, Clock, RotateCw, FileText, Database, FileSpreadsheet } from 'lucide-react';
import { useCharacters } from '../hooks/useCharacters';
import { testConnectivity } from '../services/api';

const Settings = ({ 
  darkMode, 
  setDarkMode, 
  accessibility, 
  setAccessibility, 
  autoSave, 
  setAutoSave,
  lastSaved,
  characters,
  exportCharacter,
  currentVersion,
  createTestCharacter
}) => {
  const { isAuthenticated, syncAllToCloud } = useCharacters();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastCloudSync, setLastCloudSync] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(5); // seconds
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Mobile-optimized handler for export buttons
  const createMobileHandler = (handler) => {
    return async (event) => {
      if (!event || !event.currentTarget) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const button = event.currentTarget;
      const originalStyle = {
        opacity: button.style.opacity || '',
        backgroundColor: button.style.backgroundColor || ''
      };
      
      try {
        button.style.opacity = '0.7';
        button.disabled = true;
        
        await new Promise(resolve => setTimeout(resolve, 50));
        await handler();
        
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.style.backgroundColor = originalStyle.backgroundColor;
          button.style.opacity = originalStyle.opacity;
          button.disabled = false;
        }, 500);
        
      } catch (error) {
        console.error('Export error:', error);
        button.style.backgroundColor = '#ef4444';
        setTimeout(() => {
          button.style.backgroundColor = originalStyle.backgroundColor;
          button.style.opacity = originalStyle.opacity;
          button.disabled = false;
        }, 1000);
      }
    };
  };

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
            <div className={`p-2 rounded text-center ${characters.some(c => c.id && String(c.id).startsWith('api_')) ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
              {characters.some(c => c.id && String(c.id).startsWith('api_')) ? '✓ Cloud Characters' : '⚠ Local Only'}
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

      {/* Debug Section */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <SettingsIcon className="w-4 h-4" />
          Debug Tools
        </h3>
        
        <div className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Development and testing utilities:
          </div>
          
          {/* Test Character Creation */}
          <button
            onClick={createMobileHandler(() => {
              if (createTestCharacter) {
                createTestCharacter();
              } else {
                alert('Test character creation function not available');
              }
            })}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2 justify-center min-h-[44px] touch-manipulation"
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          >
            <Database className="w-4 h-4" />
            Create Test Character
          </button>

          {/* Connectivity Test */}
          <button
            onClick={createMobileHandler(async () => {
              console.log('🧪 Starting enhanced connectivity test...');
              
              // Enhanced connectivity test with basic network checks for Android
              if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.getPlatform() === 'android') {
                console.log('🔍 Starting Android network diagnostics...');
                
                // Test 1: Basic network availability
                try {
                  console.log('📡 Testing basic network availability...');
                  await fetch('https://www.google.com', { 
                    method: 'HEAD', 
                    mode: 'no-cors',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(5000)
                  });
                  console.log('✅ Basic network test passed');
                } catch (basicError) {
                  console.error('❌ Basic network test failed:', basicError);
                  alert(`❌ Basic Network Test Failed!\n\nCannot reach internet.\nError: ${basicError.message}\n\nCheck WiFi/mobile data connection.`);
                  return;
                }
                
                // Test 2: HTTPS connectivity
                try {
                  console.log('🔒 Testing HTTPS connectivity...');
                  const httpsTest = await fetch('https://httpbin.org/get', {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(10000)
                  });
                  console.log('✅ HTTPS test passed:', httpsTest.status);
                } catch (httpsError) {
                  console.error('❌ HTTPS test failed:', httpsError);
                  alert(`❌ HTTPS Test Failed!\n\nCannot make secure connections.\nError: ${httpsError.message}\n\nThis might be a certificate or proxy issue.`);
                  return;
                }
              }
              
              // Main API connectivity test
              const result = await testConnectivity();
              if (result.success) {
                alert(`✅ Connectivity Test Passed!\n\nAPI Response: ${JSON.stringify(result.data, null, 2)}`);
              } else {
                alert(`❌ Connectivity Test Failed!\n\nError: ${result.error}\nPlatform: ${result.details?.platform || 'Unknown'}\nNetwork Error: ${result.details?.networkError ? 'Yes' : 'No'}\nStatus: ${result.details?.status || 'N/A'}\nTimeout: ${result.details?.isTimeout ? 'Yes' : 'No'}\nCORS: ${result.details?.isCORSError ? 'Yes' : 'No'}`);
              }
            })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2 justify-center min-h-[44px] touch-manipulation"
            style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
          >
            <Wifi className="w-4 h-4" />
            Test API Connectivity
          </button>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Creates a basic vampire character for testing PDF export and other features</div>
            <div>• Useful for debugging without going through full character creation</div>
            <div>• Test API connectivity helps diagnose cloud sync issues on different platforms</div>
          </div>
        </div>
      </div>

      {/* Debug Information Section */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Debug Information
        </h3>
        
        <div className="space-y-2 text-sm">
          <div><strong>Authentication:</strong> {isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}</div>
          <div><strong>Online Status:</strong> {isOnline ? '✅ Online' : '❌ Offline'}</div>
          <div><strong>Auth Token:</strong> {localStorage.getItem('auth_token') ? '✅ Present' : '❌ Missing'}</div>
          <div><strong>Platform:</strong> {
            typeof window !== 'undefined' && window.Capacitor && window.Capacitor.getPlatform() === 'android' ? 'Android' :
            typeof window !== 'undefined' && window.electronAPI ? 'Electron' : 'Web'
          }</div>
          <div><strong>App Version:</strong> {currentVersion}</div>
          <div><strong>Total Characters:</strong> {characters?.length || 0}</div>
          <div><strong>Cloud Characters:</strong> {characters?.filter(c => c.id && String(c.id).startsWith('api_')).length || 0}</div>
          <div><strong>Local Characters:</strong> {characters?.filter(c => c.id && !String(c.id).startsWith('api_')).length || 0}</div>
          
          {/* Test Character Creation */}
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
            <button
              onClick={async () => {
                try {
                  alert(`Debug: Starting character creation test...\nAuth: ${isAuthenticated}\nOnline: ${isOnline}\nToken: ${!!localStorage.getItem('auth_token')}`);
                  await createTestCharacter();
                  alert('✅ Test character created successfully!');
                } catch (error) {
                  alert(`❌ Test character creation failed: ${error.message}`);
                }
              }}
              className={`${themeClasses.button} text-white px-4 py-2 rounded text-sm`}
            >
              🧪 Test Character Creation
            </button>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      {characters && characters.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Management
          </h3>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Export your character data in various formats:
            </div>
            
            {/* Export Format Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* JSON Export */}
              <button
                onClick={createMobileHandler(() => {
                  try {
                    const exportData = {
                      characters: characters || [],
                      exported: new Date().toISOString(),
                      version: currentVersion || '1.0.0'
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                      { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'shadow_accord_backup.json';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    
                    setTimeout(() => {
                      a.click();
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 100);
                    }, 10);
                  } catch (error) {
                    console.error('JSON export failed:', error);
                    alert('Export failed: ' + error.message);
                  }
                })}
                className={`${themeClasses.button} text-white px-3 py-2 rounded text-sm flex items-center gap-2 justify-center min-h-[44px] touch-manipulation`}
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
              >
                <FileText className="w-4 h-4" />
                Export JSON
              </button>

              {/* CSV Export */}
              <button
                onClick={createMobileHandler(() => {
                  try {
                    const csvHeaders = ['Name', 'Player', 'Faction', 'Subfaction', 'Available XP', 'XP Spent', 'Campaign', 'Created'];
                    const csvRows = (characters || []).map(char => [
                      char.name || '',
                      char.player || '',
                      char.faction || '',
                      char.subfaction || '',
                      char.totalXP || 0,
                      char.xpSpent || 0,
                      char.campaign || '',
                      char.created ? new Date(char.created).toLocaleDateString() : ''
                    ]);
                    
                    const csvContent = [csvHeaders, ...csvRows]
                      .map(row => row.map(field => `"${field}"`).join(','))
                      .join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'shadow_accord_characters.csv';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    
                    setTimeout(() => {
                      a.click();
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 100);
                    }, 10);
                  } catch (error) {
                    console.error('CSV export failed:', error);
                    alert('Export failed: ' + error.message);
                  }
                })}
                className={`${themeClasses.button} text-white px-3 py-2 rounded text-sm flex items-center gap-2 justify-center min-h-[44px] touch-manipulation`}
                style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>

              {/* Individual Character Export */}
              <div className="relative">
                <select
                  onChange={(e) => {
                    try {
                      if (e.target.value && exportCharacter && characters) {
                        const character = characters.find(c => c && c.id && String(c.id) === e.target.value);
                        if (character) {
                          exportCharacter(character, 'json');
                        }
                      }
                      e.target.value = ''; // Reset selection
                    } catch (error) {
                      console.error('Individual export failed:', error);
                      alert('Export failed: ' + error.message);
                    }
                  }}
                  className={`${themeClasses.input} w-full px-3 py-2 rounded text-sm`}
                  defaultValue=""
                >
                  <option value="" disabled>Export Single Character</option>
                  {(characters || []).map(char => (
                    <option key={char.id || Math.random()} value={char.id || ''}>
                      {char.name || 'Unnamed Character'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Info */}
            <div className="text-xs text-gray-500 space-y-1">
              <div>• <strong>JSON</strong>: Complete backup of all characters with full data</div>
              <div>• <strong>CSV</strong>: Character summary for spreadsheet applications</div>
              <div>• <strong>Single Character</strong>: Export individual character as JSON</div>
            </div>

            {/* Character Count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {(characters || []).length} character{(characters || []).length !== 1 ? 's' : ''} available for export
            </div>
          </div>
        </div>
      )}

      {/* Debug: Show export section even with no characters */}
      {(!characters || characters.length === 0) && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Data Management (Debug)
          </h3>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No characters found. Characters data: {JSON.stringify({ characters, length: characters?.length })}
            </div>
            
            <div className="text-sm text-red-600 dark:text-red-400">
              This debug section shows because no characters were detected. Create a character first to see export options.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
