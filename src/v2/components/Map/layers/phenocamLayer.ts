// ============================================================================
// PhenoCam Map Layer — GraphicsLayer with camera icons on a circle backdrop
// so markers stay readable against imagery basemaps.
// ============================================================================

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import type { PhenoCamera } from '../../../services/phenocamService';
import { isPointInsideSpatialPolygon, type SpatialPolygon } from '../../../utils/spatialQuery';

const SYMBOL_SIZE = '36px';
let cameraSymbol: PictureMarkerSymbol | null = null;

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildCircledCameraSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#ffffff" fill-opacity="0.94" stroke="#1f2937" stroke-width="2.25"/>
      <g transform="translate(12 11)" fill="none" stroke="#1f2937" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="13" rx="2.2" ry="2.2" />
        <circle cx="12" cy="11.5" r="3.4" />
        <line x1="7" y1="18" x2="5" y2="22" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="17" y1="18" x2="19" y2="22" />
        <rect x="16" y="6.2" width="3.2" height="2.2" rx="0.5" />
      </g>
    </svg>
  `.trim();
}

function getCameraSymbol(): PictureMarkerSymbol {
  if (!cameraSymbol) {
    cameraSymbol = new PictureMarkerSymbol({
      url: toSvgDataUri(buildCircledCameraSvg()),
      width: SYMBOL_SIZE,
      height: SYMBOL_SIZE,
    });
  }
  return cameraSymbol.clone();
}

export function createPhenoCamLayer(options: {
  id?: string;
  visible?: boolean;
} = {}): GraphicsLayer {
  return new GraphicsLayer({
    id: options.id ?? 'v2-phenocam',
    visible: options.visible ?? true,
  });
}

export function populatePhenoCamLayer(
  layer: GraphicsLayer,
  cameras: PhenoCamera[],
): void {
  layer.removeAll();
  const graphics = cameras.map((camera) => new Graphic({
    geometry: new Point({
      longitude: camera.longitude,
      latitude: camera.latitude,
    }),
    symbol: getCameraSymbol(),
    attributes: {
      id: camera.id,
      sitename: camera.sitename,
      site_label: camera.siteLabel,
      image_count: camera.imageCount,
      active: camera.active ? 1 : 0,
    },
    popupTemplate: {
      title: '{site_label}',
      content: [
        {
          type: 'fields',
          fieldInfos: [
            { fieldName: 'sitename', label: 'Site ID' },
            { fieldName: 'image_count', label: 'Images' },
            { fieldName: 'active', label: 'Active' },
          ],
        },
      ],
    } as __esri.PopupTemplateProperties,
  }));
  layer.addMany(graphics);
}

export function filterPhenoCamLayer(
  layer: GraphicsLayer,
  spatialPolygon?: SpatialPolygon | null,
): void {
  for (const graphic of layer.graphics.toArray()) {
    const geometry = graphic.geometry;
    const point = geometry?.type === 'point' ? (geometry as Point) : null;
    const longitude = typeof point?.longitude === 'number' ? point.longitude : Number.NaN;
    const latitude = typeof point?.latitude === 'number' ? point.latitude : Number.NaN;
    graphic.visible = Number.isFinite(longitude) && Number.isFinite(latitude)
      ? isPointInsideSpatialPolygon(spatialPolygon, longitude, latitude)
      : true;
  }
}
