// ============================================================================
// PinnedLayersSection — Blue-accented section for all pinned layers
// Supports both flat and nested (multi-view) structures
// Drag-and-drop powered by @dnd-kit (DFT-034)
// ============================================================================

import { useState } from 'react';
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
import type { PinnedLayer } from '../../../types';
import { PinnedLayerRow } from './PinnedLayerRow';

interface PinnedLayersSectionProps {
  layers: PinnedLayer[];
  onToggleVisibility: (pinnedId: string) => void;
  onRemove: (pinnedId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onEditFilters?: (layerId: string, viewId?: string) => void;
  onClearFilters?: (pinnedId: string, viewId?: string) => void;
  onToggleChildView?: (pinnedId: string, viewId: string) => void;
  onCreateNewView?: (pinnedId: string) => void;
}

export function PinnedLayersSection({
  layers,
  onToggleVisibility,
  onRemove,
  onReorder,
  onEditFilters,
  onClearFilters,
  onToggleChildView,
  onCreateNewView,
}: PinnedLayersSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);
  const showDragHandles = layers.length > 1;

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
          <div className="px-2 py-2 space-y-1">
            {layers.length > 0 ? (
              layers.map((layer, index) => (
                <PinnedLayerRow
                  key={layer.id}
                  layer={layer}
                  isExpanded={expandedId === layer.id}
                  showDragHandle={showDragHandles}
                  justDropped={justDroppedId === layer.id}
                  onToggleExpand={() => setExpandedId(prev => prev === layer.id ? null : layer.id)}
                  onToggleVisibility={() => onToggleVisibility(layer.id)}
                  onRemove={() => onRemove(layer.id)}
                  onEditFilters={() => onEditFilters?.(layer.layerId)}
                  onClearFilters={() => onClearFilters?.(layer.id)}
                  onKeyReorder={(dir) => handleKeyReorder(index, dir)}
                  onToggleChildView={(viewId) => onToggleChildView?.(layer.id, viewId)}
                  onEditFiltersForChild={(viewId) => onEditFilters?.(layer.layerId, viewId)}
                  onClearFiltersForChild={(viewId) => onClearFilters?.(layer.id, viewId)}
                  onCreateNewView={() => onCreateNewView?.(layer.id)}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 px-1 py-2">Pinned layers appear here.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
