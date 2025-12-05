/**
 * Quick exploration script for DroneDeploy imagery metadata
 * 
 * Usage: node scripts/drone-imagery-eda/explore-metadata.js
 */

const METADATA_SERVICE_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DroneDeploy_Metadata/FeatureServer/0';

/**
 * Query all drone imagery metadata records
 */
async function queryAllRecords() {
  const url = `${METADATA_SERVICE_URL}/query?where=1=1&outFields=*&returnGeometry=false&f=json`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error querying service:', data.error);
      return null;
    }
    
    return data.features.map(f => f.attributes);
  } catch (error) {
    console.error('❌ Failed to fetch data:', error);
    return null;
  }
}

/**
 * Convert Unix timestamp (ms) to readable date
 */
function formatDate(timestampMs) {
  try {
    const date = new Date(parseInt(timestampMs));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return 'Unknown';
  }
}

/**
 * Group records by project
 */
function groupByProject(records) {
  const projects = {};
  
  for (const record of records) {
    const projName = record.project_name;
    if (!projects[projName]) {
      projects[projName] = [];
    }
    projects[projName].push(record);
  }
  
  return projects;
}

/**
 * Main exploration function
 */
async function explore() {
  console.log('🚁 DroneDeploy Imagery Metadata Explorer\n');
  console.log(`Querying: ${METADATA_SERVICE_URL}\n`);
  
  const records = await queryAllRecords();
  
  if (!records || records.length === 0) {
    console.log('No records found.');
    return;
  }
  
  console.log(`✅ Found ${records.length} imagery layers\n`);
  
  // Group by project
  const projects = groupByProject(records);
  const projectNames = Object.keys(projects).sort();
  
  console.log('📊 Summary by Project:\n');
  for (const projName of projectNames) {
    const layers = projects[projName];
    const dates = layers.map(l => formatDate(l.date_captured)).sort();
    const hasCollections = layers.some(l => l.collection_item_id);
    
    console.log(`  ${projName}`);
    console.log(`    - Layers: ${layers.length}`);
    console.log(`    - Dates: ${dates[0]}${dates.length > 1 ? ` to ${dates[dates.length - 1]}` : ''}`);
    console.log(`    - Has Collections: ${hasCollections ? 'Yes' : 'No'}`);
    console.log('');
  }
  
  // Show detailed view
  console.log('\n📋 Detailed Records:\n');
  for (const projName of projectNames) {
    const layers = projects[projName];
    console.log(`${projName}:`);
    
    for (const layer of layers.sort((a, b) => a.date_captured - b.date_captured)) {
      const date = formatDate(layer.date_captured);
      const hasCollection = layer.collection_item_id ? '📦' : '  ';
      console.log(`  ${hasCollection} ${layer.plan_name} - ${date}`);
      console.log(`     WMTS: ${layer.wmts_item_id}`);
      if (layer.collection_item_id) {
        console.log(`     Collection: ${layer.collection_item_id}`);
      }
    }
    console.log('');
  }
  
  // Show metadata fields
  console.log('\n🔍 Available Metadata Fields:\n');
  if (records[0]) {
    const fields = Object.keys(records[0]);
    for (const field of fields) {
      const sampleValue = records[0][field];
      const valueType = typeof sampleValue;
      console.log(`  - ${field} (${valueType})`);
    }
  }
  
  // Show temporal coverage
  console.log('\n📅 Temporal Coverage:\n');
  const allDates = records.map(r => parseInt(r.date_captured)).sort((a, b) => a - b);
  const oldest = formatDate(allDates[0]);
  const newest = formatDate(allDates[allDates.length - 1]);
  console.log(`  Oldest: ${oldest}`);
  console.log(`  Newest: ${newest}`);
  
  // Count projects with temporal series
  const projectsWithMultipleDates = projectNames.filter(p => projects[p].length > 1);
  console.log(`\n  Projects with multiple dates (temporal series): ${projectsWithMultipleDates.length}`);
  for (const projName of projectsWithMultipleDates) {
    console.log(`    - ${projName} (${projects[projName].length} layers)`);
  }
}

// Run the exploration
explore().catch(console.error);
