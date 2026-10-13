// ============================================================================
// RasterAvailabilityCatalog — searchable, collapsible category tree of analysis
// products; greys out families incompatible with the current extent/resolution.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Plus, Search, Star } from 'lucide-react';
import { useCatalogOptional } from '../../../context/CatalogContext';
import { useLayersOptional } from '../../../context/LayerContext';
import type { CatalogLayer, Category } from '../../../types';
import { datasetIdsFromPinnedLayers } from '../pinnedRasterDatasets';
import type { CatalogRaster, RasterScope } from '../types';
import { RASTER_SCOPE_OPTIONS } from '../types';
import {
  availabilityByScope,
  findVariantForSelection,
  groupRastersIntoFamilies,
  type RasterFamily,
} from './rasterFamilies';
import { formatResolutionLabel } from './wizardCopy';

interface RasterAvailabilityCatalogProps {
  rasters: CatalogRaster[];
  isLoading: boolean;
  error: string | null;
  scope: RasterScope;
  resolution: number | null;
  selectedIds: Set<number>;
  onAdd: (raster: CatalogRaster) => void;
  onRemove: (id: number) => void;
}

interface LayerGroup {
  key: string;
  label: string;
  items: RasterFamily[];
  children: LayerGroup[];
  starred?: boolean;
}

function indexDatasetCategories(
  layerMap: Map<string, CatalogLayer>,
): Map<number, Set<string>> {
  const byDataset = new Map<number, Set<string>>();
  for (const layer of layerMap.values()) {
    const datasetId = layer.catalogMeta?.datasetId;
    if (datasetId == null || !layer.categoryId) continue;
    const ids = byDataset.get(datasetId) ?? new Set<string>();
    ids.add(layer.categoryId);
    byDataset.set(datasetId, ids);
  }
  return byDataset;
}

/** Deepest catalog path that contains one of these category ids. Root first. */
function findCatalogPath(
  categoryIds: Set<string>,
  categories: Category[],
): Category[] | null {
  let best: Category[] | null = null;

  const walk = (nodes: Category[], path: Category[]) => {
    for (const node of nodes) {
      const next = [...path, node];
      if (categoryIds.has(node.id) && (!best || next.length > best.length)) {
        best = next;
      }
      if (node.subcategories?.length) walk(node.subcategories, next);
    }
  };

  walk(categories, []);
  return best;
}

function placementForFamily(
  family: RasterFamily,
  datasetCategories: Map<number, Set<string>>,
  categories: Category[],
): Category[] | null {
  let best: Category[] | null = null;
  for (const raster of family.variants) {
    if (raster.datasetId == null) continue;
    const categoryIds = datasetCategories.get(raster.datasetId);
    if (!categoryIds) continue;
    const path = findCatalogPath(categoryIds, categories);
    if (path && (!best || path.length > best.length)) best = path;
  }
  return best;
}

function countFamilies(group: LayerGroup): number {
  return group.items.length + group.children.reduce((sum, child) => sum + countFamilies(child), 0);
}

/** Parent categories from the Data Catalog, with subcategory groups underneath. */
function groupFamiliesByCatalog(
  families: RasterFamily[],
  categories: Category[],
  datasetCategories: Map<number, Set<string>>,
): LayerGroup[] {
  const parents = new Map<string, LayerGroup>();
  const unplaced = new Map<string, RasterFamily[]>();

  const ensureParent = (category: Category): LayerGroup => {
    const existing = parents.get(category.id);
    if (existing) return existing;
    const group: LayerGroup = {
      key: category.id,
      label: category.name,
      items: [],
      children: [],
    };
    parents.set(category.id, group);
    return group;
  };

  const ensureAlongPath = (path: Category[]): LayerGroup => {
    const root = ensureParent(path[0]);
    let group = root;
    for (const category of path.slice(1)) {
      let child = group.children.find((entry) => entry.key === category.id);
      if (!child) {
        child = {
          key: category.id,
          label: category.name,
          items: [],
          children: [],
        };
        group.children.push(child);
      }
      group = child;
    }
    return group;
  };

  for (const family of families) {
    const path = placementForFamily(family, datasetCategories, categories);
    if (!path) {
      const bucket = unplaced.get(family.thematicCategory) ?? [];
      bucket.push(family);
      unplaced.set(family.thematicCategory, bucket);
      continue;
    }
    ensureAlongPath(path).items.push(family);
  }

  const sortChildren = (group: LayerGroup, category: Category | undefined) => {
    const order = new Map(
      (category?.subcategories ?? []).map((child, index) => [child.id, index]),
    );
    group.children.sort(
      (a, b) => (order.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.key) ?? Number.MAX_SAFE_INTEGER),
    );
    for (const child of group.children) {
      sortChildren(child, category?.subcategories?.find((entry) => entry.id === child.key));
    }
  };

  const ordered = categories
    .map((category) => {
      const group = parents.get(category.id);
      if (group) sortChildren(group, category);
      return group;
    })
    .filter((group): group is LayerGroup => !!group && countFamilies(group) > 0);

  const leftovers = [...unplaced.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({
      key: `theme-${label}`,
      label,
      items,
      children: [],
    }));

  return [...ordered, ...leftovers];
}

function formatAvailability(family: RasterFamily): string {
  return availabilityByScope(family)
    .map((entry) => {
      const shortLabel =
        entry.scope === 'preserve'
          ? 'Preserve'
          : entry.scope === 'sbcounty'
            ? 'County'
            : 'Tri-County';
      return `${shortLabel}: ${entry.resolutions.map(formatResolutionLabel).join(', ')}`;
    })
    .join(' · ');
}

function CategorySection({
  group,
  depth = 0,
  forceExpanded,
  scope,
  resolution,
  selectedIds,
  favoriteDatasetIds,
  scopeLabel,
  onAdd,
  onRemove,
}: {
  group: LayerGroup;
  depth?: number;
  forceExpanded: boolean;
  scope: RasterScope;
  resolution: number | null;
  selectedIds: Set<number>;
  favoriteDatasetIds: Set<number>;
  scopeLabel: string;
  onAdd: (raster: CatalogRaster) => void;
  onRemove: (id: number) => void;
}) {
  const [isExpanded, setExpanded] = useState(forceExpanded || group.starred === true);

  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  const countSelected = (node: LayerGroup): number => {
    if (resolution == null) return 0;
    const direct = node.items.reduce((count, family) => {
      const match = findVariantForSelection(family, scope, resolution);
      return match && selectedIds.has(match.id) ? count + 1 : count;
    }, 0);
    return direct + node.children.reduce((sum, child) => sum + countSelected(child), 0);
  };
  const selectedCount = countSelected(group);
  const totalCount = countFamilies(group);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={isExpanded}
        className={`flex w-full items-center gap-2 py-2.5 pr-3 text-left transition-colors hover:bg-gray-50 ${
          depth > 0 ? 'bg-gray-50/80' : 'bg-white'
        } ${group.starred ? 'bg-amber-50/70' : ''}`}
        style={depth > 0 ? { paddingLeft: 12 + depth * 16 } : { paddingLeft: 12 }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500" />
        )}
        {group.starred && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-500 text-amber-500" />}
        <span className={`min-w-0 flex-1 text-sm ${depth > 0 ? 'font-medium text-gray-700' : 'font-semibold text-gray-800'} ${group.starred ? 'text-amber-900' : ''}`}>
          {group.label}
        </span>
        <span className="text-xs text-gray-500">
          {selectedCount > 0 ? `${selectedCount}/` : ''}
          {totalCount}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-white">
          {group.children.map((child) => (
            <CategorySection
              key={child.key}
              group={child}
              depth={depth + 1}
              forceExpanded={forceExpanded}
              scope={scope}
              resolution={resolution}
              selectedIds={selectedIds}
              favoriteDatasetIds={favoriteDatasetIds}
              scopeLabel={scopeLabel}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
          {group.items.map((family) => {
            const match =
              resolution != null
                ? findVariantForSelection(family, scope, resolution)
                : null;
            const compatible = match != null;
            const selected = match ? selectedIds.has(match.id) : false;
            const isFavorite = family.variants.some(
              (raster) =>
                raster.datasetId != null && favoriteDatasetIds.has(raster.datasetId),
            );
            const unavailableReason =
              resolution == null
                ? 'Choose a resolution first'
                : `Not available at ${scopeLabel} · ${formatResolutionLabel(resolution)}`;

            return (
              <button
                key={`${group.key}-${family.key}`}
                type="button"
                disabled={!compatible}
                title={compatible ? undefined : unavailableReason}
                onClick={() => {
                  if (!match) return;
                  if (selected) onRemove(match.id);
                  else onAdd(match);
                }}
                className={`flex w-full items-start gap-2 border-t border-gray-50 py-2.5 pr-3 text-left transition-colors ${
                  !compatible
                    ? 'cursor-not-allowed bg-gray-50/80 opacity-45'
                    : selected
                      ? 'bg-emerald-50 hover:bg-emerald-50'
                      : 'hover:bg-emerald-50/60'
                }`}
                style={{ paddingLeft: 36 + depth * 16 }}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-start gap-1.5 text-sm font-medium text-gray-800">
                    {isFavorite && !group.starred && (
                      <Star className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 fill-amber-500 text-amber-500" />
                    )}
                    <span className="min-w-0 break-words whitespace-normal">{family.title}</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                    {family.units === 'category' ? 'Categorical' : 'Continuous'}
                    {' · '}
                    {formatAvailability(family)}
                  </p>
                  {!compatible && (
                    <p className="mt-0.5 text-xs text-amber-700">{unavailableReason}</p>
                  )}
                </div>
                {compatible && (
                  selected ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                  ) : (
                    <Plus className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  )
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RasterAvailabilityCatalog({
  rasters,
  isLoading,
  error,
  scope,
  resolution,
  selectedIds,
  onAdd,
  onRemove,
}: RasterAvailabilityCatalogProps) {
  const [search, setSearch] = useState('');
  const catalog = useCatalogOptional();
  const layers = useLayersOptional();

  const favoriteDatasetIds = useMemo(
    () =>
      datasetIdsFromPinnedLayers(
        layers?.pinnedLayers ?? [],
        catalog?.layerMap ?? new Map(),
      ),
    [catalog?.layerMap, layers?.pinnedLayers],
  );

  const families = useMemo(() => groupRastersIntoFamilies(rasters), [rasters]);
  const datasetCategories = useMemo(
    () => indexDatasetCategories(catalog?.layerMap ?? new Map()),
    [catalog?.layerMap],
  );
  const categories = catalog?.categories ?? [];

  const query = search.trim().toLowerCase();
  const filtered = families.filter((family) => {
    if (!query) return true;
    const placement = placementForFamily(family, datasetCategories, categories);
    return (
      family.title.toLowerCase().includes(query)
      || family.thematicCategory.toLowerCase().includes(query)
      || formatAvailability(family).toLowerCase().includes(query)
      || (placement?.some((category) => category.name.toLowerCase().includes(query)) ?? false)
    );
  });

  const favorites = filtered.filter((family) =>
    family.variants.some(
      (raster) => raster.datasetId != null && favoriteDatasetIds.has(raster.datasetId),
    ),
  );

  const catalogGroups = useMemo(
    () => groupFamiliesByCatalog(filtered, categories, datasetCategories),
    [categories, datasetCategories, filtered],
  );

  const sections: LayerGroup[] = [
    ...(favorites.length > 0
      ? [{
        key: 'favorites',
        label: 'Favorites',
        items: favorites,
        children: [],
        starred: true,
      }]
      : []),
    ...catalogGroups,
  ];

  const scopeLabel =
    RASTER_SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? scope;
  const forceExpandForSearch = query.length > 0;

  return (
    <div className="overflow-hidden rounded-card border border-gray-200 bg-white">
      <div className="relative border-b border-gray-100 px-2 py-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search analysis layers…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-button border border-gray-200 py-2 pl-8 pr-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <p className="px-3 py-3 text-sm text-gray-500">Loading raster catalog…</p>
        )}
        {!isLoading && sections.length === 0 && (
          <p className="px-3 py-3 text-sm text-gray-500">No analysis layers match your search.</p>
        )}
        {sections.map((section) => (
          <CategorySection
            key={section.key}
            group={section}
            forceExpanded={forceExpandForSearch}
            scope={scope}
            resolution={resolution}
            selectedIds={selectedIds}
            favoriteDatasetIds={favoriteDatasetIds}
            scopeLabel={scopeLabel}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
