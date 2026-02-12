// ============================================================================
// RightSidebar — 400px fixed width. Shows layer details or empty state.
// Two tabs: Overview | Browse (DFT-041). Overview opens first (DFT-006).
// Filter state is global (INaturalistFilterContext) — shared with floating legend.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';
import { useINaturalistFilter } from '../../context/INaturalistFilterContext';
import type { SidebarTab } from '../../types';
import { SidebarHeader } from './SidebarHeader';
import { TabBar } from './TabBar';
import { INaturalistOverviewTab } from './iNaturalist/INaturalistOverviewTab';
import { INaturalistBrowseTab } from './iNaturalist/INaturalistBrowseTab';
import { useINaturalistObservations } from '../../hooks/useINaturalistObservations';

export function RightSidebar() {
  const { activeLayer, deactivateLayer, lastEditFiltersRequest } = useLayers();
  const { selectAll } = useINaturalistFilter();
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const consumedRequestRef = useRef(0);

  // Track layer changes for flash animation
  const [prevLayerId, setPrevLayerId] = useState<string | null>(null);
  const [shouldFlash, setShouldFlash] = useState(false);

  // iNaturalist data (only fetched when iNat layer is active)
  const isINat = activeLayer?.dataSource === 'inaturalist';
  const inatData = useINaturalistObservations({ skip: !isINat });

  // Reset to Overview and trigger flash when layer changes (DFT-006)
  // NOTE: Own-state updates (setPrevLayerId, setActiveTab, setShouldFlash) are safe during render.
  // selectAll() is moved to a useEffect below because it updates a DIFFERENT component's state.
  if (activeLayer && activeLayer.layerId !== prevLayerId) {
    setPrevLayerId(activeLayer.layerId);
    setActiveTab('overview');
    setShouldFlash(true);
    setTimeout(() => setShouldFlash(false), 600);
  }

  // Clear iNaturalist taxon filter on layer change
  // Must be in useEffect — calling selectAll() during render would trigger
  // a setState on INaturalistFilterProvider (a different component), causing a render loop.
  useEffect(() => {
    selectAll();
  }, [activeLayer?.layerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // DFT-019: Edit Filters → open Browse tab
  useEffect(() => {
    if (activeLayer && lastEditFiltersRequest > 0 && lastEditFiltersRequest !== consumedRequestRef.current) {
      setActiveTab('browse');
      consumedRequestRef.current = lastEditFiltersRequest;
    }
  }, [activeLayer, lastEditFiltersRequest]);

  return (
    <aside
      id="right-sidebar"
      className="w-[400px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
    >
      {activeLayer ? (
        <>
          <SidebarHeader activeLayer={activeLayer} onClose={deactivateLayer} shouldFlash={shouldFlash} />
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4" role="tabpanel">
            {isINat ? (
              activeTab === 'overview' ? (
                <INaturalistOverviewTab
                  totalCount={inatData.totalCount}
                  loading={inatData.loading}
                  onBrowseClick={() => setActiveTab('browse')}
                />
              ) : (
                <INaturalistBrowseTab />
              )
            ) : (
              /* Generic placeholder for other data sources */
              activeTab === 'overview' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Overview content for <strong>{activeLayer.name}</strong> will be implemented
                    in Phase 2-4 (per data source).
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
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
