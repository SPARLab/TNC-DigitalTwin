import { useEffect, useRef, useState } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Extent from '@arcgis/core/geometry/Extent';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { useMap } from '../../context/MapContext';
import { motusService, type MotusMovementContext } from '../../../services/motusService';
import { useMotusFilter } from '../../context/MotusFilterContext';
import { createMotusLayer, MOTUS_TAGGED_ANIMALS_LAYER_ID } from '../../components/Map/layers/motusLayer';
import { registerTNCArcGISLayer } from '../../components/Map/layers';

const FLYING_BIRD_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
  '<path d="M16 7h.01" />',
  '<path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />',
  '<path d="m20 7 2 .5-2 .5" />',
  '<path d="M10 18v3" />',
  '<path d="M14 17.75V21" />',
  '<path d="M7 18a6 6 0 0 0 3.84-10.61" />',
  '</svg>',
].join('');

const FLYING_BIRD_MARKER_URL = `data:image/svg+xml;utf8,${encodeURIComponent(FLYING_BIRD_SVG)}`;
const createMovementOverlayLayer = () => new GraphicsLayer({
  id: 'v2-motus-inferred-movement-overlay',
  listMode: 'hide',
});

export function useMotusMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { layerMap } = useCatalog();
  const { viewRef, viewMode } = useMap();
  const {
    selectedTagId,
    browseFilters,
    setMovementDisclaimer,
    playbackStepIndex,
    playbackTransitionProgress,
    isPlaybackPlaying,
    setPlaybackStepLabels,
    playbackDirectionMarkerMode,
    createLoadingScope,
  } = useMotusFilter();
  const overlayRef = useRef<GraphicsLayer | null>(null);
  const movementContextRef = useRef<MotusMovementContext | null>(null);
  const wasPlaybackPlayingRef = useRef(false);
  const [movementRenderVersion, setMovementRenderVersion] = useState(0);

  const hasMotusOnMap = pinnedLayers.some((layer) => layer.layerId.startsWith('service-181') || layer.layerId === 'dataset-181')
    || !!(activeLayer && (activeLayer.layerId.startsWith('service-181') || activeLayer.layerId === 'dataset-181'));

  // Register concrete MOTUS ArcGIS layers during render so createMapLayer resolves in the same cycle.
  for (const [layerId, layer] of layerMap.entries()) {
    const isServiceParent = !!(
      layer.catalogMeta?.isMultiLayerService &&
      !layer.catalogMeta?.parentServiceId &&
      layer.catalogMeta?.siblingLayers &&
      layer.catalogMeta.siblingLayers.length > 0
    );

    if (layer.dataSource !== 'motus' || isServiceParent) continue;
    if (layerId === MOTUS_TAGGED_ANIMALS_LAYER_ID) continue;
    registerTNCArcGISLayer(layerId, layer);
  }

  // Ensure tagged-animal layer has explicit implementation and renderer.
  if (!getManagedLayer(MOTUS_TAGGED_ANIMALS_LAYER_ID) && layerMap.has(MOTUS_TAGGED_ANIMALS_LAYER_ID)) {
    registerTNCArcGISLayer(MOTUS_TAGGED_ANIMALS_LAYER_ID, layerMap.get(MOTUS_TAGGED_ANIMALS_LAYER_ID)!);
  }

  useEffect(() => {
    setMovementRenderVersion((version) => version + 1);
  }, [viewMode, mapReady, selectedTagId, viewRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view?.map) return;
    if (!hasMotusOnMap && !selectedTagId) {
      if (overlayRef.current) overlayRef.current.removeAll();
      return;
    }

    const map = view.map;
    if (!overlayRef.current) {
      overlayRef.current = createMovementOverlayLayer();
      map.add(overlayRef.current);
      setMovementRenderVersion((version) => version + 1);
    } else if (!map.findLayerById(overlayRef.current.id)) {
      // Recreate overlay when map/view is replaced (2D<->3D). Reusing a stale
      // GraphicsLayer instance from the previous view can fail SceneView layerview creation.
      try {
        overlayRef.current.destroy();
      } catch {
        // Best effort cleanup; continue with fresh layer allocation.
      }
      overlayRef.current = createMovementOverlayLayer();
      map.add(overlayRef.current);
      setMovementRenderVersion((version) => version + 1);
    }

    // Add a stable tagged-animals layer if the managed map flow has not yet instantiated one.
    const selectedTagWhere = selectedTagId != null ? `tag_id = ${selectedTagId}` : '1=0';
    if (!map.findLayerById(`v2-${MOTUS_TAGGED_ANIMALS_LAYER_ID}`)) {
      const motusLayer = createMotusLayer({
        id: `v2-${MOTUS_TAGGED_ANIMALS_LAYER_ID}`,
        visible: selectedTagId != null,
        whereClause: selectedTagWhere,
      });
      map.add(motusLayer);
    }

    for (const layerId of [`v2-${MOTUS_TAGGED_ANIMALS_LAYER_ID}`, MOTUS_TAGGED_ANIMALS_LAYER_ID]) {
      const existingLayer = map.findLayerById(layerId);
      if (existingLayer?.type !== 'feature') continue;
      const featureLayer = existingLayer as FeatureLayer;
      featureLayer.definitionExpression = selectedTagWhere;
      featureLayer.visible = selectedTagId != null;
    }
  }, [viewRef, hasMotusOnMap, selectedTagId, mapReady]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const context = movementContextRef.current;
    overlay.removeAll();
    if (!context) return;

    for (const station of context.stations) {
      overlay.add(new Graphic({
        geometry: {
          type: 'point',
          longitude: station.longitude,
          latitude: station.latitude,
        },
        attributes: {
          stationId: station.stationId,
          stationName: station.name,
        },
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          size: 8,
          color: [22, 163, 74, 0.9],
          outline: {
            color: [255, 255, 255, 0.9],
            width: 1.1,
          },
        },
        popupTemplate: {
          title: '{stationName}',
          content: 'Receiver station context for inferred MOTUS movement.',
        },
      }));
    }

    const drawLeg = (
      fromLongitude: number,
      fromLatitude: number,
      toLongitude: number,
      toLatitude: number,
      attributes: Record<string, unknown>,
    ) => {
      const hasFiniteCoordinates = [fromLongitude, fromLatitude, toLongitude, toLatitude]
        .every((value) => Number.isFinite(value));
      if (!hasFiniteCoordinates) return;
      const hasMovement = Math.abs(toLongitude - fromLongitude) > 0.0000001
        || Math.abs(toLatitude - fromLatitude) > 0.0000001;
      if (!hasMovement) return;

      const legOffsetMeters = viewMode === '3d' ? 18 : 12;
      const legSymbol = viewMode === '3d'
        ? {
            type: 'line-3d' as const,
            symbolLayers: [{
              type: 'line' as const,
              size: 2.6,
              material: {
                color: [217, 119, 6, 0.95] as [number, number, number, number],
              },
              cap: 'round' as const,
              join: 'round' as const,
            }],
          }
        : {
            type: 'simple-line' as const,
            color: [217, 119, 6, 0.9] as [number, number, number, number],
            width: 2.4,
            style: 'solid' as const,
          };

      overlay.add(new Graphic({
        geometry: {
          type: 'polyline',
          paths: [[
            [fromLongitude, fromLatitude],
            [toLongitude, toLatitude],
          ]],
          spatialReference: { wkid: 4326 },
        },
        attributes,
        elevationInfo: {
          mode: 'relative-to-ground',
          offset: legOffsetMeters,
        },
        symbol: legSymbol,
        popupTemplate: {
          title: 'Inferred movement leg',
          content: '<div><p>{evidence}</p><p><strong>Step:</strong> {stepIndex}</p><p><strong>Detection window:</strong> {startDate} to {endDate}</p></div>',
        },
      } as any));
    };

    const drawDirectionMarker = (
      fromLongitude: number,
      fromLatitude: number,
      tipLongitude: number,
      tipLatitude: number,
      attributes: Record<string, unknown>,
    ) => {
      const dx = tipLongitude - fromLongitude;
      const dy = tipLatitude - fromLatitude;
      const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
      const shouldUseBirdMarker = playbackDirectionMarkerMode === 'bird' && viewMode !== '3d';
      const symbol = shouldUseBirdMarker
        ? {
            type: 'picture-marker' as const,
            url: FLYING_BIRD_MARKER_URL,
            width: '20px',
            height: '20px',
          }
        : {
            type: 'simple-marker' as const,
            style: 'triangle' as const,
            size: 10,
            angle,
            color: [217, 119, 6, 0.95] as [number, number, number, number],
            outline: {
              color: [255, 255, 255, 0.9] as [number, number, number, number],
              width: 0.9,
            },
          };
      overlay.add(new Graphic({
        geometry: {
          type: 'point',
          longitude: tipLongitude,
          latitude: tipLatitude,
        },
        attributes,
        elevationInfo: {
          mode: 'relative-to-ground',
          offset: 16,
        },
        symbol,
      } as any));
    };

    const visibleLegCount = Math.max(0, Math.min(context.legs.length, playbackStepIndex));
    const completedLegs = context.legs.slice(0, visibleLegCount);

    for (const leg of completedLegs) {
      drawLeg(
        leg.from.longitude,
        leg.from.latitude,
        leg.to.longitude,
        leg.to.latitude,
        {
          legId: leg.id,
          legKind: leg.kind,
          stepIndex: leg.stepIndex,
          startDate: leg.startDate || 'Unknown',
          endDate: leg.endDate || 'Unknown',
          confidence: leg.confidence,
          evidence: leg.evidence,
        },
      );
    }

    const activeLeg = context.legs[playbackStepIndex];
    const isDrawingPartial = isPlaybackPlaying
      && !!activeLeg
      && playbackTransitionProgress > 0
      && playbackTransitionProgress < 1;

    if (activeLeg && isDrawingPartial) {
      const partialLongitude = activeLeg.from.longitude
        + ((activeLeg.to.longitude - activeLeg.from.longitude) * playbackTransitionProgress);
      const partialLatitude = activeLeg.from.latitude
        + ((activeLeg.to.latitude - activeLeg.from.latitude) * playbackTransitionProgress);
      const activeAttributes = {
        legId: activeLeg.id,
        legKind: activeLeg.kind,
        stepIndex: activeLeg.stepIndex,
        startDate: activeLeg.startDate || 'Unknown',
        endDate: activeLeg.endDate || 'Unknown',
        confidence: activeLeg.confidence,
        evidence: activeLeg.evidence,
      };
      drawLeg(
        activeLeg.from.longitude,
        activeLeg.from.latitude,
        partialLongitude,
        partialLatitude,
        activeAttributes,
      );
      drawDirectionMarker(
        activeLeg.from.longitude,
        activeLeg.from.latitude,
        partialLongitude,
        partialLatitude,
        activeAttributes,
      );
    } else if (completedLegs.length > 0) {
      const lastLeg = completedLegs[completedLegs.length - 1];
      drawDirectionMarker(
        lastLeg.from.longitude,
        lastLeg.from.latitude,
        lastLeg.to.longitude,
        lastLeg.to.latitude,
        {
          legId: lastLeg.id,
          legKind: lastLeg.kind,
          stepIndex: lastLeg.stepIndex,
          startDate: lastLeg.startDate || 'Unknown',
          endDate: lastLeg.endDate || 'Unknown',
          confidence: lastLeg.confidence,
          evidence: lastLeg.evidence,
        },
      );
    }
  }, [
    viewMode,
    playbackStepIndex,
    playbackTransitionProgress,
    isPlaybackPlaying,
    playbackDirectionMarkerMode,
    movementRenderVersion,
    mapReady,
  ]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      wasPlaybackPlayingRef.current = isPlaybackPlaying;
      return;
    }

    const wasPlaying = wasPlaybackPlayingRef.current;
    wasPlaybackPlayingRef.current = isPlaybackPlaying;

    // Frame journey only when playback transitions from paused -> playing.
    if (!isPlaybackPlaying || wasPlaying) return;

    const context = movementContextRef.current;
    if (!context || context.legs.length === 0) return;

    const points = context.legs.flatMap((leg) => [leg.from, leg.to]);
    if (points.length === 0) return;

    const minLongitude = Math.min(...points.map((point) => point.longitude));
    const maxLongitude = Math.max(...points.map((point) => point.longitude));
    const minLatitude = Math.min(...points.map((point) => point.latitude));
    const maxLatitude = Math.max(...points.map((point) => point.latitude));

    if (
      !Number.isFinite(minLongitude)
      || !Number.isFinite(maxLongitude)
      || !Number.isFinite(minLatitude)
      || !Number.isFinite(maxLatitude)
    ) return;

    const lonSpan = maxLongitude - minLongitude;
    const latSpan = maxLatitude - minLatitude;
    const lonPadding = Math.max(0.01, lonSpan * 0.25);
    const latPadding = Math.max(0.01, latSpan * 0.25);
    const isSinglePointJourney = lonSpan < 0.0001 && latSpan < 0.0001;

    const target = isSinglePointJourney
      ? {
          center: [minLongitude, minLatitude] as [number, number],
          zoom: 10,
        }
      : new Extent({
          xmin: minLongitude - lonPadding,
          ymin: minLatitude - latPadding,
          xmax: maxLongitude + lonPadding,
          ymax: maxLatitude + latPadding,
          spatialReference: { wkid: 4326 },
        });

    void view.goTo(target, { animate: true, duration: 900, easing: 'ease-in-out' }).catch(() => {
      // Ignore interrupted goTo calls when users manually pan/zoom mid-animation.
    });
  }, [isPlaybackPlaying, viewRef]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    let cancelled = false;

    if (!hasMotusOnMap) {
      movementContextRef.current = null;
      overlay.removeAll();
      setMovementRenderVersion((version) => version + 1);
      setMovementDisclaimer('Choose a preserve-eligible tag to render its full inferred journey across receiver stations.');
      setPlaybackStepLabels(['Journey start']);
      return;
    }

    if (selectedTagId == null) {
      setMovementDisclaimer('Receiver stations are visible. Select a preserve-eligible tag to render its full inferred journey.');
      setPlaybackStepLabels(['Journey start']);
      const closeLoadingScope = createLoadingScope();
      void motusService.getReceiverStations()
        .then((stations) => {
          if (cancelled) return;
          movementContextRef.current = {
            stations,
            legs: [],
            disclaimer: 'Receiver stations are visible. Select a preserve-eligible tag to render its full inferred journey.',
          };
          setMovementRenderVersion((version) => version + 1);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error('[MOTUS] Failed to render receiver stations', error);
          setMovementDisclaimer('Unable to load receiver stations. Select a preserve-eligible tag to retry journey rendering.');
        })
        .finally(() => {
          closeLoadingScope();
        });
      return () => {
        cancelled = true;
        closeLoadingScope();
      };
    }

    const closeLoadingScope = createLoadingScope();
    void motusService.getMovementContextForTag(selectedTagId, browseFilters)
      .then((context) => {
        if (cancelled) return;
        movementContextRef.current = context;
        setMovementRenderVersion((version) => version + 1);
        setMovementDisclaimer(context.disclaimer);
        setPlaybackStepLabels(['Journey start', ...context.legs.map((leg) => leg.endDate || leg.startDate || `Step ${leg.stepIndex}`)]);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[MOTUS] Failed to render movement context', error);
        movementContextRef.current = null;
        overlay.removeAll();
        setMovementRenderVersion((version) => version + 1);
        setMovementDisclaimer('Unable to render journey for this preserve-eligible tag. Receiver stations remain visible.');
        setPlaybackStepLabels(['Journey start']);
      })
      .finally(() => {
        closeLoadingScope();
      });

    return () => {
      cancelled = true;
      closeLoadingScope();
    };
  }, [
    viewRef,
    hasMotusOnMap,
    selectedTagId,
    browseFilters,
    setMovementDisclaimer,
    setPlaybackStepLabels,
    createLoadingScope,
    mapReady,
    viewMode,
  ]);
}
