// ============================================================================
// LayerContext — Active layer + Pinned layers state management
// Provides: activateLayer, pinLayer, unpinLayer, toggleVisibility, reorder
// ============================================================================

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type {
  ActiveLayer,
  PinnedLayer,
  CatalogLayer,
  UndoAction,
  DataSource,
  INaturalistViewFilters,
  AnimlViewFilters,
  DendraViewFilters,
  TNCArcGISViewFilters,
  DataOneViewFilters,
  CalFloraViewFilters,
  GBIFViewFilters,
  MotusViewFilters,
} from '../types';
import type { DroneImageryMetadata } from '../../types/droneImagery';
import { useCatalog } from './CatalogContext';
import { useLayerSourceSyncActions } from './layerContext/internal/useLayerSourceSyncActions';
import { useLayerViewLifecycleActions } from './layerContext/internal/useLayerViewLifecycleActions';
import { useLayerFilteredViewActions } from './layerContext/internal/useLayerFilteredViewActions';
import { useLayerCoreActions } from './layerContext/internal/useLayerCoreActions';

interface LayerContextValue {
  // Active layer (one at a time)
  activeLayer: ActiveLayer | null;
  activateLayer: (
    layerId: string,
    viewId?: string,
    featureId?: string | number,
    selectedSubLayerId?: string,
  ) => void;
  setActiveServiceSubLayer: (layerId: string) => void;
  deactivateLayer: () => void;

  // Pinned layers (multiple)
  pinnedLayers: PinnedLayer[];
  pinLayer: (layerId: string) => void;
  unpinLayer: (pinnedId: string) => void;
  toggleVisibility: (pinnedId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  getLayerOpacity: (layerId: string) => number;
  toggleChildVisibility: (pinnedId: string, viewId: string) => void;
  clearFilters: (pinnedId: string, viewId?: string) => void;
  syncINaturalistFilters: (
    layerId: string,
    filters: INaturalistViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncAnimlFilters: (
    layerId: string,
    filters: AnimlViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncDendraFilters: (
    layerId: string,
    filters: DendraViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncTNCArcGISFilters: (
    layerId: string,
    filters: TNCArcGISViewFilters,
    resultCount?: number,
    viewId?: string,
  ) => void;
  syncDataOneFilters: (
    layerId: string,
    filters: DataOneViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncCalFloraFilters: (
    layerId: string,
    filters: CalFloraViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncGBIFFilters: (
    layerId: string,
    filters: GBIFViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  syncMotusFilters: (
    layerId: string,
    filters: MotusViewFilters,
    resultCount: number,
    viewId?: string,
  ) => void;
  createDendraFilteredView: (
    layerId: string,
    filters: DendraViewFilters,
    resultCount: number,
  ) => string | undefined;
  createOrUpdateDataOneFilteredView: (
    layerId: string,
    filters: DataOneViewFilters,
    resultCount: number,
    targetViewId?: string,
  ) => string | undefined;
  createOrUpdateCalFloraFilteredView: (
    layerId: string,
    filters: CalFloraViewFilters,
    resultCount: number,
    targetViewId?: string,
  ) => string | undefined;
  createOrUpdateGBIFFilteredView: (
    layerId: string,
    filters: GBIFViewFilters,
    resultCount: number,
    targetViewId?: string,
  ) => string | undefined;
  createOrUpdateMotusFilteredView: (
    layerId: string,
    filters: MotusViewFilters,
    resultCount: number,
    targetViewId?: string,
  ) => string | undefined;
  createOrUpdateDroneView: (
    layerId: string,
    flight: DroneImageryMetadata,
    comparisonMode?: 'single' | 'temporal',
  ) => string | undefined;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  createNewView: (pinnedId: string) => void;
  removeView: (pinnedId: string, viewId: string) => void;
  renameView: (pinnedId: string, viewId: string, name: string) => void;

  // Edit Filters → open Browse tab (DFT-019)
  lastEditFiltersRequest: number;
  requestEditFilters: () => void;

  // Generic Browse tab switch (e.g. cluster click when user is on Overview)
  lastBrowseTabRequest: number;
  requestBrowseTab: () => void;

  // Filters cleared → hydrate Browse tab with empty state
  lastFiltersClearedTimestamp: number;

  // Helpers
  isLayerPinned: (layerId: string) => boolean;
  isLayerVisible: (layerId: string) => boolean;
  getPinnedByLayerId: (layerId: string) => PinnedLayer | undefined;

  // Undo stack
  undoStack: UndoAction[];
  undo: () => void;
}

const LayerContext = createContext<LayerContextValue | null>(null);

function isServiceContainerLayer(layer: CatalogLayer | undefined): boolean {
  if (!layer) return false;
  return !!(
    layer.catalogMeta?.isMultiLayerService
    && !layer.catalogMeta?.parentServiceId
    && layer.catalogMeta?.siblingLayers
    && layer.catalogMeta.siblingLayers.length > 0
  );
}

export function LayerProvider({ children }: { children: ReactNode }) {
  const { layerMap } = useCatalog();
  const [activeLayer, setActiveLayer] = useState<ActiveLayer | null>(null);
  const [pinnedLayers, setPinnedLayers] = useState<PinnedLayer[]>([]);
  const [layerOpacityById, setLayerOpacityById] = useState<Record<string, number>>({});
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const pushUndo = useCallback((description: string, undoFn: () => void) => {
    setUndoStack(prev => [
      { id: crypto.randomUUID(), description, undo: undoFn, timestamp: Date.now() },
      ...prev,
    ].slice(0, 5)); // DFT-031: max 5 actions
  }, []);

  const activateLayer = useCallback((
    layerId: string,
    viewId?: string,
    featureId?: string | number,
    selectedSubLayerId?: string,
  ) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;

    const pinned = pinnedLayers.find(p => p.layerId === layerId);
    const isService = isServiceContainerLayer(layer);
    const resolvedSubLayerId = isService
      ? (
        selectedSubLayerId
        && layer.catalogMeta?.siblingLayers?.some(sibling => sibling.id === selectedSubLayerId)
      )
        ? selectedSubLayerId
        : layer.catalogMeta?.siblingLayers?.[0]?.id
      : undefined;
    const resolvedFeatureId = (() => {
      if (featureId != null) return featureId;
      if (!viewId || layerId !== 'dataset-193' || !pinned?.views) return undefined;
      const selectedView = pinned.views.find((view) => view.id === viewId);
      return selectedView?.droneView?.flightId;
    })();
    setActiveLayer({
      id: layerId,
      layerId,
      name: layer.name,
      dataSource: layer.dataSource as DataSource,
      isPinned: !!pinned,
      viewId,
      featureId: resolvedFeatureId,
      isService,
      selectedSubLayerId: resolvedSubLayerId,
    });

    // DFT-001: clicking a pinned-but-hidden layer restores visibility
    if (pinned && !pinned.isVisible) {
      setPinnedLayers(prev =>
        prev.map(p => (p.layerId === layerId ? { ...p, isVisible: true } : p))
      );
    }
  }, [pinnedLayers, layerMap]);

  const [lastEditFiltersRequest, setLastEditFiltersRequest] = useState(0);
  const requestEditFilters = useCallback(() => setLastEditFiltersRequest(Date.now()), []);

  const [lastBrowseTabRequest, setLastBrowseTabRequest] = useState(0);
  const requestBrowseTab = useCallback(() => setLastBrowseTabRequest(Date.now()), []);

  const [lastFiltersClearedTimestamp, setLastFiltersClearedTimestamp] = useState(0);

  const setActiveServiceSubLayer = useCallback((layerId: string) => {
    setActiveLayer(prev => {
      if (!prev?.isService) return prev;
      if (prev.selectedSubLayerId === layerId) return prev;

      const serviceLayer = layerMap.get(prev.layerId);
      const availableLayers = serviceLayer?.catalogMeta?.siblingLayers ?? [];
      const existsInService = availableLayers.some(layer => layer.id === layerId);
      if (!existsInService) return prev;

      return { ...prev, selectedSubLayerId: layerId };
    });
  }, [layerMap]);

  const deactivateLayer = useCallback(() => setActiveLayer(null), []);

  const {
    pinLayer,
    unpinLayer,
    toggleVisibility,
    setLayerOpacity,
    getLayerOpacity,
    toggleChildVisibility,
    clearFilters,
    isLayerPinned,
    isLayerVisible,
    getPinnedByLayerId,
    undo,
  } = useLayerCoreActions({
    activeLayer,
    pinnedLayers,
    layerMap,
    layerOpacityById,
    undoStack,
    setPinnedLayers,
    setActiveLayer,
    setLayerOpacityById,
    setUndoStack,
    setLastFiltersClearedTimestamp,
    pushUndo,
    isServiceContainerLayer,
  });

  const {
    syncINaturalistFilters,
    syncAnimlFilters,
    syncDendraFilters,
    syncTNCArcGISFilters,
    syncDataOneFilters,
    syncCalFloraFilters,
    syncGBIFFilters,
    syncMotusFilters,
  } = useLayerSourceSyncActions(setPinnedLayers);

  const {
    createDendraFilteredView,
    createOrUpdateDataOneFilteredView,
    createOrUpdateCalFloraFilteredView,
    createOrUpdateGBIFFilteredView,
    createOrUpdateMotusFilteredView,
    createOrUpdateDroneView,
  } = useLayerFilteredViewActions({
    activeLayer,
    layerMap,
    layerOpacityById,
    setPinnedLayers,
    setActiveLayer,
  });

  const {
    reorderLayers,
    createNewView,
    removeView,
    renameView,
  } = useLayerViewLifecycleActions({
    layerMap,
    setPinnedLayers,
    activateLayer,
    requestEditFilters,
  });

  // Keep active view selection aligned with pinned child-view visibility/state.
  // This prevents map/sidebar drift when child visibility changes or views are removed.
  useEffect(() => {
    if (!activeLayer) return;

    const pinned = pinnedLayers.find((layer) => layer.layerId === activeLayer.layerId);
    if (!pinned?.views || pinned.views.length === 0) return;

    const currentActiveView = activeLayer.viewId
      ? pinned.views.find((view) => view.id === activeLayer.viewId)
      : undefined;
    const visibleView = pinned.views.find((view) => view.isVisible);

    const nextActiveView = (() => {
      if (currentActiveView?.isVisible) return currentActiveView;
      if (visibleView) return visibleView;
      if (currentActiveView) return currentActiveView;
      return pinned.views[0];
    })();

    const viewIsChanging = nextActiveView != null && activeLayer.viewId !== nextActiveView.id;
    const nextFeatureId = (() => {
      if (activeLayer.layerId === 'dataset-193') return nextActiveView?.droneView?.flightId;
      if (activeLayer.layerId === 'dataone-datasets' && viewIsChanging) {
        // Preserve explicit map-click selection when a view-id realignment
        // happens in the same render cycle.
        if (activeLayer.featureId != null) return activeLayer.featureId;
        return nextActiveView?.dataoneFilters?.selectedDatasetId;
      }
      return activeLayer.featureId;
    })();

    if (
      nextActiveView &&
      activeLayer.viewId === nextActiveView.id &&
      activeLayer.featureId === nextFeatureId
    ) {
      return;
    }

    setActiveLayer((prev) => {
      if (!prev || prev.layerId !== activeLayer.layerId || !nextActiveView) return prev;
      return {
        ...prev,
        viewId: nextActiveView.id,
        featureId: nextFeatureId,
      };
    });
  }, [activeLayer, pinnedLayers]);

  // Keep active layer's isActive flag in sync with pinned layers
  const syncedPinned = pinnedLayers.map(p => ({
    ...p,
    isActive: activeLayer?.layerId === p.layerId,
  }));

  return (
    <LayerContext.Provider
      value={{
        activeLayer,
        activateLayer,
        setActiveServiceSubLayer,
        deactivateLayer,
        pinnedLayers: syncedPinned,
        pinLayer,
        unpinLayer,
        toggleVisibility,
        setLayerOpacity,
        getLayerOpacity,
        toggleChildVisibility,
        clearFilters,
        syncINaturalistFilters,
        syncAnimlFilters,
        syncDendraFilters,
        syncTNCArcGISFilters,
        syncDataOneFilters,
        syncCalFloraFilters,
        syncGBIFFilters,
        syncMotusFilters,
        createDendraFilteredView,
        createOrUpdateDataOneFilteredView,
        createOrUpdateCalFloraFilteredView,
        createOrUpdateGBIFFilteredView,
        createOrUpdateMotusFilteredView,
        createOrUpdateDroneView,
        reorderLayers,
        createNewView,
        removeView,
        renameView,
        lastEditFiltersRequest,
        requestEditFilters,
        lastBrowseTabRequest,
        requestBrowseTab,
        lastFiltersClearedTimestamp,
        isLayerPinned,
        isLayerVisible,
        getPinnedByLayerId,
        undoStack,
        undo,
      }}
    >
      {children}
    </LayerContext.Provider>
  );
}

export function useLayers() {
  const ctx = useContext(LayerContext);
  if (!ctx) throw new Error('useLayers must be used within LayerProvider');
  return ctx;
}
