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
import { getAdapter } from '../../dataSources/registry';

export function RightSidebar() {
  const { activeLayer, deactivateLayer, lastEditFiltersRequest } = useLayers();
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const [lastTabByLayerId, setLastTabByLayerId] = useState<Record<string, SidebarTab>>({});
  const consumedRequestRef = useRef(0);
  const prevLayerIdRef = useRef<string | null>(null);

  // Track layer changes for flash animation
  const [shouldFlash, setShouldFlash] = useState(false);

  // Look up the adapter for the active layer's data source
  const adapter = getAdapter(activeLayer?.dataSource);

  const handleTabChange = useCallback((tab: SidebarTab) => {
    setActiveTab(tab);
  }, []);

  // Task 22: Restore last active tab per layer on reactivation.
  // First visit still defaults to Overview (DFT-006).
  useEffect(() => {
    const currentLayerId = activeLayer?.layerId ?? null;
    if (currentLayerId === prevLayerIdRef.current) return;

    prevLayerIdRef.current = currentLayerId;
    if (!currentLayerId) return;

    setActiveTab(lastTabByLayerId[currentLayerId] ?? 'overview');
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
      handleTabChange('browse');
      consumedRequestRef.current = lastEditFiltersRequest;
    }
  }, [activeLayer, lastEditFiltersRequest, handleTabChange]);

  // Map observation click should open iNaturalist detail flow immediately.
  // The browse tab owns detail-view rendering for selected observations.
  useEffect(() => {
    if (activeLayer?.layerId === 'inaturalist-obs' && activeLayer.featureId != null) {
      handleTabChange('browse');
    }
  }, [activeLayer?.layerId, activeLayer?.featureId, handleTabChange]);

  return (
    <aside
      id="right-sidebar"
      className="w-[400px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
    >
      {activeLayer ? (
        <>
          <SidebarHeader activeLayer={activeLayer} onClose={deactivateLayer} shouldFlash={shouldFlash} />
          <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Tab content — delegated to data source adapter */}
          <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
            {adapter ? (
              activeTab === 'overview' ? (
                <adapter.OverviewTab onBrowseClick={() => handleTabChange('browse')} />
              ) : (
                <adapter.BrowseTab />
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
                    onClick={() => handleTabChange('browse')}
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
