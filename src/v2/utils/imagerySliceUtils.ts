// ============================================================================
// Imagery slice helpers — multidimensional ImageServer time/variable selection
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import RasterStretchRenderer from '@arcgis/core/renderers/RasterStretchRenderer';
import MultipartColorRamp from '@arcgis/core/rest/support/MultipartColorRamp';
import AlgorithmicColorRamp from '@arcgis/core/rest/support/AlgorithmicColorRamp';
import Color from '@arcgis/core/Color';
import type { ImagerySliceSelection, TNCArcGISViewFilters } from '../types';

export type ImagerySliceLayer = Layer & {
  multidimensionalDefinition?: Array<{
    variableName?: string;
    dimensionName?: string;
    values?: number[];
    isSlice?: boolean;
  }>;
  mosaicRule?: {
    multidimensionalDefinition?: Array<{
      variableName?: string;
      dimensionName?: string;
      values?: number[];
      isSlice?: boolean;
    }>;
  } | null;
  renderer?: unknown;
};

export function formatImageryDimensionLabel(value: number, dimensionName?: string): string {
  if (dimensionName === 'StdTime' || dimensionName?.toLowerCase().includes('time')) {
    const year = new Date(value).getUTCFullYear();
    if (Number.isFinite(year) && year > 1800 && year < 3000) return String(year);
  }
  if (Number.isFinite(value) && Math.abs(value) >= 1e11) {
    const year = new Date(value).getUTCFullYear();
    if (Number.isFinite(year) && year > 1800 && year < 3000) return String(year);
  }
  return String(value);
}

export function sliceSelectionFromFilters(
  layerId: string,
  filters: TNCArcGISViewFilters | undefined,
): ImagerySliceSelection | null {
  if (
    !filters?.imageryVariable
    || !filters.imageryDimensionName
    || typeof filters.imageryDimensionValue !== 'number'
    || !Number.isFinite(filters.imageryDimensionValue)
  ) {
    return null;
  }
  return {
    layerId,
    variableName: filters.imageryVariable,
    dimensionName: filters.imageryDimensionName,
    dimensionValue: filters.imageryDimensionValue,
  };
}

function buildViridisStretchRenderer(min: number, max: number): RasterStretchRenderer {
  const colorRamp = new MultipartColorRamp({
    colorRamps: [
      new AlgorithmicColorRamp({
        fromColor: new Color([68, 1, 84]),
        toColor: new Color([49, 104, 142]),
      }),
      new AlgorithmicColorRamp({
        fromColor: new Color([49, 104, 142]),
        toColor: new Color([53, 183, 121]),
      }),
      new AlgorithmicColorRamp({
        fromColor: new Color([53, 183, 121]),
        toColor: new Color([253, 231, 37]),
      }),
    ],
  });

  return new RasterStretchRenderer({
    stretchType: 'min-max',
    colorRamp,
    customStatistics: [{
      min,
      max,
      avg: (min + max) / 2,
      stddev: Math.max((max - min) / 4, Number.EPSILON),
    }],
  });
}

function applyStretchRenderer(layer: ImagerySliceLayer, selection: ImagerySliceSelection): void {
  if (
    typeof selection.min !== 'number'
    || typeof selection.max !== 'number'
    || !Number.isFinite(selection.min)
    || !Number.isFinite(selection.max)
    || selection.max <= selection.min
  ) {
    return;
  }
  if (!('renderer' in layer)) return;
  layer.renderer = buildViridisStretchRenderer(selection.min, selection.max);
}

export function applyImagerySliceToLayer(
  layer: Layer | undefined,
  selection: ImagerySliceSelection | null,
): void {
  if (!layer || !selection) return;

  const definition = [{
    variableName: selection.variableName,
    dimensionName: selection.dimensionName,
    values: [selection.dimensionValue],
    isSlice: true,
  }];

  const imageryLayer = layer as ImagerySliceLayer;
  if ('multidimensionalDefinition' in imageryLayer) {
    imageryLayer.multidimensionalDefinition = definition;
    applyStretchRenderer(imageryLayer, selection);
    return;
  }
  if ('mosaicRule' in imageryLayer) {
    imageryLayer.mosaicRule = {
      ...(imageryLayer.mosaicRule ?? {}),
      multidimensionalDefinition: definition,
    };
    applyStretchRenderer(imageryLayer, selection);
  }
}
