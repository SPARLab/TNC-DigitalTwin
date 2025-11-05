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
}

export interface AnimlServiceQueryOptions {
  startDate?: string;
  endDate?: string;
  deploymentIds?: number[];
  labels?: string[];
  spatialExtent?: { xmin: number; ymin: number; xmax: number; ymax: number };
  maxResults?: number;
  pageSize?: number;
  resultOffset?: number;
  searchMode?: 'preserve-only' | 'expanded' | 'custom';
  customPolygon?: string;
  onProgress?: (current: number, total: number, percentage: number) => void;
}

class AnimlService {
  private readonly baseUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer';
  private readonly deploymentsLayerId = 0; // Deployments/Camera Traps
  private readonly imageLabelsLayerId = 1; // Image Labels/Observations

  /**
   * Query deployments (camera traps) from the FeatureServer
   * NOTE: Spatial filtering is currently disabled due to server issues
   */
  async queryDeployments(options: AnimlServiceQueryOptions = {}): Promise<AnimlDeployment[]> {
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
   * Get count of image labels by category/label
   */
  async getImageLabelsCountByCategory(options: AnimlServiceQueryOptions = {}): Promise<Record<string, number>> {
    try {
      // First get all unique labels
      const allLabels = await this.queryImageLabels({
        ...options,
        maxResults: 100000 // Large limit to get all labels for counting
      });

      // Count by label
      const counts: Record<string, number> = {};
      allLabels.forEach(label => {
        counts[label.label] = (counts[label.label] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error getting Animl image labels count by category:', error);
      throw error;
    }
  }

  async queryImageLabels(options: AnimlServiceQueryOptions = {}): Promise<AnimlImageLabel[]> {
    const {
      startDate,
      endDate,
      deploymentIds = [],
      labels = [],
      maxResults = undefined // Remove default limit - fetch all if not specified
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
      const pageSize_internal = 1000;
      let allImageLabels: AnimlImageLabel[] = [];
      let currentOffset = 0;
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
