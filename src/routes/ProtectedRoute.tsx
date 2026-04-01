import { Navigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/useAuth'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuth()

  if (loading) return <div>Cargando...</div>

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}