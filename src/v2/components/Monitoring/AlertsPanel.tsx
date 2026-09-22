// ============================================================================
// AlertsPanel — open condition alerts for the monitoring layer on the map.
//
// Grouped by the published `category` field. Within a category, stations are
// listed highest-severity first; an optional severity chip filters the list.
// ============================================================================

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { formatObservedAt } from './internal/formatObservedAt';
import {
  formatSeverityLabel,
  severityMarkerColor,
} from './internal/alertMarkerLayer';
import { compareLiveAlerts, type LiveAlert } from '../../services/liveAlertService';
import { formatStationDisplayName } from '../../services/dendraStationService';
import { AlertRulesModal } from './AlertRulesModal';

interface AlertsPanelProps {
  layerLabel: string;
  alerts: LiveAlert[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  /** Focus the station on the map and open its reading popup. */
  onSelectAlert?: (alert: LiveAlert) => void;
}

interface CategoryGroup {
  category: string;
  alerts: LiveAlert[];
}

function stationLabel(name: string): string {
  return formatStationDisplayName(name);
}

function severityCssColor(severity: string): string {
  const [r, g, b] = severityMarkerColor(severity);
  return `rgb(${r}, ${g}, ${b})`;
}

function groupByCategory(alerts: LiveAlert[]): CategoryGroup[] {
  const groups = new Map<string, LiveAlert[]>();

  for (const alert of alerts) {
    const category = alert.category.trim() || 'Uncategorized';
    const existing = groups.get(category);
    if (existing) {
      existing.push(alert);
      continue;
    }
    groups.set(category, [alert]);
  }

  return [...groups.entries()]
    .map(([category, rows]) => ({
      category,
      alerts: [...rows].sort(compareLiveAlerts),
    }))
    .sort((a, b) => {
      // Categories with the highest-severity alert come first (critical → … → test).
      if (a.alerts[0] && b.alerts[0]) {
        return compareLiveAlerts(a.alerts[0], b.alerts[0]);
      }
      return a.category.localeCompare(b.category);
    });
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <span
      className="mt-0.5 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full ring-2 ring-white"
      style={{ backgroundColor: severityCssColor(severity) }}
      title={formatSeverityLabel(severity)}
      aria-label={formatSeverityLabel(severity)}
    />
  );
}

function StationAlertRow({
  alert,
  onSelect,
}: {
  alert: LiveAlert;
  onSelect?: (alert: LiveAlert) => void;
}) {
  const interactive = Boolean(onSelect);
  const content = (
    <>
      <SeverityDot severity={alert.severity} />
      <div className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-[12px] font-semibold text-gray-900">
            {stationLabel(alert.stationName)}
          </span>
          <span
            className="text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: severityCssColor(alert.severity) }}
          >
            {formatSeverityLabel(alert.severity)}
          </span>
        </div>
        {alert.message ? (
          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-700">{alert.message}</p>
        ) : (
          alert.triggeredValue && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-gray-700">
              {alert.triggeredValue}
            </p>
          )
        )}
        <p className="mt-1 text-[10px] text-gray-400">
          {alert.alertType}
          {alert.triggeredAt
            ? ` · Triggered at ${formatObservedAt(alert.triggeredAt)}`
            : ''}
        </p>
      </div>
    </>
  );

  return (
    <li>
      {interactive ? (
        <button
          type="button"
          onClick={() => onSelect?.(alert)}
          className="flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-start gap-2 rounded-md px-1 py-1.5">{content}</div>
      )}
    </li>
  );
}

function CategoryBlock({
  group,
  onSelectAlert,
}: {
  group: CategoryGroup;
  onSelectAlert?: (alert: LiveAlert) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const topSeverity = group.alerts[0]?.severity ?? 'info';

  return (
    <div className="overflow-hidden rounded-card border border-amber-200/80 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-2 bg-amber-50/80 px-3 py-2 text-left transition-colors hover:bg-amber-50"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
        )}
        <SeverityDot severity={topSeverity} />
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-gray-900">{group.category}</span>
          <span className="ml-1.5 text-[10px] text-gray-500">
            {group.alerts.length} station{group.alerts.length === 1 ? '' : 's'}
          </span>
        </div>
      </button>

      {expanded && (
        <ul className="divide-y divide-gray-100 px-2 py-1">
          {group.alerts.map((alert) => (
            <StationAlertRow key={alert.id} alert={alert} onSelect={onSelectAlert} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function AlertsPanel({
  layerLabel,
  alerts,
  isLoading,
  error,
  onRefresh,
  onSelectAlert,
}: AlertsPanelProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);

  const severityOptions = useMemo(() => {
    const seen = new Map<string, number>();
    for (const alert of alerts) {
      const key = alert.severity.toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()]
      .map(([severity, count]) => ({ severity, count }))
      .sort((a, b) => {
        const sampleA = alerts.find((alert) => alert.severity.toLowerCase() === a.severity)!;
        const sampleB = alerts.find((alert) => alert.severity.toLowerCase() === b.severity)!;
        // Highest severity first so chips read critical → … → test.
        return compareLiveAlerts(sampleA, sampleB);
      });
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'all') return alerts;
    return alerts.filter((alert) => alert.severity.toLowerCase() === severityFilter);
  }, [alerts, severityFilter]);

  const categories = useMemo(() => groupByCategory(filteredAlerts), [filteredAlerts]);
  const realCount = alerts.filter((alert) => alert.severity.toLowerCase() !== 'test').length;
  const testCount = alerts.length - realCount;
  const topAlert = useMemo(
    () => (alerts.length > 0 ? [...alerts].sort(compareLiveAlerts)[0] : null),
    [alerts],
  );
  const hasAlerts = alerts.length > 0;

  return (
    <section
      id="monitoring-alerts-panel"
      className={
        hasAlerts
          ? 'flex flex-col gap-3 rounded-card border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-3 shadow-md shadow-amber-100/80'
          : 'flex flex-col gap-3 rounded-card border border-gray-200 bg-white p-3'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setPanelExpanded((current) => !current)}
          className={`flex min-w-0 flex-1 items-start gap-2 rounded-md text-left transition-colors ${
            hasAlerts ? 'hover:bg-amber-100/60' : 'hover:bg-gray-50'
          }`}
          aria-expanded={panelExpanded}
          title={panelExpanded ? 'Collapse alerts' : 'Expand alerts'}
        >
          {panelExpanded ? (
            <ChevronDown
              className={`mt-1.5 h-3.5 w-3.5 flex-shrink-0 ${
                hasAlerts ? 'text-amber-800' : 'text-gray-400'
              }`}
            />
          ) : (
            <ChevronRight
              className={`mt-1.5 h-3.5 w-3.5 flex-shrink-0 ${
                hasAlerts ? 'text-amber-800' : 'text-gray-400'
              }`}
            />
          )}
          <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
              hasAlerts
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-400 ring-1 ring-gray-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <h3
              className={`text-xs font-bold uppercase tracking-wide ${
                hasAlerts ? 'text-amber-900' : 'text-gray-500'
              }`}
            >
              Alerts
            </h3>
            <p
              className={`mt-0.5 text-[10px] ${
                hasAlerts ? 'text-amber-800/80' : 'text-gray-400'
              }`}
            >
              Open conditions for {layerLabel}
              {hasAlerts &&
                ` · ${realCount} active${testCount > 0 ? `, ${testCount} test` : ''}`}
              {!hasAlerts && ' · none open'}
              {!panelExpanded && topAlert && (
                <span className="mt-0.5 block truncate text-amber-900/90">
                  Highest: {formatSeverityLabel(topAlert.severity)}
                  {topAlert.category ? ` · ${topAlert.category}` : ''}
                </span>
              )}
            </p>
          </div>
        </button>
        <div className="flex flex-shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className={`rounded p-1 transition-colors ${
              hasAlerts
                ? 'text-amber-700/70 hover:bg-amber-100 hover:text-amber-900'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="What triggers these alerts?"
            aria-label="What triggers these alerts?"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`rounded p-1 transition-colors disabled:opacity-50 ${
              hasAlerts
                ? 'text-amber-700/70 hover:bg-amber-100 hover:text-amber-900'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="Refresh alerts"
            aria-label="Refresh alerts"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <AlertRulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />

      {panelExpanded && (
        <>
          {alerts.length > 0 && severityOptions.length > 1 && (
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by severity">
              <button
                type="button"
                onClick={() => setSeverityFilter('all')}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  severityFilter === 'all'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-amber-200 hover:bg-amber-50'
                }`}
              >
                All ({alerts.length})
              </button>
              {severityOptions.map(({ severity, count }) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setSeverityFilter(severity)}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                    severityFilter === severity
                      ? 'text-white'
                      : 'bg-white text-gray-600 ring-1 ring-amber-200 hover:bg-amber-50'
                  }`}
                  style={
                    severityFilter === severity
                      ? { backgroundColor: severityCssColor(severity) }
                      : undefined
                  }
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        severityFilter === severity ? '#fff' : severityCssColor(severity),
                    }}
                  />
                  {formatSeverityLabel(severity)} ({count})
                </button>
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-card border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
            >
              {error}
            </div>
          )}

          {!error && filteredAlerts.length === 0 && !isLoading && (
            <p className="rounded-card border border-dashed border-gray-200 bg-gray-50/50 px-3 py-3 text-[11px] leading-relaxed text-gray-500">
              {alerts.length === 0
                ? 'No open alerts for this layer right now.'
                : 'No stations match this severity filter.'}
            </p>
          )}

          {!error && alerts.length === 0 && isLoading && (
            <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-amber-800/80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading alerts…
            </div>
          )}

          <div className="flex flex-col gap-2">
            {categories.map((group) => (
              <CategoryBlock
                key={group.category}
                group={group}
                onSelectAlert={onSelectAlert}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
