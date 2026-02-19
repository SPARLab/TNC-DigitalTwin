// ============================================================================
// GBIF Layer — Explicit FeatureLayer for dataset-178 (Dangermond GBIF Occurrences)
// Bypasses TNC ArcGIS registration so the layer always renders when active.
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

const GBIF_FEATURE_SERVER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Species_Occurrences/FeatureServer/0';

/** Fields needed for map display; exclude gbif_key to avoid big-integer experimental warning */
const OUT_FIELDS = [
  'id',
  'scientific_name',
  'species',
  'genus',
  'family',
  'kingdom',
  'basis_of_record',
  'dataset_name',
  'event_date_json',
  'primary_image_url',
];

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
      clusterRadius: '48px',
      labelingInfo: [
        {
          deconflictionStrategy: 'none',
          labelExpressionInfo: { expression: 'Text($feature.cluster_count, "#,###")' },
          symbol: {
            type: 'text',
            color: 'white',
            haloColor: [0, 0, 0, 0.25],
            haloSize: 1,
            font: { family: 'Arial', size: 11, weight: 'bold' },
          },
          labelPlacement: 'center-center',
        },
      ],
    },
  });
}
