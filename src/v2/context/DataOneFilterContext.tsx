// ============================================================================
// DataOneFilterContext — Lightweight cache status for DataOne adapter.
// Warms count data on first activation; browse tab owns query/filter UI state.
// ============================================================================

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { dataOneService } from '../../services/dataOneService';

interface DataOneFilterContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  totalDatasetCount: number;
  warmCache: () => void;
}

const DataOneFilterContext = createContext<DataOneFilterContextValue | null>(null);

export function DataOneFilterProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDatasetCount, setTotalDatasetCount] = useState(0);
  const inFlightRef = useRef(false);

  const warmCache = useCallback(() => {
    if (inFlightRef.current || dataLoaded) return;

    inFlightRef.current = true;
    setLoading(true);
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
        setLoading(false);
      });
  }, [dataLoaded]);

  return (
    <DataOneFilterContext.Provider
      value={{
        loading,
        dataLoaded,
        error,
        totalDatasetCount,
        warmCache,
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
