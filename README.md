# Safe Drain - Smart Drain Monitoring System

A modern, mobile-responsive React application for monitoring and managing drain systems with real-time data visualization and alert management.

## 🎨 Design

The UI is inspired by ChatGPT's clean, minimalistic design:
- **Color Scheme**: White/gray background with green accent (#10a37f)
- **Style**: Rounded corners, subtle shadows, minimalistic components
- **Responsive**: Fully mobile-responsive with adaptive layouts

## 🏗️ Architecture Overview

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with custom ChatGPT-inspired components
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Formatting**: date-fns

### Backend
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (ready for implementation)
- **Storage**: Firebase Storage (for future file uploads)
- **Real-time**: Firestore real-time listeners for live updates

### Key Features
- ✅ Real-time drain monitoring
- ✅ Alert management system
- ✅ Dashboard with statistics
- ✅ Mobile-responsive design
- ✅ Clean, modern UI

## 📁 Project Structure

```
SafeDrain/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Layout.jsx     # Main layout with sidebar navigation
│   │   ├── StatCard.jsx   # Statistics display card
│   │   └── AlertCard.jsx  # Alert notification card
│   ├── config/
│   │   └── firebase.js    # Firebase configuration
│   ├── pages/             # Page components
│   │   ├── Dashboard.jsx  # Main dashboard
│   │   ├── Monitoring.jsx # Real-time monitoring
│   │   ├── Alerts.jsx     # Alert management
│   │   └── Settings.jsx  # System settings
│   ├── services/          # Business logic & API calls
│   │   └── drainService.js # Drain data operations
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles & Tailwind
├── .env.example           # Environment variables template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Firebase account (free tier works)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** (for development)
   - Choose your preferred location
4. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Copy the config values

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Step 4: Firestore Security Rules (Development)

For development, you can use test mode. For production, update rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 5: Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Step 6: Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## 📚 Libraries Used

### Core
- **react** (^18.2.0) - UI framework
- **react-dom** (^18.2.0) - React DOM rendering
- **react-router-dom** (^6.20.0) - Client-side routing

### Backend
- **firebase** (^10.7.1) - Firebase SDK (Firestore, Auth, Storage)

### UI & Styling
- **tailwindcss** (^3.3.6) - Utility-first CSS framework
- **lucide-react** (^0.294.0) - Modern icon library
- **date-fns** (^2.30.0) - Date formatting utilities

### Development
- **vite** (^5.0.8) - Fast build tool and dev server
- **@vitejs/plugin-react** - Vite plugin for React
- **eslint** - Code linting

## 🔧 Firebase Collections Structure

### `drains` Collection
```javascript
{
  name: string,
  location: string,
  description: string,
  status: 'active' | 'inactive' | 'maintenance' | 'warning' | 'critical',
  waterLevel: number,        // Percentage (0-100)
  flowRate: number,          // Liters per minute
  temperature: number,       // Celsius
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `readings` Collection
```javascript
{
  drainId: string,
  waterLevel: number,
  flowRate: number,
  temperature: number,
  timestamp: Timestamp
}
```

### `alerts` Collection
```javascript
{
  drainId: string,
  title: string,
  message: string,
  severity: 'critical' | 'warning' | 'info',
  read: boolean,
  createdAt: Timestamp
}
```

## 🎯 Features

### Dashboard
- Overview statistics
- Recent alerts
- Quick actions
- System status

### Monitoring
- Real-time drain status
- Live sensor readings
- Multiple drain management
- Status indicators

### Alerts
- Alert filtering (all, unread, critical, warning, info)
- Alert dismissal
- Timestamp display
- Severity indicators

### Settings
- Add/Edit/Delete drains
- Drain configuration
- Status management

## 📱 Mobile Responsive

The application is fully responsive with:
- Mobile-first design approach
- Collapsible sidebar navigation
- Adaptive grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use Firebase Security Rules in production
- Implement authentication for production use
- Validate all user inputs

## 🚧 Future Enhancements

- User authentication
- Data visualization charts
- Historical data analysis
- Email/SMS notifications
- Mobile app (React Native)
- IoT device integration
- Advanced analytics

## 📝 License

This project is part of a Capstone project.

## 🤝 Contributing

This is a Capstone project. For questions or suggestions, please contact the development team.

---

**Built with ❤️ for Smart Drain Monitoring**

