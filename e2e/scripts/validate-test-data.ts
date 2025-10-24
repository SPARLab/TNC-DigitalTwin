/**
 * Validation script to ensure test data is consistent with app constants
 * 
 * Checks:
 * 1. All categories in test data exist in DATA_CATEGORIES (from app)
 * 2. Reports any mismatches or typos
 * 
 * Run: npm run validate:test-data (or: npx ts-node e2e/scripts/validate-test-data.ts)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DATA_CATEGORIES } from '../../src/utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LayerConfig {
  id: string;
  title: string;
  categories: string[];
}

interface TestData {
  layers: LayerConfig[];
}

function validateTestData() {
  console.log('🔍 Validating test data against app constants...\n');
  
  // Load test data
  const testDataPath = path.join(__dirname, '../test-data/all-arcgis-layers.json');
  const testData: TestData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
  
  // Track issues
  const issues: Array<{ layerId: string; layerTitle: string; invalidCategory: string }> = [];
  const uniqueCategories = new Set<string>();
  
  // Validate each layer's categories
  for (const layer of testData.layers) {
    for (const category of layer.categories) {
      uniqueCategories.add(category);
      
      // Skip "Uncategorized" as it's a special case
      if (category === 'Uncategorized') continue;
      
      // Check if category exists in DATA_CATEGORIES
      if (!DATA_CATEGORIES.includes(category as any)) {
        issues.push({
          layerId: layer.id,
          layerTitle: layer.title,
          invalidCategory: category
        });
      }
    }
  }
  
  // Report results
  console.log(`📊 Summary:`);
  console.log(`   Total layers: ${testData.layers.length}`);
  console.log(`   Unique categories in test data: ${uniqueCategories.size}`);
  console.log(`   Valid categories in app: ${DATA_CATEGORIES.length}\n`);
  
  if (issues.length === 0) {
    console.log('✅ All test data categories are valid!\n');
    console.log('Valid categories:');
    DATA_CATEGORIES.forEach((cat, i) => {
      console.log(`   ${i + 1}. "${cat}"`);
    });
    return true;
  } else {
    console.log(`❌ Found ${issues.length} invalid categories:\n`);
    
    // Group by invalid category
    const grouped = issues.reduce((acc, issue) => {
      if (!acc[issue.invalidCategory]) {
        acc[issue.invalidCategory] = [];
      }
      acc[issue.invalidCategory].push(`${issue.layerTitle} (${issue.layerId})`);
      return acc;
    }, {} as Record<string, string[]>);
    
    for (const [category, layers] of Object.entries(grouped)) {
      console.log(`  ❌ Invalid category: "${category}"`);
      console.log(`     Used by ${layers.length} layer(s):`);
      layers.forEach(layer => console.log(`       - ${layer}`));
      console.log();
    }
    
    console.log('Valid categories are:');
    DATA_CATEGORIES.forEach((cat, i) => {
      console.log(`   ${i + 1}. "${cat}"`);
    });
    
    return false;
  }
}

// Run validation
const isValid = validateTestData();
process.exit(isValid ? 0 : 1);

