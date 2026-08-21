import { Link } from 'react-router-dom'
import { AlertTriangle, Home } from 'lucide-react'
import { useAuth } from '../shared/auth/AuthProvider'

export default function NotFound() {
  const { session, isAdmin } = useAuth()
  
  const homePath = !session ? '/' : isAdmin ? '/admin' : '/produccion'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
        <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Página no encontrada</h2>
        <p className="text-slate-500 mb-8">
          La página a la que intentas acceder no existe, fue movida o no tienes permisos para verla.
        </p>

        <Link 
          to={homePath}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Home size={20} />
          Volver al Inicio
        </Link>
      </div>
    </div>
  )
}