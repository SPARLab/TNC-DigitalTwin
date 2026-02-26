export function createDefaultDataOneBrowseFilters() {
  return {
    searchText: '',
    tncCategories: [] as string[],
    fileTypes: [] as Array<'csv' | 'tif' | 'imagery' | 'other'>,
    startDate: '',
    endDate: '',
    author: '',
  };
}

export function createDefaultGBIFBrowseFilters() {
  return {
    searchText: '',
    kingdom: '',
    taxonomicClass: '',
    family: '',
    basisOfRecord: '',
    datasetName: '',
    startDate: '',
    endDate: '',
  };
}

export function createDefaultCalFloraBrowseFilters() {
  return {
    searchText: '',
    county: '',
    startDate: '',
    endDate: '',
    hasPhoto: false,
  };
}

export function createDefaultMotusBrowseFilters() {
  return {
    startDate: '',
    endDate: '',
    minHitCount: 1,
    minMotusFilter: 1,
  };
}
