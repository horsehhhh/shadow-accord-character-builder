# Shadow Accord Character Builder - Backend API Documentation

## Overview

This backend API provides authentication, character management, game data, and campaign functionality for the Shadow Accord Character Builder. It replaces the existing localStorage-based system with a server-hosted solution that supports user accounts and collaborative features.

## Base URL

Development: `http://localhost:5000/api`
Production: `https://your-domain.com/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "username": "username",
    "email": "email@example.com",
    "role": "user"
  }
}
```

#### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### GET `/api/auth/me`
Get current user information (requires authentication).

#### PUT `/api/auth/change-password`
Change user password (requires authentication).

---

### Character Routes (`/api/characters`)

#### GET `/api/characters`
Get all characters for the authenticated user.

**Query Parameters:**
- `faction`: Filter by faction
- `search`: Search character names
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

#### GET `/api/characters/public`
Get public characters for browsing.

#### GET `/api/characters/:id`
Get specific character by ID.

#### POST `/api/characters`
Create a new character.

**Request Body:**
```json
{
  "name": "Character Name",
  "faction": "vampire",
  "subfaction": "brujah",
  "characterData": {
    // Complete character data object
    "attributes": {...},
    "skills": {...},
    "powers": {...}
    // ... all other character properties
  }
}
```

#### PUT `/api/characters/:id`
Update character (owner only).

#### DELETE `/api/characters/:id`
Delete character (owner only).

#### POST `/api/characters/:id/clone`
Clone a character.

#### POST `/api/characters/:id/share`
Share character with another user.

**Request Body:**
```json
{
  "targetUserId": "user-id",
  "permissions": "view" // or "edit"
}
```

#### POST `/api/characters/:id/xp`
Manage character XP.

**Request Body:**
```json
{
  "action": "add", // or "subtract"
  "amount": 5,
  "reason": "Session XP"
}
```

---

### Game Data Routes (`/api/gamedata`)

All game data routes are public and return the CSV-based game data.

#### GET `/api/gamedata`
Get all game data.

#### GET `/api/gamedata/factions`
Get all factions.

#### GET `/api/gamedata/subfactions`
Get subfactions (optionally filtered by faction).

#### GET `/api/gamedata/skills`
Get all skills.

#### GET `/api/gamedata/powertrees`
Get power trees (optionally filtered by faction).

#### GET `/api/gamedata/merits`
Get all merits.

#### GET `/api/gamedata/lores`
Get all lores.

#### GET `/api/gamedata/xpcosts`
Get XP cost table.

#### GET `/api/gamedata/shadowarchetypes`
Get shadow archetypes.

#### GET `/api/gamedata/passions`
Get passion types.

---

### Campaign Routes (`/api/campaigns`)

#### GET `/api/campaigns`
Get campaigns where user is GM or player.

#### GET `/api/campaigns/public`
Get public campaigns available for joining.

#### GET `/api/campaigns/:id`
Get campaign details (participants only).

#### POST `/api/campaigns`
Create new campaign (requires authentication).

**Request Body:**
```json
{
  "name": "Campaign Name",
  "description": "Campaign description",
  "location": "Location",
  "playerLimit": 6,
  "isPublic": true,
  "schedule": {
    "day": "Saturday",
    "time": "19:00",
    "frequency": "weekly"
  }
}
```

#### PUT `/api/campaigns/:id`
Update campaign (GM only).

#### DELETE `/api/campaigns/:id`
Delete campaign (GM only).

#### POST `/api/campaigns/:id/join`
Join a campaign.

#### POST `/api/campaigns/:id/leave`
Leave a campaign.

#### POST `/api/campaigns/:id/remove-player`
Remove player from campaign (GM only).

#### POST `/api/campaigns/:id/sessions`
Add session record (GM only).

---

### User Routes (`/api/users`)

#### GET `/api/users/profile`
Get current user profile.

#### PUT `/api/users/profile`
Update user profile.

#### GET `/api/users/search`
Search users by username.

#### GET `/api/users/:id/public`
Get public user profile.

#### Admin Routes (Admin only)

#### GET `/api/users/admin/list`
Get all users with pagination.

#### PUT `/api/users/admin/:id/role`
Update user role.

#### PUT `/api/users/admin/:id/suspend`
Suspend/unsuspend user.

#### DELETE `/api/users/admin/:id`
Delete user account.

#### GET `/api/users/admin/stats`
Get platform statistics.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors array (if applicable)
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Data Models

### Character Data Structure

The character data follows the existing frontend structure with these key properties:

```json
{
  "name": "string",
  "faction": "string",
  "subfaction": "string",
  "level": "number",
  "experience": {
    "current": "number",
    "total": "number",
    "log": "array"
  },
  "attributes": {
    "health": "number",
    "willpower": "number",
    "energy": "number",
    "virtue": "number"
  },
  "skills": "object",
  "powers": "object",
  "merits": "array",
  "lores": "object",
  "equipment": "object",
  "notes": "string"
}
```

### Sharing System

Characters can be shared with specific permissions:
- `view`: Can view character
- `edit`: Can view and modify character

### Campaign System

Campaigns support:
- GM and player management
- Session tracking with XP awards
- Public/private visibility
- Player limits
- Scheduling information

## Rate Limiting

API requests are rate limited to prevent abuse:
- Default: 100 requests per 15-minute window per IP
- Configurable via environment variables

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days (configurable)
- Helmet.js for security headers
- Input validation on all endpoints
- CORS protection

## Frontend Integration

To integrate with the existing React frontend, create an API service to replace localStorage calls:

```javascript
// api.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...options
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Character methods
  async getCharacters() {
    return this.request('/characters');
  }

  async saveCharacter(character) {
    return this.request('/characters', {
      method: 'POST',
      body: JSON.stringify({ characterData: character })
    });
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Game data methods
  async getGameData() {
    return this.request('/gamedata');
  }
}

export default new ApiService();
```

Replace localStorage calls in your React components with API calls:

```javascript
// Before
localStorage.setItem('characters', JSON.stringify(characters));

// After
await apiService.saveCharacter(character);
```
