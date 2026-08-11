import { useAuth } from '../../auth/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { LogOut, Home, Clock, History, BarChart3, Users } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSyncCatalogs } from '../../hooks/useSyncCatalogs'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, isAdmin } = useAuth()
  const location = useLocation()

  // Ejecuta la sincronización en background
  const { isSyncing } = useSyncCatalogs()

  const navItems = [
    { path: '/produccion', label: 'Producción', icon: Home },
    { path: '/turnos', label: 'Turnos', icon: Clock },
    { path: '/historial', label: 'Historial', icon: History },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ]

  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Administración', icon: Users })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-4">
          <Link to="/produccion" className="text-2xl font-bold">
            🧵 Confección
          </Link>

          <nav className="flex gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded',
                  location.pathname === path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Indicador visual de sincronización */}
            {isSyncing && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Sincronizando...
              </span>
            )}
            
            <Button onClick={signOut} variant="ghost">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
          
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  )
}