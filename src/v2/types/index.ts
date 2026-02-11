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
}

/** Supported data sources */
export type DataSource =
  | 'tnc-arcgis'
  | 'inaturalist'
  | 'animl'
  | 'dendra'
  | 'dataone'
  | 'ebird'
  | 'drone'
  | 'lidar';

/** A domain category in the left sidebar */
export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  layers: CatalogLayer[];
}

/** A pinned layer in the Map Layers widget */
export interface PinnedLayer {
  id: string;
  layerId: string;
  name: string;
  isVisible: boolean;
  isActive: boolean;
  filterCount: number;
  filterSummary?: string;
  distinguisher?: string;
  views?: PinnedLayerView[];
  order: number; // for drag-reorder z-order
}

/** A filtered view within a nested pinned layer (DFT-013) */
export interface PinnedLayerView {
  id: string;
  name: string;
  isVisible: boolean;
  filterCount: number;
  filterSummary?: string;
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
