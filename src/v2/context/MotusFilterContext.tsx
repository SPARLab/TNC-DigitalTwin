import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { motusService, type MotusBrowseFilters, type MotusSpeciesSummary } from '../../services/motusService';

interface MotusFilterContextValue {
  loading: boolean;
  dataLoaded: boolean;
  error: string | null;
  speciesSummaries: MotusSpeciesSummary[];
  browseFilters: Required<MotusBrowseFilters>;
  selectedSpecies: string | null;
  selectedTagId: number | null;
  movementDisclaimer: string;
  warmCache: () => void;
  refreshSpeciesSummaries: () => Promise<void>;
  setBrowseFilters: (next: Partial<MotusBrowseFilters>) => void;
  setSelectedSpecies: (species: string | null) => void;
  setSelectedTagId: (tagId: number | null) => void;
  setMovementDisclaimer: (message: string) => void;
}

const DEFAULT_BROWSE_FILTERS: Required<MotusBrowseFilters> = {
  startDate: '',
  endDate: '',
  minHitCount: 2,
  minMotusFilter: 1,
};

const MotusFilterContext = createContext<MotusFilterContextValue | null>(null);

export function MotusFilterProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesSummaries, setSpeciesSummaries] = useState<MotusSpeciesSummary[]>([]);
  const [browseFilters, setBrowseFiltersState] = useState<Required<MotusBrowseFilters>>(DEFAULT_BROWSE_FILTERS);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [movementDisclaimer, setMovementDisclaimer] = useState(
    'Choose a preserve-linked tag to render its full inferred journey across receiver stations.',
  );
  const inFlightRef = useRef(false);

  const refreshSpeciesSummaries = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const summaries = await motusService.getSpeciesSummaries(browseFilters);
      setSpeciesSummaries(summaries);
      setDataLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load MOTUS species summaries';
      setError(message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [browseFilters]);

  const warmCache = useCallback(() => {
    if (dataLoaded || inFlightRef.current) return;
    void refreshSpeciesSummaries();
  }, [dataLoaded, refreshSpeciesSummaries]);

  const setBrowseFilters = useCallback((next: Partial<MotusBrowseFilters>) => {
    setBrowseFiltersState((prev) => ({
      startDate: next.startDate ?? prev.startDate,
      endDate: next.endDate ?? prev.endDate,
      minHitCount: typeof next.minHitCount === 'number' ? Math.max(0, Math.floor(next.minHitCount)) : prev.minHitCount,
      minMotusFilter: typeof next.minMotusFilter === 'number' ? next.minMotusFilter : prev.minMotusFilter,
    }));
  }, []);

  const value = useMemo<MotusFilterContextValue>(
    () => ({
      loading,
      dataLoaded,
      error,
      speciesSummaries,
      browseFilters,
      selectedSpecies,
      selectedTagId,
      movementDisclaimer,
      warmCache,
      refreshSpeciesSummaries,
      setBrowseFilters,
      setSelectedSpecies,
      setSelectedTagId,
      setMovementDisclaimer,
    }),
    [
      loading,
      dataLoaded,
      error,
      speciesSummaries,
      browseFilters,
      selectedSpecies,
      selectedTagId,
      movementDisclaimer,
      warmCache,
      refreshSpeciesSummaries,
      setBrowseFilters,
    ],
  );

  return <MotusFilterContext.Provider value={value}>{children}</MotusFilterContext.Provider>;
}

export function useMotusFilter() {
  const context = useContext(MotusFilterContext);
  if (!context) throw new Error('useMotusFilter must be used within MotusFilterProvider');
  return context;
}
