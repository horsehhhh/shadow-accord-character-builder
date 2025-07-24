const electronInstaller = require('electron-winstaller');
const path = require('path');

async function buildInstaller() {
  try {
    console.log('Creating single executable installer...');
    
    await electronInstaller.createWindowsInstaller({
      appDirectory: path.join(__dirname, 'dist', 'ShadowAccord-CharacterBuilder-win32-x64'),
      outputDirectory: path.join(__dirname, 'dist', 'installer'),
      authors: 'Shadow Accord Team',
      exe: 'ShadowAccord-CharacterBuilder.exe',
      description: 'Shadow Accord Character Builder',
      version: '0.1.6',
      title: 'Shadow Accord Character Builder',
      name: 'ShadowAccordCharacterBuilder',
      setupExe: 'ShadowAccord-CharacterBuilder-Setup.exe',
      noMsi: true,
      skipUpdateIcon: true,
      setupIcon: path.join(__dirname, 'public', 'favicon.ico')
    });

    console.log('Single executable created successfully!');
    console.log('Location: dist/installer/ShadowAccord-CharacterBuilder-Setup.exe');
  } catch (e) {
    console.error('Build failed:', e);
  }
}

buildInstaller();