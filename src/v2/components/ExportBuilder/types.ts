import type {
  AnimlViewFilters,
  DataSource,
  DendraViewFilters,
  INaturalistViewFilters,
} from '../../types';

export interface ExportFormatOption {
  id: string;
  label: string;
}

export interface ExportQueryDefinition {
  dataSource: DataSource;
  filterSummary?: string;
  inaturalistFilters?: INaturalistViewFilters;
  animlFilters?: AnimlViewFilters;
  dendraFilters?: DendraViewFilters;
}

export interface ExportActionView {
  viewId: string;
  viewName: string;
  isActive: boolean;
  querySummary?: string;
  filteredResultCount?: number;
  estimatedBytes?: number;
  queryDefinition?: ExportQueryDefinition;
}

export interface ExportActionLayer {
  pinnedLayerId: string;
  layerId: string;
  layerName: string;
  dataSource: DataSource;
  selectedFormatIds: string[];
  selectedFormatLabels: string[];
  includeQueryDefinition: boolean;
  selectedViews: ExportActionView[];
  estimatedBytes?: number;
}
