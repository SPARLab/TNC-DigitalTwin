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
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { iNaturalistAPI, iNaturalistObservation } from '../services/iNaturalistService';
import { tncINaturalistService, TNCArcGISObservation } from '../services/tncINaturalistService';
import { calFloraAPI, CalFloraPlant } from '../services/calFloraService';
import { TNCArcGISItem, tncArcGISAPI } from '../services/tncArcGISService';
import { eBirdService, EBirdObservation } from '../services/eBirdService';
import type { DendraStation } from '../types';
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
  loadingLayerIds?: string[]; // Track which layers are loading (for synchronizing banner with eye icon)
  layerOpacities?: Record<string, number>;
  onLayerLoadComplete?: (itemId: string) => void;
  onLayerLoadError?: (itemId: string) => void;
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
  activateDrawMode: () => void;
  clearPolygon: () => void;
  clearSearchArea: () => void;
  clearAllObservationLayers: () => void;
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
  loadingLayerIds = [],
  layerOpacities = {},
  onLayerLoadComplete,
  onLayerLoadError,
  onLegendDataFetched,
  dendraStations = [],
  selectedDendraStationId,
  onDendraStationClick,
  isDrawMode = false,
  onDrawModeChange,
  onPolygonDrawn,
  onPolygonCleared
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
  const [imageServerLoading, setImageServerLoading] = useState<{
    isLoading: boolean;
    itemId: string;
    layerTitle: string;
    hasTimedOut: boolean;
  } | null>(null);
  const imageServerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // CalFlora state is managed by parent component via props

  // Synchronize ImageServer banner with loadingLayerIds (same as eye icon timing)
  useEffect(() => {
    if (imageServerLoading && !loadingLayerIds.includes(imageServerLoading.itemId)) {
      // The item finished loading (removed from loadingLayerIds) - dismiss banner NOW
      // console.log(`   ✅ ImageServer finished loading (synchronized with eye icon): ${imageServerLoading.layerTitle}`);
      setImageServerLoading(null);
      if (imageServerTimeoutRef.current) {
        clearTimeout(imageServerTimeoutRef.current);
        imageServerTimeoutRef.current = null;
      }
    }
  }, [loadingLayerIds, imageServerLoading]);

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

      map.add(observationsLayer);
      map.add(tncObservationsLayer);
      map.add(eBirdObservationsLayer);
      map.add(calFloraLayer);
      map.add(dendraStationsLayer);

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
          // console.log(`🗑️ Removing TNC layer: ${itemId} (${layer.title})`);
          
          // Clear ImageServer loading state if this layer was loading
          if (imageServerLoading?.itemId === itemId) {
            // console.log(`   🧹 Clearing ImageServer loading banner for removed layer`);
            setImageServerLoading(null);
            if (imageServerTimeoutRef.current) {
              clearTimeout(imageServerTimeoutRef.current);
              imageServerTimeoutRef.current = null;
            }
          }
          
          // Remove from map first
          view.map.remove(layer);
          
          // Destroy the layer to free resources and ensure it's fully cleaned up
          if (typeof (layer as any).destroy === 'function') {
            // console.log(`   💥 Destroying layer instance`);
            (layer as any).destroy();
          }
          
          // Remove from our tracking map
          tncArcGISLayersRef.current.delete(itemId);
          // console.log(`   ✅ Layer removed successfully`);
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
              opacity: (layerOpacities[item.id] ?? 80) / 100,
              popupEnabled: true  // Enable auto-generated popups for all fields
            };

            // Detect service type and create appropriate layer
            // Order matters: check more specific patterns first
            
            if (url.includes('/SceneServer')) {
              // 3D scene service (buildings, 3D objects, meshes, point clouds)
              layer = new SceneLayer(layerConfig);
      // console.log(`🏗️ Creating SceneLayer for: ${item.title}`);
              
            } else if (url.includes('/StreamServer')) {
              // Real-time streaming data service (WebSocket-based)
              layer = new StreamLayer(layerConfig);
      // console.log(`📡 Creating StreamLayer for: ${item.title}`);
              
            } else if (url.includes('/VectorTileServer')) {
              // Vector tile service (modern styleable basemaps)
              layer = new VectorTileLayer(layerConfig);
      // console.log(`🗺️ Creating VectorTileLayer for: ${item.title}`);
              
            } else if (url.includes('/ImageServer')) {
              // Image service - need to distinguish between dynamic and tiled
              if (url.includes('tiledimageservices')) {
                // Tiled image service (pre-cached tiles for performance)
                layer = new ImageryTileLayer(layerConfig);
      // console.log(`🎨 Creating ImageryTileLayer (cached) for: ${item.title}`);
              } else {
                // Dynamic image service (on-the-fly processing) - these can be slow
                layer = new ImageryLayer(layerConfig);
      // console.log(`🎨 Creating ImageryLayer (dynamic) for: ${item.title}`);
      // console.log(`   URL: ${url}`);
      // console.log(`   ⏳ This untiled image service may take 30-60s to load`);
                
                // Show loading banner for large untiled image services
                setImageServerLoading({
                  isLoading: true,
                  itemId: item.id, // Track by item ID for precise synchronization
                  layerTitle: item.title,
                  hasTimedOut: false
                });
                
                // Set 30-second timeout warning
                if (imageServerTimeoutRef.current) {
                  clearTimeout(imageServerTimeoutRef.current);
                }
                imageServerTimeoutRef.current = setTimeout(() => {
                  setImageServerLoading(prev => {
                    if (prev && prev.isLoading && prev.itemId === item.id) {
                      return { ...prev, hasTimedOut: true };
                    }
                    return prev;
                  });
                }, 30000); // 30 seconds
              }
              
            } else if (url.includes('/MapServer')) {
              // Map service - use MapImageLayer
              // MapImageLayer can show specific sublayers using the sublayers property
              const mapLayerConfig: any = { ...layerConfig };
              
              // If a specific layer is selected, configure sublayers to only show that one
              if (item.selectedLayerId !== undefined && item.availableLayers && item.availableLayers.length > 1) {
                mapLayerConfig.sublayers = [{
                  id: item.selectedLayerId,
                  visible: true
                  // Note: Popup templates will be created after layer loads using createPopupTemplate()
                }];
      // console.log(`🗺️ Creating MapImageLayer with sublayer ${item.selectedLayerId} for: ${item.title}`);
              } else {
      // console.log(`🗺️ Creating MapImageLayer (all layers) for: ${item.title}`);
              }
              
              layer = new MapImageLayer(mapLayerConfig);
              
            } else if (url.includes('/FeatureServer')) {
              // Feature service (vector data: points, lines, polygons)
              // Check if URL has a layer index (e.g., /FeatureServer/0)
              const hasLayerIndex = /\/FeatureServer\/\d+/.test(url);
              
              if (!hasLayerIndex) {
                // No layer index specified - use selectedLayerId if available, otherwise use first layer
                const layerId = item.selectedLayerId ?? 0;
                
                // If we have available layers info, use that; otherwise query the service
                if (item.availableLayers && item.availableLayers.length > 0) {
                  layerConfig.url = `${url}/${layerId}`;
      // console.log(`✓ Using layer ${layerId} for: ${item.title}`);
                } else {
                  // Query the service to find available layers
      // console.log(`🔍 FeatureServer URL missing layer index, querying service for: ${item.title}`);
                  try {
                    const serviceResponse = await fetch(`${url}?f=json`);
                    const serviceData = await serviceResponse.json();
                    
                    if (serviceData.layers && serviceData.layers.length > 0) {
                      // Use selectedLayerId if it exists in the layers, otherwise use first
                      const targetLayerId = serviceData.layers.find((l: any) => l.id === layerId) 
                        ? layerId 
                        : serviceData.layers[0].id;
                      layerConfig.url = `${url}/${targetLayerId}`;
      // console.log(`✓ Using layer index ${targetLayerId} for: ${item.title}`);
                    } else {
                      console.warn(`⚠️ No layers found in FeatureServer for: ${item.title}`);
                    }
                  } catch (err) {
                    console.warn(`⚠️ Could not query FeatureServer metadata for: ${item.title}`, err);
                  }
                }
              }
              
              layer = new FeatureLayer(layerConfig);
      // console.log(`📍 Creating FeatureLayer for: ${item.title} (will create popup template after load)`);
              
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
                
                // Disable scale-dependent rendering restrictions
                // Many layers have arbitrary scale restrictions that prevent them from displaying
                // We override these to allow users to view layers at any zoom level
                if ('minScale' in layer || 'maxScale' in layer) {
                  const originalScale = {
                    minScale: (layer as any).minScale,
                    maxScale: (layer as any).maxScale
                  };
                  
                  if (originalScale.minScale || originalScale.maxScale) {
                    (layer as any).minScale = 0;  // 0 = no minimum scale (always visible when zoomed out)
                    (layer as any).maxScale = 0;  // 0 = no maximum scale (always visible when zoomed in)
                  }
                }
                
                // FIX: Reconstruct unique-value renderers with native ArcGIS classes
                // Some FeatureServer layers have renderers that don't render without reconstruction
                if (url.includes('/FeatureServer') && 'renderer' in layer) {
                  try {
                    const featureLayer = layer as any;
                    if (featureLayer.renderer?.type === 'unique-value') {
                      const uniqueValueInfos = featureLayer.renderer.uniqueValueInfos || [];
                      
                      if (uniqueValueInfos.length > 0) {
                        // Import renderer classes
                        const { default: UniqueValueRenderer } = await import('@arcgis/core/renderers/UniqueValueRenderer');
                        const { default: SimpleFillSymbol } = await import('@arcgis/core/symbols/SimpleFillSymbol');
                        
                        const field = featureLayer.renderer.field;
                        
                        // Check if we need a valueExpression by sampling actual data
                        let needsValueExpression = false;
                        let sampleFieldValues: string[] = [];
                        
                        try {
                          const sampleQuery = await featureLayer.queryFeatures({
                            where: '1=1',
                            outFields: [field],
                            returnGeometry: false,
                            num: 10
                          });
                          
                          sampleFieldValues = sampleQuery.features.map((f: any) => f.attributes[field]);
                          const uniqueActual = [...new Set(sampleFieldValues)];
                          const rendererValues = uniqueValueInfos.map((info: any) => info.value);
                          
                          // Check if field values are longer and start with renderer values
                          // Example: field has "2020-January 2025", renderer expects "2020"
                          const exactMatches = uniqueActual.filter((actual: string) => 
                            rendererValues.includes(actual)
                          );
                          
                          const prefixMatches = uniqueActual.filter((actual: string) => 
                            rendererValues.some((rv: string) => actual.startsWith(rv))
                          );
                          
                          // If we have prefix matches but not exact matches, we need valueExpression
                          if (prefixMatches.length > 0 && exactMatches.length === 0) {
                            needsValueExpression = true;
                            // console.log(`🔧 Layer "${item.title}" needs valueExpression (field values are longer than renderer values)`);
                            // console.log(`   Expected:`, rendererValues);
                            // console.log(`   Actual:`, uniqueActual);
                          } else {
                            // console.log(`✓ Layer "${item.title}" values match exactly (no valueExpression needed)`);
                          }
                        } catch (e) {
                          // console.warn(`⚠️ Could not determine if valueExpression is needed for ${item.title}:`, e);
                        }
                        
                        // Reconstruct each symbol, preserving original style (patterns)
                        const reconstructedInfos = uniqueValueInfos.map((info: any) => {
                          const color = info.symbol?.color;
                          const outline = info.symbol?.outline;
                          const style = info.symbol?.style || 'solid';  // Preserve patterns like 'backward-diagonal'
                          
                          return {
                            value: info.value,
                            label: info.label || info.value,
                            symbol: new SimpleFillSymbol({
                              style: style,  // Use original pattern style
                              color: color ? [color.r, color.g, color.b, Math.max(0.3, color.a || 0.5)] : [200, 200, 200, 0.5],
                              outline: outline ? {
                                color: [outline.color.r, outline.color.g, outline.color.b, Math.max(0.5, outline.color.a || 0.8)],
                                width: outline.width || 1
                              } : {
                                color: [128, 128, 128, 0.8],
                                width: 0.5
                              }
                            })
                          };
                        });
                        
                        // Only use valueExpression for layers where field values don't match exactly
                        // Example: fire perimeters with "2020-January 2025" → "2020"
                        const newRenderer = needsValueExpression 
                          ? new UniqueValueRenderer({
                              valueExpression: `Left($feature.${field}, 4)`,  // Extract first 4 chars (the year)
                              uniqueValueInfos: reconstructedInfos
                            })
                          : new UniqueValueRenderer({
                              field: field,  // Use field directly for exact matching
                              uniqueValueInfos: reconstructedInfos
                            });
                        
                        featureLayer.renderer = newRenderer;
                      }
                    }
                  } catch (err) {
                    console.warn(`⚠️ Could not reconstruct renderer for ${item.title}:`, err);
                  }
                }
                
                // For FeatureLayer, create a popup template showing all fields
                if (url.includes('/FeatureServer') && 'fields' in layer) {
                  const featureLayer = layer as __esri.FeatureLayer;
                  
                  if (!featureLayer.popupTemplate && featureLayer.fields) {
                    try {
                      // Try using createPopupTemplate() if available
                      if (typeof (featureLayer as any).createPopupTemplate === 'function') {
                        featureLayer.popupTemplate = (featureLayer as any).createPopupTemplate();
      // console.log(`   ✅ Created auto popup template for FeatureLayer`);
                      } else {
                        // Manual popup template creation with all fields
                        const fieldInfos = featureLayer.fields
                          .filter(field => field.name !== featureLayer.objectIdField && field.type !== 'geometry')
                          .map(field => ({
                            fieldName: field.name,
                            label: field.alias || field.name,
                            visible: true
                          }));
                        
                        featureLayer.popupTemplate = new PopupTemplate({
                          title: `{${featureLayer.displayField || featureLayer.objectIdField}}`,
                          content: [{
                            type: 'fields',
                            fieldInfos: fieldInfos
                          }]
                        });
      // console.log(`   ✅ Created manual popup template with ${fieldInfos.length} fields for FeatureLayer`);
                      }
                    } catch (err) {
                      console.warn(`   ⚠️ Could not create popup template for FeatureLayer:`, err);
                    }
                  }
                }
                
                // For MapImageLayer, create popup templates for all sublayers
                // This is required because MapImageLayer doesn't auto-generate popups like FeatureLayer
                if (url.includes('/MapServer') && 'allSublayers' in layer) {
                  const mapImageLayer = layer as __esri.MapImageLayer;
                  
                  // Use loadAll() to ensure all sublayers are loaded
                  await mapImageLayer.loadAll();
                  
                  // Create popup templates for each sublayer
                  // MapImageLayer sublayers need explicit popup configuration
                  if (mapImageLayer.allSublayers && mapImageLayer.allSublayers.length > 0) {
                    let createdCount = 0;
                    mapImageLayer.allSublayers.forEach((sublayer: any) => {
                      try {
                        // Try using the built-in createPopupTemplate() first
                        let popupTemplate = null;
                        if (typeof sublayer.createPopupTemplate === 'function') {
                          popupTemplate = sublayer.createPopupTemplate();
                        }
                        
                        // If that didn't work, create a manual popup template
                        if (!popupTemplate) {
                          popupTemplate = new PopupTemplate({
                            title: `{${sublayer.displayField || 'OBJECTID'}}`,
                            content: [{
                              type: 'fields',
                              fieldInfos: [{
                                fieldName: '*'  // Show all fields
                              }]
                            }]
                          });
                        }
                        
                        if (popupTemplate) {
                          sublayer.popupTemplate = popupTemplate;
                          createdCount++;
      // console.log(`   ✓ Created popup for sublayer: "${sublayer.title}" (id: ${sublayer.id})`);
                        }
                      } catch (err) {
                        // Some sublayers might not support popups (e.g., group layers)
      // console.log(`   ℹ️ Sublayer "${sublayer.title}" does not support popups:`, err);
                      }
                    });
      // console.log(`   ✅ Created ${createdCount} popup template(s) from ${mapImageLayer.allSublayers.length} total sublayer(s)`);
                  }
                }
                
                // Log additional info for ImageServer layers to help debug rendering issues
                if (url.includes('/ImageServer') && 'fullExtent' in layer) {
      // console.log(`   ImageServer fullExtent:`, (layer as any).fullExtent);
      // console.log(`   ImageServer spatialReference:`, (layer as any).spatialReference);
      // console.log(`   ⚠️ Note: ImageryLayers (raster data) do not support feature-based popups`);
                }
                
                if (view.map) {
                  // Add layer to the TOP of the layer stack (index = highest position)
                  // In ArcGIS, layers are drawn bottom-to-top, so higher index = more visible
                  view.map.layers.add(layer);  // Adds to end of collection (top of visual stack)
                  tncArcGISLayersRef.current.set(item.id, layer);
      // console.log(`✅ Added TNC layer: ${item.title}`);
                  
                  // Verify popup configuration for FeatureLayer
                  if (url.includes('/FeatureServer') && 'popupTemplate' in layer) {
                    const featureLayer = layer as __esri.FeatureLayer;
                    if (featureLayer.popupTemplate) {
      // console.log(`   ✓ FeatureLayer has popupTemplate with ${featureLayer.fields?.length || 0} fields`);
                    } else {
      // console.log(`   ✗ FeatureLayer MISSING popupTemplate!`);
                    }
                  }
                  
                  // Verify popup configuration for MapImageLayer
                  if (url.includes('/MapServer') && 'allSublayers' in layer) {
                    const mapImageLayer = layer as __esri.MapImageLayer;
      // console.log(`   🔍 Verifying popups for MapImageLayer...`);
                    if (mapImageLayer.allSublayers) {
                      mapImageLayer.allSublayers.forEach((sublayer: any) => {
                        if (sublayer.popupTemplate) {
      // console.log(`   ✓ Sublayer "${sublayer.title}" has popupTemplate`);
                        } else {
      // console.log(`   ✗ Sublayer "${sublayer.title}" MISSING popupTemplate`);
                        }
                      });
                    }
                  }
                  
                  // Fetch legend data for layers that support it
                  if (url.includes('/FeatureServer') || url.includes('/MapServer') || url.includes('/ImageServer')) {
                    try {
                      // Determine which layer ID to use for legend
                      let layerId = 0;
                      
                      if (url.includes('/FeatureServer')) {
                        // Extract layer ID from the configured layer URL
                        const layerIdMatch = layerConfig.url.match(/\/(\d+)$/);
                        layerId = layerIdMatch ? parseInt(layerIdMatch[1]) : (item.selectedLayerId ?? 0);
                      } else if (url.includes('/MapServer')) {
                        // For MapServer, use the selected layer ID
                        layerId = item.selectedLayerId ?? 0;
                      }
                      
                      const legendData = await tncArcGISAPI.fetchLegendInfo(url, layerId);
                      if (legendData) {
      // console.log(`🎨 Legend data fetched for: ${item.title} (layer ${layerId})`);
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
                      // Wait for initial rendering to complete using reactiveUtils
                      const watchHandle = reactiveUtils.watch(
                        () => layerView.updating,
                        (isUpdating: boolean) => {
                          if (!isUpdating) {
                            // Layer has finished rendering
      // console.log(`🎨 Layer rendered: ${item.title}`);
                            
                            // Hide ImageServer loading banner IMMEDIATELY (synchronized with eye icon)
                            if (imageServerLoading?.itemId === item.id) {
      // console.log(`   ✅ Hiding ImageServer banner for: ${item.title}`);
                              setImageServerLoading(null);
                              if (imageServerTimeoutRef.current) {
                                clearTimeout(imageServerTimeoutRef.current);
                                imageServerTimeoutRef.current = null;
                              }
                            }
                            
                            // Call completion callback (this removes spinner and shows eye)
                            onLayerLoadComplete?.(item.id);
                            
                            watchHandle.remove(); // Stop watching once rendered
                          }
                        }
                      );
                    });
                  } catch (layerViewErr) {
                    // If we can't get the layerView, still complete the loading
                    console.warn(`⚠️ Could not get layerView for "${item.title}", but layer was added`);
                    
                    // Hide ImageServer loading banner (synchronized with eye icon)
                    if (imageServerLoading?.itemId === item.id) {
                      setImageServerLoading(null);
                      if (imageServerTimeoutRef.current) {
                        clearTimeout(imageServerTimeoutRef.current);
                        imageServerTimeoutRef.current = null;
                      }
                    }
                    
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
                
                // Hide ImageServer loading banner on error (synchronized with eye icon)
                if (imageServerLoading?.itemId === item.id) {
                  setImageServerLoading(null);
                  if (imageServerTimeoutRef.current) {
                    clearTimeout(imageServerTimeoutRef.current);
                    imageServerTimeoutRef.current = null;
                  }
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

  // Manage boundary popup based on active TNC ArcGIS layers
  // Disable boundary popup when TNC layers are active to prevent it from interfering
  useEffect(() => {
    if (boundaryLayerRef.current) {
      const hasTNCLayers = activeLayerIds.length > 0;
      boundaryLayerRef.current.popupEnabled = !hasTNCLayers;
      
      if (hasTNCLayers) {
      // console.log('🚫 Boundary popup disabled (TNC layers are active)');
      } else {
      // console.log('✅ Boundary popup enabled (no TNC layers active)');
      }
    }
    
    // Close popup if the layer it belongs to was toggled off
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
              view.popup.close();
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

  // Effect to update TNC observations on map when data changes
  useEffect(() => {
    if (view) {
      const tncObservationsLayer = view.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
      if (tncObservationsLayer) {
        // Clear existing graphics first (important: do this even if tncObservations is empty)
        tncObservationsLayer.removeAll();
        
        // Only add markers if we have observations to show
        if (tncObservations.length > 0) {
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
      // console.log(`TNC Observation ${obs.observation_id}: ${obs.scientific_name} at [${longitude}, ${latitude}]`);
            }
          }
        });
        
      // console.log(`✅ TNC iNaturalist: Updated map with ${tncObservations.length} observation records`);
      // console.log(`TNC Layer graphics count: ${tncObservationsLayer.graphics.length}`);
        } else {
      // console.log(`🧹 TNC iNaturalist: Cleared map (no observations to display)`);
        }
      }
    }
  }, [view, tncObservations, selectedTNCObservation]);

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

  const loadObservations = async (_mapView: __esri.MapView, observationsLayer: GraphicsLayer, filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
    customPolygon?: string;
    showSearchArea?: boolean;
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
      
      // Handle search area visualization for "Dangermond + Margin"
      await drawSearchAreaRectangle(_mapView, filters?.showSearchArea || false, 'expanded');
      
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
      
      // console.log(`Using maxResults: ${maxResults} for date range`);
      
      const response = await iNaturalistAPI.getRecentObservations({
        perPage: 200,
        daysBack: filters?.daysBack || 30,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        qualityGrade: filters?.qualityGrade,
        iconicTaxa: filters?.iconicTaxa,
        maxResults
      });
      
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
          
      // console.log(`🎯 Filtered ${response.results.length} observations to ${filteredResults.length} within custom polygon`);
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
    showSearchArea?: boolean;
  }) => {
    onCalFloraLoadingChange?.(true);
    
    try {
      const { maxResults = 1000, plantType = 'all', customPolygon, showSearchArea = false } = filters || {};
      
      let allPlants: CalFloraPlant[] = [];
      
      // Clear both CalFlora and iNaturalist layers when starting a new search
      // This ensures no old data from different sources remains visible
      const observationsLayer = _mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
      if (observationsLayer) {
        observationsLayer.removeAll();
      }
      
      // Handle search area visualization for "Dangermond + Margin"
      await drawSearchAreaRectangle(_mapView, showSearchArea, 'expanded');
      
      // Load plant data using the unified method
      // console.log('Loading CalFlora plant data...');
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
      
      // console.log(`✅ CalFlora: Added ${allPlants.length} plant records to map`);
      
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
    showSearchArea?: boolean;
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
      
      // Handle search area visualization for "Dangermond + Margin"
      await drawSearchAreaRectangle(_mapView, filters?.showSearchArea || false, filters?.searchMode || '');
      
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
      
      // console.log(`Added ${response.observations.length} eBird observations to map`);
      
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
      
      if (observationsLayer) {
        observationsLayer.removeAll();
      }
      if (calFloraLayer) {
        calFloraLayer.removeAll();
      }
      
      // Handle search area visualization using helper
      await drawSearchAreaRectangle(_mapView, filters?.showSearchArea || false, filters?.searchMode || '');
      
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
      
      // console.log(`Added ${response.length} TNC iNaturalist observations to map`);
      
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

  // Helper to draw search area rectangle for "Dangermond + Margin" spatial filter
  const drawSearchAreaRectangle = async (_mapView: __esri.MapView, showSearchArea: boolean, searchMode: string) => {
    const searchAreaLayer = _mapView.map?.findLayerById('search-area-rectangle') as GraphicsLayer;
    
    if (!searchAreaLayer) return;
    
    searchAreaLayer.removeAll();
    
    if (showSearchArea && searchMode === 'expanded') {
      try {
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
            title: 'Search Area (Dangermond + Margin)',
            content: `This rectangle shows the expanded search area around the Dangermond Preserve.<br/>
                     Coordinates: ${extent.xmin.toFixed(3)}, ${extent.ymin.toFixed(3)} to ${extent.xmax.toFixed(3)}, ${extent.ymax.toFixed(3)}`
          })
        });
        
        searchAreaLayer.add(rectangleGraphic);
        searchAreaLayer.visible = true;
      // console.log('✅ Added search area rectangle:', extent);
      } catch (error) {
        console.error('Error drawing search area rectangle:', error);
      }
    } else {
      searchAreaLayer.visible = false;
    }
  };

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
      'dendra-stations'
    ];
    
    layerIds.forEach(layerId => {
      const layer = view.map?.findLayerById(layerId) as GraphicsLayer;
      if (layer) {
        layer.removeAll();
      // console.log(`  ✓ Cleared ${layerId}`);
      }
    });
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reloadObservations,
    reloadTNCObservations,
    reloadEBirdObservations,
    reloadCalFloraData,
    activateDrawMode,
    clearPolygon,
    clearSearchArea,
    clearAllObservationLayers
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
                  imageServerLoading.hasTimedOut ? 'text-amber-900' : 'text-blue-900'
                }`}>
                  {imageServerLoading.hasTimedOut 
                    ? '⏱️ Large Image Service - Still Loading' 
                    : '🗺️ Loading High-Resolution Imagery'}
                </p>
                <p className={`text-xs mb-2 ${
                  imageServerLoading.hasTimedOut ? 'text-amber-800' : 'text-blue-800'
                }`}>
                  <strong>{imageServerLoading.layerTitle}</strong>
                </p>
                <p className={`text-xs ${
                  imageServerLoading.hasTimedOut ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  {imageServerLoading.hasTimedOut 
                    ? 'This untiled image service is taking longer than expected (>30s). The service may be slow or overloaded. Imagery will appear progressively as you zoom and pan.' 
                    : 'This large imagery service may load slowly. Please wait...'}
                </p>
              </div>
              <button
                onClick={() => {
                  setImageServerLoading(null);
                  if (imageServerTimeoutRef.current) {
                    clearTimeout(imageServerTimeoutRef.current);
                    imageServerTimeoutRef.current = null;
                  }
                }}
                className={`flex-shrink-0 p-1 rounded hover:bg-opacity-20 transition-colors ${
                  imageServerLoading.hasTimedOut 
                    ? 'hover:bg-amber-900' 
                    : 'hover:bg-blue-900'
                }`}
                title="Dismiss"
              >
                <svg className={`w-4 h-4 ${
                  imageServerLoading.hasTimedOut ? 'text-amber-700' : 'text-blue-700'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
});

export default MapViewComponent;
