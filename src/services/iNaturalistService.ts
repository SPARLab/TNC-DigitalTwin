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
  private readonly minRequestInterval = 1000; // 1 second between requests (60 requests/minute max)
  private dailyRequestCount = 0;
  private lastResetDate = new Date().toDateString();
  private readonly maxDailyRequests = 10000; // iNaturalist daily limit
  
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
   * Rate limiting helper - respects iNaturalist's 60 requests/minute and 10,000 requests/day limits
   */
private async waitForRateLimit(): Promise<void> {
    // Reset daily counter if it's a new day
    const currentDate = new Date().toDateString();
    if (currentDate !== this.lastResetDate) {
      this.dailyRequestCount = 0;
      this.lastResetDate = currentDate;
      console.log('Daily request counter reset for iNaturalist API');
    }
    
    // Check daily limit
    if (this.dailyRequestCount >= this.maxDailyRequests) {
      throw new Error(`Daily iNaturalist API limit reached (${this.maxDailyRequests} requests). Please try again tomorrow.`);
    }
    
    // Rate limiting for requests per minute (60/minute = 1 per second)
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`iNaturalist rate limiting: waiting ${waitTime}ms (respecting 60 requests/minute limit)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.dailyRequestCount++;
    
    // Log progress for user awareness
    if (this.dailyRequestCount % 10 === 0) {
      console.log(`iNaturalist API requests today: ${this.dailyRequestCount}/${this.maxDailyRequests}`);
    }
  }

  async getRecentObservations(options: {
    perPage?: number;
    page?: number;
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
    maxResults?: number; // Maximum total results to fetch across all pages
  } = {}): Promise<iNaturalistResponse> {
    const {
      perPage = 200, // Increased from 100 to get more per request
      page = 1,
      qualityGrade,
      iconicTaxa,
      daysBack = 30,
      startDate: customStartDate,
      endDate: customEndDate,
      maxResults = 500 // Default max results across all pages
    } = options;

    // Calculate date range - use custom dates if provided, otherwise use daysBack
    let startDate: Date;
    let endDate: Date;
    
    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      console.log(`Using custom date range: ${customStartDate} to ${customEndDate}`);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);
      console.log(`Using daysBack: ${daysBack} (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`);
    }

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
    
    const estimatedPages = Math.ceil(maxResults / perPage);
    const estimatedTime = estimatedPages * (this.minRequestInterval / 1000);
    
    console.log(`🔍 Starting iNaturalist search - estimated ${estimatedPages} pages, ~${Math.round(estimatedTime)}s (respecting rate limits)`);
    
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
        
        const progress = Math.min(100, Math.round((allResults.length + (data.results?.length || 0)) / maxResults * 100));
        console.log(`📊 iNaturalist Progress: Page ${currentPage} - ${data.results?.length || 0} observations fetched (${allResults.length + (data.results?.length || 0)}/${maxResults} total, ${progress}% complete)`);
        console.log(`⏱️  Rate limiting: Respecting 60 requests/minute limit (${this.dailyRequestCount}/${this.maxDailyRequests} daily requests used)`);
        
        if (totalResults > maxResults) {
          console.log(`ℹ️  Note: ${totalResults} observations available, but limiting to ${maxResults} to respect API usage guidelines`);
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

