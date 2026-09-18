import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Legacy catalog remains in src/App.tsx, but it is no longer reachable from the URL.
const App = lazy(() => import('./v2/V2App.tsx'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
)
