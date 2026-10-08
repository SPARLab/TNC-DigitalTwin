// ============================================================================
// rasterFamilies — group catalog rasters that share a display name across
// extents and resolutions so the suitability data step can show availability.
// ============================================================================

import type { CatalogRaster, RasterScope } from '../types';
import { RASTER_SCOPE_OPTIONS } from '../types';

export interface RasterFamily {
  key: string;
  title: string;
  thematicCategory: string;
  units: string;
  variants: CatalogRaster[];
}

/** Collapse resolution / jurisdiction prefixes so variants share one row. */
export function rasterFamilyKey(raster: CatalogRaster): string {
  const stripped = raster.title
    .replace(/\s+\d+\s*m\b/gi, ' ')
    .replace(/\b(10|30|100|500|1000)\s*m\b/gi, ' ')
    .replace(/^(JLDP|SBC|SBCounty|TRI|TriCounty|Tri-County)[\s_]+/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return stripped || raster.title.trim().toLowerCase();
}

export function groupRastersIntoFamilies(rasters: CatalogRaster[]): RasterFamily[] {
  const byKey = new Map<string, RasterFamily>();

  for (const raster of rasters) {
    if (raster.scope == null || raster.resolution == null) continue;
    const key = rasterFamilyKey(raster);
    const existing = byKey.get(key);
    if (existing) {
      existing.variants.push(raster);
      continue;
    }
    byKey.set(key, {
      key,
      title: raster.title.replace(/\s+\d+\s*m\b/gi, '').replace(/\s+/g, ' ').trim() || raster.title,
      thematicCategory: raster.thematicCategory,
      units: raster.units,
      variants: [raster],
    });
  }

  return [...byKey.values()]
    .map((family) => ({
      ...family,
      // Prefer a title without a trailing resolution when any variant has one.
      title: preferFamilyTitle(family.variants),
      variants: [...family.variants].sort((a, b) => {
        const scopeOrder = scopeSortIndex(a.scope) - scopeSortIndex(b.scope);
        if (scopeOrder !== 0) return scopeOrder;
        return (a.resolution ?? 0) - (b.resolution ?? 0);
      }),
    }))
    .sort((a, b) => {
      const category = a.thematicCategory.localeCompare(b.thematicCategory);
      if (category !== 0) return category;
      return a.title.localeCompare(b.title);
    });
}

function preferFamilyTitle(variants: CatalogRaster[]): string {
  const cleaned = variants
    .map((raster) =>
      raster.title.replace(/\s+\d+\s*m\b/gi, '').replace(/\s+/g, ' ').trim(),
    )
    .filter(Boolean);
  // Prefer the longest cleaned title (often the curated layer_name).
  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0] || variants[0]?.title || 'Untitled';
}

function scopeSortIndex(scope: RasterScope | null): number {
  const order = RASTER_SCOPE_OPTIONS.map((option) => option.value);
  if (!scope) return order.length;
  const index = order.indexOf(scope);
  return index === -1 ? order.length : index;
}

/** Smaller number = tighter extent. Wider rasters can be clipped down; tighter ones cannot be expanded. */
const SCOPE_RANK: Record<RasterScope, number> = {
  preserve: 0,
  sbcounty: 1,
  tricounty: 2,
};

/** Extents whose rasters can be clipped to the analysis mask at the same cell size. */
export function scopesEligibleForAnalysis(analysis: RasterScope): RasterScope[] {
  const rank = SCOPE_RANK[analysis];
  return (Object.keys(SCOPE_RANK) as RasterScope[]).filter(
    (scope) => SCOPE_RANK[scope] >= rank,
  );
}

export function rasterCoversAnalysis(
  rasterScope: RasterScope | null,
  analysis: RasterScope,
  rasterResolution: number | null,
  analysisResolution: number | null,
): boolean {
  if (rasterScope == null || rasterResolution == null || analysisResolution == null) {
    return false;
  }
  return (
    rasterResolution === analysisResolution
    && scopesEligibleForAnalysis(analysis).includes(rasterScope)
  );
}

export interface RetainedRasterSelection {
  layers: CatalogRaster[];
  /** Selected raster id → id kept after the mask or resolution change. */
  idMap: Map<number, number>;
}

/**
 * Keep selections that still cover the analysis grid. When the chosen variant
 * does not, swap in another extent of the same product at that cell size.
 */
export function retainCompatibleSelection(
  selected: CatalogRaster[],
  catalog: CatalogRaster[],
  scope: RasterScope,
  resolution: number | null,
): RetainedRasterSelection {
  const idMap = new Map<number, number>();
  if (resolution == null) return { layers: [], idMap };

  const familyByVariantId = new Map<number, RasterFamily>();
  for (const family of groupRastersIntoFamilies(catalog)) {
    for (const variant of family.variants) familyByVariantId.set(variant.id, family);
  }

  const covers = (raster: CatalogRaster) =>
    rasterCoversAnalysis(raster.scope, scope, raster.resolution, resolution);

  const direct = selected.filter(covers);
  const seen = new Set(direct.map((raster) => raster.id));
  for (const raster of direct) idMap.set(raster.id, raster.id);

  const layers = [...direct];
  for (const raster of selected) {
    if (covers(raster)) continue;
    const family = familyByVariantId.get(raster.id);
    const replacement = family ? findVariantForSelection(family, scope, resolution) : null;
    if (!replacement || seen.has(replacement.id)) continue;
    layers.push(replacement);
    seen.add(replacement.id);
    idMap.set(raster.id, replacement.id);
  }

  return { layers, idMap };
}

/**
 * Variant at the analysis resolution whose extent can be clipped to `scope`.
 * Prefer the tightest match (native preserve over county over tri-county).
 */
export function findVariantForSelection(
  family: RasterFamily,
  scope: RasterScope,
  resolution: number,
): CatalogRaster | null {
  const eligible = new Set(scopesEligibleForAnalysis(scope));
  const matches = family.variants.filter(
    (raster) =>
      raster.resolution === resolution
      && raster.scope != null
      && eligible.has(raster.scope),
  );
  matches.sort(
    (a, b) => SCOPE_RANK[a.scope as RasterScope] - SCOPE_RANK[b.scope as RasterScope],
  );
  return matches[0] ?? null;
}

export function availabilityByScope(
  family: RasterFamily,
): Array<{ scope: RasterScope; label: string; resolutions: number[] }> {
  return RASTER_SCOPE_OPTIONS.map((option) => {
    const resolutions = [
      ...new Set(
        family.variants
          .filter((raster) => raster.scope === option.value && raster.resolution != null)
          .map((raster) => raster.resolution as number),
      ),
    ].sort((a, b) => a - b);
    return { scope: option.value, label: option.label, resolutions };
  }).filter((entry) => entry.resolutions.length > 0);
}
