// ============================================================================
// useINaturalistObservations — Fetch iNaturalist observations from TNC ArcGIS
// Supports taxon filtering, client-side pagination, and AbortController.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  tncINaturalistService,
  type TNCArcGISObservation,
} from '../../services/tncINaturalistService';

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

export interface INatFilters {
  selectedTaxa?: Set<string>; // Empty set = show all
  startDate?: string;     // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD
  /** When true, skip fetching entirely (for conditional hook usage) */
  skip?: boolean;
}

const PAGE_SIZE = 20;
const MAX_RESULTS = 2000;

/** Transform TNC ArcGIS observation to our simplified format */
function transformObservation(obs: TNCArcGISObservation): INatObservation {
  const photoUrl = tncINaturalistService.getPrimaryImageUrl(obs);
  const photoAttribution = tncINaturalistService.getPhotoAttribution(obs);
  return {
    id: obs.observation_id,
    uuid: obs.observation_uuid,
    commonName: obs.common_name || null,
    scientificName: obs.scientific_name,
    taxonCategory: obs.taxon_category_name || 'Unknown',
    observedOn: obs.observed_on,
    observer: obs.user_name || 'Unknown',
    photoUrl,
    photoAttribution,
    coordinates: obs.geometry.coordinates,
    iNatUrl: `https://www.inaturalist.org/observations/${obs.observation_uuid}`,
  };
}

export function useINaturalistObservations(filters: INatFilters) {
  const [observations, setObservations] = useState<INatObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalServiceCount, setTotalServiceCount] = useState(0);
  const [page, setPage] = useState(1);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch observations when filters change
  useEffect(() => {
    if (filters.skip) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setPage(1);

      try {
        // Convert Set to array for service
        const taxonArray = filters.selectedTaxa && filters.selectedTaxa.size > 0
          ? Array.from(filters.selectedTaxa)
          : [];

        // Get total count first
        const count = await tncINaturalistService.queryObservationsCount({
          taxonCategories: taxonArray,
          startDate: filters.startDate,
          endDate: filters.endDate,
          searchMode: 'expanded',
        });
        if (cancelled) return;
        setTotalServiceCount(count);

        // Fetch observations
        const raw = await tncINaturalistService.queryObservations({
          taxonCategories: taxonArray,
          startDate: filters.startDate,
          endDate: filters.endDate,
          maxResults: MAX_RESULTS,
          searchMode: 'expanded',
        });
        if (cancelled) return;

        setObservations(raw.map(transformObservation));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load observations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; controller.abort(); };
  }, [filters.skip, filters.selectedTaxa, filters.startDate, filters.endDate]);

  // Pagination helpers
  const totalPages = Math.ceil(observations.length / PAGE_SIZE);
  const pagedObservations = observations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages || 1)));
  }, [totalPages]);

  return {
    observations: pagedObservations,
    allObservations: observations,
    loading,
    error,
    totalCount: totalServiceCount,
    fetchedCount: observations.length,
    page,
    totalPages,
    goToPage,
    pageSize: PAGE_SIZE,
  };
}

// Re-export shared taxon config for sidebar use
export { TAXON_CONFIG as TAXON_CATEGORIES } from '../components/Map/layers/taxonConfig';
