import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { calFloraAPI, CalFloraPlant } from '../../../services/calFloraService';

export interface CalFloraFilters {
  maxResults?: number;
  plantType?: 'invasive' | 'native' | 'all';
  customPolygon?: string;
  showSearchArea?: boolean;
}

export interface CalFloraLoaderDeps {
  mapView: __esri.MapView;
  calFloraLayer: GraphicsLayer;
  onUpdate?: (plants: CalFloraPlant[]) => void;
  drawSearchArea?: (mapView: __esri.MapView, show: boolean, mode: string) => Promise<void>;
}

/**
 * Creates marker symbol based on plant's native status
 */
const getPlantSymbol = (nativeStatus: string) => {
  switch (nativeStatus) {
    case 'native':
      return new SimpleMarkerSymbol({
        style: 'circle',
        color: [34, 197, 94, 0.8],
        size: '10px',
        outline: { color: 'white', width: 2 }
      });
    case 'invasive':
      return new SimpleMarkerSymbol({
        style: 'triangle',
        color: [239, 68, 68, 0.8],
        size: '12px',
        outline: { color: 'white', width: 2 }
      });
    default:
      return new SimpleMarkerSymbol({
        style: 'square',
        color: [156, 163, 175, 0.8],
        size: '8px',
        outline: { color: 'white', width: 1 }
      });
  }
};

/**
 * Loads CalFlora plant data and adds it to the map
 */
export const loadCalFloraData = async (
  deps: CalFloraLoaderDeps,
  filters?: CalFloraFilters
): Promise<void> => {
  const { mapView, calFloraLayer, onUpdate, drawSearchArea } = deps;
  const { maxResults = 1000, plantType = 'all', customPolygon, showSearchArea = false } = filters || {};
  
  try {
    let allPlants: CalFloraPlant[] = [];
    
    // Clear both CalFlora and iNaturalist layers when starting a new search
    const observationsLayer = mapView.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
    if (observationsLayer) {
      observationsLayer.removeAll();
    }
    
    // Handle search area visualization
    if (drawSearchArea) {
      await drawSearchArea(mapView, showSearchArea, 'expanded');
    }
    
    // Load plant data
    const response = await calFloraAPI.getAllPlants({ 
      maxResults, 
      plantType,
      customPolygon
    });
    allPlants.push(...response.results);

    // Clear existing graphics
    calFloraLayer.removeAll();
    
    // Update state via parent callback
    onUpdate?.(allPlants);

    // Add graphics to map
    allPlants.forEach(plant => {
      if (plant.geojson?.coordinates) {
        const [longitude, latitude] = plant.geojson.coordinates;
        const point = new Point({ longitude, latitude });
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
  } catch (error) {
    console.error('Error loading CalFlora data:', error);
    throw error;
  }
};

