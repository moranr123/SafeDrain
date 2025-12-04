import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize FCM (optional - uncomment if you want notifications on app start)
// import { initializeFCM } from './services/fcmHelpers'
// initializeFCM().catch(console.error)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

