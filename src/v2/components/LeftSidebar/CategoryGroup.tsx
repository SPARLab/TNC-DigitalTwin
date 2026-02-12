// ============================================================================
// CategoryGroup — Collapsible domain category with layer rows.
// Supports nested subcategories (parent → subcategory → layers).
// Dynamically populated from the Data Catalog via CatalogContext.
// ============================================================================

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { Category, CatalogLayer } from '../../types';
import { LayerRow } from './LayerRow';
import { LucideIcon } from '../shared/LucideIcon';

interface CategoryGroupProps {
  category: Category;
  filteredLayerIds?: Set<string>;
  /** Render at subcategory depth (indented, no outer border) */
  isSubcategory?: boolean;
}

/** Recursively collect matching layer IDs from a category tree. */
function countMatchingLayers(cat: Category, filter?: Set<string>): number {
  let count = filter
    ? cat.layers.filter(l => filter.has(l.id)).length
    : cat.layers.length;
  if (cat.subcategories) {
    for (const sub of cat.subcategories) {
      count += countMatchingLayers(sub, filter);
    }
  }
  return count;
}

/** Get visible layers for a category (filtered or all). */
function visibleLayers(layers: CatalogLayer[], filter?: Set<string>): CatalogLayer[] {
  return filter ? layers.filter(l => filter.has(l.id)) : layers;
}

export function CategoryGroup({ category, filteredLayerIds, isSubcategory }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalVisible = countMatchingLayers(category, filteredLayerIds);

  // Don't render if search is active and no layers match in this tree
  if (filteredLayerIds && totalVisible === 0) return null;

  const toggle = useCallback(() => setIsExpanded(prev => !prev), []);
  const directLayers = visibleLayers(category.layers, filteredLayerIds);

  // Styling varies by depth
  const headerBgClasses = isSubcategory
    ? 'bg-gray-100 hover:bg-gray-200'
    : 'bg-slate-100 hover:bg-slate-200';
  const borderClasses = isSubcategory ? '' : 'border-b border-gray-300';

  return (
    <div id={`category-${category.id}`} role="group" className={borderClasses}>
      {/* Category header */}
      <button
        id={`category-toggle-${category.id}`}
        onClick={toggle}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle()}
        className={`flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-800
                   ${headerBgClasses} transition-colors cursor-pointer
                   ${isSubcategory ? 'pl-6 text-xs font-medium' : ''}`}
        aria-expanded={isExpanded}
      >
        {isExpanded
          ? <ChevronDown className="w-4 h-4 text-gray-600 mr-1.5 flex-shrink-0 transition-transform duration-200" />
          : <ChevronRight className="w-4 h-4 text-gray-600 mr-1.5 flex-shrink-0 transition-transform duration-200" />
        }
        <LucideIcon name={category.icon} className="w-4 h-4 text-gray-600 mr-2 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{category.name}</span>
        <span className="ml-2 text-xs text-gray-600 bg-white rounded-full px-1.5 py-0.5 flex-shrink-0 font-medium shadow-sm">
          {totalVisible}
        </span>
      </button>

      {/* Expandable content — layers + subcategories */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          {/* Direct layers in this category */}
          {directLayers.length > 0 && (
            <div role="group" className={`bg-gray-50/50 py-1.5 space-y-1 ${isSubcategory ? 'ml-4 mr-2' : 'ml-2 mr-3'}`}>
              {directLayers.map(layer => (
                <LayerRow key={layer.id} layerId={layer.id} name={layer.name} />
              ))}
            </div>
          )}

          {/* Nested subcategories */}
          {category.subcategories?.map(sub => (
            <CategoryGroup
              key={sub.id}
              category={sub}
              filteredLayerIds={filteredLayerIds}
              isSubcategory
            />
          ))}
        </div>
      </div>
    </div>
  );
}
