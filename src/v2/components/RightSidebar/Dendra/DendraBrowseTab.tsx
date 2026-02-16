// ============================================================================
// DendraBrowseTab — Station filter + station cards + drill-down to detail.
// Filter: toggle "Active only" to hide inactive stations.
// Station card click → StationDetailView with datastream summaries.
// ============================================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDendra, useSummariesByStation } from '../../../context/DendraContext';
import { useMap } from '../../../context/MapContext';
import { useLayers } from '../../../context/LayerContext';
import { StationCard } from './StationCard';
import { StationDetailView } from './StationDetailView';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';

export function DendraBrowseTab() {
  const {
    filteredStations, loading, error, dataLoaded,
    showActiveOnly, toggleActiveOnly, setShowActiveOnly, stationCount,
    openChart,
  } = useDendra();
  const { activeLayer, lastEditFiltersRequest, getPinnedByLayerId } = useLayers();
  const summariesByStation = useSummariesByStation();

  // Detail view state
  const [selectedStation, setSelectedStation] = useState<DendraStation | null>(null);

  // Map interactions
  const { highlightPoint, clearHighlight, viewRef } = useMap();

  const lastConsumedHydrateRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  useEffect(() => {
    if (activeLayer?.dataSource !== 'dendra') return;

    const viewChanged = activeLayer.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    prevHydrateViewIdRef.current = activeLayer.viewId;

    if (!viewChanged && !editRequested) return;
    if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;

    const pinned = getPinnedByLayerId(activeLayer.layerId);
    if (!pinned) return;

    const sourceFilters = activeLayer.viewId && pinned.views
      ? pinned.views.find(v => v.id === activeLayer.viewId)?.dendraFilters
      : pinned.dendraFilters;
    if (!sourceFilters) return;

    setShowActiveOnly(!!sourceFilters.showActiveOnly);
  }, [
    activeLayer?.dataSource,
    activeLayer?.layerId,
    activeLayer?.viewId,
    lastEditFiltersRequest,
    getPinnedByLayerId,
    setShowActiveOnly,
  ]);

  const handleViewOnMap = useCallback((station: DendraStation) => {
    highlightPoint(station.longitude, station.latitude);
    const view = viewRef.current;
    if (view) {
      view.goTo(
        { center: [station.longitude, station.latitude], zoom: 15 },
        { duration: 800 },
      );
    }
    setTimeout(clearHighlight, 5000);
  }, [highlightPoint, clearHighlight, viewRef]);

  // Chart handler — opens the floating panel + pans/zooms to the station
  const handleViewChart = useCallback((station: DendraStation, summary: DendraSummary) => {
    openChart(station, summary);

    // Pan/zoom to the station and highlight it
    highlightPoint(station.longitude, station.latitude);
    const view = viewRef.current;
    if (view) {
      view.goTo(
        { center: [station.longitude, station.latitude], zoom: 14 },
        { duration: 1000 },
      );
    }
    setTimeout(clearHighlight, 8000);
  }, [openChart, highlightPoint, clearHighlight, viewRef]);

  // Drill-down: station detail view
  if (selectedStation) {
    const stationSummaries = summariesByStation.get(selectedStation.station_id) ?? [];
    return (
      <StationDetailView
        station={selectedStation}
        summaries={stationSummaries}
        onBack={() => setSelectedStation(null)}
        onViewOnMap={() => handleViewOnMap(selectedStation)}
        onViewChart={(summary) => handleViewChart(selectedStation, summary)}
      />
    );
  }

  const activeCount = filteredStations.filter(s => s.is_active === 1).length;
  const inactiveCount = stationCount - activeCount;

  return (
    <div id="dendra-browse-tab" className="space-y-3">
      {/* Filter section */}
      <div id="dendra-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Filter Stations
          </span>
          <span className="text-xs text-gray-400">
            {filteredStations.length} of {stationCount}
          </span>
        </div>

        {/* Active only toggle */}
        <label
          id="dendra-active-filter"
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
            showActiveOnly
              ? 'bg-emerald-50 hover:bg-emerald-100'
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={toggleActiveOnly}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className={`text-sm flex-1 ${showActiveOnly ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
            Active stations only
          </span>
          {inactiveCount > 0 && (
            <span className="text-xs text-gray-400">
              ({inactiveCount} inactive)
            </span>
          )}
        </label>
      </div>

      {/* Loading state */}
      {loading && !dataLoaded && (
        <InlineLoadingRow id="dendra-browse-loading" message="Loading stations..." />
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Station cards */}
      {dataLoaded && !error && (
        <div className="space-y-2">
          {filteredStations.map(station => (
            <StationCard
              key={station.station_id}
              station={station}
              summaryCount={summariesByStation.get(station.station_id)?.length ?? 0}
              onViewDetail={() => setSelectedStation(station)}
              onViewOnMap={() => handleViewOnMap(station)}
            />
          ))}

          {filteredStations.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              No stations found{showActiveOnly ? ' (try disabling "Active only" filter)' : ''}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
