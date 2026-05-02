import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Theme } from '@carbon/react'

// Pages
import Dashboard from '@pages/Dashboard'
import SubscriptionDashboard from '@pages/SubscriptionDashboard'
import Upload from '@pages/Upload'
import Reports from '@pages/Reports'
import AIEditor from '@pages/AIEditor'

// Styles
import '@carbon/react/scss/index.scss'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Theme theme="white">
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<SubscriptionDashboard />} />
              <Route path="/legacy" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ai-editor/:subscriptionId" element={<AIEditor />} />
            </Routes>
          </div>
        </Router>
        <Toaster position="top-right" />
      </Theme>
    </QueryClientProvider>
  )
}

export default App

// Made with Bob
