// ============================================================================
// INaturalistBrowseTab — Filter section + observation cards + pagination
// Taxon filter auto-applies (DFT-039). Filter can be controlled from:
//   1. The floating legend widget over the map
//   2. The taxon dropdown in this Browse tab
// Both use the global INaturalistFilterContext.
//
// Map Marker Click Integration: When activeLayer.featureId is set (from map
// marker click), automatically opens the detail view for that observation.
// ============================================================================

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, ChevronDown, Search, X, Calendar } from 'lucide-react';
import {
  useINaturalistObservations,
  TAXON_CATEGORIES,
  type INatFilters,
  type INatObservation,
} from '../../../hooks/useINaturalistObservations';
import { useMap } from '../../../context/MapContext';
import { useINaturalistFilter } from '../../../context/INaturalistFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { ObservationCard } from './ObservationCard';
import { INaturalistDetailView } from './INaturalistDetailView';
import { InlineLoadingRow, RefreshLoadingRow } from '../../shared/loading/LoadingPrimitives';

export function INaturalistBrowseTab() {
  const {
    selectedTaxa,
    startDate,
    endDate,
    toggleTaxon,
    setSelectedTaxa,
    setDateRange,
    selectAll,
    clearAll,
    allObservations,
  } = useINaturalistFilter();
  const { activeLayer, lastEditFiltersRequest, lastFiltersClearedTimestamp, getPinnedByLayerId, syncINaturalistFilters } = useLayers();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filters: INatFilters = useMemo(() => ({
    selectedTaxa,
    searchTerm: debouncedSearchTerm,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }), [selectedTaxa, debouncedSearchTerm, startDate, endDate]);

  // Data fetching
  const {
    observations, loading, error,
    fetchedCount,
    page, totalPages, goToPage,
  } = useINaturalistObservations(filters);

  // Detail view state
  const [selectedObs, setSelectedObs] = useState<INatObservation | null>(null);

  // Dropdown state for filter section
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Auto-open detail view when map marker is clicked (activeLayer.featureId is set)
  useEffect(() => {
    if (activeLayer?.featureId && activeLayer.layerId === 'inaturalist-obs') {
      const obs = allObservations.find(o => o.id === activeLayer.featureId);
      if (obs) {
        setSelectedObs(obs);
      }
    }
  }, [activeLayer, allObservations]);

  // Actions
  const { viewRef } = useMap();

  const handleViewOnMap = useCallback(async (obs: INatObservation) => {
    const [lon, lat] = obs.coordinates;
    const view = viewRef.current;
    if (!view) return;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;

    try {
      // Zoom to observation
      await view.goTo({ center: [lon, lat], zoom: 15 }, { duration: 800 });

      // Find the graphic on the map to open its popup — ArcGIS natively highlights the feature
      const map = view.map;
      if (!map) return;
      const layer = map.findLayerById('v2-inaturalist-obs') as __esri.GraphicsLayer;
      if (layer) {
        const graphic = layer.graphics.find(g => g.attributes?.id === obs.id);
        if (graphic && graphic.geometry) {
          view.openPopup({
            features: [graphic],
            location: graphic.geometry as __esri.Point,
          });
        }
      }
    } catch (error) {
      // ArcGIS goTo can reject when view state changes; avoid crashing browse/detail flow.
      console.warn('[iNat] Failed to focus observation on map', { observationId: obs.id, error });
    }
  }, [viewRef]);

  const hasFilter = selectedTaxa.size > 0;
  const filterCount = hasFilter ? selectedTaxa.size : TAXON_CATEGORIES.length;
  const hasActiveSearch = debouncedSearchTerm.trim().length > 0;
  const hasDateFilter = !!(startDate || endDate);
  const hasStaleResults = allObservations.length > 0;
  const showInitialLoading = loading && !hasStaleResults;
  const showRefreshLoading = loading && hasStaleResults;

  // ── Hydrate Browse filters (ONE-SHOT, not continuous) ──────────────────────
  // Runs ONLY when the user explicitly triggers it:
  //   1. "Edit Filters" clicked in Map Layers widget (lastEditFiltersRequest)
  //   2. Active view switches (activeLayer.viewId)
  //   3. "Clear" clicked in Map Layers widget (lastFiltersClearedTimestamp)
  // NOT on every pinned-layer update — that would fight the sync effect below
  // and cause an infinite read-write oscillation.
  const lastConsumedHydrateRef = useRef(0);
  const lastConsumedClearRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  useEffect(() => {
    if (activeLayer?.layerId !== 'inaturalist-obs') return;

    const viewChanged = activeLayer.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    const clearRequested = lastFiltersClearedTimestamp > lastConsumedClearRef.current;
    prevHydrateViewIdRef.current = activeLayer.viewId;

    // Only hydrate on explicit triggers — not on every dependency change
    if (!viewChanged && !editRequested && !clearRequested) return;
    if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;
    if (clearRequested) lastConsumedClearRef.current = lastFiltersClearedTimestamp;

    const pinned = getPinnedByLayerId(activeLayer.layerId);
    if (!pinned) return;

    const sourceFilters = activeLayer.viewId && pinned.views
      ? pinned.views.find(v => v.id === activeLayer.viewId)?.inaturalistFilters
      : pinned.inaturalistFilters;
    if (!sourceFilters) return;

    setSelectedTaxa(new Set(sourceFilters.selectedTaxa));
    setDateRange(sourceFilters.startDate || '', sourceFilters.endDate || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally gated by ref guards
  }, [activeLayer?.layerId, activeLayer?.viewId, lastEditFiltersRequest, lastFiltersClearedTimestamp, getPinnedByLayerId, setSelectedTaxa, setDateRange]);

  // Keep Map Layers widget metadata in sync with the active iNaturalist view.
  // Depends on isPinned so the effect re-fires when the layer transitions from
  // active-only → pinned (pinLayer creates with filterCount:0, this populates it).
  useEffect(() => {
    if (activeLayer?.layerId !== 'inaturalist-obs') return;

    syncINaturalistFilters(
      activeLayer.layerId,
      {
        selectedTaxa: Array.from(selectedTaxa).sort(),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      fetchedCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    fetchedCount,
    selectedTaxa,
    startDate,
    endDate,
    syncINaturalistFilters,
  ]);

  // Keep this branch AFTER all hooks to preserve hook ordering.
  if (selectedObs) {
    return (
      <INaturalistDetailView
        observation={selectedObs}
        onBack={() => setSelectedObs(null)}
        onViewOnMap={() => { void handleViewOnMap(selectedObs); }}
      />
    );
  }

  return (
    <div id="inat-browse-tab" className="space-y-3">
      {/* Search bar */}
      <div id="inat-search-bar" className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by species name..."
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]
                       placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {hasActiveSearch && (
          <p className="text-xs text-gray-500 mt-1.5">
            Searching in {filterCount === TAXON_CATEGORIES.length ? 'all taxa' : `${filterCount} ${filterCount === 1 ? 'taxon' : 'taxa'}`}
          </p>
        )}
      </div>
      {/* Filter section (DFT-038) - Compact dropdown */}
      <div id="inat-filter-section" className="bg-slate-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter Observations
          </span>
          {hasFilter && (
            <div id="inat-filter-actions" className="flex items-center gap-2">
              <button
                id="inat-filter-select-all"
                onClick={selectAll}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Select All
              </button>
              <button
                id="inat-filter-clear-all"
                onClick={clearAll}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Dropdown trigger */}
        <button
          id="inat-filter-dropdown-trigger"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full mt-2 flex items-center justify-between px-3 py-2 bg-white border border-gray-200
                     rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm text-gray-700">
            {filterCount === TAXON_CATEGORIES.length ? 'All Taxa' : `${filterCount} ${filterCount === 1 ? 'Taxon' : 'Taxa'} Selected`}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown content */}
        {isFilterOpen && (
          <div id="inat-filter-dropdown-content" className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {TAXON_CATEGORIES.map(taxon => {
              const isSelected = !hasFilter || selectedTaxa.has(taxon.value);
              return (
                <label
                  key={taxon.value}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-50 hover:bg-gray-100 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTaxon(taxon.value)}
                    className="w-4 h-4 accent-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-[10px]">{taxon.emoji}</span>
                  <span className={`text-sm flex-1 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {taxon.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {/* Note about legend widget sync */}
        <p className="text-xs text-gray-500 italic mt-2">
          Tip: You can also filter using the legend widget on the map
        </p>
      </div>

      {/* Date range filter */}
      <div id="inat-date-range-filter" className="bg-slate-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Date Range
          </span>
          {hasDateFilter && (
            <button
              id="inat-date-range-clear"
              onClick={() => setDateRange('', '')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            id="inat-date-start"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setDateRange(e.target.value, endDate)}
            className="flex-1 px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]
                       text-gray-700"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            id="inat-date-end"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setDateRange(startDate, e.target.value)}
            className="flex-1 px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]
                       text-gray-700"
          />
        </div>
      </div>

      {/* Loading state */}
      {showInitialLoading && (
        <InlineLoadingRow id="inat-browse-initial-loading" message="Loading observations..." />
      )}

      {showRefreshLoading && (
        <RefreshLoadingRow
          id="inat-browse-refresh-loading"
          message="Refreshing observations..."
        />
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Observation cards */}
      {!error && !showInitialLoading && (
        <div id="inat-observation-cards" className={`space-y-2 ${showRefreshLoading ? 'opacity-60' : ''}`}>
          {observations.map(obs => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onViewDetail={() => {
                setSelectedObs(obs);
                void handleViewOnMap(obs);
              }}
              onViewOnMap={() => { void handleViewOnMap(obs); }}
            />
          ))}

          {observations.length === 0 && !showRefreshLoading && (
            <p className="text-sm text-gray-400 text-center py-6">
              No observations found{hasActiveSearch ? ' matching your search' : hasFilter ? ' for this filter' : ''}.
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !showInitialLoading && (
        <div id="inat-pagination" className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900
                       disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900
                       disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
