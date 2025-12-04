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
  // NEW MapServer endpoints (Dec 2025)
  private readonly baseUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer';
  private readonly deploymentsLayerId = 0; // twin.animl.deployment (Point layer with cameras)
  
  // Table IDs for image labels
  // Layer 3: Deduplicated view - one row per image, labels_text has comma-separated labels
  // Layer 4: Flattened view - one row per (image, label) combination
  private readonly deduplicatedTableId = 3; // twin.animl.image_labels_deduplicated_view
  private readonly flattenedTableId = 4;    // twin.animl.image_labels_flattened_view
  
  // Full URLs for convenience
  private readonly deduplicatedServiceUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/3';
  private readonly flattenedServiceUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/MapServer/4';

  /**
   * Fetch with retry logic to handle flaky server responses
   * Uses exponential backoff: 500ms, 1000ms, 2000ms
   */
  private async fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    let lastError: Error = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
        
        // If not ok, treat as error and retry
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Fetch attempt ${attempt}/${maxRetries} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }
    throw lastError;
  }

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

      // Build where clause filters using DATE 'YYYY-MM-DD' format
      if (startDate && endDate) {
        // Always apply the date filter
        whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      if (labels.length > 0) {
        const labelFilter = labels.map(label => `'${label.replace(/'/g, "''")}'`).join(',');
        whereClause += ` AND label IN (${labelFilter})`;
      }

      // Always exclude person/people labels
      whereClause += ` AND label NOT IN ('person', 'people', 'human')`;

      const params: AnimlQueryOptions = {
        where: whereClause,
        returnCountOnly: true,
        f: 'json'
      };

      const queryUrl = `${this.baseUrl}/${this.flattenedTableId}/query`;
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
   * Get total unique image count for a single deployment (OPTIMIZED!)
   * Uses deduplicated service with returnCountOnly for fast, tiny responses
   * 
   * @param deploymentId - Deployment ID to count
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Count of unique images
   */
  private async getUniqueImageCountForDeployment(
    deploymentId: number,
    startDate: string | undefined,
    endDate: string | undefined
  ): Promise<number> {
    let whereClause = `deployment_id = ${deploymentId}`;
    
    // Add date filter using timestamp field (deduplicated service - MapServer/3)
    if (startDate && endDate) {
      // Always apply the date filter - no need to check if end date is in the future
      // because the search UI should handle that
      whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
      console.log(`📅 Deployment ${deploymentId} date filter: ${startDate} to ${endDate}`);
    } else {
      console.warn(`⚠️ Deployment ${deploymentId}: No date filter applied (startDate=${startDate}, endDate=${endDate})`);
    }
    
    // Exclude person/people/human labels (labels_text field contains comma-separated values)
    // Use NOT LIKE to exclude any labels containing 'person', 'people', or 'human'
    whereClause += ` AND labels_text NOT LIKE '%person%' AND labels_text NOT LIKE '%people%' AND labels_text NOT LIKE '%human%'`;
    
    const params: any = {
      where: whereClause,
      returnCountOnly: true,
      f: 'json'
    };
    
    const queryUrl = `${this.deduplicatedServiceUrl}/query`;
    const fullUrl = `${queryUrl}?${new URLSearchParams(params)}`;
    
    const response = await this.fetchWithRetry(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to get unique image count for deployment ${deploymentId}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`API error: ${JSON.stringify(data.error)}`);
    }
    
    // Return the count directly (deduplicated service with returnCountOnly)
    return data.count || 0;
  }

  /**
   * Get distinct labels for a deployment (OPTIMIZED!)
   * Uses flattened service with returnDistinctValues to get just the unique labels
   * 
   * @param deploymentId - Deployment ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Array of distinct label strings
   */
  private async getDistinctLabelsForDeployment(
    deploymentId: number,
    startDate: string | undefined,
    endDate: string | undefined
  ): Promise<string[]> {
    let whereClause = `deployment_id = ${deploymentId}`;
    
    // Add date filter using timestamp field (flattened service - MapServer/4)
    if (startDate && endDate) {
      // Always apply the date filter
      whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
    }
    
    // Exclude person/people/human
    whereClause += ` AND label NOT IN ('person', 'people', 'human')`;
    
    const params: any = {
      where: whereClause,
      outFields: 'label',
      returnDistinctValues: true,  // ← Get distinct values only!
      returnGeometry: false,
      f: 'json'
    };
    
    const queryUrl = `${this.flattenedServiceUrl}/query`;
    const fullUrl = `${queryUrl}?${new URLSearchParams(params)}`;
    
    const response = await this.fetchWithRetry(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to get distinct labels for deployment ${deploymentId}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`API error: ${JSON.stringify(data.error)}`);
    }
    
    return (data.features || [])
      .map((f: any) => f.attributes?.label)
      .filter((label: string) => label != null);
  }

  /**
   * Get unique image count for a specific (deployment, label) combination (OPTIMIZED!)
   * Uses flattened service with GROUP BY to get unique images
   * 
   * @param deploymentId - Deployment ID
   * @param label - Label to filter by
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Count of unique images for this label at this deployment
   */
  private async getUniqueImageCountForLabel(
    deploymentId: number,
    label: string,
    startDate: string | undefined,
    endDate: string | undefined
  ): Promise<number> {
    let whereClause = `deployment_id = ${deploymentId} AND label = '${label.replace(/'/g, "''")}'`;
    
    // Add date filter using timestamp field (flattened service - MapServer/4)
    if (startDate && endDate) {
      // Always apply the date filter
      whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
    }
    
    // GROUP BY animl_image_id
    // NOTE: returnCountOnly doesn't work with groupByFieldsForStatistics in ArcGIS!
    const params: any = {
      where: whereClause,
      outStatistics: JSON.stringify([{
        statisticType: 'count',
        onStatisticField: 'id',
        outStatisticFieldName: 'count'
      }]),
      groupByFieldsForStatistics: 'deployment_id,animl_image_id',
      f: 'json'
    };
    
    const queryUrl = `${this.flattenedServiceUrl}/query`;
    const fullUrl = `${queryUrl}?${new URLSearchParams(params)}`;
    
    const response = await this.fetchWithRetry(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to get count for ${label} at deployment ${deploymentId}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`API error: ${JSON.stringify(data.error)}`);
    }
    
    // Count the grouped rows (each row = one unique image with this label)
    return data.features?.length || 0;
  }

  /**
   * Get observation counts grouped by (deployment_id, label) combination (OPTIMIZED!)
   * 
   * NEW APPROACH: Uses 3 efficient queries per deployment:
   * 1. Get total unique images (GROUP BY with returnCountOnly)
   * 2. Get distinct labels (returnDistinctValues)
   * 3. For each label, get unique image count (GROUP BY with returnCountOnly)
   * 
   * This avoids the 2,000 record limit and is much faster!
   * 
   * @param options - Query filters (date range, deployment IDs)
   * @returns Object with: grouped counts array and unique image counts per deployment
   * 
   * @example
   * const result = await animlService.getObservationCountsGrouped({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   deploymentIds: [59, 61, 63]
   * });
   */
  async getObservationCountsGrouped(options: AnimlServiceQueryOptions = {}): Promise<{ 
    groupedCounts: AnimlGroupedCount[];
    uniqueImageCountsByDeployment: Map<number, number>;
  }> {
    const { startDate, endDate, deploymentIds = [] } = options;

    try {
      console.log('🚀 Animl Grouped Counts: Using OPTIMIZED 3-query approach with deduplicated service!');
      console.log('📊 Date range:', startDate, 'to', endDate);
      console.log('📊 Deployments:', deploymentIds.length > 0 ? `${deploymentIds.length} specific deployments` : 'ALL deployments');
      const start = Date.now();
      
      // If no deployment IDs specified, we need to get all deployments first
      const deploymentsToQuery = deploymentIds.length > 0 
        ? deploymentIds 
        : (await this.queryDeployments(options)).map(d => d.id);
      
      console.log(`📊 Processing ${deploymentsToQuery.length} deployments in parallel...`);
      const parallelStart = Date.now();
      
      // Process all deployments in parallel!
      const deploymentResults = await Promise.all(
        deploymentsToQuery.map(async (deploymentId) => {
          const deploymentStart = Date.now();
          try {
            // Queries 1 & 2: Run in parallel since they're independent
            const query12Start = Date.now();
            const [totalCount, labels] = await Promise.all([
              this.getUniqueImageCountForDeployment(deploymentId, startDate, endDate),
              this.getDistinctLabelsForDeployment(deploymentId, startDate, endDate)
            ]);
            const query12Duration = Date.now() - query12Start;
            
            // Query 3: For each label, get unique image count (parallel!)
            const query3Start = Date.now();
            const labelCounts = await Promise.all(
              labels.map(label => this.getUniqueImageCountForLabel(deploymentId, label, startDate, endDate))
            );
            const query3Duration = Date.now() - query3Start;
            
            // Build per-label counts
            const byLabel = labels.map((label, i) => ({
              label,
              count: labelCounts[i]
            }));
            
            const deploymentDuration = Date.now() - deploymentStart;
            console.log(`✅ Deployment ${deploymentId}: ${totalCount} unique images, ${labels.length} species (Q1+Q2: ${query12Duration}ms, Q3: ${query3Duration}ms, Total: ${deploymentDuration}ms)`);
            
            return {
              deploymentId,
              totalCount,
              byLabel
            };
          } catch (error) {
            console.error(`❌ Error processing deployment ${deploymentId}:`, error);
            return {
              deploymentId,
              totalCount: 0,
              byLabel: []
            };
          }
        })
      );
      
      // Convert to expected format
      const uniqueImageCountsMap = new Map<number, number>();
      const groupedCounts: AnimlGroupedCount[] = [];
      
      deploymentResults.forEach(result => {
        // Store total count for this deployment
        uniqueImageCountsMap.set(result.deploymentId, result.totalCount);
        
        // Store per-label counts
        result.byLabel.forEach(({ label, count }) => {
          groupedCounts.push({
            deployment_id: result.deploymentId,
            label,
            observation_count: count
          });
        });
      });
      
      const parallelDuration = Date.now() - parallelStart;
      const duration = Date.now() - start;
      const totalImages = Array.from(uniqueImageCountsMap.values()).reduce((sum, count) => sum + count, 0);
      const totalSpeciesRecords = groupedCounts.length;
      
      console.log(`✅ Animl Grouped Counts COMPLETE: ${totalImages} unique images across ${uniqueImageCountsMap.size} deployments, ${totalSpeciesRecords} (deployment, species) combinations`);
      console.log(`⏱️  Wall-clock time: ${parallelDuration}ms for ${deploymentsToQuery.length} deployments`);
      console.log(`📊 If sequential, would have taken: ~${(duration / deploymentsToQuery.length * deploymentsToQuery.length).toFixed(0)}ms`);
      console.log(`🚀 Parallelization efficiency: Processing in parallel!`);

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
  ): number | { floor: number; ceiling: number } {
    const { countsByDeployment, countsByLabel, countsByDeploymentAndLabel, labelsByDeployment } = lookups;

    console.log('🎯🔢 getTotalCountForFilters called:', {
      selectedDeploymentIds,
      selectedLabels,
      hasDeploymentFilter: selectedDeploymentIds.length > 0,
      hasLabelFilter: selectedLabels.length > 0
    });

    // If no filters, return total for all deployments
    if (selectedDeploymentIds.length === 0 && selectedLabels.length === 0) {
      const total = Array.from(countsByDeployment.values()).reduce((sum, count) => sum + count, 0);
      console.log('🎯🔢 No filters - returning total across all deployments:', total);
      return total;
    }

    // If only deployment filter, return total for those deployments
    if (selectedDeploymentIds.length > 0 && selectedLabels.length === 0) {
      const total = selectedDeploymentIds.reduce((sum, depId) => {
        const count = countsByDeployment.get(depId) || 0;
        console.log(`🎯🔢   Deployment ${depId}: ${count} images`);
        return sum + count;
      }, 0);
      console.log('🎯🔢 Deployment-only filter - total:', total);
      return total;
    }

    // If only label filter, return total for those labels
    if (selectedDeploymentIds.length === 0 && selectedLabels.length > 0) {
      const total = selectedLabels.reduce((sum, label) => {
        const count = countsByLabel.get(label) || 0;
        console.log(`🎯🔢   Label '${label}': ${count} images (across all deployments)`);
        return sum + count;
      }, 0);
      console.log('🎯🔢 Label-only filter - total:', total);
      console.log('🎯🔢 ⚠️  WARNING: This sums across ALL deployments, not filtered by selected camera!');
      return total;
    }

    // If both filters, calculate based on number of labels selected
    if (selectedLabels.length === 1) {
      // Single label: exact count
      let total = 0;
      console.log('🎯🔢 Deployment + Single label filter (exact):');
      const singleLabel = selectedLabels[0];
      for (const depId of selectedDeploymentIds) {
        const key = `${depId}:${singleLabel}`;
        const count = countsByDeploymentAndLabel.get(key) || 0;
        if (count > 0) {
          console.log(`🎯🔢   Deployment ${depId} + Label '${singleLabel}': ${count} images`);
        }
        total += count;
      }
      console.log('🎯🔢 Single label - exact total:', total);
      return total;
    } else {
      // Multiple labels: use COMPLEMENT logic (what's NOT selected)
      // This works better when many labels are selected
      console.log('🎯🔢 Deployment + Multiple labels → using complement logic:');
      
      let grandTotal = 0;
      let floorReduction = 0;  // Max images we could remove (all unselected are solo)
      let ceilingReduction = 0; // Min images we could remove (all unselected have other selected tags = 0)
      
      for (const depId of selectedDeploymentIds) {
        const totalForDep = countsByDeployment.get(depId) || 0;
        grandTotal += totalForDep;
        
        // Get all labels for this deployment
        const allLabelsForDep = labelsByDeployment.get(depId) || new Set();
        
        // Find UNselected labels for this deployment
        const unselectedLabels = Array.from(allLabelsForDep).filter(
          label => !selectedLabels.includes(label)
        );
        
        // Sum counts of unselected labels
        let unselectedSum = 0;
        for (const label of unselectedLabels) {
          const key = `${depId}:${label}`;
          const count = countsByDeploymentAndLabel.get(key) || 0;
          unselectedSum += count;
        }
        
        // Floor: assumes all unselected images are solo (max removal)
        // But can't remove more than the sum of unselected counts
        floorReduction += Math.min(unselectedSum, totalForDep);
        
        // Ceiling: assumes all unselected images have selected tags (min removal = 0)
        ceilingReduction += 0;
        
        console.log(`🎯🔢   Deployment ${depId}: total=${totalForDep}, unselected labels=${unselectedLabels.length}, unselected sum=${unselectedSum}`);
      }
      
      const floor = Math.max(0, grandTotal - floorReduction);
      const ceiling = grandTotal - ceilingReduction; // Same as grandTotal
      
      console.log('🎯🔢 Complement logic - range:', { floor, ceiling, grandTotal, floorReduction, ceilingReduction });
      console.log('🎯🔢 ✅ Floor: total minus all unselected (assumes solo), Ceiling: total (assumes overlap)');
      return { floor, ceiling };
    }
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

      // Build where clause filters using DATE 'YYYY-MM-DD' format
      if (startDate && endDate) {
        // Always apply the date filter
        whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
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

      const queryUrl = `${this.baseUrl}/${this.flattenedTableId}/query`;
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
        // Always apply the date filter
        whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
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

      const queryUrl = `${this.baseUrl}/${this.flattenedTableId}/query`;
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

      // Build where clause filters using DATE 'YYYY-MM-DD' format
      if (startDate && endDate) {
        // Always apply the date filter
        whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      // Always exclude person/people/human labels
      whereClause += ` AND label NOT IN ('person', 'people', 'human')`;

      // Use statistics query to get unique labels AND their counts in a single query
      const outStatistics = JSON.stringify([
        {
          statisticType: 'COUNT',
          onStatisticField: 'label',
          outStatisticFieldName: 'count'
        }
      ]);

      const queryUrl = `${this.baseUrl}/${this.flattenedTableId}/query`;
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
        .filter((tag: AnimlAnimalTag) => {
          const labelLower = tag.label.toLowerCase();
          // Filter out Unknown, person, people, and human
          return tag.label !== 'Unknown' && 
                 labelLower !== 'person' && 
                 labelLower !== 'people' && 
                 labelLower !== 'human';
        });

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

      // Build where clause filters using DATE 'YYYY-MM-DD' format (works with new MapServer tables)
      if (startDate && endDate) {
        // Always apply the date filter
        whereClause += ` AND timestamp >= DATE '${startDate}' AND timestamp <= DATE '${endDate}'`;
        console.log(`📅 Animl: Applying date filter from ${startDate} to ${endDate}`);
      } else {
        console.warn('⚠️ Animl: No date filter applied (startDate=' + startDate + ', endDate=' + endDate + ')');
      }

      if (deploymentIds.length > 0) {
        const deploymentFilter = deploymentIds.join(',');
        whereClause += ` AND deployment_id IN (${deploymentFilter})`;
      }

      if (labels.length > 0) {
        const labelFilter = labels.map(label => `'${label.replace(/'/g, "''")}'`).join(',');
        whereClause += ` AND label IN (${labelFilter})`;
      }

      // Always exclude person/people labels
      whereClause += ` AND label NOT IN ('person', 'people', 'human')`;

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

      const queryUrl = `${this.baseUrl}/${this.flattenedTableId}/query`;

      // Pagination loop - continue until no more data or maxResults is reached
      while (hasMoreData && (maxResults === undefined || allImageLabels.length < maxResults)) {
        const remainingResults = maxResults !== undefined ? maxResults - allImageLabels.length : pageSize_internal;
        const currentPageSize = Math.min(pageSize_internal, remainingResults);

        const params: AnimlQueryOptions = {
          where: whereClause,
          // New MapServer/4 (flattened view) includes deployment_name directly
          outFields: 'id,animl_image_id,deployment_id,deployment_name,timestamp,label,medium_url,small_url',
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
          deployment_name: feature.attributes.deployment_name, // Now available directly from flattened view
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

      // Join with deployments to get geometry (lat/lon) for map display
      // Note: deployment_name is now available directly from the flattened view
      console.log('🔗 Animl: Fetching deployment geometry for map display...');
      const deployments = await this.queryDeployments(options);
      const deploymentMap = new Map(deployments.map(d => [d.id, d]));

      const enrichedLabels = allImageLabels.map(label => {
        const deployment = deploymentMap.get(label.deployment_id);
        return {
          ...label,
          // Use deployment_name from response if available, fallback to deployment lookup
          deployment_name: label.deployment_name || deployment?.name,
          deployment_location: deployment?.geometry?.coordinates,
          geometry: deployment?.geometry
        };
      });

      console.log(`✅ Animl: Enriched ${enrichedLabels.length} image labels with deployment geometry`);
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
