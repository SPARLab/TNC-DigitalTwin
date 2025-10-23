import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { tncINaturalistService } from '../../../services/tncINaturalistService';

/**
 * Draws a visual rectangle on the map showing the expanded search area
 */
export const drawSearchAreaRectangle = async (
  mapView: __esri.MapView, 
  showSearchArea: boolean, 
  searchMode: string
): Promise<void> => {
  const searchAreaLayer = mapView.map?.findLayerById('search-area-rectangle') as GraphicsLayer;
  
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
    } catch (error) {
      console.error('Error drawing search area rectangle:', error);
    }
  } else {
    searchAreaLayer.visible = false;
  }
};

