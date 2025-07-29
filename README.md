# Shadow Accord Character Builder

A comprehensive character creation and management tool for the Shadow Accord RPG system, featuring full rulebook integration and cross-platform support.

## 🎮 Core Features

### Character Creation & Management
- **All Faction Support**: Vampire, Shifter, Human, Wraith with complete subfaction trees
- **Dual Heritage System**: Claimed status (Gorgon-claimed, Fomori-claimed) with dual power access
- **Faction Change System**: Supernatural transformation (Embrace, First Change, Death, etc.)
- **Complete Subfaction Support**: Clans, tribes, guilds, legions, fellowships, and more
- **Power System**: 166+ powers from the rulebook with accurate XP costs and restrictions
- **Merit System**: Faction-restricted merits with special requirements and benefits
- **XP Tracking**: Complete advancement history with detailed tracking and common activities

### Advanced Character Systems
- **Wraith Passion System**: Select 2 passions from 6 options during character creation
- **Shadow Archetypes**: 15 different shadow personalities with roleplay guidance
- **Mandatory Requirements**: Automatic derangement/flaw selection for certain subfactions
- **Generation/Rank System**: Vampire generation (6th-13th) and shifter ranks (Cub to Elder)
- **Free Lore System**: Automatic lore assignment based on faction and subfaction choices
- **Skill System**: 13 skills with faction restrictions and special abilities

### Power Index & Reference Tools
- **Searchable Power Database**: Complete index of all 166+ player powers
- **Advanced Search**: Filter by power name, description, source, type, or cost
- **Power Filtering**: Sort by source (H1, S3, V3, etc.) and type (DAMAGE, MENTAL, etc.)
- **Integrated Reference**: Access power database during character creation and management
- **Real-time Results**: Live search with result counters and sorting options

### Import/Export & PDF Integration
- **Multiple Export Formats**: JSON, TXT, CSV, and fillable PDF character sheets
- **Cross-Platform PDF**: Works in web browsers, Electron desktop, and Android APK
- **Accurate PDF Mapping**: All character data exports to proper PDF form fields
- **Character Import**: Full character data import with validation and error handling
- **Backup/Restore**: Complete character roster backup and restoration

### Mobile & Cross-Platform Support
- **Android APK**: Native Android app with Capacitor integration
- **Responsive Design**: Mobile-optimized interface with touch-friendly controls
- **Android Navigation**: Smooth scroll-to-top functionality for mobile devices
- **Offline Support**: Works without internet connection once loaded
- **PWA Support**: Install as Progressive Web App on any device

## 🛠️ Technical Features

### Development & Build System
- **React 19**: Modern React with hooks and functional components
- **Electron Desktop**: Native desktop application for Windows, Mac, and Linux
- **Capacitor Mobile**: Native mobile apps for Android and iOS
- **Dark Theme**: Consistent dark theme throughout the application
- **Auto-save**: Automatic character data persistence with manual backup options
- **Error Handling**: Comprehensive error handling and validation

### Data Management
- **CSV-Based Game Data**: All rulebook data stored in parseable CSV format
- **Immutable State**: Proper React state management with immutable updates
- **Data Validation**: Character creation validation with helpful error messages
- **Migration Support**: Automatic data migration for updated character structures

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/horsehhhh/shadow-accord-character-builder.git
   cd shadow-accord-character-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Web Development Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Desktop App (Electron)
```bash
npm run build
npm run electron
```

#### Production Build
```bash
npm run build
```
The build output will be in the `build/` directory.

#### Android APK
See [DISTRIBUTION_INSTRUCTIONS.md](DISTRIBUTION_INSTRUCTIONS.md) for Android build instructions.

## 📱 Platform Support

- **Web Browsers**: Chrome, Firefox, Safari, Edge (all modern browsers)
- **Desktop**: Windows, macOS, Linux (via Electron)
- **Android**: Native APK with full feature support
- **iOS**: Planned support via Capacitor

## 🎯 Key Capabilities

### Character Creation
- Step-by-step guided character creation
- Real-time validation and helpful error messages
- Faction-specific requirements and restrictions
- Automatic free power and lore assignment
- Preview mode before finalizing characters

### Character Management
- Complete character roster with search and filtering
- Character advancement with XP tracking
- Power learning and advancement
- Merit acquisition and management
- Faction transformation system

### Power & Reference System
- Complete power database with advanced search
- Power cost calculation and XP tracking
- Source material references and descriptions
- Integration with character creation and advancement

### Export & Sharing
- Fillable PDF character sheets for print/digital use
- Multiple export formats for different needs
- Character sharing via JSON import/export
- Backup and restore functionality

## 📚 Documentation

- [Distribution Instructions](DISTRIBUTION_INSTRUCTIONS.md) - How to build and distribute the app
- [Changelog](src/App.js) - Complete version history and feature additions
- [Release Notes](RELEASE_NOTES_v0.2.0.md) - Detailed release information

## 🤝 Contributing

This project is actively developed with AI assistance. Bug reports, feature requests, and contributions are welcome!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **horsehhhh** - Project Creator & Maintainer
- **Claude (Anthropic)** - AI Development Assistant
- **Shadow Accord Community** - Feedback, testing, and rulebook data

## 🙏 Acknowledgments

Special thanks to:
- **Max, Jacob, and Josh** - Early testing and feedback
- **Shadow Accord RPG Community** - Continued support and feature requests
- **Anthropic** - AI development assistance that made this project possible

---

**Current Version**: 0.2.2 | **Last Updated**: July 28, 2025

Created with ❤️ for the Shadow Accord Community!
