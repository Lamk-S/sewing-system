import { Navigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/AuthProvider'

export default function RequireWorker({ children }: { children: React.ReactNode }) {
  const { session, isAdmin } = useAuth()

  if (!session) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  
  return <>{children}</>
}