// ============================================================================
// SdmDistributionChart — how suitability probability is spread across the map
// for one or more runs, with the suitability threshold drawn on top.
//
// Each run is a line: the share of mapped cells at each probability. A vertical
// dashed line marks the threshold, so the user can see what share of cells
// would count as suitable before running Find Common Areas.
// ============================================================================

import { formatNumber, formatPercent } from '../suitability/RunAnalysisView';
import type { SdmHistogram } from '../types';

export interface DistributionSeries {
  id: string;
  label: string;
  color: string;
  histogram: SdmHistogram;
  /** This run's own threshold, drawn in its color. Falls back to the chart's. */
  threshold?: number | null;
}

/** Colors for runs on one chart, picked to stay apart from each other. */
export const SERIES_COLORS = [
  '#059669',
  '#2563eb',
  '#ea580c',
  '#7c3aed',
  '#db2777',
  '#ca8a04',
  '#0891b2',
  '#4b5563',
] as const;

/**
 * The share (percent) of mapped cells at or above a probability. A bin the
 * threshold falls inside is counted in proportion to how much of it lies above.
 */
export function shareAtOrAbove(histogram: SdmHistogram, threshold: number): number {
  let share = 0;
  histogram.counts.forEach((_, index) => {
    const low = histogram.bin_edges[index];
    const high = histogram.bin_edges[index + 1];
    const percent = histogram.percent[index] ?? 0;
    if (low == null || high == null) return;
    if (low >= threshold) share += percent;
    else if (high > threshold && high > low) share += (percent * (high - threshold)) / (high - low);
  });
  return share;
}

const WIDTH = 300;
const HEIGHT = 128;
const LEFT = 6;
const RIGHT = WIDTH - 6;
const TOP = 16;
const BOTTOM = 104;

const xFor = (probability: number) => LEFT + Math.min(Math.max(probability, 0), 1) * (RIGHT - LEFT);

interface Point {
  x: number;
  value: number;
}

function pointsOf(histogram: SdmHistogram): Point[] {
  const points: Point[] = [];
  histogram.counts.forEach((_, index) => {
    const low = histogram.bin_edges[index];
    const high = histogram.bin_edges[index + 1];
    if (low == null || high == null) return;
    points.push({ x: xFor((low + high) / 2), value: histogram.percent[index] ?? 0 });
  });
  return points;
}

interface SdmDistributionChartProps {
  series: DistributionSeries[];
  /** One cutoff for every run, shown as a single labelled line. */
  threshold?: number | null;
}

export function SdmDistributionChart({ series, threshold = null }: SdmDistributionChartProps) {
  const drawn = series.map((item) => ({ ...item, points: pointsOf(item.histogram) }));
  const peak = Math.max(1, ...drawn.flatMap((item) => item.points.map((point) => point.value)));
  const yFor = (value: number) => BOTTOM - (value / peak) * (BOTTOM - TOP);
  const validThreshold = threshold != null && Number.isFinite(threshold) ? threshold : null;
  const ownLines = drawn.filter((item) => item.threshold != null);

  return (
    <figure className="flex flex-col gap-2" id="sdm-distribution-chart">
      <figcaption className="text-xs leading-relaxed text-gray-600">
        Share of mapped cells at each suitability probability
        {validThreshold != null || ownLines.length > 0
          ? '. The dashed line is the threshold: cells to its right count as suitable.'
          : '.'}
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Suitability probability distribution of the chosen runs"
        className="w-full"
      >
        <line x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} stroke="#d1d5db" />
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <g key={tick}>
            <line x1={xFor(tick)} x2={xFor(tick)} y1={BOTTOM} y2={BOTTOM + 3} stroke="#9ca3af" />
            <text
              x={xFor(tick)}
              y={BOTTOM + 13}
              textAnchor={tick === 0 ? 'start' : tick === 1 ? 'end' : 'middle'}
              fontSize={9}
              fill="#6b7280"
            >
              {tick}
            </text>
          </g>
        ))}
        <text x={LEFT} y={HEIGHT - 3} fontSize={8} fill="#9ca3af">
          unsuitable
        </text>
        <text x={RIGHT} y={HEIGHT - 3} fontSize={8} fill="#9ca3af" textAnchor="end">
          suitable
        </text>

        {drawn.map((item) => {
          if (item.points.length === 0) return null;
          const line = item.points.map((point) => `${point.x},${yFor(point.value)}`).join(' ');
          const first = item.points[0];
          const last = item.points[item.points.length - 1];
          return (
            <g key={item.id}>
              {drawn.length === 1 && (
                <polygon
                  points={`${first.x},${BOTTOM} ${line} ${last.x},${BOTTOM}`}
                  fill={item.color}
                  fillOpacity={0.15}
                />
              )}
              <polyline
                points={line}
                fill="none"
                stroke={item.color}
                strokeWidth={1.75}
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {ownLines.map((item) => (
          <line
            key={`own-${item.id}`}
            data-testid="threshold-line"
            x1={xFor(item.threshold as number)}
            x2={xFor(item.threshold as number)}
            y1={TOP - 6}
            y2={BOTTOM}
            stroke={item.color}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        ))}
        {ownLines.length === 0 && validThreshold != null && (
          <g>
            <line
              data-testid="threshold-line"
              x1={xFor(validThreshold)}
              x2={xFor(validThreshold)}
              y1={TOP - 6}
              y2={BOTTOM}
              stroke="#111827"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={xFor(validThreshold)}
              y={TOP - 8}
              fontSize={9}
              fontWeight={600}
              fill="#111827"
              textAnchor={validThreshold > 0.85 ? 'end' : 'middle'}
            >
              {formatNumber(validThreshold)}
            </text>
          </g>
        )}
      </svg>

      <ul className="flex flex-col gap-1">
        {drawn.map((item) => {
          const cutoff = item.threshold ?? validThreshold;
          return (
            <li key={item.id} className="flex items-start gap-2 text-xs text-gray-700">
              <span
                className="mt-1 inline-block h-2 w-4 shrink-0 rounded-sm"
                style={{ background: item.color }}
              />
              <span className="min-w-0 flex-1 break-words">{item.label}</span>
              {cutoff != null && (
                <span className="shrink-0 tabular-nums text-gray-600">
                  {formatPercent(shareAtOrAbove(item.histogram, cutoff))} suitable
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
