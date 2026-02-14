// ============================================================================
// LayerContext — Active layer + Pinned layers state management
// Provides: activateLayer, pinLayer, unpinLayer, toggleVisibility, reorder
// ============================================================================

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type {
  ActiveLayer,
  PinnedLayer,
  UndoAction,
  DataSource,
  INaturalistViewFilters,
  AnimlViewFilters,
} from '../types';
import { useCatalog } from './CatalogContext';
import { TAXON_CONFIG } from '../components/Map/layers/taxonConfig';

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
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  createNewView: (pinnedId: string) => void;
  removeView: (pinnedId: string, viewId: string) => void;
  renameView: (pinnedId: string, viewId: string, name: string) => void;

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

function buildINaturalistFilterSummary(filters: INaturalistViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.selectedTaxa.length > 0) {
    const taxonText = filters.selectedTaxa.length <= 2
      ? filters.selectedTaxa.join(' + ')
      : `${filters.selectedTaxa.length} taxa selected`;
    parts.push(`Taxa: ${taxonText}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function getINaturalistFilterCount(filters: INaturalistViewFilters): number {
  return filters.selectedTaxa.length + (filters.startDate || filters.endDate ? 1 : 0);
}

const TAXON_LABEL_BY_VALUE = new Map(TAXON_CONFIG.map(t => [t.value, t.label]));

function buildINaturalistViewName(filters: INaturalistViewFilters): string {
  const selectedTaxa = filters.selectedTaxa || [];
  const taxaLabels = selectedTaxa
    .map(taxon => TAXON_LABEL_BY_VALUE.get(taxon) || taxon)
    .sort((a, b) => a.localeCompare(b));

  const taxaPart = taxaLabels.length > 0
    ? (taxaLabels.length <= 3
      ? taxaLabels.join(', ')
      : `${taxaLabels.slice(0, 2).join(', ')}, +${taxaLabels.length - 2} more`)
    : '';

  const hasDate = !!(filters.startDate || filters.endDate);
  const datePart = hasDate
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  if (taxaPart && datePart) return `${taxaPart} (${datePart})`;
  if (taxaPart) return taxaPart;
  if (datePart) return `Date: ${datePart}`;
  return 'All Observations';
}

/** Shallow equality check for iNaturalist filter objects */
function filtersEqual(
  a: INaturalistViewFilters | undefined,
  b: INaturalistViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  if (a.selectedTaxa.length !== b.selectedTaxa.length) return false;
  return a.selectedTaxa.every((t, i) => t === b.selectedTaxa[i]);
}

function buildAnimlFilterSummary(filters: AnimlViewFilters): string | undefined {
  const parts: string[] = [];
  if (filters.selectedAnimals.length > 0) {
    const speciesText = filters.selectedAnimals.length <= 2
      ? filters.selectedAnimals.join(' + ')
      : `${filters.selectedAnimals.length} species selected`;
    parts.push(`Species: ${speciesText}`);
  }
  if (filters.selectedCameras.length > 0) {
    const cameraText = filters.selectedCameras.length === 1
      ? '1 camera'
      : `${filters.selectedCameras.length} cameras`;
    parts.push(`Cameras: ${cameraText}`);
  }
  if (filters.startDate || filters.endDate) {
    const rangeText = `${filters.startDate || 'Any'} to ${filters.endDate || 'Any'}`;
    parts.push(`Date: ${rangeText}`);
  }
  return parts.length > 0 ? parts.join(', ') : undefined;
}

function getAnimlFilterCount(filters: AnimlViewFilters): number {
  return filters.selectedAnimals.length + filters.selectedCameras.length + (filters.startDate || filters.endDate ? 1 : 0);
}

function buildAnimlViewName(filters: AnimlViewFilters): string {
  const speciesPart = filters.selectedAnimals.length > 0
    ? (filters.selectedAnimals.length <= 2
      ? filters.selectedAnimals.join(', ')
      : `${filters.selectedAnimals.slice(0, 2).join(', ')}, +${filters.selectedAnimals.length - 2} more`)
    : '';

  const cameraPart = filters.selectedCameras.length > 0
    ? (filters.selectedCameras.length === 1
      ? '1 camera'
      : `${filters.selectedCameras.length} cameras`)
    : '';

  const hasDate = !!(filters.startDate || filters.endDate);
  const datePart = hasDate
    ? `${filters.startDate || 'Any start'} to ${filters.endDate || 'Any end'}`
    : '';

  const nonDateParts = [speciesPart, cameraPart].filter(Boolean).join(' • ');
  if (nonDateParts && datePart) return `${nonDateParts} (${datePart})`;
  if (nonDateParts) return nonDateParts;
  if (datePart) return `Date: ${datePart}`;
  return 'All Camera Traps';
}

function animlFiltersEqual(
  a: AnimlViewFilters | undefined,
  b: AnimlViewFilters | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.startDate !== b.startDate || a.endDate !== b.endDate) return false;
  if (a.selectedAnimals.length !== b.selectedAnimals.length) return false;
  if (a.selectedCameras.length !== b.selectedCameras.length) return false;
  return a.selectedAnimals.every((s, i) => s === b.selectedAnimals[i])
    && a.selectedCameras.every((c, i) => c === b.selectedCameras[i]);
}

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
              v.id === viewId
                ? {
                    ...v,
                    filterCount: 0,
                    filterSummary: undefined,
                    inaturalistFilters: { selectedTaxa: [], startDate: undefined, endDate: undefined },
                    animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
                  }
                : v
            ),
          };
        }
        return {
          ...p,
          filterCount: 0,
          filterSummary: undefined,
          inaturalistFilters: { selectedTaxa: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          distinguisher: undefined,
        };
      })
    );

    pushUndo('Filters cleared', () => setPinnedLayers(prevState));
  }, [pinnedLayers, pushUndo]);

  const syncINaturalistFilters = useCallback(
    (layerId: string, filters: INaturalistViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: INaturalistViewFilters = {
            selectedTaxa: [...filters.selectedTaxa],
            startDate: filters.startDate,
            endDate: filters.endDate,
          };
          const nextFilterCount = getINaturalistFilterCount(normalizedFilters);
          const nextFilterSummary = buildINaturalistFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildINaturalistViewName(normalizedFilters);
            // Bail out if nothing changed — avoids unnecessary re-renders
            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              filtersEqual(targetView.inaturalistFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      inaturalistFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          // Bail out if nothing changed — avoids unnecessary re-renders
          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            filtersEqual(p.inaturalistFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            inaturalistFilters: normalizedFilters,
            resultCount,
          };
        });

        // If every layer returned the same reference, skip the state update entirely
        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

  const syncAnimlFilters = useCallback(
    (layerId: string, filters: AnimlViewFilters, resultCount: number, viewId?: string) => {
      setPinnedLayers(prev => {
        const nextLayers = prev.map(p => {
          if (p.layerId !== layerId) return p;

          const normalizedFilters: AnimlViewFilters = {
            selectedAnimals: [...filters.selectedAnimals],
            selectedCameras: [...filters.selectedCameras],
            startDate: filters.startDate,
            endDate: filters.endDate,
          };
          const nextFilterCount = getAnimlFilterCount(normalizedFilters);
          const nextFilterSummary = buildAnimlFilterSummary(normalizedFilters);

          if (viewId && p.views) {
            const targetView = p.views.find(v => v.id === viewId);
            const nextViewName = targetView?.isNameCustom
              ? targetView.name
              : buildAnimlViewName(normalizedFilters);

            if (
              targetView &&
              targetView.name === nextViewName &&
              targetView.filterCount === nextFilterCount &&
              targetView.filterSummary === nextFilterSummary &&
              targetView.resultCount === resultCount &&
              animlFiltersEqual(targetView.animlFilters, normalizedFilters)
            ) return p;

            return {
              ...p,
              views: p.views.map(v =>
                v.id === viewId
                  ? {
                      ...v,
                      name: nextViewName,
                      filterCount: nextFilterCount,
                      filterSummary: nextFilterSummary,
                      animlFilters: normalizedFilters,
                      resultCount,
                    }
                  : v
              ),
            };
          }

          if (
            p.filterCount === nextFilterCount &&
            p.filterSummary === nextFilterSummary &&
            p.resultCount === resultCount &&
            animlFiltersEqual(p.animlFilters, normalizedFilters)
          ) return p;

          return {
            ...p,
            filterCount: nextFilterCount,
            filterSummary: nextFilterSummary,
            animlFilters: normalizedFilters,
            resultCount,
          };
        });

        const changed = nextLayers.some((l, i) => l !== prev[i]);
        return changed ? nextLayers : prev;
      });
    },
    []
  );

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
            isNameCustom: false,
            isVisible: false,
            filterCount: 0,
            inaturalistFilters: { selectedTaxa: [], startDate: undefined, endDate: undefined },
            animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          };
          return { ...p, views: [...p.views, newView] };
        }
        
        // Convert flat → nested: current state becomes View 1, add empty View 2
        const view1Name = p.distinguisher || (
          p.layerId === 'animl-camera-traps'
            ? buildAnimlViewName(
              p.animlFilters || { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined }
            )
            : buildINaturalistViewName(
              p.inaturalistFilters || { selectedTaxa: [], startDate: undefined, endDate: undefined }
            )
        );
        const view1 = {
          id: crypto.randomUUID(),
          name: view1Name,
          isNameCustom: !!p.distinguisher,
          isVisible: p.isVisible,
          filterCount: p.filterCount,
          filterSummary: p.filterSummary,
          inaturalistFilters: p.inaturalistFilters,
          animlFilters: p.animlFilters,
          resultCount: p.resultCount,
        };
        const view2 = {
          id: crypto.randomUUID(),
          name: 'Add Filters',
          isNameCustom: false,
          isVisible: false,
          filterCount: 0,
          inaturalistFilters: { selectedTaxa: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
        };
        
        // Clear flat-level filter data (now in views)
        return {
          ...p,
          views: [view1, view2],
          filterCount: 0,
          filterSummary: undefined,
          inaturalistFilters: { selectedTaxa: [], startDate: undefined, endDate: undefined },
          animlFilters: { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined },
          distinguisher: undefined,
          resultCount: undefined,
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
            inaturalistFilters: lastView.inaturalistFilters,
            animlFilters: lastView.animlFilters,
            distinguisher: lastView.isNameCustom ? lastView.name : undefined,
            resultCount: lastView.resultCount,
          };
        }
        
        // Keep as nested with remaining views
        return { ...p, views: remainingViews };
      })
    );
  }, []);

  const renameView = useCallback((pinnedId: string, viewId: string, name: string) => {
    const trimmedName = name.trim();
    setPinnedLayers(prev =>
      prev.map(p => {
        if (p.id !== pinnedId || !p.views) return p;

        const targetView = p.views.find(v => v.id === viewId);
        if (!targetView) return p;

        const autoName = p.layerId === 'animl-camera-traps'
          ? buildAnimlViewName(
            targetView.animlFilters || { selectedAnimals: [], selectedCameras: [], startDate: undefined, endDate: undefined }
          )
          : buildINaturalistViewName(
            targetView.inaturalistFilters || { selectedTaxa: [], startDate: undefined, endDate: undefined }
          );
        const nextName = trimmedName || autoName;
        const nextIsCustom = trimmedName.length > 0;

        if (targetView.name === nextName && !!targetView.isNameCustom === nextIsCustom) {
          return p;
        }

        return {
          ...p,
          views: p.views.map(v =>
            v.id === viewId
              ? { ...v, name: nextName, isNameCustom: nextIsCustom }
              : v
          ),
        };
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
        syncINaturalistFilters,
        syncAnimlFilters,
        reorderLayers,
        createNewView,
        removeView,
        renameView,
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
