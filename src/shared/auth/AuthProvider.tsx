import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { SplashScreen } from '../components/ui/SplashScreen'

type AuthContextType = {
  session: Session | null
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isAdmin: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('lamksew_isAdmin') === 'true'
  })
  
  const [loading, setLoading] = useState(true)
  const [splashTimerFinished, setSplashTimerFinished] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashTimerFinished(true)
    }, 1200)

    const fetchRole = async (userId: string) => {
      if (!navigator.onLine) return;

      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', userId)
          .single()

        if (!error && data) {
          const isUserAdmin = data.rol === 'admin'
          setIsAdmin(isUserAdmin)
          localStorage.setItem('lamksew_isAdmin', String(isUserAdmin))
        }
      } catch (err) {
        console.error('Error al obtener el rol del usuario', err)
      }
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        await fetchRole(session.user.id)
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await fetchRole(session.user.id)
      } else {
        setIsAdmin(false)
        localStorage.removeItem('lamksew_isAdmin')
      }
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    localStorage.removeItem('lamksew_isAdmin')
    await supabase.auth.signOut()
  }

  if (loading || !splashTimerFinished) {
    return <SplashScreen message="Cargando entorno de trabajo..." />
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)