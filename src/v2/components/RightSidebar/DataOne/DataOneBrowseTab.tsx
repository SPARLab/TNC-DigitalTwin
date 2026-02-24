// ============================================================================
// DataOneBrowseTab — Search + filter UI for DataOne datasets.
// Implements DFT-035 behavior for debounced text search and immediate filters.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { dataOneService, type DataOneDataset } from '../../../../services/dataOneService';
import { useDataOneFilter } from '../../../context/DataOneFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { InlineLoadingRow, RefreshLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { DatasetListView } from './DatasetListView';
import { DatasetDetailView } from './DatasetDetailView';
import { SpatialQuerySection } from '../shared/SpatialQuerySection';
import { EditFiltersCard } from '../shared/EditFiltersCard';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;
const MIN_SEARCH_CHARS = 2;

const TNC_CATEGORY_OPTIONS = [
  'Species',
  'Land Cover',
  'Weather and Climate',
  'Freshwater',
  'Boundaries',
  'Earth Observations',
  'Elevation and Bathymetry',
  'Soils and Geology',
  'Oceans and Coasts',
  'Fire',
  'Infrastructure',
  'Threats and Hazards',
  'Research and Sensor Equipment',
] as const;

const FILE_TYPE_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'tif', label: 'TIF' },
  { value: 'imagery', label: 'Imagery' },
  { value: 'other', label: 'Other' },
] as const;

function normalizeCategories(categories?: string[]): string[] {
  if (!categories || categories.length === 0) return [];
  const seen = new Set<string>();
  for (const category of categories) {
    const trimmed = category.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
  }
  return Array.from(seen);
}

function normalizeFileTypes(
  fileTypes?: Array<'csv' | 'tif' | 'imagery' | 'other'>,
): Array<'csv' | 'tif' | 'imagery' | 'other'> {
  if (!fileTypes || fileTypes.length === 0) return [];
  const allowed = new Set(['csv', 'tif', 'imagery', 'other'] as const);
  const seen = new Set<'csv' | 'tif' | 'imagery' | 'other'>();
  for (const fileType of fileTypes) {
    if (allowed.has(fileType)) seen.add(fileType);
  }
  return Array.from(seen);
}

function categoryToId(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toStartDate(year: string): string | undefined {
  return year ? `${year}-01-01` : undefined;
}

function toEndDate(year: string): string | undefined {
  return year ? `${year}-12-31` : undefined;
}

export function DataOneBrowseTab() {
  const {
    warmCache,
    createBrowseLoadingScope,
    mapLoading,
    browseFilters,
    setBrowseFilters,
    aggregationMode,
    setAggregationMode,
    mapSelectionDataoneIds,
    setMapSelectionDataoneIds,
    mapDatasetsCache,
  } = useDataOneFilter();
  const {
    activeLayer,
    activateLayer,
    pinLayer,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
    syncDataOneFilters,
    createOrUpdateDataOneFilteredView,
  } = useLayers();
  const [searchInput, setSearchInput] = useState(browseFilters.searchText);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(browseFilters.searchText);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    normalizeCategories(browseFilters.tncCategories),
  );
  const [selectedFileTypes, setSelectedFileTypes] = useState<
    Array<'csv' | 'tif' | 'imagery' | 'other'>
  >(normalizeFileTypes(browseFilters.fileTypes));
  const [startYear, setStartYear] = useState(browseFilters.startDate.slice(0, 4));
  const [endYear, setEndYear] = useState(browseFilters.endDate.slice(0, 4));
  const [authorFilter, setAuthorFilter] = useState(browseFilters.author);

  const [datasets, setDatasets] = useState<DataOneDataset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<DataOneDataset | null>(null);
  const lastHandledFeatureIdRef = useRef<string | null>(null);
  const lastConsumedHydrateRef = useRef(0);
  const lastConsumedClearRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 75 }, (_, i) => String(currentYear - i)),
    [currentYear]
  );

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  // Keep map-query filters synchronized with browse controls.
  useEffect(() => {
    setBrowseFilters({
      searchText: appliedSearchTerm,
      tncCategories: selectedCategories,
      fileTypes: selectedFileTypes,
      startDate: toStartDate(startYear) || '',
      endDate: toEndDate(endYear) || '',
      author: authorFilter.trim(),
    });
  }, [appliedSearchTerm, selectedCategories, selectedFileTypes, startYear, endYear, authorFilter, setBrowseFilters]);

  // Debounced text search (DFT-035)
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

  // Reset pagination when filter/search controls change.
  useEffect(() => {
    setPage(0);
  }, [appliedSearchTerm, selectedCategories, selectedFileTypes, startYear, endYear, authorFilter]);

  // When map-selection is active, resolve datasets entirely client-side from
  // the map behaviour's in-memory cache to avoid 414 URI-Too-Large errors.
  const mapSelectionIdSet = useMemo(
    () => (mapSelectionDataoneIds ? new Set(mapSelectionDataoneIds) : null),
    [mapSelectionDataoneIds],
  );

  useEffect(() => {
    if (!mapSelectionIdSet) return;

    const matched: DataOneDataset[] = [];
    for (const [id, dataset] of mapDatasetsCache) {
      if (mapSelectionIdSet.has(id)) matched.push(dataset);
    }
    matched.sort(
      (a, b) => (b.dateUploaded?.getTime() ?? 0) - (a.dateUploaded?.getTime() ?? 0),
    );

    const clientTotal = matched.length;
    const clientPages = Math.ceil(clientTotal / PAGE_SIZE);
    const safePage = Math.min(page, Math.max(clientPages - 1, 0));
    const pageSlice = matched.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    setDatasets(pageSlice);
    setTotalCount(clientTotal);
    setTotalPages(clientPages);
    setLoading(false);
    setError(null);
  }, [mapSelectionIdSet, mapDatasetsCache, page]);

  // Server-side query for normal (non-map-selection) browsing.
  useEffect(() => {
    if (mapSelectionIdSet) return;

    const abortController = new AbortController();
    const closeLoadingScope = createBrowseLoadingScope();

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await dataOneService.queryDatasets({
          pageSize: PAGE_SIZE,
          pageNumber: page,
          searchText: appliedSearchTerm || undefined,
          tncCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
          fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined,
          startDate: toStartDate(startYear),
          endDate: toEndDate(endYear),
          author: authorFilter.trim() || undefined,
          signal: abortController.signal,
          usePreserveRadius: true,
        });

        setDatasets(response.datasets);
        setTotalCount(response.totalCount);
        setTotalPages(response.totalPages);
      } catch (err) {
        if (abortController.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to query DataOne datasets');
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
  }, [mapSelectionIdSet, appliedSearchTerm, selectedCategories, selectedFileTypes, startYear, endYear, authorFilter, page, createBrowseLoadingScope]);

  // When featureId is cleared (cluster click, back navigation), return to list view.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets') return;
    if (activeLayer.featureId != null) return;
    setSelectedDataset(null);
    lastHandledFeatureIdRef.current = null;
  }, [activeLayer?.layerId, activeLayer?.featureId]);

  // Map marker clicks set activeLayer.featureId. Ensure detail opens even when
  // the clicked dataset is not in the current paginated result set.
  // Ref update is deferred to AFTER the fetch resolves so that if this effect
  // re-runs (activeLayer object recreated by side effects), a cancelled fetch
  // doesn't permanently block re-issuing the request.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets' || !activeLayer.featureId) return;
    const featureId = String(activeLayer.featureId);
    if (lastHandledFeatureIdRef.current === featureId) return;
    if (selectedDataset?.dataoneId === featureId) return;

    let cancelled = false;
    void dataOneService.getDatasetByDataoneId(featureId)
      .then((dataset) => {
        if (!cancelled && dataset) {
          lastHandledFeatureIdRef.current = featureId;
          setSelectedDataset(dataset);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeLayer, selectedDataset?.dataoneId]);

  // Hydrate DataONE browse controls from the selected pinned child view.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets') return;

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
      ? pinned.views.find(v => v.id === activeLayer.viewId)?.dataoneFilters
      : pinned.dataoneFilters;
    if (!sourceFilters) return;

    const nextSearch = sourceFilters.searchText || '';
    setSearchInput(nextSearch);
    setAppliedSearchTerm(nextSearch);
    setSelectedCategories(
      normalizeCategories(sourceFilters.tncCategories || (sourceFilters.tncCategory ? [sourceFilters.tncCategory] : [])),
    );
    setSelectedFileTypes(normalizeFileTypes(sourceFilters.fileTypes));
    setStartYear(sourceFilters.startDate?.slice(0, 4) || '');
    setEndYear(sourceFilters.endDate?.slice(0, 4) || '');
    setAuthorFilter(sourceFilters.author || '');
    setPage(0);

    if (sourceFilters.selectedDatasetId) {
      void dataOneService.getDatasetByDataoneId(sourceFilters.selectedDatasetId)
        .then((dataset) => {
          if (dataset) {
            lastHandledFeatureIdRef.current = dataset.dataoneId;
            setSelectedDataset(dataset);
          }
        })
        .catch(() => {
          // No UI noise here; this is best-effort context restore.
        });
    } else if (activeLayer.featureId == null) {
      setSelectedDataset(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally gated by ref guards
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.featureId,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
  ]);

  // Keep Map Layers metadata synced to current DataONE filters/detail selection.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets') return;
    const pinned = getPinnedByLayerId(activeLayer.layerId);
    const activeView = activeLayer.viewId && pinned?.views
      ? pinned.views.find((view) => view.id === activeLayer.viewId)
      : undefined;

    // Saved dataset child views are snapshots and should not be overwritten
    // while users keep browsing other datasets in detail/list flow.
    if (activeView?.dataoneFilters?.selectedDatasetId) return;

    syncDataOneFilters(
      activeLayer.layerId,
      {
        searchText: appliedSearchTerm || undefined,
        tncCategory: selectedCategories[0],
        tncCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined,
        startDate: toStartDate(startYear),
        endDate: toEndDate(endYear),
        author: authorFilter.trim() || undefined,
      },
      totalCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    appliedSearchTerm,
    selectedCategories,
    selectedFileTypes,
    startYear,
    endYear,
    authorFilter,
    totalCount,
    getPinnedByLayerId,
    syncDataOneFilters,
  ]);

  const currentViewSavedDatasetId = useMemo(() => {
    if (activeLayer?.layerId !== 'dataone-datasets' || !activeLayer.viewId) return undefined;
    const pinned = getPinnedByLayerId('dataone-datasets');
    return pinned?.views?.find(v => v.id === activeLayer.viewId)?.dataoneFilters?.selectedDatasetId;
  }, [activeLayer?.layerId, activeLayer?.viewId, getPinnedByLayerId]);

  const savedDataoneIds = useMemo(() => {
    const pinned = getPinnedByLayerId('dataone-datasets');
    const ids = new Set<string>();
    const rootSelectedDatasetId = pinned?.dataoneFilters?.selectedDatasetId;
    if (rootSelectedDatasetId) ids.add(rootSelectedDatasetId);
    for (const view of pinned?.views ?? []) {
      const selectedDatasetId = view.dataoneFilters?.selectedDatasetId;
      if (selectedDatasetId) ids.add(selectedDatasetId);
    }
    return ids;
  }, [getPinnedByLayerId]);

  const handleSaveDatasetView = (dataset: DataOneDataset): string => {
    if (activeLayer?.layerId !== 'dataone-datasets') {
      return 'Unable to save view: DataONE layer is not active.';
    }

    const pinnedDataOneLayer = getPinnedByLayerId(activeLayer.layerId);
    if (!pinnedDataOneLayer) {
      pinLayer(activeLayer.layerId);
    }

    const currentViewIsAssigned = Boolean(currentViewSavedDatasetId);
    const targetViewId = currentViewIsAssigned ? undefined : activeLayer.viewId;

    const savedViewId = createOrUpdateDataOneFilteredView(
      activeLayer.layerId,
      {
        searchText: appliedSearchTerm || undefined,
        tncCategory: selectedCategories[0],
        tncCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined,
        startDate: toStartDate(startYear),
        endDate: toEndDate(endYear),
        author: authorFilter.trim() || undefined,
        selectedDatasetId: dataset.dataoneId,
        selectedDatasetTitle: dataset.title,
      },
      totalCount,
      targetViewId
    );

    if (!savedViewId) {
      return 'Unable to save view in Map Layers.';
    }

    activateLayer(activeLayer.layerId, savedViewId, dataset.dataoneId);
    return currentViewIsAssigned
      ? 'Created a new saved view in Map Layers.'
      : 'Saved to current view in Map Layers.';
  };

  const handleUnsaveDatasetView = () => {
    if (activeLayer?.layerId !== 'dataone-datasets' || !activeLayer.viewId || !selectedDataset) return;

    createOrUpdateDataOneFilteredView(
      activeLayer.layerId,
      {
        searchText: appliedSearchTerm || undefined,
        tncCategory: selectedCategories[0],
        tncCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
        fileTypes: selectedFileTypes.length > 0 ? selectedFileTypes : undefined,
        startDate: toStartDate(startYear),
        endDate: toEndDate(endYear),
        author: authorFilter.trim() || undefined,
      },
      totalCount,
      activeLayer.viewId
    );

    activateLayer(activeLayer.layerId, activeLayer.viewId, selectedDataset.dataoneId);
  };

  if (selectedDataset) {
    return (
      <DatasetDetailView
        dataset={selectedDataset}
        onSaveDatasetView={handleSaveDatasetView}
        onUnsaveDatasetView={handleUnsaveDatasetView}
        isDatasetSaved={Boolean(selectedDataset && currentViewSavedDatasetId === selectedDataset.dataoneId)}
        onVersionSelect={(versionDataset) => {
          lastHandledFeatureIdRef.current = versionDataset.dataoneId;
          setSelectedDataset(versionDataset);
          if (activeLayer?.layerId === 'dataone-datasets') {
            activateLayer('dataone-datasets', activeLayer.viewId, versionDataset.dataoneId);
          }
        }}
        onBack={() => {
          setSelectedDataset(null);
          if (activeLayer?.layerId === 'dataone-datasets') {
            activateLayer('dataone-datasets', activeLayer.viewId, undefined);
          }
        }}
        onKeywordClick={(keyword) => {
          setSelectedDataset(null);
          setSearchInput(keyword);
          setAppliedSearchTerm(keyword.trim().length >= MIN_SEARCH_CHARS ? keyword.trim() : '');
          setPage(0);
        }}
      />
    );
  }

  const hasStaleResults = datasets.length > 0;
  const showInitialLoading = loading && !hasStaleResults;
  const showRefreshLoading = loading && hasStaleResults;
  const hasAnyFilter = Boolean(
    appliedSearchTerm
      || selectedCategories.length > 0
      || selectedFileTypes.length > 0
      || startYear
      || endYear
      || authorFilter.trim()
      || mapSelectionDataoneIds?.length
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setAppliedSearchTerm('');
    setSelectedCategories([]);
    setSelectedFileTypes([]);
    setStartYear('');
    setEndYear('');
    setAuthorFilter('');
    setMapSelectionDataoneIds(null);
    setPage(0);
  };

  return (
    <div id="dataone-browse-tab" className="space-y-3">
      <div id="dataone-browse-live-region" className="sr-only" aria-live="polite">
        Showing {datasets.length} of {totalCount} datasets.
      </div>

      <EditFiltersCard id="dataone-edit-filters-card">
        <div id="dataone-aggregation-toggle-section" className="space-y-1">
          <p id="dataone-aggregation-toggle-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Map aggregation
          </p>
          <div id="dataone-aggregation-toggle-group" className="grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              id="dataone-aggregation-toggle-cluster"
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
              id="dataone-aggregation-toggle-binning"
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

        <div id="dataone-search-row" className="relative">
          <Search id="dataone-search-icon" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="dataone-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              const trimmed = searchInput.trim();
              setAppliedSearchTerm(trimmed.length >= MIN_SEARCH_CHARS ? trimmed : '');
              setPage(0);
            }}
            placeholder="Search title, abstract, or keywords..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm
                       placeholder:text-gray-400 focus:outline-none focus:border-gray-300
                       focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
          {searchInput && (
            <button
              id="dataone-search-clear-button"
              onClick={() => {
                setSearchInput('');
                setAppliedSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X id="dataone-search-clear-icon" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div id="dataone-category-checklist-section" className="space-y-1">
          <div id="dataone-category-checklist-header" className="flex items-center justify-between">
            <p id="dataone-category-checklist-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Categories
            </p>
          </div>
          <div id="dataone-category-checklist-status-row" className="flex items-center justify-between">
            <p id="dataone-category-checklist-count" className="text-[11px] text-gray-500">
              {selectedCategories.length === 0
                ? 'No category filter applied'
                : `${selectedCategories.length} selected`}
            </p>
            <div id="dataone-category-checklist-actions" className="flex items-center gap-2">
              <button
                id="dataone-category-select-all-button"
                type="button"
                onClick={() => setSelectedCategories([...TNC_CATEGORY_OPTIONS])}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedCategories.length === TNC_CATEGORY_OPTIONS.length}
              >
                Select all
              </button>
              <button
                id="dataone-category-clear-all-button"
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedCategories.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          <div id="dataone-category-checklist" className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white px-2.5 py-2">
            {TNC_CATEGORY_OPTIONS.map((category) => {
              const categorySlug = categoryToId(category);
              const checkboxId = `dataone-category-checkbox-${categorySlug}`;
              const isChecked = selectedCategories.includes(category);
              return (
                <label
                  id={`dataone-category-option-${categorySlug}`}
                  key={category}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedCategories((prev) => {
                        const next = prev.includes(category)
                          ? prev.filter((item) => item !== category)
                          : [...prev, category];
                        return normalizeCategories(next);
                      });
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span id={`dataone-category-option-label-${categorySlug}`}>{category}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div id="dataone-file-type-checklist-section" className="space-y-1">
          <div id="dataone-file-type-checklist-header" className="flex items-center justify-between">
            <p id="dataone-file-type-checklist-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              File types
            </p>
          </div>
          <div id="dataone-file-type-checklist-status-row" className="flex items-center justify-between">
            <p id="dataone-file-type-checklist-count" className="text-[11px] text-gray-500">
              {selectedFileTypes.length === 0
                ? 'No file-type filter applied'
                : `${selectedFileTypes.length} selected`}
            </p>
            <div id="dataone-file-type-checklist-actions" className="flex items-center gap-2">
              <button
                id="dataone-file-type-select-all-button"
                type="button"
                onClick={() => setSelectedFileTypes(FILE_TYPE_OPTIONS.map((option) => option.value))}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedFileTypes.length === FILE_TYPE_OPTIONS.length}
              >
                Select all
              </button>
              <button
                id="dataone-file-type-clear-all-button"
                type="button"
                onClick={() => setSelectedFileTypes([])}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedFileTypes.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          <div id="dataone-file-type-checklist" className="space-y-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2">
            {FILE_TYPE_OPTIONS.map((option) => {
              const checkboxId = `dataone-file-type-checkbox-${option.value}`;
              const isChecked = selectedFileTypes.includes(option.value);
              return (
                <label
                  id={`dataone-file-type-option-${option.value}`}
                  key={option.value}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedFileTypes((prev) => {
                        const next = prev.includes(option.value)
                          ? prev.filter((item) => item !== option.value)
                          : [...prev, option.value];
                        return normalizeFileTypes(next);
                      });
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span id={`dataone-file-type-option-label-${option.value}`}>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div id="dataone-filter-grid" className="grid grid-cols-2 gap-2">
          <input
            id="dataone-author-filter"
            type="text"
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            placeholder="Filter by author..."
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       placeholder:text-gray-400 focus:outline-none focus:border-gray-300
                       focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />

          <select
            id="dataone-start-year-filter"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          >
            <option id="dataone-start-year-filter-any" value="">Start Year</option>
            {yearOptions.map((year) => (
              <option id={`dataone-start-year-filter-${year}`} key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            id="dataone-end-year-filter"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          >
            <option id="dataone-end-year-filter-any" value="">End Year</option>
            {yearOptions.map((year) => (
              <option id={`dataone-end-year-filter-${year}`} key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <SpatialQuerySection id="dataone-spatial-query-section" layerId="dataone-datasets" />

        <div id="dataone-result-summary-row" className="flex items-center justify-between text-xs">
          <p id="dataone-result-summary" className="text-gray-600">
            Showing <span id="dataone-result-summary-visible" className="font-semibold text-gray-800">{datasets.length}</span>
            {' '}of{' '}
            <span id="dataone-result-summary-total" className="font-semibold text-gray-800">{totalCount}</span>
            {' '}datasets
          </p>
          {hasAnyFilter && (
            <button
              id="dataone-clear-all-filters-button"
              onClick={clearAllFilters}
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
        {mapSelectionDataoneIds && mapSelectionDataoneIds.length > 0 && (
          <div id="dataone-map-selection-chip-row" className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
            <span id="dataone-map-selection-chip-label">
              Map location filter active ({mapSelectionDataoneIds.length} dataset{mapSelectionDataoneIds.length === 1 ? '' : 's'})
            </span>
            <button
              id="dataone-map-selection-chip-clear-button"
              type="button"
              onClick={() => {
                setMapSelectionDataoneIds(null);
                setPage(0);
              }}
              className="font-medium text-emerald-700 hover:text-emerald-900"
            >
              Clear
            </button>
          </div>
        )}
      </EditFiltersCard>

      {showInitialLoading && (
        <InlineLoadingRow id="dataone-initial-loading" message="Loading datasets..." />
      )}

      {showRefreshLoading && (
        <RefreshLoadingRow id="dataone-refresh-loading" message="Refreshing datasets..." />
      )}
      {mapLoading && (
        <RefreshLoadingRow id="dataone-map-refresh-loading" message="Updating map markers..." />
      )}

      {error && (
        <div id="dataone-browse-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle id="dataone-browse-error-icon" className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span id="dataone-browse-error-text">{error}</span>
        </div>
      )}

      {!showInitialLoading && !error && datasets.length > 0 && (
        <DatasetListView
          datasets={datasets}
          loading={showRefreshLoading}
          savedDataoneIds={savedDataoneIds}
          searchTerm={appliedSearchTerm}
          onViewDetail={(dataset) => {
            lastHandledFeatureIdRef.current = dataset.dataoneId;
            setSelectedDataset(dataset);
            if (activeLayer?.layerId === 'dataone-datasets') {
              activateLayer('dataone-datasets', activeLayer.viewId, dataset.dataoneId);
            }
          }}
        />
      )}

      {!showInitialLoading && !error && datasets.length === 0 && (
        <div id="dataone-empty-results" className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p id="dataone-empty-results-text" className="text-sm text-gray-600">No datasets match your filters.</p>
          {hasAnyFilter && (
            <button
              id="dataone-empty-results-clear-filters"
              onClick={clearAllFilters}
              className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {!showInitialLoading && totalPages > 1 && (
        <div id="dataone-pagination" className="flex items-center justify-between border-t border-gray-100 pt-2">
          <button
            id="dataone-pagination-prev"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page <= 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900
                       disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            <ChevronLeft id="dataone-pagination-prev-icon" className="h-3.5 w-3.5" />
            Previous
          </button>

          <span id="dataone-pagination-label" className="text-xs text-gray-500">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </span>

          <button
            id="dataone-pagination-next"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-gray-900
                       disabled:text-gray-300 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight id="dataone-pagination-next-icon" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
