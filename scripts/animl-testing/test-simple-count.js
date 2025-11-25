#!/usr/bin/env node

/**
 * Test Simple Row Count Query (Query Type 0)
 * 
 * Tests whether returnCountOnly=true returns a simple count
 * 
 * ⚠️ WARNING: This count includes DUPLICATES (one row per label)
 *             This is NOT the unique image count!
 * 
 * Usage:
 *   node scripts/animl-testing/test-simple-count.js <deploymentId> <startDate> <endDate>
 * 
 * Example:
 *   node scripts/animl-testing/test-simple-count.js 59 "2024-01-01" "2025-01-01"
 */

const BASE_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1';

// Parse command line arguments
const deploymentId = process.argv[2] || '59';
const startDate = process.argv[3] || '2024-01-01';
const endDate = process.argv[4] || '2025-01-01';

console.log(`\n🧪 Testing Simple Row Count Query (Query Type 0)`);
console.log(`================================================\n`);
console.log(`Deployment: ${deploymentId}`);
console.log(`Date Range: ${startDate} to ${endDate}`);
console.log(`\n⚠️  WARNING: This query counts ALL rows (includes duplicates)\n`);

async function testSimpleCount() {
  const startTime = Date.now();
  
  // Build the WHERE clause
  const whereClause = `deployment_id = ${deploymentId} AND timestamp >= DATE '${startDate} 00:00:00' AND timestamp <= DATE '${endDate} 23:59:59' AND label NOT IN ('person', 'people')`;
  
  // Build the query URL
  const params = new URLSearchParams({
    where: whereClause,
    returnCountOnly: 'true',
    f: 'json'
  });
  
  const queryUrl = `${BASE_URL}/query?${params}`;
  
  console.log(`📡 Query URL:\n${queryUrl}\n`);
  
  try {
    const response = await fetch(queryUrl);
    const endTime = Date.now();
    const elapsed = endTime - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = JSON.stringify(data);
    const responseSize = responseText.length;
    
    console.log(`\n📊 RESPONSE:`);
    console.log(`═══════════════════════════════════════════════`);
    console.log(JSON.stringify(data, null, 2));
    console.log(`═══════════════════════════════════════════════\n`);
    
    // Analyze the response
    console.log(`📈 ANALYSIS:`);
    console.log(`─────────────────────────────────────────────`);
    
    if (data.count !== undefined) {
      console.log(`✅ Count field found: ${data.count}`);
      console.log(`   This represents ${data.count} total database rows`);
      console.log(`   ⚠️  Includes duplicates (multiple labels per image)`);
      
      // Estimate unique images (assuming avg 2.3 labels per image)
      const estimatedUnique = Math.round(data.count / 2.3);
      console.log(`   📊 Estimated unique images: ~${estimatedUnique} (count / 2.3)`);
    } else {
      console.log(`❌ No count field in response`);
      console.log(`   Response structure: ${Object.keys(data).join(', ')}`);
    }
    
    console.log(`\n⏱️  Response Time: ${elapsed}ms`);
    console.log(`📦 Response Size: ${responseSize} bytes`);
    
    if (responseSize < 100) {
      console.log(`   ✅ Very small response! Perfect for fast counting.`);
    } else {
      console.log(`   ⚠️  Response larger than expected for returnCountOnly`);
    }
    
    console.log(`\n🎯 CONCLUSION:`);
    console.log(`─────────────────────────────────────────────`);
    
    if (data.count !== undefined && responseSize < 100) {
      console.log(`✅ SUCCESS! returnCountOnly works as expected.`);
      console.log(`   - Returns a simple count`);
      console.log(`   - Response is tiny (~${responseSize} bytes)`);
      console.log(`   - Very fast (${elapsed}ms)`);
      console.log(`\n💡 NEXT STEP:`);
      console.log(`   Create a deduplicated table where each image is unique.`);
      console.log(`   Then returnCountOnly will give ACCURATE unique counts!`);
    } else {
      console.log(`⚠️  Unexpected response format or size.`);
      console.log(`   Review the response above.`);
    }
    
    console.log(`\n`);
    
  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the test
testSimpleCount();

