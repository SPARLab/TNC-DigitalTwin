/**
 * Script to verify the exact count of Animl observations for the cart query
 * Run with: node check-animl-cart-query.js
 */

const BASE_URL = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query';

// The exact query from the cart export logs
const whereClause = "timestamp >= DATE '2024-11-06 00:00:00' AND timestamp <= DATE '2025-11-06 23:59:59' AND deployment_id IN (59) AND label IN ('animal','mule deer','coyote','bobcat')";

async function getCount() {
  const params = new URLSearchParams({
    where: whereClause,
    returnCountOnly: 'true',
    f: 'json'
  });
  
  const url = `${BASE_URL}?${params}`;
  console.log('🔍 Fetching count...');
  console.log('URL:', url);
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('\n📊 COUNT RESULT:');
  console.log(JSON.stringify(data, null, 2));
  return data.count;
}

async function getRecords() {
  const params = new URLSearchParams({
    where: whereClause,
    outFields: 'id,animl_image_id,deployment_id,timestamp,label',
    returnGeometry: 'false',
    orderByFields: 'timestamp DESC',
    f: 'json'
  });
  
  const url = `${BASE_URL}?${params}`;
  console.log('\n🔍 Fetching records...');
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('\n📊 RECORDS RESULT:');
  console.log(`Total features: ${data.features?.length || 0}`);
  
  if (data.features && data.features.length > 0) {
    // Analyze labels
    const labelCounts = new Map();
    const imageMap = new Map();
    
    data.features.forEach(feature => {
      const attrs = feature.attributes;
      const label = attrs.label;
      const imageId = attrs.animl_image_id;
      
      // Count labels
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
      
      // Track images and their labels
      if (!imageMap.has(imageId)) {
        imageMap.set(imageId, []);
      }
      imageMap.get(imageId).push(label);
    });
    
    console.log('\n📋 Label Distribution:');
    Array.from(labelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([label, count]) => {
        console.log(`  ${label}: ${count} records`);
      });
    
    console.log('\n🖼️  Unique Images: ' + imageMap.size);
    
    // Check for images with multiple labels
    const multiLabelImages = Array.from(imageMap.entries())
      .filter(([_, labels]) => labels.length > 1);
    
    if (multiLabelImages.length > 0) {
      console.log(`\n⚠️  Images with Multiple Labels: ${multiLabelImages.length}`);
      console.log('Examples:');
      multiLabelImages.slice(0, 5).forEach(([imageId, labels]) => {
        console.log(`  ${imageId}: [${labels.join(', ')}]`);
      });
    }
    
    // Show first few records
    console.log('\n📄 First 5 Records:');
    data.features.slice(0, 5).forEach((feature, idx) => {
      const attrs = feature.attributes;
      console.log(`  ${idx + 1}. ID: ${attrs.id}, Image: ${attrs.animl_image_id}, Label: ${attrs.label}, Time: ${new Date(attrs.timestamp).toISOString()}`);
    });
  }
  
  return data.features?.length || 0;
}

async function main() {
  console.log('🚀 Checking Animl Cart Query');
  console.log('================================\n');
  console.log('Filters:');
  console.log('  Date Range: 2024-11-06 to 2025-11-06');
  console.log('  Deployment: 59');
  console.log('  Labels: animal, mule deer, coyote, bobcat');
  console.log('================================\n');
  
  try {
    const count = await getCount();
    const recordCount = await getRecords();
    
    console.log('\n================================');
    console.log('📊 SUMMARY:');
    console.log(`  Count API: ${count}`);
    console.log(`  Actual Records: ${recordCount}`);
    console.log(`  Cart Estimate: 38`);
    console.log(`  Difference: ${recordCount - 38}`);
    console.log('================================');
    
    if (recordCount !== 38) {
      console.log('\n💡 EXPLANATION:');
      console.log('The mismatch likely occurs because:');
      console.log('1. Some images have multiple tags (e.g., "animal" + "mule deer")');
      console.log('2. Each tag creates a separate row in the database');
      console.log('3. When adding to cart, the app counted observations in memory (38)');
      console.log('4. When querying the database with those labels, we get ALL rows with those labels');
      console.log('\nCheck the "Images with Multiple Labels" section above to confirm.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

