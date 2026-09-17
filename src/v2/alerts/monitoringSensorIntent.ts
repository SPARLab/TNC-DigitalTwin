// ============================================================================
// Monitoring sensor focus — catalog Overview → Live Monitoring handoff.
// Opens /monitoring with a specific dataset / sensor already selected.
// ============================================================================

export const MONITORING_SENSOR_FOCUS_EVENT = 'v2-monitoring-sensor-focus';

export interface MonitoringSensorFocusIntent {
  /** Data Catalog datasets.id */
  datasetId?: number;
  /** FeatureServer service path, e.g. Dangermond_Weather_Datastreams */
  servicePath?: string;
  /** Monitoring sensor id (variable key) when known */
  sensorId?: string;
  createdAt: number;
}

let latestIntent: MonitoringSensorFocusIntent | null = null;

export function publishMonitoringSensorFocus(
  intent: Omit<MonitoringSensorFocusIntent, 'createdAt'>,
): void {
  const payload: MonitoringSensorFocusIntent = {
    ...intent,
    createdAt: Date.now(),
  };
  latestIntent = payload;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<MonitoringSensorFocusIntent>(MONITORING_SENSOR_FOCUS_EVENT, {
        detail: payload,
      }),
    );
  }
}

export function getLatestMonitoringSensorFocus(): MonitoringSensorFocusIntent | null {
  return latestIntent;
}

export function clearMonitoringSensorFocus(): void {
  latestIntent = null;
}
