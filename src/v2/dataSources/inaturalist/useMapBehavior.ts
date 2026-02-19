// ============================================================================
// iNaturalist Map Behavior — Manages GraphicsLayer population & filtering.
// Extracted from useMapLayers to keep core map logic data-source-agnostic.
//
// Layer is "on map" when PINNED or ACTIVE (whichever comes first).
// Cache warms on first appearance. Data persists across activate/deactivate.
// Called unconditionally by useAllMapBehaviors (React hooks rules).
//
// Map Marker Click: Clicking an iNaturalist observation marker on the map
// activates the layer and opens the detail view for that observation.
// ============================================================================

import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import Point from '@arcgis/core/geometry/Point';
import { useINaturalistFilter } from '../../context/INaturalistFilterContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import {
  populateINaturalistLayer,
  filterINaturalistLayer,
} from '../../components/Map/layers/inaturalistLayer';
import type { PinnedLayer, ActiveLayer } from '../../types';

const LAYER_ID = 'inaturalist-obs';
const MAP_LAYER_ID = 'v2-inaturalist-obs'; // Actual ArcGIS layer ID (with v2- prefix)

export function useINaturalistMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { selectedTaxa, selectedSpecies, excludeAllSpecies, startDate, endDate, allObservations, dataLoaded, warmCache } = useINaturalistFilter();
  const { activateLayer } = useLayers();
  const { viewRef, getSpatialPolygonForLayer } = useMap();
  const spatialPolygon = getSpatialPolygonForLayer(LAYER_ID);
  const populatedRef = useRef(false);

  const isPinned = pinnedLayers.some(p => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  // Warm cache when layer first appears on map (pinned OR activated)
  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // Reset populated flag when layer is removed from map entirely
  useEffect(() => {
    if (!isOnMap) populatedRef.current = false;
  }, [isOnMap]);

  // Populate GraphicsLayer when data arrives AND layer exists on map.
  // Declaration order: fires AFTER useMapLayers' add-layer effect,
  // so getManagedLayer() returns the layer added in the same render cycle.
  useEffect(() => {
    if (!isOnMap || !dataLoaded || populatedRef.current) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    populateINaturalistLayer(arcLayer, allObservations);
    filterINaturalistLayer(arcLayer, { selectedTaxa, selectedSpecies, excludeAllSpecies, startDate, endDate, spatialPolygon });
    populatedRef.current = true;
  }, [isOnMap, dataLoaded, allObservations, selectedTaxa, selectedSpecies, excludeAllSpecies, startDate, endDate, spatialPolygon, getManagedLayer, mapReady]);

  // Update filter when selectedTaxa changes (instant local visibility toggle)
  useEffect(() => {
    if (!populatedRef.current) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;
    filterINaturalistLayer(arcLayer, { selectedTaxa, selectedSpecies, excludeAllSpecies, startDate, endDate, spatialPolygon });
  }, [selectedTaxa, selectedSpecies, excludeAllSpecies, startDate, endDate, spatialPolygon, getManagedLayer]);

  // Map click handler: when user clicks an iNaturalist marker, activate layer + show detail view
  useEffect(() => {
    if (!isOnMap || !dataLoaded) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit => 
            result.type === 'graphic' && 
            result.graphic.layer?.id === MAP_LAYER_ID
        );

        if (graphicHit) {
          const observationId = graphicHit.graphic.attributes?.id;
          if (observationId) {
            // Activate layer with the observation ID to auto-open detail view
            activateLayer(LAYER_ID, undefined, observationId);

            // Zoom to the observation
            const geometry = graphicHit.graphic.geometry;
            if (geometry && geometry.type === 'point') {
              const point = geometry as Point;
              view.goTo({
                center: [point.longitude, point.latitude],
                zoom: 15,
              }, { duration: 800 });
            }
          }
        }
      } catch (error) {
        console.error('[iNaturalist Map Click] Error handling click:', error);
      }
    });

    return () => handler.remove();
  }, [isOnMap, dataLoaded, viewRef, activateLayer]);
}
