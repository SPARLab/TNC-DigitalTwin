import type { DataSource } from '../../../types';

export const SIZE_ESTIMATE_BYTES_PER_ITEM: Record<DataSource, Record<string, number>> = {
  inaturalist: {
    csv: 250,
    geojson: 1200,
  },
  animl: {
    metadata: 600,
    images: 400_000,
    thumbnails: 80_000,
  },
  dendra: {
    metadata: 450,
    'datastream-csv': 180,
  },
  dataone: {
    metadata: 15_000,
    links: 1200,
    files: 5_000_000,
  },
  'tnc-arcgis': {
    metadata: 800,
  },
  ebird: {
    metadata: 700,
  },
  drone: {
    metadata: 2000,
  },
  lidar: {
    metadata: 2500,
  },
};

export const LARGE_EXPORT_WARNING_THRESHOLD_BYTES = 5 * 1024 * 1024 * 1024;

export interface EstimateBytesResult {
  bytes?: number;
  isUnavailable: boolean;
}

export function formatEstimatedSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function estimateBytesForSelection(
  dataSource: DataSource,
  selectedFormatIds: string[],
  count?: number,
): EstimateBytesResult {
  if (selectedFormatIds.length === 0) {
    return { bytes: 0, isUnavailable: false };
  }

  if (typeof count !== 'number') {
    return { isUnavailable: true };
  }

  if (count <= 0) {
    return { bytes: 0, isUnavailable: false };
  }

  const bytesPerItemByFormat = SIZE_ESTIMATE_BYTES_PER_ITEM[dataSource] || {};
  const bytes = selectedFormatIds.reduce((total, formatId) => {
    const bytesPerItem = bytesPerItemByFormat[formatId] ?? 0;
    return total + (bytesPerItem * count);
  }, 0);

  return { bytes, isUnavailable: false };
}
