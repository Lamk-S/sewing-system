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
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [splashTimerFinished, setSplashTimerFinished] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashTimerFinished(true)
    }, 1200)

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        const { data } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single()
        
        setIsAdmin(data?.rol === 'admin')
      }
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        const { data } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single()
        setIsAdmin(data?.rol === 'admin')
      } else {
        setIsAdmin(false)
      }
    })

    return () => {
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
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