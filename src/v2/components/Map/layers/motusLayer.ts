import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

export const MOTUS_TAGGED_ANIMALS_LAYER_ID = 'service-181-layer-0';
const MOTUS_TAGGED_ANIMALS_LAYER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Wildlife_Telemetry/FeatureServer/0';

export function createMotusLayer(options: {
  id: string;
  visible?: boolean;
  whereClause?: string;
}): Layer {
  const { id, visible = true, whereClause } = options;

  return new FeatureLayer({
    id,
    url: MOTUS_TAGGED_ANIMALS_LAYER_URL,
    visible,
    outFields: [
      'id',
      'tag_id',
      'deploy_id',
      'species_english',
      'species_scientific',
      'ts_start',
      'ts_end',
    ],
    definitionExpression: whereClause?.trim() || '1=1',
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        size: 7.5,
        color: [22, 163, 74, 0.85],
        outline: {
          color: [255, 255, 255, 0.95],
          width: 1.2,
        },
      },
    },
    popupTemplate: {
      title: '{species_english}',
      content: [
        {
          type: 'fields',
          fieldInfos: [
            { fieldName: 'species_scientific', label: 'Scientific name' },
            { fieldName: 'tag_id', label: 'Tag ID' },
            { fieldName: 'deploy_id', label: 'Deploy ID' },
            { fieldName: 'ts_start', label: 'Deployment start', format: { dateFormat: 'short-date' } },
            { fieldName: 'ts_end', label: 'Deployment end', format: { dateFormat: 'short-date' } },
          ],
        },
      ],
    },
  });
}
