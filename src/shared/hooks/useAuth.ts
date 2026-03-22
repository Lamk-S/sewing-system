import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

type UserRole = Database['public']['Enums']['rol_usuario']

interface EnhancedUser extends User {
  rol?: UserRole
}

interface EnhancedSession extends Session {
  user: EnhancedUser
}

export function useAuth() {
  const [session, setSession] = useState<EnhancedSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)

  // 🔹 Función para mejorar la sesión con rol
  const enhanceSession = useCallback((session: Session): EnhancedSession => {
    return {
      ...session,
      user: {
        ...session.user,
        rol:
          (session.user.user_metadata?.rol as UserRole) ||
          'trabajador',
      },
    }
  }, [])

  // 🔹 Cargar rol desde la base de datos
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error cargando rol:', error)
      }

      setUserRole(data?.rol ?? 'trabajador')

    } catch (error) {
      console.error('Error cargando rol:', error)
      setUserRole('trabajador')
    }
  }, [])

  // 🔹 Cargar sesión inicial y escuchar cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const enhanced = session ? enhanceSession(session) : null
      setSession(enhanced)

      if (session?.user) {
        loadUserRole(session.user.id)
      }

      setLoading(false)
    })

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {

        const enhanced = session ? enhanceSession(session) : null
        setSession(enhanced)

        if (session?.user) {
          await loadUserRole(session.user.id)
        } else {
          setUserRole(null)
        }

        setLoading(false)
      })

    return () => subscription.unsubscribe()

  }, [enhanceSession, loadUserRole])

  // 🔹 Sign out seguro
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      setSession(null)
      setUserRole(null)

      return { error: null }

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error signing out:', error)
        return { error: error.message }
      }

      return { error: 'Unknown error' }
    }
  }, [])

  // 🔹 Sesión final con rol correcto
  const enhancedSession = useMemo(() => {
    if (!session) return null

    return {
      ...session,
      user: {
        ...session.user,
        rol: userRole ?? session.user.rol ?? 'trabajador',
      },
    }
  }, [session, userRole])

  // 🔹 Verificar si es admin
  const isAdmin = useMemo(() => {
    return enhancedSession?.user.rol === 'admin'
  }, [enhancedSession])

  return {
    session: enhancedSession,
    loading,
    userRole,
    isAdmin,
    signOut,
  }
}