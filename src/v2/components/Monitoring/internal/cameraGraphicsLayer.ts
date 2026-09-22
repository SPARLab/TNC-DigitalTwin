// ============================================================================
// Camera markers and the selected camera's viewshed.
//
// Colocated cameras share a point. Zoomed out they collapse to a numbered
// cluster; zoomed in they fan along each camera's pan so both stay clickable.
// ============================================================================

import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import CIMSymbol from '@arcgis/core/symbols/CIMSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import Font from '@arcgis/core/symbols/Font';
import {
  describeCameraTime,
  withImageCacheBust,
  type CameraStation,
  type CameraViewshed,
} from '../../../services/cameraService';
import { groupCamerasByProximity, type ScreenPoint } from './cameraClustering';
import { formatStationDisplayName } from '../../../services/dendraStationService';

const ONLINE_FILL: [number, number, number, number] = [5, 150, 105, 230];
const OFFLINE_FILL: [number, number, number, number] = [156, 163, 175, 220];
const SELECTED_STROKE: [number, number, number, number] = [255, 255, 255, 240];
const VIEWSHED_FILL: [number, number, number, number] = [0, 169, 230, 0.22];
const VIEWSHED_OUTLINE: [number, number, number, number] = [0, 169, 230, 0.45];
const CLUSTER_FILL: [number, number, number, number] = [5, 150, 105, 230];

function createWedgeSymbol(isOnline: boolean, pan: number | null, isSelected: boolean): CIMSymbol {
  const fill = isOnline ? ONLINE_FILL : OFFLINE_FILL;
  const size = isSelected ? 22 : 16;

  return new CIMSymbol({
    data: {
      type: 'CIMSymbolReference',
      symbol: {
        type: 'CIMPointSymbol',
        angleAlignment: 'Map',
        symbolLayers: [
          {
            type: 'CIMVectorMarker',
            enable: true,
            size,
            // CIM rotation is counter-clockwise; geographic pan is clockwise.
            rotation: pan == null ? 0 : -pan,
            anchorPoint: { x: 0, y: -0.15 },
            frame: { xmin: 0, ymin: 0, xmax: 16, ymax: 16 },
            markerGraphics: [
              {
                type: 'CIMMarkerGraphic',
                geometry: {
                  rings: [[[8, 16], [1, 1], [8, 5], [15, 1], [8, 16]]],
                },
                symbol: {
                  type: 'CIMPolygonSymbol',
                  symbolLayers: [
                    {
                      type: 'CIMSolidStroke',
                      enable: true,
                      color: isSelected ? SELECTED_STROKE : [255, 255, 255, 200],
                      width: isSelected ? 1.6 : 0.9,
                    },
                    {
                      type: 'CIMSolidFill',
                      enable: true,
                      color: fill,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    } as unknown as CIMSymbol['data'],
  });
}

function popupContent(camera: CameraStation, cacheKey: number) {
  const imageUrl = camera.imageUrl ? withImageCacheBust(camera.imageUrl, cacheKey) : null;
  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'media'; mediaInfos: Array<{ type: 'image'; title: string; value: { sourceURL: string } }> }
  > = [];

  if (imageUrl) {
    content.push({
      type: 'media',
      mediaInfos: [
        {
          type: 'image',
          title: 'Latest frame',
          value: { sourceURL: imageUrl },
        },
      ],
    });
  }

  content.push({
    type: 'text',
    text: `
      <p><b>Status:</b> ${camera.isOnline ? 'Online' : 'Offline'}</p>
      <p><b>Captured:</b> ${describeCameraTime(camera)}</p>
      ${camera.cameraUrl ? `<p><a href="${camera.cameraUrl}" target="_blank" rel="noreferrer">Open on ALERTCalifornia</a></p>` : ''}
    `,
  });

  return content;
}

export function createCameraMarkerLayer(
  cameras: CameraStation[],
  selectedObjectId: number | null,
  cacheKey: number,
  screenOf: (point: { longitude: number; latitude: number }) => ScreenPoint | null,
): GraphicsLayer {
  const layer = new GraphicsLayer({
    title: 'ALERTCalifornia Cameras',
    listMode: 'hide',
  });

  const clusters = groupCamerasByProximity(cameras, screenOf);

  for (const cluster of clusters) {
    const geometry = new Point({
      longitude: cluster.longitude,
      latitude: cluster.latitude,
    });
    const objectIds = cluster.cameras.map((camera) => camera.objectId);
    const containsSelection =
      selectedObjectId != null && objectIds.includes(selectedObjectId);

    if (cluster.cameras.length > 1) {
      addClusterGraphic(layer, geometry, objectIds, containsSelection);
      continue;
    }

    const camera = cluster.cameras[0];
    const isSelected = camera.objectId === selectedObjectId;

    const displayName = formatStationDisplayName(camera.cameraName);

    layer.add(
      new Graphic({
        geometry,
        symbol: createWedgeSymbol(camera.isOnline, camera.pan, isSelected),
        attributes: {
          objectId: camera.objectId,
          objectIds: String(camera.objectId),
          clusterCount: 1,
          cameraName: displayName,
        },
        popupTemplate: {
          title: displayName,
          content: popupContent(camera, cacheKey),
        },
      }),
    );

    const label = new Graphic({
      geometry,
      symbol: new TextSymbol({
        text: displayName,
        color: [255, 255, 255, 240],
        haloColor: [0, 0, 0, 190],
        haloSize: 1.6,
        font: new Font({ size: 9, family: 'sans-serif' }),
        horizontalAlignment: 'center',
        verticalAlignment: 'top',
        yoffset: isSelected ? -16 : -12,
      }),
      attributes: {
        objectId: camera.objectId,
        objectIds: String(camera.objectId),
        clusterCount: 1,
        cameraName: displayName,
      },
    });
    layer.add(label);
  }

  return layer;
}

function addClusterGraphic(
  layer: GraphicsLayer,
  geometry: Point,
  objectIds: number[],
  isSelected: boolean,
): void {
  const count = objectIds.length;
  const size = 22 + Math.min(count, 6) * 2;
  const ids = objectIds.join(',');

  layer.add(
    new Graphic({
      geometry,
      symbol: new SimpleMarkerSymbol({
        style: 'circle',
        size,
        color: CLUSTER_FILL,
        outline: {
          color: isSelected ? SELECTED_STROKE : [255, 255, 255, 230],
          width: isSelected ? 2 : 1.5,
        },
      }),
      attributes: {
        objectId: objectIds[0],
        objectIds: ids,
        clusterCount: count,
      },
    }),
  );

  layer.add(
    new Graphic({
      geometry,
      symbol: new TextSymbol({
        text: String(count),
        color: [255, 255, 255, 255],
        font: new Font({ size: 11, family: 'sans-serif', weight: 'bold' }),
        horizontalAlignment: 'center',
        verticalAlignment: 'middle',
      }),
      attributes: {
        objectId: objectIds[0],
        objectIds: ids,
        clusterCount: count,
      },
    }),
  );
}

export function createCameraViewshedLayer(
  viewsheds: CameraViewshed[],
  selectedObjectId: number | null,
): GraphicsLayer {
  const layer = new GraphicsLayer({
    title: 'Camera Viewshed',
    listMode: 'hide',
    // The viewshed polygon is a dense fan; per-vertex alpha stacks to a solid
    // slab, so transparency is applied to the whole layer after compositing.
    opacity: 0.18,
  });

  const selected = viewsheds.find((viewshed) => viewshed.objectId === selectedObjectId);
  if (!selected) return layer;

  layer.add(
    new Graphic({
      geometry: new Polygon({
        rings: selected.rings,
        spatialReference: { wkid: 4326 },
      }),
      symbol: new SimpleFillSymbol({
        color: VIEWSHED_FILL,
        outline: { color: VIEWSHED_OUTLINE, width: 1.25 },
      }),
      attributes: { objectId: selected.objectId, cameraName: selected.cameraName },
    }),
  );

  return layer;
}
