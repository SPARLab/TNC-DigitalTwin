export const BASEMAP_OPTIONS = [
  {
    id: 'topo-vector',
    label: 'Topo',
    description: 'Light topographic map',
    swatchClass: 'bg-gradient-to-br from-emerald-100 via-amber-100 to-sky-200',
  },
  {
    id: 'satellite',
    label: 'Imagery',
    description: 'Satellite imagery',
    swatchClass: 'bg-gradient-to-br from-emerald-950 via-lime-800 to-sky-900',
  },
  {
    id: 'dark-gray-vector',
    label: 'Dark',
    description: 'Dark gray canvas',
    swatchClass: 'bg-gradient-to-br from-zinc-700 via-zinc-900 to-black',
  },
] as const;

export type BasemapId = (typeof BASEMAP_OPTIONS)[number]['id'];

export const DEFAULT_BASEMAP_BY_VIEW: Record<'2d' | '3d', BasemapId> = {
  '2d': 'topo-vector',
  '3d': 'satellite',
};

export function isBasemapId(value: unknown): value is BasemapId {
  return BASEMAP_OPTIONS.some((option) => option.id === value);
}

export function resolveBasemap(preference: BasemapId | null, viewMode: '2d' | '3d'): BasemapId {
  return preference ?? DEFAULT_BASEMAP_BY_VIEW[viewMode];
}
