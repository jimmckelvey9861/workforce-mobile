# WorkForce Mobile

An **Offline-First** mobile application for hourly and salary employees of small businesses, featuring a strict **Compliance Engine** for time-tracking.

## 🎯 Unique Value Proposition

### Dual-Mode Operation

- **Passive Mode (Unpaid)**: Users can view schedules and pay stubs
- **Active Mode (Paid)**: Users perform "Remote Tasks" (surveys, training) and are paid by the minute
  - UI "Tunnels" them (locks navigation)
  - Hardware back button disabled
  - App backgrounding pauses the timer

### Compliance Engine

- **Time stamps verified using device monotonic time** to prevent spoofing
- All time events captured with both wall-clock and monotonic time
- Server-side validation against device boot time
- Offline queue for sync when connectivity restored

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript (Strict mode)
- **State Management**: Zustand
- **Navigation**: React Navigation (Native Stack + Bottom Tabs)
- **Local DB**: Expo SQLite (offline queueing)
- **Styling**: React Native StyleSheet

## 📁 Project Structure

```
workforce_mobile/
├── src/
│   ├── types/              # TypeScript interfaces
│   │   └── index.ts        # Core data models
│   ├── store/              # Zustand stores
│   │   └── complianceStore.ts  # Global pay state management
│   ├── services/           # Business logic
│   │   ├── TimeTruthService.ts      # Time event capture
│   │   └── OfflineQueueService.ts   # SQLite queue management
│   ├── navigation/         # Navigation structure
│   │   ├── RootNavigator.tsx        # Main router
│   │   ├── AuthStack.tsx            # Auth flow
│   │   ├── EmployeeTabNavigator.tsx # Employee tabs
│   │   └── ManagerTabNavigator.tsx  # Manager tabs
│   ├── components/         # Reusable components
│   │   └── tunnel/
│   │       └── ActiveTaskTunnel.tsx # Active mode overlay
│   ├── screens/            # Screen components
│   │   ├── employee/       # Employee screens
│   │   └── manager/        # Manager screens
│   └── utils/              # Utility functions
├── App.tsx                 # Entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript config
```

## 🔑 Core Architecture

### 1. Compliance Store (`complianceStore.ts`)

The single source of truth for the app's pay state:

```typescript
- appMode: 'PASSIVE' | 'ACTIVE'
- currentSessionEarnings: number
- activeTask: RemoteTask | null
- isPaused: boolean

Actions:
- startTunnel(task, userId) → Begins paid session
- endTunnel() → Ends session, saves TimeEntry
- pauseSession() → Called on app background
- resumeSession() → Called on app foreground
```

### 2. Time Truth Service (`TimeTruthService.ts`)

**CRITICAL**: The ONLY interface for capturing time events.

```typescript
captureTimeEvent(eventType) → {
  wallClockTime: ISO 8601
  monotonicTime: milliseconds since boot
  deviceBootTime: calculated boot time
  deviceId: unique identifier
}
```

⚠️ **Production Note**: Replace `getMonotonicTime()` with a native module:
- iOS: `ProcessInfo.processInfo.systemUptime`
- Android: `SystemClock.elapsedRealtime()`

### 3. Offline Queue Service (`OfflineQueueService.ts`)

SQLite-based queue for offline actions:

```typescript
- enqueue(action) → Add to queue
- update(id, updates) → Modify queued action
- remove(id) → Delete after sync
- getQueue() → Retrieve pending actions
```

### 4. Active Task Tunnel (`ActiveTaskTunnel.tsx`)

Full-screen modal that enforces compliance during paid tasks:

- ✅ Blocks hardware back button (Android)
- ✅ Hides navigation header
- ✅ Shows persistent earnings timer
- ✅ Displays pause overlay when backgrounded
- ✅ Prevents navigation until task complete

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
cd /Users/jim/source/workforce_mobile
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## 📊 Data Models

### User
```typescript
{
  id: string
  role: 'EMPLOYEE' | 'MANAGER'
  currentBalance: number  // cents
}
```

### TimeEntry
```typescript
{
  id: string
  userId: string
  startTime: string  // ISO 8601
  endTime: string | null
  type: 'STANDARD' | 'REMOTE_TASK'
  monotonicStart: number  // ms since boot
  monotonicEnd: number | null
  isSynced: boolean
}
```

### RemoteTask
```typescript
{
  id: string
  name: string
  payRate: number  // cents per minute
  maxDuration: number  // minutes
}
```

### Shift
```typescript
{
  id: string
  startTime: string
  endTime: string
  isTradeable: boolean
}
```

## 🔐 Security & Compliance

### Time Spoofing Prevention

1. **Monotonic Time Capture**: Device uptime cannot be manipulated without rooting
2. **Dual Timestamp**: Both wall-clock and monotonic time recorded
3. **Server Validation**: Backend validates monotonic time against device boot time
4. **Variance Detection**: Flags discrepancies between wall-clock and monotonic duration

### Offline-First Architecture

- All time events queued in SQLite
- High-priority sync for time entries (priority: 10)
- Exponential backoff for failed syncs
- Automatic retry when connectivity restored

## 🎨 Navigation Structure

```
RootNavigator
├── AuthStack (if !user)
│   ├── Login
│   ├── Register
│   └── ForgotPassword
├── EmployeeTabNavigator (if role === 'EMPLOYEE')
│   ├── Dashboard
│   ├── Schedule (Shift Marketplace)
│   └── Wallet (Earnings & Pay Stubs)
└── ManagerTabNavigator (if role === 'MANAGER')
    ├── TriageDashboard
    ├── Roster
    └── PanicButton
```

## 📝 TODO: Next Steps

### Critical
- [ ] Implement native module for monotonic time (iOS + Android)
- [ ] Add authentication service (JWT tokens)
- [ ] Implement sync service for offline queue
- [ ] Add location tracking service (geofencing)

### High Priority
- [ ] Build employee dashboard UI
- [ ] Implement shift marketplace
- [ ] Create wallet/earnings screen
- [ ] Add remote task content renderer (surveys, training)

### Medium Priority
- [ ] Manager triage dashboard
- [ ] Roster management
- [ ] Push notifications
- [ ] Biometric authentication

### Low Priority
- [ ] Dark mode support
- [ ] Accessibility improvements
- [ ] Analytics integration
- [ ] Error reporting (Sentry)

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linter
npm run lint

# Run tests (when implemented)
npm test
```

## 📄 License

ISC

## 👥 Team

Built for small businesses by developers who understand compliance requirements.

---

**Note**: This is a greenfield project with core architecture in place. UI implementation for individual screens is pending.
