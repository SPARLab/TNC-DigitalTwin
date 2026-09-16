// ============================================================================
// Catalog tags — values of Datasets.catalog_tag that select a custom
// visualization / browse experience instead of generic TNC ArcGIS.
// ============================================================================

import type { DataSource } from '../types';

/** Known catalog_tag values that map to custom data-source adapters. */
export const CATALOG_FORMAT_TAGS = {
  dendra: 'dendra_format',
  motus: 'motus_format',
  drone: 'drone_format',
  gbif: 'gbif_format',
} as const;

export type CatalogFormatTag =
  (typeof CATALOG_FORMAT_TAGS)[keyof typeof CATALOG_FORMAT_TAGS];

const TAG_TO_DATA_SOURCE: Record<string, DataSource> = {
  [CATALOG_FORMAT_TAGS.dendra]: 'dendra',
  [CATALOG_FORMAT_TAGS.motus]: 'motus',
  [CATALOG_FORMAT_TAGS.drone]: 'drone',
  [CATALOG_FORMAT_TAGS.gbif]: 'gbif',
};

/** Resolve a DataSource adapter key from a catalog_tag, if recognized. */
export function dataSourceFromCatalogTag(
  catalogTag: string | null | undefined,
): DataSource | undefined {
  const trimmed = catalogTag?.trim();
  if (!trimmed) return undefined;
  return TAG_TO_DATA_SOURCE[trimmed];
}

export function isCatalogFormatTag(
  catalogTag: string | null | undefined,
  format: CatalogFormatTag,
): boolean {
  return catalogTag?.trim() === format;
}
