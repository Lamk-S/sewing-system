import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  isAdmin: boolean
  isAuthLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  isAdmin: false,
  isAuthLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true;

    const fetchAndCacheRole = async (user: User) => {
      const cacheKey = `lamksew_role_${user.id}`;
      
      if (!navigator.onLine) {
        return localStorage.getItem(cacheKey) === 'admin';
      }

      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const isUserAdmin = data.rol === 'admin';
          localStorage.setItem(cacheKey, String(isUserAdmin));
          return isUserAdmin;
        }
      } catch (err) {
        console.error('Error fetching role:', err);
      }

      return localStorage.getItem(cacheKey) === 'admin';
    }

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            const adminStatus = await fetchAndCacheRole(currentSession.user);
            setIsAdmin(adminStatus);
          }
        }
      } finally {
        if (mounted) setIsAuthLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
      } else if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        if (event === 'SIGNED_IN') setIsAuthLoading(true); 
        const adminStatus = await fetchAndCacheRole(newSession.user);
        setIsAdmin(adminStatus);
        if (event === 'SIGNED_IN') setIsAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, isAuthLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)