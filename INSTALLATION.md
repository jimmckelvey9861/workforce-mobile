# WorkForce Mobile - Installation & Setup Guide

## 🎉 Project Successfully Created!

Your WorkForce Mobile project has been scaffolded at:
```
/Users/jim/source/workforce_mobile
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** (comes with Node.js)
- **Git** (for version control)

### For iOS Development (Mac only)
- **Xcode** 14+ from App Store
- **CocoaPods** (`sudo gem install cocoapods`)

### For Android Development
- **Android Studio** ([Download](https://developer.android.com/studio))
- **Java Development Kit (JDK)** 11 or higher

### Recommended
- **Expo CLI** (`npm install -g expo-cli`)
- **VS Code** with TypeScript extension
- **React Native Debugger** ([Download](https://github.com/jhen0409/react-native-debugger))

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Navigate to Project
```bash
cd /Users/jim/source/workforce_mobile
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- React Native 0.73.2
- Expo ~50.0.0
- React Navigation 6.x
- Zustand 4.4.7
- Expo SQLite 13.0.0
- TypeScript 5.3.3
- And all other dependencies

**Expected time**: 2-3 minutes

### Step 3: Start Development Server
```bash
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Show a QR code for mobile testing

**Expected output**:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
```

### Step 4: Run on Device/Simulator

#### Option A: Physical Device (Easiest)
1. Install **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in terminal
3. App will load on your device

#### Option B: iOS Simulator (Mac only)
```bash
npm run ios
```

#### Option C: Android Emulator
```bash
npm run android
```

---

## 📱 Testing the Core Architecture

### Verify Installation

After the app loads, you should see:
- ✅ Login screen (placeholder)
- ✅ No errors in terminal
- ✅ TypeScript compilation successful

### Test Navigation
1. App starts on Auth screen (no user logged in)
2. Navigation structure is in place
3. Tab navigators ready for Employee/Manager roles

### Test Compliance Store
Open React Native Debugger and run:
```javascript
// In console
import { useComplianceStore } from './src/store/complianceStore';
const store = useComplianceStore.getState();
console.log('App Mode:', store.appMode); // Should be 'PASSIVE'
```

---

## 🔧 Development Workflow

### File Watching
The development server automatically reloads when you save files:
- **Fast Refresh**: Preserves component state
- **Full Reload**: Press `r` in terminal

### TypeScript Type Checking
```bash
# Run in separate terminal
npm run type-check

# Watch mode
npm run type-check -- --watch
```

### Linting
```bash
npm run lint
```

### Clear Cache (if issues)
```bash
npm start -- --clear
```

---

## 📂 Project Structure Overview

```
workforce_mobile/
├── App.tsx                 ← Entry point
├── src/
│   ├── types/             ← TypeScript interfaces
│   ├── store/             ← Zustand state management
│   ├── services/          ← Business logic
│   ├── navigation/        ← React Navigation
│   ├── components/        ← Reusable components
│   └── screens/           ← Screen components
├── package.json           ← Dependencies
└── tsconfig.json          ← TypeScript config
```

---

## 🎯 Next Development Steps

### 1. Implement Native Monotonic Time Module (Critical)

**File**: `src/services/TimeTruthService.ts`

The current implementation uses `performance.now()` which is NOT production-ready.

#### iOS Module
Create: `ios/MonotonicTime.swift`
```swift
@objc(MonotonicTime)
class MonotonicTime: NSObject {
  @objc
  func getUptime(_ resolve: RCTPromiseResolveBlock, 
                 rejecter reject: RCTPromiseRejectBlock) {
    let uptime = ProcessInfo.processInfo.systemUptime
    resolve(uptime * 1000)
  }
}
```

#### Android Module
Create: `android/app/src/main/java/com/workforce/mobile/MonotonicTimeModule.kt`
```kotlin
class MonotonicTimeModule(reactContext: ReactApplicationContext) : 
  ReactContextBaseJavaModule(reactContext) {
  
  override fun getName() = "MonotonicTime"
  
  @ReactMethod
  fun getUptime(promise: Promise) {
    val uptime = SystemClock.elapsedRealtime()
    promise.resolve(uptime.toDouble())
  }
}
```

### 2. Build Employee Dashboard

**File**: `src/screens/employee/Dashboard.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useComplianceStore } from '../../store/complianceStore';

export const Dashboard = () => {
  const { startTunnel, appMode } = useComplianceStore();
  
  const handleStartTask = async () => {
    const mockTask = {
      id: '1',
      name: 'Customer Survey',
      description: 'Complete customer satisfaction survey',
      type: 'SURVEY',
      payRate: 50, // 50 cents per minute
      maxDuration: 30,
      estimatedDuration: 15,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await startTunnel(mockTask, 'user-123');
  };
  
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Employee Dashboard
      </Text>
      
      {appMode === 'PASSIVE' && (
        <TouchableOpacity 
          onPress={handleStartTask}
          style={{ 
            backgroundColor: '#10b981', 
            padding: 16, 
            borderRadius: 8,
            marginTop: 20 
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Start Test Task
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### 3. Implement Authentication

**Create**: `src/services/AuthService.ts`

```typescript
import * as SecureStore from 'expo-secure-store';

export class AuthService {
  static async login(email: string, password: string) {
    // TODO: Call your backend API
    const response = await fetch('YOUR_API/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const { token, user } = await response.json();
    
    // Store token securely
    await SecureStore.setItemAsync('auth_token', token);
    
    return user;
  }
  
  static async logout() {
    await SecureStore.deleteItemAsync('auth_token');
  }
  
  static async getToken() {
    return await SecureStore.getItemAsync('auth_token');
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'zustand'"
**Solution**:
```bash
rm -rf node_modules
npm install
```

### Issue: Expo won't start
**Solution**:
```bash
npm start -- --clear
# or
expo start -c
```

### Issue: TypeScript errors
**Solution**:
```bash
npm run type-check
# Check tsconfig.json settings
```

### Issue: iOS build fails
**Solution**:
```bash
cd ios
pod install
cd ..
npm run ios
```

### Issue: Android build fails
**Solution**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Issue: SQLite not working
**Solution**:
- Ensure `expo-sqlite` is in dependencies
- Run `npm install`
- Rebuild app

---

## 📊 Verify Installation Checklist

Run these commands to verify everything is set up correctly:

```bash
# 1. Check Node version
node --version  # Should be 18.x or higher

# 2. Check npm version
npm --version   # Should be 9.x or higher

# 3. Verify TypeScript compilation
npm run type-check  # Should show no errors

# 4. Check project structure
ls -la src/  # Should show types, store, services, etc.

# 5. Verify dependencies
npm list zustand react-navigation  # Should show installed versions
```

**Expected Results**:
- ✅ Node.js 18+
- ✅ No TypeScript errors
- ✅ All directories present
- ✅ Dependencies installed

---

## 🎓 Learning Resources

### React Native
- [Official Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)

### Navigation
- [React Navigation](https://reactnavigation.org/)

### State Management
- [Zustand Docs](https://docs.pmnd.rs/zustand)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### SQLite
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

---

## 📞 Support

### Documentation
1. **README.md** - Project overview
2. **ARCHITECTURE.md** - Technical details
3. **QUICKSTART.md** - Development guide
4. **PROJECT_SUMMARY.md** - Complete summary

### Common Commands
```bash
npm start           # Start dev server
npm run ios         # Run on iOS
npm run android     # Run on Android
npm run type-check  # Check TypeScript
npm run lint        # Run ESLint
```

---

## ✅ Installation Complete!

You're now ready to build WorkForce Mobile! 🚀

**Next Steps**:
1. Run `npm install`
2. Run `npm start`
3. Test on device or simulator
4. Start implementing screens

**Happy Coding!** 💻

---

**Last Updated**: December 12, 2024  
**Version**: 1.0.0  
**Status**: Ready for Development
