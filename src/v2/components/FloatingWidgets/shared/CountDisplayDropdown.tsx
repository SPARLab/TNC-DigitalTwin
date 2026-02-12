// ============================================================================
// CountDisplayDropdown — Testing dropdown for count display modes
// Temporary component for design decision making
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import type { CountDisplayMode } from '../../../types';

interface CountDisplayDropdownProps {
  currentMode: CountDisplayMode;
  onModeChange: (mode: CountDisplayMode) => void;
}

const MODE_LABELS: Record<CountDisplayMode, string> = {
  'none': 'No Counts',
  'filters-only': 'Filter Count Only',
  'results-collapsed': 'Result Count (Collapsed)',
  'results-expanded': 'Result Count (Expanded)',
  'results-children': 'Result Count (Children)',
  'filters-and-results': 'Both (Test)',
};

const MODE_DESCRIPTIONS: Record<CountDisplayMode, string> = {
  'none': 'Hide all counts',
  'filters-only': 'Show number of active filters',
  'results-collapsed': 'Show result count in collapsed row',
  'results-expanded': 'Show result count in expanded panel only',
  'results-children': 'Show result count on child views only',
  'filters-and-results': 'Show both filters and results (comparison)',
};

export function CountDisplayDropdown({ currentMode, onModeChange }: CountDisplayDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleModeSelect = (mode: CountDisplayMode) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Settings button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        title="Count display options (design testing)"
        aria-label="Count display settings"
        aria-expanded={isOpen}
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          id="count-display-dropdown"
          className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          role="menu"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700">Count Display Mode</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Testing different display options</p>
          </div>

          {/* Menu items */}
          {(Object.keys(MODE_LABELS) as CountDisplayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeSelect(mode)}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                currentMode === mode ? 'bg-emerald-50' : ''
              }`}
              role="menuitem"
            >
              <div className="flex items-start gap-2">
                {/* Checkmark for current mode */}
                <div className="flex-shrink-0 w-4 mt-0.5">
                  {currentMode === mode && (
                    <span className="text-emerald-600 text-sm">✓</span>
                  )}
                </div>

                {/* Label and description */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${
                    currentMode === mode ? 'font-semibold text-emerald-700' : 'font-medium text-gray-700'
                  }`}>
                    {MODE_LABELS[mode]}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {MODE_DESCRIPTIONS[mode]}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
