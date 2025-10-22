import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TaxonCategory {
  key: string;
  name: string;
  emoji: string;
  count: number;
  group: 'fauna' | 'flora';
}

interface MapLegendProps {
  categories: TaxonCategory[];
  visibleCategories: Set<string>;
  onToggleCategory: (categoryKey: string) => void;
  onToggleAll: (visible: boolean) => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  categories,
  visibleCategories,
  onToggleCategory,
  onToggleAll
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (categories.length === 0) return null;

  const allVisible = categories.length > 0 && categories.every(cat => visibleCategories.has(cat.key));

  return (
    <div
      id="map-legend"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-52"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <button
            id="legend-expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? "Collapse legend" : "Expand legend"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <h3 className="text-sm font-semibold text-gray-900">Filter Observations</h3>
        </div>
        {!allVisible && (
          <button
            id="legend-clear-filters"
            onClick={() => onToggleAll(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Show All
          </button>
        )}
      </div>

      {/* Content - Flat list with colored backgrounds */}
      {isExpanded && (
        <div id="legend-content" className="p-2 max-h-96 overflow-y-auto space-y-1">
          {categories.map(category => {
            const isVisible = visibleCategories.has(category.key);
            const bgColor = category.group === 'fauna' 
              ? (isVisible ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' : 'bg-gray-100 hover:bg-gray-150 border-gray-200 opacity-50')
              : (isVisible ? 'bg-green-50 hover:bg-green-100 border-green-200' : 'bg-gray-100 hover:bg-gray-150 border-gray-200 opacity-50');
            
            return (
              <button
                key={category.key}
                id={`legend-item-${category.key}`}
                onClick={() => onToggleCategory(category.key)}
                className={`w-full flex items-center justify-between p-2 rounded border transition-all ${bgColor}`}
                title={`Click to ${isVisible ? 'filter for only' : 'show'} ${category.name}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{category.emoji}</span>
                  <span className="text-xs font-medium text-gray-800">{category.name}</span>
                </div>
                <span className="text-xs text-gray-600 font-medium">{category.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

