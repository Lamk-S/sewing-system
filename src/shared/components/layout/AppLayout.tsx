import { useAuth } from '../../auth/AuthProvider'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { LogOut, Home, Clock, History, BarChart3, Users } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSyncCatalogs } from '../../hooks/useSyncCatalogs'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, isAdmin } = useAuth()
  const location = useLocation()
  const { isSyncing } = useSyncCatalogs()

  const navItems = isAdmin 
    ? [
        { path: '/admin', label: 'Panel de Control', icon: Users },
        { path: '/turnos', label: 'Monitor Turnos', icon: Clock },
      ]
    : [
        { path: '/produccion', label: 'Producción', icon: Home },
        { path: '/turnos', label: 'Mis Turnos', icon: Clock },
        { path: '/historial', label: 'Mi Historial', icon: History },
        { path: '/dashboard', label: 'Mi Rendimiento', icon: BarChart3 },
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-4">
          <Link to={isAdmin ? "/admin" : "/produccion"} className="text-2xl font-bold flex items-center gap-2">
            🧵 {isAdmin ? 'Admin Confección' : 'Confección'}
          </Link>

          <nav className="hidden md:flex gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                  location.pathname === path
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {!isAdmin && isSyncing && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Sincronizando...
              </span>
            )}
            
            <Button onClick={signOut} variant="ghost" className="text-gray-600 hover:bg-red-50 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
        
        {/* Menú móvil */}
        <div className="md:hidden flex overflow-x-auto p-2 gap-2 bg-white border-t">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap text-sm',
                  location.pathname === path
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
        </div>
      </header>

      <main className="p-4 md:p-6">{children}</main>
    </div>
  )
}