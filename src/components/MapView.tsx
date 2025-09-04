import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { DataLayer } from '../types';
import DataLayersPanel from './DataLayersPanel';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { iNaturalistAPI, iNaturalistObservation } from '../services/iNaturalistService';
import { calFloraAPI, CalFloraPlant } from '../services/calFloraService';

interface MapViewProps {
  dataLayers: DataLayer[];
  onLayerToggle: (layerId: string) => void;
  onObservationsUpdate?: (observations: iNaturalistObservation[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  calFloraPlants?: CalFloraPlant[];
  onCalFloraUpdate?: (plants: CalFloraPlant[]) => void;
  onCalFloraLoadingChange?: (loading: boolean) => void;
}

export interface MapViewRef {
  reloadObservations: (filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
  }) => void;
  reloadCalFloraData: (filters?: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
  }) => void;
}

const MapViewComponent = forwardRef<MapViewRef, MapViewProps>(({ 
  dataLayers, 
  onLayerToggle, 
  onObservationsUpdate, 
  onLoadingChange,
  calFloraPlants = [],
  onCalFloraUpdate,
  onCalFloraLoadingChange
}, ref) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [loading, setLoading] = useState(false);
  // CalFlora state is managed by parent component via props

  useEffect(() => {
    if (mapDiv.current) {
      // Create the map with a satellite basemap to show the preserve clearly
      const map = new Map({
        basemap: 'satellite'
      });

      // Create graphics layer for iNaturalist observations
      const observationsLayer = new GraphicsLayer({
        id: 'inaturalist-observations',
        title: 'iNaturalist Observations'
      });

      // Create graphics layer for CalFlora plants
      const calFloraLayer = new GraphicsLayer({
        id: 'calflora-plants',
        title: 'CalFlora Plants'
      });

      map.add(observationsLayer);
      map.add(calFloraLayer);

      // Create the map view centered on Dangermond Preserve
      // Coordinates: approximately 34.45°N, -120.2°W
      const mapView = new MapView({
        container: mapDiv.current,
        map: map,
        center: [-120.2, 34.45], // Longitude, Latitude for Dangermond Preserve
        zoom: 12, // Good zoom level to see the preserve area
        ui: {
          components: ['attribution'] // Keep attribution, remove default zoom controls since we have custom ones
        }
      });

      setView(mapView);

      // Load initial data based on current data source
      // Note: We'll load data based on the current filter state from the parent
      loadObservations(mapView, observationsLayer);

      // Cleanup function
      return () => {
        if (mapView) {
          mapView.destroy();
        }
      };
    }
  }, []);

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

            // Create popup template
            const popupTemplate = new PopupTemplate({
              title: plant.commonName || plant.scientificName,
              content: `
                <div class="calflora-popup">
                  <p><strong>Scientific Name:</strong> ${plant.scientificName}</p>
                  ${plant.family ? `<p><strong>Family:</strong> ${plant.family}</p>` : ''}
                  <p><strong>Native Status:</strong> <span style="color: ${
                    plant.nativeStatus === 'native' ? '#22c55e' : 
                    plant.nativeStatus === 'invasive' ? '#ef4444' : '#6b7280'
                  }; font-weight: bold;">${plant.nativeStatus}</span></p>
                  ${plant.calIpcRating ? `<p><strong>Cal-IPC Rating:</strong> <span style="color: #ef4444; font-weight: bold;">${plant.calIpcRating}</span></p>` : ''}
                  ${plant.county ? `<p><strong>County:</strong> ${plant.county}</p>` : ''}
                  ${plant.observationDate ? `<p><strong>Observed:</strong> ${new Date(plant.observationDate).toLocaleDateString()}</p>` : ''}
                  <p><strong>Data Source:</strong> CalFlora</p>
                  ${plant.nativeStatus === 'invasive' ? 
                    '<p style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 4px 8px; border-radius: 4px; margin: 8px 0;">⚠️ Invasive Species - Management Recommended</p>' : 
                    ''}
                </div>
              `
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

  const loadObservations = async (_mapView: __esri.MapView, observationsLayer: GraphicsLayer, filters?: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
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
      onObservationsUpdate?.(response.results);
      
      // Clear existing graphics
      observationsLayer.removeAll();
      
      // Add observations to map
      response.results.forEach(obs => {
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
  }) => {
    onCalFloraLoadingChange?.(true);
    
    try {
      const { maxResults = 1000, plantType = 'all' } = filters || {};
      
      let allPlants: CalFloraPlant[] = [];
      
      // Load plant data using the unified method
      console.log('Loading CalFlora plant data...');
      const response = await calFloraAPI.getAllPlants({ 
        maxResults, 
        plantType,
        countyFilter: 'Santa Barbara' // Try Santa Barbara County first since Dangermond is there
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

          // Create popup template
          const popupTemplate = new PopupTemplate({
            title: plant.commonName || plant.scientificName,
            content: `
              <div class="calflora-popup">
                <p><strong>Scientific Name:</strong> ${plant.scientificName}</p>
                ${plant.family ? `<p><strong>Family:</strong> ${plant.family}</p>` : ''}
                <p><strong>Native Status:</strong> <span style="color: ${
                  plant.nativeStatus === 'native' ? '#22c55e' : 
                  plant.nativeStatus === 'invasive' ? '#ef4444' : '#6b7280'
                }; font-weight: bold;">${plant.nativeStatus}</span></p>
                ${plant.calIpcRating ? `<p><strong>Cal-IPC Rating:</strong> <span style="color: #ef4444; font-weight: bold;">${plant.calIpcRating}</span></p>` : ''}
                ${plant.county ? `<p><strong>County:</strong> ${plant.county}</p>` : ''}
                ${plant.observationDate ? `<p><strong>Observed:</strong> ${new Date(plant.observationDate).toLocaleDateString()}</p>` : ''}
                <p><strong>Data Source:</strong> CalFlora</p>
                ${plant.nativeStatus === 'invasive' ? 
                  '<p style="color: #dc2626; font-weight: bold; background: #fef2f2; padding: 4px 8px; border-radius: 4px; margin: 8px 0;">⚠️ Invasive Species - Management Recommended</p>' : 
                  ''}
              </div>
            `
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

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reloadObservations,
    reloadCalFloraData
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
        <div id="map-observations-counter" className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 z-10">
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

      {/* Data Layers Panel */}
      <DataLayersPanel 
        dataLayers={dataLayers}
        onLayerToggle={onLayerToggle}
      />
    </div>
  );
});

export default MapViewComponent;
