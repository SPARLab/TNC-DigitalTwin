// ============================================================================
// Mosaic item selection for CHELSA-style raster stacks.
//
// Each bioclimatic variable is one mosaic item. Requests have to lock it with
// Tag = 'bioNN' (Name LIKE '%bioNN%' is the same item's other key).
// ============================================================================

export type MosaicRuleJson =
  | {
      /** Show the matching catalog item by itself. Do not blend the stack. */
      method: 'none';
      where: string;
    }
  | {
      /** Draw one catalog raster, identified by its object id. */
      method: 'lock-raster';
      lockRasterIds: number[];
      operation: 'first';
    };

/** bio13 / Bio13 / "Bio13 Precipitation amount" → "bio13". */
export function bioclimMosaicTag(
  ...names: Array<string | null | undefined>
): string | null {
  for (const name of names) {
    const text = name?.trim();
    if (!text) continue;
    const exact = text.match(/^bio(\d{1,2})$/i);
    if (exact) return paddedBioTag(exact[1]);
  }
  for (const name of names) {
    const text = name?.trim();
    if (!text) continue;
    const embedded = text.match(/\bbio[\s_-]?(\d{1,2})\b/i);
    if (embedded) return paddedBioTag(embedded[1]);
  }
  return null;
}

function paddedBioTag(digits: string): string {
  return `bio${digits.padStart(2, '0')}`;
}

function isBioTag(tag: string | null | undefined): tag is string {
  return !!tag && /^bio\d{2}$/.test(tag);
}

/** Where-clause fallback when the catalog object id cannot be resolved. */
export function mosaicRuleForTag(tag: string | null | undefined): MosaicRuleJson | null {
  if (!isBioTag(tag)) return null;
  const titled = `Bio${tag.slice(3)}`;
  return {
    method: 'none',
    where: `Tag = '${tag}' OR Tag = '${titled}' OR Name LIKE '%${tag}%'`,
  };
}

function lockRasterRule(objectId: number): MosaicRuleJson {
  return {
    method: 'lock-raster',
    lockRasterIds: [objectId],
    operation: 'first',
  };
}

/** ImageServer REST mosaicRule parameter. */
export function mosaicRuleQueryValue(rule: MosaicRuleJson | null): string | null {
  if (!rule) return null;
  if (rule.method === 'lock-raster') {
    return JSON.stringify({
      mosaicMethod: 'esriMosaicLockRaster',
      lockRasterIds: rule.lockRasterIds,
      mosaicOperation: 'MT_FIRST',
    });
  }
  return JSON.stringify({
    mosaicMethod: 'esriMosaicNone',
    where: rule.where,
  });
}

const mosaicObjectIdCache = new Map<string, number | null>();

function attributesMatchTag(attributes: Record<string, unknown>, tag: string): boolean {
  return Object.values(attributes).some(
    (value) => typeof value === 'string' && value.toLowerCase().includes(tag),
  );
}

function objectIdFrom(attributes: Record<string, unknown>): number | null {
  for (const [key, value] of Object.entries(attributes)) {
    if (!/objectid|^oid$/i.test(key)) continue;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

async function queryMosaicObjectId(
  rasterUrl: string,
  where: string,
  tag: string,
  token: string | null,
): Promise<number | null> {
  const params = new URLSearchParams({
    f: 'json',
    where,
    outFields: '*',
    returnGeometry: 'false',
    resultRecordCount: '20',
  });
  if (token) params.set('token', token);
  const response = await fetch(`${rasterUrl.replace(/\/+$/, '')}/query?${params.toString()}`);
  const json = (await response.json().catch(() => null)) as {
    error?: unknown;
    features?: Array<{ attributes?: Record<string, unknown> }>;
  } | null;
  if (!json || json.error || !Array.isArray(json.features)) return null;
  for (const feature of json.features) {
    const attributes = feature.attributes ?? {};
    if (!attributesMatchTag(attributes, tag)) continue;
    const objectId = objectIdFrom(attributes);
    if (objectId != null) return objectId;
  }
  return null;
}

/**
 * Lock one mosaic item. The service histogram and the default draw are the
 * first catalog raster (Bio01) unless a request names an object id.
 */
export async function resolveMosaicRule(options: {
  rasterUrl: string;
  tag: string | null | undefined;
  token: string | null;
}): Promise<MosaicRuleJson | null> {
  const tag = options.tag;
  if (!isBioTag(tag)) return null;
  const cacheKey = `${options.rasterUrl}|${tag}`;
  if (!mosaicObjectIdCache.has(cacheKey)) {
    const titled = `Bio${tag.slice(3)}`;
    const objectId = await queryMosaicObjectId(options.rasterUrl, `Tag = '${tag}'`, tag, options.token)
      ?? await queryMosaicObjectId(options.rasterUrl, `Tag = '${titled}'`, tag, options.token)
      ?? await queryMosaicObjectId(options.rasterUrl, `Name LIKE '%${tag}%'`, tag, options.token);
    if (objectId != null) mosaicObjectIdCache.set(cacheKey, objectId);
  }
  const objectId = mosaicObjectIdCache.get(cacheKey);
  return objectId == null ? mosaicRuleForTag(tag) : lockRasterRule(objectId);
}
