/**
 * Test notification functions
 * Use these to debug notification issues
 */

import { sendCustomNotification } from '../services/notificationService'
import { getNotificationPermission, requestNotificationPermission } from '../services/fcmHelpers'

/**
 * Test if notifications are working
 */
export const testNotification = async () => {
  console.log('=== Testing Notifications ===')
  
  // Check permission
  const permission = getNotificationPermission()
  console.log('1. Current permission:', permission)
  
  if (permission !== 'granted') {
    console.log('2. Requesting permission...')
    try {
      await requestNotificationPermission()
      const newPermission = getNotificationPermission()
      console.log('3. New permission:', newPermission)
    } catch (error) {
      console.error('4. Permission request failed:', error)
      return false
    }
  }
  
  // Try to send a test notification
  console.log('5. Sending test notification...')
  const success = await sendCustomNotification(
    'Test Notification',
    'If you see this, notifications are working!',
    { icon: window.location.origin + '/src/assets/logo.png' }
  )
  
  console.log('6. Notification sent:', success)
  return success
}

/**
 * Check notification status
 */
export const checkNotificationStatus = () => {
  const status = {
    supported: 'Notification' in window,
    permission: getNotificationPermission(),
    serviceWorker: 'serviceWorker' in navigator
  }
  
  console.log('Notification Status:', status)
  return status
}

