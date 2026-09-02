// ============================================================================
// Continuous interpolated surface, as a real map layer.
//
// The SDK has no client-side interpolation renderer — HeatmapRenderer is a
// density estimator, so it would make clustered stations look extreme instead of
// showing the measured value. So we IDW the readings into a raster ourselves and
// hand it to a MediaLayer, which georeferences it into the map's layer stack.
//
// MediaLayer rather than a canvas pinned over the view surface, because a DOM
// overlay always paints above every map layer: the surface would wash out the
// station badges and wind arrows drawn on top of it. As a layer it also pans and
// zooms natively, with no per-frame redraw of our own.
// ============================================================================

import ImageElement from '@arcgis/core/layers/support/ImageElement';
import ExtentAndRotationGeoreference from '@arcgis/core/layers/support/ExtentAndRotationGeoreference';
import Extent from '@arcgis/core/geometry/Extent';
import {
  buildScalarField,
  getMedianNearestNeighbourDistance,
  normalize,
  type ScalarSamplePoint,
} from './scalarField';
import { sampleRamp, type ColorRamp } from './colorRamps';
import { getStationsExtent, type GeoExtent } from './windField';
import type { BoundaryRing } from '../../../services/preserveBoundaryService';

/**
 * Target cell count on the longer axis. Rows and columns are derived from the
 * extent so cells stay roughly square whatever shape the clip region is.
 */
const TARGET_LONG_AXIS_CELLS = 150;

/**
 * The raster is upscaled with bilinear smoothing before being handed over, so
 * the result looks continuous regardless of how the layer filters textures, and
 * so the clip edge is smooth rather than stepped.
 */
const UPSCALE_FACTOR = 5;

/** Surface opacity, low enough to read the basemap underneath. */
const MAX_ALPHA = 0.8;

/**
 * How far past the outermost stations the raster extends when there is no clip
 * region, as a multiple of the network's median station spacing.
 */
const EXTENT_PADDING_SPACING_FACTOR = 1.1;

/**
 * Edge feather in grid cells, used only in the unclipped fallback so the raster
 * does not end on a hard straight line. A clipped surface needs no feather: the
 * preserve boundary is its edge.
 */
const EDGE_FEATHER_CELLS = 7;

export interface ScalarSurfaceOptions {
  ramp: ColorRamp;
  /** Station value range used to normalize the ramp. */
  min: number;
  max: number;
  /** Interpolated values below this are left unpainted. See SensorVariableConfig. */
  absenceBelow?: number;
  /**
   * Clip the surface to these rings, and cover their full extent. Without them
   * the surface falls back to a feathered box around the stations.
   */
  clip?: { rings: BoundaryRing[]; extent: GeoExtent };
}

/** Cell counts giving near-square cells over the extent, at the target density. */
function getGridSize(extent: GeoExtent): { cols: number; rows: number } {
  const width = extent.xmax - extent.xmin;
  const height = extent.ymax - extent.ymin;
  if (width <= 0 || height <= 0) return { cols: TARGET_LONG_AXIS_CELLS, rows: TARGET_LONG_AXIS_CELLS };

  const aspect = width / height;
  const cols = aspect >= 1 ? TARGET_LONG_AXIS_CELLS : Math.round(TARGET_LONG_AXIS_CELLS * aspect);
  const rows = aspect >= 1 ? Math.round(TARGET_LONG_AXIS_CELLS / aspect) : TARGET_LONG_AXIS_CELLS;

  return { cols: Math.max(2, cols), rows: Math.max(2, rows) };
}

/**
 * Trace the clip rings in the canvas's pixel space.
 *
 * Latitude is flipped because the raster's first row is the north edge, matching
 * how the georeference maps the image onto the extent.
 */
function buildClipPath(
  rings: BoundaryRing[],
  extent: GeoExtent,
  width: number,
  height: number,
): Path2D {
  const path = new Path2D();
  const spanX = extent.xmax - extent.xmin;
  const spanY = extent.ymax - extent.ymin;

  for (const ring of rings) {
    ring.forEach(([longitude, latitude], index) => {
      const x = ((longitude - extent.xmin) / spanX) * width;
      const y = ((extent.ymax - latitude) / spanY) * height;
      if (index === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.closePath();
  }

  return path;
}

/**
 * Build the georeferenced raster for one variable.
 *
 * Returns an element rather than a layer so the caller can keep a single
 * MediaLayer mounted and swap its source. Adding and removing the layer itself
 * races the SDK's internal load controller and throws from deep inside it.
 * Returns null when the raster cannot be built, e.g. no 2D canvas context.
 */
export function createScalarSurfaceElement(
  points: ScalarSamplePoint[],
  { ramp, min, max, absenceBelow, clip }: ScalarSurfaceOptions,
): ImageElement | null {
  if (points.length === 0) return null;

  const extent = clip
    ? clip.extent
    : getStationsExtent(
        points,
        getMedianNearestNeighbourDistance(points) * EXTENT_PADDING_SPACING_FACTOR,
      );

  const { cols, rows } = getGridSize(extent);
  const field = buildScalarField(points, extent, cols, rows);

  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = cols;
  gridCanvas.height = rows;

  const gridContext = gridCanvas.getContext('2d');
  if (!gridContext) return null;

  const image = gridContext.createImageData(cols, rows);

  for (let index = 0; index < field.values.length; index++) {
    const value = field.values[index];

    // Leave absence unpainted rather than colouring it at the bottom of the ramp.
    if (absenceBelow !== undefined && value < absenceBelow) continue;

    const { r, g, b } = sampleRamp(ramp, normalize(value, min, max));

    let alpha = MAX_ALPHA;
    if (!clip) {
      const column = index % cols;
      const row = Math.floor(index / cols);
      const cellsFromEdge = Math.min(column, cols - 1 - column, row, rows - 1 - row);
      alpha = MAX_ALPHA * Math.min(1, cellsFromEdge / EDGE_FEATHER_CELLS);
    }

    const offset = index * 4;
    image.data[offset] = r;
    image.data[offset + 1] = g;
    image.data[offset + 2] = b;
    image.data[offset + 3] = Math.round(alpha * 255);
  }

  gridContext.putImageData(image, 0, 0);

  const surfaceCanvas = document.createElement('canvas');
  surfaceCanvas.width = cols * UPSCALE_FACTOR;
  surfaceCanvas.height = rows * UPSCALE_FACTOR;

  const surfaceContext = surfaceCanvas.getContext('2d');
  if (!surfaceContext) return null;

  if (clip) {
    surfaceContext.clip(
      buildClipPath(clip.rings, extent, surfaceCanvas.width, surfaceCanvas.height),
      // Even-odd so any inner rings read as holes.
      'evenodd',
    );
  }

  surfaceContext.imageSmoothingEnabled = true;
  surfaceContext.imageSmoothingQuality = 'high';
  surfaceContext.drawImage(gridCanvas, 0, 0, surfaceCanvas.width, surfaceCanvas.height);

  return new ImageElement({
    image: surfaceCanvas,
    georeference: new ExtentAndRotationGeoreference({
      extent: new Extent({
        xmin: extent.xmin,
        ymin: extent.ymin,
        xmax: extent.xmax,
        ymax: extent.ymax,
        spatialReference: { wkid: 4326 },
      }),
    }),
  });
}
