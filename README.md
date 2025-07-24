WARNING ! 

I don't know what im doing and there is so much duplicate data in here, this thing is held together with string and craft glue as far as im aware. AI is writing almost everything! pls help. there is alot of functionality i want to add in still but this is the baseline i feel comfortable sharing. TY TO MAX, JACOB, AND JOSH for helping.


# Shadow Accord Character Builder

A comprehensive character creation and management tool for the Shadow Accord RPG system.

## Features

- Create and manage characters for all major Shadow Accord factions: Vampire, Shifter, Human, Wraith, and more
- Dual heritage/claimed status system (e.g., Gorgon-claimed Sorcerers, Fomori-claimed Kinfolk)
- Full support for subfactions, clans, tribes, guilds, fellowships, and more
- Power tree selection and advancement with innate/corrupt cost logic
- Mandatory derangement/flaw selection for certain subfactions (e.g., Malkavian, Black Spiral Dancer, Natus, Claimed)
- XP tracking, advancement, and history
- Automatic lore assignment based on faction, subfaction, and claimed status
- Import/export characters (JSON, TXT, CSV, PDF)
- Printable character sheets (fillable PDF export)
- Responsive, mobile-friendly UI
- Offline support (runs as a PWA or desktop app)
- Auto-save and backup/restore functionality

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/shadowaccord/character-builder.git
   cd character-builder
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

### Running the App (Web)

Start the development server:
```sh
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

To build the app for production:
```sh
npm run build
```
The output will be in the `build/` directory.

### Running as a Desktop App (Electron)

1. Build the React app:
   ```sh
   npm run build
   ```
2. Start Electron:
   ```sh
   npm run electron
   ```

## Importing & Exporting Characters

- Use the "Import" and "Export" buttons in the app menu to save/load character data.
- Supported formats: JSON, TXT, CSV, PDF (fillable character sheet).

## Distribution

See [DISTRIBUTION_INSTRUCTIONS.md](DISTRIBUTION_INSTRUCTIONS.md) for details on sharing the app as a web app, desktop app, or online deployment.

## Authors

- **horsehhhh** - Guy with free time
- **Claude** - AI Assistant & Developer

## License

See [LICENSE](LICENSE) for details.

---

Created with ❤️ for the Shadow Accord Community!
