// ============================================================================
// CategoryGroup — Collapsible domain category with layer rows.
// Supports nested subcategories (parent → subcategory → layers).
// Dynamically populated from the Data Catalog via CatalogContext.
// ============================================================================

import { useState, useCallback, useMemo, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { Category, CatalogLayer } from '../../types';
import { useLayers } from '../../context/LayerContext';
import { LayerRow } from './LayerRow';
import { LucideIcon } from '../shared/LucideIcon';
import { ServiceGroup } from './ServiceGroup';

interface CategoryGroupProps {
  category: Category;
  filteredLayerIds?: Set<string>;
  searchQuery?: string;
  searchAutoExpandServiceIds?: Set<string>;
  onAnnounce?: (message: string) => void;
  ariaLevelBase?: number;
  parentTreeItemId?: string;
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

export function CategoryGroup({
  category,
  filteredLayerIds,
  searchQuery,
  searchAutoExpandServiceIds,
  onAnnounce,
  ariaLevelBase = 1,
  parentTreeItemId,
  isSubcategory
}: CategoryGroupProps) {
  const { activeLayer } = useLayers();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedServiceIds, setExpandedServiceIds] = useState<Set<string>>(new Set());

  const totalVisible = countMatchingLayers(category, filteredLayerIds);
  const shouldHideForSearch = !!filteredLayerIds && totalVisible === 0;

  const toggle = useCallback(() => {
    setIsExpanded(prev => {
      const next = !prev;
      onAnnounce?.(`${category.name} category ${next ? 'expanded' : 'collapsed'}`);
      return next;
    });
  }, [category.name, onAnnounce]);
  const focusFirstVisibleChildRow = useCallback(() => {
    const group = document.getElementById(`category-children-${category.id}`);
    if (!group) return;
    const rows = Array.from(group.querySelectorAll<HTMLElement>('[data-left-sidebar-tree-row="true"]'));
    const firstVisible = rows.find((row) => row.offsetParent !== null);
    firstVisible?.focus();
  }, [category.id]);

  const handleHeaderKeyDown = useCallback((event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      toggle();
      return;
    }
    if (event.key === 'ArrowRight' && isExpanded) {
      event.preventDefault();
      focusFirstVisibleChildRow();
      return;
    }

    if (event.key === 'ArrowLeft' && isExpanded) {
      event.preventDefault();
      toggle();
      return;
    }
    if (event.key === 'ArrowLeft' && !isExpanded && parentTreeItemId) {
      event.preventDefault();
      document.getElementById(parentTreeItemId)?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }, [focusFirstVisibleChildRow, isExpanded, parentTreeItemId, toggle]);

  const directLayers = visibleLayers(category.layers, filteredLayerIds);
  const childRowAriaLevel = ariaLevelBase + 1;
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

  // Visual styling (bg + border) lives on a dedicated header-row div, not the button and
  // not the outer wrapper. This prevents hover from bleeding into expanded content,
  // and avoids the global button:focus { border-color: inherit !important } rule in index.css.
  // The button itself is transparent so the header div's background shows through with no gap.
  const headerRowClasses = isSubcategory
    ? 'relative bg-slate-100 hover:bg-gray-200 border border-transparent hover:border-slate-300 hover:shadow-[1px_0_0_0_rgba(148,163,184,0.95)] hover:z-[20]'
    : 'relative bg-slate-200 hover:bg-gray-300 border border-transparent hover:border-slate-400 hover:shadow-[1px_0_0_0_rgba(100,116,139,0.95)] hover:z-[20]';

  // Outer wrapper only carries the bottom separator between top-level categories.
  const outerWrapperClasses = isSubcategory ? '' : 'border-b border-slate-300';

  // Keep hook call order stable; conditionally render only after hooks run.
  if (shouldHideForSearch) return null;

  return (
    <div id={`category-${category.id}`} className={outerWrapperClasses}>
      {/* Header row — hover visual scoped to this div only */}
      <div className={`transition-colors ${headerRowClasses}`}>
      <button
        id={`category-toggle-${category.id}`}
        role="treeitem"
        aria-level={ariaLevelBase}
        data-left-sidebar-tree-row="true"
        onClick={toggle}
        onKeyDown={handleHeaderKeyDown}
        className={`flex items-center w-full px-3 py-2.5 text-sm font-semibold text-gray-800
                   transition-colors cursor-pointer
                   ${isSubcategory ? 'pl-6 text-xs font-medium' : ''}
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1`}
        aria-expanded={isExpanded}
        aria-controls={`category-children-${category.id}`}
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
      </div>

      {/* Expandable content — layers + subcategories */}
      <div
        id={`category-children-${category.id}`}
        role="group"
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          {/* Direct layers in this category */}
          {directLayers.length > 0 && (
            <div className={`bg-slate-50 py-1.5 space-y-1 ${isSubcategory ? 'pl-3 pr-0' : 'pl-1 pr-0'}`}>
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
                      ariaLevel={childRowAriaLevel}
                      parentTreeItemId={`category-toggle-${category.id}`}
                      isExpanded={expandedServiceIds.has(layer.id) || !!searchAutoExpandServiceIds?.has(layer.id)}
                      highlightQuery={searchQuery}
                      onAnnounce={onAnnounce}
                      onToggleExpand={() => toggleServiceExpand(layer.id)}
                    />
                  );
                }

                return (
                  <LayerRow
                    key={layer.id}
                    layerId={layer.id}
                    name={layer.name}
                    ariaLevel={childRowAriaLevel}
                    parentTreeItemId={`category-toggle-${category.id}`}
                    highlightQuery={searchQuery}
                    onAnnounce={onAnnounce}
                  />
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
              searchQuery={searchQuery}
              searchAutoExpandServiceIds={searchAutoExpandServiceIds}
              onAnnounce={onAnnounce}
              ariaLevelBase={ariaLevelBase + 1}
              parentTreeItemId={`category-toggle-${category.id}`}
              isSubcategory
            />
          ))}
        </div>
      </div>
    </div>
  );
}
