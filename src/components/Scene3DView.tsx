import React, { useEffect, useRef, useState } from 'react';
import SceneView from '@arcgis/core/views/SceneView';
import Map from '@arcgis/core/Map';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import { Ruler, Pencil, X } from 'lucide-react';

interface Scene3DViewProps {
  onViewReady?: (view: SceneView) => void;
}

const Scene3DView: React.FC<Scene3DViewProps> = ({ onViewReady }) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<SceneView | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);

  useEffect(() => {
    if (!mapDiv.current) return;

    // Create graphics layer for drawings
    const graphicsLayer = new GraphicsLayer({
      title: 'User Drawings',
      elevationInfo: { mode: 'on-the-ground' }
    });
    graphicsLayerRef.current = graphicsLayer;

    // Create a Map with 3D basemap
    const map = new Map({
      basemap: 'satellite',
      ground: 'world-elevation',
      layers: [graphicsLayer]
    });

    // Add custom elevation layer (can be enhanced with LiDAR-specific elevation service later)
    const elevationLayer = new ElevationLayer({
      url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
    });
    map.ground.layers.add(elevationLayer);

    // Add 2018 Dangermond Preserve Aerial Imagery as basemap layer
    const dangermondImagery2018 = {
      type: 'tile',
      url: 'https://tiles.arcgis.com/tiles/6DIQcwlPy8knb6sg/arcgis/rest/services/Dangermond_Preserve_Aerial_Imagery_2018_stretch_2/MapServer',
      title: 'Dangermond Preserve 2018 Aerial Imagery'
    } as any;
    
    // Load layers dynamically
    Promise.all([
      import('@arcgis/core/layers/TileLayer'),
      import('@arcgis/core/layers/PointCloudLayer')
    ]).then(([{ default: TileLayer }, { default: PointCloudLayer }]) => {
      // Add aerial imagery base layer
      const imageryLayer = new TileLayer(dangermondImagery2018);
      map.add(imageryLayer, 0);
      
      // Add LiDAR Point Cloud Layer
      const lidarPointCloud = new PointCloudLayer({
        url: 'https://tiles.arcgis.com/tiles/6DIQcwlPy8knb6sg/arcgis/rest/services/All_Aeroptic_ColorizedPointCloud/SceneServer',
        title: 'Dangermond Preserve LiDAR Point Cloud',
        // Point cloud rendering properties
        renderer: {
          type: 'point-cloud-rgb',
          field: 'RGB',
          // Point size and density
          pointSizeAlgorithm: {
            type: 'fixed-size',
            useRealWorldSymbolSizes: false,
            size: 3 // Point size in pixels
          }
        } as any,
        // Elevation info to drape on terrain
        elevationInfo: {
          mode: 'absolute-height'
        }
      });
      
      map.add(lidarPointCloud);
      console.log('✅ LiDAR Point Cloud layer added');
    }).catch(err => {
      console.error('❌ Error loading layers:', err);
    });

    // Create the SceneView
    const view = new SceneView({
      container: mapDiv.current,
      map: map,
      camera: {
        position: {
          x: -120.0707, // Dangermond Preserve longitude
          y: 34.4669,   // Dangermond Preserve latitude
          z: 2000       // Altitude in meters
        },
        tilt: 60, // Angle of view
        heading: 0
      },
      qualityProfile: 'high',
      environment: {
        atmosphereEnabled: true,
        atmosphere: {
          quality: 'high'
        },
        lighting: {
          date: new Date(),
          directShadowsEnabled: true
        }
      },
      ui: {
        components: ['attribution', 'navigation-toggle', 'compass', 'zoom']
      }
    });

    viewRef.current = view;

    // Initialize SketchViewModel for drawing
    const sketchVM = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
      defaultCreateOptions: {
        mode: 'hybrid' // Allows both click and drag drawing
      },
      polygonSymbol: {
        type: 'polygon-3d',
        symbolLayers: [{
          type: 'fill',
          material: { color: [255, 255, 255, 0.3] },
          outline: {
            color: [0, 112, 255, 0.8],
            size: '2px'
          }
        }]
      } as any,
      polylineSymbol: {
        type: 'line-3d',
        symbolLayers: [{
          type: 'line',
          material: { color: [0, 112, 255] },
          size: '3px'
        }]
      } as any,
      pointSymbol: {
        type: 'point-3d',
        symbolLayers: [{
          type: 'icon',
          resource: { primitive: 'circle' },
          material: { color: [255, 0, 0] },
          size: '12px'
        }]
      } as any
    });

    sketchVMRef.current = sketchVM;

    // Wait for view to be ready
    view.when(() => {
      console.log('✅ Scene3DView ready');
      onViewReady?.(view);
    });

    // Cleanup
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [onViewReady]);

  const handleDrawPolygon = () => {
    if (!sketchVMRef.current) return;
    
    setIsDrawing(true);
    setIsMeasuring(false);
    
    sketchVMRef.current.create('polygon');
    
    // Listen for create complete
    const handle = sketchVMRef.current.on('create', (event) => {
      if (event.state === 'complete') {
        console.log('Polygon created:', event.graphic);
        setIsDrawing(false);
        handle.remove();
      }
    });
  };

  const handleDrawPolyline = () => {
    if (!sketchVMRef.current) return;
    
    setIsDrawing(true);
    setIsMeasuring(true);
    
    sketchVMRef.current.create('polyline');
    
    // Listen for create complete to measure distance
    const handle = sketchVMRef.current.on('create', (event) => {
      if (event.state === 'complete') {
        const polyline = event.graphic.geometry as __esri.Polyline;
        const length = geometryEngine.geodesicLength(polyline, 'meters');
        console.log(`Line drawn: ${length.toFixed(2)} meters`);
        
        // Add text label with distance
        const midpoint = polyline.extent.center;
        const textSymbol = {
          type: 'text',
          color: 'white',
          haloColor: 'black',
          haloSize: '1px',
          text: `${length.toFixed(0)}m`,
          xoffset: 0,
          yoffset: 0,
          font: {
            size: 12,
            family: 'sans-serif',
            weight: 'bold'
          }
        };
        
        const textGraphic = new Graphic({
          geometry: midpoint,
          symbol: textSymbol as any
        });
        
        graphicsLayerRef.current?.add(textGraphic);
        
        setIsDrawing(false);
        setIsMeasuring(false);
        handle.remove();
      }
    });
  };

  const handleDrawPoint = () => {
    if (!sketchVMRef.current) return;
    
    setIsDrawing(true);
    setIsMeasuring(false);
    
    sketchVMRef.current.create('point');
    
    const handle = sketchVMRef.current.on('create', (event) => {
      if (event.state === 'complete') {
        console.log('Point created:', event.graphic);
        setIsDrawing(false);
        handle.remove();
      }
    });
  };

  const handleClearDrawings = () => {
    if (graphicsLayerRef.current) {
      graphicsLayerRef.current.removeAll();
    }
    setIsDrawing(false);
    setIsMeasuring(false);
  };

  return (
    <div id="scene-3d-view-container" className="relative w-full h-full">
      {/* 3D Map Container */}
      <div ref={mapDiv} id="scene-3d-map" className="w-full h-full" />
      
      {/* Drawing Tools Panel */}
      <div id="scene-3d-tools" className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          id="draw-polygon-button"
          onClick={handleDrawPolygon}
          disabled={isDrawing}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
            isDrawing && !isMeasuring
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
          }`}
          title="Draw Polygon"
        >
          <Pencil className="w-4 h-4" />
          <span>Draw Area</span>
        </button>
        
        <button
          id="measure-distance-button"
          onClick={handleDrawPolyline}
          disabled={isDrawing}
          className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
            isMeasuring
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
          }`}
          title="Measure Distance"
        >
          <Ruler className="w-4 h-4" />
          <span>Measure</span>
        </button>
        
        <button
          id="draw-point-button"
          onClick={handleDrawPoint}
          disabled={isDrawing}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          title="Add Point Marker"
        >
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>Add Point</span>
        </button>
        
        <button
          id="clear-drawings-button"
          onClick={handleClearDrawings}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded text-sm font-medium bg-white text-red-600 border border-red-300 hover:bg-red-50"
          title="Clear All Drawings"
        >
          <X className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Instructions Overlay */}
      {isDrawing && (
        <div id="scene-3d-instructions" className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {isMeasuring
            ? 'Click to add points along the line. Double-click to finish.'
            : 'Click to add points. Double-click to finish drawing.'}
        </div>
      )}
    </div>
  );
};

export default Scene3DView;

