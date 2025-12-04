import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/admin/AdminLayout'
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
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminMapView from './pages/admin/AdminMapView'
import ReportsManagement from './pages/admin/ReportsManagement'
import SensorMonitoring from './pages/admin/SensorMonitoring'
import NotificationCenter from './pages/admin/NotificationCenter'
import AdminSettings from './pages/admin/AdminSettings'
import AdminReportDetails from './pages/admin/AdminReportDetails'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="map" element={<AdminMapView />} />
                    <Route path="reports" element={<ReportsManagement />} />
                    <Route path="reports/:id" element={<AdminReportDetails />} />
                    <Route path="sensors" element={<SensorMonitoring />} />
                    <Route path="notifications" element={<NotificationCenter />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<AdminDashboard />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Public/User Routes */}
          <Route
            path="/*"
            element={
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
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

