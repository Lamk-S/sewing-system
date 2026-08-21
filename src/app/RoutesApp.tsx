import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/AuthProvider'
import { SplashScreen } from '../shared/components/ui/SplashScreen'

// Importaciones de Layouts y Páginas
import AppLayout from '../shared/components/layout/AppLayout'
import Login from '../pages/Login'
import AdminDashboard from '../features/admin/AdminDashboard'
import Dashboard from '../pages/Dashboard'
import RegistroTrabajador from '../features/production/RegistroTrabajador'
import TurnoManager from '../features/production/TurnoManager'
import ProduccionHistory from '../features/production/ProduccionHistory'
import NotFound from '../pages/NotFound'

// --- GUARDS DECLARATIVOS ---

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isAdmin, isAuthLoading } = useAuth()
  if (isAuthLoading) return <SplashScreen />
  if (session) return <Navigate to={isAdmin ? "/admin" : "/produccion"} replace />
  return <>{children}</>
}

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { session, isAdmin, isAuthLoading } = useAuth()
  if (isAuthLoading) return <SplashScreen />
  if (!session) return <Navigate to="/" replace />
  if (!isAdmin) return <Navigate to="/produccion" replace />
  return <>{children}</>
}

const RequireWorker = ({ children }: { children: React.ReactNode }) => {
  const { session, isAdmin, isAuthLoading } = useAuth()
  if (isAuthLoading) return <SplashScreen />
  if (!session) return <Navigate to="/" replace />
  if (isAdmin) return <Navigate to="/admin" replace />
  return <>{children}</>
}

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { session, isAuthLoading } = useAuth()
  if (isAuthLoading) return <SplashScreen />
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

// --- RUTAS PRINCIPALES ---

export default function RoutesApp() {
  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* RUTAS PROTEGIDAS */}
      <Route element={<AppLayout />}>
        
        {/* Vistas de Administrador */}
        <Route 
          path="/admin" 
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          } 
        />
        
        {/* Vistas de Trabajador */}
        <Route 
          path="/produccion" 
          element={
            <RequireWorker>
              <RegistroTrabajador />
            </RequireWorker>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <RequireWorker>
              <Dashboard />
            </RequireWorker>
          } 
        />
        <Route 
          path="/historial" 
          element={
            <RequireWorker>
              <ProduccionHistory />
            </RequireWorker>
          } 
        />

        {/* Vistas Compartidas */}
        <Route 
          path="/turnos" 
          element={
            <RequireAuth>
              <TurnoManager />
            </RequireAuth>
          } 
        />

      </Route>

      {/* 404 NO ENCONTRADO */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}