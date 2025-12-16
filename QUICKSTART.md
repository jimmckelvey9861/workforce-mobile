# WorkForce Mobile - Quick Start Guide

## ✅ Project Successfully Scaffolded!

The core architectural foundation for WorkForce Mobile has been created at:
```
/Users/jim/source/workforce_mobile
```

## 📦 What Was Created

### Core Architecture Files (✅ Complete)

#### 1. Type Definitions
- `src/types/index.ts` - Complete TypeScript interfaces for all data models
  - User, Shift, TimeEntry, RemoteTask
  - QueuedAction, Transaction, PayStub
  - AppMode, AppSession, ApiResponse

#### 2. State Management
- `src/store/complianceStore.ts` - Zustand store for pay state
  - ✅ `startTunnel()` - Begin paid session
  - ✅ `endTunnel()` - End session and save
  - ✅ `pauseSession()` - Handle app backgrounding
  - ✅ `resumeSession()` - Resume from background
  - ✅ `updateEarnings()` - Real-time earnings calculation

#### 3. Services Layer
- `src/services/TimeTruthService.ts` - Time event capture with anti-spoofing
  - ✅ `captureTimeEvent()` - Dual timestamp capture
  - ✅ `validateTimeEntry()` - Compliance validation
  - ✅ Queue management integration
  - ⚠️ **TODO**: Replace with native module for production

- `src/services/OfflineQueueService.ts` - SQLite-based offline queue
  - ✅ `enqueue()` - Add actions to queue
  - ✅ `update()` - Modify queued actions
  - ✅ `remove()` - Delete after sync
  - ✅ Priority-based processing

#### 4. UI Components
- `src/components/tunnel/ActiveTaskTunnel.tsx` - Compliance tunnel overlay
  - ✅ Full-screen modal when active
  - ✅ Hardware back button blocking
  - ✅ Persistent earnings timer
  - ✅ Pause overlay on background
  - ✅ AppState monitoring

#### 5. Navigation
- `src/navigation/RootNavigator.tsx` - Main router
- `src/navigation/AuthStack.tsx` - Login/Register flow
- `src/navigation/EmployeeTabNavigator.tsx` - Employee tabs
  - Dashboard, Schedule, Wallet
- `src/navigation/ManagerTabNavigator.tsx` - Manager tabs
  - TriageDashboard, Roster, PanicButton

#### 6. Entry Point
- `App.tsx` - Root component with AppState monitoring

#### 7. Configuration
- `package.json` - All dependencies defined
- `tsconfig.json` - Strict TypeScript configuration
- `app.json` - Expo configuration
- `.gitignore` - Standard React Native ignores

#### 8. Documentation
- `README.md` - Project overview and getting started
- `ARCHITECTURE.md` - Detailed architecture documentation
- `QUICKSTART.md` - This file!

## 🚀 Next Steps

### 1. Install Dependencies

```bash
cd /Users/jim/source/workforce_mobile
npm install
```

### 2. Start Development Server

```bash
npm start
```

This will open Expo DevTools. From there you can:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your phone

### 3. Critical Implementation Tasks

#### Priority 1: Native Monotonic Time Module
**Location**: `src/services/TimeTruthService.ts`

The current implementation uses `performance.now()` which is NOT suitable for production.

**iOS Module** (create `ios/MonotonicTime.swift`):
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

**Android Module** (create `android/app/src/main/java/com/workforce/mobile/MonotonicTimeModule.kt`):
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

#### Priority 2: Authentication Service
**Create**: `src/services/AuthService.ts`

Implement:
- Login with JWT tokens
- Token storage (SecureStore)
- Token refresh logic
- Logout

#### Priority 3: Sync Service
**Create**: `src/services/SyncService.ts`

Implement:
- Process offline queue
- Retry with exponential backoff
- Network connectivity monitoring
- Conflict resolution

#### Priority 4: Screen Implementations
**Directories**: `src/screens/employee/` and `src/screens/manager/`

Build out:
- Employee Dashboard (clock in/out, active tasks)
- Schedule/Marketplace (shift trading)
- Wallet (earnings, pay stubs)
- Manager Triage (pending approvals)
- Roster Management
- Panic Button (emergency alerts)

## 🎯 Testing the Core Architecture

### Test the Compliance Store

Create a test file: `src/store/__tests__/complianceStore.test.ts`

```typescript
import { useComplianceStore } from '../complianceStore';

describe('ComplianceStore', () => {
  it('should start tunnel and set active mode', async () => {
    const store = useComplianceStore.getState();
    
    const mockTask = {
      id: '1',
      name: 'Test Survey',
      payRate: 50, // 50 cents per minute
      maxDuration: 30,
    };
    
    const entry = await store.startTunnel(mockTask, 'user-123');
    
    expect(entry).toBeTruthy();
    expect(store.appMode).toBe('ACTIVE');
    expect(store.activeTask).toEqual(mockTask);
  });
});
```

### Test the Offline Queue

```typescript
import { OfflineQueueService } from '../services/OfflineQueueService';

describe('OfflineQueueService', () => {
  it('should enqueue and retrieve actions', async () => {
    const action = await OfflineQueueService.enqueue({
      type: 'TIME_ENTRY',
      payload: { test: 'data' },
      priority: 10,
      maxAttempts: 5,
    });
    
    const queue = await OfflineQueueService.getQueue();
    expect(queue).toContainEqual(action);
  });
});
```

## 📱 Running on Physical Devices

### iOS (requires Mac)
1. Install Xcode from App Store
2. Run: `npm run ios`

### Android
1. Install Android Studio
2. Set up Android emulator or connect physical device
3. Run: `npm run android`

### Testing on Your Phone
1. Install Expo Go app from App Store/Play Store
2. Run: `npm start`
3. Scan QR code with Expo Go

## 🔍 Verification Checklist

- [ ] All TypeScript files compile without errors
- [ ] `npm run type-check` passes
- [ ] Store actions work (test with console logs)
- [ ] Navigation structure renders
- [ ] ActiveTaskTunnel overlays correctly
- [ ] AppState changes trigger pause/resume
- [ ] SQLite database initializes
- [ ] Offline queue can store/retrieve data

## 📚 Key Concepts to Understand

### 1. Offline-First Architecture
- User actions work immediately (optimistic UI)
- Data queued in SQLite
- Synced when connectivity available
- Conflicts resolved server-side

### 2. Compliance Engine
- Monotonic time prevents spoofing
- Active mode locks navigation
- Backgrounding pauses timer
- All events auditable

### 3. Zustand State Management
```typescript
// Access state
const { appMode, activeTask } = useComplianceStore();

// Call actions
const { startTunnel, endTunnel } = useComplianceStore();

// Use selectors for performance
const isActive = useIsActive(); // Only re-renders when appMode changes
```

### 4. Navigation Flow
```
App starts
  ↓
Check authentication
  ↓
If no user → AuthStack (Login/Register)
  ↓
If user.role === 'EMPLOYEE' → EmployeeTabNavigator
  ↓
If user.role === 'MANAGER' → ManagerTabNavigator
```

## 🐛 Common Issues

### Issue: "Cannot find module 'zustand'"
**Solution**: Run `npm install`

### Issue: Expo won't start
**Solution**: 
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Issue: TypeScript errors
**Solution**: Check `tsconfig.json` and run `npm run type-check`

### Issue: SQLite not working
**Solution**: Ensure `expo-sqlite` is in dependencies and rebuild

## 📖 Additional Resources

- [React Navigation Docs](https://reactnavigation.org/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎉 You're Ready to Build!

The architectural foundation is solid. Now focus on:
1. Implementing the native monotonic time module
2. Building out the screen UIs
3. Connecting to your PostgreSQL backend
4. Testing on real devices

Good luck! 🚀

---

**Created**: December 12, 2024  
**Status**: ✅ Core Architecture Complete  
**Next Milestone**: Native Module Implementation
