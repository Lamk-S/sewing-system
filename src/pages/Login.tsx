import { useState, useEffect } from 'react'
import { supabase } from '../shared/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../shared/auth/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const navigate = useNavigate()
  const { session, isAdmin, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && session) {
      if (isAdmin) navigate('/admin')
      else navigate('/produccion')
    }
  }, [session, isAdmin, authLoading, navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
    } else {
      if (isSignUp) {
        toast.success('Registro exitoso. Ahora inicia sesión.')
      }
    }

    setLoading(false)
  }

  if (authLoading) {
    return <div className="text-center mt-10">Cargando...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700"
          >
            {loading
              ? 'Cargando...'
              : isSignUp
              ? 'Registrarse'
              : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-sm text-blue-600 mt-4 hover:underline"
        >
          {isSignUp
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  )
}