import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/useAuth'

import Login from '../pages/Login'
import RegistroTrabajador from '../features/production/RegistroTrabajador'
import ProduccionHistory from '../features/production/ProduccionHistory'
import TurnoManager from '../features/production/TurnoManager'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../features/admin/AdminDashboard'

import ProtectedRoute from '../routes/ProtectedRoute'
import AdminRoute from '../routes/AdminRoute'
import AppLayout from '../shared/components/layout/AppLayout'

export default function RoutesApp() {
  const { session, loading, isAdmin } = useAuth()

  if (loading) return <div>Cargando app...</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Trabajador */}
      <Route
        path="/produccion"
        element={
          <ProtectedRoute>
            <AppLayout>
              <RegistroTrabajador />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/historial"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProduccionHistory />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/turnos"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TurnoManager />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* Redirect inteligente */}
      <Route
        path="/"
        element={
          session
            ? isAdmin
              ? <Navigate to="/admin" />
              : <Navigate to="/produccion" />
            : <Navigate to="/login" />
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}