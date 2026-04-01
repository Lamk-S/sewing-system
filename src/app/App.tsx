import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../shared/auth/AuthProvider'
import RoutesApp from './RoutesApp'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <RoutesApp />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}