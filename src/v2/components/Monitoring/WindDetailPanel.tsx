// ============================================================================
// WindDetailPanel — statistics, renderer switch, and legend for wind.
// ============================================================================

import { Grid3x3, Navigation, RefreshCw, Signal, Tag, Waves, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getSpeedColorCss } from './internal/windField';
import type { WindVizMode } from './internal/useWindVisualization';
import type { WindStatistics } from './internal/windStatistics';
import { getCompassLabel, type WindSnapshot } from '../../services/windService';

interface VizModeOption {
  id: WindVizMode;
  label: string;
  icon: LucideIcon;
  description: string;
}

const VIZ_MODES: VizModeOption[] = [
  {
    id: 'arrows',
    label: 'Arrows',
    icon: Navigation,
    description:
      'One arrow per reporting station, pointing the way the wind is travelling. Size and colour scale with average speed.',
  },
  {
    id: 'flow',
    label: 'Flow',
    icon: Waves,
    description:
      'Animated particles drift along the interpolated wind field, so gradients between stations are visible as motion.',
  },
  {
    id: 'grid',
    label: 'Grid',
    icon: Grid3x3,
    description:
      'A 20 by 15 lattice of arrows interpolated from the stations. Click any arrow for its modelled speed and bearing.',
  },
  {
    id: 'labels',
    label: 'Labels',
    icon: Tag,
    description:
      'Each station as a disc showing its average speed in m/s, shaded by the same ramp. Click a disc for gust and bearing.',
  },
];

/** Sampled from the shared ramp so the bar always matches the renderers. */
const GRADIENT_CSS = `linear-gradient(to right, ${[0, 0.25, 0.5, 0.75, 1]
  .map((stop) => getSpeedColorCss(stop))
  .join(', ')})`;

function formatObservedAt(epochMs: number): string {
  if (!epochMs) return 'Unknown';
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(epochMs: number): string {
  const seconds = Math.round((Date.now() - epochMs) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  hint?: string;
}

function StatCard({ icon: Icon, value, label, hint }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-card border border-gray-200 bg-gray-50 px-3 py-3"
      title={hint}
    >
      <Icon className="h-4 w-4 text-gray-400" />
      <span className="text-lg font-semibold leading-tight text-gray-900">{value}</span>
      <span className="text-center text-[10px] font-medium leading-tight text-gray-500">
        {label}
      </span>
    </div>
  );
}

interface WindDetailPanelProps {
  snapshot: WindSnapshot;
  statistics: WindStatistics;
  mode: WindVizMode;
  onModeChange: (mode: WindVizMode) => void;
  isLoading: boolean;
  fetchedAt: number | null;
  onRefresh: () => void;
}

export function WindDetailPanel({
  snapshot,
  statistics,
  mode,
  onModeChange,
  isLoading,
  fetchedAt,
  onRefresh,
}: WindDetailPanelProps) {
  const activeMode = VIZ_MODES.find((option) => option.id === mode) ?? VIZ_MODES[0];

  const directionValue = statistics.prevailingFromBearing === null
    ? 'Variable'
    : `${statistics.prevailingFromBearing.toFixed(0)}° ${getCompassLabel(statistics.prevailingFromBearing)}`;

  return (
    <section id="monitoring-wind-panel" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-gray-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Wind Conditions
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Readings observed {formatObservedAt(snapshot.observedAt)}
            {fetchedAt !== null && ` · checked ${formatRelativeTime(fetchedAt)}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh wind readings"
          className="flex-shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Wind}
          value={statistics.averageSpeed.toFixed(1)}
          label="Avg Speed (m/s)"
        />
        <StatCard
          icon={Wind}
          value={statistics.peakGust.toFixed(1)}
          label="Peak Gust (m/s)"
          hint={`Highest gust reported by ${statistics.peakGustStationName}`}
        />
        <StatCard
          icon={Navigation}
          value={directionValue}
          label="Prevailing Direction (from)"
          hint="Speed-weighted resultant of every reporting station"
        />
        <StatCard
          icon={Signal}
          value={String(statistics.stationCount)}
          label="Stations Reporting"
        />
      </div>

      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Visualization
        </span>
        <div
          role="group"
          aria-label="Wind visualization mode"
          className="mt-2 grid grid-cols-4 gap-1.5"
        >
          {VIZ_MODES.map((option) => {
            const OptionIcon = option.icon;
            const isActive = option.id === mode;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onModeChange(option.id)}
                aria-pressed={isActive}
                className={`flex flex-col items-center gap-1 rounded-card border px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <OptionIcon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-card border border-gray-200 bg-gray-50 px-3 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {activeMode.label} Legend
        </span>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
          {activeMode.description}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Calm</span>
          <div
            className="h-1.5 flex-1 rounded-full"
            style={{ background: GRADIENT_CSS }}
            role="presentation"
          />
          <span className="text-[10px] text-gray-500">Strong</span>
        </div>
      </div>
    </section>
  );
}
