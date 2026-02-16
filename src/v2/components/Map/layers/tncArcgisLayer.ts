import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import type { CatalogLayer } from '../../../types';
import { buildServiceUrl } from '../../../services/tncArcgisService';

function sanitizeArcGisBaseUrl(serverBaseUrl: string): string {
  const trimmed = serverBaseUrl.trim().replace(/\/+$/, '');
  return /\/rest\/services$/i.test(trimmed) ? trimmed : `${trimmed}/rest/services`;
}

function buildMapServerServiceUrl(meta: NonNullable<CatalogLayer['catalogMeta']>): string {
  const base = sanitizeArcGisBaseUrl(meta.serverBaseUrl);
  const path = meta.servicePath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return `${base}/${path}/MapServer`;
}

/** Build a map-ready ArcGIS layer for TNC catalog layers. */
export function createTNCArcGISLayer(options: {
  id: string;
  layer: CatalogLayer;
  visible?: boolean;
  whereClause?: string;
}): Layer | null {
  const { id, layer, visible = true, whereClause } = options;
  const meta = layer.catalogMeta;
  if (!meta) return null;

  const definitionExpression = whereClause?.trim() || '1=1';

  // FeatureServer layers can use FeatureLayer directly with SQL filtering.
  if (meta.hasFeatureServer) {
    return new FeatureLayer({
      id,
      url: buildServiceUrl(meta),
      visible,
      outFields: ['*'],
      definitionExpression,
    });
  }

  // MapServer fallback: render as MapImageLayer and apply the filter to the sublayer.
  if (meta.hasMapServer) {
    return new MapImageLayer({
      id,
      url: buildMapServerServiceUrl(meta),
      visible,
      sublayers: [{
        id: Number.isInteger(meta.layerIdInService) ? meta.layerIdInService! : 0,
        visible: true,
        definitionExpression,
      }],
    });
  }

  return null;
}
