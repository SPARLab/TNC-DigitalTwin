import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import { iNaturalistAPI, iNaturalistObservation } from '../services/iNaturalistService';
import { tncINaturalistService, TNCArcGISObservation } from '../services/tncINaturalistService';
import { calFloraAPI, CalFloraPlant } from '../services/calFloraService';
import { TNCArcGISItem, tncArcGISAPI } from '../services/tncArcGISService';
import { eBirdService, EBirdObservation } from '../services/eBirdService';
import { animlService, AnimlDeployment, AnimlImageLabel } from '../services/animlService';
import type { DendraStation } from '../types';
import LayerLegend from './LayerLegend';
import { MapLegend } from './MapLegend';
import { ChevronDown, ChevronUp, Map as MapIcon, Satellite } from 'lucide-react';
import { buildPublicAPIPopupContent, buildTNCPopupContent } from './MapView/utils/popupBuilders';
import { 
  getObservationIcon, 
  getTNCObservationEmoji, 
  normalizeTNCCategoryToIconicTaxon, 
  getEmojiDataUri 
} from './MapView/utils/iconUtils';
import { 
  drawSearchAreaRectangle,
  zoomIn,
  zoomOut,
  enterFullscreen,
  highlightObservation as highlightObservationImpl,
  clearObservationHighlight as clearObservationHighlightImpl
} from './MapView/utils';
import {
  loadObservations as loadObservationsImpl,
  loadCalFloraData as loadCalFloraDataImpl,
  loadEBirdObservations as loadEBirdObservationsImpl,
  loadTNCObservations as loadTNCObservationsImpl,
  type ObservationsFilters,
  type CalFloraFilters,
  type EBirdFilters,
  type TNCObservationsFilters
} from './MapView/loaders';
import {
  useTNCArcGISLayers,
  type ImageServerLoadingState,
  type LayerLoadError
} from './MapView/hooks';

interface MapViewProps {
  onObservationsUpdate?: (observations: iNaturalistObservation[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  tncObservations?: TNCArcGISObservation[];
  onTNCObservationsUpdate?: (observations: TNCArcGISObservation[]) => void;
  onTNCLoadingChange?: (loading: boolean) => void;
  selectedTNCObservation?: TNCArcGISObservation | null;
  onTNCObservationSelect?: (observation: TNCArcGISObservation | null) => void;
  // iNaturalist Public API observations
  selectedINaturalistObservation?: iNaturalistObservation | null;
  onINaturalistObservationSelect?: (observation: iNaturalistObservation | null) => void;
  eBirdObservations?: EBirdObservation[];
  onEBirdObservationsUpdate?: (observations: EBirdObservation[]) => void;
  onEBirdLoadingChange?: (loading: boolean) => void;
  selectedEBirdObservation?: EBirdObservation | null;
  onEBirdObservationSelect?: (observation: EBirdObservation | null) => void;
  calFloraPlants?: CalFloraPlant[];
  onCalFloraUpdate?: (plants: CalFloraPlant[]) => void;
  onCalFloraLoadingChange?: (loading: boolean) => void;
  // TNC ArcGIS Hub layer management
  tncArcGISItems?: TNCArcGISItem[];
  activeLayerIds?: string[];
  loadingLayerIds?: string[]; // Track which layers are loading (for synchronizing banner with eye icon)
  layerOpacities?: Record<string, number>;
  onLayerLoadComplete?: (itemId: string) => void;
  onLayerLoadError?: (itemId: string) => void;
  onLayerOpacityChange?: (itemId: string, opacity: number) => void;
  onLegendDataFetched?: (itemId: string, legendData: any) => void;
  // Dendra Stations
  dendraStations?: DendraStation[];
  selectedDendraStationId?: number;
  onDendraStationClick?: (station: DendraStation) => void;
  // Draw mode props
  isDrawMode?: boolean;
  onDrawModeChange?: (isDrawMode: boolean) => void;
  onPolygonDrawn?: (polygon: __esri.Polygon) => void;
  onPolygonCleared?: () => void;
  // Filter synchronization props
  iconicTaxa?: string[];
  onIconicTaxaChange?: (taxa: string[]) => void;
  // Animl data
  animlDeployments?: AnimlDeployment[];
  animlImageLabels?: AnimlImageLabel[];
  animlViewMode?: 'camera-centric' | 'animal-centric';
  selectedAnimlDeployment?: AnimlDeployment | null;
  selectedAnimlObservation?: AnimlImageLabel | null;
  onAnimlDeploymentClick?: (deployment: AnimlDeployment) => void;
  onAnimlObservationClick?: (observation: AnimlImageLabel) => void;
  onAnimlLoadingChange?: (loading: boolean) => void;
}

export interface MapViewRef {
  reloadObservations: (filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
    customPolygon?: string;
    showSearchArea?: boolean;
  }) => void;
  reloadTNCObservations: (filters?: {
    taxonCategories?: string[];
    startDate?: string;
    endDate?: string;
    maxResults?: number;
    useFilters?: boolean;
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    showSearchArea?: boolean;
    customPolygon?: string;
  }) => void;
  reloadEBirdObservations: (filters?: {
    startDate?: string;
    endDate?: string;
    maxResults?: number;
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
    showSearchArea?: boolean;
  }) => void;
  reloadCalFloraData: (filters?: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
    customPolygon?: string;
    showSearchArea?: boolean;
  }) => void;
  reloadAnimlObservations: (filters?: {
    deployments?: AnimlDeployment[];
    imageLabels?: AnimlImageLabel[];
    viewMode?: 'camera-centric' | 'animal-centric';
    startDate?: string;
    endDate?: string;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
    showSearchArea?: boolean;
  }) => void;
  activateDrawMode: () => void;
  clearPolygon: () => void;
  clearSearchArea: () => void;
  clearAllObservationLayers: () => void;
  highlightObservation: (id: number | string) => void;
  clearObservationHighlight: () => void;
  highlightDeployment: (id: number) => void;
  clearDeploymentHighlight: () => void;
}

const MapViewComponent = forwardRef<MapViewRef, MapViewProps>(({ 
  onObservationsUpdate, 
  onLoadingChange,
  tncObservations = [],
  onTNCObservationsUpdate,
  onTNCLoadingChange,
  selectedTNCObservation: _selectedTNCObservation,
  onTNCObservationSelect,
  selectedINaturalistObservation: _selectedINaturalistObservation,
  onINaturalistObservationSelect,
  eBirdObservations = [],
  onEBirdObservationsUpdate,
  onEBirdLoadingChange,
  selectedEBirdObservation: _selectedEBirdObservation,
  onEBirdObservationSelect,
  calFloraPlants = [],
  onCalFloraUpdate,
  onCalFloraLoadingChange,
  tncArcGISItems = [],
  activeLayerIds = [],
  loadingLayerIds = [],
  layerOpacities = {},
  onLayerLoadComplete,
  onLayerLoadError,
  onLayerOpacityChange,
  onLegendDataFetched,
  dendraStations = [],
  selectedDendraStationId,
  onDendraStationClick,
  isDrawMode = false,
  onDrawModeChange,
  onPolygonDrawn,
  onPolygonCleared,
  iconicTaxa = [],
  onIconicTaxaChange,
  animlDeployments = [],
  animlImageLabels = [],
  animlViewMode = 'camera-centric',
  selectedAnimlDeployment,
  selectedAnimlObservation,
  onAnimlDeploymentClick,
  onAnimlObservationClick,
  onAnimlLoadingChange
}, ref) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [loading, setLoading] = useState(false);
  const tncArcGISLayersRef = useRef<globalThis.Map<string, __esri.Layer>>(new globalThis.Map());
  const boundaryLayerRef = useRef<__esri.GeoJSONLayer | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<__esri.Polygon | null>(null);
  const drawingPointsRef = useRef<number[][]>([]);
  const clickHandlerRef = useRef<__esri.Handle | null>(null);
  const pointerMoveHandlerRef = useRef<__esri.Handle | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  // ImageServer loading banner state
  const [imageServerLoading, setImageServerLoading] = useState<ImageServerLoadingState | null>(null);
  
  // Basemap selection state
  const [currentBasemap, setCurrentBasemap] = useState<'hybrid' | 'topo-vector'>('hybrid');
  
  // Layer load error state - shows persistent error banner
  const [layerLoadError, setLayerLoadError] = useState<LayerLoadError | null>(null);
  // CalFlora state is managed by parent component via props

  // Map legend filtering state for iNaturalist observations
  const [currentObservations, setCurrentObservations] = useState<iNaturalistObservation[]>([]);
  const currentObservationsRef = useRef<iNaturalistObservation[]>([]);
  const [visibleObservationCategories, setVisibleObservationCategories] = useState<Set<string>>(new Set());
  
                 // Highlighted observation state
  const [_highlightedObservationId, setHighlightedObservationId] = useState<number | string | null>(null);
  const highlightHandleRef = useRef<__esri.Handle | null>(null);
  const highlightOperationRef = useRef<Promise<void> | null>(null);

  // Synchronize ImageServer banner with loadingLayerIds (same as eye icon timing)
  // Note: Timeout refs are now managed inside useTNCArcGISLayers hook
  useEffect(() => {
    if (imageServerLoading && !loadingLayerIds.includes(imageServerLoading.itemId)) {
      // The item finished loading (removed from loadingLayerIds) - dismiss banner NOW
      setImageServerLoading(null);
    }
  }, [loadingLayerIds, imageServerLoading]);

  useEffect(() => {
    if (mapDiv.current) {
      // Create the map with a free satellite-style basemap
      // 'hybrid' provides satellite imagery with labels and is free to use
      const map = new Map({
        basemap: currentBasemap
      });

      // Suppress basemap loading errors by handling them immediately
      // This prevents the ArcGIS API from logging AbortErrors to console
      if (map.basemap && map.basemap.load) {
        map.basemap.load().catch(() => {
          // Silently handle any basemap loading issues
          // The map will still function with cached tiles or fallback
        });
      }

      // Create graphics layer for iNaturalist observations
      // Add Dangermond Preserve boundary (from public/ GeoJSON)
      const boundaryLayer = new GeoJSONLayer({
        id: 'dangermond-boundary',
        title: 'Dangermond Preserve Boundary',
        url: '/dangermond-preserve-boundary.geojson',
        renderer: {
          type: 'simple',
          symbol: {
            type: 'simple-fill',
            color: [0, 0, 0, 0],
            outline: {
              color: [255, 255, 255, 1],
              width: 2
            }
          }
        },
        // Disable automatic popup - we'll handle it manually with distance checking
        popupEnabled: false
      });

      // Store reference to boundary layer for popup management
      boundaryLayerRef.current = boundaryLayer;
      
      map.add(boundaryLayer);

      // Create graphics layer for search area rectangle (initially hidden)
      const searchAreaLayer = new GraphicsLayer({
        id: 'search-area-rectangle',
        title: 'TNC Search Area',
        visible: false // Hidden by default
      });

      map.add(searchAreaLayer);

      // Create graphics layer for iNaturalist observations
      const observationsLayer = new GraphicsLayer({
        id: 'inaturalist-observations',
        title: 'iNaturalist Observations'
      });

      // Create graphics layer for TNC iNaturalist observations
      const tncObservationsLayer = new GraphicsLayer({
        id: 'tnc-inaturalist-observations',
        title: 'TNC iNaturalist Observations'
      });

      // Create graphics layer for eBird observations
      const eBirdObservationsLayer = new GraphicsLayer({
        id: 'ebird-observations',
        title: 'eBird Observations'
      });

      // Create graphics layer for CalFlora plants
      const calFloraLayer = new GraphicsLayer({
        id: 'calflora-plants',
        title: 'CalFlora Plants'
      });

      // Create graphics layer for Dendra stations
      const dendraStationsLayer = new GraphicsLayer({
        id: 'dendra-stations',
        title: 'Dendra Stations'
      });

      // Create graphics layer for Animl observations/deployments
      const animlLayer = new GraphicsLayer({
        id: 'animl-observations',
        title: 'Animl Observations'
      });

      map.add(observationsLayer);
      map.add(tncObservationsLayer);
      map.add(eBirdObservationsLayer);
      map.add(calFloraLayer);
      map.add(dendraStationsLayer);
      map.add(animlLayer);

      // Create the map view centered on Dangermond Preserve
      // Coordinates: approximately 34.47°N, -120.47°W (Point Conception area)
      const mapView = new MapView({
        container: mapDiv.current,
        map: map,
        center: [-120.47, 34.47], // Longitude, Latitude for Dangermond Preserve
        zoom: 12, // Good zoom level to see the preserve area
        ui: {
          components: ['attribution'] // Keep attribution, remove default zoom controls since we have custom ones
        }
      });

      // Configure popup widget for better UX with multiple features
      // Note: Popups auto-open by default when clicking features with popupTemplates
      if (mapView.popup) {
        // Disable docking to allow dynamic positioning near clicked features
        mapView.popup.dockEnabled = false;
        mapView.popup.visibleElements = {
          featureNavigation: true,  // Show arrows to navigate between features
          closeButton: true
        };
        mapView.popup.actions = [];  // Remove default actions for cleaner UI
      // console.log('✅ Popup widget configured: dynamic positioning, feature navigation enabled');
      }

      setView(mapView);

      // Note: We no longer load initial data automatically
      // Data will only be loaded when the user clicks the search button

      // Cleanup function
      return () => {
        if (mapView) {
          mapView.destroy();
        }
      };
    }
  }, []);

  // Effect to update basemap when selection changes
  useEffect(() => {
    if (view && view.map) {
      view.map.basemap = currentBasemap as any;
    }
  }, [currentBasemap, view]);

  // Effect to re-render observations when visibility changes
  useEffect(() => {
    if (!view || !view.map || currentObservations.length === 0) return;
    
    // Update ref for click handler access
    currentObservationsRef.current = currentObservations;
    
    const observationsLayer = view.map.findLayerById('inaturalist-observations') as GraphicsLayer;
    if (!observationsLayer) return;
    
    // Clear and re-add filtered observations
    observationsLayer.removeAll();
    
    currentObservations.forEach(obs => {
      if (obs.geojson && obs.geojson.coordinates) {
        const iconicTaxon = obs.taxon?.iconic_taxon_name || 'unknown';
        const normalizedTaxon = iconicTaxon.toLowerCase(); // Normalize for comparison
        
        // Skip if this category is hidden (but show all if none are set yet)
        if (visibleObservationCategories.size > 0 && !visibleObservationCategories.has(normalizedTaxon)) {
          return;
        }

        const [longitude, latitude] = obs.geojson.coordinates;
        const point = new Point({ longitude, latitude });
        const iconInfo = getObservationIcon(obs);
        
        const symbol = new PictureMarkerSymbol({
          url: getEmojiDataUri(iconInfo.emoji),
          width: '32px',
          height: '32px'
        });

        const popupTemplate = new PopupTemplate({
          title: obs.taxon?.preferred_common_name || obs.taxon?.name || 'Unknown Species',
          content: buildPublicAPIPopupContent(obs)
        });

        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          popupTemplate: popupTemplate,
          attributes: {
            id: obs.id,
            iconicTaxon: iconicTaxon
          }
        });

        observationsLayer.add(graphic);
      }
    });
  }, [visibleObservationCategories, currentObservations, view]);

  // Use custom hook to manage TNC ArcGIS Hub map layers
  useTNCArcGISLayers({
    view,
    tncArcGISItems,
    activeLayerIds,
    layerOpacities,
    tncArcGISLayersRef,
    onLayerOpacityChange,
    onLayerLoadComplete,
    onLayerLoadError,
    onLegendDataFetched,
    onImageServerLoadingChange: setImageServerLoading,
    onLayerLoadErrorChange: setLayerLoadError
  });

  // Close popup if the layer it belongs to was toggled off
  useEffect(() => {
    if (view && view.popup && view.popup.visible) {
      const popupFeature = view.popup.selectedFeature;
      if (popupFeature && popupFeature.layer) {
        const layerId = popupFeature.layer.id;
        
        // Check if this layer is a TNC layer that's been toggled off
        if (typeof layerId === 'string') {
          const isTNCLayer = layerId.startsWith('tnc-layer-');
          if (isTNCLayer) {
            const itemId = layerId.replace('tnc-layer-', '');
            if (!activeLayerIds.includes(itemId)) {
              view.popup.visible = false;
      // console.log('🔒 Closed popup - layer was toggled off');
            }
          }
        }
      }
    }
  }, [activeLayerIds, view]);

  // Set up draw layer for polygon drawing
  useEffect(() => {
    if (!view) return;
    
    view.when(() => {
      const map = view.map;
      
      // Create or get the draw layer
      let drawLayer = map?.findLayerById('draw-polygon-layer') as GraphicsLayer;
      if (!drawLayer) {
        drawLayer = new GraphicsLayer({
          id: 'draw-polygon-layer',
          title: 'Custom Draw Area',
          listMode: 'hide' // Hide from layer list
        });
        map?.add(drawLayer);
      }
      
      // console.log('✅ Draw layer initialized successfully');
    }).catch((error) => {
      console.error('Error initializing draw layer:', error);
    });
  }, [view]);

  // Add keyboard listener for Delete key
  useEffect(() => {
    if (!drawnPolygon) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        clearPolygon();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawnPolygon, view, onPolygonCleared, onDrawModeChange]);

  // Function to activate draw mode with manual click handling
  const activateDrawMode = () => {
    if (!view) {
      console.warn('View not available');
      return;
    }
    
    // Clear any existing polygon and points
    const drawLayer = view.map?.findLayerById('draw-polygon-layer') as GraphicsLayer;
    if (drawLayer) {
      drawLayer.removeAll();
    }
    setDrawnPolygon(null);
    drawingPointsRef.current = [];
    
    // Remove any existing handlers
    if (clickHandlerRef.current) {
      clickHandlerRef.current.remove();
    }
    if (pointerMoveHandlerRef.current) {
      pointerMoveHandlerRef.current.remove();
    }
    
    // Add pointer-move handler for live preview
    pointerMoveHandlerRef.current = view.on('pointer-move', (event) => {
      // Only show preview if we have at least one point
      if (drawingPointsRef.current.length === 0) return;
      
      const point = view.toMap({ x: event.x, y: event.y });
      if (!point || point.longitude == null || point.latitude == null) return;
      
      const currentPoint: [number, number] = [point.longitude, point.latitude];
      const previewPoints = [...drawingPointsRef.current, currentPoint];
      
      // Create preview polygon
      let rings: number[][][];
      if (previewPoints.length >= 2) {
        // Close the ring by adding the first point at the end
        rings = [[...previewPoints, previewPoints[0]]];
      } else {
        // Just one point, can't make a polygon yet
        return;
      }
      
      const polygon = new Polygon({
        rings: rings,
        spatialReference: { wkid: 4326 }
      });
      
      const symbol = new SimpleFillSymbol({
        color: [51, 136, 255, 0.15],
        outline: {
          color: [51, 136, 255, 1],
          width: 2,
          style: 'dash'
        }
      });
      
      const graphic = new Graphic({
        geometry: polygon,
        symbol: symbol
      });
      
      if (drawLayer) {
        drawLayer.removeAll();
        drawLayer.add(graphic);
      }
    });
    
    // Add click handler for drawing
    clickHandlerRef.current = view.on('click', (event) => {
      event.stopPropagation();
      
      if (event.mapPoint.longitude == null || event.mapPoint.latitude == null) return;
      const point: [number, number] = [event.mapPoint.longitude, event.mapPoint.latitude];
      drawingPointsRef.current.push(point);
      
      // console.log(`Point ${drawingPointsRef.current.length} added`);
    });
    
    // Add double-click handler to finish drawing
    const dblClickHandler = view.on('double-click', (event) => {
      event.stopPropagation();
      
      if (drawingPointsRef.current.length >= 3) {
        const polygon = new Polygon({
          rings: [[...drawingPointsRef.current, drawingPointsRef.current[0]]], // Close the ring
          spatialReference: { wkid: 4326 }
        });
        
        // Create final graphic with solid style
        const symbol = new SimpleFillSymbol({
          color: [51, 136, 255, 0.2],
          outline: {
            color: [51, 136, 255, 1],
            width: 2
          }
        });
        
        const graphic = new Graphic({
          geometry: polygon,
          symbol: symbol
        });
        
        if (drawLayer) {
          drawLayer.removeAll();
          drawLayer.add(graphic);
        }
        
        setDrawnPolygon(polygon);
        onPolygonDrawn?.(polygon);
        
        // Remove handlers
        if (clickHandlerRef.current) {
          clickHandlerRef.current.remove();
          clickHandlerRef.current = null;
        }
        if (pointerMoveHandlerRef.current) {
          pointerMoveHandlerRef.current.remove();
          pointerMoveHandlerRef.current = null;
        }
        dblClickHandler.remove();
        
        onDrawModeChange?.(false);
      // console.log('✅ Polygon completed with', drawingPointsRef.current.length, 'points');
      }
    });
    
    onDrawModeChange?.(true);
      // console.log('✏️ Draw mode activated - Click to add points, double-click to finish');
  };

  // Function to clear the drawn polygon
  const clearPolygon = () => {
    if (view) {
      const drawLayer = view.map?.findLayerById('draw-polygon-layer') as GraphicsLayer;
      if (drawLayer) {
        drawLayer.removeAll();
      }
      
      // Remove any active handlers
      if (clickHandlerRef.current) {
        clickHandlerRef.current.remove();
        clickHandlerRef.current = null;
      }
      if (pointerMoveHandlerRef.current) {
        pointerMoveHandlerRef.current.remove();
        pointerMoveHandlerRef.current = null;
      }
      
      drawingPointsRef.current = [];
      setDrawnPolygon(null);
      onPolygonCleared?.();
      onDrawModeChange?.(false);
      // console.log('🗑️ Polygon cleared');
    }
  };

  // Effect to handle CalFlora data when provided via props
  useEffect(() => {
    if (view) {
      const calFloraLayer = view.map?.findLayerById('calflora-plants') as GraphicsLayer;
      if (calFloraLayer) {
        // Clear existing graphics first (important: do this even if calFloraPlants is empty)
        calFloraLayer.removeAll();
        
        // Only add markers if we have plants to show
        if (calFloraPlants.length > 0) {
          // Add CalFlora plants to map
          calFloraPlants.forEach(plant => {
          if (plant.geojson?.coordinates) {
            const [longitude, latitude] = plant.geojson.coordinates;
            
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });

            // Use seedling emoji for CalFlora plants (same approach as iNaturalist)
            const symbol = new PictureMarkerSymbol({
              url: getEmojiDataUri('🌱'),
              width: '28px',
              height: '28px'
            });

          // Create popup template with photo support
          const popupTemplate = new PopupTemplate({
            title: plant.commonName || plant.scientificName,
            content: () => {
              const container = document.createElement('div');
              container.className = 'calflora-popup';

              // Photo section
              if (plant.attributes?.photo) {
                const photoWrapper = document.createElement('div');
                photoWrapper.style.display = 'flex';
                photoWrapper.style.flexDirection = 'column';
                photoWrapper.style.alignItems = 'center';
                photoWrapper.style.marginBottom = '12px';

                const img = document.createElement('img');
                img.src = plant.attributes.photo;
                img.alt = plant.commonName || plant.scientificName || 'CalFlora plant photo';
                img.loading = 'lazy';
                img.style.maxWidth = '200px';
                img.style.borderRadius = '6px';
                img.style.objectFit = 'cover';
                img.style.margin = '0 0 6px 0';
                img.onerror = () => { 
                  img.style.display = 'none';
                  const noPhoto = document.createElement('div');
                  noPhoto.textContent = 'Photo unavailable';
                  noPhoto.style.fontSize = '12px';
                  noPhoto.style.color = '#6b7280';
                  noPhoto.style.fontStyle = 'italic';
                  noPhoto.style.marginBottom = '8px';
                  photoWrapper.appendChild(noPhoto);
                };

                const attribution = document.createElement('div');
                attribution.textContent = 'Photo courtesy of CalFlora.org';
                attribution.style.fontSize = '11px';
                attribution.style.color = '#6b7280';
                attribution.style.fontStyle = 'italic';

                photoWrapper.appendChild(img);
                photoWrapper.appendChild(attribution);
                container.appendChild(photoWrapper);
              } else {
                const noPhoto = document.createElement('div');
                noPhoto.textContent = 'No photo available';
                noPhoto.style.fontSize = '12px';
                noPhoto.style.color = '#6b7280';
                noPhoto.style.fontStyle = 'italic';
                noPhoto.style.marginBottom = '12px';
                container.appendChild(noPhoto);
              }

              // Plant details
              const details = document.createElement('div');
              details.innerHTML = `
                <p><strong>Scientific Name:</strong> ${plant.scientificName}</p>
                ${plant.family ? `<p><strong>Family:</strong> ${plant.family}</p>` : ''}
                <p><strong>Native Status:</strong> <span style="color: ${
                  plant.nativeStatus === 'native' ? '#22c55e' : 
                  plant.nativeStatus === 'invasive' ? '#ef4444' : '#6b7280'
                }; font-weight: bold;">${plant.nativeStatus}</span></p>
                ${plant.calIpcRating ? `<p><strong>Cal-IPC Rating:</strong> <span style="color: #ef4444; font-weight: bold;">${plant.calIpcRating}</span></p>` : ''}
                ${plant.county ? `<p><strong>County:</strong> ${plant.county}</p>` : ''}
                ${plant.observationDate ? `<p><strong>Observed:</strong> ${new Date(plant.observationDate).toLocaleDateString()}</p>` : ''}
                ${plant.attributes?.observer ? `<p><strong>Observer:</strong> ${plant.attributes.observer}</p>` : ''}
                <p><strong>Data Source:</strong> CalFlora</p>
                ${plant.nativeStatus === 'invasive' ? 
                  '<p style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 4px 8px; border-radius: 4px; margin: 8px 0;">⚠️ Invasive Species - Management Recommended</p>' : 
                  ''}
                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                  <button onclick="window.openCalFloraModal && window.openCalFloraModal('${plant.id}')" 
                          style="background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; font-weight: 500;">
                    View Details
                  </button>
                </div>
              `;
              container.appendChild(details);

              // Basic styles for the popup content
              const style = document.createElement('style');
              style.textContent = `
                .calflora-popup { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 280px; }
                .calflora-popup p { margin: 5px 0; font-size: 13px; }
                .calflora-popup strong { color: #374151; }
              `;
              container.appendChild(style);

              return container;
            }
          });

            // Create graphic
            const graphic = new Graphic({
              geometry: point,
              symbol: symbol,
              popupTemplate: popupTemplate,
              attributes: {
                id: plant.id,
                scientificName: plant.scientificName,
                commonName: plant.commonName,
                nativeStatus: plant.nativeStatus,
                family: plant.family,
                county: plant.county
              }
            });

            calFloraLayer.add(graphic);
          }
        });
        
      // console.log(`✅ CalFlora: Updated map with ${calFloraPlants.length} plant records`);
        } else {
      // console.log(`🧹 CalFlora: Cleared map (no plants to display)`);
        }
      }
    }
  }, [view, calFloraPlants]);

  // Effect to handle Dendra stations when provided via props
  useEffect(() => {
    if (view) {
      const dendraLayer = view.map?.findLayerById('dendra-stations') as GraphicsLayer;
      if (dendraLayer) {
        // Clear existing graphics first (important: do this even if dendraStations is empty)
        dendraLayer.removeAll();
        
        // Only add markers if we have stations to show
        if (dendraStations.length > 0) {
          // Sort stations so selected station is added last (appears on top)
          const sortedStations = [...dendraStations].sort((a, b) => {
            const aSelected = selectedDendraStationId === a.id;
            const bSelected = selectedDendraStationId === b.id;
            if (aSelected && !bSelected) return 1;  // a comes after b
            if (!aSelected && bSelected) return -1; // b comes after a
            return 0; // maintain original order
          });
          
          // Add Dendra stations to map
          sortedStations.forEach(station => {
          const point = new Point({
            longitude: station.geometry.x,
            latitude: station.geometry.y
          });

          // Check if this station is selected
          const isSelected = selectedDendraStationId === station.id;
          
          // Check if this station has data (stations without data have "NO DATA" in description)
          const hasData = !(station.description && station.description.includes('NO DATA'));
          
          // ===== COLOR CONFIGURATION =====
          // Change these colors to customize the icon appearance
          const ICON_COLOR_WITH_DATA = '#15803d';    // Darker green for stations with data
          const ICON_COLOR_WITHOUT_DATA = '#9ca3af'; // Gray for stations without data
          const ICON_COLOR_SELECTED = '#fbbf24';     // Yellow for selected stations
          const BORDER_COLOR_WITH_DATA = '#ffffff';  // White border for contrast
          const BORDER_COLOR_WITHOUT_DATA = '#ffffff'; // White border for contrast
          const BORDER_COLOR_SELECTED = '#fde68a';   // Light yellow border for selected
          const BORDER_WIDTH = '1.5';                // Border thickness (in px) - thin border
          const ADD_BORDER = true;                   // Set to false to remove borders
          
          // Current icon color and border based on selection state and data availability
          const iconColor = isSelected 
            ? ICON_COLOR_SELECTED 
            : hasData 
              ? ICON_COLOR_WITH_DATA 
              : ICON_COLOR_WITHOUT_DATA;
          const borderColor = isSelected 
            ? BORDER_COLOR_SELECTED 
            : hasData 
              ? BORDER_COLOR_WITH_DATA 
              : BORDER_COLOR_WITHOUT_DATA;
          
          // Icon Style Options - Choose one by changing the value:
          // 'option1' = Classic Radio Tower
          // 'option2' = Sensor Node / IoT Device  
          // 'option3' = Modern Broadcast Tower (default, cleaner look)
          // 'option4' = Weather Station Style
          const iconStyle: string = 'option1';
          
          let iconSvg = '';
          
          if (iconStyle === 'option1') {
            // OPTION 1: Classic Radio Tower
            iconSvg = `
              <g transform="translate(12, 12)">
                ${ADD_BORDER ? `
                  <!-- Border layer -->
                  <path d="M0,-10 L0,-6 M-4,-6 L4,-6 M-3,-6 L-3,-2 M3,-6 L3,-2 M-5,-2 L5,-2 M-2,-2 L-2,2 M2,-2 L2,2 M-6,2 L6,2 M-1,2 L-1,6 M1,2 L1,6 M-8,6 L8,6 M0,6 L0,10" 
                        stroke="${borderColor}" 
                        stroke-width="${parseFloat(BORDER_WIDTH) + 1.5}" 
                        fill="none" 
                        stroke-linecap="round"/>
                  <circle cx="0" cy="-10" r="${1.5 + parseFloat(BORDER_WIDTH)/2}" fill="${borderColor}"/>
                  <circle cx="0" cy="0" r="${2 + parseFloat(BORDER_WIDTH)/2}" fill="${borderColor}" opacity="0.8"/>
                ` : ''}
                <!-- Main icon -->
                <path d="M0,-10 L0,-6 M-4,-6 L4,-6 M-3,-6 L-3,-2 M3,-6 L3,-2 M-5,-2 L5,-2 M-2,-2 L-2,2 M2,-2 L2,2 M-6,2 L6,2 M-1,2 L-1,6 M1,2 L1,6 M-8,6 L8,6 M0,6 L0,10" 
                      stroke="${iconColor}" 
                      stroke-width="1.5" 
                      fill="none" 
                      stroke-linecap="round"/>
                <circle cx="0" cy="-10" r="1.5" fill="${iconColor}"/>
                <circle cx="0" cy="0" r="2" fill="${iconColor}" opacity="0.5"/>
              </g>
            `;
          } else if (iconStyle === 'option2') {
            // OPTION 2: Sensor Node / IoT Device
            iconSvg = `
              <g transform="translate(12, 12)">
                ${ADD_BORDER ? `
                  <!-- Border layer -->
                  <rect x="${-6 - parseFloat(BORDER_WIDTH)/2}" y="${-6 - parseFloat(BORDER_WIDTH)/2}" 
                        width="${12 + parseFloat(BORDER_WIDTH)}" height="${12 + parseFloat(BORDER_WIDTH)}" rx="2" 
                        fill="${borderColor}" opacity="0.9"/>
                  <circle cx="0" cy="-10" r="${1 + parseFloat(BORDER_WIDTH)/2}" fill="${borderColor}"/>
                  <path d="M0,-9 L0,-6.5" stroke="${borderColor}" stroke-width="${1 + parseFloat(BORDER_WIDTH)}"/>
                ` : ''}
                <!-- Main icon -->
                <rect x="-6" y="-6" width="12" height="12" rx="2" 
                      fill="${iconColor}" 
                      opacity="0.9"/>
                <rect x="-4" y="-4" width="8" height="8" rx="1" 
                      fill="white" 
                      opacity="0.3"/>
                <circle cx="0" cy="0" r="2" fill="white"/>
                <line x1="-6" y1="-6" x2="6" y2="6" stroke="white" stroke-width="0.5" opacity="0.3"/>
                <line x1="6" y1="-6" x2="-6" y2="6" stroke="white" stroke-width="0.5" opacity="0.3"/>
                <circle cx="0" cy="-10" r="1" fill="${iconColor}"/>
                <path d="M0,-9 L0,-6.5" stroke="${iconColor}" stroke-width="1"/>
              </g>
            `;
          } else if (iconStyle === 'option3') {
            // OPTION 3: Modern Broadcast Tower (cleaner, more iconic)
            iconSvg = `
              <g transform="translate(12, 12)">
                ${ADD_BORDER ? `
                  <!-- Border layer -->
                  <!-- Base border -->
                  <path d="M-7,9 L-2,9 L-1,2 L1,2 L2,9 L7,9" 
                        stroke="${borderColor}" 
                        stroke-width="${BORDER_WIDTH}" 
                        fill="${borderColor}" 
                        opacity="0.9"/>
                  <!-- Tower body border -->
                  <path d="M-1,2 L-2,-4 L-1,-8 L0,-10 L1,-8 L2,-4 L1,2 Z" 
                        stroke="${borderColor}" 
                        stroke-width="${BORDER_WIDTH}" 
                        fill="none"/>
                  <!-- Antenna border -->
                  <line x1="0" y1="-10" x2="0" y2="-12" 
                        stroke="${borderColor}" 
                        stroke-width="${parseFloat(BORDER_WIDTH) + 1.5}"/>
                  <circle cx="0" cy="-12" r="${1 + parseFloat(BORDER_WIDTH)/2}" fill="${borderColor}"/>
                ` : ''}
                <!-- Main icon -->
                <!-- Base -->
                <path d="M-7,9 L-2,9 L-1,2 L1,2 L2,9 L7,9" 
                      fill="${iconColor}" 
                      opacity="0.8"/>
                <!-- Tower body -->
                <path d="M-1,2 L-2,-4 L-1,-8 L0,-10 L1,-8 L2,-4 L1,2 Z" 
                      fill="${iconColor}"/>
                <!-- Antenna -->
                <line x1="0" y1="-10" x2="0" y2="-12" 
                      stroke="${iconColor}" 
                      stroke-width="1.5"/>
                <circle cx="0" cy="-12" r="1" fill="${iconColor}"/>
                <!-- Signal waves -->
                <path d="M-4,-6 Q-6,-8 -6,-10" fill="none" 
                      stroke="${iconColor}" 
                      stroke-width="1" 
                      opacity="0.5"/>
                <path d="M4,-6 Q6,-8 6,-10" fill="none" 
                      stroke="${iconColor}" 
                      stroke-width="1" 
                      opacity="0.5"/>
              </g>
            `;
          } else if (iconStyle === 'option4') {
            // OPTION 4: Weather Station Style
            iconSvg = `
              <g transform="translate(12, 12)">
                ${ADD_BORDER ? `
                  <!-- Border layer -->
                  <!-- Pole border -->
                  <rect x="${-0.5 - parseFloat(BORDER_WIDTH)/2}" y="-10" 
                        width="${1 + parseFloat(BORDER_WIDTH)}" height="20" 
                        fill="${borderColor}"/>
                  <!-- Top sensor border -->
                  <circle cx="0" cy="-10" r="${2 + parseFloat(BORDER_WIDTH)/2}" 
                          fill="${borderColor}"/>
                  <!-- Middle sensors border -->
                  <line x1="-5" y1="-5" x2="5" y2="-5" 
                        stroke="${borderColor}" 
                        stroke-width="${2 + parseFloat(BORDER_WIDTH)}" 
                        stroke-linecap="round"/>
                  <circle cx="-5" cy="-5" r="${1.5 + parseFloat(BORDER_WIDTH)/2}" 
                          fill="${borderColor}"/>
                  <circle cx="5" cy="-5" r="${1.5 + parseFloat(BORDER_WIDTH)/2}" 
                          fill="${borderColor}"/>
                  <!-- Lower sensor border -->
                  <rect x="${-3 - parseFloat(BORDER_WIDTH)/2}" y="${0 - parseFloat(BORDER_WIDTH)/2}" 
                        width="${6 + parseFloat(BORDER_WIDTH)}" height="${4 + parseFloat(BORDER_WIDTH)}" rx="1" 
                        fill="${borderColor}" 
                        opacity="0.9"/>
                  <!-- Base border -->
                  <path d="M-4,9 L-2,5 L2,5 L4,9 Z" 
                        stroke="${borderColor}" 
                        stroke-width="${BORDER_WIDTH}" 
                        fill="${borderColor}" 
                        opacity="0.8"/>
                ` : ''}
                <!-- Main icon -->
                <!-- Pole -->
                <rect x="-0.5" y="-10" width="1" height="20" 
                      fill="${iconColor}"/>
                <!-- Top sensor -->
                <circle cx="0" cy="-10" r="2" 
                        fill="${iconColor}"/>
                <!-- Middle sensors -->
                <line x1="-5" y1="-5" x2="5" y2="-5" 
                      stroke="${iconColor}" 
                      stroke-width="2" 
                      stroke-linecap="round"/>
                <circle cx="-5" cy="-5" r="1.5" 
                        fill="${iconColor}"/>
                <circle cx="5" cy="-5" r="1.5" 
                        fill="${iconColor}"/>
                <!-- Lower sensor -->
                <rect x="-3" y="0" width="6" height="4" rx="1" 
                      fill="${iconColor}" 
                      opacity="0.8"/>
                <!-- Base -->
                <path d="M-4,9 L-2,5 L2,5 L4,9 Z" 
                      fill="${iconColor}" 
                      opacity="0.6"/>
              </g>
            `;
          }
          
          // Create symbol for Dendra station - simple color change for selected state
          const symbol = new PictureMarkerSymbol({
            url: `data:image/svg+xml;base64,${btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                ${iconSvg}
              </svg>
            `)}`,
            width: isSelected ? '42px' : '36px',
            height: isSelected ? '42px' : '36px'
          });

          // Create popup template
          const popupTemplate = new PopupTemplate({
            title: station.name,
            content: `
              <div class="dendra-station-popup">
                ${station.description && station.description.trim() !== '' ? `<p><strong>Description:</strong> ${station.description}</p>` : ''}
                <p><strong>Type:</strong> ${station.station_type}</p>
                <p><strong>Location:</strong> ${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}</p>
                ${station.elevation ? `<p><strong>Elevation:</strong> ${station.elevation}m</p>` : ''}
                <p><strong>Timezone:</strong> ${station.time_zone}</p>
                <p><strong>Status:</strong> ${station.is_active ? 'Active' : 'Inactive'}</p>
                <p style="margin-top: 8px; color: #6b7280; font-size: 11px;">Click station icon to select</p>
              </div>
            `
          });

          // Create graphic
          const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            popupTemplate: popupTemplate,
            attributes: {
              stationId: station.id,
              stationName: station.name,
              stationType: station.station_type
            }
          });

          dendraLayer.add(graphic);
        });
        
      // console.log(`✅ Dendra: Updated map with ${sortedStations.length} station records (selected on top)`);
        } else {
      // console.log(`🧹 Dendra: Cleared map (no stations to display)`);
        }
      }
    }
  }, [view, dendraStations, selectedDendraStationId]);

  // Add click handler for Dendra stations
  useEffect(() => {
    if (view && onDendraStationClick) {
      const clickHandler = view.on('click', (event) => {
        view.hitTest(event).then((response) => {
          const dendraGraphic = response.results.find(result => 
            'graphic' in result && result.graphic && result.graphic.layer?.id === 'dendra-stations'
          );
          
          if (dendraGraphic && 'graphic' in dendraGraphic) {
            const stationId = dendraGraphic.graphic.attributes.stationId;
            const station = dendraStations.find(s => s.id === stationId);
            if (station) {
              onDendraStationClick(station);
            }
          }
        });
      });

      return () => {
        clickHandler.remove();
      };
    }
  }, [view, onDendraStationClick, dendraStations]);

  // Add click handler for boundary layer - only activates when clicking near the edge
  // This prevents accidental activation when clicking inside the polygon (e.g., when trying to click on observations)
  useEffect(() => {
    if (!view || !boundaryLayerRef.current) return;
    
    const clickHandler = view.on('click', async (event) => {
      // Check if boundary popup is allowed (disabled when TNC layers are active)
      const hasTNCLayers = activeLayerIds.length > 0;
      if (hasTNCLayers) return;
      
      try {
        // Use hitTest with explicit include to ensure boundary layer is tested even with popupEnabled: false
        const response = await view.hitTest(event, {
          include: boundaryLayerRef.current ? [boundaryLayerRef.current] : []
        });
        
        const boundaryHit = response.results.find(result => 
          'graphic' in result && 
          result.graphic && 
          result.graphic.layer?.id === 'dangermond-boundary'
        );
        
        if (boundaryHit && 'graphic' in boundaryHit) {
          const clickPoint = event.mapPoint;
          const polygon = boundaryHit.graphic.geometry as __esri.Polygon;
          
          // Create a polyline from the polygon's rings (the outline)
          // This ensures we measure distance to the boundary line, not the fill
          const Polyline = (await import('@arcgis/core/geometry/Polyline')).default;
          const polyline = new Polyline({
            paths: polygon.rings,
            spatialReference: polygon.spatialReference
          });
          
          // Use nearestCoordinate on the polyline (boundary) not the polygon
          const nearestPoint = geometryEngine.nearestCoordinate(polyline, clickPoint);
          
          // Calculate geodesic distance between the two points
          const distance = geometryEngine.distance(
            clickPoint, 
            nearestPoint.coordinate, 
            'meters'
          ) as number;
          
          // Define threshold distance in meters - only show popup if click is within this distance of the boundary edge
          const BOUNDARY_CLICK_THRESHOLD_METERS = 150;
          
          if (distance <= BOUNDARY_CLICK_THRESHOLD_METERS) {
            // Prevent ALL event handling - stop propagation and default behavior
            event.stopPropagation();
            if (event.native) {
              event.native.stopImmediatePropagation();
              event.native.preventDefault();
            }
            
            // Show popup with a slight delay to ensure event handling is complete
            if (view.popup) {
              setTimeout(() => {
                // Create a standalone graphic (not from the layer) to avoid popupEnabled: false issues
                const popupGraphic = new Graphic({
                  geometry: clickPoint,
                  attributes: {
                    title: 'Jack and Laura Dangermond Preserve',
                    description: '2019 boundary inclusive of Coast Guard 33 acres at Point Conception.'
                  },
                  popupTemplate: new PopupTemplate({
                    title: '{title}',
                    content: '{description}'
                  })
                });
                
                view.popup?.open({
                  features: [popupGraphic],
                  location: clickPoint,
                  fetchFeatures: false
                });
              }, 50);
            }
          } else {
            // Beyond threshold - prevent any default popup behavior
            event.stopPropagation();
          }
        }
      } catch (error) {
        console.error('Error in boundary click handler:', error);
      }
    });
    
    return () => clickHandler.remove();
  }, [view, activeLayerIds]);

  // Effect to update TNC observations on map when data changes
  useEffect(() => {
    if (view) {
      const tncObservationsLayer = view.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
      if (tncObservationsLayer) {
        // Clear existing graphics first (important: do this even if tncObservations is empty)
        tncObservationsLayer.removeAll();
        
        // Only add markers if we have observations to show
        if (tncObservations.length > 0) {
          // Filter TNC observations based on visible categories (show all if none set yet)
          const filteredTNCObservations = tncObservations.filter(obs => {
            const iconicTaxon = normalizeTNCCategoryToIconicTaxon(obs.taxon_category_name);
            const normalizedTaxon = iconicTaxon.toLowerCase(); // Normalize for comparison
            return visibleObservationCategories.size === 0 || visibleObservationCategories.has(normalizedTaxon);
          });
          
          // Add filtered TNC observations to map
          filteredTNCObservations.forEach(obs => {
          if (obs.geometry?.coordinates) {
            const [longitude, latitude] = obs.geometry.coordinates;
            
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });

            // Get emoji based on taxon category
            const emoji = getTNCObservationEmoji(obs.taxon_category_name);
            
            // Create symbol with emoji icon
            const symbol = new PictureMarkerSymbol({
              url: getEmojiDataUri(emoji),
              width: '32px',
              height: '32px'
            });

            // Create rich popup template
            const popupTemplate = new PopupTemplate({
              title: obs.common_name || obs.scientific_name,
              content: buildTNCPopupContent(obs)
            });

            // Create graphic with click handler
            const graphic = new Graphic({
              geometry: point,
              symbol: symbol,
              popupTemplate: popupTemplate,
              attributes: {
                observation_id: obs.observation_id,
                taxon_category: obs.taxon_category_name,
                scientific_name: obs.scientific_name,
                common_name: obs.common_name,
                observed_on: obs.observed_on,
                user_name: obs.user_name
              }
            });

            tncObservationsLayer.add(graphic);
            
            // Debug: Log first few coordinates
            if (filteredTNCObservations.indexOf(obs) < 3) {
      // console.log(`TNC Observation ${obs.observation_id}: ${obs.scientific_name} at [${longitude}, ${latitude}]`);
            }
          }
        });
        
      // console.log(`✅ TNC iNaturalist: Updated map with ${filteredTNCObservations.length}/${tncObservations.length} filtered observation records`);
      // console.log(`TNC Layer graphics count: ${tncObservationsLayer.graphics.length}`);
        } else {
      // console.log(`🧹 TNC iNaturalist: Cleared map (no observations to display)`);
        }
      }
    }
  }, [view, tncObservations, visibleObservationCategories]);

  // Sync visibleObservationCategories with iconicTaxa filter from App.tsx
  // Empty array [] means "show all" - this is the canonical representation
  useEffect(() => {
    console.log('🗺️ MapView useEffect: iconicTaxa sync triggered', {
      iconicTaxa,
      iconicTaxaLength: iconicTaxa?.length,
      currentObservationsCount: currentObservations.length,
      tncObservationsCount: tncObservations.length
    });
    
    if (iconicTaxa && iconicTaxa.length > 0) {
      // Specific taxa selected - convert to lowercase for consistent matching
      const normalizedTaxa = new Set(iconicTaxa.map(t => t.toLowerCase()));
      console.log('  → Setting specific taxa:', Array.from(normalizedTaxa));
      setVisibleObservationCategories(normalizedTaxa);
    } else {
      // Empty array [] or undefined means "show all available categories"
      const allCategories = new Set<string>();
      currentObservations.forEach(obs => {
        const iconicTaxon = obs.taxon?.iconic_taxon_name || 'unknown';
        allCategories.add(iconicTaxon.toLowerCase());
      });
      tncObservations.forEach(obs => {
        const iconicTaxon = normalizeTNCCategoryToIconicTaxon(obs.taxon_category_name);
        allCategories.add(iconicTaxon.toLowerCase());
      });
      console.log('  → Setting ALL categories (empty array = show all):', Array.from(allCategories));
      setVisibleObservationCategories(allCategories);
    }
  }, [iconicTaxa, currentObservations, tncObservations]);

  // Effect to update eBird observations on map when data changes
  useEffect(() => {
    if (view) {
      const eBirdObservationsLayer = view.map?.findLayerById('ebird-observations') as GraphicsLayer;
      if (eBirdObservationsLayer) {
        // Clear existing graphics first (important: do this even if eBirdObservations is empty)
        eBirdObservationsLayer.removeAll();
        
        // Only add markers if we have observations to show
        if (eBirdObservations.length > 0) {
          // Add eBird observations to map
          eBirdObservations.forEach(obs => {
          if (obs.geometry?.coordinates) {
            const [longitude, latitude] = obs.geometry.coordinates;
            
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });

            // Create symbol - bird emoji for eBird observations
            const symbol = new PictureMarkerSymbol({
              url: getEmojiDataUri('🐦'),
              width: '28px',
              height: '28px'
            });

            // Create popup template
            const popupTemplate = new PopupTemplate({
              title: obs.common_name || obs.scientific_name,
              content: `
                <div style="font-family: sans-serif;">
                  <p><strong>Scientific Name:</strong> ${obs.scientific_name}</p>
                  ${obs.common_name ? `<p><strong>Common Name:</strong> ${obs.common_name}</p>` : ''}
                  <p><strong>Count:</strong> ${obs.count_observed}</p>
                  <p><strong>Date:</strong> ${obs.observation_date}</p>
                  ${obs.obstime ? `<p><strong>Time:</strong> ${obs.obstime}</p>` : ''}
                  <p><strong>Location:</strong> ${obs.location_name}</p>
                  <p><strong>County:</strong> ${obs.county}, ${obs.state}</p>
                  <p><strong>Protocol:</strong> ${obs.protocol_name}</p>
                  <p><strong>Data Source:</strong> ${obs.data_source}</p>
                  <p><strong>Coordinates:</strong> ${obs.lat.toFixed(6)}, ${obs.lng.toFixed(6)}</p>
                </div>
              `
            });

            // Create graphic
            const graphic = new Graphic({
              geometry: point,
              symbol: symbol,
              popupTemplate: popupTemplate,
              attributes: {
                obs_id: obs.obs_id,
                common_name: obs.common_name,
                scientific_name: obs.scientific_name,
                observation_date: obs.observation_date,
                location_name: obs.location_name
              }
            });

            eBirdObservationsLayer.add(graphic);
            
            // Debug: Log first few coordinates
            if (eBirdObservations.indexOf(obs) < 3) {
      // console.log(`eBird Observation ${obs.obs_id}: ${obs.scientific_name} at [${longitude}, ${latitude}]`);
            }
          }
        });
        
      // console.log(`✅ eBird: Updated map with ${eBirdObservations.length} observation records`);
      // console.log(`eBird Layer graphics count: ${eBirdObservationsLayer.graphics.length}`);
        } else {
      // console.log(`🧹 eBird: Cleared map (no observations to display)`);
        }
      }
    }
  }, [view, eBirdObservations]);

  // Add click handler for TNC observations
  useEffect(() => {
    if (view) {
      const clickHandler = view.on('click', (event) => {
        view.hitTest(event).then((response) => {
          const tncGraphic = response.results.find(result => 
            'graphic' in result && result.graphic && result.graphic.layer?.id === 'tnc-inaturalist-observations'
          );
          
          if (tncGraphic && 'graphic' in tncGraphic && onTNCObservationSelect) {
            const observationId = tncGraphic.graphic.attributes.observation_id;
            const observation = tncObservations.find(obs => obs.observation_id === observationId);
            onTNCObservationSelect(observation || null);
          }
        });
      });

      return () => {
        clickHandler.remove();
      };
    }
  }, [view, tncObservations, onTNCObservationSelect]);

  // Add click handler for Public API iNaturalist observations
  useEffect(() => {
    if (view) {
      const clickHandler = view.on('click', (event) => {
        view.hitTest(event).then((response) => {
          const inatGraphic = response.results.find(result => 
            'graphic' in result && result.graphic && result.graphic.layer?.id === 'inaturalist-observations'
          );
          
          if (inatGraphic && 'graphic' in inatGraphic && onINaturalistObservationSelect) {
            const observationId = inatGraphic.graphic.attributes.id;
            const observation = currentObservationsRef.current.find(obs => obs.id === observationId);
            if (observation) {
              onINaturalistObservationSelect(observation);
            }
          }
        });
      });

      return () => {
        clickHandler.remove();
      };
    }
  }, [view, onINaturalistObservationSelect]);

  // Add click handler for eBird observations
  useEffect(() => {
    if (view) {
      const clickHandler = view.on('click', (event) => {
        view.hitTest(event).then((response) => {
          const eBirdGraphic = response.results.find(result => 
            'graphic' in result && result.graphic && result.graphic.layer?.id === 'ebird-observations'
          );
          
          if (eBirdGraphic && 'graphic' in eBirdGraphic && onEBirdObservationSelect) {
            const obsId = eBirdGraphic.graphic.attributes.obs_id;
            const observation = eBirdObservations.find(obs => obs.obs_id === obsId);
            onEBirdObservationSelect(observation || null);
          }
        });
      });

      return () => {
        clickHandler.remove();
      };
    }
  }, [view, eBirdObservations, onEBirdObservationSelect]);

  const loadObservations = async (_mapView: __esri.MapView, observationsLayer: GraphicsLayer, filters?: ObservationsFilters) => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      await loadObservationsImpl({
        mapView: _mapView,
        observationsLayer,
        visibleCategories: visibleObservationCategories,
        onUpdate: onObservationsUpdate,
        onLocalUpdate: setCurrentObservations,
        drawSearchArea: drawSearchAreaRectangle
      }, filters);
    } catch (error) {
      console.error('Error loading iNaturalist observations:', error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const loadCalFloraData = async (_mapView: __esri.MapView, calFloraLayer: GraphicsLayer, filters?: CalFloraFilters) => {
    onCalFloraLoadingChange?.(true);
    try {
      await loadCalFloraDataImpl({
        mapView: _mapView,
        calFloraLayer,
        onUpdate: onCalFloraUpdate,
        drawSearchArea: drawSearchAreaRectangle
      }, filters);
    } catch (error) {
      console.error('Error loading CalFlora data:', error);
    } finally {
      onCalFloraLoadingChange?.(false);
    }
  };

  // Expose method to reload observations with filters
  const reloadObservations = (filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
  }) => {
    if (view && view.map) {
      const observationsLayer = view.map.findLayerById('inaturalist-observations') as GraphicsLayer;
      if (observationsLayer) {
        loadObservations(view, observationsLayer, filters);
      }
    }
  };

  // Expose method to reload CalFlora data with filters
  const reloadCalFloraData = (filters?: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
  }) => {
    if (view && view.map) {
      const calFloraLayer = view.map.findLayerById('calflora-plants') as GraphicsLayer;
      if (calFloraLayer) {
        loadCalFloraData(view, calFloraLayer, filters);
      }
    }
  };

  const loadEBirdObservations = async (_mapView: __esri.MapView, eBirdObservationsLayer: GraphicsLayer, filters?: EBirdFilters) => {
    onEBirdLoadingChange?.(true);
    try {
      await loadEBirdObservationsImpl({
        mapView: _mapView,
        eBirdLayer: eBirdObservationsLayer,
        onUpdate: onEBirdObservationsUpdate,
        drawSearchArea: drawSearchAreaRectangle
      }, filters);
    } catch (error) {
      console.error('Error loading eBird observations:', error);
    } finally {
      onEBirdLoadingChange?.(false);
    }
  };

  const loadTNCObservations = async (_mapView: __esri.MapView, tncObservationsLayer: GraphicsLayer, filters?: TNCObservationsFilters) => {
    onTNCLoadingChange?.(true);
    try {
      await loadTNCObservationsImpl({
        mapView: _mapView,
        tncObservationsLayer,
        onUpdate: onTNCObservationsUpdate,
        drawSearchArea: drawSearchAreaRectangle
      }, filters);
    } catch (error) {
      console.error('Error loading TNC observations:', error);
    } finally {
      onTNCLoadingChange?.(false);
    }
  };

  const reloadTNCObservations = (filters?: {
    taxonCategories?: string[];
    startDate?: string;
    endDate?: string;
    maxResults?: number;
    useFilters?: boolean;
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    showSearchArea?: boolean;
    customPolygon?: string;
  }) => {
    if (view && view.map) {
      const tncObservationsLayer = view.map.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
      if (tncObservationsLayer) {
        loadTNCObservations(view, tncObservationsLayer, filters);
      }
    }
  };

  const reloadEBirdObservations = (filters?: {
    startDate?: string;
    endDate?: string;
    maxResults?: number;
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
  }) => {
    if (view && view.map) {
      const eBirdObservationsLayer = view.map.findLayerById('ebird-observations') as GraphicsLayer;
      if (eBirdObservationsLayer) {
        loadEBirdObservations(view, eBirdObservationsLayer, filters);
      }
    }
  };

  const loadAnimlObservations = async (_mapView: __esri.MapView, animlLayer: GraphicsLayer, filters?: {
    deployments?: AnimlDeployment[];
    imageLabels?: AnimlImageLabel[];
    viewMode?: 'camera-centric' | 'animal-centric';
    startDate?: string;
    endDate?: string;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
    showSearchArea?: boolean;
  }) => {
    onAnimlLoadingChange?.(true);
    try {
      // Clear other layers when starting a new Animl search
      const observationsLayer = _mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
      const tncObservationsLayer = _mapView.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
      const calFloraLayer = _mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
      const eBirdObservationsLayer = _mapView.map?.findLayerById('ebird-observations') as GraphicsLayer;
      
      if (observationsLayer) {
        observationsLayer.removeAll();
      }
      if (tncObservationsLayer) {
        tncObservationsLayer.removeAll();
      }
      if (calFloraLayer) {
        calFloraLayer.removeAll();
      }
      if (eBirdObservationsLayer) {
        eBirdObservationsLayer.removeAll();
      }
      
      // Handle search area visualization using helper
      await drawSearchAreaRectangle(_mapView, filters?.showSearchArea || false, filters?.searchMode || '');
      
      // Clear existing graphics
      animlLayer.removeAll();
      
      const deployments = filters?.deployments || [];
      
      // Always show deployments (camera locations) on the map, regardless of view mode
      // The view mode only affects what's shown in the sidebar, not the map
      if (deployments.length > 0) {
        deployments.forEach(deployment => {
          if (deployment.geometry && deployment.geometry.coordinates) {
            const [longitude, latitude] = deployment.geometry.coordinates;
            
            // Create point geometry
            const point = new Point({
              longitude,
              latitude
            });
            
            // Create symbol for camera deployment - use camera-on-tripod icon
            const cameraIconSvg = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <!-- Camera body -->
                <rect x="4" y="6" width="16" height="12" rx="2" ry="2"/>
                <!-- Camera lens -->
                <circle cx="12" cy="12" r="3"/>
                <!-- Tripod legs -->
                <line x1="8" y1="18" x2="6" y2="22"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="16" y1="18" x2="18" y2="22"/>
                <!-- Flash/Viewfinder -->
                <rect x="15" y="7" width="3" height="2" rx="0.5"/>
              </svg>
            `;
            
            const symbol = new PictureMarkerSymbol({
              url: `data:image/svg+xml;base64,${btoa(cameraIconSvg)}`,
              width: '28px',
              height: '28px',
              color: [251, 146, 60, 1] // Orange/amber color for camera traps
            });

            // Create popup template
            const popupTemplate = new PopupTemplate({
              title: deployment.name || `Deployment ${deployment.animl_dp_id}`,
              content: `
                <div style="font-family: sans-serif;">
                  <p><strong>Deployment ID:</strong> ${deployment.animl_dp_id}</p>
                  <p><strong>Name:</strong> ${deployment.name || 'N/A'}</p>
                  ${deployment.totalObservations !== undefined ? `<p><strong>Total Observations:</strong> ${deployment.totalObservations}</p>` : ''}
                  ${deployment.uniqueAnimals && deployment.uniqueAnimals.length > 0 ? `<p><strong>Animals Detected:</strong> ${deployment.uniqueAnimals.join(', ')}</p>` : ''}
                  ${deployment.firstObservation ? `<p><strong>First Observation:</strong> ${new Date(deployment.firstObservation).toLocaleDateString()}</p>` : ''}
                  ${deployment.lastObservation ? `<p><strong>Last Observation:</strong> ${new Date(deployment.lastObservation).toLocaleDateString()}</p>` : ''}
                  <p><strong>Coordinates:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
                </div>
              `
            });

            // Create graphic
            const graphic = new Graphic({
              geometry: point,
              symbol: symbol,
              popupTemplate: popupTemplate,
              attributes: {
                id: deployment.id,
                animl_dp_id: deployment.animl_dp_id,
                name: deployment.name,
                type: 'deployment'
              }
            });

            animlLayer.add(graphic);
          }
        });
      }
      
      // Note: We no longer show individual observations on the map - only camera locations
      // The view mode only affects sidebar content, not map markers
      // If you want to show observations in the future, they should be aggregated/grouped by camera
      
    } catch (error) {
      console.error('Error loading Animl observations:', error);
    } finally {
      onAnimlLoadingChange?.(false);
    }
  };

  const reloadAnimlObservations = (filters?: {
    deployments?: AnimlDeployment[];
    imageLabels?: AnimlImageLabel[];
    viewMode?: 'camera-centric' | 'animal-centric';
    startDate?: string;
    endDate?: string;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
    showSearchArea?: boolean;
  }) => {
    if (view && view.map) {
      const animlLayer = view.map.findLayerById('animl-observations') as GraphicsLayer;
      if (animlLayer) {
        loadAnimlObservations(view, animlLayer, filters);
      }
    }
  };

  // Helper to draw search area rectangle for "Dangermond + Margin" spatial filter

  // Clear search area helper
  const clearSearchArea = () => {
    if (!view) return;
    
    const searchAreaLayer = view.map?.findLayerById('search-area-rectangle') as GraphicsLayer;
    if (searchAreaLayer) {
      searchAreaLayer.removeAll();
      searchAreaLayer.visible = false;
      // console.log('✅ Cleared search area rectangle');
    }
  };

  // Clear all observation/data layers (for switching between data sources)
  const clearAllObservationLayers = () => {
    if (!view || !view.map) return;
    
      // console.log('🧹 Clearing all observation layers from map');
    
    const layerIds = [
      'inaturalist-observations',
      'tnc-inaturalist-observations',
      'ebird-observations',
      'calflora-plants',
      'dendra-stations',
      'animl-observations'
    ];
    
    layerIds.forEach(layerId => {
      const layer = view.map?.findLayerById(layerId) as GraphicsLayer;
      if (layer) {
        layer.removeAll();
      // console.log(`  ✓ Cleared ${layerId}`);
      }
    });
    
    // Clear legend state for iNaturalist observations
    setCurrentObservations([]);
    setVisibleObservationCategories(new Set());
  };

  // Highlight observation method using ArcGIS native highlighting
  // Highlight observation (using extracted utility)
  const highlightObservation = (id: number | string) => {
    if (!view) return;
    highlightObservationImpl(id, {
      view,
      highlightHandleRef,
      highlightOperationRef,
      onHighlightChange: setHighlightedObservationId
    });
  };
  
  // Clear observation highlight (using extracted utility)
  const clearObservationHighlight = () => {
    if (!view) return;
    clearObservationHighlightImpl({
      view,
      highlightHandleRef,
      highlightOperationRef,
      onHighlightChange: setHighlightedObservationId
    });
  };

  // Highlight deployment method (similar to highlightObservation)
  const highlightDeployment = (id: number) => {
    if (!view || !view.map) {
      console.warn('❌ View or map not available');
      return;
    }
    
    // Create the async operation
    const operation = (async () => {
      // Wait for any pending highlight operation to complete before clearing
      if (highlightOperationRef.current) {
        await highlightOperationRef.current;
      }
      
      // Now clear any existing highlight
      if (highlightHandleRef.current) {
        highlightHandleRef.current.remove();
        highlightHandleRef.current = null;
      }
      
      // Find the deployment graphic in the Animl layer
      if (!view.map) return;
      const animlLayer = view.map.findLayerById('animl-observations') as GraphicsLayer;
      
      if (!animlLayer) {
        console.warn('❌ Animl observations layer not found');
        return;
      }
      
      // Search for deployment graphic - deployments are stored with deployment_id in attributes
      const targetGraphic = animlLayer.graphics.find(g => 
        g.attributes?.deployment_id === id || g.attributes?.id === id
      );
      
      if (!targetGraphic) {
        console.warn(`❌ Deployment with id ${id} not found on map`);
        return;
      }
      
      try {
        // Check if the deployment is already in view, and pan to it if not
        if (targetGraphic.geometry && view.extent) {
          const deploymentPoint = targetGraphic.geometry as Point;
          
          // Check if the point is contained in the current view extent
          if (!view.extent.contains(deploymentPoint)) {
            try {
              await view.goTo({
                target: deploymentPoint,
                zoom: view.zoom > 14 ? view.zoom : 14 // Use current zoom if already zoomed in, otherwise zoom to 14
              });
            } catch (goToError: any) {
              // Ignore AbortError (user interaction interrupted the pan)
              if (goToError.name !== 'AbortError') {
                console.warn('⚠️ Error panning to deployment:', goToError);
              }
            }
          }
        }
        
        // Ensure the layer is loaded and the layer view is ready
        const layerView = await view.whenLayerView(animlLayer);
        
        // Wait for the layer view to finish any pending updates
        if ((layerView as any).updating) {
          await reactiveUtils.whenOnce(() => !(layerView as any).updating);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Add a small delay to ensure rendering pipeline is stable
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use ArcGIS's native highlight method
        const highlightHandle = (layerView as any).highlight(targetGraphic);
        
        highlightHandleRef.current = highlightHandle;
        
        // Open the popup
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (view && targetGraphic.geometry) {
          try {
            view.openPopup({
              features: [targetGraphic],
              location: targetGraphic.geometry as __esri.Point
            });
          } catch (error) {
            console.error('❌ Error opening popup for deployment:', error);
          }
        }
        
      } catch (error) {
        console.error('❌ Error highlighting Animl deployment:', error);
      }
    })();
    
    // Store the operation so we can wait for it if needed
    highlightOperationRef.current = operation;
  };
  
  // Clear deployment highlight method
  const clearDeploymentHighlight = () => {
    // Remove the ArcGIS native highlight
    if (highlightHandleRef.current) {
      highlightHandleRef.current.remove();
      highlightHandleRef.current = null;
    }
    
    // Close popup
    if (view && view.popup) {
      view.popup.visible = false;
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reloadObservations,
    reloadTNCObservations,
    reloadEBirdObservations,
    reloadCalFloraData,
    reloadAnimlObservations,
    activateDrawMode,
    clearPolygon,
    clearSearchArea,
    clearAllObservationLayers,
    highlightObservation,
    clearObservationHighlight,
    highlightDeployment,
    clearDeploymentHighlight
  }));

  // Custom zoom functions (using extracted utilities)
  const handleZoomIn = () => zoomIn(view);
  const handleZoomOut = () => zoomOut(view);
  const handleFullscreen = () => enterFullscreen(view);

  // Build legend categories from current observations (both regular and TNC)
  // Keys are normalized to lowercase for consistent matching with visibleObservationCategories
  const legendCategories = useMemo(() => {
    // Use plain object instead of Map to avoid conflict with ArcGIS Map class
    const categoryMap: Record<string, { count: number; name: string; emoji: string; group: 'fauna' | 'flora' }> = {};
    
    // Add regular iNaturalist observations
    currentObservations.forEach(obs => {
      const iconicTaxon = obs.taxon?.iconic_taxon_name || 'unknown';
      const normalizedKey = iconicTaxon.toLowerCase(); // Normalize to lowercase for matching
      const iconInfo = getObservationIcon(obs);
      
      if (categoryMap[normalizedKey]) {
        categoryMap[normalizedKey].count++;
      } else {
        // Determine if flora or fauna
        const group = normalizedKey === 'plantae' || normalizedKey === 'fungi' ? 'flora' : 'fauna';
        const name = normalizedKey === 'unknown' ? 'Unknown' : 
                    normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
        
        categoryMap[normalizedKey] = {
          count: 1,
          name: name,
          emoji: iconInfo.emoji,
          group: group
        };
      }
    });
    
    // Add TNC iNaturalist observations (normalized to same iconic taxon names)
    tncObservations.forEach(obs => {
      const iconicTaxon = normalizeTNCCategoryToIconicTaxon(obs.taxon_category_name);
      const normalizedKey = iconicTaxon.toLowerCase(); // Normalize to lowercase for matching
      const emoji = getTNCObservationEmoji(obs.taxon_category_name);
      
      if (categoryMap[normalizedKey]) {
        categoryMap[normalizedKey].count++;
      } else {
        // Determine if flora or fauna
        const group = normalizedKey === 'plantae' || normalizedKey === 'fungi' ? 'flora' : 'fauna';
        const name = normalizedKey === 'unknown' ? 'Unknown' : 
                    normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
        
        categoryMap[normalizedKey] = {
          count: 1,
          name: name,
          emoji: emoji,
          group: group
        };
      }
    });
    
    return Object.entries(categoryMap)
      .map(([key, data]) => ({
        key, // Now lowercase
        name: data.name,
        emoji: data.emoji,
        count: data.count,
        group: data.group
      }))
      .sort((a, b) => {
        // First sort by group: fauna first, then flora
        if (a.group !== b.group) {
          return a.group === 'fauna' ? -1 : 1;
        }
        // Within same group, sort alphabetically by name
        return a.name.localeCompare(b.name);
      });
  }, [currentObservations, tncObservations]);

  // Handlers for legend interactions
  const handleToggleCategory = (categoryKey: string) => {
    const allCategories = legendCategories.map(cat => cat.key);
    const allVisible = allCategories.every(key => visibleObservationCategories.has(key));
    const isCurrentlyVisible = visibleObservationCategories.has(categoryKey);
    
    let newVisible: Set<string>;
    
    // Case 1: All are visible, click one → show only that one
    if (allVisible) {
      newVisible = new Set([categoryKey]);
    }
    // Case 2: Only this one is visible, click it again → show all
    else if (isCurrentlyVisible && visibleObservationCategories.size === 1) {
      newVisible = new Set(allCategories);
    }
    // Case 3: Some are visible, clicking a non-visible one → add it (multi-select)
    else if (!isCurrentlyVisible) {
      newVisible = new Set(visibleObservationCategories);
      newVisible.add(categoryKey);
    }
    // Case 4: Some are visible, clicking a visible one → remove it (unless it would leave none)
    else if (isCurrentlyVisible && visibleObservationCategories.size > 1) {
      newVisible = new Set(visibleObservationCategories);
      newVisible.delete(categoryKey);
    } else {
      return; // No change needed
    }
    
    setVisibleObservationCategories(newVisible);
    
    // Sync with parent filter state
    if (onIconicTaxaChange) {
      // Convert to capitalized format (e.g., 'aves' -> 'Aves')
      const capitalizedTaxa = Array.from(newVisible).map(key => 
        key.charAt(0).toUpperCase() + key.slice(1)
      );
      onIconicTaxaChange(capitalizedTaxa);
    }
  };

  const handleToggleAllCategories = (visible: boolean) => {
    console.log('🗺️ MapView handleToggleAllCategories:', { visible });
    if (visible) {
      // Show all - use empty array as canonical "show all" state
      // The useEffect will then populate visibleObservationCategories with all available taxa
      if (onIconicTaxaChange) {
        console.log('  → Setting iconicTaxa to [] (show all)');
        onIconicTaxaChange([]);
      }
    } else {
      // Hide all - not currently used by the UI, but keeping for completeness
      // Note: with the new pattern, we'd need a different signal for "hide all"
      // For now, setting to a non-existent taxon as a workaround
      setVisibleObservationCategories(new Set());
      if (onIconicTaxaChange) {
        onIconicTaxaChange(['__NONE__']); // Special marker for "hide all"
      }
    }
  };

  return (
    <div id="map-view" data-testid="map-view" className="flex-1 relative">
      {/* ArcGIS Map Container */}
      <div 
        id="arcgis-map-container"
        ref={mapDiv} 
        className="w-full h-full outline-none"
        style={{ minHeight: '400px' }}
      />

      {/* ImageServer Loading Banner - Floating over map */}
      {imageServerLoading && (
        <div 
          id="imageserver-loading-banner"
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 max-w-md w-auto"
          style={{ minWidth: '300px' }}
        >
          <div className={`rounded-lg shadow-xl p-4 border-l-4 ${
            imageServerLoading.hasTimedOut 
              ? 'bg-amber-50 border-amber-500' 
              : imageServerLoading.showSlowWarning
                ? 'bg-orange-50 border-orange-500'
                : 'bg-blue-50 border-blue-500'
          }`}>
            <div className="flex items-start gap-3">
              {!imageServerLoading.hasTimedOut && (
                <div className="flex-shrink-0 mt-0.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold mb-1 ${
                  imageServerLoading.hasTimedOut ? 'text-amber-900' : imageServerLoading.showSlowWarning ? 'text-orange-900' : 'text-blue-900'
                }`}>
                  {imageServerLoading.hasTimedOut 
                    ? '⏱️ Large Image Service - Still Loading (>30s)' 
                    : imageServerLoading.showSlowWarning 
                      ? '⏳ Layer Taking Longer Than Expected (>10s)'
                      : '🗺️ Loading High-Resolution Imagery'}
                </p>
                <p className={`text-xs mb-2 ${
                  imageServerLoading.hasTimedOut ? 'text-amber-800' : imageServerLoading.showSlowWarning ? 'text-orange-800' : 'text-blue-800'
                }`}>
                  <strong>{imageServerLoading.layerTitle}</strong>
                </p>
                <p className={`text-xs ${
                  imageServerLoading.hasTimedOut ? 'text-amber-700' : imageServerLoading.showSlowWarning ? 'text-orange-700' : 'text-blue-700'
                }`}>
                  {imageServerLoading.hasTimedOut 
                    ? 'This layer is taking longer than expected (>30s). The service may be slow or overloaded. Layer will timeout after 45 seconds.' 
                    : imageServerLoading.showSlowWarning
                      ? 'This layer is taking longer than 10 seconds to load. Will timeout after 45 seconds if not loaded.'
                      : 'This large imagery service may load slowly. Please wait...'}
                </p>
              </div>
              <button
                onClick={() => {
                  // Dismiss banner (timeout refs managed inside useTNCArcGISLayers hook)
                  setImageServerLoading(null);
                }}
                className={`flex-shrink-0 p-1 rounded hover:bg-opacity-20 transition-colors ${
                  imageServerLoading.hasTimedOut 
                    ? 'hover:bg-amber-900' 
                    : imageServerLoading.showSlowWarning
                      ? 'hover:bg-orange-900'
                      : 'hover:bg-blue-900'
                }`}
                title="Dismiss"
              >
                <svg className={`w-4 h-4 ${
                  imageServerLoading.hasTimedOut ? 'text-amber-700' : imageServerLoading.showSlowWarning ? 'text-orange-700' : 'text-blue-700'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layer Load Error Banner - Persistent red error message */}
      {layerLoadError && (
        <div 
          id="layer-error-banner"
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 max-w-md w-auto"
          style={{ minWidth: '300px' }}
        >
          <div className="rounded-lg shadow-xl p-4 border-l-4 bg-red-50 border-red-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1 text-red-900">
                  ❌ Failed to Load Layer
                </p>
                <p className="text-xs mb-2 text-red-800">
                  <strong>{layerLoadError.layerTitle}</strong>
                </p>
                <p className="text-xs text-red-700">
                  {layerLoadError.errorMessage}
                </p>
              </div>
              <button
                onClick={() => {
                  setLayerLoadError(null);
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-red-900 hover:bg-opacity-20 transition-colors"
                title="Dismiss"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div id="map-loading-overlay" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 z-20 max-w-sm">
          <div id="map-loading-content" className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2">
              <div id="map-loading-spinner" className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span id="map-loading-text" className="text-sm text-gray-700 font-medium">Loading observations...</span>
            </div>
            <div id="map-loading-note" className="text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                To respect iNaturalist's API rate limits, this process may take some time for large date ranges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Map Controls */}
      <div id="map-controls" className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
        <button 
          id="zoom-in-btn"
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <span className="text-gray-600 font-bold text-lg">+</span>
        </button>
        <button 
          id="zoom-out-btn"
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <span className="text-gray-600 font-bold text-lg">−</span>
        </button>
        <button 
          id="fullscreen-btn"
          onClick={handleFullscreen}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          title="Fullscreen"
        >
          <span className="text-gray-600 text-sm">⛶</span>
        </button>
        <button 
          id="basemap-toggle-btn"
          onClick={() => setCurrentBasemap(prev => prev === 'hybrid' ? 'topo-vector' : 'hybrid')}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          title={`Switch to ${currentBasemap === 'hybrid' ? 'Topo' : 'Satellite'} view`}
        >
          {currentBasemap === 'hybrid' ? (
            <MapIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <Satellite className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Drawn Polygon Indicator & Clear Button */}
      {drawnPolygon && (
        <div id="polygon-indicator" className="absolute bottom-16 right-4 bg-white rounded-lg shadow-md p-3 z-10 flex items-center space-x-3">
          <div id="polygon-status" className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700 font-medium">Custom area drawn</span>
          </div>
          <button
            id="clear-polygon-btn"
            onClick={clearPolygon}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors flex items-center space-x-1"
            title="Clear drawn area (or press Delete)"
          >
            <span>✕</span>
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Draw Mode Active Indicator */}
      {isDrawMode && (
        <div id="draw-mode-indicator" className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white rounded-lg shadow-lg p-3 z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-pulse">✏️</div>
            <span className="text-sm font-medium">Click on map to draw polygon. Double-click to finish.</span>
          </div>
        </div>
      )}

      {/* Floating Legend Panel */}
      {(() => {
        // Get active layers with legend data
        const activeLayers = tncArcGISItems.filter(item => 
          activeLayerIds.includes(item.id) && 
          item.legendData && 
          item.uiPattern === 'MAP_LAYER'
        );

        if (activeLayers.length === 0) return null;

        // Handler for legend filtering - using FeatureLayerView (client-side)
        const handleLegendFilter = async (itemId: string, field: string, selectedValues: (string | number)[]) => {
          const layer = tncArcGISLayersRef.current.get(itemId);
          if (!layer || !view) return;
          
          try {
            const layerView = await view.whenLayerView(layer) as any;
            
            if (selectedValues.length === 0) {
              // Clear filter - show all features
              layerView.filter = null;
            } else {
              // Create client-side filter using SQL WHERE clause
              // Match field values that start with the selected value (e.g., "1950-1959" matches "1950")
              const conditions = selectedValues.map(v => `${field} LIKE '${v}%'`).join(' OR ');
              const whereClause = selectedValues.length > 1 ? `(${conditions})` : conditions;
              
              layerView.filter = {
                where: whereClause
              };
            }
          } catch (error) {
            console.error(`Error applying legend filter:`, error);
          }
        };

        return (
          <div 
            id="floating-legend-panel"
            className="absolute bottom-8 right-4 bg-white rounded-lg shadow-lg z-10 max-w-sm overflow-hidden"
            style={{ maxHeight: '60vh' }}
          >
            {/* Legend Header */}
            <div 
              id="legend-panel-header"
              className="flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            >
              <h3 className="text-sm font-semibold text-gray-900">
                Legend {activeLayers.length > 1 && `(${activeLayers.length} layers)`}
              </h3>
              <button 
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLegendExpanded(!isLegendExpanded);
                }}
              >
                {isLegendExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>

            {/* Legend Content */}
            {isLegendExpanded && (
              <div 
                id="legend-panel-content"
                className="overflow-y-auto"
                style={{ maxHeight: 'calc(60vh - 60px)' }}
              >
                {activeLayers.map((item, index) => (
                  <div 
                    key={item.id}
                    id={`legend-layer-${item.id}`}
                    className={`p-1 ${index < activeLayers.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    {/* Layer name if multiple layers */}
                    {activeLayers.length > 1 && (
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        {item.title}
                      </h4>
                    )}
                    <LayerLegend 
                      legend={item.legendData} 
                      isCompact={activeLayers.length > 1}
                      layerOpacity={layerOpacities[item.id] ?? 80}
                      onFilterChange={(selectedValues) => {
                        // Get the field name from the renderer to use for filtering
                        const layer = tncArcGISLayersRef.current.get(item.id);
                        if (layer && 'renderer' in layer) {
                          const renderer = (layer as any).renderer;
                          
                          if (renderer?.type === 'unique-value') {
                            // Extract field name from either direct field or valueExpression
                            let fieldName = renderer.field;
                            
                            if (!fieldName && renderer.valueExpression) {
                              // Extract field from valueExpression like "Left($feature.DECADES, 4)"
                              const match = renderer.valueExpression.match(/\$feature\.(\w+)/);
                              if (match) {
                                fieldName = match[1];
                              }
                            }
                            
                            if (fieldName) {
                              handleLegendFilter(item.id, fieldName, selectedValues);
                            }
                          }
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Map Legend for iNaturalist Observations (both regular and TNC) */}
      {(currentObservations.length > 0 || tncObservations.length > 0) && (
        <MapLegend
          categories={legendCategories}
          visibleCategories={visibleObservationCategories}
          onToggleCategory={handleToggleCategory}
          onToggleAll={handleToggleAllCategories}
        />
      )}
    </div>
  );
});

export default MapViewComponent;
