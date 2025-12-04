// Firebase Cloud Messaging Service Worker
// This file handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize Firebase in the service worker
// Update these values with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAMi4W0m1fYlzqGkLe8qmjTCGFHHYLQvjs",
  authDomain: "safedrain-b50e8.firebaseapp.com",
  projectId: "safedrain-b50e8",
  storageBucket: "safedrain-b50e8.firebasestorage.app",
  messagingSenderId: "1054290945578",
  appId: "1:1054290945578:web:26b6bf071899f46255c553",
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  
  const notificationTitle = payload.notification?.title || 'Safe Drain'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/src/assets/logo.png',
    badge: '/src/assets/logo.png',
    tag: 'safedrain-notification',
    requireInteraction: false,
    data: payload.data || {}
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.')
  
  event.notification.close()
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

