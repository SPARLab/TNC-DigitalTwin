// ============================================================================
// CategoryGroup — Collapsible domain category with layer rows.
// Supports nested subcategories (parent → subcategory → layers).
// Dynamically populated from the Data Catalog via CatalogContext.
// ============================================================================

import { useState, useCallback, useMemo, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';
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
  /** Category ids that must stay open for the active/revealed layer path. */
  forceExpandedCategoryIds?: Set<string>;
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

/** True when this category or any nested subcategory owns the active layer. */
function categoryContainsLayer(
  cat: Category,
  layerId: string,
  selectedSubLayerId?: string,
): boolean {
  const matches = (layer: CatalogLayer) =>
    layer.id === layerId || (!!selectedSubLayerId && layer.id === selectedSubLayerId);

  if (cat.layers.some(matches)) return true;
  return cat.subcategories?.some((sub) =>
    categoryContainsLayer(sub, layerId, selectedSubLayerId),
  ) ?? false;
}

/** Find a matching layer in this category's direct layers (not nested subs). */
function findDirectMatchingLayer(
  layers: CatalogLayer[],
  layerId: string,
  selectedSubLayerId?: string,
): CatalogLayer | undefined {
  return layers.find(
    (layer) => layer.id === layerId || (!!selectedSubLayerId && layer.id === selectedSubLayerId),
  );
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
  forceExpandedCategoryIds,
  onAnnounce,
  ariaLevelBase = 1,
  parentTreeItemId,
  isSubcategory
}: CategoryGroupProps) {
  const { activeLayer } = useLayers();

  const containsActiveLayer = useMemo(() => {
    if (forceExpandedCategoryIds?.has(category.id)) return true;
    if (!activeLayer || activeLayer.skipSidebarReveal) return false;
    return categoryContainsLayer(
      category,
      activeLayer.layerId,
      activeLayer.selectedSubLayerId,
    );
  }, [activeLayer, category, forceExpandedCategoryIds]);

  // Open on mount when the active layer already lives under this node (e.g. parent
  // expanded first, then this subcategory mounted after bootstrap activation).
  const [isExpanded, setIsExpanded] = useState(containsActiveLayer);
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
    if (!containsActiveLayer) return;

    setIsExpanded(true);

    if (!activeLayer) return;
    const activeLayerId = activeLayer.layerId;
    const selectedSubLayerId = activeLayer.selectedSubLayerId;

    const matchingDirectLayer = findDirectMatchingLayer(
      directLayers,
      activeLayerId,
      selectedSubLayerId,
    );
    if (!matchingDirectLayer) return;

    const parentServiceId = matchingDirectLayer.catalogMeta?.parentServiceId
      ?? (isServiceParent(matchingDirectLayer) ? matchingDirectLayer.id : undefined);
    if (!parentServiceId) return;

    setExpandedServiceIds(prev => {
      if (prev.has(parentServiceId)) return prev;
      const next = new Set(prev);
      next.add(parentServiceId);
      return next;
    });
  }, [activeLayer, containsActiveLayer, directLayers, isServiceParent]);

  // The tree is flat, like the Live Monitoring list: a plain header row with a light
  // hover. The hover lives on its own div, not the button or the outer wrapper, so it
  // never bleeds into the expanded content, and it avoids the global
  // button:focus { border-color: inherit !important } rule in index.css.
  const headerRowClasses = 'relative hover:bg-gray-50';

  // Top-level categories are separated by a thin rule. Subcategories hang off a thin
  // rail that wraps their header and their layers, so it is clear which layers belong
  // to which subcategory. The rail and a bar on the header turn amber along the path
  // to the layer that is open.
  const outerWrapperClasses = isSubcategory
    ? `ml-3 border-l-2 ${containsActiveLayer ? 'border-amber-400' : 'border-gray-200'} transition-colors`
    : 'border-b border-gray-100';

  // Keep hook call order stable; conditionally render only after hooks run.
  if (shouldHideForSearch) return null;

  return (
    <div id={`category-${category.id}`} className={outerWrapperClasses}>
      {/* Header row — hover visual scoped to this div only */}
      <div className={`transition-colors ${headerRowClasses}`}>
      {!isSubcategory && containsActiveLayer && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-amber-400"
        />
      )}
      <button
        id={`category-toggle-${category.id}`}
        role="treeitem"
        aria-level={ariaLevelBase}
        data-left-sidebar-tree-row="true"
        onClick={toggle}
        onKeyDown={handleHeaderKeyDown}
        className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm font-semibold text-gray-800
                   transition-colors cursor-pointer
                   ${isSubcategory ? 'font-medium' : ''}
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1`}
        aria-expanded={isExpanded}
        aria-controls={`category-children-${category.id}`}
      >
        <ChevronRight
          className={`h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
        <LucideIcon name={category.icon} className="h-3.5 w-3.5 flex-shrink-0 text-gray-500" />
        <span className="min-w-0 flex-1 break-words leading-snug line-clamp-2" title={category.name}>{category.name}</span>
        <span className="flex-shrink-0 text-xs font-medium text-gray-400">
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
            <div className="pb-1">
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
              forceExpandedCategoryIds={forceExpandedCategoryIds}
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
