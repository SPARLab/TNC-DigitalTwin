// ============================================================================
// INaturalistBrowseTab — Filter section + observation cards + pagination
// Taxon filter auto-applies (DFT-039). Self-contained observations (no Level 3).
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import {
  useINaturalistObservations,
  TAXON_CATEGORIES,
  type INatFilters,
  type INatObservation,
} from '../../../hooks/useINaturalistObservations';
// NOTE: useBookmarks removed — Saved Items widget merged into Map Layers (Feb 11 decision).
// Bookmark action will be replaced with "Save as View" in a future task.
// import { useBookmarks } from '../../../context/BookmarkContext';
import { useMap } from '../../../context/MapContext';
import { ObservationCard } from './ObservationCard';
import { INaturalistDetailView } from './INaturalistDetailView';
import { TaxonLegend } from './TaxonLegend';

export function INaturalistBrowseTab() {
  // Filter state
  const [taxonCategory, setTaxonCategory] = useState<string>('');

  const filters: INatFilters = useMemo(() => ({
    taxonCategory: taxonCategory || undefined,
  }), [taxonCategory]);

  // Data fetching
  const {
    observations, allObservations, loading, error,
    totalCount, fetchedCount,
    page, totalPages, goToPage,
  } = useINaturalistObservations(filters);

  // Detail view state
  const [selectedObs, setSelectedObs] = useState<INatObservation | null>(null);

  // Actions
  // TODO: Replace addBookmark with "Save as View" action (Feb 11 design decision)
  const { highlightPoint, clearHighlight, viewRef } = useMap();

  const handleViewOnMap = useCallback((obs: INatObservation) => {
    const [lon, lat] = obs.coordinates;
    highlightPoint(lon, lat);

    // Zoom to observation
    const view = viewRef.current;
    if (view) {
      view.goTo({ center: [lon, lat], zoom: 15 }, { duration: 800 });
    }

    // Clear highlight after 5 seconds
    setTimeout(clearHighlight, 5000);
  }, [highlightPoint, clearHighlight, viewRef]);

  // TODO: Replace with "Save as View" — pins iNaturalist layer with filter for this observation
  const handleBookmark = useCallback((_obs: INatObservation) => {
    // Placeholder — will create a filtered view in Map Layers widget
    console.log('Save as View — not yet implemented (Feb 11 design decision)');
  }, []);

  // If detail view is open, render it
  if (selectedObs) {
    return (
      <INaturalistDetailView
        observation={selectedObs}
        onBack={() => setSelectedObs(null)}
        onViewOnMap={() => handleViewOnMap(selectedObs)}
        onBookmark={() => handleBookmark(selectedObs)}
      />
    );
  }

  const hasFilter = !!taxonCategory;

  return (
    <div id="inat-browse-tab" className="space-y-3">
      {/* Filter section (DFT-038) */}
      <div id="inat-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter Observations
          </span>
          {hasFilter && (
            <button
              onClick={() => setTaxonCategory('')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Taxon dropdown */}
        <select
          id="inat-taxon-filter"
          value={taxonCategory}
          onChange={e => setTaxonCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Taxon Groups</option>
          {TAXON_CATEGORIES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Result count */}
        <p className="text-xs text-gray-500">
          {loading ? (
            'Loading...'
          ) : (
            <>Showing {fetchedCount.toLocaleString()} of {totalCount.toLocaleString()} observations</>
          )}
        </p>
      </div>

      {/* Taxon legend — clickable filter shortcut */}
      {!loading && allObservations.length > 0 && (
        <TaxonLegend
          observations={allObservations}
          activeTaxon={taxonCategory}
          onTaxonClick={setTaxonCategory}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading observations...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Observation cards */}
      {!loading && !error && (
        <div className={`space-y-2 ${loading ? 'opacity-50' : ''}`}>
          {observations.map(obs => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              onViewDetail={() => setSelectedObs(obs)}
              onViewOnMap={() => handleViewOnMap(obs)}
              onBookmark={() => handleBookmark(obs)}
            />
          ))}

          {observations.length === 0 && !loading && (
            <p className="text-sm text-gray-400 text-center py-6">
              No observations found{hasFilter ? ' for this filter' : ''}.
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
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
