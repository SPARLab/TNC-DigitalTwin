import { useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
import PointCloudLayer from '@arcgis/core/layers/PointCloudLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import type { ViewMode } from '../../../context/MapContext';

const PRESERVE_CENTER: [number, number] = [-120.47, 34.47];
const INITIAL_ZOOM = 12;
const DEFAULT_SCALE = 250000;
export const V2_LIDAR_LAYER_ID = 'v2-lidar-point-cloud-layer';

interface SavedViewState {
  center: [number, number];
  scale: number;
  zoom: number;
  tilt: number;
  heading: number;
  sourceMode: ViewMode;
}

interface UseArcgisViewLifecycleParams {
  mapDivRef: RefObject<HTMLDivElement | null>;
  viewRef: MutableRefObject<MapView | SceneView | null>;
  viewMode: ViewMode;
  highlightLayerRef: MutableRefObject<GraphicsLayer | null>;
  spatialQueryLayerRef: MutableRefObject<GraphicsLayer | null>;
  spatialSketchViewModelRef: MutableRefObject<SketchViewModel | null>;
  isLidarVisible: boolean;
  setMapReady: () => void;
}

export function useArcgisViewLifecycle({
  mapDivRef,
  viewRef,
  viewMode,
  highlightLayerRef,
  spatialQueryLayerRef,
  spatialSketchViewModelRef,
  isLidarVisible,
  setMapReady,
}: UseArcgisViewLifecycleParams) {
  const getScaleConversionFactor = (latitude: number): number => {
    const factor = Math.cos((latitude * Math.PI) / 180);
    // Keep conversion numerically stable if latitude is near the poles.
    return Math.max(0.01, factor);
  };

  const getScaleForTargetMode = (
    captured: SavedViewState,
    targetMode: ViewMode,
  ): number => {
    const latitude = captured.center[1];
    const conversionFactor = getScaleConversionFactor(latitude);

    if (captured.sourceMode === targetMode) {
      return captured.scale;
    }

    if (captured.sourceMode === '2d' && targetMode === '3d') {
      // ArcGIS guidance: shrink scale for 2D -> 3D to match ground distance.
      return captured.scale * conversionFactor;
    }

    // In practice this app over-zooms out when applying inverse conversion.
    // Preserve raw scale for 3D -> 2D to keep parity at higher extents.
    return captured.scale;
  };

  const captureViewState = (view: MapView | SceneView | null): SavedViewState => {
    if (!view?.center) {
      return {
        center: PRESERVE_CENTER,
        scale: DEFAULT_SCALE,
        zoom: INITIAL_ZOOM,
        tilt: 0,
        heading: 0,
        sourceMode: '2d',
      };
    }

    const { longitude, latitude } = view.center;
    const center: [number, number] = [
      longitude ?? PRESERVE_CENTER[0],
      latitude ?? PRESERVE_CENTER[1],
    ];
    const scale = view.scale ?? DEFAULT_SCALE;
    const zoom = view.zoom ?? INITIAL_ZOOM;

    if (view.type === '3d') {
      return {
        center,
        scale,
        zoom,
        tilt: view.camera?.tilt ?? 0,
        heading: view.camera?.heading ?? 0,
        sourceMode: '3d',
      };
    }

    return {
      center,
      scale,
      zoom,
      tilt: 0, // MapView is always top-down; preserve this for 2D -> 3D transitions.
      heading: view.rotation ?? 0,
      sourceMode: '2d',
    };
  };

  const savedViewStateRef = useRef<SavedViewState>({
    center: PRESERVE_CENTER,
    scale: DEFAULT_SCALE,
    zoom: INITIAL_ZOOM,
    tilt: 0,
    heading: 0,
    sourceMode: '2d',
  });

  useEffect(() => {
    if (!mapDivRef.current) return;

    const previousView = viewRef.current;
    if (previousView) {
      savedViewStateRef.current = captureViewState(previousView);
    }

    const is3D = viewMode === '3d';
    const saved = savedViewStateRef.current;
    const targetMode: ViewMode = is3D ? '3d' : '2d';
    const targetScale = getScaleForTargetMode(saved, targetMode);
    const map = new Map({
      basemap: is3D ? 'satellite' : 'topo-vector',
      ...(is3D && { ground: 'world-elevation' }),
    });

    if (is3D) {
      map.ground.layers.add(new ElevationLayer({
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      }));

      map.add(new PointCloudLayer({
        id: V2_LIDAR_LAYER_ID,
        url: 'https://tiles.arcgis.com/tiles/6DIQcwlPy8knb6sg/arcgis/rest/services/All_Aeroptic_ColorizedPointCloud/SceneServer',
        title: 'Dangermond Preserve LiDAR Point Cloud',
        visible: isLidarVisible,
        renderer: {
          type: 'point-cloud-rgb',
          field: 'RGB',
          pointSizeAlgorithm: { type: 'fixed-size', useRealWorldSymbolSizes: false, size: 3 },
        } as __esri.PointCloudRendererProperties,
        elevationInfo: { mode: 'absolute-height' },
      }));
    }

    const highlightLayer = new GraphicsLayer({ id: 'v2-highlight-layer' });
    map.add(highlightLayer);
    highlightLayerRef.current = highlightLayer;

    const spatialQueryLayer = new GraphicsLayer({ id: 'v2-spatial-query-layer' });
    map.add(spatialQueryLayer);
    spatialQueryLayerRef.current = spatialQueryLayer;

    const view = is3D
      ? new SceneView({
          container: mapDivRef.current,
          map,
          center: saved.center,
          scale: targetScale,
          qualityProfile: 'high',
          environment: {
            atmosphereEnabled: true,
            lighting: { date: new Date(), directShadowsEnabled: true },
          },
          ui: { components: ['attribution', 'navigation-toggle', 'compass', 'zoom'] },
          padding: { top: 52, right: 0, bottom: 0, left: 0 },
        })
      : new MapView({
          container: mapDivRef.current,
          map,
          center: saved.center,
          scale: targetScale,
          ui: { components: ['attribution', 'compass', 'zoom'] },
          padding: { top: 52, right: 0, bottom: 0, left: 0 },
        });

    viewRef.current = view;

    spatialSketchViewModelRef.current = new SketchViewModel({
      view: view as MapView,
      layer: spatialQueryLayer,
      polygonSymbol: {
        type: 'simple-fill',
        color: [46, 125, 50, 0.14],
        outline: {
          color: [46, 125, 50, 0.95],
          width: 2,
        },
      },
      defaultUpdateOptions: {
        tool: 'reshape',
      },
    });

    view.when(() => {
      if (view.ui.find('zoom')) view.ui.move('zoom', 'top-right');
      if (view.ui.find('compass')) view.ui.move('compass', 'top-right');
      if (view.ui.find('navigation-toggle')) view.ui.move('navigation-toggle', 'top-right');
      if (view.popup) {
        view.popup.dockEnabled = false;
      }
      setMapReady();
    });

    return () => {
      const outgoingView = view;
      savedViewStateRef.current = captureViewState(outgoingView);

      viewRef.current = null;
      highlightLayerRef.current = null;
      spatialQueryLayerRef.current = null;
      spatialSketchViewModelRef.current?.destroy();
      spatialSketchViewModelRef.current = null;
      view.destroy();
    };
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.type !== '3d') return;
    const map = view.map;
    if (!map) return;
    const lidarLayer = map.findLayerById(V2_LIDAR_LAYER_ID) as PointCloudLayer | null;
    if (!lidarLayer) return;
    lidarLayer.visible = isLidarVisible;
  }, [isLidarVisible, viewMode, viewRef]);
}
