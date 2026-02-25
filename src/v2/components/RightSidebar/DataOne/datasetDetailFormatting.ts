import type { DataOneDatasetDetail, DataOneVersionEntry } from '../../../../services/dataOneService';

export function formatDate(value: Date | null | undefined): string {
  if (!value) return 'Unknown';
  return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateRange(beginDate: Date | null | undefined, endDate: Date | null | undefined): string {
  if (!beginDate && !endDate) return 'Not specified';
  if (beginDate && endDate) {
    const beginYear = beginDate.getFullYear();
    const endYear = endDate.getFullYear();
    return beginYear === endYear ? String(beginYear) : `${beginYear} to ${endYear}`;
  }
  if (beginDate) return `From ${beginDate.getFullYear()}`;
  return `Until ${endDate?.getFullYear() ?? 'Unknown'}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return 'Size unavailable';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatBoundingBox(details: DataOneDatasetDetail | null): string {
  const coverage = details?.spatialCoverage;
  if (!coverage) return 'Not specified';
  const { north, south, east, west } = coverage;
  if ([north, south, east, west].some((value) => value == null)) {
    return 'Not specified';
  }
  return `${south!.toFixed(2)} to ${north!.toFixed(2)} lat, ${west!.toFixed(2)} to ${east!.toFixed(2)} lon`;
}

export function describeFileType(ext: string): string {
  const normalized = ext.toLowerCase();
  if (normalized === 'csv') return 'Tabular data for analysis and reuse.';
  if (normalized === 'tsv') return 'Delimiter-separated tabular records.';
  if (normalized === 'json') return 'Structured machine-readable metadata or records.';
  if (normalized === 'xml') return 'Structured metadata or schema-based exchange format.';
  if (normalized === 'pdf') return 'Documentation, reports, or published methods.';
  if (normalized === 'zip') return 'Compressed package of one or more resources.';
  if (normalized === 'nc') return 'NetCDF scientific array data.';
  if (normalized === 'txt') return 'Plain-text notes, logs, or supplementary details.';
  return 'Research dataset files included in this package.';
}

export function formatVersionSummary(summary: DataOneVersionEntry['filesSummary']): string | null {
  if (!summary || summary.total <= 0) return null;
  const extList = Object.entries(summary.byExtension)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3)
    .map(([ext, count]) => `${count} ${ext.toUpperCase()}`);
  if (extList.length === 0) return `${summary.total} files`;
  return extList.join(', ');
}

export interface DatasetDetailFileRow {
  ext: string;
  count: number | null;
  description: string;
}
