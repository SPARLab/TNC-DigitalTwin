// ============================================================================
// AnimlBrowseTab — Multi-dimensional camera trap filter + image browser
// Iteration 2: Expandable filter sections (Species, Cameras) replace the
// sequential drill-down. Researchers can select multiple species AND cameras
// to build complex queries. Result count updates instantly from countLookups;
// images load via debounced API call.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PawPrint, Camera, Loader2, AlertCircle, X } from 'lucide-react';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { animlService, type AnimlImageLabel } from '../../../../services/animlService';
import { FilterSection, type FilterSectionItem } from './FilterSection';
import { ImageList } from './ImageList';

const PAGE_SIZE = 20;
const FETCH_DEBOUNCE_MS = 300;

export function AnimlBrowseTab() {
  const {
    deployments, animalTags, loading, error, dataLoaded,
    selectedAnimals, selectedCameras,
    toggleAnimal, toggleCamera,
    selectAll, selectAllAnimals, clearCameras, selectAllCameras, clearFilters,
    hasFilter, hasCameraFilter, hasAnyFilter,
    getFilteredCountForSpecies, getFilteredCountForDeployment,
    filteredImageCount,
  } = useAnimlFilter();

  // Image fetch state (local to browse tab)
  const [images, setImages] = useState<AnimlImageLabel[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  // ── Build filter section items ──────────────────────────────────────────

  /** Species items: sorted by global count descending (stable order). */
  const speciesItems: FilterSectionItem[] = useMemo(
    () => [...animalTags]
      .filter(t => t.totalObservations > 0)
      .sort((a, b) => b.totalObservations - a.totalObservations)
      .map(t => ({
        key: t.label,
        label: t.label,
        count: getFilteredCountForSpecies(t.label) ?? t.totalObservations,
      })),
    [animalTags, getFilteredCountForSpecies],
  );

  /** Camera items: sorted alphabetically by name (stable order). */
  const cameraItems: FilterSectionItem[] = useMemo(
    () => [...deployments]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => ({
        key: String(d.id),
        label: d.name,
        count: getFilteredCountForDeployment(d.id) ?? d.totalObservations ?? 0,
      })),
    [deployments, getFilteredCountForDeployment],
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
          maxResults: 200,
        });

        if (cancelled) return;
        setImages(imgs);
        setDisplayCount(PAGE_SIZE);
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
  }, [selectedAnimals, selectedCameras, hasAnyFilter, hasFilter, hasCameraFilter, dataLoaded]);

  // ── Pagination ──────────────────────────────────────────────────────────

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, images.length));
      setLoadingMore(false);
    }, 150);
  }, [images.length]);

  const visibleImages = images.slice(0, displayCount);
  const hasMore = displayCount < images.length;

  // ── Loading / Error ─────────────────────────────────────────────────────

  if (loading || !dataLoaded) {
    return (
      <div id="animl-browse-loading" className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading camera trap data...</span>
      </div>
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

  const countText = filteredImageCount !== null
    ? filteredImageCount.toLocaleString()
    : '—';

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div id="animl-browse-tab" className="space-y-3">
      {/* Species filter section — expanded by default */}
      <FilterSection
        id="animl-filter-species"
        label="Species"
        icon={<PawPrint className="w-4 h-4" />}
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

      {/* Prompt when no filter */}
      {!hasAnyFilter && (
        <p id="animl-browse-prompt" className="text-sm text-gray-400 text-center py-6">
          Select species or cameras above to browse images.
        </p>
      )}

      {/* Image loading spinner */}
      {hasAnyFilter && imgLoading && (
        <div id="animl-browse-img-loading" className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading images...</span>
        </div>
      )}

      {/* Image fetch error */}
      {hasAnyFilter && imgError && (
        <div id="animl-browse-img-error" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {imgError}
        </div>
      )}

      {/* Image list with pagination */}
      {hasAnyFilter && !imgLoading && !imgError && (
        <ImageList
          images={visibleImages}
          totalCount={images.length}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          showCameraName
        />
      )}
    </div>
  );
}
