// Application version - update this when releasing new versions
export const APP_VERSION = '0.3.8';

// Minimum version required for cloud connectivity
export const MIN_CLOUD_VERSION = '0.3.8';

// Version comparison helper
export const isVersionSupported = (currentVersion, minVersion) => {
  const parseVersion = (version) => {
    return version.split('.').map(num => parseInt(num, 10));
  };
  
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(minVersion);
  
  for (let i = 0; i < Math.max(current.length, minimum.length); i++) {
    const curr = current[i] || 0;
    const min = minimum[i] || 0;
    
    if (curr > min) return true;
    if (curr < min) return false;
  }
  
  return true; // Equal versions are supported
};
