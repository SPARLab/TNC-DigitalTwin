// ============================================================================
// useWindData — loads the latest wind snapshot while the layer is switched on.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearCacheByPrefix } from '../../services/cacheService';
import { fetchLatestWind, type WindSnapshot } from '../services/windService';

/**
 * The service publishes hourly aggregates, so polling faster than this only adds
 * traffic without surfacing new readings.
 */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface UseWindDataResult {
  snapshot: WindSnapshot | null;
  isLoading: boolean;
  error: string | null;
  /** When the app last successfully read the service, epoch ms. */
  fetchedAt: number | null;
  /** Force a fetch that bypasses the cache. */
  refresh: () => void;
}

export function useWindData(isEnabled: boolean): UseWindDataResult {
  const [snapshot, setSnapshot] = useState<WindSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  /**
   * Incremented on every new request and on teardown, so responses from a
   * superseded or cancelled request are discarded instead of overwriting state.
   */
  const requestIdRef = useRef(0);

  const load = useCallback(async (options: { bypassCache: boolean }) => {
    const requestId = ++requestIdRef.current;

    if (options.bypassCache) clearCacheByPrefix('wind-latest');

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchLatestWind();
      if (requestIdRef.current !== requestId) return;
      setSnapshot(result);
      setFetchedAt(Date.now());
    } catch (caught) {
      if (requestIdRef.current !== requestId) return;
      const message = caught instanceof Error ? caught.message : 'Failed to load wind data.';
      console.error('[useWindData] Wind fetch failed:', caught);
      setError(message);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      // Invalidate in-flight work and drop the snapshot so re-enabling refetches.
      requestIdRef.current++;
      setSnapshot(null);
      setError(null);
      setIsLoading(false);
      setFetchedAt(null);
      return;
    }

    void load({ bypassCache: false });

    const intervalId = window.setInterval(() => {
      void load({ bypassCache: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current++;
    };
  }, [isEnabled, load]);

  const refresh = useCallback(() => {
    void load({ bypassCache: true });
  }, [load]);

  return { snapshot, isLoading, error, fetchedAt, refresh };
}
