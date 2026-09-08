// ============================================================================
// useCameraData — loads the latest ALERTCalifornia snapshot while the layer is
// switched on. Images update throughout the day, so this polls more often than
// the hourly weather aggregates.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { clearCacheByPrefix } from '../../services/cacheService';
import { fetchLatestCameras, type CameraSnapshot } from '../services/cameraService';

export const CAMERA_REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export interface UseCameraDataResult {
  snapshot: CameraSnapshot | null;
  isLoading: boolean;
  error: string | null;
  fetchedAt: number | null;
  refresh: () => void;
}

export function useCameraData(isEnabled: boolean): UseCameraDataResult {
  const [snapshot, setSnapshot] = useState<CameraSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  const requestIdRef = useRef(0);

  const load = useCallback(async (options: { bypassCache: boolean }) => {
    const requestId = ++requestIdRef.current;

    if (options.bypassCache) clearCacheByPrefix('cameras-latest');

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchLatestCameras();
      if (requestIdRef.current !== requestId) return;
      setSnapshot(result);
      setFetchedAt(Date.now());
    } catch (caught) {
      if (requestIdRef.current !== requestId) return;
      const message = caught instanceof Error ? caught.message : 'Failed to load camera data.';
      console.error('[useCameraData] Camera fetch failed:', caught);
      setError(message);
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
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
    }, CAMERA_REFRESH_INTERVAL_MS);

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
