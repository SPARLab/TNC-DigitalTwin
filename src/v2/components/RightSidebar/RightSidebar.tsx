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

interface RightSidebarProps {
  onCollapse: () => void;
}

export function RightSidebar({ onCollapse }: RightSidebarProps) {
  const { activeLayer, activateLayer, lastEditFiltersRequest } = useLayers();
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const [lastTabByLayerId, setLastTabByLayerId] = useState<Record<string, SidebarTab>>({});
  const [isInspectBrowseFlow, setIsInspectBrowseFlow] = useState(false);
  const consumedRequestRef = useRef(0);
  const prevLayerIdRef = useRef<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollHideTimerRef = useRef<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [scrollThumbHeight, setScrollThumbHeight] = useState(0);
  const [scrollThumbTop, setScrollThumbTop] = useState(0);

  // Track layer changes for flash animation
  const [shouldFlash, setShouldFlash] = useState(false);

  // Look up the adapter for the active layer's data source
  const adapter = getAdapterForActiveLayer(activeLayer);
  const showBrowseTab = true;

  const updateScrollThumb = useCallback(() => {
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    if (scrollHeight <= clientHeight + 1) {
      setScrollThumbHeight(0);
      setScrollThumbTop(0);
      return;
    }

    const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * clientHeight);
    const maxThumbTop = clientHeight - thumbHeight;
    const scrollProgress = scrollTop / (scrollHeight - clientHeight);
    const thumbTop = maxThumbTop * scrollProgress;

    setScrollThumbHeight(thumbHeight);
    setScrollThumbTop(thumbTop);
  }, []);

  const handleScroll = useCallback(() => {
    updateScrollThumb();
    setIsScrolling(true);

    if (scrollHideTimerRef.current !== null) {
      window.clearTimeout(scrollHideTimerRef.current);
    }

    scrollHideTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 650);
  }, [updateScrollThumb]);

  const handleSystemTabChange = useCallback((tab: SidebarTab) => {
    if (tab !== 'browse') {
      setIsInspectBrowseFlow(false);
    }
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
    setIsInspectBrowseFlow(false);
    setActiveTab(tab);
  }, [activeLayer, activateLayer]);

  const handleOverviewBrowseClick = useCallback(() => {
    setIsInspectBrowseFlow(false);
    setActiveTab('browse');
  }, []);

  const handleOverviewInspectBrowseClick = useCallback(() => {
    setIsInspectBrowseFlow(true);
    setActiveTab('browse');
  }, []);

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
        activeLayer?.layerId === 'dataset-178' ||
        activeLayer?.layerId === 'dataset-215'
      ) &&
      activeLayer.featureId != null
    ) {
      handleSystemTabChange('browse');
    }
  }, [activeLayer?.layerId, activeLayer?.dataSource, activeLayer?.featureId, handleSystemTabChange]);

  useEffect(() => {
    updateScrollThumb();
  }, [activeLayer?.layerId, activeTab, updateScrollThumb]);

  useEffect(() => {
    const handleResize = () => updateScrollThumb();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollHideTimerRef.current !== null) {
        window.clearTimeout(scrollHideTimerRef.current);
      }
    };
  }, [updateScrollThumb]);

  return (
    <aside
      id="right-sidebar"
      className="w-[400px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden"
    >
      {activeLayer ? (
        <>
          <SidebarHeader
            activeLayer={activeLayer}
            onCollapse={onCollapse}
            shouldFlash={shouldFlash}
          />
          <TabBar
            activeTab={activeTab}
            onTabChange={handleUserTabChange}
            showBrowseTab={showBrowseTab}
          />

          {/* Tab content — delegated to data source adapter */}
          <div id="right-sidebar-scroll-wrap" className="relative flex-1 overflow-hidden group">
            <div
              id="right-sidebar-tab-panel"
              ref={scrollAreaRef}
              onScroll={handleScroll}
              className="h-full overflow-y-auto p-4 scroll-area-right-sidebar"
              role="tabpanel"
            >
              {adapter ? (
                activeTab === 'overview' ? (
                  <adapter.OverviewTab
                    onBrowseClick={handleOverviewBrowseClick}
                    onInspectBrowseClick={handleOverviewInspectBrowseClick}
                  />
                ) : showBrowseTab ? (
                  <adapter.BrowseTab
                    showBackToOverview={activeLayer.dataSource === 'tnc-arcgis' || isInspectBrowseFlow}
                    onBackToOverview={() => handleSystemTabChange('overview')}
                  />
                ) : (
                  <adapter.OverviewTab
                    onBrowseClick={handleOverviewBrowseClick}
                    onInspectBrowseClick={handleOverviewInspectBrowseClick}
                  />
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
                      onClick={handleOverviewBrowseClick}
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

            {scrollThumbHeight > 0 && (
              <div
                id="right-sidebar-scrollbar-overlay"
                className="pointer-events-none absolute inset-y-1 right-0.5 w-2"
              >
                <div
                  id="right-sidebar-scrollbar-thumb"
                  className={`absolute right-0 w-1.5 rounded-full bg-gray-500/55 transition-opacity duration-200 ${
                    isScrolling ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{ top: scrollThumbTop, height: scrollThumbHeight }}
                />
              </div>
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
