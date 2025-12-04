import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserReports } from '../../services/reportService'
import { getSyncStatus, syncPendingOperations } from '../../services/offlineService'
import { syncPendingReports } from '../../services/reportService'
import { format } from 'date-fns'
import { User, Mail, Calendar, Wifi, WifiOff, RefreshCw, LogIn, UserPlus, AlertCircle, Loader } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Logo from '../../components/Logo'

const UserProfile = () => {
  const { currentUser, updateUserProfile, signup, login, logout } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState({ isOnline: true, pendingCount: 0 })
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [userStats, setUserStats] = useState({ totalReports: 0 })
  
  // Authentication states
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupDisplayName, setSignupDisplayName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '')
      fetchUserStats()
      updateSyncStatus()
    }

    // Update sync status periodically
    const interval = setInterval(updateSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [currentUser])

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

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      await login(email, password)
      setEmail('')
      setPassword('')
    } catch (error) {
      setAuthError(error.message || 'Failed to login. Please check your credentials.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters')
      setAuthLoading(false)
      return
    }

    try {
      await signup(email, password, signupDisplayName || null)
      setEmail('')
      setPassword('')
      setSignupDisplayName('')
      setAuthMode('login')
    } catch (error) {
      setAuthError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show login/signup form if not authenticated
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto space-y-6 pb-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Safe Drain</h1>
          <p className="text-text-secondary">
            {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <Card>
          {/* Toggle between login and signup */}
          <div className="flex gap-2 mb-6 p-1 bg-bg rounded-xl">
            <button
              onClick={() => {
                setAuthMode('login')
                setAuthError('')
                setEmail('')
                setPassword('')
                setSignupDisplayName('')
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                authMode === 'login'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <LogIn size={18} className="inline mr-2" />
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode('signup')
                setAuthError('')
                setEmail('')
                setPassword('')
                setSignupDisplayName('')
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                authMode === 'signup'
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              <UserPlus size={18} className="inline mr-2" />
              Sign Up
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {authMode === 'signup' && (
              <Input
                label="Display Name (optional)"
                type="text"
                value={signupDisplayName}
                onChange={(e) => setSignupDisplayName(e.target.value)}
                placeholder="Your name"
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
              required
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />

            {authError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={authLoading}
              className="w-full"
            >
              {authLoading ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  {authMode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                authMode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {authMode === 'login' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-text-secondary">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setAuthError('')
                  }}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}

          {authMode === 'signup' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setAuthMode('login')
                    setAuthError('')
                  }}
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Profile</h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                onClick={handleLogout}
                className="w-full"
              >
                <LogIn size={16} className="mr-2" />
                Sign Out
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
    </div>
  )
}

export default UserProfile

