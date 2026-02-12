// ============================================================================
// PinnedLayersSection — Blue-accented section for all pinned layers
// Supports both flat and nested (multi-view) structures
// Drag-and-drop powered by @dnd-kit (DFT-034)
// ============================================================================

import { useState, useEffect } from 'react';
import { Pin } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { PinnedLayer, CountDisplayMode } from '../../../types';
import { PinnedLayerRow } from './PinnedLayerRow';

interface PinnedLayersSectionProps {
  layers: PinnedLayer[];
  activeLayerId?: string; // NEW: which layer is currently active
  activeViewId?: string; // NEW: which child view is currently active (for nested layers)
  countDisplayMode: CountDisplayMode; // NEW: how to display counts
  onToggleVisibility: (pinnedId: string) => void;
  onRemove: (pinnedId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onActivate?: (layerId: string) => void; // NEW: activate a layer (show in right sidebar)
  onActivateView?: (layerId: string, viewId: string) => void; // NEW: activate a child view
  onEditFilters?: (layerId: string, viewId?: string) => void;
  onClearFilters?: (pinnedId: string, viewId?: string) => void;
  onToggleChildView?: (pinnedId: string, viewId: string) => void;
  onCreateNewView?: (pinnedId: string) => void;
  onRemoveView?: (pinnedId: string, viewId: string) => void;
}

export function PinnedLayersSection({
  layers,
  activeLayerId,
  activeViewId,
  countDisplayMode,
  onToggleVisibility,
  onRemove,
  onReorder,
  onActivate,
  onActivateView,
  onEditFilters,
  onClearFilters,
  onToggleChildView,
  onCreateNewView,
  onRemoveView,
}: PinnedLayersSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
  const [justPinnedId, setJustPinnedId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [lastActiveLayerId, setLastActiveLayerId] = useState<string | null>(null);
  const [prevLayerIds, setPrevLayerIds] = useState<Set<string>>(new Set());
  const showDragHandles = layers.length > 1;

  const EXIT_DURATION_MS = 400;

  // Remove with exit animation: collapse + fade, then actually remove
  const handleRemove = (pinnedId: string) => {
    setExitingId(pinnedId);
    setTimeout(() => {
      onRemove(pinnedId);
      setExitingId(null);
    }, EXIT_DURATION_MS);
  };

  // Auto-expand when active layer changes (but only on first activation)
  useEffect(() => {
    if (activeLayerId && activeLayerId !== lastActiveLayerId) {
      // Active layer changed to a new layer
      setLastActiveLayerId(activeLayerId);
      const activePinned = layers.find(l => l.layerId === activeLayerId);
      if (activePinned) {
        // Active layer IS pinned → expand it (only on first activation)
        setExpandedId(activePinned.id);
      } else {
        // Active layer is not in pinned list → collapse all
        setExpandedId(null);
      }
    }
  }, [activeLayerId, lastActiveLayerId, layers]);

  // Detect newly pinned layers and trigger slide-down animation
  useEffect(() => {
    const currentIds = new Set(layers.map(l => l.id));
    
    // Find new layer IDs (present in current but not in previous)
    const newIds = layers.filter(l => !prevLayerIds.has(l.id)).map(l => l.id);
    
    if (newIds.length > 0) {
      // New layer(s) were added - trigger animation for the first one
      const newId = newIds[0];
      setJustPinnedId(newId);
      setTimeout(() => setJustPinnedId(null), 400); // Match animation duration
    }
    
    // Update previous IDs for next comparison
    setPrevLayerIds(currentIds);
  }, [layers]); // Remove prevLayerIds from dependencies to prevent infinite loop

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px threshold to prevent accidental drags on click
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Keyboard reorder: move layer up/down via arrow keys on drag handle
  const handleKeyReorder = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < layers.length) onReorder(index, target);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = layers.findIndex(l => l.id === active.id);
    const newIndex = layers.findIndex(l => l.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
      
      // Trigger settle animation
      setJustDroppedId(active.id as string);
      setTimeout(() => setJustDroppedId(null), 400);

      // TODO (Task 0.4): Sync map layer z-order after reorder (debounced 300ms)
      // TODO (Task 0.4): Show toast notification: "Map layer order updated"
    }
  };

  return (
    <div id="pinned-layers-section">
      {/* Section header */}
      <div className="px-3 py-1.5 bg-blue-50 border-y border-blue-200 flex items-center gap-1">
        <Pin className="w-3 h-3 text-blue-700" />
        <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
          Pinned Layers
        </span>
        <span className="bg-blue-200 text-blue-800 px-1.5 rounded-full text-[10px] ml-1">
          {layers.length}
        </span>
      </div>

      {/* Layer rows */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={layers.map(l => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div id="pinned-layers-list" className="px-2 py-2 space-y-1">
            {layers.length > 0 ? (
              layers.map((layer, index) => {
                const isJustPinned = justPinnedId === layer.id;
                const isExiting = exitingId === layer.id;
                const row = (
                  <PinnedLayerRow
                    key={layer.id}
                    layer={layer}
                    isExpanded={expandedId === layer.id}
                    showDragHandle={showDragHandles}
                    justDropped={justDroppedId === layer.id}
                    justPinned={isJustPinned}
                    countDisplayMode={countDisplayMode}
                    onToggleExpand={() => setExpandedId(prev => prev === layer.id ? null : layer.id)}
                    onToggleVisibility={() => onToggleVisibility(layer.id)}
                    onRemove={() => handleRemove(layer.id)}
                    onActivate={() => onActivate?.(layer.layerId)}
                    onEditFilters={() => onEditFilters?.(layer.layerId)}
                    onClearFilters={() => onClearFilters?.(layer.id)}
                    onKeyReorder={(dir) => handleKeyReorder(index, dir)}
                    onToggleChildView={(viewId: string) => onToggleChildView?.(layer.id, viewId)}
                    onEditFiltersForChild={(viewId: string) => onEditFilters?.(layer.layerId, viewId)}
                    onClearFiltersForChild={(viewId: string) => onClearFilters?.(layer.id, viewId)}
                    onActivateChildView={(viewId: string) => onActivateView?.(layer.layerId, viewId)}
                    onCreateNewView={() => onCreateNewView?.(layer.id)}
                    onRemoveChildView={(viewId: string) => onRemoveView?.(layer.id, viewId)}
                    activeViewId={activeLayerId === layer.layerId ? activeViewId : undefined}
                  />
                );
                const collapseWrapper = (
                  <div
                    key={layer.id}
                    id={isExiting ? undefined : `pinned-row-wrapper-${layer.id}`}
                    className={`pin-row-wrapper${isExiting ? ' pin-row-exit' : ''}`}
                  >
                    {row}
                  </div>
                );
                if (isJustPinned) {
                  return (
                    <div
                      key={layer.id}
                      id={`pinned-row-expand-wrapper-${layer.id}`}
                      className="overflow-hidden animate-pin-row-expand"
                    >
                      {collapseWrapper}
                    </div>
                  );
                }
                return collapseWrapper;
              })
            ) : (
              <p className="text-sm text-gray-500 px-1 py-2">Pinned layers appear here.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
