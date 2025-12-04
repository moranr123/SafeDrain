import { useEffect, useState, useRef } from 'react'
import { 
  requestNotificationPermission, 
  getFCMToken, 
  onForegroundMessage,
  getNotificationPermission,
  setupServiceWorker
} from '../services/fcmHelpers'
import { initializeNotificationMonitoring, stopDrainMonitoring } from '../services/notificationService'

/**
 * Custom hook for FCM notifications and drain monitoring
 * 
 * Usage:
 * const { token, permission, isMonitoring, startMonitoring, stopMonitoring } = useFCMNotifications()
 */
export const useFCMNotifications = (autoStart = false) => {
  const [token, setToken] = useState(null)
  const [permission, setPermission] = useState('default')
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [error, setError] = useState(null)
  const monitoringUnsubscribe = useRef(null)

  // Check permission on mount
  useEffect(() => {
    setPermission(getNotificationPermission())
  }, [])

  // Request notification permission
  const requestPermission = async () => {
    try {
      setError(null)
      const fcmToken = await requestNotificationPermission()
      setToken(fcmToken)
      setPermission(getNotificationPermission())
      return fcmToken
    } catch (err) {
      setError(err.message)
      console.error('Error requesting permission:', err)
      throw err
    }
  }

  // Get FCM token (if permission already granted)
  const getToken = async () => {
    try {
      setError(null)
      const fcmToken = await getFCMToken()
      setToken(fcmToken)
      setPermission(getNotificationPermission())
      return fcmToken
    } catch (err) {
      setError(err.message)
      console.error('Error getting token:', err)
      throw err
    }
  }

  // Start monitoring drains for alerts
  const startMonitoring = (onStatusChange = null) => {
    if (isMonitoring) {
      console.warn('Monitoring is already active')
      return
    }

    try {
      monitoringUnsubscribe.current = initializeNotificationMonitoring(onStatusChange)
      setIsMonitoring(true)
      console.log('Drain monitoring started')
    } catch (err) {
      setError(err.message)
      console.error('Error starting monitoring:', err)
    }
  }

  // Stop monitoring drains
  const stopMonitoring = () => {
    if (monitoringUnsubscribe.current) {
      stopDrainMonitoring(monitoringUnsubscribe.current)
      monitoringUnsubscribe.current = null
      setIsMonitoring(false)
      console.log('Drain monitoring stopped')
    }
  }

  // Initialize FCM and setup service worker
  const initializeFCM = async () => {
    try {
      setError(null)
      
      // Setup service worker
      await setupServiceWorker()
      
      // Request permission and get token
      const fcmToken = await requestPermission()
      
      // Listen for foreground messages
      onForegroundMessage((payload) => {
        console.log('FCM message received:', payload)
      })
      
      return fcmToken
    } catch (err) {
      setError(err.message)
      console.error('Error initializing FCM:', err)
      throw err
    }
  }

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && permission === 'default') {
      initializeFCM().catch(console.error)
    }
  }, [autoStart])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringUnsubscribe.current) {
        stopMonitoring()
      }
    }
  }, [])

  return {
    token,
    permission,
    isMonitoring,
    error,
    requestPermission,
    getToken,
    startMonitoring,
    stopMonitoring,
    initializeFCM
  }
}

