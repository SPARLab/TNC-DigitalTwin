// ============================================================================
// CategoryGroup — Collapsible domain category with layer rows
// Includes DataOne shortcut row (DFT-045) when applicable
// ============================================================================

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import type { Category } from '../../types';
import { DATAONE_DOMAIN_COUNTS } from '../../data/layerRegistry';
import { LayerRow } from './LayerRow';
import { useLayers } from '../../context/LayerContext';
import { LucideIcon } from '../shared/LucideIcon';

interface CategoryGroupProps {
  category: Category;
  filteredLayerIds?: Set<string>; // when search is active, only show these
}

export function CategoryGroup({ category, filteredLayerIds }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { activateLayer } = useLayers();

  const visibleLayers = filteredLayerIds
    ? category.layers.filter(l => filteredLayerIds.has(l.id))
    : category.layers;

  // Don't render category if search is active and no layers match
  if (filteredLayerIds && visibleLayers.length === 0) return null;

  const toggle = useCallback(() => setIsExpanded(prev => !prev), []);
  const dataoneCount = DATAONE_DOMAIN_COUNTS[category.id] ?? 0;
  const showDataoneShortcut = isExpanded && dataoneCount > 0 && category.id !== 'research-datasets';

  const handleDataoneClick = () => {
    // DFT-045: activate DataOne with domain pre-filter
    activateLayer('dataone-datasets');
  };

  return (
    <div id={`category-${category.id}`} role="group">
      {/* Category header */}
      <button
        onClick={toggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700
                   hover:bg-gray-50 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        {isExpanded
          ? <ChevronDown className="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 mr-1.5 flex-shrink-0" />
        }
        <LucideIcon name={category.icon} className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{category.name}</span>
        <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 flex-shrink-0">
          {visibleLayers.length}
        </span>
      </button>

      {/* Layer rows + DataOne shortcut */}
      {isExpanded && (
        <div role="group" className="pb-1">
          {visibleLayers.map(layer => (
            <LayerRow key={layer.id} layerId={layer.id} name={layer.name} />
          ))}

          {/* DFT-045: DataOne shortcut row */}
          {showDataoneShortcut && (
            <button
              onClick={handleDataoneClick}
              className="flex items-center w-full py-1.5 px-3 pl-9 mt-1 text-sm text-gray-500 italic
                         hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
              <span>DataOne Datasets ({dataoneCount})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
