import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)

  // Fetch user role from Firestore
  const fetchUserRole = async (userId, userEmail = '', userDisplayName = '') => {
    if (!userId) {
      setUserRole(null)
      return null
    }

    try {
      setRoleLoading(true)
      const userDoc = await getDoc(doc(db, 'users', userId))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const role = userData.role || 'user' // Default to 'user' if no role set
        setUserRole(role)
        return role
      } else {
        // Create user document with default role
        await setDoc(doc(db, 'users', userId), {
          email: userEmail || currentUser?.email || '',
          displayName: userDisplayName || currentUser?.displayName || '',
          role: 'user', // Default role
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        setUserRole('user')
        return 'user'
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('user') // Default to user on error
      return 'user'
    } finally {
      setRoleLoading(false)
    }
  }

  // Sign up with email and password
  const signup = async (email, password, displayName = null, role = 'user') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }

      // Create user document in Firestore with role
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName: displayName || '',
        role: role || 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      setUserRole(role || 'user')
      
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      throw error
    }
  }

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw error
    }
  }

  // Update password
  const changePassword = async (newPassword) => {
    try {
      await updatePassword(currentUser, newPassword)
    } catch (error) {
      throw error
    }
  }

  // Reauthenticate user (required before sensitive operations)
  const reauthenticate = async (password) => {
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password
      )
      await reauthenticateWithCredential(currentUser, credential)
      return true
    } catch (error) {
      throw error
    }
  }

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      await updateProfile(currentUser, updates)
    } catch (error) {
      throw error
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        // Fetch user role when user logs in
        await fetchUserRole(user.uid, user.email || '', user.displayName || '')
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check if user is admin
  const isAdmin = userRole === 'admin'
  
  // Check if user has specific role
  const hasRole = (role) => userRole === role

  const value = {
    currentUser,
    userRole,
    isAdmin,
    hasRole,
    fetchUserRole,
    signup,
    login,
    logout,
    resetPassword,
    changePassword,
    reauthenticate,
    updateUserProfile,
    loading: loading || roleLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

