import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import RegistroTrabajador from './components/production/RegistroTrabajador';
import TurnoManager from './components/production/TurnoManager';
import Dashboard from './components/reports/Dashboard';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/produccion" />} 
        />
        <Route 
          path="/produccion" 
          element={session ? <RegistroTrabajador session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/turnos" 
          element={session ? <TurnoManager session={session} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;