// ============================================================================
// ScalarDetailPanel — statistics, renderer switch, and legend for one scalar
// weather variable.
// ============================================================================

import { Layers, RefreshCw, Signal, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { rampToCssGradient } from './internal/colorRamps';
import type { ScalarVizMode } from './internal/useScalarVisualization';
import { formatObservedAt } from './internal/formatObservedAt';
import {
  allowsInterpolation,
  getRampBounds,
  isElevationValued,
  type ScalarSnapshot,
  type SensorVariableConfig,
} from '../../services/sensorService';

interface ModeOption {
  id: ScalarVizMode;
  label: string;
  icon: LucideIcon;
}

const MODES: ModeOption[] = [
  { id: 'surface', label: 'Surface', icon: Layers },
  { id: 'labels', label: 'Labels', icon: Tag },
];


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
  /** Whether the map is currently a 3D scene, which adds the well columns. */
  is3D: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ScalarDetailPanel({
  config,
  snapshot,
  mode,
  onModeChange,
  is3D,
  isLoading,
  onRefresh,
}: ScalarDetailPanelProps) {
  const readings = snapshot.readings;
  const mean = readings.reduce((total, reading) => total + reading.value, 0) / readings.length;

  const midpointCount = readings.filter((reading) =>
    reading.derivation.startsWith('midpoint'),
  ).length;

  const format = (value: number) => value.toFixed(config.decimals);

  // Nothing measurable anywhere, e.g. a dry day: there is no surface to explain
  // and the ramp would imply a gradient that does not exist.
  const isAbsentEverywhere =
    config.absenceBelow !== undefined && snapshot.max < config.absenceBelow;

  const [rampLow, rampHigh] = getRampBounds(config, snapshot);

  const isSubsurface = is3D && isElevationValued(config);
  const modes = allowsInterpolation(config)
    ? MODES
    : MODES.filter((option) => option.id === 'labels');

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

      {readings.length === 1 ? (
        // Mean, low and high are all the same number at a single gage, so the
        // three cards would just repeat the reading three times.
        <div className="grid grid-cols-1 gap-2">
          <StatCard
            value={format(readings[0].value)}
            label={`Current (${config.unit}) — ${readings[0].stationName}`}
            hint={readings[0].stationName}
          />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <StatCard value={format(mean)} label={`Mean (${config.unit})`} />
          <StatCard value={format(snapshot.min)} label={`Low (${config.unit})`} />
          <StatCard value={format(snapshot.max)} label={`High (${config.unit})`} />
          <StatCard value={String(readings.length)} label="Stations" />
        </div>
      )}

      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Visualization
        </span>
        <div
          role="group"
          aria-label={`${config.label} visualization mode`}
          className={`mt-2 grid gap-1.5 ${
            modes.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {modes.map((option) => {
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
              ? `Inverse-distance weighted from ${readings.length} stations, drawn at even opacity with each station's value marked on the map. Anywhere between the markers is an estimate. Stations with an open alert also show a severity flag.`
              : `One disc per station showing its reading in ${config.unit}. Stations with an open alert get a small severity circle with an exclamation above them.`}
        </p>

        {config.note && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">{config.note}</p>
        )}

        {isSubsurface && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            Each well also drops a column from the ground down to the water table, its
            length being the depth to water. The terrain is semi-transparent and the
            camera can descend below it to look along them.
          </p>
        )}

        {!allowsInterpolation(config) && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            {readings.length === 1
              ? 'Shown only where it was measured. A single gage gives no basis for spreading the reading across the map, so no surface is offered.'
              : config.deriveHeadFromDepth
                ? `Shown only where it was measured. ${readings.length} wells across this much hill country cannot resolve a water table between them, so no interpolated surface is offered.`
                : `Shown only where it was measured. ${readings.length} stations do not sample a continuous surface, so no interpolation is offered.`}
          </p>
        )}

        {!isAbsentEverywhere && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] tabular-nums text-gray-500">
                {format(rampLow)}
              </span>
              <div
                className="h-1.5 flex-1 rounded-full"
                style={{ background: rampToCssGradient(config.ramp) }}
                role="presentation"
              />
              <span className="text-[10px] tabular-nums text-gray-500">
                {format(rampHigh)}
              </span>
            </div>

            {config.displayRange && (
              <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                A fixed scale rather than the range across stations, since one gage has
                no range of its own. Readings above {format(rampHigh)} {config.unit} sit
                at the top of the ramp.
              </p>
            )}
          </>
        )}

        {config.normalizeToSeaLevel && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            Corrected to mean sea level. Raw station readings vary by roughly 50 hPa
            across the preserve from elevation alone, which would otherwise map
            terrain instead of weather.
          </p>
        )}

        {config.deriveHeadFromDepth && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            Water-table elevation above sea level, computed as each well's ground
            elevation minus its depth to water. Depth is reported in feet with an
            inconsistent sign, so its magnitude is used. Depth alone is not
            comparable between wells because the ground itself varies by
            hundreds of metres.
          </p>
        )}

        {midpointCount > 0 && !config.normalizeToSeaLevel && (
          <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
            {midpointCount} of {readings.length} stations report only interval minimum
            and maximum, so their value is the midpoint of the two.
          </p>
        )}
      </div>
    </section>
  );
}
