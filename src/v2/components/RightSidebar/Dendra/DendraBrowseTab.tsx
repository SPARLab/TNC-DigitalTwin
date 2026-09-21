// ============================================================================
// DendraBrowseTab — Query builder for multi-station time series.
// Flow: pick datastreams → select stations (list / map / draw) → date range → Generate chart.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, LineChart, MapPin } from 'lucide-react';
import { useDendra, useSummariesByStation } from '../../../context/DendraContext';
import { useMap } from '../../../context/MapContext';
import { useLayers } from '../../../context/LayerContext';
import {
  datastreamMatchesLatestField,
  formatStationDisplayName,
  type DendraStation,
} from '../../../services/dendraStationService';
import { isPointInsideSpatialPolygon } from '../../../utils/spatialQuery';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { SpatialQuerySection } from '../shared/SpatialQuerySection';
import {
  ALERT_NAVIGATION_INTENT_EVENT,
  getLatestAlertNavigationIntent,
  type AlertNavigationIntent,
} from '../../../alerts/navigationIntent';
import {
  DendraBrowseChartModal,
  type DendraBrowseFilterState,
} from './DendraBrowseChartModal';

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultWeekRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { startDate: toYmd(start), endDate: toYmd(end) };
}

export function DendraBrowseTab() {
  const {
    filteredStations,
    loading,
    error,
    dataLoaded,
    showActiveOnly,
    toggleActiveOnly,
    setShowActiveOnly,
    stationCount,
    loadStationSummaries,
    activeServiceUrl,
    activeLayerTitle,
    datastreamTypes,
    datastreamTypesLoaded,
  } = useDendra();
  const { activeLayer, activateLayer, lastEditFiltersRequest, getPinnedByLayerId } = useLayers();
  const summariesByStation = useSummariesByStation();
  const {
    highlightPoint,
    clearHighlight,
    viewRef,
    getSpatialPolygonForLayer,
  } = useMap();

  const weekDefaults = useMemo(() => defaultWeekRange(), []);
  const [selectedStreamNames, setSelectedStreamNames] = useState<string[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);
  /** When false (default), all eligible stations are included. */
  const [filterStations, setFilterStations] = useState(false);
  const [startDate, setStartDate] = useState(weekDefaults.startDate);
  const [endDate, setEndDate] = useState(weekDefaults.endDate);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [pendingAlertIntent, setPendingAlertIntent] = useState<AlertNavigationIntent | null>(null);
  const [stationListQuery, setStationListQuery] = useState('');

  const lastConsumedHydrateRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);
  const lastSpatialKeyRef = useRef<string | null>(null);

  // Hydrate active-only from pinned filters when Edit Filters / view changes.
  useEffect(() => {
    if (activeLayer?.dataSource !== 'dendra') return;

    const viewChanged = activeLayer.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    prevHydrateViewIdRef.current = activeLayer.viewId;

    if (!viewChanged && !editRequested) return;
    if (editRequested) {
      lastConsumedHydrateRef.current = lastEditFiltersRequest;
      if (activeLayer.featureId != null) {
        activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
      }
    }

    const pinned = getPinnedByLayerId(activeLayer.layerId);
    if (!pinned) return;

    const sourceFilters = activeLayer.viewId && pinned.views
      ? pinned.views.find((view) => view.id === activeLayer.viewId)?.dendraFilters
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

  // Prefetch summaries once Latest-column types are known (filters summaries correctly).
  useEffect(() => {
    if (!dataLoaded || !datastreamTypesLoaded) return;
    for (const station of filteredStations) {
      loadStationSummaries(station.station_id);
    }
  }, [dataLoaded, datastreamTypesLoaded, filteredStations, loadStationSummaries]);

  useEffect(() => {
    const handleIntent = (event: Event) => {
      const customEvent = event as CustomEvent<AlertNavigationIntent>;
      const detail = customEvent.detail;
      if (!detail || detail.alertType !== 'water_threshold') return;
      setPendingAlertIntent(detail);
    };

    window.addEventListener(ALERT_NAVIGATION_INTENT_EVENT, handleIntent as EventListener);
    const latestIntent = getLatestAlertNavigationIntent();
    if (latestIntent && latestIntent.alertType === 'water_threshold') {
      setPendingAlertIntent(latestIntent);
    }

    return () => {
      window.removeEventListener(ALERT_NAVIGATION_INTENT_EVENT, handleIntent as EventListener);
    };
  }, []);

  const dendraSpatialLayerId = activeLayer?.dataSource === 'dendra'
    ? activeLayer.layerId
    : 'dendra-micromet-weather';
  const spatialPolygon = getSpatialPolygonForLayer(dendraSpatialLayerId);

  const stationsInSpatial = useMemo(() => {
    if (!spatialPolygon) return filteredStations;
    return filteredStations.filter((station) =>
      isPointInsideSpatialPolygon(spatialPolygon, station.longitude, station.latitude),
    );
  }, [filteredStations, spatialPolygon]);

  const availableStreamTypes = datastreamTypes;
  const availableStreamKeys = useMemo(
    () => availableStreamTypes.map((type) => type.fieldKey),
    [availableStreamTypes],
  );

  const stationsForSelectedStreams = useMemo(() => {
    if (selectedStreamNames.length === 0) return stationsInSpatial;
    const selected = selectedStreamNames.map((name) => name.trim().toLowerCase()).filter(Boolean);
    return stationsInSpatial.filter((station) => {
      const summaries = summariesByStation.get(station.station_id);
      if (!summaries) return false;
      return summaries.some((summary) => {
        const fieldKey = (summary.dendra_ds_id || summary.variable || '').trim().toLowerCase();
        return selected.some((field) =>
          field === fieldKey
          || datastreamMatchesLatestField(summary.datastream_name, field, availableStreamKeys),
        );
      });
    });
  }, [stationsInSpatial, selectedStreamNames, summariesByStation, availableStreamKeys]);

  const eligibleStationIdsKey = useMemo(
    () => stationsForSelectedStreams.map((station) => station.station_id).join(','),
    [stationsForSelectedStreams],
  );

  // Default: all eligible stations. Keep selection synced while filter is off.
  useEffect(() => {
    if (filterStations) return;
    const nextIds = eligibleStationIdsKey
      ? eligibleStationIdsKey.split(',').map(Number).filter(Number.isFinite)
      : [];
    setSelectedStationIds(nextIds);
  }, [filterStations, eligibleStationIdsKey]);

  const normalizedStationQuery = stationListQuery.trim().toLowerCase();
  const stationList = useMemo(() => {
    if (!normalizedStationQuery) return stationsForSelectedStreams;
    return stationsForSelectedStreams.filter((station) =>
      formatStationDisplayName(station.station_name).toLowerCase().includes(normalizedStationQuery),
    );
  }, [stationsForSelectedStreams, normalizedStationQuery]);

  const effectiveStationIds = filterStations
    ? selectedStationIds
    : stationsForSelectedStreams.map((station) => station.station_id);

  // Map click → toggle station selection (featureId set by useDendraMapBehavior).
  const lastMapToggleRef = useRef<{ stationId: number; at: number } | null>(null);
  useEffect(() => {
    if (activeLayer?.dataSource !== 'dendra') return;
    if (activeLayer.featureId == null) return;

    const stationId = Number(activeLayer.featureId);
    if (!Number.isFinite(stationId)) return;

    const now = Date.now();
    const last = lastMapToggleRef.current;
    if (last && last.stationId === stationId && now - last.at < 400) {
      activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
      return;
    }
    lastMapToggleRef.current = { stationId, at: now };

    const station = filteredStations.find((candidate) => candidate.station_id === stationId);
    if (!station) return;

    setFilterStations(true);
    setSelectedStationIds((prev) => (
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    ));
    loadStationSummaries(stationId);
    highlightPoint(station.longitude, station.latitude);
    setTimeout(clearHighlight, 4000);

    // Clear featureId so the same station can be toggled again later.
    activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
  }, [
    activeLayer?.dataSource,
    activeLayer?.featureId,
    activeLayer?.layerId,
    activeLayer?.viewId,
    filteredStations,
    loadStationSummaries,
    highlightPoint,
    clearHighlight,
    activateLayer,
  ]);

  // When a new polygon is drawn, select stations inside it.
  useEffect(() => {
    if (!spatialPolygon) {
      lastSpatialKeyRef.current = null;
      return;
    }
    const key = JSON.stringify(spatialPolygon);
    if (lastSpatialKeyRef.current === key) return;
    lastSpatialKeyRef.current = key;

    const insideIds = stationsInSpatial.map((station) => station.station_id);
    if (insideIds.length === 0) return;
    setFilterStations(true);
    setSelectedStationIds(insideIds);
  }, [spatialPolygon, stationsInSpatial]);

  // Alert deep-link: preselect stream + station and open chart.
  useEffect(() => {
    if (!pendingAlertIntent) return;
    if (activeLayer?.dataSource !== 'dendra') return;
    if (!dataLoaded || filteredStations.length === 0) return;

    const normalizedDatastreamHint = pendingAlertIntent.datastreamNameHint?.trim().toLowerCase() ?? '';
    let targetStation: DendraStation | undefined;
    let matchedStreamKey = '';

    for (const station of filteredStations) {
      const stationSummaries = summariesByStation.get(station.station_id) ?? [];
      if (stationSummaries.length === 0) continue;
      const summaryMatch = normalizedDatastreamHint
        ? stationSummaries.find((summary) =>
          summary.datastream_name.toLowerCase().includes(normalizedDatastreamHint))
        : stationSummaries[0];
      if (!summaryMatch) continue;
      targetStation = station;
      const typeMatch = availableStreamTypes.find((type) =>
        datastreamMatchesLatestField(
          summaryMatch.datastream_name,
          type.fieldKey,
          availableStreamKeys,
        ),
      );
      matchedStreamKey = typeMatch?.fieldKey
        ?? availableStreamKeys[0]
        ?? '';
      break;
    }

    if (!targetStation) {
      setPendingAlertIntent(null);
      return;
    }

    if (matchedStreamKey) {
      setSelectedStreamNames([matchedStreamKey]);
    }
    setFilterStations(true);
    setSelectedStationIds([targetStation.station_id]);
    setIsChartOpen(true);
    highlightPoint(targetStation.longitude, targetStation.latitude);
    const view = viewRef.current;
    if (view) {
      void view.goTo(
        { center: [targetStation.longitude, targetStation.latitude], zoom: 14 },
        { duration: 800 },
      );
    }
    setTimeout(clearHighlight, 5000);
    setPendingAlertIntent(null);
  }, [
    pendingAlertIntent,
    activeLayer,
    dataLoaded,
    filteredStations,
    summariesByStation,
    availableStreamTypes,
    availableStreamKeys,
    highlightPoint,
    clearHighlight,
    viewRef,
  ]);

  const toggleStream = useCallback((streamName: string) => {
    setSelectedStreamNames((prev) => (
      prev.includes(streamName)
        ? prev.filter((name) => name !== streamName)
        : [...prev, streamName]
    ));
  }, []);

  const toggleStation = useCallback((stationId: number) => {
    setSelectedStationIds((prev) => (
      prev.includes(stationId)
        ? prev.filter((id) => id !== stationId)
        : [...prev, stationId]
    ));
  }, []);

  const selectAllVisibleStations = useCallback(() => {
    setSelectedStationIds(stationList.map((station) => station.station_id));
  }, [stationList]);

  const clearSelectedStations = useCallback(() => {
    setSelectedStationIds([]);
  }, []);

  const focusStationOnMap = useCallback(async (station: DendraStation) => {
    highlightPoint(station.longitude, station.latitude);
    const view = viewRef.current;
    if (!view) return;
    try {
      await view.goTo(
        { center: [station.longitude, station.latitude], zoom: 15 },
        { duration: 700 },
      );
    } catch {
      // Ignore goTo interruptions.
    }
    setTimeout(clearHighlight, 4000);
  }, [highlightPoint, clearHighlight, viewRef]);

  const datasetTitle = activeLayerTitle?.trim() || 'this dataset';
  const canGenerate =
    Boolean(activeServiceUrl)
    && selectedStreamNames.length > 0
    && effectiveStationIds.length > 0
    && Boolean(startDate)
    && Boolean(endDate)
    && startDate <= endDate;

  const modalFilters: DendraBrowseFilterState = {
    selectedStreamNames,
    selectedStationIds: effectiveStationIds,
    startDate,
    endDate,
  };

  const activeCount = filteredStations.filter((station) => station.is_active === 1).length;
  const inactiveCount = stationCount - activeCount;

  return (
    <>
      <div id="dendra-browse-tab" className="space-y-4">
        <div
          id="dendra-browse-instructions"
          className="rounded-lg border border-teal-100 bg-teal-50/70 px-3 py-3 text-sm text-slate-700"
        >
          <p className="font-medium text-teal-900">
            Chart and download {datasetTitle} time-series data.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Choose one or more datastream types, optionally filter stations, then set a time frame.
            Large ranges may take longer to load.
          </p>
        </div>

        {loading && !dataLoaded && (
          <InlineLoadingRow id="dendra-browse-loading" message="Loading stations..." />
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {dataLoaded && !error && (
          <>
            {/* 1. Datastream type */}
            <section
              id="dendra-browse-datastream-section"
              className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  1. Datastream type
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedStreamNames.length} selected
                </span>
              </div>
              {availableStreamTypes.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {datastreamTypesLoaded
                    ? 'No measurable fields found on the Latest layer.'
                    : 'Loading datastream catalog from Latest layer…'}
                </p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {availableStreamTypes.map((streamType) => {
                    const checked = selectedStreamNames.includes(streamType.fieldKey);
                    return (
                      <label
                        key={streamType.fieldKey}
                        className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                          checked
                            ? 'bg-teal-50 text-teal-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStream(streamType.fieldKey)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="min-w-0 flex-1 truncate">{streamType.label}</span>
                        {streamType.frequencyLabel && (
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            {streamType.frequencyLabel}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 2. Stations */}
            <section
              id="dendra-browse-stations-section"
              className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  2. Stations
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {filterStations
                      ? `${selectedStationIds.length} selected`
                      : `All ${stationsForSelectedStreams.length}`}
                  </span>
                  <button
                    id="dendra-filter-stations-switch"
                    type="button"
                    role="switch"
                    aria-checked={filterStations}
                    aria-label="Filter stations"
                    title={filterStations ? 'Filter stations on' : 'Filter stations off — all included'}
                    onClick={() => {
                      setFilterStations((prev) => {
                        const next = !prev;
                        if (!next) {
                          setSelectedStationIds(
                            stationsForSelectedStreams.map((station) => station.station_id),
                          );
                        }
                        return next;
                      });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
                      filterStations ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        filterStations ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                {filterStations
                  ? 'Narrow by list, map click, or drawn area.'
                  : 'All eligible stations are included. Flip the switch to filter.'}
              </p>

              {filterStations && (
                <>
                  <label
                    id="dendra-active-filter"
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors ${
                      showActiveOnly ? 'bg-emerald-50' : 'bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={toggleActiveOnly}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className={`flex-1 text-sm ${showActiveOnly ? 'font-medium text-slate-900' : 'text-slate-600'}`}>
                      Active stations only
                    </span>
                    {inactiveCount > 0 && (
                      <span className="text-xs text-slate-400">({inactiveCount} inactive)</span>
                    )}
                  </label>

                  <SpatialQuerySection
                    id="dendra-spatial-query-section"
                    layerId={activeLayer?.layerId ?? 'dendra-micromet-weather'}
                    defaultExpanded={false}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllVisibleStations}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Select listed
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectedStations}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                    <input
                      type="search"
                      value={stationListQuery}
                      onChange={(event) => setStationListQuery(event.target.value)}
                      placeholder="Search stations…"
                      className="min-w-[8rem] flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div
                    id="dendra-browse-station-list"
                    className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-slate-100 bg-slate-50/50 p-1"
                  >
                    {stationList.map((station) => {
                      const checked = selectedStationIds.includes(station.station_id);
                      return (
                        <div
                          key={station.station_id}
                          className={`flex items-center gap-1 rounded-md px-1.5 py-1 ${
                            checked ? 'bg-teal-50' : 'bg-white'
                          }`}
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStation(station.station_id)}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="truncate">
                              {formatStationDisplayName(station.station_name)}
                            </span>
                          </label>
                          <button
                            type="button"
                            title="Show on map"
                            onClick={() => void focusStationOnMap(station)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-teal-700"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {stationList.length === 0 && (
                      <p className="px-2 py-4 text-center text-xs text-slate-400">
                        {selectedStreamNames.length === 0
                          ? 'Select a datastream type to filter stations, or leave empty to list all.'
                          : 'No stations match the current datastream and area filters.'}
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>

            {/* 3. Time frame */}
            <section
              id="dendra-browse-time-section"
              className="space-y-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                3. Time frame
              </h3>
              <p className="text-[11px] text-slate-500">
                Defaults to the last 7 days. Wider ranges load in batches and may take longer.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-slate-600">
                  Start
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </label>
                <label className="block text-xs text-slate-600">
                  End
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </label>
              </div>
            </section>

            <button
              id="dendra-browse-generate-chart"
              type="button"
              disabled={!canGenerate}
              onClick={() => setIsChartOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LineChart className="h-4 w-4" />
              Generate chart
            </button>

            {!canGenerate && dataLoaded && (
              <p className="text-center text-[11px] text-slate-400">
                Select at least one datastream type to continue.
              </p>
            )}

            <p className="text-center text-[11px] text-slate-400">
              {activeCount.toLocaleString()} active of {stationCount.toLocaleString()} stations in this dataset
            </p>
          </>
        )}
      </div>

      {activeServiceUrl && (
        <DendraBrowseChartModal
          open={isChartOpen}
          onClose={() => setIsChartOpen(false)}
          title={datasetTitle}
          serviceUrl={activeServiceUrl}
          availableStreamTypes={availableStreamTypes}
          stations={stationsInSpatial}
          summariesByStation={summariesByStation}
          initialFilters={modalFilters}
          onFiltersChange={(next) => {
            setSelectedStreamNames(next.selectedStreamNames);
            setSelectedStationIds(next.selectedStationIds);
            setFilterStations(true);
            setStartDate(next.startDate);
            setEndDate(next.endDate);
          }}
        />
      )}
    </>
  );
}
