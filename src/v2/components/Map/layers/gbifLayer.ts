// ============================================================================
// GBIF Layer — Explicit FeatureLayer for GBIF hosted datasets.
// Bypasses TNC ArcGIS registration so the layer always renders when active.
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

const GBIF_FEATURE_SERVER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/GBIF_Hosted/FeatureServer/0';

/**
 * Keep map payload minimal for faster cluster rendering.
 * We only need `id` for hit-testing into the sidebar detail view.
 */
const OUT_FIELDS = ['id'];

export function createGBIFLayer(options: {
  id: string;
  visible?: boolean;
  whereClause?: string;
}): Layer {
  const { id, visible = true, whereClause } = options;
  const definitionExpression = whereClause?.trim() || '1=1';

  return new FeatureLayer({
    id,
    url: GBIF_FEATURE_SERVER_URL,
    visible,
    outFields: OUT_FIELDS,
    definitionExpression,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        size: 7,
        color: [22, 163, 74, 0.85],
        outline: {
          color: [255, 255, 255, 1],
          width: 1.2,
        },
      },
    },
    featureReduction: {
      type: 'cluster',
      clusterRadius: '96px',
      clusterMinSize: '28px',
      clusterMaxSize: '72px',
      labelingInfo: [
        {
          deconflictionStrategy: 'none',
          labelExpressionInfo: {
            expression: `
              var count = $feature.cluster_count;
              if (count >= 1000000000) {
                return Text(Round(count / 1000000000, 1), '#.#') + 'B';
              }
              if (count >= 1000000) {
                return Text(Round(count / 1000000, 1), '#.#') + 'M';
              }
              if (count >= 1000) {
                return Text(Round(count / 1000, 1), '#.#') + 'K';
              }
              return Text(count, '#');
            `,
          },
          symbol: {
            type: 'text',
            color: 'white',
            haloColor: [0, 0, 0, 0.25],
            haloSize: 1,
            font: { family: 'Arial', size: 12, weight: 'bold' },
          },
          labelPlacement: 'center-center',
        },
      ],
    },
  });
}
