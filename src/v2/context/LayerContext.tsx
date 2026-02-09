// ============================================================================
// LayerContext — Active layer + Pinned layers state management
// Provides: activateLayer, pinLayer, unpinLayer, toggleVisibility, reorder
// ============================================================================

import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type { ActiveLayer, PinnedLayer, UndoAction, DataSource } from '../types';
import { LAYER_MAP } from '../data/layerRegistry';

interface LayerContextValue {
  // Active layer (one at a time)
  activeLayer: ActiveLayer | null;
  activateLayer: (layerId: string) => void;
  deactivateLayer: () => void;

  // Pinned layers (multiple)
  pinnedLayers: PinnedLayer[];
  pinLayer: (layerId: string) => void;
  unpinLayer: (pinnedId: string) => void;
  toggleVisibility: (pinnedId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  // Helpers
  isLayerPinned: (layerId: string) => boolean;
  isLayerVisible: (layerId: string) => boolean;
  getPinnedByLayerId: (layerId: string) => PinnedLayer | undefined;

  // Undo stack
  undoStack: UndoAction[];
  undo: () => void;
}

const LayerContext = createContext<LayerContextValue | null>(null);

// Pre-pinned dummy layers for Phase 0 demo
const INITIAL_PINNED: PinnedLayer[] = [
  {
    id: 'pinned-1',
    layerId: 'animl-camera-traps',
    name: 'Camera Traps (ANiML)',
    isVisible: true,
    isActive: false,
    filterCount: 0,
    order: 0,
    // Multi-view example (DFT-013)
    views: [
      {
        id: 'view-1',
        name: 'mountain lion',
        isVisible: true,
        filterCount: 3,
        filterSummary: 'species = Mountain Lion, date > 2024-01-01, confidence >= 80%',
      },
      {
        id: 'view-2',
        name: 'deer',
        isVisible: false,
        filterCount: 2,
        filterSummary: 'species = Deer, date > 2024-01-01',
      },
    ],
  },
  {
    id: 'pinned-2',
    layerId: 'fire-perimeters',
    name: 'Fire Perimeters',
    isVisible: true,
    isActive: false,
    filterCount: 0,
    order: 1,
  },
  {
    id: 'pinned-3',
    layerId: 'water-sensors',
    name: 'Water Level Sensors (Dendra)',
    isVisible: false,
    isActive: false,
    filterCount: 2,
    filterSummary: 'date range = Mar 2024, sensor type = Pressure',
    distinguisher: 'Mar 2024',
    order: 2,
  },
];

export function LayerProvider({ children }: { children: ReactNode }) {
  const [activeLayer, setActiveLayer] = useState<ActiveLayer | null>(null);
  const [pinnedLayers, setPinnedLayers] = useState<PinnedLayer[]>(INITIAL_PINNED);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const pushUndo = useCallback((description: string, undoFn: () => void) => {
    setUndoStack(prev => [
      { id: crypto.randomUUID(), description, undo: undoFn, timestamp: Date.now() },
      ...prev,
    ].slice(0, 5)); // DFT-031: max 5 actions
  }, []);

  const activateLayer = useCallback((layerId: string) => {
    const layer = LAYER_MAP.get(layerId);
    if (!layer) return;

    const pinned = pinnedLayers.find(p => p.layerId === layerId);
    setActiveLayer({
      id: layerId,
      layerId,
      name: layer.name,
      dataSource: layer.dataSource as DataSource,
      isPinned: !!pinned,
    });

    // DFT-001: clicking a pinned-but-hidden layer restores visibility
    if (pinned && !pinned.isVisible) {
      setPinnedLayers(prev =>
        prev.map(p => (p.layerId === layerId ? { ...p, isVisible: true } : p))
      );
    }
  }, [pinnedLayers]);

  const deactivateLayer = useCallback(() => setActiveLayer(null), []);

  const pinLayer = useCallback((layerId: string) => {
    const layer = LAYER_MAP.get(layerId);
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
  }, [pinnedLayers, activeLayer]);

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
      prev.map(p => (p.id === pinnedId ? { ...p, isVisible: !p.isVisible } : p))
    );
  }, []);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedLayers(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((p, i) => ({ ...p, order: i }));
    });
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
        reorderLayers,
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
