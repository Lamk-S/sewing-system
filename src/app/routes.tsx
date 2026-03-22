import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import AdminRoute from '../routes/AdminRoute'
import Login from '../components/auth/Login'

import RegistroTrabajador from '../features/production/RegistroTrabajador'
import TurnoManager from '../features/production/TurnoManager'
import ProduccionHistory from '../features/production/ProduccionHistory'
import Dashboard from '../features/reports/Dashboard'
import AdminDashboard from '../features/admin/AdminDashboard'

import AppLayout from '../shared/components/layout/AppLayout'

type RouteWrapperProps = {
  session: Session | null
  children: ReactNode
}

type AppRoutesProps = {
  session: Session | null
}

function PrivateLayout({ session, children }: RouteWrapperProps) {
  if (!session) return <Navigate to="/login" replace />

  return (
    <AppLayout session={session}>
      {children}
    </AppLayout>
  )
}

export default function AppRoutes({ session }: AppRoutesProps) {
  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={!session ? <Login /> : <Navigate to="/produccion" replace />}
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <AdminRoute session={session}>
            <AppLayout session={session!}>
              <AdminDashboard />
            </AppLayout>
          </AdminRoute>
        }
      />

      {/* PRODUCCIÓN */}
      <Route
        path="/produccion"
        element={
          <PrivateLayout session={session}>
            <RegistroTrabajador />
          </PrivateLayout>
        }
      />

      {/* TURNOS */}
      <Route
        path="/turnos"
        element={
          <PrivateLayout session={session}>
            <TurnoManager />
          </PrivateLayout>
        }
      />

      {/* HISTORIAL */}
      <Route
        path="/historial"
        element={
          <PrivateLayout session={session}>
            <ProduccionHistory />
          </PrivateLayout>
        }
      />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <PrivateLayout session={session}>
            <Dashboard />
          </PrivateLayout>
        }
      />

      {/* DEFAULT */}
      <Route
        path="/"
        element={<Navigate to={session ? "/produccion" : "/login"} replace />}
      />
    </Routes>
  )
}