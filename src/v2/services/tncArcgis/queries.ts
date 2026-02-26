import { fetchArcGisJson, isObject } from './client';

const serviceLayerIdCache = new Map<string, number[]>();

function parseFeatureServiceLayerUrl(url: string): { serviceRootUrl: string; layerId: number | null } | null {
  const normalized = url.trim().replace(/\/+$/, '');
  if (!normalized) return null;
  const match = normalized.match(/^(.*\/FeatureServer)(?:\/(\d+))?$/i);
  if (!match) return null;
  const root = match[1];
  const layerId = match[2] ? Number(match[2]) : null;
  if (layerId !== null && !Number.isFinite(layerId)) return { serviceRootUrl: root, layerId: null };
  return { serviceRootUrl: root, layerId };
}

async function fetchServiceLayerIds(serviceRootUrl: string): Promise<number[]> {
  const normalizedRoot = serviceRootUrl.trim().replace(/\/+$/, '');
  if (!normalizedRoot) return [];
  const cached = serviceLayerIdCache.get(normalizedRoot);
  if (cached) return cached;

  const serviceJson = await fetchArcGisJson(
    `${normalizedRoot}?f=json`,
    'Feature service metadata fetch failed',
  );
  const rawLayers = serviceJson.layers;
  if (!Array.isArray(rawLayers)) {
    serviceLayerIdCache.set(normalizedRoot, []);
    return [];
  }
  const layerIds = rawLayers
    .map((layer) => (isObject(layer) && typeof layer.id === 'number' && Number.isFinite(layer.id) ? layer.id : null))
    .filter((id): id is number => id !== null)
    .sort((a, b) => a - b);
  serviceLayerIdCache.set(normalizedRoot, layerIds);
  return layerIds;
}

export async function runWithFeatureLayerFallback(
  url: string,
  execute: (resolvedUrl: string) => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const normalizedUrl = url.trim().replace(/\/+$/, '');
  try {
    return await execute(normalizedUrl);
  } catch (error) {
    const parsed = parseFeatureServiceLayerUrl(normalizedUrl);
    if (!parsed) throw error;

    let layerIds: number[] = [];
    try {
      layerIds = await fetchServiceLayerIds(parsed.serviceRootUrl);
    } catch {
      throw error;
    }

    const fallbackUrls = layerIds
      .map((id) => `${parsed.serviceRootUrl}/${id}`)
      .filter((candidateUrl) => candidateUrl !== normalizedUrl);

    for (const fallbackUrl of fallbackUrls) {
      try {
        return await execute(fallbackUrl);
      } catch {
        // Try next candidate layer URL.
      }
    }

    throw error;
  }
}
