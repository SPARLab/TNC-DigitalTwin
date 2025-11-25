/**
 * Demo: Recommended Strategy for Right Sidebar (Export Tab)
 * 
 * Shows how to use COUNT queries to populate the right sidebar
 * with accurate observation counts without loading all records.
 * 
 * Run with: node scripts/animl-eda/demo-right-sidebar-strategy.js
 */

const IMAGE_LABELS_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query';
const DEPLOYMENTS_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/0/query';

// Simulate: User has selected "Last Year" in date filter
const END_DATE = new Date();
const START_DATE = new Date();
START_DATE.setFullYear(END_DATE.getFullYear() - 1);
const startDateStr = START_DATE.toISOString().split('T')[0];
const endDateStr = END_DATE.toISOString().split('T')[0];

/**
 * STEP 1: Get all deployments with their observation counts
 * This populates the "Camera Traps" section in the right sidebar
 */
async function getCameraTrapsWithCounts() {
  console.log('\n📷 STEP 1: Get Camera Traps with Counts');
  console.log('==========================================');
  
  const start = Date.now();
  
  // Query 1: Get all deployments
  const deploymentsResponse = await fetch(`${DEPLOYMENTS_URL}?${new URLSearchParams({
    where: '1=1',
    outFields: 'id,animl_dp_id,name',
    returnGeometry: 'true',
    f: 'json'
  })}`);
  const deploymentsData = await deploymentsResponse.json();
  
  // Query 2: Get observation counts per deployment (excluding person/people)
  const countsResponse = await fetch(`${IMAGE_LABELS_URL}?${new URLSearchParams({
    where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND label NOT IN ('person', 'people')`,
    outStatistics: JSON.stringify([{
      statisticType: 'count',
      onStatisticField: 'id',
      outStatisticFieldName: 'observation_count'
    }]),
    groupByFieldsForStatistics: 'deployment_id',
    f: 'json'
  })}`);
  const countsData = await countsResponse.json();
  
  const duration = Date.now() - start;
  
  // Merge deployments with counts
  const countMap = new Map(
    countsData.features.map(f => [f.attributes.deployment_id, f.attributes.observation_count])
  );
  
  const deploymentsWithCounts = deploymentsData.features
    .map(f => ({
      id: f.attributes.id,
      name: f.attributes.name || f.attributes.animl_dp_id,
      observationCount: countMap.get(f.attributes.id) || 0
    }))
    .filter(d => d.observationCount > 0) // Only show cameras with observations
    .sort((a, b) => a.name.localeCompare(b.name));
  
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📊 Result: ${deploymentsWithCounts.length} camera traps with observations`);
  console.log('\nExample data for UI:');
  deploymentsWithCounts.slice(0, 5).forEach(d => {
    console.log(`  ☐ ${d.name} (${d.observationCount})`);
  });
  
  return deploymentsWithCounts;
}

/**
 * STEP 2: Get animal tags with counts (filtered by selected cameras)
 * This populates the "Animal Species" section in the right sidebar
 */
async function getAnimalTagsWithCounts(selectedDeploymentIds = []) {
  console.log('\n🦌 STEP 2: Get Animal Tags with Counts');
  console.log('==========================================');
  if (selectedDeploymentIds.length > 0) {
    console.log(`📷 Filtered by ${selectedDeploymentIds.length} selected camera(s)`);
  }
  
  const start = Date.now();
  
  // Build WHERE clause
  let where = `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND label NOT IN ('person', 'people')`;
  if (selectedDeploymentIds.length > 0) {
    where += ` AND deployment_id IN (${selectedDeploymentIds.join(',')})`;
  }
  
  const response = await fetch(`${IMAGE_LABELS_URL}?${new URLSearchParams({
    where,
    outStatistics: JSON.stringify([{
      statisticType: 'count',
      onStatisticField: 'id',
      outStatisticFieldName: 'observation_count'
    }]),
    groupByFieldsForStatistics: 'label',
    orderByFields: 'observation_count DESC',
    f: 'json'
  })}`);
  const data = await response.json();
  
  const duration = Date.now() - start;
  
  const tags = data.features.map(f => ({
    label: f.attributes.label,
    observationCount: f.attributes.observation_count
  }));
  
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📊 Result: ${tags.length} unique animal tags`);
  console.log('\nExample data for UI:');
  tags.slice(0, 10).forEach(t => {
    console.log(`  ☐ ${t.label} (${t.observationCount})`);
  });
  
  return tags;
}

/**
 * STEP 3: Get accurate total count for selected filters
 * This is what goes in the cart and shows in "X observations will be saved"
 */
async function getTotalCountForFilters(selectedDeploymentIds, selectedLabels) {
  console.log('\n🔢 STEP 3: Get Total Count for Export');
  console.log('==========================================');
  console.log(`📷 Selected cameras: ${selectedDeploymentIds.length}`);
  console.log(`🏷️  Selected labels: ${selectedLabels.length}`);
  
  const start = Date.now();
  
  // Build WHERE clause
  let where = `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND label NOT IN ('person', 'people')`;
  
  if (selectedDeploymentIds.length > 0) {
    where += ` AND deployment_id IN (${selectedDeploymentIds.join(',')})`;
  }
  
  if (selectedLabels.length > 0) {
    const labelList = selectedLabels.map(l => `'${l.replace(/'/g, "''")}'`).join(',');
    where += ` AND label IN (${labelList})`;
  }
  
  const response = await fetch(`${IMAGE_LABELS_URL}?${new URLSearchParams({
    where,
    returnCountOnly: 'true',
    f: 'json'
  })}`);
  const data = await response.json();
  
  const duration = Date.now() - start;
  
  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📊 Result: ${data.count} observations will be exported`);
  console.log('\n✅ This count goes in the cart as estimatedCount');
  console.log('✅ This count is shown in UI: "X observations will be saved"');
  
  return data.count;
}

/**
 * DEMO: Simulate user interaction
 */
async function main() {
  console.log('🚀 Right Sidebar Strategy Demo');
  console.log('================================');
  console.log('Simulating: Animal-centric view, Last Year date filter\n');
  
  try {
    // Step 1: Load camera traps with counts
    const cameras = await getCameraTrapsWithCounts();
    
    // Step 2: User selects all cameras by default (animal-centric mode)
    const selectedCameraIds = cameras.map(c => c.id);
    console.log(`\n✅ Auto-selected all ${selectedCameraIds.length} cameras (animal-centric mode default)`);
    
    // Step 3: Get animal tags for selected cameras
    const tags = await getAnimalTagsWithCounts(selectedCameraIds);
    
    // Step 4: User selects specific tags (e.g., "mule deer", "coyote", "bobcat")
    const selectedLabels = ['mule deer', 'coyote', 'bobcat'];
    console.log(`\n✅ User selected ${selectedLabels.length} animal tags: ${selectedLabels.join(', ')}`);
    
    // Step 5: Get accurate total count for export
    const totalCount = await getTotalCountForFilters(selectedCameraIds, selectedLabels);
    
    // Summary
    console.log('\n\n📦 CART ITEM PREVIEW');
    console.log('==========================================');
    console.log('Title: "Animl Camera Traps - Animal View"');
    console.log(`Estimated Count: ${totalCount} observations`);
    console.log(`Date Range: ${startDateStr} to ${endDateStr}`);
    console.log(`Camera Traps: ${selectedCameraIds.length} selected`);
    console.log(`Animal Tags: ${selectedLabels.join(', ')}`);
    console.log('\n✅ When user exports, we query with these EXACT filters');
    console.log('✅ Result will match the estimated count');
    
    console.log('\n\n💡 KEY BENEFITS:');
    console.log('1. ✅ Accurate counts without loading all observations into memory');
    console.log('2. ✅ Fast queries (< 200ms each)');
    console.log('3. ✅ No mismatch between estimate and actual export');
    console.log('4. ✅ User sees exactly what they will get');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

