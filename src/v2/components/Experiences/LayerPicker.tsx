// ============================================================================
// LayerPicker — searchable catalog of rasters for the chosen extent/resolution.
// Pinned Data Catalog datasets with matching rasters appear under Favorites.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Plus, Search, Star } from 'lucide-react';
import { useCatalogOptional } from '../../context/CatalogContext';
import { useLayersOptional } from '../../context/LayerContext';
import { datasetIdsFromPinnedLayers } from './pinnedRasterDatasets';
import type { CatalogRaster } from './types';

interface LayerPickerProps {
  rasters: CatalogRaster[];
  isLoading: boolean;
  error: string | null;
  disabled: boolean;
  disabledHint: string;
  emptyMessage: string;
  selectedIds: Set<number>;
  onAdd: (raster: CatalogRaster) => void;
  onRemove: (id: number) => void;
}

function groupByCategory(rasters: CatalogRaster[]): [string, CatalogRaster[]][] {
  const groups = new Map<string, CatalogRaster[]>();
  for (const raster of rasters) {
    const list = groups.get(raster.thematicCategory) ?? [];
    list.push(raster);
    groups.set(raster.thematicCategory, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function LayerPicker({
  rasters,
  isLoading,
  error,
  disabled,
  disabledHint,
  emptyMessage,
  selectedIds,
  onAdd,
  onRemove,
}: LayerPickerProps) {
  const [isOpen, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = rasters.filter(
    (raster) =>
      raster.title.toLowerCase().includes(query) ||
      raster.thematicCategory.toLowerCase().includes(query),
  );
  const favorites = filtered.filter(
    (raster) => raster.datasetId != null && favoriteDatasetIds.has(raster.datasetId),
  );
  const grouped = groupByCategory(filtered);
  const sections: [string, CatalogRaster[], boolean][] = [
    ...(favorites.length > 0 ? [['Favorites', favorites, true] as [string, CatalogRaster[], boolean]] : []),
    ...grouped.map(([category, items]) => [category, items, false] as [string, CatalogRaster[], boolean]),
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        title={disabled ? disabledHint : undefined}
        onClick={() => setOpen((open) => !open)}
        className="flex w-full items-center gap-2 rounded-button border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:border-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:border-gray-200"
      >
        <Plus className={`h-3.5 w-3.5 ${disabled ? 'text-gray-400' : 'text-emerald-700'}`} />
        <span className="flex-1 text-left font-medium">Add Layer</span>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-card border border-gray-200 bg-white shadow-lg">
          <div className="relative border-b border-gray-100 px-2 py-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search layers..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              className="w-full rounded-button border border-gray-200 py-1.5 pl-7 pr-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="px-3 py-2 text-[11px] text-red-700">{error}</p>
          )}

          <div className="max-h-64 overflow-y-auto">
            {sections.length === 0 && !isLoading ? (
              <p className="px-3 py-2 text-[11px] text-gray-500">{emptyMessage}</p>
            ) : (
              sections.map(([category, items, isFavoriteGroup]) => (
                <div key={category}>
                  <div
                    className={`flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                      isFavoriteGroup
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isFavoriteGroup && <Star className="h-3 w-3 fill-current" />}
                      {category}
                    </span>
                    <span>{items.length}</span>
                  </div>
                  {items.map((raster) => {
                    const isSelected = selectedIds.has(raster.id);
                    const isFavorite =
                      raster.datasetId != null && favoriteDatasetIds.has(raster.datasetId);
                    const range =
                      raster.units !== 'category' &&
                      raster.valueMin != null &&
                      raster.valueMax != null
                        ? ` · ${raster.valueMin}–${raster.valueMax}`
                        : '';
                    const unitLabel =
                      raster.units && raster.units !== 'category' ? ` ${raster.units}` : '';

                    return (
                      <button
                        key={`${category}-${raster.id}`}
                        type="button"
                        onClick={() =>
                          isSelected ? onRemove(raster.id) : onAdd(raster)
                        }
                        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-emerald-50 ${
                          isSelected ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 text-xs font-medium text-gray-800">
                            {isFavorite && (
                              <Star className="h-3 w-3 flex-shrink-0 fill-amber-500 text-amber-500" />
                            )}
                            <span className="truncate">{raster.title}</span>
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {raster.units === 'category' ? 'Categorical' : 'Continuous'}
                            {range}
                            {unitLabel}
                          </p>
                        </div>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
