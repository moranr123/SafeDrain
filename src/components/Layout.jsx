import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  FileText,
  Map,
  User,
  Plus
} from 'lucide-react'
import Navbar from './ui/Navbar'
import Sidebar from './ui/Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/monitoring', icon: Activity, label: 'Monitoring' },
    { path: '/alerts', icon: Bell, label: 'Alerts' },
    { type: 'divider' },
    { path: '/submit-report', icon: Plus, label: 'Submit Report' },
    { path: '/reports', icon: FileText, label: 'Reports' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile Navbar */}
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        menuOpen={sidebarOpen}
      />

      <div className="flex relative">
        {/* Sidebar */}
        <Sidebar
          items={navItems}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen w-full">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

