import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { tncINaturalistService, TNCArcGISObservation } from '../../../services/tncINaturalistService';
import { getTNCObservationEmoji, getEmojiDataUri } from '../utils/iconUtils';
import { buildTNCPopupContent } from '../utils/popupBuilders';

export interface TNCObservationsFilters {
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
}

export interface TNCObservationsLoaderDeps {
  mapView: __esri.MapView;
  tncObservationsLayer: GraphicsLayer;
  onUpdate?: (observations: TNCArcGISObservation[]) => void;
  drawSearchArea?: (mapView: __esri.MapView, show: boolean, mode: string) => Promise<void>;
}

/**
 * Loads TNC iNaturalist observations and adds them to the map
 */
export const loadTNCObservations = async (
  deps: TNCObservationsLoaderDeps,
  filters?: TNCObservationsFilters
): Promise<void> => {
  const { mapView, tncObservationsLayer, onUpdate, drawSearchArea } = deps;
  
  try {
    // Clear other layers when starting a new TNC search
    const observationsLayer = mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
    const calFloraLayer = mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
    
    if (observationsLayer) {
      observationsLayer.removeAll();
    }
    if (calFloraLayer) {
      calFloraLayer.removeAll();
    }
    
    // Handle search area visualization
    if (drawSearchArea) {
      await drawSearchArea(mapView, filters?.showSearchArea || false, filters?.searchMode || '');
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
    
    onUpdate?.(response);
    
    // Clear existing graphics
    tncObservationsLayer.removeAll();
    
    // Add TNC observations to map
    response.forEach(obs => {
      if (obs.geometry && obs.geometry.coordinates) {
        const [longitude, latitude] = obs.geometry.coordinates;
        const point = new Point({ longitude, latitude });

        // Get emoji based on taxon category
        const emoji = getTNCObservationEmoji(obs.taxon_category_name);
        
        // Create symbol with emoji icon
        const symbol = new PictureMarkerSymbol({
          url: getEmojiDataUri(emoji),
          width: '32px',
          height: '32px'
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
  } catch (error) {
    console.error('Error loading TNC observations:', error);
    throw error;
  }
};

