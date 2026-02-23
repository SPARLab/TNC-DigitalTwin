import { useEffect, useRef } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { useMap } from '../../context/MapContext';
import { motusService } from '../../../services/motusService';
import { useMotusFilter } from '../../context/MotusFilterContext';
import { createMotusLayer, MOTUS_TAGGED_ANIMALS_LAYER_ID } from '../../components/Map/layers/motusLayer';
import { registerTNCArcGISLayer } from '../../components/Map/layers';

export function useMotusMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  _mapReady: number,
) {
  const { layerMap } = useCatalog();
  const { viewRef } = useMap();
  const {
    selectedTagId,
    browseFilters,
    setMovementDisclaimer,
  } = useMotusFilter();
  const overlayRef = useRef<GraphicsLayer | null>(null);

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
    const view = viewRef.current;
    if (!view?.map) return;
    if (!hasMotusOnMap && !selectedTagId) {
      if (overlayRef.current) overlayRef.current.removeAll();
      return;
    }

    const map = view.map;
    if (!overlayRef.current) {
      overlayRef.current = new GraphicsLayer({
        id: 'v2-motus-inferred-movement-overlay',
        listMode: 'hide',
      });
      map.add(overlayRef.current);
    } else if (!map.findLayerById(overlayRef.current.id)) {
      map.add(overlayRef.current);
    }

    // Add a stable tagged-animals layer if the managed map flow has not yet instantiated one.
    if (!map.findLayerById(`v2-${MOTUS_TAGGED_ANIMALS_LAYER_ID}`)) {
      const motusLayer = createMotusLayer({ id: `v2-${MOTUS_TAGGED_ANIMALS_LAYER_ID}`, visible: true });
      map.add(motusLayer);
    }
  }, [viewRef, hasMotusOnMap, selectedTagId]);

  useEffect(() => {
    const view = viewRef.current;
    const overlay = overlayRef.current;
    if (!view || !overlay) return;

    let cancelled = false;
    overlay.removeAll();

    if (!hasMotusOnMap || selectedTagId == null) {
      setMovementDisclaimer(
        'Receiver stations are shown as green circles on the map. Inferred path legs appear only when station-to-station inference is valid.',
      );
      return;
    }

    void motusService.getMovementContextForTag(selectedTagId, browseFilters)
      .then((context) => {
        if (cancelled) return;
        setMovementDisclaimer(context.disclaimer);

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

        for (const leg of context.legs) {
          const isContextLeg = leg.kind === 'context';
          overlay.add(new Graphic({
            geometry: {
              type: 'polyline',
              paths: [[
                [leg.from.longitude, leg.from.latitude],
                [leg.to.longitude, leg.to.latitude],
              ]],
            },
            attributes: {
              legId: leg.id,
              legKind: leg.kind,
              stepIndex: leg.stepIndex,
              startDate: leg.startDate || 'Unknown',
              endDate: leg.endDate || 'Unknown',
              confidence: leg.confidence,
              evidence: leg.evidence,
            },
            symbol: {
              type: 'simple-line',
              color: isContextLeg ? [75, 85, 99, 0.72] : [217, 119, 6, 0.85],
              width: isContextLeg ? 1.8 : 2.2,
              style: isContextLeg ? 'dot' : 'solid',
            },
            popupTemplate: {
              title: isContextLeg ? 'Movement context line' : 'Inferred movement leg',
              content: isContextLeg
                ? '{evidence}'
                : '<div><p>{evidence}</p><p><strong>Step:</strong> {stepIndex}</p><p><strong>Detection window:</strong> {startDate} to {endDate}</p></div>',
            },
          }));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('[MOTUS] Failed to render movement context', error);
        setMovementDisclaimer('Unable to infer movement paths for this selection. Receiver stations remain visible.');
      });

    return () => {
      cancelled = true;
    };
  }, [viewRef, hasMotusOnMap, selectedTagId, browseFilters, setMovementDisclaimer]);
}
