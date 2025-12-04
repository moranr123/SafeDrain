import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Protected Route Component
 * Use RoleBasedRoute for role-based access control
 * This component is kept for backward compatibility
 */
const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

