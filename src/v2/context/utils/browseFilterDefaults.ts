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
    startDate: `${new Date().getFullYear() - 10}-01-01`,
    endDate: '',
    speciesLevelOnly: true,
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
