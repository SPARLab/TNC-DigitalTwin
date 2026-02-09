// ============================================================================
// NewViewButton — "+ New View" button for creating duplicate filtered views
// Appears in nested multi-view structure (DFT-013, DFT-025)
// ============================================================================

import { Plus } from 'lucide-react';

interface NewViewButtonProps {
  onClick: () => void;
}

export function NewViewButton({ onClick }: NewViewButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 ml-6 text-[11px] text-emerald-600 hover:text-emerald-700
                 hover:bg-emerald-50 rounded-md cursor-pointer transition-colors flex items-center gap-1"
      aria-label="Create new filtered view"
    >
      <Plus className="w-3 h-3" />
      New View
    </button>
  );
}
