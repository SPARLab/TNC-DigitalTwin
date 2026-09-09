import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// The v2 platform is the default app. ?v1 in the URL falls back to the legacy catalog.
const isV1 = new URLSearchParams(window.location.search).has('v1');

// Lazy-load whichever version we need
const App = lazy(() => isV1 ? import('./App.tsx') : import('./v2/V2App.tsx'));

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
