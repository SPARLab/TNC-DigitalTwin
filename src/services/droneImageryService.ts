import type {
  DroneImageryRecord,
  DroneImageryMetadata,
  DroneImageryProject,
  DroneImageryQueryResponse,
} from '../types/droneImagery';

// Re-export types for consumers
export type { DroneImageryMetadata, DroneImageryProject };

const DRONE_IMAGERY_METADATA_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0';

/**
 * Parse Unix timestamp (milliseconds) to Date object
 */
function parseTimestamp(timestampMs: string): Date {
  return new Date(parseInt(timestampMs));
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
 * Fetch drone imagery metadata grouped by project
 */
export async function fetchDroneImageryByProject(): Promise<DroneImageryProject[]> {
  const allImagery = await fetchDroneImageryMetadata();

  // Group by project name
  const projectMap = new Map<string, DroneImageryMetadata[]>();

  for (const imagery of allImagery) {
    if (!projectMap.has(imagery.projectName)) {
      projectMap.set(imagery.projectName, []);
    }
    projectMap.get(imagery.projectName)!.push(imagery);
  }

  // Convert to project objects with metadata
  const projects: DroneImageryProject[] = [];

  for (const [projectName, imageryLayers] of projectMap.entries()) {
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

    projects.push({
      projectName,
      imageryLayers,
      dateRangeStart,
      dateRangeEnd,
      layerCount: imageryLayers.length,
      hasImageCollections,
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
