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

  // Query image labels based on view mode
  const imageLabels = await animlService.queryImageLabels({
    startDate: coreFilters.startDate,
    endDate: coreFilters.endDate,
    deploymentIds: animlFilters.viewMode === 'camera-centric' ? animlFilters.deploymentIds : undefined,
    labels: animlFilters.viewMode === 'animal-centric' ? animlFilters.labels : undefined,
    searchMode,
    customPolygon,
    maxResults: 10000
  });

  // Filter by hasImages if specified
  let filtered = imageLabels;
  if (animlFilters.hasImages === true) {
    filtered = filtered.filter(obs => obs.small_url || obs.medium_url);
  } else if (animlFilters.hasImages === false) {
    filtered = filtered.filter(obs => !obs.small_url && !obs.medium_url);
  }

  return filtered;
}

