import { subscribeToCollection, addDocument } from './firestoreHelpers'
import { showNotification, getNotificationPermission, requestNotificationPermission } from './fcmHelpers'
import { Timestamp } from 'firebase/firestore'

/**
 * Notification Service for Safe Drain
 * Handles automatic alerts when sensor thresholds are exceeded
 */

// Store previous drain states to detect changes
const previousDrainStates = new Map()

/**
 * Monitor drains and send notifications when status changes to warning or critical
 */
export const startDrainMonitoring = (onStatusChange = null) => {
  let unsubscribe = null

  const handleDrainUpdate = (drains) => {
    console.log('Drain update received:', drains.length, 'drains')
    
    drains.forEach(drain => {
      const previousState = previousDrainStates.get(drain.id)
      const currentStatus = drain.status || 'inactive'

      console.log(`Drain ${drain.id} (${drain.name}):`, {
        previousStatus: previousState?.status || 'none',
        currentStatus,
        isWarningOrCritical: currentStatus === 'warning' || currentStatus === 'critical',
        statusChanged: previousState?.status !== currentStatus
      })

      // Check if status changed to warning or critical
      if (
        (currentStatus === 'warning' || currentStatus === 'critical') &&
        previousState?.status !== currentStatus
      ) {
        console.log(`🚨 ALERT: Drain ${drain.name} status changed to ${currentStatus}`)
        // Status changed to warning or critical
        sendDrainAlert(drain, currentStatus)
        
        // Call custom callback if provided
        if (onStatusChange) {
          onStatusChange(drain, currentStatus, previousState?.status)
        }
      }

      // Update previous state
      previousDrainStates.set(drain.id, {
        status: currentStatus,
        waterLevel: drain.waterLevel,
        timestamp: new Date()
      })
    })
  }

  // Subscribe to real-time drain updates
  console.log('Subscribing to drains collection...')
  unsubscribe = subscribeToCollection(
    'drains',
    handleDrainUpdate,
    [],
    'updatedAt',
    'desc'
  )

  console.log('Drain monitoring subscription created')
  return unsubscribe
}

/**
 * Send a notification alert for a drain status change
 */
export const sendDrainAlert = async (drain, status) => {
  console.log('sendDrainAlert called:', { drainId: drain.id, drainName: drain.name, status })
  
  const drainName = drain.name || 'Unnamed Drain'
  const statusEmoji = status === 'critical' ? '🔴' : '⚠️'
  
  let title = ''
  let body = ''
  let severity = status === 'critical' ? 'critical' : 'warning'

  if (status === 'critical') {
    title = `Critical Alert: ${drainName}`
    body = `Drain "${drainName}" has reached a critical status. Immediate attention required!`
    
    if (drain.waterLevel !== undefined) {
      body += ` Water level: ${drain.waterLevel}%`
    }
  } else if (status === 'warning') {
    title = `Warning: ${drainName}`
    body = `Drain "${drainName}" requires attention. Status: Warning`
    
    if (drain.waterLevel !== undefined) {
      body += ` Water level: ${drain.waterLevel}%`
    }
  }

  // Create alert in Firestore
  try {
    const alertData = {
      title,
      message: body,
      severity,
      drainId: drain.id,
      drainName: drainName,
      read: false,
      createdAt: Timestamp.now(),
      type: 'drain-status-change'
    }
    
    await addDocument('alerts', alertData)
    console.log('Alert created in Firestore:', alertData)
  } catch (error) {
    console.error('Error creating alert in Firestore:', error)
    // Continue even if Firestore write fails
  }

  // Check notification permission for browser notification
  let permission = getNotificationPermission()
  console.log('Current notification permission:', permission)
  
  if (permission !== 'granted') {
    // Try to request permission
    try {
      console.log('Requesting notification permission...')
      await requestNotificationPermission()
      permission = getNotificationPermission()
      console.log('Permission after request:', permission)
    } catch (error) {
      console.warn('Notification permission not granted:', error)
      // Still try to show notification - browser might allow it
    }
  }

  // Show browser notification if permission is granted
  if (permission === 'granted') {
    const notificationTitle = `${statusEmoji} ${title}`
    console.log('Showing notification:', { title: notificationTitle, body })

    // Show browser notification - use a path that works in production
    const iconPath = window.location.origin + '/src/assets/logo.png'
    showNotification(notificationTitle, body, iconPath)
  } else {
    console.warn('Cannot show browser notification: permission not granted')
  }

  // Log for debugging
  console.log('Drain alert sent:', { drainId: drain.id, drainName, status })
}

/**
 * Send a custom notification
 */
export const sendCustomNotification = async (title, body, options = {}) => {
  const permission = getNotificationPermission()
  
  if (permission !== 'granted') {
    try {
      await requestNotificationPermission()
    } catch (error) {
      console.warn('Notification permission not granted:', error)
      return false
    }
  }

  showNotification(
    title,
    body,
    options.icon || '/src/assets/logo.png'
  )

  return true
}

/**
 * Initialize notification monitoring
 * Call this when the app starts to begin monitoring drains
 */
export const initializeNotificationMonitoring = (onStatusChange = null) => {
  console.log('Initializing drain notification monitoring...')
  
  const unsubscribe = startDrainMonitoring(onStatusChange)
  
  return unsubscribe
}

/**
 * Stop monitoring drains
 */
export const stopDrainMonitoring = (unsubscribe) => {
  if (unsubscribe) {
    unsubscribe()
    previousDrainStates.clear()
    console.log('Drain monitoring stopped')
  }
}

