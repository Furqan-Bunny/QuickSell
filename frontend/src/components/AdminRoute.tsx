import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminLayout from './AdminLayout'
import LoadingSpinner from './LoadingSpinner'

const AdminRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner message="Loading admin panel..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <AdminLayout />
}

export default AdminRoute