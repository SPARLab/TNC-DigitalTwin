// ============================================================================
// V2Header — Header with branding + alerts + export cart + v1 toggle
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ShoppingCart } from 'lucide-react';
import type { AlertEvent } from '../../alerts/types';
import { MOCK_ALERTS } from '../../alerts/mockAlerts';
import { useLayers } from '../../context/LayerContext';
// NOTE: useBookmarks removed — Saved Items widget merged into Map Layers (Feb 11 decision)

interface V2HeaderProps {
  onOpenExportBuilder?: () => void;
}

export function V2Header({ onOpenExportBuilder }: V2HeaderProps) {
  const { pinnedLayers } = useLayers();
  const cartCount = pinnedLayers.length;
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertEvent[]>(MOCK_ALERTS);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(MOCK_ALERTS[0]?.id ?? null);
  const alertsMenuRef = useRef<HTMLDivElement | null>(null);

  const unreadAlertCount = useMemo(
    () => alerts.filter((alert) => alert.status === 'unread').length,
    [alerts],
  );
  const sortedAlerts = useMemo(
    () =>
      [...alerts].sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
      ),
    [alerts],
  );
  const selectedAlert =
    sortedAlerts.find((alert) => alert.id === selectedAlertId) ?? sortedAlerts[0] ?? null;

  const switchToV1 = () => {
    window.location.search = '';
  };

  useEffect(() => {
    if (!isAlertsOpen) {
      return undefined;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!alertsMenuRef.current?.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAlertsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAlertsOpen]);

  const openAndFocusAlerts = () => {
    if (sortedAlerts.length > 0 && !selectedAlertId) {
      setSelectedAlertId(sortedAlerts[0].id);
    }
    setIsAlertsOpen((previous) => !previous);
  };

  const markAlertRead = (alertId: string) => {
    setAlerts((previousAlerts) =>
      previousAlerts.map((alert) =>
        alert.id === alertId && alert.status === 'unread' ? { ...alert, status: 'read' } : alert,
      ),
    );
  };

  const markAllRead = () => {
    setAlerts((previousAlerts) =>
      previousAlerts.map((alert) =>
        alert.status === 'unread' ? { ...alert, status: 'read' } : alert,
      ),
    );
  };

  const formatRelativeTime = (isoTimestamp: string) => {
    const timestampMs = new Date(isoTimestamp).getTime();
    const diffMinutes = Math.max(1, Math.floor((Date.now() - timestampMs) / 60000));
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSeverityPillClasses = (severity: AlertEvent['severity']) => {
    if (severity === 'critical') {
      return 'bg-rose-500/25 text-rose-100 border border-rose-300/40';
    }
    if (severity === 'warning') {
      return 'bg-amber-400/20 text-amber-100 border border-amber-300/35';
    }
    return 'bg-sky-500/20 text-sky-100 border border-sky-300/35';
  };

  return (
    <header
      id="v2-header"
      className="h-12 flex items-center justify-between px-4
                 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600
                 border-b border-emerald-900/20 flex-shrink-0"
    >
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">
          Dangermond Preserve Data Catalog
        </h1>
        <span className="text-[10px] font-medium text-emerald-100 bg-white/15 border border-white/25 px-1.5 py-0.5 rounded">
          v2.0
        </span>
      </div>

      {/* Right: alerts + cart + version toggle */}
      <div className="flex items-center gap-3">
        {/* Alerts bell shell (Phase 12.2) */}
        <div id="alerts-menu-container" ref={alertsMenuRef} className="relative">
          <button
            id="alerts-notification-button"
            type="button"
            onClick={openAndFocusAlerts}
            className="relative p-2 rounded-md hover:bg-white/10 transition-colors"
            title={
              unreadAlertCount > 0
                ? `${unreadAlertCount} unread alerts`
                : 'No unread alerts'
            }
            aria-label={
              unreadAlertCount > 0
                ? `Notifications: ${unreadAlertCount} unread alerts`
                : 'Notifications: no unread alerts'
            }
            aria-haspopup="menu"
            aria-expanded={isAlertsOpen}
            aria-controls="alerts-dropdown-panel"
          >
            <Bell className="w-5 h-5 text-emerald-100" />
            {unreadAlertCount > 0 && (
              <span
                id="alerts-notification-badge"
                className="absolute -top-0.5 -right-0.5 bg-rose-400 text-gray-900 text-[9px] font-bold
                             rounded-full min-w-4 h-4 px-1 flex items-center justify-center leading-none"
              >
                {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <div
              id="alerts-dropdown-panel"
              role="menu"
              aria-label="Alerts dropdown panel"
              className="absolute right-0 top-12 z-30 w-[25rem] max-w-[90vw] rounded-xl overflow-hidden
                         border border-emerald-900/25 bg-emerald-900/95 backdrop-blur
                         shadow-xl shadow-emerald-950/35"
            >
              <div
                id="alerts-dropdown-header"
                className="flex items-center justify-between px-3 py-2 border-b border-emerald-700/70"
              >
                <div id="alerts-dropdown-title-wrap" className="flex items-center gap-2">
                  <p id="alerts-dropdown-title" className="text-sm font-semibold text-white">
                    Alerts
                  </p>
                  <span
                    id="alerts-dropdown-unread-chip"
                    className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-700 text-emerald-100"
                  >
                    {unreadAlertCount} unread
                  </span>
                </div>
                <button
                  id="alerts-mark-all-read-button"
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadAlertCount === 0}
                  className="text-[11px] text-emerald-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Mark all read
                </button>
              </div>

              {sortedAlerts.length === 0 ? (
                <div id="alerts-dropdown-empty-state" className="px-4 py-6">
                  <p id="alerts-dropdown-empty-title" className="text-sm text-emerald-50">
                    No alerts right now
                  </p>
                  <p id="alerts-dropdown-empty-subtitle" className="text-xs text-emerald-200/80 mt-1">
                    New camera, water, and iNaturalist anomalies will appear here.
                  </p>
                </div>
              ) : (
                <div id="alerts-dropdown-content" className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                  <ul
                    id="alerts-dropdown-list"
                    className="max-h-80 overflow-y-auto border-b md:border-b-0 md:border-r border-emerald-700/60"
                  >
                    {sortedAlerts.map((alert) => {
                      const isSelected = selectedAlert?.id === alert.id;
                      return (
                        <li key={alert.id} id={`alerts-list-item-${alert.id}`}>
                          <button
                            id={`alerts-list-button-${alert.id}`}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setSelectedAlertId(alert.id);
                              markAlertRead(alert.id);
                            }}
                            className={`w-full text-left px-3 py-2.5 border-b border-emerald-700/35 hover:bg-white/10 transition-colors ${
                              isSelected ? 'bg-white/10' : ''
                            }`}
                          >
                            <div id={`alerts-list-row-top-${alert.id}`} className="flex items-center justify-between gap-2">
                              <span
                                id={`alerts-list-severity-${alert.id}`}
                                className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${getSeverityPillClasses(alert.severity)}`}
                              >
                                {alert.severity}
                              </span>
                              <span
                                id={`alerts-list-time-${alert.id}`}
                                className="text-[11px] text-emerald-200/90 whitespace-nowrap"
                              >
                                {formatRelativeTime(alert.detectedAt)}
                              </span>
                            </div>
                            <p id={`alerts-list-title-${alert.id}`} className="mt-1 text-[12px] text-emerald-50">
                              {alert.title}
                            </p>
                            <div id={`alerts-list-row-bottom-${alert.id}`} className="mt-1 flex items-center justify-between gap-2">
                              <span id={`alerts-list-source-${alert.id}`} className="text-[11px] text-emerald-200/90">
                                {alert.source}
                              </span>
                              {alert.status === 'unread' && (
                                <span
                                  id={`alerts-list-unread-dot-${alert.id}`}
                                  className="h-2 w-2 rounded-full bg-rose-300"
                                  aria-label="Unread alert"
                                />
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  <div id="alerts-dropdown-detail" className="p-3 min-h-44">
                    {selectedAlert ? (
                      <>
                        <div id="alerts-detail-header" className="flex items-center justify-between gap-2">
                          <span
                            id="alerts-detail-severity"
                            className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${getSeverityPillClasses(selectedAlert.severity)}`}
                          >
                            {selectedAlert.severity}
                          </span>
                          <span id="alerts-detail-time" className="text-[11px] text-emerald-200/90">
                            {formatRelativeTime(selectedAlert.detectedAt)}
                          </span>
                        </div>
                        <p id="alerts-detail-title" className="mt-2 text-sm font-semibold text-white">
                          {selectedAlert.title}
                        </p>
                        <p id="alerts-detail-description" className="mt-1 text-xs text-emerald-100/95 leading-relaxed">
                          {selectedAlert.description}
                        </p>
                        <p id="alerts-detail-meta" className="mt-2 text-[11px] text-emerald-200/90">
                          {selectedAlert.source}
                          {selectedAlert.locationLabel ? ` • ${selectedAlert.locationLabel}` : ''}
                        </p>
                        <div id="alerts-detail-actions" className="mt-3 flex items-center gap-3">
                          <button
                            id="alerts-detail-mark-read-button"
                            type="button"
                            onClick={() => markAlertRead(selectedAlert.id)}
                            disabled={selectedAlert.status !== 'unread'}
                            className="text-xs text-emerald-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Mark read
                          </button>
                          <button
                            id="alerts-detail-view-source-button"
                            type="button"
                            className="text-xs text-emerald-200 hover:text-white"
                            title="Placeholder action for source navigation"
                          >
                            View source
                          </button>
                        </div>
                      </>
                    ) : (
                      <p id="alerts-detail-empty" className="text-xs text-emerald-200/90">
                        Select an alert to see details.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shopping cart (DFT-002) */}
        <button
          id="export-cart-button"
          type="button"
          onClick={onOpenExportBuilder}
          className="relative p-2 rounded-md hover:bg-white/10 transition-colors"
          title={`Export cart: ${cartCount} items`}
          aria-label={`Export cart with ${cartCount} items`}
        >
          <ShoppingCart className="w-5 h-5 text-amber-300" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-gray-900 text-[9px] font-bold
                             rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>

        {/* V1 toggle */}
        <button
          onClick={switchToV1}
          className="text-xs text-emerald-200 hover:text-white transition-colors"
        >
          Switch to v1
        </button>
      </div>
    </header>
  );
}
