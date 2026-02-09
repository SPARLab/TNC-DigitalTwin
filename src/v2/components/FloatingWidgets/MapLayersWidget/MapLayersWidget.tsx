// ============================================================================
// MapLayersWidget — Floating widget: Active Layer (amber) + Pinned Layers (blue)
// Position: top-left of map area. Always visible (no close, only collapse).
// ============================================================================

import { useState } from 'react';
import { Layers, Pin } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { WidgetShell } from '../shared/WidgetShell';
import { WidgetHeader } from '../shared/WidgetHeader';
import { ActiveLayerSection } from './ActiveLayerSection';
import { PinnedLayersSection } from './PinnedLayersSection';

export function MapLayersWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    activateLayer,
    requestEditFilters,
    undoStack,
    undo,
  } = useLayers();

  const handleEditFilters = (layerId: string, viewId?: string) => {
    activateLayer(layerId, viewId);
    requestEditFilters();
  };

  const handleClearFilters = (pinnedId: string, viewId?: string) => {
    clearFilters(pinnedId, viewId);
  };

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
                {activeLayer && !activeLayer.isPinned && (
                  <ActiveLayerSection
                    activeLayer={activeLayer}
                    onPin={() => pinLayer(activeLayer.layerId)}
                  />
                )}

            {/* Pinned Layers section */}
            <PinnedLayersSection
              layers={pinnedLayers}
              activeLayerId={activeLayer?.layerId}
              activeViewId={activeLayer?.viewId}
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
            />
              </>
            )}

            {/* Widget tip — always visible when expanded */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 rounded-b-xl">
              <p className="text-[11px] text-gray-500">
                Pin layers to keep them on the map.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
