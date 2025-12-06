/**
 * Bird Photo Service
 * 
 * Fetches bird photos from iNaturalist's Taxa API by scientific name.
 * Results are cached in memory to minimize API calls.
 */

export interface BirdTaxonInfo {
  taxonId: number;
  scientificName: string;
  commonName: string | null;
  photoUrl: string | null;
  photoAttribution: string | null;
  wikipediaSummary: string | null;
  wikipediaUrl: string | null;
  conservationStatus: string | null;
  iconicTaxonName: string | null;
}

interface INaturalistTaxaResponse {
  total_results: number;
  page: number;
  per_page: number;
  results: Array<{
    id: number;
    name: string;
    preferred_common_name?: string;
    default_photo?: {
      medium_url?: string;
      square_url?: string;
      attribution?: string;
    };
    wikipedia_summary?: string;
    wikipedia_url?: string;
    conservation_status?: {
      status_name?: string;
    };
    iconic_taxon_name?: string;
  }>;
}

// In-memory cache for taxon info
const taxonCache = new Map<string, BirdTaxonInfo | null>();

// Track pending requests to avoid duplicate API calls
const pendingRequests = new Map<string, Promise<BirdTaxonInfo | null>>();

/**
 * Fetch bird taxon info (including photo) from iNaturalist by scientific name.
 * Results are cached to minimize API calls.
 * 
 * @param scientificName - The scientific name of the bird species
 * @returns BirdTaxonInfo with photo URL or null if not found
 */
export async function getBirdTaxonInfo(scientificName: string): Promise<BirdTaxonInfo | null> {
  if (!scientificName) return null;
  
  const cacheKey = scientificName.toLowerCase().trim();
  
  // Check cache first
  if (taxonCache.has(cacheKey)) {
    return taxonCache.get(cacheKey) || null;
  }
  
  // Check if there's already a pending request for this species
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }
  
  // Create the request promise
  const requestPromise = fetchTaxonInfo(scientificName, cacheKey);
  pendingRequests.set(cacheKey, requestPromise);
  
  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

async function fetchTaxonInfo(scientificName: string, cacheKey: string): Promise<BirdTaxonInfo | null> {
  try {
    // First, try the taxa/autocomplete endpoint which handles synonyms better
    let taxon = await searchTaxonByName(scientificName);
    
    // If no results, try searching with all_names (synonyms) in birds only
    if (!taxon) {
      taxon = await searchTaxonInBirds(scientificName);
    }
    
    if (!taxon) {
      taxonCache.set(cacheKey, null);
      return null;
    }
    
    const taxonInfo: BirdTaxonInfo = {
      taxonId: taxon.id,
      scientificName: taxon.name,
      commonName: taxon.preferred_common_name || null,
      photoUrl: taxon.default_photo?.medium_url || taxon.default_photo?.square_url || null,
      photoAttribution: taxon.default_photo?.attribution || null,
      wikipediaSummary: taxon.wikipedia_summary || null,
      wikipediaUrl: taxon.wikipedia_url || null,
      conservationStatus: taxon.conservation_status?.status_name || null,
      iconicTaxonName: taxon.iconic_taxon_name || null
    };
    
    taxonCache.set(cacheKey, taxonInfo);
    return taxonInfo;
  } catch (error) {
    console.warn(`Failed to fetch taxon info for ${scientificName}:`, error);
    taxonCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Search for a taxon using the autocomplete endpoint (better for name matching)
 */
async function searchTaxonByName(scientificName: string): Promise<INaturalistTaxaResponse['results'][0] | null> {
  const searchParams = new URLSearchParams({
    q: scientificName,
    rank: 'species,subspecies',
    is_active: 'any', // Include inactive/synonym names
    per_page: '10'
  });
  
  const response = await fetch(
    `https://api.inaturalist.org/v1/taxa/autocomplete?${searchParams.toString()}`,
    { headers: { 'Accept': 'application/json' } }
  );
  
  if (!response.ok) return null;
  
  const data: INaturalistTaxaResponse = await response.json();
  
  if (data.results.length === 0) return null;
  
  // Find exact match or best match
  const exactMatch = data.results.find(
    r => r.name.toLowerCase() === scientificName.toLowerCase()
  );
  
  return exactMatch || data.results[0];
}

/**
 * Search for a taxon specifically in birds (Aves) using all_names for synonym matching
 */
async function searchTaxonInBirds(scientificName: string): Promise<INaturalistTaxaResponse['results'][0] | null> {
  // Search in Aves (birds) taxon - ID 3 on iNaturalist
  const searchParams = new URLSearchParams({
    q: scientificName,
    taxon_id: '3', // Aves (birds)
    rank: 'species,subspecies',
    is_active: 'any',
    all_names: 'true', // Include synonyms in search
    per_page: '10'
  });
  
  const response = await fetch(
    `https://api.inaturalist.org/v1/taxa?${searchParams.toString()}`,
    { headers: { 'Accept': 'application/json' } }
  );
  
  if (!response.ok) return null;
  
  const data: INaturalistTaxaResponse = await response.json();
  
  if (data.results.length === 0) return null;
  
  // Find the best match - check if any result has a matching synonym
  // The API returns taxa that match either the current name or synonyms
  return data.results[0];
}

/**
 * Get photo URL for a bird species (convenience wrapper).
 * Returns null if no photo is available.
 */
export async function getBirdPhotoUrl(scientificName: string): Promise<string | null> {
  const info = await getBirdTaxonInfo(scientificName);
  return info?.photoUrl || null;
}

/**
 * Prefetch taxon info for multiple species.
 * Useful for batch loading photos when displaying a list.
 * 
 * @param scientificNames - Array of scientific names to prefetch
 * @param maxConcurrent - Maximum concurrent API requests (default: 5)
 */
export async function prefetchBirdPhotos(
  scientificNames: string[],
  maxConcurrent: number = 5
): Promise<void> {
  // Filter out already cached names
  const uncachedNames = scientificNames.filter(
    name => !taxonCache.has(name.toLowerCase().trim())
  );
  
  if (uncachedNames.length === 0) return;
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < uncachedNames.length; i += maxConcurrent) {
    const batch = uncachedNames.slice(i, i + maxConcurrent);
    await Promise.all(batch.map(name => getBirdTaxonInfo(name)));
  }
}

/**
 * Clear the taxon cache.
 * Useful for testing or when you want to refresh all data.
 */
export function clearTaxonCache(): void {
  taxonCache.clear();
}

/**
 * Get the current cache size (for debugging).
 */
export function getCacheSize(): number {
  return taxonCache.size;
}
