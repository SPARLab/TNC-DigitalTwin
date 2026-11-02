// ============================================================================
// ExperienceMap — standalone MapView for an experience workspace.
//
// Adds result MapImageLayers, occurrence points, and raster previews on top
// of the preserve outline. A compact LayerList sits over the map so outputs
// can be toggled without the catalog layer widget.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import Graphic from '@arcgis/core/Graphic';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import LayerList from '@arcgis/core/widgets/LayerList';
import RasterColormapRenderer from '@arcgis/core/renderers/RasterColormapRenderer';
import RasterStretchRenderer from '@arcgis/core/renderers/RasterStretchRenderer';
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { Loader2 } from 'lucide-react';
import { ARCGIS_SERVER_URL } from '../../config/geoprocessing';
import { fetchRasterClassSwatches, type ClassSwatch } from '../../services/rasterClassLabels';
import { resolveMosaicRule } from '../../services/mosaicSelection';
import { fetchRasterHistogram, formatHistogramValue } from '../../services/rasterHistogram';
import { continuousLegend, continuousStretchOptions, stretchLegendFromRenderer, type StretchLegend } from './stretchLegend';
import { CollapsibleSection } from './CollapsibleSection';
import { firstBandStatistics } from '../../services/layerRasterInfo';
import {
  SDM_BINARY_CLASSES,
  SUITABILITY_DISPLAY_SUBLAYER_TITLE,
  suitabilityRampColors,
} from './suitabilityRamp';
import { isTiledImageServerUrl } from '../Map/layers/tncArcgisLayer';
import { runDisplayTitle, runKind, runLegendTitle } from './sdmRuns';
import { SdmDerivedLegend } from './sdm/SdmLegends';
import { hexToRgba, speciesColorFor } from './sdm/speciesColors';
import {
  ensureGroup,
  findLayer,
  layersWithIdPrefix,
  RESULT_LAYER_PREFIX,
  pruneEmptyGroups,
  readLayerVisibility,
  removeLayer,
  resultLayerIds,
  resultTargets,
  speciesGroupId,
  visibilityKey,
} from './sdm/layerGroups';
import { createPreserveOutlineLayer } from '../Monitoring/internal/boundaryOutlineLayer';
import {
  ANALYSIS_EXTENT_BOUNDARIES,
  ANALYSIS_EXTENT_LAYER_ID,
  createAnalysisExtentOutlineLayer,
} from './analysisExtentLayer';
import type { CompletedRun, PointsAction, PreviewAction, RasterScope } from './types';

interface ExperienceMapProps {
  center: [number, number];
  zoom: number;
  token: string | null;
  resultLayers: CompletedRun[];
  /**
   * Every change to the species records so far, oldest first. The map applies
   * the ones it has not seen yet.
   */
  pointsActions: PointsAction[];
  /**
   * Every preview change so far, oldest first. The map applies the ones it has
   * not seen yet, so several changes made in one step are all applied.
   */
  previewActions: PreviewAction[];
  /** When set, show that catalog boundary and fit the map to it. */
  analysisExtent?: RasterScope;
  /**
   * Called when a run's layer is switched on or off in the layer list, so the
   * run's own "On map" state follows the map.
   */
  onResultVisibilityChange?: (jobId: string, visible: boolean) => void;
  /** Each species' record color, so the map and the panels agree. */
  speciesColors?: Record<string, string>;
}

function requireMap(view: MapView): ArcGISMap {
  const map = view.map;
  if (!map) {
    throw new Error('MapView is missing a map');
  }
  return map;
}

function findChildLayer(group: GroupLayer, title: string) {
  return group.layers.find((layer) => layer.title === title) ?? null;
}

const PREVIEW_LAYER_PREFIX = 'experience-preview-';
const OCCURRENCE_LAYER_PREFIX = 'sdm-occurrences-';

interface OccurrenceLegend {
  id: string;
  speciesKey: string;
  color: string;
  count: number;
}

interface ResultLegendSwatch {
  label: string;
  imageData: string;
  contentType: string;
}

interface ResultLegend {
  jobId: string;
  title: string;
  swatches: ResultLegendSwatch[];
}

interface ActivePreview {
  rasterId: number;
  title: string;
  url: string;
  datasetId: number | null;
  mosaicTag: string | null;
  /** Null until the source legend has been read. */
  swatches: ClassSwatch[] | null;
  legendRamp: StretchLegend | null;
  legendLoaded: boolean;
}

function colormapRenderer(swatches: ClassSwatch[]): RasterColormapRenderer {
  return new RasterColormapRenderer({
    colormapInfos: swatches.map((swatch) => ({
      value: swatch.value,
      label: swatch.label,
      color: [swatch.color[0], swatch.color[1], swatch.color[2], 255],
    })),
  });
}

/**
 * A result map service (suitability or SDM) has one sublayer per output. Draw
 * only the colored display raster when the service has one, found by its name.
 * If no sublayer matches (older services publish just the data raster), every
 * sublayer is left as the service defines it.
 */
function showSuitabilityDisplaySublayer(
  layer: MapImageLayer,
  pattern: RegExp = SUITABILITY_DISPLAY_SUBLAYER_TITLE,
): void {
  const sublayers = layer.sublayers?.toArray() ?? [];
  const display = sublayers.filter((sublayer) => pattern.test(sublayer.title ?? ''));
  if (display.length === 0) return;
  for (const sublayer of sublayers) {
    sublayer.visible = display.includes(sublayer);
  }
}

/**
 * Which colored sublayer a run draws. A comparison has two (the difference and
 * the threshold change) and shows the one chosen in the runs panel; every other
 * run has a single display raster.
 */
function displaySublayerPattern(run: CompletedRun): RegExp {
  const kind = runKind(run);
  if (kind === 'comparison') {
    return run.view === 'threshold-change' ? /threshold change display/i : /difference display/i;
  }
  if (kind === 'common') return /count display/i;
  return SUITABILITY_DISPLAY_SUBLAYER_TITLE;
}

export function ExperienceMap({
  center,
  zoom,
  token,
  resultLayers,
  pointsActions,
  previewActions,
  analysisExtent,
  onResultVisibilityChange,
  speciesColors = {},
}: ExperienceMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const layerListHostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const previewLayersRef = useRef(new Map<string, ImageryLayer | ImageryTileLayer>());
  const stretchedPreviewIdsRef = useRef(new Set<string>());
  const appliedPreviewCountRef = useRef(0);
  const appliedPointsCountRef = useRef(0);
  const speciesColorsRef = useRef(new Map<string, number>());
  const [occurrences, setOccurrences] = useState<OccurrenceLegend[]>([]);
  const tokenRegisteredRef = useRef(false);
  const managesAnalysisExtentRef = useRef(analysisExtent != null);
  const [isReady, setIsReady] = useState(false);
  const [previews, setPreviews] = useState<ActivePreview[]>([]);
  const [resultLegends, setResultLegends] = useState<ResultLegend[]>([]);
  // Ids of the layers showing on the map, so the legend lists only those.
  const [showingKey, setShowingKey] = useState('');
  const refreshVisibilityRef = useRef<() => void>(() => {});
  const resultLayersRef = useRef(resultLayers);
  resultLayersRef.current = resultLayers;
  const onVisibilityChangeRef = useRef(onResultVisibilityChange);
  onVisibilityChangeRef.current = onResultVisibilityChange;

  useEffect(() => {
    if (token && !tokenRegisteredRef.current) {
      IdentityManager.registerToken({
        server: `${ARCGIS_SERVER_URL}/rest/services`,
        token,
      });
      tokenRegisteredRef.current = true;
    }
  }, [token]);

  useEffect(() => {
    if (!mapDivRef.current) return;

    const view = new MapView({
      container: mapDivRef.current,
      map: new ArcGISMap({ basemap: 'satellite' }),
      center,
      zoom,
      ui: { components: ['zoom', 'attribution'] },
    });

    if (!managesAnalysisExtentRef.current) {
      const outline = createPreserveOutlineLayer();
      outline.legendEnabled = false;
      requireMap(view).add(outline);
    }
    viewRef.current = view;

    let isCancelled = false;
    let layerList: LayerList | null = null;

    view.when(() => {
      if (isCancelled) return;
      if (view.popup) view.popup.dockEnabled = false;
      setIsReady(true);

      const host = layerListHostRef.current;
      if (host) {
        const container = document.createElement('div');
        host.replaceChildren(container);
        layerList = new LayerList({
          view,
          container,
        });
      }
    });

    return () => {
      isCancelled = true;
      layerList?.destroy();
      layerListHostRef.current?.replaceChildren();
      previewLayersRef.current.clear();
      view.destroy();
      viewRef.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isReady || !analysisExtent) return;

    let isCancelled = false;
    const map = requireMap(view);
    const existing = map.findLayerById(ANALYSIS_EXTENT_LAYER_ID);
    if (existing) map.remove(existing);

    const layer = createAnalysisExtentOutlineLayer(analysisExtent);
    layer.legendEnabled = true;
    map.add(layer);

    void (async () => {
      try {
        await layer.load();
        if (isCancelled) return;
        const { extent } = await layer.queryExtent();
        if (isCancelled || !extent) return;
        await view.goTo(extent.expand(1.12), { duration: 800 });
      } catch {
        // The outline can still render even if the camera cannot fit it.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [analysisExtent, isReady]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isReady) return;

    const map = requireMap(view);
    const prefix = RESULT_LAYER_PREFIX;
    const wanted = new Set(resultLayers.flatMap(resultLayerIds));

    layersWithIdPrefix(map, prefix)
      .filter((layer) => !wanted.has(layer.id))
      .forEach((layer) => removeLayer(map, layer));

    let cancelled = false;
    for (const run of resultLayers) {
      for (const { id, parent, shared, primary } of resultTargets(map, run)) {
        // Inside its species group the species is the heading, so a run is named
        // by what sets it apart. On its own it keeps the full name.
        const name = parent === map ? runLegendTitle(run) : runDisplayTitle(run);
        const title = shared ? `${name} · shared` : name;
        // A result listed under several species is drawn once. The other
        // entries stay clear so the same cells are not painted twice.
        const opacity = primary ? 0.75 : 0;
        const existing = findLayer(map, id);
        if (existing) {
          existing.visible = run.visible;
          existing.title = title;
          existing.opacity = opacity;
          if (existing instanceof MapImageLayer) {
            void existing.load().then(() => {
              existing.sublayers?.forEach((sublayer) => {
                sublayer.listMode = 'hide';
              });
              showSuitabilityDisplaySublayer(existing, displaySublayerPattern(run));
            }).catch(() => {
              // Keep the layer-list row even if the result map image is unavailable.
            });
          }
          continue;
        }
        const layer = new MapImageLayer({
          id,
          url: `${run.mapServerUrl}/jobs/${run.jobId}`,
          title,
          opacity,
          visible: run.visible,
          imageFormat: 'png32',
        });
        parent.add(layer);
        layer.load().then(() => {
          layer.sublayers?.forEach((sublayer) => {
            sublayer.listMode = 'hide';
          });
          showSuitabilityDisplaySublayer(layer, displaySublayerPattern(run));
          if (cancelled || !run.visible || !primary) return undefined;
          const extent = layer.fullExtent;
          if (extent) return view.goTo(extent.expand(1.2));
          return undefined;
        }).catch(() => {
          // The list entry can exist while the result map service image fails.
        });
      }
    }
    pruneEmptyGroups(map);
    refreshVisibilityRef.current();
    return () => {
      cancelled = true;
    };
  }, [isReady, resultLayers]);

  useEffect(() => {
    let cancelled = false;
    const runs = resultLayers;
    if (runs.length === 0) {
      setResultLegends([]);
      return undefined;
    }
    Promise.all(runs.map(async (run): Promise<ResultLegend> => {
      // Suitability and SDM results are color-table rasters, so the service
      // legend would list every color level. They get a ramp or classes instead.
      if (run.record || run.outputType || run.kind) {
        return { jobId: run.jobId, title: runLegendTitle(run), swatches: [] };
      }
      try {
        const response = await fetch(`${run.mapServerUrl}/jobs/${run.jobId}/legend?f=json`);
        if (!response.ok) return { jobId: run.jobId, title: runLegendTitle(run), swatches: [] };
        const payload = await response.json() as {
          layers?: Array<{
            legend?: Array<{ label?: string; imageData?: string; contentType?: string }>;
          }>;
        };
        const swatches = (payload.layers ?? []).flatMap((layer) =>
          (layer.legend ?? []).flatMap((entry) => {
            if (!entry.imageData) return [];
            return [{
              label: entry.label ?? '',
              imageData: entry.imageData,
              contentType: entry.contentType || 'image/png',
            }];
          }),
        );
        return { jobId: run.jobId, title: runLegendTitle(run), swatches };
      } catch {
        return { jobId: run.jobId, title: runLegendTitle(run), swatches: [] };
      }
    })).then((legends) => {
      if (!cancelled) setResultLegends(legends);
    });
    return () => {
      cancelled = true;
    };
  }, [resultLayers]);

  // Follow what is switched on in the layer list, and tell the workspace when a
  // run's own checkbox changes so "On map" and the legend stay with the map.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isReady) return undefined;
    const map = requireMap(view);
    const lastSwitchedOff = new Map<string, boolean>();

    const refresh = () => {
      const { showing, switchedOff } = readLayerVisibility(map);
      setShowingKey([...showing].sort().join('\n'));

      for (const run of resultLayersRef.current) {
        // A result shared by several species has a layer under each of them.
        for (const id of resultLayerIds(run)) {
          if (!findLayer(map, id)) {
            lastSwitchedOff.delete(id);
            continue;
          }
          const off = switchedOff.has(id);
          const previous = lastSwitchedOff.get(id);
          lastSwitchedOff.set(id, off);
          // Only a change made on the map is passed on, not the map following the run.
          if (previous !== undefined && previous !== off && run.visible === off) {
            onVisibilityChangeRef.current?.(run.jobId, !off);
          }
        }
      }
    };
    refreshVisibilityRef.current = refresh;

    const watchHandle = reactiveUtils.watch(() => visibilityKey(map), refresh, { initial: true });
    const listHandle = map.allLayers.on('change', refresh);
    return () => {
      watchHandle.remove();
      listHandle.remove();
      refreshVisibilityRef.current = () => {};
    };
  }, [isReady]);

  const applyPointsAction = (view: MapView, pointsAction: PointsAction) => {
    const childTitle = 'Occurrences';
    const map = requireMap(view);
    const speciesKey = pointsAction.species;

    if (pointsAction.action === 'hide') {
      // The species has runs, so its records stay in the layer list, switched off.
      const group = findLayer(map, speciesGroupId(pointsAction.species)) as GroupLayer | undefined;
      const existing = group ? findChildLayer(group, childTitle) : undefined;
      if (existing) existing.visible = false;
      refreshVisibilityRef.current();
      return;
    }

    if (pointsAction.action === 'remove') {
      const group = findLayer(map, speciesGroupId(pointsAction.species)) as GroupLayer | undefined;
      if (!group) return;
      const existing = findChildLayer(group, childTitle);
      if (existing) group.remove(existing);
      pruneEmptyGroups(map);
      setOccurrences((current) => current.filter((item) => item.speciesKey !== speciesKey));
      return;
    }

    // The species group may already hold runs, which have given it a display
    // name. Only a new group is named after the scientific name.
    const groupId = speciesGroupId(pointsAction.species);
    const group = ensureGroup(map, groupId, findLayer(map, groupId) ? undefined : pointsAction.species);
    const existing = findChildLayer(group, childTitle);
    if (existing) group.remove(existing);

    const graphics: Graphic[] = [];
    let objectId = 0;
    for (const feature of pointsAction.features ?? []) {
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates) continue;
      const [longitude, latitude] = coordinates;
      graphics.push(
        new Graphic({
          geometry: { type: 'point', longitude, latitude },
          attributes: {
            ObjectID: objectId++,
            species: feature.properties?.species ?? '',
            eventdate: feature.properties?.eventdate
              ? new Date(feature.properties.eventdate).getTime()
              : null,
            basisofrecord: feature.properties?.basisofrecord ?? '',
            occurrence_status: feature.properties?.occurrence_status ?? '',
            taxonomic_class: feature.properties?.taxonomic_class ?? '',
            longitude,
            latitude,
          },
        }),
      );
    }

    if (graphics.length === 0) return;

    // Each species keeps its own color, so several can share the map.
    const color = speciesColors[speciesKey] ?? speciesColorFor(speciesColorsRef.current, speciesKey);
    const layerId = `${OCCURRENCE_LAYER_PREFIX}${speciesKey}`;
    const layer = new FeatureLayer({
      id: layerId,
      title: childTitle,
      source: graphics,
      objectIdField: 'ObjectID',
      geometryType: 'point',
      spatialReference: { wkid: 4326 },
      fields: [
        { name: 'ObjectID', type: 'oid' },
        { name: 'species', type: 'string' },
        { name: 'eventdate', type: 'date' },
        { name: 'basisofrecord', type: 'string' },
        { name: 'occurrence_status', type: 'string' },
        { name: 'taxonomic_class', type: 'string' },
        { name: 'longitude', type: 'double' },
        { name: 'latitude', type: 'double' },
      ],
      popupTemplate: {
        title: '{species}',
        content: [
          {
            type: 'fields',
            fieldInfos: [
              { fieldName: 'species', label: 'Species' },
              { fieldName: 'eventdate', label: 'Date', format: { dateFormat: 'short-date' } },
              { fieldName: 'basisofrecord', label: 'Basis of Record' },
              { fieldName: 'longitude', label: 'Longitude', format: { places: 5 } },
              { fieldName: 'latitude', label: 'Latitude', format: { places: 5 } },
            ],
          },
        ],
      },
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: hexToRgba(color, 0.78),
          size: 6,
          outline: { color: [255, 255, 255, 220], width: 0.75 },
        },
      },
    });

    group.add(layer);
    setOccurrences((current) => [
      ...current.filter((item) => item.speciesKey !== speciesKey),
      { id: layerId, speciesKey, color, count: graphics.length },
    ]);
    refreshVisibilityRef.current();
  };

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isReady) return;
    const pending = pointsActions.slice(appliedPointsCountRef.current);
    appliedPointsCountRef.current = pointsActions.length;
    for (const action of pending) applyPointsAction(view, action);
  }, [isReady, pointsActions]);

  useEffect(() => {
    const pending = previewActions.slice(appliedPreviewCountRef.current);
    appliedPreviewCountRef.current = previewActions.length;

    for (const previewAction of pending) {
      if (previewAction.action === 'remove') {
        setPreviews((current) =>
          current.filter((preview) => preview.rasterId !== previewAction.rasterId),
        );
        continue;
      }
      if (!previewAction.url) continue;

      const rasterId = previewAction.rasterId;
      const url = previewAction.url;
      const datasetId = previewAction.datasetId ?? null;
      const mosaicTag = previewAction.mosaicTag ?? null;
      setPreviews((current) => {
        if (current.some((preview) => preview.rasterId === rasterId)) return current;
        return [
          ...current,
          {
            rasterId,
            title: previewAction.title || 'Preview',
            url,
            datasetId,
            mosaicTag,
            swatches: null,
            legendRamp: null,
            legendLoaded: false,
          },
        ];
      });

      fetchRasterClassSwatches({ rasterUrl: url, datasetId, token })
        .then((swatches) => {
          setPreviews((current) =>
            current.map((preview) =>
              preview.rasterId === rasterId
                ? { ...preview, swatches, legendLoaded: true }
                : preview,
            ),
          );
        })
        .catch(() => {
          setPreviews((current) =>
            current.map((preview) =>
              preview.rasterId === rasterId ? { ...preview, legendLoaded: true } : preview,
            ),
          );
        });
    }
  }, [previewActions, token]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isReady) return;
    const map = requireMap(view);

    const stretchPreviewToItem = (imagery: ImageryLayer, mosaicTag: string, key: string, rasterId: number) => {
      const expected = continuousLegend(0, 1).colors;
      const applied = stretchLegendFromRenderer(imagery.renderer);
      const locked = imagery.mosaicRule?.method === 'lock-raster';
      if (
        stretchedPreviewIdsRef.current.has(key)
        && locked
        && applied?.colors[0] === expected[0]
        && applied?.colors[1] === expected[1]
      ) {
        return;
      }
      stretchedPreviewIdsRef.current.add(key);
      const serviceUrl = imagery.url;
      if (!serviceUrl) return;

      resolveMosaicRule({ rasterUrl: serviceUrl, tag: mosaicTag, token })
        .then((rule) => {
          if (previewLayersRef.current.get(key) !== imagery) return;
          if (rule) imagery.mosaicRule = rule;
          return fetchRasterHistogram({
            url: serviceUrl,
            extent: 'full',
            scope: analysisExtent ?? 'preserve',
            resolutionMeters: null,
            categorical: false,
            mosaicTag,
            token,
          });
        })
        .then((histogram) => {
          if (!histogram) return;
          if (previewLayersRef.current.get(key) !== imagery) return;
          const occupied = histogram.bins.filter((bin) => bin.count > 0);
          const min = occupied[0]?.min;
          const max = occupied[occupied.length - 1]?.max;
          if (min == null || max == null || !(max > min)) return;
          imagery.renderer = new RasterStretchRenderer(continuousStretchOptions(min, max));
          const ramp = continuousLegend(min, max);
          setPreviews((currentPreviews) => {
            const existing = currentPreviews.find((item) => item.rasterId === rasterId)?.legendRamp;
            if (
              existing
              && existing.min === ramp.min
              && existing.max === ramp.max
              && existing.colors[0] === ramp.colors[0]
              && existing.colors[1] === ramp.colors[1]
            ) {
              return currentPreviews;
            }
            return currentPreviews.map((item) =>
              item.rasterId === rasterId ? { ...item, legendRamp: ramp, legendLoaded: true } : item,
            );
          });
        })
        .catch(() => {
          stretchedPreviewIdsRef.current.delete(key);
        });
    };
    const desired = new Set(previews.map((preview) => String(preview.rasterId)));

    for (const [key, layer] of previewLayersRef.current) {
      if (desired.has(key)) continue;
      map.remove(layer);
      previewLayersRef.current.delete(key);
      stretchedPreviewIdsRef.current.delete(key);
    }

    for (const preview of previews) {
      const key = String(preview.rasterId);
      let layer = previewLayersRef.current.get(key);
      if (!layer) {
        const layerOptions = {
          id: `${PREVIEW_LAYER_PREFIX}${key}`,
          url: preview.url,
          title: preview.title,
          opacity: 0.85,
          listMode: 'show' as const,
          legendEnabled: true,
          // Coarse analysis grids should keep hard cell edges.
          interpolation: 'nearest' as const,
        };
        // A const, so the closures below keep the non-undefined type.
        const created = isTiledImageServerUrl(preview.url)
          ? new ImageryTileLayer(layerOptions)
          : new ImageryLayer(layerOptions);
        layer = created;
        map.add(created);
        previewLayersRef.current.set(key, created);
        const publishRamp = () => {
          const band = firstBandStatistics(created);
          const ramp = stretchLegendFromRenderer(created.renderer, band);
          if (!ramp) return false;
          setPreviews((current) =>
            current.map((item) =>
              item.rasterId === preview.rasterId
                ? { ...item, legendRamp: ramp, legendLoaded: true }
                : item,
            ),
          );
          return true;
        };
        created.when(() => {
          if (previewLayersRef.current.get(key) !== created) return;
          if (created.fullExtent) view.goTo(created.fullExtent.expand(1.1)).catch(() => {});
          if (preview.mosaicTag && created.type === 'imagery') {
            stretchPreviewToItem(created, preview.mosaicTag, key, preview.rasterId);
            return;
          }
          if (publishRamp()) return;
          const handle = created.watch('renderer', () => {
            if (publishRamp()) handle.remove();
          });
        });
      } else if (preview.mosaicTag && layer.type === 'imagery') {
        stretchPreviewToItem(layer, preview.mosaicTag, key, preview.rasterId);
      } else if (!preview.legendRamp) {
        const band = firstBandStatistics(layer);
        const ramp = stretchLegendFromRenderer(layer.renderer, band);
        if (ramp) {
          setPreviews((current) =>
            current.map((item) =>
              item.rasterId === preview.rasterId
                ? { ...item, legendRamp: ramp, legendLoaded: true }
                : item,
            ),
          );
        }
      }
      const swatches = preview.swatches;
      if (swatches?.length) {
        // A renderer assigned before the layer finishes loading is discarded
        // by the SDK, which leaves the service's own unique-value colors on
        // the map (they differ from the legend). Wait for the load.
        const applyClassColors = () => {
          if (previewLayersRef.current.get(key) !== layer) return;
          if (layer.renderer?.type !== 'raster-colormap') {
            layer.renderer = colormapRenderer(swatches);
          }
        };
        if (layer.loaded) applyClassColors();
        else layer.when(applyClassColors).catch(() => {});
      }
    }
  }, [analysisExtent, isReady, previews, token]);

  // The legend lists what shows on the map: layers that are on, inside groups
  // that are on. Switching a layer or its group off in the layer list removes it.
  const showingIds = useMemo(() => new Set(showingKey.split('\n')), [showingKey]);
  const visibleResultLegends = resultLegends.filter((legend) => {
    const run = resultLayers.find((item) => item.jobId === legend.jobId);
    return Boolean(
      run
        && resultLayerIds(run).some((id) => showingIds.has(id))
        && (run.record || run.outputType || run.kind || legend.swatches.length > 0),
    );
  });
  const visiblePreviews = previews.filter((preview) =>
    showingIds.has(`${PREVIEW_LAYER_PREFIX}${preview.rasterId}`),
  );
  const visibleOccurrences = occurrences.filter((item) => showingIds.has(item.id));
  const occurrenceLabel = (speciesKey: string) =>
    resultLayers.find((run) => run.speciesKey === speciesKey)?.species ?? speciesKey;
  const showAnalysisExtentLegend = Boolean(analysisExtent)
    && (!showingKey || showingIds.has(ANALYSIS_EXTENT_LAYER_ID));
  const suitabilityRampColorList = suitabilityRampColors();

  return (
    <div id="experience-map-area" className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-gray-100">
      <div ref={mapDivRef} className="absolute inset-0" />

      <CollapsibleSection
        id="experience-layer-list"
        variant="card"
        title="Layers"
        keepMounted
        className="absolute right-3 top-3 z-10 max-h-[calc(100%-1.5rem)] w-72 bg-white/95 shadow-lg"
        bodyClassName="!px-0 !py-0 flex flex-col"
      >
        <ul className={previews.length > 0 ? 'border-b border-gray-100 px-3 py-2' : 'hidden'}>
          {previews.map((preview) => (
            <li key={preview.rasterId} className="truncate py-1 text-sm text-gray-800">
              {preview.title}
            </li>
          ))}
        </ul>
        <div ref={layerListHostRef} className="max-h-64 min-h-0 overflow-y-auto" />
      </CollapsibleSection>

      <CollapsibleSection
        id="experience-legend"
        variant="card"
        title="Legend"
        className="absolute bottom-8 left-3 z-10 max-h-[45%] w-72 bg-white/95 shadow-lg"
        bodyClassName="overflow-y-auto"
      >
        <div>
          {visiblePreviews.length === 0
            && visibleOccurrences.length === 0
            && !visibleResultLegends.length
            && !showAnalysisExtentLegend && (
            <p className="py-2 text-sm text-gray-500">Preview a layer to see its legend.</p>
          )}
          {visibleResultLegends.map((legend) => {
            const legendRun = resultLayers.find((item) => item.jobId === legend.jobId);
            const scaleMax = legendRun?.record?.scaleMax;
            const derivedKind = legendRun ? runKind(legendRun) : null;
            // Comparisons also record an output type, but they have their own legend.
            const sdmOutputType = derivedKind === 'model' ? legendRun?.outputType ?? null : null;
            return (
            <section key={legend.jobId} className="mb-3 last:mb-0">
              <h4 className="mb-1.5 break-words text-sm font-semibold text-gray-900">{legend.title}</h4>
              {scaleMax != null && (
                <div className="flex items-stretch gap-2">
                  <div
                    className="h-28 w-4 flex-shrink-0 rounded-sm border border-black/10"
                    style={{ background: `linear-gradient(to top, ${suitabilityRampColorList.join(', ')})` }}
                  />
                  <div className="flex flex-col justify-between py-0.5 text-xs text-gray-600">
                    <span>{scaleMax} (high suitability)</span>
                    <span>1 (low suitability)</span>
                  </div>
                </div>
              )}
              {sdmOutputType === 'Probability' && (
                <div className="flex items-stretch gap-2">
                  <div
                    className="h-28 w-4 flex-shrink-0 rounded-sm border border-black/10"
                    style={{ background: `linear-gradient(to top, ${suitabilityRampColorList.join(', ')})` }}
                  />
                  <div className="flex flex-col justify-between py-0.5 text-xs text-gray-600">
                    <span>1 (high probability)</span>
                    <span>0 (low probability)</span>
                  </div>
                </div>
              )}
              {legendRun && (derivedKind === 'comparison' || derivedKind === 'common') && (
                <SdmDerivedLegend run={legendRun} kind={derivedKind} />
              )}
              {sdmOutputType === 'Binary' && (
                <ul className="flex flex-col gap-1">
                  {SDM_BINARY_CLASSES.map((entry) => (
                    <li key={entry.label} className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-6 flex-shrink-0 rounded-sm border border-black/10"
                        style={{ background: entry.color }}
                      />
                      <span className="text-sm text-gray-700">{entry.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              {scaleMax == null && sdmOutputType == null && legend.swatches.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {legend.swatches.map((swatch) => (
                    <li key={`${swatch.label}-${swatch.imageData.slice(0, 12)}`} className="flex items-center gap-2">
                      <img
                        src={`data:${swatch.contentType};base64,${swatch.imageData}`}
                        alt=""
                        className="h-4 w-6 flex-shrink-0 object-contain"
                      />
                      <span className="break-words text-sm text-gray-700">{swatch.label}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            );
          })}
          {visibleOccurrences.map((item) => (
            <section key={item.id} className="mb-3 last:mb-0">
              <h4 className="mb-1.5 break-words text-sm font-semibold text-gray-900">
                {occurrenceLabel(item.speciesKey)}
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3.5 w-3.5 flex-shrink-0 rounded-full border border-white"
                  style={{ background: item.color }}
                />
                <span className="text-sm text-gray-700">
                  Occurrence records ({item.count.toLocaleString()})
                </span>
              </div>
            </section>
          ))}
          {analysisExtent && showAnalysisExtentLegend && (
            <section className="mb-3 last:mb-0">
              <h4 className="mb-1.5 break-words text-sm font-semibold text-gray-900">
                {ANALYSIS_EXTENT_BOUNDARIES[analysisExtent].title}
              </h4>
              <div className="flex items-center gap-2">
                <span className="inline-block h-4 w-8 flex-shrink-0 rounded-sm border-2 border-white bg-gray-600" />
                <span className="text-sm text-gray-700">Analysis extent</span>
              </div>
            </section>
          )}
          {visiblePreviews.map((preview) => (
            <section key={preview.rasterId} className="mb-3 last:mb-0">
              <h4 className="mb-1.5 break-words text-sm font-semibold text-gray-900">{preview.title}</h4>
              {preview.swatches?.length ? (
                <ul className="flex flex-col gap-1">
                  {preview.swatches.map((swatch) => (
                    <li key={swatch.value} className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 flex-shrink-0 rounded-sm border border-black/10"
                        style={{ backgroundColor: `rgb(${swatch.color[0]}, ${swatch.color[1]}, ${swatch.color[2]})` }}
                      />
                      <span className="break-words text-sm text-gray-700">{swatch.label}</span>
                    </li>
                  ))}
                </ul>
              ) : preview.legendRamp ? (
                <div className="flex items-stretch gap-2">
                  <div
                    className="h-28 w-4 flex-shrink-0 rounded-sm border border-black/10"
                    style={{
                      background: `linear-gradient(to top, ${preview.legendRamp.colors.join(', ')})`,
                    }}
                  />
                  <div className="flex flex-col justify-between py-0.5 text-xs text-gray-600">
                    <span>{formatHistogramValue(preview.legendRamp.max)}</span>
                    <span>{formatHistogramValue(preview.legendRamp.min)}</span>
                  </div>
                </div>
              ) : !preview.legendLoaded ? (
                <p className="text-sm text-gray-500">Loading legend…</p>
              ) : (
                <p className="text-sm text-gray-500">Continuous values</p>
              )}
            </section>
          ))}
        </div>
      </CollapsibleSection>

      {!isReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading map
          </div>
        </div>
      )}
    </div>
  );
}
