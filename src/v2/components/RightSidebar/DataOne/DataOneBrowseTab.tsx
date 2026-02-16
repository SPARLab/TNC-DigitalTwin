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
    browseFilters,
    setBrowseFilters,
  } = useDataOneFilter();
  const {
    activeLayer,
    activateLayer,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    getPinnedByLayerId,
    syncDataOneFilters,
    createOrUpdateDataOneFilteredView,
  } = useLayers();
  const [searchInput, setSearchInput] = useState(browseFilters.searchText);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(browseFilters.searchText);
  const [selectedCategory, setSelectedCategory] = useState<string>(browseFilters.tncCategory || 'all');
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
      tncCategory: selectedCategory === 'all' ? '' : selectedCategory,
      startDate: toStartDate(startYear) || '',
      endDate: toEndDate(endYear) || '',
      author: authorFilter.trim(),
    });
  }, [appliedSearchTerm, selectedCategory, startYear, endYear, authorFilter, setBrowseFilters]);

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
  }, [appliedSearchTerm, selectedCategory, startYear, endYear, authorFilter]);

  // Abort in-flight requests when filters/pagination change.
  useEffect(() => {
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
          tncCategory: selectedCategory === 'all' ? undefined : selectedCategory,
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
  }, [appliedSearchTerm, selectedCategory, startYear, endYear, authorFilter, page, createBrowseLoadingScope]);

  // Map marker clicks set activeLayer.featureId. Ensure detail opens even when
  // the clicked dataset is not in the current paginated result set.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets' || !activeLayer.featureId) return;
    const featureId = String(activeLayer.featureId);
    if (lastHandledFeatureIdRef.current === featureId) return;
    if (selectedDataset?.dataoneId === featureId) return;
    lastHandledFeatureIdRef.current = featureId;

    let cancelled = false;
    void dataOneService.getDatasetByDataoneId(featureId)
      .then((dataset) => {
        if (!cancelled && dataset) setSelectedDataset(dataset);
      })
      .catch(() => {
        // Map behavior already logs marker click issues; no duplicate UI noise here.
      });
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
    setSelectedCategory(sourceFilters.tncCategory || 'all');
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
        tncCategory: selectedCategory === 'all' ? undefined : selectedCategory,
        startDate: toStartDate(startYear),
        endDate: toEndDate(endYear),
        author: authorFilter.trim() || undefined,
        selectedDatasetId: selectedDataset?.dataoneId,
        selectedDatasetTitle: selectedDataset?.title,
      },
      totalCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    appliedSearchTerm,
    selectedCategory,
    startYear,
    endYear,
    authorFilter,
    selectedDataset?.dataoneId,
    selectedDataset?.title,
    totalCount,
    getPinnedByLayerId,
    syncDataOneFilters,
  ]);

  const handleSaveDatasetView = (dataset: DataOneDataset): string => {
    if (activeLayer?.layerId !== 'dataone-datasets') {
      return 'Unable to save view: DataONE layer is not active.';
    }

    const savedViewId = createOrUpdateDataOneFilteredView(
      activeLayer.layerId,
      {
        selectedDatasetId: dataset.dataoneId,
        selectedDatasetTitle: dataset.title,
      },
      1
    );

    if (!savedViewId) {
      return 'Unable to save view in Map Layers.';
    }

    activateLayer(activeLayer.layerId, savedViewId, dataset.dataoneId);
    return 'Saved as a new dataset child view in Map Layers.';
  };

  if (selectedDataset) {
    return (
      <DatasetDetailView
        dataset={selectedDataset}
        onSaveDatasetView={handleSaveDatasetView}
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
    appliedSearchTerm || selectedCategory !== 'all' || startYear || endYear || authorFilter.trim()
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setAppliedSearchTerm('');
    setSelectedCategory('all');
    setStartYear('');
    setEndYear('');
    setAuthorFilter('');
    setPage(0);
  };

  return (
    <div id="dataone-browse-tab" className="space-y-3">
      <div id="dataone-browse-live-region" className="sr-only" aria-live="polite">
        Showing {datasets.length} of {totalCount} datasets.
      </div>

      <div id="dataone-filter-panel" className="rounded-lg bg-slate-50 p-3 space-y-3">
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
            placeholder="Search datasets by title..."
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

        <div id="dataone-filter-grid" className="grid grid-cols-2 gap-2">
          <select
            id="dataone-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          >
            <option id="dataone-category-filter-option-all" value="all">All Categories</option>
            {TNC_CATEGORY_OPTIONS.map((category) => (
              <option id={`dataone-category-filter-option-${category}`} key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

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
      </div>

      {showInitialLoading && (
        <InlineLoadingRow id="dataone-initial-loading" message="Loading datasets..." />
      )}

      {showRefreshLoading && (
        <RefreshLoadingRow id="dataone-refresh-loading" message="Refreshing datasets..." />
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
          onViewDetail={(dataset) => {
            lastHandledFeatureIdRef.current = dataset.dataoneId;
            setSelectedDataset(dataset);
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
