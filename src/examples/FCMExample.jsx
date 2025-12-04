import { useState, useEffect } from 'react'
import {
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  isNotificationSupported,
  getNotificationPermission,
  initializeFCM
} from '../services/fcmHelpers'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

/**
 * Example component showing how to use Firebase Cloud Messaging
 */
const FCMExample = () => {
  const [token, setToken] = useState('')
  const [permission, setPermission] = useState('')
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check if notifications are supported
    setSupported(isNotificationSupported())
    setPermission(getNotificationPermission())

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Received message:', payload)
      setMessage(JSON.stringify(payload, null, 2))
    })

    return () => unsubscribe()
  }, [])

  const handleRequestPermission = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const fcmToken = await requestNotificationPermission()
      setToken(fcmToken)
      setPermission(getNotificationPermission())
      setMessage('Notification permission granted! Token saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGetToken = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const fcmToken = await getFCMToken()
      setToken(fcmToken)
      setMessage('FCM token retrieved successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const fcmToken = await initializeFCM((payload) => {
        setMessage(JSON.stringify(payload, null, 2))
      })
      setToken(fcmToken)
      setPermission(getNotificationPermission())
      setMessage('FCM initialized successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token)
      setMessage('Token copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">Cloud Messaging Example</h2>

        <div className="space-y-4">
          <div className="p-4 bg-bg rounded-xl">
            <p className="text-sm text-text-secondary mb-2">Notification Support:</p>
            <p className="font-medium text-text">
              {supported ? '✅ Supported' : '❌ Not Supported'}
            </p>
          </div>

          <div className="p-4 bg-bg rounded-xl">
            <p className="text-sm text-text-secondary mb-2">Current Permission:</p>
            <p className="font-medium text-text capitalize">
              {permission === 'granted' && '✅ Granted'}
              {permission === 'denied' && '❌ Denied'}
              {permission === 'default' && '⏳ Not Requested'}
              {permission === 'not-supported' && '❌ Not Supported'}
            </p>
          </div>

          {token && (
            <div className="p-4 bg-bg rounded-xl">
              <p className="text-sm text-text-secondary mb-2">FCM Token:</p>
              <p className="text-xs font-mono text-text break-all mb-2">{token}</p>
              <Button size="sm" variant="secondary" onClick={copyToken}>
                Copy Token
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRequestPermission}
              disabled={loading || !supported}
            >
              Request Permission
            </Button>
            <Button
              variant="secondary"
              onClick={handleGetToken}
              disabled={loading || !supported}
            >
              Get Token
            </Button>
            <Button
              variant="secondary"
              onClick={handleInitialize}
              disabled={loading || !supported}
            >
              Initialize FCM
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-green-600 text-sm mb-2">{message}</p>
              {message.includes('{') && (
                <pre className="text-xs text-text-secondary bg-white p-2 rounded overflow-auto">
                  {message}
                </pre>
              )}
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-800 font-semibold mb-2">📝 Note:</p>
            <p className="text-xs text-blue-700">
              To receive notifications, you need to:
              <br />
              1. Add VITE_FIREBASE_VAPID_KEY to your .env file
              <br />
              2. Get the VAPID key from Firebase Console → Project Settings → Cloud Messaging
              <br />
              3. Send notifications from your backend using the FCM token
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FCMExample

