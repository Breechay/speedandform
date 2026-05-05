import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { App } from './App'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { getCurrentUser } from './api/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

// Bootstrap auth state — runs once before render
async function initAuth() {
  const { setUser, setLoading } = useAuthStore.getState()

  // Resolve cold-load auth immediately so loading state cannot hang.
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    try {
      const user = await getCurrentUser()
      setUser(user)
    } catch {
      setUser(null)
    }
  } else {
    setUser(null)
  }
  setLoading(false)

  // Handle subsequent auth events (sign in/out, token refresh, etc.)
  supabase.auth.onAuthStateChange(async (_event, nextSession) => {
    if (nextSession?.user) {
      try {
        const user = await getCurrentUser()
        setUser(user)
      } catch {
        setUser(null)
      }
    } else {
      setUser(null)
    }
  })
}

void initAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
