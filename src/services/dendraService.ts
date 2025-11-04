import type { 
  DendraStation, 
  DendraDatastream, 
  DendraDatapoint,
  DendraDatastreamMetadata,
  DendraDatastreamWithMetadata,
  DendraStationWithMetadata,
} from '../types';

const DENDRA_BASE_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Dendra_Stations/FeatureServer';

// Layer IDs
const STATION_LAYER_ID = 0;
const DATASTREAM_TABLE_ID = 3;
const DATAPOINT_TABLE_ID = 4;

interface ArcGISFeature<T> {
  attributes: T;
  geometry?: {
    x: number;
    y: number;
  };
}

interface ArcGISQueryResponse<T> {
  features: ArcGISFeature<T>[];
  exceededTransferLimit?: boolean;
}

/**
 * Fetch all Dendra stations (75 total)
 */
export async function fetchDendraStations(): Promise<DendraStation[]> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'json',
    returnGeometry: 'true',
  });

  const url = `${DENDRA_BASE_URL}/${STATION_LAYER_ID}/query?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Dendra stations: ${response.statusText}`);
  }

  const data: ArcGISQueryResponse<Omit<DendraStation, 'geometry'>> = await response.json();
  
  return data.features.map(feature => ({
    ...feature.attributes,
    geometry: feature.geometry || { x: 0, y: 0 },
  }));
}

/**
 * Fetch all datastreams (856 total)
 */
export async function fetchDendraDatastreams(): Promise<DendraDatastream[]> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'json',
  });

  const url = `${DENDRA_BASE_URL}/${DATASTREAM_TABLE_ID}/query?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Dendra datastreams: ${response.statusText}`);
  }

  const data: ArcGISQueryResponse<DendraDatastream> = await response.json();
  
  return data.features.map(feature => feature.attributes);
}

/**
 * Fetch datastreams for a specific station
 */
export async function fetchDatastreamsForStation(stationId: number): Promise<DendraDatastream[]> {
  const params = new URLSearchParams({
    where: `station_id=${stationId}`,
    outFields: '*',
    f: 'json',
  });

  const url = `${DENDRA_BASE_URL}/${DATASTREAM_TABLE_ID}/query?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch datastreams for station ${stationId}: ${response.statusText}`);
  }

  const data: ArcGISQueryResponse<DendraDatastream> = await response.json();
  
  return data.features.map(feature => feature.attributes);
}

/**
 * Fetch metadata for a single datastream
 * @param datastreamId - The datastream ID
 * @returns Metadata including first/last timestamps, count, and min/max values
 */
export async function fetchDatastreamMetadata(datastreamId: number): Promise<DendraDatastreamMetadata> {
  const whereClause = `datastream_id=${datastreamId}`;
  
  try {
    // Fetch count
    const countParams = new URLSearchParams({
      where: whereClause,
      returnCountOnly: 'true',
      f: 'json',
    });
    const countUrl = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${countParams}`;
    const countResponse = await fetch(countUrl);
    const countData = await countResponse.json();
    const datapointCount = countData.count || 0;
    
    // If no data, return early
    if (datapointCount === 0) {
      return {
        firstTimestamp: null,
        lastTimestamp: null,
        datapointCount: 0,
        minValue: null,
        maxValue: null,
      };
    }
    
    // Fetch first record (oldest timestamp)
    const firstParams = new URLSearchParams({
      where: whereClause,
      outFields: 'timestamp_utc,value',
      orderByFields: 'timestamp_utc ASC',
      resultRecordCount: '1',
      f: 'json',
    });
    const firstUrl = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${firstParams}`;
    
    // Fetch last record (newest timestamp)
    const lastParams = new URLSearchParams({
      where: whereClause,
      outFields: 'timestamp_utc,value',
      orderByFields: 'timestamp_utc DESC',
      resultRecordCount: '1',
      f: 'json',
    });
    const lastUrl = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${lastParams}`;
    
    // Fetch a sample of records to calculate min/max (first 1000 and last 1000)
    const sampleParams = new URLSearchParams({
      where: whereClause,
      outFields: 'value',
      resultRecordCount: '1000',
      f: 'json',
    });
    const sampleUrl = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${sampleParams}`;
    
    // Execute all queries in parallel
    const [firstResponse, lastResponse, sampleResponse] = await Promise.all([
      fetch(firstUrl),
      fetch(lastUrl),
      fetch(sampleUrl),
    ]);
    
    const [firstData, lastData, sampleData] = await Promise.all([
      firstResponse.json(),
      lastResponse.json(),
      sampleResponse.json(),
    ]);
    
    // Extract values
    const firstTimestamp = firstData.features?.[0]?.attributes?.timestamp_utc || null;
    const lastTimestamp = lastData.features?.[0]?.attributes?.timestamp_utc || null;
    
    // Calculate min/max from sample
    let minValue: number | null = null;
    let maxValue: number | null = null;
    
    if (sampleData.features && sampleData.features.length > 0) {
      const values = sampleData.features.map((f: any) => f.attributes.value).filter((v: any) => v !== null && v !== undefined);
      if (values.length > 0) {
        minValue = Math.min(...values);
        maxValue = Math.max(...values);
      }
    }
    
    return {
      firstTimestamp,
      lastTimestamp,
      datapointCount,
      minValue,
      maxValue,
    };
  } catch (error) {
    console.error(`Error fetching metadata for datastream ${datastreamId}:`, error);
    return {
      firstTimestamp: null,
      lastTimestamp: null,
      datapointCount: 0,
      minValue: null,
      maxValue: null,
    };
  }
}

/**
 * Fetch datastreams with metadata for a specific station
 * @param stationId - The station ID
 * @returns Array of datastreams with their metadata
 */
export async function fetchDatastreamsWithMetadataForStation(
  stationId: number
): Promise<DendraDatastreamWithMetadata[]> {
  const datastreams = await fetchDatastreamsForStation(stationId);
  
  // Fetch metadata for all datastreams in parallel
  const metadataPromises = datastreams.map(ds => fetchDatastreamMetadata(ds.id));
  const metadataResults = await Promise.all(metadataPromises);
  
  return datastreams.map((ds, index) => ({
    ...ds,
    metadata: metadataResults[index],
  }));
}

/**
 * Fetch all datastreams with metadata
 * @returns Array of datastreams with their metadata
 */
export async function fetchAllDatastreamsWithMetadata(): Promise<DendraDatastreamWithMetadata[]> {
  console.log('Fetching all datastreams with metadata...');
  const datastreams = await fetchDendraDatastreams();
  
  // Fetch metadata for all datastreams in parallel (batched for performance)
  const batchSize = 20; // Process 20 at a time to avoid overwhelming the server
  const results: DendraDatastreamWithMetadata[] = [];
  
  for (let i = 0; i < datastreams.length; i += batchSize) {
    const batch = datastreams.slice(i, i + batchSize);
    const metadataPromises = batch.map(ds => fetchDatastreamMetadata(ds.id));
    const metadataResults = await Promise.all(metadataPromises);
    
    const batchResults = batch.map((ds, index) => ({
      ...ds,
      metadata: metadataResults[index],
    }));
    
    results.push(...batchResults);
    console.log(`Processed ${Math.min(i + batchSize, datastreams.length)}/${datastreams.length} datastreams`);
  }
  
  console.log('All datastream metadata fetched');
  return results;
}

/**
 * Fetch all stations with metadata (datastream count and first/last timestamps)
 * @param datastreamsWithMetadata - Optional pre-fetched datastreams with metadata
 * @returns Array of stations with their metadata
 */
export async function fetchStationsWithMetadata(
  datastreamsWithMetadata?: DendraDatastreamWithMetadata[]
): Promise<DendraStationWithMetadata[]> {
  const stations = await fetchDendraStations();
  const datastreams = datastreamsWithMetadata || await fetchAllDatastreamsWithMetadata();
  
  // Group datastreams by station
  const datastreamsByStation = new Map<number, DendraDatastreamWithMetadata[]>();
  datastreams.forEach(ds => {
    if (!datastreamsByStation.has(ds.station_id)) {
      datastreamsByStation.set(ds.station_id, []);
    }
    datastreamsByStation.get(ds.station_id)!.push(ds);
  });
  
  // Build station metadata
  return stations.map(station => {
    const stationDatastreams = datastreamsByStation.get(station.id) || [];
    
    // Find the earliest first timestamp and latest last timestamp across all datastreams
    let firstTimestamp: number | null = null;
    let lastTimestamp: number | null = null;
    
    stationDatastreams.forEach(ds => {
      if (ds.metadata.firstTimestamp) {
        firstTimestamp = firstTimestamp === null 
          ? ds.metadata.firstTimestamp 
          : Math.min(firstTimestamp, ds.metadata.firstTimestamp);
      }
      if (ds.metadata.lastTimestamp) {
        lastTimestamp = lastTimestamp === null 
          ? ds.metadata.lastTimestamp 
          : Math.max(lastTimestamp, ds.metadata.lastTimestamp);
      }
    });
    
    return {
      ...station,
      datastreamCount: stationDatastreams.length,
      firstTimestamp,
      lastTimestamp,
    };
  });
}

/**
 * Get the most recent timestamp for a datastream
 * @param datastreamId - The datastream ID
 * @returns The most recent timestamp (as epoch milliseconds), or null if no data
 */
export async function getMostRecentTimestamp(datastreamId: number): Promise<number | null> {
  const params = new URLSearchParams({
    where: `datastream_id=${datastreamId}`,
    outFields: 'timestamp_utc',
    orderByFields: 'timestamp_utc DESC',
    resultRecordCount: '1',
    f: 'json',
  });

  const url = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch most recent timestamp: ${response.statusText}`);
  }

  const data: ArcGISQueryResponse<DendraDatapoint> | { error?: any } = await response.json();
  
  if ('error' in data && data.error) {
    console.error('ArcGIS query error:', data.error);
    return null;
  }
  
  if (!('features' in data) || !data.features || data.features.length === 0) {
    return null;
  }

  const mostRecentTimestamp = data.features[0].attributes.timestamp_utc;
  return mostRecentTimestamp;
}

/**
 * Fetch datapoints for a specific datastream with progressive loading
 * @param datastreamId - The datastream ID
 * @param daysBack - Number of days back from the reference date (undefined = get all available data)
 * @param batchSize - Number of records to fetch per request (default: 2000, max: 2000)
 * @param onBatchLoaded - Callback function called after each batch is loaded
 * @param fromMostRecent - If true, fetch daysBack from the most recent timestamp rather than from today
 */
export async function fetchDatapointsForDatastream(
  datastreamId: number,
  daysBack?: number,
  batchSize: number = 2000,
  onBatchLoaded?: (batch: DendraDatapoint[], isComplete: boolean) => void,
  fromMostRecent: boolean = true
): Promise<DendraDatapoint[]> {
  // Build where clause - optionally filter by date
  let whereClause = `datastream_id=${datastreamId}`;
  
  if (daysBack !== undefined) {
    let referenceDate: Date;
    
    if (fromMostRecent) {
      // Get the most recent timestamp and go back from there
      const mostRecentTimestamp = await getMostRecentTimestamp(datastreamId);
      if (mostRecentTimestamp === null) {
        return [];
      }
      referenceDate = new Date(mostRecentTimestamp);
    } else {
      // Use today as reference
      referenceDate = new Date();
    }
    
    // Calculate date for filtering (going back from reference date)
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0] + ' 00:00:00';
    whereClause += ` AND timestamp_utc >= DATE '${dateStr}'`;
  }

  const allDatapoints: DendraDatapoint[] = [];
  let offset = 0;
  let hasMore = true;
  const parallelBatches = 5; // Fetch 5 batches in parallel for better performance

  // Helper function to fetch a single batch
  const fetchBatch = async (currentOffset: number) => {
    const params = new URLSearchParams({
      where: whereClause,
      outFields: 'id,datastream_id,timestamp_utc,value',
      orderByFields: 'timestamp_utc ASC',
      resultRecordCount: batchSize.toString(),
      resultOffset: currentOffset.toString(),
      f: 'json',
    });

    const url = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch datapoints for datastream ${datastreamId}: ${response.statusText}`);
    }

    const data: ArcGISQueryResponse<DendraDatapoint> | { error?: any } = await response.json();
    
    // Check if there's an error in the response
    if ('error' in data && data.error) {
      console.error('ArcGIS query error:', data.error);
      throw new Error(`ArcGIS query error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    
    // Handle empty or missing features
    if (!('features' in data) || !data.features || data.features.length === 0) {
      return null;
    }
    
    return data.features.map((feature: ArcGISFeature<DendraDatapoint>) => feature.attributes);
  };

  while (hasMore) {
    // Fetch multiple batches in parallel
    const batchPromises = [];
    for (let i = 0; i < parallelBatches; i++) {
      batchPromises.push(fetchBatch(offset + (i * batchSize)));
    }
    
    const batches = await Promise.all(batchPromises);
    
    // Process batches in order
    let foundEmptyBatch = false;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      if (batch === null || batch.length === 0) {
        foundEmptyBatch = true;
        hasMore = false;
        break;
      }
      
      allDatapoints.push(...batch);
      
      // Check if this batch was incomplete (less than batchSize)
      if (batch.length < batchSize) {
        hasMore = false;
        foundEmptyBatch = true;
      }
      
      // Call the callback if provided
      if (onBatchLoaded) {
        const isComplete = !hasMore || (i === batches.length - 1 && foundEmptyBatch);
        onBatchLoaded(batch, isComplete);
      }
      
      if (!hasMore) {
        break;
      }
    }
    
    // Move to next set of batches
    offset += parallelBatches * batchSize;
  }

  return allDatapoints;
}

/**
 * Get a count of datapoints for a datastream (useful for UI feedback)
 * @param datastreamId - The datastream ID
 * @param daysBack - Number of days back from the reference date (undefined = count all available data)
 * @param fromMostRecent - If true, count daysBack from the most recent timestamp rather than from today
 */
export async function getDatapointCount(
  datastreamId: number,
  daysBack?: number,
  fromMostRecent: boolean = true
): Promise<number> {
  // Build where clause - optionally filter by date
  let whereClause = `datastream_id=${datastreamId}`;
  
  if (daysBack !== undefined) {
    let referenceDate: Date;
    
    if (fromMostRecent) {
      const mostRecentTimestamp = await getMostRecentTimestamp(datastreamId);
      if (mostRecentTimestamp === null) {
        return 0;
      }
      referenceDate = new Date(mostRecentTimestamp);
    } else {
      referenceDate = new Date();
    }
    
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysBack);
    const dateStr = startDate.toISOString().split('T')[0] + ' 00:00:00';
    whereClause += ` AND timestamp_utc >= DATE '${dateStr}'`;
  }

  const params = new URLSearchParams({
    where: whereClause,
    returnCountOnly: 'true',
    f: 'json',
  });

  const url = `${DENDRA_BASE_URL}/${DATAPOINT_TABLE_ID}/query?${params}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to get datapoint count: ${response.statusText}`);
  }

  const data = await response.json();
  return data.count || 0;
}

