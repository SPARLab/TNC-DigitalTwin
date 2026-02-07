// ============================================================================
// Dummy bookmark data for Phase 0 development
// ============================================================================

import type { BookmarkedItem } from '../types';

export const DUMMY_BOOKMARKS: BookmarkedItem[] = [
  {
    id: 'bm-1',
    itemId: 'CAM-042',
    itemName: 'CAM-042',
    layerId: 'animl-camera-traps',
    layerName: 'Camera Traps',
    type: 'pointer-filtered',
    filterDescription: 'Mountain Lions 2023',
    resultCount: 47,
    resultNoun: 'images',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'bm-2',
    itemId: 'CAM-015',
    itemName: 'CAM-015',
    layerId: 'animl-camera-traps',
    layerName: 'Camera Traps',
    type: 'pointer-unfiltered',
    allNoun: 'images',
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'bm-3',
    itemId: 'RS-042',
    itemName: 'RS-042',
    layerId: 'water-sensors',
    layerName: 'Water Level Sensors',
    type: 'pointer-filtered',
    filterDescription: 'Mar 2024',
    resultCount: 90,
    resultNoun: 'datapoints',
    createdAt: Date.now() - 900000,
  },
  {
    id: 'bm-4',
    itemId: 'obs-45231',
    itemName: 'Observation #45231',
    layerId: 'inaturalist-obs',
    layerName: 'iNaturalist',
    type: 'self-contained',
    createdAt: Date.now() - 600000,
  },
];
