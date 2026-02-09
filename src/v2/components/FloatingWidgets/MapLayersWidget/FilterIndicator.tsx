// ============================================================================
// FilterIndicator — Lucide Filter icon + count badge (DFT-024)
// ============================================================================

import type { MouseEvent as ReactMouseEvent } from 'react';
import { Filter } from 'lucide-react';

interface FilterIndicatorProps {
  count: number;
  onClick?: (e?: ReactMouseEvent) => void;
}

export function FilterIndicator({ count, onClick }: FilterIndicatorProps) {
  const hasFilters = count > 0;
  const label = hasFilters
    ? `${count} filter${count !== 1 ? 's' : ''} applied. Click to edit.`
    : 'No filters. Click to add.';

  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={hasFilters ? `${count} filters applied` : 'No filters — click to add'}
      className={`flex items-center gap-0.5 text-xs cursor-pointer transition-colors flex-shrink-0 ${
        hasFilters ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-300 hover:text-gray-400'
      }`}
    >
      <Filter className="w-3 h-3" />
      {hasFilters && <span>{count}</span>}
    </button>
  );
}
