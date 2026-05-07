# Shadow Accord Character Builder - Claude Instructions

## Project Overview

Fan-made LARP/RPG character builder for the Shadow Accord system (World of Darkness variant). Full-stack MERN app with web, Electron desktop, and Android APK platforms. Live at [shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app).

**Factions**: Vampire, Shifter, Human, Wraith — each with complete subfaction trees, powers, merits, and lores.

## Architecture

### Stack
- **Frontend**: React 19 with hooks — `src/App.js` (12,772+ lines, intentional monolith)
- **Backend**: Node.js/Express + MongoDB Atlas, deployed on Railway
- **Platforms**: Web (primary), Android (Capacitor), Electron desktop

### Critical File Map
| File | Purpose |
|------|---------|
| `src/App.js` | Entire character builder UI — creation wizard, sheet view, PDF export, power search |
| `src/hooks/useCharacters.js` | Cloud sync, offline detection, API retry logic |
| `src/services/api.js` | Axios with JWT, platform detection, multi-endpoint fallback |
| `src/components/AuthComponent.js` | Login/registration modal |
| `src/components/Settings.js` | Settings, diagnostics, export helpers |
| `src/PowerIndex.js` | Power database reference UI |
| `backend/routes/characters.js` | Character CRUD with `$or` + `$expr` user filtering |
| `backend/routes/auth.js` | Registration, login, JWT (7-day expiry), password reset |
| `backend/middleware/auth.js` | JWT verification |

### Finding Things in App.js
- Character creation form → search `creationStep`
- Character sheet tabs → search `activeTab`
- PDF export → search `exportToPDF`
- Power/lore assignment → search `handleSubfactionChange`
- Power learning validation → search `canLearnPower`

## Development

### Local Dev
```powershell
# Terminal 1 — Backend (needs .env: MONGODB_URI, JWT_SECRET)
cd backend; npm start   # localhost:5000/api

# Terminal 2 — Frontend
npm start               # localhost:3000, proxies API
```

### Validation Commands
```bash
cd backend
npm run test-imports     # verify route/model imports
npm run test-gamedata    # parse CSV game data
npm run validate-backend # health check API endpoints
npm run test-server      # full integration test

# Frontend
npm test                 # Jest
npm run build            # React production build
```

## Git Workflow

**Single commit per feature** — always combine code changes + CHANGELOG.md into ONE commit. Never separate them.

```powershell
# Correct
git add -A; git commit -m "Add feature X and update changelog"; git push origin main
```

## Code Conventions

### Logging (use emoji prefixes)
- `🔍` debug, `✅` success, `❌` error, `📡` network, `🌐` online/offline

### Component Patterns
- Functional components with hooks throughout
- `useCallback` for event handlers, `useMemo` for expensive computations
- Props drilling acceptable for character state (large nested forms)
- No comments unless WHY is non-obvious

### Backend Patterns
- All protected routes use `auth` middleware
- Always filter MongoDB by `userId` using `$or` with both ObjectId + string comparison via `$expr`
- Error responses: `{ success: false, message, errors }`

### Game Data
- Stored as CSV strings embedded in App.js
- Must be verified against the Shadow Accord rulebook — exact matching required
- `formatDisplayText()` handles underscore-to-space + title case conversion for PDF display

## Platform-Specific Notes

### Platform Detection (in api.js)
- Android: `window.Capacitor.getPlatform() === 'android'`
- Electron: `window.electronAPI.isElectron`
- Flags: `isCapacitor`, `isAndroid`, `isElectron`

### PDF Export Order
Electron IPC → Capacitor Filesystem → web fetch (fallback)

### API Timeouts
- Web: 10s, Android: 30s (carriers can be slow)

### Android Networking
- Uses axios + fetch fallback (axios can fail silently on some carriers)
- CORS issues may require HTTP fallback — check CSP

## Known Gotchas & Applied Fixes

### MongoDB User Filtering
- Root cause: `req.user.id` vs `req.user._id` type mismatch
- Fix: `$or` query with `$expr: { $eq: [{ $toString: "$userId" }, req.user.id] }`

### PDF Text Formatting
- `formatDisplayText()` must replace underscores AND apply title case
- All PDF form field names must match database field names exactly

### Ghoul Powers
- Auto-assigned innate trees: Celerity, Fortitude, Potence
- Potence 1 granted free in `handleSubfactionChange()` (~line 1649)
- `canLearnPower()` (~line 2282) must allow non-creation phases for character manager

### Wraith Characters
- Check legion (not subfaction) for next button validation in creation wizard

### Valeren Warrior Level 3
- Correct data: "Light Weapon|Vengeance of Samiel" (was wrongly "Aggravated 1")

### Cloud Sync Version Check
- `MIN_CLOUD_VERSION` in `version.js` — old clients fall back to localStorage-only

## Key Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `REACT_APP_API_URL` | Frontend `.env` | Production API endpoint |
| `MONGODB_URI` | Backend `.env` | MongoDB Atlas connection |
| `JWT_SECRET` | Backend `.env` | JWT signing secret |
| `NODE_ENV` | Backend `.env` | Environment detection |

## Deployment

- Frontend + Backend: Railway platform
- Database: MongoDB Atlas
- Frontend build: `npm run build` + `npx serve -s build -p $PORT`
- Backend root directory: `backend/`
- Android: Capacitor build (see DISTRIBUTION_INSTRUCTIONS.md)
- Electron: `npm run build` then `npm run electron`
