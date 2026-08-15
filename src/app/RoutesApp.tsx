import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../shared/auth/AuthProvider' 

import Login from '../pages/Login'
import RegistroTrabajador from '../features/production/RegistroTrabajador'
import ProduccionHistory from '../features/production/ProduccionHistory'
import TurnoManager from '../features/production/TurnoManager'
import Dashboard from '../pages/Dashboard'
import AdminDashboard from '../features/admin/AdminDashboard'

import RequireWorker from '../routes/RequireWorker'
import RequireAdmin from '../routes/RequireAdmin'
import RequireAuth from '../routes/RequireAuth'
import AppLayout from '../shared/components/layout/AppLayout'

export default function RoutesApp() {
  const { session, isAdmin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* ==========================================
          RUTAS EXCLUSIVAS DE TRABAJADOR 
      ========================================== */}
      <Route path="/produccion" element={
        <RequireWorker><AppLayout><RegistroTrabajador /></AppLayout></RequireWorker>
      } />

      <Route path="/historial" element={
        <RequireWorker><AppLayout><ProduccionHistory /></AppLayout></RequireWorker>
      } />

      <Route path="/dashboard" element={
        <RequireWorker><AppLayout><Dashboard /></AppLayout></RequireWorker>
      } />

      {/* ==========================================
          RUTAS COMPARTIDAS (TRABAJADOR Y ADMIN)
      ========================================== */}
      <Route path="/turnos" element={
        <RequireAuth><AppLayout><TurnoManager /></AppLayout></RequireAuth>
      } />

      {/* ==========================================
          RUTAS EXCLUSIVAS DE ADMINISTRADOR
      ========================================== */}
      <Route path="/admin" element={
        <RequireAdmin><AppLayout><AdminDashboard /></AppLayout></RequireAdmin>
      } />

      {/* Redirect */}
      <Route path="/" element={
        session 
          ? isAdmin 
            ? <Navigate to="/admin" replace /> 
            : <Navigate to="/produccion" replace />
          : <Navigate to="/login" replace />
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}