import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

const CALFLORA_FEATURE_SERVER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/CalFlora_Dangermond_Observations_Clean/FeatureServer/0';

const OUT_FIELDS = ['objectid', 'plant', 'county', 'date_', 'photo'];

export function createCalFloraLayer(options: {
  id: string;
  visible?: boolean;
  whereClause?: string;
}): Layer {
  const { id, visible = true, whereClause } = options;
  const definitionExpression = whereClause?.trim() || '1=1';

  return new FeatureLayer({
    id,
    url: CALFLORA_FEATURE_SERVER_URL,
    visible,
    outFields: OUT_FIELDS,
    definitionExpression,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        size: 8,
        color: [22, 163, 74, 0.85],
        outline: {
          color: [255, 255, 255, 1],
          width: 1.25,
        },
      },
    },
  });
}
