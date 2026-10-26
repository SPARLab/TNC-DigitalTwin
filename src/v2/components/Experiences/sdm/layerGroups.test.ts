// Species groups in the layer list, and reading what shows.

import GroupLayer from '@arcgis/core/layers/GroupLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import ArcGISMap from '@arcgis/core/Map';
import { describe, expect, it, vi } from 'vitest';
import type { CompletedRun } from '../types';
import {
  ensureGroup,
  findLayer,
  parentForRun,
  pruneEmptyGroups,
  readLayerVisibility,
  removeLayer,
  resultLayerIds,
  resultTargets,
  speciesGroupId,
} from './layerGroups';

function run(patch: Partial<CompletedRun>): CompletedRun {
  return {
    jobId: 'j1',
    mapServerUrl: 'https://example.test/MapServer',
    title: 'title',
    summary: '',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: null,
    tifUrl: null,
    addedAt: 1,
    outputType: 'Probability',
    kind: 'model',
    species: 'Bobcat (Lynx rufus)',
    speciesKey: 'Lynx rufus',
    ...patch,
  };
}

// The test setup stubs the map classes, so these stand in with the parts that
// group handling uses: a layer collection, and visibility.
vi.mock('@arcgis/core/Map', () => {
  class Layers {
    items: unknown[] = [];
    get length() {
      return this.items.length;
    }
    add(layer: unknown) {
      this.items.push(layer);
    }
    remove(layer: unknown) {
      this.items = this.items.filter((item) => item !== layer);
    }
    find(test: (layer: unknown) => boolean) {
      return this.items.find(test);
    }
    toArray() {
      return [...this.items];
    }
  }
  return {
    default: class FakeMap {
      layers = new Layers();
      add(layer: unknown) {
        this.layers.add(layer);
      }
      remove(layer: unknown) {
        this.layers.remove(layer);
      }
    },
  };
});

vi.mock('@arcgis/core/layers/GroupLayer', () => {
  class Layers {
    items: unknown[] = [];
    get length() {
      return this.items.length;
    }
    add(layer: unknown) {
      this.items.push(layer);
    }
    remove(layer: unknown) {
      this.items = this.items.filter((item) => item !== layer);
    }
    find(test: (layer: unknown) => boolean) {
      return this.items.find(test);
    }
    toArray() {
      return [...this.items];
    }
  }
  return {
    default: class FakeGroup {
      type = 'group';
      visible = true;
      id: string;
      title: string;
      visibilityMode: string;
      layers = new Layers();
      constructor(options: { id: string; title: string; visibilityMode?: string }) {
        this.visibilityMode = options.visibilityMode ?? 'independent';
        this.id = options.id;
        this.title = options.title;
      }
      add(layer: unknown) {
        this.layers.add(layer);
      }
      remove(layer: unknown) {
        this.layers.remove(layer);
      }
    },
  };
});

vi.mock('@arcgis/core/layers/GraphicsLayer', () => ({
  default: class FakeLayer {
    type = 'graphics';
    visible = true;
    id: string;
    title: string;
    constructor(options: { id?: string; title?: string }) {
      this.id = options.id ?? '';
      this.title = options.title ?? '';
    }
  },
}));

const titles = (group: GroupLayer) => group.layers.toArray().map((layer) => layer.title);

describe('layer groups', () => {
  it('nests each kind of result under its species', () => {
    const map = new ArcGISMap();
    const model = parentForRun(map, run({ kind: 'model' })) as GroupLayer;
    const comparison = parentForRun(map, run({ kind: 'comparison' })) as GroupLayer;
    const again = parentForRun(map, run({ kind: 'model', jobId: 'j2' })) as GroupLayer;

    const species = findLayer(map, speciesGroupId('Lynx rufus')) as GroupLayer;
    expect(species.title).toBe('Bobcat (Lynx rufus)');
    expect(titles(species).sort()).toEqual(['Comparisons', 'Model runs']);
    expect(again).toBe(model);
    expect(comparison).not.toBe(model);
    expect(map.layers.length).toBe(1);
  });

  it('shows model runs one at a time, but lets comparisons overlay', () => {
    const map = new ArcGISMap();
    const model = parentForRun(map, run({ kind: 'model' })) as GroupLayer;
    const comparison = parentForRun(map, run({ kind: 'comparison' })) as GroupLayer;
    expect(model.visibilityMode).toBe('exclusive');
    expect(comparison.visibilityMode).toBe('independent');
  });

  it('puts common areas across species in their own group, and other runs on the map', () => {
    const map = new ArcGISMap();
    const multi = parentForRun(map, run({ kind: 'common', species: undefined, speciesKey: undefined }));
    expect((multi as GroupLayer).title).toMatch(/several species/i);
    expect(
      parentForRun(map, run({ kind: undefined, species: undefined, speciesKey: undefined })),
    ).toBe(map);
  });

  it('keeps a group name that a run gave it when the occurrences layer asks for the group', () => {
    const map = new ArcGISMap();
    parentForRun(map, run({}));
    const group = ensureGroup(map, speciesGroupId('Lynx rufus'));
    expect(group.title).toBe('Bobcat (Lynx rufus)');
  });

  it('removes layers at any depth and prunes the groups left empty', () => {
    const map = new ArcGISMap();
    const parent = parentForRun(map, run({}));
    const layer = new GraphicsLayer({ id: 'suitability-result-j1', title: 'x' });
    parent.add(layer);
    removeLayer(map, layer);
    pruneEmptyGroups(map);
    expect(map.layers.length).toBe(0);
  });

  it('counts a layer as showing only when its groups are on too', () => {
    const map = new ArcGISMap();
    const parent = parentForRun(map, run({}));
    const layer = new GraphicsLayer({ id: 'suitability-result-j1' });
    parent.add(layer);
    expect(readLayerVisibility(map).showing.has('suitability-result-j1')).toBe(true);

    (findLayer(map, speciesGroupId('Lynx rufus')) as GroupLayer).visible = false;
    const { showing, switchedOff } = readLayerVisibility(map);
    expect(showing.has('suitability-result-j1')).toBe(false);
    // The run's own checkbox is still on.
    expect(switchedOff.has('suitability-result-j1')).toBe(false);

    layer.visible = false;
    expect(readLayerVisibility(map).switchedOff.has('suitability-result-j1')).toBe(true);
  });
});

describe('common areas that combine species', () => {
  const combined = run({
    jobId: 'x',
    kind: 'common',
    species: undefined,
    speciesKey: undefined,
    inputRuns: [
      { jobId: 'a', title: 'a', species: 'Bobcat (Lynx rufus)', speciesKey: 'Lynx rufus' },
      { jobId: 'b', title: 'b', species: 'Bobcat (Lynx rufus)', speciesKey: 'Lynx rufus' },
      { jobId: 'c', title: 'c', species: 'Gray fox', speciesKey: 'Urocyon cinereoargenteus' },
    ],
  });

  it('is listed under each species, with one entry that draws', () => {
    const map = new ArcGISMap();
    const targets = resultTargets(map, combined);
    expect(targets.map((target) => target.id)).toEqual([
      'suitability-result-x',
      'suitability-result-x@Urocyon cinereoargenteus',
    ]);
    expect(targets.map((target) => target.primary)).toEqual([true, false]);
    expect(targets.every((target) => target.shared)).toBe(true);

    for (const key of ['Lynx rufus', 'Urocyon cinereoargenteus']) {
      const species = findLayer(map, speciesGroupId(key)) as GroupLayer;
      expect(titles(species)).toEqual(['Common areas']);
    }
    expect(resultLayerIds(combined)).toEqual(targets.map((target) => target.id));
  });

  it('keeps a one-species common-areas result to a single entry', () => {
    const single = run({ kind: 'common', species: 'Gray fox', speciesKey: 'Urocyon cinereoargenteus' });
    expect(resultTargets(new ArcGISMap(), single)).toHaveLength(1);
    expect(resultLayerIds(single)).toEqual(['suitability-result-j1']);
  });
});
