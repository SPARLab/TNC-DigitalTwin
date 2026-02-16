// ============================================================================
// AnimlBrowseTab — Multi-dimensional camera trap filter + image browser
// Iteration 2: Expandable filter sections (Date Range, Species, Cameras)
// replace the sequential drill-down. Researchers can select date ranges,
// multiple species, AND cameras to build complex queries like "mountain lions
// at cameras A,B,C in summer 2023." Result count updates instantly from
// countLookups; images load via debounced API call with date params.
// ============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PawPrint, Camera, AlertCircle, X } from 'lucide-react';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { animlService, type AnimlImageLabel } from '../../../../services/animlService';
import { FilterSection, type FilterSectionItem } from './FilterSection';
import { DateFilterSection } from './DateFilterSection';
import { ImageList } from './ImageList';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';

const PAGE_SIZE = 20;
const FETCH_DEBOUNCE_MS = 300;

export function AnimlBrowseTab() {
  const {
    deployments, animalTags, loading, error, dataLoaded,
    selectedAnimals, selectedCameras, startDate, endDate,
    toggleAnimal, setSelectedAnimals, toggleCamera, setSelectedCameras,
    selectAll, selectAllAnimals, clearCameras, selectAllCameras,
    setDateRange, clearDateRange, clearFilters,
    hasFilter, hasCameraFilter, hasDateFilter, hasAnyFilter,
    getFilteredCountForSpecies, getFilteredCountForDeployment, totalImageCount,
    filteredImageCount, focusDeployment, clearFocusedDeployment, countLookups,
  } = useAnimlFilter();
  const { activeLayer, lastEditFiltersRequest, getPinnedByLayerId, syncAnimlFilters } = useLayers();

  // Image fetch state (local to browse tab)
  const [images, setImages] = useState<AnimlImageLabel[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Hydrate Browse filters (ONE-SHOT, not continuous) ───────────────────
  const lastConsumedHydrateRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  useEffect(() => {
    if (activeLayer?.layerId !== 'animl-camera-traps') return;

    const viewChanged = activeLayer.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    prevHydrateViewIdRef.current = activeLayer.viewId;

    if (!viewChanged && !editRequested) return;
    if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;

    const pinned = getPinnedByLayerId(activeLayer.layerId);
    if (!pinned) return;

    const sourceFilters = activeLayer.viewId && pinned.views
      ? pinned.views.find(v => v.id === activeLayer.viewId)?.animlFilters
      : pinned.animlFilters;
    if (!sourceFilters) return;

    setSelectedAnimals(new Set(sourceFilters.selectedAnimals));
    setSelectedCameras(new Set(sourceFilters.selectedCameras));
    setDateRange(sourceFilters.startDate || null, sourceFilters.endDate || null);
  }, [activeLayer?.layerId, activeLayer?.viewId, lastEditFiltersRequest, getPinnedByLayerId, setSelectedAnimals, setSelectedCameras, setDateRange]);

  // ── Build filter section items ──────────────────────────────────────────

  /** Species items: sorted by global count descending (stable order). */
  const speciesItems: FilterSectionItem[] = useMemo(
    () => [...animalTags]
      .filter(t => t.totalObservations > 0)
      .sort((a, b) => b.totalObservations - a.totalObservations)
      .map(t => ({
        key: t.label,
        label: t.label,
        count: getFilteredCountForSpecies(t.label) ?? (hasDateFilter ? null : t.totalObservations),
      })),
    [animalTags, getFilteredCountForSpecies, hasDateFilter],
  );

  /** Camera items: sorted alphabetically by name (stable order). */
  const cameraItems: FilterSectionItem[] = useMemo(
    () => [...deployments]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => ({
        key: String(d.id),
        label: d.name,
        count: getFilteredCountForDeployment(d.id) ?? (hasDateFilter ? null : d.totalObservations ?? 0),
      })),
    [deployments, getFilteredCountForDeployment, hasDateFilter],
  );

  /** Adapt selectedCameras Set<number> → Set<string> for FilterSection. */
  const selectedCameraKeys = useMemo(
    () => new Set([...selectedCameras].map(String)),
    [selectedCameras],
  );

  // ── Debounced image fetch ───────────────────────────────────────────────

  useEffect(() => {
    if (!hasAnyFilter || !dataLoaded) {
      setImages([]);
      setImgLoading(false);
      setImgError(null);
      clearFocusedDeployment();
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setImgLoading(true);
      setImgError(null);

      try {
        const labels = hasFilter ? [...selectedAnimals] : undefined;
        const deploymentIds = hasCameraFilter ? [...selectedCameras] : undefined;

        const imgs = await animlService.queryImageLabelsCached({
          labels,
          deploymentIds,
          startDate: hasDateFilter ? startDate! : undefined,
          endDate: hasDateFilter ? endDate! : undefined,
          maxResults: 200,
        });

        if (cancelled) return;
        setImages(imgs);
        setCurrentPage(1);
      } catch (err) {
        if (cancelled) return;
        setImgError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        if (!cancelled) setImgLoading(false);
      }
    }, FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedAnimals, selectedCameras, startDate, endDate, hasAnyFilter, hasFilter, hasCameraFilter, hasDateFilter, dataLoaded, clearFocusedDeployment]);

  // ── Pagination ──────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(images.length / PAGE_SIZE));
  const visibleImages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return images.slice(start, start + PAGE_SIZE);
  }, [images, currentPage]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  // Keep Map Layers widget metadata in sync with the active ANiML view.
  useEffect(() => {
    if (activeLayer?.layerId !== 'animl-camera-traps') return;

    const resultCount = hasAnyFilter
      ? images.length
      : totalImageCount;

    syncAnimlFilters(
      activeLayer.layerId,
      {
        selectedAnimals: Array.from(selectedAnimals).sort((a, b) => a.localeCompare(b)),
        selectedCameras: Array.from(selectedCameras).sort((a, b) => a - b),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      resultCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    images.length,
    totalImageCount,
    selectedAnimals,
    selectedCameras,
    startDate,
    endDate,
    hasAnyFilter,
    countLookups,
    syncAnimlFilters,
  ]);

  // ── Loading / Error ─────────────────────────────────────────────────────

  if (loading || !dataLoaded) {
    return (
      <InlineLoadingRow
        id="animl-browse-loading"
        message="Loading camera trap data..."
        containerClassName="flex items-center justify-center py-12 text-gray-400"
      />
    );
  }

  if (error) {
    return (
      <div id="animl-browse-error" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  // ── Result count text ───────────────────────────────────────────────────
  // Once images are fetched, use actual count (accurate for date-filtered queries).
  // Fall back to countLookups estimate while loading or before fetch.

  const imagesFetched = hasAnyFilter && !imgLoading && !imgError;
  const countText = imagesFetched
    ? images.length.toLocaleString()
    : (filteredImageCount !== null ? filteredImageCount.toLocaleString() : '—');

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div id="animl-browse-tab" className="h-full min-h-0 flex flex-col gap-3">
      {/* Date range filter — above species and cameras */}
      <DateFilterSection
        id="animl-filter-date"
        startDate={startDate}
        endDate={endDate}
        onDateChange={setDateRange}
        onClear={clearDateRange}
      />

      {/* Species filter section — expanded by default */}
      <FilterSection
        id="animl-filter-species"
        label="Species"
        icon={<PawPrint className="w-4 h-4" />}
        itemIcon={<PawPrint className="w-3.5 h-3.5" />}
        items={speciesItems}
        selectedKeys={selectedAnimals}
        onToggle={toggleAnimal}
        onSelectAll={selectAllAnimals}
        onClear={selectAll}
        defaultExpanded
        searchPlaceholder="Search species..."
      />

      {/* Camera filter section — collapsed by default */}
      <FilterSection
        id="animl-filter-cameras"
        label="Cameras"
        icon={<Camera className="w-4 h-4" />}
        itemIcon={<Camera className="w-3.5 h-3.5" />}
        items={cameraItems}
        selectedKeys={selectedCameraKeys}
        onToggle={(key) => toggleCamera(Number(key))}
        onSelectAll={selectAllCameras}
        onClear={clearCameras}
        searchPlaceholder="Search cameras..."
      />

      {/* Result count bar */}
      <div id="animl-result-count" className="flex items-center justify-between py-2 px-1">
        <span className="text-sm font-medium text-gray-700">
          {hasAnyFilter ? (
            <>
              <span className="text-emerald-600 tabular-nums">{countText}</span>
              {' '}matching images
            </>
          ) : (
            <>
              <span className="tabular-nums">{countText}</span>
              {' '}total images
            </>
          )}
        </span>

        {hasAnyFilter && (
          <button
            id="animl-clear-all-filters"
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500
                       hover:text-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      <div id="animl-browse-results-region" className="flex-1 min-h-0 flex flex-col">
        {/* Prompt when no filter */}
        {!hasAnyFilter && (
          <p id="animl-browse-prompt" className="text-sm text-gray-400 text-center py-6">
            Select a date range, species, or cameras above to browse images.
          </p>
        )}

        {/* Image loading spinner */}
        {hasAnyFilter && imgLoading && (
          <InlineLoadingRow id="animl-browse-img-loading" message="Loading images..." />
        )}

        {/* Image fetch error */}
        {hasAnyFilter && imgError && (
          <div id="animl-browse-img-error" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {imgError}
          </div>
        )}

        {/* Image list with pagination */}
        {hasAnyFilter && !imgLoading && !imgError && (
          <div id="animl-browse-image-list-wrapper" className="flex-1 min-h-0">
            <ImageList
              images={visibleImages}
              totalCount={images.length}
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalPages={totalPages}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              expandToFill
              showCameraName
              onImageFocus={(image) => focusDeployment(image.deployment_id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
