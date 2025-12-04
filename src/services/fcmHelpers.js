import { messaging } from '../config/firebase'
import { getToken, onMessage } from 'firebase/messaging'

/**
 * Firebase Cloud Messaging (FCM) helper functions
 */

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }
    
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      return await getFCMToken()
    } else {
      throw new Error('Notification permission denied')
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    throw error
  }
}

// Get FCM token
export const getFCMToken = async () => {
  try {
    if (!messaging) {
      throw new Error('Firebase Cloud Messaging is not initialized')
    }
    
    // VAPID key from Firebase Console > Project Settings > Cloud Messaging
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    
    if (!vapidKey) {
      console.warn('VAPID key not found. Please add VITE_FIREBASE_VAPID_KEY to your .env file')
    }
    
    const token = await getToken(messaging, { vapidKey })
    
    if (token) {
      console.log('FCM Token:', token)
      return token
    } else {
      throw new Error('No registration token available')
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    throw error
  }
}

// Listen for foreground messages (when app is open)
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.warn('Firebase Cloud Messaging is not initialized')
    return () => {}
  }
  
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload)
    
    // Show notification
    if (payload.notification) {
      showNotification(
        payload.notification.title,
        payload.notification.body,
        payload.notification.icon
      )
    }
    
    // Call custom callback
    if (callback) {
      callback(payload)
    }
  })
}

// Show browser notification
export const showNotification = (title, body, icon = null) => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return
  }
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: icon || '/src/assets/logo.png',
      badge: '/src/assets/logo.png',
      tag: 'safedrain-notification',
      requireInteraction: false
    })
    
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)
  }
}

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window
}

// Check current notification permission
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'not-supported'
  }
  return Notification.permission // 'granted', 'denied', or 'default'
}

// Setup FCM service worker (for background messages)
// This should be called in your main.jsx or App.jsx
export const setupServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  } else {
    console.warn('Service Workers are not supported in this browser')
    return null
  }
}

// Initialize FCM (call this in your app initialization)
export const initializeFCM = async (onMessageCallback = null) => {
  try {
    // Setup service worker for background messages
    await setupServiceWorker()
    
    // Request permission and get token
    const token = await requestNotificationPermission()
    
    // Listen for foreground messages
    if (onMessageCallback) {
      onForegroundMessage(onMessageCallback)
    } else {
      onForegroundMessage()
    }
    
    return token
  } catch (error) {
    console.error('Error initializing FCM:', error)
    throw error
  }
}

