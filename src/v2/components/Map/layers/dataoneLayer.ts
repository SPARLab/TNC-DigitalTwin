// ============================================================================
// DataONE Map Layer — FeatureLayer populated from DataONE dataset centers.
// Uses ArcGIS built-in cluster reduction to aggregate dense overlapping points.
// ============================================================================

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import type { DataOneDataset } from '../../../../types/dataone';

const DEFAULT_MARKER_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  size: 8,
  color: [16, 185, 129, 0.85], // emerald-500
  outline: {
    color: [255, 255, 255, 0.95],
    width: 1.25,
  },
});

const CLUSTER_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  color: [5, 150, 105, 0.92], // emerald-600
  outline: {
    color: [255, 255, 255, 1],
    width: 1.5,
  },
});

/** Create an empty FeatureLayer for DataONE datasets with clustering. */
export function createDataOneLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): FeatureLayer {
  return new FeatureLayer({
    id: options.id ?? 'v2-dataone-datasets',
    visible: options.visible ?? true,
    source: [],
    objectIdField: 'objectid',
    fields: [
      { name: 'objectid', type: 'oid' },
      { name: 'id', type: 'integer' },
      { name: 'dataoneId', type: 'string' },
      { name: 'title', type: 'string' },
      { name: 'category', type: 'string' },
    ],
    geometryType: 'point',
    spatialReference: { wkid: 4326 },
    renderer: new SimpleRenderer({
      symbol: DEFAULT_MARKER_SYMBOL,
    }),
    popupTemplate: {
      title: '{title}',
      content: [
        {
          type: 'fields',
          fieldInfos: [
            { fieldName: 'dataoneId', label: 'DataONE ID' },
            { fieldName: 'category', label: 'Category' },
          ],
        },
      ],
    },
    featureReduction: {
      type: 'cluster',
      clusterRadius: '64px',
      clusterMinSize: '24px',
      clusterMaxSize: '52px',
      renderer: new SimpleRenderer({ symbol: CLUSTER_SYMBOL }),
      labelingInfo: [
        {
          deconflictionStrategy: 'none',
          labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
          symbol: {
            type: 'text',
            color: 'white',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 11,
              weight: 'bold',
            },
            haloColor: [0, 0, 0, 0.15],
            haloSize: 1,
          },
        },
      ],
      popupTemplate: {
        title: '{cluster_count} datasets in this area',
        content: 'Zoom in to inspect individual datasets, then click a point to open dataset details.',
      },
    },
  });
}

/** Populate DataONE dataset points into the FeatureLayer source. */
export function populateDataOneLayer(layer: FeatureLayer, datasets: DataOneDataset[]): void {
  const source = layer.source as __esri.Collection<__esri.Graphic>;
  source.removeAll();

  const graphics = datasets
    .filter((dataset) => Number.isFinite(dataset.centerLon) && Number.isFinite(dataset.centerLat))
    .map((dataset) => new Graphic({
      geometry: new Point({
        longitude: dataset.centerLon as number,
        latitude: dataset.centerLat as number,
      }),
      symbol: DEFAULT_MARKER_SYMBOL.clone(),
      attributes: {
        objectid: dataset.id,
        id: dataset.id,
        dataoneId: dataset.dataoneId,
        title: dataset.title,
        category: dataset.tncCategory,
      },
    }));

  source.addMany(graphics);
}
