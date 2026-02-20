// ============================================================================
// RightSidebar — 400px fixed width. Shows layer details or empty state.
// Two tabs: Overview | Browse (DFT-041). Overview opens first (DFT-006).
// Uses data source registry for tab content — no data-source-specific imports.
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
import type { SidebarTab } from '../../types';
import { SidebarHeader } from './SidebarHeader';
import { TabBar } from './TabBar';
import { getAdapterForActiveLayer } from '../../dataSources/registry';

export function RightSidebar() {
  const { activeLayer, deactivateLayer, activateLayer, lastEditFiltersRequest } = useLayers();
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const [lastTabByLayerId, setLastTabByLayerId] = useState<Record<string, SidebarTab>>({});
  const consumedRequestRef = useRef(0);
  const prevLayerIdRef = useRef<string | null>(null);

  // Track layer changes for flash animation
  const [shouldFlash, setShouldFlash] = useState(false);

  // Look up the adapter for the active layer's data source
  const adapter = getAdapterForActiveLayer(activeLayer);
  const showBrowseTab = true;

  const handleSystemTabChange = useCallback((tab: SidebarTab) => {
    setActiveTab(tab);
  }, []);

  const handleUserTabChange = useCallback((tab: SidebarTab) => {
    // DataONE map clicks set featureId to open detail. If the user manually
    // re-opens Browse, clear featureId so Browse starts at the dataset list.
    if (
      tab === 'browse' &&
      activeLayer?.layerId === 'dataone-datasets' &&
      activeLayer.featureId != null
    ) {
      activateLayer(activeLayer.layerId, activeLayer.viewId, undefined);
    }
    setActiveTab(tab);
  }, [activeLayer, activateLayer]);

  // Task 22: Restore last active tab per layer on reactivation.
  // First visit still defaults to Overview (DFT-006).
  useEffect(() => {
    const currentLayerId = activeLayer?.layerId ?? null;
    if (currentLayerId === prevLayerIdRef.current) return;

    prevLayerIdRef.current = currentLayerId;
    if (!currentLayerId) return;

    const restoredTab = lastTabByLayerId[currentLayerId] ?? 'overview';
    setActiveTab(restoredTab);
    setShouldFlash(true);
    const timer = window.setTimeout(() => setShouldFlash(false), 600);
    return () => window.clearTimeout(timer);
  }, [activeLayer?.layerId, lastTabByLayerId]);

  // Persist current tab for the active layer.
  useEffect(() => {
    if (!activeLayer) return;
    setLastTabByLayerId(prev => {
      if (prev[activeLayer.layerId] === activeTab) return prev;
      return { ...prev, [activeLayer.layerId]: activeTab };
    });
  }, [activeLayer, activeTab]);

  // DFT-019: Edit Filters → open Browse tab
  useEffect(() => {
    if (activeLayer && lastEditFiltersRequest > 0 && lastEditFiltersRequest !== consumedRequestRef.current) {
      handleSystemTabChange('browse');
      consumedRequestRef.current = lastEditFiltersRequest;
    }
  }, [activeLayer, lastEditFiltersRequest, handleSystemTabChange]);

  // Map feature clicks should open Browse detail flow immediately.
  // Browse tab owns detail-view rendering for marker-driven selections.
  useEffect(() => {
    if (
      (
        activeLayer?.layerId === 'inaturalist-obs' ||
        activeLayer?.dataSource === 'dendra' ||
        activeLayer?.layerId === 'animl-camera-traps' ||
        activeLayer?.layerId === 'dataone-datasets' ||
        activeLayer?.layerId === 'dataset-193' ||
        activeLayer?.layerId === 'dataset-178'
      ) &&
      activeLayer.featureId != null
    ) {
      handleSystemTabChange('browse');
    }
  }, [activeLayer?.layerId, activeLayer?.dataSource, activeLayer?.featureId, handleSystemTabChange]);

  return (
    <aside
      id="right-sidebar"
      className="w-[400px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
    >
      {activeLayer ? (
        <>
          <SidebarHeader activeLayer={activeLayer} onClose={deactivateLayer} shouldFlash={shouldFlash} />
          <TabBar
            activeTab={activeTab}
            onTabChange={handleUserTabChange}
            showBrowseTab={showBrowseTab}
          />

          {/* Tab content — delegated to data source adapter */}
          <div
            id="right-sidebar-tab-panel"
            className="flex-1 overflow-y-auto p-4 scroll-area-right-sidebar"
            role="tabpanel"
          >
            {adapter ? (
              activeTab === 'overview' ? (
                <adapter.OverviewTab onBrowseClick={() => handleUserTabChange('browse')} />
              ) : showBrowseTab ? (
                <adapter.BrowseTab />
              ) : (
                <adapter.OverviewTab onBrowseClick={() => handleUserTabChange('browse')} />
              )
            ) : (
              /* Generic placeholder for unimplemented data sources */
              activeTab === 'overview' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Overview content for <strong>{activeLayer.name}</strong> will be implemented
                    in Phase 2-4 (per data source).
                  </p>
                  <button
                    id="generic-browse-cta"
                    onClick={() => handleUserTabChange('browse')}
                    className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                               hover:bg-[#256d29] transition-colors text-sm"
                  >
                    Browse Items &rarr;
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Browse tab content for <strong>{activeLayer.name}</strong> will be implemented
                  in Phase 2-4.
                </p>
              )
            )}
          </div>
        </>
      ) : (
        /* Empty state — no layer selected (DFT-015) */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <Layers className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">
            Click any item layer in the left sidebar to view its details here.
          </p>
        </div>
      )}
    </aside>
  );
}
