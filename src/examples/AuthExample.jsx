import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'

/**
 * Example component showing how to use Firebase Authentication
 */
const AuthExample = () => {
  const { currentUser, signup, login, logout, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await signup(email, password, displayName || null)
      setMessage('Account created successfully!')
      setEmail('')
      setPassword('')
      setDisplayName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await login(email, password)
      setMessage('Logged in successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setMessage('Logged out successfully!')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      await resetPassword(email)
      setMessage('Password reset email sent!')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-text mb-4">Authentication Example</h2>
        
        {currentUser ? (
          <div className="space-y-4">
            <div>
              <p className="text-text-secondary mb-2">Logged in as:</p>
              <p className="font-semibold text-text">{currentUser.email}</p>
              {currentUser.displayName && (
                <p className="text-text-secondary">{currentUser.displayName}</p>
              )}
            </div>
            <Button onClick={handleLogout} variant="danger">
              Logout
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                label="Display Name (optional)"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  Sign Up
                </Button>
                <Button type="button" variant="secondary" onClick={handleLogin} disabled={loading}>
                  Login
                </Button>
              </div>
            </form>
            <Button variant="ghost" onClick={handleResetPassword}>
              Reset Password
            </Button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
            {message}
          </div>
        )}
      </Card>
    </div>
  )
}

export default AuthExample

