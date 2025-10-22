import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test Validation Script
 * Compares latest checkpoint results against expected results
 * Calculates true positives, true negatives, false positives, false negatives
 */

interface ExpectedResult {
  layerId: string;
  layerTitle: string;
  type: string;
  expectedResults: {
    showsInCategories: boolean | null;
    layersLoad: boolean | null;
    downloadLinkWorks: boolean | null;
    tooltipsPopUp: boolean | null;
    legendExists: boolean | null;
    legendLabelsDescriptive: boolean | null;
    legendFiltersWork: boolean | null;
  };
}

interface CheckpointRow {
  timestamp: string;
  layerId: string;
  layerTitle: string;
  type: string;
  test1: string;
  test2: string;
  test3: string;
  test4: string;
  test5: string;
  test6: string;
  test7: string;
  test8: string;
  notes: string;
}

/**
 * Parse CSV row
 */
function parseCSVRow(line: string): string[] {
  const cleanLine = line.replace(/\r/g, '');
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < cleanLine.length; i++) {
    const char = cleanLine[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  
  return values;
}

/**
 * Read latest checkpoint from validation history CSV and load JSON details
 */
function readLatestCheckpoint(csvPath: string): Map<string, CheckpointRow> {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Checkpoint CSV not found: ${csvPath}`);
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    throw new Error('No checkpoint data found in CSV');
  }
  
  // Get the last line (latest checkpoint)
  const lastLine = lines[lines.length - 1];
  const values = parseCSVRow(lastLine);
  
  // Extract the JSON filename from the last column
  const jsonFilePath = values[values.length - 1];
  
  // Load the JSON checkpoint file
  const checkpointDir = path.join(__dirname, '../checkpoints');
  const fullJsonPath = path.join(checkpointDir, jsonFilePath);
  
  if (!fs.existsSync(fullJsonPath)) {
    throw new Error(`Checkpoint JSON not found: ${fullJsonPath}`);
  }
  
  const jsonContent = fs.readFileSync(fullJsonPath, 'utf-8');
  const checkpointData = JSON.parse(jsonContent);
  
  // Convert JSON results to Map format
  const resultsMap = new Map<string, CheckpointRow>();
  
  for (const result of checkpointData.results) {
    resultsMap.set(result.layerId, {
      timestamp: checkpointData.timestamp,
      layerId: result.layerId,
      layerTitle: result.layerTitle,
      type: result.layerType,
      test1: result.test_1_shows_in_categories,
      test2: result.test_2_layers_load,
      test3: result.test_3_download_works,
      test4: result.test_4_description_matches,
      test5: result.test_5_tooltips_popup,
      test6: result.test_6_legend_exists,
      test7: result.test_7_legend_labels_descriptive,
      test8: result.test_8_filters_work,
      notes: result.notes || '',
    });
  }
  
  console.log(`📅 Latest checkpoint: ${checkpointData.timestamp}`);
  console.log(`📊 Found ${resultsMap.size} layer results`);
  
  return resultsMap;
}

/**
 * Load expected results from JSON
 */
function loadExpectedResults(jsonPath: string): Map<string, ExpectedResult> {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(content);
  
  const resultsMap = new Map<string, ExpectedResult>();
  
  for (const layer of data.layers) {
    resultsMap.set(layer.id, {
      layerId: layer.id,
      layerTitle: layer.title,
      type: layer.type,
      expectedResults: layer.expectedResults,
    });
  }
  
  return resultsMap;
}

/**
 * Compare actual vs expected result
 */
function compareResult(actual: string, expected: boolean | null): {
  match: boolean;
  category: 'TP' | 'TN' | 'FP' | 'FN' | 'SKIP';
} {
  if (expected === null || actual === 'SKIP') {
    return { match: true, category: 'SKIP' };
  }
  
  const actualPassed = actual === 'PASS';
  
  if (expected && actualPassed) {
    return { match: true, category: 'TP' }; // True Positive
  } else if (!expected && !actualPassed) {
    return { match: true, category: 'TN' }; // True Negative
  } else if (!expected && actualPassed) {
    return { match: false, category: 'FP' }; // False Positive (TEST BUG)
  } else {
    return { match: false, category: 'FN' }; // False Negative (TEST or APP BUG)
  }
}

/**
 * Main validation logic
 */
function main() {
  const checkpointCSV = path.join(__dirname, '../checkpoints/test-validation-history.csv');
  const expectedJSON = path.join(__dirname, '../test-data/all-arcgis-layers.json');
  
  console.log('\n═══════════════════════════════════════════');
  console.log('   TEST VALIDATION REPORT');
  console.log('═══════════════════════════════════════════\n');
  
  // Load data
  const actualResults = readLatestCheckpoint(checkpointCSV);
  const expectedResults = loadExpectedResults(expectedJSON);
  
  // Calculate metrics
  let totalTests = 0;
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let skippedTests = 0;
  
  const issues: Array<{layer: string; test: string; category: string; details: string}> = [];
  
  for (const [layerId, actual] of actualResults.entries()) {
    const expected = expectedResults.get(layerId);
    if (!expected) {
      console.warn(`⚠️  No expected results for layer: ${layerId}`);
      continue;
    }
    
    // Compare each test
    const tests = [
      { name: 'Test 1 (Shows in Categories)', actual: actual.test1, expected: expected.expectedResults.showsInCategories },
      { name: 'Test 2 (Layers Load)', actual: actual.test2, expected: expected.expectedResults.layersLoad },
      { name: 'Test 3 (Download Works)', actual: actual.test3, expected: expected.expectedResults.downloadLinkWorks },
      { name: 'Test 5 (Tooltips)', actual: actual.test5, expected: expected.expectedResults.tooltipsPopUp },
      { name: 'Test 6 (Legend Exists)', actual: actual.test6, expected: expected.expectedResults.legendExists },
      { name: 'Test 7 (Legend Labels)', actual: actual.test7, expected: expected.expectedResults.legendLabelsDescriptive },
      { name: 'Test 8 (Legend Filters)', actual: actual.test8, expected: expected.expectedResults.legendFiltersWork },
    ];
    
    for (const test of tests) {
      const comparison = compareResult(test.actual, test.expected);
      
      if (comparison.category === 'SKIP') {
        skippedTests++;
        continue;
      }
      
      totalTests++;
      
      if (comparison.category === 'TP') {
        truePositives++;
      } else if (comparison.category === 'TN') {
        trueNegatives++;
      } else if (comparison.category === 'FP') {
        falsePositives++;
        issues.push({
          layer: actual.layerTitle,
          test: test.name,
          category: 'FALSE POSITIVE',
          details: `Expected FAIL, got PASS (test may be too lenient)`
        });
      } else if (comparison.category === 'FN') {
        falseNegatives++;
        issues.push({
          layer: actual.layerTitle,
          test: test.name,
          category: 'FALSE NEGATIVE',
          details: `Expected PASS, got FAIL (test or app bug)`
        });
      }
    }
  }
  
  const accuracy = totalTests > 0 ? ((truePositives + trueNegatives) / totalTests) * 100 : 0;
  
  // Print summary
  console.log(`Total Tests: ${totalTests} (${skippedTests} skipped)`);
  console.log(`True Positives: ${truePositives} (${((truePositives / totalTests) * 100).toFixed(1)}%)`);
  console.log(`True Negatives: ${trueNegatives} (${((trueNegatives / totalTests) * 100).toFixed(1)}%)`);
  console.log(`False Positives: ${falsePositives} (${((falsePositives / totalTests) * 100).toFixed(1)}%) ⚠️ TESTS NEED FIXING`);
  console.log(`False Negatives: ${falseNegatives} (${((falseNegatives / totalTests) * 100).toFixed(1)}%) ⚠️ TESTS NEED FIXING`);
  console.log(`\nOverall Accuracy: ${accuracy.toFixed(1)}%`);
  
  // Print issues
  if (issues.length > 0) {
    console.log('\n═══════════════════════════════════════════');
    console.log('   TESTS NEEDING REFINEMENT');
    console.log('═══════════════════════════════════════════\n');
    
    for (const issue of issues) {
      console.log(`❌ ${issue.category}`);
      console.log(`   Layer: ${issue.layer}`);
      console.log(`   Test: ${issue.test}`);
      console.log(`   Issue: ${issue.details}\n`);
    }
  } else {
    console.log('\n✅ All tests match expected results!');
  }
  
  console.log('═══════════════════════════════════════════\n');
}

main();

