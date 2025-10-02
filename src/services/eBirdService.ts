export interface EBirdObservation {
  common_name: string;
  count_observed: number;
  country: string;
  county: string;
  data_source: string;
  lat: number;
  lng: number;
  location_name: string;
  obs_id: string;
  observation_date: string;
  obsid: string;
  obstime: string;
  protocol_name: string;
  scientific_name: string;
  state: string;
  upload_timestamp: string;
  objectid: number;
  geometry?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface EBirdArcGISResponse {
  features: Array<{
    attributes: {
      common_name: string;
      count_observed: number;
      country: string;
      county: string;
      data_source: string;
      lat: number;
      lng: number;
      location_name: string;
      obs_id: string;
      observation_date: string;
      obsid: string;
      obstime: string;
      protocol_name: string;
      scientific_name: string;
      state: string;
      upload_timestamp: string;
      objectid: number;
    };
    geometry: {
      x: number;
      y: number;
    };
  }>;
  exceededTransferLimit?: boolean;
}

export interface EBirdArcGISQueryOptions {
  where?: string;
  outFields?: string;
  returnGeometry?: boolean;
  returnCountOnly?: boolean;
  f?: 'json';
  resultRecordCount?: number;
  resultOffset?: number;
  orderByFields?: string;
  geometry?: string;
  geometryType?: string;
  spatialRel?: string;
}

class EBirdService {
  // Exact boundary service
  private readonly exactBoundaryUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Dangermond_Preserve_eBird_Exact_Boundary_133M_Dataset_/FeatureServer';
  
  // Buffer zone service (1.5 mile buffer)
  private readonly bufferZoneUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Dangermond_Preserve_eBird_1_5_Mile_Buffer_Zone_133M_Dataset_/FeatureServer';
  
  private readonly observationsLayerId = 0;

  /**
   * Get the appropriate base URL based on search mode
   */
  private getBaseUrl(searchMode: 'preserve-only' | 'expanded' = 'expanded'): string {
    return searchMode === 'preserve-only' ? this.exactBoundaryUrl : this.bufferZoneUrl;
  }

  /**
   * Query eBird observations from the ArcGIS service
   */
  async queryObservations(options: {
    startDate?: string;
    endDate?: string;
    maxResults?: number;
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
  } = {}): Promise<{ observations: EBirdObservation[]; exceededLimit: boolean }> {
    const {
      startDate,
      endDate,
      maxResults = 2000,
      page = 1,
      pageSize = 500,
      searchMode = 'expanded',
      customPolygon
    } = options;

    try {
      // Build WHERE clause for date filtering
      let whereClause = '1=1'; // Default to all records
      
      if (startDate && endDate) {
        // eBird uses observation_date field (string format: "YYYY-MM-DD")
        whereClause = `observation_date >= '${startDate}' AND observation_date <= '${endDate}'`;
      } else if (startDate) {
        whereClause = `observation_date >= '${startDate}'`;
      } else if (endDate) {
        whereClause = `observation_date <= '${endDate}'`;
      }

      const queryParams: EBirdArcGISQueryOptions = {
        where: whereClause,
        outFields: '*',
        returnGeometry: true,
        f: 'json',
        resultRecordCount: Math.min(pageSize, maxResults),
        resultOffset: (page - 1) * pageSize,
        orderByFields: 'observation_date DESC'
      };

      // Add spatial filtering for custom polygon
      if (searchMode === 'custom' && customPolygon) {
        queryParams.geometry = customPolygon;
        queryParams.geometryType = 'esriGeometryPolygon';
        queryParams.spatialRel = 'esriSpatialRelIntersects';
      }

      // Determine which URL to use
      const baseUrl = searchMode === 'custom' ? this.bufferZoneUrl : this.getBaseUrl(searchMode);
      const url = `${baseUrl}/${this.observationsLayerId}/query`;

      let response: Response;

      // Use POST for custom polygon queries to avoid URL length limits
      if (searchMode === 'custom' && customPolygon) {
        const formData = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });
      } else {
        // Use GET for standard queries
        const queryString = new URLSearchParams(
          Object.entries(queryParams).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: String(value)
          }), {})
        ).toString();

        response = await fetch(`${url}?${queryString}`);
      }

      if (!response.ok) {
        throw new Error(`eBird API error: ${response.statusText}`);
      }

      const data: EBirdArcGISResponse = await response.json();

      // Transform the response to our standard format
      // NOTE: The geometry from ArcGIS is in Web Mercator (EPSG:3857), but we use the
      // lat/lng fields from attributes which are in WGS84 (standard lat/lng)
      const observations: EBirdObservation[] = data.features
        .filter(feature => feature.attributes.lat != null && feature.attributes.lng != null)
        .map(feature => ({
          ...feature.attributes,
          geometry: {
            type: 'Point',
            coordinates: [feature.attributes.lng, feature.attributes.lat] // [longitude, latitude]
          }
        }));

      return {
        observations,
        exceededLimit: data.exceededTransferLimit || false
      };
    } catch (error) {
      console.error('Error querying eBird observations:', error);
      throw error;
    }
  }

  /**
   * Get count of observations matching the filters
   */
  async queryObservationsCount(options: {
    startDate?: string;
    endDate?: string;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
  } = {}): Promise<number> {
    const {
      startDate,
      endDate,
      searchMode = 'expanded',
      customPolygon
    } = options;

    try {
      // Build WHERE clause for date filtering
      let whereClause = '1=1';
      
      if (startDate && endDate) {
        whereClause = `observation_date >= '${startDate}' AND observation_date <= '${endDate}'`;
      } else if (startDate) {
        whereClause = `observation_date >= '${startDate}'`;
      } else if (endDate) {
        whereClause = `observation_date <= '${endDate}'`;
      }

      const queryParams: EBirdArcGISQueryOptions = {
        where: whereClause,
        returnCountOnly: true,
        f: 'json'
      };

      // Add spatial filtering for custom polygon
      if (searchMode === 'custom' && customPolygon) {
        queryParams.geometry = customPolygon;
        queryParams.geometryType = 'esriGeometryPolygon';
        queryParams.spatialRel = 'esriSpatialRelIntersects';
      }

      // Determine which URL to use
      const baseUrl = searchMode === 'custom' ? this.bufferZoneUrl : this.getBaseUrl(searchMode);
      const url = `${baseUrl}/${this.observationsLayerId}/query`;

      let response: Response;

      // Use POST for custom polygon queries
      if (searchMode === 'custom' && customPolygon) {
        const formData = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });
      } else {
        const queryString = new URLSearchParams(
          Object.entries(queryParams).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: String(value)
          }), {})
        ).toString();

        response = await fetch(`${url}?${queryString}`);
      }

      if (!response.ok) {
        throw new Error(`eBird API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error querying eBird observation count:', error);
      return 0;
    }
  }

  /**
   * Get unique bird species from observations
   */
  async getUniqueSpecies(options: {
    startDate?: string;
    endDate?: string;
    searchMode?: 'preserve-only' | 'expanded';
  } = {}): Promise<Array<{ commonName: string; scientificName: string; count: number }>> {
    try {
      const { observations } = await this.queryObservations({
        ...options,
        maxResults: 2000
      });

      // Group by species and count occurrences
      const speciesMap = new Map<string, { commonName: string; scientificName: string; count: number }>();

      observations.forEach(obs => {
        const key = obs.scientific_name;
        if (speciesMap.has(key)) {
          const existing = speciesMap.get(key)!;
          existing.count += 1;
        } else {
          speciesMap.set(key, {
            commonName: obs.common_name,
            scientificName: obs.scientific_name,
            count: 1
          });
        }
      });

      // Convert to array and sort by count
      return Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error getting unique species:', error);
      return [];
    }
  }
}

// Export singleton instance
export const eBirdService = new EBirdService();

