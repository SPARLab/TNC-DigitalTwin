// ============================================================================
// useINaturalistObservations — Thin wrapper over INaturalistFilterContext
// Provides client-side filtering + pagination for the right sidebar.
// All data comes from the context (fetched once on mount with bounding box).
// ============================================================================

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useINaturalistFilter, type INatObservation } from '../context/INaturalistFilterContext';

export type { INatObservation };

export interface INatFilters {
  selectedTaxa?: Set<string>;
  selectedSpecies?: Set<string>;
  excludeAllSpecies?: boolean;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  /** When true, skip returning data (for conditional hook usage) */
  skip?: boolean;
}

const PAGE_SIZE = 10;

export function useINaturalistObservations(filters: INatFilters) {
  const { allObservations, loading, error, totalServiceCount } = useINaturalistFilter();
  const [page, setPage] = useState(1);

  // Client-side filtering (instant — no network)
  const filtered = useMemo(() => {
    if (filters.skip) return [];
    let result = allObservations;

    if (filters.selectedTaxa && filters.selectedTaxa.size > 0) {
      result = result.filter(o => filters.selectedTaxa!.has(o.taxonCategory));
    }
    if (filters.excludeAllSpecies) {
      result = [];
    } else if (filters.selectedSpecies && filters.selectedSpecies.size > 0) {
      result = result.filter(o => filters.selectedSpecies!.has(o.speciesName));
    }
    if (filters.startDate) {
      result = result.filter(o => o.observedOn >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter(o => o.observedOn <= filters.endDate!);
    }
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      result = result.filter(o => {
        const common = o.commonName?.toLowerCase() || '';
        const scientific = o.scientificName.toLowerCase();
        return common.includes(term) || scientific.includes(term);
      });
    }

    return result;
  }, [allObservations, filters.skip, filters.selectedTaxa, filters.selectedSpecies, filters.excludeAllSpecies, filters.startDate, filters.endDate, filters.searchTerm]);

  // Reset to page 1 when filters change
  const taxaKey = useMemo(
    () => (filters.selectedTaxa ? Array.from(filters.selectedTaxa).sort().join(',') : ''),
    [filters.selectedTaxa],
  );
  const speciesKey = useMemo(
    () => `${filters.excludeAllSpecies ? '__none__' : ''}|${filters.selectedSpecies ? Array.from(filters.selectedSpecies).sort().join(',') : ''}`,
    [filters.selectedSpecies, filters.excludeAllSpecies],
  );
  const searchTermKey = filters.searchTerm || '';
  const dateKey = `${filters.startDate || ''}~${filters.endDate || ''}`;
  const prevKeyRef = useRef(taxaKey + '|' + speciesKey + '|' + searchTermKey + '|' + dateKey);
  useEffect(() => {
    const currentKey = taxaKey + '|' + speciesKey + '|' + searchTermKey + '|' + dateKey;
    if (currentKey !== prevKeyRef.current) {
      setPage(1);
      prevKeyRef.current = currentKey;
    }
  }, [taxaKey, speciesKey, searchTermKey, dateKey]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, totalPages || 1);
  const pagedObservations = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages || 1)));
  }, [totalPages]);

  return {
    observations: pagedObservations,
    allObservations: filtered,
    loading: filters.skip ? false : loading,
    error: filters.skip ? null : error,
    totalCount: totalServiceCount,
    fetchedCount: filtered.length,
    page: safePage,
    totalPages,
    goToPage,
    pageSize: PAGE_SIZE,
  };
}

// Re-export shared taxon config for sidebar use
export { TAXON_CONFIG as TAXON_CATEGORIES } from '../components/Map/layers/taxonConfig';
