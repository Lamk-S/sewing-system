import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextType = {
  session: Session | null
  isAdmin: boolean
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)