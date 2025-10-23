import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { iNaturalistAPI, iNaturalistObservation } from '../../../services/iNaturalistService';
import { getObservationIcon, getEmojiDataUri } from '../utils/iconUtils';

export interface ObservationsFilters {
  qualityGrade?: 'research' | 'needs_id' | 'casual';
  iconicTaxa?: string[];
  daysBack?: number;
  startDate?: string;
  endDate?: string;
  customPolygon?: string;
  showSearchArea?: boolean;
}

export interface ObservationsLoaderDeps {
  mapView: __esri.MapView;
  observationsLayer: GraphicsLayer;
  visibleCategories: Set<string>;
  onUpdate?: (observations: iNaturalistObservation[]) => void;
  onLocalUpdate?: (observations: iNaturalistObservation[]) => void;
  drawSearchArea?: (mapView: __esri.MapView, show: boolean, mode: string) => Promise<void>;
}

/**
 * Loads iNaturalist observations and adds them to the map
 */
export const loadObservations = async (
  deps: ObservationsLoaderDeps,
  filters?: ObservationsFilters
): Promise<void> => {
  const { mapView, observationsLayer, visibleCategories, onUpdate, onLocalUpdate, drawSearchArea } = deps;
  
  try {
    // Clear both iNaturalist and CalFlora layers when starting a new search
    const calFloraLayer = mapView.map?.findLayerById('calflora-plants') as GraphicsLayer;
    if (calFloraLayer) {
      calFloraLayer.removeAll();
    }
    
    // Handle search area visualization
    if (drawSearchArea) {
      await drawSearchArea(mapView, filters?.showSearchArea || false, 'expanded');
    }
    
    // Calculate appropriate maxResults based on date range
    let maxResults = 500;
    
    if (filters?.startDate && filters?.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 365) {
        maxResults = Math.min(5000, daysDiff * 15);
      } else if (daysDiff > 90) {
        maxResults = Math.min(2000, daysDiff * 18);
      } else if (daysDiff > 30) {
        maxResults = Math.min(1000, daysDiff * 20);
      }
    } else if (filters?.daysBack) {
      if (filters.daysBack > 365) {
        maxResults = Math.min(5000, filters.daysBack * 15);
      } else if (filters.daysBack > 90) {
        maxResults = Math.min(2000, filters.daysBack * 18);
      } else if (filters.daysBack > 30) {
        maxResults = Math.min(1000, filters.daysBack * 20);
      }
    }
    
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
    
    // Filter by custom polygon if provided
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
      } catch (error) {
        console.error('Error filtering by custom polygon:', error);
        filteredResults = response.results;
      }
    }
    
    // Update parent with filtered results
    onUpdate?.(filteredResults);
    onLocalUpdate?.(filteredResults);
    
    // Add observations to map
    filteredResults.forEach(obs => {
      if (obs.geojson && obs.geojson.coordinates) {
        const iconicTaxon = obs.taxon?.iconic_taxon_name || 'unknown';
        
        // Skip if this category is hidden
        if (visibleCategories.size > 0 && !visibleCategories.has(iconicTaxon)) {
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

        // Get the best available photo URL for popup
        let popupPhotoUrl = null;
        if (obs.photos && obs.photos.length > 0) {
          popupPhotoUrl = obs.photos[0].medium_url || obs.photos[0].square_url || obs.photos[0].url;
        } else if (obs.taxon?.default_photo) {
          popupPhotoUrl = obs.taxon.default_photo.medium_url || obs.taxon.default_photo.square_url;
        }

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

        const graphic = new Graphic({
          geometry: point,
          symbol: symbol,
          popupTemplate: popupTemplate,
          attributes: {
            id: obs.id,
            taxonName: obs.taxon?.name,
            commonName: obs.taxon?.preferred_common_name,
            observedOn: obs.observed_on,
            observer: obs.user.login,
            iconicTaxon: iconicTaxon
          }
        });

        observationsLayer.add(graphic);
      }
    });
  } catch (error) {
    console.error('Error loading iNaturalist observations:', error);
    throw error;
  }
};

