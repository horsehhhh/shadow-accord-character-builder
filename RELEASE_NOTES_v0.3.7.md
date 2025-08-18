# Shadow Accord Character Builder v0.3.7

## 🔐 Version Control & Instant Login Fix
**August 17, 2025**

We're excited to release **version 0.3.7** with two major improvements that enhance the cloud experience and fix a persistent login issue.

### 🚀 Major Fixes
- **✅ Instant Character Loading** - Fixed the annoying bug where logging in would show "0 characters" until you refreshed the page
- **⚡ Immediate Cloud Sync** - Characters now appear instantly after successful authentication
- **� Enhanced Login Flow** - Completely rebuilt the authentication process for reliability

### 🔐 New: Version Control System
- **🚫 Old Version Protection** - Apps older than v0.3.7 are automatically blocked from cloud features to prevent compatibility issues
- **📡 Smart Version Checking** - All API requests include version headers for server-side validation
- **🛡️ Graceful Degradation** - Incompatible versions automatically switch to offline-only mode with full localStorage functionality
- **⚠️ Clear Error Messages** - Users get helpful prompts to update when their version is too old

### 🔧 Technical Improvements
- Centralized version management system
- Enhanced debugging and error logging
- Improved loading states during authentication
- Better error handling for network issues
- Dual callback authentication flow for immediate data refresh

### 📱 Download Options
- **Android APK**: Download from GitHub Actions artifacts (building automatically)
- **Windows Desktop**: Available as portable .exe in releases section
- **Web App**: Auto-updated at shadowaccordcharacterbuilder.up.railway.app

### 📋 Compatibility Note
*Users on versions 0.3.6 and below will automatically be switched to offline-only mode to prevent data conflicts. All character data remains safe in localStorage.*

This release ensures a smoother, more reliable experience for all users while protecting data integrity across different app versions.
