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
  dataSource: 'calflora-invasive' | 'calflora-native' | 'calflora-vegetation' | 'calflora-dangermond';
  attributes: Record<string, any>; // Store additional ArcGIS attributes
}

export interface CalFloraResponse {
  total_results: number;
  results: CalFloraPlant[];
  dataSource: string;
}

class CalFloraService {
  private readonly dangermondCalFloraUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/CalFlora_Dangermond_Observations_Clean/FeatureServer/0';
  // private readonly tokenUrl = 'https://dangermondpreserve-spatial.com/server/rest/generateToken';
  
  private lastRequestTime = 0;
  private readonly minRequestInterval = 500; // 0.5 second between requests (conservative rate limiting)
  // private token: string | null = null;
  // private tokenExpiry: number = 0;
  
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
   * Generate authentication token for ArcGIS Server
   * Note: This assumes the service allows anonymous token generation
   * You may need to provide credentials if required
   */
  /*
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async _getAuthToken(): Promise<string> {
    // Check if we have a valid token
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    console.log('🔐 Generating new CalFlora authentication token...');

    try {
      const params = new URLSearchParams({
        f: 'json',
        client: 'requestip',
        expiration: '60' // Token valid for 60 minutes
        // Note: If your server requires authentication, you'll need to add:
        // username: 'your_username',
        // password: 'your_password',
      });

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Token generation error: ${data.error.message}`);
      }

      if (!data.token) {
        throw new Error('No token returned from server');
      }

      this.token = data.token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + ((data.expires || 3600) - 300) * 1000;
      
      console.log('✅ CalFlora authentication token generated successfully');
      return this.token || '';

    } catch (error) {
      console.error('❌ Failed to generate CalFlora authentication token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful guidance based on common issues
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        throw new Error(`Authentication failed: Server requires valid credentials. Please add username/password to the token generation.`);
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        throw new Error(`Authentication failed: Access denied. Check if the service allows token generation.`);
      } else {
        throw new Error(`Authentication failed: ${errorMessage}`);
      }
    }
  }
  */

  /**
   * Fetch CalFlora plant observations from Dangermond Preserve feature layer
   */
  async getPlantObservations(options: {
    maxResults?: number;
    boundingBox?: {
      swlat: number;
      swlng: number;
      nelat: number;
      nelng: number;
    };
    countyFilter?: string;
    plantFilter?: string;
  } = {}): Promise<CalFloraResponse> {
    const {
      maxResults = 1000,
      // boundingBox = this.dangermondBounds,
      // countyFilter,
      plantFilter
    } = options;

    await this.waitForRateLimit();

    // Build WHERE clause with available filters - default to get all plants
    let whereClause = '1=1';
    if (plantFilter) {
      whereClause = `plant LIKE '%${plantFilter}%'`;
    }
    // Note: Removed county filter to get all plants by default
    
    const params = new URLSearchParams({
      where: whereClause,
      outFields: '*', // Get all fields
      returnGeometry: 'true',
      outSR: '4326', // Request WGS84 coordinates
      resultRecordCount: maxResults.toString(),
      f: 'json'
      // Try without token first - it's your own hosted data
    });

    // No spatial filtering needed - get all plants from the Dangermond dataset

    const apiUrl = `${this.dangermondCalFloraUrl}/query?${params}`;
    console.log('CalFlora Dangermond Preserve API URL:', apiUrl);

    try {
      console.log('🌱 Trying to access CalFlora data without authentication...');
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`CalFlora API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        // If we get a token error, provide helpful guidance
        if (data.error.message && data.error.message.includes('Token')) {
          throw new Error(`🔒 Your CalFlora feature service requires authentication. 

To fix this:
1. Log into ArcGIS Server Manager at: https://dangermondpreserve-spatial.com/server/manager
2. Navigate to: Services → Hosted → CalFlora_Dangermond_Observations_Clean
3. Edit the service → Security settings
4. Change from "Private" to "Public" or add "Everyone" to allowed roles
5. Save and restart the service

This will make your own CalFlora data publicly accessible without authentication.`);
        }
        throw new Error(`CalFlora API error: ${data.error.message}`);
      }

      console.log(`📊 CalFlora Dangermond Preserve: ${data.features?.length || 0} records fetched`);
      
      // Use all features from the Dangermond dataset (no additional filtering needed)
      const filteredFeatures = data.features || [];
      
      return {
        total_results: filteredFeatures.length,
        results: filteredFeatures.map((feature: any) => this.transformDangermondPlant(feature)),
        dataSource: 'CalFlora Dangermond Preserve'
      };
    } catch (error) {
      console.error('Error fetching CalFlora Dangermond plants:', error);
      throw error;
    }
  }

  /**
   * Get all CalFlora plant data from Dangermond Preserve
   */
  async getAllPlants(options: {
    maxResults?: number;
    plantType?: 'invasive' | 'native' | 'all';
    countyFilter?: string;
    plantFilter?: string;
  } = {}): Promise<CalFloraResponse> {
    const { maxResults = 1000, countyFilter, plantFilter } = options;
    
    return await this.getPlantObservations({ 
      maxResults, 
      countyFilter,
      plantFilter,
      boundingBox: this.dangermondBounds 
    });
  }

  /**
   * Transform Dangermond CalFlora feature to our interface
   */
  private transformDangermondPlant(feature: any): CalFloraPlant {
    const attrs = feature.attributes || {};
    const geom = feature.geometry;
    
    // Handle geometry - should be Point geometry from the feature layer
    let coordinates: [number, number];
    if (geom?.x !== undefined && geom?.y !== undefined) {
      coordinates = [geom.x, geom.y];
    } else {
      coordinates = [0, 0];
    }
    
    // Parse plant name to extract scientific and common names
    const plantName = attrs.plant || 'Unknown';
    let scientificName = plantName;
    let commonName = null;
    
    // Try to parse if format is "Scientific Name (Common Name)" or similar
    const nameMatch = plantName.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
    if (nameMatch) {
      scientificName = nameMatch[1].trim();
      commonName = nameMatch[2] ? nameMatch[2].trim() : null;
    }
    
    // Convert date string to ISO format if available
    let observationDate = null;
    if (attrs.date_) {
      try {
        // Handle various date formats
        const date = new Date(attrs.date_);
        if (!isNaN(date.getTime())) {
          observationDate = date.toISOString().split('T')[0];
        }
      } catch (e) {
        observationDate = null;
      }
    }
    
    // Determine native status - this would need to be enhanced based on your data
    // For now, we'll set it as unknown since the field schema doesn't specify
    const nativeStatus = 'unknown';
    
    return {
      id: `calflora-dangermond-${attrs.objectid || attrs.fid || attrs.id || Math.random()}`,
      scientificName: scientificName,
      commonName: commonName,
      family: null, // Not available in current schema
      nativeStatus: nativeStatus as 'native' | 'non-native' | 'invasive' | 'unknown',
      calIpcRating: null, // Not available in current schema
      location: coordinates,
      geojson: {
        type: 'Point',
        coordinates: coordinates
      },
      county: attrs.county || null,
      quad: null, // Not available in current schema
      elevation: attrs.elevation ? parseFloat(attrs.elevation) : null,
      observationDate: observationDate,
      lastUpdated: new Date().toISOString(),
      dataSource: 'calflora-dangermond',
      attributes: {
        ...attrs,
        // Map the new field names for easy access
        associatedSpecies: attrs.associated_species,
        citation: attrs.citation,
        habitat: attrs.habitat,
        locationDescription: attrs.location_description,
        locationQuality: attrs.location_quality,
        notes: attrs.notes,
        observer: attrs.observer,
        photo: attrs.photo,
        source: attrs.source
      }
    };
  }


  /**
   * Get available plant categories for filtering
   */
  getPlantCategories(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'all', label: 'All Plants', icon: '🌱' },
      { value: 'invasive', label: 'Invasive Plants', icon: '🚨' },
      { value: 'native', label: 'Native Plants', icon: '🌿' }
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
