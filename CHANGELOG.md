# Changelog

All notable changes to the Shadow Accord Character Builder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
