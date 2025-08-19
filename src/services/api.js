import axios from 'axios';
import { APP_VERSION, MIN_CLOUD_VERSION, isVersionSupported } from '../version';

// API Configuration
// Auto-detect environment and platform
const isProduction = process.env.NODE_ENV === 'production';
const isCapacitor = typeof window !== 'undefined' && window.Capacitor;
const isAndroid = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.getPlatform() === 'android';
const isElectron = typeof window !== 'undefined' && window.electronAPI;

console.log('🔍 API Environment Detection:', {
  isProduction,
  isCapacitor,
  isAndroid,
  isElectron,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  platform: typeof window !== 'undefined' && window.Capacitor ? window.Capacitor.getPlatform() : 'Web',
  localStorageAvailable: typeof localStorage !== 'undefined',
  windowCapacitor: typeof window !== 'undefined' && !!window.Capacitor,
  capacitorInfo: typeof window !== 'undefined' && window.Capacitor ? window.Capacitor.getPlatform() : null
});

// For Android and Electron, always use the production API URL to avoid localhost issues
// Confirmed via Railway CLI: backend is at shadowaccordapi.up.railway.app
const PRIMARY_API_BASE = 'https://shadowaccordapi.up.railway.app/api';
const FALLBACK_API_BASES = [
  'https://shadowaccordapi.up.railway.app/api', // Primary - confirmed backend URL
  'https://shadowaccordapi.up.railway.app/api', // Same URL for consistency
];

const API_BASE = process.env.REACT_APP_API_URL || 
  (isProduction || isCapacitor || isAndroid || isElectron ? PRIMARY_API_BASE : 'http://localhost:5000/api');

console.log('🌐 API Base URL:', API_BASE);
console.log('🔧 Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: isCapacitor ? 30000 : 10000, // Longer timeout for mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use((config) => {
  // Check version compatibility for cloud API requests
  if (!isVersionSupported(APP_VERSION, MIN_CLOUD_VERSION)) {
    const error = new Error(`This version (${APP_VERSION}) is too old for cloud connectivity. Please update to version ${MIN_CLOUD_VERSION} or later.`);
    error.isVersionError = true;
    throw error;
  }
  
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API request with token:', config.url, token.substring(0, 20) + '...');
  } else {
    console.log('API request without token:', config.url);
  }
  
  // Add version header for server-side validation
  config.headers['X-App-Version'] = APP_VERSION;
  
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API response success:', {
      url: response.config.url,
      status: response.status,
      platform: isAndroid ? 'Android' : isElectron ? 'Electron' : 'Web',
      dataSize: response.data ? JSON.stringify(response.data).length : 0
    });
    return response;
  },
  (error) => {
    console.error('❌ API error details:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      platform: isAndroid ? 'Android' : isElectron ? 'Electron' : 'Web',
      message: error.message,
      networkError: !error.response,
      timeout: error.code === 'ECONNABORTED'
    });
    
    // Handle version incompatibility errors from server
    if (error.response?.status === 426) { // 426 Upgrade Required
      const message = error.response?.data?.message || 'Your app version is too old. Please update to continue using cloud features.';
      const upgradeError = new Error(message);
      upgradeError.isVersionError = true;
      return Promise.reject(upgradeError);
    }
    
    // Handle client-side version errors
    if (error.isVersionError) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing tokens');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Test multiple API endpoints to find working one (for Android issues)
export const findWorkingApiBase = async () => {
  if (!isAndroid) {
    return API_BASE; // Only needed for Android
  }
  
  console.log('🔍 Testing multiple API endpoints for Android...');
  
  for (const baseUrl of FALLBACK_API_BASES) {
    try {
      console.log(`📱 Testing: ${baseUrl}`);
      const response = await fetch(`${baseUrl}/auth/status`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        console.log(`✅ Working API endpoint found: ${baseUrl}`);
        return baseUrl;
      } else {
        console.log(`❌ Endpoint failed with status ${response.status}: ${baseUrl}`);
      }
    } catch (error) {
      console.log(`❌ Endpoint failed with error: ${baseUrl} - ${error.message}`);
    }
  }
  
  console.log('❌ No working API endpoints found, using default');
  return API_BASE;
};

// Connectivity test function for debugging
export const testConnectivity = async () => {
  try {
    console.log('🔍 Testing connectivity to:', API_BASE);
    console.log('🔍 Platform info:', {
      isAndroid,
      isCapacitor,
      isElectron,
      platform: typeof window !== 'undefined' && window.Capacitor ? window.Capacitor.getPlatform() : 'Web',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A'
    });
    
    // For Android, try to find a working API endpoint first
    let workingApiBase = API_BASE;
    if (isAndroid) {
      workingApiBase = await findWorkingApiBase();
      if (workingApiBase !== API_BASE) {
        console.log(`� Using alternative API endpoint: ${workingApiBase}`);
      }
    }
    
    // For Android, try multiple connectivity tests with working endpoint
    if (isAndroid) {
      console.log('📱 Android detected - running comprehensive connectivity tests...');
      
      // Test with the working endpoint
      console.log('📱 Testing with discovered working endpoint...');
      try {
        const workingResponse = await fetch(`${workingApiBase}/auth/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ShadowAccord-Android-App'
          },
          mode: 'cors',
          cache: 'no-cache',
          timeout: 15000
        });
        
        if (workingResponse.ok) {
          const data = await workingResponse.json();
          console.log('✅ Working endpoint success:', data);
          return { success: true, data, method: 'working-endpoint', endpoint: workingApiBase };
        }
      } catch (workingError) {
        console.error('📱 Working endpoint failed:', workingError);
      }
    }
    
    // Use axios as fallback or primary method
    console.log('🔍 Testing with axios...');
    const response = await api.get('/auth/status');
    console.log('✅ Connectivity test passed:', response.data);
    return { success: true, data: response.data, method: 'axios' };
  } catch (error) {
    console.error('❌ Connectivity test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      platform: isAndroid ? 'Android' : isElectron ? 'Electron' : 'Web',
      networkError: !error.response,
      errorType: error.constructor.name,
      stack: error.stack,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        timeout: error.config.timeout
      } : 'No config'
    });
    return { 
      success: false, 
      error: error.message,
      details: {
        status: error.response?.status,
        platform: isAndroid ? 'Android' : isElectron ? 'Electron' : 'Web',
        networkError: !error.response,
        errorType: error.constructor.name,
        isTimeout: error.message.includes('timeout'),
        isNetworkError: error.message.includes('Network Error'),
        isCORSError: error.message.includes('CORS')
      }
    };
  }
};

// Authentication API
export const authAPI = {
  register: async (username, email, password) => {
    const response = await api.post('/auth/register', { username, email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    console.log('🔐 Attempting login with email:', email);
    const response = await api.post('/auth/login', { login: email, password });
    console.log('✅ Login response:', response.data);
    
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      console.log('💾 Stored auth_token:', response.data.token.substring(0, 20) + '...');
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('👤 Stored user:', response.data.user);
      } else {
        console.warn('⚠️ No user object in login response');
      }
    } else {
      console.warn('⚠️ No token in login response');
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getProfile: () => api.get('/auth/me'),

  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Characters API - Replace localStorage functionality
export const charactersAPI = {
  // Get all user's characters
  getAll: async () => {
    const response = await api.get('/characters');
    return response.data.characters;
  },

  // Get specific character by ID
  getById: async (id) => {
    const response = await api.get(`/characters/${id}`);
    return response.data.character;
  },

  // Create new character
  create: async (characterData) => {
    const dataToSend = {
      ...characterData,
      name: characterData.name || 'New Character',
      player: characterData.player || 'Unknown Player',
      faction: characterData.faction || 'human',
      subfaction: characterData.subfaction || 'commoner'
    };
    
    console.log('📤 API create - sending character data:', {
      name: dataToSend.name,
      faction: dataToSend.faction,
      selfNerfsCount: dataToSend.selfNerfs?.length || 0,
      selfNerfsPreview: dataToSend.selfNerfs?.slice(0, 2) || [],
      dataSize: JSON.stringify(dataToSend).length
    });
    
    try {
      const response = await api.post('/characters', dataToSend);
      console.log('📥 API create - received response:', response.data);
      return response.data.character;
    } catch (error) {
      console.error('❌ API create - failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // Update existing character
  update: async (id, characterData) => {
    const response = await api.put(`/characters/${id}`, characterData);
    return response.data.character;
  },

  // Delete character
  delete: async (id) => {
    await api.delete(`/characters/${id}`);
  },

  // Clone character
  clone: async (id) => {
    const response = await api.post(`/characters/${id}/clone`);
    return response.data.character;
  },

  // Share character
  share: async (id, targetUserId, permissions = 'view') => {
    const response = await api.post(`/characters/${id}/share`, { targetUserId, permissions });
    return response.data;
  },

  // Add XP to character
  addXP: async (id, amount, reason = 'Session XP') => {
    const response = await api.post(`/characters/${id}/xp`, { 
      action: 'add', 
      amount, 
      reason 
    });
    return response.data.character;
  },

  // Get public characters for browsing
  getPublic: async () => {
    const response = await api.get('/characters/public');
    return response.data.characters;
  },
};

// Game Data API - Replace CSV imports
export const gamedataAPI = {
  // Get all game data at once
  getAll: async () => {
    const response = await api.get('/gamedata');
    return response.data.gameData;
  },

  // Get specific data types
  getFactions: async () => {
    const response = await api.get('/gamedata/factions');
    return response.data.factions;
  },

  getSubfactions: async (faction = null) => {
    const url = faction ? `/gamedata/subfactions?faction=${faction}` : '/gamedata/subfactions';
    const response = await api.get(url);
    return response.data.subfactions;
  },

  getSkills: async () => {
    const response = await api.get('/gamedata/skills');
    return response.data.skills;
  },

  getPowerTrees: async (faction = null) => {
    const url = faction ? `/gamedata/powertrees?faction=${faction}` : '/gamedata/powertrees';
    const response = await api.get(url);
    return response.data.powerTrees;
  },

  getMerits: async () => {
    const response = await api.get('/gamedata/merits');
    return response.data.merits;
  },

  getLores: async () => {
    const response = await api.get('/gamedata/lores');
    return response.data.lores;
  },

  getXPCosts: async () => {
    const response = await api.get('/gamedata/xpcosts');
    return response.data.xpCosts;
  },

  getShadowArchetypes: async () => {
    const response = await api.get('/gamedata/shadowarchetypes');
    return response.data.shadowArchetypes;
  },

  getPassions: async () => {
    const response = await api.get('/gamedata/passions');
    return response.data.passions;
  },
};

// Campaigns API
export const campaignsAPI = {
  getAll: () => api.get('/campaigns').then(res => res.data.campaigns),
  getPublic: () => api.get('/campaigns/public').then(res => res.data.campaigns),
  getById: (id) => api.get(`/campaigns/${id}`).then(res => res.data.campaign),
  create: (campaignData) => api.post('/campaigns', campaignData).then(res => res.data.campaign),
  update: (id, campaignData) => api.put(`/campaigns/${id}`, campaignData).then(res => res.data.campaign),
  delete: (id) => api.delete(`/campaigns/${id}`),
  join: (id) => api.post(`/campaigns/${id}/join`).then(res => res.data.campaign),
  leave: (id) => api.post(`/campaigns/${id}/leave`),
  addSession: (id, sessionData) => api.post(`/campaigns/${id}/sessions`, sessionData).then(res => res.data.session),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile').then(res => res.data.user),
  updateProfile: (profileData) => api.put('/users/profile', profileData).then(res => res.data.user),
  search: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`).then(res => res.data.users),
  getPublicProfile: (id) => api.get(`/users/${id}/public`).then(res => res.data.user),
};

// Utility functions for migration from localStorage
export const migrationUtils = {
  // Import characters from localStorage to backend
  importCharactersFromLocalStorage: async () => {
    const localCharacters = JSON.parse(localStorage.getItem('characters') || '[]');
    const importedCharacters = [];
    
    for (const character of localCharacters) {
      try {
        const imported = await charactersAPI.create(character);
        importedCharacters.push(imported);
      } catch (error) {
        console.error('Failed to import character:', character.name, error);
      }
    }
    
    return importedCharacters;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    console.log('👤 Getting current user from localStorage:', userStr);
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('👤 Parsed user object:', user);
    return user;
  },
};

export default api;
