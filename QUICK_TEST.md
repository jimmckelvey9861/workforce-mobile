# Quick Test Guide - Employee Dashboard

## 🚀 Launch (30 seconds)

```bash
# Fix file watcher limit
ulimit -n 4096

# Start web version
cd /Users/jim/source/workforce_mobile
npx expo start --web
```

**Browser opens to**: `http://localhost:8081`

## ✅ 5-Minute Test

### Test 1: Dashboard Loads (30 sec)
**Expected:**
- ✅ "Good morning, Alex" (or afternoon/evening)
- ✅ Next Shift card with tomorrow's shift
- ✅ Earnings Wallet: $342.50
- ✅ 3 tasks: Safety Survey, Equipment Check, Training Module
- ✅ NO green header (PASSIVE mode)

### Test 2: Start Task (1 min)
**Action:** Click "Start" on Safety Survey

**Expected:**
- ✅ Alert: "Task Started"
- ✅ Green header appears: "🟢 ACTIVE SESSION 00:00"
- ✅ Timer starts counting: 00:01, 00:02, 00:03...
- ✅ All "Start" buttons → "In Progress" (disabled)
- ✅ Yellow notice at bottom: "⚡ You have an active task..."

### Test 3: Timer Accuracy (1 min)
**Action:** Wait 1 minute

**Expected:**
- ✅ Timer shows "01:00"
- ✅ Timer continues: "01:01", "01:02"...
- ✅ Format is always MM:SS

### Test 4: Navigation (1 min)
**Action:** Click "Schedule" tab

**Expected:**
- ✅ Green header still visible
- ✅ Timer still counting

**Action:** Click "Wallet" tab

**Expected:**
- ✅ Green header still visible
- ✅ Timer still counting

**Action:** Click "Home" tab

**Expected:**
- ✅ Green header still visible
- ✅ Active notice still visible
- ✅ Buttons still disabled

### Test 5: Duplicate Task (30 sec)
**Action:** Try clicking "Start" on Equipment Check

**Expected:**
- ✅ Button is grayed out (disabled)
- ✅ Alert: "Task Already Active"

## 🎯 Success Criteria

All 5 tests pass = ✅ **Dashboard Working Perfectly!**

## 🐛 If Something Fails

### PayStateHeader Not Showing
```bash
# Check console
# Should see: [complianceStore] Tunnel started successfully
```

### Timer Not Counting
```bash
# Check console
# Should see timer updates every second
```

### Buttons Not Disabling
```bash
# Check console
# Should see: App Mode: ACTIVE
```

## 📸 Visual Checklist

### PASSIVE Mode (Before Starting Task)
```
┌─────────────────────────────────────┐
│  Good morning, Alex                 │ ← No green header
│  [Next Shift Card]                  │
│  [Earnings: $342.50]                │
│  [Task 1] [Start] ← Green           │
│  [Task 2] [Start] ← Green           │
│  [Task 3] [Start] ← Green           │
└─────────────────────────────────────┘
```

### ACTIVE Mode (After Starting Task)
```
┌─────────────────────────────────────┐
│  🟢 ACTIVE SESSION      00:15       │ ← Green header!
├─────────────────────────────────────┤
│  Good morning, Alex                 │
│  [Next Shift Card]                  │
│  [Earnings: $342.50]                │
│  [Task 1] [In Progress] ← Gray      │
│  [Task 2] [In Progress] ← Gray      │
│  [Task 3] [In Progress] ← Gray      │
│  ⚡ Active task notice               │
└─────────────────────────────────────┘
```

## 🎉 That's It!

If all tests pass, the Employee Dashboard is **fully functional** and ready for integration!

---

**Time Required**: 5 minutes  
**Difficulty**: Easy  
**Prerequisites**: App running on web/simulator
