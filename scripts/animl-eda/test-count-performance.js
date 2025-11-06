/**
 * Animl Count Query Performance Testing
 * 
 * Tests the performance of different count queries to understand:
 * 1. How fast can we get counts for all camera traps?
 * 2. How fast can we get counts for all animal tags/species?
 * 3. How fast can we get counts for specific filters?
 * 
 * Run with: node scripts/animl-eda/test-count-performance.js
 */

const DEPLOYMENTS_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/0/query';
const IMAGE_LABELS_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query';

// Date range: Last year
const END_DATE = new Date();
const START_DATE = new Date();
START_DATE.setFullYear(END_DATE.getFullYear() - 1);

const startDateStr = START_DATE.toISOString().split('T')[0];
const endDateStr = END_DATE.toISOString().split('T')[0];

async function timeQuery(name, url, params) {
  const fullUrl = `${url}?${new URLSearchParams(params)}`;
  
  console.log(`\n🔍 ${name}`);
  console.log(`   URL: ${fullUrl.substring(0, 120)}...`);
  
  const start = Date.now();
  const response = await fetch(fullUrl);
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`   ⏱️  Duration: ${duration}ms`);
  
  return { name, duration, data };
}

async function test1_TotalObservationsCount() {
  return await timeQuery(
    'TEST 1: Total observations count (last year)',
    IMAGE_LABELS_URL,
    {
      where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59'`,
      returnCountOnly: 'true',
      f: 'json'
    }
  );
}

async function test2_CountPerDeployment() {
  // Get all unique deployment IDs with observation counts
  return await timeQuery(
    'TEST 2: Observation count per deployment (grouped)',
    IMAGE_LABELS_URL,
    {
      where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59'`,
      outStatistics: JSON.stringify([{
        statisticType: 'count',
        onStatisticField: 'id',
        outStatisticFieldName: 'observation_count'
      }]),
      groupByFieldsForStatistics: 'deployment_id',
      f: 'json'
    }
  );
}

async function test3_CountPerLabel() {
  // Get all unique labels with observation counts
  return await timeQuery(
    'TEST 3: Observation count per animal tag/label (grouped)',
    IMAGE_LABELS_URL,
    {
      where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59'`,
      outStatistics: JSON.stringify([{
        statisticType: 'count',
        onStatisticField: 'id',
        outStatisticFieldName: 'observation_count'
      }]),
      groupByFieldsForStatistics: 'label',
      orderByFields: 'observation_count DESC',
      f: 'json'
    }
  );
}

async function test4_SpecificDeploymentCount() {
  // Count for a specific deployment (e.g., deployment 59)
  return await timeQuery(
    'TEST 4: Count for specific deployment (deployment 59)',
    IMAGE_LABELS_URL,
    {
      where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND deployment_id = 59`,
      returnCountOnly: 'true',
      f: 'json'
    }
  );
}

async function test5_SpecificLabelCount() {
  // Count for a specific label (e.g., "mule deer")
  return await timeQuery(
    'TEST 5: Count for specific animal tag ("mule deer")',
    IMAGE_LABELS_URL,
    {
      where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND label = 'mule deer'`,
      returnCountOnly: 'true',
      f: 'json'
    }
  );
}

async function test6_DeploymentsWithCounts() {
  // Get deployment info AND their observation counts in one query
  // This is a bit tricky - we'll do it in two steps and measure total time
  const start = Date.now();
  
  // Step 1: Get deployments
  const deploymentsResponse = await fetch(`${DEPLOYMENTS_URL}?${new URLSearchParams({
    where: '1=1',
    outFields: 'id,animl_dp_id,name',
    returnGeometry: 'false',
    f: 'json'
  })}`);
  const deployments = await deploymentsResponse.json();
  
  // Step 2: Get counts per deployment
  const countsResponse = await fetch(`${IMAGE_LABELS_URL}?${new URLSearchParams({
    where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59'`,
    outStatistics: JSON.stringify([{
      statisticType: 'count',
      onStatisticField: 'id',
      outStatisticFieldName: 'observation_count'
    }]),
    groupByFieldsForStatistics: 'deployment_id',
    f: 'json'
  })}`);
  const counts = await countsResponse.json();
  
  const duration = Date.now() - start;
  
  console.log(`\n🔍 TEST 6: Get all deployments WITH observation counts`);
  console.log(`   ⏱️  Duration: ${duration}ms (2 queries)`);
  console.log(`   📊 Deployments: ${deployments.features?.length || 0}`);
  console.log(`   📊 Deployments with observations: ${counts.features?.length || 0}`);
  
  return { 
    name: 'TEST 6: Deployments + Counts', 
    duration, 
    data: { deployments, counts } 
  };
}

async function test7_CountExcludingPersonPeople() {
  // Count excluding "person" and "people" tags (what we show in UI)
  return await timeQuery(
    'TEST 7: Count excluding person/people tags',
    IMAGE_LABELS_URL,
    {
      where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59' AND label NOT IN ('person', 'people')`,
      returnCountOnly: 'true',
      f: 'json'
    }
  );
}

async function test8_UniqueImagesCount() {
  // Count UNIQUE images (not rows) - this requires fetching and deduping
  const start = Date.now();
  
  const response = await fetch(`${IMAGE_LABELS_URL}?${new URLSearchParams({
    where: `timestamp >= DATE '${startDateStr} 00:00:00' AND timestamp <= DATE '${endDateStr} 23:59:59'`,
    outFields: 'animl_image_id',
    returnGeometry: 'false',
    returnDistinctValues: 'true',
    f: 'json'
  })}`);
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`\n🔍 TEST 8: Count unique images (returnDistinctValues)`);
  console.log(`   ⏱️  Duration: ${duration}ms`);
  console.log(`   📊 Unique images: ${data.features?.length || 0}`);
  
  return { 
    name: 'TEST 8: Unique Images Count', 
    duration, 
    data 
  };
}

async function main() {
  console.log('🚀 Animl Count Query Performance Testing');
  console.log('=========================================');
  console.log(`📅 Date Range: ${startDateStr} to ${endDateStr}`);
  console.log('=========================================\n');
  
  const results = [];
  
  try {
    // Run all tests
    results.push(await test1_TotalObservationsCount());
    results.push(await test2_CountPerDeployment());
    results.push(await test3_CountPerLabel());
    results.push(await test4_SpecificDeploymentCount());
    results.push(await test5_SpecificLabelCount());
    results.push(await test6_DeploymentsWithCounts());
    results.push(await test7_CountExcludingPersonPeople());
    results.push(await test8_UniqueImagesCount());
    
    // Summary
    console.log('\n\n=========================================');
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('=========================================');
    results.forEach(r => {
      console.log(`${r.name.padEnd(50)} ${r.duration}ms`);
    });
    
    console.log('\n💡 KEY INSIGHTS:');
    console.log('1. Count queries are typically MUCH faster than fetching full records');
    console.log('2. Grouped statistics (groupByFieldsForStatistics) allow us to get counts per deployment/label in one query');
    console.log('3. For the right sidebar, we should:');
    console.log('   - Use count queries to show accurate numbers');
    console.log('   - Cache counts for a short period (30s-1min)');
    console.log('   - Only load actual observation records for the left sidebar (paginated)');
    console.log('\n4. For cart exports:');
    console.log('   - Get accurate count BEFORE adding to cart');
    console.log('   - Store the exact filters (deployment IDs, labels, date range)');
    console.log('   - Re-run count query when exporting to warn if data changed');
    
    // Analyze Test 2 results (counts per deployment)
    const test2 = results.find(r => r.name.includes('TEST 2'));
    if (test2 && test2.data.features) {
      console.log(`\n📊 DEPLOYMENT COUNTS (${test2.data.features.length} deployments):`);
      test2.data.features
        .sort((a, b) => b.attributes.observation_count - a.attributes.observation_count)
        .slice(0, 10)
        .forEach(f => {
          console.log(`   Deployment ${f.attributes.deployment_id}: ${f.attributes.observation_count} observations`);
        });
    }
    
    // Analyze Test 3 results (counts per label)
    const test3 = results.find(r => r.name.includes('TEST 3'));
    if (test3 && test3.data.features) {
      console.log(`\n📊 ANIMAL TAG COUNTS (${test3.data.features.length} unique tags):`);
      test3.data.features
        .slice(0, 15)
        .forEach(f => {
          console.log(`   "${f.attributes.label}": ${f.attributes.observation_count} observations`);
        });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

