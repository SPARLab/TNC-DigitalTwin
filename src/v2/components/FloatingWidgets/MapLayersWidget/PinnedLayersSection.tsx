// ============================================================================
// PinnedLayersSection — Blue-accented section for all pinned layers
// Supports both flat and nested (multi-view) structures
// ============================================================================

import { useState } from 'react';
import { Pin } from 'lucide-react';
import type { PinnedLayer } from '../../../types';
import { PinnedLayerRow } from './PinnedLayerRow';

interface PinnedLayersSectionProps {
  layers: PinnedLayer[];
  onToggleVisibility: (pinnedId: string) => void;
  onRemove: (pinnedId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onCreateNewView?: (pinnedId: string) => void;
  onToggleChildView?: (pinnedId: string, viewId: string) => void;
}

export function PinnedLayersSection({
  layers,
  onToggleVisibility,
  onRemove,
  onReorder,
  onCreateNewView,
  onToggleChildView,
}: PinnedLayersSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const showDragHandles = layers.length > 1;

  // Keyboard reorder: move layer up/down via arrow keys on drag handle
  const handleKeyReorder = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < layers.length) onReorder(index, target);
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
      <div className="px-2 py-2 space-y-1">
        {layers.length > 0 ? (
          layers.map((layer, index) => (
            <PinnedLayerRow
              key={layer.id}
              layer={layer}
              isExpanded={expandedId === layer.id}
              showDragHandle={showDragHandles}
              onToggleExpand={() => setExpandedId(prev => prev === layer.id ? null : layer.id)}
              onToggleVisibility={() => onToggleVisibility(layer.id)}
              onRemove={() => onRemove(layer.id)}
              onKeyReorder={(dir) => handleKeyReorder(index, dir)}
              onCreateNewView={() => onCreateNewView?.(layer.id)}
              onToggleChildView={(viewId) => onToggleChildView?.(layer.id, viewId)}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500 px-1 py-2">Pinned layers appear here.</p>
        )}
      </div>
    </div>
  );
}
