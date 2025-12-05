/**
 * Test script for droneImageryService
 * 
 * Since we can't import TypeScript directly in Node,
 * this script replicates the service logic to test it.
 * 
 * Usage: node scripts/drone-imagery-eda/test-service.js
 */

const DRONE_IMAGERY_METADATA_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0';

function parseTimestamp(timestampMs) {
  return new Date(parseInt(timestampMs));
}

function recordToMetadata(record) {
  const metadata = {
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

  if (record.collection_item_id && record.collection_link) {
    metadata.imageCollection = {
      link: record.collection_link,
      itemId: record.collection_item_id,
    };
  }

  return metadata;
}

async function fetchDroneImageryMetadata() {
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

  const data = await response.json();
  return data.features.map((feature) => recordToMetadata(feature.attributes));
}

async function fetchDroneImageryByProject() {
  const allImagery = await fetchDroneImageryMetadata();

  const projectMap = new Map();

  for (const imagery of allImagery) {
    if (!projectMap.has(imagery.projectName)) {
      projectMap.set(imagery.projectName, []);
    }
    projectMap.get(imagery.projectName).push(imagery);
  }

  const projects = [];

  for (const [projectName, imageryLayers] of projectMap.entries()) {
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

  projects.sort((a, b) => a.projectName.localeCompare(b.projectName));

  return projects;
}

async function getDroneImagerySummary() {
  const projects = await fetchDroneImageryByProject();

  const totalLayers = projects.reduce((sum, p) => sum + p.layerCount, 0);
  const projectsWithCollections = projects.filter(
    (p) => p.hasImageCollections
  ).length;
  const projectsWithTemporalSeries = projects.filter(
    (p) => p.layerCount > 1
  ).length;

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

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function testService() {
  console.log('🧪 Testing Drone Imagery Service\n');

  try {
    console.log('1️⃣ Fetching all metadata...');
    const allImagery = await fetchDroneImageryMetadata();
    console.log(`   ✅ Fetched ${allImagery.length} imagery layers\n`);

    console.log('2️⃣ Grouping by project...');
    const projects = await fetchDroneImageryByProject();
    console.log(`   ✅ Found ${projects.length} projects\n`);

    console.log('📋 Projects:');
    for (const project of projects) {
      console.log(`\n   ${project.projectName}`);
      console.log(`   - Layers: ${project.layerCount}`);
      console.log(
        `   - Date Range: ${formatDate(project.dateRangeStart)}${
          project.layerCount > 1 ? ` to ${formatDate(project.dateRangeEnd)}` : ''
        }`
      );
      console.log(`   - Has Collections: ${project.hasImageCollections ? 'Yes' : 'No'}`);
      console.log(`   - WMTS IDs:`);
      for (const layer of project.imageryLayers) {
        const collectionBadge = layer.imageCollection ? '📦' : '  ';
        console.log(
          `     ${collectionBadge} ${formatDate(layer.dateCaptured)} - ${layer.wmts.itemId.substring(0, 12)}...`
        );
      }
    }

    console.log('\n\n3️⃣ Getting summary statistics...');
    const summary = await getDroneImagerySummary();
    console.log('   ✅ Summary generated\n');

    console.log('📊 Summary Statistics:');
    console.log(`   - Total Projects: ${summary.totalProjects}`);
    console.log(`   - Total Layers: ${summary.totalLayers}`);
    console.log(`   - Projects with Collections: ${summary.projectsWithCollections}`);
    console.log(`   - Projects with Temporal Series: ${summary.projectsWithTemporalSeries}`);
    console.log(`   - Oldest Capture: ${formatDate(summary.oldestCapture)}`);
    console.log(`   - Newest Capture: ${formatDate(summary.newestCapture)}`);

    console.log('\n\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testService().catch(console.error);
