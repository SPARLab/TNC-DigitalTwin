import type {
  DroneImageryRecord,
  DroneImageryMetadata,
  DroneImageryProject,
  DroneImageryQueryResponse,
} from '../types/droneImagery';

// Re-export types for consumers
export type { DroneImageryMetadata, DroneImageryProject };

// v2 API includes project_bounds and plan_geometry fields
const DRONE_IMAGERY_METADATA_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata_v2/FeatureServer/0';


/**
 * Parse Unix timestamp (milliseconds) to Date object
 */
function parseTimestamp(timestampMs: string): Date {
  return new Date(parseInt(timestampMs));
}

/**
 * Parse WKT POLYGON string to coordinate rings
 * Example: "POLYGON ((-120.5 34.5, -120.4 34.5, ...))"
 */
function parseWKTPolygon(wkt: string | null): number[][][] | undefined {
  if (!wkt) return undefined;
  
  try {
    // Remove "POLYGON " prefix and outer parentheses
    const match = wkt.match(/POLYGON\s*\(\((.+)\)\)/i);
    if (!match) return undefined;
    
    const coordsString = match[1];
    const coords = coordsString.split(',').map(pair => {
      const [lon, lat] = pair.trim().split(/\s+/).map(Number);
      return [lon, lat];
    });
    
    // Return as rings array (outer ring only for now)
    return [coords];
  } catch (e) {
    console.warn('Failed to parse WKT polygon:', wkt, e);
    return undefined;
  }
}

/**
 * Convert raw record to processed metadata
 */
function recordToMetadata(record: DroneImageryRecord): DroneImageryMetadata {
  const metadata: DroneImageryMetadata = {
    id: record.objectid,
    projectName: record.project_name,
    planId: record.plan_id,
    planName: record.plan_name,
    dateCaptured: parseTimestamp(record.date_captured),
    lastUpdated: parseTimestamp(record.last_updated),
    wmts: {
      link: record.wmts_link,
      itemId: record.wmts_item_id,
    },
    recordType: record.record_type,
    planGeometry: parseWKTPolygon(record.plan_geometry),
    // Use the azure_blob_url from the API directly
    tifUrl: record.azure_blob_url || undefined,
  };

  // Add image collection if available
  if (record.collection_item_id && record.collection_link) {
    metadata.imageCollection = {
      link: record.collection_link,
      itemId: record.collection_item_id,
    };
  }

  return metadata;
}

/**
 * Fetch all drone imagery metadata records
 */
export async function fetchDroneImageryMetadata(): Promise<DroneImageryMetadata[]> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  });

  const url = `${DRONE_IMAGERY_METADATA_URL}/query?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch drone imagery metadata: ${response.statusText}`);
  }

  const data: DroneImageryQueryResponse = await response.json();

  return data.features.map((feature) => recordToMetadata(feature.attributes));
}

/**
 * Fetch all drone imagery raw records (for extracting project_bounds)
 */
async function fetchDroneImageryRawRecords(): Promise<DroneImageryRecord[]> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'false',
    f: 'json',
  });

  const url = `${DRONE_IMAGERY_METADATA_URL}/query?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch drone imagery raw records: ${response.statusText}`);
  }

  const data: DroneImageryQueryResponse = await response.json();
  return data.features.map((feature) => feature.attributes);
}

/**
 * Fetch drone imagery metadata grouped by project
 */
export async function fetchDroneImageryByProject(): Promise<DroneImageryProject[]> {
  const rawRecords = await fetchDroneImageryRawRecords();

  // Group raw records by project name
  const projectMap = new Map<string, { records: DroneImageryRecord[], metadata: DroneImageryMetadata[] }>();

  for (const record of rawRecords) {
    if (!projectMap.has(record.project_name)) {
      projectMap.set(record.project_name, { records: [], metadata: [] });
    }
    const group = projectMap.get(record.project_name)!;
    group.records.push(record);
    group.metadata.push(recordToMetadata(record));
  }

  // Convert to project objects with metadata
  const projects: DroneImageryProject[] = [];

  for (const [projectName, { records, metadata: imageryLayers }] of projectMap.entries()) {
    // Sort layers by capture date (oldest first)
    imageryLayers.sort(
      (a, b) => a.dateCaptured.getTime() - b.dateCaptured.getTime()
    );

    const dates = imageryLayers.map((layer) => layer.dateCaptured.getTime());
    const dateRangeStart = new Date(Math.min(...dates));
    const dateRangeEnd = new Date(Math.max(...dates));
    const hasImageCollections = imageryLayers.some(
      (layer) => layer.imageCollection !== undefined
    );

    // Get project_bounds from the first record that has it
    const projectBoundsWKT = records.find(r => r.project_bounds)?.project_bounds;
    const projectBounds = parseWKTPolygon(projectBoundsWKT || null);

    projects.push({
      projectName,
      imageryLayers,
      dateRangeStart,
      dateRangeEnd,
      layerCount: imageryLayers.length,
      hasImageCollections,
      projectBounds,
    });
  }

  // Sort projects by name
  projects.sort((a, b) => a.projectName.localeCompare(b.projectName));

  return projects;
}

/**
 * Fetch drone imagery metadata for a specific project
 */
export async function fetchDroneImageryForProject(
  projectName: string
): Promise<DroneImageryMetadata[]> {
  const params = new URLSearchParams({
    where: `project_name='${projectName}'`,
    outFields: '*',
    returnGeometry: 'false',
    orderByFields: 'date_captured ASC',
    f: 'json',
  });

  const url = `${DRONE_IMAGERY_METADATA_URL}/query?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch drone imagery for project ${projectName}: ${response.statusText}`
    );
  }

  const data: DroneImageryQueryResponse = await response.json();

  return data.features.map((feature) => recordToMetadata(feature.attributes));
}

/**
 * Get total count of drone imagery layers
 */
export async function getDroneImageryCount(): Promise<number> {
  const params = new URLSearchParams({
    where: '1=1',
    returnCountOnly: 'true',
    f: 'json',
  });

  const url = `${DRONE_IMAGERY_METADATA_URL}/query?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get drone imagery count: ${response.statusText}`);
  }

  const data = await response.json();
  return data.count || 0;
}

/**
 * Get summary statistics for drone imagery
 */
export async function getDroneImagerySummary() {
  const projects = await fetchDroneImageryByProject();

  const totalLayers = projects.reduce((sum, p) => sum + p.layerCount, 0);
  const projectsWithCollections = projects.filter(
    (p) => p.hasImageCollections
  ).length;
  const projectsWithTemporalSeries = projects.filter(
    (p) => p.layerCount > 1
  ).length;

  // Find overall date range
  const allDates = projects.flatMap((p) => [
    p.dateRangeStart.getTime(),
    p.dateRangeEnd.getTime(),
  ]);
  const oldestCapture = new Date(Math.min(...allDates));
  const newestCapture = new Date(Math.max(...allDates));

  return {
    totalProjects: projects.length,
    totalLayers,
    projectsWithCollections,
    projectsWithTemporalSeries,
    oldestCapture,
    newestCapture,
    projects: projects.map((p) => ({
      name: p.projectName,
      layerCount: p.layerCount,
      dateRangeStart: p.dateRangeStart,
      dateRangeEnd: p.dateRangeEnd,
      hasCollections: p.hasImageCollections,
    })),
  };
}
