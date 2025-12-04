import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, Mail, Shield } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const AdminSettings = () => {
  const { currentUser, updateUserProfile } = useAuth()
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Settings</h1>
        <p className="text-text-secondary">Manage your admin account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-xl">
                <User className="text-primary" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-text">Profile Information</h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email"
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="bg-bg cursor-not-allowed"
              />
              {message && (
                <div className={`p-3 rounded-xl text-sm ${
                  message.includes('Error') 
                    ? 'bg-red-50 border border-red-200 text-red-600'
                    : 'bg-green-50 border border-green-200 text-green-600'
                }`}>
                  {message}
                </div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="text-blue-600" size={24} />
              </div>
              <h2 className="text-xl font-semibold text-text">Security</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                For security settings, please contact the system administrator.
              </p>
            </div>
          </Card>
        </div>

        {/* Account Info */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-text mb-4">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-text-secondary mb-1">User ID</p>
                <p className="font-mono text-xs text-text break-all">
                  {currentUser?.uid || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Account Type</p>
                <p className="text-text font-medium">Administrator</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings

