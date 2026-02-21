// ============================================================================
// DataONE Map Layer — FeatureLayer populated from DataONE dataset centers.
// Supports toggling ArcGIS feature reduction between clusters and bins.
// ============================================================================

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import type { DataOneDataset } from '../../../../types/dataone';
import type { DataOneAggregationMode } from '../../../context/DataOneFilterContext';

const DEFAULT_MARKER_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  size: 11,
  color: [16, 185, 129, 0.85], // emerald-500
  outline: {
    color: [255, 255, 255, 0.95],
    width: 1.5,
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

const BIN_SYMBOL = new SimpleFillSymbol({
  color: [5, 150, 105, 0.55],
  outline: {
    color: [255, 255, 255, 0.45],
    width: 0.75,
  },
});

export function buildDataOneFeatureReduction(mode: DataOneAggregationMode): __esri.FeatureReductionClusterProperties | __esri.FeatureReductionBinningProperties {
  return buildDataOneFeatureReductionForScale(mode);
}

export function getBinningLevelForScale(scale: number | null | undefined): number {
  if (!scale || !Number.isFinite(scale)) return 3;
  // Shifted ~1 level coarser than the ArcGIS reference table so bins appear
  // as large, readable rectangles at each zoom (state → few big, county → more medium, etc.).
  if (scale > 80_000_000) return 1;   // World / continent
  if (scale > 14_000_000) return 2;   // Multi-state overview
  if (scale > 3_000_000) return 3;    // State / regional (~156 km bins)
  if (scale > 800_000) return 4;      // County (~39 km bins)
  if (scale > 200_000) return 5;      // Sub-county / preserve overview (~5 km bins)
  if (scale > 50_000) return 6;       // Preserve detail (~1.2 km bins)
  if (scale > 10_000) return 7;       // Local area (~150 m bins)
  return 8;                           // Neighborhood (~40 m bins)
}

export function buildDataOneFeatureReductionForScale(
  mode: DataOneAggregationMode,
  viewScale?: number | null,
): __esri.FeatureReductionClusterProperties | __esri.FeatureReductionBinningProperties {
  if (mode === 'binning') {
    const dynamicBinLevel = getBinningLevelForScale(viewScale);
    return {
      type: 'binning',
      fixedBinLevel: dynamicBinLevel,
      // Keep bins visible until very close zoom to avoid abrupt "252 -> 2 points" transitions.
      maxScale: 3_000,
      fields: [
        { name: 'aggregateCount', statisticType: 'count' },
      ],
      renderer: {
        type: 'simple',
        symbol: BIN_SYMBOL,
        visualVariables: [
          {
            type: 'color',
            field: 'aggregateCount',
            stops: [
              { value: 1, color: [209, 250, 229, 0.70] },   // emerald-100
              { value: 10, color: [52, 211, 153, 0.75] },    // emerald-400
              { value: 50, color: [16, 185, 129, 0.80] },    // emerald-500
              { value: 200, color: [5, 150, 105, 0.85] },    // emerald-600
              { value: 500, color: [4, 120, 87, 0.90] },     // emerald-700
            ],
          },
        ],
      } as any,
      labelingInfo: [
        {
          deconflictionStrategy: 'none',
          labelPlacement: 'always-horizontal',
          labelExpressionInfo: { expression: "$feature.aggregateCount" },
          symbol: {
            type: 'text',
            color: [30, 30, 30],
            font: {
              family: 'Arial Unicode MS',
              size: '11px',
              weight: 'bold',
            },
            haloColor: [255, 255, 255, 0.85],
            haloSize: 1.5,
          },
        },
      ],
      popupTemplate: {
        content: 'This bin contains <b>{aggregateCount}</b> datasets.',
        fieldInfos: [
          {
            fieldName: 'aggregateCount',
            format: { digitSeparator: true, places: 0 },
          },
        ],
      },
    };
  }

  return {
    type: 'cluster',
    clusterRadius: '64px',
    clusterMinSize: '24px',
    clusterMaxSize: '52px',
    symbol: CLUSTER_SYMBOL,
    labelingInfo: [
      {
        deconflictionStrategy: 'none',
        labelPlacement: 'center-center',
        labelExpressionInfo: { expression: "Text($feature.cluster_count, '#,###')" },
        symbol: {
          type: 'text',
          color: 'white',
          font: {
            family: 'Arial Unicode MS',
            size: '11px',
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
  };
}

/** Create an empty FeatureLayer for DataONE datasets. */
export function createDataOneLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): FeatureLayer {
  return new (FeatureLayer as any)({
    id: options.id ?? 'v2-dataone-datasets',
    title: 'DataONE Research Datasets',
    visible: options.visible ?? true,
    source: [],
    objectIdField: 'ObjectID',
    fields: [
      { name: 'ObjectID', type: 'oid' },
      { name: 'datasetId', type: 'integer' },
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
    featureReduction: buildDataOneFeatureReduction('cluster'),
  });
}

/**
 * Populate DataONE dataset points using applyEdits (required post-load).
 * Uses queryFeatures to detect existing features rather than source.toArray(),
 * which is unreliable when concurrent applyEdits calls overlap.
 */
export async function populateDataOneLayer(
  layer: FeatureLayer,
  datasets: DataOneDataset[],
): Promise<void> {
  const graphics = datasets
    .filter((dataset) => Number.isFinite(dataset.centerLon) && Number.isFinite(dataset.centerLat))
    .map((dataset) => new Graphic({
      geometry: new Point({
        longitude: dataset.centerLon as number,
        latitude: dataset.centerLat as number,
      }),
      symbol: DEFAULT_MARKER_SYMBOL.clone(),
      attributes: {
        ObjectID: dataset.id,
        datasetId: dataset.id,
        dataoneId: dataset.dataoneId,
        title: dataset.title,
        category: dataset.tncCategory,
      },
    }));

  await layer.when();

  let deleteFeatures: __esri.Graphic[] = [];
  try {
    const existing = await layer.queryFeatures({ where: '1=1', returnGeometry: false });
    deleteFeatures = existing.features;
  } catch {
    // Layer may be empty or not yet queryable
  }

  await layer.applyEdits({
    ...(deleteFeatures.length > 0 ? { deleteFeatures } : {}),
    addFeatures: graphics,
  });
}
