// ============================================================================
// WidgetHeader — Title + undo + collapse/close buttons (DFT-031)
// ============================================================================

import { Minus, Plus, X, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface WidgetHeaderProps {
  icon: ReactNode;
  title: string;
  count?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Undo (DFT-031)
  canUndo: boolean;
  undoDescription?: string;
  onUndo: () => void;
  // Optional close button (Bookmarked Items has it, Map Layers does not)
  onClose?: () => void;
}

export function WidgetHeader({
  icon,
  title,
  count,
  isCollapsed,
  onToggleCollapse,
  canUndo,
  undoDescription,
  onUndo,
  onClose,
}: WidgetHeaderProps) {
  return (
    <div
      id={`${title.replace(/\s/g, '-').toLowerCase()}-header`}
      className={`flex items-center justify-between px-4 py-2.5 bg-slate-50 transition-all duration-300 ${
        isCollapsed 
          ? 'rounded-xl' // Rounded corners on all sides when collapsed
          : 'rounded-t-xl' // Top corners + bottom border when expanded
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-gray-500 flex-shrink-0">{icon}</span>
        <span className="text-sm font-semibold text-gray-900 truncate">
          {title}
          {isCollapsed && count !== undefined && count > 0 && (
            <span className="ml-1 text-gray-500">({count})</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Undo button — always visible, grayed when inactive */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title={canUndo ? `Undo: ${undoDescription}` : 'No actions to undo'}
          className={`p-1 rounded transition-colors ${
            canUndo
              ? 'text-emerald-600 hover:text-emerald-700 cursor-pointer'
              : 'text-gray-400 opacity-40 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
        </button>

        {/* Optional close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
