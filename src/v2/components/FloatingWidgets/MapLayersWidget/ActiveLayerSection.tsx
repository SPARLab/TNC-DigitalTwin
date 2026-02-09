// ============================================================================
// ActiveLayerSection — Amber-accented section for the currently active layer
// Shows eye icon + layer name + [Pin] button
// Hidden when active layer is already pinned (DFT-001)
// ============================================================================

import { Eye, Pin } from 'lucide-react';
import type { ActiveLayer } from '../../../types';

interface ActiveLayerSectionProps {
  activeLayer: ActiveLayer;
  onPin: () => void;
}

export function ActiveLayerSection({ activeLayer, onPin }: ActiveLayerSectionProps) {
  // Don't show if already pinned — it'll appear in the Pinned section instead
  if (activeLayer.isPinned) return null;

  return (
    <div 
      id="active-layer-section" 
      className="overflow-hidden transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-1"
    >
      {/* Section header */}
      <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-1">
        <Eye className="w-3 h-3 text-amber-700" />
        <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
          Active Layer
        </span>
      </div>

      {/* Active layer row */}
      <div className="px-3 py-2.5 flex items-center gap-2 bg-amber-50/50">
        <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm text-gray-800 font-medium flex-1 truncate">
          {activeLayer.name}
        </span>
        <button
          onClick={onPin}
          className="flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-md
                     text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors
                     text-[11px] font-medium"
          title="Pin this layer"
        >
          <Pin className="w-3.5 h-3.5" />
          Pin
        </button>
      </div>
    </div>
  );
}
