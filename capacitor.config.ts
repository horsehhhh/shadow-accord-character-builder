import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowaccord.characterbuilder',
  appName: 'Shadow Accord',
  webDir: 'build',
  server: {
    // Allow external URLs for API calls
    allowNavigation: [
      'https://shadowaccordcharacterbuilder.up.railway.app'
    ]
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    },
    // Allow cleartext traffic for development
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#121212",
      showSpinner: false
    }
  }
};

export default config;
