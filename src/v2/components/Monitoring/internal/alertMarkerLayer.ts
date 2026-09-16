// ============================================================================
// Alert × station helpers — severity colours and per-station clustering used by
// the label badges when an open alert should turn a circle into a triangle.
// ============================================================================

import { severityRank, type LiveAlert } from '../../../services/liveAlertService';

/**
 * RGBA for severity chrome (outline + side label). `test` is soft slate so smoke
 * rules stay visible while verifying without reading as a real condition.
 */
export function severityMarkerColor(severity: string): [number, number, number, number] {
  switch (severity.toLowerCase()) {
    case 'critical':
      return [153, 27, 27, 255];
    case 'severe':
      return [220, 38, 38, 255];
    case 'high':
      return [234, 88, 12, 255];
    case 'elevated':
    case 'warning':
      return [217, 119, 6, 255];
    case 'info':
      return [2, 132, 199, 255];
    case 'test':
      return [100, 116, 139, 255];
    default:
      return [100, 116, 139, 255];
  }
}

/** Title-case the published severity for the side label, e.g. "elevated" → "Elevated". */
export function formatSeverityLabel(severity: string): string {
  const trimmed = severity.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export interface StationAlertCluster {
  stationId: number | null;
  stationName: string;
  longitude: number | null;
  latitude: number | null;
  /** Highest-severity alert driving the badge shape and side label. */
  primary: LiveAlert;
  alerts: LiveAlert[];
}

function normalizeStationName(name: string): string {
  return name.trim().replace(/^Dangermond[_ ]/i, '').toLowerCase();
}

/** One cluster per station, highest severity wins. */
export function clusterAlertsByStation(alerts: LiveAlert[]): StationAlertCluster[] {
  const clusters = new Map<string, StationAlertCluster>();

  for (const alert of alerts) {
    const key =
      alert.stationId != null
        ? `id:${alert.stationId}`
        : `name:${normalizeStationName(alert.stationName)}`;

    const existing = clusters.get(key);
    if (!existing) {
      clusters.set(key, {
        stationId: alert.stationId,
        stationName: alert.stationName,
        longitude: alert.longitude,
        latitude: alert.latitude,
        primary: alert,
        alerts: [alert],
      });
      continue;
    }

    existing.alerts.push(alert);
    if (severityRank(alert.severity) > severityRank(existing.primary.severity)) {
      existing.primary = alert;
    }
  }

  return [...clusters.values()];
}

/**
 * Fast lookup from a reading's station id / name to the highest open alert for
 * that station. Built once per render pass so badge construction stays O(n).
 */
export function buildStationAlertLookup(alerts: LiveAlert[]): {
  byId: Map<number, StationAlertCluster>;
  byName: Map<string, StationAlertCluster>;
} {
  const byId = new Map<number, StationAlertCluster>();
  const byName = new Map<string, StationAlertCluster>();

  for (const cluster of clusterAlertsByStation(alerts)) {
    if (cluster.stationId != null) byId.set(cluster.stationId, cluster);
    byName.set(normalizeStationName(cluster.stationName), cluster);
  }

  return { byId, byName };
}

export function lookupStationAlert(
  lookup: ReturnType<typeof buildStationAlertLookup>,
  station: { stationId: number; stationName: string },
): StationAlertCluster | null {
  return (
    lookup.byId.get(station.stationId) ??
    lookup.byName.get(normalizeStationName(station.stationName)) ??
    null
  );
}

/**
 * Alerts block for station popups. Always shown so the condition context is
 * clear — either the warning message(s) or an explicit empty state.
 */
export function formatStationAlertPopupHtml(
  cluster: StationAlertCluster | null,
  conditionLabel: string,
): string {
  const heading = `
    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.04em">
        Alerts
      </p>`;

  if (!cluster || cluster.alerts.length === 0) {
    return `
      ${heading}
      <p style="margin:6px 0 0;color:#6b7280">
        No active alerts for ${conditionLabel}.
      </p>
    </div>`;
  }

  const rows = [...cluster.alerts]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .map((alert) => {
      const category = alert.category.trim();
      const message = alert.message || alert.triggeredValue || 'Open alert';
      const meta = [category, formatSeverityLabel(alert.severity)].filter(Boolean).join(' · ');
      const [r, g, b] = severityMarkerColor(alert.severity);
      return `
        <div style="margin-top:8px;display:flex;gap:8px;align-items:flex-start">
          <span
            aria-hidden="true"
            style="
              flex-shrink:0;
              display:inline-flex;
              align-items:center;
              justify-content:center;
              width:18px;
              height:18px;
              margin-top:1px;
              border-radius:999px;
              background:rgb(${r},${g},${b});
              color:#fff;
              font-size:12px;
              font-weight:700;
              line-height:1;
              box-shadow:0 0 0 1.5px #fff;
            "
          >!</span>
          <div style="min-width:0;flex:1">
            ${
              meta
                ? `<p style="margin:0;font-size:11px;color:#9ca3af">${meta}</p>`
                : ''
            }
            <p style="margin:2px 0 0;color:#111827">${message}</p>
          </div>
        </div>`;
    })
    .join('');

  return `
    ${heading}
    ${rows}
  </div>`;
}

/** Shared measurement header so Labels / Surface / panel-driven popups match. */
export function formatMeasurementPopupHeader(
  conditionLabel: string,
  valueLine: string,
): string {
  return `
    <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.04em">
      ${conditionLabel}
    </p>
    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111827">${valueLine}</p>
  `;
}
