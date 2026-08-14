import { Navigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/AuthProvider'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/produccion" replace />
  }

  return <>{children}</>
}