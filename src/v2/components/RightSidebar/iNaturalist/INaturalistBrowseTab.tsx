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

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
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

export function INaturalistBrowseTab() {
  const { selectedTaxa, toggleTaxon, selectAll, allObservations } = useINaturalistFilter();
  const { activeLayer } = useLayers();

  const filters: INatFilters = useMemo(() => ({
    selectedTaxa,
  }), [selectedTaxa]);

  // Data fetching
  const {
    observations, loading, error,
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

    // Zoom to observation
    await view.goTo({ center: [lon, lat], zoom: 15 }, { duration: 800 });

    // Find the graphic on the map to open its popup — ArcGIS natively highlights the feature
    const layer = view.map.findLayerById('v2-inaturalist-obs') as __esri.GraphicsLayer;
    if (layer) {
      const graphic = layer.graphics.find(g => g.attributes?.id === obs.id);
      if (graphic && graphic.geometry) {
        view.openPopup({
          features: [graphic],
          location: graphic.geometry as __esri.Point,
        });
      }
    }
  }, [viewRef]);

  // If detail view is open, render it
  if (selectedObs) {
    return (
      <INaturalistDetailView
        observation={selectedObs}
        onBack={() => setSelectedObs(null)}
        onViewOnMap={() => handleViewOnMap(selectedObs)}
      />
    );
  }

  const hasFilter = selectedTaxa.size > 0;
  const filterCount = hasFilter ? selectedTaxa.size : TAXON_CATEGORIES.length;

  return (
    <div id="inat-browse-tab" className="space-y-3">
      {/* Filter section (DFT-038) - Compact dropdown */}
      <div id="inat-filter-section" className="bg-slate-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter Observations
          </span>
          {hasFilter && (
            <button
              onClick={selectAll}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Select All
            </button>
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
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
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
              onViewDetail={() => { setSelectedObs(obs); handleViewOnMap(obs); }}
              onViewOnMap={() => handleViewOnMap(obs)}
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
