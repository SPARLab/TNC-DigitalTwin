// ============================================================================
// ExperienceMap — standalone MapView for an experience workspace.
//
// Adds result MapImageLayers, occurrence points, and raster previews on top
// of the preserve outline. A compact LayerList sits over the map so outputs
// can be toggled without the catalog layer widget.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import Graphic from '@arcgis/core/Graphic';
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
  pointsAction: PointsAction | null;
  previewAction: PreviewAction | null;
  /** When set, show that catalog boundary and fit the map to it. */
  analysisExtent?: RasterScope;
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
function showSuitabilityDisplaySublayer(layer: MapImageLayer): void {
  const sublayers = layer.sublayers?.toArray() ?? [];
  const display = sublayers.filter((sublayer) =>
    SUITABILITY_DISPLAY_SUBLAYER_TITLE.test(sublayer.title ?? ''),
  );
  if (display.length === 0) return;
  for (const sublayer of sublayers) {
    sublayer.visible = display.includes(sublayer);
  }
}

function getOrCreateGroup(view: MapView, title: string): GroupLayer {
  const map = requireMap(view);
  const existing = map.layers.find(
    (layer) => layer.type === 'group' && layer.title === title,
  ) as GroupLayer | undefined;
  if (existing) return existing;

  const group = new GroupLayer({ title, visibilityMode: 'independent' });
  map.add(group);
  return group;
}

export function ExperienceMap({
  center,
  zoom,
  token,
  resultLayers,
  pointsAction,
  previewAction,
  analysisExtent,
}: ExperienceMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const layerListHostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const previewLayersRef = useRef(new Map<string, ImageryLayer | ImageryTileLayer>());
  const stretchedPreviewIdsRef = useRef(new Set<string>());
  const tokenRegisteredRef = useRef(false);
  const managesAnalysisExtentRef = useRef(analysisExtent != null);
  const [isReady, setIsReady] = useState(false);
  const [previews, setPreviews] = useState<ActivePreview[]>([]);
  const [resultLegends, setResultLegends] = useState<ResultLegend[]>([]);

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
    const prefix = 'suitability-result-';
    const wanted = new Map(resultLayers.map((run) => [`${prefix}${run.jobId}`, run]));

    map.layers
      .filter((layer) => layer.id?.startsWith(prefix) && !wanted.has(layer.id))
      .forEach((layer) => map.remove(layer));

    let cancelled = false;
    for (const run of resultLayers) {
      const id = `${prefix}${run.jobId}`;
      const existing = map.layers.find((layer) => layer.id === id);
      if (existing) {
        existing.visible = run.visible;
        existing.title = run.title;
        if (existing instanceof MapImageLayer) {
          void existing.load().then(() => {
            existing.sublayers?.forEach((sublayer) => {
              sublayer.listMode = 'hide';
            });
            showSuitabilityDisplaySublayer(existing);
          }).catch(() => {
            // Keep the layer-list row even if the result map image is unavailable.
          });
        }
        continue;
      }
      const layer = new MapImageLayer({
        id,
        url: `${run.mapServerUrl}/jobs/${run.jobId}`,
        title: run.title,
        opacity: 0.75,
        visible: run.visible,
        imageFormat: 'png32',
      });
      map.add(layer);
      layer.load().then(() => {
        layer.sublayers?.forEach((sublayer) => {
          sublayer.listMode = 'hide';
        });
        showSuitabilityDisplaySublayer(layer);
        if (cancelled || !run.visible) return undefined;
        const extent = layer.fullExtent;
        if (extent) return view.goTo(extent.expand(1.2));
        return undefined;
      }).catch(() => {
        // The list entry can exist while the result map service image fails.
      });
    }
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
      if (run.record || run.outputType) {
        return { jobId: run.jobId, title: run.title, swatches: [] };
      }
      try {
        const response = await fetch(`${run.mapServerUrl}/jobs/${run.jobId}/legend?f=json`);
        if (!response.ok) return { jobId: run.jobId, title: run.title, swatches: [] };
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
        return { jobId: run.jobId, title: run.title, swatches };
      } catch {
        return { jobId: run.jobId, title: run.title, swatches: [] };
      }
    })).then((legends) => {
      if (!cancelled) setResultLegends(legends);
    });
    return () => {
      cancelled = true;
    };
  }, [resultLayers]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isReady || !pointsAction) return;

    const childTitle = 'Occurrences';
    const map = requireMap(view);

    if (pointsAction.action === 'remove') {
      const group = map.layers.find(
        (layer) => layer.type === 'group' && layer.title === pointsAction.species,
      ) as GroupLayer | undefined;
      if (!group) return;
      const existing = findChildLayer(group, childTitle);
      if (existing) group.remove(existing);
      if (group.layers.length === 0) map.remove(group);
      return;
    }

    const group = getOrCreateGroup(view, pointsAction.species);
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

    const layer = new FeatureLayer({
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
          color: [5, 150, 105, 180],
          size: 6,
          outline: { color: [255, 255, 255, 220], width: 0.75 },
        },
      },
    });

    group.add(layer);
  }, [isReady, pointsAction]);

  useEffect(() => {
    if (!previewAction?.url && previewAction?.action !== 'remove') return;
    if (previewAction.action === 'remove') {
      setPreviews((current) => current.filter((preview) => preview.rasterId !== previewAction.rasterId));
      return;
    }
    if (!previewAction.url) return;

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
  }, [previewAction, token]);

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

  const visibleResultLegends = resultLegends.filter((legend) => {
    const run = resultLayers.find((item) => item.jobId === legend.jobId);
    return Boolean(
      run?.visible && (run.record || run.outputType || legend.swatches.length > 0),
    );
  });
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
          {previews.length === 0 && !visibleResultLegends.length && !analysisExtent && (
            <p className="py-2 text-sm text-gray-500">Preview a layer to see its legend.</p>
          )}
          {visibleResultLegends.map((legend) => {
            const legendRun = resultLayers.find((item) => item.jobId === legend.jobId);
            const scaleMax = legendRun?.record?.scaleMax;
            const sdmOutputType = legendRun?.outputType ?? null;
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
          {analysisExtent && (
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
          {previews.map((preview) => (
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
