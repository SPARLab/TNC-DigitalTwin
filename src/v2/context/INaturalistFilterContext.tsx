// ============================================================================
// INaturalistFilterContext — Central iNaturalist data + filter state
// Fetches observations once from TNC ArcGIS (with bounding box), stores locally.
// Provides: filter state, observations, loading/error, taxon counts.
// Shared between: floating legend widget, right sidebar, map layer.
// ============================================================================

import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useMemo } from 'react';
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
  toggleTaxon: (taxon: string) => void;
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
}

const INaturalistFilterContext = createContext<INaturalistContextValue | null>(null);

const MAX_RESULTS = 5000; // Enough for the preserve area

/** Transform TNC ArcGIS response to our simplified format */
function transformObservation(obs: TNCArcGISObservation): INatObservation {
  return {
    id: obs.observation_id,
    uuid: obs.observation_uuid,
    commonName: obs.common_name || null,
    scientificName: obs.scientific_name,
    taxonCategory: obs.taxon_category_name || 'Unknown',
    observedOn: obs.observed_on,
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

  // Data state
  const [allObservations, setAllObservations] = useState<INatObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [totalServiceCount, setTotalServiceCount] = useState(0);

  // Filter actions
  const toggleTaxon = useCallback((taxon: string) => {
    setSelectedTaxa(prev => {
      const next = new Set(prev);
      if (next.has(taxon)) next.delete(taxon);
      else next.add(taxon);
      return next;
    });
  }, []);

  // Idempotent: skip setState if already empty (avoids wasted re-renders)
  const selectAll = useCallback(() => setSelectedTaxa(prev => prev.size === 0 ? prev : new Set()), []);
  const clearAll = useCallback(() => setSelectedTaxa(prev => prev.size === 0 ? prev : new Set()), []);
  const hasFilter = selectedTaxa.size > 0;

  // Compute taxon counts from locally-cached data (instant, no network)
  const taxonCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obs of allObservations) {
      counts.set(obs.taxonCategory, (counts.get(obs.taxonCategory) ?? 0) + 1);
    }
    return counts;
  }, [allObservations]);

  // Fetch observations on mount — spatially filtered to preserve area.
  // No fetchedRef guard — React 18 StrictMode remounts effects; the cancelled
  // flag from cleanup handles the first (discarded) mount, and the second
  // mount re-fetches cleanly. The browser HTTP cache prevents duplicate network
  // requests so the performance cost is negligible.
  useEffect(() => {
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
        setError(err instanceof Error ? err.message : 'Failed to load observations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
    <INaturalistFilterContext.Provider
      value={{
        selectedTaxa, toggleTaxon, selectAll, clearAll, hasFilter,
        allObservations, loading, error, dataLoaded,
        totalServiceCount, taxonCounts,
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
