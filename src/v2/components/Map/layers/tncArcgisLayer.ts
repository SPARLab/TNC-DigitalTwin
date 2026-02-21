import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import type { CatalogLayer } from '../../../types';
import { buildServiceRootUrl, buildServiceUrl } from '../../../services/tncArcgisService';

function sanitizeArcGisBaseUrl(serverBaseUrl: string): string {
  const trimmed = serverBaseUrl.trim().replace(/\/+$/, '');
  return /\/rest\/services$/i.test(trimmed) ? trimmed : `${trimmed}/rest/services`;
}

function buildMapServerServiceUrl(meta: NonNullable<CatalogLayer['catalogMeta']>): string {
  const base = sanitizeArcGisBaseUrl(meta.serverBaseUrl);
  const path = meta.servicePath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return `${base}/${path}/MapServer`;
}

function buildImageServerServiceUrl(meta: NonNullable<CatalogLayer['catalogMeta']>): string {
  const base = sanitizeArcGisBaseUrl(meta.serverBaseUrl);
  const path = meta.servicePath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  return `${base}/${path}/ImageServer`;
}

function getFeatureLayerUrlCandidates(meta: NonNullable<CatalogLayer['catalogMeta']>): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const pushCandidate = (url: string) => {
    const normalized = url.trim().replace(/\/+$/, '');
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  const preferredUrl = buildServiceUrl(meta);
  pushCandidate(preferredUrl);

  const serviceRootUrl = buildServiceRootUrl(meta).replace(/\/+$/, '');
  if (meta.isMultiLayerService && Number.isInteger(meta.layerIdInService)) {
    pushCandidate(`${serviceRootUrl}/${meta.layerIdInService}`);
  }
  pushCandidate(`${serviceRootUrl}/0`);

  return candidates;
}

async function fetchFeatureServiceLayerUrls(serviceRootUrl: string): Promise<string[]> {
  const normalizedRoot = serviceRootUrl.trim().replace(/\/+$/, '');
  if (!normalizedRoot) return [];
  try {
    const response = await fetch(`${normalizedRoot}?f=json`);
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') return [];
    const rawLayers = (payload as { layers?: unknown }).layers;
    if (!Array.isArray(rawLayers)) return [];
    return rawLayers
      .map((layer) => {
        if (!layer || typeof layer !== 'object') return null;
        const id = (layer as { id?: unknown }).id;
        if (typeof id !== 'number' || !Number.isFinite(id)) return null;
        return `${normalizedRoot}/${id}`;
      })
      .filter((url): url is string => !!url);
  } catch {
    return [];
  }
}

function attachFeatureLayerLoadFallback(
  featureLayer: FeatureLayer,
  candidates: string[],
  layerName: string,
): void {
  if (candidates.length === 0) return;
  void featureLayer.load().catch(async () => {
    const parsedRootMatch = candidates[0].match(/^(.*\/FeatureServer)(?:\/\d+)?$/i);
    const discoveredCandidates = parsedRootMatch
      ? await fetchFeatureServiceLayerUrls(parsedRootMatch[1])
      : [];
    const recoveryCandidates = [...new Set([...candidates.slice(1), ...discoveredCandidates])];

    for (const candidateUrl of recoveryCandidates) {
      try {
        featureLayer.url = candidateUrl;
        await featureLayer.load();
        console.warn(`[TNCArcGIS] Recovered layer load via fallback URL: ${candidateUrl} (${layerName})`);
        return;
      } catch {
        // Try the next candidate.
      }
    }
    console.error(`[TNCArcGIS] Failed to load FeatureLayer after URL fallbacks (${layerName})`, {
      attemptedUrls: [candidates[0], ...recoveryCandidates],
    });
  });
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

  const isGbifLayer =
    layer.id === 'dataset-178' ||
    meta.servicePath.toLowerCase().includes('dangermond_preserve_species_occurrences');

  // FeatureServer layers can use FeatureLayer directly with SQL filtering.
  if (meta.hasFeatureServer) {
    const featureLayerUrlCandidates = getFeatureLayerUrlCandidates(meta);
    const featureLayer = new FeatureLayer({
      id,
      url: featureLayerUrlCandidates[0],
      visible,
      outFields: ['*'],
      definitionExpression,
      // GBIF has very dense points; use high-contrast symbols and clustering
      // so records are visually obvious at preserve zoom levels.
      // IMPORTANT: Only spread renderer/featureReduction when actually needed.
      // Passing `renderer: undefined` explicitly overrides the service default
      // renderer, causing non-GBIF layers to render nothing.
      ...(isGbifLayer ? {
        renderer: {
          type: 'simple' as const,
          symbol: {
            type: 'simple-marker' as const,
            style: 'circle' as const,
            size: 7,
            color: [22, 163, 74, 0.85],
            outline: {
              color: [255, 255, 255, 1],
              width: 1.2,
            },
          },
        },
        featureReduction: {
          type: 'cluster' as const,
          clusterRadius: '48px',
          labelingInfo: [{
            deconflictionStrategy: 'none' as const,
            labelExpressionInfo: { expression: 'Text($feature.cluster_count, "#,###")' },
            symbol: {
              type: 'text' as const,
              color: 'white',
              haloColor: [0, 0, 0, 0.25],
              haloSize: 1,
              font: { family: 'Arial', size: 11, weight: 'bold' },
            },
            labelPlacement: 'center-center' as const,
          }],
        },
      } : {}),
    });
    attachFeatureLayerLoadFallback(featureLayer, featureLayerUrlCandidates, layer.name);
    return featureLayer;
  }

  // MapServer fallback: render as MapImageLayer and apply the filter to the sublayer.
  if (meta.hasMapServer) {
    const sublayerId = meta.isMultiLayerService
      ? (Number.isInteger(meta.layerIdInService) ? meta.layerIdInService : 0)
      : 0;
    return new MapImageLayer({
      id,
      url: buildMapServerServiceUrl(meta),
      visible,
      sublayers: [{
        id: sublayerId,
        visible: true,
        definitionExpression,
      }],
    });
  }

  // ImageServer layers render through ImageryLayer.
  if (meta.hasImageServer) {
    return new ImageryLayer({
      id,
      url: buildImageServerServiceUrl(meta),
      visible,
    });
  }

  return null;
}
