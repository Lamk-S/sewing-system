import { BrowserRouter as Router } from 'react-router-dom'
import { Toaster } from 'sonner'

import { useAuth } from '../shared/hooks/useAuth'
import AppRoutes from './routes'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-gray-900 rounded-full" />
      </div>
    )
  }

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <AppRoutes session={session} />
    </Router>
  )
}

export default App