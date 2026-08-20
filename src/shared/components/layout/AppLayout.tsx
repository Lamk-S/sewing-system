import { useAuth } from '../../auth/AuthProvider'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { LogOut, Home, Clock, History, BarChart3, Users, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useSyncCatalogs } from '../../hooks/useSyncCatalogs'
import Footer from '../Footer'

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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center py-4">
          
        <Link to={isAdmin ? "/admin" : "/produccion"} className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
          <img src="/favicon.svg" alt="LamkSew Logo" className="w-8 h-8" />
          LamkSew
        </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex gap-1.5">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors',
                  location.pathname === path
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Indicador de Sincronización (Regla semántica: Amber para procesos pendientes/activos) */}
            {!isAdmin && isSyncing && (
              <span className="hidden sm:flex text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full items-center gap-1.5">
                <RefreshCw size={12} className="animate-spin" />
                Sincronizando
              </span>
            )}
            
            <Button 
              onClick={signOut} 
              variant="ghost" 
              className="text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2 hidden sm:block" />
              Salir
            </Button>
          </div>
        </div>
        
        {/* Navegación Móvil */}
        <div className="md:hidden flex overflow-x-auto p-2 gap-2 bg-white border-t border-slate-100 scrollbar-hide">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors',
                  location.pathname === path
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 pb-20">
        {children}
      </main>

      <Footer />
    </div>
  )
}