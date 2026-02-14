export interface TNCArcGISObservation {
  observation_id: number;
  observation_uuid: string;
  user_name: string;
  user_login: string;
  user_id: number;
  taxon_id: number;
  taxon_category_name: string;
  scientific_name: string;
  common_name: string | null;
  observed_on: string | number; // ArcGIS returns epoch-ms for date fields
  observed_on_month: number;
  observed_on_year: number;
  // Full taxonomic hierarchy (actual field names from ArcGIS)
  taxon_kingdom_name: string;
  taxon_phylum_name: string;
  taxon_class_name: string;
  taxon_order_name: string;
  taxon_family_name: string;
  taxon_genus_name: string;
  taxon_species_name: string;
  // Geometry
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Additional TNC-specific fields
  image_url?: string;
  image_license?: string;
  references_url?: string;
  // Spatial context fields (to be added later)
  wdpa_protected_area?: string;
  ecosystem_type?: string;
  nearby_observations?: {
    within_100m: { [category: string]: number };
    within_500m: { [category: string]: number };
    within_1000m: { [category: string]: number };
  };
}

export interface TNCArcGISResponse {
  features: Array<{
    attributes: TNCArcGISObservation;
    geometry: {
      x: number;
      y: number;
    };
  }>;
  exceededTransferLimit?: boolean;
}

export interface TNCArcGISQueryOptions {
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

class TNCArcGISService {
  private readonly baseUrl = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/iNat_PreUC_View/FeatureServer';
  private readonly observationsLayerId = 0; // Individual observations layer
  // private readonly hexbinLayers = [1, 2, 3, 4, 5, 6]; // H3 hexbin layers by resolution
  
  // Preserve boundary service for spatial filtering
  // private readonly preserveBoundaryUrl = 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_boundary/FeatureServer/2';
  
  // Context layers
  // private readonly contextLayers = {
  //   federalLands: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Federal_Lands/FeatureServer/0',
  //   ecoregions: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/Resolve_Ecoregions/FeatureServer/0',
  //   conservationEasements: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/nced_DO_NOT_DELETE_240308_view/FeatureServer/0'
  // };

  // Taxon category colors matching the original viewer
  private readonly taxonColors = {
    "Actinopterygii": "#1f77b4", // Blue (Fish)
    "Amphibia": "#ff7f0e",       // Orange (Amphibians)
    "Arachnida": "#2ca02c",      // Green (Spiders)
    "Aves": "#d62728",           // Red (Birds)
    "Fungi": "#9467bd",          // Purple (Fungi)
    "Insecta": "#8c564b",        // Brown (Insects)
    "Mammalia": "#e377c2",       // Pink (Mammals)
    "Mollusca": "#7f7f7f",       // Gray (Mollusks)
    "Plantae": "#bcbd22",        // Olive (Plants)
    "Protozoa": "#17becf",       // Cyan (Protozoa)
    "Reptilia": "#ff9896"        // Light Red (Reptiles)
  };

  // private preserveExtent: { xmin: number; ymin: number; xmax: number; ymax: number } | null = null;

  /**
   * Get the Dangermond Preserve boundary extent for spatial filtering
   * Returns different extents based on search mode
   */
  async getPreserveExtent(searchMode: 'preserve-only' | 'expanded' = 'expanded'): Promise<{ xmin: number; ymin: number; xmax: number; ymax: number }> {
    if (searchMode === 'preserve-only') {
      // Tight bounds based on actual preserve boundary GeoJSON
      // Extracted from the boundary coordinates in public/dangermond-preserve-boundary.geojson
      return {
        xmin: -120.498,  // West longitude (preserve western edge)
        ymin: 34.415,    // South latitude (preserve southern edge)
        xmax: -120.357,  // East longitude (preserve eastern edge)
        ymax: 34.570     // North latitude (preserve northern edge)
      };
    } else {
      // Expanded rectangle for observations around the preserve
      // Extends ~10km beyond preserve boundaries for regional context
      return {
        xmin: -120.55,   // West longitude (expanded)
        ymin: 34.35,     // South latitude (expanded)
        xmax: -120.30,   // East longitude (expanded)
        ymax: 34.62      // North latitude (expanded)
      };
    }
  }

  /**
   * Simplify a polygon by reducing the number of points
   * Uses a simple distance-based approach to remove intermediate points
   */
  simplifyPolygon(coordinates: number[][], tolerance: number = 0.001): number[][] {
    if (coordinates.length <= 3) return coordinates;
    
    const simplified = [coordinates[0]]; // Always keep first point
    
    for (let i = 1; i < coordinates.length - 1; i++) {
      const prev = coordinates[i - 1];
      const curr = coordinates[i];
      const next = coordinates[i + 1];
      
      // Calculate distance from current point to line between prev and next
      const distance = this.pointToLineDistance(curr, prev, next);
      
      if (distance > tolerance) {
        simplified.push(curr);
      }
    }
    
    simplified.push(coordinates[coordinates.length - 1]); // Always keep last point
    return simplified;
  }
  
  /**
   * Calculate perpendicular distance from point to line
   */
  private pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get a simple test polygon for debugging
   */
  getTestPolygon(): string {
    // Simple rectangle around part of the preserve for testing
    const testPolygon = {
      rings: [[
        [-120.45, 34.45],
        [-120.40, 34.45],
        [-120.40, 34.50],
        [-120.45, 34.50],
        [-120.45, 34.45]
      ]],
      spatialReference: { wkid: 4326 }
    };
    
    return JSON.stringify(testPolygon);
  }

  /**
   * Get the actual preserve boundary polygon for precise spatial filtering
   */
  async getPreserveBoundaryPolygon(useTestPolygon: boolean = false): Promise<string> {
    // Use test polygon for debugging if requested
    if (useTestPolygon) {
      return this.getTestPolygon();
    }
    
    try {
      // Fetch the preserve boundary from our local GeoJSON file
      const response = await fetch('/dangermond-preserve-boundary.geojson');
      const geojson = await response.json();
      
      if (geojson.features && geojson.features.length > 0) {
        const coordinates = geojson.features[0].geometry.coordinates[0]; // Get outer ring
        
        // Simplify polygon if it has too many points (ArcGIS services can have issues with very detailed polygons)
        let processedCoordinates = coordinates;
        if (coordinates.length > 1000) {
          processedCoordinates = this.simplifyPolygon(coordinates, 0.0005); // ~50m tolerance
        }
        
        // Convert to ArcGIS polygon format: [[x1,y1],[x2,y2],...,[x1,y1]]
        const rings = processedCoordinates.map((coord: number[]) => [coord[0], coord[1]]);
        
        // Create ArcGIS polygon geometry
        const arcgisPolygon = {
          rings: [rings],
          spatialReference: { wkid: 4326 }
        };
        
        // Return as JSON string for ArcGIS geometry parameter
        return JSON.stringify(arcgisPolygon);
      }
      
      throw new Error('No boundary polygon found in GeoJSON');
    } catch (error) {
      console.error('Error fetching preserve boundary polygon:', error);
      // Fallback to bounding box if polygon fetch fails
      const extent = await this.getPreserveExtent('preserve-only');
      return `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`;
    }
  }

  /**
   * Query observations from TNC's ArcGIS service with automatic pagination
   */
  async queryObservations(options: {
    taxonCategories?: string[];
    startDate?: string;
    endDate?: string;
    spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number };
    maxResults?: number;
    useFilters?: boolean; // Enable/disable filtering
    page?: number;
    pageSize?: number;
    searchMode?: 'preserve-only' | 'expanded' | 'custom'; // Search area mode
    customPolygon?: string; // Custom polygon geometry as JSON string
    onProgress?: (current: number, total: number, percentage: number) => void; // Progress callback
  } = {}): Promise<TNCArcGISObservation[]> {
    const {
      taxonCategories = [],
      startDate,
      endDate,
      spatialExtent,
      maxResults = 10000, // Increase default to allow for more comprehensive datasets
      useFilters = true,
      // page,
      // pageSize,
      searchMode = 'expanded',
      customPolygon,
      onProgress
    } = options;

    try {
      // Build where clause
      let whereClause = '1=1';

      if (useFilters) {
        if (taxonCategories.length > 0) {
          const categoryFilter = taxonCategories.map(cat => `'${cat}'`).join(',');
          whereClause += ` AND taxon_category_name IN (${categoryFilter})`;
        }

        if (startDate && endDate) {
          whereClause += ` AND observed_on >= DATE '${startDate}' AND observed_on <= DATE '${endDate}'`;
        }
      }

      // Set up pagination parameters
      const pageSize_internal = 1000; // Reduce page size to avoid transfer limits
      let allObservations: TNCArcGISObservation[] = [];
      let currentOffset = 0;
      let hasMoreData = true;
      let pageNumber = 1;

      // Apply spatial filtering
      let geometryParams: any = {};
      if (searchMode === 'custom' && customPolygon) {
        // Use custom drawn polygon
        geometryParams.geometry = customPolygon;
        geometryParams.geometryType = 'esriGeometryPolygon';
        geometryParams.spatialRel = 'esriSpatialRelIntersects';
      } else if (searchMode === 'preserve-only') {
        geometryParams.geometry = await this.getPreserveBoundaryPolygon(false);
        geometryParams.geometryType = 'esriGeometryPolygon';
        geometryParams.spatialRel = 'esriSpatialRelIntersects';
      } else {
        const extent = spatialExtent || await this.getPreserveExtent(searchMode === 'expanded' ? 'expanded' : 'preserve-only');
        geometryParams.geometry = `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`;
        geometryParams.geometryType = 'esriGeometryEnvelope';
        geometryParams.spatialRel = 'esriSpatialRelIntersects';
      }

      const queryUrl = `${this.baseUrl}/${this.observationsLayerId}/query`;

      // Pagination loop
      while (hasMoreData && allObservations.length < maxResults) {
        const remainingResults = maxResults - allObservations.length;
        const currentPageSize = Math.min(pageSize_internal, remainingResults);

        const params: TNCArcGISQueryOptions = {
          where: whereClause,
          outFields: 'OBJECTID,observation_id,observation_uuid,scientific_name,common_name,taxon_category_name,observed_on,user_name,taxon_kingdom_name,taxon_phylum_name,taxon_class_name,taxon_order_name,taxon_family_name,taxon_genus_name,taxon_species_name,image_url,image_license',
          returnGeometry: true,
          f: 'json',
          resultRecordCount: currentPageSize,
          resultOffset: currentOffset,
          orderByFields: 'OBJECTID DESC',
          ...geometryParams
        };

        let response: Response;

        // Use POST for preserve-only mode to avoid URL length limits
        if (searchMode === 'preserve-only') {
          const formBody = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              formBody.append(key, String(value));
            }
          });

          response = await fetch(queryUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody
          });
        } else {
          const fullUrl = `${queryUrl}?${new URLSearchParams(params as any)}`;
          response = await fetch(fullUrl);
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('TNC ArcGIS Error Response:', errorText);
          throw new Error(`TNC ArcGIS query failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.features) {
          console.warn('TNC ArcGIS: No features property in response');
          break;
        }

        const pageObservations = data.features.map((feature: any) => ({
          ...feature.attributes,
          observation_id: feature.attributes.observation_id || feature.attributes.OBJECTID,
          observation_uuid: feature.attributes.observation_uuid,
          geometry: {
            type: 'Point',
            coordinates: [feature.geometry.x, feature.geometry.y]
          }
        }));

        allObservations.push(...pageObservations);

        // Report progress
        if (onProgress) {
          const percentage = Math.min(100, Math.round((allObservations.length / maxResults) * 100));
          onProgress(allObservations.length, maxResults, percentage);
        }

        // Check if we should continue
        // Continue if we got a full page, regardless of exceededTransferLimit
        // The service may set exceededTransferLimit even when more pages are available
        hasMoreData = pageObservations.length === currentPageSize;

        currentOffset += pageObservations.length;
        pageNumber++;

        // Safety break to prevent infinite loops
        if (pageNumber > 50) {
          console.warn('⚠️ TNC ArcGIS: Reached maximum page limit (50), stopping pagination');
          break;
        }
      }

      return allObservations;

    } catch (error) {
      console.error('Error querying TNC ArcGIS observations:', error);
      throw error;
    }
  }

  /**
   * Query total count for observations with the same filters.
   * Note: This returns the actual count from the service, which may be higher than our pagination limits.
   */
  async queryObservationsCount(options: {
    taxonCategories?: string[];
    startDate?: string;
    endDate?: string;
    spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number };
    useFilters?: boolean;
    searchMode?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;
  } = {}): Promise<number> {
    const {
      taxonCategories = [],
      startDate,
      endDate,
      spatialExtent,
      useFilters = true,
      searchMode = 'expanded',
      customPolygon
    } = options;

    try {
      let whereClause = '1=1';

      if (useFilters) {
        if (taxonCategories.length > 0) {
          const categoryFilter = taxonCategories.map(cat => `'${cat}'`).join(',');
          whereClause += ` AND taxon_category_name IN (${categoryFilter})`;
        }

        if (startDate && endDate) {
          whereClause += ` AND observed_on >= DATE '${startDate}' AND observed_on <= DATE '${endDate}'`;
        }
      }

      const params: TNCArcGISQueryOptions = {
        where: whereClause,
        returnCountOnly: true,
        f: 'json'
      };

      // Apply same spatial filtering logic as main query
      if (searchMode === 'custom' && customPolygon) {
        // Use custom drawn polygon
        params.geometry = customPolygon;
        params.geometryType = 'esriGeometryPolygon';
        params.spatialRel = 'esriSpatialRelIntersects';
      } else if (searchMode === 'preserve-only') {
        // Use actual preserve polygon for precise filtering
        params.geometry = await this.getPreserveBoundaryPolygon(false);
        params.geometryType = 'esriGeometryPolygon';
        params.spatialRel = 'esriSpatialRelIntersects';
      } else {
        // Use bounding box for expanded search
        const extent = spatialExtent || await this.getPreserveExtent(searchMode === 'expanded' ? 'expanded' : 'preserve-only');
        params.geometry = `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`;
        params.geometryType = 'esriGeometryEnvelope';
        params.spatialRel = 'esriSpatialRelIntersects';
      }

      const queryUrl = `${this.baseUrl}/${this.observationsLayerId}/query`;
      
      let response: Response;
      
      // Use POST request for preserve-only or custom mode to avoid URL length limits
      if (searchMode === 'preserve-only' || searchMode === 'custom') {
        const formBody = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            formBody.append(key, String(value));
          }
        });
        
        response = await fetch(queryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody
        });
      } else {
        // Use GET request for bounding box queries
        const fullUrl = `${queryUrl}?${new URLSearchParams(params as any)}`;
        response = await fetch(fullUrl);
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TNC ArcGIS Count Error Response:', errorText);
        throw new Error(`TNC ArcGIS count query failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return typeof data.count === 'number' ? data.count : 0;
    } catch (error) {
      console.error('Error querying TNC ArcGIS count:', error);
      return 0;
    }
  }

  /**
   * Get hexbin data for aggregated view at different zoom levels
   */
  async queryHexbins(zoomLevel: number, options: {
    taxonCategories?: string[];
    startDate?: string;
    endDate?: string;
    spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number };
  } = {}): Promise<any[]> {
    // Determine appropriate H3 resolution based on zoom level
    const resolutionMap: { [key: number]: number } = {
      0: 1,   // World view
      5: 2,   // Country view  
      8: 3,   // State view
      10: 4,  // Regional view
      12: 5,  // Local view
      14: 6   // Neighborhood view
    };

    const resolution = resolutionMap[Math.floor(zoomLevel)] || 1;
    const layerId = resolution; // Layer IDs match H3 resolutions

    const {
      taxonCategories = [],
      // startDate,
      // endDate,
      spatialExtent
    } = options;

    try {
      let whereClause = '1=1';

      // Note: Hexbin layers may have different field names for filtering
      // This would need to be adjusted based on the actual hexbin layer schema
      if (taxonCategories.length > 0) {
        // Hexbins might aggregate by dominant category or have category counts
      }

      const extent = spatialExtent || await this.getPreserveExtent();

      const params: TNCArcGISQueryOptions = {
        where: whereClause,
        outFields: '*',
        returnGeometry: true,
        f: 'json',
        geometry: `${extent.xmin},${extent.ymin},${extent.xmax},${extent.ymax}`,
        geometryType: 'esriGeometryEnvelope',
        spatialRel: 'esriSpatialRelIntersects'
      };

      const queryUrl = `${this.baseUrl}/${layerId}/query`;
      const response = await fetch(`${queryUrl}?${new URLSearchParams(params as any)}`);

      if (!response.ok) {
        throw new Error(`TNC ArcGIS hexbin query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.features;

    } catch (error) {
      console.error('Error querying TNC ArcGIS hexbins:', error);
      throw error;
    }
  }

  /**
   * Get detailed observation info including spatial context
   */
  async getObservationDetails(observationId: number): Promise<TNCArcGISObservation | null> {
    try {
      const params: TNCArcGISQueryOptions = {
        where: `observation_id = ${observationId}`,
        outFields: '*',
        returnGeometry: true,
        f: 'json'
      };

      const queryUrl = `${this.baseUrl}/${this.observationsLayerId}/query`;
      const response = await fetch(`${queryUrl}?${new URLSearchParams(params as any)}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch observation details: ${response.status}`);
      }

      const data: TNCArcGISResponse = await response.json();
      
      if (data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      const observation: TNCArcGISObservation = {
        ...feature.attributes,
        geometry: {
          type: 'Point',
          coordinates: [feature.geometry.x, feature.geometry.y]
        }
      };

      // TODO: Add spatial analysis for nearby observations
      // This would require additional queries to find observations within 100m, 500m, 1000m
      
      return observation;

    } catch (error) {
      console.error('Error fetching observation details:', error);
      return null;
    }
  }

  /**
   * Query service information to understand limits and capabilities
   */
  async getServiceInfo(): Promise<any> {
    try {
      const serviceUrl = `${this.baseUrl}/${this.observationsLayerId}?f=json`;
      const response = await fetch(serviceUrl);
      
      if (!response.ok) {
        throw new Error(`Service info query failed: ${response.status}`);
      }
      
      const serviceInfo = await response.json();
      return serviceInfo;
    } catch (error) {
      console.error('Error querying service info:', error);
      return null;
    }
  }

  /**
   * Get available taxon categories from the service
   */
  async getTaxonCategories(): Promise<Array<{ value: string; label: string; color: string; icon: string }>> {
    // These categories are based on the TNC service schema
    return [
      { value: 'Actinopterygii', label: 'Fish', color: this.taxonColors.Actinopterygii, icon: '🐟' },
      { value: 'Amphibia', label: 'Amphibians', color: this.taxonColors.Amphibia, icon: '🐸' },
      { value: 'Arachnida', label: 'Spiders', color: this.taxonColors.Arachnida, icon: '🕷️' },
      { value: 'Aves', label: 'Birds', color: this.taxonColors.Aves, icon: '🐦' },
      { value: 'Fungi', label: 'Fungi', color: this.taxonColors.Fungi, icon: '🍄' },
      { value: 'Insecta', label: 'Insects', color: this.taxonColors.Insecta, icon: '🦋' },
      { value: 'Mammalia', label: 'Mammals', color: this.taxonColors.Mammalia, icon: '🦌' },
      { value: 'Mollusca', label: 'Mollusks', color: this.taxonColors.Mollusca, icon: '🐚' },
      { value: 'Plantae', label: 'Plants', color: this.taxonColors.Plantae, icon: '🌱' },
      { value: 'Protozoa', label: 'Protozoa', color: this.taxonColors.Protozoa, icon: '🦠' },
      { value: 'Reptilia', label: 'Reptiles', color: this.taxonColors.Reptilia, icon: '🦎' }
    ];
  }

  /**
   * Get taxon category color
   */
  getTaxonColor(category: string): string {
    return this.taxonColors[category as keyof typeof this.taxonColors] || '#666666';
  }

  /**
   * Parse one or more photo URLs from the ArcGIS `image_url` field.
   * Some services provide a single URL, others a comma- or space-separated list.
   */
  parseImageUrlsFromObservation(observation: TNCArcGISObservation): string[] {
    const raw = observation.image_url || '';
    if (!raw) return [];

    // Split on commas or whitespace, trim, and filter invalid entries
    const pieces = raw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Ensure URLs look valid and de-duplicate
    const unique = Array.from(new Set(pieces.filter((u) => /^(https?:)?\/\//.test(u))));
    return unique;
  }

  /**
   * Get primary photo URL if available (first parsed image).
   */
  getPrimaryImageUrl(observation: TNCArcGISObservation): string | null {
    const urls = this.parseImageUrlsFromObservation(observation);
    return urls.length > 0 ? urls[0] : null;
  }

  /**
   * Build a short attribution string for photos when license info is present.
   */
  getPhotoAttribution(observation: TNCArcGISObservation): string | null {
    const parts: string[] = [];
    if (observation.user_name) parts.push(`© ${observation.user_name}`);
    if (observation.image_license) parts.push(`${observation.image_license}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }
}

export const tncINaturalistService = new TNCArcGISService();
