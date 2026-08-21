import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../shared/lib/supabase'
import { useAuth } from '../shared/auth/AuthProvider'
import { Button } from '../shared/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const { session, isAdmin, isAuthLoading } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 1. BLOQUEO DECLARATIVO DE REDIRECCIÓN
  // Si AuthProvider está ocupado verificando tokens o roles, no se hace NADA (ni se muestra form ni se redirige).
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {/* Este es tu SplashScreen REAL, dictado por velocidad de red/disco, no artificial */}
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // 2. REDIRECCIÓN DETERMINISTA
  // Si ya hay sesión (y el rol ya fue cargado por AuthProvider), redirigir inmediatamente.
  if (session) {
    return <Navigate to={isAdmin ? "/admin" : "/produccion"} replace />
  }

  // 3. HANDLER LIMPIO DE AUTENTICACIÓN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!navigator.onLine) {
      setErrorMsg("Necesitas conexión a Internet para iniciar sesión por primera vez.")
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Error de login:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      setErrorMsg(errorMessage === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos.' 
        : 'Ocurrió un error al intentar acceder. Verifica tu conexión.')
    } finally {
      setIsSubmitting(false) 
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* LOGO & HEADER */}
        <div className="text-center mb-8">
          <img 
            src="/favicon.svg" 
            alt="LamkSew Logo" 
            className="w-12 h-12 mx-auto mb-4" 
            width={48} 
            height={48} 
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Acceso al Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* FEEDBACK DE ERROR */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-800" role="alert">
            <AlertCircle className="shrink-0 mt-0.5" size={18} aria-hidden="true" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-900">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isSubmitting}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-900">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-slate-900 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-shadow disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !email || !password}
            className="w-full min-h-11 mt-2 text-base font-bold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                Validando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </div>
    </main>
  )
}