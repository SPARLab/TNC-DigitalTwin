// ============================================================================
// Catalog source attribution — human-readable labels from Data Catalog metadata.
// Prefer server_base_url / service_path over the internal dataSource adapter key
// (e.g. "tnc-arcgis"), which is an UI routing bucket, not a true origin.
// ============================================================================

import type { CatalogLayer, DataSource } from '../types';

const DATA_SOURCE_FALLBACK_LABELS: Record<DataSource, string> = {
  'tnc-arcgis': 'ArcGIS service',
  motus: 'MOTUS',
  inaturalist: 'iNaturalist API',
  animl: 'ANiML API',
  dendra: 'Dendra',
  calflora: 'CalFlora',
  dataone: 'DataONE',
  gbif: 'GBIF',
  ebird: 'eBird API',
  drone: 'Drone Imagery',
  lidar: 'LiDAR Scans',
};

/** Friendly names for known catalog hosts. */
const HOST_LABELS: Record<string, string> = {
  'dangermondpreserve-spatial.com': 'Dangermond Preserve Spatial Server',
  'dangermondpreserve-tnc.hub.arcgis.com': 'Dangermond Preserve ArcGIS Hub',
  'www.arcgis.com': 'ArcGIS Online',
  'services.arcgis.com': 'ArcGIS Online',
  'services1.arcgis.com': 'ArcGIS Online',
  'services2.arcgis.com': 'ArcGIS Online',
  'services3.arcgis.com': 'ArcGIS Online',
  'services4.arcgis.com': 'ArcGIS Online',
  'services5.arcgis.com': 'ArcGIS Online',
  'services6.arcgis.com': 'ArcGIS Online',
  'services7.arcgis.com': 'ArcGIS Online',
  'services8.arcgis.com': 'ArcGIS Online',
  'services9.arcgis.com': 'ArcGIS Online',
};

function hostnameFromCatalogBase(serverBaseUrl: string): string | null {
  try {
    return new URL(serverBaseUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Short attribution for the right-sidebar header ("Source: via …").
 * Uses the catalog dataset's server_base_url when present.
 */
export function formatCatalogSourceLabel(
  layer: CatalogLayer | undefined,
  dataSource?: DataSource | string,
): string {
  const base = layer?.catalogMeta?.serverBaseUrl?.trim();
  if (base) {
    const host = hostnameFromCatalogBase(base);
    if (host) {
      return HOST_LABELS[host] ?? host;
    }
    return base;
  }

  const key = (dataSource ?? layer?.dataSource) as DataSource | undefined;
  if (key && key in DATA_SOURCE_FALLBACK_LABELS) {
    return DATA_SOURCE_FALLBACK_LABELS[key];
  }
  return key ?? 'Unknown source';
}

/**
 * Compact catalog path for the overview metadata grid.
 * e.g. "dangermondpreserve-spatial.com · Hosted/JLDP_Slope_2018"
 */
export function formatCatalogSourcePath(layer: CatalogLayer | undefined): string {
  const meta = layer?.catalogMeta;
  if (!meta?.serverBaseUrl) return formatCatalogSourceLabel(layer);

  const host = hostnameFromCatalogBase(meta.serverBaseUrl) ?? meta.serverBaseUrl;
  const path = meta.servicePath?.trim().replace(/^\/+|\/+$/g, '') ?? '';
  return path ? `${host} · ${path}` : host;
}
