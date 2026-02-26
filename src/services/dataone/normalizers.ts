import type {
  DataOneDataset,
  DataOneQueryOptions,
  FilesSummary,
} from '../../types/dataone';

const TIF_EXTENSIONS = new Set(['tif', 'tiff', 'geotif', 'geotiff']);
const IMAGERY_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'jp2',
  'j2k',
  'img',
  'sid',
]);

function normalizeExtension(ext: string): string {
  return ext.trim().toLowerCase().replace(/^\./, '');
}

export function parseDelimitedList(str: string | null | undefined): string[] {
  if (!str) return [];
  return str.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export function parseTimestamp(timestamp: number | null): Date | null {
  if (timestamp === null) return null;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

export function normalizeFileTypeFilters(
  options: DataOneQueryOptions,
): Array<'csv' | 'tif' | 'imagery' | 'other'> {
  const allowed = new Set(['csv', 'tif', 'imagery', 'other'] as const);
  const normalized = new Set<'csv' | 'tif' | 'imagery' | 'other'>();
  for (const value of options.fileTypes || []) {
    if (allowed.has(value)) normalized.add(value);
  }
  return Array.from(normalized);
}

export function datasetMatchesFileTypeFilters(
  dataset: DataOneDataset,
  selectedFilters: Array<'csv' | 'tif' | 'imagery' | 'other'>,
): boolean {
  if (selectedFilters.length === 0) return true;
  const byExtension = dataset.filesSummary?.byExtension;
  if (!byExtension) return false;

  const extensions = Object.keys(byExtension)
    .map(normalizeExtension)
    .filter(Boolean);
  if (extensions.length === 0) return false;

  const hasCsv = extensions.includes('csv');
  const hasTif = extensions.some((ext) => TIF_EXTENSIONS.has(ext));
  const hasImagery = extensions.some((ext) => IMAGERY_EXTENSIONS.has(ext) && !TIF_EXTENSIONS.has(ext));
  const hasOther = extensions.some(
    (ext) => ext !== 'csv' && !TIF_EXTENSIONS.has(ext) && !IMAGERY_EXTENSIONS.has(ext),
  );

  return selectedFilters.some((filterType) => {
    if (filterType === 'csv') return hasCsv;
    if (filterType === 'tif') return hasTif;
    if (filterType === 'imagery') return hasImagery;
    return hasOther;
  });
}

export function parseFilesSummary(jsonStr: string | null): FilesSummary | null {
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      total: parsed.total || 0,
      byExtension: parsed.by_ext || {},
      sizeBytes: parsed.size_bytes || 0,
    };
  } catch {
    console.warn('Failed to parse files_summary:', jsonStr);
    return null;
  }
}
