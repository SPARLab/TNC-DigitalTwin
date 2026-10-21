// ============================================================================
// mosaicCatalogExpand — turn an imagery-mosaic catalog dataset (one row per
// ImageServer, catalog_tag = imagery_mosaic) into a sidebar service with one
// child row per mosaic variable, e.g. CHELSA "Bio01 · Mean Annual Air Temperature".
//
// Children reuse the multi-layer service plumbing (parentServiceId /
// siblingLayers), so they get pin / eye / activate behaviour for free. Each
// child draws the same ImageServer, locked to its own mosaic item by
// `catalogMeta.mosaicTag` (see tncArcgisLayer.ts).
// ============================================================================

import type { CatalogLayer } from '../types';
import { BIOCLIM_VARIABLES, type BioclimVariable } from '../data/bioclimVariables';

export const IMAGERY_MOSAIC_CATALOG_TAG = 'imagery_mosaic';

export function isImageryMosaicCatalogTag(tag: string | null | undefined): boolean {
  return tag?.trim() === IMAGERY_MOSAIC_CATALOG_TAG;
}

/** True for a mosaic variable row (a child that draws one mosaic item). */
export function isMosaicVariableLayer(layer: CatalogLayer | null | undefined): boolean {
  return !!layer?.catalogMeta?.mosaicTag
    && !!layer.catalogMeta.hasImageServer
    && isImageryMosaicCatalogTag(layer.catalogMeta.catalogTag);
}

/** "bio01" → "Bio01". */
function titledTag(tag: string): string {
  return `${tag.charAt(0).toUpperCase()}${tag.slice(1)}`;
}

/** Row name shown in the sidebar and on pinned layers, e.g. "Bio01 · Mean Annual Air Temperature". */
export function mosaicVariableName(variable: BioclimVariable): string {
  return `${titledTag(variable.tag)} · ${variable.label}`;
}

/**
 * Build the child rows for a mosaic parent. `parent` is the plain catalog row
 * for the mosaic dataset; the children copy its service metadata.
 */
export function expandMosaicVariableChildren(args: {
  parentId: string;
  parent: CatalogLayer;
  variables?: readonly BioclimVariable[];
}): CatalogLayer[] {
  const { parentId, parent, variables = BIOCLIM_VARIABLES } = args;
  const parentMeta = parent.catalogMeta;
  if (!parentMeta) return [];

  const children = variables.map((variable): CatalogLayer => ({
    id: `${parentId}-mosaic-${variable.tag}`,
    name: mosaicVariableName(variable),
    categoryId: parent.categoryId,
    dataSource: parent.dataSource,
    icon: parent.icon,
    catalogMeta: {
      ...parentMeta,
      isMultiLayerService: true,
      parentServiceId: parentId,
      siblingLayers: undefined,
      tableCount: undefined,
      mosaicTag: variable.tag,
      mosaicLabel: variable.label,
      mosaicUnits: variable.units,
    },
  }));

  for (const child of children) {
    if (!child.catalogMeta) continue;
    child.catalogMeta.siblingLayers = children.filter((sibling) => sibling.id !== child.id);
  }
  return children;
}
