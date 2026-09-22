import type {
  DendraStation,
  DendraSummary,
  DendraTimeSeriesPoint,
} from '../../../services/dendraStationService';

export type DendraAggregation = 'hourly' | 'daily' | 'weekly';

export interface DendraChartFilter {
  startDate: string;
  endDate: string;
  aggregation: DendraAggregation;
}

export interface DendraChartPanelState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  sourceLayerId: string;
  sourceServiceUrl: string;
  sourceViewId?: string;
  sourceLayerName: string;
  minimized: boolean;
  station: DendraStation | null;
  summary: DendraSummary | null;
  rawData: DendraTimeSeriesPoint[];
  data: DendraTimeSeriesPoint[];
  filter: DendraChartFilter;
  loading: boolean;
  progressiveLoading: boolean;
  error: string | null;
}

/** Snapshot multi-series chart pinned to the map (browse / overview). */
export interface DendraPinnedMultiSeriesPoint {
  timestamp: number;
  value: number;
}

export interface DendraPinnedMultiSeries {
  id: string;
  label: string;
  color: string;
  points: DendraPinnedMultiSeriesPoint[];
}

export type DendraPinnedChartOrigin = 'browse' | 'overview';

export interface DendraPinnedMultiChartState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  title: string;
  subtitle?: string;
  unit: string;
  startDate: string;
  endDate: string;
  sourceLayerId: string;
  origin: DendraPinnedChartOrigin;
  selectedStreamNames: string[];
  selectedStationIds: number[];
  /** Stable query key for dirty detection vs modal filters. */
  queryKey: string;
  series: DendraPinnedMultiSeries[];
}

export interface DendraPinnedExpandRequest {
  panelId: string;
  origin: DendraPinnedChartOrigin;
  title: string;
  startDate: string;
  endDate: string;
  selectedStreamNames: string[];
  selectedStationIds: number[];
  sourceLayerId: string;
}

export function buildPinnedChartQueryKey(input: {
  origin: DendraPinnedChartOrigin;
  startDate: string;
  endDate: string;
  selectedStreamNames: string[];
  selectedStationIds: number[];
}): string {
  return [
    input.origin,
    input.startDate,
    input.endDate,
    [...input.selectedStreamNames].map((s) => s.trim().toLowerCase()).filter(Boolean).sort().join(','),
    [...input.selectedStationIds].sort((a, b) => a - b).join(','),
  ].join('|');
}
