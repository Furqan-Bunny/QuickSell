import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, token } = useAuthStore()

  // Only show loading if we're actually loading and don't have a token
  // This prevents unnecessary loading states when auth is already in localStorage
  if (isLoading && !token) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute