import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { motusService, type MotusTaggedAnimalSummary } from '../../../../services/motusService';
import { useLayers } from '../../../context/LayerContext';
import { useMotusFilter } from '../../../context/MotusFilterContext';
import { InlineLoadingRow, RefreshLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { ProductDetailView } from './ProductDetailView';
import { ProductListView, type MotusBrowseItem } from './ProductListView';

const MOTUS_PRIMARY_LAYER_ID = 'service-181-layer-0';

interface MOTUSBrowseTabProps {
  showBackToOverview?: boolean;
  onBackToOverview?: () => void;
}

export function MOTUSBrowseTab({ showBackToOverview = false, onBackToOverview }: MOTUSBrowseTabProps) {
  const {
    loading,
    error,
    dataLoaded,
    speciesSummaries,
    browseFilters,
    selectedSpecies,
    selectedTagId,
    movementDisclaimer,
    warmCache,
    createLoadingScope,
    refreshSpeciesSummaries,
    setBrowseFilters,
    setSelectedSpecies,
    setSelectedTagId,
  } = useMotusFilter();
  const {
    activeLayer,
    activateLayer,
    pinLayer,
    unpinLayer,
    getPinnedByLayerId,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    syncMotusFilters,
    createOrUpdateMotusFilteredView,
  } = useLayers();
  const [taggedAnimals, setTaggedAnimals] = useState<MotusTaggedAnimalSummary[]>([]);
  const [taggedAnimalsLoading, setTaggedAnimalsLoading] = useState(false);
  const [selectedTagDetail, setSelectedTagDetail] = useState<Awaited<ReturnType<typeof motusService.getTaggedAnimalDetail>>>(null);
  const [tagDetailLoading, setTagDetailLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);
  const lastConsumedHydrateRef = useRef(0);
  const lastConsumedClearRef = useRef(0);
  const prevHydrateViewIdRef = useRef<string | undefined>(activeLayer?.viewId);

  const pinnedMotus = getPinnedByLayerId(MOTUS_PRIMARY_LAYER_ID);
  const isLayerPinned = !!pinnedMotus;
  const isMotusLayerActive = !!activeLayer && (
    activeLayer.layerId.startsWith('service-181-layer-') || activeLayer.layerId === 'dataset-181'
  );

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  useEffect(() => {
    if (!dataLoaded) return;
    void refreshSpeciesSummaries();
  }, [browseFilters.startDate, browseFilters.endDate, browseFilters.minHitCount, browseFilters.minMotusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedSpecies) {
      setTaggedAnimals([]);
      setSelectedTagId(null);
      setSelectedTagDetail(null);
      return;
    }
    let cancelled = false;
    const closeLoadingScope = createLoadingScope();
    setTaggedAnimalsLoading(true);
    setTagError(null);
    void motusService.getTaggedAnimalsForSpecies(selectedSpecies, browseFilters)
      .then((rows) => {
        if (!cancelled) setTaggedAnimals(rows);
      })
      .catch((err) => {
        if (!cancelled) setTagError(err instanceof Error ? err.message : 'Failed to load tagged animals');
      })
      .finally(() => {
        if (!cancelled) setTaggedAnimalsLoading(false);
        closeLoadingScope();
      });
    return () => {
      cancelled = true;
      closeLoadingScope();
    };
  }, [selectedSpecies, browseFilters, setSelectedTagId, createLoadingScope]);

  useEffect(() => {
    if (selectedTagId == null) {
      setSelectedTagDetail(null);
      return;
    }
    let cancelled = false;
    const closeLoadingScope = createLoadingScope();
    setTagDetailLoading(true);
    setTagError(null);
    void motusService.getTaggedAnimalDetail(selectedTagId, browseFilters)
      .then((detail) => {
        if (!cancelled) setSelectedTagDetail(detail);
      })
      .catch((err) => {
        if (!cancelled) setTagError(err instanceof Error ? err.message : 'Failed to load tagged animal detail');
      })
      .finally(() => {
        if (!cancelled) setTagDetailLoading(false);
        closeLoadingScope();
      });
    return () => {
      cancelled = true;
      closeLoadingScope();
    };
  }, [selectedTagId, browseFilters, createLoadingScope]);

  useEffect(() => {
    if (!isMotusLayerActive) return;

    const viewChanged = activeLayer?.viewId !== prevHydrateViewIdRef.current;
    const editRequested = lastEditFiltersRequest > lastConsumedHydrateRef.current;
    const clearRequested = lastFiltersClearedTimestamp > lastConsumedClearRef.current;
    prevHydrateViewIdRef.current = activeLayer?.viewId;

    if (!viewChanged && !editRequested && !clearRequested) return;
    if (editRequested) lastConsumedHydrateRef.current = lastEditFiltersRequest;
    if (clearRequested) lastConsumedClearRef.current = lastFiltersClearedTimestamp;
    if (!pinnedMotus) return;

    const sourceFilters = activeLayer?.viewId && pinnedMotus.views
      ? pinnedMotus.views.find((view) => view.id === activeLayer.viewId)?.motusFilters
      : pinnedMotus.motusFilters;
    if (!sourceFilters) return;

    setBrowseFilters({
      startDate: sourceFilters.startDate ?? '',
      endDate: sourceFilters.endDate ?? '',
      minHitCount: sourceFilters.minHitCount ?? 1,
      minMotusFilter: sourceFilters.minMotusFilter ?? 1,
    });
    setSelectedSpecies(sourceFilters.selectedSpecies ?? null);
    setSelectedTagId(sourceFilters.selectedTagId ?? null);
  }, [
    isMotusLayerActive,
    activeLayer?.viewId,
    lastEditFiltersRequest,
    lastFiltersClearedTimestamp,
    pinnedMotus,
    setBrowseFilters,
    setSelectedSpecies,
    setSelectedTagId,
  ]);

  useEffect(() => {
    if (!isMotusLayerActive || !activeLayer) return;

    const activeView = activeLayer.viewId && pinnedMotus?.views
      ? pinnedMotus.views.find((view) => view.id === activeLayer.viewId)
      : undefined;
    if (activeView?.motusFilters?.selectedTagId != null) return;

    syncMotusFilters(
      activeLayer.layerId,
      {
        selectedSpecies: selectedSpecies ?? undefined,
        selectedTagId: selectedTagId ?? undefined,
        startDate: browseFilters.startDate || undefined,
        endDate: browseFilters.endDate || undefined,
        minHitCount: browseFilters.minHitCount,
        minMotusFilter: browseFilters.minMotusFilter,
      },
      selectedTagId != null ? 1 : speciesSummaries.length,
      activeLayer.viewId,
    );
  }, [
    isMotusLayerActive,
    activeLayer,
    selectedSpecies,
    selectedTagId,
    browseFilters,
    speciesSummaries.length,
    pinnedMotus,
    syncMotusFilters,
  ]);

  const speciesItems = useMemo<MotusBrowseItem[]>(
    () =>
      speciesSummaries.map((species) => ({
        id: species.speciesEnglish.toLowerCase().replace(/\s+/g, '-'),
        title: species.speciesEnglish,
        scientificName: species.speciesScientific,
        tagCountLabel: `${species.tagCount.toLocaleString()} tagged animals`,
        detectionCountLabel: `${species.detectionCount.toLocaleString()} detections in window`,
        notes: species.detectionCount > 0 ? 'Detections found' : 'No detections',
      })),
    [speciesSummaries],
  );
  const selectedSpeciesItemId = selectedSpecies ? selectedSpecies.toLowerCase().replace(/\s+/g, '-') : null;
  const showInitialLoading = loading && !dataLoaded;
  const showRefreshLoading = loading && dataLoaded;

  const setLatestAvailableWindow = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 6);
    setBrowseFilters({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    });
  };

  const applySeasonalPreset = (preset: 'spring' | 'fall') => {
    const year = new Date().getUTCFullYear();
    if (preset === 'spring') {
      setBrowseFilters({ startDate: `${year}-03-01`, endDate: `${year}-05-31` });
      return;
    }
    setBrowseFilters({ startDate: `${year}-09-01`, endDate: `${year}-11-30` });
  };

  const toggleLayerOnMap = () => {
    const layerId = activeLayer?.layerId || 'service-181-layer-0';
    const targetLayerId = layerId.startsWith('service-181-layer-') ? layerId : MOTUS_PRIMARY_LAYER_ID;
    if (!isLayerPinned) {
      activateLayer(targetLayerId, activeLayer?.viewId, selectedTagId ?? undefined);
      pinLayer(targetLayerId);
      return;
    }
    if (pinnedMotus) unpinLayer(pinnedMotus.id);
  };

  const saveCurrentView = (): string => {
    const targetLayerId = isMotusLayerActive ? activeLayer!.layerId : MOTUS_PRIMARY_LAYER_ID;
    if (!isLayerPinned) {
      activateLayer(targetLayerId, activeLayer?.viewId, selectedTagId ?? undefined);
      pinLayer(targetLayerId);
    }

    const savedViewId = createOrUpdateMotusFilteredView(
      targetLayerId,
      {
        selectedSpecies: selectedSpecies ?? undefined,
        selectedTagId: selectedTagId ?? undefined,
        startDate: browseFilters.startDate || undefined,
        endDate: browseFilters.endDate || undefined,
        minHitCount: browseFilters.minHitCount,
        minMotusFilter: browseFilters.minMotusFilter,
      },
      selectedTagId != null ? 1 : speciesSummaries.length,
    );

    if (!savedViewId) {
      return 'Unable to save MOTUS view in Map Layers.';
    }

    activateLayer(targetLayerId, savedViewId, selectedTagId ?? undefined);
    return 'Saved as a MOTUS child view in Map Layers.';
  };

  return (
    <div id="motus-browse-tab" className="space-y-3">
      {showBackToOverview && onBackToOverview && (
        <button
          id="motus-browse-back-to-overview-button"
          type="button"
          onClick={onBackToOverview}
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          &larr; Back to overview
        </button>
      )}

      {selectedTagId == null ? (
        <>
          <div id="motus-browse-header" className="space-y-1">
            <h2 id="motus-browse-title" className="text-sm font-semibold text-gray-900">
              Species and tagged animals
            </h2>
            <p id="motus-browse-subtitle" className="text-xs text-gray-600">
              Filter by species, date window, and quality thresholds, then load selected tags onto the map.
            </p>
          </div>

          <div id="motus-filter-card" className="rounded-lg border border-gray-200 bg-slate-50 p-3 space-y-2">
            <div id="motus-filter-date-row" className="grid grid-cols-2 gap-2">
              <input
                id="motus-filter-start-date"
                type="date"
                value={browseFilters.startDate}
                onChange={(event) => setBrowseFilters({ startDate: event.target.value })}
                max={browseFilters.endDate || undefined}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700"
              />
              <input
                id="motus-filter-end-date"
                type="date"
                value={browseFilters.endDate}
                onChange={(event) => setBrowseFilters({ endDate: event.target.value })}
                min={browseFilters.startDate || undefined}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700"
              />
            </div>

            <div id="motus-filter-quality-row" className="grid grid-cols-2 gap-2">
              <label id="motus-filter-min-hit-count-label" className="text-xs text-gray-600">
                Min hits
                <input
                  id="motus-filter-min-hit-count"
                  type="number"
                  min={0}
                  value={browseFilters.minHitCount}
                  onChange={(event) => setBrowseFilters({ minHitCount: Number(event.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700"
                />
              </label>
              <label id="motus-filter-min-motus-filter-label" className="text-xs text-gray-600">
                Min motus_filter
                <input
                  id="motus-filter-min-motus-filter"
                  type="number"
                  step="0.1"
                  min={0}
                  value={browseFilters.minMotusFilter}
                  onChange={(event) => setBrowseFilters({ minMotusFilter: Number(event.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700"
                />
              </label>
            </div>

            <div id="motus-filter-actions" className="flex items-center gap-2 text-xs">
              <button
                id="motus-filter-latest-window-button"
                type="button"
                onClick={setLatestAvailableWindow}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:bg-gray-100"
              >
                Latest available
              </button>
              <button
                id="motus-filter-spring-preset-button"
                type="button"
                onClick={() => applySeasonalPreset('spring')}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:bg-gray-100"
              >
                Spring preset
              </button>
              <button
                id="motus-filter-fall-preset-button"
                type="button"
                onClick={() => applySeasonalPreset('fall')}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-700 hover:bg-gray-100"
              >
                Fall preset
              </button>
            </div>
          </div>

          {error && (
            <div id="motus-browse-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle id="motus-browse-error-icon" className="h-4 w-4 mt-0.5" />
              <span id="motus-browse-error-text">{error}</span>
            </div>
          )}

          {showInitialLoading && (
            <InlineLoadingRow id="motus-species-initial-loading" message="Loading species and detection summaries..." />
          )}
          {showRefreshLoading && (
            <RefreshLoadingRow id="motus-species-refresh-loading" message="Refreshing telemetry results..." />
          )}

          <ProductListView
            items={speciesItems}
            selectedItemId={selectedSpeciesItemId}
            onSelect={(item) => {
              setSelectedSpecies(item.title);
              setSelectedTagId(null);
            }}
          />

          {selectedSpecies && (
            <div id="motus-tag-list-section" className="space-y-2 border-t border-gray-100 pt-2">
              <h3 id="motus-tag-list-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Tagged animals in {selectedSpecies}
              </h3>
              {taggedAnimalsLoading ? (
                <InlineLoadingRow id="motus-tag-list-loading" message="Loading tagged animals..." />
              ) : (
                <div id="motus-tag-list" className="max-h-56 overflow-y-auto space-y-1">
                  {taggedAnimals.map((animal) => (
                    <button
                      id={`motus-tag-row-${animal.tagId}`}
                      key={animal.tagId}
                      type="button"
                      onClick={() => {
                        setSelectedTagId(animal.tagId);
                        activateLayer(MOTUS_PRIMARY_LAYER_ID, activeLayer?.viewId, animal.tagId);
                      }}
                      className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-left text-xs hover:bg-gray-50"
                    >
                      <span id={`motus-tag-row-label-${animal.tagId}`} className="font-medium text-gray-800">
                        Tag {animal.tagId}
                      </span>
                      <span id={`motus-tag-row-meta-${animal.tagId}`} className="ml-2 text-gray-500">
                        {animal.detectionCount.toLocaleString()} detections
                      </span>
                    </button>
                  ))}
                  {!taggedAnimalsLoading && taggedAnimals.length === 0 && (
                    <p id="motus-tag-list-empty" className="text-xs text-gray-500">
                      No tagged animals found for this species and filter window.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {tagDetailLoading && (
            <InlineLoadingRow id="motus-tag-detail-loading" message="Loading tagged animal detail..." />
          )}
          {tagError && (
            <div id="motus-tag-detail-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle id="motus-tag-detail-error-icon" className="h-4 w-4 mt-0.5" />
              <span id="motus-tag-detail-error-text">{tagError}</span>
            </div>
          )}
          {selectedTagDetail && (
            <ProductDetailView
              detail={selectedTagDetail}
              movementDisclaimer={movementDisclaimer}
              isLayerPinned={isLayerPinned}
              onBack={() => setSelectedTagId(null)}
              onLoadOnMap={toggleLayerOnMap}
              onSaveView={saveCurrentView}
              onChangeWindow={() => setSelectedTagId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
