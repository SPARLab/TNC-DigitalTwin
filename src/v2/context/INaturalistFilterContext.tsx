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
  speciesName: string;
  taxonCategory: string;
  observedOn: string;
  observer: string;
  photoUrl: string | null;
  photoAttribution: string | null;
  coordinates: [number, number]; // [lon, lat]
  iNatUrl: string;
}

export interface INatSpeciesOption {
  scientificName: string;
  commonName: string | null;
  taxonCategory: string | null;
  count: number;
}

interface INaturalistContextValue {
  // Filter state
  selectedTaxa: Set<string>;
  selectedSpecies: Set<string>;
  excludeAllSpecies: boolean;
  startDate: string;
  endDate: string;
  toggleTaxon: (taxon: string) => void;
  toggleSpecies: (species: string) => void;
  setSelectedTaxa: (taxa: Set<string>) => void;
  setSelectedSpecies: (species: Set<string>) => void;
  selectAllSpecies: () => void;
  clearAllSpecies: () => void;
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
  speciesCounts: Map<string, number>;
  speciesOptions: INatSpeciesOption[];

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
  // Use full scientific name (typically binomial: Genus + species epithet).
  const speciesName = obs.scientific_name?.trim() || obs.taxon_species_name?.trim() || 'Unknown species';
  return {
    id: obs.observation_id,
    uuid: obs.observation_uuid,
    commonName: obs.common_name || null,
    scientificName: obs.scientific_name,
    speciesName,
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
  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(new Set());
  const [excludeAllSpecies, setExcludeAllSpecies] = useState(false);
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

  const toggleSpecies = useCallback((species: string) => {
    setExcludeAllSpecies(false);
    setSelectedSpecies(prev => {
      const next = new Set(prev);
      if (next.has(species)) next.delete(species);
      else next.add(species);
      return next;
    });
  }, []);

  const setSelectedTaxaFilter = useCallback((taxa: Set<string>) => {
    setSelectedTaxa(new Set(taxa));
  }, []);

  const setSelectedSpeciesFilter = useCallback((species: Set<string>) => {
    setExcludeAllSpecies(false);
    setSelectedSpecies(new Set(species));
  }, []);

  const selectAllSpecies = useCallback(() => {
    setExcludeAllSpecies(false);
    setSelectedSpecies(prev => (prev.size === 0 ? prev : new Set()));
  }, []);

  const clearAllSpecies = useCallback(() => {
    setExcludeAllSpecies(true);
    setSelectedSpecies(prev => (prev.size === 0 ? prev : new Set()));
  }, []);

  const setDateRange = useCallback((nextStartDate: string, nextEndDate: string) => {
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  }, []);

  // Idempotent: skip setState if already empty (avoids wasted re-renders)
  const selectAll = useCallback(() => {
    setSelectedTaxa(prev => (prev.size === 0 ? prev : new Set()));
    setExcludeAllSpecies(false);
    setSelectedSpecies(prev => (prev.size === 0 ? prev : new Set()));
  }, []);
  const clearAll = useCallback(() => {
    setSelectedTaxa(prev => (prev.size === 0 ? prev : new Set()));
    setExcludeAllSpecies(false);
    setSelectedSpecies(prev => (prev.size === 0 ? prev : new Set()));
  }, []);
  const hasFilter = selectedTaxa.size > 0 || selectedSpecies.size > 0 || excludeAllSpecies;

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

  // Compute species counts from locally-cached data
  const speciesCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obs of allObservations) {
      if (!obs.speciesName) continue;
      counts.set(obs.speciesName, (counts.get(obs.speciesName) ?? 0) + 1);
    }
    return counts;
  }, [allObservations]);

  // Species dropdown options respect selected taxa (if any) and are sorted by frequency.
  const speciesOptions = useMemo(() => {
    const counts = new Map<string, {
      count: number;
      commonNameCounts: Map<string, number>;
      taxonCategoryCounts: Map<string, number>;
    }>();
    for (const obs of allObservations) {
      if (selectedTaxa.size > 0 && !selectedTaxa.has(obs.taxonCategory)) continue;
      if (!obs.speciesName) continue;
      const key = obs.speciesName;
      const next = counts.get(key) ?? {
        count: 0,
        commonNameCounts: new Map<string, number>(),
        taxonCategoryCounts: new Map<string, number>(),
      };
      next.count += 1;
      const commonName = obs.commonName?.trim();
      if (commonName) {
        next.commonNameCounts.set(commonName, (next.commonNameCounts.get(commonName) ?? 0) + 1);
      }
      const taxonCategory = obs.taxonCategory?.trim();
      if (taxonCategory) {
        next.taxonCategoryCounts.set(taxonCategory, (next.taxonCategoryCounts.get(taxonCategory) ?? 0) + 1);
      }
      counts.set(key, next);
    }

    return Array.from(counts.entries())
      .sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return a[0].localeCompare(b[0]);
      })
      .map(([scientificName, info]) => {
        let commonName: string | null = null;
        let maxCount = 0;
        for (const [name, count] of info.commonNameCounts.entries()) {
          if (count > maxCount) {
            commonName = name;
            maxCount = count;
          }
        }
        let taxonCategory: string | null = null;
        let maxTaxonCount = 0;
        for (const [name, count] of info.taxonCategoryCounts.entries()) {
          if (count > maxTaxonCount) {
            taxonCategory = name;
            maxTaxonCount = count;
          }
        }

        return {
          scientificName,
          commonName,
          taxonCategory,
          count: info.count,
        };
      });
  }, [allObservations, selectedTaxa]);

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
        selectedSpecies,
        excludeAllSpecies,
        toggleTaxon,
        toggleSpecies,
        setSelectedTaxa: setSelectedTaxaFilter,
        setSelectedSpecies: setSelectedSpeciesFilter,
        selectAllSpecies,
        clearAllSpecies,
        setDateRange,
        selectAll,
        clearAll,
        hasFilter,
        allObservations, loading, error, dataLoaded,
        totalServiceCount,
        taxonCounts,
        speciesCounts,
        speciesOptions,
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
