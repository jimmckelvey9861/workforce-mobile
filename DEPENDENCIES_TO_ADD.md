# Dependencies to Add

## Required Packages for Anti-Spoofing Implementation

### 1. react-native-device-info
**Version**: ^10.11.0  
**Purpose**: Provides access to system uptime (monotonic time)

```bash
npx expo install react-native-device-info
```

**Or manually add to package.json:**
```json
{
  "dependencies": {
    "react-native-device-info": "^10.11.0"
  }
}
```

### 2. expo-crypto
**Version**: ~12.8.0 (compatible with Expo SDK 50)  
**Purpose**: Provides SHA-256 hashing for cryptographic signing

```bash
npx expo install expo-crypto
```

**Or manually add to package.json:**
```json
{
  "dependencies": {
    "expo-crypto": "~12.8.0"
  }
}
```

## Complete Dependencies Section

Add these to your existing `package.json` dependencies:

```json
{
  "dependencies": {
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "expo": "~50.0.0",
    "expo-application": "~5.8.0",
    "expo-crypto": "~12.8.0",
    "expo-device": "~5.9.0",
    "expo-sqlite": "~13.0.0",
    "expo-status-bar": "~1.11.1",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "react-native-device-info": "^10.11.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "uuid": "^9.0.1",
    "zustand": "^4.4.7"
  }
}
```

## Installation via Corporate Network

If you encounter network issues with `npx expo install`, try:

### Option 1: Direct npm install
```bash
npm install react-native-device-info@^10.11.0 expo-crypto@~12.8.0
```

### Option 2: Manual package.json edit + npm install
1. Edit `package.json` to add the dependencies
2. Run `npm install`

### Option 3: Contact IT for registry access
If the corporate firewall is blocking npm registry access, you may need to:
- Request access to `registry.npmjs.org` for these specific packages
- Or request that these packages be mirrored in your corporate Artifactory

## After Installation

### 1. Verify Installation
```bash
npm list react-native-device-info expo-crypto
```

Expected output:
```
workforce_mobile@1.0.0 /Users/jim/source/workforce_mobile
├── expo-crypto@12.8.0
└── react-native-device-info@10.11.0
```

### 2. Create Development Build
Since `react-native-device-info` requires native modules, you cannot test with Expo Go. You must create a Development Build:

```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to Expo account
eas login

# Configure the project for EAS Build
eas build:configure

# Create a development build for iOS
eas build --profile development --platform ios

# Or for Android
eas build --profile development --platform android
```

### 3. Install Development Build on Device
After the build completes:
- Download the build from the EAS dashboard
- Install it on your physical device
- Launch the app

### 4. Test the Implementation
1. The app will launch directly into the TruthTestScreen
2. Observe the live timers
3. Click "Simulate Clock In"
4. Change device date/time in Settings
5. Return to app and verify monotonic time continues linearly

## Troubleshooting

### Error: "Unable to resolve module 'react-native-device-info'"
- Run `npm install` to ensure packages are installed
- Clear cache: `npm start -- --clear`
- Restart Metro bundler

### Error: "Native module cannot be null"
- You're trying to run in Expo Go (not supported)
- You must create and install a Development Build
- Follow the "Create Development Build" steps above

### Error: "getSystemUptime is not a function"
- Verify the package is installed correctly
- Check that you're running the Development Build
- Try rebuilding: `eas build --profile development --platform [ios|android]`

### Network/Registry Errors
- Check your npm registry: `npm config get registry`
- If using corporate registry, ensure it proxies to npmjs.org
- Contact IT if packages are blocked

## Alternative: Local Development Without Dependencies

If you cannot install the dependencies immediately, the code will fall back to `performance.now()` which is NOT secure but allows development to continue. Look for this warning in the console:

```
[TimeTruthService] Using performance.now() fallback - NOT SECURE
```

This fallback is only for development and MUST NOT be used in production.

## Next Steps After Installation

1. ✅ Verify both packages are installed
2. ✅ Create Development Build
3. ✅ Install on physical device
4. ✅ Test TruthTestScreen functionality
5. ✅ Test time manipulation scenarios
6. ✅ Verify signatures validate correctly
7. ✅ Change `AuthStack` initialRoute back to `Login`
8. ✅ Move `SECRET_SALT` to environment variables
9. ✅ Implement server-side validation

## Questions?

Refer to:
- `ANTI_SPOOFING_IMPLEMENTATION.md` for complete documentation
- [Expo Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [react-native-device-info Documentation](https://github.com/react-native-device-info/react-native-device-info)
- [expo-crypto Documentation](https://docs.expo.dev/versions/latest/sdk/crypto/)
