// ============================================================================
// DendraBrowseTab — Station filter + station cards + drill-down to detail.
// Filter: toggle "Active only" to hide inactive stations.
// Station card click → StationDetailView with datastream summaries.
// ============================================================================

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useDendra, useSummariesByStation } from '../../../context/DendraContext';
import { useMap } from '../../../context/MapContext';
import { useLayers } from '../../../context/LayerContext';
import { StationCard } from './StationCard';
import { StationDetailView } from './StationDetailView';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { SpatialQuerySection } from '../shared/SpatialQuerySection';
import { EditFiltersCard } from '../shared/EditFiltersCard';

export function DendraBrowseTab() {
  const {
    filteredStations, loading, error, dataLoaded,
    showActiveOnly, toggleActiveOnly, setShowActiveOnly, stationCount,
    openChart, chartPanels,
  } = useDendra();
  const { activeLayer, activateLayer, lastEditFiltersRequest, getPinnedByLayerId } = useLayers();
  const summariesByStation = useSummariesByStation();

  // Detail view state
  const [selectedStation, setSelectedStation] = useState<DendraStation | null>(null);
  const [stationHeaderFlashSignal, setStationHeaderFlashSignal] = useState(0);
  const [streamNameFilter, setStreamNameFilter] = useState('');

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
    if (editRequested) {
      lastConsumedHydrateRef.current = lastEditFiltersRequest;
      setSelectedStation(null);
      if (activeLayer.featureId != null) {
        activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
      }
    }

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
    activeLayer?.featureId,
    lastEditFiltersRequest,
    activateLayer,
    getPinnedByLayerId,
    setShowActiveOnly,
  ]);

  // Open station detail when map click sets featureId on the active Dendra layer.
  useEffect(() => {
    if (activeLayer?.dataSource !== 'dendra') return;
    if (activeLayer.featureId == null) return;

    const stationId = Number(activeLayer.featureId);
    if (!Number.isFinite(stationId)) return;

    const station = filteredStations.find((candidate) => candidate.station_id === stationId);
    if (station) {
      setSelectedStation((prev) => (prev?.station_id === station.station_id ? prev : station));
      setStationHeaderFlashSignal(Date.now());
    }
  }, [activeLayer, filteredStations]);

  const focusStationOnMap = useCallback(async (station: DendraStation) => {
    highlightPoint(station.longitude, station.latitude);
    const view = viewRef.current;
    if (!view) return;

    try {
      await view.goTo(
        { center: [station.longitude, station.latitude], zoom: 15 },
        { duration: 800 },
      );
    } catch {
      // Ignore goTo interruptions (for example, rapid user interactions).
    }

    if (activeLayer?.dataSource === 'dendra') {
      const map = view.map;
      const layer = map?.findLayerById(`v2-${activeLayer.layerId}`) as __esri.GraphicsLayer | undefined;
      const matchingGraphic = layer?.graphics.find(
        (graphic) => graphic.attributes?.station_id === station.station_id,
      );
      if (matchingGraphic && matchingGraphic.geometry?.type === 'point') {
        view.openPopup({
          features: [matchingGraphic],
          location: matchingGraphic.geometry as __esri.Point,
        });
      }
    }

    setTimeout(clearHighlight, 5000);
  }, [activeLayer, highlightPoint, clearHighlight, viewRef]);

  const handleViewOnMap = useCallback((station: DendraStation) => {
    void focusStationOnMap(station);
  }, [focusStationOnMap]);

  const handleSelectStation = useCallback((station: DendraStation) => {
    setSelectedStation(station);
    if (activeLayer?.dataSource === 'dendra') {
      activateLayer(activeLayer.layerId, activeLayer.viewId, station.station_id);
    }
    void focusStationOnMap(station);
  }, [activeLayer, activateLayer, focusStationOnMap]);

  const handleBackToStations = useCallback(() => {
    setSelectedStation(null);
    if (activeLayer?.dataSource === 'dendra') {
      activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
    }
  }, [activeLayer, activateLayer]);

  const normalizedStreamNameFilter = streamNameFilter.trim().toLowerCase();
  const effectiveActiveViewId = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return undefined;
    if (activeLayer.viewId) return activeLayer.viewId;
    const pinned = getPinnedByLayerId(activeLayer.layerId);
    return pinned?.views?.find((view) => view.isVisible)?.id;
  }, [activeLayer, getPinnedByLayerId]);

  const filteredStationsByStream = useMemo(() => {
    if (!normalizedStreamNameFilter) return filteredStations;
    return filteredStations.filter((station) => {
      const stationSummaries = summariesByStation.get(station.station_id) ?? [];
      return stationSummaries.some((summary) =>
        summary.datastream_name.toLowerCase().includes(normalizedStreamNameFilter),
      );
    });
  }, [filteredStations, summariesByStation, normalizedStreamNameFilter]);

  const handleStreamNameFilterChange = useCallback((value: string) => {
    setStreamNameFilter(value);
  }, []);

  const pinnedCountByStationForActiveView = useMemo(() => {
    const counts = new Map<number, number>();
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return counts;
    const pinned = getPinnedByLayerId(activeLayer.layerId);

    for (const panel of chartPanels) {
      const matchesActiveLayer = panel.sourceLayerId === activeLayer.layerId;
      const resolvedPanelViewId = panel.sourceViewId ?? pinned?.views?.[0]?.id;
      const matchesActiveView = resolvedPanelViewId === effectiveActiveViewId;
      const stationId = panel.station?.station_id;
      if (!matchesActiveLayer || !matchesActiveView || stationId == null) continue;
      counts.set(stationId, (counts.get(stationId) ?? 0) + 1);
    }
    return counts;
  }, [chartPanels, activeLayer, effectiveActiveViewId, getPinnedByLayerId]);

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
        onBack={handleBackToStations}
        onViewOnMap={() => handleViewOnMap(selectedStation)}
        onViewChart={(summary) => handleViewChart(selectedStation, summary)}
        stationHeaderFlashSignal={stationHeaderFlashSignal}
        streamNameFilter={streamNameFilter}
        onStreamNameFilterChange={handleStreamNameFilterChange}
        matchingStations={filteredStationsByStream}
        onSelectStation={handleSelectStation}
      />
    );
  }

  const activeCount = filteredStations.filter(s => s.is_active === 1).length;
  const inactiveCount = stationCount - activeCount;

  return (
    <div id="dendra-browse-tab" className="space-y-3">
      <EditFiltersCard id="dendra-edit-filters-card">
        {/* Filter section */}
        <div id="dendra-filter-section" className="rounded-lg border border-emerald-100 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Filter Stations
            </span>
            <span className="text-xs text-gray-400">
              {filteredStationsByStream.length} of {stationCount}
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
              id="dendra-active-filter-checkbox"
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

          <label id="dendra-stream-name-filter" className="block text-xs text-gray-600">
            Stream Name
            <input
              id="dendra-stream-name-filter-input"
              type="text"
              value={streamNameFilter}
              onChange={(event) => handleStreamNameFilterChange(event.target.value)}
              placeholder="Filter stations by datastream name..."
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                         focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>
        </div>

        <SpatialQuerySection
          id="dendra-spatial-query-section"
          layerId={activeLayer?.layerId ?? 'dendra-micromet-weather'}
        />
      </EditFiltersCard>

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
        <div id="dendra-station-results-section" className="space-y-2">
          <div id="dendra-station-results-header" className="flex items-center justify-between px-1">
            <h4 id="dendra-station-results-title" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Stations
            </h4>
            <span id="dendra-station-results-count" className="text-xs text-gray-400">
              {filteredStationsByStream.length}
            </span>
          </div>
          {filteredStationsByStream.map(station => (
            <StationCard
              key={station.station_id}
              station={station}
              summaryCount={summariesByStation.get(station.station_id)?.length ?? 0}
              pinnedStreamCount={pinnedCountByStationForActiveView.get(station.station_id) ?? 0}
              onViewDetail={() => handleSelectStation(station)}
              onViewOnMap={() => handleViewOnMap(station)}
            />
          ))}

          {filteredStationsByStream.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              No stations found
              {showActiveOnly ? ' (try disabling "Active only" filter)' : ''}
              {normalizedStreamNameFilter ? ' for that stream name.' : '.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
