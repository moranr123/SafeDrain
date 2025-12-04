# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up and use Firebase Cloud Messaging for browser notifications in Safe Drain.

## 📋 Table of Contents

1. [FCM Configuration](#fcm-configuration)
2. [Request Permission Function](#request-permission-function)
3. [Send Notification Examples](#send-notification-examples)
4. [Auto-Alert System](#auto-alert-system)
5. [Backend Integration](#backend-integration)

## 🔧 FCM Configuration

### 1. Get VAPID Key from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **safedrain-b50e8**
3. Navigate to **Project Settings** > **Cloud Messaging**
4. Scroll to **Web Push certificates** section
5. Click **Generate key pair** if you don't have one
6. Copy the **Key pair** value

### 2. Add VAPID Key to Environment Variables

Add the VAPID key to your `.env` file:

```env
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

### 3. FCM Config File

The FCM configuration is in `src/services/fcmConfig.js`:

```javascript
import { fcmConfig, getFCMConfig } from './services/fcmConfig'

// Get configuration
const config = getFCMConfig()
console.log('VAPID Key:', config.vapidKey)
console.log('FCM Available:', config.isAvailable)
```

## 🔔 Request Permission Function

### Basic Usage

```javascript
import { requestNotificationPermission } from './services/fcmHelpers'

// Request permission and get FCM token
try {
  const token = await requestNotificationPermission()
  console.log('FCM Token:', token)
  // Save this token to your database for backend notifications
} catch (error) {
  console.error('Permission denied:', error)
}
```

### Using the Hook

```javascript
import { useFCMNotifications } from './hooks/useFCMNotifications'

function MyComponent() {
  const { 
    token, 
    permission, 
    requestPermission, 
    error 
  } = useFCMNotifications()

  const handleRequestPermission = async () => {
    try {
      await requestPermission()
      console.log('Permission granted! Token:', token)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  return (
    <div>
      <p>Permission: {permission}</p>
      {permission !== 'granted' && (
        <button onClick={handleRequestPermission}>
          Enable Notifications
        </button>
      )}
    </div>
  )
}
```

### Check Permission Status

```javascript
import { getNotificationPermission } from './services/fcmHelpers'

const permission = getNotificationPermission()
// Returns: 'granted', 'denied', 'default', or 'not-supported'
```

## 📤 Send Notification Examples

### 1. Send Browser Notification (Frontend)

```javascript
import { sendCustomNotification } from './services/notificationService'

// Send a custom notification
await sendCustomNotification(
  'Drain Alert',
  'Drain #123 has reached critical water level!',
  {
    icon: '/src/assets/logo.png'
  }
)
```

### 2. Send Notification from Backend (Node.js)

```javascript
// Install: npm install firebase-admin

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification to a specific user
async function sendNotificationToUser(userFCMToken, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
      icon: '/src/assets/logo.png'
    },
    token: userFCMToken, // Get from frontend
    data: {
      drainId: data.drainId || '',
      status: data.status || '',
      timestamp: new Date().toISOString()
    },
    webpush: {
      fcmOptions: {
        link: 'https://your-app.com/monitoring'
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Usage
sendNotificationToUser(
  'user_fcm_token_here',
  'Critical Alert',
  'Drain #123 requires immediate attention!',
  { drainId: 'drain123', status: 'critical' }
);
```

### 3. Send to Multiple Users (Topic)

```javascript
// Subscribe users to a topic (do this from frontend)
import { getMessaging } from 'firebase/messaging';
const messaging = getMessaging();

// Subscribe to topic
messaging.subscribeToTopic(['token1', 'token2'], 'drain-alerts')
  .then(() => console.log('Subscribed to topic'))
  .catch(err => console.error('Error:', err));

// Send to topic from backend
const message = {
  notification: {
    title: 'System Alert',
    body: 'Multiple drains require attention'
  },
  topic: 'drain-alerts'
};

admin.messaging().send(message);
```

## 🚨 Auto-Alert System

The auto-alert system automatically monitors drains and sends notifications when status changes to "warning" or "critical".

### How It Works

1. **Real-time Monitoring**: Listens to Firestore `drains` collection
2. **Status Detection**: Detects when drain status changes to "warning" or "critical"
3. **Automatic Notification**: Sends browser notification immediately

### Setup

The auto-alert system is automatically initialized when a user logs in via `NotificationProvider` in `App.jsx`.

### Manual Control

```javascript
import { useNotifications } from './contexts/NotificationContext'

function MyComponent() {
  const { 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring 
  } = useNotifications()

  return (
    <div>
      <p>Monitoring: {isMonitoring ? 'Active' : 'Inactive'}</p>
      <button onClick={startMonitoring}>Start Monitoring</button>
      <button onClick={stopMonitoring}>Stop Monitoring</button>
    </div>
  )
}
```

### Custom Alert Handler

```javascript
import { initializeNotificationMonitoring } from './services/notificationService'

// Start monitoring with custom callback
const unsubscribe = initializeNotificationMonitoring((drain, newStatus, oldStatus) => {
  console.log(`Alert: ${drain.name} changed from ${oldStatus} to ${newStatus}`)
  
  // Custom logic here
  if (newStatus === 'critical') {
    // Send email, update dashboard, etc.
  }
})

// Stop monitoring
unsubscribe()
```

## 🔌 Backend Integration

### Store FCM Tokens

When a user grants notification permission, store their FCM token:

```javascript
// Frontend: Save token to Firestore
import { getFCMToken } from './services/fcmHelpers'
import { doc, setDoc } from 'firebase/firestore'
import { db } from './config/firebase'

const token = await getFCMToken()
await setDoc(doc(db, 'users', userId), {
  fcmToken: token,
  updatedAt: new Date()
}, { merge: true })
```

### Send Notification from Cloud Function

```javascript
// Firebase Cloud Function example
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.sendDrainAlert = functions.firestore
  .document('drains/{drainId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Check if status changed to critical
    if (newData.status === 'critical' && oldData.status !== 'critical') {
      // Get all user FCM tokens
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .get();

      const tokens = usersSnapshot.docs.map(doc => doc.data().fcmToken);

      const message = {
        notification: {
          title: '🚨 Critical Drain Alert',
          body: `${newData.name} requires immediate attention!`
        },
        data: {
          drainId: context.params.drainId,
          status: 'critical'
        },
        tokens: tokens
      };

      await admin.messaging().sendMulticast(message);
    }
  });
```

## 📱 Testing Notifications

### Test Browser Notification

1. Open the app
2. Go to `/examples/send-notification` (if route exists)
3. Click "Send Notification"
4. Grant permission if prompted
5. Notification should appear

### Test Auto-Alerts

1. Ensure you're logged in
2. Open browser console
3. Update a drain status to "warning" or "critical" in Firestore
4. Notification should appear automatically

## 🐛 Troubleshooting

### Notifications Not Showing

1. **Check Permission**: Ensure permission is granted
   ```javascript
   console.log(Notification.permission) // Should be 'granted'
   ```

2. **Check Service Worker**: Ensure `firebase-messaging-sw.js` is registered
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log)
   ```

3. **Check VAPID Key**: Ensure it's in `.env` file
   ```javascript
   console.log(import.meta.env.VITE_FIREBASE_VAPID_KEY)
   ```

### Service Worker Not Registering

- Ensure `firebase-messaging-sw.js` is in the `public/` folder
- Check browser console for errors
- Try clearing browser cache

### Background Notifications Not Working

- Ensure service worker is properly registered
- Check that `firebase-messaging-sw.js` has correct Firebase config
- Test on HTTPS (required for service workers)

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

