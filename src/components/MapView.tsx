import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import StreamLayer from '@arcgis/core/layers/StreamLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { iNaturalistAPI, iNaturalistObservation } from '../services/iNaturalistService';
import { tncINaturalistService, TNCArcGISObservation } from '../services/tncINaturalistService';
import { calFloraAPI, CalFloraPlant } from '../services/calFloraService';
import { TNCArcGISItem, tncArcGISAPI } from '../services/tncArcGISService';
import { eBirdService, EBirdObservation } from '../services/eBirdService';
import LayerLegend from './LayerLegend';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MapViewProps {
  onObservationsUpdate?: (observations: iNaturalistObservation[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  tncObservations?: TNCArcGISObservation[];
  onTNCObservationsUpdate?: (observations: TNCArcGISObservation[]) => void;
  onTNCLoadingChange?: (loading: boolean) => void;
  selectedTNCObservation?: TNCArcGISObservation | null;
  onTNCObservationSelect?: (observation: TNCArcGISObservation | null) => void;
  eBirdObservations?: EBirdObservation[];
  onEBirdObservationsUpdate?: (observations: EBirdObservation[]) => void;
  onEBirdLoadingChange?: (loading: boolean) => void;
  calFloraPlants?: CalFloraPlant[];
  onCalFloraUpdate?: (plants: CalFloraPlant[]) => void;
  onCalFloraLoadingChange?: (loading: boolean) => void;
  // TNC ArcGIS Hub layer management
  tncArcGISItems?: TNCArcGISItem[];
  activeLayerIds?: string[];
  layerOpacities?: Record<string, number>;
  onLayerLoadComplete?: (itemId: string) => void;
  onLayerLoadError?: (itemId: string) => void;
  onLegendDataFetched?: (itemId: string, legendData: any) => void;
  // Draw mode props
  isDrawMode?: boolean;
  onDrawModeChange?: (isDrawMode: boolean) => void;
  onPolygonDrawn?: (polygon: __esri.Polygon) => void;
  onPolygonCleared?: () => void;
}

export interface MapViewRef {
  reloadObservations: (filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
    customPolygon?: string;
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
  }) => void;
  reloadCalFloraData: (filters?: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
    customPolygon?: string;
  }) => void;
  activateDrawMode: () => void;
  clearPolygon: () => void;
}

const MapViewComponent = forwardRef<MapViewRef, MapViewProps>(({ 
  onObservationsUpdate, 
  onLoadingChange,
  tncObservations = [],
  onTNCObservationsUpdate,
  onTNCLoadingChange,
  selectedTNCObservation,
  onTNCObservationSelect,
  eBirdObservations = [],
  onEBirdObservationsUpdate,
  onEBirdLoadingChange,
  calFloraPlants = [],
  onCalFloraUpdate,
  onCalFloraLoadingChange,
  tncArcGISItems = [],
  activeLayerIds = [],
  layerOpacities = {},
  onLayerLoadComplete,
  onLayerLoadError,
  onLegendDataFetched,
  isDrawMode = false,
  onDrawModeChange,
  onPolygonDrawn,
  onPolygonCleared
}, ref) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const tncArcGISLayersRef = useRef<globalThis.Map<string, __esri.Layer>>(new globalThis.Map());
  const [drawnPolygon, setDrawnPolygon] = useState<__esri.Polygon | null>(null);
  const drawingPointsRef = useRef<number[][]>([]);
  const clickHandlerRef = useRef<__esri.Handle | null>(null);
  const pointerMoveHandlerRef = useRef<__esri.Handle | null>(null);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  // CalFlora state is managed by parent component via props

  // Helper to build TNC popup content with photo carousel and attribution
  const buildTNCPopupContent = (obs: TNCArcGISObservation) => {
    const imageUrls = tncINaturalistService.parseImageUrlsFromObservation(obs);
    const attribution = tncINaturalistService.getPhotoAttribution(obs);

    return () => {
      const container = document.createElement('div');
      container.className = 'tnc-observation-popup';

      // Photo section
      if (imageUrls.length > 0) {
        const photoWrapper = document.createElement('div');
        photoWrapper.style.display = 'flex';
        photoWrapper.style.flexDirection = 'column';
        photoWrapper.style.alignItems = 'center';
        photoWrapper.style.marginBottom = '8px';

        const img = document.createElement('img');
        img.src = imageUrls[0];
        img.alt = obs.common_name || obs.scientific_name || 'Observation photo';
        img.loading = 'lazy';
        img.style.maxWidth = '260px';
        img.style.borderRadius = '6px';
        img.style.objectFit = 'cover';
        img.onerror = () => { img.style.display = 'none'; };

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.alignItems = 'center';
        controls.style.justifyContent = 'space-between';
        controls.style.width = '100%';
        controls.style.maxWidth = '260px';
        controls.style.marginTop = '6px';

        let currentIndex = 0;
        const label = document.createElement('span');
        label.style.fontSize = '12px';
        label.style.color = '#4b5563';
        label.textContent = `Photo ${currentIndex + 1} of ${imageUrls.length}`;

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '◀';
        prevBtn.style.fontSize = '12px';
        prevBtn.style.padding = '2px 6px';
        prevBtn.style.border = '1px solid #e5e7eb';
        prevBtn.style.borderRadius = '4px';
        prevBtn.style.background = 'white';
        prevBtn.disabled = imageUrls.length <= 1;
        prevBtn.onclick = () => {
          currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
          img.src = imageUrls[currentIndex];
          label.textContent = `Photo ${currentIndex + 1} of ${imageUrls.length}`;
        };

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '▶';
        nextBtn.style.fontSize = '12px';
        nextBtn.style.padding = '2px 6px';
        nextBtn.style.border = '1px solid #e5e7eb';
        nextBtn.style.borderRadius = '4px';
        nextBtn.style.background = 'white';
        nextBtn.disabled = imageUrls.length <= 1;
        nextBtn.onclick = () => {
          currentIndex = (currentIndex + 1) % imageUrls.length;
          img.src = imageUrls[currentIndex];
          label.textContent = `Photo ${currentIndex + 1} of ${imageUrls.length}`;
        };

        controls.appendChild(prevBtn);
        controls.appendChild(label);
        controls.appendChild(nextBtn);

        photoWrapper.appendChild(img);
        photoWrapper.appendChild(controls);

        if (attribution) {
          const credit = document.createElement('div');
          credit.textContent = attribution;
          credit.style.fontSize = '11px';
          credit.style.color = '#6b7280';
          credit.style.marginTop = '4px';
          photoWrapper.appendChild(credit);
        }

        container.appendChild(photoWrapper);
      } else {
        const noPhoto = document.createElement('div');
        noPhoto.textContent = 'No photo available';
        noPhoto.style.fontSize = '12px';
        noPhoto.style.color = '#6b7280';
        noPhoto.style.marginBottom = '8px';
        container.appendChild(noPhoto);
      }

      // Add details (reuse existing markup for taxonomy and links)
      const details = document.createElement('div');
      details.innerHTML = `
        <div class="popup-header">
          <h3>${obs.common_name || obs.scientific_name}</h3>
          ${obs.common_name && obs.scientific_name ? `<p class="scientific-name"><em>${obs.scientific_name}</em></p>` : ''}
        </div>
        <div class="popup-details">
          <p><strong>Taxon Category:</strong> ${obs.taxon_category_name}</p>
          <p><strong>Observed:</strong> ${new Date(obs.observed_on).toLocaleDateString()}</p>
          <p><strong>Observer:</strong> ${obs.user_name}</p>
          <p><strong>Taxon ID:</strong> ${obs.taxon_id}</p>
        </div>
        <div class="taxonomic-hierarchy">
          <h4>Taxonomic Classification</h4>
          <div class="taxonomy-grid">
            ${obs.taxon_kingdom_name ? `<div><strong>Kingdom:</strong> ${obs.taxon_kingdom_name}</div>` : ''}
            ${obs.taxon_phylum_name ? `<div><strong>Phylum:</strong> ${obs.taxon_phylum_name}</div>` : ''}
            ${obs.taxon_class_name ? `<div><strong>Class:</strong> ${obs.taxon_class_name}</div>` : ''}
            ${obs.taxon_order_name ? `<div><strong>Order:</strong> ${obs.taxon_order_name}</div>` : ''}
            ${obs.taxon_family_name ? `<div><strong>Family:</strong> ${obs.taxon_family_name}</div>` : ''}
            ${obs.taxon_genus_name ? `<div><strong>Genus:</strong> ${obs.taxon_genus_name}</div>` : ''}
            ${obs.taxon_species_name ? `<div><strong>Species:</strong> ${obs.taxon_species_name}</div>` : ''}
          </div>
        </div>
        <div class="popup-actions">
          ${obs.observation_uuid ? 
            `<a href="https://www.inaturalist.org/observations/${obs.observation_uuid}" target="_blank" class="popup-link">View on iNaturalist →</a>` : 
            `<span class="popup-link-disabled" style="color: #999; font-size: 13px;">iNaturalist link not available</span>`}
        </div>
      `;
      container.appendChild(details);

      // Basic styles for the popup content
      const style = document.createElement('style');
      style.textContent = `
        .tnc-observation-popup { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px; }
        .popup-header h3 { margin: 0 0 5px 0; color: #2c3e50; font-size: 16px; }
        .scientific-name { margin: 0 0 10px 0; color: #7f8c8d; font-size: 14px; }
        .popup-details p { margin: 5px 0; font-size: 13px; }
        .taxonomic-hierarchy { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
        .taxonomic-hierarchy h4 { margin: 0 0 10px 0; font-size: 14px; color: #34495e; }
        .taxonomy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 12px; }
        .taxonomy-grid div { padding: 2px 0; }
        .popup-actions { margin-top: 15px; padding-top: 15px; border-top: 1px solid #ecf0f1; }
        .popup-link { color: #3498db; text-decoration: none; font-size: 13px; font-weight: 500; }
        .popup-link:hover { text-decoration: underline; }
      `;
      container.appendChild(style);

      return container;
    };
  };

  useEffect(() => {
    if (mapDiv.current) {
      // Create the map with a free satellite-style basemap
      // 'hybrid' provides satellite imagery with labels and is free to use
      const map = new Map({
        basemap: 'hybrid'
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
        popupTemplate: new PopupTemplate({
          title: 'Jack and Laura Dangermond Preserve',
          content: '2019 boundary inclusive of Coast Guard 33 acres at Point Conception.'
        })
      });

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

      map.add(observationsLayer);
      map.add(tncObservationsLayer);
      map.add(eBirdObservationsLayer);
      map.add(calFloraLayer);

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

  // Effect to manage TNC ArcGIS Hub map layers
  useEffect(() => {
    if (!view) return;

    const handleLayerLoading = async () => {
      // Get active items that should be displayed
      const activeItems = tncArcGISItems.filter(item => 
        activeLayerIds.includes(item.id) && item.uiPattern === 'MAP_LAYER'
      );

      // Remove layers that are no longer active
      const layersToRemove: string[] = [];
      tncArcGISLayersRef.current.forEach((_layer: __esri.Layer, itemId: string) => {
        if (!activeLayerIds.includes(itemId)) {
          layersToRemove.push(itemId);
        }
      });

      layersToRemove.forEach(itemId => {
        const layer = tncArcGISLayersRef.current.get(itemId);
        if (layer && view.map) {
          view.map.remove(layer);
          tncArcGISLayersRef.current.delete(itemId);
          console.log(`🗑️ Removed TNC layer: ${itemId}`);
        }
      });

      // Add new layers that aren't already loaded
      for (const item of activeItems) {
        if (!tncArcGISLayersRef.current.has(item.id)) {
          try {
            // Comprehensive service type detection and layer creation
            const url = item.url;
            let layer: __esri.Layer | null = null;
            const layerConfig = {
              id: `tnc-layer-${item.id}`,
              url: url,
              title: item.title,
              opacity: (layerOpacities[item.id] ?? 80) / 100
            };

            // Detect service type and create appropriate layer
            // Order matters: check more specific patterns first
            
            if (url.includes('/SceneServer')) {
              // 3D scene service (buildings, 3D objects, meshes, point clouds)
              layer = new SceneLayer(layerConfig);
              console.log(`🏗️ Creating SceneLayer for: ${item.title}`);
              
            } else if (url.includes('/StreamServer')) {
              // Real-time streaming data service (WebSocket-based)
              layer = new StreamLayer(layerConfig);
              console.log(`📡 Creating StreamLayer for: ${item.title}`);
              
            } else if (url.includes('/VectorTileServer')) {
              // Vector tile service (modern styleable basemaps)
              layer = new VectorTileLayer(layerConfig);
              console.log(`🗺️ Creating VectorTileLayer for: ${item.title}`);
              
            } else if (url.includes('/ImageServer')) {
              // Image service - need to distinguish between dynamic and tiled
              if (url.includes('tiledimageservices')) {
                // Tiled image service (pre-cached tiles for performance)
                layer = new ImageryTileLayer(layerConfig);
                console.log(`🎨 Creating ImageryTileLayer (cached) for: ${item.title}`);
              } else {
                // Dynamic image service (on-the-fly processing)
                layer = new ImageryLayer(layerConfig);
                console.log(`🎨 Creating ImageryLayer (dynamic) for: ${item.title}`);
              }
              
            } else if (url.includes('/MapServer')) {
              // Map service - typically use MapImageLayer
              // Note: Could potentially check for cached/tiled capabilities and use TileLayer
              // but MapImageLayer handles both dynamic and cached services well
              layer = new MapImageLayer(layerConfig);
              console.log(`🗺️ Creating MapImageLayer for: ${item.title}`);
              
            } else if (url.includes('/FeatureServer')) {
              // Feature service (vector data: points, lines, polygons)
              // Check if URL has a layer index (e.g., /FeatureServer/0)
              const hasLayerIndex = /\/FeatureServer\/\d+/.test(url);
              
              if (!hasLayerIndex) {
                // No layer index specified - need to query the service to find the first available layer
                console.log(`🔍 FeatureServer URL missing layer index, querying service for: ${item.title}`);
                try {
                  const serviceResponse = await fetch(`${url}?f=json`);
                  const serviceData = await serviceResponse.json();
                  
                  if (serviceData.layers && serviceData.layers.length > 0) {
                    // Use the first available layer ID
                    const firstLayerId = serviceData.layers[0].id;
                    layerConfig.url = `${url}/${firstLayerId}`;
                    console.log(`✓ Using layer index ${firstLayerId} for: ${item.title}`);
                  } else {
                    console.warn(`⚠️ No layers found in FeatureServer for: ${item.title}`);
                  }
                } catch (err) {
                  console.warn(`⚠️ Could not query FeatureServer metadata for: ${item.title}`, err);
                }
              }
              
              layer = new FeatureLayer(layerConfig);
              console.log(`📍 Creating FeatureLayer for: ${item.title}`);
              
            } else {
              // Unknown service type - log detailed warning
              console.warn(`⚠️ Unknown service type for "${item.title}". URL: ${url}`);
              console.warn(`   Supported types: FeatureServer, MapServer, ImageServer, VectorTileServer, SceneServer, StreamServer`);
              console.warn(`   This layer will be skipped. Please contact the data provider if this is unexpected.`);
            }

            if (layer) {
              // Load the layer and check for errors
              try {
                await layer.load();
                
                if (view.map) {
                  view.map.add(layer);
                  tncArcGISLayersRef.current.set(item.id, layer);
                  console.log(`✅ Added TNC layer: ${item.title}`);
                  
                  // Fetch legend data for layers that support it
                  if (url.includes('/FeatureServer') || url.includes('/MapServer') || url.includes('/ImageServer')) {
                    try {
                      // Extract layer ID from the configured layer URL (FeatureServer and MapServer)
                      const layerIdMatch = layerConfig.url.match(/\/(\d+)$/);
                      const layerId = layerIdMatch ? parseInt(layerIdMatch[1]) : 0;
                      
                      const legendData = await tncArcGISAPI.fetchLegendInfo(url, layerId);
                      if (legendData) {
                        console.log(`🎨 Legend data fetched for: ${item.title}`);
                        onLegendDataFetched?.(item.id, legendData);
                      }
                    } catch (legendErr) {
                      console.warn(`⚠️ Could not fetch legend for ${item.title}:`, legendErr);
                    }
                  }
                  
                  // Wait for the layer to be rendered before removing loading spinner
                  try {
                    const layerView = await view.whenLayerView(layer);
                    
                    // Watch for when the layer is done updating (rendering)
                    layerView.when(() => {
                      // Wait for initial rendering to complete
                      const watchHandle = layerView.watch('updating', (isUpdating: boolean) => {
                        if (!isUpdating) {
                          // Layer has finished rendering
                          console.log(`🎨 Layer rendered: ${item.title}`);
                          onLayerLoadComplete?.(item.id);
                          watchHandle.remove(); // Stop watching once rendered
                        }
                      });
                    });
                  } catch (layerViewErr) {
                    // If we can't get the layerView, still complete the loading
                    console.warn(`⚠️ Could not get layerView for "${item.title}", but layer was added`);
                    onLayerLoadComplete?.(item.id);
                  }
                }
              } catch (err: any) {
                // Handle specific error cases
                if (err?.message?.includes('400') || err?.details?.httpStatus === 400) {
                  console.warn(`⚠️ Skipping incompatible layer "${item.title}": This layer may be retired or use an incompatible projection. Please contact the data provider to update the catalog.`);
                } else {
                  console.warn(`⚠️ Could not load TNC layer "${item.title}":`, err.message);
                }
                
                // Notify parent that layer failed to load
                onLayerLoadError?.(item.id);
                // Don't throw - continue loading other layers
              }
            } else {
              console.warn(`⚠️ Could not determine layer type for: ${item.title} (${url})`);
              // Notify parent that layer failed to load
              onLayerLoadError?.(item.id);
            }
          } catch (error) {
            console.error(`❌ Error loading TNC layer ${item.title}:`, error);
            // Notify parent that layer failed to load
            onLayerLoadError?.(item.id);
            // Don't throw - continue loading other layers
          }
        } else {
          // Update opacity for existing layer
          const layer = tncArcGISLayersRef.current.get(item.id);
          if (layer && 'opacity' in layer) {
            (layer as any).opacity = (layerOpacities[item.id] ?? 80) / 100;
          }
        }
      }
    };

    handleLayerLoading();
  }, [view, tncArcGISItems, activeLayerIds, layerOpacities]);

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
      
      console.log('✅ Draw layer initialized successfully');
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
      
      console.log(`Point ${drawingPointsRef.current.length} added`);
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
        console.log('✅ Polygon completed with', drawingPointsRef.current.length, 'points');
      }
    });
    
    onDrawModeChange?.(true);
    console.log('✏️ Draw mode activated - Click to add points, double-click to finish');
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
      console.log('🗑️ Polygon cleared');
    }
  };

  // Effect to handle CalFlora data when provided via props
  useEffect(() => {
    if (view && calFloraPlants.length > 0) {
      const calFloraLayer = view.map?.findLayerById('calflora-plants') as GraphicsLayer;
      if (calFloraLayer) {
        // Clear existing graphics
        calFloraLayer.removeAll();
        
        // Add CalFlora plants to map
        calFloraPlants.forEach(plant => {
          if (plant.geojson?.coordinates) {
            const [longitude, latitude] = plant.geojson.coordinates;
            
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });

            // Choose symbol based on native status
            const getPlantSymbol = (nativeStatus: string) => {
              switch (nativeStatus) {
                case 'native':
                  return new SimpleMarkerSymbol({
                    style: 'circle',
                    color: [34, 197, 94, 0.8], // Green for native
                    size: '10px',
                    outline: {
                      color: 'white',
                      width: 2
                    }
                  });
                case 'invasive':
                  return new SimpleMarkerSymbol({
                    style: 'triangle',
                    color: [239, 68, 68, 0.8], // Red for invasive
                    size: '12px',
                    outline: {
                      color: 'white',
                      width: 2
                    }
                  });
                default:
                  return new SimpleMarkerSymbol({
                    style: 'square',
                    color: [156, 163, 175, 0.8], // Gray for unknown
                    size: '8px',
                    outline: {
                      color: 'white',
                      width: 1
                    }
                  });
              }
            };

            const symbol = getPlantSymbol(plant.nativeStatus);

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
        
        console.log(`✅ CalFlora: Updated map with ${calFloraPlants.length} plant records`);
      }
    }
  }, [view, calFloraPlants]);

  // Effect to update TNC observations on map when data changes
  useEffect(() => {
    if (view && tncObservations.length > 0) {
      const tncObservationsLayer = view.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
      if (tncObservationsLayer) {
        // Clear existing graphics
        tncObservationsLayer.removeAll();
        
        // Add TNC observations to map
        tncObservations.forEach(obs => {
          if (obs.geometry?.coordinates) {
            const [longitude, latitude] = obs.geometry.coordinates;
            
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });

            // Get color based on taxon category
            const color = tncINaturalistService.getTaxonColor(obs.taxon_category_name);
            
            // Create symbol - highlight selected observation
            const isSelected = selectedTNCObservation?.observation_id === obs.observation_id;
            const symbol = new SimpleMarkerSymbol({
              style: 'circle',
              color: color,
              size: isSelected ? '14px' : '10px',
              outline: {
                color: isSelected ? '#FFD700' : 'white',
                width: isSelected ? 3 : 1.5
              }
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
            if (tncObservations.indexOf(obs) < 3) {
              console.log(`TNC Observation ${obs.observation_id}: ${obs.scientific_name} at [${longitude}, ${latitude}]`);
            }
          }
        });
        
        console.log(`✅ TNC iNaturalist: Updated map with ${tncObservations.length} observation records`);
        console.log(`TNC Layer graphics count: ${tncObservationsLayer.graphics.length}`);
      }
    }
  }, [view, tncObservations, selectedTNCObservation]);

  // Effect to update eBird observations on map when data changes
  useEffect(() => {
    if (view && eBirdObservations.length > 0) {
      const eBirdObservationsLayer = view.map?.findLayerById('ebird-observations') as GraphicsLayer;
      if (eBirdObservationsLayer) {
        // Clear existing graphics
        eBirdObservationsLayer.removeAll();
        
        // Add eBird observations to map
        eBirdObservations.forEach(obs => {
          if (obs.geometry?.coordinates) {
            const [longitude, latitude] = obs.geometry.coordinates;
            
            const point = new Point({
              longitude: longitude,
              latitude: latitude
            });

            // Create symbol - red color for birds
            const symbol = new SimpleMarkerSymbol({
              style: 'circle',
              color: '#d62728', // Red color for birds
              size: '10px',
              outline: {
                color: 'white',
                width: 1.5
              }
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
              console.log(`eBird Observation ${obs.obs_id}: ${obs.scientific_name} at [${longitude}, ${latitude}]`);
            }
          }
        });
        
        console.log(`✅ eBird: Updated map with ${eBirdObservations.length} observation records`);
        console.log(`eBird Layer graphics count: ${eBirdObservationsLayer.graphics.length}`);
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

  const loadObservations = async (_mapView: __esri.MapView, observationsLayer: GraphicsLayer, filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
    customPolygon?: string;
  }) => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      // Clear both iNaturalist and CalFlora layers when starting a new search
      // This ensures no old data from different sources remains visible
      const calFloraLayer = _mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
      if (calFloraLayer) {
        calFloraLayer.removeAll();
      }
      
      // Calculate appropriate maxResults based on date range
      let maxResults = 500; // Default for short ranges
      
      if (filters?.startDate && filters?.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Scale maxResults based on date range (roughly 15-20 observations per day on average)
        if (daysDiff > 365) {
          maxResults = Math.min(5000, daysDiff * 15); // Cap at 5000 for very long ranges
        } else if (daysDiff > 90) {
          maxResults = Math.min(2000, daysDiff * 18);
        } else if (daysDiff > 30) {
          maxResults = Math.min(1000, daysDiff * 20);
        }
      } else if (filters?.daysBack) {
        // Use daysBack for calculation
        if (filters.daysBack > 365) {
          maxResults = Math.min(5000, filters.daysBack * 15);
        } else if (filters.daysBack > 90) {
          maxResults = Math.min(2000, filters.daysBack * 18);
        } else if (filters.daysBack > 30) {
          maxResults = Math.min(1000, filters.daysBack * 20);
        }
      }
      
      console.log(`Using maxResults: ${maxResults} for date range`);
      
      const response = await iNaturalistAPI.getRecentObservations({
        perPage: 200,
        daysBack: filters?.daysBack || 30,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        qualityGrade: filters?.qualityGrade,
        iconicTaxa: filters?.iconicTaxa,
        maxResults
      });
      
      setObservations(response.results);
      
      // Clear existing graphics
      observationsLayer.removeAll();
      
      // Filter by custom polygon if provided (client-side filtering for iNaturalist Public API)
      let filteredResults = response.results;
      if (filters?.customPolygon) {
        try {
          const polygonGeometry = JSON.parse(filters.customPolygon);
          const polygon = new Polygon({
            rings: polygonGeometry.rings,
            spatialReference: polygonGeometry.spatialReference
          });
          
          filteredResults = response.results.filter(obs => {
            if (obs.geojson && obs.geojson.coordinates) {
              const point = new Point({
                longitude: obs.geojson.coordinates[0],
                latitude: obs.geojson.coordinates[1],
                spatialReference: { wkid: 4326 }
              });
              return polygon.contains(point);
            }
            return false;
          });
          
          console.log(`🎯 Filtered ${response.results.length} observations to ${filteredResults.length} within custom polygon`);
        } catch (error) {
          console.error('Error filtering by custom polygon:', error);
          filteredResults = response.results;
        }
      }
      
      // Update parent with filtered results
      onObservationsUpdate?.(filteredResults);
      
      // Add observations to map
      filteredResults.forEach(obs => {
        if (obs.geojson && obs.geojson.coordinates) {
          const [longitude, latitude] = obs.geojson.coordinates;
          
          // Create point geometry
          const point = new Point({
            longitude,
            latitude
          });

          // Get icon based on taxon type
          const iconInfo = getObservationIcon(obs);
          
          // Create symbol
          const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: iconInfo.color,
            size: '12px',
            outline: {
              color: 'white',
              width: 2
            }
          });

          // Get the best available photo URL for popup
          let popupPhotoUrl = null;
          if (obs.photos && obs.photos.length > 0) {
            popupPhotoUrl = obs.photos[0].medium_url || obs.photos[0].square_url || obs.photos[0].url;
          } else if (obs.taxon?.default_photo) {
            popupPhotoUrl = obs.taxon.default_photo.medium_url || obs.taxon.default_photo.square_url;
          }

          // Create popup template
          const popupTemplate = new PopupTemplate({
            title: obs.taxon?.preferred_common_name || obs.taxon?.name || 'Unknown Species',
            content: `
              <div class="observation-popup">
                <p><strong>Scientific Name:</strong> ${obs.taxon?.name || 'Unknown'}</p>
                <p><strong>Observed:</strong> ${new Date(obs.observed_on).toLocaleDateString()}</p>
                <p><strong>Observer:</strong> ${obs.user.login}</p>
                <p><strong>Quality Grade:</strong> ${obs.quality_grade}</p>
                ${(obs.geoprivacy === 'obscured' || obs.geoprivacy === 'private') ? 
                  '<p style="color: #f59e0b; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 4px; margin: 8px 0;">📍 Location obscured for privacy/conservation</p>' : 
                  ''}
                ${popupPhotoUrl ? `<img src="${popupPhotoUrl}" alt="Observation photo" style="max-width: 200px; border-radius: 4px; margin: 8px 0;" onerror="this.style.display='none';">` : '<p style="color: #666; font-style: italic;">No photo available</p>'}
                <p><a href="${obs.uri}" target="_blank" style="color: #007AC2;">View on iNaturalist</a></p>
              </div>
            `
          });

          // Create graphic
          const graphic = new Graphic({
            geometry: point,
            symbol: symbol,
            popupTemplate: popupTemplate,
            attributes: {
              id: obs.id,
              taxonName: obs.taxon?.name,
              commonName: obs.taxon?.preferred_common_name,
              observedOn: obs.observed_on,
              observer: obs.user.login
            }
          });

          observationsLayer.add(graphic);
        }
      });
      
    } catch (error) {
      console.error('Error loading iNaturalist observations:', error);
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  const loadCalFloraData = async (_mapView: __esri.MapView, calFloraLayer: GraphicsLayer, filters?: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
    customPolygon?: string;
  }) => {
    onCalFloraLoadingChange?.(true);
    
    try {
      const { maxResults = 1000, plantType = 'all', customPolygon } = filters || {};
      
      let allPlants: CalFloraPlant[] = [];
      
      // Clear both CalFlora and iNaturalist layers when starting a new search
      // This ensures no old data from different sources remains visible
      const observationsLayer = _mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
      if (observationsLayer) {
        observationsLayer.removeAll();
      }
      
      // Load plant data using the unified method
      console.log('Loading CalFlora plant data...');
      const response = await calFloraAPI.getAllPlants({ 
        maxResults, 
        plantType,
        customPolygon
        // No county filter - get all plants from Dangermond dataset
      });
      allPlants.push(...response.results);

      // Clear existing graphics
      calFloraLayer.removeAll();
      
      // Update state via parent callback
      onCalFloraUpdate?.(allPlants);

      // Add graphics to map
      allPlants.forEach(plant => {
        if (plant.geojson?.coordinates) {
          const [longitude, latitude] = plant.geojson.coordinates;
          
          const point = new Point({
            longitude: longitude,
            latitude: latitude
          });

          // Choose symbol based on native status
          const getPlantSymbol = (nativeStatus: string) => {
            switch (nativeStatus) {
              case 'native':
                return new SimpleMarkerSymbol({
                  style: 'circle',
                  color: [34, 197, 94, 0.8], // Green for native
                  size: '10px',
                  outline: {
                    color: 'white',
                    width: 2
                  }
                });
              case 'invasive':
                return new SimpleMarkerSymbol({
                  style: 'triangle',
                  color: [239, 68, 68, 0.8], // Red for invasive
                  size: '12px',
                  outline: {
                    color: 'white',
                    width: 2
                  }
                });
              default:
                return new SimpleMarkerSymbol({
                  style: 'square',
                  color: [156, 163, 175, 0.8], // Gray for unknown
                  size: '8px',
                  outline: {
                    color: 'white',
                    width: 1
                  }
                });
            }
          };

          const symbol = getPlantSymbol(plant.nativeStatus);

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
      
      console.log(`✅ CalFlora: Added ${allPlants.length} plant records to map`);
      
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

  const loadEBirdObservations = async (_mapView: __esri.MapView, eBirdObservationsLayer: GraphicsLayer, filters?: {
    startDate?: string;
    endDate?: string;
    maxResults?: number;
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
  }) => {
    onEBirdLoadingChange?.(true);
    try {
      // Clear other layers when starting a new eBird search
      const observationsLayer = _mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
      const tncObservationsLayer = _mapView.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
      const calFloraLayer = _mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
      
      if (observationsLayer) {
        observationsLayer.removeAll();
      }
      if (tncObservationsLayer) {
        tncObservationsLayer.removeAll();
      }
      if (calFloraLayer) {
        calFloraLayer.removeAll();
      }
      
      const response = await eBirdService.queryObservations({
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        maxResults: filters?.maxResults || 2000,
        page: filters?.page,
        pageSize: filters?.pageSize,
        searchMode: filters?.searchMode || 'expanded',
        customPolygon: filters?.customPolygon
      });
      
      onEBirdObservationsUpdate?.(response.observations);
      
      // Clear existing graphics
      eBirdObservationsLayer.removeAll();
      
      // Add eBird observations to map
      response.observations.forEach(obs => {
        if (obs.geometry && obs.geometry.coordinates) {
          const [longitude, latitude] = obs.geometry.coordinates;
          
          // Create point geometry
          const point = new Point({
            longitude,
            latitude
          });
          
          // Create symbol - using red color for birds
          const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: '#d62728', // Red color for birds
            size: '10px',
            outline: {
              color: 'white',
              width: 1.5
            }
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
        }
      });
      
      console.log(`Added ${response.observations.length} eBird observations to map`);
      
    } catch (error) {
      console.error('Error loading eBird observations:', error);
    } finally {
      onEBirdLoadingChange?.(false);
    }
  };

  const loadTNCObservations = async (_mapView: __esri.MapView, tncObservationsLayer: GraphicsLayer, filters?: {
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
    onTNCLoadingChange?.(true);
    try {
      // Clear other layers when starting a new TNC search
      const observationsLayer = _mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
      const calFloraLayer = _mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
      const searchAreaLayer = _mapView.map?.findLayerById('search-area-rectangle') as GraphicsLayer;
      
      if (observationsLayer) {
        observationsLayer.removeAll();
      }
      if (calFloraLayer) {
        calFloraLayer.removeAll();
      }
      
      // Handle search area visualization
      if (searchAreaLayer) {
        searchAreaLayer.removeAll();
        
        if (filters?.showSearchArea && filters?.searchMode === 'expanded') {
          // Get the expanded search extent and create a rectangle graphic
          const extent = await tncINaturalistService.getPreserveExtent('expanded');
          
          // Create a polygon rectangle from the extent coordinates
          const rectangle = new Polygon({
            rings: [[
              [extent.xmin, extent.ymin], // Bottom-left
              [extent.xmax, extent.ymin], // Bottom-right
              [extent.xmax, extent.ymax], // Top-right
              [extent.xmin, extent.ymax], // Top-left
              [extent.xmin, extent.ymin]  // Close the ring
            ]],
            spatialReference: { wkid: 4326 }
          });
          
          const rectangleGraphic = new Graphic({
            geometry: rectangle,
            symbol: new SimpleFillSymbol({
              color: [255, 165, 0, 0.15], // Orange with low opacity
              outline: {
                color: [255, 165, 0, 0.9], // Orange outline
                width: 3,
                style: 'dash'
              }
            }),
            popupTemplate: new PopupTemplate({
              title: 'TNC Search Area (Expanded)',
              content: `This rectangle shows the expanded search area around the Dangermond Preserve.<br/>
                       Coordinates: ${extent.xmin.toFixed(3)}, ${extent.ymin.toFixed(3)} to ${extent.xmax.toFixed(3)}, ${extent.ymax.toFixed(3)}`
            })
          });
          
          searchAreaLayer.add(rectangleGraphic);
          searchAreaLayer.visible = true;
          console.log('✅ Added search area rectangle:', extent);
        } else {
          searchAreaLayer.visible = false;
        }
      }
      
      const response = await tncINaturalistService.queryObservations({
        taxonCategories: filters?.taxonCategories,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        maxResults: filters?.maxResults || 2000,
        useFilters: filters?.useFilters !== undefined ? filters.useFilters : true,
        page: filters?.page,
        pageSize: filters?.pageSize,
        searchMode: filters?.searchMode || 'expanded',
        customPolygon: filters?.customPolygon
      });
      
      onTNCObservationsUpdate?.(response);
      
      // Clear existing graphics
      tncObservationsLayer.removeAll();
      
      // Add TNC observations to map
      response.forEach(obs => {
        if (obs.geometry && obs.geometry.coordinates) {
          const [longitude, latitude] = obs.geometry.coordinates;
          
          // Create point geometry
          const point = new Point({
            longitude,
            latitude
          });

          // Get color based on taxon category
          const color = tncINaturalistService.getTaxonColor(obs.taxon_category_name);
          
          // Create symbol
          const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: color,
            size: '10px',
            outline: {
              color: 'white',
              width: 1.5
            }
          });

          // Create rich popup template with taxonomic hierarchy
          const popupTemplate = new PopupTemplate({
            title: obs.common_name || obs.scientific_name,
            content: buildTNCPopupContent(obs)
          });

          // Create graphic
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
        }
      });
      
      console.log(`Added ${response.length} TNC iNaturalist observations to map`);
      
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reloadObservations,
    reloadTNCObservations,
    reloadEBirdObservations,
    reloadCalFloraData,
    activateDrawMode,
    clearPolygon
  }));

  const getObservationIcon = (obs: iNaturalistObservation) => {
    const iconicTaxon = obs.taxon?.iconic_taxon_name?.toLowerCase();
    
    switch (iconicTaxon) {
      case 'aves':
        return { color: '#4A90E2', emoji: '🐦' };
      case 'mammalia':
        return { color: '#8B4513', emoji: '🦌' };
      case 'reptilia':
        return { color: '#228B22', emoji: '🦎' };
      case 'amphibia':
        return { color: '#32CD32', emoji: '🐸' };
      case 'actinopterygii':
        return { color: '#1E90FF', emoji: '🐟' };
      case 'insecta':
        return { color: '#FFD700', emoji: '🦋' };
      case 'arachnida':
        return { color: '#800080', emoji: '🕷️' };
      case 'plantae':
        return { color: '#228B22', emoji: '🌱' };
      case 'mollusca':
        return { color: '#DDA0DD', emoji: '🐚' };
      default:
        return { color: '#666666', emoji: '🔍' };
    }
  };

  // Custom zoom functions
  const handleZoomIn = () => {
    if (view) {
      view.goTo({
        zoom: view.zoom + 1
      });
    }
  };

  const handleZoomOut = () => {
    if (view) {
      view.goTo({
        zoom: view.zoom - 1
      });
    }
  };

  const handleFullscreen = () => {
    if (view && view.container) {
      const element = view.container as HTMLElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    }
  };

  return (
    <div id="map-view" className="flex-1 relative">
      {/* ArcGIS Map Container */}
      <div 
        id="arcgis-map-container"
        ref={mapDiv} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

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

      {/* Observations Count */}
      {observations.length > 0 && (
        <div id="map-observations-counter" className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-2 z-10">
          <span id="map-observations-count-text" className="text-xs text-gray-600">
            {observations.length} recent observations
          </span>
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

        return (
          <div 
            id="floating-legend-panel"
            className="absolute bottom-8 right-4 bg-white rounded-lg shadow-lg z-10 max-w-sm"
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
                    <LayerLegend legend={item.legendData} isCompact={activeLayers.length > 1} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
});

export default MapViewComponent;
