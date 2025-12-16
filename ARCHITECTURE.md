# WorkForce Mobile - Architecture Documentation

## Overview

WorkForce Mobile is an **Offline-First** React Native application with a strict **Compliance Engine** for time-tracking. This document describes the architectural decisions, data flow, and implementation details.

## Core Principles

### 1. Offline-First
- All user actions work without connectivity
- Data synced opportunistically when online
- SQLite provides persistent local storage
- Queue-based sync with priority levels

### 2. Compliance-Driven
- Time spoofing prevention via monotonic time
- Active mode locks navigation (tunnel UI)
- App backgrounding pauses paid sessions
- All time events auditable and verifiable

### 3. Type Safety
- Strict TypeScript mode enabled
- Comprehensive type definitions
- No implicit `any` types
- Runtime validation for critical paths

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  - AppState monitoring                                       │
│  - Authentication check                                      │
│  - Compliance session pause/resume                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ActiveTaskTunnel                           │
│  - Full-screen overlay when appMode === 'ACTIVE'            │
│  - Blocks navigation and back button                         │
│  - Shows earnings timer                                      │
│  - Handles pause/resume UI                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    RootNavigator                             │
│  ┌────────────┬──────────────────┬──────────────────┐       │
│  │ AuthStack  │ EmployeeTabNav   │ ManagerTabNav    │       │
│  │ (no user)  │ (role=EMPLOYEE)  │ (role=MANAGER)   │       │
│  └────────────┴──────────────────┴──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Zustand Store: `complianceStore`

**Purpose**: Single source of truth for pay state

**State Shape**:
```typescript
{
  appMode: 'PASSIVE' | 'ACTIVE'
  currentSessionEarnings: number
  activeTask: RemoteTask | null
  currentTimeEntry: TimeEntry | null
  isPaused: boolean
  pausedAt: string | null
  totalPauseDuration: number
  sessionStartTime: string | null
  monotonicSessionStart: number | null
}
```

**Critical Actions**:

#### `startTunnel(task: RemoteTask, userId: string)`
1. Validates no active session exists
2. Calls `TimeTruthService.captureTimeEvent('CLOCK_IN')`
3. Creates `TimeEntry` with monotonic time
4. Queues entry in SQLite via `OfflineQueueService`
5. Sets `appMode = 'ACTIVE'`
6. Returns created `TimeEntry`

#### `endTunnel()`
1. Validates active session exists
2. Calls `TimeTruthService.captureTimeEvent('CLOCK_OUT')`
3. Calculates earnings: `(elapsedMs - pauseDuration) / 60000 * payRate`
4. Updates `TimeEntry` with end time
5. Updates queue entry
6. Sets `appMode = 'PASSIVE'`
7. Returns completed `TimeEntry`

#### `pauseSession()` / `resumeSession()`
- Called by `App.tsx` on AppState changes
- Tracks pause duration to exclude from earnings
- Shows pause overlay in tunnel UI

### AppState Integration

```typescript
// In App.tsx
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (appMode === 'ACTIVE') {
      if (nextAppState.match(/inactive|background/)) {
        pauseSession();
      } else if (nextAppState === 'active') {
        resumeSession();
      }
    }
  });
  return () => subscription.remove();
}, [appMode, pauseSession, resumeSession]);
```

## Services Layer

### TimeTruthService

**Purpose**: Capture time events with anti-spoofing measures

**Key Method**: `captureTimeEvent(eventType)`

```typescript
TimeEvent {
  eventType: 'CLOCK_IN' | 'CLOCK_OUT' | 'FORCE_CLOCK_OUT'
  wallClockTime: string      // Date.now() → ISO 8601
  monotonicTime: number      // System.uptime() in ms
  deviceBootTime: string     // Calculated: now - uptime
  deviceId: string           // Expo Application.getInstallationIdAsync()
  deviceModel: string        // Device.modelName
  osVersion: string          // Device.osVersion
  appVersion: string         // Application.nativeApplicationVersion
}
```

**Validation Logic**:
```typescript
validateTimeEntry(entry: TimeEntry) {
  // Check monotonic time exists
  // Check end > start
  // Check duration < 24 hours
  // Check wall-clock vs monotonic variance < 5%
}
```

**Production Requirements**:

⚠️ **CRITICAL**: Replace `getMonotonicTime()` with native module

**iOS (Swift)**:
```swift
@objc(MonotonicTime)
class MonotonicTime: NSObject {
  @objc
  func getUptime(_ resolve: RCTPromiseResolveBlock, 
                 rejecter reject: RCTPromiseRejectBlock) {
    let uptime = ProcessInfo.processInfo.systemUptime
    resolve(uptime * 1000) // Convert to milliseconds
  }
}
```

**Android (Kotlin)**:
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

### OfflineQueueService

**Purpose**: Persistent queue for offline actions

**Database Schema**:
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
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_priority ON offline_queue(priority DESC, created_at ASC);
CREATE INDEX idx_type ON offline_queue(type);
```

**Queue Priority**:
- `10`: Time entries (highest)
- `5`: Location updates
- `1`: Task completions
- `0`: Other actions

**Sync Strategy**:
1. Process queue in priority order
2. Exponential backoff on failure
3. Remove after `max_attempts` reached
4. Retry automatically on connectivity change

## Data Flow: Starting a Paid Task

```
User taps "Start Task" button
         │
         ▼
┌─────────────────────────┐
│  complianceStore        │
│  .startTunnel(task)     │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  TimeTruthService       │
│  .captureTimeEvent()    │
│  - wallClockTime        │
│  - monotonicTime ⚠️     │
│  - deviceBootTime       │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Create TimeEntry       │
│  - id: UUID             │
│  - monotonicStart       │
│  - isSynced: false      │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  OfflineQueueService    │
│  .enqueue()             │
│  - priority: 10         │
│  - type: TIME_ENTRY     │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  SQLite Database        │
│  INSERT INTO queue      │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Update Store State     │
│  - appMode = ACTIVE     │
│  - activeTask = task    │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  ActiveTaskTunnel       │
│  - Renders overlay      │
│  - Starts timer         │
│  - Blocks navigation    │
└─────────────────────────┘
```

## Navigation Architecture

### Role-Based Routing

```typescript
RootNavigator
  ├─ if (!user)
  │    └─ AuthStack
  │         ├─ Login
  │         ├─ Register
  │         └─ ForgotPassword
  │
  ├─ if (user.role === 'EMPLOYEE')
  │    └─ EmployeeTabNavigator
  │         ├─ Dashboard (Home)
  │         ├─ Schedule (Marketplace)
  │         └─ Wallet (Earnings)
  │
  └─ if (user.role === 'MANAGER')
       └─ ManagerTabNavigator
            ├─ TriageDashboard
            ├─ Roster
            └─ PanicButton
```

### Navigation Locking

When `appMode === 'ACTIVE'`:
- `ActiveTaskTunnel` renders full-screen modal
- Hardware back button blocked (Android)
- Navigation header hidden
- User cannot leave until task complete

## Security Considerations

### Time Spoofing Prevention

**Attack Vector**: User changes device time to inflate hours

**Defense**:
1. Capture monotonic time (cannot be changed without root)
2. Calculate device boot time
3. Server validates: `bootTime + monotonicTime ≈ wallClockTime`
4. Flag entries with >5% variance

**Example**:
```typescript
// User changes time from 2:00 PM → 5:00 PM
wallClockTime: "2024-01-15T17:00:00Z"  // Spoofed
monotonicTime: 3600000                  // 1 hour since boot
deviceBootTime: "2024-01-15T13:00:00Z" // Calculated

// Server validation
expectedWallClock = bootTime + monotonicTime
                  = 13:00 + 1hr = 14:00
actualWallClock = 17:00

variance = |17:00 - 14:00| / 14:00 = 21.4%
// FLAGGED: Variance > 5%
```

### Data Integrity

- All critical data in SQLite (encrypted at rest)
- Queue entries include attempt counter
- Failed syncs logged for audit
- Server-side validation of all time entries

## Performance Considerations

### Offline Queue Size

- Monitor queue size: `OfflineQueueService.getCount()`
- Warn user if >100 pending actions
- Background sync when app is idle

### Timer Updates

- Earnings updated every 1 second
- Use `setInterval` (cleared on pause)
- Avoid excessive re-renders with Zustand selectors

### Database Optimization

- Indexes on `priority` and `type`
- Periodic cleanup of old entries
- Vacuum database monthly

## Testing Strategy

### Unit Tests
- `complianceStore` actions
- `TimeTruthService` validation
- `OfflineQueueService` CRUD operations

### Integration Tests
- Start/end tunnel flow
- Offline queue sync
- AppState pause/resume

### E2E Tests
- Complete task flow
- Network interruption handling
- Time spoofing detection

## Deployment Checklist

- [ ] Replace `getMonotonicTime()` with native module
- [ ] Implement authentication service
- [ ] Add sync service with retry logic
- [ ] Configure push notifications
- [ ] Set up error reporting (Sentry)
- [ ] Enable SQLite encryption
- [ ] Add biometric authentication
- [ ] Configure backend API endpoints
- [ ] Test on physical devices (iOS + Android)
- [ ] Validate time spoofing detection

## Future Enhancements

### Phase 2
- Location tracking with geofencing
- Photo capture for compliance
- Voice notes for incidents
- Offline maps for field workers

### Phase 3
- Shift trading marketplace
- Peer-to-peer messaging
- Performance analytics
- Gamification (badges, streaks)

## Troubleshooting

### Issue: Timer not pausing on background
**Solution**: Check AppState listener in `App.tsx`

### Issue: Queue not syncing
**Solution**: Verify network connectivity and retry logic

### Issue: Time variance flags
**Solution**: Check device clock accuracy and monotonic time capture

---

**Last Updated**: 2024-12-12  
**Version**: 1.0.0  
**Status**: Core Architecture Complete
