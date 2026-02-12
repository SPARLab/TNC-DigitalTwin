// ============================================================================
// LayerContext — Active layer + Pinned layers state management
// Provides: activateLayer, pinLayer, unpinLayer, toggleVisibility, reorder
// ============================================================================

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type { ActiveLayer, PinnedLayer, UndoAction, DataSource } from '../types';
import { useCatalog } from './CatalogContext';

interface LayerContextValue {
  // Active layer (one at a time)
  activeLayer: ActiveLayer | null;
  activateLayer: (layerId: string, viewId?: string, featureId?: string | number) => void;
  deactivateLayer: () => void;

  // Pinned layers (multiple)
  pinnedLayers: PinnedLayer[];
  pinLayer: (layerId: string) => void;
  unpinLayer: (pinnedId: string) => void;
  toggleVisibility: (pinnedId: string) => void;
  toggleChildVisibility: (pinnedId: string, viewId: string) => void;
  clearFilters: (pinnedId: string, viewId?: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  createNewView: (pinnedId: string) => void;
  removeView: (pinnedId: string, viewId: string) => void;

  // Edit Filters → open Browse tab (DFT-019)
  lastEditFiltersRequest: number;
  requestEditFilters: () => void;

  // Helpers
  isLayerPinned: (layerId: string) => boolean;
  isLayerVisible: (layerId: string) => boolean;
  getPinnedByLayerId: (layerId: string) => PinnedLayer | undefined;

  // Undo stack
  undoStack: UndoAction[];
  undo: () => void;
}

const LayerContext = createContext<LayerContextValue | null>(null);

export function LayerProvider({ children }: { children: ReactNode }) {
  const { layerMap } = useCatalog();
  const [activeLayer, setActiveLayer] = useState<ActiveLayer | null>(null);
  const [pinnedLayers, setPinnedLayers] = useState<PinnedLayer[]>([]);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const pushUndo = useCallback((description: string, undoFn: () => void) => {
    setUndoStack(prev => [
      { id: crypto.randomUUID(), description, undo: undoFn, timestamp: Date.now() },
      ...prev,
    ].slice(0, 5)); // DFT-031: max 5 actions
  }, []);

  const activateLayer = useCallback((layerId: string, viewId?: string, featureId?: string | number) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;

    const pinned = pinnedLayers.find(p => p.layerId === layerId);
    setActiveLayer({
      id: layerId,
      layerId,
      name: layer.name,
      dataSource: layer.dataSource as DataSource,
      isPinned: !!pinned,
      viewId,
      featureId,
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

  const deactivateLayer = useCallback(() => setActiveLayer(null), []);

  const pinLayer = useCallback((layerId: string) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;
    if (pinnedLayers.some(p => p.layerId === layerId)) return; // already pinned

    const newPinned: PinnedLayer = {
      id: crypto.randomUUID(),
      layerId,
      name: layer.name,
      isVisible: true,
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
  }, [pinnedLayers, activeLayer, layerMap]);

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
              v.id === viewId ? { ...v, filterCount: 0, filterSummary: undefined } : v
            ),
          };
        }
        return { ...p, filterCount: 0, filterSummary: undefined, distinguisher: undefined };
      })
    );

    pushUndo('Filters cleared', () => setPinnedLayers(prevState));
  }, [pinnedLayers, pushUndo]);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedLayers(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((p, i) => ({ ...p, order: i }));
    });
  }, []);

  const createNewView = useCallback((pinnedId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId) return p;
        
        // If already nested, add a new view
        if (p.views && p.views.length > 0) {
          const newView = {
            id: crypto.randomUUID(),
            name: 'Add Filters',
            isVisible: false,
            filterCount: 0,
          };
          return { ...p, views: [...p.views, newView] };
        }
        
        // Convert flat → nested: current state becomes View 1, add empty View 2
        const view1Name = p.distinguisher || (p.filterCount > 0 ? 'Filtered View' : 'Default View');
        const view1 = {
          id: crypto.randomUUID(),
          name: view1Name,
          isVisible: p.isVisible,
          filterCount: p.filterCount,
          filterSummary: p.filterSummary,
        };
        const view2 = {
          id: crypto.randomUUID(),
          name: 'Add Filters',
          isVisible: false,
          filterCount: 0,
        };
        
        // Clear flat-level filter data (now in views)
        return {
          ...p,
          views: [view1, view2],
          filterCount: 0,
          filterSummary: undefined,
          distinguisher: undefined,
        };
      })
    );
  }, []);

  const removeView = useCallback((pinnedId: string, viewId: string) => {
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId || !p.views) return p;
        
        const remainingViews = p.views.filter(v => v.id !== viewId);
        
        // If only one view left, convert back to flat
        if (remainingViews.length === 1) {
          const lastView = remainingViews[0];
          return {
            ...p,
            views: undefined,
            isVisible: lastView.isVisible,
            filterCount: lastView.filterCount,
            filterSummary: lastView.filterSummary,
            distinguisher: lastView.name !== 'View 1' ? lastView.name : undefined,
          };
        }
        
        // Keep as nested with remaining views
        return { ...p, views: remainingViews };
      })
    );
  }, []);

  const isLayerPinned = useCallback(
    (layerId: string) => pinnedLayers.some(p => p.layerId === layerId),
    [pinnedLayers]
  );

  const isLayerVisible = useCallback(
    (layerId: string) => {
      const pinned = pinnedLayers.find(p => p.layerId === layerId);
      return pinned ? pinned.isVisible : activeLayer?.layerId === layerId;
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
        deactivateLayer,
        pinnedLayers: syncedPinned,
        pinLayer,
        unpinLayer,
        toggleVisibility,
        toggleChildVisibility,
        clearFilters,
        reorderLayers,
        createNewView,
        removeView,
        lastEditFiltersRequest,
        requestEditFilters,
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
