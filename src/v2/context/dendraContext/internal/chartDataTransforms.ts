import type { DendraTimeSeriesPoint } from '../../../services/dendraStationService';
import type { DendraAggregation, DendraChartFilter, DendraChartPanelState } from './types';

export const DEFAULT_CHART_FILTER: DendraChartFilter = {
  startDate: '',
  endDate: '',
  aggregation: 'hourly',
};

export function toDateInputValue(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function startOfUtcDay(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function endOfUtcDay(date: string): number {
  return Date.parse(`${date}T23:59:59.999Z`);
}

function startOfUtcHour(epochMs: number): number {
  const d = new Date(epochMs);
  d.setUTCMinutes(0, 0, 0);
  return d.getTime();
}

function startOfUtcWeek(epochMs: number): number {
  const d = new Date(epochMs);
  const dayOffset = (d.getUTCDay() + 6) % 7;
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - dayOffset);
  return d.getTime();
}

function aggregatePoints(
  points: DendraTimeSeriesPoint[],
  aggregation: DendraAggregation,
): DendraTimeSeriesPoint[] {
  if (points.length === 0) return [];

  const buckets = new Map<number, { sum: number; count: number }>();

  for (const point of points) {
    const bucketTs =
      aggregation === 'weekly'
        ? startOfUtcWeek(point.timestamp)
        : aggregation === 'daily'
          ? startOfUtcDay(toDateInputValue(point.timestamp))
          : startOfUtcHour(point.timestamp);

    const current = buckets.get(bucketTs);
    if (current) {
      current.sum += point.value;
      current.count += 1;
    } else {
      buckets.set(bucketTs, { sum: point.value, count: 1 });
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, acc]) => ({
      timestamp,
      value: acc.sum / acc.count,
    }));
}

export function applyChartFilter(
  rawData: DendraTimeSeriesPoint[],
  filter: DendraChartFilter,
): DendraTimeSeriesPoint[] {
  if (rawData.length === 0) return [];

  const startTs = filter.startDate ? startOfUtcDay(filter.startDate) : Number.NEGATIVE_INFINITY;
  const endTs = filter.endDate ? endOfUtcDay(filter.endDate) : Number.POSITIVE_INFINITY;
  const inRange = rawData.filter((point) => point.timestamp >= startTs && point.timestamp <= endTs);
  return aggregatePoints(inRange, filter.aggregation);
}

function getMapBounds() {
  if (typeof document === 'undefined') {
    return { width: 1280, height: 720 };
  }
  const mapContainer = document.getElementById('map-container');
  const width = mapContainer?.clientWidth ?? window.innerWidth;
  const height = mapContainer?.clientHeight ?? window.innerHeight;
  return {
    width: Math.max(640, width),
    height: Math.max(480, height),
  };
}

export function buildInitialPanelRect(index: number): Pick<DendraChartPanelState, 'x' | 'y' | 'width' | 'height'> {
  const bounds = getMapBounds();
  const horizontalMargin = 12;
  const topMargin = 12;
  const bottomMargin = 30;
  const gap = 12;
  const width = Math.max(560, Math.min(760, bounds.width - horizontalMargin * 2));
  const height = Math.max(380, Math.min(500, bounds.height - topMargin - bottomMargin));
  const columns = Math.max(1, Math.floor((bounds.width - horizontalMargin * 2 + gap) / (width + gap)));
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = Math.max(horizontalMargin, bounds.width - width - horizontalMargin - col * (width + gap));
  const y = Math.max(topMargin, bounds.height - height - bottomMargin - row * (height + gap));
  return { x, y, width, height };
}
