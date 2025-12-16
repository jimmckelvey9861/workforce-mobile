# Active Tunnel Modal - Implementation Guide

## Overview

The **Active Tunnel Modal** is a full-screen overlay that appears when the user enters ACTIVE mode (earning money). It provides a clean, focused interface for completing paid tasks.

## Features

✅ **Full-Screen Coverage**: Uses absolute positioning (z-index: 9999) to cover all navigation
✅ **Real-Time Earnings**: Displays current earnings updated every second
✅ **Large Timer**: Shows elapsed time in HH:MM:SS format
✅ **Task Information**: Displays task name, description, and pay rate
✅ **Submit & Clock Out Button**: Completes the task and adds earnings to wallet
✅ **Pause Handling**: Shows overlay when app is backgrounded
✅ **Smooth Animation**: Fades in when entering ACTIVE mode

## Files Created

1. **`src/store/userStore.ts`** - User state management with wallet balance
2. **`src/components/compliance/ActiveTunnelModal.tsx`** - The modal component
3. **Updated `App.tsx`** - Integrated the modal and user store

## How It Works

### 1. User Store (`userStore.ts`)

The user store manages:
- Current authenticated user
- Wallet balance (in cents)
- Loading state

Key actions:
- `setUser(user)` - Set the authenticated user
- `addToBalance(amount)` - Add earnings to wallet (in cents)
- `logout()` - Clear user data

### 2. Active Tunnel Modal (`ActiveTunnelModal.tsx`)

The modal:
- Listens to `complianceStore.appMode`
- Only renders when `appMode === 'ACTIVE'`
- Updates earnings every second via `updateEarnings()`
- Shows a large timer counting elapsed time
- Displays current task information

When "Submit & Clock Out" is clicked:
1. Shows confirmation alert with earnings amount
2. Calls `endTunnel()` to complete the session
3. Adds earnings to user's wallet via `addToBalance()`
4. Shows success message
5. Returns to PASSIVE mode (navigation unlocked)

### 3. Integration in `App.tsx`

The modal is rendered **after** the `ActiveTaskTunnel`:

```tsx
<>
  <StatusBar style="auto" />
  <ActiveTaskTunnel>
    <RootNavigator user={user} isLoading={isLoading} />
  </ActiveTaskTunnel>
  {/* Active Tunnel Modal - sits above all navigation */}
  <ActiveTunnelModal />
</>
```

This ensures the modal sits on top of everything with absolute positioning.

## Usage Example

### Starting a Task Session

To test the Active Tunnel Modal, you need to start a task session. Here's how you would do it in a screen component:

```tsx
import { useComplianceStore } from '../store/complianceStore';
import { useUserStore } from '../store/userStore';
import { RemoteTask } from '../types';

function SomeScreen() {
  const { startTunnel } = useComplianceStore();
  const { user } = useUserStore();
  
  const handleStartTask = async () => {
    const task: RemoteTask = {
      id: '123',
      name: 'Customer Survey',
      description: 'Complete a 5-minute customer satisfaction survey',
      type: 'SURVEY',
      payRate: 50, // 50 cents per minute
      maxDuration: 10,
      estimatedDuration: 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (user) {
      await startTunnel(task, user.id);
      // The Active Tunnel Modal will automatically appear
    }
  };
  
  return (
    <TouchableOpacity onPress={handleStartTask}>
      <Text>Start Task</Text>
    </TouchableOpacity>
  );
}
```

## UI Design

### Header Section (Green)
- **Status Badge**: "EARNING NOW" with pulsing dot
- **Earnings Display**: Large dollar amount (e.g., "$2.50")
- **Pay Rate**: Shows rate per minute

### Content Section
- **Task Label**: "Active Task" in uppercase
- **Task Name**: Large, bold task title
- **Task Description**: Subtitle with task details
- **Timer Display**: Extra-large HH:MM:SS in green
- **Work Area**: Placeholder for task-specific content

### Footer Section
- **Submit Button**: Large, green button
  - Primary text: "Submit & Clock Out"
  - Subtext: Shows earnings amount

### Pause Overlay
When app is backgrounded, shows:
- Semi-transparent dark overlay
- White card with pause icon (⏸️)
- "Session Paused" message
- Explanation text

## Styling

The modal uses:
- **Primary Color**: `#10b981` (green) for earning states
- **Font Sizes**: 
  - Timer: 72px (extra large)
  - Earnings: 48px (large)
  - Task Name: 28px
- **Rounded Corners**: 16-24px for modern feel
- **Shadows**: Subtle elevation for depth
- **Platform-specific padding**: Accounts for status bar and home indicator

## State Flow

```
PASSIVE MODE (Normal Navigation)
    ↓
startTunnel() called
    ↓
ACTIVE MODE
    ↓
ActiveTunnelModal appears (full screen)
    ↓
User clicks "Submit & Clock Out"
    ↓
endTunnel() called
    ↓
Earnings added to wallet (addToBalance)
    ↓
PASSIVE MODE (Modal disappears)
```

## Testing

To test the Active Tunnel Modal:

1. **Start the app**: `npm start`
2. **Navigate to a screen that can start tasks**
3. **Call `startTunnel()` with a task object**
4. **Observe**:
   - Modal appears with fade-in animation
   - Timer starts counting
   - Earnings update every second
5. **Test pause**:
   - Background the app (home button)
   - Observe pause overlay
   - Return to app
   - Observe pause overlay disappears
6. **Complete task**:
   - Click "Submit & Clock Out"
   - Confirm in alert
   - Observe success message
   - Observe modal disappears

## Key Differences from ActiveTaskTunnel

| Feature | ActiveTaskTunnel | ActiveTunnelModal |
|---------|------------------|-------------------|
| Rendering | Uses Modal component | Uses absolute positioning |
| Purpose | Wraps navigation, provides tunnel experience | Overlay that sits above everything |
| Blocks navigation | Yes (via Modal) | Yes (via z-index) |
| Wallet integration | No | Yes - adds earnings on submit |
| UI Design | Functional, detailed | Clean, focused, large elements |

## Notes

- The modal and tunnel can coexist, but typically you'd use one or the other
- The modal uses absolute positioning to ensure it sits above all navigation
- Earnings are stored in cents to avoid floating-point precision issues
- The timer continues even if the modal is covered (though pause detection prevents this)
- All time tracking uses the compliance store's monotonic time system

## Future Enhancements

Potential improvements:
- [ ] Add task-specific content area (surveys, training modules, etc.)
- [ ] Add progress indicator for multi-step tasks
- [ ] Add sound effects for earnings milestones
- [ ] Add haptic feedback on submit
- [ ] Add confetti animation on task completion
- [ ] Add earnings history/receipt view

