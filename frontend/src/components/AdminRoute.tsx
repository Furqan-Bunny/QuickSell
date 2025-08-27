import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminLayout from './AdminLayout'

const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <AdminLayout />
}

export default AdminRoute