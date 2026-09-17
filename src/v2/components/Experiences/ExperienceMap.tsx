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
import IdentityManager from '@arcgis/core/identity/IdentityManager';
import { Loader2 } from 'lucide-react';
import { ARCGIS_SERVER_URL } from '../../config/geoprocessing';
import { isTiledImageServerUrl } from '../Map/layers/tncArcgisLayer';
import { createPreserveOutlineLayer } from '../Monitoring/internal/boundaryOutlineLayer';
import {
  ANALYSIS_EXTENT_LAYER_ID,
  createAnalysisExtentOutlineLayer,
} from './analysisExtentLayer';
import type { PointsAction, PreviewAction, RasterScope, ResultLayerInfo } from './types';

interface ExperienceMapProps {
  center: [number, number];
  zoom: number;
  token: string | null;
  resultLayer: ResultLayerInfo | null;
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
  resultLayer,
  pointsAction,
  previewAction,
  analysisExtent,
}: ExperienceMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const layerListRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const previewLayersRef = useRef(new Map<string, ImageryLayer | ImageryTileLayer>());
  const tokenRegisteredRef = useRef(false);
  const managesAnalysisExtentRef = useRef(analysisExtent != null);
  const [isReady, setIsReady] = useState(false);

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
      requireMap(view).add(createPreserveOutlineLayer());
    }
    viewRef.current = view;

    let isCancelled = false;
    let layerList: LayerList | null = null;

    view.when(() => {
      if (isCancelled) return;
      if (view.popup) view.popup.dockEnabled = false;
      setIsReady(true);

      if (layerListRef.current) {
        layerList = new LayerList({
          view,
          container: layerListRef.current,
        });
      }
    });

    return () => {
      isCancelled = true;
      layerList?.destroy();
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
    if (!view || !isReady || !resultLayer) return;

    const group = getOrCreateGroup(view, resultLayer.groupTitle);
    const existing = findChildLayer(group, resultLayer.title);
    if (existing) group.remove(existing);

    const layer = new MapImageLayer({
      url: `${resultLayer.mapServerUrl}/jobs/${resultLayer.jobId}`,
      title: resultLayer.title,
      opacity: 0.75,
    });
    group.add(layer);
    layer.when(() => {
      if (layer.fullExtent) view.goTo(layer.fullExtent.expand(1.2)).catch(() => {});
    });
  }, [isReady, resultLayer]);

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
    const view = viewRef.current;
    if (!view || !isReady || !previewAction) return;

    const key = String(previewAction.rasterId);
    const map = requireMap(view);

    if (previewAction.action === 'remove') {
      const existing = previewLayersRef.current.get(key);
      if (existing) {
        map.remove(existing);
        previewLayersRef.current.delete(key);
      }
      return;
    }

    const existing = previewLayersRef.current.get(key);
    if (existing) {
      map.remove(existing);
      previewLayersRef.current.delete(key);
    }

    if (!previewAction.url) return;

    const layerOptions = {
      url: previewAction.url,
      title: previewAction.title || 'Preview',
      opacity: 0.7,
    };
    const layer = isTiledImageServerUrl(previewAction.url)
      ? new ImageryTileLayer(layerOptions)
      : new ImageryLayer(layerOptions);
    map.add(layer);
    previewLayersRef.current.set(key, layer);
    layer.when(() => {
      if (layer.fullExtent) view.goTo(layer.fullExtent.expand(1.1)).catch(() => {});
    });
  }, [isReady, previewAction]);

  return (
    <div id="experience-map-area" className="relative min-w-0 flex-1 bg-gray-100">
      <div ref={mapDivRef} className="absolute inset-0" />

      <div
        id="experience-layer-list"
        className="absolute right-3 top-3 z-10 flex max-h-[calc(100%-24px)] w-72 flex-col overflow-hidden rounded-card border border-gray-200 bg-white/95 shadow-lg"
      >
        <div className="border-b border-gray-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Layers
        </div>
        <div ref={layerListRef} className="min-h-[48px] overflow-y-auto" />
      </div>

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
