// ============================================================================
// SearchBar — Layer search input with debounce (DFT-035 pattern)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');

  // 500ms debounce, only fires when 2+ chars (or empty to reset)
  useEffect(() => {
    if (value.length === 1) return; // don't search on single char
    const timer = setTimeout(() => onSearch(value), 500);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const clear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div id="layer-search" className="px-3 py-2 border-b border-gray-200">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search layers..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && clear()}
          className="w-full pl-8 pr-8 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md
                     placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {value && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
