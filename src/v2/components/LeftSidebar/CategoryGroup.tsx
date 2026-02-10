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
    <div id={`category-${category.id}`} role="group" className="border-b border-gray-300">
      {/* Category header — persistent banner background */}
      <button
        onClick={toggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-800
                   bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
      >
        {isExpanded
          ? <ChevronDown className="w-4 h-4 text-gray-600 mr-1.5 flex-shrink-0 transition-transform duration-200" />
          : <ChevronRight className="w-4 h-4 text-gray-600 mr-1.5 flex-shrink-0 transition-transform duration-200" />
        }
        <LucideIcon name={category.icon} className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{category.name}</span>
        <span className="ml-2 text-xs text-gray-600 bg-white rounded-full px-1.5 py-0.5 flex-shrink-0 font-medium shadow-sm">
          {visibleLayers.length}
        </span>
      </button>

      {/* Layer rows + DataOne shortcut — smooth collapse/expand animation */}
      <div 
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div role="group" className="bg-gray-50/50 ml-2 mr-3 py-1.5 space-y-1">
            {visibleLayers.map(layer => (
              <LayerRow key={layer.id} layerId={layer.id} name={layer.name} />
            ))}

          {/* DFT-045: DataOne shortcut row — styled as a layer card */}
          {showDataoneShortcut && (
            <button
              onClick={handleDataoneClick}
              className="w-full flex items-center gap-1.5 py-[9px] px-3 mx-1 text-sm text-gray-700 italic
                         bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm 
                         rounded-lg transition-all duration-200 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-left">DataOne Datasets ({dataoneCount})</span>
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
