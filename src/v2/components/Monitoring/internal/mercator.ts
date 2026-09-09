// ============================================================================
// Web Mercator helpers shared by the canvas overlays.
//
// Both overlays keep their data in longitude/latitude but draw into a canvas
// sized in device pixels, so they need to project without the per-point cost of
// view.toScreen.
// ============================================================================

import type MapView from '@arcgis/core/views/MapView';

const EARTH_RADIUS_METRES = 6378137;
const MAX_MERCATOR_LATITUDE = 85.05112878;

export function longitudeToMercatorX(longitude: number): number {
  return (EARTH_RADIUS_METRES * longitude * Math.PI) / 180;
}

export function latitudeToMercatorY(latitude: number): number {
  const clamped = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
  const radians = (clamped * Math.PI) / 180;
  return EARTH_RADIUS_METRES * Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

export function mercatorXToLongitude(x: number): number {
  return (x / EARTH_RADIUS_METRES) * (180 / Math.PI);
}

export function mercatorYToLatitude(y: number): number {
  return (2 * Math.atan(Math.exp(y / EARTH_RADIUS_METRES)) - Math.PI / 2) * (180 / Math.PI);
}

/**
 * Maps Web Mercator metres to device pixels. Only valid while the view is
 * north-up, which the monitoring map enforces via `rotationEnabled: false`.
 */
export interface FrameTransform {
  xmin: number;
  ymax: number;
  scaleX: number;
  scaleY: number;
}

export function getFrameTransform(view: MapView): FrameTransform | null {
  const extent = view.extent;
  if (!extent || !view.width || !view.height) return null;

  const spanX = extent.xmax - extent.xmin;
  const spanY = extent.ymax - extent.ymin;
  if (!spanX || !spanY) return null;

  const dpr = window.devicePixelRatio || 1;

  return {
    xmin: extent.xmin,
    ymax: extent.ymax,
    scaleX: (view.width * dpr) / spanX,
    scaleY: (view.height * dpr) / spanY,
  };
}

/** Create a canvas layered over the view surface, or null if it is not ready. */
export function createOverlayCanvas(view: MapView): HTMLCanvasElement | null {
  const surface = view.container?.querySelector('.esri-view-surface');
  if (!surface) return null;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';

  surface.appendChild(canvas);
  return canvas;
}

export function syncCanvasSize(canvas: HTMLCanvasElement, view: MapView): void {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = view;
  if (!width || !height) return;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
