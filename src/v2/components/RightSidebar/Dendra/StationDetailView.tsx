// ============================================================================
// StationDetailView — Drill-down view for a single Dendra sensor station.
// Shows: back nav, station info header, datastream summary table.
// Time series chart deferred to task 3.5.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowseBackButton } from '../shared/BrowseBackButton';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { formatStationDisplayName } from '../../../services/dendraStationService';
import { useDendra } from '../../../context/DendraContext';
import { useLayers } from '../../../context/LayerContext';
import { createDefaultDendraViewFilters } from '../../../context/utils/layerFilterDefaults';
import { useStationDetailState } from './useStationDetailState';
import { StationCrossStationToolsSection } from './StationCrossStationToolsSection';
import { StationHeaderCard } from './StationHeaderCard';
import { DatastreamSummaryListSection } from './DatastreamSummaryListSection';
import { DatastreamFilterSection } from './DatastreamFilterSection';
import { StationChartHintCard } from './StationChartHintCard';

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
  autoSelectDatastreamSignal?: number;
  autoSelectDatastreamNameHint?: string;
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
  autoSelectDatastreamSignal = 0,
  autoSelectDatastreamNameHint = '',
}: StationDetailViewProps) {
  const isActive = station.is_active === 1;
  const displayName = formatStationDisplayName(station.station_name);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const lastHandledAutoSelectSignalRef = useRef(0);
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

  const { isHeaderFlashing, selectedDatastreamId, setSelectedDatastreamId } = useStationDetailState({
    stationId: station.station_id,
    summaries,
    filteredSummaries,
    stationHeaderFlashSignal,
  });

  const selectedSummary = useMemo(
    () => filteredSummaries.find(summary => summary.datastream_id === selectedDatastreamId) ?? null,
    [filteredSummaries, selectedDatastreamId],
  );

  useEffect(() => {
    if (!autoSelectDatastreamSignal) return;
    if (lastHandledAutoSelectSignalRef.current === autoSelectDatastreamSignal) return;
    if (filteredSummaries.length === 0) return;

    const normalizedNameHint = autoSelectDatastreamNameHint.trim().toLowerCase();
    const match = normalizedNameHint
      ? filteredSummaries.find((summary) => summary.datastream_name.toLowerCase().includes(normalizedNameHint))
      : filteredSummaries[0];
    if (!match) return;

    lastHandledAutoSelectSignalRef.current = autoSelectDatastreamSignal;
    setSelectedDatastreamId(match.datastream_id);
    onViewChart?.(match);
    setSaveMessage(null);
  }, [autoSelectDatastreamSignal, autoSelectDatastreamNameHint, filteredSummaries, onViewChart]);

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
      ...createDefaultDendraViewFilters(),
      showActiveOnly,
      selectedStationId: station.station_id,
      selectedStationName: displayName,
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

  return (
    <div id="dendra-station-detail" className="space-y-4">
      <BrowseBackButton
        id="dendra-back-to-stations"
        label="Back to Stations"
        onClick={onBack}
      />

      <StationCrossStationToolsSection
        stationId={station.station_id}
        streamNameFilter={streamNameFilter}
        onStreamNameFilterChange={onStreamNameFilterChange}
        matchingStations={matchingStations}
        onSelectStation={onSelectStation}
      />

      <StationHeaderCard
        displayName={displayName}
        isActive={isActive}
        isHeaderFlashing={isHeaderFlashing}
        sensorName={station.sensor_name}
        latitude={station.latitude}
        longitude={station.longitude}
        elevation={station.elevation}
        datastreamCount={summaries.length || station.datastream_count}
        onViewOnMap={onViewOnMap}
      />

      <DatastreamSummaryListSection
        filteredSummaries={filteredSummaries}
        totalSummaries={summaries.length}
        normalizedStreamNameFilter={normalizedStreamNameFilter}
        selectedDatastreamId={selectedDatastreamId}
        pinnedDatastreamIds={pinnedDatastreamIdsInActiveView}
        onViewChart={handleSelectDatastream}
        onTogglePin={handleToggleDatastreamPin}
      />

      {selectedSummary && (
        <DatastreamFilterSection
          selectedSummary={selectedSummary}
          startDate={selectedChartPanel?.filter.startDate ?? ''}
          endDate={selectedChartPanel?.filter.endDate ?? ''}
          aggregation={selectedChartPanel?.filter.aggregation ?? 'hourly'}
          chartMinDate={chartMinDate}
          chartMaxDate={chartMaxDate}
          chartMatchesSelectedDatastream={chartMatchesSelectedDatastream}
          chartLoading={Boolean(selectedChartPanel?.loading)}
          dataPointCount={selectedChartPanel?.data.length ?? 0}
          saveMessage={saveMessage}
          onStartDateChange={(value) => {
            if (!selectedChartPanel) return;
            setChartFilter(selectedChartPanel.id, { startDate: value });
            setSaveMessage(null);
          }}
          onEndDateChange={(value) => {
            if (!selectedChartPanel) return;
            setChartFilter(selectedChartPanel.id, { endDate: value });
            setSaveMessage(null);
          }}
          onAggregationChange={(value) => {
            if (!selectedChartPanel) return;
            setChartFilter(selectedChartPanel.id, { aggregation: value });
            setSaveMessage(null);
          }}
          onSaveCurrentView={saveCurrentView}
          onSaveAsNewView={saveAsNewView}
        />
      )}

      <StationChartHintCard />
    </div>
  );
}

