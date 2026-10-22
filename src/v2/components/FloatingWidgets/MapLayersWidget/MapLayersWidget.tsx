// ============================================================================
// MapLayersWidget — Floating widget with one list of layers.
// The layer being viewed is highlighted amber; if it isn't pinned yet it is listed
// first with a Pin button, and joins the pinned layers once pinned.
// Position: top-left of map area. Always visible (no close, only collapse).
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Layers, Pin } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useCatalog } from '../../../context/CatalogContext';
import { useDendra } from '../../../context/DendraContext';
import { useCacheStatusByDataSource, layerSupportsPinnedFilters } from '../../../dataSources/registry';
import { formatStationDisplayName } from '../../../services/dendraStationService';
import { WidgetShell } from '../shared/WidgetShell';
import { WidgetHeader } from '../shared/WidgetHeader';
import { InfoButton } from '../shared/InfoButton';
import { PinnedLayersSection } from './PinnedLayersSection';
import { UnpinnedActiveLayerRow } from './UnpinnedActiveLayerRow';
import { LegendToggleButton } from './LegendToggleButton';
import { LayerLegendsVisibleProvider, useLayerLegendsPreference } from './layerLegendsPreference';
import type { ActiveLayer, CountDisplayMode } from '../../../types';

const COUNT_DISPLAY_MODE: CountDisplayMode = 'results-expanded';

export function MapLayersWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLegends, setShowLegends] = useLayerLegendsPreference();
  const {
    activeLayer,
    pinnedLayers,
    pinLayer,
    unpinLayer,
    toggleVisibility,
    toggleChildVisibility,
    clearFilters,
    reorderLayers,
    createNewView,
    removeView,
    renameView,
    activateLayer,
    requestEditFilters,
  } = useLayers();
  const { layerMap } = useCatalog();
  const { chartPanels } = useDendra();
  const cacheStatusByDataSource = useCacheStatusByDataSource();
  const concreteActiveLayer = useMemo<ActiveLayer | null>(() => {
    if (!activeLayer) return null;
    if (!activeLayer.isService) return activeLayer;

    const serviceLayer = layerMap.get(activeLayer.layerId);
    const siblingLayers = serviceLayer?.catalogMeta?.siblingLayers ?? [];
    const selectedLayer = activeLayer.selectedSubLayerId
      ? siblingLayers.find(layer => layer.id === activeLayer.selectedSubLayerId)
      : undefined;
    const fallbackLayer = selectedLayer ?? siblingLayers[0];
    if (!fallbackLayer) return null;

    const isPinned = pinnedLayers.some(layer => layer.layerId === fallbackLayer.id);
    return {
      ...activeLayer,
      id: fallbackLayer.id,
      layerId: fallbackLayer.id,
      name: fallbackLayer.name,
      isPinned,
      isService: false,
      selectedSubLayerId: undefined,
    };
  }, [activeLayer, layerMap, pinnedLayers]);

  const pinnedStreamStatsBySource = useMemo(() => {
    const stats = new Map<string, { streamCount: number; stationIds: Set<number>; stationNames: Set<string> }>();
    for (const panel of chartPanels) {
      const pinnedLayer = pinnedLayers.find((pinned) => pinned.layerId === panel.sourceLayerId);
      const fallbackViewId = pinnedLayer?.views?.[0]?.id;
      const resolvedViewId = panel.sourceViewId ?? fallbackViewId;
      const sourceKey = `${panel.sourceLayerId}::${resolvedViewId ?? '__root__'}`;
      const stationId = panel.station?.station_id;
      const stationName = panel.station?.station_name
        ? formatStationDisplayName(panel.station.station_name)
        : undefined;
      const existing = stats.get(sourceKey);
      if (existing) {
        existing.streamCount += 1;
        if (stationId != null) existing.stationIds.add(stationId);
        if (stationName) existing.stationNames.add(stationName);
      } else {
        stats.set(sourceKey, {
          streamCount: 1,
          stationIds: new Set(stationId != null ? [stationId] : []),
          stationNames: new Set(stationName ? [stationName] : []),
        });
      }
    }
    const resolved = new Map<string, { streamCount: number; stationCount: number; stationNames: string[] }>();
    for (const [key, value] of stats.entries()) {
      resolved.set(key, {
        streamCount: value.streamCount,
        stationCount: value.stationIds.size,
        stationNames: Array.from(value.stationNames),
      });
    }
    return resolved;
  }, [chartPanels, pinnedLayers]);

  const isDendraLayer = useCallback((layerId: string) => {
    const catalogLayer = layerMap.get(layerId);
    return catalogLayer?.dataSource === 'dendra';
  }, [layerMap]);

  const layerHasPinnedFilters = useCallback((layerId: string) => {
    const catalogLayer = layerMap.get(layerId);
    return layerSupportsPinnedFilters(layerId, catalogLayer?.dataSource);
  }, [layerMap]);

  const getPinnedStreamStats = useCallback((layerId: string, viewId?: string) => {
    return pinnedStreamStatsBySource.get(`${layerId}::${viewId ?? '__root__'}`) ?? {
      streamCount: 0,
      stationCount: 0,
      stationNames: [],
    };
  }, [pinnedStreamStatsBySource]);

  const getPinnedStreamCount = useCallback((layerId: string, viewId?: string) => {
    return getPinnedStreamStats(layerId, viewId).streamCount;
  }, [getPinnedStreamStats]);

  const loadingByLayerId = new Map<string, boolean>(
    pinnedLayers.map((pinnedLayer) => {
      const catalogLayer = layerMap.get(pinnedLayer.layerId);
      const isDroneDeployLayer = layerMap.get(pinnedLayer.layerId)?.dataSource === 'drone'
        || pinnedLayer.layerId === 'dataset-193';
      const isDataOneLayer = catalogLayer?.dataSource === 'dataone'
        || pinnedLayer.layerId === 'dataone-datasets';
      const cacheStatus = isDroneDeployLayer
        ? cacheStatusByDataSource.drone
        : (catalogLayer ? cacheStatusByDataSource[catalogLayer.dataSource] : null);
      const isAlwaysLiveLoadingSource = isDroneDeployLayer
        || isDataOneLayer
        || catalogLayer?.dataSource === 'drone'
        || catalogLayer?.dataSource === 'dataone'
        || catalogLayer?.dataSource === 'motus';
      const isSourceLoading = isAlwaysLiveLoadingSource
        ? !!cacheStatus?.loading
        : (!!cacheStatus?.loading && !cacheStatus?.dataLoaded);
      return [pinnedLayer.layerId, isSourceLoading];
    }),
  );

  const handleEditFilters = (layerId: string, viewId?: string) => {
    activateLayer(layerId, viewId);
    requestEditFilters();
  };

  const handleClearFilters = (pinnedId: string, viewId?: string) => {
    clearFilters(pinnedId, viewId);
  };

  // The layer being viewed but not pinned yet is listed first, with a Pin button.
  const unpinnedActiveLayer = concreteActiveLayer && !concreteActiveLayer.isPinned
    ? concreteActiveLayer
    : null;
  const activeLayerIsDroneDeploy = unpinnedActiveLayer?.dataSource === 'drone'
    || unpinnedActiveLayer?.layerId === 'dataset-193';
  const activeLayerIsAlwaysLive = activeLayerIsDroneDeploy
    || unpinnedActiveLayer?.dataSource === 'motus'
    || unpinnedActiveLayer?.dataSource === 'dataone'
    || unpinnedActiveLayer?.layerId === 'dataone-datasets';
  const activeLayerCacheStatus = unpinnedActiveLayer
    ? (activeLayerIsDroneDeploy
      ? cacheStatusByDataSource.drone
      : cacheStatusByDataSource[unpinnedActiveLayer.dataSource])
    : null;
  const activeLayerIsLoading = activeLayerIsAlwaysLive
    ? !!activeLayerCacheStatus?.loading
    : (!!activeLayerCacheStatus?.loading && !activeLayerCacheStatus?.dataLoaded);

  const totalCount = pinnedLayers.length + (unpinnedActiveLayer ? 1 : 0);
  const isEmpty = totalCount === 0;

  return (
    <LayerLegendsVisibleProvider value={showLegends}>
      <WidgetShell id="map-layers-widget" position="top-left">
        <WidgetHeader
          icon={<Layers className="w-4 h-4" />}
          title="Map Layers"
          count={totalCount}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(prev => !prev)}
          customActions={
            <>
              <LegendToggleButton isOn={showLegends} onToggle={() => setShowLegends(!showLegends)} />
              <InfoButton id="map-layers-info" label="About map layers">
                <p>Each layer contains multiple items on the map. Pin layers to save them. Create filtered views to focus on specific items.</p>
                <p className="mt-2">The layer highlighted in yellow is the one you are viewing details for. If it has a pin button, it is not saved yet.</p>
                <label
                  htmlFor="map-layers-legend-option"
                  className="mt-3 flex cursor-pointer items-center gap-2 border-t border-gray-100 pt-2.5 font-medium text-gray-800"
                >
                  <input
                    id="map-layers-legend-option"
                    type="checkbox"
                    checked={showLegends}
                    onChange={(event) => setShowLegends(event.target.checked)}
                    className="h-3.5 w-3.5 accent-emerald-600"
                  />
                  Show legend entries under layers
                </label>
              </InfoButton>
            </>
          }
        />

        <div 
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: isCollapsed ? '0fr' : '1fr',
            opacity: isCollapsed ? 0 : 1,
          }}
        >
          <div id="map-layers-body" className="overflow-hidden">
            <div id="map-layers-scroll" className="scroll-area-widget max-h-[350px] overflow-y-auto">
              {isEmpty ? (
                // Empty state — nothing pinned or active
                <div className="flex flex-col items-center justify-center text-center px-6 py-8">
                  <Pin className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-700">No layers pinned</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Pin layers from the left sidebar to save them here.
                  </p>
                </div>
              ) : (
                <>
              {/* Pinned Layers section */}
              <PinnedLayersSection
                layers={pinnedLayers}
                leadingRow={unpinnedActiveLayer ? (
                  <UnpinnedActiveLayerRow
                    activeLayer={unpinnedActiveLayer}
                    isLoading={activeLayerIsLoading}
                    onPin={() => pinLayer(unpinnedActiveLayer.layerId)}
                  />
                ) : undefined}
                isDendraLayer={isDendraLayer}
                supportsPinnedFilters={layerHasPinnedFilters}
                loadingByLayerId={loadingByLayerId}
                activeLayerId={concreteActiveLayer?.layerId}
                activeViewId={concreteActiveLayer?.viewId}
                countDisplayMode={COUNT_DISPLAY_MODE}
                onToggleVisibility={toggleVisibility}
                onRemove={unpinLayer}
                onReorder={reorderLayers}
                onActivate={activateLayer}
                onActivateView={(layerId, viewId) => {
                  const pinned = pinnedLayers.find(p => p.layerId === layerId);
                  const view = viewId ? pinned?.views?.find(v => v.id === viewId) : undefined;
                  const featureId = (
                    layerMap.get(layerId)?.dataSource === 'dataone'
                    || layerId === 'dataone-datasets'
                  )
                    ? view?.dataoneFilters?.selectedDatasetId
                    : undefined;
                  activateLayer(layerId, viewId, featureId);
                }}
                onEditFilters={handleEditFilters}
                onClearFilters={handleClearFilters}
                onToggleChildView={toggleChildVisibility}
                onCreateNewView={createNewView}
                onRemoveView={removeView}
                onRenameView={renameView}
                getPinnedStreamCount={getPinnedStreamCount}
                getPinnedStreamStats={getPinnedStreamStats}
              />
                </>
              )}

            </div>
          </div>
        </div>
      </WidgetShell>
    </LayerLegendsVisibleProvider>
  );
}
