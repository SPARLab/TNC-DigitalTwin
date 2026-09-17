// ============================================================================
// useLiveAlerts — open alerts for the monitoring layer currently on the map.
//
// The FeatureServer is polled on a short cadence regardless of selection; filtering
// by source URL happens client-side so switching Wind → Air Temp is instant and
// does not wait on another round trip. The unfiltered list powers the Current
// Conditions overview panel.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearCacheByPrefix } from '../../services/cacheService';
import {
  alertMatchesActiveSource,
  compareLiveAlerts,
  fetchOpenLiveAlerts,
  type LiveAlert,
} from '../services/liveAlertService';

export const LIVE_ALERTS_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export interface ActiveAlertSource {
  /** Latest FeatureServer URL, matching alert `source_url` / entries in `source_urls`. */
  url: string;
  /** Service folder name, matching alert `source_service`. */
  servicePath: string;
}

export interface UseLiveAlertsResult {
  /** Alerts matching the active monitoring source; empty when no source is selected. */
  alerts: LiveAlert[];
  /** Every open alert across all sources, highest severity first. */
  allAlerts: LiveAlert[];
  isLoading: boolean;
  error: string | null;
  fetchedAt: number | null;
  refresh: () => void;
}

export function useLiveAlerts(activeSource: ActiveAlertSource | null): UseLiveAlertsResult {
  const [allAlerts, setAllAlerts] = useState<LiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (options: { bypassCache: boolean }) => {
    const requestId = ++requestIdRef.current;
    if (options.bypassCache) clearCacheByPrefix('live-alerts-open');

    setIsLoading(true);
    setError(null);

    try {
      const snapshot = await fetchOpenLiveAlerts();
      if (requestIdRef.current !== requestId) return;
      setAllAlerts(snapshot.alerts);
      setFetchedAt(snapshot.fetchedAt);
    } catch (caught) {
      if (requestIdRef.current !== requestId) return;
      const message = caught instanceof Error ? caught.message : 'Failed to load live alerts.';
      console.error('[useLiveAlerts] fetch failed:', caught);
      setError(message);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ bypassCache: false });

    const intervalId = window.setInterval(() => {
      void load({ bypassCache: true });
    }, LIVE_ALERTS_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current++;
    };
  }, [load]);

  const sortedAllAlerts = useMemo(
    () => [...allAlerts].sort(compareLiveAlerts),
    [allAlerts],
  );

  const alerts = useMemo(() => {
    if (!activeSource) return [];
    return sortedAllAlerts.filter((alert) => alertMatchesActiveSource(alert, activeSource));
  }, [sortedAllAlerts, activeSource]);

  const refresh = useCallback(() => {
    void load({ bypassCache: true });
  }, [load]);

  return { alerts, allAlerts: sortedAllAlerts, isLoading, error, fetchedAt, refresh };
}
