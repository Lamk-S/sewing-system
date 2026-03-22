import { useAuth } from '../hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { LogOut, Home, Clock, History, BarChart3, Users } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { cn } from '../lib/utils'

interface Props {
  children: React.ReactNode
  session: Session
}

export default function AppLayout({ children, session }: Props) {
  const { signOut } = useAuth()
  const location = useLocation()
  const isAdmin = session.user.user_metadata?.rol === 'admin'

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/produccion" className="text-2xl font-bold text-gray-900">
              🧵 Confección
            </Link>
            
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex gap-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === path
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </nav>

              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}