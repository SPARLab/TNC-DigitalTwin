// ============================================================================
// CategoryGroup — Collapsible domain category with layer rows.
// Supports nested subcategories (parent → subcategory → layers).
// Dynamically populated from the Data Catalog via CatalogContext.
// ============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { Category, CatalogLayer } from '../../types';
import { useLayers } from '../../context/LayerContext';
import { LayerRow } from './LayerRow';
import { LucideIcon } from '../shared/LucideIcon';
import { ServiceGroup } from './ServiceGroup';

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
  const { activeLayer } = useLayers();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set());

  const totalVisible = countMatchingLayers(category, filteredLayerIds);
  const shouldHideForSearch = !!filteredLayerIds && totalVisible === 0;

  const toggle = useCallback(() => setIsExpanded(prev => !prev), []);
  const directLayers = visibleLayers(category.layers, filteredLayerIds);
  const toggleServiceExpand = useCallback((serviceId: string) => {
    setExpandedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, []);

  const isServiceParent = useCallback((layer: CatalogLayer) => {
    return !!(
      layer.catalogMeta?.isMultiLayerService &&
      !layer.catalogMeta.parentServiceId &&
      layer.catalogMeta.siblingLayers &&
      layer.catalogMeta.siblingLayers.length > 0
    );
  }, []);

  const childrenByServiceId = useMemo(() => {
    const map = new Map<string, CatalogLayer[]>();
    for (const layer of directLayers) {
      const parentServiceId = layer.catalogMeta?.parentServiceId;
      if (!parentServiceId) continue;
      const children = map.get(parentServiceId) ?? [];
      children.push(layer);
      map.set(parentServiceId, children);
    }
    return map;
  }, [directLayers]);

  useEffect(() => {
    if (!activeLayer) return;
    const activeLayerId = activeLayer.layerId;
    const selectedSubLayerId = activeLayer.selectedSubLayerId;
    const matchingDirectLayer = directLayers.find(
      layer => layer.id === activeLayerId || (!!selectedSubLayerId && layer.id === selectedSubLayerId),
    );
    if (!matchingDirectLayer) return;

    setIsExpanded(true);

    const parentServiceId = matchingDirectLayer.catalogMeta?.parentServiceId
      ?? (isServiceParent(matchingDirectLayer) ? matchingDirectLayer.id : undefined);
    if (!parentServiceId) return;

    setExpandedServiceIds(prev => {
      if (prev.has(parentServiceId)) return prev;
      const next = new Set(prev);
      next.add(parentServiceId);
      return next;
    });
  }, [activeLayer, directLayers, isServiceParent]);

  // Styling varies by depth
  const headerBgClasses = isSubcategory
    ? 'bg-gray-100 hover:bg-gray-200'
    : 'bg-slate-100 hover:bg-slate-200';
  const borderClasses = isSubcategory ? '' : 'border-b border-gray-300';

  // Keep hook call order stable; conditionally render only after hooks run.
  if (shouldHideForSearch) return null;

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
            <div role="group" className={`bg-gray-50/50 py-1.5 space-y-1 ${isSubcategory ? 'ml-3 mr-1' : 'ml-1 mr-1'}`}>
              {directLayers.map(layer => {
                if (layer.catalogMeta?.parentServiceId) return null;

                if (isServiceParent(layer)) {
                  const childRows = childrenByServiceId.get(layer.id) ?? [];
                  const metaChildren = layer.catalogMeta?.siblingLayers ?? [];
                  const mergedChildren = new Map<string, CatalogLayer>();

                  for (const child of [...childRows, ...metaChildren]) {
                    if (child.id === layer.id) continue;
                    if (child.catalogMeta?.parentServiceId !== layer.id) continue;
                    mergedChildren.set(child.id, child);
                  }

                  const serviceLayers = Array.from(mergedChildren.values()).sort((a, b) => {
                    const aLayerId = a.catalogMeta?.layerIdInService ?? Number.MAX_SAFE_INTEGER;
                    const bLayerId = b.catalogMeta?.layerIdInService ?? Number.MAX_SAFE_INTEGER;
                    if (aLayerId !== bLayerId) return aLayerId - bLayerId;
                    return a.name.localeCompare(b.name);
                  });

                  if (serviceLayers.length === 0) {
                    return (
                      <LayerRow key={layer.id} layerId={layer.id} name={layer.name} />
                    );
                  }
                  return (
                    <ServiceGroup
                      key={layer.id}
                      service={layer}
                      layers={serviceLayers}
                      isExpanded={expandedServiceIds.has(layer.id)}
                      onToggleExpand={() => toggleServiceExpand(layer.id)}
                    />
                  );
                }

                return (
                  <LayerRow key={layer.id} layerId={layer.id} name={layer.name} />
                );
              })}
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
