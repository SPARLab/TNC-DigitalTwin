import type { AlertType } from './types';

export const ALERT_NAVIGATION_INTENT_EVENT = 'v2-alert-navigation-intent';

export interface AlertNavigationIntent {
  alertId: string;
  alertType: AlertType;
  targetLayerId: string;
  createdAt: number;
  cameraLabelHint?: string;
  speciesNameHint?: string;
  datastreamNameHint?: string;
  openImageDetail?: boolean;
}

let latestIntent: AlertNavigationIntent | null = null;

export function publishAlertNavigationIntent(intent: Omit<AlertNavigationIntent, 'createdAt'>): void {
  const payload: AlertNavigationIntent = {
    ...intent,
    createdAt: Date.now(),
  };
  latestIntent = payload;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AlertNavigationIntent>(ALERT_NAVIGATION_INTENT_EVENT, { detail: payload }));
  }
}

export function getLatestAlertNavigationIntent(): AlertNavigationIntent | null {
  return latestIntent;
}
