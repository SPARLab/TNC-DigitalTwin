// ============================================================================
// ScalarDetailPanel — statistics, renderer switch, and legend for one scalar
// weather variable.
// ============================================================================

import { Layers, RefreshCw, Signal, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { rampToCssGradient } from './internal/colorRamps';
import type { ScalarVizMode } from './internal/useScalarVisualization';
import type { ScalarSnapshot, SensorVariableConfig } from '../../services/sensorService';

interface ModeOption {
  id: ScalarVizMode;
  label: string;
  icon: LucideIcon;
}

const MODES: ModeOption[] = [
  { id: 'surface', label: 'Surface', icon: Layers },
  { id: 'labels', label: 'Labels', icon: Tag },
];

function formatObservedAt(epochMs: number): string {
  if (!epochMs) return 'Unknown';
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface StatCardProps {
  value: string;
  label: string;
  hint?: string;
}

function StatCard({ value, label, hint }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-card border border-gray-200 bg-gray-50 px-2 py-3"
      title={hint}
    >
      <span className="text-lg font-semibold leading-tight text-gray-900">{value}</span>
      <span className="text-center text-[10px] font-medium leading-tight text-gray-500">
        {label}
      </span>
    </div>
  );
}

interface ScalarDetailPanelProps {
  config: SensorVariableConfig;
  snapshot: ScalarSnapshot;
  mode: ScalarVizMode;
  onModeChange: (mode: ScalarVizMode) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ScalarDetailPanel({
  config,
  snapshot,
  mode,
  onModeChange,
  isLoading,
  onRefresh,
}: ScalarDetailPanelProps) {
  const readings = snapshot.readings;
  const mean = readings.reduce((total, reading) => total + reading.value, 0) / readings.length;

  const derivedCount = readings.filter(
    (reading) => reading.derivation !== 'reported',
  ).length;

  const format = (value: number) => value.toFixed(config.decimals);

  // Nothing measurable anywhere, e.g. a dry day: there is no surface to explain
  // and the ramp would imply a gradient that does not exist.
  const isAbsentEverywhere =
    config.absenceBelow !== undefined && snapshot.max < config.absenceBelow;

  return (
    <section id="monitoring-scalar-panel" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-gray-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {config.label}
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Observed {formatObservedAt(snapshot.observedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label={`Refresh ${config.label} readings`}
          className="flex-shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatCard value={format(mean)} label={`Mean (${config.unit})`} />
        <StatCard value={format(snapshot.min)} label={`Low (${config.unit})`} />
        <StatCard value={format(snapshot.max)} label={`High (${config.unit})`} />
        <StatCard value={String(readings.length)} label="Stations" />
      </div>

      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Visualization
        </span>
        <div
          role="group"
          aria-label={`${config.label} visualization mode`}
          className="mt-2 grid grid-cols-2 gap-1.5"
        >
          {MODES.map((option) => {
            const OptionIcon = option.icon;
            const isActive = option.id === mode;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onModeChange(option.id)}
                aria-pressed={isActive}
                className={`flex items-center justify-center gap-1.5 rounded-card border px-2 py-2 text-[11px] font-medium transition-colors ${
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
          Legend
        </span>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
          {isAbsentEverywhere
            ? `No measurable ${config.label.toLowerCase()} at any of the ${readings.length} reporting stations, so no surface is drawn. Station values are still marked on the map.`
            : mode === 'surface'
              ? `Inverse-distance weighted from ${readings.length} stations, drawn at even opacity with each station's measured value marked on the map. Anywhere between the markers is an estimate.`
              : `One disc per station showing its reading in ${config.unit}. Click a disc for provenance.`}
        </p>

        {!isAbsentEverywhere && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] tabular-nums text-gray-500">
              {format(snapshot.min)}
            </span>
            <div
              className="h-1.5 flex-1 rounded-full"
              style={{ background: rampToCssGradient(config.ramp) }}
              role="presentation"
            />
            <span className="text-[10px] tabular-nums text-gray-500">
              {format(snapshot.max)}
            </span>
          </div>
        )}

        {config.normalizeToSeaLevel && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            Corrected to mean sea level. Raw station readings vary by roughly 50 hPa
            across the preserve from elevation alone, which would otherwise map
            terrain instead of weather.
          </p>
        )}

        {derivedCount > 0 && !config.normalizeToSeaLevel && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            {derivedCount} of {readings.length} stations report only interval minimum
            and maximum, so their value is the midpoint of the two.
          </p>
        )}
      </div>
    </section>
  );
}
