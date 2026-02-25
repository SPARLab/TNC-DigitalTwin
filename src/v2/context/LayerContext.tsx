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

  const pinLayer = useCallback((layerId: string) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;
    if (isServiceContainerLayer(layer)) {
      console.warn(`[LayerContext] Skipping pin for service container: ${layerId}`);
      return;
    }
    if (pinnedLayers.some(p => p.layerId === layerId)) return; // already pinned

    const newPinned: PinnedLayer = {
      id: crypto.randomUUID(),
      layerId,
      name: layer.name,
      isVisible: true,
      opacity: layerOpacityById[layerId] ?? 1,
      isActive: activeLayer?.layerId === layerId,
      filterCount: 0,
      order: 0, // new layers go to the top
    };
    // Prepend new layer at top, reorder existing
    setPinnedLayers(prev => [newPinned, ...prev.map((p, i) => ({ ...p, order: i + 1 }))]);

    // Update active layer's isPinned flag
    if (activeLayer?.layerId === layerId) {
      setActiveLayer(prev => prev ? { ...prev, isPinned: true } : null);
    }
  }, [pinnedLayers, activeLayer, layerMap, layerOpacityById]);

  const unpinLayer = useCallback((pinnedId: string) => {
    const target = pinnedLayers.find(p => p.id === pinnedId);
    if (!target) return;

    setPinnedLayers(prev => prev.filter(p => p.id !== pinnedId));

    // Update active layer's isPinned flag
    if (activeLayer?.layerId === target.layerId) {
      setActiveLayer(prev => prev ? { ...prev, isPinned: false } : null);
    }

    // DFT-031: push undo
    pushUndo(`Unpinned ${target.name}`, () => {
      setPinnedLayers(prev => [...prev, target]);
      if (activeLayer?.layerId === target.layerId) {
        setActiveLayer(prev => prev ? { ...prev, isPinned: true } : null);
      }
    });
  }, [pinnedLayers, activeLayer, pushUndo]);

  const toggleVisibility = useCallback((pinnedId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId) return p;
        
        // If nested (has views), handle parent-child visibility relationship
        if (p.views && p.views.length > 0) {
          const turningOn = !p.isVisible;
          
          if (turningOn) {
            // Turning ON: restore the first visible child (or make first child visible if none are)
            const hasVisibleChild = p.views.some(v => v.isVisible);
            if (!hasVisibleChild) {
              // No visible children, turn on the first one
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v, i) => ({ ...v, isVisible: i === 0 })),
              };
            }
            // Has visible child, just turn parent on
            return { ...p, isVisible: true };
          } else {
            // Turning OFF: hide parent and all children
            return {
              ...p,
              isVisible: false,
              views: p.views.map(v => ({ ...v, isVisible: false })),
            };
          }
        }
        
        // For flat layers, just toggle visibility
        return { ...p, isVisible: !p.isVisible };
      })
    );
  }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const clampedOpacity = Math.min(1, Math.max(0, opacity));
    setLayerOpacityById(prev => ({ ...prev, [layerId]: clampedOpacity }));
    setPinnedLayers(prev =>
      prev.map(p => (p.layerId === layerId ? { ...p, opacity: clampedOpacity } : p))
    );
  }, []);

  const getLayerOpacity = useCallback((layerId: string) => {
    const pinnedLayer = pinnedLayers.find(p => p.layerId === layerId);
    if (typeof pinnedLayer?.opacity === 'number') return pinnedLayer.opacity;
    return layerOpacityById[layerId] ?? 1;
  }, [pinnedLayers, layerOpacityById]);

  const toggleChildVisibility = useCallback((pinnedId: string, viewId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId || !p.views) return p;
        const view = p.views.find(v => v.id === viewId);
        if (!view) return p;
        const turningOn = !view.isVisible;
        const nextViews = p.views.map(v => {
          if (v.id === viewId) return { ...v, isVisible: !v.isVisible };
          if (turningOn) return { ...v, isVisible: false }; // DFT-013: mutual exclusivity
          return v;
        });
        const anyVisible = nextViews.some(v => v.isVisible);
        return { ...p, views: nextViews, isVisible: anyVisible };
      })
    );
  }, []);

  const clearFilters = useCallback((pinnedId: string, viewId?: string) => {
    const target = pinnedLayers.find(p => p.id === pinnedId);
    if (!target) return;
    const prevState = JSON.parse(JSON.stringify(pinnedLayers));

    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId) return p;
        if (viewId && p.views) {
          return {
            ...p,
            views: p.views.map(v =>
              v.id === viewId
                ? {
                    ...v,
                    filterCount: 0,
                    filterSummary: undefined,
                    inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
                    animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
                    tncArcgisFilters: { whereClause: '1=1', fields: [] },
                    dendraFilters: {
                      showActiveOnly: false,
                      selectedStationId: undefined,
                      selectedStationName: undefined,
                      selectedDatastreamId: undefined,
                      selectedDatastreamName: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      aggregation: undefined,
                    },
                    dataoneFilters: {
                      searchText: undefined,
                      tncCategory: undefined,
                      tncCategories: [],
                      fileTypes: [],
                      startDate: undefined,
                      endDate: undefined,
                      author: undefined,
                      selectedDatasetId: undefined,
                    },
                    calfloraFilters: {
                      searchText: undefined,
                      county: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      hasPhoto: false,
                      selectedObservationId: undefined,
                      selectedObservationLabel: undefined,
                    },
                    gbifFilters: {
                      searchText: undefined,
                      kingdom: undefined,
                      taxonomicClass: undefined,
                      family: undefined,
                      basisOfRecord: undefined,
                      datasetName: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      selectedOccurrenceId: undefined,
                      selectedOccurrenceLabel: undefined,
                    },
                    motusFilters: {
                      selectedSpecies: undefined,
                      selectedTagId: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      minHitCount: undefined,
                      minMotusFilter: undefined,
                    },
                  }
                : v
            ),
          };
        }
        return {
          ...p,
          filterCount: 0,
          filterSummary: undefined,
          inaturalistFilters: { selectedTaxa: [], selectedSpecies: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          tncArcgisFilters: { whereClause: '1=1', fields: [] },
          dendraFilters: {
            showActiveOnly: false,
            selectedStationId: undefined,
            selectedStationName: undefined,
            selectedDatastreamId: undefined,
            selectedDatastreamName: undefined,
            startDate: undefined,
            endDate: undefined,
            aggregation: undefined,
          },
          dataoneFilters: {
            searchText: undefined,
            tncCategory: undefined,
            tncCategories: [],
            fileTypes: [],
            startDate: undefined,
            endDate: undefined,
            author: undefined,
            selectedDatasetId: undefined,
          },
          calfloraFilters: {
            searchText: undefined,
            county: undefined,
            startDate: undefined,
            endDate: undefined,
            hasPhoto: false,
            selectedObservationId: undefined,
            selectedObservationLabel: undefined,
          },
          gbifFilters: {
            searchText: undefined,
            kingdom: undefined,
            taxonomicClass: undefined,
            family: undefined,
            basisOfRecord: undefined,
            datasetName: undefined,
            startDate: undefined,
            endDate: undefined,
            selectedOccurrenceId: undefined,
            selectedOccurrenceLabel: undefined,
          },
          motusFilters: {
            selectedSpecies: undefined,
            selectedTagId: undefined,
            startDate: undefined,
            endDate: undefined,
            minHitCount: undefined,
            minMotusFilter: undefined,
          },
          distinguisher: undefined,
        };
      })
    );

    pushUndo('Filters cleared', () => setPinnedLayers(prevState));
    setLastFiltersClearedTimestamp(Date.now());
  }, [pinnedLayers, pushUndo]);

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

  const isLayerPinned = useCallback(
    (layerId: string) => pinnedLayers.some(p => p.layerId === layerId),
    [pinnedLayers]
  );

  const isLayerVisible = useCallback(
    (layerId: string) => {
      const pinned = pinnedLayers.find(p => p.layerId === layerId);
      if (pinned) return pinned.isVisible;
      if (!activeLayer) return false;
      if (activeLayer.layerId === layerId) return true;
      return !!(activeLayer.isService && activeLayer.selectedSubLayerId === layerId);
    },
    [pinnedLayers, activeLayer]
  );

  const getPinnedByLayerId = useCallback(
    (layerId: string) => pinnedLayers.find(p => p.layerId === layerId),
    [pinnedLayers]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [action, ...rest] = undoStack;
    action.undo();
    setUndoStack(rest);
  }, [undoStack]);

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
