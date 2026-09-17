// ============================================================================
// Live alert helpers for the catalog header bell + catalog layer resolution.
// ============================================================================

import type { CatalogLayer } from '../types';
import type { LiveAlert, LiveAlertSeverity } from '../services/liveAlertService';
import { CATALOG_FORMAT_TAGS } from '../utils/catalogFormatTags';
import { resolveCatalogLayerForDataset } from '../utils/resolveCatalogLayer';
import type { AlertSeverity } from './types';

const READ_IDS_STORAGE_KEY = 'v2-live-alert-read-ids';

function normalizeServicePath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

/** Service folder names this alert was evaluated against. */
export function collectAlertServicePaths(alert: LiveAlert): string[] {
  const paths = new Set<string>();
  if (alert.sourceService) {
    paths.add(normalizeServicePath(alert.sourceService));
  }
  for (const url of alert.sourceUrls) {
    const match = url.match(/\/services\/([^/]+)\//i);
    if (match?.[1]) paths.add(normalizeServicePath(match[1]));
  }
  return Array.from(paths);
}

export function mapLiveSeverityToBellSeverity(severity: LiveAlertSeverity): AlertSeverity {
  const normalized = String(severity).toLowerCase();
  if (normalized === 'critical' || normalized === 'severe' || normalized === 'high') {
    return 'critical';
  }
  if (normalized === 'warning' || normalized === 'elevated') {
    return 'warning';
  }
  return 'info';
}

export function formatLiveAlertTitle(alert: LiveAlert): string {
  const typeLabel = alert.alertType.trim() || 'Condition alert';
  return alert.stationName ? `${typeLabel} · ${alert.stationName}` : typeLabel;
}

export function formatLiveAlertSource(alert: LiveAlert): string {
  if (alert.category.trim()) return alert.category.trim();
  if (alert.sourceService) return alert.sourceService;
  return alert.kind === 'multi' ? 'Multi-stream alert' : 'Live monitoring';
}

/**
 * Prefer a concrete catalog child (Latest for dendra live readings) that matches
 * the alert's source service path.
 */
export function resolveCatalogLayerForLiveAlert(
  alert: LiveAlert,
  layerMap: Map<string, CatalogLayer>,
): CatalogLayer | null {
  const candidates = collectAlertServicePaths(alert);
  if (candidates.length === 0) return null;

  const matches: CatalogLayer[] = [];
  for (const layer of layerMap.values()) {
    const servicePath = layer.catalogMeta?.servicePath;
    if (!servicePath) continue;
    const normalized = normalizeServicePath(servicePath);
    if (
      candidates.some(
        (candidate) =>
          candidate === normalized
          || candidate.includes(normalized)
          || normalized.includes(candidate),
      )
    ) {
      matches.push(layer);
    }
  }

  if (matches.length === 0) return null;

  // Prefer the Latest child so catalog opens on live readings, not Locations.
  for (const match of matches) {
    const datasetId = match.catalogMeta?.datasetId;
    if (datasetId == null) continue;
    const latest = resolveCatalogLayerForDataset(
      layerMap,
      datasetId,
      'latest',
    );
    if (latest) {
      if (
        latest.catalogMeta?.isMultiLayerService
        && !latest.catalogMeta.parentServiceId
        && latest.catalogMeta.siblingLayers?.length
      ) {
        const latestChild = latest.catalogMeta.siblingLayers.find(
          (sibling) =>
            sibling.catalogMeta?.layerIdInService === 0
            || /latest/i.test(sibling.name),
        );
        return latestChild ?? latest.catalogMeta.siblingLayers[0] ?? latest;
      }
      return latest;
    }
  }

  // Prefer concrete children over service parents.
  const concrete = matches.find(
    (layer) =>
      !(
        layer.catalogMeta?.isMultiLayerService
        && !layer.catalogMeta.parentServiceId
      ),
  );
  return concrete ?? matches[0];
}

export function isDendraCatalogLayer(layer: CatalogLayer | null | undefined): boolean {
  return layer?.catalogMeta?.catalogTag === CATALOG_FORMAT_TAGS.dendra
    || layer?.dataSource === 'dendra';
}

export function loadReadAlertIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(READ_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export function persistReadAlertIds(ids: Set<string>): void {
  try {
    sessionStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore quota / private-mode failures.
  }
}
