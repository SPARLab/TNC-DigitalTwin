#!/usr/bin/env node

/**
 * Comprehensive ANiML Query Benchmark
 * 
 * Tests all 4 query types and shows performance improvements with deduplicated service
 * 
 * Usage:
 *   node scripts/animl-testing/test-all-queries-benchmark.js [deploymentId] [startDate] [endDate]
 * 
 * Example:
 *   node scripts/animl-testing/test-all-queries-benchmark.js 59 "2024-01-01" "2025-01-01"
 */

const DEDUPLICATED_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0';
const FLATTENED_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1';

// Parse command line arguments
const deploymentId = process.argv[2] || '59';
const startDate = process.argv[3] || '2024-01-01';
const endDate = process.argv[4] || '2025-01-01';

console.log(`\n🧪 ANiML Query Performance Benchmark`);
console.log(`═══════════════════════════════════════════════════════════\n`);
console.log(`Deployment: ${deploymentId}`);
console.log(`Date Range: ${startDate} to ${endDate}`);
console.log(`\n`);

async function benchmark(name, url) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = JSON.stringify(data);
    const responseSize = responseText.length;
    
    return {
      success: true,
      elapsed,
      responseSize,
      data
    };
  } catch (error) {
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    return {
      success: false,
      elapsed,
      error: error.message
    };
  }
}

async function runAllTests() {
  const results = {
    query0: null,
    query1: null,
    query2: null,
    query3: null
  };
  
  // ============================================================
  // Query 0: Total Unique Images (All Deployments)
  // ============================================================
  console.log(`📊 Query 0: Total Unique Images (All Deployments)`);
  console.log(`─────────────────────────────────────────────────────────`);
  console.log(`Service: ✨ Deduplicated`);
  console.log(`Method: returnCountOnly=true (no filters)\n`);
  
  const query0Url = `${DEDUPLICATED_BASE}/query?where=1%3D1&returnCountOnly=true&f=json`;
  results.query0 = await benchmark('Query 0', query0Url);
  
  if (results.query0 && results.query0.success) {
    const count = results.query0.data?.count || 0;
    console.log(`✅ Result: ${count.toLocaleString()} total unique images`);
    console.log(`⏱️  Time: ${results.query0.elapsed}ms`);
    console.log(`📦 Size: ${results.query0.responseSize} bytes`);
  } else {
    console.log(`❌ Error: ${results.query0?.error || 'Unknown error'}`);
    if (results.query0?.data) {
      console.log(`Response data: ${JSON.stringify(results.query0.data, null, 2)}`);
    }
  }
  
  console.log(`\n`);
  
  // ============================================================
  // Query 1: Unique Images for Specific Deployment
  // ============================================================
  console.log(`📊 Query 1: Unique Images for Deployment ${deploymentId}`);
  console.log(`─────────────────────────────────────────────────────────`);
  console.log(`Service: ✨ Deduplicated`);
  console.log(`Method: returnCountOnly=true with WHERE clause\n`);
  
  const query1Url = `${DEDUPLICATED_BASE}/query?where=deployment_id%20%3D%20${deploymentId}%20AND%20timestamp_%20%3E%3D%20DATE%20%27${startDate}%27%20AND%20timestamp_%20%3C%3D%20DATE%20%27${endDate}%27&returnCountOnly=true&f=json`;
  results.query1 = await benchmark('Query 1', query1Url);
  
  if (results.query1.success) {
    const count = results.query1.data.count;
    console.log(`✅ Result: ${count.toLocaleString()} unique images`);
    console.log(`⏱️  Time: ${results.query1.elapsed}ms`);
    console.log(`📦 Size: ${results.query1.responseSize} bytes`);
  } else {
    console.log(`❌ Error: ${results.query1.error}`);
  }
  
  console.log(`\n`);
  
  // ============================================================
  // Query 2: Distinct Species Labels
  // ============================================================
  console.log(`📊 Query 2: Distinct Species Labels`);
  console.log(`─────────────────────────────────────────────────────────`);
  console.log(`Service: 📋 Flattened`);
  console.log(`Method: returnDistinctValues on label field\n`);
  
  const query2Url = `${FLATTENED_BASE}/query?where=deployment_id%20%3D%20${deploymentId}%20AND%20timestamp%20%3E%3D%20DATE%20%27${startDate}%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%27${endDate}%2023%3A59%3A59%27%20AND%20label%20NOT%20IN%20%28%27person%27%2C%20%27people%27%29&outFields=label&returnDistinctValues=true&returnGeometry=false&f=json`;
  results.query2 = await benchmark('Query 2', query2Url);
  
  if (results.query2.success) {
    const features = results.query2.data.features || [];
    const labels = features.map(f => f.attributes.label);
    console.log(`✅ Result: ${labels.length} distinct species`);
    console.log(`   Species: ${labels.slice(0, 5).join(', ')}${labels.length > 5 ? `, ...` : ''}`);
    console.log(`⏱️  Time: ${results.query2.elapsed}ms`);
    console.log(`📦 Size: ${results.query2.responseSize} bytes`);
  } else {
    console.log(`❌ Error: ${results.query2.error}`);
  }
  
  console.log(`\n`);
  
  // ============================================================
  // Query 3: Unique Images for Specific Species
  // ============================================================
  console.log(`📊 Query 3: Unique Images for Specific Species`);
  console.log(`─────────────────────────────────────────────────────────`);
  console.log(`Service: 📋 Flattened`);
  console.log(`Method: GROUP BY with label filter\n`);
  
  // First get a label to test with
  let testLabel = 'mule deer';
  if (results.query2.success && results.query2.data.features.length > 0) {
    // Use the first non-empty label
    const labels = results.query2.data.features
      .map(f => f.attributes.label)
      .filter(l => l && l !== 'empty');
    testLabel = labels[0] || 'mule deer';
  }
  
  console.log(`Testing with label: "${testLabel}"\n`);
  
  const query3Url = `${FLATTENED_BASE}/query?where=deployment_id%20%3D%20${deploymentId}%20AND%20label%20%3D%20%27${encodeURIComponent(testLabel)}%27%20AND%20timestamp%20%3E%3D%20DATE%20%27${startDate}%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%27${endDate}%2023%3A59%3A59%27&outStatistics=%5B%7B%22statisticType%22%3A%22count%22%2C%22onStatisticField%22%3A%22id%22%2C%22outStatisticFieldName%22%3A%22count%22%7D%5D&groupByFieldsForStatistics=deployment_id%2Caniml_image_id&f=json`;
  results.query3 = await benchmark('Query 3', query3Url);
  
  if (results.query3.success) {
    const count = results.query3.data.features?.length || 0;
    console.log(`✅ Result: ${count.toLocaleString()} unique images with "${testLabel}" label`);
    console.log(`⏱️  Time: ${results.query3.elapsed}ms`);
    console.log(`📦 Size: ${results.query3.responseSize.toLocaleString()} bytes`);
  } else {
    console.log(`❌ Error: ${results.query3.error}`);
  }
  
  console.log(`\n`);
  
  // ============================================================
  // Performance Summary
  // ============================================================
  console.log(`\n🎯 PERFORMANCE SUMMARY`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
  
  const totalTime = [results.query0, results.query1, results.query2, results.query3]
    .filter(r => r && r.success)
    .reduce((sum, r) => sum + r.elapsed, 0);
  
  const totalSize = [results.query0, results.query1, results.query2, results.query3]
    .filter(r => r && r.success)
    .reduce((sum, r) => sum + r.responseSize, 0);
  
  console.log(`Query Type                    | Time    | Size        | Service`);
  console.log(`------------------------------|---------|-------------|--------------`);
  
  if (results.query0?.success) {
    console.log(`0. Total Images (All)         | ${String(results.query0.elapsed).padStart(4)}ms  | ${String(results.query0.responseSize).padStart(7)} B   | ✨ Deduplicated`);
  }
  
  if (results.query1?.success) {
    console.log(`1. Deployment ${deploymentId} Count      | ${String(results.query1.elapsed).padStart(4)}ms  | ${String(results.query1.responseSize).padStart(7)} B   | ✨ Deduplicated`);
  }
  
  if (results.query2?.success) {
    console.log(`2. Distinct Species           | ${String(results.query2.elapsed).padStart(4)}ms  | ${String(results.query2.responseSize).padStart(7)} B   | 📋 Flattened`);
  }
  
  if (results.query3?.success) {
    console.log(`3. Species-Specific Count     | ${String(results.query3.elapsed).padStart(4)}ms  | ${String(results.query3.responseSize).padStart(7)} B   | 📋 Flattened`);
  }
  
  console.log(`------------------------------|---------|-------------|--------------`);
  console.log(`TOTAL                         | ${String(totalTime).padStart(4)}ms  | ${String(totalSize).padStart(7)} B   |`);
  
  console.log(`\n`);
  
  // ============================================================
  // Analysis
  // ============================================================
  console.log(`📈 ANALYSIS`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
  
  if (results.query1.success && results.query3.success) {
    const deduplicatedSpeed = results.query1.elapsed;
    const deduplicatedSize = results.query1.responseSize;
    const groupBySpeed = results.query3.elapsed;
    const groupBySize = results.query3.responseSize;
    
    const speedImprovement = ((groupBySpeed - deduplicatedSpeed) / groupBySpeed * 100).toFixed(1);
    const sizeImprovement = ((groupBySize - deduplicatedSize) / groupBySize * 100).toFixed(1);
    
    console.log(`✨ Deduplicated Service Benefits:`);
    console.log(`   Speed: ${deduplicatedSpeed}ms vs ${groupBySpeed}ms (${speedImprovement}% faster)`);
    console.log(`   Size: ${deduplicatedSize}B vs ${groupBySize.toLocaleString()}B (${sizeImprovement}% smaller)`);
    console.log(`\n`);
  }
  
  if (results.query0?.success && results.query1?.success) {
    console.log(`🎯 Key Findings:`);
    console.log(`   • Total images in database: ${(results.query0.data?.count || 0).toLocaleString()}`);
    console.log(`   • Images for deployment ${deploymentId}: ${(results.query1.data?.count || 0).toLocaleString()}`);
    if (results.query2?.success) {
      console.log(`   • Distinct species observed: ${results.query2.data?.features?.length || 0}`);
    }
    console.log(`   • All queries complete in: ${totalTime}ms`);
    console.log(`   • Total data transferred: ${(totalSize / 1024).toFixed(2)} KB`);
  }
  
  console.log(`\n`);
  
  // ============================================================
  // Recommendations
  // ============================================================
  console.log(`💡 RECOMMENDATIONS`);
  console.log(`═══════════════════════════════════════════════════════════\n`);
  
  if (results.query1.success) {
    if (results.query1.elapsed < 100) {
      console.log(`✅ Query 1 is VERY FAST (${results.query1.elapsed}ms) - Perfect for real-time UI!`);
    } else if (results.query1.elapsed < 300) {
      console.log(`✅ Query 1 is FAST (${results.query1.elapsed}ms) - Good for UI updates`);
    } else {
      console.log(`⚠️  Query 1 is SLOW (${results.query1.elapsed}ms) - May need optimization`);
    }
  }
  
  if (results.query3.success) {
    if (results.query3.responseSize > 50000) {
      console.log(`⚠️  Query 3 returns large responses (${(results.query3.responseSize / 1024).toFixed(1)}KB)`);
      console.log(`   Consider caching or limiting the number of species queries`);
    }
  }
  
  console.log(`\n✨ Use deduplicated service for all total counts`);
  console.log(`📋 Use flattened service only for per-label filtering\n`);
  
  console.log(`═══════════════════════════════════════════════════════════\n`);
}

// Run all tests
runAllTests().catch(error => {
  console.error(`\n❌ Fatal Error: ${error.message}\n`);
  process.exit(1);
});

