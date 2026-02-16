// ============================================================================
// MapLayersWidget — Floating widget: Active Layer (amber) + Pinned Layers (blue)
// Position: top-left of map area. Always visible (no close, only collapse).
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Layers, Pin } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useCatalog } from '../../../context/CatalogContext';
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
  const cacheStatusByDataSource = useCacheStatusByDataSource();

  const loadingByLayerId = new Map<string, boolean>(
    pinnedLayers.map((pinnedLayer) => {
      const catalogLayer = layerMap.get(pinnedLayer.layerId);
      const isSourceLoading = catalogLayer
        ? !!cacheStatusByDataSource[catalogLayer.dataSource]?.loading
        : false;
      return [pinnedLayer.layerId, isSourceLoading];
    }),
  );
  const activeLayerIsLoading = activeLayer
    ? !!cacheStatusByDataSource[activeLayer.dataSource]?.loading
    : false;

  const handleEditFilters = (layerId: string, viewId?: string) => {
    activateLayer(layerId, viewId);
    requestEditFilters();
  };

  const handleClearFilters = (pinnedId: string, viewId?: string) => {
    clearFilters(pinnedId, viewId);
  };

  // Track active layer changes for smooth exit transitions
  useEffect(() => {
    const shouldShow = activeLayer && !activeLayer.isPinned;
    
    if (shouldShow) {
      // New active layer appeared or changed
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
      setIsExiting(false);
      setDisplayedActiveLayer(activeLayer);
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
  }, [activeLayer, displayedActiveLayer]);

  const showActiveSection = !isExiting && displayedActiveLayer && !displayedActiveLayer.isPinned;

  const totalCount = pinnedLayers.length + (activeLayer && !activeLayer.isPinned ? 1 : 0);
  const canUndo = undoStack.length > 0;
  const isEmpty = !activeLayer && pinnedLayers.length === 0;

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
                          onPin={() => pinLayer(displayedActiveLayer.layerId)}
                        />
                      </div>
                    )}
                  </div>
                </div>

            {/* Pinned Layers section */}
            <PinnedLayersSection
              layers={pinnedLayers}
              loadingByLayerId={loadingByLayerId}
              activeLayerId={activeLayer?.layerId}
              activeViewId={activeLayer?.viewId}
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
