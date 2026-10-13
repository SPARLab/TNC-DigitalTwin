// ============================================================================
// layerRasterInfo — read raster metadata from an ArcGIS imagery layer.
//
// ImageryTileLayer and ImageryLayer expose rasterInfo (or serviceRasterInfo) at
// runtime, but the SDK typings do not declare it on every layer class. Reading
// it through one helper keeps that cast in a single place.
// ============================================================================

interface BandStatistics {
  min?: number;
  max?: number;
}

export interface LayerRasterInfo {
  pixelSize?: { x?: number } | null;
  noDataValue?: unknown;
  statistics?: Array<BandStatistics | null> | null;
}

export function layerRasterInfo(layer: unknown): LayerRasterInfo | null {
  const source = layer as {
    rasterInfo?: LayerRasterInfo | null;
    serviceRasterInfo?: LayerRasterInfo | null;
  } | null;
  return source?.rasterInfo ?? source?.serviceRasterInfo ?? null;
}

/** Statistics of the layer's first band, when the service reports them. */
export function firstBandStatistics(layer: unknown): BandStatistics | null {
  return layerRasterInfo(layer)?.statistics?.[0] ?? null;
}
