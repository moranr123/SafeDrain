/**
 * Firebase Cloud Messaging Configuration
 * 
 * This file contains FCM configuration and helper functions
 */

import { messaging } from '../config/firebase'

/**
 * FCM Configuration
 */
export const fcmConfig = {
  // VAPID key from Firebase Console > Project Settings > Cloud Messaging
  // Get this from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  
  // Notification icon
  notificationIcon: '/src/assets/logo.png',
  
  // Notification badge
  notificationBadge: '/src/assets/logo.png',
  
  // Default notification options
  defaultNotificationOptions: {
    tag: 'safedrain-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200], // Vibration pattern (mobile)
  }
}

/**
 * Check if FCM is available
 */
export const isFCMAvailable = () => {
  return messaging !== null && typeof window !== 'undefined'
}

/**
 * Get FCM configuration
 */
export const getFCMConfig = () => {
  return {
    ...fcmConfig,
    isAvailable: isFCMAvailable(),
    messaging: messaging
  }
}

