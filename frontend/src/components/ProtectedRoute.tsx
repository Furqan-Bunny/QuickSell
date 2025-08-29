import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore()

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute