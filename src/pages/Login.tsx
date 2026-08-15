import { useState, useEffect } from 'react'
import { supabase } from '../shared/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../shared/auth/AuthProvider'
import { LogIn } from 'lucide-react'
import { SplashScreen } from '../shared/components/ui/SplashScreen'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const navigate = useNavigate()
  const { session, isAdmin } = useAuth()

  useEffect(() => {
    if (session) {
      const delayTime = loading ? 2000 : 0;
      
      const timer = setTimeout(() => {
        if (isAdmin) navigate('/admin', { replace: true })
        else navigate('/produccion', { replace: true })
      }, delayTime)

      return () => clearTimeout(timer)
    }
  }, [session, isAdmin, navigate, loading])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else if (isSignUp) {
      toast.success('Registro exitoso. Tu cuenta debe ser aprobada.')
      setIsSignUp(false)
      setLoading(false)
    }
  }

  return (
    <>
      {loading && <SplashScreen message="Autenticando credenciales..." />}

      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="w-full max-w-sm">
          
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <img 
              src="/favicon.svg"
              alt="Logo LamkSew" 
              className="w-20 h-20 mx-auto mb-4 drop-shadow-sm"
              onError={(e) => { e.currentTarget.src = "/pwa-192x192.png" }}
            />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LamkSew</h1>
            <p className="text-slate-500 text-sm mt-1">Gestión de Producción y Pagos</p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-100 animate-in zoom-in-95 duration-300">
            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-slate-50 focus:bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-slate-50 focus:bg-white text-slate-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground p-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-[0.98] flex justify-center items-center shadow-sm"
              >
                <LogIn className="mr-2" size={20} />
                {isSignUp ? 'Registrarme' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-slate-500 hover:text-primary font-medium transition-colors"
              >
                {isSignUp ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo trabajador? Regístrate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}