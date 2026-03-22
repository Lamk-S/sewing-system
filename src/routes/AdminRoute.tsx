import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

type Props = {
  session: Session | null
  children: ReactNode
}

export default function AdminRoute({ session, children }: Props) {
  if (!session) return <Navigate to="/login" replace />

  if (session.user.user_metadata?.rol !== 'admin') {
    return <Navigate to="/produccion" replace />
  }

  return children
}