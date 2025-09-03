export interface iNaturalistObservation {
  id: number;
  observed_on: string;
  created_at: string;
  updated_at: string;
  time_observed_at: string | null;
  location: [number, number]; // [longitude, latitude]
  geojson: {
    type: 'Point';
    coordinates: [number, number];
  };
  geoprivacy: 'open' | 'obscured' | 'private' | null;
  taxon: {
    id: number;
    name: string;
    preferred_common_name: string | null;
    iconic_taxon_name: string;
    rank: string;
    default_photo?: {
      square_url: string;
      medium_url: string;
    };
  } | null;
  user: {
    id: number;
    login: string;
  };
  photos: Array<{
    id: number;
    url: string;
    square_url: string;
    medium_url: string;
  }>;
  quality_grade: 'research' | 'needs_id' | 'casual';
  uri: string;
}

export interface iNaturalistResponse {
  total_results: number;
  page: number;
  per_page: number;
  results: iNaturalistObservation[];
}

class iNaturalistService {
  private readonly baseUrl = 'https://api.inaturalist.org/v1';
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests for rate limiting
  
  // Dangermond Preserve place ID from iNaturalist
  private readonly dangermondPlaceId = 136122; // "Jack and Laura Dangermond Preserve"
  
  // Fallback bounding box coordinates (kept for reference)
  private readonly dangermondBounds = {
    swlat: 34.4,    // Southwest latitude
    swlng: -120.45, // Southwest longitude  
    nelat: 34.55,   // Northeast latitude
    nelng: -120.0   // Northeast longitude
  };

  /**
   * Fetch recent observations from the Dangermond Preserve using place-based filtering
   * for more accurate results than bounding box filtering.
   */
  /**
   * Rate limiting helper
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async getRecentObservations(options: {
    perPage?: number;
    page?: number;
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    maxResults?: number; // Maximum total results to fetch across all pages
  } = {}): Promise<iNaturalistResponse> {
    const {
      perPage = 200, // Increased from 100 to get more per request
      page = 1,
      qualityGrade,
      iconicTaxa,
      daysBack = 30,
      maxResults = 500 // Default max results across all pages
    } = options;

    // Calculate date range for recent observations
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    const params = new URLSearchParams({
      // Use place-based filtering for more accurate results
      place_id: this.dangermondPlaceId.toString(),
      
      // Pagination
      per_page: perPage.toString(),
      page: page.toString(),
      
      // Date range
      d1: startDate.toISOString().split('T')[0], // Start date (YYYY-MM-DD)
      d2: endDate.toISOString().split('T')[0],   // End date (YYYY-MM-DD)
      
      // Sorting - most recent first
      order: 'desc',
      order_by: 'observed_on',
      
      // Only include observations with coordinates
      has: 'geo',
      
      // Filter out observations with poor location accuracy (> 1000m)
      acc_below: '1000',
      
      // Include photos when available - try different approaches
      photos: 'true',
      photo_license: 'any'
    });

    // Add optional filters
    if (qualityGrade) {
      params.append('quality_grade', qualityGrade);
    }

    if (iconicTaxa && iconicTaxa.length > 0) {
      params.append('iconic_taxa', iconicTaxa.join(','));
    }

    // Fetch multiple pages if needed
    let allResults: any[] = [];
    let currentPage = page;
    let totalResults = 0;
    
    try {
      while (allResults.length < maxResults) {
        // Rate limiting
        await this.waitForRateLimit();
        
        // Update page parameter
        params.set('page', currentPage.toString());
        
        const apiUrl = `${this.baseUrl}/observations?${params}`;
        console.log(`iNaturalist API URL (page ${currentPage}):`, apiUrl);
        console.log('Query parameters (using place-based filtering):', Object.fromEntries(params));
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`iNaturalist API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        totalResults = data.total_results;
        
        console.log(`Page ${currentPage}: ${data.results?.length || 0} observations (total available: ${totalResults})`);
        
        // Debug: Log photo information for first few observations
        if (data.results && data.results.length > 0) {
          console.log('Photo debug - First 3 observations:');
          data.results.slice(0, 3).forEach((obs: any, index: number) => {
            console.log(`Observation ${index + 1} (ID: ${obs.id}):`, {
              hasPhotos: obs.photos && obs.photos.length > 0,
              photoCount: obs.photos ? obs.photos.length : 0,
              firstPhoto: obs.photos && obs.photos.length > 0 ? obs.photos[0] : null,
              taxonPhoto: obs.taxon?.default_photo || null
            });
          });
        }
        
        if (!data.results || data.results.length === 0) {
          // No more results
          break;
        }
        
        allResults.push(...data.results);
        
        // Check if we've reached the end or our limit
        if (data.results.length < perPage || allResults.length >= maxResults) {
          break;
        }
        
        currentPage++;
      }
      
      // Trim to maxResults if we got too many
      if (allResults.length > maxResults) {
        allResults = allResults.slice(0, maxResults);
      }
      
      console.log(`Total fetched: ${allResults.length} observations across ${currentPage - page + 1} pages`);
      
      // Transform the response to match our interface
      return {
        total_results: totalResults,
        page: page,
        per_page: allResults.length,
        results: allResults.map(this.transformObservation)
      };
    } catch (error) {
      console.error('Error fetching iNaturalist observations:', error);
      throw error;
    }
  }

  /**
   * Transform raw iNaturalist observation to our interface
   */
  private transformObservation(obs: any): iNaturalistObservation {
    // iNaturalist API returns location as "latitude,longitude" string
    // We need [longitude, latitude] for GeoJSON and mapping libraries
    const locationParts = obs.location ? obs.location.split(',') : ['0', '0'];
    const latitude = parseFloat(locationParts[0]);
    const longitude = parseFloat(locationParts[1]);
    
    return {
      id: obs.id,
      observed_on: obs.observed_on,
      created_at: obs.created_at,
      updated_at: obs.updated_at,
      time_observed_at: obs.time_observed_at,
      location: [longitude, latitude], // [longitude, latitude] format
      geojson: obs.geojson || {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
      },
      geoprivacy: obs.geoprivacy || null,
      taxon: obs.taxon ? {
        id: obs.taxon.id,
        name: obs.taxon.name,
        preferred_common_name: obs.taxon.preferred_common_name,
        iconic_taxon_name: obs.taxon.iconic_taxon_name,
        rank: obs.taxon.rank,
        default_photo: obs.taxon.default_photo
      } : null,
      user: {
        id: obs.user.id,
        login: obs.user.login
      },
      photos: obs.photos || [],
      quality_grade: obs.quality_grade,
      uri: obs.uri
    };
  }

  /**
   * Get available iconic taxa for filtering
   */
  getIconicTaxa(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'Animalia', label: 'Animals', icon: '🐾' },
      { value: 'Plantae', label: 'Plants', icon: '🌱' },
      { value: 'Aves', label: 'Birds', icon: '🐦' },
      { value: 'Mammalia', label: 'Mammals', icon: '🦌' },
      { value: 'Reptilia', label: 'Reptiles', icon: '🦎' },
      { value: 'Amphibia', label: 'Amphibians', icon: '🐸' },
      { value: 'Actinopterygii', label: 'Fish', icon: '🐟' },
      { value: 'Insecta', label: 'Insects', icon: '🦋' },
      { value: 'Arachnida', label: 'Spiders', icon: '🕷️' },
      { value: 'Mollusca', label: 'Mollusks', icon: '🐚' }
    ];
  }
}

export const iNaturalistAPI = new iNaturalistService();

