import axios from 'axios';

// API Configuration
// Auto-detect environment and platform
const isProduction = process.env.NODE_ENV === 'production';
const isCapacitor = typeof window !== 'undefined' && window.Capacitor;

console.log('🔍 API Environment Detection:', {
  isProduction,
  isCapacitor,
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  platform: typeof window !== 'undefined' && window.Capacitor ? 'Capacitor/Mobile' : 'Web'
});

const API_BASE = process.env.REACT_APP_API_URL || 
  (isProduction || isCapacitor ? 'https://shadowaccordapi.up.railway.app/api' : 'http://localhost:5000/api');

console.log('🌐 API Base URL:', API_BASE);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API request with token:', config.url, token.substring(0, 20) + '...');
  } else {
    console.log('API request without token:', config.url);
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log('API response success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API error:', error.config?.url, error.response?.status, error.response?.data);
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
    const response = await api.post('/auth/login', { login: email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
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
    const response = await api.post('/characters', {
      ...characterData,
      name: characterData.name || 'New Character',
      player: characterData.player || 'Unknown Player',
      faction: characterData.faction || 'human',
      subfaction: characterData.subfaction || 'commoner'
    });
    return response.data.character;
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
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default api;
