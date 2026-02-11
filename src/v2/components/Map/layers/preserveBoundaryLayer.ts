// ============================================================================
// Preserve Boundary Layer — GeoJSON outline of the Dangermond Preserve
// ============================================================================

import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';

export function createPreserveBoundaryLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): GeoJSONLayer {
  return new GeoJSONLayer({
    url: '/dangermond-preserve-boundary.geojson',
    id: options.id ?? 'v2-preserve-boundary',
    visible: options.visible ?? true,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [34, 197, 94, 0.08],
        outline: { color: [34, 197, 94, 0.6], width: 2 },
      },
    } as __esri.SimpleRendererProperties as unknown as __esri.Renderer,
    popupEnabled: false,
  });
}
