import { useEffect, useRef } from 'react';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { TNCArcGISItem, tncArcGISAPI } from '../../../services/tncArcGISService';
import {
  createLayerFromItem,
  disableScaleRestrictions,
  reconstructRenderer,
  configureLayerPopups,
  type LayerConfig
} from '../utils';

export interface ImageServerLoadingState {
  itemId: string;
  layerTitle: string;
  isLoading: boolean;
  showSlowWarning?: boolean;
  hasTimedOut?: boolean;
}

export interface LayerLoadError {
  itemId: string;
  layerTitle: string;
  errorMessage: string;
}

export interface UseTNCArcGISLayersProps {
  view: __esri.MapView | null;
  tncArcGISItems: TNCArcGISItem[];
  activeLayerIds: string[];
  layerOpacities: Record<string, number>;
  tncArcGISLayersRef: React.MutableRefObject<Map<string, __esri.Layer>>;
  onLayerOpacityChange?: (itemId: string, opacity: number) => void;
  onLayerLoadComplete?: (itemId: string) => void;
  onLayerLoadError?: (itemId: string) => void;
  onLegendDataFetched?: (itemId: string, legendData: any) => void;
  onImageServerLoadingChange?: (state: ImageServerLoadingState | null) => void;
  onLayerLoadErrorChange?: (error: LayerLoadError | null) => void;
}

/**
 * Custom hook to manage TNC ArcGIS Hub map layers
 * Handles layer loading, removal, opacity updates, error handling, and ImageServer loading states
 */
export const useTNCArcGISLayers = ({
  view,
  tncArcGISItems,
  activeLayerIds,
  layerOpacities,
  tncArcGISLayersRef,
  onLayerOpacityChange,
  onLayerLoadComplete,
  onLayerLoadError,
  onLegendDataFetched,
  onImageServerLoadingChange,
  onLayerLoadErrorChange
}: UseTNCArcGISLayersProps): void => {
  const imageServerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageServerSlowWarningRef = useRef<NodeJS.Timeout | null>(null);

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
          // Clear ImageServer loading state if this layer was loading
          if (imageServerTimeoutRef.current || imageServerSlowWarningRef.current) {
            console.log(`   🧹 Clearing ImageServer loading banner for removed layer`);
            onImageServerLoadingChange?.(null);
            if (imageServerTimeoutRef.current) {
              clearTimeout(imageServerTimeoutRef.current);
              imageServerTimeoutRef.current = null;
            }
            if (imageServerSlowWarningRef.current) {
              clearTimeout(imageServerSlowWarningRef.current);
              imageServerSlowWarningRef.current = null;
            }
          }
          
          // Remove from map first
          view.map.remove(layer);
          
          // Destroy the layer to free resources and ensure it's fully cleaned up
          if (typeof (layer as any).destroy === 'function') {
            (layer as any).destroy();
          }
          
          // Remove from our tracking map
          tncArcGISLayersRef.current.delete(itemId);
        }
      });

      // Add new layers that aren't already loaded
      for (const item of activeItems) {
        if (!tncArcGISLayersRef.current.has(item.id)) {
          try {
            // Create layer using factory
            const url = item.url;
            const layerConfig: LayerConfig = {
              id: `tnc-layer-${item.id}`,
              url: url,
              title: item.title,
              opacity: (layerOpacities[item.id] ?? 80) / 100,
              popupEnabled: true
            };

            // Setup ImageServer loading callbacks
            const handleImageServerLoading = (state: ImageServerLoadingState | null) => {
              onImageServerLoadingChange?.(state);
              
              if (!state) return;
              
              // Set 10-second "taking longer than expected" warning
              if (imageServerSlowWarningRef.current) {
                clearTimeout(imageServerSlowWarningRef.current);
              }
              imageServerSlowWarningRef.current = setTimeout(() => {
                onImageServerLoadingChange?.({
                  ...state,
                  showSlowWarning: true
                });
              }, 10000);
              
              // Set 30-second timeout warning
              if (imageServerTimeoutRef.current) {
                clearTimeout(imageServerTimeoutRef.current);
              }
              imageServerTimeoutRef.current = setTimeout(() => {
                onImageServerLoadingChange?.({
                  ...state,
                  hasTimedOut: true
                });
              }, 30000);
            };

            const layer = await createLayerFromItem(item, layerConfig, handleImageServerLoading);

            if (layer) {
              // Load the layer and check for errors
              try {
                // Wrap layer.load() with a generous timeout (45 seconds) for slow services like NAIP imagery
                const loadTimeout = 45000; // 45 seconds
                const loadStartTime = Date.now();
                console.log(`⏳ Loading layer "${item.title}" (timeout: ${loadTimeout / 1000}s)...`);
                
                const loadPromise = layer.load();
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error(`Layer load timeout after ${loadTimeout / 1000} seconds`)), loadTimeout)
                );
                
                await Promise.race([loadPromise, timeoutPromise]);
                
                const loadDuration = ((Date.now() - loadStartTime) / 1000).toFixed(1);
                console.log(`✅ Layer "${item.title}" loaded successfully in ${loadDuration}s`);
                
                // Disable scale-dependent rendering restrictions
                disableScaleRestrictions(layer);
                
                // Reconstruct unique-value renderers with native ArcGIS classes
                await reconstructRenderer(layer, url, item, layerOpacities, onLayerOpacityChange);
                
                // Configure popups for different layer types
                await configureLayerPopups(layer, url, item);
                
                if (view.map) {
                  // Add layer to the TOP of the layer stack (index = highest position)
                  // In ArcGIS, layers are drawn bottom-to-top, so higher index = more visible
                  view.map.layers.add(layer);  // Adds to end of collection (top of visual stack)
                  tncArcGISLayersRef.current.set(item.id, layer);
                  
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
                            
                            // Hide ImageServer loading banner IMMEDIATELY (synchronized with eye icon)
                            onImageServerLoadingChange?.(null);
                            if (imageServerTimeoutRef.current) {
                              clearTimeout(imageServerTimeoutRef.current);
                              imageServerTimeoutRef.current = null;
                            }
                            if (imageServerSlowWarningRef.current) {
                              clearTimeout(imageServerSlowWarningRef.current);
                              imageServerSlowWarningRef.current = null;
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
                    onImageServerLoadingChange?.(null);
                    if (imageServerTimeoutRef.current) {
                      clearTimeout(imageServerTimeoutRef.current);
                      imageServerTimeoutRef.current = null;
                    }
                    if (imageServerSlowWarningRef.current) {
                      clearTimeout(imageServerSlowWarningRef.current);
                      imageServerSlowWarningRef.current = null;
                    }
                    
                    onLayerLoadComplete?.(item.id);
                  }
                }
              } catch (err: any) {
                // Handle specific error cases
                let errorMessage = '';
                if (err?.message?.includes('400') || err?.details?.httpStatus === 400) {
                  errorMessage = 'This layer may be retired or use an incompatible projection.';
                  console.warn(`⚠️ Skipping incompatible layer "${item.title}": ${errorMessage}`);
                } else if (err?.message?.includes('timeout')) {
                  errorMessage = `Load timeout after 45 seconds. The service may be slow or unresponsive.`;
                  console.warn(`⚠️ Could not load TNC layer "${item.title}": ${err.message}`);
                  console.warn(`   This layer is taking longer than expected to load. The service may be slow or unresponsive.`);
                } else {
                  errorMessage = err.message || 'Unknown error occurred';
                  console.warn(`⚠️ Could not load TNC layer "${item.title}":`, err.message);
                }
                
                // Show persistent error banner
                onLayerLoadErrorChange?.({
                  itemId: item.id,
                  layerTitle: item.title,
                  errorMessage: errorMessage
                });
                
                // Hide ImageServer loading banner on error (synchronized with eye icon)
                onImageServerLoadingChange?.(null);
                if (imageServerTimeoutRef.current) {
                  clearTimeout(imageServerTimeoutRef.current);
                  imageServerTimeoutRef.current = null;
                }
                if (imageServerSlowWarningRef.current) {
                  clearTimeout(imageServerSlowWarningRef.current);
                  imageServerSlowWarningRef.current = null;
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
};

