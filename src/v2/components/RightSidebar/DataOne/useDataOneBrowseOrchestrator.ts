import { useEffect, useMemo, useRef, useState } from 'react';
import { dataOneService, type DataOneDataset } from '../../../../services/dataOneService';
import { useDataOneFilter } from '../../../context/DataOneFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { useBrowseSearchInput } from '../shared/useBrowseSearchInput';
import { closeBrowseDetail, openBrowseDetail } from '../shared/browseDetailHandoff';

const PAGE_SIZE = 20;
export const MIN_SEARCH_CHARS = 2;

export const TNC_CATEGORY_OPTIONS = [
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

export const FILE_TYPE_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'tif', label: 'TIF' },
  { value: 'imagery', label: 'Imagery' },
  { value: 'other', label: 'Other' },
] as const;

export type DataOneFileType = (typeof FILE_TYPE_OPTIONS)[number]['value'];

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

function normalizeFileTypes(fileTypes?: DataOneFileType[]): DataOneFileType[] {
  if (!fileTypes || fileTypes.length === 0) return [];
  const allowed = new Set(['csv', 'tif', 'imagery', 'other'] as const);
  const seen = new Set<DataOneFileType>();
  for (const fileType of fileTypes) {
    if (allowed.has(fileType)) seen.add(fileType);
  }
  return Array.from(seen);
}

function toStartDate(year: string): string | undefined {
  return year ? `${year}-01-01` : undefined;
}

function toEndDate(year: string): string | undefined {
  return year ? `${year}-12-31` : undefined;
}

export function useDataOneBrowseOrchestrator() {
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
  const {
    searchInput,
    appliedSearchTerm,
    setSearchInput,
    setAppliedSearchTerm,
    runSearchNow: applySearchImmediately,
    clearSearch,
  } = useBrowseSearchInput({
    initialSearchTerm: browseFilters.searchText,
    minSearchChars: MIN_SEARCH_CHARS,
    debounceMs: 500,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    normalizeCategories(browseFilters.tncCategories),
  );
  const [selectedFileTypes, setSelectedFileTypes] = useState<DataOneFileType[]>(
    normalizeFileTypes(browseFilters.fileTypes as DataOneFileType[] | undefined),
  );
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
    [currentYear],
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
  }, [
    appliedSearchTerm,
    selectedCategories,
    selectedFileTypes,
    startYear,
    endYear,
    authorFilter,
    setBrowseFilters,
  ]);

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
    matched.sort((a, b) => (b.dateUploaded?.getTime() ?? 0) - (a.dateUploaded?.getTime() ?? 0));

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
  }, [
    mapSelectionIdSet,
    appliedSearchTerm,
    selectedCategories,
    selectedFileTypes,
    startYear,
    endYear,
    authorFilter,
    page,
    createBrowseLoadingScope,
  ]);

  // When featureId is cleared (cluster click, back navigation), return to list view.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets') return;
    if (activeLayer.featureId != null) return;
    setSelectedDataset(null);
    lastHandledFeatureIdRef.current = null;
  }, [activeLayer?.layerId, activeLayer?.featureId]);

  // Map marker clicks set activeLayer.featureId. Ensure detail opens even when
  // the clicked dataset is not in the current paginated result set.
  useEffect(() => {
    if (activeLayer?.layerId !== 'dataone-datasets' || !activeLayer.featureId) return;
    const featureId = String(activeLayer.featureId);
    if (lastHandledFeatureIdRef.current === featureId) return;
    if (selectedDataset?.dataoneId === featureId) return;

    let cancelled = false;
    void dataOneService
      .getDatasetByDataoneId(featureId)
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

    const sourceFilters =
      activeLayer.viewId && pinned.views
        ? pinned.views.find((v) => v.id === activeLayer.viewId)?.dataoneFilters
        : pinned.dataoneFilters;
    if (!sourceFilters) return;

    const nextSearch = sourceFilters.searchText || '';
    setSearchInput(nextSearch);
    setAppliedSearchTerm(nextSearch);
    setSelectedCategories(
      normalizeCategories(
        sourceFilters.tncCategories || (sourceFilters.tncCategory ? [sourceFilters.tncCategory] : []),
      ),
    );
    setSelectedFileTypes(normalizeFileTypes(sourceFilters.fileTypes as DataOneFileType[] | undefined));
    setStartYear(sourceFilters.startDate?.slice(0, 4) || '');
    setEndYear(sourceFilters.endDate?.slice(0, 4) || '');
    setAuthorFilter(sourceFilters.author || '');
    setPage(0);

    if (sourceFilters.selectedDatasetId) {
      void dataOneService
        .getDatasetByDataoneId(sourceFilters.selectedDatasetId)
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
    const activeView =
      activeLayer.viewId && pinned?.views
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
      activeLayer.viewId,
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
    return pinned?.views?.find((v) => v.id === activeLayer.viewId)?.dataoneFilters?.selectedDatasetId;
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

  const hasStaleResults = datasets.length > 0;
  const showInitialLoading = loading && !hasStaleResults;
  const showRefreshLoading = loading && hasStaleResults;

  const hasAnyFilter = Boolean(
    appliedSearchTerm ||
      selectedCategories.length > 0 ||
      selectedFileTypes.length > 0 ||
      startYear ||
      endYear ||
      authorFilter.trim() ||
      mapSelectionDataoneIds?.length,
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

  const runSearchNow = () => {
    applySearchImmediately();
    setPage(0);
  };

  const selectAllCategories = () => {
    setSelectedCategories([...TNC_CATEGORY_OPTIONS]);
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category];
      return normalizeCategories(next);
    });
  };

  const selectAllFileTypes = () => {
    setSelectedFileTypes(FILE_TYPE_OPTIONS.map((option) => option.value));
  };

  const clearFileTypes = () => {
    setSelectedFileTypes([]);
  };

  const toggleFileType = (fileType: DataOneFileType) => {
    setSelectedFileTypes((prev) => {
      const next = prev.includes(fileType)
        ? prev.filter((item) => item !== fileType)
        : [...prev, fileType];
      return normalizeFileTypes(next);
    });
  };

  // Single point for list -> detail activation keeps map+sidebar sync consistent.
  const openDatasetDetail = (dataset: DataOneDataset) => {
    openBrowseDetail({
      item: dataset,
      activeLayer,
      activateLayer,
      setSelectedItem: setSelectedDataset,
      getItemFeatureId: (item) => item.dataoneId,
      layerId: 'dataone-datasets',
      lastHandledFeatureIdRef,
    });
  };

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
      targetViewId,
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
      activeLayer.viewId,
    );

    activateLayer(activeLayer.layerId, activeLayer.viewId, selectedDataset.dataoneId);
  };

  const closeDatasetDetail = () => {
    closeBrowseDetail({
      activeLayer,
      activateLayer,
      setSelectedItem: setSelectedDataset,
      layerId: 'dataone-datasets',
      lastHandledFeatureIdRef,
      clearLastHandledFeatureId: true,
    });
  };

  const selectDatasetVersion = (versionDataset: DataOneDataset) => {
    openBrowseDetail({
      item: versionDataset,
      activeLayer,
      activateLayer,
      setSelectedItem: setSelectedDataset,
      getItemFeatureId: (item) => item.dataoneId,
      layerId: 'dataone-datasets',
      lastHandledFeatureIdRef,
    });
  };

  const applyKeywordSearch = (keyword: string) => {
    setSelectedDataset(null);
    setSearchInput(keyword);
    setAppliedSearchTerm(keyword.trim().length >= MIN_SEARCH_CHARS ? keyword.trim() : '');
    setPage(0);
  };

  return {
    activeLayer,
    aggregationMode,
    applyKeywordSearch,
    authorFilter,
    clearAllFilters,
    clearCategories,
    clearFileTypes,
    clearSearch,
    closeDatasetDetail,
    currentViewSavedDatasetId,
    datasets,
    endYear,
    error,
    hasAnyFilter,
    loading,
    mapLoading,
    mapSelectionDataoneIds,
    openDatasetDetail,
    page,
    runSearchNow,
    savedDataoneIds,
    searchInput,
    selectedCategories,
    selectedDataset,
    selectedFileTypes,
    selectAllCategories,
    selectAllFileTypes,
    selectDatasetVersion,
    setAggregationMode,
    setAuthorFilter,
    setEndYear,
    setMapSelectionDataoneIds,
    setPage,
    setSearchInput,
    setStartYear,
    showInitialLoading,
    showRefreshLoading,
    startYear,
    toggleCategory,
    toggleFileType,
    totalCount,
    totalPages,
    yearOptions,
    handleSaveDatasetView,
    handleUnsaveDatasetView,
  };
}
