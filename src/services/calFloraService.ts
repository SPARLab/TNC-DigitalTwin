export interface CalFloraPlant {
  id: string;
  scientificName: string;
  commonName: string | null;
  family: string | null;
  nativeStatus: 'native' | 'non-native' | 'invasive' | 'unknown';
  calIpcRating: string | null; // Cal-IPC invasiveness rating
  location: [number, number]; // [longitude, latitude]
  geojson: {
    type: 'Point';
    coordinates: [number, number];
  };
  county: string | null;
  quad: string | null; // USGS quadrangle
  elevation: number | null;
  observationDate: string | null;
  lastUpdated: string;
  dataSource: 'calflora-invasive' | 'calflora-native' | 'calflora-vegetation';
  attributes: Record<string, any>; // Store additional ArcGIS attributes
}

export interface CalFloraResponse {
  total_results: number;
  results: CalFloraPlant[];
  dataSource: string;
}

class CalFloraService {
  private readonly invasivePlantsUrl = 'https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/biosds763_fmu/FeatureServer/0';
  private readonly nativePlantsUrl = 'https://services3.arcgis.com/21H3muniXm83m5hZ/ArcGIS/rest/services/Native_Plant_Richness_WFL1/FeatureServer/0';
  private readonly vegetationUrl = 'https://services1.arcgis.com/X1hcdGx5Fxqn4d0j/arcgis/rest/services/Vegetation/FeatureServer/0';
  
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500; // 0.5 second between requests (conservative rate limiting)
  
  // Dangermond Preserve bounding box
  private readonly dangermondBounds = {
    swlat: 34.4,    // Southwest latitude
    swlng: -120.45, // Southwest longitude  
    nelat: 34.55,   // Northeast latitude
    nelng: -120.0   // Northeast longitude
  };

  /**
   * Rate limiting helper for ArcGIS services
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`CalFlora rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch invasive plant data from CalFlora's ArcGIS service
   */
  async getInvasivePlants(options: {
    maxResults?: number;
    boundingBox?: {
      swlat: number;
      swlng: number;
      nelat: number;
      nelng: number;
    };
    countyFilter?: string;
  } = {}): Promise<CalFloraResponse> {
    const {
      maxResults = 1000,
      boundingBox = this.dangermondBounds,
      countyFilter
    } = options;

    await this.waitForRateLimit();

    // Build WHERE clause - try county filter first, then spatial if that fails
    let whereClause = '1=1';
    if (countyFilter) {
      whereClause = `County = '${countyFilter}'`;
    }
    
    const params = new URLSearchParams({
      where: whereClause,
      outFields: '*', // Get all fields
      returnGeometry: 'true',
      outSR: '4326', // Request WGS84 coordinates
      resultRecordCount: maxResults.toString(),
      f: 'json'
    });

    // Only add spatial filter if no county filter and we want to try spatial
    if (!countyFilter) {
      // Try broader California extent first
      const californiaExtent = '-124.4096,32.5343,-114.1308,42.0095';
      params.append('geometry', californiaExtent);
      params.append('geometryType', 'esriGeometryEnvelope');
      params.append('spatialRel', 'esriSpatialRelIntersects');
    }

    const apiUrl = `${this.invasivePlantsUrl}/query?${params}`;
    console.log('CalFlora Invasive Plants API URL:', apiUrl);

    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`CalFlora API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`CalFlora API error: ${data.error.message}`);
      }

      console.log(`📊 CalFlora Invasive Plants: ${data.features?.length || 0} records fetched`);
      
      // Filter by Dangermond area if we got broader results
      let filteredFeatures = data.features || [];
      if (!countyFilter && filteredFeatures.length > 0) {
        filteredFeatures = filteredFeatures.filter((feature: any) => {
          const lat = feature.attributes?.Latitude;
          const lng = feature.attributes?.Longitude;
          if (lat && lng) {
            return lat >= boundingBox.swlat && lat <= boundingBox.nelat &&
                   lng >= boundingBox.swlng && lng <= boundingBox.nelng;
          }
          return false;
        });
        console.log(`🎯 Filtered to Dangermond area: ${filteredFeatures.length} records`);
      }
      
      return {
        total_results: filteredFeatures.length,
        results: filteredFeatures.map((feature: any) => this.transformInvasivePlant(feature)),
        dataSource: 'CalFlora Invasive Plants'
      };
    } catch (error) {
      console.error('Error fetching CalFlora invasive plants:', error);
      throw error;
    }
  }

  /**
   * Get all CalFlora plant data (currently only invasive plants)
   * Note: Native plant service provides richness data, not individual observations
   */
  async getAllPlants(options: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
    countyFilter?: string;
  } = {}): Promise<CalFloraResponse> {
    const { maxResults = 1000, plantType = 'invasive', countyFilter } = options;
    
    // For now, only invasive plants are available as individual observations
    // The "native plants" service is actually richness data, not individual plants
    if (plantType === 'invasive' || plantType === 'all') {
      return await this.getInvasivePlants({ 
        maxResults, 
        countyFilter,
        boundingBox: this.dangermondBounds 
      });
    }
    
    // Return empty result for native plants since we don't have individual observations
    return {
      total_results: 0,
      results: [],
      dataSource: 'CalFlora Plants'
    };
  }

  /**
   * Transform ArcGIS invasive plant feature to our interface
   */
  private transformInvasivePlant(feature: any): CalFloraPlant {
    const attrs = feature.attributes || {};
    const geom = feature.geometry;
    
    // Handle different geometry types - use lat/lng from attributes if geometry not available
    let coordinates: [number, number];
    if (geom?.x !== undefined && geom?.y !== undefined) {
      coordinates = [geom.x, geom.y];
    } else if (attrs.Longitude && attrs.Latitude) {
      coordinates = [attrs.Longitude, attrs.Latitude];
    } else {
      coordinates = [0, 0];
    }
    
    // Convert observation date from timestamp to ISO string
    let observationDate = null;
    if (attrs.Obs_Date) {
      try {
        observationDate = new Date(attrs.Obs_Date).toISOString().split('T')[0];
      } catch (e) {
        observationDate = null;
      }
    }
    
    return {
      id: `calflora-invasive-${attrs.OBJECTID || attrs.ID || Math.random()}`,
      scientificName: attrs.SName || 'Unknown', // SName = Scientific Name
      commonName: attrs.CName || null, // CName = Common Name
      family: null, // Not available in this dataset
      nativeStatus: 'invasive',
      calIpcRating: null, // Not available in this dataset
      location: coordinates,
      geojson: {
        type: 'Point',
        coordinates: coordinates
      },
      county: attrs.County || null,
      quad: null, // Not available in this dataset
      elevation: null, // Not available in this dataset
      observationDate: observationDate,
      lastUpdated: new Date().toISOString(),
      dataSource: 'calflora-invasive',
      attributes: {
        ...attrs,
        source: attrs.Source,
        phenology: attrs.Phenology,
        infestationArea: attrs.InfestAre,
        percentCover: attrs.Pct_Cover,
        distribution: attrs.Dist,
        owner: attrs.Owner,
        locationQuality: attrs.Loc_Qal,
        recordQuality: attrs.Rec_Qal
      }
    };
  }


  /**
   * Get available plant categories for filtering
   */
  getPlantCategories(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'invasive', label: 'Invasive Plants', icon: '🚨' },
      { value: 'native', label: 'Native Plants', icon: '🌿' },
      { value: 'all', label: 'All Plants', icon: '🌱' }
    ];
  }

  /**
   * Get available native status options
   */
  getNativeStatusOptions(): Array<{ value: string; label: string; color: string }> {
    return [
      { value: 'native', label: 'Native', color: 'bg-green-500' },
      { value: 'non-native', label: 'Non-Native', color: 'bg-yellow-500' },
      { value: 'invasive', label: 'Invasive', color: 'bg-red-500' },
      { value: 'unknown', label: 'Unknown', color: 'bg-gray-500' }
    ];
  }
}

export const calFloraAPI = new CalFloraService();
