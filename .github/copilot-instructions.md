# Shadow Accord Character Builder - AI Coding Agent Instructions

## Architecture Overview

### Full-Stack MERN Application with Multi-Platform Support
- **Frontend**: React 19 with hooks (web, Electron desktop, Capacitor mobile/Android)
- **Backend**: Node.js/Express API with MongoDB Atlas
- **Deployment**: Railway (backend + frontend)
- **Platforms**: Web (primary), Android APK (Capacitor), Electron desktop

### Critical Data Flow
1. **User Authentication** → JWT tokens stored in localStorage
2. **Character Creation** → POST to `/api/characters` + localStorage fallback
3. **Cloud Sync** → Hybrid system: cloud when authenticated + online, localStorage as cache/offline mode
4. **PDF Export** → Uses `pdf-lib` with platform-specific file handling (Electron IPC, Capacitor Filesystem, web fetch)

## Key Files & Patterns

### Frontend - Monolithic Architecture
The entire character builder UI is in **`src/App.js`** (12,772 lines) - essentially a single-component React monolith:
- **Character creation form** (faction, subfaction, stats selection)
- **Character sheet view** (tabbed interface: overview, stats, powers, merits, XP)
- **PDF export logic** (platform-specific: Electron IPC, Capacitor, web fetch)
- **Power/Lore search** (searchable database, filtering, sorting)
- **Navigation & menu system** (mode management for create/edit/view states)

### Frontend Support Files
- **`src/hooks/useCharacters.js`**: Cloud sync, offline detection, API retry logic
- **`src/services/api.js`**: Axios with JWT injection, platform detection, multi-endpoint fallback
- **`src/components/AuthComponent.js`**: Login/registration modal
- **`src/components/Settings.js`**: Settings, diagnostics, export UI helpers
- **`src/PowerIndex.js`**: Power database reference UI

### Backend Routes & Models
- **`backend/routes/characters.js`**: Character CRUD endpoints with `$or` + `$expr` user filtering
- **`backend/routes/auth.js`**: Registration, login, JWT (7-day expiry), password reset
- **`backend/middleware/auth.js`**: JWT verification for protected routes

## Development Workflows

### Local Development
```powershell
# Terminal 1: Backend (requires Node.js + .env with MONGODB_URI, JWT_SECRET)
cd backend; npm install; npm start
# Runs on http://localhost:5000/api

# Terminal 2: Frontend (detects localhost:5000 in development)
npm install; npm start
# Runs on http://localhost:3000, dev server proxies API locally
```

### Production Deployment
- Frontend: Railway with `npm run build` + `npx serve -s build -p $PORT`
- Backend: Railway root directory `backend/` with `npm start`
- Environment detection in `src/services/api.js` auto-selects correct API URL
- Android builds via Capacitor; Electron builds via `electron-builder`

### Key Environment Variables
- **Frontend**: `REACT_APP_API_URL` (production API endpoint)
- **Backend**: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `RATE_LIMIT_*`
- **Railway**: Detects platform from `process.env.NODE_ENV`

## Multi-Platform Considerations

### Web (Primary)
- Standard localStorage + cloud sync via API
- PDF export via fetch → blob → download

### Android (Capacitor)
- Detected via `window.Capacitor.getPlatform() === 'android'`
- Longer API timeouts (30s vs 10s for web)
- PDF loading via `Filesystem.readFile()` with base64 conversion
- Fallback endpoints due to restrictive carriers

### Electron Desktop
- Detected via `window.electronAPI.isElectron`
- PDF loading via IPC to `window.electronAPI.loadPdfFile()`
- File downloads via `Filesystem` Capacitor plugin
- Offline-first approach (always works without internet)

## State Management & Sync Patterns

### Cloud Sync Logic (in `useCharacters.js`)
1. Check JWT token in localStorage → if valid, assume authenticated
2. If offline, skip API verification; use cached local data
3. If online + authenticated, fetch characters from API
4. On character update: POST to API, fallback to localStorage if API fails
5. Version checking: `MIN_CLOUD_VERSION` prevents old clients from syncing

### Hybrid Storage Strategy
- **Source of truth**: MongoDB when authenticated + online
- **Cache**: localStorage for offline access and immediate UI updates
- **Conflict resolution**: Server version wins on re-sync
- **Migration**: `migrationUtils` in api.js handles schema updates

## Code Conventions & Patterns

### Logging
- Use emoji prefixes: `🔍` (debug), `✅` (success), `❌` (error), `📡` (network), `🌐` (online/offline)
- Log detailed context: platform info, API endpoints, user IDs, timestamps
- Example: `console.log('📡 Testing API connection on', platform, '...');`

### Error Handling
- Frontend: Try-catch with fallbacks to localStorage
- Backend: Express error handler middleware returns `{ success: false, message, errors }`
- API calls include retry logic for mobile compatibility

### Component Structure
- Use functional components with hooks throughout
- `useCallback` for event handlers to prevent unnecessary re-renders
- `useMemo` for expensive computations (character filtering, power searches)
- Props drilling acceptable for character state (large nested forms)

### API Endpoints Pattern
- `GET /api/characters` → Requires auth, filters by userId
- `POST /api/characters` → Creates new character with userId from token
- `PUT /api/characters/:id` → Updates character (validates ownership)
- `DELETE /api/characters/:id` → Soft or hard delete with ownership check
- All protected routes use `auth` middleware: `router.get('/', auth, (req, res) => ...)`

### MongoDB Query Patterns
- Always filter by `userId` using `$or` with ObjectId and string comparison (see characters.js)
- Use `$expr` for complex matching: `{ $expr: { $eq: [{ $toString: "$userId" }, req.user.id] } }`
- Pagination: `skip((page - 1) * limit).limit(limit)`

## Testing Validation Commands
```bash
# Backend validation
cd backend; npm run test-imports      # Verify route/model imports
npm run test-gamedata                # Load and parse CSV game data
npm run validate-backend             # Health check API endpoints
npm run test-server                  # Full integration test

# Frontend
npm test                             # Jest tests with setupTests.js
npm run build                        # React build process
```

## Git Commit Workflow

### Single Commit per Feature
- **Always combine code changes + CHANGELOG.md updates into ONE git commit**
- Never make separate commits for changelog alone
- This keeps git history clean and groups related changes together

### Commit Pattern
```powershell
# Good: One commit with all changes
git add -A; git commit -m "Add feature X and update changelog"; git push origin main

# Bad: Multiple commits (avoid this)
git add src/App.js; git commit -m "Add feature X"; git push
git add CHANGELOG.md; git commit -m "Update changelog"; git push
```

## Important Gotchas & Debugging Tips

### API Connection Issues
- Check `src/services/api.js` for endpoint selection logic
- Android/Capacitor may need HTTP fallback (CSP issues)
- CORS errors? Verify `corsOptions` in `backend/server.js` includes your origin

### Offline/Online Transitions
- `useCharacters.js` monitors `navigator.onLine` events
- Offline mode bypasses API calls; doesn't clear auth token
- Test via DevTools offline mode in web browser

### PDF Export Platform Detection
- Logs detailed environment info before each attempt
- Order: Try Electron IPC → Try Capacitor Filesystem → Fallback to web fetch
- PDF form fields must match database field names exactly

### Character Sync Delays
- Mobile may have variable network; respect 30s timeout for Capacitor
- Version mismatch triggers fallback to localStorage-only mode
- Check `version.js` for `APP_VERSION` and `MIN_CLOUD_VERSION`

### PDF Export Text Formatting
- **Issue**: Power names, skills, and other fields exported to PDF appear in undercase with underscores (e.g., "light_weapon" instead of "Light Weapon")
- **Root cause**: `formatDisplayText()` utility (line ~352) was only replacing underscores with spaces but not applying title case capitalization
- **Solution**: Updated function to both replace underscores AND apply `.replace(/\b\w/g, l => l.toUpperCase())` for proper capitalization
- **Application**: All PDF form fields now use this utility: innate trees, learned powers, skills, merits, lores
- **Note**: This ensures consistent visual presentation across all exported character sheets regardless of how field names are stored in game data

### Ghoul Character Power System
- **Innate Trees**: Ghouls automatically assigned three innate vampire trees (Celerity, Fortitude, Potence) at character creation
- **Free Dot**: Potence 1 automatically granted free (stored as `powers.potence['1']: true`) in `handleSubfactionChange()` line ~1649
- **Character Manager UI**: In character manager, ghouls can learn ANY vampire power sequentially after creation—ensure `canLearnPower()` check allows non-creation phases (line ~2282)
- **Faction Powers Filter**: Ghoul faction powers display must NOT exclude innate trees (line ~10955) so they can see duplication option to show learned pricing
- **Old Code**: Removed broken innate tree selection UI from creation wizard (was preventing all power assignment)—now auto-assigns and shows explanatory blurb instead

### Valeren Warrior Power Data
- **Issue**: Valeren Warrior level 3 was showing "Aggravated 1" instead of correct rulebook power
- **Fix Applied**: Corrected CSV data in App.js (line ~1076) to "Light Weapon|Vengeance of Samiel"
- **Pattern**: Game data embedded as CSV strings in App.js must be verified against rulebook—exact matching required

### Mongo User Filtering Broken
- Root cause: `req.user.id` vs `req.user._id` type mismatch (string vs ObjectId)
- Solution: Use `$or` query with both types + `$expr` string conversion (see `characters.js` line ~20)

## Critical Dependencies
- **react**: UI framework with hooks
- **axios**: HTTP client with request/response interceptors
- **pdf-lib**: PDF form field manipulation
- **@capacitor/core**: Mobile plugin bridge
- **express**: Backend routing and middleware
- **mongoose**: MongoDB ODM with schema validation
- **jsonwebtoken**: JWT generation and verification
- **bcryptjs**: Password hashing with salt rounds

## Where to Add Features

### New API Endpoint
1. Add route in `backend/routes/*.js`
2. Add validation with `express-validator`
3. Add auth middleware (`auth` for protected, `optionalAuth` for optional)
4. Add corresponding call in `src/services/api.js` via `charactersAPI.*`
5. Test with `backend/test-server.js` before deployment

### Platform-Specific UI (Web vs Mobile vs Electron)
- Use detection flags: `isCapacitor`, `isAndroid`, `isElectron` from `api.js`
- Conditionally render: `{isAndroid && <MobileSpecificComponent />}`
- Test on all platforms before merging

### Modifying Character Sheet (App.js)
Since the entire character UI is in `src/App.js`, find the relevant section:
- **Character creation form**: Search for `creationStep` state management
- **Character sheet tabs**: Search for `activeTab` state (overview/stats/powers/merits/xp)
- **PDF export**: Search for `exportToPDF` function and add new field mappings
- Add new fields to state with sensible defaults, render in appropriate tabs, include in API calls
