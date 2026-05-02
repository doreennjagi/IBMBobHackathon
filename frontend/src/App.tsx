import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import AppShell from '@components/AppShell'
import { ThemeProvider } from '@/theme/ThemeProvider'

import Dashboard from '@pages/Dashboard'
import SubscriptionDashboard from '@pages/SubscriptionDashboard'
import Upload from '@pages/Upload'
import Reports from '@pages/Reports'
import AIEditor from '@pages/AIEditor'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Upload />} />
                <Route path="/dashboard" element={<SubscriptionDashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/ai-editor/:subscriptionId" element={<AIEditor />} />
              </Route>
              <Route path="/legacy" element={<Dashboard />} />
              <Route path="/upload" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: '2px solid var(--sl-line)',
              borderRadius: '12px',
              fontFamily: 'IBM Plex Sans, system-ui, sans-serif',
              background: 'var(--sl-surface)',
              color: 'var(--sl-ink)',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
