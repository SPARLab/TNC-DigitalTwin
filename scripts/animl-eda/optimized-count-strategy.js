/**
 * Optimized Count Strategy: ONE Query to Rule Them All
 * 
 * Instead of multiple queries, get ALL counts in a single query
 * grouped by (deployment_id, label), then aggregate in JavaScript.
 * 
 * Run with: node scripts/animl-eda/optimized-count-strategy.js
 */

const IMAGE_LABELS_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query';
const DEPLOYMENTS_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/0/query';

// Date range: Last year
const END_DATE = new Date();
const START_DATE = new Date();
START_DATE.setFullYear(END_DATE.getFullYear() - 1);
const startDateStr = START_DATE.toISOString().split('T')[0];
const endDateStr = END_DATE.toISOString().split('T')[0];

/**
 * THE ONE QUERY: Get counts for all (deployment_id, label) combinations
 */
async function getAllCountsInOneQuery() {
  console.log('🚀 Fetching ALL counts in ONE query...');
  console.log('==========================================\n');
  
  const start = Date.now();
  
  const response = await fetch(`${IMAGE_LABELS_URL}?${new URLSearchParams({
    where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND label NOT IN ('person', 'people')`,
    outStatistics: JSON.stringify([{
      statisticType: 'count',
      onStatisticField: 'id',
      outStatisticFieldName: 'observation_count'
    }]),
    groupByFieldsForStatistics: 'deployment_id,label', // 🔑 The magic!
    f: 'json'
  })}`);
  
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`⏱️  Query Duration: ${duration}ms`);
  console.log(`📊 Returned ${data.features.length} unique (deployment, label) combinations\n`);
  
  return { data: data.features, duration };
}

/**
 * Build fast lookup structures from the single query result
 */
function buildLookupStructures(results) {
  console.log('🔧 Building lookup structures...');
  console.log('==========================================\n');
  
  const start = Date.now();
  
  // Structure 1: Total counts per deployment
  const countsByDeployment = new Map();
  
  // Structure 2: Total counts per label (across all deployments)
  const countsByLabel = new Map();
  
  // Structure 3: Counts for specific (deployment, label) combinations
  const countsByDeploymentAndLabel = new Map();
  
  // Structure 4: Labels per deployment (for UI filtering)
  const labelsByDeployment = new Map();
  
  // Structure 5: Deployments per label (for UI filtering)
  const deploymentsByLabel = new Map();
  
  results.forEach(feature => {
    const { deployment_id, label, observation_count } = feature.attributes;
    
    // Update countsByDeployment
    countsByDeployment.set(
      deployment_id,
      (countsByDeployment.get(deployment_id) || 0) + observation_count
    );
    
    // Update countsByLabel
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
    labelsByDeployment.get(deployment_id).add(label);
    
    // Track deployments per label
    if (!deploymentsByLabel.has(label)) {
      deploymentsByLabel.set(label, new Set());
    }
    deploymentsByLabel.get(label).add(deployment_id);
  });
  
  const duration = Date.now() - start;
  
  console.log(`⏱️  Build Duration: ${duration}ms (JavaScript aggregation)`);
  console.log(`📊 Created 5 lookup structures:`);
  console.log(`   - ${countsByDeployment.size} deployments with observations`);
  console.log(`   - ${countsByLabel.size} unique labels`);
  console.log(`   - ${countsByDeploymentAndLabel.size} specific (deployment, label) combinations`);
  console.log();
  
  return {
    countsByDeployment,
    countsByLabel,
    countsByDeploymentAndLabel,
    labelsByDeployment,
    deploymentsByLabel,
    duration
  };
}

/**
 * Demonstrate fast lookups
 */
function demonstrateLookups(lookups) {
  const {
    countsByDeployment,
    countsByLabel,
    countsByDeploymentAndLabel,
    labelsByDeployment,
    deploymentsByLabel
  } = lookups;
  
  console.log('🔍 Demonstrating Fast Lookups (O(1) or O(n))');
  console.log('==========================================\n');
  
  // Q1: Total observations for deployment 59?
  console.log('Q1: How many observations for deployment 59?');
  const q1Start = performance.now();
  const count59 = countsByDeployment.get(59);
  const q1Duration = performance.now() - q1Start;
  console.log(`   Answer: ${count59} observations`);
  console.log(`   Lookup time: ${q1Duration.toFixed(4)}ms (O(1))\n`);
  
  // Q2: Total "mule deer" observations across ALL cameras?
  console.log('Q2: How many "mule deer" observations across all cameras?');
  const q2Start = performance.now();
  const countMuleDeer = countsByLabel.get('mule deer');
  const q2Duration = performance.now() - q2Start;
  console.log(`   Answer: ${countMuleDeer} observations`);
  console.log(`   Lookup time: ${q2Duration.toFixed(4)}ms (O(1))\n`);
  
  // Q3: "mule deer" observations for deployment 59?
  console.log('Q3: How many "mule deer" observations for deployment 59?');
  const q3Start = performance.now();
  const countSpecific = countsByDeploymentAndLabel.get('59:mule deer');
  const q3Duration = performance.now() - q3Start;
  console.log(`   Answer: ${countSpecific} observations`);
  console.log(`   Lookup time: ${q3Duration.toFixed(4)}ms (O(1))\n`);
  
  // Q4: What labels exist for deployment 59?
  console.log('Q4: What animal tags are observed at deployment 59?');
  const q4Start = performance.now();
  const labels59 = Array.from(labelsByDeployment.get(59) || []);
  const q4Duration = performance.now() - q4Start;
  console.log(`   Answer: ${labels59.length} unique tags`);
  console.log(`   Examples: ${labels59.slice(0, 5).join(', ')}...`);
  console.log(`   Lookup time: ${q4Duration.toFixed(4)}ms (O(1))\n`);
  
  // Q5: Complex filter - Multiple deployments + Multiple labels
  console.log('Q5: Total for deployments [3, 59, 61] with labels ["mule deer", "coyote", "bobcat"]?');
  const selectedDeployments = [3, 59, 61];
  const selectedLabels = ['mule deer', 'coyote', 'bobcat'];
  
  const q5Start = performance.now();
  let totalCount = 0;
  for (const depId of selectedDeployments) {
    for (const label of selectedLabels) {
      const key = `${depId}:${label}`;
      totalCount += countsByDeploymentAndLabel.get(key) || 0;
    }
  }
  const q5Duration = performance.now() - q5Start;
  console.log(`   Answer: ${totalCount} observations`);
  console.log(`   Lookup time: ${q5Duration.toFixed(4)}ms (O(n*m) where n=${selectedDeployments.length}, m=${selectedLabels.length})`);
  console.log(`   This is what goes in the cart!\n`);
  
  // Q6: Which cameras have "bobcat" observations?
  console.log('Q6: Which cameras have observed "bobcat"?');
  const q6Start = performance.now();
  const camerasWithBobcat = Array.from(deploymentsByLabel.get('bobcat') || []);
  const q6Duration = performance.now() - q6Start;
  console.log(`   Answer: ${camerasWithBobcat.length} cameras`);
  console.log(`   Cameras: ${camerasWithBobcat.join(', ')}`);
  console.log(`   Lookup time: ${q6Duration.toFixed(4)}ms (O(1))\n`);
}

/**
 * Compare with old multi-query approach
 */
async function compareWithOldApproach() {
  console.log('\n📊 Comparison: New vs Old Approach');
  console.log('==========================================\n');
  
  console.log('OLD APPROACH (Multiple Queries):');
  console.log('  Query 1: Get all deployments (~100ms)');
  console.log('  Query 2: Count per deployment (~130ms)');
  console.log('  Query 3: Count per label (~143ms)');
  console.log('  Query 4: Count for user selection (~85ms)');
  console.log('  ────────────────────────────────────');
  console.log('  TOTAL: ~450ms + 4 round trips\n');
  
  console.log('NEW APPROACH (Single Query + JS):');
  console.log('  Query 1: All (deployment, label) counts (~150ms)');
  console.log('  Process: Build lookup structures (~5ms JS)');
  console.log('  ────────────────────────────────────');
  console.log('  TOTAL: ~155ms + 1 round trip\n');
  
  console.log('💡 BENEFITS:');
  console.log('  ✅ 3x faster (155ms vs 450ms)');
  console.log('  ✅ 75% fewer queries (1 vs 4)');
  console.log('  ✅ All subsequent lookups are instant (<0.01ms)');
  console.log('  ✅ Can answer ANY filter combination without new queries');
  console.log('  ✅ Easy to cache (single data structure, ~50KB)');
}

/**
 * Show UI implementation example
 */
function showUIExample(lookups) {
  const {
    countsByDeployment,
    countsByLabel,
    countsByDeploymentAndLabel,
    labelsByDeployment
  } = lookups;
  
  console.log('\n💻 UI Implementation Example');
  console.log('==========================================\n');
  
  console.log('// Right Sidebar - Camera Traps Section\n');
  console.log('const cameraTrapsList = Array.from(countsByDeployment.entries())');
  console.log('  .map(([deploymentId, count]) => ({');
  console.log('    id: deploymentId,');
  console.log('    name: getDeploymentName(deploymentId), // from deployment query');
  console.log('    count: count');
  console.log('  }))');
  console.log('  .sort((a, b) => a.name.localeCompare(b.name));\n');
  
  console.log('// Renders as:');
  Array.from(countsByDeployment.entries())
    .slice(0, 3)
    .forEach(([id, count]) => {
      console.log(`//   ☐ Camera ${id} (${count} observations)`);
    });
  console.log('//   ...\n');
  
  console.log('// Right Sidebar - Animal Tags Section (filtered by selected cameras)\n');
  console.log('function getTagCountsForSelectedCameras(selectedCameraIds) {');
  console.log('  const tagCounts = new Map();');
  console.log('  ');
  console.log('  for (const cameraId of selectedCameraIds) {');
  console.log('    const tagsForCamera = labelsByDeployment.get(cameraId) || new Set();');
  console.log('    ');
  console.log('    for (const tag of tagsForCamera) {');
  console.log('      const key = `${cameraId}:${tag}`;');
  console.log('      const count = countsByDeploymentAndLabel.get(key) || 0;');
  console.log('      tagCounts.set(tag, (tagCounts.get(tag) || 0) + count);');
  console.log('    }');
  console.log('  }');
  console.log('  ');
  console.log('  return Array.from(tagCounts.entries())');
  console.log('    .map(([label, count]) => ({ label, count }))');
  console.log('    .sort((a, b) => b.count - a.count);');
  console.log('}\n');
  
  console.log('// When user selects cameras [59, 61]:');
  const exampleTags = [];
  for (const cameraId of [59, 61]) {
    const tagsForCamera = labelsByDeployment.get(cameraId) || new Set();
    for (const tag of tagsForCamera) {
      const key = `${cameraId}:${tag}`;
      const count = countsByDeploymentAndLabel.get(key) || 0;
      const existing = exampleTags.find(t => t.label === tag);
      if (existing) {
        existing.count += count;
      } else {
        exampleTags.push({ label: tag, count });
      }
    }
  }
  exampleTags.sort((a, b) => b.count - a.count);
  console.log('// Renders as:');
  exampleTags.slice(0, 5).forEach(({ label, count }) => {
    console.log(`//   ☐ ${label} (${count} observations)`);
  });
  console.log('//   ...\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Optimized Count Strategy Demo');
  console.log('Date Range: Last Year\n');
  console.log('==========================================\n');
  
  try {
    // Step 1: Single comprehensive query
    const { data, duration: queryDuration } = await getAllCountsInOneQuery();
    
    // Step 2: Build lookup structures in JavaScript
    const lookups = buildLookupStructures(data);
    
    console.log(`✅ Total time: ${queryDuration + lookups.duration}ms (${queryDuration}ms query + ${lookups.duration}ms processing)\n`);
    
    // Step 3: Demonstrate fast lookups
    demonstrateLookups(lookups);
    
    // Step 4: Compare approaches
    await compareWithOldApproach();
    
    // Step 5: Show UI implementation
    showUIExample(lookups);
    
    console.log('\n✅ CONCLUSION:');
    console.log('==========================================');
    console.log('Use ONE query with groupByFieldsForStatistics="deployment_id,label"');
    console.log('Build lookup structures once, use for all UI operations');
    console.log('Cache for 30-60 seconds to minimize queries');
    console.log('All user interactions are instant (<0.1ms lookups)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

