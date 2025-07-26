import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Helper function to load PDF files (works in web, Electron, and Capacitor)
export const loadPdfFile = async (filename) => {
  try {
    // Check if we're running in Electron
    if (window.electronAPI && window.electronAPI.isElectron) {
      console.log(`Loading PDF via Electron IPC: ${filename}`);
      const arrayBuffer = await window.electronAPI.loadPdfFile(filename);
      console.log(`Successfully loaded PDF via Electron: ${filename}`);
      return arrayBuffer;
    } 
    // Check if we're running in Capacitor (mobile)
    else if (Capacitor.isNativePlatform()) {
      console.log(`Loading PDF via Capacitor: ${filename}`);
      try {
        const result = await Filesystem.readFile({
          path: `public/${filename}`,
          directory: Directory.Cache
        });
        // Convert base64 to ArrayBuffer
        const base64Data = result.data;
        const binaryString = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }
        console.log(`Successfully loaded PDF via Capacitor: ${filename}`);
        return arrayBuffer;
      } catch (capacitorError) {
        // Fallback to web fetch for Capacitor if file not found in cache
        console.log(`Capacitor file read failed, falling back to web fetch: ${filename}`);
        const response = await fetch(`/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log(`Successfully loaded PDF via web fetch fallback: ${filename}`);
        return arrayBuffer;
      }
    } 
    else {
      // Fallback to web fetch
      console.log(`Loading PDF via web fetch: ${filename}`);
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Successfully loaded PDF via web fetch: ${filename}`);
      return arrayBuffer;
    }
  } catch (error) {
    console.error(`Error loading PDF file ${filename}:`, error);
    throw error;
  }
};

// Helper function to download files (works in web, Electron, and Capacitor)
export const downloadFile = async (data, filename, mimeType = 'application/octet-stream') => {
  try {
    // Check if we're running in Capacitor (mobile)
    if (Capacitor.isNativePlatform()) {
      console.log(`Downloading file via Capacitor: ${filename}`);
      
      let base64Data;
      if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        // Convert ArrayBuffer/Uint8Array to base64
        const uint8Array = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        base64Data = btoa(binaryString);
      } else if (typeof data === 'string') {
        // Convert string to base64
        base64Data = btoa(data);
      } else {
        throw new Error('Unsupported data type for Capacitor download');
      }
      
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents
      });
      
      alert(`File saved to Documents folder: ${filename}`);
      console.log(`Successfully saved file via Capacitor: ${filename}`);
    } else {
      // Fallback to web/Electron download using blob
      console.log(`Downloading file via web/Electron: ${filename}`);
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log(`Successfully downloaded file: ${filename}`);
    }
  } catch (error) {
    console.error(`Error downloading file ${filename}:`, error);
    throw error;
  }
};