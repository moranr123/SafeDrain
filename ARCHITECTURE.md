# Safe Drain - Architecture Overview

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │Dashboard │  │Monitoring │  │  Alerts  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│         │            │            │                    │
│         └────────────┼────────────┘                    │
│                      │                                  │
│              ┌───────▼───────┐                        │
│              │  drainService │                        │
│              └───────┬───────┘                        │
└──────────────────────┼─────────────────────────────────┘
                       │
                       │ Firebase SDK
                       │
┌──────────────────────▼─────────────────────────────────┐
│              Firebase Backend                          │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │  Firestore   │  │   Firebase   │                  │
│  │   Database   │  │    Auth      │                  │
│  └──────────────┘  └──────────────┘                  │
│                                                         │
│  Collections:                                          │
│  • drains                                             │
│  • readings                                           │
│  • alerts                                             │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App
└── Router
    └── Layout
        ├── Sidebar Navigation
        └── Routes
            ├── Dashboard
            │   ├── StatCard (x4)
            │   ├── AlertCard (x5)
            │   └── Quick Actions
            ├── Monitoring
            │   ├── Drain List
            │   └── Drain Details
            ├── Alerts
            │   └── AlertCard (filtered)
            └── Settings
                ├── Add/Edit Form
                └── Drains List
```

## Data Flow

### 1. Reading Data Flow
```
Firestore → drainService → React Component → UI Update
```

### 2. Real-time Updates Flow
```
Firestore Change → onSnapshot Listener → drainService Callback → Component State Update → UI Re-render
```

### 3. Writing Data Flow
```
User Action → Component Handler → drainService → Firestore → Success/Error → UI Feedback
```

## State Management

### Local Component State
- Uses React `useState` hooks for component-level state
- Each page manages its own data fetching and state

### Real-time Subscriptions
- Uses Firestore `onSnapshot` for real-time updates
- Subscriptions are cleaned up on component unmount

### Data Flow Pattern
```javascript
// Fetch on mount
useEffect(() => {
  fetchData()
}, [])

// Real-time subscription
useEffect(() => {
  const unsubscribe = subscribeToData(callback)
  return () => unsubscribe()
}, [dependencies])
```

## Service Layer

### drainService.js

Provides abstraction layer for Firebase operations:

#### Functions:
- **Drain Management**
  - `getDrains()` - Fetch all drains
  - `getDrain(id)` - Fetch single drain
  - `addDrain(data)` - Create new drain
  - `updateDrain(id, data)` - Update drain
  - `deleteDrain(id)` - Delete drain
  - `subscribeToDrain(id, callback)` - Real-time drain updates

- **Readings**
  - `getReadings(drainId, limit)` - Fetch historical readings
  - `addReading(data)` - Add new reading
  - `subscribeToReadings(drainId, callback)` - Real-time readings

- **Alerts**
  - `getAlerts()` - Fetch all alerts
  - `addAlert(data)` - Create alert
  - `markAlertAsRead(id)` - Mark alert as read

## Styling Architecture

### Tailwind CSS Configuration
- Custom color palette with primary green (#10a37f)
- Custom utility classes in `index.css`
- Component-level styling with Tailwind utilities

### Design System
- **Colors**: Primary green, gray scale, status colors
- **Spacing**: Consistent 4px grid system
- **Typography**: System fonts with clear hierarchy
- **Components**: Reusable card, button, input styles

## Routing Structure

```
/ (Dashboard)
├── /monitoring (Real-time Monitoring)
├── /alerts (Alert Management)
└── /settings (System Settings)
```

## Firebase Integration

### Firestore Collections

#### drains
- Stores drain configuration and current status
- Real-time updates via `onSnapshot`
- Indexed by `createdAt` for sorting

#### readings
- Historical sensor data
- Indexed by `timestamp` for time-series queries
- Linked to drains via `drainId`

#### alerts
- System alerts and notifications
- Indexed by `createdAt` for chronological order
- Status tracking with `read` boolean

### Security Rules (Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Or custom rules per collection
    match /drains/{drainId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.data.keys().hasAll(['name', 'location']);
    }
  }
}
```

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Routes can be code-split
2. **Pagination**: Readings limited to 100 by default
3. **Real-time Efficiency**: Subscriptions only when needed
4. **Memoization**: Can add React.memo for expensive components
5. **Image Optimization**: Ready for Firebase Storage integration

### Bundle Size
- Vite for fast builds and HMR
- Tree-shaking for unused code elimination
- Code splitting ready for production

## Mobile Responsiveness

### Breakpoints
- **Mobile**: < 768px (single column, hamburger menu)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (full layout, sidebar always visible)

### Mobile Features
- Collapsible sidebar with overlay
- Touch-friendly button sizes
- Responsive grid layouts
- Optimized typography scaling

## Error Handling

### Strategy
- Try-catch blocks in service functions
- Console error logging
- User-friendly error messages
- Graceful degradation

### Error States
- Loading states during data fetch
- Empty states for no data
- Error messages for failed operations

## Testing Strategy (Future)

### Unit Tests
- Service functions
- Utility functions
- Component logic

### Integration Tests
- Firebase operations
- Component interactions
- Routing

### E2E Tests
- User workflows
- Critical paths
- Mobile interactions

## Deployment

### Build Process
```bash
npm run build  # Creates optimized production build
```

### Deployment Options
1. **Firebase Hosting**
   ```bash
   npm install -g firebase-tools
   firebase init hosting
   firebase deploy
   ```

2. **Vercel/Netlify**
   - Connect GitHub repository
   - Auto-deploy on push

3. **Traditional Hosting**
   - Upload `dist/` folder
   - Configure web server

## Environment Configuration

### Development
- `.env` file with Firebase credentials
- Hot module replacement
- Source maps enabled

### Production
- Environment variables in hosting platform
- Minified and optimized build
- Source maps disabled

## Future Architecture Enhancements

### State Management
- Consider Redux/Zustand for complex state
- Global state for user authentication
- Caching layer for offline support

### API Layer
- RESTful API wrapper (if needed)
- GraphQL (if complex queries)
- WebSocket for real-time (alternative to Firestore)

### Microservices (Advanced)
- Separate API service
- Notification service
- Analytics service
- IoT device gateway

---

**Architecture Version**: 1.0  
**Last Updated**: 2024

