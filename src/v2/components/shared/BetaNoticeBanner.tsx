// ============================================================================
// BetaNoticeBanner — dismissible notice for the feedback preview deploy.
// Dismissal lasts only for this page load. A full refresh shows it again.
// ============================================================================

import { useSyncExternalStore } from 'react';
import { X } from 'lucide-react';

const listeners = new Set<() => void>();
let dismissed = false;

try {
  window.localStorage.removeItem('v2-beta-notice-dismissed');
} catch {
  // Ignore storage access failures.
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismissBanner(): void {
  dismissed = true;
  listeners.forEach((listener) => listener());
}

export function BetaNoticeBanner() {
  const isDismissed = useSyncExternalStore(subscribe, () => dismissed, () => false);
  if (isDismissed) return null;

  return (
    <div
      id="beta-notice-banner"
      role="status"
      className="flex flex-shrink-0 items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
    >
      <p className="min-w-0 flex-1 leading-snug">
        This is a beta version of the application. Underlying data availability and
        functionality may change before the full release in October.
      </p>
      <button
        id="beta-notice-dismiss"
        type="button"
        onClick={dismissBanner}
        className="shrink-0 rounded p-0.5 text-amber-800 hover:bg-amber-100 hover:text-amber-950"
        aria-label="Dismiss beta notice"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
