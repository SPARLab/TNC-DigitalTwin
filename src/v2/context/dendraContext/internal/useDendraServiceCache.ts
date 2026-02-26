import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveLayer, CatalogLayer } from '../../../types';
import {
  fetchServiceData,
  buildServiceUrl,
  type DendraServiceData,
} from '../../../services/dendraStationService';

interface UseDendraServiceCacheParams {
  activeLayer: ActiveLayer | null;
  layerMap: Map<string, CatalogLayer>;
}

export function useDendraServiceCache({ activeLayer, layerMap }: UseDendraServiceCacheParams) {
  const cacheRef = useRef<Map<string, DendraServiceData>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());
  const [currentData, setCurrentData] = useState<DendraServiceData>({ stations: [], summaries: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const serviceInfo = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return null;
    const layer = layerMap.get(activeLayer.layerId);
    if (!layer?.catalogMeta) return null;
    const { serverBaseUrl, servicePath } = layer.catalogMeta;
    return {
      url: buildServiceUrl(serverBaseUrl, servicePath),
      title: layer.name,
    };
  }, [activeLayer, layerMap]);

  useEffect(() => {
    if (!serviceInfo) {
      setDataLoaded(false);
      setCurrentData({ stations: [], summaries: [] });
      return;
    }
    const cached = cacheRef.current.get(serviceInfo.url);
    if (cached) {
      setCurrentData(cached);
      setDataLoaded(true);
      setError(null);
    } else {
      setDataLoaded(false);
      setCurrentData({ stations: [], summaries: [] });
    }
  }, [serviceInfo]);

  const warmCache = useCallback(() => {
    if (!serviceInfo) return;
    const { url } = serviceInfo;

    if (cacheRef.current.has(url) || fetchingRef.current.has(url)) return;

    fetchingRef.current.add(url);
    setLoading(true);
    setError(null);

    const startTime = performance.now();
    console.log(`[Dendra Cache] 🔥 Warming cache for ${url}`);

    fetchServiceData(url)
      .then((data) => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(
          `[Dendra Cache] ✅ Loaded ${data.stations.length} stations + ${data.summaries.length} summaries in ${elapsed}s`,
        );
        cacheRef.current.set(url, data);
        fetchingRef.current.delete(url);
        setCurrentData(data);
        setDataLoaded(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Dendra Cache] ❌ Fetch failed:', err);
        fetchingRef.current.delete(url);
        setError(err instanceof Error ? err.message : 'Failed to load Dendra stations');
        setLoading(false);
      });
  }, [serviceInfo]);

  return {
    currentData,
    loading,
    error,
    dataLoaded,
    serviceInfo,
    warmCache,
  };
}
