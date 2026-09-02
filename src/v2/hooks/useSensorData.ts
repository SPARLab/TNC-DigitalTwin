// ============================================================================
// useSensorData — loads the latest snapshot for whichever scalar variable is
// currently selected, refreshing on the same cadence as wind.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearCacheByPrefix } from '../../services/cacheService';
import {
  fetchSensorSnapshot,
  type ScalarSnapshot,
  type SensorVariableId,
} from '../services/sensorService';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export interface UseSensorDataResult {
  snapshot: ScalarSnapshot | null;
  isLoading: boolean;
  error: string | null;
  fetchedAt: number | null;
  refresh: () => void;
}

/** Pass null to clear and stop polling. */
export function useSensorData(variableId: SensorVariableId | null): UseSensorDataResult {
  const [snapshot, setSnapshot] = useState<ScalarSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  /** Discards responses from superseded requests when the selection changes. */
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (id: SensorVariableId, options: { bypassCache: boolean }) => {
      const requestId = ++requestIdRef.current;

      if (options.bypassCache) clearCacheByPrefix(`sensor-latest-${id}`);

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchSensorSnapshot(id);
        if (requestIdRef.current !== requestId) return;
        setSnapshot(result);
        setFetchedAt(Date.now());
      } catch (caught) {
        if (requestIdRef.current !== requestId) return;
        const message = caught instanceof Error ? caught.message : 'Failed to load sensor data.';
        console.error(`[useSensorData] ${id} fetch failed:`, caught);
        setError(message);
        setSnapshot(null);
      } finally {
        if (requestIdRef.current === requestId) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!variableId) {
      requestIdRef.current++;
      setSnapshot(null);
      setError(null);
      setIsLoading(false);
      setFetchedAt(null);
      return;
    }

    // Clear immediately so the panel never shows one variable's numbers while
    // another is loading.
    setSnapshot(null);
    void load(variableId, { bypassCache: false });

    const intervalId = window.setInterval(() => {
      void load(variableId, { bypassCache: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current++;
    };
  }, [variableId, load]);

  const refresh = useCallback(() => {
    if (variableId) void load(variableId, { bypassCache: true });
  }, [variableId, load]);

  return { snapshot, isLoading, error, fetchedAt, refresh };
}
