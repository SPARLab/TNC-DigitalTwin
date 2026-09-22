import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveLayer, CatalogLayer } from '../../../types';
import {
  fetchStations,
  fetchSummariesForStation,
  fetchDatastreamTypeCatalog,
  buildServiceUrl,
  type DendraStation,
  type DendraSummary,
  type DendraDatastreamType,
} from '../../../services/dendraStationService';
import { resolveDendraServiceTitle } from '../../../utils/resolveDendraServiceTitle';

interface StationCacheEntry {
  stations: DendraStation[];
  summariesByStation: Map<number, DendraSummary[]>;
  datastreamTypes: DendraDatastreamType[];
  datastreamTypesLoaded: boolean;
}

interface UseDendraServiceCacheParams {
  activeLayer: ActiveLayer | null;
  layerMap: Map<string, CatalogLayer>;
}

export function useDendraServiceCache({ activeLayer, layerMap }: UseDendraServiceCacheParams) {
  const cacheRef = useRef<Map<string, StationCacheEntry>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());
  const summaryFetchingRef = useRef<Set<string>>(new Set());
  const typeFetchingRef = useRef<Set<string>>(new Set());
  /** Tracks the service URL the UI is currently bound to (avoids cross-service races). */
  const activeUrlRef = useRef<string | null>(null);
  const [stations, setStations] = useState<DendraStation[]>([]);
  const [summariesByStation, setSummariesByStation] = useState<Map<number, DendraSummary[]>>(new Map());
  const [datastreamTypes, setDatastreamTypes] = useState<DendraDatastreamType[]>([]);
  const [datastreamTypesLoaded, setDatastreamTypesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stationSummaryLoading, setStationSummaryLoading] = useState<number | null>(null);

  // Derive URL/title as primitives so Latest ↔ Locations (same FeatureServer)
  // keeps a stable `serviceInfo` object and does not re-sync / recreate loaders.
  const serviceUrl = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return null;
    const layer = layerMap.get(activeLayer.layerId);
    if (!layer?.catalogMeta) return null;
    const { serverBaseUrl, servicePath } = layer.catalogMeta;
    return buildServiceUrl(serverBaseUrl, servicePath);
  }, [activeLayer?.dataSource, activeLayer?.layerId, layerMap]);

  const serviceTitle = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return null;
    const layer = layerMap.get(activeLayer.layerId);
    if (!layer) return null;
    return resolveDendraServiceTitle(layerMap, activeLayer.layerId) ?? layer.name;
  }, [activeLayer?.dataSource, activeLayer?.layerId, layerMap]);

  const serviceInfo = useMemo(() => {
    if (!serviceUrl || !serviceTitle) return null;
    return { url: serviceUrl, title: serviceTitle };
  }, [serviceUrl, serviceTitle]);

  activeUrlRef.current = serviceInfo?.url ?? null;

  // Sync state from cache when active service URL changes (not sibling layer toggles).
  useEffect(() => {
    if (!serviceUrl) {
      setDataLoaded(false);
      setStations([]);
      setSummariesByStation(new Map());
      setDatastreamTypes([]);
      setDatastreamTypesLoaded(false);
      return;
    }
    const cached = cacheRef.current.get(serviceUrl);
    if (cached) {
      setStations(cached.stations);
      setSummariesByStation(new Map(cached.summariesByStation));
      setDatastreamTypes(cached.datastreamTypes);
      setDatastreamTypesLoaded(cached.datastreamTypesLoaded);
      setDataLoaded(true);
      setError(null);
    } else {
      setDataLoaded(false);
      setStations([]);
      setSummariesByStation(new Map());
      setDatastreamTypes([]);
      setDatastreamTypesLoaded(false);
    }
  }, [serviceUrl]);

  const loadDatastreamTypes = useCallback((url: string, stationList: DendraStation[]) => {
    if (typeFetchingRef.current.has(url)) return;
    const cached = cacheRef.current.get(url);
    if (cached?.datastreamTypesLoaded) {
      if (activeUrlRef.current === url) {
        setDatastreamTypes(cached.datastreamTypes);
        setDatastreamTypesLoaded(true);
      }
      return;
    }

    typeFetchingRef.current.add(url);
    const sampleIds = stationList.map((station) => station.station_id);
    fetchDatastreamTypeCatalog(url, sampleIds)
      .then((types) => {
        typeFetchingRef.current.delete(url);
        const current = cacheRef.current.get(url);
        if (current) {
          current.datastreamTypes = types;
          current.datastreamTypesLoaded = true;
          // Drop any summaries built before this service's columns were known.
          current.summariesByStation.clear();
        }
        // Ignore stale responses after the user switched services.
        if (activeUrlRef.current !== url) return;
        setDatastreamTypes(types);
        setDatastreamTypesLoaded(true);
        setSummariesByStation(new Map());
        console.log(`[Dendra Cache] ✅ ${types.length} Latest-column datastream types`);
      })
      .catch((err) => {
        typeFetchingRef.current.delete(url);
        const current = cacheRef.current.get(url);
        if (current) current.datastreamTypesLoaded = true;
        if (activeUrlRef.current !== url) return;
        setDatastreamTypesLoaded(true);
        console.warn('[Dendra Cache] ⚠️ Datastream type catalog failed:', err);
      });
  }, []);

  // Warm cache: fetch stations only — map markers render immediately.
  const warmCache = useCallback(() => {
    if (!serviceInfo) return;
    const { url } = serviceInfo;

    if (cacheRef.current.has(url) || fetchingRef.current.has(url)) {
      const cached = cacheRef.current.get(url);
      if (cached) loadDatastreamTypes(url, cached.stations);
      return;
    }

    fetchingRef.current.add(url);
    setLoading(true);
    setError(null);

    const startTime = performance.now();
    console.log(`[Dendra Cache] 🔥 Warming cache for ${url} (stations only)`);

    fetchStations(url)
      .then((loadedStations) => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Dendra Cache] ✅ ${loadedStations.length} stations in ${elapsed}s`);

        cacheRef.current.set(url, {
          stations: loadedStations,
          summariesByStation: new Map(),
          datastreamTypes: [],
          datastreamTypesLoaded: false,
        });
        fetchingRef.current.delete(url);
        if (activeUrlRef.current === url) {
          setStations(loadedStations);
          setDataLoaded(true);
          setLoading(false);
        }
        loadDatastreamTypes(url, loadedStations);
      })
      .catch((err) => {
        console.error('[Dendra Cache] ❌ Station fetch failed:', err);
        fetchingRef.current.delete(url);
        if (activeUrlRef.current !== url) return;
        setError(err instanceof Error ? err.message : 'Failed to load Dendra stations');
        setLoading(false);
      });
  }, [serviceInfo, loadDatastreamTypes]);

  /**
   * Fetch summaries for a station.
   *
   * Only uses Latest-column keys from *this* service's cache entry — never the
   * React `datastreamTypes` state, which can briefly belong to a previous service
   * when switching creek gauges (and would chart `water_temp` against Discharge).
   */
  const loadStationSummaries = useCallback((stationId: number) => {
    if (!serviceInfo) return;
    const { url } = serviceInfo;
    const cacheKey = `${url}::${stationId}`;

    const entry = cacheRef.current.get(url);
    if (!entry) return;
    // Wait until this service's Latest columns are known so we don't synthesize
    // summaries from another service's field keys (or an empty premature list).
    if (!entry.datastreamTypesLoaded) return;
    if (entry.summariesByStation.has(stationId)) return;
    if (summaryFetchingRef.current.has(cacheKey)) return;

    summaryFetchingRef.current.add(cacheKey);
    setStationSummaryLoading(stationId);

    const startTime = performance.now();
    console.log(`[Dendra Cache] 📡 Fetching summaries for station ${stationId}...`);

    const stationMeta = entry.stations.find((station) => station.station_id === stationId);
    const latestValueFields = entry.datastreamTypes.map((type) => type.fieldKey);
    fetchSummariesForStation(url, stationId, {
      categoryHint: stationMeta?.category ?? stationMeta?.sensor_name ?? null,
      latestValueFields: latestValueFields.length > 0 ? latestValueFields : null,
    })
      .then((summaries) => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Dendra Cache] ✅ ${summaries.length} summaries for station ${stationId} in ${elapsed}s`);

        summaryFetchingRef.current.delete(cacheKey);
        const current = cacheRef.current.get(url);
        if (current) {
          current.summariesByStation.set(stationId, summaries);
        }
        if (activeUrlRef.current !== url) return;
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
        if (activeUrlRef.current !== url) return;
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
    datastreamTypes,
    datastreamTypesLoaded,
    loading,
    error,
    dataLoaded,
    stationSummaryLoading,
    serviceInfo,
    warmCache,
    loadStationSummaries,
  };
}
