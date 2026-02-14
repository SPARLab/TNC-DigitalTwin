// ============================================================================
// FilterSection — Expandable multi-select filter section
// Generic component for Species, Cameras, and future dimensions (Date, Spatial).
// Header: chevron + icon + label + selected count badge + "Show All" button.
// Body: optional search (10+ items) + scrollable checkbox list with counts.
// Animated expand/collapse via gridTemplateRows.
// ============================================================================

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';

export interface FilterSectionItem {
  key: string;
  label: string;
  count: number | null;
}

interface FilterSectionProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: FilterSectionItem[];
  selectedKeys: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  defaultExpanded?: boolean;
  searchPlaceholder?: string;
}

export function FilterSection({
  id,
  label,
  icon,
  items,
  selectedKeys,
  onToggle,
  onSelectAll,
  onClear,
  defaultExpanded = false,
  searchPlaceholder = 'Search...',
}: FilterSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [searchText, setSearchText] = useState('');

  const selectedCount = selectedKeys.size;
  const hasFilter = selectedCount > 0;
  const showSearch = items.length >= 10;

  // Filter items by search text
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items;
    const q = searchText.toLowerCase();
    return items.filter(item => item.label.toLowerCase().includes(q));
  }, [items, searchText]);

  return (
    <div id={id} className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header — always visible, toggles expand/collapse */}
      <button
        id={`${id}-header`}
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50
                   hover:bg-slate-100 transition-colors text-left"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}

        <span className="flex-shrink-0 text-gray-500">{icon}</span>

        <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>

        {/* Badge: selected count (emerald) or total count (gray) */}
        {hasFilter ? (
          <span
            id={`${id}-badge`}
            className="bg-emerald-100 text-emerald-700 text-xs font-semibold
                       px-1.5 py-0.5 rounded-full tabular-nums"
          >
            {selectedCount}
          </span>
        ) : (
          <span className="text-xs text-gray-400 tabular-nums">{items.length}</span>
        )}
      </button>

      {/* Body — animated expand/collapse */}
      <div
        id={`${id}-body`}
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="px-3 py-2 space-y-2 border-t border-gray-100">
            {/* Select All / Clear All actions */}
            <div id={`${id}-actions`} className="flex justify-end items-center gap-2">
              <button
                id={`${id}-select-all`}
                onClick={(e) => { e.stopPropagation(); onSelectAll(); }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Select All
              </button>
              <span className="text-gray-300 text-xs select-none">|</span>
              <button
                id={`${id}-clear-all`}
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Search input — shown when 10+ items */}
            {showSearch && (
              <div id={`${id}-search`} className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md
                             bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30
                             focus:border-emerald-400"
                />
              </div>
            )}

            {/* Checkbox list */}
            <div id={`${id}-list`} className="space-y-0.5 max-h-52 overflow-y-auto">
              {filteredItems.map(item => {
                const isChecked = selectedKeys.has(item.key);
                return (
                  <label
                    key={item.key}
                    id={`${id}-item-${item.key}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
                                transition-colors ${
                      isChecked
                        ? 'bg-emerald-50 hover:bg-emerald-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(item.key)}
                      className="w-3.5 h-3.5 text-emerald-600 border-gray-300 rounded
                                 focus:ring-emerald-500"
                    />
                    <span
                      className={`text-sm flex-1 truncate ${
                        isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.count !== null && (
                      <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                        {item.count.toLocaleString()}
                      </span>
                    )}
                  </label>
                );
              })}

              {filteredItems.length === 0 && searchText && (
                <p id={`${id}-no-results`} className="text-xs text-gray-400 text-center py-2">
                  No matches for &ldquo;{searchText}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
