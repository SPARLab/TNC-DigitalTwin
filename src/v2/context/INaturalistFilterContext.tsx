// ============================================================================
// INaturalistFilterContext — Central iNaturalist data + filter state
// Fetches observations from TNC ArcGIS (with bounding box), stores locally.
// LAZY: data is NOT fetched on mount. Call warmCache() to trigger the fetch.
// Provides: filter state, observations, loading/error, taxon counts, cache.
// Shared between: floating legend widget, right sidebar, map layer.
// ============================================================================

import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  tncINaturalistService,
  type TNCArcGISObservation,
} from '../../services/tncINaturalistService';

/** Simplified observation type used by map layer, sidebar, and legend */
export interface INatObservation {
  id: number;
  uuid: string;
  commonName: string | null;
  scientificName: string;
  taxonCategory: string;
  observedOn: string;
  observer: string;
  photoUrl: string | null;
  photoAttribution: string | null;
  coordinates: [number, number]; // [lon, lat]
  iNatUrl: string;
}

interface INaturalistContextValue {
  // Filter state
  selectedTaxa: Set<string>;
  startDate: string;
  endDate: string;
  toggleTaxon: (taxon: string) => void;
  setSelectedTaxa: (taxa: Set<string>) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  hasFilter: boolean;

  // Data state
  allObservations: INatObservation[];
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;
  totalServiceCount: number;
  taxonCounts: Map<string, number>;

  // Cache lifecycle
  /** Trigger data fetch. Idempotent — no-op if already fetched or in-flight. */
  warmCache: () => void;
}

const INaturalistFilterContext = createContext<INaturalistContextValue | null>(null);

const MAX_RESULTS = 5000; // Enough for the preserve area

/** Convert ArcGIS epoch-ms (or string) date to YYYY-MM-DD for consistent comparisons */
function normalizeDate(raw: string | number): string {
  if (typeof raw === 'number' || /^\d{10,}$/.test(String(raw))) {
    const d = new Date(Number(raw));
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  return String(raw);
}

/** Transform TNC ArcGIS response to our simplified format */
function transformObservation(obs: TNCArcGISObservation): INatObservation {
  return {
    id: obs.observation_id,
    uuid: obs.observation_uuid,
    commonName: obs.common_name || null,
    scientificName: obs.scientific_name,
    taxonCategory: obs.taxon_category_name || 'Unknown',
    observedOn: normalizeDate(obs.observed_on),
    observer: obs.user_name || 'Unknown',
    photoUrl: tncINaturalistService.getPrimaryImageUrl(obs),
    photoAttribution: tncINaturalistService.getPhotoAttribution(obs),
    coordinates: obs.geometry.coordinates,
    iNatUrl: `https://www.inaturalist.org/observations/${obs.observation_uuid}`,
  };
}

export function INaturalistFilterProvider({ children }: { children: ReactNode }) {
  // Filter state
  const [selectedTaxa, setSelectedTaxa] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data state
  const [allObservations, setAllObservations] = useState<INatObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totalServiceCount, setTotalServiceCount] = useState(0);

  // Cache lifecycle — fetch is lazy, triggered by warmCache()
  const [fetchRequested, setFetchRequested] = useState(false);
  const fetchStartedRef = useRef(false);


  // Filter actions
  const toggleTaxon = useCallback((taxon: string) => {
    setSelectedTaxa(prev => {
      const next = new Set(prev);
      if (next.has(taxon)) next.delete(taxon);
      else next.add(taxon);
      return next;
    });
  }, []);

  const setSelectedTaxaFilter = useCallback((taxa: Set<string>) => {
    setSelectedTaxa(new Set(taxa));
  }, []);

  const setDateRange = useCallback((nextStartDate: string, nextEndDate: string) => {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  }, []);

  // Idempotent: skip setState if already empty (avoids wasted re-renders)
  const selectAll = useCallback(() => setSelectedTaxa(prev => prev.size === 0 ? prev : new Set()), []);
  const clearAll = useCallback(() => setSelectedTaxa(prev => prev.size === 0 ? prev : new Set()), []);
  const hasFilter = selectedTaxa.size > 0;

  /** Idempotent fetch trigger — safe to call multiple times */
  const warmCache = useCallback(() => {
    if (fetchStartedRef.current) {
      return;
    }
    fetchStartedRef.current = true;
    setLoading(true); // Show loading immediately (avoids 1-frame flash)
    setFetchRequested(true);
  }, []);

  // Compute taxon counts from locally-cached data (instant, no network)
  const taxonCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obs of allObservations) {
      counts.set(obs.taxonCategory, (counts.get(obs.taxonCategory) ?? 0) + 1);
    }
    return counts;
  }, [allObservations]);

  // Fetch observations when warmCache() is called — spatially filtered to preserve area.
  // Lazy: does NOT run on mount. First call to warmCache() sets fetchRequested = true.
  useEffect(() => {
    if (!fetchRequested) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch count + observations in parallel (both use expanded bounding box)
        const [count, raw] = await Promise.all([
          tncINaturalistService.queryObservationsCount({ searchMode: 'expanded' }),
          tncINaturalistService.queryObservations({
            maxResults: MAX_RESULTS,
            searchMode: 'expanded',
          }),
        ]);

        if (cancelled) return;
        setTotalServiceCount(count);
        setAllObservations(raw.map(transformObservation));
        setDataLoaded(true);
      } catch (err) {
        if (cancelled) return;
        console.error('[iNat Cache] ❌ Fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load observations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [fetchRequested]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <INaturalistFilterContext.Provider
      value={{
        selectedTaxa, startDate, endDate,
        toggleTaxon, setSelectedTaxa: setSelectedTaxaFilter, setDateRange, selectAll, clearAll, hasFilter,
        allObservations, loading, error, dataLoaded,
        totalServiceCount, taxonCounts,
        warmCache,
      }}
    >
      {children}
    </INaturalistFilterContext.Provider>
  );
}

export function useINaturalistFilter() {
  const context = useContext(INaturalistFilterContext);
  if (!context) throw new Error('useINaturalistFilter must be used within INaturalistFilterProvider');
  return context;
}
