# Shadow Accord Character Builder

A comprehensive character creation and management tool for the Shadow Accord RPG system, featuring full rulebook integration, cloud synchronization, and cross-platform support.

## � **[Try it Online!](https://shadowaccordcharacterbuilder.up.railway.app)**

**Live Web Application**: Create and manage your Shadow Accord characters from any device with automatic cloud synchronization!

## ✨ New in v0.3.0: Full-Stack Web Application

### 🚀 **Cloud Features**
- **Web Application**: Fully deployed at [shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app)
- **Cross-Device Sync**: Your characters automatically sync across all your devices
- **Cloud Storage**: Secure MongoDB Atlas database with JWT authentication
- **Offline Support**: Works offline with local storage, syncs when you're back online
- **User Accounts**: Create an account to access your characters from anywhere

### �🎮 Core Features

#### Character Creation & Management
- **All Faction Support**: Vampire, Shifter, Human, Wraith with complete subfaction trees
- **Dual Heritage System**: Claimed status (Gorgon-claimed, Fomori-claimed) with dual power access
- **Faction Change System**: Supernatural transformation (Embrace, First Change, Death, etc.)
- **Complete Subfaction Support**: Clans, tribes, guilds, legions, fellowships, and more
- **Power System**: 166+ powers from the rulebook with accurate XP costs and restrictions
- **Merit System**: Faction-restricted merits with special requirements and benefits
- **XP Tracking**: Complete advancement history with detailed tracking and common activities

#### Advanced Character Systems
- **Wraith Passion System**: Select 2 passions from 6 options during character creation
- **Shadow Archetypes**: 15 different shadow personalities with roleplay guidance
- **Mandatory Requirements**: Automatic derangement/flaw selection for certain subfactions
- **Generation/Rank System**: Vampire generation (6th-13th) and shifter ranks (Cub to Elder)
- **Free Lore System**: Automatic lore assignment based on faction and subfaction choices
- **Skill System**: 13 skills with faction restrictions and special abilities

#### Power Index & Reference Tools
- **Searchable Power Database**: Complete index of all 166+ player powers
- **Advanced Search**: Filter by power name, description, source, type, or cost
- **Power Filtering**: Sort by source (H1, S3, V3, etc.) and type (DAMAGE, MENTAL, etc.)
- **Integrated Reference**: Access power database during character creation and management
- **Real-time Results**: Live search with result counters and sorting options

#### Import/Export & PDF Integration
- **Multiple Export Formats**: JSON, TXT, CSV, and fillable PDF character sheets
- **Cross-Platform PDF**: Works in web browsers, Electron desktop, and Android APK
- **Accurate PDF Mapping**: All character data exports to proper PDF form fields
- **Character Import**: Full character data import with validation and error handling
- **Backup/Restore**: Complete character roster backup and restoration

## 🛠️ Platform Support

### 🌐 **Web Application** (Recommended)
- **Live Site**: [shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app)
- **Cross-Device Sync**: Access your characters from any device
- **No Installation**: Works in any modern web browser
- **Automatic Updates**: Always the latest version
- **Cloud Backup**: Your characters are safely stored in the cloud

### 📱 **Mobile & Cross-Platform**
- **Android APK**: Native Android app with Capacitor integration
- **Responsive Design**: Mobile-optimized interface with touch-friendly controls
- **Android Navigation**: Smooth scroll-to-top functionality for mobile devices
- **Offline Support**: Works without internet connection once loaded
- **PWA Support**: Install as Progressive Web App on any device

### 💻 **Desktop Application**
- **Electron Desktop**: Native desktop application for Windows, Mac, and Linux
- **Local Storage**: Runs entirely offline if preferred
- **PDF Integration**: Native file system access for exports

## 🔧 Technical Features

### Backend Architecture
- **Node.js/Express API**: RESTful backend deployed at [shadowaccordapi.up.railway.app](https://shadowaccordapi.up.railway.app)
- **MongoDB Atlas**: Cloud database with proper indexing and validation
- **JWT Authentication**: Secure token-based authentication with 24-hour sessions
- **bcryptjs Security**: Proper password hashing and salting
- **CORS Configuration**: Cross-origin resource sharing for frontend-backend communication

### Frontend Technology
- **React 19**: Modern React with hooks and functional components
- **Hybrid Storage**: Smart localStorage + cloud storage system
- **Environment Detection**: Automatic API endpoint selection for different platforms
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Dark Theme**: Consistent dark theme throughout the application

### Data Management
- **CSV-Based Game Data**: All rulebook data stored in parseable CSV format
- **Immutable State**: Proper React state management with immutable updates
- **Data Validation**: Both client-side and server-side validation
- **Migration Support**: Automatic data migration for updated character structures
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Getting Started

### 🌐 **Use the Web App** (Easiest)
Just visit **[shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app)** in any web browser!

### 🛠️ **Local Development**

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)

#### Frontend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/horsehhhh/shadow-accord-character-builder.git
   cd shadow-accord-character-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

#### Backend Setup (Optional - for local API development)
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your MongoDB connection string and JWT secret:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

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

## 🌍 Deployment

### Live Application
- **Web App**: [shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app)
- **API Backend**: [shadowaccordapi.up.railway.app](https://shadowaccordapi.up.railway.app)
- **Hosting**: Railway Platform with MongoDB Atlas database
- **Domain**: Custom Railway domain with HTTPS

## 📱 Platform Support

- **Web Browsers**: Chrome, Firefox, Safari, Edge (all modern browsers) ⭐ **Recommended**
- **Progressive Web App**: Install from browser for app-like experience
- **Desktop**: Windows, macOS, Linux (via Electron)
- **Android**: Native APK with full feature support
- **iOS**: Planned support via Capacitor

## 🎯 Key Capabilities

### Cloud Features
- **Cross-Device Sync**: Your characters follow you everywhere
- **Secure Authentication**: JWT-based login with password reset
- **Hybrid Storage**: Works offline, syncs when online
- **Data Safety**: Both local backup and cloud storage
- **Multi-Platform**: Same account works on web, mobile, and desktop

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
- Cloud-based character sharing and backup

## 🌐 Quick Start

**Want to try it right now?** Visit **[shadowaccordcharacterbuilder.up.railway.app](https://shadowaccordcharacterbuilder.up.railway.app)**

1. Create a free account (optional - works without login too!)
2. Start building your Shadow Accord character
3. Access your characters from any device
4. Export to PDF when ready for your game

## 📚 Documentation

- [Distribution Instructions](DISTRIBUTION_INSTRUCTIONS.md) - How to build and distribute the app
- [Changelog](CHANGELOG.md) - Complete version history and feature additions
- [Setup Guide](README.md) - This comprehensive guide

## 🤝 Contributing

This project is actively developed with AI assistance. Bug reports, feature requests, and contributions are welcome!

## ⚖️ Legal Disclaimer

This character builder is an **unofficial fan-made tool** and is not affiliated with, endorsed by, or sponsored by the creators or publishers of Shadow Accord or World of Darkness.

- **Shadow Accord** and all related game content, rules, lore, and intellectual property are owned by their respective creators and publishers
- **World of Darkness**, **Vampire: The Masquerade**, **Werewolf: The Apocalypse**, **Wraith: The Oblivion**, and all related properties are trademarks and copyrights of **Modiphius Entertainment** and/or their licensors
- This application is a **non-commercial fan project** created to enhance the gaming experience for the Shadow Accord community
- All game data, rules, and content used in this application are **property of their respective owners**
- This tool is provided **as-is** for educational and entertainment purposes only
- No claim of ownership is made regarding any copyrighted material used within this application

If you are a rights holder and have concerns about this project, please contact the repository owner for resolution.

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
- **Railway Platform** - Hosting our web application and API
- **MongoDB Atlas** - Cloud database services
- **Anthropic** - AI development assistance that made this project possible

---

**Current Version**: 0.3.0 | **Last Updated**: July 29, 2025

🌐 **[Launch Web App](https://shadowaccordcharacterbuilder.up.railway.app)** | Created with ❤️ for the Shadow Accord Community!

<!-- Build trigger: Cloud sync fixes deployed -->

## ⚖️ Legal Disclaimer

**Shadow Accord Character Builder** is an unofficial, fan-created tool for the Shadow Accord RPG system. This project is not affiliated with, endorsed by, or connected to the creators or publishers of Shadow Accord, World of Darkness, or any related intellectual properties.

- **Shadow Accord** and related game content are the intellectual property of their respective creators
- **World of Darkness** and associated trademarks are owned by Modiphius Entertainment and Paradox Interactive  
- This character builder is created and maintained by fans for the fan community
- No copyright infringement is intended - this tool is provided free of charge for personal, non-commercial use only

All game mechanics, character data, and rulebook references implemented in this application remain the intellectual property of their original creators. This project serves only as a digital tool to assist players in character creation and management.
