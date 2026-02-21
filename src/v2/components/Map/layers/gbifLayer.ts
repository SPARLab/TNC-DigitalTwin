// ============================================================================
// GBIF Layer — Explicit FeatureLayer for GBIF hosted datasets.
// Bypasses TNC ArcGIS registration so the layer always renders when active.
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type { GBIFAggregationMode } from '../../../context/GBIFFilterContext';

const GBIF_FEATURE_SERVER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/GBIF_Hosted/FeatureServer/0';

/**
 * Keep map payload minimal for faster cluster rendering.
 * We only need `id` for hit-testing into the sidebar detail view.
 */
const OUT_FIELDS = ['id'];

const BIN_FILL_SYMBOL: __esri.SimpleFillSymbolProperties = {
  type: 'simple-fill',
  color: [34, 197, 94, 0.55],
  outline: {
    color: [255, 255, 255, 0.45],
    width: 0.75,
  },
};

export function getGBIFBinningLevelForScale(scale: number | null | undefined): number {
  if (!scale || !Number.isFinite(scale)) return 3;
  if (scale > 80_000_000) return 1;
  if (scale > 14_000_000) return 2;
  if (scale > 3_000_000) return 3;
  if (scale > 800_000) return 4;
  if (scale > 200_000) return 5;
  if (scale > 50_000) return 6;
  if (scale > 10_000) return 7;
  return 8;
}

function buildGBIFClusterFeatureReduction(): __esri.FeatureReductionClusterProperties {
  return {
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
  };
}

function buildGBIFBinningFeatureReductionForScale(
  viewScale?: number | null,
): __esri.FeatureReductionBinningProperties {
  const dynamicBinLevel = getGBIFBinningLevelForScale(viewScale);
  return {
    type: 'binning',
    fixedBinLevel: dynamicBinLevel,
    // Keep bins visible at most zoom levels, then reveal raw points very close in.
    maxScale: 3_000,
    fields: [
      { name: 'aggregateCount', statisticType: 'count' },
    ],
    renderer: {
      type: 'simple',
      symbol: BIN_FILL_SYMBOL,
      visualVariables: [
        {
          type: 'color',
          field: 'aggregateCount',
          stops: [
            { value: 1, color: [220, 252, 231, 0.70] },
            { value: 25, color: [74, 222, 128, 0.75] },
            { value: 100, color: [34, 197, 94, 0.80] },
            { value: 500, color: [22, 163, 74, 0.85] },
            { value: 2000, color: [21, 128, 61, 0.90] },
          ],
        },
      ],
    },
    labelingInfo: [
      {
        deconflictionStrategy: 'none',
        labelPlacement: 'always-horizontal',
        labelExpressionInfo: {
          expression: `
            var count = $feature.aggregateCount;
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
          color: [30, 30, 30],
          haloColor: [255, 255, 255, 0.85],
          haloSize: 1.5,
          font: { family: 'Arial', size: 11, weight: 'bold' },
        },
      },
    ],
    popupTemplate: {
      title: '{aggregateCount} occurrences in this area',
      content: 'Zoom in to inspect individual GBIF occurrences, then click a point to open details.',
    },
  };
}

export function buildGBIFFeatureReductionForScale(
  mode: GBIFAggregationMode,
  viewScale?: number | null,
): __esri.FeatureReductionClusterProperties | __esri.FeatureReductionBinningProperties {
  if (mode === 'cluster') return buildGBIFClusterFeatureReduction();
  return buildGBIFBinningFeatureReductionForScale(viewScale);
}

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
    featureReduction: buildGBIFFeatureReductionForScale('binning'),
  });
}
