# Shadow Accord Character Builder - Distribution Guide

## How to Share Your App

Your Shadow Accord character builder app has been built and is ready to share! Here are your options:

## Option 1: Share as Web Files (Easiest for Users)

### What to Send:
1. Zip the entire `build` folder
2. Include this instruction file

### For Users to Run:
1. Extract the zip file anywhere on their computer
2. Open the `index.html` file in any modern web browser (Chrome, Firefox, Edge, Safari)
3. The app will run locally in their browser - no internet required!

### Pros:
- Works on any device with a web browser
- No installation required
- Runs offline
- Works on Windows, Mac, Linux, mobile devices

## Option 2: Create a Desktop App (Advanced)

You can convert this to a desktop app using Electron:

```bash
npm install -g electron-builder
npm install electron --save-dev
```

## Option 3: Deploy Online (Free Options)

### GitHub Pages (Free):
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Share the URL

### Netlify (Free):
1. Drag and drop the `build` folder to netlify.com
2. Get a free URL to share

### Vercel (Free):
1. Connect your GitHub repository to vercel.com
2. Automatic deployment on updates

## What's Included

Your app includes:
- ✅ Complete character creation system
- ✅ XP tracking and management
- ✅ All factions: Vampire, Shifter, Human, Wraith
- ✅ Full power tree system
- ✅ Skills and merits
- ✅ Character import/export
- ✅ Printable character sheets
- ✅ Offline functionality

## File Size

The complete app is approximately 85 KB compressed - very lightweight!

## Browser Requirements

- Any modern web browser (2019 or newer)
- JavaScript enabled
- Local storage support (for saving characters)

## Troubleshooting

If users have issues:
1. Make sure they're opening `index.html` directly
2. Try a different browser
3. Check that JavaScript is enabled
4. Some browsers may block local files - try Firefox or Chrome

## Updates

To update the app:
1. Make changes to your source code
2. Run `npm run build` again
3. Send the new `build` folder

---

**Created with React and ❤️ for the Shadow Accord community**
