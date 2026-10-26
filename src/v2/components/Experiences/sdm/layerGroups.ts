// ============================================================================
// Layer groups for SDM results.
//
// The layer list nests everything about a species under one group:
//
//   Bobcat (Lynx rufus)
//     Occurrences
//     Model runs
//     Comparisons
//     Common areas
//
// Common-area results that combine several species sit in their own group, and
// results that are not SDM runs stay at the top level.
//
// This file also reads which layers are really showing, which is what the
// legend follows.
// ============================================================================

import type ArcGISMap from '@arcgis/core/Map';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import type Layer from '@arcgis/core/layers/Layer';
import { combinedSpecies, runKind, runSpeciesKey, runSpeciesLabel } from '../sdmRuns';
import type { CompletedRun, SdmRunKind } from '../types';

export type LayerParent = ArcGISMap | GroupLayer;

/** Every result layer's id starts with this, followed by the run's job id. */
export const RESULT_LAYER_PREFIX = 'suitability-result-';

/** Every group this file makes has an id with this prefix, so it can tell them apart. */
const GROUP_PREFIX = 'sdm-group-';

export const MULTI_SPECIES_GROUP_ID = `${GROUP_PREFIX}common-multi`;
export const MULTI_SPECIES_GROUP_TITLE = 'Common areas (several species)';

export const SECTION_TITLES: Record<SdmRunKind, string> = {
  model: 'Model runs',
  comparison: 'Comparisons',
  common: 'Common areas',
};

export function speciesGroupId(speciesKey: string): string {
  return `${GROUP_PREFIX}species-${speciesKey}`;
}

function sectionGroupId(speciesKey: string, kind: SdmRunKind): string {
  return `${GROUP_PREFIX}${kind}-${speciesKey}`;
}

/**
 * The group with this id under the parent, made when missing. A title is only
 * written when given, so the occurrences layer can create a species group
 * without clobbering the display label a later run gives it.
 */
export function ensureGroup(
  parent: LayerParent,
  id: string,
  title?: string,
  visibilityMode: GroupLayer['visibilityMode'] = 'independent',
): GroupLayer {
  const existing = parent.layers.find((layer) => layer.id === id) as GroupLayer | undefined;
  if (existing) {
    if (title && existing.title !== title) existing.title = title;
    return existing;
  }
  const group = new GroupLayer({ id, title: title ?? id, visibilityMode });
  parent.add(group);
  return group;
}

/** The group that holds this run's layer: its species, then its kind of result. */
export function parentForRun(map: ArcGISMap, run: CompletedRun): LayerParent {
  const kind = runKind(run);
  if (!kind) return map;

  const key = runSpeciesKey(run);
  if (!key) {
    return kind === 'common'
      ? ensureGroup(map, MULTI_SPECIES_GROUP_ID, MULTI_SPECIES_GROUP_TITLE)
      : map;
  }

  return parentForSpecies(map, key, runSpeciesLabel(run) ?? key, kind);
}

function parentForSpecies(
  map: ArcGISMap,
  key: string,
  label: string,
  kind: SdmRunKind,
): LayerParent {
  const species = ensureGroup(map, speciesGroupId(key), label);
  // Model runs show one at a time. Comparisons and common areas can overlay.
  return ensureGroup(
    species,
    sectionGroupId(key, kind),
    SECTION_TITLES[kind],
    kind === 'model' ? 'exclusive' : 'independent',
  );
}

export interface ResultTarget {
  /** The id of the layer that shows this run in this group. */
  id: string;
  parent: LayerParent;
  /** One of several layers for the same result, one per species it combines. */
  shared: boolean;
  /** The layer that draws. The others of a shared result are kept clear. */
  primary: boolean;
}

/**
 * Where a run's layer goes. A common-areas result that combines several species
 * is listed under each of them, so it is found from any species' group. Every
 * other run has one place.
 */
export function resultTargets(map: ArcGISMap, run: CompletedRun): ResultTarget[] {
  const base = `${RESULT_LAYER_PREFIX}${run.jobId}`;
  const species = runKind(run) === 'common' && !runSpeciesKey(run) ? combinedSpecies(run) : [];
  if (species.length < 2) {
    return [{ id: base, parent: parentForRun(map, run), shared: false, primary: true }];
  }
  return species.map(({ key, label }, index) => ({
    id: index === 0 ? base : `${base}@${key}`,
    parent: parentForSpecies(map, key, label, 'common'),
    shared: true,
    primary: index === 0,
  }));
}

/** Ids of every layer that shows this run, without making any groups. */
export function resultLayerIds(run: CompletedRun): string[] {
  const base = `${RESULT_LAYER_PREFIX}${run.jobId}`;
  const species = runKind(run) === 'common' && !runSpeciesKey(run) ? combinedSpecies(run) : [];
  if (species.length < 2) return [base];
  return species.map(({ key }, index) => (index === 0 ? base : `${base}@${key}`));
}

/** Every layer and group under the map, at any depth. */
function allLayers(layers: Layer[]): Layer[] {
  const found: Layer[] = [];
  for (const layer of layers) {
    found.push(layer);
    if (layer.type === 'group') found.push(...allLayers((layer as GroupLayer).layers.toArray()));
  }
  return found;
}

export function findLayer(map: ArcGISMap, id: string): Layer | undefined {
  return allLayers(map.layers.toArray()).find((layer) => layer.id === id);
}

export function layersWithIdPrefix(map: ArcGISMap, prefix: string): Layer[] {
  return allLayers(map.layers.toArray()).filter((layer) => layer.id?.startsWith(prefix));
}

function parentOf(map: ArcGISMap, target: Layer): LayerParent | null {
  const search = (parent: LayerParent): LayerParent | null => {
    for (const layer of parent.layers.toArray()) {
      if (layer === target) return parent;
      if (layer.type === 'group') {
        const inner = search(layer as GroupLayer);
        if (inner) return inner;
      }
    }
    return null;
  };
  return search(map);
}

export function removeLayer(map: ArcGISMap, layer: Layer): void {
  parentOf(map, layer)?.remove(layer);
}

/** Remove the groups this file made that have nothing left in them. */
export function pruneEmptyGroups(map: ArcGISMap): void {
  for (let pass = 0; pass < 4; pass += 1) {
    const empty = layersWithIdPrefix(map, GROUP_PREFIX).filter(
      (layer) => layer.type === 'group' && (layer as GroupLayer).layers.length === 0,
    );
    if (empty.length === 0) return;
    empty.forEach((layer) => removeLayer(map, layer));
  }
}

export interface LayerVisibility {
  /** Ids of layers that show: on themselves, and inside groups that are on. */
  showing: Set<string>;
  /** Ids of layers whose own checkbox is off, wherever they sit. */
  switchedOff: Set<string>;
}

export function readLayerVisibility(map: ArcGISMap): LayerVisibility {
  const showing = new Set<string>();
  const switchedOff = new Set<string>();
  const walk = (layers: Layer[], parentShowing: boolean) => {
    for (const layer of layers) {
      if (!layer.visible) switchedOff.add(layer.id);
      const isShowing = parentShowing && layer.visible;
      if (isShowing) showing.add(layer.id);
      if (layer.type === 'group') walk((layer as GroupLayer).layers.toArray(), isShowing);
    }
  };
  walk(map.layers.toArray(), true);
  return { showing, switchedOff };
}

/**
 * A string that changes whenever what shows changes, for the map's watcher to
 * compare. Reading the layers inside it is what makes the watcher track them.
 */
export function visibilityKey(map: ArcGISMap): string {
  const { showing, switchedOff } = readLayerVisibility(map);
  return `${[...showing].sort().join('\n')}\u0000${[...switchedOff].sort().join('\n')}`;
}
