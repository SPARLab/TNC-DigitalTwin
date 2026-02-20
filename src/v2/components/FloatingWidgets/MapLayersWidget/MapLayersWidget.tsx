// ============================================================================
// MapLayersWidget — Floating widget: Active Layer (amber) + Pinned Layers (blue)
// Position: top-left of map area. Always visible (no close, only collapse).
// ============================================================================

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layers, Pin } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useCatalog } from '../../../context/CatalogContext';
import { useDendra } from '../../../context/DendraContext';
import { useCacheStatusByDataSource } from '../../../dataSources/registry';
import { WidgetShell } from '../shared/WidgetShell';
import { WidgetHeader } from '../shared/WidgetHeader';
import { CountDisplayDropdown } from '../shared/CountDisplayDropdown';
import { ActiveLayerSection } from './ActiveLayerSection';
import { PinnedLayersSection } from './PinnedLayersSection';
import type { ActiveLayer, CountDisplayMode } from '../../../types';

export function MapLayersWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [countDisplayMode, setCountDisplayMode] = useState<CountDisplayMode>('results-expanded');
  const [displayedActiveLayer, setDisplayedActiveLayer] = useState<ActiveLayer | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    undoStack,
    undo,
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
        ?.replace(/^Dangermond_/, '')
        .replace(/_/g, ' ');
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
      const isDroneDeployLayer = pinnedLayer.layerId === 'dataset-193';
      const cacheStatus = isDroneDeployLayer
        ? cacheStatusByDataSource.drone
        : (catalogLayer ? cacheStatusByDataSource[catalogLayer.dataSource] : null);
      const isDroneDeploySource = isDroneDeployLayer || catalogLayer?.dataSource === 'drone';
      const isSourceLoading = isDroneDeploySource
        ? !!cacheStatus?.loading
        : (!!cacheStatus?.loading && !cacheStatus?.dataLoaded);
      return [pinnedLayer.layerId, isSourceLoading];
    }),
  );
  const activeLayerIsDroneDeploy = concreteActiveLayer?.layerId === 'dataset-193'
    || concreteActiveLayer?.dataSource === 'drone';
  const activeLayerCacheStatus = concreteActiveLayer
    ? (activeLayerIsDroneDeploy
      ? cacheStatusByDataSource.drone
      : cacheStatusByDataSource[concreteActiveLayer.dataSource])
    : null;
  const activeLayerIsLoading = activeLayerIsDroneDeploy
    ? !!activeLayerCacheStatus?.loading
    : (!!activeLayerCacheStatus?.loading && !activeLayerCacheStatus?.dataLoaded);

  const handleEditFilters = (layerId: string, viewId?: string) => {
    activateLayer(layerId, viewId);
    requestEditFilters();
  };

  const handleClearFilters = (pinnedId: string, viewId?: string) => {
    clearFilters(pinnedId, viewId);
  };

  // Track active layer changes for smooth exit transitions
  useEffect(() => {
    const shouldShow = concreteActiveLayer && !concreteActiveLayer.isPinned;
    
    if (shouldShow) {
      // New active layer appeared or changed
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
      setIsExiting(false);
      setDisplayedActiveLayer(concreteActiveLayer);
    } else if (displayedActiveLayer && !shouldShow) {
      // Active layer should disappear (was pinned or cleared)
      setIsExiting(true);
      
      // Clear displayed layer after transition completes
      exitTimeoutRef.current = setTimeout(() => {
        setDisplayedActiveLayer(null);
        setIsExiting(false);
        exitTimeoutRef.current = null;
      }, 300); // Match transition duration
    }
    
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [concreteActiveLayer, displayedActiveLayer]);

  const showActiveSection = !isExiting && displayedActiveLayer && !displayedActiveLayer.isPinned;

  const totalCount = pinnedLayers.length + (concreteActiveLayer && !concreteActiveLayer.isPinned ? 1 : 0);
  const canUndo = undoStack.length > 0;
  const isEmpty = !concreteActiveLayer && pinnedLayers.length === 0;

  return (
    <WidgetShell id="map-layers-widget" position="top-left">
      <WidgetHeader
        icon={<Layers className="w-4 h-4" />}
        title="Map Layers"
        count={totalCount}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
        canUndo={canUndo}
        undoDescription={undoStack[0]?.description}
        onUndo={undo}
        customActions={
          <CountDisplayDropdown 
            currentMode={countDisplayMode} 
            onModeChange={setCountDisplayMode} 
          />
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
              // Empty state — nothing active or pinned
              <div className="flex flex-col items-center justify-center text-center px-6 py-8">
                <Pin className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">No layers pinned</p>
                <p className="text-sm text-gray-500 mt-1">
                  Pin layers from the left sidebar to save them here.
                </p>
              </div>
            ) : (
              <>
                {/* Active Layer section — only shows non-pinned active layer */}
                <div 
                  className="grid transition-all duration-300 ease-in-out"
                  style={{
                    gridTemplateRows: showActiveSection ? '1fr' : '0fr',
                  }}
                >
                  <div className="overflow-hidden">
                    {displayedActiveLayer && (
                      <div
                        className="transition-opacity duration-300 ease-in-out"
                        style={{
                          opacity: showActiveSection ? 1 : 0,
                        }}
                      >
                        <ActiveLayerSection
                          activeLayer={displayedActiveLayer}
                          isLoading={activeLayerIsLoading}
                          canPin={!displayedActiveLayer.isService}
                          onPin={() => pinLayer(displayedActiveLayer.layerId)}
                        />
                      </div>
                    )}
                  </div>
                </div>

            {/* Pinned Layers section */}
            <PinnedLayersSection
              layers={pinnedLayers}
              isDendraLayer={isDendraLayer}
              loadingByLayerId={loadingByLayerId}
              activeLayerId={concreteActiveLayer?.layerId}
              activeViewId={concreteActiveLayer?.viewId}
              countDisplayMode={countDisplayMode}
              onToggleVisibility={toggleVisibility}
              onRemove={unpinLayer}
              onReorder={reorderLayers}
              onActivate={activateLayer}
              onActivateView={(layerId, viewId) => activateLayer(layerId, viewId)}
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

            {/* Widget tip — always visible when expanded */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 rounded-b-xl">
              <p className="text-[11px] text-gray-600">
                Each layer contains multiple items on the map. Pin layers to save them. Create filtered views to focus on specific items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
