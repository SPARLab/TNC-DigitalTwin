// ============================================================================
// Dendra Map Layer — GraphicsLayer populated from per-type sensor stations.
// Active stations: green circle. Inactive: gray circle.
// Shared across all 10 Dendra sensor services (same schema, different data).
// ============================================================================

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import type { DendraStation } from '../../../services/dendraStationService';

const ACTIVE_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  color: [34, 139, 34, 0.9],   // forest green
  size: '10px',
  outline: { color: [255, 255, 255], width: 1.5 },
});

const INACTIVE_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  color: [156, 163, 175, 0.8], // gray-400
  size: '8px',
  outline: { color: [255, 255, 255], width: 1 },
});

/** Create an empty GraphicsLayer for Dendra station points */
export function createDendraLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): GraphicsLayer {
  return new GraphicsLayer({
    id: options.id ?? 'v2-dendra',
    visible: options.visible ?? true,
  });
}

/** Populate a GraphicsLayer from station data (called once per service load) */
export function populateDendraLayer(
  layer: GraphicsLayer,
  stations: DendraStation[],
): void {
  layer.removeAll();

  const graphics = stations.map(s => new Graphic({
    geometry: new Point({ longitude: s.longitude, latitude: s.latitude }),
    symbol: s.is_active === 1 ? ACTIVE_SYMBOL : INACTIVE_SYMBOL,
    attributes: {
      station_id: s.station_id,
      station_name: s.station_name,
      sensor_name: s.sensor_name,
      is_active: s.is_active,
      datastream_count: s.datastream_count,
      elevation: s.elevation,
    },
    popupTemplate: {
      title: '{station_name}',
      content: [
        {
          type: 'fields',
          fieldInfos: [
            { fieldName: 'sensor_name', label: 'Sensor Type' },
            { fieldName: 'datastream_count', label: 'Datastreams' },
            { fieldName: 'elevation', label: 'Elevation (m)' },
            { fieldName: 'is_active', label: 'Active' },
          ],
        },
      ],
    } as __esri.PopupTemplateProperties,
  }));

  layer.addMany(graphics);
}

/** Toggle station visibility based on active-only filter */
export function filterDendraLayer(
  layer: GraphicsLayer,
  showActiveOnly: boolean,
): void {
  for (const graphic of layer.graphics.toArray()) {
    graphic.visible = !showActiveOnly || graphic.attributes?.is_active === 1;
  }
}
