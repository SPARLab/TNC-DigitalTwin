// ============================================================================
// Monitoring alert focus intent — catalog bell → Live Monitoring handoff.
// ============================================================================

import type { LiveAlert } from '../services/liveAlertService';

export const MONITORING_ALERT_FOCUS_EVENT = 'v2-monitoring-alert-focus';

export interface MonitoringAlertFocusIntent {
  alertId: string;
  /** Snapshot so Monitoring can focus even before its local list refreshes. */
  alert: LiveAlert;
  createdAt: number;
}

let latestIntent: MonitoringAlertFocusIntent | null = null;

export function publishMonitoringAlertFocus(
  intent: Omit<MonitoringAlertFocusIntent, 'createdAt'>,
): void {
  const payload: MonitoringAlertFocusIntent = {
    ...intent,
    createdAt: Date.now(),
  };
  latestIntent = payload;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<MonitoringAlertFocusIntent>(MONITORING_ALERT_FOCUS_EVENT, {
        detail: payload,
      }),
    );
  }
}

export function getLatestMonitoringAlertFocus(): MonitoringAlertFocusIntent | null {
  return latestIntent;
}

export function clearMonitoringAlertFocus(): void {
  latestIntent = null;
}
