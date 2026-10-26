// ============================================================================
// RunAnalysisView — what a finished suitability run chose.
//
// Shows the overall score distribution, then for one suitability band at a
// time (1-2, 2-3, ...) how each input layer was distributed over the cells
// that landed in that band. All numbers come from the "Run Analysis (JSON)"
// output the Weighted Raster Overlay tool writes.
// ============================================================================

import { useMemo, useState } from 'react';
import { CollapsibleSection } from '../CollapsibleSection';
import { SUITABILITY_RAMP } from '../suitabilityRamp';
import type {
  AnalysisBand,
  AnalysisBandInput,
  SuitabilityRunAnalysis,
  SuitabilityRunInput,
  SuitabilityRunRecord,
} from '../types';

interface RunAnalysisViewProps {
  analysis: SuitabilityRunAnalysis;
  record: SuitabilityRunRecord | null;
}

/** Ramp color for a score on the 1..scaleMax scale. */
export function scoreColor(score: number, scaleMax: number): string {
  const span = Math.max(scaleMax - 1, 1);
  const t = Math.min(Math.max((score - 1) / span, 0), 1);
  const position = t * (SUITABILITY_RAMP.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(lower + 1, SUITABILITY_RAMP.length - 1);
  const mix = position - lower;
  const channel = (index: 0 | 1 | 2) =>
    Math.round(SUITABILITY_RAMP[lower][index] * (1 - mix) + SUITABILITY_RAMP[upper][index] * mix);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '–';
  if (value > 0 && value < 0.1) return '<0.1%';
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '–';
  const magnitude = Math.abs(value);
  if (magnitude >= 1000) return Math.round(value).toLocaleString('en-US');
  if (magnitude >= 10) return value.toFixed(1).replace(/\.0$/, '');
  if (magnitude >= 1) return value.toFixed(2).replace(/\.?0+$/, '');
  return value.toFixed(3).replace(/\.?0+$/, '') || '0';
}

export function formatArea(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${value >= 100 ? Math.round(value).toLocaleString('en-US') : value.toFixed(1)} km²`;
}

export function PercentBar({ percent, color }: { percent: number | null; color: string }) {
  const width = percent == null ? 0 : Math.min(Math.max(percent, 0), 100);
  return (
    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-sm bg-gray-200">
      <div className="h-full rounded-sm" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

export interface HistogramBin {
  low: number;
  high: number;
  count: number;
  percent: number;
}

/**
 * Merge neighbouring bins so no chart has more than `maxBins` bars. The tool
 * writes fine bins (16 for the overall score); drawn as-is on a narrow panel
 * they are thin and spiky with gaps wherever a bin is empty.
 */
export function mergeBins(
  edges: (number | null)[],
  counts: (number | null)[],
  percents: (number | null)[],
  maxBins: number,
): HistogramBin[] {
  const size = Math.max(Math.ceil(counts.length / maxBins), 1);
  const bins: HistogramBin[] = [];
  for (let start = 0; start < counts.length; start += size) {
    const end = Math.min(start + size, counts.length);
    let count = 0;
    let percent = 0;
    for (let index = start; index < end; index += 1) {
      count += counts[index] ?? 0;
      percent += percents[index] ?? 0;
    }
    bins.push({ low: edges[start] ?? 0, high: edges[end] ?? edges[start] ?? 0, count, percent });
  }
  return bins;
}

interface ColumnChartProps {
  bins: HistogramBin[];
  colors: string[];
  /** Print each bar's share above it. */
  showShare?: boolean;
  /** One label centered under each bar. */
  barLabels?: string[];
  startLabel?: string;
  endLabel?: string;
  height?: number;
}

/** Touching vertical bars, one per bin, scaled to the tallest bin. */
export function ColumnChart({
  bins,
  colors,
  showShare = false,
  barLabels,
  startLabel,
  endLabel,
  height = 120,
}: ColumnChartProps) {
  const max = Math.max(...bins.map((bin) => bin.count), 1);
  // Leave headroom so the share label above the tallest bar is not clipped.
  const headroom = showShare ? 86 : 100;

  return (
    <div>
      <div className="flex items-stretch border-b border-gray-300" style={{ height }}>
        {bins.map((bin, index) => {
          const barHeight = bin.count > 0 ? Math.max((bin.count / max) * headroom, 2) : 0;
          return (
            <div
              key={index}
              title={`${formatNumber(bin.low)}–${formatNumber(bin.high)}: ${formatCount(bin.count)} cells (${formatPercent(bin.percent)})`}
              className="relative min-w-0 flex-1"
            >
              {/* Empty bins keep a thin stub so the bars read as one unbroken run. */}
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: bin.count > 0 ? `${barHeight}%` : 2,
                  background: bin.count > 0 ? colors[index] : '#e5e7eb',
                  boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.7)',
                }}
              />
              {showShare && bin.count > 0 && (
                <span
                  className="absolute inset-x-0 text-center text-[10px] leading-none tabular-nums text-gray-600"
                  style={{ bottom: `calc(${barHeight}% + 2px)` }}
                >
                  {formatPercent(bin.percent)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {barLabels && (
        <div className="mt-1 flex text-[10px] text-gray-600">
          {barLabels.map((label, index) => (
            <span key={index} className="min-w-0 flex-1 truncate text-center tabular-nums">
              {label}
            </span>
          ))}
        </div>
      )}
      {(startLabel || endLabel) && (
        <div className="mt-0.5 flex justify-between text-[10px] text-gray-500">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  );
}

/**
 * One bar per whole-point interval (1–2, 2–3, ...), the same bands the input
 * cards are split by. Older output without bands falls back to the merged fine
 * histogram.
 */
export function distributionBins(analysis: SuitabilityRunAnalysis): HistogramBin[] {
  if (analysis.bands.length > 0) {
    return analysis.bands.map((band) => ({
      low: band.min,
      high: band.max,
      count: band.cells,
      percent: band.percent ?? 0,
    }));
  }
  const { histogram } = analysis;
  return mergeBins(histogram.bin_edges, histogram.counts, histogram.percent, 8);
}

function OverallDistribution({ analysis }: { analysis: SuitabilityRunAnalysis }) {
  const { scale_max: scaleMax, stats, cells, area_km2: area } = analysis;
  const bins = useMemo(() => distributionBins(analysis), [analysis]);
  const barLabels = bins.map((bin) => `${formatNumber(bin.low)}–${formatNumber(bin.high)}`);
  const areaText = formatArea(area.scored);

  return (
    <div>
    <p className="mb-2 text-xs leading-relaxed text-gray-600">
      How the scored cells spread across the 1 to {scaleMax} scale, one bar per point of score
      (1–2, 2–3, ...). Taller bars mean more of the area landed in that range.
    </p>
    <CollapsibleSection
      variant="card"
      title="Suitability distribution"
      hint={`mean ${formatNumber(stats.mean)}`}
    >
      <p className="text-xs leading-relaxed text-gray-600">
        {formatCount(cells.scored)} scored cells{areaText ? ` (${areaText})` : ''} · mean{' '}
        {formatNumber(stats.mean)} · median {formatNumber(stats.median)}
      </p>
      <div className="mt-3">
        <ColumnChart
          bins={bins}
          colors={bins.map((bin) => scoreColor((bin.low + bin.high) / 2, scaleMax))}
          showShare
          barLabels={barLabels}
          startLabel="Low suitability"
          endLabel="High suitability"
        />
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {analysis.classes.map((entry) => (
          <li key={entry.score} className="flex items-center gap-2 text-xs text-gray-700">
            <span className="w-14 shrink-0 tabular-nums">Score {entry.score}</span>
            <PercentBar percent={entry.percent} color={scoreColor(entry.score, scaleMax)} />
            <span className="w-10 shrink-0 text-right tabular-nums">{formatPercent(entry.percent)}</span>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
    </div>
  );
}

function inputTitle(input: AnalysisBandInput, layer: SuitabilityRunInput | undefined): string {
  return layer?.title?.trim() || input.name;
}

function InputCard({
  input,
  layer,
  weightShare,
  scaleMax,
}: {
  input: AnalysisBandInput;
  layer: SuitabilityRunInput | undefined;
  weightShare: number | null;
  scaleMax: number;
}) {
  const scores = input.score_distribution;
  const scoreMax = Math.max(...scores.map((entry) => entry.count), 1);

  return (
    <li>
    <CollapsibleSection
      variant="card"
      title={inputTitle(input, layer)}
      hint={weightShare != null ? `${formatPercent(weightShare)} weight` : undefined}
    >
      <p className="text-xs text-gray-500">
        {weightShare != null ? `${formatPercent(weightShare)} of weight · ` : ''}
        scored {formatPercent(input.coverage_percent)} of these cells · mean score{' '}
        {formatNumber(input.mean_score)}
      </p>

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Score it gave these cells
      </p>
      <div className="mt-1 flex items-end gap-1" style={{ height: 44 }}>
        {scores.map((entry) => (
          <div
            key={entry.score}
            className="flex min-w-0 flex-1 flex-col items-center justify-end"
            style={{ height: '100%' }}
            title={`Score ${entry.score}: ${formatCount(entry.count)} cells (${formatPercent(entry.percent)})`}
          >
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${entry.count > 0 ? Math.max((entry.count / scoreMax) * 100, 4) : 0}%`,
                background: scoreColor(entry.score, scaleMax),
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-[10px] text-gray-500">
        {scores.map((entry) => (
          <span key={entry.score} className="min-w-0 flex-1 text-center tabular-nums">
            {entry.score}
            <br />
            {formatPercent(entry.percent)}
          </span>
        ))}
      </div>

      {input.values && input.values.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Most common values
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {input.values.map((entry) => {
              const label = layer?.categoryLabels?.[String(entry.value)];
              return (
                <li key={entry.value} className="flex items-center gap-2 text-xs text-gray-700">
                  <span
                    className="w-24 shrink-0 truncate"
                    title={label ? `${label} (${entry.value})` : String(entry.value)}
                  >
                    {label || entry.value}
                  </span>
                  <PercentBar percent={entry.percent} color="#059669" />
                  <span className="w-10 shrink-0 text-right tabular-nums">
                    {formatPercent(entry.percent)}
                  </span>
                </li>
              );
            })}
          </ul>
          {input.other && (
            <p className="mt-1 text-[11px] text-gray-500">
              {formatPercent(input.other.percent)} in {input.other.classes} other{' '}
              {input.other.classes === 1 ? 'class' : 'classes'}
            </p>
          )}
        </div>
      )}

      {input.value_histogram && input.value_stats && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Pixel values
          </p>
          <div className="mt-1">
            <ColumnChart
              bins={mergeBins(
                input.value_histogram.bin_edges,
                input.value_histogram.counts,
                input.value_histogram.percent,
                10,
              )}
              colors={input.value_histogram.counts.map(() => '#059669')}
              startLabel={formatNumber(input.value_histogram.bin_edges[0])}
              endLabel={formatNumber(
                input.value_histogram.bin_edges[input.value_histogram.bin_edges.length - 1],
              )}
              height={64}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Median {formatNumber(input.value_stats.median)} · middle 80%{' '}
            {formatNumber(input.value_stats.p10)}–{formatNumber(input.value_stats.p90)}
          </p>
        </div>
      )}
    </CollapsibleSection>
    </li>
  );
}

function bandSummary(band: AnalysisBand): string {
  const area = formatArea(band.area_km2);
  return [
    `${formatCount(band.cells)} cells`,
    formatPercent(band.percent),
    area,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function RunAnalysisView({ analysis, record }: RunAnalysisViewProps) {
  const bands = analysis.bands;
  const scaleMax = analysis.scale_max;
  // Start on the best band that has cells: that is the area people care about.
  const defaultBand = useMemo(() => {
    for (let index = bands.length - 1; index >= 0; index -= 1) {
      if (bands[index].cells > 0) return index;
    }
    return Math.max(bands.length - 1, 0);
  }, [bands]);
  const [chosen, setChosen] = useState<number | null>(null);
  const bandIndex = chosen != null && chosen < bands.length ? chosen : defaultBand;
  const band = bands[bandIndex];
  const weightShares = useMemo(
    () => new Map(analysis.layers.map((layer) => [layer.index, layer.weight_share])),
    [analysis.layers],
  );

  return (
    <div className="flex flex-col gap-4">
      <OverallDistribution analysis={analysis} />

      {band && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            What each input looked like
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Pick a suitability band to see the inputs behind the cells that landed in it.
          </p>
          <div role="group" aria-label="Suitability band" className="mt-2 flex gap-1">
            {bands.map((item, index) => {
              const active = index === bandIndex;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setChosen(index)}
                  aria-pressed={active}
                  className={`min-w-0 flex-1 rounded-md border px-1 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ background: scoreColor((item.min + item.max) / 2, scaleMax) }}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Suitability {band.label}: {bandSummary(band)}
          </p>

          {band.inputs.length === 0 ? (
            <p className="mt-2 rounded-card border border-dashed border-gray-300 bg-gray-50 px-2.5 py-3 text-sm text-gray-500">
              No cells fell in this band.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {band.inputs.map((input) => (
                <InputCard
                  key={input.index}
                  input={input}
                  layer={record?.layers[input.index - 1]}
                  weightShare={weightShares.get(input.index) ?? null}
                  scaleMax={scaleMax}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
