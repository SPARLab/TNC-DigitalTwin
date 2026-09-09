// ============================================================================
// The preserve outline on the monitoring map.
//
// Deliberately unfilled and thin: it is there to say where the preserve is
// without competing with the sensor surfaces drawn inside it.
// ============================================================================

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import { PRESERVE_BOUNDARY_LAYER_URL } from '../../../services/preserveBoundaryService';

export function createPreserveOutlineLayer(): FeatureLayer {
  return new FeatureLayer({
    url: PRESERVE_BOUNDARY_LAYER_URL,
    title: 'Dangermond Preserve Boundary',
    popupEnabled: false,
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        // No fill: the sensor surfaces occupy this space.
        color: [0, 0, 0, 0],
        outline: new SimpleLineSymbol({
          color: [255, 255, 255, 190],
          width: 1.2,
        }),
      }),
    }),
  });
}
