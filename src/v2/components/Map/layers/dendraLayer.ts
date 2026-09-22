// ============================================================================
// Dendra Map Layer — GraphicsLayer populated from per-type sensor stations.
// Active stations: green circle. Inactive: gray circle.
// When zoomed out, overlapping stations collapse to numbered clusters; names
// appear only on individual (declustered) markers.
// ============================================================================

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import { formatStationDisplayName, type DendraStation } from '../../../services/dendraStationService';
import { isPointInsideSpatialPolygon, type SpatialPolygon } from '../../../utils/spatialQuery';

const ACTIVE_MARKER_SIZE = 16;
const INACTIVE_MARKER_SIZE = 14;
const CLUSTER_MARKER_SIZE = 28;
/** Screen-space distance (px) under which stations collapse into one cluster. */
export const DENDRA_STATION_CLUSTER_PIXEL_THRESHOLD = 40;

const ACTIVE_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  color: [34, 139, 34, 0.9],   // forest green
  size: ACTIVE_MARKER_SIZE,
  outline: { color: [255, 255, 255], width: 1.75 },
});

const INACTIVE_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  color: [156, 163, 175, 0.85], // gray-400
  size: INACTIVE_MARKER_SIZE,
  outline: { color: [255, 255, 255], width: 1.25 },
});

const CLUSTER_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  color: [22, 101, 52, 0.95], // green-800
  size: CLUSTER_MARKER_SIZE,
  outline: { color: [255, 255, 255], width: 2 },
});

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface DendraStationCluster {
  stations: DendraStation[];
  longitude: number;
  latitude: number;
}

function stationNameLabelSymbol(isActive: boolean): TextSymbol {
  const markerSize = isActive ? ACTIVE_MARKER_SIZE : INACTIVE_MARKER_SIZE;
  return new TextSymbol({
    text: '', // filled per graphic
    // Match monitoring Labels captions: light text + dark halo under the disc.
    color: isActive ? [255, 255, 255, 240] : [226, 232, 240, 220],
    haloColor: [0, 0, 0, 190],
    haloSize: 1.6,
    font: new Font({
      size: 9,
      family: 'sans-serif',
    }),
    horizontalAlignment: 'center',
    verticalAlignment: 'top',
    yoffset: -(markerSize / 2 + 4),
  });
}

function clusterCountSymbol(count: number): TextSymbol {
  return new TextSymbol({
    text: String(count),
    color: [255, 255, 255, 255],
    font: new Font({
      size: count >= 100 ? 10 : 12,
      family: 'sans-serif',
      weight: 'bold',
    }),
    horizontalAlignment: 'center',
    verticalAlignment: 'middle',
  });
}

function stationPopupTemplate() {
  return {
    title: '{station_display_name}',
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
  } as __esri.PopupTemplateProperties;
}

function stationAttributes(station: DendraStation) {
  const displayName = formatStationDisplayName(station.station_name);
  return {
    station_id: station.station_id,
    station_name: station.station_name,
    station_display_name: displayName,
    sensor_name: station.sensor_name,
    is_active: station.is_active,
    datastream_count: station.datastream_count,
    elevation: station.elevation,
    is_label: 0,
    is_cluster: 0,
    cluster_count: 1,
    cluster_station_ids: String(station.station_id),
  };
}

/**
 * Greedy clustering in screen space so overlapping station dots collapse when
 * zoomed out and separate (with name labels) as the user zooms in.
 */
export function groupStationsByProximity(
  stations: DendraStation[],
  screenOf: (point: { longitude: number; latitude: number }) => ScreenPoint | null,
  thresholdPx = DENDRA_STATION_CLUSTER_PIXEL_THRESHOLD,
): DendraStationCluster[] {
  const used = new Set<number>();
  const clusters: DendraStationCluster[] = [];

  for (let index = 0; index < stations.length; index++) {
    if (used.has(index)) continue;

    const seed = stations[index];
    const seedScreen = screenOf({ longitude: seed.longitude, latitude: seed.latitude });
    const members = [seed];
    used.add(index);

    if (seedScreen) {
      for (let other = index + 1; other < stations.length; other++) {
        if (used.has(other)) continue;
        const candidate = stations[other];
        const otherScreen = screenOf({
          longitude: candidate.longitude,
          latitude: candidate.latitude,
        });
        if (!otherScreen) continue;
        const distance = Math.hypot(seedScreen.x - otherScreen.x, seedScreen.y - otherScreen.y);
        if (distance <= thresholdPx) {
          members.push(candidate);
          used.add(other);
        }
      }
    }

    const longitude = members.reduce((sum, station) => sum + station.longitude, 0) / members.length;
    const latitude = members.reduce((sum, station) => sum + station.latitude, 0) / members.length;
    clusters.push({ stations: members, longitude, latitude });
  }

  return clusters;
}

function filterVisibleStations(
  stations: DendraStation[],
  showActiveOnly: boolean,
  spatialPolygon?: SpatialPolygon | null,
): DendraStation[] {
  return stations.filter((station) => {
    if (showActiveOnly && station.is_active !== 1) return false;
    return isPointInsideSpatialPolygon(spatialPolygon, station.longitude, station.latitude);
  });
}

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

export interface PopulateDendraLayerOptions {
  /** When provided, overlapping stations are clustered in screen space. */
  screenOf?: (point: { longitude: number; latitude: number }) => ScreenPoint | null;
  showActiveOnly?: boolean;
  spatialPolygon?: SpatialPolygon | null;
}

/** Populate a GraphicsLayer from station data (optionally clustered by screen proximity). */
export function populateDendraLayer(
  layer: GraphicsLayer,
  stations: DendraStation[],
  options: PopulateDendraLayerOptions = {},
): void {
  layer.removeAll();

  const visible = filterVisibleStations(
    stations,
    options.showActiveOnly ?? false,
    options.spatialPolygon,
  );

  const groups = options.screenOf
    ? groupStationsByProximity(visible, options.screenOf)
    : visible.map((station) => ({
        stations: [station],
        longitude: station.longitude,
        latitude: station.latitude,
      }));

  const graphics: Graphic[] = [];

  for (const group of groups) {
    const geometry = new Point({ longitude: group.longitude, latitude: group.latitude });

    if (group.stations.length > 1) {
      const ids = group.stations.map((station) => station.station_id);
      const activeCount = group.stations.filter((station) => station.is_active === 1).length;
      graphics.push(new Graphic({
        geometry,
        symbol: CLUSTER_SYMBOL,
        attributes: {
          station_id: ids[0],
          station_name: `${group.stations.length} stations`,
          station_display_name: `${group.stations.length} stations`,
          sensor_name: '',
          is_active: activeCount > 0 ? 1 : 0,
          datastream_count: group.stations.reduce((sum, s) => sum + (s.datastream_count ?? 0), 0),
          elevation: null,
          is_label: 0,
          is_cluster: 1,
          cluster_count: group.stations.length,
          cluster_station_ids: ids.join(','),
        },
        popupTemplate: {
          title: '{cluster_count} stations',
          content: 'Zoom in to see individual stations and their names.',
        } as __esri.PopupTemplateProperties,
      }));
      graphics.push(new Graphic({
        geometry,
        symbol: clusterCountSymbol(group.stations.length),
        attributes: {
          is_label: 1,
          is_cluster: 1,
          cluster_count: group.stations.length,
          cluster_station_ids: ids.join(','),
          station_id: ids[0],
        },
      }));
      continue;
    }

    const station = group.stations[0];
    const isActive = station.is_active === 1;
    const attributes = stationAttributes(station);

    graphics.push(new Graphic({
      geometry,
      symbol: isActive ? ACTIVE_SYMBOL : INACTIVE_SYMBOL,
      attributes,
      popupTemplate: stationPopupTemplate(),
    }));

    // Names only when declustered to a single station.
    const labelSymbol = stationNameLabelSymbol(isActive);
    labelSymbol.text = attributes.station_display_name;
    graphics.push(new Graphic({
      geometry,
      symbol: labelSymbol,
      attributes: {
        ...attributes,
        is_label: 1,
      },
    }));
  }

  layer.addMany(graphics);
}

/**
 * Re-apply active-only / spatial filters and clustering.
 * Prefer this over toggling graphic.visible so cluster membership stays correct.
 */
export function filterDendraLayer(
  layer: GraphicsLayer,
  showActiveOnly: boolean,
  spatialPolygon: SpatialPolygon | null | undefined,
  stations: DendraStation[],
  screenOf?: (point: { longitude: number; latitude: number }) => ScreenPoint | null,
): void {
  populateDendraLayer(layer, stations, { screenOf, showActiveOnly, spatialPolygon });
}
