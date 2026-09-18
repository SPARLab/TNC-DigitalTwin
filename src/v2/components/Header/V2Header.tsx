// ============================================================================
// V2Header — Header with branding + live alerts + export cart + v1 toggle
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';
import { publishAlertNavigationIntent } from '../../alerts/navigationIntent';
import { publishMonitoringAlertFocus } from '../../alerts/monitoringAlertIntent';
import {
  formatLiveAlertTitle,
  isDendraCatalogLayer,
  loadReadAlertIds,
  persistReadAlertIds,
  resolveCatalogLayerForLiveAlert,
} from '../../alerts/liveAlertAdapter';
import { useLiveAlertsContext } from '../../context/LiveAlertsContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { useCatalog } from '../../context/CatalogContext';
import type { LiveAlert } from '../../services/liveAlertService';

interface V2HeaderProps {
  onOpenExportBuilder?: () => void;
}

export function V2Header({ onOpenExportBuilder }: V2HeaderProps) {
  const navigate = useNavigate();
  const { pinnedLayers, activateLayer, pinLayer, requestBrowseTab } = useLayers();
  const { viewRef, highlightPoint, showToast } = useMap();
  const { layerMap } = useCatalog();
  const { allAlerts, isLoading, error, refresh } = useLiveAlertsContext();
  const cartCount = pinnedLayers.length;
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() => loadReadAlertIds());
  const alertsMenuRef = useRef<HTMLDivElement | null>(null);

  const sortedAlerts = useMemo(
    () =>
      [...allAlerts].sort(
        (a, b) => b.triggeredAt - a.triggeredAt,
      ),
    [allAlerts],
  );

  const unreadAlertCount = useMemo(
    () => sortedAlerts.filter((alert) => !readAlertIds.has(alert.id)).length,
    [sortedAlerts, readAlertIds],
  );

  // The header no longer offers a switch to the legacy catalog. src/App.tsx is still in the repo.

  useEffect(() => {
    if (!isAlertsOpen) return undefined;

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

  const toggleAlertsOpen = () => {
    setIsAlertsOpen((previous) => !previous);
  };

  const markAlertRead = (alertId: string) => {
    setReadAlertIds((previous) => {
      if (previous.has(alertId)) return previous;
      const next = new Set(previous);
      next.add(alertId);
      persistReadAlertIds(next);
      return next;
    });
  };

  const markAllRead = () => {
    setReadAlertIds((previous) => {
      const next = new Set(previous);
      for (const alert of sortedAlerts) next.add(alert.id);
      persistReadAlertIds(next);
      return next;
    });
  };

  const formatRelativeTime = (timestampMs: number) => {
    const diffMinutes = Math.max(1, Math.floor((Date.now() - timestampMs) / 60000));
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const viewInMonitoring = (alert: LiveAlert) => {
    markAlertRead(alert.id);
    setIsAlertsOpen(false);
    publishMonitoringAlertFocus({ alertId: alert.id, alert });
    navigate('/monitoring');
  };

  const openInCatalog = (alert: LiveAlert) => {
    const catalogLayer = resolveCatalogLayerForLiveAlert(alert, layerMap);
    if (!catalogLayer) {
      showToast('No matching catalog layer found for this alert.', 'warning');
      return;
    }

    const featureId = alert.stationId ?? undefined;
    activateLayer(catalogLayer.id, undefined, featureId);
    pinLayer(catalogLayer.id);
    requestBrowseTab();

    const longitude = alert.longitude;
    const latitude = alert.latitude;
    const view = viewRef.current;
    if (
      view?.map
      && longitude != null
      && latitude != null
      && Number.isFinite(longitude)
      && Number.isFinite(latitude)
    ) {
      highlightPoint(longitude, latitude);
      void view
        .goTo(
          {
            center: [longitude, latitude],
            zoom: Math.max(view.zoom ?? 8, 13),
          },
          { duration: 800 },
        )
        .catch(() => {
          // Ignore goTo interruptions from rapid user interactions.
        });
    }

    if (isDendraCatalogLayer(catalogLayer)) {
      publishAlertNavigationIntent({
        alertId: alert.id,
        alertType: 'water_threshold',
        targetLayerId: catalogLayer.id,
        datastreamNameHint: (alert.sourceField ?? alert.category) || undefined,
      });
    }

    markAlertRead(alert.id);
    setIsAlertsOpen(false);
  };

  return (
    <header
      id="v2-header"
      className="h-12 flex items-center justify-between px-4
                 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600
                 border-b border-emerald-900/20 flex-shrink-0 relative z-[90]"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">
          Dangermond Preserve Data Catalog
        </h1>
        <span className="text-[10px] font-medium text-emerald-100 bg-white/15 border border-white/25 px-1.5 py-0.5 rounded">
          v2.0
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div id="alerts-menu-container" ref={alertsMenuRef} className="relative">
          <button
            id="alerts-notification-button"
            type="button"
            onClick={toggleAlertsOpen}
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
              className="absolute right-0 top-12 z-[100] w-[22rem] max-w-[90vw] rounded-xl overflow-hidden
                         border border-emerald-900/25 bg-emerald-900/95 backdrop-blur
                         shadow-xl shadow-emerald-950/35"
            >
              <div
                id="alerts-dropdown-header"
                className="flex items-center justify-between px-3 py-2 border-b border-emerald-700/70"
              >
                <div id="alerts-dropdown-title-wrap" className="flex items-center gap-2">
                  <p id="alerts-dropdown-title" className="text-sm font-semibold text-white">
                    Live alerts
                  </p>
                  {unreadAlertCount > 0 && (
                    <span
                      id="alerts-dropdown-unread-chip"
                      className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-700 text-emerald-100"
                    >
                      {unreadAlertCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="alerts-refresh-button"
                    type="button"
                    onClick={() => refresh()}
                    className="text-[11px] text-emerald-200 hover:text-white"
                  >
                    Refresh
                  </button>
                  {unreadAlertCount > 0 && (
                    <button
                      id="alerts-mark-all-read-button"
                      type="button"
                      onClick={markAllRead}
                      className="text-[11px] text-emerald-200 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {isLoading && sortedAlerts.length === 0 ? (
                <div id="alerts-dropdown-loading" className="px-4 py-6">
                  <p className="text-sm text-emerald-50">Loading live alerts…</p>
                </div>
              ) : error && sortedAlerts.length === 0 ? (
                <div id="alerts-dropdown-error" className="px-4 py-6 space-y-2">
                  <p className="text-sm text-rose-100">{error}</p>
                  <button
                    type="button"
                    onClick={() => refresh()}
                    className="text-xs text-emerald-200 hover:text-white underline"
                  >
                    Try again
                  </button>
                </div>
              ) : sortedAlerts.length === 0 ? (
                <div id="alerts-dropdown-empty-state" className="px-4 py-6">
                  <p id="alerts-dropdown-empty-title" className="text-sm text-emerald-50">
                    No open alerts right now
                  </p>
                  <p id="alerts-dropdown-empty-subtitle" className="text-xs text-emerald-200/80 mt-1">
                    Condition alerts from Live Monitoring will appear here.
                  </p>
                </div>
              ) : (
                <ul
                  id="alerts-dropdown-list"
                  className="scroll-area-export-builder max-h-96 space-y-2 p-2"
                >
                  {sortedAlerts.map((alert) => {
                    const isUnread = !readAlertIds.has(alert.id);
                    return (
                      <li
                        key={alert.id}
                        id={`alerts-card-${alert.id}`}
                        role="menuitem"
                        className={`rounded-lg border border-emerald-700/50 bg-emerald-950/40 px-3 py-2.5 ${
                          isUnread ? 'ring-1 ring-rose-300/30' : ''
                        }`}
                      >
                        <div
                          id={`alerts-card-header-${alert.id}`}
                          className="flex items-start justify-between gap-2"
                        >
                          <p
                            id={`alerts-card-title-${alert.id}`}
                            className="text-[13px] font-medium text-white leading-snug"
                          >
                            {formatLiveAlertTitle(alert)}
                          </p>
                          <span
                            id={`alerts-card-time-${alert.id}`}
                            className="text-[11px] text-emerald-200/90 whitespace-nowrap flex-shrink-0"
                          >
                            {formatRelativeTime(alert.triggeredAt)}
                          </span>
                        </div>
                        <div
                          id={`alerts-card-actions-${alert.id}`}
                          className="mt-2.5 flex gap-2"
                        >
                          <button
                            id={`alerts-card-catalog-button-${alert.id}`}
                            type="button"
                            onClick={() => openInCatalog(alert)}
                            className="flex-1 rounded-md border border-emerald-500/40 px-2 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-white/10 transition-colors"
                          >
                            View in Catalog
                          </button>
                          <button
                            id={`alerts-card-monitoring-button-${alert.id}`}
                            type="button"
                            onClick={() => viewInMonitoring(alert)}
                            className="flex-1 rounded-md bg-white/15 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-white/25 transition-colors"
                          >
                            View in Monitoring
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

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
      </div>
    </header>
  );
}
