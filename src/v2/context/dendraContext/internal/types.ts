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
