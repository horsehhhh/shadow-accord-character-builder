# Shadow Accord Backend Setup Instructions

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Git** (for version control)

## Installation Steps

### 1. Install Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your settings:

```bash
cp .env.template .env
```

Edit the `.env` file with your specific configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/shadow-accord

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Important Security Notes:**
- Change the `JWT_SECRET` to a strong, unique secret for production
- Use a strong `MONGODB_URI` connection string for production
- Set `NODE_ENV=production` for production deployments

### 3. Database Setup

#### Option A: Local MongoDB

1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/atlas
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

### 5. Verify Installation

Check that the server is running by visiting:
- Health check: http://localhost:5000/api/health
- Game data: http://localhost:5000/api/gamedata/factions

## Development Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run tests (if implemented)
npm test

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix
```

## Frontend Integration

### 1. Update Frontend Environment

Add to your React app's `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Install Frontend Dependencies

You may need to add axios or similar for API calls:

```bash
cd ../  # Go back to React app root
npm install axios
```

### 3. Create API Service

Create `src/services/api.js` in your React app:

```javascript
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  getProfile: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

export const charactersAPI = {
  getAll: () => api.get('/characters'),
  getById: (id) => api.get(`/characters/${id}`),
  create: (characterData) => api.post('/characters', { characterData }),
  update: (id, characterData) => api.put(`/characters/${id}`, { characterData }),
  delete: (id) => api.delete(`/characters/${id}`),
  clone: (id) => api.post(`/characters/${id}/clone`),
  share: (id, targetUserId, permissions) => 
    api.post(`/characters/${id}/share`, { targetUserId, permissions }),
  addXP: (id, amount, reason) => 
    api.post(`/characters/${id}/xp`, { action: 'add', amount, reason }),
};

export const gamedataAPI = {
  getAll: () => api.get('/gamedata'),
  getFactions: () => api.get('/gamedata/factions'),
  getSubfactions: (faction) => api.get(`/gamedata/subfactions${faction ? `?faction=${faction}` : ''}`),
  getSkills: () => api.get('/gamedata/skills'),
  getPowerTrees: (faction) => api.get(`/gamedata/powertrees${faction ? `?faction=${faction}` : ''}`),
  getMerits: () => api.get('/gamedata/merits'),
  getLores: () => api.get('/gamedata/lores'),
  getXPCosts: () => api.get('/gamedata/xpcosts'),
};

export const campaignsAPI = {
  getAll: () => api.get('/campaigns'),
  getPublic: () => api.get('/campaigns/public'),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (campaignData) => api.post('/campaigns', campaignData),
  update: (id, campaignData) => api.put(`/campaigns/${id}`, campaignData),
  delete: (id) => api.delete(`/campaigns/${id}`),
  join: (id) => api.post(`/campaigns/${id}/join`),
  leave: (id) => api.post(`/campaigns/${id}/leave`),
  addSession: (id, sessionData) => api.post(`/campaigns/${id}/sessions`, sessionData),
};

export default api;
```

### 4. Replace LocalStorage with API Calls

Update your React components to use the API instead of localStorage:

```javascript
// Before
const characters = JSON.parse(localStorage.getItem('characters') || '[]');

// After
import { charactersAPI } from '../services/api';

const [characters, setCharacters] = useState([]);

useEffect(() => {
  const loadCharacters = async () => {
    try {
      const response = await charactersAPI.getAll();
      setCharacters(response.data.characters);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };
  
  loadCharacters();
}, []);
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shadow-accord
JWT_SECRET=super-secure-random-string-at-least-32-characters-long
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Security Considerations

1. **Use HTTPS** in production
2. **Strong JWT Secret** - at least 32 characters, randomly generated
3. **Database Security** - Use MongoDB Atlas or secure your MongoDB instance
4. **Environment Variables** - Never commit secrets to version control
5. **Rate Limiting** - Configure appropriate limits for your usage
6. **CORS** - Set specific origins, don't use wildcards

### Deployment Options

#### Option 1: Heroku

1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set JWT_SECRET=your-secret`
4. Deploy: `git push heroku main`

#### Option 2: DigitalOcean/AWS/GCP

1. Set up server with Node.js
2. Clone repository
3. Install dependencies: `npm install --production`
4. Set environment variables
5. Use PM2 for process management: `pm2 start server.js`
6. Configure reverse proxy (nginx)

#### Option 3: Railway/Render

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear localStorage and re-login

3. **CORS Errors**
   - Update CORS_ORIGINS in `.env`
   - Ensure frontend URL is included

4. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing process: `lsof -ti:5000 | xargs kill`

### Logging

The server logs include:
- Database connection status
- API requests (in development)
- Error messages
- Authentication attempts

Check console output for debugging information.

## Testing the API

You can test the API endpoints using:

1. **Postman** - Import the API documentation
2. **curl** commands:
   ```bash
   # Register user
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   
   # Get game data
   curl http://localhost:5000/api/gamedata/factions
   ```

3. **Browser** - For GET endpoints like game data

## Next Steps

1. **User Authentication** - Implement login/register in frontend
2. **Character Migration** - Create script to migrate localStorage characters
3. **Campaign Features** - Build campaign management UI
4. **Real-time Features** - Add WebSocket support for live updates
5. **Mobile App** - Use the API for mobile app development

## Support

For issues or questions:
1. Check the API documentation in `API_DOCUMENTATION.md`
2. Review error messages in server logs
3. Test API endpoints individually
4. Verify environment configuration
