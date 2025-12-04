import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  FileText,
  Activity,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Droplet,
  Home,
  Loader,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Logo from '../Logo'
import Modal from '../ui/Modal'

const AdminLayout = ({ children }) => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/map', icon: Map, label: 'Live Map' },
    { path: '/admin/reports', icon: FileText, label: 'Reports' },
    { path: '/admin/sensors', icon: Activity, label: 'Sensors' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Failed to sign out. Please try again.')
      setLoggingOut(false)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  useEffect(() => {
    // Close sidebar on route change (mobile)
    setSidebarOpen(false)
  }, [location])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }
    return () => {
      document.body.classList.remove('sidebar-open')
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Navigation */}
      <header className="bg-bg-surface border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-bg active:bg-bg transition-colors touch-manipulation"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <h1 className="text-xl font-semibold text-text hidden sm:block">Safe Drain Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
                <span>{currentUser.email}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogoutClick}
              disabled={loggingOut}
              className="flex items-center gap-2"
            >
              {loggingOut ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span className="hidden sm:inline">Signing Out...</span>
                </>
              ) : (
                <>
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-[57px] left-0 h-[calc(100vh-57px)]
            w-[280px] sm:w-64 bg-bg-surface border-r border-border
            z-[60] lg:z-40
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            overflow-y-auto
          `}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item, index) => {
              if (item.type === 'divider') {
                return <div key={`divider-${index}`} className="h-px bg-border my-2" />
              }
              
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl
                    transition-all duration-200 font-medium text-sm sm:text-base
                    touch-manipulation
                    ${
                      isActive(item.path)
                        ? 'bg-primary text-white shadow-chat'
                        : 'text-text-secondary hover:bg-bg hover:text-text active:bg-bg'
                    }
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-[calc(100vh-57px)] w-full">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => !loggingOut && setShowLogoutConfirm(false)}
        title="Confirm Sign Out"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-text mb-2">Are you sure you want to sign out?</p>
              <p className="text-sm text-text-secondary">
                You will need to sign in again to access the admin dashboard.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {loggingOut ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Signing Out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowLogoutConfirm(false)}
              disabled={loggingOut}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminLayout

