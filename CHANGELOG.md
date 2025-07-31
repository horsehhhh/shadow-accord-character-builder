# Changelog

All notable changes to the Shadow Accord Character Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## ⚖️ Legal Disclaimer

**Shadow Accord Character Builder** is an unofficial, fan-created tool for the Shadow Accord RPG system. This project is not affiliated with, endorsed by, or connected to the creators or publishers of Shadow Accord, World of Darkness, or any related intellectual properties.

- **Shadow Accord** and related game content are the intellectual property of their respective creators
- **World of Darkness** and associated trademarks are owned by Modiphius Entertainment and Paradox Interactive
- This character builder is created and maintained by fans for the fan community
- No copyright infringement is intended
- This tool is provided free of charge for personal, non-commercial use only

All game mechanics, character data, and rulebook references implemented in this application remain the intellectual property of their original creators. This project serves only as a digital tool to assist players in character creation and management.

---

## [v0.3.2] - 2025-07-30

### 🎯 Complete Power & Advancement System Overhaul

#### Fixed - Power Saving System
- **✅ Complete Cloud Sync Conversion**: Systematically converted all character advancement buttons from local-only state updates to cloud synchronization
- **✅ Power Learning Persistence**: All power advancement buttons now properly save to database instead of only updating local state
- **✅ Merit Management**: Merit addition and removal buttons now sync to cloud with proper XP calculation
- **✅ Stat Advancement**: Energy, Willpower, and other stat modification buttons now persist to database
- **✅ XP System Integration**: Check-in XP, manual XP adjustments, and all XP-related changes now save to cloud
- **✅ Lore System**: Lore purchase and removal buttons now properly sync with database
- **✅ Character Limitations**: Self-nerf form and limitation removal now persist to cloud
- **✅ Faction Change Powers**: Free faction change power selections now save correctly

#### Fixed - Database Query Security & Performance
- **🔒 Search Filter Security**: Fixed critical bug where search filters were overwriting user authentication, preventing cross-user data contamination
- **🔍 ObjectId Query Optimization**: Implemented comprehensive `$and` query structure to handle MongoDB ObjectId vs string comparisons
- **⚡ Authentication Preservation**: Search and faction filters now preserve user authentication instead of destroying it
- **🚫 500 Error Resolution**: Fixed undefined reference errors in backend logging that were causing server crashes

#### Fixed - API & Infrastructure
- **🌐 API URL Correction**: Fixed API base URL from `shadowaccordapi` to `shadowaccordcharacterbuilder` for proper connectivity
- **🔧 Character Deletion**: Fixed character deletion functionality to properly call cloud API instead of local-only removal
- **📡 Railway Deployment**: Established Railway CLI access for real-time debugging and deployment monitoring
- **🔄 Error Handling**: Improved cloud sync error handling with proper fallback mechanisms

#### Added - Security & Privacy Enhancements
- **🔒 Email Privacy Protection**: User emails are now hidden from all API responses except user's own profile
- **🛡️ Admin Route Security**: Admin endpoints now require proper authentication and role verification
- **🔐 Stronger Password Requirements**: Minimum 8 characters with letter + number/special character requirement
- **🚫 Password Protection**: Passwords are bcrypt hashed and never exposed in any API response
- **📧 Privacy Compliance**: Only usernames visible to other users, emails remain private

#### User Experience
- **📱 Optional Login**: Login is completely optional - only required if you want cloud save functionality across devices
- **💾 Hybrid Storage**: App works fully offline with localStorage, cloud sync available when logged in
- **🔄 Seamless Experience**: All character creation and management works without an account

#### Technical Improvements
- **⚡ Systematic Pattern Conversion**: Converted ~15+ advancement buttons from `newCharacters[currentCharacterIndex] = updated; setCharacters(newCharacters)` pattern to `await updateCurrentCharacter(updated)` pattern
- **🛡️ Security Hardening**: All user queries now use secure `$and` structure to prevent authentication bypass
- **📊 Database Operations**: All character modifications now properly call `charactersAPI.update()` for cloud persistence
- **🎮 User Experience**: Character changes now persist across sessions and page refreshes

#### Validated Functionality
- **✅ All 17 characters load correctly** from cloud database
- **✅ Character deletion works** via cloud API
- **✅ Power advancement saves** to database permanently  
- **✅ Merit changes persist** across sessions
- **✅ XP adjustments sync** to cloud properly
- **✅ Search and filtering secure** without data leakage
- **✅ No cross-user data contamination** confirmed

---

## [v0.3.1] - 2025-07-29

### 🔧 Major Cloud Synchronization Fixes

#### Fixed - Critical Issues
- **Character Creation Integration**: App was only saving characters to local state, never calling cloud save functions
- **Required Field Validation Blocking**: Backend validation required non-empty name, player, faction, subfaction but characters start with empty values
- **API Data Format Issue**: Corrected character creation API to send character data in the format expected by backend validation
- **Character Data Retrieval**: Fixed backend character list endpoint to return complete character objects instead of limited field selection
- **Missing Character Components**: Backend now properly returns stats, skills, powers, merits, and all nested character data structures
- **Cloud Save Failures**: Resolved character creation failures by properly spreading character data instead of nesting in `characterData` field
- **Data Structure Mismatch**: Fixed fundamental disconnect between frontend character object structure and backend API expectations

#### Added - Cloud Integration
- **Character Creation Cloud Calls**: Added `cloudCreateCharacter()` call after local character creation to sync to cloud storage
- **Faction Change Cloud Updates**: Added `cloudUpdateCharacter()` call for faction changes to update existing cloud characters
- **Error Handling**: Comprehensive try/catch blocks with detailed logging for cloud save attempts and failures
- **Fallback Behavior**: Cloud save failures fall back gracefully to local storage with user notification

#### Enhanced - Debugging & Monitoring
- **Comprehensive API Debugging**: Added detailed logging throughout API service layer for request/response tracking
- **Authentication Token Monitoring**: Enhanced logging to track token presence and authentication state during API calls
- **Character Operation Logging**: Added detailed console output for character creation, loading, and error scenarios
- **Backend Request Logging**: Added server-side logging for character creation requests, validation, and database operations
- **API Error Reporting**: Improved error handling with full response data logging for easier troubleshooting
- **Cloud Sync Visibility**: Added detailed console logs to track character sync attempts and success/failure states

#### Technical Details
- **Backend Model Updates**: Made name, player, faction, subfaction optional with default empty string values in Character schema
- **API Route Validation**: Changed validation from `.notEmpty()` to `.optional()` for character creation fields
- **Character List Query**: Removed `.select()` filtering from backend character list route to return complete character data
- **API Service Fixes**: Fixed `charactersAPI.create()` to spread character data directly instead of wrapping in nested object
- **Request Interceptors**: Added comprehensive request/response interceptors in API service for debugging
- **Hook Integration**: Enhanced error reporting in `useCharacters.js` hook with detailed API error information
- **Authentication Tracking**: Improved authentication state tracking and token validation logging

---

## [v0.3.0] - 2025-07-29

### 🌐 Major Release: Full-Stack Web Application

#### Added
- **Cloud Character Storage**: Complete backend with Node.js/Express, MongoDB Atlas database, and JWT authentication
- **Cross-Device Synchronization**: Characters automatically sync across all devices when logged in
- **Web Application Deployment**: Live at [shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app)
- **API Backend**: RESTful API deployed at [shadowaccordapi.up.railway.app](https://shadowaccordapi.up.railway.app)
- **User Authentication System**: Secure registration, login, logout, and password reset functionality
- **Hybrid Storage Model**: Smart system using localStorage for offline access and cloud storage for cross-device sync
- **Smart Environment Detection**: Automatically detects and adapts API endpoints for production, development, and mobile platforms
- **Railway Hosting**: Professional deployment on Railway platform with custom domains

#### Enhanced User Experience
- **Minimizable Authentication Panel**: Toggle-able auth interface that can be collapsed to stay out of the way
- **Right-Side Positioning**: Moved authentication components to top-right corner for less intrusive experience
- **Home Screen Only Authentication**: Login interface only appears on main menu, hidden during character creation/editing
- **Improved Visual Design**: Subtle, less imposing authentication interface with transparency and refined styling
- **System Status Dashboard**: Comprehensive status information moved to Settings section with detailed storage info

#### Backend Infrastructure
- **Express.js API Server**: Complete REST API with character CRUD operations, user management, and authentication
- **MongoDB Atlas Integration**: Cloud database with proper indexing and data validation
- **JWT Security**: Secure token-based authentication with 24-hour expiration and refresh capabilities
- **Password Security**: bcryptjs hashing with salt rounds for secure password storage
- **CORS Configuration**: Proper cross-origin resource sharing for frontend-backend communication
- **Error Handling**: Comprehensive error responses and logging for debugging and monitoring

#### Developer Experience
- **Environment Variables**: Secure configuration management for database connections and JWT secrets
- **Git Workflow**: Proper version control with meaningful commits and deployment automation
- **API Documentation**: RESTful endpoints for authentication and character management
- **Cross-Platform Compatibility**: Backend works seamlessly with web, Electron, and mobile versions

#### Migration & Data Safety
- **Automatic Migration System**: Seamlessly migrates existing localStorage characters to cloud storage
- **Data Validation**: Server-side validation ensures data integrity during cloud operations
- **Backup Preservation**: Local storage preserved as fallback while cloud sync is active
- **Character Conflict Resolution**: Smart handling of character updates across multiple devices

### Fixed
- **Authentication Flow**: Resolved CORS issues and callback errors during user registration/login
- **Domain Configuration**: Fixed Railway deployment issues with custom domain setup
- **API Response Handling**: Improved error handling for network failures and server issues

### Changed
- **Storage Architecture**: Upgraded from localStorage-only to hybrid local/cloud storage model
- **Authentication UI**: Redesigned for better user experience with minimize/maximize functionality
- **Settings Organization**: Consolidated system status and cloud sync information into Settings panel
- **Application Scope**: Evolved from local tool to full-featured web application with cloud capabilities

### Technical Improvements
- **API Service Layer**: Clean separation of concerns with dedicated API service module
- **Authentication State Management**: Improved state handling across components with proper context
- **Network Resilience**: Graceful fallback to local storage when cloud services are unavailable
- **Performance Optimization**: Efficient API calls and data synchronization to minimize bandwidth usage

## [v0.1.9] - 2025-07-24

### Fixed
- **PDF Export in Android APK**: Fixed critical issue where PDF export failed in Android APK builds
- **Cross-Platform File Operations**: Resolved blob download limitations on mobile devices

### Added
- **Capacitor Filesystem Integration**: Added @capacitor/filesystem plugin for cross-platform file operations
- **Universal Download Function**: Created downloadFile() helper that works across web, Electron, and Android platforms
- **Android File Saving**: PDFs now save to Android Documents folder with user notification
- **Enhanced Mobile Support**: Updated loadPdfFile() function to support Capacitor/Android environments with web fetch fallback

### Changed
- **PDF Export Architecture**: Replaced web-only blob download methods with cross-platform file saving approach
- **Error Handling**: Enhanced PDF export error handling for mobile environments

## [v0.1.8] - 2025-07-24

### Fixed
- **PDF Export in Electron Builds**: Fixed critical issue where PDF export failed in built Electron executable (.exe) files
- **ESLint Warnings**: Resolved React hooks exhaustive-deps warnings by properly wrapping formatDisplayText in useCallback
- **Build Configuration**: Updated package.json to include all necessary PDF template files and preload script

### Added
- **IPC Communication**: Added Inter-Process Communication handlers to Electron main process for secure PDF file loading
- **Preload Script**: Created preload.js to safely expose PDF loading functionality to renderer process
- **Universal PDF Loading**: Implemented loadPdfFile() helper function that works in both web browsers and Electron apps
- **Enhanced Error Handling**: Added comprehensive error messages with environment detection for PDF export failures
- **Debug Logging**: Added detailed logging for PDF export troubleshooting and debugging

### Changed
- **Author Information**: Updated git configuration and package.json author from "Shadow Accord Team" to "horsehhhh and Claude"
- **README**: Enhanced with proper project information and author credits
- **Code Quality**: Build now compiles with zero ESLint warnings

## [v0.1.7] - 2025-07-24

### Added
- **New PDF Template**: Updated PDF export to use "Shadow accord fixed fillable character sheet 7.24.pdf"
- **Rank/Generation System**: Added rank/generation tab to character manager with shifter ranks (cub, cliath, fostern, adren, athro, elder)
- **Power Cost System**: Implemented comprehensive power cost display with 177 total powers categorized by energy/willpower/virtue costs
- **Subfaction Field Mapping**: Added tribe (field 1), breed (field 2), auspice (field 3) mapping for shifters in PDF export

### Fixed
- **PDF Field Mappings**: Reorganized to innate powers (fields 1-3), learned powers first/second half (fields 4-48), skills (fields 49-63)
- **Power Name Display**: Fixed PDF export to show actual power names instead of "true"
- **Lore Field Issues**: Resolved lore field export problems and "[object Object]" display issues
- **Power Tree Names**: Removed "Gift" suffix from power tree names in PDF output

### Changed
- **Generation Range**: Updated vampire generations to 6th-13th (6th oldest, 13th youngest)
- **Merit Display**: Removed merit level numbers from PDF export
- **Character Creation**: Made shifters select rank during creation as mandatory step

## [v0.1.6] - 2025-07-23

### Added
- **Enhanced Natus System**: Redesigned Natus mandatory flaw system to match derangement patterns
- **New Vampire Power Trees**: Added Deimos, Thaumaturgy: Rego Aquam, and 5 Dark Thaumaturgy paths
- **Automatic Permatainted Effects**: Implemented for corrupt power tree advancement (Death, Demonology, Wyrm gifts, Dark Thaumaturgy, Daimoinon)
- **Derangement Requirements**: Added automatic derangement requirement for Wyrm Madness gift advancement
- **Fundamental Permatainted Status**: Added for Drone, Gorgon, and Fomori claimed characters

### Changed
- **Tremere Clan Powers**: Updated to have Thaumaturgy: Rego Vitae as innate instead of generic Thaumaturgy

### Fixed
- **Natus Flaw Validation**: Fixed requirement validation and UI display issues

## [v0.1.5] - 2025-07-22

### Fixed
- **Critical Character Creation Error**: Resolved "Assignment to constant variable" error during character creation
- **Mutation Issues**: Fixed const variable mutations in handleFactionChangeTransformation, advanceCharacter, and reduceCharacter functions
- **Lore System Errors**: Fixed "some is not a function" error and data structure inconsistency by converting lore data from object to array format
- **State Management**: Ensured all character state updates follow React immutability requirements
- **Backward Compatibility**: Added defensive programming for existing character lores

### Changed
- **Error Handling**: Improved error handling and data migration for lore system
- **Character Display**: Enhanced to handle both old and new lore data formats

## [v0.1.4] - 2025-07-22

### Added
- **Sense Spirit Power**: Added as fundamental power to Gorgon faction, Claimed Drone, and Claimed Fomori characters
- **Enhanced Claimed Gorgon**: Now receives both Frail and Sense Spirit fundamental powers
- **Free Lore for Ghouls**: Automatically receive Vampire Lore during character creation
- **Clan Selection for Ghouls**: Optional clan selection with clan-specific lore rewards
- **Free Lore for Sorcerers**: Fellowship selection grants both Mage Lore and fellowship-specific lore
- **Enhanced UI**: Added clan selection step and fellowship benefits explanation

### Fixed
- **Clan Restrictions**: Added warnings for special bloodlines (Giovanni, Lamia)

## [v0.1.3] - 2025-07-23

### Changed
- **Natus Mandatory Flaw System**: Redesigned Natus flaw requirement to match derangement system patterns used by other subfactions
  - Replaced inline flaw selection with structured mandatory flaw selection interface
  - Added visual selection indicators and status tracking
  - Implemented proper source tracking with `source: 'natus'` for mandatory flaws
  - Updated character creation validation to check for Natus-specific mandatory flaw
  - Improved UI consistency with other subfaction requirement systems (Black Spiral Dancers, Fallen Fera)

### Fixed
- Natus flaw requirement now properly displays and validates at character creation
- Flaw selection interface now matches the visual design patterns of other mandatory systems

## [v0.1.2] - 2025-07-22

### Added
- **Claimed Status System**: Characters can now be "claimed" by supernatural forces while retaining their original heritage
  - Added support for Gorgon and Fomori claimed status for human subfactions
  - Characters can be Former Sorcerer/Ghoul/Gifted Kinfolk/Commoner claimed by Gorgon or Fomori
- **Dual Heritage Character Creation**:
  - Primary subfaction selection (Sorcerer, Ghoul, Gifted Kinfolk, Commoner)
  - Optional claimed status selection (Gorgon or Fomori) appears after subfaction selection
  - Fomori tree selection for claimed Fomori characters
- **Enhanced Power Access**:
  - Claimed characters gain access to both original subfaction powers and claimed supernatural powers
  - All powers from both heritage sources cost innate XP rates (3/6/9) instead of learned rates (6/12/18)
  - Separate power display sections for original powers and claimed status powers
- **Automatic Features**:
  - Gorgon claimed characters automatically receive the "Frail" fundamental power
  - Enhanced character validation for dual heritage combinations
  - Character review displays both original subfaction and claimed status information

### Changed
- **Character Creation Flow**: Streamlined UI flow where players select primary subfaction first, then optionally add claimed status
- **XP Cost Calculations**: Updated to treat claimed status powers as innate for dual heritage characters
- **Character Data Structure**: Extended character object to support `claimedStatus`, `selectedFomoriTree`, and `claimedInnateTreeIds` fields

### Technical
- Updated `createBlankCharacter()` function with new claimed status fields
- Enhanced `calculateXPCost()` function to handle dual heritage XP calculations
- Added claimed status validation logic to character creation process
- Implemented claimed status power display in Powers tab
- Added claimed status summary to character creation review section

## [v0.1.1] - Previous Release
### Added
- Initial character builder functionality
- Faction and subfaction selection
- Power tree management
- XP cost calculations
- Character persistence with localStorage

## [v0.1.0] - Initial Release
### Added
- Basic Shadow Accord character creation system
- Support for multiple factions (Human, Wraith, etc.)
- Power selection and management
- Character statistics tracking
