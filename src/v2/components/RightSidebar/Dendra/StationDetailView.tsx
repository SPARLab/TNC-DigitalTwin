// ============================================================================
// StationDetailView — Drill-down view for a single Dendra sensor station.
// Shows: back nav, station info header, datastream summary table.
// Time series chart deferred to task 3.5.
// ============================================================================

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MapPin, Radio, Activity, Calendar, TrendingUp, TrendingDown, BarChart3, Save, Pin } from 'lucide-react';
import { BrowseBackButton } from '../shared/BrowseBackButton';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { formatStationDisplayName, formatTimestamp, formatValue } from '../../../services/dendraStationService';
import { useDendra } from '../../../context/DendraContext';
import { useLayers } from '../../../context/LayerContext';

interface StationDetailViewProps {
  station: DendraStation;
  summaries: DendraSummary[];
  onBack: () => void;
  onViewOnMap: () => void;
  onViewChart?: (summary: DendraSummary) => void;
  stationHeaderFlashSignal?: number;
  streamNameFilter: string;
  onStreamNameFilterChange: (value: string) => void;
  matchingStations: DendraStation[];
  onSelectStation: (station: DendraStation) => void;
}

export function StationDetailView({
  station,
  summaries,
  onBack,
  onViewOnMap,
  onViewChart,
  stationHeaderFlashSignal = 0,
  streamNameFilter,
  onStreamNameFilterChange,
  matchingStations,
  onSelectStation,
}: StationDetailViewProps) {
  const isActive = station.is_active === 1;
  const displayName = formatStationDisplayName(station.station_name);
  const [selectedDatastreamId, setSelectedDatastreamId] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isHeaderFlashing, setIsHeaderFlashing] = useState(false);
  const prevStationIdRef = useRef<number>(station.station_id);
  const lastSelectedDatastreamNameRef = useRef<string>('');
  const flashStartTimeoutRef = useRef<number | null>(null);
  const flashEndTimeoutRef = useRef<number | null>(null);
  const {
    chartPanels,
    getChartPanel,
    setChartFilter,
    closeChart,
    showActiveOnly,
    filteredStations,
  } = useDendra();
  const { activeLayer, pinLayer, getPinnedByLayerId, syncDendraFilters, createDendraFilteredView } = useLayers();
  const effectiveActiveViewId = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return undefined;
    if (activeLayer.viewId) return activeLayer.viewId;
    const pinned = getPinnedByLayerId(activeLayer.layerId);
    return pinned?.views?.find((view) => view.isVisible)?.id;
  }, [activeLayer, getPinnedByLayerId]);

  const normalizedStreamNameFilter = streamNameFilter.trim().toLowerCase();
  const filteredSummaries = useMemo(() => {
    if (!normalizedStreamNameFilter) return summaries;
    return summaries.filter((summary) =>
      summary.datastream_name.toLowerCase().includes(normalizedStreamNameFilter),
    );
  }, [summaries, normalizedStreamNameFilter]);

  useEffect(() => {
    const selectedName = summaries.find(
      (summary) => summary.datastream_id === selectedDatastreamId,
    )?.datastream_name;
    if (selectedName) {
      lastSelectedDatastreamNameRef.current = selectedName;
    }
  }, [summaries, selectedDatastreamId]);

  useEffect(() => {
    const stationChanged = prevStationIdRef.current !== station.station_id;
    const selectedExistsInFiltered = filteredSummaries.some(
      (summary) => summary.datastream_id === selectedDatastreamId,
    );

    if (selectedDatastreamId != null && selectedExistsInFiltered) {
      prevStationIdRef.current = station.station_id;
      return;
    }

    if (stationChanged && lastSelectedDatastreamNameRef.current) {
      const matchedByName = filteredSummaries.find(
        (summary) =>
          summary.datastream_name.toLowerCase() === lastSelectedDatastreamNameRef.current.toLowerCase(),
      );
      if (matchedByName) {
        setSelectedDatastreamId(matchedByName.datastream_id);
        prevStationIdRef.current = station.station_id;
        return;
      }
    }

    setSelectedDatastreamId(null);
    prevStationIdRef.current = station.station_id;
  }, [station.station_id, filteredSummaries, selectedDatastreamId]);

  const selectedSummary = useMemo(
    () => filteredSummaries.find(summary => summary.datastream_id === selectedDatastreamId) ?? null,
    [filteredSummaries, selectedDatastreamId],
  );

  const pinnedDatastreamIdsInActiveView = useMemo(() => {
    const ids = new Set<number>();
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return ids;
    const pinned = getPinnedByLayerId(activeLayer.layerId);
    for (const panel of chartPanels) {
      const matchesLayer = panel.sourceLayerId === activeLayer.layerId;
      const resolvedPanelViewId = panel.sourceViewId ?? pinned?.views?.[0]?.id;
      const matchesView = resolvedPanelViewId === effectiveActiveViewId;
      const matchesStation = panel.station?.station_id === station.station_id;
      const datastreamId = panel.summary?.datastream_id;
      if (!matchesLayer || !matchesView || !matchesStation || datastreamId == null) continue;
      ids.add(datastreamId);
    }
    return ids;
  }, [chartPanels, activeLayer, effectiveActiveViewId, getPinnedByLayerId, station.station_id]);

  const selectedChartPanel = useMemo(() => {
    if (!selectedSummary) return null;
    return getChartPanel(
      station.station_id,
      selectedSummary.datastream_id,
      activeLayer?.layerId,
      effectiveActiveViewId,
    );
  }, [getChartPanel, station.station_id, selectedSummary, activeLayer?.layerId, effectiveActiveViewId]);

  const chartMatchesSelectedDatastream = Boolean(selectedChartPanel);

  const chartMinDate = selectedChartPanel && selectedChartPanel.rawData.length > 0
    ? new Date(selectedChartPanel.rawData[0].timestamp).toISOString().slice(0, 10)
    : undefined;
  const chartMaxDate = selectedChartPanel && selectedChartPanel.rawData.length > 0
    ? new Date(selectedChartPanel.rawData[selectedChartPanel.rawData.length - 1].timestamp).toISOString().slice(0, 10)
    : undefined;

  const handleSelectDatastream = (summary: DendraSummary) => {
    setSelectedDatastreamId(summary.datastream_id);
    setSaveMessage(null);
    onViewChart?.(summary);
  };

  const handleToggleDatastreamPin = (summary: DendraSummary) => {
    const existingPanel = getChartPanel(
      station.station_id,
      summary.datastream_id,
      activeLayer?.layerId,
      effectiveActiveViewId,
    );
    if (existingPanel) {
      closeChart(existingPanel.id);
      if (selectedDatastreamId === summary.datastream_id) {
        setSaveMessage(null);
      }
      return;
    }
    handleSelectDatastream(summary);
  };

  const ensurePinnedLayer = () => {
    if (!activeLayer) return false;
    const existing = getPinnedByLayerId(activeLayer.layerId);
    if (existing) return true;
    pinLayer(activeLayer.layerId);
    return true;
  };

  const saveCurrentView = () => {
    if (!activeLayer) {
      setSaveMessage('Unable to save: no active layer.');
      return;
    }
    ensurePinnedLayer();

    const filters = {
      showActiveOnly,
      selectedStationId: station.station_id,
      selectedStationName: displayName,
      selectedDatastreamId: undefined,
      selectedDatastreamName: undefined,
      startDate: undefined,
      endDate: undefined,
      aggregation: undefined,
    };
    syncDendraFilters(activeLayer.layerId, filters, filteredStations.length, activeLayer.viewId);
    setSaveMessage('Updated current view in Map Layers.');
  };

  const saveAsNewView = () => {
    if (!activeLayer) {
      setSaveMessage('Unable to save: no active layer.');
      return;
    }
    if (!selectedSummary) {
      setSaveMessage('Select a datastream before saving a new filtered view.');
      return;
    }
    if (!selectedChartPanel || selectedChartPanel.loading) {
      setSaveMessage('Open chart data for this datastream before saving a new filtered view.');
      return;
    }

    ensurePinnedLayer();

    const filters = {
      showActiveOnly,
      selectedStationId: station.station_id,
      selectedStationName: displayName,
      selectedDatastreamId: selectedSummary.datastream_id,
      selectedDatastreamName: selectedSummary.datastream_name,
      startDate: selectedChartPanel.filter.startDate,
      endDate: selectedChartPanel.filter.endDate,
      aggregation: selectedChartPanel.filter.aggregation,
    };

    const newViewId = createDendraFilteredView(activeLayer.layerId, filters, selectedChartPanel.data.length);
    if (!newViewId) {
      setSaveMessage('Unable to create a new filtered view. Pin this layer and try again.');
      return;
    }
    setSaveMessage('Created a new filtered child view in Map Layers.');
  };

  useEffect(() => {
    if (!stationHeaderFlashSignal) return;

    setIsHeaderFlashing(false);
    if (flashStartTimeoutRef.current) window.clearTimeout(flashStartTimeoutRef.current);
    if (flashEndTimeoutRef.current) window.clearTimeout(flashEndTimeoutRef.current);

    // Match EditFilters card cadence: short settle delay, quick pulse, then rest.
    flashStartTimeoutRef.current = window.setTimeout(() => {
      setIsHeaderFlashing(true);
      flashEndTimeoutRef.current = window.setTimeout(() => {
        setIsHeaderFlashing(false);
        flashEndTimeoutRef.current = null;
      }, 220);
      flashStartTimeoutRef.current = null;
    }, 60);
  }, [stationHeaderFlashSignal]);

  useEffect(() => {
    return () => {
      if (flashStartTimeoutRef.current) window.clearTimeout(flashStartTimeoutRef.current);
      if (flashEndTimeoutRef.current) window.clearTimeout(flashEndTimeoutRef.current);
    };
  }, []);

  return (
    <div id="dendra-station-detail" className="space-y-4">
      <BrowseBackButton
        id="dendra-back-to-stations"
        label="Back to Stations"
        onClick={onBack}
      />

      <div id="dendra-cross-station-tools" className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
        <label id="dendra-detail-stream-name-filter" className="block text-xs text-gray-600">
          Stream Name Filter
          <input
            id="dendra-detail-stream-name-filter-input"
            type="text"
            value={streamNameFilter}
            onChange={(event) => onStreamNameFilterChange(event.target.value)}
            placeholder="Filter streams (example: air temp avg)"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label id="dendra-detail-station-switcher" className="block text-xs text-gray-600">
          Switch Station
          <select
            id="dendra-detail-station-switcher-select"
            value={station.station_id}
            onChange={(event) => {
              const selectedId = Number(event.target.value);
              const nextStation = matchingStations.find((candidate) => candidate.station_id === selectedId);
              if (!nextStation) return;
              onSelectStation(nextStation);
            }}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white
                       focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {matchingStations.map((candidate) => (
              <option
                key={candidate.station_id}
                id={`dendra-detail-station-switcher-option-${candidate.station_id}`}
                value={candidate.station_id}
              >
                {formatStationDisplayName(candidate.station_name)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Station header */}
      <div
        id="dendra-station-header"
        className={`rounded-lg border p-4 space-y-3 transition-colors duration-250 ease-in-out ${
          isHeaderFlashing
            ? 'bg-slate-300/90 border-slate-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">
            {displayName}
          </h3>
          <span
            className={`flex items-center gap-1 text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              isActive ? 'bg-emerald-500' : 'bg-gray-400'
            }`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Station metadata grid */}
        <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          <DetailRow icon={<Radio className="w-3 h-3" />} label="Sensor" value={station.sensor_name ?? '—'} />
          <DetailRow
            icon={<MapPin className="w-3 h-3" />}
            label="Location"
            value={`${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`}
          />
          {station.elevation != null && !isNaN(Number(station.elevation)) && (
            <DetailRow icon={<TrendingUp className="w-3 h-3" />} label="Elevation" value={`${Number(station.elevation).toFixed(0)} m`} />
          )}
          <DetailRow icon={<Activity className="w-3 h-3" />} label="Datastreams" value={String(summaries.length || station.datastream_count)} />
        </dl>

        {/* View on Map button */}
        <button
          id="dendra-detail-view-on-map"
          onClick={onViewOnMap}
          className="w-full py-2 text-sm text-emerald-700 bg-emerald-50 rounded-md
                     hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5" />
          View on Map
        </button>
      </div>

      {/* Datastream summaries */}
      <div id="dendra-datastream-summaries">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Datastreams ({filteredSummaries.length}{normalizedStreamNameFilter ? ` of ${summaries.length}` : ''})
        </h4>

        {filteredSummaries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {normalizedStreamNameFilter
              ? 'No datastreams match this stream name filter.'
              : 'No datastream summaries available.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredSummaries.map(summary => (
              <DatastreamSummaryCard
                key={summary.datastream_id}
                summary={summary}
                isSelected={selectedDatastreamId === summary.datastream_id}
                isPinned={pinnedDatastreamIdsInActiveView.has(summary.datastream_id)}
                onViewChart={() => handleSelectDatastream(summary)}
                onTogglePin={() => handleToggleDatastreamPin(summary)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Level 3 datastream filter controls */}
      {selectedSummary && (
        <div id="dendra-datastream-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-3">
          <div id="dendra-datastream-filter-header" className="flex items-center justify-between gap-2">
            <h4 id="dendra-datastream-filter-title" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Filter Datastream
            </h4>
            <span id="dendra-datastream-filter-name" className="text-xs text-gray-500 truncate">
              {selectedSummary.datastream_name}
            </span>
          </div>

          <div id="dendra-datastream-filter-grid" className="grid grid-cols-2 gap-2">
            <label id="dendra-filter-start-label" className="text-xs text-gray-600">
              From
              <input
                id="dendra-filter-start-date"
                type="date"
                value={selectedChartPanel?.filter.startDate ?? ''}
                min={chartMinDate}
                max={chartMaxDate}
                disabled={!chartMatchesSelectedDatastream || Boolean(selectedChartPanel?.loading)}
                onChange={(event) => {
                  if (!selectedChartPanel) return;
                  setChartFilter(selectedChartPanel.id, { startDate: event.target.value });
                  setSaveMessage(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                           focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                           disabled:bg-gray-100 disabled:text-gray-400"
              />
            </label>

            <label id="dendra-filter-end-label" className="text-xs text-gray-600">
              To
              <input
                id="dendra-filter-end-date"
                type="date"
                value={selectedChartPanel?.filter.endDate ?? ''}
                min={chartMinDate}
                max={chartMaxDate}
                disabled={!chartMatchesSelectedDatastream || Boolean(selectedChartPanel?.loading)}
                onChange={(event) => {
                  if (!selectedChartPanel) return;
                  setChartFilter(selectedChartPanel.id, { endDate: event.target.value });
                  setSaveMessage(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                           focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                           disabled:bg-gray-100 disabled:text-gray-400"
              />
            </label>

            <label id="dendra-filter-aggregation-label" className="text-xs text-gray-600 col-span-2">
              Aggregation
              <select
                id="dendra-filter-aggregation-select"
                value={selectedChartPanel?.filter.aggregation ?? 'hourly'}
                disabled={!chartMatchesSelectedDatastream || Boolean(selectedChartPanel?.loading)}
                onChange={(event) => {
                  if (!selectedChartPanel) return;
                  setChartFilter(selectedChartPanel.id, { aggregation: event.target.value as 'hourly' | 'daily' | 'weekly' });
                  setSaveMessage(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white
                           focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                           disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option id="dendra-filter-aggregation-hourly" value="hourly">Hourly</option>
                <option id="dendra-filter-aggregation-daily" value="daily">Daily</option>
                <option id="dendra-filter-aggregation-weekly" value="weekly">Weekly</option>
              </select>
            </label>
          </div>

          <div id="dendra-filter-summary-row" className="flex items-center justify-between text-xs">
            <span id="dendra-filter-point-count" className="text-gray-600">
              {chartMatchesSelectedDatastream && selectedChartPanel
                ? `${selectedChartPanel.data.length.toLocaleString()} data points`
                : 'Open chart to load points'}
            </span>
            {selectedChartPanel?.loading && (
              <span id="dendra-filter-loading-indicator" className="text-gray-400">Updating...</span>
            )}
          </div>

          <div id="dendra-save-view-actions" className="grid grid-cols-2 gap-2">
            <button
              id="dendra-save-view"
              type="button"
              onClick={saveCurrentView}
              className="rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2
                         hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Update View
            </button>
            <button
              id="dendra-save-with-filters"
              type="button"
              onClick={saveAsNewView}
              disabled={!chartMatchesSelectedDatastream || Boolean(selectedChartPanel?.loading)}
              className="rounded-md bg-emerald-600 text-white text-sm font-medium py-2
                         hover:bg-emerald-700 transition-colors disabled:bg-emerald-300
                         flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save as New View
            </button>
          </div>

          {saveMessage && (
            <p id="dendra-save-view-feedback" className="text-xs text-emerald-700">
              {saveMessage}
            </p>
          )}
        </div>
      )}

      {/* Chart hint */}
      <div
        id="dendra-chart-hint"
        className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-center"
      >
        <BarChart3 className="w-5 h-5 text-teal-400 mx-auto mb-1" />
        <p className="text-xs text-teal-700">
          Click <strong>View Chart</strong> on any datastream to see the interactive
          time series on the map panel below.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400">{icon}</span>
      <dt className="text-gray-500">{label}:</dt>
      <dd className="text-gray-800 font-medium truncate">{value}</dd>
    </div>
  );
}

function DatastreamSummaryCard({
  summary, onViewChart, onTogglePin, isSelected, isPinned,
}: {
  summary: DendraSummary;
  onViewChart: () => void;
  onTogglePin: () => void;
  isSelected: boolean;
  isPinned: boolean;
}) {
  return (
    <div
      id={`dendra-ds-${summary.datastream_id}`}
      className={`w-full text-left bg-white border rounded-md p-3 transition-colors cursor-pointer group ${
        isSelected
          ? 'border-teal-400 bg-teal-50/40'
          : 'border-gray-100 hover:border-teal-300 hover:bg-teal-50/30'
      }`}
      role="button"
      tabIndex={0}
      onClick={onViewChart}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewChart();
        }
      }}
    >
      {/* Top row: name + unit + chart icon */}
      <div className="flex items-center justify-between mb-1.5">
        <h5 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-600 transition-colors shrink-0" />
          {summary.datastream_name}
        </h5>
        <div id={`dendra-ds-${summary.datastream_id}-meta-actions`} className="flex items-center gap-1.5">
          {summary.unit && (
            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
              {summary.unit}
            </span>
          )}
          <button
            id={`dendra-ds-pin-toggle-${summary.datastream_id}`}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onTogglePin();
            }}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
              isPinned
                ? 'border-blue-300 bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
            title={isPinned ? 'Unpin datastream chart' : 'Pin datastream chart'}
            aria-label={isPinned ? 'Unpin datastream chart' : 'Pin datastream chart'}
          >
            <Pin className="w-3 h-3 fill-current" />
            {isPinned ? 'Pinned' : 'Pin'}
          </button>
        </div>
      </div>

      {/* Compact inline stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
        <span className="flex items-center gap-0.5">
          <TrendingDown className="w-3 h-3 text-blue-400" />
          {formatValue(summary.min_value)}
        </span>
        <span className="flex items-center gap-0.5">
          <Activity className="w-3 h-3 text-amber-500" />
          {formatValue(summary.avg_value)}
        </span>
        <span className="flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3 text-red-400" />
          {formatValue(summary.max_value)}
        </span>
        <span className="ml-auto text-gray-400">
          {summary.total_records?.toLocaleString() ?? '—'} pts
        </span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <Calendar className="w-3 h-3" />
        {formatTimestamp(summary.first_reading_time)} — {formatTimestamp(summary.last_reading_time)}
      </div>
    </div>
  );
}

