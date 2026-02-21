import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { gbifService, type GBIFOccurrence } from '../../../../services/gbifService';
import { useGBIFFilter } from '../../../context/GBIFFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { useMap } from '../../../context/MapContext';
import { EditFiltersCard } from '../shared/EditFiltersCard';
import { InlineLoadingRow, RefreshLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { GBIFOccurrenceCard } from './GBIFOccurrenceCard';
import { GBIFOccurrenceDetailView } from './GBIFOccurrenceDetailView';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 450;
const MIN_SEARCH_CHARS = 2;
const GBIF_LAYER_IDS = new Set(['dataset-178', 'dataset-215']);
const DEFAULT_GBIF_LAYER_ID = 'dataset-215';

export function GBIFBrowseTab() {
  const {
    warmCache,
    createBrowseLoadingScope,
    filterOptions,
    aggregationMode,
    setAggregationMode,
    browseFilters,
    setBrowseFilters,
  } = useGBIFFilter();
  const {
    activeLayer,
    activateLayer,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
    syncGBIFFilters,
    createOrUpdateGBIFFilteredView,
  } = useLayers();
  const { viewRef } = useMap();
  const activeGbifLayerId =
    activeLayer && GBIF_LAYER_IDS.has(activeLayer.layerId) ? activeLayer.layerId : DEFAULT_GBIF_LAYER_ID;
  const activeGbifMapLayerId = `v2-${activeGbifLayerId}`;
  const [searchInput, setSearchInput] = useState(browseFilters.searchText || '');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(browseFilters.searchText || '');
  const [kingdom, setKingdom] = useState(browseFilters.kingdom || '');
  const [family, setFamily] = useState(browseFilters.family || '');
  const [basisOfRecord, setBasisOfRecord] = useState(browseFilters.basisOfRecord || '');
  const [datasetName, setDatasetName] = useState(browseFilters.datasetName || '');
  const [startDate, setStartDate] = useState(browseFilters.startDate || '');
  const [endDate, setEndDate] = useState(browseFilters.endDate || '');
  const [occurrences, setOccurrences] = useState<GBIFOccurrence[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<GBIFOccurrence | null>(null);
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
      if (trimmed.length === 0) {
        setAppliedSearchTerm('');
      } else if (trimmed.length >= MIN_SEARCH_CHARS) {
        setAppliedSearchTerm(trimmed);
      } else {
        setAppliedSearchTerm('');
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [appliedSearchTerm, kingdom, family, basisOfRecord, datasetName, startDate, endDate]);

  // Keep map-query filters synchronized with browse controls.
  useEffect(() => {
    setBrowseFilters({
      searchText: appliedSearchTerm,
      kingdom,
      taxonomicClass: '',
      family,
      basisOfRecord,
      datasetName,
      startDate,
      endDate,
    });
  }, [appliedSearchTerm, kingdom, family, basisOfRecord, datasetName, startDate, endDate, setBrowseFilters]);

  useEffect(() => {
    const abortController = new AbortController();
    const closeLoadingScope = createBrowseLoadingScope();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await gbifService.queryOccurrences({
          page,
          pageSize: PAGE_SIZE,
          searchText: appliedSearchTerm || undefined,
          kingdom: kingdom || undefined,
          family: family || undefined,
          basisOfRecord: basisOfRecord || undefined,
          datasetName: datasetName || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        setOccurrences(response.occurrences);
        setTotalCount(response.totalCount);
      } catch (err) {
        if (abortController.signal.aborted) return;
        const rawMessage = err instanceof Error ? err.message : 'Failed to query GBIF occurrences';
        const normalizedMessage = rawMessage.toLowerCase();
        if (normalizedMessage.includes('unable to complete operation') || normalizedMessage.includes('unable to perform query operation')) {
          setError('GBIF service is temporarily unavailable (ArcGIS query failed). Please try again shortly.');
        } else {
          setError(rawMessage);
        }
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
  }, [appliedSearchTerm, kingdom, family, basisOfRecord, datasetName, startDate, endDate, page, createBrowseLoadingScope]);

  useEffect(() => {
    if (!activeLayer || !GBIF_LAYER_IDS.has(activeLayer.layerId) || activeLayer.featureId == null) return;
    const featureId = String(activeLayer.featureId);
    if (lastHandledFeatureIdRef.current === featureId) return;
    if (selectedOccurrence && String(selectedOccurrence.id) === featureId) return;
    lastHandledFeatureIdRef.current = featureId;

    const localMatch = occurrences.find((item) => String(item.id) === featureId);
    if (localMatch) {
      setSelectedOccurrence(localMatch);
      return;
    }

    const parsedId = Number.parseInt(featureId, 10);
    if (!Number.isFinite(parsedId)) return;
    let cancelled = false;
    void gbifService.getOccurrenceById(parsedId)
      .then((occurrence) => {
        if (!cancelled && occurrence) setSelectedOccurrence(occurrence);
      })
      .catch(() => {
        // Map behavior already logs click errors. Keep browse UI quiet.
      });
    return () => {
      cancelled = true;
    };
  }, [activeLayer, occurrences, selectedOccurrence]);

  // Hydrate GBIF browse controls from the selected pinned child view.
  useEffect(() => {
    if (!activeLayer || !GBIF_LAYER_IDS.has(activeLayer.layerId)) return;

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
      ? pinned.views.find(v => v.id === activeLayer.viewId)?.gbifFilters
      : pinned.gbifFilters;
    if (!sourceFilters) return;

    const nextSearch = sourceFilters.searchText || '';
    setSearchInput(nextSearch);
    setAppliedSearchTerm(nextSearch);
    setKingdom(sourceFilters.kingdom || '');
    setFamily(sourceFilters.family || '');
    setBasisOfRecord(sourceFilters.basisOfRecord || '');
    setDatasetName(sourceFilters.datasetName || '');
    setStartDate(sourceFilters.startDate || '');
    setEndDate(sourceFilters.endDate || '');
    setPage(0);

    if (sourceFilters.selectedOccurrenceId) {
      void gbifService.getOccurrenceById(sourceFilters.selectedOccurrenceId)
        .then((occurrence) => {
          if (occurrence) {
            lastHandledFeatureIdRef.current = String(occurrence.id);
            setSelectedOccurrence(occurrence);
          }
        })
        .catch(() => {
          // Best-effort restore only.
        });
    } else if (activeLayer.featureId == null) {
      setSelectedOccurrence(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally gated by refs
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.featureId,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
  ]);

  // Keep Map Layers metadata synced to current GBIF filters/detail selection.
  useEffect(() => {
    if (!activeLayer || !GBIF_LAYER_IDS.has(activeLayer.layerId)) return;
    const pinned = getPinnedByLayerId(activeLayer.layerId);
    const activeView = activeLayer.viewId && pinned?.views
      ? pinned.views.find((view) => view.id === activeLayer.viewId)
      : undefined;

    // Saved occurrence child views are snapshots and should not be overwritten
    // while users keep browsing other records in detail/list flow.
    if (activeView?.gbifFilters?.selectedOccurrenceId) return;

    syncGBIFFilters(
      activeLayer.layerId,
      {
        searchText: appliedSearchTerm || undefined,
        kingdom: kingdom || undefined,
        family: family || undefined,
        basisOfRecord: basisOfRecord || undefined,
        datasetName: datasetName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        selectedOccurrenceId: selectedOccurrence?.id,
        selectedOccurrenceLabel: selectedOccurrence
          ? (selectedOccurrence.species || selectedOccurrence.scientificName || undefined)
          : undefined,
      },
      totalCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    appliedSearchTerm,
    kingdom,
    family,
    basisOfRecord,
    datasetName,
    startDate,
    endDate,
    selectedOccurrence?.id,
    selectedOccurrence?.species,
    selectedOccurrence?.scientificName,
    totalCount,
    getPinnedByLayerId,
    syncGBIFFilters,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasStaleResults = occurrences.length > 0;
  const showInitialLoading = loading && !hasStaleResults;
  const showRefreshLoading = loading && hasStaleResults;

  const hasAnyFilter = useMemo(
    () =>
      Boolean(
        appliedSearchTerm ||
          kingdom ||
          family ||
          basisOfRecord ||
          datasetName ||
          startDate ||
          endDate,
      ),
    [appliedSearchTerm, kingdom, family, basisOfRecord, datasetName, startDate, endDate],
  );

  const viewOccurrenceOnMap = (occurrence: GBIFOccurrence) => {
    if (!occurrence.coordinates) return;
    const view = viewRef.current;
    if (!view) return;
    activateLayer(activeGbifLayerId, activeLayer?.viewId, occurrence.id);
    void view.goTo({ center: occurrence.coordinates, zoom: 13 }, { duration: 650 });
    const map = view.map;
    if (!map) return;
    const layer = map.findLayerById(activeGbifMapLayerId) as __esri.FeatureLayer | undefined;
    if (!layer) return;
    void view.openPopup({
      location: {
        type: 'point',
        longitude: occurrence.coordinates[0],
        latitude: occurrence.coordinates[1],
      } as __esri.Point,
      features: [],
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setAppliedSearchTerm('');
    setKingdom('');
    setFamily('');
    setBasisOfRecord('');
    setDatasetName('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleSaveOccurrenceView = (occurrence: GBIFOccurrence): string => {
    if (!activeLayer || !GBIF_LAYER_IDS.has(activeLayer.layerId)) {
      return 'Unable to save view: GBIF layer is not active.';
    }

    const savedViewId = createOrUpdateGBIFFilteredView(
      activeLayer.layerId,
      {
        selectedOccurrenceId: occurrence.id,
        selectedOccurrenceLabel: occurrence.species || occurrence.scientificName || `Occurrence ${occurrence.id}`,
      },
      1
    );

    if (!savedViewId) {
      return 'Unable to save GBIF view in Map Layers.';
    }

    activateLayer(activeLayer.layerId, savedViewId, occurrence.id);
    return 'Saved as a new GBIF child view in Map Layers.';
  };

  if (selectedOccurrence) {
    return (
      <GBIFOccurrenceDetailView
        occurrence={selectedOccurrence}
        onSaveView={handleSaveOccurrenceView}
        onBack={() => {
          setSelectedOccurrence(null);
          if (activeLayer?.layerId && GBIF_LAYER_IDS.has(activeLayer.layerId)) {
            activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
          }
        }}
        onViewOnMap={() => viewOccurrenceOnMap(selectedOccurrence)}
      />
    );
  }

  return (
    <div id="gbif-browse-tab" className="space-y-3">
      <div id="gbif-browse-live-region" className="sr-only" aria-live="polite">
        Showing {occurrences.length} of {totalCount} occurrences.
      </div>

      <EditFiltersCard id="gbif-edit-filters-card">
        <div id="gbif-aggregation-toggle-section" className="space-y-1">
          <p id="gbif-aggregation-toggle-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Map aggregation
          </p>
          <div id="gbif-aggregation-toggle-group" className="grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              id="gbif-aggregation-toggle-cluster"
              type="button"
              onClick={() => setAggregationMode('cluster')}
              aria-pressed={aggregationMode === 'cluster'}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                aggregationMode === 'cluster'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Clusters
            </button>
            <button
              id="gbif-aggregation-toggle-binning"
              type="button"
              onClick={() => setAggregationMode('binning')}
              aria-pressed={aggregationMode === 'binning'}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                aggregationMode === 'binning'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Grid bins
            </button>
          </div>
        </div>

        <div id="gbif-search-row" className="relative">
          <Search id="gbif-search-icon" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="gbif-search-input"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search species, genus, dataset..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm
                       placeholder:text-gray-400 focus:outline-none focus:border-gray-300
                       focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
          {searchInput && (
            <button
              id="gbif-search-clear-button"
              onClick={() => {
                setSearchInput('');
                setAppliedSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X id="gbif-search-clear-icon" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div id="gbif-filter-grid" className="grid grid-cols-2 gap-2">
          <FilterSelect id="gbif-kingdom-filter" value={kingdom} onChange={setKingdom} placeholder="All kingdoms" options={filterOptions.kingdoms} />
          <FilterSelect id="gbif-family-filter" value={family} onChange={setFamily} placeholder="All families" options={filterOptions.families} />
          <FilterSelect id="gbif-basis-filter" value={basisOfRecord} onChange={setBasisOfRecord} placeholder="All record types" options={filterOptions.basisOptions} />
          <FilterSelect id="gbif-dataset-filter" value={datasetName} onChange={setDatasetName} placeholder="All datasets" options={filterOptions.datasetNames} />
          <input
            id="gbif-start-date-filter"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
          <input
            id="gbif-end-date-filter"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
        </div>

        <div id="gbif-result-summary-row" className="flex items-center justify-between text-xs">
          <p id="gbif-result-summary" className="text-gray-600">
            Showing <span id="gbif-result-summary-visible" className="font-semibold text-gray-800">{occurrences.length}</span>
            {' '}of{' '}
            <span id="gbif-result-summary-total" className="font-semibold text-gray-800">{totalCount.toLocaleString()}</span>
            {' '}occurrences
          </p>
          {hasAnyFilter && (
            <button
              id="gbif-clear-all-filters-button"
              onClick={clearAllFilters}
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </EditFiltersCard>

      {showInitialLoading && <InlineLoadingRow id="gbif-initial-loading" message="Loading occurrences..." />}
      {showRefreshLoading && <RefreshLoadingRow id="gbif-refresh-loading" message="Refreshing occurrences..." />}

      {error && (
        <div id="gbif-browse-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle id="gbif-browse-error-icon" className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span id="gbif-browse-error-text">{error}</span>
        </div>
      )}

      {!showInitialLoading && !error && occurrences.length > 0 && (
        <div id="gbif-occurrence-list" className={`space-y-2 ${showRefreshLoading ? 'opacity-60' : ''}`}>
          {occurrences.map((occurrence) => (
            <GBIFOccurrenceCard
              key={occurrence.id}
              occurrence={occurrence}
              onViewDetail={() => {
                setSelectedOccurrence(occurrence);
                activateLayer(activeGbifLayerId, activeLayer?.viewId, occurrence.id);
              }}
              onViewOnMap={() => viewOccurrenceOnMap(occurrence)}
            />
          ))}
        </div>
      )}

      {!showInitialLoading && !error && occurrences.length === 0 && (
        <div id="gbif-empty-results" className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p id="gbif-empty-results-text" className="text-sm text-gray-600">No occurrences match your filters.</p>
          {hasAnyFilter && (
            <button
              id="gbif-empty-results-clear-filters"
              onClick={clearAllFilters}
              className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {!showInitialLoading && totalPages > 1 && (
        <div id="gbif-pagination" className="flex items-center justify-between border-t border-gray-100 pt-2">
          <button
            id="gbif-pagination-prev"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page <= 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <ChevronLeft id="gbif-pagination-prev-icon" className="h-3.5 w-3.5" />
            Previous
          </button>
          <span id="gbif-pagination-label" className="text-xs text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            id="gbif-pagination-next"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight id="gbif-pagination-next-icon" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                 focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
    >
      <option id={`${id}-option-all`} value="">{placeholder}</option>
      {options.map((option) => (
        <option id={`${id}-option-${option}`} key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
