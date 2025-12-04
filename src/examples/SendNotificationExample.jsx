import { useState } from 'react'
import { sendCustomNotification } from '../services/notificationService'
import { getFCMToken } from '../services/fcmHelpers'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'

/**
 * Example component showing how to send notifications
 * 
 * Note: This shows how to send browser notifications from the frontend.
 * For sending FCM push notifications from a backend server, you would use
 * the Firebase Admin SDK. See the backend example below.
 */
const SendNotificationExample = () => {
  const [title, setTitle] = useState('Test Notification')
  const [body, setBody] = useState('This is a test notification from Safe Drain')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  const handleSendNotification = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const success = await sendCustomNotification(title, body)
      if (success) {
        setMessage('Notification sent successfully!')
      } else {
        setMessage('Failed to send notification. Please grant permission.')
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetToken = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const fcmToken = await getFCMToken()
      setToken(fcmToken)
      setMessage('FCM Token retrieved! Copy it to use with backend notifications.')
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Send Notification Example</h1>
        <p className="text-text-secondary">
          Example of sending browser notifications and getting FCM token
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">Send Browser Notification</h2>
        <div className="space-y-4">
          <Input
            label="Notification Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
          />
          <Textarea
            label="Notification Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message"
            rows="3"
          />
          <Button
            onClick={handleSendNotification}
            disabled={loading || !title || !body}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">Get FCM Token</h2>
        <p className="text-sm text-text-secondary mb-4">
          Get your FCM token to use with backend push notifications
        </p>
        <div className="space-y-4">
          <Button
            onClick={handleGetToken}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {loading ? 'Getting Token...' : 'Get FCM Token'}
          </Button>
          {token && (
            <div className="p-4 bg-bg rounded-xl">
              <p className="text-xs font-medium text-text-secondary mb-2">FCM Token:</p>
              <p className="text-xs font-mono text-text break-all">{token}</p>
              <Button
                onClick={() => navigator.clipboard.writeText(token)}
                size="sm"
                variant="secondary"
                className="mt-2"
              >
                Copy Token
              </Button>
            </div>
          )}
        </div>
      </Card>

      {message && (
        <Card className={message.includes('Error') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
          <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold text-text mb-4">Backend Notification Example</h2>
        <p className="text-sm text-text-secondary mb-4">
          To send push notifications from a backend server, use the Firebase Admin SDK:
        </p>
        <pre className="p-4 bg-bg rounded-xl text-xs overflow-x-auto">
{`// Node.js example using Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
const message = {
  notification: {
    title: 'Drain Alert',
    body: 'A drain has reached critical status!'
  },
  token: 'USER_FCM_TOKEN', // Get from frontend
  data: {
    drainId: 'drain123',
    status: 'critical'
  }
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });`}
        </pre>
      </Card>
    </div>
  )
}

export default SendNotificationExample

