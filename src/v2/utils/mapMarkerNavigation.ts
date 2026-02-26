const DEFAULT_SELECT_ZOOM_LEVEL = 5;
const WEB_MERCATOR_SCALE_AT_ZOOM_0 = 591657527.591555;

function toEstimatedZoom(scale: number | undefined): number | null {
  if (typeof scale !== 'number' || !Number.isFinite(scale) || scale <= 0) return null;
  return Math.log2(WEB_MERCATOR_SCALE_AT_ZOOM_0 / scale);
}

/**
 * Get the current zoom level from the view.
 * SceneView can return zoom = -1 when the camera is tilted or in transition,
 * so we reject non-positive values and fall back to a scale-based estimate.
 */
function getCurrentZoomLevel(view: __esri.MapView | __esri.SceneView): number | null {
  if (typeof view.zoom === 'number' && Number.isFinite(view.zoom) && view.zoom > 0) {
    return view.zoom;
  }
  return toEstimatedZoom(view.scale);
}

/**
 * Navigate to a marker point using smart zoom behavior:
 *  - Below `defaultZoomLevel` → pan + zoom in to that level.
 *  - At or above `defaultZoomLevel` → center only, lock current zoom/scale.
 *  - If zoom can't be determined → center only (never zoom out by default).
 */
export async function goToMarkerWithSmartZoom(params: {
  view: __esri.MapView | __esri.SceneView;
  longitude: number;
  latitude: number;
  duration?: number;
  defaultZoomLevel?: number;
}): Promise<void> {
  const {
    view,
    longitude,
    latitude,
    duration = 700,
    defaultZoomLevel = DEFAULT_SELECT_ZOOM_LEVEL,
  } = params;

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;

  const currentZoom = getCurrentZoomLevel(view);

  // When we can't determine zoom, err on the side of NOT changing it.
  const shouldZoomIn = currentZoom != null && currentZoom < defaultZoomLevel;

  let target: __esri.GoToTarget2D | __esri.GoToTarget3D;
  if (shouldZoomIn) {
    target = { center: [longitude, latitude], zoom: defaultZoomLevel };
  } else if (typeof view.zoom === 'number' && Number.isFinite(view.zoom) && view.zoom > 0) {
    target = { center: [longitude, latitude], zoom: view.zoom };
  } else if (typeof view.scale === 'number' && Number.isFinite(view.scale) && view.scale > 0) {
    target = { center: [longitude, latitude], scale: view.scale };
  } else {
    target = { center: [longitude, latitude] };
  }

  await view.goTo(target, { duration }).catch(() => {
    // Ignore goTo interruptions from rapid user interactions.
  });
}
