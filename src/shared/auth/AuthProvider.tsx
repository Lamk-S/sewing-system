import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        validarRol()
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        validarRol()
      } else {
        localStorage.removeItem('user_role')
        setIsAdmin(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const validarRol = async () => {
    try {
      if (!navigator.onLine) {
        const cachedRole = localStorage.getItem('user_role')
        setIsAdmin(cachedRole === 'admin')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_user_rol')
      
      if (error) throw error

      const isUserAdmin = data === 'admin'
      setIsAdmin(isUserAdmin)
      
      localStorage.setItem('user_role', data || 'trabajador')

    } catch (error) {
      console.warn('Error verificando rol (posible modo offline):', error)
      const cachedRole = localStorage.getItem('user_role')
      setIsAdmin(cachedRole === 'admin')
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}