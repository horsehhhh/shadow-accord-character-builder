const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  loadPdfFile: (filename) => ipcRenderer.invoke('load-pdf-file', filename),
  
  // Utility to check if we're running in Electron
  isElectron: true
});