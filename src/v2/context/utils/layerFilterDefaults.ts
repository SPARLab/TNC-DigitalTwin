import type {
  AnimlViewFilters,
  CalFloraViewFilters,
  DataOneViewFilters,
  DendraViewFilters,
  GBIFViewFilters,
  INaturalistViewFilters,
  MotusViewFilters,
  TNCArcGISViewFilters,
} from '../../types';

export function createDefaultINaturalistViewFilters(): INaturalistViewFilters {
  return {
    selectedTaxa: [],
    selectedSpecies: [],
    startDate: undefined,
    endDate: undefined,
  };
}

export function createDefaultAnimlViewFilters(): AnimlViewFilters {
  return {
    selectedAnimals: [],
    selectedCameras: [],
    startDate: undefined,
    endDate: undefined,
  };
}

export function createDefaultDendraViewFilters(): DendraViewFilters {
  return {
    showActiveOnly: false,
    selectedStationId: undefined,
    selectedStationName: undefined,
    selectedDatastreamId: undefined,
    selectedDatastreamName: undefined,
    startDate: undefined,
    endDate: undefined,
    aggregation: undefined,
  };
}

export function createDefaultTNCArcGISViewFilters(): TNCArcGISViewFilters {
  return {
    whereClause: '1=1',
    fields: [],
  };
}

export function createDefaultDataOneViewFilters(): DataOneViewFilters {
  return {
    searchText: undefined,
    tncCategory: undefined,
    tncCategories: [],
    fileTypes: [],
    startDate: undefined,
    endDate: undefined,
    author: undefined,
    selectedDatasetId: undefined,
  };
}

export function createDefaultCalFloraViewFilters(): CalFloraViewFilters {
  return {
    searchText: undefined,
    county: undefined,
    startDate: undefined,
    endDate: undefined,
    hasPhoto: false,
    selectedObservationId: undefined,
    selectedObservationLabel: undefined,
  };
}

export function createDefaultGBIFViewFilters(): GBIFViewFilters {
  return {
    searchText: undefined,
    kingdom: undefined,
    taxonomicClass: undefined,
    family: undefined,
    basisOfRecord: undefined,
    datasetName: undefined,
    startDate: undefined,
    endDate: undefined,
    selectedOccurrenceId: undefined,
    selectedOccurrenceLabel: undefined,
  };
}

export function createDefaultMotusViewFilters(): MotusViewFilters {
  return {
    selectedSpecies: undefined,
    selectedTagId: undefined,
    startDate: undefined,
    endDate: undefined,
    minHitCount: undefined,
    minMotusFilter: undefined,
  };
}
