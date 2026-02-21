import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { gbifService, type GBIFFilters } from '../../services/gbifService';

export type GBIFAggregationMode = 'cluster' | 'binning';

export interface GBIFBrowseFilters extends GBIFFilters {
  searchText: string;
  kingdom: string;
  taxonomicClass: string;
  family: string;
  basisOfRecord: string;
  datasetName: string;
  startDate: string;
  endDate: string;
}

interface GBIFFilterOptions {
  kingdoms: string[];
  families: string[];
  basisOptions: string[];
  datasetNames: string[];
}

interface GBIFFilterContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  totalOccurrenceCount: number;
  browseFilters: GBIFBrowseFilters;
  aggregationMode: GBIFAggregationMode;
  filterOptions: GBIFFilterOptions;
  warmCache: () => void;
  setBrowseFilters: (next: GBIFBrowseFilters) => void;
  setAggregationMode: (next: GBIFAggregationMode) => void;
  createBrowseLoadingScope: () => () => void;
}

const DEFAULT_FILTERS: GBIFBrowseFilters = {
  searchText: '',
  kingdom: '',
  taxonomicClass: '',
  family: '',
  basisOfRecord: '',
  datasetName: '',
  startDate: '',
  endDate: '',
};

const DEFAULT_FILTER_OPTIONS: GBIFFilterOptions = {
  kingdoms: [],
  families: [],
  basisOptions: [],
  datasetNames: [],
};

const GBIFFilterContext = createContext<GBIFFilterContextValue | null>(null);

export function GBIFFilterProvider({ children }: { children: ReactNode }) {
  const [isWarmLoading, setIsWarmLoading] = useState(false);
  const [browseLoadCount, setBrowseLoadCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalOccurrenceCount, setTotalOccurrenceCount] = useState(0);
  const [browseFilters, setBrowseFilters] = useState<GBIFBrowseFilters>(DEFAULT_FILTERS);
  const [aggregationMode, setAggregationMode] = useState<GBIFAggregationMode>('binning');
  const [filterOptions, setFilterOptions] = useState<GBIFFilterOptions>(DEFAULT_FILTER_OPTIONS);
  const inFlightRef = useRef(false);
  const loading = isWarmLoading || browseLoadCount > 0;

  const warmCache = useCallback(() => {
    if (inFlightRef.current || dataLoaded) return;

    inFlightRef.current = true;
    setIsWarmLoading(true);
    setError(null);

    void Promise.all([gbifService.getOverviewCount(), gbifService.getFilterOptions()])
      .then(([count, options]) => {
        setTotalOccurrenceCount(count);
        setFilterOptions(options);
        setDataLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load GBIF metadata');
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

  const value = useMemo<GBIFFilterContextValue>(
    () => ({
      loading,
      dataLoaded,
      error,
      totalOccurrenceCount,
      browseFilters,
      aggregationMode,
      filterOptions,
      warmCache,
      setBrowseFilters,
      setAggregationMode,
      createBrowseLoadingScope,
    }),
    [loading, dataLoaded, error, totalOccurrenceCount, browseFilters, aggregationMode, filterOptions, warmCache, createBrowseLoadingScope],
  );

  return (
    <GBIFFilterContext.Provider value={value}>
      {children}
    </GBIFFilterContext.Provider>
  );
}

export function useGBIFFilter() {
  const context = useContext(GBIFFilterContext);
  if (!context) throw new Error('useGBIFFilter must be used within GBIFFilterProvider');
  return context;
}
