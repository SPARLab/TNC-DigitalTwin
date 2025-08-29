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
  
  // Dangermond Preserve bounding box coordinates
  private readonly dangermondBounds = {
    swlat: 34.4,    // Southwest latitude
    swlng: -120.45, // Southwest longitude  
    nelat: 34.55,   // Northeast latitude
    nelng: -120.0   // Northeast longitude
  };

  /**
   * Fetch recent observations from the Dangermond Preserve
   */
  async getRecentObservations(options: {
    perPage?: number;
    page?: number;
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
  } = {}): Promise<iNaturalistResponse> {
    const {
      perPage = 100,
      page = 1,
      qualityGrade,
      iconicTaxa,
      daysBack = 30
    } = options;

    // Calculate date range for recent observations
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    const params = new URLSearchParams({
      // Geographic bounds for Dangermond Preserve
      swlat: this.dangermondBounds.swlat.toString(),
      swlng: this.dangermondBounds.swlng.toString(),
      nelat: this.dangermondBounds.nelat.toString(),
      nelng: this.dangermondBounds.nelng.toString(),
      
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
      
      // Include photos when available
      photos: 'true'
    });

    // Add optional filters
    if (qualityGrade) {
      params.append('quality_grade', qualityGrade);
    }

    if (iconicTaxa && iconicTaxa.length > 0) {
      params.append('iconic_taxa', iconicTaxa.join(','));
    }

    try {
      const response = await fetch(`${this.baseUrl}/observations?${params}`);
      
      if (!response.ok) {
        throw new Error(`iNaturalist API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the response to match our interface
      return {
        total_results: data.total_results,
        page: data.page,
        per_page: data.per_page,
        results: data.results.map(this.transformObservation)
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
    return {
      id: obs.id,
      observed_on: obs.observed_on,
      created_at: obs.created_at,
      updated_at: obs.updated_at,
      time_observed_at: obs.time_observed_at,
      location: obs.location ? [obs.location.split(',')[1], obs.location.split(',')[0]] : [0, 0],
      geojson: obs.geojson || {
        type: 'Point',
        coordinates: obs.location ? [parseFloat(obs.location.split(',')[1]), parseFloat(obs.location.split(',')[0])] : [0, 0]
      },
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

