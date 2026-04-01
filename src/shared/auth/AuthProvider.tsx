import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSession } from './useSession'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: sessionLoading } = useSession()

  const { data: rol, isLoading: rolLoading } = useQuery({
    queryKey: ['rol', session?.user?.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_rol')
      if (error) throw error
      return data
    }
  })

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    isAdmin: rol === 'admin',
    loading: sessionLoading || rolLoading,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}