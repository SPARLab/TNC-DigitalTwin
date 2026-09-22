// ============================================================================
// DendraMultiSeriesChart — crisp SVG multi-series time chart (no canvas/HiDPI blur).
// Supports hover tooltips, drag-to-zoom, and summary stats for the visible range.
// ============================================================================

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import type { DendraTimeSeriesPoint } from '../../../services/dendraStationService';
import { DendraRawDataCaution } from './DendraRawDataCaution';

export const DENDRA_SERIES_COLORS = ['#0d9488', '#2563eb', '#d97706', '#7c3aed', '#dc2626'] as const;

/** Cap SVG path vertices so long backfills stay responsive. */
const MAX_RENDER_POINTS = 2500;

export interface DendraChartSeries {
  id: string;
  label: string;
  color?: string;
  points: DendraTimeSeriesPoint[];
}

interface DendraMultiSeriesChartProps {
  series: DendraChartSeries[];
  unit?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  /** Show high / low / average for the visible window. */
  showStats?: boolean;
  /** Enable drag-to-zoom and wheel zoom (modal charts). */
  enableZoom?: boolean;
  /** Show raw / unscrubbed sensor data caution under the chart. */
  showRawDataCaution?: boolean;
  /** Stretch plot to fill parent height; stats/caution stay visible below. */
  fillContainer?: boolean;
}

interface ChartStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface ZoomWindow {
  start: number;
  end: number;
}

/** Avoid Math.min(...hugeArray) — spread blows the call stack on long series. */
function extentOf(values: ArrayLike<number>): { min: number; max: number } | null {
  if (values.length === 0) return null;
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    const value = values[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { min, max };
}

/** Stride-sample dense series for SVG; keeps first/last points. */
function downsamplePoints(
  points: DendraTimeSeriesPoint[],
  maxPoints: number,
): DendraTimeSeriesPoint[] {
  if (points.length <= maxPoints) return points;
  const lastIndex = points.length - 1;
  const step = lastIndex / (maxPoints - 1);
  const sampled: DendraTimeSeriesPoint[] = [];
  let previousIndex = -1;
  for (let i = 0; i < maxPoints; i++) {
    const index = i === maxPoints - 1 ? lastIndex : Math.round(i * step);
    if (index === previousIndex) continue;
    sampled.push(points[index]);
    previousIndex = index;
  }
  return sampled;
}

function computeStats(series: DendraChartSeries[], start: number, end: number): ChartStats | null {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  for (const entry of series) {
    for (const point of entry.points) {
      if (point.timestamp < start || point.timestamp > end) continue;
      if (point.value < min) min = point.value;
      if (point.value > max) max = point.value;
      sum += point.value;
      count += 1;
    }
  }
  if (count === 0 || !Number.isFinite(min)) return null;
  return { min, max, avg: sum / count, count };
}

function filterSeriesToWindow(
  series: DendraChartSeries[],
  start: number,
  end: number,
): DendraChartSeries[] {
  return series.map((entry) => ({
    ...entry,
    points: entry.points.filter((point) => point.timestamp >= start && point.timestamp <= end),
  }));
}

const MAX_Y_AXIS_DECIMALS = 3;
/** Treat ranges smaller than this as flat (all zeros / sensor noise). */
const FLAT_VALUE_EPSILON = 1e-9;

/** Pick Y-axis decimals from the data magnitude so tiny values (e.g. 0.02 mm) stay readable. */
export function inferYAxisDecimals(values: number[]): number {
  const extent = extentOf(values);
  if (!extent) return 1;
  const { min, max } = extent;
  const range = Math.abs(max - min);
  const scale = Math.max(Math.abs(min), Math.abs(max), range);
  // Flat / all-zero series: whole numbers only (avoids 0.000000 / -0.000000 ticks).
  if (scale < FLAT_VALUE_EPSILON) return 0;
  if (scale >= 100) return 0;
  if (scale >= 10) return 1;
  if (scale >= 1) return 2;
  const decimals = Math.ceil(-Math.log10(scale)) + 1;
  return Math.min(Math.max(decimals, 1), MAX_Y_AXIS_DECIMALS);
}

export function formatAxisNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(decimals));
  // Collapse -0 / -0.000 from float padding around a flat zero series.
  if (Object.is(rounded, -0) || rounded === 0) return '0';
  return rounded.toFixed(decimals);
}

/** Expand a flat or near-zero value band into a readable Y domain. */
export function resolveYAxisDomain(rawMin: number, rawMax: number): { yMin: number; yMax: number } {
  const span = Math.abs(rawMax - rawMin);
  const magnitude = Math.max(Math.abs(rawMin), Math.abs(rawMax));

  if (span < FLAT_VALUE_EPSILON && magnitude < FLAT_VALUE_EPSILON) {
    // No rain / all zeros: keep 0 at the baseline with a small positive headroom.
    return { yMin: 0, yMax: 1 };
  }

  if (span < FLAT_VALUE_EPSILON) {
    const pad = Math.max(magnitude * 0.1, 1);
    return { yMin: rawMin - pad, yMax: rawMax + pad };
  }

  const pad = span * 0.08;
  return { yMin: rawMin - pad, yMax: rawMax + pad };
}

function buildPolyline(
  points: DendraTimeSeriesPoint[],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  plotWidth: number,
  plotHeight: number,
): string {
  if (points.length === 0 || xMax <= xMin || yMax <= yMin) return '';
  const parts = new Array<string>(points.length);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const x = ((point.timestamp - xMin) / (xMax - xMin)) * plotWidth;
    const y = plotHeight - ((point.value - yMin) / (yMax - yMin)) * plotHeight;
    parts[i] = `${x.toFixed(2)},${y.toFixed(2)}`;
  }
  return parts.join(' ');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function DendraMultiSeriesChart({
  series,
  unit = '',
  height = 160,
  className = '',
  showLegend = true,
  showStats = false,
  enableZoom = false,
  showRawDataCaution = false,
  fillContainer = false,
}: DendraMultiSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const plotAreaRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [measuredPlotHeight, setMeasuredPlotHeight] = useState(height);
  const [hover, setHover] = useState<{
    left: number;
    top: number;
    timestamp: number;
    values: Array<{ label: string; color: string; value: number }>;
  } | null>(null);
  const [fullRange, setFullRange] = useState<ZoomWindow | null>(null);
  const [zoom, setZoom] = useState<ZoomWindow | null>(null);
  const [brush, setBrush] = useState<{ startX: number; currentX: number } | null>(null);
  const brushOriginRef = useRef<number | null>(null);
  const seriesIdsRef = useRef('');
  const fullRangeRef = useRef<ZoomWindow | null>(null);

  useEffect(() => {
    const node = fillContainer ? plotAreaRef.current : containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      const nextWidth = Math.round(rect.width);
      setContainerWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      if (fillContainer) {
        const nextHeight = Math.max(120, Math.round(rect.height));
        setMeasuredPlotHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fillContainer]);

  const resolvedHeight = fillContainer ? measuredPlotHeight : height;
  // Keep full range in sync with loaded points. Only reset the zoom window when
  // the set of series changes (new query), not on progressive backfill chunks.
  useEffect(() => {
    let timeMin = Infinity;
    let timeMax = -Infinity;
    for (const entry of series) {
      for (const point of entry.points) {
        if (point.timestamp < timeMin) timeMin = point.timestamp;
        if (point.timestamp > timeMax) timeMax = point.timestamp;
      }
    }
    if (!Number.isFinite(timeMin) || !Number.isFinite(timeMax) || timeMax <= timeMin) {
      setFullRange(null);
      setZoom(null);
      fullRangeRef.current = null;
      seriesIdsRef.current = '';
      return;
    }

    const nextFull = { start: timeMin, end: timeMax };
    const seriesIds = series.map((entry) => entry.id).join('|');
    const seriesChanged = seriesIds !== seriesIdsRef.current;
    const previousFull = fullRangeRef.current;
    seriesIdsRef.current = seriesIds;
    fullRangeRef.current = nextFull;
    setFullRange(nextFull);

    setZoom((prev) => {
      if (seriesChanged || !prev) return nextFull;
      // If the user was viewing the full range, follow progressive expansion.
      const wasShowingAll = previousFull
        && Math.abs(prev.start - previousFull.start) < 1000
        && Math.abs(prev.end - previousFull.end) < 1000;
      if (wasShowingAll) return nextFull;
      const start = clamp(prev.start, nextFull.start, nextFull.end);
      const end = clamp(prev.end, nextFull.start, nextFull.end);
      if (end <= start) return nextFull;
      return { start, end };
    });
  }, [series]);

  const visibleSeries = useMemo(() => {
    if (!zoom) return series;
    return filterSeriesToWindow(series, zoom.start, zoom.end);
  }, [series, zoom]);

  const stats = useMemo(() => {
    if (!showStats || !zoom) return null;
    return computeStats(visibleSeries, zoom.start, zoom.end);
  }, [showStats, visibleSeries, zoom]);

  const isZoomed = Boolean(
    fullRange
    && zoom
    && (zoom.start > fullRange.start + 1 || zoom.end < fullRange.end - 1),
  );

  const layout = useMemo(() => {
    let valueMin = Infinity;
    let valueMax = -Infinity;
    let timeMin = Infinity;
    let timeMax = -Infinity;
    let valueCount = 0;

    for (const entry of visibleSeries) {
      for (const point of entry.points) {
        const { value, timestamp } = point;
        if (value < valueMin) valueMin = value;
        if (value > valueMax) valueMax = value;
        if (timestamp < timeMin) timeMin = timestamp;
        if (timestamp > timeMax) timeMax = timestamp;
        valueCount += 1;
      }
    }
    if (valueCount === 0 || !Number.isFinite(valueMin) || !Number.isFinite(timeMin)) return null;

    // Prefer the zoom window edges so empty gaps still fill the axis.
    if (zoom) {
      timeMin = zoom.start;
      timeMax = zoom.end;
    }

    const rawMin = valueMin;
    const rawMax = valueMax;
    const { yMin, yMax } = resolveYAxisDomain(rawMin, rawMax);
    const xMin = timeMin;
    const xMax = timeMax;
    // Use the rendered domain so expanded flat/zero axes get readable tick precision.
    const decimals = inferYAxisDecimals([yMin, yMax]);

    // Extra bottom room so date labels are not clipped.
    const pad = {
      top: showLegend ? 30 : 10,
      right: 20,
      bottom: enableZoom ? 52 : 42,
      left: unit ? 62 : 52,
    };
    const width = Math.max(containerWidth || 640, pad.left + pad.right + 80);
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = resolvedHeight - pad.top - pad.bottom;

    const yTicks = 4;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, index) => {
      const t = index / yTicks;
      return yMin + (yMax - yMin) * (1 - t);
    });

    const xTickCount = width < 420 ? 3 : 5;
    const xTickValues = Array.from({ length: xTickCount }, (_, index) => {
      const t = index / (xTickCount - 1);
      return xMin + (xMax - xMin) * t;
    });

    const renderSeries = visibleSeries.map((entry) => ({
      ...entry,
      renderPoints: downsamplePoints(entry.points, MAX_RENDER_POINTS),
    }));

    return {
      width,
      height: resolvedHeight,
      pad,
      plotWidth,
      plotHeight,
      yMin,
      yMax,
      xMin,
      xMax,
      decimals,
      yTickValues,
      xTickValues,
      renderSeries,
    };
  }, [visibleSeries, resolvedHeight, unit, showLegend, containerWidth, zoom, enableZoom]);

  const plotToTimestamp = (plotX: number, xMin: number, xMax: number, plotWidth: number) => (
    xMin + (clamp(plotX, 0, plotWidth) / plotWidth) * (xMax - xMin)
  );

  const clientToPlotX = (clientX: number) => {
    if (!layout) return null;
    const node = fillContainer ? plotAreaRef.current : containerRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return clientX - rect.left - layout.pad.left;
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!enableZoom || !layout || event.button !== 0) return;
    const plotX = clientToPlotX(event.clientX);
    if (plotX == null || plotX < 0 || plotX > layout.plotWidth) return;
    brushOriginRef.current = plotX;
    setBrush({ startX: plotX, currentX: plotX });
    setHover(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!layout) return;
    const plotX = clientToPlotX(event.clientX);
    if (plotX == null) return;

    if (brushOriginRef.current != null && brush) {
      setBrush({ startX: brush.startX, currentX: clamp(plotX, 0, layout.plotWidth) });
      return;
    }

    if (plotX < 0 || plotX > layout.plotWidth) {
      setHover(null);
      return;
    }

    const rect = containerRef.current!.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    const timestamp = plotToTimestamp(plotX, layout.xMin, layout.xMax, layout.plotWidth);

    const values = visibleSeries.map((entry, index) => {
      if (entry.points.length === 0) return null;
      const searchPoints = entry.points.length > 20_000
        ? downsamplePoints(entry.points, 5000)
        : entry.points;
      let nearest = searchPoints[0];
      let best = Math.abs(nearest.timestamp - timestamp);
      for (const point of searchPoints) {
        const delta = Math.abs(point.timestamp - timestamp);
        if (delta < best) {
          best = delta;
          nearest = point;
        }
      }
      return {
        label: entry.label,
        color: entry.color ?? DENDRA_SERIES_COLORS[index % DENDRA_SERIES_COLORS.length],
        value: nearest.value,
      };
    }).filter((entry): entry is { label: string; color: string; value: number } => !!entry);

    setHover({
      left: Math.min(Math.max(relX + 12, 8), rect.width - 160),
      top: Math.min(Math.max(relY - 8, 8), rect.height - 80),
      timestamp,
      values,
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!enableZoom || !layout || !brush || brushOriginRef.current == null) {
      brushOriginRef.current = null;
      setBrush(null);
      return;
    }

    const startX = Math.min(brush.startX, brush.currentX);
    const endX = Math.max(brush.startX, brush.currentX);
    brushOriginRef.current = null;
    setBrush(null);

    // Ignore tiny drags — treat as a click.
    if (endX - startX < 8) return;

    const nextStart = plotToTimestamp(startX, layout.xMin, layout.xMax, layout.plotWidth);
    const nextEnd = plotToTimestamp(endX, layout.xMin, layout.xMax, layout.plotWidth);
    if (nextEnd - nextStart < 60_000) return; // require at least ~1 minute
    setZoom({ start: nextStart, end: nextEnd });

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released.
    }
  };

  const handleWheel = (_event: MouseEvent<SVGSVGElement> & { deltaY?: number }) => {
    // Handled via native wheel listener below for preventDefault.
  };

  useEffect(() => {
    if (!enableZoom) return;
    const node = containerRef.current;
    if (!node) return;

    const onWheel = (event: WheelEvent) => {
      if (!layout || !fullRange || !zoom) return;
      event.preventDefault();
      const plotX = clientToPlotX(event.clientX);
      if (plotX == null) return;

      const focus = plotToTimestamp(plotX, layout.xMin, layout.xMax, layout.plotWidth);
      const span = zoom.end - zoom.start;
      const factor = event.deltaY > 0 ? 1.25 : 0.8;
      const nextSpan = clamp(span * factor, 60_000, fullRange.end - fullRange.start);
      const ratio = (focus - zoom.start) / span;
      let nextStart = focus - nextSpan * ratio;
      let nextEnd = nextStart + nextSpan;
      if (nextStart < fullRange.start) {
        nextStart = fullRange.start;
        nextEnd = nextStart + nextSpan;
      }
      if (nextEnd > fullRange.end) {
        nextEnd = fullRange.end;
        nextStart = nextEnd - nextSpan;
      }
      setZoom({ start: nextStart, end: nextEnd });
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
    // layout/zoom used inside handler via closure — rebind when they change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableZoom, layout, fullRange, zoom]);

  const resetZoom = () => {
    if (fullRange) setZoom({ ...fullRange });
  };

  if (!layout) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center text-xs text-gray-500 ${className}`} style={{ height }}>
        No chart data
      </div>
    );
  }

  const {
    width,
    pad,
    plotWidth,
    plotHeight,
    yMin,
    yMax,
    xMin,
    xMax,
    decimals,
    yTickValues,
    xTickValues,
    renderSeries,
  } = layout;

  const brushLeft = brush ? Math.min(brush.startX, brush.currentX) : 0;
  const brushWidth = brush ? Math.abs(brush.currentX - brush.startX) : 0;

  const unitSuffix = unit ? ` ${unit}` : '';

  return (
    <div
      ref={containerRef}
      className={`relative flex w-full flex-col ${fillContainer ? 'h-full min-h-0' : ''} ${className}`}
    >
      <div
        ref={plotAreaRef}
        className={`relative ${fillContainer ? 'min-h-0 flex-1' : ''}`}
        style={fillContainer ? undefined : { height: resolvedHeight }}
      >
        {showLegend && (
          <div className="absolute left-0 right-0 top-0 z-[1] flex flex-wrap gap-x-3 gap-y-1 px-1">
            {series.map((entry, index) => (
              <span key={entry.id} className="inline-flex items-center gap-1.5 text-[10px] text-slate-600">
                <span
                  className="inline-block h-1.5 w-3 rounded-full"
                  style={{ backgroundColor: entry.color ?? DENDRA_SERIES_COLORS[index % DENDRA_SERIES_COLORS.length] }}
                />
                {entry.label}
              </span>
            ))}
          </div>
        )}

        {enableZoom && (
          <div className="absolute right-1 top-1 z-[2] flex items-center gap-2">
            {isZoomed && (
              <button
                type="button"
                onClick={resetZoom}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <RotateCcw className="h-3 w-3" />
                Reset zoom
              </button>
            )}
            <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] text-slate-400">
              Drag to zoom · scroll to refine
            </span>
          </div>
        )}

        <svg
          width={width}
          height={resolvedHeight}
          viewBox={`0 0 ${width} ${resolvedHeight}`}
          className={`block h-full w-full overflow-visible ${enableZoom ? 'cursor-crosshair' : ''}`}
          role="img"
          aria-label="Time series chart"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            brushOriginRef.current = null;
            setBrush(null);
          }}
          onMouseLeave={() => {
            if (!brush) setHover(null);
          }}
          onWheel={handleWheel}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(${pad.left}, ${pad.top})`}>
            {yTickValues.map((value, index) => {
              const y = ((yMax - value) / (yMax - yMin)) * plotHeight;
              return (
                <g key={`y-${index}`}>
                  <line x1={0} x2={plotWidth} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  <text
                    x={-10}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="#64748b"
                    fontSize={11}
                  >
                    {formatAxisNumber(value, decimals)}
                  </text>
                </g>
              );
            })}

            {unit ? (
              <text
                transform={`translate(${-pad.left + 16}, ${plotHeight / 2}) rotate(-90)`}
                textAnchor="middle"
                fill="#64748b"
                fontSize={11}
              >
                {unit}
              </text>
            ) : null}

            {xTickValues.map((timestamp, index) => {
              const x = ((timestamp - xMin) / (xMax - xMin)) * plotWidth;
              const isFirst = index === 0;
              const isLast = index === xTickValues.length - 1;
              return (
                <text
                  key={`x-${index}`}
                  x={x}
                  y={plotHeight + 22}
                  textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                  fill="#64748b"
                  fontSize={11}
                >
                  {new Date(timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </text>
              );
            })}

            {renderSeries.map((entry, index) => {
              const color = entry.color ?? DENDRA_SERIES_COLORS[index % DENDRA_SERIES_COLORS.length];
              const pointsAttr = buildPolyline(entry.renderPoints, xMin, xMax, yMin, yMax, plotWidth, plotHeight);
              if (!pointsAttr) return null;
              return (
                <polyline
                  key={entry.id}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  points={pointsAttr}
                />
              );
            })}

            {brush && brushWidth > 0 && (
              <rect
                x={brushLeft}
                y={0}
                width={brushWidth}
                height={plotHeight}
                fill="#0d9488"
                opacity={0.12}
                stroke="#0d9488"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {hover && !brush && (
              <line
                x1={((hover.timestamp - xMin) / (xMax - xMin)) * plotWidth}
                x2={((hover.timestamp - xMin) / (xMax - xMin)) * plotWidth}
                y1={0}
                y2={plotHeight}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        </svg>

        {hover && !brush && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-slate-200 bg-white/95 px-2 py-1.5 text-[11px] shadow-md"
            style={{ left: hover.left, top: hover.top }}
          >
            <p className="mb-1 font-medium text-slate-700">
              {new Date(hover.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            {hover.values.map((entry) => (
              <p key={entry.label} className="flex items-center gap-1.5 text-slate-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.label}: {formatAxisNumber(entry.value, decimals)}{unitSuffix}
              </p>
            ))}
          </div>
        )}
      </div>

      {showStats && stats && (
        <div
          id="dendra-chart-stats"
          className="mt-2 shrink-0 grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Highest</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatAxisNumber(stats.max, decimals)}
              <span className="text-xs font-normal text-slate-500">{unitSuffix}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Lowest</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatAxisNumber(stats.min, decimals)}
              <span className="text-xs font-normal text-slate-500">{unitSuffix}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Average</p>
            <p className="text-sm font-semibold text-slate-800">
              {formatAxisNumber(stats.avg, decimals)}
              <span className="text-xs font-normal text-slate-500">{unitSuffix}</span>
            </p>
          </div>
          <p className="col-span-3 text-[10px] text-slate-400">
            Across {stats.count.toLocaleString()} readings
            {isZoomed ? ' in the visible range' : ' in the loaded series'}
          </p>
        </div>
      )}

      {showRawDataCaution && (
        <DendraRawDataCaution
          id="dendra-chart-raw-data-caution"
          variant="compact"
          className="mt-2 shrink-0"
        />
      )}
    </div>
  );
}
