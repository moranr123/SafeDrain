import { createContext, useContext, useEffect, useState } from 'react'
import { useFCMNotifications } from '../hooks/useFCMNotifications'
import { useAuth } from './AuthContext'
import { getNotificationPermission } from '../services/fcmHelpers'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const {
    token,
    permission,
    isMonitoring,
    error,
    requestPermission,
    getToken,
    startMonitoring,
    stopMonitoring,
    initializeFCM
  } = useFCMNotifications(false) // Don't auto-start, we'll do it manually

  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize FCM when user is logged in
  useEffect(() => {
    if (currentUser && !isInitialized) {
      const init = async () => {
        try {
          // Setup service worker first
          const { setupServiceWorker } = await import('../services/fcmHelpers')
          await setupServiceWorker()

          // Try to get token if permission already granted
          const currentPermission = getNotificationPermission()
          if (currentPermission === 'granted') {
            try {
              await getToken()
            } catch (err) {
              console.warn('Could not get FCM token:', err)
            }
          }

          // Start monitoring drains for alerts
          startMonitoring((drain, newStatus, oldStatus) => {
            console.log(`Drain ${drain.name} status changed: ${oldStatus} -> ${newStatus}`)
          })

          setIsInitialized(true)
        } catch (error) {
          console.error('Error initializing notifications:', error)
        }
      }

      init()
    } else if (!currentUser && isMonitoring) {
      // Stop monitoring when user logs out
      stopMonitoring()
      setIsInitialized(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isInitialized])

  const value = {
    token,
    permission,
    isMonitoring,
    error,
    isInitialized,
    requestPermission,
    getToken,
    startMonitoring,
    stopMonitoring,
    initializeFCM
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

