# WorkForce Mobile - Anti-Spoofing Implementation

## Overview

This document describes the anti-spoofing mechanism implemented in WorkForce Mobile to prevent time manipulation by employees. The system uses **monotonic time** (system uptime) combined with **cryptographic signing** to ensure time entries cannot be falsified.

## Security Model

### The Problem
- Employees can change their device's date/time settings to falsify clock-in/out times
- Wall-clock time (`Date.now()`) is easily manipulated
- Simple timestamp validation on the server is insufficient

### The Solution
1. **Monotonic Time**: Use system uptime (time since device boot) which cannot be manipulated without rooting
2. **Dual Timestamps**: Capture both wall-clock time (for display) and monotonic time (for verification)
3. **Cryptographic Signing**: Sign all time captures with SHA-256 to prevent tampering
4. **Offline Queue**: Store signed captures securely in SQLite for later sync

## Architecture

### Components

#### 1. TimeTruthService (`src/services/TimeTruthService.ts`)
The core service responsible for capturing and validating time entries.

**Key Methods:**
- `captureCurrentTime(eventType)`: Captures both wall-clock and monotonic time, signs the payload
- `validateIntegrity(signedCapture)`: Validates the cryptographic signature
- `getMonotonicTimeInfo()`: Gets current system uptime

**Data Structure:**
```typescript
interface SignedTimeCapture {
  payload: {
    userTime: number;        // Wall-clock time (Date.now())
    monotonicTime: number;   // System uptime in milliseconds
    eventType: TimeEventType;
    deviceId: string;
    timestamp: string;       // ISO 8601 for human readability
  };
  signature: string;         // SHA-256 hash
}
```

#### 2. OfflineQueueService (`src/services/OfflineQueueService.ts`)
Manages offline storage of signed time captures in SQLite.

**Key Features:**
- Stores monotonic timestamp and signature in dedicated columns
- Supports priority-based queue processing
- Handles retry logic with exponential backoff
- Provides migration support for existing databases

**Database Schema:**
```sql
CREATE TABLE offline_queue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  last_attempt TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  monotonic_timestamp REAL,    -- NEW: System uptime
  signature TEXT                -- NEW: SHA-256 signature
);
```

#### 3. TruthTestScreen (`src/screens/dev/TruthTestScreen.tsx`)
Developer screen for testing the anti-spoofing mechanism.

**Features:**
- Live display of wall-clock time and monotonic uptime
- "Simulate Clock In" button to capture signed time entries
- Display of captured data including signatures
- Variance calculation between captures

## Dependencies

### Required Packages

#### 1. react-native-device-info
Provides access to native device information, including system uptime.

```bash
npx expo install react-native-device-info
```

**What it provides:**
- `getSystemUptime()`: Returns seconds since device boot (iOS/Android)
- Cannot be manipulated without rooting the device
- Works across app restarts

#### 2. expo-crypto
Provides cryptographic functions for signing payloads.

```bash
npx expo install expo-crypto
```

**What it provides:**
- `digestStringAsync()`: SHA-256 hashing
- Secure random number generation
- Standard cryptographic algorithms

### Installation Instructions

Due to corporate network restrictions, you may need to install these packages manually:

1. **Add to package.json:**
```json
{
  "dependencies": {
    "react-native-device-info": "^10.11.0",
    "expo-crypto": "~12.8.0"
  }
}
```

2. **Install via corporate npm registry:**
```bash
npm install
```

3. **Create Development Build:**
Since `react-native-device-info` requires native modules, you'll need to create an Expo Development Build (CNG):

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Testing the Implementation

### Step 1: Launch the Truth Test Screen

The app is currently configured to launch directly into the TruthTestScreen for testing purposes.

```typescript
// src/navigation/AuthStack.tsx
initialRouteName="TruthTest"
```

### Step 2: Observe Normal Behavior

1. Launch the app
2. Observe both timers updating:
   - **Wall Clock**: Shows current date/time
   - **Monotonic Uptime**: Shows time since device boot
3. Click "Simulate Clock In"
4. Observe the captured data with signature

### Step 3: Test Time Manipulation

1. Go to device Settings
2. Change the date/time (e.g., set it to tomorrow)
3. Return to the app
4. **Expected Results:**
   - Wall clock shows the new (fake) time
   - Monotonic uptime continues counting linearly
   - The variance between wall clock and monotonic time is detected

### Step 4: Verify Signature Validation

1. Capture multiple time entries
2. Check that each has a unique signature
3. Verify that signatures validate correctly
4. (Advanced) Try to tamper with the payload and observe validation failure

## Server-Side Validation

**CRITICAL**: Client-side signing alone is NOT sufficient. The server MUST:

### 1. Validate Signatures
```typescript
// Pseudo-code for server validation
function validateSignature(capture: SignedTimeCapture): boolean {
  const expectedSignature = sha256(
    JSON.stringify(capture.payload) + SECRET_SALT
  );
  return expectedSignature === capture.signature;
}
```

### 2. Check Monotonic Time Consistency
```typescript
// Server should maintain a registry of device boot times
function validateMonotonicTime(
  deviceId: string,
  monotonicTime: number,
  wallClockTime: number
): boolean {
  const deviceBootTime = wallClockTime - monotonicTime;
  
  // Check if boot time is consistent with previous entries
  const previousBootTime = getDeviceBootTime(deviceId);
  
  if (previousBootTime) {
    // Allow small variance (device reboot detection)
    const variance = Math.abs(deviceBootTime - previousBootTime);
    if (variance > 1000) { // 1 second tolerance
      // Device was rebooted OR time was manipulated
      return checkIfRebootIsLegitimate(deviceId, deviceBootTime);
    }
  }
  
  return true;
}
```

### 3. Flag Suspicious Patterns
- Multiple clock-ins without clock-outs
- Clock-ins from the future
- Impossible time sequences
- Frequent device reboots
- Large variances between wall-clock and monotonic time

### 4. Maintain Device Boot Time Registry
```sql
CREATE TABLE device_boot_times (
  device_id TEXT PRIMARY KEY,
  boot_time TIMESTAMP NOT NULL,
  last_seen TIMESTAMP NOT NULL,
  reboot_count INTEGER DEFAULT 0
);
```

## Security Considerations

### 1. Secret Salt Management
The `SECRET_SALT` constant should be:
- Stored in environment variables (not in code)
- Different per deployment environment
- Rotated periodically
- Never committed to version control

**Example with environment variables:**
```typescript
const SECRET_SALT = process.env.WORKFORCE_SECRET_SALT || 'fallback-dev-salt';
```

### 2. Rooted/Jailbroken Devices
The monotonic time can be manipulated on rooted/jailbroken devices. Consider:
- Using device integrity checks (e.g., Google SafetyNet, Apple DeviceCheck)
- Flagging rooted devices for manual review
- Requiring additional verification for high-risk actions

### 3. Man-in-the-Middle Attacks
Implement certificate pinning to prevent MITM attacks:
```typescript
// Example with expo-secure-store
import * as SecureStore from 'expo-secure-store';

// Pin your server's certificate
const CERTIFICATE_PINS = {
  'api.workforce.com': ['sha256/AAAAAAAAAA...'],
};
```

### 4. Replay Attacks
Add nonce/timestamp validation on the server:
```typescript
interface SignedTimeCapture {
  payload: {
    // ... existing fields
    nonce: string;           // Random value
    captureTimestamp: number; // Server validates this is recent
  };
  signature: string;
}
```

## Production Checklist

- [ ] Install `react-native-device-info` and `expo-crypto`
- [ ] Create Expo Development Build (CNG)
- [ ] Test on physical devices (iOS and Android)
- [ ] Move `SECRET_SALT` to environment variables
- [ ] Implement server-side signature validation
- [ ] Implement server-side monotonic time validation
- [ ] Set up device boot time registry
- [ ] Implement device integrity checks
- [ ] Add certificate pinning
- [ ] Add nonce/replay attack prevention
- [ ] Set up monitoring and alerting for suspicious patterns
- [ ] Update privacy policy to disclose time tracking mechanism
- [ ] Change `AuthStack` initial route back to `Login`

## Troubleshooting

### "Unable to get monotonic time" Error
- Ensure `react-native-device-info` is installed
- Verify you're running on a Development Build (not Expo Go)
- Check that native modules are linked correctly

### Signature Validation Fails
- Verify the `SECRET_SALT` is consistent
- Check that the payload hasn't been modified
- Ensure JSON.stringify produces consistent output

### Monotonic Time Resets
- This is normal after device reboot
- Server should detect and handle reboots gracefully
- Consider storing last known boot time locally

### Large Variance Between Times
- Small variances (< 5%) are normal due to async operations
- Large variances indicate time manipulation or device issues
- Server should flag these for review

## Future Enhancements

1. **Biometric Verification**: Require fingerprint/face ID for clock-in
2. **Geofencing**: Validate that clock-in occurs at approved locations
3. **Photo Capture**: Take a photo during clock-in for verification
4. **Bluetooth Beacons**: Verify presence at physical location
5. **Machine Learning**: Detect anomalous patterns in time entries
6. **Blockchain**: Store time entries in an immutable ledger

## References

- [React Native Device Info](https://github.com/react-native-device-info/react-native-device-info)
- [Expo Crypto](https://docs.expo.dev/versions/latest/sdk/crypto/)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [iOS System Uptime](https://developer.apple.com/documentation/foundation/processinfo/1414553-systemuptime)
- [Android System Uptime](https://developer.android.com/reference/android/os/SystemClock#elapsedRealtime())

## Support

For questions or issues, contact the development team or refer to the project documentation.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Development
