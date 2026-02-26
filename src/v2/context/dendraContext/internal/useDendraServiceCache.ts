import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveLayer, CatalogLayer } from '../../../types';
import {
  fetchStations,
  fetchSummariesForStation,
  buildServiceUrl,
  type DendraStation,
  type DendraSummary,
} from '../../../services/dendraStationService';

interface StationCacheEntry {
  stations: DendraStation[];
  summariesByStation: Map<number, DendraSummary[]>;
}

interface UseDendraServiceCacheParams {
  activeLayer: ActiveLayer | null;
  layerMap: Map<string, CatalogLayer>;
}

export function useDendraServiceCache({ activeLayer, layerMap }: UseDendraServiceCacheParams) {
  const cacheRef = useRef<Map<string, StationCacheEntry>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());
  const summaryFetchingRef = useRef<Set<string>>(new Set());
  const [stations, setStations] = useState<DendraStation[]>([]);
  const [summariesByStation, setSummariesByStation] = useState<Map<number, DendraSummary[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stationSummaryLoading, setStationSummaryLoading] = useState<number | null>(null);

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

  // Sync state from cache when active service changes
  useEffect(() => {
    if (!serviceInfo) {
      setDataLoaded(false);
      setStations([]);
      setSummariesByStation(new Map());
      return;
    }
    const cached = cacheRef.current.get(serviceInfo.url);
    if (cached) {
      setStations(cached.stations);
      setSummariesByStation(new Map(cached.summariesByStation));
      setDataLoaded(true);
      setError(null);
    } else {
      setDataLoaded(false);
      setStations([]);
      setSummariesByStation(new Map());
    }
  }, [serviceInfo]);

  // Warm cache: fetch stations only — map markers render immediately.
  const warmCache = useCallback(() => {
    if (!serviceInfo) return;
    const { url } = serviceInfo;

    if (cacheRef.current.has(url) || fetchingRef.current.has(url)) return;

    fetchingRef.current.add(url);
    setLoading(true);
    setError(null);

    const startTime = performance.now();
    console.log(`[Dendra Cache] 🔥 Warming cache for ${url} (stations only)`);

    fetchStations(url)
      .then((loadedStations) => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Dendra Cache] ✅ ${loadedStations.length} stations in ${elapsed}s`);

        cacheRef.current.set(url, { stations: loadedStations, summariesByStation: new Map() });
        fetchingRef.current.delete(url);
        setStations(loadedStations);
        setDataLoaded(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Dendra Cache] ❌ Station fetch failed:', err);
        fetchingRef.current.delete(url);
        setError(err instanceof Error ? err.message : 'Failed to load Dendra stations');
        setLoading(false);
      });
  }, [serviceInfo]);

  // On-demand: fetch summaries for a single station when user drills in.
  const loadStationSummaries = useCallback((stationId: number) => {
    if (!serviceInfo) return;
    const { url } = serviceInfo;
    const cacheKey = `${url}::${stationId}`;

    // Already cached?
    const entry = cacheRef.current.get(url);
    if (entry?.summariesByStation.has(stationId)) return;

    // Already fetching?
    if (summaryFetchingRef.current.has(cacheKey)) return;
    summaryFetchingRef.current.add(cacheKey);
    setStationSummaryLoading(stationId);

    const startTime = performance.now();
    console.log(`[Dendra Cache] 📡 Fetching summaries for station ${stationId}...`);

    fetchSummariesForStation(url, stationId)
      .then((summaries) => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Dendra Cache] ✅ ${summaries.length} summaries for station ${stationId} in ${elapsed}s`);

        summaryFetchingRef.current.delete(cacheKey);
        const current = cacheRef.current.get(url);
        if (current) {
          current.summariesByStation.set(stationId, summaries);
        }
        setSummariesByStation((prev) => {
          const next = new Map(prev);
          next.set(stationId, summaries);
          return next;
        });
        setStationSummaryLoading((prev) => (prev === stationId ? null : prev));
      })
      .catch((err) => {
        console.warn(`[Dendra Cache] ⚠️ Summaries fetch failed for station ${stationId}:`, err);
        summaryFetchingRef.current.delete(cacheKey);
        setStationSummaryLoading((prev) => (prev === stationId ? null : prev));
      });
  }, [serviceInfo]);

  // Flatten summariesByStation into a single array for backward compat with useSummariesByStation()
  const allSummaries = useMemo(() => {
    const result: DendraSummary[] = [];
    for (const list of summariesByStation.values()) {
      result.push(...list);
    }
    return result;
  }, [summariesByStation]);

  return {
    stations,
    allSummaries,
    summariesByStation,
    loading,
    error,
    dataLoaded,
    stationSummaryLoading,
    serviceInfo,
    warmCache,
    loadStationSummaries,
  };
}
