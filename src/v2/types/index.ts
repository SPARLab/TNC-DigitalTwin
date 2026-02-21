// ============================================================================
// V2 Digital Catalog — Core Types
// ============================================================================

/** A layer in the catalog (e.g., "Camera Traps", "iNaturalist Observations") */
export interface CatalogLayer {
  id: string;
  name: string;
  categoryId: string;
  dataSource: DataSource;
  icon?: string; // Lucide icon name
  /** Service metadata from Data Catalog (absent for external API layers) */
  catalogMeta?: {
    datasetId: number;
    serverBaseUrl: string;
    servicePath: string;
    hasFeatureServer: boolean;
    hasMapServer: boolean;
    hasImageServer: boolean;
    description?: string;
    layerIdInService?: number;
    isMultiLayerService?: boolean;
    parentServiceId?: string;
    siblingLayers?: CatalogLayer[];
  };
}

/** Supported data sources */
export type DataSource =
  | 'tnc-arcgis'
  | 'inaturalist'
  | 'animl'
  | 'dendra'
  | 'dataone'
  | 'gbif'
  | 'ebird'
  | 'drone'
  | 'lidar';

/** A domain category in the left sidebar */
export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  layers: CatalogLayer[];
  subcategories?: Category[];
  parentId?: string;
}

/** A pinned layer in the Map Layers widget */
export interface PinnedLayer {
  id: string;
  layerId: string;
  name: string;
  isVisible: boolean;
  /** 0-1 map opacity for this pinned layer (1 = fully opaque) */
  opacity?: number;
  isActive: boolean;
  filterCount: number;
  filterSummary?: string;
  inaturalistFilters?: INaturalistViewFilters;
  animlFilters?: AnimlViewFilters;
  dendraFilters?: DendraViewFilters;
  tncArcgisFilters?: TNCArcGISViewFilters;
  dataoneFilters?: DataOneViewFilters;
  gbifFilters?: GBIFViewFilters;
  droneView?: DroneViewState;
  distinguisher?: string;
  views?: PinnedLayerView[];
  order: number; // for drag-reorder z-order
  resultCount?: number; // Number of features matching filters (for count display testing)
}

/** A filtered view within a nested pinned layer (DFT-013) */
export interface PinnedLayerView {
  id: string;
  name: string;
  /** True when user manually renamed this view (disables auto naming). */
  isNameCustom?: boolean;
  isVisible: boolean;
  filterCount: number;
  filterSummary?: string;
  inaturalistFilters?: INaturalistViewFilters;
  animlFilters?: AnimlViewFilters;
  dendraFilters?: DendraViewFilters;
  tncArcgisFilters?: TNCArcGISViewFilters;
  dataoneFilters?: DataOneViewFilters;
  gbifFilters?: GBIFViewFilters;
  droneView?: DroneViewState;
  resultCount?: number; // Number of features matching filters (for count display testing)
}

/** DroneDeploy saved-view state stored per pinned layer/view */
export interface DroneViewState {
  flightId: number;
  projectName: string;
  planName: string;
  capturedAt: string;
  comparisonMode?: 'single' | 'temporal';
}

/** iNaturalist filter state stored per pinned layer/view */
export interface INaturalistViewFilters {
  selectedTaxa: string[];
  selectedSpecies: string[];
  excludeAllSpecies?: boolean;
  startDate?: string;
  endDate?: string;
}

/** ANiML filter state stored per pinned layer/view */
export interface AnimlViewFilters {
  selectedAnimals: string[];
  selectedCameras: number[];
  startDate?: string;
  endDate?: string;
}

/** Dendra filter state stored per pinned layer/view */
export interface DendraViewFilters {
  showActiveOnly: boolean;
  selectedStationId?: number;
  selectedStationName?: string;
  selectedDatastreamId?: number;
  selectedDatastreamName?: string;
  startDate?: string;
  endDate?: string;
  aggregation?: 'hourly' | 'daily' | 'weekly';
}

/** TNC ArcGIS filter state stored per pinned layer/view */
export interface TNCArcGISViewFilters {
  whereClause: string;
  fields?: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

/** DataONE filter + detail state stored per pinned layer/view */
export interface DataOneViewFilters {
  searchText?: string;
  tncCategory?: string;
  startDate?: string;
  endDate?: string;
  author?: string;
  selectedDatasetId?: string;
  selectedDatasetTitle?: string;
}

/** GBIF filter + detail state stored per pinned layer/view */
export interface GBIFViewFilters {
  searchText?: string;
  kingdom?: string;
  taxonomicClass?: string;
  family?: string;
  basisOfRecord?: string;
  datasetName?: string;
  startDate?: string;
  endDate?: string;
  selectedOccurrenceId?: number;
  selectedOccurrenceLabel?: string;
}

// =============================================================================
// DEPRECATED: Bookmark types — Saved Items widget merged into Map Layers
// (Feb 11, 2026 design decision). Types preserved because BookmarkedItemsWidget
// code is flagged off but not deleted (CSS/animation reuse).
// =============================================================================
/** @deprecated Saved Items widget disabled. Bookmark types preserved for code reference only. */
export type BookmarkType = 'pointer-filtered' | 'pointer-unfiltered' | 'self-contained';
/** @deprecated Saved Items widget disabled. Bookmark types preserved for code reference only. */
export interface BookmarkedItem {
  id: string;
  itemId: string;
  itemName: string;
  layerId: string;
  layerName: string;
  type: BookmarkType;
  filterDescription?: string;
  resultCount?: number;
  resultNoun?: string;
  allNoun?: string;
  createdAt: number;
  /** Optional map location for highlight on hover */
  geometry?: { type: 'Point'; coordinates: [number, number] };
}

/** Active layer state — the layer currently shown in the right sidebar */
export interface ActiveLayer {
  id: string;
  layerId: string;
  name: string;
  dataSource: DataSource;
  isPinned: boolean;
  /** When editing filters for a nested child view */
  viewId?: string;
  /** When opening a specific observation/feature detail (e.g., from map marker click) */
  featureId?: string | number;
  /** True when active row is a multi-layer service container */
  isService?: boolean;
  /** Selected sub-layer for service-level activation */
  selectedSubLayerId?: string;
}

/** Undo action record */
export interface UndoAction {
  id: string;
  description: string;
  undo: () => void;
  timestamp: number;
}

/** Right sidebar tab */
export type SidebarTab = 'overview' | 'browse';

/** Count display mode for Map Layers widget (design testing) */
export type CountDisplayMode = 
  | 'none'                    // No counts shown
  | 'filters-only'           // Show filter count only (current behavior)
  | 'results-collapsed'      // Show result count in collapsed parent row
  | 'results-expanded'       // Show result count in expanded panel only
  | 'results-children'       // Show result count on child views only
  | 'filters-and-results';   // Show both filter and result counts (for comparison)
