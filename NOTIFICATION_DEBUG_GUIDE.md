# Notification Debugging Guide

## 🔍 How to Debug Notification Issues

### 1. Check Browser Console

Open browser DevTools (F12) and check the console for:
- `"Initializing drain notification monitoring..."`
- `"Drain monitoring subscription created"`
- `"Drain update received: X drains"`
- `"🚨 ALERT: Drain [name] status changed to [status]"`

### 2. Check Notification Permission

In the browser console, run:
```javascript
console.log('Permission:', Notification.permission)
// Should be: 'granted'
```

Or go to User Profile page and check the "Notifications" section.

### 3. Test Notification Manually

**Option 1: Use Profile Page**
1. Go to `/profile`
2. Scroll to "Notifications" section
3. Click "Test Notification"
4. Check console for status

**Option 2: Use Browser Console**
```javascript
// Import test function
import { testNotification, checkNotificationStatus } from './utils/testNotifications'

// Check status
checkNotificationStatus()

// Test notification
await testNotification()
```

### 4. Check if Monitoring is Active

In browser console:
```javascript
// Check if monitoring is running
// Look for: "Drain monitoring started" in console
```

Or check User Profile page - it shows "✓ Active" if monitoring is running.

### 5. Test Drain Status Change

1. Open Firestore Console
2. Find a drain in the `drains` collection
3. Change its `status` field to `"warning"` or `"critical"`
4. Watch browser console for:
   - `"Drain update received"`
   - `"🚨 ALERT: Drain [name] status changed to [status]"`
   - `"sendDrainAlert called"`
   - `"Showing notification"`

### 6. Common Issues and Fixes

#### Issue: "Permission not granted"
**Fix:**
1. Go to User Profile page
2. Click "Enable Notifications"
3. Grant permission in browser popup

#### Issue: "Monitoring not active"
**Fix:**
1. Ensure you're logged in
2. Check console for errors
3. Refresh the page
4. Monitoring should start automatically

#### Issue: "Notifications not showing"
**Check:**
1. Browser notification settings (not blocked)
2. System notification settings
3. Browser console for errors
4. Icon path (should be accessible)

#### Issue: "Status changes not detected"
**Check:**
1. Console logs show "Drain update received"
2. Previous state is being tracked
3. Status actually changed (not already in warning/critical)

### 7. Enable Detailed Logging

All notification functions now include console.log statements. Check:
- `notificationService.js` - logs drain updates and alerts
- `fcmHelpers.js` - logs notification creation
- `NotificationContext.jsx` - logs initialization

### 8. Manual Test Steps

1. **Enable Notifications:**
   - Go to `/profile`
   - Click "Enable Notifications"
   - Grant permission

2. **Test Notification:**
   - Click "Test Notification" button
   - Should see a test notification

3. **Test Auto-Alert:**
   - Open Firestore
   - Update a drain: `status: "critical"`
   - Should see notification automatically

4. **Check Console:**
   - Should see logs for each step
   - Look for any errors

### 9. Browser-Specific Issues

**Chrome:**
- Check `chrome://settings/content/notifications`
- Ensure site is allowed

**Firefox:**
- Check notification settings in preferences
- May need to allow in browser popup

**Safari:**
- Requires user interaction to request permission
- May have stricter requirements

### 10. Service Worker Check

Check if service worker is registered:
```javascript
navigator.serviceWorker.getRegistrations().then(console.log)
```

Should see `firebase-messaging-sw.js` registered.

## 📝 Debug Checklist

- [ ] Notification permission is "granted"
- [ ] Monitoring shows "✓ Active" in profile
- [ ] Console shows "Drain monitoring started"
- [ ] Console shows "Drain update received" when drains change
- [ ] Test notification works
- [ ] Service worker is registered
- [ ] No errors in console
- [ ] Browser notification settings allow notifications
- [ ] Icon path is accessible

## 🐛 Still Not Working?

1. **Clear browser cache and reload**
2. **Check browser console for specific errors**
3. **Try in incognito/private mode**
4. **Check if other notifications work (test with testNotification())**
5. **Verify Firestore rules allow reading drains collection**

## 📞 Quick Test Commands

```javascript
// In browser console:

// 1. Check permission
Notification.permission

// 2. Request permission
Notification.requestPermission().then(console.log)

// 3. Test notification
new Notification('Test', { body: 'Testing' })

// 4. Check service worker
navigator.serviceWorker.getRegistrations().then(r => console.log(r.length))
```

