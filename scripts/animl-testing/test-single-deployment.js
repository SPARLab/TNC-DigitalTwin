/**
 * Test ANiML Queries for a Single Deployment
 * 
 * Usage: node scripts/animl-testing/test-single-deployment.js [deploymentId] [startDate] [endDate]
 * Example: node scripts/animl-testing/test-single-deployment.js 59 "2024-01-01" "2025-01-01"
 */

const BASE_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer';
const IMAGE_LABELS_LAYER = 1;

// Parse command line arguments
const args = process.argv.slice(2);
const DEPLOYMENT_ID = args[0] || 59;
const START_DATE = args[1] || '2024-01-01';
const END_DATE = args[2] || '2025-01-01';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  ANiML Query Test: Single Deployment                     ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Deployment ID: ${DEPLOYMENT_ID}`);
console.log(`Date Range: ${START_DATE} to ${END_DATE}`);
console.log('');

// Build WHERE clause
function buildWhereClause(deploymentId, label = null) {
  const startDateStr = new Date(START_DATE + 'T00:00:00Z').toISOString().replace('T', ' ').substring(0, 19);
  const endDateStr = new Date(END_DATE + 'T23:59:59Z').toISOString().replace('T', ' ').substring(0, 19);
  
  let where = `deployment_id = ${deploymentId}`;
  where += ` AND timestamp >= DATE '${startDateStr}' AND timestamp <= DATE '${endDateStr}'`;
  where += ` AND label NOT IN ('person', 'people')`;
  
  if (label) {
    where += ` AND label = '${label.replace(/'/g, "''")}'`;
  }
  
  return where;
}

/**
 * Query 1: Get total unique images
 */
async function query1_TotalUniqueImages() {
  console.log('┌───────────────────────────────────────────────────────────┐');
  console.log('│ Query 1: Total Unique Images                              │');
  console.log('└───────────────────────────────────────────────────────────┘');
  
  const whereClause = buildWhereClause(DEPLOYMENT_ID);
  
  const params = {
    where: whereClause,
    outStatistics: JSON.stringify([{
      statisticType: 'count',
      onStatisticField: 'id',
      outStatisticFieldName: 'count'
    }]),
    groupByFieldsForStatistics: 'deployment_id,animl_image_id',
    f: 'json'
  };
  
  const queryUrl = `${BASE_URL}/${IMAGE_LABELS_LAYER}/query`;
  const fullUrl = `${queryUrl}?${new URLSearchParams(params)}`;
  
  console.log('📤 Request URL:');
  console.log(fullUrl.substring(0, 100) + '...');
  console.log('');
  
  const start = Date.now();
  const response = await fetch(fullUrl);
  const duration = Date.now() - start;
  const data = await response.json();
  
  if (data.error) {
    console.error('❌ Error:', data.error);
    return { count: 0, duration, error: data.error };
  }
  
  const count = data.features?.length || 0;
  
  console.log(`📥 Response: ${count} unique images`);
  console.log(`⏱️  Time: ${duration}ms`);
  console.log('');
  
  return { count, duration, data };
}

/**
 * Query 2: Get distinct species
 */
async function query2_DistinctSpecies() {
  console.log('┌───────────────────────────────────────────────────────────┐');
  console.log('│ Query 2: Distinct Species                                 │');
  console.log('└───────────────────────────────────────────────────────────┘');
  
  const whereClause = buildWhereClause(DEPLOYMENT_ID);
  
  const params = {
    where: whereClause,
    outFields: 'label',
    returnDistinctValues: true,
    returnGeometry: false,
    f: 'json'
  };
  
  const queryUrl = `${BASE_URL}/${IMAGE_LABELS_LAYER}/query`;
  const fullUrl = `${queryUrl}?${new URLSearchParams(params)}`;
  
  const start = Date.now();
  const response = await fetch(fullUrl);
  const duration = Date.now() - start;
  const data = await response.json();
  
  if (data.error) {
    console.error('❌ Error:', data.error);
    return { species: [], duration, error: data.error };
  }
  
  const species = (data.features || [])
    .map(f => f.attributes?.label)
    .filter(label => label != null);
  
  console.log(`📥 Response: ${species.length} species`);
  console.log(`📊 Species: ${species.slice(0, 5).join(', ')}${species.length > 5 ? `, ...` : ''}`);
  console.log(`⏱️  Time: ${duration}ms`);
  console.log('');
  
  return { species, duration, data };
}

/**
 * Query 3: Get unique images for each species
 */
async function query3_PerSpeciesCounts(species) {
  console.log('┌───────────────────────────────────────────────────────────┐');
  console.log('│ Query 3: Per-Species Counts                               │');
  console.log('└───────────────────────────────────────────────────────────┘');
  
  const results = [];
  
  for (const label of species) {
    const whereClause = buildWhereClause(DEPLOYMENT_ID, label);
    
    const params = {
      where: whereClause,
      outStatistics: JSON.stringify([{
        statisticType: 'count',
        onStatisticField: 'id',
        outStatisticFieldName: 'count'
      }]),
      groupByFieldsForStatistics: 'deployment_id,animl_image_id',
      f: 'json'
    };
    
    const queryUrl = `${BASE_URL}/${IMAGE_LABELS_LAYER}/query`;
    const fullUrl = `${queryUrl}?${new URLSearchParams(params)}`;
    
    const start = Date.now();
    const response = await fetch(fullUrl);
    const duration = Date.now() - start;
    const data = await response.json();
    
    if (data.error) {
      console.error(`❌ ${label}: Error - ${data.error.message}`);
      results.push({ label, count: 0, duration, error: data.error });
      continue;
    }
    
    const count = data.features?.length || 0;
    console.log(`  ${label.padEnd(25)} ${String(count).padStart(5)} images (${duration}ms)`);
    
    results.push({ label, count, duration });
  }
  
  console.log('');
  return results;
}

/**
 * Verification & Analysis
 */
function analyzeResults(totalCount, species, perSpeciesResults) {
  console.log('┌───────────────────────────────────────────────────────────┐');
  console.log('│ Verification & Analysis                                    │');
  console.log('└───────────────────────────────────────────────────────────┘');
  
  const sumOfSpeciesCounts = perSpeciesResults.reduce((sum, r) => sum + r.count, 0);
  
  console.log(`Total unique images: ${totalCount}`);
  console.log(`Number of species: ${species.length}`);
  console.log(`Sum of per-species counts: ${sumOfSpeciesCounts}`);
  console.log('');
  
  if (sumOfSpeciesCounts > totalCount) {
    console.log('✅ Sum > Total (expected - images can have multiple labels)');
    const avgLabelsPerImage = (sumOfSpeciesCounts / totalCount).toFixed(2);
    console.log(`   Average ${avgLabelsPerImage} labels per image`);
  } else if (sumOfSpeciesCounts === totalCount) {
    console.log('✅ Sum = Total (each image has exactly 1 label)');
  } else {
    console.log('⚠️  Sum < Total (unexpected - possible data issue?)');
  }
  
  console.log('');
  
  // Timing analysis
  const totalTime = perSpeciesResults.reduce((sum, r) => sum + r.duration, 0);
  const avgTimePerSpecies = (totalTime / perSpeciesResults.length).toFixed(0);
  const slowest = perSpeciesResults.reduce((max, r) => r.duration > max.duration ? r : max, perSpeciesResults[0]);
  const fastest = perSpeciesResults.reduce((min, r) => r.duration < min.duration ? r : min, perSpeciesResults[0]);
  
  console.log('Performance:');
  console.log(`  Total time for Query 3: ${totalTime}ms`);
  console.log(`  Average per species: ${avgTimePerSpecies}ms`);
  console.log(`  Slowest: ${slowest.label} (${slowest.duration}ms, ${slowest.count} images)`);
  console.log(`  Fastest: ${fastest.label} (${fastest.duration}ms, ${fastest.count} images)`);
  console.log('');
  
  // Top species by count
  const topSpecies = [...perSpeciesResults]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  console.log('Top 5 species by image count:');
  topSpecies.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.label}: ${r.count} images`);
  });
  console.log('');
}

/**
 * Main test function
 */
async function runTest() {
  const overallStart = Date.now();
  
  try {
    // Query 1
    const result1 = await query1_TotalUniqueImages();
    if (result1.error || result1.count === 0) {
      console.log('⚠️  No data found or error occurred. Check:');
      console.log('   - Does this deployment exist?');
      console.log('   - Is there data in this date range?');
      console.log('   - Try a wider date range');
      return;
    }
    
    // Query 2
    const result2 = await query2_DistinctSpecies();
    if (result2.error || result2.species.length === 0) {
      console.log('⚠️  No species found. This might be okay if there are only empty/blank images.');
      return;
    }
    
    // Query 3
    const result3 = await query3_PerSpeciesCounts(result2.species);
    
    // Analysis
    analyzeResults(result1.count, result2.species, result3);
    
    const overallDuration = Date.now() - overallStart;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ All queries completed successfully`);
    console.log(`   Total wall time: ${(overallDuration / 1000).toFixed(2)}s`);
    console.log(`   Query 1: ${result1.duration}ms`);
    console.log(`   Query 2: ${result2.duration}ms`);
    console.log(`   Query 3: ${result3.reduce((sum, r) => sum + r.duration, 0)}ms (${result3.length} queries)`);
    console.log('');
    console.log('💡 If these queries are fast enough, integration should work well!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest();

