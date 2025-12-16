# WorkForce Mobile - Launch Commands

## 🚀 Quick Start

### Fix File Watcher Limit First (macOS)
```bash
# Increase file watcher limit
ulimit -n 4096
```

### Launch Web Version
```bash
cd /Users/jim/source/workforce_mobile
npx expo start --web
```

**Expected Output:**
```
Starting project at /Users/jim/source/workforce_mobile
Starting Metro Bundler
Waiting on http://localhost:8081
Web app available at: http://localhost:8081
```

**Then:**
- Browser should open automatically to `http://localhost:8081`
- Or manually navigate to `http://localhost:8081`

### Launch All Platforms
```bash
cd /Users/jim/source/workforce_mobile
npx expo start
```

**Then press:**
- `w` - Open in web browser
- `i` - Open in iOS simulator
- `a` - Open in Android emulator
- `r` - Reload app
- `m` - Toggle menu

## 🔧 Troubleshooting Commands

### Clear Cache and Restart
```bash
npx expo start --clear
```

### Check File Watcher Limit
```bash
ulimit -n
```

### Increase File Watcher Limit (Temporary)
```bash
ulimit -n 4096
```

### Increase File Watcher Limit (Permanent)
```bash
# Add to ~/.zshrc or ~/.bash_profile
echo "ulimit -n 4096" >> ~/.zshrc
source ~/.zshrc
```

### Reset Metro Bundler
```bash
rm -rf node_modules/.cache
npx expo start --clear
```

### Reinstall Dependencies
```bash
rm -rf node_modules
npm install
npx expo start
```

## 📱 Platform-Specific Commands

### iOS
```bash
# Start with iOS simulator
npx expo start --ios

# Or start server and press 'i'
npx expo start
# Then press: i
```

### Android
```bash
# Start with Android emulator
npx expo start --android

# Or start server and press 'a'
npx expo start
# Then press: a
```

### Web
```bash
# Start with web browser
npx expo start --web

# Or start server and press 'w'
npx expo start
# Then press: w
```

## 🧪 Testing Commands

### Run TypeScript Check
```bash
npx tsc --noEmit
```

### Check for Errors
```bash
npm run lint
```

### View Logs
```bash
# Metro bundler logs are shown in terminal
# Browser console for web errors (F12)
```

## 🔍 Verification Steps

### After Launch
1. ✅ Metro bundler starts successfully
2. ✅ No red error screens
3. ✅ TruthTestScreen loads
4. ✅ Web warning banner appears (web only)
5. ✅ "Simulate Clock In" button works

### Web Platform Checks
```bash
# Open browser console (F12)
# Check for:
# - [TimeTruthService.web] logs
# - [OfflineQueueService.web] logs
# - No "Module not found" errors
```

### Native Platform Checks
```bash
# Check Metro logs for:
# - [TimeTruthService.native] logs
# - [OfflineQueueService.native] logs
# - SQLite database initialization
```

## 📊 Expected Behavior

### Web Version
- ✅ Launches in browser
- ✅ Shows web warning banner
- ✅ Uses Date.now() for timestamps
- ✅ Signature: "WEB_UNVERIFIED_SIGNATURE"
- ✅ Device ID starts with "web_"
- ✅ Storage: localStorage

### Native Version
- ✅ Launches in simulator/device
- ✅ No web warning banner
- ✅ Uses system uptime for monotonic time
- ✅ Signature: SHA-256 hash
- ✅ Device ID: persistent
- ✅ Storage: SQLite

## 🐛 Common Issues

### Issue: "EMFILE: too many open files"
**Solution:**
```bash
ulimit -n 4096
npx expo start --web
```

### Issue: "Module not found: react-native-device-info"
**Expected on web!** The code handles this with conditional imports.

### Issue: Blank screen on web
**Check:**
1. Browser console for errors
2. Metro bundler logs
3. Try clearing cache: `npx expo start --clear --web`

### Issue: Port already in use
**Solution:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npx expo start --port 8082
```

## 📝 Development Workflow

### Typical Session
```bash
# 1. Fix file watcher limit
ulimit -n 4096

# 2. Start server
cd /Users/jim/source/workforce_mobile
npx expo start

# 3. Choose platform
# Press 'w' for web
# Press 'i' for iOS
# Press 'a' for Android

# 4. Make changes
# Files auto-reload on save

# 5. Test on multiple platforms
# Press 'w', 'i', or 'a' to switch
```

## 🎯 Quick Tests

### Test Web Version
```bash
# Terminal 1: Start server
ulimit -n 4096
npx expo start --web

# Browser: Navigate to http://localhost:8081
# Verify: Web warning banner appears
# Click: "Simulate Clock In"
# Check: Signature is "WEB_UNVERIFIED_SIGNATURE"
```

### Test Native Version
```bash
# Terminal 1: Start server
npx expo start

# Terminal 1: Press 'i' for iOS
# Verify: No web warning banner
# Click: "Simulate Clock In"
# Check: Signature is a SHA-256 hash
```

## 📚 Additional Commands

### View Package Info
```bash
npm list react-native-web
npm list @react-native-async-storage/async-storage
```

### Check Expo Version
```bash
npx expo --version
```

### Update Expo
```bash
npx expo install --fix
```

### View Metro Config
```bash
cat metro.config.js
```

## 🔗 Useful URLs

- **Web App**: http://localhost:8081
- **Metro Bundler**: http://localhost:8081
- **Expo DevTools**: http://localhost:8081/_expo/devtools

## 💡 Pro Tips

1. **Always increase file watcher limit first** on macOS
2. **Use `--clear` flag** if you see weird errors
3. **Check browser console** for web-specific errors
4. **Press 'r'** to reload without restarting server
5. **Press 'm'** to toggle developer menu

---

**Current Status**: Ready to launch!  
**Blocked By**: File watcher limit (run `ulimit -n 4096` first)  
**Next Step**: `npx expo start --web`
