// ============================================================================
// LiveAlertsContext — shared open-alerts feed for catalog bell + monitoring.
// One poll loop; consumers filter client-side by active source when needed.
// ============================================================================

import { createContext, useContext, type ReactNode } from 'react';
import { useLiveAlerts, type UseLiveAlertsResult } from '../hooks/useLiveAlerts';

const LiveAlertsContext = createContext<UseLiveAlertsResult | null>(null);

export function LiveAlertsProvider({ children }: { children: ReactNode }) {
  // Fetch the full open-alerts list; monitoring filters by active sensor locally.
  const value = useLiveAlerts(null);
  return (
    <LiveAlertsContext.Provider value={value}>
      {children}
    </LiveAlertsContext.Provider>
  );
}

export function useLiveAlertsContext(): UseLiveAlertsResult {
  const context = useContext(LiveAlertsContext);
  if (!context) {
    throw new Error('useLiveAlertsContext must be used within LiveAlertsProvider');
  }
  return context;
}
