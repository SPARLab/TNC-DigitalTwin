import { CartItem } from '../types';
import { iNaturalistAPI } from './iNaturalistService';
import { animlService } from './animlService';
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

  // Determine what filters to apply
  // For camera-centric: use deploymentIds if specified
  // For animal-centric: use labels if specified
  // We should apply both if they exist (user might have filtered by both)
  const deploymentIds = animlFilters.deploymentIds && animlFilters.deploymentIds.length > 0 
    ? animlFilters.deploymentIds 
    : undefined;
  const labels = animlFilters.labels && animlFilters.labels.length > 0 
    ? animlFilters.labels 
    : undefined;

  // Query image labels with filters
  // Use estimatedCount with a small buffer (50 records) to account for filtering differences
  // If we have filters applied, we can be more confident in the estimate
  // But still add a small buffer in case of edge cases
  let maxResults: number;
  if (item.estimatedCount) {
    // Add a small buffer (10% or 50, whichever is smaller) if we have specific filters
    const hasFilters = (deploymentIds && deploymentIds.length > 0) || (labels && labels.length > 0);
    const buffer = hasFilters ? Math.min(Math.ceil(item.estimatedCount * 0.1), 50) : 100;
    maxResults = Math.min(item.estimatedCount + buffer, 10000);
  } else {
    maxResults = 10000;
  }

  console.log(`🔍 Animl Cart Export: Querying with filters - deployments: ${deploymentIds?.length || 0}, labels: ${labels?.length || 0}, maxResults: ${maxResults}`);

  const imageLabels = await animlService.queryImageLabels({
    startDate: coreFilters.startDate,
    endDate: coreFilters.endDate,
    deploymentIds,
    labels,
    searchMode,
    customPolygon,
    maxResults
  });

  console.log(`📊 Animl Cart Export: Fetched ${imageLabels.length} records from query`);

  // Filter out person/people observations (consistent with UI behavior)
  let filtered = imageLabels.filter(obs => {
    const labelLower = obs.label?.toLowerCase() || '';
    return labelLower !== 'person' && labelLower !== 'people';
  });

  console.log(`📊 Animl Cart Export: After excluding person/people: ${filtered.length} records`);

  // Apply deployment filter (should already be applied in query, but ensure it's applied)
  if (deploymentIds && deploymentIds.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(obs => deploymentIds.includes(obs.deployment_id));
    console.log(`📊 Animl Cart Export: After deployment filter (${deploymentIds.length} deployments): ${filtered.length} records (removed ${beforeCount - filtered.length})`);
  }

  // Apply label filter (should already be applied in query, but ensure it's applied)
  if (labels && labels.length > 0) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(obs => labels.includes(obs.label));
    console.log(`📊 Animl Cart Export: After label filter (${labels.length} labels): ${filtered.length} records (removed ${beforeCount - filtered.length})`);
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

  console.log(`✅ Animl Cart Export: Final filtered result: ${filtered.length} records (estimated: ${item.estimatedCount})`);
  
  if (filtered.length !== item.estimatedCount) {
    console.warn(`⚠️ Animl Cart Export: Filtered count (${filtered.length}) doesn't match estimated count (${item.estimatedCount})`);
  }

  return filtered;
}

