import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { calfloraV2Service, type CalFloraBrowseFilters } from '../../services/calfloraV2Service';
import { createDefaultCalFloraBrowseFilters } from './utils/browseFilterDefaults';

interface CalFloraFilterContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  totalObservationCount: number;
  browseFilters: CalFloraBrowseFilters;
  filterOptions: {
    counties: string[];
  };
  warmCache: () => void;
  setBrowseFilters: (next: CalFloraBrowseFilters) => void;
  createBrowseLoadingScope: () => () => void;
}

const DEFAULT_FILTERS: CalFloraBrowseFilters = createDefaultCalFloraBrowseFilters();

const CalFloraFilterContext = createContext<CalFloraFilterContextValue | null>(null);

export function CalFloraFilterProvider({ children }: { children: ReactNode }) {
  const [isWarmLoading, setIsWarmLoading] = useState(false);
  const [browseLoadCount, setBrowseLoadCount] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalObservationCount, setTotalObservationCount] = useState(0);
  const [browseFilters, setBrowseFilters] = useState<CalFloraBrowseFilters>(DEFAULT_FILTERS);
  const [counties, setCounties] = useState<string[]>([]);
  const inFlightRef = useRef(false);
  const loading = isWarmLoading || browseLoadCount > 0;

  const warmCache = useCallback(() => {
    if (inFlightRef.current || dataLoaded) return;

    inFlightRef.current = true;
    setIsWarmLoading(true);
    setError(null);

    void Promise.all([calfloraV2Service.getOverviewCount(), calfloraV2Service.getFilterOptions()])
      .then(([count, options]) => {
        setTotalObservationCount(count);
        setCounties(options.counties);
        setDataLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load CalFlora metadata');
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

  const value = useMemo<CalFloraFilterContextValue>(
    () => ({
      loading,
      dataLoaded,
      error,
      totalObservationCount,
      browseFilters,
      filterOptions: { counties },
      warmCache,
      setBrowseFilters,
      createBrowseLoadingScope,
    }),
    [loading, dataLoaded, error, totalObservationCount, browseFilters, counties, warmCache, createBrowseLoadingScope],
  );

  return (
    <CalFloraFilterContext.Provider value={value}>
      {children}
    </CalFloraFilterContext.Provider>
  );
}

export function useCalFloraFilter() {
  const context = useContext(CalFloraFilterContext);
  if (!context) throw new Error('useCalFloraFilter must be used within CalFloraFilterProvider');
  return context;
}
