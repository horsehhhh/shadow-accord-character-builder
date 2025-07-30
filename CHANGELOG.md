# Changelog

All notable changes to the Shadow Accord Character Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
