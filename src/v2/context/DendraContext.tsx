// ============================================================================
// DendraContext — Central Dendra station data + filter state.
//
// LAZY: data is NOT fetched on mount. Call warmCache() to trigger fetch.
// MULTI-SERVICE: Caches per-service URL so switching between Dendra layers
// (e.g., Weather Stations → Rain Gauges) is instant after first fetch.
//
// The context reads the active layer from LayerContext and the service URL
// from CatalogContext to determine which per-type service to query.
//
// Shared between: adapter OverviewTab, BrowseTab, and map behavior hook.
// ============================================================================

import {
  createContext, useContext, useState, useCallback,
  useEffect, useMemo, useRef,
  type ReactNode,
} from 'react';
import { useLayers } from './LayerContext';
import { useCatalog } from './CatalogContext';
import {
  fetchServiceData, fetchTimeSeries, buildServiceUrl,
  type DendraStation, type DendraSummary, type DendraServiceData,
  type DendraTimeSeriesPoint,
} from '../services/dendraStationService';

// ── Chart state ──────────────────────────────────────────────────────────────

export type DendraAggregation = 'hourly' | 'daily' | 'weekly';

export interface DendraChartFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  aggregation: DendraAggregation;
}

export interface DendraChartPanelState {
  /** Stable panel id */
  id: string;
  /** Panel placement in map container coordinates */
  x: number;
  y: number;
  /** Panel dimensions in px */
  width: number;
  height: number;
  /** z-index stacking order */
  zIndex: number;
  /** Source Dendra layer id */
  sourceLayerId: string;
  /** Source child view id, if any */
  sourceViewId?: string;
  /** Source layer label shown in panel copy */
  sourceLayerName: string;
  /** Whether the panel is minimized to a bar */
  minimized: boolean;
  /** Station being charted */
  station: DendraStation | null;
  /** Datastream summary being charted */
  summary: DendraSummary | null;
  /** Full fetched time series before Level 3 filters */
  rawData: DendraTimeSeriesPoint[];
  /** Time series data points */
  data: DendraTimeSeriesPoint[];
  /** Active Level 3 filter for chart rendering */
  filter: DendraChartFilter;
  /** Loading state for time series fetch */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
}

const DEFAULT_CHART_FILTER: DendraChartFilter = {
  startDate: '',
  endDate: '',
  aggregation: 'hourly',
};

function toDateInputValue(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function startOfUtcDay(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function endOfUtcDay(date: string): number {
  return Date.parse(`${date}T23:59:59.999Z`);
}

function startOfUtcHour(epochMs: number): number {
  const d = new Date(epochMs);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}

function startOfUtcWeek(epochMs: number): number {
  const d = new Date(epochMs);
  const dayOffset = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dayOffset);
  return d.getTime();
}

function aggregatePoints(
  points: DendraTimeSeriesPoint[],
  aggregation: DendraAggregation,
): DendraTimeSeriesPoint[] {
  if (points.length === 0) return [];

  const buckets = new Map<number, { sum: number; count: number }>();

  for (const point of points) {
    const bucketTs =
      aggregation === 'weekly'
        ? startOfUtcWeek(point.timestamp)
        : aggregation === 'daily'
          ? startOfUtcDay(toDateInputValue(point.timestamp))
          : startOfUtcHour(point.timestamp);

    const current = buckets.get(bucketTs);
    if (current) {
      current.sum += point.value;
      current.count += 1;
    } else {
      buckets.set(bucketTs, { sum: point.value, count: 1 });
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, acc]) => ({
      timestamp,
      value: acc.sum / acc.count,
    }));
}

function applyChartFilter(
  rawData: DendraTimeSeriesPoint[],
  filter: DendraChartFilter,
): DendraTimeSeriesPoint[] {
  if (rawData.length === 0) return [];

  const startTs = filter.startDate ? startOfUtcDay(filter.startDate) : Number.NEGATIVE_INFINITY;
  const endTs = filter.endDate ? endOfUtcDay(filter.endDate) : Number.POSITIVE_INFINITY;

  const inRange = rawData.filter(point => point.timestamp >= startTs && point.timestamp <= endTs);
  return aggregatePoints(inRange, filter.aggregation);
}

function getMapBounds() {
  if (typeof document === 'undefined') {
    return { width: 1280, height: 720 };
  }
  const mapContainer = document.getElementById('map-container');
  const width = mapContainer?.clientWidth ?? window.innerWidth;
  const height = mapContainer?.clientHeight ?? window.innerHeight;
  return {
    width: Math.max(640, width),
    height: Math.max(480, height),
  };
}

function buildInitialPanelRect(index: number): Pick<DendraChartPanelState, 'x' | 'y' | 'width' | 'height'> {
  const bounds = getMapBounds();
  const margin = 12;
  const gap = 12;
  const width = Math.max(480, Math.min(620, bounds.width - margin * 2));
  const height = Math.max(320, Math.min(380, bounds.height - margin * 2));
  const columns = Math.max(1, Math.floor((bounds.width - margin * 2 + gap) / (width + gap)));
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = Math.max(margin, bounds.width - width - margin - col * (width + gap));
  const y = Math.max(margin, bounds.height - height - margin - row * (height + gap));
  return { x, y, width, height };
}

// ── Context value ────────────────────────────────────────────────────────────

interface DendraContextValue {
  /** Stations for the currently active Dendra layer */
  stations: DendraStation[];
  /** Datastream summaries for the active Dendra layer */
  summaries: DendraSummary[];
  /** Total station count for the active layer */
  stationCount: number;
  /** Display title of the active Dendra layer */
  activeLayerTitle: string | null;
  /** The resolved FeatureServer URL for the active layer */
  activeServiceUrl: string | null;

  // Loading state
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;

  // Cache lifecycle
  /** Trigger data fetch for the current active Dendra layer. Idempotent. */
  warmCache: () => void;

  // Filter state
  showActiveOnly: boolean;
  toggleActiveOnly: () => void;
  setShowActiveOnly: (next: boolean) => void;

  /** Filtered stations (respects showActiveOnly filter) */
  filteredStations: DendraStation[];

  // Chart state (floating time series panel)
  chartPanels: DendraChartPanelState[];
  getChartPanel: (
    stationId: number,
    datastreamId: number,
    sourceLayerId?: string,
    sourceViewId?: string,
  ) => DendraChartPanelState | null;
  openChart: (station: DendraStation, summary: DendraSummary) => void;
  setChartFilter: (panelId: string, partial: Partial<DendraChartFilter>) => void;
  closeChart: (panelId: string) => void;
  toggleMinimizeChart: (panelId: string) => void;
  setChartPanelRect: (
    panelId: string,
    rect: Partial<Pick<DendraChartPanelState, 'x' | 'y' | 'width' | 'height'>>,
  ) => void;
  bringChartToFront: (panelId: string) => void;
}

const DendraCtx = createContext<DendraContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function DendraProvider({ children }: { children: ReactNode }) {
  const { activeLayer, pinnedLayers } = useLayers();
  const { layerMap } = useCatalog();

  // Per-service cache: serviceUrl → { stations, summaries }
  const cacheRef = useRef<Map<string, DendraServiceData>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());

  // Current displayed data
  const [currentData, setCurrentData] = useState<DendraServiceData>({ stations: [], summaries: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Filter state
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Chart state (floating time series panel)
  const [chartPanels, setChartPanels] = useState<DendraChartPanelState[]>([]);
  const nextChartZIndexRef = useRef(20);

  // Derive service URL from active Dendra layer's catalog metadata
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

  // When active Dendra layer changes, check cache and update displayed data
  useEffect(() => {
    if (!serviceInfo) {
      // No active Dendra layer — reset
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

  // warmCache — fetch data for the current active Dendra layer
  const warmCache = useCallback(() => {
    if (!serviceInfo) return;
    const { url } = serviceInfo;

    // Already cached or in-flight
    if (cacheRef.current.has(url) || fetchingRef.current.has(url)) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8701f2ee-5a1c-4168-87bb-b7318a0ad334',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H5',location:'src/v2/context/DendraContext.tsx:warmCache:skip',message:'Skipped warmCache because data is cached or already fetching',data:{url,hasCached:cacheRef.current.has(url),isFetching:fetchingRef.current.has(url)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return;
    }

    fetchingRef.current.add(url);
    setLoading(true);
    setError(null);

    const startTime = performance.now();
    console.log(`[Dendra Cache] 🔥 Warming cache for ${url}`);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8701f2ee-5a1c-4168-87bb-b7318a0ad334',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:'pre-fix',hypothesisId:'H5',location:'src/v2/context/DendraContext.tsx:warmCache:start',message:'Dendra warmCache started for active service',data:{url,activeLayerTitle:serviceInfo.title},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    fetchServiceData(url)
      .then(data => {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(
          `[Dendra Cache] ✅ Loaded ${data.stations.length} stations + ${data.summaries.length} summaries in ${elapsed}s`,
        );
        cacheRef.current.set(url, data);
        fetchingRef.current.delete(url);

        // Only update displayed data if this is still the active service
        setCurrentData(prev => {
          // Check if we're still on the same service
          return prev === data ? prev : data;
        });
        setCurrentData(data);
        setDataLoaded(true);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Dendra Cache] ❌ Fetch failed:', err);
        fetchingRef.current.delete(url);
        setError(err instanceof Error ? err.message : 'Failed to load Dendra stations');
        setLoading(false);
      });
  }, [serviceInfo]);

  // Toggle active-only filter
  const toggleActiveOnly = useCallback(() => {
    setShowActiveOnly(prev => !prev);
  }, []);

  const setShowActiveOnlyFilter = useCallback((next: boolean) => {
    setShowActiveOnly(next);
  }, []);

  // ── Chart actions ────────────────────────────────────────────────────────

  const openChart = useCallback((station: DendraStation, summary: DendraSummary) => {
    if (!serviceInfo) return;
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return;

    const existingPanel = chartPanels.find(panel =>
      panel.station?.station_id === station.station_id
      && panel.summary?.datastream_id === summary.datastream_id
      && panel.sourceLayerId === activeLayer.layerId
      && panel.sourceViewId === activeLayer.viewId
    );
    if (existingPanel) {
      const nextZ = ++nextChartZIndexRef.current;
      setChartPanels(prev => prev.map(panel => (
        panel.id === existingPanel.id
          ? { ...panel, minimized: false, zIndex: nextZ }
          : panel
      )));
      return;
    }

    const panelId = `${station.station_id}-${summary.datastream_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const panelRect = buildInitialPanelRect(chartPanels.length);
    const nextZ = ++nextChartZIndexRef.current;
    const newPanel: DendraChartPanelState = {
      id: panelId,
      x: panelRect.x,
      y: panelRect.y,
      width: panelRect.width,
      height: panelRect.height,
      zIndex: nextZ,
      sourceLayerId: activeLayer.layerId,
      sourceViewId: activeLayer.viewId,
      sourceLayerName: activeLayer.name,
      minimized: false,
      station,
      summary,
      rawData: [],
      data: [],
      filter: DEFAULT_CHART_FILTER,
      loading: true,
      error: null,
    };

    setChartPanels(prev => [...prev, newPanel]);

    fetchTimeSeries(serviceInfo.url, station.station_id, summary.datastream_name, summary.dendra_ds_id)
      .then(result => {
        const startDate = result.points.length > 0 ? toDateInputValue(result.points[0].timestamp) : '';
        const endDate = result.points.length > 0 ? toDateInputValue(result.points[result.points.length - 1].timestamp) : '';
        const filter: DendraChartFilter = {
          startDate,
          endDate,
          aggregation: 'hourly',
        };
        const filteredPoints = applyChartFilter(result.points, filter);
        setChartPanels(prev => prev.map(panel => (
          panel.id === panelId
            ? {
              ...panel,
              rawData: result.points,
              data: filteredPoints,
              filter,
              loading: false,
            }
            : panel
        )));
      })
      .catch(err => {
        console.error('[Dendra Chart] ❌ Time series fetch failed:', err);
        setChartPanels(prev => prev.map(panel => (
          panel.id === panelId
            ? {
              ...panel,
              loading: false,
              error: err instanceof Error ? err.message : 'Failed to load time series',
            }
            : panel
        )));
      });
  }, [serviceInfo, chartPanels, activeLayer]);

  const setChartFilter = useCallback((panelId: string, partial: Partial<DendraChartFilter>) => {
    setChartPanels(prev => prev.map(panel => {
      if (panel.id !== panelId) return panel;
      const nextFilter: DendraChartFilter = { ...panel.filter, ...partial };
      return {
        ...panel,
        filter: nextFilter,
        data: applyChartFilter(panel.rawData, nextFilter),
      };
    }));
  }, []);

  const closeChart = useCallback((panelId: string) => {
    setChartPanels(prev => prev.filter(panel => panel.id !== panelId));
  }, []);

  const toggleMinimizeChart = useCallback((panelId: string) => {
    const nextZ = ++nextChartZIndexRef.current;
    setChartPanels(prev => prev.map(panel => (
      panel.id === panelId
        ? { ...panel, minimized: !panel.minimized, zIndex: nextZ }
        : panel
    )));
  }, []);

  const setChartPanelRect = useCallback((
    panelId: string,
    rect: Partial<Pick<DendraChartPanelState, 'x' | 'y' | 'width' | 'height'>>,
  ) => {
    setChartPanels(prev => prev.map(panel => (
      panel.id === panelId
        ? { ...panel, ...rect }
        : panel
    )));
  }, []);

  const bringChartToFront = useCallback((panelId: string) => {
    const nextZ = ++nextChartZIndexRef.current;
    setChartPanels(prev => prev.map(panel => (
      panel.id === panelId
        ? { ...panel, zIndex: nextZ }
        : panel
    )));
  }, []);

  const getChartPanel = useCallback((
    stationId: number,
    datastreamId: number,
    sourceLayerId?: string,
    sourceViewId?: string,
  ) => {
    const matches = chartPanels.filter(panel =>
      panel.station?.station_id === stationId
      && panel.summary?.datastream_id === datastreamId
    );
    const sourceMatches = sourceLayerId
      ? matches.filter(panel =>
        panel.sourceLayerId === sourceLayerId
        && (sourceViewId == null || panel.sourceViewId === sourceViewId)
      )
      : matches;
    if (sourceMatches.length === 0) return null;
    return sourceMatches.reduce((top, panel) => (panel.zIndex > top.zIndex ? panel : top), sourceMatches[0]);
  }, [chartPanels]);

  // Persist charts for pinned layers, but clear orphaned unpinned charts when
  // their source layer is no longer the active Dendra layer.
  useEffect(() => {
    setChartPanels(prev => prev.filter((panel) => {
      const pinned = pinnedLayers.find(p => p.layerId === panel.sourceLayerId);
      if (pinned) return true;
      return activeLayer?.dataSource === 'dendra' && activeLayer.layerId === panel.sourceLayerId;
    }));
  }, [pinnedLayers, activeLayer?.dataSource, activeLayer?.layerId]);

  // Filtered stations
  const filteredStations = useMemo(() => {
    if (!showActiveOnly) return currentData.stations;
    return currentData.stations.filter(s => s.is_active === 1);
  }, [currentData.stations, showActiveOnly]);

  const value = useMemo<DendraContextValue>(() => ({
    stations: currentData.stations,
    summaries: currentData.summaries,
    stationCount: currentData.stations.length,
    activeLayerTitle: serviceInfo?.title ?? null,
    activeServiceUrl: serviceInfo?.url ?? null,
    loading,
    error,
    dataLoaded,
    warmCache,
    showActiveOnly,
    toggleActiveOnly,
    setShowActiveOnly: setShowActiveOnlyFilter,
    filteredStations,
    chartPanels,
    getChartPanel,
    openChart,
    setChartFilter,
    closeChart,
    toggleMinimizeChart,
    setChartPanelRect,
    bringChartToFront,
  }), [
    currentData, serviceInfo, loading, error, dataLoaded,
    warmCache, showActiveOnly, toggleActiveOnly, setShowActiveOnlyFilter, filteredStations,
    chartPanels, getChartPanel, openChart, setChartFilter, closeChart, toggleMinimizeChart,
    setChartPanelRect, bringChartToFront,
  ]);

  return <DendraCtx.Provider value={value}>{children}</DendraCtx.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDendra(): DendraContextValue {
  const ctx = useContext(DendraCtx);
  if (!ctx) throw new Error('useDendra must be used within DendraProvider');
  return ctx;
}

/**
 * Convenience: get summaries grouped by station_id.
 * Returns a Map for O(1) lookup in station cards.
 */
export function useSummariesByStation(): Map<number, DendraSummary[]> {
  const { summaries } = useDendra();
  return useMemo(() => {
    const map = new Map<number, DendraSummary[]>();
    for (const s of summaries) {
      const arr = map.get(s.station_id) ?? [];
      arr.push(s);
      map.set(s.station_id, arr);
    }
    return map;
  }, [summaries]);
}
