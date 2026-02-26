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
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useLayers } from './LayerContext';
import { useCatalog } from './CatalogContext';
import type { DendraStation, DendraSummary } from '../services/dendraStationService';
import { useDendraServiceCache } from './dendraContext/internal/useDendraServiceCache';
import { useDendraStationFilters } from './dendraContext/internal/useDendraStationFilters';
import { useDendraChartPanels } from './dendraContext/internal/useDendraChartPanels';
import type { DendraChartFilter, DendraChartPanelState } from './dendraContext/internal/types';

export type {
  DendraAggregation,
  DendraChartFilter,
  DendraChartPanelState,
} from './dendraContext/internal/types';

interface DendraContextValue {
  stations: DendraStation[];
  summaries: DendraSummary[];
  stationCount: number;
  activeLayerTitle: string | null;
  activeServiceUrl: string | null;
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;
  warmCache: () => void;
  showActiveOnly: boolean;
  toggleActiveOnly: () => void;
  setShowActiveOnly: (next: boolean) => void;
  filteredStations: DendraStation[];
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

export function DendraProvider({ children }: { children: ReactNode }) {
  const { activeLayer, pinnedLayers } = useLayers();
  const { layerMap } = useCatalog();

  const {
    currentData,
    loading,
    error,
    dataLoaded,
    serviceInfo,
    warmCache,
  } = useDendraServiceCache({ activeLayer, layerMap });

  const {
    showActiveOnly,
    toggleActiveOnly,
    setShowActiveOnly,
    filteredStations,
  } = useDendraStationFilters(currentData.stations);

  const {
    chartPanels,
    getChartPanel,
    openChart,
    setChartFilter,
    closeChart,
    toggleMinimizeChart,
    setChartPanelRect,
    bringChartToFront,
  } = useDendraChartPanels({
    activeLayer,
    pinnedLayers,
    activeServiceUrl: serviceInfo?.url ?? null,
  });

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
    setShowActiveOnly,
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
    currentData,
    serviceInfo,
    loading,
    error,
    dataLoaded,
    warmCache,
    showActiveOnly,
    toggleActiveOnly,
    setShowActiveOnly,
    filteredStations,
    chartPanels,
    getChartPanel,
    openChart,
    setChartFilter,
    closeChart,
    toggleMinimizeChart,
    setChartPanelRect,
    bringChartToFront,
  ]);

  return <DendraCtx.Provider value={value}>{children}</DendraCtx.Provider>;
}

export function useDendra(): DendraContextValue {
  const ctx = useContext(DendraCtx);
  if (!ctx) throw new Error('useDendra must be used within DendraProvider');
  return ctx;
}

export function useSummariesByStation(): Map<number, DendraSummary[]> {
  const { summaries } = useDendra();
  return useMemo(() => {
    const map = new Map<number, DendraSummary[]>();
    for (const summary of summaries) {
      const list = map.get(summary.station_id) ?? [];
      list.push(summary);
      map.set(summary.station_id, list);
    }
    return map;
  }, [summaries]);
}
