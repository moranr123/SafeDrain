import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Layout from './components/Layout'
import RoleBasedRoute from './components/RoleBasedRoute'
import AdminLayout from './components/admin/AdminLayout'
// Auth pages
import Login from './pages/Login'
import Signup from './pages/Signup'
// Public/User pages
import Dashboard from './pages/Dashboard'
import Monitoring from './pages/Monitoring'
import Alerts from './pages/Alerts'
import SubmitReport from './pages/user/SubmitReport'
import ReportsList from './pages/user/ReportsList'
import ReportDetails from './pages/user/ReportDetails'
import MapView from './pages/user/MapView'
import UserProfile from './pages/user/UserProfile'
// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminMapView from './pages/admin/AdminMapView'
import ReportsManagement from './pages/admin/ReportsManagement'
import SensorMonitoring from './pages/admin/SensorMonitoring'
import NotificationCenter from './pages/admin/NotificationCenter'
import AdminSettings from './pages/admin/AdminSettings'
import AdminReportDetails from './pages/admin/AdminReportDetails'

// Component to handle role-based redirects
const AppRoutes = () => {
  const { currentUser, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route 
        path="/login" 
        element={
          currentUser ? (
            <Navigate 
              to={userRole === 'admin' ? '/admin/dashboard' : '/'} 
              replace 
            />
          ) : (
            <Login />
          )
        } 
      />
      <Route 
        path="/signup" 
        element={
          currentUser ? (
            <Navigate 
              to={userRole === 'admin' ? '/admin/dashboard' : '/'} 
              replace 
            />
          ) : (
            <Signup />
          )
        } 
      />

      {/* Admin Routes - Only accessible to admins */}
      <Route
        path="/admin/*"
        element={
          <RoleBasedRoute allowedRoles={['admin']} redirectTo="/">
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="map" element={<AdminMapView />} />
                <Route path="reports" element={<ReportsManagement />} />
                <Route path="reports/:id" element={<AdminReportDetails />} />
                <Route path="sensors" element={<SensorMonitoring />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </RoleBasedRoute>
        }
      />

      {/* User Routes - Only accessible to users */}
      <Route
        path="/*"
        element={
          <RoleBasedRoute allowedRoles={['user']} redirectTo="/admin/dashboard" requireAuth={true}>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/submit-report" element={<SubmitReport />} />
                <Route path="/reports" element={<ReportsList />} />
                <Route path="/reports/:id" element={<ReportDetails />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </RoleBasedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  )
}

export default App

