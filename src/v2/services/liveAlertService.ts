// ============================================================================
// Live Alert Service — open condition alerts from Dangermond_Live_Alerts.
//
// Open Single Alerts (layer 3) are one rule × one station against a single
// Latest FeatureServer URL. Open Multi Alerts (layer 2) join several streams
// and carry a comma-separated `source_urls` list. Matching to the monitoring
// page is by those URLs (or the service path they contain), so turning on Wind
// surfaces wind alerts and a fire-weather multi that also lists the wind URL.
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';

const SERVICES_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services';
const ALERTS_SERVICE_PATH = 'Dangermond_Live_Alerts';
const OPEN_MULTI_LAYER_ID = 2;
const OPEN_SINGLE_LAYER_ID = 3;

export type LiveAlertKind = 'single' | 'multi';

/**
 * Severities as published by the alert pipeline. `test` is for smoke rules that
 * fire on any reading; the UI keeps them visible but ranked below real ones.
 */
export type LiveAlertSeverity =
  | 'test'
  | 'info'
  | 'elevated'
  | 'warning'
  | 'high'
  | 'severe'
  | 'critical'
  | string;

export interface LiveAlert {
  kind: LiveAlertKind;
  id: string;
  ruleId: string;
  category: string;
  alertType: string;
  severity: LiveAlertSeverity;
  stationId: number | null;
  stationName: string;
  triggeredValue: string;
  triggeredNumeric: number | null;
  message: string;
  /** FeatureServer Latest URLs this alert was evaluated against. */
  sourceUrls: string[];
  /** Service folder name when the row carries one (single alerts only). */
  sourceService: string | null;
  sourceField: string | null;
  latitude: number | null;
  longitude: number | null;
  observationTime: number | null;
  triggeredAt: number;
  refreshedAt: number | null;
  expiresAt: number | null;
}

export interface LiveAlertSnapshot {
  alerts: LiveAlert[];
  fetchedAt: number;
}

interface QueryResponse {
  features?: { attributes: Record<string, unknown> }[];
  error?: { message?: string };
}

/** Latest FeatureServer URL for a monitoring datastream, matching alert `source_url`. */
export function buildLatestLayerUrl(servicePath: string, layerId = 0): string {
  const path = servicePath.replace(/^\/+|\/+$/g, '');
  return `${SERVICES_BASE}/${path}/FeatureServer/${layerId}`;
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

function normalizeServicePath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function readString(attributes: Record<string, unknown>, field: string): string | null {
  const value = attributes[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(attributes: Record<string, unknown>, field: string): number | null {
  const value = attributes[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function splitSourceUrls(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseSingle(attributes: Record<string, unknown>): LiveAlert | null {
  const id = readNumber(attributes, 'id');
  const triggeredAt = readNumber(attributes, 'triggered_at');
  const alertType = readString(attributes, 'alert_type');
  if (id == null || triggeredAt == null || !alertType) return null;

  const sourceUrl = readString(attributes, 'source_url');
  const sourceUrls = sourceUrl ? [sourceUrl] : [];

  return {
    kind: 'single',
    id: `single-${id}`,
    ruleId: readString(attributes, 'rule_id') ?? '',
    category: readString(attributes, 'category') ?? '',
    alertType,
    severity: (readString(attributes, 'severity') ?? 'info').toLowerCase(),
    stationId: readNumber(attributes, 'station_id'),
    stationName: readString(attributes, 'station_name') ?? 'Unknown station',
    triggeredValue: readString(attributes, 'triggered_value') ?? '',
    triggeredNumeric: readNumber(attributes, 'triggered_numeric'),
    message: readString(attributes, 'message') ?? '',
    sourceUrls,
    sourceService: readString(attributes, 'source_service'),
    sourceField: readString(attributes, 'source_field'),
    latitude: readNumber(attributes, 'latitude'),
    longitude: readNumber(attributes, 'longitude'),
    observationTime: readNumber(attributes, 'observation_time'),
    triggeredAt,
    refreshedAt: readNumber(attributes, 'refreshed_at'),
    expiresAt: readNumber(attributes, 'expires_at'),
  };
}

function parseMulti(attributes: Record<string, unknown>): LiveAlert | null {
  const id = readNumber(attributes, 'id');
  const triggeredAt = readNumber(attributes, 'triggered_at');
  const alertType = readString(attributes, 'alert_type');
  if (id == null || triggeredAt == null || !alertType) return null;

  return {
    kind: 'multi',
    id: `multi-${id}`,
    ruleId: readString(attributes, 'rule_id') ?? '',
    category: readString(attributes, 'category') ?? '',
    alertType,
    severity: (readString(attributes, 'severity') ?? 'info').toLowerCase(),
    stationId: readNumber(attributes, 'station_id'),
    stationName: readString(attributes, 'station_name') ?? 'Unknown station',
    triggeredValue: readString(attributes, 'triggered_value') ?? '',
    triggeredNumeric: null,
    message: readString(attributes, 'message') ?? '',
    sourceUrls: splitSourceUrls(readString(attributes, 'source_urls')),
    sourceService: null,
    sourceField: null,
    latitude: readNumber(attributes, 'latitude'),
    longitude: readNumber(attributes, 'longitude'),
    observationTime: readNumber(attributes, 'observation_time'),
    triggeredAt,
    refreshedAt: readNumber(attributes, 'refreshed_at'),
    expiresAt: readNumber(attributes, 'expires_at'),
  };
}

async function queryOpenLayer(
  layerId: number,
  parse: (attributes: Record<string, unknown>) => LiveAlert | null,
): Promise<LiveAlert[]> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: '*',
    returnGeometry: 'false',
    resultRecordCount: '2000',
  });

  const url =
    `${SERVICES_BASE}/${ALERTS_SERVICE_PATH}/FeatureServer/${layerId}/query?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Live alerts query failed: HTTP ${response.status}`);
  }

  const json: QueryResponse = await response.json();
  if (json.error) {
    const message = json.error.message ?? 'Unknown error';
    if (/token|auth|permission|sign-in|couldn't access/i.test(message)) {
      throw new Error('The live alerts service requires sign-in.');
    }
    throw new Error(`Live alerts query error: ${message}`);
  }

  const alerts: LiveAlert[] = [];
  for (const feature of json.features ?? []) {
    // Open views omit resolved rows; `display` still gates rows the pipeline
    // wants hidden from the UI even while open.
    if (readNumber(feature.attributes, 'display') === 0) continue;
    const alert = parse(feature.attributes);
    if (alert) alerts.push(alert);
  }
  return alerts;
}

async function requestOpenAlerts(): Promise<LiveAlertSnapshot> {
  const [single, multi] = await Promise.all([
    queryOpenLayer(OPEN_SINGLE_LAYER_ID, parseSingle),
    queryOpenLayer(OPEN_MULTI_LAYER_ID, parseMulti),
  ]);

  return {
    alerts: [...single, ...multi],
    fetchedAt: Date.now(),
  };
}

export async function fetchOpenLiveAlerts(): Promise<LiveAlertSnapshot> {
  return getCachedOrFetch('live-alerts-open', {}, requestOpenAlerts, CacheTTL.SHORT);
}

/**
 * True when the alert was evaluated against the active monitoring layer.
 * Multi-stream alerts match if *any* of their source URLs belongs to the layer.
 */
export function alertMatchesActiveSource(
  alert: LiveAlert,
  active: { url: string; servicePath: string },
): boolean {
  const activeUrl = normalizeUrl(active.url);
  const activePath = normalizeServicePath(active.servicePath);

  if (alert.sourceService && normalizeServicePath(alert.sourceService) === activePath) {
    return true;
  }

  return alert.sourceUrls.some((sourceUrl) => {
    const url = normalizeUrl(sourceUrl);
    if (url === activeUrl) return true;
    // Fallback when a published URL drifts (trailing slash, layer index) but
    // still points at the same service folder.
    return url.includes(`/${activePath}/`);
  });
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 60,
  severe: 50,
  high: 40,
  warning: 30,
  elevated: 20,
  info: 10,
  test: 0,
};

export function severityRank(severity: string): number {
  return SEVERITY_RANK[severity.toLowerCase()] ?? 5;
}

/** Real condition alerts first, then smoke tests; within a band, newest first. */
export function compareLiveAlerts(a: LiveAlert, b: LiveAlert): number {
  const bySeverity = severityRank(b.severity) - severityRank(a.severity);
  if (bySeverity !== 0) return bySeverity;
  return b.triggeredAt - a.triggeredAt;
}
