// ============================================================================
// DataOneFilterContext — Lightweight cache status for DataOne adapter.
// Warms count data on first activation; browse tab owns query/filter UI state.
// ============================================================================

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { dataOneService } from '../../services/dataOneService';
import type { DataOneDataset } from '../../types/dataone';

export type DataOneAggregationMode = 'cluster' | 'binning';

export interface DataOneBrowseFilters {
  searchText: string;
  tncCategory: string;
  startDate: string;
  endDate: string;
  author: string;
}

interface DataOneFilterContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  totalDatasetCount: number;
  browseFilters: DataOneBrowseFilters;
  aggregationMode: DataOneAggregationMode;
  mapSelectionDataoneIds: string[] | null;
  /** Cached map datasets keyed by dataoneId — set by useDataOneMapBehavior. */
  mapDatasetsCache: Map<string, DataOneDataset>;
  warmCache: () => void;
  setBrowseFilters: (next: DataOneBrowseFilters) => void;
  setAggregationMode: (next: DataOneAggregationMode) => void;
  setMapSelectionDataoneIds: (next: string[] | null) => void;
  setMapDatasetsCache: (next: Map<string, DataOneDataset>) => void;
  createBrowseLoadingScope: () => () => void;
}

const DataOneFilterContext = createContext<DataOneFilterContextValue | null>(null);

export function DataOneFilterProvider({ children }: { children: ReactNode }) {
  const [isWarmLoading, setIsWarmLoading] = useState(false);
  const [browseLoadCount, setBrowseLoadCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDatasetCount, setTotalDatasetCount] = useState(0);
  const [browseFilters, setBrowseFilters] = useState<DataOneBrowseFilters>({
    searchText: '',
    tncCategory: '',
    startDate: '',
    endDate: '',
    author: '',
  });
  const [aggregationMode, setAggregationMode] = useState<DataOneAggregationMode>('cluster');
  const [mapSelectionDataoneIds, setMapSelectionDataoneIds] = useState<string[] | null>(null);
  const [mapDatasetsCache, setMapDatasetsCache] = useState<Map<string, DataOneDataset>>(new Map());
  const inFlightRef = useRef(false);
  const loading = isWarmLoading || browseLoadCount > 0;

  const warmCache = useCallback(() => {
    if (inFlightRef.current || dataLoaded) return;

    inFlightRef.current = true;
    setIsWarmLoading(true);
    setError(null);

    void dataOneService.countDatasets({ usePreserveRadius: true })
      .then((count) => {
        setTotalDatasetCount(count);
        setDataLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load DataOne metadata');
      })
      .finally(() => {
        inFlightRef.current = false;
        setIsWarmLoading(false);
      });
  }, [dataLoaded]);

  const createBrowseLoadingScope = useCallback(() => {
    let closed = false;
    setBrowseLoadCount((prev) => prev + 1);

    return () => {
      if (closed) return;
      closed = true;
      setBrowseLoadCount((prev) => Math.max(0, prev - 1));
    };
  }, []);

  const handleSetBrowseFilters = useCallback((next: DataOneBrowseFilters) => {
    setBrowseFilters(next);
  }, []);

  return (
    <DataOneFilterContext.Provider
      value={{
        loading,
        dataLoaded,
        error,
        totalDatasetCount,
        browseFilters,
        aggregationMode,
        mapSelectionDataoneIds,
        mapDatasetsCache,
        warmCache,
        setBrowseFilters: handleSetBrowseFilters,
        setAggregationMode,
        setMapSelectionDataoneIds,
        setMapDatasetsCache,
        createBrowseLoadingScope,
      }}
    >
      {children}
    </DataOneFilterContext.Provider>
  );
}

export function useDataOneFilter() {
  const context = useContext(DataOneFilterContext);
  if (!context) throw new Error('useDataOneFilter must be used within DataOneFilterProvider');
  return context;
}
