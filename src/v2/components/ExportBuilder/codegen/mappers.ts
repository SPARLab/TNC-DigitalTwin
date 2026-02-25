import type { DataSource, DendraViewFilters, INaturalistViewFilters } from '../../../types';
import type { ExportCodegenRequest, SupportedCodegenSource } from './types';

interface MappedCodegenBase {
  dataSource: SupportedCodegenSource;
  layerName: string;
  layerId: string;
  viewName: string;
  viewId: string;
  filterSummary?: string;
  filteredResultCount?: number;
}

export interface MappedINaturalistPayload extends MappedCodegenBase {
  dataSource: 'inaturalist';
  filters: INaturalistViewFilters;
}

export interface MappedDendraPayload extends MappedCodegenBase {
  dataSource: 'dendra';
  filters: DendraViewFilters;
}

export type MappedCodegenPayload = MappedINaturalistPayload | MappedDendraPayload;

export interface MapCodegenError {
  reason: 'UNSUPPORTED_SOURCE' | 'MISSING_QUERY_DEFINITION' | 'INVALID_VIEW';
  message: string;
}

export function isSupportedCodegenSource(dataSource: DataSource): dataSource is SupportedCodegenSource {
  return dataSource === 'inaturalist' || dataSource === 'dendra';
}

export function mapCodegenRequest(request: ExportCodegenRequest): MappedCodegenPayload | MapCodegenError {
  if (!request.view || !request.view.viewId) {
    return {
      reason: 'INVALID_VIEW',
      message: 'The selected view is invalid or missing.',
    };
  }

  if (!isSupportedCodegenSource(request.layer.dataSource)) {
    return {
      reason: 'UNSUPPORTED_SOURCE',
      message: `${request.layer.dataSource} is not supported for code generation yet.`,
    };
  }

  const queryDefinition = request.view.queryDefinition;

  const base = {
    dataSource: request.layer.dataSource,
    layerName: request.layer.layerName,
    layerId: request.layer.layerId,
    viewName: request.view.viewName,
    viewId: request.view.viewId,
    filterSummary: request.view.querySummary,
    filteredResultCount: request.view.filteredResultCount,
  };

  if (request.layer.dataSource === 'inaturalist') {
    return {
      ...base,
      dataSource: 'inaturalist',
      filters: queryDefinition?.inaturalistFilters ?? {
        selectedTaxa: [],
        selectedSpecies: [],
        excludeAllSpecies: false,
      },
    };
  }

  return {
    ...base,
    dataSource: 'dendra',
    filters: queryDefinition?.dendraFilters ?? {
      showActiveOnly: false,
    },
  };
}

