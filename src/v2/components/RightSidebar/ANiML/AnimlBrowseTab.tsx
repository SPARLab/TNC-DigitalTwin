// ============================================================================
// AnimlBrowseTab — Multi-dimensional camera trap filter + image browser
// Iteration 2: Expandable filter sections (Date Range, Species, Cameras)
// replace the sequential drill-down. Researchers can select date ranges,
// multiple species, AND cameras to build complex queries like "mountain lions
// at cameras A,B,C in summer 2023." Result count updates instantly from
// countLookups; images load via debounced API call with date params.
// ============================================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PawPrint, Camera, AlertCircle, RotateCcw, X } from 'lucide-react';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { useLayers } from '../../../context/LayerContext';
import { useMap } from '../../../context/MapContext';
import { animlService, type AnimlImageLabel } from '../../../../services/animlService';
import { FilterSection, type FilterSectionItem } from './FilterSection';
import { DateFilterSection } from './DateFilterSection';
import { ImageList } from './ImageList';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { SpatialQuerySection } from '../shared/SpatialQuerySection';
import { EditFiltersCard } from '../shared/EditFiltersCard';
import { isPointInsideSpatialPolygon } from '../../../utils/spatialQuery';

const PAGE_SIZE = 20;
const FETCH_DEBOUNCE_MS = 300;
const AUTO_RETRY_DELAYS_MS = [500, 1200];
const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 504]);
type SpeciesSortMode = 'count' | 'alpha';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load images';
}

function getHttpStatusFromMessage(message: string): number | null {
  const statusMatch = message.match(/\b(4\d{2}|5\d{2})\b/);
  if (!statusMatch) return null;
  return Number(statusMatch[1]);
}

function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const status = getHttpStatusFromMessage(message);
  return status !== null && RETRYABLE_STATUS_CODES.has(status);
}

export function AnimlBrowseTab() {
  const {
    deployments, animalTags, loading, error, dataLoaded,
    countsLoading,
    selectedAnimals, selectedCameras, startDate, endDate,
    toggleAnimal, setSelectedAnimals, toggleCamera, setSelectedCameras,
    selectAll, selectAllAnimals, clearCameras, selectAllCameras,
    setDateRange, clearDateRange, clearFilters,
    hasFilter, hasCameraFilter, hasDateFilter, hasAnyFilter,
    getFilteredCountForSpecies, getFilteredCountForDeployment,
    filteredImageCount, focusDeployment, clearFocusedDeployment,
  } = useAnimlFilter();
  const { activeLayer, lastEditFiltersRequest, getPinnedByLayerId, syncAnimlFilters } = useLayers();
  const { getSpatialPolygonForLayer } = useMap();

  // Image fetch state (local to browse tab)
  const [images, setImages] = useState<AnimlImageLabel[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [speciesSortMode, setSpeciesSortMode] = useState<SpeciesSortMode>('count');
  const [manualRetryNonce, setManualRetryNonce] = useState(0);

  // ── Hydrate Browse filters (ONE-SHOT, not continuous) ───────────────────
  const lastConsumedHydrateRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);
  const lastHandledMapFeatureIdRef = useRef<string | null>(null);
  const prevHasCameraFilterRef = useRef(hasCameraFilter);
  const lastAppliedSpatialPolygonIdRef = useRef<string | null>(null);

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

  // Map-click flow: selecting a camera marker sets Browse to that camera and
  // immediately triggers image loading for map-first interaction.
  useEffect(() => {
    if (activeLayer?.layerId !== 'animl-camera-traps') return;
    if (activeLayer.featureId == null) {
      lastHandledMapFeatureIdRef.current = null;
      return;
    }

    const featureKey = String(activeLayer.featureId);
    if (lastHandledMapFeatureIdRef.current === featureKey) return;

    const deploymentId = Number(activeLayer.featureId);
    if (!Number.isFinite(deploymentId)) return;

    lastHandledMapFeatureIdRef.current = featureKey;
    setSelectedCameras(new Set([deploymentId]));
    focusDeployment(deploymentId);
  }, [activeLayer?.layerId, activeLayer?.featureId, setSelectedCameras, focusDeployment]);

  // ── Build filter section items ──────────────────────────────────────────

  const spatialPolygon = getSpatialPolygonForLayer('animl-camera-traps');
  const hasSpatialPolygon = !!spatialPolygon;

  const camerasInsideSpatialPolygon = useMemo(() => {
    if (!spatialPolygon) return new Set<number>();

    const inside = new Set<number>();
    for (const deployment of deployments) {
      const coordinates = deployment.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) continue;
      const [longitude, latitude] = coordinates;
      if (isPointInsideSpatialPolygon(spatialPolygon, longitude, latitude)) {
        inside.add(deployment.id);
      }
    }
    return inside;
  }, [deployments, spatialPolygon]);

  // Auto-switch to count sort when camera filtering becomes active.
  useEffect(() => {
    if (hasCameraFilter && !prevHasCameraFilterRef.current) {
      setSpeciesSortMode('count');
    }
    prevHasCameraFilterRef.current = hasCameraFilter;
  }, [hasCameraFilter]);

  // Spatial-query flow: when a new polygon is applied for ANiML, auto-select all
  // cameras inside that polygon so camera filters mirror map context.
  useEffect(() => {
    if (!hasSpatialPolygon || !spatialPolygon) {
      lastAppliedSpatialPolygonIdRef.current = null;
      return;
    }

    if (lastAppliedSpatialPolygonIdRef.current === spatialPolygon.id) return;
    lastAppliedSpatialPolygonIdRef.current = spatialPolygon.id;
    setSelectedCameras(new Set(camerasInsideSpatialPolygon));
  }, [hasSpatialPolygon, spatialPolygon, camerasInsideSpatialPolygon, setSelectedCameras]);

  /** Species items: user-toggleable sorting (count or alphabetical). */
  const speciesItems: FilterSectionItem[] = useMemo(
    () => [...animalTags]
      .filter(t => t.totalObservations > 0)
      .map(t => ({
        key: t.label,
        label: t.label,
        count: getFilteredCountForSpecies(t.label) ?? (hasDateFilter ? null : t.totalObservations),
      }))
      .sort((a, b) => {
        if (speciesSortMode === 'alpha') {
          return a.label.localeCompare(b.label);
        }
        const countA = a.count ?? -1;
        const countB = b.count ?? -1;
        if (countA !== countB) return countB - countA;
        return a.label.localeCompare(b.label);
      }),
    [animalTags, getFilteredCountForSpecies, hasDateFilter, speciesSortMode],
  );

  /** Camera items: when spatial query is active, prioritize in-polygon cameras. */
  const cameraItems: FilterSectionItem[] = useMemo(
    () => [...deployments]
      .map(d => ({
        key: String(d.id),
        label: d.name,
        count: getFilteredCountForDeployment(d.id) ?? (hasDateFilter ? null : d.totalObservations ?? 0),
      }))
      .sort((a, b) => {
        // Always sink zero/unknown-result cameras so data-rich cameras stay first.
        const aCount = a.count ?? -1;
        const bCount = b.count ?? -1;
        const aHasData = aCount > 0;
        const bHasData = bCount > 0;
        if (aHasData !== bHasData) return aHasData ? -1 : 1;

        if (hasSpatialPolygon) {
          const aId = Number(a.key);
          const bId = Number(b.key);
          const aInside = camerasInsideSpatialPolygon.has(aId);
          const bInside = camerasInsideSpatialPolygon.has(bId);
          if (aInside !== bInside) return aInside ? -1 : 1;
        }

        if (aCount !== bCount) return bCount - aCount;
        return a.label.localeCompare(b.label);
      }),
    [deployments, getFilteredCountForDeployment, hasDateFilter, hasSpatialPolygon, camerasInsideSpatialPolygon],
  );

  /** Adapt selectedCameras Set<number> → Set<string> for FilterSection. */
  const selectedCameraKeys = useMemo(
    () => new Set([...selectedCameras].map(String)),
    [selectedCameras],
  );
  const outOfPolygonCameraKeys = useMemo(() => {
    if (!hasSpatialPolygon) return new Set<string>();
    return new Set(
      deployments
        .filter((deployment) => !camerasInsideSpatialPolygon.has(deployment.id))
        .map((deployment) => String(deployment.id))
    );
  }, [hasSpatialPolygon, deployments, camerasInsideSpatialPolygon]);
  const visibleCameraCount = hasSpatialPolygon ? camerasInsideSpatialPolygon.size : deployments.length;
  const hiddenCameraCount = Math.max(0, deployments.length - visibleCameraCount);
  const cameraContextNote = hasSpatialPolygon
    ? `${visibleCameraCount.toLocaleString()} visible, ${hiddenCameraCount.toLocaleString()} hidden outside polygon`
    : undefined;
  const cameraHeaderBadge = hasSpatialPolygon ? (
    <span
      id="animl-camera-header-badge-spatial"
      className="flex items-center gap-1 text-[11px] tabular-nums"
    >
      <span className="bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">
        {visibleCameraCount} visible
      </span>
      <span className="text-gray-300 select-none">|</span>
      <span className="text-gray-400 font-medium">{hiddenCameraCount} hidden</span>
    </span>
  ) : undefined;

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
        const requestOptions = {
          labels,
          deploymentIds,
          startDate: hasDateFilter ? startDate! : undefined,
          endDate: hasDateFilter ? endDate! : undefined,
          maxResults: 200,
        };

        let lastError: unknown = null;
        for (let attempt = 0; attempt <= AUTO_RETRY_DELAYS_MS.length; attempt += 1) {
          try {
            const imgs = await animlService.queryImageLabelsCached(requestOptions);
            if (cancelled) return;
            setImages(imgs);
            setCurrentPage(1);
            setImgError(null);
            return;
          } catch (error) {
            lastError = error;
            const canAutoRetry = attempt < AUTO_RETRY_DELAYS_MS.length && isRetryableError(error);
            if (!canAutoRetry) break;
            await new Promise((resolve) => setTimeout(resolve, AUTO_RETRY_DELAYS_MS[attempt]));
            if (cancelled) return;
          }
        }

        if (cancelled) return;
        const errorMessage = getErrorMessage(lastError);
        const retryHint = isRetryableError(lastError)
          ? ' Automatic retries failed. Please try again.'
          : '';
        setImgError(`${errorMessage}${retryHint}`);
      } finally {
        if (!cancelled) setImgLoading(false);
      }
    }, FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedAnimals, selectedCameras, startDate, endDate, hasAnyFilter, hasFilter, hasCameraFilter, hasDateFilter, dataLoaded, clearFocusedDeployment, manualRetryNonce]);

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

  const resolvedResultCount = filteredImageCount ?? 0;

  // Keep Map Layers widget metadata in sync with the active ANiML view.
  useEffect(() => {
    if (activeLayer?.layerId !== 'animl-camera-traps') return;

    syncAnimlFilters(
      activeLayer.layerId,
      {
        selectedAnimals: Array.from(selectedAnimals).sort((a, b) => a.localeCompare(b)),
        selectedCameras: Array.from(selectedCameras).sort((a, b) => a - b),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      resolvedResultCount,
      activeLayer.viewId
    );
  }, [
    activeLayer?.layerId,
    activeLayer?.viewId,
    activeLayer?.isPinned,
    selectedAnimals,
    selectedCameras,
    startDate,
    endDate,
    resolvedResultCount,
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
  // Use the shared lookup-based count so map badges, layer badges, and browse
  // count stay in sync even when image fetches are capped for rendering.
  const countText = filteredImageCount !== null ? filteredImageCount.toLocaleString() : '—';

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div id="animl-browse-tab" className="h-full min-h-0 flex flex-col gap-3">
      <EditFiltersCard id="animl-edit-filters-card">
        {/* Date range filter — above species and cameras */}
        <DateFilterSection
          id="animl-filter-date"
          startDate={startDate}
          endDate={endDate}
          onDateChange={setDateRange}
          onClear={clearDateRange}
        />

        <SpatialQuerySection id="animl-spatial-query-section" layerId="animl-camera-traps" />

        {/* Species filter section — expanded by default */}
        <FilterSection
          id="animl-filter-species"
          label="Species"
          icon={<PawPrint className="w-4 h-4" />}
          itemIcon={<PawPrint className="w-3.5 h-3.5" />}
          items={speciesItems}
          selectedKeys={selectedAnimals}
          isCountLoading={countsLoading}
          onToggle={toggleAnimal}
          onSelectAll={selectAllAnimals}
          onClear={selectAll}
          defaultExpanded
          searchPlaceholder="Search species..."
          actionsSlot={(
            <div id="animl-species-sort-toggle" className="inline-flex rounded-md border border-gray-200 bg-white">
              <button
                id="animl-species-sort-by-count"
                type="button"
                onClick={(e) => { e.stopPropagation(); setSpeciesSortMode('count'); }}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  speciesSortMode === 'count'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                By Count
              </button>
              <button
                id="animl-species-sort-alpha"
                type="button"
                onClick={(e) => { e.stopPropagation(); setSpeciesSortMode('alpha'); }}
                className={`border-l border-gray-200 px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  speciesSortMode === 'alpha'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                A-Z
              </button>
            </div>
          )}
        />

        {/* Camera filter section — collapsed by default */}
        <FilterSection
          id="animl-filter-cameras"
          label="Cameras"
          icon={<Camera className="w-4 h-4" />}
          itemIcon={<Camera className="w-3.5 h-3.5" />}
          items={cameraItems}
          selectedKeys={selectedCameraKeys}
          isCountLoading={countsLoading}
          mutedKeys={outOfPolygonCameraKeys}
          contextNote={cameraContextNote}
          headerBadge={cameraHeaderBadge}
          onToggle={(key) => toggleCamera(Number(key))}
          onSelectAll={selectAllCameras}
          onClear={clearCameras}
          searchPlaceholder="Search cameras..."
        />
      </EditFiltersCard>

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
          <div id="animl-browse-img-error" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 space-y-2">
            <p id="animl-browse-img-error-text">{imgError}</p>
            <button
              id="animl-browse-img-error-retry-button"
              type="button"
              onClick={() => setManualRetryNonce((value) => value + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
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
