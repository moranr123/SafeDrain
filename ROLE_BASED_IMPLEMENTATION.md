# Role-Based System Implementation

## ✅ What Was Implemented

### 1. **Role Management in AuthContext** (`src/contexts/AuthContext.jsx`)
- ✅ Fetches user role from Firestore `users` collection
- ✅ Creates user document with default `'user'` role if doesn't exist
- ✅ Provides `userRole`, `isAdmin`, and `hasRole()` helper functions
- ✅ Automatically fetches role on login

### 2. **Role-Based Route Protection** (`src/components/RoleBasedRoute.jsx`)
- ✅ New component for role-based access control
- ✅ Supports single role or array of roles
- ✅ Automatic redirects for unauthorized access
- ✅ Preserves intended destination for login redirects

### 3. **Unified Routing** (`src/App.jsx`)
- ✅ Single codebase for both User App and Admin Dashboard
- ✅ Role-based route protection
- ✅ Automatic layout selection based on role
- ✅ Unified login page

### 4. **Unified Login** (`src/pages/Login.jsx`)
- ✅ Single login page for both users and admins
- ✅ Automatic redirect based on role after login
- ✅ Preserves intended destination

### 5. **Layout Updates**
- ✅ **User Layout** (`src/components/Layout.jsx`): Shows "Admin Dashboard" link if user is admin
- ✅ **Admin Layout** (`src/components/admin/AdminLayout.jsx`): Shows "User App" link to switch back
- ✅ Both layouts use ChatGPT-style UI components

## 🎯 How It Works

### Role Storage
User roles are stored in Firestore:
```javascript
// Firestore: users/{userId}
{
  email: "user@example.com",
  displayName: "John Doe",
  role: "admin", // or "user"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Authentication Flow
1. User logs in → Firebase Auth
2. Role fetched → From Firestore `users` collection
3. Default role → `'user'` if document doesn't exist
4. Redirect → Based on role:
   - Admin → `/admin/dashboard`
   - User → `/` (home)

### Route Protection
```jsx
// Admin-only route
<RoleBasedRoute allowedRoles={['admin']}>
  <AdminComponent />
</RoleBasedRoute>

// User or Admin route
<RoleBasedRoute allowedRoles={['user', 'admin']}>
  <SharedComponent />
</RoleBasedRoute>
```

## 📁 File Structure

```
src/
├── contexts/
│   └── AuthContext.jsx          # ✅ Role management added
├── components/
│   ├── RoleBasedRoute.jsx        # ✅ NEW: Role-based protection
│   ├── ProtectedRoute.jsx         # ✅ Updated for compatibility
│   ├── Layout.jsx                # ✅ Shows admin link if admin
│   └── admin/
│       └── AdminLayout.jsx        # ✅ Shows user app link
├── pages/
│   ├── Login.jsx                 # ✅ NEW: Unified login
│   ├── Dashboard.jsx             # User dashboard
│   ├── Monitoring.jsx            # User monitoring
│   ├── Alerts.jsx                # User alerts
│   ├── user/                     # User pages
│   └── admin/                    # Admin pages
└── App.jsx                        # ✅ Role-based routing
```

## 🔐 Security Features

### Route Protection
- ✅ Admin routes require `admin` role
- ✅ User routes accessible to both `user` and `admin`
- ✅ Unauthorized access → Automatic redirect

### Firestore Security
Update your Firestore rules to check roles:
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

## 🚀 Usage

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

### Create Admin User
**Option 1: Via Firestore Console**
1. Go to Firestore Console
2. Navigate to `users` collection
3. Find user document
4. Update `role` field to `"admin"`

**Option 2: Via Code** (if you have admin privileges)
```javascript
import { doc, updateDoc } from 'firebase/firestore'
import { db } from './config/firebase'

await updateDoc(doc(db, 'users', userId), {
  role: 'admin'
})
```

## 🎨 UI Features

### User Layout
- Shows all user navigation items
- **If admin**: Shows "Admin Dashboard" link at bottom
- ChatGPT-style UI components

### Admin Layout
- Shows all admin navigation items
- Shows "User App" link to switch back to user view
- ChatGPT-style UI components

## 📋 Routes

### Public Routes
- `/login` - Unified login page

### User Routes (accessible to all)
- `/` - Dashboard
- `/monitoring` - Monitoring
- `/alerts` - Alerts
- `/submit-report` - Submit Report
- `/reports` - Reports List
- `/reports/:id` - Report Details
- `/map` - Map View
- `/profile` - Profile

### Admin Routes (admin only)
- `/admin/dashboard` - Admin Dashboard
- `/admin/map` - Admin Map View
- `/admin/reports` - Reports Management
- `/admin/reports/:id` - Admin Report Details
- `/admin/sensors` - Sensor Monitoring
- `/admin/notifications` - Notification Center
- `/admin/settings` - Admin Settings

## ✅ Benefits

1. **Single Codebase**: One React app for both user and admin
2. **Role-Based Access**: Automatic route protection
3. **Unified Login**: One login page for all users
4. **Seamless Switching**: Admins can switch between user and admin views
5. **ChatGPT UI**: Consistent styling across all components
6. **Secure**: Role-based route protection

## 🔄 Migration Notes

- ✅ Old `/admin/login` redirects to `/login`
- ✅ All existing components work with role system
- ✅ User documents automatically created with `'user'` role
- ✅ No breaking changes to existing functionality

