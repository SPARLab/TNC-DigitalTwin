/**
 * Map control utilities for zoom and fullscreen operations
 */

/**
 * Zooms the map in by one level
 */
export const zoomIn = (view: __esri.MapView | null): void => {
  if (view) {
    view.goTo({
      zoom: view.zoom + 1
    });
  }
};

/**
 * Zooms the map out by one level
 */
export const zoomOut = (view: __esri.MapView | null): void => {
  if (view) {
    view.goTo({
      zoom: view.zoom - 1
    });
  }
};

/**
 * Activates fullscreen mode for the map
 */
export const enterFullscreen = (view: __esri.MapView | null): void => {
  if (view && view.container) {
    const element = view.container as HTMLElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  }
};

