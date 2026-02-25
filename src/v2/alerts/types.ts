// ============================================================================
// Alert taxonomy + normalized payload contract (Phase 12.1)
// ============================================================================

export type AlertType = 'camera_novelty' | 'water_threshold' | 'inat_range_anomaly';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'unread' | 'read' | 'dismissed';

export interface AlertMetricRange {
  min: number;
  max: number;
  unit: string;
}

export interface AlertMetrics {
  observedValue?: number;
  expectedRange?: AlertMetricRange;
  confidence?: number;
}

/**
 * Shared UI contract for every alert source.
 * Source-specific fields should be attached through `metrics` and `sourceEntityId`.
 */
export interface AlertEvent {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  source: 'ANiML' | 'Water Sensor' | 'iNaturalist';
  sourceEntityId?: string;
  detectedAt: string;
  status: AlertStatus;
  locationLabel?: string;
  metrics?: AlertMetrics;
}

/**
 * Severity defaults by type.
 * Water thresholds can escalate to `critical` based on deviation from expected range.
 */
export const DEFAULT_SEVERITY_BY_TYPE: Record<AlertType, AlertSeverity> = {
  camera_novelty: 'warning',
  water_threshold: 'warning',
  inat_range_anomaly: 'info',
};
