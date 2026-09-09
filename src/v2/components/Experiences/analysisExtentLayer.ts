// ============================================================================
// Outline layer for the analysis extent (preserve, county, or tri-county).
// Same unfilled white stroke as the monitoring preserve outline.
// ============================================================================

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import { PRESERVE_BOUNDARY_LAYER_URL } from '../../services/preserveBoundaryService';
import type { RasterScope } from './types';

export const ANALYSIS_EXTENT_LAYER_ID = 'experience-analysis-extent';

export const ANALYSIS_EXTENT_BOUNDARIES: Record<
  RasterScope,
  { url: string; title: string }
> = {
  preserve: {
    url: PRESERVE_BOUNDARY_LAYER_URL,
    title: 'Dangermond Preserve Boundary',
  },
  sbcounty: {
    url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Santa_Barbara_County_Boundary/FeatureServer/0',
    title: 'Santa Barbara County Boundary',
  },
  tricounty: {
    url: 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/tricounties/FeatureServer/0',
    title: 'Tri-County Boundaries',
  },
};

export function createAnalysisExtentOutlineLayer(scope: RasterScope): FeatureLayer {
  const config = ANALYSIS_EXTENT_BOUNDARIES[scope];
  const width = scope === 'preserve' ? 1.5 : 2.5;
  return new FeatureLayer({
    id: ANALYSIS_EXTENT_LAYER_ID,
    url: config.url,
    title: config.title,
    popupEnabled: false,
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: [0, 0, 0, 0],
        outline: new SimpleLineSymbol({
          color: [255, 255, 255, 230],
          width,
        }),
      }),
    }),
  });
}
