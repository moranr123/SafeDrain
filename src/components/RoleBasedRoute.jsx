import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Role-based route protection
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string|string[]} props.allowedRoles - Role(s) allowed to access this route
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: '/')
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
const RoleBasedRoute = ({ 
  children, 
  allowedRoles = ['user', 'admin'], 
  redirectTo = '/',
  requireAuth = true 
}) => {
  const { currentUser, userRole, loading } = useAuth()
  const location = useLocation()

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  // Check if authentication is required
  if (requireAuth && !currentUser) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (currentUser) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    
    if (!roles.includes(userRole)) {
      // User doesn't have required role - redirect based on their role
      // Admins trying to access user routes → redirect to admin dashboard
      // Users trying to access admin routes → redirect to user home
      const redirectPath = userRole === 'admin' ? '/admin/dashboard' : redirectTo
      return <Navigate to={redirectPath} replace />
    }
  }

  return children
}

export default RoleBasedRoute

