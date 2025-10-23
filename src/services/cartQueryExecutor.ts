import { CartItem } from '../types';
import { iNaturalistAPI } from './iNaturalistService';
// Import other services as needed

/**
 * Execute a cart query and return the results
 * Re-runs the stored query parameters to fetch fresh data
 */
export async function executeCartQuery(item: CartItem): Promise<any[]> {
  switch (item.dataSource) {
    case 'inaturalist':
      return executeINaturalistQuery(item);
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
    hasPhotos: inatFilters.hasPhotos,
    geoprivacy: inatFilters.geoprivacy,
    accBelow: inatFilters.accBelow,
    photoLicense: inatFilters.photoLicense,
    outOfRange: inatFilters.outOfRange,
    maxResults: 10000 // Higher limit for exports
  });
  
  return response.results;
}

