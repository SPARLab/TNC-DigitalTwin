// ============================================================================
// FilterIndicator — Lucide Filter icon + count badge (DFT-024)
// ============================================================================

import type { MouseEvent as ReactMouseEvent } from 'react';
import { Filter } from 'lucide-react';

interface FilterIndicatorProps {
  count?: number; // undefined = parent row (show icon only, no count)
  onClick?: (e?: ReactMouseEvent) => void;
}

export function FilterIndicator({ count, onClick }: FilterIndicatorProps) {
  const hasFilters = count !== undefined && count > 0;
  const isParent = count === undefined;
  
  const label = isParent
    ? 'Contains filtered views — click to expand'
    : hasFilters
    ? `${count} filter${count !== 1 ? 's' : ''} applied. Click to view.`
    : 'No filters. Click to add.';

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center gap-0.5 text-xs cursor-pointer transition-colors flex-shrink-0 ${
        hasFilters ? 'text-emerald-600 hover:text-emerald-700' : 
        isParent ? 'text-gray-400 hover:text-gray-500' :
        'text-gray-300 hover:text-gray-400'
      }`}
    >
      <Filter className="w-3 h-3" />
      {count !== undefined && hasFilters && <span>{count}</span>}
    </button>
  );
}
