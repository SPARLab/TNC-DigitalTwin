import { CartItem } from '../types';
import { iNaturalistAPI } from './iNaturalistService';
import { animlService } from './animlService';
import { getDateRange, formatDateForAPI } from '../utils/dateUtils';
import { fetchDroneImageryForProject } from './droneImageryService';
// Import other services as needed

/**
 * Execute a cart query and return the results
 * Re-runs the stored query parameters to fetch fresh data
 */
export async function executeCartQuery(item: CartItem): Promise<any[]> {
  switch (item.dataSource) {
    case 'inaturalist':
      return executeINaturalistQuery(item);
    case 'animl':
      return executeAnimlQuery(item);
    case 'drone-imagery':
      return executeDroneImageryQuery(item);
    case 'calflora':
      // TODO: Future implementation
      throw new Error('CalFlora export not yet implemented');
    case 'ebird':
      // TODO: Future implementation
      throw new Error('eBird export not yet implemented');
    case 'dendra':
      // TODO: Future implementation
      throw new Error('Dendra export not yet implemented');
    default:
      throw new Error(`Unknown data source: ${item.dataSource}`);
  }
}

/**
 * Execute an iNaturalist query from a cart item
 */
async function executeINaturalistQuery(item: CartItem): Promise<any[]> {
  const { coreFilters, customFilters } = item;
  const inatFilters = customFilters.inaturalist;
  
  if (!inatFilters) {
    throw new Error('iNaturalist filters not found in cart item');
  }
  
  const response = await iNaturalistAPI.getRecentObservations({
    daysBack: coreFilters.daysBack,
    startDate: coreFilters.startDate,
    endDate: coreFilters.endDate,
    qualityGrade: inatFilters.qualityGrade,
    iconicTaxa: inatFilters.iconicTaxa,
    taxonName: inatFilters.taxonName,
    photoFilter: inatFilters.photoFilter,
    months: inatFilters.months,
    maxResults: 10000 // Higher limit for exports
  });
  
  return response.results;
}

/**
 * Execute an Animl query from a cart item
 * 
 * IMPORTANT: This function must return EXACTLY the observations that match the filters
 * stored in the cart item. The filtered count must match item.estimatedCount.
 * 
 * Filtering logic (must match AnimlDetailsSidebar and App.tsx):
 * 1. Always exclude person/people observations
 * 2. Apply deploymentIds filter if specified (empty array = no filter)
 * 3. Apply labels filter if specified (empty array = no filter)
 * 4. Apply hasImages filter if specified
 * 
 * The function applies filters both server-side (in query) and client-side (safety net)
 * to ensure we get exactly the expected observations.
 */
async function executeAnimlQuery(item: CartItem): Promise<any[]> {
  const { coreFilters, customFilters } = item;
  const animlFilters = customFilters.animl;
  
  if (!animlFilters) {
    throw new Error('Animl filters not found in cart item');
  }

  // Determine search mode from spatial filter
  let searchMode: 'preserve-only' | 'expanded' | 'custom' = 'expanded';
  let customPolygon: string | undefined;
  
  if (coreFilters.spatialFilter === 'Dangermond Preserve') {
    searchMode = 'preserve-only';
  } else if (coreFilters.spatialFilter === 'Dangermond + Margin') {
    searchMode = 'expanded';
  } else if (coreFilters.spatialFilter === 'Draw Area' && coreFilters.customPolygon) {
    searchMode = 'custom';
    customPolygon = JSON.stringify(coreFilters.customPolygon);
  }

  // CRITICAL: Convert daysBack to startDate/endDate if dates aren't explicitly set
  // This ensures the date filter is applied correctly during export
  let startDate = coreFilters.startDate;
  let endDate = coreFilters.endDate;
  if (!startDate || !endDate) {
    // If dates aren't set, calculate from daysBack (default to 30 if not specified)
    const daysBack = coreFilters.daysBack || 30;
    const dateRange = getDateRange(daysBack);
    startDate = formatDateForAPI(dateRange.startDate);
    endDate = formatDateForAPI(dateRange.endDate);
    console.log(`📅 Animl Cart Export: Converted daysBack (${daysBack}) to date range: ${startDate} to ${endDate}`);
  }

  // Determine what filters to apply
  // IMPORTANT: These must match exactly what was used when calculating filteredCount
  // Empty arrays should be treated as "no filter" (undefined) for the query
  // But we'll still apply client-side filtering to ensure correctness
  const deploymentIds = animlFilters.deploymentIds && animlFilters.deploymentIds.length > 0 
    ? animlFilters.deploymentIds 
    : undefined;
  const labels = animlFilters.labels && animlFilters.labels.length > 0 
    ? animlFilters.labels 
    : undefined;

  // Calculate maxResults: use estimatedCount with a small buffer
  // The buffer accounts for potential discrepancies between server and client filtering
  // Since we apply client-side filtering as a safety net, a small buffer is sufficient
  let maxResults: number;
  if (item.estimatedCount) {
    // Small buffer: 10% of estimated or 50, whichever is smaller
    // This ensures we fetch enough records without over-fetching
    const buffer = Math.min(Math.ceil(item.estimatedCount * 0.1), 50);
    maxResults = Math.min(item.estimatedCount + buffer, 10000);
    
    // If we have specific filters, we're more confident, so we can use a smaller buffer
    // But we still need some buffer in case server-side filtering differs slightly
    const hasSpecificFilters = (deploymentIds && deploymentIds.length > 0) || (labels && labels.length > 0);
    if (!hasSpecificFilters) {
      // If no specific filters, we might need a larger buffer
      maxResults = Math.min(item.estimatedCount + 100, 10000);
    }
  } else {
    maxResults = 10000;
  }

  console.log(`🔍 Animl Cart Export: Querying with filters - deployments: ${deploymentIds?.length || 0}, labels: ${labels?.length || 0}, maxResults: ${maxResults}, estimatedCount: ${item.estimatedCount}`);
  console.log(`📅 Animl Cart Export: Date range - startDate: ${startDate}, endDate: ${endDate}`);
  if (labels && labels.length > 0) {
    console.log(`   📋 Labels: ${labels.join(', ')}`);
  }
  if (deploymentIds && deploymentIds.length > 0) {
    console.log(`   📷 Deployments: ${deploymentIds.join(', ')}`);
  }

  // Query with filters applied server-side
  const imageLabels = await animlService.queryImageLabels({
    startDate,
    endDate,
    deploymentIds,
    labels,
    searchMode,
    customPolygon,
    maxResults
  });

  console.log(`📊 Animl Cart Export: Fetched ${imageLabels.length} records from database query`);
  console.log(`   🎯 Expected count from cart: ${item.estimatedCount}`);
  if (imageLabels.length === item.estimatedCount) {
    console.log(`   ✅ Count matches! Export will contain exactly ${item.estimatedCount} records.`);
  } else {
    console.log(`   ⚠️  Count mismatch: Database returned ${imageLabels.length}, but expected ${item.estimatedCount}.`);
    console.log(`   💡 This may indicate data changed since cart item was created, or filters are not being applied correctly.`);
  }

  // CRITICAL: Apply client-side filtering to ensure we get EXACTLY the selected observations
  // This matches the filtering logic in AnimlDetailsSidebar and App.tsx
  
  // Step 1: Filter out person/people observations (ALWAYS applied, consistent with UI)
  let filtered = imageLabels.filter(obs => {
    const labelLower = obs.label?.toLowerCase() || '';
    return labelLower !== 'person' && labelLower !== 'people';
  });

  console.log(`📊 Animl Cart Export: After excluding person/people: ${filtered.length} records`);

  // Step 2: Apply deployment filter (MUST match what was used for filteredCount)
  // If deploymentIds is undefined/empty, this means "all deployments" (no filter)
  // But we need to check: in animal-centric mode with no explicit selection, we might want all deployments
  // However, since filteredCount was calculated with specific filters, we should apply those exact filters
  if (deploymentIds && deploymentIds.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(obs => deploymentIds.includes(obs.deployment_id));
    const removed = beforeCount - filtered.length;
    console.log(`📊 Animl Cart Export: After deployment filter (${deploymentIds.length} deployments): ${filtered.length} records${removed > 0 ? ` (removed ${removed})` : ''}`);
  } else {
    console.log(`📊 Animl Cart Export: No deployment filter applied (showing all deployments)`);
  }

  // Step 3: Apply label filter (MUST match what was used for filteredCount)
  // If labels is undefined/empty, this means "all labels" (no filter)
  if (labels && labels.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(obs => labels.includes(obs.label));
    const removed = beforeCount - filtered.length;
    console.log(`📊 Animl Cart Export: After label filter (${labels.length} labels): ${filtered.length} records${removed > 0 ? ` (removed ${removed})` : ''}`);
  } else {
    console.log(`📊 Animl Cart Export: No label filter applied (showing all labels)`);
  }

  // Final validation: Check if the filtered count matches the estimated count
  if (item.estimatedCount && filtered.length !== item.estimatedCount) {
    const difference = Math.abs(filtered.length - item.estimatedCount);
    console.warn(`⚠️ Animl Cart Export: Count mismatch after filtering`);
    console.warn(`   Expected: ${item.estimatedCount} | Got: ${filtered.length} | Difference: ${difference}`);
    
    if (filtered.length > item.estimatedCount) {
      // More records than expected - this may happen if data was added since cart creation
      // Trim to the estimated count to match user expectations
      console.warn(`   📝 Trimming to ${item.estimatedCount} most recent records to match cart estimate`);
      filtered = filtered.slice(0, item.estimatedCount);
    } else {
      // Fewer records than expected - this may happen if data was deleted
      console.warn(`   📝 Database has fewer records (${filtered.length}) than expected (${item.estimatedCount})`);
      console.warn(`   📝 Exporting all ${filtered.length} available records`);
      // No action needed - we'll export what we have
    }
  }

  // Filter by hasImages if specified (though this is likely always true for camera traps)
  if (animlFilters.hasImages === true) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(obs => obs.small_url || obs.medium_url);
    console.log(`📊 Animl Cart Export: After hasImages filter: ${filtered.length} records (removed ${beforeCount - filtered.length})`);
  } else if (animlFilters.hasImages === false) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(obs => !obs.small_url && !obs.medium_url);
    console.log(`📊 Animl Cart Export: After hasImages=false filter: ${filtered.length} records (removed ${beforeCount - filtered.length})`);
  }

  // Final validation and adjustment
  console.log(`✅ Animl Cart Export: Final filtered result: ${filtered.length} records (estimated: ${item.estimatedCount})`);
  
  // CRITICAL: Ensure we return exactly the estimatedCount, no more, no less
  // This is the final safety check to prevent exporting too many or too few records
  if (item.estimatedCount !== undefined) {
    if (filtered.length > item.estimatedCount) {
      // This should have been handled above, but as a final safeguard, limit to estimatedCount
      console.warn(`⚠️ Animl Cart Export: Final count (${filtered.length}) still exceeds estimated (${item.estimatedCount}). Limiting to estimated count as final safeguard.`);
      filtered = filtered.slice(0, item.estimatedCount);
    } else if (filtered.length < item.estimatedCount) {
      // We have fewer records than expected - this is okay, just log a warning
      const difference = item.estimatedCount - filtered.length;
      console.warn(`⚠️ Animl Cart Export: Final count (${filtered.length}) is ${difference} LESS than estimated (${item.estimatedCount}).`);
      console.warn(`   This could indicate: maxResults was too small, data changed since cart creation, or filters are more restrictive than expected.`);
      console.warn(`   Exporting ${filtered.length} records (less than estimated).`);
    } else {
      console.log(`✅ Animl Cart Export: Count matches expected value - export will contain exactly ${filtered.length} records`);
    }
  }

  // Return EXACTLY the filtered observations (limited to estimatedCount if needed)
  // This ensures CSVs contain exactly what was estimated, preventing oversized files
  return filtered;
}

/**
 * Execute a drone imagery query from a cart item
 * Returns metadata manifest (not actual imagery files)
 * 
 * The export contains:
 * - Project and plan metadata
 * - Capture dates
 * - Extent geometries (WKT and bounding box coordinates)
 * - Access links (WMTS service, ArcGIS Online portal, image collections)
 * - Technical details (item IDs, service URLs)
 */
async function executeDroneImageryQuery(item: CartItem): Promise<any[]> {
  const { customFilters } = item;
  const droneFilters = customFilters.droneImagery;
  
  if (!droneFilters) {
    throw new Error('Drone imagery filters not found in cart item');
  }

  console.log(`🛸 Drone Imagery Cart Export: Fetching metadata for project "${droneFilters.projectName}"`);
  console.log(`   📷 Layer IDs: ${droneFilters.layerIds.join(', ')}`);

  // Fetch all layers for the project
  const allLayers = await fetchDroneImageryForProject(droneFilters.projectName);
  
  console.log(`📊 Drone Imagery Cart Export: Fetched ${allLayers.length} layers from project`);

  // Filter to only the selected layers
  const selectedLayers = allLayers.filter(layer => 
    droneFilters.layerIds.includes(layer.planId)
  );

  console.log(`📊 Drone Imagery Cart Export: Filtered to ${selectedLayers.length} selected layers`);

  if (selectedLayers.length !== droneFilters.layerIds.length) {
    console.warn(`⚠️ Drone Imagery Cart Export: Some layers not found. Expected ${droneFilters.layerIds.length}, found ${selectedLayers.length}`);
  }

  // Transform to export format
  const exportData = selectedLayers.map(layer => {
    // Format extent as bounding box
    let extent = '';
    if (layer.planGeometry && layer.planGeometry.length > 0) {
      const coords = layer.planGeometry[0];
      const lons = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      const minLon = Math.min(...lons).toFixed(6);
      const maxLon = Math.max(...lons).toFixed(6);
      const minLat = Math.min(...lats).toFixed(6);
      const maxLat = Math.max(...lats).toFixed(6);
      extent = `${minLon},${minLat},${maxLon},${maxLat}`;
    }

    // Format extent as WKT
    let extent_wkt = '';
    if (layer.planGeometry && layer.planGeometry.length > 0) {
      const coords = layer.planGeometry[0];
      const coordPairs = coords.map(c => `${c[0]} ${c[1]}`).join(', ');
      extent_wkt = `POLYGON ((${coordPairs}))`;
    }

    const exportRecord: any = {
      project_name: layer.projectName,
      plan_name: layer.planName,
      plan_id: layer.planId,
      date_captured: layer.dateCaptured.toISOString().split('T')[0], // YYYY-MM-DD
      last_updated: layer.lastUpdated.toISOString().split('T')[0],
      record_type: layer.recordType,
      extent_bbox: extent,
      extent_wkt: extent_wkt,
      wmts_item_id: layer.wmts.itemId,
      wmts_link: layer.wmts.link,
      portal_url: `https://dangermondpreserve-spatial.com/portal/home/item.html?id=${layer.wmts.itemId}`,
      tif_download_url: layer.tifUrl || '', // Azure Blob Storage URL for raw TIF
    };

    // Add image collection links if available and requested
    if (droneFilters.includeImageCollections && layer.imageCollection) {
      exportRecord.collection_item_id = layer.imageCollection.itemId;
      exportRecord.collection_link = layer.imageCollection.link;
      exportRecord.collection_portal_url = `https://dangermondpreserve-spatial.com/portal/home/item.html?id=${layer.imageCollection.itemId}`;
    }

    return exportRecord;
  });

  console.log(`✅ Drone Imagery Cart Export: Prepared ${exportData.length} records for export`);

  return exportData;
}

