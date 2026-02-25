import { useCallback } from 'react';
import type { ActiveLayer, CatalogLayer, PinnedLayer, UndoAction } from '../../../types';

type SetPinnedLayers = React.Dispatch<React.SetStateAction<PinnedLayer[]>>;
type SetActiveLayer = React.Dispatch<React.SetStateAction<ActiveLayer | null>>;
type SetLayerOpacityById = React.Dispatch<React.SetStateAction<Record<string, number>>>;
type SetUndoStack = React.Dispatch<React.SetStateAction<UndoAction[]>>;
type SetLastFiltersClearedTimestamp = React.Dispatch<React.SetStateAction<number>>;

interface UseLayerCoreActionsParams {
  activeLayer: ActiveLayer | null;
  pinnedLayers: PinnedLayer[];
  layerMap: Map<string, CatalogLayer>;
  layerOpacityById: Record<string, number>;
  undoStack: UndoAction[];
  setPinnedLayers: SetPinnedLayers;
  setActiveLayer: SetActiveLayer;
  setLayerOpacityById: SetLayerOpacityById;
  setUndoStack: SetUndoStack;
  setLastFiltersClearedTimestamp: SetLastFiltersClearedTimestamp;
  pushUndo: (description: string, undoFn: () => void) => void;
  isServiceContainerLayer: (layer: CatalogLayer | undefined) => boolean;
}

export function useLayerCoreActions({
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
}: UseLayerCoreActionsParams) {
  const pinLayer = useCallback((layerId: string) => {
    const layer = layerMap.get(layerId);
    if (!layer) return;
    if (isServiceContainerLayer(layer)) {
      console.warn(`[LayerContext] Skipping pin for service container: ${layerId}`);
      return;
    }
    if (pinnedLayers.some((p) => p.layerId === layerId)) return;

    const newPinned: PinnedLayer = {
      id: crypto.randomUUID(),
      layerId,
      name: layer.name,
      isVisible: true,
      opacity: layerOpacityById[layerId] ?? 1,
      isActive: activeLayer?.layerId === layerId,
      filterCount: 0,
      order: 0,
    };
    setPinnedLayers((prev) => [newPinned, ...prev.map((p, i) => ({ ...p, order: i + 1 }))]);

    if (activeLayer?.layerId === layerId) {
      setActiveLayer((prev) => (prev ? { ...prev, isPinned: true } : null));
    }
  }, [activeLayer, isServiceContainerLayer, layerMap, layerOpacityById, pinnedLayers, setActiveLayer, setPinnedLayers]);

  const unpinLayer = useCallback((pinnedId: string) => {
    const target = pinnedLayers.find((p) => p.id === pinnedId);
    if (!target) return;

    setPinnedLayers((prev) => prev.filter((p) => p.id !== pinnedId));

    if (activeLayer?.layerId === target.layerId) {
      setActiveLayer((prev) => (prev ? { ...prev, isPinned: false } : null));
    }

    pushUndo(`Unpinned ${target.name}`, () => {
      setPinnedLayers((prev) => [...prev, target]);
      if (activeLayer?.layerId === target.layerId) {
        setActiveLayer((prev) => (prev ? { ...prev, isPinned: true } : null));
      }
    });
  }, [activeLayer, pinnedLayers, pushUndo, setActiveLayer, setPinnedLayers]);

  const toggleVisibility = useCallback((pinnedId: string) => {
    setPinnedLayers((prev) =>
      prev.map((p) => {
        if (p.id !== pinnedId) return p;

        if (p.views && p.views.length > 0) {
          const turningOn = !p.isVisible;
          if (turningOn) {
            const hasVisibleChild = p.views.some((v) => v.isVisible);
            if (!hasVisibleChild) {
              return {
                ...p,
                isVisible: true,
                views: p.views.map((v, i) => ({ ...v, isVisible: i === 0 })),
              };
            }
            return { ...p, isVisible: true };
          }
          return {
            ...p,
            isVisible: false,
            views: p.views.map((v) => ({ ...v, isVisible: false })),
          };
        }

        return { ...p, isVisible: !p.isVisible };
      })
    );
  }, [setPinnedLayers]);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const clampedOpacity = Math.min(1, Math.max(0, opacity));
    setLayerOpacityById((prev) => ({ ...prev, [layerId]: clampedOpacity }));
    setPinnedLayers((prev) =>
      prev.map((p) => (p.layerId === layerId ? { ...p, opacity: clampedOpacity } : p))
    );
  }, [setLayerOpacityById, setPinnedLayers]);

  const getLayerOpacity = useCallback((layerId: string) => {
    const pinnedLayer = pinnedLayers.find((p) => p.layerId === layerId);
    if (typeof pinnedLayer?.opacity === 'number') return pinnedLayer.opacity;
    return layerOpacityById[layerId] ?? 1;
  }, [layerOpacityById, pinnedLayers]);

  const toggleChildVisibility = useCallback((pinnedId: string, viewId: string) => {
    setPinnedLayers((prev) =>
      prev.map((p) => {
        if (p.id !== pinnedId || !p.views) return p;
        const view = p.views.find((v) => v.id === viewId);
        if (!view) return p;
        const turningOn = !view.isVisible;
        const nextViews = p.views.map((v) => {
          if (v.id === viewId) return { ...v, isVisible: !v.isVisible };
          if (turningOn) return { ...v, isVisible: false };
          return v;
        });
        const anyVisible = nextViews.some((v) => v.isVisible);
        return { ...p, views: nextViews, isVisible: anyVisible };
      })
    );
  }, [setPinnedLayers]);

  const clearFilters = useCallback((pinnedId: string, viewId?: string) => {
    const target = pinnedLayers.find((p) => p.id === pinnedId);
    if (!target) return;
    const prevState = JSON.parse(JSON.stringify(pinnedLayers));

    setPinnedLayers((prev) =>
      prev.map((p) => {
        if (p.id !== pinnedId) return p;
        if (viewId && p.views) {
          return {
            ...p,
            views: p.views.map((v) =>
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
  }, [pinnedLayers, pushUndo, setLastFiltersClearedTimestamp, setPinnedLayers]);

  const isLayerPinned = useCallback(
    (layerId: string) => pinnedLayers.some((p) => p.layerId === layerId),
    [pinnedLayers]
  );

  const isLayerVisible = useCallback(
    (layerId: string) => {
      const pinned = pinnedLayers.find((p) => p.layerId === layerId);
      if (pinned) return pinned.isVisible;
      if (!activeLayer) return false;
      if (activeLayer.layerId === layerId) return true;
      return !!(activeLayer.isService && activeLayer.selectedSubLayerId === layerId);
    },
    [activeLayer, pinnedLayers]
  );

  const getPinnedByLayerId = useCallback(
    (layerId: string) => pinnedLayers.find((p) => p.layerId === layerId),
    [pinnedLayers]
  );

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [action, ...rest] = undoStack;
    action.undo();
    setUndoStack(rest);
  }, [setUndoStack, undoStack]);

  return {
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
  };
}
