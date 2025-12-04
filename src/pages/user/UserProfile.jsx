import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../contexts/NotificationContext'
import { getUserReports } from '../../services/reportService'
import { getSyncStatus, syncPendingOperations } from '../../services/offlineService'
import { syncPendingReports } from '../../services/reportService'
import { testNotification, checkNotificationStatus } from '../../utils/testNotifications'
import { format } from 'date-fns'
import { User, Calendar, Wifi, WifiOff, RefreshCw, LogIn, Loader, Bell, AlertCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'

const UserProfile = () => {
  const { currentUser, updateUserProfile, logout } = useAuth()
  const { permission, isMonitoring, requestPermission, startMonitoring, stopMonitoring } = useNotifications()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, pendingCount: 0 })
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [userStats, setUserStats] = useState({ totalReports: 0 })
  const [testingNotification, setTestingNotification] = useState(false)
  const [notificationStatus, setNotificationStatus] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '')
      fetchUserStats()
      updateSyncStatus()
    } else {
      // Redirect to login if not authenticated
      navigate('/login', { replace: true })
    }

    // Update sync status periodically
    const interval = setInterval(updateSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [currentUser, navigate])

  const fetchUserStats = async () => {
    try {
      const reports = await getUserReports(currentUser.uid)
      setUserStats({
        totalReports: reports.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateSyncStatus = async () => {
    const status = await getSyncStatus()
    setSyncStatus(status)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncPendingReports(currentUser.uid)
      setSyncResult({
        synced: result.synced,
        failed: result.failed
      })
      await updateSyncStatus()
      await fetchUserStats()
    } catch (error) {
      setSyncResult({
        error: error.message
      })
    } finally {
      setSyncing(false)
    }
  }

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

  // Show loading or redirect if not authenticated
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1 sm:mb-2">Profile</h1>
        <p className="text-sm sm:text-base text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Display Name
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="bg-bg cursor-not-allowed"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </Card>

          {/* Offline Sync */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text">Offline Sync</h2>
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <Wifi size={20} className="text-green-600" />
                ) : (
                  <WifiOff size={20} className="text-yellow-600" />
                )}
                <span className="text-sm text-text-secondary">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {syncStatus.pendingCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 mb-1">
                  {syncStatus.pendingCount} item{syncStatus.pendingCount !== 1 ? 's' : ''} pending sync
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing || !syncStatus.isOnline}
                  className="mt-2"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="animate-spin mr-2" size={16} />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            )}

            {syncResult && (
              <div className={`p-3 rounded-xl ${
                syncResult.error
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                {syncResult.error ? (
                  <p className="text-sm">Error: {syncResult.error}</p>
                ) : (
                  <p className="text-sm">
                    Synced {syncResult.synced} item{syncResult.synced !== 1 ? 's' : ''}
                    {syncResult.failed > 0 && `, ${syncResult.failed} failed`}
                  </p>
                )}
              </div>
            )}

            {syncStatus.pendingCount === 0 && syncStatus.isOnline && (
              <p className="text-sm text-text-secondary">All data is synced</p>
            )}
          </Card>

          {/* Notifications */}
          <Card>
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-text mb-1">Permission Status</p>
                <p className="text-sm text-text-secondary">
                  {permission === 'granted' ? (
                    <span className="text-green-600">✓ Enabled</span>
                  ) : permission === 'denied' ? (
                    <span className="text-red-600">✗ Denied</span>
                  ) : (
                    <span className="text-yellow-600">⚠ Not set</span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-text mb-1">Drain Monitoring</p>
                <p className="text-sm text-text-secondary">
                  {isMonitoring ? (
                    <span className="text-green-600">✓ Active</span>
                  ) : (
                    <span className="text-gray-600">Inactive</span>
                  )}
                </p>
              </div>

              {permission !== 'granted' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await requestPermission()
                      if (permission === 'granted') {
                        startMonitoring()
                      }
                    } catch (error) {
                      console.error('Error requesting permission:', error)
                    }
                  }}
                  className="w-full"
                >
                  <Bell size={16} className="mr-2" />
                  Enable Notifications
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  setTestingNotification(true)
                  setNotificationStatus(null)
                  try {
                    const status = checkNotificationStatus()
                    setNotificationStatus(status)
                    const success = await testNotification()
                    if (success) {
                      setNotificationStatus(prev => ({ ...prev, testSuccess: true }))
                    } else {
                      setNotificationStatus(prev => ({ ...prev, testSuccess: false }))
                    }
                  } catch (error) {
                    setNotificationStatus({ error: error.message })
                  } finally {
                    setTestingNotification(false)
                  }
                }}
                disabled={testingNotification || permission !== 'granted'}
                className="w-full"
              >
                {testingNotification ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Testing...
                  </>
                ) : (
                  <>
                    <Bell size={16} className="mr-2" />
                    Test Notification
                  </>
                )}
              </Button>

              {notificationStatus && (
                <div className="p-3 rounded-xl bg-bg border border-border">
                  <p className="text-xs font-medium text-text mb-2">Status:</p>
                  <pre className="text-xs text-text-secondary overflow-x-auto">
                    {JSON.stringify(notificationStatus, null, 2)}
                  </pre>
                </div>
              )}

              <div className="text-xs text-text-secondary">
                <p>• Notifications alert you when drains reach warning or critical status</p>
                <p>• Monitoring starts automatically when you enable notifications</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <User size={40} className="text-primary" />
              </div>
              <h3 className="font-semibold text-text">
                {currentUser.displayName || 'User'}
              </h3>
              <p className="text-sm text-text-secondary">{currentUser.email}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar size={16} />
                <span>
                  Joined {currentUser.metadata.creationTime 
                    ? format(new Date(currentUser.metadata.creationTime), 'MMM yyyy')
                    : 'Recently'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogoutClick}
                disabled={loggingOut}
                className="w-full"
              >
                {loggingOut ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogIn size={16} className="mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Statistics */}
          <Card>
            <h3 className="font-semibold text-text mb-4">Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-text">{userStats.totalReports}</p>
                <p className="text-sm text-text-secondary">Total Reports</p>
              </div>
            </div>
          </Card>
        </div>
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
                You will need to sign in again to access your account.
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

export default UserProfile

