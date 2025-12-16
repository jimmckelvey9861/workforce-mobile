# Testing the Active Tunnel Modal

## Quick Start

The Active Tunnel Modal is now fully integrated into the Employee Dashboard. Here's how to test it:

## Prerequisites

Since the app requires a logged-in user to start tasks, you'll need to set a mock user first.

### Option 1: Quick Test via Console (Recommended)

Open your React Native debugger console and run:

```javascript
// Import the user store
const { useUserStore } = require('./src/store/userStore');

// Set a test user
useUserStore.getState().setUser({
  id: 'test-user-001',
  email: 'test@example.com',
  firstName: 'Alex',
  lastName: 'Johnson',
  role: 'EMPLOYEE',
  currentBalance: 0, // Balance in cents
  companyId: 'company-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

### Option 2: Add Test User in App.tsx

Temporarily modify `App.tsx` to set a test user on mount:

```typescript
useEffect(() => {
  const checkAuth = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TEMPORARY: Set a test user
      setUser({
        id: 'test-user-001',
        email: 'test@example.com',
        firstName: 'Alex',
        lastName: 'Johnson',
        role: 'EMPLOYEE',
        currentBalance: 0,
        companyId: 'company-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setLoading(false);
    } catch (error) {
      console.error('[App] Auth check failed:', error);
      setLoading(false);
    }
  };
  
  checkAuth();
}, [setLoading, setUser]);
```

## Testing Steps

### 1. Navigate to Dashboard

Once logged in (with a test user set), you should see:
- Welcome section with your name
- Next Shift card
- Earnings Wallet
- **Available Tasks section** with 3 tasks:
  - ✅ Safety Survey (3 min, $0.75)
  - 🔧 Equipment Check (5 min, $1.25)
  - 📚 Training Module (10 min, $2.50)

### 2. Start a Task

1. Click the **"Start"** button on any task
2. An alert will confirm the task start
3. Click **"Start Working"**

### 3. Active Tunnel Modal Appears

The modal should immediately cover the entire screen with:

**Header (Green)**
- "EARNING NOW" badge with pulsing dot
- Current earnings: $0.00 (updates every second)
- Pay rate: $0.25/min

**Content**
- Task name (e.g., "Safety Survey")
- Task description
- Large timer showing HH:MM:SS
- Expected max duration

**Footer**
- Large green button: "Submit & Clock Out"
- Shows current earnings amount

### 4. Watch Earnings Grow

As time passes, you'll see:
- Timer counting up: 00:00:01, 00:00:02, etc.
- Earnings increasing: $0.00 → $0.01 → $0.02...
- Pay rate is 25 cents per minute = ~$0.004 per second

### 5. Test Backgrounding (Optional)

1. Press the home button or switch apps
2. Return to the app
3. You should see a pause overlay: "⏸️ Session Paused"
4. The timer stops while paused
5. Return to foreground - timer resumes

### 6. Complete the Task

1. Wait a few seconds (or minutes)
2. Click **"Submit & Clock Out"**
3. Confirm in the alert dialog
4. You should see:
   - Success message with earnings amount
   - Modal disappears
   - Return to Dashboard
   - Balance updates in user store

### 7. Verify Balance Update

Check the user's balance in the console:

```javascript
const { useUserStore } = require('./src/store/userStore');
console.log('Balance:', useUserStore.getState().user?.currentBalance / 100, 'dollars');
```

## Expected Behavior

### Task: Safety Survey (3 minutes)
- Pay rate: $0.25/minute
- If you work for **1 minute**: Earn ~$0.25
- If you work for **3 minutes**: Earn ~$0.75
- If you work for **5 minutes**: Earn ~$1.25

### Task: Equipment Check (5 minutes)
- Pay rate: $0.25/minute
- If you work for **1 minute**: Earn ~$0.25
- If you work for **5 minutes**: Earn ~$1.25

### Task: Training Module (10 minutes)
- Pay rate: $0.25/minute
- If you work for **1 minute**: Earn ~$0.25
- If you work for **10 minutes**: Earn ~$2.50

## What Should Happen

✅ **When Starting Task:**
- Alert shows expected earnings
- Modal fades in over entire screen
- Timer starts at 00:00:00
- Earnings start at $0.00
- Navigation is completely blocked

✅ **During Task:**
- Timer updates every second
- Earnings update every second
- Can't press back button (Android)
- Can't navigate away

✅ **When Backgrounding:**
- Pause overlay appears
- Timer stops
- Earnings stop increasing
- State is preserved

✅ **When Completing:**
- Confirmation alert shows earnings
- Success message after confirmation
- Modal disappears
- Returns to PASSIVE mode
- Balance updated in user store
- Can navigate normally again

## Troubleshooting

### "You must be logged in to start a task"
- The user store has no user set
- Use Option 1 or 2 above to set a test user

### Modal doesn't appear
- Check that `complianceStore.appMode` is 'ACTIVE'
- Check console for errors in `startTunnel()`

### Earnings not updating
- Check that timer is running (not paused)
- Check `updateEarnings()` is being called
- Look for console errors

### Can still navigate
- The modal should have `zIndex: 9999`
- Check that `pointerEvents` is not set to 'none'

### Balance not updating
- Check that `addToBalance()` is called in `handleSubmitAndClockOut`
- Check console logs for balance updates

## Code Locations

- **User Store**: `src/store/userStore.ts`
- **Compliance Store**: `src/store/complianceStore.ts`
- **Active Tunnel Modal**: `src/components/compliance/ActiveTunnelModal.tsx`
- **Dashboard Screen**: `src/screens/employee/DashboardScreen.tsx`
- **App Integration**: `App.tsx`

## Current Implementation

The implementation is **complete** and includes:

✅ User store with wallet balance management  
✅ Active Tunnel Modal with full-screen coverage  
✅ Real-time timer and earnings calculation  
✅ Proper task start with compliance store  
✅ Balance update on task completion  
✅ Pause handling for app backgrounding  
✅ Clean, modern UI with animations  
✅ 3 hardcoded tasks on Dashboard  
✅ ScrollView wrapper on Dashboard  
✅ Start buttons call `startTunnel()` correctly  

## Next Steps

After testing, you might want to:

1. **Add Real Authentication**: Replace test user with actual login
2. **Fetch Tasks from API**: Replace hardcoded tasks with server data
3. **Persist Balance**: Save balance to AsyncStorage or backend
4. **Add Task Content**: Implement actual task UI (surveys, training, etc.)
5. **Add Wallet Screen**: Show transaction history and detailed earnings

