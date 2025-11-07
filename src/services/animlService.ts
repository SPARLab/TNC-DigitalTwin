export interface AnimlDeployment {
  id: number;
  animl_dp_id: string;
  name: string;
  geometry?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Aggregated stats
  totalObservations?: number;
  uniqueAnimals?: string[];
  firstObservation?: string;
  lastObservation?: string;
}

export interface AnimlImageLabel {
  id: number;
  animl_image_id: string;
  deployment_id: number;
  deployment_name?: string; // Joined from deployment table
  deployment_location?: [number, number]; // From deployment geometry
  timestamp: string;
  label: string;
  medium_url: string | null;
  small_url: string | null;
  geometry?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface AnimlAnimalTag {
  label: string;
  totalObservations: number;
  uniqueCameras: number;
  firstObservation: string;
  lastObservation: string;
  recentObservations: AnimlImageLabel[]; // Latest 5-10 for preview
}

export interface AnimlQueryOptions {
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
  outStatistics?: Array<{
    statisticType: string;
    onStatisticField: string;
    outStatisticFieldName: string;
  }>;
  groupByFieldsForStatistics?: string;
}

export interface AnimlServiceQueryOptions {
  startDate?: string;
  endDate?: string;
  deploymentIds?: number[];
  labels?: string[];
  spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number };
  maxResults?: number;
  pageSize?: number;
  resultOffset?: number; // Offset for pagination (skip N results)
  searchMode?: 'preserve-only' | 'expanded' | 'custom';
  customPolygon?: string;
  onProgress?: (current: number, total: number, percentage: number) => void;
}

/**
 * Result from grouped count query
 * Represents observation counts for a specific (deployment, label) combination
 */
export interface AnimlGroupedCount {
  deployment_id: number;
  label: string;
  observation_count: number;
}

/**
 * Processed count data structures for fast lookups
 * Built from AnimlGroupedCount results
 */
export interface AnimlCountLookups {
  /** Total counts per deployment: Map<deployment_id, count> */
  countsByDeployment: Map<number, number>;
  
  /** Total counts per label (across all deployments): Map<label, count> */
  countsByLabel: Map<string, number>;
  
  /** Counts for specific (deployment, label) combinations: Map<"deployment_id:label", count> */
  countsByDeploymentAndLabel: Map<string, number>;
  
  /** Labels observed at each deployment: Map<deployment_id, Set<label>> */
  labelsByDeployment: Map<number, Set<string>>;
  
  /** Deployments that observed each label: Map<label, Set<deployment_id>> */
  deploymentsByLabel: Map<string, Set<number>>;
}

class AnimlService {
  private readonly baseUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer';
  private readonly deploymentsLayerId = 0; // Deployments/Camera Traps
  private readonly imageLabelsLayerId = 1; // Image Labels/Observations

  /**
   * Query deployments (camera traps) from the FeatureServer
   * NOTE: Spatial filtering is currently disabled due to server issues
   */
  async queryDeployments(_options: AnimlServiceQueryOptions = {}): Promise<AnimlDeployment[]> {
    try {
      // Use simple query without spatial filtering
      const params: AnimlQueryOptions = {
        where: '1=1',
        outFields: 'id,animl_dp_id,name', // Use 'id' not 'OBJECTID'
        returnGeometry: true,
        f: 'json'
      };

      const queryUrl = `${this.baseUrl}/${this.deploymentsLayerId}/query`;
      const fullUrl = `${queryUrl}?${new URLSearchParams(params as any)}`;
      console.log('🔍 Animl Deployments Query (GET without spatial filter):', fullUrl.substring(0, 200) + '...');
      
      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Animl Deployments Error Response:', errorText);
        throw new Error(`Animl deployments query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('❌ Animl Deployments API Error:', data.error);
        throw new Error(`Animl deployments API error: ${JSON.stringify(data.error)}`);
      }

      if (!data.features) {
        console.warn('⚠️ Animl Deployments: No features in response', data);
        return [];
      }

      console.log(`✅ Animl Deployments: Retrieved ${data.features.length} deployments`);

      return data.features.map((feature: any) => ({
        id: feature.attributes.id, // Use 'id' field
        animl_dp_id: feature.attributes.animl_dp_id,
        name: feature.attributes.name,
        geometry: feature.geometry ? {
          type: 'Point' as const,
          coordinates: [feature.geometry.x, feature.geometry.y]
        } : undefined
      }));

    } catch (error) {
      console.error('Error querying Animl deployments:', error);
      throw error;
    }
  }

  /**
   * Query image labels (observations) from the FeatureServer
   * NOTE: Spatial filtering is currently disabled due to server issues
   */
  /**
   * Get count of image labels matching the query
   */
  async getImageLabelsCount(options: AnimlServiceQueryOptions = {}): Promise<number> {
    const {
      startDate,
      endDate,
      deploymentIds = [],
      labels = []
    } = options;

    try {
      let whereClause = '1=1';

      // Build where clause filters (same as queryImageLabels)
      if (startDate && endDate) {
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const endDateObj = new Date(endDate + 'T23:59:59Z');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (endDateObj <= today) {
          const startDateStr = startDateObj.toISOString().replace('T', ' ').substring(0, 19);
          const endDateStr = endDateObj.toISOString().replace('T', ' ').substring(0, 19);
          whereClause += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
        }
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      if (labels.length > 0) {
        const labelFilter = labels.map(label => `'${label.replace(/'/g, "''")}'`).join(',');
        whereClause += ` AND label IN (${labelFilter})`;
      }

      const params: AnimlQueryOptions = {
        where: whereClause,
        returnCountOnly: true,
        f: 'json'
      };

      const queryUrl = `${this.baseUrl}/${this.imageLabelsLayerId}/query`;
      const fullUrl = `${queryUrl}?${new URLSearchParams(params as any)}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Animl count query failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`Animl count API error: ${JSON.stringify(data.error)}`);
      }

      return data.count || 0;
    } catch (error) {
      console.error('Error getting Animl image labels count:', error);
      throw error;
    }
  }

  /**
   * Get observation counts grouped by (deployment_id, label) combination
   * 
   * APPROACH: We use a clever workaround for the COUNT(DISTINCT) limitation:
   * 1. Group by (deployment_id, animl_image_id) to get unique images per camera
   * 2. For each unique image, fetch its labels
   * 3. Build the final (deployment_id, label) -> unique_image_count mapping
   * 
   * This accurately counts UNIQUE IMAGES per (camera, species) combination!
   * 
   * @param options - Query filters (date range, exclude person/people)
   * @returns Object with: grouped counts array and unique image counts per deployment
   * 
   * @example
   * const result = await animlService.getObservationCountsGrouped({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * });
   * // Returns: {
   * //   groupedCounts: [
   * //     { deployment_id: 59, label: "mule deer", observation_count: 147 },  // 147 unique images
   * //     { deployment_id: 59, label: "coyote", observation_count: 183 },      // 183 unique images
   * //   ],
   * //   uniqueImageCountsByDeployment: Map { 59 => 200 }  // 200 total unique images for deployment 59
   * // }
   */
  async getObservationCountsGrouped(options: AnimlServiceQueryOptions = {}): Promise<{ 
    groupedCounts: AnimlGroupedCount[];
    uniqueImageCountsByDeployment: Map<number, number>;
  }> {
    const { startDate, endDate, deploymentIds = [] } = options;

    try {
      let whereClause = '1=1';

      // Build date filter
      if (startDate && endDate) {
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const endDateObj = new Date(endDate + 'T23:59:59Z');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (endDateObj <= today) {
          const startDateStr = startDateObj.toISOString().replace('T', ' ').substring(0, 19);
          const endDateStr = endDateObj.toISOString().replace('T', ' ').substring(0, 19);
          whereClause += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
        }
      }

      // Filter by deployment IDs (only count observations from specified cameras)
      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      // ALWAYS exclude person/people observations (consistent with UI filtering)
      whereClause += ` AND label NOT IN ('person', 'people')`;

      console.log('🔍 Animl Grouped Counts: Using 2-step approach for unique image counting...');
      console.log('📊 WHERE clause:', whereClause);
      console.log('📊 Deployment filter:', deploymentIds.length > 0 ? `${deploymentIds.length} deployments` : 'ALL deployments (no filter)');
      const start = Date.now();
      
      // STEP 1: Get unique images per deployment
      // Group by (deployment_id, animl_image_id) - this gives us one row per unique image per camera
      const uniqueImagesParams: any = {
        where: whereClause,
        outStatistics: JSON.stringify([{
          statisticType: 'count',
          onStatisticField: 'id',
          outStatisticFieldName: 'label_count'  // Number of labels per image (we'll ignore this)
        }]),
        groupByFieldsForStatistics: 'deployment_id,animl_image_id', // 🔑 Group by image ID!
        f: 'json'
      };

      const queryUrl = `${this.baseUrl}/${this.imageLabelsLayerId}/query`;
      const step1Url = `${queryUrl}?${new URLSearchParams(uniqueImagesParams)}`;
      
      console.log('📊 Step 1: Querying for unique images per deployment...');
      const step1Response = await fetch(step1Url);
      if (!step1Response.ok) {
        throw new Error(`Animl unique images query failed: ${step1Response.status}`);
      }

      const step1Data = await step1Response.json();
      if (step1Data.error) {
        throw new Error(`Animl unique images API error: ${JSON.stringify(step1Data.error)}`);
      }

      // Extract unique (deployment_id, animl_image_id) pairs
      const uniqueImages = step1Data.features.map((f: any) => ({
        deployment_id: f.attributes.deployment_id,
        animl_image_id: f.attributes.animl_image_id
      }));
      
      // Build map of unique image counts per deployment (BEFORE considering labels)
      const uniqueImageCountsByDeployment = new Map<number, Set<string>>();
      uniqueImages.forEach((img: any) => {
        if (!uniqueImageCountsByDeployment.has(img.deployment_id)) {
          uniqueImageCountsByDeployment.set(img.deployment_id, new Set());
        }
        uniqueImageCountsByDeployment.get(img.deployment_id)!.add(img.animl_image_id);
      });
      
      console.log(`📊 Step 1 complete: Found ${uniqueImages.length} unique images across ${uniqueImageCountsByDeployment.size} deployments`);
      
      // STEP 2: For each unique image, get its labels
      // Query for labels of these specific images
      const imageIds = uniqueImages.map((img: any) => img.animl_image_id);
      const imageIdChunks: string[][] = [];
      const chunkSize = 500; // Query in batches to avoid URL length limits
      
      for (let i = 0; i < imageIds.length; i += chunkSize) {
        imageIdChunks.push(imageIds.slice(i, i + chunkSize));
      }
      
      console.log(`📊 Step 2: Fetching labels for ${imageIds.length} unique images in ${imageIdChunks.length} batches...`);
      
      // Map: "deployment_id:label" -> Set<animl_image_id>
      const uniqueImagesPerCombo = new Map<string, Set<string>>();
      
      for (let chunkIndex = 0; chunkIndex < imageIdChunks.length; chunkIndex++) {
        const chunk = imageIdChunks[chunkIndex];
        const imageIdsFilter = chunk.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
        const labelsWhereClause = `${whereClause} AND animl_image_id IN (${imageIdsFilter})`;
        
        const labelsParams: any = {
          where: labelsWhereClause,
          outFields: 'animl_image_id,deployment_id,label',
          returnGeometry: false,
          f: 'json'
        };
        
        const labelsUrl = `${queryUrl}?${new URLSearchParams(labelsParams)}`;
        const labelsResponse = await fetch(labelsUrl);
        
        if (!labelsResponse.ok) {
          console.error(`Failed to fetch labels for chunk ${chunkIndex + 1}`);
          continue;
        }
        
        const labelsData = await labelsResponse.json();
        if (labelsData.error) {
          console.error(`Error fetching labels for chunk ${chunkIndex + 1}:`, labelsData.error);
          continue;
        }
        
        // Process labels and deduplicate
        labelsData.features.forEach((feature: any) => {
          const { animl_image_id, deployment_id, label } = feature.attributes;
          const key = `${deployment_id}:${label}`;
          
          if (!uniqueImagesPerCombo.has(key)) {
            uniqueImagesPerCombo.set(key, new Set());
          }
          uniqueImagesPerCombo.get(key)!.add(animl_image_id);
        });
        
        if ((chunkIndex + 1) % 5 === 0) {
          console.log(`📊 Processed ${chunkIndex + 1}/${imageIdChunks.length} batches...`);
        }
      }
      
      // Convert to AnimlGroupedCount format
      const groupedCounts: AnimlGroupedCount[] = [];
      uniqueImagesPerCombo.forEach((imageIds, key) => {
        const [deployment_id_str, label] = key.split(':');
        groupedCounts.push({
          deployment_id: parseInt(deployment_id_str),
          label,
          observation_count: imageIds.size // Count of unique images
        });
      });

      const duration = Date.now() - start;
      
      // Convert Set sizes to actual counts
      const uniqueImageCountsMap = new Map<number, number>();
      uniqueImageCountsByDeployment.forEach((imageSet, deploymentId) => {
        uniqueImageCountsMap.set(deploymentId, imageSet.size);
      });
      
      const totalUniqueImagesAcrossDeployments = Array.from(uniqueImageCountsMap.values()).reduce((sum, count) => sum + count, 0);
      
      console.log(`✅ Animl Grouped Counts: ${totalUniqueImagesAcrossDeployments} unique images across ${uniqueImageCountsMap.size} deployments in ${groupedCounts.length} label combinations (${duration}ms)`);

      return { 
        groupedCounts, 
        uniqueImageCountsByDeployment: uniqueImageCountsMap 
      };
    } catch (error) {
      console.error('Error getting Animl grouped counts:', error);
      throw error;
    }
  }

  /**
   * Build fast lookup structures from grouped count data
   * This processes the result of getObservationCountsGrouped() into Maps for O(1) lookups
   * 
   * @param groupedCounts - Array of grouped counts from getObservationCountsGrouped()
   * @param uniqueImageCountsByDeployment - Map of deployment_id -> unique image count
   * @returns Object with 5 Map structures for different lookup patterns
   * 
   * @example
   * const result = await animlService.getObservationCountsGrouped({ ... });
   * const lookups = animlService.buildCountLookups(result.groupedCounts, result.uniqueImageCountsByDeployment);
   * 
   * // Now you can do instant lookups:
   * const totalForDeployment59 = lookups.countsByDeployment.get(59); // O(1) - returns UNIQUE image count
   * const totalForMuleDeer = lookups.countsByLabel.get('mule deer'); // O(1)
   * const muleDeerAt59 = lookups.countsByDeploymentAndLabel.get('59:mule deer'); // O(1)
   */
  buildCountLookups(groupedCounts: AnimlGroupedCount[], uniqueImageCountsByDeployment: Map<number, number>): AnimlCountLookups {
    const start = Date.now();
    
    // Use the pre-calculated unique image counts per deployment (CORRECT - no double counting!)
    const countsByDeployment = new Map(uniqueImageCountsByDeployment);
    
    const countsByLabel = new Map<string, number>();
    const countsByDeploymentAndLabel = new Map<string, number>();
    const labelsByDeployment = new Map<number, Set<string>>();
    const deploymentsByLabel = new Map<string, Set<number>>();

    groupedCounts.forEach(({ deployment_id, label, observation_count }) => {
      // Aggregate by label (sum across deployments)
      // Note: This is NOT the total unique images with this label across all deployments
      // because the same image could appear in different deployments
      // But within a deployment, each image is unique, so summing is okay for label totals
      countsByLabel.set(
        label,
        (countsByLabel.get(label) || 0) + observation_count
      );

      // Store specific combination
      const key = `${deployment_id}:${label}`;
      countsByDeploymentAndLabel.set(key, observation_count);

      // Track labels per deployment
      if (!labelsByDeployment.has(deployment_id)) {
        labelsByDeployment.set(deployment_id, new Set());
      }
      labelsByDeployment.get(deployment_id)!.add(label);

      // Track deployments per label
      if (!deploymentsByLabel.has(label)) {
        deploymentsByLabel.set(label, new Set());
      }
      deploymentsByLabel.get(label)!.add(deployment_id);
    });

    const duration = Date.now() - start;
    const totalDeploymentImages = Array.from(countsByDeployment.values()).reduce((sum, count) => sum + count, 0);
    console.log(`✅ Animl Count Lookups: Built structures in ${duration}ms`);
    console.log(`   📊 ${countsByDeployment.size} deployments (${totalDeploymentImages} total unique images), ${countsByLabel.size} labels, ${countsByDeploymentAndLabel.size} combinations`);

    return {
      countsByDeployment,
      countsByLabel,
      countsByDeploymentAndLabel,
      labelsByDeployment,
      deploymentsByLabel
    };
  }

  /**
   * Calculate total observation count for specific filter selections
   * Uses the lookup structures for O(n*m) calculation (where n and m are small)
   * 
   * @param lookups - Lookup structures from buildCountLookups()
   * @param selectedDeploymentIds - Array of selected deployment IDs (empty = all)
   * @param selectedLabels - Array of selected labels (empty = all)
   * @returns Total observation count (unique images) matching the filters
   * 
   * @example
   * const result = await animlService.getObservationCountsGrouped({ ... });
   * const lookups = animlService.buildCountLookups(result.groupedCounts, result.uniqueImageCountsByDeployment);
   * const total = animlService.getTotalCountForFilters(
   *   lookups,
   *   [59, 61], // Selected camera traps
   *   ['mule deer', 'coyote'] // Selected labels
   * );
   * // Returns: count of unique images for those specific combinations
   */
  getTotalCountForFilters(
    lookups: AnimlCountLookups,
    selectedDeploymentIds: number[],
    selectedLabels: string[]
  ): number {
    const { countsByDeployment, countsByLabel, countsByDeploymentAndLabel } = lookups;

    // If no filters, return total for all deployments
    if (selectedDeploymentIds.length === 0 && selectedLabels.length === 0) {
      return Array.from(countsByDeployment.values()).reduce((sum, count) => sum + count, 0);
    }

    // If only deployment filter, return total for those deployments
    if (selectedDeploymentIds.length > 0 && selectedLabels.length === 0) {
      return selectedDeploymentIds.reduce((sum, depId) => {
        return sum + (countsByDeployment.get(depId) || 0);
      }, 0);
    }

    // If only label filter, return total for those labels
    if (selectedDeploymentIds.length === 0 && selectedLabels.length > 0) {
      return selectedLabels.reduce((sum, label) => {
        return sum + (countsByLabel.get(label) || 0);
      }, 0);
    }

    // If both filters, sum specific combinations
    let total = 0;
    for (const depId of selectedDeploymentIds) {
      for (const label of selectedLabels) {
        const key = `${depId}:${label}`;
        total += countsByDeploymentAndLabel.get(key) || 0;
      }
    }
    return total;
  }

  /**
   * Get unique animal categories (labels) without fetching all observations
   * Uses ArcGIS statistics query with groupByFieldsForStatistics to get ALL unique labels
   * regardless of recency (unlike sampling which might miss older categories)
   */
  async getUniqueAnimalCategories(options: AnimlServiceQueryOptions = {}): Promise<string[]> {
    const {
      startDate,
      endDate,
      deploymentIds = []
    } = options;

    try {
      let whereClause = '1=1';

      // Build where clause filters
      if (startDate && endDate) {
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const endDateObj = new Date(endDate + 'T23:59:59Z');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (endDateObj <= today) {
          const startDateStr = startDateObj.toISOString().replace('T', ' ').substring(0, 19);
          const endDateStr = endDateObj.toISOString().replace('T', ' ').substring(0, 19);
          whereClause += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
        }
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      // Use statistics query to get unique labels - this gets ALL unique values, not just recent ones
      // Note: outStatistics must be JSON stringified, not URL-encoded as a URLSearchParam
      const outStatistics = JSON.stringify([
        {
          statisticType: 'COUNT',
          onStatisticField: 'label',
          outStatisticFieldName: 'count'
        }
      ]);

      const queryUrl = `${this.baseUrl}/${this.imageLabelsLayerId}/query`;
      const params = new URLSearchParams({
        where: whereClause,
        outStatistics: outStatistics,
        groupByFieldsForStatistics: 'label',
        f: 'json'
      });
      const fullUrl = `${queryUrl}?${params}`;
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        console.warn('⚠️ Animl: Statistics query failed, falling back to sampling method');
        return await this.getUniqueAnimalCategoriesFallback(options);
      }

      const data = await response.json();
      if (data.error) {
        console.warn('⚠️ Animl: Statistics query error, falling back:', data.error);
        return await this.getUniqueAnimalCategoriesFallback(options);
      }

      // Extract unique labels from statistics results
      const uniqueLabels = (data.features || [])
        .map((feature: any) => feature.attributes?.label)
        .filter((label: string) => label != null);

      const labelsArray = uniqueLabels.sort((a: string, b: string) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      );

      return labelsArray;
    } catch (error) {
      console.error('Error getting unique animal categories:', error);
      console.warn('⚠️ Animl: Falling back to sampling method');
      return await this.getUniqueAnimalCategoriesFallback(options);
    }
  }

  /**
   * Fallback method: Sample recent records to find unique labels
   * Used when statistics query fails
   */
  private async getUniqueAnimalCategoriesFallback(options: AnimlServiceQueryOptions = {}): Promise<string[]> {
    const {
      startDate,
      endDate,
      deploymentIds = []
    } = options;

    try {
      let whereClause = '1=1';

      if (startDate && endDate) {
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const endDateObj = new Date(endDate + 'T23:59:59Z');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (endDateObj <= today) {
          const startDateStr = startDateObj.toISOString().replace('T', ' ').substring(0, 19);
          const endDateStr = endDateObj.toISOString().replace('T', ' ').substring(0, 19);
          whereClause += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
        }
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      // Fallback: Fetch a sample to get unique labels
      const params: AnimlQueryOptions = {
        where: whereClause,
        outFields: 'label',
        returnGeometry: false,
        f: 'json',
        resultRecordCount: 5000,
        orderByFields: 'timestamp DESC'
      };

      const queryUrl = `${this.baseUrl}/${this.imageLabelsLayerId}/query`;
      const fullUrl = `${queryUrl}?${new URLSearchParams(params as any)}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch unique categories: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`API error: ${JSON.stringify(data.error)}`);
      }

      const uniqueLabels = new Set<string>();
      (data.features || []).forEach((feature: any) => {
        const label = feature.attributes?.label;
        if (label) {
          uniqueLabels.add(label);
        }
      });

      const labelsArray = Array.from(uniqueLabels).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      );

      return labelsArray;
    } catch (error) {
      console.error('Error in fallback method:', error);
      return [];
    }
  }

  /**
   * Get animal category counts grouped by label without fetching all observations
   * Uses a single statistics query to get both unique categories AND their counts
   */
  async getAnimalCategoryCounts(options: AnimlServiceQueryOptions = {}): Promise<AnimlAnimalTag[]> {
    const {
      startDate,
      endDate,
      deploymentIds = []
    } = options;

    try {
      let whereClause = '1=1';

      // Build where clause filters
      if (startDate && endDate) {
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const endDateObj = new Date(endDate + 'T23:59:59Z');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (endDateObj <= today) {
          const startDateStr = startDateObj.toISOString().replace('T', ' ').substring(0, 19);
          const endDateStr = endDateObj.toISOString().replace('T', ' ').substring(0, 19);
          whereClause += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
        }
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      // Use statistics query to get unique labels AND their counts in a single query
      const outStatistics = JSON.stringify([
        {
          statisticType: 'COUNT',
          onStatisticField: 'label',
          outStatisticFieldName: 'count'
        }
      ]);

      const queryUrl = `${this.baseUrl}/${this.imageLabelsLayerId}/query`;
      const params = new URLSearchParams({
        where: whereClause,
        outStatistics: outStatistics,
        groupByFieldsForStatistics: 'label',
        f: 'json'
      });
      const fullUrl = `${queryUrl}?${params}`;

      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        // Fallback to individual queries if statistics query fails
        console.warn('⚠️ Animl: Statistics query failed, falling back to individual count queries');
        return await this.getAnimalCategoryCountsFallback(options);
      }

      const data = await response.json();
      if (data.error) {
        console.warn('⚠️ Animl: Statistics query error, falling back:', data.error);
        return await this.getAnimalCategoryCountsFallback(options);
      }

      // Extract labels and counts directly from statistics results
      const animalTags: AnimlAnimalTag[] = (data.features || [])
        .map((feature: any) => {
          const label = feature.attributes?.label;
          const count = feature.attributes?.count || 0;
          
          return {
            label: label || 'Unknown',
            totalObservations: count,
            uniqueCameras: 0, // Will be calculated separately if needed
            firstObservation: '', // Not available from statistics
            lastObservation: '', // Not available from statistics
            recentObservations: [] // Will be loaded when category is selected
          };
        })
        .filter((tag: AnimlAnimalTag) => tag.label !== 'Unknown');

      const sortedTags = animalTags.sort((a, b) => 
        (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase())
      );

      return sortedTags;
    } catch (error) {
      console.error('Error getting Animl animal category counts:', error);
      // Fallback to individual queries
      return await this.getAnimalCategoryCountsFallback(options);
    }
  }

  /**
   * Fallback method: Get unique categories first, then get counts sequentially
   * Used when statistics query fails
   */
  private async getAnimalCategoryCountsFallback(options: AnimlServiceQueryOptions = {}): Promise<AnimlAnimalTag[]> {
    try {
      // Step 1: Get unique categories first (fast, minimal data)
      const uniqueLabels = await this.getUniqueAnimalCategories(options);
      
      if (uniqueLabels.length === 0) {
        return [];
      }

      // Step 2: Get counts for each category sequentially
      const animalTags: AnimlAnimalTag[] = await Promise.all(
        uniqueLabels.map(async (label) => {
          try {
            const count = await this.getImageLabelsCount({
              ...options,
              labels: [label]
            });

            return {
              label,
              totalObservations: count,
              uniqueCameras: 0, // Will be calculated separately if needed
              firstObservation: '', // Not available from count query
              lastObservation: '', // Not available from count query
              recentObservations: [] // Will be loaded when category is selected
            };
          } catch (error) {
            console.error(`Error getting count for ${label}:`, error);
            return {
              label,
              totalObservations: 0,
              uniqueCameras: 0,
              firstObservation: '',
              lastObservation: '',
              recentObservations: []
            };
          }
        })
      );

      const sortedTags = animalTags.sort((a, b) => 
        (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase())
      );

      return sortedTags;
    } catch (error) {
      console.error('Error in fallback method:', error);
      return [];
    }
  }


  async queryImageLabels(options: AnimlServiceQueryOptions = {}): Promise<AnimlImageLabel[]> {
    const {
      startDate,
      endDate,
      deploymentIds = [],
      labels = [],
      maxResults = undefined, // Remove default limit - fetch all if not specified
      resultOffset = 0 // Start from offset if provided
    } = options;

    try {
      let whereClause = '1=1';

      // Build where clause filters
      if (startDate && endDate) {
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const endDateObj = new Date(endDate + 'T23:59:59Z');
        
        // Check if dates are in the future - if so, don't filter by date
        // Use end of today for comparison to avoid false positives
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        if (endDateObj > today) {
          console.warn(`⚠️ Animl: End date (${endDate}) is in the future (today: ${today.toISOString().split('T')[0]}), skipping date filter to show all data`);
        } else {
          // Use ArcGIS DATE function format: DATE 'YYYY-MM-DD HH:MM:SS'
          // This format works for count queries. For data queries, we'll filter client-side if needed.
          const startDateStr = startDateObj.toISOString().replace('T', ' ').substring(0, 19);
          const endDateStr = endDateObj.toISOString().replace('T', ' ').substring(0, 19);
          whereClause += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
          console.log(`📅 Animl: Applying date filter from ${startDate} to ${endDate} (using DATE format)`);
        }
      } else {
        console.warn('⚠️ Animl: No date filter applied - this may fetch a large number of records');
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      if (labels.length > 0) {
        const labelFilter = labels.map(label => `'${label.replace(/'/g, "''")}'`).join(',');
        whereClause += ` AND label IN (${labelFilter})`;
      }

      console.log(`🔍 Animl Image Labels WHERE clause: ${whereClause}`);
      if (maxResults !== undefined) {
        console.log(`🎯 Animl Image Labels: Fetching up to ${maxResults} records`);
      } else {
        console.log(`🎯 Animl Image Labels: Fetching all records (no limit)`);
      }

      // Set up pagination
      const pageSize_internal = 2000; // Increased from 1000 to 2000
      let allImageLabels: AnimlImageLabel[] = [];
      let currentOffset = resultOffset; // Start from provided offset
      let hasMoreData = true;
      let pageNumber = 1;
      let useClientSideDateFilter = false; // Track if we need to filter client-side
      const startTimestamp = startDate ? new Date(startDate + 'T00:00:00Z').getTime() : null;
      const endTimestamp = endDate ? new Date(endDate + 'T23:59:59Z').getTime() : null;

      const queryUrl = `${this.baseUrl}/${this.imageLabelsLayerId}/query`;

      // Pagination loop - continue until no more data or maxResults is reached
      while (hasMoreData && (maxResults === undefined || allImageLabels.length < maxResults)) {
        const remainingResults = maxResults !== undefined ? maxResults - allImageLabels.length : pageSize_internal;
        const currentPageSize = Math.min(pageSize_internal, remainingResults);

        const params: AnimlQueryOptions = {
          where: whereClause,
          outFields: 'id,animl_image_id,deployment_id,timestamp,label,medium_url,small_url',
          returnGeometry: false,
          f: 'json',
          resultRecordCount: currentPageSize,
          resultOffset: currentOffset,
          orderByFields: 'timestamp DESC'
        };

        const fullUrl = `${queryUrl}?${new URLSearchParams(params as any)}`;
        if (pageNumber === 1) {
          console.log('🔍 Animl Image Labels Query (GET without spatial filter):', fullUrl.substring(0, 250) + '...');
        }
        
        console.log(`📄 Animl: Fetching page ${pageNumber} (offset: ${currentOffset}, limit: ${currentPageSize})...`);
        let response = await fetch(fullUrl);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Animl Image Labels Error Response:', errorText);
          
          // If date filtering fails on first page, try without date filter and filter client-side
          if (pageNumber === 1 && startDate && endDate && whereClause.includes('DATE')) {
            console.warn('⚠️ Animl: Server-side date filtering failed, falling back to client-side filtering');
            useClientSideDateFilter = true;
            
            // Update whereClause for all subsequent pages to remove DATE filter
            whereClause = whereClause.replace(/ AND timestamp >= DATE '[^']+' AND timestamp <= DATE '[^']+'/, '');
            
            // Retry without date filter in WHERE clause
            const fallbackParams = {
              ...params,
              where: whereClause
            };
            const fallbackUrl = `${queryUrl}?${new URLSearchParams(fallbackParams as any)}`;
            console.log('🔄 Animl: Retrying without date filter, will filter client-side...');
            response = await fetch(fallbackUrl);
            
            if (!response.ok) {
              throw new Error(`Animl image labels query failed: ${response.status} ${response.statusText}`);
            }
          } else {
            throw new Error(`Animl image labels query failed: ${response.status} ${response.statusText}`);
          }
        }

        let data = await response.json();

        if (data.error) {
          // If date filtering fails on first page, try without date filter and filter client-side
          if (pageNumber === 1 && startDate && endDate && whereClause.includes('DATE')) {
            console.warn('⚠️ Animl: Server-side date filtering failed, falling back to client-side filtering');
            useClientSideDateFilter = true;
            
            // Update whereClause for all subsequent pages to remove DATE filter
            whereClause = whereClause.replace(/ AND timestamp >= DATE '[^']+' AND timestamp <= DATE '[^']+'/, '');
            
            // Retry without date filter in WHERE clause
            const fallbackParams = {
              ...params,
              where: whereClause
            };
            const fallbackUrl = `${queryUrl}?${new URLSearchParams(fallbackParams as any)}`;
            console.log('🔄 Animl: Retrying without date filter, will filter client-side...');
            response = await fetch(fallbackUrl);
            
            if (!response.ok) {
              throw new Error(`Animl image labels query failed: ${response.status} ${response.statusText}`);
            }
            
            const fallbackData = await response.json();
            if (fallbackData.error) {
              throw new Error(`Animl image labels API error: ${JSON.stringify(fallbackData.error)}`);
            }
            
            // Use fallback data (client-side filtering will happen later)
            data = fallbackData;
          } else {
            console.error('❌ Animl Image Labels API Error:', data.error);
            throw new Error(`Animl image labels API error: ${JSON.stringify(data.error)}`);
          }
        }

        if (!data.features) {
          console.warn('⚠️ Animl Image Labels: No features in response', data);
          break;
        }

        const pageImageLabels = data.features.map((feature: any) => ({
          id: feature.attributes.id,
          animl_image_id: feature.attributes.animl_image_id,
          deployment_id: feature.attributes.deployment_id,
          timestamp: feature.attributes.timestamp,
          label: feature.attributes.label,
          medium_url: feature.attributes.medium_url || null,
          small_url: feature.attributes.small_url || null
        }));

        // Apply client-side date filtering if server-side filtering failed
        let filteredPageLabels = pageImageLabels;
        if (useClientSideDateFilter && startTimestamp !== null && endTimestamp !== null) {
          filteredPageLabels = pageImageLabels.filter((label: AnimlImageLabel) => {
            const ts = typeof label.timestamp === 'string' 
              ? new Date(label.timestamp).getTime() 
              : label.timestamp;
            return ts >= startTimestamp && ts <= endTimestamp;
          });
          if (filteredPageLabels.length < pageImageLabels.length) {
            console.log(`🔍 Animl: Client-side filtered ${pageImageLabels.length} records to ${filteredPageLabels.length} records in date range`);
          }
        }

        allImageLabels.push(...filteredPageLabels);

        console.log(`✅ Animl: Page ${pageNumber} complete - ${pageImageLabels.length} records (total: ${allImageLabels.length})`);
        
        // Report progress if callback provided
        if (options.onProgress && maxResults !== undefined) {
          const percentage = Math.min(100, Math.round((allImageLabels.length / maxResults) * 100));
          options.onProgress(allImageLabels.length, maxResults, percentage);
        }

        hasMoreData = pageImageLabels.length === currentPageSize;
        currentOffset += pageImageLabels.length;
        pageNumber++;

        if (pageNumber > 50) {
          console.warn('⚠️ Animl: Reached maximum page limit (50), stopping pagination');
          break;
        }
      }

      console.log(`✅ Animl Image Labels: Completed pagination. Fetched ${allImageLabels.length} total records across ${pageNumber - 1} pages`);

      // Log timestamp range for debugging
      if (allImageLabels.length > 0) {
        const timestamps = allImageLabels.map(l => typeof l.timestamp === 'string' ? new Date(l.timestamp).getTime() : l.timestamp).sort((a, b) => a - b);
        const firstTimestamp = timestamps[0];
        const lastTimestamp = timestamps[timestamps.length - 1];
        console.log(`📅 Animl: Timestamp range in fetched data: ${new Date(firstTimestamp).toISOString()} to ${new Date(lastTimestamp).toISOString()}`);
        
        if (startDate && endDate && !useClientSideDateFilter) {
          const startTimestamp = new Date(startDate + 'T00:00:00Z').getTime();
          const endTimestamp = new Date(endDate + 'T23:59:59Z').getTime();
          console.log(`📅 Animl: Requested date range: ${startDate} to ${endDate} (${new Date(startTimestamp).toISOString()} to ${new Date(endTimestamp).toISOString()})`);
          const inRange = allImageLabels.filter(l => {
            const ts = typeof l.timestamp === 'string' ? new Date(l.timestamp).getTime() : l.timestamp;
            return ts >= startTimestamp && ts <= endTimestamp;
          });
          console.log(`📅 Animl: Records in requested date range: ${inRange.length} out of ${allImageLabels.length}`);
        }
      }

      // Join with deployments to get deployment names and locations
      console.log('🔗 Animl: Joining image labels with deployment data...');
      const deployments = await this.queryDeployments(options);
      const deploymentMap = new Map(deployments.map(d => [d.id, d]));

      const enrichedLabels = allImageLabels.map(label => {
        const deployment = deploymentMap.get(label.deployment_id);
        return {
          ...label,
          deployment_name: deployment?.name,
          deployment_location: deployment?.geometry?.coordinates,
          geometry: deployment?.geometry
        };
      });

      console.log(`✅ Animl: Enriched ${enrichedLabels.length} image labels with deployment info`);
      return enrichedLabels;

    } catch (error) {
      console.error('Error querying Animl image labels:', error);
      throw error;
    }
  }

  /**
   * Aggregate image labels by animal tag (label)
   */
  async aggregateAnimalTags(
    imageLabels: AnimlImageLabel[],
    limit: number = 10
  ): Promise<AnimlAnimalTag[]> {
    const tagMap = new Map<string, {
      label: string;
      observations: AnimlImageLabel[];
      cameras: Set<number>;
      timestamps: string[];
    }>();

    imageLabels.forEach(label => {
      if (!tagMap.has(label.label)) {
        tagMap.set(label.label, {
          label: label.label,
          observations: [],
          cameras: new Set(),
          timestamps: []
        });
      }

      const tag = tagMap.get(label.label)!;
      tag.observations.push(label);
      tag.cameras.add(label.deployment_id);
      tag.timestamps.push(label.timestamp);
    });

    return Array.from(tagMap.values())
      .map(tag => ({
        label: tag.label,
        totalObservations: tag.observations.length,
        uniqueCameras: tag.cameras.size,
        firstObservation: tag.timestamps.sort()[0] || '',
        lastObservation: tag.timestamps.sort().reverse()[0] || '',
        recentObservations: tag.observations
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit)
      }))
      .sort((a, b) => b.totalObservations - a.totalObservations);
  }

  /**
   * Enhance deployments with aggregated statistics
   */
  async enhanceDeploymentsWithStats(
    deployments: AnimlDeployment[],
    imageLabels: AnimlImageLabel[]
  ): Promise<AnimlDeployment[]> {
    const deploymentMap = new Map(deployments.map(d => [d.id, { ...d, observationList: [] as AnimlImageLabel[] }]));

    imageLabels.forEach(label => {
      const deployment = deploymentMap.get(label.deployment_id);
      if (deployment) {
        deployment.observationList.push(label);
      }
    });

    return Array.from(deploymentMap.values()).map(deployment => {
      const observations = deployment.observationList;
      const uniqueAnimals = Array.from(new Set(observations.map(o => o.label)));
      const timestamps = observations.map(o => o.timestamp).sort();

      return {
        id: deployment.id,
        animl_dp_id: deployment.animl_dp_id,
        name: deployment.name,
        geometry: deployment.geometry,
        totalObservations: observations.length,
        uniqueAnimals,
        firstObservation: timestamps[0] || undefined,
        lastObservation: timestamps[timestamps.length - 1] || undefined
      };
    });
  }
}

export const animlService = new AnimlService();
