# Role-Based System Documentation

## Overview

The Safe Drain application now uses a unified role-based system that combines the User App and Admin Dashboard into a single React codebase. Users see different layouts and have access to different routes based on their role.

## Roles

### User Role (`user`)
- Default role for all new users
- Access to user-facing features:
  - Dashboard
  - Monitoring
  - Alerts
  - Submit Report
  - Reports List
  - Map View
  - Profile

### Admin Role (`admin`)
- Administrative access
- Access to all user features PLUS:
  - Admin Dashboard
  - Admin Map View
  - Reports Management
  - Sensor Monitoring
  - Notification Center
  - Admin Settings

## How It Works

### 1. Role Storage
User roles are stored in Firestore `users` collection:
```javascript
{
  email: "user@example.com",
  displayName: "John Doe",
  role: "admin", // or "user"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. Role Fetching
- When a user logs in, their role is automatically fetched from Firestore
- If no user document exists, one is created with default role `"user"`
- Role is cached in `AuthContext` for quick access

### 3. Route Protection
Routes are protected using `RoleBasedRoute` component:
```jsx
<RoleBasedRoute allowedRoles={['admin']}>
  <AdminComponent />
</RoleBasedRoute>
```

### 4. Automatic Redirects
- Users without required role are redirected:
  - Admins accessing user routes → Stay on admin routes
  - Users accessing admin routes → Redirected to home
- Unauthenticated users → Redirected to `/login`

## File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # Manages auth + roles
├── components/
│   ├── RoleBasedRoute.jsx        # Role-based route protection
│   ├── ProtectedRoute.jsx        # Basic auth protection
│   ├── Layout.jsx                # User app layout
│   └── admin/
│       └── AdminLayout.jsx        # Admin dashboard layout
├── pages/
│   ├── Login.jsx                 # Unified login page
│   ├── Dashboard.jsx             # User dashboard
│   ├── Monitoring.jsx            # User monitoring
│   ├── Alerts.jsx                # User alerts
│   ├── user/                     # User-specific pages
│   └── admin/                    # Admin-specific pages
└── App.jsx                        # Main routing with role checks
```

## Usage Examples

### Check User Role
```javascript
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { userRole, isAdmin, hasRole } = useAuth()

  if (isAdmin) {
    // Admin-only code
  }

  if (hasRole('admin')) {
    // Admin-specific code
  }
}
```

### Protect a Route
```javascript
// Admin-only route
<RoleBasedRoute allowedRoles={['admin']}>
  <AdminComponent />
</RoleBasedRoute>

// User or Admin route
<RoleBasedRoute allowedRoles={['user', 'admin']}>
  <SharedComponent />
</RoleBasedRoute>
```

### Create Admin User
To create an admin user, update their document in Firestore:
```javascript
// In Firestore Console or via code
await updateDoc(doc(db, 'users', userId), {
  role: 'admin'
})
```

Or during signup (if you have admin creation privileges):
```javascript
await signup(email, password, displayName, 'admin')
```

## Authentication Flow

1. **User visits app** → Check if authenticated
2. **Not authenticated** → Show login page
3. **User logs in** → Fetch role from Firestore
4. **Role fetched** → Redirect based on role:
   - Admin → `/admin/dashboard`
   - User → `/` (home)
5. **Route access** → `RoleBasedRoute` checks role
6. **Unauthorized** → Redirect to appropriate page

## Layout System

### User Layout (`Layout.jsx`)
- Navbar with logo
- Sidebar with user navigation
- Main content area
- Mobile-responsive

### Admin Layout (`AdminLayout.jsx`)
- Admin-specific navbar
- Admin sidebar with admin navigation
- Main content area
- Mobile-responsive

Both layouts use the same ChatGPT-style UI components for consistency.

## Security

### Firestore Security Rules
Ensure your Firestore rules check user roles:
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}

match /drains/{drainId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### Route Protection
- All admin routes require `admin` role
- User routes accessible to both `user` and `admin`
- Unauthenticated users redirected to login

## Testing Roles

### Test as User
1. Create account (defaults to `user` role)
2. Login
3. Should see user layout
4. Cannot access `/admin/*` routes

### Test as Admin
1. Create account
2. Update role in Firestore to `admin`
3. Login
4. Should see admin layout
5. Can access both user and admin routes

## Migration Notes

- Old `/admin/login` route now redirects to `/login`
- Unified login page handles both user and admin login
- Role is automatically determined after login
- All existing components work with role-based system

