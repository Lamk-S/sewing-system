import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '../shared/auth/AuthProvider'
import RoutesApp from './RoutesApp'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: true, 
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RoutesApp />
          <Toaster 
            position="top-right" 
            richColors 
            expand={true} 
            visibleToasts={4}
            closeButton
            duration={4000}
            toastOptions={{
              className: 'text-sm font-medium border border-slate-200 shadow-lg',
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}