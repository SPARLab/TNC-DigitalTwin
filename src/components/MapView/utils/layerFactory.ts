import MapImageLayer from '@arcgis/core/layers/MapImageLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import ImageryTileLayer from '@arcgis/core/layers/ImageryTileLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import SceneLayer from '@arcgis/core/layers/SceneLayer';
import StreamLayer from '@arcgis/core/layers/StreamLayer';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { TNCArcGISItem } from '../../../services/tncArcGISService';

export interface LayerConfig {
  id: string;
  url: string;
  title: string;
  opacity: number;
  popupEnabled: boolean;
}

export interface ImageServerLoadingState {
  isLoading: boolean;
  itemId: string;
  layerTitle: string;
  hasTimedOut: boolean;
  showSlowWarning: boolean;
}

/**
 * Creates an ArcGIS layer from a TNC ArcGIS item based on its service type
 * Returns null if the service type is not recognized
 */
export const createLayerFromItem = async (
  item: TNCArcGISItem,
  layerConfig: LayerConfig,
  onImageServerLoading?: (state: ImageServerLoadingState) => void
): Promise<__esri.Layer | null> => {
  const url = item.url;
  let layer: __esri.Layer | null = null;

  // Detect service type and create appropriate layer
  // Order matters: check more specific patterns first

  if (url.includes('/SceneServer')) {
    // 3D scene service (buildings, 3D objects, meshes, point clouds)
    layer = new SceneLayer(layerConfig);
    
  } else if (url.includes('/StreamServer')) {
    // Real-time streaming data service (WebSocket-based)
    layer = new StreamLayer(layerConfig);
    
  } else if (url.includes('/VectorTileServer')) {
    // Vector tile service (modern styleable basemaps)
    layer = new VectorTileLayer(layerConfig);
    
  } else if (url.includes('/ImageServer')) {
    // Image service - need to distinguish between dynamic and tiled
    if (url.includes('tiledimageservices')) {
      // Tiled image service (pre-cached tiles for performance)
      layer = new ImageryTileLayer(layerConfig);
    } else {
      // Dynamic image service (on-the-fly processing) - these can be slow
      layer = new ImageryLayer(layerConfig);
      
      // Show loading banner for large untiled image services
      if (onImageServerLoading) {
        onImageServerLoading({
          isLoading: true,
          itemId: item.id,
          layerTitle: item.title,
          hasTimedOut: false,
          showSlowWarning: false
        });
      }
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
      }];
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
      } else {
        // Query the service to find available layers
        try {
          const serviceResponse = await fetch(`${url}?f=json`);
          const serviceData = await serviceResponse.json();
          
          if (serviceData.layers && serviceData.layers.length > 0) {
            // Use selectedLayerId if it exists in the layers, otherwise use first
            const targetLayerId = serviceData.layers.find((l: any) => l.id === layerId) 
              ? layerId 
              : serviceData.layers[0].id;
            layerConfig.url = `${url}/${targetLayerId}`;
          } else {
            console.warn(`⚠️ No layers found in FeatureServer for: ${item.title}`);
          }
        } catch (err) {
          console.warn(`⚠️ Could not query FeatureServer metadata for: ${item.title}`, err);
        }
      }
    }
    
    layer = new FeatureLayer(layerConfig);
    
  } else {
    // Unknown service type - log detailed warning
    console.warn(`⚠️ Unknown service type for "${item.title}". URL: ${url}`);
    console.warn(`   Supported types: FeatureServer, MapServer, ImageServer, VectorTileServer, SceneServer, StreamServer`);
    console.warn(`   This layer will be skipped. Please contact the data provider if this is unexpected.`);
  }

  return layer;
};

/**
 * Configures popups for different layer types after they've been loaded
 */
export const configureLayerPopups = async (layer: __esri.Layer, url: string, _item: TNCArcGISItem): Promise<void> => {
  // For FeatureLayer, create a popup template showing all fields
  if (url.includes('/FeatureServer') && 'fields' in layer) {
    const featureLayer = layer as __esri.FeatureLayer;
    
    if (!featureLayer.popupTemplate && featureLayer.fields) {
      try {
        // Try using createPopupTemplate() if available
        if (typeof (featureLayer as any).createPopupTemplate === 'function') {
          featureLayer.popupTemplate = (featureLayer as any).createPopupTemplate();
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
          }
        } catch (err) {
          // Some sublayers might not support popups (e.g., group layers)
        }
      });
    }
  }
};

/**
 * Reconstructs unique-value renderers with native ArcGIS classes for better rendering
 */
export const reconstructRenderer = async (
  layer: __esri.Layer, 
  url: string, 
  item: TNCArcGISItem,
  layerOpacities: Record<string, number>,
  onLayerOpacityChange?: (itemId: string, opacity: number) => void
): Promise<void> => {
  if (!url.includes('/FeatureServer') || !('renderer' in layer)) {
    return;
  }

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
        
        try {
          const sampleQuery = await featureLayer.queryFeatures({
            where: '1=1',
            outFields: [field],
            returnGeometry: false,
            num: 10
          });
          
          const sampleFieldValues = sampleQuery.features.map((f: any) => f.attributes[field]);
          const uniqueActual = [...new Set(sampleFieldValues)] as string[];
          const rendererValues = uniqueValueInfos.map((info: any) => info.value);
          
          // Check if field values are longer and start with renderer values
          const exactMatches = uniqueActual.filter((actual: string) => 
            rendererValues.includes(actual)
          );
          
          const prefixMatches = uniqueActual.filter((actual: string) => 
            rendererValues.some((rv: string) => actual.startsWith(rv))
          );
          
          // If we have prefix matches but not exact matches, we need valueExpression
          if (prefixMatches.length > 0 && exactMatches.length === 0) {
            needsValueExpression = true;
          }
        } catch (e) {
          // Silently continue if we can't determine
        }
        
        // Capture the original alpha from the first symbol to use as default layer opacity
        let detectedAlpha: number | null = null;
        if (uniqueValueInfos.length > 0 && uniqueValueInfos[0].symbol?.color?.a !== undefined) {
          detectedAlpha = uniqueValueInfos[0].symbol.color.a;
        }
        
        // Reconstruct each symbol, preserving original style (patterns)
        const reconstructedInfos = uniqueValueInfos.map((info: any) => {
          const color = info.symbol?.color;
          const outline = info.symbol?.outline;
          const style = info.symbol?.style || 'solid';
          
          return {
            value: info.value,
            label: info.label || info.value,
            symbol: new SimpleFillSymbol({
              style: style,
              // Force symbols to 100% opacity - let layer-level opacity slider control transparency
              color: color ? [color.r, color.g, color.b, 1.0] : [200, 200, 200, 1.0],
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
        const newRenderer = needsValueExpression 
          ? new UniqueValueRenderer({
              valueExpression: `Left($feature.${field}, 4)`,
              uniqueValueInfos: reconstructedInfos
            })
          : new UniqueValueRenderer({
              field: field,
              uniqueValueInfos: reconstructedInfos
            });
        
        featureLayer.renderer = newRenderer;
        
        // Apply detected alpha as layer's default opacity if this is the first load
        if (detectedAlpha !== null && layerOpacities[item.id] === undefined) {
          const detectedOpacity = Math.round(detectedAlpha * 100);
          console.log(`🎨 Using detected opacity ${detectedOpacity}% for "${item.title}"`);
          
          // Update layer opacity immediately
          (layer as any).opacity = detectedAlpha;
          
          // Notify parent to update state (so slider shows correct value)
          if (onLayerOpacityChange) {
            setTimeout(() => {
              onLayerOpacityChange(item.id, detectedOpacity);
            }, 0);
          }
        }
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not reconstruct renderer for ${item.title}:`, err);
  }
};

/**
 * Disables scale-dependent rendering restrictions to allow viewing at any zoom level
 */
export const disableScaleRestrictions = (layer: __esri.Layer): void => {
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
};

