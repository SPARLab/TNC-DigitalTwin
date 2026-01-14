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
      className="absolute bottom-legend-offset-lg xl:bottom-legend-offset-xl 2xl:bottom-legend-offset-2xl right-legend-offset-lg xl:right-legend-offset-xl 2xl:right-legend-offset-2xl bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-legend-lg xl:w-legend-xl 2xl:w-legend-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-pad-card-lg xl:p-pad-card-xl 2xl:p-pad-card-2xl border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
          <button
            id="legend-expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? "Collapse legend" : "Expand legend"}
            title={isExpanded ? "Collapse legend" : "Expand legend"}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4 2xl:h-4 text-gray-600" />
            )}
          </button>
          <h3 className="text-title-card-lg xl:text-title-card-xl 2xl:text-title-card-2xl text-gray-900">Filter Observations</h3>
        </div>
        {!allVisible && (
          <button
            id="legend-clear-filters"
            onClick={() => onToggleAll(true)}
            className="text-label-lg xl:text-label-xl 2xl:text-label-2xl text-blue-600 hover:text-blue-700"
          >
            Show All
          </button>
        )}
      </div>

      {/* Content - Flat list with colored backgrounds */}
      {isExpanded && (
        <div id="legend-content" className="p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl max-h-72 lg:max-h-72 xl:max-h-80 2xl:max-h-96 overflow-y-auto space-y-gap-tight-lg xl:space-y-gap-tight-xl 2xl:space-y-gap-tight-2xl">
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
                className={`w-full flex items-center justify-between p-pad-card-compact-lg xl:p-pad-card-compact-xl 2xl:p-pad-card-compact-2xl rounded border transition-all ${bgColor}`}
                title={`Click to ${isVisible ? 'filter for only' : 'show'} ${category.name}`}
              >
                <div className="flex items-center gap-gap-tight-lg xl:gap-gap-tight-xl 2xl:gap-gap-tight-2xl">
                  <span className="text-label-lg xl:text-label-xl 2xl:text-label-2xl leading-none">{category.emoji}</span>
                  <span className="text-label-lg xl:text-label-xl 2xl:text-label-2xl text-gray-800">{category.name}</span>
                </div>
                <span className="text-caption-lg xl:text-caption-xl 2xl:text-caption-2xl text-gray-600">{category.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

