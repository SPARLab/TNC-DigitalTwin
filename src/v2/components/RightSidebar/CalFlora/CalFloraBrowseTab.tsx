import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Camera, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { calfloraV2Service, type CalFloraObservation } from '../../../../services/calfloraV2Service';
import { useCalFloraFilter } from '../../../context/CalFloraFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { useMap } from '../../../context/MapContext';
import { EditFiltersCard } from '../shared/EditFiltersCard';
import { InlineLoadingRow, RefreshLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { ObservationListView } from './ObservationListView';
import { ObservationDetailView } from './ObservationDetailView';

const CALFLORA_LAYER_ID = 'calflora-observations';
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 450;
const MIN_SEARCH_CHARS = 2;

export function CalFloraBrowseTab() {
  const {
    warmCache,
    createBrowseLoadingScope,
    browseFilters,
    setBrowseFilters,
    filterOptions,
  } = useCalFloraFilter();
  const {
    activeLayer,
    activateLayer,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
    syncCalFloraFilters,
    createOrUpdateCalFloraFilteredView,
  } = useLayers();
  const { viewRef } = useMap();
  const [searchInput, setSearchInput] = useState(browseFilters.searchText || '');
  const [appliedSearchText, setAppliedSearchText] = useState(browseFilters.searchText || '');
  const [county, setCounty] = useState(browseFilters.county || '');
  const [startDate, setStartDate] = useState(browseFilters.startDate || '');
  const [endDate, setEndDate] = useState(browseFilters.endDate || '');
  const [hasPhoto, setHasPhoto] = useState(Boolean(browseFilters.hasPhoto));
  const [observations, setObservations] = useState<CalFloraObservation[]>([]);
  const [selectedObservation, setSelectedObservation] = useState<CalFloraObservation | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastHandledFeatureIdRef = useRef<string | null>(null);
  const lastConsumedHydrateRef = useRef(0);
  const lastConsumedClearRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (!trimmed) {
        setAppliedSearchText('');
      } else if (trimmed.length >= MIN_SEARCH_CHARS) {
        setAppliedSearchText(trimmed);
      } else {
        setAppliedSearchText('');
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [appliedSearchText, county, startDate, endDate, hasPhoto]);

  useEffect(() => {
    setBrowseFilters({
      searchText: appliedSearchText,
      county,
      startDate,
      endDate,
      hasPhoto,
    });
  }, [appliedSearchText, county, startDate, endDate, hasPhoto, setBrowseFilters]);

  useEffect(() => {
    const abortController = new AbortController();
    const closeLoadingScope = createBrowseLoadingScope();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await calfloraV2Service.queryObservations({
          page,
          pageSize: PAGE_SIZE,
          filters: {
            searchText: appliedSearchText || undefined,
            county: county || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            hasPhoto,
          },
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        setObservations(response.observations);
        setTotalCount(response.totalCount);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load CalFlora observations');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          closeLoadingScope();
        }
      }
    };

    void run();
    return () => {
      abortController.abort();
      closeLoadingScope();
    };
  }, [appliedSearchText, county, startDate, endDate, hasPhoto, page, createBrowseLoadingScope]);

  useEffect(() => {
    if (!activeLayer || activeLayer.layerId !== CALFLORA_LAYER_ID || activeLayer.featureId == null) return;
    const featureId = String(activeLayer.featureId);
    if (lastHandledFeatureIdRef.current === featureId) return;
    if (selectedObservation && String(selectedObservation.objectId) === featureId) return;
    lastHandledFeatureIdRef.current = featureId;

    const localMatch = observations.find((item) => String(item.objectId) === featureId);
    if (localMatch) {
      setSelectedObservation(localMatch);
      return;
    }

    const parsedObjectId = Number.parseInt(featureId, 10);
    if (!Number.isFinite(parsedObjectId)) return;
    let cancelled = false;
    void calfloraV2Service.getObservationByObjectId(parsedObjectId)
      .then((observation) => {
        if (!cancelled && observation) setSelectedObservation(observation);
      })
      .catch(() => {
        // Keep browse panel stable if record fetch fails.
      });
    return () => {
      cancelled = true;
    };
  }, [activeLayer, observations, selectedObservation]);

  useEffect(() => {
    if (!activeLayer || activeLayer.layerId !== CALFLORA_LAYER_ID) return;

    const viewChanged = activeLayer.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    const clearRequested = lastFiltersClearedTimestamp > lastConsumedClearRef.current;
    prevHydrateViewIdRef.current = activeLayer.viewId;

    if (!viewChanged && !editRequested && !clearRequested) return;
    if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;
    if (clearRequested) lastConsumedClearRef.current = lastFiltersClearedTimestamp;

    const pinned = getPinnedByLayerId(activeLayer.layerId);
    if (!pinned) return;

    const sourceFilters = activeLayer.viewId && pinned.views
      ? pinned.views.find(v => v.id === activeLayer.viewId)?.calfloraFilters
      : pinned.calfloraFilters;
    if (!sourceFilters) return;

    const nextSearch = sourceFilters.searchText || '';
    setSearchInput(nextSearch);
    setAppliedSearchText(nextSearch);
    setCounty(sourceFilters.county || '');
    setStartDate(sourceFilters.startDate || '');
    setEndDate(sourceFilters.endDate || '');
    setHasPhoto(!!sourceFilters.hasPhoto);
    setPage(0);

    if (sourceFilters.selectedObservationId) {
      void calfloraV2Service.getObservationByObjectId(sourceFilters.selectedObservationId)
        .then((observation) => {
          if (observation) {
            lastHandledFeatureIdRef.current = String(observation.objectId);
            setSelectedObservation(observation);
          }
        })
        .catch(() => {
          // Best-effort restore only.
        });
    } else if (activeLayer.featureId == null) {
      setSelectedObservation(null);
    }
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.featureId,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
  ]);

  useEffect(() => {
    if (!activeLayer || activeLayer.layerId !== CALFLORA_LAYER_ID) return;
    const pinned = getPinnedByLayerId(activeLayer.layerId);
    const activeView = activeLayer.viewId && pinned?.views
      ? pinned.views.find((view) => view.id === activeLayer.viewId)
      : undefined;

    if (activeView?.calfloraFilters?.selectedObservationId) return;

    syncCalFloraFilters(
      activeLayer.layerId,
      {
        searchText: appliedSearchText || undefined,
        county: county || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasPhoto,
        selectedObservationId: selectedObservation?.objectId,
        selectedObservationLabel: selectedObservation?.plant,
      },
      totalCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    appliedSearchText,
    county,
    startDate,
    endDate,
    hasPhoto,
    selectedObservation?.objectId,
    selectedObservation?.plant,
    totalCount,
    getPinnedByLayerId,
    syncCalFloraFilters,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasStaleResults = observations.length > 0;
  const showInitialLoading = loading && !hasStaleResults;
  const showRefreshLoading = loading && hasStaleResults;
  const hasAnyFilter = useMemo(
    () => Boolean(appliedSearchText || county || startDate || endDate || hasPhoto),
    [appliedSearchText, county, startDate, endDate, hasPhoto],
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setAppliedSearchText('');
    setCounty('');
    setStartDate('');
    setEndDate('');
    setHasPhoto(false);
    setPage(0);
  };

  const handleSaveObservationView = (observation: CalFloraObservation): string => {
    if (!activeLayer || activeLayer.layerId !== CALFLORA_LAYER_ID) {
      return 'Unable to save view: CalFlora layer is not active.';
    }

    const savedViewId = createOrUpdateCalFloraFilteredView(
      activeLayer.layerId,
      {
        searchText: appliedSearchText || undefined,
        county: county || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasPhoto,
        selectedObservationId: observation.objectId,
        selectedObservationLabel: observation.plant,
      },
      totalCount
    );

    if (!savedViewId) {
      return 'Unable to save CalFlora view in Map Layers.';
    }

    activateLayer(activeLayer.layerId, savedViewId, observation.objectId);
    return 'Saved as a new CalFlora child view in Map Layers.';
  };

  const viewObservationOnMap = async (observation: CalFloraObservation) => {
    const view = viewRef.current;
    if (!view) return;
    activateLayer(CALFLORA_LAYER_ID, activeLayer?.viewId, observation.objectId);
    if (!observation.coordinates) return;
    try {
      await view.goTo({ center: observation.coordinates, zoom: 14 }, { duration: 650 });
    } catch {
      // Ignore interrupted map navigation so sidebar interactions stay responsive.
    }
  };

  if (selectedObservation) {
    return (
      <ObservationDetailView
        observation={selectedObservation}
        onBack={() => {
          setSelectedObservation(null);
          if (activeLayer?.layerId === CALFLORA_LAYER_ID) {
            activateLayer(CALFLORA_LAYER_ID, activeLayer.viewId, undefined);
          }
        }}
        onViewOnMap={viewObservationOnMap}
        onSaveView={handleSaveObservationView}
      />
    );
  }

  return (
    <div id="calflora-browse-tab" className="space-y-3">
      <div id="calflora-browse-live-region" className="sr-only" aria-live="polite">
        Showing {observations.length} of {totalCount} observations.
      </div>

      <EditFiltersCard id="calflora-edit-filters-card">
        <div id="calflora-search-row" className="relative">
          <Search id="calflora-search-icon" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="calflora-search-input"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search plant name..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm
                       placeholder:text-gray-400 focus:outline-none focus:border-gray-300
                       focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
          {searchInput && (
            <button
              id="calflora-search-clear-button"
              type="button"
              onClick={() => {
                setSearchInput('');
                setAppliedSearchText('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X id="calflora-search-clear-icon" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div id="calflora-filter-grid" className="grid grid-cols-2 gap-2">
          <select
            id="calflora-county-filter"
            value={county}
            onChange={(event) => setCounty(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          >
            <option id="calflora-county-filter-option-all" value="">All counties</option>
            {filterOptions.counties.map((option) => (
              <option id={`calflora-county-filter-option-${option}`} key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <label
            id="calflora-photo-toggle-wrap"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700"
          >
            <input
              id="calflora-photo-toggle-input"
              type="checkbox"
              checked={hasPhoto}
              onChange={(event) => setHasPhoto(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
            />
            <Camera className="h-3.5 w-3.5 text-gray-500" />
            Has photo
          </label>
          <input
            id="calflora-start-date-filter"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
          <input
            id="calflora-end-date-filter"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
        </div>

        <div id="calflora-result-summary-row" className="flex items-center justify-between text-xs">
          <p id="calflora-result-summary" className="text-gray-600">
            Showing <span id="calflora-result-summary-visible" className="font-semibold text-gray-800">{observations.length}</span>
            {' '}of{' '}
            <span id="calflora-result-summary-total" className="font-semibold text-gray-800">{totalCount.toLocaleString()}</span>
            {' '}observations
          </p>
          {hasAnyFilter && (
            <button
              id="calflora-clear-all-filters-button"
              type="button"
              onClick={clearAllFilters}
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </EditFiltersCard>

      {showInitialLoading && <InlineLoadingRow id="calflora-initial-loading" message="Loading observations..." />}
      {showRefreshLoading && <RefreshLoadingRow id="calflora-refresh-loading" message="Refreshing observations..." />}

      {error && (
        <div id="calflora-browse-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle id="calflora-browse-error-icon" className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span id="calflora-browse-error-text">{error}</span>
        </div>
      )}

      {!showInitialLoading && !error && observations.length > 0 && (
        <div id="calflora-observation-list-wrap" className={showRefreshLoading ? 'opacity-60' : ''}>
          <ObservationListView
            observations={observations}
            onOpenDetail={(observation) => {
              setSelectedObservation(observation);
              void viewObservationOnMap(observation);
            }}
          />
        </div>
      )}

      {!showInitialLoading && !error && observations.length === 0 && (
        <div id="calflora-empty-results" className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p id="calflora-empty-results-text" className="text-sm text-gray-600">No CalFlora observations match your filters.</p>
          {hasAnyFilter && (
            <button
              id="calflora-empty-results-clear-filters"
              type="button"
              onClick={clearAllFilters}
              className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {!showInitialLoading && totalPages > 1 && (
        <div id="calflora-pagination" className="flex items-center justify-between border-t border-gray-100 pt-2">
          <button
            id="calflora-pagination-prev"
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page <= 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <ChevronLeft id="calflora-pagination-prev-icon" className="h-3.5 w-3.5" />
            Previous
          </button>
          <span id="calflora-pagination-label" className="text-xs text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            id="calflora-pagination-next"
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight id="calflora-pagination-next-icon" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
