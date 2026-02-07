import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Feature flag: ?v2=true in URL enables V2 app
const isV2 = new URLSearchParams(window.location.search).has('v2');

// Lazy-load whichever version we need
const App = lazy(() => isV2 ? import('./v2/V2App.tsx') : import('./App.tsx'));

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
