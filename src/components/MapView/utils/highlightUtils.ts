import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';

export interface HighlightDependencies {
  view: __esri.MapView;
  highlightHandleRef: React.MutableRefObject<__esri.Handle | null>;
  highlightOperationRef: React.MutableRefObject<Promise<void> | null>;
  onHighlightChange?: (id: number | string | null) => void;
}

/**
 * Highlights an observation on the map with native ArcGIS highlight effect
 * Searches in both iNaturalist and TNC observation layers
 */
export const highlightObservation = (
  id: number | string,
  deps: HighlightDependencies
): void => {
  const { view, highlightHandleRef, highlightOperationRef, onHighlightChange } = deps;
  
  if (!view || !view.map) {
    console.warn('❌ View or map not available');
    return;
  }
  
  console.log('🎯 Highlighting observation:', id);
  
  // Create the async operation
  const operation = (async () => {
    // Wait for any pending highlight operation to complete before clearing
    if (highlightOperationRef.current) {
      console.log('⏸️ Waiting for previous highlight operation to complete...');
      await highlightOperationRef.current;
    }
    
    // Now clear any existing highlight
    if (highlightHandleRef.current) {
      console.log('🧹 Clearing previous highlight');
      highlightHandleRef.current.remove();
      highlightHandleRef.current = null;
    }
    
    // Find the observation graphic in either layer
    const inatLayer = view.map?.findLayerById('inaturalist-observations') as GraphicsLayer;
    const tncLayer = view.map?.findLayerById('tnc-inaturalist-observations') as GraphicsLayer;
    
    let targetGraphic: __esri.Graphic | undefined;
    let targetLayer: GraphicsLayer | undefined;
    
    // Search in iNaturalist Public API layer
    if (inatLayer) {
      targetGraphic = inatLayer.graphics.find(g => g.attributes?.id === id);
      if (targetGraphic) {
        targetLayer = inatLayer;
        console.log('✅ Found in iNaturalist Public API layer');
      }
    }
    
    // Search in TNC layer if not found
    if (!targetGraphic && tncLayer) {
      targetGraphic = tncLayer.graphics.find(g => g.attributes?.observation_id === id);
      if (targetGraphic) {
        targetLayer = tncLayer;
        console.log('✅ Found in TNC layer');
      }
    }
    
    if (!targetGraphic || !targetLayer) {
      console.warn(`❌ Observation with id ${id} not found on map`);
      return;
    }
    
    try {
      // Ensure the layer is loaded and the layer view is ready
      console.log('⏳ Waiting for layer view to be ready...');
      const layerView = await view.whenLayerView(targetLayer);
      console.log('✅ Layer view obtained, checking if updating...');
      
      // Wait for the layer view to finish any pending updates using reactiveUtils
      // This is especially important on the very first interaction when graphics were just added
      if ((layerView as any).updating) {
        console.log('⏳ Layer view is updating (first time), waiting for it to finish...');
        await reactiveUtils.whenOnce(() => !(layerView as any).updating);
        console.log('✅ First update cycle complete');
        
        // Wait for one more frame - sometimes the layer triggers another update right after
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // If it started updating again, wait for that too
        if ((layerView as any).updating) {
          console.log('⏳ Layer view is updating again (second time), waiting...');
          await reactiveUtils.whenOnce(() => !(layerView as any).updating);
          console.log('✅ Second update cycle complete');
        }
      }
      
      // Add a small delay to ensure rendering pipeline is completely stable
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ Ready to highlight');
      
      // Use ArcGIS's native highlight method - this creates the blue highlight ring automatically!
      console.log('🚀 About to call layerView.highlight()');
      const highlightHandle = (layerView as any).highlight(targetGraphic);
      console.log('🎯 Highlight handle returned:', highlightHandle);
      
      highlightHandleRef.current = highlightHandle;
      onHighlightChange?.(id);
      
      console.log('✨ Applied native ArcGIS highlight - handle stored');
      
      // Open the popup using the proper ArcGIS API method
      // Important: Since ArcGIS JS API 4.27+, popup is lazily loaded
      // Use view.openPopup() (not view.popup.open()) to properly initialize it
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (view && targetGraphic.geometry) {
        console.log('💬 Opening popup programmatically using view.openPopup()...');
        
        try {
          // Use view.openPopup() method which handles lazy-loading properly
          // This properly initializes the popup and sets selectedFeature
          view.openPopup({
            features: [targetGraphic],
            location: targetGraphic.geometry as __esri.Point
          });
          
          console.log('✅ Popup opened successfully');
          
          // Check popup state after a brief delay to let it initialize
          await new Promise(resolve => setTimeout(resolve, 50));
          console.log('💬 Popup state after openPopup():', {
            visible: view.popup?.visible,
            selectedFeature: view.popup?.selectedFeature ? 'EXISTS' : 'NULL/UNDEFINED',
            features: view.popup?.features?.length
          });
        } catch (error) {
          console.error('❌ Error opening popup:', error);
        }
      } else {
        console.warn('⚠️ Cannot open popup - missing view or geometry');
      }
      
    } catch (error) {
      console.error('❌ Error highlighting observation:', error);
    }
  })();
  
  // Store the operation so we can wait for it if needed
  highlightOperationRef.current = operation;
};

/**
 * Clears the current observation highlight and closes popup
 */
export const clearObservationHighlight = (
  deps: HighlightDependencies
): void => {
  const { view, highlightHandleRef, onHighlightChange } = deps;
  
  console.log('🧹 Clearing highlight');
  
  // Remove the ArcGIS native highlight
  if (highlightHandleRef.current) {
    highlightHandleRef.current.remove();
    highlightHandleRef.current = null;
    console.log('✅ Removed native highlight');
  }
  
  onHighlightChange?.(null);
  
  // Close popup
  if (view && view.popup) {
    view.popup.visible = false;
  }
};

