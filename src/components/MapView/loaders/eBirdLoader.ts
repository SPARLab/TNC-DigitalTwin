import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { eBirdService, EBirdObservation } from '../../../services/eBirdService';

export interface EBirdFilters {
  startDate?: string;
  endDate?: string;
  maxResults?: number;
  page?: number;
  pageSize?: number;
  searchMode?: 'preserve-only' | 'expanded' | 'custom';
  customPolygon?: string;
  showSearchArea?: boolean;
}

export interface EBirdLoaderDeps {
  mapView: __esri.MapView;
  eBirdLayer: GraphicsLayer;
  onUpdate?: (observations: EBirdObservation[]) => void;
  drawSearchArea?: (mapView: __esri.MapView, show: boolean, mode: string) => Promise<void>;
}

/**
 * Loads eBird observations and adds them to the map
 */
export const loadEBirdObservations = async (
  deps: EBirdLoaderDeps,
  filters?: EBirdFilters
): Promise<void> => {
  const { mapView, eBirdLayer, onUpdate, drawSearchArea } = deps;
  
  try {
    // Clear other layers when starting a new eBird search
    const observationsLayer = mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
    const tncObservationsLayer = mapView.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
    const calFloraLayer = mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
    
    if (observationsLayer) {
      observationsLayer.removeAll();
    }
    if (tncObservationsLayer) {
      tncObservationsLayer.removeAll();
    }
    if (calFloraLayer) {
      calFloraLayer.removeAll();
    }
    
    // Handle search area visualization
    if (drawSearchArea) {
      await drawSearchArea(mapView, filters?.showSearchArea || false, filters?.searchMode || '');
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
    
    onUpdate?.(response.observations);
    
    // Clear existing graphics
    eBirdLayer.removeAll();
    
    // Add eBird observations to map
    response.observations.forEach(obs => {
      if (obs.geometry && obs.geometry.coordinates) {
        const [longitude, latitude] = obs.geometry.coordinates;
        const point = new Point({ longitude, latitude });
        
        // Create symbol - using red color for birds
        const symbol = new SimpleMarkerSymbol({
          style: 'circle',
          color: '#d62728',
          size: '10px',
          outline: { color: 'white', width: 1.5 }
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

        eBirdLayer.add(graphic);
      }
    });
  } catch (error) {
    console.error('Error loading eBird observations:', error);
    throw error;
  }
};

