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

interface SavedViewState {
  center: [number, number];
  zoom: number;
  tilt?: number;
  heading?: number;
}

interface UseArcgisViewLifecycleParams {
  mapDivRef: RefObject<HTMLDivElement | null>;
  viewRef: MutableRefObject<MapView | SceneView | null>;
  viewMode: ViewMode;
  highlightLayerRef: MutableRefObject<GraphicsLayer | null>;
  spatialQueryLayerRef: MutableRefObject<GraphicsLayer | null>;
  spatialSketchViewModelRef: MutableRefObject<SketchViewModel | null>;
  setMapReady: () => void;
}

export function useArcgisViewLifecycle({
  mapDivRef,
  viewRef,
  viewMode,
  highlightLayerRef,
  spatialQueryLayerRef,
  spatialSketchViewModelRef,
  setMapReady,
}: UseArcgisViewLifecycleParams) {
  const savedViewStateRef = useRef<SavedViewState>({
    center: PRESERVE_CENTER,
    zoom: INITIAL_ZOOM,
  });

  useEffect(() => {
    if (!mapDivRef.current) return;

    const previousView = viewRef.current;
    if (previousView?.center) {
      const { longitude, latitude } = previousView.center;
      savedViewStateRef.current = {
        center: [longitude ?? PRESERVE_CENTER[0], latitude ?? PRESERVE_CENTER[1]],
        zoom: previousView.zoom ?? INITIAL_ZOOM,
        tilt: (previousView as SceneView).camera?.tilt,
        heading: (previousView as SceneView).camera?.heading,
      };
    }

    const is3D = viewMode === '3d';
    const saved = savedViewStateRef.current;
    const map = new Map({
      basemap: is3D ? 'satellite' : 'topo-vector',
      ...(is3D && { ground: 'world-elevation' }),
    });

    if (is3D) {
      map.ground.layers.add(new ElevationLayer({
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      }));

      map.add(new PointCloudLayer({
        url: 'https://tiles.arcgis.com/tiles/6DIQcwlPy8knb6sg/arcgis/rest/services/All_Aeroptic_ColorizedPointCloud/SceneServer',
        title: 'Dangermond Preserve LiDAR Point Cloud',
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
          camera: {
            position: { x: saved.center[0], y: saved.center[1], z: 2000 },
            tilt: saved.tilt ?? 60,
            heading: saved.heading ?? 0,
          },
          qualityProfile: 'high',
          environment: {
            atmosphereEnabled: true,
            lighting: { date: new Date(), directShadowsEnabled: true },
          },
          ui: { components: ['attribution', 'navigation-toggle', 'compass', 'zoom'] },
          padding: { top: 52, right: 8, bottom: 8, left: 8 },
        })
      : new MapView({
          container: mapDivRef.current,
          map,
          center: saved.center,
          zoom: saved.zoom,
          ui: { components: ['attribution', 'compass', 'zoom'] },
          padding: { top: 52, right: 8, bottom: 8, left: 8 },
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
      if (view.ui.find('attribution')) view.ui.move('attribution', 'top-right');
      if (view.popup) {
        view.popup.dockEnabled = false;
        view.popup.autoOpenEnabled = false;
      }
      setMapReady();
    });

    return () => {
      const outgoingView = viewRef.current;
      if (outgoingView?.center) {
        const { longitude, latitude } = outgoingView.center;
        savedViewStateRef.current = {
          center: [longitude ?? PRESERVE_CENTER[0], latitude ?? PRESERVE_CENTER[1]],
          zoom: outgoingView.zoom ?? INITIAL_ZOOM,
          tilt: (outgoingView as SceneView).camera?.tilt,
          heading: (outgoingView as SceneView).camera?.heading,
        };
      }

      viewRef.current = null;
      highlightLayerRef.current = null;
      spatialQueryLayerRef.current = null;
      spatialSketchViewModelRef.current?.destroy();
      spatialSketchViewModelRef.current = null;
      view.destroy();
    };
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps
}
